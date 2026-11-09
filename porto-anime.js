/* Porto dos Ventos — porto de navios voadores na borda leste da Ilha Central.
   - Praça calçada no alto do penhasco: rosa-dos-ventos, monumento com cristal,
     lampiões ornamentados, bancos de ferro fundido, floreiras, caixotes e
     barris de verdade (tábuas, cintas, cantoneiras), guindaste com roldana.
   - Prédios por dentro: capitania com BILHETERIA (porta, balcão, cadeira,
     estantes, mapa, relógio), armazém (portões, prateleiras, carga) e farol
     (sala com mesa e escada em caracol). Portas e janelas abrem (E / botão);
     ao entrar, o telhado e as paredes do lado da câmera somem.
   - Píer engastado no bloco de pedra da ilha, sobre o céu, com farol no fim.
   - Navio voador atracado com cabine do capitão por dentro (porta e janelas),
     velas, velas-asa (só do lado de fora, longe da prancha), hélices e motor
     de cristal. Dá para embarcar pela prancha. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
let seed=7311;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
function planks(hue,l,sat=40,vertical=false){return canvasTex(256,256,(g,w,h)=>{const n=8;for(let b=0;b<n;b++){const y0=b*h/n;g.fillStyle=`hsl(${hue+rnd()*6-3},${sat}%,${l+rnd()*8-4}%)`;g.fillRect(0,y0,w,h/n);
 for(let k=0;k<5;k++){const gy=y0+3+rnd()*(h/n-6);g.strokeStyle='rgba(40,20,8,.22)';g.lineWidth=1;g.beginPath();for(let x=0;x<=w;x+=6){const yy=gy+Math.sin(x*.04+k*2+b)*1.6;x?g.lineTo(x,yy):g.moveTo(x,yy);}g.stroke();}
 g.fillStyle='rgba(20,10,4,.7)';g.fillRect(0,y0,w,2);const jx=rnd()*w;g.fillRect(jx,y0,2,h/n);
 g.fillStyle='rgba(60,60,70,.8)';for(const x of [jx-6,jx+8]){g.beginPath();g.arc(x,y0+6,1.6,0,6.3);g.fill();g.beginPath();g.arc(x,y0+h/n-6,1.6,0,6.3);g.fill();}}
 if(vertical){const c2=document.createElement('canvas');c2.width=w;c2.height=h;c2.getContext('2d').drawImage(g.canvas,0,0);g.clearRect(0,0,w,h);g.save();g.translate(w/2,h/2);g.rotate(Math.PI/2);g.drawImage(c2,-w/2,-h/2);g.restore();}});}
const TX={
 deck:planks(30,52),hull:planks(22,30,45),dark:planks(20,22,40),door:planks(26,40,45,true),light:planks(34,62,35),
 tiles:canvasTex(256,256,(g,w,h)=>{g.fillStyle='#8f877a';g.fillRect(0,0,w,h);for(let r=0;r<8;r++)for(let c=0;c<8;c++){const x=c*32+(r%2?16:0),y=r*32;g.fillStyle=`hsl(${32+rnd()*14},${10+rnd()*10}%,${66+rnd()*14}%)`;g.beginPath();g.roundRect?g.roundRect(x+2,y+2,28,28,4):g.rect(x+2,y+2,28,28);g.fill();g.fillStyle='rgba(255,255,255,.08)';g.fillRect(x+4,y+4,24,4);}}),
 stone:canvasTex(256,256,(g,w,h)=>{g.fillStyle='#77736c';g.fillRect(0,0,w,h);for(let r=0;r<8;r++){let x=-rnd()*30;const y=r*32;while(x<w){const bw=34+rnd()*40;g.fillStyle=`hsl(${34+rnd()*10},${8+rnd()*8}%,${60+rnd()*14}%)`;g.fillRect(x+2,y+2,bw-4,28);x+=bw;}}}),
 plaster:canvasTex(128,128,(g,w,h)=>{g.fillStyle='#efe6d2';g.fillRect(0,0,w,h);for(let i=0;i<300;i++){g.fillStyle=`rgba(${180+rnd()*40},${160+rnd()*40},${130+rnd()*30},.12)`;g.fillRect(rnd()*w,rnd()*h,3+rnd()*6,2+rnd()*4);}}),
 sail:canvasTex(256,256,(g,w,h)=>{g.fillStyle='#f3ead2';g.fillRect(0,0,w,h);g.strokeStyle='rgba(150,130,100,.25)';g.lineWidth=2;for(let x=0;x<w;x+=32){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}
  g.strokeStyle='#3d6fa8';g.lineWidth=10;g.beginPath();g.arc(w/2,h/2,62,0,6.3);g.stroke();g.fillStyle='#3d6fa8';
  for(let i=0;i<4;i++){g.save();g.translate(w/2,h/2);g.rotate(i*Math.PI/2+.3);g.beginPath();g.moveTo(0,-8);g.quadraticCurveTo(40,-50,10,-80);g.quadraticCurveTo(20,-40,-6,-6);g.fill();g.restore();}
  g.fillStyle='#d8b45a';g.beginPath();g.arc(w/2,h/2,12,0,6.3);g.fill();g.strokeStyle='#d8b45a';g.lineWidth=6;g.strokeRect(6,6,w-12,h-12);}),
 wing:canvasTex(128,128,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#5d9fd6');gr.addColorStop(1,'#bfe3ff');g.fillStyle=gr;g.fillRect(0,0,w,h);g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=2;for(let y=0;y<h;y+=16){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}}),
 sign:canvasTex(1024,230,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#35507a');gr.addColorStop(1,'#1f3252');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.strokeStyle='#d8b45a';g.lineWidth=10;g.strokeRect(10,10,w-20,h-20);g.lineWidth=3;g.strokeRect(26,26,w-52,h-52);
  let fs=112;g.textAlign='center';g.textBaseline='middle';const txt='PORTO DOS VENTOS';do{g.font='bold '+fs+'px Georgia,serif';fs-=4;}while(g.measureText(txt).width>w-250&&fs>40);
  g.lineJoin='round';g.lineWidth=10;g.strokeStyle='rgba(20,14,34,.85)';g.strokeText(txt,w/2,h/2+6);g.fillStyle='#f6e7b8';g.fillText(txt,w/2,h/2+6);
  for(const sx of [90,w-90]){g.fillStyle='#d8b45a';g.beginPath();for(let i=0;i<8;i++){const a=i/8*Math.PI*2,r=i%2?10:30;g.lineTo(sx+Math.cos(a)*r,h/2+Math.sin(a)*r);}g.closePath();g.fill();}}),
 ticket:canvasTex(256,64,(g,w,h)=>{g.fillStyle='#7a2a2a';g.fillRect(0,0,w,h);g.strokeStyle='#d8b45a';g.lineWidth=4;g.strokeRect(4,4,w-8,h-8);g.fillStyle='#f5e6c0';g.font='bold 30px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillText('BILHETERIA',w/2,h/2+2);}),
 store:canvasTex(256,64,(g,w,h)=>{g.fillStyle='#3d5a3a';g.fillRect(0,0,w,h);g.strokeStyle='#d8b45a';g.lineWidth=4;g.strokeRect(4,4,w-8,h-8);g.fillStyle='#f5e6c0';g.font='bold 30px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillText('ARMAZÉM',w/2,h/2+2);}),
 map:canvasTex(256,192,(g,w,h)=>{g.fillStyle='#9cc7d8';g.fillRect(0,0,w,h);for(let i=0;i<5;i++){g.fillStyle=`hsl(${90+i*8},35%,${55+i*4}%)`;g.beginPath();g.ellipse(40+i*45,60+((i*37)%80),18+i*3,14+i*2,i,0,6.3);g.fill();}
  g.strokeStyle='#8a4a2a';g.setLineDash([6,5]);g.lineWidth=2;g.beginPath();g.moveTo(40,60);g.bezierCurveTo(90,150,160,20,220,120);g.stroke();g.setLineDash([]);g.strokeStyle='#6a4a2a';g.lineWidth=6;g.strokeRect(3,3,w-6,h-6);}),
 compass:canvasTex(256,256,(g,w,h)=>{g.fillStyle='#d9cdb4';g.fillRect(0,0,w,h);g.translate(w/2,h/2);g.strokeStyle='#8a6a3a';g.lineWidth=5;g.beginPath();g.arc(0,0,118,0,6.3);g.stroke();g.lineWidth=2;g.beginPath();g.arc(0,0,96,0,6.3);g.stroke();
  for(let i=0;i<16;i++){g.save();g.rotate(i*Math.PI/8);const L=i%4===0?110:i%2===0?78:56;g.fillStyle=i%4===0?'#2f5a8f':i%2===0?'#4f8fbf':'#c79a52';g.beginPath();g.moveTo(0,-L);g.lineTo(10,0);g.lineTo(0,10);g.lineTo(-10,0);g.closePath();g.fill();g.restore();}
  g.fillStyle='#d8b45a';g.beginPath();g.arc(0,0,14,0,6.3);g.fill();}),
 rug:canvasTex(128,128,(g,w,h)=>{g.fillStyle='#8f2a2a';g.fillRect(0,0,w,h);g.strokeStyle='#e0b85a';g.lineWidth=6;g.strokeRect(8,8,w-16,h-16);g.lineWidth=2;g.strokeRect(20,20,w-40,h-40);g.fillStyle='#e0b85a';g.beginPath();g.moveTo(w/2,30);g.lineTo(w-30,h/2);g.lineTo(w/2,h-30);g.lineTo(30,h/2);g.closePath();g.fill();}),
 sack:canvasTex(64,64,(g,w,h)=>{g.fillStyle='#c9b088';g.fillRect(0,0,w,h);g.strokeStyle='rgba(120,90,50,.35)';for(let i=0;i<w;i+=4){g.beginPath();g.moveTo(i,0);g.lineTo(i,h);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(w,i);g.stroke();}})
};
// Texturas pintadas à mão com relevo (texturas-anime.js).
const AT=window.arcanoTex,TB={};
if(AT){
 const put=(k,t,sc)=>{TX[k]=t.map;TB[k]=[t.bump,sc];};
 put('deck',AT.wood({hue:30,light:54,horizontal:true,seed:21}),.8);put('hull',AT.wood({hue:22,light:32,horizontal:true,seed:22}),.8);put('dark',AT.wood({hue:20,light:24,horizontal:true,seed:23}),.8);
 put('door',AT.wood({hue:26,light:42,seed:24}),.8);put('light',AT.wood({hue:34,light:62,horizontal:true,seed:25}),.7);
 put('tiles',AT.cobble({hue:34,sat:20,l0:60,l1:76,seed:41,n:6,style:'flag'}),.6);
 put('stone',AT.stone({hue:34,sat:10,l0:52,l1:68,seed:43}),.8);
 put('plaster',AT.plaster({hue:38,sat:34,l:84}),.6);
}
for(const k of ['compass','sign','ticket','store','map'])TX[k].wrapS=TX[k].wrapT=T.ClampToEdgeWrapping;
const mat=o=>new T.MeshStandardMaterial(Object.assign({roughness:1,metalness:0},o));
const M={
 deck:mat({color:'#ffffff',map:TX.deck}),hull:mat({color:'#ffffff',map:TX.hull,side:T.DoubleSide}),dark:mat({color:'#ffffff',map:TX.dark}),door:mat({color:'#ffffff',map:TX.door}),light:mat({color:'#ffffff',map:TX.light}),
 tiles:mat({color:'#ffffff',map:TX.tiles}),stone:mat({color:'#ffffff',map:TX.stone,side:T.DoubleSide}),plaster:mat({color:'#ffffff',map:TX.plaster}),
 sail:mat({color:'#ffffff',map:TX.sail,side:T.DoubleSide}),wing:mat({color:'#ffffff',map:TX.wing,side:T.DoubleSide,transparent:true,opacity:.82}),
 sign:mat({color:'#ffffff',map:TX.sign}),ticket:mat({color:'#ffffff',map:TX.ticket}),store:mat({color:'#ffffff',map:TX.store}),map:mat({color:'#ffffff',map:TX.map}),
 compass:mat({color:'#ffffff',map:TX.compass}),rug:mat({color:'#ffffff',map:TX.rug}),sack:mat({color:'#ffffff',map:TX.sack}),
 gold:mat({color:'#d8b45a',roughness:.4,metalness:.4}),iron:mat({color:'#34363d',roughness:.6,metalness:.3}),copper:mat({color:'#5d9a8a'}),
 roofRed:mat({color:'#b5483c'}),roofBlue:mat({color:'#3d5f8f'}),rope:mat({color:'#b89a6a'}),cushion:mat({color:'#3d6fa8'}),cloth:mat({color:'#e9e1cf'}),soil:mat({color:'#5a3f2a'}),
 red:mat({color:'#a83a32',side:T.DoubleSide}),blue:mat({color:'#3d6fa8',side:T.DoubleSide}),leaf:mat({color:'#4f8f45'}),leafDark:mat({color:'#3f7a3a'}),
 flower:[mat({color:'#ff7aa8'}),mat({color:'#ffd35a'}),mat({color:'#a98bff'}),mat({color:'#ffffff'})],
 glass:mat({color:'#cfe8f0',emissive:new T.Color('#ffb85a'),emissiveIntensity:.15,transparent:true,opacity:.55,side:T.DoubleSide}),
 lamp:mat({color:'#fff1c8',emissive:new T.Color('#ffc566'),emissiveIntensity:.5}),
 crystal:mat({color:'#e8fbff',emissive:new T.Color('#5fd2ff'),emissiveIntensity:2.2,roughness:.2,transparent:true,opacity:.92})
};
if(AT)for(const [k,[b,sc]] of Object.entries(TB))if(M[k]){M[k].bumpMap=b;M[k].bumpScale=sc;}
// Telhas pintadas (vermelha e azul) em materiais próprios, visíveis dos dois lados (beiral visto por baixo).
{const mkS=(h,s,a,b,seed)=>{if(!AT)return null;const t=AT.shingles({hue:h,sat:s,l0:a,l1:b,seed});return mat({map:t.map,bumpMap:t.bump,bumpScale:.9,side:T.DoubleSide});};
 M.roofRedS=mkS(6,55,40,56,71)||M.roofRed;M.roofBlueS=mkS(218,38,34,50,72)||M.roofBlue;}

function boxUV(geo,w,h,d,tile){const uv=geo.attributes.uv,F=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];for(let f=0;f<6;f++)for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,uv.getX(i)*F[f][0]/tile,uv.getY(i)*F[f][1]/tile);}return geo;}
function box(g,w,h,d,m,x,y,z,ry=0,tile=2.5){const mm=new T.Mesh(boxUV(new T.BoxGeometry(w,h,d),w,h,d,tile),m);mm.position.set(x,y,z);mm.rotation.y=ry;g.add(mm);return mm;}
// Telhado de duas águas com cumeeira ao longo de x: as águas se encontram na cumeeira, o triângulo da empena
// preenche a parede e o beiral passa igual dos dois lados. UV em metros (telhas do tamanho certo).
function roofMesh(g,P,U,m,x,y,z){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(P,3));geo.setAttribute('uv',new T.Float32BufferAttribute(U,2));geo.computeVertexNormals();const mm=new T.Mesh(geo,m);mm.position.set(x,y,z);g.add(mm);return mm;}
function pushTri(P,U,a,b,c,ua,ub,uc){P.push(...a,...b,...c);U.push(...ua,...ub,...uc);}
function pushQuad(P,U,a,b,c,d,ua,ub,uc,ud){pushTri(P,U,a,b,c,ua,ub,uc);pushTri(P,U,a,c,d,ua,uc,ud);}
function gableX(g,L,D,rise,roofM,faceM,y,over,ovE,tile){tile=tile||3.2;
 const hw=D/2+over,hl=L/2+ovE,sl=Math.hypot(hw,rise),k=sl/rise/tile,P=[],U=[];
 pushQuad(P,U,[hl,0,-hw],[-hl,0,-hw],[-hl,rise,0],[hl,rise,0],[hl/tile,0],[-hl/tile,0],[-hl/tile,rise*k],[hl/tile,rise*k]);
 pushQuad(P,U,[-hl,0,hw],[hl,0,hw],[hl,rise,0],[-hl,rise,0],[-hl/tile,0],[hl/tile,0],[hl/tile,rise*k],[-hl/tile,rise*k]);
 roofMesh(g,P,U,roofM,0,y,0);
 // triângulos das empenas, rente à parede (x=±L/2), sob o beiral
 const ra=rise*over/hw;
 for(const sx of [-1,1]){const Q=[],V=[],x=sx*L/2,hd=D/2,uvf=(z,yy)=>[z/2.5,yy/2.5];
  if(sx>0){pushTri(Q,V,[x,0,hd],[x,0,-hd],[x,ra,hd],uvf(hd,0),uvf(-hd,0),uvf(hd,ra));pushTri(Q,V,[x,0,-hd],[x,rise,0],[x,ra,hd],uvf(-hd,0),uvf(0,rise),uvf(hd,ra));pushTri(Q,V,[x,0,-hd],[x,ra,-hd],[x,rise,0],uvf(-hd,0),uvf(-hd,ra),uvf(0,rise));}
  else{pushTri(Q,V,[x,0,hd],[x,0,-hd],[x,ra,-hd],uvf(hd,0),uvf(-hd,0),uvf(-hd,ra));pushTri(Q,V,[x,0,hd],[x,ra,-hd],[x,rise,0],uvf(hd,0),uvf(-hd,ra),uvf(0,rise));pushTri(Q,V,[x,0,hd],[x,rise,0],[x,ra,hd],uvf(hd,0),uvf(0,rise),uvf(hd,ra));}
  roofMesh(g,Q,V,faceM,0,y,0);}
 // friso do beiral e da cumeeira
 for(const s of [-1,1])box(g,2*hl+.1,.26,.16,M.dark,0,y-.02,s*(hw-.04),0,2);
 box(g,2*hl+.2,.26,.5,M.dark,0,y+rise+.08,0,0,2);}
function cyl(g,r1,r2,h,m,x,y,z,seg=12,tile=2.5){const geo=new T.CylinderGeometry(r1,r2,h,seg),uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*2*Math.PI*Math.max(r1,r2)/tile,uv.getY(i)*h/tile);const mm=new T.Mesh(geo,m);mm.position.set(x,y+h/2,z);g.add(mm);return mm;}
function sph(g,r,m,x,y,z,sx=1,sy=1,sz=1){const s=new T.Mesh(new T.SphereGeometry(r,10,8),m);s.position.set(x,y,z);s.scale.set(sx,sy,sz);g.add(s);return s;}
// Funde por material, mantendo a posição/rotação do grupo de origem.
function mergeInto(group,parent,name,shadow=true){
 group.updateMatrixWorld(true);const buckets=new Map();const inv=new T.Matrix4().copy(group.matrixWorld).invert();
 group.traverse(o=>{if(!o.isMesh)return;let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv,o.matrixWorld));if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(!buckets.has(o.material))buckets.set(o.material,[]);buckets.get(o.material).push(g);});
 const out=new T.Group();out.name=name;out.position.copy(group.position);out.rotation.copy(group.rotation);parent.add(out);
 for(const [m,list] of buckets){let n=0;for(const g of list)n+=g.attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2);let off=0;
  for(const g of list){P.set(g.attributes.position.array,off*3);if(g.attributes.normal)N.set(g.attributes.normal.array,off*3);U.set(g.attributes.uv.array.subarray(0,g.attributes.position.count*2),off*2);off+=g.attributes.position.count;g.dispose();}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(P,3));geo.setAttribute('normal',new T.BufferAttribute(N,3));geo.setAttribute('uv',new T.BufferAttribute(U,2));geo.computeBoundingSphere();
  const mesh=new T.Mesh(geo,m);mesh.name=name;mesh.castShadow=shadow&&m!==M.glass&&m!==M.lamp&&m!==M.crystal&&m!==M.wing;mesh.receiveShadow=true;out.add(mesh);}
 return out;
}

// ---------- Peças estilizadas ----------
function crate(g,x,y,z,s,ry=0){const c=new T.Group();c.position.set(x,y,z);c.rotation.y=ry;
 box(c,s,s,s,M.light,0,s/2,0,0,s*1.2);
 for(const e of [-1,1]){for(const k of [-1,1]){box(c,s+.02,.1,.06,M.dark,0,s/2+k*(s/2-.05),e*(s/2+.01));box(c,.06,.1,s+.02,M.dark,e*(s/2+.01),s/2+k*(s/2-.05),0);box(c,.08,s+.02,.08,M.dark,e*(s/2-.03),s/2,k*(s/2-.03));}
  const d=box(c,.07,Math.hypot(s,s)*.9,.05,M.dark,0,s/2,e*(s/2+.02));d.rotation.z=Math.PI/4;}
 for(const e of [-1,1])for(const k of [-1,1])for(const j of [-1,1])box(c,.1,.1,.1,M.iron,e*s/2,s/2+j*(s/2-.04),k*s/2);
 g.add(c);return c;}
function barrel(g,x,y,z,h=1.05){const pts=[];for(let i=0;i<=8;i++){const t=i/8;pts.push(new T.Vector2(.34+.08*Math.sin(Math.PI*t),t*h));}
 const geo=new T.LatheGeometry(pts,14);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*4,uv.getY(i));const b=new T.Mesh(geo,M.door);b.position.set(x,y,z);g.add(b);
 for(const t of [.12,.38,.62,.88]){const r=.34+.08*Math.sin(Math.PI*t)+.012;const ring=new T.Mesh(new T.TorusGeometry(r,.025,4,18),M.iron);ring.rotation.x=Math.PI/2;ring.position.set(x,y+t*h,z);g.add(ring);}
 const top=new T.Mesh(new T.CircleGeometry(.34,14),M.dark);top.rotation.x=-Math.PI/2;top.position.set(x,y+h,z);g.add(top);}
function sack(g,x,y,z,ry=0){const s=sph(g,.32,M.sack,x,y+.28,z,1,.85,.75);s.rotation.y=ry;sph(g,.12,M.sack,x,y+.62,z,1,1.2,1);box(g,.2,.04,.2,M.rope,x,y+.56,z);}
function bench(g,x,y,z,ry=0,len=2){const b=new T.Group();b.position.set(x,y,z);b.rotation.y=ry;
 for(const e of [-1,1]){const s=new T.Shape();s.moveTo(0,0);s.lineTo(.1,0);s.quadraticCurveTo(.15,.25,.05,.45);s.lineTo(.42,.45);s.lineTo(.42,.5);s.lineTo(.02,.5);s.quadraticCurveTo(-.05,.75,-.22,1.0);s.lineTo(-.28,.98);s.quadraticCurveTo(-.1,.7,-.05,.48);s.quadraticCurveTo(.05,.25,0,0);
  const side=new T.Mesh(new T.ExtrudeGeometry(s,{depth:.06,bevelEnabled:false}),M.iron);side.rotation.y=Math.PI/2;side.position.set(e*(len/2-.15)-.03,0,-.2);b.add(side);}
 for(let i=0;i<4;i++)box(b,len,.04,.1,M.light,0,.5,-.15+i*.13,0,1.2);
 for(let i=0;i<3;i++){const sl=box(b,len,.1,.035,M.light,0,.62+i*.14,-.24-i*.035,0,1.2);sl.rotation.x=-.25;}
 for(const e of [-1,1])box(b,.08,.06,.42,M.iron,e*(len/2-.15),.72,0);
 g.add(b);return b;}
function lampPost(g,x,y,z,h=3.6){cyl(g,.22,.28,.35,M.stone,x,y,z,10);cyl(g,.07,.11,h,M.iron,x,y+.35,z,8);
 const ring=new T.Mesh(new T.TorusGeometry(.13,.03,6,12),M.gold);ring.rotation.x=Math.PI/2;ring.position.set(x,y+1.4,z);g.add(ring);
 for(const e of [-1,1]){const a=new T.Mesh(new T.TorusGeometry(.32,.025,5,12,Math.PI),M.iron);a.rotation.set(0,e>0?0:Math.PI,0);a.position.set(x+e*.32,y+h+.12,z);g.add(a);
  const lx=x+e*.62;cyl(g,.16,.12,.42,M.lamp,lx,y+h-.25,z,6);const cap=new T.Mesh(new T.ConeGeometry(.22,.22,6),M.iron);cap.position.set(lx,y+h+.28,z);g.add(cap);box(g,.025,.42,.025,M.iron,lx+.14,y+h-.04,z);box(g,.025,.42,.025,M.iron,lx-.14,y+h-.04,z);}
 sph(g,.08,M.gold,x,y+h+.5,z);}
function planter(g,x,y,z,w=2.4,d=1.1){box(g,w,.55,d,M.stone,x,y+.28,z,0,1.5);box(g,w+.16,.1,d+.16,M.tiles,x,y+.6,z,0,1.5);box(g,w-.2,.08,d-.2,M.soil,x,y+.62,z);
 for(let i=0;i<5;i++)sph(g,.3,M.leafDark,x-w/2+.35+i*(w-.7)/4,y+.85,z,1,.8,1);
 for(let i=0;i<12;i++)sph(g,.1,M.flower[i%4],x+(rnd()-.5)*(w-.3),y+1.02+rnd()*.12,z+(rnd()-.5)*(d-.3));}
function chair(g,x,y,z,ry=0){const c=new T.Group();c.position.set(x,y,z);c.rotation.y=ry;
 for(const e of [-1,1])for(const k of [-1,1])cyl(c,.035,.03,.48,M.dark,e*.2,0,k*.2,6);
 box(c,.5,.06,.5,M.dark,0,.5,0);box(c,.46,.07,.46,M.cushion,0,.56,0);
 for(const e of [-1,1])cyl(c,.03,.03,.62,M.dark,e*.2,.5,-.22,6);
 const back=new T.Mesh(new T.CylinderGeometry(.24,.24,.1,12,1,false,-Math.PI/2,Math.PI),M.dark);back.rotation.x=Math.PI/2;back.position.set(0,1.05,-.22);back.scale.z=.5;c.add(back);
 for(const e of [-.1,0,.1])box(c,.03,.38,.03,M.dark,e,.78,-.22);
 g.add(c);return c;}
function table(g,x,y,z,w,d,h=.82){box(g,w,.07,d,M.dark,x,y+h,z,0,1.5);box(g,w-.1,.06,d-.1,M.door,x,y+h-.06,z,0,1.5);
 for(const e of [-1,1])for(const k of [-1,1]){const lx=x+e*(w/2-.12),lz=z+k*(d/2-.12);cyl(g,.05,.04,h-.06,M.dark,lx,y,lz,8);sph(g,.06,M.dark,lx,y+h*.5,lz);}}
function shelf(g,x,y,z,w,h,ry=0,fill='books'){const s=new T.Group();s.position.set(x,y,z);s.rotation.y=ry;
 box(s,w,h,.06,M.dark,0,h/2,-.17);for(const e of [-1,1])box(s,.06,h,.4,M.dark,e*(w/2-.03),h/2,0);box(s,w+.1,.08,.44,M.dark,0,h+.04,0);
 for(let yy=.12;yy<h-.2;yy+=.6){box(s,w-.06,.04,.38,M.door,0,yy,0);
  if(fill==='books'){let a=-w/2+.1;while(a<w/2-.15){const bw=.06+rnd()*.06,bh=.3+rnd()*.15;box(s,bw,bh,.26,[M.roofRed,M.roofBlue,M.leafDark,M.dark][Math.floor(rnd()*4)],a+bw/2,yy+.02+bh/2,0,0,1);a+=bw+.01;}}
  else{for(let a=-w/2+.3;a<w/2-.2;a+=.55)box(s,.4,.3,.3,M.light,a,yy+.17,0,0,.6);}}
 g.add(s);return s;}

function build(api,isl){
 const P=isl.portSite,C=isl.center,R=isl.radius,Y=P.y,PL=P.plaza,E=R+1,O=window.arcanoObstacles,scene=api.scene;
 const root=new T.Group();root.name='Porto dos Ventos';root.position.set(C.x,0,C.z);root.rotation.y=-P.angle;scene.add(root);
 const W=(u,v)=>P.at(u,v);
 const obs=(u,v,hu,hv,ymin=Y-1,ymax=Y+5,enabled=null)=>{if(!O)return;const w=W(u,v),b={x:w.x,z:w.z,hw:hu,hd:hv,rot:-P.angle,ymin,ymax};if(enabled)b.enabled=enabled;O.addBox(b);};
 const obsC=(u,v,r,ymin=Y-1,ymax=Y+8)=>{if(!O)return;const w=W(u,v);O.addCircle(w.x,w.z,r,{ymin,ymax});};
 const interact=[],buildings=[];
 const g=new T.Group();
 const U0=PL.u0,HW=PL.hw;

 // ---------- Prédio oco com portas e janelas que abrem ----------
 // Moldura de cada parede: x ao longo da parede, z para FORA do prédio.
 function building(o){
  const {parent,cu,cv,y0,L,D,H,wallM,floorM,name}=o,t=.28;
  const bg=new T.Group();bg.position.set(cu,y0,cv);parent.add(bg);
  const upper=new T.Group();bg.add(upper);
  const b={name,L,D,H,bg,upper,walls:{},offU:o.offU||0,offV:o.offV||0,y0:o.worldY??y0};
  b.cuW=()=>cu+b.offU;b.cvW=()=>cv+b.offV;
  const frames={'v+':[0,D/2,0,L],'v-':[0,-D/2,Math.PI,L],'u+':[L/2,0,Math.PI/2,D],'u-':[-L/2,0,-Math.PI/2,D]};
  const toB=(side,x)=>side==='v+'?[x,D/2]:side==='v-'?[-x,-D/2]:side==='u+'?[L/2,-x]:[-L/2,x];
  box(bg,L-t,.1,D-t,floorM,0,.05,0,0,2);
  for(const side of Object.keys(frames)){
   const [fx,fz,ry,len]=frames[side];const fr=new T.Group();fr.position.set(fx,0,fz);fr.rotation.y=ry;bg.add(fr);
   const holes=(o.openings||[]).filter(q=>q.side===side);
   const sh=new T.Shape();sh.moveTo(-len/2-t/2,0);sh.lineTo(len/2+t/2,0);sh.lineTo(len/2+t/2,H);sh.lineTo(-len/2-t/2,H);sh.lineTo(-len/2-t/2,0);
   for(const q of holes){const hp=new T.Path();hp.moveTo(q.a-q.w/2,q.y0);hp.lineTo(q.a+q.w/2,q.y0);hp.lineTo(q.a+q.w/2,q.y1);hp.lineTo(q.a-q.w/2,q.y1);hp.lineTo(q.a-q.w/2,q.y0);sh.holes.push(hp);}
   const geo=new T.ExtrudeGeometry(sh,{depth:t,bevelEnabled:false});geo.translate(0,0,-t/2);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/2.5,uv.getY(i)/2.5);
   const wall=new T.Mesh(geo,wallM);wall.castShadow=true;wall.receiveShadow=true;fr.add(wall);
   box(fr,len+t+.1,.22,t+.12,M.dark,0,H-.11,0,0,2);box(fr,len+t+.1,.28,t+.1,o.baseM||M.stone,0,.14,0,0,2);
   b.walls[side]=fr;
   // Colisão: trechos da parede fora das portas.
   const doors=holes.filter(q=>q.kind==='door').sort((a,c)=>a.a-c.a);let cur=-len/2-t/2;
   const seg=(x0,x1)=>{if(x1-x0<.05)return;const xm=(x0+x1)/2,[bu,bv]=toB(side,xm),horiz=side[0]==='v';obs(cu+b.offU+bu,cv+b.offV+bv,horiz?(x1-x0)/2:t/2+.02,horiz?t/2+.02:(x1-x0)/2,b.y0-1,b.y0+H+1);};
   for(const q of doors){seg(cur,q.a-q.w/2);cur=q.a+q.w/2;}seg(cur,len/2+t/2);
   for(const q of holes){
    box(fr,.12,q.y1-q.y0+.12,t+.1,M.dark,q.a-q.w/2-.06,(q.y0+q.y1)/2,0);box(fr,.12,q.y1-q.y0+.12,t+.1,M.dark,q.a+q.w/2+.06,(q.y0+q.y1)/2,0);
    box(fr,q.w+.36,.14,t+.14,M.dark,q.a,q.y1+.07,0);
    const [bu,bv]=toB(side,q.a),horiz=side[0]==='v',ou=cu+b.offU+bu,ov=cv+b.offV+bv;
    if(q.kind==='door'){
     const leaves=q.double?[[-1,q.w/2],[1,q.w/2]]:[[-1,q.w]];const hinges=[];
     for(const [sd,lw] of leaves){const hg=new T.Group();hg.position.set(q.a+sd*q.w/2,q.y0,0);fr.add(hg);const dir=-sd;
      box(hg,lw-.02,q.y1-q.y0-.02,.08,M.door,dir*lw/2,(q.y1-q.y0)/2,0,0,1.4);
      for(const yy of [.3,(q.y1-q.y0)/2,q.y1-q.y0-.3])box(hg,lw-.1,.08,.11,M.iron,dir*lw/2,yy,0);
      sph(hg,.06,M.gold,dir*(lw-.15),(q.y1-q.y0)*.48,.08);sph(hg,.06,M.gold,dir*(lw-.15),(q.y1-q.y0)*.48,-.08);
      hinges.push({hg,sd});}
     const it={label:q.label||'porta',open:false,anim:0,wp:()=>W(ou,ov),apply(a){for(const h of hinges)h.hg.rotation.y=-h.sd*1.45*a;}};
     interact.push(it);
     obs(ou,ov,horiz?q.w/2:t/2,horiz?t/2:q.w/2,b.y0-1,b.y0+H,()=>it.anim<.5);
    }else{
     box(fr,q.w+.3,.1,t+.3,M.dark,q.a,q.y0-.05,.05);
     const leaves=[];
     for(const sd of [-1,1]){const hg=new T.Group();hg.position.set(q.a+sd*q.w/2,q.y0,t/2);fr.add(hg);const dir=-sd,lw=q.w/2;
      box(hg,lw-.02,q.y1-q.y0-.02,.03,M.glass,dir*lw/2,(q.y1-q.y0)/2,0);
      for(const e of [0,1])box(hg,.05,q.y1-q.y0,.06,M.dark,dir*(e*lw),(q.y1-q.y0)/2,0);
      box(hg,lw,.05,.06,M.dark,dir*lw/2,q.y1-q.y0,0);box(hg,lw,.05,.06,M.dark,dir*lw/2,0,0);box(hg,lw,.04,.06,M.dark,dir*lw/2,(q.y1-q.y0)/2,0);
      leaves.push({hg,sd});}
     if(q.flowers){box(fr,q.w+.2,.22,.3,M.light,q.a,q.y0-.2,t/2+.18);for(let i=0;i<6;i++)sph(fr,.09,M.flower[i%4],q.a-q.w/2+.15+i*(q.w-.3)/5,q.y0-.04,t/2+.18);}
     interact.push({label:q.label||'janela',open:false,anim:0,wp:()=>W(ou,ov),apply(a){for(const l of leaves)l.hg.rotation.y=l.sd*1.9*a;}});
    }
   }
  }
  b.inRect=(u,v)=>Math.abs(u-b.cuW())<L/2-.2&&Math.abs(v-b.cvW())<D/2-.2;
  buildings.push(b);return b;
 }

 // ---------- Praça ----------
 box(g,E-U0,.12,HW*2,M.tiles,(U0+E)/2,Y+.02,0,0,3);
 {const c=new T.Mesh(new T.CircleGeometry(6.5,48),M.compass);c.rotation.x=-Math.PI/2;c.position.set(R-30,Y+.1,0);g.add(c);
  const ring=new T.Mesh(new T.TorusGeometry(6.6,.18,6,48),M.stone);ring.rotation.x=Math.PI/2;ring.position.set(R-30,Y+.1,0);g.add(ring);}
 for(const s of [-1,1]){
  box(g,E-(U0+8),.7,.6,M.stone,(U0+8+E)/2,Y+.35,s*HW,0,2);box(g,E-(U0+8)+.2,.12,.8,M.tiles,(U0+8+E)/2,Y+.76,s*HW,0,2);obs((U0+8+E)/2,s*HW,(E-(U0+8))/2,.35);
  for(let u=U0+10;u<E-2;u+=10){lampPost(g,u,Y,s*(HW-.7));obsC(u,s*(HW-.7),.3);}
 }
 for(const [v0,v1] of [[-HW,-5.2],[5.2,HW]]){const vc=(v0+v1)/2,len=v1-v0;
  box(g,.5,.3,len,M.stone,E-.3,Y+.15,vc,0,2);for(let v=v0+.4;v<v1;v+=.6){const pts=[];for(let i=0;i<=6;i++){const t=i/6;pts.push(new T.Vector2(.07+.06*Math.sin(Math.PI*t*1.2),t*.7));}const bl=new T.Mesh(new T.LatheGeometry(pts,8),M.stone);bl.position.set(E-.3,Y+.3,v);g.add(bl);}
  box(g,.6,.16,len,M.tiles,E-.3,Y+1.08,vc,0,2);obs(E-.3,vc,.3,len/2);}
 for(const s of [-1,1]){box(g,1.4,5.2,1.4,M.stone,U0+1,Y+2.6,s*5,0,2);box(g,1.7,.4,1.7,M.tiles,U0+1,Y+5.4,s*5,0,2);obs(U0+1,s*5,.7,.7);}
 // Placa do portal: viga sobre os pilares, tabuleiro de madeira com moldura dourada e texto dos dois lados.
 box(g,.9,.5,10.8,M.dark,U0+1,Y+5.85,0,0,2);
 box(g,.34,2.3,9.4,M.dark,U0+1,Y+7.25,0,0,2);
 box(g,.4,.14,9.8,M.gold,U0+1,Y+8.47,0);box(g,.4,.14,9.8,M.gold,U0+1,Y+6.03,0);
 for(const s of [-1,1]){box(g,.4,2.3,.14,M.gold,U0+1,Y+7.25,s*4.8);sph(g,.28,M.gold,U0+1,Y+8.7,s*4.8);}
 for(const f of [-1,1]){const sg=new T.Mesh(new T.PlaneGeometry(8.9,2.0),M.sign);sg.position.set(U0+1+f*.18,Y+7.25,0);sg.rotation.y=f<0?-Math.PI/2:Math.PI/2;g.add(sg);}
 for(const s of [-1,1]){const CLm=window.arcanoCloth;box(g,.12,.1,1.7,M.gold,U0+.6,Y+5.02,s*3.6);
  if(CLm){const bm=CLm.banner(1.4,3.2,{kind:s>0?'blue':'red'});bm.position.set(U0+.6,Y+5.0,s*3.6);bm.rotation.y=-Math.PI/2;root.add(bm);}else box(g,.06,3.2,1.4,s>0?M.blue:M.red,U0+.6,Y+3.4,s*3.6);}
 cyl(g,1.4,1.7,.6,M.stone,R-30,Y,0,16);cyl(g,.7,.9,2.2,M.tiles,R-30,Y+.6,0,12);cyl(g,1.0,.8,.25,M.gold,R-30,Y+2.8,0,16);obsC(R-30,0,1.8);
 for(let i=0;i<4;i++){const a=i*Math.PI/2;const r=new T.Mesh(new T.TorusGeometry(.55,.04,5,16,Math.PI),M.gold);r.position.set(R-30+Math.cos(a)*.75,Y+2.1,Math.sin(a)*.75);r.rotation.y=-a;g.add(r);}
 for(const [u,v,ry] of [[R-20,-7.5,0],[R-20,7.5,Math.PI],[R-42,-6.5,0],[R-42,6.5,Math.PI]]){bench(g,u,Y,v,ry);obs(u,v,1,.4);}
 for(const [u,v] of [[R-52,-9],[R-52,9],[R-12,-12],[R-12,12]]){planter(g,u,Y,v);obs(u,v,1.2,.6);}

 // ---------- Capitania + bilheteria ----------
 {const cu=R-36,cv=15,L=11,D=8,H=3.6;
  const b=building({parent:root,cu,cv,y0:Y,L,D,H,wallM:M.stone,floorM:M.deck,name:'Capitania · Bilheteria',
   openings:[{side:'v-',kind:'door',a:2.5,w:1.5,y0:0,y1:2.5,label:'porta da bilheteria'},
    {side:'v-',kind:'window',a:-2.2,w:2.2,y0:1.0,y1:2.3,label:'guichê da bilheteria'},
    {side:'u-',kind:'window',a:0,w:1.4,y0:1.1,y1:2.4,label:'janela',flowers:true},
    {side:'u+',kind:'window',a:1.5,w:1.4,y0:1.1,y1:2.4,label:'janela',flowers:true},
    {side:'v+',kind:'window',a:-2,w:1.4,y0:1.1,y1:2.4,label:'janela'}]});
  const ig=new T.Group();
  {const sg=new T.Mesh(new T.PlaneGeometry(2.6,.65),M.ticket);sg.position.set(2.2,H-.55,-D/2-.2);sg.rotation.y=Math.PI;ig.add(sg);
   for(let i=0;i<6;i++){const st=box(ig,.45,.05,1.3,i%2?M.red:M.cloth,2.2-1.15+i*.46,2.9,-D/2-.6);st.rotation.x=.35;}}
  // Balcão do guichê (livro, sineta, tinteiro) e cadeira estofada atrás.
  box(ig,3.2,1.05,.7,M.dark,2.2,.55,-D/2+.75,0,1.5);box(ig,3.4,.08,.85,M.door,2.2,1.1,-D/2+.75,0,1.5);
  for(const e of [-1,0,1])box(ig,.9,.7,.04,M.light,2.2+e*1,.55,-D/2+.38,0,1);
  box(ig,.5,.06,.36,M.cloth,2.8,1.17,-D/2+.75);box(ig,.5,.05,.36,M.roofRed,2.8,1.21,-D/2+.75);
  {const bell=new T.Mesh(new T.SphereGeometry(.09,10,8,0,6.3,0,Math.PI/2),M.gold);bell.position.set(1.6,1.15,-D/2+.75);ig.add(bell);}cyl(ig,.05,.06,.1,M.iron,1.9,1.14,-D/2+.75,8);
  chair(ig,2.2,0,-D/2+1.75,Math.PI);
  obs(cu+2.2,cv-D/2+.75,1.7,.45,Y-1,Y+3);
  shelf(ig,-L/2+.45,0,1.2,2,2.4,Math.PI/2);obs(cu-L/2+.45,cv+1.2,.25,1,Y-1,Y+3);
  shelf(ig,1,0,D/2-.4,2.2,2.4,Math.PI,'boxes');obs(cu+1,cv+D/2-.4,1.1,.25,Y-1,Y+3);
  {const mp=new T.Mesh(new T.PlaneGeometry(2.2,1.6),M.map);mp.position.set(L/2-.16,2,-1);mp.rotation.y=-Math.PI/2;ig.add(mp);box(ig,.06,1.8,2.4,M.dark,L/2-.12,2,-1);}
  {const cl=new T.Mesh(new T.CircleGeometry(.35,24),M.compass);cl.position.set(-L/2+.16,2.7,-1.6);cl.rotation.y=Math.PI/2;ig.add(cl);}
  table(ig,3.3,0,1.6,1.6,1);chair(ig,3.3,0,2.5,Math.PI);obs(cu+3.3,cv+1.6,.85,.55,Y-1,Y+2);
  {const pm=new T.Mesh(new T.PlaneGeometry(1,.7),M.map);pm.rotation.x=-Math.PI/2;pm.position.set(3.3,.89,1.6);ig.add(pm);}
  bench(ig,-1.5,0,2.8,Math.PI,1.8);obs(cu-1.5,cv+2.8,.9,.35,Y-1,Y+2);
  box(ig,3,.02,2,M.rug,-.5,.11,-.2,0,3);
  cyl(ig,.28,.22,.55,M.roofRed,-L/2+.6,0,-D/2+.6,10);sph(ig,.45,M.leaf,-L/2+.6,.95,-D/2+.6);obsC(cu-L/2+.6,cv-D/2+.6,.4);
  box(ig,.04,.6,.04,M.iron,0,H-.3,0);cyl(ig,.18,.14,.35,M.lamp,0,H-.95,0,6);
  mergeInto(ig,b.bg,'Capitania · interior');
  const up=new T.Group();
  box(up,L+.4,.3,D+.4,M.dark,0,H+.15,0);box(up,L,3,D,M.plaster,0,H+1.8,0,0,3);
  for(const du of [-3.5,0,3.5]){box(up,1.2,1.3,.12,M.glass,du,H+1.8,-D/2-.06);box(up,1.4,.12,.25,M.dark,du,H+1.1,-D/2-.12);}
  gableX(up,L,D,2.7,M.roofBlueS,M.plaster,H+3.3,.6,.5);
  box(up,3,6,3,M.plaster,L/2-1.5,H+5.4,0,0,2);{const cl=new T.Mesh(new T.CircleGeometry(1,24),M.compass);cl.position.set(L/2-1.5,H+6.8,-1.52);cl.rotation.y=Math.PI;up.add(cl);}
  {const cg=new T.ConeGeometry(2.3,2.6,4);{const uv=cg.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*13/3.2,uv.getY(i)*3.8/3.2);}const c=new T.Mesh(cg,M.roofBlueS);c.rotation.y=Math.PI/4;c.position.set(L/2-1.5,H+9.7,0);up.add(c);}
  box(up,.08,1.8,.08,M.gold,L/2-1.5,H+11.8,0);box(up,1.2,.06,.06,M.gold,L/2-1.5,H+12.3,0);
  mergeInto(up,b.upper,'Capitania · andar de cima');
 }
 // ---------- Armazém ----------
 {const cu=R-37,cv=-15.5,L=22,D=9,H=5.2;
  const b=building({parent:root,cu,cv,y0:Y,L,D,H,wallM:M.dark,floorM:M.light,baseM:M.stone,name:'Armazém',
   openings:[{side:'v+',kind:'door',double:true,a:-4,w:3.2,y0:0,y1:3.4,label:'portão do armazém'},
    {side:'v+',kind:'door',double:true,a:5,w:3.2,y0:0,y1:3.4,label:'portão do armazém'},
    {side:'v+',kind:'window',a:.6,w:1.6,y0:2.2,y1:3.6,label:'janela'},
    {side:'u-',kind:'window',a:0,w:1.6,y0:2.2,y1:3.6,label:'janela'},
    {side:'u+',kind:'window',a:0,w:1.6,y0:2.2,y1:3.6,label:'janela'}]});
  const ig=new T.Group();
  {const sg=new T.Mesh(new T.PlaneGeometry(3,.75),M.store);sg.position.set(.6,H-.55,D/2+.16);ig.add(sg);}
  for(const x of [-7.5,-2.5,2.5,7.5]){shelf(ig,x,0,-D/2+.45,3.6,3.4,0,'boxes');obs(cu+x,cv-D/2+.45,1.8,.25,Y-1,Y+4);}
  for(let i=0;i<5;i++)crate(ig,-8+i*1.2,0,1.6,.9,rnd()*.3);crate(ig,-7.4,.9,1.6,.8,.2);obs(cu-5.6,cv+1.6,3,.55,Y-1,Y+3);
  for(let i=0;i<4;i++)barrel(ig,7.5+i*.85,0,1.4);obs(cu+8.8,cv+1.4,1.8,.45,Y-1,Y+3);
  for(let i=0;i<5;i++)sack(ig,1.2+i*.7,0,2.6,rnd()*3);obs(cu+2.6,cv+2.6,1.8,.4,Y-1,Y+2);
  table(ig,0,0,-1,2.2,1);chair(ig,0,0,0,Math.PI);obs(cu,cv-1,1.1,.55,Y-1,Y+2);
  for(const x of [-6,0,6]){box(ig,.04,1,.04,M.iron,x,H-.5,0);cyl(ig,.2,.15,.4,M.lamp,x,H-1.4,0,6);}
  for(let i=0;i<4;i++)crate(ig,-9+i*1.1,0,D/2+1.5,.95,rnd()*.4);crate(ig,-8.4,.95,D/2+1.5,.85,.3);obs(cu-7.3,cv+D/2+1.5,2.3,.55);
  for(let i=0;i<3;i++)barrel(ig,9-i*.85,0,D/2+1.2);obs(cu+8.15,cv+D/2+1.2,1.3,.45);
  mergeInto(ig,b.bg,'Armazém · interior');
  const up=new T.Group();
  gableX(up,L,D,2.5,M.roofRedS,M.dark,H,.7,.6);
  mergeInto(up,b.upper,'Armazém · telhado');
 }
 // ---------- Guindaste com roldana ----------
 {const cu=E-3.5,cv=-8;cyl(g,1,1.2,.5,M.stone,cu,Y,cv,12);cyl(g,.32,.4,6.6,M.dark,cu,Y+.5,cv,10);
  for(const e of [-1,1]){const st=box(g,.18,4,.18,M.dark,cu+e*.6,Y+2.2,cv);st.rotation.z=e*.18;}
  const arm=new T.Group();arm.position.set(cu,Y+6.8,cv);arm.rotation.y=-.75;g.add(arm);
  box(arm,8.5,.35,.35,M.dark,3.6,0,0);const br=box(arm,4.4,.15,.15,M.dark,1.8,-1,0);br.rotation.z=.45;box(arm,.6,.6,.6,M.iron,0,.3,0);
  const pul=new T.Mesh(new T.TorusGeometry(.28,.07,6,14),M.iron);pul.position.set(7.6,-.25,0);arm.add(pul);
  box(arm,.04,3.6,.04,M.rope,7.85,-2.1,0);const hook=new T.Mesh(new T.TorusGeometry(.14,.04,5,10,Math.PI*1.4),M.iron);hook.position.set(7.85,-4,0);arm.add(hook);
  crate(arm,7.85,-5.2,0,.95,.3);
  obsC(cu,cv,1.2);}

 // ---------- Píer engastado no bloco de pedra, sobre o céu ----------
 const PU0=R-3.5,PU1=E+48,PH=5,DY=Y+.08;
 box(g,PU1-PU0,.25,PH*2,M.deck,(PU0+PU1)/2,DY-.12,0,0,2.5);
 box(g,14,.25,PH*2+5,M.deck,PU1-7,DY-.12,-2.5,0,2.5);
 // Braço de pedra da própria ilha que sai do penhasco e sustenta o píer inteiro
 // (topo logo abaixo das vigas, embaixo afina numa quilha pontiaguda).
 {const OT=DY-1.05,U0=R-6,U1=PU1+2.5,NS=60,NV=12,pos=[],col=[],ix=[];
  // Na beira do penhasco o braço se alarga e sobe até a praça: fecha a fenda dos dois lados do píer.
  const flare=u=>{const q=Math.min(1,Math.max(0,(u-(R+3))/8));return 1-q*q*(3-2*q);};
  const topAt=u=>OT+(Y-.08-OT)*flare(u);
  const hs=n=>{const x=Math.sin(n*91.7)*43758.5;return x-Math.floor(x);};
  const vmin=u=>{const b=u>PU1-15?-PH-6.2:-PH-1.4;return b+(-HW-1.5-b)*flare(u);},vmax=u=>{const b=PH+1.2;return b+(HW+1.5-b)*flare(u);};
  for(let i=0;i<=NS;i++){const t=i/NS,u=U0+(U1-U0)*t,tip=Math.min(1,(U1-u)/4);
   const a=vmin(u)*Math.max(.25,tip),b=vmax(u)*Math.max(.25,tip),depth=(34-20*t+14*flare(u))*Math.max(.3,tip),vc=(a+b)/2,OTu=topAt(u);
   for(let k=0;k<=NV;k++){const s=k/NV;let v,y;
    if(s<=.15){const q=s/.15;v=a+(b-a)*q;y=OTu;}
    else{const q=(s-.15)/.85,ang=q*Math.PI;v=vc+(b-vc)*Math.cos(ang)*(1-.35*Math.pow(Math.sin(ang),2));y=OTu-depth*Math.pow(Math.sin(ang),.7);}
    const j=(s>.15)?(hs(i*13+k*7)-.5)*1.4:0;pos.push(u+(s>.15?(hs(i*5+k)-.5)*1.2:0),y+j*.6,v+j);
    const dy=OTu-y,c=dy<1.2?[.47,.42,.30]:dy<10?[.78,.69,.56]:[.62,.64,.70],m=.86+.14*(Math.sin(y*.5+u*.07)>0?1:0);col.push(c[0]*m,c[1]*m,c[2]*m);
    if(i<NS&&k<NV){const p=i*(NV+1)+k,q2=p+NV+1;ix.push(p,q2,p+1,p+1,q2,q2+1);}}}
  const og=new T.BufferGeometry();og.setAttribute('position',new T.Float32BufferAttribute(pos,3));og.setAttribute('color',new T.Float32BufferAttribute(col,3));og.setIndex(ix);og.computeVertexNormals();
  const out=new T.Mesh(og,new T.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true,side:T.DoubleSide}));out.name='Braço de pedra sob o píer';out.castShadow=true;out.receiveShadow=true;root.add(out);
  // Pilares de madeira com sapatas de pedra: do píer até o topo do braço de pedra.
  for(let u=R+2;u<PU1;u+=4){for(const s of [-1,1]){box(g,.4,DY-OT+.1,.4,M.dark,u,(DY+OT)/2-.1,s*(PH-.3));box(g,.8,.3,.8,M.stone,u,OT+.15,s*(PH-.3),0,1);}box(g,.3,.4,PH*2,M.dark,u,DY-.42,0);}
 }
 for(const s of [-1,1])box(g,PU1-PU0,.35,.35,M.dark,(PU0+PU1)/2,DY-.65,s*(PH-.3));
 const GU=E+24,GW=2.6;
 const rail=(u0,u1,v)=>{const L=u1-u0;if(L<=.2)return;box(g,L,.12,.18,M.light,(u0+u1)/2,DY+1.05,v,0,2);box(g,L,.08,.1,M.dark,(u0+u1)/2,DY+.55,v,0,2);
  for(let u=u0;u<=u1+.01;u+=2){box(g,.18,1.1,.18,M.dark,u,DY+.5,v);sph(g,.1,M.gold,u,DY+1.15,v);}obs((u0+u1)/2,v,L/2,.2,DY-.6,DY+3);};
 rail(E+.4,PU1-14,-PH+.1);rail(E+.4,GU-GW/2,PH-.1);rail(GU+GW/2,PU1-14,PH-.1);
 rail(PU1-14,PU1,PH-.1);rail(PU1-14,PU1,-PH-4.9);{box(g,.16,1.1,PH*2+5,M.dark,PU1,DY+.5,-2.5);box(g,.2,.12,PH*2+5,M.light,PU1,DY+1.05,-2.5);obs(PU1,-2.5,.2,PH+2.5,DY-.6,DY+3);}
 {box(g,.16,1.1,4.8,M.dark,PU1-14,DY+.5,-PH-2.5);obs(PU1-14,-PH-2.5,.2,2.4,DY-.6,DY+3);}
 for(let u=E+4;u<PU1-14;u+=8)for(const s of [-1,1]){if(s>0&&Math.abs(u-GU)<3)continue;lampPost(g,u,DY,s*(PH-.1),3);}
 for(const u of [GU-6,GU+6]){const pts=[new T.Vector2(.34,0),new T.Vector2(.26,.15),new T.Vector2(.24,.6),new T.Vector2(.4,.7),new T.Vector2(.4,.82),new T.Vector2(0,.85)];const bo=new T.Mesh(new T.LatheGeometry(pts,12),M.iron);bo.position.set(u,DY,PH-.8);g.add(bo);
  const coil=new T.Mesh(new T.TorusGeometry(.32,.07,6,14),M.rope);coil.rotation.x=Math.PI/2;coil.position.set(u,DY+.45,PH-.8);g.add(coil);obsC(u,PH-.8,.45,DY-1,DY+2);}
 for(let i=0;i<3;i++)barrel(g,E+3+i*.85,DY,-PH+.9);obs(E+3.85,-PH+.9,1.3,.45,DY-1,DY+2);
 crate(g,E+6.5,DY,-PH+.9,.9,.2);crate(g,E+7.5,DY,-PH+.9,.8,.1);obs(E+7,-PH+.9,1,.5,DY-1,DY+2);
 mergeInto(g,root,'Porto dos Ventos · estrutura');

 // ---------- Farol (oco, porta que abre, sala dentro) ----------
 const crystals=[];
 const mkCrystal=(parent,u,y,v,s)=>{const c=new T.Mesh(new T.OctahedronGeometry(s,0),M.crystal);c.position.set(u,y,v);parent.add(c);crystals.push(c);return c;};
 mkCrystal(root,R-30,Y+4.2,0,.8);
 let lighthouse;
 {const fu=PU1-6,fv=-6.5,RI=2.2,H=3.4,gap=.42;
  const bg=new T.Group();bg.position.set(fu,DY,fv);root.add(bg);const up=new T.Group();bg.add(up);
  const lo=new T.Group();
  const wall=new T.Mesh(new T.CylinderGeometry(RI,RI+.15,H,24,1,true,Math.PI*1.5+gap,Math.PI*2-gap*2),M.stone);wall.position.y=H/2;lo.add(wall);
  const wall2=new T.Mesh(new T.CylinderGeometry(RI-.25,RI-.1,H,24,1,true,Math.PI*1.5+gap,Math.PI*2-gap*2),M.stone);wall2.position.y=H/2;lo.add(wall2);
  cyl(lo,RI+.35,RI+.45,.35,M.stone,0,0,0,24);box(lo,RI*2-.5,.08,RI*2-.5,M.deck,0,.06,0,0,2);
  const dh=new T.Group();dh.position.set(-RI,0,-.85);lo.add(dh);box(dh,.08,2.3,1.7,M.door,0,1.15,.85,0,1.4);for(const yy of [.4,1.15,1.9])box(dh,.11,.08,1.6,M.iron,0,yy,.85);sph(dh,.06,M.gold,-.07,1.1,1.5);
  box(lo,.4,2.6,.15,M.dark,-RI,1.3,-.95);box(lo,.4,2.6,.15,M.dark,-RI,1.3,.95);box(lo,.45,.18,2.1,M.dark,-RI,2.55,0);
  const it={label:'porta do farol',open:false,anim:0,wp:()=>W(fu-RI,fv),apply(a){dh.rotation.y=1.5*a;}};
  interact.push(it);obs(fu-RI,fv,.15,.9,DY-1,DY+3,()=>it.anim<.5);
  if(O)for(let i=0;i<20;i++){const a=(i+.5)/20*Math.PI*2;const da=Math.atan2(Math.sin(a-Math.PI),Math.cos(a-Math.PI));if(Math.abs(da)<gap+.1)continue;const w=W(fu+Math.cos(a)*RI,fv+Math.sin(a)*RI);O.addBox({x:w.x,z:w.z,hw:.25,hd:RI*Math.PI/20+.05,rot:-P.angle-a,ymin:DY-1,ymax:DY+4});}
  cyl(lo,.12,.12,H,M.dark,.6,0,.6,8);for(let i=0;i<12;i++){const a=i/12*Math.PI*1.5,st=box(lo,.9,.08,.35,M.light,.6+Math.cos(a)*.5,.25+i*.27,.6+Math.sin(a)*.5);st.rotation.y=-a;}
  table(lo,-.6,0,.8,1,.7);chair(lo,-.6,0,1.5,Math.PI);barrel(lo,.9,0,-1.2);box(lo,.04,.5,.04,M.iron,0,H-.25,0);cyl(lo,.17,.13,.32,M.lamp,0,H-.75,0,6);
  if(O){obsC(fu-.6,fv+.8,.6,DY-1,DY+2);obsC(fu+.6,fv+.6,.9,DY-1,DY+4);obsC(fu+.9,fv-1.2,.45,DY-1,DY+2);}
  mergeInto(lo,bg,'Farol · térreo');
  const tw=new T.Group();
  cyl(tw,1.8,2.25,7,M.stone,0,H,0,16);for(const hh of [H+.1,H+3.5])cyl(tw,2.1,2.1,.3,M.gold,0,hh,0,16);
  cyl(tw,2.4,2.4,.4,M.dark,0,H+7,0,16);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;box(tw,.14,2.2,.14,M.iron,Math.cos(a)*1.4,H+8.5,Math.sin(a)*1.4);}
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2;box(tw,.08,.8,.08,M.iron,Math.cos(a)*2.3,H+7.6,Math.sin(a)*2.3);}const rl=new T.Mesh(new T.TorusGeometry(2.3,.05,4,32),M.iron);rl.rotation.x=Math.PI/2;rl.position.y=H+8;tw.add(rl);
  const roof=new T.Mesh(new T.ConeGeometry(2.2,2.4,16),M.copper);roof.position.y=H+10.8;tw.add(roof);box(tw,.12,1.2,.12,M.gold,0,H+12.4,0);
  mergeInto(tw,up,'Farol · torre');
  mkCrystal(up,0,H+8.6,0,.9);
  const beacon=new T.PointLight('#8fe0ff',1.2,40,1.6);beacon.position.set(0,H+8.6,0);up.add(beacon);
  lighthouse={bg,upper:up,beacon,walls:{},name:'Farol',L:0,D:0,inRect:(u,v)=>Math.hypot(u-fu,v-fv)<RI-.3,cuW:()=>fu,cvW:()=>fv};buildings.push(lighthouse);
 }

 // ---------- Navio voador ----------
 const ship=new T.Group();ship.name='Navio voador';root.add(ship);
 const SU=GU,SV=PH+3.2+5,LEN=36,BW=5,DEPTH=4.4,SDY=DY+.55;
 ship.position.set(SU,SDY,SV);
 const wAt=s=>BW*(s<.12?.72+.28*Math.sin(s/.12*Math.PI/2):s>.62?Math.pow(Math.cos((s-.62)/.38*Math.PI/2),.75):1);
 const dAt=s=>DEPTH*(.75+.25*Math.sin(Math.PI*Math.min(1,s*1.1)));
 const sx=s=>(s-.5)*LEN;
 const wings=[],props=[],flags=[],rings=[];let core;
 {const NS=48,NK=14,pos=[],uv=[],ix=[];
  for(let i=0;i<=NS;i++){const s=i/NS,w=Math.max(.05,wAt(s)),d=dAt(s);
   for(let k=0;k<=NK;k++){const f=k/NK*Math.PI,lat=w*Math.cos(f),y=-d*Math.pow(Math.sin(f),.85);pos.push(sx(s),y,lat);uv.push(s*LEN/3,f/Math.PI*3);}}
  for(let i=0;i<NS;i++)for(let k=0;k<NK;k++){const a=i*(NK+1)+k,b=a+1,c=a+NK+1,d=c+1;ix.push(a,b,c,b,d,c);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();
  const sg=new T.Group();sg.add(new T.Mesh(geo,M.hull));
  const sh=new T.Shape();for(let i=0;i<=40;i++){const s=i/40;sh[i?'lineTo':'moveTo'](sx(s),wAt(s));}for(let i=40;i>=0;i--){const s=i/40;sh.lineTo(sx(s),-wAt(s));}
  const dg=new T.ExtrudeGeometry(sh,{depth:.2,bevelEnabled:false});dg.rotateX(Math.PI/2);const duv=dg.attributes.uv;for(let i=0;i<duv.count;i++)duv.setXY(i,duv.getX(i)/2.5,duv.getY(i)/2.5);
  sg.add(new T.Mesh(dg,M.deck));
  for(let i=0;i<40;i++){const s0=i/40,s1=(i+1)/40;for(const side of [-1,1]){const x0=sx(s0),x1=sx(s1),z0=side*wAt(s0),z1=side*wAt(s1),L=Math.hypot(x1-x0,z1-z0),ang=Math.atan2(z1-z0,x1-x0);
   const mid=[(x0+x1)/2,(z0+z1)/2];const bb=box(sg,L+.05,.18,.16,M.gold,mid[0],-.25,mid[1]);bb.rotation.y=-ang;
   const gapHere=side<0&&Math.abs((s0+s1)/2-.5)<GW/2/LEN+.01;
   if(!gapHere){const r=box(sg,L+.05,.12,.14,M.light,mid[0],1.05,mid[1]);r.rotation.y=-ang;if(i%2===0){box(sg,.14,1.05,.14,M.dark,x0,.52,z0);sph(sg,.08,M.gold,x0,1.15,z0);}}}}
  {const bs=box(sg,7,.3,.3,M.dark,sx(1)+2.6,1.2,0);bs.rotation.z=.25;const head=new T.Mesh(new T.ConeGeometry(.5,1.6,8),M.gold);head.rotation.z=-Math.PI/2;head.position.set(sx(1)+.4,-.4,0);sg.add(head);
   for(const s of [-1,1]){const wg=box(sg,1.6,.08,1,M.gold,sx(1)-.4,-.2,s*.7);wg.rotation.set(s*.5,0,.3);}}
  for(const [s,h] of [[.42,17],[.7,14]]){const mu=sx(s);cyl(sg,.32,.4,h,M.dark,mu,0,0,10);box(sg,.6,.6,.6,M.gold,mu,h,0);
   for(const [yy,span,sh_] of [[h*.42,8.2,h*.3],[h*.78,6.4,h*.2]]){box(sg,.25,.25,span,M.dark,mu+.2,yy+sh_/2,0);
    const pg=new T.PlaneGeometry(span-.6,sh_,10,6),pp=pg.attributes.position;for(let i=0;i<pp.count;i++){const z=pp.getX(i),y=pp.getY(i);pp.setZ(i,.9*Math.cos(z/(span)*Math.PI)*(.6+.4*Math.cos(y/sh_*Math.PI)));}pg.computeVertexNormals();
    const sail=new T.Mesh(pg,M.sail);sail.rotation.y=Math.PI/2;sail.position.set(mu+.5,yy,0);sg.add(sail);}}
  for(const s of [.3,.55,.8])for(const side of [-1,1]){if(side<0&&Math.abs(s-.5)<.08)continue;sph(sg,.22,M.lamp,sx(s),.7,side*(wAt(s)+.25));}
  mergeInto(sg,ship,'Navio voador · casco');
  // Velas-asa só do lado de FORA: o lado do píer fica livre para a prancha.
  for(const [s,size] of [[.5,1.45],[.3,1.05]]){
   const sh2=new T.Shape();sh2.moveTo(0,0);sh2.lineTo(7*size,1.2*size);sh2.quadraticCurveTo(8.5*size,-1*size,6*size,-3.2*size);sh2.quadraticCurveTo(3*size,-2.4*size,0,-1.2*size);sh2.lineTo(0,0);
   const wg=new T.Mesh(new T.ShapeGeometry(sh2),M.wing);wg.rotation.x=-Math.PI/2;const pivot=new T.Group();pivot.position.set(sx(s),.6,wAt(s));pivot.add(wg);ship.add(pivot);wings.push({pivot,ph:s*7});}
  for(const side of [-1,1]){const hub=new T.Group();hub.position.set(sx(0)-.6,-.8,side*2.4);ship.add(hub);
   const shaft=new T.Mesh(new T.CylinderGeometry(.12,.12,1.4,8),M.iron);shaft.rotation.z=Math.PI/2;shaft.position.x=.6;hub.add(shaft);
   const rot=new T.Group();rot.position.x=-.1;hub.add(rot);for(let b=0;b<4;b++){const bl=new T.Mesh(new T.BoxGeometry(.12,1.6,.4),M.gold);bl.position.y=.8;const arm=new T.Group();arm.rotation.x=b*Math.PI/2;arm.add(bl);rot.add(arm);}props.push(rot);}
  const engine=new T.Group();engine.position.set(sx(.48),-DEPTH-1.1,0);ship.add(engine);
  core=new T.Mesh(new T.OctahedronGeometry(1.1,0),M.crystal);core.scale.y=1.5;engine.add(core);
  for(const [r,t] of [[1.8,.4],[2.4,-.3]]){const ring=new T.Mesh(new T.TorusGeometry(r,.1,6,32),M.gold);ring.rotation.x=Math.PI/2+t;engine.add(ring);rings.push(ring);}
  engine.add(new T.PointLight('#7fe2ff',1.6,26,1.8));
  for(const [s,h] of [[.42,17],[.7,14]]){const fg=new T.Mesh(new T.PlaneGeometry(2.4,.9,6,1),M.blue);fg.geometry.translate(1.2,0,0);fg.position.set(sx(s),h+.7,0);ship.add(fg);flags.push(fg);}
 }
 // Cabine do capitão (popa): porta para a proa, janelas que abrem, interior mobiliado.
 {const L=7.5,D=7.4,H=2.8,cx=sx(.12);
  const b=building({parent:ship,cu:cx,cv:0,y0:0,worldY:SDY,offU:SU,offV:SV,L,D,H,wallM:M.hull,floorM:M.deck,baseM:M.dark,name:'Cabine do capitão',
   openings:[{side:'u+',kind:'door',a:0,w:1.3,y0:0,y1:2.2,label:'porta da cabine'},
    {side:'v+',kind:'window',a:-1.6,w:1.1,y0:1,y1:1.9,label:'janela da cabine'},{side:'v+',kind:'window',a:1.6,w:1.1,y0:1,y1:1.9,label:'janela da cabine'},
    {side:'v-',kind:'window',a:0,w:1.1,y0:1,y1:1.9,label:'janela da cabine'},{side:'u-',kind:'window',a:0,w:1.6,y0:1,y1:1.9,label:'janela da popa'}]});
  const ig=new T.Group();
  table(ig,-1.2,0,0,1.8,1.2);{const mp=new T.Mesh(new T.PlaneGeometry(1.4,.9),M.map);mp.rotation.x=-Math.PI/2;mp.position.set(-1.2,.9,0);ig.add(mp);const cp=new T.Mesh(new T.CircleGeometry(.18,16),M.compass);cp.rotation.x=-Math.PI/2;cp.position.set(-.7,.91,.25);ig.add(cp);}
  chair(ig,-2.3,0,0,Math.PI/2);chair(ig,-.1,0,0,-Math.PI/2);
  box(ig,2.2,.45,1,M.dark,1.6,.3,-D/2+.75,0,1.5);box(ig,2.1,.2,.9,M.cloth,1.6,.62,-D/2+.75);box(ig,.6,.15,.7,M.cushion,2.4,.78,-D/2+.75);
  box(ig,1.1,.6,.6,M.door,1.6,.3,D/2-.6,0,1);{const lid=new T.Mesh(new T.CylinderGeometry(.3,.3,1.1,10,1,false,0,Math.PI),M.door);lid.rotation.z=Math.PI/2;lid.position.set(1.6,.6,D/2-.6);ig.add(lid);box(ig,.08,.62,.64,M.iron,1.3,.32,D/2-.6);box(ig,.08,.62,.64,M.iron,1.9,.32,D/2-.6);}
  shelf(ig,-L/2+.45,0,-2,1.8,2.2,Math.PI/2);box(ig,2.4,.02,1.6,M.rug,-.6,.11,0,0,2.4);
  box(ig,.04,.5,.04,M.iron,-1.2,H-.25,0);cyl(ig,.16,.12,.3,M.lamp,-1.2,H-.7,0,6);
  mergeInto(ig,b.bg,'Cabine · interior');
  {const q=(u,v)=>[SU+cx+u,SV+v];let p;
   p=q(-1.2,0);obs(p[0],p[1],.95,.65,SDY-1,SDY+2);p=q(1.6,-D/2+.75);obs(p[0],p[1],1.1,.5,SDY-1,SDY+2);p=q(1.6,D/2-.6);obs(p[0],p[1],.6,.35,SDY-1,SDY+2);p=q(-L/2+.45,-2);obs(p[0],p[1],.25,.9,SDY-1,SDY+3);}
  const up=new T.Group();box(up,L+.3,.25,D+.3,M.gold,0,H+.1,0);box(up,L,.2,D,M.deck,0,H+.3,0,0,2.5);
  for(const s of [-1,1]){box(up,L,.12,.14,M.light,0,H+1.3,s*(D/2-.1));for(let x=-L/2;x<=L/2;x+=1.2)box(up,.12,1,.12,M.dark,x,H+.8,s*(D/2-.1));}
  box(up,.14,.12,D,M.light,-L/2+.05,H+1.3,0);
  const wheel=new T.Mesh(new T.TorusGeometry(.7,.08,6,16),M.gold);wheel.position.set(1.5,H+1.3,0);wheel.rotation.y=Math.PI/2;up.add(wheel);box(up,.3,1,.3,M.dark,1.5,H+.8,0);
  for(let i=0;i<8;i++){const sp=box(up,.06,.06,1.6,M.gold,1.5,H+1.3,0);sp.rotation.x=i*Math.PI/8;}
  for(const s of [-1,1])sph(up,.28,M.lamp,-L/2-.3,H+.7,s*(D/2-.6));
  mergeInto(up,b.upper,'Cabine · tombadilho');
 }
 // Prancha de embarque.
 {const pg=new T.Group(),v0=PH-.1,v1=SV-wAt(.5)+.1,len=v1-v0,ang=Math.atan2(SDY-DY,len);
  const pl=box(pg,GW-.4,.14,Math.hypot(len,SDY-DY),M.deck,GU,(DY+SDY)/2-.05,(v0+v1)/2,0,1.5);pl.rotation.x=-ang;
  for(const s of [-1,1]){const r=box(pg,.06,.06,Math.hypot(len,SDY-DY),M.rope,GU+s*(GW/2-.2),(DY+SDY)/2+1,(v0+v1)/2);r.rotation.x=-ang;for(const vv of [v0,v1]){box(pg,.12,1.1,.12,M.dark,GU+s*(GW/2-.2),(vv===v0?DY:SDY)+.5,vv);sph(pg,.09,M.gold,GU+s*(GW/2-.2),(vv===v0?DY:SDY)+1.1,vv);}}
  mergeInto(pg,root,'Prancha de embarque');}

 // ---------- Chão, colisão e limite ----------
 const deckW=s=>wAt(s)-.45;
 const inShip=(u,v)=>{const s=(u-SU)/LEN+.5;return s>0&&s<1&&Math.abs(v-SV)<deckW(s);};
 const inPier=(u,v)=>(u>=PU0-.5&&u<=PU1&&Math.abs(v)<PH-.2)||(u>=PU1-14&&u<=PU1&&v>-PH-4.8&&v<PH-.2);
 const inPlank=(u,v)=>Math.abs(u-GU)<GW/2-.2&&v>=PH-.4&&v<=SV-wAt(.5)+.6;
 const inPlaza=(u,v)=>u>PL.u0-2&&u<E-.2&&Math.abs(v)<HW;
 if(window.arcanoGroundOverrides)window.arcanoGroundOverrides.push((x,z)=>{
  const q=P.uvOf(x,z);if(q.u<PL.u0-3)return null;
  if(q.u<R-6)return inPlaza(q.u,q.v)?Y+.1:null;
  if(inShip(q.u,q.v))return SDY+.02;
  if(inPlank(q.u,q.v)){const t=Math.max(0,Math.min(1,(q.v-(PH-.1))/(SV-wAt(.5)+.1-(PH-.1))));return DY+.02+(SDY-DY)*t;}
  if(inPier(q.u,q.v))return DY+.02;
  if(inPlaza(q.u,q.v))return Y+.1; // calçamento da praça (antes o pé afundava nas pedras)
  return null;
 });
 if(O){for(let i=0;i<40;i++){const s=(i+.5)/40;for(const side of [-1,1]){if(side<0&&Math.abs(s-.5)<GW/2/LEN+.01)continue;const u=SU+(s-.5)*LEN,v=SV+side*wAt(s);const w=W(u,v);O.addBox({x:w.x,z:w.z,hw:LEN/80+.05,hd:.2,rot:-P.angle,ymin:SDY-.6,ymax:SDY+3});}}
  for(const s of [.42,.7]){const w=W(SU+(s-.5)*LEN,SV);O.addCircle(w.x,w.z,.45,{ymin:SDY-.6,ymax:SDY+5});}
  for(const s of [-1,1]){const w=W(GU+s*(GW/2-.1),(PH+SV-wAt(.5))/2);O.addBox({x:w.x,z:w.z,hw:.1,hd:(SV-wAt(.5)-PH)/2+.2,rot:-P.angle,ymin:DY-.6,ymax:SDY+3});}}
 const baseClamp=window.arcanoIslandClamp;
 window.arcanoIslandClamp=(x,z)=>{const q=P.uvOf(x,z);if(q.u>R-20&&(inPlaza(q.u,q.v)||inPier(q.u,q.v)||inPlank(q.u,q.v)||inShip(q.u,q.v)))return [x,z];return baseClamp?baseClamp(x,z):[x,z];};

 // ---------- Interação (E / botão) e prédios por dentro ----------
 const css=document.createElement('style');
 css.textContent='#portInteract{position:fixed;left:50%;bottom:120px;transform:translateX(-50%);z-index:45;display:none;font:600 14px system-ui,Segoe UI,sans-serif;color:#fff8e6;background:rgba(32,24,16,.82);border:1px solid #e8c56a;border-radius:12px;padding:10px 16px;cursor:pointer;pointer-events:auto}';
 document.head.appendChild(css);
 const button=document.createElement('button');button.id='portInteract';button.type='button';document.body.appendChild(button);
 let nearest=null;const toggle=()=>{if(nearest)nearest.open=!nearest.open;};
 button.addEventListener('click',toggle);
 addEventListener('keydown',e=>{if(e.key&&e.key.toLowerCase()==='e'&&nearest)toggle();});
 const label=document.createElement('div');label.style.cssText='position:fixed;top:92px;left:50%;transform:translateX(-50%);z-index:45;display:none;font:600 15px Georgia,serif;color:#fff5dc;background:rgba(40,30,20,.78);border:1px solid #d8b45a;border-radius:10px;padding:6px 16px;pointer-events:none';document.body.appendChild(label);
 let saved=null,curIn=null,last=performance.now();const t0=performance.now();
 (function frame(now){requestAnimationFrame(frame);const dt=Math.min(.1,(now-last)/1000);last=now;const t=(now-t0)/1000;
  ship.position.y=SDY+Math.sin(t*.8)*.04;
  for(const w of wings)w.pivot.rotation.x=-.35+Math.sin(t*.9+w.ph)*.1;
  for(const p of props)p.rotation.x+=.18;core.rotation.y=t*.8;rings[0].rotation.z=t*.6;rings[1].rotation.z=-t*.45;
  for(const c of crystals)c.rotation.y=t*.7;for(let i=0;i<flags.length;i++)flags[i].rotation.y=Math.sin(t*2+i)*.25;
  for(const it of interact){const tg=it.open?1:0;it.anim+=(tg-it.anim)*Math.min(1,dt*6);it.apply(it.anim);}
  const pl=api.getGrassPlayer&&api.getGrassPlayer();nearest=null;
  if(pl){let best=2.2;for(const it of interact){const w=it.wp();const d=Math.hypot(w.x-pl.position.x,w.z-pl.position.z);if(d<best){best=d;nearest=it;}}}
  if(nearest){button.textContent=(matchMedia('(pointer:fine)').matches?'E — ':'')+(nearest.open?'Fechar ':'Abrir ')+nearest.label;button.style.display='block';}else button.style.display='none';
  // Dentro de um prédio: telhado some, paredes do lado da câmera somem, câmera por cima.
  let inside=null;
  if(pl){const q=P.uvOf(pl.position.x,pl.position.z);for(const b of buildings){if(b.inRect(q.u,q.v)&&pl.position.y>Y-2){inside=b;break;}}}
  if(inside!==curIn){
   if(curIn){curIn.upper.visible=true;for(const k in curIn.walls)curIn.walls[k].visible=true;}
   if(inside&&!curIn&&pl)saved={d:pl.camDistance,p:pl.camPitch};
   if(inside){pl.camDistance=Math.min(Math.max(pl.camDistance,5),6.5);pl.camPitch=Math.max(pl.camPitch,1.15);inside.upper.visible=false;label.textContent=inside.name;label.style.display='block';}
   else{label.style.display='none';if(saved&&pl){pl.camDistance=saved.d;pl.camPitch=saved.p;}saved=null;}
   curIn=inside;
  }
  if(inside&&inside.L){const cam=api.getMainCamera&&api.getMainCamera();if(cam){
   const q=P.uvOf(cam.position.x,cam.position.z),cu=q.u-inside.cuW(),cv=q.v-inside.cvW();
   const hy=(w,out)=>{if(!w)return;if(out>-1)w.visible=false;else if(out<-2.5)w.visible=true;};
   hy(inside.walls['v+'],cv-inside.D/2);hy(inside.walls['v-'],-inside.D/2-cv);hy(inside.walls['u+'],cu-inside.L/2);hy(inside.walls['u-'],-inside.L/2-cu);}}
 })(performance.now());
 setInterval(()=>{const s=window.arcanoAnimeSky&&window.arcanoAnimeSky.material.uniforms.uSunDir.value;const night=s?Math.min(1,Math.max(0,(-s.y+.02)/.2)):0;
  M.glass.emissiveIntensity=.15+night*1.2;M.lamp.emissiveIntensity=.45+night*2.2;lighthouse.beacon.intensity=1.2+night*2.5;},1000);
 return {root,ship,interact,buildings};
}

function install(){
 const api=window.arcanoWaterV1226,I=window.arcanoIsland;
 if(!api||!api.scene||!I||!I.portSite||I.portSite.y==null){setTimeout(install,400);return;}
 window.arcanoPort=build(api,I);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
