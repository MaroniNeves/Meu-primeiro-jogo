/* Minas de cristal no estilo das referências pintadas.
   - Fora: colina de rocha com musgo, boca escorada por madeira (pilares, viga e mãos-francesas), arco de pedras,
     lamparina num poste (acende à noite), trilhos saindo da boca com vagonete cheio de cristais, caixotes, barril
     e uma trilha de terra até a estrada mais próxima.
   - Dentro: túnel de pedras empilhadas com escoras a cada 3 m e lamparinas penduradas, trilhos até o salão;
     salão redondo com teto em cúpula de pedras, escoras, um cristal gigante azul num anel de pedras, cristais nas
     paredes, ferramentas, escada, entulho e uma galeria lateral escura que termina num desabamento.
   A luz de dentro é "pintada" nos vértices: quente perto das lamparinas, azul perto do cristal, clara na boca.
   Ganchos: arcanoClearings (sem árvores), arcanoPits (rebaixa o chão sob a colina), arcanoNoGrass,
   arcanoExtraDecks (piso), arcanoObstacles.blocked (paredes), arcanoCameraLimit (câmera não atravessa a rocha). */
(function(){
'use strict';
const T=window.THREE;if(!T)return;
const PI=Math.PI,TAU=PI*2,mobile=innerWidth<680;
// x,z = origem da mina; rot = para onde a boca olha; g = altura do chão na boca (medida no terreno original).
const SITES=[
 {id:'leste',nome:'Mina do Leste',x:310,z:-140,rot:4.712,g:12.04,seed:11,road:[286,-170]},
 {id:'estrada',nome:'Mina da Estrada',x:180,z:-30,rot:4.887,g:3.9,seed:22,road:[155,-55]},
 {id:'oeste',nome:'Mina do Oeste',x:-150,z:-10,rot:2.269,g:4.51,seed:33,road:[-118,-32]},
 {id:'antiga',nome:'Mina Antiga',x:-260,z:-220,rot:0,g:17.24,seed:44,road:[-216,-195]}];
// Medidas locais: z+ sai pela boca, y relativo ao piso.
const PZ=8,TW=3.8,TH=3.4,CH={x:0,z:-10,r:7.5},CHH=6,SIDE={x0:-6.9,x1:-12.6,z:-10.5,hw:1.5,h:3},
 MC={z:-6,rx:17,rzF:PZ+.7+6,rzB:16},HT=12;
const sm=(a,b,t)=>{t=Math.min(1,Math.max(0,(t-a)/(b-a)));return t*t*(3-2*t);};
const mkR=seed=>{let s=seed>>>0||1;return()=>(s=(s*1664525+1013904223)>>>0)/4294967296;};
const hash=(a,b,c)=>{const v=Math.sin(a*127.1+b*311.7+c*74.7)*43758.5453;return v-Math.floor(v);};
const segDist=(x,z,ax,az,bx,bz)=>{const dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz||1;let t=((x-ax)*dx+(z-az)*dz)/l2;t=Math.max(0,Math.min(1,t));return Math.hypot(x-ax-dx*t,z-az-dz*t);};
const footR=(lx,lz)=>{const dz=lz-MC.z;return Math.hypot(lx/MC.rx,dz/(dz>0?MC.rzF:MC.rzB));};
for(const s of SITES){s.c=Math.cos(s.rot);s.s=Math.sin(s.rot);
 s.toW=(lx,lz)=>({x:s.x+lx*s.c+lz*s.s,z:s.z-lx*s.s+lz*s.c});
 s.toL=(x,z)=>{const dx=x-s.x,dz=z-s.z;return {x:dx*s.c-dz*s.s,z:dx*s.s+dz*s.c};};
 const f=s.toW(0,PZ+5);s.front=[f.x,f.z];
 s.domeR=(lx,lz)=>{const r0=footR(lx,lz),th=Math.atan2(lx,lz-MC.z),back=1-sm(PZ-6,PZ-3,lz);
  return r0*(1+back*(.05*Math.sin(3*th+s.seed)+.035*Math.sin(7*th+s.seed*2)));};}
window.arcanoMinas=SITES;

/* ---------- Regiões andáveis (coordenadas locais) ---------- */
const allowed=(lx,lz,m)=>(Math.abs(lx)<TW/2-m&&lz>CH.z&&lz<PZ+4)||(Math.hypot(lx-CH.x,lz-CH.z)<CH.r-m)||
 (lx<SIDE.x0+1&&lx>SIDE.x1+m&&Math.abs(lz-SIDE.z)<SIDE.hw-m);
const ceilY=(lx,lz)=>{let c=0;if(Math.abs(lx)<TW/2&&lz>CH.z)c=TH;const r=Math.hypot(lx-CH.x,lz-CH.z);
 if(r<CH.r)c=Math.max(c,3.2+(CHH-3.2)*Math.sqrt(Math.max(0,1-(r/(CH.r+.35))**2)));
 if(lx<SIDE.x0+1&&Math.abs(lz-SIDE.z)<SIDE.hw)c=Math.max(c,SIDE.h);return c;};

/* ---------- Ganchos lidos pela ilha (precisam existir antes da floresta ser plantada) ---------- */
const CL=window.arcanoClearings=window.arcanoClearings||[];
for(const s of SITES){const c=s.toW(0,MC.z);CL.push({x:c.x,z:c.z,r:21});const a=s.toW(0,PZ+5);CL.push({x:a.x,z:a.z,r:9});
 const p=s.toW(0,PZ+9);CL.push({x1:p.x,z1:p.z,x2:s.road[0],z2:s.road[1],r:4.2});}
(window.arcanoNoGrass=window.arcanoNoGrass||[]).push((x,z)=>{for(const s of SITES){const dx=x-s.x,dz=z-s.z;if(dx*dx+dz*dz>9000)continue;
 const l=s.toL(x,z);if(footR(l.x,l.z)<1.06)return true;if(l.z>PZ-1&&l.z<PZ+9.5&&Math.abs(l.x)<2.4)return true;
 const p=s.toW(0,PZ+9);if(segDist(x,z,p.x,p.z,s.road[0],s.road[1])<1.2)return true;}return false;});
let bypass=false;const prevPits=window.arcanoPits;
window.arcanoPits=(x,z,y0)=>{let y=prevPits?prevPits(x,z,y0):y0;if(bypass)return y;
 for(const s of SITES){const dx=x-s.x,dz=z-s.z;if(dx*dx+dz*dz>1400)continue;const l=s.toL(x,z),r=footR(l.x,l.z);
  let k=1-sm(.78,.9,r);
  if(Math.abs(l.x)<TW/2+1.2)k=Math.max(k,(1-sm(PZ-1.2,PZ-.2,l.z))*(1-sm(TW/2+.2,TW/2+1.2,Math.abs(l.x))));
  const t=s.g-.45;if(k>0&&y>t)y+=(t-y)*k;}
 return y;};

/* ---------- Geometria: mesclador com cor por vértice e luz pintada ---------- */
function Mg(){const P=[],N=[],C=[],c=new T.Color();
 return {add(geo,col,m){const g=geo.index?geo.toNonIndexed():geo;if(m)g.applyMatrix4(m);g.computeVertexNormals();
   const p=g.attributes.position,n=g.attributes.normal,fn=typeof col==='function';if(!fn)c.set(col);
   for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i);P.push(x,y,z);N.push(nx,ny,nz);
    if(fn){const r=col(x,y,z,nx,ny,nz);C.push(r[0],r[1],r[2]);}else C.push(c.r,c.g,c.b);}},
  get size(){return P.length;},
  build(bake){if(bake)for(let i=0;i<P.length;i+=3){const k=bake(P[i],P[i+1],P[i+2],N[i],N[i+1],N[i+2]);C[i]*=k[0];C[i+1]*=k[1];C[i+2]*=k[2];}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('normal',new T.Float32BufferAttribute(N,3));
   g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.computeBoundingSphere();return g;}};}
const mat=(x,y,z,rx,ry,rz,sx,sy,sz)=>new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx||0,ry||0,rz||0)),
 new T.Vector3(sx==null?1:sx,sy==null?(sx==null?1:sx):sy,sz==null?(sx==null?1:sx):sz));
const facet=c=>(x,y,z,nx,ny,nz)=>{const j=.86+hash(nx,ny,nz)*.2;return [c.r*j,c.g*j,c.b*j];};
function rock(B,R,x,y,z,r,sx,sy,sz,base,ry,moss,detail){
 const g=new T.IcosahedronGeometry(1,detail==null?(mobile?0:1):detail),p=g.attributes.position,o1=R()*10,o2=R()*10;
 for(let i=0;i<p.count;i++){const vx=p.getX(i),vy=p.getY(i),vz=p.getZ(i),k=1+.17*Math.sin(vx*2.3+o1)*Math.cos(vz*2.1+o2)+.1*Math.sin(vy*3.7+o2);p.setXYZ(i,vx*k,vy*k,vz*k);}
 const hsl={};new T.Color(base).getHSL(hsl);const l=hsl.l*(.82+R()*.34),h=hsl.h+(R()-.5)*.03;
 const top=new T.Color().setHSL(h,hsl.s,Math.min(.92,l*1.28)),mid=new T.Color().setHSL(h,hsl.s,l),bot=new T.Color().setHSL(h,hsl.s*.9,l*.66),ms=new T.Color(R()<.5?'#6f9a46':'#5d8a3c');
 B.add(g,(X,Y,Z,nx,ny,nz)=>{const j=.9+hash(nx,ny,nz)*.16;let c=ny>.3?top:ny<-.25?bot:mid;if(moss&&ny>.55&&hash(nx*3,ny,nz*3)<moss)c=ms;return [c.r*j,c.g*j,c.b*j];},
  mat(x,y,z,(R()-.5)*.5,ry==null?R()*TAU:ry,(R()-.5)*.5,r*sx,r*sy,r*sz));}
function log(B,a,b,r,col,sides){const A=new T.Vector3(a[0],a[1],a[2]),d=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),L=d.length();
 const g=new T.CylinderGeometry(r*.94,r,L,sides||7,1);g.translate(0,L/2,0);
 B.add(g,facet(new T.Color(col)),new T.Matrix4().compose(A,new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()),new T.Vector3(1,1,1)));}
function box(B,w,h,d,col,m){B.add(new T.BoxGeometry(w,h,d),facet(new T.Color(col)),m);}
function crystal(B,x,y,z,dx,dy,dz,len,rad){
 const g1=new T.CylinderGeometry(rad,rad*.82,len*.72,6);g1.translate(0,len*.36,0);const g2=new T.ConeGeometry(rad,len*.28,6);g2.translate(0,len*.86,0);
 const d=new T.Vector3(dx,dy,dz).normalize(),m=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d),new T.Vector3(1,1,1));
 const A=[.14,.36,.86],Bc=[.38,.84,1],Cc=[.9,1,1];
 const col=(X,Y,Z,nx,ny,nz)=>{const t=Math.min(1,Math.max(0,((X-x)*d.x+(Y-y)*d.y+(Z-z)*d.z)/len)),f=.72+.3*hash(nx,ny,nz);
  const u=t<.6?t/.6:(t-.6)/.4,a=t<.6?A:Bc,b=t<.6?Bc:Cc;return [(a[0]+(b[0]-a[0])*u)*f,(a[1]+(b[1]-a[1])*u)*f,(a[2]+(b[2]-a[2])*u)*f];};
 B.add(g1,col,m);B.add(g2,col,m);}
function cluster(B,R,x,y,z,size,nx,nz){ // cacho de cristais apontando para cima/para fora (nx,nz = direção de "fora")
 crystal(B,x,y,z,(nx||0)*.25+(R()-.5)*.2,1,(nz||0)*.25+(R()-.5)*.2,size,size*.18);
 const n=4+Math.floor(R()*4);for(let i=0;i<n;i++){const a=R()*TAU,t=.35+R()*.5;
  crystal(B,x+Math.cos(a)*size*.16,y,z+Math.sin(a)*size*.16,Math.cos(a)*t+(nx||0)*.3,1,Math.sin(a)*t+(nz||0)*.3,size*(.35+R()*.4),size*(.07+R()*.07));}}
function lantern(Bf,Bg,x,y,z,s){ // y = gancho no topo
 const ir='#2a2422';Bf.add(new T.TorusGeometry(.05*s,.012*s,4,8),ir,mat(x,y-.02*s,z));
 Bf.add(new T.ConeGeometry(.17*s,.14*s,6),ir,mat(x,y-.12*s,z));Bf.add(new T.CylinderGeometry(.15*s,.15*s,.03*s,6),ir,mat(x,y-.2*s,z));
 for(let k=0;k<6;k++){const a=k/6*TAU;Bf.add(new T.BoxGeometry(.022*s,.3*s,.022*s),ir,mat(x+Math.cos(a)*.135*s,y-.36*s,z+Math.sin(a)*.135*s));}
 Bf.add(new T.CylinderGeometry(.15*s,.12*s,.05*s,6),ir,mat(x,y-.53*s,z));
 Bg.add(new T.CylinderGeometry(.12*s,.11*s,.3*s,6),'#ffffff',mat(x,y-.36*s,z));return [x,y-.36*s,z];}
function cart(B,Bc,R,x,y,z,ry){
 const m0=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),ry),new T.Vector3(1,1,1));
 const add=(geo,col,lm)=>B.add(geo,facet(new T.Color(col)),m0.clone().multiply(lm));
 const g=new T.BoxGeometry(1,.55,1.4),p=g.attributes.position;for(let i=0;i<p.count;i++)if(p.getY(i)>0){p.setX(i,p.getX(i)*1.14);p.setZ(i,p.getZ(i)*1.1);}
 add(g,'#7a4a2a',mat(0,.6,0));add(new T.BoxGeometry(1.02,.04,1.42),'#2a1d14',mat(0,.84,0));
 for(const bz of [-.55,0,.55])add(new T.BoxGeometry(1.1,.6,.06),'#3d3d45',mat(0,.6,bz));
 add(new T.BoxGeometry(1.2,.06,.08),'#3d3d45',mat(0,.88,.78));add(new T.BoxGeometry(1.2,.06,.08),'#3d3d45',mat(0,.88,-.78));
 add(new T.BoxGeometry(.72,.1,1.3),'#3d3d45',mat(0,.28,0));
 for(const sx of [-1,1])for(const sz of [-1,1])add(new T.CylinderGeometry(.2,.2,.08,10),'#2a2a30',mat(sx*.42,.2,sz*.44,0,0,PI/2));
 if(Bc){const v=new T.Vector3();for(let k=0;k<7;k++){v.set((R()-.5)*.7,.8,(R()-.5)*1).applyMatrix4(m0);
  crystal(Bc,v.x,v.y,v.z,(R()-.5)*.8,1,(R()-.5)*.8,.3+R()*.35,.07+R()*.05);}}}
function rails(B,z0,z1,yAt,step){ // trilhos ao longo de z local (x=0)
 const pts=[];for(let z=z0;z<=z1+1e-6;z+=step)pts.push([z,yAt(z)]);
 for(const [z,y] of pts)box(B,1.25,.08,.2,'#4a3322',mat(0,y+.04,z,0,(hash(z,1,2)-.5)*.08));
 for(const sx of [-.36,.36])for(let i=0;i<pts.length-1;i++){const [za,ya]=pts[i],[zb,yb]=pts[i+1];log(B,[sx,ya+.1,za-.02],[sx,yb+.1,zb+.02],.04,'#6a6e76',4);}}

/* ---------- Construção ---------- */
function boot(){const api=window.arcanoWaterV1226,H=window.arcanoIslandHeight;
 if(!api||!api.scene||!H||!window.arcanoIsland){setTimeout(boot,400);return;}
 try{build(api,H);}catch(e){console.error('minas-cristal',e);}}
setTimeout(boot,800);

function build(api,H){
 const scene=api.scene,O=window.arcanoObstacles;
 const H0=(x,z)=>{bypass=true;const y=H(x,z);bypass=false;return y;};
 const exMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.93,metalness:0});
 const inMat=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});
 const crMat=new T.MeshBasicMaterial({vertexColors:true});
 const glassIn=new T.MeshBasicMaterial({color:'#ffd690'});
 const glassEx=new T.MeshBasicMaterial({color:'#b89a64'});
 const haloTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.5)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new T.CanvasTexture(c);})();
 const halo=(color,size,op)=>{const s=new T.Sprite(new T.SpriteMaterial({map:haloTex,color,transparent:true,opacity:op,blending:T.AdditiveBlending,depthWrite:false}));s.scale.setScalar(size);s.userData.base=size;s.userData.op=op;return s;};
 const objs=[];

 for(const s of SITES){
  const R=mkR(s.seed*977+13),root=new T.Group();root.name='Mina · '+s.nome;root.position.set(s.x,s.g,s.z);root.rotation.y=s.rot;scene.add(root);
  const ext=new T.Group(),inn=new T.Group();root.add(ext,inn);
  const yL=(lx,lz)=>{const w=s.toW(lx,lz);return H(w.x,w.z)-s.g;};
  const n2=(x,z)=>Math.sin(x*.31+s.seed)*Math.cos(z*.27-s.seed*.7)+.5*Math.sin(x*.73-z*.61+s.seed*1.3);

  /* ===== Colina (malha de alturas que abraça o terreno na borda) ===== */
  {const st=mobile?.9:.6,x0=-MC.rx*1.1,x1=MC.rx*1.1,z0=MC.z-MC.rzB*1.1,z1=MC.z+MC.rzF*1.1,nx=Math.ceil((x1-x0)/st),nz=Math.ceil((z1-z0)/st);
   const pos=new Float32Array((nx+1)*(nz+1)*3),inside=new Uint8Array((nx+1)*(nz+1));
   for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const lx=x0+i*st,lz=z0+j*st,r=s.domeR(lx,lz),w=s.toW(lx,lz),base=H0(w.x,w.z)-s.g;let y;
    if(r>=1)y=base-.8*sm(1,1.08,r);else{const p=Math.pow(1-Math.pow(r,5),.55),top=HT*(1+.12*n2(lx,lz));y=base+(top-base)*p+n2(lx*2.3,lz*2.3)*.55*p*(1-p)*3;}
    const k=(j*(nx+1)+i);pos[k*3]=lx;pos[k*3+1]=y;pos[k*3+2]=lz;inside[k]=r<1.09?1:0;}
   const idx=[],cut=(a,b,c)=>{const cx=(pos[a*3]+pos[b*3]+pos[c*3])/3,cy=(pos[a*3+1]+pos[b*3+1]+pos[c*3+1])/3,cz=(pos[a*3+2]+pos[b*3+2]+pos[c*3+2])/3;
    return Math.abs(cx)<TW/2+.35&&cy<TH+.45&&cz>PZ-5;};
   for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;if(!(inside[a]||inside[b]||inside[c]||inside[d]))continue;
    if(!cut(a,c,b))idx.push(a,c,b);if(!cut(b,c,d))idx.push(b,c,d);}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
   const nrm=g.attributes.normal,col=new Float32Array(pos.length),cR=new T.Color('#8a929c'),cD=new T.Color('#646d79'),cM=new T.Color('#6e9a48'),cM2=new T.Color('#5a8538'),cE=new T.Color('#86796a'),tc=new T.Color();
   for(let k=0;k<pos.length/3;k++){const x=pos[k*3],y=pos[k*3+1],z=pos[k*3+2],ny=nrm.getY(k),nz=n2(x*1.7,z*1.7);
    {const band=.5+.5*Math.sin(y*1.1+nz*1.8+x*.15);tc.copy(cR).lerp(cD,band>.7?.85:band<.2?0:.35*(.5+.5*nz));}            // estratos pintados
    if(y<.9)tc.lerp(cE,.55*(1-y/.9));
    const moss=ny+.22*nz;if(moss>.66)tc.copy(moss>.86?cM:cM2).lerp(cR,.12*(.5+.5*Math.sin(x*1.9+z*1.3)));
    col[k*3]=tc.r;col[k*3+1]=tc.g;col[k*3+2]=tc.b;}
   g.setAttribute('color',new T.BufferAttribute(col,3));
   const m=new T.Mesh(g,exMat);m.castShadow=true;m.receiveShadow=true;m.name='Colina da mina';ext.add(m);
   s.domeY=(lx,lz)=>{const i=Math.max(0,Math.min(nx,Math.round((lx-x0)/st))),j=Math.max(0,Math.min(nz,Math.round((lz-z0)/st)));return pos[(j*(nx+1)+i)*3+1];};}

  /* ===== Fora: pedras, boca, arco, lamparina, trilhos, vagonete, caixotes ===== */
  const E=Mg(),EC=Mg(),EG=Mg();
  for(let i=0;i<(mobile?12:28);i++){let lx,lz,r;do{lx=(R()-.5)*2*MC.rx*.85;lz=MC.z+(R()-.5)*2*MC.rzB*.85;r=s.domeR(lx,lz);}while(r>.9||(Math.abs(lx)<4.5&&lz>PZ-6));
   const sz=1.1+R()*1.6;rock(E,R,lx,s.domeY(lx,lz)-sz*.25,lz,sz,1.2,.8,1,'#8d96a0',null,.7);}
  for(let i=0;i<(mobile?10:20);i++){const a=R()*TAU,lx=Math.sin(a)*MC.rx*1.0,lz=MC.z+Math.cos(a)*(Math.cos(a)>0?MC.rzF:MC.rzB)*1.0;
   if(Math.abs(lx)<5.5&&lz>PZ-4)continue;const sz=.6+R()*1.1;rock(E,R,lx,yL(lx,lz)+sz*.2,lz,sz,1.15,.75,1,'#8a929b',null,.5);}
  // arco de pedras em volta da boca
  {const ax=TW/2+.95,yc=TH*.62,ry=TH*.6+.4;for(let a=-.15;a<=PI+.15;a+=.24){const r=.55+R()*.25;rock(E,R,Math.cos(a)*ax,yc+Math.sin(a)*ry,PZ+.35+R()*.15,r,1,.9,.8,'#8f97a1',null,.45);}
   for(const sx of [-1,1])for(let y=.3;y<yc;y+=.75){const r=.6+R()*.25;rock(E,R,sx*(ax+R()*.15),y,PZ+.35+R()*.2,r,.9,1,.85,'#8a929b',null,.3);}
   for(const sx of [-1,1]){rock(E,R,sx*(ax+1.2),.3,PZ+.9,1.1+R()*.3,1,.8,1,'#858e98',null,.5);rock(E,R,sx*(ax+.6),.15,PZ+1.4,.55,1,.7,1,'#8a929b',null,.4);}}
  // escoras da boca
  const WD='#7b4a2a',WD2='#6a3f23';
  for(const sx of [-1,1]){log(E,[sx*(TW/2+.05),-.2,PZ+.05],[sx*(TW/2+.05),TH+.15,PZ+.05],.22,WD,8);
   log(E,[sx*(TW/2+.05),TH-.8,PZ+.05],[sx*(TW/2-.75),TH+.12,PZ+.05],.09,WD2);}
  log(E,[-(TW/2+.7),TH+.32,PZ+.05],[TW/2+.7,TH+.38,PZ+.05],.26,WD,8);
  log(E,[-(TW/2+.3),TH+.75,PZ-.1],[TW/2+.35,TH+.72,PZ-.1],.18,WD2,7);
  // lamparina num poste ao lado da boca
  const LX=TW/2+1.6,LZ=PZ+1.5,ly=yL(LX,LZ);
  log(E,[LX,ly-.2,LZ],[LX,ly+2.75,LZ],.1,WD);log(E,[LX,ly+2.6,LZ],[LX-.62,ly+2.62,LZ],.05,'#2a2422',5);log(E,[LX,ly+2.15,LZ],[LX-.38,ly+2.6,LZ],.03,'#2a2422',4);
  const exLamp=lantern(E,EG,LX-.58,ly+2.55,LZ,1.15);
  // trilhos para fora e vagonete com cristais
  rails(E,PZ+.4,PZ+9,z=>yL(0,z),.6);
  const cz=PZ+6.6,cy=yL(0,cz);cart(E,EC,R,0,cy+.08,cz,(R()-.5)*.06);
  box(E,1.1,.5,.4,'#5a3a22',mat(0,yL(0,PZ+9.1)+.25,PZ+9.1));
  // caixotes, barril, picareta e pilha de cristal bruto
  const crate=(B,x,y,z,sz,ry)=>{box(B,sz,sz,sz,'#9a6a3a',mat(x,y+sz/2,z,0,ry));for(const k of [-1,1]){box(B,sz*1.02,sz*.12,sz*1.02,'#6a4526',mat(x,y+sz/2+k*sz*.42,z,0,ry));}
   box(B,sz*1.03,sz*.1,sz*.1,'#6a4526',mat(x,y+sz/2,z,0,ry,PI/4));};
  {const x=TW/2+2.6,z=PZ+3.2,y=yL(x,z);crate(E,x,y,z,.8,.3);crate(E,x+.15,y+.8,z+.05,.62,.7);crate(E,x+.9,y,z+.6,.7,-.2);
   const bx=-(TW/2+2.2),bz=PZ+2.6,by=yL(bx,bz),bg=new T.CylinderGeometry(.36,.36,.9,10,4),bp=bg.attributes.position;
   for(let i=0;i<bp.count;i++){const k=1+.12*Math.cos(bp.getY(i)/.45*PI/2);bp.setX(i,bp.getX(i)*k);bp.setZ(i,bp.getZ(i)*k);}
   E.add(bg,facet(new T.Color('#8a5a32')),mat(bx,by+.45,bz));for(const k of [-.28,.28])E.add(new T.TorusGeometry(.385,.025,4,12),'#3d3d45',mat(bx,by+.45+k,bz,PI/2));
   log(E,[x-.55,y,z-.6],[x-.42,y+1.05,z-.48],.035,'#8a6a42',5);log(E,[x-.62,y+1.0,z-.5],[x-.2,y+1.12,z-.45],.05,'#5a5d63',5);
   const ox=-(TW/2+1.6),oz=PZ+5,oy=yL(ox,oz);for(let k=0;k<6;k++)rock(E,R,ox+(R()-.5)*1.2,oy+.1,oz+(R()-.5)*1.2,.25+R()*.2,1,.7,1,'#7d8692',null,0,0);
   cluster(EC,R,ox,oy,oz,.9,0,0);
   if(O){const w1=s.toW(x+.3,z+.2);O.addCircle(w1.x,w1.z,.85);const w2=s.toW(bx,bz);O.addCircle(w2.x,w2.z,.45);const w3=s.toW(LX,LZ);O.addCircle(w3.x,w3.z,.18);
    const w4=s.toW(0,cz);O.addBox({x:w4.x,z:w4.z,hw:.62,hd:.8,rot:s.rot});const w5=s.toW(ox,oz);O.addCircle(w5.x,w5.z,.7);}}
  {const m=new T.Mesh(E.build(),exMat);m.castShadow=true;m.receiveShadow=true;ext.add(m);
   const c=new T.Mesh(EC.build(),crMat);ext.add(c);const gl=new T.Mesh(EG.build(),glassEx);ext.add(gl);}
  const exHalo=halo('#ffc070',2.2,0);exHalo.position.set(exLamp[0],exLamp[1],exLamp[2]);ext.add(exHalo);

  /* ===== Dentro ===== */
  const LAMPS=[[.95,TH-.75,4.6],[.95,TH-.75,-1.4],[-3.45,2.25,-7.6],[4.65,2.25,-12.3],[-6.3,.35,-8.8]];
  const crys=[[2.2,1.5,-13.4,1]];const wallA=[PI,2.35,-2.35,1.55,-.85];for(const a of wallA)crys.push([CH.x+Math.sin(a)*(CH.r-.4),1.7,CH.z+Math.cos(a)*(CH.r-.4),.42]);
  const bake=(x,y,z,nx,ny,nz)=>{let r=.07,g=.08,b=.13;
   if(z>CH.z){const k=Math.exp(-Math.max(0,PZ+.6-z)/3)*(Math.abs(x)<TW/2+.6?1:.35);r+=.5*k;g+=.5*k;b+=.48*k;}
   for(const L of LAMPS){const dx=L[0]-x,dy=L[1]-y,dz=L[2]-z,d2=dx*dx+dy*dy+dz*dz,d=Math.sqrt(d2)+1e-3,lam=Math.max(.3,(dx*nx+dy*ny+dz*nz)/d*.55+.55),k=1.15/(1+d2*.3)*lam;r+=k;g+=k*.58;b+=k*.24;}
   for(const L of crys){const dx=L[0]-x,dy=L[1]-y,dz=L[2]-z,d2=dx*dx+dy*dy+dz*dz,d=Math.sqrt(d2)+1e-3,lam=Math.max(.3,(dx*nx+dy*ny+dz*nz)/d*.55+.55),k=1.5*L[3]/(1+d2*.1)*lam;r+=k*.16;g+=k*.55;b+=k*1.05;}
   const q=v=>{v=Math.min(1.12,v);return v*.6+Math.floor(v*6)/6*.4;};return [q(r),q(g),q(b)];};
  const I=Mg(),IC=Mg(),IG=Mg();const ST='#8b8f99',ST2='#7c8592',DIRT='#8c7658';
  // pisos
  I.add(new T.PlaneGeometry(TW+.8,PZ+.6-(CH.z+3),6,24),(x,y,z)=>{const v=.88+.12*Math.sin(x*2.7+z*1.9)*Math.cos(z*.8);const c=new T.Color(DIRT);return [c.r*v,c.g*v,c.b*v];},mat(0,.012,(PZ+.6+CH.z+3)/2,-PI/2));
  I.add(new T.CircleGeometry(CH.r+.7,48,0,TAU),(x,y,z)=>{const v=.86+.14*Math.sin(x*1.7+z*2.3)*Math.cos(x*.9);const c=new T.Color(DIRT);return [c.r*v,c.g*v,c.b*v];},mat(CH.x,0,CH.z,-PI/2));
  I.add(new T.PlaneGeometry(SIDE.x0-SIDE.x1+2.5,SIDE.hw*2+.8,12,4),DIRT,mat((SIDE.x0+SIDE.x1)/2-.5,.006,SIDE.z,-PI/2));
  // fundo escuro atrás das pedras (sem frestas)
  const DK='#1c1a22';
  const TZ0=CH.z+CH.r+.2;for(const sx of [-1,1])I.add(new T.PlaneGeometry(PZ+.5-TZ0,TH+.9),DK,mat(sx*(TW/2+.78),(TH+.9)/2-.2,(PZ+.5+TZ0)/2,0,PI/2));
  I.add(new T.PlaneGeometry(TW+1.6,PZ+.5-TZ0),DK,mat(0,TH+.62,(PZ+.5+TZ0)/2,PI/2));
  {const RB=CH.r+1.05,ot=Math.asin((TW/2+.5)/RB),os=Math.asin((SIDE.hw+.5)/RB),tS=-PI/2;
   const seg=(a0,a1)=>{if(a1<=a0)return;I.add(new T.CylinderGeometry(RB,RB,3.6,Math.max(3,Math.ceil((a1-a0)*8)),1,true,a0,a1-a0),DK,mat(CH.x,1.6,CH.z));};
   seg(ot,3*PI/2-os);seg(3*PI/2+os,TAU-ot);
   I.add(new T.SphereGeometry(RB,28,10,0,TAU,0,PI/2),DK,mat(CH.x,3.35,CH.z,0,0,0,1,(CHH+1-3.35)/RB,1));}
  {const xa=-CH.r-.2,xb=SIDE.x1-.9;for(const sz of [-1,1])I.add(new T.PlaneGeometry(xa-xb,SIDE.h+.9),DK,mat((xa+xb)/2,(SIDE.h+.9)/2-.2,SIDE.z+sz*(SIDE.hw+.75)));
  I.add(new T.PlaneGeometry(xa-xb,SIDE.hw*2+1.6),DK,mat((xa+xb)/2,SIDE.h+.55,SIDE.z,PI/2));}
  I.add(new T.PlaneGeometry(SIDE.hw*2+1.6,SIDE.h+.9),DK,mat(SIDE.x1-.9,(SIDE.h+.9)/2-.2,SIDE.z,0,PI/2));
  // paredes do túnel: pedras empilhadas
  for(const sx of [-1,1]){let row=0;for(let y=.28;y<TH+.1;y+=.68,row++)for(let z=CH.z+CH.r-.6+(row%2)*.46;z<PZ+.35;z+=.92+R()*.12){
   const r=.44+R()*.12;rock(I,R,sx*(TW/2+.36+R()*.1),y+(R()-.5)*.1,z,r,.72,.82,1.12,R()<.5?ST:ST2,(R()-.5)*.3,0);}}
  for(let z=CH.z+CH.r-.4;z<PZ+.3;z+=.95)for(const x of [-1.42,-.48,.48,1.42])rock(I,R,x+(R()-.5)*.15,TH+.36,z+(R()-.5)*.2,.5+R()*.1,1,.48,1,ST2,null,0,mobile?0:1);
  // salão: anéis de pedras subindo em cúpula
  {const R0=CH.r+.38,yTop=CHH+.35;let row=0;
   for(let y=.3;y<yTop;y+=.7,row++){const rad=y<3.2?R0:R0*Math.sqrt(Math.max(0,1-((y-3.2)/(yTop+.3-3.2))**2));if(rad<1.3)break;
    const n=Math.max(6,Math.round(TAU*rad/.95)),off=(row%2)*.5/n*TAU;
    for(let k=0;k<n;k++){const a=k/n*TAU+off+(R()-.5)*.05,x=CH.x+Math.sin(a)*rad,z=CH.z+Math.cos(a)*rad;
     if(Math.abs(x)<TW/2+.25&&z>CH.z+2&&y<TH+.3)continue;
     if(x<CH.x-2&&Math.abs(z-SIDE.z)<SIDE.hw+.25&&y<SIDE.h+.3)continue;
     const r=.47+R()*.13;rock(I,R,x,y+(R()-.5)*.1,z,r,1.1,.84,.72,R()<.5?ST:ST2,a,0,mobile?0:1);}}
   for(let k=0;k<7;k++){const a=R()*TAU,d=R()*1.2;rock(I,R,CH.x+Math.cos(a)*d,yTop+.15,CH.z+Math.sin(a)*d,.7,1,.5,1,ST2,null,0,0);}}
  // galeria lateral e desabamento
  for(const sz of [-1,1]){let row=0;for(let y=.28;y<SIDE.h;y+=.68,row++)for(let x=SIDE.x0+.4-(row%2)*.46;x>SIDE.x1-.6;x-=.92+R()*.12){
   rock(I,R,x,y+(R()-.5)*.1,SIDE.z+sz*(SIDE.hw+.36+R()*.1),.44+R()*.12,1.12,.82,.72,R()<.5?ST:ST2,(R()-.5)*.3,0);}}
  for(let x=SIDE.x0;x>SIDE.x1-.6;x-=.95)for(const z of [-.9,0,.9])rock(I,R,x,SIDE.h+.32,SIDE.z+z,.5,1,.48,1,ST2,null,0,mobile?0:1);
  for(let k=0;k<(mobile?14:26);k++){const t=R(),x=SIDE.x1+.2-R()*.8+t*1.6,y=(1-t)*SIDE.h*.85*R()+.15,z=SIDE.z+(R()-.5)*SIDE.hw*1.9;rock(I,R,x,y,z,.3+R()*.35,1,.8,1,R()<.5?'#7f8794':'#6f7783',null,0,0);}
  log(I,[SIDE.x1+.4,.2,SIDE.z-1.1],[SIDE.x1+1.6,2.2,SIDE.z+.7],.13,WD2);
  // escoras do túnel e do salão
  for(const fz of [5.9,2.9,-.1,-2.4]){for(const sx of [-1,1]){log(I,[sx*(TW/2-.12),-.1,fz],[sx*(TW/2-.12),TH,fz],.15,WD);log(I,[sx*(TW/2-.12),TH-.75,fz],[sx*(TW/2-.78),TH+.02,fz],.07,WD2);}
   log(I,[-(TW/2+.15),TH+.08,fz],[TW/2+.15,TH+.08,fz],.17,WD);}
  for(const sx of [-1.15,1.15])log(I,[sx,TH+.27,CH.z+CH.r-.3],[sx,TH+.27,PZ],.1,WD2);
  for(const sz of [-1,1]){log(I,[SIDE.x0+.1,-.1,SIDE.z+sz*(SIDE.hw-.1)],[SIDE.x0+.1,SIDE.h,SIDE.z+sz*(SIDE.hw-.1)],.15,WD);}
  log(I,[SIDE.x0+.1,SIDE.h+.06,SIDE.z-SIDE.hw-.2],[SIDE.x0+.1,SIDE.h+.06,SIDE.z+SIDE.hw+.2],.17,WD);
  const POSTS=[[-3.9,-7.6],[-3.9,-12.6],[5.1,-7.4],[5.1,-12.3]];
  for(const [x,z] of POSTS){log(I,[x,-.1,z],[x,4.35,z],.17,WD);rock(I,R,x,.1,z,.32,1,.5,1,ST2,null,0,0);}
  log(I,[-3.9,4.3,-6.9],[-3.9,4.3,-13.3],.19,WD);log(I,[5.1,4.3,-6.7],[5.1,4.3,-13],.19,WD);
  log(I,[-3.9,4.45,-10.1],[5.1,4.45,-9.9],.17,WD2);
  for(const [x,z] of POSTS)for(const dz of [-1,1]){if((z<-10&&dz<0)||(z>-10&&dz>0))continue;log(I,[x,3.6,z],[x,4.28,z+dz*.7],.07,WD2);}
  // lamparinas (penduradas nas vigas e nos pilares)
  for(const L of LAMPS.slice(0,2)){log(I,[L[0],TH-.02,L[2]],[L[0],L[1]+.4,L[2]],.012,'#2a2422',4);lantern(I,IG,L[0],L[1]+.4,L[2],1.1);}
  log(I,[-3.9,2.75,-7.6],[-3.4,2.78,-7.6],.035,'#2a2422',4);lantern(I,IG,-3.45,2.7,-7.6,1.05);
  log(I,[5.1,2.75,-12.3],[4.6,2.78,-12.3],.035,'#2a2422',4);lantern(I,IG,4.65,2.7,-12.3,1.05);
  lantern(I,IG,-6.3,.62,-8.8,1.05);
  // trilhos, vagonete e para-choque
  rails(I,CH.z+1.4,PZ+.5,()=>0,.6);box(I,1.1,.5,.35,'#5a3a22',mat(0,.25,CH.z+1.2));
  cart(I,IC,R,0,.08,CH.z+2.6,.03);
  // cristal gigante no anel de pedras
  {const cx=2.2,cz=-13.4;for(let k=0;k<13;k++){const a=k/13*TAU;box(I,.52,.34,.42,R()<.5?'#7f8a95':'#8e98a2',mat(cx+Math.cos(a)*1.25,.17,cz+Math.sin(a)*1.25,0,-a+(R()-.5)*.1));
    box(I,.48,.3,.38,'#76818c',mat(cx+Math.cos(a+.24)*1.2,.46,cz+Math.sin(a+.24)*1.2,0,-a));}
   I.add(new T.CylinderGeometry(1.15,1.2,.55,14),'#5c6570',mat(cx,.27,cz));
   cluster(IC,R,cx,.5,cz,2.5,0,0);}
  for(let i=1;i<crys.length;i++){const c=crys[i],dx=CH.x-c[0],dz=CH.z-c[2],l=Math.hypot(dx,dz);cluster(IC,R,c[0]-dx/l*.2,c[1]-.6,c[2]-dz/l*.2,.9+R()*.4,dx/l*1.4,dz/l*1.4);}
  for(let k=0;k<5;k++){const a=R()*TAU,d=CH.r-1.2;cluster(IC,R,CH.x+Math.sin(a)*d,0,CH.z+Math.cos(a)*d,.35+R()*.3,0,0);}
  // ferramentas, caixotes, barril, escada, entulho
  crate(I,-5.3,0,-6.2,.8,.4);crate(I,-5.7,0,-7.3,.7,-.3);crate(I,-5.4,.8,-6.3,.55,.9);
  {const bg=new T.CylinderGeometry(.36,.36,.9,10,4),bp=bg.attributes.position;for(let i=0;i<bp.count;i++){const k=1+.12*Math.cos(bp.getY(i)/.45*PI/2);bp.setX(i,bp.getX(i)*k);bp.setZ(i,bp.getZ(i)*k);}
   I.add(bg,facet(new T.Color('#8a5a32')),mat(5.7,.45,-6.1));for(const k of [-.28,.28])I.add(new T.TorusGeometry(.385,.025,4,12),'#3d3d45',mat(5.7,.45+k,-6.1,PI/2));}
  log(I,[-4.75,0,-5.5],[-4.62,1.1,-5.62],.035,'#8a6a42',5);log(I,[-4.82,1.05,-5.66],[-4.35,1.15,-5.5],.05,'#5a5d63',5);
  log(I,[6.3,0,-8.5],[6.6,1.4,-8.4],.03,'#8a6a42',5);box(I,.28,.36,.04,'#6a6e76',mat(6.27,.12,-8.5,0,0,-.2));
  {const lx=-1.6,lz=-17,top=4.2;for(const sx of [-.3,.3])log(I,[lx+sx,0,lz+.9],[lx+sx,top,lz+.05],.05,'#8a6a42',5);
   for(let y=.4;y<top;y+=.42){const t=y/top;log(I,[lx-.3,y,lz+.9-t*.85],[lx+.3,y,lz+.9-t*.85],.03,'#7a5a36',4);}}
  for(const [x,z,n] of [[-6.4,-12.8,9],[6.3,-10.5,7],[2.6,-4.8,5]])for(let k=0;k<n;k++)rock(I,R,x+(R()-.5)*1.4,.1+R()*.2,z+(R()-.5)*1.4,.18+R()*.28,1,.7,1,'#7a828e',null,0,0);
  for(let k=0;k<(mobile?20:46);k++){const t=R();let x,z;if(t<.45){x=(R()<.5?-1:1)*(TW/2-.25-R()*.3);z=CH.z+CH.r+R()*(PZ-CH.z-CH.r);}else{const a=R()*TAU,d=CH.r-.5-R()*1.2;x=CH.x+Math.sin(a)*d;z=CH.z+Math.cos(a)*d;}
   rock(I,R,x,.04,z,.06+R()*.1,1,.6,1,'#8a8f98',null,0,0);}
  {const m=new T.Mesh(I.build(bake),inMat);m.name='Mina · interior';inn.add(m);
   const c=new T.Mesh(IC.build(),crMat);inn.add(c);const gl=new T.Mesh(IG.build(),glassIn);inn.add(gl);}
  const halos=[];for(const L of LAMPS){const h=halo('#ffb860',1.5,.55);h.position.set(L[0],L[1],L[2]);inn.add(h);halos.push(h);}
  const crHalo=halo('#7fd8ff',5.5,.5);crHalo.position.set(2.2,1.6,-13.4);inn.add(crHalo);halos.push(crHalo);
  for(let i=1;i<crys.length;i++){const h=halo('#7fd0ff',2,.35);h.position.set(crys[i][0],crys[i][1],crys[i][2]);inn.add(h);halos.push(h);}
  // brilhos subindo do cristal
  const NS=mobile?24:50,sp=new Float32Array(NS*3),seeds=[];for(let i=0;i<NS;i++){seeds.push([R()*TAU,.4+R()*2.2,R()*4,.15+R()*.3]);}
  const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(sp,3));
  const sparks=new T.Points(sg,new T.PointsMaterial({color:'#aef0ff',size:.09,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false}));sparks.frustumCulled=false;inn.add(sparks);
  // obstáculos internos
  if(O){for(const [x,z] of POSTS){const w=s.toW(x,z);O.addCircle(w.x,w.z,.25);}const w=s.toW(2.2,-13.4);O.addCircle(w.x,w.z,1.45);
   const wc=s.toW(0,CH.z+2.6);O.addBox({x:wc.x,z:wc.z,hw:.62,hd:.8,rot:s.rot});const wb=s.toW(5.7,-6.1);O.addCircle(wb.x,wb.z,.42);
   const wk=s.toW(-5.5,-6.8);O.addCircle(wk.x,wk.z,.85);const wr=s.toW(-1.6,-16.6);O.addCircle(wr.x,wr.z,.45);
   for(let x=SIDE.x1-.5;x<SIDE.x1+1.3;x+=.6){const q=s.toW(x,SIDE.z);O.addCircle(q.x,q.z,.9);}}

  /* ===== Trilha de terra até a estrada ===== */
  {const a=s.toW(0,PZ+.2),b=s.toW(0,PZ+9.4),e={x:s.road[0],z:s.road[1]},pts=[];
   const L1=Math.hypot(b.x-a.x,b.z-a.z),L2=Math.hypot(e.x-b.x,e.z-b.z);
   for(let d=0;d<=L1;d+=.8)pts.push({x:a.x+(b.x-a.x)*d/L1,z:a.z+(b.z-a.z)*d/L1,w:5.2-d/L1*2.4});
   for(let d=.8;d<=L2;d+=1){const t=d/L2,wob=Math.sin(t*PI*2+s.seed)*1.2*Math.sin(t*PI);pts.push({x:b.x+(e.x-b.x)*t+(-(e.z-b.z)/L2)*wob,z:b.z+(e.z-b.z)*t+((e.x-b.x)/L2)*wob,w:2.3});}
   const P=[],C=[],ix=[],c0=new T.Color('#b59b74'),c1=new T.Color('#9a8460'),tc=new T.Color();
   for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[Math.min(pts.length-1,i+1)],o=pts[Math.max(0,i-1)];let dx=q.x-o.x,dz=q.z-o.z;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
    for(const k of [-1,-.45,.45,1]){const jw=k*p.w/2*(1+(Math.abs(k)===1?.12*Math.sin(i*1.7+k):0)),x=p.x-dz*jw,z=p.z+dx*jw;P.push(x,H(x,z)+.1,z);
     tc.copy(c0).lerp(c1,Math.abs(k)===1?.6:.15*(.5+.5*Math.sin(i*.9)));C.push(tc.r,tc.g,tc.b);}}
   for(let i=0;i<pts.length-1;i++)for(let k=0;k<3;k++){const a0=i*4+k,b0=a0+1,c=a0+4,d=c+1;ix.push(a0,c,b0,b0,c,d);}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.setIndex(ix);g.computeVertexNormals();
   const m=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));m.receiveShadow=true;m.name='Trilha da mina';scene.add(m);}

  objs.push({s,root,inn,halos,exHalo,exLamp,sparks,sp,seeds,NS});
 }

 /* ---------- Piso, paredes e câmera ---------- */
 (window.arcanoExtraDecks=window.arcanoExtraDecks||[]).push({surfaceAt(x,z){for(const s of SITES){const dx=x-s.x,dz=z-s.z;if(dx*dx+dz*dz>1000)continue;
   const t=s.toL(x,z);if(t.z<PZ+.5&&allowed(t.x,t.z,-.25))return s.g+.03;}return null;},blocksSegment(){return false;}});
 const solidL=(s,lx,lz)=>s.domeR(lx,lz)<1&&!allowed(lx,lz,.3);
 if(O){const ob=O.blocked;O.blocked=function(fx,fz,tx,tz){for(const s of SITES){const dx=tx-s.x,dz=tz-s.z;if(dx*dx+dz*dz>1500)continue;
   const t=s.toL(tx,tz);if(solidL(s,t.x,t.z)){const f=s.toL(fx,fz);if(!solidL(s,f.x,f.z))return true;}}return ob.call(this,fx,fz,tx,tz);};}
 const tmpF=new T.Vector3();
 const mineCam=(focus,cam)=>{for(const s of SITES){const dx=focus.x-s.x,dz=focus.z-s.z;if(dx*dx+dz*dz>2200)continue;
   const f=s.toL(focus.x,focus.z),inF=allowed(f.x,f.z,0)&&f.z<PZ+.2&&s.domeR(f.x,f.z)<1.02;
   const ok=(x,y,z)=>{if(inF)return allowed(x,z,.35)&&y>.35&&y<ceilY(x,z)-.3;
    if(s.domeR(x,z)>=1)return true;if(allowed(x,z,.2)&&y<ceilY(x,z)-.2&&y>.2)return true;return y>s.domeY(x,z)+.4;};
   const c=s.toL(cam.x,cam.z);if(ok(c.x,cam.y-s.g,c.z))return false;
   let lo=0,hi=1;tmpF.copy(focus);const q=new T.Vector3();
   for(let k=0;k<16;k++){const m=(lo+hi)/2;q.copy(tmpF).lerp(cam,m);const l=s.toL(q.x,q.z);ok(l.x,q.y-s.g,l.z)?lo=m:hi=m;}
   cam.copy(tmpF.lerp(cam,lo*.96));return true;}return false;};
 let other=window.arcanoCameraLimit||null;const combined=(focus,cam)=>mineCam(focus,cam)||(other?other(focus,cam):false);
 try{Object.defineProperty(window,'arcanoCameraLimit',{configurable:true,get(){return combined;},set(f){if(f!==combined)other=f;}});}catch(e){window.arcanoCameraLimit=combined;}

 /* ---------- Luzes dinâmicas (poucas e fixas para não recompilar shaders) ---------- */
 const warm=new T.PointLight('#ffb060',0,16,1.6),blue=new T.PointLight('#62c8ff',0,22,1.4);scene.add(warm,blue);
 const dayF=()=>{const R=window.arcanoAnimeRiver,u=R&&R.material&&R.material.uniforms&&R.material.uniforms.uSun;const y=u?u.value.y:.5;return Math.min(1,Math.max(0,(y+.1)/.28));};
 const cG=new T.Color('#b89a64'),cN=new T.Color('#ffd27a'),v=new T.Vector3();let last=performance.now(),t=0;
 window.arcanoMinasObj={objs,SITES,allowed};
 function tick(){requestAnimationFrame(tick);const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;t+=dt;
  const pl=api.getGrassPlayer&&api.getGrassPlayer();const pp=pl?pl.position:null;const night=1-dayF();
  glassEx.color.copy(cG).lerp(cN,night);crMat.color.setScalar(.92+.1*Math.sin(t*1.6));
  let best=null,bd=1e9,inside=null;
  for(const o of objs){const s=o.s;const d=pp?Math.hypot(pp.x-s.x,pp.z-s.z):1e9;o.inn.visible=d<75;o.root.visible=d<600;
   o.exHalo.material.opacity=night*.85;o.exHalo.scale.setScalar(2.2*(1+.05*Math.sin(t*11+s.seed)));
   if(d<bd){bd=d;best=o;}
   if(pp&&d<40){const l=s.toL(pp.x,pp.z);if(allowed(l.x,l.z,0)&&l.z<PZ-.6&&s.domeR(l.x,l.z)<1)inside=o;}
   if(!o.inn.visible)continue;
   for(let i=0;i<o.halos.length;i++){const h=o.halos[i];h.scale.setScalar(h.userData.base*(1+.07*Math.sin(t*(i<5?12:2)+i*1.7)+.04*Math.sin(t*7.3+i)));}
   const sp=o.sp;for(let i=0;i<o.NS;i++){const q=o.seeds[i];const y=(q[2]+t*q[3])%3.6;const r=q[1]*(1-y/5);sp[i*3]=2.2+Math.cos(q[0]+t*.3)*r;sp[i*3+1]=.6+y;sp[i*3+2]=-13.4+Math.sin(q[0]+t*.3)*r;}
   o.sparks.geometry.attributes.position.needsUpdate=true;}
  if(inside){const s=inside.s;warm.position.set(pp.x,pp.y+2.2,pp.z);warm.intensity+=(1.3-warm.intensity)*.1;
   const c=s.toW(2.2,-13.4);blue.position.set(c.x,s.g+1.8,c.z);blue.intensity+=(1.8-blue.intensity)*.1;}
  else{blue.intensity*=.9;if(best&&bd<60&&night>.05){const s=best.s,w=s.toW(best.exLamp[0],best.exLamp[2]);warm.position.set(w.x,s.g+best.exLamp[1],w.z);warm.intensity=1.6*night;}else warm.intensity*=.9;}}
 tick();
}
})();
