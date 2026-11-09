/* Extras das vilas: estradas de terra, grades de madeira, cabanas de acampamento com fogueira
   (acesa ou apagada) e a animação de chamas, fumaça, brasas, velas das vilas e luz da noite. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const VM=window.__vm;
if(!VM)return;
const {box,cyl,sph,cone,rod}=VM;
const rnd=VM.rnd,PI=Math.PI;
const ANIM=VM.anim={flames:[],smoke:[],embers:[],glows:[],sails:[],night:[]};

/* ---------- Estradas de terra ---------- */
// pts: polilinha em coordenadas locais da vila; w: largura. Segue o relevo.
const ROAD_TILE={dirt:0,mud:0,gravel:2.4,flag:3.2,cobble:2.8,plank:2.4};
VM.road=function(ctx,pts,w,type){
 type=type||'dirt';const tileM=ROAD_TILE[type]||0;
 const P=[],U=[],idx=[];let run=0;
 const samples=[];
 for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],L=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(L/2.2));
  for(let k=(i===1?0:1);k<=n;k++){const t=k/n;samples.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,dx:(b.x-a.x)/L,dz:(b.z-a.z)/L});}}
 for(let i=0;i<samples.length;i++){
  const s=samples[i];if(i>0)run+=Math.hypot(s.x-samples[i-1].x,s.z-samples[i-1].z);
  // normal média entre segmentos vizinhos
  const p=samples[Math.max(0,i-1)],q=samples[Math.min(samples.length-1,i+1)];let dx=q.x-p.x,dz=q.z-p.z;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
  const nx=-dz,nz=dx;
  for(const e of [-1,1]){const x=s.x+nx*e*w/2,z=s.z+nz*e*w/2;P.push(x,ctx.gy(x,z)+.07,z);U.push(e<0?0:(tileM?w/tileM:1),run/(tileM||3));}
  if(i>0){const a=(i-1)*2,b=i*2;idx.push(a,b,a+1,a+1,b,b+1);}
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(P,3));geo.setAttribute('uv',new T.Float32BufferAttribute(U,2));geo.setIndex(idx);geo.computeVertexNormals();
 const m=new T.Mesh(geo,ctx.M['rd'+type.charAt(0).toUpperCase()+type.slice(1)]||ctx.M.dirt);m.name='Estrada ('+type+')';m.receiveShadow=true;
 ctx.live.add(m);
 for(const s of samples.filter((_,i)=>i%2===0))ctx.noGrassC(s.x,s.z,w/2+1.4);
 // o personagem pisa na superfície da estrada (decalque a 7 cm do chão), sem afundar
 if(ctx.W&&window.arcanoIslandHeight){const ws=samples.map(q=>ctx.W(q.x,q.z)),hw=w/2+.05;let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const q of ws){x0=Math.min(x0,q.x);x1=Math.max(x1,q.x);z0=Math.min(z0,q.z);z1=Math.max(z1,q.z);}
  (window.arcanoGroundOverrides=window.arcanoGroundOverrides||[]).push((x,z)=>{if(x<x0-hw||x>x1+hw||z<z0-hw||z>z1+hw)return null;
   for(let i=1;i<ws.length;i++){const A=ws[i-1],B=ws[i],dx=B.x-A.x,dz=B.z-A.z,L2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-A.x)*dx+(z-A.z)*dz)/L2)),ex=A.x+dx*t-x,ez=A.z+dz*t-z;if(ex*ex+ez*ez<hw*hw)return window.arcanoIslandHeight(x,z)+.07;}
   return null;});}
};

/* ---------- Grades de madeira ---------- */
const FENCE={
 rail:(c,x,z,y,ang,len,i)=>{const g=c.g,M=c.M;box(g,.16,1.1,.16,M.wood,x,y,z,0,1.5);
  return (x2,z2,y2)=>{for(const h of [.4,.8]){const mx=(x+x2)/2,mz=(z+z2)/2,my=(y+y2)/2+h;box(g,len,.09,.07,M.woodDark,mx,my,mz,ang,1.5).rotation.z=0;}};},
 log:(c,x,z,y,ang,len)=>{const g=c.g,M=c.M;cyl(g,.1,.12,1.2,M.log,x,y,z,7,1.2);sph(g,.12,M.log,x,y+1.2,z,1,.8,1,6);
  return (x2,z2,y2)=>{for(const h of [.4,.85]){const mx=(x+x2)/2,mz=(z+z2)/2,my=(y+y2)/2+h;const r=rod(g,x,y+h,z,x2,y2+h,z2,.065,M.log,6);}};},
 wall:(c,x,z,y,ang,len)=>{const g=c.g,M=c.M;box(g,.5,.95,.5,M.white,x,y,z,ang,2);box(g,.62,.12,.62,M.stone,x,y+.95,z,ang,2);
  return (x2,z2,y2)=>{const mx=(x+x2)/2,mz=(z+z2)/2,my=Math.min(y,y2);box(g,len-.3,.62,.3,M.white,mx,my,mz,ang,2);box(g,len-.3,.1,.4,M.stone,mx,my+.62,mz,ang,2);};},
 picket:(c,x,z,y,ang,len)=>{const g=c.g,M=c.M;box(g,.14,1.15,.14,M.woodDark,x,y,z,0,1.5);
  return (x2,z2,y2)=>{const n=Math.max(2,Math.round(len/.28));for(let k=1;k<n;k++){const t=k/n,px=x+(x2-x)*t,pz=z+(z2-z)*t,py=y+(y2-y)*t;box(g,.09,.95,.03,M.woodDark,px,py+.05,pz,ang,1);}
   for(const h of [.3,.75]){const mx=(x+x2)/2,mz=(z+z2)/2,my=(y+y2)/2+h;box(g,len,.07,.05,M.woodDark,mx,my,mz,ang,1.5);}};},
 bamboo:(c,x,z,y,ang,len)=>{const g=c.g,M=c.M;cyl(g,.06,.06,1.5,M.bamb,x,y,z,6,1);
  return (x2,z2,y2)=>{const n=Math.max(2,Math.round(len/.3));for(let k=1;k<n;k++){const t=k/n;cyl(g,.045,.05,1.05+rnd()*.25,M.bamb,x+(x2-x)*t,y+(y2-y)*t,z+(z2-z)*t,5,1);}
   for(const h of [.3,.85]){rod(g,x,y+h,z,x2,y2+h,z2,.04,M.bamb,5);}};},
 cute:(c,x,z,y,ang,len)=>{const g=c.g,M=c.M;box(g,.16,1.0,.16,M.cream,x,y,z,0,1.5);sph(g,.12,M.pink,x,y+1.02,z,1,1,1,6);
  return (x2,z2,y2)=>{const n=Math.max(2,Math.round(len/.34));const caps=[M.capRed,M.capPurple,M.capTeal,M.capOrange,M.capPink];for(let k=1;k<n;k++){const t=k/n,px=x+(x2-x)*t,pz=z+(z2-z)*t,py=y+(y2-y)*t;box(g,.12,.7,.04,M.cream,px,py,pz,ang+PI/2,1);sph(g,.09,caps[k%5],px,py+.72,pz,1,.7,1,6);}
   for(const h of [.28,.55]){const mx=(x+x2)/2,mz=(z+z2)/2,my=(y+y2)/2+h;box(g,len,.06,.05,M.cream,mx,my,mz,ang,1.5);}};}
};
// style: nome em FENCE; skip(x,z)=true onde a grade abre (portões, caminhos). Devolve nada.
VM.fence=function(ctx,pts,style,skip){
 const f=FENCE[style]||FENCE.rail;if(!ctx.M.bamb)ctx.M.bamb=new T.MeshStandardMaterial({color:'#b9c46a',roughness:1});
 const step=style==='wall'?3.6:2.3;
 for(let i=1;i<pts.length;i++){
  const a=pts[i-1],b=pts[i],L=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.round(L/step)),ang=Math.atan2(-(b.z-a.z),b.x-a.x);
  for(let k=0;k<n;k++){
   const x1=a.x+(b.x-a.x)*k/n,z1=a.z+(b.z-a.z)*k/n,x2=a.x+(b.x-a.x)*(k+1)/n,z2=a.z+(b.z-a.z)*(k+1)/n,len=L/n;
   const y1=ctx.gy(x1,z1),y2=ctx.gy(x2,z2);
   if(skip&&(skip(x1,z1)||skip(x2,z2)||skip((x1+x2)/2,(z1+z2)/2))){ // trecho aberto: só os postes das pontas, se livres
    continue;}
   const rails=f(ctx,x1,z1,y1,ang,len,k);rails(x2,z2,y2);
   if(k===n-1&&!(skip&&skip(x2,z2)))f(ctx,x2,z2,y2,ang,len,k+1); // poste final
   ctx.colBox((x1+x2)/2,(z1+z2)/2,len/2,.12,ang);
  }
 }
};

/* ---------- Fogueira ---------- */
function stoneRing(c,x,z,y,r,n){for(let i=0;i<n;i++){const a=i/n*PI*2,s=sph(c.g,.17,c.M.stoneDark,x+Math.cos(a)*r,y+.08,z+Math.sin(a)*r,1.1+rnd()*.3,.7,1+rnd()*.2,5);s.rotation.y=rnd()*6;}}
VM.campfire=function(ctx,x,z,lit){
 const y=ctx.gy(x,z),g=ctx.g,M=ctx.M;
 stoneRing(ctx,x,z,y,.62,9);
 if(lit){
  for(let i=0;i<3;i++){const a=i/3*PI+.3,lg=cyl(g,.07,.08,1.1,M.bark,0,0,0,6,1);lg.rotation.z=PI/2;lg.rotation.y=a;lg.position.set(x,y+.14,z);}
  // brasa vermelha no meio
  const em=cyl(g,.3,.34,.1,M.lantern,x,y+.02,z,8,1);em.material=ctx.M.ember||(ctx.M.ember=new T.MeshStandardMaterial({color:'#ff8a3a',emissive:new T.Color('#ff5a1a'),emissiveIntensity:1.6}));
  // sprites animados (fora da malha unida)
  const live=o=>ctx.live.add(o),fm=ctx.sp.flame,gm=ctx.sp.glow,sm=ctx.sp.smoke;
  const fl=[];for(let i=0;i<3;i++){const s=new T.Sprite(fm);s.center.set(.5,.08);const k=[1,.7,.55][i];s.position.set(x+(i?(i===1?.1:-.12):0),y+.2,z+(i===2?.08:0));s.scale.set(.5*k,.9*k,1);live(s);fl.push({s,k,ph:rnd()*6,sp:8+rnd()*5});}
  ANIM.flames.push(...fl);
  const gl=new T.Sprite(gm);gl.position.set(x,y+.6,z);gl.scale.set(3.4,3.4,1);live(gl);ANIM.glows.push({s:gl,base:3.4,night:true,ph:rnd()*6});
  // poça de luz no chão (mais forte à noite)
  const pool=new T.Mesh(new T.CircleGeometry(4.6,24),ctx.sp.pool.clone());pool.rotation.x=-PI/2;pool.position.set(x,y+.1,z);pool.renderOrder=3;live(pool);ANIM.night.push({m:pool.material,day:.12,night:.9});
  for(let i=0;i<5;i++){const s=new T.Sprite(ctx.sp.ember.clone());s.scale.set(.08,.08,1);live(s);ANIM.embers.push({s,x,y:y+.4,z,t:rnd()*3,sp:.5+rnd()*.5,ox:(rnd()-.5)*.6});}
  for(let i=0;i<4;i++){const s=new T.Sprite(sm.clone());s.scale.set(.6,.6,1);live(s);ANIM.smoke.push({s,x,y:y+.9,z,t:i/4*4,ox:(rnd()-.5)*.2});}
 }else{
  // lenha carbonizada e cinzas frias
  for(let i=0;i<3;i++){const a=i/3*PI+.9,lg=cyl(g,.07,.08,1.0,M.char,0,0,0,6,1);lg.rotation.z=PI/2;lg.rotation.y=a;lg.position.set(x,y+.1,z);}
  const ash=new T.Mesh(new T.CircleGeometry(.5,12),M.ash);ash.rotation.x=-PI/2;ash.position.set(x,y+.06,z);g.add(ash);
 }
 ctx.colCircle(x,z,.75);ctx.noGrassC(x,z,3.6);
};

/* ---------- Tendas ---------- */
// Tenda em A (entrada voltada para +x local). ry gira a tenda inteira.
VM.tentA=function(ctx,x,z,ry,m){
 const y=ctx.gy(x,z),M=ctx.M,tg=new T.Group();tg.position.set(x,y,z);tg.rotation.y=ry;ctx.g.add(tg);
 const L=2.9,D=2.3,rise=1.7;
 VM.gableRoof(tg,L,D,rise,m,m,0,0,0,0,0,2);
 // abertura escura na frente (+x) e abas
 const P=[],U=[];const hd=D/2;const xx=L/2+.02;P.push(xx,0,-hd*.55,xx,0,hd*.55,xx,rise*.62,0);U.push(0,0,1,0,.5,1);
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(P,3));geo.setAttribute('uv',new T.Float32BufferAttribute(U,2));geo.computeVertexNormals();
 const door=new T.Mesh(geo,M.inside);tg.add(door);
 // varão da cumeeira e estacas
 rod(tg,-L/2-.25,rise,0,L/2+.25,rise,0,.04,M.woodDark,5);
 for(const s of [-1,1])rod(tg,0,0,s*(hd+.75),0,.9,s*(hd+.12),.03,M.woodDark,5);
 rod(tg,L/2+.3,rise,0,L/2+1.2,0,1.2,.015,M.cloth,3);rod(tg,L/2+.3,rise,0,L/2+1.2,0,-1.2,.015,M.cloth,3);
 for(const e of [-1,1])for(const sx of [-1,1])box(tg,.05,.3,.05,M.woodDark,sx*(L/2+.1),0,e*(hd+.25),0,1);
 ctx.colBox(x,z,L/2,D/2,ry);ctx.noGrassC(x,z,3.2);
};
// Cabana indígena (teepee).
VM.teepee=function(ctx,x,z,ry,doorTo){
 const y=ctx.gy(x,z),M=ctx.M,tg=new T.Group();tg.position.set(x,y,z);tg.rotation.y=ry;ctx.g.add(tg);
 const r=1.55,h=3.7;
 VM.coneRoof(tg,r,h,M.tipi,0,0,0,12,2.2);
 for(let i=0;i<10;i++){const a=i/10*PI*2;rod(tg,Math.cos(a)*(r-.08),0,Math.sin(a)*(r-.08),Math.cos(a)*.08,h+.9,Math.sin(a)*.08,.035,M.woodDark,5);}
 // porta: triângulo escuro com abas
 const P=[1.48,0,-.55,1.48,0,.55,.67,2.2,0],U=[0,0,1,0,.5,1],geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(P,3));geo.setAttribute('uv',new T.Float32BufferAttribute(U,2));geo.computeVertexNormals();
 tg.add(new T.Mesh(geo,M.inside));
 ctx.colCircle(x,z,r+.1);ctx.noGrassC(x,z,3.2);
};
// Abrigo simples de lona.
VM.leanTo=function(ctx,x,z,ry,m){
 const y=ctx.gy(x,z),M=ctx.M,tg=new T.Group();tg.position.set(x,y,z);tg.rotation.y=ry;ctx.g.add(tg);
 const w=3,d=2.4,hi=1.9;
 // lona: borda alta na frente (+x, voltada para o fogo) descendo até o chão atrás
 const P=[],U=[];VM.pushQuad(P,U,[d/2,hi,-w/2],[d/2,hi,w/2],[-d/2,.15,w/2],[-d/2,.15,-w/2],[0,0],[1,0],[1,1],[0,1]);
 VM.roofMesh(tg,P,U,m,0,0,0);
 for(const s of [-1,1]){rod(tg,d/2,0,s*(w/2),d/2,hi+.05,s*(w/2),.045,M.woodDark,6);rod(tg,d/2,hi,s*(w/2),-d/2,.15,s*(w/2),.025,M.cloth,3);}
 box(tg,1.5,.18,.8,M.cloth,-.2,.05,0,0,1);
 ctx.colBox(x,z,d/2,w/2,ry);ctx.noGrassC(x,z,3);
};
/* ---------- Acampamento completo ---------- */
// kind: 'a' | 'b' | 'teepee' | 'lean'; lit: fogueira acesa. rot: orientação do conjunto.
VM.camp=function(ctx,x,z,rot,opt){
 const lit=!!opt.lit,M=ctx.M,kind=opt.kind||'a',mats=[M.tentA,M.tentB,M.tentC,M.tentD];
 const c=Math.cos(rot),s=Math.sin(rot),at=(lx,lz)=>[x+lx*c+lz*s,z-lx*s+lz*c]; // local do acampamento -> da vila
 VM.campfire(ctx,x,z,lit);
 // tendas ao redor da fogueira, entrada voltada para o fogo
 const t1=at(-3.2,-.8),t2=at(.6,3.4);
 const face=(tx,tz)=>Math.atan2(-(z-tz),x-tx); // +x local da tenda aponta para a fogueira
 if(kind==='teepee'){VM.teepee(ctx,t1[0],t1[1],face(t1[0],t1[1]));}
 else if(kind==='lean'){VM.leanTo(ctx,t1[0],t1[1],face(t1[0],t1[1]),mats[opt.mat||0]);}
 else VM.tentA(ctx,t1[0],t1[1],face(t1[0],t1[1]),mats[opt.mat||0]);
 if(opt.two!==false){const tt=(kind==='a'||kind==='b')?VM.tentA:VM.tentA;tt(ctx,t2[0],t2[1],face(t2[0],t2[1]),mats[((opt.mat||0)+1)%4]);}
 // troncos como bancos
 for(const [lx,lz,a] of [[1.7,-1.2,.4],[1.9,1.5,-.4],[-.3,2.0,1.2]]){const p=at(lx,lz),lg=cyl(ctx.g,.17,.17,1.5,M.log,p[0],ctx.gy(p[0],p[1])+.17,p[1],8,1.4);lg.rotation.z=PI/2;lg.rotation.y=-a+rot;lg.position.y=ctx.gy(p[0],p[1])+.17;}
 // mochila, rolo de dormir e panela
 {const p=at(-2.4,1.6);box(ctx.g,.45,.5,.3,M.tentC,p[0],ctx.gy(p[0],p[1]),p[1],rot+.4,1);box(ctx.g,.4,.16,.4,M.iron,p[0],ctx.gy(p[0],p[1])+.5,p[1],rot+.4,1);}
 {const p=at(-1.6,-2.4),b=cyl(ctx.g,.16,.16,.9,M.tentD,p[0],ctx.gy(p[0],p[1])+.16,p[1],8,1);b.rotation.z=PI/2;b.rotation.y=rot+1.1;}
 // tripé com panela (acesa) ou só o tripé (apagada)
 {for(let i=0;i<3;i++){const a=i/3*PI*2;rod(ctx.g,x+Math.cos(a)*.85,ctx.gy(x,z),z+Math.sin(a)*.85,x,ctx.gy(x,z)+1.5,z,.025,M.iron,4);}
  if(lit){cyl(ctx.g,.2,.17,.24,M.iron,x,ctx.gy(x,z)+.72,z,8,1);}else{rod(ctx.g,x,ctx.gy(x,z)+1.5,z,x,ctx.gy(x,z)+1.1,z,.012,M.iron,3);}}
 // plaquinha de acampamento
 {const p=at(2.8,-3.2);cyl(ctx.g,.04,.04,1.1,M.woodDark,p[0],ctx.gy(p[0],p[1]),p[1],5,1);box(ctx.g,.5,.28,.04,M.wood,p[0],ctx.gy(p[0],p[1])+.8,p[1],rot,1);ctx.colCircle(p[0],p[1],.2);}
};

/* ---------- Animação ---------- */
let started=false;
VM.startAnim=function(){
 if(started)return;started=true;
 let last=performance.now(),nightT=0,nightK=0;
 const sky=()=>{const a=window.arcanoAnimeSky;return a&&a.material&&a.material.uniforms&&a.material.uniforms.uSunDir?a.material.uniforms.uSunDir.value:null;};
 function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.1,(now-last)/1000);last=now;const t=now/1000;
  if(now-nightT>800){nightT=now;const s=sky();nightK=s?Math.min(1,Math.max(0,(-s.y+.02)/.2)):0;
   if(VM.mats){const M=VM.mats;if(M.glass)M.glass.emissiveIntensity=.05+nightK*2;if(M.shoji)M.shoji.emissiveIntensity=.05+nightK*2.1;if(M.lantern)M.lantern.emissiveIntensity=.4+nightK*2.2;if(M.rune)M.rune.emissiveIntensity=.5+nightK*2.4;if(M.glowCyan)M.glowCyan.emissiveIntensity=.7+nightK*2;if(M.glowPink)M.glowPink.emissiveIntensity=.7+nightK*2;}
   for(const n of ANIM.night)n.m.opacity=n.day+(n.night-n.day)*nightK;
   for(const g of ANIM.glows)if(g.night)g.s.material.opacity=.45+.5*nightK;}
  for(const f of ANIM.flames){const k=f.k,fl=.85+.15*Math.sin(t*f.sp+f.ph)+.08*Math.sin(t*f.sp*2.3+f.ph*2);f.s.scale.set(.5*k*(.9+.1*Math.sin(t*f.sp*1.7+f.ph)),.9*k*fl,1);}
  for(const g of ANIM.glows){const s=g.base*(.94+.06*Math.sin(t*7+g.ph));g.s.scale.set(s,s,1);}
  for(const e of ANIM.embers){e.t+=dt*e.sp;if(e.t>3)e.t=0;const u=e.t/3;e.s.position.set(e.x+e.ox+Math.sin(e.t*3+e.ox*9)*.15*u,e.y+u*2.2,e.z+Math.cos(e.t*2+e.ox*7)*.12*u);e.s.material.opacity=1-u;}
  for(const s of ANIM.smoke){s.t+=dt;if(s.t>4)s.t=0;const u=s.t/4;s.s.position.set(s.x+s.ox+u*.6,s.y+u*3.2,s.z+Math.sin(s.t)*.1);const sc=.5+u*1.5;s.s.scale.set(sc,sc,1);s.s.material.opacity=Math.sin(u*PI)*.34;}
  for(const w of ANIM.sails)w.obj.rotation.z+=dt*w.sp;
 }
 requestAnimationFrame(frame);
};
})();
