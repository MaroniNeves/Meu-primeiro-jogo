/* Vila da Montanha da Nascente — casas no estilo anime sobre os terraços que a
   ilha (ilha-central.js) já escavou na encosta, ligadas pela rua em espiral.
   - 5 estilos: enxaimel (madeira e reboco), sobrado (pedra + varanda),
     pagode (colunas vermelhas, telhado de duas abas curvas), torre redonda e
     chalé de toras. Cores de telhado variam de casa para casa.
   - Cada casa tem alicerce de pedra que desce até o chão mais baixo embaixo
     dela (nunca flutua), porta virada para a rua, janelas que acendem à noite.
   - Escadas de pedra da rua até as casas do lado de cima, postes de luz ao
     longo da rua e um mirante (pavilhão) no alto da montanha.
   - Tudo fundido por material: poucas chamadas de desenho. Casas bloqueiam. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
let seed=9081;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
const plaster=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#f3ead8';g.fillRect(0,0,w,h);for(let i=0;i<400;i++){g.fillStyle=`rgba(${180+rnd()*40},${160+rnd()*40},${130+rnd()*30},.12)`;g.fillRect(rnd()*w,rnd()*h,3+rnd()*6,2+rnd()*4);}});
const stoneT=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#8c8780';g.fillRect(0,0,w,h);for(let r=0;r<8;r++){let x=-rnd()*30;const y=r*32;while(x<w){const bw=30+rnd()*40;g.fillStyle=`hsl(${30+rnd()*15},${8+rnd()*8}%,${56+rnd()*16}%)`;g.beginPath();g.roundRect?g.roundRect(x+2,y+2,bw-4,28,6):g.rect(x+2,y+2,bw-4,28);g.fill();x+=bw;}}});
function woodTex(hue,l){return canvasTex(128,128,(g,w,h)=>{for(let b=0;b<4;b++){const x0=b*32;g.fillStyle=`hsl(${hue+rnd()*6-3},42%,${l+rnd()*8-4}%)`;g.fillRect(x0,0,32,h);
 for(let k=0;k<7;k++){const gx=x0+3+rnd()*26;g.strokeStyle='rgba(50,25,10,.25)';g.lineWidth=1;g.beginPath();for(let y=0;y<=h;y+=4){const xx=gx+Math.sin(y*.05+k)*2;y?g.lineTo(xx,y):g.moveTo(xx,y);}g.stroke();}
 g.fillStyle='rgba(20,10,5,.6)';g.fillRect(x0,0,2,h);}});}
function tiles(hue,s,l){return canvasTex(128,128,(g,w,h)=>{g.fillStyle=`hsl(${hue},${s}%,${l-8}%)`;g.fillRect(0,0,w,h);for(let r=0;r<8;r++)for(let c=0;c<8;c++){const x=c*16+(r%2?8:0),y=r*16;g.fillStyle=`hsl(${hue+rnd()*8-4},${s}%,${l+rnd()*8-4}%)`;g.beginPath();g.moveTo(x,y);g.lineTo(x+16,y);g.lineTo(x+16,y+11);g.quadraticCurveTo(x+8,y+17,x,y+11);g.closePath();g.fill();}});}
const logT=canvasTex(128,128,(g,w,h)=>{for(let r=0;r<8;r++){const y=r*16;const gr=g.createLinearGradient(0,y,0,y+16);gr.addColorStop(0,'#5e3d24');gr.addColorStop(.5,`hsl(28,${40+rnd()*8}%,${40+rnd()*6}%)`);gr.addColorStop(1,'#4a2f1b');g.fillStyle=gr;g.fillRect(0,y,w,16);}});
const mat=o=>new T.MeshStandardMaterial(Object.assign({roughness:1,metalness:0},o));
const M={
 plaster:mat({color:'#ffffff',map:plaster}),stone:mat({color:'#ffffff',map:stoneT}),
 timber:mat({color:'#ffffff',map:woodTex(24,26)}),wood:mat({color:'#ffffff',map:woodTex(30,44)}),log:mat({color:'#ffffff',map:logT}),
 redWood:mat({color:'#b8402f'}),gold:mat({color:'#d9b35a',roughness:.45,metalness:.3}),
 roofs:[mat({color:'#ffffff',map:tiles(8,55,46)}),mat({color:'#ffffff',map:tiles(212,35,42)}),mat({color:'#ffffff',map:tiles(160,30,40)}),mat({color:'#ffffff',map:tiles(30,45,38)}),mat({color:'#ffffff',map:tiles(350,40,36)})],
 glass:mat({color:'#ffe6b0',emissive:new T.Color('#ffb85a'),emissiveIntensity:.4}),
 lamp:mat({color:'#fff1c8',emissive:new T.Color('#ffc566'),emissiveIntensity:.5}),
 lantern:mat({color:'#e04a3a',emissive:new T.Color('#ff5a3a'),emissiveIntensity:.5}),
 flower:[mat({color:'#ff7aa8'}),mat({color:'#ffd35a'}),mat({color:'#a98bff'}),mat({color:'#ff8c5a'})],
 leaf:mat({color:'#4e9a45'}),iron:mat({color:'#33343a'})
};

// ---------- Peças ----------
function boxUV(geo,w,h,d,tile){const uv=geo.attributes.uv,F=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];for(let f=0;f<6;f++)for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,uv.getX(i)*F[f][0]/tile,uv.getY(i)*F[f][1]/tile);}return geo;}
function box(g,w,h,d,m,x,y,z,ry=0,tile=2.5){const mm=new T.Mesh(boxUV(new T.BoxGeometry(w,h,d),w,h,d,tile),m);mm.position.set(x,y,z);mm.rotation.y=ry;g.add(mm);return mm;}
function cyl(g,r1,r2,h,m,x,y,z,seg=14,tile=2.5){const geo=new T.CylinderGeometry(r1,r2,h,seg),uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*2*Math.PI*Math.max(r1,r2)/tile,uv.getY(i)*h/tile);const mm=new T.Mesh(geo,m);mm.position.set(x,y+h/2,z);g.add(mm);return mm;}
// Telhado de duas águas (cumeeira ao longo de x), com beiral.
function gable(g,w,d,y,rh,m,oh=.6,wallM=null){
 const hd=d/2+oh,slope=Math.atan2(rh,d/2),len=Math.hypot(hd,rh*hd/(d/2));
 for(const s of [-1,1]){const b=box(g,w+oh*2,.22,len,m,0,y+rh*(1-(hd/2)/(d/2))*.0+rh/2-.02,s*hd/2,0,2);b.rotation.x=s*slope;b.position.y=y+rh-Math.sin(slope)*len/2+.1;b.position.z=s*Math.cos(slope)*len/2;}
 box(g,w+oh*2+.1,.22,.3,M.timber,0,y+rh+.12,0);
 if(wallM){const s=new T.Shape();s.moveTo(-d/2,0);s.lineTo(d/2,0);s.lineTo(0,rh);s.lineTo(-d/2,0);
  for(const sx of [-1,1]){const geo=new T.ExtrudeGeometry(s,{depth:.3,bevelEnabled:false});const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/2.5,uv.getY(i)/2.5);const t=new T.Mesh(geo,wallM);t.rotation.y=Math.PI/2;t.position.set(sx*(w/2)-(sx>0?.3:0),y,0);g.add(t);}}
}
// Telhado de quatro águas com pontas curvadas (pagode).
function hip(g,w,d,y,rh,m,oh=.9){
 const c=new T.Mesh(new T.ConeGeometry(Math.SQRT1_2,1,4,1,true),m);c.geometry.rotateY(Math.PI/4);c.scale.set(w+oh*2,rh,d+oh*2);c.position.set(0,y+rh/2,0);g.add(c);
 const under=new T.Mesh(new T.PlaneGeometry(w+oh*2,d+oh*2),M.timber);under.rotation.x=Math.PI/2;under.position.y=y+.01;g.add(under);
 for(const sx of [-1,1])for(const sz of [-1,1]){const t=new T.Mesh(new T.ConeGeometry(.16,.9,5),M.gold);t.position.set(sx*(w/2+oh),y+.25,sz*(d/2+oh));t.rotation.z=-sx*.9;t.rotation.x=sz*.9;g.add(t);}
 box(g,.25,.5,.25,M.gold,0,y+rh+.15,0);
}
function windowAt(g,x,y,z,ry,shutter=true){box(g,.9,1.1,.12,M.glass,x,y,z,ry);box(g,1.1,.14,.2,M.timber,x,y-.62,z,ry);box(g,1.1,.14,.2,M.timber,x,y+.62,z,ry);
 if(shutter){const c=Math.cos(ry),s=Math.sin(ry);for(const sd of [-1,1])box(g,.42,1.15,.06,M.timber,x+c*sd*.72,y,z-s*sd*.72,ry);}}
function flowerBox(g,x,y,z,ry){box(g,1,.25,.3,M.wood,x,y,z,ry);for(let i=0;i<4;i++){const c=Math.cos(ry),s=Math.sin(ry),o=-.35+i*.23;const f=new T.Mesh(new T.IcosahedronGeometry(.13,0),M.flower[(i+Math.floor(x))&3]);f.position.set(x+c*o,y+.2,z-s*o);g.add(f);}}
function door(g,w,z,frame=M.timber,leaf=M.wood){box(g,1.3,2.2,.14,leaf,0,1.1,z+.02);box(g,1.6,.2,.2,frame,0,2.3,z+.04);for(const s of [-1,1])box(g,.15,2.3,.2,frame,s*.72,1.15,z+.04);box(g,.12,.12,.1,M.gold,.4,1.1,z+.12);}

// ---------- Estilos de casa (local: frente = +z, chão = 0) ----------
function houseEnxaimel(g,w,d,roof){
 box(g,w,1,d,M.stone,0,.5,0);box(g,w,3.4,d,M.plaster,0,2.7,0);
 for(let x=-w/2;x<=w/2+.01;x+=w/4)for(const z of [-d/2,d/2])box(g,.22,3.4,.22,M.timber,x,2.7,z);
 for(let z=-d/2;z<=d/2+.01;z+=d/3)for(const x of [-w/2,w/2])box(g,.22,3.4,.22,M.timber,x,2.7,z);
 for(const y of [1.05,2.7,4.35]){box(g,w+.04,.2,.24,M.timber,0,y,d/2);box(g,w+.04,.2,.24,M.timber,0,y,-d/2);box(g,.24,.2,d+.04,M.timber,w/2,y,0);box(g,.24,.2,d+.04,M.timber,-w/2,y,0);}
 for(const sx of [-1,1]){const b=box(g,.16,2.2,.16,M.timber,sx*w*.375,2.75,d/2+.06);b.rotation.z=sx*.55;}
 gable(g,w,d,4.4,2.8,roof,.6,M.plaster);
 door(g,w,d/2+.05);windowAt(g,-w*.3,3.4,d/2+.08,0);windowAt(g,w*.3,3.4,d/2+.08,0);flowerBox(g,-w*.3,2.7,d/2+.25,0);flowerBox(g,w*.3,2.7,d/2+.25,0);
 for(const sx of [-1,1])windowAt(g,sx*(w/2+.08),3,0,Math.PI/2);
 box(g,.9,2.4,.9,M.stone,w*.28,6.2,-d*.2);box(g,1.05,.2,1.05,M.stone,w*.28,7.45,-d*.2);
}
function houseSobrado(g,w,d,roof){
 box(g,w,3.2,d,M.stone,0,1.6,0);box(g,w+.5,3,d+.5,M.plaster,0,4.7,0);box(g,w+.7,.3,d+.7,M.timber,0,3.25,0);
 for(const sx of [-1,1])for(const sz of [-1,1])box(g,.26,3,.26,M.timber,sx*(w/2+.25),4.7,sz*(d/2+.25));
 gable(g,w+.5,d+.5,6.2,3,roof,.7,M.plaster);
 door(g,w,d/2+.05,M.stone,M.wood);windowAt(g,-w*.3,1.9,d/2+.08,0,false);windowAt(g,w*.3,1.9,d/2+.08,0,false);
 // Varanda de madeira no andar de cima.
 box(g,w*.7,.18,1.3,M.wood,0,3.3,d/2+.9);box(g,w*.7,.1,.1,M.timber,0,4.25,d/2+1.5);
 for(let x=-w*.35;x<=w*.35+.01;x+=.45)box(g,.07,.9,.07,M.timber,x,3.8,d/2+1.5);
 for(const sx of [-1,1])box(g,.1,.95,1.3,M.timber,sx*w*.35,3.8,d/2+.9);
 for(const sx of [-.3,0,.3])windowAt(g,sx*w,4.9,d/2+.3,0);flowerBox(g,-w*.15,4.25,d/2+1.65,0);flowerBox(g,w*.15,4.25,d/2+1.65,0);
 for(const sx of [-1,1])windowAt(g,sx*(w/2+.3),4.9,0,Math.PI/2);
}
function housePagode(g,w,d,roof){
 box(g,w+1.2,.8,d+1.2,M.stone,0,.4,0);box(g,w,3.6,d,M.wood,0,2.6,0);
 for(const sx of [-1,1])for(const sz of [-1,1])cyl(g,.22,.22,3.8,M.redWood,sx*w/2,.8,sz*d/2,10);
 for(const x of [-w/4,w/4])cyl(g,.2,.2,3.8,M.redWood,x,.8,d/2+.02,10);
 box(g,w+.3,.4,d+.3,M.redWood,0,4.6,0);
 hip(g,w,d,4.8,1.2,roof,1.0);box(g,w*.72,1.5,d*.72,M.wood,0,6.4,0);for(const sx of [-1,1])windowAt(g,sx*w*.2,6.4,d*.36+.07,0,false);
 hip(g,w*.72,d*.72,7.15,2.2,roof,.8);
 door(g,w,d/2+.05,M.redWood,M.redWood);
 for(const sx of [-1,1]){const lat=new T.Group();for(let i=0;i<4;i++)box(lat,1.4,.06,.08,M.redWood,0,-.6+i*.4,0);for(let i=0;i<4;i++)box(lat,.06,1.3,.08,M.redWood,-.6+i*.4,0,0);box(lat,1.3,1.2,.04,M.glass,0,0,-.03);lat.position.set(sx*w*.32,2.8,d/2+.1);g.add(lat);}
 for(const sx of [-1,1]){const l=new T.Mesh(new T.SphereGeometry(.32,10,8),M.lantern);l.scale.y=1.3;l.position.set(sx*(w/2+.6),4.1,d/2+.9);g.add(l);box(g,.04,.5,.04,M.iron,sx*(w/2+.6),4.75,d/2+.9);}
}
function houseTorre(g,w,d,roof){
 const r=Math.min(w,d)*.42;
 cyl(g,r+.2,r+.35,1,M.stone,0,0,0,16);cyl(g,r,r,6.4,M.stone,0,1,0,16);cyl(g,r+.3,r+.3,.3,M.timber,0,7.4,0,16);
 const c=new T.Mesh(new T.ConeGeometry(r+.8,3.8,16),roof);c.position.set(0,9.6,0);g.add(c);box(g,.2,1,.2,M.gold,0,12,0);
 // Anexo baixo ao lado, com telhado próprio.
 box(g,w*.55,2.8,d*.7,M.plaster,w*.42,1.4,d*.05);gable(g,w*.55,d*.7,2.8,1.4,roof,.4,M.plaster);g.children.slice(-5).forEach(o=>o.position.x+=w*.42);
 door(g,w,r+.03,M.timber,M.wood);
 for(const [y,a] of [[3.6,0],[5.6,.9],[5.6,-.9],[3.6,Math.PI]]){windowAt(g,Math.sin(a)*(r+.06),y,Math.cos(a)*(r+.06),a,false);}
 flowerBox(g,w*.42,1.6,d*.4+.1,0);
}
function houseChale(g,w,d,roof){
 box(g,w,.7,d,M.stone,0,.35,0);box(g,w,3.4,d,M.log,0,2.4,0,0,1.6);
 gable(g,w,d+2.4,4.1,1.8,roof,.9,M.log);
 // Varanda coberta na frente.
 box(g,w,.2,2.2,M.wood,0,.25,d/2+1.1);for(const sx of [-1,-.33,.33,1])box(g,.22,3.3,.22,M.timber,sx*(w/2-.15),2.45,d/2+2.05);
 box(g,w,.12,.12,M.timber,0,3.0,d/2+2.05);
 door(g,w,d/2+.05);windowAt(g,-w*.3,2.5,d/2+.08,0);windowAt(g,w*.3,2.5,d/2+.08,0);
 for(const sx of [-1,1])windowAt(g,sx*(w/2+.08),2.5,0,Math.PI/2);
 box(g,1.1,6,1.1,M.stone,-w/2-.3,3,-d*.15);box(g,1.3,.25,1.3,M.stone,-w/2-.3,6.1,-d*.15);
 const pile=new T.Group();for(let i=0;i<6;i++){const l=new T.Mesh(new T.CylinderGeometry(.16,.16,1.2,8),M.log);l.rotation.z=Math.PI/2;l.position.set(0,.2+Math.floor(i/3)*.3,(i%3)*.32);pile.add(l);}pile.position.set(w/2+.7,0,d/2-1);g.add(pile);
}
const BUILD={enxaimel:houseEnxaimel,sobrado:houseSobrado,pagode:housePagode,torre:houseTorre,chale:houseChale};

function mergeInto(group,parent,name){
 group.updateMatrixWorld(true);const buckets=new Map();
 group.traverse(o=>{if(!o.isMesh)return;let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(!buckets.has(o.material))buckets.set(o.material,[]);buckets.get(o.material).push(g);});
 for(const [m,list] of buckets){let n=0;for(const g of list)n+=g.attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2);let off=0;
  for(const g of list){P.set(g.attributes.position.array,off*3);if(g.attributes.normal)N.set(g.attributes.normal.array,off*3);U.set(g.attributes.uv.array.subarray(0,g.attributes.position.count*2),off*2);off+=g.attributes.position.count;g.dispose();}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(P,3));geo.setAttribute('normal',new T.BufferAttribute(N,3));geo.setAttribute('uv',new T.BufferAttribute(U,2));geo.computeBoundingSphere();
  const mesh=new T.Mesh(geo,m);mesh.name=name;mesh.castShadow=m!==M.glass&&m!==M.lamp&&m!==M.lantern;mesh.receiveShadow=true;parent.add(mesh);}
}

function build(api,V){
 const H=window.arcanoIslandHeight,O=window.arcanoObstacles,scene=api.scene;
 const all=new T.Group();
 // ----- Casas -----
 V.pads.forEach((p,i)=>{
  const g=new T.Group();
  // Alicerce: desce até o ponto mais baixo do chão sob a casa (nunca flutua).
  let lo=p.y;const c=Math.cos(p.rot),s=Math.sin(p.rot);
  for(const fx of [-.6,0,.6])for(const fz of [-.6,0,.6]){const lx=fx*(p.w+1),lz=fz*(p.d+1);lo=Math.min(lo,H(p.x+lx*c+lz*s,p.z-lx*s+lz*c));}
  const depth=p.y-lo+.6;
  box(g,p.w+1.2,depth,p.d+1.2,M.stone,0,.12-depth/2,0);
  box(g,p.w+1.4,.14,p.d+1.4,M.stone,0,.12,0);
  const house=new T.Group();house.position.y=.18;g.add(house);
  BUILD[p.style](house,p.w,p.d,M.roofs[(i*3+1)%M.roofs.length]);
  // Degraus da porta até o terraço e um vaso de flores.
  box(g,1.8,.2,.6,M.stone,0,.1,p.d/2+.9);
  {const pot=new T.Mesh(new T.CylinderGeometry(.3,.22,.5,10),M.redWood);pot.position.set(p.w/2+.2,.43,p.d/2+.7);g.add(pot);const b=new T.Mesh(new T.IcosahedronGeometry(.42,1),M.leaf);b.position.set(p.w/2+.2,.95,p.d/2+.7);g.add(b);}
  g.position.set(p.x,p.y,p.z);g.rotation.y=p.rot;all.add(g);
  if(O){const r=p.style==='torre'?Math.max(p.w,p.d)/2+.3:0;O.addBox({x:p.x,z:p.z,hw:p.w/2+.25+(r?.3:0),hd:p.d/2+.32,rot:p.rot,ymin:lo-2,ymax:p.y+12});
   // Vaso de flores ao lado da porta.
   const L2W=(lx,lz)=>[p.x+lx*c+lz*s,p.z-lx*s+lz*c],yr={ymin:p.y-2,ymax:p.y+8};
   if(p.style==='chale'){
    for(const sx of [-1,-.33,.33,1]){const [x,z]=L2W(sx*(p.w/2-.15),p.d/2+2.05);O.addCircle(x,z,.16,yr);}
    {const [x,z]=L2W(-p.w/2-.3,-p.d*.15);O.addBox({x,z,hw:.6,hd:.6,rot:p.rot,...yr});}
    {const [x,z]=L2W(p.w/2+.7,p.d/2-.68);O.addBox({x,z,hw:.62,hd:.55,rot:p.rot,...yr});}
    // Piso da varanda (degrau de 35 cm) onde se pisa.
    if(window.arcanoGroundOverrides)window.arcanoGroundOverrides.push((x,z)=>{const dx=x-p.x,dz=z-p.z,lx=dx*c-dz*s,lz=dx*s+dz*c;return Math.abs(lx)<p.w/2&&lz>p.d/2&&lz<p.d/2+2.2?p.y+.53:null;});
   }
   if(p.style==='torre'){const [x,z]=L2W(p.w*.42,p.d*.05);O.addBox({x,z,hw:p.w*.275+.05,hd:p.d*.35+.05,rot:p.rot,...yr});}
   // Borda do alicerce de pedra: onde o terreno desce, o pé sobe nela (não afunda).
   if(window.arcanoGroundOverrides)window.arcanoGroundOverrides.push((x,z)=>{const dx=x-p.x,dz=z-p.z,lx=dx*c-dz*s,lz=dx*s+dz*c;return Math.abs(lx)<p.w/2+.7&&Math.abs(lz)<p.d/2+.7?p.y+.19:null;});
   const vx=p.w/2+.2,vz=p.d/2+.7;O.addCircle(p.x+vx*c+vz*s,p.z-vx*s+vz*c,.34,{ymin:p.y-2,ymax:p.y+3});}
 });
 // ----- Escadas de pedra -----
 for(const st of V.stairs){
  const dx=st.b.x-st.a.x,dz=st.b.z-st.a.z,L=Math.hypot(dx,dz),rise=st.b.y-st.a.y,n=Math.max(2,Math.ceil(Math.abs(rise)/.26)),ry=Math.atan2(dx,dz);
  const g=new T.Group();
  for(let k=0;k<n;k++){
   const t=(k+.5)/n,top=st.a.y+rise*(k+1)/n,x=st.a.x+dx*t,z=st.a.z+dz*t,ground=Math.min(H(x,z),top-.3)-.4;
   box(g,st.w,top-ground,L/n+.03,M.stone,x,(top+ground)/2,z,ry,2);
   box(g,st.w+.1,.06,L/n*.35,M.timber,x+dx/L*L/n*.32,top-.02,z+dz/L*L/n*.32,ry);
  }
  for(const sd of [-1,1]){const c=Math.cos(ry),s=Math.sin(ry);
   for(let k=0;k<n;k+=2){const t=(k+.5)/n,top=st.a.y+rise*(k+1)/n,x=st.a.x+dx*t+c*sd*(st.w/2+.15),z=st.a.z+dz*t-s*sd*(st.w/2+.15);box(g,.3,.7,L/n*2+.05,M.stone,x,top+.2,z,ry);}}
  // Lanternas no pé da escada.
  for(const sd of [-1,1]){const c=Math.cos(ry),s=Math.sin(ry),x=st.a.x+c*sd*(st.w/2+.4),z=st.a.z-s*sd*(st.w/2+.4),y=H(x,z);box(g,.3,1.2,.3,M.stone,x,y+.6,z);box(g,.4,.4,.4,M.lamp,x,y+1.4,z);box(g,.5,.1,.5,M.iron,x,y+1.65,z);if(O)O.addCircle(x,z,.25,{ymin:y-2,ymax:y+3});}
  // Mureta dos dois lados: quem está na escada não cai e quem está fora não atravessa.
  if(O){const lo=Math.min(st.a.y,st.b.y),hi=Math.max(st.a.y,st.b.y),c=Math.cos(ry),s=Math.sin(ry),mx=(st.a.x+st.b.x)/2,mz=(st.a.z+st.b.z)/2;
   for(const sd of [-1,1])O.addBox({x:mx+c*sd*(st.w/2+.15),z:mz-s*sd*(st.w/2+.15),hw:.15,hd:L/2,rot:ry,ymin:lo-3,ymax:hi+2});}
  all.add(g);
 }
 // ----- Postes de luz ao longo da rua -----
 const S=V.spiral;let run=0;
 for(let i=1;i<S.length;i++){
  run+=Math.hypot(S[i].x-S[i-1].x,S[i].z-S[i-1].z);if(run<14)continue;run=0;
  const a=S[i],b=S[Math.min(S.length-1,i+1)],o=S[i-1],tx=b.x-o.x,tz=b.z-o.z,tl=Math.hypot(tx,tz)||1;
  const sd=(i%2)?1:-1,x=a.x+tz/tl*sd*3.1,z=a.z-tx/tl*sd*3.1;
  if(V.pads.some(p=>Math.hypot(p.x-x,p.z-z)<p.r+.8))continue;
  const y=H(x,z),g=new T.Group();
  cyl(g,.09,.12,3.2,M.iron,x,y,z,8);box(g,.9,.07,.07,M.iron,x+tz/tl*-sd*.4,y+3.2,z-tx/tl*-sd*.4,Math.atan2(tz,-tx));
  const lx=x+tz/tl*-sd*.8,lz=z-tx/tl*-sd*.8;box(g,.34,.42,.34,M.lamp,lx,y+2.9,lz);box(g,.44,.08,.44,M.iron,lx,y+3.15,lz);
  all.add(g);if(O)O.addCircle(x,z,.2);
 }
 // ----- Mirante no alto -----
 {const p=V.peakPad,g=new T.Group();
  cyl(g,5.2,5.6,.5,M.stone,0,-.3,0,24);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;cyl(g,.2,.2,3.3,M.redWood,Math.cos(a)*3.6,.2,Math.sin(a)*3.6,10);if(O)O.addCircle(p.x+Math.cos(a)*3.6,p.z+Math.sin(a)*3.6,.25);}
  const ring=new T.Mesh(new T.CylinderGeometry(3.8,3.8,.35,8,1,true),M.redWood);ring.position.y=3.6;ring.material.side=T.DoubleSide;g.add(ring);
  const r1=new T.Mesh(new T.ConeGeometry(5.4,1.4,8,1,true),M.roofs[2]);r1.position.y=4.4;g.add(r1);
  const r2=new T.Mesh(new T.ConeGeometry(2.6,2,8),M.roofs[2]);r2.position.y=5.9;g.add(r2);box(g,.25,.8,.25,M.gold,0,7.1,0);
  for(let i=0;i<8;i++){const a=(i+.5)/8*Math.PI*2;const t=new T.Mesh(new T.ConeGeometry(.14,.8,5),M.gold);t.position.set(Math.cos(a)*5.3,3.8,Math.sin(a)*5.3);t.rotation.set(Math.sin(a)*.9,0,-Math.cos(a)*.9);g.add(t);}
  // Parapeito com abertura do lado da escada.
  const st=V.stairs[V.stairs.length-1],open=Math.atan2(st.a.z-p.z,st.a.x-p.x);
  for(let i=0;i<24;i++){const a=i/24*Math.PI*2;if(Math.abs(Math.atan2(Math.sin(a-open),Math.cos(a-open)))<.35)continue;box(g,1.3,.9,.3,M.stone,Math.cos(a)*5.2,.45,Math.sin(a)*5.2,-a+Math.PI/2);}
  box(g,2,.45,.6,M.wood,0,.3,-1.5);box(g,2,.45,.6,M.wood,0,.3,1.5);
  const l=new T.Mesh(new T.SphereGeometry(.4,10,8),M.lantern);l.position.y=3.1;g.add(l);
  g.position.set(p.x,p.y,p.z);all.add(g);
  if(O){for(let i=0;i<24;i++){const a=i/24*Math.PI*2;if(Math.abs(Math.atan2(Math.sin(a-open),Math.cos(a-open)))<.35)continue;O.addBox({x:p.x+Math.cos(a)*5.2,z:p.z+Math.sin(a)*5.2,hw:.65,hd:.2,rot:-a+Math.PI/2+Math.PI/2*0,ymin:p.y-1,ymax:p.y+4});}}
 }
 const root=new T.Group();root.name='Vila da Montanha';scene.add(root);
 mergeInto(all,root,'Vila da Montanha · casas');
 setInterval(()=>{const s=window.arcanoAnimeSky&&window.arcanoAnimeSky.material.uniforms.uSunDir.value;const night=s?Math.min(1,Math.max(0,(-s.y+.02)/.2)):0;
  M.glass.emissiveIntensity=.35+night*1.6;M.lamp.emissiveIntensity=.4+night*2.2;M.lantern.emissiveIntensity=.5+night*1.8;},1000);
 return root;
}

function install(){
 const api=window.arcanoWaterV1226,I=window.arcanoIsland;
 if(!api||!api.scene||!I||!I.village||!I.village.pads){setTimeout(install,400);return;}
 window.arcanoVillage={root:build(api,I.village),data:I.village};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
