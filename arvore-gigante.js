/* Árvore gigante da ilha do grande lago.
   - Tronco oco (cerca de 7 m de raio na base e 34 m de altura) com uma porta em arco virada para a ponte.
   - Por dentro: piso de raízes, uma rampa em espiral colada à parede subindo até um mirante,
     lanternas e cogumelos que brilham. Ao entrar, o casco de fora some para a câmera ver o interior.
   - Copa: galhos recursivos (8 primários, 32 secundários, 96 terciários, 384 ramos finos), cada um
     um tubo afinando e caindo com a gravidade, e ~12 mil folhas pintadas, uma a uma.
   - Raízes grossas sobre a ilha, ponte em arco até a margem e vaga-lumes na copa. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const PI=Math.PI,TAU=PI*2;
let seed=31337;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const TH=34,RIN=4.4,RAMP_IN=2.0,RAMP_OUT=4.25,RISE=7.2,Y0=.3,YTOP=27,DOOR=0,DOORW=1.95;
const angd=(a,b)=>{let d=a-b;while(d>PI)d-=TAU;while(d<-PI)d+=TAU;return d;};
function hsl2rgb(h,s,l){const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1));};return [f(0),f(8),f(4)];}

/* ---------- Construtor de malhas ---------- */
function Mesher(){return {P:[],N:[],U:[],C:[],I:[],n:0};}
function build(m,mat,name,vc){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(m.P,3));g.setAttribute('normal',new T.Float32BufferAttribute(m.N,3));g.setAttribute('uv',new T.Float32BufferAttribute(m.U,2));if(vc)g.setAttribute('color',new T.Float32BufferAttribute(m.C,3));g.setIndex(m.I);g.computeBoundingSphere();const mesh=new T.Mesh(g,mat);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;return mesh;}
// Tubo ao longo de um caminho com raio variável (quadro de referência transportado).
function tube(m,pts,rad,sides,tileLen,tint){
 const up0=Math.abs(pts[1].y-pts[0].y)>Math.abs(pts[1].x-pts[0].x)+Math.abs(pts[1].z-pts[0].z)?new T.Vector3(1,0,0):new T.Vector3(0,1,0);
 let nrm=new T.Vector3().subVectors(pts[1],pts[0]).cross(up0).normalize(),run=0;const base=m.n;
 for(let i=0;i<pts.length;i++){
  const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],tg=new T.Vector3().subVectors(b,a).normalize();
  nrm=nrm.clone().sub(tg.clone().multiplyScalar(nrm.dot(tg))).normalize();const bi=new T.Vector3().crossVectors(tg,nrm).normalize();
  if(i>0)run+=pts[i].distanceTo(pts[i-1]);
  for(let s=0;s<=sides;s++){const t=s/sides*TAU,cx=Math.cos(t),sx=Math.sin(t),nx=nrm.x*cx+bi.x*sx,ny=nrm.y*cx+bi.y*sx,nz=nrm.z*cx+bi.z*sx;
   m.P.push(pts[i].x+nx*rad[i],pts[i].y+ny*rad[i],pts[i].z+nz*rad[i]);m.N.push(nx,ny,nz);m.U.push(s/sides*Math.max(1,rad[0]*3)/tileLen*4,run/tileLen);
   const tt=tint||[1,1,1];m.C.push(tt[0],tt[1],tt[2]);}
 }
 const ring=sides+1;
 for(let i=0;i<pts.length-1;i++)for(let s=0;s<sides;s++){const a=base+i*ring+s,b=a+1,c=a+ring,d=c+1;m.I.push(a,c,b,b,c,d);}
 m.n+=pts.length*ring;
}

function install(){
 const api=window.arcanoWaterV1226,LG=window.arcanoLagoGrande,H=window.arcanoIslandHeight,O=window.arcanoObstacles,AT=window.arcanoTex,AB=window.arcanoBush;
 if(!api||!api.scene||!LG||!H||!O||!AT||!AB){setTimeout(install,500);return;}
 const scene=api.scene,base=LG.islandY;
 const root=new T.Group();root.name='Árvore gigante';root.position.set(LG.x,base,LG.z);scene.add(root);
 const W=(lx,lz)=>({x:LG.x+lx,z:LG.z+lz});
 const barkT=AT.wood({hue:22,light:28,seed:61,boards:5}),woodT=AT.wood({hue:30,light:46,seed:62,boards:6}),deckT=AT.wood({hue:32,light:50,horizontal:true,seed:63,boards:6});
 const mk=(t,sc,o)=>new T.MeshStandardMaterial(Object.assign({map:t.map,bumpMap:t.bump,bumpScale:sc,roughness:1},o||{}));
 const barkM=mk(barkT,1.4,{vertexColors:true}),innerM=mk(woodT,1.0,{vertexColors:true,side:T.DoubleSide}),deckM=mk(deckT,.8,{side:T.DoubleSide}),plainBark=mk(barkT,1.2);
 const glowM=new T.MeshStandardMaterial({color:'#ffe9b0',emissive:new T.Color('#ffb040'),emissiveIntensity:1.4,roughness:.6});
 const mushM=[new T.MeshStandardMaterial({color:'#bff8ff',emissive:new T.Color('#4fe0ff'),emissiveIntensity:1.6}),new T.MeshStandardMaterial({color:'#ffd0e6',emissive:new T.Color('#ff6fb0'),emissiveIntensity:1.5})];
 const stemM=new T.MeshStandardMaterial({color:'#f3e6cc',roughness:1});

 /* ---------- Tronco: casca de fora + parede de dentro, com a porta cortada ---------- */
 const rOut=(y,a)=>{const k=Math.max(0,y)/TH;let r=7.1-2.0*k+3.4*Math.exp(-Math.max(0,y)/2.4);return r*(1+.06*Math.sin(a*9+y*.33)+.04*Math.sin(a*19-y*.8+1)+.03*Math.sin(a*4+y*.15));};
 const rIn=(y,a)=>RIN*(1+.03*Math.sin(a*7+y*.5));
 const inDoor=(a,y,r)=>{const dx=r*angd(a,DOOR);return Math.abs(dx)<DOORW&&y<2.7+Math.sqrt(Math.max(0,DOORW*DOORW-dx*dx))*1.25;};
 const NA=72,rows=[];for(let y=-1.5;y<=TH+.01;y+=1)rows.push(y);
 const outer=Mesher(),inner=Mesher();
 for(const [mesh,isInner] of [[outer,false],[inner,true]]){
  const rad=isInner?rIn:rOut,yStart=isInner?0:-1.5;
  const ys=rows.filter(y=>y>=yStart);
  for(let j=0;j<ys.length;j++)for(let i=0;i<=NA;i++){
   const a=i/NA*TAU+ys[j]*.02,r=rad(ys[j],a),x=Math.sin(a)*r,z=Math.cos(a)*r;
   mesh.P.push(x,ys[j],z);const nrm=new T.Vector3(x,0,z).normalize();if(isInner)nrm.negate();mesh.N.push(nrm.x,0,nrm.z);
   mesh.U.push(i/NA*TAU*r/4,ys[j]/4);
   // musgo na base e nas faces voltadas para o norte
   const mo=Math.max(0,Math.min(1,(.55-ys[j]/22)+.35*Math.sin(a*5+ys[j]*.2)+.15*(Math.cos(a)<0?1:0)));
   mesh.C.push(1-mo*.35,1-mo*.05,1-mo*.5);
  }
  const ring=NA+1;
  for(let j=0;j<ys.length-1;j++)for(let i=0;i<NA;i++){
   const a0=(i+.5)/NA*TAU+(ys[j]+.5)*.02,yc=(ys[j]+ys[j+1])/2;
   if(inDoor(a0,yc,rad(yc,a0)))continue;
   const a=j*ring+i,b=a+1,c=a+ring,d=c+1;
   if(isInner)mesh.I.push(a,b,c,b,d,c);else mesh.I.push(a,c,b,b,c,d);
  }
  mesh.n=ys.length*ring;
 }
 const outerMesh=build(outer,barkM,'Tronco da árvore gigante (fora)',true);root.add(outerMesh);
 root.add(build(inner,innerM,'Tronco da árvore gigante (dentro)',true));
 // borda do tronco no topo (anel que liga a parede de dentro à de fora)
 {const m=Mesher(),y=TH,NA2=NA;for(let i=0;i<=NA2;i++){const a=i/NA2*TAU+y*.02;const ro=rOut(y,a),ri=rIn(y,a);m.P.push(Math.sin(a)*ro,y,Math.cos(a)*ro,Math.sin(a)*ri,y,Math.cos(a)*ri);m.N.push(0,1,0,0,1,0);m.U.push(i/NA2*6,0,i/NA2*6,1);m.C.push(1,1,1,1,1,1);}
  for(let i=0;i<NA2;i++){const a=i*2;m.I.push(a,a+2,a+1,a+1,a+2,a+3);}root.add(build(m,barkM,'Borda do tronco',true));}
 // piso interno (terra e raízes) e soleira
 {const fl=new T.Mesh(new T.CircleGeometry(RIN+.2,32),deckM);fl.rotation.x=-PI/2;fl.position.y=Y0-.04;fl.receiveShadow=true;root.add(fl);}
 // túnel da porta: batentes e arco forrados de madeira
 {const tg=new T.Group();root.add(tg);const z0=RIN-.3,z1=10.9,len=z1-z0,zc=(z0+z1)/2;
  const bx=(w,h,d,m,x,y,z,ry)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),m);b.position.set(x,y+h/2,z);b.rotation.y=ry||0;b.castShadow=true;tg.add(b);return b;};
  for(const s of [-1,1])bx(.5,3.0,len,plainBark,s*(DOORW+.25),0,zc);
  const segs=9;for(let k=0;k<segs;k++){const a0=PI*k/segs,a1=PI*(k+1)/segs,am=(a0+a1)/2,r=DOORW+.25,x=Math.cos(am)*r,y=3.0+Math.sin(am)*r*1.25,l=2*r*Math.sin(PI/segs/2)*1.35;const b=new T.Mesh(new T.BoxGeometry(l,.5,len),plainBark);b.position.set(x,y,zc);b.rotation.z=am-PI/2;tg.add(b);}
  bx(DOORW*2+.5,.12,len,deckM,0,0,zc);
  // raízes que abraçam o arco
  for(const s of [-1,1]){const m=Mesher(),pts=[],rad=[];for(let i=0;i<=8;i++){const t=i/8;pts.push(new T.Vector3(s*(DOORW+.6+1.8*t),5.8*Math.pow(1-t,.7)+.2,10.7+.3*Math.sin(t*5)));rad.push(.55*(1-t*.6));}tube(m,pts,rad,6,3);tg.add(build(m,plainBark,'Raiz da porta',false));}
 }
 // janelas luminosas (nós de luz) por dentro e por fora
 for(const [a,y] of [[PI/2,11],[PI,17],[-PI/2,23],[.9,29],[-2.4,14.5],[2.3,25.5]]){
  for(const side of ['o','i']){const r=side==='o'?rOut(y,a)+.04:rIn(y,a)-.03,e=new T.Mesh(new T.SphereGeometry(1,14,10),glowM);e.scale.set(.9,1.4,.2);e.position.set(Math.sin(a)*r,y,Math.cos(a)*r);e.rotation.y=a+(side==='o'?0:PI);if(side==='o')e.userData.outer=true;root.add(e);if(side==='o')outerMesh.userData.glows=(outerMesh.userData.glows||[]).concat(e);}
 }

 /* ---------- Rampa em espiral e mirante por dentro ---------- */
 const THS=.55;       // ângulo de partida da rampa (ao lado da porta)
 const TURNS=(YTOP-Y0)/RISE;
 {const m=Mesher(),steps=Math.round(TURNS*72),dth=TURNS*TAU/steps;
  for(let i=0;i<=steps;i++){const th=THS+i*dth,y=Y0+i*dth/TAU*RISE;
   for(const r of [RAMP_IN,RAMP_OUT+.1]){m.P.push(Math.sin(th)*r,y,Math.cos(th)*r);m.N.push(0,1,0);m.U.push(r<3?0:1,i*dth*3.4/4);m.C.push(1,1,1);}
   for(const r of [RAMP_IN,RAMP_OUT+.1]){m.P.push(Math.sin(th)*r,y-.28,Math.cos(th)*r);m.N.push(0,-1,0);m.U.push(r<3?0:1,i*dth*3.4/4);m.C.push(1,1,1);}}
  for(let i=0;i<steps;i++){const a=i*4;m.I.push(a,a+4,a+1,a+1,a+4,a+5, a+2,a+3,a+6,a+3,a+7,a+6, a,a+2,a+4,a+2,a+6,a+4, a+1,a+5,a+3,a+3,a+5,a+7);}
  root.add(build(m,deckM,'Rampa em espiral',false));
  // guarda-corpo no lado de dentro: postes + corda
  const rail=Mesher();let prev=null;
  for(let i=0;i<=steps;i+=3){const th=THS+i*dth,y=Y0+i*dth/TAU*RISE,x=Math.sin(th)*(RAMP_IN+.1),z=Math.cos(th)*(RAMP_IN+.1);
   const post=[new T.Vector3(x,y,z),new T.Vector3(x,y+1.0,z)];tube(rail,post,[.06,.05],5,2);
   const top=new T.Vector3(x,y+.95,z);if(prev){const mid=top.clone().add(prev).multiplyScalar(.5);mid.y-=.06;tube(rail,[prev.clone(),mid,top],[.035,.035,.035],4,2);}prev=top;}
  root.add(build(rail,plainBark,'Guarda-corpo',false));
  // lanternas a cada meia volta
  for(let k=1;k<TURNS*2;k++){const th=THS+k*PI,y=Y0+k*PI/TAU*RISE;const r=RAMP_OUT-.15;const lamp=new T.Mesh(new T.SphereGeometry(.28,10,8),glowM);lamp.position.set(Math.sin(th)*r,y+1.6,Math.cos(th)*r);root.add(lamp);
   const hang=new T.Mesh(new T.CylinderGeometry(.02,.02,.9,4),plainBark);hang.position.set(Math.sin(th)*r,y+2.2,Math.cos(th)*r);root.add(hang);}
 }
 // mirante: disco com um vão (onde a rampa chega por baixo) e vista pela borda aberta
 const THE=THS+TURNS*TAU,HOLE=.34*TAU;
 {const m=Mesher(),NS=40;for(let i=0;i<=NS;i++){const th=i/NS*TAU,r=RAMP_OUT+.2;m.P.push(0,YTOP,0,Math.sin(th)*r,YTOP,Math.cos(th)*r);m.N.push(0,1,0,0,1,0);m.U.push(.5,.5,.5+Math.sin(th)*.5,.5+Math.cos(th)*.5);m.C.push(1,1,1,1,1,1);}
  const ang=i=>i/NS*TAU,inHole=th=>{const d=(((th-(THE-HOLE))%TAU)+TAU)%TAU;return d<HOLE;};
  for(let i=0;i<NS;i++){const th=(ang(i)+ang(i+1))/2;if(inHole(th))continue;const a=i*2;m.I.push(a,a+1,a+3);} // centro e anel inteiros fora do vão
  // o vão só vale no anel da rampa; o centro (r<RAMP_IN) fica sólido
  const core=new T.Mesh(new T.CircleGeometry(RAMP_IN+.02,24),deckM);core.rotation.x=-PI/2;core.position.y=YTOP;root.add(core);
  const dk=build(m,deckM,'Mirante da árvore',false);root.add(dk);}
 // cogumelos que brilham e raízes no piso
 for(let i=0;i<14;i++){const a=rnd()*TAU,r=.8+rnd()*(RAMP_IN-.5),h=.3+rnd()*.4;const s=new T.Mesh(new T.CylinderGeometry(.04,.06,h,5),stemM);s.position.set(Math.sin(a)*r,Y0+h/2,Math.cos(a)*r);root.add(s);const c=new T.Mesh(new T.SphereGeometry(.2+rnd()*.15,9,5,0,TAU,0,PI/2),mushM[i%2]);c.position.set(s.position.x,Y0+h,s.position.z);root.add(c);}

 /* ---------- Raízes sobre a ilha ---------- */
 {const m=Mesher();
  for(let i=0;i<10;i++){const a=i/10*TAU+rnd()*.3+.2;if(Math.abs(angd(a,DOOR))<.42)continue;const L=15+rnd()*9;
   const mkRoot=(a0,r0,len,rad0,depth)=>{const pts=[],rad=[];const wob=rnd()*6;
    for(let k=0;k<=12;k++){const t=k/12,r=r0+len*t,aa=a0+.12*Math.sin(t*5+wob)*(1-t*.3),y=(1.6*(1-t)*(1-t)+(depth?.3:.9)*(1-t))-2.6*Math.pow(t,2.2);pts.push(new T.Vector3(Math.sin(aa)*r,y,Math.cos(aa)*r));rad.push(Math.max(.1,rad0*(1-t*.82)));}
    tube(m,pts,rad,7,3);return {a0,r0,len};};
   const r1=mkRoot(a,6.2,L,1.7,0);
   for(let s=0;s<2;s++){mkRoot(a+(s?1:-1)*(.22+rnd()*.12),6.2+L*.35,L*.55,.7,1);}
  }
  const rt=build(m,plainBark,'Raízes da árvore gigante',false);root.add(rt);}

 /* ---------- Copa: galhos recursivos + folhas ---------- */
 const branchM=Mesher(),leafV={P:[],U:[],C:[],I:[]};
 const leafCenter=new T.Vector3(0,TH+13,0);
 function leaf(c,ax,size,up){
  const w=new T.Vector3(rnd()-.5,rnd()-.5,rnd()-.5).cross(ax).normalize(),ll=size,lw=size*.62,v=leafV.P.length/3;
  ax=ax.clone();ax.y-=.25*rnd();ax.normalize();
  const cs=[[-lw/2,0],[lw/2,0],[lw/2,ll],[-lw/2,ll]];
  for(const [x,y] of cs){leafV.P.push(c.x+w.x*x+ax.x*y,c.y+w.y*x+ax.y*y,c.z+w.z*x+ax.z*y);}
  leafV.U.push(0,0,1,0,1,1,0,1);
  const hh=Math.min(1,Math.max(0,(c.y-TH)/36)),gold=rnd()<.05,col=hsl2rgb(gold?48+rnd()*8:92+rnd()*30,.5+rnd()*.22,.26+.22*hh+rnd()*.12);
  for(let k=0;k<4;k++)leafV.C.push(col[0],col[1],col[2]);
  leafV.I.push(v,v+1,v+2,v,v+2,v+3);
 }
 const GRAV=.035,LEAFK=(/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||innerWidth<700)?.55:1;
 function grow(p,dir,len,r0,r1,depth){
  const sides=[8,6,5,4][depth],segs=Math.max(4,Math.round(len/2.2)),pts=[p.clone()],rad=[r0];let pos=p.clone(),d=dir.clone();
  for(let i=1;i<=segs;i++){d.y-=GRAV*(depth+1)*(depth>1?1.6:1);d.x+=(rnd()-.5)*(.2+depth*.08);d.z+=(rnd()-.5)*(.2+depth*.08);d.y+=(rnd()-.5)*.14;d.normalize();pos.addScaledVector(d,len/segs);pts.push(pos.clone());rad.push(r0+(r1-r0)*i/segs);}
  tube(branchM,pts,rad,sides,3.4,[.9+rnd()*.15,.9+rnd()*.1,.9+rnd()*.1]);
  const kids=[4,4,3,0][depth]; // quantos filhos
  const ends=[];
  for(let k=0;k<kids;k++){const t=.3+.7*(k+rnd()*.5)/kids,idx=Math.min(segs,Math.max(1,Math.round(t*segs))),q=pts[idx],rq=rad[idx];
   const axis=new T.Vector3(rnd()-.5,rnd()-.5,rnd()-.5).normalize(),nd=d.clone().applyAxisAngle(axis,.6+rnd()*.7);nd.y+=.12;nd.normalize();
   const cl=[0,15,7.4,3.2][depth+1]*(.85+rnd()*.3);
   grow(q,nd,cl,Math.max(.1,rq*.62),Math.max(.05,rq*.62*[.4,.42,.33][depth]||.05),depth+1);}
  // folhas: nos galhos terciários e nos ramos finos, mais densas na ponta
  if(depth>=2){const n=Math.round((depth===3?len*24:len*11)*LEAFK);
   for(let k=0;k<n;k++){const t=Math.pow(rnd(),.7)*.9+.1,idx=Math.min(segs,Math.round(t*segs)),q=pts[idx].clone().add(new T.Vector3(rnd()-.5,rnd()-.5,rnd()-.5).multiplyScalar(.7));
    const ax=d.clone().add(new T.Vector3(rnd()-.5,rnd()-.5,rnd()-.5).multiplyScalar(1.6)).normalize();leaf(q,ax,1.5+rnd()*1.0);}
   // buquê na ponta
   for(let k=0;k<(depth===3?10:4);k++){const ax=new T.Vector3(rnd()-.5,rnd()-.3,rnd()-.5).normalize();leaf(pos.clone().add(new T.Vector3((rnd()-.5)*.8,(rnd()-.5)*.8,(rnd()-.5)*.8)),ax,1.7+rnd()*.8);}}
 }
 for(let i=0;i<8;i++){const phi=i/8*TAU+rnd()*.35,e=.5+rnd()*.5,dir=new T.Vector3(Math.sin(phi)*Math.cos(e),Math.sin(e),Math.cos(phi)*Math.cos(e));
  const st=new T.Vector3(Math.sin(phi)*4.8,TH-.6,Math.cos(phi)*4.8);grow(st,dir,24+rnd()*5,3.1,1.3,0);}
 // normais das folhas: apontam para fora do centro da copa (sombreamento redondo)
 const lg=new T.BufferGeometry();lg.setAttribute('position',new T.Float32BufferAttribute(leafV.P,3));lg.setAttribute('uv',new T.Float32BufferAttribute(leafV.U,2));lg.setAttribute('color',new T.Float32BufferAttribute(leafV.C,3));lg.setIndex(leafV.I);
 {const pp=leafV.P,nn=new Float32Array(pp.length),v=new T.Vector3();for(let i=0;i<pp.length;i+=3){v.set(pp[i]-leafCenter.x,pp[i+1]-leafCenter.y,pp[i+2]-leafCenter.z);v.y*=1.3;v.normalize();nn[i]=v.x;nn[i+1]=v.y*.8+.2;nn[i+2]=v.z;}lg.setAttribute('normal',new T.BufferAttribute(nn,3));}
 lg.computeBoundingSphere();
 const leaves=new T.Mesh(lg,AB.leafMat);leaves.name='Folhas da árvore gigante';leaves.castShadow=false;leaves.receiveShadow=true;root.add(leaves);
 root.add(build(branchM,barkM,'Galhos da árvore gigante',true));

 /* ---------- Ponte em arco até a margem ---------- */
 const BR={z0:LG.ri+1,z1:LG.r+9,w:3.4},bridgeY=t=>{const a=H(LG.x,LG.z+BR.z0),b=H(LG.x,LG.z+BR.z1);return a+(b-a)*t+1.5*Math.pow(Math.sin(PI*t),.9);};
 const bridgeT=z=>(z-(LG.z+BR.z0))/(BR.z1-BR.z0);
 {const g=new T.Group();g.name='Ponte da ilha do lago';scene.add(g);
  const len=BR.z1-BR.z0,N=Math.round(len/1.2),m=Mesher();
  for(let i=0;i<=N;i++){const t=i/N,z=LG.z+BR.z0+len*t,y=bridgeY(t);for(const s of [-1,1]){m.P.push(LG.x+s*BR.w/2,y,z);m.N.push(0,1,0);m.U.push(s<0?0:1,t*len/2.4);m.C.push(1,1,1);}}
  for(let i=0;i<N;i++){const a=i*2;m.I.push(a,a+1,a+2,a+1,a+3,a+2);}
  g.add(build(m,deckM,'Tabuleiro da ponte',false));
  const post=Mesher(),rl=Mesher();
  for(const s of [-1,1]){let prev=null;for(let i=0;i<=N;i+=2){const t=i/N,z=LG.z+BR.z0+len*t,y=bridgeY(t),x=LG.x+s*(BR.w/2+.05);
   tube(post,[new T.Vector3(x,y-.3,z),new T.Vector3(x,y+1.1,z)],[.1,.09],6,2);
   // pilares sob a água
   if(i%6===0&&t>.08&&t<.92){tube(post,[new T.Vector3(x,H(x,z)-.3,z),new T.Vector3(x,y-.3,z)],[.22,.2],6,2);}
   const top=new T.Vector3(x,y+1.05,z);if(prev){tube(rl,[prev.clone(),top],[.06,.06],5,2);const lo=new T.Vector3(x,y+.55,z),plo=new T.Vector3(x,bridgeY((i-2)/N)+.55,z-2.4);tube(rl,[plo,lo],[.045,.045],5,2);}prev=top;}}
  g.add(build(post,plainBark,'Postes da ponte',false));g.add(build(rl,plainBark,'Corrimão da ponte',false));
  // lanternas nas cabeceiras
  for(const t of [.04,.5,.96])for(const s of [-1,1]){const z=LG.z+BR.z0+len*t,y=bridgeY(t),x=LG.x+s*(BR.w/2+.05);const lp=new T.Mesh(new T.SphereGeometry(.2,9,7),glowM);lp.position.set(x,y+1.5,z);g.add(lp);}
  // colisão: corrimãos e piso
  for(let i=0;i<N;i++){const zc=LG.z+BR.z0+len*(i+.5)/N;for(const s of [-1,1])O.addBox({x:LG.x+s*(BR.w/2+.1),z:zc,hw:.12,hd:len/N/2+.05,rot:0});}
  (window.arcanoExtraDecks=window.arcanoExtraDecks||[]).push({
   surfaceAt(x,z){const dx=Math.abs(x-LG.x);if(dx>BR.w/2+.02)return null;const t=bridgeT(z);if(t<0||t>1)return null;return bridgeY(t)+.04;},
   blocksSegment(x1,z1,x2,z2){return false;}});
 }

 /* ---------- Piso interno, colisão e câmera ---------- */
 const frac=th=>{let t=((th-THS)/TAU)%1;if(t<0)t+=1;return t;};
 const inHole=th=>{const d=(((th-(THE-HOLE))%TAU)+TAU)%TAU;return d<HOLE;};
 const floorFn=(x,z)=>{
  const dx=x-LG.x,dz=z-LG.z,r=Math.hypot(dx,dz);if(r>10.2)return null;
  const th=Math.atan2(dx,dz),p=api.getGrassPlayer&&api.getGrassPlayer(),py=p?p.position.y-base:0;
  // túnel da porta
  if(r>=RIN-.2&&r<=10.9){const lat=Math.abs(dz>0?dx:99);if(lat<DOORW+.3&&dz>0)return base+Y0;return null;}
  if(r>RIN+.1)return null;
  const cand=[Y0];
  if(r>=RAMP_IN-.05&&r<=RIN+.1){const t=frac(th);for(let k=0;k<5;k++){const y=Y0+(t+k)*RISE;if(y<=YTOP+.05)cand.push(y);}}
  if(r<=RAMP_OUT+.2&&!(r>=RAMP_IN&&inHole(th)))cand.push(YTOP);
  let best=Y0;for(const c of cand)if(c<=py+.9&&c>best)best=c;
  return base+best+.02;
 };
 (window.arcanoGroundOverrides=window.arcanoGroundOverrides||[]).push(floorFn);
 // parede do tronco: anel de caixas, com a porta aberta e batentes
 {const NS=26;for(let k=0;k<NS;k++){const th=(k+.5)/NS*TAU;if(Math.abs(angd(th,DOOR))<.5)continue;for(const [r,hd] of [[5.9,1.75],[9.1,1.75]]){const w=W(Math.sin(th)*r,Math.cos(th)*r);O.addBox({x:w.x,z:w.z,hw:r*Math.tan(PI/NS)+.25,hd,rot:th});}}
  for(const s of [-1,1])for(const [z0,z1] of [[RIN+.4,10.9]]){const w=W(s*(DOORW+.3),(z0+z1)/2);O.addBox({x:w.x,z:w.z,hw:.22,hd:(z1-z0)/2,rot:0});}}
 // câmera: ao entrar, o casco de fora some e a parede de dentro aparece
 let inside=false;const fireflies=[];
 (function frame(){requestAnimationFrame(frame);
  const p=api.getGrassPlayer&&api.getGrassPlayer();if(!p){return;}
  const dx=p.position.x-LG.x,dz=p.position.z-LG.z,r=Math.hypot(dx,dz),now=r<RIN+.6||(dz>0&&Math.abs(dx)<DOORW&&r<7.6);
  if(now!==inside){inside=now;outerMesh.visible=!inside;for(const e of outerMesh.userData.glows||[])e.visible=!inside;}
  for(const f of fireflies){f.t+=.016;f.s.position.set(f.x+Math.sin(f.t*f.sp+f.ph)*f.ax,f.y+Math.sin(f.t*f.sp*1.3+f.ph*2)*f.ay,f.z+Math.cos(f.t*f.sp*.8+f.ph)*f.ax);f.s.material.opacity=.45+.4*Math.sin(f.t*2.2+f.ph);}
 })();
 // vaga-lumes na copa e em volta da ilha
 {const glow=(()=>{const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),gr=g.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'rgba(255,245,170,1)');gr.addColorStop(1,'rgba(255,230,120,0)');g.fillStyle=gr;g.fillRect(0,0,32,32);return new T.CanvasTexture(c);})();
  for(let i=0;i<70;i++){const a=rnd()*TAU,r=6+rnd()*34,y=3+rnd()*48,s=new T.Sprite(new T.SpriteMaterial({map:glow,transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false}));s.scale.set(.5,.5,1);root.add(s);
   fireflies.push({s,x:Math.sin(a)*r,y,z:Math.cos(a)*r,ax:1+rnd()*2,ay:.6+rnd()*1.2,sp:.5+rnd()*.8,ph:rnd()*6,t:rnd()*9});}}
 window.arcanoArvoreGigante={root,base,tronco:outerMesh};
 console.info('[Árvore gigante] pronta: '+(leafV.P.length/12|0)+' folhas');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
