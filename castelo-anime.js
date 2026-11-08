/* Castelo central de Aurora — fortaleza no estilo Mondstadt (não "de princesa").
   Exterior: pedra cinza-quente com base escura, cantarias de arenito, ardósia
   azul-acinzentada e cobre esverdeado; nave central de telhado alto, alas com
   contrafortes, torres quadradas com ameias e campanário com o núcleo de
   energia brilhando dentro do sino. Tudo sobre o mesmo pedestal.
   Interior (dá para entrar): salão principal com colunas, tapete, trono e
   lustres; biblioteca; refeitório; hall com escadas para o 1º andar com
   escritório, sala de mapas, quarto e sala do conselho.
   Praça: chafariz funcionando (jatos, cascatas entre bacias, água animada) com
   estátua segurando um orbe. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
let seed=5150;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

// ---------- Texturas ----------
function canvasTex(w,h,draw){
 const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}
const blocks=(base,hue,sat,l0,l1)=>canvasTex(256,256,(g,w,h)=>{
 g.fillStyle=base;g.fillRect(0,0,w,h);
 for(let r=0;r<8;r++){let x=-rnd()*40;const y=r*32;
  while(x<w){const bw=36+rnd()*48;g.fillStyle=`hsl(${hue+rnd()*10-5},${sat+rnd()*6}%,${l0+rnd()*(l1-l0)}%)`;
   g.fillRect(x+1.5,y+1.5,bw-3,29);g.fillStyle='rgba(255,255,255,.05)';g.fillRect(x+3,y+3,bw-6,4);x+=bw;}}
 g.fillStyle='rgba(60,50,40,.12)';for(let i=0;i<700;i++)g.fillRect(rnd()*w,rnd()*h,2,2);
});
const TX={
 wall:blocks('#6d6a66',34,8,62,76),
 base:blocks('#4b4a4c',220,6,38,50),
 trim:blocks('#9b8a6a',40,30,62,72),
 slate:canvasTex(128,128,(g,w,h)=>{g.fillStyle='#38475a';g.fillRect(0,0,w,h);
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){const x=c*16+(r%2?8:0),y=r*16;g.fillStyle=`hsl(212,${16+rnd()*10}%,${30+rnd()*12}%)`;
   g.beginPath();g.moveTo(x,y);g.lineTo(x+16,y);g.lineTo(x+16,y+12);g.quadraticCurveTo(x+8,y+18,x,y+12);g.closePath();g.fill();}}),
 copper:canvasTex(64,64,(g,w,h)=>{g.fillStyle='#5d9a8a';g.fillRect(0,0,w,h);for(let i=0;i<120;i++){g.fillStyle=`rgba(${120+rnd()*60},${170+rnd()*40},${150+rnd()*40},.35)`;g.fillRect(rnd()*w,rnd()*h,3,3);}}),
 floor:canvasTex(256,256,(g,w,h)=>{for(let r=0;r<8;r++)for(let c=0;c<8;c++){const l=(r+c)%2?58:46;g.fillStyle=`hsl(30,10%,${l+rnd()*6}%)`;g.fillRect(c*32,r*32,32,32);g.strokeStyle='rgba(30,25,20,.35)';g.strokeRect(c*32,r*32,32,32);}}),
 wood:canvasTex(128,128,(g,w,h)=>{for(let p=0;p<4;p++){g.fillStyle=`hsl(26,${36+rnd()*10}%,${28+rnd()*10}%)`;g.fillRect(p*32,0,32,h);g.strokeStyle='rgba(30,15,5,.3)';for(let k=0;k<5;k++){g.beginPath();const x=p*32+4+rnd()*24;g.moveTo(x,0);g.lineTo(x+(rnd()-.5)*6,h);g.stroke();}}}),
 carpet:canvasTex(64,256,(g,w,h)=>{g.fillStyle='#8f2a2a';g.fillRect(0,0,w,h);g.fillStyle='#e0b85a';g.fillRect(0,0,5,h);g.fillRect(w-5,0,5,h);for(let y=0;y<h;y+=32){g.beginPath();g.moveTo(w/2,y+6);g.lineTo(w/2+8,y+16);g.lineTo(w/2,y+26);g.lineTo(w/2-8,y+16);g.closePath();g.fill();}}),
 books:canvasTex(256,64,(g,w,h)=>{let x=0;while(x<w){const bw=4+rnd()*7;g.fillStyle=`hsl(${rnd()*360},${30+rnd()*30}%,${28+rnd()*22}%)`;g.fillRect(x,6+rnd()*10,bw-1,h);x+=bw;}g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,0,w,6);})
};
const mat=(o)=>new T.MeshStandardMaterial(Object.assign({roughness:1,metalness:0},o));
const M={
 wall:mat({color:'#ffffff',map:TX.wall}),base:mat({color:'#ffffff',map:TX.base}),trim:mat({color:'#ffffff',map:TX.trim}),
 slate:mat({color:'#ffffff',map:TX.slate}),copper:mat({color:'#ffffff',map:TX.copper}),
 floor:mat({color:'#ffffff',map:TX.floor}),wood:mat({color:'#ffffff',map:TX.wood}),woodDark:mat({color:'#7a6a5c',map:TX.wood}),
 carpet:mat({color:'#ffffff',map:TX.carpet}),books:mat({color:'#ffffff',map:TX.books}),
 gold:mat({color:'#d8b45a',roughness:.45,metalness:.3}),iron:mat({color:'#2e2e34'}),
 red:mat({color:'#a8322d',side:T.DoubleSide}),blue:mat({color:'#2f5a8f',side:T.DoubleSide}),cloth:mat({color:'#e9e1cf'}),
 glass:mat({color:'#ffe2a6',emissive:new T.Color('#ffb85a'),emissiveIntensity:1.1}),
 candle:mat({color:'#fff1c2',emissive:new T.Color('#ffc566'),emissiveIntensity:1.8}),
 core:mat({color:'#e8fbff',emissive:new T.Color('#7fe2ff'),emissiveIntensity:2.6,roughness:.2}),
 leaf:mat({color:'#4f8f45'})
};

// ---------- Peças ----------
function boxUV(geo,w,h,d,tile){const uv=geo.attributes.uv,F=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];for(let f=0;f<6;f++)for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,uv.getX(i)*F[f][0]/tile,uv.getY(i)*F[f][1]/tile);}return geo;}
function box(g,w,h,d,m,x,y,z,ry=0,tile=4){const mm=new T.Mesh(boxUV(new T.BoxGeometry(w,h,d),w,h,d,tile),m);mm.position.set(x,y,z);mm.rotation.y=ry;g.add(mm);return mm;}
function cyl(g,r1,r2,h,m,x,y,z,seg=16,tile=4){const geo=new T.CylinderGeometry(r1,r2,h,seg),uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*2*Math.PI*Math.max(r1,r2)/tile,uv.getY(i)*h/tile);const mm=new T.Mesh(geo,m);mm.position.set(x,y+h/2,z);g.add(mm);return mm;}
function pyramid(g,w,d,h,m,x,y,z){const geo=new T.ConeGeometry(Math.SQRT1_2,1,4,1);geo.rotateY(Math.PI/4);const mm=new T.Mesh(geo,m);mm.scale.set(w,h,d);mm.position.set(x,y+h/2,z);g.add(mm);return mm;}
function prism(g,w,len,h,m,x,y,z){ // telhado de duas águas com cumeeira ao longo de z
 const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,h);s.lineTo(-w/2,0);
 const geo=new T.ExtrudeGeometry(s,{depth:len,bevelEnabled:false});geo.translate(0,0,-len/2);
 const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/3,uv.getY(i)/3);
 const mm=new T.Mesh(geo,m);mm.position.set(x,y,z);g.add(mm);return mm;
}
function crenels(g,x0,x1,z0,z1,y,step=1.6){ // ameias em volta de um retângulo
 for(let x=x0;x<=x1+1e-3;x+=step){box(g,.8,1,.6,M.wall,x,y+.5,z0);box(g,.8,1,.6,M.wall,x,y+.5,z1);}
 for(let z=z0+step;z<=z1-step+1e-3;z+=step){box(g,.6,1,.8,M.wall,x0,y+.5,z);box(g,.6,1,.8,M.wall,x1,y+.5,z);}
}
// Torre quadrada: base escura, corpo, cinta de arenito, ameias, telhado curto.
function squareTower(g,x,z,s,h,roof=true){
 box(g,s+.6,2,s+.6,M.base,x,1,z);
 box(g,s,h,s,M.wall,x,h/2,z);
 box(g,s+.5,.6,s+.5,M.trim,x,h-.3,z);
 crenels(g,x-s/2,x+s/2,z-s/2,z+s/2,h,1.4);
 for(let lv=0;lv<Math.floor(h/6);lv++)for(const [dx,dz,r] of [[0,s/2+.02,0],[0,-s/2-.02,0],[s/2+.02,0,Math.PI/2],[-s/2-.02,0,Math.PI/2]])
  box(g,.7,1.5,.1,M.glass,x+dx,4+lv*6,z+dz,r);
 if(roof){pyramid(g,s+.9,s+.9,s*.9,M.slate,x,h+1,z);box(g,.3,1.2,.3,M.copper,x,h+1+s*.9+.6,z);}
}

// Junta malhas por material (poucas chamadas de desenho).
function mergeInto(group,parent,name){
 group.updateMatrixWorld(true);
 const buckets=new Map();
 group.traverse(o=>{if(!o.isMesh)return;let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);
  if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
  if(!buckets.has(o.material))buckets.set(o.material,[]);buckets.get(o.material).push(g);});
 for(const [m,list] of buckets){
  let n=0;for(const g of list)n+=g.attributes.position.count;
  const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2);let off=0;
  for(const g of list){P.set(g.attributes.position.array,off*3);if(g.attributes.normal)N.set(g.attributes.normal.array,off*3);U.set(g.attributes.uv.array.subarray(0,g.attributes.position.count*2),off*2);off+=g.attributes.position.count;g.dispose();}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(P,3));geo.setAttribute('normal',new T.BufferAttribute(N,3));geo.setAttribute('uv',new T.BufferAttribute(U,2));geo.computeBoundingSphere();
  const mesh=new T.Mesh(geo,m);mesh.name=name;mesh.castShadow=m!==M.glass&&m!==M.candle&&m!==M.core;mesh.receiveShadow=true;parent.add(mesh);
 }
}

// ---------- Castelo ----------
// Coordenadas locais: origem no centro da colina, +z = frente (sul, para a cidade).
const BX=15,BZ0=-14,BZ1=8,NAVE=7,H1=7,HW=14; // prédio: x -15..15, z -14..8; 1º andar a 7 m
const STAIR={x0:12.2,x1:14.8,z0:-5,z1:7};      // escada (espelhada nas duas alas)

function build(api,site){
 const scene=api.scene,O=window.arcanoObstacles;
 const root=new T.Group();root.position.set(site.x,site.y,site.z);scene.add(root);
 const W=(lx,lz)=>({x:site.x+lx,z:site.z+lz});
 const addBox=(lx,lz,hw,hd,extra)=>{if(O){const w=W(lx,lz);O.addBox(Object.assign({x:w.x,z:w.z,hw,hd,rot:0},extra||{}));}};
 const ang=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));

 // ===== Exterior fixo (fundido) =====
 const ext=new T.Group();
 // Pedestal único sob tudo (nada fica "solto").
 box(ext,34,1.2,26,M.base,0,-.66,-3); // topo abaixo do piso interno
 // Muralha do castelo, com torres quadradas e portão.
 const RW=29,GATE=Math.PI/2,segs=60;
 for(let i=0;i<segs;i++){
  const a=(i+.5)/segs*Math.PI*2;if(ang(a,GATE)<.15)continue;
  const x=Math.cos(a)*RW,z=Math.sin(a)*RW,len=2*Math.PI*RW/segs*1.06,ry=-a+Math.PI/2;
  box(ext,len,1.4,2.2,M.base,x,.7,z,ry);box(ext,len,6,1.8,M.wall,x,4.2,z,ry);box(ext,len,.4,2.1,M.trim,x,7.3,z,ry);
  for(const k of [-.25,.25]){const aa=a+k*len/RW;box(ext,.9,1,.6,M.wall,Math.cos(aa)*(RW+.6),8,Math.sin(aa)*(RW+.6),-aa+Math.PI/2);}
  if(O){const w=W(x,z);O.addBox({x:w.x,z:w.z,hw:len/2,hd:1.1,rot:ry});}
 }
 for(const a of [GATE-.2,GATE+.2,GATE+1.2,GATE+2.25,GATE+3.14,GATE-1.2,GATE-2.25]){
  const x=Math.cos(a)*RW,z=Math.sin(a)*RW;squareTower(ext,x,z,4.4,11);if(O){const w=W(x,z);O.addCircle(w.x,w.z,3.1);}
 }
 {// Arco do portão da muralha.
  const s=new T.Shape();s.moveTo(-5,0);s.lineTo(5,0);s.lineTo(5,9);s.lineTo(-5,9);s.lineTo(-5,0);
  const hole=new T.Path();hole.moveTo(-2.3,0);hole.lineTo(2.3,0);hole.lineTo(2.3,4.4);hole.absarc(0,4.4,2.3,0,Math.PI,false);hole.lineTo(-2.3,0);s.holes.push(hole);
  const geo=new T.ExtrudeGeometry(s,{depth:2.6,bevelEnabled:false});geo.translate(0,0,-1.3);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/4,uv.getY(i)/4);
  const arch=new T.Mesh(geo,M.wall);arch.position.set(0,0,RW);ext.add(arch);
  box(ext,10.4,.5,3,M.trim,0,9.2,RW);
  for(const sx of [-1,1]){box(ext,1.3,3.4,.08,M.red,sx*3.6,5.4,RW+1.35);box(ext,.4,.4,.08,M.gold,sx*3.6,5.4,RW+1.4);}
 }
 // Contrafortes nas alas e na fachada.
 for(const sx of [-1,1])for(let z=BZ0+2;z<=BZ1-1;z+=5.5){box(ext,1.4,10,1.2,M.wall,sx*(BX+.7),5,z);pyramid(ext,1.5,1.3,1.2,M.slate,sx*(BX+.7),10,z);}
 // Torres quadradas nos 4 cantos do prédio.
 for(const [x,z] of [[-BX,BZ1],[BX,BZ1],[-BX,BZ0],[BX,BZ0]])squareTower(ext,x,z,5,20); // (as paredes já bloqueiam; sem caixa invadindo o interior)
 // Campanário (atrás da nave) com o núcleo de energia dentro do sino.
 {
  const bz=-19;
  box(ext,10,2,10,M.base,0,1,bz);box(ext,9,34,9,M.wall,0,17,bz);
  for(const y of [12,24,34])box(ext,9.5,.6,9.5,M.trim,0,y,bz);
  for(let lv=0;lv<5;lv++)for(const [dx,dz,r] of [[0,4.52,0],[4.52,0,Math.PI/2],[-4.52,0,Math.PI/2]])box(ext,.9,2,.1,M.glass,dx,4+lv*6,bz+dz,r);
  // Sino aberto: 4 pilares e arcos.
  for(const sx of [-1,1])for(const sz of [-1,1])box(ext,1.4,7,1.4,M.wall,sx*3.8,37.5,bz+sz*3.8);
  box(ext,9.6,1,9.6,M.trim,0,41.5,bz);crenels(ext,-4.6,4.6,bz-4.6,bz+4.6,42);
  pyramid(ext,7,7,8,M.slate,0,42,bz);
  // Lanterna de cobre com agulha curta (nada de agulhas de princesa).
  cyl(ext,.9,1.1,2.2,M.copper,0,50,bz,8);pyramid(ext,2.2,2.2,2.4,M.copper,0,52.2,bz);box(ext,.15,1.4,.15,M.gold,0,55.2,bz);
  // Torrinhas nos cantos do campanário.
  for(const sx of [-1,1])for(const sz of [-1,1]){cyl(ext,.8,.8,4,M.wall,sx*4.6,42,bz+sz*4.6,10);const c=new T.Mesh(new T.ConeGeometry(1.05,2.2,10),M.copper);c.position.set(sx*4.6,47.1,bz+sz*4.6);ext.add(c);}
  addBox(0,bz,5,5);
 }
 mergeInto(ext,root,'Castelo de Aurora · exterior');

 // ===== Casca do prédio (paredes externas separadas para o corte ao entrar) =====
 const shell={front:new T.Group(),back:new T.Group(),west:new T.Group(),east:new T.Group()};
 Object.values(shell).forEach(g=>root.add(g));
 const TH=1;
 // Fachada com portal em arco (aberto) e rosácea.
 {
  const g=new T.Group();
  const s=new T.Shape();s.moveTo(-BX,0);s.lineTo(BX,0);s.lineTo(BX,HW);s.lineTo(NAVE,HW);s.lineTo(0,HW+9);s.lineTo(-NAVE,HW);s.lineTo(-BX,HW);s.lineTo(-BX,0);
  const hole=new T.Path();hole.moveTo(-2.2,0);hole.lineTo(2.2,0);hole.lineTo(2.2,4.6);hole.absarc(0,4.6,2.2,0,Math.PI,false);hole.lineTo(-2.2,0);s.holes.push(hole);
  const geo=new T.ExtrudeGeometry(s,{depth:TH,bevelEnabled:false});geo.translate(0,0,-TH/2);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/4,uv.getY(i)/4);
  const wall=new T.Mesh(geo,M.wall);wall.position.z=BZ1;g.add(wall);
  box(g,2*BX,1.2,TH+.3,M.base,0,.6,BZ1);
  for(let k=0;k<=10;k++){const t=Math.PI*k/10;const v=box(g,.8,.9,TH+.3,M.trim,Math.cos(t)*2.6,4.6+Math.sin(t)*2.6,BZ1);v.rotation.z=t-Math.PI/2;}
  // Rosácea quente e janelas.
  const rose=new T.Mesh(new T.CylinderGeometry(2.2,2.2,.2,24),M.glass);rose.rotation.x=Math.PI/2;rose.position.set(0,11.5,BZ1+.55);g.add(rose);
  const ring=new T.Mesh(new T.TorusGeometry(2.35,.3,8,28),M.trim);ring.position.set(0,11.5,BZ1+.6);g.add(ring);
  for(const sx of [-1,1])for(const lx of [10,12.5])for(const y of [3.5,10.5])box(g,1.2,2.6,.15,M.glass,sx*lx,y,BZ1+.55);
  for(const sx of [-1,1]){box(g,1.6,5.5,.08,M.red,sx*4.4,8.5,BZ1+.56);box(g,.5,.5,.1,M.gold,sx*4.4,9.5,BZ1+.6);}
  shell.front.add(g);
  // Colisão da fachada (o portal fica livre).
  addBox(-(BX+2.2)/2,BZ1,(BX-2.2)/2,TH/2);addBox((BX+2.2)/2,BZ1,(BX-2.2)/2,TH/2);
 }
 // Fundos, laterais (com janelas dos dois lados).
 {
  const back=new T.Group();box(back,2*BX,HW,TH,M.wall,0,HW/2,BZ0);prism(back,2*NAVE,TH,9,M.wall,0,HW,BZ0);
  for(const lx of [-12,-9,9,12])for(const y of [3.5,10.5])for(const zz of [BZ0-.55,BZ0+.55])box(back,1.2,2.6,.15,M.glass,lx,y,zz);
  shell.back.add(back);addBox(0,BZ0,BX,TH/2);
  for(const [sx,key] of [[-1,'west'],[1,'east']]){
   const g=new T.Group();box(g,TH,HW,BZ1-BZ0,M.wall,sx*BX,HW/2,(BZ0+BZ1)/2);box(g,TH+.3,1.2,BZ1-BZ0,M.base,sx*BX,.6,(BZ0+BZ1)/2);
   for(let z=BZ0+3;z<BZ1-1;z+=5.5)for(const y of [3.5,10.5])for(const xx of [sx*(BX+.55),sx*(BX-.55)])box(g,.15,2.6,1.2,M.glass,xx,y,z);
   crenels(g,sx*BX-.3,sx*BX+.3,BZ0,BZ1,HW,1.6);
   shell[key].add(g);addBox(sx*BX,(BZ0+BZ1)/2,TH/2,(BZ1-BZ0)/2);
  }
 }
 // ===== Telhados (somem ao entrar) =====
 const roofs=new T.Group();root.add(roofs);
 prism(roofs,2*NAVE+1.6,BZ1-BZ0+1.4,9.5,M.slate,0,HW,(BZ0+BZ1)/2);
 box(roofs,.4,.5,BZ1-BZ0+1.6,M.copper,0,HW+9.6,(BZ0+BZ1)/2);
 for(const sx of [-1,1]){box(roofs,BX-NAVE,.6,BZ1-BZ0,M.base,sx*(BX+NAVE)/2,HW+.3,(BZ0+BZ1)/2);}
 // ===== Paredes internas (nave × alas), com passagens no térreo =====
 const inner=new T.Group();root.add(inner);
 const upper0=new T.Group();root.add(upper0);
 for(const sx of [-1,1]){
  const x=sx*NAVE,doors=[[1.5,4.2],[-9.5,-6.8]];let cur=BZ0;
  for(const [a,b] of doors.sort((p,q)=>p[0]-q[0])){
   // Paredes internas baixas (3 m): a câmera vê os cômodos por cima ao entrar.
   box(inner,.8,3,a-cur,M.wall,x,1.5,(cur+a)/2);box(inner,1,.25,a-cur,M.trim,x,3.1,(cur+a)/2);addBox(x,(cur+a)/2,.4,(a-cur)/2);cur=b;
  }
  box(inner,.8,3,BZ1-cur,M.wall,x,1.5,(cur+BZ1)/2);box(inner,1,.25,BZ1-cur,M.trim,x,3.1,(cur+BZ1)/2);addBox(x,(cur+BZ1)/2,.4,(BZ1-cur)/2);
  // Parapeito do 1º andar voltado para a nave.
  box(upper0,.3,1.1,BZ1-BZ0-1,M.trim,sx*(NAVE+.4),H1+.55,(BZ0+BZ1)/2);
  // Arcos/colunas da nave.
  for(let z=BZ0+3;z<BZ1-1;z+=4){cyl(inner,.55,.65,HW,M.trim,sx*4.6,0,z,12);box(inner,1.4,.8,1.4,M.wall,sx*4.6,.4,z);}
 }
 // ===== Térreo =====
 const ground=new T.Group();root.add(ground);
 box(ground,2*BX-1,.1,BZ1-BZ0-1,M.floor,0,.05,(BZ0+BZ1)/2,0,3);
 // Salão principal: tapete, trono, estandartes e lustres.
 box(ground,3,.05,BZ1-BZ0-4,M.carpet,0,.12,(BZ0+BZ1)/2+1.5,0,3);
 box(ground,8,.5,3.5,M.trim,0,.25,BZ0+2.3);box(ground,6,.4,2.5,M.trim,0,.7,BZ0+2.1);
 box(ground,1.6,.6,1.4,M.red,0,1.2,BZ0+2);box(ground,1.6,2.6,.3,M.red,0,2.2,BZ0+1.3);box(ground,1.8,.3,.4,M.gold,0,3.5,BZ0+1.3);
 for(const sx of [-1,1])box(ground,.25,1.6,1.4,M.gold,sx*.9,1.6,BZ0+2);
 for(const sx of [-1,1])for(let z=BZ0+5;z<BZ1-2;z+=6){box(ground,1.5,5,.08,sx>0?M.blue:M.red,sx*6.5,7.5,z);}
 const chand=(x,y,z)=>{const r=new T.Mesh(new T.TorusGeometry(1.4,.12,6,20),M.gold);r.rotation.x=Math.PI/2;r.position.set(x,y,z);ground.add(r);
  for(let k=0;k<8;k++){const a=k/8*Math.PI*2;box(ground,.12,.35,.12,M.candle,x+Math.cos(a)*1.4,y+.25,z+Math.sin(a)*1.4);}box(ground,.06,HW-y,.06,M.iron,x,y+(HW-y)/2,z);};
 chand(0,9,-8);chand(0,9,-1);chand(0,9,5);
 addBox(0,BZ0+2.3,4,1.8);
 // Biblioteca (ala oeste): estantes altas, mesas de leitura, globo.
 for(let z=BZ0+1;z<=STAIR.z0-1;z+=4)box(ground,.6,5.5,3.2,M.books,-BX+.9,2.75,z,0,1.5); // (a escada fica junto à parede da frente)
 for(const z of [-11,-7]){box(ground,5,4,.6,M.books,-10.5,2,z,0,1.5);box(ground,5.2,.2,.8,M.wood,-10.5,4.1,z);addBox(-10.5,z,2.6,.4);}
 for(const z of [2.5,5.5]){box(ground,3,.12,1.4,M.wood,-10.5,.85,z);for(const sx of [-1,1])box(ground,.12,.8,1.2,M.woodDark,-10.5+sx*1.3,.4,z);box(ground,.3,.25,.3,M.candle,-10.5,1.05,z);addBox(-10.5,z,1.6,.8);}
 {const gl=new T.Mesh(new T.SphereGeometry(.55,16,12),M.blue);gl.position.set(-8.2,1.6,-12.2);ground.add(gl);box(ground,.15,1,.15,M.woodDark,-8.2,.5,-12.2);}
 // Refeitório (ala leste, fundo): mesa longa, bancos, lareira.
 box(ground,2,.15,9,M.wood,10.5,.9,-8);for(const sx of [-1,1])box(ground,.5,.45,9,M.woodDark,10.5+sx*1.5,.45,-8);
 for(let z=-12;z<=-4;z+=2)box(ground,.25,.25,.25,M.candle,10.5,1.1,z);addBox(10.5,-8,1.9,4.6);
 box(ground,3.4,3.5,1.2,M.base,10.5,1.75,BZ0+1.1);box(ground,2,1.6,.4,M.candle,10.5,1,BZ0+1.6);
 box(ground,.6,.6,.2,M.gold,10.5,3.2,BZ0+1.7);
 // Parede leve entre refeitório e hall da escada.
 box(inner,BX-NAVE-.8,3,.4,M.wall,(BX+NAVE)/2-1.6,1.5,-1);addBox((BX+NAVE)/2-1.6,-1,(BX-NAVE-.8)/2,.2);
 // ===== Escadas (uma em cada ala, junto à parede externa) =====
 const stairs=new T.Group();root.add(stairs);
 for(const sx of [-1,1]){
  const n=16,run=(STAIR.z1-STAIR.z0)/n;
  for(let i=0;i<n;i++){const z=STAIR.z1-run*(i+.5),y=H1*(i+1)/n;box(stairs,STAIR.x1-STAIR.x0,y,run+.02,M.wood,sx*(STAIR.x0+STAIR.x1)/2,y/2,z);}
  for(let i=0;i<=n;i+=2){const z=STAIR.z1-run*i,y=H1*i/n;box(stairs,.12,1,.12,M.woodDark,sx*STAIR.x0,y+.5,z);}
  box(stairs,.12,.12,STAIR.z1-STAIR.z0+.4,M.woodDark,sx*STAIR.x0,H1/2+1,(STAIR.z0+STAIR.z1)/2).rotation.x=Math.atan2(H1,STAIR.z1-STAIR.z0);
 }
 // ===== 1º andar (alas): piso, salas e móveis =====
 const upper=new T.Group();root.add(upper);
 for(const sx of [-1,1]){
  // Piso com abertura da escada.
  const xa=NAVE+.4,xb=BX-.5;
  box(upper,xb-xa,.4,STAIR.z0-BZ0-.5,M.floor,sx*(xa+xb)/2,H1-.2,(BZ0+.5+STAIR.z0)/2,0,3);
  box(upper,STAIR.x0-xa,.4,BZ1-.5-STAIR.z0,M.floor,sx*(xa+STAIR.x0)/2,H1-.2,(STAIR.z0+BZ1-.5)/2,0,3);
  // Divisória entre as duas salas (com porta).
  // (porta do lado da nave; o lado de fora é o vão da escada)
  box(upper,(xb-xa)-2.2,3,.35,M.wall,sx*(xa+2.2+(xb-xa-2.2)/2),H1+1.5,-4);
  // Corrimão da abertura da escada.
  box(upper,.1,1,BZ1-STAIR.z0-.5,M.woodDark,sx*STAIR.x0,H1+.5,(STAIR.z0+BZ1-.5)/2);
 }
 // Oeste: escritório (frente) e sala de mapas (fundo).
 box(upper,2.4,.12,1.2,M.wood,-10,H1+.85,3);box(upper,2.2,.8,1,M.woodDark,-10,H1+.4,3);box(upper,.3,.3,.3,M.candle,-9.2,H1+1.05,3);
 box(upper,.6,1.1,.6,M.red,-10,H1+.55,4.4);box(upper,.6,3,2.6,M.books,-NAVE-.8,H1+1.5,4,0,1.5);
 box(upper,3.2,.15,2.2,M.wood,-11,H1+.9,-9);box(upper,3,.02,2,M.cloth,-11,H1+.98,-9);for(const sx of [-1,1])for(const sz of [-1,1])box(upper,.12,.9,.12,M.woodDark,-11+sx*1.4,H1+.45,-9+sz*.9);
 {const gl=new T.Mesh(new T.SphereGeometry(.5,14,10),M.blue);gl.position.set(-8.5,H1+1.5,-12);upper.add(gl);}
 // Leste: sala do conselho (frente) e quarto (fundo).
 {const t=new T.Mesh(new T.CylinderGeometry(1.8,1.8,.15,20),M.wood);t.position.set(9.6,H1+.9,2.5);upper.add(t);cyl(upper,.3,.4,.85,M.woodDark,9.6,H1,2.5,8);
  for(let k=0;k<6;k++){const a=k/6*Math.PI*2;box(upper,.5,1.1,.5,M.red,9.6+Math.cos(a)*2.4,H1+.55,2.5+Math.sin(a)*2.4);}}
 box(upper,2.2,.5,3,M.woodDark,11,H1+.25,-11);box(upper,2,.3,2.8,M.cloth,11,H1+.6,-11);box(upper,2,.25,1.6,M.blue,11,H1+.75,-10.4);
 box(upper,2.3,1.6,.25,M.woodDark,11,H1+.8,-12.6);box(upper,2.4,.1,1.8,M.red,11,H1+.06,-8.3);box(upper,1.4,2.4,.7,M.wood,13.8,H1+1.2,-6.2);
 // ===== Luzes internas =====
 for(const [x,y,z] of [[0,8,-4],[-10.5,4,-2],[10.5,4,-6],[-10.5,H1+3,-3],[10.5,H1+3,-3]]){const l=new T.PointLight('#ffcf8a',.9,16,1.5);l.position.set(x,y,z);root.add(l);}

 // ===== Núcleo de energia no sino do campanário =====
 const coreLocal=new T.Vector3(0,37.5,-19);
 const core=new T.Mesh(new T.OctahedronGeometry(1.9,0),M.core);core.position.copy(coreLocal);root.add(core);
 const halo=new T.Mesh(new T.TorusGeometry(2.6,.12,8,32),M.gold);halo.position.copy(coreLocal);halo.rotation.x=Math.PI/2;root.add(halo);
 const coreLight=new T.PointLight('#8fe0ff',2.4,90,1.4);coreLight.position.copy(coreLocal);root.add(coreLight);

 // ===== Pisos (térreo, escadas e 1º andar) =====
 const inBuilding=(lx,lz)=>Math.abs(lx)<BX-.4&&lz>BZ0+.4&&lz<BZ1-.4;
 const onStair=(lx,lz)=>Math.abs(lx)>STAIR.x0&&Math.abs(lx)<STAIR.x1&&lz>STAIR.z0-.2&&lz<STAIR.z1+.2;
 const onUpper=(lx,lz)=>Math.abs(lx)>NAVE+.4&&Math.abs(lx)<BX-.4&&lz>BZ0+.4&&lz<BZ1-.4&&!(Math.abs(lx)>STAIR.x0&&lz>STAIR.z0);
 const playerY=()=>{const p=api.getGrassPlayer&&api.getGrassPlayer();return p?p.position.y:site.y;};
 if(window.arcanoGroundOverrides)window.arcanoGroundOverrides.push((x,z)=>{
  const lx=x-site.x,lz=z-site.z;if(!inBuilding(lx,lz))return null;
  const py=playerY()-site.y;let best=0;
  const cand=[0];
  if(onStair(lx,lz))cand.push(H1*clamp01((STAIR.z1-lz)/(STAIR.z1-STAIR.z0)));
  if(onUpper(lx,lz))cand.push(H1);
  for(const c of cand)if(c<=py+.9&&c>best)best=c;
  return site.y+best;
 });

 // ===== Corte ao entrar + nome do cômodo =====
 const label=document.createElement('div');label.id='castleRoom';
 label.style.cssText='position:fixed;top:92px;left:50%;transform:translateX(-50%);z-index:45;display:none;font:600 15px Georgia,serif;color:#fff5dc;background:rgba(40,30,20,.75);border:1px solid #d8b45a;border-radius:10px;padding:6px 16px;pointer-events:none';
 document.body.appendChild(label);
 const roomName=(lx,lz,up)=>{
  if(Math.abs(lx)<NAVE)return 'Salão Principal';
  if(!up){if(lx<0)return Math.abs(lx)>STAIR.x0&&lz>STAIR.z0?'Escada da Biblioteca':'Biblioteca';return lz>-1?'Hall da Escada':'Refeitório';}
  if(lx<0)return lz>-4?'Escritório':'Sala de Mapas';return lz>-4?'Sala do Conselho':'Quarto';
 };
 const tmp=new T.Vector3();let inside=false,saved=null;
 function frame(){
  requestAnimationFrame(frame);
  const t=performance.now()/1000;core.rotation.y=t*.6;core.position.y=coreLocal.y+Math.sin(t)*.3;halo.rotation.z=t*.4;halo.position.y=core.position.y;
  const p=api.getGrassPlayer&&api.getGrassPlayer();
  const lx=p?p.position.x-site.x:99,lz=p?p.position.z-site.z:99;
  const now=!!p&&inBuilding(lx,lz);
  if(now!==inside){
   inside=now;roofs.visible=!inside;
   if(inside){saved={d:p.camDistance,pt:p.camPitch};p.camDistance=Math.min(Math.max(p.camDistance,7),9);p.camPitch=Math.max(p.camPitch,1.25);}
   else{Object.values(shell).forEach(g=>g.visible=true);upper.visible=true;upper0.visible=true;label.style.display='none';if(saved&&p){p.camDistance=saved.d;p.camPitch=saved.pt;}saved=null;}
  }
  if(inside){
   const up=p.position.y-site.y>H1-.5;
   upper.visible=up;upper0.visible=up;stairs.visible=true;
   const cam=api.getMainCamera&&api.getMainCamera();
   if(cam){const c=tmp.copy(cam.position).sub(root.position);
    shell.front.visible=c.z<BZ1;shell.back.visible=c.z>BZ0;shell.west.visible=c.x>-BX;shell.east.visible=c.x<BX;}
   label.textContent=roomName(lx,lz,up)+(up?' · 1º andar':'');label.style.display='block';
  }
 }
 requestAnimationFrame(frame);
 setInterval(()=>{const s=window.arcanoAnimeSky&&window.arcanoAnimeSky.material.uniforms.uSunDir.value;const night=s?Math.min(1,Math.max(0,(-s.y+.02)/.2)):0;M.glass.emissiveIntensity=.9+night*1.6;},1000);
 return {root};
}
const clamp01=v=>Math.max(0,Math.min(1,v));

// ---------- Escadaria e chafariz ----------
const fountainWaterMat=new T.ShaderMaterial({
 transparent:true,
 uniforms:{uTime:{value:0}},
 vertexShader:'varying vec2 vP;void main(){vP=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform float uTime;varying vec2 vP;
  void main(){float r=length(vP);
   float ring=sin(r*9.-uTime*5.)*.5+.5;ring*=exp(-r*.25);
   float jets=0.;for(int i=0;i<8;i++){float a=float(i)*.7854;vec2 c=vec2(cos(a),sin(a))*3.2;float d=length(vP-c);jets+=smoothstep(.6,0.,d)*(.5+.5*sin(d*20.-uTime*12.));}
   vec3 col=mix(vec3(.18,.55,.66),vec3(.55,.86,.90),ring*.6);
   col=mix(col,vec3(.95,1.,1.),clamp(jets*.6+smoothstep(.85,1.,ring)*.25,0.,1.));
   gl_FragColor=vec4(col,.86);}`
});
const curtainMat=new T.ShaderMaterial({
 transparent:true,side:T.DoubleSide,depthWrite:false,
 uniforms:{uTime:{value:0}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform float uTime;varying vec2 vUv;
  float h(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453);}
  void main(){float s=h(vec2(floor(vUv.x*140.),0.));float streak=fract(vUv.y*1.6+uTime*(1.6+s)+s*3.);
   float line=smoothstep(.55,.95,streak)*(.4+.6*s);
   float a=.10+.55*line;vec3 col=mix(vec3(.62,.88,.94),vec3(1.),line);
   // Espuma onde a cascata bate (parte de baixo).
   float foot=smoothstep(.22,0.,vUv.y);a=max(a,foot*.55);col=mix(col,vec3(1.),foot);
   gl_FragColor=vec4(col,a);}`
});
function buildPlaza(api,site){
 const scene=api.scene,h=window.arcanoIslandHeight,O=window.arcanoObstacles;
 // Escadaria do castelo até a praça.
 const st=new T.Group();
 const z0=30.5,z1=74,STEP=.7;
 for(let z=z0;z<z1;z+=STEP){const wz=site.z+z,y=h(site.x,wz);box(st,9,.5,STEP+.05,M.trim,site.x,y-.08,wz,0,2);for(const sx of [-1,1])box(st,.6,1.1,STEP+.05,M.wall,site.x+sx*4.8,y+.45,wz);}
 for(const sx of [-1,1])for(let z=z0;z<z1;z+=6){const wz=site.z+z,y=h(site.x,wz);box(st,.8,2.2,.8,M.wall,site.x+sx*4.8,y+1,wz);box(st,.45,.55,.45,M.glass,site.x+sx*4.8,y+2.4,wz);box(st,.6,.15,.6,M.iron,site.x+sx*4.8,y+2.75,wz);}
 mergeInto(st,scene,'Escadaria do castelo');
 // Chafariz.
 const fx=site.x,fz=site.z+88,fy=h(fx,fz);
 const g=new T.Group();
 const oct=(r1,r2,hh,m,y)=>{const c=new T.Mesh(new T.CylinderGeometry(r1,r2,hh,8),m);c.position.set(fx,fy+y+hh/2,fz);c.rotation.y=Math.PI/8;g.add(c);return c;};
 oct(7.6,7.8,.45,M.base,0);oct(6.7,6.7,.25,M.base,.4);
 // Borda em anel (a água fica visível dentro dela).
 {const pts=[new T.Vector2(6.6,.4),new T.Vector2(6.6,1.35),new T.Vector2(6.75,1.48),new T.Vector2(7.3,1.48),new T.Vector2(7.45,1.3),new T.Vector2(7.45,.4)];
  const rim=new T.Mesh(new T.LatheGeometry(pts,8),M.trim);rim.position.set(fx,fy,fz);rim.rotation.y=Math.PI/8;g.add(rim);}
 const water=new T.Mesh(new T.CircleGeometry(6.6,48),fountainWaterMat);water.rotation.x=-Math.PI/2;water.position.set(fx,fy+1.18,fz);scene.add(water);
 // Bacias com bordas torneadas (Lathe).
 const bowl=(r,y,hh)=>{const pts=[new T.Vector2(.3,0),new T.Vector2(r*.35,.05),new T.Vector2(r*.85,hh*.6),new T.Vector2(r,hh),new T.Vector2(r*.95,hh*1.1)];const l=new T.Mesh(new T.LatheGeometry(pts,24),M.trim);l.position.set(fx,fy+y,fz);g.add(l);};
 cyl(g,1.3,1.7,2.4,M.wall,fx,fy+1.1,fz,12);bowl(3.4,3.4,.9);
 cyl(g,.6,.8,1.8,M.wall,fx,fy+4.3,fz,10);bowl(1.8,6.0,.6);
 // Água das bacias.
 for(const [r,y] of [[3.15,4.2],[1.62,6.55]]){const w=new T.Mesh(new T.CircleGeometry(r,32),fountainWaterMat);w.rotation.x=-Math.PI/2;w.position.set(fx,fy+y,fz);scene.add(w);}
 // Cascatas: cortinas d'água caindo das bordas.
 for(const [r,y0,y1] of [[3.35,4.3,1.15],[1.78,6.6,4.25]]){const c=new T.Mesh(new T.CylinderGeometry(r,r+.25,y0-y1,40,1,true),curtainMat);c.position.set(fx,fy+(y0+y1)/2,fz);scene.add(c);}
 // Estátua: figura de manto erguendo um orbe brilhante.
 const robe=new T.LatheGeometry([new T.Vector2(.0,0),new T.Vector2(.62,0),new T.Vector2(.5,.9),new T.Vector2(.33,1.7),new T.Vector2(.28,2.1),new T.Vector2(0,2.2)],16);
 const fig=new T.Mesh(robe,M.wall);fig.position.set(fx,fy+6.6,fz);g.add(fig);
 const head=new T.Mesh(new T.SphereGeometry(.28,12,10),M.wall);head.position.set(fx,fy+9.05,fz);g.add(head);
 box(g,.18,1.3,.18,M.wall,fx+.32,fy+9.2,fz).rotation.z=-.25;
 const wingShape=new T.Shape();wingShape.moveTo(0,0);wingShape.bezierCurveTo(.9,.5,1.8,1.5,2.2,2.6);wingShape.lineTo(1.7,2.2);wingShape.lineTo(1.75,1.7);wingShape.lineTo(1.2,1.5);wingShape.lineTo(1.2,1.0);wingShape.lineTo(.6,.8);wingShape.lineTo(.2,-.3);wingShape.lineTo(0,0);
 for(const sx of [-1,1]){const wg=new T.Mesh(new T.ExtrudeGeometry(wingShape,{depth:.12,bevelEnabled:false}),M.wall);wg.position.set(fx+sx*.15,fy+8.1,fz-.3);wg.scale.x=sx;wg.rotation.y=sx*.4;g.add(wg);}
 mergeInto(g,scene,'Chafariz da praça');
 const orb=new T.Mesh(new T.SphereGeometry(.38,16,12),M.core);orb.position.set(fx+.48,fy+9.95,fz);scene.add(orb);
 // Jatos: um central sobre a estátua e oito em arco da borda para dentro.
 const N=420,seeds=new Float32Array(N*4);for(let i=0;i<N;i++){seeds[i*4]=Math.floor(Math.random()*9);seeds[i*4+1]=Math.random();seeds[i*4+2]=Math.random()*2-1;seeds[i*4+3]=Math.random();}
 const pg=new T.BufferGeometry();pg.setAttribute('position',new T.BufferAttribute(new Float32Array(N*3),3));pg.setAttribute('seed',new T.BufferAttribute(seeds,4));
 const jetMat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:fountainWaterMat.uniforms.uTime,uC:{value:new T.Vector3(fx,fy,fz)},uScale:{value:innerHeight*.5}},
  vertexShader:`attribute vec4 seed;uniform float uTime,uScale;uniform vec3 uC;varying float vA;
   void main(){float t=fract(uTime*(.6+.2*seed.w)+seed.y);vec3 p;
    if(seed.x<.5){ // jato central (sai do orbe e cai na bacia de cima)
     float a=seed.z*3.1416;vec2 d=vec2(cos(a),sin(a));p=uC+vec3(d.x*t*1.2,7.2+t*3.2-6.*t*t+3.,d.y*t*1.2);
    }else{ // jatos da borda em arco
     float a=(seed.x-1.)*.7854;vec2 o=vec2(cos(a),sin(a))*6.3;vec2 dir=-normalize(o);
     p=uC+vec3(o.x+dir.x*t*3.3+seed.z*.05,1.2+t*2.6-2.7*t*t,o.y+dir.y*t*3.3);
    }
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
