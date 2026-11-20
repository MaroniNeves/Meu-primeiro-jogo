/* Vida aquática: peixes e bichos da água (só perto de quem joga; tudo renasce e tem esconderijo).
   - LAMBARIS: cardumes prateados que nadam juntos, se espalham e fogem quando alguém entra na água;
     às vezes um salta (mais no fim da tarde) e faz ondinha.
   - CARPAS (koi) nos lagos: laranja, branco e preto, nadam devagar; se você fica parado na beira,
     elas vêm até a superfície pedir comida.
   - TRUTAS no rio: ficam paradas contra a correnteza, dão arrancadas e fogem rio abaixo.
   - GIRINOS no raso: bolinhas pretas que se remexem em grupo e fogem rápido.
   - TARTARUGAS: tomam sol na beira; quando alguém chega, escorregam para a água, nadam submersas,
     sobem para respirar e voltam para a pedra quando o lugar fica calmo.
   - PATOS: a mãe nada pelo lago com os filhotes em fila, mergulha a cabeça para comer; se assusta,
     nada para longe e, se você chega muito perto, voa e pousa longe — os filhotes vão atrás.
   - PATINADORES: insetinhos que deslizam na superfície parada.
   Os peixes ficam sempre dentro d'água (nunca no seco) e são vistos pela refração da água. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const PI=Math.PI,TAU=PI*2;
const mobile=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||innerWidth<680;
const rr=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const angTo=(a,b)=>((b-a+PI)%TAU+TAU)%TAU-PI;
const pick=a=>a[(Math.random()*a.length)|0];

/* ---------- modelos (fora do install para a enciclopédia dos bichos também usar) ---------- */
/* ---------- peixes no desenho de referência (lambari, carpa koi, truta-arco-íris) ----------
   Comprimento 1 ao longo de z (cabeça em +z, cauda em -z), como antes: a ondulação da cauda no shader continua igual.
   Corpo = esfera deformada por perfis (altura de cima, de baixo e largura ao longo do corpo) com cores pintadas por vértice;
   nadadeiras = leques com raios e borda escura; olhos grandes com brilho. O contorno do corpo é uma segunda malha (só o corpo). */
function peixeNovo(tipo,alta){
 const SEG=alta?[128,90]:(tipo==='koi'?[64,44]:[44,30]),FU=alta?6:3,FV=alta?10:6,NPINTA=alta?170:90,PSEG=alta?8:6;
 const SPL=window.arcanoPele.spline,col=h=>new T.Color(h),fr=v=>v-Math.floor(v);
 const sst=(a,b,t)=>{t=clamp((t-a)/(b-a),0,1);return t*t*(3-2*t);};
 const partes=[],corpoPartes=[];
 const juntar=(lista)=>{let nv=0,ni=0;for(const g of lista){nv+=g.attributes.position.count;ni+=g.index.count;}
  const P=new Float32Array(nv*3),N=new Float32Array(nv*3),C=new Float32Array(nv*3),I=new Uint32Array(ni);let ov=0,oi=0;
  for(const g of lista){P.set(g.attributes.position.array,ov*3);N.set(g.attributes.normal.array,ov*3);C.set(g.attributes.color.array,ov*3);
   const ix=g.index.array;for(let k=0;k<ix.length;k++)I[oi+k]=ix[k]+ov;ov+=g.attributes.position.count;oi+=ix.length;}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(P,3));g.setAttribute('normal',new T.BufferAttribute(N,3));g.setAttribute('color',new T.BufferAttribute(C,3));
  g.setIndex(new T.BufferAttribute(I,1));g.computeBoundingSphere();return g;};
 // corpo: perfis por s (0 = base da cauda, 1 = focinho)
 const env=s=>s>.86?Math.sqrt(Math.max(0,1-Math.pow((s-.86)/.14,2))):s<.04?Math.sqrt(Math.max(0,1-Math.pow((.04-s)/.04,2))):1;
 const corpo=(z0,z1,HT,HB,W,pinta)=>{const g=new T.SphereGeometry(1,SEG[0],SEG[1]);g.rotateX(PI/2);
  const p=g.attributes.position,c=new Float32Array(p.count*3),cc=new T.Color();
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=Math.sqrt(Math.max(0,1-z*z)),cx=r>1e-5?x/r:0,cy=r>1e-5?y/r:0,s=(z+1)/2;
   const e=env(s),ht=Math.max(0,SPL(HT,s))*e,hb=Math.max(0,SPL(HB,s))*e,w=Math.max(0,SPL(W,s))*e;
   const X=cx*w*r/Math.max(r,1e-5),Y=cy>0?cy*ht:cy*hb,Z=z0+s*(z1-z0);
   p.setXYZ(i,X*(r>0?1:0),Y*(r>0?1:0),Z);pinta(s,cx,cy,cc);c.set([cc.r,cc.g,cc.b],i*3);}
  g.setAttribute('color',new T.BufferAttribute(c,3));g.computeVertexNormals();partes.push(g);corpoPartes.push(g);
  return {at:s=>({z:z0+s*(z1-z0),ht:Math.max(0,SPL(HT,s))*env(s),hb:Math.max(0,SPL(HB,s))*env(s),w:Math.max(0,SPL(W,s))*env(s)})};};
 // pintinha nítida na superfície do corpo (s ao longo, a = ângulo na seção)
 const pinta=(B,s,a,r,cor)=>{const q=B.at(s),x=Math.cos(a)*q.w,y=Math.sin(a)*(Math.sin(a)>0?q.ht:q.hb);bola(x*1.01,y*1.01,q.z,r*.6,r,r*1.15,cor,PSEG);};
 const bola=(x,y,z,rx,ry,rz,cor,seg)=>{const g=new T.SphereGeometry(1,seg||14,Math.max(8,((seg||14)*.7)|0));g.scale(rx,ry,rz);g.translate(x,y,z);g.computeVertexNormals();
  const c=new Float32Array(g.attributes.position.count*3),k=col(cor);for(let i=0;i<c.length;i+=3)c.set([k.r,k.g,k.b],i);g.setAttribute('color',new T.BufferAttribute(c,3));partes.push(g);};
 // nadadeira: base b0->b1 (u), ponta seguindo a linha de contorno "pts" (u de 0 a 1), raios e borda escura
 const nadadeira=(b0,b1,pts,raios,corFn,borda)=>{const nu=Math.max(alta?24:10,raios*FU),nv=FV,pos=[],cs=[],idx=[],cc=new T.Color(),bd=col(borda||'#2a2224');
  const ponta=u=>{const f=u*(pts.length-1),i=Math.min(pts.length-2,Math.floor(f)),t=f-i,a=pts[i],b=pts[i+1];return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];};
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const u=i/nu,v=j/nv,B=[b0[0]+(b1[0]-b0[0])*u,b0[1]+(b1[1]-b0[1])*u,b0[2]+(b1[2]-b0[2])*u],Pn=ponta(u);
   pos.push(B[0]+(Pn[0]-B[0])*v,B[1]+(Pn[1]-B[1])*v,B[2]+(Pn[2]-B[2])*v);
   corFn(u,v,cc);const ray=raios&&fr(u*raios)<.16&&v>.08?.45:0;if(ray)cc.lerp(col('#3a2a22'),ray*.5);
   const e=Math.max(sst(.86,.97,v),sst(.05,0,u)*v,sst(.95,1,u)*v);if(e>0)cc.lerp(bd,e*.85);cs.push(cc.r,cc.g,cc.b);}
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+1,c=a+nu+1,d=c+1;idx.push(a,b,d,a,d,c);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(cs,3));g.setIndex(idx);g.computeVertexNormals();partes.push(g);};
 const olho=(B,s,yf,r)=>{const a=B.at(s),y=a.ht*yf,xs=a.w*Math.sqrt(Math.max(0,1-yf*yf))*.97;
  for(const k of [-1,1]){bola(k*(xs-r*.25),y,a.z,r*.35,r*1.18,r*1.18,'#2a2224',12);bola(k*(xs-r*.1),y,a.z,r*.32,r*1.02,r*1.02,'#efeee6',14);
   bola(k*(xs+r*.05),y,a.z+r*.05,r*.3,r*.66,r*.66,'#0b0b0d',14);bola(k*(xs+r*.18),y+r*.28,a.z+r*.28,r*.12,r*.2,r*.2,'#ffffff',8);}};
 const mix=(cc,h,t)=>cc.lerp(col(h),clamp(t,0,1));
 if(tipo==='lambari'){
  const B=corpo(-.34,.5,[.035,.05,.09,.125,.138,.135,.122,.1,.08],[.035,.045,.08,.115,.13,.128,.115,.09,.07],[.022,.03,.05,.065,.072,.071,.066,.055,.045],
   (s,cx,cy,cc)=>{cc.set('#7f8b85');mix(cc,'#c9d1d0',sst(.75,.35,cy));mix(cc,'#f1f3ef',sst(.05,-.5,cy));
    if(s>.08&&s<.8&&cy>-.18&&cy<.2)mix(cc,'#3f4a47',sst(.2,.02,Math.abs(cy-.01))*sst(.08,.2,s)*sst(.8,.68,s)*.9);
    mix(cc,'#8e9894',.45*sst(.03,0,Math.abs(s-.745))*sst(.7,.5,Math.abs(cy)));});
  olho(B,.86,.25,.034);
  bola(0,-.012,.493,.012,.006,.012,'#2a2224',8);
  nadadeira([0,-.034,-.33],[0,.034,-.33],[[0,-.15,-.5],[0,-.09,-.47],[0,-.02,-.42],[0,.02,-.42],[0,.09,-.47],[0,.15,-.5]],12,
   (u,v,cc)=>{cc.set('#e8cf6a');const lobo=Math.abs(u-.5)*2;mix(cc,'#d8452c',sst(.45,.95,lobo)*sst(.35,.9,v));});
  nadadeira([0,.12,.03],[0,.105,-.07],[[0,.25,.03],[0,.27,-.02],[0,.19,-.08],[0,.12,-.09]],7,(u,v,cc)=>{cc.set('#d8c15c');mix(cc,'#b7a44a',.3*(1-v));});
  nadadeira([0,-.1,-.06],[0,-.065,-.24],[[0,-.18,-.08],[0,-.16,-.18],[0,-.1,-.26]],8,(u,v,cc)=>{cc.set('#e6d27a');mix(cc,'#e2643a',sst(.5,1,v)*.7);});
  for(const k of [-1,1]){nadadeira([k*.035,-.115,.08],[k*.03,-.11,.02],[[k*.055,-.19,.05],[k*.06,-.21,-.01],[k*.05,-.18,-.05],[k*.035,-.13,-.01]],5,(u,v,cc)=>{cc.set('#e9e0b8');});
   nadadeira([k*.06,-.06,.29],[k*.06,-.08,.23],[[k*.08,-.12,.26],[k*.085,-.15,.18],[k*.08,-.14,.13],[k*.065,-.1,.19]],6,(u,v,cc)=>{cc.set('#e4e4dc');});}
  nadadeira([0,.08,-.2],[0,.07,-.24],[[0,.11,-.21],[0,.1,-.25]],0,(u,v,cc)=>{cc.set('#c8b45a');});}
 else if(tipo==='koi'){
  const pele=(s,cx,cy,cc)=>{
   const a=Math.atan2(cy,cx),nO=Math.sin(s*13+a*2.1)+Math.sin(s*7.3-a*3.2)+.8*Math.sin(s*21+a*1.3),nP=Math.sin(s*17-a*2.6)+Math.sin(s*9.1+a*4.1);
   cc.set('#f8f4ea');mix(cc,'#f2741f',sst(.15,.55,nO)*sst(-.45,-.25,cy));mix(cc,'#1b191b',sst(.95,1.15,nP)*sst(-.05,.15,cy)*sst(.08,.14,s)*sst(.8,.74,s));
   const cab=sst(.74,.8,s);mix(cc,'#f17a24',cab);mix(cc,'#e2412a',cab*sst(.25,.45,cy)*sst(.98,.92,s)*sst(.6,.4,Math.abs(cx)));mix(cc,'#f6efe2',cab*sst(-.15,-.35,cy));
   mix(cc,'#f8f4ea',sst(-.45,-.65,cy));const esc=.96+.05*Math.sin(s*140)*Math.sin(a*36);cc.multiplyScalar(esc);};
  const B=corpo(-.32,.5,[.04,.065,.11,.15,.165,.166,.155,.13,.1],[.04,.055,.09,.12,.135,.136,.128,.105,.08],[.03,.05,.085,.11,.12,.12,.114,.098,.075],pele);
  olho(B,.84,.28,.03);
  bola(0,-.03,.497,.03,.012,.02,'#2a2224',8);
  for(const k of [-1,1]){const g=new T.CylinderGeometry(.004,.007,.06,6);g.translate(0,-.03,0);g.rotateZ(k*.25);g.rotateX(.6);g.translate(k*.025,-.04,.48);
   const c=new Float32Array(g.attributes.position.count*3);const q=col('#e9d6b8');for(let i=0;i<c.length;i+=3)c.set([q.r,q.g,q.b],i);g.setAttribute('color',new T.BufferAttribute(c,3));g.computeVertexNormals();partes.push(g);}
  nadadeira([0,-.04,-.31],[0,.04,-.31],[[0,-.2,-.5],[0,-.11,-.47],[0,-.03,-.4],[0,.03,-.4],[0,.11,-.47],[0,.2,-.5]],14,
   (u,v,cc)=>{cc.set('#f28a3a');mix(cc,'#fbd9b8',sst(.4,1,v)*.6);});
  nadadeira([0,.16,.12],[0,.075,-.25],[[0,.29,.1],[0,.25,.0],[0,.19,-.12],[0,.11,-.26]],12,(u,v,cc)=>{cc.set('#f07a2a');mix(cc,'#f9c9a0',sst(.5,1,v)*.5);});
  for(const k of [-1,1]){
   nadadeira([k*.1,-.1,.25],[k*.085,-.115,.13],[[k*.13,-.25,.18],[k*.145,-.33,.06],[k*.14,-.31,-.05],[k*.11,-.2,.05]],9,(u,v,cc)=>{cc.set('#c9def0');mix(cc,'#f1f6fb',sst(.3,1,v)*.5);},'#5a6d86');
   nadadeira([k*.07,-.125,.03],[k*.06,-.12,-.07],[[k*.09,-.24,-.01],[k*.1,-.29,-.1],[k*.09,-.25,-.15],[k*.07,-.17,-.09]],7,(u,v,cc)=>{cc.set('#cfe1f0');},'#5a6d86');}
  nadadeira([0,-.09,-.14],[0,-.06,-.22],[[0,-.17,-.18],[0,-.15,-.25],[0,-.08,-.25]],6,(u,v,cc)=>{cc.set('#f08a3a');});}
 else if(tipo==='girino'){
  // girino: cabeça-corpo oval cinza-escuro, olhinhos pretos com brilho, boca pequena; cauda com músculo e membrana clara
  const B=corpo(.04,.5,[.04,.1,.14,.16,.165,.16,.145,.11,.07],[.04,.09,.125,.14,.145,.14,.125,.095,.06],[.04,.11,.15,.17,.175,.17,.155,.12,.07],
   (s,cx,cy,cc)=>{cc.set('#4b4540');mix(cc,'#6a625a',sst(.3,.9,cy)*.35*Math.max(0,Math.sin(s*23+cx*9)));mix(cc,'#5a544c',sst(-.2,-.7,cy)*.6);});
  for(const k of [-1,1]){const a=B.at(.8),xs=a.w*.86;bola(k*xs,a.ht*.28,a.z,.014,.034,.034,'#0b0b0c',12);bola(k*(xs+.01),a.ht*.28+.014,a.z+.014,.007,.011,.011,'#ffffff',6);
   const q=B.at(.45);bola(k*q.w*.93,-q.hb*.2,q.z,.03,.05,.07,'#4f4943',10);}
  bola(0,-.01,.5,.02,.008,.012,'#1e1a18',8);
  corpo(-.5,.08,[.003,.012,.022,.032,.04,.046,.05,.052,.05],[.003,.01,.02,.03,.038,.044,.048,.05,.048],[.002,.007,.011,.015,.018,.021,.024,.026,.028],(s,cx,cy,cc)=>{cc.set('#5a534c');});
  nadadeira([0,.04,.06],[0,0,-.5],[[0,.1,.04],[0,.15,-.08],[0,.16,-.22],[0,.12,-.36],[0,.06,-.46],[0,.01,-.5]],0,(u,v,cc)=>{cc.set('#a9a39a');mix(cc,'#cfcac1',v);},'#6d665e');
  nadadeira([0,-.04,.06],[0,0,-.5],[[0,-.09,.04],[0,-.13,-.08],[0,-.14,-.22],[0,-.1,-.36],[0,-.05,-.46],[0,-.01,-.5]],0,(u,v,cc)=>{cc.set('#a9a39a');mix(cc,'#cfcac1',v);},'#6d665e');}
 else{
  const pele=(s,cx,cy,cc)=>{
   cc.set('#7a8a50');mix(cc,'#b4bc96',sst(.55,.1,cy));mix(cc,'#e89aa6',sst(.3,.05,Math.abs(cy+.02))*sst(.1,.3,s)*sst(.98,.85,s)*.85);mix(cc,'#eef0e8',sst(-.3,-.6,cy));
   mix(cc,'#e3909d',.65*sst(.72,.77,s)*sst(.92,.87,s)*sst(.42,.3,Math.abs(cy+.03)));
   };
  const B=corpo(-.34,.5,[.035,.05,.085,.11,.12,.12,.11,.092,.07],[.035,.045,.075,.1,.11,.108,.1,.082,.06],[.022,.035,.055,.068,.072,.071,.066,.056,.042],pele);
  {let sd=7;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647;};for(let i=0;i<NPINTA;i++){const ss=.06+rnd()*.86,a=-.35+rnd()*(PI+.7);if(ss>.74&&Math.sin(a)<.35)continue;pinta(B,ss,a,.0055+rnd()*.003,'#1b1b16');}}
  olho(B,.85,.3,.028);
  bola(0,-.018,.49,.03,.01,.018,'#3a2a2a',8);bola(0,-.035,.475,.022,.006,.02,'#d9c8c0',8);
  const pint=(cor)=>(u,v,cc)=>{cc.set(cor);const h=Math.sin(u*91.7+v*47.3)*43758.5;if(fr(h)<.1&&v>.12)cc.set('#1d1d18');};
  nadadeira([0,-.035,-.33],[0,.035,-.33],[[0,-.15,-.5],[0,-.07,-.48],[0,0,-.465],[0,.07,-.48],[0,.15,-.5]],12,pint('#8d9862'));
  nadadeira([0,.11,.09],[0,.1,-.03],[[0,.22,.06],[0,.21,.0],[0,.15,-.05],[0,.1,-.05]],8,pint('#8a9660'));
  nadadeira([0,.075,-.2],[0,.068,-.24],[[0,.105,-.215],[0,.1,-.25]],0,(u,v,cc)=>{cc.set('#7a8a50');});
  nadadeira([0,-.09,-.13],[0,-.06,-.23],[[0,-.16,-.16],[0,-.15,-.23],[0,-.08,-.26]],7,(u,v,cc)=>{cc.set('#e8b8bd');mix(cc,'#fbfbf6',sst(.5,0,u)*.8);});
  for(const k of [-1,1]){
   nadadeira([k*.06,-.075,.28],[k*.055,-.085,.21],[[k*.08,-.14,.24],[k*.085,-.17,.15],[k*.08,-.15,.1],[k*.065,-.11,.17]],7,(u,v,cc)=>{cc.set('#ebbcc2');mix(cc,'#ffffff',sst(.3,0,u)*.8);});
   nadadeira([k*.04,-.1,.02],[k*.035,-.098,-.06],[[k*.055,-.17,-.0],[k*.06,-.19,-.08],[k*.055,-.17,-.12],[k*.04,-.12,-.08]],6,(u,v,cc)=>{cc.set('#ecc2c6');mix(cc,'#ffffff',sst(.3,0,u)*.8);});}}
 const g=juntar(partes);g.inkGeo=juntar(corpoPartes);return g;}

function kitAgua(Merger){
 const uT={value:0};
 function fishGeoVelho(sp){const B=Merger(),cA=new T.Color(),cB=new T.Color(),c=new T.Color();
  {const g=new T.SphereGeometry(1,18,12).toNonIndexed(),p=g.attributes.position,col=new Float32Array(p.count*3);
   for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const tp=z<0?1+z*.62:1-z*z*.18;
    sp.paint(x,y,z,c);x*=sp.w*tp;y*=sp.h*tp;z*=.5;p.setXYZ(i,x,y,z);col.set([c.r,c.g,c.b],i*3);}
   g.setAttribute('color',new T.BufferAttribute(col,3));B.add(g);}
  const fin=(pts,col,rot,tr)=>{const sh=new T.Shape();pts.forEach(([a,b],i)=>i?sh.lineTo(a,b):sh.moveTo(a,b));const g=new T.ShapeGeometry(sh);if(rot)rot(g);g.translate(...tr);B.add(g,col);const g2=g.clone();B.add(g2,col);};
  // cauda bifurcada (plano vertical), dorsal e peitorais
  fin([[0,0],[-.1,sp.h*1.5],[-.3,sp.h*2.2],[-.22,0],[-.3,-sp.h*2.2],[-.1,-sp.h*1.5]],sp.fin,g=>g.rotateY(PI/2),[0,0,-.47]);
  fin([[0,0],[.22,0],[.05,sp.h*1.2]],sp.fin,g=>g.rotateY(-PI/2),[0,sp.h*.82,.08]);
  for(const s of [-1,1])fin([[0,0],[-.14,.02],[-.1,-.06]],sp.fin,g=>{g.rotateX(PI/2);g.rotateZ(s*.5);},[s*sp.w*.85,-sp.h*.3,.14]);
  for(const s of [-1,1]){B.ball(s*sp.w*.62,sp.h*.25,.33,sp.eye,'#0c0c10');B.ball(s*sp.w*.7,sp.h*.33,.35,sp.eye*.32,'#ffffff');}
  return B.build();}
 const SP={
  lambari:{w:.13,h:.2,eye:.035,fin:'#d8643c',paint(x,y,z,c){const k=clamp((-y+.15)/.5,0,1);c.set('#56757c').lerp(new T.Color('#eef4f5'),k);if(Math.abs(y-.05)<.08)c.lerp(new T.Color('#d8eef4'),.7);if(z>.55&&y<.1&&y>-.3)c.lerp(new T.Color('#f2c34a'),.0);}},
  koi:{w:.2,h:.21,eye:.03,fin:'#f6efe6',paint(x,y,z,c){const n=Math.sin(x*7+z*5)+Math.sin(z*9-x*3)+Math.sin(y*6+z*4);c.set('#f6f0e6');if(n>.4)c.set('#f07422');if(n>1.9)c.set('#18161a');if(y<-.4)c.set('#f6f0e6');}},
  truta:{w:.14,h:.19,eye:.03,fin:'#8a8a60',paint(x,y,z,c){const k=clamp((-y+.1)/.5,0,1);c.set('#5e6a3c').lerp(new T.Color('#eadfc4'),k);if(Math.abs(y+.02)<.12)c.lerp(new T.Color('#e88a8a'),.55);if(y>0&&Math.sin(x*41+z*37)*Math.sin(z*29)>.55)c.set('#2a2a1e');}},
  girino:{w:.36,h:.3,eye:.05,fin:'#3a3a30',paint(x,y,z,c){c.set(y>0?'#2a2a20':'#4a4a3a');}}};
 SP.lambari.novo='lambari';SP.koi.novo='koi';SP.truta.novo='truta';SP.girino.novo='girino';
 const fishGeo=(sp,alta)=>sp.novo?peixeNovo(sp.novo,alta):fishGeoVelho(sp);
 const fishMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.45,side:T.DoubleSide});
 fishMat.onBeforeCompile=sh=>{sh.uniforms.uT=uT;sh.vertexShader='attribute vec2 aSwim;uniform float uT;\n'+sh.vertexShader.replace('#include <begin_vertex>',
  `#include <begin_vertex>
  float tail=clamp(-position.z*1.6+.15,0.,1.4);
  transformed.x+=sin(uT*aSwim.y+aSwim.x-position.z*7.)*.11*tail*tail;`);};
 fishMat.customProgramCacheKey=()=>'peixe-v1';
 const fishInk=new T.MeshBasicMaterial({color:'#2a2224',side:T.BackSide});
 fishInk.onBeforeCompile=sh=>{sh.uniforms.uT=uT;sh.vertexShader='attribute vec2 aSwim;uniform float uT;\n'+sh.vertexShader.replace('#include <begin_vertex>',
  `#include <begin_vertex>
  transformed+=normal*.012;
  float tail=clamp(-position.z*1.6+.15,0.,1.4);
  transformed.x+=sin(uT*aSwim.y+aSwim.x-position.z*7.)*.11*tail*tail;`);};
 fishInk.customProgramCacheKey=()=>'peixe-ink-v1';
 const turtleGeo=(()=>{const B=Merger();
  {const g=new T.SphereGeometry(1,22,12,0,TAU,0,PI/2).toNonIndexed(),p=g.attributes.position,col=new Float32Array(p.count*3),c=new T.Color();
   for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    // escudos hexagonais: células com borda clara
    const u=Math.atan2(x,z)*2.6,v=y*3.4,cu=u-Math.round(u),cv=v-Math.round(v+(Math.round(u)%2)*.5)+(Math.round(u)%2)*.5,edge=Math.max(Math.abs(cu),Math.abs(cv)*1.15);
    c.set('#4d5a2a').lerp(new T.Color('#6f7a38'),Math.max(0,1-edge*2));if(edge>.42)c.set('#c9b56a');if(y<.12)c.set('#3a4420');
    p.setXYZ(i,x*.5,y*.27,z*.62);col.set([c.r,c.g,c.b],i*3);}
   g.setAttribute('color',new T.BufferAttribute(col,3));B.add(g);}
  {const g=new T.CircleGeometry(1,20);g.rotateX(PI/2);g.scale(.48,1,.6);g.translate(0,.005,0);B.add(g,'#d8c890');}
  B.limb([0,.04,.55],[0,.08,.72],.09,'#6a7a3a',.08);B.ball(0,.1,.8,.11,'#6a7a3a',1,.85,1.25);
  for(const s of [-1,1]){B.ball(s*.07,.15,.87,.022,'#0c0c0c');B.ball(s*.05,.13,.94,.012,'#e8c040');}
  {const g=new T.ConeGeometry(.04,.14,6);g.rotateX(-PI/2);g.translate(0,.03,-.66);B.add(g,'#6a7a3a');}
  return B.build();})();
 const legGeo=(()=>{const g=new T.SphereGeometry(1,10,6);g.scale(.07,.035,.17);g.translate(0,0,.12);const B=Merger();B.add(g,'#6a7a3a');return B.build();})();
 const tMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.6,side:T.DoubleSide});
 /* pato (desenho de referência): pata-real marrom com pintas, barriga mais clara, cabeça com faixa escura no olho,
    colar claro, bico laranja, asa com espelho azul-escuro de borda branca, cauda clara, patas e pés laranja com membrana.
    patinho: amarelo fofinho, bico e patas laranja. Malha suave com cor por vértice (o contorno é colocado no duckModel). */
 const PC={zc:-.02,L:.36,W:t=>.205*(1-.32*Math.pow(Math.max(0,-t),1.5))*(1+.04*Math.max(0,t)),H:t=>.155*(1-.28*Math.pow(Math.max(0,-t),1.5)),
  cy:t=>.2+.075*Math.max(0,-t)**2+.02*Math.max(0,t)**2,
  // meia-largura do corpo na altura y e posição z (a asa dobrada usa para encostar)
  larg(y,z){const t=Math.max(-1,Math.min(1,(z-this.zc)/this.L)),yn=(y-this.cy(t))/(this.H(t)*(y<this.cy(t)?.9:1));return this.W(t)*Math.sqrt(Math.max(0,1-t*t-yn*yn));}};
 window.arcanoPatoCorpo=PC;
 function duckGeo(adult){const B=window.arcanoIB(),BL=window.arcanoIB(),c=h=>new T.Color(h);
  const elR=(x,y,z,rx,ry,rz,rot,fn,seg)=>{const g=new T.SphereGeometry(1,seg||22,Math.max(10,((seg||22)*.7)|0));g.scale(rx,ry,rz);g.rotateX(rot||0);g.translate(x,y,z);B.add(g,null,fn);};
  const laranja='#e9862c';
  const forma=(zc,Lz,W,H,cy,fn,seg,cima)=>{const g=new T.SphereGeometry(1,seg,Math.round(seg*.62)),p=g.attributes.position;
   for(let i=0;i<p.count;i++){const X=p.getX(i),Y=p.getY(i),Z=p.getZ(i);p.setXYZ(i,X*W(Z),cy(Z)+Y*H(Z)*(Y>0?(cima||1):1),zc+Z*Lz);}B.add(g,null,fn);};
  // pena da cauda: lâmina achatada que afina até a ponta; ab = abertura para o lado, sob = inclinação para cima
  const pena=(o,L,w,h,ab,sob,fn)=>{const g=new T.SphereGeometry(1,14,9),p=g.attributes.position;
   for(let i=0;i<p.count;i++){const X=p.getX(i),Y=p.getY(i),Z=p.getZ(i),t=(1-Z)/2,af=Math.pow(Math.max(0,1-t),.55)*(t<.15?.75+t*1.6:1);p.setXYZ(i,X*w*af,Y*h*af+.006*t*t*0,-t*L);}
   g.rotateX(sob);g.rotateY(ab);g.translate(o[0],o[1],o[2]);B.add(g,null,fn);};
  const leque=(o,n,L0,w,h,abre,sob,fn,curva)=>{for(let i=0;i<n;i++){const k=n>1?i/(n-1)*2-1:0,camada=1-Math.abs(k);
   pena([o[0]+k*w*.9,o[1]+camada*h*1.5,o[2]],L0*(.78+.22*camada),w,h,-k*abre,sob+(curva||0)*Math.abs(k),fn);}};
  // bico de pato: chato e largo, um pouco mais largo na ponta (espátula), descendo da testa; unha escura na ponta, narinas e linha da boca
  const bico=(zc,Lz,w,h,y0,dy,k)=>forma(zc,Lz,Z=>w*(1+.16*Z)*(Z>.75?Math.sqrt(Math.max(0,1-((Z-.75)/.25)**2))*.4+.6:1),Z=>h*(1-.18*Z)*(Z>.7?Math.sqrt(Math.max(0,1-((Z-.7)/.3)**2))*.55+.45:1),Z=>y0-dy*Z+(Z>.7?h*.25*(Z-.7)/.3:0),
   (x,y,z,nx,ny,nz,cc)=>{const Z=(z-zc)/Lz;cc.copy(c(laranja));if(ny<-.2)cc.lerp(c('#f2a35a'),.35);if(Math.abs(ny)<.3&&y<y0-dy*Z)cc.copy(c('#b5601f'));
    if(Z>.82&&ny>.2)cc.copy(c('#6a3d1c'));if(Z>-.45&&Z<-.2&&ny>.4&&Math.abs(Math.abs(x)-w*.35)<w*.13)cc.copy(c('#7a4420'));},28,k||.75);
  const pe=(k,x0,z0,y1,r,y0)=>{y1=y1||-.12;r=r||1;y0=y0==null?.1:y0;BL.perna([[k*x0,y0,z0-.01],[k*(x0+.008),(y0+y1)/2+.01,z0-.015],[k*(x0+.01),y1+.012,z0+.0],[k*(x0+.01),y1,z0+.02]],.017*r,.012*r,laranja);
   for(const a of [-.45,0,.45])BL.perna([[k*(x0+.01),y1-.003,z0+.02],[k*(x0+.01)+Math.sin(a)*.085*r,y1-.008,z0+.02+Math.cos(a)*.085*r]],.0085*r,.0065*r,laranja);
   const sh=new T.Shape();sh.moveTo(0,0);for(const a of [-.45,-.2,0,.2,.45])sh.lineTo(Math.sin(a)*.085,Math.cos(a)*.085);sh.lineTo(0,0);const w=new T.ShapeGeometry(sh);w.scale(r,r,1);w.rotateX(PI/2);w.translate(k*(x0+.01),y1-.008,z0+.02);BL.add(w,'#ef9440');};
  if(adult){
   const pintas=(x,y,z)=>{const q=.055,i=Math.floor(z/q),j=Math.floor(y/q),h=Math.abs(Math.sin(i*12.9+j*78.2+Math.sign(x)*3.1)*437.5)%1,u=z/q-i-.5,v=y/q-j-.5+(h-.5)*.3;return (Math.abs(v+Math.abs(u)*.8)<.17&&Math.abs(u)<.38)?1:0;};
   const corpo=(x,y,z,nx,ny,nz,cc)=>{cc.copy(c('#8f7458'));cc.lerp(c('#c9b69c'),Math.max(0,-ny-.05)*.9);if(pintas(x,y,z)&&ny>-.45)cc.copy(c('#5a4431'));};
   {const g=new T.SphereGeometry(1,72,44),p=g.attributes.position;for(let i=0;i<p.count;i++){const X=p.getX(i),Y=p.getY(i),t=p.getZ(i);p.setXYZ(i,X*PC.W(t),PC.cy(t)+Y*PC.H(t)*(Y<0?.9:1),PC.zc+t*PC.L);}B.add(g,null,corpo);}
   {const branca=(x,y,z,nx,ny,nz,cc)=>{cc.copy(c('#ebe5d7'));const r=Math.abs(Math.sin(x*60));if(r<.1&&z>-.44)cc.lerp(c('#b39c80'),.4);if(ny>.5&&z>-.4)cc.lerp(c('#a68b6c'),.35);};
    leque([0,.282,-.32],7,.19,.05,.014,.17,.4,branca,-.05);leque([0,.3,-.31],5,.13,.045,.013,.13,.48,branca,-.03);
    elR(0,.29,-.33,.08,.045,.08,.35,(x,y,z,nx,ny,nz,cc)=>{cc.copy(c('#8f7458'));cc.lerp(c('#d8ccb8'),Math.max(0,-ny)*.6);},18);}
   // pescoço e cabeça numa peça só: um tubo que sobe do peito, curva para a frente e engrossa na cabeça (sem “bolinha em cima do pescoço”)
   {const KEY=[[0,.2,.14],[0,.32,.205],[0,.42,.238],[0,.485,.252],[0,.525,.292],[0,.523,.338],[0,.507,.385],[0,.49,.435],[0,.479,.49],[0,.474,.53]],cur=new T.CatmullRomCurve3(KEY.map(k=>new T.Vector3(...k)));
    const PR=[[.1,.1],[.084,.084],[.069,.071],[.077,.083],[.083,.088],[.072,.07],[.054,.045],[.043,.028],[.046,.021],[.044,.018]],n=110,m=40,X=new T.Vector3(1,0,0),up=new T.Vector3(),pos=[],idx=[];
    for(let i=0;i<=n;i++){const s=i/n,P=cur.getPoint(s),tg=cur.getTangent(s);up.crossVectors(X,tg).normalize();
     const fp=s*(PR.length-1),k=Math.min(PR.length-2,Math.floor(fp)),t=fp-k,e=t*t*(3-2*t),w=PR[k][0]+(PR[k+1][0]-PR[k][0])*e,d=PR[k][1]+(PR[k+1][1]-PR[k][1])*e;
     let cap=1;if(s<.04)cap=Math.sqrt(Math.max(0,1-(1-s/.04)**2));if(s>.94)cap=Math.min(cap,Math.sqrt(Math.max(0,1-(1-(1-s)/.06)**2)));
     for(let j=0;j<m;j++){const a=j/m*TAU;pos.push(P.x+Math.cos(a)*w*cap,P.y+up.y*Math.sin(a)*d*cap,P.z+up.z*Math.sin(a)*d*cap);}}
    for(let i=0;i<n;i++)for(let j=0;j<m;j++){const a=i*m+j,b=i*m+(j+1)%m,cq=(i+1)*m+j,dq=(i+1)*m+(j+1)%m;idx.push(a,cq,b,b,cq,dq);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);
    B.add(g,null,(x,y,z,nx,ny,nz,cc)=>{cc.copy(c('#9c8268'));if(Math.abs(y-.4)<.025)cc.lerp(c('#c9bba4'),.3*(1-Math.abs(y-.4)/.025));
     const hd=Math.min(1,Math.max(0,(y-.44)/.06));if(hd>0){const h=new T.Color('#a68e72');if(ny>.6&&z>.21)h.copy(c('#6a523c'));
      {const dd=Math.abs(y-.558-(z-.31)*.1+(z-.31)*(z-.31)*.6);if(Math.abs(x)>.03&&z<.41&&z>.18&&dd<.03)h.lerp(c('#4a3626'),dd<.017?1:.55);}
      if(ny<-.3&&z>.27)h.lerp(c('#d5c6ae'),.5);if(ny<.6&&ny>-.1&&z>.3)h.lerp(c('#c3b096'),.35);cc.lerp(h,hd);}
     const bz=Math.min(1,Math.max(0,(z-.378+(y-.5)*.12)/.006));if(bz>0){const b=new T.Color(laranja);const yc=.507-(z-.385)*.31;if(ny<-.25)b.lerp(c('#f2a35a'),.35);if(Math.abs(nx)>.8&&y<yc+.002)b.copy(c('#b5601f'));
      if(z>.519&&ny>.1)b.lerp(c('#6a3d1c'),.8);if(z>.395&&z<.415&&ny>.45&&Math.abs(Math.abs(x)-.016)<.007)b.copy(c('#7a4420'));cc.lerp(b,bz);}});}
   for(const k of [-1,1]){B.ell(k*.064,.553,.31,.013,.022,.022,'#f0ece2',null,14);B.ell(k*.069,.553,.315,.011,.018,.018,'#0b0b0c',null,14);B.ell(k*.077,.56,.322,.004,.006,.006,'#ffffff',null,6);
    pe(k,.075,.02,-.07,1,.09);}}
  else{
   const am=(x,y,z,nx,ny,nz,cc)=>{cc.copy(c('#f4d65a'));cc.lerp(c('#d9b23a'),Math.max(0,-ny)*.35);cc.lerp(c('#fff1a8'),Math.max(0,ny-.4)*.4);};
   elR(0,.15,-.01,.14,.13,.17,-.1,am,22);
   elR(0,.31,.06,.105,.1,.1,0,am,22);
   leque([0,.175,-.15],5,.07,.022,.014,.35,.75,am,.1);
   bico(.172,.048,.031,.02,.295,.012);
   for(const k of [-1,1]){B.ell(k*.075,.33,.12,.016,.022,.022,'#0b0b0c',null,10);B.ell(k*.085,.338,.13,.006,.007,.007,'#ffffff',null,6);pe(k,.05,.02,-.05,.75,.06);}}
  const g=B.build();g.pernas=BL.build();return g;}
 const dMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.8,side:T.DoubleSide}),DG=[duckGeo(true),duckGeo(false)];
 const nubG=(()=>{const B=window.arcanoIB(),g=new T.SphereGeometry(1,16,11);g.scale(.04,.06,.1);g.rotateX(.15);g.translate(0,-.05,-.06);
  B.add(g,null,(x,y,z,nx,ny,nz,cc)=>{cc.set('#f4d65a');cc.lerp(new T.Color('#d9b23a'),.25+Math.max(0,-ny)*.2);});return B.build();})();
 const wingG=(()=>{const g=new T.PlaneGeometry(1,1,42,22),p=g.attributes.position,c=h=>new T.Color(h);
  for(let i=0;i<p.count;i++){const u=p.getX(i)+.5,v=.5-p.getY(i),fr=.11-.07*u*u,ch=.24-.06*u+.05*Math.sin(Math.min(1,u*1.3)*PI)+.035*Math.abs(Math.sin(u*PI*7)),z=fr-v*ch,x=u*.6;p.setXYZ(i,x,-.01*Math.sin(u*PI)+.02*v,z);}
  g.computeVertexNormals();const B=window.arcanoIB();B.add(g,null,(x,y,z,nx,ny,nz,cc)=>{const u=x/.6;cc.copy(c('#8a6f52'));if(u>.62)cc.lerp(c('#4e3c2c'),.75);if(Math.sin(u*PI*7)>.82&&u>.15)cc.lerp(c('#5e4a36'),.5);
   const t=z+.1+.06*u;if(u>.1&&u<.5){if(Math.abs(t)<.025)cc.copy(c('#35326e'));else if(Math.abs(t)<.04)cc.copy(c('#f6f4ee'));}if(z>.06-.07*u*u)cc.lerp(c('#a68e72'),.5);});return B.build();})();
 const patoInk=new T.MeshBasicMaterial({color:'#1e1a16',side:T.BackSide});patoInk.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed+=normal*.0065;');};patoInk.customProgramCacheKey=()=>'pato-ink-v2';
 const patoInkP=patoInk.clone();patoInkP.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>'+String.fromCharCode(10)+' transformed+=normal*.003;');};patoInkP.customProgramCacheKey=()=>'pato-ink-p2';
 const patoInkF=patoInk.clone();patoInkF.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>'+String.fromCharCode(10)+' transformed+=normal*.0055;');};patoInkF.customProgramCacheKey=()=>'pato-ink-f2';
 // patinador: corpo fino e comprido marrom, cabeça com olhos e antenas, patas da frente curtas,
 // patas do meio e de trás muito longas, com o "joelho" alto e a ponta apoiada na água
 const strGeo=(()=>{const B=window.arcanoIB(),c=h=>new T.Color(h),pata='#5a4a38';
  B.ell(0,.16,0,.055,.04,.34,null,(x,y,z,nx,ny,nz,cc)=>{cc.copy(c('#5e4a36'));if(ny>.6&&Math.abs(x)<.018)cc.copy(c('#8a7458'));if(ny<-.4)cc.lerp(c('#3a2e22'),.5);},16);
  B.ell(0,.17,.36,.05,.045,.06,'#4e3e2e',null,12);
  for(const k of [-1,1]){B.ell(k*.04,.19,.38,.018,.018,.016,'#120e0a',null,8);
   B.perna([[k*.02,.2,.41],[k*.05,.26,.52],[k*.09,.3,.62]],.009,.005,pata);
   B.perna([[k*.04,.13,.26],[k*.12,.18,.36],[k*.16,.06,.46],[k*.18,0,.5]],.013,.008,pata);
   B.perna([[k*.05,.13,.08],[k*.3,.3,.22],[k*.62,.12,.48],[k*.78,0,.62]],.013,.006,pata);
   B.perna([[k*.05,.13,-.04],[k*.28,.28,-.2],[k*.55,.1,-.62],[k*.66,0,-.8]],.013,.006,pata);}
  return B.build();})();
 return {uT,fishGeo,SP,fishMat,fishInk,turtleGeo,legGeo,tMat,duckGeo,dMat,DG,wingG,strGeo,patoInk,patoInkF,patoInkP,nubG};}
/* ---------- tartaruga (estilo da referência) ----------
   Casco abaulado com placas hexagonais (borda marrom larga, anel amarelo, centro claro com contorno fino) e uma
   fileira de placas marginais retangulares; plastrão amarelo aparecendo sob a borda. Corpo dentro do casco: patas
   grossas e o pescoço saem de baixo da borda. Medidas em "unidades de tartaruga" (pés em y=0, frente para +z).
   As patas ficam em grupos no "quadril": a animação continua girando L.l.rotation.x (andar/nadar). */
const tartInk=new T.MeshBasicMaterial({color:'#1e1a16',side:T.BackSide});
tartInk.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed+=normal*.012;');};
tartInk.customProgramCacheKey=()=>'tart-ink-v3';
const TART={SX:.5,SY:.51,SZ:.64,Y0:.48,HIP:.46};
function tartarugaKit(K){if(K._tart)return K._tart;
 const Bl=window.arcanoPele.Builder,mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.92});
 const C=h=>{const c=new T.Color(h);return [c.r,c.g,c.b];};
 const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
 const sst=(a,b,t)=>{t=clamp((t-a)/(b-a),0,1);return t*t*(3-2*t);};
 const fr=v=>v-Math.floor(v);
 const {SX,SY,SZ,Y0}=TART;
 const hexd=(fx,fy)=>Math.max(Math.abs(fy),Math.abs(fx)*.87+Math.abs(fy)*.5);
 // placa: devolve [distância ao centro (0..1), é marginal?]
 const placa=(x,y,z)=>{
  const v=Math.asin(clamp(y,-1,1))/(PI/2);
  if(v<.24){const u=(Math.atan2(x,z)+PI)/TAU*26,fx=2*fr(u)-1,fy=2*clamp((v+.14)/.38,0,1)-1;return [Math.max(Math.abs(fx)*1.05,Math.abs(fy)),1];}
  const ax=Math.abs(x);
  if(ax<.26){const fy=2*fr((z+.95)/1.9*5)-1,fx=x/.26;return [hexd(fx,fy*1.05),0];}
  const fx=2*clamp((ax-.26)/(.93-.26),0,1)-1,fy=2*fr((z+.97)/1.94*4)-1;return [hexd(fx*.95,fy),0];};
 const groove=C('#3a2414'),brown=C('#77492a'),brown2=C('#8e5c35'),yellow=C('#c8973c'),pale=C('#e8cc8a'),line=C('#a8743a');
 const corPlaca=(d,marg)=>{
  if(marg){let c=mix(yellow,brown2,sst(.42,.48,d));c=mix(c,brown,sst(.62,.7,d));return mix(c,groove,sst(.9,.96,d));}
  let c=mix(pale,line,sst(.26,.29,d));c=mix(c,yellow,sst(.3,.33,d));c=mix(c,brown2,sst(.48,.52,d));c=mix(c,brown,sst(.6,.64,d));return mix(c,groove,sst(.9,.96,d));};
 const shell=(()=>{const g=new T.SphereGeometry(1,240,120,0,TAU,0,PI*.57),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),d=placa(x,y,z)[0],sulco=sst(.88,1,d)*.014;
   p.setXYZ(i,x*SX-x*sulco,Y0+y*SY-Math.max(0,y)*sulco,z*SZ-z*sulco);}
  const B=Bl();B.add(g,null,null,(X,Y,Z)=>{const q=placa(X/SX,(Y-Y0)/SY,Z/SZ),c=corPlaca(q[0],q[1]),v=.96+.04*Math.sin(X*61+Z*47+Y*29);return [c[0]*v,c[1]*v,c[2]*v];});
  return B.build();})();
 // plastrão (faixa amarela sob a borda) e o corpo por dentro
 const pele=C('#77705a'),peleClara=C('#968f74'),escura=C('#5a5442');
 const under=Bl();
 under.ell(0,Y0-.15,0,SX*.94,.1,SZ*.98,null,(x,y,z)=>{const s=Math.abs(Math.sin(z*9))<.1||Math.abs(x)<.012;return s?C('#9a7636'):C('#c9a24e');},28);
 under.ell(0,Y0-.06,0,SX*.86,.13,SZ*.86,null,()=>pele,20);
 // pata: coluna grossa (mais larga em cima), cotovelo leve, pé largo com unhas; escamas em "U" na frente, dobras atrás
 const pata=(front)=>{const B=Bl(),r=front?.135:.14,L=TART.HIP+.02;
  const col=(x,y,z,nx,ny,nz)=>{let c=pele;
   if(front&&nz>.15&&Math.sin(y*46)>.35&&Math.sin(x*60+y*20)>-.2)c=escura;
   if(!front&&Math.abs(Math.sin(y*38))>.93)c=escura;
   if(nz<-.4)c=mix(c,peleClara,.2);return c;};
  B.sweep([[0,.02,0],[0,-L*.35,front?.03:0],[0,-L*.7,front?.02:.01],[0,-L+.04,front?.04:.02]],[[r*1.25,r*1.2],[r*1.05,r],[r*.88,r*.85],[r*.92,r*.9]],{n:16,m:16,ca:.15,cb:0},null,col);
  B.ell(0,-L+.035,front?.05:.03,r*1.12,.04,r*1.25,null,()=>pele,16);
  for(let k=0;k<5;k++){const a=(k-2)*.36;B.ell(Math.sin(a)*r*.95,-L+.022,(front?.05:.03)+Math.cos(a)*r*1.12,.02,.016,.026,'#ddd3b4',null,8);}
  return B.build();};
 // pescoço grosso subindo em diagonal + cabeça grande arredondada
 const head=Bl();
 const cab=(x,y,z,nx,ny,nz)=>{let c=ny<-.35?peleClara:pele;
  if(y>.62&&ny>.25&&Math.sin(x*48+z*13)*Math.sin(z*41-x*9)>.45)c=escura;
  if(z<.86&&Math.abs(Math.sin((z*1.2+y)*30))>.94&&nx*nx>.3)c=mix(c,escura,.7);
  return c;};
 head.sweep([[0,.3,.36],[0,.46,.66],[0,.57,.86]],[[.18,.165],[.145,.135],[.12,.115]],{n:16,m:16,ca:.1,cb:.15},null,cab);
 head.ell(0,.63,.99,.14,.125,.19,null,cab,22);
 head.ell(0,.605,1.12,.1,.09,.08,null,cab,18);
 for(const s of [-1,1]){
  head.ell(s*.098,.675,1.04,.052,.056,.046,'#e2dcc2',null,14);
  head.ell(s*.112,.675,1.046,.041,.045,.035,'#0d0b0a',null,14);
  head.ell(s*.132,.692,1.058,.012,.012,.009,'#ffffff',null,8);
  head.sweep([[s*.05,.56,1.19],[s*.095,.565,1.12],[s*.126,.585,.99],[s*.135,.605,.92]],[[.006,.006],[.006,.006],[.006,.006],[.004,.004]],{n:12,m:6,ca:0,cb:.2},'#2a241c');
  head.ell(s*.022,.63,1.196,.008,.007,.005,'#1a1712',null,6);}
 const tail=Bl();tail.sweep([[0,Y0-.08,-.56],[0,Y0-.13,-.66],[0,Y0-.18,-.72]],[[.045,.04],[.028,.025],[.006,.006]],{n:8,m:10,ca:0,cb:.2},null,()=>pele);
 return K._tart={mat,shell,under:under.build(),pataF:pata(true),pataT:pata(false),head:head.build().translate(0,.08,0),tail:tail.build()};}
function turtleModel(K,s){const P=tartarugaKit(K),g=new T.Group(),inner=new T.Group();g.add(inner);inner.scale.setScalar(s);
 const ink=(geo)=>{const m=new T.Mesh(geo,P.mat);m.castShadow=true;m.add(new T.Mesh(geo,tartInk));return m;};
 inner.add(ink(P.shell),ink(P.under),ink(P.head),ink(P.tail));
 const legs=[];
 for(const [x,z,s] of [[.22,.3,1],[-.22,.3,-1],[.22,-.3,1],[-.22,-.3,-1]]){
  const l=new T.Group();l.position.set(x,TART.HIP,z);inner.add(l);
  const m=ink(z>0?P.pataF:P.pataT);m.rotation.z=s*.34;m.rotation.x=z>0?-.14:.12;l.add(m);legs.push({l,s,z});}
 return {g,inner,legs};}
/* asa da pata com volume: a MESMA asa fica dobrada rente ao corpo (arredondada até a cauda, com o espelho azul embaixo
   e as primárias por cima) e abre no voo. Superfície em lente (u = da raiz até a ponta, cv = da borda da frente até as
   pontas das penas). As penas apontam sempre para trás; ao abrir, as raízes se espalham para fora e a ponta gira para o lado. */
function asaPatoGeo(px,py,pz){
 // largura do corpo da pata (mesma forma do duckGeo) para a asa dobrada encostar nele
 const hug=(y,z)=>Math.max(window.arcanoPatoCorpo.larg(y,z),.05);const NU=60,NT=44,P=new Float32Array((NU+1)*NT*3),C=new Float32Array((NU+1)*NT*3),I=[],cc=new T.Color(),c=h=>new T.Color(h);
 for(let i=0;i<=NU;i++)for(let j=0;j<NT;j++){const u=i/NU,th=j/NT*TAU,cv=.5-.5*Math.cos(th),o=(i*NT+j)*3;
  cc.copy(c('#86694c'));if(cv<.32)cc.lerp(c('#a4896b'),.45);
  {const q=Math.floor(u*9),r=Math.floor(cv*6),h=Math.abs(Math.sin(q*12.9+r*78.2)*437.5)%1,a=u*9-q-.5,b=cv*6-r-.5+(h-.5)*.3;if(cv<.5&&Math.abs(b+Math.abs(a)*.7)<.16&&Math.abs(a)<.36)cc.copy(c('#5a4431'));}
  if(u>.6&&cv>.3)cc.lerp(c('#5a4838'),.8);
  if(u>.06&&u<.55){if(cv>.56&&cv<.84)cc.copy(c('#35326e'));else if((cv>.45&&cv<=.56)||(cv>=.84&&cv<.94))cc.copy(c('#f6f4ee'));}
  if(cv>.45&&((u*9)%1)<.1)cc.multiplyScalar(.78);
  C[o]=cc.r;C[o+1]=cc.g;C[o+2]=cc.b;}
 for(let i=0;i<NU;i++)for(let j=0;j<NT;j++){const a=i*NT+j,b=i*NT+(j+1)%NT,d=(i+1)*NT+j,e=(i+1)*NT+(j+1)%NT;I.push(a,d,b,b,d,e);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(P,3));g.setAttribute('color',new T.BufferAttribute(C,3));g.setIndex(I);
 const ss=x=>x*x*(3-2*x),O=new T.Vector3(),Cv=new T.Vector3(),N=new T.Vector3(),A=new T.Vector3(),B2=new T.Vector3();
 g.userData.k=-1;
 // k=0 dobrada, k=1 aberta
 g.pose=(k,bd)=>{bd=bd||0;if(Math.abs(k-g.userData.k)<.002&&Math.abs(bd-(g.userData.bd||0))<.004)return;g.userData.k=k;g.userData.bd=bd;const s=ss(Math.max(0,Math.min(1,k))),f=1-s;
  for(let i=0;i<=NU;i++){const u=i/NU,su=Math.sin(PI*u);
   // dobrada: raízes descem do alto (primárias, u=1) para baixo (secundárias, u=0); frente arredondada; penas para trás
   A.set(.014*u,-.15+.15*u,-.01+.05*su);B2.set(.26*u,.012*su,.03-.07*u*u);O.copy(A).multiplyScalar(f).addScaledVector(B2,s);
   const an=1.2*Math.pow(u,1.6);A.set(0,-.12+.1*u,-1).normalize();B2.set(Math.sin(an),-.03,-Math.cos(an));Cv.copy(A).multiplyScalar(f).addScaledVector(B2,s).normalize();
   A.set(1,0,0);B2.set(0,1,0);N.copy(A).multiplyScalar(f).addScaledVector(B2,s);N.addScaledVector(Cv,-N.dot(Cv)).normalize();
   const L=(.23+.2*u)*(.78+.22*Math.min(1,u*4))*(1+.075*Math.sqrt(Math.abs(Math.sin(u*PI*(u>.55?6:9))))-.03)*(1-s*.3*ss(Math.max(0,Math.min(1,(u-.74)/.14)))*Math.pow(1-Math.abs(Math.sin(u*PI*9)),2.5)),T0=.034*Math.pow(su,.45);
   for(let j=0;j<NT;j++){const th=j/NT*TAU,cv=.5-.5*Math.cos(th),side=Math.sin(th),o=(i*NT+j)*3,t=T0*(1-.8*cv)*side;
    // dobrada: a ponta das penas acompanha o corpo (fecha para dentro e sobe um pouco até a cauda)
    const mx=O.x+Cv.x*L*cv,my=O.y+Cv.y*L*cv,mz=O.z+Cv.z*L*cv,x=mx+N.x*t+f*(hug(my+py,mz+pz)+.03-px-mx),y=my+N.y*t,z=mz+N.z*t;
    if(bd&&u>.3){const wv=ss(Math.min(1,(u-.3)/.45))*bd*s,ca=Math.cos(wv),sa=Math.sin(wv),xw=.11,dx=x-xw;P[o]=xw+dx*ca-y*sa;P[o+1]=dx*sa+y*ca;}else{P[o]=x;P[o+1]=y;}P[o+2]=z;}}
  g.attributes.position.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();};
 g.pose(0);return g;}
function duckModel(K,adult,s){const g=new T.Group(),m=new T.Mesh(adult?K.DG[0]:K.DG[1],K.dMat);g.add(m);if(K.patoInk){const k=new T.Mesh(m.geometry,adult?K.patoInk:(K.patoInkF||K.patoInk));k.userData.ink=true;m.add(k);}
 if(m.geometry.pernas){const p=new T.Mesh(m.geometry.pernas,K.dMat);m.add(p);if(K.patoInkP){const k=new T.Mesh(m.geometry.pernas,K.patoInkP);k.userData.ink=true;p.add(k);}}g.scale.setScalar(s);const wings=[];
 let asa=null,ag2=null;if(adult){const ag=asaPatoGeo(.15,.33,.1);ag2=ag;asa=k=>ag.pose(k);for(const s of [-1,1]){const r=new T.Group();r.position.set(s*.15,.33,.1);r.scale.x=s;m.add(r);const w=new T.Mesh(ag,K.dMat);if(K.patoInk){const k=new T.Mesh(ag,K.patoInk);k.userData.ink=true;w.add(k);}r.add(w);wings.push({r,s});}}
 const voo=(wk,ph)=>{if(!asa)return;const e=wk*wk*(3-2*wk),c=Math.cos(ph),sn=Math.sin(ph);ag2.pose(wk*(1-.2*Math.max(0,c)*e),-.75*c*e);
  for(const w of wings)w.r.rotation.z=w.s*(.12+.85*sn)*e;};
 const tocos=[];if(!adult&&K.nubG)for(const s of [-1,1]){const r=new T.Group();r.position.set(s*.12,.23,.03);r.scale.x=s;m.add(r);const w=new T.Mesh(K.nubG,K.dMat);if(K.patoInkF){const k=new T.Mesh(K.nubG,K.patoInkF);k.userData.ink=true;w.add(k);}r.add(w);tocos.push({r,s});}
 // a = 0 recolhido … 1 aberto para o lado
 const bater=a=>{for(const t of tocos){t.r.rotation.y=-t.s*a*.95;t.r.rotation.z=t.s*a*.7;}};
 return {g,m,wings,asa:k=>{if(asa)asa(k);},voo,bater};}

window.arcanoKitAgua={kitAgua,turtleModel,duckModel};

function install(){
 const api=window.arcanoWaterV1226,FA=window.arcanoFundoAquatico,FK=window.arcanoFaunaKit,rv=window.arcanoAnimeRiver;
 if(!api||!api.scene||!FA||!FA.water||!FK||!rv){setTimeout(install,800);return;}
 const {Merger,state}=FK,water=FA.water,ground=FA.ground,scene=api.scene;
 const root=new T.Group();root.name='Peixes e bichos da água';scene.add(root);
 const ring=(x,z,str)=>{const u=rv.material.uniforms.uRings.value;let b=u[0];for(const s of u)if(s.z<b.z)b=s;b.set(x,z,performance.now()/1000,str);};
 const pDist=(x,z)=>Math.hypot(x-state.px,z-state.pz);
 const playerWet=()=>{const w=water(state.px,state.pz);return !!(w&&w.depth>.15&&state.py<w.level+.4);};
 const KA=kitAgua(Merger),{uT,fishGeo,SP,fishMat,fishInk,turtleGeo,legGeo,tMat,duckGeo,dMat,DG,wingG,strGeo}=KA;

 /* ================= PEIXES (instanciados, a cauda ondula no shader) ================= */
 // modelo de comprimento 1 ao longo de +z (cabeça na frente)
 const CAP=mobile?{lambari:40,koi:8,truta:8,girino:30}:{lambari:96,koi:16,truta:16,girino:70};
 const IM={},SW={};
 for(const k in SP){const g=fishGeo(SP[k]),n=CAP[k];const sw=new T.InstancedBufferAttribute(new Float32Array(n*2),2);sw.setUsage(T.DynamicDrawUsage);g.setAttribute('aSwim',sw);
  const im=new T.InstancedMesh(g,fishMat,n);im.count=0;im.frustumCulled=false;im.name='Peixes · '+k;root.add(im);IM[k]=im;SW[k]=sw;
  if(g.inkGeo){const ig=g.inkGeo;ig.setAttribute('aSwim',sw);const ink=new T.InstancedMesh(ig,fishInk,n);ink.instanceMatrix=im.instanceMatrix;ink.count=0;ink.frustumCulled=false;ink.onBeforeRender=()=>{ink.count=im.count;};root.add(ink);}}
 const schools=[];
 const SIZE={lambari:[.18,.25],koi:[.5,.72],truta:[.42,.58],girino:[.06,.085]},SPEED={lambari:1.1,koi:.42,truta:.7,girino:.35},FLEE={lambari:3.4,koi:1.5,truta:4,girino:1.4};
 const MIND={lambari:.4,koi:.6,truta:.35,girino:.06},MAXD={lambari:99,koi:99,truta:99,girino:.45};
 function spot(kind,cx,cz,r0,r1){for(let i=0;i<40;i++){const a=rr(0,TAU),d=rr(r0,r1),x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d,w=water(x,z);if(!w||w.depth<MIND[kind]||w.depth>MAXD[kind])continue;
   const fl=Math.hypot(w.flow[0],w.flow[1]);if(kind==='koi'&&!w.lake)continue;if(kind==='truta'&&(w.lake||fl<.3))continue;if(kind==='lambari'&&fl>.6&&Math.random()<.5)continue;return {x,z,w};}return null;}
 function spawnSchool(kind,s){const n=kind==='lambari'?(8+((Math.random()*8)|0)):kind==='koi'?(2+((Math.random()*3)|0)):kind==='truta'?(1+((Math.random()*3)|0)):(10+((Math.random()*10)|0));
  const used=schools.filter(q=>q.kind===kind).reduce((a,q)=>a+q.fish.length,0);if(used+n>CAP[kind])return;
  const S={kind,home:{x:s.x,z:s.z},tx:s.x,tz:s.z,ty:0,t:0,fish:[],flee:0,lake:s.w.lake};
  for(let i=0;i<n;i++){const x=s.x+rr(-.8,.8),z=s.z+rr(-.8,.8),w=water(x,z)||s.w;S.fish.push({x,z,y:w.level-Math.min(w.depth*.5,.4),vx:rr(-.2,.2),vy:0,vz:rr(-.2,.2),size:rr(...SIZE[kind]),ph:rr(0,TAU),jump:0,yaw:rr(0,TAU)});}
  schools.push(S);}
 const M4=new T.Matrix4(),Q=new T.Quaternion(),E=new T.Euler(),V=new T.Vector3(),S3=new T.Vector3();
 let koiCall=0;
 function updSchools(dt){
  const wet=playerWet(),near=Math.min(...[0].map(()=>1e9));
  // fica parado na beira de um lago → as carpas vêm pedir comida
  const pw=water(state.px,state.pz),bankLake=(()=>{for(const a of [0,1.6,3.1,4.7]){const w=water(state.px+Math.cos(a)*1.8,state.pz+Math.sin(a)*1.8);if(w&&w.lake)return w;}return null;})();
  koiCall=(!pw&&bankLake&&state.speed<.25)?koiCall+dt:0;
  const counts={lambari:0,koi:0,truta:0,girino:0};
  for(const S of schools){const k=S.kind,sp=SPEED[k];S.t-=dt;
   const dS=pDist(S.tx,S.tz),cx=S.fish.reduce((a,f)=>a+f.x,0)/S.fish.length,cz=S.fish.reduce((a,f)=>a+f.z,0)/S.fish.length,dp=pDist(cx,cz);
   if((wet&&dp<(k==='koi'?3:5))||(dp<2.2&&k!=='koi')||(k==='girino'&&dp<1.6)){if(S.flee<=0){const a=Math.atan2(cz-state.pz,cx-state.px);const s2=spot(k,cx+Math.cos(a)*7,cz+Math.sin(a)*7,0,4);if(s2){S.tx=s2.x;S.tz=s2.z;}S.flee=rr(2,4);}}
   if(S.flee>0)S.flee-=dt;
   else if(k==='koi'&&koiCall>1.6&&dp<14){S.tx=state.px+(cx-state.px)*.0+Math.cos(S.home.x)*.4;S.tz=state.pz;const w=water(S.tx,S.tz);if(!w){for(const a of [0,1.6,3.1,4.7]){const x=state.px+Math.cos(a)*2,z=state.pz+Math.sin(a)*2;if(water(x,z)){S.tx=x;S.tz=z;break;}}}S.feed=true;}
   else if(S.t<=0){S.feed=false;const s2=spot(k,S.home.x,S.home.z,0,k==='truta'?4:9);if(s2){S.tx=s2.x;S.tz=s2.z;}S.t=k==='truta'?rr(3,8):rr(2,6);}
   for(const f of S.fish){
    const w=water(f.x,f.z);if(!w){f.x=S.home.x;f.z=S.home.z;continue;}
    let ax=(S.tx-f.x)*.6,az=(S.tz-f.z)*.6;
    // cardume: separa dos vizinhos e acompanha o centro
    for(const o of S.fish){if(o===f)continue;const dx=f.x-o.x,dz=f.z-o.z,d2=dx*dx+dz*dz,r=f.size*2.2;if(d2<r*r&&d2>1e-6){ax+=dx/d2*.08;az+=dz/d2*.08;}}
    ax+=(cx-f.x)*.3+Math.sin(state.t*1.3+f.ph)*.4;az+=(cz-f.z)*.3+Math.cos(state.t*1.1+f.ph)*.4;
    if(k==='truta'&&S.flee<=0){const fl=w.flow;ax+=-fl[0]*.4;az+=-fl[1]*.4;}       // segura contra a correnteza
    const max=S.flee>0?FLEE[k]:(S.feed?sp*1.4:sp);
    f.vx+=ax*dt*3;f.vz+=az*dt*3;const v=Math.hypot(f.vx,f.vz);if(v>max){f.vx*=max/v;f.vz*=max/v;}
    if(k==='truta'&&S.flee<=0){f.vx+=w.flow[0]*.25*dt;f.vz+=w.flow[1]*.25*dt;}
    let nx=f.x+f.vx*dt,nz=f.z+f.vz*dt;const w2=water(nx,nz);
    if(!w2||w2.depth<MIND[k]*.6||w2.depth>MAXD[k]+.2){f.vx*=-.6;f.vz*=-.6;nx=f.x;nz=f.z;}
    f.x=nx;f.z=nz;const ww=w2||w;
    // profundidade: meio da coluna d'água; carpas pedindo comida sobem até a superfície
    const ty=S.feed&&k==='koi'?ww.level-.06:k==='girino'?ww.level-Math.min(ww.depth*.5,.12):ww.level-clamp(ww.depth*(.35+.25*Math.sin(f.ph+state.t*.3)),.12,1.6);
    // salto (lambari e truta), mais no fim da tarde
    if(f.jump>0){f.jump-=dt;const kk=1-f.jump/.7;f.y=ww.level-.05+Math.sin(kk*PI)*(.28+f.size*1.4);if(f.jump<=0){ring(f.x,f.z,.35);}}
    else{f.y+=(ty-f.y)*Math.min(1,dt*2);f.y=clamp(f.y,ww.bed+f.size*.25,ww.level-.04);
     if((k==='lambari'||k==='truta')&&S.flee<=0&&Math.random()<dt*(state.day>.05&&state.day<.5?.012:.003)&&ww.depth>.4){f.jump=.7;ring(f.x,f.z,.3);}}
    const hv=Math.hypot(f.vx,f.vz);if(hv>.03)f.yaw+=angTo(f.yaw,Math.atan2(f.vx,f.vz))*Math.min(1,dt*7);
    const pitch=f.jump>0?-Math.cos((1-f.jump/.7)*PI)*.9:0;
    const i=counts[k]++;if(i>=CAP[k])continue;
    Q.setFromEuler(E.set(pitch,f.yaw,0,'YXZ'));M4.compose(V.set(f.x,f.y,f.z),Q,S3.setScalar(f.size));IM[k].setMatrixAt(i,M4);
    SW[k].setXY(i,f.ph,(k==='girino'?16:8)+hv*(k==='koi'?6:12));}}
  for(const k in IM){IM[k].count=Math.min(CAP[k],counts[k]);IM[k].instanceMatrix.needsUpdate=true;SW[k].needsUpdate=true;}
 }

 /* ================= TARTARUGAS ================= */
 const turtles=[],TUR=mobile?2:4;
 function bankSpot(cx,cz){for(let i=0;i<60;i++){const a=rr(0,TAU),d=rr(8,38),x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d;if(water(x,z))continue;
   for(const b of [0,.8,1.6,2.4,3.2,4,4.8,5.6])for(const rd of [.9,1.6]){const wx=x+Math.cos(b)*rd,wz=z+Math.sin(b)*rd,w=water(wx,wz);if(w&&w.depth>.22&&Math.abs(ground(x,z)-w.level)<.9)return {x,z,y:ground(x,z),wx,wz,w,face:Math.atan2(wx-x,wz-z)};}}return null;}
 function makeTurtle(sp){const {g,inner,legs}=turtleModel(KA,rr(.38,.5));
  const t={g,inner,legs,sp,x:sp.x,y:sp.y,z:sp.z,yaw:sp.face+rr(-.5,.5),st:'bask',t:rr(4,9)};g.position.set(t.x,t.y,t.z);g.rotation.y=t.yaw;root.add(g);return t;}
 function updTurtle(t,dt){const dp=pDist(t.x,t.z),sp=t.sp;t.t-=dt;
  const paddle=a=>{for(const L of t.legs)L.l.rotation.x=Math.sin(state.t*a+(L.z>0?0:PI)+(L.s>0?0:PI/2))*.5;};
  if(t.st==='bask'){t.inner.rotation.x=0;if(dp<6||(dp<10&&state.speed>3)){t.st='slide';t.k=0;t.x0=t.x;t.z0=t.z;t.y0=t.y;t.yaw=Math.atan2(sp.wx-t.x,sp.wz-t.z);}paddle(0);}
  else if(t.st==='slide'){t.k+=dt/.9;const k=Math.min(1,t.k);t.x=lerp(t.x0,sp.wx,k);t.z=lerp(t.z0,sp.wz,k);t.y=lerp(t.y0,sp.w.level-.25,k);t.inner.rotation.x=.25*Math.sin(k*PI);paddle(10);
   if(k>=1){ring(t.x,t.z,.4);t.st='swim';t.t=rr(12,25);t.tx=t.x;t.tz=t.z;}}
  else if(t.st==='swim'){const w=water(t.x,t.z)||sp.w;paddle(4);
   const near=dp<2.6;
   if(Math.hypot(t.tx-t.x,t.tz-t.z)<.4||(near&&!t.fleeing)){t.fleeing=near;for(let i=0;i<14;i++){let x,z;if(near){const a0=Math.atan2(t.x-state.px,t.z-state.pz)+rr(-.7,.7),d0=rr(3,6);x=t.x+Math.sin(a0)*d0;z=t.z+Math.cos(a0)*d0;}else{x=sp.wx+rr(-6,6);z=sp.wz+rr(-6,6);}
     const ww=water(x,z);if(ww&&ww.depth>.4&&freeAt(t.x,t.z,x,z,ww.level)){t.tx=x;t.tz=z;break;}}}
   if(!near)t.fleeing=false;
   {const a=Math.atan2(t.tx-t.x,t.tz-t.z),spd=(near?.9:.45)*dt,w0=water(t.x,t.z),lv=w0?w0.level:t.y;let moved=false;
    for(const o of [0,.5,-.5,1,-1,1.6,-1.6]){const yy=a+o,nx=t.x+Math.sin(yy)*Math.max(spd,.15),nz=t.z+Math.cos(yy)*Math.max(spd,.15),ww=water(nx,nz);
     if(!ww||ww.depth<.25||!freeAt(t.x,t.z,nx,nz,lv))continue;if(Math.hypot(nx-state.px,nz-state.pz)<1.1&&Math.hypot(nx-state.px,nz-state.pz)<dp)continue;
     t.yaw+=angTo(t.yaw,yy)*Math.min(1,dt*3);t.x+=Math.sin(yy)*spd;t.z+=Math.cos(yy)*spd;moved=true;break;}
    if(!moved){t.tx=sp.wx;t.tz=sp.wz;t.yaw+=dt*1.2;}}
   const breathe=((state.t*.15+t.sp.x)%1)<.12;t.y+=((breathe?w.level-.08:w.level-Math.min(.6,w.depth*.6))-t.y)*Math.min(1,dt*1.5);t.inner.rotation.x=breathe?-.25:0;
   if(t.t<=0&&pDist(sp.x,sp.z)>9){t.st='climb';t.k=0;t.x0=t.x;t.z0=t.z;t.y0=t.y;}}
  else if(t.st==='climb'){t.k+=dt/1.4;const k=Math.min(1,t.k);t.x=lerp(t.x0,sp.x,k);t.z=lerp(t.z0,sp.z,k);t.y=lerp(t.y0,sp.y,k);t.yaw+=angTo(t.yaw,Math.atan2(sp.x-sp.wx,sp.z-sp.wz)+PI)*Math.min(1,dt*3);paddle(8);
   if(k>=1){t.st='bask';t.t=rr(5,10);ring(sp.wx,sp.wz,.2);}}
  t.g.position.set(t.x,t.y,t.z);t.g.rotation.y=t.yaw;}

 /* ================= PATOS (mãe e filhotes) ================= */
 const families=[],FAM=mobile?1:2;
 function makeDuck(adult,x,z,w){const {g,m,wings,asa,voo,bater}=duckModel(KA,adult,adult?rr(1.05,1.2):rr(.5,.6));
  g.position.set(x,w.level-.04,z);root.add(g);return {g,m,wings,asa,voo,bater,fl:0,wk:0,x,z,y:w.level-.04,yaw:rr(0,TAU),ph:rr(0,TAU)};}
 function spawnFamily(){const s=spot('koi',state.px,state.pz,10,40);if(!s||s.w.depth<.5)return;
  const F={mom:makeDuck(true,s.x,s.z,s.w),kids:[],st:'swim',tx:s.x,tz:s.z,t:0,home:{x:s.x,z:s.z}};const n=3+((Math.random()*3)|0);
  for(let i=0;i<n;i++)F.kids.push(makeDuck(false,s.x-i*.4-.4,s.z,s.w));families.push(F);}
 // Obstáculos na água: pedras grandes, estacas e passarelas (arcanoObstacles), rochas que saem da água, pisos sobre a água e vitórias-régias.
 function freeAt(fx,fz,x,z,lv){const O=window.arcanoObstacles;if(O&&O.blocked(fx,fz,x,z))return false;
  const ex=window.arcanoExtraDecks;if(ex)for(const d of ex){const y=d.surfaceAt(x,z);if(y!=null&&Math.abs(y-lv)<3)return false;}
  const api=window.arcanoWaterV1226,rs=api&&api.rockSolids;if(rs)for(const r of rs){if(r.top<lv-.08)continue;const qx=(x-r.x)/(r.rx+.25),qz=(z-r.z)/(r.rz+.25);if(qx*qx+qz*qz<1)return false;}
  const P=window.arcanoFundoAquatico&&window.arcanoFundoAquatico.pads;if(P)for(let i=0;i<P.length;i+=5){const dx=x-P[i],dz=z-P[i+2];if(Math.abs(dx)<1&&Math.abs(dz)<1&&dx*dx+dz*dz<(P[i+3]*.9+.12)**2)return false;}
  return true;}
 function updFamily(F,dt){const m=F.mom,dp=pDist(m.x,m.z),wet=playerWet();F.t-=dt;
  {const alvo=F.st==='fly'?1:0;if(m.wk!==alvo||alvo){m.wk+=(alvo-m.wk)*Math.min(1,dt*(alvo?5:3));if(Math.abs(alvo-m.wk)<.003)m.wk=alvo;m.voo(m.wk,state.t*15);}}
  const swimTo=(d,tx,tz,sp,lead)=>{const a=Math.atan2(tx-d.x,tz-d.z),dd=Math.hypot(tx-d.x,tz-d.z);if(dd<.05)return true;const st=Math.min(dd,sp*dt),w0=water(d.x,d.z),lv=w0?w0.level:d.y;
   if(lead&&dd>3.5){d.x+=(tx-d.x)*Math.min(1,dt*1.5);d.z+=(tz-d.z)*Math.min(1,dt*1.5);d.yaw+=angTo(d.yaw,a)*Math.min(1,dt*4);return true;}
   for(const o of [0,.45,-.45,.95,-.95,1.6,-1.6]){const yy=a+o,nx=d.x+Math.sin(yy)*Math.max(st,.12),nz=d.z+Math.cos(yy)*Math.max(st,.12),w=water(nx,nz);
    if(w&&w.depth>.15&&freeAt(d.x,d.z,nx,nz,lv)){d.yaw+=angTo(d.yaw,yy)*Math.min(1,dt*3);const mx=d.x+Math.sin(yy)*st,mz=d.z+Math.cos(yy)*st;d.x=mx;d.z=mz;return true;}}
   d.yaw+=angTo(d.yaw,a+1.2)*Math.min(1,dt*2);return false;};
  if(F.st==='fly'){F.k+=dt;
   const k=Math.min(1,F.k/4);m.x=lerp(F.x0,F.tx,k);m.z=lerp(F.z0,F.tz,k);m.y=lerp(F.y0,F.ly,k)+Math.sin(k*PI)*4;m.yaw=Math.atan2(F.tx-F.x0,F.tz-F.z0);
   if(k>=1){F.st='swim';F.t=rr(3,6);ring(m.x,m.z,.35);}}
  else{
   if(dp<2.8||(wet&&dp<3.5)){const a=Math.atan2(m.z-state.pz,m.x-state.px),s=spot('koi',m.x+Math.cos(a)*16,m.z+Math.sin(a)*16,0,6);if(s){F.st='fly';F.k=0;F.x0=m.x;F.z0=m.z;F.y0=m.y;F.tx=s.x;F.tz=s.z;F.ly=s.w.level-.04;ring(m.x,m.z,.4);}}
   else if(dp<7&&F.st!=='flee'){const a=Math.atan2(m.z-state.pz,m.x-state.px),s=spot('koi',m.x+Math.cos(a)*8,m.z+Math.sin(a)*8,0,3);if(s){F.tx=s.x;F.tz=s.z;F.st='flee';F.t=3;}}
   if(F.t<=0){F.st='swim';const s=spot('koi',F.home.x,F.home.z,0,10);if(s){F.tx=s.x;F.tz=s.z;}F.t=rr(4,9);F.dab=Math.random()<.4?rr(1.5,3):0;}
   if(F.dab>0){F.dab-=dt;m.m.rotation.x=lerp(m.m.rotation.x,1.1,Math.min(1,dt*5));}else{m.m.rotation.x=lerp(m.m.rotation.x,0,Math.min(1,dt*5));if(!swimTo(m,F.tx,F.tz,F.st==='flee'?1.2:.35)){F.stuck=(F.stuck||0)+dt;if(F.stuck>1.2){F.stuck=0;F.t=0;}}else F.stuck=0;}
   const w=water(m.x,m.z);if(w)m.y=w.level-.04+Math.sin(state.t*2+m.ph)*.01;}
  // filhotes em fila atrás da mãe
  let lead=m;for(const k of F.kids){const gap=lead===m?.55:.28,bx=lead.x-Math.sin(lead.yaw)*gap,bz=lead.z-Math.cos(lead.yaw)*gap;swimTo(k,bx,bz,F.st==='fly'?1.8:F.st==='flee'?1.4:.6,true);
   if((F.st!=='swim'&&Math.random()<dt*2)||Math.random()<dt*.04)k.fl=Math.max(k.fl,rr(.5,1.1));k.fl=Math.max(0,k.fl-dt);k.bater(k.fl>0?(.55+.45*Math.sin(state.t*32+k.ph*5))*Math.min(1,k.fl*4):0);
   const w=water(k.x,k.z);if(w)k.y=w.level-.03+Math.sin(state.t*3+k.ph)*.012;k.g.position.set(k.x,k.y,k.z);k.g.rotation.y=k.yaw;lead=k;}
  m.g.position.set(m.x,m.y,m.z);m.g.rotation.y=m.yaw;}

 /* ================= PATINADORES ================= */
 const STR=mobile?14:36,strIM=new T.InstancedMesh(strGeo,new T.MeshStandardMaterial({vertexColors:true,roughness:.6}),STR);strIM.count=0;strIM.frustumCulled=false;strIM.name='Patinadores';root.add(strIM);
 const striders=[];
 function updStriders(dt){
  for(let i=striders.length-1;i>=0;i--){const s=striders[i];if(pDist(s.x,s.z)>40){striders.splice(i,1);continue;}
   s.t-=dt;if(s.t<=0){const a=pDist(s.x,s.z)<2?Math.atan2(s.z-state.pz,s.x-state.px)+rr(-.6,.6):rr(0,TAU),sp=rr(.8,1.8);s.vx=Math.cos(a)*sp;s.vz=Math.sin(a)*sp;s.yaw=Math.atan2(s.vx,s.vz);s.t=rr(.4,1.6);}
   const nx=s.x+s.vx*dt,nz=s.z+s.vz*dt,w=water(nx,nz);if(w&&w.depth>.05&&Math.hypot(w.flow[0],w.flow[1])<.35){s.x=nx;s.z=nz;s.y=w.level+.004;}else{s.vx*=-1;s.vz*=-1;}
   s.vx*=Math.pow(.15,dt);s.vz*=Math.pow(.15,dt);
   Q.setFromEuler(E.set(0,s.yaw,0));M4.compose(V.set(s.x,s.y,s.z),Q,S3.setScalar(.09));strIM.setMatrixAt(i,M4);}
  strIM.count=striders.length;strIM.instanceMatrix.needsUpdate=true;}

 /* ================= quem mora perto ================= */
 function populate(){
  for(let i=schools.length-1;i>=0;i--){const S=schools[i];if(pDist(S.home.x,S.home.z)>60)schools.splice(i,1);}
  for(let i=turtles.length-1;i>=0;i--)if(pDist(turtles[i].sp.x,turtles[i].sp.z)>60){root.remove(turtles[i].g);turtles.splice(i,1);}
  for(let i=families.length-1;i>=0;i--){const F=families[i];if(pDist(F.mom.x,F.mom.z)>70){root.remove(F.mom.g);for(const k of F.kids)root.remove(k.g);families.splice(i,1);}}
  for(const k of ['lambari','koi','truta','girino']){for(let n=0;n<2;n++){const s=spot(k,state.px,state.pz,6,42);if(s)spawnSchool(k,s);}}
  if(turtles.length<TUR){const sp=bankSpot(state.px,state.pz);if(sp)turtles.push(makeTurtle(sp));}
  if(families.length<FAM&&state.day>.15)spawnFamily();
  for(let n=0;n<6&&striders.length<STR;n++){const a=rr(0,TAU),d=rr(3,30),x=state.px+Math.cos(a)*d,z=state.pz+Math.sin(a)*d,w=water(x,z);if(w&&w.depth>.05&&w.depth<.9&&Math.hypot(w.flow[0],w.flow[1])<.3)striders.push({x,z,y:w.level+.004,vx:0,vz:0,yaw:rr(0,TAU),t:rr(0,2)});}
 }
 let last=performance.now(),popT=0;
 (function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;if(dt<=0)return;uT.value=now/1000;
  if(!state.px&&!state.pz)return;
  popT-=dt;if(popT<=0){popT=1.5;populate();}
  updSchools(dt);for(const t of turtles)updTurtle(t,dt);for(const F of families)updFamily(F,dt);updStriders(dt);
 })(last);
 window.arcanoVidaAquatica={KA,schools,turtles,families,striders,IM};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,5500));else setTimeout(install,5500);
})();
