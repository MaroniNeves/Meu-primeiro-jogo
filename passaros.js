/* Pássaros construídos em camadas anatômicas: esqueleto -> fibras musculares -> pele -> penas (uma a uma).
   window.arcanoBirds.make(especie, fase, {seed, camadas:{osso,musculo,pele,penas}, poleiro}) -> THREE.Group em METROS
   (de frente para +z, pés em y=0). Adulto: pardal ~16 cm, cardeal ~21 cm, gaio ~26 cm de bico à cauda.
   Fases: filhote (penugem, cabeça grande, asas em formação), jovem (adulto menor, cauda curta, penugem restante), adulto. */
(function(){
'use strict';
const T=window.THREE;if(!T)return;
const PI=Math.PI,TAU=PI*2;
const mkRng=sd=>{let s=(sd>>>0)||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};};
const V=(x,y,z)=>new T.Vector3(x,y,z);
const clamp=v=>Math.max(0,Math.min(1,v));
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const hex=h=>{const n=parseInt(h.slice(1),16);return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255];};
const lerp=(a,b,t)=>a+(b-a)*t;

/* ---------- texturas das penas ---------- */
let BARB=null,DOWN=null;
function barbTex(){
 if(BARB)return BARB;const c=document.createElement('canvas');c.width=64;c.height=128;const g=c.getContext('2d');
 g.fillStyle='#ececec';g.fillRect(0,0,64,128);
 for(let y=0;y<128;y+=2){for(const sg of [-1,1]){g.strokeStyle='rgba(0,0,0,'+(.06+((y*7)%5)*.012)+')';g.lineWidth=1;g.beginPath();g.moveTo(32,y);g.lineTo(32+sg*32,y-18+((y*13)%5));g.stroke();}}
 for(let i=0;i<200;i++){g.fillStyle='rgba(255,255,255,'+(.1+Math.random()*.15)+')';g.fillRect(Math.random()*64,Math.random()*128,1,6+Math.random()*12);}
 const gr=g.createLinearGradient(0,0,0,128);gr.addColorStop(0,'rgba(0,0,0,.22)');gr.addColorStop(.3,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.06)');g.fillStyle=gr;g.fillRect(0,0,64,128);
 g.fillStyle='rgba(60,50,40,.55)';g.fillRect(31,0,2,128);g.fillStyle='rgba(255,255,255,.4)';g.fillRect(30,0,1,128);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;BARB=t;return t;
}
function downTex(){
 if(DOWN)return DOWN;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.translate(32,60);
 for(let i=0;i<50;i++){const a=-PI/2+(Math.random()-.5)*2.4,L=24+Math.random()*34,cu=(Math.random()-.5)*14;g.strokeStyle='rgba(255,255,255,'+(.55+Math.random()*.4)+')';g.lineWidth=1+Math.random()*1.6;g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(Math.cos(a)*L*.5+cu,Math.sin(a)*L*.5,Math.cos(a)*L,Math.sin(a)*L);g.stroke();}
 const gr=g.createRadialGradient(0,-14,0,0,-14,22);gr.addColorStop(0,'rgba(255,255,255,.95)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.arc(0,-14,22,0,6.3);g.fill();
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;DOWN=t;return t;
}
const mats={};
const featherMat=()=>mats.f||(mats.f=new T.MeshStandardMaterial({map:barbTex(),vertexColors:true,roughness:.8,side:T.DoubleSide}));
const downMat=()=>mats.d||(mats.d=new T.MeshStandardMaterial({map:downTex(),vertexColors:true,alphaTest:.35,roughness:1,side:T.DoubleSide}));

/* forma de uma pena: comprimento 1 (y), largura 1 (x), curvatura e raque em z */
const FGEO={};
function featherShape(kind){
 if(FGEO[kind])return FGEO[kind];
 const rows=7,P=[],U=[],I=[];
 for(let r=0;r<=rows;r++){const t=r/rows;let w;
  if(kind==='flight')w=Math.pow(Math.sin(PI*Math.pow(t,.6)),.55)*(1-.28*t)*(.3+.7*Math.min(1,t*3));
  else if(kind==='tail')w=Math.pow(Math.sin(PI*Math.pow(t,.7)),.5)*(1-.12*t)*(.4+.6*Math.min(1,t*3));
  else w=(.2+.8*Math.sin(PI*Math.min(1,t*1.05)*.98))*Math.sin(PI*Math.min(.99,.2+t*.8));
  w=Math.max(0,w);const bend=-.14*t*t,rid=.05;
  P.push(-w*.5,t,bend-.05*w,0,t,bend+rid*Math.min(1,w*1.5),w*.5,t,bend-.05*w);U.push(.5-w*.5,t,.5,t,.5+w*.5,t);}
 for(let r=0;r<rows;r++){const a=r*3,b=(r+1)*3;I.push(a,b,a+1,a+1,b,b+1,a+1,b+1,a+2,a+2,b+1,b+2);}
 return FGEO[kind]={P,U,I,n:P.length/3};
}

/* ---------- acumuladores de malha ---------- */
function Buf(){return {P:[],C:[],U:[],I:[]};}
function bufMesh(b,mat,name,shadow){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.P,3));g.setAttribute('color',new T.Float32BufferAttribute(b.C,3));if(b.U.length)g.setAttribute('uv',new T.Float32BufferAttribute(b.U,2));g.setIndex(b.I);g.computeVertexNormals();const m=new T.Mesh(g,mat);m.name=name;m.castShadow=!!shadow;m.receiveShadow=true;return m;}
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

/* ---------- espécies ---------- */
const SPECIES={
 pardal:{k:.05,tail:.82,crest:0,skin:'#d9a8a0',beak:{len:.3,r:.1,col:'#4a3d33',low:'#9a8a70'},leg:'#c99a78',
  paint(reg,R){let c;switch(reg){
   case 'crown':c=hex('#8a4a2a');break;case 'face':c=hex('#c9b79a');break;case 'mask':c=hex('#2a211b');break;
   case 'throat':c=hex('#231d1a');break;case 'breast':c=hex('#b8aea0');break;case 'belly':c=hex('#dcd4c4');break;
   case 'back':c=hex('#7a5a3a');if(R()<.4)c=mix(c,hex('#2a1d14'),.65);break;case 'rump':c=hex('#8f7a5e');break;
   case 'cov':c=hex('#8d5f38');if(R()<.3)c=mix(c,hex('#f0e0c0'),.5);break;case 'primary':c=hex('#6e5640');break;
   case 'second':c=mix(hex('#6e4d34'),hex('#d9bf92'),R()*.45);break;case 'tail':c=hex('#6c5440');break;default:c=hex('#8a7358');}return c;}},
 gaio:{k:.072,tail:1.25,crest:14,skin:'#cfd0d6',beak:{len:.4,r:.11,col:'#1b1b22',low:'#2a2a30'},leg:'#2a2a2c',
  paint(reg,R){const blue=hex('#3f7bd1'),deep=hex('#27519c');let c;switch(reg){
   case 'crown':case 'crest':c=mix(blue,hex('#8cc0f4'),R()*.4);break;case 'face':c=hex('#e8ecf2');if(R()<.3)c=mix(c,blue,.35);break;
   case 'mask':c=hex('#1c1c24');break;case 'throat':c=hex('#f2f4f8');break;case 'collar':c=hex('#1c2230');break;
   case 'breast':c=hex('#dfe4ec');break;case 'belly':c=hex('#e8ebf0');break;case 'back':c=mix(blue,deep,R()*.45);break;
   case 'rump':c=mix(deep,blue,.5);break;case 'cov':c=R()<.28?hex('#ffffff'):mix(blue,deep,R()*.5);break;
   case 'primary':c=R()<.5?mix(deep,hex('#10151f'),.4):mix(blue,hex('#10151f'),.2);break;
   case 'second':c=R()<.6?hex('#f2f4f8'):mix(deep,blue,.4);break;case 'tail':c=R()<.55?mix(blue,deep,.4):hex('#10151f');break;default:c=blue;}return c;}},
 cardeal:{k:.06,tail:1.12,crest:12,skin:'#c9908c',beak:{len:.32,r:.15,col:'#e8742a',low:'#e0642a'},leg:'#b88a7a',
  paint(reg,R){const red=hex('#d4121f'),dr=hex('#9a0f1c');let c;switch(reg){
   case 'crown':case 'crest':c=mix(red,hex('#ef4a4a'),R()*.5);break;case 'face':c=red;break;case 'mask':c=hex('#17110f');break;
   case 'throat':c=hex('#17110f');break;case 'breast':c=mix(red,hex('#ee4040'),R()*.5);break;case 'belly':c=mix(red,hex('#e86a5a'),.3+R()*.3);break;
   case 'back':c=mix(red,dr,.35+R()*.3);break;case 'rump':c=red;break;case 'cov':c=mix(dr,red,R()*.4);break;
   case 'primary':c=mix(dr,hex('#6a2a2a'),.4);break;case 'second':c=mix(dr,hex('#8a4040'),R()*.5);break;
   case 'tail':c=mix(dr,hex('#6a1620'),.3+R()*.3);break;default:c=red;}return c;}}
};
const STAGES={
 filhote:{kscale:.62,head:1.75,bodyW:1.38,bodyH:1.3,wing:.32,tail:0,keel:.5,neck:.82,beak:.62,eye:.085,contour:false,tufts:0},
 jovem:{kscale:.9,head:1.1,bodyW:1.04,bodyH:1.0,wing:.92,tail:.62,keel:.9,neck:1,beak:.92,eye:.065,contour:true,tufts:70},
 adulto:{kscale:1,head:1,bodyW:1,bodyH:1,wing:1,tail:1,keel:1,neck:1,beak:1,eye:.06,contour:true,tufts:0}
};
function tint(sp,stage,reg,R,p){
 let c=sp.paint(reg,R);
 if(stage==='filhote'){c=mix(mix(hex('#cdbb9a'),c,.22),[1,1,1],.12+R()*.12);}
 else if(stage==='jovem'){const l=c[0]*.3+c[1]*.59+c[2]*.11;c=mix(mix(c,hex('#8a7a62'),.25),[l,l*.95,l*.85],.4);if(R()<.3)c=mix(c,hex('#f0e4c8'),.4);}
 const sh=.84+.16*clamp((p.y+.45)/1.2);return c.map(v=>clamp(v*sh*(.93+R()*.12)));
}

/* ---------- perfil do corpo (unidade = comprimento do tronco; z para a frente) ---------- */
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

function make(species,stage,opt){
 opt=opt||{};const sp=SPECIES[species],st=STAGES[stage];if(!sp||!st)return null;
 const R=mkRng((opt.seed||1)*131+species.length*17+stage.length*7),root=new T.Group();root.name='Pássaro '+species+' '+stage;
 const K=sp.k*st.kscale;
 const body=new T.Group();root.add(body);
 const prof=profile(st);
 const skinAt=(z,th)=>{
  const w=interp(prof.W,z),t=interp(prof.Tp,z),b=interp(prof.Bt,z),yc=(t+b)/2,hh=(t-b)/2,n=2.3,c=Math.cos(th),s=Math.sin(th);
  const ex=Math.sign(c)*Math.pow(Math.abs(c),2/n),ey=Math.sign(s)*Math.pow(Math.abs(s),2/n);
  return V(w*ex,yc+hh*ey,z);
 };
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

 /* ===== 1) ESQUELETO ===== */
 const bone=new T.Group();bone.name='Esqueleto';body.add(bone);
 {const B=Buf(),ivory=hex('#ebe3cf'),ivD=hex('#cfc4a8'),bt=(pts,r,sd)=>tube(B,pts,r,ivory,sd||6);
  const h=st.head,hcY=.6;
  sphere(B,V(0,hcY+.02,1.28),[.15*h,.13*h,.17*h],ivory,10);
  for(const sg of [-1,1]){sphere(B,V(sg*.115*h,hcY+.05,1.36),[.045*h,.045*h,.02],ivD,6);}
  bt([V(0,hcY-.01,1.42),V(0,hcY-.02,1.5),V(0,hcY-.04,1.46+sp.beak.len*st.beak*.55)],[.05*h,.036,.01],6);
  bt([V(0,hcY-.07,1.4),V(0,hcY-.09,1.5),V(0,hcY-.1,1.44+sp.beak.len*st.beak*.45)],[.03*h,.022,.008],5);
  const spine=[V(0,hcY-.03,1.14),V(0,.62,1.0),V(0,.58,.84),V(0,.46,.7),V(0,.42,.55),V(0,.4,.3),V(0,.38,.0),V(0,.34,-.3),V(0,.3,-.55),V(0,.26,-.8)];
  bt(spine,[.03,.026,.03,.034,.034,.034,.034,.03,.022,.012],7);
  for(let i=0;i<spine.length-1;i++){const a=spine[i],b=spine[i+1];for(let k=0;k<3;k++){const p=a.clone().lerp(b,k/3);sphere(B,p,[.034,.034,.03],ivD,5);}}
  for(const sg of [-1,1])for(let i=0;i<7;i++){const z=.52-i*.11,top=V(sg*.04,.4,z),mid=V(sg*(.27-i*.006),.12,z-.02),low=V(sg*(.12),-.16-.02*(i>3?0:i*.01),z-.07);bt([top,mid,low],[.012,.012,.01],4);}
  {const kt=st.keel,pts=[V(0,-.12,.64),V(0,-.2*kt-.06,.5),V(0,-.4*kt-.05,.2),V(0,-.32*kt-.04,-.15),V(0,-.2,-.3)];bt(pts,[.02,.024,.02,.016,.01],5);
   for(let i=0;i<pts.length-1;i++)for(const sg of [-1,1]){bt([V(sg*.05,-.1,pts[i].z),V(sg*.08,-.14,pts[i].z-.04)],[.012,.01],4);}}
  for(const sg of [-1,1]){bt([V(sg*.3,.2,.5),V(sg*.2,-.02,.6),V(0,-.12,.66)],[.014,.012,.012],5);
   bt([V(sg*.3,.2,.5),V(sg*.16,-.04,.56),V(sg*.07,-.12,.5)],[.02,.02,.016],5);
   bt([V(sg*.3,.24,.46),V(sg*.26,.3,.15),V(sg*.2,.32,-.12)],[.018,.014,.008],5);}
  for(const sg of [-1,1])bt([V(sg*.05,.34,-.15),V(sg*.19,.24,-.28),V(sg*.12,.18,-.55)],[.04,.04,.02],5);
  const wing=(sg)=>{const S=V(sg*.3,.2,.48),E=V(sg*.38,.08,-.05),Wr=V(sg*.39,.2,.4);
   const ws=st.wing,e2=S.clone().lerp(E,ws),w2=e2.clone().lerp(Wr,ws>.5?1:.7);
   bt([S,S.clone().lerp(E,.5).add(V(sg*.02,.02,0)),e2],[.026,.022,.02],6);
   bt([e2,e2.clone().lerp(w2,.5).add(V(sg*.015,0,.03)),w2],[.016,.015,.012],5);bt([e2,e2.clone().lerp(w2,.5).add(V(sg*-.005,-.01,.03)),w2],[.01,.01,.008],4);
   const tip=w2.clone().add(V(sg*-.02,-.06*ws,-.46*ws));bt([w2,w2.clone().lerp(tip,.5),tip],[.014,.012,.008],5);
   return {S,E:e2,Wr:w2,Tp:tip};};
  body.userData.wings=[wing(1),wing(-1)];
  for(const sg of [-1,1]){const hip=V(sg*.17,.02,-.18),knee=V(sg*.21,-.17,.12),ank=V(sg*.2,-.45,-.08),foot=V(sg*.2,-.72,.02);
   bt([hip,knee],[.028,.022],5);bt([knee,knee.clone().lerp(ank,.5).add(V(0,0,-.03)),ank],[.022,.014,.012],5);
   bt([ank,foot],[.012,.01],5);
   for(const [ang,L] of [[-.45,.3],[0,.34],[.45,.3],[PI,.22]]){bt([foot,foot.clone().add(V(Math.sin(ang)*L*.5,-.01,Math.cos(ang)*L*.5)),foot.clone().add(V(Math.sin(ang)*L,-.02,Math.cos(ang)*L))],[.01,.008,.006],4);}}
  bone.add(bufMesh(B,new T.MeshStandardMaterial({vertexColors:true,roughness:.55}),'Ossos',true));
 }

 /* ===== 2) FIBRAS MUSCULARES ===== */
 const musc=new T.Group();musc.name='Músculos';body.add(musc);
 {const B=Buf(),base=hex('#a23535'),dark=hex('#7e2424'),pale=hex('#c2605a');
  const fibers=(orig,ins,n,bulge,r,spread)=>{for(let i=0;i<n;i++){const t=i/(n-1),o=orig(t),e=ins(t).add(V((R()-.5)*spread,(R()-.5)*spread,(R()-.5)*spread)),m=o.clone().lerp(e,.5+(R()-.5)*.1).add(bulge(t)),c=mix(base,R()<.5?dark:pale,R()*.45);
    tube(B,[o,m,e],[r*.7,r,r*.6],c,4,3);}};
  const kt=st.keel;
  for(const sg of [-1,1]){
   fibers(t=>V(sg*.05,-.3*kt-.02-.08*t*(1-t),lerp(.58,-.2,t)),t=>V(sg*.31,.14,.44+(.04*t)),Math.round(10+44*st.wing),t=>V(sg*.1,-.05+.06*Math.sin(t*PI),0),.013,.02);
   fibers(t=>V(sg*.03,-.22*kt,lerp(.5,.05,t)),t=>V(sg*.3,.18,.46),22,t=>V(sg*.04,-.02,0),.011,.015);
   fibers(t=>V(sg*.07,.38,lerp(.55,-.5,t)),t=>V(sg*.1,.3,lerp(.4,-.62,t)),12,t=>V(sg*.07,.02,0),.01,.02);
   fibers(t=>V(sg*.05,.5+.06*t,lerp(1.1,.75,t)),t=>V(sg*.08,.4,lerp(.7,.5,t)),12,t=>V(sg*.04,.02,0),.009,.015);
   fibers(t=>V(sg*.17,.08,-.16+.05*t),t=>V(sg*.21,-.2,.1+.02*t),16,t=>V(sg*.05,0,-.03),.015,.02);
   fibers(t=>V(sg*.21,-.2,.1),t=>V(sg*.2,-.43,-.08),12,t=>V(sg*.03,0,-.05),.01,.012);
   fibers(t=>V(sg*.3,.22,.48),t=>V(sg*.37,.1,-.02+.02*t),10,t=>V(sg*.03,.02,0),.01,.01);
   fibers(t=>V(sg*.37,.1,-.05),t=>V(sg*.39,.2,.38),8,t=>V(sg*.02,.01,.03),.008,.01);}
  for(const sg of [-1,1])fibers(t=>V(sg*.12*st.head,.6,1.25),t=>V(sg*.05,.52,1.38),8,t=>V(sg*.02,0,0),.008,.01);
  musc.add(bufMesh(B,new T.MeshStandardMaterial({vertexColors:true,roughness:.5}),'Fibras',true));
 }

 /* ===== 3) PELE ===== */
 const skinG=new T.Group();skinG.name='Pele';body.add(skinG);
 const skinCol=hex(sp.skin),SKIN=stage==='filhote'?mix(skinCol,hex('#e8a0a0'),.5):skinCol;
 {const B=Buf(),NZ=44,NT=28,z0=1.55,z1=-.84;
  for(let i=0;i<=NZ;i++){const z=lerp(z0,z1,i/NZ);for(let j=0;j<=NT;j++){const p=skinAt(z,j/NT*TAU);B.P.push(p.x,p.y,p.z);B.C.push(SKIN[0],SKIN[1],SKIN[2]);}}
  for(let i=0;i<NZ;i++)for(let j=0;j<NT;j++){const q=i*(NT+1)+j;B.I.push(q,q+1,q+NT+1,q+1,q+NT+2,q+NT+1);}
  skinG.add(bufMesh(B,new T.MeshStandardMaterial({vertexColors:true,roughness:.7,side:T.DoubleSide}),'Pele',true));}
 {const sm=(c,r)=>new T.MeshStandardMaterial({color:c,roughness:r||.5});
  const bk=sp.beak,bl=bk.len*st.beak,br=bk.r*(stage==='filhote'?1.1:1),h=st.head,bz=1.42,by=.6-.02;
  const up=new T.Mesh(new T.ConeGeometry(br*.62*h,bl,14),sm(bk.col,.35));up.rotation.x=PI/2;up.position.set(0,by+br*.05,bz+bl*.5);up.scale.set(1,1,.8);up.castShadow=true;skinG.add(up);
  const lo=new T.Mesh(new T.ConeGeometry(br*.5*h,bl*.82,12),sm(bk.low,.35));lo.rotation.x=PI/2;lo.position.set(0,by-br*.28,bz+bl*.4);lo.scale.set(1,1,.6);skinG.add(lo);
  if(stage!=='adulto')for(const sg of [-1,1]){const gp=new T.Mesh(new T.SphereGeometry(br*.32,8,6),sm(stage==='filhote'?'#f2c14a':'#e8c060',.6));gp.position.set(sg*br*.5*h,by-br*.1,bz-.01);skinG.add(gp);}
  for(const sg of [-1,1]){const ep=V(sg*.15*h,.65,1.34),eye=new T.Mesh(new T.SphereGeometry(st.eye*(stage==='filhote'?1.25:1),16,12),sm('#0c0a0a',.12));eye.position.copy(ep);skinG.add(eye);
   const hl=new T.Mesh(new T.SphereGeometry(st.eye*.3,8,6),new T.MeshBasicMaterial({color:'#fff'}));hl.position.copy(ep).add(V(sg*.012,.02,.03));skinG.add(hl);
   const lid=new T.Mesh(new T.TorusGeometry(st.eye*1.1,st.eye*.2,6,16),sm(stage==='filhote'?'#d79a8a':'#d8c8b0',.8));lid.position.copy(ep).add(V(sg*.005,0,.005));lid.lookAt(ep.clone().add(V(sg,.1,.4)));skinG.add(lid);}
  for(const sg of [-1,1]){const ank=V(sg*.2,-.45,-.08),foot=V(sg*.2,-.72,.02),B=Buf();
   tube(B,[ank,foot],[.014,.011],hex(sp.leg),6,3);for(let k=0;k<5;k++){const p=ank.clone().lerp(foot,(k+.5)/5);sphere(B,p,[.016,.012,.016],mix(hex(sp.leg),[0,0,0],.15),5);}
   for(const [ang,L] of [[-.45,.3],[0,.34],[.45,.3],[PI,.22]]){const to=foot.clone().add(V(Math.sin(ang)*L,-.02,Math.cos(ang)*L));tube(B,[foot,foot.clone().lerp(to,.5).add(V(0,.01,0)),to],[.011,.009,.007],hex(sp.leg),5,3);
    const claw=new T.Mesh(new T.ConeGeometry(.012,.07,5),sm('#2b2420',.5));claw.position.copy(to).add(V(Math.sin(ang)*.03,-.01,Math.cos(ang)*.03));claw.lookAt(to.clone().add(V(Math.sin(ang),-.4,Math.cos(ang))));claw.rotateX(PI/2);skinG.add(claw);}
   sphere(B,V(sg*.2,-.2,.0),[.1,.19,.12],SKIN,8);tube(B,[V(sg*.2,-.3,-.02),ank],[.03,.016],SKIN,6,3);
   skinG.add(bufMesh(B,new T.MeshStandardMaterial({vertexColors:true,roughness:.7}),'Perna',true));}
 }

 /* ===== 4) PENAS ===== */
 const fg=new T.Group();fg.name='Penas';body.add(fg);
 {const O=Buf(),D=Buf();
  const add=(kind,pos,a,n,len,wid,col,tw)=>{const down=kind==='down',buf=down?D:O;a=a.clone().normalize();let s=new T.Vector3().crossVectors(a,n).normalize();const nn=new T.Vector3().crossVectors(s,a).normalize();
   if(tw){s.applyAxisAngle(a,tw);nn.applyAxisAngle(a,tw);}const b0=buf.P.length/3;
   if(down){const hs=wid*.5;for(const [sx,sy] of [[-hs,0],[hs,0],[hs,len],[-hs,len]]){buf.P.push(pos.x+s.x*sx+a.x*sy,pos.y+s.y*sx+a.y*sy,pos.z+s.z*sx+a.z*sy);buf.C.push(col[0],col[1],col[2]);}buf.U.push(0,0,1,0,1,1,0,1);buf.I.push(b0,b0+1,b0+2,b0,b0+2,b0+3);return;}
   const G=featherShape(kind);for(let i=0;i<G.n;i++){const x=G.P[i*3]*wid,y=G.P[i*3+1]*len,z=G.P[i*3+2]*len;buf.P.push(pos.x+s.x*x+a.x*y+nn.x*z,pos.y+s.y*x+a.y*y+nn.y*z,pos.z+s.z*x+a.z*y+nn.z*z);
    const v=1+(G.P[i*3+2]*len>0?.05:-.04);buf.C.push(col[0]*v,col[1]*v,col[2]*v);buf.U.push(G.U[i*2],G.U[i*2+1]);}
   for(const q of G.I)buf.I.push(b0+q);};
  const kd=st.contour?'contour':'down';
  const rowsZ=[];for(let z=1.5;z>-.84;z-=(z>1.1?.05:.07))rowsZ.push(z);
  for(let layer=0;layer<2;layer++)for(const z of rowsZ){
   const zz=z-(layer?.035:0),circ=Math.PI*2*(interp(prof.W,zz)+(interp(prof.Tp,zz)-interp(prof.Bt,zz))/2)*.85,nAround=Math.max(8,Math.round(circ/(zz>1.1?.085:.1)));
   for(let j=0;j<nAround;j++){const th=(j+(layer?.5:0)+(R()-.5)*.2)/nAround*TAU,p=skinAt(zz,th),n=normAt(zz,th),pn=skinAt(zz-.05,th);
    let a=pn.clone().sub(p).normalize();a.y-=.05;a.normalize();
    const lean=(zz>1.0?.16:.1)+R()*.06,ar=a.clone().multiplyScalar(Math.cos(lean)).addScaledVector(n,Math.sin(lean)).normalize();
    const reg=regionAt(zz,th,p),col=tint(sp,stage,reg,R,p);
    const len=(zz>1.1?.2:zz>.8?.3:zz>-.3?.36:.42)*(st.contour?1:1.15),wid=len*.62;
    add(kd,p,ar,n,len,wid,col,(R()-.5)*.3);}}
  for(let i=0;i<st.tufts;i++){const z=R()<.5?lerp(1.3,1.0,R()):lerp(.3,-.2,R()),th=R()<.5?-PI/2+(R()-.5)*1.4:PI/2+(R()-.5)*2,p=skinAt(z,th),n=normAt(z,th);add('down',p,n.clone().add(V(0,.2,-.5)).normalize(),n,.2,.16,mix(hex('#cdbb9a'),[1,1,1],.3),0);}
  for(const sg of [-1,1])for(let i=0;i<40;i++){const a0=i*2.399963,yy=1-2*(i+.5)/40,rr=Math.sqrt(1-yy*yy),d=V(Math.cos(a0)*rr,yy,Math.sin(a0)*rr),c0=V(sg*.2,-.2,.0),pos=c0.clone().add(V(d.x*.1,d.y*.19,d.z*.12));
   add(kd,pos,V(sg*.04,-1,-.25),d,.2,.12,tint(sp,stage,'belly',R,pos),(R()-.5)*.3);}
  const tailN=st.tail>0?(species==='pardal'?10:12):0,tl=sp.tail*st.tail;
  for(let i=0;i<tailN;i++){const f=(i-(tailN-1)/2)/((tailN-1)/2),th=f*.32,len=(.62+.1*(1-Math.abs(f)))*tl*1.25,a=V(Math.sin(th),-.07-.03*Math.abs(f),-Math.cos(th)),pos=V(0,.2+.01*(i%2),-.8);
   add('tail',pos,a,V(0,1,0),len,.26,tint(sp,stage,'tail',R,pos),f*.1);}
  if(!st.tail)for(let i=0;i<14;i++)add('down',V((R()-.5)*.1,.22,-.84),V((R()-.5)*.5,.1,-1),V(0,1,0),.22,.16,hex('#cdbb9a'),0);
  const wings=body.userData.wings;
  wings.forEach((W,wi)=>{const sg=wi===0?1:-1,ws=st.wing,n=V(sg,.38,0).normalize();
   if(ws<.5){for(let i=0;i<7;i++){const pos=W.Wr.clone().lerp(W.Tp,i/7).add(V(sg*.02,-.02*i,0));add('flight',pos,V(sg*.18,-.1,-1),n,.28+.02*i,.1,mix(hex('#cdbb9a'),[.5,.45,.38],.5),0);add('down',pos.clone().add(V(0,0,-.2)),V(0,.4,-1),n,.18,.16,[.95,.9,.8],0);}return;}
   for(let i=0;i<10;i++){const t=i/9,pos=W.Wr.clone().lerp(W.Tp,t*.9).add(V(sg*(.03+.006*i),-.01*i,0)),a=V(sg*(.04+.05*t),-.06-.05*t,-1),len=(.85+.2*Math.sin(PI*(1-t)*.8+.2))*ws*(species==='pardal'?.85:1);
    add('flight',pos,a,n,len*(.9+.1*t),.2,tint(sp,stage,'primary',R,pos),sg*.06*(t-.5));}
   for(let i=0;i<9;i++){const t=i/8,pos=W.E.clone().lerp(W.Wr,t).add(V(sg*.055,.03,0)),a=V(sg*.03,-.04,-1);
    add('flight',pos,a,V(sg,.5,0).normalize(),(.62-.1*t)*ws,.22,tint(sp,stage,'second',R,pos),0);}
   for(let i=0;i<4;i++){const pos=W.S.clone().lerp(W.E,i/3).add(V(sg*.07,.07,0));add('contour',pos,V(sg*.02,-.05,-1),V(sg,.6,0).normalize(),.36*ws,.2,tint(sp,stage,'second',R,pos),0);}
   for(let row=0;row<3;row++){const cnt=9-row*2;for(let i=0;i<cnt;i++){const t=i/(cnt-1),pos=W.S.clone().lerp(W.Wr,t*.9).add(V(sg*(.085+.012*row),.1-.06*row,-.06*row));
     add('contour',pos,V(sg*.02,-.1,-1),V(sg,.65,0).normalize(),(.32-.07*row)*Math.max(.6,ws),.18,tint(sp,stage,'cov',R,pos),(R()-.5)*.3);}}
  });
  if(st.contour&&sp.crest)for(let i=0;i<sp.crest;i++){const t=i/(sp.crest-1),pos=V((R()-.5)*.12,.78,lerp(1.28,1.02,t)),a=V((R()-.5)*.1,1,-.3-t*.7).normalize();add('flight',pos,a,V(0,.2,1).normalize(),(.26+.1*(1-t))*(stage==='jovem'?.7:1),.1,tint(sp,stage,'crest',R,pos),0);}
  fg.add(bufMesh(O,featherMat(),'Penas',true));if(D.P.length)fg.add(bufMesh(D,downMat(),'Penugem',true));
 }

 body.scale.setScalar(K);
 body.rotation.x=-.2;body.position.y=.8*K;
 if(opt.poleiro!==false){const per=new T.Mesh(new T.CylinderGeometry(.0045,.0052,.34,10),new T.MeshStandardMaterial({color:'#5b4030',roughness:1}));per.rotation.z=PI/2;per.position.set(0,-.0045,0);per.castShadow=true;per.receiveShadow=true;root.add(per);}
 const c=opt.camadas||{};bone.visible=c.osso===true;musc.visible=c.musculo===true;skinG.visible=c.pele!==false;fg.visible=c.penas!==false;
 root.userData={especie:species,fase:stage,layers:{osso:bone,musculo:musc,pele:skinG,penas:fg},K};
 return root;
}
window.arcanoBirds={species:Object.keys(SPECIES),stages:Object.keys(STAGES),make};
})();
