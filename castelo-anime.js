/* Castelo central de Aurora (Ilha Central), inspirado na arte de referência:
   pedra clara, telhados e agulhas azuis, janelas azuis luminosas, torre
   central altíssima com o NÚCLEO DE ENERGIA da ilha no topo, muralha própria
   com torres e portão, fachada com portal em arco e rosácea, escadaria até a
   praça e chafariz com estátua alada.
   Para ficar leve, as peças são fundidas por material (poucas chamadas de
   desenho para o castelo inteiro). */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
let seed=5150;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

function canvasTex(w,h,draw){
 const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}
const stoneTex=canvasTex(256,256,(g,w,h)=>{
 g.fillStyle='#d9d2c6';g.fillRect(0,0,w,h);
 for(let r=0;r<8;r++){let x=-rnd()*40;const y=r*32;
  while(x<w){const bw=40+rnd()*44,l=84+rnd()*8;g.fillStyle=`hsl(38,${10+rnd()*8}%,${l}%)`;
   g.fillRect(x+1.5,y+1.5,bw-3,29);x+=bw;}}
 g.fillStyle='rgba(120,110,95,.18)';for(let i=0;i<500;i++)g.fillRect(rnd()*w,rnd()*h,2,2);
});
const roofTex=canvasTex(128,128,(g,w,h)=>{
 g.fillStyle='#2a57a8';g.fillRect(0,0,w,h);
 for(let r=0;r<8;r++)for(let c=0;c<8;c++){const x=c*16+(r%2?8:0),y=r*16;g.fillStyle=`hsl(220,${55+rnd()*12}%,${38+rnd()*10}%)`;
  g.beginPath();g.moveTo(x,y);g.lineTo(x+16,y);g.lineTo(x+16,y+11);g.quadraticCurveTo(x+8,y+19,x,y+11);g.closePath();g.fill();}
});
const M={
 stone:new T.MeshStandardMaterial({color:'#ffffff',map:stoneTex,roughness:1}),
 trim:new T.MeshStandardMaterial({color:'#c9c0b2',roughness:1}),
 roof:new T.MeshStandardMaterial({color:'#ffffff',map:roofTex,roughness:.9}),
 gold:new T.MeshStandardMaterial({color:'#e8c56a',roughness:.5,metalness:.2}),
 glow:new T.MeshStandardMaterial({color:'#9fe4ff',emissive:new T.Color('#4fc3ff'),emissiveIntensity:1.4,roughness:.4}),
 door:new T.MeshStandardMaterial({color:'#2c5aa8',emissive:new T.Color('#3aa8ff'),emissiveIntensity:.8,roughness:.6}),
 core:new T.MeshStandardMaterial({color:'#e8fbff',emissive:new T.Color('#7fe2ff'),emissiveIntensity:2.6,roughness:.2}),
 water:new T.MeshStandardMaterial({color:'#5fc8e8',emissive:new T.Color('#2a8fb8'),emissiveIntensity:.35,transparent:true,opacity:.85,roughness:.15}),
 banner:new T.MeshStandardMaterial({color:'#2f5fb5',side:T.DoubleSide,roughness:1})
};

// Junta todas as malhas de um grupo em uma por material.
function mergeGroup(group,scene,name){
 group.updateMatrixWorld(true);
 const buckets=new Map();
 group.traverse(o=>{
  if(!o.isMesh)return;
  let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
  g.applyMatrix4(o.matrixWorld);
  if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
  if(!buckets.has(o.material))buckets.set(o.material,[]);
  buckets.get(o.material).push(g);
 });
 const out=[];
 for(const [mat,list] of buckets){
  let n=0;for(const g of list)n+=g.attributes.position.count;
  const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2);let off=0;
  for(const g of list){
   P.set(g.attributes.position.array,off*3);
   if(g.attributes.normal)N.set(g.attributes.normal.array,off*3);
   U.set(g.attributes.uv.array.subarray(0,g.attributes.position.count*2),off*2);
   off+=g.attributes.position.count;g.dispose();
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.BufferAttribute(P,3));geo.setAttribute('normal',new T.BufferAttribute(N,3));geo.setAttribute('uv',new T.BufferAttribute(U,2));
  geo.computeBoundingSphere();
  const m=new T.Mesh(geo,mat);m.name=name;m.castShadow=mat!==M.water&&mat!==M.glow;m.receiveShadow=true;
  scene.add(m);out.push(m);
 }
 return out;
}

// Peças básicas (UV escalado pelo tamanho real, textura não estica).
function box(g,w,h,d,mat,x,y,z,ry=0){
 const geo=new T.BoxGeometry(w,h,d),uv=geo.attributes.uv,F=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
 for(let f=0;f<6;f++)for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,uv.getX(i)*F[f][0]/4,uv.getY(i)*F[f][1]/4);}
 const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.y=ry;g.add(m);return m;
}
function cyl(g,r1,r2,h,mat,x,y,z,seg=20){
 const geo=new T.CylinderGeometry(r1,r2,h,seg),uv=geo.attributes.uv;
 for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*2*Math.PI*r2/4,uv.getY(i)*h/4);
 const m=new T.Mesh(geo,mat);m.position.set(x,y+h/2,z);g.add(m);return m;
}
function spire(g,r,h,x,y,z,seg=16){
 const cone=new T.Mesh(new T.ConeGeometry(r,h,seg),M.roof);cone.position.set(x,y+h/2,z);g.add(cone);
 const tip=new T.Mesh(new T.ConeGeometry(r*.12,h*.25,8),M.gold);tip.position.set(x,y+h+h*.1,z);g.add(tip);
}
// Torre: corpo, anel, ameias pequenas, janelas azuis e agulha azul.
function tower(g,x,z,r,h,y0=0,spH){
 cyl(g,r,r*1.06,h,M.stone,x,y0,z);
 cyl(g,r+.35,r+.35,.6,M.trim,x,y0+h-.3,z);
 const nw=Math.max(3,Math.round(r*1.6));
 for(let lv=0;lv<Math.floor(h/6);lv++)for(let k=0;k<nw;k++){
  const a=k/nw*Math.PI*2+lv*.4,wy=y0+4+lv*6;
  const win=box(g,.55,1.5,.2,M.glow,x+Math.cos(a)*(r+.02),wy,z+Math.sin(a)*(r+.02));win.rotation.y=-a+Math.PI/2;
 }
 spire(g,r+.6,spH||r*3.4,x,y0+h,z);
}

function build(api,site){
 const scene=api.scene,root=new T.Group();
 root.position.set(site.x,site.y,site.z);
 const O=window.arcanoObstacles;
 const W=(lx,lz)=>({x:site.x+lx,z:site.z+lz});
 // ---------- Muralha do castelo ----------
 const RW=29,GATE=Math.PI/2;
 const ang=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
 const segs=60;
 for(let i=0;i<segs;i++){
  const a=(i+.5)/segs*Math.PI*2;if(ang(a,GATE)<.17)continue;
  const x=Math.cos(a)*RW,z=Math.sin(a)*RW,len=2*Math.PI*RW/segs*1.05;
  box(root,len,7,1.8,M.stone,x,3.5,z,-a+Math.PI/2);
  for(const k of [-.25,.25]){const aa=a+k*len/RW;box(root,.9,1.1,.7,M.stone,Math.cos(aa)*(RW+.55),7.5,Math.sin(aa)*(RW+.55),-aa+Math.PI/2);}
  if(O){const w=W(x,z);O.addBox({x:w.x,z:w.z,hw:len/2,hd:.9,rot:-a+Math.PI/2});}
 }
 for(const a of [GATE-.22,GATE+.22,GATE+1.25,GATE+2.3,GATE+3.14,GATE-1.25,GATE-2.3]){
  tower(root,Math.cos(a)*RW,Math.sin(a)*RW,2.4,11,0,6.5);
  if(O){const w=W(Math.cos(a)*RW,Math.sin(a)*RW);O.addCircle(w.x,w.z,2.7);}
 }
 // Arco do portão da muralha.
 {
  const s=new T.Shape();s.moveTo(-5.5,0);s.lineTo(5.5,0);s.lineTo(5.5,8.5);s.lineTo(-5.5,8.5);s.lineTo(-5.5,0);
  const hole=new T.Path();hole.moveTo(-2.4,0);hole.lineTo(2.4,0);hole.lineTo(2.4,4.6);hole.absarc(0,4.6,2.4,0,Math.PI,false);hole.lineTo(-2.4,0);s.holes.push(hole);
  const g=new T.ExtrudeGeometry(s,{depth:2.4,bevelEnabled:false});g.translate(0,0,-1.2);
  const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/4,uv.getY(i)/4);
  const arch=new T.Mesh(g,M.stone);arch.position.set(0,0,RW);root.add(arch);
  box(root,1.4,3,.1,M.banner,-3.6,5.2,RW+1.25);box(root,1.4,3,.1,M.banner,3.6,5.2,RW+1.25);
 }
 // ---------- Corpo principal ----------
 // Salão (atrás) com telhado azul.
 box(root,24,16,16,M.stone,0,8,-8);
 {const r=new T.Mesh(new T.ConeGeometry(1,1,4),M.roof);r.rotation.y=Math.PI/4;r.scale.set(18,9,12);r.position.set(0,16+4.5,-8);root.add(r);}
 for(const sx of [-1,1])for(let k=0;k<5;k++)for(let lv=0;lv<2;lv++){
  box(root,.2,2.6,1.1,M.glow,sx*12.02,4+lv*6,-14+k*3);
 }
 for(let k=0;k<6;k++)for(let lv=0;lv<2;lv++)box(root,1.2,2.8,.2,M.glow,-9+k*3.6,4+lv*6,.02);
 if(O){const w=W(0,-8);O.addBox({x:w.x,z:w.z,hw:12.5,hd:8.5,rot:0});}
 // Fachada com portal em arco e rosácea.
 box(root,11,20,4,M.stone,0,10,2);
 {const r=new T.Mesh(new T.ConeGeometry(1,1,4),M.roof);r.rotation.y=Math.PI/4;r.scale.set(8.5,7,3.6);r.position.set(0,20+3.5,2);root.add(r);}
 box(root,4.4,8,.4,M.door,0,4,4.05);
 {const top=new T.Mesh(new T.CylinderGeometry(2.2,2.2,.4,20,1,false,0,Math.PI),M.door);top.rotation.x=Math.PI/2;top.rotation.z=Math.PI/2;top.position.set(0,8,4.05);root.add(top);}
 box(root,5.4,.5,.6,M.gold,0,.25,4.2);
 {const rose=new T.Mesh(new T.CylinderGeometry(2.1,2.1,.3,24),M.glow);rose.rotation.x=Math.PI/2;rose.position.set(0,13.5,4.1);root.add(rose);
  const ring=new T.Mesh(new T.TorusGeometry(2.25,.25,8,28),M.gold);ring.position.set(0,13.5,4.2);root.add(ring);}
 for(const sx of [-1,1])tower(root,sx*6.8,4,2.3,24,0,9);
 if(O){const w=W(0,2);O.addBox({x:w.x,z:w.z,hw:9,hd:2.6,rot:0});}
 // Torres dos cantos do salão e torrinhas.
 for(const [x,z] of [[-12.5,-16],[12.5,-16],[-12.5,0],[12.5,0]]){tower(root,x,z,3,28,0,11);if(O){const w=W(x,z);O.addCircle(w.x,w.z,3.3);}}
 for(const [x,z,h] of [[-6,-17,30],[6,-17,30],[-17,-8,22],[17,-8,22],[-9,-3,26],[9,-3,26],[0,-17.5,24],[-15,4,18],[15,4,18]])
  tower(root,x,z,1.5,h,0,7);
 // ---------- Torre central com o núcleo de energia ----------
 tower(root,0,-9,5.5,42,0,0);
 cyl(root,6.3,6.3,1,M.trim,0,41.5,-9);
 for(let k=0;k<10;k++){const a=k/10*Math.PI*2;box(root,1.2,1.4,.8,M.stone,Math.cos(a)*6,43.2,-9+Math.sin(a)*6,-a+Math.PI/2);}
 spire(root,6.2,22,0,42.5,-9,20);
 // Quatro torres em volta da central.
 for(const [x,z] of [[-7,-15],[7,-15],[-7,-3],[7,-3]])tower(root,x,z,2.4,34,0,10);
 scene.add(root);
 mergeGroup(root,scene,'Castelo de Aurora');
 scene.remove(root);
 // Núcleo de energia: cristal brilhando acima da agulha central (fora da fusão: gira).
 const coreY=site.y+42.5+22+5;
 const core=new T.Mesh(new T.OctahedronGeometry(3.2,0),M.core);core.position.set(site.x,coreY,site.z-9);core.name='Núcleo de energia da Ilha Central';
 scene.add(core);
 const halo=new T.Mesh(new T.TorusGeometry(4.6,.18,8,40),M.gold);halo.position.copy(core.position);halo.rotation.x=Math.PI/2;scene.add(halo);
 const light=new T.PointLight('#8fe0ff',2.4,120,1.4);light.position.copy(core.position);scene.add(light);

 // ---------- Escadaria até a praça ----------
 const stairs=new T.Group();
 const h=window.arcanoIslandHeight;
 const z0=RW+1.5,z1=74,STEP=.7;
 for(let z=z0;z<z1;z+=STEP){
  const wz=site.z+z,y=h(site.x,wz);
  box(stairs,9,.5,STEP+.05,M.trim,site.x,y-.08,wz);
  for(const sx of [-1,1])box(stairs,.6,1.1,STEP+.05,M.stone,site.x+sx*4.8,y+.45,wz);
 }
 for(const sx of [-1,1])for(let z=z0;z<z1;z+=6){const wz=site.z+z;box(stairs,.9,2.2,.9,M.stone,site.x+sx*4.8,h(site.x,wz)+1,wz);
  const lamp=new T.Mesh(new T.BoxGeometry(.45,.6,.45),M.glow);lamp.position.set(site.x+sx*4.8,h(site.x,wz)+2.4,wz);stairs.add(lamp);}
 mergeGroup(stairs,scene,'Escadaria do castelo');
 // ---------- Praça com chafariz e estátua alada ----------
 const fz=site.z+88,fy=h(site.x,fz);
 const plaza=new T.Group();
 cyl(plaza,6.6,6.9,.9,M.trim,site.x,fy,fz,40);
 const water=new T.Mesh(new T.CylinderGeometry(6.1,6.1,.15,40),M.water);water.position.set(site.x,fy+.75,fz);plaza.add(water);
 cyl(plaza,2.2,2.6,1.6,M.trim,site.x,fy,fz,24);
 const bowl=new T.Mesh(new T.CylinderGeometry(2.6,1.2,.8,24),M.trim);bowl.position.set(site.x,fy+2.4,fz);plaza.add(bowl);
 cyl(plaza,.9,1.1,2.2,M.stone,site.x,fy+2.8,fz,16);
 // Estátua alada (corpo, cabeça, asas abertas).
 const sy=fy+5;
 const body=new T.Mesh(new T.ConeGeometry(.75,2.6,12),M.stone);body.position.set(site.x,sy+1.3,fz);plaza.add(body);
 const head=new T.Mesh(new T.SphereGeometry(.38,12,10),M.stone);head.position.set(site.x,sy+2.85,fz);plaza.add(head);
 const wingShape=new T.Shape();wingShape.moveTo(0,0);wingShape.bezierCurveTo(1.2,.8,2.6,2.4,3.2,3.6);wingShape.bezierCurveTo(2.2,2.6,1.6,1.4,.2,-.6);wingShape.lineTo(0,0);
 for(const sx of [-1,1]){
  const wg=new T.ExtrudeGeometry(wingShape,{depth:.15,bevelEnabled:false});
  const wing=new T.Mesh(wg,M.stone);wing.position.set(site.x+sx*.25,sy+1.6,fz-.2);wing.scale.x=sx;wing.rotation.y=sx*.35;plaza.add(wing);
 }
 const staff=new T.Mesh(new T.CylinderGeometry(.06,.06,2.8,6),M.gold);staff.position.set(site.x+.6,sy+2.2,fz+.3);staff.rotation.z=-.3;plaza.add(staff);
 mergeGroup(plaza,scene,'Praça do chafariz');
 if(O)O.addCircle(site.x,fz,6.9);
 // Brilho noturno das janelas e do núcleo.
 setInterval(()=>{
  const s=window.arcanoAnimeSky&&window.arcanoAnimeSky.material.uniforms.uSunDir.value;
  const night=s?Math.min(1,Math.max(0,(-s.y+.02)/.2)):0;
  M.glow.emissiveIntensity=1.2+night*1.6;M.door.emissiveIntensity=.7+night*1.2;
  const t=performance.now()/1000;core.rotation.y=t*.5;core.position.y=coreY+Math.sin(t*.8)*.8;halo.rotation.z=t*.3;halo.position.y=core.position.y;
 },50);
 window.arcanoCastle={core,site};
}

function install(){
 const api=window.arcanoWaterV1226,site=window.arcanoCastleSite;
 if(!api||!api.scene||!site||!window.arcanoIslandHeight){setTimeout(install,300);return;}
 build(api,site);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
