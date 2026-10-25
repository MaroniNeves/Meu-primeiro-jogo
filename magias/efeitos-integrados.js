/* Efeitos 3D integrados à cena das 100 Magias — sem segundo canvas, câmera ou renderizador. */
(function(){
'use strict';
const CATALOG=[
 ['slash','⚔️ Corte clássico','sword',0x62caff],['sw_h','↔️ Corte horizontal','sword',0x73cfff],
 ['sw_v','⬇️ Corte vertical','sword',0xffc975],['sw_x','✖️ Corte em X','sword',0xff6674],
 ['sw_spin','🌀 Giro 360°','sword',0x39edc8],['sw_combo','✳️ Combo triplo','sword',0x8ec9ff],
 ['shield','🛡️ Escudo verde','shield',0x66ff80],['shield_void','🔰 Escudo abissal','shield',0x9d74ff],
 ['bolt','⚡ Relâmpago','bolt',0x47a8ff],['fire','🔥 Bola de fogo','orb',0xff6536],
 ['ice','❄️ Cristais de gelo','crystal',0x55bfff],['water','💧 Vórtice de água','vortex',0x39caff],
 ['light','☀️ Pilar de luz','pillar',0xffcd68],['void','🌀 Portal arcano','portal',0xb75aff],
 ['necro','☠️ Necromancia','vortex',0x32eaa8],['earth','🪨 Terra explosiva','crystal',0xf2a855],
 ['orb','🔮 Orbe arcano','orb',0x9d70ff],['sw_ground','💥 Ruptura do solo','ring',0xff9a52]
];
const active=[];let rendererApp=null,three=null,clock=null,selected=CATALOG[0],visible=false;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function ready(){const app=window.arcanoLab?.getApp?.();if(!app?.scene||!app?.character?.position)return false;rendererApp=app;three=app.scene.constructor===Object?window.THREE:null;return true;}
function sceneThree(){
 if(window.THREE?.Group)return window.THREE;
 // A biblioteca original expõe uma classe THREE por meio de seus objetos de cena.
 return rendererApp?.scene?.constructor?.prototype?.isScene?window.THREE:null;
}
function cast(){
 const app=window.arcanoLab?.getApp?.();
 const T=window.arcanoEffectsThree;
 if(!app?.scene||!app?.character?.position||!T?.Group){message('Aguardando cena principal e Three.js…');return;}
 const scene=app.scene, group=new T.Group(),p=app.character.position;
 const direction=new T.Vector3().subVectors(p,app.camera?.position||new T.Vector3(p.x,p.y,p.z+5));direction.y=0;
 if(direction.lengthSq()<.01)direction.set(0,0,1);direction.normalize();
 const pos=p.clone().addScaledVector(direction,2.65);pos.y=p.y+.12;
 group.position.copy(pos);scene.add(group);
 const material=(color,opacity=.8)=>new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
 const add=(geom,mat,x=0,y=0,z=0)=>{const mesh=new T.Mesh(geom,mat);mesh.position.set(x,y,z);group.add(mesh);return mesh;};
 const ring=(radius,color)=>{const m=add(new T.TorusGeometry(radius,.045,6,90),material(color,.83),0,.10,0);m.rotation.x=Math.PI/2;return m;};
 const [id,name,type,color]=selected;
 const movers=[];let ttl=2.3;
 if(type==='sword'){
  const count=id==='sw_combo'?3:id==='sw_x'?2:1;
  for(let j=0;j<count;j++){
   const arc=id==='sw_spin'?Math.PI*1.9:Math.PI*1.20;
   const geometry=new T.TorusGeometry(1.35,.070,7,85,arc);
   const m=add(geometry,material(color,.88),0,1.45,0);
   m.rotation.set(j%2?.32:-.24,j*.36,(id==='sw_v'?Math.PI*.5:id==='sw_x'?(j?-.75:.75):0));
   movers.push({m,j,style:'sword'});
  }
 }else if(type==='shield'){
  const dome=add(new T.SphereGeometry(1.9,32,20,0,Math.PI*2,0,Math.PI/2),material(color,.20));
  ring(1.90,color);movers.push({m:dome,style:'shield'});
 }else if(type==='bolt'){
  const pts=[];for(let j=0;j<15;j++)pts.push(new T.Vector3((j%2?-.20:.23)*Math.sin(j*7),3.4-j*.22,0));
  const line=add(new T.TubeGeometry(new T.CatmullRomCurve3(pts),40,.046,5,false),material(color,.94));
  movers.push({m:line,style:'bolt'});
 }else if(type==='crystal'){
  for(let j=0;j<13;j++){const a=j*2.399,rad=.24+j%4*.34;
   const m=add(new T.OctahedronGeometry(.35+(j%3)*.15),material(color,.60),Math.cos(a)*rad,.45+(j%3)*.27,Math.sin(a)*rad);
   m.scale.y=2.3;movers.push({m,style:'crystal'});}
  ring(1.8,color);
 }else if(type==='pillar'){
  const m=add(new T.CylinderGeometry(.40,.86,4.4,28,1,true),material(color,.30),0,2.1,0);movers.push({m,style:'pillar'});ring(1.40,color);
 }else if(type==='portal'||type==='vortex'){
  for(let j=0;j<4;j++){const m=add(new T.TorusGeometry(.6+j*.24,.047,6,90),material(color,.70),0,1.6+j*.22,0);movers.push({m,j,style:'spin'});}
 }else if(type==='ring'){for(let j=0;j<3;j++)movers.push({m:ring(.55+j*.4,color),j,style:'ring'});}
 else {
  const m=add(new T.IcosahedronGeometry(.58,2),material(color,.68),0,1.65,0);movers.push({m,style:'orb'});
  for(let j=0;j<3;j++){const a=add(new T.TorusGeometry(.9+j*.17,.033,5,64),material(color,.70),0,1.65,0);movers.push({m:a,j,style:'spin'});}
 }
 group.userData.arcanoIntegratedFX=true;
 active.push({group,movers,age:0,ttl});message(name+' · lançado na cena principal');
}
function update(delta){
 const dt=clamp(Number(delta)||.016,0,.08);
 for(let i=active.length-1;i>=0;i--){
  const item=active[i];item.age+=dt;const t=item.age,fade=clamp((item.ttl-t)/.55,0,1);
  for(const {m,j=0,style} of item.movers){
   if(style==='spin'){m.rotation.y=t*(1.4+j*.5);m.rotation.x=.35+Math.sin(t+j)*.32;}
   if(style==='sword')m.rotation.y=t*2.4+j*.8;
   if(style==='ring')m.scale.setScalar(1+t*.6);
   if(style==='bolt')m.rotation.y=Math.sin(t*27)*.07;
   if(style==='orb')m.rotation.y=t*.8;
   if(style==='shield')m.rotation.y=t*.45;
   if(style==='crystal')m.rotation.y=t*.30+j*.14;
   m.material.opacity=clamp((m.material.userData.baseOpacity??=m.material.opacity)*fade,0,1);
  }
  if(t>=item.ttl){item.group.traverse(o=>{if(o.isMesh){o.geometry?.dispose();o.material?.dispose();}});item.group.parent?.remove(item.group);active.splice(i,1);}
 }
}
function clear(){for(const item of active){item.group.traverse(o=>{if(o.isMesh){o.geometry?.dispose();o.material?.dispose();}});item.group.parent?.remove(item.group);}active.length=0;}
function message(s){const o=document.getElementById('arcanoIntegratedStatus');if(o)o.textContent=s;}
function init(){
 const panel=document.getElementById('arcanoIntegratedPanel');if(!panel)return;
 const list=document.getElementById('arcanoIntegratedList'),btn=document.getElementById('arcanoIntegratedCast');
 for(const item of CATALOG){
  const b=document.createElement('button');b.type='button';b.textContent=item[1];b.className='arcano-effect-choice';
  b.onclick=()=>{selected=item;for(const e of list.children)e.classList.toggle('selected',e===b);message(item[1]+' selecionado');};
  list.append(b);
 }
 list.firstElementChild?.classList.add('selected');btn.addEventListener('click',cast);
 // Atualiza efeitos na própria animação do aplicativo, sem criar segundo renderer.
 let last=performance.now();
 function frame(now){requestAnimationFrame(frame);const dt=(now-last)/1000;last=now;if(document.visibilityState==='visible'&&active.length)update(dt);}
 requestAnimationFrame(frame);
 window.arcanoSharedEffects={cast,clear,select(id){const i=CATALOG.findIndex(p=>p[0]===id);if(i>=0)list.children[i].click();},catalog:CATALOG};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();