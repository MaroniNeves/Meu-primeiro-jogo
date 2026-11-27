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
 put('floor',AT.stone({hue:36,sat:11,l0:60,l1:73,rows:4,seed:41,cracks:.05}),.6);
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
{const CLm=window.arcanoCloth;if(CLm)M.red=new T.MeshStandardMaterial({map:CLm.tex('red'),side:T.DoubleSide,roughness:.95});}
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
M.starCeil=new T.MeshBasicMaterial({map:starTex(512,512,9),side:T.FrontSide});
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
function shingleUV(geo,perim,slant,tile){const uv=geo.attributes.uv;tile=tile||3.5;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*perim/tile,uv.getY(i)*slant/tile);}
function pyramid(g,w,d,h,m,x,y,z){const geo=new T.ConeGeometry(Math.SQRT1_2,1,4,1);geo.rotateY(Math.PI/4);shingleUV(geo,2*(w+d),Math.hypot(h,Math.min(w,d)/2));const mm=new T.Mesh(geo,m);mm.scale.set(w,h,d);mm.position.set(x,y+h/2,z);g.add(mm);return mm;}
function prismX(g,len,w,h,m,x,y,z){const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,h);s.lineTo(-w/2,0);const geo=new T.ExtrudeGeometry(s,{depth:len,bevelEnabled:false});geo.translate(0,0,-len/2);geo.rotateY(Math.PI/2);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/3,uv.getY(i)/3);const mm=new T.Mesh(geo,m);mm.position.set(x,y,z);g.add(mm);return mm;}
function prismZ(g,len,w,h,m,x,y,z){const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,h);s.lineTo(-w/2,0);const geo=new T.ExtrudeGeometry(s,{depth:len,bevelEnabled:false});geo.translate(0,0,-len/2);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/3,uv.getY(i)/3);const mm=new T.Mesh(geo,m);mm.position.set(x,y,z);g.add(mm);return mm;}
// Malha simples (posições + UV em metros), normais calculadas por face.
function roofMesh(g,P,U,m,x,y,z){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(P,3));geo.setAttribute('uv',new T.Float32BufferAttribute(U,2));geo.computeVertexNormals();const mm=new T.Mesh(geo,m);mm.position.set(x,y,z);g.add(mm);return mm;}
function pushTri(P,U,a,b,c,ua,ub,uc){P.push(...a,...b,...c);U.push(...ua,...ub,...uc);}
function pushQuad(P,U,a,b,c,d,ua,ub,uc,ud){pushTri(P,U,a,b,c,ua,ub,uc);pushTri(P,U,a,c,d,ua,uc,ud);}
// Telhado de quatro águas (cumeeira ao longo de x, 45 graus nos cantos): W x D no beiral, altura h.
function hipRoof(g,W,D,h,m,x,y,z,tile){tile=tile||3.5;const hw=W/2,hd=D/2,rl=Math.max(0,hw-hd),sl=Math.hypot(hd,h),k=sl/h/tile,P=[],U=[];
 const A=[-hw,0,-hd],B=[hw,0,-hd],C=[hw,0,hd],Dd=[-hw,0,hd],R1=[-rl,h,0],R2=[rl,h,0];
 pushQuad(P,U,Dd,C,R2,R1,[(-hw)/tile,0],[hw/tile,0],[rl/tile,h*k],[-rl/tile,h*k]);
 pushQuad(P,U,B,A,R1,R2,[hw/tile,0],[(-hw)/tile,0],[-rl/tile,h*k],[rl/tile,h*k]);
 pushTri(P,U,C,B,R2,[hd/tile,0],[-hd/tile,0],[0,h*k]);
 pushTri(P,U,A,Dd,R1,[-hd/tile,0],[hd/tile,0],[0,h*k]);
 return roofMesh(g,P,U,m,x,y,z);}
// Empena (cumeeira ao longo de z): duas águas na cor do telhado e o triângulo da frente em outro material (parede).
function gablePrism(g,len,w,h,roofM,faceM,x,y,zc,tile){tile=tile||3.5;const hw=w/2,zf=zc+len/2,zb=zc-len/2,sl=Math.hypot(hw,h),k=sl/h/tile,P=[],U=[];
 pushQuad(P,U,[-hw,0,zb],[-hw,0,zf],[0,h,zf],[0,h,zb],[zb/tile,0],[zf/tile,0],[zf/tile,h*k],[zb/tile,h*k]);
 pushQuad(P,U,[hw,0,zf],[hw,0,zb],[0,h,zb],[0,h,zf],[zf/tile,0],[zb/tile,0],[zb/tile,h*k],[zf/tile,h*k]);
 roofMesh(g,P,U,roofM,x,y,0);
 const Q=[],V=[];pushTri(Q,V,[-hw,0,zf],[hw,0,zf],[0,h,zf],[-hw/2.5,0],[hw/2.5,0],[0,h/2.5]);
 return roofMesh(g,Q,V,faceM,x,y,0);}
function crenels(g,x0,x1,z0,z1,y,step=1.6){for(let x=x0;x<=x1+1e-3;x+=step){box(g,.8,1,.6,M.wall,x,y+.5,z0);box(g,.8,1,.6,M.wall,x,y+.5,z1);}for(let z=z0+step;z<=z1-step+1e-3;z+=step){box(g,.6,1,.8,M.wall,x0,y+.5,z);box(g,.6,1,.8,M.wall,x1,y+.5,z);}}
// ux,uz (lados de fora) e cut: torre num canto do prédio — abaixo de cut ela fica em L e não invade as salas de canto
// (antes a base de 2 m e o corpo da torre entravam 2,5 m em cada sala de canto, em todos os andares).
function squareTower(g,x,z,s,h,ux,uz,cut){
 const tb=(w,hh,d,m,yc)=>{if(!ux){box(g,w,hh,d,m,x,yc,z);return;}const y0=yc-hh/2,y1=yc+hh/2;if(y0>=cut){box(g,w,hh,d,m,x,yc,z);return;}
  if(y1>cut)box(g,w,y1-cut,d,m,x,(cut+y1)/2,z);const yb=Math.min(y1,cut),hc=yb-y0,ym=(y0+yb)/2,e=.45,hw=w/2,hd=d/2;
  box(g,hw+e,hc,d,m,x+ux*(hw-e)/2,ym,z);box(g,hw-e,hc,hd+e,m,x-ux*(hw+e)/2,ym,z+uz*(hd-e)/2);};
 tb(s+.6,2,s+.6,M.base,1);tb(s,h,s,M.wall,h/2);for(const y of [h*.35,h*.7])tb(s+.3,.5,s+.3,M.trim,y);box(g,s+.6,.7,s+.6,M.trim,x,h-.35,z);crenels(g,x-s/2,x+s/2,z-s/2,z+s/2,h,1.4);
 for(let lv=0;lv<Math.floor(h/6.5);lv++)for(const [dx,dz,r] of [[0,s/2+.02,0],[0,-s/2-.02,0],[s/2+.02,0,Math.PI/2],[-s/2-.02,0,Math.PI/2]])box(g,.8,1.8,.1,M.winTile||M.glass,x+dx,3.5+lv*6.5,z+dz,r,1);
 pyramid(g,s+1,s+1,s*.95,M.slate,x,h+1,z);box(g,.3,1.4,.3,M.copper,x,h+1+s*.95+.7,z);}
// UV pelas coordenadas do castelo (faces retas): as fiadas de pedra continuam de uma peça de parede para a outra
// e começam no piso de cada andar (6,5 m = 13 fiadas), em vez de recomeçar em cada caixa.
function worldUV(g,tile){const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
 for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));if(Math.max(ax,ay,az)<.92)continue;
  const x=p.getX(i),y=p.getY(i)-.4,z=p.getZ(i);if(ax>=ay&&ax>=az)uv.setXY(i,(n.getX(i)>0?-z:z)/tile,y/tile);else if(az>=ay)uv.setXY(i,(n.getZ(i)>0?x:-x)/tile,y/tile);else uv.setXY(i,x/tile,z/tile);}uv.needsUpdate=true;}
function mergeInto(group,parent,name,wuv){
 group.updateMatrixWorld(true);const buckets=new Map();
 group.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);const c=g.attributes.position.count;
  if(!g.index){const ix=new Uint32Array(c);for(let i=0;i<c;i++)ix[i]=i;g.setIndex(new T.BufferAttribute(ix,1));}
  if(!g.attributes.normal)g.computeVertexNormals();if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(c*2),2));
  if(wuv&&wuv.has(o.material))worldUV(g,wuv.get(o.material));
  if(!buckets.has(o.material))buckets.set(o.material,[]);buckets.get(o.material).push(g);});
 for(const [m,list] of buckets){let n=0,ni=0;for(const g of list){n+=g.attributes.position.count;ni+=g.index.count;}
  const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2),I=n>65535?new Uint32Array(ni):new Uint16Array(ni);let off=0,oi=0;
  for(const g of list){const c=g.attributes.position.count;P.set(g.attributes.position.array,off*3);N.set(g.attributes.normal.array,off*3);U.set(g.attributes.uv.array.subarray(0,c*2),off*2);
   const ix=g.index.array;for(let i=0;i<ix.length;i++)I[oi+i]=ix[i]+off;off+=c;oi+=ix.length;g.dispose();}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(P,3));geo.setAttribute('normal',new T.BufferAttribute(N,3));geo.setAttribute('uv',new T.BufferAttribute(U,2));geo.setIndex(new T.BufferAttribute(I,1));geo.computeBoundingSphere();
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
const metal=k=>{const m=new T.MeshMatcapMaterial({matcap:matcapTex(k),side:T.DoubleSide,fog:false});m.name='metal '+k;return m;};
M.steel=metal('steel');M.steelDark=metal('dark');M.goldM=metal('gold');M.brass=metal('brass');
M.plume=mat({color:'#b8302a',side:T.DoubleSide});M.leather=mat({color:'#5a3a22'});
// Mapa-múndi pintado do globo (antes: esfera azul lisa). Continentes por ruído na esfera (sem emenda),
// litoral com contorno e sombreado, relevo, grade de meridianos e paralelos, rosa dos ventos e navio.
function globeTex(){const W=1024,H=512,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),img=g.createImageData(W,H),d=img.data;
 const n3=(x,y,z)=>{let v=0,a=1,f=1.3;for(let o=0;o<5;o++){v+=a*(Math.sin(x*f*1.7+y*f*.9+o*1.3)*Math.sin(y*f*1.3-z*f*1.1+o*2.1)+Math.sin(z*f*1.9+x*f*.7+o*.7)*.6);a*=.5;f*=2.05;}return v;};
 const hgt=new Float32Array(W*H);
 for(let j=0;j<H;j++){const lat=(.5-j/H)*Math.PI,cl=Math.cos(lat),y=Math.sin(lat);for(let i=0;i<W;i++){const lon=i/W*Math.PI*2,x=cl*Math.cos(lon),z=cl*Math.sin(lon);hgt[j*W+i]=n3(x,y,z)-.42+Math.abs(y)*.1;}}
 for(let j=0;j<H;j++)for(let i=0;i<W;i++){const k=j*W+i,h=hgt[k],p=k*4;let r,gg,b;
  const hx=hgt[j*W+(i+1)%W]-h,hy=hgt[Math.min(H-1,j+1)*W+i]-h,sh=Math.max(-1,Math.min(1,(hx+hy)*6));
  if(h<0){const dd=Math.min(1,-h*1.6);r=104-dd*40;gg=160-dd*42;b=176-dd*30;if(h>-.08){r+=24;gg+=22;b+=14;}}
  else if(Math.abs(j/H-.5)>.43){r=236;gg=240;b=242;}
  else{const t=Math.min(1,h*1.3);r=196-t*40+(t>.6?30:0);gg=186-t*58+(t>.6?20:0);b=128-t*60+(t>.6?20:0);if(h<.12){r=150;gg=170;b=100;}else if(h<.3){r=126;gg=152;b=86;}r+=sh*18;gg+=sh*16;b+=sh*10;}
  const nn=(Math.sin(i*.31+j*.17)*Math.sin(i*.07-j*.23))*6;d[p]=Math.max(0,Math.min(255,r*.92+22+nn));d[p+1]=Math.max(0,Math.min(255,gg*.9+18+nn));d[p+2]=Math.max(0,Math.min(255,b*.82+10+nn));d[p+3]=255;}
 for(let j=1;j<H-1;j++)for(let i=0;i<W;i++){const k=j*W+i,a=hgt[k]>=0;if(a!==(hgt[j*W+(i+1)%W]>=0)||a!==(hgt[(j+1)*W+i]>=0)){const p=k*4;d[p]=70;d[p+1]=48;d[p+2]=30;}}
 g.putImageData(img,0,0);
 let sd=77;const R=()=>{sd=(sd*1664525+1013904223)>>>0;return sd/4294967296;};
 g.strokeStyle='rgba(40,70,90,.35)';g.lineWidth=1.2;for(let k=0;k<260;k++){const i=Math.floor(R()*W),j=Math.floor(H*.1+R()*H*.8);if(hgt[j*W+i]>-.12)continue;g.beginPath();g.moveTo(i-6,j);g.quadraticCurveTo(i-3,j-3,i,j);g.quadraticCurveTo(i+3,j-3,i+6,j);g.stroke();}
 g.fillStyle='rgba(90,64,40,.65)';for(let k=0;k<900;k++){const i=Math.floor(R()*W),j=Math.floor(H*.08+R()*H*.84);if(hgt[j*W+i]<.32)continue;g.beginPath();g.moveTo(i-4,j+3);g.lineTo(i,j-4);g.lineTo(i+4,j+3);g.fill();}
 g.fillStyle='rgba(60,110,50,.55)';for(let k=0;k<1400;k++){const i=Math.floor(R()*W),j=Math.floor(H*.1+R()*H*.8),h=hgt[j*W+i];if(h<.05||h>.25)continue;g.beginPath();g.arc(i,j,2,0,6.3);g.fill();}
 g.strokeStyle='rgba(80,50,30,.45)';g.lineWidth=1;for(let i=0;i<=24;i++){g.beginPath();g.moveTo(i*W/24,0);g.lineTo(i*W/24,H);g.stroke();}for(let j=1;j<12;j++){g.beginPath();g.moveTo(0,j*H/12);g.lineTo(W,j*H/12);g.stroke();}
 g.strokeStyle='rgba(150,40,30,.6)';g.lineWidth=2;g.beginPath();g.moveTo(0,H/2);g.lineTo(W,H/2);g.stroke();g.setLineDash([6,5]);for(const t of [.37,.63]){g.beginPath();g.moveTo(0,H*t);g.lineTo(W,H*t);g.stroke();}g.setLineDash([]);
 let best=[0,0,-9];for(let k=0;k<400;k++){const i=Math.floor(W*.05+R()*W*.9),j=Math.floor(H*.3+R()*H*.4);let m=9;for(let a=0;a<8;a++)m=Math.min(m,-hgt[Math.min(H-1,Math.max(0,j+Math.round(Math.sin(a)*40)))*W+((i+Math.round(Math.cos(a)*40))+W)%W]);if(m>best[2])best=[i,j,m];}
 {const cx=best[0],cy=best[1];g.save();g.translate(cx,cy);for(let a=0;a<8;a++){g.rotate(Math.PI/4);g.fillStyle=a%2?'#e8d6a8':'#8a2a22';g.beginPath();g.moveTo(0,-(a%2?20:34));g.lineTo(5,0);g.lineTo(-5,0);g.fill();}g.strokeStyle='#5a3a22';g.lineWidth=1.5;g.beginPath();g.arc(0,0,24,0,6.3);g.stroke();g.restore();
  g.fillStyle='#5a2a1a';g.font='bold 14px serif';g.fillText('N',cx-5,cy-38);}
 {let i0=0,j0=0;for(let k=0;k<200;k++){const i=Math.floor(R()*W),j=Math.floor(H*.35+R()*H*.3);if(hgt[j*W+i]<-.2&&Math.abs(i-best[0])>80){i0=i;j0=j;break;}}
  if(i0){g.fillStyle='#5a3a22';g.beginPath();g.moveTo(i0-12,j0);g.lineTo(i0+12,j0);g.lineTo(i0+8,j0+6);g.lineTo(i0-8,j0+6);g.fill();g.fillStyle='#f0e6c8';g.beginPath();g.moveTo(i0,j0-1);g.lineTo(i0,j0-18);g.lineTo(i0+10,j0-4);g.fill();g.beginPath();g.moveTo(i0-1,j0-2);g.lineTo(i0-1,j0-14);g.lineTo(i0-9,j0-3);g.fill();}}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;}
M.globe=mat({map:globeTex(),roughness:.55});
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
/* Superfícies "loftadas": seções superelípticas empilhadas (peitoral com quilha, grevas com cume, elmo bicudo...). */
function loftGeo(secs,N,cap,o){
 // Peças mais elaboradas sem peças novas: (1) entre duas seções entram outras 3, por Catmull-Rom (a placa curva
 // de verdade em vez de gomos retos); (2) caneluras: s.fl (altura) e s.fk (quantas) fazem as nervuras das armaduras
 // góticas; (3) o.roll: borda enrolada (friso) nas pontas abertas das lâminas.
 o=o||{};N=N||30;
 {const keys=['y','rx','rz','ox','oz','n','fr','bk','fl'],val=(q,k)=>q[k]!=null?q[k]:(k==='n'?2.2:0);
  if(secs.length>2){const out=[],sub=3;
   for(let i=0;i<secs.length-1;i++){const p0=secs[Math.max(0,i-1)],p1=secs[i],p2=secs[i+1],p3=secs[Math.min(secs.length-1,i+2)];
    for(let j=0;j<sub;j++){const t=j/sub,t2=t*t,t3=t2*t,q={};
     for(const k of keys){const a=val(p0,k),b=val(p1,k),c=val(p2,k),d=val(p3,k);q[k]=k==='y'?b+(c-b)*t:.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);}
     q.rx=Math.max(.0015,q.rx);q.rz=Math.max(.0015,q.rz);q.fk=p1.fk||p2.fk||0;q.n=Math.max(1.05,q.n);out.push(q);}}
   out.push(Object.assign({},secs[secs.length-1]));secs=out;}
  if(o.roll&&cap===false){const f=secs[0],l=secs[secs.length-1],dir=Math.sign(l.y-f.y)||1,lip=(q,dy,dr)=>Object.assign({},q,{y:q.y+dy,rx:q.rx+dr,rz:q.rz+dr,fl:0});
   secs=[lip(f,-dir*.009,.004),lip(f,-dir*.005,.009),...secs,lip(l,dir*.005,.009),lip(l,dir*.009,.004)];}}
 const P=[],U=[],I=[],R=N+1;
 secs.forEach((s,i)=>{for(let k=0;k<=N;k++){const t=k/N*Math.PI*2,c=Math.cos(t),sn=Math.sin(t),n=s.n||2.2,ex=Math.sign(c)*Math.pow(Math.abs(c),2/n),ez=Math.sign(sn)*Math.pow(Math.abs(sn),2/n);
  const fm=s.fl?1+s.fl*Math.pow(Math.abs(Math.cos(t*(s.fk||10)/2)),8):1;
  let x=(s.ox||0)+s.rx*fm*ex,z=(s.oz||0)+s.rz*fm*ez;
  if(s.fr&&sn>0)z+=s.fr*s.rz*Math.exp(-Math.pow(ex*3,2))*sn;
  if(s.bk&&sn<0)z+=s.bk*s.rz*Math.exp(-Math.pow(ex*3,2))*sn;
  P.push(x,s.y,z);U.push(k/N*2,i/(secs.length-1)*2);}});
 for(let i=0;i<secs.length-1;i++)for(let k=0;k<N;k++){const q=i*R+k;I.push(q,q+R,q+1,q+1,q+R,q+R+1);}
 if(cap!==false){for(const [i,top] of [[0,false],[secs.length-1,true]]){const s=secs[i],c0=P.length/3;P.push(s.ox||0,s.y,s.oz||0);U.push(1,i?2:0);for(let k=0;k<N;k++){const q=i*R+k;if(top)I.push(c0,q+1,q);else I.push(c0,q,q+1);}}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('uv',new T.Float32BufferAttribute(U,2));g.setIndex(I);g.computeVertexNormals();return g;
}
/* Armadura v2 (site v61): peças fechadas e completas — escarcelas em lâminas, joelheiras e cotoveleiras com aba,
   manoplas com dedos dobrados, elmo com viseira bicuda, fenda dos olhos, respiros, crista e penacho de plumas,
   gorjal em lâminas, ombreiras em domo com lâminas e friso dourado, peitoral com quilha, estrela e rebites,
   cinto com fivela, tabardo com brasão, capa e pedestal com moldura e placa. Geometria indexada (≈5x mais leve). */
const ARM_TINT=[{campo:'#9e2430',capa:'#7a1f2b',pluma:'#c7352e'},{campo:'#24457e',capa:'#22386a',pluma:'#2f5fae'},{campo:'#2c5b3c',capa:'#264d34',pluma:'#efe7d2'}];
function heraldTex(campo,forma){return canvasTex(128,192,(g,w,h)=>{
 g.fillStyle=campo;g.fillRect(0,0,w,h);
 // trama do tecido e franja dourada
 for(let y=0;y<h;y+=2){g.fillStyle=`rgba(255,255,255,${y%4?.035:.06})`;g.fillRect(0,y,w,1);}
 g.strokeStyle='#e2b85a';g.lineWidth=6;g.strokeRect(7,7,w-14,h-14);g.lineWidth=2;g.strokeRect(15,15,w-30,h-30);
 g.save();g.translate(w/2,h*.46);g.fillStyle='#f0cd6e';g.strokeStyle='#7a5418';g.lineWidth=2;
 if(forma===1){// leão rampante estilizado: coroa e escudo com cruz
  g.beginPath();g.moveTo(-30,-38);g.lineTo(30,-38);g.lineTo(30,6);g.quadraticCurveTo(30,34,0,48);g.quadraticCurveTo(-30,34,-30,6);g.closePath();g.fill();g.stroke();
  g.fillStyle=campo;g.fillRect(-5,-30,10,68);g.fillRect(-22,-10,44,10);
  g.fillStyle='#f0cd6e';g.beginPath();g.moveTo(-20,-44);g.lineTo(-20,-58);g.lineTo(-10,-50);g.lineTo(0,-62);g.lineTo(10,-50);g.lineTo(20,-58);g.lineTo(20,-44);g.closePath();g.fill();g.stroke();}
 else if(forma===2){// árvore de três folhas sobre colina
  g.beginPath();g.arc(0,-18,22,0,6.3);g.fill();g.stroke();for(const e of [-1,1]){g.beginPath();g.arc(e*18,-2,15,0,6.3);g.fill();g.stroke();}
  g.fillRect(-4,0,8,34);g.beginPath();g.ellipse(0,40,34,10,0,Math.PI,0);g.fill();}
 else{// sol de oito raios
  for(let k=0;k<16;k++){g.rotate(Math.PI/8);g.beginPath();g.moveTo(-6,0);g.lineTo(0,k%2?-34:-46);g.lineTo(6,0);g.closePath();g.fill();g.stroke();}
  g.beginPath();g.arc(0,0,15,0,6.3);g.fill();g.stroke();g.fillStyle=campo;g.beginPath();g.arc(0,0,7,0,6.3);g.fill();}
 g.restore();
 g.fillStyle='#e2b85a';for(let x=4;x<w;x+=12){g.beginPath();g.moveTo(x,h-10);g.lineTo(x+6,h);g.lineTo(x+12,h-10);g.fill();}});}
const ARM_MATS=ARM_TINT.map((c,i)=>({
 pano:mat({color:'#ffffff',map:heraldTex(c.campo,i),side:T.DoubleSide,roughness:.9}),
 capa:mat({color:c.capa,map:fabricTex,side:T.DoubleSide,roughness:.75}),
 pluma:mat({color:c.pluma,side:T.DoubleSide,roughness:.8})}));
const ARM_BUILD=function(variant){
 const a=new T.Group(),S=M.steel,D=M.steelDark,G=M.goldM,Lth=M.leather,WD=M.woodDark,Dk=M.iron,AM=ARM_MATS[variant%3];
 const Y=V3(0,1,0),yb=.31;
 const put=(geo,m,x,y,z,o)=>{o=o||{};const me=new T.Mesh(geo,m);me.position.set(x,y,z);if(o.q)me.quaternion.copy(o.q);else me.rotation.set(o.rx||0,o.ry||0,o.rz||0,o.ord||'XYZ');if(o.s)me.scale.set(o.s[0],o.s[1],o.s[2]);a.add(me);return me;};
 const part=(m,secs,x,y,z,o)=>{o=o||{};return put(loftGeo(secs,o.N||24,o.cap,o),m,x,y,z,o);};
 const partAB=(m,A,B,secs,o)=>{o=o||{};const d=new T.Vector3().subVectors(B,A),L=d.length(),me=new T.Mesh(loftGeo(secs.map(q=>Object.assign({},q,{y:q.t*L})),o.N||20,o.cap,o),m);me.position.copy(A);me.quaternion.setFromUnitVectors(Y,d.normalize());if(o.spin)me.rotateY(o.spin);a.add(me);return me;};
 // perfil fechado girado (sólido inteiro): pts [[r,y],...] de um polo ao outro
 const lath=(m,pts,seg,x,y,z,o)=>put(new T.LatheGeometry(pts.map(p=>new T.Vector2(Math.max(0,p[0]),p[1])),seg||20),m,x,y,z,o);
 // domo com espessura (lente): borda chata de largura t, fechado por baixo
 const domePts=(R,h,t,n=7)=>{const out=[];for(let i=0;i<=n;i++){const u=i/n,ang=u*Math.PI/2;out.push([R*Math.sin(ang),h*Math.cos(ang)]);}
  const k=(R-t)/R,kh=(h-t)/h;for(let i=n;i>=0;i--){const u=i/n,ang=u*Math.PI/2;out.push([R*k*Math.sin(ang),h*kh*Math.cos(ang)]);}return out;};
 // lâmina anelar fechada (tronco de cone com espessura)
 const bandPts=(r0,r1,h,t)=>[[r0-t,0],[r0,0],[r0+t*.35,h*.15],[r1,h],[r1-t,h],[r0-t,0]];
 // placa curva: setor de anel (raio R, espessura t, altura h, ângulos a0..a1 a partir de +x indo para +z)
 const arcPlate=(m,R,t,h,a0,a1,x,y,z,o)=>{const sh=new T.Shape();const n=10;for(let i=0;i<=n;i++){const f=a0+(a1-a0)*i/n;const px=Math.cos(f)*R,py=-Math.sin(f)*R;i?sh.lineTo(px,py):sh.moveTo(px,py);}
  for(let i=n;i>=0;i--){const f=a0+(a1-a0)*i/n;sh.lineTo(Math.cos(f)*(R-t),-Math.sin(f)*(R-t));}
  const geo=new T.ExtrudeGeometry(sh,{depth:h,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:1,curveSegments:4});geo.rotateX(-Math.PI/2);return put(geo,m,x,y,z,o);};
 const extrude=(m,shape,depth,bevel,x,y,z,o)=>{const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:2,curveSegments:10});g.translate(0,0,-depth/2);return put(g,m,x,y,z,o);};
 const ball=(m,r,x,y,z,ws=10,hs=7)=>put(new T.SphereGeometry(r,ws,hs),m,x,y,z);
 const gem=(m,r,x,y,z)=>put(new T.IcosahedronGeometry(r,0),m,x,y,z);
 const qDir=(dir,spin)=>{const q=new T.Quaternion().setFromUnitVectors(Y,dir.clone().normalize());if(spin)q.multiply(new T.Quaternion().setFromAxisAngle(Y,spin));return q;};
 // ===== pedestal: base, moldura, corpo, tampo com friso dourado e placa =====
 box(a,.94,.09,.94,M.base,0,.045,0,0,2);box(a,.88,.04,.88,M.trim,0,.11,0,0,2);box(a,.78,.11,.78,M.trim,0,.185,0,0,2);
 box(a,.86,.05,.86,M.trim,0,.265,0,0,2);box(a,.87,.018,.87,G,0,.299,0);
 box(a,.3,.065,.014,G,0,.185,.392);for(const e of [-1,1])ball(G,.012,e*.13,.185,.4,6,4);
 // ===== pernas =====
 const fx=.112;
 for(const s of [-1,1]){
  const x=s*fx;
  // pé (escarpe): casco do calcanhar à ponta, 3 lâminas no peito do pé, sola
  partAB(S,V3(x,yb+.05,-.085),V3(x+s*.012,yb+.034,.205),[{t:0,rx:.044,rz:.046,n:2.4},{t:.22,rx:.054,rz:.058,n:2.6,bk:.25},{t:.55,rx:.056,rz:.046,n:2.6,bk:.15},{t:.82,rx:.042,rz:.03,n:2.4},{t:1,rx:.012,rz:.012,n:2.2}],{N:18});
  for(let i=0;i<3;i++){const tz=-.01+i*.055,tor=new T.TorusGeometry(.055-i*.004,.007,5,12,Math.PI);put(tor,i%2?G:D,x+s*.004*i,yb+.045-i*.004,tz,{s:[1,1.22,1]});}
  box(a,.1,.012,.3,Dk,x+s*.005,yb+.006,.06,0,1);
  // tornozelo e greva (canela com quilha, panturrilha)
  lath(D,bandPts(.062,.056,.035,.008),16,x,yb+.075,0);
  partAB(S,V3(x,yb+.1,0),V3(x,yb+.465,.012),[{t:0,rx:.052,rz:.054,n:2.4},{t:.3,rx:.062,rz:.07,n:2.5,fr:.14,bk:.26},{t:.7,rx:.061,rz:.066,n:2.5,fr:.12,bk:.2},{t:1,rx:.058,rz:.058,n:2.4}]);
  for(const ty of [.18,.38]){const p=new T.Vector3(x,yb+ty,.0);ball(G,.008,p.x+s*.058,p.y,p.z+.012,6,4);}
  // joelheira: domo, lâminas de cima e de baixo, aba lateral em coração com friso
  lath(D,bandPts(.064,.06,.03,.008),16,x,yb+.452,.008);lath(D,bandPts(.066,.07,.03,.008),16,x,yb+.535,.006);
  lath(S,domePts(.072,.05,.012),18,x,yb+.5,.04,{rx:Math.PI/2-.12});
  ball(G,.014,x,yb+.5,.092,8,6);
  {const hs=new T.Shape();hs.moveTo(0,-.05);hs.bezierCurveTo(.05,-.035,.065,.02,.03,.05);hs.quadraticCurveTo(.012,.06,0,.04);hs.quadraticCurveTo(-.012,.06,-.03,.05);hs.bezierCurveTo(-.065,.02,-.05,-.035,0,-.05);
   extrude(S,hs,.01,.004,x+s*.068,yb+.5,.02,{ry:s*Math.PI/2});}
  // coxote (coxa) com quilha
  partAB(S,V3(x,yb+.555,.012),V3(x*.96,yb+.86,0),[{t:0,rx:.066,rz:.068,n:2.4,fr:.2},{t:.5,rx:.082,rz:.084,n:2.5,fr:.3,fl:.025,fk:10},{t:1,rx:.09,rz:.09,n:2.4}]);
 }
 // ===== quadril: faldas em lâminas, escarcelas, cinto com fivela =====
 for(let i=0;i<3;i++)lath(i%2?D:S,bandPts(.224+i*.016,.206+i*.015,.062,.01),24,0,yb+.86+.062*(2-i)-.002*i,0,{s:[1,1,.82]});
 for(const s of [-1,1]){const c=s>0?Math.PI*.32:Math.PI*.68;
  for(let i=0;i<3;i++){const R=.262+i*.01,h=.072,yy=yb+.79-i*.066;arcPlate(i%2?D:S,R,.012,h,c-.36,c+.36,0,yy,0,{s:[1,1,.86]});
   for(const e of [-1,1]){const f=c+e*.3;ball(G,.007,Math.cos(f)*R,yy+h-.016,Math.sin(f)*R*.86,6,4);}}}
 lath(Lth,bandPts(.214,.212,.04,.016),24,0,yb+.985,0,{s:[1,1,.83]});
 {const bz=.181,by=yb+1.005;for(const [w,h,x,y] of [[.06,.008,0,.021],[.06,.008,0,-.021],[.008,.05,.026,0],[.008,.05,-.026,0]])box(a,w,h,.012,G,x,by+y,bz+.004+.006,0,1);box(a,.006,.04,.006,G,0,by,bz+.014,0,1);}
 // tabardo com brasão (frente), em ondas
 {const geo=new T.PlaneGeometry(1,1,6,12),p=geo.attributes.position;for(let i=0;i<p.count;i++){const u=p.getX(i),v=p.getY(i)+.5,w=.22+.06*(1-v);
   p.setXYZ(i,u*w,yb+.53+v*.46,.235+.012*Math.sin(u*9+v*2)+(1-v)*.035-.03*u*u);}geo.computeVertexNormals();put(geo,AM.pano,0,0,0);}
 // ===== tronco: peitoral com quilha, estrela, rebites e frisos =====
 const TS=[{y:0,rx:.19,rz:.15,n:2.4,bk:.04},{y:.1,rx:.205,rz:.158,n:2.5,fr:.1,bk:.05},{y:.22,rx:.236,rz:.176,n:2.6,fr:.2,bk:.06},{y:.32,rx:.256,rz:.19,n:2.7,fr:.3,bk:.06},{y:.4,rx:.25,rz:.182,n:2.7,fr:.24,bk:.05},{y:.46,rx:.212,rz:.16,n:2.5,fr:.1},{y:.5,rx:.15,rz:.124,n:2.3}];
 part(S,TS,0,yb+1.0,0);
 const surfZ=(x,yl)=>{let i=0;while(i<TS.length-2&&TS[i+1].y<yl)i++;const A=TS[i],B=TS[i+1],t=Math.min(1,Math.max(0,(yl-A.y)/(B.y-A.y))),l=(k)=>(A[k]||0)+((B[k]||0)-(A[k]||0))*t;
  const rx=l('rx'),rz=l('rz'),n=l('n')||2.4,ex=Math.min(1,Math.abs(x)/rx),ez=Math.pow(Math.max(0,1-Math.pow(ex,n)),1/n);return rz*ez*(1+l('fr')*Math.exp(-Math.pow(ex*3,2)));};
 // friso dourado em "V" (placa da barriga) e borda do pescoço; estrela no peito; rebites na cintura
 {const pts=[];for(let i=0;i<=8;i++){const t=i/8,x=-.17+t*.34,yl=.1+.13*(1-Math.abs(x)/.17);pts.push(V3(x,yb+1.0+yl,surfZ(x,yl)+.004));}
  for(let i=0;i<pts.length-1;i++)partAB(G,pts[i],pts[i+1],[{t:0,rx:.0075,rz:.0075,n:2},{t:1,rx:.0075,rz:.0075,n:2}],{N:6});}
 {const st=new T.Shape();for(let k=0;k<16;k++){const r=k%2?.028:.068,f=k/16*Math.PI*2-Math.PI/2;k?st.lineTo(Math.cos(f)*r,Math.sin(f)*r):st.moveTo(Math.cos(f)*r,Math.sin(f)*r);}st.closePath();
  extrude(G,st,.01,.003,0,yb+1.34,surfZ(0,.34)+.006,{rx:-.32});gem(M.eyeGlow,.016,0,yb+1.34,surfZ(0,.34)+.02);}
 for(let i=0;i<9;i++){const x=-.16+i*.04;ball(G,.007,x,yb+1.025,surfZ(x,.025)+.003,6,4);}
 lath(G,bandPts(.146,.142,.014,.012),20,0,yb+1.488,0,{s:[1,1,.86]});
 // ===== gorjal em lâminas =====
 for(let i=0;i<3;i++)lath(i%2?D:S,bandPts(.138-i*.012,.124-i*.012,.04,.01),20,0,yb+1.47+i*.034,0,{s:[1,1,.9]});
 // ===== ombreiras: domo, 3 lâminas para o braço, friso, gola alta e rebites =====
 for(const s of [-1,1]){
  const tilt=-s*.95,q=new T.Quaternion().setFromEuler(new T.Euler(0,0,tilt)),ax=new T.Vector3(0,1,0).applyQuaternion(q),c0=V3(s*.24,yb+1.49,-.005);
  lath(S,domePts(.142,.088,.016),22,c0.x,c0.y,c0.z,{q,s:[1,1,.96]});
  put(new T.TorusGeometry(.137,.009,5,26),G,c0.x,c0.y,c0.z,{q:q.clone().multiply(new T.Quaternion().setFromEuler(new T.Euler(Math.PI/2,0,0))),s:[1,.96,1]});
  for(let i=0;i<3;i++){const c=c0.clone().addScaledVector(ax,-.035-i*.04);lath(i%2?D:S,bandPts(.128-i*.008,.124-i*.009,.04,.01),20,c.x,c.y,c.z,{q:q.clone().multiply(new T.Quaternion().setFromEuler(new T.Euler(Math.PI,0,0)))});}
  {const hp=new T.Shape();hp.moveTo(-.075,0);hp.lineTo(.075,0);hp.quadraticCurveTo(.07,.05,0,.062);hp.quadraticCurveTo(-.07,.05,-.075,0);extrude(S,hp,.012,.004,s*.162,yb+1.56,-.01,{ry:Math.PI/2,rz:s*.12});
   put(new T.TorusGeometry(.068,.005,4,14,Math.PI),G,s*.168,yb+1.562,-.01,{ry:Math.PI/2,rz:s*.12});}
  for(let i=0;i<5;i++){const f=(i/4-.5)*1.9,p=c0.clone().add(new T.Vector3(Math.sin(f)*.105,0,Math.cos(f)*.105).applyQuaternion(q)).addScaledVector(ax,.045);ball(G,.008,p.x,p.y,p.z,6,4);}
 }
 // ===== braços (pose por variante) e manoplas com dedos dobrados =====
 const P=variant===1?{R:[V3(.37,yb+1.2,-.03),V3(.385,yb+1.06,.07)],L:[V3(-.33,yb+1.21,-.06),V3(-.235,yb+1.01,.11)]}
  :variant===2?{R:[V3(.36,yb+1.2,-.02),V3(.375,yb+1.0,.075)],L:[V3(-.35,yb+1.21,.1),V3(-.205,yb+1.12,.3)]}
  :{R:[V3(.31,yb+1.23,.1),V3(.093,yb+1.1,.3)],L:[V3(-.31,yb+1.21,.1),V3(-.093,yb+1.025,.3)]};
 const grip={};
 for(const [k,s] of [['R',1],['L',-1]]){
  const sh=V3(s*.27,yb+1.43,-.01),el=P[k][0],wr=P[k][1];
  partAB(S,sh,el,[{t:0,rx:.054,rz:.056,n:2.3},{t:.5,rx:.06,rz:.062,n:2.5,fr:.15,fl:.03,fk:10},{t:1,rx:.05,rz:.052,n:2.3}]);
  partAB(S,el,wr,[{t:0,rx:.048,rz:.05,n:2.3},{t:.4,rx:.054,rz:.056,n:2.5,fr:.28,fl:.03,fk:10},{t:1,rx:.042,rz:.044,n:2.3}]);
  // cotoveleira: domo para fora da dobra + aba
  const u1=new T.Vector3().subVectors(sh,el).normalize(),u2=new T.Vector3().subVectors(wr,el).normalize(),out=u1.clone().add(u2).multiplyScalar(-1);if(out.lengthSq()<1e-4)out.set(0,0,-1);out.normalize();
  lath(S,domePts(.06,.042,.011),16,el.x,el.y,el.z,{q:qDir(out)});ball(G,.012,el.x+out.x*.042,el.y+out.y*.042,el.z+out.z*.042,8,6);
  {const side=new T.Vector3().crossVectors(u1,u2).normalize().multiplyScalar(s);if(side.lengthSq()<.5)side.set(s,0,0);const wp=el.clone().addScaledVector(side,.05);
   const hs=new T.Shape();hs.moveTo(0,-.042);hs.bezierCurveTo(.045,-.03,.055,.018,.025,.045);hs.quadraticCurveTo(0,.05,0,.03);hs.quadraticCurveTo(0,.05,-.025,.045);hs.bezierCurveTo(-.055,.018,-.045,-.03,0,-.042);
   const me=extrude(S,hs,.008,.003,wp.x,wp.y,wp.z,{});me.lookAt(wp.clone().add(side));}
  // punho largo e mão fechada (palma, nós dourados, 4 dedos dobrados em volta do cabo, polegar)
  const dir=new T.Vector3().subVectors(wr,el).normalize();
  partAB(S,wr.clone().addScaledVector(dir,-.035),wr.clone().addScaledVector(dir,.035),[{t:0,rx:.045,rz:.047,n:2.2},{t:1,rx:.066,rz:.068,n:2.4}],{N:18});
  const th=Math.atan2(dir.x,dir.z),hc=wr.clone().addScaledVector(dir,.07),fw=V3(Math.sin(th),0,Math.cos(th));
  const hand=new T.Group();hand.position.copy(hc);hand.rotation.y=th;a.add(hand);
  const hput=(geo,m,x,y,z,o)=>{o=o||{};const me=new T.Mesh(geo,m);me.position.set(x,y,z);me.rotation.set(o.rx||0,o.ry||0,o.rz||0);hand.add(me);return me;};
  hput(loftGeo([{y:-.046,rx:.04,rz:.034,n:3},{y:0,rx:.044,rz:.036,n:3},{y:.046,rx:.04,rz:.034,n:3}],14),S,0,0,-.005);
  for(const e of [-1,1])hput(new T.SphereGeometry(.009,6,4),G,e*.043,0,-.005);
  for(let f=0;f<4;f++)hput(new T.TorusGeometry(.021,.0105,6,9,Math.PI*1.15),D,0,-.033+f*.022,.052,{rx:Math.PI/2,rz:-Math.PI*.075});
  hput(loftGeo([{y:0,rx:.012,rz:.012},{y:.05,rx:.011,rz:.011},{y:.07,rx:.004,rz:.004}],8),D,-s*.034,.048,.01,{rx:Math.PI/2-.3,rz:s*.5});
  grip[k]=hc.clone().addScaledVector(fw,.052);
 }
 // ===== elmo fechado: casco, viseira bicuda, fenda escura, respiros, crista, rosetas e penacho =====
 const HC=V3(0,yb+1.71,.012);
 lath(S,[[0,.158],[.05,.152],[.09,.132],[.116,.098],[.128,.052],[.131,0],[.128,-.05],[.118,-.095],[.1,-.118],[0,-.118]],22,HC.x,HC.y,HC.z,{s:[1,1,1.12]});
 lath(D,bandPts(.128,.122,.03,.012),22,HC.x,HC.y-.128,HC.z-.005,{s:[1,1,1.12]});
 part(S,[{y:-.11,rx:.1,rz:.1,oz:.02,n:2.4,fr:.22},{y:-.06,rx:.122,rz:.118,oz:.026,n:2.5,fr:.32},{y:-.018,rx:.128,rz:.124,oz:.027,n:2.5,fr:.34}],HC.x,HC.y,HC.z,{N:24});
 part(Dk,[{y:-.024,rx:.121,rz:.118,oz:.02,n:2.5,fr:.3},{y:.004,rx:.124,rz:.12,oz:.02,n:2.5,fr:.3}],HC.x,HC.y,HC.z,{N:24});
 part(S,[{y:.004,rx:.129,rz:.125,oz:.027,n:2.5,fr:.34},{y:.04,rx:.127,rz:.122,oz:.025,n:2.5,fr:.28},{y:.07,rx:.112,rz:.11,oz:.02,n:2.4,fr:.18}],HC.x,HC.y,HC.z,{N:24});
 part(G,[{y:.004,rx:.131,rz:.127,oz:.027,n:2.5,fr:.35},{y:.013,rx:.131,rz:.127,oz:.027,n:2.5,fr:.35}],HC.x,HC.y,HC.z,{N:24,cap:false});
 for(const s of [-1,1]){for(let i=0;i<3;i++)box(a,.006,.006,.03,Dk,HC.x+s*.109,HC.y-.045-i*.017,HC.z+.1,s*1.0,1);
  put(new T.CylinderGeometry(.024,.024,.01,12),G,HC.x+s*.131,HC.y-.008,HC.z+.01,{rz:Math.PI/2});ball(G,.009,HC.x+s*.138,HC.y-.008,HC.z+.01,6,4);}
 {const cr=new T.Shape();cr.moveTo(-.128,-.05);cr.quadraticCurveTo(0,.03,.122,-.055);cr.quadraticCurveTo(.1,.012,-.01,.038);cr.quadraticCurveTo(-.11,.02,-.128,-.05);cr.closePath();
  extrude(G,cr,.008,.003,HC.x,HC.y+.146,HC.z-.01,{ry:-Math.PI/2});}
 {const base=V3(0,HC.y+.118,HC.z-.104);lath(G,[[0,0],[.016,0],[.02,.03],[.014,.045],[0,.045]],10,base.x,base.y,base.z,{rx:-.7});
  for(let i=0;i<5;i++){const sp=(i-2)*.016,dd=Math.abs(i-2),A=V3(sp,base.y+.035,base.z-.02),B=V3(sp*1.6,base.y+.085-dd*.012,base.z-.13),C=V3(sp*2.4,base.y-.06-dd*.03,base.z-.28-dd*.012);
   partAB(AM.pluma,A,B,[{t:0,rx:.008,rz:.012},{t:1,rx:.012,rz:.034}],{N:8});partAB(AM.pluma,B,C,[{t:0,rx:.012,rz:.034},{t:.45,rx:.013,rz:.04},{t:1,rx:.003,rz:.006}],{N:8});}}
 // ===== capa presa nos ombros =====
 {const geo=new T.PlaneGeometry(1,1,8,14),p=geo.attributes.position;for(let i=0;i<p.count;i++){const u=p.getX(i),v=p.getY(i)+.5,w=.5+.26*(1-v);
   p.setXYZ(i,u*w,yb+.36+v*1.12,-.225-(1-v)*.1-.018*Math.cos(u*Math.PI*5)*(1-v*.6)+.06*u*u);}geo.computeVertexNormals();put(geo,AM.capa,0,0,0);
  for(const s of [-1,1]){partAB(G,V3(s*.17,yb+1.47,-.13),V3(s*.17,yb+1.47,-.225),[{t:0,rx:.008,rz:.008},{t:1,rx:.008,rz:.008}],{N:6});ball(G,.022,s*.17,yb+1.47,-.13,8,6);gem(M.eyeGlow,.009,s*.17,yb+1.47,-.11);}}
 // ===== armas =====
 if(variant===0){
  const sx=(grip.R.x+grip.L.x)/2,sz=(grip.R.z+grip.L.z)/2;
  part(S,[{y:0,rx:.003,rz:.003,n:1.3},{y:.1,rx:.026,rz:.007,n:1.2},{y:.55,rx:.033,rz:.0078,n:1.2},{y:.86,rx:.035,rz:.008,n:1.2},{y:.9,rx:.02,rz:.008,n:1.6}],sx,yb+.02,sz,{N:8});
  part(D,[{y:.12,rx:.006,rz:.0095,n:2},{y:.6,rx:.007,rz:.0098,n:2},{y:.84,rx:.006,rz:.0092,n:2}],sx,yb+.02,sz,{N:8});
  part(G,[{y:-.18,rx:.012,rz:.012,n:2.2},{y:-.15,rx:.016,rz:.018,n:2.2},{y:-.06,rx:.02,rz:.022,n:2.2},{y:.06,rx:.02,rz:.022,n:2.2},{y:.15,rx:.016,rz:.018,n:2.2},{y:.18,rx:.012,rz:.012,n:2.2}],sx,yb+.94,sz,{rz:Math.PI/2,N:10});
  for(const e of [-1,1])ball(G,.02,sx+e*.19,yb+.94,sz,8,6);gem(M.eyeGlow,.018,sx,yb+.94,sz+.02);
  part(Lth,[{y:0,rx:.019,rz:.019},{y:.08,rx:.022,rz:.022},{y:.16,rx:.019,rz:.019}],sx,yb+.955,sz,{N:10});
  for(let i=0;i<4;i++)put(new T.TorusGeometry(.021,.003,4,12),G,sx,yb+.975+i*.035,sz,{rx:Math.PI/2});
  lath(G,[[0,0],[.018,.004],[.03,.02],[.03,.04],[.018,.054],[0,.058]],12,sx,yb+1.12,sz);
 }else if(variant===1){
  const px=grip.R.x,pz=grip.R.z;
  partAB(WD,V3(px,yb,pz),V3(px,yb+2.32,pz),[{t:0,rx:.019,rz:.019},{t:.5,rx:.023,rz:.023},{t:1,rx:.021,rz:.021}],{N:10});
  for(const yy of [.02,.62,1.38,2.04])lath(G,bandPts(.026,.026,.04,.006),12,px,yb+yy,pz);
  for(const e of [-1,1])box(a,.008,.34,.03,S,px+e*.024,yb+2.12,pz,0,1);
  part(S,[{y:0,rx:.024,rz:.024,n:2},{y:.05,rx:.03,rz:.014,n:1.4},{y:.22,rx:.046,rz:.012,n:1.2},{y:.34,rx:.012,rz:.006,n:1.2},{y:.38,rx:.002,rz:.002}],px,yb+2.32,pz,{N:10});
  const ax=new T.Shape();ax.moveTo(0,-.02);ax.bezierCurveTo(.14,-.06,.3,.0,.33,.14);ax.bezierCurveTo(.3,.27,.16,.33,0,.3);ax.bezierCurveTo(.12,.24,.16,.14,.15,.12);ax.bezierCurveTo(.15,.06,.1,.02,0,.04);ax.closePath();
  extrude(S,ax,.014,.006,px+.012,yb+2.04,pz,{});
  
  const hk=new T.Shape();hk.moveTo(0,.02);hk.lineTo(-.15,.06);hk.quadraticCurveTo(-.18,.12,-.2,.2);hk.quadraticCurveTo(-.13,.13,-.06,.12);hk.lineTo(0,.12);hk.closePath();
  extrude(S,hk,.012,.005,px-.012,yb+2.06,pz,{});
  for(let i=0;i<7;i++){const f=i/7*Math.PI*2;partAB(AM.pluma,V3(px+Math.cos(f)*.02,yb+2.03,pz+Math.sin(f)*.02),V3(px+Math.cos(f)*.06,yb+1.86,pz+Math.sin(f)*.06),[{t:0,rx:.012,rz:.012},{t:1,rx:.004,rz:.004}],{N:6});}
  // espada embainhada no quadril esquerdo, mão no punho
  const hp=grip.L.clone(),tipb=V3(hp.x-.07,yb+.4,hp.z-.3),dv=new T.Vector3().subVectors(tipb,hp).normalize();
  partAB(Lth,hp.clone().addScaledVector(dv,.08),tipb,[{t:0,rx:.03,rz:.014,n:2.4},{t:.9,rx:.026,rz:.012,n:2.4},{t:1,rx:.008,rz:.008}],{N:12});
  for(const t of [.1,.5,.97]){const c=hp.clone().addScaledVector(dv,.08+t*(hp.distanceTo(tipb)-.08));put(new T.TorusGeometry(.03,.005,4,12),G,c.x,c.y,c.z,{q:qDir(dv).multiply(new T.Quaternion().setFromEuler(new T.Euler(Math.PI/2,0,0))),s:[1,.5,1]});}
  partAB(G,hp.clone().addScaledVector(dv,.06).add(V3(-.11,0,0)),hp.clone().addScaledVector(dv,.06).add(V3(.11,0,0)),[{t:0,rx:.012,rz:.012},{t:.5,rx:.016,rz:.016},{t:1,rx:.012,rz:.012}],{N:8});
  partAB(Lth,hp.clone().addScaledVector(dv,-.05),hp.clone().addScaledVector(dv,.06),[{t:0,rx:.017,rz:.017},{t:1,rx:.017,rz:.017}],{N:8});
  ball(G,.026,hp.x-dv.x*.07,hp.y-dv.y*.07,hp.z-dv.z*.07,10,8);
 }else{
  // escudo de cavaleiro curvo com brasão pintado, borda e umbo
  const sc=grip.L.clone().add(V3(-.02,0,.05));
  const hs=(k)=>{const s=new T.Shape();s.moveTo(-.23*k,.3*k);s.lineTo(.23*k,.3*k);s.lineTo(.23*k,.06*k);s.bezierCurveTo(.22*k,-.14*k,.09*k,-.29*k,0,-.36*k);s.bezierCurveTo(-.09*k,-.29*k,-.22*k,-.14*k,-.23*k,.06*k);s.closePath();return s;};
  const bend=(geo,z0)=>{const p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,p.getZ(i)+z0-1.1*p.getX(i)*p.getX(i));geo.computeVertexNormals();return geo;};
  {const g1=new T.ExtrudeGeometry(hs(1),{depth:.03,bevelEnabled:true,bevelSize:.012,bevelThickness:.01,bevelSegments:2,curveSegments:12});g1.translate(0,0,-.015);bend(g1,0);put(g1,S,sc.x,sc.y,sc.z,{ry:.3});
   const g2=new T.ShapeGeometry(hs(.9),12),uv=g2.attributes.uv,pp=g2.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,(pp.getX(i)+.21)/.42,(pp.getY(i)+.33)/.6);bend(g2,.0285);put(g2,AM.pano,sc.x,sc.y,sc.z,{ry:.3});
   lath(G,domePts(.05,.03,.01),14,sc.x+Math.sin(.3)*.03,sc.y+.02,sc.z+Math.cos(.3)*.03,{rx:Math.PI/2,ry:.3,ord:'YXZ'});}
  // maça de flanges na mão direita
  const mx=grip.R.x,mz=grip.R.z;
  partAB(Lth,V3(mx,yb+.93,mz),V3(mx,yb+1.07,mz),[{t:0,rx:.019,rz:.019},{t:1,rx:.019,rz:.019}],{N:8});
  partAB(S,V3(mx,yb+.86,mz),V3(mx,yb+1.42,mz),[{t:0,rx:.014,rz:.014},{t:1,rx:.016,rz:.016}],{N:8});
  lath(G,[[0,0],[.024,.004],[.026,.02],[.016,.03],[0,.03]],10,mx,yb+.83,mz);
  lath(S,[[0,0],[.03,.01],[.038,.06],[.03,.12],[.012,.15],[0,.155]],12,mx,yb+1.36,mz);
  for(let i=0;i<7;i++){const f=i/7*Math.PI*2,fl=new T.Shape();fl.moveTo(0,0);fl.lineTo(.045,.02);fl.lineTo(.04,.1);fl.lineTo(0,.13);fl.closePath();
   const me=extrude(D,fl,.008,.002,mx+Math.cos(f)*.022,yb+1.37,mz+Math.sin(f)*.022,{});me.rotation.y=-f;}
  gem(G,.022,mx,yb+1.53,mz);
 }
 // ===== funde por material (índices preservados) + contorno de tinta =====
 a.updateMatrixWorld(true);const buckets=new Map(),inkList=[];
 a.traverse(o=>{if(!o.isMesh)return;let g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);
  if(!g.index){const n=g.attributes.position.count,ix=new Uint32Array(n);for(let i=0;i<n;i++)ix[i]=i;g.setIndex(new T.BufferAttribute(ix,1));}
  if(!g.attributes.normal)g.computeVertexNormals();if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
  if(!buckets.has(o.material))buckets.set(o.material,[]);buckets.get(o.material).push(g);
  if(o.material.map&&o.material!==G)return;   // tecidos (tabardo, capa) sem contorno
  const gi=g.clone(),p=gi.attributes.position,n=gi.attributes.normal;for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)+n.getX(i)*.006,p.getY(i)+n.getY(i)*.006,p.getZ(i)+n.getZ(i)*.006);inkList.push(gi);});
 const mergeG=list=>{let nv=0,ni=0;for(const g of list){nv+=g.attributes.position.count;ni+=g.index.count;}
  const Pp=new Float32Array(nv*3),Nn=new Float32Array(nv*3),Uu=new Float32Array(nv*2),I=nv>65535?new Uint32Array(ni):new Uint16Array(ni);let ov=0,oi=0;
  for(const g of list){const c=g.attributes.position.count;Pp.set(g.attributes.position.array,ov*3);Nn.set(g.attributes.normal.array,ov*3);Uu.set(g.attributes.uv.array.subarray(0,c*2),ov*2);
   const ix=g.index.array;for(let i=0;i<ix.length;i++)I[oi+i]=ix[i]+ov;ov+=c;oi+=ix.length;}
  const r=new T.BufferGeometry();r.setAttribute('position',new T.BufferAttribute(Pp,3));r.setAttribute('normal',new T.BufferAttribute(Nn,3));r.setAttribute('uv',new T.BufferAttribute(Uu,2));r.setIndex(new T.BufferAttribute(I,1));r.computeBoundingSphere();return r;};
 const out=new T.Group();out.name='Armadura';
 for(const [m,list] of buckets){const me=new T.Mesh(mergeG(list),m);me.castShadow=true;me.receiveShadow=true;me.name='Armadura';out.add(me);}
 const ink=new T.Mesh(mergeG(inkList),ARM_INK);ink.name='Armadura · contorno';out.add(ink);
 return out;
};
const ARM_INK=new T.MeshBasicMaterial({color:'#2a2038',side:T.BackSide});
const ARM_CACHE={};
function armorModel(variant){return (ARM_CACHE[variant]||(ARM_CACHE[variant]=ARM_BUILD(variant))).clone();}
window.arcanoArmadura={modelo:armorModel};

// ---------- Vida do castelo: chamas, raios de luz, poeira e tapeçarias ----------
const LIFE={flames:[],shafts:[],dust:[],anim:[],t0:performance.now()};
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
// Chamas (sprites aditivos que tremulam) + brilho quente em volta.
function chamas(inn,FL,k,teto){
 for(const [x,y,z,sc] of FL){
  const s=new T.Sprite(flameMat);s.position.set(x,y,z);s.scale.set(.2*sc,.32*sc,1);s.center.set(.5,.12);inn.add(s);
  // brilho só nas chamas maiores (velinhas de lustre e de mesa ficam só com a chama: menos sprites por andar)
  let gl=null;if(sc>=.5){gl=new T.Sprite(glowMat);gl.position.set(x,y+.05*sc,z);gl.scale.setScalar(.9*sc+.4);inn.add(gl);}
  LIFE.flames.push({s,gl,sc,k,teto:!!teto,ph:Math.random()*6.28,sp:9+Math.random()*5});
 }
}
function addLife(inn,k,y0,H,FL){
 chamas(inn,FL,k);
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
}
function updateLife(now){
 const t=(now-LIFE.t0)/1000;
 const sky=window.arcanoAnimeSky&&window.arcanoAnimeSky.material&&window.arcanoAnimeSky.material.uniforms.uSunDir.value;
 const night=sky?Math.min(1,Math.max(0,(-sky.y+.02)/.2)):0;
 for(const f of LIFE.flames){
  const fl=.85+.15*Math.sin(t*f.sp+f.ph)+.08*Math.sin(t*f.sp*2.3+f.ph*2);
  f.s.scale.set(.2*f.sc*(.9+.1*Math.sin(t*f.sp*1.7+f.ph)),.32*f.sc*fl,1);
  if(f.gl){f.gl.material.opacity=1;f.gl.scale.setScalar((.9*f.sc+.4)*(.92+.08*Math.sin(t*f.sp*.7+f.ph)));}
 }
 // peças que se mexem (engrenagens, pêndulo, corda do sino, globos): mesmas fórmulas do Godot (sistemas/animados.gd)
 for(const a of LIFE.anim){const o=a.o,b=o.userData.base,ax=a.c[1],r=a.c[0]==='r',v=(r?b.r[ax]:b.p[ax])+(a.f==='lin'?a.v*t:(a.b||0)+a.a*Math.sin(a.w*t+(a.ph||0)));if(r)o.rotation[ax]=v;else o.position[ax]=v;}
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
 const obsBox=(lx,lz,hw,hd,k,rot)=>{if(!O)return;const w=W(lx,lz),b={x:w.x,z:w.z,hw,hd,rot:rot||0};if(k!=null){b.ymin=site.y+Fy(k)-.6;b.ymax=site.y+Fy(k+1)-.6;}O.addBox(b);};
 const ang=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));

 // ===== Exterior fixo (fundido): muralha, torres, campanário, pórtico =====
 const EXTCLOTH=[];
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
  for(const sx of [-1,1]){EXTCLOTH.push([1.3,3.4,'red',sx*3.6,7.1,RW+1.42]);box(ext,1.6,.14,.2,M.gold,sx*3.6,7.12,RW+1.4);for(const e of [-1,1]){const kn=new T.Mesh(new T.SphereGeometry(.1,8,6),M.gold);kn.position.set(sx*3.6+e*.82,7.15,RW+1.4);ext.add(kn);}}}
 // Torres de canto do prédio (mais altas que ele).
 {const cg=new T.Group();for(const [x,z] of [[-BX,BZ1],[BX,BZ1],[-BX,BZ0],[BX,BZ0]]){const ux=Math.sign(x),uz=z===BZ1?1:-1;squareTower(cg,x,z,6,TOP+8,ux,uz,TOP+.8);
   obsBox(x+ux*1.35,z,1.8,3.15);obsBox(x-ux*1.8,z+uz*1.35,1.35,1.8);}
  mergeInto(cg,root,'Castelo de Aurora · exterior',new Map([[M.wall,4],[M.base,4],[M.trim,4]]));}
 // Contrafortes nas laterais.
 for(const sx of [-1,1])for(let z=BZ0+5;z<=BZ1-4;z+=6){box(ext,1.4,TOP*.75,1.4,M.wall,sx*(BX+.9),TOP*.375,z);pyramid(ext,1.6,1.6,1.4,M.slate,sx*(BX+.9),TOP*.75,z);}
 // Campanário atrás, com o núcleo dentro do sino.
 const BZB=-23;
 {box(ext,11,2,11,M.base,0,1,BZB);box(ext,10,44,10,M.wall,0,22,BZB);for(const y of [13,26,39])box(ext,10.5,.6,10.5,M.trim,0,y,BZB);
  for(let lv=0;lv<6;lv++)for(const [dx,dz,r] of [[0,5.02,0],[5.02,0,Math.PI/2],[-5.02,0,Math.PI/2],[0,-5.02,0]])box(ext,1,2.2,.1,M.winTile||M.glass,dx,4+lv*6.5,BZB+dz,r,1);
  for(const sx of [-1,1])for(const sz of [-1,1])box(ext,1.6,8,1.6,M.wall,sx*4.2,48,BZB+sz*4.2);
  box(ext,10.6,1.1,10.6,M.trim,0,52.5,BZB);crenels(ext,-5.1,5.1,BZB-5.1,BZB+5.1,53);pyramid(ext,8,8,9,M.slate,0,53,BZB);
  cyl(ext,1,1.2,2.4,M.copper,0,62,BZB,8);pyramid(ext,2.4,2.4,2.6,M.copper,0,64.4,BZB);box(ext,.16,1.6,.16,M.gold,0,67.8,BZB);
  for(const sx of [-1,1])for(const sz of [-1,1]){cyl(ext,.9,.9,4.5,M.wall,sx*5.1,53,BZB+sz*5.1,10);const cg=new T.ConeGeometry(1.15,2.4,10);shingleUV(cg,7.2,2.7);const c=new T.Mesh(cg,M.copper);c.position.set(sx*5.1,58.7,BZB+sz*5.1);ext.add(c);}
  if(O){const w=W(0,BZB);O.addBox({x:w.x,z:w.z,hw:5.5,hd:5.5,rot:0});}}
 // Pórtico com colunas na entrada.
 box(ext,10,.5,4,M.trim,0,.25,BZ1+2);for(const sx of [-1,1])for(const dx of [1.8,4.2])cyl(ext,.45,.55,7.5,M.trim,sx*dx,.5,BZ1+3.3,12);
 box(ext,10.6,.9,4.4,M.trim,0,8.4,BZ1+2.2);prismZ(ext,4.6,11,3.2,M.slate,0,8.85,BZ1+2.2);
 for(const sx of [-1,1]){EXTCLOTH.push([1.8,7,'red',sx*3,8.1,BZ1+.64]);box(ext,2.1,.16,.22,M.gold,sx*3,8.12,BZ1+.6);}
 if(O)for(const sx of [-1,1])for(const dx of [1.8,4.2]){const w=W(sx*dx,BZ1+3.3);O.addCircle(w.x,w.z,.55);}
 mergeInto(ext,root,'Castelo de Aurora · exterior');
 {const CLm=window.arcanoCloth;if(CLm)for(const b of EXTCLOTH){const m=CLm.banner(b[0],b[1],{kind:b[2]});m.position.set(b[3],b[4],b[5]);root.add(m);}}

 // Telhado do prédio (some ao entrar).
 const roof=new T.Group();root.add(roof);
 // Laje de teto do térreo (só de fora): sem ela se veria o telhado por baixo pela porta.
 // tampa sobre o térreo (de fora): usava M.dark, que não existe — o three desenhava branco puro sem luz (o "vazio branco" visto pela porta)
 const lid=new T.Mesh(boxUV(new T.BoxGeometry(2*BX-1,.4,BZ1-BZ0-1),2*BX-1,.4,BZ1-BZ0-1,3),M.inner);lid.position.set(0,Fy(1)-.2,(BZ0+BZ1)/2);root.add(lid);
 {const r=new T.Group();
  // Telhado de quatro águas: cai sobre a laje de pedra sem triângulos nus nas pontas.
  const E=1.2,Wd=2*BX+2*E,Dd=(BZ1-BZ0)+2*E,hh=8,zc=(BZ0+BZ1)/2,Y0=TOP+.8,hd=Dd/2,gz=BZ1+E;
  box(r,2*BX+.6,.8,BZ1-BZ0+.6,M.trim,0,TOP+.4,zc);
  hipRoof(r,Wd,Dd,hh,M.slate,0,Y0,zc);
  for(const s of [-1,1]){box(r,Wd+.2,.3,.45,M.trim,0,Y0+.1,zc+s*hd);box(r,.45,.3,Dd+.2,M.trim,s*Wd/2,Y0+.1,zc);}
  {const rl=(Wd-Dd)/2;box(r,2*rl+.9,.3,.6,M.trim,0,Y0+hh+.12,zc);}
  // Empena central da frente: triângulo em pedra, janela e friso; o telhado entra no telhado principal.
  gablePrism(r,9.4,9,4.5,M.slate,M.wall,0,Y0,gz-4.7);
  box(r,1.6,2.2,.16,M.winTile||M.glass,0,Y0+1.6,gz+.02,0,1);box(r,2.0,.2,.3,M.trim,0,Y0+2.8,gz+.06);
  // Lucarnas: parede sobe do telhado, janela na frente, duas águas por cima.
  for(const sx of [-1,1]){
   const zf=BZ1-.9,run=gz-zf,hRoof=run*hh/hd,wallH=2.3;
   box(r,3,wallH+.4,4.4,M.wall,sx*8,Y0+hRoof-.4+(wallH+.4)/2,zf-2.2);
   box(r,1,1.6,.1,M.winTile||M.glass,sx*8,Y0+hRoof+1.2,zf+.04,0,1);
   gablePrism(r,7.6,3.6,1.8,M.slate,M.wall,sx*8,Y0+hRoof+wallH,zf+.3-3.8);
  }
  mergeInto(r,roof,'Telhado do castelo');}

 // (a mobília de cada andar fica em castelo-salas.js: window.arcanoCasteloSalas.mobiliar)
 // ===== Armaduras: cópias soltas no interior (a geometria é a mesma em todas; não entram na fusão do andar) =====
 const MARMORE=new T.MeshStandardMaterial({color:'#ece6dc',roughness:.55});
 function armadura(inn,x,z,rot,v,estatua,k,y0){const a=armorModel(v||0);a.position.set(x,y0+.4,z);a.rotation.y=rot||0;
  if(estatua){a.name='Estátua';a.traverse(o=>{if(o.isMesh&&o.material.side!==T.BackSide)o.material=MARMORE;});}
  inn.add(a);obsBox(x,z,.46,.46,k);return a;}
 const WUV=new Map([[M.inner,4],[M.trim,4]]);
 // ===== Andares =====
 const shells=[],interiors=[],outerPanes=[],ceilings=[],lustres=[];
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
   // parede fixa na correção de z-fighting (quem sai é o piso/friso encostado): antes o topo da parede era empurrado
   // e a face de dentro esticava 2 cm por cima da parede do andar seguinte (faixa piscando na divisa dos andares)
   wm.userData.descolaFixo=true;
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
  // faces de parede de cada sala (para o lambri e a cornija): tiram-se portas e os encontros com as outras paredes
  const paredes=[],corta=(sp,c0,c1)=>{const out=[];for(const [a,b] of sp){if(c1<=a||c0>=b){out.push([a,b]);continue;}if(c0>a)out.push([a,c0]);if(c1<b)out.push([c1,b]);}return out;};
  const faces=(eixo,c,n,a0,a1,doors,cuts)=>{let sp=[[a0,a1]];for(const [a,b] of doors.concat(cuts||[]))sp=corta(sp,a,b);for(const [x0,x1] of sp)if(x1-x0>.2)paredes.push({eixo,c,n,a0:x0,a1:x1});};
  const dX=k===0?[[-12,-8.5],[0,3.5]]:[[-11,-9],[1.2,3.2]];
  for(const sx of [-1,1]){faces('x',sx*6-.25,-1,BZ0+.5,BZ1-.5,dX,sx<0||k>0?[[-4.25,-3.75]]:[]);faces('x',sx*6+.25,1,BZ0+.5,BZ1-.5,dX,sx>0||k>0?[[-4.25,-3.75]]:[]);}
  for(const n of [-1,1]){faces('z',-4+n*.25,n,-BX+.5,-6.25,[[-12,-10]]);faces('z',-4+n*.25,n,6.25,BX-.5,[[8,10]]);if(k>0)faces('z',-4+n*.25,n,-5.75,5.75,[[-1,1]]);}
  faces('z',BZ1-.5,-1,-BX+.5,BX-.5,k===0?[[-2.2,2.2]]:[],[[-6.25,-5.75],[5.75,6.25]]);faces('z',BZ0+.5,1,-BX+.5,BX-.5,[],[[-6.25,-5.75],[5.75,6.25]]);
  faces('x',-BX+.5,1,BZ0+.5,BZ1-.5,[],[[-4.25,-3.75]]);faces('x',BX-.5,-1,BZ0+.5,BZ1-.5,[],[[-4.25,-3.75]]);
  const jan={frente:k>0?[-12,-8,-3,0,3,8,12]:[-12,-8,8,12],fundo:[-12,-8,8,12],oeste:[-12,-6,0,5],leste:[-12,-6,0,5]};
  // lustres: grupo à parte que só aparece em 1ª pessoa, como o teto (na câmera de cima eles tapavam a sala)
  const lus=new T.Group();lus.visible=false;root.add(lus);lustres.push(lus);const tetoG=new T.Group(),FLt=[];
  const FL=[],BN=[],SALAS=window.arcanoCasteloSalas;
  if(SALAS)SALAS.mobiliar({k,y0,H,F:.4,g:tmp,gTeto:tetoG,FLteto:FLt,inn,FL,BN,M,box,cyl,drapeGeo,valanceGeo,tapMats,ANIM:LIFE.anim,BX,BZ0,BZ1,paredes,jan,
   obs:(lx,lz,hw,hd,rot)=>obsBox(lx,lz,hw,hd,k,rot),armadura:(x,z,rot,v,estatua)=>armadura(inn,x,z,rot,v,estatua,k,y0)});
  mergeInto(tmp,inn,'Interior do castelo · andar '+k,WUV);
  addLife(inn,k,y0,H,FL);
  mergeInto(tetoG,lus,'Lustres do castelo · andar '+k);chamas(lus,FLt,k,true);
  {const CLm=window.arcanoCloth;if(CLm)for(const b of BN){const m=CLm.banner(b[0],b[1],{kind:b[2],indoor:true});m.position.set(b[3],b[4],b[5]);inn.add(m);}}
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
  {const fp=!!(window.arcanoFirstPerson&&window.arcanoFirstPerson.active);for(let i=0;i<ceilings.length;i++){ceilings[i].visible=inside&&fp&&i===curFloor;lustres[i].visible=inside&&fp&&i===curFloor;}}
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
 // marcas para a exportação do Godot (sem efeito no jogo): luz da noite = base + noite×k; chama tremula
 M.glass.userData.noite=[.9,1.6];M.winOut.userData.noite=[.05,2.2];if(M.winTile)M.winTile.userData.noite=[.05,2.2];M.fire.userData.chama=[1.8,.3];
 setInterval(()=>{const s=window.arcanoAnimeSky&&window.arcanoAnimeSky.material.uniforms.uSunDir.value;const night=s?Math.min(1,Math.max(0,(-s.y+.02)/.2)):0;M.glass.emissiveIntensity=.9+night*1.6;M.winOut.emissiveIntensity=.05+night*2.2;if(M.winTile)M.winTile.emissiveIntensity=.05+night*2.2;M.fire.emissiveIntensity=1.8+Math.sin(performance.now()*.01)*.3;},120);
 return {root,interiors,shells,ceilings,lustres,outerPanes,roof,lid,core,halo,coreLocal,coreLight,lamps};
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
 const fWaters=[];
 const water=new T.Mesh(new T.RingGeometry(.001,6.6,48,10),fountainWaterMat);water.rotation.x=-Math.PI/2;water.position.set(fx,fy+1.18,fz);scene.add(water);fWaters.push({m:water,r:6.6,d:.95});
 const bowl=(r,y,hh)=>{const pts=[new T.Vector2(.3,0),new T.Vector2(r*.35,.05),new T.Vector2(r*.85,hh*.6),new T.Vector2(r,hh),new T.Vector2(r*.95,hh*1.1)];const l=new T.Mesh(new T.LatheGeometry(pts,24),rimMat);l.position.set(fx,fy+y,fz);g.add(l);};
 cyl(g,1.3,1.7,2.4,M.wall,fx,fy+1.1,fz,12);bowl(3.4,3.4,.9);cyl(g,.6,.8,1.8,M.wall,fx,fy+4.3,fz,10);bowl(1.8,6.0,.6);
 for(const [r,y] of [[3.15,4.2],[1.62,6.55]]){const w=new T.Mesh(new T.RingGeometry(.001,r,32,6),fountainWaterMat);w.rotation.x=-Math.PI/2;w.position.set(fx,fy+y,fz);scene.add(w);fWaters.push({m:w,r,d:.45});}
 // Mesma água do rio (refração, reflexo do céu, cáusticas, brilho do sol e ondinhas): clona o material do rio
 // compartilhando os uniforms, e dá a cada bacia profundidade e um leve redemoinho.
 (function riverize(){const RM=window.arcanoAnimeRiver&&window.arcanoAnimeRiver.material;if(!RM){setTimeout(riverize,500);return;}
  const u=RM.uniforms;RM.uniforms={};const m=RM.clone();RM.uniforms=u;for(const k of Object.keys(u))m.uniforms[k]=u[k];
  m.uniforms.uFallZ={value:-999};m.uniforms.uFallTop={value:-999};m.uniforms.uFallDrop={value:1};m.extensions.derivatives=true;
  for(const f of fWaters){const g=f.m.geometry,p=g.attributes.position,n=p.count,dep=new Float32Array(n),fl=new Float32Array(n*2);
   for(let i=0;i<n;i++){const x=p.getX(i),y=p.getY(i),rr=Math.min(1,Math.hypot(x,y)/f.r),a=Math.atan2(y,x);dep[i]=f.d*(1-.3*rr*rr);fl[i*2]=-Math.sin(a)*.07*rr;fl[i*2+1]=-Math.cos(a)*.07*rr;}
   g.setAttribute('waterDepth',new T.BufferAttribute(dep,1));g.setAttribute('waterFlow',new T.BufferAttribute(fl,2));f.m.material=m;}
  // ondinhas onde os jatos caem na água
  let k=0;setInterval(()=>{const pl=api.getGrassPlayer&&api.getGrassPlayer(),cam=api.getMainCamera&&api.getMainCamera(),pp=(pl||cam);if(!pp||Math.hypot(pp.position.x-fx,pp.position.z-fz)>60)return;
   const now=performance.now()/1000;u.uClock.value=now;const a=(k++%8)*Math.PI/4+.39,R0=6.3-3.3;
   u.uRings.value[(k*5)%12].set(fx+Math.cos(a)*R0,fz+Math.sin(a)*R0,now,.35);if(k%2===0)u.uRings.value[(k*5+3)%12].set(fx+(Math.random()-.5)*.8,fz+(Math.random()-.5)*.8,now,.25);},450);})();
 const curtains=[];for(const [r,y0,y1] of [[3.35,4.3,1.18],[1.78,6.6,4.25]]){const c=new T.Mesh(new T.CylinderGeometry(r,r+.25,y0-y1,48,1,true),curtainMat);c.position.set(fx,fy+(y0+y1)/2,fz);scene.add(c);curtains.push({m:c,r,y0,y1});}
 mergeInto(g,scene,'Chafariz da praça');
 // Estátua da maga (site v62): o boneco jogável (Xbot) em pose de levitação — uma perna levemente erguida —, com
 // roupas de maga (capuz, corpete, mangas de sino, capa, vestido com fenda) e mármore; estatua-maga.js monta a malha
 // a partir do esqueleto, em etapas curtas, quando o jogador chega perto da praça. A orbe flutua acima da mão
 // direita com dois anéis de ouro girando e um halo.
 const ESC_EST=1.6,orbG=new T.Group();orbG.name='Orbe da maga';orbG.visible=false;scene.add(orbG);
 const orb=new T.Mesh(new T.SphereGeometry(.19,24,16),M.core);orb.name='Orbe da maga · esfera';orbG.add(orb);
 const aneis=[[.3,.42],[.37,1.15]].map(([r,rx],i)=>{const a=new T.Mesh(new T.TorusGeometry(r,.012,8,56),M.goldM);a.name='Orbe da maga · anel '+i;a.rotation.x=rx;orbG.add(a);return a;});
 const haloO=new T.Sprite(glowMat.clone());haloO.material.color=new T.Color('#9fe8ff');haloO.scale.setScalar(1.5);orbG.add(haloO);
 const estatua={grupo:null,orbG,aneis,y0:0,pronta:false,promessa:null};
 const geraEstatua=()=>estatua.promessa||(estatua.promessa=(async()=>{try{
   const [mod,{GLTFLoader},BGU]=await Promise.all([import('./estatua-maga.js?v=1'),import('https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/GLTFLoader.js'),import('https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/utils/BufferGeometryUtils.js')]);
   const mats={marmore:new T.MeshStandardMaterial({map:mod.marmore(T),roughness:.36,metalness:0,emissive:new T.Color('#1c1a17'),side:T.DoubleSide}),ouro:M.goldM,
    gema:new T.MeshStandardMaterial({color:'#bff3ff',emissive:new T.Color('#3fb6e8'),emissiveIntensity:1.1,roughness:.15})};
   mats.marmore.name='Mármore da estátua';mats.gema.name='Gemas da estátua';
   const r=await mod.gerar(T,GLTFLoader,BGU,{mats});const gr=r.grupo;
   gr.scale.setScalar(ESC_EST);gr.position.set(fx,fy+6.5,fz);gr.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(gr);gr.updateMatrixWorld(true);
   gr.getObjectByName('Estátua da maga · orbe').getWorldPosition(orbG.position);estatua.y0=orbG.position.y;orbG.visible=true;
   estatua.grupo=gr;estatua.pronta=true;estatua.info=r.info;return estatua;
  }catch(e){console.warn('[Arcano] estátua da maga:',e);estatua.promessa=null;}})());
 (function vigia(){const pl=api.getGrassPlayer&&api.getGrassPlayer(),cam=api.getMainCamera&&api.getMainCamera(),pp=pl||cam;
  if(pp&&Math.hypot(pp.position.x-fx,pp.position.z-fz)<260)geraEstatua();else setTimeout(vigia,2000);})();
 const N=420,seeds=new Float32Array(N*4);for(let i=0;i<N;i++){seeds[i*4]=Math.floor(Math.random()*9);seeds[i*4+1]=Math.random();seeds[i*4+2]=Math.random()*2-1;seeds[i*4+3]=Math.random();}
 const pg=new T.BufferGeometry();pg.setAttribute('position',new T.BufferAttribute(new Float32Array(N*3),3));pg.setAttribute('seed',new T.BufferAttribute(seeds,4));
 const jetMat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:fountainWaterMat.uniforms.uTime,uC:{value:new T.Vector3(fx,fy,fz)},uScale:{value:innerHeight*.5}},
  vertexShader:`attribute vec4 seed;uniform float uTime,uScale;uniform vec3 uC;varying float vA;
   void main(){float t=fract(uTime*(.6+.2*seed.w)+seed.y);vec3 p;
    if(seed.x<.5){float a=seed.z*3.1416;vec2 d=vec2(cos(a),sin(a));float r=.72+.85*t;p=uC+vec3(d.x*r,6.72+1.05*t-1.2*t*t,d.y*r);}
    else{float a=(seed.x-1.)*.7854;vec2 o=vec2(cos(a),sin(a))*6.3;vec2 dir=-normalize(o);p=uC+vec3(o.x+dir.x*t*3.3,1.3+t*2.6-2.7*t*t,o.y+dir.y*t*3.3);}
    vA=(1.-smoothstep(.85,1.,t))*.85;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=(.07+.06*seed.w)*uScale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`varying float vA;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.92,.99,1.,vA*smoothstep(.5,.1,d));}`});
 const jets=new T.Points(pg,jetMat);jets.frustumCulled=false;jets.name='Jatos do chafariz';scene.add(jets);
 window.arcanoChafariz={fx,fy,fz,fWaters,curtains,jets,orb,curtainMat,fountainWaterMat,jetMat,estatua,geraEstatua};   // para a exportação do Godot
 if(O)O.addCircle(fx,fz,7.6);
 const start=performance.now();
 (function tick(){requestAnimationFrame(tick);const t=(performance.now()-start)/1000;fountainWaterMat.uniforms.uTime.value=t;curtainMat.uniforms.uTime.value=t;
  if(estatua.pronta){orbG.position.y=estatua.y0+.05*Math.sin(t*1.4);aneis[0].rotation.y=t*.9;aneis[1].rotation.z=-t*.7;}})();
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
 for(const sx of [-1,1])for(const [z0,z1] of [[12.6,18.4],[21.6,27.4]]){
  const AB=window.arcanoBush;
  if(AB){const bush=AB.make({w:.95,h:1.1,d:z1-z0,leaf:.15,density:190,hue:108,seed:4000+(sx>0?7:0)+z0});bush.position.set(site.x+sx*2.9,Y+.07,site.z+(z0+z1)/2);scene.add(bush);}
  else box(g,.8,1,z1-z0,hedgeM,sx*2.9,Y+.5,(z0+z1)/2);
  solidW(sx*2.9,(z0+z1)/2,.4,(z1-z0)/2);}
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
 // grupos por andar expostos para a exportação do Godot (o jogo mostra um andar por vez: setFloor)
 window.arcanoCastle={life:LIFE,anim:{core:c.core,halo:c.halo,coreLocal:c.coreLocal,coreLight:c.coreLight,lamps:c.lamps},site,root:c.root,interiors:c.interiors,shells:c.shells,ceilings:c.ceilings,lustres:c.lustres,outerPanes:c.outerPanes,roof:c.roof,lid:c.lid,stair:ST,floorH:FH,floors:NF,box:{x:BX,z0:BZ0,z1:BZ1}};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
