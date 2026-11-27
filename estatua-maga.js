// Ateliê Arcano — estátua da maga do chafariz, gerada a partir do personagem jogável (Xbot.glb, rig Mixamo):
//  1. pose de levitação osso a osso (cada segmento "aponta" para uma direção no mundo; frente +z, esquerda dela +x);
//  2. o corpo é "assado" na pose (posição de cada vértice pela pele), sem as partes que ficam cobertas;
//  3. roupas: as peças presas ao corpo são modeladas na pose de repouso (T) e levadas à pose pela mesma pele
//     (mistura dos ossos por altura): corpete com busto, capuz, colar, diadema; as que caem com a gravidade são
//     feitas já no mundo: saia (colunas de tecido que descem desviando das pernas, com fenda para a perna erguida),
//     capa, mangas boca-de-sino e mechas de cabelo;
//  4. espiral de mármore que sustenta a estátua pela ponta do pé, e o ponto da orbe acima da mão direita.
// Devolve {grupo, info}: malhas 'marmore', 'ouro', 'gema' (prontas para exportar/usar) + marcador 'orbe'.
const XBOT = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Xbot.glb';

export async function gerar(T, GL, BGU, opts = {}) {
 const pausa = opts.pausa || (() => new Promise(r => setTimeout(r, 0))), tempos = [];
 let t0 = performance.now(); const etapa = async n => { tempos.push(n + ' ' + Math.round(performance.now() - t0)); await pausa(); t0 = performance.now(); };
 const m = opts.cena || (await new GL().loadAsync(XBOT)).scene;
 await etapa('modelo');
 m.updateMatrixWorld(true);
 const B = {}; m.traverse(o => { if (o.isBone) B[o.name.replace('mixamorig', '')] = o; });
 const peles = []; m.traverse(o => { if (o.isSkinnedMesh) peles.push(o); });
 const X = new T.Vector3(1, 0, 0), Y = new T.Vector3(0, 1, 0), Z = new T.Vector3(0, 0, 1);
 const V = (x, y, z) => new T.Vector3(x, y, z);
 const wp = n => B[n].getWorldPosition(new T.Vector3());
 const atual = () => m.updateMatrixWorld(true);
 const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
 const cmp = (a, i, c) => c === 0 ? a.getX(i) : c === 1 ? a.getY(i) : c === 2 ? a.getZ(i) : a.getW(i);
 // ---------- repouso: ossos, matrizes e vértices ----------
 const rest = {}, restM = {}; for (const k in B) { rest[k] = wp(k); restM[k] = B[k].matrixWorld.clone(); }
 const pele0 = peles.map(sk => { const g = sk.geometry, p = g.attributes.position, n = p.count, R = new Float32Array(n * 3), v = new T.Vector3();
  for (let i = 0; i < n; i++) { v.fromBufferAttribute(p, i); sk.applyBoneTransform(i, v); v.applyMatrix4(sk.matrixWorld); R[i * 3] = v.x; R[i * 3 + 1] = v.y; R[i * 3 + 2] = v.z; }
  const si = g.attributes.skinIndex, sw = g.attributes.skinWeight, nomes = sk.skeleton.bones.map(b => b.name.replace('mixamorig', '')), dom = new Array(n);
  for (let i = 0; i < n; i++) { let best = 0, bw = -1; for (let c = 0; c < 4; c++) { const w = cmp(sw, i, c); if (w > bw) { bw = w; best = cmp(si, i, c); } } dom[i] = nomes[best]; }
  return { sk, R, dom }; });
 await etapa('repouso');
 // ---------- pose ----------
 function aplicaMundo(b, q) { const wq = b.getWorldQuaternion(new T.Quaternion()); const nw = q.clone().multiply(wq); const pq = b.parent.getWorldQuaternion(new T.Quaternion()); b.quaternion.copy(pq.invert().multiply(nw)); atual(); }
 function aponta(n, filho, dir) { atual(); const cur = wp(filho).sub(wp(n)).normalize(); aplicaMundo(B[n], new T.Quaternion().setFromUnitVectors(cur, dir.clone().normalize())); }
 function gira(n, eixo, graus) { aplicaMundo(B[n], new T.Quaternion().setFromAxisAngle(eixo.clone().normalize(), graus * Math.PI / 180)); }
 const normalPalma = lado => { atual(); const h = wp(lado + 'Hand'), d = wp(lado + 'HandMiddle1').sub(h).normalize(), n = new T.Vector3().crossVectors(wp(lado + 'HandIndex1').sub(wp(lado + 'HandPinky1')), d).normalize(); return lado === 'Left' ? n.negate() : n; };
 function orientaPalma(lado, alvo) { const h = wp(lado + 'Hand'), d = wp(lado + 'HandMiddle1').sub(h).normalize(), n = normalPalma(lado);
  const a = alvo.clone().normalize(); a.sub(d.clone().multiplyScalar(a.dot(d))).normalize(); n.sub(d.clone().multiplyScalar(n.dot(d))).normalize();
  aplicaMundo(B[lado + 'Hand'], new T.Quaternion().setFromAxisAngle(d, Math.atan2(new T.Vector3().crossVectors(n, a).dot(d), n.dot(a)))); }
 function dobraDedos(lado, graus) { const n = normalPalma(lado);
  for (const [f, g] of Object.entries(graus)) for (let k = 1; k <= 3; k++) { const b = lado + 'Hand' + f + k, c = lado + 'Hand' + f + (k + 1); if (!B[b] || !B[c]) continue;
   const dir = wp(c).sub(wp(b)).normalize(), eixo = new T.Vector3().crossVectors(dir, n); if (eixo.lengthSq() < 1e-6) continue; aplicaMundo(B[b], new T.Quaternion().setFromAxisAngle(eixo.normalize(), g * (k === 1 ? .7 : 1) * Math.PI / 180)); } }
 const P = Object.assign({
  quadril: [-4, 8, 0], coluna: [-3, -6, -3], cabeca: [-18, -16, 8],
  bracoD: [-0.42, 0.8, 0.3], antebD: [-0.08, 0.96, 0.25], maoD: [-0.05, 0.3, 0.95], palmaD: [0, 1, 0],
  bracoE: [0.86, -0.38, 0.22], antebE: [0.82, -0.2, 0.52], maoE: [0.7, -0.45, 0.55], palmaE: [0.2, -1, 0.5],
  coxaE: [0.05, -1, 0.04], canelaE: [0.02, -1, -0.04], peE: [0.02, -0.8, 0.6],
  coxaD: [-0.1, -0.78, 0.6], canelaD: [-0.03, -0.95, -0.3], peD: [-0.02, -0.9, -0.42],
  dedosD: { Index: 12, Middle: 14, Ring: 17, Pinky: 20, Thumb: 8 }, dedosE: { Index: 6, Middle: 16, Ring: 24, Pinky: 30, Thumb: 6 }
 }, opts.pose || {});
 gira('Hips', X, P.quadril[0]); gira('Hips', Y, P.quadril[1]); gira('Hips', Z, P.quadril[2]);
 for (const n of ['Spine', 'Spine1', 'Spine2']) gira(n, X, P.coluna[0]);
 gira('Spine1', Y, P.coluna[1]); gira('Spine2', Z, P.coluna[2]);
 gira('Neck', X, P.cabeca[0] * .4); gira('Head', X, P.cabeca[0] * .6); gira('Head', Y, P.cabeca[1]); gira('Head', Z, P.cabeca[2]);
 aponta('RightArm', 'RightForeArm', V(...P.bracoD)); aponta('RightForeArm', 'RightHand', V(...P.antebD)); aponta('RightHand', 'RightHandMiddle1', V(...P.maoD)); orientaPalma('Right', V(...P.palmaD));
 aponta('LeftArm', 'LeftForeArm', V(...P.bracoE)); aponta('LeftForeArm', 'LeftHand', V(...P.antebE)); aponta('LeftHand', 'LeftHandMiddle1', V(...P.maoE)); orientaPalma('Left', V(...P.palmaE));
 aponta('LeftUpLeg', 'LeftLeg', V(...P.coxaE)); aponta('LeftLeg', 'LeftFoot', V(...P.canelaE)); aponta('LeftFoot', 'LeftToeBase', V(...P.peE));
 aponta('RightUpLeg', 'RightLeg', V(...P.coxaD)); aponta('RightLeg', 'RightFoot', V(...P.canelaD)); aponta('RightFoot', 'RightToeBase', V(...P.peD));
 dobraDedos('Right', P.dedosD); dobraDedos('Left', P.dedosE); atual();
 await etapa('pose');
 // ---------- pele: leva pontos do repouso para a pose ----------
 const D = {}; for (const k in B) D[k] = B[k].matrixWorld.clone().multiply(restM[k].clone().invert());
 const pele = (p, pesos) => { const o = new T.Vector3(), t = new T.Vector3(); for (const [k, w] of pesos) if (w > 0) { t.copy(p).applyMatrix4(D[k]); o.addScaledVector(t, w); } return o; };
 const cadeia = (y, nos) => { if (y <= nos[0][1]) return [[nos[0][0], 1]];
  for (let i = 0; i < nos.length - 1; i++) if (y <= nos[i + 1][1]) { const s = ss(nos[i][1], nos[i + 1][1], y); return [[nos[i][0], 1 - s], [nos[i + 1][0], s]]; }
  return [[nos[nos.length - 1][0], 1]]; };
 const TRONCO = [['Hips', rest.Hips.y], ['Spine', rest.Spine.y], ['Spine1', rest.Spine1.y], ['Spine2', rest.Spine2.y]];
 const PESCOCO = [['Spine2', 1.46], ['Neck', 1.53], ['Head', 1.6]];
 // corpo na pose
 const corpo = pele0.map(({ sk, R, dom }) => { const p = sk.geometry.attributes.position, n = p.count, A = new Float32Array(n * 3), v = new T.Vector3();
  for (let i = 0; i < n; i++) { v.fromBufferAttribute(p, i); sk.applyBoneTransform(i, v); v.applyMatrix4(sk.matrixWorld); A[i * 3] = v.x; A[i * 3 + 1] = v.y; A[i * 3 + 2] = v.z; }
  return { g: sk.geometry, A, R, dom }; });
 // cabeça 12% menor (proporção mais feminina) e pescoço afinando para cima
 const KC = opts.cabeca || .88, Hp0 = wp('Head'), Np0 = wp('Neck'), CABECA = new Set(['Head', 'HeadTop_End', 'LeftEye', 'RightEye']);
 for (const c of corpo) for (let i = 0; i < c.dom.length; i++) { const d = c.dom[i]; if (!CABECA.has(d) && d !== 'Neck') continue; const p = V(c.A[i * 3], c.A[i * 3 + 1], c.A[i * 3 + 2]);
  if (d === 'Neck') { const ab = Hp0.clone().sub(Np0), t = Math.max(0, Math.min(1, p.clone().sub(Np0).dot(ab) / ab.lengthSq())), q = Np0.clone().addScaledVector(ab, t); p.sub(q).multiplyScalar(1 - .14 * ss(0, .5, t)).add(q); }
  else p.sub(Hp0).multiplyScalar(KC).add(Hp0);
  c.A[i * 3] = p.x; c.A[i * 3 + 1] = p.y; c.A[i * 3 + 2] = p.z; }
 const escCab = (p, w = 1) => w <= 0 ? p : p.clone().lerp(rest.Head.clone().add(p.clone().sub(rest.Head).multiplyScalar(KC)), w);
 // ---------- utilidades de malha ----------
 const geos = { marmore: [], ouro: [], gema: [] };
 const add = (k, g) => { if (!g.index) g = BGU.mergeVertices(g); if (!g.attributes.normal) g.computeVertexNormals(); geos[k].push(g); return g; };
 const grade = (pts, nu, nv, k = 'marmore', soldar = false, inverte = false) => { // pts[(nu+1)*(nv+1)] de Vector3, linha a linha (v)
  const P2 = new Float32Array(pts.length * 3), I = []; pts.forEach((p, i) => { P2[i * 3] = p.x; P2[i * 3 + 1] = p.y; P2[i * 3 + 2] = p.z; });
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + nu + 1; if (inverte) I.push(a, a + 1, b, a + 1, b + 1, b); else I.push(a, b, a + 1, a + 1, b, b + 1); }
  let g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(P2, 3)); g.setIndex(I);
  if (soldar) { g = BGU.mergeVertices(g, 1e-5); } g.computeVertexNormals(); return add(k, g); };
 const tubo = (pts, r0, r1, seg = 8, fechado = false, k = 'ouro') => {
  const c = new T.CatmullRomCurve3(pts, fechado, 'centripetal'), N = Math.max(8, Math.min(pts.length * 3, 160)), fr = c.computeFrenetFrames(N, fechado), Q = [];
  for (let i = 0; i <= N; i++) { const t = i / N, o = c.getPointAt(t), r = r0 + (r1 - r0) * t; for (let j = 0; j <= seg; j++) { const a = j / seg * Math.PI * 2; Q.push(o.clone().addScaledVector(fr.normals[i], Math.cos(a) * r).addScaledVector(fr.binormals[i], Math.sin(a) * r)); } }
  return grade(Q, seg, N, k, false, true); };
 // fita: tubo achatado com a face larga deitada sobre a superfície (N = normal "para fora" em cada ponto)
 const fita = (pts, larg, esp, Nfn, seg = 12, k = 'marmore', sulcos = 0) => {
  const c = new T.CatmullRomCurve3(pts, false, 'centripetal'), N = Math.max(12, pts.length * 5), Q = [];
  for (let i = 0; i <= N; i++) { const t = i / N, o = c.getPointAt(t), tg = c.getTangentAt(t), n0 = Nfn(o, t), W = new T.Vector3().crossVectors(tg, n0).normalize(), Nn = new T.Vector3().crossVectors(W, tg).normalize(), w = larg(t), e = esp(t);
   for (let j = 0; j <= seg; j++) { const a = j / seg * Math.PI * 2, rr = 1 + (sulcos ? .3 * Math.cos(a * sulcos) * Math.abs(Math.sin(a)) : 0); Q.push(o.clone().addScaledVector(W, Math.cos(a) * w).addScaledVector(Nn, Math.sin(a) * e * rr)); } }
  return grade(Q, seg, N, k); };
 await etapa('pele');
 // ---------- corpo (sem o que fica coberto: tronco e coxa de apoio) ----------
 // (as pernas ganham meias lisas por cima; a bola da articulação do pescoço some sob o queixo)
 const coberto = new Set(['Hips', 'Spine', 'Spine1', 'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg'].concat(opts.esconde || []));
 const cobertoJ = new Set(opts.escondeJ || ['Neck']);
 for (const c of corpo) { const ix = c.g.index.array, tri = [], J = /Joints/.test(peles[corpo.indexOf(c)].name), cj = J ? cobertoJ : new Set();
  const fora = i => coberto.has(c.dom[i]) || cj.has(c.dom[i]);
  for (let i = 0; i < ix.length; i += 3) { if (fora(ix[i]) && fora(ix[i + 1]) && fora(ix[i + 2])) continue; tri.push(ix[i], ix[i + 1], ix[i + 2]); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(c.A, 3)); g.setIndex(tri); g.computeVertexNormals(); add('marmore', g); }
 // meias: tubo elíptico liso medido nas pernas em repouso (+5 mm), levado à pose pela coxa/canela/pé
 for (const L of ['Left', 'Right']) { const faixas = new Map();
  for (const c of pele0) for (let i = 0; i < c.dom.length; i++) { const d = c.dom[i]; if (d !== L + 'UpLeg' && d !== L + 'Leg') continue; const k = Math.round(c.R[i * 3 + 1] * 100), q = faixas.get(k) || { n: 0, x: 0, z: 0, pts: [] }; q.n++; q.x += c.R[i * 3]; q.z += c.R[i * 3 + 2]; q.pts.push(c.R[i * 3], c.R[i * 3 + 2]); faixas.set(k, q); }
  const ks = [...faixas.keys()].sort((a, b) => a - b), med = new Map();
  for (const k of ks) { const q = faixas.get(k), cx = q.x / q.n, cz = q.z / q.n; let ex = 0, ez = 0; for (let i = 0; i < q.pts.length; i += 2) { ex = Math.max(ex, Math.abs(q.pts[i] - cx)); ez = Math.max(ez, Math.abs(q.pts[i + 1] - cz)); } med.set(k, [cx, cz, ex, ez]); }
  const em = y => { const k0 = Math.round(y * 100); let s = [0, 0, 0, 0], n = 0, mx = [0, 0]; for (let d = -3; d <= 3; d++) { const q = med.get(k0 + d); if (!q) continue; s = s.map((v, i) => v + q[i]); n++; if (Math.abs(d) <= 1) { mx[0] = Math.max(mx[0], q[2]); mx[1] = Math.max(mx[1], q[3]); } } if (!n) return null; s = s.map(v => v / n); s[2] = Math.max(s[2], mx[0]); s[3] = Math.max(s[3], mx[1]); return s; };
  const CAD = [[L + 'Foot', .06], [L + 'Leg', .12], [L + 'Leg', .49], [L + 'UpLeg', .57]];
  const y0 = (ks[0] + 2) / 100, y1 = Math.min(.95, (ks[ks.length - 1] - 2) / 100), NR = 56, NC = 22, Q = [];
  for (let j = 0; j <= NR; j++) { const y = y0 + (y1 - y0) * j / NR, q = em(y) || [L === 'Left' ? .082 : -.082, 0, .05, .05];
   for (let i = 0; i <= NC; i++) { const a = i / NC * Math.PI * 2, s = Math.sin(a), c = Math.cos(a), e = 2 / 2.3; const p = V(q[0] + (q[2] + .005) * Math.sign(s) * Math.pow(Math.abs(s), e), y, q[1] + (q[3] + .005) * Math.sign(c) * Math.pow(Math.abs(c), e)); Q.push(pele(p, cadeia(y, CAD))); } }
  grade(Q, NC, NR, 'marmore'); }
 // obstáculos (corpo na pose) para o tecido que cai
 const obst = []; for (const c of corpo) for (let i = 0; i < c.dom.length; i += 2) obst.push({ p: V(c.A[i * 3], c.A[i * 3 + 1], c.A[i * 3 + 2]), o: c.dom[i] });
 await etapa('corpo');
 // ---------- corpete (repouso → pose): silhueta feminina, busto, decote em V ----------
 const cortes = new Map(); for (const c of pele0) for (let i = 0; i < c.dom.length; i++) { if (!/Hips|Spine/.test(c.dom[i])) continue;
  const y = c.R[i * 3 + 1], k = Math.round(y * 100), x = Math.abs(c.R[i * 3]), z = c.R[i * 3 + 2], q = cortes.get(k) || { x: 0, zf: 0, zb: 0 };
  q.x = Math.max(q.x, x); q.zf = Math.max(q.zf, z); q.zb = Math.max(q.zb, -z); cortes.set(k, q); }
 const PERFIL = [[1.150, .118, .118, .110], [1.175, .114, .118, .108], [1.21, .114, .126, .112], [1.25, .124, .150, .120], [1.29, .138, .158, .124],
  [1.33, .150, .150, .130], [1.37, .160, .140, .140], [1.41, .164, .122, .148], [1.45, .150, .100, .150]];
 const perfil = y => { let i = 0; while (i < PERFIL.length - 2 && y > PERFIL[i + 1][0]) i++; const a = PERFIL[i], b = PERFIL[i + 1], t = ss(a[0], b[0], y);
  const r = [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t];
  for (let d = -1; d <= 1; d++) { const q = cortes.get(Math.round(y * 100) + d); if (q) { r[0] = Math.max(r[0], q.x + .012); r[1] = Math.max(r[1], q.zf + .012); r[2] = Math.max(r[2], q.zb + .012); } }
  return r; };
 const YC = 1.165, topoDecote = th => 1.383 + .064 * Math.pow(Math.min(1, Math.abs(Math.atan2(Math.sin(th), Math.cos(th))) / 1.15), .8);
 const pontoCorpete = (th, y, folga = 0) => { const [a, zf, zb] = perfil(y), s = Math.sin(th), c = Math.cos(th), e = 2 / 2.4;
  const x = (a + folga) * Math.sign(s) * Math.pow(Math.abs(s), e); let z = (c > 0 ? zf : zb) * Math.sign(c) * Math.pow(Math.abs(c), e);
  if (c > 0) { const amp = .044 * Math.exp(-Math.pow((y - 1.302) / (y > 1.302 ? .05 : .034), 2)); z += (amp * (Math.exp(-Math.pow((x - .07) / .05, 2)) + Math.exp(-Math.pow((x + .07) / .05, 2))) + folga) * Math.pow(c, .7); }
  else z -= folga * Math.pow(-c, .7);
  return V(x, y, z); };
 const NT = 64, NVc = 18, corR = [], corP = [];
 for (let j = 0; j <= NVc; j++) for (let i = 0; i <= NT; i++) { const th = i / NT * Math.PI * 2, y = YC + (topoDecote(th) - YC) * j / NVc, p = pontoCorpete(th, y); corR.push(p); corP.push(pele(p, cadeia(p.y, TRONCO))); }
 const corpete = grade(corP, NT, NVc, 'marmore', true, true);
 // decote (friso de ouro) e cordões cruzados na frente
 {const borda = []; for (let i = 0; i <= NT; i++) borda.push(corP[NVc * (NT + 1) + i]); tubo(borda.slice(0, NT), .007, .007, 6, true);
  const cruz = []; for (let k = 0; k <= 7; k++) { const y = YC + .02 + k * .027; for (const s of [-1, 1]) { const th = s * .2, p = pontoCorpete(th, y, .006); cruz.push(pele(p, cadeia(p.y, TRONCO))); } }
  for (let k = 0; k < 7; k++) { tubo([cruz[k * 2], cruz[k * 2 + 3]], .0045, .0045, 5, false, 'marmore'); tubo([cruz[k * 2 + 1], cruz[k * 2 + 2]], .0045, .0045, 5, false, 'marmore'); }
  for (let k = 0; k <= 7; k++) for (const s of [0, 1]) { const g = new T.TorusGeometry(.007, .0025, 5, 10), q = cruz[k * 2 + s]; g.translate(q.x, q.y, q.z); add('ouro', g); } }
 // cintura na pose (anel de baixo do corpete) e eixos horizontais da saia
 const anel = []; for (let i = 0; i < NT; i++) anel.push(corP[i]);
 const Cw = anel.reduce((s, p) => s.add(p), V(0, 0, 0)).multiplyScalar(1 / NT);
 const F = Z.clone().applyQuaternion(B.Hips.getWorldQuaternion(new T.Quaternion()).multiply(new T.Quaternion().setFromRotationMatrix(restM.Hips).invert())); F.y = 0; F.normalize();
 const E = new T.Vector3().crossVectors(Y, F).normalize();
 const ang = p => { const d = p.clone().sub(Cw); return Math.atan2(d.dot(E), d.dot(F)); }, rad = p => { const d = p.clone().sub(Cw); return Math.hypot(d.dot(E), d.dot(F)); };
 // cinto com fivela
 {const c = anel.map((p, i) => pele(pontoCorpete(i / NT * Math.PI * 2, YC + .012, .008), cadeia(YC, TRONCO)));
  tubo(c, .016, .016, 8, true); const fv = pele(pontoCorpete(0, YC + .012, .022), cadeia(YC, TRONCO));
  const g = new T.TorusGeometry(.03, .008, 6, 18); g.applyQuaternion(new T.Quaternion().setFromUnitVectors(Z, F)); g.translate(fv.x, fv.y, fv.z); add('ouro', g);
  const ge = new T.OctahedronGeometry(.02, 0); ge.scale(1, 1.3, .7); ge.translate(fv.x, fv.y, fv.z); add('gema', ge); }
 await etapa('corpete');
 // ---------- saia: colunas de tecido que caem da cintura desviando do quadril e das pernas ----------
 const pTornoE = wp('LeftFoot'), joelhoD = wp('RightLeg'), quadD = wp('RightUpLeg');
 const yBarra = pTornoE.y + .05, NA = 120, dY = .015, LMAX = Cw.y - yBarra + .3, NY = Math.ceil(LMAX / dY) + 2;
 const folga = Array.from({ length: NY }, () => new Float32Array(NA));
 const pernas = /Hips|UpLeg|Leg|Foot|Toe/;
 for (const q of obst) { if (!pernas.test(q.o) || q.p.y > Cw.y - .01) continue; const iy = Math.floor((Cw.y - q.p.y) / dY); if (iy < 0 || iy >= NY) continue;
  const a = ang(q.p), r = rad(q.p) + .024, ia = Math.floor((a + Math.PI) / (Math.PI * 2) * NA);
  for (let d = -1; d <= 1; d++) { const k = (ia + d + NA) % NA; if (folga[iy][k] < r) folga[iy][k] = r; } }
 const folgaEm = (a, y) => { const iy = Math.max(0, Math.min(NY - 1, Math.floor((Cw.y - y) / dY))), f = ((a + Math.PI) / (Math.PI * 2)) * NA, i0 = Math.floor(f);
  return Math.max(folga[iy][((i0 % NA) + NA) % NA], folga[iy][(((i0 + 1) % NA) + NA) % NA]); };
 const aS = ang(joelhoD), ySlit = quadD.y - .1, yJo = joelhoD.y;
 const meiaFenda = y => y >= ySlit ? 0 : .58 * ss(ySlit, yJo, y) + .1 * ss(yJo, yBarra, y);
 const anelEm = a => { const f = (((a - 0) / (Math.PI * 2)) % 1 + 1) % 1 * NT, i0 = Math.floor(f), t = f - i0; return corP[i0 % NT].clone().lerp(corP[(i0 + 1) % NT], t); };
 const NU = 112, NV = 46, saia = [], raios = new Float32Array(NU + 1);
 const comprimento = a => (Cw.y - yBarra) + .16 * (1 - Math.cos(a)) / 2;
 const colunaA = (u, y) => { const h = meiaFenda(y); return aS + h + u * (Math.PI * 2 - 2 * h); };
 for (let j = 0; j <= NV; j++) { const v = j / NV;
  for (let i = 0; i <= NU; i++) { const u = i / NU, a0 = colunaA(u, Cw.y), y = Cw.y - comprimento(a0) * v, a = colunaA(u, y), costas = (1 - Math.cos(a)) / 2;
   const topo = anelEm(a); if (j === 0) raios[i] = rad(topo);
   else raios[i] = Math.max(raios[i] + .1 * comprimento(a0) / NV, folgaEm(a, y));
   const dobra = 1 + .07 * ss(.05, .6, v) * (.5 + .5 * Math.sin(a * 9 + .5)) + .025 * v * (.5 + .5 * Math.sin(a * 17 + 1.3));
   const r = raios[i] * dobra;
   let p = Cw.clone().addScaledVector(F, Math.cos(a) * r).addScaledVector(E, Math.sin(a) * r); p.y = y;
   p.addScaledVector(F, -.17 * v * v * (.35 + .65 * costas)).addScaledVector(E, .04 * v * v); p.y += .06 * v * v * costas;
   if (v < .1) p.lerp(topo, 1 - ss(0, .1, v));
   saia.push(p); } }
 grade(saia, NU, NV, 'marmore', true);
 {const lin = j => { const o = []; for (let i = 0; i <= NU; i++) o.push(saia[j * (NU + 1) + i]); return o; };
  tubo(lin(NV), .009, .009, 6, false);
  const jS = Math.max(1, Math.floor(NV * (Cw.y - ySlit) / (Cw.y - yBarra)));
  for (const i of [0, NU]) { const o = []; for (let j = jS; j <= NV; j++) o.push(saia[j * (NU + 1) + i]); tubo(o, .009, .009, 6, false); } }
 await etapa('saia');
 // ---------- mangas boca-de-sino (a do braço erguido escorregou até o cotovelo) ----------
 const mangas = [];
 const manga = (lado, ate, abre) => { const p0 = wp(lado + 'Shoulder').lerp(wp(lado + 'Arm'), .6), c = new T.CatmullRomCurve3([p0, wp(lado + 'Arm'), wp(lado + 'ForeArm'), wp(lado + 'Hand')], false, 'centripetal');
  const N = 26, seg = 24, Q = []; let Dp = V(0, -1, 0);
  for (let i = 0; i <= N; i++) { const t = i / N * ate, o = c.getPointAt(t), tg = c.getTangentAt(t); let Dv = V(0, -1, 0).addScaledVector(tg, tg.y); if (Dv.lengthSq() < .01) Dv = Dp.clone(); Dv.normalize(); Dp = Dv; const S = new T.Vector3().crossVectors(tg, Dv).normalize();
   const fl = ss(ate - .42, ate, t), puf = Math.exp(-Math.pow(t / .1, 2)), rs = .07 + .018 * puf + abre[0] * fl, ru = .07 + .018 * puf + abre[1] * fl, rd = .07 + .018 * puf + abre[2] * fl;
   for (let j = 0; j <= seg; j++) { const a = j / seg * Math.PI * 2, sa = Math.sin(a), rD = ru + (rd - ru) * ss(-.2, .7, sa);
    const ondula = 1 + .07 * fl * Math.sin(a * 6 + 1);
    Q.push(o.clone().addScaledVector(S, Math.cos(a) * rs * ondula).addScaledVector(Dv, sa * rD * ondula).addScaledVector(Y, -.05 * fl * Math.max(0, sa))); } }
  const g = grade(Q, seg, N, 'marmore'); mangas.push(g); tubo(Q.slice(N * (seg + 1), N * (seg + 1) + seg), .008, .008, 5, true); };
 manga('Left', 1, [.04, .015, .17]); manga('Right', .72, [.035, .012, .12]);
 for (const lado of ['Right', 'Left']) { const w = wp(lado + 'Hand'), d = wp(lado + 'Hand').sub(wp(lado + 'ForeArm')).normalize(), g = new T.TorusGeometry(.042, .009, 6, 18);
  g.applyQuaternion(new T.Quaternion().setFromUnitVectors(Z, d)); g.translate(w.x - d.x * .045, w.y - d.y * .045, w.z - d.z * .045); add('ouro', g); }
 await etapa('mangas');
 // ---------- capuz (repouso da cabeça → pose, misturando cabeça/pescoço/costas) ----------
 const CH = V(0, 1.675, -.014), RX = .133, RY = .172, RZ = .17, NCAP = 26, NCOW = 12, NTH = 60, capuz = [];
 const abertura = y => 1.12 * ss(1.808, 1.73, y);
 for (let j = 0; j <= NCAP + NCOW; j++) { let y, rf, rb, rx;
  if (j <= NCAP) { const ph = j / NCAP * Math.PI / 2; y = CH.y + RY * Math.cos(ph); rf = rb = Math.sin(ph); rx = rf; }
  else { const k = (j - NCAP) / NCOW; y = CH.y - k * (CH.y - 1.425); rx = 1 + .3 * Math.pow(k, 1.4); rf = 1 + .16 * Math.pow(k, 1.4); rb = 1 + .08 * Math.pow(k, 1.4); }
  const th0 = abertura(y);
  for (let i = 0; i <= NTH; i++) { const th = th0 + i / NTH * (Math.PI * 2 - 2 * th0), c = Math.cos(th), s = Math.sin(th);
   const pico = .03 * Math.exp(-Math.pow((y - 1.79) / .04, 2)) * Math.max(0, -c) ** 3;
   const p = V(CH.x + RX * rx * s, y, CH.z + (c > 0 ? RZ * rf : RZ * rb) * c - pico);
   if (j > NCAP) p.y -= .035 * Math.pow((j - NCAP) / NCOW, 2) * Math.max(0, -c);
   capuz.push(pele(escCab(p, ss(1.5, 1.6, y)), cadeia(y, PESCOCO))); } }
 grade(capuz, NTH, NCAP + NCOW, 'marmore');
 {const ida = [], volta = []; for (let j = NCAP + NCOW; j >= 0; j--) { if (abertura(capuz[j * (NTH + 1)].y) < .02 && j < NCAP * .5) continue; ida.push(capuz[j * (NTH + 1)]); }
  for (let j = 0; j <= NCAP + NCOW; j++) { if (abertura(capuz[j * (NTH + 1) + NTH].y) < .02 && j < NCAP * .5) continue; volta.push(capuz[j * (NTH + 1) + NTH]); }
  tubo(ida.concat(volta.slice(1)), .009, .009, 6, false); }
 // diadema na testa com gema em gota, e colar com pingente
 const ovo = (b, y, f = .006) => { const rhs = Math.max(.02, 1 - Math.pow((y - 1.673) / .133, 2)), s = Math.sin(b), c = Math.cos(b); const r = Math.sqrt(rhs / (s * s / .0077 + c * c / .0156)) + f; return V(s * r, y, c * r); };
 {const pts = []; for (let i = 0; i <= 16; i++) { const b = (-64 + i * 8) * Math.PI / 180; pts.push(pele(escCab(ovo(b, 1.752 + .012 * Math.cos(b * 1.4))), [['Head', 1]])); } tubo(pts, .0055, .0055, 6);
  const gp = pele(escCab(ovo(0, 1.738, .012)), [['Head', 1]]), g = new T.OctahedronGeometry(.016, 0); g.scale(1, 1.5, .7); const q = B.Head.getWorldQuaternion(new T.Quaternion()).multiply(new T.Quaternion().setFromRotationMatrix(restM.Head).invert()); g.applyQuaternion(q); g.translate(gp.x, gp.y, gp.z); add('gema', g); }
 {const ctrl = [V(-.066, 1.495, -.005), V(-.058, 1.455, .07), V(0, 1.408, .116), V(.058, 1.455, .07), V(.066, 1.495, -.005)];
  const c = new T.CatmullRomCurve3(ctrl, false, 'centripetal'), pts = []; for (let i = 0; i <= 20; i++) { const p = c.getPointAt(i / 20); pts.push(pele(p, cadeia(p.y, PESCOCO))); } tubo(pts, .004, .004, 5);
  const pp = pele(V(0, 1.388, .122), [['Spine2', 1]]), g = new T.OctahedronGeometry(.018, 0); g.scale(.8, 1.5, .6); g.translate(pp.x, pp.y, pp.z); add('gema', g);
  const ga = new T.TorusGeometry(.012, .003, 5, 12); const pa = pele(V(0, 1.405, .118), [['Spine2', 1]]); ga.translate(pa.x, pa.y, pa.z); add('ouro', ga); }
 await etapa('capuz');
 // ---------- mechas de cabelo: nascem na risca, contornam o rosto dentro do capuz e caem sobre o peito ----------
 const eixoCorpo = [wp('Head'), wp('Neck'), wp('Spine2'), wp('Spine1'), wp('Spine')];
 const paraFora = p => { let best = null, bd = 1e9; for (let i = 0; i < eixoCorpo.length - 1; i++) { const a = eixoCorpo[i], b = eixoCorpo[i + 1], ab = b.clone().sub(a), t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / ab.lengthSq())), q = a.clone().addScaledVector(ab, t), d = p.distanceToSquared(q); if (d < bd) { bd = d; best = q; } } return p.clone().sub(best).normalize(); };
 const sup = []; // superfícies que o cabelo não pode atravessar (corpete, mangas)
 {const g = corpete, pp = g.attributes.position, nn = g.attributes.normal; for (let i = 0; i < pp.count; i += 2) sup.push([V(pp.getX(i), pp.getY(i), pp.getZ(i)), V(nn.getX(i), nn.getY(i), nn.getZ(i))]); }
 for (const g of mangas) { const pp = g.attributes.position, nn = g.attributes.normal; for (let i = 0; i < pp.count; i += 3) sup.push([V(pp.getX(i), pp.getY(i), pp.getZ(i)), V(nn.getX(i), nn.getY(i), nn.getZ(i))]); }
 const empurra = (p, folgaMin) => { let best = null, bd = 1e9; for (const s of sup) { const d = p.distanceToSquared(s[0]); if (d < bd) { bd = d; best = s; } } if (!best || bd > .04) return; const d = p.clone().sub(best[0]).dot(best[1]); if (d < folgaMin) p.addScaledVector(best[1], folgaMin - d); };
 // frente do peito em repouso (para deitar o cabelo sobre o corpete)
 const frentePeito = (x, y, f) => { let best = null, bd = 9; for (let i = 0; i <= 48; i++) { const th = Math.sign(x) * i / 48 * 1.3, p = pontoCorpete(th, y, f), d = Math.abs(p.x - x); if (d < bd) { bd = d; best = p; } } return best; };
 const MECHAS = [ // pontos na cabeça (repouso, lado esquerdo), x no peito e altura da ponta
  { cab: [[.012, 1.792, .075], [.06, 1.765, .09], [.095, 1.70, .076], [.106, 1.62, .052], [.104, 1.55, .048]], peito: [.07, .078, .086], fim: 1.235, larg: .027 },
  { cab: [[.03, 1.80, .054], [.08, 1.76, .066], [.108, 1.69, .05], [.116, 1.61, .026], [.116, 1.545, .024]], peito: [.09, .098, .106], fim: 1.27, larg: .027 },
  { cab: [[.05, 1.80, .024], [.098, 1.742, .026], [.118, 1.665, .004], [.121, 1.59, -.012], [.122, 1.525, .0]], peito: [.108, .116, .122], fim: 1.31, larg: .024 },
  { cab: [[.022, 1.80, .064], [.07, 1.776, .076], [.1, 1.715, .066], [.11, 1.64, .04], [.11, 1.565, .034]], peito: [.08, .088, .095], fim: 1.2, larg: .021 }];
 const PESC_CAB = [['Spine2', 1.40], ['Neck', 1.49], ['Head', 1.555]];
 for (const sx of [-1, 1]) for (const M of MECHAS) {
  const R = M.cab.map(q => escCab(V(sx * q[0], q[1], q[2]), ss(1.5, 1.6, q[1])));
  R.push(V(sx * (M.peito[0] + .01), 1.49, .075), V(sx * M.peito[0], 1.435, .114));
  for (let q = 0; q < 3; q++) { const y = [1.37, 1.31, M.fim][q], x = sx * M.peito[q]; R.push(frentePeito(x, y, .018)); }
  const pts = R.map(p => pele(p, cadeia(p.y, p.y < 1.40 ? TRONCO : PESC_CAB)));
  for (let it = 0; it < 3; it++) { for (let q = 5; q < pts.length; q++) empurra(pts[q], .015); for (let q = 5; q < pts.length - 1; q++) pts[q].lerp(pts[q - 1].clone().add(pts[q + 1]).multiplyScalar(.5), .25); }
  fita(pts, t => M.larg * (1 - .62 * Math.pow(t, 3)), t => .0085 * (1 - .5 * t * t), (o) => paraFora(o), 12, opts.depura ? 'gema' : 'marmore', 6); }
 await etapa('cabelo');
 // ---------- capa presa nas costas dos ombros, caindo atrás e esvoaçando ----------
 {const saiaObs = []; for (let i = 0; i < saia.length; i += 3) saiaObs.push(saia[i]);
  const tudo = obst.map(q => q.p).concat(saiaObs, capuz.filter((_, i) => i % 3 === 0));
  const NL = 80, dL = .02, NYc = 90, dYc = .02, topoY = pele(V(0, 1.445, -.13), [['Spine2', 1]]).y, fundo = Array.from({ length: NYc }, () => new Float32Array(NL).fill(9));
  for (const p of tudo) { const d = p.clone().sub(Cw), l = d.dot(E), f = d.dot(F), il = Math.floor(l / dL + NL / 2), iy = Math.floor((topoY - p.y) / dYc); if (iy < 0 || iy >= NYc || il < 0 || il >= NL) continue;
   for (let a = -1; a <= 1; a++) { const k = il + a; if (k >= 0 && k < NL && fundo[iy][k] > f) fundo[iy][k] = f; } }
  for (let it = 0; it < 2; it++) for (let iy = 0; iy < NYc; iy++) { const r = fundo[iy], d = new Float32Array(NL);
   for (let k = 0; k < NL; k++) { let mn = 9; for (let a = -3; a <= 3; a++) { const q = k + a; if (q >= 0 && q < NL) mn = Math.min(mn, r[q]); } for (const dy of [-1, 1]) { const rr = fundo[iy + dy]; if (rr) mn = Math.min(mn, rr[k]); } d[k] = mn; }
   for (let k = 0; k < NL; k++) { let sm = 0, n = 0; for (let a = -3; a <= 3; a++) { const q = k + a; if (q >= 0 && q < NL && d[q] < 8) { sm += d[q]; n++; } } r[k] = n ? Math.min(d[k] + .02, sm / n) : 9; } }
  const NUc = 34, NVc2 = 44, capa = [], prof = new Float32Array(NUc + 1), Lc = topoY - (yBarra - .22);
  for (let j = 0; j <= NVc2; j++) { const v = j / NVc2;
   for (let i = 0; i <= NUc; i++) { const s = i / NUc * 2 - 1, top = pele(V(s * .128, 1.445 - .018 * s * s, -.13 - .012 * (1 - s * s)), [['Spine2', 1]]);
    const lat = top.clone().sub(Cw).dot(E) * (1 - ss(0, .3, v)) + s * (.15 + .42 * Math.pow(v, .85)) * ss(0, .3, v) + .07 * v * v, y = top.y - Lc * v;
    const il = Math.floor(lat / dL + NL / 2), iy = Math.floor((topoY - y) / dYc); let lim = 9;
    if (iy >= 0 && iy < NYc) for (let a = -2; a <= 2; a++) { const k = il + a; if (k >= 0 && k < NL) lim = Math.min(lim, fundo[iy][k]); }
    const f0 = top.clone().sub(Cw).dot(F), alvo = f0 - .02 * v + .24 * s * s * ss(.1, .75, v); prof[i] = j === 0 ? f0 : Math.min(alvo, prof[i] + .02, lim - .03);
    const f = prof[i] - .18 * v * v - .045 * Math.abs(Math.sin(s * Math.PI * 2.5)) * v;
    const p = Cw.clone().addScaledVector(E, lat).addScaledVector(F, f); p.y = y + .05 * v * v + .035 * Math.sin(s * Math.PI * 3 + .5) * v * v * v; capa.push(p); } }
  grade(capa, NUc, NVc2, 'marmore', false, true); const barra = []; for (let i = 0; i <= NUc; i++) barra.push(capa[NVc2 * (NUc + 1) + i]); tubo(barra, .009, .009, 6);
  for (const i of [0, NUc]) { const o = []; for (let j = 0; j <= NVc2; j++) o.push(capa[j * (NUc + 1) + i]); tubo(o, .008, .008, 6); }
  for (const s of [-1, 1]) { const f = pele(V(s * .118, 1.452, -.118), [['Spine2', 1]]), g = new T.SphereGeometry(.024, 12, 8); g.translate(f.x, f.y, f.z); add('ouro', g); } }
 await etapa('capa');
 // ---------- espiral de mármore que sustenta a estátua pela ponta do pé ----------
 const pe = wp('LeftToeBase').lerp(wp('LeftToe_End'), .75), base = V(pe.x * .5 + Cw.x * .5, pe.y - .6, pe.z * .5 + Cw.z * .5);
 for (let f = 0; f < 3; f++) { const pts = []; for (let i = 0; i <= 26; i++) { const t = i / 26, a = f * Math.PI * 2 / 3 + t * Math.PI * 2.3, r = .3 * (1 - t) * (1 - t * .3) + .03 * t;
   pts.push(V(base.x + (pe.x - base.x) * t + Math.cos(a) * r, base.y + .1 + (pe.y - base.y - .1) * t, base.z + (pe.z - base.z) * t + Math.sin(a) * r)); }
  fita(pts, t => .05 * (1 - .7 * t), t => .014 * (1 - .5 * t), o => { const d = o.clone().sub(base); d.y = 0; return d.lengthSq() < 1e-6 ? X.clone() : d.normalize(); }, 10, 'marmore'); }
 {const g = new T.LatheGeometry([[0, 0], [.42, 0], [.46, .04], [.41, .1], [.3, .14], [.18, .16], [0, .17]].map(q => new T.Vector2(q[0], q[1])), 32); g.translate(base.x, base.y, base.z); add('marmore', g);
  const r = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; r.push(V(base.x + Math.cos(a) * .44, base.y + .045, base.z + Math.sin(a) * .44)); } tubo(r.slice(0, 40), .012, .012, 6, true); }
 // orbe acima da palma direita
 const palma = wp('RightHand').lerp(wp('RightHandMiddle1'), .5).addScaledVector(normalPalma('Right'), .03), orbe = palma.clone().add(V(0, .19, 0));
 await etapa('espiral');
 // ---------- junta por material, base na origem, UV de mármore por projeção ----------
 const grupo = new T.Group(); grupo.name = 'Estátua da maga'; const mats = opts.mats || {};
 for (const k of Object.keys(geos)) { if (!geos[k].length) continue;
  const lista = geos[k].map(g => { const h = new T.BufferGeometry(); h.setAttribute('position', g.attributes.position); h.setAttribute('normal', g.attributes.normal); h.setIndex(g.index); return h; });
  const g = BGU.mergeGeometries(lista, false); g.translate(-base.x, -base.y, -base.z);
  const p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count * 2), EU = 1.6;
  for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)); let u, v;
   if (ax >= ay && ax >= az) { u = p.getZ(i); v = p.getY(i); } else if (az >= ay) { u = p.getX(i); v = p.getY(i); } else { u = p.getX(i); v = p.getZ(i); } uv[i * 2] = u * EU; uv[i * 2 + 1] = v * EU; }
  g.setAttribute('uv', new T.BufferAttribute(uv, 2)); g.computeBoundingSphere(); g.computeBoundingBox();
  const me = new T.Mesh(g, mats[k] || new T.MeshStandardMaterial({ color: k === 'ouro' ? '#d9ad52' : k === 'gema' ? '#7fe2ff' : '#ece6dc', roughness: .45, side: T.DoubleSide }));
  me.name = 'Estátua da maga · ' + k; grupo.add(me); }
 const orbeN = new T.Object3D(); orbeN.name = 'Estátua da maga · orbe'; orbeN.position.copy(orbe).sub(base); grupo.add(orbeN);
 const bb = new T.Box3().setFromObject(grupo);
 await etapa('junta');
 return { grupo, info: { tempos: tempos.join(', '), vertices: grupo.children.reduce((s, o) => s + (o.geometry ? o.geometry.attributes.position.count : 0), 0), triangulos: grupo.children.reduce((s, o) => s + (o.geometry ? o.geometry.index.count / 3 : 0), 0),
  altura: +bb.max.y.toFixed(3), tam: bb.getSize(V(0, 0, 0)).toArray().map(v => +v.toFixed(2)), orbe: orbeN.position.toArray().map(v => +v.toFixed(3)), fenda: +(aS * 180 / Math.PI).toFixed(1), cabeca: wp('Head').sub(base).toArray().map(v => +v.toFixed(3)), joelho: wp('RightLeg').sub(base).toArray().map(v => +v.toFixed(3)), cintura: Cw.toArray().map(v => +v.toFixed(3)), barra: +yBarra.toFixed(3) } };
}

// textura de mármore (veios cinza suaves sobre branco-creme), sem emenda
export function marmore(T) {
 const S = 1024, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
 let s = 91; const R = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
 g.fillStyle = '#ebe5db'; g.fillRect(0, 0, S, S);
 for (let i = 0; i < 160; i++) { const x = R() * S, y = R() * S, r = 40 + R() * 160, gr = g.createRadialGradient(x, y, 0, x, y, r); const tom = 218 + R() * 30 | 0;
  gr.addColorStop(0, `rgba(${tom},${tom - 5},${tom - 12},.35)`); gr.addColorStop(1, 'rgba(235,229,219,0)'); for (const ox of [0, -S, S]) for (const oy of [0, -S, S]) { g.fillStyle = gr; g.save(); g.translate(ox, oy); g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); } }
 const veio = (x, y, ang, len, w, a) => { for (const ox of [0, -S, S]) for (const oy of [0, -S, S]) { g.save(); g.translate(ox, oy); g.beginPath(); g.moveTo(x, y); let px = x, py = y, aa = ang;
   for (let k = 0; k < len; k++) { aa += (R() - .5) * .5; px += Math.cos(aa) * 9; py += Math.sin(aa) * 9; g.lineTo(px, py); }
   g.strokeStyle = `rgba(105,103,112,${a})`; g.lineWidth = w; g.shadowColor = 'rgba(105,103,112,.6)'; g.shadowBlur = 6; g.stroke(); g.restore(); } };
 for (let i = 0; i < 10; i++) veio(R() * S, R() * S, R() * 6.3, 60 + R() * 70, 1.4 + R() * 2, .38 + R() * .2);
 for (let i = 0; i < 30; i++) veio(R() * S, R() * S, R() * 6.3, 15 + R() * 30, .6 + R() * .8, .2 + R() * .15);
 const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
}
