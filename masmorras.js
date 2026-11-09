/* Minas de cristal abandonadas, espalhadas pela floresta.
   Cada uma é uma cratera escavada no terreno (gancho window.arcanoPits, lido por ilha-central.js) coberta por uma
   colina de rocha. Dentro há TRÊS ANDARES subterrâneos ligados por escadarias: túneis tortos escavados na rocha,
   cavernas largas, escoras de madeira, trilhos, vagonetes, acampamentos de mineiros e cristais brilhando.
   A cada partida de sorteio (fixo por mina) o desenho dos túneis muda. Ao entrar, a colina some e os andares de
   cima também, para a câmera enxergar o andar onde você está. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const PI=Math.PI,TAU=PI*2,CASTLE={x:0,z:-230};
const G0=16.45,N=11,C=4.5,HALF=N*C/2,HF=HALF+.6,LV=[-6,-13.5,-21],HEAD=5,SLAB=2.5,BED=-26.5,TRL=-6.8;
const SITES=[
 {id:'cripta',nome:'Mina dos Esquecidos',x:248,z:-495,seed:11,tint:[.55,.85,1]},
 {id:'prisao',nome:'Mina da Colina',x:204,z:-373,seed:22,tint:[.8,.55,1]},
 {id:'cofre',nome:'Mina do Dragão',x:77,z:-576,seed:33,tint:[1,.78,.4]},
 {id:'mina',nome:'Mina Abandonada',x:-236,z:-466,seed:44,tint:[.5,.9,1]},
 {id:'gruta',nome:'Gruta Cristalina',x:177,z:-531,seed:55,tint:[.9,.6,1]}
];
const sm=(a,b,t)=>{t=Math.min(1,Math.max(0,(t-a)/(b-a)));return t*t*(3-2*t);};
for(const s of SITES){s.rot=Math.atan2(CASTLE.x-s.x,CASTLE.z-s.z);s.c=Math.cos(s.rot);s.s=Math.sin(s.rot);}
(window.arcanoClearings=window.arcanoClearings||[]);
for(const s of SITES){window.arcanoClearings.push({x:s.x,z:s.z,r:40});window.arcanoClearings.push({x1:s.x,z1:s.z,x2:s.x+s.s*78,z2:s.z+s.c*78,r:11});}
window.arcanoMasmorras=SITES;
(window.arcanoNoGrass=window.arcanoNoGrass||[]).push((x,z)=>{for(const s of SITES){const dx=x-s.x,dz=z-s.z;if(dx*dx+dz*dz>9000)continue;const lx=dx*s.c-dz*s.s,lz=dx*s.s+dz*s.c;if(Math.hypot(lx,lz)<40||(lz>0&&lz<80&&Math.abs(lx)<12))return true;}return false;});

/* Escavação do terreno: cratera quadrada sob a colina + vala de entrada que desce até o primeiro andar. */
window.arcanoPits=(x,z,y0)=>{
 for(const s of SITES){
  const dx=x-s.x,dz=z-s.z;if(dx*dx+dz*dz>7000)continue;
  const lx=dx*s.c-dz*s.s,lz=dx*s.s+dz*s.c;let y=y0;
  const ax=Math.abs(lx),inT=sm(HALF-2.5,HALF-1.5,lz);
  const dBox=Math.max(ax,Math.abs(lz))-HF,core=inT*(1-sm(3.2,4.6,ax));
  const wp=(1-sm(0,7,dBox))*(1-core),bed=G0+BED;
  if(wp>0&&y>bed)y+=(bed-y)*wp;
  if(lz>0&&lz<95){const tl=G0+TRL+Math.max(0,lz-33)*.2,wl=(1-sm(3.2,8.2,ax))*inT;if(tl<y)y+=(tl-y)*wl;}
  return y;}
 return y0;};
const mkRng=seed=>{let s=(seed>>>0)||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};};
const nzz=(x,y,z)=>Math.sin(x*.9+y*.7)*Math.cos(z*.8-y*.4)+.5*Math.sin(x*2.1-z*1.7+y);
const topD=(x,z)=>.35*Math.sin(x*.55+1.3)*Math.cos(z*.47)+.2*Math.sin(x*1.3+z*1.1);
const cx=i=>-HALF+C*(i+.5),cz=j=>-HALF+C*(j+.5);
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];

/* ---------- Sorteio dos três andares ---------- */
function generate(rnd){
 const mk=()=>Array.from({length:N},()=>new Array(N).fill(0));
 const P=[mk(),mk(),mk()],R=[mk(),mk(),mk()];             // P: 0 rocha, 1 vazio, 2 poço de escada; R: reservado (fica rocha)
 const inG=(i,j)=>i>=0&&j>=0&&i<N&&j<N,inner=(i,j)=>i>=1&&j>=1&&i<=N-2&&j<=N-2;
 for(let k=0;k<3;k++)for(let a=0;a<N;a++){R[k][a][0]=R[k][a][N-1]=R[k][0][a]=R[k][N-1][a]=1;}
 const E=[5,N-1];P[0][E[1]][E[0]]=1;R[0][E[1]][E[0]]=0;
 const stairs=[];
 for(let k=0;k<2;k++){
  for(let t=0;t<800;t++){
   const ti=1+Math.floor(rnd()*(N-2)),tj=1+Math.floor(rnd()*(N-2)),d=DIRS[Math.floor(rnd()*4)];
   const cells=[1,2,3,4].map(m=>[ti+d[0]*m,tj+d[1]*m]);if(!cells.every(([i,j])=>inner(i,j)))continue;
   const F=cells.slice(0,3),B=cells[3],side=F.flatMap(([i,j])=>[[i+d[1],j+d[0]],[i-d[1],j-d[0]]]);
   const free=(kk,[i,j])=>P[kk][j][i]===0&&R[kk][j][i]===0;
   if(!F.every(c=>free(k,c)&&free(k+1,c)))continue;
   if(!side.every(c=>P[k][c[1]][c[0]]===0&&P[k+1][c[1]][c[0]]===0))continue;
   if(!(P[k][tj][ti]!==2&&R[k][tj][ti]===0&&P[k+1][tj][ti]===0&&R[k+1][tj][ti]===0))continue;
   if(!(P[k][B[1]][B[0]]===0&&R[k][B[1]][B[0]]===0&&P[k+1][B[1]][B[0]]===0&&R[k+1][B[1]][B[0]]===0))continue;
   if(k===0&&Math.abs(ti-E[0])+Math.abs(tj-E[1])<5)continue;
   if(k===1){const b0=stairs[0].B;if(Math.abs(ti-b0[0])+Math.abs(tj-b0[1])<4)continue;}
   for(const [i,j] of F){P[k][j][i]=2;P[k+1][j][i]=2;}
   for(const [i,j] of side){R[k][j][i]=1;R[k+1][j][i]=1;}
   P[k][tj][ti]=1;R[k+1][tj][ti]=1;P[k+1][B[1]][B[0]]=1;R[k][B[1]][B[0]]=1;R[k+1][B[1]][B[0]]=0;
   stairs.push({k,T:[ti,tj],d,B,F});break;}
 }
 if(stairs.length<2)return null;
 const blockedFor=(k,i,j)=>!inG(i,j)||P[k][j][i]===2||(R[k][j][i]===1&&P[k][j][i]!==1);
 function route(k,a,b){
  const dist=new Float32Array(N*N).fill(1e9),prev=new Int16Array(N*N).fill(-1),done=new Uint8Array(N*N),ai=a[1]*N+a[0],bi=b[1]*N+b[0];dist[ai]=0;
  for(;;){let u=-1,bd=1e9;for(let q=0;q<N*N;q++)if(!done[q]&&dist[q]<bd){bd=dist[q];u=q;}if(u<0||u===bi)break;done[u]=1;const ui=u%N,uj=(u/N)|0;
   for(const [di,dj] of DIRS){const i=ui+di,j=uj+dj;if(blockedFor(k,i,j))continue;const q=j*N+i,c=bd+(P[k][j][i]===1?.35:1+rnd()*1.7);if(c<dist[q]){dist[q]=c;prev[q]=u;}}}
  if(dist[bi]>=1e9)return false;
  for(let q=bi;q>=0;q=prev[q]){const i=q%N,j=(q/N)|0;if(P[k][j][i]===0)P[k][j][i]=1;if(q===ai)break;}return true;}
 function cavern(k,ci,cj,w,h){let n=0;for(let j=cj;j<cj+h;j++)for(let i=ci;i<ci+w;i++){if(!inner(i,j)||P[k][j][i]===2||R[k][j][i]===1)continue;if(rnd()<.05&&(w>3||h>3))continue;if(P[k][j][i]===0){P[k][j][i]=1;n++;}}return n;}
 const anchors=[E,stairs[0].B,stairs[1].B],targets=[stairs[0].T,stairs[1].T,null],rooms=[[],[],[]];
 // andar 2: sala do fundo (3x3) no ponto mais longe da escada
 let far=null,fd=-1;for(let j=2;j<N-3;j++)for(let i=2;i<N-3;i++){const d=Math.abs(i-anchors[2][0])+Math.abs(j-anchors[2][1]);if(d>fd&&P[2][j][i]===0&&R[2][j][i]===0){fd=d;far=[i,j];}}
 targets[2]=far||[5,5];
 for(let k=0;k<3;k++){
  route(k,anchors[k],targets[k]);
  if(k===2){cavern(2,targets[2][0]-1,targets[2][1]-1,3,3);rooms[2].push({i:targets[2][0],j:targets[2][1],boss:true});}
  for(let q=0;q<(k===2?3:4);q++){
   const w=3+Math.floor(rnd()*3),h=3+Math.floor(rnd()*2),ci=1+Math.floor(rnd()*(N-2-w)),cj=1+Math.floor(rnd()*(N-2-h));
   if(cavern(k,ci,cj,w,h)>2){const m=[Math.floor(ci+w/2),Math.floor(cj+h/2)];if(P[k][m[1]][m[0]]===1){route(k,m,anchors[k]);rooms[k].push({i:m[0],j:m[1]});}}}
  for(let q=0;q<3;q++){const t=[1+Math.floor(rnd()*(N-2)),1+Math.floor(rnd()*(N-2))];if(P[k][t[1]][t[0]]===0&&!blockedFor(k,t[0],t[1]))route(k,anchors[k],t);}
  for(let q=0;q<2;q++){const o=[];for(let j=1;j<N-1;j++)for(let i=1;i<N-1;i++)if(P[k][j][i]===1)o.push([i,j]);if(o.length>6)route(k,o[Math.floor(rnd()*o.length)],o[Math.floor(rnd()*o.length)]);}
 }
 return {P,stairs,E,rooms};
}

/* Rocha natural: facetas irregulares, estratos, rachaduras e pontinhos brilhantes (cor + relevo, sem emenda). */
function rockTex(sd,hue,sat,l0,gravel){
 let q=sd>>>0;const R=()=>{q=(q*1664525+1013904223)>>>0;return q/4294967296;};
 const S=512,a=document.createElement('canvas'),b=document.createElement('canvas');a.width=a.height=b.width=b.height=S;
 const g=a.getContext('2d'),h=b.getContext('2d');
 g.fillStyle=`hsl(${hue},${sat}%,${l0}%)`;g.fillRect(0,0,S,S);h.fillStyle='#808080';h.fillRect(0,0,S,S);
 const wrap=fn=>{for(const ox of [-S,0,S])for(const oy of [-S,0,S])fn(ox,oy);};
 const nF=gravel?900:420;
 for(let i=0;i<nF;i++){const x=R()*S,y=R()*S,r=(gravel?6:14)+R()*(gravel?14:44),k=5+Math.floor(R()*4),rot=R()*6.3,L=l0+(R()-.5)*18,H=hue+(R()-.5)*16;
  wrap((ox,oy)=>{if(x+ox<-r*1.5||x+ox>S+r*1.5||y+oy<-r*1.5||y+oy>S+r*1.5)return;
   const path=gg=>{gg.beginPath();for(let t=0;t<k;t++){const an=rot+t/k*6.283,rr=r*(.65+R()*.5);gg[t?'lineTo':'moveTo'](x+ox+Math.cos(an)*rr,y+oy+Math.sin(an)*rr*.8);}gg.closePath();};
   const sv=q;path(g);g.fillStyle=`hsl(${H},${sat}%,${L}%)`;g.fill();g.strokeStyle=`hsla(${hue},${sat}%,${Math.max(6,l0-16)}%,.7)`;g.lineWidth=1.5;g.stroke();
   q=sv;path(h);const v=110+Math.floor(R()*70);h.fillStyle=`rgb(${v},${v},${v})`;h.fill();h.strokeStyle='rgba(20,20,20,.7)';h.lineWidth=2;h.stroke();});}
 for(let i=0;i<9;i++){const y=R()*S,w=3+R()*10;wrap((ox,oy)=>{g.fillStyle=`rgba(0,0,0,${.12+R()*.1})`;g.fillRect(0,y+oy,S,w);h.fillStyle='rgba(30,30,30,.4)';h.fillRect(0,y+oy,S,w*.6);});}
 for(let i=0;i<(gravel?8:26);i++){let x=R()*S,y=R()*S;g.strokeStyle='rgba(6,6,10,.75)';g.lineWidth=1.4+R()*1.8;g.beginPath();g.moveTo(x,y);for(let t=0;t<6;t++){x+=(R()-.5)*50;y+=10+R()*30;g.lineTo(x,y);}g.stroke();h.strokeStyle='rgba(10,10,10,.8)';h.lineWidth=3;h.beginPath();h.moveTo(x,y);h.lineTo(x+(R()-.5)*30,y+30);h.stroke();}
 for(let i=0;i<260;i++){g.fillStyle=R()<.7?'rgba(255,255,255,.06)':'rgba(150,210,255,.28)';g.fillRect(R()*S,R()*S,1+R()*2,1+R()*2);}
 const m=new T.CanvasTexture(a),bp=new T.CanvasTexture(b);for(const t of [m,bp]){t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;}m.colorSpace=T.SRGBColorSpace;return {map:m,bump:bp};
}
function install(){
 const api=window.arcanoWaterV1226,VM=window.__vm,O=window.arcanoObstacles,H=window.arcanoIslandHeight,AT=window.arcanoTex;
 if(!api||!api.scene||!H||!O||!VM||!VM.makeMats||!AT){setTimeout(install,500);return;}
 const scene=api.scene,{box,cyl,sph,cone,rod}=VM;
 const M=VM.makeMats();
 const at=(t,sc,o)=>new T.MeshStandardMaterial(Object.assign({map:t.map,bumpMap:t.bump,bumpScale:sc,roughness:1},o||{}));
 const rockT=rockTex(201,222,9,30,false);
 M.rock=at(rockT,1.6,{vertexColors:true,side:T.DoubleSide});
 M.rockCeil=at(rockT,1.2,{vertexColors:true});
 M.rockPlain=at(rockT,1.3);
 M.mfloor=at(rockTex(205,28,16,26,true),1.4,{vertexColors:true,side:T.DoubleSide});
 M.coin=new T.MeshStandardMaterial({color:'#ffd35a',emissive:new T.Color('#a06a10'),emissiveIntensity:.5,roughness:.35,metalness:.4});
 M.bone=new T.MeshStandardMaterial({color:'#efe6d0',roughness:1});
 M.eye=new T.MeshStandardMaterial({color:'#1a1414',roughness:1});
 M.crystalC=new T.MeshStandardMaterial({color:'#bff8ff',emissive:new T.Color('#2fd0ff'),emissiveIntensity:1.7,roughness:.25});
 M.crystalP=new T.MeshStandardMaterial({color:'#f0c8ff',emissive:new T.Color('#c05cff'),emissiveIntensity:1.6,roughness:.25});
 M.crystalA=new T.MeshStandardMaterial({color:'#ffe6a8',emissive:new T.Color('#ffa21f'),emissiveIntensity:1.5,roughness:.25});
 const tx=VM.TEX;
 const flameMat=new T.SpriteMaterial({map:tx.flame(),transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false});
 const glowMat=new T.SpriteMaterial({map:tx.glow(),transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false,opacity:.7});
 const root=new T.Group();root.name='Minas de cristal';scene.add(root);
 const label=document.createElement('div');label.id='masmorraLabel';label.style.cssText='position:fixed;top:92px;left:50%;transform:translateX(-50%);z-index:45;display:none;font:600 15px Georgia,serif;color:#fff5dc;background:rgba(30,24,40,.82);border:1px solid #9a8ac8;border-radius:10px;padding:6px 16px;pointer-events:none';document.body.appendChild(label);
 const dungeons=[];
 const barrel=(g,x,y,z)=>cyl(g,.4,.4,.8,M.woodDark,x,y,z,10,1.2);

 for(const site of SITES){
  const rnd=mkRng(site.seed*977+13);
  let L=null;for(let t=0;t<30&&!L;t++)L=generate(rnd);
  if(!L){console.warn('[Minas] sorteio falhou em '+site.id);continue;}
  const {P,stairs,E,rooms}=L,rot=site.rot,c=site.c,s=site.s;
  const W=(lx,lz)=>({x:site.x+lx*c+lz*s,z:site.z-lx*s+lz*c});
  const group=new T.Group();group.name=site.nome;group.position.set(site.x,G0,site.z);group.rotation.y=rot;root.add(group);
  const fixed=new T.Group();group.add(fixed);const shell=new T.Group();group.add(shell);
  const kRange=k=>({ymin:G0+LV[k]-1.6,ymax:G0+LV[k]+HEAD+1.2});
  const colBox=(lx,lz,hw,hd,k,ang)=>{const w=W(lx,lz),o={x:w.x,z:w.z,hw,hd,rot:rot+(ang||0)};if(k!=null)Object.assign(o,kRange(k));O.addBox(o);};
  const colCircle=(lx,lz,r,k)=>{const w=W(lx,lz);O.addCircle(w.x,w.z,r,k!=null?kRange(k):undefined);};
  const st=(k,i,j)=>(i<0||j<0||i>=N||j>=N)?0:P[k][j][i];
  const tint=site.tint;
  const levels=[];
  const flames=[];

  for(let k=0;k<3;k++){
   const lg=new T.Group();lg.name=site.nome+' · andar '+(k+1);group.add(lg);
   const tmp=new T.Group(),live=new T.Group();lg.add(live);
   const y0=LV[k];
   /* ----- rocha, piso e teto (malhas com vértices deslocados para sair do "quadrado") ----- */
   const RM={P:[],U:[],C:[],I:[]},FM={P:[],U:[],C:[],I:[]},CM={P:[],U:[],C:[],I:[]};
   const grid=(m,nu,nv,pf)=>{const b=m.P.length/3;for(let v=0;v<=nv;v++)for(let u=0;u<=nu;u++){const q=pf(u,v);m.P.push(q[0],q[1],q[2]);m.U.push(q[3],q[4]);m.C.push(q[5],q[6],q[7]);}
    for(let v=0;v<nv;v++)for(let u=0;u<nu;u++){const a=b+v*(nu+1)+u,bb=a+1,cc=a+nu+1,d=cc+1;m.I.push(a,bb,cc,bb,d,cc);}};
   const shade=(x,y,z,dark)=>{const n=nzz(x*1.3,y*.9,z*1.3),vein=Math.max(0,n-.85)*1.4,b=(.74-.07*k)*(.88+.14*Math.sin(x*2.7+z*2.1+y)),t=Math.min(1.25,vein);return [Math.min(1.2,b*dark+tint[0]*t*.55),Math.min(1.2,b*dark+tint[1]*t*.55),Math.min(1.2,b*dark+tint[2]*t*.55)];};
   const wall=(x0,z0,x1,z1,nx,nz)=>{const NU=3,NV=6,yb=y0-SLAB,hh=HEAD+SLAB;
    grid(RM,NU,NV,(u,v)=>{const tu=u/NU,tv=v/NV,x=x0+(x1-x0)*tu,z=z0+(z1-z0)*tu,env=Math.sin(PI*tu)*Math.pow(Math.sin(PI*tv),.7),amp=(.2+Math.max(0,nzz(x,tv*7,z))*.6)*env;
     const y=yb+tv*hh+(v===NV?topD(x,z):0),col=shade(x,y,z,1);return [x+nx*amp,y,z+nz*amp,(x+z)*.26,y*.26,col[0],col[1],col[2]];});};
   for(let j=0;j<N;j++)for(let i=0;i<N;i++){
    const v=st(k,i,j),x=cx(i),z=cz(j);
    if(v===0){grid(RM,3,3,(u,vv)=>{const px=x-C/2+C*u/3,pz=z-C/2+C*vv/3,py=y0+HEAD+topD(px,pz),col=shade(px,py,pz,.9);return [px,py,pz,px*.2,pz*.2,col[0],col[1],col[2]];});continue;}
    if(v===1){
     grid(FM,2,2,(u,vv)=>{const px=x-C/2+C*u/2,pz=z-C/2+C*vv/2,f=.82+.18*Math.sin(px*3.1+pz*2.3)*Math.cos(px*1.7-pz*2.9);return [px,y0+(u===1&&vv===1?.03*Math.sin(px*5):0),pz,px*.3,pz*.3,f*(1-.06*k),f*(1-.06*k),f*(1-.06*k)];});
     grid(CM,3,3,(u,vv)=>{const px=x-C/2+C*u/3,pz=z-C/2+C*vv/3,py=y0+HEAD+topD(px,pz)-.02,col=shade(px,py,pz,.8);return [px,py,pz,px*.22,pz*.22,col[0],col[1],col[2]];});
    }
    for(const [di,dj] of DIRS){
     const nb=st(k,i+di,j+dj);
     if(nb===0){ if(k===0&&i===E[0]&&j===E[1]&&dj===1)continue;
      {const ax=cx(i),az=cz(j);if(v===1){if(di===1)overlay(i,j,di,dj,ax+C/2,az-C/2,ax+C/2,az+C/2,-1,0);else if(di===-1)overlay(i,j,di,dj,ax-C/2,az-C/2,ax-C/2,az+C/2,1,0);else if(dj===1)overlay(i,j,di,dj,ax-C/2,az+C/2,ax+C/2,az+C/2,0,-1);else overlay(i,j,di,dj,ax-C/2,az-C/2,ax+C/2,az-C/2,0,1);}}
      if(di===1)wall(x+C/2,z-C/2,x+C/2,z+C/2,-1,0);else if(di===-1)wall(x-C/2,z-C/2,x-C/2,z+C/2,1,0);else if(dj===1)wall(x-C/2,z+C/2,x+C/2,z+C/2,0,-1);else wall(x-C/2,z-C/2,x+C/2,z-C/2,0,1);}
     else if(nb===2&&v===1){const ex=x+di*C/2,ez=z+dj*C/2,px=-dj*C/2,pz=di*C/2;grid(RM,1,1,(u,vv)=>[ex+px*(u?1:-1),y0-vv*SLAB,ez+pz*(u?1:-1),u,vv,.55,.55,.55]);}
    }
   }
   function overlay(i,j,di,dj,x0,z0,x1,z1,nx,nz){
    const hsh=(i*7+j*13+k*5+di*3+dj*11+site.seed)%7,mx=(x0+x1)/2+nx*.13,mz=(z0+z1)/2+nz*.13,alongZ=nx!==0,len=C-.2;
    if(hsh<3){ // parede forrada de tábuas com escoras
     box(tmp,alongZ?.14:len,HEAD-.15,alongZ?len:.14,M.wood,mx,y0,mz,0,2);
     for(const q of [-1,0,1]){const px=mx+(alongZ?nx*.1:q*len*.4),pz=mz+(alongZ?q*len*.4:nz*.1);box(tmp,.26,HEAD-.1,.26,M.woodDark,px,y0,pz,0,1.2);}
     box(tmp,alongZ?.2:len,.18,alongZ?len:.2,M.woodDark,mx+nx*.05,y0+1.6,mz+nz*.05,0,1.2);
    }else if(hsh===3||hsh===4){ // alvenaria de pedra até a altura do peito + rocha em cima
     box(tmp,alongZ?.3:len,3.1,alongZ?len:.3,M.stone,mx+nx*.05,y0,mz+nz*.05,0,1.5);
     box(tmp,alongZ?.4:len+.1,.2,alongZ?len+.1:.4,M.stoneDark,mx+nx*.05,y0+3.1,mz+nz*.05,0,1.5);
    }}
   const mkMesh=(m,mat,name,shadow)=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(m.P,3));g.setAttribute('uv',new T.Float32BufferAttribute(m.U,2));g.setAttribute('color',new T.Float32BufferAttribute(m.C,3));g.setIndex(m.I);g.computeVertexNormals();const me=new T.Mesh(g,mat);me.name=name;me.receiveShadow=true;me.castShadow=!!shadow;lg.add(me);return me;};
   mkMesh(RM,M.rock,'Rocha');mkMesh(FM,M.mfloor,'Piso');const ceil=mkMesh(CM,M.rockCeil,'Teto');

   /* ----- colisão: faixas de rocha por linha ----- */
   for(let j=0;j<N;j++){let i=0;while(i<N){if(st(k,i,j)!==0){i++;continue;}let e=i;while(e+1<N&&st(k,e+1,j)===0)e++;
    if(!(k===0&&j===N-1&&false))colBox((cx(i)+cx(e))/2,cz(j),(e-i+1)*C/2-.08,C/2-.08,k,0);i=e+1;}}
   // abertura da boca no andar 1: o corredor de entrada
   levels.push({group:lg,tmp,live,ceil,y0});
  }

  /* ----- escadarias ----- */
  for(const sd of stairs){
   const k=sd.k,tmp=levels[k].tmp,[ti,tj]=sd.T,d=sd.d,NS=30,base=LV[k+1]-.6,run=3*C/NS,xT=cx(ti),zT=cz(tj);
   for(let q=0;q<NS;q++){const t=(q+.5)/NS,top=LV[k]+(LV[k+1]-LV[k])*t,s2=.5+3*t,x=xT+d[0]*s2*C,z=zT+d[1]*s2*C;
    box(tmp,d[0]?run:C-.1,top-base,d[0]?C-.1:run,M.stone,x,base,z,0,1.5);}
   // escoras de madeira sobre a escada e lampiões
   for(const m of [1,3]){const x=xT+d[0]*(m+.5)*C*1.0,z=zT+d[1]*(m+.5)*C,yTop=LV[k]+HEAD;
    for(const sg of [-1,1]){const px=x+d[1]*sg*(C/2-.25),pz=z+d[0]*sg*(C/2-.25);box(tmp,.35,yTop-LV[k]-(m>1?.0:0),.35,M.wood,px,LV[k]-(m>1?SLAB*0:0)-(m>1?0:0),pz,0,1.2);}
    box(tmp,d[0]?.35:C,.32,d[0]?C:.35,M.wood,x,yTop-.5,z,0,1.2);}
  }

  /* ----- tochas ----- */
  const torch=(k,x,z,fx,fz)=>{const tmp=levels[k].tmp,live=levels[k].live,y=LV[k]+2.0;
   box(tmp,.14,.7,.14,M.woodDark,x,y,z,0,1);box(tmp,.3,.1,.3,M.iron,x,y+.65,z,0,1);cyl(tmp,.12,.08,.16,M.iron,x+fx*.15,y+.7,z+fz*.15,6,1);
   const f=new T.Sprite(flameMat);f.center.set(.5,.1);f.position.set(x+fx*.15,y+.85,z+fz*.15);f.scale.set(.5,.9,1);live.add(f);flames.push({s:f,k:.9,ph:rnd()*6,sp:8+rnd()*5});
   const gl=new T.Sprite(glowMat);gl.position.set(x+fx*.3,y+1.0,z+fz*.3);gl.scale.set(3.4,3.4,1);live.add(gl);VM.anim.glows.push({s:gl,base:3.4,night:false,ph:rnd()*6});};
  const glowAt=(k,x,y,z,col,sc)=>{const m=new T.SpriteMaterial({map:tx.glow(),color:col,transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false,opacity:.5}),g=new T.Sprite(m);g.position.set(x,y,z);g.scale.set(sc,sc,1);levels[k].live.add(g);};
  const crystal=(k,x,z,sc,m,col)=>{const tmp=levels[k].tmp,y=LV[k];for(let q=0;q<5;q++){const h=(.6+rnd()*1.5)*sc,a=rnd()*TAU,r=rnd()*.55*sc,o=cone(tmp,.2*sc,h,m,x+Math.cos(a)*r,y,z+Math.sin(a)*r,5,1);o.rotation.x=(rnd()-.5)*.55;o.rotation.z=(rnd()-.5)*.55;}colCircle(x,z,.6*sc,k);glowAt(k,x,y+1,z,col,3.4*sc);};
  const crystalMat=()=>({C:[M.crystalC,'#4fe0ff'],P:[M.crystalP,'#c05cff'],A:[M.crystalA,'#ffa21f']});
  const pickCrystal=()=>{const t=site.id==='cofre'?['A','A','C']:site.id==='prisao'||site.id==='gruta'?['P','C','P']:['C','C','P'];return crystalMat()[t[Math.floor(rnd()*3)]];};
  const bone=(k,x,z)=>{const tmp=levels[k].tmp,y=LV[k];for(let q=0;q<5;q++){const b=cyl(tmp,.04,.05,.5+rnd()*.3,M.bone,x+(rnd()-.5)*.9,y+.04,z+(rnd()-.5)*.9,5,1);b.rotation.z=PI/2;b.rotation.y=rnd()*3;b.position.y=y+.06;}
   sph(tmp,.17,M.bone,x,y+.18,z,1,.9,1,8);sph(tmp,.04,M.eye,x-.06,y+.22,z+.14,1,1,1,5);sph(tmp,.04,M.eye,x+.06,y+.22,z+.14,1,1,1,5);};
  const crate=(k,x,z,ry)=>{box(levels[k].tmp,.9,.8,.9,M.wood,x,LV[k],z,ry,1.2);colBox(x,z,.5,.5,k,ry);};
  const barrelC=(k,x,z)=>{barrel(levels[k].tmp,x,LV[k],z);colCircle(x,z,.45,k);};
  const chest=(k,x,z,ry,gold)=>{const tmp=levels[k].tmp,y=LV[k];box(tmp,1.1,.6,.7,M.wood,x,y,z,ry,1.4);const lid=cyl(tmp,.36,.36,1.1,M.wood,0,0,0,10,1.4);lid.rotation.z=PI/2;lid.rotation.y=ry;lid.position.set(x,y+.6,z);
   box(tmp,1.14,.1,.74,M.gold,x,y+.28,z,ry,1);box(tmp,.14,.3,.8,M.gold,x,y+.34,z,ry,1);if(gold)for(let q=0;q<5;q++)sph(tmp,.07,M.coin,x+(rnd()-.5)*.7,y+.86+rnd()*.1,z+(rnd()-.5)*.4,1,.6,1,6);colCircle(x,z,.7,k);};
  const goldPile=(k,x,z,sc)=>{const tmp=levels[k].tmp,y=LV[k];cone(tmp,1.3*sc,.9*sc,M.coin,x,y,z,12,1);for(let q=0;q<22;q++){const a=rnd()*TAU,r=rnd()*1.6*sc,c2=cyl(tmp,.1,.1,.03,M.coin,x+Math.cos(a)*r,y+.02+rnd()*.2,z+Math.sin(a)*r,8,1);c2.rotation.x=rnd()-.5;c2.rotation.z=rnd()-.5;}colCircle(x,z,1.1*sc,k);glowAt(k,x,y+.8,z,'#ffcf5a',3.5*sc);};
  const cart=(k,x,z,ry)=>{const g2=new T.Group();g2.position.set(x,LV[k],z);g2.rotation.y=ry;levels[k].tmp.add(g2);box(g2,1.5,.7,1.0,M.woodDark,0,.35,0,0,1);for(const sx of [-.55,.55])for(const sz of [-.5,.5]){const w=cyl(g2,.22,.22,.1,M.iron,0,0,0,10,1);w.rotation.x=PI/2;w.position.set(sx,.22,sz*1.05);}for(let q=0;q<6;q++)sph(g2,.16,rnd()<.5?M.crystalC:M.stoneDark,(rnd()-.5)*1.0,1.05+rnd()*.1,(rnd()-.5)*.6,1,.8,1,5);colCircle(x,z,.9,k);};
  const rails=(k,x,z,alongX)=>{const g2=new T.Group();g2.position.set(x,LV[k],z);g2.rotation.y=alongX?0:PI/2;levels[k].tmp.add(g2);for(const sz of [-.45,.45])box(g2,C,.08,.08,M.iron,0,.12,sz,0,1);for(const q of [-1.7,-.8,.1,1,1.8])box(g2,.2,.07,1.2,M.woodDark,q,.04,0,0,1);};
  const stalag=(k,x,z,sc)=>{const h=(.8+rnd()*1.8)*sc;cone(levels[k].tmp,.38*sc,h,M.rockPlain,x,LV[k],z,6,1.5);colCircle(x,z,.4*sc,k);};
  const hang=(k,x,z)=>{const tmp=levels[k].tmp,h=.7+rnd()*1.3,o=cone(tmp,.28,h,M.rockPlain,x,LV[k]+HEAD-h+.1,z,5,1.5);o.rotation.x=PI;o.position.y=LV[k]+HEAD-.05-h/2+.05;};
  const sarco=(k,x,z,ry)=>{const tmp=levels[k].tmp,y=LV[k];box(tmp,1.1,.8,2.3,M.stone,x,y,z,ry,1.6);box(tmp,1.25,.28,2.45,M.stoneDark,x,y+.8,z,ry,1.6);box(tmp,.18,.04,.9,M.gold,x,y+1.08,z,ry,1);colBox(x,z,.7,1.25,k,ry);};
  const bars=(k,x,z,ry,len)=>{const g2=new T.Group();g2.position.set(x,LV[k],z);g2.rotation.y=ry;levels[k].tmp.add(g2);for(let q=0;q<=Math.round(len/.3);q++)cyl(g2,.03,.03,3.2,M.iron,-len/2+q*.3,0,0,5,1);rod(g2,-len/2,.4,0,len/2,.4,0,.04,M.iron,5);rod(g2,-len/2,3.0,0,len/2,3.0,0,.04,M.iron,5);colBox(x,z,Math.abs(Math.cos(ry))*len/2+.12,Math.abs(Math.sin(ry))*len/2+.12,k,0);};
  const camp=(k,x,z)=>{const tmp=levels[k].tmp,y=LV[k];
   for(let q=0;q<8;q++){const a=q/8*TAU;sph(tmp,.2,M.stoneDark,x+Math.cos(a)*.6,y+.12,z+Math.sin(a)*.6,1,.7,1,6);}
   for(let q=0;q<3;q++){const lg=cyl(tmp,.07,.07,.9,M.woodDark,x,y+.1,z,6,1);lg.rotation.z=PI/2;lg.rotation.y=q*1.05;lg.position.set(x,y+.14,z);}
   const f=new T.Sprite(flameMat);f.center.set(.5,.1);f.position.set(x,y+.2,z);f.scale.set(1.0,1.6,1);levels[k].live.add(f);flames.push({s:f,k:1.4,ph:rnd()*6,sp:8+rnd()*4});
   const gl=new T.Sprite(glowMat);gl.position.set(x,y+1.0,z);gl.scale.set(6,6,1);levels[k].live.add(gl);VM.anim.glows.push({s:gl,base:6,night:false,ph:rnd()*6});
   colCircle(x,z,.8,k);
   for(const [dx,dz,ry] of [[2.0,.8,.3],[-1.8,1.4,-.5],[.4,-2.1,1.1]])box(tmp,.9,.18,1.8,M.hay||M.wood,x+dx,y,z+dz,ry,1);
   barrelC(k,x+1.9,z-1.6);barrelC(k,x+2.5,z-1.0);crate(k,x-2.2,z-1.2,.4);crate(k,x-2.3,z-.2,-.2);
   box(tmp,1.6,.1,.9,M.wood,x-1.2,y+.7,z+2.7,.2,1.2);for(const sx of [-.7,.7])for(const sz of [-.35,.35])box(tmp,.1,.7,.1,M.woodDark,x-1.2+sx,y,z+2.7+sz,.2,1);
   rod(tmp,x+3.0,y+.1,z+.2,x+3.0,y+1.5,z+.5,.04,M.woodDark,4);rod(tmp,x+2.8,y+1.45,z+.5,x+3.2,y+1.6,z+.5,.05,M.iron,4);};

  /* ----- decoração por andar ----- */
  for(let k=0;k<3;k++){
   const open=[],spots=[];
   for(let j=1;j<N-1;j++)for(let i=1;i<N-1;i++)if(st(k,i,j)===1){open.push([i,j]);
    const e=[st(k,i+1,j)===0,st(k,i-1,j)===0,st(k,i,j+1)===0,st(k,i,j-1)===0];
    const n=e.filter(Boolean).length,x=cx(i),z=cz(j);
    if(n===2&&e[0]===e[1]){ // corredor norte-sul: escoras e trilhos
     if((i+j)%2===0){for(const sg of [-1,1])box(levels[k].tmp,.35,HEAD-.35,.35,M.wood,x+sg*(C/2-.3),LV[k],z,0,1.2);box(levels[k].tmp,C-.1,.38,.4,M.wood,x,LV[k]+HEAD-.55,z,0,1.2);}
     if(rnd()<.7)rails(k,x,z,false);}
    else if(n===2&&e[2]===e[3]){
     if((i+j)%2===0){for(const sg of [-1,1])box(levels[k].tmp,.35,HEAD-.35,.35,M.wood,x,LV[k],z+sg*(C/2-.3),0,1.2);box(levels[k].tmp,.4,.38,C-.1,M.wood,x,LV[k]+HEAD-.55,z,0,1.2);}
     if(rnd()<.7)rails(k,x,z,true);}
    else if(n<=1&&(i+j)%2===0){const px=x,pz=z,yt=LV[k]+HEAD;box(levels[k].tmp,.5,HEAD-.4,.5,M.wood,px-.25+.25,LV[k],pz,0,1.2);box(levels[k].tmp,1.7,.34,.4,M.woodDark,px,yt-.55,pz,0,1.2);box(levels[k].tmp,.4,.34,1.7,M.woodDark,px,yt-.55,pz,0,1.2);for(const sg of [-1,1]){rod(levels[k].tmp,px+sg*.2,yt-1.1,pz,px+sg*1.2,yt-.45,pz,.07,M.wood,5);rod(levels[k].tmp,px,yt-1.1,pz+sg*.2,px,yt-.45,pz+sg*1.2,.07,M.wood,5);}colCircle(px,pz,.45,k);}
    if(e[0])spots.push([x+C/2-.45,z,-1,0]);if(e[1])spots.push([x-C/2+.45,z,1,0]);if(e[2])spots.push([x,z+C/2-.45,0,-1]);if(e[3])spots.push([x,z-C/2+.45,0,1]);}
   // tochas nas paredes
   for(let q=0;q<7&&spots.length;q++){const sp=spots.splice(Math.floor(rnd()*spots.length),1)[0];torch(k,...sp);}
   // cristais, estalactites, pedras
   for(const [i,j] of open){const x=cx(i),z=cz(j),r=rnd();
    if(r<.2){const m=pickCrystal();crystal(k,x+(rnd()-.5)*2.8,z+(rnd()-.5)*2.8,.8+rnd()*.7,m[0],m[1]);}
    else if(r<.34)stalag(k,x+(rnd()-.5)*3,z+(rnd()-.5)*3,.7+rnd()*.6);
    for(let q=0;q<2;q++)if(rnd()<.5)hang(k,x+(rnd()-.5)*3.6,z+(rnd()-.5)*3.6);
    if(rnd()<.16){const rk=new T.Mesh(new T.IcosahedronGeometry(.5+rnd()*.7,1),M.rockPlain);rk.position.set(x+(rnd()-.5)*3,LV[k]+.15,z+(rnd()-.5)*3);rk.scale.set(1,.65,1);rk.rotation.set(rnd()*3,rnd()*3,rnd()*3);rk.castShadow=true;levels[k].tmp.add(rk);colCircle(rk.position.x,rk.position.z,.6,k);}
    // temas
    const t=rnd();
    if(site.id==='cripta'&&t<.15){bone(k,x+(rnd()-.5)*2,z+(rnd()-.5)*2);}
    else if(site.id==='prisao'&&t<.12){bone(k,x+1,z+1);}
    else if(site.id==='cofre'&&t<.1){chest(k,x+(rnd()-.5)*2,z+(rnd()-.5)*2,rnd()*3,rnd()<.5);}
    else if(site.id==='mina'&&t<.12){cart(k,x+(rnd()-.5)*1.6,z+(rnd()-.5)*1.6,rnd()*3);}
    else if(site.id==='gruta'&&t<.18){stalag(k,x+(rnd()-.5)*3.4,z+(rnd()-.5)*3.4,1);}
   }
   // acampamentos de mineiros nas cavernas e salas
   for(const rm of rooms[k]){const x=cx(rm.i),z=cz(rm.j);
    if(rm.boss){
     if(site.id==='cripta'){sarco(k,x,z,0);sarco(k,x-3,z+2,PI/2);for(const sx of [-1,1])bone(k,x+sx*3,z-2);glowAt(k,x,LV[k]+1,z,'#80ffd0',7);}
     else if(site.id==='prisao'){bars(k,x,z+1.6,0,C*2.6);chest(k,x-2.5,z-2,.4,false);bone(k,x+2.4,z+2.8);bone(k,x-3,z+3);}
     else if(site.id==='cofre'){goldPile(k,x,z,2.0);chest(k,x-2.8,z-1.7,.5,true);chest(k,x+2.6,z-1.9,-.4,true);chest(k,x+3.0,z+1.6,-1.1,true);}
     else if(site.id==='mina'){crystal(k,x,z,2.4,M.crystalC,'#4fe0ff');crystal(k,x+3.2,z-1.8,1.3,M.crystalP,'#c05cff');cart(k,x-3,z+1.7,1.1);}
     else{const w=cyl(levels[k].tmp,2.8,2.8,.1,M.water||M.stone,x,LV[k],z,18,2);cyl(levels[k].tmp,3.1,3.2,.35,M.rockPlain,x,LV[k]-.12,z,18,2);crystal(k,x,z,1.8,M.crystalC,'#4fe0ff');crystal(k,x+3.4,z-2,1.2,M.crystalP,'#c05cff');crystal(k,x-3.2,z+2,1.1,M.crystalC,'#4fe0ff');}
     colCircle(x,z,1.4,k);
    }else if(k<2||rnd()<.5){camp(k,x,z);}
   }
  }
  /* ----- boca da mina: piso e paredões da entrada ----- */
  {const fw=Math.abs(0);const ent=new T.Group();fixed.add(ent);
   box(ent,6.6,.9,37.5-HALF+.2,M.mfloor,0,LV[0]-.9,(HALF-.2+37.5)/2,0,2);
   for(const sg of [-1,1]){const lx=sg*3.9;box(ent,1.8,9.2,38-HALF+.4,M.rockPlain,lx,-8.2,(HALF-.4+38)/2,0,2);
    const w=W(lx,(HALF+38)/2);O.addBox({x:w.x,z:w.z,hw:.9,hd:(38-HALF)/2,rot:rot,ymin:G0-8.5,ymax:G0+2});
    torch(0,sg*3.0,HALF+3.2,-sg,0);torch(0,sg*3.0,HALF+10,-sg,0);}
   // o chão da entrada é plano até o terreno subir (vala)
   (window.arcanoGroundOverrides=window.arcanoGroundOverrides||[]).push((x,z)=>{const dx=x-site.x,dz=z-site.z;if(dx*dx+dz*dz>4300)return null;const lx=dx*c-dz*s,lz=dx*s+dz*c;if(Math.abs(lx)<3.05&&lz>=HALF-.3&&lz<37.5)return G0+LV[0]+.03;return null;});
  }
  /* ----- piso: andares e escadas ----- */
  (window.arcanoGroundOverrides=window.arcanoGroundOverrides||[]).push((x,z)=>{
   const dx=x-site.x,dz=z-site.z;if(dx*dx+dz*dz>2500)return null;
   const lx=dx*c-dz*s,lz=dx*s+dz*c;if(Math.abs(lx)>=HALF||Math.abs(lz)>=HALF)return null;
   const i=Math.floor((lx+HALF)/C),j=Math.floor((lz+HALF)/C),p=api.getGrassPlayer&&api.getGrassPlayer(),py=p?p.position.y:G0+LV[0];
   let best=-1e9,any=false;
   for(let k=0;k<3;k++){const v=P[k][j][i];let y=null;
    if(v===1)y=G0+LV[k];
    else if(v===2){for(const q of stairs){if(q.F.some(f=>f[0]===i&&f[1]===j)){const sc=((lx-cx(q.T[0]))*q.d[0]+(lz-cz(q.T[1]))*q.d[1])/C,t=Math.min(1,Math.max(0,(sc-.5)/3));y=G0+LV[q.k]+(LV[q.k+1]-LV[q.k])*t;}}}
    if(y!==null&&y<=py+.9&&y>best){best=y;any=true;}}
   return any?best+.03:null;});

  /* ----- colina de rocha com a boca da caverna ----- */
  {const NA=72,NR=14,a=34,n=4,Hmax=10.5,Pp=[],Uu=[],Cc=[],I=[];
   const rs=phi=>a/Math.pow(Math.pow(Math.abs(Math.cos(phi)),n)+Math.pow(Math.abs(Math.sin(phi)),n),1/n);
   const noise=(x,z)=>.9*Math.sin(x*.31+z*.17)+.7*Math.sin(x*.13-z*.37+2)+.5*Math.sin(x*.57+z*.49)+.35*Math.sin(x*1.1-z*.9);
   const sector=(phi,t)=>Math.abs(Math.atan2(Math.sin(phi),Math.cos(phi)))<.2&&t>.55;
   for(let i=0;i<=NA;i++)for(let j=0;j<=NR;j++){
    const phi=i/NA*TAU,t=j/NR,r=rs(phi)*(t<.001?0:Math.max(.02,t)),x=Math.sin(phi)*r,z=Math.cos(phi)*r;
    let h=Hmax*Math.pow(1-Math.pow(t,2.6),.8)+noise(x,z)*(.35+.5*Math.sin(t*PI))*1.5;if(t>.985)h=-1;
    Pp.push(x,Math.max(-1,h),z);Uu.push(x*.16,z*.16+h*.12);
    const mo=Math.max(0,Math.min(1,(h/Hmax)*.9+.15*Math.sin(x*.4)));Cc.push(1-mo*.35,1,1-mo*.5);}
   const ring=NR+1;
   for(let i=0;i<NA;i++)for(let j=0;j<NR;j++){const t=(j+.5)/NR,phi=(i+.5)/NA*TAU;if(sector(phi,t))continue;const q=i*ring+j,q2=(i+1)*ring+j;I.push(q,q+1,q2,q2,q+1,q2+1);}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(Pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(Uu,2));g.setAttribute('color',new T.Float32BufferAttribute(Cc,3));g.setIndex(I);g.computeVertexNormals();
   const mat=M.rock.clone();mat.side=T.DoubleSide;const mound=new T.Mesh(g,mat);mound.name=site.nome+' · colina';mound.castShadow=true;mound.receiveShadow=true;shell.add(mound);
   // pilares e verga na boca; rochas soltas; anel de colisão
   const rockBox=(w,h,d,x,y,z,ry)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),M.rockPlain);b.position.set(x,y+h/2,z);b.rotation.y=ry||0;b.castShadow=true;shell.add(b);return b;};
   for(const sg of [-1,1])rockBox(2.4,9,3.2,sg*5.2,-1,35,0.08*sg);
   rockBox(13,2.6,3.4,0,5.4,35,0);
   for(let q=0;q<7;q++){const o=cone(shell,.22+rnd()*.12,.9+rnd()*1.0,M.rockPlain,(rnd()-.5)*7,5.4-1.2,34+rnd()*2,5,1);o.rotation.x=PI;}
   for(let q=0;q<18;q++){const ang=rnd()*TAU,r=rs(ang)*(.9+rnd()*.08);if(Math.abs(Math.atan2(Math.sin(ang),Math.cos(ang)))<.3)continue;const rk=new T.Mesh(new T.IcosahedronGeometry(1.4+rnd()*1.8,1),M.rockPlain);rk.position.set(Math.sin(ang)*r,.2+rnd()*.6,Math.cos(ang)*r);rk.scale.set(1,.7,1);rk.rotation.set(rnd()*3,rnd()*3,rnd()*3);rk.castShadow=true;shell.add(rk);}
   for(let q=0;q<48;q++){const ang=q/48*TAU;if(Math.abs(Math.atan2(Math.sin(ang),Math.cos(ang)))<.25)continue;const r=rs(ang)*.94;colCircle(Math.sin(ang)*r,Math.cos(ang)*r,2.4);}
  }
  VM.anim.flames.push(...flames);
  for(const lv of levels)VM.mergeInto(lv.tmp,lv.group,site.nome+' · objetos');
  // luz da entrada
  {const tf=new T.Sprite(glowMat);tf.position.set(0,LV[0]+2,HALF+5);tf.scale.set(7,7,1);fixed.add(tf);VM.anim.glows.push({s:tf,base:7,night:false,ph:rnd()*6});}
  dungeons.push({site,group,shell,levels,P,stairs,lx:(x,z)=>{const dx=x-site.x,dz=z-site.z;return [dx*c-dz*s,dx*s+dz*c];}});
 }
 VM.startAnim();window.arcanoMasmorrasObj=dungeons;

 // dentro: colina e andares de cima somem (câmera por cima); longe, as minas ficam escondidas
 let cur=null,saved=null;
 (function frame(){requestAnimationFrame(frame);
  const p=api.getGrassPlayer&&api.getGrassPlayer();if(!p)return;
  let found=null,lvl=0;
  for(const d of dungeons){const [lx,lz]=d.lx(p.position.x,p.position.z);
   const near=lx*lx+lz*lz<95*95;for(const l of d.levels)l.group.visible=near;
   if(Math.abs(lx)<HALF-.2&&Math.abs(lz)<HALF-.2){found=d;lvl=Math.min(2,Math.max(0,Math.round((G0+LV[0]-p.position.y)/7.5)));}}
  if(found!==cur){
   if(cur){cur.shell.visible=true;}
   cur=found;
   if(cur){saved={d:p.camDistance,pt:p.camPitch};p.camDistance=Math.min(Math.max(p.camDistance,7),9);p.camPitch=Math.max(p.camPitch,1.25);}
   else if(saved){p.camDistance=saved.d;p.camPitch=saved.pt;saved=null;label.style.display='none';}
  }
  if(cur){cur.shell.visible=false;cur.levels.forEach((l,k)=>{l.group.visible=k>=lvl;});label.textContent=cur.site.nome+' · andar '+(lvl+1);label.style.display='block';}
 })();
 console.info('[Minas] '+dungeons.length+' minas de cristal montadas');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
