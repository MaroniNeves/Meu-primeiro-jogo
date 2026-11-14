/* Minas de cristal = dungeons.
   FORA: colina de rocha facetada (ressaltos, rachaduras, estratos e musgo), boca escorada por madeira, arco de
   pedras, lamparina num poste, trilhos com vagonete oco cheio de minério, caixotes e trilha até a estrada.
   DENTRO (3 andares ligados por escadarias em zigue-zague e rampas de rocha):
     Andar 0 · Entrada: túnel escorado, salão da mina com trilhos, vagonete, cristal gigante e acampamento.
     Andar 1 · Galerias (-9 m): túneis estreitos, 3 arenas amplas (uma caverna de cristais e uma rebaixada por uma
               rampa), parede rachada que esconde uma sala secreta com baú.
     Andar 2 · Profundezas (-18 m): 2 arenas, antessala com braseiros, PORTÃO GRANDE da sala do chefe (estrado e
               selo de cristal), outra sala secreta com baú.
   As paredes são superfícies contínuas de rocha deslocadas por ruído 3D (relevo), com rachaduras, estratos e umidade
   pintados; a luz (tochas, lamparinas, cristais, braseiros) é pintada nos vértices.
   Para inimigos futuros: window.arcanoMinas[i].dungeon.arenas / .boss (coordenadas do mundo).
   Ganchos: arcanoClearings, arcanoPits, arcanoNoGrass, arcanoExtraDecks, arcanoObstacles.blocked, arcanoCameraLimit. */
(function(){
'use strict';
const T=window.THREE;if(!T)return;
const PI=Math.PI,TAU=PI*2,mobile=innerWidth<680;
const SITES=[
 {id:'leste',nome:'Mina do Leste',x:310,z:-140,rot:4.712,g:12.04,seed:11,road:[286,-170]},
 {id:'estrada',nome:'Mina da Estrada',x:180,z:-30,rot:4.887,g:3.9,seed:22,road:[155,-55]},
 {id:'oeste',nome:'Mina do Oeste',x:-150,z:-10,rot:2.269,g:4.51,seed:33,road:[-118,-32]},
 {id:'antiga',nome:'Mina Antiga',x:-260,z:-220,rot:0,g:17.24,seed:44,road:[-216,-195]}];
const PZ=8,TW=3.8,TH=3.4,MC={z:-6,rx:17,rzF:PZ+.7+6,rzB:27},HT=12;
const GN=24,GC=2,GX0=-24,GZ0=PZ-GN*GC,LVF=[0,-9,-18],LNAME=['Entrada','Galerias','Profundezas'];
const sm=(a,b,t)=>{t=Math.min(1,Math.max(0,(t-a)/(b-a)));return t*t*(3-2*t);};
const mkR=seed=>{let s=seed>>>0||1;return()=>(s=(s*1664525+1013904223)>>>0)/4294967296;};
const hash=(a,b,c)=>{const v=Math.sin(a*127.1+b*311.7+c*74.7)*43758.5453;return v-Math.floor(v);};
const N3=(x,y,z,k)=>Math.sin(x+k*1.7+Math.sin(z*.8+k))*Math.cos(z*1.13-k*.9+Math.sin(y*.7))+.5*Math.sin(y*1.31+x*.57+k*2.3);
const segDist=(x,z,ax,az,bx,bz)=>{const dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz||1;let t=((x-ax)*dx+(z-az)*dz)/l2;t=Math.max(0,Math.min(1,t));return Math.hypot(x-ax-dx*t,z-az-dz*t);};
const footR=(lx,lz)=>{const dz=lz-MC.z;return Math.hypot(lx/MC.rx,dz/(dz>0?MC.rzF:MC.rzB));};
const L22=v=>Math.pow(Math.max(0,v),2.2),lin3=a=>[L22(a[0]),L22(a[1]),L22(a[2])];
const bil=(y,u,v)=>y[0]+(y[1]-y[0])*u+(y[2]-y[0])*v+(y[3]-y[2]-y[1]+y[0])*u*v;
for(const s of SITES){s.c=Math.cos(s.rot);s.s=Math.sin(s.rot);
 s.toW=(lx,lz)=>({x:s.x+lx*s.c+lz*s.s,z:s.z-lx*s.s+lz*s.c});
 s.toL=(x,z)=>{const dx=x-s.x,dz=z-s.z;return {x:dx*s.c-dz*s.s,z:dx*s.s+dz*s.c};};
 const f=s.toW(0,PZ+5);s.front=[f.x,f.z];
 s.domeR=(lx,lz)=>{const r0=footR(lx,lz),th=Math.atan2(lx,lz-MC.z),back=1-sm(PZ-6,PZ-3,lz);
  return r0*(1+back*(.05*Math.sin(3*th+s.seed)+.035*Math.sin(7*th+s.seed*2)));};}
window.arcanoMinas=SITES;

/* ================= Planta da dungeon (grade de 2 m, 3 andares) ================= */
function makeLayout(s){
 const mir=s.seed%2===0,M=i=>mir?GN-1-i:i,MX=x=>mir?-x:x;
 const cells=new Map(),res=new Set(),all=[],key=(i,j)=>i+','+j;
 const cxD=i=>GX0+(i+.5)*GC,czD=j=>GZ0+(j+.5)*GC,ciD=x=>Math.floor((x-GX0)/GC),cjD=z=>Math.floor((z-GZ0)/GC);
 function put(L,iD,j,o){if(iD<0||j<0||iD>=GN||j>=GN)return null;const i=M(iD);
  if(!o.force&&res.has(L+':'+i+','+j))return null;
  let arr=cells.get(key(i,j));if(!arr)cells.set(key(i,j),arr=[]);
  const e=arr.find(q=>q.L===L&&!q.stair&&!q.ramp);
  if(e&&!o.stair&&!o.ramp){e.ceil=Math.max(e.ceil,o.ceil);if(o.room&&!e.room)e.room=o.room;if(o.kind==='room')e.kind='room';return e;}
  let y=o.y?o.y.slice():[o.f,o.f,o.f,o.f];if(o.y&&mir)y=[y[1],y[0],y[3],y[2]];
  const c={I:i,J:j,L,y,ceil:o.ceil,kind:o.kind||'room',room:o.room||null,stair:!!o.stair,ramp:!!o.ramp,nb:[null,null,null,null],door:[null,null,null,null]};
  arr.push(c);all.push(c);return c;}
 const F=L=>LVF[L],rooms=[];
 const ellipse=(L,cx,cz,rx,rz,ceil,room,dy)=>{rooms.push({L,name:room,x:MX(cx),z:cz,rx,rz,y:F(L)+(dy||0)});
  for(let j=0;j<GN;j++)for(let i=0;i<GN;i++){const dx=(cxD(i)-cx)/rx,dz=(czD(j)-cz)/rz;if(dx*dx+dz*dz<1)put(L,i,j,{f:F(L)+(dy||0),ceil,room,kind:'room'});}};
 const corridor=(L,pts,ceil,room,dy)=>{const P=(i,j)=>put(L,i,j,{f:F(L)+(dy||0),ceil,room,kind:'tunnel'});
  for(let k=0;k<pts.length-1;k++){let i=ciD(pts[k][0]),j=cjD(pts[k][1]);const i1=ciD(pts[k+1][0]),j1=cjD(pts[k+1][1]);
   P(i,j);while(i!==i1){i+=Math.sign(i1-i);P(i,j);}while(j!==j1){j+=Math.sign(j1-j);P(i,j);}}};
 const stair=(L,iD,j0,top,bot)=>{const a=iD,b=iD+1,h=(top-bot)/8,mid=top-4*h;
  for(const L2 of [L,L+1])for(let j=j0-5;j<j0;j++)for(const ii of [a,b])res.add(L2+':'+M(ii)+','+j);
  for(let k=0;k<4;k++){const j=j0-1-k,n=top-k*h,sx=top-(k+1)*h;put(L,a,j,{force:1,stair:1,y:[sx,sx,n,n],ceil:3,kind:'stair',room:'escada'});}
  for(const ii of [a,b])put(L,ii,j0-5,{force:1,stair:1,f:mid,ceil:3,kind:'stair',room:'escada'});
  for(let k=0;k<4;k++){const j=j0-4+k,sx=mid-k*h,n=mid-(k+1)*h;put(L,b,j,{force:1,stair:1,y:[sx,sx,n,n],ceil:3,kind:'stair',room:'escada'});}};
 // ---- Andar 0: entrada ----
 stair(0,12,12,0,-9);
 for(let j=16;j<GN;j++)for(const i of [11,12]){const c=put(0,i,j,{f:0,ceil:TH,room:'entrada',kind:'tunnel'});if(c&&j===GN-1)c.portal=true;}
 ellipse(0,0,-11,7,5.5,5.5,'salao');
 ellipse(0,-9,-6,2.8,2.4,3.2,'acampamento');corridor(0,[[-7,-7],[-4,-7]],3.2,'acampamento');
 put(0,12,12,{f:0,ceil:5.5,room:'salao'});
 // ---- Andar 1: galerias ----
 stair(1,4,13,-11,-18);
 put(1,13,12,{f:-9,ceil:3.2,kind:'tunnel',room:'galeria'});
 corridor(1,[[3,-15],[9,-15]],3.2,'galeria');
 ellipse(1,13,-14,6,5,5.5,'arenaA1');
 corridor(1,[[15,-9],[15,-5],[11,-5],[11,-1]],3.2,'galeria');
 ellipse(1,9,2,6,4.5,5,'arenaA2');
 for(const i of [13,12])put(1,i,20,{f:-9,ceil:3.4,kind:'tunnel',room:'descida'});
 for(const [i,e,w] of [[11,-9,-9.667],[10,-9.667,-10.333],[9,-10.333,-11]])put(1,i,20,{ramp:1,y:[w,e,w,e],ceil:3.4,kind:'ramp',room:'descida'});
 put(1,8,20,{f:-11,ceil:3.4,kind:'tunnel',room:'descida'});
 ellipse(1,-11,-2,5.5,5.5,5,'arenaA3',-2);
 for(const j of [13,14,15,16])put(1,4,j,{f:-11,ceil:3.2,kind:'tunnel',room:'galeria'});
 for(const i of [3,2,1])put(1,i,19,{f:-11,ceil:2.8,kind:'tunnel',room:'secreta1'});
 for(let j=18;j>=6;j--)put(1,1,j,{f:-11,ceil:2.8,kind:'tunnel',room:'secreta1'});
 ellipse(1,-19,-31,3.2,2.6,3.2,'secreta1',-2);
 // ---- Andar 2: profundezas ----
 put(2,5,13,{f:-18,ceil:3.2,kind:'tunnel',room:'galeria2'});
 corridor(2,[[-13,-13],[-7,-13]],3.2,'galeria2');
 ellipse(2,-1,-14,6,5,5.5,'arenaB1');
 corridor(2,[[1,-19],[1,-27],[7,-27]],3.2,'galeria2');
 ellipse(2,13,-30,6,5,5.5,'arenaB2');
 for(let j=7;j<=16;j++)for(const i of [15,16,17])put(2,i,j,{f:-18,ceil:5,kind:'room',room:'antessala'});
 ellipse(2,9,1,8,6.5,8,'boss');
 for(let j=15;j<=21;j++)put(2,9,j,{f:-18,ceil:2.8,kind:'tunnel',room:'secreta2'});
 for(let i=8;i>=4;i--)put(2,i,21,{f:-18,ceil:2.8,kind:'tunnel',room:'secreta2'});
 ellipse(2,-18,4,3,2.6,3.2,'secreta2');
 // ---- vizinhança (passa se o piso na borda bate) ----
 const get=(i,j)=>cells.get(key(i,j))||[],DI=[-1,1,0,0],DJ=[0,0,-1,1],OPP=[1,0,3,2];
 const edgeY=(c,sd)=>sd===0?[c.y[0],c.y[2]]:sd===1?[c.y[1],c.y[3]]:sd===2?[c.y[0],c.y[1]]:[c.y[2],c.y[3]];
 for(const c of all)for(let sd=0;sd<4;sd++){const ey=edgeY(c,sd),m=(ey[0]+ey[1])/2;
  for(const b of get(c.I+DI[sd],c.J+DJ[sd])){const ny=edgeY(b,OPP[sd]);if(Math.abs((ny[0]+ny[1])/2-m)<.6){c.nb[sd]=b;break;}}}
 // portas: parede rachada (secreta) e portão do chefe
 const cellAt=(L,iD,j)=>get(M(iD),j).find(q=>q.L===L&&!q.stair);
 const link=(L,iA,jA,iB,jB,obj)=>{const a=cellAt(L,iA,jA),b=cellAt(L,iB,jB);if(!a||!b||a.nb[0]!==b&&a.nb[1]!==b&&a.nb[2]!==b&&a.nb[3]!==b)return;const di=b.I-a.I,dj=b.J-a.J;
  const sd=di===1?1:di===-1?0:dj===1?3:2;a.door[sd]=obj;b.door[OPP[sd]]=obj;(obj.cells=obj.cells||[]).push(a,b);};
 const secrets=[{L:1,a:[4,19],b:[3,19],open:false,t:0},{L:2,a:[9,14],b:[9,15],open:false,t:0}].filter(q=>{link(q.L,q.a[0],q.a[1],q.b[0],q.b[1],q);return !!q.cells;});
 const gate={L:2,open:false,t:0};for(const i of [15,16,17])link(2,i,16,i,17,gate);
 for(const q of secrets){const a=q.cells[0],b=q.cells[1];q.x=GX0+(a.I+b.I+1)*GC/2;q.z=GZ0+(a.J+b.J+1)*GC/2;q.axis=a.I!==b.I?'x':'z';q.ceil=Math.min(a.ceil,b.ceil);q.y=a.y[0];}
 gate.x=MX(9);gate.z=GZ0+17*GC;gate.y=-18;
 return {cells,all,get,mir,M,MX,rooms,secrets,gate};}

/* ---------- Ganchos lidos pela ilha (antes da floresta) ---------- */
const CL=window.arcanoClearings=window.arcanoClearings||[];
for(const s of SITES){const c=s.toW(0,GZ0+GN);CL.push({x:c.x,z:c.z,r:35});const a=s.toW(0,PZ+5);CL.push({x:a.x,z:a.z,r:9});
 const p=s.toW(0,PZ+9);CL.push({x1:p.x,z1:p.z,x2:s.road[0],z2:s.road[1],r:4.2});}
(window.arcanoNoGrass=window.arcanoNoGrass||[]).push((x,z)=>{for(const s of SITES){const dx=x-s.x,dz=z-s.z;if(dx*dx+dz*dz>9000)continue;
 const l=s.toL(x,z);if(footR(l.x,l.z)<1.06)return true;if(l.z>PZ-1&&l.z<PZ+9.5&&Math.abs(l.x)<2.4)return true;
 const p=s.toW(0,PZ+9);if(segDist(x,z,p.x,p.z,s.road[0],s.road[1])<1.2)return true;}return false;});
let bypass=false;const prevPits=window.arcanoPits;
window.arcanoPits=(x,z,y0)=>{let y=prevPits?prevPits(x,z,y0):y0;if(bypass)return y;
 for(const s of SITES){const dx=x-s.x,dz=z-s.z;if(dx*dx+dz*dz>2400)continue;const l=s.toL(x,z),r=footR(l.x,l.z);
  let k=1-sm(.78,.9,r);
  if(Math.abs(l.x)<TW/2+1.2)k=Math.max(k,(1-sm(PZ-1.2,PZ-.2,l.z))*(1-sm(TW/2+.2,TW/2+1.2,Math.abs(l.x))));
  const t=s.g-.45;if(k>0&&y>t)y+=(t-y)*k;
  // poço só onde a primeira escadaria atravessa o chão (x 0..4, z -26..-16 no desenho)
  const sx=s.seed%2===0?-l.x:l.x,ex=Math.max(-sx,sx-4,0),ez=Math.max(-26-l.z,l.z+14,0),kd=1-sm(1.5,3.5,Math.hypot(ex,ez)),t2=s.g-10.5;
  if(kd>0&&y>t2)y+=(t2-y)*kd;
  // pátio na frente da boca: mesma altura do piso do túnel
  if(l.z>PZ-.3&&l.z<PZ+8&&Math.abs(l.x)<5){const w=(1-sm(3,4.8,Math.abs(l.x)))*(1-sm(4,7.5,l.z-PZ));if(w>0)y+=(s.g-.03-y)*w;}}
 return y;};

/* ---------- Geometria ---------- */
function Mg(){const P=[],N=[],C=[],c=new T.Color();
 return {add(geo,col,m){const g=geo.index?geo.toNonIndexed():geo;if(m)g.applyMatrix4(m);g.computeVertexNormals();
   const p=g.attributes.position,n=g.attributes.normal,fn=typeof col==='function';if(!fn)c.set(col);
   for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i);P.push(x,y,z);N.push(nx,ny,nz);
    if(fn){const r=col(x,y,z,nx,ny,nz);C.push(r[0],r[1],r[2]);}else C.push(c.r,c.g,c.b);}},
  get size(){return P.length;},
  build(bake,dayFn){const ALB=dayFn?C.slice():null;if(bake)for(let i=0;i<P.length;i+=3){const k=bake(P[i],P[i+1],P[i+2],N[i],N[i+1],N[i+2]);C[i]*=k[0];C[i+1]*=k[1];C[i+2]*=k[2];}
   const g=new T.BufferGeometry();if(dayFn){const dy=new Float32Array(P.length/3);for(let i=0;i<P.length;i+=3)dy[i/3]=dayFn(P[i],P[i+1],P[i+2],N[i],N[i+1],N[i+2]);g.setAttribute('aDay',new T.BufferAttribute(dy,1));g.setAttribute('aAlb',new T.Float32BufferAttribute(ALB,3));}g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('normal',new T.Float32BufferAttribute(N,3));
   g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.computeBoundingSphere();return g;}};}
const mat=(x,y,z,rx,ry,rz,sx,sy,sz)=>new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx||0,ry||0,rz||0)),
 new T.Vector3(sx==null?1:sx,sy==null?(sx==null?1:sx):sy,sz==null?(sx==null?1:sx):sz));
const facet=c=>(x,y,z,nx,ny,nz)=>{const j=.86+hash(nx,ny,nz)*.2;return [c.r*j,c.g*j,c.b*j];};
// lascas: corta a pedra por planos aleatórios — faces retas e quinas vivas, como rocha quebrada
function chip(p,R,n,depth){const pl=[];for(let k=0;k<n;k++){const u=R()*2-1,a=R()*TAU,s=Math.sqrt(1-u*u);pl.push([s*Math.cos(a),u*.8,s*Math.sin(a),depth[0]+R()*(depth[1]-depth[0])]);}
 for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);for(const q of pl){const d=x*q[0]+y*q[1]+z*q[2]-q[3];if(d>0){x-=q[0]*d;y-=q[1]*d;z-=q[2]*d;}}p.setXYZ(i,x,y,z);}}
function rock(B,R,x,y,z,r,sx,sy,sz,base,ry,moss,detail){
 const g=new T.IcosahedronGeometry(1,detail==null?(mobile?1:2):Math.max(1,detail)),p=g.attributes.position,o1=R()*10,o2=R()*10;
 for(let i=0;i<p.count;i++){const vx=p.getX(i),vy=p.getY(i),vz=p.getZ(i),k=1+.17*Math.sin(vx*2.3+o1)*Math.cos(vz*2.1+o2)+.1*Math.sin(vy*3.7+o2)+.05*Math.sin(vx*7.1+vy*5.3+o1);p.setXYZ(i,vx*k,vy*k,vz*k);}
 chip(p,R,6+Math.floor(R()*5),[.55,.9]);
 const hsl={};new T.Color(base).getHSL(hsl);const l=hsl.l*(.82+R()*.34),h=hsl.h+(R()-.5)*.03;
 const top=new T.Color().setHSL(h,hsl.s,Math.min(.92,l*1.28)),mid=new T.Color().setHSL(h,hsl.s,l),bot=new T.Color().setHSL(h,hsl.s*.9,l*.66),ms=new T.Color(R()<.5?'#6f9a46':'#5d8a3c');
 B.add(g,(X,Y,Z,nx,ny,nz)=>{const j=.9+hash(nx,ny,nz)*.16;let c=ny>.3?top:ny<-.25?bot:mid;if(moss&&ny>.55&&hash(nx*3,ny,nz*3)<moss)c=ms;
  if(Math.abs(N3(X*2.2,Y*2.2,Z*2.2,4))<.06)return [c.r*.5,c.g*.5,c.b*.5];return [c.r*j,c.g*j,c.b*j];},
  mat(x,y,z,(R()-.5)*.5,ry==null?R()*TAU:ry,(R()-.5)*.5,r*sx,r*sy,r*sz));}
function log(B,a,b,r,col,sides){const A=new T.Vector3(a[0],a[1],a[2]),d=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),L=d.length();
 const g=new T.CylinderGeometry(r*.94,r,L,sides||7,1);g.translate(0,L/2,0);
 B.add(g,facet(new T.Color(col)),new T.Matrix4().compose(A,new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()),new T.Vector3(1,1,1)));}
function box(B,w,h,d,col,m){B.add(new T.BoxGeometry(w,h,d),facet(new T.Color(col)),m);}
const PAL_BLUE=[[.14,.36,.86],[.38,.84,1],[.9,1,1]],PAL_PURP=[[.36,.14,.7],[.78,.46,1],[1,.9,1]];
function crystal(B,x,y,z,dx,dy,dz,len,rad,pal){pal=pal||PAL_BLUE;
 const g1=new T.CylinderGeometry(rad,rad*.82,len*.72,6);g1.translate(0,len*.36,0);const g2=new T.ConeGeometry(rad,len*.28,6);g2.translate(0,len*.86,0);
 const d=new T.Vector3(dx,dy,dz).normalize(),m=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d),new T.Vector3(1,1,1));
 const [A,Bc,Cc]=pal;
 const col=(X,Y,Z,nx,ny,nz)=>{const t=Math.min(1,Math.max(0,((X-x)*d.x+(Y-y)*d.y+(Z-z)*d.z)/len)),f=.72+.3*hash(nx,ny,nz);
  const u=t<.6?t/.6:(t-.6)/.4,a=t<.6?A:Bc,b=t<.6?Bc:Cc;return lin3([(a[0]+(b[0]-a[0])*u)*f,(a[1]+(b[1]-a[1])*u)*f,(a[2]+(b[2]-a[2])*u)*f]);};
 B.add(g1,col,m);B.add(g2,col,m);}
function cluster(B,R,x,y,z,size,nx,nz,pal){
 crystal(B,x,y,z,(nx||0)*.25+(R()-.5)*.2,1,(nz||0)*.25+(R()-.5)*.2,size,size*.18,pal);
 const n=4+Math.floor(R()*4);for(let i=0;i<n;i++){const a=R()*TAU,t=.35+R()*.5;
  crystal(B,x+Math.cos(a)*size*.16,y,z+Math.sin(a)*size*.16,Math.cos(a)*t+(nx||0)*.3,1,Math.sin(a)*t+(nz||0)*.3,size*(.35+R()*.4),size*(.07+R()*.07),pal);}}
function lantern(Bf,Bg,x,y,z,s){
 const ir='#2a2422';Bf.add(new T.TorusGeometry(.05*s,.012*s,4,8),ir,mat(x,y-.02*s,z));
 Bf.add(new T.ConeGeometry(.17*s,.14*s,6),ir,mat(x,y-.12*s,z));Bf.add(new T.CylinderGeometry(.15*s,.15*s,.03*s,6),ir,mat(x,y-.2*s,z));
 for(let k=0;k<6;k++){const a=k/6*TAU;Bf.add(new T.BoxGeometry(.022*s,.3*s,.022*s),ir,mat(x+Math.cos(a)*.135*s,y-.36*s,z+Math.sin(a)*.135*s));}
 Bf.add(new T.CylinderGeometry(.15*s,.12*s,.05*s,6),ir,mat(x,y-.53*s,z));
 Bg.add(new T.CylinderGeometry(.12*s,.11*s,.3*s,6),'#ffffff',mat(x,y-.36*s,z));return [x,y-.36*s,z];}
// Vagonete de verdade: caçamba oca de tábuas com abas abertas, aros e cantoneiras de ferro, chassi, eixos e rodas raiadas.
function hollowCart(B,Bc,R,x,y,z,ry,load,tip){
 const m0=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(0,ry,tip||0,'YXZ')),new T.Vector3(1,1,1));
 const add=(geo,col,lm)=>B.add(geo,facet(new T.Color(col)),m0.clone().multiply(lm));
 const WC='#80502c',WC2='#5e3820',IR='#3b3c44',fl=.12;
 add(new T.BoxGeometry(.92,.06,1.28),WC2,mat(0,.36,0));
 for(const sx of [-1,1]){add(new T.BoxGeometry(.06,.58,1.36),WC,mat(sx*.5,.64,0,0,0,-sx*fl));
  for(const yy of [.5,.7])add(new T.BoxGeometry(.012,.025,1.34),WC2,mat(sx*(.535+(yy-.64)*fl),yy,0,0,0,-sx*fl));
  add(new T.BoxGeometry(.08,.06,1.5),IR,mat(sx*(.53+.3*fl),.95,0,0,0,-sx*fl));
  for(const sz of [-.3,.3])add(new T.BoxGeometry(.025,.56,.07),IR,mat(sx*.54,.64,sz,0,0,-sx*fl));}
 for(const sz of [-1,1]){add(new T.BoxGeometry(1.0,.58,.06),WC,mat(0,.64,sz*.68,sz*fl,0,0));
  add(new T.BoxGeometry(1.14,.06,.08),IR,mat(0,.95,sz*(.71+.3*fl),sz*fl,0,0));
  add(new T.BoxGeometry(.18,.08,.14),IR,mat(0,.42,sz*.8));}
 for(const sx of [-1,1])for(const sz of [-1,1])add(new T.BoxGeometry(.07,.6,.07),IR,mat(sx*.53,.65,sz*.7));
 for(const sx of [-.28,.28])add(new T.BoxGeometry(.08,.1,1.3),IR,mat(sx,.28,0));
 for(const sz of [-.42,.42]){add(new T.CylinderGeometry(.03,.03,1.12,6),IR,mat(0,.2,sz,0,0,PI/2));
  for(const sx of [-.56,.56]){add(new T.TorusGeometry(.18,.035,5,14),'#2a2a30',mat(sx,.2,sz,0,PI/2,0));add(new T.CylinderGeometry(.05,.05,.09,8),IR,mat(sx,.2,sz,0,0,PI/2));
   for(let k=0;k<4;k++)add(new T.BoxGeometry(.025,.34,.025),IR,mat(sx,.2,sz,k*PI/4,0,0));}}
 if(load){const v=new T.Vector3();for(let k=0;k<6;k++){v.set((R()-.5)*.6,.44,(R()-.5)*.9).applyMatrix4(m0);rock(B,R,v.x,v.y,v.z,.13+R()*.08,1,.7,1,'#6c7480',null,0,0);}
  if(Bc)for(let k=0;k<5;k++){v.set((R()-.5)*.55,.42,(R()-.5)*.85).applyMatrix4(m0);crystal(Bc,v.x,v.y,v.z,(R()-.5)*.6,1,(R()-.5)*.6,.3+R()*.3,.06+R()*.04);}}}
function rails(B,z0,z1,yAt,step,x){x=x||0;const pts=[];for(let z=z0;z<=z1+1e-6;z+=step)pts.push([z,yAt(z)]);
 for(const [z,y] of pts)box(B,1.25,.08,.2,'#4a3322',mat(x,y+.04,z,0,(hash(z,1,2)-.5)*.08));
 for(const sx of [-.36,.36])for(let i=0;i<pts.length-1;i++){const [za,ya]=pts[i],[zb,yb]=pts[i+1];log(B,[x+sx,ya+.1,za-.02],[x+sx,yb+.1,zb+.02],.04,'#6a6e76',4);}}
function crate(B,x,y,z,sz,ry){box(B,sz,sz,sz,'#9a6a3a',mat(x,y+sz/2,z,0,ry));for(const k of [-1,1])box(B,sz*1.02,sz*.12,sz*1.02,'#6a4526',mat(x,y+sz/2+k*sz*.42,z,0,ry));
 box(B,sz*1.03,sz*.1,sz*.1,'#6a4526',mat(x,y+sz/2,z,0,ry,PI/4));}
function barrel(B,x,y,z){const bg=new T.CylinderGeometry(.36,.36,.9,10,4),bp=bg.attributes.position;
 for(let i=0;i<bp.count;i++){const k=1+.12*Math.cos(bp.getY(i)/.45*PI/2);bp.setX(i,bp.getX(i)*k);bp.setZ(i,bp.getZ(i)*k);}
 B.add(bg,facet(new T.Color('#8a5a32')),mat(x,y+.45,z));for(const k of [-.28,.28])B.add(new T.TorusGeometry(.385,.025,4,12),'#3d3d45',mat(x,y+.45+k,z,PI/2));}

/* ---------- Interface: aviso de interação e mensagens ---------- */
let ui=null;
function getUI(){if(ui)return ui;const css=document.createElement('style');
 css.textContent='#minaInteract{position:fixed;left:50%;bottom:160px;transform:translateX(-50%);z-index:46;display:none;font:600 14px system-ui,Segoe UI,sans-serif;color:#fff8e6;background:rgba(24,22,34,.86);border:1px solid #9fd8ff;border-radius:12px;padding:10px 16px;cursor:pointer;pointer-events:auto}'+
 '#minaToast{position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:47;display:none;font:600 15px system-ui,Segoe UI,sans-serif;color:#fff3cf;background:rgba(30,22,12,.9);border:1px solid #e8c56a;border-radius:12px;padding:12px 18px;text-align:center;pointer-events:none;max-width:80vw}';
 document.head.appendChild(css);const b=document.createElement('button');b.id='minaInteract';b.type='button';document.body.appendChild(b);
 const t=document.createElement('div');t.id='minaToast';document.body.appendChild(t);let tt=0;
 ui={b,show(msg){t.innerHTML=msg;t.style.display='block';clearTimeout(tt);tt=setTimeout(()=>t.style.display='none',4200);}};return ui;}

/* ================= Construção ================= */
const dayK=(x,y,z,nx,ny,nz)=>{if(z<-6||y<-1.5)return 0;return Math.exp(-Math.max(0,PZ+.4-z)/2.2)*(Math.abs(x)<3?1:.4)*(.35+.5*Math.max(0,nz)+.3*Math.max(0,ny));};
// Textura de rocha natural pintada: facetas (Voronoi), fendas entre elas, poros e manchas. Sem emenda.
function rockTexture(){const S=256,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d'),img=g.createImageData(S,S),d=img.data,R=mkR(777);
 const vn=(G,seed)=>{const r=mkR(seed),grid=new Float32Array(G*G);for(let i=0;i<G*G;i++)grid[i]=r();const s1=t=>t*t*(3-2*t);
  return (x,y)=>{const fx=x/S*G,fy=y/S*G,ix=Math.floor(fx),iy=Math.floor(fy),u=s1(fx-ix),v=s1(fy-iy),i0=ix%G,i1=(ix+1)%G,j0=iy%G,j1=(iy+1)%G;
   const A=grid[j0*G+i0],B=grid[j0*G+i1],C=grid[j1*G+i0],D=grid[j1*G+i1];return A+(B-A)*u+(C-A)*v+(A-B-C+D)*u*v;};};
 const n1=vn(4,11),n2=vn(8,12),n3=vn(16,13),n4=vn(32,14),n5=vn(64,15);
 const N=46,pts=[];for(let i=0;i<N;i++)pts.push([R()*S,R()*S,R(),R()*TAU]);
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){let f1=1e9,f2=1e9,id=0,id2=0,bx=0,by=0;
  for(let i=0;i<N;i++){const p=pts[i];for(let ox=-S;ox<=S;ox+=S)for(let oy=-S;oy<=S;oy+=S){const dx=x-p[0]-ox,dy=y-p[1]-oy,dd=dx*dx+dy*dy;
   if(dd<f1){f2=f1;id2=id;f1=dd;id=i;bx=dx;by=dy;}else if(dd<f2){f2=dd;id2=i;}}}
  const p=pts[id],e=Math.sqrt(f2)-Math.sqrt(f1),strong=((id*7+id2*13)%3)===0;
  const A=n1(x,y),B=n2(x,y);let v=.6+.24*A+.14*B+.09*n3(x,y)+.06*n4(x,y)+.05*n5(x,y);
  v*=.9+.14*p[2]+.08*Math.max(-1,Math.min(1,(bx*Math.cos(p[3])+by*Math.sin(p[3]))/26));
  if(e<1.3)v*=strong?.42:.84;else if(e<2.6)v*=strong?.72:.95;else if(e<3.8)v*=1.05;
  const q=R();if(q<.025)v*=.72;else if(q<.035)v*=1.18;
  let r=v*(146+22*(A-.5)),gg=v*144,bb=v*(142-18*(A-.5));
  if(B>.7&&n3(x,y)>.55){const m=Math.min(1,(B-.7)*4);r+=(-30)*m;gg+=10*m;bb+=(-30)*m;}
  const k=(y*S+x)*4;d[k]=Math.min(255,r);d[k+1]=Math.min(255,gg);d[k+2]=Math.min(255,bb);d[k+3]=255;}
 g.putImageData(img,0,0);
 g.lineCap='round';for(let k=0;k<7;k++){let x=R()*S,y=R()*S,ang=R()*TAU;g.strokeStyle='rgba(28,26,30,'+(.35+R()*.25)+')';g.lineWidth=.8+R()*.9;
  for(const ox of [0,-S,S])for(const oy of [0,-S,S]){}let px=x,py=y;g.beginPath();g.moveTo(px,py);for(let i=0;i<14;i++){ang+=(R()-.5)*.9;px+=Math.cos(ang)*5;py+=Math.sin(ang)*5;g.lineTo(px,py);}g.stroke();}
 const dd=g.getImageData(0,0,S,S).data;let acc=0;for(let i=0;i<dd.length;i+=4)acc+=Math.pow(dd[i+1]/255,2.2);
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.userData={avg:acc/(S*S)};return t;}
// Injeta textura triplanar (posição no mundo) e/ou luz do dia vinda da boca da mina.
function shaderize(m,o){const prev=m.onBeforeCompile;m.onBeforeCompile=(sh,r)=>{if(prev)prev(sh,r);
  let vs=sh.vertexShader,fs=sh.fragmentShader;
  if(o.tex){sh.uniforms.uRock={value:o.tex};sh.uniforms.uRockK={value:1/o.tex.userData.avg};
   vs=vs.replace('#include <common>','#include <common>\nvarying vec3 vTW;varying vec3 vTN;').replace('#include <project_vertex>','#include <project_vertex>\nvTW=(modelMatrix*vec4(position,1.)).xyz;vTN=normalize(mat3(modelMatrix)*normal);');
   fs=fs.replace('#include <common>','#include <common>\nuniform sampler2D uRock;uniform float uRockK;varying vec3 vTW;varying vec3 vTN;')
    .replace('#include <map_fragment>','#include <map_fragment>\n{vec3 bw=pow(abs(normalize(vTN)),vec3(4.));bw/=bw.x+bw.y+bw.z+1e-4;float S='+o.scale.toFixed(3)+';vec3 tt=texture2D(uRock,vTW.zy*S).rgb*bw.x+texture2D(uRock,vTW.xz*S).rgb*bw.y+texture2D(uRock,vTW.xy*S).rgb*bw.z;diffuseColor.rgb*=mix(vec3(1.),tt*uRockK,'+o.str.toFixed(2)+'*mix(1.,.38,smoothstep(.55,.92,normalize(vTN).y)));}');}
  if(o.day){sh.uniforms.uDay=o.day;vs=vs.replace('#include <common>','#include <common>\nattribute float aDay;attribute vec3 aAlb;uniform vec3 uDay;').replace('#include <color_vertex>','#include <color_vertex>\nvColor.rgb+=aAlb*aDay*uDay;');}
  sh.vertexShader=vs;sh.fragmentShader=fs;};
 m.customProgramCacheKey=()=>'mina'+(o.tex?'T'+o.scale:'')+(o.day?'D':'');m.needsUpdate=true;return m;}
function boot(){const api=window.arcanoWaterV1226,H=window.arcanoIslandHeight;
 if(!api||!api.scene||!H||!window.arcanoIsland){setTimeout(boot,400);return;}
 try{build(api,H);}catch(e){console.error('minas-cristal',e);}}
setTimeout(boot,800);

function build(api,H){
 const scene=api.scene,O=window.arcanoObstacles;
 const H0=(x,z)=>{bypass=true;const y=H(x,z);bypass=false;return y;};
 const exMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.93,metalness:0});
 const domeMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.96,metalness:0,flatShading:true});
 const inMat=new T.MeshBasicMaterial({vertexColors:true,fog:false});
 const RT=rockTexture(),dayU={value:new T.Color(0,0,0)};
 const rockMat=shaderize(new T.MeshBasicMaterial({vertexColors:true,fog:false,side:T.DoubleSide}),{tex:RT,scale:.22,str:.6}),rockDayMat=shaderize(new T.MeshBasicMaterial({vertexColors:true,fog:false,side:T.DoubleSide}),{tex:RT,scale:.22,str:.6,day:dayU});
 const propDayMat=shaderize(new T.MeshBasicMaterial({vertexColors:true,fog:false}),{day:dayU});
 const plantMat=new T.MeshBasicMaterial({vertexColors:true,fog:false,side:T.DoubleSide}),plantDayMat=shaderize(new T.MeshBasicMaterial({vertexColors:true,fog:false,side:T.DoubleSide}),{day:dayU});
 shaderize(domeMat,{tex:RT,scale:.16,str:1});
 const crMat=new T.MeshBasicMaterial({vertexColors:true,fog:false});
 const glassIn=new T.MeshBasicMaterial({color:'#ffd690',fog:false}),flameMat=new T.MeshBasicMaterial({color:'#ffb347',fog:false});
 const glassEx=new T.MeshBasicMaterial({color:'#b89a64'});
 const haloTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.5)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new T.CanvasTexture(c);})();
 const halo=(color,size,op)=>{const s=new T.Sprite(new T.SpriteMaterial({map:haloTex,color,transparent:true,opacity:op,blending:T.AdditiveBlending,depthWrite:false}));s.scale.setScalar(size);s.userData.base=size;s.userData.op=op;return s;};
 const FIRE=(()=>{const c=document.createElement('canvas');c.width=64;c.height=128;const g=c.getContext('2d');
  const drop=(w,h,y0,c0,c1)=>{const gr=g.createRadialGradient(32,y0-w*.2,1,32,y0-h*.25,Math.max(w,h*.55));gr.addColorStop(0,c0);gr.addColorStop(1,c1);g.fillStyle=gr;g.beginPath();g.moveTo(32,y0-h);
   g.bezierCurveTo(32+w*.25,y0-h*.7,32+w,y0-h*.45,32+w*.95,y0-w*.25);g.bezierCurveTo(32+w*.9,y0+w*.45,32-w*.9,y0+w*.45,32-w*.95,y0-w*.25);g.bezierCurveTo(32-w,y0-h*.45,32-w*.25,y0-h*.7,32,y0-h);g.fill();};
  drop(27,118,118,'rgba(255,110,25,.95)','rgba(190,30,8,0)');drop(19,88,120,'rgba(255,190,70,1)','rgba(255,110,25,0)');drop(10,52,122,'rgba(255,255,225,1)','rgba(255,215,120,0)');
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;})();
 const objs=[],inter=[];

 for(const s of SITES){
  const R=mkR(s.seed*977+13),root=new T.Group();root.name='Mina · '+s.nome;root.position.set(s.x,s.g,s.z);root.rotation.y=s.rot;scene.add(root);
  const ext=new T.Group();root.add(ext);
  const yL=(lx,lz)=>{const w=s.toW(lx,lz);return H(w.x,w.z)-s.g;};
  const n2=(x,z)=>Math.sin(x*.31+s.seed)*Math.cos(z*.27-s.seed*.7)+.5*Math.sin(x*.73-z*.61+s.seed*1.3);
  const rid=(x,z)=>{let a=0,w=1,f=1;for(let o=0;o<3;o++){a+=w*(1-Math.abs(Math.sin(x*.21*f+s.seed+o*1.3)*Math.cos(z*.19*f-s.seed*.6+o)));w*=.5;f*=2.1;}return a/1.75;};

  /* ===== Colina de rocha facetada ===== */
  {const st=mobile?.9:.6,x0=-MC.rx*1.1,x1=MC.rx*1.1,z0=MC.z-MC.rzB*1.1,z1=MC.z+MC.rzF*1.1,nx=Math.ceil((x1-x0)/st),nz=Math.ceil((z1-z0)/st);
   const pos=new Float32Array((nx+1)*(nz+1)*3),org=new Float32Array((nx+1)*(nz+1)*3),inside=new Uint8Array((nx+1)*(nz+1)),rv=new Float32Array((nx+1)*(nz+1));
   for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const lx=x0+i*st,lz=z0+j*st,r=s.domeR(lx,lz),w=s.toW(lx,lz),base=H0(w.x,w.z)-s.g;let y;const rr=rid(lx,lz);
    if(r>=1)y=base-.8*sm(1,1.08,r);else{const p=Math.pow(1-Math.pow(r,5),.55),top=HT*(1+.12*n2(lx,lz));
     y=base+(top-base)*p+(rr-.5)*2.6*p*(1-p)*4*(lz>PZ-3?.3:1);
     const q=y/1.6,fq=q-Math.floor(q),stp=(Math.floor(q)+sm(.55,1,fq))*1.6;y+=(stp-y)*.5*Math.min(1,p*3)*(r<.97?1:0);}
    const k=j*(nx+1)+i,front=lz>PZ-3&&Math.abs(lx)<4.5;
    org[k*3]=lx;org[k*3+1]=y;org[k*3+2]=lz;
    pos[k*3]=lx+(front?0:N3(lx*.7,y*.5,lz*.7,3)*.17);pos[k*3+1]=y;pos[k*3+2]=lz+(front?0:N3(lx*.7,y*.5,lz*.7,6)*.17);inside[k]=r<1.09?1:0;rv[k]=rr;}
   const idx=[],cut=(a,b,c)=>{const cx=(org[a*3]+org[b*3]+org[c*3])/3,cy=(org[a*3+1]+org[b*3+1]+org[c*3+1])/3,cz=(org[a*3+2]+org[b*3+2]+org[c*3+2])/3;
    return Math.abs(cx)<TW/2+.35&&cy<TH+.45&&cz>PZ-5;};
   for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;if(!(inside[a]||inside[b]||inside[c]||inside[d]))continue;
    if(!cut(a,c,b))idx.push(a,c,b);if(!cut(b,c,d))idx.push(b,c,d);}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
   const nrm=g.attributes.normal,col=new Float32Array(pos.length),tc=new T.Color();
   const P1=new T.Color('#8f959d'),P2=new T.Color('#7a828e'),P3=new T.Color('#9d978a'),DK=new T.Color('#4f5560'),CR=new T.Color('#353a42'),cM=new T.Color('#6e9a48'),cM2=new T.Color('#5a8538'),cE=new T.Color('#86796a');
   for(let k=0;k<pos.length/3;k++){const x=pos[k*3],y=pos[k*3+1],z=pos[k*3+2],ny=nrm.getY(k),nn=n2(x*1.7,z*1.7);
    const sel=.5+.5*Math.sin(x*.23+z*.17+y*.3+s.seed);tc.copy(P1).lerp(sel>.6?P3:P2,Math.abs(sel-.6)*1.6);
    const band=.5+.5*Math.sin(y*1.9+nn*1.4);tc.multiplyScalar(.86+.2*band);
    if(rv[k]<.42)tc.lerp(DK,(.42-rv[k])*2.2);
    if(Math.abs(N3(x*.55,y*.6,z*.55,7))<.09)tc.lerp(CR,.75);
    if(y<.9)tc.lerp(cE,.5*(1-y/.9));
    const moss=ny+.22*nn;if(moss>.7)tc.lerp(moss>.84?cM:cM2,.85);
    tc.multiplyScalar(.92+.16*hash(Math.round(x*2),Math.round(y*2),Math.round(z*2)));
    col[k*3]=tc.r;col[k*3+1]=tc.g;col[k*3+2]=tc.b;}
   g.setAttribute('color',new T.BufferAttribute(col,3));
   const m=new T.Mesh(g,domeMat);m.castShadow=true;m.receiveShadow=true;m.name='Colina da mina';ext.add(m);
   s.domeY=(lx,lz)=>{const i=Math.max(0,Math.min(nx,Math.round((lx-x0)/st))),j=Math.max(0,Math.min(nz,Math.round((lz-z0)/st)));return org[(j*(nx+1)+i)*3+1];};}

  /* ===== Fora: pedras, boca, arco, lamparina, trilhos, vagonete, caixotes ===== */
  const E=Mg(),EC=Mg(),EG=Mg();
  for(let i=0;i<(mobile?12:30);i++){let lx,lz,r;do{lx=(R()-.5)*2*MC.rx*.85;lz=MC.z+(R()-.5)*2*MC.rzB*.85;r=s.domeR(lx,lz);}while(r>.92||(Math.abs(lx)<4.5&&lz>PZ-6));
   const sz=1.1+R()*1.8;rock(E,R,lx,s.domeY(lx,lz)-sz*.55,lz,sz,1.25,.75,1,R()<.5?'#8d96a0':'#958f84',null,.7);}
  for(let i=0;i<(mobile?10:22);i++){const a=R()*TAU,lx=Math.sin(a)*MC.rx*1.0,lz=MC.z+Math.cos(a)*(Math.cos(a)>0?MC.rzF:MC.rzB)*1.0;
   if(Math.abs(lx)<5.5&&lz>PZ-4)continue;const sz=.6+R()*1.1;rock(E,R,lx,yL(lx,lz)+sz*.2,lz,sz,1.15,.75,1,'#8a929b',null,.5);}
  {const ax=TW/2+.95,yc=TH*.62,ry=TH*.6+.4;for(let a=-.15;a<=PI+.15;a+=.24){const r=.55+R()*.25;rock(E,R,Math.cos(a)*ax,yc+Math.sin(a)*ry,PZ+.35+R()*.15,r,1,.9,.8,'#8f97a1',null,.45);}
   for(const sx of [-1,1])for(let y=.3;y<yc;y+=.75){const r=.6+R()*.25;rock(E,R,sx*(ax+R()*.15),y,PZ+.35+R()*.2,r,.9,1,.85,'#8a929b',null,.3);}
   for(const sx of [-1,1]){rock(E,R,sx*(ax+1.2),.3,PZ+.9,1.1+R()*.3,1,.8,1,'#858e98',null,.5);rock(E,R,sx*(ax+.6),.15,PZ+1.4,.55,1,.7,1,'#8a929b',null,.4);}}
  {const C=new T.Group();ext.add(C);const blk=(x0,x1,y0,y1,z0,z1)=>{const gg=new T.BoxGeometry(x1-x0,y1-y0,z1-z0,4,6,2),p=gg.attributes.position;
    for(let i=0;i<p.count;i++){const X=p.getX(i)+(x0+x1)/2,Y=p.getY(i)+(y0+y1)/2,Z=p.getZ(i)+(z0+z1)/2,inner=Math.abs(Math.abs(X)-TW/2-.05)<.12||Math.abs(Y-TH-.05)<.12;
     p.setXYZ(i,X+(inner?0:.18*N3(X,Y,Z,3)),Y+(inner?0:.12*N3(Y,Z,X,5)),Z+(Z>PZ?.2*N3(X*1.3,Y*1.3,1,7):0));}
    gg.computeVertexNormals();const cl=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const v=.3+.06*N3(p.getX(i)*2,p.getY(i)*2,p.getZ(i)*2,9);cl[i*3]=v;cl[i*3+1]=v*.99;cl[i*3+2]=v*1.02;}
    gg.setAttribute('color',new T.BufferAttribute(cl,3));const m=new T.Mesh(gg,domeMat);m.castShadow=true;m.receiveShadow=true;C.add(m);};
   blk(-5,-TW/2-.05,-.4,TH+.05,PZ-1.4,PZ+.5);blk(TW/2+.05,5,-.4,TH+.05,PZ-1.4,PZ+.5);blk(-5,5,TH+.05,6,PZ-1.4,PZ+.5);}
  const WD='#7b4a2a',WD2='#6a3f23';
  for(const sx of [-1,1]){log(E,[sx*(TW/2+.05),-.2,PZ+.05],[sx*(TW/2+.05),TH+.15,PZ+.05],.22,WD,8);log(E,[sx*(TW/2+.05),TH-.8,PZ+.05],[sx*(TW/2-.75),TH+.12,PZ+.05],.09,WD2);}
  log(E,[-(TW/2+.7),TH+.32,PZ+.05],[TW/2+.7,TH+.38,PZ+.05],.26,WD,8);log(E,[-(TW/2+.3),TH+.75,PZ-.1],[TW/2+.35,TH+.72,PZ-.1],.18,WD2,7);
  const LX=TW/2+1.6,LZ=PZ+1.5,ly=yL(LX,LZ);
  log(E,[LX,ly-.2,LZ],[LX,ly+2.75,LZ],.1,WD);log(E,[LX,ly+2.6,LZ],[LX-.62,ly+2.62,LZ],.05,'#2a2422',5);log(E,[LX,ly+2.15,LZ],[LX-.38,ly+2.6,LZ],.03,'#2a2422',4);
  const exLamp=lantern(E,EG,LX-.58,ly+2.55,LZ,1.15);
  rails(E,PZ+.4,PZ+9,z=>yL(0,z),.6);
  const cz=PZ+6.6,cy=yL(0,cz);hollowCart(E,EC,R,0,cy+.08,cz,(R()-.5)*.06,true);
  box(E,1.1,.5,.4,'#5a3a22',mat(0,yL(0,PZ+9.1)+.25,PZ+9.1));
  {const x=TW/2+2.6,z=PZ+3.2,y=yL(x,z);crate(E,x,y,z,.8,.3);crate(E,x+.15,y+.8,z+.05,.62,.7);crate(E,x+.9,y,z+.6,.7,-.2);
   const bx=-(TW/2+2.2),bz=PZ+2.6,by=yL(bx,bz);barrel(E,bx,by,bz);
   log(E,[x-.55,y,z-.6],[x-.42,y+1.05,z-.48],.035,'#8a6a42',5);log(E,[x-.62,y+1.0,z-.5],[x-.2,y+1.12,z-.45],.05,'#5a5d63',5);
   const ox=-(TW/2+1.6),oz=PZ+5,oy=yL(ox,oz);for(let k=0;k<6;k++)rock(E,R,ox+(R()-.5)*1.2,oy+.1,oz+(R()-.5)*1.2,.25+R()*.2,1,.7,1,'#7d8692',null,0,0);
   cluster(EC,R,ox,oy,oz,.9,0,0);
   if(O){const w1=s.toW(x+.3,z+.2);O.addCircle(w1.x,w1.z,.85);const w2=s.toW(bx,bz);O.addCircle(w2.x,w2.z,.45);const w3=s.toW(LX,LZ);O.addCircle(w3.x,w3.z,.18);
    const w4=s.toW(0,cz);O.addBox({x:w4.x,z:w4.z,hw:.65,hd:.85,rot:s.rot});const w5=s.toW(ox,oz);O.addCircle(w5.x,w5.z,.7);}}
  {const m=new T.Mesh(E.build(),exMat);m.castShadow=true;m.receiveShadow=true;ext.add(m);ext.add(new T.Mesh(EC.build(),crMat));ext.add(new T.Mesh(EG.build(),glassEx));}
  const exHalo=halo('#ffc070',2.2,0);exHalo.position.set(exLamp[0],exLamp[1],exLamp[2]);ext.add(exHalo);

  /* ===== Trilha de terra até a estrada ===== */
  {const a=s.toW(0,PZ+.2),b=s.toW(0,PZ+9.4),e={x:s.road[0],z:s.road[1]},pts=[];
   const L1=Math.hypot(b.x-a.x,b.z-a.z),L2=Math.hypot(e.x-b.x,e.z-b.z);
   for(let d=0;d<=L1;d+=.8)pts.push({x:a.x+(b.x-a.x)*d/L1,z:a.z+(b.z-a.z)*d/L1,w:5.2-d/L1*2.4});
   for(let d=.8;d<=L2;d+=1){const t=d/L2,wob=Math.sin(t*PI*2+s.seed)*1.2*Math.sin(t*PI);pts.push({x:b.x+(e.x-b.x)*t+(-(e.z-b.z)/L2)*wob,z:b.z+(e.z-b.z)*t+((e.x-b.x)/L2)*wob,w:2.3});}
   const P=[],C=[],ix=[],c0=new T.Color('#b59b74'),c1=new T.Color('#9a8460'),tc=new T.Color();
   for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[Math.min(pts.length-1,i+1)],o=pts[Math.max(0,i-1)];let dx=q.x-o.x,dz=q.z-o.z;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
    for(const k of [-1,-.45,.45,1]){const jw=k*p.w/2*(1+(Math.abs(k)===1?.12*Math.sin(i*1.7+k):0)),x=p.x-dz*jw,z=p.z+dx*jw;P.push(x,H(x,z)+.07,z);
     tc.copy(c0).lerp(c1,Math.abs(k)===1?.6:.15*(.5+.5*Math.sin(i*.9)));C.push(tc.r,tc.g,tc.b);}}
   for(let i=0;i<pts.length-1;i++)for(let k=0;k<3;k++){const a0=i*4+k,b0=a0+1,c=a0+4,d=c+1;ix.push(a0,c,b0,b0,c,d);}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.setIndex(ix);g.computeVertexNormals();
   const m=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));m.receiveShadow=true;m.name='Trilha da mina';scene.add(m);}

  /* ===== Planta da dungeon (já vale para colisão e câmera; a malha é feita ao se aproximar) ===== */
  const LY=makeLayout(s);s.L=LY;s.plat=[];
  const fades=[{x:0,z:PZ,y:0,r:3.2,portal:true}];
  for(const q of LY.secrets)fades.push({x:q.x,z:q.z,y:q.y,r:1.8});fades.push({x:LY.gate.x,z:LY.gate.z,y:-18,r:4.2});
  s.D=(x,y,z)=>{let f=1;for(const q of fades){if(Math.abs(y-q.y)>6)continue;
    if(q.portal){if(z>PZ-q.r)f*=Math.max(0,(PZ-.2-z)/(q.r-.2));}else{const d=Math.hypot(x-q.x,z-q.z);if(d<q.r)f*=sm(q.r*.45,q.r,d);}}
   if(f<=0)return [0,0,0];const a=.3*f,b=.15*f,c=.1*f,e=.05*f;
   // estratos: faixas de rocha que saem/entram da parede em degraus, com espessura variando
   const sy=y*1.15+.6*N3(x*.2,0,z*.2,3),fr=sy-Math.floor(sy),st=.17*f*(sm(.05,.2,fr)-sm(.72,.9,fr))*(.6+.4*N3(x*.4,Math.floor(sy),z*.4,6));
   // blocos: degraus verticais (fraturas)
   const bk=.1*f*Math.sign(N3(x*.55,y*.15,z*.55,14));
   return [a*N3(x*.32,y*.35,z*.32,1)+b*N3(x*1.05,y*1.1,z*1.05,4)+c*N3(x*2.6,y*2.4,z*2.6,8)+e*N3(x*4.3,y*4.1,z*4.3,10)+st+bk,
    .07*f*N3(x*.5,y*.4,z*.5,7)+e*N3(y*4.2,z*4.4,x*4.1,12),
    a*N3(x*.32,y*.35,z*.32,2)+b*N3(x*1.05,y*1.1,z*1.05,5)+c*N3(x*2.6,y*2.4,z*2.6,9)+e*N3(z*4.3,x*4.2,y*4.1,13)+st-bk];};
  objs.push({s,root,ext,exHalo,exLamp,levels:[],flick:[],sparks:[],built:false});
  const W3=(lx,ly,lz)=>{const w=s.toW(lx,lz);return {x:w.x,y:s.g+ly,z:w.z};};
  s.dungeon={levels:LVF.map((y,i)=>({nome:LNAME[i],y:s.g+y})),
   arenas:LY.rooms.filter(r=>/^arena/.test(r.name)).map(r=>Object.assign({nome:r.name,rx:r.rx,rz:r.rz},W3(r.x,r.y,r.z))),
   boss:Object.assign({r:6},W3(LY.MX(9),-18,2)),entrada:W3(0,0,PZ-2)};
 }

 /* ================= Malha da dungeon ================= */
 const PALS=[{w:[.47,.5,.6],f:[.56,.48,.36],c:[.33,.36,.45],moss:true},{w:[.44,.48,.6],f:[.46,.44,.42],c:[.3,.33,.43],moss:true},{w:[.45,.42,.56],f:[.37,.35,.41],c:[.27,.25,.32],moss:false}];
 function buildDungeon(o){
  const s=o.s,LY=s.L,R=mkR(s.seed*53+5),MX=LY.MX,D=s.D,K=mobile?3:6,sub=GC/K;
  const lvGroups=[0,1,2].map(L=>{const g=new T.Group();g.name='Mina · '+LNAME[L];o.root.add(g);return g;});o.levels=lvGroups;
  const lights=[[],[],[]],PR=[Mg(),Mg(),Mg()],PC=[Mg(),Mg(),Mg()],PG=[Mg(),Mg(),Mg()],FL=[Mg(),Mg(),Mg()],pendingBakes=[];
  const WD='#7b4a2a',WD2='#6a3f23';
  const cellsL=L=>LY.all.filter(c=>c.L===L);
  const x0c=c=>GX0+c.I*GC,z0c=c=>GZ0+c.J*GC;
  const wallPt=(c,sd,t,h,out)=>{const x0=x0c(c),z0=z0c(c);let x,z,fl,nx=0,nz=0;
   if(sd===0){x=x0;z=z0+t*GC;fl=c.y[0]+(c.y[2]-c.y[0])*t;nx=1;}else if(sd===1){x=x0+GC;z=z0+t*GC;fl=c.y[1]+(c.y[3]-c.y[1])*t;nx=-1;}
   else if(sd===2){x=x0+t*GC;z=z0;fl=c.y[0]+(c.y[1]-c.y[0])*t;nz=1;}else{x=x0+t*GC;z=z0+GC;fl=c.y[2]+(c.y[3]-c.y[2])*t;nz=-1;}
   const y=fl+h,d=D(x,y,z);return {x:x+d[0]+nx*(out||0),y:y+d[1],z:z+d[2]+nz*(out||0),nx,nz,fl,top:fl+c.ceil+D(x,fl+c.ceil,z)[1]};};
  const walls=(L,room)=>{const r=[];for(const c of cellsL(L)){if(room&&c.room!==room)continue;for(let sd=0;sd<4;sd++)if(!c.nb[sd]&&!(c.portal&&sd===3))r.push({c,sd});}return r;};
  const pick=(arr,n)=>{const a=arr.slice(),out=[];while(a.length&&out.length<n){const i=Math.floor(R()*a.length);out.push(a.splice(i,1)[0]);}return out;};
  const spaced=(arr,n,minD)=>{const out=[];for(const w of pick(arr,arr.length)){const p=wallPt(w.c,w.sd,.5,0);if(out.every(q=>{const pq=wallPt(q.c,q.sd,.5,0);return Math.hypot(p.x-pq.x,p.z-pq.z)>minD;}))out.push(w);if(out.length>=n)break;}return out;};
  const addLight=(L,x,y,z,c,k,f)=>lights[L].push({x,y,z,c,k,f,r2:(k/.015-1)/f});
  const obst=(L,lx,lz,r)=>{if(!O)return;const w=s.toW(lx,lz),y=s.g+LVF[L];O.addCircle(w.x,w.z,r,{ymin:y-4,ymax:y+4.5});};
  const cellAtL=(L,lx,lz)=>{const I=Math.floor((lx-GX0)/GC),J=Math.floor((lz-GZ0)/GC);return LY.get(I,J).find(c=>c.L===L&&!c.stair);};
  const fl0=(L,x,z)=>{const c=cellAtL(L,x,z);return c?bil(c.y,(x-x0c(c))/GC,(z-z0c(c))/GC)-LVF[L]:0;};
  const torch=(L,w,h)=>{const p=wallPt(w.c,w.sd,.5,h||2.05,.06),B=PR[L];
   box(B,.1,.08,.34,'#2c2a2e',mat(p.x+p.nx*.12,p.y-.25,p.z+p.nz*.12,0,Math.atan2(p.nx,p.nz)));
   log(B,[p.x+p.nx*.05,p.y-.42,p.z+p.nz*.05],[p.x+p.nx*.3,p.y+.05,p.z+p.nz*.3],.045,'#6a4a2a',5);
   log(B,[p.x+p.nx*.29,p.y,p.z+p.nz*.29],[p.x+p.nx*.31,p.y+.1,p.z+p.nz*.31],.07,'#3a2a1c',6);
   const fx=p.x+p.nx*.31,fy=p.y+.22,fz=p.z+p.nz*.31;fire(L,fx,fy-.1,fz,.5);
   const h1=halo('#ff9a40',1.6,.75);h1.position.set(fx,fy+.02,fz);lvGroups[L].add(h1);o.flick.push(h1);
   addLight(L,fx,fy,fz,[1,.58,.26],1.25,.26);};
  const fires=o.fires=[];
  const fire=(L,x,y,z,sz)=>{const g=new T.Group();g.position.set(x,y,z);lvGroups[L].add(g);const sp=[];
   for(const [w,h,op,dx] of [[.62,1.25,.85,0],[.42,.95,.95,.06],[.3,.7,1,-.05]]){const m=new T.Sprite(new T.SpriteMaterial({map:FIRE,transparent:true,opacity:op,blending:T.AdditiveBlending,depthWrite:false,fog:false}));
    m.center.set(.5,.06);m.position.x=dx*sz;g.add(m);sp.push({m,w:w*sz,h:h*sz,ph:R()*TAU,dx:dx*sz});}
   fires.push({g,sp,x,y,z,sz,L});};
  const brazier=(L,x,z)=>{const y=LVF[L],B=PR[L];
   for(let k=0;k<3;k++){const a=k/3*TAU;log(B,[x+Math.cos(a)*.35,y,z+Math.sin(a)*.35],[x+Math.cos(a)*.12,y+.85,z+Math.sin(a)*.12],.04,'#2c2a2e',5);}
   B.add(new T.CylinderGeometry(.5,.28,.32,10,1,true),'#3a3436',mat(x,y+1.0,z));B.add(new T.CylinderGeometry(.42,.42,.06,10),'#2a1a10',mat(x,y+1.02,z));
   fire(L,x,y+1.04,z,1.15);for(let k=0;k<5;k++)rock(B,R,x+(R()-.5)*.45,y+1.06,z+(R()-.5)*.45,.1+R()*.06,1,.6,1,'#2a2224',null,0,0);
   const h1=halo('#ff8a30',3,.85);h1.position.set(x,y+1.45,z);lvGroups[L].add(h1);o.flick.push(h1);addLight(L,x,y+1.5,z,[1,.55,.22],2,.16);obst(L,x,z,.55);};
  const wallCrystals=(L,room,n,pal)=>{for(const w of pick(walls(L,room),n)){const h=.2+R()*1.8,p=wallPt(w.c,w.sd,.5,h,-.05);
   cluster(PC[L],R,p.x,p.y,p.z,.6+R()*.6,p.nx*1.6,p.nz*1.6,pal);addLight(L,p.x+p.nx*.4,p.y+.5,p.z+p.nz*.4,pal===PAL_PURP?[.7,.3,1]:[.3,.7,1.1],.9,.18);}};
  const floorCrystal=(L,x,z,size,pal)=>{const y=LVF[L]+fl0(L,x,z);cluster(PC[L],R,x,y,z,size,0,0,pal);addLight(L,x,y+size*.7,z,pal===PAL_PURP?[.7,.3,1]:[.3,.7,1.1],1.3*size,.14);obst(L,x,z,size*.35);};
  const frame=(L,pa,pb)=>{const B=PR[L];log(B,[pa.x,pa.fl-.1,pa.z],[pa.x,pa.top,pa.z],.15,WD);log(B,[pb.x,pb.fl-.1,pb.z],[pb.x,pb.top,pb.z],.15,WD);
   log(B,[pa.x,pa.top-.12,pa.z],[pb.x,pb.top-.12,pb.z],.16,WD);
   const dx=pb.x-pa.x,dz=pb.z-pa.z,l=Math.hypot(dx,dz)||1,ux=dx/l,uz=dz/l;
   log(B,[pa.x,pa.top-.75,pa.z],[pa.x+ux*.6,pa.top-.1,pa.z+uz*.6],.06,WD2);log(B,[pb.x,pb.top-.75,pb.z],[pb.x-ux*.6,pb.top-.1,pb.z-uz*.6],.06,WD2);};
  const hangLamp=(L,x,y,z)=>{log(PR[L],[x,y,z],[x,y-.35,z],.012,'#2a2422',4);const g=lantern(PR[L],PG[L],x,y-.33,z,1.05);addLight(L,g[0],g[1],g[2],[1,.62,.3],.95,.3);
   const h1=halo('#ffb860',1.3,.5);h1.position.set(g[0],g[1],g[2]);lvGroups[L].add(h1);o.flick.push(h1);};
  // escoras nos túneis estreitos, rampas e escadas
  for(const c of LY.all){if(c.kind!=='tunnel'&&c.kind!=='stair'&&c.kind!=='ramp')continue;if(c.room==='entrada')continue;const L=c.L;
   if(!c.nb[0]&&!c.nb[1]&&(c.nb[2]||c.nb[3])&&c.J%2===0){frame(L,wallPt(c,0,.5,0,.1),wallPt(c,1,.5,0,.1));if(R()<.3&&c.kind==='tunnel')hangLamp(L,x0c(c)+1,c.y[0]+c.ceil-.15,z0c(c)+1);}
   else if(!c.nb[2]&&!c.nb[3]&&(c.nb[0]||c.nb[1])&&c.I%2===0){frame(L,wallPt(c,2,.5,0,.1),wallPt(c,3,.5,0,.1));if(R()<.3&&c.kind==='tunnel')hangLamp(L,x0c(c)+1,c.y[0]+c.ceil-.15,z0c(c)+1);}}
  // túnel de entrada (2 células de largura)
  for(const c of cellsL(0)){if(c.room!=='entrada'||c.J%2!==1||c.nb[0]||!c.nb[1])continue;const d=c.nb[1];
   frame(0,wallPt(c,0,.5,0,.1),wallPt(d,1,.5,0,.1));if(c.J%4===1)hangLamp(0,x0c(c)+GC+.9,TH-.1,z0c(c)+1);}
  // degraus de pedra nas escadas
  for(const c of LY.all){if(c.kind!=='stair')continue;const x0=x0c(c),z0=z0c(c),B=PR[c.L];if(Math.abs(c.y[0]-c.y[2])<.01)continue;
   const eL=LY.get(c.I-1,c.J).some(q=>q.stair)?.02:.45,eR=LY.get(c.I+1,c.J).some(q=>q.stair)?.02:.45;
   for(let k=0;k<4;k++){const v0=k/4,v1=(k+1)/4,ya=bil(c.y,.5,v0),yb=bil(c.y,.5,v1),top=Math.max(ya,yb),bot=Math.min(ya,yb)-.4;
    box(B,GC+eL+eR,top-bot,.5,R()<.5?'#77716a':'#6c6862',mat(x0+GC/2+(eR-eL)/2,(top+bot)/2,z0+(v0+v1)/2*GC));}}
  // escoramento de madeira nas paredes
  const crib=(L,w)=>{const a=wallPt(w.c,w.sd,0,0,.18),b=wallPt(w.c,w.sd,1,0,.18),B=PR[L],ht=Math.min(3.4,w.c.ceil-.2);
   log(B,[a.x,a.fl-.1,a.z],[a.x,a.fl+ht,a.z],.14,WD);log(B,[b.x,b.fl-.1,b.z],[b.x,b.fl+ht,b.z],.14,WD);
   for(const h of [.7,1.5,2.3])box(B,Math.hypot(b.x-a.x,b.z-a.z)+.3,.22,.08,R()<.5?WD:WD2,mat((a.x+b.x)/2+a.nx*.08,a.fl+h,(a.z+b.z)/2+a.nz*.08,0,Math.atan2(b.x-a.x,b.z-a.z)+PI/2));
   log(B,[a.x,a.fl+ht,a.z],[b.x,b.fl+ht,b.z],.13,WD2);};
  const innerCells=(L,room)=>cellsL(L).filter(c=>c.room===room&&c.nb.every(Boolean));
  // espinho de rocha irregular: anéis de gotejamento, calombos e ponta torta (no lugar do cone liso)
  const spike=(r,h,seed)=>{const g=new T.CylinderGeometry(0,1,1,mobile?8:12,mobile?6:10),p=g.attributes.position;
   for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i)+.5,z=p.getZ(i);const a=Math.atan2(z,x),ring=1+.13*Math.sin(y*19+seed)+.07*Math.sin(y*41+seed*2),lump=1+.18*Math.sin(a*3+seed+y*4)+.09*Math.sin(a*7-seed*1.7+y*9);
    const k=ring*lump*(1-.25*y*y);x*=k*r;z*=k*r;x+=Math.sin(seed)*.18*r*y*y*3;z+=Math.cos(seed*1.3)*.18*r*y*y*3;p.setXYZ(i,x,(y-.5)*h,z);}
   return g;};
  const stalag=(L,room,n)=>{for(const c of pick(innerCells(L,room),n)){const x=x0c(c)+.4+R()*1.2,z=z0c(c)+.4+R()*1.2,y=bil(c.y,(x-x0c(c))/GC,(z-z0c(c))/GC),h=.7+R()*1.4,r=.25+R()*.3;
    PR[L].add(spike(r,h,R()*20),facet(new T.Color(R()<.5?'#7d7a80':'#6f6c75')),mat(x,y+h/2-.05,z,0,R()*TAU));if(R()<.6){const r2=r*.5,h2=h*.45,a=R()*TAU;PR[L].add(spike(r2,h2,R()*20),facet(new T.Color('#75727a')),mat(x+Math.cos(a)*r*1.1,y+h2/2-.05,z+Math.sin(a)*r*1.1,0,R()*TAU));}obst(L,x,z,r+.1);}};
  const stalac=(L,room,n)=>{for(const c of pick(innerCells(L,room),n)){const x=x0c(c)+.3+R()*1.4,z=z0c(c)+.3+R()*1.4,y=bil(c.y,.5,.5)+c.ceil+.25,h=.5+R()*1.3;
    PR[L].add(spike(.12+R()*.2,h,R()*20),facet(new T.Color('#6a6870')),mat(x,y-h/2,z,PI,R()*TAU));}};
  const column=(L,x,z,ceil)=>{const y=LVF[L]+fl0(L,x,z),g=new T.CylinderGeometry(.7,.95,ceil+1,9,7),p=g.attributes.position;
   for(let i=0;i<p.count;i++){const vx=p.getX(i),vy=p.getY(i),vz=p.getZ(i),k=1+.18*N3(vx*2,vy*1.3,vz*2,s.seed);p.setXYZ(i,vx*k,vy,vz*k);}
   PR[L].add(g,(X,Y,Z,nx,ny,nz)=>{const j=.8+.25*hash(nx,ny,nz),c=PALS[L].w;if(Math.abs(N3(X*1.5,Y*1.2,Z*1.5,9))<.08)return lin3([c[0]*.45,c[1]*.45,c[2]*.45]);return lin3([c[0]*j,c[1]*j,c[2]*j]);},mat(x,y+ceil/2-.1,z));obst(L,x,z,1.0);};
  const rubble=(L,x,z,n,sp)=>{const y=LVF[L]+fl0(L,x,z);for(let k=0;k<n;k++)rock(PR[L],R,x+(R()-.5)*sp,y+.05,z+(R()-.5)*sp,.12+R()*.3,1,.7,1,R()<.5?'#77767c':'#6b6a70',null,0,0);};
  const PL=[Mg(),Mg(),Mg()],PB=[Mg(),Mg(),Mg()];
  const boulder=(B,x,y,z,r,sx,sy,sz,L)=>{const g=new T.IcosahedronGeometry(1,mobile?2:3),p=g.attributes.position,o1=R()*10,o2=R()*10;
   for(let i=0;i<p.count;i++){const vx=p.getX(i),vy=p.getY(i),vz=p.getZ(i),k=1+.13*Math.sin(vx*2.1+o1)*Math.cos(vz*1.9+o2)+.07*Math.sin(vy*3.3+o2)+.04*Math.sin(vx*6+vz*5)+.025*Math.sin(vx*11+vy*9+vz*7+o1);p.setXYZ(i,vx*k,vy*k*(vy<0?.8:1),vz*k);}
   chip(p,R,7+Math.floor(R()*6),[.5,.88]);
   // camadas: degraus horizontais finos na pedra (rocha sedimentar)
   {const lay=.18+R()*.12;for(let i=0;i<p.count;i++){const vy=p.getY(i),q=vy/lay,fq=q-Math.floor(q),k=1-.06*sm(.75,.95,fq);p.setX(i,p.getX(i)*k);p.setZ(i,p.getZ(i)*k);}}
   const w=PALS[L].w,j=.66+R()*.16;
   B.add(g,(X,Y,Z,nx,ny,nz)=>{const hh=(Y-y)/(r*sy);let c=[w[0]*j*(1.05+.2*hh),w[1]*j*(1.05+.2*hh),w[2]*j*(1.05+.2*hh)];
    if(ny>.45&&N3(X*1.4,Y,Z*1.4,7)>-.35){const m=Math.min(1,(ny-.45)*2.5);c=[c[0]+(.36-c[0])*m,c[1]+(.56-c[1])*m,c[2]+(.28-c[2])*m];}
    if(Math.abs(N3(X*2.3,Y*2.3,Z*2.3,4))<.05)c=[c[0]*.55,c[1]*.55,c[2]*.55];return lin3(c);},mat(x,y,z,(R()-.5)*.3,R()*TAU,(R()-.5)*.3,r*sx,r*sy,r*sz));};
  const leafGeo=(len,wd)=>{const g=new T.PlaneGeometry(wd,len,1,6),p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i)+len/2,t=y/len;p.setXYZ(i,p.getX(i)*Math.sin(Math.min(1,t*1.15)*PI)*(1-.3*t),y,t*t*len*.55);}return g;};
  const leafCol=(base,tip)=>(X,Y,Z)=>lin3([base[0],base[1],base[2]].map((v,i)=>v+(tip[i]-v)*Math.min(1,Math.max(0,(Y%1+1)%1))));
  const fern=(L,x,y,z,sz)=>{const n=6+Math.floor(R()*4);for(let i=0;i<n;i++){const a=i/n*TAU+R()*.4,len=(.5+R()*.4)*sz,g=leafGeo(len,.2*sz);
    PL[L].add(g,(X,Y,Z)=>{const t=Math.min(1,Math.max(0,(Y-y)/len));return lin3([.16+.2*t,.34+.28*t,.12+.1*t]);},mat(x,y,z,-.25-R()*.3,a,0));}};
  const tuft=(L,x,y,z)=>{for(let i=0;i<5;i++){const a=R()*TAU,h=.25+R()*.3;PL[L].add(leafGeo(h,.05),(X,Y,Z)=>lin3([.2,.42,.16]),mat(x+(R()-.5)*.15,y,z+(R()-.5)*.15,-.15-R()*.3,a,0));}};
  const flower=(L,x,y,z)=>{const h=.18+R()*.15;log(PL[L],[x,y,z],[x,y+h,z],.008,'#3c6a2a',3);PL[L].add(new T.CircleGeometry(.045,5),(X,Y,Z)=>lin3([.62,.78,1]),mat(x,y+h,z,-PI/2+.3,R()*TAU,0));
   PL[L].add(new T.CircleGeometry(.015,5),(X,Y,Z)=>lin3([1,.95,.6]),mat(x,y+h+.003,z,-PI/2+.3,0,0));};
  const vine=(L,p,len)=>{let x=p.x,y=p.y,z=p.z;const n=Math.floor(len/.16);for(let i=0;i<n;i++){y-=.16;x+=p.nx*.01+Math.sin(i*.7)*.012;z+=p.nz*.01+Math.cos(i*.6)*.012;
    log(PL[L],[x,y+.16,z],[x,y,z],.01,'#3a5a2a',3);if(i%2===0){const a=Math.atan2(p.nx,p.nz)+(i%4?1:-1)*.9;PL[L].add(leafGeo(.13,.08),(X,Y,Z)=>lin3([.24+.06*(i%3),.48,.2]),mat(x,y,z,.5,a,PI*.9));}}};
  const bigStalac=(L,x,y,z,len,rad)=>{const g=spike(rad,len,x*3.1+z*1.7);
   const w=PALS[L].w;PR[L].add(g,(X,Y,Z)=>{const t=Math.min(1,Math.max(0,(y-Y)/len));return lin3([w[0]*(.7+.25*t),w[1]*(.7+.25*t),w[2]*(.72+.27*t)]);},mat(x,y-len/2,z,PI,R()*TAU,0));};
  const decorate=(L)=>{
   for(const c of cellsL(L)){if(c.stair||c.ramp)continue;const big=c.kind==='room';
    // estalactites (cachos), sempre acima da cabeça
    const nSt=big?(R()<.75?1+Math.floor(R()*3):0):(R()<.35?1:0);for(let k=0;k<nSt;k++){const x=x0c(c)+.25+R()*1.5,z=z0c(c)+.25+R()*1.5,top=bil(c.y,(x-x0c(c))/GC,(z-z0c(c))/GC)+c.ceil+.62,mx=Math.max(.3,c.ceil-2.3)+.27;
     bigStalac(L,x,top,z,Math.min(mx,.4+R()*(big?2.2:.9)),.1+R()*.22);}}
   for(const w of walls(L)){const c=w.c;if(c.stair||c.ramp)continue;
    if(c.kind==='room'&&R()<.6){if(R()<.45){const t2=R(),p2=wallPt(c,w.sd,t2,0,.18),r2=.22+R()*.25;boulder(PB[L],p2.x,p2.fl+r2*.2,p2.z,r2,1.2,.7,1,L);}const r=(c.ceil>4.5?.7:.5)+R()*(c.ceil>4.5?.6:.35),t=.2+R()*.6,p=wallPt(c,w.sd,t,0,r*.3);boulder(PB[L],p.x,p.fl+r*.3,p.z,r,1.1,.8,1,L);if(r>.75)obst(L,p.x,p.z,r*.55);
     if(L===0||R()<.25){const q=wallPt(c,w.sd,t,0,r*.95+.25);if(R()<.6)fern(L,q.x,q.fl,q.z,.8+R()*.5);else tuft(L,q.x,q.fl,q.z);}}
    else if(c.kind==='tunnel'&&R()<.38){const r=.35+R()*.25,p=wallPt(c,w.sd,.2+R()*.6,0,r*.2);boulder(PB[L],p.x,p.fl+r*.25,p.z,r,1,.75,1,L);}
    if(L===0&&R()<.3){const p=wallPt(c,w.sd,.2+R()*.6,c.ceil-.05,.12);vine(L,p,.8+R()*1.8);}}};
  const LOOT=[()=>'Moedas de ouro ×'+(20+Math.floor(R()*60)),()=>'Poção de vida',()=>'Cristal azul raro',()=>'Pergaminho de magia',()=>'Amuleto de cristal',()=>'Chave antiga'];
  const loot=n=>{const a=[];for(let i=0;i<n;i++)a.push(LOOT[Math.floor(R()*LOOT.length)]);return a;};
  const chest=(L,x,z,ry,lt)=>{const y=LVF[L]+fl0(L,x,z),g=new T.Group();g.position.set(x,y,z);g.rotation.y=ry;lvGroups[L].add(g);
   const B=Mg(),Lid=Mg();box(B,1.0,.5,.62,'#7a4a24',mat(0,.25,0));for(const sx of [-.42,0,.42])box(B,.07,.52,.66,'#3c3c44',mat(sx,.25,0));box(B,1.04,.06,.66,'#c9a24a',mat(0,.5,0));
   Lid.add(new T.CylinderGeometry(.31,.31,1.0,10,1,false,0,PI),facet(new T.Color('#8a5428')),mat(0,0,.31,0,0,PI/2));for(const sx of [-.42,.42])Lid.add(new T.CylinderGeometry(.325,.325,.07,10,1,false,0,PI),'#3c3c44',mat(sx,0,.31,0,0,PI/2));
   box(Lid,.14,.16,.06,'#d8b04a',mat(0,-.02,.64));
   const q={type:'chest',site:s,L,x,y:y+.4,z,label:'Abrir o baú',open:false,t:0,loot:lt,act(){if(q.open)return;q.open=true;q.t=0;
     const items=q.loot.map(f=>f());(window.arcanoInventario=window.arcanoInventario||[]).push(...items);
     getUI().show('✨ <b>Baú aberto!</b><br>'+items.map(i=>'+ '+i).join('<br>'));}};
   const bk=(X,Y,Z,nx,ny,nz)=>bakeFn(L)(X*Math.cos(ry)+Z*Math.sin(ry)+x,Y+y,-X*Math.sin(ry)+Z*Math.cos(ry)+z,nx,ny,nz);
   pendingBakes.push(()=>{g.add(new T.Mesh(B.build(bk),inMat));const piv=new T.Group();piv.position.set(0,.5,-.31);piv.add(new T.Mesh(Lid.build(bk),inMat));g.add(piv);q.lid=piv;});
   q.glow=halo('#ffd060',2.4,0);q.glow.position.set(0,.8,0);g.add(q.glow);
   inter.push(q);obst(L,x,z,.62);return q;};
  const gold=(L,x,z,n)=>{const y=LVF[L]+fl0(L,x,z);for(let k=0;k<n;k++){const a=R()*TAU,r=R()*.6;PC[L].add(new T.CylinderGeometry(.07,.07,.02,8),(X,Y,Z)=>lin3([1,.78+.1*hash(X,Y,Z),.25]),mat(x+Math.cos(a)*r,y+.02+R()*.12*(1-r),z+Math.sin(a)*r,(R()-.5)*.6,0,(R()-.5)*.6));}addLight(L,x,y+.4,z,[1,.8,.3],.5,.4);};

  /* ---- Andar 0: entrada ---- */
  {const B=PR[0];
   rails(B,-6.5,PZ+.4,()=>0,.6,MX(0));box(B,1.1,.5,.35,'#5a3a22',mat(MX(0),.25,-6.8));hollowCart(B,PC[0],R,MX(0),.08,-5,.04,true);
   if(O){const w=s.toW(MX(0),-5);O.addBox({x:w.x,z:w.z,hw:.65,hd:.85,rot:s.rot,ymin:s.g-3,ymax:s.g+4});}
   {const cx=MX(4),cz=-13.6;for(let k=0;k<9;k++){const a=k/9*TAU+R()*.2;boulder(PB[0],cx+Math.cos(a)*1.25,.15,cz+Math.sin(a)*1.25,.38+R()*.15,1.2,.7,1,0);}
    boulder(PB[0],cx,.05,cz,1.05,1,.45,1,0);for(let k=0;k<6;k++){const a=R()*TAU;flower(0,cx+Math.cos(a)*1.9,0,cz+Math.sin(a)*1.9);}cluster(PC[0],R,cx,.5,cz,2.4,0,0);addLight(0,cx,1.6,cz,[.3,.7,1.1],3.2,.1);obst(0,cx,cz,1.45);
    o.crys={x:cx,z:cz};}
   const P1=[[MX(-4.2),-8],[MX(-4.2),-13.5],[MX(5.6),-8.2]];for(const [x,z] of P1){log(B,[x,-.1,z],[x,4.4,z],.17,WD);obst(0,x,z,.25);}
   log(B,[P1[0][0],4.3,-7.4],[P1[1][0],4.3,-14.1],.19,WD);log(B,[P1[0][0],4.45,-8],[P1[2][0],4.45,-8.2],.17,WD2);
   for(const [x,z] of P1.slice(0,2)){const lx=x+MX(.45);log(B,[x,2.75,z],[lx,2.78,z],.035,'#2a2422',4);const g=lantern(B,PG[0],lx,2.7,z,1.05);addLight(0,g[0],g[1],g[2],[1,.62,.3],1.3,.3);const h=halo('#ffb860',1.4,.5);h.position.set(g[0],g[1],g[2]);lvGroups[0].add(h);o.flick.push(h);}
   const ax=MX(-9),az=-6.2;for(let k=0;k<8;k++){const a=k/8*TAU;rock(B,R,ax+Math.cos(a)*.45,.08,az+Math.sin(a)*.45,.14,1,.7,1,'#6a6a70',null,0,0);}
   for(let k=0;k<3;k++){const a=k/3*TAU;log(B,[ax+Math.cos(a)*.4,.08,az+Math.sin(a)*.4],[ax-Math.cos(a)*.1,.3,az-Math.sin(a)*.1],.05,'#4a3020',5);}
   fire(0,ax,.12,az,1);
   {const h=halo('#ff8a30',2.4,.8);h.position.set(ax,.6,az);lvGroups[0].add(h);o.flick.push(h);}addLight(0,ax,.7,az,[1,.55,.22],1.8,.18);obst(0,ax,az,.6);
   crate(B,MX(-10.6),0,-4.9,.75,.3);crate(B,MX(-10.9),0,-5.9,.6,-.2);barrel(B,MX(-7.4),0,-4.6);
   box(B,1.6,.12,.7,'#8a3a32',mat(MX(-9.5),.06,-8,0,.2));box(B,.5,.16,.6,'#c9b48a',mat(MX(-10.1),.12,-7.9,0,.2));
   obst(0,MX(-10.7),-5.3,.7);obst(0,MX(-7.4),-4.6,.42);
   log(B,[MX(-6),0,-14],[MX(-6.2),1.1,-14.2],.035,'#8a6a42',5);log(B,[MX(-6.3),1.05,-14.25],[MX(-5.8),1.15,-14.1],.05,'#5a5d63',5);
   {const lx=MX(-2.2),lz=-16.2;for(const sx of [-.3,.3])log(B,[lx+sx,0,lz+.9],[lx+sx,4.1,lz+.1],.05,'#8a6a42',5);for(let y=.4;y<4.1;y+=.42){const t=y/4.1;log(B,[lx-.3,y,lz+.9-t*.8],[lx+.3,y,lz+.9-t*.8],.03,'#7a5a36',4);}}
   for(const w of spaced(walls(0,'salao'),3,6))torch(0,w);
   decorate(0);decorate(1);decorate(2);wallCrystals(0,'salao',3);for(const w of pick(walls(0,'salao'),2))crib(0,w);rubble(0,MX(5.5),-12,8,1.4);}
  /* ---- Andar 1: galerias ---- */
  {for(const w of spaced(walls(1,'galeria'),5,7))torch(1,w);for(const w of spaced(walls(1,'descida'),2,4))torch(1,w,1.9);
   for(const w of spaced(walls(1,'arenaA1'),4,5))torch(1,w);for(const w of pick(walls(1,'arenaA1'),3))crib(1,w);
   stalag(1,'arenaA1',4);stalac(1,'arenaA1',6);rubble(1,MX(16),-17,10,1.8);
   rails(PR[1],-16,-11.5,()=>-9,.6,MX(10.5));hollowCart(PR[1],null,R,MX(11.6),-9+.6,-14,1.2,false,1.45);obst(1,MX(11.6),-14,.8);
   wallCrystals(1,'arenaA2',9);floorCrystal(1,MX(6),3,1.3);floorCrystal(1,MX(11.5),4.2,1.6);floorCrystal(1,MX(12.5),-.4,.9);stalac(1,'arenaA2',6);
   for(const w of spaced(walls(1,'arenaA3'),3,6))torch(1,w);
   {const xa=MX(-12.5),xb=MX(-9.5),zc=-2.5;for(const x of [xa,xb]){log(PR[1],[x,-11.1,zc],[x,-11+4.3,zc],.18,WD);obst(1,x,zc,.25);}log(PR[1],[xa-MX(.5),-11+4.2,zc],[xb+MX(.5),-11+4.2,zc],.2,WD);}
   stalag(1,'arenaA3',3);rubble(1,MX(-14),-5,8,1.5);
   for(const c of LY.all)if(c.kind==='ramp')rubble(1,x0c(c)+1,z0c(c)+(R()<.5?.4:1.6),3,.6);
   chest(1,MX(-19.6),-31.3,LY.mir?-PI/2:PI/2,loot(2));gold(1,MX(-18),-30,26);wallCrystals(1,'secreta1',3);
   {const g=lantern(PR[1],PG[1],MX(-17.2),-11+.62,-32,1.05);addLight(1,g[0],g[1],g[2],[1,.62,.3],1.2,.3);}}
  /* ---- Andar 2: profundezas ---- */
  {for(const w of spaced(walls(2,'galeria2'),5,7))torch(2,w);
   for(const w of spaced(walls(2,'arenaB1'),4,5))torch(2,w);column(2,MX(-3.5),-14.5,5.5);column(2,MX(2.2),-12.2,5.5);column(2,MX(.5),-16.8,5.5);
   rubble(2,MX(-5),-17,8,1.5);stalac(2,'arenaB1',5);
   wallCrystals(2,'arenaB2',7,PAL_PURP);floorCrystal(2,MX(11),-31,1.4,PAL_PURP);floorCrystal(2,MX(15.5),-28.5,1,PAL_PURP);for(const w of spaced(walls(2,'arenaB2'),2,6))torch(2,w);stalag(2,'arenaB2',3);
   for(const z of [-23,-16.5,-10])for(const x of [6.7,11.3])brazier(2,MX(x),z);
   for(let k=0;k<6;k++){const a=PI*.5+(k-2.5)/6*PI*1.5,x=MX(9+Math.cos(a)*5.2),z=1+Math.sin(a)*4.2,B=PR[2];
    B.add(new T.CylinderGeometry(.5,.55,7.2,10),facet(new T.Color('#6e6878')),mat(x,-18+3.6,z));box(B,1.4,.4,1.4,'#5d5866',mat(x,-18+.2,z));box(B,1.3,.35,1.3,'#5d5866',mat(x,-18+7.1,z));obst(2,x,z,.75);}
   for(const [x,z] of [[3.6,-1.8],[14.4,-1.8],[4.2,4.6],[13.8,4.6]])brazier(2,MX(x),z);
   {const dx=MX(9),dzz=4.4,B=PR[2];[[2.6,.25],[2.1,.5],[1.6,.75]].forEach(([r,h],i)=>{B.add(new T.CylinderGeometry(r,r+.08,.25,20),facet(new T.Color(i%2?'#5f5a68':'#6b6575')),mat(dx,-18+h-.125,dzz));s.plat.push({L:2,x:dx,z:dzz,r:r-.1,h});});
    cluster(PC[2],R,dx,-18+.75,dzz,2.6,0,0,PAL_PURP);addLight(2,dx,-18+2.2,dzz,[.8,.35,1.1],3.4,.09);obst(2,dx,dzz,.9);
    const h=halo('#b070ff',6,.45);h.position.set(dx,-18+2,dzz);lvGroups[2].add(h);o.flick.push(h);}
   chest(2,MX(13.2),5.4,LY.mir?.6:-.6,loot(3));gold(2,MX(14.3),4.6,30);
   chest(2,MX(-18.4),4.6,PI,loot(2));gold(2,MX(-19.5),3.2,22);wallCrystals(2,'secreta2',3,PAL_PURP);
   {const g=lantern(PR[2],PG[2],MX(-16.4),-18+.62,3,1.05);addLight(2,g[0],g[1],g[2],[1,.62,.3],1.2,.3);}}
  /* ---- Portão do chefe ---- */
  {const G=LY.gate,y=-18,B=PR[2],gx=G.x,gz=G.z,hw=2.3,hh=4.6;
   for(const sx of [-1,1]){const px=gx+sx*(hw+.35);box(B,.75,5.2,1.0,'#5d5866',mat(px,y+2.6,gz));for(let k=0;k<5;k++)box(B,.85,.12,1.08,'#4c4855',mat(px,y+.5+k*1.05,gz));
    box(B,.95,.5,1.2,'#4c4855',mat(px,y+.25,gz));}
   box(B,hw*2+1.6,.7,1.1,'#5d5866',mat(gx,y+hh+.35,gz));box(B,hw*2+1.9,.18,1.2,'#4c4855',mat(gx,y+hh+.75,gz));
   for(let k=-2;k<=2;k++)box(B,.5,.5,.12,'#7a7486',mat(gx+k*1.0,y+hh+.35,gz-.56,0,0,PI/4));
   const leaves=[];for(const sx of [-1,1]){const piv=new T.Group();piv.position.set(gx+sx*hw,y,gz);lvGroups[2].add(piv);
    const D2=Mg();for(let k=0;k<5;k++)box(D2,hw/5-.03,hh,.16,k%2?'#6a3f22':'#5a341c',mat(-sx*(hw/10+k*hw/5),hh/2,0));
    for(const yy of [.6,2.3,4.0])box(D2,hw-.05,.16,.2,'#2f2f36',mat(-sx*hw/2,yy,0));
    for(const yy of [.6,2.3,4.0])for(let k=0;k<5;k++)D2.add(new T.SphereGeometry(.045,6,4),'#8a8a96',mat(-sx*(.25+k*hw/5.2),yy,-.11));
    D2.add(new T.TorusGeometry(.14,.03,5,10),'#9a8a5a',mat(-sx*(hw-.35),2.0,-.13));
    pendingBakes.push(()=>{piv.add(new T.Mesh(D2.build((X,Y,Z,nx,ny,nz)=>bakeFn(2)(X+gx+sx*hw,Y+y,Z+gz,nx,ny,nz)),inMat));});leaves.push({piv,sx});}
   G.leaves=leaves;inter.push({type:'gate',site:s,L:2,x:gx,y:y+1.5,z:gz-1.2,label:'Abrir o portão do chefe',open:false,t:0,G,act(){if(this.open)return;this.open=true;this.t=0;getUI().show('O portão range e se abre…<br><b>Sala do Chefe</b>');}});}
  /* ---- Paredes rachadas (salas secretas) ---- */
  for(const q of LY.secrets){const q0=q,L=q.L,y=q.y,h=q.ceil+.3,wid=GC+.7,g=new T.Group();g.position.set(q.x,y,q.z);g.rotation.y=q.axis==='x'?PI/2:0;lvGroups[L].add(g);
   const Bw=Mg(),gg=new T.BoxGeometry(wid,h,.7,10,9,2),p=gg.attributes.position;
   for(let i=0;i<p.count;i++){const X=p.getX(i),Y=p.getY(i),Z=p.getZ(i),k=hash(Math.round(X*8),Math.round(Y*8),Math.round(Z*8));
    p.setXYZ(i,X+(k-.5)*.12,Y+(hash(Math.round(Y*8),Math.round(Z*8),Math.round(X*8))-.5)*.12,Z+.16*N3(X*1.3,Y*1.3,Z,s.seed)+(k-.5)*.1);}
   const pal=PALS[L].w;
   Bw.add(gg,(X,Y,Z,nx,ny,nz)=>{const cr=Math.abs(N3(X*1.5+.3,Y*1.3,Z*.5,9)+.5*N3(Y*2.1,X*1.9,1,4));if(cr<.09)return lin3([.35,.75,1]);
    const j=.78+.3*hash(nx,ny,nz);return lin3([pal[0]*j,pal[1]*j,pal[2]*j]);},mat(0,h/2-.05,0));
   const ry=g.rotation.y;
   pendingBakes.push(()=>{const m=new T.Mesh(Bw.build((X,Y,Z,nx,ny,nz)=>{const q=bakeFn(L)(X*Math.cos(ry)+Z*Math.sin(ry)+q0.x,Y+y,-X*Math.sin(ry)+Z*Math.cos(ry)+q0.z,nx,ny,nz);return [q[0]+.05,q[1]+.05,q[2]+.07];}),inMat);g.add(m);});
   const gl=halo('#6fd0ff',.9,.25);gl.position.set(0,1.1,.45);g.add(gl);o.flick.push(gl);addLight(L,q.x,y+1.2,q.z,[.3,.7,1.1],.45,.5);
   inter.push({type:'secret',site:s,L,x:q.x,y:y+1.2,z:q.z,label:'Parede rachada — empurrar',open:false,t:0,q,g,act(){if(this.open)return;this.open=true;this.t=0;getUI().show('A parede rachada desmorona…<br><b>Passagem secreta!</b>');}});}

  /* ---- Malha das paredes, pisos e tetos ---- */
  const bakeCache=[];
  function bakeFn(L){if(bakeCache[L])return bakeCache[L];const Ls=lights[L],amb=L===0?[.24,.23,.27]:[.18,.19,.25];
   return bakeCache[L]=(x,y,z,nx,ny,nz)=>{let r=amb[0],g=amb[1],b=amb[2];
    for(const q of Ls){const dx=q.x-x,dy=q.y-y,dz=q.z-z,d2=dx*dx+dy*dy+dz*dz;if(d2>q.r2)continue;const d=Math.sqrt(d2)+1e-3,lam=Math.max(.22,(dx*nx+dy*ny+dz*nz)/d*.62+.48),k=q.k/(1+d2*q.f)*lam;r+=k*q.c[0];g+=k*q.c[1];b+=k*q.c[2];}
    const kf=.66+.48*Math.max(0,nx*.33+ny*.72+nz*.6),qz=v=>{v=Math.min(1.12,v*kf);return v*.6+Math.floor(v*6)/6*.4;};return [L22(qz(r)),L22(qz(g)),L22(qz(b))];};}
  const kk=(x,y,z)=>Math.round(x*20)+','+Math.round(y*20)+','+Math.round(z*20);
  function levelMesh(L){const P=[],C=[],seam=new Set(),pal=PALS[L],list=cellsL(L);
   const SPEC=[];for(const c of list)if(!c.stair&&!c.ramp){SPEC.push(c.y[0],c.y[0]+c.ceil);}
   const ylist=(lo,hi)=>{const a=[lo,hi];for(let y=Math.ceil(lo*2+1e-6)/2;y<hi-1e-6;y+=.5)a.push(y);for(const h of SPEC)if(h>lo+1e-6&&h<hi-1e-6)a.push(h);a.sort((p,q)=>p-q);return a.filter((v,i)=>i===0||v-a[i-1]>.015);};
   const tri=(a,b,c,want)=>{const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
    const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,o2=(nx*want[0]+ny*want[1]+nz*want[2])<0?[a,c,b]:[a,b,c];for(const p of o2){P.push(p[0],p[1],p[2]);C.push(p[3],p[4],p[5]);}};
   const grid=(G,nu,nv,want)=>{for(let v=0;v<nv;v++)for(let u=0;u<nu;u++){const a=G[v*(nu+1)+u],b=G[v*(nu+1)+u+1],c=G[(v+1)*(nu+1)+u],d=G[(v+1)*(nu+1)+u+1];tri(a,b,d,want);tri(a,d,c,want);}};
   const vtx=(x,y,z,col,ey)=>{const d=D(x,y,z),X=x+d[0],Y=y+d[1]+(ey||0),Z=z+d[2],c=col(X,Y,Z);return [X,Y,Z,L22(c[0]),L22(c[1]),L22(c[2])];};
   const wallCol=fl=>(X,Y,Z)=>{const h=Y-fl;let [r,g,b]=pal.w;const band=.5+.5*Math.sin(Y*2.4+N3(X*.25,0,Z*.25,2)*2.2);
    const sh=.84+.24*band+.12*(hash(Math.round(X*3),Math.round(Y*3),Math.round(Z*3))-.5);r*=sh;g*=sh;b*=sh;
    const cr=Math.abs(N3(X*.9+3,Y*.8,Z*.9,9)+.6*N3(Z*1.7,X*1.6,Y*1.9,11));if(cr<.1&&N3(X*.4,Y*.45,Z*.4,2)>-.2){const k=.28+cr*5;r*=k;g*=k;b*=k;}
    if(Math.abs(N3(X*.33,Y*.42,Z*.33,12)+.5*N3(Z*.6,Y*.7,X*.6,3))<.04){r*=.3;g*=.3;b*=.34;}
    if(pal.moss&&h<.6&&N3(X*.6,0,Z*.6,13)>.25){const m=(1-h/.6)*.55;r+=(.3-r)*m;g+=(.42-g)*m;b+=(.25-b)*m;}
    if(h<.22){r*=.78;g*=.78;b*=.78;}return [r,g,b];};
   const floorCol=c=>(X,Y,Z)=>{let [r,g,b]=pal.f;const v=.84+.16*N3(X*1.7,0,Z*1.7,14)+.08*(hash(Math.round(X*4),1,Math.round(Z*4))-.5);r*=v;g*=v;b*=v;
    if(pal.moss&&c.room!=='boss'&&c.room!=='antessala'){const m=N3(X*.45,0,Z*.45,21)+.4*N3(X*1.3,0,Z*1.3,22);if(m>.35){const k=Math.min(.75,(m-.35)*2);r+=(.33-r)*k;g+=(.5-g)*k;b+=(.27-b)*k;}}
    if(c.room==='boss'||c.room==='antessala'){const fx=Math.abs(((X/1.6)%1+1)%1-.5),fz=Math.abs(((Z/1.6)%1+1)%1-.5);if(fx>.45||fz>.45){r*=.55;g*=.55;b*=.55;}else{r=r*.8+.08;g=g*.8+.07;b=b*.8+.1;}}
    return [r,g,b];};
   const ceilCol=(X,Y,Z)=>{let [r,g,b]=pal.c;const v=.8+.25*(.5+.5*N3(X*.7,Y*.5,Z*.7,15));if(Math.abs(N3(X*.9,Y,Z*.9,16))<.06)return [r*.45,g*.45,b*.45];return [r*v,g*v,b*v];};
   for(const c of list){const x0=x0c(c),z0=z0c(c),x1=x0+GC,z1=z0+GC,yb=c.y,low=c.kind==='stair'?.4:0;
    for(let sd=0;sd<4;sd++){if(c.portal&&sd===3)continue;const nb=c.nb[sd];let ax,az,bx,bz,fa,fb,want,na,nbb;
     if(sd===0){ax=x0;az=z0;bx=x0;bz=z1;fa=yb[0];fb=yb[2];want=[1,0,0];if(nb){na=nb.y[1];nbb=nb.y[3];}}
     else if(sd===1){ax=x1;az=z0;bx=x1;bz=z1;fa=yb[1];fb=yb[3];want=[-1,0,0];if(nb){na=nb.y[0];nbb=nb.y[2];}}
     else if(sd===2){ax=x0;az=z0;bx=x1;bz=z0;fa=yb[0];fb=yb[1];want=[0,0,1];if(nb){na=nb.y[2];nbb=nb.y[3];}}
     else{ax=x0;az=z1;bx=x1;bz=z1;fa=yb[2];fb=yb[3];want=[0,0,-1];if(nb){na=nb.y[0];nbb=nb.y[1];}}
     if(!nb){const flat=Math.abs(fa-fb)<1e-6&&!low,YL=flat?ylist(fa,fa+c.ceil):null,nv=flat?YL.length-1:Math.max(2,Math.round((c.ceil+low)/.5)),G=[];
      for(let v=0;v<=nv;v++)for(let u=0;u<=K;u++){const t=u/K,fl=fa+(fb-fa)*t-low,y=flat?YL[v]:fl+(c.ceil+low)*v/nv,x=ax+(bx-ax)*t,z=az+(bz-az)*t;if(v===nv)seam.add(kk(x,y,z));G.push(vtx(x,y,z,wallCol(fl+low)));}
      grid(G,K,nv,want);}
     else{const tA=fa+c.ceil,tB=fb+c.ceil,nA=na+nb.ceil,nB=nbb+nb.ceil;
      if(nA<tA-.05||nB<tB-.05){const flat=Math.abs(nA-nB)<1e-6&&Math.abs(tA-tB)<1e-6,YL=flat?ylist(nA,tA):null,nv=flat?YL.length-1:Math.max(1,Math.round(Math.max(tA-nA,tB-nB)/.5)),G=[];
       for(let v=0;v<=nv;v++)for(let u=0;u<=K;u++){const t=u/K,lo=nA+(nB-nA)*t,hi=Math.max(lo,tA+(tB-tA)*t),y=flat?YL[v]:lo+(hi-lo)*v/nv,x=ax+(bx-ax)*t,z=az+(bz-az)*t;
        if(v===0||v===nv)seam.add(kk(x,y,z));G.push(vtx(x,y,z,wallCol(fa+(fb-fa)*t)));}
       grid(G,K,nv,want);}}}}
   for(const c of list){const x0=x0c(c),z0=z0c(c),low=c.kind==='stair'?.4:0,G=[];
    for(let v=0;v<=K;v++)for(let u=0;u<=K;u++){const x=x0+u*sub,z=z0+v*sub,y=bil(c.y,u/K,v/K)-low,inner=u>0&&u<K&&v>0&&v<K;G.push(vtx(x,y,z,floorCol(c),inner?.07*N3(x*.8,0,z*.8,6):0));}
    grid(G,K,K,[0,1,0]);}
   for(const c of list){const x0=x0c(c),z0=z0c(c),G=[];
    for(let v=0;v<=K;v++)for(let u=0;u<=K;u++){const x=x0+u*sub,z=z0+v*sub,y=bil(c.y,u/K,v/K)+c.ceil;let up=0;
     if(!seam.has(kk(x,y,z)))up=.55*(.5+.5*N3(x*.5,0,z*.5,8))*(L===0&&z>PZ-3?Math.max(0,(PZ-.3-z)/2.7):1);G.push(vtx(x,y,z,ceilCol,up));}
    grid(G,K,K,[0,-1,0]);}
   const NR=new Float32Array(P.length),DY=L===0?new Float32Array(P.length/3):null,ALB=L===0?new Float32Array(C):null;
   const bk=bakeFn(L);for(let i=0;i<P.length;i+=9){const ux=P[i+3]-P[i],uy=P[i+4]-P[i+1],uz=P[i+5]-P[i+2],vx=P[i+6]-P[i],vy=P[i+7]-P[i+1],vz=P[i+8]-P[i+2];
    let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
    for(let k=0;k<3;k++){const j=i+k*3,q=bk(P[j],P[j+1],P[j+2],nx,ny,nz);C[j]*=q[0];C[j+1]*=q[1];C[j+2]*=q[2];NR[j]=nx;NR[j+1]=ny;NR[j+2]=nz;if(DY)DY[j/3]=dayK(P[j],P[j+1],P[j+2],nx,ny,nz);}}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.setAttribute('normal',new T.BufferAttribute(NR,3));if(DY){g.setAttribute('aDay',new T.BufferAttribute(DY,1));g.setAttribute('aAlb',new T.BufferAttribute(ALB,3));}g.computeBoundingSphere();
   const m=new T.Mesh(g,L===0?rockDayMat:rockMat);m.name='Rocha · '+LNAME[L];return m;}
  // brilhos subindo do cristal do salão
  {const NS=mobile?20:40,sp=new Float32Array(NS*3),seeds=[];for(let i=0;i<NS;i++)seeds.push([R()*TAU,.4+R()*2,R()*4,.15+R()*.3]);
   const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(sp,3));
   const pts=new T.Points(sg,new T.PointsMaterial({color:'#aef0ff',size:.09,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false}));pts.frustumCulled=false;lvGroups[0].add(pts);
   o.sparks.push({pts,sp,seeds,NS,x:o.crys.x,z:o.crys.z,y:.6});}
  // feixes de sol entrando pela boca (intensidade vem da luz de fora)
  {const c=document.createElement('canvas');c.width=32;c.height=128;const g=c.getContext('2d'),gr=g.createLinearGradient(0,128,0,0);
   gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.5,'rgba(255,255,255,.45)');gr.addColorStop(.86,'rgba(255,255,255,.85)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,32,128);
   g.globalCompositeOperation='destination-in';const gx=g.createLinearGradient(0,0,32,0);gx.addColorStop(0,'rgba(0,0,0,0)');gx.addColorStop(.5,'rgba(0,0,0,1)');gx.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gx;g.fillRect(0,0,32,128);
   const mt=new T.MeshBasicMaterial({map:new T.CanvasTexture(c),color:'#fff0c4',transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,fog:false});
   const dir=new T.Vector3(0,3.6,4.6).normalize();
   for(let k=0;k<5;k++){const pl=new T.Mesh(new T.PlaneGeometry(.6+R()*.9,7.2),mt);pl.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir);pl.rotateY(R()*PI);
    pl.position.set((R()-.5)*2.6,1.7,PZ-2.4);lvGroups[0].add(pl);}
   o.rayMat=mt;}
  // monta um andar por vez (evita travar o jogo)
  let L=0;const step=()=>{if(L>2){for(const f of pendingBakes)f();o.ready=true;return;}
   const g=lvGroups[L];g.add(levelMesh(L));const bk=bakeFn(L);g.add(new T.Mesh(PR[L].build(bk,L===0?dayK:null),L===0?propDayMat:inMat));g.add(new T.Mesh(PC[L].build(),crMat));g.add(new T.Mesh(PG[L].build(),glassIn));g.add(new T.Mesh(PL[L].build(bk,L===0?dayK:null),L===0?plantDayMat:plantMat));g.add(new T.Mesh(PB[L].build(bk,L===0?dayK:null),L===0?rockDayMat:rockMat));
   L++;setTimeout(step,30);};step();
 }

 /* ================= Piso, paredes, câmera ================= */
 const pY=()=>{const p=api.getGrassPlayer&&api.getGrassPlayer();return p?p.position.y:0;};
 const findCell=(s,lx,lz,yr,tol)=>{const I=Math.floor((lx-GX0)/GC),J=Math.floor((lz-GZ0)/GC);if(I<0||J<0||I>=GN||J>=GN)return null;
  let best=null,bd=tol||1.7;for(const c of s.L.get(I,J)){const f=bil(c.y,(lx-GX0)/GC-I,(lz-GZ0)/GC-J),d=Math.abs(f-yr);if(d<bd){bd=d;best=c;}}return best;};
 // piso sob o jogador: o mais alto que fica abaixo dos pés (até 7 m) — pular ou cair não solta das paredes
 const cellUnder=(s,lx,lz,yr)=>{const I=Math.floor((lx-GX0)/GC),J=Math.floor((lz-GZ0)/GC);if(I<0||J<0||I>=GN||J>=GN)return null;
  let best=null,bf=-1e9;for(const c of s.L.get(I,J)){const f=bil(c.y,(lx-GX0)/GC-I,(lz-GZ0)/GC-J);if(f<=yr+.75&&yr-f<7&&f>bf){bf=f;best=c;}}return best||findCell(s,lx,lz,yr);};
 const platH=(s,c,lx,lz)=>{let h=0;for(const p of s.plat)if(p.L===c.L&&Math.hypot(lx-p.x,lz-p.z)<p.r)h=Math.max(h,p.h);return h;};
 const floorAt=(s,c,lx,lz)=>bil(c.y,(lx-GX0)/GC-c.I,(lz-GZ0)/GC-c.J)+(c.kind==='stair'?.1:0)+platH(s,c,lx,lz);
 const passable=(c,sd)=>{if(c.nb[sd]){const d=c.door[sd];if(!d)return true;return d.open&&d.t>(d.leaves?.5:.4);}return sd===3&&!!c.portal;};
 (window.arcanoExtraDecks=window.arcanoExtraDecks||[]).push({surfaceAt(x,z){const py=pY();for(const s of SITES){if(!s.L)continue;const dx=x-s.x,dz=z-s.z;if(dx*dx+dz*dz>2600)continue;
   const t=s.toL(x,z),c=cellUnder(s,t.x,t.z,py-s.g);if(c)return s.g+floorAt(s,c,t.x,t.z)+.02;}return null;},blocksSegment(){return false;}});
 const cellBlocked=(s,f,t,yr)=>{const cf=cellUnder(s,f.x,f.z,yr);
  if(!cf){if(yr<-1.5&&f.x>GX0-2&&f.x<GX0+GN*GC+2&&f.z>GZ0-2&&f.z<GZ0+GN*GC+2)return !cellUnder(s,t.x,t.z,yr); // perdido no subsolo: só volta para uma célula
   if(s.domeR(t.x,t.z)<1){if(Math.abs(t.x)<TW/2-.3&&t.z>PZ-1.6&&Math.abs(yr)<1.6)return false;const ct=findCell(s,t.x,t.z,yr,1.2);return !(ct&&ct.L===0&&ct.room==='entrada');}return false;}
  const ct=cellUnder(s,t.x,t.z,yr);
  if(!ct)return !(cf.portal&&t.z>=PZ-.05);
  if(ct!==cf){const di=ct.I-cf.I,dj=ct.J-cf.J;
   if(Math.abs(di)+Math.abs(dj)===1){const sd=di===1?1:di===-1?0:dj===1?3:2;if(cf.nb[sd]!==ct||!passable(cf,sd))return true;}
   else return true;}
  const m=.42,u=t.x-(GX0+ct.I*GC),v=t.z-(GZ0+ct.J*GC),uf=f.x-(GX0+ct.I*GC),vf=f.z-(GZ0+ct.J*GC);
  const dT=[u,GC-u,v,GC-v],dF=[uf,GC-uf,vf,GC-vf];
  for(let sd=0;sd<4;sd++)if(!passable(ct,sd)&&dT[sd]<m&&dT[sd]<dF[sd]-1e-6)return true;
  return false;};
 if(O){const ob=O.blocked;O.blocked=function(fx,fz,tx,tz){for(const s of SITES){if(!s.L)continue;const dx=tx-s.x,dz=tz-s.z;if(dx*dx+dz*dz>2600)continue;
   if(cellBlocked(s,s.toL(fx,fz),s.toL(tx,tz),pY()-s.g))return true;}return ob.call(this,fx,fz,tx,tz);};}
 const tmpF=new T.Vector3(),q3=new T.Vector3();
 const mineCam=(focus,cam)=>{for(const s of SITES){if(!s.L)continue;const dx=focus.x-s.x,dz=focus.z-s.z;if(dx*dx+dz*dz>2600)continue;
   const f=s.toL(focus.x,focus.z),fy=focus.y-s.g,cf=cellUnder(s,f.x,f.z,pY()-s.g),inside=!!cf&&!(cf.portal&&f.z>PZ-.4);
   const okIn=(x,y,z)=>{const c=findCell(s,x,z,y-1.2,2.6);if(!c)return false;const fl=floorAt(s,c,x,z);if(y<fl+.3||y>fl+c.ceil-.3)return false;
    const u=x-(GX0+c.I*GC),v=z-(GZ0+c.J*GC),d=[u,GC-u,v,GC-v];for(let sd=0;sd<4;sd++)if(!passable(c,sd)&&d[sd]<.3)return false;return Math.abs(fl-fy)<6;};
   const ok=(x,y,z)=>{if(inside)return okIn(x,y,z)||(z>PZ+.2&&cf.L===0&&y>-.5);if(s.domeR(x,z)>=1)return true;if(okIn(x,y,z))return true;return y>s.domeY(x,z)+.4;};
   const c=s.toL(cam.x,cam.z);if(!inside&&s.domeR(f.x,f.z)>=1.15&&s.domeR(c.x,c.z)>=1)continue;
   if(ok(c.x,cam.y-s.g,c.z))return false;
   let lo=0,hi=1;tmpF.copy(focus);for(let k=0;k<16;k++){const m=(lo+hi)/2;q3.copy(tmpF).lerp(cam,m);const l=s.toL(q3.x,q3.z);ok(l.x,q3.y-s.g,l.z)?lo=m:hi=m;}
   cam.copy(tmpF.lerp(cam,lo*.96));return true;}return false;};
 let other=window.arcanoCameraLimit||null;const combined=(focus,cam)=>(!window.__mineCamOff&&mineCam(focus,cam))||(other?other(focus,cam):false);
 try{Object.defineProperty(window,'arcanoCameraLimit',{configurable:true,get(){return combined;},set(f){if(f!==combined)other=f;}});}catch(e){window.arcanoCameraLimit=combined;}

 /* ================= Escurecer o sol dentro da dungeon ================= */
 const dimLights=[];scene.traverse(q=>{if(q.isHemisphereLight||q.isDirectionalLight||q.isAmbientLight)dimLights.push(q);});
 let dimK=1;{const Rd=api.renderer,orig=Rd.render;Rd.render=function(sc,cam){if(sc===scene&&dimK<.995){const sv=dimLights.map(l=>l.intensity);dimLights.forEach(l=>l.intensity*=dimK);
   try{return orig.call(this,sc,cam);}finally{dimLights.forEach((l,i)=>l.intensity=sv[i]);}}return orig.call(this,sc,cam);};}

 /* ================= Luzes, animação e interação ================= */
 const warm=new T.PointLight('#ffb060',0,16,1.6);scene.add(warm);
 const dayF=()=>{const R=window.arcanoAnimeRiver,u=R&&R.material&&R.material.uniforms&&R.material.uniforms.uSun;const y=u?u.value.y:.5;return Math.min(1,Math.max(0,(y+.1)/.28));};
 const cG=new T.Color('#b89a64'),cN=new T.Color('#ffd27a');let last=performance.now(),t=0,near=null;
 addEventListener('keydown',e=>{if(e.key&&e.key.toLowerCase()==='e'&&near&&!e.repeat)near.act();});
 window.arcanoMinasObj={objs,SITES,inter,findCell,
  prewarm(){const o=objs[0];if(!o.built){o.built=true;try{buildDungeon(o);}catch(e){console.error(e);}}return new Promise(res=>{const t0=performance.now(),w=()=>(o.ready||performance.now()-t0>15000)?res(o):setTimeout(w,50);w();});},
  showAll(v){for(const o of objs){o.root.visible=true;for(const g of o.levels)g.visible=v;}}};
 const tmpC=new T.Color();
 function tick(){requestAnimationFrame(tick);const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;t+=dt;
  const pl=api.getGrassPlayer&&api.getGrassPlayer(),pp=pl?pl.position:null,night=1-dayF();
  {const du=dayU.value;du.setRGB(0,0,0);for(const l of dimLights){const w=l.isHemisphereLight?.45:l.isDirectionalLight?.55:.4;du.r+=l.color.r*l.intensity*w;du.g+=l.color.g*l.intensity*w;du.b+=l.color.b*l.intensity*w;}}
  const sunK=Math.min(1,dayF()*1.2);for(const o of objs)if(o.rayMat)o.rayMat.opacity=.26*sunK;
  glassEx.color.copy(cG).lerp(cN,night);crMat.color.setScalar(.92+.1*Math.sin(t*1.6));flameMat.color.setRGB(1,.62+.12*Math.sin(t*13),.25);
  let best=null,bd=1e9,inside=null;
  for(const o of objs){const s=o.s,d=pp?Math.hypot(pp.x-s.x,pp.z-s.z):1e9;o.root.visible=d<600;
   if(!o.built&&d<150){o.built=true;try{buildDungeon(o);}catch(e){console.error('dungeon',e);}}
   for(const g of o.levels)g.visible=d<85;
   o.exHalo.material.opacity=night*.85;o.exHalo.scale.setScalar(2.2*(1+.05*Math.sin(t*11+s.seed)));
   if(d<bd){bd=d;best=o;}
   if(pp&&d<55&&s.L){const l=s.toL(pp.x,pp.z),c=findCell(s,l.x,l.z,pp.y-s.g);if(c&&!(c.L===0&&l.z>PZ-3.5))inside={o,c};}
   if(d>85)continue;
   if(o.fires){for(const f of o.fires){for(const q of f.sp){const a=Math.sin(t*11+q.ph),b=Math.sin(t*23+q.ph*1.7),c=Math.sin(t*7+q.ph*.5);
      q.m.scale.set(q.w*(1+.1*b),q.h*(1+.18*a+.1*b),1);q.m.position.x=q.dx+.04*c*f.sz;q.m.material.rotation=.08*c;}}
    if(!o.embers&&o.fires.length){const n=o.fires.length*6,P=new Float32Array(n*3),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(P,3));
     const pts=new T.Points(g,new T.PointsMaterial({color:'#ffb347',size:.06,transparent:true,opacity:.95,blending:T.AdditiveBlending,depthWrite:false,fog:false}));pts.frustumCulled=false;o.root.add(pts);
     o.embers={pts,P,seeds:Array.from({length:n},(_,i)=>[i%o.fires.length,Math.random(),Math.random()*TAU,.5+Math.random()*.6])};}
    if(o.embers){const E=o.embers;for(let i=0;i<E.seeds.length;i++){const q=E.seeds[i],f=o.fires[q[0]],u=(t*q[3]*.6+q[1])%1;
      E.P[i*3]=f.x+Math.sin(q[2]+t*2+u*5)*.12*f.sz;E.P[i*3+1]=f.y+u*1.8*f.sz+.15*f.sz;E.P[i*3+2]=f.z+Math.cos(q[2]+t*1.7+u*4)*.12*f.sz;}E.pts.geometry.attributes.position.needsUpdate=true;}}
   for(let i=0;i<o.flick.length;i++){const h=o.flick[i];h.scale.setScalar(h.userData.base*(1+.08*Math.sin(t*12+i*1.7)+.05*Math.sin(t*7.3+i)));}
   for(const S of o.sparks){for(let i=0;i<S.NS;i++){const q=S.seeds[i],y=(q[2]+t*q[3])%3.6,r=q[1]*(1-y/5);S.sp[i*3]=S.x+Math.cos(q[0]+t*.3)*r;S.sp[i*3+1]=S.y+y;S.sp[i*3+2]=S.z+Math.sin(q[0]+t*.3)*r;}S.pts.geometry.attributes.position.needsUpdate=true;}}
  dimK+=((inside?.18:1)-dimK)*Math.min(1,dt*3);
  if(inside){warm.position.set(pp.x,pp.y+2.2,pp.z);warm.intensity+=(1.5-warm.intensity)*.1;}
  else if(best&&bd<60&&night>.05){const s=best.s,w=s.toW(best.exLamp[0],best.exLamp[2]);warm.position.set(w.x,s.g+best.exLamp[1],w.z);warm.intensity=1.6*night;}else warm.intensity*=.9;
  near=null;let nd=2.8;
  for(const q of inter){const s=q.site;
   if(q.open&&q.t<1){q.t=Math.min(1,q.t+dt/(q.type==='gate'?2.2:q.type==='secret'?1.4:.7));const e=1-Math.pow(1-q.t,3);
    if(q.type==='chest'){if(q.lid)q.lid.rotation.x=-1.9*e;q.glow.material.opacity=.9*Math.sin(Math.min(1,q.t*1.3)*PI*.5);}
    else if(q.type==='gate'){q.G.open=true;q.G.t=q.t;for(const lf of q.G.leaves)lf.piv.rotation.y=lf.sx*1.45*e;}
    else if(q.type==='secret'){q.q.open=true;q.q.t=q.t;q.g.position.y=q.q.y-(q.q.ceil+.6)*e;}}
   if(q.type==='chest'&&q.open&&q.t>=1)q.glow.material.opacity=.45+.15*Math.sin(t*3);
   if(!pp||q.open)continue;const w=s.toW(q.x,q.z),dd=Math.hypot(pp.x-w.x,pp.z-w.z);if(dd<nd&&Math.abs(pp.y-(s.g+q.y))<2.5){nd=dd;near=q;}}
  const U=getUI();if(near){U.b.textContent=near.label+'  [E]';U.b.style.display='block';U.b.onclick=()=>near&&near.act();}else U.b.style.display='none';}
 tick();
}
})();
