/* Biblioteca de árvores orgânicas: troncos em tubo contínuo (raiz alargada, caroços na casca, galhos que afinam)
   e copas feitas de folhas/flores desenhadas uma a uma, em massas com volume.
   window.arcanoTrees.make(tipo,{h:altura em metros,seed}) -> THREE.Group com a base em (0,0,0).
   Tipos: cerejeira, carvalho, pinheiro, betula, salgueiro, bordo, acacia. */
(function(){
'use strict';
const T=window.THREE;if(!T)return;
const PI=Math.PI,TAU=PI*2;
const mkRng=sd=>{let s=(sd>>>0)||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};};

/* ---------- Texturas ---------- */
const cache={};
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function tex(c,rep){const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;if(rep){t.wrapS=t.wrapT=T.RepeatWrapping;}return t;}
function barkTex(kind){
 const k='b'+kind;if(cache[k])return cache[k];
 const R=mkRng(kind.length*977+kind.charCodeAt(0)),c=canvas(128,256),g=c.getContext('2d');
 const base={cherry:'#5b3a30',oak:'#4a3a2c',pine:'#5a3a28',birch:'#e6e2d8',willow:'#5c5648',maple:'#5a4636',acacia:'#4a4034'}[kind]||'#5a4030';
 g.fillStyle=base;g.fillRect(0,0,128,256);
 const dark=kind==='birch'?'60,56,50':'30,20,14',light=kind==='birch'?'255,255,250':'130,100,80';
 const nF=kind==='birch'?10:kind==='cherry'?40:70;
 for(let i=0;i<nF;i++){const x=R()*128,w=1.5+R()*(kind==='oak'||kind==='pine'?9:5);g.fillStyle='rgba('+(R()<.55?dark:light)+','+(.15+R()*.3)+')';g.fillRect(x,0,w,256);}
 if(kind==='birch'){for(let i=0;i<40;i++){const x=R()*128,y=R()*256,w=14+R()*60;g.fillStyle='rgba(30,28,26,'+(.55+R()*.4)+')';g.fillRect(x,y,w,2+R()*4);} }
 if(kind==='cherry'){for(let i=0;i<150;i++){const x=R()*128,y=R()*256,w=6+R()*16;g.strokeStyle='rgba(190,170,160,'+(.25+R()*.3)+')';g.lineWidth=1.6;g.beginPath();g.moveTo(x,y);g.lineTo(x+w,y+(R()-.5)*2);g.stroke();}}
 if(kind!=='birch')for(let i=0;i<22;i++){const x=R()*128,y=R()*256,gr=g.createRadialGradient(x,y,0,x,y,10);gr.addColorStop(0,'rgba(120,140,100,.3)');gr.addColorStop(1,'rgba(120,140,100,0)');g.fillStyle=gr;g.fillRect(x-10,y-10,20,20);}
 const t=tex(c,true);cache[k]=t;return t;
}
function leafTex(kind){
 const k='l'+kind;if(cache[k])return cache[k];
 const c=canvas(128,128),g=c.getContext('2d');g.translate(64,64);
 const vein=(col)=>{g.strokeStyle=col;g.lineWidth=2;g.beginPath();g.moveTo(0,-54);g.lineTo(0,56);g.stroke();for(let i=-3;i<=3;i++){g.beginPath();g.moveTo(0,i*14);g.lineTo(24,i*14-12);g.moveTo(0,i*14);g.lineTo(-24,i*14-12);g.stroke();}};
 if(kind==='blossom'){
  const petal=ang=>{g.save();g.rotate(ang);g.beginPath();g.moveTo(0,-4);g.bezierCurveTo(-26,-18,-24,-52,-7,-56);g.lineTo(0,-48);g.lineTo(7,-56);g.bezierCurveTo(24,-52,26,-18,0,-4);g.closePath();
   const gr=g.createLinearGradient(0,-4,0,-56);gr.addColorStop(0,'#e0608a');gr.addColorStop(.35,'#ff9cbd');gr.addColorStop(1,'#fff2f6');g.fillStyle=gr;g.fill();g.strokeStyle='rgba(150,40,80,.55)';g.lineWidth=2.2;g.stroke();g.strokeStyle='rgba(190,70,110,.4)';g.lineWidth=1.3;g.beginPath();g.moveTo(0,-8);g.lineTo(0,-40);g.stroke();g.restore();};
  for(let i=0;i<5;i++)petal(i*TAU/5);g.fillStyle='#c0305f';g.beginPath();g.arc(0,0,7,0,6.3);g.fill();
  for(let i=0;i<9;i++){const an=i/9*TAU;g.strokeStyle='#ffe27a';g.lineWidth=2;g.beginPath();g.moveTo(0,0);g.lineTo(Math.cos(an)*16,Math.sin(an)*16);g.stroke();g.fillStyle='#ffd24a';g.beginPath();g.arc(Math.cos(an)*16,Math.sin(an)*16,2.4,0,6.3);g.fill();}
 }else if(kind==='broad'||kind==='oakleaf'){
  g.beginPath();if(kind==='oakleaf'){g.moveTo(0,-58);for(let i=0;i<5;i++){const y=-46+i*21;g.quadraticCurveTo(30,y-4,18+ (i%2)*8,y+10);g.quadraticCurveTo(26,y+16,4,y+22);} g.lineTo(0,58);for(let i=4;i>=0;i--){const y=-46+i*21;g.quadraticCurveTo(-4,y+22,-26,y+16);g.quadraticCurveTo(-18-(i%2)*8,y+10,-30,y-4);}g.closePath();}
  else{g.moveTo(0,-58);g.bezierCurveTo(40,-36,38,30,0,58);g.bezierCurveTo(-38,30,-40,-36,0,-58);g.closePath();}
  const gr=g.createLinearGradient(0,-58,0,58);gr.addColorStop(0,'#c4ea78');gr.addColorStop(.5,'#7fc24e');gr.addColorStop(1,'#3f8f3c');g.fillStyle=gr;g.fill();g.save();g.clip();vein('rgba(20,70,30,.55)');g.fillStyle='rgba(255,255,210,.2)';g.beginPath();g.ellipse(-12,-22,9,24,.25,0,6.3);g.fill();g.restore();g.lineWidth=3.5;g.strokeStyle='rgba(18,54,26,.9)';g.stroke();
 }else if(kind==='maple'){
  g.beginPath();const pts=[[0,-60],[10,-38],[34,-46],[26,-20],[52,-12],[30,6],[38,34],[10,22],[0,56],[-10,22],[-38,34],[-30,6],[-52,-12],[-26,-20],[-34,-46],[-10,-38]];pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();
  const gr=g.createRadialGradient(0,0,4,0,0,60);gr.addColorStop(0,'#ffd04a');gr.addColorStop(.55,'#ff8a2a');gr.addColorStop(1,'#d83a1f');g.fillStyle=gr;g.fill();g.save();g.clip();g.strokeStyle='rgba(120,30,10,.6)';g.lineWidth=2.2;for(const [x,y] of [[0,-58],[34,-44],[50,-12],[36,32],[-36,32],[-50,-12],[-34,-44]]){g.beginPath();g.moveTo(0,10);g.lineTo(x,y);g.stroke();}g.restore();g.lineWidth=3;g.strokeStyle='rgba(110,26,10,.9)';g.stroke();
 }else if(kind==='needle'){
  g.lineCap='round';for(let i=0;i<26;i++){const a=-PI/2+(i-13)/13*1.05,L=34+((i*37)%16),x0=(i%3-1)*3,col=i%2?'#2f6a3a':'#3f8449';g.strokeStyle=col;g.lineWidth=3.2;g.beginPath();g.moveTo(x0,40);g.lineTo(x0+Math.cos(a)*L,40+Math.sin(a)*L*1.5);g.stroke();}
  g.strokeStyle='#4a3a28';g.lineWidth=3;g.beginPath();g.moveTo(0,58);g.lineTo(0,34);g.stroke();
 }else if(kind==='small'){
  g.beginPath();g.moveTo(0,-50);g.bezierCurveTo(30,-30,30,26,0,52);g.bezierCurveTo(-30,26,-30,-30,0,-50);g.closePath();const gr=g.createLinearGradient(0,-50,0,52);gr.addColorStop(0,'#d8f08a');gr.addColorStop(1,'#8cc84a');g.fillStyle=gr;g.fill();g.save();g.clip();vein('rgba(60,100,30,.5)');g.restore();g.lineWidth=3;g.strokeStyle='rgba(40,80,26,.85)';g.stroke();
 }else if(kind==='lance'){
  g.beginPath();g.moveTo(0,-60);g.bezierCurveTo(16,-30,14,34,0,60);g.bezierCurveTo(-14,34,-16,-30,0,-60);g.closePath();const gr=g.createLinearGradient(0,-60,0,60);gr.addColorStop(0,'#c8e87c');gr.addColorStop(1,'#6fb148');g.fillStyle=gr;g.fill();g.strokeStyle='rgba(30,80,30,.8)';g.lineWidth=2.6;g.stroke();g.beginPath();g.moveTo(0,-54);g.lineTo(0,56);g.stroke();
 }else if(kind==='acacia'){
  for(let i=-5;i<=5;i++){g.save();g.translate(0,i*10);g.beginPath();g.ellipse(-20,0,20,6,.25,0,6.3);g.ellipse(20,0,20,6,-.25,0,6.3);g.fillStyle=i%2?'#8fc04a':'#a8d25a';g.fill();g.restore();}
  g.strokeStyle='#5f7a30';g.lineWidth=3;g.beginPath();g.moveTo(0,-56);g.lineTo(0,56);g.stroke();
 }
 const t=tex(c,false);cache[k]=t;return t;
}
const matCache={};
function barkMat(kind){return matCache['b'+kind]||(matCache['b'+kind]=new T.MeshStandardMaterial({map:barkTex(kind),roughness:1,side:T.DoubleSide}));}
function leafMat(kind){return matCache['l'+kind]||(matCache['l'+kind]=new T.MeshStandardMaterial({map:leafTex(kind),alphaTest:.45,side:T.DoubleSide,vertexColors:true,roughness:1,name:'tree leaf '+kind}));}

/* ---------- Construção ---------- */
function Builder(kind,R){
 const g=new T.Group(),leaves={};
 function tube(pts,rad,flare,sd,sides){
  const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(p[0],p[1],p[2]))),N=Math.max(10,Math.round(curve.getLength()*3.5)),S=sides||10,fr=curve.computeFrenetFrames(N,false),len=curve.getLength();
  const P=[],U=[],I=[];
  for(let i=0;i<=N;i++){const t=i/N,pos=curve.getPoint(t),f=t*(rad.length-1),k=Math.min(rad.length-2,Math.floor(f)),rr=(rad[k]+(rad[k+1]-rad[k])*(f-k))*(1+flare*Math.exp(-t*8)),nn=fr.normals[i],bb=fr.binormals[i];
   for(let j=0;j<=S;j++){const an=j/S*TAU,lump=1+.09*Math.sin(an*3+t*8+sd)+.06*Math.sin(an*5-t*13+sd*2)+(flare>0?.15*Math.max(0,Math.sin(an*4+sd))*Math.exp(-t*7):0),dx=nn.x*Math.cos(an)+bb.x*Math.sin(an),dy=nn.y*Math.cos(an)+bb.y*Math.sin(an),dz=nn.z*Math.cos(an)+bb.z*Math.sin(an);
    P.push(pos.x+dx*rr*lump,pos.y+dy*rr*lump,pos.z+dz*rr*lump);U.push(j/S*Math.max(1,rr*4),t*len/1.1);}}
  for(let i=0;i<N;i++)for(let j=0;j<S;j++){const q=i*(S+1)+j;I.push(q,q+S+1,q+1,q+1,q+S+1,q+S+2);}
  const gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute(P,3));gg.setAttribute('uv',new T.Float32BufferAttribute(U,2));gg.setIndex(I);gg.computeVertexNormals();
  const m=new T.Mesh(gg,barkMat(kind));m.castShadow=true;m.receiveShadow=true;g.add(m);
 }
 function card(lk,px,py,pz,size,nrm,col,orient){ // um cartão de folha/flor
  const L=leaves[lk]||(leaves[lk]=[]);
  const a=R()*TAU,ca=Math.cos(a),sa=Math.sin(a),tl=R()*1.4-.7;
  let ux=[ca,0,sa],uy=[-sa*Math.sin(tl),Math.cos(tl),ca*Math.sin(tl)];
  if(orient){ux=orient.u;uy=orient.v;}
  const hs=size/2,asp=orient&&orient.asp?orient.asp:1,p=[[-hs,-hs*asp],[hs,-hs*asp],[hs,hs*asp],[-hs,hs*asp]].map(([u,v])=>[px+ux[0]*u+uy[0]*v,py+ux[1]*u+uy[1]*v,pz+ux[2]*u+uy[2]*v]);
  L.push({p,n:nrm,c:col});
 }
 function clump(lk,cx,cy,cz,rx,ry,rz,n,size,palette,opt){
  opt=opt||{};
  for(let i=0;i<n;i++){let vx=R()-.5,vy=R()-.5,vz=R()-.5;const l=Math.hypot(vx,vy,vz)||1;vx/=l;vy/=l;vz/=l;if(vy<0)vy*=opt.flat?.3:.8;
   const sh=(opt.inner||.45)+(1-(opt.inner||.45))*Math.pow(R(),.5),px=cx+vx*rx*sh,py=cy+vy*ry*sh,pz=cz+vz*rz*sh;
   const pc=palette[Math.floor(R()*palette.length)],br=.84+.16*sh+.08*Math.max(0,vy);
   card(lk,px,py,pz,size*(.8+R()*.5),[vx*.6,vy*.6+.6,vz*.6],pc.map(v=>Math.min(1.2,v*br)));}
 }
 function finish(){
  for(const lk in leaves){const list=leaves[lk],n=list.length;if(!n)continue;
   const P=new Float32Array(n*12),U=new Float32Array(n*8),C=new Float32Array(n*12),Nn=new Float32Array(n*12),I=new Uint32Array(n*6);
   list.forEach((q,i)=>{for(let k=0;k<4;k++){P.set(q.p[k],i*12+k*3);Nn.set(q.n,i*12+k*3);C.set(q.c,i*12+k*3);}U.set([0,0,1,0,1,1,0,1],i*8);I.set([i*4,i*4+1,i*4+2,i*4,i*4+2,i*4+3],i*6);});
   const gg=new T.BufferGeometry();gg.setAttribute('position',new T.BufferAttribute(P,3));gg.setAttribute('uv',new T.BufferAttribute(U,2));gg.setAttribute('color',new T.BufferAttribute(C,3));gg.setAttribute('normal',new T.BufferAttribute(Nn,3));gg.setIndex(new T.BufferAttribute(I,1));
   const m=new T.Mesh(gg,leafMat(lk));m.castShadow=false;m.receiveShadow=true;g.add(m);}
  return g;
 }
 return {g,tube,card,clump,finish,R};
}

/* limbs: caminho curvo com subgalhos */
function limbs(B,base,tips,rad0,sub,sd){
 const R=B.R;
 for(const t of tips){const st=base(t),en=t.end,mid=[(st[0]+en[0])/2+(R()-.5)*.4,(st[1]+en[1])/2+(t.up||0),(st[2]+en[2])/2+(R()-.5)*.4];
  B.tube([st,mid,en],[rad0*(t.r||1),rad0*(t.r||1)*.62,rad0*(t.r||1)*.3],.15,R()*6);
  for(let k=0;k<sub;k++){const sb=[en[0]+(R()-.5)*1.4,en[1]+R()*.9,en[2]+(R()-.5)*1.4];B.tube([en,[(en[0]+sb[0])/2,(en[1]+sb[1])/2+.15,(en[2]+sb[2])/2],sb],[rad0*.2,rad0*.13,rad0*.06],0,R()*6,6);}}
}

const TYPES={
 cerejeira(h,R){const s=h/5,B=Builder('cherry',R);
  B.tube([[0,-.2,0],[.05*s,.9*s,.05*s],[.25*s,1.8*s,-.04*s],[.16*s,2.7*s,.03*s]],[.38*s,.27*s,.21*s,.16*s],.9,R()*6);
  for(let q=0;q<5;q++){const a=q/5*TAU+R()*.5,dx=Math.cos(a),dz=Math.sin(a);B.tube([[dx*.2*s,.35*s,dz*.2*s],[dx*.7*s,.08*s,dz*.7*s],[dx*1.3*s,-.12*s,dz*1.3*s]],[.17*s,.1*s,.04*s],0,R()*6,7);}
  const tips=[[1.1,3.2,.5],[-1.05,3.1,-.4],[.35,4.1,.1],[.1,3.2,-1.1],[-.25,3.4,1.1]].map(([x,y,z])=>({end:[x*s,y*s,z*s],up:-.15*s}));
  limbs(B,()=>[.18*s,(1.9+R()*.5)*s,.02*s],tips,.14*s,2);
  const pal=[[1,.95,.97],[1,.85,.92],[.98,.72,.84],[.96,.62,.78]];
  for(const [x,y,z,r] of [[.3,3.4,0,1.35],[1.15,3.1,.45,1.05],[-1.05,3.0,-.35,1.1],[.2,4.1,.1,.95],[.1,3.2,-1.05,.9],[-.2,3.4,1.05,.9]])B.clump('blossom',x*s,y*s,z*s,r*s,r*s*.82,r*s,Math.round(500*r*r*Math.min(1.2,s)),.3*(.8+.2*s),pal);
  B.clump('blossom',.3*s,3.3*s,0,1.7*s,1.4*s,1.7*s,Math.round(500*s*Math.min(1.3,s)),.3*(.8+.2*s),pal,{inner:0});
  for(let q=0;q<5;q++){const a=q/5*TAU+.4,r=1.25*s;B.clump('blossom',Math.cos(a)*r,2.55*s+R()*.3*s,Math.sin(a)*r,.95*s,.8*s,.95*s,Math.round(300*s),.3*(.8+.2*s),pal);}
  return B.finish();},
 carvalho(h,R){const s=h/8,B=Builder('oak',R);
  B.tube([[0,-.3,0],[.12*s,1.3*s,.06*s],[-.05*s,2.6*s,-.1*s],[.04*s,3.4*s,0]],[.62*s,.46*s,.38*s,.3*s],1.1,R()*6,12);
  for(let q=0;q<6;q++){const a=q/6*TAU+R()*.4,dx=Math.cos(a),dz=Math.sin(a);B.tube([[dx*.3*s,.5*s,dz*.3*s],[dx*1.0*s,.1*s,dz*1.0*s],[dx*1.8*s,-.2*s,dz*1.8*s]],[.26*s,.16*s,.06*s],0,R()*6,7);}
  const tips=[];for(let q=0;q<6;q++){const a=q/6*TAU+R()*.5,r=(2.1+R()*.8)*s;tips.push({end:[Math.cos(a)*r,(4.4+R()*1.3)*s,Math.sin(a)*r],up:.4*s});}tips.push({end:[.3*s,6.2*s,0],up:.2*s,r:.9});
  limbs(B,t=>[0,(2.9+R()*.5)*s,0],tips,.3*s,2);
  const pal=[[.45,.85,.35],[.5,.9,.4],[.38,.78,.3],[.62,.92,.4]];
  for(const t of tips){const [x,y,z]=t.end;B.clump('oakleaf',x,y+.2*s,z,1.9*s,1.45*s,1.9*s,Math.round(520*s*s),.36*(.8+.2*s),pal);}
  for(let q=0;q<6;q++){const a=q/6*TAU+.3,r=1.7*s;B.clump('oakleaf',Math.cos(a)*r,3.7*s+R()*.4*s,Math.sin(a)*r,1.5*s,1.3*s,1.5*s,Math.round(380*s*s),.36*(.8+.2*s),pal);}
  B.clump('oakleaf',0,5.4*s,0,2.8*s,2*s,2.8*s,Math.round(800*s*s),.36*(.8+.2*s),pal);
  return B.finish();},
 pinheiro(h,R){const B=Builder('pine',R),s=h/10;
  B.tube([[0,-.2,0],[.06*s,h*.35,.04*s],[-.04*s,h*.7,.03*s],[0,h*.98,0]],[.34*s,.22*s,.12*s,.02*s],.7,R()*6,10);
  const pal=[[.85,1,.85],[.7,.95,.75],[.6,.9,.65]];
  let y=h*.16,tier=0;
  while(y<h*.96){const t=(y-h*.16)/(h*.8),L=(1-t)*h*.3+.35,n=6+Math.round((1-t)*3);
   for(let q=0;q<n;q++){const a=q/n*TAU+tier*.5+R()*.3,dx=Math.cos(a),dz=Math.sin(a),end=[dx*L,y-L*.3,dz*L],mid=[dx*L*.5,y+.1,dz*L*.5];
    B.tube([[dx*.1,y,dz*.1],mid,end],[.09*s,.055*s,.02*s],0,R()*6,5);
    const cnt=Math.max(7,Math.round(L*8));for(let k=0;k<cnt;k++){const f=.25+.75*k/cnt,px=dx*L*f,pz=dz*L*f,py=y+.1-(L*.3+.1)*f*f+.1,oy=R()*.2-.05;
     for(let w=0;w<3;w++)B.card('needle',px+(R()-.5)*.1,py+oy,pz+(R()-.5)*.1,.8*(1-t*.35),[dx*.6,.5,dz*.6],pal[Math.floor(R()*3)].map(v=>v*(.8+.2*(1-f))),{u:[-dz,0,dx],v:[dx*.5,.78,dz*.5],asp:.9});}}
   y+=.6+R()*.15;tier++;}
  for(let k=0;k<8;k++)B.card('needle',0,h*(.95+k*.012),0,.6,[0,1,0],pal[0],{u:[Math.cos(k),0,Math.sin(k)],v:[0,1,0],asp:1});
  return B.finish();},
 betula(h,R){const s=h/7,B=Builder('birch',R);
  B.tube([[0,-.15,0],[.3*s,1.6*s,.1*s],[-.1*s,3.4*s,-.1*s],[.25*s,5.2*s,.05*s]],[.2*s,.16*s,.12*s,.07*s],.5,R()*6,9);
  const tips=[[1.3,5.2,.5],[-1.2,5.6,-.6],[.6,6.6,.3],[-.3,6.9,-.4],[1.0,4.3,-1.0],[-1.0,4.1,.9]].map(([x,y,z])=>({end:[x*s,y*s,z*s],up:.2*s,r:.8}));
  limbs(B,()=>[.15*s,(3.4+R()*1.6)*s,0],tips,.1*s,3);
  const pal=[[.78,.95,.45],[.85,1,.5],[.7,.9,.4],[.95,.9,.4]];
  for(const t of tips){const [x,y,z]=t.end;B.clump('small',x,y+.2*s,z,1.3*s,1.0*s,1.3*s,Math.round(330*s*s),.26*(.8+.2*s),pal);}
  B.clump('small',.2*s,6.4*s,0,1.5*s,1.2*s,1.5*s,Math.round(380*s*s),.26*(.8+.2*s),pal);
  return B.finish();},
 salgueiro(h,R){const s=h/7,B=Builder('willow',R);
  B.tube([[0,-.3,0],[.3*s,1.2*s,.1*s],[.1*s,2.4*s,-.2*s],[-.3*s,3.2*s,0]],[.6*s,.45*s,.36*s,.28*s],1.1,R()*6,12);
  const tips=[];for(let q=0;q<6;q++){const a=q/6*TAU+R()*.5,r=(1.8+R()*.8)*s;tips.push({end:[Math.cos(a)*r,(4.6+R()*.8)*s,Math.sin(a)*r],up:.8*s});}
  limbs(B,()=>[0,(2.9+R()*.4)*s,0],tips,.26*s,1);
  const pal=[[.62,.88,.4],[.7,.92,.45],[.55,.82,.38]];
  B.clump('lance',0,5*s,0,3.2*s,1.6*s,3.2*s,Math.round(1500*s*s),.3,pal,{flat:true,inner:.2});
  for(let k=0;k<(110*Math.min(1.3,s));k++){const a=R()*TAU,r=(1.2+R()*2.4)*s,x=Math.cos(a)*r,z=Math.sin(a)*r,y0=(4.2+R()*.7)*s,len=(2+R()*1.6)*s,sag=(R()-.5)*.4;
   const pts=[[x,y0,z],[x*1.04+sag,y0-len*.5,z*1.04],[x*1.08+sag,y0-len,z*1.08]];B.tube(pts,[.018,.012,.007],0,R()*6,4);
   const n=Math.round(len*11);for(let i=0;i<n;i++){const f=i/n,py=y0-len*f,sw=Math.sin(f*3)*sag;for(const sd of [-1,1])B.card('lance',x*(1+.08*f)+sw+sd*.06,py,z*(1+.08*f)+sd*.03,.38,[x/r*.5,0,z/r*.5],pal[Math.floor(R()*3)],{u:[1,0,0],v:[0,-1,0],asp:1});}}
  return B.finish();},
 bordo(h,R){const s=h/6.5,B=Builder('maple',R);
  B.tube([[0,-.25,0],[.1*s,1.1*s,.05*s],[-.05*s,2.2*s,-.08*s],[.05*s,2.9*s,0]],[.5*s,.38*s,.3*s,.24*s],1,R()*6,11);
  const tips=[];for(let q=0;q<6;q++){const a=q/6*TAU+R()*.5,r=(1.6+R()*.7)*s;tips.push({end:[Math.cos(a)*r,(3.9+R()*1.1)*s,Math.sin(a)*r],up:.4*s});}tips.push({end:[0,5.4*s,0],up:.2*s,r:.9});
  limbs(B,()=>[0,(2.4+R()*.4)*s,0],tips,.24*s,2);
  const pal=[[1,.55,.2],[.95,.35,.18],[1,.75,.28],[.85,.28,.15]];
  for(const t of tips){const [x,y,z]=t.end;B.clump('maple',x,y+.2*s,z,1.7*s,1.3*s,1.7*s,Math.round(430*s*s),.4*(.8+.2*s),pal);}
  B.clump('maple',0,4.7*s,0,2.3*s,1.7*s,2.3*s,Math.round(650*s*s),.4*(.8+.2*s),pal);
  return B.finish();},
 acacia(h,R){const s=h/7,B=Builder('acacia',R);
  B.tube([[0,-.2,0],[.3*s,1.6*s,.1*s],[.7*s,3.2*s,-.1*s],[.5*s,4.4*s,0]],[.4*s,.27*s,.2*s,.16*s],.9,R()*6,10);
  const tips=[];for(let q=0;q<4;q++){const a=q/4*TAU+R()*.6,r=(2.4+R()*1.3)*s;tips.push({end:[.5*s+Math.cos(a)*r,(5.2+R()*.8)*s,Math.sin(a)*r],up:.5*s});}
  limbs(B,()=>[.5*s,(4.2+R()*.3)*s,0],tips,.17*s,2);
  const pal=[[.62,.82,.32],[.7,.88,.38],[.55,.76,.3]];
  for(const t of tips){const [x,y,z]=t.end;B.clump('acacia',x,y+.1*s,z,2.8*s,.8*s,2.8*s,Math.round(760*s*s),.42,pal,{flat:true,inner:.1});}
  B.clump('acacia',.5*s,5.7*s,0,4.2*s,.9*s,4.2*s,Math.round(1100*s*s),.42,pal,{flat:true,inner:.1});
  return B.finish();}
};

window.arcanoTrees={
 types:Object.keys(TYPES),
 make(type,o){o=o||{};const f=TYPES[type];if(!f)return null;const R=mkRng(o.seed||(type.length*131+7));const g=f(o.h||({cerejeira:5,carvalho:8,pinheiro:10,betula:7,salgueiro:7,bordo:6.5,acacia:7})[type],R);g.name='Árvore '+type;return g;}
};
})();
