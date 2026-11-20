/* Pássaros de floresta em estilo anime (formas simples e arredondadas, cores chapadas).
   - BANDINHOS NO CHÃO: 3 a 5 passarinhos ciscam numa clareira: dão pulinhos, bicam o chão, olham em volta.
     Se alguém chega perto (ou um deles se assusta), todos levantam voo e se escondem na copa da árvore
     mais próxima. Quando o lugar fica calmo de novo, saem da árvore e descem planando para o mesmo ponto.
   - REVOADA: um grupo voa em formação lá no alto, batendo asas e planando, sempre em volta de quem joga.
   - À noite todos dormem nas árvores.
   Cada pássaro: corpo, cabeça, bico, olhos com brilho, cauda em leque, patas e asas de duas partes
   (braço e ponta) que batem com a ponta atrasada. Seis espécies de cor. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const PI=Math.PI,TAU=PI*2;
const mobile=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||innerWidth<680;
const rr=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const angTo=(a,b)=>((b-a+PI)%TAU+TAU)%TAU-PI;

// espécies: costas, barriga, asa, bico
const SPECIES=[
 {n:'pardal',back:'#8a5a34',belly:'#efe2c8',wing:'#5e3c22',beak:'#e8b23a',cap:'#6a4226'},
 {n:'azulão',back:'#2f6fd6',belly:'#f2f6ff',wing:'#1d4a9c',beak:'#f0c040',cap:'#2459b8'},
 {n:'sabiá',back:'#7a6a58',belly:'#e8873a',wing:'#55483a',beak:'#f0c040',cap:'#6a5a4a'},
 {n:'canário',back:'#f4cf2e',belly:'#fff3a8',wing:'#c79a14',beak:'#f08a3a',cap:'#f4cf2e'},
 {n:'cardeal',back:'#d8362c',belly:'#f6efe6',wing:'#9c2018',beak:'#f0a03a',cap:'#e8483c',crest:true},
 {n:'periquito',back:'#3fb24a',belly:'#d8f08a',wing:'#2a8436',beak:'#f0b040',cap:'#58c85c'}];

function kit(Merger){
 const mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.7,side:T.DoubleSide});
 const shapeGeo=(pts)=>{const sh=new T.Shape();pts.forEach(([x,y],i)=>i?sh.lineTo(x,y):sh.moveTo(x,y));const g=new T.ShapeGeometry(sh);g.rotateX(PI/2);return g;}; // (x,y) -> (x,0,y): y = para a frente
 const made=SPECIES.map(sp=>{
  const B=Merger();
  // corpo com barriga clara
  {const g=new T.SphereGeometry(1,16,12).toNonIndexed(),p=g.attributes.position,col=new Float32Array(p.count*3),a=new T.Color(sp.back),b=new T.Color(sp.belly),c=new T.Color();
   for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=clamp((-y+.1+z*.25)/.5,0,1);c.copy(a).lerp(b,k*k*(3-2*k));
    p.setXYZ(i,x*.3*(1-.25*Math.max(0,-z)),.42+y*.28,z*.48-.02);col.set([c.r,c.g,c.b],i*3);}
   g.setAttribute('color',new T.BufferAttribute(col,3));B.add(g);}
  // cabeça (topo da cor do "boné", bochecha clara)
  {const g=new T.SphereGeometry(.235,14,10).toNonIndexed(),p=g.attributes.position,col=new Float32Array(p.count*3),a=new T.Color(sp.cap),b=new T.Color(sp.belly),c=new T.Color();
   for(let i=0;i<p.count;i++){const y=p.getY(i),z=p.getZ(i),k=clamp((-y+.02+z*.3)/.14,0,1);c.copy(a).lerp(b,k);col.set([c.r,c.g,c.b],i*3);p.setXYZ(i,p.getX(i),p.getY(i)+.67,p.getZ(i)+.33);}
   g.setAttribute('color',new T.BufferAttribute(col,3));B.add(g);}
  if(sp.crest)for(let k=0;k<3;k++)B.limb([0,.85,.3-k*.07],[0,1.02-k*.04,.14-k*.1],.05,sp.cap,.012);
  // bico, olhos com brilho
  {const g=new T.ConeGeometry(.075,.2,8);g.rotateX(PI/2);g.translate(0,.645,.63);B.add(g,sp.beak);}
  for(const s of [-1,1]){B.ball(s*.155,.71,.45,.05,'#101014');B.ball(s*.175,.73,.475,.017,'#ffffff');}
  // asa dobrada no corpo, patas e dedos
  for(const s of [-1,1]){B.ball(s*.27,.45,-.08,.2,sp.wing,.28,.9,1.9);
   B.limb([s*.1,.2,-.02],[s*.1,.02,.0],.022,'#c98a3a',.018);for(const a of [-.5,0,.5])B.limb([s*.1,.02,0],[s*.1+Math.sin(a)*.11,.012,Math.cos(a)*.11],.014,'#c98a3a',.01);B.limb([s*.1,.02,0],[s*.1,.012,-.08],.014,'#c98a3a',.01);}
  // cauda em leque (3 penas)
  for(const a of [-.28,0,.28]){const g=shapeGeo([[-.07,0],[.07,0],[.09,-.5],[0,-.58],[-.09,-.5]]);g.rotateY(a);g.rotateX(-.18);g.translate(0,.42,-.4);B.add(g,a?sp.wing:sp.back);}
  const body=B.build();
  // asa aberta: braço e ponta, com a borda de trás recortada em "penas"
  const W1=Merger();W1.add(shapeGeo([[0,.2],[.5,.24],[.5,-.2],[.42,-.27],[.34,-.21],[.25,-.29],[.16,-.22],[.08,-.28],[0,-.2]]),sp.wing);
  W1.add(shapeGeo([[0,.2],[.5,.24],[.5,.1],[0,.06]]).translate(0,.004,0),sp.back);
  const W2=Merger();W2.add(shapeGeo([[0,.24],[.3,.25],[.56,.14],[.66,-.02],[.56,-.12],[.5,-.05],[.42,-.2],[.34,-.11],[.24,-.27],[.14,-.18],[.06,-.28],[0,-.2]]),sp.wing);
  W2.add(shapeGeo([[0,.24],[.3,.25],[.5,.17],[.3,.12],[0,.1]]).translate(0,.004,0),sp.back);
  return {body,w1:W1.build(),w2:W2.build()};});
 return {make(k0){const k=k0!=null?k0:(Math.random()*SPECIES.length)|0,P=made[k],g=new T.Group(),inner=new T.Group();g.add(inner);const size=rr(.2,.27);inner.scale.setScalar(size);
   inner.add(new T.Mesh(P.body,mat));const wings=[];
   for(const s of [-1,1]){const root=new T.Group();root.position.set(s*.25,.53,.04);root.scale.x=s;inner.add(root);root.add(new T.Mesh(P.w1,mat));const tip=new T.Group();tip.position.x=.5;root.add(tip);tip.add(new T.Mesh(P.w2,mat));root.visible=false;wings.push({s,root,tip});}
   return {g,inner,wings,size,ph:rr(0,TAU),sp:SPECIES[k].n};}};
}

/* ---------- asas e corujas (fora do install para a enciclopédia dos bichos também usar) ---------- */
function wingsFly(b,flap,t){for(const w of b.wings){w.root.visible=true;const a=flap?.12+.8*Math.sin(t):.14+.05*Math.sin(t*.2),c=flap?.55*Math.sin(t-1.0):-.1;w.root.rotation.z=w.s*a;w.tip.rotation.z=c;}}
function wingsFold(b){for(const w of b.wings)w.root.visible=false;}
/* ---------- coruja (pele única) ----------
   Corpo em forma de pera e cabeça redonda saem de UMA malha contínua (mesma técnica da pele dos cervos).
   O pescoço tem uma corrente de 4 ossos: a cabeça gira até ~155° e a torção se reparte entre eles, sem amassar.
   Peças à parte (com contorno): olhos, pálpebras, bico em gancho, tufos das orelhas, asas dobradas em camadas,
   cauda de penas, dedos com garras. Medidas em "unidades de coruja" (pés em y=0, de frente para +z). */
const OWL_PAL=[
 {n:'Marrom',back:'#7a5536',dark:'#5a3b24',belly:'#ecd0aa',spot:'#c9a47a',face:'#f0d4ae',rim:'#6a4429',wing:'#6e4a2e',cov:'#a07148',leg:'#e6bea2'},
 {n:'Cinza', back:'#7d7973',dark:'#57534e',belly:'#e8e3d8',spot:'#bdb6aa',face:'#efe9dd',rim:'#55524d',wing:'#6c6862',cov:'#a39d93',leg:'#ddccbc'},
 {n:'Ruiva', back:'#a2602c',dark:'#77401a',belly:'#f2d3a4',spot:'#d8a46c',face:'#f5dcb4',rim:'#7a3f18',wing:'#93531f',cov:'#c98242',leg:'#ecc19c'}];
const OWL_NECK=.86;   // altura da base do pescoço (onde a torção começa)
const owlInk=new T.MeshBasicMaterial({color:'#1e1a22',side:T.BackSide});
owlInk.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed+=normal*.018;');};
owlInk.customProgramCacheKey=()=>'owl-ink-v1';
function owlKitBuild(Merger){
 const mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.88});
 const sg=(pts)=>{const sh=new T.Shape();pts.forEach(([x,y],i)=>i?sh.lineTo(x,y):sh.moveTo(x,y));const g=new T.ShapeGeometry(sh);g.rotateX(PI/2);return g;};
 return OWL_PAL.map(P=>{const C=h=>{const c=new T.Color(h);return [c.r,c.g,c.b];},mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
  const sst=t=>{t=clamp(t,0,1);return t*t*(3-2*t);},gr=(c,x,y,z)=>{const v=.95+.06*Math.sin(x*53+y*41+z*37);return [c[0]*v,c[1]*v,c[2]*v];};
  const back=C(P.back),dark=C(P.dark),belly=C(P.belly),spot=C(P.spot),face=C(P.face),rim=C(P.rim),wing=C(P.wing),cov=C(P.cov),leg=C(P.leg);
  // pesos da pele: abaixo do pescoço = corpo (osso 0); no pescoço a torção se reparte entre os ossos 1..3; acima = cabeça (osso 4)
  const chain=(x,y)=>{const s=clamp((y-(OWL_NECK-.06))/.2,0,1)*4,i=Math.min(3,Math.floor(s)),f=s-i;return s>=4?[[4,1]]:[[i,1-f],[i+1,f]];};
  const bodyCol=(x,y,z,nx,ny,nz)=>{
   const fr=sst((nz-.05)/.55)*sst((.92-y)/.1);let c=mix(back,belly,fr);
   if(fr>.5&&Math.sin(x*38+y*9)*Math.sin(y*44-x*6)>.72)c=mix(c,spot,.7);                    // pintinhas na barriga
   const jag=.83+.018*Math.sin(x*46);if(y>jag-.04&&y<jag+.03&&nz>.25)c=mix(c,belly,.6);      // babador claro sob o rosto
   if(y<.2)c=mix(c,leg,.6);return gr(c,x,y,z);};
  const headCol=(x,y,z,nx,ny,nz)=>{
   let c=back;const r=Math.hypot(x/.25,(y-1.0)/.23);
   if(nz>.12){if(r<.92)c=face;else if(r<1.1)c=rim;}
   if(ny>.55&&nz<.6)c=mix(c,dark,.45);                                                       // alto da cabeça mais escuro
   if(y<.9&&nz>.3)c=mix(c,belly,.5);
   return gr(c,x,y,z);};
  const prims=[],K=window.arcanoPele;
  const add=(p,k,col,sc)=>prims.push({...p,bone:0,k,col,sc,sb:.05,reach:.12,boneFn:chain});
  const corpoP=[K.tubePrim([[0,.15,-.1],[0,.36,-.06],[0,.6,.02],[0,.78,.06],[0,.92,.05]],[[.14,.16],[.21,.27],[.225,.28],[.215,.25],[.21,.215]],{n:20,ca:.3,cb:.2}),K.ellPrim(0,.42,.07,.18,.27,.23),K.ellPrim(0,.4,-.2,.15,.21,.21)];
  add(corpoP[0],.02,bodyCol);add(corpoP[1],.08,bodyCol);add(corpoP[2],.08,bodyCol);   // tronco, barriga, garupa
  // meia-largura do corpo na altura y / posição z (a asa dobrada encosta aqui)
  const sdfC=(x,y,z)=>K.smin(K.smin(corpoP[0].sdf(x,y,z),corpoP[1].sdf(x,y,z),.08),corpoP[2].sdf(x,y,z),.08);
  const largura=(y,z)=>{if(sdfC(0,y,z)>0)return 0;let a=0,b=.5;for(let i=0;i<18;i++){const m=(a+b)/2;if(sdfC(m,y,z)<0)a=m;else b=m;}return a;};
  add(K.ellPrim(0,1.03,.08,.3,.28,.28),.12,headCol);             // cabeça redonda (une com o corpo sem pescoço visível)
  for(const s of [-1,1])add(K.tubePrim([[s*.09,.26,.03],[s*.11,.13,.06],[s*.11,.03,.08]],[[.075,.075],[.062,.062],[.046,.046]],{n:8,ca:0,cb:.25}),.05,(x,y,z)=>gr(leg,x,y,z));   // pernas emplumadas
  const skin=K.skinGeometry(prims,(/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||innerWidth<680)?.026:.018);
  // ---- peças da cabeça (coordenadas do osso da cabeça: corpo menos a base do pescoço) ----
  const hy=-OWL_NECK,B=K.Builder,ink=[];
  const eyes=B();for(const s of [-1,1]){
   eyes.ell(s*.105,1.02+hy,.242,.078,.08,.06,'#2a1d16',null,18);                                 // contorno do olho
   eyes.ell(s*.105,1.02+hy,.25,.071,.073,.06,'#0c0a0b',null,18);                               // olho grande
   eyes.ell(s*.128,1.05+hy,.302,.016,.016,.01,'#ffffff',null,8);eyes.ell(s*.09,.99+hy,.306,.008,.008,.006,'#ffffff',null,6);}   // brilhos
  const beak=B();beak.sweep([[0,.99+hy,.298],[0,.955+hy,.34],[0,.905+hy,.33]],[[.036,.03],[.026,.022],[.004,.004]],{n:10,m:10,ca:0,cb:.1},'#4a3b30');
  const tufts=B();for(const s of [-1,1])for(const [ox,oy,oz,tx,ty,tz,w] of [[.16,1.19,.04,.24,1.42,.02,.07],[.21,1.16,-.01,.31,1.35,-.04,.06],[.11,1.21,.01,.15,1.38,-.01,.055]])
   tufts.sweep([[s*ox,oy+hy,oz],[s*(ox+tx)/2,(oy+ty)/2+hy,(oz+tz)/2+.01],[s*tx,ty+hy,tz]],[[w,.02],[w*.6,.016],[.004,.004]],{n:10,m:10,ca:0,cb:.12},null,(x,y)=>y>1.32+hy?C(P.dark):back);
  const lid=B();lid.ell(0,-.113,0,.083,.113,.072,null,()=>mix(face,rim,.45),16);lid.ell(0,-.224,.006,.07,.005,.06,'#2a1d16',null,10);   // pálpebra + cílios
  // ---- cauda ----
  const tail=B();for(let i=-2;i<=2;i++)tail.sweep([[i*.04,.36,-.2],[i*.05,.24,-.36],[i*.065,.13,-.5]],[[.045,.012],[.05,.012],[.02,.008]],{n:10,m:8,ca:0,cb:.25},null,(x,y,z)=>gr(Math.sin(y*45)>.55?mix(wing,cov,.6):mix(wing,dark,.3),x,y,z));
  // ---- dedos com garras ----
  const feet=B();for(const s of [-1,1]){const bx=s*.11;
   for(const a of [-.38,0,.38]){const ex=bx+Math.sin(a)*.13,ez=.08+Math.cos(a)*.13;feet.sweep([[bx,.03,.08],[ (bx+ex)/2,.03,(.08+ez)/2],[ex,.02,ez]],[[.028,.022],[.022,.018],[.017,.014]],{n:8,m:10,ca:.2,cb:.2},null,()=>leg);
    feet.sweep([[ex,.022,ez],[ex+Math.sin(a)*.03,.012,ez+Math.cos(a)*.03],[ex+Math.sin(a)*.04,-.005,ez+Math.cos(a)*.035]],[[.012,.01],[.008,.007],[.002,.002]],{n:6,m:8,ca:0,cb:.2},'#1c1716');}
   feet.sweep([[bx,.03,.07],[bx,.025,0],[bx,.02,-.05]],[[.024,.02],[.02,.017],[.016,.014]],{n:6,m:10,ca:.2,cb:.2},null,()=>leg);
   feet.sweep([[bx,.02,-.05],[bx,.01,-.08],[bx,-.005,-.085]],[[.011,.009],[.007,.006],[.002,.002]],{n:6,m:8,ca:0,cb:.2},'#1c1716');}
  // ---- asa (uma só: com volume, presa ao ombro; dobrada fica na lateral do corpo, aberta é a asa de voo) ----
  // Desenhada aberta: o braço vai do ombro (x=0) ao punho (x=ARM) ao longo de +x, as penas apontam para trás (-z),
  // a face de cima é +y. Penas são elipsoides achatados (têm volume e contorno).
  const ARM=.34,hx=(c1,c2,t)=>'#'+new T.Color(c1).lerp(new T.Color(c2),t).getHexString(),c3=h=>{const c=new T.Color(h);return [c.r,c.g,c.b];};
  const penaGeo=(len,w,th,cor,barras)=>{const Bd=B();pena(Bd,0,0,0,len,w,th,0,cor,barras);return Bd.build();};
  const pena=(Bd,x,y,z,len,w,th,ang,cor,barras)=>{const g=new T.SphereGeometry(1,14,8);g.scale(w*.5,th,len*.5);g.translate(0,0,-len*.5);g.rotateY(ang);g.translate(x,y,z);
   const dx=-Math.sin(ang),dz=-Math.cos(ang),base=c3(cor),bar=c3(hx(cor,P.belly,.45));
   const ponta=c3(hx(cor,P.dark,.55));Bd.add(g,null,null,barras?(px,py,pz)=>{const t=((px-x)*dx+(pz-z)*dz)/len;return Math.sin(t*PI*2*barras)>.82&&t>.12?bar:base;}:(px,py,pz)=>{const t=((px-x)*dx+(pz-z)*dz)/len;return t>.8?ponta:base;});};
  const arm=B(),armCov=B(),hand=B(),dk=P.dark,wg=P.wing,cv1=hx(P.cov,P.wing,.35),cv2=P.cov,cv3=hx(P.cov,P.wing,.2);
  arm.sweep([[0,0,.18],[ARM*.5,.008,.195],[ARM,0,.185]],[[.035,.04],[.032,.036],[.03,.032]],{n:10,m:12,ca:.3,cb:.2},cv3);          // bordo de ataque grosso (o "braço")
  // penas do braço também giram: abertas = bordo de trás da asa de voo; dobradas = apontam para trás e para baixo (asa em gota até a cauda)
  const lequeArm=[];
  for(let i=0;i<7;i++)lequeArm.push({geo:penaGeo(.5-i*.033,.115,.016,i%2?wg:dk,2),x:.01+i*.052,y:-.004-i*.002,z:.06,aberta:-.05+i*.015,fechada:.8-i*.045,tinta:1});                               // secundárias
  for(let i=0;i<7;i++)lequeArm.push({geo:penaGeo(.24-i*.012,.105,.012,cv1,0),x:i*.053,y:.022,z:.13,aberta:-.06+i*.015,fechada:.75-i*.04});                                                 // coberteiras grandes
  for(let i=0;i<8;i++)lequeArm.push({geo:penaGeo(.14,.09,.01,cv2,0),x:i*.047,y:.034,z:.18,aberta:-.02+i*.01,fechada:.7-i*.03});                                                   // coberteiras médias
  hand.sweep([[0,0,.18],[.12,.005,.17],[.22,0,.14]],[[.022,.022],[.019,.019],[.013,.013]],{n:8,m:12,ca:.2,cb:.3},cv3);
  const leque=[];   // {geo,x,y,z,aberta,fechada}: aberta = leque da asa de voo; fechada = quase paralelas (asa dobrada)
  for(let i=0;i<7;i++)leque.push({geo:penaGeo(.44+i*.035,.085,.014,i%2?dk:wg,3),x:.02+i*.032,y:-.006-i*.003,z:.1-i*.01,aberta:-.25-i*.19,fechada:-1.38-i*.02});   // primárias
  for(let i=0;i<6;i++)leque.push({geo:penaGeo(.12,.07,.01,cv1,0),x:i*.04,y:.02,z:.15-i*.008,aberta:-.3-i*.2,fechada:-1.42-i*.015,some:1});
  for(let i=0;i<5;i++)leque.push({geo:penaGeo(.08,.06,.009,cv2,0),x:i*.04,y:.034,z:.18-i*.01,aberta:-.2-i*.18,fechada:-1.42-i*.015,some:1});

  const SH=[.2,.8,.1],TIP=[.0,.17,-.66];
  const asaNova=()=>{const NU=40,NT=36,Pp=new Float32Array((NU+1)*NT*3),Cc=new Float32Array((NU+1)*NT*3),PF=new Float32Array((NU+1)*NT*3),I=[],cc=new T.Color();
   const W=new T.Color(P.wing).lerp(new T.Color(P.cov),.22),CV=new T.Color(P.cov),DK=new T.Color(P.dark),BL=new T.Color(P.belly),ss=x=>x*x*(3-2*x);
   for(let i=0;i<=NU;i++)for(let j=0;j<NT;j++){const u=i/NU,cv=.5-.5*Math.cos(j/NT*TAU),o=(i*NT+j)*3;
    if(cv<.5){const row=Math.floor(cv/.165),lc=(cv%.165)/.165;cc.copy(CV).lerp(W,Math.min(1,row*.3));if(lc>.74+.14*Math.abs(Math.sin(u*PI*7+row*1.3)))cc.lerp(DK,.45);}
    else{cc.copy(W);if(u>.35&&Math.sin(cv*58)>.78)cc.lerp(BL,.3);if(((u*9)%1)<.09)cc.multiplyScalar(.8);if(cv>.86)cc.lerp(DK,.45);}
    Cc[o]=cc.r;Cc[o+1]=cc.g;Cc[o+2]=cc.b;}
   for(let i=0;i<NU;i++)for(let j=0;j<NT;j++){const a=i*NT+j,b=i*NT+(j+1)%NT,d=(i+1)*NT+j,e=(i+1)*NT+(j+1)%NT;I.push(a,b,d,b,e,d);}
   // dobrada: folha arredondada que sai do ombro e desce até a ponta da cauda, encostada no corpo
   for(let i=0;i<=NU;i++){const u=i/NU,su=Math.sin(PI*u),Oy=-.05*u,Oz=-.32*u,Dy=TIP[1]-SH[1]-Oy,Dz=TIP[2]-SH[2]-Oz,DL=Math.hypot(Dy,Dz),ny=-Dz/DL,nz=Dy/DL,Lf=.93+.07*u;
    for(let j=0;j<NT;j++){const th=j/NT*TAU,cv=.5-.5*Math.cos(th),side=Math.sin(th),o=(i*NT+j)*3,bo=(.08*(1-u)-.03*u)*Math.pow(Math.sin(PI*Math.min(1,cv*1.05)),.8);
     const my=Oy+Dy*cv*Lf-ny*bo,mz=Oz+Dz*cv*Lf-nz*bo,hx=largura(my+SH[1],mz+SH[2]),t=.03*Math.pow(su,.45)*(1-.7*cv)*side;
     PF[o]=Math.max(hx,.05)+.03-SH[0]+t;PF[o+1]=my;PF[o+2]=mz;}}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(Pp,3));g.setAttribute('color',new T.BufferAttribute(Cc,3));g.setIndex(I);g.userData.k=-1;
   g.pose=(k,bd)=>{bd=bd||0;if(Math.abs(k-g.userData.k)<.002&&Math.abs(bd-(g.userData.bd||0))<.004)return;g.userData.k=k;g.userData.bd=bd;const sk=ss(Math.max(0,Math.min(1,k))),f=1-sk;
    for(let i=0;i<=NU;i++){const u=i/NU,su=Math.sin(PI*u),an=1.1*Math.pow(u,1.6),cx=Math.sin(an),cz=-Math.cos(an),Ox=.46*u,Oz=.03-.06*u*u,L=(.3+.13*u)*(.8+.2*Math.min(1,u*4))*(1+.07*Math.sqrt(Math.abs(Math.sin(u*PI*8))))*(1-sk*.25*ss(Math.max(0,Math.min(1,(u-.74)/.14)))*Math.pow(1-Math.abs(Math.sin(u*PI*9)),2.5));
     for(let j=0;j<NT;j++){const th=j/NT*TAU,cv=.5-.5*Math.cos(th),side=Math.sin(th),o=(i*NT+j)*3,t=.034*Math.pow(su,.45)*(1-.75*cv)*side;
      let x=Ox+cx*L*cv,y=.012*su+t,z=Oz+cz*L*cv;if(bd&&u>.3){const w=ss(Math.min(1,(u-.3)/.45))*bd,ca=Math.cos(w),sa=Math.sin(w),dx=x-.2;x=.2+dx*ca-y*sa;y=dx*sa+y*ca;}
      Pp[o]=PF[o]*f+x*sk+Math.sin(PI*sk)*.05;Pp[o+1]=PF[o+1]*f+y*sk;Pp[o+2]=PF[o+2]*f+z*sk;}}
    g.attributes.position.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();};
   g.pose(0);return g;};
  return {P,mat,skin,asaNova,SH,eyes:eyes.build(),beak:beak.build(),tufts:tufts.build(),lid:lid.build(),arm:arm.build(),hand:hand.build(),leque,lequeArm,tail:tail.build(),feet:feet.build()};});
}
function makeOwlFrom(owlKit,k){const P=owlKit[k!=null?k:(Math.random()*owlKit.length)|0],g=new T.Group(),inner=new T.Group();g.add(inner);inner.scale.setScalar(rr(.42,.5));
 const withInk=(geo,m)=>{const me=new T.Mesh(geo,m||P.mat);me.castShadow=true;me.add(new T.Mesh(geo,owlInk));return me;};
 // esqueleto: corpo → 3 ossos de torção do pescoço → cabeça
 const body=new T.Bone(),n1=new T.Bone(),n2=new T.Bone(),n3=new T.Bone(),hb=new T.Bone();n1.position.set(0,OWL_NECK,.05);body.add(n1);n1.add(n2);n2.add(n3);n3.add(hb);inner.add(body);
 const skin=new T.SkinnedMesh(P.skin,P.mat),ink=new T.SkinnedMesh(P.skin,owlInk);skin.castShadow=true;inner.add(skin,ink);inner.updateMatrixWorld(true);
 const sk=new T.Skeleton([body,n1,n2,n3,hb]);skin.bind(sk);ink.bind(sk,skin.bindMatrix);
 hb.add(new T.Mesh(P.eyes,P.mat),withInk(P.beak));
 const lids=[];for(const s of [-1,1]){const l=new T.Group();l.position.set(s*.105,1.02-OWL_NECK+.124,.25);l.scale.y=.2;l.visible=false;const lm=new T.Mesh(P.lid,P.mat);l.add(lm);hb.add(l);lids.push(l);}
 body.add(withInk(P.tail),withInk(P.feet));
 // asas: o jogo mexe em "root"/"tip" (visível = voando, rotation.z = batida); a asa de verdade segue isso dobrando/abrindo
 const wings=[],asas=[],qF=new T.Quaternion(),qO=new T.Quaternion(),qT=new T.Quaternion(),eu=new T.Euler();
 {const a=new T.Vector3(0,-.25,.97).normalize(),X=new T.Vector3(1,0,0),z=new T.Vector3().crossVectors(a,X);qF.setFromRotationMatrix(new T.Matrix4().makeBasis(a,X,z));qF.premultiply(new T.Quaternion().setFromEuler(new T.Euler(-.55,.12,0,'YXZ')));}   // inclina para baixo atrás (pontas na cauda) e acompanha a curva do corpo   // e acompanha a curva do corpo (traseira para dentro)   // dobrada (lado direito): braço p/ frente, penas p/ baixo
 const qTF=new T.Quaternion().setFromEuler(new T.Euler(0,2.69,0));                                                            // punho dobrado: mão volta por cima do braço
 const ag=P.asaNova();for(const s of [-1,1]){const sh=new T.Group();sh.position.set(s*P.SH[0],P.SH[1],P.SH[2]);body.add(sh);const mir=new T.Group();mir.scale.x=s;sh.add(mir);mir.add(withInk(ag));
  const root=new T.Group(),tip=new T.Group();root.add(tip);root.visible=false;wings.push({s,root,tip});asas.push({s,sh,root,tip,k:0});}
 // "head" é quem o jogo gira (y = virar, z = inclinar); sync() reparte o giro pelos ossos do pescoço
 const head=new T.Object3D();
 const sync=()=>{const y=head.rotation.y/4;n1.rotation.y=n2.rotation.y=n3.rotation.y=hb.rotation.y=y;hb.rotation.z=head.rotation.z;for(const l of lids)l.visible=l.scale.y>.3;
  for(const A of asas){A.k+=((A.root.visible?1:0)-A.k)*.14;if(A.k<.002)A.k=0;const k=A.k*A.k*(3-2*A.k);A.sh.rotation.z=A.root.rotation.z*k;}
  if(asas.length){const A=asas[0];ag.pose(A.k,-A.tip.rotation.z*1.1*(A.k*A.k*(3-2*A.k)));}};   // dobrada: as penas pequenas da mão se escondem
 g.visible=false;return {g,inner,head,lids,wings,sync,ph:rr(0,TAU),vx:0,vy:0,vz:0,x:0,y:0,z:0,st:'sleep',t:0};}
window.arcanoKitAves={SPECIES,kit,owlKitBuild,makeOwlFrom,wingsFly,wingsFold};

function install(){
 const api=window.arcanoWaterV1226,FK=window.arcanoFaunaKit,I=window.arcanoIsland;
 if(!api||!api.scene||!FK||!I||!I.forest){setTimeout(install,800);return;}
 const {Merger,state,ground,water,blocked}=FK,scene=api.scene,trees=I.forest.spots||[];
 const K=kit(Merger),root=new T.Group();root.name='Pássaros da floresta';scene.add(root);
 const GROUPS=mobile?3:6,FLOCK=mobile?5:8;
 const groups=[],sky=[];
 const pDist=(x,z)=>Math.hypot(x-state.px,z-state.pz);
 const treeNear=(x,z,avoidPlayer)=>{let best=null,bd=1e9;for(const t of trees){const d=Math.hypot(t.x-x,t.z-z);if(d<bd&&d<60&&(!avoidPlayer||Math.hypot(t.x-state.px,t.z-state.pz)>7)){bd=d;best=t;}}return best;};
 /* ---------- poleiros: beiradas das copas e cumeeiras/bordas de telhados ---------- */
 const dims=(I.forest&&I.forest.dims)||[];
 function treePerches(x,z,r,out){for(const t of trees){const d=Math.hypot(t.x-x,t.z-z);if(d>r)continue;const dm=dims[t.t]||{h:7,w:4},s0=t.s||1,hh=dm.h*s0,ww=dm.w*s0*(dm.pine?.3:.42);
   for(let k=0;k<2;k++){const a=(t.x*13.1+t.z*7.7+k*2.4)%TAU;out.push({x:t.x+Math.cos(a)*ww,y:t.y+hh*(dm.pine?.42:.6+.08*k),z:t.z+Math.sin(a)*ww,face:a,tree:t});}}return out;}
 const roofPerches=[];
 {const meshes=[];scene.traverse(o=>{if(o.isMesh&&o.name&&(/· construções/.test(o.name)||/^casa (roof|timberH)$/.test(o.name)))meshes.push(o);});
  const rc=new T.Raycaster(),down=new T.Vector3(0,-1,0),nrm=new T.Vector3(),vil=(window.arcanoVilas||[]).map(v=>[v.x,v.z]);
  for(const [vx,vz] of vil)for(let i=0;i<140;i++){const a=Math.random()*TAU,r=Math.sqrt(Math.random())*48,x=vx+Math.cos(a)*r,z=vz+Math.sin(a)*r;
   rc.set(new T.Vector3(x,300,z),down);const h=rc.intersectObjects(meshes,false)[0];if(!h||!h.face)continue;
   nrm.copy(h.face.normal).transformDirection(h.object.matrixWorld);if(nrm.y<.42||h.point.y<ground(x,z)+2.4)continue;
   roofPerches.push({x:h.point.x,y:h.point.y+.02,z:h.point.z,face:Math.random()*TAU,roof:true});}}
 function perchesNear(x,z,r){const out=treePerches(x,z,r,[]);for(const p of roofPerches)if(Math.hypot(p.x-x,p.z-z)<r)out.push(p);return out;}
 // asas: batendo (f>0) ou planando; aberta só em voo
 function place(b){b.g.position.set(b.x,b.y,b.z);}
 // voa até (tx,ty,tz) com velocidade sp; devolve a distância que falta
 function flyTo(b,tx,ty,tz,sp,dt){const dx=tx-b.x,dy=ty-b.y,dz=tz-b.z,d=Math.hypot(dx,dy,dz)||1;
  b.vx+=(dx/d*sp-b.vx)*Math.min(1,dt*2.6);b.vy+=(dy/d*sp-b.vy)*Math.min(1,dt*3.2);b.vz+=(dz/d*sp-b.vz)*Math.min(1,dt*2.6);
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;const gy=ground(b.x,b.z)+.05;if(b.y<gy)b.y=gy;
  const h=Math.hypot(b.vx,b.vz),yaw=Math.atan2(b.vx,b.vz),turn=angTo(b.g.rotation.y,yaw);b.g.rotation.order='YXZ';b.g.rotation.y+=turn*Math.min(1,dt*8);
  b.g.rotation.x=lerp(b.g.rotation.x,-Math.atan2(b.vy,Math.max(h,.5))*.7,Math.min(1,dt*6));b.g.rotation.z=lerp(b.g.rotation.z,clamp(-turn*1.2,-.7,.7),Math.min(1,dt*5));
  return d;}
 // pousa: corpo reto, asas fechadas
 function settle(b,p){b.x=p.x;b.y=p.y;b.z=p.z;b.vx=b.vy=b.vz=0;b.g.rotation.x=0;b.g.rotation.z=0;b.inner.rotation.x=0;wingsFold(b);place(b);}

 /* ---------- bandos: pousados nas árvores/telhados, observam o chão, descem e ciscam ---------- */
 function newGroup(){
  for(let tries=0;tries<40;tries++){const a=rr(0,TAU),d=rr(12,46),x=state.px+Math.cos(a)*d,z=state.pz+Math.sin(a)*d;
   if(water(x,z)||blocked(x,z))continue;const y=ground(x,z);if(Math.abs(ground(x+1.5,z)-y)>.5||Math.abs(ground(x,z+1.5)-y)>.5)continue;
   const dc=Math.hypot(x-I.center.x,z-I.center.z);if(dc>I.radius-25)continue;
   if(groups.some(g=>Math.hypot(g.x-x,g.z-z)<13))continue;
   const per=perchesNear(x,z,24);if(per.length<2)continue;
   const G={x,z,birds:[],alarm:0,perches:per};const n=3+((Math.random()*4)|0);
   for(let i=0;i<n;i++){const b=K.make();b.G=G;b.vx=b.vy=b.vz=0;root.add(b.g);G.birds.push(b);
    if(Math.random()<.5){b.p=pick(per);settle(b,b.p);b.g.rotation.y=b.p.face+rr(-.8,.8);b.st='perch';b.t=rr(2,9);}
    else{b.x=x+rr(-1.6,1.6);b.z=z+rr(-1.6,1.6);b.y=ground(b.x,b.z);b.st='feed';b.t=rr(.3,2);b.act='look';b.feedT=rr(8,22);b.g.rotation.y=rr(0,TAU);place(b);}}
   groups.push(G);return;}
 }
 const pick=a=>a[(Math.random()*a.length)|0];
 function goPerch(b,flee){const per=b.G.perches;let p=null;
  if(flee){let bd=-1;for(const q of per){const d=Math.hypot(q.x-state.px,q.z-state.pz);if(d>bd){bd=d;p=q;}}}else p=pick(per);
  if(!p)p={x:b.x+rr(-15,15),y:b.y+10,z:b.z+rr(-15,15),face:0};b.p={x:p.x+rr(-.25,.25),y:p.y,z:p.z+rr(-.25,.25),face:p.face};b.st=flee?'flee':'up';b.t=0;b.vy=flee?3.5:2;}
 function updGround(b,dt){
  const G=b.G,night=state.day<.18,dp=pDist(b.x,b.z);
  if(b.st==='feed'){
   if(dp<4.6||(dp<8&&state.speed>3.4)||night)G.alarm=Math.max(G.alarm,.01);
   if(G.alarm>0&&b.delay==null)b.delay=rr(0,.35);
   if(b.delay!=null){b.delay-=dt;if(b.delay<=0){b.delay=null;b.inner.rotation.x=0;goPerch(b,true);return;}}
   b.t-=dt;b.feedT-=dt;
   if(b.feedT<=0&&b.act==='look'){b.inner.rotation.x=0;goPerch(b,false);return;}            // cansou: volta para um galho
   if(b.act==='hop'){b.k+=dt/.22;const k=Math.min(1,b.k);b.x=lerp(b.x0,b.x1,k);b.z=lerp(b.z0,b.z1,k);b.y=lerp(b.y0,b.y1,k)+Math.sin(k*PI)*.09;if(k>=1){b.hops--;if(b.hops>0)startHop(b);else{b.act='look';b.t=rr(.3,1.2);}}}
   else if(b.act==='peck'){b.k+=dt*9;b.inner.rotation.x=Math.max(0,Math.sin(b.k))*.95;if(b.k>PI*(b.pecks*2-1)+.1){b.inner.rotation.x=0;b.act='look';b.t=rr(.4,1.6);}}
   else if(b.t<=0){const u=Math.random();
    if(u<.45){b.hops=1+((Math.random()*3)|0);b.yawT=Math.atan2(G.x+rr(-2.2,2.2)-b.x,G.z+rr(-2.2,2.2)-b.z);startHop(b);}
    else if(u<.8){b.act='peck';b.k=0;b.pecks=1+((Math.random()*3)|0);}
    else{b.yawT=b.g.rotation.y+rr(-1.4,1.4);b.t=rr(.4,1.4);}}
   if(b.yawT!=null)b.g.rotation.y+=angTo(b.g.rotation.y,b.yawT)*Math.min(1,dt*12);
   b.g.rotation.x=0;b.g.rotation.z=0;wingsFold(b);place(b);
  }else if(b.st==='perch'){ // pousado: vira a cabeça, olha para baixo; depois desce para ciscar
   b.t-=dt;wingsFold(b);
   if(b.look==null||b.lookT<=0){b.look=rr(-.35,.6);b.lookT=rr(.4,1.6);b.yawT=b.g.rotation.y+rr(-.9,.9);}b.lookT-=dt;
   b.inner.rotation.x+=(b.look-b.inner.rotation.x)*Math.min(1,dt*8);if(b.yawT!=null)b.g.rotation.y+=angTo(b.g.rotation.y,b.yawT)*Math.min(1,dt*6);
   if(b.sing>0){b.sing-=dt;b.inner.rotation.x=-.32+Math.sin(state.t*28)*.07;}   // cantando: bico para cima, tremendo
   if(dp<3.2)G.alarm=Math.max(G.alarm,.01);
   if(G.alarm>0&&dp<5){b.inner.rotation.x=0;goPerch(b,true);return;}
   if(b.t<=0&&!night&&G.alarm<=0&&pDist(G.x,G.z)>6){b.inner.rotation.x=0;b.land={x:G.x+rr(-1.8,1.8),z:G.z+rr(-1.8,1.8)};b.land.y=ground(b.land.x,b.land.z);b.st='down';b.vy=1;}
   else if(b.t<=0)b.t=rr(2,6);
  }else if(b.st==='flee'||b.st==='up'){ // indo para o galho/telhado
   b.t+=dt;const fast=b.st==='flee';wingsFly(b,true,state.t*(fast?26:20)+b.ph);
   const d=flyTo(b,b.p.x,b.p.y+(Math.hypot(b.p.x-b.x,b.p.z-b.z)>2?.6:0),b.p.z,fast?7.5:5,dt);place(b);
   if(d<.22||b.t>9){settle(b,b.p);b.g.rotation.y=b.p.face+rr(-.6,.6);b.st='perch';b.t=fast?rr(8,16):rr(4,12);
    // pousou na árvore: 30% de chance de cantar (o som sai do próprio pássaro). Assustado (fugindo) não canta.
    if(!fast&&Math.random()<.3){const A=window.arcanoAudio;if(A&&A.birdAt&&A.birdAt(b.x,b.y,b.z,b.sp)){b.sing=1.4;}}}
  }else if(b.st==='down'){ // desce planando até o chão
   const far=Math.hypot(b.land.x-b.x,b.land.z-b.z),d=flyTo(b,b.land.x,b.land.y+(far>2.5?.9:0),b.land.z,4.5,dt),flap=d<1.6||((state.t+b.ph)%2.2)<.8;wingsFly(b,flap,state.t*20+b.ph);place(b);
   if(dp<4){G.alarm=.01;goPerch(b,true);return;}
   if(d<.25&&b.y<b.land.y+.3){settle(b,b.land);b.st='feed';b.act='look';b.t=rr(.4,1.5);b.feedT=rr(8,22);b.delay=null;}
  }
 }
 function startHop(b){b.act='hop';b.k=0;b.x0=b.x;b.z0=b.z;b.y0=b.y;const a=(b.yawT!=null?b.yawT:b.g.rotation.y)+rr(-.4,.4),d=rr(.14,.3);let x=b.x+Math.sin(a)*d,z=b.z+Math.cos(a)*d;if(water(x,z)){x=b.x;z=b.z;}b.x1=x;b.z1=z;b.y1=ground(x,z);b.yawT=a;}

 /* ---------- CORUJAS (noturnas): dormem escondidas de dia; à noite pousam nos galhos, giram a cabeça,
    piscam, voam em silêncio de árvore em árvore e às vezes mergulham até o chão para caçar ---------- */
 const owlKit=owlKitBuild(Merger),makeOwl=()=>makeOwlFrom(owlKit);
 const owls=[],OWLS=mobile?2:4;
 function owlPerchNear(x,z){const per=treePerches(x,z,30,[]);return per.length?pick(per):null;}
 function updOwl(o,dt){
  const night=state.day<.2,dp=pDist(o.x,o.z);
  if(o.st==='sleep'){o.g.visible=false;if(night){const p=owlPerchNear(state.px+rr(-25,25),state.pz+rr(-25,25));if(p&&pDist(p.x,p.z)>8){o.p=p;settle(o,p);o.g.rotation.y=p.face;o.g.visible=true;o.st='perch';o.t=rr(6,16);}}return;}
  if(!night&&o.st==='perch'){o.st='sleep';return;}
  if(o.st==='perch'){o.t-=dt;wingsFold(o);
   // cabeça gira devagar (até ~180°) e às vezes vira de repente para quem joga
   if(o.hT==null||o.hT<=0){o.hy=dp<14?angTo(o.g.rotation.y,Math.atan2(state.px-o.x,state.pz-o.z)):rr(-2.6,2.6);o.hT=rr(1.5,4);o.tilt=rr(-.3,.3);}o.hT-=dt;
   o.head.rotation.y+=(clamp(o.hy,-2.7,2.7)-o.head.rotation.y)*Math.min(1,dt*(dp<14?6:1.8));o.head.rotation.z+=(o.tilt-o.head.rotation.z)*Math.min(1,dt*3);
   const bl=((state.t+o.ph)%3.6)<.16?1:.2;for(const l of o.lids)l.scale.y+=(bl-l.scale.y)*Math.min(1,dt*20);
   if(dp<3.5){const p=owlPerchNear(o.x+rr(-20,20),o.z+rr(-20,20));if(p){o.p=p;o.st='fly';o.t=0;}}
   else if(o.t<=0){if(Math.random()<.4){o.prey={x:o.x+rr(-9,9),z:o.z+rr(-9,9)};o.prey.y=ground(o.prey.x,o.prey.z);if(!water(o.prey.x,o.prey.z)){o.st='swoop';o.t=0;return;}}
    const p=owlPerchNear(o.x,o.z);if(p){o.p=p;o.st='fly';o.t=0;}else o.t=rr(5,10);}
   place(o);return;}
  o.t+=dt;
  if(o.st==='fly'){wingsFly(o,((state.t+o.ph)%1.8)<.7,state.t*9+o.ph);const d=flyTo(o,o.p.x,o.p.y+(Math.hypot(o.p.x-o.x,o.p.z-o.z)>2?.8:0),o.p.z,5.5,dt);place(o);o.head.rotation.y*=.9;
   if(d<.25||o.t>12){settle(o,o.p);o.g.rotation.y=o.p.face;o.st='perch';o.t=rr(8,20);}}
  else if(o.st==='swoop'){wingsFly(o,false,0);const d=flyTo(o,o.prey.x,o.prey.y+.1,o.prey.z,7,dt);place(o);
   if(d<.35||o.t>6){o.st='catch';o.t=0;}}
  else if(o.st==='catch'){wingsFly(o,true,state.t*14);if(o.t>.6){const p=owlPerchNear(o.x,o.z);if(p){o.p=p;o.st='fly';o.t=0;}}}
 }
 /* ---------- revoada no alto ---------- */
 const F={cx:0,cz:0,a:rr(0,TAU),r:26,alt:24,ready:false,st:'fly',t:0};
 function updSky(dt){
  const night=state.day<.18;
  if(!F.ready){F.cx=state.px+30;F.cz=state.pz;F.ready=true;for(let i=0;i<FLOCK;i++){const b=K.make();b.i=i;b.x=F.cx;b.z=F.cz;b.y=ground(F.cx,F.cz)+F.alt;b.vx=b.vy=b.vz=0;root.add(b.g);sky.push(b);}}
  // o centro do círculo acompanha quem joga, devagar
  const want={x:state.px+Math.cos(F.a*.23)*34,z:state.pz+Math.sin(F.a*.23)*34};F.cx+=(want.x-F.cx)*Math.min(1,dt*.12);F.cz+=(want.z-F.cz)*Math.min(1,dt*.12);
  if(Math.hypot(F.cx-state.px,F.cz-state.pz)>160){F.cx=want.x;F.cz=want.z;for(const b of sky){b.x=F.cx;b.z=F.cz;b.y=ground(F.cx,F.cz)+F.alt;}}
  F.a+=dt*.3;F.t+=dt;const gy=ground(F.cx,F.cz);
  if(F.st==='fly'&&night){F.st='roost';const t=treeNear(F.cx,F.cz,false);F.roost=t?{x:t.x,y:t.y+4.5*(t.s||1),z:t.z}:{x:F.cx,y:gy+3,z:F.cz};}
  if(F.st==='roost'&&!night&&sky.every(b=>!b.g.visible)){F.st='fly';for(const b of sky){b.g.visible=true;b.x=F.roost.x;b.y=F.roost.y;b.z=F.roost.z;}}
  const lx=F.cx+Math.cos(F.a)*F.r,lz=F.cz+Math.sin(F.a)*F.r,hx=-Math.sin(F.a),hz=Math.cos(F.a),glide=(F.t%6.5)>4.2;
  for(const b of sky){if(!b.g.visible)continue;
   if(F.st==='roost'){wingsFly(b,true,state.t*22+b.ph);if(flyTo(b,F.roost.x+Math.sin(b.i)*1.2,F.roost.y,F.roost.z+Math.cos(b.i)*1.2,8,dt)<1)b.g.visible=false;place(b);continue;}
   const row=Math.ceil(b.i/2),side=b.i%2?1:-1,back=row*1.5,out=b.i?row*1.3*side:0;   // formação em V
   const tx=lx-hx*back+(-hz)*out,tz=lz-hz*back+hx*out,ty=gy+F.alt+Math.sin(F.a*1.7+b.i)*1.6-row*.25;
   wingsFly(b,!glide,state.t*(17+b.i%3)+b.ph);flyTo(b,tx,ty,tz,10.5,dt);place(b);}
 }

 let last=performance.now(),popT=0;
 (function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;if(dt<=0||!document.body.classList.contains('play-active'))return;
  popT-=dt;if(popT<=0){popT=2;
   for(let i=groups.length-1;i>=0;i--)if(Math.hypot(groups[i].x-state.px,groups[i].z-state.pz)>75){for(const b of groups[i].birds)root.remove(b.g);groups.splice(i,1);}
   if(groups.length<GROUPS&&state.day>=.18)newGroup();}
  for(const G of groups){if(G.alarm>0){G.alarm+=dt;if(G.alarm>2&&G.birds.every(b=>b.st==='perch')&&G.birds.every(b=>pDist(b.x,b.z)>6))G.alarm=0;}for(const b of G.birds)updGround(b,dt);}
  if(owls.length<OWLS){const o=makeOwl();root.add(o.g);owls.push(o);}for(const o of owls){if(o.st!=='sleep'&&pDist(o.x,o.z)>90)o.st='sleep';updOwl(o,dt);if(o.sync)o.sync();}
  updSky(dt);
 })(last);
 window.arcanoAves={groups,sky,owls,flock:F,roofPerches,especies:SPECIES.map(s=>s.n)};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,5000));else setTimeout(install,5000);
})();
