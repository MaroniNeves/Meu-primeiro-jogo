/* Porto dos Ventos — porto de navios voadores na borda leste da Ilha Central.
   - Praça portuária calçada no alto do penhasco (rosa-dos-ventos em mosaico,
     monumento com cristal de vento, armazém, capitania com relógio e
     bilheteria, guindaste, caixotes, barris, bancos, floreiras e lampiões).
   - Píer de madeira que avança sobre o céu, com treliças por baixo, corrimão,
     cabeços de amarração com cordas e um farol com cristal no fim.
   - Navio voador atracado: casco de tábuas, convés, castelo de popa com
     cabine, dois mastros com velas, velas-asa laterais, hélices na popa e
     motor de cristal brilhando embaixo. Dá para embarcar pela prancha.
   - Tudo fundido por material (poucas chamadas de desenho), com colisão. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
let seed=7311;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
function planks(hue,l,sat=40){return canvasTex(256,256,(g,w,h)=>{const n=8;for(let b=0;b<n;b++){const y0=b*h/n;g.fillStyle=`hsl(${hue+rnd()*6-3},${sat}%,${l+rnd()*8-4}%)`;g.fillRect(0,y0,w,h/n);
 for(let k=0;k<5;k++){const gy=y0+3+rnd()*(h/n-6);g.strokeStyle='rgba(40,20,8,.22)';g.lineWidth=1;g.beginPath();for(let x=0;x<=w;x+=6){const yy=gy+Math.sin(x*.04+k*2+b)*1.6;x?g.lineTo(x,yy):g.moveTo(x,yy);}g.stroke();}
 g.fillStyle='rgba(20,10,4,.7)';g.fillRect(0,y0,w,2);const jx=rnd()*w;g.fillRect(jx,y0,2,h/n);
 g.fillStyle='rgba(60,60,70,.8)';for(const x of [jx-6,jx+8]){g.beginPath();g.arc(x,y0+6,1.6,0,6.3);g.fill();g.beginPath();g.arc(x,y0+h/n-6,1.6,0,6.3);g.fill();}}});}
const TX={
 deck:planks(30,52),hull:planks(22,30,45),dark:planks(20,22,40),
 tiles:canvasTex(256,256,(g,w,h)=>{g.fillStyle='#8f877a';g.fillRect(0,0,w,h);for(let r=0;r<8;r++)for(let c=0;c<8;c++){const x=c*32+(r%2?16:0),y=r*32;g.fillStyle=`hsl(${32+rnd()*14},${10+rnd()*10}%,${66+rnd()*14}%)`;g.beginPath();g.roundRect?g.roundRect(x+2,y+2,28,28,4):g.rect(x+2,y+2,28,28);g.fill();g.fillStyle='rgba(255,255,255,.08)';g.fillRect(x+4,y+4,24,4);}}),
 stone:canvasTex(256,256,(g,w,h)=>{g.fillStyle='#77736c';g.fillRect(0,0,w,h);for(let r=0;r<8;r++){let x=-rnd()*30;const y=r*32;while(x<w){const bw=34+rnd()*40;g.fillStyle=`hsl(${34+rnd()*10},${8+rnd()*8}%,${60+rnd()*14}%)`;g.fillRect(x+2,y+2,bw-4,28);x+=bw;}}}),
 sail:canvasTex(256,256,(g,w,h)=>{g.fillStyle='#f3ead2';g.fillRect(0,0,w,h);g.strokeStyle='rgba(150,130,100,.25)';g.lineWidth=2;for(let x=0;x<w;x+=32){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}
  g.strokeStyle='#3d6fa8';g.lineWidth=10;g.beginPath();g.arc(w/2,h/2,62,0,6.3);g.stroke();g.fillStyle='#3d6fa8';
  for(let i=0;i<4;i++){g.save();g.translate(w/2,h/2);g.rotate(i*Math.PI/2+.3);g.beginPath();g.moveTo(0,-8);g.quadraticCurveTo(40,-50,10,-80);g.quadraticCurveTo(20,-40,-6,-6);g.fill();g.restore();}
  g.fillStyle='#d8b45a';g.beginPath();g.arc(w/2,h/2,12,0,6.3);g.fill();g.strokeStyle='#d8b45a';g.lineWidth=6;g.strokeRect(6,6,w-12,h-12);}),
 wing:canvasTex(128,128,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#5d9fd6');gr.addColorStop(1,'#bfe3ff');g.fillStyle=gr;g.fillRect(0,0,w,h);g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=2;for(let y=0;y<h;y+=16){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}}),
 sign:canvasTex(512,128,(g,w,h)=>{g.fillStyle='#2b3f5f';g.fillRect(0,0,w,h);g.strokeStyle='#d8b45a';g.lineWidth=8;g.strokeRect(8,8,w-16,h-16);g.fillStyle='#f5e6c0';g.font='bold 54px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillText('PORTO DOS VENTOS',w/2,h/2+4);}),
 compass:canvasTex(256,256,(g,w,h)=>{g.fillStyle='#d9cdb4';g.fillRect(0,0,w,h);g.translate(w/2,h/2);g.strokeStyle='#8a6a3a';g.lineWidth=5;g.beginPath();g.arc(0,0,118,0,6.3);g.stroke();g.lineWidth=2;g.beginPath();g.arc(0,0,96,0,6.3);g.stroke();
  for(let i=0;i<16;i++){g.save();g.rotate(i*Math.PI/8);const L=i%4===0?110:i%2===0?78:56;g.fillStyle=i%4===0?'#2f5a8f':i%2===0?'#4f8fbf':'#c79a52';g.beginPath();g.moveTo(0,-L);g.lineTo(10,0);g.lineTo(0,10);g.lineTo(-10,0);g.closePath();g.fill();g.restore();}
  g.fillStyle='#d8b45a';g.beginPath();g.arc(0,0,14,0,6.3);g.fill();})
};
TX.compass.wrapS=TX.compass.wrapT=T.ClampToEdgeWrapping;TX.sign.wrapS=TX.sign.wrapT=T.ClampToEdgeWrapping;
const mat=o=>new T.MeshStandardMaterial(Object.assign({roughness:1,metalness:0},o));
const M={
 deck:mat({color:'#ffffff',map:TX.deck}),hull:mat({color:'#ffffff',map:TX.hull}),dark:mat({color:'#ffffff',map:TX.dark}),
 tiles:mat({color:'#ffffff',map:TX.tiles}),stone:mat({color:'#ffffff',map:TX.stone}),
 sail:mat({color:'#ffffff',map:TX.sail,side:T.DoubleSide}),wing:mat({color:'#ffffff',map:TX.wing,side:T.DoubleSide,transparent:true,opacity:.82}),
 sign:mat({color:'#ffffff',map:TX.sign}),compass:mat({color:'#ffffff',map:TX.compass}),
 gold:mat({color:'#d8b45a',roughness:.4,metalness:.4}),iron:mat({color:'#34363d',roughness:.6,metalness:.3}),copper:mat({color:'#5d9a8a'}),
 roofRed:mat({color:'#b5483c'}),roofBlue:mat({color:'#3d5f8f'}),plaster:mat({color:'#efe6d2'}),rope:mat({color:'#b89a6a'}),
 red:mat({color:'#a83a32',side:T.DoubleSide}),blue:mat({color:'#3d6fa8',side:T.DoubleSide}),leaf:mat({color:'#4f8f45'}),
 flower:[mat({color:'#ff7aa8'}),mat({color:'#ffd35a'}),mat({color:'#a98bff'})],
 glass:mat({color:'#ffe6b0',emissive:new T.Color('#ffb85a'),emissiveIntensity:.4}),
 lamp:mat({color:'#fff1c8',emissive:new T.Color('#ffc566'),emissiveIntensity:.5}),
 crystal:mat({color:'#e8fbff',emissive:new T.Color('#5fd2ff'),emissiveIntensity:2.2,roughness:.2,transparent:true,opacity:.92})
};

function boxUV(geo,w,h,d,tile){const uv=geo.attributes.uv,F=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];for(let f=0;f<6;f++)for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,uv.getX(i)*F[f][0]/tile,uv.getY(i)*F[f][1]/tile);}return geo;}
function box(g,w,h,d,m,x,y,z,ry=0,tile=2.5){const mm=new T.Mesh(boxUV(new T.BoxGeometry(w,h,d),w,h,d,tile),m);mm.position.set(x,y,z);mm.rotation.y=ry;g.add(mm);return mm;}
function cyl(g,r1,r2,h,m,x,y,z,seg=12,tile=2.5){const geo=new T.CylinderGeometry(r1,r2,h,seg),uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*2*Math.PI*Math.max(r1,r2)/tile,uv.getY(i)*h/tile);const mm=new T.Mesh(geo,m);mm.position.set(x,y+h/2,z);g.add(mm);return mm;}
function mergeInto(group,parent,name,shadow=true){
 group.updateMatrixWorld(true);const buckets=new Map();
 group.traverse(o=>{if(!o.isMesh)return;let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(!buckets.has(o.material))buckets.set(o.material,[]);buckets.get(o.material).push(g);});
 for(const [m,list] of buckets){let n=0;for(const g of list)n+=g.attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2);let off=0;
  for(const g of list){P.set(g.attributes.position.array,off*3);if(g.attributes.normal)N.set(g.attributes.normal.array,off*3);U.set(g.attributes.uv.array.subarray(0,g.attributes.position.count*2),off*2);off+=g.attributes.position.count;g.dispose();}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(P,3));geo.setAttribute('normal',new T.BufferAttribute(N,3));geo.setAttribute('uv',new T.BufferAttribute(U,2));geo.computeBoundingSphere();
  const mesh=new T.Mesh(geo,m);mesh.name=name;mesh.castShadow=shadow&&m!==M.glass&&m!==M.lamp&&m!==M.crystal&&m!==M.wing;mesh.receiveShadow=true;parent.add(mesh);}
}

function build(api,isl){
 const P=isl.portSite,C=isl.center,R=isl.radius,Y=P.y,PL=P.plaza,E=R+1,O=window.arcanoObstacles,scene=api.scene;
 // Grupo no referencial do porto: x = para fora da ilha (u), z = de lado (v).
 const root=new T.Group();root.name='Porto dos Ventos';root.position.set(C.x,0,C.z);root.rotation.y=-P.angle;scene.add(root);
 const W=(u,v)=>P.at(u,v);
 const obs=(u,v,hu,hv,ymin=Y-1,ymax=Y+5)=>{if(!O)return;const w=W(u,v);O.addBox({x:w.x,z:w.z,hw:hu,hd:hv,rot:-P.angle,ymin,ymax});};
 const obsC=(u,v,r)=>{if(!O)return;const w=W(u,v);O.addCircle(w.x,w.z,r,{ymin:Y-1,ymax:Y+8});};
 const g=new T.Group();
 const U0=PL.u0,HW=PL.hw;
 // ---------- Praça ----------
 box(g,E-U0,.12,HW*2,M.tiles,(U0+E)/2,Y+.02,0,0,3);
 {const c=new T.Mesh(new T.CircleGeometry(6.5,48),M.compass);c.rotation.x=-Math.PI/2;c.position.set(R-30,Y+.1,0);g.add(c);
  const ring=new T.Mesh(new T.TorusGeometry(6.6,.18,6,48),M.stone);ring.rotation.x=Math.PI/2;ring.position.set(R-30,Y+.1,0);g.add(ring);}
 // Muretas laterais (aberturas perto da entrada) e balaustrada na beira do penhasco.
 for(const s of [-1,1]){
  box(g,E-(U0+8),.7,.6,M.stone,(U0+8+E)/2,Y+.35,s*HW,0,2);box(g,E-(U0+8)+.2,.12,.8,M.tiles,(U0+8+E)/2,Y+.76,s*HW,0,2);obs((U0+8+E)/2,s*HW,(E-(U0+8))/2,.35);
  for(let u=U0+10;u<E-2;u+=10){cyl(g,.1,.12,3.4,M.iron,u,Y,s*(HW-.6),8);box(g,.45,.55,.45,M.lamp,u,Y+3.55,s*(HW-.6));box(g,.6,.1,.6,M.iron,u,Y+3.88,s*(HW-.6));obsC(u,s*(HW-.6),.2);}
 }
 for(const [v0,v1] of [[-HW,-5.2],[5.2,HW]]){const vc=(v0+v1)/2,len=v1-v0;
  box(g,.5,.3,len,M.stone,E-.3,Y+.15,vc,0,2);for(let v=v0+.4;v<v1;v+=.6)cyl(g,.09,.12,.7,M.stone,E-.3,Y+.3,v,8);box(g,.6,.16,len,M.tiles,E-.3,Y+1.08,vc,0,2);obs(E-.3,vc,.3,len/2);}
 // Portal de entrada com a placa.
 for(const s of [-1,1]){box(g,1.4,5.2,1.4,M.stone,U0+1,Y+2.6,s*5,0,2);box(g,1.7,.4,1.7,M.tiles,U0+1,Y+5.4,s*5,0,2);obs(U0+1,s*5,.7,.7);}
 box(g,.6,1.4,11.4,M.dark,U0+1,Y+5.9,0,0,2);{const sg=new T.Mesh(new T.PlaneGeometry(9,2.2),M.sign);sg.position.set(U0+.68,Y+5.9,0);sg.rotation.y=-Math.PI/2;g.add(sg);}
 for(const s of [-1,1]){box(g,.06,3.2,1.4,s>0?M.blue:M.red,U0+.6,Y+3.4,s*3.6);}
 // Monumento do cristal de vento no centro da rosa-dos-ventos.
 cyl(g,1.4,1.7,.6,M.stone,R-30,Y,0,16);cyl(g,.7,.9,2.2,M.tiles,R-30,Y+.6,0,12);cyl(g,1.0,.8,.25,M.gold,R-30,Y+2.8,0,16);obsC(R-30,0,1.8);
 // Armazém (lado -v): pedra embaixo, madeira em cima, telhado vermelho, portões.
 {const u0=R-48,u1=R-26,v=-15.5,uc=(u0+u1)/2,L=u1-u0,D=9;
  box(g,L,3.2,D,M.stone,uc,Y+1.6,v,0,3);box(g,L,2.6,D,M.dark,uc,Y+4.5,v,0,3);
  for(const s of [-1,1]){const b=box(g,L+1.2,.25,D/2/Math.cos(.5)+.8,M.roofRed,uc,Y+6.9,v+s*D/4.2,0,2);b.rotation.x=s*.5;}
  box(g,L+1.3,.3,.4,M.dark,uc,Y+7.95,v);
  for(const du of [-5,5]){box(g,3.4,3.4,.2,M.deck,uc+du,Y+1.8,v+D/2+.05,0,1.5);box(g,3.8,.3,.3,M.iron,uc+du,Y+3.6,v+D/2+.1);for(const k of [-1,1])box(g,.15,3.4,.25,M.iron,uc+du+k*1.6,Y+1.8,v+D/2+.12);}
  for(let du=-9;du<=9;du+=4.5){box(g,1.2,1.2,.12,M.glass,uc+du,Y+4.6,v+D/2+.06);}
  obs(uc,v,L/2+.1,D/2+.1,Y-1,Y+9);
  // Caixotes e barris na frente.
  for(let i=0;i<9;i++){const cu=uc-9+rnd()*18,cv=v+D/2+1.3+rnd()*2,sz=.8+rnd()*.5,st=rnd()<.35?2:1;for(let k=0;k<st;k++){box(g,sz,sz,sz,M.deck,cu,Y+sz/2+k*sz,cv,rnd()*.3,1);}obs(cu,cv,sz/2+.05,sz/2+.05);}
  for(let i=0;i<6;i++){const bu=uc-10+i*1.1,bv=v+D/2+.7;cyl(g,.4,.36,1.05,M.hull,bu,Y,bv,12);for(const hh of [.2,.8])cyl(g,.42,.42,.07,M.iron,bu,Y+hh,bv,12);}obs(uc-7.25,v+D/2+.7,3.2,.45);}
 // Capitania (lado +v): dois andares, torre com relógio e cata-vento, bilheteria.
 {const uc=R-36,v=15,L=11,D=8;
  box(g,L,3.4,D,M.stone,uc,Y+1.7,v,0,3);box(g,L,3,D,M.plaster,uc,Y+4.9,v,0,3);box(g,L+.4,.3,D+.4,M.dark,uc,Y+3.45,v);
  for(const s of [-1,1]){const b=box(g,L+1,.25,D/2/Math.cos(.55)+.7,M.roofBlue,uc,Y+7.3,v+s*D/4.4,0,2);b.rotation.x=s*.55;}
  box(g,L+1.1,.3,.4,M.dark,uc,Y+8.5,v);
  box(g,3,6,3,M.plaster,uc+L/2-1.5,Y+9,v,0,2);{const cl=new T.Mesh(new T.CircleGeometry(1,24),M.compass);cl.position.set(uc+L/2-1.5,Y+10.4,v-1.52);cl.rotation.y=Math.PI;g.add(cl);}
  {const c=new T.Mesh(new T.ConeGeometry(2.3,2.6,4),M.roofBlue);c.rotation.y=Math.PI/4;c.position.set(uc+L/2-1.5,Y+13.3,v);g.add(c);}
  box(g,.08,1.8,.08,M.gold,uc+L/2-1.5,Y+15.4,v);box(g,1.2,.06,.06,M.gold,uc+L/2-1.5,Y+15.9,v);
  box(g,1.6,2.4,.15,M.deck,uc-2,Y+1.2,v-D/2-.05,0,1.5);
  box(g,2.6,1.3,.15,M.glass,uc+2.2,Y+1.8,v-D/2-.05);box(g,3.2,.25,.9,M.dark,uc+2.2,Y+1.05,v-D/2-.45);box(g,3.4,.2,1.4,M.red,uc+2.2,Y+2.95,v-D/2-.6);
  for(const du of [-3.5,0,3.5])box(g,1.2,1.3,.12,M.glass,uc+du,Y+5,v-D/2-.06);
  obs(uc,v,L/2+.1,D/2+.1,Y-1,Y+16);}
 // Guindaste de madeira na entrada do píer.
 {const cu=E-3.5,cv=-8;cyl(g,.35,.45,7,M.dark,cu,Y,cv,10);box(g,.5,.5,9,M.dark,cu+2.8,Y+6.6,cv+3.2,0,2).rotation.set(0,Math.PI/2.6,0);box(g,1.6,1.2,1.6,M.deck,cu,Y+.6,cv);
  box(g,.04,3.4,.04,M.rope,cu+5.6,Y+4.9,cv+6.2);box(g,1.2,1,1.2,M.deck,cu+5.6,Y+2.8,cv+6.2,0,1);obsC(cu,cv,.9);}
 // Bancos e floreiras.
 for(const [u,v] of [[R-20,-8],[R-20,8],[R-42,-6],[R-42,6]]){box(g,2,.12,.55,M.deck,u,Y+.5,v,0,2);box(g,2,.6,.1,M.deck,u,Y+.85,v+Math.sign(v)*.25,0,2);for(const k of [-.8,.8])box(g,.12,.45,.5,M.iron,u+k,Y+.23,v);obs(u,v,1,.35);}
 for(const [u,v] of [[R-52,-9],[R-52,9],[R-12,-12],[R-12,12]]){box(g,2.4,.6,1.2,M.stone,u,Y+.3,v,0,2);for(let i=0;i<10;i++){const f=new T.Mesh(new T.IcosahedronGeometry(.16,0),M.flower[i%3]);f.position.set(u+(rnd()-.5)*2,Y+.72,v+(rnd()-.5)*.9);g.add(f);}obs(u,v,1.2,.6);}
 // ---------- Píer sobre o céu ----------
 const PU0=E-1.2,PU1=E+48,PH=5,DY=Y+.08;
 box(g,PU1-PU0,.25,PH*2,M.deck,(PU0+PU1)/2,DY-.12,0,0,2.5);
 box(g,14,.25,PH*2+5,M.deck,PU1-7,DY-.12,-2.5,0,2.5); // plataforma do farol (mais larga para -v)
 for(let u=PU0+1;u<PU1;u+=4){for(const s of [-1,1]){box(g,.35,.5,.35,M.dark,u,DY-.45,s*(PH-.3));const b=box(g,.3,7,.3,M.dark,u-2.2,DY-3.4,s*(PH-.3));b.rotation.z=-.62;}box(g,.3,.4,PH*2,M.dark,u,DY-.42,0);}
 for(const s of [-1,1])box(g,PU1-PU0,.35,.35,M.dark,(PU0+PU1)/2,DY-.65,s*(PH-.3));
 // Corrimão (abertura da prancha no lado +v, em u = E+24).
 const GU=E+24,GW=2.6;
 const rail=(u0,u1,v)=>{const L=u1-u0;if(L<=.2)return;box(g,L,.12,.16,M.deck,(u0+u1)/2,DY+1.05,v,0,2);box(g,L,.08,.1,M.dark,(u0+u1)/2,DY+.55,v,0,2);for(let u=u0;u<=u1+.01;u+=2)box(g,.16,1.1,.16,M.dark,u,DY+.5,v);obs((u0+u1)/2,v,L/2,.2,DY-.6,DY+3);};
 rail(PU0+.6,PU1-14,-PH+.1);rail(PU0+.6,GU-GW/2,PH-.1);rail(GU+GW/2,PU1-14,PH-.1);
 rail(PU1-14,PU1,PH-.1);rail(PU1-14,PU1,-PH-4.9);{box(g,.16,1.1,PH*2+5,M.dark,PU1,DY+.5,-2.5);box(g,.2,.12,PH*2+5,M.deck,PU1,DY+1.05,-2.5);obs(PU1,-2.5,.2,PH+2.5,DY-.6,DY+3);}
 {box(g,.16,1.1,4.8,M.dark,PU1-14,DY+.5,-PH-2.5);obs(PU1-14,-PH-2.5,.2,2.4,DY-.6,DY+3);}
 // Lampiões, cabeços de amarração e cordas.
 for(let u=PU0+4;u<PU1-14;u+=8)for(const s of [-1,1]){if(s>0&&Math.abs(u-GU)<3)continue;cyl(g,.08,.1,2.8,M.iron,u,DY,s*(PH-.1),8);box(g,.42,.5,.42,M.lamp,u,DY+3,s*(PH-.1));box(g,.55,.1,.55,M.iron,u,DY+3.3,s*(PH-.1));}
 for(const u of [GU-6,GU+6]){cyl(g,.28,.34,.8,M.iron,u,DY,PH-.8,10);cyl(g,.4,.4,.12,M.iron,u,DY+.8,PH-.8,10);obsC(...[u,PH-.8],.4);}
 // Farol no fim do píer.
 {const fu=PU1-6,fv=-6.5;cyl(g,2.3,2.6,1,M.stone,fu,DY,fv,16);cyl(g,1.8,2.2,10,M.stone,fu,DY+1,fv,16);for(const hh of [3.5,7])cyl(g,2.05,2.05,.3,M.gold,fu,DY+hh,fv,16);
  cyl(g,2.4,2.4,.4,M.dark,fu,DY+11,fv,16);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;box(g,.14,2.2,.14,M.iron,fu+Math.cos(a)*1.4,DY+12.5,fv+Math.sin(a)*1.4);}
  const roof=new T.Mesh(new T.ConeGeometry(2.2,2.4,16),M.copper);roof.position.set(fu,DY+14.8,fv);g.add(roof);box(g,.12,1.2,.12,M.gold,fu,DY+16.4,fv);
  box(g,1.2,2,.15,M.deck,fu-2.35,DY+2,fv,Math.PI/2);obsC(fu,fv,2.5);}
 mergeInto(g,root,'Porto dos Ventos · estrutura');
 // Cristais que giram: monumento e farol.
 const crystals=[];
 const mkCrystal=(u,y,v,s)=>{const c=new T.Mesh(new T.OctahedronGeometry(s,0),M.crystal);c.position.set(u,y,v);root.add(c);crystals.push(c);return c;};
 mkCrystal(R-30,Y+4.2,0,.8);mkCrystal(PU1-6,DY+12.6,-6.5,.9);
 const beacon=new T.PointLight('#8fe0ff',1.2,40,1.6);beacon.position.set(PU1-6,DY+12.6,-6.5);root.add(beacon);

 // ---------- Navio voador ----------
 const ship=new T.Group();ship.name='Navio voador';root.add(ship);
 const SU=GU,SV=PH+3.2+5,LEN=36,BW=5,DEPTH=4.4,SDY=DY+.55;
 ship.position.set(SU,SDY,SV);
 const wAt=s=>BW*(s<.12?.72+.28*Math.sin(s/.12*Math.PI/2):s>.62?Math.pow(Math.cos((s-.62)/.38*Math.PI/2),.75):1);
 const dAt=s=>DEPTH*(.75+.25*Math.sin(Math.PI*Math.min(1,s*1.1)));
 const sx=s=>(s-.5)*LEN; // ao longo do navio (x local = u)
 {// Casco: seções transversais em meia-elipse, tábuas na horizontal.
  const NS=48,NK=14,pos=[],uv=[],ix=[];
  for(let i=0;i<=NS;i++){const s=i/NS,w=Math.max(.05,wAt(s)),d=dAt(s);
   for(let k=0;k<=NK;k++){const f=k/NK*Math.PI,lat=w*Math.cos(f),y=-d*Math.pow(Math.sin(f),.85);pos.push(sx(s),y,lat);uv.push(s*LEN/3,f/Math.PI*3);}}
  for(let i=0;i<NS;i++)for(let k=0;k<NK;k++){const a=i*(NK+1)+k,b=a+1,c=a+NK+1,d=c+1;ix.push(a,b,c,b,d,c);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();
  const hull=new T.Mesh(geo,M.hull);hull.material.side=T.DoubleSide;
  const sg=new T.Group();sg.add(hull);
  // Convés (contorno do casco).
  const sh=new T.Shape();for(let i=0;i<=40;i++){const s=i/40;sh[i?'lineTo':'moveTo'](sx(s),wAt(s));}for(let i=40;i>=0;i--){const s=i/40;sh.lineTo(sx(s),-wAt(s));}
  const dg=new T.ExtrudeGeometry(sh,{depth:.2,bevelEnabled:false});dg.rotateX(Math.PI/2);const duv=dg.attributes.uv;for(let i=0;i<duv.count;i++)duv.setXY(i,duv.getX(i)/2.5,duv.getY(i)/2.5);
  const deck=new T.Mesh(dg,M.deck);deck.position.y=.0;sg.add(deck);
  // Frisos dourados e amurada.
  for(let i=0;i<40;i++){const s0=i/40,s1=(i+1)/40;for(const side of [-1,1]){const x0=sx(s0),x1=sx(s1),z0=side*wAt(s0),z1=side*wAt(s1),L=Math.hypot(x1-x0,z1-z0),ang=Math.atan2(z1-z0,x1-x0);
   const mid=[(x0+x1)/2,(z0+z1)/2];const bb=box(sg,L+.05,.18,.16,M.gold,mid[0],-.25,mid[1]);bb.rotation.y=-ang;
   const gapHere=side<0&&Math.abs((s0+s1)/2-.5)<GW/2/LEN+.01;
   if(!gapHere){const r=box(sg,L+.05,.12,.14,M.dark,mid[0],1.05,mid[1]);r.rotation.y=-ang;if(i%2===0){const p=box(sg,.14,1.05,.14,M.dark,x0,.52,z0);}}}}
  // Gurupés e figura de proa (pássaro estilizado).
  {const bs=box(sg,7,.3,.3,M.dark,sx(1)+2.6,1.2,0);bs.rotation.z=.25;const head=new T.Mesh(new T.ConeGeometry(.5,1.6,8),M.gold);head.rotation.z=-Math.PI/2;head.position.set(sx(1)+.4,-.4,0);sg.add(head);
   for(const s of [-1,1]){const wg=box(sg,1.6,.08,1,M.gold,sx(1)-.4,-.2,s*.7);wg.rotation.set(s*.5,0,.3);}}
  // Castelo de popa: cabine com janelas, porta, teto com amurada e timão.
  {const cu=sx(.12),L=7.5,D=7.4;box(sg,L,2.8,D,M.dark,cu,1.4,0,0,2);box(sg,L+.3,.25,D+.3,M.gold,cu,2.9,0);
   for(const dz of [-2.2,0,2.2])box(sg,.12,1,1.2,M.glass,cu+L/2+.02,1.6,dz);for(const s of [-1,1])for(const du of [-2,0,2])box(sg,1,.9,.1,M.glass,cu+du,1.7,s*(D/2+.02));
   box(sg,.15,2,1.3,M.deck,cu+L/2+.04,1.05,1.6,0,1.5);
   box(sg,L,.2,D,M.deck,cu,3.05,0,0,2.5);for(const s of [-1,1]){box(sg,L,.12,.14,M.dark,cu,4.1,s*(D/2-.1));}box(sg,.14,.12,D,M.dark,cu-L/2+.05,4.1,0);
   const wheel=new T.Mesh(new T.TorusGeometry(.7,.08,6,16),M.gold);wheel.position.set(cu+1.5,4.1,0);wheel.rotation.y=Math.PI/2;sg.add(wheel);box(sg,.3,1,.3,M.dark,cu+1.5,3.6,0);
   for(const s of [-1,1]){const l=new T.Mesh(new T.SphereGeometry(.28,10,8),M.lamp);l.position.set(cu-L/2-.3,3.4,s*(D/2-.6));sg.add(l);}}
  // Mastros, vergas e velas (velas são superfícies curvas).
  const sails=[];
  for(const [s,h] of [[.42,17],[.7,14]]){const mu=sx(s);cyl(sg,.32,.4,h,M.dark,mu,0,0,10);box(sg,.6,.6,.6,M.gold,mu,h,0);
   for(const [yy,span,sh_] of [[h*.42,8.2,h*.3],[h*.78,6.4,h*.2]]){const yd=box(sg,.25,.25,span,M.dark,mu+.2,yy+sh_/2,0);
    const pg=new T.PlaneGeometry(span-.6,sh_,10,6),pp=pg.attributes.position;for(let i=0;i<pp.count;i++){const z=pp.getX(i),y=pp.getY(i);pp.setZ(i,.9*Math.cos(z/(span)*Math.PI)*(.6+.4*Math.cos(y/sh_*Math.PI)));}pg.computeVertexNormals();
    const sail=new T.Mesh(pg,M.sail);sail.rotation.y=Math.PI/2;sail.position.set(mu+.5,yy,0);sg.add(sail);}}
  mergeInto(sg,ship,'Navio voador · casco');
  // Velas-asa laterais (batem devagar), hélices e motor de cristal.
  const wings=[];
  for(const side of [-1,1])for(const [s,size] of [[.5,1.45],[.3,1.05]]){
   const sh2=new T.Shape();sh2.moveTo(0,0);sh2.lineTo(7*size,1.2*size);sh2.quadraticCurveTo(8.5*size,-1*size,6*size,-3.2*size);sh2.quadraticCurveTo(3*size,-2.4*size,0,-1.2*size);sh2.lineTo(0,0);
   const wg=new T.Mesh(new T.ShapeGeometry(sh2),M.wing);const pivot=new T.Group();pivot.position.set(sx(s),.6,side*wAt(s));pivot.add(wg);if(side<0){wg.rotation.x=0;wg.position.z=-.08;}else wg.rotation.x=-Math.PI/2;
   for(let r=0;r<4;r++){const rib=new T.Mesh(new T.CylinderGeometry(.05,.05,7*size,5),M.gold);rib.rotation.z=Math.PI/2-(r*.35);rib.position.set(3.5*size*Math.cos(r*.35),-1.6*size*r/3*0,0);}
   ship.add(pivot);wings.push({pivot,side,ph:s*7});}
  const props=[];
  for(const side of [-1,1]){const hub=new T.Group();hub.position.set(sx(0)-.6,-.8,side*2.4);ship.add(hub);
   const shaft=new T.Mesh(new T.CylinderGeometry(.12,.12,1.4,8),M.iron);shaft.rotation.z=Math.PI/2;shaft.position.x=.6;hub.add(shaft);
   const rot=new T.Group();rot.position.x=-.1;hub.add(rot);for(let b=0;b<4;b++){const bl=new T.Mesh(new T.BoxGeometry(.12,1.6,.4),M.gold);bl.position.y=.8;const arm=new T.Group();arm.rotation.x=b*Math.PI/2;arm.add(bl);rot.add(arm);}props.push(rot);}
  const engine=new T.Group();engine.position.set(sx(.48),-DEPTH-1.1,0);ship.add(engine);
  const core=new T.Mesh(new T.OctahedronGeometry(1.1,0),M.crystal);core.scale.y=1.5;engine.add(core);
  const rings=[];for(const [r,t] of [[1.8,.4],[2.4,-.3]]){const ring=new T.Mesh(new T.TorusGeometry(r,.1,6,32),M.gold);ring.rotation.x=Math.PI/2+t;engine.add(ring);rings.push(ring);}
  const cl=new T.PointLight('#7fe2ff',1.6,26,1.8);engine.add(cl);
  // Bandeirolas no alto dos mastros.
  const flags=[];for(const [s,h] of [[.42,17],[.7,14]]){const fg=new T.Mesh(new T.PlaneGeometry(2.4,.9,6,1),M.blue);fg.geometry.translate(1.2,0,0);fg.position.set(sx(s),h+.7,0);ship.add(fg);flags.push(fg);}
  // Lanternas penduradas na amurada.
  for(const s of [.3,.55,.8])for(const side of [-1,1]){const l=new T.Mesh(new T.SphereGeometry(.22,10,8),M.lamp);l.position.set(sx(s),.7,side*(wAt(s)+.25));ship.add(l);}
  // Animação: o navio flutua de leve, asas batem, hélices e cristais giram.
  const t0=performance.now();
  (function anim(){requestAnimationFrame(anim);const t=(performance.now()-t0)/1000;
   ship.position.y=SDY+Math.sin(t*.8)*.05;ship.rotation.x=Math.sin(t*.6)*.006;
   for(const w of wings)if(w.side>0)w.pivot.rotation.x=-.35+Math.sin(t*.9+w.ph)*.1;
   for(const p of props)p.rotation.x+=.18;core.rotation.y=t*.8;rings[0].rotation.z=t*.6;rings[1].rotation.z=-t*.45;
   for(const c of crystals){c.rotation.y=t*.7;c.position.y+=Math.sin(t*1.4)*.004;}
   for(let i=0;i<flags.length;i++)flags[i].rotation.y=Math.sin(t*2+i)*.25;
  })();
 }
 // Prancha de embarque (do píer ao convés) com cordas.
 {const pg=new T.Group(),v0=PH-.1,v1=SV-wAt(.5)+.1,len=v1-v0,ang=Math.atan2(SDY-DY,len);
  const pl=box(pg,GW-.4,.14,Math.hypot(len,SDY-DY),M.deck,GU,(DY+SDY)/2-.05,(v0+v1)/2,0,1.5);pl.rotation.x=-ang;
  for(const s of [-1,1]){const r=box(pg,.06,.06,Math.hypot(len,SDY-DY),M.rope,GU+s*(GW/2-.2),(DY+SDY)/2+1,(v0+v1)/2);r.rotation.x=-ang;for(const vv of [v0,v1])box(pg,.1,1.1,.1,M.dark,GU+s*(GW/2-.2),(vv===v0?DY:SDY)+.5,vv);}
  mergeInto(pg,root,'Prancha de embarque');}

 // ---------- Chão, colisão e limite ----------
 const deckW=s=>wAt(s)-.45;
 const inShip=(u,v)=>{const s=(u-SU)/LEN+.5;return s>0&&s<1&&Math.abs(v-SV)<deckW(s);};
 const inPier=(u,v)=>(u>=PU0-.5&&u<=PU1&&Math.abs(v)<PH-.2)||(u>=PU1-14&&u<=PU1&&v>-PH-4.8&&v<PH-.2);
 const inPlank=(u,v)=>Math.abs(u-GU)<GW/2-.2&&v>=PH-.4&&v<=SV-wAt(.5)+.6;
 const inPlaza=(u,v)=>u>PL.u0-2&&u<E-.2&&Math.abs(v)<HW;
 if(window.arcanoGroundOverrides)window.arcanoGroundOverrides.push((x,z)=>{
  const q=P.uvOf(x,z);if(q.u<R-6)return null;
  if(inShip(q.u,q.v))return SDY+.02;
  if(inPlank(q.u,q.v)){const t=Math.max(0,Math.min(1,(q.v-(PH-.1))/(SV-wAt(.5)+.1-(PH-.1))));return DY+.02+(SDY+.02-DY-.02)*t;}
  if(inPier(q.u,q.v))return DY+.02;
  return null;
 });
 // Amurada do navio (com abertura da prancha), cabine e mastros bloqueiam.
 if(O){for(let i=0;i<40;i++){const s=(i+.5)/40;for(const side of [-1,1]){if(side<0&&Math.abs(s-.5)<GW/2/LEN+.01)continue;const u=SU+(s-.5)*LEN,v=SV+side*wAt(s);const w=W(u,v);O.addBox({x:w.x,z:w.z,hw:LEN/80+.05,hd:.2,rot:-P.angle,ymin:SDY-.6,ymax:SDY+3});}}
  {const w=W(SU+(.12-.5)*LEN,SV);O.addBox({x:w.x,z:w.z,hw:3.75,hd:3.7,rot:-P.angle,ymin:SDY-.6,ymax:SDY+3});}
  for(const s of [.42,.7]){const w=W(SU+(s-.5)*LEN,SV);O.addCircle(w.x,w.z,.45,{ymin:SDY-.6,ymax:SDY+5});}
  // Lado da prancha: cordas.
  for(const s of [-1,1]){const w=W(GU+s*(GW/2-.1),(PH+SV-wAt(.5))/2);O.addBox({x:w.x,z:w.z,hw:.1,hd:(SV-wAt(.5)-PH)/2+.2,rot:-P.angle,ymin:DY-.6,ymax:SDY+3});}}
 // O limite da ilha deixa andar na praça, no píer, na prancha e no navio.
 const baseClamp=window.arcanoIslandClamp;
 window.arcanoIslandClamp=(x,z)=>{const q=P.uvOf(x,z);if(q.u>R-20&&(inPlaza(q.u,q.v)||inPier(q.u,q.v)||inPlank(q.u,q.v)||inShip(q.u,q.v)))return [x,z];return baseClamp?baseClamp(x,z):[x,z];};
 setInterval(()=>{const s=window.arcanoAnimeSky&&window.arcanoAnimeSky.material.uniforms.uSunDir.value;const night=s?Math.min(1,Math.max(0,(-s.y+.02)/.2)):0;
  M.glass.emissiveIntensity=.35+night*1.6;M.lamp.emissiveIntensity=.45+night*2.2;beacon.intensity=1.2+night*2.5;},1000);
 return {root,ship};
}

function install(){
 const api=window.arcanoWaterV1226,I=window.arcanoIsland;
 if(!api||!api.scene||!I||!I.portSite||I.portSite.y==null){setTimeout(install,400);return;}
 window.arcanoPort=build(api,I);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
