/* Castelo central de Aurora — fortaleza de 4 andares no estilo Mondstadt.
   - Exterior: pedra cinza-quente, base escura, cantarias de arenito, ardósia e
     cobre; torres de canto com ameias, campanário com o núcleo de energia,
     pórtico com colunas. Tudo apoiado no mesmo pedestal.
   - Interior: paredes INTEIRAS do piso ao teto, portas entre as salas, escada
     em ESPIRAL numa torre redonda ligando os 4 andares, ~20 cômodos com móveis
     e um trono imponente (degraus, baldaquino, braseiros, estandartes).
   - Ao entrar: só o andar atual aparece, sem telhado, e as paredes externas do
     lado da câmera somem (com margem, sem "piscar"). Nome do cômodo no topo.
   - Chafariz da praça funcionando (jatos, cascatas, água animada). */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
let seed=5150;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

// ---------- Texturas ----------
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
const blocks=(base,hue,sat,l0,l1)=>canvasTex(256,256,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);
 for(let r=0;r<8;r++){let x=-rnd()*40;const y=r*32;while(x<w){const bw=36+rnd()*48;g.fillStyle=`hsl(${hue+rnd()*10-5},${sat+rnd()*6}%,${l0+rnd()*(l1-l0)}%)`;
  g.fillRect(x+1.5,y+1.5,bw-3,29);g.fillStyle='rgba(255,255,255,.05)';g.fillRect(x+3,y+3,bw-6,4);x+=bw;}}
 g.fillStyle='rgba(60,50,40,.12)';for(let i=0;i<700;i++)g.fillRect(rnd()*w,rnd()*h,2,2);});
// Madeira de verdade: tábuas, veios ondulados e nós.
function woodTex(hue,light){return canvasTex(256,256,(g,w,h)=>{
 const boards=4;
 for(let b=0;b<boards;b++){
  const x0=b*w/boards,bw=w/boards,l=light+rnd()*8-4;
  g.fillStyle=`hsl(${hue+rnd()*6-3},45%,${l}%)`;g.fillRect(x0,0,bw,h);
  for(let k=0;k<14;k++){
   const gx=x0+3+rnd()*(bw-6),amp=1.5+rnd()*3,freq=.02+rnd()*.03;
   g.strokeStyle=`rgba(${60+rnd()*30},${30+rnd()*20},12,${.18+rnd()*.2})`;g.lineWidth=.8+rnd()*1.2;
   g.beginPath();for(let y=0;y<=h;y+=4){const xx=gx+Math.sin(y*freq+k)*amp;if(y)g.lineTo(xx,y);else g.moveTo(xx,y);}g.stroke();
  }
  for(let k=0;k<2;k++){const kx=x0+8+rnd()*(bw-16),ky=rnd()*h;
   g.fillStyle='rgba(70,35,15,.55)';g.beginPath();g.ellipse(kx,ky,3+rnd()*3,6+rnd()*5,0,0,6.3);g.fill();
   g.strokeStyle='rgba(70,35,15,.3)';g.beginPath();g.ellipse(kx,ky,7,13,0,0,6.3);g.stroke();}
  g.fillStyle='rgba(25,12,5,.75)';g.fillRect(x0,0,2,h);
  g.fillStyle='rgba(255,230,190,.07)';g.fillRect(x0+2,0,3,h);
 }
});}
const TX={
 wall:blocks('#6d6a66',34,8,62,76),base:blocks('#4b4a4c',220,6,38,50),trim:blocks('#9b8a6a',40,30,62,72),
 inner:blocks('#7a756c',38,14,70,80),
 slate:canvasTex(128,128,(g,w,h)=>{g.fillStyle='#38475a';g.fillRect(0,0,w,h);for(let r=0;r<8;r++)for(let c=0;c<8;c++){const x=c*16+(r%2?8:0),y=r*16;g.fillStyle=`hsl(212,${16+rnd()*10}%,${30+rnd()*12}%)`;g.beginPath();g.moveTo(x,y);g.lineTo(x+16,y);g.lineTo(x+16,y+12);g.quadraticCurveTo(x+8,y+18,x,y+12);g.closePath();g.fill();}}),
 copper:canvasTex(64,64,(g,w,h)=>{g.fillStyle='#5d9a8a';g.fillRect(0,0,w,h);for(let i=0;i<120;i++){g.fillStyle=`rgba(${120+rnd()*60},${170+rnd()*40},${150+rnd()*40},.35)`;g.fillRect(rnd()*w,rnd()*h,3,3);}}),
 floor:canvasTex(256,256,(g,w,h)=>{for(let r=0;r<8;r++)for(let c=0;c<8;c++){const l=(r+c)%2?62:48;g.fillStyle=`hsl(30,10%,${l+rnd()*6}%)`;g.fillRect(c*32,r*32,32,32);g.strokeStyle='rgba(30,25,20,.35)';g.strokeRect(c*32,r*32,32,32);}}),
 wood:woodTex(28,36),woodDark:woodTex(22,22),woodLight:woodTex(32,52),
 carpet:canvasTex(64,256,(g,w,h)=>{g.fillStyle='#8f2a2a';g.fillRect(0,0,w,h);g.fillStyle='#e0b85a';g.fillRect(0,0,5,h);g.fillRect(w-5,0,5,h);for(let y=0;y<h;y+=32){g.beginPath();g.moveTo(w/2,y+6);g.lineTo(w/2+8,y+16);g.lineTo(w/2,y+26);g.lineTo(w/2-8,y+16);g.closePath();g.fill();}}),
 books:canvasTex(256,64,(g,w,h)=>{let x=0;while(x<w){const bw=4+rnd()*7;g.fillStyle=`hsl(${rnd()*360},${30+rnd()*30}%,${28+rnd()*22}%)`;g.fillRect(x,6+rnd()*10,bw-1,h);g.fillStyle='rgba(230,200,120,.6)';g.fillRect(x,30+rnd()*10,bw-1,2);x+=bw;}g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,0,w,6);}),
 rug:canvasTex(128,128,(g,w,h)=>{g.fillStyle='#2f4f7f';g.fillRect(0,0,w,h);g.strokeStyle='#d8b45a';g.lineWidth=6;g.strokeRect(8,8,w-16,h-16);g.lineWidth=2;g.strokeRect(20,20,w-40,h-40);g.fillStyle='#d8b45a';g.beginPath();g.arc(w/2,h/2,16,0,6.3);g.fill();})
};
const mat=o=>new T.MeshStandardMaterial(Object.assign({roughness:1,metalness:0},o));
const M={
 wall:mat({color:'#ffffff',map:TX.wall}),base:mat({color:'#ffffff',map:TX.base}),trim:mat({color:'#ffffff',map:TX.trim}),
 inner:mat({color:'#ffffff',map:TX.inner}),slate:mat({color:'#ffffff',map:TX.slate}),copper:mat({color:'#ffffff',map:TX.copper}),
 floor:mat({color:'#ffffff',map:TX.floor}),wood:mat({color:'#ffffff',map:TX.wood}),woodDark:mat({color:'#ffffff',map:TX.woodDark}),woodLight:mat({color:'#ffffff',map:TX.woodLight}),
 carpet:mat({color:'#ffffff',map:TX.carpet}),books:mat({color:'#ffffff',map:TX.books}),rug:mat({color:'#ffffff',map:TX.rug}),
 gold:mat({color:'#d8b45a',roughness:.4,metalness:.35}),iron:mat({color:'#2e2e34'}),steel:mat({color:'#9aa3ad',roughness:.35,metalness:.5}),
 red:mat({color:'#9e2b2a',side:T.DoubleSide}),velvet:mat({color:'#7a1f2b'}),blue:mat({color:'#2f5a8f',side:T.DoubleSide}),cloth:mat({color:'#e9e1cf'}),
 glass:mat({color:'#ffe2a6',emissive:new T.Color('#ffb85a'),emissiveIntensity:1.1}),
 candle:mat({color:'#fff1c2',emissive:new T.Color('#ffc566'),emissiveIntensity:1.8}),
 fire:mat({color:'#ff9a3c',emissive:new T.Color('#ff7a1a'),emissiveIntensity:2}),
 core:mat({color:'#e8fbff',emissive:new T.Color('#7fe2ff'),emissiveIntensity:2.6,roughness:.2}),
 leaf:mat({color:'#4f8f45'}),paint:[mat({color:'#3d6d8f'}),mat({color:'#8f6a3d'}),mat({color:'#5f8f4a'}),mat({color:'#8f3d5a'})]
};

// ---------- Peças ----------
function boxUV(geo,w,h,d,tile){const uv=geo.attributes.uv,F=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];for(let f=0;f<6;f++)for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,uv.getX(i)*F[f][0]/tile,uv.getY(i)*F[f][1]/tile);}return geo;}
function box(g,w,h,d,m,x,y,z,ry=0,tile=4){const mm=new T.Mesh(boxUV(new T.BoxGeometry(w,h,d),w,h,d,tile),m);mm.position.set(x,y,z);mm.rotation.y=ry;g.add(mm);return mm;}
function cyl(g,r1,r2,h,m,x,y,z,seg=16,tile=4){const geo=new T.CylinderGeometry(r1,r2,h,seg),uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*2*Math.PI*Math.max(r1,r2)/tile,uv.getY(i)*h/tile);const mm=new T.Mesh(geo,m);mm.position.set(x,y+h/2,z);g.add(mm);return mm;}
function pyramid(g,w,d,h,m,x,y,z){const geo=new T.ConeGeometry(Math.SQRT1_2,1,4,1);geo.rotateY(Math.PI/4);const mm=new T.Mesh(geo,m);mm.scale.set(w,h,d);mm.position.set(x,y+h/2,z);g.add(mm);return mm;}
function prismX(g,len,w,h,m,x,y,z){const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,h);s.lineTo(-w/2,0);const geo=new T.ExtrudeGeometry(s,{depth:len,bevelEnabled:false});geo.translate(0,0,-len/2);geo.rotateY(Math.PI/2);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/3,uv.getY(i)/3);const mm=new T.Mesh(geo,m);mm.position.set(x,y,z);g.add(mm);return mm;}
function prismZ(g,len,w,h,m,x,y,z){const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,h);s.lineTo(-w/2,0);const geo=new T.ExtrudeGeometry(s,{depth:len,bevelEnabled:false});geo.translate(0,0,-len/2);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/3,uv.getY(i)/3);const mm=new T.Mesh(geo,m);mm.position.set(x,y,z);g.add(mm);return mm;}
function crenels(g,x0,x1,z0,z1,y,step=1.6){for(let x=x0;x<=x1+1e-3;x+=step){box(g,.8,1,.6,M.wall,x,y+.5,z0);box(g,.8,1,.6,M.wall,x,y+.5,z1);}for(let z=z0+step;z<=z1-step+1e-3;z+=step){box(g,.6,1,.8,M.wall,x0,y+.5,z);box(g,.6,1,.8,M.wall,x1,y+.5,z);}}
function squareTower(g,x,z,s,h){box(g,s+.6,2,s+.6,M.base,x,1,z);box(g,s,h,s,M.wall,x,h/2,z);for(const y of [h*.35,h*.7])box(g,s+.3,.5,s+.3,M.trim,x,y,z);box(g,s+.6,.7,s+.6,M.trim,x,h-.35,z);crenels(g,x-s/2,x+s/2,z-s/2,z+s/2,h,1.4);
 for(let lv=0;lv<Math.floor(h/6.5);lv++)for(const [dx,dz,r] of [[0,s/2+.02,0],[0,-s/2-.02,0],[s/2+.02,0,Math.PI/2],[-s/2-.02,0,Math.PI/2]])box(g,.8,1.8,.1,M.glass,x+dx,3.5+lv*6.5,z+dz,r);
 pyramid(g,s+1,s+1,s*.95,M.slate,x,h+1,z);box(g,.3,1.4,.3,M.copper,x,h+1+s*.95+.7,z);}
function mergeInto(group,parent,name){
 group.updateMatrixWorld(true);const buckets=new Map();
 group.traverse(o=>{if(!o.isMesh)return;let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(!buckets.has(o.material))buckets.set(o.material,[]);buckets.get(o.material).push(g);});
 for(const [m,list] of buckets){let n=0;for(const g of list)n+=g.attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2);let off=0;
  for(const g of list){P.set(g.attributes.position.array,off*3);if(g.attributes.normal)N.set(g.attributes.normal.array,off*3);U.set(g.attributes.uv.array.subarray(0,g.attributes.position.count*2),off*2);off+=g.attributes.position.count;g.dispose();}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(P,3));geo.setAttribute('normal',new T.BufferAttribute(N,3));geo.setAttribute('uv',new T.BufferAttribute(U,2));geo.computeBoundingSphere();
  const mesh=new T.Mesh(geo,m);mesh.name=name;mesh.castShadow=m!==M.glass&&m!==M.candle&&m!==M.core&&m!==M.fire;mesh.receiveShadow=true;parent.add(mesh);}
}

// ---------- Planta do prédio ----------
const BX=16,BZ0=-16,BZ1=8,FH=6.5,NF=4,TOP=FH*NF;   // 32 × 24 m, 4 andares, 26 m
const ST={x:11,z:2,r:3.1,door:Math.PI};          // torre da escada em espiral
const Fy=k=>k*FH;

function build(api,site){
 const scene=api.scene,O=window.arcanoObstacles;
 const root=new T.Group();root.position.set(site.x,site.y,site.z);scene.add(root);
 const W=(lx,lz)=>({x:site.x+lx,z:site.z+lz});
 const obsBox=(lx,lz,hw,hd,k)=>{if(!O)return;const w=W(lx,lz),b={x:w.x,z:w.z,hw,hd,rot:0};if(k!=null){b.ymin=site.y+Fy(k)-.6;b.ymax=site.y+Fy(k+1)-.6;}O.addBox(b);};
 const ang=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));

 // ===== Exterior fixo (fundido): muralha, torres, campanário, pórtico =====
 const ext=new T.Group();
 box(ext,38,1.2,30,M.base,0,-.66,-4);
 const RW=29,GATE=Math.PI/2,segs=60;
 for(let i=0;i<segs;i++){
  const a=(i+.5)/segs*Math.PI*2;if(ang(a,GATE)<.15)continue;
  const x=Math.cos(a)*RW,z=Math.sin(a)*RW,len=2*Math.PI*RW/segs*1.06,ry=-a+Math.PI/2;
  box(ext,len,1.4,2.2,M.base,x,.7,z,ry);box(ext,len,6,1.8,M.wall,x,4.2,z,ry);box(ext,len,.4,2.1,M.trim,x,7.3,z,ry);
  for(const k of [-.25,.25]){const aa=a+k*len/RW;box(ext,.9,1,.6,M.wall,Math.cos(aa)*(RW+.6),8,Math.sin(aa)*(RW+.6),-aa+Math.PI/2);}
  if(O){const w=W(x,z);O.addBox({x:w.x,z:w.z,hw:len/2,hd:1.1,rot:ry});}
 }
 for(const a of [GATE-.2,GATE+.2,GATE+1.2,GATE+2.25,GATE+3.14,GATE-1.2,GATE-2.25]){const x=Math.cos(a)*RW,z=Math.sin(a)*RW;squareTower(ext,x,z,4.4,11);if(O){const w=W(x,z);O.addCircle(w.x,w.z,3.1);}}
 {const s=new T.Shape();s.moveTo(-5,0);s.lineTo(5,0);s.lineTo(5,9);s.lineTo(-5,9);s.lineTo(-5,0);const hole=new T.Path();hole.moveTo(-2.3,0);hole.lineTo(2.3,0);hole.lineTo(2.3,4.4);hole.absarc(0,4.4,2.3,0,Math.PI,false);hole.lineTo(-2.3,0);s.holes.push(hole);
  const geo=new T.ExtrudeGeometry(s,{depth:2.6,bevelEnabled:false});geo.translate(0,0,-1.3);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/4,uv.getY(i)/4);
  const arch=new T.Mesh(geo,M.wall);arch.position.set(0,0,RW);ext.add(arch);box(ext,10.4,.5,3,M.trim,0,9.2,RW);
  for(const sx of [-1,1]){box(ext,1.3,3.4,.08,M.red,sx*3.6,5.4,RW+1.35);box(ext,.4,.4,.08,M.gold,sx*3.6,5.4,RW+1.4);}}
 // Torres de canto do prédio (mais altas que ele).
 for(const [x,z] of [[-BX,BZ1],[BX,BZ1],[-BX,BZ0],[BX,BZ0]])squareTower(ext,x,z,6,TOP+8);
 // Contrafortes nas laterais.
 for(const sx of [-1,1])for(let z=BZ0+5;z<=BZ1-4;z+=6){box(ext,1.4,TOP*.75,1.4,M.wall,sx*(BX+.9),TOP*.375,z);pyramid(ext,1.6,1.6,1.4,M.slate,sx*(BX+.9),TOP*.75,z);}
 // Campanário atrás, com o núcleo dentro do sino.
 const BZB=-23;
 {box(ext,11,2,11,M.base,0,1,BZB);box(ext,10,44,10,M.wall,0,22,BZB);for(const y of [13,26,39])box(ext,10.5,.6,10.5,M.trim,0,y,BZB);
  for(let lv=0;lv<6;lv++)for(const [dx,dz,r] of [[0,5.02,0],[5.02,0,Math.PI/2],[-5.02,0,Math.PI/2],[0,-5.02,0]])box(ext,1,2.2,.1,M.glass,dx,4+lv*6.5,BZB+dz,r);
  for(const sx of [-1,1])for(const sz of [-1,1])box(ext,1.6,8,1.6,M.wall,sx*4.2,48,BZB+sz*4.2);
  box(ext,10.6,1.1,10.6,M.trim,0,52.5,BZB);crenels(ext,-5.1,5.1,BZB-5.1,BZB+5.1,53);pyramid(ext,8,8,9,M.slate,0,53,BZB);
  cyl(ext,1,1.2,2.4,M.copper,0,62,BZB,8);pyramid(ext,2.4,2.4,2.6,M.copper,0,64.4,BZB);box(ext,.16,1.6,.16,M.gold,0,67.8,BZB);
  for(const sx of [-1,1])for(const sz of [-1,1]){cyl(ext,.9,.9,4.5,M.wall,sx*5.1,53,BZB+sz*5.1,10);const c=new T.Mesh(new T.ConeGeometry(1.15,2.4,10),M.copper);c.position.set(sx*5.1,58.7,BZB+sz*5.1);ext.add(c);}
  if(O){const w=W(0,BZB);O.addBox({x:w.x,z:w.z,hw:5.5,hd:5.5,rot:0});}}
 // Pórtico com colunas na entrada.
 box(ext,10,.5,4,M.trim,0,.25,BZ1+2);for(const sx of [-1,1])for(const dx of [1.8,4.2])cyl(ext,.45,.55,7.5,M.trim,sx*dx,.5,BZ1+3.3,12);
 box(ext,10.6,.9,4.4,M.trim,0,8.4,BZ1+2.2);prismZ(ext,4.6,11,3.2,M.slate,0,8.85,BZ1+2.2);
 for(const sx of [-1,1]){box(ext,1.8,7,.1,M.red,sx*3,4.6,BZ1+.56);box(ext,.6,.6,.12,M.gold,sx*3,5.8,BZ1+.6);}
 if(O)for(const sx of [-1,1])for(const dx of [1.8,4.2]){const w=W(sx*dx,BZ1+3.3);O.addCircle(w.x,w.z,.55);}
 mergeInto(ext,root,'Castelo de Aurora · exterior');

 // Telhado do prédio (some ao entrar).
 const roof=new T.Group();root.add(roof);
 {const r=new T.Group();
  box(r,2*BX+.6,.8,BZ1-BZ0+.6,M.trim,0,TOP+.4,(BZ0+BZ1)/2);
  prismX(r,2*BX-4,BZ1-BZ0+1.2,9,M.slate,0,TOP+.8,(BZ0+BZ1)/2);
  prismZ(r,6,9,6.5,M.slate,0,TOP+.8,BZ1-2);box(r,1.6,2.2,.2,M.glass,0,TOP+2.4,BZ1+.92);
  for(const sx of [-1,1]){prismZ(r,3,3.4,2.6,M.slate,sx*8,TOP+5,BZ1-4);box(r,2.6,2.6,1,M.wall,sx*8,TOP+3.8,BZ1-3.2);box(r,1,1.6,.1,M.glass,sx*8,TOP+3.9,BZ1-2.65);}
  mergeInto(r,roof,'Telhado do castelo');}

 // ===== Mobília de cada andar =====
 function furnish(g,k,y0,H){
  const Y=y=>y0+y;
  const shelf=(x,z,w,h,rot=0)=>{box(g,w,h,.5,M.woodDark,x,Y(h/2),z,rot,2);for(let yy=.4;yy<h-.2;yy+=.9){box(g,w-.15,.7,.42,M.books,x+(rot?.04:0),Y(yy+.38),z+(rot?0:.04),rot,1.5);box(g,w-.1,.06,.48,M.wood,x,Y(yy),z,rot,2);}};
  const table=(x,z,w,d,h=.85,m=M.wood)=>{box(g,w,.12,d,m,x,Y(h),z,0,2);for(const sx of [-1,1])for(const sz of [-1,1])box(g,.12,h,.12,M.woodDark,x+sx*(w/2-.15),Y(h/2),z+sz*(d/2-.15));};
  const chair=(x,z,r=0)=>{box(g,.5,.08,.5,M.wood,x,Y(.48),z,r,2);box(g,.5,.7,.08,M.wood,x-Math.sin(r)*.22,Y(.85),z-Math.cos(r)*.22,r,2);for(const sx of [-1,1])for(const sz of [-1,1])box(g,.06,.46,.06,M.woodDark,x+sx*.2,Y(.23),z+sz*.2);};
  const candle=(x,y,z)=>{box(g,.08,.25,.08,M.candle,x,Y(y+.12),z);box(g,.2,.05,.2,M.gold,x,Y(y),z);};
  const rug=(x,z,w,d)=>box(g,w,.03,d,M.rug,x,Y(.43),z,0,w);
  const bed=(x,z,rot=0,canopy=false)=>{box(g,2,.5,2.6,M.woodDark,x,Y(.65),z,rot,2);box(g,1.9,.25,2.5,M.cloth,x,Y(1),z,rot);box(g,1.9,.12,1.5,M.velvet,x,Y(1.18),z+.5,rot);box(g,1.4,.25,.45,M.cloth,x,Y(1.2),z-1,rot);box(g,2.1,1.8,.2,M.woodDark,x,Y(1.3),z-1.35,rot,2);
   if(canopy){for(const sx of [-1,1])for(const sz of [-1,1])box(g,.15,3,.15,M.woodDark,x+sx*.95,Y(1.9),z+sz*1.25);box(g,2.2,.15,2.8,M.velvet,x,Y(3.4),z);}};
  const fireplace=(x,z,rot=0)=>{box(g,3.2,3,1.2,M.base,x,Y(1.9),z,rot);box(g,2,1.4,.5,M.iron,x,Y(1.1),z+(rot?0:.4)*Math.cos(rot),rot);box(g,1.2,.6,.3,M.fire,x,Y(.9),z,rot);box(g,3.6,.3,1.4,M.trim,x,Y(3.45),z,rot);};
  const paint=(x,z,rot,i)=>{box(g,1.6,1.1,.08,M.paint[i%4],x,Y(2.6),z,rot);box(g,1.8,1.3,.05,M.gold,x,Y(2.6),z+(rot?0:-.03),rot);};
  const chandelier=(x,z)=>{const r=new T.Mesh(new T.TorusGeometry(1.2,.1,6,20),M.gold);r.rotation.x=Math.PI/2;r.position.set(x,Y(H-.8),z);g.add(r);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;candle(x+Math.cos(a)*1.2,H-.8,z+Math.sin(a)*1.2);}box(g,.05,.8,.05,M.iron,x,Y(H-.4),z);};
  if(k===0){
   // ---- Salão Principal ----
   box(g,3,.03,BZ1-BZ0-5,M.carpet,0,Y(.43),(BZ0+BZ1)/2+1.5,0,3);
   for(const sx of [-1,1])for(let z=BZ0+5;z<BZ1-1;z+=4){cyl(g,.45,.55,H-.4,M.trim,sx*4.2,Y(.4),z,12);box(g,1.2,.6,1.2,M.base,sx*4.2,Y(.7),z);}
   chandelier(0,-6);chandelier(0,1);
   // Trono imponente: 3 degraus, encosto alto pontudo dourado, braços com leões, baldaquino, braseiros.
   const tz=BZ0+2.2;
   box(g,8,.35,4.4,M.trim,0,Y(.58),tz+.4);box(g,6.4,.35,3.6,M.trim,0,Y(.93),tz+.2);box(g,4.8,.35,2.8,M.carpet,0,Y(1.28),tz,0,2);
   box(g,1.8,.7,1.5,M.velvet,0,Y(1.8),tz);box(g,2,.25,1.7,M.gold,0,Y(1.48),tz);
   box(g,2.1,3.6,.35,M.velvet,0,Y(3.1),tz-.75);
   {const s=new T.Shape();s.moveTo(-1.15,0);s.lineTo(1.15,0);s.lineTo(1.15,4.2);s.lineTo(0,5.6);s.lineTo(-1.15,4.2);s.lineTo(-1.15,0);
    const back=new T.Mesh(new T.ExtrudeGeometry(s,{depth:.2,bevelEnabled:false}),M.gold);back.position.set(0,Y(1.3),tz-1.05);g.add(back);}
   {const crown=new T.Mesh(new T.TorusGeometry(.35,.08,6,12),M.gold);crown.position.set(0,Y(5.4),tz-.8);g.add(crown);}
   for(const sx of [-1,1]){box(g,.3,.9,1.5,M.gold,sx*1.05,Y(2.1),tz);const lion=new T.Mesh(new T.SphereGeometry(.24,10,8),M.gold);lion.position.set(sx*1.05,Y(2.7),tz+.65);g.add(lion);}
   for(const sx of [-1,1])for(const sz of [-1,1])box(g,.25,4.8,.25,M.gold,sx*2.8,Y(3.7),tz+sz*1.8);
   box(g,6,.45,4,M.velvet,0,Y(6.1),tz);for(const sx of [-1,1])box(g,.1,3,3.8,M.red,sx*2.95,Y(4.6),tz);
   box(g,6.2,.15,.1,M.gold,0,Y(5.85),tz+2.02);
   for(const sx of [-1,1]){cyl(g,.35,.5,1.5,M.iron,sx*4.2,Y(.4),tz+1.6,10);box(g,.7,.5,.7,M.fire,sx*4.2,Y(2.1),tz+1.6);box(g,1.5,5,.08,sx>0?M.blue:M.red,sx*4.6,Y(3.4),BZ0+.6);}
   // ---- Biblioteca (oeste, fundo) ----
   for(let z=BZ0+1.8;z<-5;z+=3.2)shelf(-BX+.8,z,3,5.4,Math.PI/2);
   for(let x=-14;x<-7;x+=3.2)shelf(x,BZ0+.8,3,5.4);
   shelf(-10.5,-10.2,4.5,3.4);shelf(-10.5,-7.2,4.5,3.4);
   table(-9,-5.4,2.4,1.2);chair(-9.6,-4.8,Math.PI);chair(-8.4,-4.8,Math.PI);candle(-9,.9,-5.4);
   {const gl=new T.Mesh(new T.SphereGeometry(.5,14,10),M.blue);gl.position.set(-13.5,Y(1.5),-6);g.add(gl);box(g,.12,1,.12,M.woodDark,-13.5,Y(.9),-6);}
   // ---- Sala de Estudos (oeste, frente) ----
   rug(-11,2,5,4);table(-11,2,2.6,1.4);chair(-11,3.1,Math.PI);chair(-11,.9,0);candle(-11,.95,2);shelf(-BX+.8,5,3,3,Math.PI/2);fireplace(-11,BZ1-1.1,Math.PI);
   // ---- Hall da escada (leste, frente) ----
   rug(7.6,5,2.4,3.6);box(g,.6,.8,.6,M.base,14.5,Y(.8),6.6);{const p=new T.Mesh(new T.IcosahedronGeometry(.55,1),M.leaf);p.position.set(14.5,Y(1.6),6.6);g.add(p);}
   // ---- Refeitório (leste, fundo) ----
   table(11,-10,2,8,.9);for(let z=-13;z<=-7;z+=1.5){chair(9.6,z,Math.PI/2);chair(12.4,z,-Math.PI/2);}for(let z=-13;z<=-7;z+=2)candle(11,.97,z);fireplace(BX-1.1,-10,-Math.PI/2);
  }else if(k===1){
   rug(0,2,5,4);for(let i=0;i<4;i++)paint(-4+i*2.7,BZ1-.8,0,i);for(const sx of [-1,1])box(g,1.6,.45,.5,M.wood,sx*2.5,Y(.62),2,0,2);chandelier(0,2);
   {const t=new T.Mesh(new T.CylinderGeometry(2.2,2.2,.15,24),M.wood);t.position.set(0,Y(1.3),-10);g.add(t);cyl(g,.35,.45,.9,M.woodDark,0,Y(.4),-10,8);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;chair(Math.cos(a)*3,-10+Math.sin(a)*3,-a-Math.PI/2);}chandelier(0,-10);}
   rug(-11,2,4,3);table(-11,2.4,2.4,1.2);chair(-11,1.4,0);shelf(-BX+.8,2,3,4,Math.PI/2);candle(-10.4,.95,2.4);
   table(-11,-10,3.2,2.2);box(g,3,.02,2,M.cloth,-11,Y(.93),-10);{const gl=new T.Mesh(new T.SphereGeometry(.45,14,10),M.blue);gl.position.set(-13.8,Y(1.4),-13.8);g.add(gl);}
   for(let z=-13.5;z<-6;z+=1.6){box(g,.15,2,.15,M.woodDark,BX-1,Y(1.4),z);box(g,.1,1.6,.6,M.steel,BX-1.3,Y(1.6),z);}for(const x of [8,10]){box(g,.5,1.8,.4,M.steel,x,Y(1.3),-13.5);const hh=new T.Mesh(new T.SphereGeometry(.25,10,8),M.steel);hh.position.set(x,Y(2.4),-13.5);g.add(hh);}
  }else if(k===2){
   box(g,2.2,1,1.2,M.woodDark,-1.5,Y(.9),3,0,2);box(g,2.2,.06,.4,M.cloth,-1.5,Y(1.42),3.5);chair(-1.5,4.3,Math.PI);box(g,.2,2.2,1.2,M.gold,2,Y(1.5),2);rug(0,2,5,4);chandelier(0,2);
   box(g,3,1.1,1.2,M.trim,0,Y(.95),-14);for(const x of [-1,0,1])candle(x,1.5,-14);for(let z=-11;z<=-6;z+=1.6)for(const sx of [-1,1])box(g,2.6,.45,.6,M.wood,sx*2,Y(.62),z,0,2);
   bed(-11,1.5,0,true);rug(-11,4.5,4,2.2);box(g,1.6,2.4,.7,M.wood,-14.2,Y(1.6),-1,Math.PI/2,2);candle(-13.6,1.2,4);
   for(let z=-14;z<-6;z+=2.2)box(g,1.8,2.6,.8,M.wood,-BX+1,Y(1.7),z,Math.PI/2,2);box(g,1.2,2.4,.08,M.steel,-8,Y(1.8),BZ0+.6);
   bed(11.5,-11);box(g,1.2,.6,.6,M.wood,9,Y(.7),-13.8,0,2);rug(11,-8,3,2);
  }else{
   {const tel=new T.Mesh(new T.CylinderGeometry(.18,.3,3,10),M.gold);tel.rotation.z=-.8;tel.position.set(0,Y(2.2),-5);g.add(tel);cyl(g,.15,.15,1.4,M.woodDark,0,Y(.4),-5,6);rug(0,-5,6,6);
    for(let i=0;i<10;i++){const s=new T.Mesh(new T.SphereGeometry(.12,6,5),M.candle);s.position.set(-2.5+rnd()*5,Y(H-.8-rnd()*1.5),-8+rnd()*6);g.add(s);}}
   for(let i=0;i<6;i++){box(g,1.1,.7,.7,M.wood,-14+i*1.3,Y(.75),-14.5,0,2);box(g,1.1,.25,.75,M.gold,-14+i*1.3,Y(1.2),-14.5);}{const pile=new T.Mesh(new T.ConeGeometry(1.2,.8,10),M.gold);pile.position.set(-11,Y(.8),-10);g.add(pile);}
   for(let i=0;i<4;i++){const s=new T.Mesh(new T.CircleGeometry(.6,8),M.paint[i]);s.position.set(-15.4,Y(2.5),-1+i*2);s.rotation.y=Math.PI/2;g.add(s);}box(g,.5,1.9,.5,M.steel,-10,Y(1.35),3);
   box(g,2,2,2,M.iron,11,Y(1.4),-10);box(g,.3,2,.3,M.woodDark,11,Y(3.4),-10);
  }
  for(const [x,z] of [[-15.3,-10],[-15.3,3],[15.3,-10],[15.3,5.6],[-3,BZ0+.7],[3,BZ0+.7]])candle(x,2.6,z);
 }

 // ===== Andares =====
 const shells=[],interiors=[];
 for(let k=0;k<NF;k++){
  const y0=Fy(k),y1=Fy(k+1),H=y1-y0;
  const shell={front:new T.Group(),back:new T.Group(),west:new T.Group(),east:new T.Group()};
  for(const g of Object.values(shell))root.add(g);
  shells.push(shell);
  const inn=new T.Group();inn.visible=false;root.add(inn);interiors.push(inn);
  const tmp=new T.Group();
  // --- paredes externas inteiras (janelas dos dois lados) ---
  if(k===0){
   const s=new T.Shape();s.moveTo(-BX,0);s.lineTo(BX,0);s.lineTo(BX,H);s.lineTo(-BX,H);s.lineTo(-BX,0);
   const hole=new T.Path();hole.moveTo(-2.2,0);hole.lineTo(2.2,0);hole.lineTo(2.2,3.8);hole.absarc(0,3.8,2.2,0,Math.PI,false);hole.lineTo(-2.2,0);s.holes.push(hole);
   const geo=new T.ExtrudeGeometry(s,{depth:1,bevelEnabled:false});geo.translate(0,0,-.5);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/4,uv.getY(i)/4);
   const wall=new T.Mesh(geo,M.wall);wall.position.set(0,y0,BZ1);shell.front.add(wall);
   for(let a=0;a<=10;a++){const t=Math.PI*a/10;const v=box(shell.front,.8,.9,1.3,M.trim,Math.cos(t)*2.6,y0+3.8+Math.sin(t)*2.6,BZ1);v.rotation.z=t-Math.PI/2;}
   obsBox(-(BX+2.2)/2,BZ1,(BX-2.2)/2,.5,0);obsBox((BX+2.2)/2,BZ1,(BX-2.2)/2,.5,0);
  }else{box(shell.front,2*BX,H,1,M.wall,0,y0+H/2,BZ1);obsBox(0,BZ1,BX,.5,k);}
  box(shell.back,2*BX,H,1,M.wall,0,y0+H/2,BZ0);obsBox(0,BZ0,BX,.5,k);
  box(shell.west,1,H,BZ1-BZ0,M.wall,-BX,y0+H/2,(BZ0+BZ1)/2);obsBox(-BX,(BZ0+BZ1)/2,.5,(BZ1-BZ0)/2,k);
  box(shell.east,1,H,BZ1-BZ0,M.wall,BX,y0+H/2,(BZ0+BZ1)/2);obsBox(BX,(BZ0+BZ1)/2,.5,(BZ1-BZ0)/2,k);
  box(shell.front,2*BX+.4,.45,1.3,M.trim,0,y0+.22,BZ1);box(shell.back,2*BX+.4,.45,1.3,M.trim,0,y0+.22,BZ0);
  box(shell.west,1.3,.45,BZ1-BZ0,M.trim,-BX,y0+.22,(BZ0+BZ1)/2);box(shell.east,1.3,.45,BZ1-BZ0,M.trim,BX,y0+.22,(BZ0+BZ1)/2);
  for(const lx of [-12,-8,8,12])for(const s of [-1,1]){box(shell.front,1.3,2.8,.12,M.glass,lx,y0+3.3,BZ1+s*.56);box(shell.back,1.3,2.8,.12,M.glass,lx,y0+3.3,BZ0+s*.56);}
  if(k>0)for(const lx of [-3,0,3])for(const s of [-1,1])box(shell.front,1.1,2.8,.12,M.glass,lx,y0+3.3,BZ1+s*.56);
  for(const lz of [-12,-6,0,5])for(const s of [-1,1]){box(shell.west,.12,2.8,1.3,M.glass,-BX+s*.56,y0+3.3,lz);box(shell.east,.12,2.8,1.3,M.glass,BX+s*.56,y0+3.3,lz);}
  // --- piso deste andar (com o vão da escada) ---
  {const s=new T.Shape();s.moveTo(-BX+.5,BZ0+.5);s.lineTo(BX-.5,BZ0+.5);s.lineTo(BX-.5,BZ1-.5);s.lineTo(-BX+.5,BZ1-.5);s.lineTo(-BX+.5,BZ0+.5);
   if(k>0){const hole=new T.Path();hole.absarc(ST.x,ST.z,ST.r+.05,0,Math.PI*2,true);s.holes.push(hole);}
   const geo=new T.ExtrudeGeometry(s,{depth:.4,bevelEnabled:false});geo.rotateX(Math.PI/2);
   const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/3,uv.getY(i)/3);
   const fl=new T.Mesh(geo,M.floor);fl.position.y=y0+.4;fl.receiveShadow=true;inn.add(fl);}
  // --- paredes internas INTEIRAS (até o teto), com portas ---
  const wallX=(x,za,zb,doors)=>{let cur=za;for(const [a,b] of doors){if(a>cur){box(tmp,.5,H,a-cur,M.inner,x,y0+H/2,(cur+a)/2);obsBox(x,(cur+a)/2,.25,(a-cur)/2,k);}box(tmp,.5,H-3.2,b-a,M.inner,x,y0+3.2+(H-3.2)/2,(a+b)/2);box(tmp,.7,.35,b-a+.4,M.woodDark,x,y0+3.1,(a+b)/2,0,2);cur=b;}if(zb>cur){box(tmp,.5,H,zb-cur,M.inner,x,y0+H/2,(cur+zb)/2);obsBox(x,(cur+zb)/2,.25,(zb-cur)/2,k);}};
  const wallZ=(z,xa,xb,doors)=>{let cur=xa;for(const [a,b] of doors){if(a>cur){box(tmp,a-cur,H,.5,M.inner,(cur+a)/2,y0+H/2,z);obsBox((cur+a)/2,z,(a-cur)/2,.25,k);}box(tmp,b-a,H-3.2,.5,M.inner,(a+b)/2,y0+3.2+(H-3.2)/2,z);box(tmp,b-a+.4,.35,.7,M.woodDark,(a+b)/2,y0+3.1,z,0,2);cur=b;}if(xb>cur){box(tmp,xb-cur,H,.5,M.inner,(cur+xb)/2,y0+H/2,z);obsBox((cur+xb)/2,z,(xb-cur)/2,.25,k);}};
  wallX(-6,BZ0+.5,BZ1-.5,k===0?[[-12,-8.5],[0,3.5]]:[[-11,-9],[1.2,3.2]]);
  wallX(6,BZ0+.5,BZ1-.5,k===0?[[-12,-8.5],[0,3.5]]:[[-11,-9],[1.2,3.2]]);
  wallZ(-4,-BX+.5,-6,[[-12,-10]]);wallZ(-4,6,BX-.5,[[8,10]]);
  if(k>0)wallZ(-4,-6,6,[[-1,1]]);
  // --- torre da escada em espiral (porta voltada para a sala) ---
  {const seg=20;for(let i=0;i<seg;i++){const a=(i+.5)/seg*Math.PI*2;if(ang(a,ST.door)<.42)continue;
    const x=ST.x+Math.cos(a)*ST.r,z=ST.z+Math.sin(a)*ST.r,len=2*Math.PI*ST.r/seg*1.08;
    box(tmp,len,H,.4,M.inner,x,y0+H/2,z,-a+Math.PI/2,3);
    if(O){const w=W(x,z);O.addBox({x:w.x,z:w.z,hw:len/2,hd:.2,rot:-a+Math.PI/2,ymin:site.y+y0-.6,ymax:site.y+y1-.6});}}
   cyl(tmp,.5,.5,H,M.trim,ST.x,y0,ST.z,10);
   if(k<NF-1){const n=18;for(let i=0;i<n;i++){const t=(i+.5)/n,a=ST.door+t*Math.PI*2,y=y0+t*FH;
     box(tmp,ST.r-.6,.3,1.05,M.wood,ST.x+Math.cos(a)*(.5+(ST.r-.6)/2),y+.25,ST.z+Math.sin(a)*(.5+(ST.r-.6)/2),-a,2);}}}
  furnish(tmp,k,y0,H);
  mergeInto(tmp,inn,'Interior do castelo · andar '+k);
 }
 if(O){const w=W(ST.x,ST.z);O.addCircle(w.x,w.z,.55);}

 // ===== Núcleo de energia no sino =====
 const coreLocal=new T.Vector3(0,48,BZB);
 const core=new T.Mesh(new T.OctahedronGeometry(2.2,0),M.core);core.position.copy(coreLocal);root.add(core);
 const halo=new T.Mesh(new T.TorusGeometry(3,.14,8,32),M.gold);halo.position.copy(coreLocal);halo.rotation.x=Math.PI/2;root.add(halo);
 const coreLight=new T.PointLight('#8fe0ff',2.4,90,1.4);coreLight.position.copy(coreLocal);root.add(coreLight);
 // Duas luzes internas que acompanham o seu andar (quantidade fixa: sem recompilar shaders).
 const lamps=[new T.PointLight('#ffcf8a',0,22,1.5),new T.PointLight('#ffcf8a',0,22,1.5)];lamps.forEach(l=>root.add(l));

 // ===== Pisos (andares + espiral) =====
 const inB=(lx,lz)=>Math.abs(lx)<BX-.45&&lz>BZ0+.45&&lz<BZ1-.45;
 const playerY=()=>{const p=api.getGrassPlayer&&api.getGrassPlayer();return p?p.position.y:site.y;};
 if(window.arcanoGroundOverrides)window.arcanoGroundOverrides.push((x,z)=>{
  const lx=x-site.x,lz=z-site.z;if(!inB(lx,lz))return null;
  const py=playerY()-site.y-.4,dx=lx-ST.x,dz=lz-ST.z,r=Math.hypot(dx,dz);
  const cand=[0];
  if(r>ST.r+.02){for(let k=1;k<NF;k++)cand.push(Fy(k));}
  else if(r>.5){let t=(Math.atan2(dz,dx)-ST.door)/(Math.PI*2);t-=Math.floor(t);for(let k=0;k<NF-1;k++)cand.push(Fy(k)+t*FH);cand.push(Fy(NF-1));}
  let best=0;for(const c of cand)if(c<=py+.9&&c>best)best=c;
  return site.y+best+.4;
 });

 // ===== Ao entrar: andar atual, corte e nome do cômodo =====
 const label=document.createElement('div');label.id='castleRoom';
 label.style.cssText='position:fixed;top:92px;left:50%;transform:translateX(-50%);z-index:45;display:none;font:600 15px Georgia,serif;color:#fff5dc;background:rgba(40,30,20,.78);border:1px solid #d8b45a;border-radius:10px;padding:6px 16px;pointer-events:none';
 document.body.appendChild(label);
 const ROOMS=[
  {c:['Salão Principal','Salão Principal'],w:['Sala de Estudos','Biblioteca'],e:['Escada em Espiral','Refeitório']},
  {c:['Galeria','Sala do Conselho'],w:['Escritório','Sala de Mapas'],e:['Escada em Espiral','Arsenal']},
  {c:['Salão de Música','Capela'],w:['Quarto Real','Quarto de Vestir'],e:['Escada em Espiral','Quarto de Hóspedes']},
  {c:['Observatório','Observatório'],w:['Sala dos Troféus','Tesouro'],e:['Escada em Espiral','Acesso ao Campanário']}];
 const roomName=(lx,lz,k)=>{const R=ROOMS[k],i=lz>-4?0:1;if(Math.abs(lx)<6)return R.c[i];return (lx<0?R.w:R.e)[i];};
 const floorNames=['Térreo','1º andar','2º andar','3º andar'];
 const tmpV=new T.Vector3();let inside=false,saved=null,curFloor=-2;
 function setFloor(k){
  curFloor=k;
  for(let i=0;i<NF;i++){interiors[i].visible=k>=0&&i===k;for(const g of Object.values(shells[i]))g.visible=k<0||i<=k;}
  roof.visible=k<0;
  lamps.forEach((l,i)=>{l.intensity=k<0?0:1.1;l.position.set(i?-8:8,Fy(Math.max(k,0))+FH-1.2,-5);});
 }
 setFloor(-1);
 function frame(){
  requestAnimationFrame(frame);
  const t=performance.now()/1000;core.rotation.y=t*.6;core.position.y=coreLocal.y+Math.sin(t)*.3;halo.rotation.z=t*.4;halo.position.y=core.position.y;
  const p=api.getGrassPlayer&&api.getGrassPlayer();
  const lx=p?p.position.x-site.x:99,lz=p?p.position.z-site.z:99;
  const now=!!p&&inB(lx,lz);
  if(now!==inside){
   inside=now;
   if(inside){saved={d:p.camDistance,pt:p.camPitch};p.camDistance=Math.min(Math.max(p.camDistance,7),9);p.camPitch=Math.max(p.camPitch,1.25);}
   else{setFloor(-1);label.style.display='none';if(saved&&p){p.camDistance=saved.d;p.camPitch=saved.pt;}saved=null;}
  }
  if(inside){
   const k=Math.max(0,Math.min(NF-1,Math.floor((p.position.y-site.y+.6)/FH)));
   if(k!==curFloor)setFloor(k);
   // Paredes externas do andar atual entre a câmera e você somem (margem de 1 m evita piscar).
   const cam=api.getMainCamera&&api.getMainCamera();
   if(cam){const c=tmpV.copy(cam.position).sub(root.position),S=shells[k];
    const hy=(g,out)=>{if(out>-1)g.visible=false;else if(out<-2.5)g.visible=true;};hy(S.front,c.z-BZ1);hy(S.back,BZ0-c.z);hy(S.west,-BX-c.x);hy(S.east,c.x-BX);}
   label.textContent=roomName(lx,lz,k)+' · '+floorNames[k];label.style.display='block';
  }
 }
 requestAnimationFrame(frame);
 setInterval(()=>{const s=window.arcanoAnimeSky&&window.arcanoAnimeSky.material.uniforms.uSunDir.value;const night=s?Math.min(1,Math.max(0,(-s.y+.02)/.2)):0;M.glass.emissiveIntensity=.9+night*1.6;M.fire.emissiveIntensity=1.8+Math.sin(performance.now()*.01)*.3;},120);
 return {root};
}

// ---------- Escadaria e chafariz ----------
const fountainWaterMat=new T.ShaderMaterial({transparent:true,uniforms:{uTime:{value:0}},
 vertexShader:'varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform float uTime;varying vec2 vP;
  void main(){float r=length(vP);float ring=sin(r*9.-uTime*5.)*.5+.5;ring*=exp(-r*.25);
   float jets=0.;for(int i=0;i<8;i++){float a=float(i)*.7854;vec2 c=vec2(cos(a),sin(a))*3.2;float d=length(vP-c);jets+=smoothstep(.6,0.,d)*(.5+.5*sin(d*20.-uTime*12.));}
   vec3 col=mix(vec3(.18,.55,.66),vec3(.55,.86,.90),ring*.6);col=mix(col,vec3(.95,1.,1.),clamp(jets*.6+smoothstep(.85,1.,ring)*.25,0.,1.));
   gl_FragColor=vec4(col,.88);}`});
const curtainMat=new T.ShaderMaterial({transparent:true,side:T.DoubleSide,depthWrite:false,uniforms:{uTime:{value:0}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform float uTime;varying vec2 vUv;
  float h(float p){return fract(sin(p*127.1)*43758.5453);}
  float n(float x){float i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(h(i),h(i+1.),f);}
  void main(){float c_=n(vUv.x*70.)*.6+n(vUv.x*170.+3.)*.4;
   float streak=fract(vUv.y*1.4+uTime*(1.5+c_)+c_*3.);
   float line=smoothstep(.6,.95,streak)*c_;
   float a=.08+.42*line;vec3 col=mix(vec3(.65,.9,.95),vec3(1.),line);
   float foot=smoothstep(.2,0.,vUv.y);a=max(a,foot*.5);col=mix(col,vec3(1.),foot);
   gl_FragColor=vec4(col,a);}`});
function buildPlaza(api,site){
 const scene=api.scene,h=window.arcanoIslandHeight,O=window.arcanoObstacles;
 const st=new T.Group();const z0=30.5,z1=74,STEP=.7;
 for(let z=z0;z<z1;z+=STEP){const wz=site.z+z,y=h(site.x,wz);box(st,9,.5,STEP+.05,M.trim,site.x,y-.08,wz,0,2);for(const sx of [-1,1])box(st,.6,1.1,STEP+.05,M.wall,site.x+sx*4.8,y+.45,wz);}
 for(const sx of [-1,1])for(let z=z0;z<z1;z+=6){const wz=site.z+z,y=h(site.x,wz);box(st,.8,2.2,.8,M.wall,site.x+sx*4.8,y+1,wz);box(st,.45,.55,.45,M.glass,site.x+sx*4.8,y+2.4,wz);box(st,.6,.15,.6,M.iron,site.x+sx*4.8,y+2.75,wz);}
 mergeInto(st,scene,'Escadaria do castelo');
 // Balaustradas da escadaria bloqueiam (não dá para atravessar pelos lados).
 if(O)for(const sx of [-1,1]){const zc=site.z+(z0+z1)/2;O.addBox({x:site.x+sx*4.8,z:zc,hw:.35,hd:(z1-z0)/2,rot:0});}
 const fx=site.x,fz=site.z+88,fy=h(fx,fz);
 const g=new T.Group();
 const rimMat=M.trim.clone();rimMat.side=T.DoubleSide;
 const oct=(r1,r2,hh,m,y)=>{const c=new T.Mesh(new T.CylinderGeometry(r1,r2,hh,8),m);c.position.set(fx,fy+y+hh/2,fz);c.rotation.y=Math.PI/8;g.add(c);return c;};
 oct(7.6,7.8,.45,M.base,0);oct(6.7,6.7,.25,M.base,.4);
 {const pts=[new T.Vector2(6.6,.4),new T.Vector2(6.6,1.35),new T.Vector2(6.75,1.48),new T.Vector2(7.3,1.48),new T.Vector2(7.45,1.3),new T.Vector2(7.45,.4)];
  const rim=new T.Mesh(new T.LatheGeometry(pts,8),rimMat);rim.position.set(fx,fy,fz);rim.rotation.y=Math.PI/8;g.add(rim);}
 const water=new T.Mesh(new T.CircleGeometry(6.6,48),fountainWaterMat);water.rotation.x=-Math.PI/2;water.position.set(fx,fy+1.18,fz);scene.add(water);
 const bowl=(r,y,hh)=>{const pts=[new T.Vector2(.3,0),new T.Vector2(r*.35,.05),new T.Vector2(r*.85,hh*.6),new T.Vector2(r,hh),new T.Vector2(r*.95,hh*1.1)];const l=new T.Mesh(new T.LatheGeometry(pts,24),rimMat);l.position.set(fx,fy+y,fz);g.add(l);};
 cyl(g,1.3,1.7,2.4,M.wall,fx,fy+1.1,fz,12);bowl(3.4,3.4,.9);cyl(g,.6,.8,1.8,M.wall,fx,fy+4.3,fz,10);bowl(1.8,6.0,.6);
 for(const [r,y] of [[3.15,4.2],[1.62,6.55]]){const w=new T.Mesh(new T.CircleGeometry(r,32),fountainWaterMat);w.rotation.x=-Math.PI/2;w.position.set(fx,fy+y,fz);scene.add(w);}
 for(const [r,y0,y1] of [[3.35,4.3,1.18],[1.78,6.6,4.25]]){const c=new T.Mesh(new T.CylinderGeometry(r,r+.25,y0-y1,48,1,true),curtainMat);c.position.set(fx,fy+(y0+y1)/2,fz);scene.add(c);}
 const robe=new T.LatheGeometry([new T.Vector2(0,0),new T.Vector2(.62,0),new T.Vector2(.5,.9),new T.Vector2(.33,1.7),new T.Vector2(.28,2.1),new T.Vector2(0,2.2)],16);
 const fig=new T.Mesh(robe,M.wall);fig.position.set(fx,fy+6.6,fz);g.add(fig);
 const head=new T.Mesh(new T.SphereGeometry(.28,12,10),M.wall);head.position.set(fx,fy+9.05,fz);g.add(head);
 box(g,.18,1.3,.18,M.wall,fx+.32,fy+9.2,fz).rotation.z=-.25;
 const wingShape=new T.Shape();wingShape.moveTo(0,0);wingShape.bezierCurveTo(.9,.5,1.8,1.5,2.2,2.6);wingShape.lineTo(1.7,2.2);wingShape.lineTo(1.75,1.7);wingShape.lineTo(1.2,1.5);wingShape.lineTo(1.2,1.0);wingShape.lineTo(.6,.8);wingShape.lineTo(.2,-.3);wingShape.lineTo(0,0);
 for(const sx of [-1,1]){const wg=new T.Mesh(new T.ExtrudeGeometry(wingShape,{depth:.12,bevelEnabled:false}),M.wall);wg.position.set(fx+sx*.15,fy+8.1,fz-.3);wg.scale.x=sx;wg.rotation.y=sx*.4;g.add(wg);}
 mergeInto(g,scene,'Chafariz da praça');
 const orb=new T.Mesh(new T.SphereGeometry(.38,16,12),M.core);orb.position.set(fx+.48,fy+9.95,fz);scene.add(orb);
 const N=420,seeds=new Float32Array(N*4);for(let i=0;i<N;i++){seeds[i*4]=Math.floor(Math.random()*9);seeds[i*4+1]=Math.random();seeds[i*4+2]=Math.random()*2-1;seeds[i*4+3]=Math.random();}
 const pg=new T.BufferGeometry();pg.setAttribute('position',new T.BufferAttribute(new Float32Array(N*3),3));pg.setAttribute('seed',new T.BufferAttribute(seeds,4));
 const jetMat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:fountainWaterMat.uniforms.uTime,uC:{value:new T.Vector3(fx,fy,fz)},uScale:{value:innerHeight*.5}},
  vertexShader:`attribute vec4 seed;uniform float uTime,uScale;uniform vec3 uC;varying float vA;
   void main(){float t=fract(uTime*(.6+.2*seed.w)+seed.y);vec3 p;
    if(seed.x<.5){float a=seed.z*3.1416;vec2 d=vec2(cos(a),sin(a));p=uC+vec3(d.x*t*1.2,10.2+t*1.6-6.*t*t,d.y*t*1.2);}
    else{float a=(seed.x-1.)*.7854;vec2 o=vec2(cos(a),sin(a))*6.3;vec2 dir=-normalize(o);p=uC+vec3(o.x+dir.x*t*3.3,1.3+t*2.6-2.7*t*t,o.y+dir.y*t*3.3);}
    vA=(1.-smoothstep(.85,1.,t))*.85;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=(.07+.06*seed.w)*uScale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`varying float vA;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.92,.99,1.,vA*smoothstep(.5,.1,d));}`});
 const jets=new T.Points(pg,jetMat);jets.frustumCulled=false;jets.name='Jatos do chafariz';scene.add(jets);
 if(O)O.addCircle(fx,fz,7.6);
 const start=performance.now();
 (function tick(){requestAnimationFrame(tick);const t=(performance.now()-start)/1000;fountainWaterMat.uniforms.uTime.value=t;curtainMat.uniforms.uTime.value=t;})();
}

function install(){
 const api=window.arcanoWaterV1226,site=window.arcanoCastleSite;
 if(!api||!api.scene||!site||!window.arcanoIslandHeight){setTimeout(install,300);return;}
 const c=build(api,site);buildPlaza(api,site);
 window.arcanoCastle={site,root:c.root};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
