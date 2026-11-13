/* Pássaros de floresta em estilo anime (formas simples e arredondadas, cores chapadas).
   - BANDINHOS NO CHÃO: 3 a 5 passarinhos ciscam numa clareira: dão pulinhos, bicam o chão, olham em volta.
     Se alguém chega perto (ou um deles se assusta), todos levantam voo e se escondem na copa da árvore
     mais próxima. Quando o lugar fica calmo de novo, saem da árvore e descem planando para o mesmo ponto.
   - REVOADA: um grupo voa em formação lá no alto, batendo asas e planando, sempre em volta de quem joga.
   - À noite todos dormem nas árvores.
   Cada pássaro: corpo, cabeça, bico, olhos com brilho, cauda em leque, patas e asas de duas partes
   (braço e ponta) que batem com a ponta atrasada. Seis espécies de cor. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const PI=Math.PI,TAU=PI*2;
const mobile=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||innerWidth<680;
const rr=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const angTo=(a,b)=>((b-a+PI)%TAU+TAU)%TAU-PI;

// espécies: costas, barriga, asa, bico
const SPECIES=[
 {n:'pardal',back:'#8a5a34',belly:'#efe2c8',wing:'#5e3c22',beak:'#e8b23a',cap:'#6a4226'},
 {n:'azulão',back:'#2f6fd6',belly:'#f2f6ff',wing:'#1d4a9c',beak:'#f0c040',cap:'#2459b8'},
 {n:'sabiá',back:'#7a6a58',belly:'#e8873a',wing:'#55483a',beak:'#f0c040',cap:'#6a5a4a'},
 {n:'canário',back:'#f4cf2e',belly:'#fff3a8',wing:'#c79a14',beak:'#f08a3a',cap:'#f4cf2e'},
 {n:'cardeal',back:'#d8362c',belly:'#f6efe6',wing:'#9c2018',beak:'#f0a03a',cap:'#e8483c',crest:true},
 {n:'periquito',back:'#3fb24a',belly:'#d8f08a',wing:'#2a8436',beak:'#f0b040',cap:'#58c85c'}];

function kit(Merger){
 const mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.7,side:T.DoubleSide});
 const shapeGeo=(pts)=>{const sh=new T.Shape();pts.forEach(([x,y],i)=>i?sh.lineTo(x,y):sh.moveTo(x,y));const g=new T.ShapeGeometry(sh);g.rotateX(PI/2);return g;}; // (x,y) -> (x,0,y): y = para a frente
 const made=SPECIES.map(sp=>{
  const B=Merger();
  // corpo com barriga clara
  {const g=new T.SphereGeometry(1,16,12).toNonIndexed(),p=g.attributes.position,col=new Float32Array(p.count*3),a=new T.Color(sp.back),b=new T.Color(sp.belly),c=new T.Color();
   for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=clamp((-y+.1+z*.25)/.5,0,1);c.copy(a).lerp(b,k*k*(3-2*k));
    p.setXYZ(i,x*.3*(1-.25*Math.max(0,-z)),.42+y*.28,z*.48-.02);col.set([c.r,c.g,c.b],i*3);}
   g.setAttribute('color',new T.BufferAttribute(col,3));B.add(g);}
  // cabeça (topo da cor do "boné", bochecha clara)
  {const g=new T.SphereGeometry(.235,14,10).toNonIndexed(),p=g.attributes.position,col=new Float32Array(p.count*3),a=new T.Color(sp.cap),b=new T.Color(sp.belly),c=new T.Color();
   for(let i=0;i<p.count;i++){const y=p.getY(i),z=p.getZ(i),k=clamp((-y+.02+z*.3)/.14,0,1);c.copy(a).lerp(b,k);col.set([c.r,c.g,c.b],i*3);p.setXYZ(i,p.getX(i),p.getY(i)+.67,p.getZ(i)+.33);}
   g.setAttribute('color',new T.BufferAttribute(col,3));B.add(g);}
  if(sp.crest)for(let k=0;k<3;k++)B.limb([0,.85,.3-k*.07],[0,1.02-k*.04,.14-k*.1],.05,sp.cap,.012);
  // bico, olhos com brilho
  {const g=new T.ConeGeometry(.075,.2,8);g.rotateX(PI/2);g.translate(0,.645,.63);B.add(g,sp.beak);}
  for(const s of [-1,1]){B.ball(s*.155,.71,.45,.05,'#101014');B.ball(s*.175,.73,.475,.017,'#ffffff');}
  // asa dobrada no corpo, patas e dedos
  for(const s of [-1,1]){B.ball(s*.27,.45,-.08,.2,sp.wing,.28,.9,1.9);
   B.limb([s*.1,.2,-.02],[s*.1,.02,.0],.022,'#c98a3a',.018);for(const a of [-.5,0,.5])B.limb([s*.1,.02,0],[s*.1+Math.sin(a)*.11,.012,Math.cos(a)*.11],.014,'#c98a3a',.01);B.limb([s*.1,.02,0],[s*.1,.012,-.08],.014,'#c98a3a',.01);}
  // cauda em leque (3 penas)
  for(const a of [-.28,0,.28]){const g=shapeGeo([[-.07,0],[.07,0],[.09,-.5],[0,-.58],[-.09,-.5]]);g.rotateY(a);g.rotateX(-.18);g.translate(0,.42,-.4);B.add(g,a?sp.wing:sp.back);}
  const body=B.build();
  // asa aberta: braço e ponta, com a borda de trás recortada em "penas"
  const W1=Merger();W1.add(shapeGeo([[0,.2],[.5,.24],[.5,-.2],[.42,-.27],[.34,-.21],[.25,-.29],[.16,-.22],[.08,-.28],[0,-.2]]),sp.wing);
  W1.add(shapeGeo([[0,.2],[.5,.24],[.5,.1],[0,.06]]).translate(0,.004,0),sp.back);
  const W2=Merger();W2.add(shapeGeo([[0,.24],[.3,.25],[.56,.14],[.66,-.02],[.56,-.12],[.5,-.05],[.42,-.2],[.34,-.11],[.24,-.27],[.14,-.18],[.06,-.28],[0,-.2]]),sp.wing);
  W2.add(shapeGeo([[0,.24],[.3,.25],[.5,.17],[.3,.12],[0,.1]]).translate(0,.004,0),sp.back);
  return {body,w1:W1.build(),w2:W2.build()};});
 return {make(){const k=(Math.random()*SPECIES.length)|0,P=made[k],g=new T.Group(),inner=new T.Group();g.add(inner);const size=rr(.2,.27);inner.scale.setScalar(size);
   inner.add(new T.Mesh(P.body,mat));const wings=[];
   for(const s of [-1,1]){const root=new T.Group();root.position.set(s*.25,.53,.04);root.scale.x=s;inner.add(root);root.add(new T.Mesh(P.w1,mat));const tip=new T.Group();tip.position.x=.5;root.add(tip);tip.add(new T.Mesh(P.w2,mat));root.visible=false;wings.push({s,root,tip});}
   return {g,inner,wings,size,ph:rr(0,TAU)};}};
}

function install(){
 const api=window.arcanoWaterV1226,FK=window.arcanoFaunaKit,I=window.arcanoIsland;
 if(!api||!api.scene||!FK||!I||!I.forest){setTimeout(install,800);return;}
 const {Merger,state,ground,water,blocked}=FK,scene=api.scene,trees=I.forest.spots||[];
 const K=kit(Merger),root=new T.Group();root.name='Pássaros da floresta';scene.add(root);
 const GROUPS=mobile?3:6,FLOCK=mobile?5:8;
 const groups=[],sky=[];
 const pDist=(x,z)=>Math.hypot(x-state.px,z-state.pz);
 const treeNear=(x,z,avoidPlayer)=>{let best=null,bd=1e9;for(const t of trees){const d=Math.hypot(t.x-x,t.z-z);if(d<bd&&d<60&&(!avoidPlayer||Math.hypot(t.x-state.px,t.z-state.pz)>7)){bd=d;best=t;}}return best;};
 /* ---------- poleiros: beiradas das copas e cumeeiras/bordas de telhados ---------- */
 const dims=(I.forest&&I.forest.dims)||[];
 function treePerches(x,z,r,out){for(const t of trees){const d=Math.hypot(t.x-x,t.z-z);if(d>r)continue;const dm=dims[t.t]||{h:7,w:4},s0=t.s||1,hh=dm.h*s0,ww=dm.w*s0*(dm.pine?.3:.42);
   for(let k=0;k<2;k++){const a=(t.x*13.1+t.z*7.7+k*2.4)%TAU;out.push({x:t.x+Math.cos(a)*ww,y:t.y+hh*(dm.pine?.42:.6+.08*k),z:t.z+Math.sin(a)*ww,face:a,tree:t});}}return out;}
 const roofPerches=[];
 {const meshes=[];scene.traverse(o=>{if(o.isMesh&&o.name&&(/· construções/.test(o.name)||/^casa (roof|timberH)$/.test(o.name)))meshes.push(o);});
  const rc=new T.Raycaster(),down=new T.Vector3(0,-1,0),nrm=new T.Vector3(),vil=(window.arcanoVilas||[]).map(v=>[v.x,v.z]);
  for(const [vx,vz] of vil)for(let i=0;i<140;i++){const a=Math.random()*TAU,r=Math.sqrt(Math.random())*48,x=vx+Math.cos(a)*r,z=vz+Math.sin(a)*r;
   rc.set(new T.Vector3(x,300,z),down);const h=rc.intersectObjects(meshes,false)[0];if(!h||!h.face)continue;
   nrm.copy(h.face.normal).transformDirection(h.object.matrixWorld);if(nrm.y<.42||h.point.y<ground(x,z)+2.4)continue;
   roofPerches.push({x:h.point.x,y:h.point.y+.02,z:h.point.z,face:Math.random()*TAU,roof:true});}}
 function perchesNear(x,z,r){const out=treePerches(x,z,r,[]);for(const p of roofPerches)if(Math.hypot(p.x-x,p.z-z)<r)out.push(p);return out;}
 // asas: batendo (f>0) ou planando; aberta só em voo
 function wingsFly(b,flap,t){for(const w of b.wings){w.root.visible=true;const a=flap?.12+.8*Math.sin(t):.14+.05*Math.sin(t*.2),c=flap?.55*Math.sin(t-1.0):-.1;w.root.rotation.z=w.s*a;w.tip.rotation.z=c;}}
 function wingsFold(b){for(const w of b.wings)w.root.visible=false;}
 function place(b){b.g.position.set(b.x,b.y,b.z);}
 // voa até (tx,ty,tz) com velocidade sp; devolve a distância que falta
 function flyTo(b,tx,ty,tz,sp,dt){const dx=tx-b.x,dy=ty-b.y,dz=tz-b.z,d=Math.hypot(dx,dy,dz)||1;
  b.vx+=(dx/d*sp-b.vx)*Math.min(1,dt*2.6);b.vy+=(dy/d*sp-b.vy)*Math.min(1,dt*3.2);b.vz+=(dz/d*sp-b.vz)*Math.min(1,dt*2.6);
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;const gy=ground(b.x,b.z)+.05;if(b.y<gy)b.y=gy;
  const h=Math.hypot(b.vx,b.vz),yaw=Math.atan2(b.vx,b.vz),turn=angTo(b.g.rotation.y,yaw);b.g.rotation.order='YXZ';b.g.rotation.y+=turn*Math.min(1,dt*8);
  b.g.rotation.x=lerp(b.g.rotation.x,-Math.atan2(b.vy,Math.max(h,.5))*.7,Math.min(1,dt*6));b.g.rotation.z=lerp(b.g.rotation.z,clamp(-turn*1.2,-.7,.7),Math.min(1,dt*5));
  return d;}
 // pousa: corpo reto, asas fechadas
 function settle(b,p){b.x=p.x;b.y=p.y;b.z=p.z;b.vx=b.vy=b.vz=0;b.g.rotation.x=0;b.g.rotation.z=0;b.inner.rotation.x=0;wingsFold(b);place(b);}

 /* ---------- bandos: pousados nas árvores/telhados, observam o chão, descem e ciscam ---------- */
 function newGroup(){
  for(let tries=0;tries<40;tries++){const a=rr(0,TAU),d=rr(12,46),x=state.px+Math.cos(a)*d,z=state.pz+Math.sin(a)*d;
   if(water(x,z)||blocked(x,z))continue;const y=ground(x,z);if(Math.abs(ground(x+1.5,z)-y)>.5||Math.abs(ground(x,z+1.5)-y)>.5)continue;
   const dc=Math.hypot(x-I.center.x,z-I.center.z);if(dc>I.radius-25)continue;
   if(groups.some(g=>Math.hypot(g.x-x,g.z-z)<13))continue;
   const per=perchesNear(x,z,24);if(per.length<2)continue;
   const G={x,z,birds:[],alarm:0,perches:per};const n=3+((Math.random()*4)|0);
   for(let i=0;i<n;i++){const b=K.make();b.G=G;b.vx=b.vy=b.vz=0;root.add(b.g);G.birds.push(b);
    if(Math.random()<.5){b.p=pick(per);settle(b,b.p);b.g.rotation.y=b.p.face+rr(-.8,.8);b.st='perch';b.t=rr(2,9);}
    else{b.x=x+rr(-1.6,1.6);b.z=z+rr(-1.6,1.6);b.y=ground(b.x,b.z);b.st='feed';b.t=rr(.3,2);b.act='look';b.feedT=rr(8,22);b.g.rotation.y=rr(0,TAU);place(b);}}
   groups.push(G);return;}
 }
 const pick=a=>a[(Math.random()*a.length)|0];
 function goPerch(b,flee){const per=b.G.perches;let p=null;
  if(flee){let bd=-1;for(const q of per){const d=Math.hypot(q.x-state.px,q.z-state.pz);if(d>bd){bd=d;p=q;}}}else p=pick(per);
  if(!p)p={x:b.x+rr(-15,15),y:b.y+10,z:b.z+rr(-15,15),face:0};b.p={x:p.x+rr(-.25,.25),y:p.y,z:p.z+rr(-.25,.25),face:p.face};b.st=flee?'flee':'up';b.t=0;b.vy=flee?3.5:2;}
 function updGround(b,dt){
  const G=b.G,night=state.day<.18,dp=pDist(b.x,b.z);
  if(b.st==='feed'){
   if(dp<4.6||(dp<8&&state.speed>3.4)||night)G.alarm=Math.max(G.alarm,.01);
   if(G.alarm>0&&b.delay==null)b.delay=rr(0,.35);
   if(b.delay!=null){b.delay-=dt;if(b.delay<=0){b.delay=null;b.inner.rotation.x=0;goPerch(b,true);return;}}
   b.t-=dt;b.feedT-=dt;
   if(b.feedT<=0&&b.act==='look'){b.inner.rotation.x=0;goPerch(b,false);return;}            // cansou: volta para um galho
   if(b.act==='hop'){b.k+=dt/.22;const k=Math.min(1,b.k);b.x=lerp(b.x0,b.x1,k);b.z=lerp(b.z0,b.z1,k);b.y=lerp(b.y0,b.y1,k)+Math.sin(k*PI)*.09;if(k>=1){b.hops--;if(b.hops>0)startHop(b);else{b.act='look';b.t=rr(.3,1.2);}}}
   else if(b.act==='peck'){b.k+=dt*9;b.inner.rotation.x=Math.max(0,Math.sin(b.k))*.95;if(b.k>PI*(b.pecks*2-1)+.1){b.inner.rotation.x=0;b.act='look';b.t=rr(.4,1.6);}}
   else if(b.t<=0){const u=Math.random();
    if(u<.45){b.hops=1+((Math.random()*3)|0);b.yawT=Math.atan2(G.x+rr(-2.2,2.2)-b.x,G.z+rr(-2.2,2.2)-b.z);startHop(b);}
    else if(u<.8){b.act='peck';b.k=0;b.pecks=1+((Math.random()*3)|0);}
    else{b.yawT=b.g.rotation.y+rr(-1.4,1.4);b.t=rr(.4,1.4);}}
   if(b.yawT!=null)b.g.rotation.y+=angTo(b.g.rotation.y,b.yawT)*Math.min(1,dt*12);
   b.g.rotation.x=0;b.g.rotation.z=0;wingsFold(b);place(b);
  }else if(b.st==='perch'){ // pousado: vira a cabeça, olha para baixo; depois desce para ciscar
   b.t-=dt;wingsFold(b);
   if(b.look==null||b.lookT<=0){b.look=rr(-.35,.6);b.lookT=rr(.4,1.6);b.yawT=b.g.rotation.y+rr(-.9,.9);}b.lookT-=dt;
   b.inner.rotation.x+=(b.look-b.inner.rotation.x)*Math.min(1,dt*8);if(b.yawT!=null)b.g.rotation.y+=angTo(b.g.rotation.y,b.yawT)*Math.min(1,dt*6);
   if(dp<3.2)G.alarm=Math.max(G.alarm,.01);
   if(G.alarm>0&&dp<5){b.inner.rotation.x=0;goPerch(b,true);return;}
   if(b.t<=0&&!night&&G.alarm<=0&&pDist(G.x,G.z)>6){b.inner.rotation.x=0;b.land={x:G.x+rr(-1.8,1.8),z:G.z+rr(-1.8,1.8)};b.land.y=ground(b.land.x,b.land.z);b.st='down';b.vy=1;}
   else if(b.t<=0)b.t=rr(2,6);
  }else if(b.st==='flee'||b.st==='up'){ // indo para o galho/telhado
   b.t+=dt;const fast=b.st==='flee';wingsFly(b,true,state.t*(fast?26:20)+b.ph);
   const d=flyTo(b,b.p.x,b.p.y+(Math.hypot(b.p.x-b.x,b.p.z-b.z)>2?.6:0),b.p.z,fast?7.5:5,dt);place(b);
   if(d<.22||b.t>9){settle(b,b.p);b.g.rotation.y=b.p.face+rr(-.6,.6);b.st='perch';b.t=fast?rr(8,16):rr(4,12);}
  }else if(b.st==='down'){ // desce planando até o chão
   const far=Math.hypot(b.land.x-b.x,b.land.z-b.z),d=flyTo(b,b.land.x,b.land.y+(far>2.5?.9:0),b.land.z,4.5,dt),flap=d<1.6||((state.t+b.ph)%2.2)<.8;wingsFly(b,flap,state.t*20+b.ph);place(b);
   if(dp<4){G.alarm=.01;goPerch(b,true);return;}
   if(d<.25&&b.y<b.land.y+.3){settle(b,b.land);b.st='feed';b.act='look';b.t=rr(.4,1.5);b.feedT=rr(8,22);b.delay=null;}
  }
 }
 function startHop(b){b.act='hop';b.k=0;b.x0=b.x;b.z0=b.z;b.y0=b.y;const a=(b.yawT!=null?b.yawT:b.g.rotation.y)+rr(-.4,.4),d=rr(.14,.3);let x=b.x+Math.sin(a)*d,z=b.z+Math.cos(a)*d;if(water(x,z)){x=b.x;z=b.z;}b.x1=x;b.z1=z;b.y1=ground(x,z);b.yawT=a;}

 /* ---------- CORUJAS (noturnas): dormem escondidas de dia; à noite pousam nos galhos, giram a cabeça,
    piscam, voam em silêncio de árvore em árvore e às vezes mergulham até o chão para caçar ---------- */
 const owlKit=(()=>{const mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.85,side:T.DoubleSide});
  const sg=(pts)=>{const sh=new T.Shape();pts.forEach(([x,y],i)=>i?sh.lineTo(x,y):sh.moveTo(x,y));const g=new T.ShapeGeometry(sh);g.rotateX(PI/2);return g;};
  const cols=[['#8a6a4a','#e8d6b8','#6a4e34'],['#9a9488','#efe9dc','#6e6a62'],['#b0763a','#f2dcb4','#7a4e22']];
  return cols.map(([back,face,wing])=>{
   const B=Merger();
   {const g=new T.SphereGeometry(1,16,12).toNonIndexed(),p=g.attributes.position,col=new Float32Array(p.count*3),a=new T.Color(back),c2=new T.Color(face),c=new T.Color();
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=Math.max(0,Math.min(1,(z-.2)/.5))*Math.max(0,Math.min(1,(.6-y)/.6));c.copy(a).lerp(c2,k);
     const st=Math.sin(y*22+x*3)>.6&&k>.3?.82:1;c.multiplyScalar(st);p.setXYZ(i,x*.36,.5+y*.46,z*.34);col.set([c.r,c.g,c.b],i*3);}
    g.setAttribute('color',new T.BufferAttribute(col,3));B.add(g);}
   for(const s of [-1,1]){B.ball(s*.3,.48,-.02,.2,wing,.45,1.1,1.5);B.limb([s*.1,.08,.05],[s*.1,-.02,.12],.03,'#d8b04a',.02);for(const a2 of [-.4,.1,.6])B.limb([s*.1,-.02,.12],[s*.1+Math.sin(a2)*.1,-.03,.12+Math.cos(a2)*.1],.015,'#2a2420',.008);}
   const body=B.build();
   const Hh=Merger();
   {const g=new T.SphereGeometry(.3,16,12);g.scale(1.1,.92,.95);Hh.add(g,back);
    const disc=new T.CircleGeometry(.27,20);disc.scale(1.25,1,1);disc.translate(0,0,.255);Hh.add(disc,face);
    for(const s of [-1,1]){Hh.ball(s*.12,.03,.27,.095,'#f0c030');Hh.ball(s*.12,.03,.335,.05,'#0c0c0c');Hh.ball(s*.105,.055,.37,.015,'#ffffff');
     const tuft=new T.ConeGeometry(.06,.2,5);tuft.rotateZ(-s*.35);tuft.translate(s*.22,.28,.02);Hh.add(tuft,back);}
    const bk=new T.ConeGeometry(.04,.11,6);bk.rotateX(PI/2+.6);bk.translate(0,-.06,.31);Hh.add(bk,'#3a3028');}
   const head=Hh.build();
   const W1=Merger();W1.add(sg([[0,.22],[.55,.26],[.6,-.18],[.5,-.26],[.4,-.2],[.3,-.28],[.2,-.21],[.1,-.27],[0,-.2]]),wing);
   const W2=Merger();W2.add(sg([[0,.26],[.4,.26],[.72,.12],[.78,-.06],[.68,-.16],[.58,-.08],[.48,-.22],[.36,-.12],[.24,-.26],[.12,-.16],[0,-.22]]),wing);
   const lid=new T.SphereGeometry(.1,10,6,0,TAU,0,PI/2);
   return {body,head,w1:W1.build(),w2:W2.build(),lid,lidMat:new T.MeshStandardMaterial({color:back,roughness:.9}),mat};});})();
 function makeOwl(){const P=owlKit[(Math.random()*owlKit.length)|0],g=new T.Group(),inner=new T.Group();g.add(inner);inner.scale.setScalar(rr(.42,.5));
  inner.add(new T.Mesh(P.body,P.mat));const head=new T.Group();head.position.set(0,.98,.05);inner.add(head);head.add(new T.Mesh(P.head,P.mat));
  const lids=[];for(const s of [-1,1]){const l=new T.Mesh(P.lid,P.lidMat);l.position.set(s*.12,.03,.33);l.rotation.x=-PI/2;l.scale.set(1,.2,1);head.add(l);lids.push(l);}
  const wings=[];for(const s of [-1,1]){const r0=new T.Group();r0.position.set(s*.28,.66,.0);r0.scale.x=s;inner.add(r0);r0.add(new T.Mesh(P.w1,P.mat));const tip=new T.Group();tip.position.x=.58;r0.add(tip);tip.add(new T.Mesh(P.w2,P.mat));r0.visible=false;wings.push({s,root:r0,tip});}
  g.visible=false;return {g,inner,head,lids,wings,ph:rr(0,TAU),vx:0,vy:0,vz:0,x:0,y:0,z:0,st:'sleep',t:0};}
 const owls=[],OWLS=mobile?2:4;
 function owlPerchNear(x,z){const per=treePerches(x,z,30,[]);return per.length?pick(per):null;}
 function updOwl(o,dt){
  const night=state.day<.2,dp=pDist(o.x,o.z);
  if(o.st==='sleep'){o.g.visible=false;if(night){const p=owlPerchNear(state.px+rr(-25,25),state.pz+rr(-25,25));if(p&&pDist(p.x,p.z)>8){o.p=p;settle(o,p);o.g.rotation.y=p.face;o.g.visible=true;o.st='perch';o.t=rr(6,16);}}return;}
  if(!night&&o.st==='perch'){o.st='sleep';return;}
  if(o.st==='perch'){o.t-=dt;wingsFold(o);
   // cabeça gira devagar (até ~180°) e às vezes vira de repente para quem joga
   if(o.hT==null||o.hT<=0){o.hy=dp<14?angTo(o.g.rotation.y,Math.atan2(state.px-o.x,state.pz-o.z)):rr(-2.6,2.6);o.hT=rr(1.5,4);o.tilt=rr(-.3,.3);}o.hT-=dt;
   o.head.rotation.y+=(clamp(o.hy,-2.7,2.7)-o.head.rotation.y)*Math.min(1,dt*(dp<14?6:1.8));o.head.rotation.z+=(o.tilt-o.head.rotation.z)*Math.min(1,dt*3);
   const bl=((state.t+o.ph)%3.6)<.16?1:.2;for(const l of o.lids)l.scale.y+=(bl-l.scale.y)*Math.min(1,dt*20);
   if(dp<3.5){const p=owlPerchNear(o.x+rr(-20,20),o.z+rr(-20,20));if(p){o.p=p;o.st='fly';o.t=0;}}
   else if(o.t<=0){if(Math.random()<.4){o.prey={x:o.x+rr(-9,9),z:o.z+rr(-9,9)};o.prey.y=ground(o.prey.x,o.prey.z);if(!water(o.prey.x,o.prey.z)){o.st='swoop';o.t=0;return;}}
    const p=owlPerchNear(o.x,o.z);if(p){o.p=p;o.st='fly';o.t=0;}else o.t=rr(5,10);}
   place(o);return;}
  o.t+=dt;
  if(o.st==='fly'){wingsFly(o,((state.t+o.ph)%1.8)<.7,state.t*9+o.ph);const d=flyTo(o,o.p.x,o.p.y+(Math.hypot(o.p.x-o.x,o.p.z-o.z)>2?.8:0),o.p.z,5.5,dt);place(o);o.head.rotation.y*=.9;
   if(d<.25||o.t>12){settle(o,o.p);o.g.rotation.y=o.p.face;o.st='perch';o.t=rr(8,20);}}
  else if(o.st==='swoop'){wingsFly(o,false,0);const d=flyTo(o,o.prey.x,o.prey.y+.1,o.prey.z,7,dt);place(o);
   if(d<.35||o.t>6){o.st='catch';o.t=0;}}
  else if(o.st==='catch'){wingsFly(o,true,state.t*14);if(o.t>.6){const p=owlPerchNear(o.x,o.z);if(p){o.p=p;o.st='fly';o.t=0;}}}
 }
 /* ---------- revoada no alto ---------- */
 const F={cx:0,cz:0,a:rr(0,TAU),r:26,alt:24,ready:false,st:'fly',t:0};
 function updSky(dt){
  const night=state.day<.18;
  if(!F.ready){F.cx=state.px+30;F.cz=state.pz;F.ready=true;for(let i=0;i<FLOCK;i++){const b=K.make();b.i=i;b.x=F.cx;b.z=F.cz;b.y=ground(F.cx,F.cz)+F.alt;b.vx=b.vy=b.vz=0;root.add(b.g);sky.push(b);}}
  // o centro do círculo acompanha quem joga, devagar
  const want={x:state.px+Math.cos(F.a*.23)*34,z:state.pz+Math.sin(F.a*.23)*34};F.cx+=(want.x-F.cx)*Math.min(1,dt*.12);F.cz+=(want.z-F.cz)*Math.min(1,dt*.12);
  if(Math.hypot(F.cx-state.px,F.cz-state.pz)>160){F.cx=want.x;F.cz=want.z;for(const b of sky){b.x=F.cx;b.z=F.cz;b.y=ground(F.cx,F.cz)+F.alt;}}
  F.a+=dt*.3;F.t+=dt;const gy=ground(F.cx,F.cz);
  if(F.st==='fly'&&night){F.st='roost';const t=treeNear(F.cx,F.cz,false);F.roost=t?{x:t.x,y:t.y+4.5*(t.s||1),z:t.z}:{x:F.cx,y:gy+3,z:F.cz};}
  if(F.st==='roost'&&!night&&sky.every(b=>!b.g.visible)){F.st='fly';for(const b of sky){b.g.visible=true;b.x=F.roost.x;b.y=F.roost.y;b.z=F.roost.z;}}
  const lx=F.cx+Math.cos(F.a)*F.r,lz=F.cz+Math.sin(F.a)*F.r,hx=-Math.sin(F.a),hz=Math.cos(F.a),glide=(F.t%6.5)>4.2;
  for(const b of sky){if(!b.g.visible)continue;
   if(F.st==='roost'){wingsFly(b,true,state.t*22+b.ph);if(flyTo(b,F.roost.x+Math.sin(b.i)*1.2,F.roost.y,F.roost.z+Math.cos(b.i)*1.2,8,dt)<1)b.g.visible=false;place(b);continue;}
   const row=Math.ceil(b.i/2),side=b.i%2?1:-1,back=row*1.5,out=b.i?row*1.3*side:0;   // formação em V
   const tx=lx-hx*back+(-hz)*out,tz=lz-hz*back+hx*out,ty=gy+F.alt+Math.sin(F.a*1.7+b.i)*1.6-row*.25;
   wingsFly(b,!glide,state.t*(17+b.i%3)+b.ph);flyTo(b,tx,ty,tz,10.5,dt);place(b);}
 }

 let last=performance.now(),popT=0;
 (function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;if(dt<=0||!document.body.classList.contains('play-active'))return;
  popT-=dt;if(popT<=0){popT=2;
   for(let i=groups.length-1;i>=0;i--)if(Math.hypot(groups[i].x-state.px,groups[i].z-state.pz)>75){for(const b of groups[i].birds)root.remove(b.g);groups.splice(i,1);}
   if(groups.length<GROUPS&&state.day>=.18)newGroup();}
  for(const G of groups){if(G.alarm>0){G.alarm+=dt;if(G.alarm>2&&G.birds.every(b=>b.st==='perch')&&G.birds.every(b=>pDist(b.x,b.z)>6))G.alarm=0;}for(const b of G.birds)updGround(b,dt);}
  if(owls.length<OWLS){const o=makeOwl();root.add(o.g);owls.push(o);}for(const o of owls){if(o.st!=='sleep'&&pDist(o.x,o.z)>90)o.st='sleep';updOwl(o,dt);}
  updSky(dt);
 })(last);
 window.arcanoAves={groups,sky,owls,flock:F,roofPerches,especies:SPECIES.map(s=>s.n)};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,5000));else setTimeout(install,5000);
})();
