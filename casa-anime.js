/* Casa no estilo anime (inspirada nas casas de Mondstadt, Genshin Impact).
   Montada só com formas simples (leve para o jogo): base de pedra, paredes
   de reboco creme com vigas de madeira escura, segundo andar mais largo,
   telhado azul com beiral, chaminé, porta, janelas com floreiras e lampião.
   À noite as janelas e o lampião acendem. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;

const OUTLINE='#2b2140';
const outlineMat=new T.MeshBasicMaterial({color:OUTLINE,side:T.BackSide});
const mat=(color,extra)=>new T.MeshStandardMaterial(Object.assign({color,roughness:1,metalness:0},extra||{}));
const M={
 stone:mat('#9aa3ad'),stoneDark:mat('#6f7884'),
 plaster:mat('#f2e4c4'),wood:mat('#6b4630'),woodLight:mat('#94653f'),
 roof:mat('#3a68a8'),roofDark:mat('#2c4f86'),
 door:mat('#7a4a2c'),metal:mat('#3b3a40'),
 glass:mat('#9fd3ef',{emissive:new T.Color('#ffcf7a'),emissiveIntensity:0}),
 lamp:mat('#ffe2a0',{emissive:new T.Color('#ffc766'),emissiveIntensity:0}),
 flowerA:mat('#e8607a'),flowerB:mat('#f5c64a'),flowerC:mat('#c86be0'),leaf:mat('#5aa34a')
};

function part(group,geo,material,x,y,z,opts){
 const m=new T.Mesh(geo,material);
 m.position.set(x,y,z);
 if(opts&&opts.rot)m.rotation.set(opts.rot[0],opts.rot[1],opts.rot[2]);
 m.castShadow=true;m.receiveShadow=true;
 if(!opts||opts.outline!==false){
  // Contorno: casca levemente maior, vista só por trás.
  const s=opts&&opts.outlineScale||1.035;
  const shell=new T.Mesh(geo,outlineMat);shell.scale.setScalar(s);
  shell.userData.animeOutline=true;m.add(shell);
 }
 group.add(m);
 return m;
}
const box=(w,h,d)=>new T.BoxGeometry(w,h,d);

function gableGeometry(width,height,depth){
 const s=new T.Shape();
 s.moveTo(-width/2,0);s.lineTo(width/2,0);s.lineTo(0,height);s.lineTo(-width/2,0);
 const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false});
 g.translate(0,0,-depth/2);
 return g;
}

function buildHouse(){
 const g=new T.Group();g.name='Casa anime estilo Mondstadt';
 const W=5.6,D=4.6,H1=2.8,H2=2.3,over=.35;
 // Base de pedra (afunda no chão para cobrir desníveis).
 part(g,box(W+.5,1.6,D+.5),M.stone,0,-.5,0);
 for(let i=0;i<7;i++){
  const x=-W/2-.1+i*(W+.2)/6;
  part(g,box(.55,.35,.12),M.stoneDark,x,.05,D/2+.27,{outline:false});
 }
 // Térreo.
 part(g,box(W,H1,D),M.plaster,0,.3+H1/2,0);
 // Segundo andar, um pouco mais largo (sobressai como em Mondstadt).
 const y2=.3+H1;
 part(g,box(W+over*2,.22,D+over*2),M.wood,0,y2+.11,0);
 part(g,box(W+over*2-.1,H2,D+over*2-.1),M.plaster,0,y2+.22+H2/2,0);
 // Vigas verticais nos cantos e no meio.
 const beam=(x,y,z,h)=>part(g,box(.2,h,.2),M.wood,x,y,z,{outlineScale:1.08});
 for(const sx of [-1,1])for(const sz of [-1,1]){
  beam(sx*(W/2),.3+H1/2,sz*(D/2),H1);
  beam(sx*(W/2+over-.05),y2+.22+H2/2,sz*(D/2+over-.05),H2);
 }
 beam(0,y2+.22+H2/2,D/2+over-.05,H2);
 // Vigas horizontais e diagonais (enxaimel) na fachada.
 const fz=D/2+over-.03;
 part(g,box(W+over*2,.16,.14),M.wood,0,y2+.22+H2*.5,fz,{outline:false});
 for(const sx of [-1,1]){
  part(g,box(.14,1.25,.14),M.wood,sx*(W/2+over)*.62,y2+.22+H2*.27,fz,{rot:[0,0,sx*.75],outline:false});
 }
 // Telhado de duas águas com beiral largo.
 const roofY=y2+.22+H2,roofH=2.1,roofW=(W+over*2)/2+.7,roofD=D+over*2+1.1;
 const slope=Math.atan2(roofH,roofW-.25),len=Math.hypot(roofW,roofH)+.15;
 for(const sx of [-1,1]){
  const r=part(g,box(len,.26,roofD),M.roof,sx*roofW/2,roofY+roofH/2,0,{rot:[0,0,-sx*slope]});
  // Faixas de telha (linhas mais escuras).
  for(let i=1;i<4;i++){
   const t=i/4,px=sx*(roofW*(1-t)),py=roofY+roofH*t+.15;
   part(g,box(.09,.08,roofD+.02),M.roofDark,px,py,0,{rot:[0,0,-sx*slope],outline:false});
  }
  r.name='Telhado';
 }
 part(g,box(.3,.3,roofD+.1),M.wood,0,roofY+roofH+.05,0);
 // Empenas triangulares.
 const gable=gableGeometry(W+over*2-.1,roofH-.1,D+over*2-.2);
 part(g,gable,M.plaster,0,roofY,0,{outline:false});
 part(g,box(.16,roofH-.2,.16),M.wood,0,roofY+(roofH-.2)/2,D/2+over-.05,{outline:false});
 // Chaminé.
 part(g,box(.7,1.9,.7),M.stone,-roofW*.45,roofY+roofH*.75,-.9);
 part(g,box(.85,.2,.85),M.stoneDark,-roofW*.45,roofY+roofH*.75+1,-.9);
 // Porta com moldura e degrau.
 part(g,box(1.25,2.05,.12),M.door,.9,.3+1.02,D/2+.04);
 part(g,box(1.5,.18,.16),M.wood,.9,.3+2.12,D/2+.06,{outline:false});
 for(const sx of [-1,1])part(g,box(.14,2.1,.16),M.wood,.9+sx*.68,.3+1.05,D/2+.06,{outline:false});
 part(g,box(1.7,.25,.8),M.stoneDark,.9,.12,D/2+.55);
 part(g,box(.12,.12,.12),M.metal,1.35,.3+1.05,D/2+.12,{outline:false});
 // Janelas com moldura branca, floreira e flores.
 const windowAt=(x,y,z,ry)=>{
  const w=new T.Group();w.position.set(x,y,z);w.rotation.y=ry;g.add(w);
  part(w,box(.95,1.05,.08),M.glass,0,0,0,{outline:false});
  part(w,box(1.15,.12,.14),M.wood,0,.58,.03,{outline:false});
  part(w,box(1.15,.12,.14),M.wood,0,-.58,.03,{outline:false});
  for(const sx of [-1,1])part(w,box(.12,1.2,.14),M.wood,sx*.53,0,.03,{outline:false});
  part(w,box(.06,1.05,.1),M.wood,0,0,.03,{outline:false});
  part(w,box(1.15,.24,.32),M.woodLight,0,-.76,.16);
  const flowers=[M.flowerA,M.flowerB,M.flowerC];
  for(let i=0;i<6;i++){
   part(w,new T.SphereGeometry(.11,8,6),flowers[i%3],-.45+i*.18,-.58,.18+(i%2)*.08,{outline:false});
   part(w,new T.SphereGeometry(.09,6,5),M.leaf,-.38+i*.16,-.66,.26,{outline:false});
  }
  return w;
 };
 windowAt(-1.4,.3+1.45,D/2+.03,0);
 windowAt(-1.5,y2+.22+H2*.55,D/2+over+.0,0);
 windowAt(1.5,y2+.22+H2*.55,D/2+over+.0,0);
 windowAt(W/2+.03,.3+1.45,0,Math.PI/2);
 windowAt(-W/2-.03,.3+1.45,.6,-Math.PI/2);
 windowAt(W/2+over,y2+.22+H2*.55,-.6,Math.PI/2);
 // Lampião ao lado da porta.
 part(g,box(.1,.5,.1),M.metal,1.85,.3+2.0,D/2+.25,{outline:false});
 part(g,box(.32,.42,.32),M.lamp,1.85,.3+1.6,D/2+.25,{outlineScale:1.1});
 // Caixotes e barril para dar vida.
 part(g,box(.7,.7,.7),M.woodLight,-2.3,.65,D/2+.7);
 part(g,box(.55,.55,.55),M.woodLight,-2.25,1.27,D/2+.7,{rot:[0,.4,0]});
 part(g,new T.CylinderGeometry(.38,.38,.9,12),M.wood,2.75,.75,D/2+.5);
 return g;
}

function findSpot(ground){
 const b=ground.bounds;
 let best=null;
 for(let r=12;r<=34&&!best;r+=2.5){
  for(let a=0;a<24;a++){
   const ang=a/24*Math.PI*2+r*.13;
   const x=Math.cos(ang)*r,z=Math.sin(ang)*r;
   if(x<b.x0+8||x>b.x1-8||z<b.z0+8||z>b.z1-8)continue;
   if(!ground.isOpen(x,z,4))continue;
   if(ground.greenAt(x,z)<.01)continue;
   let lo=Infinity,hi=-Infinity;
   for(const dx of [-3.5,0,3.5])for(const dz of [-3,0,3]){
    const h=ground.heightAt(x+dx,z+dz);lo=Math.min(lo,h);hi=Math.max(hi,h);
   }
   if(hi-lo>.9)continue;
   best={x,z,y:lo};break;
  }
 }
 return best;
}

function install(){
 const api=window.arcanoWaterV1226,ground=window.arcanoAnimeGround;
 if(!api||!api.scene||!ground){setTimeout(install,300);return;}
 const spot=findSpot(ground);
 if(!spot){console.warn('[Casa anime] sem espaço plano disponível');return;}
 const house=buildHouse();
 house.position.set(spot.x,spot.y,spot.z);
 // Fachada virada para o centro do mapa (onde fica a ponte).
 house.rotation.y=Math.atan2(-spot.x,-spot.z);
 house.updateMatrixWorld(true);
 api.scene.add(house);
 window.arcanoAnimeHouse=house;
 // Abre o terreno: árvores e arbustos originais que nasceram em cima da casa
 // são encolhidos até sumir (o sistema de distância só mexe na visibilidade).
 const clear=()=>{
  for(const a of api.forestInstances||[]){
   if(!a||!a.obj||a.type==='grass')continue;
   const p=a.obj.position;
   if((p.x-spot.x)**2+(p.z-spot.z)**2<7.5*7.5){
    if(a.fullScale&&a.fullScale.setScalar)a.fullScale.setScalar(.0001);
    if(a.obj.scale.x>.001){a.obj.scale.setScalar(.0001);a.obj.updateMatrixWorld(true);}
   }
  }
 };
 clear();setInterval(clear,3000);
 // Janelas e lampião acendem quando escurece.
 const sunDir=()=>window.arcanoAnimeSky&&window.arcanoAnimeSky.material.uniforms.uSunDir.value;
 setInterval(()=>{
  const s=sunDir();if(!s)return;
  const night=Math.min(1,Math.max(0,(-s.y+.02)/.2));
  M.glass.emissiveIntensity=night*1.1;
  M.lamp.emissiveIntensity=.2+night*1.6;
 },1000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
