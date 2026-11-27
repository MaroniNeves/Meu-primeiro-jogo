/* Interior do Castelo de Aurora — salas acabadas e mobiliadas (site v61).
   castelo-anime.js levanta paredes, piso e escada de cada andar e chama window.arcanoCasteloSalas.mobiliar(ctx).
   - Acabamento em todas as salas: lambri de madeira com rodapé, almofadas, montantes e roda-meio; cornija no alto
     das paredes; piso de tacos em espinha de peixe, mármore ou pedra conforme a sala; tochas de parede.
   - Alinhamento: nada fica na frente das janelas — as cortinas (agora mais estreitas) ficam livres e os móveis vão
     nos panos de parede entre elas ou nas paredes internas, sempre encostados no lambri.
   - Peças completas: pernas torneadas, almofadas, molduras, puxadores, lareiras com boca em arco e chaminé até o
     teto, camas com dossel, estantes com cornija e livros variados, órgão, cravo, harpa, bancos de capela, altar,
     vitral, armeiros com espadas e lanças, escudos com brasão, vitrines, baús abertos com moedas, mecanismo do relógio.
   - Vida: mesas postas, flores, livros abertos, velas acesas, gato dormindo, passarinho na gaiola, e peças que se
     mexem (engrenagens, pêndulo, corda do sino, globos e esfera armilar) — a lista vai também para o Godot. */
(function(){
'use strict';
const T=window.THREE;if(!T)return;
const PI=Math.PI;
let K=null,M=null,R=null;
function rng(s){s=(s>>>0)||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function cv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h||w;return c;}
function tx(c,srgb){const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;if(srgb!==false)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
const mat=o=>new T.MeshStandardMaterial(Object.assign({roughness:.9,metalness:0},o));

// ================= texturas pintadas =================
// Tacos em espinha de peixe (2:1), sem emenda: a malha de pares se repete a cada 4×4 unidades.
function parquet(h,l,seed){const S=512,u=32,c=cv(S),b=cv(S),g=c.getContext('2d'),q=b.getContext('2d'),r=rng(seed);
 g.fillStyle=`hsl(${h},30%,${Math.max(8,l-18)}%)`;g.fillRect(0,0,S,S);q.fillStyle='#2a2a2a';q.fillRect(0,0,S,S);
 const plank=(x,y,w,hh,vert)=>{const L=l+(r()-.5)*12,H=h+(r()-.5)*8,Sa=34+(r()-.5)*12,veios=[];for(let k=0;k<3;k++)veios.push(r());
  for(const ox of [0,-S])for(const oy of [0,-S]){const X=x+ox,Y=y+oy;if(X>=S||Y>=S||X+w<=0||Y+hh<=0)continue;
   const gr=vert?g.createLinearGradient(X,0,X+w,0):g.createLinearGradient(0,Y,0,Y+hh);gr.addColorStop(0,`hsl(${H},${Sa}%,${L+5}%)`);gr.addColorStop(1,`hsl(${H},${Sa}%,${L-6}%)`);
   g.fillStyle=gr;g.fillRect(X+1,Y+1,w-2,hh-2);g.strokeStyle=`hsla(${H-6},${Sa}%,${Math.max(5,L-18)}%,.4)`;g.lineWidth=1;
   for(const v of veios){g.beginPath();if(vert){const xx=X+3+v*(w-6);g.moveTo(xx,Y+2);g.bezierCurveTo(xx+3,Y+hh*.3,xx-3,Y+hh*.7,xx+1,Y+hh-2);}else{const yy=Y+3+v*(hh-6);g.moveTo(X+2,yy);g.bezierCurveTo(X+w*.3,yy+3,X+w*.7,yy-3,X+w-2,yy+1);}g.stroke();}
   g.fillStyle='rgba(255,255,255,.07)';if(vert)g.fillRect(X+1,Y+1,2,hh-2);else g.fillRect(X+1,Y+1,w-2,2);
   q.fillStyle='#a8a8a8';q.fillRect(X+1.5,Y+1.5,w-3,hh-3);q.fillStyle='#c4c4c4';q.fillRect(X+3,Y+3,w-6,hh-6);}};
 for(let a=0;a<16;a++)for(let bb=0;bb<4;bb++){const x=(((a+2*bb)*u)%S+S)%S,y=(((a-2*bb)*u)%S+S)%S;plank(x,y,2*u,u,false);plank((x+2*u)%S,((y-u)%S+S)%S,u,2*u,true);}
 return {map:tx(c),bump:tx(b,false)};}
function tapeteTex(P,seed){const W=512,H=320,c=cv(W,H),g=c.getContext('2d'),r=rng(seed);
 g.fillStyle=P[1];g.fillRect(0,0,W,H);g.fillStyle=P[0];g.fillRect(36,36,W-72,H-72);
 g.strokeStyle=P[2];g.lineWidth=4;g.strokeRect(10,10,W-20,H-20);g.strokeRect(30,30,W-60,H-60);g.lineWidth=2;g.strokeRect(44,44,W-88,H-88);
 const flor=(x,y,s,c1,c2)=>{g.fillStyle=c1;for(let k=0;k<4;k++){g.beginPath();g.ellipse(x+Math.cos(k*PI/2)*s*.55,y+Math.sin(k*PI/2)*s*.55,s*.45,s*.28,k*PI/2,0,6.3);g.fill();}g.fillStyle=c2;g.beginPath();g.arc(x,y,s*.25,0,6.3);g.fill();};
 for(let x=24;x<W;x+=26){flor(x,20,9,P[2],P[3]);flor(x,H-20,9,P[2],P[3]);}for(let y=46;y<H-30;y+=26){flor(20,y,9,P[2],P[3]);flor(W-20,y,9,P[2],P[3]);}
 const cx=W/2,cy=H/2;for(let k=5;k>=1;k--){g.fillStyle=k%2?P[3]:P[2];g.beginPath();g.moveTo(cx,cy-k*22);g.lineTo(cx+k*40,cy);g.lineTo(cx,cy+k*22);g.lineTo(cx-k*40,cy);g.closePath();g.fill();}
 flor(cx,cy,20,P[0],P[1]);
 for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){g.fillStyle=P[2];g.beginPath();g.moveTo(cx+sx*(W/2-46),cy+sy*(H/2-46));g.lineTo(cx+sx*(W/2-116),cy+sy*(H/2-46));g.lineTo(cx+sx*(W/2-46),cy+sy*(H/2-104));g.closePath();g.fill();flor(cx+sx*(W/2-64),cy+sy*(H/2-64),10,P[3],P[1]);}
 g.strokeStyle=P[2];g.globalAlpha=.5;g.lineWidth=2;for(let i=0;i<30;i++){const x=60+r()*(W-120),y=56+r()*(H-112);if(Math.abs(x-cx)<200&&Math.abs(y-cy)<100)continue;g.beginPath();g.arc(x,y,6+r()*8,r()*6,r()*6+3.5);g.stroke();}g.globalAlpha=1;
 for(let i=0;i<9000;i++){g.fillStyle=`rgba(${r()<.5?'255,240,220':'30,10,5'},${.03+r()*.05})`;g.fillRect(r()*W,r()*H,1+r()*2,1);}
 const t=tx(c);t.wrapS=t.wrapT=T.ClampToEdgeWrapping;return t;}
function franjaTex(){const c=cv(64,16),g=c.getContext('2d');for(let x=1;x<64;x+=4){g.fillStyle='#efe6cf';g.fillRect(x,0,2,13+(x%3));}const t=tx(c);return t;}
function mapaTex(seed){const W=512,H=384,c=cv(W,H),g=c.getContext('2d'),r=rng(seed);
 const gr=g.createRadialGradient(W/2,H/2,40,W/2,H/2,W*.65);gr.addColorStop(0,'#f1e3bd');gr.addColorStop(1,'#c9a874');g.fillStyle=gr;g.fillRect(0,0,W,H);
 for(let i=0;i<40;i++){g.fillStyle=`rgba(120,80,30,${.02+r()*.05})`;g.beginPath();g.arc(r()*W,r()*H,8+r()*40,0,6.3);g.fill();}
 g.strokeStyle='rgba(60,90,120,.25)';g.lineWidth=1;for(let i=0;i<90;i++){const x=r()*W,y=r()*H;g.beginPath();g.moveTo(x-6,y);g.quadraticCurveTo(x-3,y-3,x,y);g.quadraticCurveTo(x+3,y-3,x+6,y);g.stroke();}
 for(let i=0;i<6;i++){const cx=70+r()*(W-140),cy=60+r()*(H-120),R0=24+r()*52,ph=r()*9;g.beginPath();for(let k=0;k<=48;k++){const a=k/48*6.283,rr=R0*(.72+.28*Math.sin(a*3+ph)+.12*Math.sin(a*7+ph*2));const x=cx+Math.cos(a)*rr*1.3,y=cy+Math.sin(a)*rr;k?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();
  g.fillStyle='#dcc690';g.fill();g.strokeStyle='#6b4a22';g.lineWidth=2.2;g.stroke();g.save();g.clip();
  for(let k=0;k<12;k++){const x=cx+(r()-.5)*R0*2,y=cy+(r()-.5)*R0*1.4;g.fillStyle='#8a6a3a';g.beginPath();g.moveTo(x-6,y+5);g.lineTo(x,y-7);g.lineTo(x+6,y+5);g.closePath();g.fill();}
  for(let k=0;k<22;k++){g.fillStyle='rgba(70,110,50,.7)';g.beginPath();g.arc(cx+(r()-.5)*R0*2,cy+(r()-.5)*R0*1.4,2.5,0,6.3);g.fill();}g.restore();
  g.fillStyle='#8a2a22';g.beginPath();g.arc(cx+(r()-.5)*R0,cy+(r()-.5)*R0*.6,3.5,0,6.3);g.fill();}
 g.setLineDash([5,4]);g.strokeStyle='rgba(138,42,34,.7)';g.lineWidth=1.6;g.beginPath();g.moveTo(40,H-60);for(let k=1;k<8;k++)g.lineTo(40+k*(W-80)/7,H-60-Math.sin(k*1.3)*90-k*20);g.stroke();g.setLineDash([]);
 g.strokeStyle='rgba(90,60,30,.35)';g.lineWidth=1;for(let i=1;i<8;i++){g.beginPath();g.moveTo(i*W/8,0);g.lineTo(i*W/8,H);g.stroke();}for(let j=1;j<6;j++){g.beginPath();g.moveTo(0,j*H/6);g.lineTo(W,j*H/6);g.stroke();}
 {const x=W-70,y=70;g.save();g.translate(x,y);for(let a=0;a<8;a++){g.rotate(PI/4);g.fillStyle=a%2?'#e8d6a8':'#8a2a22';g.beginPath();g.moveTo(0,-(a%2?22:38));g.lineTo(6,0);g.lineTo(-6,0);g.fill();}g.strokeStyle='#5a3a22';g.lineWidth=2;g.beginPath();g.arc(0,0,26,0,6.3);g.stroke();g.restore();}
 g.strokeStyle='#5a3a22';g.lineWidth=8;g.strokeRect(4,4,W-8,H-8);g.lineWidth=2;g.strokeRect(14,14,W-28,H-28);
 const t=tx(c);t.wrapS=t.wrapT=T.ClampToEdgeWrapping;return t;}
function paginasTex(){const c=cv(256,160),g=c.getContext('2d');g.fillStyle='#f4ead0';g.fillRect(0,0,256,160);g.fillStyle='rgba(120,90,50,.18)';g.fillRect(124,0,8,160);
 g.fillStyle='rgba(40,30,25,.55)';const r=rng(3);for(const x0 of [14,140])for(let y=18;y<146;y+=8){const w=90+r()*12;if(r()<.08)continue;g.fillRect(x0,y,w*(y>130?.5:1),2);}
 g.fillStyle='#8a2a22';g.font='bold 22px serif';g.fillText('A',14,40);return tx(c);}
function vitralTex(){const W=256,H=384,c=cv(W,H),g=c.getContext('2d'),r=rng(9);const cols=['#c0392b','#2e5fa8','#e0b43a','#2f8a4e','#7b3fa0','#e67e22','#5dade2'];
 for(let y=0;y<H;y+=24)for(let x=-12;x<W;x+=24){g.fillStyle=cols[Math.floor(r()*cols.length)];g.beginPath();g.moveTo(x+12,y);g.lineTo(x+24,y+12);g.lineTo(x+12,y+24);g.lineTo(x,y+12);g.closePath();g.fill();}
 const cx=W/2,cy=H*.42;for(let k=0;k<16;k++){const a=k/16*6.283;g.fillStyle=k%2?'#f4d03f':'#e67e22';g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.cos(a-.2)*100,cy+Math.sin(a-.2)*100);g.lineTo(cx+Math.cos(a+.2)*100,cy+Math.sin(a+.2)*100);g.closePath();g.fill();}
 g.fillStyle='#fff3c4';g.beginPath();g.arc(cx,cy,34,0,6.3);g.fill();g.fillStyle='#3f7fd0';g.beginPath();g.arc(cx,cy,16,0,6.3);g.fill();
 g.strokeStyle='#1d1a22';g.lineWidth=3;for(let y=0;y<H;y+=24)for(let x=-12;x<W;x+=24){g.beginPath();g.moveTo(x+12,y);g.lineTo(x+24,y+12);g.lineTo(x+12,y+24);g.lineTo(x,y+12);g.closePath();g.stroke();}
 for(let k=0;k<16;k++){const a=k/16*6.283;g.beginPath();g.moveTo(cx+Math.cos(a)*34,cy+Math.sin(a)*34);g.lineTo(cx+Math.cos(a)*100,cy+Math.sin(a)*100);g.stroke();}
 g.lineWidth=6;g.beginPath();g.arc(cx,cy,100,0,6.3);g.stroke();g.beginPath();g.arc(cx,cy,34,0,6.3);g.stroke();g.strokeRect(3,3,W-6,H-6);
 const t=tx(c);t.wrapS=t.wrapT=T.ClampToEdgeWrapping;return t;}
function moedasTex(){const S=256,c=cv(S),g=c.getContext('2d'),r=rng(31);g.fillStyle='#8a5a12';g.fillRect(0,0,S,S);
 for(let i=0;i<300;i++){const x=r()*S,y=r()*S,rr=8+r()*5,ry=rr*(.55+r()*.45),a=r()*3;for(const ox of [0,-S,S])for(const oy of [0,-S,S]){
  const X=x+ox,Y=y+oy;if(X<-20||Y<-20||X>S+20||Y>S+20)continue;const gr=g.createRadialGradient(X-rr*.3,Y-ry*.3,1,X,Y,rr);gr.addColorStop(0,'#fff2b0');gr.addColorStop(.5,'#e8b83a');gr.addColorStop(1,'#9a6a12');
  g.fillStyle=gr;g.beginPath();g.ellipse(X,Y,rr,ry,a,0,6.3);g.fill();g.strokeStyle='rgba(90,55,10,.6)';g.lineWidth=1;g.stroke();}}
 return tx(c);}
function toalhaTex(cor){const c=cv(256,128),g=c.getContext('2d');g.fillStyle='#f5efe2';g.fillRect(0,0,256,128);
 for(let y=0;y<128;y+=2){g.fillStyle='rgba(120,100,70,.05)';g.fillRect(0,y,256,1);}for(let x=0;x<256;x+=2){g.fillStyle='rgba(120,100,70,.04)';g.fillRect(x,0,1,128);}
 g.fillStyle=cor;g.fillRect(0,8,256,6);g.fillRect(0,114,256,6);g.fillStyle='#d8b45a';g.fillRect(0,17,256,2);g.fillRect(0,109,256,2);
 const t=tx(c);return t;}
function relogioTex(){const S=256,c=cv(S),g=c.getContext('2d');g.fillStyle='#3a2a1a';g.fillRect(0,0,S,S);
 g.fillStyle='#f3e8cc';g.beginPath();g.arc(S/2,S/2,S*.46,0,6.3);g.fill();g.strokeStyle='#b8902e';g.lineWidth=8;g.stroke();
 g.fillStyle='#2a2018';g.font='bold 22px serif';g.textAlign='center';g.textBaseline='middle';const N=['XII','I','II','III','IIII','V','VI','VII','VIII','IX','X','XI'];
 for(let i=0;i<12;i++){const a=i/12*6.283-PI/2;g.fillText(N[i],S/2+Math.cos(a)*S*.36,S/2+Math.sin(a)*S*.36);g.fillRect(S/2+Math.cos(a)*S*.43-2,S/2+Math.sin(a)*S*.43-2,4,4);}
 g.strokeStyle='#2a2018';g.lineCap='round';g.lineWidth=7;g.beginPath();g.moveTo(S/2,S/2);g.lineTo(S/2+S*.18,S/2-S*.1);g.stroke();g.lineWidth=4;g.beginPath();g.moveTo(S/2,S/2);g.lineTo(S/2-S*.06,S/2-S*.33);g.stroke();
 g.fillStyle='#b8902e';g.beginPath();g.arc(S/2,S/2,9,0,6.3);g.fill();const t=tx(c);t.wrapS=t.wrapT=T.ClampToEdgeWrapping;return t;}
function tecladoTex(){const c=cv(256,32),g=c.getContext('2d');g.fillStyle='#f6f0e0';g.fillRect(0,0,256,32);g.fillStyle='#2a2420';for(let i=0;i<=32;i++)g.fillRect(i*8,0,1,32);
 for(let i=0;i<32;i++){const n=i%7;if(n===2||n===6)continue;g.fillRect(i*8+5,0,5,19);}const t=tx(c);t.wrapS=t.wrapT=T.ClampToEdgeWrapping;return t;}
function brasaoTex(campo,forma,metal){const W=128,H=160,c=cv(W,H),g=c.getContext('2d');g.fillStyle=campo;g.fillRect(0,0,W,H);
 g.fillStyle=metal;g.strokeStyle='rgba(40,20,10,.6)';g.lineWidth=2;g.save();g.translate(W/2,H*.44);
 if(forma===0){for(let k=0;k<16;k++){g.rotate(PI/8);g.beginPath();g.moveTo(-6,0);g.lineTo(0,k%2?-30:-44);g.lineTo(6,0);g.closePath();g.fill();}g.beginPath();g.arc(0,0,14,0,6.3);g.fill();g.stroke();}
 else if(forma===1){g.fillRect(-48,-8,96,16);g.fillRect(-8,-60,16,120);}
 else if(forma===2){for(const [x,y] of [[-22,-24],[22,-24],[0,14]]){g.beginPath();g.moveTo(x,y-20);g.lineTo(x+17,y+12);g.lineTo(x-17,y+12);g.closePath();g.fill();g.stroke();}}
 else if(forma===3){g.beginPath();g.moveTo(-60,-70);g.lineTo(60,70);g.lineTo(60,40);g.lineTo(-30,-70);g.closePath();g.fill();g.beginPath();g.arc(0,0,20,0,6.3);g.fill();g.stroke();}
 else{g.beginPath();g.moveTo(-26,-40);g.lineTo(-26,-60);g.lineTo(-13,-48);g.lineTo(0,-64);g.lineTo(13,-48);g.lineTo(26,-60);g.lineTo(26,-40);g.closePath();g.fill();g.stroke();
  g.beginPath();g.arc(0,8,26,0,6.3);g.fill();g.stroke();g.fillStyle=campo;g.beginPath();g.arc(0,8,12,0,6.3);g.fill();}
 g.restore();const t=tx(c);t.wrapS=t.wrapT=T.ClampToEdgeWrapping;return t;}

// ================= recursos (uma vez) =================
function recursos(){const r={},AT=window.arcanoTex;
 const pq=(h,l,s)=>{const t=parquet(h,l,s),m=mat({color:'#ffffff',map:t.map,roughness:.65});m.bumpMap=t.bump;m.bumpScale=.45;return m;};
 r.taco=[pq(22,30,3),pq(28,42,5),pq(34,55,7)];
 if(AT&&AT.marble){const a=AT.marble({n:4,light:80,dark:46,seed:12});r.marmore=mat({color:'#ffffff',map:a.map,roughness:.4});r.marmore.bumpMap=a.bump;r.marmore.bumpScale=.35;}else r.marmore=M.floor;
 if(AT&&AT.wood){const w=AT.wood({hue:30,light:50,seed:21});r.tabuas=mat({color:'#ffffff',map:w.map,roughness:.85});r.tabuas.bumpMap=w.bump;r.tabuas.bumpScale=.6;}else r.tabuas=M.woodLight;
 r.tapete=[['#8a1e2e','#2a1a3a','#d8b45a','#f0e0b0'],['#22406e','#1a1a2a','#d8b45a','#e8e0c8'],['#2f5a3c','#3a1e16','#d8a24a','#efe2c0'],['#5a2a6e','#22182a','#e0b85a','#f2e4c4']].map((P,i)=>mat({map:tapeteTex(P,i*7+3)}));
 r.franja=new T.MeshStandardMaterial({map:franjaTex(),alphaTest:.5,side:T.DoubleSide,roughness:1});
 r.mapa=[mat({map:mapaTex(4)}),mat({map:mapaTex(11)})];
 r.perg=mat({color:'#efe2bf'});r.pagina=mat({map:paginasTex()});
 {const vt=vitralTex();r.vitral=mat({color:'#ffffff',map:vt,emissive:new T.Color('#ffffff'),emissiveMap:vt,emissiveIntensity:.8,roughness:.3});}
 r.moedas=mat({color:'#ffffff',map:moedasTex(),roughness:.35,metalness:.35});
 r.toalha=mat({map:toalhaTex('#8a1e2e')});r.toalhaAltar=mat({map:toalhaTex('#d8b45a')});
 r.relogio=mat({map:relogioTex(),roughness:.5});r.teclado=mat({map:tecladoTex(),roughness:.4});
 r.cristal=['#e0344c','#3a78e0','#2fbf6a','#a64be0'].map(c=>mat({color:c,emissive:new T.Color(c),emissiveIntensity:.6,roughness:.15}));
 r.ceramica=mat({color:'#f2ede2',roughness:.35});r.ceramicaAz=mat({color:'#3f67a8',roughness:.35});r.ceramicaVd=mat({color:'#3f8a6a',roughness:.35});
 r.pao=mat({color:'#c98a4a'});r.fruta=mat({color:'#c0392b',roughness:.5});r.uva=mat({color:'#5b2a6e',roughness:.4});r.queijo=mat({color:'#e8c15a'});r.vinho=mat({color:'#5a0f1e',roughness:.2});
 r.folha=mat({color:'#4f8f45'});r.folha2=mat({color:'#6aa84f'});r.flor=['#e84a6a','#f2c94c','#f5f0e6','#9b59b6'].map(c=>mat({color:c}));
 r.terracota=mat({color:'#b5643c'});r.terra=mat({color:'#4a3322'});r.palha=mat({color:'#d8b560'});r.corda=mat({color:'#b99a6a'});
 r.pedraBranca=mat({color:'#ece6dc',roughness:.55});r.vidro=new T.MeshStandardMaterial({color:'#dff3ff',transparent:true,opacity:.22,roughness:.05,depthWrite:false});
 r.gato=mat({color:'#d9843a'});r.gatoB=mat({color:'#f3ece0'});r.ave=mat({color:'#f2c230'});
 r.vestido=[mat({color:'#9e2b4a',map:M.drape?M.drape[0].map:null}),mat({color:'#2b5a9e',map:M.drape?M.drape[0].map:null}),mat({color:'#e8d8a8',map:M.drape?M.drape[0].map:null})];
 r.livro=['#7a2a2a','#2a4a7a','#2f6a3a','#6a4a2a','#4a2a5a','#8a6a2a','#2a5a5a','#5a2a3a'].map(c=>mat({color:c}));
 r.brasao=[['#9e2430',0,'#f0cd6e'],['#24457e',4,'#f0cd6e'],['#2c5b3c',2,'#efe7d2'],['#3a2a5a',3,'#f0cd6e'],['#d8b45a',1,'#8a1e2e']].map(([c,f,m])=>mat({map:brasaoTex(c,f,m)}));
 r.linho=mat({color:'#f2ecdd'});r.lambri=M.wood;
 return r;}

// ================= peças básicas =================
const B=(p,w,h,d,m,x,y,z,ry,tile)=>K.box(p,w,h,d,m,x,y,z,ry||0,tile||1.5);              // centro em y
const Bb=(p,w,h,d,m,x,y0,z,ry,tile)=>K.box(p,w,h,d,m,x,y0+h/2,z,ry||0,tile||1.5);         // base em y0
const Bt=(p,w,h,d,m,x,y0,z,ry)=>{const me=new T.Mesh(new T.BoxGeometry(w,h,d),m);me.position.set(x,y0+h/2,z);me.rotation.y=ry||0;p.add(me);return me;}; // UV 0..1 por face
const Cy=(p,r1,r2,h,m,x,y0,z,seg)=>K.cyl(p,r1,r2,h,m,x,y0,z,seg||10,1.5);
const Lt=(p,pts,m,x,y0,z,seg)=>{const me=new T.Mesh(new T.LatheGeometry(pts.map(q=>new T.Vector2(q[0],q[1])),seg||10),m);me.position.set(x,y0,z);p.add(me);return me;};
const Sp=(p,r,m,x,y,z,ws,hs)=>{const me=new T.Mesh(new T.SphereGeometry(r,ws||8,hs||6),m);me.position.set(x,y,z);p.add(me);return me;};
const Ms=(p,geo,m,x,y,z,rx,ry,rz)=>{const me=new T.Mesh(geo,m);me.position.set(x,y,z);me.rotation.set(rx||0,ry||0,rz||0);p.add(me);return me;};
const V=(x,y,z)=>new T.Vector3(x,y,z);
function haste(p,ax,ay,az,bx,by,bz,r,m,seg){const A=V(ax,ay,az),d=V(bx-ax,by-ay,bz-az),L=d.length();const me=new T.Mesh(new T.CylinderGeometry(r,r,L,seg||6),m);me.position.copy(A).addScaledVector(d,.5);me.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());p.add(me);return me;}
function ext(p,shape,depth,bevel,m,x,y,z,rx,ry,rz,cs){const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:1,curveSegments:cs||8});g.translate(0,0,-depth/2);return Ms(p,g,m,x,y,z,rx,ry,rz);}
const Y=y=>K.y0+K.F+y;
function peca(x,z,rot){const p=new T.Group();p.position.set(x,K.y0+K.F,z);p.rotation.y=rot||0;K.g.add(p);return p;}
function solido(x,z,w,d,rot){K.obs(x,z,w/2+.04,d/2+.04,rot||0);}
function chamaEm(p,x,y,z,sc){p.updateWorldMatrix(true,false);const v=V(x,y,z);p.localToWorld(v);K.FL.push([v.x,v.y,v.z,sc]);}
// peça que se mexe: sai do grupo fundido e vai solta para o interior, com a pose-base guardada
function anima(o,spec){o.updateWorldMatrix(true,false);const m=o.matrixWorld.clone();if(o.parent)o.parent.remove(o);m.decompose(o.position,o.quaternion,o.scale);o.updateMatrix();
 o.userData.base={p:o.position.clone(),r:o.rotation.clone()};o.name=spec.nome+' '+K.ANIM.length;o.castShadow=o.receiveShadow=true;K.inn.add(o);K.ANIM.push(Object.assign({o,k:K.k},spec));return o;}
function juntaGeo(list){// geometrias (já posicionadas) numa só, com índices
 let nv=0,ni=0;const gs=list.map(g=>{g=g.index?g:g.toNonIndexed();if(!g.index){const n=g.attributes.position.count,ix=[];for(let i=0;i<n;i++)ix.push(i);g.setIndex(ix);}return g;});
 for(const g of gs){nv+=g.attributes.position.count;ni+=g.index.count;}
 const P=new Float32Array(nv*3),N=new Float32Array(nv*3),U=new Float32Array(nv*2),I=new Uint32Array(ni);let ov=0,oi=0;
 for(const g of gs){const c=g.attributes.position.count;P.set(g.attributes.position.array,ov*3);if(!g.attributes.normal)g.computeVertexNormals();N.set(g.attributes.normal.array,ov*3);if(g.attributes.uv)U.set(g.attributes.uv.array.subarray(0,c*2),ov*2);
  const ix=g.index.array;for(let i=0;i<ix.length;i++)I[oi+i]=ix[i]+ov;ov+=c;oi+=ix.length;}
 const r=new T.BufferGeometry();r.setAttribute('position',new T.BufferAttribute(P,3));r.setAttribute('normal',new T.BufferAttribute(N,3));r.setAttribute('uv',new T.BufferAttribute(U,2));r.setIndex(new T.BufferAttribute(I,1));r.computeBoundingSphere();return r;}
const G=(geo,x,y,z,rx,ry,rz,sx,sy,sz)=>{const o=new T.Object3D();o.position.set(x||0,y||0,z||0);o.rotation.set(rx||0,ry||0,rz||0);o.scale.set(sx||1,sy||sx||1,sz||sx||1);o.updateMatrix();return geo.applyMatrix4(o.matrix);};

// ================= salas =================
const SALA={OF:[-15.5,-6.25,-3.75,7.5],OB:[-15.5,-6.25,-15.5,-4.25],CF:[-5.75,5.75,-3.75,7.5],CB:[-5.75,5.75,-15.5,-4.25],C0:[-5.75,5.75,-15.5,7.5],LF:[6.25,15.5,-3.75,7.5],LB:[6.25,15.5,-15.5,-4.25]};
const WO=.075;   // folga da parede (lambri)
// posição encostada na parede: N (z0, olha +z), S (z1, olha -z), O (x0, olha +x), L (x1, olha -x)
function encosta(s,lado,t,prof){const [x0,x1,z0,z1]=SALA[s];
 if(lado==='N')return [t,z0+WO+prof/2,0];if(lado==='S')return [t,z1-WO-prof/2,PI];if(lado==='O')return [x0+WO+prof/2,t,PI/2];return [x1-WO-prof/2,t,-PI/2];}
function naParede(s,lado,t,prof){const [x,z,r]=encosta(s,lado,t,prof);return peca(x,z,r);}
// ponto na face da parede (para quadros, escudos, tochas): devolve [x,z,rot] com afastamento d
function faceDe(s,lado,t,d){const [x0,x1,z0,z1]=SALA[s];d=d||.03;
 if(lado==='N')return [t,z0+d,0];if(lado==='S')return [t,z1-d,PI];if(lado==='O')return [x0+d,t,PI/2];return [x1-d,t,-PI/2];}
const PISOS=[[['OB',1],['OF',1]],[['CF','m'],['OF',0],['OB',2]],[['CF',1],['CB','m'],['OF',0],['OB',2],['LB',1]],[['CF',0],['OF','m'],['LB','t']]];

// ================= acabamento =================
function lambri(f){const L=f.a1-f.a0;if(L<.25)return;const mid=(f.a0+f.a1)/2,y=K.y0+K.F;
 const put=(a,w,h,d,m,yc,off)=>{if(f.eixo==='x')K.box(K.g,d,h,w,m,f.c+f.n*((off||0)+d/2),yc,a,0,1.2);else K.box(K.g,w,h,d,m,a,yc,f.c+f.n*((off||0)+d/2),0,1.2);};
 put(mid,L,.16,.05,M.woodDark,y+.08);put(mid,L,.84,.024,R.lambri,y+.58);put(mid,L,.07,.066,M.woodDark,y+1.035);put(mid,L,.022,.072,M.gold,y+1.0);
 const n=Math.max(1,Math.round(L/1.0)),st=L/n;
 for(let i=0;i<=n;i++){const a=Math.min(f.a1-.04,Math.max(f.a0+.04,f.a0+st*i));put(a,.08,.84,.044,M.woodDark,y+.58);}
 for(let i=0;i<n;i++){const a=f.a0+st*(i+.5);if(st>.4)put(a,st-.24,.5,.014,M.woodDark,y+.58,.024);}}
function cornija(f){const L=f.a1-f.a0;if(L<.25)return;const mid=(f.a0+f.a1)/2,yT=K.y0+K.H;
 const put=(w,h,d,m,yc)=>{if(f.eixo==='x')K.box(K.g,d,h,w,m,f.c+f.n*(d/2),yc,mid,0,3);else K.box(K.g,w,h,d,m,mid,yc,f.c+f.n*(d/2),0,3);};
 put(L,.2,.13,M.trim,yT-.12);put(L,.07,.2,M.trim,yT-.27);}
function piso(s,m){const [x0,x1,z0,z1]=SALA[s];const mm=m==='m'?R.marmore:m==='t'?R.tabuas:R.taco[m];const tile=m==='m'?3:m==='t'?2.4:2.6;
 K.box(K.g,x1-x0-.1,.016,z1-z0-.1,mm,(x0+x1)/2,K.y0+K.F+.008,(z0+z1)/2,0,tile);}
function cortina(x,z,rot,m){const tie=.42,h=4.55,F=K.F,gp=new T.Group();gp.position.set(x,K.y0,z);gp.rotation.y=rot;gp.translateZ(.09);K.g.add(gp);
 for(const e of [-1,1]){const pm=new T.Mesh(K.drapeGeo(e,.48,1.12,h,tie),m);pm.position.y=F+.05+h/2;gp.add(pm);
  const yt=F+.05+h*tie,tb=new T.Mesh(new T.TorusGeometry(.17,.03,6,12),M.gold);tb.rotation.x=PI/2;tb.scale.set(1,.7,1);tb.position.set(e*1.0,yt,.14);gp.add(tb);
  const ts=new T.Mesh(new T.ConeGeometry(.05,.24,8),M.gold);ts.position.set(e*1.0,yt-.15,.26);gp.add(ts);}
 const va=new T.Mesh(K.valanceGeo(2.5),m);va.position.y=F+4.45;gp.add(va);
 const rod=new T.Mesh(new T.CylinderGeometry(.035,.035,2.7,8),M.gold);rod.rotation.z=PI/2;rod.position.set(0,F+4.78,.14);gp.add(rod);
 for(const e of [-1,1]){const f=new T.Mesh(new T.SphereGeometry(.07,8,6),M.gold);f.position.set(e*1.38,F+4.78,.14);gp.add(f);}}
function tocheiro(s,lado,t,yy){const [x,z,rot]=faceDe(s,lado,t,0);const p=new T.Group();p.position.set(x,Y(yy||2.3),z);p.rotation.y=rot;K.g.add(p);
 B(p,.14,.3,.03,M.iron,0,0,.015);Sp(p,.03,M.gold,0,.17,.03,6,4);B(p,.03,.03,.2,M.iron,0,-.06,.12);B(p,.03,.14,.03,M.iron,0,0,.215);
 Lt(p,[[0,0],[.055,.005],[.07,.06],[.055,.07],[0,.07]],M.gold,0,.07,.215,8);Cy(p,.028,.03,.16,M.candle,0,.13,.215,6);chamaEm(p,0,.3,.215,.6);}
function lustre(x,z,n,raio,y){n=n||6;raio=raio||1;const p=new T.Group();p.position.set(x,K.y0+(y||K.H-1.7),z);(K.gTeto||K.g).add(p);const FL0=K.FL;if(K.FLteto)K.FL=K.FLteto;const top=K.y0+K.H-p.position.y;
 haste(p,0,top,0,0,.55,0,.02,M.iron,5);Lt(p,[[0,-.28],[.07,-.24],[.12,-.08],[.06,.08],[.09,.3],[.05,.52],[0,.55]],M.goldM,0,0,0,10);
 const ring=new T.Mesh(new T.TorusGeometry(raio,.035,6,26),M.goldM);ring.rotation.x=PI/2;ring.position.y=.04;p.add(ring);
 const ring2=new T.Mesh(new T.TorusGeometry(raio*.45,.025,5,16),M.goldM);ring2.rotation.x=PI/2;ring2.position.y=.3;p.add(ring2);
 for(let i=0;i<n;i++){const a=i/n*PI*2,cx=Math.cos(a)*raio,cz=Math.sin(a)*raio;haste(p,Math.cos(a)*.1,-.05,Math.sin(a)*.1,cx,.05,cz,.016,M.goldM,5);
  Lt(p,[[0,0],[.05,0],[.06,.04],[0,.04]],M.goldM,cx,.06,cz,7);Cy(p,.022,.022,.12,M.candle,cx,.1,cz,6);chamaEm(p,cx,.25,cz,.42);}
 Sp(p,.05,M.goldM,0,-.32,0,8,6);K.FL=FL0;}
function quadro(s,lado,t,y,w,h,i){const [x,z,rot]=faceDe(s,lado,t,0);const p=new T.Group();p.position.set(x,Y(y),z);p.rotation.y=rot;K.g.add(p);
 const fw=.11;for(const e of [-1,1]){B(p,w+2*fw,fw,.07,M.gold,0,e*(h/2+fw/2),.035);B(p,fw,h,.07,M.gold,e*(w/2+fw/2),0,.035);}
 for(const e of [-1,1]){B(p,w+.04,.025,.04,M.woodDark,0,e*(h/2+.012),.05);B(p,.025,h,.04,M.woodDark,e*(w/2+.012),0,.05);}
 Bt(p,w,h,.02,M.art[i%M.art.length],0,-h/2,.03);
 for(const e of [-1,1])Sp(p,.035,M.gold,e*(w/2+fw/2),h/2+fw/2,.08,6,4);}
function tapecaria(s,lado,t,y,w,h,i){const [x,z,rot]=faceDe(s,lado,t,0);const p=new T.Group();p.position.set(x,Y(y),z);p.rotation.y=rot;K.g.add(p);
 const geo=new T.PlaneGeometry(w,h,6,10),pp=geo.attributes.position;for(let j=0;j<pp.count;j++)pp.setZ(j,.05+.02*Math.sin(pp.getX(j)*7)*(1-(pp.getY(j)+h/2)/h*.6));geo.computeVertexNormals();
 Ms(p,geo,K.tapMats[i%K.tapMats.length],0,0,0);
 const rod=new T.Mesh(new T.CylinderGeometry(.035,.035,w+.3,8),M.goldM);rod.rotation.z=PI/2;rod.position.set(0,h/2+.05,.07);p.add(rod);
 for(const e of [-1,1])Sp(p,.06,M.goldM,e*(w/2+.15),h/2+.05,.07,8,6);
 haste(p,-w/2+.1,h/2+.05,.07,0,h/2+.45,.05,.008,M.goldM,4);haste(p,w/2-.1,h/2+.05,.07,0,h/2+.45,.05,.008,M.goldM,4);}
function escudo(p,x,y,z,i,esc,rot){esc=esc||1;const k=.42*esc,s=new T.Shape();s.moveTo(-k*.55,k*.6);s.lineTo(k*.55,k*.6);s.lineTo(k*.55,k*.1);s.bezierCurveTo(k*.52,-k*.35,k*.2,-k*.65,0,-k*.8);s.bezierCurveTo(-k*.2,-k*.65,-k*.52,-k*.35,-k*.55,k*.1);s.closePath();
 const q=new T.Group();q.position.set(x,y,z);q.rotation.y=rot||0;p.add(q);
 ext(q,s,.035,.014,M.goldM,0,0,.035,0,0,0,8);
 const g2=new T.ShapeGeometry(s,8),uv=g2.attributes.uv,pp=g2.attributes.position;for(let j=0;j<uv.count;j++)uv.setXY(j,(pp.getX(j)+k*.55)/(k*1.1),(pp.getY(j)+k*.8)/(k*1.4));
 const f=Ms(q,g2,R.brasao[i%R.brasao.length],0,.005,.068);f.scale.set(.88,.88,1);return q;}
function escudoParede(s,lado,t,y,i,esc,armas){const [x,z,rot]=faceDe(s,lado,t,0);const p=new T.Group();p.position.set(x,Y(y),z);p.rotation.y=rot;K.g.add(p);
 if(armas){for(const e of [-1,1]){const q=new T.Group();q.position.set(0,0,.03);q.rotation.z=e*.75;p.add(q);B(q,.05,1.2,.012,M.steel,0,.25,0);B(q,.24,.035,.04,M.goldM,0,-.36,0);Cy(q,.018,.018,.2,M.leather,0,-.58,0,6);Sp(q,.03,M.goldM,0,-.6,0,6,4);}}
 escudo(p,0,0,.02,i,esc);}

// ================= móveis =================
const PERNA=h=>[[0,0],[.028,0],[.03,.04],[.02,.08],[.026,h*.4],[.018,h*.62],[.025,h*.85],[.02,h],[0,h]];
function cadeira(p,o){o=o||{};const W=.5,D=.48,sh=.47,est=o.estofo||M.velvet;
 for(const [x,z] of [[-.2,-.19],[.2,-.19],[-.2,.19],[.2,.19]])Lt(p,PERNA(sh-.03),M.woodDark,x,0,z,6);
 Bb(p,W,.06,D,M.wood,0,sh-.06,0);Bb(p,W-.06,.06,D-.06,est,0,sh,0);
 const bh=o.alta?1.05:.62;
 for(const e of [-1,1]){Cy(p,.026,.026,bh,M.woodDark,e*.215,sh-.04,-.205,6);Sp(p,.04,M.gold,e*.215,sh+bh-.01,-.205,6,4);}
 Bb(p,W-.12,bh-.22,.04,est,0,sh+.08,-.205);Bb(p,W-.02,.08,.06,M.woodDark,0,sh+bh-.12,-.205);
 if(o.alta){const c=new T.Shape();c.moveTo(-.22,0);c.lineTo(.22,0);c.quadraticCurveTo(.12,.12,0,.2);c.quadraticCurveTo(-.12,.12,-.22,0);ext(p,c,.05,.01,M.woodDark,0,sh+bh-.06,-.205);Sp(p,.035,M.gold,0,sh+bh+.16,-.205,6,4);}
 if(o.bracos)for(const e of [-1,1]){Bb(p,.06,.05,D-.02,M.woodDark,e*.25,sh+.22,0);Cy(p,.022,.022,.22,M.woodDark,e*.25,sh,.19,6);}}
function poltrona(p,est){est=est||M.velvet;Bb(p,.8,.2,.76,M.woodDark,0,.1,0);
 for(const [x,z] of [[-.34,-.31],[.34,-.31],[-.34,.31],[.34,.31]])Lt(p,[[0,0],[.035,0],[.04,.05],[.026,.1],[0,.1]],M.woodDark,x,0,z,6);
 Bb(p,.62,.16,.62,est,0,.3,.05);Bb(p,.8,.62,.18,est,0,.3,-.3);
 Ms(p,new T.CylinderGeometry(.09,.09,.8,10),est,0,.92,-.3,0,0,PI/2);
 for(const e of [-1,1]){Bb(p,.13,.3,.7,est,e*.335,.3,.02);Ms(p,new T.CylinderGeometry(.072,.072,.7,10),est,e*.335,.62,.02,PI/2,0,0);}
 for(let i=0;i<5;i++)Sp(p,.012,M.gold,-.3+i*.15,.75,-.205,5,4);}
function mesa(p,L,D,o){o=o||{};const h=o.h||.78;Bb(p,L,.06,D,M.wood,0,h-.06,0);Bb(p,L+.04,.025,D+.04,M.woodDark,0,h-.09,0);Bb(p,L-.24,.12,D-.24,M.woodDark,0,h-.21,0);
 const xs=L>2.6?[-L/2+.12,0,L/2-.12]:[-L/2+.12,L/2-.12];for(const x of xs)for(const e of [-1,1])Lt(p,PERNA(h-.09),M.woodDark,x,0,e*(D/2-.12),6);
 if(L>2.2)Bb(p,L-.3,.05,.06,M.woodDark,0,.14,0);}
function mesaRedonda(p,r,h,m){h=h||.76;Cy(p,r,r,.05,m||M.wood,0,h-.05,0,Math.max(14,Math.round(r*16)));Cy(p,r-.03,r-.06,.06,M.woodDark,0,h-.11,0,14);
 Lt(p,[[0,0],[.16,0],[.16,.03],[.06,.08],[.05,h*.5],[.08,h*.62],[.05,h-.11],[0,h-.11]],M.woodDark,0,0,0,10);
 for(let i=0;i<4;i++){const a=i/4*PI*2+PI/4;haste(p,0,.06,0,Math.cos(a)*.34,.02,Math.sin(a)*.34,.03,M.woodDark,5);}}
function escrivaninha(p,w,d){w=w||1.8;d=d||.9;const h=.78;Bb(p,w,.06,d,M.wood,0,h-.06,0);Bb(p,w-.12,.006,d-.2,M.velvetGreen,0,h,0);
 for(const e of [-1,1]){const cx=e*(w/2-.27);Bb(p,.5,h-.08,d-.06,M.woodDark,cx,0,0);for(let i=0;i<3;i++){Bb(p,.42,.18,.02,M.wood,cx,.08+i*.22,d/2-.02);Sp(p,.017,M.gold,cx,.17+i*.22,d/2,5,4);}}
 Bb(p,w-1.12,.12,.03,M.woodDark,0,h-.2,d/2-.04);}
function livrosPilha(p,x,y,z,n,seed){const r=rng(seed);let yy=y;for(let i=0;i<n;i++){const w=.2+r()*.08,d=.15+r()*.05,h=.035+r()*.025;Bb(p,w,h,d,R.livro[Math.floor(r()*R.livro.length)],x+(r()-.5)*.03,yy,z+(r()-.5)*.03,(r()-.5)*.5);yy+=h;}return yy;}
function livroAberto(p,x,y,z,ry,esc){esc=esc||1;const q=new T.Group();q.position.set(x,y,z);q.rotation.y=ry||0;q.scale.setScalar(esc);p.add(q);
 Bt(q,.4,.012,.27,R.livro[0],0,0,0);const pg=Bt(q,.38,.02,.26,R.pagina,0,.01,0);pg.scale.y=1;return q;}
function tinteiro(p,x,y,z){Cy(p,.03,.035,.05,M.iron,x,y,z,8);const pena=Ms(p,new T.ConeGeometry(.012,.22,4),R.linho,x+.03,y+.12,z,0,0,-.35);pena.scale.set(1,1,.3);}
function castical(p,x,y,z,n){n=n||1;Lt(p,[[0,0],[.07,0],[.07,.015],[.025,.04],[.02,.16],[.035,.18],[0,.18]],M.goldM,x,y,z,8);
 if(n===1){Cy(p,.022,.024,.14,M.candle,x,y+.18,z,6);chamaEm(p,x,y+.36,z,.4);return;}
 for(const e of [-1,0,1]){const cx=x+e*.13,cy=y+.18+(e?0:.08);if(e)haste(p,x,y+.15,z,cx,cy,z,.01,M.goldM,4);Lt(p,[[0,0],[.035,0],[.04,.03],[0,.03]],M.goldM,cx,cy,z,6);Cy(p,.02,.022,.12,M.candle,cx,cy+.03,z,6);chamaEm(p,cx,cy+.2,z,.36);}}
function candelabroChao(p,x,z,h){h=h||1.7;Lt(p,[[0,0],[.22,0],[.22,.04],[.08,.1],[.04,.2],[.035,h*.5],[.06,h*.55],[.03,h*.6],[.03,h-.05],[.1,h],[0,h]],M.goldM,x,0,z,10);
 for(let i=0;i<3;i++){const a=i/3*PI*2;haste(p,x,.08,z,x+Math.cos(a)*.24,.0,z+Math.sin(a)*.24,.02,M.goldM,4);}
 Cy(p,.04,.045,.3,M.candle,x,h,z,8);chamaEm(p,x,h+.4,z,.75);}
function estante(p,w,h,o){o=o||{};const d=.44,r=rng(o.seed||7);
 Bb(p,w,h,.04,M.woodDark,0,0,-d/2+.02);for(const e of [-1,1]){Bb(p,.07,h,d,M.woodDark,e*(w/2-.035),0,0);Bb(p,.1,h-.3,.03,M.wood,e*(w/2-.035),.15,d/2+.01);}
 Bb(p,w+.06,.12,d+.04,M.woodDark,0,0,0);Bb(p,w+.1,.08,d+.08,M.woodDark,0,h,0);Bb(p,w+.16,.06,d+.12,M.wood,0,h+.08,0);
 const n=Math.max(2,Math.round((h-.25)/.44)),st=(h-.16)/n;
 for(let i=0;i<n;i++){const y=.12+i*st;Bb(p,w-.1,.03,d-.04,M.wood,0,y,0);let a=-w/2+.1;const yb=y+.03,hm=st-.08;
  while(a<w/2-.14){const q=r();
   if(q<.05&&a<w/2-.5){const yy=livrosPilha(p,a+.15,yb,.02,3,Math.floor(r()*999));if(r()<.5)vaso(p,a+.15,yy,.02,false);a+=.34;continue;}
   if(q<.09){a+=.12+r()*.08;if(r()<.4)Sp(p,.05,M.goldM,a-.05,yb+.05,.04,6,4);continue;}
   const bw=.04+r()*.05,bh=hm*(.62+r()*.32),lean=r()<.07&&a>-w/2+.3;
   const b=Bb(p,bw,bh,.3,R.livro[Math.floor(r()*R.livro.length)],a+bw/2,yb,.03);if(lean){b.rotation.z=-.22;b.position.x+=.05;}
   if(r()<.5){B(p,bw+.004,.018,.004,M.gold,a+bw/2,yb+bh*.8,.181);B(p,bw+.004,.018,.004,M.gold,a+bw/2,yb+bh*.2,.181);}
   a+=bw+.004+(lean?.06:0);}}
 if(o.escada){haste(p,-w/2+.35,0,d/2+.55,-w/2+.25,h-.1,d/2+.05,.025,M.woodDark,5);haste(p,-w/2+.75,0,d/2+.55,-w/2+.65,h-.1,d/2+.05,.025,M.woodDark,5);
  for(let i=1;i<9;i++){const t=i/9;haste(p,-w/2+.35-.1*t,t*(h-.1),d/2+.55-.5*t,-w/2+.75-.1*t,t*(h-.1),d/2+.55-.5*t,.015,M.woodDark,4);}}}
function armario(p,w,h){w=w||1.6;h=h||2.4;const d=.6;Bb(p,w,h-.22,d,M.woodDark,0,.12,0);Bb(p,w+.06,.12,d+.04,M.woodDark,0,0,0);
 Bb(p,w+.1,.07,d+.08,M.wood,0,h-.1,0);Bb(p,w+.18,.07,d+.14,M.woodDark,0,h-.04,0);
 const dw=(w-.08)/2,ih=h-.46;for(const e of [-1,1]){const cx=e*(dw/2+.01);Bb(p,dw-.02,ih,.025,M.wood,cx,.2,d/2);
  Bb(p,dw-.22,ih*.42,.02,M.woodDark,cx,.2+ih*.06,d/2+.02);Bb(p,dw-.22,ih*.42,.02,M.woodDark,cx,.2+ih*.52,d/2+.02);
  Cy(p,.012,.012,.16,M.gold,e*.07,h*.46,d/2+.035,6);}
 Bb(p,.025,ih,.02,M.gold,0,.2,d/2+.015);for(const e of [-1,1])Sp(p,.05,M.gold,e*(w/2-.08),h+.06,0,6,4);}
function comoda(p,w){w=w||1.4;const d=.5,h=.9;Bb(p,w,h-.1,d,M.woodDark,0,.1,0);Bb(p,w+.06,.05,d+.04,M.wood,0,h,0);
 for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]])Lt(p,[[0,0],[.04,0],[.045,.05],[.03,.1],[0,.1]],M.woodDark,x*(w/2-.06),0,z*(d/2-.06),6);
 for(let i=0;i<3;i++){Bb(p,w-.1,.2,.02,M.wood,0,.16+i*.24,d/2);for(const e of [-1,1])Sp(p,.018,M.gold,e*w*.25,.26+i*.24,d/2+.02,5,4);}}
function bau(p,w,o){o=o||{};w=w||1.0;const d=.55,h=.45,r=d/2;Bb(p,w,h,d,M.wood,0,0,0);
 for(const x of [-w/2+.12,0,w/2-.12])if(w>.7||x)Bb(p,.05,h+.01,d+.02,M.iron,x,0,0);
 const lid=new T.Group();lid.position.set(0,h,-r);p.add(lid);
 const t=new T.Mesh(new T.CylinderGeometry(r,r,w,12,1,false,0,PI),M.wood);t.rotation.z=PI/2;t.position.set(0,0,r);lid.add(t);Bb(lid,w,.02,d,M.woodDark,0,-.02,r);
 for(const x of [-w/2+.12,w/2-.12]){const b=new T.Mesh(new T.TorusGeometry(r+.008,.012,4,10,PI),M.iron);b.rotation.y=PI/2;b.position.set(x,0,r);lid.add(b);}
 Bb(p,.12,.14,.02,M.gold,0,h-.16,d/2+.005);Bb(p,.02,.05,.01,M.iron,0,h-.13,d/2+.016);
 for(const e of [-1,1])Ms(p,new T.TorusGeometry(.05,.01,4,10,PI),M.iron,e*(w/2+.01),h*.6,0,0,PI/2,PI);
 if(o.aberto){lid.rotation.x=-1.95;Bt(p,w-.08,.05,d-.08,R.moedas,0,h-.07,0);const rr=rng(o.seed||5);
  for(let i=0;i<5;i++){const g=Ms(p,new T.OctahedronGeometry(.035,0),R.cristal[i%4],(rr()-.5)*(w-.25),h+.0,(rr()-.5)*(d-.2));g.scale.y=1.4;}
  Sp(p,.09,R.moedas,-w*.2,h-.02,0,8,5).scale.y=.45;}}
function barril(p,x,z,y){y=y||0;const pts=[[0,0]];for(let i=0;i<=8;i++){const t=i/8;pts.push([.26+Math.sin(t*PI)*.06,t*.88]);}pts.push([0,.88]);Lt(p,pts,M.wood,x,y,z,12);
 for(const yy of [.1,.3,.58,.78]){const t=new T.Mesh(new T.TorusGeometry(.265+Math.sin(yy/.88*PI)*.06,.012,4,16),M.iron);t.rotation.x=PI/2;t.position.set(x,y+yy,z);p.add(t);}
 Cy(p,.24,.24,.01,M.woodDark,x,y+.88,z,12);}
function vaso(p,x,y,z,flores,m){m=m||R.ceramicaAz;Lt(p,[[0,0],[.06,0],[.09,.06],[.1,.14],[.06,.24],[.05,.28],[.075,.31],[0,.31]],m,x,y,z,10);
 if(!flores)return;const r=rng(Math.abs(Math.round(x*100+z*37+y*11))+1);
 for(let i=0;i<7;i++){const a=r()*PI*2,rr=.03+r()*.05,hx=x+Math.cos(a)*rr*2.2,hz=z+Math.sin(a)*rr*2.2,hy=y+.5+r()*.18;haste(p,x+Math.cos(a)*.02,y+.28,z+Math.sin(a)*.02,hx,hy,hz,.006,R.folha,4);
  Ms(p,new T.IcosahedronGeometry(.045,0),R.flor[i%R.flor.length],hx,hy,hz);}
 for(let i=0;i<4;i++){const a=i/4*PI*2+.4;Ms(p,new T.ConeGeometry(.03,.16,4),R.folha2,x+Math.cos(a)*.08,y+.36,z+Math.sin(a)*.08,Math.sin(a)*.9,0,-Math.cos(a)*.9);}}
function planta(p,x,z,alta){Lt(p,[[0,0],[.2,0],[.24,.05],[.28,.45],[.32,.5],[.3,.54],[0,.54]],R.terracota,x,0,z,12);Cy(p,.27,.27,.02,R.terra,x,.5,z,10);
 const r=rng(Math.abs(Math.round(x*31+z*7))+3),n=alta?9:6;haste(p,x,.5,z,x,alta?1.4:1.0,z,.025,M.woodDark,5);
 for(let i=0;i<n;i++){const a=r()*PI*2,rr=r()*.22;const f=Ms(p,new T.IcosahedronGeometry(.2+r()*.14,1),i%2?R.folha:R.folha2,x+Math.cos(a)*rr,.78+r()*(alta?1.0:.5),z+Math.sin(a)*rr);f.scale.set(1,1.2,1);}}
function busto(p){const m=R.pedraBranca;Bb(p,.5,.1,.5,m,0,0,0);Bb(p,.38,.95,.38,m,0,.1,0);Bb(p,.48,.08,.48,m,0,1.05,0);
 Sp(p,.2,m,0,1.22,0,12,8).scale.set(1.2,.55,.75);Cy(p,.05,.06,.14,m,0,1.27,0,8);Sp(p,.105,m,0,1.5,.01,12,10).scale.set(.9,1.12,1);
 Ms(p,new T.TorusGeometry(.1,.016,5,14),M.goldM,0,1.56,0,PI/2,0,0);Ms(p,new T.ConeGeometry(.018,.05,4),m,0,1.5,.115,PI/2,0,0);}
function banqueta(p,L,est){est=est||M.velvet;Bb(p,L,.14,.5,est,0,.34,0);Bb(p,L+.06,.05,.56,M.woodDark,0,.3,0);
 for(const x of [-L/2+.08,L/2-.08])for(const e of [-1,1])Lt(p,PERNA(.3),M.woodDark,x,0,e*.2,6);for(let i=0;i<Math.round(L/.25);i++)Sp(p,.01,M.gold,-L/2+.12+i*.25,.48,.25,4,3);}
function cama(p,o){o=o||{};const W=o.w||2.0,L=o.l||2.4,cob=o.colcha||M.velvet;
 Bb(p,W,.3,L,M.woodDark,0,.12,0);for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]])Lt(p,[[0,0],[.06,0],[.07,.06],[.05,.12],[0,.12]],M.woodDark,x*(W/2-.08),0,z*(L/2-.08),8);
 Bb(p,W-.1,.22,L-.14,R.linho,0,.42,.02);Bb(p,W+.02,.05,L*.66,cob,0,.64,L*.16);for(const e of [-1,1])Bb(p,.02,.36,L*.66,cob,e*(W/2+.005),.3,L*.16);
 Bb(p,W+.02,.36,.02,cob,0,.3,L*.49+.012);
 for(const e of W>1.5?[-1,1]:[0])Sp(p,.24,R.linho,e*W*.24,.72,-L/2+.36,10,8).scale.set(1.25,.42,.7);
 const sh=new T.Shape();sh.moveTo(-W/2,0);sh.lineTo(W/2,0);sh.lineTo(W/2,1.05);sh.quadraticCurveTo(W/2,1.55,0,1.6);sh.quadraticCurveTo(-W/2,1.55,-W/2,1.05);sh.closePath();
 ext(p,sh,.08,.02,M.woodDark,0,.3,-L/2-.02);
 const s2=new T.Shape();s2.moveTo(-W/2+.15,0);s2.lineTo(W/2-.15,0);s2.lineTo(W/2-.15,.8);s2.quadraticCurveTo(W/2-.15,1.15,0,1.2);s2.quadraticCurveTo(-W/2+.15,1.15,-W/2+.15,.8);s2.closePath();
 ext(p,s2,.04,.015,cob,0,.55,-L/2+.03);Sp(p,.05,M.gold,0,1.92,-L/2-.02,6,4);
 Bb(p,W,.5,.07,M.woodDark,0,.25,L/2+.035);Bb(p,W+.06,.05,.1,M.wood,0,.75,L/2+.035);
 if(o.dossel){const ph=2.75;for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const px=x*(W/2+.04),pz=z*(L/2+.04);Lt(p,[[0,0],[.07,0],[.08,.15],[.05,.3],[.06,.9],[.04,1.2],[.05,1.6],[.04,ph],[0,ph]],M.woodDark,px,0,pz,8);Sp(p,.06,M.gold,px,ph+.05,pz,6,4);}
  Bb(p,W+.2,.14,L+.2,M.woodDark,0,ph-.12,0);Bb(p,W+.12,.04,L+.12,cob,0,ph+.02,0);
  for(const [w,d,x,z] of [[W+.26,.03,0,L/2+.12],[W+.26,.03,0,-L/2-.12],[.03,L+.26,W/2+.12,0],[.03,L+.26,-W/2-.12,0]]){Bb(p,w,.32,d,cob,x,ph-.42,z);Bb(p,w+.01,.04,d+.01,M.gold,x,ph-.45,z);}
  for(const [x,z] of [[-1,1],[1,1],[-1,-1],[1,-1]]){const px=x*(W/2+.02),pz=z*(L/2+.02);const c=Bb(p,.22,ph-.6,.16,cob,px,.1,pz+(z>0?-.1:.1));c.rotation.y=x*z*.4;
   Ms(p,new T.TorusGeometry(.1,.02,5,10),M.gold,px,1.1,pz+(z>0?-.1:.1),PI/2,0,0);}}}
function criado(p){Bb(p,.5,.58,.42,M.wood,0,.06,0);for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]])Bb(p,.05,.06,.05,M.woodDark,x*.2,0,z*.16);
 Bb(p,.54,.04,.46,M.woodDark,0,.64,0);Bb(p,.42,.16,.02,M.woodDark,0,.4,.21);Sp(p,.018,M.gold,0,.48,.225,5,4);castical(p,-.12,.68,-.05,1);livrosPilha(p,.1,.68,.02,2,9);}
function lareira(p,w,o){o=o||{};w=w||2.6;const d=.85,hb=1.45,H=K.H-K.F;
 Bb(p,w+.5,.1,d+.35,M.base,0,0,.12);
 const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,hb+.5);s.lineTo(-w/2,hb+.5);s.closePath();
 const bw=w*.6,hole=new T.Path();hole.moveTo(-bw/2,0);hole.lineTo(bw/2,0);hole.lineTo(bw/2,hb*.72);hole.quadraticCurveTo(bw/2,hb,0,hb+.02);hole.quadraticCurveTo(-bw/2,hb,-bw/2,hb*.72);hole.closePath();s.holes.push(hole);
 ext(p,s,.22,.02,M.trim,0,.1,d/2-.13,0,0,0,10);
 Bb(p,w-.1,hb+.5,d-.3,M.trim,0,.1,-.14);Bb(p,bw-.02,hb,.04,M.iron,0,.1,d/2-.26);
 Bb(p,w+.32,.1,d+.06,M.trim,0,hb+.6,.03);Bb(p,w+.44,.08,d+.14,M.trim,0,hb+.7,.05);
 for(const e of [-1,1]){Bb(p,.26,hb+.5,.3,M.trim,e*(w/2+.02),.1,d/2-.12);Bb(p,.34,.12,.38,M.trim,e*(w/2+.02),hb+.48,d/2-.12);}
 const cb=Math.max(.5,H-(hb+.78));Bb(p,w-.3,cb,d-.36,M.trim,0,hb+.78,-.16);Bb(p,w-.14,.12,d-.28,M.trim,0,hb+.78+cb-.12,-.16);
 for(let i=0;i<3;i++)haste(p,-bw*.3,.2+(i===2?.11:0),-.04+i*.05,bw*.3,.2+(i===2?.11:0),-.1+i*.05,.055,M.woodDark,6);
 Bb(p,bw*.6,.05,.36,M.fire,0,.1,-.04);for(const e of [-1,1]){Bb(p,.04,.24,.04,M.iron,e*bw*.36,.1,.12);Sp(p,.04,M.gold,e*bw*.36,.37,.12,6,4);}
 chamaEm(p,0,.28,-.02,1.9);chamaEm(p,.22,.24,-.06,1.3);
 if(!o.vazio){castical(p,-w/2+.25,hb+.74,.18,1);castical(p,w/2-.25,hb+.74,.18,1);vaso(p,0,hb+.74,.16,true);}
 if(o.brasao!==false)escudo(p,0,hb+1.75,(d-.36)/2-.16+.01,o.brasao||0,1.15);
 if(o.cranio){const c=new T.Group();c.position.set(0,hb+1.8,(d-.36)/2-.16+.02);p.add(c);dragaoCranio(c);}}
function dragaoCranio(c){const m=R.pedraBranca;Bt(c,1.0,.8,.06,M.woodDark,0,-.4,0);Sp(c,.26,m,0,0,.2,10,8).scale.set(1,.8,1.1);const fo=Sp(c,.16,m,0,-.06,.5,10,8);fo.scale.set(.9,.65,1.4);
 for(const e of [-1,1]){Sp(c,.06,M.iron,e*.13,.06,.38,6,4);const ch=haste(c,e*.15,.15,.2,e*.45,.42,-.05,.05,m,6);const pt=Ms(c,new T.ConeGeometry(.05,.3,6),m,e*.55,.55,-.12,-.6,0,-e*.9);}
 for(let i=0;i<6;i++)Ms(c,new T.ConeGeometry(.016,.07,4),m,-.09+i*.036,-.17,.62,PI,0,0);}
function tapete(x,z,w,d,i,rot){const p=peca(x,z,rot||0);Bt(p,w,.022,d,R.tapete[i%R.tapete.length],0,.004,0);
 for(const e of [-1,1]){const f=Ms(p,new T.PlaneGeometry(w,.1),R.franja,0,.018,e*(d/2+.05),-PI/2,0,0);if(e<0)f.rotation.z=PI;}}
function harpa(p){Bb(p,.42,.08,.3,M.woodDark,0,0,0);haste(p,-.22,.08,0,-.28,1.68,0,.035,M.goldM,8);Sp(p,.05,M.goldM,-.28,1.72,0,6,4);
 const N=[[-.28,1.68],[-.08,1.78],[.12,1.58],[.34,1.47]];for(let i=0;i<3;i++)haste(p,N[i][0],N[i][1],0,N[i+1][0],N[i+1][1],0,.03,M.goldM,6);
 haste(p,.0,.1,0,.34,1.47,0,.065,M.wood,8);
 const ny=x=>{for(let i=0;i<3;i++){const [a,b]=N[i],[c2,d2]=N[i+1];if(x>=a&&x<=c2)return b+(d2-b)*(x-a)/(c2-a);}return 1.5;};
 for(let i=1;i<10;i++){const t=i/10,bx=.34*t,by=.1+1.37*t;haste(p,bx-.03,by,0,bx-.03,ny(bx-.03)-.02,0,.004,R.linho,3);}}
function cravo(p){const sh=new T.Shape();sh.moveTo(-.48,0);sh.lineTo(.48,0);sh.lineTo(.48,-.45);sh.quadraticCurveTo(.42,-1.35,.08,-1.9);sh.lineTo(-.48,-1.9);sh.closePath();
 const g1=new T.ExtrudeGeometry(sh,{depth:.28,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:1,curveSegments:10});g1.rotateX(-PI/2);Ms(p,g1,M.woodDark,0,.72,0);
 const g2=new T.ExtrudeGeometry(sh,{depth:.02,bevelEnabled:false,curveSegments:10});g2.rotateX(-PI/2);g2.translate(.48,0,0);const lid=Ms(p,g2,M.wood,-.48,1.02,0,0,0,.75);
 haste(p,.3,1.02,.9,.25,1.55,.95,.012,M.woodDark,4);
 Bt(p,.86,.04,.18,R.teclado,0,.95,-.1);Bb(p,.96,.12,.24,M.woodDark,0,.9,-.14);
 for(const [x,z] of [[-.4,.1],[.4,.1],[-.38,1.75],[.1,1.7]])Lt(p,PERNA(.72),M.woodDark,x,0,z,6);
 Bb(p,.55,.04,.42,M.wood,0,1.05,.06);Bt(p,.5,.28,.01,R.pagina,0,1.06,.0);
 const bq=new T.Group();bq.position.set(0,0,-.72);p.add(bq);banqueta(bq,.9);}
function estanteMusica(p){Lt(p,[[0,0],[.15,0],[.15,.02],[.02,.04],[0,.04]],M.iron,0,0,0,6);haste(p,0,0,0,0,1.15,0,.012,M.iron,4);
 const q=new T.Group();q.position.set(0,1.15,0);q.rotation.x=-.45;p.add(q);Bb(q,.5,.34,.02,M.iron,0,0,0);Bt(q,.42,.3,.01,R.pagina,0,.03,.015);}
function violoncelo(p){const m=M.wood;const c=Lt(p,[[0,0],[.13,.03],[.19,.15],[.14,.32],[.12,.38],[.17,.5],[.15,.62],[.05,.68],[0,.68]],m,0,.12,0,12);c.scale.z=.45;
 haste(p,0,.78,0,0,1.42,0,.025,M.woodDark,6);Sp(p,.04,M.woodDark,0,1.46,0,6,4);haste(p,0,0,0,0,.14,0,.008,M.iron,4);
 for(const e of [-.03,-.01,.01,.03])haste(p,e,.2,.08,e*.4,1.4,.03,.002,R.linho,3);haste(p,-.14,.5,.07,.14,.5,.07,.004,M.woodDark,3);}
function tambor(p){Cy(p,.28,.28,.36,M.velvet,0,0,0,14);for(const y of [0,.36]){const t=new T.Mesh(new T.TorusGeometry(.285,.018,4,18),M.goldM);t.rotation.x=PI/2;t.position.y=y;p.add(t);}
 Cy(p,.27,.27,.01,R.linho,0,.36,0,14);for(let i=0;i<10;i++){const a=i/10*PI*2,b=a+PI/10;haste(p,Math.cos(a)*.29,.02,Math.sin(a)*.29,Math.cos(b)*.29,.34,Math.sin(b)*.29,.004,R.linho,3);}}
function orgao(p,w){w=w||3;const d=.9;Bb(p,w,.95,d,M.woodDark,0,0,0);Bb(p,w,.12,d+.04,M.wood,0,.95,0);Bt(p,w*.5,.03,.16,R.teclado,0,.88,d/2+.03);Bb(p,w*.55,.05,.24,M.woodDark,0,.84,d/2);
 const n=13;for(let i=0;i<n;i++){const t=i/(n-1),x=-w/2+.2+t*(w-.4),hh=2.0+1.7*(1-Math.abs(t-.5)*2)+(i%2)*.2,m=i%3?M.steel:M.goldM;Cy(p,.075,.075,hh,m,x,1.07,-.05,8);
  Lt(p,[[0,0],[.075,0],[.06,.05],[0,.05]],m,x,1.07+hh,-.05,8);Bb(p,.07,.05,.02,M.iron,x,1.3,.03);Lt(p,[[0,0],[.075,.0],[.02,.18],[0,.18]],m,x,.92,-.05,8);}
 for(const e of [-1,1])Bb(p,.16,4.1,.7,M.woodDark,e*(w/2+.02),.95,-.12);Bb(p,w+.36,.2,.8,M.woodDark,0,5.0,-.12);
 {const s=new T.Shape();s.moveTo(-w/2-.18,0);s.lineTo(w/2+.18,0);s.quadraticCurveTo(0,.7,-w/2-.18,0);ext(p,s,.12,.02,M.wood,0,5.2,-.12);}
 const bq=new T.Group();bq.position.set(0,0,d/2+.5);p.add(bq);banqueta(bq,1.2,M.velvetBlue);}
function altar(p){Bb(p,2.2,.92,.8,M.trim,0,0,0);Bb(p,2.4,.1,.95,M.trim,0,.92,0);Bt(p,2.3,.012,.97,R.toalhaAltar,0,1.02,0);Bt(p,2.3,.42,.012,R.toalhaAltar,0,.62,.49);
 for(const e of [-1,1])for(const i of [0,1])castical(p,e*(.65+i*.3),1.032,-.12,1);
 Lt(p,[[0,0],[.12,0],[.12,.05],[.04,.1],[.04,.55],[0,.55]],M.goldM,0,1.032,-.18,10);sol(p,0,1.82,-.18,.32);livroAberto(p,0,1.04,.2,0,.9);}
function sol(p,x,y,z,r){const s=new T.Shape();for(let k=0;k<32;k++){const rr=k%2?r*.55:r*(k%4?.85:1),a=k/32*PI*2;k?s.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):s.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}s.closePath();
 ext(p,s,.04,.01,M.goldM,x,y,z);Ms(p,new T.CylinderGeometry(r*.32,r*.32,.07,16),R.cristal[1],x,y,z+.01,PI/2,0,0);}
function bancoCapela(p,L){Bb(p,L,.06,.42,M.wood,0,.44,.03);Bb(p,L,.55,.05,M.wood,0,.5,-.2);Bb(p,L+.04,.06,.09,M.woodDark,0,1.05,-.2);
 for(const e of [-1,1]){const s=new T.Shape();s.moveTo(-.27,0);s.lineTo(.27,0);s.lineTo(.27,.92);s.quadraticCurveTo(.15,1.14,0,1.17);s.quadraticCurveTo(-.22,1.06,-.27,.95);s.closePath();
  ext(p,s,.06,.01,M.woodDark,e*(L/2+.01),0,0,0,PI/2,0,6);}
 Bb(p,L-.1,.08,.16,M.woodDark,0,.1,-.44);for(const e of [-1,1])Bb(p,.05,.1,.16,M.woodDark,e*(L/2-.1),0,-.44);}
function armeiro(p,w){w=w||2.6;const h=2.15;Bb(p,w,.1,.42,M.woodDark,0,0,0);Bb(p,w,.08,.1,M.woodDark,0,h,-.14);for(const e of [-1,0,1])Bb(p,.08,h,.08,M.woodDark,e*(w/2-.05),0,-.14);
 Bb(p,w,.06,.16,M.woodDark,0,1.12,-.07);const n=Math.max(4,Math.floor(w/.3));
 for(let i=0;i<n;i++){const x=-w/2+.2+i*(w-.4)/(n-1);
  if(i%3===1){haste(p,x,.1,.02,x,2.4,-.08,.017,M.woodDark,6);Ms(p,new T.ConeGeometry(.035,.26,4),M.steel,x,2.53,-.085);Bb(p,.08,.05,.02,M.velvet,x,2.33,-.08);}
  else if(i%3===2){haste(p,x,.1,.02,x,1.7,-.06,.016,M.woodDark,6);const s=new T.Shape();s.moveTo(0,0);s.quadraticCurveTo(.2,-.02,.24,.12);s.quadraticCurveTo(.2,.26,0,.24);s.closePath();ext(p,s,.012,.004,M.steel,x+.01,1.5,-.06);}
  else{Bb(p,.05,.95,.012,M.steel,x,1.16,-.05);Bb(p,.2,.035,.04,M.goldM,x,1.13,-.05);Cy(p,.017,.017,.2,M.leather,x,.93,-.05,6);Sp(p,.03,M.goldM,x,.92,-.05,6,4);}}}
function bigorna(p){Bb(p,.5,.38,.5,M.woodDark,0,0,0);Bb(p,.3,.1,.22,M.iron,0,.38,0);Bb(p,.17,.14,.14,M.iron,0,.48,0);Bb(p,.5,.12,.18,M.iron,0,.62,0);Ms(p,new T.ConeGeometry(.075,.3,8),M.iron,.39,.68,0,0,0,PI/2);
 Bb(p,.04,.02,.2,M.woodDark,-.05,.74,.0,.4);Bb(p,.08,.06,.06,M.iron,-.05,.74,.08);}
function amolador(p){for(const e of [-1,1])Bb(p,.06,.7,.06,M.woodDark,e*.22,0,0);Bb(p,.5,.06,.3,M.woodDark,0,.25,0);
 Ms(p,new T.CylinderGeometry(.26,.26,.1,16),M.base,0,.72,0,0,0,PI/2);haste(p,-.25,.72,0,.25,.72,0,.02,M.iron,4);haste(p,.25,.72,0,.25,.62,.12,.015,M.iron,4);Bt(p,.4,.12,.25,M.wood,0,.02,.3);}
function boneco(p){Cy(p,.25,.28,.08,M.woodDark,0,0,0,10);haste(p,0,.08,0,0,1.0,0,.04,M.woodDark,6);Cy(p,.2,.22,.7,R.palha,0,.9,0,10);Sp(p,.15,R.palha,0,1.75,0,8,6);
 haste(p,-.42,1.4,0,.42,1.4,0,.05,R.palha,6);for(let i=0;i<4;i++){const t=new T.Mesh(new T.TorusGeometry(.212,.012,4,14),R.corda);t.rotation.x=PI/2;t.position.y=.98+i*.18;p.add(t);}
 Cy(p,.12,.12,.012,M.velvet,0,1.3,.2,12).rotation.x=PI/2;}
function barrilFlechas(p,x,z){barril(p,x,z);const r=rng(Math.abs(Math.round(x*13+z*7))+1);for(let i=0;i<12;i++){const a=r()*PI*2,rr=r()*.16,bx=x+Math.cos(a)*rr,bz=z+Math.sin(a)*rr,tx2=bx+Math.cos(a)*.12,tz=bz+Math.sin(a)*.12;
 haste(p,bx,.3,bz,tx2,1.45,tz,.008,M.woodDark,3);Bb(p,.012,.12,.04,i%2?R.linho:M.velvet,tx2,1.3,tz,a);}}
function vitrine(p,w,h,conteudo){w=w||1.4;h=h||1.0;const d=.6;Bb(p,w,.9,d,M.woodDark,0,0,0);Bb(p,w+.06,.05,d+.06,M.wood,0,.9,0);
 Bb(p,w,h,d,R.vidro,0,.95,0);for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]])Bb(p,.03,h,.03,M.goldM,x*(w/2-.015),.95,z*(d/2-.015));Bb(p,w+.06,.04,d+.06,M.goldM,0,.95+h,0);
 Bb(p,w-.1,.03,d-.1,M.velvet,0,.95,0);if(conteudo)conteudo(p,.98);}
function coroa(p,x,y,z,s){s=s||1;const q=new T.Group();q.position.set(x,y,z);q.scale.setScalar(s);p.add(q);Cy(q,.13,.12,.1,M.goldM,0,0,0,16);
 for(let i=0;i<8;i++){const a=i/8*PI*2;Ms(q,new T.ConeGeometry(.025,.09,4),M.goldM,Math.cos(a)*.125,.14,Math.sin(a)*.125);Sp(q,.014,M.goldM,Math.cos(a)*.125,.19,Math.sin(a)*.125,4,3);
  Ms(q,new T.OctahedronGeometry(.016,0),R.cristal[i%4],Math.cos(a)*.13,.05,Math.sin(a)*.13);}
 Sp(q,.11,M.velvet,0,.07,0,10,6).scale.y=.7;Sp(q,.03,M.goldM,0,.17,0,6,4);}
function taca(p,x,y,z,s){s=s||1;const q=new T.Group();q.position.set(x,y,z);q.scale.setScalar(s);p.add(q);Lt(q,[[0,0],[.06,0],[.065,.015],[.015,.04],[.015,.16],[.06,.19],[.075,.28],[.07,.3],[0,.27]],M.goldM,0,0,0,10);
 for(const e of [-1,1])Ms(q,new T.TorusGeometry(.035,.008,4,8,PI),M.goldM,e*.075,.24,0,0,0,e<0?PI/2:-PI/2);}
function orbe(p,x,y,z){Sp(p,.08,M.goldM,x,y+.08,z,12,8);B(p,.016,.1,.016,M.goldM,x,y+.2,z);B(p,.06,.016,.016,M.goldM,x,y+.21,z);Ms(p,new T.TorusGeometry(.081,.008,4,16),M.goldM,x,y+.08,z,PI/2,0,0);}
function pilhaMoedas(p,x,z,r,h){h=h||r*.55;const me=Lt(p,[[0,0],[r,0],[r*.85,h*.25],[r*.55,h*.7],[r*.2,h*.97],[0,h]],R.moedas,x,0,z,14);const rr=rng(Math.abs(Math.round(x*7+z*3))+2);
 for(let i=0;i<14;i++){const a=rr()*PI*2,d=r*(1+rr()*.5);Ms(p,new T.CylinderGeometry(.03,.03,.008,8),M.goldM,x+Math.cos(a)*d,.004,z+Math.sin(a)*d,(rr()-.5)*.3,0,(rr()-.5)*.3);}
 for(let i=0;i<4;i++){const a=rr()*PI*2,d=r*.5*rr();const c=Ms(p,new T.OctahedronGeometry(.05,0),R.cristal[i%4],x+Math.cos(a)*d,h*(1-d/r)*.9+.03,z+Math.sin(a)*d);c.scale.y=1.4;}}
function barrasOuro(p,x,z,n){const s=new T.Shape();s.moveTo(-.14,0);s.lineTo(.14,0);s.lineTo(.11,.07);s.lineTo(-.11,.07);s.closePath();let i=0;
 for(let l=0;l<3&&i<n;l++)for(let j=0;j<3-l&&i<n;j++,i++){const g=new T.ExtrudeGeometry(s,{depth:.13,bevelEnabled:false});g.translate(0,0,-.065);Ms(p,g,M.goldM,x+(j-(2-l)/2)*.3,l*.07,z,0,0,0);}}
function cristais(p,x,z,n,esc){esc=esc||1;const r=rng(Math.abs(Math.round(x*5+z*9))+4);Cy(p,.35*esc,.4*esc,.08,M.base,x,0,z,8);
 for(let i=0;i<n;i++){const a=r()*PI*2,d=r()*.2*esc,h=(.35+r()*.6)*esc;const c=Ms(p,new T.OctahedronGeometry(.08*esc,0),R.cristal[i%4],x+Math.cos(a)*d,.08+h*.5,z+Math.sin(a)*d,(r()-.5)*.5,r()*3,(r()-.5)*.5);c.scale.set(1,h/(.16*esc),1);}}
function portaCofre(p){Ms(p,new T.CylinderGeometry(1.25,1.25,.12,32),M.steel,0,1.55,.06,PI/2,0,0);Ms(p,new T.TorusGeometry(1.25,.06,6,32),M.goldM,0,1.55,.12);
 Ms(p,new T.TorusGeometry(.42,.035,6,20),M.iron,0,1.55,.16);for(let i=0;i<6;i++){const a=i/6*PI;haste(p,Math.cos(a)*.42,1.55+Math.sin(a)*.42,.16,-Math.cos(a)*.42,1.55-Math.sin(a)*.42,.16,.02,M.iron,4);}
 for(let i=0;i<16;i++){const a=i/16*PI*2;Sp(p,.04,M.goldM,Math.cos(a)*1.1,1.55+Math.sin(a)*1.1,.13,5,4);}for(const e of [-1,1])Bb(p,.2,.5,.08,M.iron,e*1.2,1.3,.09);}
function relogioPe(p){Bb(p,.62,.4,.42,M.woodDark,0,0,0);Bb(p,.46,1.12,.34,M.wood,0,.4,0);Bb(p,.62,.62,.42,M.woodDark,0,1.52,0);
 Bb(p,.7,.06,.46,M.wood,0,2.14,0);ext(p,(()=>{const s=new T.Shape();s.moveTo(-.33,0);s.lineTo(.33,0);s.quadraticCurveTo(.3,.3,0,.34);s.quadraticCurveTo(-.3,.3,-.33,0);s.closePath();return s;})(),.4,.01,M.woodDark,0,2.2,0);
 Ms(p,new T.PlaneGeometry(.46,.46),R.relogio,0,1.83,.215);Bb(p,.3,.9,.012,R.vidro,0,.5,.176);
 for(const e of [-1,1])Sp(p,.04,M.gold,e*.3,2.24,0,6,4);
 const pend=new T.Mesh(juntaGeo([G(new T.CylinderGeometry(.008,.008,.7,4),0,-.35,0),G(new T.CylinderGeometry(.075,.075,.02,14),0,-.74,0,PI/2,0,0)]),M.goldM);pend.position.set(0,1.48,.12);p.add(pend);
 anima(pend,{nome:'pendulo',c:'rz',f:'sen',b:0,a:.2,w:2.6,ph:0});}
function engrenagem(r,n,esp){const s=new T.Shape(),N=n*4;for(let i=0;i<N;i++){const a=i/N*PI*2,q=i%4,rr=q===1||q===2?r:r*.84;i?s.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):s.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}s.closePath();
 const h=new T.Path();h.absarc(0,0,r*.18,0,PI*2,true);s.holes.push(h);for(let k=0;k<4;k++){const a=k/4*PI*2+PI/4,c=r*.52,hp=new T.Path();hp.absarc(Math.cos(a)*c,Math.sin(a)*c,r*.18,0,PI*2,true);s.holes.push(hp);}
 const g=new T.ExtrudeGeometry(s,{depth:esp||.06,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:1,curveSegments:6});g.translate(0,0,-(esp||.06)/2);return g;}
function gato(p,x,z,ry){const q=new T.Group();q.position.set(x,0,z);q.rotation.y=ry||0;p.add(q);Sp(q,.17,R.gato,0,.1,0,10,8).scale.set(1.25,.62,1);Sp(q,.09,R.gato,.16,.1,.1,8,6);Sp(q,.05,R.gatoB,.2,.08,.14,6,4);
 for(const e of [-1,1])Ms(q,new T.ConeGeometry(.03,.06,4),R.gato,.14+e*.035,.18,.1+e*.02,0,0,-e*.2);
 const cauda=new T.Mesh(new T.TorusGeometry(.17,.03,5,12,PI*1.1),R.gato);cauda.rotation.x=PI/2;cauda.position.set(0,.05,0);q.add(cauda);
 for(let i=0;i<3;i++)Ms(q,new T.TorusGeometry(.12+i*.025,.008,3,10,PI*.6),M.woodDark,-.05,.17,-.02,PI/2,0,1.2);}
function gaiola(p){Lt(p,[[0,0],[.2,0],[.2,.03],[.04,.06],[0,.06]],M.goldM,0,0,0,10);haste(p,0,.05,0,0,1.25,0,.02,M.goldM,6);
 const top=1.25;Cy(p,.24,.24,.03,M.goldM,0,top,0,16);for(let i=0;i<14;i++){const a=i/14*PI*2;haste(p,Math.cos(a)*.23,top+.03,Math.sin(a)*.23,Math.cos(a)*.08,top+.62,Math.sin(a)*.08,.005,M.goldM,3);}
 for(const [y,r] of [[top+.2,.205],[top+.42,.14]])Ms(p,new T.TorusGeometry(r,.007,3,18),M.goldM,0,y,0,PI/2,0,0);Ms(p,new T.TorusGeometry(.06,.01,4,10),M.goldM,0,top+.7,0);
 haste(p,-.15,top+.18,0,.15,top+.18,0,.006,M.woodDark,3);Sp(p,.05,R.ave,0,top+.26,0,8,6).scale.set(1,1,1.3);Sp(p,.032,R.ave,0,top+.32,.045,6,4);Ms(p,new T.ConeGeometry(.012,.03,4),M.gold,0,top+.32,.08,PI/2,0,0);
 Ms(p,new T.ConeGeometry(.025,.08,4),R.ave,0,top+.24,-.07,-PI/2-.4,0,0);}
function manequim(p,m){Lt(p,[[0,0],[.2,0],[.2,.03],[.03,.06],[0,.06]],M.woodDark,0,0,0,8);haste(p,0,.05,0,0,1.0,0,.02,M.woodDark,5);
 Lt(p,[[0,0],[.5,0],[.48,.1],[.32,.6],[.2,.92],[.17,1.0],[0,1.0]],m,0,.15,0,14);Lt(p,[[0,0],[.17,0],[.2,.12],[.2,.3],[.14,.42],[.05,.46],[0,.46]],m,0,1.15,0,12);
 Ms(p,new T.TorusGeometry(.18,.015,4,16),M.gold,0,1.16,0,PI/2,0,0);Cy(p,.05,.05,.1,M.woodDark,0,1.61,0,6);Sp(p,.06,M.woodDark,0,1.75,0,6,4);}
function biombo(p){for(let i=0;i<3;i++){const q=new T.Group();q.position.set((i-1)*.58,0,(i%2)*.18);q.rotation.y=(i%2?.5:-.5);p.add(q);
 Bb(q,.56,1.7,.04,M.woodDark,0,.06,0);Bb(q,.46,1.3,.045,M.drape[1],0,.24,0);Sp(q,.03,M.gold,0,1.8,0,5,4);}}
function penteadeira(p){mesa(p,1.2,.5,{h:.76});Bb(p,1.0,.04,.06,M.woodDark,0,.76,-.2);const e2=Ms(p,new T.TorusGeometry(.33,.035,6,24),M.goldM,0,1.32,-.21);e2.scale.set(1,1.3,1);
 Ms(p,new T.CircleGeometry(.32,24),M.steel,0,1.32,-.2).scale.set(1,1.3,1);for(const e of [-1,1])haste(p,e*.38,.78,-.21,e*.33,1.25,-.21,.02,M.goldM,4);
 vaso(p,-.38,.78,.05,true,R.ceramica);for(let i=0;i<3;i++)Lt(p,[[0,0],[.03,0],[.035,.05],[.012,.08],[.012,.1],[0,.1]],R.cristal[i],.15+i*.09,.78,.0,8);
 const bq=new T.Group();bq.position.set(0,0,.55);p.add(bq);Cy(bq,.22,.22,.12,M.velvet,0,.38,0,12);Lt(bq,PERNA(.38),M.woodDark,0,0,0,6);}
function espelhoPe(p){for(const e of [-1,1]){Bb(p,.08,.05,.5,M.woodDark,e*.4,0,0);haste(p,e*.4,.05,0,e*.4,1.6,0,.025,M.woodDark,6);Sp(p,.04,M.gold,e*.4,1.63,0,5,4);}
 const q=new T.Group();q.position.set(0,1.0,0);q.rotation.x=-.08;p.add(q);const fr=Ms(q,new T.TorusGeometry(.36,.035,6,24),M.goldM,0,0,0);fr.scale.set(1,2.0,1);Ms(q,new T.CircleGeometry(.35,24),M.steel,0,0,.01).scale.set(1,2.0,1);}
function lavatorio(p){Bb(p,.7,.85,.45,M.wood,0,0,0);Bb(p,.76,.04,.5,M.trim,0,.85,0);Lt(p,[[0,0],[.08,0],[.2,.08],[.24,.12],[0,.06]],R.ceramica,0,.89,0,14);
 Lt(p,[[0,0],[.07,0],[.09,.08],[.06,.2],[.04,.26],[.06,.3],[0,.3]],R.ceramica,.25,.89,.1,10);Bb(p,.04,.4,.3,R.linho,-.37,.45,0);Bb(p,.04,.02,.3,M.woodDark,-.37,.86,0);}
function prato(p,x,y,z,comida){Lt(p,[[0,0],[.11,0],[.135,.015],[.125,.022],[0,.012]],R.ceramica,x,y,z,12);if(!comida)return;
 const r=rng(Math.abs(Math.round(x*97+z*31))+5),k2=Math.floor(r()*3);
 if(k2===0)Sp(p,.05,R.pao,x,y+.035,z,7,5).scale.set(1.3,.6,.9);else if(k2===1){Sp(p,.035,R.fruta,x-.03,y+.04,z,6,5);Sp(p,.035,R.fruta,x+.035,y+.04,z+.01,6,5);}else Bb(p,.09,.04,.06,R.queijo,x,y+.012,z,r()*2);}
function lugarMesa(p,x,y,z,ry){const c=Math.cos(ry),s=Math.sin(ry),L=(a,b)=>[x+a*c+b*s,z-a*s+b*c];prato(p,x,y,z,true);
 const [tx2,tz]=L(.17,.14);Lt(p,[[0,0],[.03,0],[.034,.012],[.008,.03],[.008,.1],[.035,.12],[.04,.18],[0,.17]],M.goldM,tx2,y,tz,8);
 for(const e of [-1,1]){const [fx,fz]=L(e*.17,-.02);Bb(p,.012,.006,.17,M.steel,fx,y,fz,ry);}}
function fruteira(p,x,y,z){Lt(p,[[0,0],[.06,0],[.06,.02],[.02,.04],[.02,.08],[.18,.12],[.2,.15],[0,.1]],M.goldM,x,y,z,12);
 for(let i=0;i<5;i++){const a=i/5*PI*2;Sp(p,.045,i%2?R.fruta:R.queijo,x+Math.cos(a)*.09,y+.16,z+Math.sin(a)*.09,7,5);}
 for(let i=0;i<7;i++)Sp(p,.022,R.uva,x+(i%3-1)*.025,y+.2+Math.floor(i/3)*.025,z,5,4);}
function jarro(p,x,y,z,m){Lt(p,[[0,0],[.06,0],[.08,.06],[.08,.14],[.05,.2],[.04,.24],[.055,.27],[0,.26]],m||M.goldM,x,y,z,10);Ms(p,new T.TorusGeometry(.05,.01,4,8,PI),m||M.goldM,x-.075,y+.15,z,0,0,PI/2);}
function assado(p,x,y,z){Lt(p,[[0,0],[.22,0],[.26,.02],[.25,.03],[0,.02]],M.steel,x,y,z,14);Sp(p,.13,R.pao,x,y+.08,z,10,7).scale.set(1.3,.7,1);
 for(const e of [-1,1]){haste(p,x+e*.1,y+.07,z+.08,x+e*.2,y+.1,z+.16,.03,R.pao,5);Sp(p,.02,R.linho,x+e*.21,y+.1,z+.17,5,4);}for(let i=0;i<5;i++)Sp(p,.03,R.folha2,x+(i-2)*.08,y+.02,z-.15,5,4);}
function pergaminhos(p,x,y,z,n,ry){const r=rng(Math.abs(Math.round(x*11+z*5))+7);for(let i=0;i<n;i++){const q=Ms(p,new T.CylinderGeometry(.025,.025,.3+r()*.15,8),R.perg,x+(r()-.5)*.2,y+.03+(i>2?.05:0),z+(r()-.5)*.15,0,ry||0,PI/2);q.rotation.y+=(r()-.5)*.6;}}
function escrevinhador(p,y){livroAberto(p,-.1,y,.05,.1);tinteiro(p,.35,y,-.12);livrosPilha(p,-.6,y,-.15,4,17);pergaminhos(p,.55,y,.1,3,0);castical(p,.65,y,-.2,1);Bt(p,.22,.004,.3,R.perg,.15,y,.12,.3);}
function sino(p,x,z,esc){esc=esc||1;const q=new T.Group();q.position.set(x,0,z);q.scale.setScalar(esc);p.add(q);
 for(const e of [-1,1]){Bb(q,.12,1.7,.12,M.woodDark,e*.6,0,0);Bb(q,.4,.08,.4,M.woodDark,e*.6,0,0);haste(q,e*.6,.1,.18,e*.6,.9,0,.025,M.woodDark,4);haste(q,e*.6,.1,-.18,e*.6,.9,0,.025,M.woodDark,4);}
 Bb(q,1.36,.14,.16,M.woodDark,0,1.7,0);Lt(q,[[0,0],[.34,0],[.36,.04],[.3,.12],[.24,.36],[.2,.5],[.1,.56],[0,.57]],M.brass,0,.98,0,16);Sp(q,.05,M.iron,0,1.06,0,6,4);haste(q,0,1.06,0,0,1.5,0,.012,M.iron,4);
 Ms(q,new T.TorusGeometry(.06,.015,4,10),M.iron,0,1.6,0);}
function escadaMao(p,x,z,h,ry){const q=new T.Group();q.position.set(x,0,z);q.rotation.y=ry||0;p.add(q);const lean=.6;
 for(const e of [-1,1])haste(q,e*.24,0,lean,e*.24,h,0,.03,M.woodDark,5);for(let y=.3;y<h-.1;y+=.32){const t=y/h;haste(q,-.24,y,lean*(1-t),.24,y,lean*(1-t),.018,M.woodDark,4);}}

function colunasMoedas(p,x,z,n,seed){const r=rng(seed||1);for(let i=0;i<n;i++){const a=r()*PI*2,d=.15+r()*.4,h=.03+r()*.14;Cy(p,.036,.036,h,M.goldM,x+Math.cos(a)*d,0,z+Math.sin(a)*d,10);}}
function caixote(p,x,z,s,ry){const q=new T.Group();q.position.set(x,0,z);q.rotation.y=ry||0;p.add(q);Bb(q,s,s,s,M.wood,0,0,0);
 for(const [w,h,d,y] of [[s+.02,.08,s+.02,0],[s+.02,.08,s+.02,s-.08]])Bb(q,w,h,d,M.woodDark,0,y,0);for(const [x2,z2] of [[-1,-1],[1,-1],[-1,1],[1,1]])Bb(q,.08,s,.08,M.woodDark,x2*(s/2-.03),0,z2*(s/2-.03));
 const dg=Bb(q,.06,s*1.3,.02,M.woodDark,0,-s*.15,s/2+.01);dg.rotation.z=.75;dg.position.y=s/2;return q;}
function rolosCorda(p,x,z){for(let i=0;i<4;i++)Ms(p,new T.TorusGeometry(.22-i*.012,.035,5,14),R.corda,x,.035+i*.06,z,PI/2,0,0);}
function lanterna(s,lado,t,y){const [x,z,rot]=faceDe(s,lado,t,0);const p=new T.Group();p.position.set(x,Y(y),z);p.rotation.y=rot;K.g.add(p);
 B(p,.05,.05,.3,M.iron,0,.25,.15);B(p,.02,.15,.02,M.iron,0,.15,.29);const q=new T.Group();q.position.set(0,-.12,.29);p.add(q);
 Bb(q,.2,.02,.2,M.iron,0,0,0);Bb(q,.22,.03,.22,M.iron,0,.3,0);Ms(q,new T.ConeGeometry(.15,.12,4),M.iron,0,.39,0,0,PI/4,0);for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]])Bb(q,.018,.3,.018,M.iron,a*.09,0,b*.09);
 Bb(q,.17,.28,.17,R.vidro,0,.02,0);Cy(q,.025,.025,.08,M.candle,0,.02,0,6);chamaEm(q,0,.15,0,.38);}
function ferramentas(s,lado,t,y){const [x,z,rot]=faceDe(s,lado,t,0);const p=new T.Group();p.position.set(x,Y(y),z);p.rotation.y=rot;K.g.add(p);Bb(p,1.6,.9,.04,M.woodDark,0,-.45,.02);
 for(let i=0;i<5;i++)Sp(p,.012,M.iron,-.65+i*.32,.3,.05,4,3);
 Bb(p,.05,.36,.03,M.wood,-.6,-.1,.06);Bb(p,.16,.06,.06,M.iron,-.6,.24,.06);Bb(p,.04,.4,.02,M.steel,-.25,-.15,.06,0);Ms(p,new T.TorusGeometry(.05,.012,4,10),M.steel,-.25,.28,.06);
 {const s2=new T.Shape();s2.moveTo(0,0);s2.lineTo(.45,0);s2.lineTo(.45,.12);s2.lineTo(0,.2);s2.closePath();ext(p,s2,.008,0,M.steel,.05,-.05,.06);Bb(p,.12,.14,.04,M.wood,.02,-.12,.06);}
 Bb(p,.04,.5,.03,M.wood,.65,-.3,.06);Ms(p,new T.TorusGeometry(.06,.015,4,10,PI),M.iron,.65,.24,.06,0,0,0);}
function elmo(p,x,y,z,ry){const q=new T.Group();q.position.set(x,y,z);q.rotation.y=ry||0;p.add(q);Lt(q,[[0,0],[.13,0],[.14,.08],[.13,.16],[.1,.24],[.05,.28],[0,.29]],M.steel,0,0,0,14);
 Bb(q,.2,.025,.03,M.iron,0,.12,.125);Bb(q,.02,.2,.02,M.goldM,0,.06,.13);Ms(q,new T.ConeGeometry(.02,.1,6),M.goldM,0,.33,0);}
function lanceiro(p,x,z){Cy(p,.42,.42,.1,M.woodDark,x,0,z,14);Cy(p,.08,.08,1.3,M.woodDark,x,.1,z,8);Ms(p,new T.TorusGeometry(.36,.03,5,16),M.woodDark,x,1.1,z,PI/2,0,0);
 for(let i=0;i<7;i++){const a=i/7*PI*2,bx=x+Math.cos(a)*.34,bz=z+Math.sin(a)*.34;haste(p,bx,.1,bz,bx*1.0+Math.cos(a)*.04,2.5,bz+Math.sin(a)*.04,.016,M.woodDark,5);Ms(p,new T.ConeGeometry(.032,.24,4),M.steel,bx+Math.cos(a)*.04,2.62,bz+Math.sin(a)*.04);}}
function sinoChao(p,x,z,r){Bb(p,r*2.2,.15,r*2.2,M.woodDark,x,0,z);Lt(p,[[0,0],[r,0],[r*1.05,r*.12],[r*.85,r*.35],[r*.7,r*1.05],[r*.55,r*1.4],[r*.28,r*1.55],[0,r*1.58]],M.brass,x,.15,z,16);Ms(p,new T.TorusGeometry(r*.16,r*.05,5,10),M.brass,x,.15+r*1.66,z);}

// ================= trono (salão principal) =================
function trono(tz){
 const dp=peca(0,tz+.2,0);
 Bb(dp,8,.25,4.6,M.trim,0,0,.2);Bb(dp,6.4,.25,3.8,M.trim,0,.25,0);Bb(dp,4.8,.25,3.0,M.trim,0,.5,-.2);
 for(const [w,y,z] of [[8.02,.25,2.5],[6.42,.5,1.9],[4.82,.75,1.3]])Bb(dp,w,.03,.06,M.gold,0,y-.03,z);
 Bt(dp,4.4,.012,2.6,R.tapete[0],0,.75,-.2);
 const p=peca(0,tz-.3,0);const yb=.75;
 Bb(p,1.5,.55,1.1,M.goldM,0,yb,0);Bb(p,1.36,.2,.96,M.velvet,0,yb+.55,.04);Sp(p,.04,M.gold,0,yb+.4,.56,6,4);
 for(const e of [-1,1]){Bb(p,.22,.5,1.0,M.goldM,e*.78,yb+.55,0);Bb(p,.3,.08,1.1,M.goldM,e*.78,yb+1.05,.02);
  const lh=Sp(p,.13,M.goldM,e*.78,yb+1.22,.52,10,8);const ju=Ms(p,new T.TorusGeometry(.12,.045,6,12),M.goldM,e*.78,yb+1.22,.45);Sp(p,.03,M.iron,e*.78+.05,yb+1.26,.64,5,4);Sp(p,.03,M.iron,e*.78-.05,yb+1.26,.64,5,4);
  Lt(p,[[0,0],[.12,0],[.1,.1],[.07,.4],[.1,.5],[0,.52]],M.goldM,e*.78,yb,.5,8);}
 const s=new T.Shape();s.moveTo(-.82,0);s.lineTo(.82,0);s.lineTo(.82,2.3);s.quadraticCurveTo(.8,2.9,0,3.3);s.quadraticCurveTo(-.8,2.9,-.82,2.3);s.closePath();
 ext(p,s,.18,.03,M.goldM,0,yb+.5,-.52,0,0,0,12);
 const s2=new T.Shape();s2.moveTo(-.6,0);s2.lineTo(.6,0);s2.lineTo(.6,2.0);s2.quadraticCurveTo(.58,2.5,0,2.82);s2.quadraticCurveTo(-.58,2.5,-.6,2.0);s2.closePath();ext(p,s2,.05,.02,M.velvet,0,yb+.65,-.41,0,0,0,12);
 sol(p,0,yb+2.65,-.36,.28);coroa(p,0,yb+3.82,-.52,1.5);for(const e of [-1,1])Sp(p,.09,M.goldM,e*.82,yb+2.85,-.52,8,6);
 solido(0,tz+.2,8,4.6);
 // dossel: armação de veludo com franja, cortinas presas nas laterais e painel atrás do trono
 const dz=tz-.4,cy=5.7;
 for(const [x,z] of [[-2.1,dz+1.6],[2.1,dz+1.6]]){const q=peca(x,z,0);Lt(q,[[0,0],[.13,0],[.14,.2],[.09,.4],[.1,2.0],[.08,4.2],[.12,4.4],[.08,cy-.2],[0,cy-.2]],M.goldM,0,.75,0,10);}
 {const q=peca(0,dz,0);Bb(q,4.6,.4,3.6,M.velvet,0,cy,0);Bb(q,4.7,.08,3.7,M.gold,0,cy+.4,0);Bb(q,4.66,.06,3.66,M.gold,0,cy-.06,0);
  for(const [w,d,x,z] of [[4.62,.04,0,1.82],[.04,3.62,2.31,0],[.04,3.62,-2.31,0]]){Bb(q,w,.45,d,M.velvet,x,cy-.45,z);Bb(q,w+.02,.06,d+.02,M.gold,x,cy-.5,z);}
  Bb(q,3.2,cy-.75,.06,M.velvet,0,.75,-1.75);Bb(q,3.24,.08,.08,M.gold,0,cy-.1,-1.74);
  for(const e of [-1,1]){const c=Bb(q,.5,cy-1.3,.18,M.velvet,e*2.05,.75,1.5);c.rotation.z=-e*.05;Ms(q,new T.TorusGeometry(.14,.03,5,10),M.gold,e*2.05,2.4,1.55,PI/2,0,0);}
  coroa(q,0,cy+.48,0,2.2);}
 // braseiros e candelabros
 for(const e of [-1,1]){const q=peca(e*3.5,tz+2.1,0);for(let i=0;i<3;i++){const a=i/3*PI*2+.5;haste(q,Math.cos(a)*.35,0,Math.sin(a)*.35,0,.9,0,.035,M.iron,5);}
  Lt(q,[[0,0],[.18,0],[.4,.18],[.45,.3],[.42,.32],[0,.14]],M.goldM,0,.9,0,14);Bb(q,.5,.08,.5,M.fire,0,1.08,0,.6);chamaEm(q,0,1.28,0,2.2);solido(e*3.5,tz+2.1,.9,.9);
  candelabroChao(peca(e*2.9,tz-1.0,0),0,0,1.9);}}

// ================= andares =================
function andar0(){
 const C='C0',tz=-15.5+2.2;
 // salão principal: passadeira, colunas com tochas, trono, armaduras, tapeçarias, quadros, lustres
 {const p=peca(0,-1.65,0);Bb(p,3,.03,18.2,M.carpet,0,.006,0,0,3);for(const e of [-1,1])Bb(p,.08,.032,18.2,M.gold,e*1.54,.006,0);}
 for(const sx of [-1,1])for(const z of [-11,-7,-3,1,5]){const p=peca(sx*4.2,z,0);Bb(p,1.2,.3,1.2,M.base,0,0,0);Bb(p,1.0,.2,1.0,M.trim,0,.3,0);Cy(p,.45,.5,K.H-K.F-1.0,M.trim,0,.5,0,14);
  Bb(p,1.1,.25,1.1,M.trim,0,K.H-K.F-.55,0);Bb(p,1.25,.2,1.25,M.trim,0,K.H-K.F-.3,0);solido(sx*4.2,z,1.2,1.2);
  const q=peca(sx*3.68,z,sx>0?-PI/2:PI/2);B(q,.14,.3,.03,M.iron,0,2.0,0);B(q,.03,.03,.22,M.iron,0,1.94,.11);Lt(q,[[0,0],[.06,0],[.08,.08],[0,.08]],M.goldM,0,2.04,.22,8);Cy(q,.03,.03,.14,M.candle,0,2.12,.22,6);chamaEm(q,0,2.32,.22,.8);}
 trono(tz);
 for(const e of [-1,1]){K.armadura(e*5.1,-13.7,e>0?-PI/2:PI/2,e>0?1:0);K.armadura(e*5.15,-5,e>0?-PI/2:PI/2,2);}
 for(const e of [-1,1]){const L=e<0?'O':'L';tapecaria(C,L,-5,4.4,1.6,3.2,e>0?1:0);quadro(C,L,-7.6,3.3,1.3,1.0,e>0?2:5);quadro(C,L,-2.4,3.3,1.3,1.0,e>0?7:1);quadro(C,L,5.5,3.2,1.6,1.2,e>0?0:6);tapecaria(C,L,-13.7,4.6,1.3,2.6,e>0?3:2);}
 K.BN.push([1.5,5,'blue',4.6,Y(5.5),-15.5+.16],[1.5,5,'red',-4.6,Y(5.5),-15.5+.16]);for(const e of [-1,1]){const q=peca(e*4.6,-15.5+.12,0);Bb(q,1.8,.1,.12,M.gold,0,5.5,0);for(const e2 of [-1,1])Sp(q,.07,M.gold,e2*.95,5.55,0,6,4);}
 for(const z of [-8,-1,5])lustre(0,z,6,1.1);
 for(const e of [-1,1])planta(peca(e*3.3,6.9,0),0,0,true);
 // biblioteca (oeste, fundo): estantes nas paredes e entre janelas, mesa de leitura, atril, globo, escada
 const OB='OB';
 {const p=naParede(OB,'O',-9,.44);estante(p,3.2,4.2,{seed:11,escada:true});solido(-15.5+.3,-9,.5,3.2);}
 {const p=naParede(OB,'O',-14.4,.44);estante(p,1.9,4.2,{seed:12});solido(-15.5+.3,-14.4,.5,1.9);}
 {const p=naParede(OB,'N',-10,.44);estante(p,1.3,3.6,{seed:13});solido(-10,-15.5+.3,1.3,.5);}
 {const p=naParede(OB,'L',-13.75,.44);estante(p,3.0,4.2,{seed:14});solido(-6.25-.3,-13.75,.5,3.0);}
 {const p=naParede(OB,'L',-6.55,.44);estante(p,3.3,4.2,{seed:15});solido(-6.25-.3,-6.55,.5,3.3);}
 {const p=naParede(OB,'S',-13.75,.44);estante(p,3.0,4.2,{seed:16});solido(-13.75,-4.25-.3,3.0,.5);}
 {const p=naParede(OB,'S',-8.5,.44);estante(p,2.8,4.2,{seed:17});solido(-8.5,-4.25-.3,2.8,.5);}
 {const p=peca(-10.8,-12.9,0);estante(p,3.2,2.3,{seed:18});const q=peca(-10.8,-12.9,PI);estante(q,3.2,2.3,{seed:19});solido(-10.8,-12.9,3.3,.95);}
 tapete(-10.6,-9.3,4.2,3.0,0);
 {const p=peca(-10.6,-9.3,0);mesa(p,2.6,1.2);escrevinhador(p,.78);castical(p,.0,.78,-.3,3);solido(-10.6,-9.3,2.6,1.2);
  for(const [x,z,r] of [[-.7,-1.0,0],[.7,-1.0,0],[-.7,1.0,PI],[.7,1.0,PI]])cadeira(peca(-10.6+x,-9.3+z,r),{});}
 {const p=peca(-8.0,-11.3,-PI/2);Lt(p,[[0,0],[.25,0],[.25,.04],[.06,.1],[.05,1.0],[.1,1.05],[0,1.05]],M.woodDark,0,0,0,8);const q=new T.Group();q.position.set(0,1.1,0);q.rotation.x=.4;p.add(q);Bb(q,.6,.05,.45,M.woodDark,0,0,0);livroAberto(q,0,.05,0,0,1.2);solido(-8,-11.3,.6,.6);}
 globo(peca(-13.9,-6.3,0),.45,'globo biblioteca');
 lustre(-10.6,-9.3,6,.9);
 // sala de estudos (oeste, frente): lareira, poltronas, mesa, escrivaninha, estantes, vitrine, globo, gato
 const OF='OF';
 {const p=naParede(OF,'N',-8.1,.85);lareira(p,2.5,{brasao:2});solido(-8.1,-3.75+.5,3.0,1.0);}
 tapete(-8.1,-1.3,3.4,2.4,2);
 poltrona(peca(-9.05,-.85,PI-.5));poltrona(peca(-7.15,-.85,PI+.5));
 {const p=peca(-8.1,-.4,0);mesaRedonda(p,.38,.55);jarro(p,-.12,.55,0,R.ceramica);for(const e of [-1,1])Lt(p,[[0,0],[.04,0],[.05,.05],[0,.05]],R.ceramica,.12,.55,e*.12,8);}
 gato(peca(-8.6,-2.25,0),0,0,.6);
 {const p=naParede(OF,'O',2.5,.9);escrivaninha(p,1.6,.85);escrevinhador(p,.78);cadeira(peca(-15.5+1.45,2.5,-PI/2),{bracos:true});solido(-15.5+.55,2.5,.9,1.6);}
 {const p=naParede(OF,'N',-13.75,.44);estante(p,3.0,3.4,{seed:21});solido(-13.75,-3.75+.3,3.0,.5);}
 {const p=naParede(OF,'L',5.5,.44);estante(p,3.2,3.4,{seed:22});solido(-6.25-.3,5.5,.5,3.2);}
 {const p=naParede(OF,'L',-1.3,.6);comoda(p,1.3);vaso(p,0,.92,0,true);solido(-6.25-.35,-1.3,.55,1.3);}
 {const p=naParede(OF,'S',-14.4,.6);vitrine(p,1.4,1.0,(q,y)=>{orbe(q,-.35,y,0);taca(q,0,y,0,.9);coroa(q,.38,y,0,.8);});solido(-14.4,7.5-.35,1.4,.6);}
 globo(peca(-10,6.75,0),.36,'globo estudos');
 {const p=peca(-10.8,3.5,0);mesa(p,2.0,1.1);livrosPilha(p,-.5,.78,0,3,31);livroAberto(p,.2,.78,.05,-.2);castical(p,.7,.78,-.2,1);solido(-10.8,3.5,2.0,1.1);
  cadeira(peca(-10.8,2.55,0),{});cadeira(peca(-10.8,4.45,PI),{});}
 planta(peca(-14.9,-3.1,0),0,0,true);lustre(-10.8,2,6,.85);
 // escada (leste, frente): banco, armadura, plantas, quadro
 {const p=naParede('LF','S',10,.5);banqueta(p,1.3,M.velvetBlue);solido(10,7.5-.3,1.3,.5);}
 K.armadura(12.6,-3.75+.5,0,1);planta(peca(7.0,6.85,0),0,0,true);planta(peca(14.9,-3.15,0),0,0,false);
 quadro('LF','O',-2.0,3.0,1.2,1.0,3);tapecaria('LF','N',13.6,4.2,1.2,2.4,0);
 // refeitório (leste, fundo): mesa posta, cadeiras, lareira, aparadores, barris, lustres
 const LB='LB';
 {const p=naParede(LB,'L',-9,.85);lareira(p,2.6,{brasao:0});solido(15.5-.5,-9,1.0,3.1);}
 {const p=peca(10.6,-10,PI/2);mesa(p,6.8,1.5,{h:.8});Bt(p,6.6,.008,.55,R.toalha,0,.8,0);
  for(let i=0;i<5;i++){const x=-2.6+i*1.3;lugarMesa(p,x,.808,-.5,0);lugarMesa(p,x,.808,.5,PI);}
  lugarMesa(p,-3.15,.808,0,PI/2);lugarMesa(p,3.15,.808,0,-PI/2);
  for(const x of [-2.0,2.0])castical(p,x,.808,0,3);assado(p,0,.808,0);fruteira(p,-1.0,.808,0);fruteira(p,1.0,.808,.0);for(const x of [-2.9,.6,2.9])Sp(p,.06,R.pao,x,.84,.1,7,5).scale.set(1.4,.7,.9);
  jarro(p,-.4,.808,.15);jarro(p,1.6,.808,-.12,R.ceramica);solido(10.6,-10,1.5,6.8);}
 for(let i=0;i<5;i++){const z=-12.6+i*1.3;cadeira(peca(9.45,z,PI/2),{});cadeira(peca(11.75,z,-PI/2),{});}
 cadeira(peca(10.6,-14.2,0),{alta:true,bracos:true});cadeira(peca(10.6,-5.8,PI),{alta:true,bracos:true});
 {const p=naParede(LB,'O',-13.8,.55);mesa(p,2.4,.55,{h:.9});for(let i=0;i<5;i++)prato(p,-.9+i*.45,.9,0,false);jarro(p,-1.0,.9,0);jarro(p,1.0,.9,0,R.ceramicaAz);solido(6.25+.35,-13.8,.6,2.4);}
 {const p=naParede(LB,'O',-6.4,.5);comoda(p,2.0);for(let i=0;i<4;i++)prato(p,-.7+i*.46,.92,-.1,false);Bb(p,2.0,1.1,.06,M.woodDark,0,.92,-.22);for(let i=0;i<5;i++){const q=Ms(p,new T.CylinderGeometry(.13,.13,.02,12),R.ceramicaAz,-.8+i*.4,1.5,-.17,PI/2-.2,0,0);}Bb(p,2.0,.04,.16,M.woodDark,0,1.33,-.13);solido(6.25+.3,-6.4,.55,2.0);}
 for(const [x,z] of [[9.6,-14.85],[10.4,-14.85],[14.7,-14.7],[13.95,-14.85]]){barril(peca(x,z,0),0,0);}solido(10,-14.85,1.4,.65);solido(14.3,-14.8,1.3,.7);
 lustre(10.6,-12,6,.9);lustre(10.6,-8,6,.9);
 // tochas de parede
 for(const [s,l,t] of [[OB,'L',-10.25],[OF,'L',-.45],[OF,'O',-1.0],[LB,'O',-10.25],[LB,'S',13],['LF','O',-2.0-1.0]])tocheiro(s,l,t);}

function andar1(){
 const CF='CF',CB='CB',OF='OF',OB='OB',LB='LB';
 // galeria
 tapete(0,1.9,2.2,9.6,1);
 for(const e of [-1,1]){const L=e<0?'O':'L';quadro(CF,L,-1.3,3.0,2.0,1.4,e>0?0:4);quadro(CF,L,5.3,3.3,1.5,2.0,e>0?1:7);tocheiro(CF,L,1.2-.45);tocheiro(CF,L,3.2+.45);}
 quadro(CF,'N',-3.4,3.2,2.4,1.6,8);quadro(CF,'N',3.4,3.2,2.4,1.6,3);
 for(const e of [-1,1]){K.armadura(e*4.85,-3.15,e<0?PI/4:-PI/4,e<0?0:2,true);busto(peca(e*1.75,-3.35,0));solido(e*1.75,-3.35,.5,.5);}
 {const p=peca(-4.9,6.75,0);gaiola(p);solido(-4.9,6.75,.45,.45);}planta(peca(4.9,6.8,0),0,0,true);
 banqueta(peca(0,-1.0,0),2.0);banqueta(peca(0,5.0,0),2.0);solido(0,-1.0,2.0,.55);solido(0,5.0,2.0,.55);
 {const p=peca(-2.6,6.85,PI);mesa(p,1.0,.45,{h:.85});vaso(p,0,.85,0,true);solido(-2.6,6.85,1.0,.45);}
 lustre(0,-.4,6,1.0);lustre(0,4.4,6,1.0);
 // sala do conselho
 tapete(0,-9.9,5.8,5.2,0);
 {const p=peca(0,-9.9,0);mesaRedonda(p,2.1,.8,M.wood);Ms(p,new T.CircleGeometry(1.75,40),R.mapa[0],0,.806,0,-PI/2,0,0);castical(p,0,.806,0,3);for(let i=0;i<4;i++){const a=i/4*PI*2+.4;pergaminhos(p,Math.cos(a)*1.2,.806,Math.sin(a)*1.2,2,a);}solido(0,-9.9,4.2,4.2);}
 for(let i=0;i<8;i++){const a=i/8*PI*2+PI/8;cadeira(peca(Math.cos(a)*2.75,-9.9+Math.sin(a)*2.75,-a-PI/2),{alta:true,bracos:true});}
 quadro(CB,'N',0,3.4,3.0,1.9,8);K.BN.push([1.5,5,'blue',-4.2,Y(5.5),-15.5+.16],[1.5,5,'red',4.2,Y(5.5),-15.5+.16]);
 for(const e of [-1,1]){const L=e<0?'O':'L';{const p=naParede(CB,L,-13.3,.55);comoda(p,2.2);castical(p,-.6,.92,0,3);vaso(p,.55,.92,0,true);solido(e*(5.75-.35),-13.3,.55,2.2);}
  tapecaria(CB,L,-6.6,4.0,1.5,3.0,e>0?2:3);candelabroChao(peca(e*3.5,-4.85,0),0,0,1.8);quadro(CB,'S',e*3.4,3.2,1.6,1.1,e>0?5:2);tocheiro(CB,L,-11-.45);tocheiro(CB,L,-9+.45);}
 lustre(0,-9.9,8,1.2);
 // escritório
 const ox=-10.8;tapete(ox,.1,3.8,2.8,3);
 {const p=peca(ox,-.4,PI);escrivaninha(p,2.0,.95);escrevinhador(p,.78);globo(p,.16,null,-.75,.78,.1);solido(ox,-.4,2.0,.95);}
 cadeira(peca(ox,-1.35,0),{alta:true,bracos:true});cadeira(peca(ox-.6,.7,PI),{});cadeira(peca(ox+.6,.7,PI),{});
 {const p=naParede(OF,'N',-13.75,.44);estante(p,3.0,3.6,{seed:41});solido(-13.75,-3.75+.3,3.0,.5);}
 {const p=naParede(OF,'N',-8.1,.44);estante(p,3.2,3.6,{seed:42});solido(-8.1,-3.75+.3,3.2,.5);}
 {const p=naParede(OF,'O',2.5,.85);lareira(p,2.1,{brasao:1});solido(-15.5+.5,2.5,1.0,2.6);}
 poltrona(peca(-13.3,3.4,-PI/2-.5));{const p=peca(-13.4,2.3,0);mesaRedonda(p,.32,.55);castical(p,0,.55,0,1);}
 {const p=naParede(OF,'L',-1.0,.6);vitrine(p,1.5,1.0,(q,y)=>{coroa(q,-.35,y,0,.7);orbe(q,.35,y,0);});solido(-6.25-.35,-1.0,.6,1.5);}
 {const p=naParede(OF,'L',4.3,.42);relogioPe(p);solido(-6.25-.3,4.3,.45,.65);}quadro(OF,'L',6.2,3.2,1.0,1.3,6);
 planta(peca(-14.75,6.8,0),0,0,true);globo(peca(-10,6.75,0),.36,'globo escritorio');
 lustre(ox,2.2,6,.85);tocheiro(OF,'O',-1.2);
 // sala de mapas
 tapete(-10.8,-9.8,4.4,3.2,1);
 {const p=peca(-10.8,-9.8,0);mesa(p,3.0,1.8,{h:.85});Bt(p,2.6,.008,1.5,R.mapa[1],0,.85,0);Sp(p,.04,M.brass,-1.1,.88,-.6,6,4);Sp(p,.04,M.brass,1.1,.88,.6,6,4);
  Bb(p,.5,.01,.03,M.brass,.3,.86,.2,.6);castical(p,-1.2,.85,.6,1);pergaminhos(p,1.0,.858,-.5,3,.3);solido(-10.8,-9.8,3.0,1.8);
  for(const [x,z,r] of [[-.8,-1.3,0],[.8,-1.3,0],[-.8,1.3,PI],[.8,1.3,PI]])cadeira(peca(-10.8+x,-9.8+z,r),{});}
 for(const t of [-13.3,-6.8]){const p=naParede(OB,'L',t,.5);armarioRolos(p,3.0);solido(-6.25-.32,t,.55,3.0);}
 {const p=naParede(OB,'S',-13.75,.6);comoda(p,2.2);pergaminhos(p,0,.93,0,4,0);solido(-13.75,-4.25-.35,2.2,.55);}
 mapaParede(OB,'S',-13.75,3.0,2.4,1.6,0);mapaParede(OB,'S',-8.6,3.0,2.2,1.5,1);mapaParede(OB,'O',-9,3.1,2.6,1.8,1);
 {const p=naParede(OB,'S',-8.6,.6);bau(p,1.0);solido(-8.6,-4.25-.35,1.0,.6);}
 globo(peca(-14.2,-9.0,0),.5,'globo mapas');
 {const p=peca(-10,-14.6,0);for(let i=0;i<3;i++){const a=i/3*PI*2;haste(p,Math.cos(a)*.35,0,Math.sin(a)*.35,0,1.2,0,.025,M.woodDark,5);}
  const tb=haste(p,-.1,1.2,.35,.15,1.55,-.45,.08,M.brass,10);Ms(p,new T.TorusGeometry(.09,.02,5,12),M.goldM,.15,1.55,-.45,-.7,0,0);solido(-10,-14.6,.8,.8);}
 lustre(-10.8,-9.8,6,.9);tocheiro(OB,'L',-11-.45);tocheiro(OB,'L',-9+.45);
 // arsenal
 for(const t of [-13.3,-6.7]){const p=naParede(LB,'O',t,.42);armeiro(p,3.0);solido(6.25+.3,t,.5,3.0);for(const d of [-1,0,1])escudoParede(LB,'O',t+d*1.0,3.5,(d+2)%5,.9,d===0);}
 for(const [x,v] of [[11.2,0],[12.8,1],[14.4,2]])K.armadura(x,-4.25-.5,PI,v);
 {const p=naParede(LB,'L',-9,.75);mesa(p,2.2,.75,{h:.88});Bb(p,.5,.25,.3,M.iron,-.6,.88,0);Sp(p,.08,M.steel,.3,.96,0,8,6);Bb(p,.3,.05,.06,M.woodDark,.7,.88,.1,.4);solido(15.5-.45,-9,.75,2.2);}
 bigorna(peca(13.2,-9.5,0));solido(13.2,-9.5,.6,.6);amolador(peca(13.4,-7.7,0));solido(13.4,-7.7,.6,.6);
 barrilFlechas(peca(14.6,-14.6,0),0,0);barrilFlechas(peca(13.9,-14.95,0),0,0);solido(14.3,-14.8,1.3,.8);
 boneco(peca(10.4,-11.2,.4));solido(10.4,-11.2,.6,.6);
 {const p=peca(10.6,-7.6,0);mesa(p,2.4,1.0,{h:.82});for(const [x,r] of [[-.8,.3],[0,-.2],[.8,.5]])elmo(p,x,.82,-.15,r);for(const x of [-.5,.4]){const q=new T.Group();q.position.set(x,.84,.28);q.rotation.y=PI/2;p.add(q);Bb(q,.04,.012,.9,M.steel,0,0,.2);Bb(q,.04,.03,.2,M.goldM,0,0,-.27);Cy(q,.016,.016,.16,M.leather,0,0,-.37,6).rotation.x=PI/2;}solido(10.6,-7.6,2.4,1.0);}
 lanceiro(peca(8.3,-12.7,0),0,0);solido(8.3,-12.7,.9,.9);
 escudoParede(LB,'N',10,3.3,0,1.2,true);{const p=naParede(LB,'N',10,.55);bau(p,1.1);solido(10,-15.5+.35,1.1,.6);}
 lustre(10.8,-10,6,.9);tocheiro(LB,'S',12);
 // escada
 K.armadura(12.6,-3.75+.5,0,0);{const p=naParede('LF','S',10,.5);banqueta(p,1.3);solido(10,7.5-.3,1.3,.5);}planta(peca(7.0,6.85,0),0,0,true);quadro('LF','O',-2.0,3.1,1.2,1.0,4);}

function andar2(){
 const CF='CF',CB='CB',OF='OF',OB='OB',LB='LB';
 // salão de música: palco, cravo, harpa, violoncelo, tambor, estantes, plateia
 {const p=peca(0,5.95,0);Bb(p,9.4,.18,2.8,M.woodDark,0,0,0);Bb(p,9.44,.03,.05,M.gold,0,.16,1.4);Bt(p,9.0,.006,2.4,R.tapete[3],0,.18,0);solido(0,5.95,9.4,2.8);}
 {const p=peca(-2.7,5.9,PI*.85);p.position.y+=.18;cravo(p);}
 {const p=peca(.9,6.3,.3);p.position.y+=.18;harpa(p);}
 {const p=peca(2.6,6.2,-.3);p.position.y+=.18;violoncelo(p);const c=peca(2.9,5.6,PI+.3);c.position.y+=.18;cadeira(c,{});}
 {const p=peca(-.6,6.8,0);p.position.y+=.18;tambor(p);}
 for(const [x,r] of [[-1.0,PI],[1.9,PI+.2],[3.6,PI-.3]]){const p=peca(x,5.0,r);p.position.y+=.18;estanteMusica(p);}
 tapete(0,-.6,8.2,3.0,3);
 for(const z of [0.0,-1.2])for(const x of [-3.3,-1.9,1.9,3.3])cadeira(peca(x,z,0),{});
 for(const e of [-1,1]){const L=e<0?'O':'L';quadro(CF,L,-1.3,3.1,1.8,1.3,e>0?6:0);quadro(CF,L,5.3,3.3,1.3,1.7,e>0?4:2);tocheiro(CF,L,1.2-.45);tocheiro(CF,L,3.2+.45);}
 {const p=peca(-4.95,-2.95,PI/4);busto(p);solido(-4.95,-2.95,.5,.5);}{const p=peca(4.95,-2.95,-PI/4);gaiola(p);solido(4.95,-2.95,.45,.45);}
 quadro(CF,'N',-3.4,3.2,2.2,1.5,1);quadro(CF,'N',3.4,3.2,2.2,1.5,5);
 lustre(0,-.6,6,1.0);lustre(0,4.2,6,1.0);
 // capela: degraus, altar, vitral, bancos, órgão, estátua de mármore, velas
 {const p=peca(0,-14.3,0);Bb(p,5.0,.15,2.4,M.trim,0,0,0);Bb(p,3.8,.15,1.7,M.trim,0,.15,-.3);Bb(p,5.02,.025,.05,M.gold,0,.13,1.2);solido(0,-14.3,5.0,2.4);}
 {const p=peca(0,-14.65,0);p.position.y+=.3;altar(p);}
 {const [x,z,r]=faceDe(CB,'N',0,.03);const p=new T.Group();p.position.set(x,Y(2.2),z);p.rotation.y=r;K.g.add(p);
  const s=new T.Shape();s.moveTo(-1.2,0);s.lineTo(1.2,0);s.lineTo(1.2,2.3);s.quadraticCurveTo(1.15,3.4,0,3.6);s.quadraticCurveTo(-1.15,3.4,-1.2,2.3);s.closePath();
  const g2=new T.ShapeGeometry(s,12),uv=g2.attributes.uv,pp=g2.attributes.position;for(let j=0;j<uv.count;j++)uv.setXY(j,(pp.getX(j)+1.2)/2.4,pp.getY(j)/3.6);Ms(p,g2,R.vitral,0,0,.02);
  const fr=new T.Shape();fr.moveTo(-1.45,-.2);fr.lineTo(1.45,-.2);fr.lineTo(1.45,2.3);fr.quadraticCurveTo(1.4,3.7,0,3.9);fr.quadraticCurveTo(-1.4,3.7,-1.45,2.3);fr.closePath();fr.holes.push(new T.Path(s.getPoints(12)));
  ext(p,fr,.1,.02,M.trim,0,0,.05,0,0,0,12);for(const x2 of [-.4,.4])Bb(p,.04,3.4,.03,M.iron,x2,0,.04);Bb(p,2.4,.04,.03,M.iron,0,1.2,.04);}
 tapete(0,-8.9,1.6,8.6,0);
 for(const z of [-11.4,-9.9,-8.4,-6.9])for(const e of [-1,1]){bancoCapela(peca(e*2.55,z,PI),3.2);solido(e*2.55,z,3.3,.75);}
 {const p=naParede(CB,'O',-13.3,.9);orgao(p,3.0);solido(-5.75+.5,-13.3,1.0,3.4);}
 {const [x,z,r]=encosta(CB,'L',-13.3,.9);K.armadura(x,z,r,0,true);}
 for(const e of [-1,1]){candelabroChao(peca(e*2.1,-12.75,0),0,0,1.9);
  const p=naParede(CB,'S',e*4.2,.5);for(let r2=0;r2<3;r2++){Bb(p,1.0,.12,.4-r2*.1,M.woodDark,0,.4+r2*.25,-r2*.05);for(let i=0;i<4;i++){Cy(p,.022,.022,.07,M.candle,-.36+i*.24,.52+r2*.25,.12-r2*.05,6);if((i+r2)%2===0)chamaEm(p,-.36+i*.24,.64+r2*.25,.12-r2*.05,.3);}}
  for(const e2 of [-1,1])Bb(p,.06,.4,.06,M.woodDark,e2*.45,0,0);solido(e*4.2,-4.25-.3,1.0,.5);
  tapecaria(CB,e<0?'O':'L',-6.6,4.0,1.4,2.8,e>0?0:1);tocheiro(CB,e<0?'O':'L',-11-.45);tocheiro(CB,e<0?'O':'L',-9+.45);}
 lustre(0,-8.6,8,1.1);
 // quarto real: cama com dossel, criados-mudos, baú, guarda-roupa, penteadeira, lareira, poltronas, biombo, escrivaninha
 tapete(-8.5,-1.2,4.0,3.4,0);
 {const p=naParede(OF,'L',-1.2,2.5);cama(p,{w:2.2,l:2.5,dossel:true,colcha:M.velvet});solido(-6.25-1.3,-1.2,2.6,2.4);}
 for(const t of [-2.95,.55]){const p=naParede(OF,'L',t,.42);criado(p);solido(-6.25-.3,t,.45,.55);}
 {const p=peca(-9.35,-1.2,-PI/2);bau(p,1.2);solido(-9.35,-1.2,.6,1.2);}
 {const p=naParede(OF,'N',-13.7,.6);armario(p,2.0,2.7);solido(-13.7,-3.75+.38,2.0,.65);}
 {const p=naParede(OF,'N',-8.7,.5);penteadeira(p);solido(-8.7,-3.75+.33,1.2,.55);}
 {const p=naParede(OF,'S',-14.4,.85);lareira(p,1.9,{brasao:4});solido(-14.4,7.5-.5,2.4,1.0);}
 poltrona(peca(-14.2,5.2,PI+.3));poltrona(peca(-12.8,5.6,PI-.6));{const p=peca(-13.5,4.6,0);mesaRedonda(p,.3,.55);vaso(p,0,.55,0,true,R.ceramicaVd);}
 gato(peca(-13.9,6.3,0),0,0,2.4);
 {const p=naParede(OF,'O',-2.6,.4);biombo(p);}
 {const p=naParede(OF,'O',2.5,.6);mesa(p,1.2,.6);livroAberto(p,0,.78,.05,0);tinteiro(p,.4,.78,-.1);solido(-15.5+.4,2.5,.65,1.2);cadeira(peca(-15.5+1.05,2.5,-PI/2),{});}
 lustre(-10.8,1.8,6,.85);quadro(OF,'L',4.6,3.2,1.4,1.0,1);quadro(OF,'L',6.6,3.2,.8,1.0,7);
 // quarto de vestir
 tapete(-10.8,-9.8,3.4,3.0,3);
 for(const t of [-14.4,-12.3,-7.9]){const p=naParede(OB,'L',t,.6);armario(p,1.9,2.6);solido(-6.25-.38,t,.65,1.9);}
 {const p=naParede(OB,'L',-5.6,.5);espelhoPe(p);solido(-6.25-.35,-5.6,.5,.9);}
 {const p=naParede(OB,'S',-13.75,.5);penteadeira(p);solido(-13.75,-4.25-.33,1.2,.55);}
 {const p=naParede(OB,'S',-8.6,.5);comoda(p,1.6);vaso(p,-.5,.92,0,true,R.ceramica);for(let i=0;i<3;i++)Sp(p,.06,R.vestido[i],.1+i*.18,.98,0,6,4);solido(-8.6,-4.25-.3,1.6,.5);}
 for(const [z,i] of [[-9.9,0],[-8.1,1]]){manequim(peca(-14.6,z,PI/2),R.vestido[i]);solido(-14.6,z,.6,.6);}
 {const p=peca(-10.8,-9.8,0);Cy(p,.45,.45,.3,M.velvetBlue,0,.08,0,16);Ms(p,new T.TorusGeometry(.45,.04,5,20),M.gold,0,.38,0,PI/2,0,0);for(let i=0;i<4;i++){const a=i/4*PI*2;Lt(p,[[0,0],[.03,0],[.035,.08],[0,.08]],M.goldM,Math.cos(a)*.36,0,Math.sin(a)*.36,6);}solido(-10.8,-9.8,.9,.9);}
 {const p=naParede(OB,'N',-14.4,.55);bau(p,1.0);solido(-14.4,-15.5+.35,1.0,.6);}
 {const p=peca(-10,-14.8,0);Lt(p,[[0,0],[.2,0],[.2,.03],[.03,.06],[0,.06]],M.woodDark,0,0,0,8);haste(p,0,.05,0,0,1.7,0,.022,M.woodDark,5);for(let i=0;i<4;i++){const a=i/4*PI*2;haste(p,0,1.55,0,Math.cos(a)*.22,1.62,Math.sin(a)*.22,.012,M.woodDark,4);}
  Cy(p,.16,.18,.1,M.velvet,.2,1.62,0,10);Cy(p,.25,.25,.015,M.velvet,.2,1.62,0,12);solido(-10,-14.8,.5,.5);}
 lustre(-10.8,-9.8,6,.85);tocheiro(OB,'O',-9);
 // quarto de hóspedes
 tapete(13.3,-9,3.4,2.8,2);
 {const p=naParede(LB,'L',-9,2.4);cama(p,{w:1.8,l:2.3,colcha:M.velvetGreen});solido(15.5-1.2,-9,2.4,1.9);}
 for(const t of [-10.3,-7.7]){const p=naParede(LB,'L',t,.42);criado(p);solido(15.5-.3,t,.45,.5);}
 {const p=peca(12.6,-9,PI/2);bau(p,1.1);solido(12.6,-9,.6,1.1);}
 {const p=naParede(LB,'O',-13.6,.6);armario(p,1.8,2.5);solido(6.25+.38,-13.6,.65,1.8);}
 {const p=naParede(LB,'O',-6.6,.6);mesa(p,1.4,.6);escrevinhador(p,.78);solido(6.25+.38,-6.6,.65,1.4);cadeira(peca(6.25+1.1,-6.6,PI/2),{});}
 {const p=naParede(LB,'S',12.2,.45);lavatorio(p);solido(12.2,-4.25-.3,.75,.5);}quadro(LB,'S',12.2,2.4,.7,.9,6);
 {const p=naParede(LB,'N',10,.44);estante(p,1.2,2.2,{seed:51});solido(10,-15.5+.3,1.2,.5);}
 poltrona(peca(14.5,-14.4,-PI*.75));planta(peca(13.4,-15.0,0),0,0,false);
 tocheiro(LB,'O',-10.25);tocheiro(LB,'S',9.0);quadro(LB,'O',-9.9,3.2,1.2,.9,3);
 // escada
 {const p=peca(12.6,-3.75+.45,0);mesa(p,1.0,.6,{h:.82});vaso(p,0,.82,0,true);solido(12.6,-3.75+.45,1.0,.6);}
 {const p=naParede('LF','S',10,.5);banqueta(p,1.3,M.velvetGreen);solido(10,7.5-.3,1.3,.5);}planta(peca(7.0,6.85,0),0,0,true);quadro('LF','O',-2.0,3.1,1.2,1.0,8);}

function andar3(){
 const CF='CF',CB='CB',OF='OF',OB='OB',LB='LB';
 // salão de reuniões
 const tz=2,TL=6.6,TW=1.9;tapete(0,tz,9.4,4.6,1);
 {const p=peca(0,tz,0);Bb(p,TL,.1,TW,M.wood,0,.8,0);Bb(p,TL+.12,.05,TW+.12,M.gold,0,.76,0);Bb(p,TL-.4,.16,TW-.4,M.woodDark,0,.62,0);
  for(const x of [-TL/2+.3,0,TL/2-.3])for(const e of [-1,1])Lt(p,PERNA(.62),M.woodDark,x,0,e*(TW/2-.3),6);
  Bt(p,TL-.6,.01,.55,R.toalha,0,.9,0);for(const x of [-2.2,0,2.2])castical(p,x,.91,0,3);
  for(const x of [-2.4,-1.2,0,1.2,2.4])for(const e of [-1,1]){Bt(p,.34,.006,.26,R.perg,x,.905,e*.62);tinteiro(p,x+.22,.905,e*.55);}solido(0,tz,TL,TW);}
 for(const x of [-2.4,-1.2,0,1.2,2.4]){cadeira(peca(x,tz-1.3,0),{alta:true});cadeira(peca(x,tz+1.3,PI),{alta:true});}
 cadeira(peca(-TL/2-.75,tz,PI/2),{alta:true,bracos:true});cadeira(peca(TL/2+.75,tz,-PI/2),{alta:true,bracos:true});
 for(const e of [-1,1]){const x=e*3.7;{const p=naParede(CF,'N',x,.55);comoda(p,2.4);castical(p,-.8,.92,0,1);castical(p,.8,.92,0,1);taca(p,0,.92,0,1.3);solido(x,-3.75+.35,2.4,.6);}
  quadro(CF,'N',x,3.1,2.0,1.3,e>0?3:5);
  const L=e<0?'O':'L';{const p=naParede(CF,L,-1.4,.44);estante(p,2.6,3.0,{seed:60+e});solido(e*(5.75-.3),-1.4,.5,2.6);}
  quadro(CF,L,5.4,2.9,1.8,1.2,e>0?6:8);planta(peca(e*5.0,6.9,0),0,0,true);tocheiro(CF,L,1.2-.45);tocheiro(CF,L,3.2+.45);}
 lustre(-1.7,tz,6,.9);lustre(1.7,tz,6,.9);
 // observatório (o céu estrelado só aparece de baixo: some na câmera de cima)
 {const oz=-10;
  {const sky=new T.Mesh(new T.PlaneGeometry(11.4,11.1),M.starCeil);sky.rotation.x=PI/2;sky.position.set(0,K.y0+K.H-.08,(-4.25+(-15.5))/2);K.g.add(sky);}
  {const p=peca(0,oz,0);Cy(p,2.3,2.5,.3,M.trim,0,0,0,28);Ms(p,new T.TorusGeometry(2.15,.05,6,40),M.goldM,0,.31,0,PI/2,0,0);
   const top=.3,mY=1.75;for(let i=0;i<3;i++){const a=i/3*PI*2+.5;haste(p,Math.cos(a)*.95,top,Math.sin(a)*.95,0,mY,0,.05,M.woodDark,6);}
   Bb(p,.35,.3,.35,M.brass,0,mY-.05,0);const tube=haste(p,-.9,mY-.35,.75,1.0,mY+1.7,-.95,.2,M.brass,14);
   const lens=new T.Mesh(new T.TorusGeometry(.23,.05,6,16),M.goldM);lens.position.set(1.0,mY+1.7,-.95);lens.quaternion.copy(tube.quaternion);lens.rotateX(PI/2);p.add(lens);
   haste(p,-.9,mY-.35,.75,-1.15,mY-.6,.98,.06,M.iron,6);haste(p,-.6,mY,.4,.2,mY+.85,-.35,.05,M.brass,6);solido(0,oz,5,5);}
  {const ax=-3.6,az=-13.4,p=peca(ax,az,0);Cy(p,.3,.4,.9,M.trim,0,0,0,12);Bb(p,.5,.08,.5,M.gold,0,.9,0);haste(p,0,.98,0,0,2.35,0,.025,M.goldM,6);
   Sp(p,.13,M.globe,0,1.75,0,20,12);
   const an=new T.Mesh(juntaGeo([G(new T.TorusGeometry(.55,.025,6,32),0,0,0,0,0,0),G(new T.TorusGeometry(.55,.025,6,32),0,0,0,PI/2,0,0),G(new T.TorusGeometry(.48,.02,6,32),0,0,0,PI/2,PI/2,0),G(new T.TorusGeometry(.55,.02,6,32),0,0,0,.41,0,0)]),M.goldM);an.position.set(0,1.75,0);p.add(an);
   anima(an,{nome:'esfera armilar',c:'ry',f:'lin',v:.25});solido(ax,az,1.1,1.1);}
  globo(peca(3.8,-6.4,0),.45,'globo observatorio');
  {const p=peca(3.6,-13.3,0);mesa(p,2.2,1.3);Bt(p,2.0,.012,1.1,M.starMap,0,.78,0);castical(p,.9,.78,-.4,1);solido(3.6,-13.3,2.2,1.3);cadeira(peca(3.6,-12.2,PI),{});}
  for(const e of [-1,1]){const L=e<0?'O':'L';{const p=naParede(CB,L,-6.3,.44);estante(p,2.6,3.4,{seed:70+e});solido(e*(5.75-.3),-6.3,.5,2.6);}{const p=naParede(CB,L,-14,.44);estante(p,2.4,3.4,{seed:72+e});solido(e*(5.75-.3),-14,.5,2.4);}tocheiro(CB,L,-11-.45);tocheiro(CB,L,-9+.45);}
  {const [x,z,r]=faceDe(CB,'N',0,0);const p=new T.Group();p.position.set(x,Y(3.2),z);p.rotation.y=r;K.g.add(p);Bt(p,3.8,2.4,.04,M.gold,0,-1.2,.02);Bt(p,3.6,2.2,.05,M.starMap,0,-1.1,.03);}}
 // sala dos troféus
 tapete(-10.8,1.9,4.4,3.4,0);
 {const p=naParede(OF,'O',2.5,.85);lareira(p,2.1,{brasao:false,cranio:true});solido(-15.5+.5,2.5,1.0,2.6);}
 for(const t of [-13.75,-8.1]){escudoParede(OF,'N',t-.75,3.2,t<-10?0:3,1.0,false);escudoParede(OF,'N',t+.75,3.2,t<-10?1:4,1.0,true);}
 {const p=naParede(OF,'L',-1.3,.6);vitrine(p,2.2,1.0,(q,y)=>{coroa(q,-.7,y,0,.9);orbe(q,-.1,y,0);taca(q,.45,y,0,.9);for(let i=0;i<3;i++)Ms(q,new T.CylinderGeometry(.05,.05,.01,12),M.goldM,.85,y+.06+i*.012,(i-1)*.12,PI/2-.3,0,0);});solido(-6.25-.35,-1.3,.6,2.2);}
 {const p=naParede(OF,'L',5.35,.44);estante(p,2.6,2.6,{seed:81});for(let i=0;i<4;i++)taca(p,-.9+i*.6,1.0,0,1.1);solido(-6.25-.3,5.35,.5,2.6);}
 for(const [x,z,f] of [[-11.6,-1.3,0],[-9.6,-1.3,1],[-10.6,4.7,2]]){const p=peca(x,z,0);Bb(p,.6,.9,.6,M.trim,0,0,0);Bb(p,.66,.06,.66,M.goldM,0,.9,0);Bb(p,.5,.5,.5,R.vidro,0,.96,0);Bb(p,.4,.03,.4,M.velvet,0,.96,0);
  if(f===0)coroa(p,0,.99,0,.9);else if(f===1){orbe(p,-.08,.99,0);haste(p,.1,.99,-.1,.12,1.4,.1,.012,M.goldM,4);}else taca(p,0,.99,0,1.2);solido(x,z,.66,.66);}
 K.armadura(-10,7.5-.5,PI,1);
 {const p=peca(-14.9,-2.6,0);Bb(p,.4,.08,.4,M.woodDark,0,0,0);haste(p,0,.08,0,0,3.4,0,.03,M.woodDark,6);Ms(p,new T.ConeGeometry(.06,.25,6),M.goldM,0,3.5,0);}
 K.BN.push([.9,2.4,'red',-14.9+.05,Y(3.2),-2.6+.1]);
 vaso(peca(-14.6,6.85,0),0,0,0,true,R.ceramicaAz);lustre(-10.8,1.9,6,.85);
 // tesouro
 for(const [x,z,rot,ab] of [[-14.85,-14.85,0,1],[-13.85,-14.85,0,0],[-10,-14.85,0,1]]){const p=peca(x,z,rot);bau(p,.9,{aberto:!!ab,seed:x*3|0});solido(x,z,.95,.6);}
 for(const [t,ab] of [[-14.6,1],[-13.4,0],[-12.2,1]]){const p=naParede(OB,'L',t,.55);bau(p,1.0,{aberto:!!ab,seed:t*7|0});solido(-6.25-.35,t,.6,1.05);}
 {const p=naParede(OB,'L',-6.6,.44);estante(p,2.4,2.4,{seed:91});for(let i=0;i<4;i++)taca(p,-.8+i*.55,.54,0,1.0);solido(-6.25-.3,-6.6,.5,2.4);}
 {const p=naParede(OB,'S',-13.75,.2);portaCofre(p);}
 {const p=naParede(OB,'S',-8.4,.6);vitrine(p,2.0,.9,(q,y)=>{coroa(q,-.55,y,0,1.0);coroa(q,.1,y,0,.8);orbe(q,.6,y,0);});solido(-8.4,-4.25-.35,2.0,.6);}
 for(const [x,z,r] of [[-11.2,-9.3,1.0],[-9.4,-11.4,.85],[-12.9,-11.9,.7]]){pilhaMoedas(peca(x,z,0),0,0,r);solido(x,z,r*1.6,r*1.6);}
 coroa(peca(-11.2,-9.3,0),0,.5,0,1.1);taca(peca(-9.4,-11.4,0),.1,.4,.1,1.0);
 for(const [x,z,sd] of [[-10.0,-8.6,3],[-8.6,-12.4,5],[-13.6,-11.1,7],[-11.9,-10.6,9]])colunasMoedas(peca(x,z,0),0,0,7,sd);
 for(const [x,z,r,sd] of [[-12.6,-8.5,.6,21],[-8.4,-10.3,-.7,22]]){bau(peca(x,z,r),.9,{aberto:true,seed:sd});solido(x,z,1.0,1.0);}
 {const p=peca(-14.95,-8.6,PI/2);escudo(p,0,.5,0,4,1.3).rotation.x=-.25;haste(p,-.2,0,.15,.25,1.5,-.1,.02,M.goldM,4);Ms(p,new T.ConeGeometry(.03,.14,4),M.steel,.27,1.58,-.11);}
 {const p=peca(-12.2,-6.9,0);Bb(p,1.2,.12,.9,M.woodDark,0,0,0);barrasOuro(p,0,0,6);solido(-12.2,-6.9,1.2,.9);}
 cristais(peca(-14.85,-4.95,0),0,0,7,1.0);solido(-14.85,-4.95,.8,.8);cristais(peca(-6.95,-15.0,0),0,0,6,.8);
 tocheiro(OB,'L',-11-.45);tocheiro(OB,'L',-9+.45);tocheiro(OB,'S',-11);
 // acesso ao campanário: mecanismo do relógio, escada para o alçapão, corda do sino, sino de treino, bancada
 {const [x,z,r]=encosta(LB,'O',-13.3,.3);const p=peca(x,z,r);Bb(p,3.0,.2,.6,M.woodDark,0,0,0);for(const e of [-1,1])Bb(p,.16,3.6,.16,M.woodDark,e*1.4,.2,-.1);Bb(p,3.0,.16,.2,M.woodDark,0,3.6,-.1);Bb(p,3.0,.12,.16,M.woodDark,0,1.9,-.12);
  Ms(p,new T.CircleGeometry(.55,32),R.relogio,0,2.75,.06);Ms(p,new T.TorusGeometry(.56,.04,5,28),M.goldM,0,2.75,.065);
  for(const [gx,gy,gr,n,v] of [[-.85,1.15,.5,12,.35],[.15,.95,.32,8,-.55],[.85,1.45,.42,10,.42],[-.8,2.55,.28,8,-.6]]){const ge=new T.Mesh(engrenagem(gr,n,.06),M.brass);ge.position.set(gx,gy,.02);p.add(ge);
   haste(p,gx,gy,-.1,gx,gy,.07,.03,M.iron,6);anima(ge,{nome:'engrenagem',c:'rz',f:'lin',v});}
  solido(x,z,.65,3.0);}
 escadaMao(peca(10,-15.5+.12,0),0,0,K.H-K.F,0);
 {const [x,z,r]=faceDe(LB,'N',10,0);const p=new T.Group();p.position.set(x,K.y0+K.H-.12,z+.5);K.g.add(p);Bb(p,1.2,.1,1.2,M.woodDark,0,0,0);Bb(p,1.0,.04,1.0,M.iron,0,-.03,0);}
 {const rope=new T.Mesh(juntaGeo([G(new T.CylinderGeometry(.02,.02,K.H-K.F-1.0,6),0,-(K.H-K.F-1.0)/2,0),G(new T.CylinderGeometry(.045,.045,.55,8),0,-(K.H-K.F-1.0)-.2,0)]),R.corda);
  rope.position.set(12.7,K.y0+K.H,-12.2);K.g.add(rope);anima(rope,{nome:'corda do sino',c:'rx',f:'sen',b:0,a:.035,w:1.3,ph:.5});
  const pl=new T.Group();pl.position.set(12.7,K.y0+K.H-.06,-12.2);K.g.add(pl);Cy(pl,.12,.12,.06,M.iron,0,-.03,0,10);}
 sino(peca(11.2,-8.6,0),0,0,1.0);solido(11.2,-8.6,1.4,.6);
 {const p=peca(10.6,-12.2,0);mesa(p,2.2,1.1,{h:.86});const d=Ms(p,new T.CircleGeometry(.42,32),R.relogio,-.3,.875,0,-PI/2,0,0);Ms(p,new T.TorusGeometry(.43,.03,5,24),M.goldM,-.3,.88,0,PI/2,0,0);
  for(const [x,z,r] of [[.55,-.25,.16],[.7,.2,.1],[.35,.3,.08]]){const ge=new T.Mesh(engrenagem(r,8,.025),M.brass);ge.position.set(x,.89,z);ge.rotation.x=-PI/2;p.add(ge);}Cy(p,.05,.06,.2,M.iron,.85,.86,-.35,8);
  for(const [x,z] of [[-.6,-.85],[.6,.85]]){const b=new T.Group();b.position.set(x,0,z);p.add(b);Cy(b,.2,.2,.05,M.wood,0,.5,0,10);for(let i=0;i<3;i++){const a=i/3*PI*2;haste(b,Math.cos(a)*.16,0,Math.sin(a)*.16,Math.cos(a)*.1,.5,Math.sin(a)*.1,.02,M.woodDark,4);}}solido(10.6,-12.2,2.2,1.1);}
 {const p=naParede(LB,'L',-9,.75);mesa(p,2.2,.75,{h:.88});const ge=new T.Mesh(engrenagem(.18,8,.04),M.brass);ge.position.set(-.5,.9,0);ge.rotation.x=-PI/2;p.add(ge);Bb(p,.3,.05,.06,M.woodDark,.3,.88,.1,.5);Cy(p,.06,.08,.18,M.iron,.75,.88,-.1,8);solido(15.5-.45,-9,.75,2.2);}
 for(const [x,z] of [[14.7,-14.7],[13.95,-14.9]])barril(peca(x,z,0),0,0);solido(14.3,-14.8,1.3,.7);
 {const p=peca(7.0,-4.95,0);Bb(p,.7,.7,.7,M.wood,0,0,0);Bb(p,.5,.5,.5,M.wood,.05,.7,.05,.3);solido(7.0,-4.95,.8,.8);}
 tocheiro(LB,'O',-10.25);lanterna(LB,'S',10.9,2.5);lanterna(LB,'S',15.0,2.5);ferramentas(LB,'S',13.0,2.1);lanterna(LB,'O',-6.0,2.6);
 rolosCorda(peca(8.9,-14.7,0),0,0);rolosCorda(peca(9.5,-14.85,0),0,0);
 {const p=peca(14.75,-5.05,0);caixote(p,0,0,.75,.2);caixote(p,-.1,.0,.5,-.3).position.y=.75;caixote(p,-.95,.1,.6,.5);solido(14.4,-5.05,1.6,1.0);}
 {const p=peca(8.4,-6.9,0);sinoChao(p,0,0,.35);solido(8.4,-6.9,.9,.9);}
 // escada
 {const p=naParede('LF','S',10,.5);banqueta(p,1.3,M.velvetBlue);solido(10,7.5-.3,1.3,.5);}planta(peca(7.0,6.85,0),0,0,true);planta(peca(14.9,-3.15,0),0,0,true);
 globo(peca(12.6,-3.2,0),.36,'globo escada');quadro('LF','O',-2.0,3.1,1.2,1.0,2);}

// ================= peças com movimento =================
function globo(p,r,nome,x,y,z){x=x||0;y=y||0;z=z||0;const peque=r<.25,h=peque?.08:.85;
 if(!peque){Cy(p,.32,.4,.08,M.woodDark,x,y,z,12);Lt(p,[[0,0],[.1,0],[.12,.05],[.06,.1],[.08,.3],[.05,.5],[.09,.55],[.05,.7],[0,.7]],M.woodDark,x,y+.08,z,10);
  for(let i=0;i<4;i++){const a=i/4*PI*2+PI/4;haste(p,x+Math.cos(a)*(r+.08),y+h+r*.1,z+Math.sin(a)*(r+.08),x+Math.cos(a)*.1,y+.75,z+Math.sin(a)*.1,.025,M.woodDark,4);}
  Ms(p,new T.TorusGeometry(r+.09,.03,5,40),M.woodDark,x,y+h+r,z,PI/2,0,0);}
 else Lt(p,[[0,0],[.08,0],[.08,.02],[.02,.05],[.02,.08],[0,.08]],M.goldM,x,y,z,8);
 const c=V(x,y+h+r,z),tilt=.41;Ms(p,new T.TorusGeometry(r+.04,r*.04,5,36),M.goldM,c.x,c.y,c.z,tilt,0,0);
 const gl=new T.Mesh(new T.SphereGeometry(r,32,18),M.globe);gl.position.copy(c);gl.rotation.set(tilt,0,0);p.add(gl);
 if(nome)anima(gl,{nome,c:'ry',f:'lin',v:peque?.3:.12});if(!peque)solido(p.position.x,p.position.z,r*2.2,r*2.2);}
function armarioRolos(p,w){const h=2.3,d=.42;Bb(p,w,h,.04,M.woodDark,0,0,-d/2+.02);for(const e of [-1,1])Bb(p,.06,h,d,M.woodDark,e*(w/2-.03),0,0);Bb(p,w+.08,.1,d+.06,M.woodDark,0,h,0);Bb(p,w,.1,d,M.woodDark,0,0,0);
 const nc=Math.round(w/.36),nr=5,cw=(w-.06)/nc,ch=(h-.2)/nr,r=rng(Math.round(w*100));
 for(let i=1;i<nc;i++)Bb(p,.025,h-.1,d-.04,M.wood,-w/2+.03+i*cw,.1,0);for(let j=1;j<nr;j++)Bb(p,w-.06,.025,d-.04,M.wood,0,.1+j*ch,0);
 for(let i=0;i<nc;i++)for(let j=0;j<nr;j++){const cx=-w/2+.03+(i+.5)*cw,cy=.1+j*ch;const n=1+Math.floor(r()*3);for(let k2=0;k2<n;k2++){const q=Ms(p,new T.CylinderGeometry(.04,.04,d-.06,8),R.perg,cx+(k2-(n-1)/2)*.085,cy+.05+(k2%2)*.03,0,PI/2,0,0);Ms(p,new T.CylinderGeometry(.045,.045,.02,8),M.velvet,cx+(k2-(n-1)/2)*.085,cy+.05+(k2%2)*.03,d/2-.04,PI/2,0,0);}}}
function mapaParede(s,lado,t,y,w,h,i){const [x,z,rot]=faceDe(s,lado,t,0);const p=new T.Group();p.position.set(x,Y(y),z);p.rotation.y=rot;K.g.add(p);
 Bt(p,w,h,.012,R.mapa[i%2],0,-h/2,.02);for(const e of [-1,1]){Ms(p,new T.CylinderGeometry(.03,.03,w+.12,8),M.woodDark,0,e*(h/2+.02),.04,0,0,PI/2);Sp(p,.04,M.gold,e*(w/2+.08),h/2+.02,.04,6,4);Sp(p,.04,M.gold,e*(w/2+.08),-h/2-.02,.04,6,4);}}

// ================= entrada =================
function mobiliar(ctx){K=ctx;M=ctx.M;if(!R)R=recursos();
 for(const f of K.paredes){lambri(f);cornija(f);}
 for(const [s,m] of PISOS[K.k])piso(s,m);
 const cm=M.drape[K.k];for(const x of K.jan.frente)cortina(x,K.BZ1-.5,PI,cm);for(const x of K.jan.fundo)cortina(x,K.BZ0+.5,0,cm);
 for(const z of K.jan.oeste)cortina(-K.BX+.5,z,PI/2,cm);for(const z of K.jan.leste)cortina(K.BX-.5,z,-PI/2,cm);
 [andar0,andar1,andar2,andar3][K.k]();}
window.arcanoCasteloSalas={mobiliar,versao:1};
})();
