/* Animais da floresta — 1º: CERVOS.
   Modelo próprio, estilo anime: corpo com pelagem pintada (dorso castanho, barriga e garganta creme,
   mancha branca na traseira), pescoço, cabeça com focinho, olhos brilhantes, orelhas grandes e
   chifres ramificados nos machos; filhotes com pintas. Pernas articuladas (ombro/quadril + joelho/jarrete).
   Comportamento (manadas pela ilha, em clareiras da mata):
   - pastar (abaixa o pescoço e mastiga), andar devagar atrás de capim novo, seguir a manada;
   - orelhas e cauda se mexem sozinhas;
   - quando o personagem se aproxima: para, levanta a cabeça e olha para ele (alerta);
   - perto demais ou chegando correndo: foge em galope saltado, a manada junto, e depois se acalma.
   Desempenho: só anima e mostra os cervos até ~150 m do personagem; poucos objetos por cervo. */
(function(){
'use strict';
const T=window.THREE;if(!T)return;
const PI=Math.PI,TAU=PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,rr=(a,b)=>a+Math.random()*(b-a);
const mobile=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||innerWidth<680;
const sstep=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const angDiff=(a,b)=>{let d=(b-a)%TAU;if(d>PI)d-=TAU;if(d<-PI)d+=TAU;return d;};

/* ---------- geometria com cor por vértice (malha indexada: sombreado suave) ---------- */
function Builder(){const P=[],N=[],C=[],I=[],col=new T.Color();
 const B={
  add(geo,color,m,colorFn){let g=geo.clone();if(m)g.applyMatrix4(m);if(!g.index){const a=[];for(let i=0;i<g.attributes.position.count;i++)a.push(i);g.setIndex(a);}
   g.computeVertexNormals();
   const p=g.attributes.position,n=g.attributes.normal,ix=g.index,base=P.length/3;if(color)col.set(color);
   for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);P.push(x,y,z);N.push(n.getX(i),n.getY(i),n.getZ(i));
    if(colorFn){const c=colorFn(x,y,z,n.getX(i),n.getY(i),n.getZ(i));C.push(c[0],c[1],c[2]);}else C.push(col.r,col.g,col.b);}
   for(let i=0;i<ix.count;i++)I.push(base+ix.getX(i));
   return B;},
  ell(x,y,z,rx,ry,rz,color,colorFn,seg){const g=new T.SphereGeometry(1,seg||16,Math.max(8,(seg||16)*.7|0));g.scale(rx,ry,rz);g.translate(x,y,z);return B.add(g,color,null,colorFn);},
  sweep(path,prof,o,color,colorFn){return B.add(sweepGeo(path,prof,o),color,null,colorFn);},
  build(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('normal',new T.Float32BufferAttribute(N,3));g.setAttribute('color',new T.Float32BufferAttribute(C,3));
   g.setIndex(P.length/3>65535?new T.Uint32BufferAttribute(I,1):new T.Uint16BufferAttribute(I,1));g.computeBoundingSphere();return g;}};
 return B;}
// curva suave (Catmull-Rom) passando pelos pontos-chave; serve para números e para listas
function spline(keys,s){const n=keys.length-1;if(n<1)return keys[0];const f=clamp(s,0,1)*n,i=Math.min(n-1,Math.floor(f)),t=f-i;
 const k0=keys[Math.max(0,i-1)],k1=keys[i],k2=keys[i+1],k3=keys[Math.min(n,i+2)];
 const cr=(p0,p1,p2,p3)=>.5*(2*p1+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t);
 if(typeof k1==='number')return cr(k0,k1,k2,k3);return k1.map((_,j)=>cr(k0[j]||0,k1[j]||0,k2[j]||0,k3[j]||0));}
// "massa" esticada ao longo de uma curva: em cada ponto, uma elipse de meia-largura w e meia-altura d.
// ca/cb: quanto do comprimento arredonda as pontas (0 = ponta aberta). Lados ligados sem costura -> sombra suave.
function sweepGeo(path,prof,o){o=o||{};const n=o.n||24,m=o.m||16,ca=o.ca==null?.15:o.ca,cb=o.cb==null?.15:o.cb;
 const pos=[],idx=[],X=new T.Vector3(1,0,0),Y=new T.Vector3(0,1,0),tg=new T.Vector3(),sd=new T.Vector3(),up=new T.Vector3();
 const at=s=>new T.Vector3(...spline(path,s));
 for(let i=0;i<=n;i++){const s=i/n,P=at(s);tg.subVectors(at(Math.min(1,s+.01)),at(Math.max(0,s-.01))).normalize();
  sd.copy(Math.abs(tg.dot(X))>.9?Y:X);up.crossVectors(tg,sd).normalize();sd.crossVectors(up,tg).normalize();
  let c=1;if(ca>0&&s<ca)c=Math.sqrt(Math.max(0,1-Math.pow(1-s/ca,2)));if(cb>0&&s>1-cb)c=Math.min(c,Math.sqrt(Math.max(0,1-Math.pow(1-(1-s)/cb,2))));
  const pr=spline(prof,s),w=pr[0],d=pr[1],sq=pr[2]||0;
  for(let j=0;j<m;j++){const a=j/m*TAU;let cx=Math.cos(a),sy=Math.sin(a);
   if(sq>0){const e=1/(1+sq);cx=Math.sign(cx)*Math.pow(Math.abs(cx),e);sy=Math.sign(sy)*Math.pow(Math.abs(sy),e);}   // seção mais "quadrada"
   pos.push(P.x+(sd.x*cx*w+up.x*sy*d)*c,P.y+(sd.y*cx*w+up.y*sy*d)*c,P.z+(sd.z*cx*w+up.z*sy*d)*c);}}
 for(let i=0;i<n;i++)for(let j=0;j<m;j++){const a=i*m+j,b=i*m+(j+1)%m,c=(i+1)*m+j,d=(i+1)*m+(j+1)%m;idx.push(a,b,c,b,d,c);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);return g;}

/* ---------- materiais (cel-shading do jogo + contorno) ---------- */
const furMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.85,metalness:0});
const inkMat=new T.MeshBasicMaterial({color:'#2b2140',side:T.BackSide});
inkMat.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed+=normal*.011;');};
inkMat.customProgramCacheKey=()=>'deer-ink-v2';
const meshWithInk=(geo,ink)=>{const m=new T.Mesh(geo,furMat);m.castShadow=true;if(ink){const o=new T.Mesh(geo,inkMat);m.add(o);}return m;};

/* ---------- pelagem ---------- */
const C3=h=>{const c=new T.Color(h);return [c.r,c.g,c.b];};
const mixC=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
const grain=(x,y,z)=>.95+.07*Math.sin(x*41+z*37+y*23)+.03*Math.sin(x*97-y*83+z*71);
const shade=(c,x,y,z)=>{const v=grain(x,y,z);return [c[0]*v,c[1]*v,c[2]*v];};
function coat(kind){
 const back=C3(kind==='fawn'?'#ad683b':kind==='doe'?'#a96b40':'#94582f'),dark=C3('#6a3c20'),flank=C3(kind==='buck'?'#a8693c':'#b67a4a'),cream=C3('#f1e6cf'),white=C3('#fbf8f0');
 return (x,y,z,nx,ny,nz)=>{
  // dorso castanho, flanco um pouco mais claro, barriga creme (pela direção da pele), risca escura no lombo
  let c=mixC(back,flank,sstep((.55-ny)/.6));
  c=mixC(c,cream,sstep((-ny-.1)/.45));
  if(ny>.82&&Math.abs(x)<.045&&z>-.5)c=mixC(c,dark,.55);
  if(z<-.5&&y>.84&&y<1.17&&Math.abs(x)<.13)c=white;                              // espelho branco em volta da cauda
  if(kind==='fawn'&&ny>.05&&ny<.85&&z>-.5&&z<.45){const s=Math.sin(z*30+(x>0?1:2))*Math.sin(y*34+x*14);if(s>.7)c=white;}
  return shade(c,x,y,z);};
}

/* ---------- pele única ----------
   O cervo é descrito por formas (tubos ao longo de curvas e elipsoides) somadas de modo SUAVE: onde duas formas
   se encontram, a superfície faz uma curva contínua em vez de uma quina. Dessa soma sai UMA malha fechada
   (surface nets), com cor e "peso de osso" por vértice. A malha se dobra com um esqueleto cujos ossos ficam
   nos mesmos lugares das articulações de antes (quadril, joelho, pescoço, cabeça, cauda), então a animação não muda.
   Olhos, nariz, orelhas e chifres continuam como peças presas ao osso da cabeça. */
const smin=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
function tubePrim(path,prof,o){o=o||{};const n=o.n||24,ca=o.ca==null?.15:o.ca,cb=o.cb==null?.15:o.cb;
 const X=new T.Vector3(1,0,0),Y=new T.Vector3(0,1,0),at=s=>new T.Vector3(...spline(path,s)),tg=new T.Vector3(),sd=new T.Vector3(),up=new T.Vector3();
 const A=new Float64Array((n+1)*14),box=[1e9,1e9,1e9,-1e9,-1e9,-1e9];
 for(let i=0;i<=n;i++){const s=i/n,P=at(s);tg.subVectors(at(Math.min(1,s+.01)),at(Math.max(0,s-.01))).normalize();
  sd.copy(Math.abs(tg.dot(X))>.9?Y:X);up.crossVectors(tg,sd).normalize();sd.crossVectors(up,tg).normalize();
  let c=1;if(ca>0&&s<ca)c=Math.sqrt(Math.max(0,1-Math.pow(1-s/ca,2)));if(cb>0&&s>1-cb)c=Math.min(c,Math.sqrt(Math.max(0,1-Math.pow(1-(1-s)/cb,2))));
  const pr=spline(prof,s),w=Math.max(.004,pr[0]*c),d=Math.max(.004,pr[1]*c);
  A.set([P.x,P.y,P.z,tg.x,tg.y,tg.z,sd.x,sd.y,sd.z,up.x,up.y,up.z,w,d],i*14);
  const r=Math.max(w,d);box[0]=Math.min(box[0],P.x-r);box[1]=Math.min(box[1],P.y-r);box[2]=Math.min(box[2],P.z-r);box[3]=Math.max(box[3],P.x+r);box[4]=Math.max(box[4],P.y+r);box[5]=Math.max(box[5],P.z+r);}
 const sdf=(x,y,z)=>{let bi=0,bt=0,bd=1e9;
  for(let i=0;i<n;i++){const o0=i*14,o1=o0+14,ax=A[o0],ay=A[o0+1],az=A[o0+2],ex=A[o1]-ax,ey=A[o1+1]-ay,ez=A[o1+2]-az,L=ex*ex+ey*ey+ez*ez;
   let t=L>0?((x-ax)*ex+(y-ay)*ey+(z-az)*ez)/L:0;t=t<0?0:t>1?1:t;const qx=x-ax-ex*t,qy=y-ay-ey*t,qz=z-az-ez*t,dd=qx*qx+qy*qy+qz*qz;if(dd<bd){bd=dd;bi=i;bt=t;}}
  const o0=bi*14,o1=o0+14,L=(k)=>A[o0+k]+(A[o1+k]-A[o0+k])*bt;
  const qx=x-L(0),qy=y-L(1),qz=z-L(2),u=qx*L(6)+qy*L(7)+qz*L(8),v=qx*L(9)+qy*L(10)+qz*L(11),a=qx*L(3)+qy*L(4)+qz*L(5),w=L(12),d=L(13);
  const k0=Math.sqrt((u/w)*(u/w)+(v/d)*(v/d)),k1=Math.sqrt((u/(w*w))*(u/(w*w))+(v/(d*d))*(v/(d*d)));
  let de=k1>1e-9?k0*(k0-1)/k1:-Math.min(w,d);
  if((bi===0&&bt===0&&a<0)||(bi===n-1&&bt===1&&a>0))de=de>0?Math.hypot(de,a):Math.max(de,Math.abs(a));
  return de;};
 return {sdf,box};}
function ellPrim(cx,cy,cz,rx,ry,rz){return {box:[cx-rx,cy-ry,cz-rz,cx+rx,cy+ry,cz+rz],sdf:(x,y,z)=>{const px=(x-cx)/rx,py=(y-cy)/ry,pz=(z-cz)/rz,k0=Math.sqrt(px*px+py*py+pz*pz),k1=Math.sqrt(px*px/(rx*rx)+py*py/(ry*ry)+pz*pz/(rz*rz));return k1>1e-9?k0*(k0-1)/k1:-Math.min(rx,ry,rz);}};}
// cor escrita no espaço de uma articulação (como antes) mas avaliada no espaço do corpo
const em=(fn,ox,oy,oz)=>(x,y,z,nx,ny,nz)=>fn(x-ox,y-oy,z-oz,nx,ny,nz);

function skinGeometry(prims,h){
 // 1) grade com a soma suave das formas
 const B=[1e9,1e9,1e9,-1e9,-1e9,-1e9];for(const p of prims)for(let i=0;i<3;i++){B[i]=Math.min(B[i],p.box[i]-p.k-3*h);B[i+3]=Math.max(B[i+3],p.box[i+3]+p.k+3*h);}
 const NX=Math.ceil((B[3]-B[0])/h)+1,NY=Math.ceil((B[4]-B[1])/h)+1,NZ=Math.ceil((B[5]-B[2])/h)+1,F=new Float32Array(NX*NY*NZ).fill(1),id=(i,j,k)=>i+NX*(j+NY*k);
 for(const p of prims){const m=p.k+2*h,i0=Math.max(0,Math.floor((p.box[0]-m-B[0])/h)),i1=Math.min(NX-1,Math.ceil((p.box[3]+m-B[0])/h)),j0=Math.max(0,Math.floor((p.box[1]-m-B[1])/h)),j1=Math.min(NY-1,Math.ceil((p.box[4]+m-B[1])/h)),k0=Math.max(0,Math.floor((p.box[2]-m-B[2])/h)),k1=Math.min(NZ-1,Math.ceil((p.box[5]+m-B[2])/h));
  for(let k=k0;k<=k1;k++){const z=B[2]+k*h;for(let j=j0;j<=j1;j++){const y=B[1]+j*h;let q=id(i0,j,k);for(let i=i0;i<=i1;i++,q++){const d=p.sdf(B[0]+i*h,y,z);F[q]=smin(F[q],d,p.k);}}}}
 // 2) surface nets: um vértice por célula cortada pela superfície, um quadrilátero por aresta cortada
 const CX=NX-1,CY=NY-1,cell=new Int32Array(CX*CY*(NZ-1)).fill(-1),pos=[],E=[[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]],f=new Float32Array(8);
 for(let k=0;k<NZ-1;k++)for(let j=0;j<CY;j++)for(let i=0;i<CX;i++){let neg=0;
  for(let c=0;c<8;c++){f[c]=F[id(i+(c&1),j+((c>>1)&1),k+((c>>2)&1))];if(f[c]<0)neg++;}
  if(neg===0||neg===8)continue;let sx=0,sy=0,sz=0,ne=0;
  for(const [a,b] of E){if((f[a]<0)===(f[b]<0))continue;const t=f[a]/(f[a]-f[b]);sx+=(a&1)+((b&1)-(a&1))*t;sy+=((a>>1)&1)+(((b>>1)&1)-((a>>1)&1))*t;sz+=((a>>2)&1)+(((b>>2)&1)-((a>>2)&1))*t;ne++;}
  cell[i+CX*(j+CY*k)]=pos.length/3;pos.push(B[0]+(i+sx/ne)*h,B[1]+(j+sy/ne)*h,B[2]+(k+sz/ne)*h);}
 const idx=[],C=(i,j,k)=>cell[i+CX*(j+CY*k)];
 // vira a face para fora: "out" é o lado da aresta que fica fora do bicho
 const quad=(a,b,c,d,ax,outNeg)=>{if(a<0||b<0||c<0||d<0)return;
  const ux=pos[c*3]-pos[a*3],uy=pos[c*3+1]-pos[a*3+1],uz=pos[c*3+2]-pos[a*3+2],vx=pos[d*3]-pos[b*3],vy=pos[d*3+1]-pos[b*3+1],vz=pos[d*3+2]-pos[b*3+2];   // diagonais do quadrilátero
  const n=[uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx][ax]*(outNeg?-1:1);
  if(n<0)idx.push(a,c,b,a,d,c);else idx.push(a,b,c,a,c,d);};
 for(let k=0;k<NZ;k++)for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const f0=F[id(i,j,k)],in0=f0<0;
  if(i<NX-1&&j>0&&k>0&&j<NY-1&&k<NZ-1&&in0!==(F[id(i+1,j,k)]<0))quad(C(i,j-1,k-1),C(i,j,k-1),C(i,j,k),C(i,j-1,k),0,!in0);
  if(j<NY-1&&i>0&&k>0&&i<NX-1&&k<NZ-1&&in0!==(F[id(i,j+1,k)]<0))quad(C(i-1,j,k-1),C(i-1,j,k),C(i,j,k),C(i,j,k-1),1,!in0);
  if(k<NZ-1&&i>0&&j>0&&i<NX-1&&j<NY-1&&in0!==(F[id(i,j,k+1)]<0))quad(C(i-1,j-1,k),C(i,j-1,k),C(i,j,k),C(i-1,j,k),2,!in0);}
 // 3) alisa os degraus da grade (Taubin: alisa sem encolher)
 const nV=pos.length/3,nb=Array.from({length:nV},()=>new Set());
 for(let t=0;t<idx.length;t+=3){const a=idx[t],b=idx[t+1],c=idx[t+2];nb[a].add(b).add(c);nb[b].add(a).add(c);nb[c].add(a).add(b);}
 const P=Float64Array.from(pos);
 for(let it=0;it<6;it++){const lam=it%2?-.53:.5,Q=P.slice();
  for(let v=0;v<nV;v++){const s=nb[v];if(!s.size)continue;let x=0,y=0,z=0;for(const u of s){x+=P[u*3];y+=P[u*3+1];z+=P[u*3+2];}const m=s.size;
   Q[v*3]=P[v*3]+lam*(x/m-P[v*3]);Q[v*3+1]=P[v*3+1]+lam*(y/m-P[v*3+1]);Q[v*3+2]=P[v*3+2]+lam*(z/m-P[v*3+2]);}P.set(Q);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(Float32Array.from(P),3));g.setIndex(nV>65535?new T.Uint32BufferAttribute(idx,1):new T.Uint16BufferAttribute(idx,1));g.computeVertexNormals();
 // 4) cor e ossos de cada vértice: as formas mais próximas da superfície dividem a cor e o peso (transição suave nas juntas)
 const pa=g.attributes.position,na=g.attributes.normal,col=new Float32Array(nV*3),si=new Uint16Array(nV*4),sw=new Float32Array(nV*4);
 for(let v=0;v<nV;v++){const x=pa.getX(v),y=pa.getY(v),z=pa.getZ(v),nx=na.getX(v),ny=na.getY(v),nz=na.getZ(v);const ds=[];let dm=1e9;
  for(const p of prims){const b=p.box,m=.08;if(x<b[0]-m||y<b[1]-m||z<b[2]-m||x>b[3]+m||y>b[4]+m||z>b[5]+m)continue;const d=p.sdf(x,y,z);ds.push([p,d]);if(d<dm)dm=d;}
  let cr=0,cg=0,cbb=0,cw=0;const bw=new Map();
  for(const [p,d] of ds){const wc=Math.exp(-(d-dm)/(p.sc||.012)),wb=Math.exp(-(d-dm)/(p.sb||.03))*sstep(1-(d-dm)/(p.reach||.1));
   if(wc>1e-3){const c=p.col(x,y,z,nx,ny,nz);cr+=c[0]*wc;cg+=c[1]*wc;cbb+=c[2]*wc;cw+=wc;}
   if(wb<=0)continue;if(p.boneFn){for(const [b,w] of p.boneFn(x,y,z))bw.set(b,(bw.get(b)||0)+wb*w);}else bw.set(p.bone,(bw.get(p.bone)||0)+wb);}
  col[v*3]=cr/cw;col[v*3+1]=cg/cw;col[v*3+2]=cbb/cw;
  const top=[...bw].sort((a,b)=>b[1]-a[1]).slice(0,4),tw=top.reduce((s,e)=>s+e[1],0);
  top.forEach(([b,w],q)=>{si[v*4+q]=b;sw[v*4+q]=w/tw;});}
 g.setAttribute('color',new T.BufferAttribute(col,3));g.setAttribute('skinIndex',new T.Uint16BufferAttribute(si,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(sw,4));
 g.computeBoundingSphere();g.boundingSphere.radius*=1.35;g.userData.shared=true;return g;}

/* ---------- um cervo ---------- */
const PELE={};   // uma malha por tipo (macho, fêmea, filhote), compartilhada por todos os cervos daquele tipo
// ossos: 0 corpo, 1 pescoço, 2 cabeça, 3 cauda, 4.. quadril/joelho de cada perna
const NECK2=[0,.3,.11];   // meio do pescoço: segunda articulação, para o pescoço dobrar em curva
const NECK=[0,1.14,.47],HEAD=[0,.56,.25],TAIL=[0,1.13,-.63],LEGS=[[-1,true],[1,true],[-1,false],[1,false]];
const hipAt=(fx,front)=>[fx*.15,front?1.0:1.04,front?.4:-.42],kneeOf=front=>front?[0,-.45,.02]:[0,-.42,-.1];
function deerPrims(kind){
 const buck=kind==='buck',fur=coat(kind),brown=C3(buck?'#8c522b':'#a0653b'),tan=C3('#97663f'),cream=C3('#efe3c9'),hoofC=C3('#2a1a12'),P=[];
 const add=(prim,bone,k,col,sc,sb,extra)=>P.push({...prim,bone,k,col,sc,sb,...(extra||{})});
 const tube=(path,prof,o,ofs)=>tubePrim(path.map(p=>[p[0]+ofs[0],p[1]+ofs[1],p[2]+ofs[2]]),prof,o);
 const ell=(x,y,z,rx,ry,rz,ofs)=>ellPrim(x+ofs[0],y+ofs[1],z+ofs[2],rx,ry,rz);
 const Z=[0,0,0],N0=NECK,H0=[NECK[0]+HEAD[0],NECK[1]+HEAD[1],NECK[2]+HEAD[2]];
 // tronco
 const K=[[-.66,1.13,.95,.09],[-.56,1.21,.82,.18],[-.42,1.25,.8,.23],[-.25,1.225,.87,.235],[-.05,1.215,.81,.255],[.15,1.24,.75,.25],[.32,1.3,.73,.22],[.48,1.27,.78,.17],[.62,1.17,.92,.09]];
 add(tubePrim(K.map(k=>[0,(k[1]+k[2])/2,k[0]]),K.map(k=>[k[3],(k[1]-k[2])/2]),{n:30,ca:.1,cb:.12}),0,.02,fur);
 // cauda
 add(tube([[0,.01,0],[0,-.06,-.05],[0,-.15,-.06]],[[.045,.028],[.052,.032],[.034,.02]],{n:8,ca:.3,cb:.35},TAIL),3,.03,em((x,y,z,nx,ny,nz)=>nz<-.25?C3('#8c522b'):C3('#ffffff'),...TAIL));
 // pescoço: vai até dentro do crânio, para a cabeça nascer dele (sem degrau na nuca nem embaixo da mandíbula)
 {const th=buck?1.12:1;
  add(tube([[0,-.02,-.01],[0,.16,.06],[0,.36,.14],[0,.52,.21],[0,.63,.27]],[[.13*th,.13*th],[.125*th,.155*th],[.095*th,.115*th],[.09,.108],[.092,.11]],{n:18,ca:.12,cb:.22},N0),1,.12,
   em((x,y,z,nx,ny,nz)=>{let c=brown;c=mixC(c,cream,.3*sstep((nz-.3)/.4));
    c=mixC(c,C3('#fbf6ea'),sstep((y-.36)/.08)*sstep((nz-.2)/.25)*sstep((.15-ny)/.3));              // mancha branca da garganta
    if(buck)c=mixC(c,C3('#6f4a30'),.5*sstep((ny-.2)/.3)*sstep((.32-y)/.1));
    return shade(c,x,y,z);},...N0),null,.1,{reach:.09,boneFn:(x,y)=>{const t=sstep((y-NECK[1]-.1)/.34);return [[1,1-t],[12,t]];}});}
 // volume de transição garganta → peito (sem dobra na frente do pescoço)
 add(ell(0,.1,.1,.115*(buck?1.1:1),.17,.12,N0),1,.09,em((x,y,z,nx,ny,nz)=>shade(mixC(brown,cream,.2*sstep((nz-.3)/.4)),x,y,z),...N0),null,.08);
 // cabeça: crânio em cunha + ponta do nariz + queixo (emenda larga com o pescoço; cores com bordas suaves)
 const headCol=em((x,y,z,nx,ny,nz)=>{let c=C3(buck?'#8a5530':'#9a6038');
  c=mixC(c,C3('#efe2c8'),sstep((-ny-.2)/.3));                                                         // queixo/garganta clara
  c=mixC(c,C3('#efe6d4'),sstep(1-Math.abs(z-.29)/.035)*sstep((ny+.4)/.3));                            // faixa clara atrás do nariz
  c=mixC(c,C3('#5e3820'),.45*sstep((ny-.45)/.25)*sstep((.17-z)/.06)*sstep((z+.02)/.06));              // testa mais escura
  return shade(c,x,y,z);},...H0);
 add(tube([[0,.07,-.07],[0,.06,.06],[0,.02,.2],[0,-.02,.31],[0,-.024,.365]],[[.08,.09],[.112,.118],[.074,.084],[.054,.058],[.04,.042]],{n:16,ca:.22,cb:.12},H0),2,.1,headCol,null,.07,{reach:.1});
 add(ell(0,-.016,.372,.042,.03,.026,H0),2,.012,()=>C3('#17110f'),.006);
 add(ell(0,-.058,.29,.034,.022,.045,H0),2,.02,()=>C3('#f3ead8'));
 // pernas
 LEGS.forEach(([fx,front],li)=>{const hp=hipAt(fx,front),kp=kneeOf(front),kn=[hp[0]+kp[0],hp[1]+kp[1],hp[2]+kp[2]],bh=4+li*2,bk=5+li*2;
  const inner=c=>(x,y,z,nx)=>{const k=mixC(c(y),cream,.45*sstep((-nx*fx-.15)/.6));return shade(k,x,y,z);};
  if(front)add(tube([[0,.1,.02],[0,-.12,.045],[0,-.3,.03],[0,-.45,.02]],[[.072,.13],[.068,.11],[.048,.062],[.038,.044]],{n:14,ca:.2,cb:.12},hp),bh,.06,em(inner(y=>y>-.15?brown:mixC(brown,tan,.6)),...hp));
  else add(tube([[0,.12,.04],[0,-.12,.09],[0,-.3,-.02],[0,-.42,-.1]],[[.1,.2],[.092,.17],[.052,.085],[.04,.055]],{n:14,ca:.25,cb:.12},hp),bh,.06,em(inner(y=>y>-.2?brown:mixC(brown,tan,.6)),...hp));
  const low=em(inner(()=>tan),...kn),L=front?.37:.47,pz=front?.045:.085,fz=front?.005:.045;
  if(front)add(ell(0,0,.005,.042,.045,.048,kn),bk,.025,low);else add(ell(0,.02,-.05,.026,.045,.03,kn),bk,.025,low);
  add(tube([[0,.01,0],[0,-L*.5,fz*.5],[0,-L,fz]],[[.034,.042],[.025,.03],[.027,.032]],{n:8,ca:0,cb:0},kn),bk,.02,low);
  add(ell(0,-L,fz,.032,.035,.04,kn),bk,.015,low);
  add(tube([[0,-L,fz],[0,-L-.05,fz+.02],[0,-L-.09,pz]],[[.026,.03],[.027,.031],[.03,.034]],{n:6,ca:0,cb:0},kn),bk,.015,low);
  add(ell(0,-L-.13,pz+.018,.036,.046,.036,kn),bk,.01,()=>hoofC,.006);});
 return P;}
function deerSkin(kind){
 if(!PELE[kind]){const t0=performance.now();PELE[kind]=skinGeometry(deerPrims(kind),mobile?.022:.016);PELE[kind].userData.ms=Math.round(performance.now()-t0);}
 return PELE[kind];}

function makeDeer(kind){
 const S=kind==='fawn'?.62:kind==='doe'?.9:1,buck=kind==='buck';
 const root=new T.Group();root.name='Cervo ('+(buck?'macho':kind==='doe'?'fêmea':'filhote')+')';
 const brown=C3(buck?'#8c522b':'#a0653b');
 // esqueleto (mesmos pontos de articulação de antes)
 const body=new T.Bone(),neck=new T.Bone(),head=new T.Bone(),tail=new T.Bone();
 const neck2=new T.Bone();neck.position.set(...NECK);neck2.position.set(...NECK2);neck2.userData.p0=neck2.position.clone();head.position.set(HEAD[0]-NECK2[0],HEAD[1]-NECK2[1],HEAD[2]-NECK2[2]);tail.position.set(...TAIL);body.add(neck,tail);neck.add(neck2);neck2.add(head);
 const bones=[body,neck,head,tail],legs=[];
 for(const [fx,front] of LEGS){const hip=new T.Bone(),knee=new T.Bone();hip.position.set(...hipAt(fx,front));knee.position.set(...kneeOf(front));body.add(hip);hip.add(knee);bones.push(hip,knee);legs.push({hip,knee,front,side:fx});}
 bones.push(neck2);   // osso 12 (meio do pescoço)
 root.add(body);
 const geo=deerSkin(kind),skin=new T.SkinnedMesh(geo,furMat),ink=new T.SkinnedMesh(geo,inkMat);
 skin.castShadow=true;ink.userData.ink=true;root.add(skin,ink);root.updateMatrixWorld(true);
 const sk=new T.Skeleton(bones);skin.bind(sk);ink.bind(sk,skin.bindMatrix);
 body.scale.setScalar(S);
 // detalhes do rosto (sem contorno: ficam encostados na pele)
 {const B=Builder();
  for(const s of [-1,1])B.ell(s*.021,-.02,.393,.01,.008,.006,'#000000',null,6);         // narinas
  B.ell(0,-.05,.326,.03,.004,.032,'#3a2418',null,8);                                    // boca
  for(const s of [-1,1]){
   B.ell(s*.09,.066,.118,.033,.039,.041,'#efe6d6',null,12);                            // anel claro do olho
   B.ell(s*.1,.066,.12,.027,.032,.034,'#120c0a',null,12);                              // olho
   B.ell(s*.119,.082,.134,.009,.009,.009,'#ffffff',null,6);                            // brilho
   B.ell(s*.092,.104,.112,.03,.008,.021,'#4a2a18',null,8);                             // sobrancelha
   B.ell(s*.085,.03,.185,.015,.01,.026,'#3a2416',null,8);}                             // glândula lacrimal
  const m=new T.Mesh(B.build(),furMat);head.add(m);}
 // pálpebras: presas no alto de cada olho; crescem para baixo e cobrem o olho ao piscar
 const lids=[];{const lc=buck?'#7a4a2a':'#8a5634',B=Builder();B.ell(0,-.041,0,.041,.041,.044,lc,null,16);B.ell(0,-.081,.004,.03,.004,.034,'#3a2418',null,10);const g=B.build();   // pálpebra + cílios na borda
  for(const s of [-1,1]){const p=new T.Group();p.position.set(s*.1,.107,.12);p.scale.y=.03;p.visible=false;head.add(p);const lm=new T.Mesh(g,furMat);p.add(lm);lids.push(p);}}
 const ears=[];
 for(const s of [-1,1]){const e=new T.Group();e.position.set(s*.08,.13,.0);e.rotation.set(-.2,s*.35,s*-.9);head.add(e);
  const g=sweepGeo([[0,-.02,0],[0,.08,0],[0,.16,0],[0,.215,0]],[[.03,.016],[.06,.015],[.058,.014],[.012,.006]],{n:14,m:14,ca:.08,cb:.25});
  {const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,p.getZ(i)-Math.max(0,1-Math.pow(x/.062,2))*.022);}}   // concha voltada para a frente
  const B=Builder();B.add(g,null,null,(x,y,z,nx,ny,nz)=>{if(y>.185)return C3('#3e2616');if(nz>.25&&Math.abs(x)<.044&&y>.02)return y<.09?C3('#e8b8a8'):C3('#f4ebe0');return brown;});
  e.add(meshWithInk(B.build(),true));ears.push({g:e,s,ph:Math.random()*10});}
 if(buck){const B=Builder(),antC=C3('#e2cfa6'),tipC=C3('#f6efe0'),aCol=(x,y,z)=>mixC(antC,tipC,sstep((y-.45)/.25));
  for(const s of [-1,1]){
   B.ell(s*.05,.155,.025,.03,.014,.03,'#c9b48a',null,10);                               // roseta (base do chifre)
   B.sweep([[s*.05,.15,.025],[s*.13,.3,-.03],[s*.2,.45,-.02],[s*.22,.58,.05],[s*.18,.68,.12]],[[.024,.024],[.019,.019],[.016,.016],[.012,.012],[.006,.006]],{n:16,m:8,ca:0,cb:.06},null,aCol);
   const tine=(a,b,c,r)=>B.sweep([a,b,c],[[r,r],[r*.7,r*.7],[r*.3,r*.3]],{n:8,m:7,ca:0,cb:.15},null,aCol);
   tine([s*.08,.2,.02],[s*.1,.25,.1],[s*.09,.27,.17],.012);                            // galho da testa (para a frente)
   tine([s*.16,.37,-.03],[s*.17,.47,0],[s*.16,.55,.04],.012);
   tine([s*.205,.48,-.01],[s*.25,.58,-.02],[s*.28,.66,-.02],.011);}
  head.add(meshWithInk(B.build(),true));}
 return {root,body,neck,neck2,head,tail,ears,legs,lids,S,kind,skin};
}

/* ---------- animação (pernas, pescoço, orelhas, cauda) — usada no jogo e na enciclopédia dos bichos ---------- */
/* Passos individuais. Cada casco apoiado guarda o ponto do chão onde pisou (L.F) e o quadril é recalculado a cada quadro
   para a pata continuar chegando nele: se o corpo inclina ou anda, o casco NÃO escorrega. Quando uma pata está longe de
   onde deveria, só ela sai do chão: primeiro levanta (dobra o joelho), depois avança, depois desce e grava o novo ponto. */
const PATA={f:{vy:-.996,vz:.083,hy:-.546,hz:.063},t:{vy:-1.066,vz:.003,hy:-.646,hz:.103}},_pv=new T.Vector3();
const angWrap=a=>{while(a>PI)a-=TAU;while(a<-PI)a+=TAU;return a;};
// perna de dois ossos: dobra o joelho/jarrete o quanto precisa para o casco chegar no ponto t (espaço do corpo, a partir do quadril)
const OSSO={f:{uy:-.45,uz:.02,wy:-.546,wz:.063},t:{uy:-.42,uz:-.1,wy:-.646,wz:.103}};
function ikPata(L,t){const G=L.front?OSSO.f:OSSO.t,a=Math.hypot(G.uy,G.uz),b=Math.hypot(G.wy,G.wz);
 const D=clamp(Math.hypot(t.y,t.z),.25,a+b-1e-4),g0=Math.acos(clamp(-(G.uy*G.wy+G.uz*G.wz)/(a*b),-1,1)),g=Math.acos(clamp((a*a+b*b-D*D)/(2*a*b),-1,1));
 const k=(L.front?1:-1)*Math.max(0,g0-g),c=Math.cos(k),sn=Math.sin(k),sy=G.uy+G.wy*c-G.wz*sn,sz=G.uz+G.wy*sn+G.wz*c;
 L.knee.rotation.x=k;L.hip.rotation.x=angWrap(Math.atan2(t.z,t.y)-Math.atan2(sz,sy));
 L.hip.rotation.z=Math.asin(clamp(t.x/Math.max(.25,Math.hypot(t.x,t.y,t.z)),-.4,.4));
 L.ang=angWrap(Math.atan2(t.z,t.y)-Math.atan2(G.uz+G.wz,G.uy+G.wy));}   // ângulo da linha quadril→casco (para decidir o passo)
function passosCervo(d,dt,bp,bob){
 d.root.position.set(d.x,d.y,d.z);d.root.rotation.set(d.pitch,d.yaw,0,'YXZ');d.body.position.y=bob*d.S;d.body.rotation.set(bp,0,0);d.root.updateMatrixWorld(true);
 const andando=d.speed>.03,alvoF=-.05,alvoT=0;   // pastando, as patas da frente ficam um pouco à frente o tempo todo
 const casco=L=>{const P=L.front?PATA.f:PATA.t;L.hip.updateMatrixWorld(true);return L.knee.localToWorld(new T.Vector3(0,P.hy,P.hz));};
 let noAr=0;for(const L of d.legs)if(L.sp)noAr++;
 for(const L of d.legs){const P=L.front?PATA.f:PATA.t,a0=Math.atan2(P.vz,P.vy);
  if(!L.F&&!L.sp){L.knee.rotation.x=0;L.F=casco(L);L.F.y=d.y;L.lift=0;}
  if(L.sp){L.sp.t+=dt/L.sp.dur;const p=Math.min(1,L.sp.t),e=sstep((p-.2)/.6);   // primeiro levanta, depois avança, depois desce
   _pv.copy(L.sp.A).lerp(L.sp.B,e);_pv.y+=Math.sin(p*PI)*(L.front?.13:.1)*d.S;d.body.worldToLocal(_pv).sub(L.hip.position);ikPata(L,_pv);
   if(p>=1){L.sp=null;L.F=L.sp0B;L.sp0B=null;noAr--;}}
  else{_pv.copy(L.F);d.body.worldToLocal(_pv).sub(L.hip.position);ikPata(L,_pv);}   // apoiada: quadril e joelho fazem o casco ficar no ponto gravado
 }
 if(noAr<1){let melhor=null,mv=0;
  for(const L of d.legs){if(L.sp)continue;const alvo=(L.front?alvoF:alvoT)-bp,dv=andando?L.ang-alvo:Math.abs(L.ang-alvo),lim=andando?.13:.09;if(dv>lim&&dv>mv){mv=dv;melhor=L;}}
  if(melhor){const alvo=(melhor.front?alvoF:alvoT)-bp,to=andando?alvo-.13:alvo;
   // ponto de pouso: onde o casco fica com a perna reta nesse ângulo, encostado no chão
   const hx=melhor.hip.rotation.x,hz=melhor.hip.rotation.z,kx=melhor.knee.rotation.x;melhor.hip.rotation.set(to,0,melhor.front?melhor.side*.06*(d.gz||0):0);melhor.knee.rotation.x=0;
   const B=casco(melhor);B.y=d.y;melhor.hip.rotation.set(hx,0,hz);melhor.knee.rotation.x=kx;melhor.hip.updateMatrixWorld(true);
   melhor.sp={t:0,A:melhor.F.clone(),B,dur:andando?.36:.44};melhor.sp0B=B;melhor.F=null;}}
 for(const L of d.legs){const lf=L.lift||0;if(!lf)continue;
  }
}
function animarCervo(d,dt,now,dxp,dzp){
  const running=d.speed>3,walking=d.speed>.15;
  d.phase+=dt*(running?d.speed*.95:d.speed*2.6+.0001)/Math.max(.6,d.S);
  const ph=d.phase;
  let bob=0,bodyPitch=0;
  const passo=!!d.neck2&&d.st==='graze'&&!running;   // pastando: cada pata dá o seu passo (cascos plantados não escorregam)
  if(!passo&&d.passoAntes){d.saida=.35;for(const L of d.legs){L.F=null;L.sp=null;L.lift=0;}}
  d.passoAntes=passo;if(d.saida>0)d.saida-=dt;
  for(const L of d.legs){
   if(passo)continue;
   let swing=0,bend=0;
   if(running){const p=ph+(L.front?0:PI*.9)+(L.side>0?.18:0);swing=Math.sin(p)*.95;bend=Math.max(0,Math.sin(p+1.2))*1.25*(L.front?1:-1);}
   else if(walking){const off=L.front?(L.side<0?0:PI):(L.side<0?PI*1.5:PI*.5),p=ph+off;swing=Math.sin(p)*.42;bend=Math.max(0,Math.sin(p+1.3))*.7*(L.front?1:-1);}
   const kx=(L.front?bend:-Math.abs(bend)*.4+(running?Math.sin(ph+2)*.4:0));
   if(d.saida>0){const k=Math.min(1,dt*10);L.hip.rotation.x+=(swing-L.hip.rotation.x)*k;L.knee.rotation.x+=(kx-L.knee.rotation.x)*k;}
   else{L.hip.rotation.x=swing;L.knee.rotation.x=kx;}}
  if(running){bob=Math.abs(Math.sin(ph))*.22;bodyPitch=Math.sin(ph+.6)*.12;}else if(walking&&!passo){bob=Math.abs(Math.sin(ph*2))*.025;}
  let wantNeck=0,wantHeadYaw=0,chew=0;
  if(d.st==='graze'&&(!walking||d.neck2)){
   if(!d.neck2){wantNeck=2.2;chew=Math.sin(now*.011)*.06;bodyPitch=.08;}
   else{ // como nos vídeos: cabeça baixa beliscando o capim, depois levanta mastigando e olhando em volta, e abaixa de novo
    d.gT=(d.gT==null?Math.random()*3:d.gT)-dt;if(d.gT<=0){d.gUp=!d.gUp;d.gT=d.gUp?2+Math.random()*2:3+Math.random()*4;}
    if(d.gUp){wantNeck=.4;chew=Math.sin(now*.018)*.05;wantHeadYaw=Math.sin(now*.0007+d.phase)*.55;}
    else{wantNeck=2.13;chew=Math.max(0,Math.sin(now*.009))*.09;}}}
  else if(d.st==='alert'){wantNeck=-.25;wantHeadYaw=clamp(angDiff(d.yaw,Math.atan2(-dxp,-dzp)),-1.1,1.1);}
  else if(running)wantNeck=-.1+Math.sin(ph)*.12;else if(walking)wantNeck=.15+Math.sin(ph*2)*.04;
  d.neckPitch+=(wantNeck-d.neckPitch)*Math.min(1,dt*3.5);d.headYaw+=(wantHeadYaw-d.headYaw)*Math.min(1,dt*4);
  // pastar como um cervo de verdade: a frente do corpo abaixa, as patas da frente vão para a frente (e abrem um pouco),
  // o pescoço desce em diagonal saindo da cernelha e a cabeça aponta para o capim — cascos sempre no chão.
  let gzAlvo=(d.st==='graze'&&d.neck2)?1:0;if(gzAlvo===0&&d.st==='graze'&&d.legs.some(L=>L.front&&(L.sp||(L.ang!=null&&L.ang+d.body.rotation.x< -.1))))gzAlvo=d.gz||0;   // levanta só com as patas da frente embaixo do corpo
  d.gz=(d.gz||0)+(gzAlvo-(d.gz||0))*Math.min(1,dt*2.2);const gz=d.gz*d.gz*(3-2*d.gz);
  // patas quase retas: só as da frente avançam um pouco; o corpo inclina pouco; o pescoço estica (como o pescoço real, que deixa de ficar em curva)
  if(gz>.001){bodyPitch+=.02*gz;
   for(const L of d.legs)L.hip.rotation.z=L.front?L.side*.06*gz:0;}
  else for(const L of d.legs)L.hip.rotation.z=0;
  if(passo)passosCervo(d,dt,bodyPitch,bob);
  const flinch=d.stagger>0?Math.sin(d.stagger*30)*.08:0;
  d.body.position.y=bob*d.S;d.body.rotation.set(bodyPitch,0,flinch);d.neck.rotation.x=d.neckPitch;d.neck.rotation.y=d.headYaw*.5;d.head.rotation.x=-d.neckPitch*.45+chew;d.head.rotation.y=d.headYaw*.5;
  if(d.neck2){const gn=sstep(d.neckPitch/2.13),p0=d.neck2.userData.p0;d.neck2.position.set(p0.x,p0.y+.2*gn,p0.z+.08*gn);d.neck.rotation.x=d.neckPitch;d.neck2.rotation.x=-.15*gn;d.neck.rotation.y=d.neck2.rotation.y=d.headYaw*.25;
   d.head.rotation.x=lerp(-d.neckPitch*.45,-(bodyPitch+d.neckPitch-.15*gn-1.45),gn)+chew;}   // cabeça quase vertical com o focinho no capim   // pescoço desce em diagonal (o corpo ajuda a abaixar)
  // piscar: a cada 2 a 6 s fecha e abre em ~0,2 s (às vezes duas vezes seguidas)
  if(d.lids){d.bT=(d.bT==null?1+Math.random()*3:d.bT)-dt;if(d.bT<=0){d.bk=0;d.bT=Math.random()<.2?.35:2+Math.random()*4;}
   let fe=0;if(d.bk!=null){d.bk+=dt/.2;fe=d.bk<1?Math.sin(d.bk*PI):0;if(d.bk>=1)d.bk=null;}
   if(d.st==='graze'&&d.gUp)fe=Math.max(fe,.18);                     // mastigando relaxado: olhos um pouco fechados
   for(const l of d.lids){l.visible=fe>.03;l.scale.y=Math.max(.03,fe);}}
  for(const e of d.ears){const tw=Math.max(0,Math.sin(now*.0013+e.ph*3))>.985?Math.sin(now*.05)*.5:0;
   e.g.rotation.x=-.2+(d.st==='alert'?-.35:0)+tw*.6;e.g.rotation.z=e.s*(d.st==='alert'?-.55:-.9)+tw*.3;}
  d.tail.rotation.x=(d.st==='flee'?-1.3:-.2)+Math.sin(now*.02+d.phase)*(d.st==='flee'?.25:.12);
  d.root.position.set(d.x,d.y,d.z);d.root.rotation.set(d.pitch,d.yaw,0,'YXZ');
}
window.arcanoKitCervo={makeDeer,animarCervo};
window.arcanoPele={tubePrim,ellPrim,skinGeometry,sweepGeo,Builder,spline,smin};   // pele única (formas somadas → malha contínua), usada também pela coruja

/* ---------- mundo ---------- */
function install(){
 const api=window.arcanoWaterV1226,FA=window.arcanoFundoAquatico,I=window.arcanoIsland;
 if(!api||!api.scene||!FA||!FA.ground||!I||!I.forest||!I.forest.spots){setTimeout(install,800);return;}
 const scene=api.scene,ground=FA.ground,water=FA.water,O=window.arcanoObstacles,NG=window.arcanoNoGrass||[];
 const C=I.center,R=I.radius;
 const okSpot=(x,z)=>{const d=Math.hypot(x-C.x,z-C.z);if(d>R-22||d<(I.cityRadius||130)+12)return false;
  if(Math.abs(x)<70&&Math.abs(z)<56)return true;                                  // área central (prado)
  const w=water(x,z);if(w&&w.depth>.05)return false;
  for(const f of NG)if(f(x,z))return false;
  const y=ground(x,z);if(Math.abs(ground(x+1.5,z)-y)>1.1||Math.abs(ground(x,z+1.5)-y)>1.1)return false; // íngreme
  return true;};
 const canGo=(x0,z0,x1,z1)=>{if(!okSpot(x1,z1))return false;const w=water(x1,z1);if(w&&w.depth>.25)return false;if(O&&O.blocked&&O.blocked(x0,z0,x1,z1))return false;return true;};
 // clareiras: pontos sem árvore a 6 m, mas com mata em volta (bordas de floresta, onde cervos gostam de pastar)
 const spots=I.forest.spots,grid=new Map(),G=12;
 for(const s of spots){const k=Math.floor(s.x/G)*4096+Math.floor(s.z/G);let l=grid.get(k);if(!l)grid.set(k,l=[]);l.push(s);}
 const treesNear=(x,z,r)=>{let n=0,min=1e9;for(let i=Math.floor((x-r)/G);i<=Math.floor((x+r)/G);i++)for(let j=Math.floor((z-r)/G);j<=Math.floor((z+r)/G);j++){const l=grid.get(i*4096+j);if(l)for(const s of l){const d=Math.hypot(s.x-x,s.z-z);if(d<r){n++;min=Math.min(min,d);}}}return {n,min};};
 const homes=[];
 for(let tries=0;tries<4000&&homes.length<(innerWidth<680?4:7);tries++){
  const a=Math.random()*TAU,d=rr((I.cityRadius||130)+30,R-40),x=C.x+Math.cos(a)*d,z=C.z+Math.sin(a)*d;
  if(!okSpot(x,z))continue;const t=treesNear(x,z,26);if(t.min<6||t.n<10)continue;
  if(homes.some(h=>Math.hypot(h.x-x,h.z-z)<90))continue;homes.push({x,z});}
 homes.unshift({x:28,z:30}); // uma manada no prado da área central (perto do começo do jogo)
 const root=new T.Group();root.name='Animais da floresta · cervos';scene.add(root);
 const deer=[],herds=[];
 const BIRTH_MIN=50,BIRTH_MAX=90,GROW_TIME=300;          // segundos: espera para nascer e para o filhote virar adulto
 function spawn(herd,kind,x,z,o){o=o||{};const m=makeDeer(kind);
  const d={...m,herd,x,z,y:ground(x,z),yaw:o.yaw!=null?o.yaw:rr(0,TAU),st:'graze',t:rr(2,8),tx:x,tz:z,speed:0,phase:Math.random()*10,neckPitch:0,headYaw:0,pitch:0,
   walkSpeed:kind==='fawn'?.8:1.05,runSpeed:kind==='fawn'?7.4:8.6,mother:o.mother||null,alive:true,notice:0,roll:0,slow:0,stagger:0,
   hp:kind==='fawn'?45:kind==='doe'?80:100,grow:o.grow!=null?o.grow:null,future:o.future||null};
  d.maxHp=d.hp;
  if(kind==='fawn'&&!d.mother)d.mother=herd.members.find(q=>q.alive&&q.kind==='doe')||herd.members.find(q=>q.alive&&q.kind!=='fawn')||null;
  if(d.grow!=null)applyGrowth(d);
  herd.members.push(d);deer.push(d);root.add(d.root);return d;}
 function applyGrowth(d){const s=lerp(.38,.86,d.grow);d.body.scale.setScalar(s);d.S=s;d.walkSpeed=lerp(.6,.95,d.grow);d.runSpeed=lerp(5.2,8,d.grow);}
 for(const h of homes){
  const n=homes.indexOf(h)===0?3:2+Math.floor(Math.random()*3),herd={home:h,alarm:0,fleeDir:0,members:[],births:[],cap:n+1};herds.push(herd);
  for(let i=0;i<n;i++){const kind=i===0&&Math.random()<.75?'buck':(i===n-1&&n>2?'fawn':'doe');
   let x=h.x+rr(-6,6),z=h.z+rr(-6,6);if(!okSpot(x,z)){x=h.x;z=h.z;}spawn(herd,kind,x,z);}
 }
 // obstáculo leve: o personagem não atravessa o cervo vivo
 const state={px:0,pz:0,speed:0,run:false};let lx=null,lz=null;
 if(O&&O.blocked){const prev=O.blocked;O.blocked=function(fx,fz,tx,tz){for(const d of deer){if(!d.alive||!d.root.visible)continue;const r=.45*d.S;if(Math.hypot(tx-d.x,tz-d.z)<r&&Math.hypot(tx-d.x,tz-d.z)<Math.hypot(fx-d.x,fz-d.z))return true;}return prev.call(this,fx,fz,tx,tz);};}
 const scare=(herd,fromX,fromZ)=>{const lead=herd.members.find(q=>q.alive)||herd.members[0];if(!lead)return;if(herd.alarm<=0)herd.fleeDir=Math.atan2(lead.x-fromX,lead.z-fromZ);herd.alarm=rr(4,6);};

 /* ---------- magias acertam os cervos ---------- */
 const DMG=[45,65,50],RAD=[1.25,1.9,1.5],SPD=[18,11,15];
 addEventListener('arcano-magia',ev=>{const m=ev.detail;if(!m)return;const o=m.origin,dv=m.direction,len=(m.len||10)+(m.slot===1?1.5:0);
  for(const d of deer){if(!d.alive)continue;const cx=d.x,cy=d.y+.85*d.S,cz=d.z;const wx=cx-o.x,wy=cy-o.y,wz=cz-o.z;
   const tAlong=clamp(wx*dv.x+wy*dv.y+wz*dv.z,0,len),px=o.x+dv.x*tAlong,py=o.y+dv.y*tAlong,pz=o.z+dv.z*tAlong;
   const miss=Math.hypot(cx-px,(cy-py)*.7,cz-pz),r=RAD[m.slot]*(m.slot===1?(.5+tAlong/len):1)+.35*d.S;
   if(miss<r){const delay=tAlong/SPD[m.slot]*1000;setTimeout(()=>hit(d,DMG[m.slot]*(1-.35*miss/r),m.slot,o),delay);}
   else if(Math.hypot(wx,wz)<25)scare(d.herd,o.x,o.z);}});
 function hit(d,dmg,slot,o){if(!d.alive)return;d.hp-=dmg;d.stagger=.35;if(slot===2)d.slow=3.5;
  if(d.hp<=0)die(d);scare(d.herd,o.x,o.z);d.notice=3;}
 function die(d){d.alive=false;d.st='dead';d.deathT=0;d.speed=0;d.rollDir=Math.random()<.5?-1:1;
  d.herd.births.push(rr(BIRTH_MIN,BIRTH_MAX));}          // a manada repõe com um filhote depois de um tempo
 function remove(d){if(!deer.includes(d))return;root.remove(d.root);d.root.traverse(o=>{if(o.isMesh&&o.geometry&&!o.geometry.userData.shared)o.geometry.dispose();});
  deer.splice(deer.indexOf(d),1);const m=d.herd.members;m.splice(m.indexOf(d),1);for(const q of deer)if(q.mother===d)q.mother=null;}
 function birth(herd){
  const adults=herd.members.filter(q=>q.alive&&q.kind!=='fawn');
  if(!adults.length){ // a manada acabou: um casal de outra manada chega pela mata (fora da vista do jogador)
   let x=herd.home.x,z=herd.home.z;for(let k=0;k<20;k++){const a=rr(0,TAU),tx=herd.home.x+Math.cos(a)*rr(10,22),tz=herd.home.z+Math.sin(a)*rr(10,22);if(okSpot(tx,tz)&&Math.hypot(tx-state.px,tz-state.pz)>45){x=tx;z=tz;break;}}
   if(Math.hypot(x-state.px,z-state.pz)<45)return false;
   spawn(herd,'doe',x,z);spawn(herd,'buck',x+1.5,z+1);return true;}
  if(herd.members.filter(q=>q.alive).length>=herd.cap)return true;
  const mom=adults.find(q=>q.kind==='doe')||adults[0];
  const a=rr(0,TAU),x=mom.x+Math.cos(a)*1.2,z=mom.z+Math.sin(a)*1.2,ok=okSpot(x,z);
  const f=spawn(herd,'fawn',ok?x:mom.x,ok?z:mom.z,{grow:0,future:Math.random()<.5?'buck':'doe',mother:mom,yaw:mom.yaw});
  f.st='walk';f.tx=mom.x;f.tz=mom.z;f.t=3;return true;}
 function grownUp(d){ // o filhote cresceu: vira macho (com chifres) ou fêmea, no mesmo lugar
  const n=spawn(d.herd,d.future||'doe',d.x,d.z,{yaw:d.yaw});n.st=d.st==='flee'?'flee':'graze';n.t=d.t;n.fleeYaw=d.fleeYaw;n.y=d.y;n.root.visible=d.root.visible;remove(d);}

 /* ---------- comportamento ---------- */
 function choose(d){
  const h=d.herd.home;let x=d.x,z=d.z;
  const mom=d.mother&&d.mother.alive?d.mother:null;
  for(let k=0;k<12;k++){const ref=mom&&Math.random()<.85?mom:h,r=mom?rr(1,3):rr(2,14),a=rr(0,TAU);const tx=ref.x+Math.cos(a)*r,tz=ref.z+Math.sin(a)*r;if(okSpot(tx,tz)){x=tx;z=tz;break;}}
  d.tx=x;d.tz=z;}
 // Percepção: VISÃO (vê bem o que está à frente; atrás é ponto cego) + AUDIÇÃO (passos; correr faz muito barulho).
 // Chegar pelas costas andando devagar dá pouca chance de ser notado; de frente ou correndo, o cervo nota logo.
 function perceive(d,dt,dp,dxp,dzp,playing){
  if(!playing||dp>26){d.notice=Math.max(0,d.notice-.35*dt);return;}
  const tx=-dxp/dp,tz=-dzp/dp,front=Math.sin(d.yaw)*tx+Math.cos(d.yaw)*tz;          // 1 = personagem bem na frente
  const sight=front>.25?1:front>-.35?lerp(.14,1,(front+.35)/.6):.1;
  const spd=state.speed,moving=Math.min(1,spd/1.6),running=state.run&&spd>1.2;
  const distK=Math.pow(clamp(1-dp/22,0,1),2),grazing=d.st==='graze'&&d.neckPitch>1?.35:1;
  const hearing=running?2.6:spd>.2?.4:.03;   // andando pelas costas: ~1 em 5 chances de ser notado antes de chegar perto
  d.moodT=(d.moodT||0)-dt;if(d.moodT<=0){d.moodT=rr(4,9);d.mood=rr(.45,1.75);}   // atenção varia: às vezes distraído, às vezes desconfiado
  const rate=distK*(sight*(.3+.7*moving)*1.7*grazing+hearing*(dp<12?1:.6))*(d.kind==='fawn'?.8:1)*(d.mood||1);
  d.notice+=rate*dt;if(rate<.05)d.notice=Math.max(0,d.notice-.3*dt);
  if(dp<1.6)d.notice=9;                                                                // encostou: nota na hora
  if(d.notice>2.2)scare(d.herd,state.px,state.pz);
  else if(d.notice>1&&d.st!=='flee'&&d.herd.alarm<=0&&d.st!=='alert'){d.st='alert';d.t=rr(2.5,5);}
 }
 function update(d,dt,now){
  const dxp=d.x-state.px,dzp=d.z-state.pz,dp=Math.hypot(dxp,dzp)||.01,herd=d.herd;
  if(!d.alive){ // caído de lado; depois de um tempo some na mata
   d.deathT+=dt;d.roll+=(d.rollDir*PI*.5-d.roll)*Math.min(1,dt*5);
   for(const L of d.legs){L.hip.rotation.x+=((L.front?.35:-.35)-L.hip.rotation.x)*Math.min(1,dt*4);L.knee.rotation.x*=.9;}
   d.neckPitch+=(.6-d.neckPitch)*Math.min(1,dt*3);d.neck.rotation.x=d.neckPitch;d.head.rotation.x=-.3;d.body.position.y=0;d.body.rotation.set(0,0,0);
   const sink=d.deathT>32?(d.deathT-32)*.25:0;
   d.root.position.set(d.x,d.y-sink,d.z);d.root.rotation.set(0,d.yaw,d.roll,'YXZ');
   if(d.deathT>36)remove(d);return;}
  if(d.grow!=null){d.grow=Math.min(1,d.grow+dt/GROW_TIME);applyGrowth(d);if(d.grow>=1){grownUp(d);return;}}
  perceive(d,dt,dp,dxp,dzp,document.body.classList.contains('play-active'));
  if(herd.alarm>0&&d.st!=='flee'){d.st='flee';d.t=herd.alarm;d.fleeYaw=herd.fleeDir+rr(-.35,.35);}
  d.t-=dt;let targetSpeed=0,wantYaw=d.yaw;
  if(d.st==='flee'){
   let best=d.fleeYaw;const away=Math.atan2(dxp,dzp);if(dp<20)best=lerp(best,away,.04);d.fleeYaw=best;
   for(const off of [0,.5,-.5,1,-1,1.6,-1.6,2.4,-2.4]){const a=best+off,nx=d.x+Math.sin(a)*2.2,nz=d.z+Math.cos(a)*2.2;if(canGo(d.x,d.z,nx,nz)){wantYaw=a;break;}}
   targetSpeed=d.runSpeed;if(d.t<=0&&dp>22){d.st='alert';d.t=rr(1.5,3);d.notice=Math.min(d.notice,1.2);herd.home={x:d.x,z:d.z};}
   if(d.t<=0&&dp<=22)d.t=1;}
  else if(d.st==='alert'){if(d.t<=0){d.st='graze';d.t=rr(3,7);d.notice*=.5;}}
  else if(d.st==='graze'){if(d.t<=0){if(Math.random()<.6){d.st='walk';choose(d);d.t=rr(4,9);}else d.t=rr(2,6);}
   if(d.gw>0){d.gw-=dt;targetSpeed=.2;wantYaw=d.yaw+Math.sin(now*.0005+d.phase)*.25;}else if(!d.gUp&&Math.random()<dt*.06)d.gw=rr(1,2.2);}   // caminhada de pastagem (de vez em quando)
  else if(d.st==='walk'){const dx=d.tx-d.x,dz=d.tz-d.z,L=Math.hypot(dx,dz);
   if(L<.4||d.t<=0){d.st='graze';d.t=rr(3,9);}else{wantYaw=Math.atan2(dx,dz);targetSpeed=d.walkSpeed*(L<1.5?.6:1);
    const nx=d.x+Math.sin(d.yaw)*.8,nz=d.z+Math.cos(d.yaw)*.8;if(!canGo(d.x,d.z,nx,nz)){choose(d);}}}
  if(d.slow>0){d.slow-=dt;targetSpeed*=.4;}
  if(d.stagger>0){d.stagger-=dt;targetSpeed*=.2;}
  const turn=d.st==='flee'?3.4:1.6;d.yaw+=clamp(angDiff(d.yaw,wantYaw),-turn*dt,turn*dt);
  d.speed+=(targetSpeed-d.speed)*Math.min(1,dt*(d.st==='flee'?3:2));
  if(d.speed>.01){const nx=d.x+Math.sin(d.yaw)*d.speed*dt,nz=d.z+Math.cos(d.yaw)*d.speed*dt;if(canGo(d.x,d.z,nx,nz)){d.x=nx;d.z=nz;}else{d.speed*=.3;if(d.st==='walk')choose(d);}}
  const gy=ground(d.x,d.z),fy=ground(d.x+Math.sin(d.yaw)*.5,d.z+Math.cos(d.yaw)*.5),by=ground(d.x-Math.sin(d.yaw)*.5,d.z-Math.cos(d.yaw)*.5);
  d.y+=(gy-d.y)*Math.min(1,dt*12);d.pitch+=(clamp(Math.atan2(by-fy,1),-.35,.35)-d.pitch)*Math.min(1,dt*6);
  animarCervo(d,dt,now,dxp,dzp);
 }
 /* ---------- laço ---------- */
 let last=performance.now();
 (function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;if(dt<=0)return;if(window.arcanoPausa)return;
  const pl=api.getGrassPlayer&&api.getGrassPlayer(),cam=api.getMainCamera&&api.getMainCamera();
  const src=document.body.classList.contains('play-active')&&pl?pl.position:(cam?cam.position:null);if(!src)return;
  state.px=src.x;state.pz=src.z;state.run=!!(pl&&((pl.keys&&pl.keys.has&&pl.keys.has('shift'))||(pl.input&&pl.input.run)));if(lx!=null){const sp=Math.hypot(src.x-lx,src.z-lz)/dt;state.speed+=((sp>40?0:sp)-state.speed)*Math.min(1,dt*6);}lx=src.x;lz=src.z;
  for(const h of herds){if(h.alarm>0)h.alarm-=dt;
   for(let i=h.births.length-1;i>=0;i--){h.births[i]-=dt;if(h.births[i]<=0){if(birth(h))h.births.splice(i,1);else h.births[i]=20;}}}
  for(const d of deer.slice()){if(!deer.includes(d))continue;const dist=Math.hypot(d.x-src.x,d.z-src.z);const vis=dist<150;if(d.root.visible!==vis)d.root.visible=vis;
   if(vis)update(d,dt,now);
   else if(!d.alive){d.deathT+=dt;if(d.deathT>36)remove(d);}
   else if(d.grow!=null){d.grow=Math.min(1,d.grow+dt/GROW_TIME);if(d.grow>=1)grownUp(d);}}
 })(last);
 window.arcanoAnimais={deer,herds,homes,makeDeer,hit:(d,dmg)=>hit(d,dmg,0,{x:state.px,z:state.pz}),config:{BIRTH_MIN,BIRTH_MAX,GROW_TIME}};
}
install();
})();
