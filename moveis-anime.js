/* Mobília detalhada dos interiores (casas das vilas): window.arcanoMoveis.sala(grupo, opções).
   Antes os interiores eram caixas lisas (tapete = 2 placas coloridas, balde = cilindro azul,
   lampião = ovo amarelo, parede de reboco liso até o chão). Agora:
   - piso de tábuas corridas na horizontal, rodapé e lambri de madeira com mata-juntas e roda-meio;
   - cama com quatro colunas torneadas, cabeceira de ripas, colcha de retalhos, travesseiro e manta;
   - baú de tampa abaulada com cintas de ferro e fechadura; estante com fundo, coroa e livros variados
     (em pé, inclinados e deitados); mesa com saia e pernas torneadas, cadeiras com encosto,
     prato, caneca e vela acesa;
   - lareira de pedra com boca em arco, lenha e brasa, consolo com potes; lampião de ferro pendurado
     por corrente; prateleira com jarros, quadro de paisagem, barril e vaso com planta; tapete estampado.
   Coordenadas: chão do cômodo em y, paredes em x=±iw/2 e z=±id/2, porta na parede da frente (+z). */
(function(){
'use strict';
const T=window.THREE;if(!T)return;
const PI=Math.PI;
let M=null;
function rng(s){return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function cv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h||w;return c;}
function ct(c){const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
const mat=o=>new T.MeshStandardMaterial(Object.assign({roughness:1,metalness:0},o));
// ---------- texturas pintadas ----------
function rugTex(base,borda,detalhe,seed){const W=384,H=256,c=cv(W,H),g=c.getContext('2d'),R=rng(seed);
 g.fillStyle=base;g.fillRect(0,0,W,H);
 g.fillStyle=borda;g.fillRect(10,10,W-20,H-20);g.fillStyle=base;g.fillRect(34,34,W-68,H-68);
 g.strokeStyle=detalhe;g.lineWidth=3;g.strokeRect(22,22,W-44,H-44);
 // greca na borda
 g.fillStyle=detalhe;for(let x=40;x<W-40;x+=18){g.beginPath();g.moveTo(x,14);g.lineTo(x+9,24);g.lineTo(x+18,14);g.fill();g.beginPath();g.moveTo(x,H-14);g.lineTo(x+9,H-24);g.lineTo(x+18,H-14);g.fill();}
 for(let y=40;y<H-40;y+=18){g.beginPath();g.moveTo(14,y);g.lineTo(24,y+9);g.lineTo(14,y+18);g.fill();g.beginPath();g.moveTo(W-14,y);g.lineTo(W-24,y+9);g.lineTo(W-14,y+18);g.fill();}
 // medalhão central em losangos
 const cx=W/2,cy=H/2;for(let k=4;k>=1;k--){g.fillStyle=k%2?borda:detalhe;g.beginPath();g.moveTo(cx,cy-k*24);g.lineTo(cx+k*36,cy);g.lineTo(cx,cy+k*24);g.lineTo(cx-k*36,cy);g.fill();}
 g.fillStyle=base;g.beginPath();g.arc(cx,cy,10,0,6.3);g.fill();
 for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){g.fillStyle=detalhe;g.beginPath();g.arc(cx+sx*124,cy+sy*70,11,0,6.3);g.fill();g.fillStyle=borda;g.beginPath();g.arc(cx+sx*124,cy+sy*70,5,0,6.3);g.fill();}
 // trama e desgaste
 for(let i=0;i<5000;i++){g.fillStyle=`rgba(${R()<.5?'255,240,220':'40,20,10'},${.03+R()*.05})`;g.fillRect(R()*W,R()*H,1+R()*2,1);}
 return ct(c);}
function quiltTex(cols,seed){const S=256,c=cv(S),g=c.getContext('2d'),R=rng(seed),n=6,q=S/n;
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){g.fillStyle=cols[Math.floor(R()*cols.length)];g.fillRect(i*q,j*q,q,q);
  if(R()<.45){g.fillStyle=cols[Math.floor(R()*cols.length)];g.beginPath();g.moveTo(i*q,j*q);g.lineTo(i*q+q,j*q);g.lineTo(i*q,j*q+q);g.fill();}
  if(R()<.3){g.fillStyle='rgba(255,250,235,.55)';for(let k=0;k<5;k++){g.beginPath();g.arc(i*q+4+R()*(q-8),j*q+4+R()*(q-8),2,0,6.3);g.fill();}}}
 g.strokeStyle='rgba(255,246,225,.7)';g.setLineDash([4,3]);g.lineWidth=1.2;for(let i=0;i<=n;i++){g.beginPath();g.moveTo(i*q+3,0);g.lineTo(i*q+3,S);g.stroke();g.beginPath();g.moveTo(0,i*q+3);g.lineTo(S,i*q+3);g.stroke();}
 g.setLineDash([]);g.strokeStyle='rgba(30,20,15,.35)';g.lineWidth=1;for(let i=0;i<=n;i++){g.beginPath();g.moveTo(i*q,0);g.lineTo(i*q,S);g.stroke();g.beginPath();g.moveTo(0,i*q);g.lineTo(S,i*q);g.stroke();}
 return ct(c);}
// tecido: trama de fios claros e escuros bem visível, manchas de luz e sombra (dobras e uso). Antes a trama era quase
// invisível (2 a 5% de escuro) e todo tecido parecia cor chapada.
function trama(g,S,R,passo){for(let i=0;i<S;i+=passo){g.fillStyle=`rgba(255,255,255,${.06+R()*.05})`;g.fillRect(0,i,S,1);g.fillStyle=`rgba(0,0,0,${.09+R()*.07})`;g.fillRect(0,i+1,S,1);}
 for(let i=0;i<S;i+=passo){g.fillStyle=`rgba(0,0,0,${.07+R()*.05})`;g.fillRect(i,0,1,S);g.fillStyle=`rgba(255,255,255,${.04+R()*.04})`;g.fillRect(i+1,0,1,S);}
 for(let k=0;k<12;k++){const x=R()*S,y=R()*S,r=S*(.1+R()*.22),cl=R()<.5?'255,255,255':'0,0,0';
  for(const ox of [-S,0,S])for(const oy of [-S,0,S]){const gr=g.createRadialGradient(x+ox,y+oy,1,x+ox,y+oy,r);gr.addColorStop(0,`rgba(${cl},.09)`);gr.addColorStop(1,`rgba(${cl},0)`);g.fillStyle=gr;g.fillRect(x+ox-r,y+oy-r,2*r,2*r);}}}
function linenTex(cor,seed){const S=256,c=cv(S),g=c.getContext('2d'),R=rng(seed);g.fillStyle=cor;g.fillRect(0,0,S,S);trama(g,S,R,3);return ct(c);}
// estofados e toalhas: flores (damasco), xadrez ou listras por cima da trama
function estampaTex(cor,seed,tipo){const S=256,c=cv(S),g=c.getContext('2d'),R=rng(seed);g.fillStyle=cor;g.fillRect(0,0,S,S);
 const cl='rgba(255,246,226,.30)',es='rgba(0,0,0,.18)';
 if(tipo==='xadrez'){for(let i=0;i<S;i+=32){g.fillStyle=es;g.fillRect(i,0,12,S);g.fillRect(0,i,S,12);g.fillStyle=cl;g.fillRect(i+20,0,3,S);g.fillRect(0,i+20,S,3);}}
 else if(tipo==='listras'){for(let i=0;i<S;i+=32){g.fillStyle=cl;g.fillRect(i,0,8,S);g.fillStyle=es;g.fillRect(i+14,0,4,S);g.fillRect(i+24,0,2,S);}}
 else{for(let r=0;r<4;r++)for(let k=0;k<4;k++){const x=k*64+(r%2)*32+32,y=r*64+32;g.fillStyle=cl;
   for(let p=0;p<5;p++){const a=p/5*6.283;g.beginPath();g.ellipse(x+Math.cos(a)*9,y+Math.sin(a)*9,7,4,a,0,6.283);g.fill();}
   g.fillStyle=es;g.beginPath();g.arc(x,y,4,0,6.283);g.fill();g.strokeStyle=cl;g.lineWidth=2;g.beginPath();g.arc(x,y,22,.3,1.4);g.stroke();g.beginPath();g.arc(x,y,22,3.4,4.5);g.stroke();}}
 trama(g,S,R,3);return ct(c);}
// cerâmica vidrada: faixas pintadas, respingos e brilho
function ceramicaTex(cor,seed){const W=128,H=128,c=cv(W,H),g=c.getContext('2d'),R=rng(seed);g.fillStyle=cor;g.fillRect(0,0,W,H);
 for(const [y,h,a] of [[H*.22,6,.35],[H*.3,3,.25],[H*.62,8,.3]]){g.fillStyle=`rgba(255,244,220,${a})`;g.fillRect(0,y,W,h);g.fillStyle='rgba(60,30,20,.25)';g.fillRect(0,y+h,W,2);}
 for(let i=0;i<10;i++){const x=R()*W;g.fillStyle='rgba(255,244,220,.25)';g.beginPath();g.ellipse(x,H*.45,5,9,0,0,6.283);g.fill();}
 for(let i=0;i<300;i++){g.fillStyle=R()<.5?'rgba(0,0,0,.12)':'rgba(255,255,255,.12)';g.fillRect(R()*W,R()*H,1.5,1.5);}
 const gr=g.createLinearGradient(0,0,W,0);gr.addColorStop(0,'rgba(0,0,0,.12)');gr.addColorStop(.35,'rgba(255,255,255,.18)');gr.addColorStop(.45,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(0,0,0,.12)');g.fillStyle=gr;g.fillRect(0,0,W,H);return ct(c);}
// metal batido: marcas de martelo, riscos e pontos de desgaste
function metalTex(cor,seed){const S=128,c=cv(S),g=c.getContext('2d'),R=rng(seed);g.fillStyle=cor;g.fillRect(0,0,S,S);
 for(let i=0;i<70;i++){const x=R()*S,y=R()*S,r=3+R()*7;const gr=g.createRadialGradient(x-r*.3,y-r*.3,1,x,y,r);gr.addColorStop(0,'rgba(255,255,255,.16)');gr.addColorStop(.7,'rgba(0,0,0,.10)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,2*r,2*r);}
 for(let i=0;i<40;i++){const x=R()*S,y=R()*S;g.strokeStyle=R()<.5?'rgba(255,255,255,.14)':'rgba(0,0,0,.18)';g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x+(R()-.5)*30,y+(R()-.5)*8);g.stroke();}
 for(let i=0;i<500;i++){g.fillStyle=R()<.5?'rgba(0,0,0,.10)':'rgba(255,255,255,.08)';g.fillRect(R()*S,R()*S,1,1);}return ct(c);}
// vidro dos frascos: brilho vertical e rótulo de papel no meio
function frascoTex(cor,seed){const W=128,H=128,c=cv(W,H),g=c.getContext('2d'),R=rng(seed);g.fillStyle=cor;g.fillRect(0,0,W,H);
 const gr=g.createLinearGradient(0,0,W,0);gr.addColorStop(0,'rgba(0,0,0,.18)');gr.addColorStop(.28,'rgba(255,255,255,.35)');gr.addColorStop(.34,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(0,0,0,.12)');g.fillStyle=gr;g.fillRect(0,0,W,H);
 g.fillStyle='#efe2bf';g.fillRect(W*.45,H*.38,W*.4,H*.22);g.strokeStyle='rgba(90,60,30,.6)';g.lineWidth=1.5;g.strokeRect(W*.45,H*.38,W*.4,H*.22);
 g.fillStyle='rgba(90,60,30,.55)';for(let k=0;k<3;k++)g.fillRect(W*.5,H*(.42+k*.05),W*(.18+R()*.12),2);return ct(c);}
function bookTex(cor){const c=cv(64,128),g=c.getContext('2d');g.fillStyle=cor;g.fillRect(0,0,64,128);
 const gr=g.createLinearGradient(0,0,64,0);gr.addColorStop(0,'rgba(0,0,0,.25)');gr.addColorStop(.5,'rgba(255,255,255,.08)');gr.addColorStop(1,'rgba(0,0,0,.25)');g.fillStyle=gr;g.fillRect(0,0,64,128);
 g.fillStyle='#d9b35a';for(const y of [14,22,104,112])g.fillRect(0,y,64,3);g.fillRect(16,52,32,20);g.fillStyle=cor;g.fillRect(19,55,26,14);return ct(c);}
function paintingTex(seed){const W=256,H=192,c=cv(W,H),g=c.getContext('2d'),R=rng(seed);
 const sk=g.createLinearGradient(0,0,0,H*.6);sk.addColorStop(0,'#7fb6e0');sk.addColorStop(1,'#f3dcb0');g.fillStyle=sk;g.fillRect(0,0,W,H);
 g.fillStyle='rgba(255,255,255,.8)';for(let i=0;i<4;i++){const x=R()*W,y=10+R()*50;for(let k=0;k<4;k++){g.beginPath();g.arc(x+k*12,y+(k%2)*4,10+R()*6,0,6.3);g.fill();}}
 g.fillStyle='#8aa0b8';g.beginPath();g.moveTo(0,H*.55);for(let x=0;x<=W;x+=16)g.lineTo(x,H*.55-20-Math.abs(Math.sin(x*.02+R()))*50);g.lineTo(W,H);g.lineTo(0,H);g.fill();
 g.fillStyle='#6fae52';g.beginPath();g.moveTo(0,H*.7);for(let x=0;x<=W;x+=12)g.lineTo(x,H*.66-Math.sin(x*.03)*14);g.lineTo(W,H);g.lineTo(0,H);g.fill();
 g.fillStyle='#4c8a3e';g.beginPath();g.moveTo(0,H*.85);for(let x=0;x<=W;x+=12)g.lineTo(x,H*.8-Math.sin(x*.025+2)*10);g.lineTo(W,H);g.lineTo(0,H);g.fill();
 for(let i=0;i<7;i++){const x=R()*W,y=H*.72+R()*H*.15;g.fillStyle='#5a3a22';g.fillRect(x-2,y,4,14);g.fillStyle=R()<.3?'#e07a3a':'#3f7a32';g.beginPath();g.arc(x,y,9+R()*5,0,6.3);g.fill();}
 g.fillStyle='#f3efe4';g.fillRect(W*.62,H*.62,26,18);g.fillStyle='#b8452c';g.beginPath();g.moveTo(W*.62-4,H*.62);g.lineTo(W*.62+13,H*.62-14);g.lineTo(W*.62+30,H*.62);g.fill();
 for(let i=0;i<2500;i++){g.fillStyle=`rgba(${R()<.5?'255,255,255':'0,0,0'},.05)`;g.fillRect(R()*W,R()*H,2,1);}
 return ct(c);}
function globoTex(){const W=256,H=128,c=cv(W,H),g=c.getContext('2d'),R=rng(77);g.fillStyle='#4f86a8';g.fillRect(0,0,W,H);
 for(let i=0;i<14;i++){const x=R()*W,y=H*.2+R()*H*.6,r=8+R()*22;g.fillStyle=R()<.5?'#c8b07a':'#7fa05a';for(let k=0;k<5;k++){g.beginPath();g.ellipse(x+(R()-.5)*r,y+(R()-.5)*r*.6,r*(.4+R()*.5),r*(.3+R()*.4),R()*3,0,6.3);g.fill();}}
 g.strokeStyle='rgba(40,30,20,.35)';for(let i=0;i<=12;i++){g.beginPath();g.moveTo(i*W/12,0);g.lineTo(i*W/12,H);g.stroke();}for(let j=1;j<6;j++){g.beginPath();g.moveTo(0,j*H/6);g.lineTo(W,j*H/6);g.stroke();}
 g.fillStyle='#eef2f4';g.fillRect(0,0,W,8);g.fillRect(0,H-8,W,8);return ct(c);}
function materiais(){
 const AT=window.arcanoTex;const tx=(t,sc,o)=>mat(Object.assign({map:t.map,bumpMap:t.bump,bumpScale:sc},o||{}));
 const w=(o,sc)=>AT?tx(AT.wood(o),sc==null?.6:sc):mat({color:`hsl(${o.hue},40%,${o.light}%)`});
 M={
  piso:w({hue:30,light:50,horizontal:true,boards:8,seed:301},.5),
  lambri:w({hue:26,light:38,boards:7,seed:302}),
  moldura:w({hue:22,light:28,horizontal:true,seed:303}),
  movel:w({hue:29,light:44,seed:304}),movelH:w({hue:29,light:44,horizontal:true,seed:305}),
  escuro:w({hue:22,light:30,seed:306}),escuroH:w({hue:22,light:30,horizontal:true,seed:307}),
  pedra:AT?tx(AT.stone({hue:30,sat:8,l0:46,l1:62,seed:308,rows:5}),.8):mat({color:'#8c8780'}),
  fuligem:mat({color:'#1c1612'}),
  ferro:mat({map:metalTex('#3a3b42',61),roughness:.55,metalness:.35}),lata:mat({map:metalTex('#c9a24e',62),roughness:.4,metalness:.45}),
  brasa:mat({color:'#ff9a3a',emissive:new T.Color('#ff5a1a'),emissiveIntensity:1.4}),
  chama:mat({color:'#ffe08a',emissive:new T.Color('#ffb03a'),emissiveIntensity:1.6}),
  vidro:mat({color:'#fff2c8',emissive:new T.Color('#ffbe5a'),emissiveIntensity:.6,roughness:.3}),
  vela:mat({color:'#f4ecd8',roughness:.7}),
  lencol:mat({map:linenTex('#f2ead8',11)}),travesseiro:mat({map:linenTex('#fbf5e6',12)}),
  colchas:[mat({map:quiltTex(['#c8553d','#e7b35a','#f2e4c4','#5b8f6a','#3f6f9e'],21)}),mat({map:quiltTex(['#3f6f9e','#a9c7e0','#f2e4c4','#c9a24e','#7a5a9e'],22)}),mat({map:quiltTex(['#6b8f3e','#d9c27a','#f2e4c4','#b8452c','#8a5a3a'],23)})],
  manta:mat({map:linenTex('#7a3b33',13)}),
  tapetes:[mat({map:rugTex('#9e2f2a','#e2b65a','#2f4f7a',31)}),mat({map:rugTex('#2f5a7a','#e9d6a8','#a8452c',32)}),mat({map:rugTex('#5a6b3a','#e2c47a','#7a2f2a',33)})],
  livros:['#8e2f2a','#2f557a','#3f6f3a','#6a3f7a','#a8742a','#4a3a2a'].map(c=>mat({map:bookTex(c),roughness:.8})),
  papel:mat({color:'#efe4c8'}),
  quadro:mat({map:paintingTex(41)}),
  ceramica:[mat({map:ceramicaTex('#c06a3a',71),roughness:.6}),mat({map:ceramicaTex('#e8dcc2',72),roughness:.5}),mat({map:ceramicaTex('#4f7fa8',73),roughness:.5}),mat({map:ceramicaTex('#8a9a5a',74),roughness:.6})],
  folha:mat({color:'#4e9a45'}),folhaE:mat({color:'#3a7a36'}),terra:mat({color:'#4a3324'}),
  pao:mat({color:'#c8893e'}),maca:mat({color:'#c83a2e',roughness:.5}),
  pisoClaro:w({hue:36,light:58,horizontal:true,boards:8,seed:314},.5),pisoEscuro:w({hue:24,light:34,horizontal:true,boards:7,seed:312},.5),
  pisoPedra:AT?tx(AT.cobble({style:'flag',hue:34,sat:10,l0:56,l1:70,n:4,seed:313}),.6):mat({color:'#9a948a'}),
  erva:mat({color:'#6f8f3a'}),lavanda:mat({color:'#8a6ab8'}),saco:mat({map:linenTex('#c4ad80',14)}),aparas:mat({color:'#d8b07a'}),
  estanho:mat({map:metalTex('#9aa0a6',63),roughness:.45,metalness:.5}),
  frascos:['#4fc2a0','#c25ab8','#e2b84a','#5a8ae0','#d0563a'].map((c,i)=>mat({map:frascoTex(c,80+i),roughness:.2,emissive:new T.Color(c),emissiveIntensity:.25})),
  tecidos:['#b8452c','#3f6f9e','#d9b35a','#5b8f6a','#7a5a9e','#e8dcc2'].map((c,i)=>mat({map:estampaTex(c,40+i,['flores','xadrez','listras'][i%3])})),
  globo:mat({map:globoTex(),roughness:.5})
 };
 // lambri: madeira escura, madeira clara, pintado de verde e de azul (cada casa um); molduras combinando
 M.lambris=[M.lambri,w({hue:36,light:56,boards:7,seed:309}),w({hue:150,sat:22,light:44,boards:9,seed:310}),w({hue:208,sat:26,light:46,boards:9,seed:311})];
 M.molduras=[M.moldura,w({hue:30,light:46,horizontal:true,seed:316}),w({hue:40,sat:20,light:78,horizontal:true,seed:317}),w({hue:40,sat:20,light:78,horizontal:true,seed:318})];
 M.vidro.userData.noite=[.6,2.2];M.chama.userData.noite=[1.6,1.2];   // marcas para a exportação do Godot
 setInterval(()=>{const s=window.arcanoAnimeSky&&window.arcanoAnimeSky.material.uniforms.uSunDir.value;const n=s?Math.min(1,Math.max(0,(-s.y+.02)/.2)):0;
  M.vidro.emissiveIntensity=.6+n*2.2;M.chama.emissiveIntensity=1.6+n*1.2;},1000);
 return M;}
// ---------- peças (y = base) ----------
function boxUV(geo,w,h,d,tile){if(!tile)return geo;const uv=geo.attributes.uv,F=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];for(let f=0;f<6;f++)for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,uv.getX(i)*F[f][0]/tile,uv.getY(i)*F[f][1]/tile);}return geo;}
function box(g,w,h,d,m,x,y,z,ry,tile,rx,rz){const mm=new T.Mesh(boxUV(new T.BoxGeometry(w,h,d),w,h,d,tile===undefined?1.6:tile),m);mm.position.set(x,y+h/2,z);mm.rotation.set(rx||0,ry||0,rz||0);g.add(mm);return mm;}
function cyl(g,r1,r2,h,m,x,y,z,seg,rx,rz){const mm=new T.Mesh(new T.CylinderGeometry(r1,r2,h,seg||10),m);mm.position.set(x,y+h/2,z);mm.rotation.set(rx||0,0,rz||0);g.add(mm);return mm;}
function sph(g,r,m,x,y,z,sx,sy,sz,seg){const mm=new T.Mesh(new T.SphereGeometry(r,seg||10,Math.max(5,(seg||10)>>1)),m);mm.position.set(x,y,z);mm.scale.set(sx||1,sy||1,sz||1);g.add(mm);return mm;}
function lathe(g,pts,m,x,y,z,seg){const mm=new T.Mesh(new T.LatheGeometry(pts.map(p=>new T.Vector2(p[0],p[1])),seg||10),m);mm.position.set(x,y,z);g.add(mm);return mm;}
// perna torneada de altura h
function perna(g,m,x,y,z,h,r){r=r||.045;lathe(g,[[0,0],[r*.8,0],[r*.9,h*.06],[r*.6,h*.12],[r*.75,h*.2],[r*.55,h*.3],[r*.6,h*.55],[r,h*.62],[r*.7,h*.7],[r*1.05,h*.78],[r*1.1,h],[0,h]],m,x,y,z,6);}
function rodizio(g,a,b,m,r){const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],L=Math.hypot(dx,dy,dz);const mm=new T.Mesh(new T.CylinderGeometry(r,r,L,5),m);mm.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);mm.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(dx/L,dy/L,dz/L));g.add(mm);return mm;}
// ---------- móveis ----------
// cama ao longo de x; cabeceira do lado hx (±1); centro (cx,cz)
function cama(g,y,cx,cz,hx,v){const L=2.0,Wd=1.15,cl=M.colchas[v%M.colchas.length];
 const xh=cx+hx*L/2,xf=cx-hx*L/2;
 for(const zz of [-1,1]){perna(g,M.movel,xh,y,cz+zz*(Wd/2-.04),1.1,.05);sph(g,.06,M.movel,xh,y+1.14,cz+zz*(Wd/2-.04));perna(g,M.movel,xf,y,cz+zz*(Wd/2-.04),.72,.05);sph(g,.055,M.movel,xf,y+.76,cz+zz*(Wd/2-.04));}
 // cabeceira: travessas + ripas; peseira: painel
 box(g,.06,.1,Wd-.1,M.movel,xh,y+.98,cz);box(g,.06,.08,Wd-.1,M.movel,xh,y+.48,cz);
 for(let i=0;i<5;i++)box(g,.04,.42,.09,M.movel,xh,y+.56,cz-(Wd-.3)/2+i*(Wd-.3)/4);
 box(g,.05,.32,Wd-.1,M.movelH,xf,y+.32,cz);box(g,.06,.06,Wd-.06,M.movel,xf,y+.64,cz);
 // laterais e estrado
 for(const zz of [-1,1])box(g,L-.08,.16,.05,M.movelH,cx,y+.24,cz+zz*(Wd/2-.04));
 box(g,L-.1,.04,Wd-.1,M.escuroH,cx,y+.3,cz);
 // colchão, lençol, colcha caindo pelos lados, travesseiro e manta dobrada
 box(g,L-.14,.16,Wd-.14,M.lencol,cx,y+.34,cz,0,null);
 box(g,(L-.14)*.66,.05,Wd-.06,cl,cx-hx*(L*.16),y+.47,cz,0,null);
 for(const zz of [-1,1])box(g,(L-.14)*.66,.22,.02,cl,cx-hx*(L*.16),y+.3,cz+zz*(Wd/2-.02),0,null);
 sph(g,.24,M.travesseiro,xh-hx*.3,y+.58,cz,.62,.32,1.75,10);
 box(g,.3,.07,Wd-.1,M.manta,xf+hx*.32,y+.52,cz,0,null);}
function bau(g,y,x,z,ry){const p=new T.Group();p.position.set(x,y,z);p.rotation.y=ry||0;g.add(p);
 box(p,.9,.42,.5,M.movelH,0,0,0);
 const tampa=new T.Mesh(new T.CylinderGeometry(.25,.25,.9,12,1,false,0,PI),M.movelH);tampa.rotation.z=PI/2;tampa.rotation.y=PI/2;tampa.scale.set(1,1,.45);tampa.position.set(0,.42,0);p.add(tampa);
 for(const xx of [-.32,.32]){box(p,.05,.43,.52,M.ferro,xx,0,0,0,null);const ar=new T.Mesh(new T.TorusGeometry(.255,.022,4,12,PI),M.ferro);ar.rotation.y=PI/2;ar.scale.set(1,.45,1);ar.position.set(xx,.42,0);p.add(ar);}
 box(p,.1,.12,.03,M.lata,0,.3,.26,0,null);sph(p,.022,M.ferro,0,.32,.28);
 for(const xx of [-.47,.47])box(p,.03,.06,.16,M.ferro,xx,.25,0,0,null);}
function estante(g,y,x,z,ry,v){const p=new T.Group();p.position.set(x,y,z);p.rotation.y=ry||0;g.add(p);const R=rng(77+v*13),W=1.5,H=1.95,D=.36;
 for(const sx of [-1,1])box(p,.06,H,D,M.escuro,sx*(W/2-.03),0,0);box(p,W,.03,.02,M.escuro,0,0,-D/2+.01);box(p,W-.08,H-.1,.02,M.escuroH,0,.05,-D/2+.02);
 box(p,W+.1,.08,D+.06,M.escuro,0,H,0.01);box(p,W+.16,.04,D+.1,M.escuro,0,H+.08,.02);box(p,W-.04,.1,.03,M.escuro,0,0,D/2-.015);
 for(let i=0;i<4;i++){const sy=.12+i*.46;box(p,W-.1,.035,D-.04,M.movelH,0,sy,0);
  if(i===3)continue;let xx=-W/2+.1;const fim=W/2-.1;
  while(xx<fim-.06){const r=R();
   if(r<.12){ // vão com pote ou vela
    const pw=.18;if(xx+pw>fim)break;lathe(p,[[0,0],[.06,0],[.08,.06],[.07,.13],[.04,.16],[.05,.18],[0,.18]],M.ceramica[Math.floor(R()*4)],xx+pw/2,sy+.035,0,10);xx+=pw+.02;continue;}
   if(r<.22){ // pilha deitada
    const n=2+Math.floor(R()*3);let yy=sy+.035;for(let k=0;k<n;k++){const bh=.04+R()*.025;box(p,.24-R()*.04,bh,.18+R()*.05,M.livros[Math.floor(R()*6)],xx+.13,yy,0,R()*.2-.1,null);yy+=bh;}xx+=.28;continue;}
   const bw=.035+R()*.045,bh=.24+R()*.16,bd=.2+R()*.06;if(xx+bw>fim)break;
   const inc=R()<.08&&xx>-W/2+.2;const b=box(p,bw,bh,bd,M.livros[Math.floor(R()*6)],xx+bw/2+(inc?bh*.18:0),sy+.035,(R()-.5)*.03,0,null);if(inc){b.rotation.z=-.32;b.position.y-=.02;}
   xx+=bw+.004+(inc?bh*.3:0);}}
 // topo: potes e uma caixinha
 lathe(p,[[0,0],[.07,0],[.1,.08],[.08,.2],[.05,.24],[0,.24]],M.ceramica[0],-.45,H+.1,0,10);box(p,.26,.12,.18,M.movelH,.2,H+.1,0,.2,null);}
function mesa(g,y,x,z,v){const W=1.3,D=.8,H=.76;
 box(g,W,.06,D,M.movelH,x,y+H-.06,z);box(g,W-.2,.12,D-.2,M.escuroH,x,y+H-.18,z);
 for(const a of [-1,1])for(const b of [-1,1])perna(g,M.movel,x+a*(W/2-.12),y,z+b*(D/2-.12),H-.12,.04);
 // prato com pão, caneca, vela no castiçal
 cyl(g,.15,.12,.02,M.ceramica[1],x-.25,y+H,z+.08,14);sph(g,.08,M.pao,x-.25,y+H+.05,z+.08,1.4,.7,1,8);
 lathe(g,[[0,0],[.045,0],[.05,.11],[0,.11]],M.ceramica[2],x+.1,y+H,z+.18,10);const asa=new T.Mesh(new T.TorusGeometry(.03,.009,4,8),M.ceramica[2]);asa.position.set(x+.155,y+H+.06,z+.18);g.add(asa);
 lathe(g,[[0,0],[.07,0],[.07,.012],[.02,.02],[.015,.06],[.03,.065],[0,.065]],M.lata,x+.35,y+H,z-.15,10);cyl(g,.018,.018,.12,M.vela,x+.35,y+H+.065,z-.15,8);sph(g,.018,M.chama,x+.35,y+H+.2,z-.15,1,1.8,1,6);
 if(v%2===0){sph(g,.045,M.maca,x+.05,y+H+.045,z-.2);sph(g,.045,M.maca,x-.03,y+H+.045,z-.12);}}
function cadeira(g,y,x,z,ry){const p=new T.Group();p.position.set(x,y,z);p.rotation.y=ry;g.add(p);const s=.42,H=.46;
 box(p,s,.045,s,M.movelH,0,H-.045,0);for(const a of [-1,1])for(const b of [-1,1])perna(p,M.movel,a*(s/2-.04),0,b*(s/2-.04),H-.045,.026);
 for(const a of [-1,1])box(p,.04,.5,.04,M.movel,a*(s/2-.03),H,-s/2+.03);
 box(p,s-.04,.08,.03,M.movel,0,H+.4,-s/2+.03);box(p,s-.04,.05,.03,M.movel,0,H+.2,-s/2+.03);
 for(const a of [-1,0,1])box(p,.035,.14,.025,M.movel,a*.1,H+.24,-s/2+.03);
 box(p,s-.06,.025,.025,M.movel,0,.12,s/2-.05);box(p,s-.06,.025,.025,M.movel,0,.12,-s/2+.05);}
// lareira encostada na parede de normal nx (±1) em x=xw
function lareira(g,y,xw,z,nx,top){const p=new T.Group();p.position.set(xw,y,z);p.rotation.y=nx>0?PI/2:-PI/2;g.add(p);
 // frente local = +z (para dentro do cômodo)
 const W=1.3,Dp=.62,H=1.05;
 for(const sx of [-1,1])box(p,.32,H,Dp,M.pedra,sx*(W/2-.16),0,Dp/2,0,1.2);
 box(p,W,.34,Dp,M.pedra,0,H-.34,Dp/2,0,1.2);
 const arco=new T.Mesh(new T.CylinderGeometry(.34,.34,Dp,12,1,false,0,PI),M.pedra);arco.rotation.x=PI/2;arco.rotation.z=PI/2;arco.position.set(0,H-.34,Dp/2);arco.scale.set(1,1,.55);p.add(arco);
 box(p,W-.64,H-.2,.06,M.fuligem,0,0,.05,0,null);box(p,W-.64,.03,Dp-.08,M.fuligem,0,0,Dp/2,0,null);
 box(p,W+.3,.14,.2,M.pedra,0,-.0001,Dp+.1,0,1.2); // soleira
 box(p,W+.24,.08,Dp+.18,M.escuroH,0,H,Dp/2+.04); // consolo
 // lenha e brasa
 for(const [ox,oz,a] of [[-.12,.32,.3],[.12,.3,-.25],[0,.38,1.5]])rodizio(p,[ox-Math.cos(a)*.2,.1,oz-Math.sin(a)*.12],[ox+Math.cos(a)*.2,.1,oz+Math.sin(a)*.12],M.escuro,.05);
 sph(p,.16,M.brasa,0,.08,.33,1.4,.35,.8,8);for(const [ox,h] of [[-.06,.22],[.07,.28],[0,.34]]){const c=new T.Mesh(new T.ConeGeometry(.06,h,6),M.chama);c.position.set(ox,.14+h/2,.33);p.add(c);}
 for(const sx of [-1,1])box(p,.03,.12,.25,M.ferro,sx*.2,0,.33,0,null);
 // chaminé até o forro
 const hc=Math.max(.3,top-y-H-.08);box(p,W-.2,hc,Dp-.12,M.pedra,0,H+.08,(Dp-.12)/2,0,1.2);
 // potes e castiçal no consolo
 lathe(p,[[0,0],[.06,0],[.08,.07],[.06,.15],[.04,.17],[0,.17]],M.ceramica[1],-.45,H+.08,Dp/2+.05,10);lathe(p,[[0,0],[.05,0],[.07,.1],[.03,.14],[0,.14]],M.ceramica[3],-.28,H+.08,Dp/2+.05,10);
 lathe(p,[[0,0],[.05,0],[.05,.01],[.015,.02],[.012,.08],[.025,.085],[0,.085]],M.lata,.45,H+.08,Dp/2+.05,8);cyl(p,.015,.015,.1,M.vela,.45,H+.165,Dp/2+.05,6);
 // caldeirão de ferro pendurado
 lathe(p,[[0,0],[.09,.01],[.13,.08],[.12,.16],[.11,.17],[0,.17]],M.ferro,0,.42,.3,12);rodizio(p,[0,.6,.3],[0,H-.36,.3],M.ferro,.008);}
function lampiao(g,x,yTop,z){const yb=yTop-.95;
 for(let i=0;i<5;i++){const l=new T.Mesh(new T.TorusGeometry(.03,.007,4,8),M.ferro);l.position.set(x,yTop-.04-i*.07,z);l.rotation.y=i%2?PI/2:0;l.scale.y=1.3;g.add(l);}
 const tp=yTop-.4;const c=new T.Mesh(new T.ConeGeometry(.17,.14,6),M.ferro);c.position.set(x,tp,z);g.add(c);sph(g,.025,M.ferro,x,tp+.08,z);
 box(g,.2,.3,.2,M.vidro,x,yb+.1,z,0,null);
 for(const a of [-1,1])for(const b of [-1,1])box(g,.022,.34,.022,M.ferro,x+a*.11,yb+.08,z+b*.11,0,null);
 box(g,.26,.04,.26,M.ferro,x,yb+.4,z,0,null);box(g,.26,.05,.26,M.ferro,x,yb+.06,z,0,null);
 const f=new T.Mesh(new T.ConeGeometry(.08,.08,6),M.ferro);f.rotation.x=PI;f.position.set(x,yb+.02,z);g.add(f);
 // aro de cima ligado à corrente
 rodizio(g,[x,tp+.07,z],[x,yTop-.38,z],M.ferro,.008);}
function armario(g,y,x,z,ry){const p=new T.Group();p.position.set(x,y,z);p.rotation.y=ry||0;g.add(p);const W=1.2,D=.46;
 // parte de baixo com 2 portas almofadadas, tampo, parte de cima aberta com pratos em pé, coroa
 box(p,W,.9,D,M.escuro,0,0,0);box(p,W+.06,.05,D+.06,M.movelH,0,.9,0);
 for(const a of [-1,1]){box(p,W/2-.06,.78,.02,M.movel,a*W/4,.06,D/2+.005);box(p,W/2-.2,.5,.015,M.escuro,a*W/4,.2,D/2+.02);sph(p,.022,M.lata,a*.05,.55,D/2+.04);}
 for(const a of [-1,1])box(p,.05,1.05,.3,M.escuro,a*(W/2-.025),.95,-.07);box(p,W,1.05,.02,M.escuroH,0,.95,-.21);
 box(p,W+.12,.08,.4,M.escuro,0,2.0,-.05);box(p,W+.18,.04,.44,M.escuro,0,2.08,-.05);
 for(let i=0;i<2;i++){const yy=1.3+i*.38;box(p,W-.1,.03,.28,M.movelH,0,yy,-.07);box(p,W-.1,.02,.02,M.lata,0,yy+.05,.06);
  for(let k=0;k<4;k++){const pr=new T.Mesh(new T.CylinderGeometry(.12,.1,.015,14),M.ceramica[(k+i)%2?1:2]);pr.rotation.x=PI/2-.15;pr.position.set(-.42+k*.28,yy+.15,-.15);p.add(pr);}}
 box(p,W-.1,.03,.28,M.movelH,0,.95,-.07);for(let k=0;k<3;k++)lathe(p,[[0,0],[.05,0],[.06,.08],[.035,.14],[.045,.16],[0,.16]],M.ceramica[k],-.35+k*.35,.98,-.05,10);}
function prateleira(g,y,x,z,ry){const p=new T.Group();p.position.set(x,y,z);p.rotation.y=ry;g.add(p);
 box(p,1.0,.04,.24,M.movelH,0,0,.12);for(const a of [-1,1]){const m=box(p,.04,.18,.16,M.escuro,a*.38,-.18,.08);}
 lathe(p,[[0,0],[.06,0],[.08,.09],[.05,.16],[.06,.19],[0,.19]],M.ceramica[0],-.3,.04,.12,10);
 lathe(p,[[0,0],[.05,0],[.06,.12],[.035,.15],[0,.15]],M.ceramica[2],-.12,.04,.12,10);
 lathe(p,[[0,0],[.07,0],[.07,.1],[0,.1]],M.ceramica[1],.08,.04,.12,10);box(p,.18,.05,.16,M.livros[3],.3,.04,.12,.2,null);box(p,.16,.04,.14,M.livros[1],.3,.09,.12,-.1,null);}
function quadro(g,y,x,z,ry){const p=new T.Group();p.position.set(x,y,z);p.rotation.y=ry;g.add(p);
 box(p,.9,.68,.04,M.escuro,0,0,.02);box(p,.78,.56,.012,M.quadro,0,.06,.045,0,null);}
function barril(g,y,x,z){const pts=[];for(let i=0;i<=8;i++){const t=i/8;pts.push([.24+Math.sin(t*PI)*.05,t*.72]);}pts.unshift([0,0]);pts.push([0,.72]);
 lathe(g,pts,M.movelH,x,y,z,14);for(const h of [.1,.62]){const a=new T.Mesh(new T.TorusGeometry(.26,.012,4,16),M.ferro);a.rotation.x=PI/2;a.position.set(x,y+h,z);g.add(a);}
 const a2=new T.Mesh(new T.TorusGeometry(.29,.012,4,16),M.ferro);a2.rotation.x=PI/2;a2.position.set(x,y+.36,z);g.add(a2);}
function vaso(g,y,x,z){lathe(g,[[0,0],[.13,0],[.17,.22],[.19,.26],[0,.26]],M.ceramica[0],x,y,z,12);cyl(g,.16,.16,.02,M.terra,x,y+.23,z,10);
 const R=rng(Math.floor(x*97+z*31)>>>0);for(let i=0;i<9;i++){const a=R()*6.3,h=.35+R()*.35,l=new T.Mesh(new T.ConeGeometry(.05,h,4),i%2?M.folha:M.folhaE);l.position.set(x+Math.cos(a)*.06,y+.25+h/2,z+Math.sin(a)*.06);l.rotation.set(Math.sin(a)*.4,0,-Math.cos(a)*.4);g.add(l);}}
// lambri + rodapé ao longo das paredes; portas: [{x,w}] na parede da frente
function lambri(g,y,ix,iz,portas,lados){const H=.86,e=.03;
 const faixa=(x0,x1,zw,nz)=>{const L=x1-x0;if(L<.1)return;const cx=(x0+x1)/2,zc=zw-nz*e/2;
  box(g,L,H,e,M.lambri,cx,y,zc,0,1.2);box(g,L,.14,e+.02,M.moldura,cx,y,zc-nz*.01,0,1.2);box(g,L,.05,e+.04,M.moldura,cx,y+H-.02,zc-nz*.02,0,1.2);
  const n=Math.max(1,Math.round(L/.6));for(let i=1;i<n;i++)box(g,.05,H-.18,e+.016,M.moldura,x0+i*L/n,y+.14,zc-nz*.008,0,1.2);};
 const faixaZ=(z0,z1,xw,nx)=>{const L=z1-z0;if(L<.1)return;const cz=(z0+z1)/2,xc=xw-nx*e/2;
  box(g,e,H,L,M.lambri,xc,y,cz,0,1.2);box(g,e+.02,.14,L,M.moldura,xc-nx*.01,y,cz,0,1.2);box(g,e+.04,.05,L,M.moldura,xc-nx*.02,y+H-.02,cz,0,1.2);
  const n=Math.max(1,Math.round(L/.6));for(let i=1;i<n;i++)box(g,e+.016,H-.18,.05,M.moldura,xc-nx*.008,y+.14,z0+i*L/n,0,1.2);};
 faixa(-ix+e,ix-e,-iz,-1);
 for(const sd of [1,-1]){let u=-iz;for(const p of (lados||[]).filter(q=>q.lado===sd).sort((a,b)=>a.z-b.z)){faixaZ(u,p.z-p.w/2,sd*ix,sd);u=p.z+p.w/2;}faixaZ(u,iz,sd*ix,sd);}
 let u=-ix+e;for(const p of (portas||[]).slice().sort((a,b)=>a.x-b.x)){faixa(u,p.x-p.w/2,iz,1);u=p.x+p.w/2;}faixa(u,ix-e,iz,1);}
// ---------- peças dos temas ----------
function banco(g,y,x,z,L,ry){const p=new T.Group();p.position.set(x,y,z);p.rotation.y=ry||0;g.add(p);
 box(p,L,.05,.3,M.movelH,0,.42,0);for(const a of [-1,1]){box(p,.06,.42,.26,M.movel,a*(L/2-.12),0,0);}box(p,L-.3,.04,.04,M.movel,0,.14,0);}
function mesaLonga(g,y,x,z,L,v){const D=.85,H=.76;box(g,L,.07,D,M.movelH,x,y+H-.07,z);box(g,L-.3,.12,D-.2,M.escuroH,x,y+H-.19,z);
 for(const a of [-1,1])for(const b of [-1,1])perna(g,M.movel,x+a*(L/2-.14),y,z+b*(D/2-.12),H-.12,.045);
 const R=rng(31+v*7);for(let i=0;i<3;i++){const px=x-L/2+.35+i*(L-.7)/2;cyl(g,.14,.11,.02,M.ceramica[1],px,y+H,z+(R()-.5)*.3,14);}
 lathe(g,[[0,0],[.1,0],[.12,.08],[.09,.2],[.05,.24],[.06,.27],[0,.27]],M.ceramica[0],x+L*.3,y+H,z-.2,12);sph(g,.09,M.pao,x-L*.15,y+H+.05,z,1.6,.7,1,8);}
function ervas(g,x,yTop,z,n,R){for(let i=0;i<n;i++){const xx=x+(i-(n-1)/2)*.32,len=.25+R()*.2,m=R()<.5?M.erva:M.lavanda;
 rodizio(g,[xx,yTop,z],[xx,yTop-.18,z],M.lencol,.006);for(let k=0;k<5;k++){const a=k/5*PI*2,c=new T.Mesh(new T.ConeGeometry(.022,len*(.8+R()*.3),4),m);c.rotation.set(PI+Math.sin(a)*.18,0,Math.cos(a)*.18);c.position.set(xx+Math.cos(a)*.03,yTop-.2-len*.45,z+Math.sin(a)*.03);g.add(c);}cyl(g,.035,.035,.04,M.lencol,xx,yTop-.22,z,8);}}
function saco(g,y,x,z,R){const h=.5+R()*.15;lathe(g,[[0,0],[.18,.02],[.24,.15],[.22,h*.75],[.12,h],[.06,h+.06],[0,h+.08]],M.saco,x,y,z,10);}
function caixote(g,y,x,z,ry,s){s=s||1;const p=new T.Group();p.position.set(x,y,z);p.rotation.y=ry||0;g.add(p);const W=.62*s,H=.46*s;
 box(p,W,H,W,M.movelH,0,0,0);for(const sd of [-1,1]){box(p,W+.02,.06,.06,M.escuro,0,.08,sd*W/2);box(p,W+.02,.06,.06,M.escuro,0,H-.12,sd*W/2);box(p,.06,.06,W+.02,M.escuro,sd*W/2,.08,0);box(p,.06,.06,W+.02,M.escuro,sd*W/2,H-.12,0);}}
function bancada(g,y,x,z,L,ry,R){const p=new T.Group();p.position.set(x,y,z);p.rotation.y=ry||0;g.add(p);const D=.7,H=.86;
 box(p,L,.1,D,M.movelH,0,H-.1,0);for(const a of [-1,1])for(const b of [-1,1])box(p,.1,H-.1,.1,M.escuro,a*(L/2-.1),0,b*(D/2-.1));box(p,L-.2,.05,D-.2,M.escuroH,0,.18,0);
 // morsa, serrote, martelo, plaina, aparas
 box(p,.14,.12,.12,M.ferro,L/2-.2,H,D/2-.06);box(p,.04,.04,.3,M.movel,L/2-.2,H+.06,D/2+.06);
 box(p,.55,.01,.12,M.ferro,-L/4,H,.05,.3);box(p,.16,.05,.06,M.movel,-L/4-.32,H,.05-.1,.3);
 box(p,.3,.03,.035,M.movel,.1,H,.18,1.2);box(p,.08,.06,.05,M.ferro,.17,H,.28,1.2);
 box(p,.22,.07,.08,M.movel,-.05,H,-.15,.1);box(p,.04,.05,.06,M.ferro,-.05,H+.07,-.15,.1);
 for(let i=0;i<6;i++){const a=R()*6.3;const c=new T.Mesh(new T.TorusGeometry(.03,.008,3,8,4),M.aparas);c.rotation.set(PI/2,0,a);c.position.set((R()-.5)*L*.6,H+.012,(R()-.5)*D*.5);p.add(c);}}
function painelFerramentas(g,y,x,z,ry){const p=new T.Group();p.position.set(x,y,z);p.rotation.y=ry||0;g.add(p);
 box(p,1.3,.7,.03,M.escuroH,0,0,.015);for(let i=0;i<5;i++)box(p,.04,.03,.06,M.movel,-.5+i*.25,.62,.05);
 box(p,.05,.4,.03,M.movel,-.5,.2,.05);box(p,.14,.06,.04,M.ferro,-.5,.56,.05);
 box(p,.05,.32,.03,M.movel,-.25,.26,.05);box(p,.05,.12,.03,M.ferro,-.25,.18,.05);
 box(p,.24,.3,.012,M.ferro,0,.25,.05);box(p,.1,.1,.03,M.movel,0,.52,.05);
 box(p,.04,.3,.03,M.movel,.25,.28,.05);box(p,.02,.12,.03,M.ferro,.25,.16,.05);
 const r=new T.Mesh(new T.TorusGeometry(.12,.02,5,14),M.ferro);r.position.set(.5,.36,.06);p.add(r);}
function tabuasEncostadas(g,y,x,z,ry,R){const p=new T.Group();p.position.set(x,y,z);p.rotation.y=ry||0;g.add(p);for(let i=0;i<4;i++){const b=box(p,.22,1.7+R()*.4,.04,i%2?M.movel:M.movelH,-.35+i*.24,0,.08+i*.01);b.rotation.x=-.12-R()*.05;}}
function cavalete(g,y,x,z,ry){const p=new T.Group();p.position.set(x,y,z);p.rotation.y=ry||0;g.add(p);
 for(const a of [-1,1]){for(const b of [-1,1]){const l=box(p,.06,.62,.06,M.movel,a*.42,0,b*.12);l.rotation.x=b*.22;}box(p,.06,.08,.34,M.movel,a*.42,.56,0);}
 box(p,1.1,.06,.12,M.movelH,0,.62,0);box(p,1.4,.04,.24,M.movelH,0,.68,0,.15);}
function escrivaninha(g,y,x,z,ry,v){const p=new T.Group();p.position.set(x,y,z);p.rotation.y=ry||0;g.add(p);const W=1.35,D=.68,H=.76;
 box(p,W,.05,D,M.movelH,0,H-.05,0);box(p,.42,H-.05,D-.06,M.escuro,W/2-.23,0,0);for(let i=0;i<3;i++){box(p,.36,.18,.02,M.movel,W/2-.23,.08+i*.22,D/2-.02);sph(p,.018,M.lata,W/2-.23,.18+i*.22,D/2);}
 for(const b of [-1,1])perna(p,M.movel,-W/2+.08,0,b*(D/2-.08),H-.05,.035);
 // livro aberto, pilha de livros, vela, tinteiro e pena, pergaminho, globo pequeno
 box(p,.42,.02,.3,M.papel,-.15,H,.05,.1,null);box(p,.02,.025,.3,M.livros[1],-.15,H,.05,.1,null);
 let yy=H;for(let i=0;i<4;i++){const h=.05+i%2*.02;box(p,.26-i*.02,h,.2,M.livros[(i+v)%6],W/2-.25,yy,-.18,i*.15-.2,null);yy+=h;}
 lathe(p,[[0,0],[.05,0],[.05,.012],[.015,.02],[.012,.06],[.025,.065],[0,.065]],M.lata,.25,H,-.2,8);cyl(p,.014,.014,.09,M.vela,.25,H+.065,-.2,6);sph(p,.016,M.chama,.25,H+.17,-.2,1,1.8,1,6);
 cyl(p,.035,.03,.05,M.ferro,.1,H,.18,8);const pena=box(p,.012,.2,.012,M.papel,.1,H+.04,.18,0,null);pena.rotation.z=.4;
 const rolo=new T.Mesh(new T.CylinderGeometry(.03,.03,.32,8),M.papel);rolo.rotation.z=PI/2;rolo.position.set(-.45,H+.03,-.2);p.add(rolo);
 if(M.globo){cyl(p,.06,.08,.04,M.escuro,-.52,H,.18,10);const gl=new T.Mesh(new T.SphereGeometry(.11,18,12),M.globo);gl.position.set(-.52,H+.18,.18);gl.rotation.z=.41;p.add(gl);const ar=new T.Mesh(new T.TorusGeometry(.125,.008,4,20),M.lata);ar.position.copy(gl.position);ar.rotation.y=PI/2;p.add(ar);}}
function poltrona(g,y,x,z,ry,m){const p=new T.Group();p.position.set(x,y,z);p.rotation.y=ry||0;g.add(p);const W=.7;
 box(p,W,.38,.62,M.escuro,0,0,0);box(p,W-.08,.12,.56,m,0,.38,.02,0,null);box(p,W,.62,.12,M.escuro,0,.38,-.26);box(p,W-.1,.5,.06,m,0,.45,-.2,0,null);
 for(const a of [-1,1]){box(p,.1,.26,.6,M.escuro,a*(W/2-.05),.38,0);box(p,.12,.05,.62,M.movel,a*(W/2-.05),.64,0);}}
function balcao(g,y,x,z,L,ry,R){const p=new T.Group();p.position.set(x,y,z);p.rotation.y=ry||0;g.add(p);const D=.6,H=1.05;
 box(p,L,H-.06,D-.1,M.escuroH,0,0,-.05);box(p,L+.08,.07,D+.04,M.movelH,0,H-.07,0);for(let i=0;i<=Math.round(L/.5);i++)box(p,.05,H-.16,.03,M.movel,-L/2+i*L/Math.round(L/.5),.05,D/2-.08);
 box(p,L,.06,.08,M.lata,0,.1,D/2-.02);
 for(let i=0;i<5;i++){const cx=-L/2+.3+i*(L-.6)/4,cz=(R()-.5)*.2;lathe(p,[[0,0],[.045,0],[.05,.13],[0,.13]],i%2?M.ceramica[1]:M.estanho,cx,H,cz,10);const a=new T.Mesh(new T.TorusGeometry(.03,.008,4,8),i%2?M.ceramica[1]:M.estanho);a.position.set(cx+.055,H+.07,cz);a.rotation.y=PI/2;p.add(a);}}
function barrilDeitado(g,y,x,z,ry){const p=new T.Group();p.position.set(x,y,z);p.rotation.y=ry||0;g.add(p);const pts=[];for(let i=0;i<=8;i++){const t=i/8;pts.push([.22+Math.sin(t*PI)*.05,t*.62-.31]);}pts.unshift([0,-.31]);pts.push([0,.31]);
 const b=new T.Mesh(new T.LatheGeometry(pts.map(q=>new T.Vector2(q[0],q[1])),14),M.movelH);b.rotation.z=PI/2;b.position.y=.29;p.add(b);for(const h of [-.22,.22]){const a=new T.Mesh(new T.TorusGeometry(.245,.012,4,16),M.ferro);a.rotation.y=PI/2;a.position.set(h,.29,0);p.add(a);}
 cyl(p,.025,.025,.06,M.lata,.32,.27,0,6,0,PI/2);for(const a of [-1,1])box(p,.08,.12,.5,M.escuro,a*.2,0,0);}
function mesaRedonda(g,y,x,z,R){cyl(g,.45,.45,.05,M.movelH,x,y+.72,z,18);lathe(g,[[0,0],[.22,0],[.22,.04],[.06,.08],[.05,.6],[.09,.72],[0,.72]],M.movel,x,y,z,10);
 for(let i=0;i<2;i++){const a=R()*6.3;lathe(g,[[0,0],[.045,0],[.05,.13],[0,.13]],M.estanho,x+Math.cos(a)*.22,y+.77,z+Math.sin(a)*.22,10);}}
function banquinho(g,y,x,z){cyl(g,.18,.18,.05,M.movelH,x,y+.44,z,12);for(let i=0;i<3;i++){const a=i/3*PI*2;const l=box(g,.04,.46,.04,M.movel,x+Math.cos(a)*.1,y,z+Math.sin(a)*.1);l.rotation.set(Math.sin(a)*.12,0,-Math.cos(a)*.12);}}
function estanteFrascos(g,y,x,z,ry,R){const p=new T.Group();p.position.set(x,y,z);p.rotation.y=ry||0;g.add(p);const W=1.4,H=1.9,D=.32;
 for(const sx of [-1,1])box(p,.05,H,D,M.escuro,sx*(W/2-.025),0,0);box(p,W,.02,.02,M.escuro,0,0,-D/2+.01);box(p,W-.06,H-.08,.02,M.escuroH,0,.04,-D/2+.02);box(p,W+.08,.06,D+.04,M.escuro,0,H,0);
 for(let i=0;i<4;i++){const sy=.1+i*.45;box(p,W-.08,.03,D-.04,M.movelH,0,sy,0);let xx=-W/2+.12;
  while(xx<W/2-.12){const r=.035+R()*.035,h=.1+R()*.14,m=M.frascos[Math.floor(R()*M.frascos.length)];
   lathe(p,[[0,0],[r,0],[r,h*.6],[r*.45,h*.8],[r*.4,h],[r*.5,h+.01],[0,h+.01]],m,xx+r,sy+.03,(R()-.5)*.08,10);cyl(p,r*.42,r*.42,.025,M.escuro,xx+r,sy+.03+h,(R()-.5)*.02,6);xx+=r*2+.03+R()*.03;}}}
function almofariz(g,y,x,z){lathe(g,[[0,0],[.08,0],[.09,.08],[.07,.09],[.06,.03],[0,.03]],M.pedra,x,y,z,12);const pl=box(g,.025,.16,.025,M.movel,x+.02,y+.05,z,0,null);pl.rotation.z=.35;}
function estanteTecidos(g,y,x,z,ry,R){const p=new T.Group();p.position.set(x,y,z);p.rotation.y=ry||0;g.add(p);const W=1.4,H=1.8,D=.4;
 for(const sx of [-1,1])box(p,.05,H,D,M.escuro,sx*(W/2-.025),0,0);box(p,W-.06,H-.08,.02,M.escuroH,0,.04,-D/2+.02);box(p,W+.08,.06,D+.04,M.escuro,0,H,0);
 for(let i=0;i<3;i++){const sy=.1+i*.58;box(p,W-.08,.03,D-.04,M.movelH,0,sy,0);for(let k=0;k<4;k++){const r=.09+R()*.03,rl=new T.Mesh(new T.CylinderGeometry(r,r,D-.08,12),M.tecidos[Math.floor(R()*M.tecidos.length)]);rl.rotation.x=PI/2;rl.position.set(-W/2+.2+k*(W-.4)/3,sy+.03+r,0);p.add(rl);}}}
function manequim(g,y,x,z,ry,m){const p=new T.Group();p.position.set(x,y,z);p.rotation.y=ry||0;g.add(p);
 for(let i=0;i<3;i++){const a=i/3*PI*2;const l=box(p,.04,.05,.32,M.escuro,Math.cos(a)*.13,0,Math.sin(a)*.13);l.rotation.y=-a+PI/2;}
 cyl(p,.025,.025,1.05,M.escuro,0,0,0,8);lathe(p,[[0,0],[.15,0],[.19,.12],[.15,.3],[.2,.48],[.17,.58],[.07,.64],[.05,.7],[0,.7]],m,0,1.0,0,16);sph(p,.05,M.lata,0,1.72,0);}
function mesaCorte(g,y,x,z,L,v,R){const D=.9,H=.82;box(g,L,.06,D,M.movelH,x,y+H-.06,z);for(const a of [-1,1])for(const b of [-1,1])box(g,.08,H-.06,.08,M.escuro,x+a*(L/2-.1),y,z+b*(D/2-.1));
 box(g,L*.6,.012,D*.7,M.tecidos[v%M.tecidos.length],x-.1,y+H,z,.08,null);const t1=box(g,.16,.01,.02,M.ferro,x+L*.3,y+H+.012,z+.2,.6,null);
 for(let i=0;i<3;i++)cyl(g,.03,.03,.06,M.tecidos[(i+2)%M.tecidos.length],x+L*.3+i*.08,y+H,z-.25,10);}
// ---------- sala completa com temas (antes todas as casas tinham a mesma mobília) ----------
const TEMAS=['quarto','cozinha','oficina','estudo','taverna','boticario','alfaiataria'];
const temaDe=(v,sem)=>{let t=TEMAS[(v*5+Math.floor(v/7))%TEMAS.length];if(sem&&sem.cama&&t==='quarto')t='estudo';return t;};
function pisoDe(v,sem){if(!M)materiais();const t=temaDe(v,sem);return t==='cozinha'||t==='boticario'?M.pisoPedra:(t==='oficina'||t==='taverna')?M.pisoEscuro:(v%2?M.piso:M.pisoClaro);}
// o: {iw,id,y,top,s(lado da cama ±1),portas:[{x,w}],lados,v(variação),pequena,sem:{cama,estante,prateleira,lareira},tema}
function salaBase(g,o){if(!M)materiais();const ix=o.iw/2,iz=o.id/2,y=o.y,s=o.s||1,v=o.v||0,sem=o.sem||{},R=rng(101+v*37);
 const tema=o.tema||temaDe(v,sem),dx=o.portas&&o.portas[0]?o.portas[0].x:0;
 const livre=x=>Math.abs(x-dx)>1.25; // não bloquear a porta
 M.lambri=M.lambris[v%M.lambris.length];M.moldura=M.molduras[v%M.molduras.length];
 lambri(g,y,ix,iz,o.portas,o.lados);
 const tapete=(rw,rd,x,z)=>box(g,rw,.022,rd,M.tapetes[(v+1)%M.tapetes.length],x||0,y,z==null?.1:z,0,null);
 if(o.pequena){if(!sem.cama)cama(g,y,s*(ix-1.12),-iz+.64,s,v);else armario(g,y,s*(ix-.75),-iz+.32,0);tapete(Math.min(2,o.iw*.4),Math.min(1.3,o.id*.35));
  if(tema==='cozinha'||tema==='boticario')ervas(g,0,o.top-.14,-iz*.3,3,R);else cadeira(g,y,-s*(ix-.5),.2,s*PI/2);
  lampiao(g,0,o.top-.12,0);if(o.id>2.6&&livre(-s*(ix-.35)))vaso(g,y,-s*(ix-.35),iz-.4);return tema;}
 const camaCanto=()=>{if(sem.cama)return false;cama(g,y,s*(ix-1.12),-iz+.64,s,v);return true;};
 const fogo=(z)=>{if(!sem.lareira)lareira(g,y,s*ix,z==null?.35:z,-s,o.top);};
 const luz=(n)=>{if(n>1&&o.iw>5){lampiao(g,-o.iw/4,o.top-.12,0);lampiao(g,o.iw/4,o.top-.12,0);}else lampiao(g,0,o.top-.12,0);};
 const canto=(fn)=>{for(const sd of [-s,s]){const x=sd*(ix-.42);if(livre(x)){fn(x,iz-.45);return;}}};
 if(tema==='quarto'){
  tapete(Math.min(2.6,o.iw*.45),Math.min(1.7,o.id*.4));
  if(camaCanto())bau(g,y,s*(ix-1.12),-iz+1.62,0);
  if(!sem.estante)estante(g,y,-s*(ix-.85),-iz+.26,0,v);
  const tx=-s*Math.min(o.iw*.18,1.3);mesa(g,y,tx,.35,v);for(const a of [-1,1])cadeira(g,y,tx+a*.92,.35,-a*PI/2);
  fogo(sem.cama?-.2:.35);luz(1);quadro(g,y+1.45,0,-iz,0);
  if(!sem.prateleira)prateleira(g,y+1.55,-s*(ix-.02),-.9,s*PI/2);canto((x,z)=>barril(g,y,x,z));if(o.iw>4.6&&livre(s*(ix-.4)))vaso(g,y,s*(ix-.4),iz-.45);}
 else if(tema==='cozinha'){
  camaCanto();armario(g,y,-s*(ix-.75),-iz+.32,0);fogo(sem.cama?-.2:.45);
  const L=Math.min(2.2,o.iw*.42);mesaLonga(g,y,-s*.25,.25,L,v);banco(g,y,-s*.25,-.42,L-.2,0);banco(g,y,-s*.25,.92,L-.2,0);
  if(!sem.prateleira)prateleira(g,y+1.55,-s*(ix-.02),-.6,s*PI/2);
  ervas(g,-s*.25,o.top-.14,.25,5,R);canto((x,z)=>{saco(g,y,x,z,R);saco(g,y,x+(x<0?.45:-.45),z+.05,R);barril(g,y,x,z-.6);});luz(1);}
 else if(tema==='oficina'){
  camaCanto();const L=Math.min(1.9,o.iw*.36),bxx=-s*(ix-L/2-.35);bancada(g,y,bxx,-iz+.4,L,0,R);painelFerramentas(g,y+1.2,bxx,-iz,0);banquinho(g,y,bxx+.2,-iz+1.15);
  tabuasEncostadas(g,y,-s*(ix-.05),.2,s*PI/2,R);cavalete(g,y,s*.3,.55,.4);fogo(sem.cama?-.2:.35);
  canto((x,z)=>{caixote(g,y,x,z,.2);caixote(g,y+.46,x+.05,z-.03,-.15,.85);caixote(g,y,x+(x<0?.68:-.68),z,0,.9);});luz(1);}
 else if(tema==='estudo'){
  tapete(Math.min(2.4,o.iw*.42),Math.min(1.6,o.id*.38),0,.25);
  if(camaCanto())bau(g,y,s*(ix-1.12),-iz+1.62,0);
  if(!sem.estante){estante(g,y,-s*(ix-.85),-iz+.26,0,v);estante(g,y,-s*(ix-.25),.2,s*PI/2,v+3);}
  escrivaninha(g,y,-s*.4,-iz+.75,0,v);cadeira(g,y,-s*.4,-iz+1.45,PI);
  fogo(sem.cama?-.2:.6);poltrona(g,y,s*(ix-1.35),1.05,-s*PI/2,M.tecidos[(v+1)%M.tecidos.length]);luz(1);quadro(g,y+1.45,s*.9,-iz,0);}
 else if(tema==='taverna'){
  const L=Math.min(2.8,o.id*.62);balcao(g,y,-s*(ix-1.05),.05,L,s*PI/2,R);
  for(let k=0;k<3;k++)barrilDeitado(g,y+(k===2?.55:0),-s*(ix-.34),-.6+(k%2)*.62+(k===2?.31:0),0);
  const nT=o.iw>6?2:1;for(let k=0;k<nT;k++){const mx=s*(.2+k*1.5)-(nT>1?s*.5:0),mz=k%2?.9:-.2;mesaRedonda(g,y,mx,mz,R);for(let q=0;q<3;q++){const a=q/3*PI*2+.4;banquinho(g,y,mx+Math.cos(a)*.75,mz+Math.sin(a)*.75);}}
  fogo(-.2);luz(2);quadro(g,y+1.5,0,-iz,0);canto((x,z)=>barril(g,y,x,z));}
 else if(tema==='boticario'){
  tapete(Math.min(1.8,o.iw*.32),Math.min(1.2,o.id*.3),-s*.3,.5);camaCanto();
  estanteFrascos(g,y,-s*(ix-.8),-iz+.24,0,R);if(!sem.estante)estanteFrascos(g,y,-s*(ix-.22),.55,s*PI/2,R);
  {const tx=-s*.2,tz=.15;mesa(g,y,tx,tz,v+1);almofariz(g,y+.76,tx-.35,tz+.15);for(let i=0;i<4;i++){const m=M.frascos[i%M.frascos.length];lathe(g,[[0,0],[.05,0],[.06,.05],[.02,.1],[.02,.16],[0,.16]],m,tx+.1+i*.11,y+.76,tz-.2,10);}cadeira(g,y,tx,tz+.85,PI);}
  ervas(g,0,o.top-.14,-.4,6,R);fogo(sem.cama?-.2:.35);canto((x,z)=>{saco(g,y,x,z,R);barril(g,y,x+(x<0?.5:-.5),z);});luz(1);}
 else { // alfaiataria
  tapete(Math.min(2.4,o.iw*.42),Math.min(1.6,o.id*.38));if(camaCanto())bau(g,y,s*(ix-1.12),-iz+1.62,0);
  estanteTecidos(g,y,-s*(ix-.8),-iz+.28,0,R);mesaCorte(g,y,-s*.3,.25,Math.min(1.8,o.iw*.34),v,R);cadeira(g,y,-s*.3,1.05,PI);
  canto((x,z)=>manequim(g,y,x,z-.1,0,M.tecidos[(v+2)%M.tecidos.length]));fogo(sem.cama?-.2:.35);luz(1);quadro(g,y+1.45,s*.6,-iz,0);
  if(!sem.prateleira)prateleira(g,y+1.55,-s*(ix-.02),.4,s*PI/2);}
 return tema;}
// Colisão dos móveis (antes o personagem atravessava cama, mesa, estante, lareira...): depois de montar a sala, mede
// cada peça nova que fica no chão (sem tapete, quadro, lampião, prateleira de parede e lambri), junta as que se tocam
// (pernas, tampo, cadeiras) e devolve caixas no espaço do grupo em o.colisores = [{x,z,hw,hd}].
function caixaLocal(c,inv){const b=new T.Box3(),t=new T.Box3(),m4=new T.Matrix4();c.traverse(q=>{if(!q.isMesh||!q.geometry)return;if(!q.geometry.boundingBox)q.geometry.computeBoundingBox();m4.multiplyMatrices(inv,q.matrixWorld);t.copy(q.geometry.boundingBox).applyMatrix4(m4);b.union(t);});return b;}
function sala(g,o){const n0=g.children.length,tema=salaBase(g,o);
 if(o&&Array.isArray(o.colisores)){g.updateWorldMatrix(true,true);const inv=new T.Matrix4().copy(g.matrixWorld).invert(),y=o.y,ix=o.iw/2,iz=o.id/2,bs=[];
  for(let i=n0;i<g.children.length;i++){const b=caixaLocal(g.children[i],inv);if(b.isEmpty())continue;const sx=b.max.x-b.min.x,sz=b.max.z-b.min.z,sy=b.max.y-b.min.y,cx=(b.min.x+b.max.x)/2,cz=(b.min.z+b.max.z)/2;
   if(sy<.12||b.min.y>y+.6)continue;
   if(Math.min(sx,sz)<.09&&(Math.abs(Math.abs(cx)-ix)<.3||Math.abs(Math.abs(cz)-iz)<.3))continue;
   bs.push(b);}
  const gr=[];for(const b of bs){const q=gr.find(q=>q.clone().expandByScalar(.08).intersectsBox(b));if(q)q.union(b);else gr.push(b.clone());}
  for(let it=0;it<3;it++)for(let i=0;i<gr.length;i++)for(let j=gr.length-1;j>i;j--)if(gr[i].clone().expandByScalar(.08).intersectsBox(gr[j])){gr[i].union(gr[j]);gr.splice(j,1);}
  for(const b of gr){const hw=(b.max.x-b.min.x)/2,hd=(b.max.z-b.min.z)/2;if(hw*hd<.02)continue;o.colisores.push({x:(b.min.x+b.max.x)/2,z:(b.min.z+b.max.z)/2,hw:hw+.04,hd:hd+.04});}}
 return tema;}
window.arcanoMoveis={sala,pisoDe,temaDe,armario,lampiao,cama,mesa,cadeira,estante,bau,lareira,barril,vaso,lambri,get M(){if(!M)materiais();return M;}};
})();
