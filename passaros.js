/* Pássaros articulados e anatômicos: esqueleto -> fibras musculares -> pele -> penas (uma a uma, em camadas).
   window.arcanoBirds.make(especie, fase, {seed, camadas:{osso,musculo,pele,penas}, poleiro, modo}) -> THREE.Group em METROS
   (de frente para +z, pés em y=0). userData.api.animate(modo,t) move o pássaro:
   'parado','bicar','bater','voar','planar','pousar'.
   Asa: ombro -> cotovelo -> punho (articulados). Penas de voo grandes e individuais atrás; por cima, fileiras de coberteiras
   cada vez menores; na frente (borda de ataque) só penugem. Cauda graduada: a do centro é a maior.
   Bico: mandíbula de cima + de baixo que, fechadas, formam um cone. */
(function(){
'use strict';
const T=window.THREE;if(!T)return;
const PI=Math.PI,TAU=PI*2;
const mkRng=sd=>{let s=(sd>>>0)||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};};
const V=(x,y,z)=>new T.Vector3(x,y,z);
const clamp=(v,a,b)=>Math.max(a===undefined?0:a,Math.min(b===undefined?1:b,v));
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const hex=h=>{const n=parseInt(h.slice(1),16);return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255];};
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,t)=>{t=clamp((t-a)/(b-a));return t*t*(3-2*t);};

/* ================= texturas de pena (silhueta + barbas + fendas + rachis) ================= */
const FT={};
const KINDS={ // lead/trail: meia-largura (px) por t (0 base .. 1 ponta); notch: recorte do lado de trás perto da ponta
 primary:{lead:t=>11*Math.pow(Math.sin(PI*Math.pow(t,.55)),.5)*(1-Math.pow(t,5)),trail:t=>(24*Math.pow(Math.sin(PI*Math.pow(t,.6)),.55))*(1-Math.pow(t,4.5))-(t>.6&&t<.76?7*Math.sin((t-.6)/.16*PI):0),fray:5},
 secondary:{lead:t=>13*Math.pow(Math.sin(PI*Math.pow(t,.5)),.5)*(1-Math.pow(t,8)),trail:t=>27*Math.pow(Math.sin(PI*Math.pow(t,.55)),.5)*(1-Math.pow(t,6)),fray:4},
 contour:{lead:t=>20*Math.pow(Math.sin(PI*Math.pow(t,.6)),.55)*(1-Math.pow(t,9)),trail:t=>20*Math.pow(Math.sin(PI*Math.pow(t,.6)),.55)*(1-Math.pow(t,9)),fray:3,fluff:.36},
 tail:{lead:t=>21*Math.pow(Math.sin(PI*Math.pow(t,.45)),.4)*(1-Math.pow(t,11)),trail:t=>23*Math.pow(Math.sin(PI*Math.pow(t,.45)),.4)*(1-Math.pow(t,11)),fray:3},
 covert:{lead:t=>22*Math.pow(Math.sin(PI*Math.pow(t,.6)),.5)*(1-Math.pow(t,14)),trail:t=>22*Math.pow(Math.sin(PI*Math.pow(t,.6)),.5)*(1-Math.pow(t,14)),fray:2,fluff:.3}
};
function featherTex(kind){
 if(FT[kind])return FT[kind];
 const W=96,H=256,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),K=KINDS[kind],cx=W/2;let sd=kind.length*91+7;const rr=()=>{sd=(sd*1664525+1013904223)>>>0;return sd/4294967296;};
 const wl=y=>Math.max(0,K.lead(1-y/H)),wt=y=>Math.max(0,K.trail(1-y/H));
 g.beginPath();g.moveTo(cx,H);for(let y=H;y>=0;y-=2)g.lineTo(cx-wl(y),y);for(let y=0;y<=H;y+=2)g.lineTo(cx+wt(y),y);g.closePath();
 g.fillStyle='#e4e4e4';g.fill();
 g.save();g.clip();
 const ang=1.0;
 for(let y=H+60;y>-60;y-=2.4){for(const sg of [-1,1]){const sl=sg<0?.8:1;g.strokeStyle=rr()<.5?'rgba(0,0,0,'+(.06+rr()*.1)+')':'rgba(255,255,255,'+(.12+rr()*.2)+')';g.lineWidth=1.2;g.beginPath();g.moveTo(cx,y);g.lineTo(cx+sg*140,y-140*Math.tan(ang)*.55*sl);g.stroke();}}
 // base felpuda (penugem na raiz das penas de contorno)
 if(K.fluff){const gr=g.createLinearGradient(0,H,0,H*(1-K.fluff));gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,H*(1-K.fluff),W,H*K.fluff);}
 // sombra suave ao longo da raque e escurecimento perto da base
 const gb=g.createLinearGradient(0,H,0,H*.7);gb.addColorStop(0,'rgba(0,0,0,.18)');gb.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gb;g.fillRect(0,H*.7,W,H*.3);
 g.restore();
 // fendas entre barbas e pontas desfiadas (alfa)
 g.globalCompositeOperation='destination-out';
 for(let i=0;i<22;i++){const y=rr()*H*.9,side=rr()<.5?-1:1,t=1-y/H,w=side<0?wl(y):wt(y),len=6+rr()*(14+t*26);g.strokeStyle='rgba(0,0,0,1)';g.lineWidth=1+rr()*1.4;g.beginPath();const x0=cx+side*(w+2);g.moveTo(x0,y);g.lineTo(x0-side*len*.7,y-len*(.5+rr()*.3));g.stroke();}
 for(let i=0;i<K.fray*14;i++){const t=.78+rr()*.22,y=(1-t)*H,side=rr()<.5?-1:1,w=side<0?wl(y):wt(y);g.fillStyle='rgba(0,0,0,1)';g.beginPath();const x0=cx+side*w;g.moveTo(x0,y-4);g.lineTo(x0-side*(3+rr()*5),y+2);g.lineTo(x0+side*3,y+6);g.fill();}
 g.globalCompositeOperation='source-over';
 // raque
 const rg=g.createLinearGradient(cx-2,0,cx+2,0);rg.addColorStop(0,'#9a9486');rg.addColorStop(.5,'#f0ece0');rg.addColorStop(1,'#9a9486');
 g.fillStyle=rg;g.beginPath();g.moveTo(cx-2.6,H);g.lineTo(cx-.9,H*.03);g.lineTo(cx+.9,H*.03);g.lineTo(cx+2.6,H);g.closePath();g.fill();
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;FT[kind]=t;return t;
}
let DOWN=null;
function downTex(){
 if(DOWN)return DOWN;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.translate(32,60);
 for(let i=0;i<54;i++){const a=-PI/2+(Math.random()-.5)*2.5,L=24+Math.random()*34,cu=(Math.random()-.5)*14;g.strokeStyle='rgba(255,255,255,'+(.55+Math.random()*.4)+')';g.lineWidth=1+Math.random()*1.6;g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(Math.cos(a)*L*.5+cu,Math.sin(a)*L*.5,Math.cos(a)*L,Math.sin(a)*L);g.stroke();}
 const gr=g.createRadialGradient(0,-14,0,0,-14,22);gr.addColorStop(0,'rgba(255,255,255,.95)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.arc(0,-14,22,0,6.3);g.fill();
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;DOWN=t;return t;
}
const MAT={};
const mergedMat=kind=>MAT['m'+kind]||(MAT['m'+kind]=new T.MeshStandardMaterial({map:featherTex(kind),vertexColors:true,alphaTest:.35,roughness:.8,side:T.DoubleSide}));
const downMat=()=>MAT.d||(MAT.d=new T.MeshStandardMaterial({map:downTex(),vertexColors:true,alphaTest:.3,roughness:1,side:T.DoubleSide}));
const indivMat=(kind,col)=>new T.MeshStandardMaterial({map:featherTex(kind),color:new T.Color(col[0],col[1],col[2]),alphaTest:.35,roughness:.8,side:T.DoubleSide});

/* tira de pena: comprimento 1 (y), largura 1 (x), curvatura e raque em z */
function stripPush(buf,pos,a,n,len,wid,col,tw){
 a=a.clone().normalize();let s=new T.Vector3().crossVectors(a,n).normalize();const nn=new T.Vector3().crossVectors(s,a).normalize();
 if(tw){s.applyAxisAngle(a,tw);nn.applyAxisAngle(a,tw);}
 const b0=buf.P.length/3,rows=4;
 for(let r=0;r<=rows;r++){const t=r/rows,bend=-.12*t*t;for(const [u,rid] of [[-.5,-.03],[0,.03],[.5,-.03]]){const x=u*wid,y=t*len,z=(bend+rid)*len*.4;
   buf.P.push(pos.x+s.x*x+a.x*y+nn.x*z,pos.y+s.y*x+a.y*y+nn.y*z,pos.z+s.z*x+a.z*y+nn.z*z);buf.C.push(col[0],col[1],col[2]);buf.U.push(u+.5,t);}}
 for(let r=0;r<rows;r++){const a0=b0+r*3,b=b0+(r+1)*3;buf.I.push(a0,b,a0+1,a0+1,b,b+1,a0+1,b+1,a0+2,a0+2,b+1,b+2);}
}
function downPush(buf,pos,a,n,len,wid,col){
 a=a.clone().normalize();const s=new T.Vector3().crossVectors(a,n).normalize(),b0=buf.P.length/3,hs=wid*.5;
 for(const [sx,sy] of [[-hs,0],[hs,0],[hs,len],[-hs,len]]){buf.P.push(pos.x+s.x*sx+a.x*sy,pos.y+s.y*sx+a.y*sy,pos.z+s.z*sx+a.z*sy);buf.C.push(col[0],col[1],col[2]);}
 buf.U.push(0,0,1,0,1,1,0,1);buf.I.push(b0,b0+1,b0+2,b0,b0+2,b0+3);
}
function indivGeo(len,wid){
 const rows=6,P=[],U=[],I=[];
 for(let r=0;r<=rows;r++){const t=r/rows,bend=-.1*t*t;for(const [u,rid] of [[-.5,-.03],[0,.03],[.5,-.03]]){P.push(u*wid,t*len,(bend+rid)*len*.35);U.push(u+.5,t);}}
 for(let r=0;r<rows;r++){const a=r*3,b=(r+1)*3;I.push(a,b,a+1,a+1,b,b+1,a+1,b+1,a+2,a+2,b+1,b+2);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('uv',new T.Float32BufferAttribute(U,2));g.setIndex(I);g.computeVertexNormals();return g;
}

/* ================= malhas auxiliares ================= */
function Buf(){return {P:[],C:[],U:[],I:[]};}
function bufMesh(b,mat,name,shadow,off){
 const g=new T.BufferGeometry(),P=off?b.P.map((v,i)=>v-off[i%3]):b.P;
 g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('color',new T.Float32BufferAttribute(b.C,3));if(b.U.length)g.setAttribute('uv',new T.Float32BufferAttribute(b.U,2));g.setIndex(b.I);g.computeVertexNormals();
 const m=new T.Mesh(g,mat);m.name=name;m.castShadow=!!shadow;m.receiveShadow=true;return m;
}
function tube(b,pts,rad,col,sides,segs){
 sides=sides||6;segs=segs||Math.max(3,pts.length*3);
 const cv=new T.CatmullRomCurve3(pts.map(p=>p.clone())),fr=cv.computeFrenetFrames(segs,false),base=b.P.length/3;
 for(let i=0;i<=segs;i++){const t=i/segs,pos=cv.getPoint(t),f=t*(rad.length-1),k=Math.min(rad.length-2,Math.floor(f)),r=rad[k]+(rad[k+1]-rad[k])*(f-k),nn=fr.normals[i],bb=fr.binormals[i];
  for(let j=0;j<=sides;j++){const a=j/sides*TAU,ca=Math.cos(a),sa=Math.sin(a);b.P.push(pos.x+(nn.x*ca+bb.x*sa)*r,pos.y+(nn.y*ca+bb.y*sa)*r,pos.z+(nn.z*ca+bb.z*sa)*r);b.C.push(col[0],col[1],col[2]);}}
 for(let i=0;i<segs;i++)for(let j=0;j<sides;j++){const q=base+i*(sides+1)+j;b.I.push(q,q+sides+1,q+1,q+1,q+sides+1,q+sides+2);}
}
function sphere(b,c,r3,col,seg){seg=seg||8;const base=b.P.length/3;
 for(let i=0;i<=seg;i++){const a=i/seg*PI;for(let j=0;j<=seg*2;j++){const t=j/(seg*2)*TAU;b.P.push(c.x+Math.sin(a)*Math.cos(t)*r3[0],c.y+Math.cos(a)*r3[1],c.z+Math.sin(a)*Math.sin(t)*r3[2]);b.C.push(col[0],col[1],col[2]);}}
 for(let i=0;i<seg;i++)for(let j=0;j<seg*2;j++){const q=base+i*(seg*2+1)+j;b.I.push(q,q+seg*2+1,q+1,q+1,q+seg*2+1,q+seg*2+2);}
}
/* meia mandíbula: seção semicircular + face plana; de cima + de baixo fecham em cone */
function halfCone(R,len,upper,hook,col,inner){
 const NS=10,NA=10,P=[],C=[],I=[],sg=upper?1:-1;
 const ring=[];for(let k=0;k<=NA;k++){const a=k/NA*PI;ring.push([Math.cos(a),Math.sin(a)*sg,0]);}
 for(let k=1;k<=NA;k++)ring.push([1-2*k/NA*0+(-1+2*(1-k/NA))*0+(-1)*0,0,1]);
 // face plana: de x=-1 a x=1 ao longo de y=0
 const flat=[];for(let k=0;k<=NA;k++)flat.push([-1+2*k/NA,0,1]);
 const arc=ring.slice(0,NA+1),all=arc.concat(flat);
 for(let i=0;i<=NS;i++){const t=i/NS,s=Math.pow(1-t,.9),hk=(hook||0)*t*t*t;
  for(const p of all){P.push(p[0]*R*s,p[1]*R*s*(upper?1:.92)-hk,t*len);const c2=p[2]?inner:col;C.push(c2[0],c2[1],c2[2]);}}
 const M=all.length;for(let i=0;i<NS;i++)for(let k=0;k<M-1;k++){const a=i*M+k,b=a+1,c=a+M,d=c+1;I.push(a,c,b,b,c,d);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.setIndex(I);g.computeVertexNormals();return g;
}

/* ================= espécies e fases ================= */
const SPECIES={
 periquito:{k:.058,span:2.5,tail:1.7,crest:0,skin:'#d2b8a8',eye:'#e8c040',beak:{len:.24,r:.16,col:'#e8dcb0',low:'#d8c898',hook:.1},leg:'#a89888',tailN:11,
  paint(reg,R){let c;switch(reg){
   case 'crown':c=hex('#f2d022');break;case 'face':c=hex('#f4dc30');break;case 'mask':c=hex('#f4dc30');break;case 'throat':c=hex('#eed23a');break;
   case 'breast':c=mix(hex('#52b648'),hex('#8ed05a'),R()*.5);break;case 'belly':c=mix(hex('#6cc455'),hex('#a0d868'),R()*.5);break;
   case 'back':c=mix(hex('#2f9a3a'),hex('#1f7a38'),R()*.5);break;case 'rump':c=hex('#3a9ad8');break;
   case 'cov':c=R()<.35?hex('#f2c020'):R()<.5?hex('#e8602a'):mix(hex('#2f9a3a'),hex('#4ab04a'),R());break;
   case 'primary':c=mix(hex('#2a62d0'),hex('#3a8ae0'),R()*.6);break;case 'second':c=R()<.5?hex('#2f78d8'):hex('#2a62d0');break;
   case 'tail':c=R()<.3?hex('#d8321e'):mix(hex('#2a5fc8'),hex('#2f9a8a'),R()*.4);break;default:c=hex('#2f9a3a');}return c;}},
 pardal:{k:.05,span:2.2,tail:.9,crest:0,skin:'#d9a8a0',eye:'#2a1a10',beak:{len:.3,r:.11,col:'#4a3d33',low:'#9a8a70',hook:0},leg:'#c99a78',tailN:9,
  paint(reg,R){let c;switch(reg){
   case 'crown':c=hex('#8a4a2a');break;case 'face':c=hex('#c9b79a');break;case 'mask':c=hex('#2a211b');break;
   case 'throat':c=hex('#231d1a');break;case 'breast':c=hex('#b8aea0');break;case 'belly':c=hex('#dcd4c4');break;
   case 'back':c=hex('#7a5a3a');if(R()<.4)c=mix(c,hex('#2a1d14'),.65);break;case 'rump':c=hex('#8f7a5e');break;
   case 'cov':c=hex('#8d5f38');if(R()<.3)c=mix(c,hex('#f0e0c0'),.5);break;case 'primary':c=hex('#6e5640');break;
   case 'second':c=mix(hex('#6e4d34'),hex('#d9bf92'),R()*.45);break;case 'tail':c=hex('#6c5440');break;default:c=hex('#8a7358');}return c;}},
 gaio:{k:.072,span:2.6,tail:1.3,crest:14,skin:'#cfd0d6',eye:'#1a1410',beak:{len:.4,r:.12,col:'#1b1b22',low:'#2a2a30',hook:0},leg:'#2a2a2c',tailN:11,
  paint(reg,R){const blue=hex('#3f7bd1'),deep=hex('#27519c');let c;switch(reg){
   case 'crown':case 'crest':c=mix(blue,hex('#8cc0f4'),R()*.4);break;case 'face':c=hex('#e8ecf2');if(R()<.3)c=mix(c,blue,.35);break;
   case 'mask':c=hex('#1c1c24');break;case 'throat':c=hex('#f2f4f8');break;case 'collar':c=hex('#1c2230');break;
   case 'breast':c=hex('#dfe4ec');break;case 'belly':c=hex('#e8ebf0');break;case 'back':c=mix(blue,deep,R()*.45);break;
   case 'rump':c=mix(deep,blue,.5);break;case 'cov':c=R()<.28?hex('#ffffff'):mix(blue,deep,R()*.5);break;
   case 'primary':c=R()<.5?mix(deep,hex('#10151f'),.4):mix(blue,hex('#10151f'),.2);break;
   case 'second':c=R()<.6?hex('#f2f4f8'):mix(deep,blue,.4);break;case 'tail':c=R()<.55?mix(blue,deep,.4):hex('#10151f');break;default:c=blue;}return c;}},
 cardeal:{k:.06,span:2.4,tail:1.15,crest:12,skin:'#c9908c',eye:'#1a1010',beak:{len:.32,r:.16,col:'#e8742a',low:'#e0642a',hook:0},leg:'#b88a7a',tailN:11,
  paint(reg,R){const red=hex('#d4121f'),dr=hex('#9a0f1c');let c;switch(reg){
   case 'crown':case 'crest':c=mix(red,hex('#ef4a4a'),R()*.5);break;case 'face':c=red;break;case 'mask':c=hex('#17110f');break;
   case 'throat':c=hex('#17110f');break;case 'breast':c=mix(red,hex('#ee4040'),R()*.5);break;case 'belly':c=mix(red,hex('#e86a5a'),.3+R()*.3);break;
   case 'back':c=mix(red,dr,.35+R()*.3);break;case 'rump':c=red;break;case 'cov':c=mix(dr,red,R()*.4);break;
   case 'primary':c=mix(dr,hex('#6a2a2a'),.4);break;case 'second':c=mix(dr,hex('#8a4040'),R()*.5);break;
   case 'tail':c=mix(dr,hex('#6a1620'),.3+R()*.3);break;default:c=red;}return c;}}
};
const STAGES={
 filhote:{kscale:.62,head:1.75,bodyW:1.38,bodyH:1.3,wing:.34,tail:0,keel:.5,beak:.62,eye:.1,contour:false,tufts:0},
 jovem:{kscale:.9,head:1.1,bodyW:1.04,bodyH:1.0,wing:.92,tail:.62,keel:.9,beak:.92,eye:.078,contour:true,tufts:70},
 adulto:{kscale:1,head:1,bodyW:1,bodyH:1,wing:1,tail:1,keel:1,beak:1,eye:.072,contour:true,tufts:0}
};
function tint(sp,stage,reg,R,p){
 let c=sp.paint(reg,R);
 if(stage==='filhote'){c=mix(mix(hex('#cdbb9a'),c,.22),[1,1,1],.12+R()*.12);}
 else if(stage==='jovem'){const l=c[0]*.3+c[1]*.59+c[2]*.11;c=mix(mix(c,hex('#8a7a62'),.25),[l,l*.95,l*.85],.4);if(R()<.3)c=mix(c,hex('#f0e4c8'),.4);}
 const sh=.86+.14*clamp((p.y+.45)/1.2);return c.map(v=>clamp(v*sh*(.93+R()*.12)));
}

/* ================= perfil do corpo ================= */
const PZ=[1.58,1.52,1.42,1.30,1.18,1.05,.9,.75,.55,.3,0,-.3,-.55,-.75,-.88];
const PW=[.01,.07,.17,.20,.15,.12,.16,.24,.30,.31,.28,.21,.13,.07,.03];
const PT=[.60,.66,.74,.76,.62,.52,.50,.50,.50,.46,.40,.32,.27,.24,.22];
const PB=[.54,.52,.50,.44,.40,.30,.18,-.05,-.30,-.36,-.28,-.12,.02,.12,.18];
function profile(st){
 const W=[],Tp=[],Bt=[];
 for(let i=0;i<PZ.length;i++){let z=PZ[i],w=PW[i],t=PT[i],b=PB[i];
  if(z>1.0){const hc=.6,h=st.head;t=hc+(t-hc)*h;b=hc+(b-hc)*h;w*=h;}
  else{const cy=.06;t=cy+(t-cy)*st.bodyH;b=cy+(b-cy)*st.bodyH;w*=st.bodyW;}
  W.push(w);Tp.push(t);Bt.push(b);}
 return {W,Tp,Bt};
}
function interp(arr,z){
 if(z>=PZ[0])return arr[0];if(z<=PZ[PZ.length-1])return arr[PZ.length-1];
 for(let i=0;i<PZ.length-1;i++){if(z<=PZ[i]&&z>=PZ[i+1]){const t=(PZ[i]-z)/(PZ[i]-PZ[i+1]),s=t*t*(3-2*t);return arr[i]+(arr[i+1]-arr[i])*s;}}
 return arr[0];
}
const HP=V(0,.52,.98),HPa=[HP.x,HP.y,HP.z];   // pivô da cabeça (base do pescoço)

/* ================= o pássaro ================= */
function make(species,stage,opt){
 opt=opt||{};const sp=SPECIES[species],st=STAGES[stage];if(!sp||!st)return null;
 const R=mkRng((opt.seed||1)*131+species.length*17+stage.length*7),root=new T.Group();root.name='Pássaro '+species+' '+stage;
 const K=sp.k*st.kscale,body=new T.Group();root.add(body);
 const LAY={osso:[],musculo:[],pele:[],penas:[]};
 const reg=(layer,node,parent)=>{parent.add(node);LAY[layer].push(node);return node;};
 const prof=profile(st);
 const skinAt=(z,th)=>{const w=interp(prof.W,z),t=interp(prof.Tp,z),b=interp(prof.Bt,z),yc=(t+b)/2,hh=(t-b)/2,n=2.3,c=Math.cos(th),s=Math.sin(th);
  return V(w*Math.sign(c)*Math.pow(Math.abs(c),2/n),yc+hh*Math.sign(s)*Math.pow(Math.abs(s),2/n),z);};
 const normAt=(z,th)=>{const e=.02,p=skinAt(z,th),pz=skinAt(z+e,th),pt=skinAt(z,th+.06),n=new T.Vector3().crossVectors(pt.clone().sub(p),pz.clone().sub(p)).normalize();
  const ctr=V(0,(interp(prof.Tp,z)+interp(prof.Bt,z))/2,z);if(n.dot(p.clone().sub(ctr))<0)n.negate();return n;};
 const regionAt=(z,th,p)=>{
  const dorsal=Math.sin(th)>.15,ventral=Math.sin(th)<-.4;
  if(z>1.18){if(z>1.36&&Math.abs(p.x)<.1&&p.y<.7&&p.y>.45)return p.y<.55?'throat':'mask';return dorsal&&p.y>.7?'crown':'face';}
  if(z>.9)return ventral?'throat':(species==='gaio'&&Math.abs(z-1.02)<.08&&!dorsal?'collar':(dorsal?'crown':'throat'));
  if(z>.0){return ventral||Math.sin(th)<-.05?(z>.4?'breast':'belly'):(Math.sin(th)<.55?'breast':'back');}
  if(z>-.5)return ventral?'belly':(Math.sin(th)>.2?(z<-.35?'rump':'back'):'belly');
  return Math.sin(th)>.2?'rump':'belly';
 };
 const Lh=sp.span*st.wing,L1=.3*Lh,L2=.34*Lh,L3=.36*Lh,hS=st.head;
 const SHOULDER=V(.3,.22,.48),HIP=V(.17,.02,-.18),TAILP=V(0,.22,-.8);
 const EYEP=sg=>V(sg*.155*hS,.655,1.3);

 /* ---------- grupos articulados ---------- */
 const torso=new T.Group(),headG=new T.Group(),tailG=new T.Group(),jawG=new T.Group();
 body.add(torso);torso.add(headG);headG.position.copy(HP);
 tailG.position.copy(TAILP);torso.add(tailG);
 const JP=V(0,.575,1.4);jawG.position.copy(JP).sub(HP);headG.add(jawG);
 const wings=[],legs=[];
 for(const sg of [1,-1]){
  const roll=new T.Group(),yaw=new T.Group(),elbow=new T.Group(),wrist=new T.Group();
  roll.position.set(sg*SHOULDER.x,SHOULDER.y,SHOULDER.z);roll.scale.x=sg;torso.add(roll);roll.add(yaw);
  elbow.position.set(L1,0,0);yaw.add(elbow);wrist.position.set(L2,0,0);elbow.add(wrist);
  wings.push({sg,roll,yaw,elbow,wrist,sets:[yaw,elbow,wrist],prim:[],sec:[],tert:[],cov:[]});
 }
 for(const sg of [1,-1]){const lg=new T.Group();lg.position.set(sg*HIP.x,HIP.y,HIP.z);torso.add(lg);legs.push({sg,g:lg});}

 /* ===== 1) ESQUELETO ===== */
 {const ivory=hex('#ebe3cf'),ivD=hex('#cfc4a8'),mkb=()=>Buf(),B=mkb(),Bh=mkb();
  const bt=(buf,pts,r,sd)=>tube(buf,pts,r,ivory,sd||6),h=hS,hcY=.6;
  sphere(Bh,V(0,hcY+.02,1.28),[.15*h,.13*h,.17*h],ivory,10);
  for(const sg of [-1,1])sphere(Bh,V(sg*.115*h,hcY+.05,1.36),[.045*h,.045*h,.02],ivD,6);
  bt(Bh,[V(0,hcY-.01,1.42),V(0,hcY-.02,1.5),V(0,hcY-.04,1.46+sp.beak.len*st.beak*.55)],[.05*h,.036,.01],6);
  bt(Bh,[V(0,hcY-.07,1.4),V(0,hcY-.09,1.5),V(0,hcY-.1,1.44+sp.beak.len*st.beak*.45)],[.03*h,.022,.008],5);
  const neck=[V(0,hcY-.03,1.14),V(0,.62,1.0),V(0,.58,.84)];bt(Bh,neck,[.03,.026,.03],7);
  const spine=[V(0,.58,.84),V(0,.46,.7),V(0,.42,.55),V(0,.4,.3),V(0,.38,.0),V(0,.34,-.3),V(0,.3,-.55),V(0,.26,-.8)];
  bt(B,spine,[.03,.034,.034,.034,.034,.03,.022,.012],7);
  for(let i=0;i<spine.length-1;i++)for(let k=0;k<3;k++)sphere(B,spine[i].clone().lerp(spine[i+1],k/3),[.034,.034,.03],ivD,5);
  for(const sg of [-1,1])for(let i=0;i<7;i++){const z=.52-i*.11;bt(B,[V(sg*.04,.4,z),V(sg*(.27-i*.006),.12,z-.02),V(sg*.12,-.16-.02*(i>3?0:i*.01),z-.07)],[.012,.012,.01],4);}
  {const kt=st.keel,pts=[V(0,-.12,.64),V(0,-.2*kt-.06,.5),V(0,-.4*kt-.05,.2),V(0,-.32*kt-.04,-.15),V(0,-.2,-.3)];bt(B,pts,[.02,.024,.02,.016,.01],5);
   for(let i=0;i<pts.length-1;i++)for(const sg of [-1,1])bt(B,[V(sg*.05,-.1,pts[i].z),V(sg*.08,-.14,pts[i].z-.04)],[.012,.01],4);}
  for(const sg of [-1,1]){bt(B,[V(sg*.3,.2,.5),V(sg*.2,-.02,.6),V(0,-.12,.66)],[.014,.012,.012],5);bt(B,[V(sg*.3,.2,.5),V(sg*.16,-.04,.56),V(sg*.07,-.12,.5)],[.02,.02,.016],5);bt(B,[V(sg*.3,.24,.46),V(sg*.26,.3,.15),V(sg*.2,.32,-.12)],[.018,.014,.008],5);
   bt(B,[V(sg*.05,.34,-.15),V(sg*.19,.24,-.28),V(sg*.12,.18,-.55)],[.04,.04,.02],5);}
  const ms=new T.MeshStandardMaterial({vertexColors:true,roughness:.55});
  reg('osso',bufMesh(B,ms,'Ossos',true),torso);reg('osso',bufMesh(Bh,ms,'Crânio',true,HPa),headG);
  // ossos da asa em cada segmento (coordenadas locais; +x para fora)
  wings.forEach(W=>{const o=Buf(),f=Buf(),hd=Buf(),ws=st.wing;
   tube(o,[V(0,0,0),V(L1*.5,.02,.01),V(L1,0,0)],[.026,.022,.02],ivory,6);
   tube(f,[V(0,0,0),V(L2*.5,0,.03),V(L2,0,0)],[.016,.015,.012],ivory,5);tube(f,[V(0,0,0),V(L2*.5,-.012,.015),V(L2,0,0)],[.01,.01,.008],ivory,4);
   tube(hd,[V(0,0,0),V(L3*.5,0,-.01),V(L3,0,-.02)],[.014,.013,.008],ivory,5);tube(hd,[V(0,.0,.0),V(L3*.35,.0,.03)],[.01,.008],ivory,4);
   reg('osso',bufMesh(o,ms,'Úmero',true),W.yaw);reg('osso',bufMesh(f,ms,'Rádio/ulna',true),W.elbow);reg('osso',bufMesh(hd,ms,'Mão',true),W.wrist);});
  // pernas (relativas ao quadril)
  legs.forEach(L=>{const sg=L.sg,b=Buf(),rel=p=>p.clone().sub(V(sg*HIP.x,HIP.y,HIP.z));
   const knee=rel(V(sg*.21,-.17,.12)),ank=rel(V(sg*.2,-.45,-.08)),foot=rel(V(sg*.2,-.72,.02));
   bt(b,[V(0,0,0),knee],[.028,.022],5);bt(b,[knee,knee.clone().lerp(ank,.5).add(V(0,0,-.03)),ank],[.022,.014,.012],5);bt(b,[ank,foot],[.012,.01],5);
   for(const [ang,Lg] of [[-.45,.3],[0,.34],[.45,.3],[PI,.22]])bt(b,[foot,foot.clone().add(V(Math.sin(ang)*Lg*.5,-.01,Math.cos(ang)*Lg*.5)),foot.clone().add(V(Math.sin(ang)*Lg,-.02,Math.cos(ang)*Lg))],[.01,.008,.006],4);
   reg('osso',bufMesh(b,ms,'Perna óssea',true),L.g);});
 }

 /* ===== 2) FIBRAS MUSCULARES ===== */
 {const B=Buf(),base=hex('#a23535'),dark=hex('#7e2424'),pale=hex('#c2605a');
  const fibers=(orig,ins,n,bulge,r,spread)=>{for(let i=0;i<n;i++){const t=i/(n-1),o=orig(t),e=ins(t).add(V((R()-.5)*spread,(R()-.5)*spread,(R()-.5)*spread)),m=o.clone().lerp(e,.5+(R()-.5)*.1).add(bulge(t)),c=mix(base,R()<.5?dark:pale,R()*.45);tube(B,[o,m,e],[r*.7,r,r*.6],c,4,3);}};
  const kt=st.keel;
  for(const sg of [-1,1]){
   fibers(t=>V(sg*.05,-.3*kt-.02-.08*t*(1-t),lerp(.58,-.2,t)),t=>V(sg*.31,.14,.44+(.04*t)),Math.round(10+44*st.wing),t=>V(sg*.1,-.05+.06*Math.sin(t*PI),0),.013,.02);
   fibers(t=>V(sg*.03,-.22*kt,lerp(.5,.05,t)),t=>V(sg*.3,.18,.46),22,t=>V(sg*.04,-.02,0),.011,.015);
   fibers(t=>V(sg*.07,.38,lerp(.55,-.5,t)),t=>V(sg*.1,.3,lerp(.4,-.62,t)),12,t=>V(sg*.07,.02,0),.01,.02);
   fibers(t=>V(sg*.05,.5+.06*t,lerp(1.0,.75,t)),t=>V(sg*.08,.4,lerp(.7,.5,t)),12,t=>V(sg*.04,.02,0),.009,.015);
   fibers(t=>V(sg*.17,.08,-.16+.05*t),t=>V(sg*.21,-.2,.1+.02*t),16,t=>V(sg*.05,0,-.03),.015,.02);}
  reg('musculo',bufMesh(B,new T.MeshStandardMaterial({vertexColors:true,roughness:.5}),'Fibras',true),torso);
 }

 /* ===== 3) PELE, OLHOS, BICO, PERNAS ===== */
 const skinCol=hex(sp.skin),SKIN=stage==='filhote'?mix(skinCol,hex('#e8a0a0'),.5):skinCol;
 {const hull=(z0,z1,NZ,NT)=>{const B=Buf();for(let i=0;i<=NZ;i++){const z=lerp(z0,z1,i/NZ);for(let j=0;j<=NT;j++){const p=skinAt(z,j/NT*TAU);B.P.push(p.x,p.y,p.z);B.C.push(SKIN[0],SKIN[1],SKIN[2]);}}
   for(let i=0;i<NZ;i++)for(let j=0;j<NT;j++){const q=i*(NT+1)+j;B.I.push(q,q+1,q+NT+1,q+1,q+NT+2,q+NT+1);}return B;};
  const sm=new T.MeshStandardMaterial({vertexColors:true,roughness:.7,side:T.DoubleSide});
  reg('pele',bufMesh(hull(1.03,-.84,36,28),sm,'Pele do corpo',true),torso);reg('pele',bufMesh(hull(1.58,.97,18,28),sm,'Pele da cabeça',true,HPa),headG);
  const smat=(c,r)=>new T.MeshStandardMaterial({color:c,roughness:r||.5});
  const bk=sp.beak,bl=bk.len*st.beak*1.35,br=bk.r*(stage==='filhote'?1.12:1)*hS*.95,col=hex(bk.col),colL=hex(bk.low),inner=hex('#d98a8a');
  // bico: metade de cima fixa na cabeça, metade de baixo gira na mandíbula; fechadas formam um cone
  const up=new T.Mesh(halfCone(br,bl,true,bk.hook||0,col,inner),new T.MeshStandardMaterial({vertexColors:true,roughness:.35,side:T.DoubleSide}));up.position.set(0,.575,1.4).sub(HP);up.castShadow=true;reg('pele',up,headG);
  const lo=new T.Mesh(halfCone(br,bl*.96,false,0,colL,inner),new T.MeshStandardMaterial({vertexColors:true,roughness:.35,side:T.DoubleSide}));lo.position.set(0,0,0);lo.castShadow=true;jawG.add(lo);LAY.pele.push(jawG);
  up.rotation.x=0;
  if(stage!=='adulto')for(const sg of [-1,1]){const gp=new T.Mesh(new T.SphereGeometry(br*.4,8,6),smat(stage==='filhote'?'#f2c14a':'#e8c060',.6));gp.position.set(sg*br*.95,-.0,.0);jawG.add(gp);}
  // olhos grandes e visíveis, com anel e brilho
  for(const sg of [-1,1]){const ep=EYEP(sg).sub(HP),e=st.eye*(stage==='filhote'?1.2:1);
   const ring=new T.Mesh(new T.SphereGeometry(e*1.35,16,12),smat(sp.eye==='#2a1a10'?'#4a3a2e':'#a08840',.6));ring.position.copy(ep);ring.scale.set(.7,1,1);headG.add(ring);LAY.pele.push(ring);
   const eye=new T.Mesh(new T.SphereGeometry(e,18,14),smat('#0a0808',.1));eye.position.copy(ep).add(V(sg*e*.35,0,e*.05));headG.add(eye);LAY.pele.push(eye);
   const iris=new T.Mesh(new T.TorusGeometry(e*.78,e*.17,6,18),smat(sp.eye,.3));iris.position.copy(ep).add(V(sg*e*.9,0,e*.05));iris.lookAt(ep.clone().add(V(sg*2,0,.1)));headG.add(iris);LAY.pele.push(iris);
   const hl=new T.Mesh(new T.SphereGeometry(e*.3,8,6),new T.MeshBasicMaterial({color:'#fff'}));hl.position.copy(ep).add(V(sg*e*1.0,e*.4,e*.5));headG.add(hl);LAY.pele.push(hl);
   const lid=new T.Mesh(new T.TorusGeometry(e*1.1,e*.22,6,16),smat(stage==='filhote'?'#d79a8a':'#d8c8b0',.8));lid.position.copy(ep).add(V(sg*e*.4,0,e*.05));lid.lookAt(ep.clone().add(V(sg*2,.1,.3)));headG.add(lid);LAY.pele.push(lid);}
  // pernas: coxa com pele, tarso escamado, dedos e garras (relativas ao quadril)
  legs.forEach(L=>{const sg=L.sg,hip=V(sg*HIP.x,HIP.y,HIP.z),rel=p=>p.clone().sub(hip),B=Buf(),legC=hex(sp.leg);
   const ank=rel(V(sg*.2,-.45,-.08)),foot=rel(V(sg*.2,-.72,.02));
   sphere(B,rel(V(sg*.2,-.2,0)),[.1,.19,.12],SKIN,8);tube(B,[rel(V(sg*.2,-.3,-.02)),ank],[.03,.016],SKIN,6,3);
   tube(B,[ank,foot],[.014,.011],legC,6,3);for(let k=0;k<5;k++)sphere(B,ank.clone().lerp(foot,(k+.5)/5),[.016,.012,.016],mix(legC,[0,0,0],.15),5);
   for(const [ang,Lg] of [[-.45,.3],[0,.34],[.45,.3],[PI,.22]]){const to=foot.clone().add(V(Math.sin(ang)*Lg,-.02,Math.cos(ang)*Lg));tube(B,[foot,foot.clone().lerp(to,.5).add(V(0,.01,0)),to],[.011,.009,.007],legC,5,3);
    const claw=new T.Mesh(new T.ConeGeometry(.012,.07,5),smat('#2b2420',.5));claw.position.copy(to).add(V(Math.sin(ang)*.03,-.01,Math.cos(ang)*.03));claw.lookAt(to.clone().add(V(Math.sin(ang),-.4,Math.cos(ang))));claw.rotateX(PI/2);L.g.add(claw);LAY.pele.push(claw);}
   reg('pele',bufMesh(B,new T.MeshStandardMaterial({vertexColors:true,roughness:.7}),'Perna',true),L.g);});
 }

 /* ===== 4) PENAS ===== */
 const bodyK={contour:Buf()},headK={contour:Buf()},bodyDown=Buf(),headDown=Buf();
 const eyeNear=(p)=>{for(const sg of [-1,1])if(p.distanceTo(EYEP(sg))<.17*hS)return true;return false;};
 {const kd=st.contour?'contour':'down';
  const rowsZ=[];for(let z=1.52;z>-.84;z-=(z>1.1?.05:.07))rowsZ.push(z);
  for(let layer=0;layer<2;layer++)for(const z of rowsZ){
   const zz=z-(layer?.035:0),circ=TAU*(interp(prof.W,zz)+(interp(prof.Tp,zz)-interp(prof.Bt,zz))/2)*.85,nAround=Math.max(8,Math.round(circ/(zz>1.1?.085:.1)));
   for(let j=0;j<nAround;j++){const th=(j+(layer?.5:0)+(R()-.5)*.2)/nAround*TAU,p=skinAt(zz,th),n=normAt(zz,th),pn=skinAt(zz-.05,th);
    if(zz>1.1&&eyeNear(p))continue;
    let a=pn.clone().sub(p).normalize();a.y-=.05;a.normalize();
    const lean=(zz>1.0?.16:.1)+R()*.06,ar=a.clone().multiplyScalar(Math.cos(lean)).addScaledVector(n,Math.sin(lean)).normalize();
    const col=tint(sp,stage,regionAt(zz,th,p),R,p),len=(zz>1.1?.2:zz>.8?.3:zz>-.3?.36:.42)*(st.contour?1:1.15),wid=len*.9,head=zz>1.04;
    if(kd==='down')downPush(head?headDown:bodyDown,head?p.clone().sub(HP):p,ar,n,len,wid,col);
    else stripPush(head?headK.contour:bodyK.contour,head?p.clone().sub(HP):p,ar,n,len,wid,col,(R()-.5)*.3);}}
  for(let i=0;i<st.tufts;i++){const z=R()<.5?lerp(1.3,1.0,R()):lerp(.3,-.2,R()),th=R()<.5?-PI/2+(R()-.5)*1.4:PI/2+(R()-.5)*2,p=skinAt(z,th),n=normAt(z,th);
   if(z>1.1&&eyeNear(p))continue;const head=z>1.04;downPush(head?headDown:bodyDown,head?p.clone().sub(HP):p,n.clone().add(V(0,.2,-.5)).normalize(),n,.2,.16,mix(hex('#cdbb9a'),[1,1,1],.3));}
  // penugem das coxas
  legs.forEach(L=>{const sg=L.sg,B=Buf(),hip=V(sg*HIP.x,HIP.y,HIP.z),Bd=Buf();
   for(let i=0;i<40;i++){const a0=i*2.399963,yy=1-2*(i+.5)/40,rr=Math.sqrt(1-yy*yy),d=V(Math.cos(a0)*rr,yy,Math.sin(a0)*rr),pos=V(sg*.2,-.2,0).add(V(d.x*.1,d.y*.19,d.z*.12)).sub(hip);
    if(!st.contour)downPush(Bd,pos,V(sg*.04,-1,-.25),d,.2,.14,tint(sp,stage,'belly',R,pos));else stripPush(B,pos,V(sg*.04,-1,-.25),d,.2,.12,tint(sp,stage,'belly',R,pos.clone().add(hip)),(R()-.5)*.3);}
   if(B.P.length)reg('penas',bufMesh(B,mergedMat('contour'),'Coxa',true),L.g);if(Bd.P.length)reg('penas',bufMesh(Bd,downMat(),'Coxa penugem',true),L.g);});
  if(bodyK.contour.P.length)reg('penas',bufMesh(bodyK.contour,mergedMat('contour'),'Penas do corpo',true),torso);
  if(headK.contour.P.length)reg('penas',bufMesh(headK.contour,mergedMat('contour'),'Penas da cabeça',true),headG);
  if(bodyDown.P.length)reg('penas',bufMesh(bodyDown,downMat(),'Penugem do corpo',true),torso);
  if(headDown.P.length)reg('penas',bufMesh(headDown,downMat(),'Penugem da cabeça',true),headG);
  // crista
  if(st.contour&&sp.crest){const B=Buf();for(let i=0;i<sp.crest;i++){const t=i/(sp.crest-1),pos=V((R()-.5)*.12,.78,lerp(1.28,1.02,t)).sub(HP),a=V((R()-.5)*.1,1,-.3-t*.7).normalize();stripPush(B,pos,a,V(0,.2,1).normalize(),(.26+.1*(1-t))*(stage==='jovem'?.7:1),.13,tint(sp,stage,'crest',R,pos.clone().add(HP)),0);}
   reg('penas',bufMesh(B,mergedMat('secondary'),'Crista',true),headG);}
 }

 /* ----- cauda graduada: a do centro é a maior; as outras diminuem para as bordas ----- */
 const tailF=[];
 if(st.tail>0){const nT=sp.tailN,mid=(nT-1)/2,Lt=sp.tail*st.tail*1.45;
  for(let i=0;i<nT;i++){const k=i-mid,len=Lt*(1-.075*Math.abs(k)-.012*k*k),col=tint(sp,stage,'tail',R,V(0,.2,-1)),pivot=new T.Group();pivot.position.set(0,.003*(mid-Math.abs(k)),0);
   const m=new T.Mesh(indivGeo(len,len*.42),indivMat('tail',col));m.rotation.x=-PI/2;m.castShadow=true;pivot.add(m);tailG.add(pivot);LAY.penas.push(pivot);tailF.push({pivot,k,mid});}
  // coberteiras da cauda (curtas, sobre a base)
  const B=Buf();for(let i=0;i<16;i++){const f=(i/15-.5)*2,pos=V(f*.1,.02,.02).add(V(0,0,0)),a=V(f*.4,-.03,-1);stripPush(B,pos,a,V(0,1,0),.36-.1*Math.abs(f),.2,tint(sp,stage,'rump',R,V(0,.2,-.8)),0);}
  reg('penas',bufMesh(B,mergedMat('covert'),'Coberteiras da cauda',true),tailG);
 }else{const B=Buf();for(let i=0;i<14;i++)downPush(B,V((R()-.5)*.1,0,0),V((R()-.5)*.5,.1,-1),V(0,1,0),.22,.16,hex('#cdbb9a'));reg('penas',bufMesh(B,downMat(),'Penugem da cauda',true),tailG);}

 /* ----- asas: camadas (voo grandes e individuais -> coberteiras menores por cima -> penugem na frente) ----- */
 const wlen=Lh/2.3;
 wings.forEach((W,wi)=>{
  const sg=W.sg,mk=(seg)=>({k:{},seg});
  const sets=W.sets,segLen=[L1,L2,L3],up=V(0,1,0);
  const cb=[{},{},{}];const getB=(i,kind)=>cb[i][kind]||(cb[i][kind]=Buf());
  const addFlight=(setI,kind,x,z,len,wid,reg0,fanAngle,store,yo)=>{const col=tint(sp,stage,reg0,R,V(sg*.4,.2,0)),pivot=new T.Group();pivot.position.set(x,yo||0,z);
   const m=new T.Mesh(indivGeo(len,wid),indivMat(kind,col));m.rotation.x=-PI/2;m.castShadow=true;pivot.add(m);sets[setI].add(pivot);LAY.penas.push(pivot);store.push({pivot,ang:fanAngle,x,seg:setI});};
  if(st.wing<.5){ // filhote: toquinhos com canetas e penugem
   for(let i=0;i<7;i++){addFlight(2,'primary',L3*(i+.5)/7,-.02,.34+.03*i,.12,'primary',.1,W.prim);}
  }else{
   // terciárias (úmero) e secundárias (rádio/ulna): penas largas, individuais
   for(let i=0;i<5;i++)addFlight(0,'secondary',L1*(i+.3)/5,-.04,1.05*wlen,.52*wlen,'second',0,W.tert);
   for(let i=0;i<10;i++)addFlight(1,'secondary',L2*(i+.5)/10,-.03,(1.55-.08*i/9)*wlen,.7*wlen,'second',.06*i/9,W.sec);
   // primárias (mão): leque que abre para fora; as do meio são as mais longas
   for(let i=0;i<10;i++){const t=i/9,len=(1.75+.55*Math.sin(PI*(t*.9+.08)))*wlen*.96;addFlight(2,'primary',L3*(.06+.9*t),-.02,len,.62*wlen,'primary',.06+.78*t,W.prim);}
   // camadas de coberteiras por cima das penas de voo (cada fileira menor e mais para frente)
   const rows=[ // [segmento, nº, tipo, comprimento, largura, z, região]
    [2,10,'covert',.55,.16,.03,'cov'],[2,8,'covert',.36,.14,.07,'cov'],
    [1,11,'covert',.66,.2,.03,'cov'],[1,12,'covert',.46,.17,.07,'cov'],[1,13,'covert',.32,.14,.1,'cov'],
    [0,6,'covert',.5,.2,.03,'cov'],[0,7,'covert',.34,.16,.07,'cov']];
   rows.forEach(([si,n,kind,len,wid,z,rg],ri)=>{for(let i=0;i<n;i++){const t=(i+.5)/n;addFlight(si,kind,segLen[si]*t,z+(R()-.5)*.01,len*wlen*(.9+.2*R()),len*wlen*.55,rg,(R()-.5)*.1,W.cov,.012+.012*ri);}});
   // penugem na borda de ataque (frente da asa): só fiapos macios
   for(let si=0;si<3;si++)for(let i=0;i<(si===0?18:26);i++){const t=(i+R())/(si===0?18:26),pos=V(segLen[si]*t,.03+R()*.015,.1+R()*.08);downPush(getB(si,'down'),pos,V(0,.15,-1),up,.2+.07*R(),.13,mix(tint(sp,stage,'cov',R,V(sg*.4,.2,0)),[1,1,1],.15));}
  }
  [0,1,2].forEach(si=>{for(const kind in cb[si]){const m=kind==='down'?downMat():mergedMat(kind);reg('penas',bufMesh(cb[si][kind],m,'Coberteiras '+kind,true),sets[si]);}});
 });

 /* ================= poses e animação ================= */
 const S={fold:1,flap:0,flex:0,sweep:0,roll:0,headPitch:0,headYaw:0,jaw:0,tailPitch:0,tailFan:.15,bodyPitch:.2,bodyY:.8,tuck:0,legSpread:0};
 const apply=()=>{
  const f=S.fold,open=1-f;
  wings.forEach(W=>{
   const p1=lerp(.12+S.sweep,1.35,f),p2=lerp(-.35*S.flex,-2.6,f),p3=lerp(.9*S.flex,2.5,f);
   W.roll.rotation.z=W.sg*(S.flap*open+S.roll*open-1.15*f);W.yaw.rotation.y=p1;W.elbow.rotation.y=p2;W.wrist.rotation.y=p3;
   const cum=[p1,p1+p2,p1+p2+p3],spread=.08+.92*open;
   for(const arr of [W.prim,W.sec,W.tert,W.cov])arr.forEach(q=>{q.pivot.rotation.y=-cum[q.seg]-q.ang*spread;});
  });
  headG.rotation.set(-S.headPitch,S.headYaw,0);jawG.rotation.x=S.jaw;
  tailG.rotation.x=-S.tailPitch;tailF.forEach(q=>{q.pivot.rotation.y=-(q.k-0)*(.03+.085*S.tailFan);});
  legs.forEach(L=>{L.g.rotation.x=1.25*S.tuck;L.g.rotation.z=-L.sg*S.legSpread;});
  torso.rotation.x=-S.bodyPitch;body.position.y=S.bodyY*K;
 };
 const reset=()=>Object.assign(S,{fold:1,flap:0,flex:0,sweep:0,roll:0,headPitch:0,headYaw:0,jaw:0,tailPitch:0,tailFan:.15,bodyPitch:.2,bodyY:.8,tuck:0,legSpread:0});
 const FREE=stage!=='filhote';
 function animate(mode,t){
  reset();const s=S;
  if(!FREE&&mode!=='bicar')mode='parado';
  switch(mode){
   case 'bicar':{const c=t%2.4,idle=Math.sin(t*1.3);s.headPitch=.08*idle;s.headYaw=.25*Math.sin(t*.9);
    if(c>1.0&&c<2.0){const u=(c-1.0);const dn=smooth(0,.22,u)*(1-smooth(.5,.8,u)),strike=smooth(.18,.26,u)*(1-smooth(.26,.34,u));
     s.headPitch=-1.05*dn+.08*idle;s.headYaw*=1-dn;s.jaw=.42*smooth(0,.2,u)*(1-smooth(.2,.27,u))+.1*smooth(.7,.8,u)*(1-smooth(.8,.9,u));s.bodyPitch=.2-.18*dn;}
    break;}
   case 'bater':{const p=t*TAU*3.2;s.fold=0;s.flap=.85*Math.sin(p);s.flex=.6*clamp(-Math.cos(p),0,1);s.bodyPitch=.75;s.bodyY=.9+.08*Math.sin(p+.8);s.tuck=.4;s.tailFan=.9;s.tailPitch=-.5;s.headPitch=.15;break;}
   case 'voar':{const p=t*TAU*4;s.fold=0;s.flap=.8*Math.sin(p)-.05;s.flex=.55*clamp(-Math.cos(p),0,1);s.bodyPitch=.06;s.bodyY=.8+.06*Math.sin(p+.6);s.tuck=1;s.tailFan=.4;s.headPitch=-.04;break;}
   case 'planar':{s.fold=0;s.flap=.14+.05*Math.sin(t*.9);s.flex=.04;s.bodyPitch=.0;s.tuck=1;s.tailFan=.5+.15*Math.sin(t*.7);s.tailPitch=.1*Math.sin(t*.5);s.sweep=.03*Math.sin(t*.6);s.headPitch=-.04;s.bodyY=.8;break;}
   case 'pousar':{const c=t%6,A=smooth(0,1,c);
    if(c<1.6){s.fold=0;s.flap=.14+.05*Math.sin(t*2);s.flex=.04;s.bodyPitch=lerp(0,.35,c/1.6);s.tuck=1;s.tailFan=.5;}
    else if(c<3.3){const u=(c-1.6)/1.7,p=u*TAU*2.2;s.fold=0;s.flap=lerp(.2,.95,smooth(0,.5,u))*Math.sin(p)+.1;s.flex=.5*clamp(-Math.cos(p),0,1);s.bodyPitch=lerp(.35,.85,smooth(0,.7,u));s.tuck=lerp(1,0,smooth(.3,.8,u));s.tailFan=lerp(.5,1,u);s.tailPitch=-.65*smooth(0,.8,u);s.headPitch=.2*u;}
    else if(c<4.0){const u=(c-3.3)/.7;s.fold=0;s.flap=.9*(1-u)*Math.sin(u*10)+.5*(1-u);s.bodyPitch=lerp(.85,.45,u);s.tuck=0;s.tailFan=1;s.tailPitch=-.5*(1-u);}
    else if(c<5.0){const u=(c-4.0)/1.0;s.fold=smooth(0,1,u);s.flap=.4*(1-u);s.bodyPitch=lerp(.45,.2,u);s.tuck=0;s.tailFan=lerp(1,.15,u);}
    else {s.fold=1;s.bodyPitch=.2;s.headPitch=.05*Math.sin(t*2);}
    break;}
   default:{s.headPitch=.05*Math.sin(t*.8);s.headYaw=.3*Math.sin(t*.5);s.tailPitch=.03*Math.sin(t*.9);}
  }
  apply();
 }
 apply();
 body.scale.setScalar(K);
 body.position.y=S.bodyY*K;
 if(opt.poleiro!==false){const per=new T.Mesh(new T.CylinderGeometry(.0045,.0052,.34,10),new T.MeshStandardMaterial({color:'#5b4030',roughness:1}));per.rotation.z=PI/2;per.position.set(0,-.0045,0);per.castShadow=true;per.receiveShadow=true;root.add(per);root.userData.perch=per;}
 const c=opt.camadas||{};
 const setLayers=(l)=>{for(const k of ['osso','musculo','pele','penas']){const on=k==='osso'||k==='musculo'?l[k]===true:l[k]!==false;LAY[k].forEach(n=>{n.visible=on;});}};
 setLayers(c);
 root.userData={especie:species,fase:stage,K,perch:root.userData.perch,api:{animate,apply,state:S,setLayers,root,body,free:FREE,wings,torso,K}};
 return root;
}
window.arcanoBirds={species:Object.keys(SPECIES),stages:Object.keys(STAGES),modes:['parado','bicar','bater','voar','planar','pousar'],make};
})();
