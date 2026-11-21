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
function linenTex(cor,seed){const S=128,c=cv(S),g=c.getContext('2d'),R=rng(seed);g.fillStyle=cor;g.fillRect(0,0,S,S);
 for(let i=0;i<S;i+=2){g.fillStyle=`rgba(0,0,0,${.02+R()*.03})`;g.fillRect(0,i,S,1);g.fillStyle=`rgba(0,0,0,${.015+R()*.02})`;g.fillRect(i,0,1,S);}return ct(c);}
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
  ferro:mat({color:'#2e2f34',roughness:.55,metalness:.35}),lata:mat({color:'#c9a24e',roughness:.4,metalness:.45}),
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
  ceramica:[mat({color:'#c06a3a',roughness:.6}),mat({color:'#e8dcc2',roughness:.5}),mat({color:'#4f7fa8',roughness:.5}),mat({color:'#8a9a5a',roughness:.6})],
  folha:mat({color:'#4e9a45'}),folhaE:mat({color:'#3a7a36'}),terra:mat({color:'#4a3324'}),
  pao:mat({color:'#c8893e'}),maca:mat({color:'#c83a2e',roughness:.5})
 };
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
function perna(g,m,x,y,z,h,r){r=r||.045;lathe(g,[[0,0],[r*.8,0],[r*.9,h*.06],[r*.6,h*.12],[r*.75,h*.2],[r*.55,h*.3],[r*.6,h*.55],[r,h*.62],[r*.7,h*.7],[r*1.05,h*.78],[r*1.1,h],[0,h]],m,x,y,z,8);}
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
// ---------- sala completa ----------
// o: {iw,id,y,top,s(lado da cama ±1),portas:[{x,w}],v(variação),pequena,sem:{lareira:true,...}}
function sala(g,o){if(!M)materiais();const ix=o.iw/2,iz=o.id/2,y=o.y,s=o.s||1,v=o.v||0,sem=o.sem||{};
 lambri(g,y,ix,iz,o.portas,o.lados);
 // tapete
 const rw=Math.min(2.6,o.iw*.45),rd=Math.min(1.7,o.id*.4);box(g,rw,.012,rd,M.tapetes[v%3],0,y,.1,0,null);
 const bx=s*(ix-1.12),bz=-iz+.64;if(sem.cama)armario(g,y,s*(ix-.75),-iz+.32,0);else cama(g,y,bx,bz,s,v);
 if(o.pequena){cadeira(g,y,-s*(ix-.5),.2,s*PI/2);lampiao(g,0,o.top-.12,0);if(o.id>2.6)vaso(g,y,-s*(ix-.35),iz-.4);return;}
 if(!sem.cama)bau(g,y,bx,bz+.98,0);
 if(!sem.estante)estante(g,y,-s*(ix-.85),-iz+.26,0,v);
 const tx=-s*Math.min(o.iw*.18,1.3),tz=.35;mesa(g,y,tx,tz,v);for(const a of [-1,1])cadeira(g,y,tx+a*.92,tz,-a*PI/2);
 if(!sem.lareira)lareira(g,y,s*ix,sem.cama?-.2:.35,-s,o.top);
 lampiao(g,0,o.top-.12,0);
 quadro(g,y+1.45,0,-iz,0);
 if(!sem.prateleira)prateleira(g,y+1.55,-s*(ix-.02),-.9,s*PI/2);
 barril(g,y,-s*(ix-.4),iz-.45);
 if(o.iw>4.6)vaso(g,y,s*(ix-.4),iz-.45);}
window.arcanoMoveis={sala,armario,lampiao,cama,mesa,cadeira,estante,bau,lareira,barril,vaso,lambri,get M(){if(!M)materiais();return M;}};
})();
