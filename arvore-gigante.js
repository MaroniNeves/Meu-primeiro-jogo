/* Árvore gigante da ilha do grande lago.
   - Tronco oco (cerca de 7 m de raio e 34 m de altura) que serpenteia e tem nós e protuberâncias; casca
     de árvore de verdade (cristas verticais, rachaduras fundas, líquen) com relevo; porta em arco para a ponte.
   - Por dentro: madeira viva lisa, rampa em espiral colada na parede até um mirante, lanternas e cogumelos.
     Ao entrar, o casco de fora some para a câmera ver o interior.
   - Copa: galhos recursivos (tubos que afinam e caem) e, por cima, grandes massas de folhagem (vários cumes,
     cada um uma cúpula de milhares de folhas desenhadas uma a uma, mais escuras por dentro).
   - Raízes grossas, ponte em arco até a margem e vaga-lumes. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const PI=Math.PI,TAU=PI*2;
let seed=31337;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const TH=34,RIN=4.4,RAMP_IN=2.0,RAMP_OUT=4.25,RISE=7.2,Y0=.3,YTOP=27,DOOR=0,DOORW=1.95;
const angd=(a,b)=>{let d=a-b;while(d>PI)d-=TAU;while(d<-PI)d+=TAU;return d;};
const sstep=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
function hsl2rgb(h,s,l){const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1));};return [f(0),f(8),f(4)];}

/* ---------- Casca de árvore pintada (cor + altura), sem emenda ---------- */
function barkPair(sd,tone){
 // Casca de desenho animado: placas irregulares alongadas na vertical, contorno de tinta, volume em cada placa.
 let s=sd>>>0;const R=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
 const S=512,a=document.createElement('canvas'),b=document.createElement('canvas');a.width=a.height=b.width=b.height=S;
 const g=a.getContext('2d'),h=b.getContext('2d'),img=g.createImageData(S,S),hi=h.createImageData(S,S),d=img.data,hd=hi.data;
 const GX=7,GY=2,cw=S/GX,ch=S/GY,pts=[];const TP=2*Math.PI/S;
 const wx=(x,y)=>x+20*Math.sin(y*TP+1.3)+6*Math.sin(y*TP*3+x*TP+.4),wy=(x,y)=>y+9*Math.sin(x*TP*2+2.1);
 for(let j=0;j<GY;j++)for(let i=0;i<GX;i++)pts.push({x:(i+.15+R()*.7)*cw,y:(j+.15+R()*.7)*ch,t:R(),hu:R()});
 const P=(i,j)=>pts[((j%GY+GY)%GY)*GX+((i%GX+GX)%GX)];
 const AN=4.6; // placas mais altas que largas
 const LX=.55,LY=-.62; // luz vindo de cima-direita
 const base=tone?[27,48,44]:[24,46,38];
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){
  const X=wx(x,y),Y=wy(x,y),ci=Math.floor(((X%S)+S)%S/cw),cj=Math.floor(((Y%S)+S)%S/ch),XX=((X%S)+S)%S,YY=((Y%S)+S)%S;let f1=1e9,f2=1e9,best=null,bx=0,by=0;
  for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const q=P(ci+di,cj+dj),qx=q.x+Math.floor((ci+di)/GX)*S-(ci+di<0?0:0),qy=q.y;
   const ox=(ci+di)<0?-S:(ci+di)>=GX?S:0,oy=(cj+dj)<0?-S:(cj+dj)>=GY?S:0;
   const dx=XX-(q.x+ox),dy=(YY-(q.y+oy))/AN,dd=Math.sqrt(dx*dx+dy*dy);if(dd<f1){f2=f1;f1=dd;best=q;bx=dx;by=dy;}else if(dd<f2)f2=dd;}
  const e=f2-f1,rad=cw*.62,r=Math.min(1,f1/rad),nx=bx/rad,ny=by/rad;
  // volume: centro e lado da luz mais claros, bordas escuras
  const lit=Math.max(-1,Math.min(1,nx*1.3));let v=.8+.16*(1-Math.abs(nx))+.26*lit*(.35+.65*Math.min(1,Math.abs(nx)*1.4));
  const bev=Math.min(1,e/9);v*=.62+.38*bev;
  v+=.06*Math.sin(x*.07+y*.021+best.t*9)+.04*(best.t-.5);
  const hue=base[0]+(best.hu-.5)*6,sat=base[1]+(best.hu-.5)*8;let L=base[2]*v;
  const fade=.55+.45*Math.sin(YY*TP*4+best.t*12)*Math.sin(XX*TP*3+best.hu*9);let ink=0;if(e<2.2+1.2*fade)ink=Math.min(1,.5+fade);else if(e<4.5)ink=(4.5-e)/2.3*(.4+.4*fade);ink=Math.max(0,ink);
  L=L*(1-ink)+12*ink;
  const k=(y*S+x)*4,[rr,gg,bb]=hsl2rgb(hue,(sat-ink*10)/100,Math.max(.04,Math.min(.9,L/100)));
  d[k]=rr*255;d[k+1]=gg*255;d[k+2]=bb*255;d[k+3]=255;
  const hv=Math.max(0,Math.min(255,(.35+.55*(1-r*r)*bev)*255*(1-ink*.85)));hd[k]=hd[k+1]=hd[k+2]=hv;hd[k+3]=255;}
 g.putImageData(img,0,0);h.putImageData(hi,0,0);
 // rachaduras finas dentro de algumas placas (tinta), e brilhos curtos nas cristas
 g.lineCap='round';
 for(const q of pts){if(q.t<.45)continue;for(const ox of [-S,0,S])for(const oy of [-S,0,S]){const x0=q.x+ox+(R()-.5)*cw*.3,y0=q.y+oy-ch*.25;
   g.strokeStyle='rgba(40,20,10,.75)';g.lineWidth=1.6;g.beginPath();g.moveTo(x0,y0);g.quadraticCurveTo(x0+(R()-.5)*cw*.3,y0+ch*.25,x0+(R()-.5)*cw*.25,y0+ch*(.35+R()*.2));g.stroke();
   g.strokeStyle='rgba(255,214,160,.28)';g.lineWidth=3;g.beginPath();g.moveTo(x0+cw*.14,y0+ch*.05);g.quadraticCurveTo(x0+cw*.2,y0+ch*.22,x0+cw*.16,y0+ch*.38);g.stroke();}}
 const m=new T.CanvasTexture(a),bp=new T.CanvasTexture(b);for(const t of [m,bp]){t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;}m.colorSpace=T.SRGBColorSpace;
 return {map:m,bump:bp};
}
function Mesher(){return {P:[],N:[],U:[],C:[],I:[],n:0};}
function build(m,mat,name,vc){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(m.P,3));g.setAttribute('normal',new T.Float32BufferAttribute(m.N,3));g.setAttribute('uv',new T.Float32BufferAttribute(m.U,2));if(vc)g.setAttribute('color',new T.Float32BufferAttribute(m.C,3));g.setIndex(m.I);g.computeBoundingSphere();const mesh=new T.Mesh(g,mat);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;return mesh;}
function tube(m,pts,rad,sides,tileLen,tint){
 const up0=Math.abs(pts[1].y-pts[0].y)>Math.abs(pts[1].x-pts[0].x)+Math.abs(pts[1].z-pts[0].z)?new T.Vector3(1,0,0):new T.Vector3(0,1,0);
 let nrm=new T.Vector3().subVectors(pts[1],pts[0]).cross(up0).normalize(),run=0;const base=m.n;
 for(let i=0;i<pts.length;i++){
  const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],tg=new T.Vector3().subVectors(b,a).normalize();
  nrm=nrm.clone().sub(tg.clone().multiplyScalar(nrm.dot(tg))).normalize();const bi=new T.Vector3().crossVectors(tg,nrm).normalize();
  if(i>0)run+=pts[i].distanceTo(pts[i-1]);
  for(let s=0;s<=sides;s++){const t=s/sides*TAU,cx=Math.cos(t),sx=Math.sin(t),nx=nrm.x*cx+bi.x*sx,ny=nrm.y*cx+bi.y*sx,nz=nrm.z*cx+bi.z*sx;
   m.P.push(pts[i].x+nx*rad[i],pts[i].y+ny*rad[i],pts[i].z+nz*rad[i]);m.N.push(nx,ny,nz);m.U.push(s/sides*TAU*Math.max(.3,rad[0])/tileLen,run/tileLen);
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
 const LITE=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||innerWidth<700;
 const root=new T.Group();root.name='Árvore gigante';root.position.set(LG.x,base,LG.z);scene.add(root);
 const W=(lx,lz)=>({x:LG.x+lx,z:LG.z+lz});
 const barkP=barkPair(61,1),heartP=barkPair(62,1),deckT=AT.wood({hue:32,light:50,horizontal:true,seed:63,boards:6});
 const mk=(t,sc,o)=>new T.MeshStandardMaterial(Object.assign({map:t.map,bumpMap:t.bump,bumpScale:sc,roughness:1},o||{}));
 const barkM=mk(barkP,1.6,{vertexColors:true,side:T.DoubleSide}),innerM=mk(heartP,1.0,{vertexColors:true,side:T.DoubleSide}),deckM=mk(deckT,.8,{side:T.DoubleSide}),plainBark=mk(barkP,1.2,{side:T.DoubleSide});
 const glowM=new T.MeshStandardMaterial({color:'#ffe9b0',emissive:new T.Color('#ffb040'),emissiveIntensity:1.4,roughness:.6});
 const mushM=[new T.MeshStandardMaterial({color:'#bff8ff',emissive:new T.Color('#4fe0ff'),emissiveIntensity:1.6}),new T.MeshStandardMaterial({color:'#ffd0e6',emissive:new T.Color('#ff6fb0'),emissiveIntensity:1.5})];
 const stemM=new T.MeshStandardMaterial({color:'#f3e6cc',roughness:1});

 /* ---------- Tronco: casca de fora (serpenteia) + parede de dentro (reta), com a porta cortada ---------- */
 const ROOTA=[];for(let i=0;i<11;i++){const a=i/11*TAU+rnd()*.25+.15;if(Math.abs(angd(a,DOOR))<.5)continue;ROOTA.push(a);}
 const lean=y=>{const s=sstep((y-3)/12);return {x:s*(1.15*Math.sin(y*.085+.8)+.5*Math.sin(y*.19)),z:s*(1.0*Math.sin(y*.063+2.4)+.4*Math.sin(y*.17+1))};};
 const BURLS=[[.8,9,.2],[3.9,16,.17],[-2.2,22,.2],[2.4,5.5,.14],[-.6,28,.16],[-1.4,13,.12]];
 const rOut=(y,a)=>{const yy=Math.max(0,y),k=yy/TH,tw=a-yy*.05;let r=6.7-1.5*k+3.6*Math.exp(-yy/3);
  const cord=.5+.5*Math.sin(tw*7+1.3);r*=1+.22*cord*cord-.09+.035*Math.sin(tw*15+yy*.25)+.02*Math.sin(a*31+yy*1.7);
  let lobe=0;for(const ra of ROOTA){const da=angd(a,ra);lobe+=Math.exp(-da*da/.045);}r*=1+.45*Math.min(1.3,lobe)*Math.exp(-yy/2.6);
  for(const [ba,by,bm] of BURLS){const da=angd(a,ba);r*=1+bm*Math.exp(-(da*da/.12+(y-by)*(y-by)/7));}
  const l=lean(y);return Math.max(r,RIN+Math.hypot(l.x,l.z)+1.1);};
 const rIn=(y,a)=>RIN*(1+.03*Math.sin(a*7+y*.5));
 const inDoor=(a,y,r)=>{const dx=r*angd(a,DOOR);return Math.abs(dx)<DOORW&&y<2.7+Math.sqrt(Math.max(0,DOORW*DOORW-dx*dx))*1.25;};
 const NA=84,rows=[];for(let y=-1.5;y<=TH+.01;y+=1)rows.push(y);
 const outer=Mesher(),inner=Mesher();
 for(const [mesh,isInner] of [[outer,false],[inner,true]]){
  const rad=isInner?rIn:rOut,yStart=isInner?0:-1.5;
  const ys=rows.filter(y=>y>=yStart);
  for(let j=0;j<ys.length;j++)for(let i=0;i<=NA;i++){
   const a=i/NA*TAU+ys[j]*.02,r=rad(ys[j],a),lo=isInner?{x:0,z:0}:lean(ys[j]),x=Math.sin(a)*r+lo.x,z=Math.cos(a)*r+lo.z;
   mesh.P.push(x,ys[j],z);const nrm=new T.Vector3(x-lo.x,0,z-lo.z).normalize();if(isInner)nrm.negate();mesh.N.push(nrm.x,0,nrm.z);
   mesh.U.push(i/NA*(isInner?RIN:7.4)*TAU/(isInner?6:9),ys[j]/(isInner?6:11));
   const tw=a-Math.max(0,ys[j])*.05,cv=.5+.5*Math.sin(tw*7+1.3);
   const mo=isInner?0:Math.max(0,Math.min(1,(.5-ys[j]/26)+.45*(1-cv)*(ys[j]<20?1:.4)+.25*Math.sin(a*5+ys[j]*.2)));
   const dk=(.82+.2*cv)*(.9+.1*Math.sin(a*13+ys[j]*.7));
   const m2=mo*.55;mesh.C.push((.95+.05*dk)*(1-m2*.45),(.95+.05*dk)*(1-m2*.05),(.95+.05*dk)*(1-m2*.55));
  }
  const ring=NA+1;
  for(let j=0;j<ys.length-1;j++)for(let i=0;i<NA;i++){
   const a0=(i+.5)/NA*TAU+(ys[j]+.5)*.02,yc=(ys[j]+ys[j+1])/2;
   if(inDoor(a0,yc,rad(yc,a0)))continue;
   const a=j*ring+i,b=a+1,c=a+ring,d=c+1;
   if(isInner)mesh.I.push(a,c,b,b,c,d);else mesh.I.push(a,b,c,b,d,c);
  }
  mesh.n=ys.length*ring;
 }
 const outerMesh=build(outer,barkM,'Tronco da árvore gigante (fora)',true);root.add(outerMesh);
 root.add(build(inner,innerM,'Tronco da árvore gigante (dentro)',true));
 {const m=Mesher(),y=TH,lo=lean(y);for(let i=0;i<=NA;i++){const a=i/NA*TAU+y*.02;const ro=rOut(y,a),ri=rIn(y,a);m.P.push(Math.sin(a)*ro+lo.x,y,Math.cos(a)*ro+lo.z,Math.sin(a)*ri,y,Math.cos(a)*ri);m.N.push(0,1,0,0,1,0);m.U.push(i/NA*6,0,i/NA*6,1);m.C.push(1,1,1,1,1,1);}
  for(let i=0;i<NA;i++){const a=i*2;m.I.push(a,a+2,a+1,a+1,a+2,a+3);}root.add(build(m,barkM,'Borda do tronco',true));}
 {const fl=new T.Mesh(new T.CircleGeometry(RIN+.2,32),deckM);fl.rotation.x=-PI/2;fl.position.y=Y0-.04;fl.receiveShadow=true;root.add(fl);}
 {const tg=new T.Group();root.add(tg);const z0=RIN-.3,z1=10.9,len=z1-z0,zc=(z0+z1)/2;
  const bx=(w,h,d,m,x,y,z,ry)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),m);b.position.set(x,y+h/2,z);b.rotation.y=ry||0;b.castShadow=true;tg.add(b);return b;};
  for(const s of [-1,1])bx(.5,3.0,len,plainBark,s*(DOORW+.25),0,zc);
  const segs=9;for(let k=0;k<segs;k++){const a0=PI*k/segs,a1=PI*(k+1)/segs,am=(a0+a1)/2,r=DOORW+.25,x=Math.cos(am)*r,y=3.0+Math.sin(am)*r*1.25,l=2*r*Math.sin(PI/segs/2)*1.35;const b=new T.Mesh(new T.BoxGeometry(l,.5,len),plainBark);b.position.set(x,y,zc);b.rotation.z=am-PI/2;tg.add(b);}
  bx(DOORW*2+.5,.12,len,deckM,0,0,zc);
  for(const s of [-1,1]){const m=Mesher(),pts=[],rad=[];for(let i=0;i<=8;i++){const t=i/8;pts.push(new T.Vector3(s*(DOORW+.6+1.8*t),5.8*Math.pow(1-t,.7)+.2,10.7+.3*Math.sin(t*5)));rad.push(.55*(1-t*.6));}tube(m,pts,rad,6,3);tg.add(build(m,plainBark,'Raiz da porta',false));}
 }
 for(const [a,y] of [[PI/2,11],[PI,17],[-PI/2,23],[.9,29],[-2.4,14.5],[2.3,25.5]]){
  for(const side of ['i']){const r=side==='o'?rOut(y,a)+.04:rIn(y,a)-.03,lo=side==='o'?lean(y):{x:0,z:0},e=new T.Mesh(new T.SphereGeometry(1,14,10),glowM);e.scale.set(.9,1.4,.2);e.position.set(Math.sin(a)*r+lo.x,y,Math.cos(a)*r+lo.z);e.rotation.y=a+(side==='o'?0:PI);root.add(e);if(side==='o')outerMesh.userData.glows=(outerMesh.userData.glows||[]).concat(e);}
 }

 /* ---------- Rampa em espiral e mirante por dentro ---------- */
 const THS=.55,TURNS=(YTOP-Y0)/RISE;
 {const m=Mesher(),steps=Math.round(TURNS*72),dth=TURNS*TAU/steps;
  for(let i=0;i<=steps;i++){const th=THS+i*dth,y=Y0+i*dth/TAU*RISE;
   for(const r of [RAMP_IN,RAMP_OUT+.1]){m.P.push(Math.sin(th)*r,y,Math.cos(th)*r);m.N.push(0,1,0);m.U.push(r<3?0:1,i*dth*3.4/4);m.C.push(1,1,1);}
   for(const r of [RAMP_IN,RAMP_OUT+.1]){m.P.push(Math.sin(th)*r,y-.28,Math.cos(th)*r);m.N.push(0,-1,0);m.U.push(r<3?0:1,i*dth*3.4/4);m.C.push(1,1,1);}}
  for(let i=0;i<steps;i++){const a=i*4;m.I.push(a,a+4,a+1,a+1,a+4,a+5, a+2,a+3,a+6,a+3,a+7,a+6, a,a+2,a+4,a+2,a+6,a+4, a+1,a+5,a+3,a+3,a+5,a+7);}
  root.add(build(m,deckM,'Rampa em espiral',false));
  const rail=Mesher();let prev=null;
  for(let i=0;i<=steps;i+=3){const th=THS+i*dth,y=Y0+i*dth/TAU*RISE,x=Math.sin(th)*(RAMP_IN+.1),z=Math.cos(th)*(RAMP_IN+.1);
   tube(rail,[new T.Vector3(x,y,z),new T.Vector3(x,y+1.0,z)],[.06,.05],5,2);
   const top=new T.Vector3(x,y+.95,z);if(prev){const mid=top.clone().add(prev).multiplyScalar(.5);mid.y-=.06;tube(rail,[prev.clone(),mid,top],[.035,.035,.035],4,2);}prev=top;}
  root.add(build(rail,plainBark,'Guarda-corpo',false));
  for(let k=1;k<TURNS*2;k++){const th=THS+k*PI,y=Y0+k*PI/TAU*RISE,r=RAMP_OUT-.15;const lamp=new T.Mesh(new T.SphereGeometry(.28,10,8),glowM);lamp.position.set(Math.sin(th)*r,y+1.6,Math.cos(th)*r);root.add(lamp);
   const hang=new T.Mesh(new T.CylinderGeometry(.02,.02,.9,4),plainBark);hang.position.set(Math.sin(th)*r,y+2.2,Math.cos(th)*r);root.add(hang);}
 }
 const THE=THS+TURNS*TAU,HOLE=.34*TAU;
 {const m=Mesher(),NS=40;for(let i=0;i<=NS;i++){const th=i/NS*TAU,r=RAMP_OUT+.2;m.P.push(0,YTOP,0,Math.sin(th)*r,YTOP,Math.cos(th)*r);m.N.push(0,1,0,0,1,0);m.U.push(.5,.5,.5+Math.sin(th)*.5,.5+Math.cos(th)*.5);m.C.push(1,1,1,1,1,1);}
  const inHoleF=th=>{const d=(((th-(THE-HOLE))%TAU)+TAU)%TAU;return d<HOLE;};
  for(let i=0;i<NS;i++){const th=((i+.5)/NS)*TAU;if(inHoleF(th))continue;const a=i*2;m.I.push(a,a+1,a+3);}
  const core=new T.Mesh(new T.CircleGeometry(RAMP_IN+.02,24),deckM);core.rotation.x=-PI/2;core.position.y=YTOP;root.add(core);
  root.add(build(m,deckM,'Mirante da árvore',false));}
 for(let i=0;i<14;i++){const a=rnd()*TAU,r=.8+rnd()*(RAMP_IN-.5),h=.3+rnd()*.4;const s=new T.Mesh(new T.CylinderGeometry(.04,.06,h,5),stemM);s.position.set(Math.sin(a)*r,Y0+h/2,Math.cos(a)*r);root.add(s);const c=new T.Mesh(new T.SphereGeometry(.2+rnd()*.15,9,5,0,TAU,0,PI/2),mushM[i%2]);c.position.set(s.position.x,Y0+h,s.position.z);root.add(c);}

 /* ---------- Raízes sobre a ilha ---------- */
 {const m=Mesher();
  for(const a of ROOTA){const L=9+rnd()*7;
   const mkRoot=(a0,r0,len,rad0,depth)=>{const pts=[],rad=[],wob=rnd()*6;
    for(let k=0;k<=14;k++){const t=k/14,r=r0+len*t,aa=a0+.14*Math.sin(t*5+wob)*(1-t*.3),y=depth?(.9*(1-t)-1.6*Math.pow(t,2)):(4.2*Math.pow(1-t,2.2)+.5*(1-t)-1.4*Math.pow(t,2.4));pts.push(new T.Vector3(Math.sin(aa)*r,y,Math.cos(aa)*r));rad.push(Math.max(.12,rad0*(1-t*.86)));}
    tube(m,pts,rad,8,3,[.82,.92,.74]);};
   mkRoot(a,6.4,L,2.5,0);
   for(let s=0;s<2;s++)mkRoot(a+(s?1:-1)*(.2+rnd()*.12),6.4+L*.45,L*.5,.75,1);
   const w=W(Math.sin(a)*11,Math.cos(a)*11);O.addCircle(w.x,w.z,1.9);
  }
  root.add(build(m,barkM,'Raízes da árvore gigante',true));}

 /* ---------- Copa: galhos recursivos + grandes massas de folhagem (cumes) ---------- */
 const branchM=Mesher(),leafV={P:[],U:[],C:[],I:[],N:[]},leafCores=[];
 const leafCenter=new T.Vector3(0,TH+13,0),tips=[];
 function pushLeaf(c,ax,size,ctr,col){
  const w=new T.Vector3(rnd()-.5,rnd()-.5,rnd()-.5).cross(ax).normalize(),ll=size,lw=size*.62,v=leafV.P.length/3;
  ax=ax.clone();ax.y-=.25*rnd();ax.normalize();
  const nv=new T.Vector3();
  for(const [x,y] of [[-lw/2,0],[lw/2,0],[lw/2,ll],[-lw/2,ll]]){const px=c.x+w.x*x+ax.x*y,py=c.y+w.y*x+ax.y*y,pz=c.z+w.z*x+ax.z*y;leafV.P.push(px,py,pz);nv.set(px-ctr.x,(py-ctr.y)*1.15,pz-ctr.z).normalize();leafV.N.push(nv.x,nv.y*.75+.25,nv.z);}
  leafV.U.push(0,0,1,0,1,1,0,1);for(let k=0;k<4;k++)leafV.C.push(col[0],col[1],col[2]);leafV.I.push(v,v+1,v+2,v,v+2,v+3);
 }
 function leaf(c,ax,size){const hh=Math.min(1,Math.max(0,(c.y-TH)/36)),gold=rnd()<.05;pushLeaf(c,ax,size,leafCenter,hsl2rgb(gold?48+rnd()*8:92+rnd()*30,.5+rnd()*.22,.26+.22*hh+rnd()*.12));}
 const GRAV=.035,LEAFK=LITE?.4:.75;
 function grow(p,dir,len,r0,r1,depth){
  const sides=[8,6,5,4][depth],segs=Math.max(4,Math.round(len/2.2)),pts=[p.clone()],rad=[r0];let pos=p.clone(),d=dir.clone();
  for(let i=1;i<=segs;i++){d.y-=GRAV*(depth+1)*(depth>1?1.6:1);if(depth===0)d.y+=.06;d.x+=(rnd()-.5)*(.2+depth*.08);d.z+=(rnd()-.5)*(.2+depth*.08);d.y+=(rnd()-.5)*.14;d.normalize();pos.addScaledVector(d,len/segs);pts.push(pos.clone());rad.push(r0+(r1-r0)*i/segs);}
  tube(branchM,pts,rad,sides,3.4,[.9+rnd()*.15,.9+rnd()*.1,.9+rnd()*.1]);
  if(depth===3)tips.push(pos.clone());
  const kids=[4,4,3,0][depth];
  for(let k=0;k<kids;k++){const t=.3+.7*(k+rnd()*.5)/kids,idx=Math.min(segs,Math.max(1,Math.round(t*segs))),q=pts[idx],rq=rad[idx];
   const axis=new T.Vector3(rnd()-.5,rnd()-.5,rnd()-.5).normalize(),nd=d.clone().applyAxisAngle(axis,.6+rnd()*.7);nd.y+=.12;nd.normalize();
   const cl=[0,15,7.4,3.2][depth+1]*(.85+rnd()*.3);
   grow(q,nd,cl,Math.max(.1,rq*.62),Math.max(.05,rq*.62*([.4,.42,.33][depth]||.05)),depth+1);}
  if(depth>=2){const n=Math.round((depth===3?len*24:len*11)*LEAFK);
   for(let k=0;k<n;k++){const t=Math.pow(rnd(),.7)*.9+.1,idx=Math.min(segs,Math.round(t*segs)),q=pts[idx].clone().add(new T.Vector3(rnd()-.5,rnd()-.5,rnd()-.5).multiplyScalar(.7));
    const ax=d.clone().add(new T.Vector3(rnd()-.5,rnd()-.5,rnd()-.5).multiplyScalar(1.6)).normalize();leaf(q,ax,.8+rnd()*.6);}}
 }
 const loTop=lean(TH);
 for(let i=0;i<9;i++){const phi=i/9*TAU+rnd()*.3,y0=16+rnd()*15,e=.18+rnd()*.3,lo=lean(y0),rr0=rOut(y0,phi)*.78,dir=new T.Vector3(Math.sin(phi)*Math.cos(e),Math.sin(e),Math.cos(phi)*Math.cos(e));
  const st=new T.Vector3(Math.sin(phi)*rr0+lo.x,y0,Math.cos(phi)*rr0+lo.z);grow(st,dir,24+rnd()*8,2.7-(y0-16)*.03,1.1,0);}
 for(let i=0;i<4;i++){const phi=i/4*TAU+rnd()*.6,e=.85+rnd()*.3,dir=new T.Vector3(Math.sin(phi)*Math.cos(e),Math.sin(e),Math.cos(phi)*Math.cos(e));
  const st=new T.Vector3(Math.sin(phi)*4+loTop.x,TH-.6,Math.cos(phi)*4+loTop.z);grow(st,dir,18+rnd()*5,2.5,1.1,0);}
 {const picks=[new T.Vector3(loTop.x,TH+17,loTop.z),new T.Vector3(loTop.x+6,TH+14,loTop.z-4),new T.Vector3(loTop.x-5,TH+15,loTop.z+5)];
  const order=tips.map((_,i)=>i).sort(()=>rnd()-.5);
  for(const i of order){const t=tips[i];if(t.y<20)continue;if(picks.every(q=>q.distanceTo(t)>3.9))picks.push(t.clone().add(new T.Vector3(0,1.4,0)));if(picks.length>=(LITE?36:88))break;}
  const cores=[];
  picks.forEach((c,idx)=>{
   const R=idx<3?9:4.6+rnd()*2.6+Math.max(0,(c.y-40)*.05);leafCores.push({x:c.x,y:c.y,z:c.z,R},0);const n=Math.round(R*R*(LITE?12:24)),hue0=96+rnd()*22,sat=.52+rnd()*.15;
   for(let k=0;k<n;k++){
    const v=new T.Vector3(rnd()-.5,rnd()-.5,rnd()-.5).normalize();if(v.y<0)v.y*=.45;
    const sh=.25+.78*Math.pow(rnd(),.38),p=c.clone().addScaledVector(v,R*sh);p.y-=R*.15*(1-Math.max(0,v.y));
    const tg=new T.Vector3(rnd()-.5,rnd()-.5,rnd()-.5).cross(v).normalize(),ax=tg.addScaledVector(v,.35+rnd()*.3).normalize();
    const top=Math.max(0,v.y),bot=Math.max(0,-v.y),light=.14+.22*sh+.22*top*sh-.05*bot+rnd()*.07,gold=rnd()<.03;
    pushLeaf(p,ax,1.05+rnd()*.7,c,hsl2rgb(gold?50+rnd()*8:hue0+rnd()*14-top*14+bot*18,sat+.1*top,light));}
  });}
 const lg=new T.BufferGeometry();lg.setAttribute('position',new T.Float32BufferAttribute(leafV.P,3));lg.setAttribute('normal',new T.Float32BufferAttribute(leafV.N,3));lg.setAttribute('uv',new T.Float32BufferAttribute(leafV.U,2));lg.setAttribute('color',new T.Float32BufferAttribute(leafV.C,3));lg.setIndex(leafV.I);lg.computeBoundingSphere();
 const leaves=new T.Mesh(lg,AB.leafMat);leaves.name='Folhas da árvore gigante';leaves.castShadow=false;leaves.receiveShadow=true;root.add(leaves);
 root.add(build(branchM,barkM,'Galhos da árvore gigante',true));

 /* ---------- Pedras com musgo e arbustos na base (como na referência) ---------- */
 {const rockM=new T.MeshStandardMaterial({vertexColors:true,roughness:.95,flatShading:true});if(AT.apply&&AT.stone)AT.apply(rockM,AT.stone({seed:71}),1.2);
  const rg=[];for(let i=0;i<16;i++){let a=rnd()*TAU;if(Math.abs(angd(a,DOOR))<.45)a+=.9;const rr=11.5+rnd()*6.5,x=Math.sin(a)*rr,z=Math.cos(a)*rr,sz=.7+rnd()*1.3,g=new T.IcosahedronGeometry(1,2),p=g.attributes.position,o1=rnd()*9;
   for(let k=0;k<p.count;k++){const vx=p.getX(k),vy=p.getY(k),vz=p.getZ(k),f=1+.15*Math.sin(vx*2.3+o1)*Math.cos(vz*2.1)+.08*Math.sin(vy*4+o1);p.setXYZ(k,vx*f*1.25,vy*f*(vy<0?.5:.85),vz*f);}
   g.computeVertexNormals();const nn=g.attributes.normal,cl=new Float32Array(p.count*3);for(let k=0;k<p.count;k++){const ny=nn.getY(k),m=ny>.55?Math.min(1,(ny-.55)*3):0,v=.55+.1*Math.sin(k);cl[k*3]=v*(1-m)+.24*m;cl[k*3+1]=v*(1-m)+.4*m;cl[k*3+2]=v*1.04*(1-m)+.14*m;}
   g.setAttribute('color',new T.BufferAttribute(cl,3));const m=new T.Mesh(g,rockM);m.scale.setScalar(sz);m.rotation.y=rnd()*TAU;m.position.set(x,H(LG.x+x,LG.z+z)-base-.15*sz,z);m.castShadow=true;m.receiveShadow=true;root.add(m);
   if(sz>1){const w=W(x,z);O.addCircle(w.x,w.z,sz*1.1);}}
  for(let i=0;i<12;i++){let a=rnd()*TAU;if(Math.abs(angd(a,DOOR))<.45)a+=1;const rr=10.5+rnd()*7,x=Math.sin(a)*rr,z=Math.cos(a)*rr;
   const b=AB.make({w:1.6+rnd()*1.4,h:1+rnd()*.8,d:1.4+rnd()*1.2,leaf:.2,hue:100+rnd()*20,seed:900+i});b.position.set(x,H(LG.x+x,LG.z+z)-base-.1,z);b.rotation.y=rnd()*TAU;root.add(b);}}

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
   if(i%6===0&&t>.08&&t<.92){tube(post,[new T.Vector3(x,H(x,z)-.3,z),new T.Vector3(x,y-.3,z)],[.22,.2],6,2);}
   const top=new T.Vector3(x,y+1.05,z);if(prev){tube(rl,[prev.clone(),top],[.06,.06],5,2);const lo=new T.Vector3(x,y+.55,z),plo=new T.Vector3(x,bridgeY((i-2)/N)+.55,z-2.4);tube(rl,[plo,lo],[.045,.045],5,2);}prev=top;}}
  g.add(build(post,plainBark,'Postes da ponte',false));g.add(build(rl,plainBark,'Corrimão da ponte',false));
  for(const t of [.04,.5,.96])for(const s of [-1,1]){const z=LG.z+BR.z0+len*t,y=bridgeY(t),x=LG.x+s*(BR.w/2+.05);const lp=new T.Mesh(new T.SphereGeometry(.2,9,7),glowM);lp.position.set(x,y+1.5,z);g.add(lp);}
  for(let i=0;i<N;i++){const zc=LG.z+BR.z0+len*(i+.5)/N;for(const s of [-1,1])O.addBox({x:LG.x+s*(BR.w/2+.1),z:zc,hw:.12,hd:len/N/2+.05,rot:0});}
  (window.arcanoExtraDecks=window.arcanoExtraDecks||[]).push({
   surfaceAt(x,z){const dx=Math.abs(x-LG.x);if(dx>BR.w/2+.02)return null;const t=bridgeT(z);if(t<0||t>1)return null;return bridgeY(t)+.04;},
   blocksSegment(){return false;}});
 }

 /* ---------- Piso interno, colisão e câmera ---------- */
 const frac=th=>{let t=((th-THS)/TAU)%1;if(t<0)t+=1;return t;};
 const inHole=th=>{const d=(((th-(THE-HOLE))%TAU)+TAU)%TAU;return d<HOLE;};
 const floorFn=(x,z)=>{
  const dx=x-LG.x,dz=z-LG.z,r=Math.hypot(dx,dz);if(r>10.2)return null;
  const th=Math.atan2(dx,dz),p=api.getGrassPlayer&&api.getGrassPlayer(),py=p?p.position.y-base:0;
  if(r>=RIN-.2&&r<=10.9){const lat=Math.abs(dz>0?dx:99);if(lat<DOORW+.3&&dz>0)return base+Y0;return null;}
  if(r>RIN+.1)return null;
  const cand=[Y0];
  if(r>=RAMP_IN-.05&&r<=RIN+.1){const t=frac(th);for(let k=0;k<5;k++){const y=Y0+(t+k)*RISE;if(y<=YTOP+.05)cand.push(y);}}
  if(r<=RAMP_OUT+.2&&!(r>=RAMP_IN&&inHole(th)))cand.push(YTOP);
  let best=Y0;for(const c of cand)if(c<=py+.9&&c>best)best=c;
  return base+best+.02;
 };
 (window.arcanoGroundOverrides=window.arcanoGroundOverrides||[]).push(floorFn);
 {const NS=26;for(let k=0;k<NS;k++){const th=(k+.5)/NS*TAU;if(Math.abs(angd(th,DOOR))<.5)continue;for(const [r,hd] of [[5.9,1.75],[9.1,1.75]]){const w=W(Math.sin(th)*r,Math.cos(th)*r);O.addBox({x:w.x,z:w.z,hw:r*Math.tan(PI/NS)+.25,hd,rot:th});}}
  for(const s of [-1,1])for(const [z0,z1] of [[RIN+.4,10.9]]){const w=W(s*(DOORW+.3),(z0+z1)/2);O.addBox({x:w.x,z:w.z,hw:.22,hd:(z1-z0)/2,rot:0});}}
 let inside=false;const fireflies=[];
 (function frame(){requestAnimationFrame(frame);
  const p=api.getGrassPlayer&&api.getGrassPlayer();if(!p){return;}
  const dx=p.position.x-LG.x,dz=p.position.z-LG.z,r=Math.hypot(dx,dz),now=r<RIN+.6||(dz>0&&Math.abs(dx)<DOORW&&r<7.6);
  if(now!==inside){inside=now;outerMesh.visible=!inside;for(const e of outerMesh.userData.glows||[])e.visible=!inside;}
  for(const f of fireflies){f.t+=.016;f.s.position.set(f.x+Math.sin(f.t*f.sp+f.ph)*f.ax,f.y+Math.sin(f.t*f.sp*1.3+f.ph*2)*f.ay,f.z+Math.cos(f.t*f.sp*.8+f.ph)*f.ax);f.s.material.opacity=.45+.4*Math.sin(f.t*2.2+f.ph);}
 })();
 {const glow=(()=>{const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),gr=g.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'rgba(255,245,170,1)');gr.addColorStop(1,'rgba(255,230,120,0)');g.fillStyle=gr;g.fillRect(0,0,32,32);return new T.CanvasTexture(c);})();
  for(let i=0;i<70;i++){const a=rnd()*TAU,r=6+rnd()*34,y=3+rnd()*48,s=new T.Sprite(new T.SpriteMaterial({map:glow,transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false}));s.scale.set(.5,.5,1);root.add(s);
   fireflies.push({s,x:Math.sin(a)*r,y,z:Math.cos(a)*r,ax:1+rnd()*2,ay:.6+rnd()*1.2,sp:.5+rnd()*.8,ph:rnd()*6,t:rnd()*9});}}
 window.arcanoArvoreGigante={root,base,tronco:outerMesh};
 console.info('[Árvore gigante] pronta: '+(leafV.P.length/12|0)+' folhas');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
