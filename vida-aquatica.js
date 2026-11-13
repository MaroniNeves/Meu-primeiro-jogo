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

function install(){
 const api=window.arcanoWaterV1226,FA=window.arcanoFundoAquatico,FK=window.arcanoFaunaKit,rv=window.arcanoAnimeRiver;
 if(!api||!api.scene||!FA||!FA.water||!FK||!rv){setTimeout(install,800);return;}
 const {Merger,state}=FK,water=FA.water,ground=FA.ground,scene=api.scene;
 const root=new T.Group();root.name='Peixes e bichos da água';scene.add(root);
 const ring=(x,z,str)=>{const u=rv.material.uniforms.uRings.value;let b=u[0];for(const s of u)if(s.z<b.z)b=s;b.set(x,z,performance.now()/1000,str);};
 const pDist=(x,z)=>Math.hypot(x-state.px,z-state.pz);
 const playerWet=()=>{const w=water(state.px,state.pz);return !!(w&&w.depth>.15&&state.py<w.level+.4);};
 const uT={value:0};

 /* ================= PEIXES (instanciados, a cauda ondula no shader) ================= */
 // modelo de comprimento 1 ao longo de +z (cabeça na frente)
 function fishGeo(sp){const B=Merger(),cA=new T.Color(),cB=new T.Color(),c=new T.Color();
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
 const fishMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.45,side:T.DoubleSide});
 fishMat.onBeforeCompile=sh=>{sh.uniforms.uT=uT;sh.vertexShader='attribute vec2 aSwim;uniform float uT;\n'+sh.vertexShader.replace('#include <begin_vertex>',
  `#include <begin_vertex>
  float tail=clamp(-position.z*1.6+.15,0.,1.4);
  transformed.x+=sin(uT*aSwim.y+aSwim.x-position.z*7.)*.11*tail*tail;`);};
 fishMat.customProgramCacheKey=()=>'peixe-v1';
 const CAP=mobile?{lambari:40,koi:8,truta:8,girino:30}:{lambari:96,koi:16,truta:16,girino:70};
 const IM={},SW={};
 for(const k in SP){const g=fishGeo(SP[k]),n=CAP[k];const sw=new T.InstancedBufferAttribute(new Float32Array(n*2),2);sw.setUsage(T.DynamicDrawUsage);g.setAttribute('aSwim',sw);
  const im=new T.InstancedMesh(g,fishMat,n);im.count=0;im.frustumCulled=false;im.name='Peixes · '+k;root.add(im);IM[k]=im;SW[k]=sw;}
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
 const turtles=[],TUR=mobile?2:4;
 function bankSpot(cx,cz){for(let i=0;i<60;i++){const a=rr(0,TAU),d=rr(8,38),x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d;if(water(x,z))continue;
   for(const b of [0,.8,1.6,2.4,3.2,4,4.8,5.6])for(const rd of [.9,1.6]){const wx=x+Math.cos(b)*rd,wz=z+Math.sin(b)*rd,w=water(wx,wz);if(w&&w.depth>.22&&Math.abs(ground(x,z)-w.level)<.9)return {x,z,y:ground(x,z),wx,wz,w,face:Math.atan2(wx-x,wz-z)};}}return null;}
 function makeTurtle(sp){const g=new T.Group(),inner=new T.Group();g.add(inner);inner.scale.setScalar(rr(.38,.5));inner.add(new T.Mesh(turtleGeo,tMat));
  const legs=[];for(const [x,z,s] of [[.34,.32,1],[-.34,.32,-1],[.3,-.36,1],[-.3,-.36,-1]]){const l=new T.Mesh(legGeo,tMat);l.position.set(x,.04,z);l.rotation.y=s*(z>0?.9:2.3);inner.add(l);legs.push({l,s,z});}
  const t={g,inner,legs,sp,x:sp.x,y:sp.y,z:sp.z,yaw:sp.face+rr(-.5,.5),st:'bask',t:rr(4,9)};g.position.set(t.x,t.y,t.z);g.rotation.y=t.yaw;root.add(g);return t;}
 function updTurtle(t,dt){const dp=pDist(t.x,t.z),sp=t.sp;t.t-=dt;
  const paddle=a=>{for(const L of t.legs)L.l.rotation.x=Math.sin(state.t*a+(L.z>0?0:PI)+(L.s>0?0:PI/2))*.5;};
  if(t.st==='bask'){t.inner.rotation.x=0;if(dp<6||(dp<10&&state.speed>3)){t.st='slide';t.k=0;t.x0=t.x;t.z0=t.z;t.y0=t.y;t.yaw=Math.atan2(sp.wx-t.x,sp.wz-t.z);}paddle(0);}
  else if(t.st==='slide'){t.k+=dt/.9;const k=Math.min(1,t.k);t.x=lerp(t.x0,sp.wx,k);t.z=lerp(t.z0,sp.wz,k);t.y=lerp(t.y0,sp.w.level-.25,k);t.inner.rotation.x=.25*Math.sin(k*PI);paddle(10);
   if(k>=1){ring(t.x,t.z,.4);t.st='swim';t.t=rr(12,25);t.tx=t.x;t.tz=t.z;}}
  else if(t.st==='swim'){const w=water(t.x,t.z)||sp.w;paddle(4);
   if(Math.hypot(t.tx-t.x,t.tz-t.z)<.4){for(let i=0;i<10;i++){const x=sp.wx+rr(-6,6),z=sp.wz+rr(-6,6),ww=water(x,z);if(ww&&ww.depth>.4){t.tx=x;t.tz=z;break;}}}
   const a=Math.atan2(t.tx-t.x,t.tz-t.z);t.yaw+=angTo(t.yaw,a)*Math.min(1,dt*2);const nx=t.x+Math.sin(t.yaw)*.45*dt,nz=t.z+Math.cos(t.yaw)*.45*dt;if(water(nx,nz)){t.x=nx;t.z=nz;}else{t.tx=sp.wx;t.tz=sp.wz;}
   const breathe=((state.t*.15+t.sp.x)%1)<.12;t.y+=((breathe?w.level-.08:w.level-Math.min(.6,w.depth*.6))-t.y)*Math.min(1,dt*1.5);t.inner.rotation.x=breathe?-.25:0;
   if(t.t<=0&&pDist(sp.x,sp.z)>9){t.st='climb';t.k=0;t.x0=t.x;t.z0=t.z;t.y0=t.y;}}
  else if(t.st==='climb'){t.k+=dt/1.4;const k=Math.min(1,t.k);t.x=lerp(t.x0,sp.x,k);t.z=lerp(t.z0,sp.z,k);t.y=lerp(t.y0,sp.y,k);t.yaw+=angTo(t.yaw,Math.atan2(sp.x-sp.wx,sp.z-sp.wz)+PI)*Math.min(1,dt*3);paddle(8);
   if(k>=1){t.st='bask';t.t=rr(5,10);ring(sp.wx,sp.wz,.2);}}
  t.g.position.set(t.x,t.y,t.z);t.g.rotation.y=t.yaw;}

 /* ================= PATOS (mãe e filhotes) ================= */
 function duckGeo(adult){const B=Merger();
  if(adult){B.ball(0,.17,0,.25,'#b9b4a8',1,.62,1.5);B.ball(0,.24,-.02,.22,'#8c8478',.95,.45,1.35);B.ball(0,.2,.25,.15,'#7a4a30',1.05,.95,.9);
   B.ball(0,.27,-.36,.09,'#2a2a2a',.8,.55,1.3);B.ball(0,.33,-.42,.035,'#1a1a1a',1,1.4,1);
   B.limb([0,.26,.24],[0,.44,.32],.07,'#2e6a3a',.065);B.ball(0,.33,.28,.072,'#f4f4ee',1,.35,1);
   B.ball(0,.5,.33,.12,'#22704a',.95,.95,1.1);B.ball(0,.47,.46,.06,'#e8c03a',.85,.38,1.5);for(const s of [-1,1]){B.ball(s*.075,.53,.38,.02,'#0c0c0c');B.ball(s*.17,.24,-.08,.08,'#3a5ac8',.35,.5,1.3);}}
  else{B.ball(0,.14,0,.17,'#f2d24a',1,.9,1.15);B.ball(0,.3,.14,.11,'#f2d24a');B.ball(0,.28,.25,.05,'#e8902a',.9,.45,1.3);for(const s of [-1,1])B.ball(s*.055,.33,.2,.017,'#0c0c0c');B.ball(0,.36,.1,.06,'#8a7032',1,.6,1.2);}
  return B.build();}
 const dMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.8,side:T.DoubleSide}),DG=[duckGeo(true),duckGeo(false)];
 const wingG=(()=>{const sh=new T.Shape();sh.moveTo(0,.12);sh.lineTo(.45,.1);sh.lineTo(.55,-.05);sh.lineTo(.3,-.12);sh.lineTo(0,-.1);const g=new T.ShapeGeometry(sh);g.rotateX(PI/2);const B=Merger();B.add(g,'#7a5a3a');return B.build();})();
 const families=[],FAM=mobile?1:2;
 function makeDuck(adult,x,z,w){const g=new T.Group(),m=new T.Mesh(adult?DG[0]:DG[1],dMat);g.add(m);g.scale.setScalar(adult?rr(1.05,1.2):rr(.5,.6));const wings=[];
  if(adult)for(const s of [-1,1]){const r=new T.Group();r.position.set(s*.2,.3,0);r.scale.x=s;g.add(r);r.add(new T.Mesh(wingG,dMat));r.visible=false;wings.push({r,s});}
  g.position.set(x,w.level-.04,z);root.add(g);return {g,m,wings,x,z,y:w.level-.04,yaw:rr(0,TAU),ph:rr(0,TAU)};}
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
  const swimTo=(d,tx,tz,sp,lead)=>{const a=Math.atan2(tx-d.x,tz-d.z),dd=Math.hypot(tx-d.x,tz-d.z);if(dd<.05)return true;const st=Math.min(dd,sp*dt),w0=water(d.x,d.z),lv=w0?w0.level:d.y;
   if(lead&&dd>3.5){d.x+=(tx-d.x)*Math.min(1,dt*1.5);d.z+=(tz-d.z)*Math.min(1,dt*1.5);d.yaw+=angTo(d.yaw,a)*Math.min(1,dt*4);return true;}
   for(const o of [0,.45,-.45,.95,-.95,1.6,-1.6]){const yy=a+o,nx=d.x+Math.sin(yy)*Math.max(st,.12),nz=d.z+Math.cos(yy)*Math.max(st,.12),w=water(nx,nz);
    if(w&&w.depth>.15&&freeAt(d.x,d.z,nx,nz,lv)){d.yaw+=angTo(d.yaw,yy)*Math.min(1,dt*3);const mx=d.x+Math.sin(yy)*st,mz=d.z+Math.cos(yy)*st;d.x=mx;d.z=mz;return true;}}
   d.yaw+=angTo(d.yaw,a+1.2)*Math.min(1,dt*2);return false;};
  if(F.st==='fly'){F.k+=dt;for(const w of m.wings){w.r.visible=true;w.r.rotation.z=w.s*(.2+.9*Math.sin(state.t*18));}
   const k=Math.min(1,F.k/4);m.x=lerp(F.x0,F.tx,k);m.z=lerp(F.z0,F.tz,k);m.y=lerp(F.y0,F.ly,k)+Math.sin(k*PI)*4;m.yaw=Math.atan2(F.tx-F.x0,F.tz-F.z0);
   if(k>=1){for(const w of m.wings)w.r.visible=false;F.st='swim';F.t=rr(3,6);ring(m.x,m.z,.35);}}
  else{
   if(dp<2.8||(wet&&dp<3.5)){const a=Math.atan2(m.z-state.pz,m.x-state.px),s=spot('koi',m.x+Math.cos(a)*16,m.z+Math.sin(a)*16,0,6);if(s){F.st='fly';F.k=0;F.x0=m.x;F.z0=m.z;F.y0=m.y;F.tx=s.x;F.tz=s.z;F.ly=s.w.level-.04;ring(m.x,m.z,.4);}}
   else if(dp<7&&F.st!=='flee'){const a=Math.atan2(m.z-state.pz,m.x-state.px),s=spot('koi',m.x+Math.cos(a)*8,m.z+Math.sin(a)*8,0,3);if(s){F.tx=s.x;F.tz=s.z;F.st='flee';F.t=3;}}
   if(F.t<=0){F.st='swim';const s=spot('koi',F.home.x,F.home.z,0,10);if(s){F.tx=s.x;F.tz=s.z;}F.t=rr(4,9);F.dab=Math.random()<.4?rr(1.5,3):0;}
   if(F.dab>0){F.dab-=dt;m.m.rotation.x=lerp(m.m.rotation.x,1.1,Math.min(1,dt*5));}else{m.m.rotation.x=lerp(m.m.rotation.x,0,Math.min(1,dt*5));if(!swimTo(m,F.tx,F.tz,F.st==='flee'?1.2:.35)){F.stuck=(F.stuck||0)+dt;if(F.stuck>1.2){F.stuck=0;F.t=0;}}else F.stuck=0;}
   const w=water(m.x,m.z);if(w)m.y=w.level-.04+Math.sin(state.t*2+m.ph)*.01;}
  // filhotes em fila atrás da mãe
  let lead=m;for(const k of F.kids){const gap=lead===m?.55:.28,bx=lead.x-Math.sin(lead.yaw)*gap,bz=lead.z-Math.cos(lead.yaw)*gap;swimTo(k,bx,bz,F.st==='fly'?1.8:F.st==='flee'?1.4:.6,true);
   const w=water(k.x,k.z);if(w)k.y=w.level-.03+Math.sin(state.t*3+k.ph)*.012;k.g.position.set(k.x,k.y,k.z);k.g.rotation.y=k.yaw;lead=k;}
  m.g.position.set(m.x,m.y,m.z);m.g.rotation.y=m.yaw;}

 /* ================= PATINADORES ================= */
 const strGeo=(()=>{const B=Merger();B.ball(0,.02,0,.06,'#2a2620',.6,.5,1.6);for(const s of [-1,1]){B.limb([s*.02,.02,.06],[s*.22,0,.32],.008,'#2a2620');B.limb([s*.02,.02,0],[s*.38,0,-.05],.008,'#2a2620');B.limb([s*.02,.02,-.04],[s*.32,0,-.4],.008,'#2a2620');}return B.build();})();
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
 window.arcanoVidaAquatica={schools,turtles,families,striders,IM};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,5500));else setTimeout(install,5500);
})();
