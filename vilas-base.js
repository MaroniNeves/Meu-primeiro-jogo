/* Base das 6 vilas da floresta: texturas e materiais, formas (caixa, cilindro, telhados com UV em
   metros), junção de malhas, estradas de terra, grades de madeira, cabanas de acampamento com
   fogueira acesa ou apagada e a animação (chamas, fumaça, brasas, brilho noturno). */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const VM=window.__vm=window.__vm||{};
let seed=20260;const rnd=VM.rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const PI=Math.PI;

/* ---------- Texturas ---------- */
function canvasTex(w,h,draw,srgb,norepeat){
 const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
 const t=new T.CanvasTexture(c);if(!norepeat)t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;if(srgb!==false)t.colorSpace=T.SRGBColorSpace;return t;
}
// Duas telas (cor + altura) desenhadas juntas.
function pair(S,draw){
 const a=document.createElement('canvas'),b=document.createElement('canvas');a.width=a.height=b.width=b.height=S;
 draw(a.getContext('2d'),b.getContext('2d'),S);
 const m=new T.CanvasTexture(a),h=new T.CanvasTexture(b);for(const t of [m,h]){t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;}
 m.colorSpace=T.SRGBColorSpace;return {map:m,bump:h};
}
function wrapLine(g,x1,y1,x2,y2,S){for(const oy of [0,-S,S]){g.beginPath();g.moveTo(x1,y1+oy);g.lineTo(x2,y2+oy);g.stroke();}}
const TEX={
 thatch:()=>pair(256,(g,h,S)=>{
  g.fillStyle='hsl(42,50%,50%)';g.fillRect(0,0,S,S);h.fillStyle='#808080';h.fillRect(0,0,S,S);
  for(let i=0;i<2800;i++){const x=rnd()*S,y=rnd()*S,len=16+rnd()*30,dx=(rnd()-.5)*4,lt=36+rnd()*30;
   g.strokeStyle=`hsla(${34+rnd()*16},${48+rnd()*14}%,${lt}%,.6)`;g.lineWidth=1+rnd()*1.7;wrapLine(g,x,y,x+dx,y+len,S);
   h.strokeStyle=lt>52?'rgba(220,220,220,.5)':'rgba(40,40,40,.5)';h.lineWidth=1+rnd()*1.5;wrapLine(h,x,y,x+dx,y+len,S);}
  for(let y=0;y<S;y+=64){g.fillStyle='rgba(70,48,20,.28)';g.fillRect(0,y,S,7);g.fillStyle='rgba(255,236,170,.2)';g.fillRect(0,y+7,S,3);h.fillStyle='#303030';h.fillRect(0,y,S,6);
   for(let x=8;x<S;x+=32){g.fillStyle='rgba(120,84,36,.55)';g.fillRect(x,y+1,3,6);}}
 }),
 turf:()=>pair(256,(g,h,S)=>{
  g.fillStyle='hsl(96,38%,34%)';g.fillRect(0,0,S,S);h.fillStyle='#707070';h.fillRect(0,0,S,S);
  for(let i=0;i<260;i++){const x=rnd()*S,y=rnd()*S,r=6+rnd()*18;g.fillStyle=`hsla(${80+rnd()*40},${34+rnd()*18}%,${26+rnd()*20}%,.3)`;g.beginPath();g.arc(x,y,r,0,6.3);g.fill();}
  for(let i=0;i<2400;i++){const x=rnd()*S,y=rnd()*S,len=5+rnd()*10;g.strokeStyle=`hsla(${86+rnd()*34},${46+rnd()*20}%,${34+rnd()*28}%,.65)`;g.lineWidth=1+rnd();wrapLine(g,x,y,x+(rnd()-.5)*5,y-len,S);
   h.strokeStyle='rgba(210,210,210,.45)';h.lineWidth=1.2;wrapLine(h,x,y,x+(rnd()-.5)*5,y-len,S);}
  for(let i=0;i<30;i++){g.fillStyle=['#f7e8a0','#fff','#f5a7c0'][i%3];g.beginPath();g.arc(rnd()*S,rnd()*S,1.8,0,6.3);g.fill();}
 }),
 dirt:()=>pair(256,(g,h,S)=>{
  g.fillStyle='hsl(31,38%,47%)';g.fillRect(0,0,S,S);h.fillStyle='#909090';h.fillRect(0,0,S,S);
  for(let i=0;i<180;i++){const x=rnd()*S,y=rnd()*S,r=8+rnd()*20;g.fillStyle=`hsla(${26+rnd()*10},${30+rnd()*14}%,${36+rnd()*22}%,.28)`;g.beginPath();g.arc(x,y,r,0,6.3);g.fill();}
  for(const u of [S*.28,S*.72]){g.fillStyle='rgba(60,38,20,.26)';g.fillRect(u-9,0,18,S);h.fillStyle='#585858';h.fillRect(u-9,0,18,S);}
  for(let i=0;i<150;i++){const x=rnd()*S,y=rnd()*S,rx=2+rnd()*5,ry=1.5+rnd()*3.5;
   g.fillStyle=`hsl(${30+rnd()*10},${12+rnd()*14}%,${52+rnd()*22}%)`;g.beginPath();g.ellipse(x,y,rx,ry,rnd()*3,0,6.3);g.fill();g.strokeStyle='rgba(48,36,50,.45)';g.lineWidth=1;g.stroke();
   h.fillStyle='#e0e0e0';h.beginPath();h.ellipse(x,y,rx,ry,0,0,6.3);h.fill();}
 }),
 mud:()=>pair(256,(g,h,S)=>{
  g.fillStyle='hsl(24,34%,27%)';g.fillRect(0,0,S,S);h.fillStyle='#8a8a8a';h.fillRect(0,0,S,S);
  for(let i=0;i<220;i++){const x=rnd()*S,y=rnd()*S,r=8+rnd()*22;g.fillStyle=`hsla(${20+rnd()*10},${28+rnd()*14}%,${20+rnd()*16}%,.35)`;g.beginPath();g.arc(x,y,r,0,6.3);g.fill();}
  for(const u of [S*.28,S*.72]){g.fillStyle='rgba(30,18,10,.45)';g.fillRect(u-11,0,22,S);h.fillStyle='#505050';h.fillRect(u-11,0,22,S);}
  // poças: manchas azuladas e lisas (reflexo do céu)
  for(let i=0;i<9;i++){const x=rnd()*S,y=rnd()*S,rx=14+rnd()*24,ry=8+rnd()*12;const gr=g.createRadialGradient(x,y,2,x,y,rx);gr.addColorStop(0,'rgba(150,176,196,.8)');gr.addColorStop(.7,'rgba(110,134,150,.6)');gr.addColorStop(1,'rgba(70,56,44,0)');g.fillStyle=gr;g.beginPath();g.ellipse(x,y,rx,ry,rnd()*3,0,6.3);g.fill();h.fillStyle='#707070';h.beginPath();h.ellipse(x,y,rx,ry,0,0,6.3);h.fill();}
  for(let i=0;i<40;i++){const x=rnd()*S,y=rnd()*S;g.fillStyle='rgba(20,12,8,.5)';g.beginPath();g.ellipse(x,y,5,2.5,rnd()*3,0,6.3);g.fill();h.fillStyle='#606060';h.beginPath();h.ellipse(x,y,5,2.5,0,0,6.3);h.fill();}
 }),
 gravel:()=>pair(256,(g,h,S)=>{
  g.fillStyle='hsl(36,10%,58%)';g.fillRect(0,0,S,S);h.fillStyle='#808080';h.fillRect(0,0,S,S);
  for(let i=0;i<1400;i++){const x=rnd()*S,y=rnd()*S,rx=2+rnd()*4.5,ry=1.6+rnd()*3.2,a=rnd()*3;const L=46+rnd()*34;
   for(const ox of [0,-S])for(const oy of [0,-S]){g.fillStyle=`hsl(${28+rnd()*18},${6+rnd()*14}%,${L}%)`;g.beginPath();g.ellipse(x+ox,y+oy,rx,ry,a,0,6.3);g.fill();g.strokeStyle='rgba(40,34,40,.4)';g.lineWidth=.8;g.stroke();h.fillStyle=`rgb(${150+rnd()*90|0},${150+rnd()*90|0},${150+rnd()*90|0})`;h.beginPath();h.ellipse(x+ox,y+oy,rx,ry,a,0,6.3);h.fill();}}
 }),
 wheat:()=>pair(256,(g,h,S)=>{
  g.fillStyle='hsl(40,52%,40%)';g.fillRect(0,0,S,S);h.fillStyle='#707070';h.fillRect(0,0,S,S);
  for(let r=0;r<10;r++){const x0=r*S/10;g.fillStyle='rgba(60,36,14,.35)';g.fillRect(x0,0,5,S);h.fillStyle='#404040';h.fillRect(x0,0,5,S);}
  for(let i=0;i<3600;i++){const x=rnd()*S,y=rnd()*S,len=8+rnd()*12;g.strokeStyle=`hsla(${40+rnd()*12},${60+rnd()*16}%,${44+rnd()*26}%,.7)`;g.lineWidth=1+rnd()*1.2;wrapLine(g,x,y,x+(rnd()-.5)*4,y-len,S);
   h.strokeStyle='rgba(230,230,230,.5)';h.lineWidth=1.2;wrapLine(h,x,y,x+(rnd()-.5)*4,y-len,S);}
 }),
 canvas:(c1,c2,stripes)=>canvasTex(128,128,(g,w,h)=>{
  g.fillStyle=c1;g.fillRect(0,0,w,h);
  if(stripes){g.fillStyle=c2;for(let x=0;x<w;x+=32)g.fillRect(x,0,16,h);}
  for(let i=0;i<900;i++){g.fillStyle=`rgba(${rnd()<.5?'255,250,235':'60,44,36'},${.03+rnd()*.06})`;g.fillRect(rnd()*w,rnd()*h,6+rnd()*14,1);}
  g.strokeStyle='rgba(50,36,40,.35)';g.lineWidth=2;g.beginPath();g.moveTo(0,h-3);g.lineTo(w,h-3);g.stroke();
 }),
 tipi:()=>canvasTex(256,128,(g,w,h)=>{
  g.fillStyle='#e8d8b4';g.fillRect(0,0,w,h);
  for(let i=0;i<1200;i++){g.fillStyle=`rgba(${rnd()<.5?'255,250,235':'90,66,44'},${.04+rnd()*.07})`;g.fillRect(rnd()*w,rnd()*h,8+rnd()*14,1);}
  g.fillStyle='#b8452c';g.fillRect(0,h*.8,w,h*.2);g.fillStyle='#2f5e86';g.fillRect(0,h*.72,w,h*.06);
  for(let x=0;x<w;x+=32){g.fillStyle='#b8452c';g.beginPath();g.moveTo(x,h*.72);g.lineTo(x+16,h*.34);g.lineTo(x+32,h*.72);g.closePath();g.fill();g.fillStyle='#2f5e86';g.beginPath();g.moveTo(x+8,h*.72);g.lineTo(x+16,h*.5);g.lineTo(x+24,h*.72);g.closePath();g.fill();}
 }),
 cap:(base,spot,rim)=>canvasTex(256,128,(g,w,h)=>{
  const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,base);gr.addColorStop(1,rim||base);g.fillStyle=gr;g.fillRect(0,0,w,h);
  for(let i=0;i<22;i++){const x=rnd()*w,y=h*(.1+rnd()*.7),r=5+rnd()*10;g.fillStyle=spot;g.strokeStyle='rgba(40,24,40,.4)';g.lineWidth=2;
   for(const ox of [0,-w,w]){g.beginPath();g.ellipse(x+ox,y,r*1.4,r,0,0,6.3);g.fill();g.stroke();}}
  g.fillStyle='rgba(255,255,255,.12)';g.fillRect(0,0,w,6);
 }),
 shoji:()=>{const mk=em=>canvasTex(128,128,(g,w,h)=>{
  const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,em?'#ffe8b0':'#f6f0e0');gr.addColorStop(1,em?'#e0a050':'#e4dcc6');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.strokeStyle=em?'#000':'#5a3d26';g.lineWidth=5;g.strokeRect(2,2,w-4,h-4);for(let i=1;i<4;i++){g.beginPath();g.moveTo(i*w/4,0);g.lineTo(i*w/4,h);g.stroke();}for(let j=1;j<3;j++){g.beginPath();g.moveTo(0,j*h/3);g.lineTo(w,j*h/3);g.stroke();}});
  return {map:mk(false),emit:mk(true)};},
 glow:()=>canvasTex(64,64,(g)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,200,110,.85)');gr.addColorStop(.35,'rgba(255,150,60,.35)');gr.addColorStop(1,'rgba(255,120,40,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);},true,true),
 flame:()=>canvasTex(64,128,(g)=>{
  for(const [r,col] of [[28,'rgba(255,70,12,0)'],[24,'rgba(255,96,20,.55)'],[18,'rgba(255,164,44,.88)'],[10,'rgba(255,226,124,1)'],[4,'rgba(255,255,232,1)']]){
   g.fillStyle=col;g.beginPath();g.moveTo(32,6);g.bezierCurveTo(32+r*1.1,50,32+r,96,32,122);g.bezierCurveTo(32-r,96,32-r*1.1,50,32,6);g.fill();}},true,true),
 smoke:()=>canvasTex(64,64,(g)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(120,120,126,.55)');gr.addColorStop(1,'rgba(120,120,126,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);},true,true)
};
VM.TEX=TEX;

/* ---------- Materiais ---------- */
VM.makeMats=function(){
 const AT=window.arcanoTex,mat=o=>new T.MeshStandardMaterial(Object.assign({roughness:1,metalness:0},o));
 const tex=(t,sc,extra)=>mat(Object.assign({map:t.map,bumpMap:t.bump,bumpScale:sc==null?.8:sc},extra||{}));
 const M={};
 const flat=(c)=>mat({color:c});
 if(AT){
  M.stone=tex(AT.stone({hue:36,sat:8,l0:52,l1:68,seed:81}),.8);M.stoneDark=tex(AT.stone({hue:222,sat:8,l0:38,l1:52,seed:82,moss:.35}),.8);
  M.plaster=tex(AT.plaster({hue:38,sat:34,l:84}),.6);M.white=tex(AT.plaster({hue:42,sat:10,l:94,seed:15}),.5);
  M.wood=tex(AT.wood({hue:30,light:46,seed:83}),.8);M.woodDark=tex(AT.wood({hue:22,light:27,seed:84}),.8);M.woodH=tex(AT.wood({hue:28,light:42,horizontal:true,seed:85}),.8);
  M.log=tex(AT.wood({hue:25,light:34,horizontal:true,boards:6,seed:86}),.9);M.deck=tex(AT.wood({hue:30,light:52,horizontal:true,seed:87}),.7);
  M.cobble=tex(AT.cobble({hue:34,sat:18,l0:56,l1:74,seed:88,n:7}),.8);
  M.roofTerra=tex(AT.shingles({hue:14,sat:58,l0:40,l1:57,seed:90}),.9,{side:T.DoubleSide});
  M.roofSlate=tex(AT.shingles({hue:212,sat:16,l0:30,l1:44,seed:91}),.9,{side:T.DoubleSide});
  M.roofRed=tex(AT.shingles({hue:6,sat:50,l0:34,l1:50,seed:92}),.9,{side:T.DoubleSide});
  M.roofTeal=tex(AT.shingles({hue:176,sat:34,l0:34,l1:50,seed:93}),.9,{side:T.DoubleSide});
  M.roofShake=tex(AT.shingles({hue:28,sat:20,l0:28,l1:42,seed:94}),.9,{side:T.DoubleSide});
 }else{for(const k of ['stone','stoneDark','plaster','white','wood','woodDark','woodH','log','deck','cobble','roofTerra','roofSlate','roofRed','roofTeal','roofShake'])M[k]=flat('#9a8a78');}
 let t=TEX.thatch();M.thatch=tex(t,1.1,{side:T.DoubleSide});t=TEX.turf();M.turf=tex(t,1,{side:T.DoubleSide});
 t=TEX.dirt();M.dirt=tex(t,.8,{side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 t=TEX.wheat();M.wheat=tex(t,1.2,{polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 const sh=TEX.shoji();M.shoji=mat({map:sh.map,emissive:new T.Color('#ffffff'),emissiveMap:sh.emit,emissiveIntensity:.05});
 const gt=AT&&AT.windowTile?AT.windowTile():null;M.glass=gt?mat({map:gt.map,emissive:new T.Color('#ffffff'),emissiveMap:gt.emit,emissiveIntensity:.05}):mat({color:'#bcd8ea'});
 M.cloth=mat({color:'#e8dcc2'});M.iron=mat({color:'#33343a',roughness:.6,metalness:.2});M.gold=mat({color:'#d9b35a',roughness:.45,metalness:.3});
 M.red=mat({color:'#b53a2e'});M.redLacquer=mat({color:'#c2352b'});M.blue=mat({color:'#2f6fae'});M.blueDoor=mat({color:'#3a7ac0'});M.green=mat({color:'#4e8f45'});M.leaf=mat({color:'#5a9b48'});M.leafDark=mat({color:'#3f7a3a'});
 M.pink=mat({color:'#f6a8c4'});M.cream=mat({color:'#f0e2c6'});M.bark=mat({color:'#6a4429'});M.ash=mat({color:'#3a3836'});M.char=mat({color:'#1e1a18'});M.hay=mat({color:'#d8b84e'});M.water=mat({color:'#3d8fbf',roughness:.3,transparent:true,opacity:.88});
 M.lantern=mat({color:'#fff1c8',emissive:new T.Color('#ffb34a'),emissiveIntensity:.5});M.rune=mat({color:'#9ff3e6',emissive:new T.Color('#3fe0c8'),emissiveIntensity:1.2});
 M.window=M.glass;
 {const rd=(t,sc)=>tex(t,sc,{side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  M.rdDirt=M.dirt;M.rdMud=rd(TEX.mud(),1.2);M.rdGravel=rd(TEX.gravel(),1.1);
  if(AT){M.rdFlag=rd(AT.stone({hue:30,sat:6,l0:54,l1:70,rows:3,seed:101,cracks:.3}),.8);M.rdCobble=rd(AT.cobble({hue:34,sat:18,l0:54,l1:72,seed:103,n:9}),.8);M.rdPlank=rd(AT.wood({hue:28,light:48,horizontal:true,boards:6,seed:102}),.8);}
  else{M.rdFlag=M.rdCobble=M.rdPlank=M.rdDirt;}}
 M.tentA=mat({map:TEX.canvas('#d9a441','#b8452c',true),side:T.DoubleSide});M.tentB=mat({map:TEX.canvas('#4a79a8','#e8dcc2',true),side:T.DoubleSide});M.tentC=mat({map:TEX.canvas('#5a8f4a','#d9c88a',true),side:T.DoubleSide});M.tentD=mat({map:TEX.canvas('#a8423c','#e8dcc2',true),side:T.DoubleSide});
 M.tipi=mat({map:TEX.tipi(),side:T.DoubleSide});M.inside=mat({color:'#2a2018',side:T.DoubleSide});
 const mc=(b,s,r)=>mat({map:TEX.cap(b,s,r)});
 M.capRed=mc('#d4453a','#fff3dc','#9e2a2a');M.capPurple=mc('#8f5fbf','#ffe58a','#5e3a8a');M.capTeal=mc('#3fb3a8','#fff0f4','#26766f');M.capOrange=mc('#e9893a','#fff6d0','#a85a22');M.capPink=mc('#f08fb6','#fff','#b8587f');
 M.stem=mat({color:'#f3e6cc'});M.gills=mat({color:'#e0c9a0',side:T.DoubleSide});
 M.glowCyan=mat({color:'#bff8ff',emissive:new T.Color('#4fe0ff'),emissiveIntensity:1.4});M.glowPink=mat({color:'#ffd0e6',emissive:new T.Color('#ff6fb0'),emissiveIntensity:1.3});
 return M;
};

/* ---------- Formas ---------- */
function boxUV(geo,w,h,d,tile){const uv=geo.attributes.uv,F=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];for(let f=0;f<6;f++)for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,uv.getX(i)*F[f][0]/tile,uv.getY(i)*F[f][1]/tile);}return geo;}
const box=VM.box=function(g,w,h,d,m,x,y,z,ry,tile){const mm=new T.Mesh(boxUV(new T.BoxGeometry(w,h,d),w,h,d,tile||2.5),m);mm.position.set(x,y+h/2,z);mm.rotation.y=ry||0;g.add(mm);return mm;}; // y = base
const cyl=VM.cyl=function(g,r1,r2,h,m,x,y,z,seg,tile){const geo=new T.CylinderGeometry(r1,r2,h,seg||12),uv=geo.attributes.uv;tile=tile||2.5;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*2*PI*Math.max(r1,r2)/tile,uv.getY(i)*h/tile);const mm=new T.Mesh(geo,m);mm.position.set(x,y+h/2,z);g.add(mm);return mm;};
const sph=VM.sph=function(g,r,m,x,y,z,sx,sy,sz,seg){const mm=new T.Mesh(new T.SphereGeometry(r,seg||12,Math.max(6,(seg||12)>>1)),m);mm.position.set(x,y,z);mm.scale.set(sx||1,sy||1,sz||1);g.add(mm);return mm;};
const cone=VM.cone=function(g,r,h,m,x,y,z,seg,tile){const geo=new T.ConeGeometry(r,h,seg||8),uv=geo.attributes.uv;tile=tile||2.5;const sl=Math.hypot(h,r);for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*2*PI*r/tile,uv.getY(i)*sl/tile);const mm=new T.Mesh(geo,m);mm.position.set(x,y+h/2,z);g.add(mm);return mm;};
// Haste entre dois pontos.
VM.rod=function(g,ax,ay,az,bx,by,bz,r,m,seg){const A=new T.Vector3(ax,ay,az),d=new T.Vector3(bx-ax,by-ay,bz-az),L=d.length();const mm=new T.Mesh(new T.CylinderGeometry(r,r,L,seg||6),m);mm.position.copy(A).addScaledVector(d,.5);mm.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());g.add(mm);return mm;};
// Telhados com UV em metros: roofMesh/pushTri/pushQuad.
function roofMesh(g,P,U,m,x,y,z){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(P,3));geo.setAttribute('uv',new T.Float32BufferAttribute(U,2));geo.computeVertexNormals();const mm=new T.Mesh(geo,m);mm.position.set(x,y,z);g.add(mm);return mm;}
function pushTri(P,U,a,b,c,ua,ub,uc){P.push(...a,...b,...c);U.push(...ua,...ub,...uc);}
function pushQuad(P,U,a,b,c,d,ua,ub,uc,ud){pushTri(P,U,a,b,c,ua,ub,uc);pushTri(P,U,a,c,d,ua,uc,ud);}
VM.roofMesh=roofMesh;VM.pushTri=pushTri;VM.pushQuad=pushQuad;
// Quatro águas: base W (x) por D (z), altura h, cumeeira ao longo de x.
VM.hipRoof=function(g,W,D,h,m,x,y,z,tile){tile=tile||3;const hw=W/2,hd=D/2,rl=Math.max(0,hw-hd),sl=Math.hypot(hd,h),k=sl/h/tile,P=[],U=[];
 const A=[-hw,0,-hd],B=[hw,0,-hd],C=[hw,0,hd],Dd=[-hw,0,hd],R1=[-rl,h,0],R2=[rl,h,0];
 pushQuad(P,U,Dd,C,R2,R1,[-hw/tile,0],[hw/tile,0],[rl/tile,h*k],[-rl/tile,h*k]);
 pushQuad(P,U,B,A,R1,R2,[hw/tile,0],[-hw/tile,0],[-rl/tile,h*k],[rl/tile,h*k]);
 pushTri(P,U,C,B,R2,[hd/tile,0],[-hd/tile,0],[0,h*k]);pushTri(P,U,A,Dd,R1,[-hd/tile,0],[hd/tile,0],[0,h*k]);
 return roofMesh(g,P,U,m,x,y,z);};
// Pirâmide de base W x D (quatro lados iguais).
VM.pyramid=function(g,W,D,h,m,x,y,z,tile){tile=tile||3;const hw=W/2,hd=D/2,P=[],U=[],A=[-hw,0,-hd],B=[hw,0,-hd],C=[hw,0,hd],Dd=[-hw,0,hd],Tp=[0,h,0],k=Math.hypot(hd,h)/h/tile,k2=Math.hypot(hw,h)/h/tile;
 pushTri(P,U,Dd,C,Tp,[-hw/tile,0],[hw/tile,0],[0,h*k]);pushTri(P,U,B,A,Tp,[hw/tile,0],[-hw/tile,0],[0,h*k]);pushTri(P,U,C,B,Tp,[hd/tile,0],[-hd/tile,0],[0,h*k2]);pushTri(P,U,A,Dd,Tp,[-hd/tile,0],[hd/tile,0],[0,h*k2]);
 return roofMesh(g,P,U,m,x,y,z);};
// Duas águas, cumeeira ao longo de x, com triângulos de empena (faceM) sob o beiral.
VM.gableRoof=function(g,L,D,rise,roofM,faceM,x,y,z,over,ovE,tile){tile=tile||3;over=over==null?.6:over;ovE=ovE==null?.5:ovE;
 const hw=D/2+over,hl=L/2+ovE,sl=Math.hypot(hw,rise),k=sl/rise/tile,P=[],U=[];
 pushQuad(P,U,[hl,0,-hw],[-hl,0,-hw],[-hl,rise,0],[hl,rise,0],[hl/tile,0],[-hl/tile,0],[-hl/tile,rise*k],[hl/tile,rise*k]);
 pushQuad(P,U,[-hl,0,hw],[hl,0,hw],[hl,rise,0],[-hl,rise,0],[-hl/tile,0],[hl/tile,0],[hl/tile,rise*k],[-hl/tile,rise*k]);
 roofMesh(g,P,U,roofM,x,y,z);
 if(faceM){const ra=rise*over/hw,hd=D/2;
  for(const sx of [-1,1]){const Q=[],V=[],xx=sx*L/2,uvf=(zz,yy)=>[zz/2.5,yy/2.5];
   if(sx>0){pushTri(Q,V,[xx,0,hd],[xx,0,-hd],[xx,ra,hd],uvf(hd,0),uvf(-hd,0),uvf(hd,ra));pushTri(Q,V,[xx,0,-hd],[xx,rise,0],[xx,ra,hd],uvf(-hd,0),uvf(0,rise),uvf(hd,ra));pushTri(Q,V,[xx,0,-hd],[xx,ra,-hd],[xx,rise,0],uvf(-hd,0),uvf(-hd,ra),uvf(0,rise));}
   else{pushTri(Q,V,[xx,0,-hd],[xx,0,hd],[xx,ra,-hd],uvf(-hd,0),uvf(hd,0),uvf(-hd,ra));pushTri(Q,V,[xx,0,hd],[xx,rise,0],[xx,ra,-hd],uvf(hd,0),uvf(0,rise),uvf(-hd,ra));pushTri(Q,V,[xx,0,hd],[xx,ra,hd],[xx,rise,0],uvf(hd,0),uvf(hd,ra),uvf(0,rise));}
   roofMesh(g,Q,V,faceM,x,y,z);}}
};
// Cone/pirâmide redonda com UV em metros (telhas do tamanho certo).
VM.coneRoof=function(g,r,h,m,x,y,z,seg,tile){tile=tile||3;const geo=new T.ConeGeometry(r,h,seg||10),uv=geo.attributes.uv,sl=Math.hypot(h,r);for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*2*PI*r/tile,uv.getY(i)*sl/tile);const mm=new T.Mesh(geo,m);mm.position.set(x,y+h/2,z);g.add(mm);return mm;};

/* ---------- Junção de malhas por material ---------- */
VM.mergeInto=function(group,parent,name,shadow){
 group.updateMatrixWorld(true);const buckets=new Map();
 group.traverse(o=>{if(!o.isMesh||o.userData.keep)return;const m=o.material;let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);
  if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
  if(!g.attributes.normal)g.computeVertexNormals();
  if(!buckets.has(m))buckets.set(m,[]);buckets.get(m).push(g);});
 for(const [m,list] of buckets){let n=0;for(const g of list)n+=g.attributes.position.count;
  const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2);let off=0;
  for(const g of list){P.set(g.attributes.position.array,off*3);N.set(g.attributes.normal.array,off*3);U.set(g.attributes.uv.array.subarray(0,g.attributes.position.count*2),off*2);off+=g.attributes.position.count;g.dispose();}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(P,3));geo.setAttribute('normal',new T.BufferAttribute(N,3));geo.setAttribute('uv',new T.BufferAttribute(U,2));
  if(list.some(g=>g.attributes.color)){const Cc=new Float32Array(n*3).fill(1);let o2=0;for(const g of list){const cnt=g.attributes.position.count;if(g.attributes.color)Cc.set(g.attributes.color.array.subarray(0,cnt*3),o2*3);o2+=cnt;}geo.setAttribute('color',new T.BufferAttribute(Cc,3));}
  geo.computeBoundingSphere();
  const mesh=new T.Mesh(geo,m);mesh.name=name;mesh.castShadow=shadow!==false&&!m.emissiveMap&&!m.transparent&&!m.alphaTest;mesh.receiveShadow=true;parent.add(mesh);}
};
})();
