/* Margens vivas: plantas, pedras e bichos nas beiras do rio e dos lagos.
   Cenário (fixo, instanciado): pedras com musgo, touceiras de capim, plantas de folha larga e flores.
   Bichos (só perto de quem joga; cada um tem casa, esconderijo e volta depois de um tempo):
   - SAPOS: sentam na beira, em pedras e nas vitórias-régias; respiram, dão pulinhos, caçam moscas com a língua
     e, quando alguém chega perto, pulam na água e ficam escondidos até a pessoa se afastar.
   - MOSCAS: voam em volta das plantas, pousam, fogem de quem chega e renascem na planta depois de comidas.
   - BORBOLETAS (a do riacho, em várias cores): voam de flor em flor, pousam abrindo e fechando as asas,
     fogem para as plantas quando se assustam e dormem escondidas à noite.
   - LIBÉLULAS: pairam sobre a água, dão arrancadas, tocam a superfície (fazem ondinhas) e pousam nos juncos.
   - VAGA-LUMES: aparecem ao anoitecer, piscam e passeiam; se alguém passa correndo eles apagam, fogem e
     alguns se escondem na planta, voltando depois. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const PI=Math.PI,TAU=PI*2;
const mobile=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||innerWidth<680;
const mkR=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const rr=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const sstep=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};

/* ---------- juntar geometrias com cor por vértice ---------- */
function Merger(){const P=[],N=[],C=[],tmp=new T.Color();
 return {add(geo,color,m){const g=geo.index?geo.toNonIndexed():geo.clone();if(m)g.applyMatrix4(m);g.computeVertexNormals();const p=g.attributes.position,n=g.attributes.normal,c=g.attributes.color;tmp.set(color||'#ffffff');
   for(let i=0;i<p.count;i++){P.push(p.getX(i),p.getY(i),p.getZ(i));N.push(n.getX(i),n.getY(i),n.getZ(i));if(c&&!color)C.push(c.getX(i),c.getY(i),c.getZ(i));else C.push(tmp.r,tmp.g,tmp.b);}},
  // cápsula de a até b
  limb(a,b,r,color,r2){const A=new T.Vector3(...a),B=new T.Vector3(...b),d=B.clone().sub(A),L=d.length(),g=new T.CylinderGeometry(r2==null?r:r2,r,L,8,1);g.translate(0,L/2,0);
   const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()),m=new T.Matrix4().compose(A,q,new T.Vector3(1,1,1));this.add(g,color,m);
   const s=new T.SphereGeometry(r,8,6);s.translate(a[0],a[1],a[2]);this.add(s,color);const s2=new T.SphereGeometry(r2==null?r:r2,8,6);s2.translate(b[0],b[1],b[2]);this.add(s2,color);},
  ball(x,y,z,r,color,sx,sy,sz){const g=new T.SphereGeometry(r,12,9);g.scale(sx||1,sy||1,sz||1);g.translate(x,y,z);this.add(g,color);},
  build(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('normal',new T.Float32BufferAttribute(N,3));g.setAttribute('color',new T.Float32BufferAttribute(C,3));return g;}};}

/* ---------- SAPO: corpo pintado, olhos, patas da frente; patas de trás articuladas ---------- */
function frogParts(){
 const skin=new T.MeshStandardMaterial({vertexColors:true,roughness:.55});
 const B=Merger();
 {const g=new T.SphereGeometry(1,22,16).toNonIndexed(),p=g.attributes.position,col=new Float32Array(p.count*3),c=new T.Color();
  for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const ny=y;
   const top=[.26,.58,.18],dark=[.12,.34,.12],belly=[.93,.9,.68],stripe=[.78,.76,.3];
   const spot=Math.sin(x*9+z*7)*Math.sin(z*11-x*5)+.5*Math.sin(x*17+z*13);
   let cc=spot>.55?dark:top;
   if(ny>.25&&Math.abs(Math.abs(x)-.62)<.1&&z<.6)cc=stripe;       // dobras claras nas costas
   const k=sstep((-ny+.05)/.4);c.setRGB(lerp(cc[0],belly[0],k),lerp(cc[1],belly[1],k),lerp(cc[2],belly[2],k));
   if(z>.25&&Math.abs(ny+.06)<.035)c.setRGB(.1,.2,.1);              // risco da boca
   x*=.62*(1-.22*sstep((-z+.1)/1.1));y*=.46*(1-.2*sstep((-z)/1))*(1-.28*sstep((z-.35)/.65));z*=.92;
   if(ny>0)y+=.09*Math.exp(-Math.pow((z+.1)/.45,2));                // corcunda
   p.setXYZ(i,x,y,z);col.set([c.r,c.g,c.b],i*3);}
  g.setAttribute('color',new T.BufferAttribute(col,3));B.add(g);}
 for(const s of [-1,1]){
  B.ball(s*.3,.3,.5,.21,'#3f8f2a');                                   // calombo do olho
  B.ball(s*.33,.36,.55,.165,'#e9b93a');                               // olho dourado
  B.ball(s*.42,.385,.63,.09,'#0b0b0b',.55,.5,1);                      // pupila
  B.ball(s*.405,.44,.6,.03,'#ffffff');                                // brilho
  B.ball(s*.11,.17,.87,.025,'#12240f');                               // narina
  // pata da frente: braço, antebraço e mão com 4 dedos
  B.limb([s*.4,-.12,.36],[s*.62,-.36,.42],.11,'#3f8f2a',.08);
  B.limb([s*.62,-.36,.42],[s*.54,-.5,.64],.08,'#4a9a30',.06);
  for(let k=0;k<4;k++){const a=(k-1.5)*.42*s;B.limb([s*.54,-.5,.64],[s*.54+Math.sin(a)*.24,-.52,.64+Math.cos(a)*.24],.035,'#6fb845',.028);B.ball(s*.54+Math.sin(a)*.25,-.52,.64+Math.cos(a)*.25,.042,'#c9d67a');}
 }
 const body=B.build();
 // pata de trás (lado direito; a esquerda é espelhada): coxa, canela e pé com membranas — cada parte ao longo de +z
 const seg=(r0,r1,L,color,extra)=>{const m=Merger();m.limb([0,0,0],[0,0,L],r0,color,r1);if(extra)extra(m);return m.build();};
 const thigh=seg(.17,.13,.7,'#3f8f2a'),shin=seg(.12,.085,.72,'#4a9a30');
 const foot=seg(.075,.05,.5,'#5aa838',m=>{for(let k=0;k<4;k++){const a=(k-1.5)*.34;m.limb([0,0,.45],[Math.sin(a)*.42,0,.45+Math.cos(a)*.42],.035,'#6fb845',.025);m.ball(Math.sin(a)*.43,0,.45+Math.cos(a)*.43,.04,'#c9d67a');}
  const sh=new T.Shape();sh.moveTo(0,.4);for(let k=0;k<4;k++){const a=(k-1.5)*.34;sh.lineTo(Math.sin(a)*.36,.45+Math.cos(a)*.36);}sh.lineTo(0,.4);const w=new T.ShapeGeometry(sh);w.rotateX(PI/2);m.add(w,'#9cc45a');const w2=w.clone();w2.scale(1,-1,1);w2.translate(0,-.004,0);m.add(w2,'#9cc45a');});
 const throat=new T.SphereGeometry(.27,12,9),tongue=new T.CylinderGeometry(.035,.05,1,6);tongue.translate(0,.5,0);tongue.rotateX(PI/2);
 return {skin,body,thigh,shin,foot,throat,tongue,
  throatMat:new T.MeshStandardMaterial({color:'#efe9b8',roughness:.5}),tongueMat:new T.MeshStandardMaterial({color:'#e8748a',roughness:.4})};
}
function makeFrog(FP,size){
 const g=new T.Group(),inner=new T.Group();g.add(inner);inner.scale.setScalar(size);inner.position.y=.56*size;
 const body=new T.Mesh(FP.body,FP.skin);inner.add(body);
 const throat=new T.Mesh(FP.throat,FP.throatMat);throat.position.set(0,-.24,.5);inner.add(throat);
 const tongue=new T.Mesh(FP.tongue,FP.tongueMat);tongue.position.set(0,-.04,.8);tongue.visible=false;inner.add(tongue);
 const legs=[];
 for(const s of [-1,1]){const hip=new T.Group();hip.position.set(s*.38,-.18,-.42);inner.add(hip);
  const th=new T.Mesh(FP.thigh,FP.skin);hip.add(th);const knee=new T.Group();knee.position.z=.7;hip.add(knee);
  const sh=new T.Mesh(FP.shin,FP.skin);knee.add(sh);const ank=new T.Group();ank.position.z=.72;knee.add(ank);
  const ft=new T.Mesh(FP.foot,FP.skin);ank.add(ft);legs.push({s,hip,knee,ank});}
 g.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});
 // e=0 sentado (pernas dobradas), e=1 esticado no pulo
 const pose=e=>{for(const L of legs){L.hip.rotation.order='YXZ';L.hip.rotation.y=L.s*lerp(.75,.22,e);L.hip.rotation.x=lerp(.12,2.55,e);L.knee.rotation.x=lerp(2.72,.35,e);L.ank.rotation.x=lerp(-2.78,.35,e);}};
 pose(0);
 return {g,inner,throat,tongue,pose,size};
}

/* ---------- asas de borboleta (a mesma do riacho, em várias cores) ---------- */
function butterflyTex(c0,c1,c2){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
 const wing=(pts,g0,g1)=>{x.beginPath();x.moveTo(2,64);x.bezierCurveTo(...pts[0]);x.bezierCurveTo(...pts[1]);x.closePath();const gr=x.createRadialGradient(8,64,4,40,64,110);gr.addColorStop(0,g0);gr.addColorStop(.6,g1);gr.addColorStop(1,c2);x.fillStyle=gr;x.fill();x.lineWidth=7;x.strokeStyle='#14101c';x.stroke();};
 wing([[20,-8,118,-6,122,34],[120,62,50,66,2,64]],c0,c1);wing([[40,70,104,74,96,104],[78,128,20,112,2,64]],c0,c1);
 x.strokeStyle='rgba(20,16,40,.5)';x.lineWidth=1.6;for(const [a,b] of[[108,20],[114,44],[84,10],[88,98],[58,108]]){x.beginPath();x.moveTo(4,64);x.lineTo(a,b);x.stroke();}
 x.fillStyle='#fff';for(const [a,b,r] of[[110,26,3.2],[112,40,2.4],[100,14,2.2],[86,104,2.4]]){x.beginPath();x.arc(a,b,r,0,7);x.fill();}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
function butterflyKit(){
 const pal=[['#9fe2ff','#2f86ff','#0c1a5c'],['#ffd27a','#ff8a1e','#7a2a06'],['#fff7b0','#ffd91e','#8a6a06'],['#ffffff','#e8ecf4','#7a7f92'],['#ffc4ec','#e860c0','#5c0c50'],['#c8ffb8','#4cc86a','#0c4a2a']];
 const mats=pal.map(p=>new T.MeshBasicMaterial({map:butterflyTex(...p),alphaTest:.5,side:T.DoubleSide}));
 const gR=new T.PlaneGeometry(1,1).translate(.5,0,0).rotateX(-PI/2),gL=new T.PlaneGeometry(1,1).translate(-.5,0,0).rotateX(-PI/2);
 {const u=gL.attributes.uv;for(let i=0;i<u.count;i++)u.setX(i,1-u.getX(i));}
 const bm=Merger();bm.limb([0,0,.22],[0,0,-.2],.03,'#1a1626',.02);bm.ball(0,0,-.24,.045,'#1a1626');bm.limb([.012,0,-.27],[.09,.03,-.44],.006,'#1a1626');bm.limb([-.012,0,-.27],[-.09,.03,-.44],.006,'#1a1626');
 const body=bm.build(),bodyMat=new T.MeshBasicMaterial({vertexColors:true});
 return {make(){const g=new T.Group(),m=mats[(Math.random()*mats.length)|0],wR=new T.Mesh(gR,m),wL=new T.Mesh(gL,m);g.add(wR,wL,new T.Mesh(body,bodyMat));g.scale.setScalar(rr(.1,.14));return {g,wR,wL};}};
}
/* ---------- libélula ---------- */
function dragonflyKit(){
 const wc=document.createElement('canvas');wc.width=128;wc.height=32;const x=wc.getContext('2d');
 x.fillStyle='rgba(215,240,255,.5)';x.beginPath();x.ellipse(64,16,62,13,0,0,7);x.fill();x.strokeStyle='rgba(40,60,90,.75)';x.lineWidth=1.2;x.stroke();
 for(let i=1;i<9;i++){x.beginPath();x.moveTo(i*14,4);x.lineTo(i*14-4,28);x.stroke();}x.beginPath();x.moveTo(2,16);x.lineTo(126,14);x.stroke();x.fillStyle='rgba(30,40,60,.8)';x.fillRect(104,7,12,5);
 const wt=new T.CanvasTexture(wc);wt.colorSpace=T.SRGBColorSpace;
 const wingMat=new T.MeshBasicMaterial({map:wt,transparent:true,depthWrite:false,side:T.DoubleSide});
 const wg=new T.PlaneGeometry(1,.24).translate(.5,0,0).rotateX(-PI/2);
 const bodies=['#2f9ad8','#d8412f','#3fae5a'].map(col=>{const m=Merger();m.limb([0,0,.02],[0,0,-.62],.028,col,.016);for(let k=0;k<5;k++)m.ball(0,0,-.12-k*.1,.031,'#101820',1,1,.25);
   m.ball(0,.01,.1,.075,col,1,.95,1.25);m.ball(0,.02,.24,.06,'#20303a');m.ball(.045,.03,.25,.045,'#6fe0c8');m.ball(-.045,.03,.25,.045,'#6fe0c8');return m.build();});
 const bm=new T.MeshStandardMaterial({vertexColors:true,roughness:.35});
 return {make(){const g=new T.Group();g.add(new T.Mesh(bodies[(Math.random()*3)|0],bm));const wings=[];
   for(const s of [-1,1])for(const f of [0,1]){const w=new T.Mesh(wg,wingMat);w.position.set(0,.05,.1-f*.12);w.scale.set(s*(f?.52:.6),1,1);w.rotation.y=s*(f?-.18:.12);g.add(w);wings.push({w,s,f});}
   g.scale.setScalar(rr(.26,.34));return {g,wings};}};
}

function install(){
 const api=window.arcanoWaterV1226,FA=window.arcanoFundoAquatico,rv=window.arcanoAnimeRiver;
 if(!api||!api.scene||!FA||!FA.water||!rv){setTimeout(install,700);return;}
 const scene=api.scene,water=FA.water,ground=FA.ground,R=mkR(1717),O=window.arcanoObstacles;
 const root=new T.Group();root.name='Margens vivas';scene.add(root);

 /* ================= pontos de margem ================= */
 const shore=[];
 for(const rg of FA.regions){const n=Math.round(rg.n*(mobile?.5:1.1));
  for(let i=0;i<n;i++){const x=rg.x0+R()*(rg.x1-rg.x0),z=rg.z0+R()*(rg.z1-rg.z0);if(water(x,z))continue;
   let best=null;const a0=R()*TAU;
   for(const rad of [1.1,2.2,3.4]){for(let k=0;k<8&&!best;k++){const a=a0+k/8*TAU,w=water(x+Math.cos(a)*rad,z+Math.sin(a)*rad);if(w&&w.depth>.06)best={a,rad,w};}if(best)break;}
   if(!best)continue;const y=ground(x,z),up=y-best.w.level;if(up<-.05||up>1.3)continue;
   if(Math.abs(ground(x+.6,z)-y)>.6||Math.abs(ground(x,z+.6)-y)>.6)continue;      // barranco íngreme: nada
   shore.push({x,y,z,dx:Math.cos(best.a),dz:Math.sin(best.a),rad:best.rad,level:best.w.level,lake:best.w.lake,up});}}
 {const I=window.arcanoIsland,GR=window.arcanoIslandGreen,HI=window.arcanoIslandHeight;
  if(I&&GR&&HI){const n=mobile?700:1700;for(let i=0,g=0;i<n&&g<n*12;g++){const a=R()*TAU,d=I.cityRadius+12+Math.sqrt(R())*(I.radius-I.cityRadius-40),x=I.center.x+Math.cos(a)*d,z=I.center.z+Math.sin(a)*d;
    if(GR(x,z)<.55||water(x,z))continue;const y=HI(x,z);if(Math.abs(HI(x+1,z)-y)>.5||Math.abs(HI(x,z+1)-y)>.5)continue;
    shore.push({x,y,z,dx:1,dz:0,rad:9,level:-1e9,lake:false,up:9,forest:true});i++;}}}
 // sem plantas em estrada, píer, vila etc. (as mesmas regras da grama)
 const NG=window.arcanoNoGrass||[],blocked=(x,z)=>{for(const f of NG)if(f(x,z))return true;return false;};

 /* ================= cenário fixo ================= */
 const rocks=[],blades=[],flw=[];
 const plantSpots=[],flowerSpots=[],frogSpots=[],perch=[];
 const blade=(x,y,z,h,kind,lx,lz)=>blades.push(x,y,z,R()*TAU,h,R()*TAU,kind,lx||0,lz||0,R());
 for(const s of shore){let u=R();const free=!blocked(s.x,s.z);if(s.forest){if(!free)continue;u=u<.05?.1:.2+u*.64;}
  if(s.up<.4&&s.rad<2.4&&R()<.5)frogSpots.push({x:s.x+s.dx*(s.rad-.35),z:s.z+s.dz*(s.rad-.35),y:0,wx:s.x+s.dx*(s.rad+.9),wz:s.z+s.dz*(s.rad+.9),level:s.level,yaw:Math.atan2(s.dx,s.dz)});
  if(u<.2){const big=R()<.3,sc=big?.45+R()*.7:.12+R()*.3;rocks.push(s.x,s.y,s.z,sc);if(big){perch.push({x:s.x,y:s.y+sc*.62,z:s.z});if(O&&sc>.75)O.addCircle(s.x,s.z,sc*.7);
     if(s.up<.7)frogSpots.push({x:s.x,z:s.z,y:s.y+sc*.6,rock:true,wx:s.x+s.dx*(s.rad+.9),wz:s.z+s.dz*(s.rad+.9),level:s.level,yaw:Math.atan2(s.dx,s.dz)});}
   for(let k=0;k<2;k++)rocks.push(s.x+(R()-.5)*1.4,s.y,s.z+(R()-.5)*1.4,.06+R()*.14);}
  else if(!free)continue;
  else if(u<.5){const k=5+Math.floor(R()*6),hh=.45+R()*.6;for(let j=0;j<k;j++){const a=R()*TAU,r=R()*.3,px=s.x+Math.cos(a)*r,pz=s.z+Math.sin(a)*r;blade(px,ground(px,pz)-.03,pz,hh*(.6+R()*.5),3,Math.cos(a)*.25,Math.sin(a)*.25);}
   plantSpots.push({x:s.x,y:s.y+hh*.6,z:s.z,top:s.y+hh});}
  else if(u<.66){const k=6+Math.floor(R()*4),hh=.4+R()*.35;for(let j=0;j<k;j++){const a=j/k*TAU+R()*.4;blade(s.x+Math.cos(a)*.05,s.y-.02,s.z+Math.sin(a)*.05,hh*(.8+R()*.4),5,Math.cos(a)*.75,Math.sin(a)*.75);}
   plantSpots.push({x:s.x,y:s.y+hh*.5,z:s.z,top:s.y+hh*.7});}
  else if(u<.84){const k=3+Math.floor(R()*4),hue=[.78,.14,.0,.92,.6,.08][(R()*6)|0],white=R()<.2;
   for(let j=0;j<k;j++){const a=R()*TAU,r=R()*.35,px=s.x+Math.cos(a)*r,pz=s.z+Math.sin(a)*r,py=ground(px,pz),hh=.3+R()*.4;blade(px,py-.02,pz,hh,3);
    flw.push(px,py+hh*.985,pz,.09+R()*.06,hue,white?1:0);flowerSpots.push({x:px,y:py+hh+.03,z:pz});}
   for(let j=0;j<4;j++){const a=R()*TAU;blade(s.x+Math.cos(a)*.1,s.y-.02,s.z+Math.sin(a)*.1,.18+R()*.15,5,Math.cos(a)*.8,Math.sin(a)*.8);}
   plantSpots.push({x:s.x,y:s.y+.2,z:s.z,top:s.y+.4});}
 }
 // vitórias-régias também são lugar de sapo
 for(let i=0;i<FA.pads.length;i+=5)if(FA.pads[i+3]>.42&&R()<.5)frogSpots.push({x:FA.pads[i],z:FA.pads[i+2],y:FA.pads[i+1]+.01,pad:true,wx:FA.pads[i]+.7,wz:FA.pads[i+2]+.3,level:FA.pads[i+1]-.03,yaw:R()*TAU});
 const M=new T.Matrix4(),Q=new T.Quaternion(),E=new T.Euler(),V=new T.Vector3(),S=new T.Vector3(),C=new T.Color();
 {const g=new T.SphereGeometry(1,11,8),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),f=1+.2*Math.sin(x*2.3+1)*Math.cos(y*2.1)+.14*Math.sin(z*2.9+x*1.7);p.setXYZ(i,x*f,y*f*.74,z*f);}g.computeVertexNormals();
  const n=rocks.length/4,im=new T.InstancedMesh(g,new T.MeshStandardMaterial({color:'#9c988e',roughness:1}),n);im.name='Pedras da margem';
  for(let i=0;i<n;i++){const s=rocks[i*4+3];Q.setFromEuler(E.set((R()-.5)*.4,R()*TAU,(R()-.5)*.4));M.compose(V.set(rocks[i*4],rocks[i*4+1]+s*.2,rocks[i*4+2]),Q,S.set(s*(1+R()*.4),s*(.8+R()*.35),s*(.85+R()*.3)));im.setMatrixAt(i,M);}
  im.frustumCulled=false;im.receiveShadow=true;root.add(im);}
 root.add(FA.makeRibbons(blades,'Plantas da margem'));
 {const m=Merger();for(let ring=0;ring<2;ring++)for(let k=0;k<6;k++){const w=.26-ring*.06,L=1-ring*.3,pg=new T.BufferGeometry();pg.setAttribute('position',new T.Float32BufferAttribute([0,0,0, w,.1,L*.5, -w,.1,L*.5, w,.1,L*.5, 0,.02,L, -w,.1,L*.5],3));pg.rotateX(-.3-ring*.55);pg.rotateY(k/6*TAU+ring*.52);m.add(pg,ring?'#ffffff':'#e2e2e2');}
  const fg=m.build(),cm=Merger();{const cb=new T.SphereGeometry(.2,6,4);cb.scale(1,.7,1);cb.translate(0,.12,0);cm.add(cb,'#ffd54a');}const cg=cm.build();
  const n=flw.length/6,im=new T.InstancedMesh(fg,new T.MeshStandardMaterial({vertexColors:true,roughness:.8,side:T.DoubleSide}),n),ic=new T.InstancedMesh(cg,new T.MeshStandardMaterial({vertexColors:true,roughness:.8}),n);
  im.name='Flores da margem';ic.name='Miolo das flores';
  for(let i=0;i<n;i++){const s=flw[i*6+3];Q.setFromEuler(E.set((R()-.5)*.5,R()*TAU,(R()-.5)*.5));M.compose(V.set(flw[i*6],flw[i*6+1],flw[i*6+2]),Q,S.setScalar(s));im.setMatrixAt(i,M);ic.setMatrixAt(i,M);
   im.setColorAt(i,flw[i*6+5]?C.setRGB(1,1,1):C.setHSL(flw[i*6+4],.95,.56));}
  im.frustumCulled=false;ic.frustumCulled=false;root.add(im,ic);}

 /* ================= bichos ================= */
 const live=new T.Group();live.name='Bichos da margem';root.add(live);
 const FP=frogParts(),BK=butterflyKit(),DK=dragonflyKit();
 const CAP=mobile?{frog:5,fly:12,bfly:7,dfly:3,glow:36}:{frog:10,fly:26,bfly:14,dfly:5,glow:96};
 const frogs=[],flies=[],bflies=[],dflies=[],glows=[];
 const state={day:1,forceDay:null,px:0,py:0,pz:0,speed:0,t:0};
 const near=(list,x,z,r0,r1)=>{const out=[];for(const s of list){const d=Math.hypot(s.x-x,s.z-z);if(d>=r0&&d<r1)out.push(s);}return out;};
 const pick=a=>a[(Math.random()*a.length)|0];
 const ring=(x,z,str)=>{const u=rv.material.uniforms.uRings.value;let b=u[0];for(const s of u)if(s.z<b.z)b=s;b.set(x,z,performance.now()/1000,str);};
 const pDist=(x,z)=>Math.hypot(x-state.px,z-state.pz);

 // ---- moscas (instanciadas: corpo + 2 asas) ----
 const flyBody=(()=>{const m=Merger();m.ball(0,0,0,.5,'#1c1f24',1,.9,1.1);m.ball(0,-.05,-.75,.42,'#2a3038',1,.9,1.5);m.ball(0,.05,.55,.36,'#14161a');m.ball(.2,.1,.68,.2,'#a02a20');m.ball(-.2,.1,.68,.2,'#a02a20');return m.build();})();
 const flyIM=new T.InstancedMesh(flyBody,new T.MeshStandardMaterial({vertexColors:true,roughness:.4}),CAP.fly);flyIM.frustumCulled=false;flyIM.name='Moscas';live.add(flyIM);
 const wingIM=new T.InstancedMesh(new T.PlaneGeometry(1.5,.6).translate(.75,0,-.2).rotateX(-PI/2),new T.MeshBasicMaterial({color:'#e6f4ff',transparent:true,opacity:.5,depthWrite:false,side:T.DoubleSide}),CAP.fly*2);wingIM.frustumCulled=false;wingIM.name='Asas das moscas';live.add(wingIM);
 const ZERO=new T.Matrix4().makeScale(0,0,0);
 for(let i=0;i<CAP.fly;i++){flyIM.setMatrixAt(i,ZERO);wingIM.setMatrixAt(i*2,ZERO);wingIM.setMatrixAt(i*2+1,ZERO);}
 function spawnFly(home){if(flies.length>=CAP.fly)return;flies.push({home,x:home.x,y:home.y,z:home.z,vx:0,vy:0,vz:0,tx:home.x,ty:home.y+.5,tz:home.z,st:'fly',t:rr(3,9),retarget:0,yaw:0,fear:0});}
 function flyTarget(f){const a=rr(0,TAU),r=rr(.3,2.4);f.tx=f.home.x+Math.cos(a)*r;f.tz=f.home.z+Math.sin(a)*r;f.ty=Math.max(ground(f.tx,f.tz),f.home.level||-1e9)+rr(.25,1.3);f.retarget=rr(.5,1.6);}
 // ---- vaga-lumes (pontos de luz) ----
 const gp=new Float32Array(CAP.glow*3),gb=new Float32Array(CAP.glow);
 const gGeo=new T.BufferGeometry();gGeo.setAttribute('position',new T.BufferAttribute(gp,3));gGeo.setAttribute('aB',new T.BufferAttribute(gb,1));
 const gPts=new T.Points(gGeo,new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{uPx:{value:1}},
  vertexShader:'attribute float aB;varying float vB;uniform float uPx;void main(){vB=aB;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=uPx*(.4+.6*aB)*260./max(-mv.z,.5);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'varying float vB;void main(){float d=length(gl_PointCoord-.5);float core=smoothstep(.12,.0,d),halo=smoothstep(.5,.0,d);vec3 c=mix(vec3(.55,1.,.2),vec3(1.,1.,.75),core);gl_FragColor=vec4(c*(core*1.6+halo*halo*.55)*vB,1.);}'}));
 gPts.frustumCulled=false;gPts.name='Vaga-lumes';gPts.renderOrder=6;live.add(gPts);
 function spawnGlow(home){if(glows.length>=CAP.glow)return;glows.push({home,x:home.x+rr(-1,1),y:home.y+rr(.1,.9),z:home.z+rr(-1,1),ph:rr(0,TAU),f:rr(1.1,2.2),a:rr(0,TAU),b:rr(0,TAU),dark:0,flee:0,fx:0,fz:0,hid:0,lit:0});}

 function spawnFrog(spot){if(frogs.length>=CAP.frog)return;const fr=makeFrog(FP,rr(.11,.16));fr.spot=spot;spot.used=true;
  const y=spot.pad||spot.rock?spot.y:ground(spot.x,spot.z);fr.x=spot.x;fr.z=spot.z;fr.y=y;fr.yaw=spot.yaw+rr(-.6,.6);fr.st='sit';fr.t=rr(3,9);fr.cool=rr(1,3);fr.ph=rr(0,TAU);
  fr.g.position.set(fr.x,fr.y,fr.z);fr.g.rotation.y=fr.yaw;live.add(fr.g);frogs.push(fr);
  // perto de cada sapo vivem algumas moscas
  const hs=near(plantSpots,spot.x,spot.z,0,4.5);for(let k=0;k<3;k++)spawnFly(Object.assign({level:spot.level},hs.length?pick(hs):{x:spot.x+rr(-1,1),y:fr.y+.3,z:spot.z+rr(-1,1)}));}
 function spawnBfly(home){if(bflies.length>=CAP.bfly)return;const b=BK.make();b.home=home;b.x=home.x;b.y=home.y+.1;b.z=home.z;b.st='hidden';b.t=rr(.5,5);b.vx=b.vy=b.vz=0;b.ph=rr(0,TAU);b.g.visible=false;live.add(b.g);bflies.push(b);}
 function spawnDfly(spot){if(dflies.length>=CAP.dfly)return;const d=DK.make();d.spot=spot;d.x=spot.wx;d.z=spot.wz;d.y=spot.level+.5;d.st='hover';d.t=rr(1,3);d.tx=d.x;d.ty=d.y;d.tz=d.z;d.yaw=0;d.ph=rr(0,TAU);live.add(d.g);dflies.push(d);}

 /* ---- quem mora perto de quem joga ---- */
 function populate(){
  const x=state.px,z=state.pz,FAR=58;
  for(let i=frogs.length-1;i>=0;i--){const f=frogs[i];if(Math.hypot(f.spot.x-x,f.spot.z-z)>FAR){live.remove(f.g);f.spot.used=false;frogs.splice(i,1);}}
  for(let i=flies.length-1;i>=0;i--)if(Math.hypot(flies[i].home.x-x,flies[i].home.z-z)>FAR)flies.splice(i,1);
  for(let i=bflies.length-1;i>=0;i--)if(Math.hypot(bflies[i].home.x-x,bflies[i].home.z-z)>FAR){live.remove(bflies[i].g);bflies.splice(i,1);}
  for(let i=dflies.length-1;i>=0;i--)if(Math.hypot(dflies[i].spot.x-x,dflies[i].spot.z-z)>FAR){live.remove(dflies[i].g);dflies.splice(i,1);}
  for(let i=glows.length-1;i>=0;i--)if(Math.hypot(glows[i].home.x-x,glows[i].home.z-z)>FAR)glows.splice(i,1);
  const fs=near(frogSpots,x,z,5,40).filter(s=>!s.used);for(let k=0;k<3&&fs.length&&frogs.length<CAP.frog;k++)spawnFrog(pick(fs));
  const fl=near(flowerSpots,x,z,3,40),ps=near(plantSpots,x,z,3,40);
  if(fl.length)for(let k=0;k<3&&bflies.length<CAP.bfly;k++)spawnBfly(pick(fl));
  if(ps.length){for(let k=0;k<4&&flies.length<CAP.fly;k++)spawnFly(pick(ps));for(let k=0;k<(state.day<.3?20:6)&&glows.length<CAP.glow;k++)spawnGlow(pick(ps));}
  const ws=near(frogSpots,x,z,5,40);if(ws.length)for(let k=0;k<1&&dflies.length<CAP.dfly;k++)spawnDfly(pick(ws));
 }

 /* ---- comportamento ---- */
 const tv=new T.Vector3();
 function frogGoUnder(f){f.st='under';f.t=rr(1,1.8);f.g.visible=true;const a0=Math.atan2(f.z-state.pz,f.x-state.px);
  for(let i=0;i<10;i++){const a=a0+rr(-.7,.7),d=rr(1.5,3.5),x=f.x+Math.cos(a)*d,z=f.z+Math.sin(a)*d,w=water(x,z);if(w&&w.depth>.25){f.tx=x;f.tz=z;return;}}f.tx=f.x;f.tz=f.z;}
 function frogWander(f){for(let i=0;i<8;i++){const a=rr(0,TAU),d=rr(.4,1.4),x=f.x+Math.cos(a)*d,z=f.z+Math.sin(a)*d,w=water(x,z);if(w&&w.depth>.2&&pDist(x,z)>2.5){f.tx=x;f.tz=z;return;}}f.tx=f.x;f.tz=f.z;}
 function updFrog(f,dt){
  if(f.st==='sit'||f.st==='hidden')f.t-=dt;f.cool-=dt;const dp=pDist(f.x,f.z),scared=dp<2.4||(dp<4.2&&state.speed>3.2);
  if(f.st==='sit'){
   f.throat.scale.setScalar(1+.16*Math.max(0,Math.sin(state.t*5+f.ph)));
   f.inner.position.y=f.size*(.56+.012*Math.sin(state.t*2.5+f.ph));
   if(scared){f.st='jump';f.t=0;f.dur=.5;f.x0=f.x;f.y0=f.y;f.z0=f.z;f.x1=f.spot.wx;f.z1=f.spot.wz;f.y1=f.spot.level-.1;f.hgt=.45;f.dive=true;f.yaw=Math.atan2(f.x1-f.x0,f.z1-f.z0);return;}
   if(f.cool<=0){ // caça: mosca viva ao alcance da língua
    let best=null,bd=1.55;for(const m of flies){if(m.st==='dead'||m.st==='eaten')continue;const d=Math.hypot(m.x-f.x,m.y-(f.y+.1),m.z-f.z);if(d<bd){bd=d;best=m;}}
    if(best){f.st='eat';f.t=0;f.prey=best;best.st='eaten';f.yaw=Math.atan2(best.x-f.x,best.z-f.z);f.cool=rr(2.5,5);return;}}
   if(f.t<=0){f.t=rr(4,11);if(!f.spot.pad&&!f.spot.rock){ // pulinho curto na beira
     const a=f.spot.yaw+rr(-1.6,1.6),d=rr(.25,.6),nx=f.spot.x+Math.cos(a)*d*.5,nz=f.spot.z+Math.sin(a)*d*.5;if(!water(nx,nz)){f.st='jump';f.t=0;f.dur=.32;f.x0=f.x;f.y0=f.y;f.z0=f.z;f.x1=nx;f.z1=nz;f.y1=ground(nx,nz);f.hgt=.16;f.dive=false;f.yaw=Math.atan2(nx-f.x,nz-f.z);}}
    else f.yaw+=rr(-.8,.8);}
  }else if(f.st==='jump'){
   f.t+=dt;const k=clamp(f.t/f.dur,0,1);f.x=lerp(f.x0,f.x1,k);f.z=lerp(f.z0,f.z1,k);f.y=lerp(f.y0,f.y1,k)+Math.sin(k*PI)*f.hgt;
   f.pose(Math.sin(Math.min(1,k*1.5)*PI*.5)*(k<.8?1:(1-k)/.2));f.inner.rotation.x=lerp(-.5,.6,k)*(f.dive?1:.5);
   if(k>=1){f.inner.rotation.x=0;f.pose(0);if(f.dive){ring(f.x,f.z,.5);frogGoUnder(f);}else{f.st='sit';f.t=rr(4,11);}}
  }else if(f.st==='under'||f.st==='swim'||f.st==='back'){ // nadando: mergulha, foge por baixo d'água, sobe e nada na superfície, depois volta
   f.t-=dt;const kick=.5+.5*Math.sin(state.t*(f.st==='under'?11:7)+f.ph);f.pose(kick*.9);f.inner.rotation.x=f.st==='under'?.25:-.15;
   const dx=f.tx-f.x,dz=f.tz-f.z,dd=Math.hypot(dx,dz),sp=f.st==='under'?.9:f.st==='back'?.45:.28;
   if(dd>.05){const a=Math.atan2(dx,dz);f.yaw=a;const st=Math.min(dd,sp*dt),nx=f.x+Math.sin(a)*st,nz=f.z+Math.cos(a)*st,w=water(nx,nz);if(w&&w.depth>.12){f.x=nx;f.z=nz;}else{f.tx=f.x;f.tz=f.z;}}
   const w=water(f.x,f.z),lv=w?w.level:f.spot.level,ty=f.st==='under'?lv-Math.min(.3,(w?w.depth:.3)*.6):lv-.075;f.y+=(ty-f.y)*Math.min(1,dt*4);
   if(f.st!=='under'&&Math.random()<dt*.6)ring(f.x,f.z,.12);
   if(pDist(f.x,f.z)<2.2&&f.st!=='under'){ring(f.x,f.z,.3);frogGoUnder(f);}
   else if(f.st==='under'&&f.t<=0){f.st='swim';f.t=rr(5,10);ring(f.x,f.z,.2);frogWander(f);}
   else if(f.st==='swim'){if(dd<.1)frogWander(f);if(f.t<=0&&pDist(f.spot.x,f.spot.z)>5.5){f.st='back';f.tx=f.spot.wx;f.tz=f.spot.wz;}}
   else if(f.st==='back'&&dd<.15){f.st='jump';f.t=0;f.dur=.42;f.x0=f.x;f.y0=f.y;f.z0=f.z;f.x1=f.spot.x;f.z1=f.spot.z;f.y1=f.spot.pad||f.spot.rock?f.spot.y:ground(f.spot.x,f.spot.z);f.hgt=.3;f.dive=false;f.yaw=Math.atan2(f.x1-f.x0,f.z1-f.z0);f.inner.rotation.x=0;ring(f.x,f.z,.25);}
  }else if(f.st==='eat'){
   f.t+=dt;const m=f.prey,out=.09,back=.14;f.tongue.visible=true;
   if(f.t<out){const k=f.t/out;f.g.updateMatrixWorld(true);f.tongue.lookAt(m.x,m.y,m.z);tv.set(m.x,m.y,m.z);f.inner.worldToLocal(tv);tv.sub(f.tongue.position);f.len=tv.length();f.tongue.scale.set(1,1,Math.max(.01,f.len*k));}
   else if(f.t<out+back){const k=1-(f.t-out)/back;f.tongue.scale.set(1,1,Math.max(.01,f.len*k));f.tongue.getWorldDirection(tv);const o=f.tongue.getWorldPosition(new T.Vector3());m.x=o.x+tv.x*f.len*k*f.size;m.y=o.y+tv.y*f.len*k*f.size;m.z=o.z+tv.z*f.len*k*f.size;}
   else{f.tongue.visible=false;m.st='dead';m.t=rr(6,13);f.st='sit';f.t=rr(2,6);f.throat.scale.setScalar(1.35);}
  }
  f.g.position.set(f.x,f.y,f.z);f.g.rotation.y+=(((f.yaw-f.g.rotation.y+PI)%TAU+TAU)%TAU-PI)*Math.min(1,dt*10);
 }
 function updFly(m,i,dt){
  let vis=true;const dp=pDist(m.x,m.z);
  if(m.st==='dead'){m.t-=dt;vis=false;if(m.t<=0){m.x=m.home.x;m.y=m.home.y;m.z=m.home.z;m.st='fly';m.t=rr(4,10);flyTarget(m);}}   // renasce saindo da planta
  else if(m.st==='eaten'){}
  else if(m.st==='land'){m.t-=dt;if(m.t<=0||dp<1.3){m.st='fly';m.t=rr(4,10);m.fear=dp<1.3?1.4:0;flyTarget(m);}}
  else{ // voando
   if(state.day<.12&&m.fear<=0){m.tx=m.home.x;m.ty=m.home.y;m.tz=m.home.z;if(Math.hypot(m.x-m.tx,m.y-m.ty,m.z-m.tz)<.25){m.st='land';m.t=rr(8,20);}}  // à noite dorme na planta
   m.t-=dt;m.retarget-=dt;m.fear-=dt;
   if(dp<1.5&&m.fear<=0)m.fear=1.3;
   if(m.fear>0){const d=Math.max(.2,dp);m.tx=m.x+(m.x-state.px)/d*3;m.tz=m.z+(m.z-state.pz)/d*3;m.ty=m.y+.5;}
   else if(m.retarget<=0&&state.day>=.12)flyTarget(m);
   if(m.t<=0&&m.fear<=0){m.tx=m.home.x;m.ty=m.home.top||m.home.y;m.tz=m.home.z;if(Math.hypot(m.x-m.tx,m.y-m.ty,m.z-m.tz)<.18){m.st='land';m.t=rr(2,6);m.x=m.tx;m.y=m.ty;m.z=m.tz;}}
   const sp=m.fear>0?5.5:2.2,dx=m.tx-m.x,dy=m.ty-m.y,dz=m.tz-m.z,d=Math.hypot(dx,dy,dz)||1;
   m.vx+=(dx/d*sp-m.vx)*Math.min(1,dt*5)+rr(-1,1)*dt*9;m.vy+=(dy/d*sp-m.vy)*Math.min(1,dt*5)+rr(-1,1)*dt*7;m.vz+=(dz/d*sp-m.vz)*Math.min(1,dt*5)+rr(-1,1)*dt*9;
   m.x+=m.vx*dt;m.y+=m.vy*dt;m.z+=m.vz*dt;const gy=ground(m.x,m.z)+.06;if(m.y<gy)m.y=gy;m.yaw=Math.atan2(m.vx,m.vz);}
  if(!vis){flyIM.setMatrixAt(i,ZERO);wingIM.setMatrixAt(i*2,ZERO);wingIM.setMatrixAt(i*2+1,ZERO);return;}
  const sc=.028;Q.setFromEuler(E.set(0,m.yaw,0));M.compose(V.set(m.x,m.y,m.z),Q,S.setScalar(sc));flyIM.setMatrixAt(i,M);
  const flap=m.st==='fly'?Math.sin(state.t*95+i)*.9:.15;
  for(const s of [0,1]){Q.setFromEuler(E.set(0,m.yaw+(s?PI:0),(s?-1:1)*(s?-flap:flap)+0,'YXZ'));M.compose(V.set(m.x,m.y+sc*.3,m.z),Q,S.setScalar(sc));wingIM.setMatrixAt(i*2+s,M);}
 }
 function bflyGoto(b,spot,st){b.tgt=spot;b.st=st;b.t=0;}
 function updBfly(b,dt){
  const dp=pDist(b.x,b.z),night=state.day<.22;
  if(b.st==='hidden'){b.t-=dt;if(b.t<=0&&!night&&pDist(b.home.x,b.home.z)>4){b.g.visible=true;b.x=b.hide?b.hide.x:b.home.x;b.y=(b.hide?b.hide.y:b.home.y);b.z=b.hide?b.hide.z:b.home.z;const fl=near(flowerSpots,b.home.x,b.home.z,0,9);bflyGoto(b,fl.length?pick(fl):b.home,'fly');}return;}
  if(b.st==='land'){b.t-=dt;const fl=.25+(Math.sin(state.t*1.6+b.ph)*.5+.5)*1.0;b.wR.rotation.z=fl;b.wL.rotation.z=-fl;
   if(dp<2.2||(dp<3.5&&state.speed>3)||night){const hs=near(plantSpots,b.x,b.z,2.5,14).filter(s=>Math.hypot(s.x-state.px,s.z-state.pz)>4);b.hide=hs.length?pick(hs):{x:b.x+rr(-6,6),y:b.y+4,z:b.z+rr(-6,6)};bflyGoto(b,b.hide,'flee');}
   else if(b.t<=0){const fl2=near(flowerSpots,b.x,b.z,.6,9);bflyGoto(b,fl2.length?pick(fl2):b.home,'fly');}
   return;}
  // voando (passeio ou fuga): vai até o alvo balançando
  b.t+=dt;const fast=b.st==='flee',sp=fast?3.4:1.25,T2=b.tgt,dx=T2.x-b.x,dy=(T2.y+(fast?0:.02))-b.y,dz=T2.z-b.z,d=Math.hypot(dx,dy,dz)||1;
  if(!fast&&(dp<2||night)){const hs=near(plantSpots,b.x,b.z,2.5,14).filter(s=>Math.hypot(s.x-state.px,s.z-state.pz)>4);b.hide=hs.length?pick(hs):{x:b.x+rr(-6,6),y:b.y+4,z:b.z+rr(-6,6)};bflyGoto(b,b.hide,'flee');return;}
  const arc=d>.6?Math.min(.9,d*.35):0,w=state.t*5.2+b.ph;
  b.vx+=((dx/d)*sp+Math.cos(w*.7)*.9*(d>.5?1:0)-b.vx)*Math.min(1,dt*3);b.vz+=((dz/d)*sp+Math.sin(w*.9)*.9*(d>.5?1:0)-b.vz)*Math.min(1,dt*3);b.vy+=(((dy+arc)/d)*sp+Math.sin(w*1.9)*.8-b.vy)*Math.min(1,dt*4);
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;const gy=ground(b.x,b.z)+.08;if(b.y<gy)b.y=gy;
  const fl=.12+(Math.sin(state.t*(fast?30:21)+b.ph)*.5+.5)*1.25;b.wR.rotation.z=fl;b.wL.rotation.z=-fl;
  b.g.position.set(b.x,b.y,b.z);b.g.rotation.y=Math.atan2(b.vx,b.vz)+PI;b.g.rotation.z=Math.sin(w)*.15;
  if(d<.16){if(fast){b.st='hidden';b.g.visible=false;b.t=rr(8,18);}else{b.st='land';b.t=rr(3,9);b.x=T2.x;b.y=T2.y+.02;b.z=T2.z;b.vx=b.vy=b.vz=0;b.g.position.set(b.x,b.y,b.z);b.g.rotation.z=0;}}
 }
 function updDfly(d,dt){
  d.t-=dt;const dp=pDist(d.x,d.z),s=d.spot,night=state.day<.2;
  if(d.st==='hidden'){d.g.visible=false;if(d.t<=0&&!night&&pDist(s.x,s.z)>5){d.g.visible=true;d.st='hover';d.t=1;d.x=s.x;d.y=s.level+.4;d.z=s.z;d.tx=s.wx;d.ty=s.level+.5;d.tz=s.wz;}return;}
  if((dp<2.6||night)&&d.st!=='flee'){d.st='flee';const a=Math.atan2(d.z-state.pz,d.x-state.px);d.tx=d.x+Math.cos(a)*9;d.tz=d.z+Math.sin(a)*9;d.ty=d.y+2.5;d.t=1.6;}
  if(d.st==='flee'&&d.t<=0){d.st='hidden';d.t=rr(8,16);return;}
  if(d.st==='perch'){if(d.t<=0){d.st='hover';d.t=.2;}}
  else if(d.st==='hover'&&d.t<=0){const u=Math.random();
   if(u<.16){const ps=near(plantSpots,d.x,d.z,0,7);if(ps.length){const p=pick(ps);d.tx=p.x;d.ty=p.top||p.y;d.tz=p.z;d.st='toperch';d.t=4;}}
   else{const a=rr(0,TAU),r=rr(.8,3.5);let tx=s.wx+Math.cos(a)*r,tz=s.wz+Math.sin(a)*r;const w=water(tx,tz);d.tx=tx;d.tz=tz;d.ty=(w?w.level:ground(tx,tz))+(u>.86&&w?.03:rr(.25,.9));d.touch=u>.86&&!!w;d.t=rr(.7,2.4);}}
  if(d.st!=='perch'){const sp=d.st==='flee'?9:6,dx=d.tx-d.x,dy=d.ty-d.y,dz=d.tz-d.z,L=Math.hypot(dx,dy,dz);
   if(L>.05){const st=Math.min(L,sp*dt*(L>.5?1:.4+L));d.x+=dx/L*st;d.y+=dy/L*st;d.z+=dz/L*st;if(L>.3)d.yaw=Math.atan2(dx,dz);}
   else{if(d.touch){ring(d.x,d.z,.22);d.touch=false;d.ty+=.4;}if(d.st==='toperch'){d.st='perch';d.t=rr(3,7);}}
   d.y+=Math.sin(state.t*7+d.ph)*.004;}
  d.g.position.set(d.x,d.y,d.z);d.g.rotation.y+=(((d.yaw-d.g.rotation.y+PI)%TAU+TAU)%TAU-PI)*Math.min(1,dt*12);
  const fl=d.st==='perch'?0:Math.sin(state.t*70+d.ph)*.45;for(const w of d.wings)w.w.rotation.z=w.s*(fl*(w.f?-1:1)+(d.st==='perch'?-.12:0));
 }
 function updGlow(g,i,dt){
  const nightK=clamp((.34-state.day)/.2,0,1);
  if(g.hid>0){g.hid-=dt;g.lit=0;if(g.hid<=0){g.x=g.home.x+rr(-.3,.3);g.y=g.home.y;g.z=g.home.z+rr(-.3,.3);}}
  else{
   const dp=pDist(g.x,g.z);
   if(g.flee<=0&&(dp<1.3||(dp<3.2&&state.speed>2.2))){g.flee=rr(.8,1.5);g.dark=rr(2,4.5);const d=Math.max(.2,dp);g.fx=(g.x-state.px)/d;g.fz=(g.z-state.pz)/d;if(Math.random()<.35)g.hideAfter=true;}
   if(g.flee>0){g.flee-=dt;g.x+=g.fx*3.2*dt;g.z+=g.fz*3.2*dt;g.y+=(Math.random()-.3)*dt*1.5;if(g.flee<=0&&g.hideAfter){g.hideAfter=false;g.hid=rr(5,11);}}
   else{const act=1+1.3*nightK;g.a+=dt*.5*act;g.b+=dt*.37*act;const rad=1.9+2.2*nightK,tx=g.home.x+Math.cos(g.a)*rad+Math.sin(g.b*1.7)*.8*act,tz=g.home.z+Math.sin(g.a*.83)*rad+Math.cos(g.b*1.3)*.8*act,ty=ground(tx,tz)+.55+Math.sin(g.b*2.1+g.ph)*(.45+.6*nightK)+.4*nightK;
    g.x+=(tx-g.x)*Math.min(1,dt*.9*act)+(Math.random()-.5)*dt*.6*nightK;g.y+=(ty-g.y)*Math.min(1,dt*.9*act);g.z+=(tz-g.z)*Math.min(1,dt*.9*act)+(Math.random()-.5)*dt*.6*nightK;}
   if(g.dark>0)g.dark-=dt;
   const blink=Math.pow(Math.max(0,Math.sin(state.t*g.f*(1+.7*nightK)+g.ph)),2.5);
   g.lit+=(((g.dark>0?0:(.3+.7*blink))*nightK)-g.lit)*Math.min(1,dt*8);}
  gp[i*3]=g.x;gp[i*3+1]=g.y;gp[i*3+2]=g.z;gb[i]=g.lit;
 }

 let last=performance.now(),popT=0,lx=0,lz=0;
 (function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;if(dt<=0)return;state.t+=dt;
  const pl=api.getGrassPlayer&&api.getGrassPlayer(),cam=api.getMainCamera&&api.getMainCamera(),src=document.body.classList.contains('play-active')&&pl?pl.position:(cam?cam.position:null);if(!src)return;
  state.px=src.x;state.py=src.y;state.pz=src.z;const sp=Math.hypot(src.x-lx,src.z-lz)/dt;state.speed+=((sp>40?0:sp)-state.speed)*Math.min(1,dt*6);lx=src.x;lz=src.z;
  const s=rv.material.uniforms.uSun.value;state.day=state.forceDay!=null?state.forceDay:clamp((s.y+.1)/.28,0,1);
  popT-=dt;if(popT<=0){popT=1.2;populate();}
  for(const f of frogs)updFrog(f,dt);
  for(let i=0;i<CAP.fly;i++){if(i<flies.length)updFly(flies[i],i,dt);else{flyIM.setMatrixAt(i,ZERO);wingIM.setMatrixAt(i*2,ZERO);wingIM.setMatrixAt(i*2+1,ZERO);}}
  flyIM.instanceMatrix.needsUpdate=true;wingIM.instanceMatrix.needsUpdate=true;
  for(const b of bflies)updBfly(b,dt);
  for(const d of dflies)updDfly(d,dt);
  for(let i=0;i<CAP.glow;i++){if(i<glows.length)updGlow(glows[i],i,dt);else gb[i]=0;}
  gGeo.attributes.position.needsUpdate=true;gGeo.attributes.aB.needsUpdate=true;gPts.material.uniforms.uPx.value=api.renderer.getPixelRatio();
 })(last);
 window.arcanoFaunaKit={Merger,state,ground,water,blocked};
 window.arcanoFauna={state,frogs,flies,bflies,dflies,glows,spots:{shore:shore.length,frog:frogSpots.length,flor:flowerSpots.length,planta:plantSpots.length},counts:{pedras:rocks.length/4,fitas:blades.length/10,flores:flw.length/6}};
 console.info('[Margens vivas]',JSON.stringify(window.arcanoFauna.spots),JSON.stringify(window.arcanoFauna.counts));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,4000));else setTimeout(install,4000);
})();
