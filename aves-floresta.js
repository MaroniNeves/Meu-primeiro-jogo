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
 return {make(){const k=(Math.random()*SPECIES.length)|0,P=made[k],g=new T.Group(),inner=new T.Group();g.add(inner);const size=rr(.2,.27);inner.scale.setScalar(size);
   inner.add(new T.Mesh(P.body,mat));const wings=[];
   for(const s of [-1,1]){const root=new T.Group();root.position.set(s*.25,.53,.04);root.scale.x=s;inner.add(root);root.add(new T.Mesh(P.w1,mat));const tip=new T.Group();tip.position.x=.5;root.add(tip);tip.add(new T.Mesh(P.w2,mat));root.visible=false;wings.push({s,root,tip});}
   return {g,inner,wings,size,ph:rr(0,TAU)};}};
}

function install(){
 const api=window.arcanoWaterV1226,FK=window.arcanoFaunaKit,I=window.arcanoIsland;
 if(!api||!api.scene||!FK||!I||!I.forest){setTimeout(install,800);return;}
 const {Merger,state,ground,water,blocked}=FK,scene=api.scene,trees=I.forest.spots||[];
 const K=kit(Merger),root=new T.Group();root.name='Pássaros da floresta';scene.add(root);
 const GROUPS=mobile?2:3,FLOCK=mobile?5:8;
 const groups=[],sky=[];
 const pDist=(x,z)=>Math.hypot(x-state.px,z-state.pz);
 const treeNear=(x,z,avoidPlayer)=>{let best=null,bd=1e9;for(const t of trees){const d=Math.hypot(t.x-x,t.z-z);if(d<bd&&d<60&&(!avoidPlayer||Math.hypot(t.x-state.px,t.z-state.pz)>7)){bd=d;best=t;}}return best;};
 // asas: batendo (f>0) ou planando; aberta só em voo
 function wingsFly(b,flap,t){for(const w of b.wings){w.root.visible=true;const a=flap?.12+.8*Math.sin(t):.14+.05*Math.sin(t*.2),c=flap?.55*Math.sin(t-1.0):-.1;w.root.rotation.z=w.s*a;w.tip.rotation.z=c;}}
 function wingsFold(b){for(const w of b.wings)w.root.visible=false;}
 function place(b){b.g.position.set(b.x,b.y,b.z);}
 // voa até (tx,ty,tz) com velocidade sp; devolve a distância que falta
 function flyTo(b,tx,ty,tz,sp,dt){const dx=tx-b.x,dy=ty-b.y,dz=tz-b.z,d=Math.hypot(dx,dy,dz)||1;
  b.vx+=(dx/d*sp-b.vx)*Math.min(1,dt*2.6);b.vy+=(dy/d*sp-b.vy)*Math.min(1,dt*3.2);b.vz+=(dz/d*sp-b.vz)*Math.min(1,dt*2.6);
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;const gy=ground(b.x,b.z)+.05;if(b.y<gy)b.y=gy;
  const h=Math.hypot(b.vx,b.vz),yaw=Math.atan2(b.vx,b.vz),turn=angTo(b.g.rotation.y,yaw);b.g.rotation.order='YXZ';b.g.rotation.y+=turn*Math.min(1,dt*8);
  b.g.rotation.x=lerp(b.g.rotation.x,-Math.atan2(b.vy,Math.max(h,.5))*.7,Math.min(1,dt*6));b.g.rotation.z=lerp(b.g.rotation.z,clamp(-turn*1.2,-.7,.7),Math.min(1,dt*5));
  return d;}

 /* ---------- bandinhos no chão ---------- */
 function newGroup(){
  for(let tries=0;tries<30;tries++){const a=rr(0,TAU),d=rr(13,40),x=state.px+Math.cos(a)*d,z=state.pz+Math.sin(a)*d;
   if(water(x,z)||blocked(x,z))continue;const y=ground(x,z);if(Math.abs(ground(x+1.5,z)-y)>.5||Math.abs(ground(x,z+1.5)-y)>.5)continue;
   if(Math.hypot(x-I.center.x,z-I.center.z)<I.cityRadius+4||Math.hypot(x-I.center.x,z-I.center.z)>I.radius-25)continue;
   if(groups.some(g=>Math.hypot(g.x-x,g.z-z)<14))continue;
   const G={x,z,birds:[],alarm:0};const n=3+((Math.random()*3)|0);
   for(let i=0;i<n;i++){const b=K.make();b.G=G;b.x=x+rr(-1.6,1.6);b.z=z+rr(-1.6,1.6);b.y=ground(b.x,b.z);b.vx=b.vy=b.vz=0;b.st='feed';b.t=rr(.3,2);b.act='look';b.g.rotation.y=rr(0,TAU);place(b);root.add(b.g);G.birds.push(b);}
   groups.push(G);return;}
 }
 function updGround(b,dt){
  const G=b.G,night=state.day<.18;
  if(b.st==='feed'){
   const dp=pDist(b.x,b.z);
   if(dp<4.6||(dp<8&&state.speed>3.4)||night)G.alarm=Math.max(G.alarm,.01);
   if(G.alarm>0&&b.delay==null)b.delay=rr(0,.35);
   if(b.delay!=null){b.delay-=dt;if(b.delay<=0){b.delay=null;const t=treeNear(b.x,b.z,true);b.hide=t?{x:t.x+rr(-1,1),y:t.y+4.2*(t.s||1)+rr(0,1.2),z:t.z+rr(-1,1)}:{x:b.x+rr(-20,20),y:b.y+13,z:b.z+rr(-20,20)};b.st='flee';b.t=0;b.vy=3.5;b.vx=(b.x-state.px)*.4;b.vz=(b.z-state.pz)*.4;b.inner.rotation.x=0;return;}}
   b.t-=dt;
   if(b.act==='hop'){b.k+=dt/.22;const k=Math.min(1,b.k);b.x=lerp(b.x0,b.x1,k);b.z=lerp(b.z0,b.z1,k);b.y=lerp(b.y0,b.y1,k)+Math.sin(k*PI)*.09;if(k>=1){b.hops--;if(b.hops>0)startHop(b);else{b.act='look';b.t=rr(.3,1.2);}}}
   else if(b.act==='peck'){b.k+=dt*9;b.inner.rotation.x=Math.max(0,Math.sin(b.k))*.95;if(b.k>PI*(b.pecks*2-1)+.1){b.inner.rotation.x=0;b.act='look';b.t=rr(.4,1.6);}}
   else if(b.t<=0){const u=Math.random();
    if(u<.45){b.hops=1+((Math.random()*3)|0);b.yawT=Math.atan2(G.x+rr(-2.2,2.2)-b.x,G.z+rr(-2.2,2.2)-b.z);startHop(b);}
    else if(u<.8){b.act='peck';b.k=0;b.pecks=1+((Math.random()*3)|0);}
    else{b.yawT=b.g.rotation.y+rr(-1.4,1.4);b.t=rr(.4,1.4);}}
   if(b.yawT!=null)b.g.rotation.y+=angTo(b.g.rotation.y,b.yawT)*Math.min(1,dt*12);
   b.g.rotation.x=0;b.g.rotation.z=0;wingsFold(b);place(b);
  }else if(b.st==='flee'){
   b.t+=dt;wingsFly(b,true,state.t*26+b.ph);const d=flyTo(b,b.hide.x,b.hide.y,b.hide.z,7.5,dt);place(b);
   if(d<1.6||b.t>7){b.st='hidden';b.g.visible=false;b.t=rr(9,18);}
  }else if(b.st==='hidden'){
   b.t-=dt;if(b.t<=0&&!night&&pDist(G.x,G.z)>10&&G.alarm<=0){b.g.visible=true;b.x=b.hide.x;b.y=b.hide.y;b.z=b.hide.z;b.vx=b.vy=b.vz=0;b.land={x:G.x+rr(-1.6,1.6),z:G.z+rr(-1.6,1.6)};b.land.y=ground(b.land.x,b.land.z);b.st='return';}
  }else if(b.st==='return'){
   const d=flyTo(b,b.land.x,b.land.y+(Math.hypot(b.land.x-b.x,b.land.z-b.z)>3?1.5:0),b.land.z,5,dt),flap=d<2.5||((state.t+b.ph)%2.4)<1.3;wingsFly(b,flap,state.t*22+b.ph);place(b);
   if(pDist(b.x,b.z)<4){G.alarm=.01;b.st='flee';b.t=0;return;}
   if(d<.25&&b.y<b.land.y+.3){b.x=b.land.x;b.y=b.land.y;b.z=b.land.z;b.st='feed';b.act='look';b.t=rr(.4,1.5);b.delay=null;}
  }
 }
 function startHop(b){b.act='hop';b.k=0;b.x0=b.x;b.z0=b.z;b.y0=b.y;const a=(b.yawT!=null?b.yawT:b.g.rotation.y)+rr(-.4,.4),d=rr(.14,.3);let x=b.x+Math.sin(a)*d,z=b.z+Math.cos(a)*d;if(water(x,z)){x=b.x;z=b.z;}b.x1=x;b.z1=z;b.y1=ground(x,z);b.yawT=a;}

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
  for(const G of groups){if(G.alarm>0){G.alarm+=dt;if(G.alarm>1.2&&G.birds.every(b=>b.st!=='feed'))G.alarm=0;}for(const b of G.birds)updGround(b,dt);}
  updSky(dt);
 })(last);
 window.arcanoAves={groups,sky,flock:F,especies:SPECIES.map(s=>s.n)};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,5000));else setTimeout(install,5000);
})();
