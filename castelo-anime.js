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
// Texturas pintadas à mão com relevo (texturas-anime.js); sem o módulo, ficam as de canvas simples.
const AT=window.arcanoTex,TB={};
if(AT){
 const put=(k,t,sc)=>{TX[k]=t.map;TB[k]=[t.bump,sc];};
 put('wall',AT.stone({hue:40,sat:15,l0:56,l1:72,seed:7,cracks:.2}),.9);
 put('base',AT.stone({hue:226,sat:12,l0:36,l1:52,seed:19,moss:.5,cracks:.22}),.9);
 put('trim',AT.stone({hue:40,sat:22,l0:62,l1:76,seed:23,rows:6,cracks:.08}),.8);
 put('inner',AT.stone({hue:42,sat:14,l0:66,l1:78,seed:31,cracks:.07}),.7);
 put('floor',AT.marble({n:8}),.6);
 put('wood',AT.wood({hue:28,light:44}),.8);put('woodDark',AT.wood({hue:22,light:30,seed:5}),.8);put('woodLight',AT.wood({hue:32,light:56,seed:8}),.8);
 put('slate',AT.shingles({hue:216,sat:22,l0:32,l1:48}),.9);
 put('copper',AT.shingles({hue:170,sat:36,l0:40,l1:56,seed:4}),.9);
}
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
if(AT)for(const [k,[b,sc]] of Object.entries(TB))if(M[k]){M[k].bumpMap=b;M[k].bumpScale=sc;}
// Quadros: paisagens e retratos pintados em canvas (estilo anime, cores suaves).
function artTex(kind,seedHue){return canvasTex(128,96,(g,w,h)=>{
 if(kind===0){const sky=g.createLinearGradient(0,0,0,h);sky.addColorStop(0,`hsl(${200+seedHue},60%,72%)`);sky.addColorStop(1,`hsl(${30+seedHue},70%,85%)`);g.fillStyle=sky;g.fillRect(0,0,w,h);
  for(let l=0;l<3;l++){g.fillStyle=`hsl(${120+l*10+seedHue},${35+l*10}%,${55-l*12}%)`;g.beginPath();g.moveTo(0,h);for(let x=0;x<=w;x+=8)g.lineTo(x,h*(.45+l*.15)-Math.sin(x*.05+l*2+seedHue)*10);g.lineTo(w,h);g.fill();}
  g.fillStyle='#fff8d8';g.beginPath();g.arc(w*.75,h*.25,8,0,6.3);g.fill();}
 else if(kind===1){g.fillStyle=`hsl(${20+seedHue},30%,22%)`;g.fillRect(0,0,w,h);g.fillStyle=`hsl(${210+seedHue},40%,40%)`;g.beginPath();g.ellipse(w/2,h+10,34,44,0,0,6.3);g.fill();
  g.fillStyle='#f2d2b6';g.beginPath();g.arc(w/2,h*.42,15,0,6.3);g.fill();g.fillStyle=`hsl(${40+seedHue*3},60%,${45+seedHue}%)`;g.beginPath();g.arc(w/2,h*.36,17,Math.PI,0);g.fill();g.fillRect(w/2-17,h*.36,6,22);g.fillRect(w/2+11,h*.36,6,22);}
 else{g.fillStyle=`hsl(${260+seedHue},25%,30%)`;g.fillRect(0,0,w,h);g.fillStyle='#7a5a3a';g.fillRect(0,h*.72,w,h);
  for(let i=0;i<5;i++){g.fillStyle=`hsl(${i*70+seedHue},65%,58%)`;g.beginPath();g.arc(30+i*16,h*.62-(i%2)*8,9,0,6.3);g.fill();}g.fillStyle='#dfe8f0';g.fillRect(w*.7,h*.3,14,30);}
 g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=3;g.strokeRect(0,0,w,h);});}
M.art=[];for(let i=0;i<9;i++)M.art.push(mat({color:'#ffffff',map:artTex(i%3,i*7)}));
M.book=['#7a2a2a','#2a4a7a','#2f6a3a','#6a4a2a','#4a2a5a','#8a6a2a','#2a5a5a','#5a2a3a'].map(c=>mat({color:c}));
M.velvetBlue=mat({color:'#2b3f73'});M.velvetGreen=mat({color:'#2f5a3f'});
// ---------- Tecido das cortinas e céu estrelado ----------
const fabricTex=canvasTex(128,256,(g,w,h)=>{for(let x=0;x<w;x++){const v=Math.round(206+Math.sin(x*.35)*26+Math.sin(x*1.3)*9+rnd()*8);g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(x,0,1,h);}
 const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(255,255,255,.18)');gr.addColorStop(1,'rgba(0,0,0,.14)');g.fillStyle=gr;g.fillRect(0,0,w,h);});
M.drape=['#8a1e2e','#24407a','#25603f','#5a2a6e'].map(c=>mat({color:c,map:fabricTex,side:T.DoubleSide,roughness:.72}));
// Vitral visto de fora: céu e reflexos de dia, chumbo em cruz e brilho quente de dentro à noite.
const winTex=canvasTex(128,256,(g,w,h)=>{
 const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#8ec3e8');gr.addColorStop(.55,'#c4e2f4');gr.addColorStop(1,'#e8f3fa');g.fillStyle=gr;g.fillRect(0,0,w,h);
 g.fillStyle='rgba(255,255,255,.42)';g.beginPath();g.moveTo(14,0);g.lineTo(52,0);g.lineTo(0,96);g.lineTo(0,52);g.closePath();g.fill();
 g.fillStyle='rgba(255,255,255,.26)';g.beginPath();g.moveTo(70,0);g.lineTo(84,0);g.lineTo(0,170);g.lineTo(0,150);g.closePath();g.fill();
 g.fillStyle='rgba(60,96,140,.22)';g.beginPath();g.moveTo(w,h*.5);g.lineTo(w,h);g.lineTo(w*.3,h);g.closePath();g.fill();
 g.strokeStyle='rgba(38,32,52,.9)';g.lineWidth=6;g.beginPath();g.moveTo(w/2,0);g.lineTo(w/2,h);g.moveTo(0,h*.36);g.lineTo(w,h*.36);g.moveTo(0,h*.72);g.lineTo(w,h*.72);g.stroke();});
const winEmit=canvasTex(128,256,(g,w,h)=>{const gr=g.createRadialGradient(w/2,h*.55,6,w/2,h*.55,h*.62);gr.addColorStop(0,'#ffe9b0');gr.addColorStop(1,'#d9822e');g.fillStyle=gr;g.fillRect(0,0,w,h);g.strokeStyle='#000';g.lineWidth=6;g.beginPath();g.moveTo(w/2,0);g.lineTo(w/2,h);g.moveTo(0,h*.36);g.lineTo(w,h*.36);g.moveTo(0,h*.72);g.lineTo(w,h*.72);g.stroke();});
{const wt=AT?AT.windowTile():null;M.winTile=wt?mat({color:'#ffffff',map:wt.map,emissive:new T.Color('#ffffff'),emissiveMap:wt.emit,emissiveIntensity:.05}):null;}
M.winOut=mat({color:'#ffffff',map:winTex,emissive:new T.Color('#ffffff'),emissiveMap:winEmit,emissiveIntensity:.05});
function archPaneGeo(w,rect){const sh=new T.Shape(),hw=w/2;sh.moveTo(-hw,0);sh.lineTo(hw,0);sh.lineTo(hw,rect);sh.absarc(0,rect,hw,0,Math.PI,false);sh.lineTo(-hw,0);
 const geo=new T.ShapeGeometry(sh,12),p=geo.attributes.position,uv=geo.attributes.uv,H=rect+hw;for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+hw)/w,p.getY(i)/H);return geo;}
M.pane=new T.MeshBasicMaterial({color:'#dff0ff',transparent:true,opacity:.1,depthWrite:false,side:T.DoubleSide});
const starTex=(w,h,lines)=>canvasTex(w,h,(g,W,Hh)=>{const gr=g.createRadialGradient(W/2,Hh/2,10,W/2,Hh/2,W*.7);gr.addColorStop(0,'#26336f');gr.addColorStop(1,'#0b1030');g.fillStyle=gr;g.fillRect(0,0,W,Hh);
 for(let i=0;i<W*Hh/900;i++){const x=rnd()*W,y=rnd()*Hh,r=rnd()<.08?2.2:rnd()*1.2+.3;g.fillStyle=`rgba(255,${230+Math.floor(rnd()*25)},${190+Math.floor(rnd()*60)},${.5+rnd()*.5})`;g.beginPath();g.arc(x,y,r,0,6.3);g.fill();}
 g.strokeStyle='rgba(216,180,90,.75)';g.lineWidth=1.5;for(let c=0;c<lines;c++){let x=W*.1+rnd()*W*.8,y=Hh*.1+rnd()*Hh*.8;g.beginPath();g.moveTo(x,y);for(let j=0;j<4;j++){x+=rnd()*60-30;y+=rnd()*60-30;g.lineTo(x,y);g.fillStyle='#fff6d0';g.fillRect(x-2,y-2,4,4);}g.stroke();}
 g.strokeStyle='rgba(216,180,90,.55)';g.lineWidth=3;g.beginPath();g.arc(W/2,Hh/2,Math.min(W,Hh)*.45,0,6.3);g.stroke();});
M.starCeil=new T.MeshBasicMaterial({map:starTex(512,512,9),side:T.DoubleSide});
M.starMap=new T.MeshBasicMaterial({map:starTex(256,160,6)});
// Painel de cortina com pregas: largo no varão, preso pela braçadeira e abrindo de novo até o chão.
// e = lado (±1), inner/outer = distância das bordas ao centro da janela no topo.
function drapeGeo(e,inner,outer,h,tie){
 const W=outer-inner,geo=new T.PlaneGeometry(1,h,22,28),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const u=p.getX(i)+.5,y=p.getY(i)+h/2,t=y/h;
  const gth=t>tie?.32+.68*Math.pow((t-tie)/(1-tie),.7):.32+.3*Math.pow((tie-t)/tie,1.2);
  const x=e*(outer-u*W*gth),amp=.035+.08*(1-gth);
  p.setXYZ(i,x,y-h/2,.12+Math.sin(u*Math.PI*7)*amp+.03*Math.sin(t*3+u*5));}
 geo.computeVertexNormals();return geo;}
function valanceGeo(len){
 const geo=new T.PlaneGeometry(len,.6,48,6),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const u=p.getX(i),y=p.getY(i),t=(y+.3)/.6,drop=.22*(1-Math.abs(Math.sin((u/len+.5)*Math.PI*3)));
  p.setXYZ(i,u,y-(1-t)*drop,.18+.06*(1-t)*Math.cos((u/len+.5)*Math.PI*6));}
 geo.computeVertexNormals();return geo;}


// ---------- Peças ----------
function boxUV(geo,w,h,d,tile){const uv=geo.attributes.uv,F=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];for(let f=0;f<6;f++)for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,uv.getX(i)*F[f][0]/tile,uv.getY(i)*F[f][1]/tile);}return geo;}
function box(g,w,h,d,m,x,y,z,ry=0,tile=4){const mm=new T.Mesh(boxUV(new T.BoxGeometry(w,h,d),w,h,d,tile),m);mm.position.set(x,y,z);mm.rotation.y=ry;g.add(mm);return mm;}
function cyl(g,r1,r2,h,m,x,y,z,seg=16,tile=4){const geo=new T.CylinderGeometry(r1,r2,h,seg),uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*2*Math.PI*Math.max(r1,r2)/tile,uv.getY(i)*h/tile);const mm=new T.Mesh(geo,m);mm.position.set(x,y+h/2,z);g.add(mm);return mm;}
function pyramid(g,w,d,h,m,x,y,z){const geo=new T.ConeGeometry(Math.SQRT1_2,1,4,1);geo.rotateY(Math.PI/4);const mm=new T.Mesh(geo,m);mm.scale.set(w,h,d);mm.position.set(x,y+h/2,z);g.add(mm);return mm;}
function prismX(g,len,w,h,m,x,y,z){const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,h);s.lineTo(-w/2,0);const geo=new T.ExtrudeGeometry(s,{depth:len,bevelEnabled:false});geo.translate(0,0,-len/2);geo.rotateY(Math.PI/2);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/3,uv.getY(i)/3);const mm=new T.Mesh(geo,m);mm.position.set(x,y,z);g.add(mm);return mm;}
function prismZ(g,len,w,h,m,x,y,z){const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,h);s.lineTo(-w/2,0);const geo=new T.ExtrudeGeometry(s,{depth:len,bevelEnabled:false});geo.translate(0,0,-len/2);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/3,uv.getY(i)/3);const mm=new T.Mesh(geo,m);mm.position.set(x,y,z);g.add(mm);return mm;}
function crenels(g,x0,x1,z0,z1,y,step=1.6){for(let x=x0;x<=x1+1e-3;x+=step){box(g,.8,1,.6,M.wall,x,y+.5,z0);box(g,.8,1,.6,M.wall,x,y+.5,z1);}for(let z=z0+step;z<=z1-step+1e-3;z+=step){box(g,.6,1,.8,M.wall,x0,y+.5,z);box(g,.6,1,.8,M.wall,x1,y+.5,z);}}
function squareTower(g,x,z,s,h){box(g,s+.6,2,s+.6,M.base,x,1,z);box(g,s,h,s,M.wall,x,h/2,z);for(const y of [h*.35,h*.7])box(g,s+.3,.5,s+.3,M.trim,x,y,z);box(g,s+.6,.7,s+.6,M.trim,x,h-.35,z);crenels(g,x-s/2,x+s/2,z-s/2,z+s/2,h,1.4);
 for(let lv=0;lv<Math.floor(h/6.5);lv++)for(const [dx,dz,r] of [[0,s/2+.02,0],[0,-s/2-.02,0],[s/2+.02,0,Math.PI/2],[-s/2-.02,0,Math.PI/2]])box(g,.8,1.8,.1,M.winTile||M.glass,x+dx,3.5+lv*6.5,z+dz,r,1);
 pyramid(g,s+1,s+1,s*.95,M.slate,x,h+1,z);box(g,.3,1.4,.3,M.copper,x,h+1+s*.95+.7,z);}
function mergeInto(group,parent,name){
 group.updateMatrixWorld(true);const buckets=new Map();
 group.traverse(o=>{if(!o.isMesh)return;let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(!buckets.has(o.material))buckets.set(o.material,[]);buckets.get(o.material).push(g);});
 for(const [m,list] of buckets){let n=0;for(const g of list)n+=g.attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2);let off=0;
  for(const g of list){P.set(g.attributes.position.array,off*3);if(g.attributes.normal)N.set(g.attributes.normal.array,off*3);U.set(g.attributes.uv.array.subarray(0,g.attributes.position.count*2),off*2);off+=g.attributes.position.count;g.dispose();}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(P,3));geo.setAttribute('normal',new T.BufferAttribute(N,3));geo.setAttribute('uv',new T.BufferAttribute(U,2));geo.computeBoundingSphere();
  const mesh=new T.Mesh(geo,m);mesh.name=name;mesh.castShadow=m!==M.glass&&m!==M.winTile&&m!==M.winOut&&m!==M.candle&&m!==M.core&&m!==M.fire;mesh.receiveShadow=true;parent.add(mesh);}
}

// ---------- Metal de verdade (matcap: reflexo de céu/horizonte/chão pintado) ----------
// Sem luzes nem mapa de ambiente: a "bola de reflexo" faz o aço brilhar com faixa de
// horizonte, realce duro (estilo anime) e luz de contorno azulada.
function matcapTex(kind){
 // Metal estilo anime: 6 degraus de luz em uma única família de cor (sombra -> brilho),
 // faixa de horizonte escura, luz de cima à esquerda e brilho duro.
 const RAMP={steel:['#1e2640','#3b496c','#687ba1','#a0b2d0','#d6e1f1','#ffffff'],dark:['#12162a','#262f4e','#46567f','#6f81a8','#9eafcf','#eef3ff'],
  gold:['#3a230f','#7b4d1a','#bf892c','#e8b94a','#f6db84','#fff5cc'],brass:['#2e1c0f','#6a4325','#a66e3c','#d29a5a','#ebc48a','#fff0d4']}[kind];
 const rgb=RAMP.map(h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]);
 const S=256,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d'),img=g.createImageData(S,S);
 const lx=-.45,ly=.62,lz=.64,ll=Math.hypot(lx,ly,lz);
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){
  const nx=(x+.5)/S*2-1,ny=1-(y+.5)/S*2,r2=nx*nx+ny*ny,k=(y*S+x)*4;
  if(r2>1){img.data[k+3]=0;continue;}
  const nz=Math.sqrt(1-r2);
  let v=.22+.62*Math.max(0,(nx*lx+ny*ly+nz*lz)/ll);        // luz principal
  v+=.14*Math.max(0,ny);                                    // reflexo do céu
  if(Math.abs(ny-.04)<.055)v-=.26;                          // linha do horizonte
  if(ny<-.25)v-=.08;                                        // chão escuro refletido
  v+=.20*Math.pow(1-nz,3);                                  // luz de contorno
  const hx=nx+.38,hy=ny-.46;if(Math.hypot(hx,hy)<.1)v=1.2;  // brilho duro
  const q=Math.max(0,Math.min(5,Math.floor(v*5.4)));
  img.data[k]=rgb[q][0];img.data[k+1]=rgb[q][1];img.data[k+2]=rgb[q][2];img.data[k+3]=255;
 }
 g.putImageData(img,0,0);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
}
const metal=k=>new T.MeshMatcapMaterial({matcap:matcapTex(k),side:T.DoubleSide,fog:false});
M.steel=metal('steel');M.steelDark=metal('dark');M.goldM=metal('gold');M.brass=metal('brass');
M.plume=mat({color:'#b8302a',side:T.DoubleSide});M.leather=mat({color:'#5a3a22'});
M.eyeGlow=mat({color:'#9fe6ff',emissive:new T.Color('#5fd2ff'),emissiveIntensity:1.6});

// ---------- Armadura completa em camadas de aço ----------
// Frente = +z; pé na altura 0; ~2 m de altura. variant: 0 espada, 1 alabarda, 2 escudo e maça.
function limb(a,A,B,r0,r1,m,seg=12){
 const d=new T.Vector3().subVectors(B,A),L=d.length();
 const mesh=new T.Mesh(new T.CylinderGeometry(r1,r0,L,seg,1),m);
 mesh.position.copy(A).addScaledVector(d,.5);
 mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());a.add(mesh);return mesh;
}
const V3=(x,y,z)=>new T.Vector3(x,y,z);
function lathe(a,pts,m,x,y,z,sx=1,sz=1,seg=18){
 const mesh=new T.Mesh(new T.LatheGeometry(pts.map(p=>new T.Vector2(p[0],p[1])),seg),m);mesh.position.set(x,y,z);mesh.scale.set(sx,1,sz);a.add(mesh);return mesh;
}
function ball(a,r,m,x,y,z,sx=1,sy=1,sz=1){const s=new T.Mesh(new T.SphereGeometry(r,14,10),m);s.position.set(x,y,z);s.scale.set(sx,sy,sz);a.add(s);return s;}
function ring(a,r,tube,m,x,y,z,rx=Math.PI/2){const t=new T.Mesh(new T.TorusGeometry(r,tube,6,22),m);t.position.set(x,y,z);t.rotation.x=rx;a.add(t);return t;}
function armorModel(variant){
 const a=new T.Group(),S=M.steel,D=M.steelDark,G=M.goldM;
 // Pedestal de pedra com friso dourado.
 box(a,1.0,.2,1.0,M.base,0,.1,0,0,2);box(a,.86,.1,.86,M.trim,0,.25,0,0,2);box(a,.9,.03,.9,G,0,.31,0);
 const yb=.32;
 for(const s of [-1,1]){
  const fx=s*.17;
  // Botas: casco + biqueira pontuda + 3 lâminas sobrepostas sobre o peito do pé.
  lathe(a,[[0,0],[.095,0],[.108,.04],[.1,.14],[.085,.2],[0,.2]],S,fx,yb,0,1,1.25);
  ball(a,.075,S,fx,yb+.06,.14,.95,.7,1.7);
  for(let i=0;i<3;i++)ball(a,.07-i*.006,D,fx,yb+.075+i*.025,.07+i*.035,1,.28,1.1);
  // Grevas: perna em dois tubos (canela larga + barra frontal) com nervura.
  limb(a,V3(fx,yb+.2,0),V3(fx,yb+.6,0),.08,.098,S);
  box(a,.035,.4,.03,D,fx,yb+.4,.095);
  // Joelheira: cúpula + disco + espinho.
  ball(a,.108,S,fx,yb+.66,.025,1.05,.95,1.05);
  const sp=new T.Mesh(new T.ConeGeometry(.026,.09,8),G);sp.rotation.x=Math.PI/2;sp.position.set(fx,yb+.66,.15);a.add(sp);
  // Coxotes: placas em anéis encaixados.
  limb(a,V3(fx,yb+.72,0),V3(fx,yb+1.08,0),.1,.12,S);
 }
 // Tassetes: saia de 4 camadas escalonadas + cinto dourado.
 for(let i=0;i<4;i++){
  const tc=new T.Mesh(new T.CylinderGeometry(.215+i*.003,.255+i*.012,.15,20,1,true),i%2?D:S);tc.position.y=yb+1.0-i*.065+.1;tc.rotation.x=.04;a.add(tc);
 }
 ring(a,.225,.026,G,0,yb+1.2,0);ball(a,.04,G,0,yb+1.2,.225);
 // Peitoral: casco em duas camadas (ventre + tórax) com quilha central e friso.
 lathe(a,[[.19,0],[.205,.1],[.225,.2],[.235,.3],[.215,.4],[.16,.47],[.115,.5]],S,0,yb+1.2,0,1,.8,22);
 lathe(a,[[.205,0],[.215,.045],[.205,.1]],D,0,yb+1.2,0,1.01,.84,22);
 const keel=box(a,.022,.36,.04,G,0,yb+1.55,.19);keel.rotation.x=-.12;
 for(const s of [-1,1])ball(a,.09,S,s*.095,yb+1.58,.12,1.15,1,.8);
 ring(a,.17,.014,G,0,yb+1.66,.0,Math.PI/2);
 // Gorjal: 3 anéis.
 for(let i=0;i<3;i++)lathe(a,[[.105+i*.006,0],[.115+i*.006,.03]],i%2?D:S,0,yb+1.66+i*.03,0);
 // Ombreiras: 4 lâminas que se sobrepõem, a de cima com aro dourado.
 for(const s of [-1,1]){
  for(let i=0;i<4;i++){
   const sh=new T.Mesh(new T.SphereGeometry(.17-i*.014,16,8,0,Math.PI*2,0,Math.PI*.52),i%2?D:S);
   sh.position.set(s*(.285+i*.012),yb+1.7-i*.055,0);sh.rotation.z=-s*(.35+i*.06);sh.scale.set(1,.62,1.12);a.add(sh);
  }
  const rim=ring(a,.15,.014,G,s*.285,yb+1.7,0,Math.PI/2);rim.rotation.z=-s*.35;rim.rotation.x=Math.PI/2;
 }
 // Braços: braçal, cotoveleira, antebraço com 2 anéis, manoplas.
 const hands=[];
 const W=variant===1?[V3(.52,yb+1.12,.3),V3(-.3,yb+1.02,.16)]:variant===2?[V3(.44,yb+1.1,.26),V3(-.2,yb+1.14,.3)]:[V3(.07,yb+1.17,.35),V3(-.07,yb+1.17,.35)];
 [1,-1].forEach((s,i)=>{
  const sh=V3(s*.31,yb+1.62,0),el=V3(s*(variant===1&&s<0?.4:.37),yb+1.36,.08),wr=W[i];
  limb(a,sh,el,.062,.054,S);ball(a,.07,S,el.x,el.y,el.z+.015,1,1,1.1);
  limb(a,el,wr,.058,.048,S);
  // Manopla: palma + 4 dedos articulados + polegar.
  const hg=new T.Group();hg.position.copy(wr);a.add(hg);
  box(hg,.075,.06,.085,S,0,0,0,0,1);
  for(let f=0;f<4;f++)box(hg,.016,.016,.06,D,-.027+f*.018,.012,.07,0,1);
  box(hg,.016,.016,.04,D,s*.045,-.005,.03,0,1);
  hands.push(wr);
 });
 // Elmo: casco em 2 peças + viseira com fendas + gola + crista com penacho.
 const hy=yb+1.76;
 lathe(a,[[.118,0],[.128,.05],[.126,.12],[.1,.19],[.055,.23],[0,.245]],S,0,hy,0,1.3,1.36,24);
 lathe(a,[[.131,.0],[.131,.06]],D,0,hy-.0,0,1.3,1.38,24);
 const visor=box(a,.27,.1,.045,D,0,hy+.075,.175,0,1);visor.rotation.x=-.1;
 for(let i=0;i<3;i++)box(a,.2,.012,.012,M.iron,0,hy+.09-i*.0,.2,0,1).position.y=hy+.1-i*.02;
 for(const s of [-1,1]){const ch=box(a,.05,.14,.2,S,s*.145,hy+.0,.1,0,1);ch.rotation.y=-s*.18;}
 const chin=box(a,.2,.08,.055,D,0,hy-.03,.17,0,1);chin.rotation.x=.25;
 ring(a,.165,.013,G,0,hy+.01,0);
 box(a,.035,.085,.4,G,0,hy+.28,0,0,1);
 // Penacho caindo para trás: 5 gomos.
 for(let i=0;i<5;i++)ball(a,.05-i*.003,M.plume,0,hy+.3-i*.045,-.17-i*.06,.8,1.2,1.1);
 // Arma (muda por variante).
 if(variant===0){
  // Espada fincada no pedestal, mãos no punho.
  const bz=.35;box(a,.07,1.05,.014,S,0,yb+.55,bz,0,1);box(a,.014,1.0,.016,D,0,yb+.55,bz+.004,0,1);
  const tip=new T.Mesh(new T.ConeGeometry(.0495,.14,4),S);tip.rotation.y=Math.PI/4;tip.scale.set(1,1,.2);tip.position.set(0,yb-.02,bz);tip.rotation.x=Math.PI;a.add(tip);
  box(a,.34,.03,.04,G,0,yb+1.1,bz,0,1);ball(a,.032,G,.17,yb+1.1,bz);ball(a,.032,G,-.17,yb+1.1,bz);
  limb(a,V3(0,yb+1.12,bz),V3(0,yb+1.3,bz),.022,.022,M.leather,8);ball(a,.04,G,0,yb+1.33,bz);
 }else if(variant===1){
  // Alabarda: haste de madeira com anéis, lâmina em meia-lua, ponta e gancho.
  const px=.52,pz=.3;limb(a,V3(px,yb,pz),V3(px,yb+2.35,pz),.022,.022,M.woodDark,8);
  for(const yy of [.6,1.3,2.0])ring(a,.026,.01,G,px,yb+yy,pz,Math.PI/2);
  const sp=new T.Mesh(new T.ConeGeometry(.04,.34,4),S);sp.position.set(px,yb+2.5,pz);sp.rotation.y=Math.PI/4;sp.scale.set(1,1,.35);a.add(sp);
  const blade=new T.Mesh(new T.CylinderGeometry(.22,.22,.025,20,1,false,Math.PI*.1,Math.PI*.8),S);blade.rotation.set(Math.PI/2,0,-Math.PI/2);blade.position.set(px+.1,yb+2.15,pz);a.add(blade);
  box(a,.03,.2,.015,D,px-.03,yb+2.15,pz,0,1);const hook=box(a,.03,.14,.02,S,px-.07,yb+2.2,pz,0,1);hook.rotation.z=.5;
  ball(a,.035,G,px,yb+2.3,pz);
 }else{
  // Escudo de brasão (camadas) + maça de cabeça com espigões.
  const sx=-.34,sz=.28;
  const shield=new T.Mesh(new T.CylinderGeometry(.27,.1,.05,6,1),S);shield.rotation.set(Math.PI/2,0,0);shield.scale.set(1,1,1.5);shield.position.set(sx,yb+1.2,sz);a.add(shield);
  const sh2=shield.clone();sh2.material=D;sh2.scale.set(.82,1,1.28);sh2.position.z=sz+.03;a.add(sh2);
  box(a,.06,.4,.02,G,sx,yb+1.2,sz+.062,0,1);box(a,.3,.06,.02,G,sx,yb+1.28,sz+.062,0,1);
  ball(a,.045,G,sx,yb+1.28,sz+.075);
  limb(a,V3(.44,yb+.45,.26),V3(.44,yb+1.3,.26),.02,.02,M.woodDark,8);
  ball(a,.07,S,.44,yb+1.36,.26);
  for(let i=0;i<8;i++){const t=i/8*Math.PI*2,sp=new T.Mesh(new T.ConeGeometry(.018,.07,6),D);sp.position.set(.44+Math.cos(t)*.07,yb+1.36,.26+Math.sin(t)*.07);sp.rotation.z=-Math.cos(t)*Math.PI/2;sp.rotation.x=Math.sin(t)*Math.PI/2;a.add(sp);}
  const top=new T.Mesh(new T.ConeGeometry(.02,.08,6),D);top.position.set(.44,yb+1.46,.26);a.add(top);
 }

 const ink=new T.MeshBasicMaterial({color:'#2a2038',side:T.BackSide});const parts=[];a.traverse(o=>{if(o.isMesh)parts.push(o);});
 for(const m of parts){const o=new T.Mesh(m.geometry,ink);o.position.copy(m.position);o.quaternion.copy(m.quaternion);o.scale.copy(m.scale).multiplyScalar(1.09);m.parent.add(o);}
 return a;
}

// ---------- Vida do castelo: chamas, raios de luz, poeira e tapeçarias ----------
const LIFE={flames:[],shafts:[],dust:[],t0:performance.now()};
const flameTex=(()=>{const c=document.createElement('canvas');c.width=64;c.height=128;const g=c.getContext('2d');
 // gota de fogo: núcleo branco-amarelo, miolo laranja, borda vermelha que some
 for(const [r,col,sy] of [[30,'rgba(255,60,10,0)',1],[26,'rgba(255,92,18,.55)',1],[19,'rgba(255,160,40,.85)',.98],[11,'rgba(255,225,120,1)',.95],[5,'rgba(255,255,230,1)',.9]]){
  g.fillStyle=col;g.beginPath();g.moveTo(32,6);g.bezierCurveTo(32+r*1.1,50,32+r,96,32,122);g.bezierCurveTo(32-r,96,32-r*1.1,50,32,6);g.fill();}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;})();
const flameMat=new T.SpriteMaterial({map:flameTex,transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false});
const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(32,32,0,32,32,32);
 gr.addColorStop(0,'rgba(255,190,90,.65)');gr.addColorStop(.4,'rgba(255,140,50,.22)');gr.addColorStop(1,'rgba(255,120,40,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;})();
const glowMat=new T.SpriteMaterial({map:glowTex,transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false});
const shaftTex=(()=>{const c=document.createElement('canvas');c.width=32;c.height=128;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,0,128);
 gr.addColorStop(0,'rgba(255,240,200,.9)');gr.addColorStop(.5,'rgba(255,236,190,.35)');gr.addColorStop(1,'rgba(255,230,180,0)');g.fillStyle=gr;g.fillRect(0,0,32,128);
 const gx=g.createLinearGradient(0,0,32,0);gx.addColorStop(0,'rgba(0,0,0,.9)');gx.addColorStop(.25,'rgba(0,0,0,0)');gx.addColorStop(.75,'rgba(0,0,0,0)');gx.addColorStop(1,'rgba(0,0,0,.9)');g.globalCompositeOperation='destination-out';g.fillStyle=gx;g.fillRect(0,0,32,128);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;})();
function tapestryTex(i){return canvasTex(128,256,(g,w,h)=>{
 const hue=[350,215,150,40][i%4];g.fillStyle=`hsl(${hue},48%,32%)`;g.fillRect(0,0,w,h);
 g.fillStyle=`hsl(${hue},55%,22%)`;g.fillRect(0,0,10,h);g.fillRect(w-10,0,10,h);
 g.strokeStyle='#d8b45a';g.lineWidth=5;g.strokeRect(14,14,w-28,h-28);g.lineWidth=2;g.strokeRect(24,24,w-48,h-48);
 // brasão: escudo, estrela de 8 pontas e asas
 g.fillStyle='#e9cf86';g.beginPath();g.moveTo(w/2,70);g.lineTo(w/2+34,86);g.lineTo(w/2+30,140);g.quadraticCurveTo(w/2,176,w/2-30,140);g.lineTo(w/2-34,86);g.closePath();g.fill();
 g.fillStyle=`hsl(${hue},55%,28%)`;g.beginPath();g.moveTo(w/2,82);g.lineTo(w/2+25,94);g.lineTo(w/2+22,136);g.quadraticCurveTo(w/2,162,w/2-22,136);g.lineTo(w/2-25,94);g.closePath();g.fill();
 g.fillStyle='#f6e7b0';g.save();g.translate(w/2,116);for(let k=0;k<8;k++){g.rotate(Math.PI/4);g.beginPath();g.moveTo(0,-4);g.lineTo(5,-20);g.lineTo(-5,-20);g.closePath();g.fill();}g.restore();
 g.fillStyle='#d8b45a';for(let x=18;x<w-14;x+=11){g.beginPath();g.moveTo(x,h-14);g.lineTo(x+5,h-4);g.lineTo(x+10,h-14);g.fill();}});}
const TAPEST=[0,1,2,3].map(tapestryTex);
const tapMats=TAPEST.map(t=>new T.MeshBasicMaterial({map:t,side:T.DoubleSide,fog:false}));
function addLife(inn,k,y0,H,FL,torches){
 // Chamas (sprites aditivos que tremulam) + brilho quente em volta.
 for(const [x,y,z,sc] of FL){
  const s=new T.Sprite(flameMat);s.position.set(x,y,z);s.scale.set(.2*sc,.32*sc,1);s.center.set(.5,.12);inn.add(s);
  const gl=new T.Sprite(glowMat);gl.position.set(x,y+.05*sc,z);gl.scale.setScalar(.9*sc+.4);inn.add(gl);
  LIFE.flames.push({s,gl,sc,ph:Math.random()*6.28,sp:9+Math.random()*5});
 }
 // Raios de luz entrando pelas janelas laterais (somem à noite).
 for(const side of [-1,1])for(const lz of [-12,-6,0,5]){
  const wx=side*(BX-.55),yTop=y0+4.4,yBot=y0+.45,len=5.0,hw=.75;
  const x1=wx-side*len;                    // o raio cai em diagonal para dentro
  const pos=new Float32Array([wx,yTop,lz-hw,  wx,yTop,lz+hw,  x1,yBot,lz+hw*1.9,  x1,yBot,lz-hw*1.9]);
  const uv=new Float32Array([0,0, 1,0, 1,1, 0,1]);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('uv',new T.BufferAttribute(uv,2));geo.setIndex([0,1,2,0,2,3]);
  const m=new T.MeshBasicMaterial({map:shaftTex,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,fog:false,toneMapped:false,opacity:.38});
  const mesh=new T.Mesh(geo,m);mesh.frustumCulled=false;mesh.renderOrder=6;inn.add(mesh);LIFE.shafts.push({m,base:.38,ph:Math.random()*6});
 }
 // Poeira flutuando nos raios de luz do salão central.
 {const N=70,pp=new Float32Array(N*3);for(let i=0;i<N;i++){pp[i*3]=(Math.random()*2-1)*5;pp[i*3+1]=y0+.6+Math.random()*4.2;pp[i*3+2]=-14+Math.random()*20;}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pp,3));
  const pt=new T.Points(g,new T.PointsMaterial({color:'#fff0c8',size:.07,transparent:true,opacity:.65,blending:T.AdditiveBlending,depthWrite:false,fog:false,sizeAttenuation:true,map:glowTex}));
  pt.frustumCulled=false;inn.add(pt);LIFE.dust.push({pt,y0,N});}
 // Tapeçarias penduradas por varão dourado (andares de cima, nas duas faces do salão).
 if(k>0)for(const sx of [-1,1]){
  const tp=new T.Group();tp.position.set(sx*5.62,y0+.4+3.5,-6.8);tp.rotation.y=-sx*Math.PI/2;
  const pl=new T.Mesh(new T.PlaneGeometry(1.5,3.2),tapMats[(k+(sx>0?1:0))%4]);pl.position.set(0,-.1,.03);tp.add(pl);
  const rod=new T.Mesh(new T.CylinderGeometry(.04,.04,1.8,8),M.goldM);rod.rotation.z=Math.PI/2;rod.position.set(0,1.55,.05);tp.add(rod);
  for(const e of [-1,1]){const kn=new T.Mesh(new T.SphereGeometry(.07,8,6),M.goldM);kn.position.set(e*.92,1.55,.05);tp.add(kn);}
  inn.add(tp);
 }
}
function updateLife(now){
 const t=(now-LIFE.t0)/1000;
 const sky=window.arcanoAnimeSky&&window.arcanoAnimeSky.material&&window.arcanoAnimeSky.material.uniforms.uSunDir.value;
 const night=sky?Math.min(1,Math.max(0,(-sky.y+.02)/.2)):0;
 for(const f of LIFE.flames){
  const fl=.85+.15*Math.sin(t*f.sp+f.ph)+.08*Math.sin(t*f.sp*2.3+f.ph*2);
  f.s.scale.set(.2*f.sc*(.9+.1*Math.sin(t*f.sp*1.7+f.ph)),.32*f.sc*fl,1);
  f.gl.material.opacity=1;f.gl.scale.setScalar((.9*f.sc+.4)*(.92+.08*Math.sin(t*f.sp*.7+f.ph)));
 }
 const day=1-night;for(const s of LIFE.shafts)s.m.opacity=s.base*day*(.8+.2*Math.sin(t*.6+s.ph));
 for(const d of LIFE.dust){const a=d.pt.geometry.attributes.position.array;for(let i=0;i<d.N;i++){a[i*3]+=Math.sin(t*.3+i)*.0016;a[i*3+1]+=Math.sin(t*.5+i*1.7)*.0012+.0005;a[i*3+2]+=Math.cos(t*.27+i*.6)*.0016;if(a[i*3+1]>d.y0+4.9)a[i*3+1]=d.y0+.6;}d.pt.geometry.attributes.position.needsUpdate=true;}
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
 for(const [x,z] of [[-BX,BZ1],[BX,BZ1],[-BX,BZ0],[BX,BZ0]]){squareTower(ext,x,z,6,TOP+8);obsBox(x,z,3.15,3.15);}
 // Contrafortes nas laterais.
 for(const sx of [-1,1])for(let z=BZ0+5;z<=BZ1-4;z+=6){box(ext,1.4,TOP*.75,1.4,M.wall,sx*(BX+.9),TOP*.375,z);pyramid(ext,1.6,1.6,1.4,M.slate,sx*(BX+.9),TOP*.75,z);}
 // Campanário atrás, com o núcleo dentro do sino.
 const BZB=-23;
 {box(ext,11,2,11,M.base,0,1,BZB);box(ext,10,44,10,M.wall,0,22,BZB);for(const y of [13,26,39])box(ext,10.5,.6,10.5,M.trim,0,y,BZB);
  for(let lv=0;lv<6;lv++)for(const [dx,dz,r] of [[0,5.02,0],[5.02,0,Math.PI/2],[-5.02,0,Math.PI/2],[0,-5.02,0]])box(ext,1,2.2,.1,M.winTile||M.glass,dx,4+lv*6.5,BZB+dz,r,1);
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
 // Laje de teto do térreo (só de fora): sem ela se veria o telhado por baixo pela porta.
 const lid=new T.Mesh(boxUV(new T.BoxGeometry(2*BX-1,.4,BZ1-BZ0-1),2*BX-1,.4,BZ1-BZ0-1,3),M.dark);lid.position.set(0,Fy(1)-.2,(BZ0+BZ1)/2);root.add(lid);
 {const r=new T.Group();
  box(r,2*BX+.6,.8,BZ1-BZ0+.6,M.trim,0,TOP+.4,(BZ0+BZ1)/2);
  prismX(r,2*BX-4,BZ1-BZ0+1.2,9,M.slate,0,TOP+.8,(BZ0+BZ1)/2);
  prismZ(r,6,9,6.5,M.slate,0,TOP+.8,BZ1-2);box(r,1.6,2.2,.2,M.winTile||M.glass,0,TOP+2.4,BZ1+.92,0,1);
  for(const sx of [-1,1]){prismZ(r,3,3.4,2.6,M.slate,sx*8,TOP+5,BZ1-4);box(r,2.6,2.6,1,M.wall,sx*8,TOP+3.8,BZ1-3.2);box(r,1,1.6,.1,M.winTile||M.glass,sx*8,TOP+3.9,BZ1-2.65,0,1);}
  mergeInto(r,roof,'Telhado do castelo');}

 // ===== Mobília de cada andar =====
 function furnish(g,k,y0,H,FL){
  const Y=y=>y0+y;
  const F=.4;   // altura do piso acima de y0
  // Colisão dos móveis (só neste andar).
  const solid=(x,z,w,d,rot=0)=>{const sw=Math.abs(Math.sin(rot))>.5;obsBox(x,z,(sw?d:w)/2+.05,(sw?w:d)/2+.05,k);};
  // Estante com livros de verdade: lombadas de cores, alturas e larguras variadas, alguns inclinados.
  const shelf=(x,z,w,h,rot=0)=>{
   const c=Math.cos(rot),s=Math.sin(rot),P=(a,b)=>[x+a*c+b*s,z-a*s+b*c];
   {const [px,pz]=P(0,-.22);box(g,w,h,.06,M.woodDark,px,Y(F+h/2),pz,rot,2);}
   for(const e of [-1,1]){const [px,pz]=P(e*(w/2-.04),0);box(g,.08,h,.5,M.woodDark,px,Y(F+h/2),pz,rot,2);}
   box(g,w+.1,.1,.55,M.woodDark,x,Y(F+h+.05),z,rot,2);
   for(let yy=.1;yy<h-.3;yy+=.9){
    box(g,w-.1,.06,.48,M.wood,x,Y(F+yy),z,rot,2);
    let a=-w/2+.12;
    while(a<w/2-.2){const bw=.07+rnd()*.09,bh=.48+rnd()*.28,lean=rnd()<.08&&a>-w/2+.4&&a<w/2-.5;
     if(rnd()<.06){a+=.15;continue;}
     const [px,pz]=P(a+bw/2,.02);const b=box(g,bw,bh,.34,M.book[Math.floor(rnd()*M.book.length)],px,Y(F+yy+.03+bh/2),pz,rot,1);
     if(lean)b.rotation.z=.16;
     if(rnd()<.6){const [qx,qz]=P(a+bw/2,.192);box(g,bw+.005,.035,.005,M.gold,qx,Y(F+yy+.03+bh*.78),qz,rot,1);box(g,bw+.005,.035,.005,M.gold,qx,Y(F+yy+.03+bh*.22),qz,rot,1);}
     a+=bw+.005;}
   }
   solid(x,z,w,.5,rot);
  };
  const table=(x,z,w,d,h=.85,m=M.wood)=>{box(g,w,.12,d,m,x,Y(F+h),z,0,2);for(const sx of [-1,1])for(const sz of [-1,1])box(g,.12,h,.12,M.woodDark,x+sx*(w/2-.15),Y(F+h/2),z+sz*(d/2-.15));solid(x,z,w,d);};
  const chair=(x,z,r=0)=>{box(g,.5,.08,.5,M.wood,x,Y(F+.48),z,r,2);box(g,.5,.7,.08,M.wood,x-Math.sin(r)*.22,Y(F+.85),z-Math.cos(r)*.22,r,2);for(const sx of [-1,1])for(const sz of [-1,1])box(g,.06,.46,.06,M.woodDark,x+sx*.2,Y(F+.23),z+sz*.2);};
  const candle=(x,y,z)=>{box(g,.08,.25,.08,M.candle,x,Y(y+.12),z);box(g,.2,.05,.2,M.gold,x,Y(y),z);FL.push([x,Y(y+.25),z,.45]);};
  // Tocha de parede presa na coluna: braço de ferro, copo e chama.
  const torch=(x,z,dx)=>{box(g,.3,.05,.05,M.iron,x-dx*.15,Y(2.35),z);box(g,.05,.5,.05,M.woodDark,x,Y(2.3),z);cyl(g,.09,.06,.14,M.iron,x,Y(2.78),z,8);FL.push([x,Y(2.98),z,1.1]);};
  // Tapete com franjas, um pouco acima do piso (sem cortar nem piscar).
  const rug=(x,z,w,d)=>{box(g,w,.035,d,M.rug,x,Y(F+.02),z,0,w);for(const e of [-1,1])for(let a=-w/2+.1;a<w/2;a+=.16)box(g,.04,.015,.16,M.cloth,x+a,Y(F+.012),z+e*(d/2+.07));};
  const bed=(x,z,rot=0,canopy=false)=>{box(g,2,.5,2.6,M.woodDark,x,Y(.65),z,rot,2);box(g,1.9,.25,2.5,M.cloth,x,Y(1),z,rot);box(g,1.9,.12,1.5,M.velvet,x,Y(1.18),z+.5,rot);box(g,1.4,.25,.45,M.cloth,x,Y(1.2),z-1,rot);box(g,2.1,1.8,.2,M.woodDark,x,Y(1.3),z-1.35,rot,2);
   if(canopy){for(const sx of [-1,1])for(const sz of [-1,1])box(g,.15,3,.15,M.woodDark,x+sx*.95,Y(1.9),z+sz*1.25);box(g,2.2,.15,2.8,M.velvet,x,Y(3.4),z);for(const sx of [-1,1])box(g,.06,2.6,2.7,M.red,x+sx*1.05,Y(2.1),z);}
   solid(x,z,2.1,2.8,rot);};
  const fireplace=(x,z,rot=0)=>{box(g,3.2,3,1.2,M.base,x,Y(1.9),z,rot);box(g,2,1.4,.5,M.iron,x,Y(1.1),z+(rot?0:.4)*Math.cos(rot),rot);box(g,1.2,.6,.3,M.fire,x,Y(.9),z,rot);box(g,3.6,.3,1.4,M.trim,x,Y(3.45),z,rot);FL.push([x+Math.sin(rot)*.4,Y(1.05),z+Math.cos(rot)*.4,2.1]);FL.push([x+Math.sin(rot)*.4+.3,Y(1.0),z+Math.cos(rot)*.4,1.5]);solid(x,z,3.2,1.2,rot);};
  // Quadro com moldura dourada (paisagens, retratos, natureza-morta).
  const paint=(x,z,rot,i,w=1.6,h=1.1,y=2.9)=>{const c=Math.cos(rot),s=Math.sin(rot);box(g,w+.2,h+.2,.06,M.gold,x,Y(y),z,rot);box(g,w,h,.04,M.art[i%M.art.length],x+s*.035,Y(y),z+c*.035,rot);};
  // Cortinas de tecido dos dois lados da janela: pregas, braçadeira dourada com borla, sanefa ondulada e varão.
  const curtain=(x,z,rot,m)=>{const tie=.42,h=4.55,gp=new T.Group();gp.position.set(x,Y(0),z);gp.rotation.y=rot;g.add(gp);
   for(const e of [-1,1]){const pm=new T.Mesh(drapeGeo(e,.5,1.55,h,tie),m);pm.position.y=F+.05+h/2;gp.add(pm);
    const yt=F+.05+h*tie,tb=new T.Mesh(new T.TorusGeometry(.2,.035,6,14),M.gold);tb.rotation.x=Math.PI/2;tb.scale.set(1,.7,1);tb.position.set(e*1.38,yt,.14);gp.add(tb);
    const ts=new T.Mesh(new T.ConeGeometry(.06,.28,8),M.gold);ts.position.set(e*1.2,yt-.2,.3);gp.add(ts);}
   const va=new T.Mesh(valanceGeo(3.4),m);va.position.y=F+4.45;gp.add(va);
   const rodM=new T.Mesh(new T.CylinderGeometry(.04,.04,3.6,8),M.gold);rodM.rotation.z=Math.PI/2;rodM.position.set(0,F+4.78,.14);gp.add(rodM);
   for(const e of [-1,1]){const f=new T.Mesh(new T.SphereGeometry(.08,8,6),M.gold);f.position.set(e*1.85,F+4.78,.14);gp.add(f);}};
  let armorN=0;
  const armor=(x,z,rot,v)=>{const a=armorModel(v==null?(armorN++%3):v);a.position.set(x,Y(F),z);a.rotation.y=rot;g.add(a);solid(x,z,1.0,1.0);};
  const plant=(x,z)=>{cyl(g,.3,.24,.6,M.base,x,Y(F),z,10);const p=new T.Mesh(new T.IcosahedronGeometry(.5,1),M.leaf);p.position.set(x,Y(F+1),z);g.add(p);solid(x,z,.6,.6);};
  const chandelier=(x,z)=>{const r=new T.Mesh(new T.TorusGeometry(1.2,.1,6,20),M.gold);r.rotation.x=Math.PI/2;r.position.set(x,Y(H-.8),z);g.add(r);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;candle(x+Math.cos(a)*1.2,H-.8,z+Math.sin(a)*1.2);}box(g,.05,.8,.05,M.iron,x,Y(H-.4),z);};
  // Cortinas em todas as janelas (cor do andar) e quadros nas paredes livres.
  {const cm=M.drape[k];
   for(const lx of [-12,-8,8,12]){curtain(lx,BZ1-.5,Math.PI,cm);curtain(lx,BZ0+.5,0,cm);}
   if(k>0)for(const lx of [-3,0,3])curtain(lx,BZ1-.5,Math.PI,cm);
   for(const lz of [-12,-6,0,5]){curtain(-BX+.5,lz,Math.PI/2,cm);curtain(BX-.5,lz,-Math.PI/2,cm);}}
  if(k===0){
   // ---- Salão Principal ----
   box(g,3,.035,BZ1-BZ0-5,M.carpet,0,Y(F+.02),(BZ0+BZ1)/2+1.5,0,3);
   for(const sx of [-1,1])for(let z=BZ0+5;z<BZ1-1;z+=4){cyl(g,.45,.55,H-.4,M.trim,sx*4.2,Y(.4),z,12);box(g,1.2,.6,1.2,M.base,sx*4.2,Y(.7),z);solid(sx*4.2,z,1.2,1.2);torch(sx*3.55,z,-sx);}
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
   solid(0,tz+.4,8,4.4);
   for(const sx of [-1,1]){cyl(g,.35,.5,1.5,M.iron,sx*4.2,Y(.4),tz+1.6,10);box(g,.7,.5,.7,M.fire,sx*4.2,Y(2.1),tz+1.6);FL.push([sx*4.2,Y(2.4),tz+1.6,2.4]);box(g,1.5,5,.08,sx>0?M.blue:M.red,sx*4.6,Y(3.4),BZ0+.6);solid(sx*4.2,tz+1.6,.9,.9);}
   // Quadros grandes e armaduras ao longo do salão.
   for(const sx of [-1,1]){paint(sx*5.7,-5.5,-sx*Math.PI/2,sx>0?1:4,2.2,1.6,3.2);paint(sx*5.7,5.6,-sx*Math.PI/2,sx>0?0:6,1.6,1.2,3);armor(sx*5.2,-1,-sx*Math.PI/2);}
   // ---- Biblioteca (oeste, fundo) ----
   for(const z of [-13.2,-10.4,-7.6])shelf(-BX+.8,z,2.7,5.4,Math.PI/2);
   for(const x of [-13.4,-10.7,-8.0])shelf(x,BZ0+.8,2.6,5.4);
   shelf(-10.5,-10.2,4.5,3.4);shelf(-10.5,-7.2,4.5,3.4,Math.PI);
   table(-9,-5.4,2.4,1.2);chair(-9.6,-4.8,Math.PI);chair(-8.4,-4.8,Math.PI);candle(-9,1.3,-5.4);
   {const gl=new T.Mesh(new T.SphereGeometry(.5,14,10),M.blue);gl.position.set(-13.5,Y(1.5),-6);g.add(gl);box(g,.12,1,.12,M.woodDark,-13.5,Y(.9),-6);solid(-13.5,-6,1,1);}
   // ---- Sala de Estudos (oeste, frente) ----
   rug(-11,2,5,4);table(-11,2,2.6,1.4);chair(-11,3.1,Math.PI);chair(-11,.9,0);candle(-11,1.35,2);shelf(-BX+.8,5,3,3,Math.PI/2);fireplace(-11,BZ1-1.1,Math.PI);
   paint(-8.6,-3.7,0,2);paint(-13,-3.7,0,7,1.2,1);plant(-7,6.6);
   // ---- Hall da escada (leste, frente) ----
   plant(14.5,6.6);paint(6.3,-1.5,Math.PI/2,5,1.2,1.6);
   // ---- Refeitório (leste, fundo) ----
   table(11,-10,2,8,.9);for(let z=-13;z<=-7;z+=1.5){chair(9.6,z,Math.PI/2);chair(12.4,z,-Math.PI/2);}for(let z=-13;z<=-7;z+=2)candle(11,1.37,z);fireplace(BX-1.1,-10,-Math.PI/2);
   paint(6.3,-14.2,Math.PI/2,8,2,1.3);paint(6.3,-6.2,Math.PI/2,3,1.1,.9);
  }else if(k===1){
   // ---- Galeria (centro, frente) ----
   rug(0,2.5,3.2,5);chandelier(0,2);
   for(const sx of [-1,1]){box(g,.5,.45,1.6,M.wood,sx*3.6,Y(.62),2.5,0,2);solid(sx*3.6,2.5,.5,1.6);
    paint(sx*5.7,-1.6,-sx*Math.PI/2,sx>0?0:2,1.8,1.2);paint(sx*5.7,5.8,-sx*Math.PI/2,sx>0?6:4,1.4,1.8);}
   for(const x of [-3.5,3.5]){box(g,.7,1.1,.7,M.trim,x,Y(F+.55),6.6);const bust=new T.Mesh(new T.SphereGeometry(.3,12,10),M.cloth);bust.position.set(x,Y(F+1.45),6.6);g.add(bust);solid(x,6.6,.7,.7);}
   // ---- Sala do Conselho (centro, fundo) ----
   {const t=new T.Mesh(new T.CylinderGeometry(2.2,2.2,.15,24),M.wood);t.position.set(0,Y(1.3),-10);g.add(t);cyl(g,.35,.45,.9,M.woodDark,0,Y(.4),-10,8);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;chair(Math.cos(a)*3,-10+Math.sin(a)*3,-a-Math.PI/2);}chandelier(0,-10);solid(0,-10,4.4,4.4);}
   paint(0,BZ0+.55,0,1,3,2,3.3);box(g,1.5,5,.08,M.blue,-4.2,Y(3.4),BZ0+.6);box(g,1.5,5,.08,M.red,4.2,Y(3.4),BZ0+.6);
   // ---- Escritório (oeste, frente) ----
   rug(-11,2,4,3);table(-11,2.4,2.4,1.2);chair(-11,1.4,0);shelf(-BX+.8,2,3,4,Math.PI/2);candle(-10.4,1.35,2.4);paint(-10,-3.7,0,3);plant(-7,6.6);
   // ---- Sala de Mapas (oeste, fundo) ----
   table(-11,-10,3.2,2.2);box(g,3,.02,2,M.cloth,-11,Y(1.33),-10);{const gl=new T.Mesh(new T.SphereGeometry(.45,14,10),M.blue);gl.position.set(-13.8,Y(1.4),-13.8);g.add(gl);solid(-13.8,-13.8,1,1);}
   paint(-6.3,-7.2,-Math.PI/2,0,2.4,1.6);paint(-6.3,-12.5,-Math.PI/2,6,1.2,1);
   // ---- Arsenal (leste, fundo) ----
   for(let z=-13.5;z<-6;z+=1.6){box(g,.15,2,.15,M.woodDark,BX-1,Y(1.4),z);box(g,.1,1.6,.6,M.steel,BX-1.3,Y(1.6),z);}solid(BX-1.1,-9.8,.8,8);
   for(const x of [8,10])armor(x,-13.5,0);armor(12.5,-6,-Math.PI/2);
   plant(14.5,6.6);
  }else if(k===2){
   // ---- Salão de Música (centro, frente) ----
   box(g,2.2,1,1.2,M.woodDark,-1.5,Y(.9),3,0,2);box(g,2.2,.06,.4,M.cloth,-1.5,Y(1.42),3.5);chair(-1.5,4.3,Math.PI);solid(-1.5,3,2.2,1.2);
   box(g,.2,2.2,1.2,M.gold,2,Y(1.5),2);solid(2,2,.4,1.2);rug(0,2,4.6,3.6);chandelier(0,2);
   for(const sx of [-1,1])paint(sx*5.7,0,-sx*Math.PI/2,sx>0?2:5,1.6,1.2);
   // ---- Capela (centro, fundo) ----
   box(g,3,1.1,1.2,M.trim,0,Y(.95),-14);for(const x of [-1,0,1])candle(x,1.5,-14);solid(0,-14,3,1.2);
   for(let z=-11;z<=-6;z+=1.6)for(const sx of [-1,1]){box(g,2.6,.45,.6,M.wood,sx*2,Y(.62),z,0,2);solid(sx*2,z,2.6,.6);}
   box(g,2.4,3.2,.08,M.glass,0,Y(3.6),BZ0+.55);box(g,2.7,3.5,.06,M.gold,0,Y(3.6),BZ0+.52);
   // ---- Quarto Real (oeste, frente) ----
   bed(-11,1.5,0,true);rug(-11,4.6,3.6,1.8);box(g,1.6,2.4,.7,M.wood,-14.2,Y(1.6),-1,Math.PI/2,2);solid(-14.2,-1,1.6,.7,Math.PI/2);candle(-13.6,1.2,4);
   paint(-6.3,4.5,-Math.PI/2,1,1.2,1.6);plant(-7,6.6);
   // ---- Quarto de Vestir (oeste, fundo) ----
   for(let z=-14;z<-6;z+=2.2){box(g,1.8,2.6,.8,M.wood,-BX+1,Y(1.7),z,Math.PI/2,2);solid(-BX+1,z,1.8,.8,Math.PI/2);}
   box(g,1.2,2.4,.08,M.steel,-8,Y(1.8),BZ0+.6);box(g,1.4,2.6,.05,M.gold,-8,Y(1.8),BZ0+.57);
   // ---- Quarto de Hóspedes (leste, fundo) ----
   bed(11.5,-11);box(g,1.2,.6,.6,M.wood,9,Y(.7),-13.8,0,2);solid(9,-13.8,1.2,.6);rug(11,-7.6,3,1.8);paint(6.3,-13.3,Math.PI/2,7);
   plant(14.5,6.6);
  }else{
   // Haste ligando dois pontos (tripés, tubos).
   const rod=(ax,ay,az,bx,by,bz,r,m,seg=8)=>{const A=new T.Vector3(ax,ay,az),d=new T.Vector3(bx-ax,by-ay,bz-az),L=d.length();const mm=new T.Mesh(new T.CylinderGeometry(r,r,L,seg),m);mm.position.copy(A).addScaledVector(d,.5);mm.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());g.add(mm);return mm;};
   // Cadeira de conselho: assento e encosto de veludo, braços, pináculos dourados.
   const chairV=(x,z,r,tall=false)=>{const c=Math.cos(r),s=Math.sin(r),L=(a,b)=>[x+a*c+b*s,z-a*s+b*c],bh=tall?1.55:1.05;
    box(g,.62,.1,.62,M.woodDark,x,Y(F+.5),z,r,2);box(g,.56,.08,.56,M.velvet,x,Y(F+.59),z,r);
    {const [px,pz]=L(0,-.28);box(g,.62,bh,.08,M.woodDark,px,Y(F+.55+bh/2),pz,r,2);const [qx,qz]=L(0,-.235);box(g,.46,bh-.3,.03,M.velvet,qx,Y(F+.62+bh/2),qz,r);}
    for(const e of [-1,1]){const [px,pz]=L(e*.27,-.28);const f=new T.Mesh(new T.SphereGeometry(.06,8,6),M.gold);f.position.set(px,Y(F+.6+bh),pz);g.add(f);
     const [ax,az]=L(e*.3,0);box(g,.06,.06,.55,M.woodDark,ax,Y(F+.8),az,r);const [bx,bz]=L(e*.3,.22);box(g,.06,.25,.06,M.woodDark,bx,Y(F+.67),bz,r);}
    for(const a of [-1,1])for(const b of [-1,1]){const [px,pz]=L(a*.25,b*.25);box(g,.07,.5,.07,M.woodDark,px,Y(F+.25),pz,r);}
    if(tall){const [px,pz]=L(0,-.29);const cr=new T.Mesh(new T.TorusGeometry(.12,.03,6,12),M.gold);cr.position.set(px,Y(F+.66+bh),pz);cr.rotation.y=r;g.add(cr);solid(x,z,.7,.7);}};
   // ---- Salão de Reuniões (centro, frente) ----
   {const tz=2,TL=6.6,TW=1.9;
    rug(0,tz,9.4,4.6);
    box(g,TL,.1,TW,M.wood,0,Y(F+.86),tz,0,2);box(g,TL+.12,.05,TW+.12,M.gold,0,Y(F+.8),tz);box(g,TL-.4,.16,TW-.4,M.woodDark,0,Y(F+.72),tz,0,2);
    for(const x of [-TL/2+.3,0,TL/2-.3])for(const e of [-1,1])box(g,.16,.72,.16,M.woodDark,x,Y(F+.36),tz+e*(TW/2-.3));
    box(g,TL-.6,.015,.55,M.velvet,0,Y(F+.92),tz);
    for(const x of [-2.2,0,2.2]){box(g,.3,.06,.3,M.gold,x,Y(F+.94),tz);box(g,.05,.35,.05,M.gold,x,Y(F+1.12),tz);box(g,.4,.04,.04,M.gold,x,Y(F+1.28),tz);candle(x-.18,F+1.3,tz);candle(x+.18,F+1.3,tz);candle(x,F+1.32,tz);}
    for(const x of [-2.4,-1.2,0,1.2,2.4])for(const e of [-1,1]){box(g,.34,.012,.26,M.cloth,x,Y(F+.917),tz+e*.62);box(g,.07,.07,.07,M.iron,x+.22,Y(F+.95),tz+e*.55);}
    solid(0,tz,TL,TW);
    for(const x of [-2.4,-1.2,0,1.2,2.4]){chairV(x,tz-1.3,0);chairV(x,tz+1.3,Math.PI);}
    chairV(-TL/2-.75,tz,Math.PI/2,true);chairV(TL/2+.75,tz,-Math.PI/2,true);
    chandelier(-1.7,tz);chandelier(1.7,tz);
    // Aparadores com candelabros na parede do fundo (dos dois lados da porta do observatório).
    for(const sx of [-1,1]){const x=sx*3.7;box(g,2.4,.95,.55,M.woodDark,x,Y(F+.475),-3.42,0,2);box(g,2.5,.06,.62,M.gold,x,Y(F+.98),-3.42);
     for(const e of [-.6,.6])box(g,.9,.6,.02,M.wood,x+e,Y(F+.5),-3.13,0,2);
     candle(x-.8,F+1.01,-3.45);candle(x+.8,F+1.01,-3.45);cyl(g,.16,.12,.4,M.gold,x,Y(F+1.01),-3.45,10);
     paint(x,-3.7,0,sx>0?3:5,2,1.3,3.1);solid(x,-3.42,2.4,.6);}
    for(const sx of [-1,1]){shelf(sx*5.45,-1.4,2.6,3.0,-sx*Math.PI/2);paint(sx*5.7,5.5,-sx*Math.PI/2,sx>0?6:8,1.8,1.2,2.9);plant(sx*5.2,7.0);}}
   // ---- Observatório (centro, fundo) ----
   {const oz=-10;
    const sky=new T.Mesh(new T.PlaneGeometry(11.4,11.1),M.starCeil);sky.rotation.x=Math.PI/2;sky.position.set(0,Y(H-.08),(-4.25+BZ0+.5)/2);g.add(sky);
    cyl(g,2.3,2.5,.3,M.trim,0,Y(F),oz,28);{const r=new T.Mesh(new T.TorusGeometry(2.15,.05,6,40),M.gold);r.rotation.x=Math.PI/2;r.position.set(0,Y(F+.31),oz);g.add(r);}
    const top=F+.3,mY=F+1.75;
    for(let i=0;i<3;i++){const a=i/3*Math.PI*2+.5;rod(Math.cos(a)*.95,Y(top),oz+Math.sin(a)*.95,0,Y(mY),oz,.05,M.woodDark);}
    box(g,.35,.3,.35,M.brass,0,Y(mY+.1),oz,0,1);
    const tube=rod(-.9,Y(mY-.35),oz+.75,1.0,Y(mY+1.7),oz-.95,.2,M.brass,14);
    {const lens=new T.Mesh(new T.TorusGeometry(.23,.05,6,16),M.goldM);lens.position.set(1.0,Y(mY+1.7),oz-.95);lens.quaternion.copy(tube.quaternion);lens.rotateX(Math.PI/2);g.add(lens);}
    rod(-.9,Y(mY-.35),oz+.75,-1.15,Y(mY-.6),oz+.98,.06,M.iron);
    rod(-.6,Y(mY+.0),oz+.4,.2,Y(mY+.85),oz-.35,.05,M.brass);
    solid(0,oz,5,5);
    // Esfera armilar, globo, mesa de cartas celestes e estantes.
    {const ax=-3.6,az=-13.4;cyl(g,.3,.4,.9,M.trim,ax,Y(F),az,12);box(g,.5,.08,.5,M.gold,ax,Y(F+.94),az);
     const c=new T.Vector3(ax,Y(F+1.75),az),core=new T.Mesh(new T.SphereGeometry(.13,12,8),M.blue);core.position.copy(c);g.add(core);
     for(const [rx,ry] of [[0,0],[Math.PI/2,0],[Math.PI/2,Math.PI/2],[.41,0]]){const t=new T.Mesh(new T.TorusGeometry(.55,.025,6,32),M.goldM);t.position.copy(c);t.rotation.set(rx,ry,0);g.add(t);}
     rod(ax,Y(F+.98),az,ax,Y(F+2.35),az,.025,M.goldM);solid(ax,az,1.1,1.1);}
    {const gx=3.8,gz=-6.4;cyl(g,.35,.45,.1,M.woodDark,gx,Y(F),gz,12);rod(gx,Y(F+.1),gz,gx,Y(F+.85),gz,.05,M.woodDark);
     const gl=new T.Mesh(new T.SphereGeometry(.45,18,12),M.blue);gl.position.set(gx,Y(F+1.35),gz);g.add(gl);
     const mer=new T.Mesh(new T.TorusGeometry(.52,.03,6,24,Math.PI*1.4),M.goldM);mer.position.copy(gl.position);mer.rotation.z=.4;g.add(mer);solid(gx,gz,1,1);}
    table(3.6,-13.3,2.2,1.3);box(g,2,.012,1.1,M.starMap,3.6,Y(F+.925),-13.3);chair(3.6,-12.2,Math.PI);candle(4.5,F+.92,-13.7);
    for(const sx of [-1,1]){shelf(sx*5.45,-6.3,2.6,3.4,-sx*Math.PI/2);shelf(sx*5.45,-14,2.4,3.4,-sx*Math.PI/2);}
    box(g,3.8,2.4,.04,M.gold,0,Y(3.2),BZ0+.53);box(g,3.6,2.2,.05,M.starMap,0,Y(3.2),BZ0+.56);}
   // ---- Tesouro ----
   for(let i=0;i<6;i++){box(g,1.1,.7,.7,M.wood,-14+i*1.3,Y(.75),-14.5,0,2);box(g,1.1,.25,.75,M.gold,-14+i*1.3,Y(1.2),-14.5);}solid(-10.75,-14.5,7.8,.75);
   {const pile=new T.Mesh(new T.ConeGeometry(1.2,.8,10),M.gold);pile.position.set(-11,Y(.8),-10);g.add(pile);solid(-11,-10,2.2,2.2);}
   // ---- Sala dos Troféus ----
   for(let i=0;i<4;i++){const s=new T.Mesh(new T.CircleGeometry(.6,8),M.paint[i]);s.position.set(-15.4,Y(2.5),-1+i*2);s.rotation.y=Math.PI/2;g.add(s);}box(g,.5,1.9,.5,M.steel,-10,Y(1.35),3);solid(-10,3,.6,.6);
   paint(-6.3,5.2,-Math.PI/2,4);armor(-8,6,Math.PI);
   // ---- Acesso ao Campanário ----
   box(g,2,2,2,M.iron,11,Y(1.4),-10);box(g,.3,2,.3,M.woodDark,11,Y(3.4),-10);solid(11,-10,2,2);
  }
  for(const [x,z] of [[-15.3,-10],[-15.3,3],[15.3,-10],[15.3,5.6],[-3,BZ0+.7],[3,BZ0+.7]])candle(x,2.6,z);
 }

 // ===== Andares =====
 const shells=[],interiors=[],outerPanes=[],ceilings=[];
 for(let k=0;k<NF;k++){
  const y0=Fy(k),y1=Fy(k+1),H=y1-y0;
  const shell={front:new T.Group(),back:new T.Group(),west:new T.Group(),east:new T.Group()};
  for(const g of Object.values(shell))root.add(g);
  shells.push(shell);
  const inn=new T.Group();inn.visible=false;root.add(inn);interiors.push(inn);
  const tmp=new T.Group();
  // --- paredes externas com janelas abertas (arco no topo, vitral quase transparente) ---
  // De fora, os andares de cima mostram o vidro iluminado (o interior só aparece ao entrar).
  const WIN={w:1.3,v0:1.9,vr:4.05},WH=WIN.vr-WIN.v0+WIN.w/2;
  const holedWall=(grp,len,holes,x,z,ry,door)=>{
   const s=new T.Shape();s.moveTo(-len/2,0);s.lineTo(len/2,0);s.lineTo(len/2,H);s.lineTo(-len/2,H);s.lineTo(-len/2,0);
   for(const u of holes){const hw=WIN.w/2,p=new T.Path();p.moveTo(u-hw,WIN.v0);p.lineTo(u+hw,WIN.v0);p.lineTo(u+hw,WIN.vr);p.absarc(u,WIN.vr,hw,0,Math.PI,false);p.lineTo(u-hw,WIN.v0);s.holes.push(p);}
   if(door){const p=new T.Path();p.moveTo(-2.2,0);p.lineTo(2.2,0);p.lineTo(2.2,3.8);p.absarc(0,3.8,2.2,0,Math.PI,false);p.lineTo(-2.2,0);s.holes.push(p);}
   const geo=new T.ExtrudeGeometry(s,{depth:1,bevelEnabled:false,curveSegments:10});geo.translate(0,0,-.5);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/4,uv.getY(i)/4);
   const wm=new T.Mesh(geo,M.wall);wm.position.set(x,y0,z);wm.rotation.y=ry;wm.castShadow=wm.receiveShadow=true;grp.add(wm);
   for(const u of holes){const fr=new T.Group();fr.position.set(x,y0,z);fr.rotation.y=ry;grp.add(fr);
    box(fr,WIN.w+.5,.18,1.25,M.trim,u,WIN.v0-.09,0);
    for(const e of [-1,1])box(fr,.16,WIN.vr-WIN.v0,1.04,M.trim,u+e*(WIN.w/2+.06),(WIN.v0+WIN.vr)/2,0);
    const arch=new T.Mesh(new T.TorusGeometry(WIN.w/2+.06,.08,6,16,Math.PI),M.trim);arch.position.set(u,WIN.vr,0);arch.scale.z=6.5;fr.add(arch);
    box(fr,.05,WH,.05,M.iron,u,WIN.v0+WH/2,0);box(fr,WIN.w,.05,.05,M.iron,u,WIN.v0+1.1,0);box(fr,WIN.w,.05,.05,M.iron,u,WIN.vr-.05,0);
    const pane=new T.Mesh(new T.PlaneGeometry(WIN.w,WH),M.pane);pane.position.set(u,WIN.v0+WH/2,0);fr.add(pane);
    const out=new T.Mesh(archPaneGeo(WIN.w,WIN.vr-WIN.v0),M.winOut);out.position.set(u,WIN.v0,.53);fr.add(out);outerPanes.push({mesh:out,k});}
  };
  const zc=(BZ0+BZ1)/2;
  holedWall(shell.front,2*BX,k>0?[-12,-8,-3,0,3,8,12]:[-12,-8,8,12],0,BZ1,0,k===0);
  holedWall(shell.back,2*BX,[-12,-8,8,12],0,BZ0,Math.PI);
  holedWall(shell.west,BZ1-BZ0,[-12,-6,0,5].map(lz=>lz-zc),-BX,zc,-Math.PI/2);
  holedWall(shell.east,BZ1-BZ0,[-12,-6,0,5].map(lz=>zc-lz),BX,zc,Math.PI/2);
  if(k===0){
   for(let a=0;a<=10;a++){const t=Math.PI*a/10;const v=box(shell.front,.8,.9,1.3,M.trim,Math.cos(t)*2.6,y0+3.8+Math.sin(t)*2.6,BZ1);v.rotation.z=t-Math.PI/2;}
   obsBox(-(BX+2.2)/2,BZ1,(BX-2.2)/2,.5,0);obsBox((BX+2.2)/2,BZ1,(BX-2.2)/2,.5,0);
  }else obsBox(0,BZ1,BX,.5,k);
  obsBox(0,BZ0,BX,.5,k);obsBox(-BX,(BZ0+BZ1)/2,.5,(BZ1-BZ0)/2,k);obsBox(BX,(BZ0+BZ1)/2,.5,(BZ1-BZ0)/2,k);
  box(shell.front,2*BX+.4,.45,1.3,M.trim,0,y0+.22,BZ1);box(shell.back,2*BX+.4,.45,1.3,M.trim,0,y0+.22,BZ0);
  box(shell.west,1.3,.45,BZ1-BZ0,M.trim,-BX,y0+.22,(BZ0+BZ1)/2);box(shell.east,1.3,.45,BZ1-BZ0,M.trim,BX,y0+.22,(BZ0+BZ1)/2);
  // --- piso deste andar (com o vão da escada) ---
  {const s=new T.Shape();s.moveTo(-BX+.5,BZ0+.5);s.lineTo(BX-.5,BZ0+.5);s.lineTo(BX-.5,BZ1-.5);s.lineTo(-BX+.5,BZ1-.5);s.lineTo(-BX+.5,BZ0+.5);
   if(k>0){const hole=new T.Path();hole.absarc(ST.x,ST.z,ST.r+.05,0,Math.PI*2,true);s.holes.push(hole);}
   const geo=new T.ExtrudeGeometry(s,{depth:.4,bevelEnabled:false});geo.rotateX(Math.PI/2);
   const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/3,uv.getY(i)/3);
   const fl=new T.Mesh(geo,M.floor);fl.position.y=y0+.4;fl.receiveShadow=true;inn.add(fl);}
  // Teto do andar: só na primeira pessoa (na terceira, a câmera de cima enxerga o cômodo aberto).
  {const s=new T.Shape();s.moveTo(-BX+.5,BZ0+.5);s.lineTo(BX-.5,BZ0+.5);s.lineTo(BX-.5,BZ1-.5);s.lineTo(-BX+.5,BZ1-.5);s.lineTo(-BX+.5,BZ0+.5);
   if(k<NF-1){const hole=new T.Path();hole.absarc(ST.x,ST.z,ST.r+.05,0,Math.PI*2,true);s.holes.push(hole);}
   const geo=new T.ExtrudeGeometry(s,{depth:.3,bevelEnabled:false});geo.rotateX(Math.PI/2);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/3,uv.getY(i)/3);
   const ce=new T.Mesh(geo,M.inner);ce.position.y=y1+.05;ce.visible=false;root.add(ce);ceilings.push(ce);}
  // --- paredes internas INTEIRAS (até o teto), com portas ---
  const doorFrame=(cx,cz,w,alongZ)=>{const P=a=>alongZ?[cx,cz+a]:[cx+a,cz];
   for(const e of [-1,1]){const [px,pz]=P(e*(w/2-.11));if(alongZ)box(tmp,.54,3.05,.22,M.trim,px,y0+.4+1.525,pz);else box(tmp,.22,3.05,.54,M.trim,px,y0+.4+1.525,pz);obsBox(px,pz,alongZ?.27:.11,alongZ?.11:.27,k);}
   if(alongZ)box(tmp,.54,.3,w,M.trim,cx,y0+3.3,cz);else box(tmp,w,.3,.54,M.trim,cx,y0+3.3,cz);};
  const wallX=(x,za,zb,doors)=>{let cur=za;for(const [a,b] of doors){if(a>cur){box(tmp,.5,H,a-cur,M.inner,x,y0+H/2,(cur+a)/2);obsBox(x,(cur+a)/2,.25,(a-cur)/2,k);}box(tmp,.5,H-3.45,b-a,M.inner,x,y0+3.45+(H-3.45)/2,(a+b)/2);doorFrame(x,(a+b)/2,b-a,true);cur=b;}if(zb>cur){box(tmp,.5,H,zb-cur,M.inner,x,y0+H/2,(cur+zb)/2);obsBox(x,(cur+zb)/2,.25,(zb-cur)/2,k);}};
  const wallZ=(z,xa,xb,doors)=>{let cur=xa;for(const [a,b] of doors){if(a>cur){box(tmp,a-cur,H,.5,M.inner,(cur+a)/2,y0+H/2,z);obsBox((cur+a)/2,z,(a-cur)/2,.25,k);}box(tmp,b-a,H-3.45,.5,M.inner,(a+b)/2,y0+3.45+(H-3.45)/2,z);doorFrame((a+b)/2,z,b-a,false);cur=b;}if(xb>cur){box(tmp,xb-cur,H,.5,M.inner,(cur+xb)/2,y0+H/2,z);obsBox((cur+xb)/2,z,(xb-cur)/2,.25,k);}};
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
  const FL=[];furnish(tmp,k,y0,H,FL);
  mergeInto(tmp,inn,'Interior do castelo · andar '+k);
  addLife(inn,k,y0,H,FL);
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
 // Pórtico: a laje da entrada é 50 cm acima do chão; o pé sobe nela e entra pela porta (piso do salão = +40 cm).
 if(window.arcanoGroundOverrides)window.arcanoGroundOverrides.push((x,z)=>{const lx=x-site.x,lz=z-site.z;return Math.abs(lx)<4.9&&lz>BZ1-.3&&lz<BZ1+4?site.y+.5:null;});
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
  {c:['Salão de Reuniões','Observatório'],w:['Sala dos Troféus','Tesouro'],e:['Escada em Espiral','Acesso ao Campanário']}];
 const roomName=(lx,lz,k)=>{const R=ROOMS[k],i=lz>-4?0:1;if(Math.abs(lx)<6)return R.c[i];return (lx<0?R.w:R.e)[i];};
 const floorNames=['Térreo','1º andar','2º andar','3º andar'];
 const tmpV=new T.Vector3();let inside=false,saved=null,curFloor=-2;
 function setFloor(k){
  curFloor=k;
  for(let i=0;i<NF;i++){interiors[i].visible=k>=0?i===k:i===0; // de fora, o térreo aparece pela porta e pelas janelas
   for(const g of Object.values(shells[i]))g.visible=k<0||i<=k;}
  roof.visible=k<0;lid.visible=k<0;
  for(const o of outerPanes)o.mesh.visible=k<0?o.k>0:o.k!==k; // andares sem interior carregado mostram o vidro iluminado
  lamps.forEach((l,i)=>{l.intensity=k<0?0:1.1;l.position.set(i?-8:8,Fy(Math.max(k,0))+FH-1.2,-5);});
 }
 setFloor(-1);
 function frame(){
  requestAnimationFrame(frame);
  const t=performance.now()/1000;updateLife(performance.now());core.rotation.y=t*.6;core.position.y=coreLocal.y+Math.sin(t)*.3;halo.rotation.z=t*.4;halo.position.y=core.position.y;
  const p=api.getGrassPlayer&&api.getGrassPlayer();
  const lx=p?p.position.x-site.x:99,lz=p?p.position.z-site.z:99;
  const now=!!p&&inB(lx,lz);
  if(now!==inside){
   inside=now;
   if(inside){saved={d:p.camDistance,pt:p.camPitch};p.camDistance=Math.min(Math.max(p.camDistance,7),9);p.camPitch=Math.max(p.camPitch,1.25);}
   else{setFloor(-1);label.style.display='none';if(saved&&p){p.camDistance=saved.d;p.camPitch=saved.pt;}saved=null;}
  }
  {const fp=!!(window.arcanoFirstPerson&&window.arcanoFirstPerson.active);for(let i=0;i<ceilings.length;i++)ceilings[i].visible=inside&&fp&&i===curFloor;}
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
 setInterval(()=>{const s=window.arcanoAnimeSky&&window.arcanoAnimeSky.material.uniforms.uSunDir.value;const night=s?Math.min(1,Math.max(0,(-s.y+.02)/.2)):0;M.glass.emissiveIntensity=.9+night*1.6;M.winOut.emissiveIntensity=.05+night*2.2;if(M.winTile)M.winTile.emissiveIntensity=.05+night*2.2;M.fire.emissiveIntensity=1.8+Math.sin(performance.now()*.01)*.3;},120);
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
 // Sem grama na escadaria nem na praça do chafariz.
 (window.arcanoNoGrass=window.arcanoNoGrass||[]).push((x,z)=>(Math.abs(x-site.x)<5.4&&z>site.z+z0-2&&z<site.z+z1+2)||Math.hypot(x-site.x,z-site.z-88)<10);
 for(let z=z0;z<z1;z+=STEP){const wz=site.z+z,y=h(site.x,wz);box(st,9,.5,STEP+.05,M.trim,site.x,y-.08,wz,0,2);for(const sx of [-1,1])box(st,.6,1.1,STEP+.05,M.wall,site.x+sx*4.8,y+.45,wz);}
 for(const sx of [-1,1])for(let z=z0;z<z1;z+=6){const wz=site.z+z,y=h(site.x,wz);box(st,.8,2.2,.8,M.wall,site.x+sx*4.8,y+1,wz);if(O)O.addCircle(site.x+sx*4.8,wz,.55);box(st,.45,.55,.45,M.glass,site.x+sx*4.8,y+2.4,wz);box(st,.6,.15,.6,M.iron,site.x+sx*4.8,y+2.75,wz);}
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

// ---------- Jardim dentro do muro do castelo ----------
// Gramado com a grama do jogo, caminhos de cascalho, sebes, canteiros de flores,
// laguinhos, bancos, lampiões e árvores copiadas da floresta original.
function buildGarden(api,site){
 const scene=api.scene,O=window.arcanoObstacles,Y=site.y;
 const g=new T.Group();
 const W=(x,z)=>({x:site.x+x,z:site.z+z});
 const solidW=(x,z,hw,hd)=>{if(!O)return;const w=W(x,z);O.addBox({x:w.x,z:w.z,hw,hd,rot:0,ymin:Y-1,ymax:Y+4});};
 const RIN=27.4;
 const building=(x,z)=>(Math.abs(x)<17.2&&z>-17.2&&z<13)||(Math.abs(x)<20&&((z>4.5&&z<11.8)||(z>-20&&z<-12.5)))||(Math.abs(x)<6.2&&z>-29&&z<-16.8);
 const PONDS=[{x:-20.5,z:-5,r:1.8},{x:20.5,z:-5,r:1.8}];
 const BEDS=[];for(const sx of [-1,1])for(const z of [16,24])BEDS.push({x:sx*9.5,z,hw:2.2,hd:1.3});
 const onPath=(x,z)=>(Math.abs(x)<2.4&&z>11)||(Math.abs(z-20)<1.1&&Math.abs(x)<16)||(Math.abs(Math.abs(x)-24)<1.1&&z>-14&&z<6);
 const lawn=(x,z)=>{const r=Math.hypot(x,z);if(r>RIN-.6||building(x,z)||onPath(x,z))return false;
  for(const p of PONDS)if(Math.hypot(x-p.x,z-p.z)<p.r+.6)return false;for(const b of BEDS)if(Math.abs(x-b.x)<b.hw+.3&&Math.abs(z-b.z)<b.hd+.3)return false;
  if(Math.abs(Math.abs(x)-2.9)<.6&&z>12.5&&z<27.5&&Math.abs(z-20)>1.6)return false;return true;};
 // Gramado (disco verde) e caminhos de cascalho por cima.
 const turfTex=canvasTex(128,128,(c,w,h)=>{c.fillStyle='#5f9a48';c.fillRect(0,0,w,h);for(let i=0;i<700;i++){c.fillStyle=`hsl(${95+rnd()*20},${40+rnd()*20}%,${32+rnd()*16}%)`;c.fillRect(rnd()*w,rnd()*h,2,3);}});
 const turf=new T.Mesh(new T.CircleGeometry(RIN,64),mat({color:'#ffffff',map:turfTex}));turf.geometry.attributes.uv.array.forEach((v,i,a)=>{a[i]=v*12;});
 turf.material.polygonOffset=true;turf.material.polygonOffsetFactor=-2;turf.material.polygonOffsetUnits=-2;
 turf.rotation.x=-Math.PI/2;turf.position.set(site.x,Y+.07,site.z);turf.receiveShadow=true;turf.name='Gramado do jardim do castelo';scene.add(turf);
 const gravelTex=canvasTex(128,128,(c,w,h)=>{c.fillStyle='#cbbd9f';c.fillRect(0,0,w,h);for(let i=0;i<900;i++){c.fillStyle=`hsl(${30+rnd()*15},${10+rnd()*12}%,${60+rnd()*22}%)`;c.beginPath();c.arc(rnd()*w,rnd()*h,1+rnd()*1.6,0,6.3);c.fill();}});
 const gravel=mat({color:'#ffffff',map:gravelTex,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});
 box(g,4.6,.06,16,gravel,0,Y+.11,19.5,0,3);box(g,32,.06,2.2,gravel,0,Y+.115,20,0,3);
 for(const sx of [-1,1])box(g,2.2,.06,20,gravel,sx*24,Y+.11,-4,0,3);
 // O pé pisa no gramado/cascalho do jardim (antes afundava ~7 cm na fundação).
 if(window.arcanoGroundOverrides)window.arcanoGroundOverrides.push((x,z)=>Math.hypot(x-site.x,z-site.z)<36.3?Y+.1:null);
 // Pátio de pedra entre o muro do jardim e a escadaria (antes aparecia o topo musgoso da fundação).
 {const cob=canvasTex(256,256,(c,w,h)=>{c.fillStyle='#8a8070';c.fillRect(0,0,w,h);for(let r=0;r<8;r++)for(let q=0;q<8;q++){const x=q*32+(r%2?16:0),y=r*32;c.fillStyle='hsl('+(34+rnd()*10)+','+(10+rnd()*8)+'%,'+(58+rnd()*14)+'%)';c.beginPath();c.roundRect?c.roundRect(x+2,y+2,28,28,5):c.rect(x+2,y+2,28,28);c.fill();}});
  cob.repeat.set(24,24);
  const rg=new T.RingGeometry(RIN-1.2,36.3,96,2);rg.rotateX(-Math.PI/2);const ru=rg.attributes.uv,rp=rg.attributes.position;for(let i=0;i<rp.count;i++)ru.setXY(i,rp.getX(i)/36.3*.5+.5,rp.getZ(i)/36.3*.5+.5);
  const court=new T.Mesh(rg,mat({color:'#ffffff',map:cob,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}));court.position.set(site.x,Y+.06,site.z);court.receiveShadow=true;court.name='Pátio do castelo';scene.add(court);}
 // Sebes baixas dos dois lados do caminho principal (aberturas no cruzamento).
 const hedgeM=mat({color:'#3f7a3a'});
 for(const sx of [-1,1])for(const [z0,z1] of [[12.6,18.4],[21.6,27.4]]){box(g,.8,1,z1-z0,hedgeM,sx*2.9,Y+.5,(z0+z1)/2);solidW(sx*2.9,(z0+z1)/2,.4,(z1-z0)/2);}
 // Canteiros de flores com borda de pedra.
 const flowerM=[mat({color:'#ff7aa8'}),mat({color:'#ffd35a'}),mat({color:'#a98bff'}),mat({color:'#ff8c5a'}),mat({color:'#ffffff'})];
 for(const b of BEDS){
  for(const sx of [-1,1]){box(g,b.hw*2+.4,.35,.2,M.trim,b.x,Y+.17,b.z+sx*(b.hd+.1));box(g,.2,.35,b.hd*2,M.trim,b.x+sx*(b.hw+.1),Y+.17,b.z);}
  box(g,b.hw*2,.25,b.hd*2,mat({color:'#5a3f2a'}),b.x,Y+.12,b.z);
  for(let i=0;i<46;i++){const f=new T.Mesh(new T.IcosahedronGeometry(.14+rnd()*.06,0),flowerM[i%5]);f.position.set(b.x+(rnd()*2-1)*(b.hw-.2),Y+.42+rnd()*.15,b.z+(rnd()*2-1)*(b.hd-.2));g.add(f);
   const st=new T.Mesh(new T.IcosahedronGeometry(.16,0),hedgeM);st.position.set(f.position.x,Y+.28,f.position.z);g.add(st);}
  solidW(b.x,b.z,b.hw+.2,b.hd+.2);
 }
 // Laguinhos com borda de pedra e água animada.
 for(const p of PONDS){
  const rim=new T.Mesh(new T.TorusGeometry(p.r,.28,8,28),M.trim);rim.rotation.x=Math.PI/2;rim.position.set(p.x,Y+.22,p.z);g.add(rim);
  const w=new T.Mesh(new T.CircleGeometry(p.r,32),fountainWaterMat);w.rotation.x=-Math.PI/2;w.position.set(site.x+p.x,Y+.25,site.z+p.z);scene.add(w);
  for(let i=0;i<3;i++){const lp=new T.Mesh(new T.CircleGeometry(.35,10),mat({color:'#4f9a4a'}));lp.rotation.x=-Math.PI/2;lp.position.set(site.x+p.x+(rnd()-.5)*2.4,Y+.27,site.z+p.z+(rnd()-.5)*2.4);scene.add(lp);}
  if(O){const ww=W(p.x,p.z);O.addCircle(ww.x,ww.z,p.r+.25,{ymin:Y-1,ymax:Y+3});}
 }
 // Bancos e lampiões ao longo dos caminhos.
 for(const sx of [-1,1])for(const z of [15.5,24.5]){const x=sx*4.1;box(g,.5,.12,1.8,M.wood,x,Y+.5,z,0,2);box(g,.1,.6,1.8,M.wood,x+sx*.25,Y+.85,z,0,2);for(const dz of [-.7,.7])box(g,.4,.45,.12,M.iron,x,Y+.23,z+dz);solidW(x,z,.35,.95);}
 for(const [x,z] of [[-3.6,12.8],[3.6,12.8],[-3.6,27],[3.6,27],[-16,20],[16,20],[-24,6.5],[24,6.5],[-24,-13],[24,-13]]){
  cyl(g,.08,.1,2.6,M.iron,x,Y,z,8);box(g,.38,.46,.38,M.glass,x,Y+2.85,z);box(g,.5,.1,.5,M.iron,x,Y+3.12,z);if(O){const w=W(x,z);O.addCircle(w.x,w.z,.2,{ymin:Y-1,ymax:Y+3});}}
 g.position.set(site.x,0,site.z);
 mergeInto(g,scene,'Jardim do castelo');
 // Grama do jogo no gramado (mesma malha e material dos tufos).
 (function grass(){
  const kinds=new Map();scene.traverse(o=>{if(o.isInstancedMesh&&o.name&&o.name.startsWith('Tapete de grama')&&!o.name.includes('Ilha')&&!kinds.has(o.geometry.uuid))kinds.set(o.geometry.uuid,o);});
  if(!kinds.size){setTimeout(grass,1500);return;}
  const types=[...kinds.values()],lists=types.map(()=>[]);
  for(let i=0;i<5200;i++){const a=rnd()*Math.PI*2,r=Math.sqrt(rnd())*RIN,x=Math.cos(a)*r,z=Math.sin(a)*r;if(!lawn(x,z))continue;lists[i%types.length].push([x,z,rnd()]);}
  const m4=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),p=new T.Vector3(),s=new T.Vector3();
  lists.forEach((l,t)=>{if(!l.length)return;const im=new T.InstancedMesh(types[t].geometry,types[t].material,l.length);im.name='Tapete de grama Jardim do castelo';
   l.forEach(([x,z,r],i)=>{m4.compose(p.set(site.x+x,Y+.02,site.z+z),q.setFromEuler(e.set(0,r*6.28,0)),s.setScalar(.8+r*.35));im.setMatrixAt(i,m4);});
   im.instanceMatrix.needsUpdate=true;im.receiveShadow=true;im.computeBoundingSphere&&im.computeBoundingSphere();scene.add(im);});
 })();
 // Árvores: cópias dos modelos originais da floresta (em pé).
 (function trees(){
  const anchors=(api.forestInstances||[]).filter(a=>(a.type==='tree'||a.type==='pine')&&a.obj&&a.obj.scale.x>.01);
  if(anchors.length<8){setTimeout(trees,2500);return;}
  const spots=[[-13.5,25],[13.5,25],[-12,14.5],[12,14.5],[-21,8.8],[21,8.8],[-20.5,-10.5],[20.5,-10.5],[-10,-23.5],[10,-23.5]];
  const models=[];for(const a of anchors)if(a.type==='tree'&&!models.some(m=>m.modelName===a.modelName))models.push(a);
  spots.forEach(([x,z],i)=>{const a=models[i%models.length]||anchors[0];
   const rx=a.obj.rotation.x,rz=a.obj.rotation.z;a.obj.rotation.x=0;a.obj.rotation.z=0;
   const t=a.obj.clone(true);a.obj.rotation.x=rx;a.obj.rotation.z=rz;
   const off=a.obj.position.y-(a.contactY??a.y);
   t.position.set(site.x+x,Y+off,site.z+z);t.rotation.set(0,rnd()*6.28,0);t.scale.multiplyScalar(.75);t.name='Árvore do jardim do castelo';
   scene.add(t);if(O){const w=W(x,z);O.addCircle(w.x,w.z,.45,{ymin:Y-1,ymax:Y+6});}});
 })();
}

function install(){
 const api=window.arcanoWaterV1226,site=window.arcanoCastleSite;
 if(!api||!api.scene||!site||!window.arcanoIslandHeight){setTimeout(install,300);return;}
 const c=build(api,site);buildPlaza(api,site);buildGarden(api,site);
 window.arcanoCastle={site,root:c.root};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
