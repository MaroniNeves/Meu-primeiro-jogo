/* Pássaros desenhados pena por pena.
   window.arcanoBirds.make(especie, fase, {seed}) -> THREE.Group (de frente para +z, pés em y≈-0.93, escala em "corpos").
   Espécies: pardal, gaio, cardeal.  Fases: filhote (penugem), jovem, adulto.
   Cada pena é uma tira curva com raque central, barbas na textura, bordas dobradas e cor própria. */
(function(){
'use strict';
const T=window.THREE;if(!T)return;
const PI=Math.PI,TAU=PI*2;
const mkRng=sd=>{let s=(sd>>>0)||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};};
const V=(x,y,z)=>new T.Vector3(x,y,z);

/* ---------- texturas ---------- */
let BARB=null,DOWN=null;
function barbTex(){
 if(BARB)return BARB;const c=document.createElement('canvas');c.width=64;c.height=128;const g=c.getContext('2d');
 g.fillStyle='#e8e8e8';g.fillRect(0,0,64,128);
 for(let y=0;y<128;y+=2){for(const sg of [-1,1]){g.strokeStyle='rgba(0,0,0,'+(.05+((y*7)%5)*.015)+')';g.lineWidth=1;g.beginPath();g.moveTo(32,y);g.lineTo(32+sg*32,y-16+((y*13)%5));g.stroke();}}
 for(let i=0;i<160;i++){g.fillStyle='rgba(255,255,255,'+(.1+Math.random()*.15)+')';const x=Math.random()*64,y=Math.random()*128;g.fillRect(x,y,1,6+Math.random()*10);}
 const gr=g.createLinearGradient(0,0,0,128);gr.addColorStop(0,'rgba(0,0,0,.18)');gr.addColorStop(.25,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.08)');g.fillStyle=gr;g.fillRect(0,0,64,128);
 g.fillStyle='rgba(60,50,40,.6)';g.fillRect(31,0,2,128);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(30,0,1,128);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;BARB=t;return t;
}
function downTex(){
 if(DOWN)return DOWN;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
 g.translate(32,60);
 for(let i=0;i<46;i++){const a=-PI/2+(Math.random()-.5)*2.3,L=22+Math.random()*34,cu=(Math.random()-.5)*14;g.strokeStyle='rgba(255,255,255,'+(.55+Math.random()*.4)+')';g.lineWidth=1+Math.random()*1.6;g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(Math.cos(a)*L*.5+cu,Math.sin(a)*L*.5,Math.cos(a)*L,Math.sin(a)*L);g.stroke();}
 const gr=g.createRadialGradient(0,-14,0,0,-14,22);gr.addColorStop(0,'rgba(255,255,255,.95)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.arc(0,-14,22,0,6.3);g.fill();
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;DOWN=t;return t;
}
const mats={};
function featherMat(){return mats.f||(mats.f=new T.MeshStandardMaterial({map:barbTex(),vertexColors:true,roughness:.85,side:T.DoubleSide}));}
function downMat(){return mats.d||(mats.d=new T.MeshStandardMaterial({map:downTex(),vertexColors:true,alphaTest:.35,roughness:1,side:T.DoubleSide}));}

/* ---------- forma de uma pena (comprimento 1 em +y, largura 1 em x, curvatura em z) ---------- */
const FGEO={};
function featherShape(kind){
 if(FGEO[kind])return FGEO[kind];
 const rows=7,P=[],U=[],I=[];
 for(let r=0;r<=rows;r++){const t=r/rows;let w;
  if(kind==='flight')w=Math.pow(Math.sin(PI*Math.pow(t,.62)),.55)*(1-.3*t)*(.35+.65*Math.min(1,t*3));
  else if(kind==='tail')w=Math.pow(Math.sin(PI*Math.pow(t,.7)),.5)*(1-.15*t)*(.4+.6*Math.min(1,t*3));
  else w=(.16+.84*Math.sin(PI*Math.min(1,t*1.04)*Math.min(1,.86+.14*t)*.98))*Math.min(1,(1-t)*5+.35)*Math.sin(PI*Math.min(.99,.18+t*.82));
  w=Math.max(0,w);
  const bend=-.16*t*t,rid=.05;
  P.push(-w*.5,t,bend-.06*w*.5*1.6,0,t,bend+rid*Math.min(1,w*1.5),w*.5,t,bend-.06*w*.5*1.6);
  U.push(.5-w*.5,t,.5,t,.5+w*.5,t);}
 for(let r=0;r<rows;r++){const a=r*3,b=(r+1)*3;I.push(a,b,a+1,a+1,b,b+1,a+1,b+1,a+2,a+2,b+1,b+2);}
 return FGEO[kind]={P,U,I,n:P.length/3};
}

/* ---------- construtor de pássaro ---------- */
function Bird(R){
 const O={P:[],U:[],C:[],I:[]},D={P:[],U:[],C:[],I:[]};
 function add(kind,pos,a,n,len,wid,col,tw){
  const down=kind==='down',buf=down?D:O;
  a=a.clone().normalize();let s=new T.Vector3().crossVectors(a,n).normalize();const nn=new T.Vector3().crossVectors(s,a).normalize();
  if(tw){s.applyAxisAngle(a,tw);nn.applyAxisAngle(a,tw);}
  const base=buf.P.length/3;
  if(down){ // cartão de penugem: base em pos, cresce para fora, com tufos cruzados
   const hs=wid*.5;for(const [sx,sy] of [[-hs,0],[hs,0],[hs,len],[-hs,len]]){buf.P.push(pos.x+s.x*sx+a.x*sy,pos.y+s.y*sx+a.y*sy,pos.z+s.z*sx+a.z*sy);buf.C.push(col[0],col[1],col[2]);}
   buf.U.push(0,0,1,0,1,1,0,1);buf.I.push(base,base+1,base+2,base,base+2,base+3);return;}
  const G=featherShape(kind);
  for(let i=0;i<G.n;i++){const x=G.P[i*3]*wid,y=G.P[i*3+1]*len,z=G.P[i*3+2]*len;buf.P.push(pos.x+s.x*x+a.x*y+nn.x*z,pos.y+s.y*x+a.y*y+nn.y*z,pos.z+s.z*x+a.z*y+nn.z*z);
   const v=1+(G.P[i*3+2]*len>0?.05:-.04);buf.C.push(col[0]*v,col[1]*v,col[2]*v);buf.U.push(G.U[i*2],G.U[i*2+1]);}
  for(const q of G.I)buf.I.push(base+q);
 }
 function finish(parent){
  for(const [b,m,nm] of [[O,featherMat(),'Penas'],[D,downMat(),'Penugem']]){if(!b.P.length)continue;
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.P,3));g.setAttribute('uv',new T.Float32BufferAttribute(b.U,2));g.setAttribute('color',new T.Float32BufferAttribute(b.C,3));g.setIndex(b.I);g.computeVertexNormals();
   const me=new T.Mesh(g,m);me.name=nm;me.castShadow=true;me.receiveShadow=true;parent.add(me);}
 }
 return {add,finish,O,D};
}

/* ---------- pintura por espécie ---------- */
const clamp=v=>Math.max(0,Math.min(1,v));
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const hex=h=>{const n=parseInt(h.slice(1),16);return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255];};
const grey=(c,k)=>{const l=c[0]*.3+c[1]*.59+c[2]*.11;return mix(c,[l,l*.95,l*.85],k);};
const SPECIES={
 pardal:{ // pardal: costas pardo-estriadas, barriga clara, babador preto
  tail:1.0,crest:0,beak:{len:.22,r:.085,col:'#4a3d33',low:'#8a7a66'},leg:'#c78f6a',
  paint(reg,x,y,z,R,stage){
   let c;
   switch(reg){
    case 'crown':c=hex('#8a4a2a');break;
    case 'face':c=hex('#c9b79a');break;
    case 'mask':c=hex('#2a211b');break;
    case 'throat':c=stage==='adulto'?hex('#231d1a'):hex('#b9aa90');break;
    case 'breast':c=hex('#b8aea0');break;
    case 'belly':c=hex('#ded6c6');break;
    case 'back':c=hex('#7a5a3a');if(R()<.4)c=mix(c,hex('#2a1d14'),.65);break;
    case 'rump':c=hex('#8f7a5e');break;
    case 'cov':c=hex('#8d5f38');if(R()<.3)c=mix(c,hex('#f0e0c0'),.5);break;
    case 'primary':c=hex('#6e5640');break;
    case 'second':c=mix(hex('#6e4d34'),hex('#d9bf92'),R()*.45);break;
    case 'tail':c=hex('#6c5440');break;
    default:c=hex('#8a7358');}
   return c;}},
 gaio:{ // gaio-azul
  tail:1.25,crest:16,beak:{len:.34,r:.1,col:'#1b1b22',low:'#2a2a30'},leg:'#2a2a2c',
  paint(reg,x,y,z,R,stage){
   const blue=hex('#3f7bd1'),deep=hex('#27519c');let c;
   switch(reg){
    case 'crown':case 'crest':c=mix(blue,hex('#8cc0f4'),R()*.4);break;
    case 'face':c=hex('#e8ecf2');if(R()<.3)c=mix(c,blue,.35);break;
    case 'mask':c=hex('#1c1c24');break;
    case 'throat':c=hex('#f2f4f8');if(y<.12&&Math.abs(z)<.45)c=hex('#1c2230');break;
    case 'breast':c=hex('#dfe4ec');if(z>.1&&z<.25)c=hex('#1c2230');break;
    case 'belly':c=hex('#e8ebf0');break;
    case 'back':c=mix(blue,deep,R()*.45);break;
    case 'rump':c=mix(deep,blue,.5);break;
    case 'cov':c=R()<.28?hex('#ffffff'):mix(blue,deep,R()*.5);break;
    case 'primary':c=R()<.5?mix(deep,hex('#10151f'),.4):mix(blue,hex('#10151f'),.2);break;
    case 'second':c=R()<.6?hex('#f2f4f8'):mix(deep,blue,.4);break;
    case 'tail':c=R()<.55?mix(blue,deep,.4):hex('#10151f');break;
    default:c=blue;}
   return c;}},
 cardeal:{ // cardeal vermelho
  tail:1.3,crest:14,beak:{len:.3,r:.14,col:'#e8742a',low:'#e0642a'},leg:'#b88a7a',
  paint(reg,x,y,z,R,stage){
   const red=hex('#d4121f'),dr=hex('#9a0f1c');let c;
   switch(reg){
    case 'crown':case 'crest':c=mix(red,hex('#ef4a4a'),R()*.5);break;
    case 'face':c=red;break;
    case 'mask':c=hex('#17110f');break;
    case 'throat':c=hex('#17110f');break;
    case 'breast':c=mix(red,hex('#ee4040'),R()*.5);break;
    case 'belly':c=mix(red,hex('#e86a5a'),.35+R()*.3);break;
    case 'back':c=mix(red,dr,.35+R()*.3);break;
    case 'rump':c=red;break;
    case 'cov':c=mix(dr,red,R()*.4);break;
    case 'primary':c=mix(dr,hex('#6a2a2a'),.4);break;
    case 'second':c=mix(dr,hex('#8a4040'),R()*.5);break;
    case 'tail':c=mix(dr,hex('#6a1620'),.3+R()*.3);break;
    default:c=red;}
   return c;}}
};
const STAGES={
 filhote:{scale:.5,body:[.6,.58,.66],head:[.43,.41,.43],headC:[0,.46,.6],kind:'down',len:.3,wid:.34,tail:0,wing:'stub',beak:.65,eye:.1,tufts:0},
 jovem:{scale:.82,body:[.5,.5,.8],head:[.37,.35,.38],headC:[0,.52,.78],kind:'contour',len:.3,wid:.19,tail:.7,wing:'short',beak:.92,eye:.075,tufts:90},
 adulto:{scale:1,body:[.5,.5,.8],head:[.36,.34,.37],headC:[0,.53,.8],kind:'contour',len:.29,wid:.17,tail:1,wing:'full',beak:1,eye:.065,tufts:0}
};
// stage.name usado pela pintura
function colorFor(sp,stage,reg,p,R){
 let c=sp.paint(reg,p.x,p.y,p.z,R,stage==='adulto'?'adulto':stage);
 if(stage==='filhote'){const base=mix(hex('#cdbb9a'),c,.22);c=mix(base,[1,1,1],.12+R()*.12);}
 else if(stage==='jovem'){c=grey(mix(c,hex('#8a7a62'),.25),.4);if(R()<.3)c=mix(c,hex('#f0e4c8'),.4);}
 const sh=.82+.18*clamp((p.y+.5)/1.1);return c.map(v=>clamp(v*sh*(.92+R()*.14)));
}

function fib(n,i){const y=1-2*(i+.5)/n,r=Math.sqrt(1-y*y),a=i*2.399963;return V(Math.cos(a)*r,y,Math.sin(a)*r);}

function make(species,stage,opt){
 opt=opt||{};const sp=SPECIES[species],st=STAGES[stage];if(!sp||!st)return null;
 const R=mkRng((opt.seed||1)*131+species.length*17+stage.length*7),B=Bird(R),g=new T.Group();g.name='Pássaro '+species+' '+stage;
 const body=new T.Group();g.add(body);
 const S=st.scale,[bx,by,bz]=st.body,[hx,hy,hz]=st.head,hc=V(...st.headC);
 const downOnly=st.kind==='down';
 // ---- corpo e cabeça: penas em escamas sobre elipsoides, apontando para trás ----
 function cover(center,rx,ry,rz,n,len,wid,kindFn,regFn,lean){
  for(let i=0;i<n;i++){const d=fib(n,i);d.x+=(R()-.5)*.06;d.y+=(R()-.5)*.06;d.z+=(R()-.5)*.06;d.normalize();
   const pos=center.clone().add(V(d.x*rx,d.y*ry,d.z*rz)),nrm=V(d.x/rx,d.y/ry,d.z/rz).normalize();
   let a=V(0,-.35,-1);a.addScaledVector(nrm,-a.dot(nrm));if(a.lengthSq()<1e-4)a=V(0,0,-1);a.normalize();
   a.add(V((R()-.5)*.45,(R()-.5)*.3,(R()-.5)*.3)).normalize();
   const l=lean+R()*.18;a=a.clone().multiplyScalar(Math.cos(l)).addScaledVector(nrm,Math.sin(l)).normalize();
   const reg=regFn(pos,d),col=colorFor(sp,stage,reg,pos,R),k=kindFn(pos,d);
   B.add(k,pos,a,nrm,len*(.8+R()*.4),wid*(.85+R()*.3),col,(R()-.5)*.6);}
 }
 const regBody=(p)=>p.y>.0?(p.z<-.4?'rump':'back'):(p.z>.3?'breast':'belly');
 const regHead=(p)=>{const rel=p.clone().sub(hc);if(rel.z>hz*.45&&Math.abs(rel.x)<hx*.7&&rel.y<hy*.2)return rel.y<-hy*.35?'throat':'mask';if(rel.y>hy*.4)return 'crown';return 'face';};
 const dn=downOnly?'down':'contour';
 const nb=downOnly?620:560,nh=downOnly?300:260;
 cover(V(0,0,0),bx,by,bz,nb,st.len*(downOnly?1:1),st.wid,()=>dn,regBody,.28);
 cover(V(0,0,0),bx*.97,by*.97,bz*.97,Math.round(nb*.35),st.len*.9,st.wid*.9,()=>dn,regBody,.4);
 cover(hc,hx,hy,hz,nh,st.len*.55,st.wid*.55,()=>dn,regHead,.3);
 // chaminhas de penugem que sobram no jovem (cabeça, barriga, nuca)
 for(let i=0;i<st.tufts;i++){const d=fib(st.tufts,i),useHead=i%2===0,c0=useHead?hc:V(0,0,0),r3=useHead?[hx,hy,hz]:[bx,by,bz];if(!useHead&&d.y>0)d.y*=-.3;
  const pos=c0.clone().add(V(d.x*r3[0],d.y*r3[1],d.z*r3[2])),nrm=V(d.x,d.y,d.z).normalize();
  B.add('down',pos,nrm.clone().add(V(0,.3,-.4)).normalize(),nrm,.22,.2,mix(hex('#cdbb9a'),[1,1,1],.3),0);}
 // ---- cauda ----
 const tailN=downOnly?0:(species==='pardal'?10:12);
 for(let i=0;i<tailN;i++){const f=(i-(tailN-1)/2)/((tailN-1)/2),th=f*.42,len=(1.05+.1*(1-Math.abs(f)))*sp.tail*st.tail;
  const a=V(Math.sin(th),-.14-.04*Math.abs(f),-Math.cos(th)),n=V(0,1,0);
  const pos=V(0,.02+.012*i%2,-bz*.78);
  B.add('tail',pos,a,n,len,.34,colorFor(sp,stage,'tail',pos,R),f*.12);}
 if(downOnly)for(let i=0;i<14;i++){B.add('down',V((R()-.5)*.2,.02,-bz*.82),V((R()-.5)*.5,.1,-1),V(0,1,0),.3,.22,hex('#cdbb9a'),0);}
 // ---- asas ----
 for(const sg of [-1,1]){
  const sh=V(sg*bx*.92,.2,.22);
  if(st.wing==='stub'){for(let i=0;i<7;i++){ // cotoco de asa com canetas (penas em formação)
    const pos=sh.clone().add(V(sg*.02,-.03*i,-.05*i)),a=V(sg*.35,-.18,-1).normalize(),n=V(sg,.3,0).normalize();
    B.add('flight',pos,a,n,.2+i*.012,.1,mix(hex('#cdbb9a'),[.5,.45,.38],.5),0);
    B.add('down',pos.clone().add(a.clone().multiplyScalar(.18)),a.clone().add(V(0,.4,0)).normalize(),n,.14,.14,[.95,.9,.8],0);}
   continue;}
  const wl=st.wing==='short'?.72:1,np=9,ns=8;
  for(let i=0;i<np;i++){const t=i/(np-1),pos=sh.clone().add(V(sg*(.03+.014*i),-.02-.024*i,-.04*i)),a=V(sg*(.05+.03*t),-.1-.05*t,-1).normalize(),n=V(sg,.4,0).normalize(),len=(.78+.18*Math.sin(PI*(1-t)*.85+.2))*wl*(species==='pardal'?.85:1);
   B.add('flight',pos,a,n,len*(.9+.1*t),.17,colorFor(sp,stage,'primary',pos,R),sg*.08*(t-.5));}
  for(let i=0;i<ns;i++){const t=i/(ns-1),pos=sh.clone().add(V(sg*(.07+.01*i),.1-.02*i,.2-.1*i*.5)),a=V(sg*(.04),-.07-.02*t,-1).normalize(),n=V(sg,.55,0).normalize();
   B.add('flight',pos,a,n,.58*wl*(1-.12*t),.19,colorFor(sp,stage,'second',pos,R),0);}
  for(let row=0;row<3;row++)for(let i=0;i<7;i++){const t=i/6,pos=sh.clone().add(V(sg*(.1+.02*row),.18-.09*row,.3-.58*t*(1-.1*row)+.08*row)),a=V(sg*.03,-.12,-1).normalize(),n=V(sg,.7,0).normalize();
   B.add('contour',pos,a,n,.28*(1-.2*row)*(wl>.8?1:.85),.15,colorFor(sp,stage,'cov',pos,R),(R()-.5)*.4);}
 }
 // ---- crista ----
 if(!downOnly&&sp.crest)for(let i=0;i<sp.crest;i++){const t=i/(sp.crest-1),pos=hc.clone().add(V((R()-.5)*.18,hy*.7,-hz*.05-t*hz*.55)),a=V((R()-.5)*.15,1,-.35-t*.6).normalize();
  B.add('flight',pos,a,V(0,.2,1).normalize(),(.3+.12*(1-t))*(stage==='jovem'?.75:1),.1,colorFor(sp,stage,'crest',pos,R),0);}
 B.finish(body);
 // ---- bico, olhos, pernas ----
 const solid=(c,r)=>new T.MeshStandardMaterial({color:c,roughness:r||.6});
 const bk=sp.beak,bl=bk.len*st.beak,br=bk.r*(downOnly?1.15:1)*(stage==='jovem'?1.05:1);
 const bpos=hc.clone().add(V(0,-hy*.08,hz*.9));
 const upper=new T.Mesh(new T.ConeGeometry(br,bl,14),solid(bk.col,.4));upper.rotation.x=PI/2;upper.position.copy(bpos).add(V(0,br*.2,bl*.5));upper.scale.set(1,1,.78);upper.castShadow=true;body.add(upper);
 const lower=new T.Mesh(new T.ConeGeometry(br*.78,bl*.82,12),solid(bk.low,.4));lower.rotation.x=PI/2;lower.position.copy(bpos).add(V(0,-br*.38,bl*.4));lower.scale.set(1,1,.6);body.add(lower);
 if(downOnly){for(const sg of [-1,1]){const gp=new T.Mesh(new T.SphereGeometry(br*.5,10,8),solid('#f2c14a',.6));gp.position.copy(bpos).add(V(sg*br*.9,-br*.15,-.02));gp.scale.set(.7,.6,1);body.add(gp);}}
 else if(stage==='jovem'){for(const sg of [-1,1]){const gp=new T.Mesh(new T.SphereGeometry(br*.35,8,6),solid('#e8c060',.6));gp.position.copy(bpos).add(V(sg*br*.85,-br*.2,-.01));body.add(gp);}}
 for(const sg of [-1,1]){const d=V(sg*.8,.22,.5).normalize(),ep=hc.clone().add(V(d.x*hx*1.02,d.y*hy*1.02,d.z*hz*1.02));
  const eye=new T.Mesh(new T.SphereGeometry(st.eye,16,12),solid('#0c0a0a',.15));eye.position.copy(ep);body.add(eye);
  const hl=new T.Mesh(new T.SphereGeometry(st.eye*.3,8,6),new T.MeshBasicMaterial({color:'#ffffff'}));hl.position.copy(ep).add(V(sg*st.eye*.2,st.eye*.35,st.eye*.7));body.add(hl);
  const lid=new T.Mesh(new T.TorusGeometry(st.eye*1.05,st.eye*.18,6,16),solid(stage==='filhote'?'#d79a8a':'#d8c8b0',.8));lid.position.copy(ep).add(V(sg*st.eye*.08,0,st.eye*.1));lid.lookAt(ep.clone().add(V(d.x,d.y,d.z)));body.add(lid);}
 const lc=solid(sp.leg,.7);
 for(const sg of [-1,1]){const top=V(sg*bx*.4,-by*.82,.05),foot=V(sg*bx*.45,-.9,.1);
  const tarsus=new T.Mesh(new T.CylinderGeometry(.028*(downOnly?1.3:1),.034*(downOnly?1.3:1),top.distanceTo(foot),7),lc);tarsus.position.copy(top).add(foot).multiplyScalar(.5);tarsus.lookAt(foot);tarsus.rotateX(PI/2);body.add(tarsus);
  for(const [ang,L] of [[-.4,.26],[0,.3],[.4,.26],[PI,.2]]){const to=foot.clone().add(V(Math.sin(ang)*L,0,Math.cos(ang)*L)),toe=new T.Mesh(new T.CylinderGeometry(.016,.024,foot.distanceTo(to),6),lc);toe.position.copy(foot).add(to).multiplyScalar(.5);toe.lookAt(to);toe.rotateX(PI/2);body.add(toe);
   const claw=new T.Mesh(new T.ConeGeometry(.02,.07,5),solid('#2b2420',.5));claw.position.copy(to);claw.lookAt(to.clone().add(V(Math.sin(ang),-.3,Math.cos(ang))));claw.rotateX(PI/2);body.add(claw);}}
 // poleiro
 const per=new T.Mesh(new T.CylinderGeometry(.08,.09,3.4,10),solid('#5b4030',1));per.rotation.z=PI/2;per.position.set(0,-.95,.1);per.castShadow=true;per.receiveShadow=true;g.add(per);
 body.scale.setScalar(S);body.position.y=.95*S-.95*S*0;
 per.scale.setScalar(S);per.position.y=-.95*S+.95*S;
 // alinha para que o poleiro fique em y=0
 g.position.y=0;body.position.y=.95*S;per.position.y=0;
 g.userData={especie:species,fase:stage};
 return g;
}
window.arcanoBirds={species:Object.keys(SPECIES),stages:Object.keys(STAGES),make};
})();
