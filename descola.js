/* Superfícies brigando pelo mesmo lugar (z-fighting): depois que o mundo é montado, procura faces de construção
   coplanares (mesmo lado, menos de 5 mm) que se sobrepõem e afasta uma delas pela normal.
   - As peças são os pedaços ligados por aresta de cada malha (as construções são malhas juntadas por material).
   - Cada plano de cada peça é um nó; em cada grupo de nós sobrepostos a maior peça fica (o terreno sempre fica) e
     as outras recebem a menor camada livre entre as vizinhas: 1 cm, 2 cm, 3 cm (friso, batente, tábua, enfeite e
     caminho ficam na frente da parede ou do piso).
   - A face é EMPURRADA (os vértices daquele plano andam pela normal e as faces do lado esticam), sem abrir fresta.
   - Verificação: se a face empurrada cair em cima de outra que já estava ali, tenta meia camada para dentro/fora.
   Roda uma vez, em fatias, alguns segundos depois do carregamento (e de novo só nos andares das minas quando são
   montados). window.arcanoDescola.relatorio = resultado; window.arcanoDescolaPronto = true quando termina (as
   exportações para o Godot esperam isso). Em aparelho fraco (celular, pouca memória) não roda: usa ~150 MB
   temporários; ?descola=1 força, ?semdescola=1 desliga. */
(function(){
'use strict';
const T=window.THREE;if(!T)return;
if(/[?&]descolareg=1/.test(location.search))window.arcanoDescolaRegistro=true;   // exportação para o Godot
const EPS=.01;   // 1 cm: some a briga até ~150 m e não aparece como degrau
const EXCL=/céu|ceu|sky|nuvem|cloud|chuva|rain|névoa|nevoa|fog|neblina|part[ií]cula|magia|orbe|esfera|bolha|vaga-?lume|inseto|borboleta|libélula|mosca|ave |aves|pássaro|passaro|pato|peixe|tartaruga|cervo|sapo|coruja|personagem|player|xbot|sombra|shadow|halo|brilho|glow|reflexo|água|agua|water|cachoeira|espuma|onda|ripple|chama|fogo|fire|fumaça|smoke|raio|luz |feixe|estrela|star|sol |lua |cursor|seta|marcador|minimapa|grama|grass|capim|folha|leaf|leaves|flor(?!esta)|flower|alga|vfx|trail|rastro|spark|contorno|tapete de grama/i;
const TERRENO=/terreno|terra absorvente|costura do terreno|base inferior|chão da ilha|leito|areia da praia|piso da cidade/i;
const pausa=()=>new Promise(r=>setTimeout(r,0));
// orgânicos (árvores, pedras, cavernas) não brigam como construção e custam muito: ficam de fora
const ORGANICO=/árvore|arvore|tree|birch|maple|pine|arbusto|bush|pedra|rock|seixo|tronco|galho|raiz|floresta|colina|flash|galerias|profundezas|cogumelo|planta|junco/i;
const CONSTRUCAO=/^(Mirante|Ponte|Pontes|Escadaria|Píer|Pedra da fundação|Pedra do meio-fio|Muro|Mina · |Árvore gigante)/;
// fatia de tempo: devolve o quadro ao jogo a cada ~12 ms
let _tY=0;const talvez=async()=>{if(performance.now()-_tY>12){await pausa();_tY=performance.now();}};
function nomeDe(o){let n=o.name||'';let p=o.parent;while(!n&&p){n=p.name||'';p=p.parent;}return n;}

async function run(opt){opt=opt||{};
 const api=window.arcanoWaterV1226,scene=api.scene,raiz=opt.raiz||scene;scene.updateMatrixWorld(true);
 const rel={malhas:0,tris:0,pares:0,movidas:0,nomes:{},parte:opt.raiz?(opt.raiz.name||'parte'):'mundo'},t0=performance.now();
 // ---------- coleta (construções e o terreno como referência fixa) ----------
 const usos=new Map();scene.traverse(o=>{if(o.isMesh&&o.geometry)usos.set(o.geometry,(usos.get(o.geometry)||0)+1);});
 const meshes=[];let nt=0;
 raiz.traverse(o=>{
  if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||!o.geometry||!o.geometry.attributes.position)return;
  if(o.userData&&(o.userData.ink||o.userData.semDescola))return;
  const ms=[].concat(o.material);const m0=ms[0];if(!m0||m0.side===T.BackSide)return;
  if(ms.some(m=>m.isShaderMaterial||m.isRawShaderMaterial||m.isPointsMaterial||m.isSpriteMaterial))return;
  if(ms.every(m=>(m.transparent&&m.depthWrite===false)||m.polygonOffset))return;
  if(ms.every(m=>m.alphaTest>0))return;   // folhas em cartão
  const nome=nomeDe(o);if(EXCL.test(nome))return;if(ORGANICO.test(nome)&&!CONSTRUCAO.test(nome))return;
  const g=o.geometry,n=(g.index?g.index.count:g.attributes.position.count)/3|0;if(!n)return;
  meshes.push({o,nome,n,terr:TERRENO.test(nome)});nt+=n;});
 rel.malhas=meshes.length;rel.tris=nt;
 const P=new Float32Array(nt*9),TC=new Int32Array(nt).fill(-1),N=new Float32Array(nt*4),OFF=new Uint8Array(nt);
 let k=0;const v=new T.Vector3();
 for(let mi=0;mi<meshes.length;mi++){const M=meshes[mi],o=M.o,g=o.geometry,pa=g.attributes.position,ix=g.index,mw=o.matrixWorld;M.t0=k;
  const ms=[].concat(o.material),grs=g.groups&&g.groups.length&&Array.isArray(o.material)?g.groups:null;
  for(let t=0;t<M.n;t++){
   for(let c=0;c<3;c++){const vi=ix?ix.getX(t*3+c):t*3+c;v.fromBufferAttribute(pa,vi).applyMatrix4(mw);P[k*9+c*3]=v.x;P[k*9+c*3+1]=v.y;P[k*9+c*3+2]=v.z;}
   let m=ms[0];if(grs){for(const gr of grs)if(t*3>=gr.start&&t*3<gr.start+gr.count){m=ms[gr.materialIndex]||ms[0];break;}}
   if(m&&(m.polygonOffset||(m.transparent&&m.depthWrite===false)||m.side===T.BackSide))OFF[k]=1;
   const b=k*9,ax=P[b+3]-P[b],ay=P[b+4]-P[b+1],az=P[b+5]-P[b+2],bx=P[b+6]-P[b],by=P[b+7]-P[b+1],bz=P[b+8]-P[b+2];
   let nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx;const l=Math.hypot(nx,ny,nz);if(l>0){nx/=l;ny/=l;nz/=l;}
   N[k*4]=nx;N[k*4+1]=ny;N[k*4+2]=nz;N[k*4+3]=l/2;k++;}
  M.t1=k;if(mi%8===0)await talvez();}
 // ---------- pedaços ligados de cada malha (vértices iguais a 1 mm) ----------
 let nc=0;const area=[],dono=[];
 for(let mi=0;mi<meshes.length;mi++){const M=meshes[mi];if(M.terr){for(let t=M.t0;t<M.t1;t++)TC[t]=-2;continue;}
  const n=M.t1-M.t0,par=new Int32Array(n);for(let i=0;i<n;i++)par[i]=i;
  const f=i=>{while(par[i]!==i){par[i]=par[par[i]];i=par[i];}return i;};
  // ligados por ARESTA (dois vértices iguais a 1 mm): vigas que só se encostam num canto ficam peças separadas
  // (por vértice, as vigas e tábuas de uma casa juntada viravam uma peça só e a briga entre elas ficava)
  const size=1<<Math.ceil(Math.log2(n*3*2+2)),K=new Int32Array(size*6),val=new Int32Array(size).fill(-1),q=[0,0,0,0,0,0,0,0,0];
  for(let t=0;t<n;t++){const b=(M.t0+t)*9;for(let c=0;c<9;c++)q[c]=Math.round(P[b+c]*1000);
   for(let e=0;e<3;e++){const i0=e*3,i1=((e+1)%3)*3;let A=i0,B=i1;
    if(q[i0]>q[i1]||(q[i0]===q[i1]&&(q[i0+1]>q[i1+1]||(q[i0+1]===q[i1+1]&&q[i0+2]>q[i1+2])))){A=i1;B=i0;}
    const ax=q[A],ay=q[A+1],az=q[A+2],bx=q[B],by=q[B+1],bz=q[B+2];
    let h=((ax*73856093)^(ay*19349663)^(az*83492791)^(bx*2654435761)^(by*40503)^(bz*97))&(size-1);
    while(val[h]!==-1&&!(K[h*6]===ax&&K[h*6+1]===ay&&K[h*6+2]===az&&K[h*6+3]===bx&&K[h*6+4]===by&&K[h*6+5]===bz))h=(h+1)&(size-1);
    if(val[h]===-1){val[h]=t;K[h*6]=ax;K[h*6+1]=ay;K[h*6+2]=az;K[h*6+3]=bx;K[h*6+4]=by;K[h*6+5]=bz;}else{const r1=f(t),r2=f(val[h]);if(r1!==r2)par[r1]=r2;}}}
  const map=new Map();for(let t=0;t<n;t++){const r=f(t);let id=map.get(r);if(id===undefined){id=nc++;map.set(r,id);area.push(0);dono.push(mi);}TC[M.t0+t]=id;area[id]+=N[(M.t0+t)*4+3];}
  if(mi%4===0)await talvez();}
 // ---------- grade xz de 2 m ----------
 const CS=2;let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;
 for(let t=0;t<nt;t++){const b=t*9;for(let c=0;c<3;c++){const x=P[b+c*3],z=P[b+c*3+2];if(x<x0)x0=x;if(x>x1)x1=x;if(z<z0)z0=z;if(z>z1)z1=z;}}
 x0=Math.floor(x0)-1;z0=Math.floor(z0)-1;const GX=Math.ceil((x1-x0)/CS)+1,GZ=Math.ceil((z1-z0)/CS)+1;
 const cnt=new Int32Array(GX*GZ+1),rr=[0,0,0,0];
 const faixa=(t,out)=>{const b=t*9;let ax=1e9,az=1e9,bx=-1e9,bz=-1e9;for(let c=0;c<3;c++){const x=P[b+c*3],z=P[b+c*3+2];if(x<ax)ax=x;if(x>bx)bx=x;if(z<az)az=z;if(z>bz)bz=z;}
  out[0]=Math.max(0,Math.floor((ax-x0)/CS));out[1]=Math.min(GX-1,Math.floor((bx-x0)/CS));out[2]=Math.max(0,Math.floor((az-z0)/CS));out[3]=Math.min(GZ-1,Math.floor((bz-z0)/CS));};
 for(let t=0;t<nt;t++){faixa(t,rr);for(let i=rr[0];i<=rr[1];i++)for(let j=rr[2];j<=rr[3];j++)cnt[j*GX+i+1]++;}
 for(let i=1;i<cnt.length;i++)cnt[i]+=cnt[i-1];
 const cell=new Int32Array(cnt[cnt.length-1]),fill=cnt.slice(0,GX*GZ);
 for(let t=0;t<nt;t++){faixa(t,rr);for(let i=rr[0];i<=rr[1];i++)for(let j=rr[2];j<=rr[3];j++)cell[fill[j*GX+i]++]=t;}
 await pausa();
 // área da interseção de dois triângulos coplanares (projetados no plano dominante)
 const inter=(t1,t2,nx,ny,nz)=>{const ax=Math.abs(nx),ay=Math.abs(ny),az=Math.abs(nz);const pu=ax>=ay&&ax>=az?[1,2]:(ay>=az?[0,2]:[0,1]);
  const A=[],B=[];for(let c=0;c<3;c++){A.push([P[t1*9+c*3+pu[0]],P[t1*9+c*3+pu[1]]]);B.push([P[t2*9+c*3+pu[0]],P[t2*9+c*3+pu[1]]]);}
  const sa=p=>{let s=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];s+=a[0]*b[1]-a[1]*b[0];}return s/2;};
  if(sa(A)<0)A.reverse();if(sa(B)<0)B.reverse();
  let out=A;for(let i=0;i<3&&out.length;i++){const a=B[i],b=B[(i+1)%3],inp=out;out=[];const side=p=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
   for(let j=0;j<inp.length;j++){const p=inp[j],q=inp[(j+1)%inp.length],sp=side(p),sq=side(q);if(sp>=0)out.push(p);if((sp>=0)!==(sq>=0)){const tt=sp/(sp-sq);out.push([p[0]+(q[0]-p[0])*tt,p[1]+(q[1]-p[1])*tt]);}}}
  if(out.length<3)return 0;return Math.abs(sa(out));};
 // ---------- pares brigando ----------
 // Cada plano de cada pedaço é um nó; pares sobrepostos ligam nós. Em cada grupo a maior peça fica (o terreno
 // sempre fica) e as outras recebem a menor camada livre entre os vizinhos (1 cm, 2 cm, 3 cm). A face que sai é
 // EMPURRADA para fora (extrusão: os vértices daquele plano andam pela normal e as faces vizinhas esticam), em
 // vez de mover a peça inteira: numa viga com frente e fundo brigando, ou num friso que dá a volta no prédio,
 // mover a peça anulava um lado com o outro e a briga ficava.
 const sh=new Float32Array(nt);   // quanto o plano de cada triângulo já saiu (para a verificação)
 const quente=new Uint8Array(GX*GZ);   // células com triângulo deslocado
 const varre=async(fn,so)=>{const vistos=new Set();
  for(let ci=0;ci<GX*GZ;ci++){const s=cnt[ci],e=cnt[ci+1];if(e-s<2)continue;if(so&&!quente[ci])continue;
   const buck=new Map();
   for(let q=s;q<e;q++){const t=cell[q];if(N[t*4+3]<2e-4||OFF[t])continue;const nx=N[t*4],ny=N[t*4+1],nz=N[t*4+2];
    const d=nx*P[t*9]+ny*P[t*9+1]+nz*P[t*9+2]+sh[t];const key=Math.round(nx*40)*1e6+Math.round(ny*40)*1e3+Math.round(nz*40);   // mesmo lado: sem trocar o sinal
    let L=buck.get(key);if(!L){L=[];buck.set(key,L);}L.push([t,d]);}
   for(const L of buck.values()){if(L.length<2)continue;if(so){let h=false;for(const x of L)if(sh[x[0]]){h=true;break;}if(!h)continue;}
    L.sort((a,b)=>a[1]-b[1]);
    for(let i=0;i<L.length;i++){const ti=L[i][0],di=L[i][1];
     for(let j=i+1;j<L.length&&L[j][1]-di<(so?.004:.005);j++){const tj=L[j][0];if(so&&!sh[ti]&&!sh[tj])continue;
      const a=TC[ti],b=TC[tj];if(a===b)continue;if(a===-2&&b===-2)continue;
      // cada par uma vez (antes só contava na célula do centro de um dos triângulos: vigas compridas escapavam)
      const pk=ti<tj?ti*nt+tj:tj*nt+ti;if(vistos.has(pk))continue;vistos.add(pk);
      const dot=N[ti*4]*N[tj*4]+N[ti*4+1]*N[tj*4+1]+N[ti*4+2]*N[tj*4+2];if(dot<.9995)continue;
      if(inter(ti,tj,N[ti*4],N[ti*4+1],N[ti*4+2])<.002)continue;
      fn(ti,tj,a,b);}}}
   if(ci%64===0)await talvez();}};
 const planos=new Map(),info=new Map(),viz=new Map(),gpai=new Map();
 const dist=(t,n)=>n[0]*P[t*9]+n[1]*P[t*9+1]+n[2]*P[t*9+2];
 const nodo=(c,t)=>{const n=[N[t*4],N[t*4+1],N[t*4+2]],pk=c+'|'+Math.round(n[0]*20)+','+Math.round(n[1]*20)+','+Math.round(n[2]*20),d=dist(t,n);
  let L=planos.get(pk);if(!L){L=[];planos.set(pk,L);}for(const p of L)if(Math.abs(p.d-d)<.005)return p.k;
  const k=pk+'|'+L.length;L.push({d,k});info.set(k,{c,n,d,cor:-1,off:0});return k;};
 const gf=k=>{let p=gpai.get(k);if(p===undefined){gpai.set(k,k);return k;}while(p!==k){const pp=gpai.get(p);gpai.set(k,pp);k=p;p=pp;}return k;};
 const liga=(k1,k2)=>{const r1=gf(k1),r2=gf(k2);if(r1!==r2)gpai.set(r1,r2);
  if(!viz.has(k1))viz.set(k1,new Set());if(!viz.has(k2))viz.set(k2,new Set());viz.get(k1).add(k2);viz.get(k2).add(k1);};
 const t1=performance.now();
 await varre((ti,tj,a,b)=>{rel.pares++;liga(nodo(a,ti),nodo(b,tj));},false);
 rel.tPares=+((performance.now()-t1)/1000).toFixed(1);
 const grupos=new Map();for(const k of gpai.keys()){const r=gf(k);let G=grupos.get(r);if(!G){G=[];grupos.set(r,G);}G.push(k);}
 for(const G of grupos.values()){
  const mem=G.map(k=>info.get(k)).map((I,i)=>({k:G[i],I,a:I.c===-2?1e12:area[I.c]})).sort((p,q)=>q.a-p.a);
  for(const p of mem){const usados=new Set();for(const q of viz.get(p.k)||[]){const c=info.get(q).cor;if(c>=0)usados.add(c);}
   let c0=0;if(p.I.c!==-2)while(usados.has(c0))c0++;p.I.cor=c0;p.I.off=Math.min(c0,3)*EPS;}}
 // planos que saem, por pedaço
 const movP=new Map();for(const [k,I] of info){if(I.c===-2||!I.off)continue;let L=movP.get(I.c);if(!L){L=[];movP.set(I.c,L);}L.push(I);}
 const planoDe=t=>{const L=movP.get(TC[t]);if(!L)return null;for(const I of L){const n=I.n;
   if(N[t*4]*n[0]+N[t*4+1]*n[1]+N[t*4+2]*n[2]>.9995&&Math.abs(dist(t,n)-I.d)<.005)return I;}return null;};
 const marca=async()=>{sh.fill(0);quente.fill(0);for(let t=0;t<nt;t++){if((t&65535)===0)await talvez();if(TC[t]<0||!movP.has(TC[t]))continue;const I=planoDe(t);if(!I)continue;sh[t]=I.off;
   faixa(t,rr);for(let i=rr[0];i<=rr[1];i++)for(let j=rr[2];j<=rr[3];j++)quente[j*GX+i]=1;}};
 // verificação: a face que saiu não pode cair em cima de outra que já estava ali (frisos a 1 cm, placas, batentes)
 for(let volta=0;volta<3;volta++){await marca();const bater=new Set();
  await varre((ti,tj)=>{const Ii=sh[ti]?planoDe(ti):null,Ij=sh[tj]?planoDe(tj):null;let I=Ii&&Ij?(area[Ii.c]<=area[Ij.c]?Ii:Ij):(Ii||Ij);if(I)bater.add(I);},true);
  rel['volta'+volta]=bater.size;if(!bater.size)break;
  // caiu em cima de outra: tenta meia camada para dentro, depois meia e uma para fora (mantém a ordem das camadas)
  for(const I of bater){I.tent=(I.tent||0)+1;const o0=Math.min(Math.max(I.cor,1),3)*EPS,cand=[o0-.5*EPS,o0+.5*EPS,o0+EPS];I.off=cand[Math.min(I.tent-1,2)];}}
 // ---------- aplica: os vértices dos planos que saem andam pela normal (no espaço da malha) ----------
 const inv=new T.Matrix4(),m3=new T.Matrix3(),dv=new T.Vector3();
 const qk=(t,c)=>Math.round(P[t*9+c*3]*1000)+','+Math.round(P[t*9+c*3+1]*1000)+','+Math.round(P[t*9+c*3+2]*1000);
 // registro (só para exportar ao Godot: window.arcanoDescolaRegistro=true antes de rodar): posição no mundo de cada
 // vértice que andou, quanto andou e as normais dele; 'amb' marca ponto que outra peça parada também usa
 const REG=window.arcanoDescolaRegistro?{ents:(window.arcanoDescolaRegistroEnts=window.arcanoDescolaRegistroEnts||new Map()),disp:new Set()}:null,nm3=new T.Matrix3(),nv=new T.Vector3();
 const qn=v=>Math.round(v.x*20)+','+Math.round(v.y*20)+','+Math.round(v.z*20);
 const porMalha=new Map();for(const c of movP.keys()){const mi=dono[c];let L=porMalha.get(mi);if(!L){L=[];porMalha.set(mi,L);}L.push(c);}
 for(const [mi,L] of porMalha){const M=meshes[mi],o=M.o;const minhas=new Set(L);
  // deslocamento de cada posição (mm) dos pedaços: soma dos planos que passam por ela (cada plano uma vez)
  const desl=new Map();
  for(let t=M.t0;t<M.t1;t++){if(!minhas.has(TC[t]))continue;const I=planoDe(t);if(!I)continue;
   for(let c=0;c<3;c++){const key=TC[t]+'|'+qk(t,c);let D=desl.get(key);if(!D){D={v:[0,0,0],ps:new Set()};desl.set(key,D);}
    if(D.ps.has(I))continue;D.ps.add(I);D.v[0]+=I.n[0]*I.off;D.v[1]+=I.n[1]*I.off;D.v[2]+=I.n[2]*I.off;}}
  if(!desl.size)continue;
  if((usos.get(o.geometry)||0)>1){o.geometry=o.geometry.clone();}   // geometria compartilhada: a cópia é só desta peça
  const g=o.geometry,pa=g.attributes.position,ix=g.index;inv.copy(o.matrixWorld).invert();m3.setFromMatrix4(inv);
  const feito=new Set();
  for(let t=M.t0;t<M.t1;t++){if(!minhas.has(TC[t]))continue;
   for(let c=0;c<3;c++){const D=desl.get(TC[t]+'|'+qk(t,c));if(!D)continue;const lt=t-M.t0,vi=ix?ix.getX(lt*3+c):lt*3+c;if(feito.has(vi))continue;feito.add(vi);
    dv.set(D.v[0],D.v[1],D.v[2]).applyMatrix3(m3);pa.setXYZ(vi,pa.getX(vi)+dv.x,pa.getY(vi)+dv.y,pa.getZ(vi)+dv.z);}}
  pa.needsUpdate=true;g.computeBoundingSphere();if(g.boundingBox)g.computeBoundingBox();
  if(REG){const nA=g.attributes.normal;nm3.getNormalMatrix(o.matrixWorld);
   for(let t=M.t0;t<M.t1;t++){if(!minhas.has(TC[t]))continue;
    for(let c=0;c<3;c++){const pk=qk(t,c),key=TC[t]+'|'+pk,D=desl.get(key);if(!D)continue;REG.disp.add(key);
     let E=REG.ents.get(pk);if(!E){E={p:[P[t*9+c*3],P[t*9+c*3+1],P[t*9+c*3+2]],vs:[],nd:new Set(),amb:0};REG.ents.set(pk,E);}
     // variantes: deslocamentos diferentes no mesmo ponto (peças diferentes) ficam separados, com as normais e o nome
     let V=null;for(const w of E.vs)if(Math.abs(w.d[0]-D.v[0])+Math.abs(w.d[1]-D.v[1])+Math.abs(w.d[2]-D.v[2])<1e-4){V=w;break;}
     if(!V){V={d:D.v.slice(),n:new Set(),nomes:new Set()};E.vs.push(V);if(E.vs.length>1)E.amb|=2;}
     V.nomes.add(o.name||M.nome||'');
     if(nA){const lt=t-M.t0,vi=ix?ix.getX(lt*3+c):lt*3+c;nv.fromBufferAttribute(nA,vi).applyMatrix3(nm3).normalize();V.n.add(qn(nv));}}}}
  rel.movidas+=L.length;rel.nomes[M.nome]=(rel.nomes[M.nome]||0)+L.length;await talvez();}
 if(REG){for(let mi=0;mi<meshes.length;mi++){const M=meshes[mi],o=M.o,g=o.geometry,nA=g.attributes.normal,ix=g.index;nm3.getNormalMatrix(o.matrixWorld);
   for(let t=M.t0;t<M.t1;t++)for(let c=0;c<3;c++){const pk=qk(t,c),E=REG.ents.get(pk);if(!E)continue;if(TC[t]>=0&&REG.disp.has(TC[t]+'|'+pk))continue;
    E.amb|=1;if(nA){const lt=t-M.t0,vi=ix?ix.getX(lt*3+c):lt*3+c;nv.fromBufferAttribute(nA,vi).applyMatrix3(nm3).normalize();E.nd.add(qn(nv));}}
   if(mi%8===0)await talvez();}
  rel.registro=REG.ents;}
 rel.seg=+((performance.now()-t0)/1000).toFixed(1);
 if(opt.raiz)(window.arcanoDescola.extras=window.arcanoDescola.extras||[]).push(rel);else{window.arcanoDescola.relatorio=rel;window.arcanoDescolaPronto=true;}
 console.info('[Descola] '+rel.parte+': '+rel.pares+' pares coplanares; '+rel.movidas+' peças com face empurrada (1–3 cm) em '+rel.seg+' s');
 return rel;
}
// uma passada por vez (o mundo e as partes montadas depois — andares das minas — entram na fila)
let fila=Promise.resolve();
const fraco=()=>{const n=navigator,ua=n.userAgent||'';return (n.deviceMemory&&n.deviceMemory<4)||/Android|iPhone|iPad|iPod|Mobile/i.test(ua)||(n.maxTouchPoints>1&&/Macintosh/.test(ua));};
const agenda=opt=>{const q=location.search;if(/[?&]semdescola/.test(q))return Promise.resolve(null);   // teste: medir sem a correção
 if(!(opt&&opt.raiz)&&fraco()&&!/[?&]descola=1/.test(q)){window.arcanoDescolaPronto=true;return Promise.resolve(null);}
 return (fila=fila.then(()=>run(opt)).catch(e=>console.warn('[Descola]',e)));};
window.arcanoDescola={run:agenda,relatorio:null};
// espera o mundo montar (castelo, vilas, casas, porto, árvore gigante) e roda uma vez
let tent=0;
function espera(){if(/[?&]semdescola/.test(location.search))return;   // teste: medir sem a correção
 const api=window.arcanoWaterV1226,S=api&&api.scene;
 const pronto=S&&window.arcanoCastle&&window.arcanoVilas&&window.arcanoSalasVilas&&S.getObjectByName('Vila da Montanha · casas')&&S.getObjectByName('Capitania · andar de cima');
 if(!pronto&&tent++<90){setTimeout(espera,1000);return;}
 if(!S){return;}
 setTimeout(()=>agenda(),3000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',espera);else espera();
})();
