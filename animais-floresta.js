/* Animais da floresta — 1º: CERVOS.
   Modelo próprio, estilo anime: corpo com pelagem pintada (dorso castanho, barriga e garganta creme,
   mancha branca na traseira), pescoço, cabeça com focinho, olhos brilhantes, orelhas grandes e
   chifres ramificados nos machos; filhotes com pintas. Pernas articuladas (ombro/quadril + joelho/jarrete).
   Comportamento (manadas pela ilha, em clareiras da mata):
   - pastar (abaixa o pescoço e mastiga), andar devagar atrás de capim novo, seguir a manada;
   - orelhas e cauda se mexem sozinhas;
   - quando o personagem se aproxima: para, levanta a cabeça e olha para ele (alerta);
   - perto demais ou chegando correndo: foge em galope saltado, a manada junto, e depois se acalma.
   Desempenho: só anima e mostra os cervos até ~150 m do personagem; poucos objetos por cervo. */
(function(){
'use strict';
const T=window.THREE;if(!T)return;
const PI=Math.PI,TAU=PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,rr=(a,b)=>a+Math.random()*(b-a);
const sstep=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const angDiff=(a,b)=>{let d=(b-a)%TAU;if(d>PI)d-=TAU;if(d<-PI)d+=TAU;return d;};

/* ---------- geometria com cor por vértice (malha indexada: sombreado suave) ---------- */
function Builder(){const P=[],N=[],C=[],I=[],col=new T.Color();
 const B={
  add(geo,color,m,colorFn){let g=geo.clone();if(m)g.applyMatrix4(m);if(!g.index){const a=[];for(let i=0;i<g.attributes.position.count;i++)a.push(i);g.setIndex(a);}
   g.computeVertexNormals();
   const p=g.attributes.position,n=g.attributes.normal,ix=g.index,base=P.length/3;if(color)col.set(color);
   for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);P.push(x,y,z);N.push(n.getX(i),n.getY(i),n.getZ(i));
    if(colorFn){const c=colorFn(x,y,z,n.getX(i),n.getY(i),n.getZ(i));C.push(c[0],c[1],c[2]);}else C.push(col.r,col.g,col.b);}
   for(let i=0;i<ix.count;i++)I.push(base+ix.getX(i));
   return B;},
  ell(x,y,z,rx,ry,rz,color,colorFn,seg){const g=new T.SphereGeometry(1,seg||16,Math.max(8,(seg||16)*.7|0));g.scale(rx,ry,rz);g.translate(x,y,z);return B.add(g,color,null,colorFn);},
  sweep(path,prof,o,color,colorFn){return B.add(sweepGeo(path,prof,o),color,null,colorFn);},
  build(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('normal',new T.Float32BufferAttribute(N,3));g.setAttribute('color',new T.Float32BufferAttribute(C,3));
   g.setIndex(P.length/3>65535?new T.Uint32BufferAttribute(I,1):new T.Uint16BufferAttribute(I,1));g.computeBoundingSphere();return g;}};
 return B;}
// curva suave (Catmull-Rom) passando pelos pontos-chave; serve para números e para listas
function spline(keys,s){const n=keys.length-1;if(n<1)return keys[0];const f=clamp(s,0,1)*n,i=Math.min(n-1,Math.floor(f)),t=f-i;
 const k0=keys[Math.max(0,i-1)],k1=keys[i],k2=keys[i+1],k3=keys[Math.min(n,i+2)];
 const cr=(p0,p1,p2,p3)=>.5*(2*p1+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t);
 if(typeof k1==='number')return cr(k0,k1,k2,k3);return k1.map((_,j)=>cr(k0[j]||0,k1[j]||0,k2[j]||0,k3[j]||0));}
// "massa" esticada ao longo de uma curva: em cada ponto, uma elipse de meia-largura w e meia-altura d.
// ca/cb: quanto do comprimento arredonda as pontas (0 = ponta aberta). Lados ligados sem costura -> sombra suave.
function sweepGeo(path,prof,o){o=o||{};const n=o.n||24,m=o.m||16,ca=o.ca==null?.15:o.ca,cb=o.cb==null?.15:o.cb;
 const pos=[],idx=[],X=new T.Vector3(1,0,0),Y=new T.Vector3(0,1,0),tg=new T.Vector3(),sd=new T.Vector3(),up=new T.Vector3();
 const at=s=>new T.Vector3(...spline(path,s));
 for(let i=0;i<=n;i++){const s=i/n,P=at(s);tg.subVectors(at(Math.min(1,s+.01)),at(Math.max(0,s-.01))).normalize();
  sd.copy(Math.abs(tg.dot(X))>.9?Y:X);up.crossVectors(tg,sd).normalize();sd.crossVectors(up,tg).normalize();
  let c=1;if(ca>0&&s<ca)c=Math.sqrt(Math.max(0,1-Math.pow(1-s/ca,2)));if(cb>0&&s>1-cb)c=Math.min(c,Math.sqrt(Math.max(0,1-Math.pow(1-(1-s)/cb,2))));
  const pr=spline(prof,s),w=pr[0],d=pr[1],sq=pr[2]||0;
  for(let j=0;j<m;j++){const a=j/m*TAU;let cx=Math.cos(a),sy=Math.sin(a);
   if(sq>0){const e=1/(1+sq);cx=Math.sign(cx)*Math.pow(Math.abs(cx),e);sy=Math.sign(sy)*Math.pow(Math.abs(sy),e);}   // seção mais "quadrada"
   pos.push(P.x+(sd.x*cx*w+up.x*sy*d)*c,P.y+(sd.y*cx*w+up.y*sy*d)*c,P.z+(sd.z*cx*w+up.z*sy*d)*c);}}
 for(let i=0;i<n;i++)for(let j=0;j<m;j++){const a=i*m+j,b=i*m+(j+1)%m,c=(i+1)*m+j,d=(i+1)*m+(j+1)%m;idx.push(a,b,c,b,d,c);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);return g;}

/* ---------- materiais (cel-shading do jogo + contorno) ---------- */
const furMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.85,metalness:0});
const inkMat=new T.MeshBasicMaterial({color:'#2b2140',side:T.BackSide});
inkMat.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed+=normal*.011;');};
inkMat.customProgramCacheKey=()=>'deer-ink-v2';
const meshWithInk=(geo,ink)=>{const m=new T.Mesh(geo,furMat);m.castShadow=true;if(ink){const o=new T.Mesh(geo,inkMat);m.add(o);}return m;};

/* ---------- pelagem ---------- */
const C3=h=>{const c=new T.Color(h);return [c.r,c.g,c.b];};
const mixC=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
const grain=(x,y,z)=>.95+.07*Math.sin(x*41+z*37+y*23)+.03*Math.sin(x*97-y*83+z*71);
const shade=(c,x,y,z)=>{const v=grain(x,y,z);return [c[0]*v,c[1]*v,c[2]*v];};
function coat(kind){
 const back=C3(kind==='fawn'?'#ad683b':kind==='doe'?'#a96b40':'#94582f'),dark=C3('#6a3c20'),flank=C3(kind==='buck'?'#a8693c':'#b67a4a'),cream=C3('#f1e6cf'),white=C3('#fbf8f0');
 return (x,y,z,nx,ny,nz)=>{
  // dorso castanho, flanco um pouco mais claro, barriga creme (pela direção da pele), risca escura no lombo
  let c=mixC(back,flank,sstep((.55-ny)/.6));
  c=mixC(c,cream,sstep((-ny-.1)/.45));
  if(ny>.82&&Math.abs(x)<.045&&z>-.5)c=mixC(c,dark,.55);
  if(z<-.5&&y>.84&&y<1.17&&Math.abs(x)<.13)c=white;                              // espelho branco em volta da cauda
  if(kind==='fawn'&&ny>.05&&ny<.85&&z>-.5&&z<.45){const s=Math.sin(z*30+(x>0?1:2))*Math.sin(y*34+x*14);if(s>.7)c=white;}
  return shade(c,x,y,z);};
}

/* ---------- um cervo (peças articuladas) ---------- */
function makeDeer(kind){
 const S=kind==='fawn'?.62:kind==='doe'?.9:1,buck=kind==='buck';
 const root=new T.Group();root.name='Cervo ('+(buck?'macho':kind==='doe'?'fêmea':'filhote')+')';
 const body=new T.Group();body.scale.setScalar(S);root.add(body);
 const fur=coat(kind),brown=C3(buck?'#8c522b':'#a0653b'),tan=C3('#97663f'),cream=C3('#efe3c9'),hoof='#2a1a12';
 // tronco: peito fundo, cernelha alta, cintura recolhida, garupa redonda
 {const B=Builder();
  const K=[ // z, topo, baixo, meia-largura
   [-.66,1.13,.95,.09],[-.56,1.21,.82,.18],[-.42,1.25,.8,.23],[-.25,1.225,.87,.235],[-.05,1.215,.81,.255],[.15,1.24,.75,.25],[.32,1.3,.73,.22],[.48,1.27,.78,.17],[.62,1.17,.92,.09]];
  B.sweep(K.map(k=>[0,(k[1]+k[2])/2,k[0]]),K.map(k=>[k[3],(k[1]-k[2])/2]),{n:40,m:28,ca:.1,cb:.12},null,fur);
  body.add(meshWithInk(B.build(),true));}
 const tail=new T.Group();tail.position.set(0,1.13,-.63);body.add(tail);
 {const B=Builder();B.sweep([[0,.01,0],[0,-.06,-.05],[0,-.15,-.06]],[[.045,.028],[.052,.032],[.034,.02]],{n:10,m:12,ca:.3,cb:.35},null,(x,y,z,nx,ny,nz)=>nz<-.25?C3('#8c522b'):C3('#ffffff'));tail.add(meshWithInk(B.build(),true));}
 // pescoço → cabeça (o macho tem pescoço mais grosso)
 const neck=new T.Group();neck.position.set(0,1.14,.47);body.add(neck);
 {const B=Builder(),th=buck?1.12:1;
  B.sweep([[0,-.02,-.01],[0,.16,.06],[0,.36,.14],[0,.54,.22]],[[.13*th,.13*th,buck?.4:0],[.125*th,.155*th,buck?.3:0],[.095*th,.115*th,0],[.08,.095,0]],{n:22,m:18,ca:.12,cb:.08},null,
   (x,y,z,nx,ny,nz)=>{let c=brown;if(nz>.3&&ny<.3)c=mixC(c,cream,.3*sstep((nz-.3)/.4));if(y>.4&&nz>.3&&ny<.05)c=C3('#fbf6ea');if(buck&&ny>.3&&y<.3)c=mixC(c,C3('#6f4a30'),.5);return shade(c,x,y,z);});
  neck.add(meshWithInk(B.build(),true));}
 const head=new T.Group();head.position.set(0,.56,.25);neck.add(head);
 {const B=Builder();
  // crânio largo nos olhos afinando até o focinho
  B.sweep([[0,.07,-.07],[0,.06,.06],[0,.02,.2],[0,-.02,.31],[0,-.024,.365]],[[.08,.09],[.112,.118],[.074,.084],[.054,.058],[.04,.042]],{n:22,m:18,ca:.22,cb:.12},null,
   (x,y,z,nx,ny,nz)=>{let c=C3(buck?'#8a5530':'#9a6038');
    if(ny<-.35)c=C3('#efe2c8');                                   // queixo/garganta clara
    if(z>.26&&z<.315&&ny>-.35)c=C3('#efe6d4');                    // faixa clara atrás do nariz
    if(ny>.55&&z<.17&&z>-.02)c=mixC(c,C3('#5e3820'),.45);          // testa mais escura
    return shade(c,x,y,z);});
  B.ell(0,-.016,.372,.042,.03,.026,'#17110f',null,12);                                  // nariz
  for(const s of [-1,1])B.ell(s*.021,-.02,.393,.01,.008,.006,'#000000',null,6);         // narinas
  B.ell(0,-.05,.325,.034,.004,.035,'#3a2418',null,8);                                   // boca
  B.ell(0,-.058,.29,.034,.022,.045,'#f3ead8',null,10);                                  // queixo
  for(const s of [-1,1]){
   B.ell(s*.088,.066,.118,.036,.041,.043,'#efe6d6',null,12);                           // anel claro do olho
   B.ell(s*.099,.066,.12,.028,.033,.035,'#120c0a',null,12);                            // olho
   B.ell(s*.118,.082,.134,.009,.009,.009,'#ffffff',null,6);                            // brilho
   B.ell(s*.09,.104,.112,.032,.008,.022,'#4a2a18',null,8);                             // sobrancelha
   B.ell(s*.083,.03,.185,.016,.011,.028,'#3a2416',null,8);}                            // glândula lacrimal
  head.add(meshWithInk(B.build(),true));}
 const ears=[];
 for(const s of [-1,1]){const e=new T.Group();e.position.set(s*.08,.13,.0);e.rotation.set(-.2,s*.35,s*-.9);head.add(e);
  const g=sweepGeo([[0,0,0],[0,.08,0],[0,.16,0],[0,.215,0]],[[.026,.012],[.06,.015],[.058,.014],[.012,.006]],{n:14,m:14,ca:.08,cb:.25});
  {const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,p.getZ(i)-Math.max(0,1-Math.pow(x/.062,2))*.022);}}   // concha voltada para a frente
  const B=Builder();B.add(g,null,null,(x,y,z,nx,ny,nz)=>{if(y>.185)return C3('#3e2616');if(nz>.25&&Math.abs(x)<.044&&y>.02)return y<.09?C3('#e8b8a8'):C3('#f4ebe0');return brown;});
  e.add(meshWithInk(B.build(),true));ears.push({g:e,s,ph:Math.random()*10});}
 if(buck){const B=Builder(),antC=C3('#e2cfa6'),tipC=C3('#f6efe0'),aCol=(x,y,z)=>mixC(antC,tipC,sstep((y-.45)/.25));
  for(const s of [-1,1]){
   B.ell(s*.05,.155,.025,.03,.014,.03,'#c9b48a',null,10);                               // roseta (base do chifre)
   B.sweep([[s*.05,.15,.025],[s*.13,.3,-.03],[s*.2,.45,-.02],[s*.22,.58,.05],[s*.18,.68,.12]],[[.024,.024],[.019,.019],[.016,.016],[.012,.012],[.006,.006]],{n:16,m:8,ca:0,cb:.06},null,aCol);
   const tine=(a,b,c,r)=>B.sweep([a,b,c],[[r,r],[r*.7,r*.7],[r*.3,r*.3]],{n:8,m:7,ca:0,cb:.15},null,aCol);
   tine([s*.08,.2,.02],[s*.1,.25,.1],[s*.09,.27,.17],.012);                            // galho da testa (para a frente)
   tine([s*.16,.37,-.03],[s*.17,.47,0],[s*.16,.55,.04],.012);
   tine([s*.205,.48,-.01],[s*.25,.58,-.02],[s*.28,.66,-.02],.011);}
  head.add(meshWithInk(B.build(),true));}
 // pernas: ombro/quadril → joelho/jarrete → canela → boleto → quartela → casco de duas unhas
 const legs=[];
 for(const [fx,front] of [[-1,true],[1,true],[-1,false],[1,false]]){
  const hip=new T.Group();hip.position.set(fx*.15,front?1.0:1.04,front?.4:-.42);body.add(hip);
  const inner=c=>(x,y,z,nx)=>{let k=c(y);if(nx*fx<-.35)k=mixC(k,cream,.55);return shade(k,x,y,z);};
  const B=Builder();
  if(front)B.sweep([[0,.1,.02],[0,-.12,.045],[0,-.3,.03],[0,-.45,.02]],[[.072,.13],[.068,.11],[.048,.062],[.038,.044]],{n:18,m:14,ca:.2,cb:.12},null,inner(y=>y>-.15?brown:mixC(brown,tan,.6)));
  else B.sweep([[0,.12,.04],[0,-.12,.09],[0,-.3,-.02],[0,-.42,-.1]],[[.1,.2],[.092,.17],[.052,.085],[.04,.055]],{n:20,m:14,ca:.25,cb:.12},null,inner(y=>y>-.2?brown:mixC(brown,tan,.6)));
  hip.add(meshWithInk(B.build(),true));
  const knee=new T.Group();knee.position.set(0,front?-.45:-.42,front?.02:-.1);hip.add(knee);
  const B2=Builder(),low=inner(()=>tan),L=front?.37:.47,pz=front?.045:.085,fz=front?.005:.045;
  if(front)B2.ell(0,0,.005,.042,.045,.048,null,low,10);else B2.ell(0,.02,-.05,.026,.045,.03,null,low,10);   // joelho / ponta do jarrete
  B2.sweep([[0,.01,0],[0,-L*.5,fz*.5],[0,-L,fz]],[[.034,.042],[.025,.03],[.027,.032]],{n:10,m:10,ca:0,cb:0},null,low);
  B2.ell(0,-L,fz,.032,.035,.04,null,low,10);                                         // boleto
  B2.sweep([[0,-L,fz],[0,-L-.05,fz+.02],[0,-L-.09,pz]],[[.026,.03],[.027,.031],[.03,.034]],{n:6,m:10,ca:0,cb:0},null,low);
  for(const t of [-1,1]){B2.ell(t*.017,-L-.135,pz+.018,.018,.044,.034,hoof,null,10);      // casco (duas unhas)
   B2.ell(t*.02,-L-.02,fz-.035,.009,.013,.009,hoof,null,6);}                           // unhas de cima
  knee.add(meshWithInk(B2.build(),true));
  legs.push({hip,knee,front,side:fx});}
 return {root,body,neck,head,tail,ears,legs,S,kind};
}

/* ---------- animação (pernas, pescoço, orelhas, cauda) — usada no jogo e na enciclopédia dos bichos ---------- */
function animarCervo(d,dt,now,dxp,dzp){
  const running=d.speed>3,walking=d.speed>.15;
  d.phase+=dt*(running?d.speed*.95:d.speed*2.6+.0001)/Math.max(.6,d.S);
  const ph=d.phase;
  let bob=0,bodyPitch=0;
  for(const L of d.legs){
   let swing=0,bend=0;
   if(running){const p=ph+(L.front?0:PI*.9)+(L.side>0?.18:0);swing=Math.sin(p)*.95;bend=Math.max(0,Math.sin(p+1.2))*1.25*(L.front?1:-1);}
   else if(walking){const off=L.front?(L.side<0?0:PI):(L.side<0?PI*1.5:PI*.5),p=ph+off;swing=Math.sin(p)*.42;bend=Math.max(0,Math.sin(p+1.3))*.7*(L.front?1:-1);}
   L.hip.rotation.x=swing;L.knee.rotation.x=(L.front?bend:-Math.abs(bend)*.4+(running?Math.sin(ph+2)*.4:0));}
  if(running){bob=Math.abs(Math.sin(ph))*.22;bodyPitch=Math.sin(ph+.6)*.12;}else if(walking){bob=Math.abs(Math.sin(ph*2))*.025;}
  let wantNeck=0,wantHeadYaw=0,chew=0;
  if(d.st==='graze'&&!walking){wantNeck=2.2;chew=Math.sin(now*.011)*.06;bodyPitch=.08;}
  else if(d.st==='alert'){wantNeck=-.25;wantHeadYaw=clamp(angDiff(d.yaw,Math.atan2(-dxp,-dzp)),-1.1,1.1);}
  else if(running)wantNeck=-.1+Math.sin(ph)*.12;else if(walking)wantNeck=.15+Math.sin(ph*2)*.04;
  d.neckPitch+=(wantNeck-d.neckPitch)*Math.min(1,dt*3.5);d.headYaw+=(wantHeadYaw-d.headYaw)*Math.min(1,dt*4);
  const flinch=d.stagger>0?Math.sin(d.stagger*30)*.08:0;
  d.body.position.y=bob*d.S;d.body.rotation.set(bodyPitch,0,flinch);d.neck.rotation.x=d.neckPitch;d.neck.rotation.y=d.headYaw*.5;d.head.rotation.x=-d.neckPitch*.45+chew;d.head.rotation.y=d.headYaw*.5;
  for(const e of d.ears){const tw=Math.max(0,Math.sin(now*.0013+e.ph*3))>.985?Math.sin(now*.05)*.5:0;
   e.g.rotation.x=-.2+(d.st==='alert'?-.35:0)+tw*.6;e.g.rotation.z=e.s*(d.st==='alert'?-.55:-.9)+tw*.3;}
  d.tail.rotation.x=(d.st==='flee'?-1.3:-.2)+Math.sin(now*.02+d.phase)*(d.st==='flee'?.25:.12);
  d.root.position.set(d.x,d.y,d.z);d.root.rotation.set(d.pitch,d.yaw,0,'YXZ');
}
window.arcanoKitCervo={makeDeer,animarCervo};

/* ---------- mundo ---------- */
function install(){
 const api=window.arcanoWaterV1226,FA=window.arcanoFundoAquatico,I=window.arcanoIsland;
 if(!api||!api.scene||!FA||!FA.ground||!I||!I.forest||!I.forest.spots){setTimeout(install,800);return;}
 const scene=api.scene,ground=FA.ground,water=FA.water,O=window.arcanoObstacles,NG=window.arcanoNoGrass||[];
 const C=I.center,R=I.radius;
 const okSpot=(x,z)=>{const d=Math.hypot(x-C.x,z-C.z);if(d>R-22||d<(I.cityRadius||130)+12)return false;
  if(Math.abs(x)<70&&Math.abs(z)<56)return true;                                  // área central (prado)
  const w=water(x,z);if(w&&w.depth>.05)return false;
  for(const f of NG)if(f(x,z))return false;
  const y=ground(x,z);if(Math.abs(ground(x+1.5,z)-y)>1.1||Math.abs(ground(x,z+1.5)-y)>1.1)return false; // íngreme
  return true;};
 const canGo=(x0,z0,x1,z1)=>{if(!okSpot(x1,z1))return false;const w=water(x1,z1);if(w&&w.depth>.25)return false;if(O&&O.blocked&&O.blocked(x0,z0,x1,z1))return false;return true;};
 // clareiras: pontos sem árvore a 6 m, mas com mata em volta (bordas de floresta, onde cervos gostam de pastar)
 const spots=I.forest.spots,grid=new Map(),G=12;
 for(const s of spots){const k=Math.floor(s.x/G)*4096+Math.floor(s.z/G);let l=grid.get(k);if(!l)grid.set(k,l=[]);l.push(s);}
 const treesNear=(x,z,r)=>{let n=0,min=1e9;for(let i=Math.floor((x-r)/G);i<=Math.floor((x+r)/G);i++)for(let j=Math.floor((z-r)/G);j<=Math.floor((z+r)/G);j++){const l=grid.get(i*4096+j);if(l)for(const s of l){const d=Math.hypot(s.x-x,s.z-z);if(d<r){n++;min=Math.min(min,d);}}}return {n,min};};
 const homes=[];
 for(let tries=0;tries<4000&&homes.length<(innerWidth<680?4:7);tries++){
  const a=Math.random()*TAU,d=rr((I.cityRadius||130)+30,R-40),x=C.x+Math.cos(a)*d,z=C.z+Math.sin(a)*d;
  if(!okSpot(x,z))continue;const t=treesNear(x,z,26);if(t.min<6||t.n<10)continue;
  if(homes.some(h=>Math.hypot(h.x-x,h.z-z)<90))continue;homes.push({x,z});}
 homes.unshift({x:28,z:30}); // uma manada no prado da área central (perto do começo do jogo)
 const root=new T.Group();root.name='Animais da floresta · cervos';scene.add(root);
 const deer=[],herds=[];
 const BIRTH_MIN=50,BIRTH_MAX=90,GROW_TIME=300;          // segundos: espera para nascer e para o filhote virar adulto
 function spawn(herd,kind,x,z,o){o=o||{};const m=makeDeer(kind);
  const d={...m,herd,x,z,y:ground(x,z),yaw:o.yaw!=null?o.yaw:rr(0,TAU),st:'graze',t:rr(2,8),tx:x,tz:z,speed:0,phase:Math.random()*10,neckPitch:0,headYaw:0,pitch:0,
   walkSpeed:kind==='fawn'?.8:1.05,runSpeed:kind==='fawn'?7.4:8.6,mother:o.mother||null,alive:true,notice:0,roll:0,slow:0,stagger:0,
   hp:kind==='fawn'?45:kind==='doe'?80:100,grow:o.grow!=null?o.grow:null,future:o.future||null};
  d.maxHp=d.hp;
  if(kind==='fawn'&&!d.mother)d.mother=herd.members.find(q=>q.alive&&q.kind==='doe')||herd.members.find(q=>q.alive&&q.kind!=='fawn')||null;
  if(d.grow!=null)applyGrowth(d);
  herd.members.push(d);deer.push(d);root.add(d.root);return d;}
 function applyGrowth(d){const s=lerp(.38,.86,d.grow);d.body.scale.setScalar(s);d.S=s;d.walkSpeed=lerp(.6,.95,d.grow);d.runSpeed=lerp(5.2,8,d.grow);}
 for(const h of homes){
  const n=homes.indexOf(h)===0?3:2+Math.floor(Math.random()*3),herd={home:h,alarm:0,fleeDir:0,members:[],births:[],cap:n+1};herds.push(herd);
  for(let i=0;i<n;i++){const kind=i===0&&Math.random()<.75?'buck':(i===n-1&&n>2?'fawn':'doe');
   let x=h.x+rr(-6,6),z=h.z+rr(-6,6);if(!okSpot(x,z)){x=h.x;z=h.z;}spawn(herd,kind,x,z);}
 }
 // obstáculo leve: o personagem não atravessa o cervo vivo
 const state={px:0,pz:0,speed:0,run:false};let lx=null,lz=null;
 if(O&&O.blocked){const prev=O.blocked;O.blocked=function(fx,fz,tx,tz){for(const d of deer){if(!d.alive||!d.root.visible)continue;const r=.45*d.S;if(Math.hypot(tx-d.x,tz-d.z)<r&&Math.hypot(tx-d.x,tz-d.z)<Math.hypot(fx-d.x,fz-d.z))return true;}return prev.call(this,fx,fz,tx,tz);};}
 const scare=(herd,fromX,fromZ)=>{const lead=herd.members.find(q=>q.alive)||herd.members[0];if(!lead)return;if(herd.alarm<=0)herd.fleeDir=Math.atan2(lead.x-fromX,lead.z-fromZ);herd.alarm=rr(4,6);};

 /* ---------- magias acertam os cervos ---------- */
 const DMG=[45,65,50],RAD=[1.25,1.9,1.5],SPD=[18,11,15];
 addEventListener('arcano-magia',ev=>{const m=ev.detail;if(!m)return;const o=m.origin,dv=m.direction,len=(m.len||10)+(m.slot===1?1.5:0);
  for(const d of deer){if(!d.alive)continue;const cx=d.x,cy=d.y+.85*d.S,cz=d.z;const wx=cx-o.x,wy=cy-o.y,wz=cz-o.z;
   const tAlong=clamp(wx*dv.x+wy*dv.y+wz*dv.z,0,len),px=o.x+dv.x*tAlong,py=o.y+dv.y*tAlong,pz=o.z+dv.z*tAlong;
   const miss=Math.hypot(cx-px,(cy-py)*.7,cz-pz),r=RAD[m.slot]*(m.slot===1?(.5+tAlong/len):1)+.35*d.S;
   if(miss<r){const delay=tAlong/SPD[m.slot]*1000;setTimeout(()=>hit(d,DMG[m.slot]*(1-.35*miss/r),m.slot,o),delay);}
   else if(Math.hypot(wx,wz)<25)scare(d.herd,o.x,o.z);}});
 function hit(d,dmg,slot,o){if(!d.alive)return;d.hp-=dmg;d.stagger=.35;if(slot===2)d.slow=3.5;
  if(d.hp<=0)die(d);scare(d.herd,o.x,o.z);d.notice=3;}
 function die(d){d.alive=false;d.st='dead';d.deathT=0;d.speed=0;d.rollDir=Math.random()<.5?-1:1;
  d.herd.births.push(rr(BIRTH_MIN,BIRTH_MAX));}          // a manada repõe com um filhote depois de um tempo
 function remove(d){if(!deer.includes(d))return;root.remove(d.root);d.root.traverse(o=>{if(o.isMesh&&o.geometry)o.geometry.dispose();});
  deer.splice(deer.indexOf(d),1);const m=d.herd.members;m.splice(m.indexOf(d),1);for(const q of deer)if(q.mother===d)q.mother=null;}
 function birth(herd){
  const adults=herd.members.filter(q=>q.alive&&q.kind!=='fawn');
  if(!adults.length){ // a manada acabou: um casal de outra manada chega pela mata (fora da vista do jogador)
   let x=herd.home.x,z=herd.home.z;for(let k=0;k<20;k++){const a=rr(0,TAU),tx=herd.home.x+Math.cos(a)*rr(10,22),tz=herd.home.z+Math.sin(a)*rr(10,22);if(okSpot(tx,tz)&&Math.hypot(tx-state.px,tz-state.pz)>45){x=tx;z=tz;break;}}
   if(Math.hypot(x-state.px,z-state.pz)<45)return false;
   spawn(herd,'doe',x,z);spawn(herd,'buck',x+1.5,z+1);return true;}
  if(herd.members.filter(q=>q.alive).length>=herd.cap)return true;
  const mom=adults.find(q=>q.kind==='doe')||adults[0];
  const a=rr(0,TAU),x=mom.x+Math.cos(a)*1.2,z=mom.z+Math.sin(a)*1.2,ok=okSpot(x,z);
  const f=spawn(herd,'fawn',ok?x:mom.x,ok?z:mom.z,{grow:0,future:Math.random()<.5?'buck':'doe',mother:mom,yaw:mom.yaw});
  f.st='walk';f.tx=mom.x;f.tz=mom.z;f.t=3;return true;}
 function grownUp(d){ // o filhote cresceu: vira macho (com chifres) ou fêmea, no mesmo lugar
  const n=spawn(d.herd,d.future||'doe',d.x,d.z,{yaw:d.yaw});n.st=d.st==='flee'?'flee':'graze';n.t=d.t;n.fleeYaw=d.fleeYaw;n.y=d.y;n.root.visible=d.root.visible;remove(d);}

 /* ---------- comportamento ---------- */
 function choose(d){
  const h=d.herd.home;let x=d.x,z=d.z;
  const mom=d.mother&&d.mother.alive?d.mother:null;
  for(let k=0;k<12;k++){const ref=mom&&Math.random()<.85?mom:h,r=mom?rr(1,3):rr(2,14),a=rr(0,TAU);const tx=ref.x+Math.cos(a)*r,tz=ref.z+Math.sin(a)*r;if(okSpot(tx,tz)){x=tx;z=tz;break;}}
  d.tx=x;d.tz=z;}
 // Percepção: VISÃO (vê bem o que está à frente; atrás é ponto cego) + AUDIÇÃO (passos; correr faz muito barulho).
 // Chegar pelas costas andando devagar dá pouca chance de ser notado; de frente ou correndo, o cervo nota logo.
 function perceive(d,dt,dp,dxp,dzp,playing){
  if(!playing||dp>26){d.notice=Math.max(0,d.notice-.35*dt);return;}
  const tx=-dxp/dp,tz=-dzp/dp,front=Math.sin(d.yaw)*tx+Math.cos(d.yaw)*tz;          // 1 = personagem bem na frente
  const sight=front>.25?1:front>-.35?lerp(.14,1,(front+.35)/.6):.1;
  const spd=state.speed,moving=Math.min(1,spd/1.6),running=state.run&&spd>1.2;
  const distK=Math.pow(clamp(1-dp/22,0,1),2),grazing=d.st==='graze'&&d.neckPitch>1?.35:1;
  const hearing=running?2.6:spd>.2?.4:.03;   // andando pelas costas: ~1 em 5 chances de ser notado antes de chegar perto
  d.moodT=(d.moodT||0)-dt;if(d.moodT<=0){d.moodT=rr(4,9);d.mood=rr(.45,1.75);}   // atenção varia: às vezes distraído, às vezes desconfiado
  const rate=distK*(sight*(.3+.7*moving)*1.7*grazing+hearing*(dp<12?1:.6))*(d.kind==='fawn'?.8:1)*(d.mood||1);
  d.notice+=rate*dt;if(rate<.05)d.notice=Math.max(0,d.notice-.3*dt);
  if(dp<1.6)d.notice=9;                                                                // encostou: nota na hora
  if(d.notice>2.2)scare(d.herd,state.px,state.pz);
  else if(d.notice>1&&d.st!=='flee'&&d.herd.alarm<=0&&d.st!=='alert'){d.st='alert';d.t=rr(2.5,5);}
 }
 function update(d,dt,now){
  const dxp=d.x-state.px,dzp=d.z-state.pz,dp=Math.hypot(dxp,dzp)||.01,herd=d.herd;
  if(!d.alive){ // caído de lado; depois de um tempo some na mata
   d.deathT+=dt;d.roll+=(d.rollDir*PI*.5-d.roll)*Math.min(1,dt*5);
   for(const L of d.legs){L.hip.rotation.x+=((L.front?.35:-.35)-L.hip.rotation.x)*Math.min(1,dt*4);L.knee.rotation.x*=.9;}
   d.neckPitch+=(.6-d.neckPitch)*Math.min(1,dt*3);d.neck.rotation.x=d.neckPitch;d.head.rotation.x=-.3;d.body.position.y=0;d.body.rotation.set(0,0,0);
   const sink=d.deathT>32?(d.deathT-32)*.25:0;
   d.root.position.set(d.x,d.y-sink,d.z);d.root.rotation.set(0,d.yaw,d.roll,'YXZ');
   if(d.deathT>36)remove(d);return;}
  if(d.grow!=null){d.grow=Math.min(1,d.grow+dt/GROW_TIME);applyGrowth(d);if(d.grow>=1){grownUp(d);return;}}
  perceive(d,dt,dp,dxp,dzp,document.body.classList.contains('play-active'));
  if(herd.alarm>0&&d.st!=='flee'){d.st='flee';d.t=herd.alarm;d.fleeYaw=herd.fleeDir+rr(-.35,.35);}
  d.t-=dt;let targetSpeed=0,wantYaw=d.yaw;
  if(d.st==='flee'){
   let best=d.fleeYaw;const away=Math.atan2(dxp,dzp);if(dp<20)best=lerp(best,away,.04);d.fleeYaw=best;
   for(const off of [0,.5,-.5,1,-1,1.6,-1.6,2.4,-2.4]){const a=best+off,nx=d.x+Math.sin(a)*2.2,nz=d.z+Math.cos(a)*2.2;if(canGo(d.x,d.z,nx,nz)){wantYaw=a;break;}}
   targetSpeed=d.runSpeed;if(d.t<=0&&dp>22){d.st='alert';d.t=rr(1.5,3);d.notice=Math.min(d.notice,1.2);herd.home={x:d.x,z:d.z};}
   if(d.t<=0&&dp<=22)d.t=1;}
  else if(d.st==='alert'){if(d.t<=0){d.st='graze';d.t=rr(3,7);d.notice*=.5;}}
  else if(d.st==='graze'){if(d.t<=0){if(Math.random()<.6){d.st='walk';choose(d);d.t=rr(4,9);}else d.t=rr(2,6);}}
  else if(d.st==='walk'){const dx=d.tx-d.x,dz=d.tz-d.z,L=Math.hypot(dx,dz);
   if(L<.4||d.t<=0){d.st='graze';d.t=rr(3,9);}else{wantYaw=Math.atan2(dx,dz);targetSpeed=d.walkSpeed*(L<1.5?.6:1);
    const nx=d.x+Math.sin(d.yaw)*.8,nz=d.z+Math.cos(d.yaw)*.8;if(!canGo(d.x,d.z,nx,nz)){choose(d);}}}
  if(d.slow>0){d.slow-=dt;targetSpeed*=.4;}
  if(d.stagger>0){d.stagger-=dt;targetSpeed*=.2;}
  const turn=d.st==='flee'?3.4:1.6;d.yaw+=clamp(angDiff(d.yaw,wantYaw),-turn*dt,turn*dt);
  d.speed+=(targetSpeed-d.speed)*Math.min(1,dt*(d.st==='flee'?3:2));
  if(d.speed>.01){const nx=d.x+Math.sin(d.yaw)*d.speed*dt,nz=d.z+Math.cos(d.yaw)*d.speed*dt;if(canGo(d.x,d.z,nx,nz)){d.x=nx;d.z=nz;}else{d.speed*=.3;if(d.st==='walk')choose(d);}}
  const gy=ground(d.x,d.z),fy=ground(d.x+Math.sin(d.yaw)*.5,d.z+Math.cos(d.yaw)*.5),by=ground(d.x-Math.sin(d.yaw)*.5,d.z-Math.cos(d.yaw)*.5);
  d.y+=(gy-d.y)*Math.min(1,dt*12);d.pitch+=(clamp(Math.atan2(by-fy,1),-.35,.35)-d.pitch)*Math.min(1,dt*6);
  animarCervo(d,dt,now,dxp,dzp);
 }
 /* ---------- laço ---------- */
 let last=performance.now();
 (function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;if(dt<=0)return;if(window.arcanoPausa)return;
  const pl=api.getGrassPlayer&&api.getGrassPlayer(),cam=api.getMainCamera&&api.getMainCamera();
  const src=document.body.classList.contains('play-active')&&pl?pl.position:(cam?cam.position:null);if(!src)return;
  state.px=src.x;state.pz=src.z;state.run=!!(pl&&((pl.keys&&pl.keys.has&&pl.keys.has('shift'))||(pl.input&&pl.input.run)));if(lx!=null){const sp=Math.hypot(src.x-lx,src.z-lz)/dt;state.speed+=((sp>40?0:sp)-state.speed)*Math.min(1,dt*6);}lx=src.x;lz=src.z;
  for(const h of herds){if(h.alarm>0)h.alarm-=dt;
   for(let i=h.births.length-1;i>=0;i--){h.births[i]-=dt;if(h.births[i]<=0){if(birth(h))h.births.splice(i,1);else h.births[i]=20;}}}
  for(const d of deer.slice()){if(!deer.includes(d))continue;const dist=Math.hypot(d.x-src.x,d.z-src.z);const vis=dist<150;if(d.root.visible!==vis)d.root.visible=vis;
   if(vis)update(d,dt,now);
   else if(!d.alive){d.deathT+=dt;if(d.deathT>36)remove(d);}
   else if(d.grow!=null){d.grow=Math.min(1,d.grow+dt/GROW_TIME);if(d.grow>=1)grownUp(d);}}
 })(last);
 window.arcanoAnimais={deer,herds,homes,makeDeer,hit:(d,dmg)=>hit(d,dmg,0,{x:state.px,z:state.pz}),config:{BIRTH_MIN,BIRTH_MAX,GROW_TIME}};
}
install();
})();
