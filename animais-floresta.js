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

/* ---------- geometria com cor por vértice ---------- */
function Builder(){const P=[],N=[],C=[],col=new T.Color();
 const B={
  add(geo,color,m,colorFn){const g=geo.index?geo.toNonIndexed():geo.clone();if(m)g.applyMatrix4(m);g.computeVertexNormals();
   const p=g.attributes.position,n=g.attributes.normal;if(color)col.set(color);
   for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);P.push(x,y,z);N.push(n.getX(i),n.getY(i),n.getZ(i));
    if(colorFn){const c=colorFn(x,y,z,n.getX(i),n.getY(i),n.getZ(i));C.push(c[0],c[1],c[2]);}else C.push(col.r,col.g,col.b);}
   return B;},
  ell(x,y,z,rx,ry,rz,color,colorFn,seg){const g=new T.SphereGeometry(1,seg||16,Math.max(8,(seg||16)*.7|0));g.scale(rx,ry,rz);g.translate(x,y,z);return B.add(g,color,null,colorFn);},
  tube(a,b,r1,r2,color,colorFn,sides){const A=new T.Vector3(...a),Bv=new T.Vector3(...b),d=Bv.clone().sub(A),L=d.length();
   const g=new T.CylinderGeometry(r2,r1,L,sides||10,3);g.translate(0,L/2,0);
   const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());B.add(g,color,new T.Matrix4().compose(A,q,new T.Vector3(1,1,1)),colorFn);
   B.ell(a[0],a[1],a[2],r1,r1,r1,color,colorFn,10);return B.ell(b[0],b[1],b[2],r2,r2,r2,color,colorFn,10);},
  build(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('normal',new T.Float32BufferAttribute(N,3));g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.computeBoundingSphere();return g;}};
 return B;}

/* ---------- materiais (cel-shading do jogo + contorno) ---------- */
const furMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.85,metalness:0});
const inkMat=new T.MeshBasicMaterial({color:'#2b2140',side:T.BackSide});
inkMat.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed+=normal*.014;');};
inkMat.customProgramCacheKey=()=>'deer-ink-v1';
const meshWithInk=(geo,ink)=>{const m=new T.Mesh(geo,furMat);m.castShadow=true;if(ink){const o=new T.Mesh(geo,inkMat);m.add(o);}return m;};

/* ---------- pelagem ---------- */
const C3=h=>{const c=new T.Color(h);return [c.r,c.g,c.b];};
function coat(kind){
 const back=C3(kind==='fawn'?'#a8653a':kind==='doe'?'#a96b40':'#94582f'),dark=C3('#6e3f22'),cream=C3('#f1e6cf'),white=C3('#fbf8f0');
 return (x,y,z,nx,ny,nz)=>{
  // torso: dorso castanho, risca mais escura no lombo, barriga creme, garupa branca
  let c=back;const under=sstep((-(y-1.0)/.3+.25)/.7);
  c=[lerp(c[0],cream[0],under),lerp(c[1],cream[1],under),lerp(c[2],cream[2],under)];
  if(y>1.22&&Math.abs(x)<.07)c=[lerp(c[0],dark[0],.6),lerp(c[1],dark[1],.6),lerp(c[2],dark[2],.6)];
  if(z<-.48&&y<1.2&&y>.86)c=white;
  if(kind==='fawn'&&y>1.03&&Math.abs(x)>.06&&Math.abs(x)<.26){const s=Math.sin(z*28+(x>0?1:2))*Math.sin(y*30+x*12);if(s>.72)c=white;}
  const v=.94+.1*Math.sin(x*41+z*37+y*23);return [c[0]*v,c[1]*v,c[2]*v];};
}

/* ---------- um cervo (peças articuladas) ---------- */
function makeDeer(kind){
 const S=kind==='fawn'?.62:kind==='doe'?.9:1;
 const root=new T.Group();root.name='Cervo ('+(kind==='buck'?'macho':kind==='doe'?'fêmea':'filhote')+')';
 const body=new T.Group();body.scale.setScalar(S);root.add(body);
 const fur=coat(kind),brown=C3(kind==='buck'?'#8c522b':'#a0653b'),leg=C3('#7a4826');
 // tronco + cauda
 {const B=Builder();
  B.ell(0,1.02,0,.27,.29,.6,null,fur,22);
  B.ell(0,1.07,.34,.25,.28,.32,null,fur,18);   // peito
  B.ell(0,1.06,-.38,.26,.27,.3,null,fur,18);   // garupa
  B.ell(0,1.14,-.6,.07,.1,.05,'#f7f2e6');      // rabo (o pedaço que balança é separado)
  body.add(meshWithInk(B.build(),true));}
 const tail=new T.Group();tail.position.set(0,1.18,-.62);body.add(tail);
 {const B=Builder();B.ell(0,-.04,-.02,.055,.09,.035,null,(x,y)=>y>-.02?C3('#8c522b'):C3('#ffffff'),10);tail.add(meshWithInk(B.build(),false));}
 // pescoço → cabeça
 const neck=new T.Group();neck.position.set(0,1.18,.46);body.add(neck);
 {const B=Builder();B.ell(0,.06,.04,.15,.2,.16,null,(x,y,z,nx,ny,nz)=>nz>.35&&ny<.4?C3("#efe3c9"):brown,12);B.tube([0,0,0],[0,.5,.24],.135,.085,null,(x,y,z,nx,ny,nz)=>nz>.35&&ny<.4?C3('#efe3c9'):brown,12);neck.add(meshWithInk(B.build(),true));}
 const head=new T.Group();head.position.set(0,.52,.25);neck.add(head);
 {const B=Builder();
  B.ell(0,.03,.06,.11,.12,.17,null,(x,y,z,nx,ny)=>ny<-.3?C3('#ead9bb'):brown,16);         // crânio
  B.ell(0,-.03,.24,.075,.075,.13,null,(x,y,z,nx,ny)=>ny<-.2?C3('#f1e6cf'):C3('#8d5a35'),14); // focinho
  B.ell(0,-.01,.36,.042,.034,.03,'#1a1210');                                           // nariz
  B.ell(0,-.075,.3,.045,.012,.04,'#ead9bb');                                            // queixo
  for(const s of [-1,1]){B.ell(s*.088,.07,.13,.034,.04,.034,'#120c0a',null,10);B.ell(s*.1,.085,.15,.011,.011,.011,'#ffffff',null,6);   // olhos e brilho
   B.ell(s*.07,.115,.11,.03,.008,.02,'#4a2a18');}                                      // sobrancelha
  head.add(meshWithInk(B.build(),true));}
 const ears=[];
 for(const s of [-1,1]){const e=new T.Group();e.position.set(s*.09,.13,.02);e.rotation.set(-.2,s*.35,s*-.9);head.add(e);
  const B=Builder();B.ell(0,.11,0,.055,.12,.022,null,(x,y,z,nx,ny,nz)=>nz>.3&&Math.abs(x)<.035&&y>.03&&y<.2?C3('#f0c2b0'):brown,12);e.add(meshWithInk(B.build(),false));ears.push({g:e,s,ph:Math.random()*10});}
 if(kind==='buck'){const B=Builder(),ant='#e2cfa6';
  for(const s of [-1,1]){const b0=[s*.05,.15,.03],b1=[s*.13,.34,-.02],b2=[s*.2,.52,.02],b3=[s*.22,.66,-.06];
   B.tube(b0,b1,.022,.018,ant).tube(b1,b2,.018,.014,ant).tube(b2,b3,.014,.008,ant);
   B.tube(b1,[s*.1,.47,.14],.013,.007,ant).tube(b2,[s*.3,.62,.1],.012,.006,ant).tube([s*.17,.43,0],[s*.27,.47,-.08],.011,.006,ant);}
  head.add(meshWithInk(B.build(),false));}
 // pernas: ombro/quadril → joelho/jarrete → casco
 const legs=[];
 for(const [fx,front] of [[-1,true],[1,true],[-1,false],[1,false]]){
  const hip=new T.Group();hip.position.set(fx*.15,front?1.0:1.04,front?.4:-.42);body.add(hip);
  const B=Builder();B.tube([0,0,0],front?[0,-.45,.02]:[0,-.42,-.1],front?.085:.11,.045,null,(x,y)=>y>-.12?brown:leg,10);hip.add(meshWithInk(B.build(),false));
  const knee=new T.Group();knee.position.set(0,front?-.45:-.42,front?.02:-.1);hip.add(knee);
  const B2=Builder();B2.tube([0,0,0],[0,front?-.49:-.56,front?0:.06],.042,.03,null,()=>leg,8);
  B2.ell(0,front?-.52:-.6,front?.02:.08,.04,.035,.055,'#2a1a12',null,8);                 // casco
  knee.add(meshWithInk(B2.build(),false));
  legs.push({hip,knee,front,side:fx});}
 return {root,body,neck,head,tail,ears,legs,S,kind};
}

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
 const deer=[];
 for(const h of homes){
  const n=homes.indexOf(h)===0?3:2+Math.floor(Math.random()*3),herd={home:h,alarm:0,fleeDir:0,members:[]};
  for(let i=0;i<n;i++){const kind=i===0&&Math.random()<.75?'buck':(i===n-1&&n>2?'fawn':'doe');
   const m=makeDeer(kind);let x=h.x+rr(-6,6),z=h.z+rr(-6,6);if(!okSpot(x,z)){x=h.x;z=h.z;}
   const d={...m,herd,x,z,y:ground(x,z),yaw:rr(0,TAU),st:'graze',t:rr(2,8),tx:x,tz:z,speed:0,phase:Math.random()*10,neckPitch:0,headYaw:0,pitch:0,
    walkSpeed:kind==='fawn'?.8:1.05,runSpeed:kind==='fawn'?7.4:8.6,mother:null};
   if(kind==='fawn')d.mother=herd.members.find(q=>q.kind==='doe')||herd.members[0]||null;
   herd.members.push(d);deer.push(d);root.add(d.root);}
 }
 // obstáculo leve: o personagem não atravessa o cervo
 const state={px:0,pz:0,speed:0};let lx=null,lz=null;
 if(O&&O.blocked){const prev=O.blocked;O.blocked=function(fx,fz,tx,tz){for(const d of deer){if(!d.root.visible)continue;const r=.45*d.S;if(Math.hypot(tx-d.x,tz-d.z)<r&&Math.hypot(tx-d.x,tz-d.z)<Math.hypot(fx-d.x,fz-d.z))return true;}return prev.call(this,fx,fz,tx,tz);};}

 /* ---------- comportamento ---------- */
 function choose(d){
  const h=d.herd.home;let x=d.x,z=d.z;
  for(let k=0;k<12;k++){const ref=d.mother&&Math.random()<.8?d.mother:h,r=d.mother?rr(1,3):rr(2,14),a=rr(0,TAU);const tx=ref.x+Math.cos(a)*r,tz=ref.z+Math.sin(a)*r;if(okSpot(tx,tz)){x=tx;z=tz;break;}}
  d.tx=x;d.tz=z;}
 function update(d,dt,now){
  const dxp=d.x-state.px,dzp=d.z-state.pz,dp=Math.hypot(dxp,dzp),herd=d.herd;
  // susto da manada: perto demais, ou chegando correndo
  if(document.body.classList.contains('play-active')){
   if(dp<8.5*(d.kind==='fawn'?1.2:1)||(dp<17&&state.speed>3.4)){if(herd.alarm<=0)herd.fleeDir=Math.atan2(herd.members[0].x-state.px,herd.members[0].z-state.pz);herd.alarm=rr(4,6);}
   else if(dp<16&&d.st!=='flee'&&herd.alarm<=0&&d.st!=='alert'){d.st='alert';d.t=rr(2.5,5);}
  }
  if(herd.alarm>0&&d.st!=='flee'){d.st='flee';d.t=herd.alarm;d.fleeYaw=herd.fleeDir+rr(-.35,.35);}
  d.t-=dt;let targetSpeed=0,wantYaw=d.yaw;
  if(d.st==='flee'){
   // corre para longe do personagem; se bater em obstáculo/água, desvia
   let best=d.fleeYaw;const away=Math.atan2(dxp,dzp);if(dp<20)best=lerp(best,away,.04);d.fleeYaw=best;
   for(const off of [0,.5,-.5,1,-1,1.6,-1.6]){const a=best+off,nx=d.x+Math.sin(a)*2.2,nz=d.z+Math.cos(a)*2.2;if(canGo(d.x,d.z,nx,nz)){wantYaw=a;break;}}
   targetSpeed=d.runSpeed;if(d.t<=0&&dp>22){d.st='alert';d.t=rr(1.5,3);herd.home={x:d.x,z:d.z};}
   if(d.t<=0&&dp<=22)d.t=1;}
  else if(d.st==='alert'){wantYaw=d.yaw;if(d.t<=0){d.st='graze';d.t=rr(3,7);}}
  else if(d.st==='graze'){if(d.t<=0){if(Math.random()<.6){d.st='walk';choose(d);d.t=rr(4,9);}else d.t=rr(2,6);}}
  else if(d.st==='walk'){const dx=d.tx-d.x,dz=d.tz-d.z,L=Math.hypot(dx,dz);
   if(L<.4||d.t<=0){d.st='graze';d.t=rr(3,9);}else{wantYaw=Math.atan2(dx,dz);targetSpeed=d.walkSpeed*(L<1.5?.6:1);
    const nx=d.x+Math.sin(d.yaw)*.8,nz=d.z+Math.cos(d.yaw)*.8;if(!canGo(d.x,d.z,nx,nz)){choose(d);}}}
  // virar e mover
  const turn=d.st==='flee'?3.4:1.6;d.yaw+=clamp(angDiff(d.yaw,wantYaw),-turn*dt,turn*dt);
  d.speed+=(targetSpeed-d.speed)*Math.min(1,dt*(d.st==='flee'?3:2));
  if(d.speed>.01){const nx=d.x+Math.sin(d.yaw)*d.speed*dt,nz=d.z+Math.cos(d.yaw)*d.speed*dt;if(canGo(d.x,d.z,nx,nz)){d.x=nx;d.z=nz;}else{d.speed*=.3;if(d.st==='walk')choose(d);}}
  // chão e inclinação
  const gy=ground(d.x,d.z),fy=ground(d.x+Math.sin(d.yaw)*.5,d.z+Math.cos(d.yaw)*.5),by=ground(d.x-Math.sin(d.yaw)*.5,d.z-Math.cos(d.yaw)*.5);
  d.y+=(gy-d.y)*Math.min(1,dt*12);d.pitch+=(clamp(Math.atan2(by-fy,1),-.35,.35)-d.pitch)*Math.min(1,dt*6);
  /* ---------- animação ---------- */
  const running=d.speed>3,walking=d.speed>.15;
  d.phase+=dt*(running?d.speed*.95:d.speed*2.6+.0001)/Math.max(.6,d.S);
  const ph=d.phase;
  let bob=0,bodyPitch=0;
  for(const L of d.legs){
   let swing=0,bend=0;
   if(running){ // galope saltado: patas da frente juntas, de trás juntas, defasadas
    const p=ph+(L.front?0:PI*.9)+(L.side>0?.18:0);swing=Math.sin(p)*.95;bend=Math.max(0,Math.sin(p+1.2))*1.25*(L.front?1:-1);}
   else if(walking){ // passo diagonal: 4 tempos
    const off=L.front?(L.side<0?0:PI):(L.side<0?PI*1.5:PI*.5),p=ph+off;swing=Math.sin(p)*.42;bend=Math.max(0,Math.sin(p+1.3))*.7*(L.front?1:-1);}
   L.hip.rotation.x=swing;L.knee.rotation.x=(L.front?bend:-Math.abs(bend)*.4+(running?Math.sin(ph+2)*.4:0));}
  if(running){bob=Math.abs(Math.sin(ph))*.22;bodyPitch=Math.sin(ph+.6)*.12;}else if(walking){bob=Math.abs(Math.sin(ph*2))*.025;}
  
  // pescoço/cabeça: pastando abaixa até o chão e mastiga; alerta, cabeça alta olhando o personagem
  let wantNeck=0,wantHeadYaw=0,chew=0;
  if(d.st==='graze'&&!walking){wantNeck=2.2;chew=Math.sin(now*.011)*.06;bodyPitch=.08;}
  else if(d.st==='alert'){wantNeck=-.25;wantHeadYaw=clamp(angDiff(d.yaw,Math.atan2(-dxp,-dzp)),-1.1,1.1);}
  else if(running)wantNeck=-.1+Math.sin(ph)*.12;else if(walking)wantNeck=.15+Math.sin(ph*2)*.04;
  d.neckPitch+=(wantNeck-d.neckPitch)*Math.min(1,dt*3.5);d.headYaw+=(wantHeadYaw-d.headYaw)*Math.min(1,dt*4);
  d.body.position.y=bob*d.S;d.body.rotation.x=bodyPitch;d.neck.rotation.x=d.neckPitch;d.neck.rotation.y=d.headYaw*.5;d.head.rotation.x=-d.neckPitch*.45+chew;d.head.rotation.y=d.headYaw*.5;
  // orelhas e cauda
  for(const e of d.ears){const tw=Math.max(0,Math.sin(now*.0013+e.ph*3))>.985?Math.sin(now*.05)*.5:0;
   e.g.rotation.x=-.2+(d.st==='alert'?-.35:0)+tw*.6;e.g.rotation.z=e.s*(d.st==='alert'?-.55:-.9)+tw*.3;}
  d.tail.rotation.x=(d.st==='flee'?-1.3:-.2)+Math.sin(now*.02+d.phase)*(d.st==='flee'?.25:.12);
  d.root.position.set(d.x,d.y,d.z);d.root.rotation.set(d.pitch,d.yaw,0,'YXZ');
 }
 /* ---------- laço ---------- */
 let last=performance.now();
 (function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;if(dt<=0)return;
  const pl=api.getGrassPlayer&&api.getGrassPlayer(),cam=api.getMainCamera&&api.getMainCamera();
  const src=document.body.classList.contains('play-active')&&pl?pl.position:(cam?cam.position:null);if(!src)return;
  state.px=src.x;state.pz=src.z;if(lx!=null){const sp=Math.hypot(src.x-lx,src.z-lz)/dt;state.speed+=((sp>40?0:sp)-state.speed)*Math.min(1,dt*6);}lx=src.x;lz=src.z;
  for(const h of new Set(deer.map(d=>d.herd)))if(h.alarm>0)h.alarm-=dt;
  for(const d of deer){const dist=Math.hypot(d.x-src.x,d.z-src.z);const vis=dist<150;if(d.root.visible!==vis)d.root.visible=vis;if(vis)update(d,dt,now);}
 })(last);
 window.arcanoAnimais={deer,homes,makeDeer};
}
install();
})();
