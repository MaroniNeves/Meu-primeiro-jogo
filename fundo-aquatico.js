/* Vida aquática dos lagos e do rio.
   Espalha pelo leito (onde há água de verdade):
   - pedras de vários tamanhos (as maiores saem da água) com musgo por cima,
   - tapetes de musgo no fundo,
   - algas finas, algas largas (tipo kelp) e plantas avermelhadas, balançando com a água
     e deitando no sentido da correnteza do rio,
   - juncos e taboas nas margens rasas,
   - vitórias-régias com flores na superfície dos lagos.
   Tudo é instanciado (poucas chamadas de desenho) e fica sempre abaixo do nível d'água
   de cada lugar, exceto juncos, taboas e as pedras grandes. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const PI=Math.PI,TAU=PI*2;
const mobile=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||innerWidth<680;
const K=mobile?.45:1; // densidade
const mkR=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};

function install(){
 const api=window.arcanoWaterV1226,I=window.arcanoIsland,OW=window.arcanoOuterWater,P=window.arcanoRiverProfile,G=window.arcanoAnimeGround,H=window.arcanoIslandHeight;
 if(!api||!api.scene||!I||!OW||!P||!G||!H){setTimeout(install,500);return;}
 const scene=api.scene,LG=window.arcanoLagoGrande,O=window.arcanoObstacles,R=mkR(4242);
 const B=G.bounds;
 // água em (x,z): {level,depth,bed,flow:[fx,fz],lake}
 function water(x,z){
  if(x>B.x0+.5&&x<B.x1-.5&&z>B.z0+.5&&z<B.z1-.5){
   const d=P.depthAt(x,z);if(!(d>0))return null;const level=P.levelAt(z),bed=G.heightAt(x,z);if(level-bed<=0)return null;
   const dc=P.center(z+.5)-P.center(z-.5),l=Math.hypot(dc,1),fa=window.arcanoFlowAt&&window.arcanoFlowAt(x,z),sp=fa?Math.hypot(fa[0],fa[1])*1.9:1;return {level,depth:level-bed,bed,flow:[dc/l*sp,1/l*sp],lake:false};}
  const o=OW(x,z);if(!o)return null;
  const inLG=LG&&Math.hypot(x-LG.x,z-LG.z)<LG.r+16,inLake=Math.hypot((x-I.lake.x)/(I.lake.rx+3),(z-I.lake.z)/(I.lake.rz+3))<1;
  let flow=[0,0];if(!inLG&&!inLake){if(z>B.z1){const dc=P.center(z+.5)-P.center(z-.5),l=Math.hypot(dc,1);flow=[dc/l,1/l];}else flow=[0,.6];}
  {const BR=window.arcanoBracos;if(BR&&z>B.z1&&Math.abs(x-P.center(z))>8){let bd=1e9,bp=null;for(const b of BR.branches)for(const p of b.pts){const dd=Math.abs(p.x-x)+Math.abs(p.z-z);if(dd<bd){bd=dd;bp=p;}}if(bp&&bd<16)flow=[bp.tx,bp.tz];}}
  if(window.arcanoFlowAt&&!inLG&&!inLake){const fa=window.arcanoFlowAt(x,z);if(fa[0]||fa[1])flow=[fa[0]*1.9,fa[1]*1.9];}
  return {level:o.level,depth:o.depth,bed:o.level-o.depth,flow,lake:inLG||inLake};
 }
 // regiões: caixas onde sortear pontos
 const regions=[];
 if(LG)regions.push({x0:LG.x-LG.r-14,x1:LG.x+LG.r+14,z0:LG.z-LG.r-14,z1:LG.z+LG.r+14,n:6500});
 {let x0=I.lake.x-I.lake.rx-6,x1=I.lake.x+I.lake.rx+6,z0=I.lake.z-I.lake.rz-6,z1=I.lake.z+I.lake.rz+6;
  for(const s of I.streams)for(const p of s.pts){x0=Math.min(x0,p.x-5);x1=Math.max(x1,p.x+5);z0=Math.min(z0,p.z-5);z1=Math.max(z1,p.z+5);}
  regions.push({x0,x1,z0:Math.min(z0,B.z0),z1:Math.min(z1,B.z0+1),n:16000});}
 regions.push({x0:B.x0,x1:B.x1,z0:B.z0,z1:B.z1,n:9000});
 regions.push({x0:-30,x1:30,z0:B.z1,z1:B.z1+110,n:3500});
 {const BR=window.arcanoBracos;if(BR){for(const b of BR.branches){let L=0,x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(let i=0;i<b.pts.length;i++){const p=b.pts[i];if(i)L+=Math.hypot(p.x-b.pts[i-1].x,p.z-b.pts[i-1].z);
   // caixas curtas ao longo do braço (amostragem densa só perto da água)
   if(i%14===0||i===b.pts.length-1){if(x0<1e9)regions.push({x0:x0-8,x1:x1+8,z0:z0-8,z1:z1+8,n:Math.round(L*26)});L=0;x0=x1=p.x;z0=z1=p.z;}else{x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);z0=Math.min(z0,p.z);z1=Math.max(z1,p.z);}}}
  const G2=BR.lagoon;regions.push({x0:G2.x-G2.rx-3,x1:G2.x+G2.rx+3,z0:G2.z-G2.rz-3,z1:G2.z+G2.rz+3,n:1400});}}

 const rocks=[],moss=[],blades=[],pads=[],flowers=[];
 const blade=(x,y,z,h,kind,lean)=>blades.push(x,y,z, R()*TAU,h,R()*TAU,kind, lean[0],lean[1],R());
 for(const rg of regions){
  const n=Math.round(rg.n*K);
  for(let i=0;i<n;i++){
   const x=rg.x0+R()*(rg.x1-rg.x0),z=rg.z0+R()*(rg.z1-rg.z0),w=water(x,z);if(!w)continue;
   const d=w.depth,lean=[w.flow[0]*.4,w.flow[1]*.4];
   if(d<.05)continue;
   // manchas grandes: bancos de pedra, campos de plantas e areia livre entre eles
   const nz=Math.sin(x*.19+z*.11)+Math.sin(x*.07-z*.23+2.)+.6*Math.sin(x*.41+z*.37);
   const zone=nz<-.35?0:nz>.75?2:1,u=R();
   if(d<.5){ // margem rasa: juncos e taboas em moitas, pedrinhas
    if(u<.32&&Math.sin(x*.11+z*.07)+Math.sin(x*.05-z*.13)>.1){const k=3+Math.floor(R()*5),cat=R()<.35;
     for(let j=0;j<k;j++){const a=R()*TAU,r=R()*.45,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r,ww=water(px,pz);if(!ww||ww.depth>.7)continue;
      blade(px,ww.bed-.05,pz,ww.depth+.6+R()*1.0,cat&&j<2?4:3,[0,0]);}}
    else if(u<.6){rocks.push(x,w.bed,z,.1+R()*.3);if(R()<.3)rocks.push(x+(R()-.5)*.8,w.bed,z+(R()-.5)*.8,.08+R()*.15);}
    continue;}
   // vitórias-régias em grupos (só em água parada)
   if(w.lake&&d>.4&&d<2.6&&R()<.03){const k=2+Math.floor(R()*4);for(let j=0;j<k;j++){const a=R()*TAU,r=R()*1.6,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r,ww=water(px,pz);if(!ww||ww.depth<.3)continue;const s2=.28+R()*.34;pads.push(px,ww.level+.03,pz,s2,R()*TAU);if(R()<.3)flowers.push(px+(R()-.5)*s2,ww.level+.05,pz+(R()-.5)*s2,.5+R()*.4,R()*TAU);}}
   const pr=[[.85,.03,.02,.03],[.32,.12,.06,.05],[.1,.4,.16,.1]][zone]; // chances: pedra, alga fina, alga larga, planta vermelha
   if(u<pr[0]){ // pedra com pedras menores em volta, musgo e uns fios de alga
    const big=R()<.28;let s2=big?.7+R()*1.3:.2+R()*.5;if(!w.lake)s2=Math.min(s2,.3+d*.8);rocks.push(x,w.bed,z,s2);
    const k=1+Math.floor(R()*4);for(let j=0;j<k;j++){const a=R()*TAU,r=s2*(1+R()*.9),px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r,ww=water(px,pz);if(ww)rocks.push(px,ww.bed,pz,.1+R()*s2*.45);}
    if(R()<.5)moss.push(x+(R()-.5)*s2*2.2,w.bed,z+(R()-.5)*s2*2.2,.15+R()*.3);
    if(big&&O&&s2*.7>d)O.addCircle(x,z,s2*.75);
    if(R()<.4){const k2=2+Math.floor(R()*3);for(let j=0;j<k2;j++){const a=R()*TAU,r=s2*(.9+R()*.4);blade(x+Math.cos(a)*r,w.bed-.03,z+Math.sin(a)*r,Math.min(d*.8,.3+R()*.8),0,lean);}}
   }else if(u<pr[0]+pr[1]){ // moita de algas finas
    const k=3+Math.floor(R()*5);for(let j=0;j<k;j++){const a=R()*TAU,r=R()*.45,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;blade(px,w.bed-.03,pz,Math.min(d*.82,.4+R()*1.2),0,lean);}
   }else if(u<pr[0]+pr[1]+pr[2]&&d>.9){ // algas largas e altas
    const k=2+Math.floor(R()*4);for(let j=0;j<k;j++){const a=R()*TAU,r=R()*.5;blade(x+Math.cos(a)*r,w.bed-.03,z+Math.sin(a)*r,Math.min(d*.86,.9+R()*1.7),1,lean);}
   }else if(u<pr[0]+pr[1]+pr[2]+pr[3]&&d<2.8){ // planta avermelhada baixa
    const k=4+Math.floor(R()*4);for(let j=0;j<k;j++){const a=j/k*TAU+R()*.5,r=.05+R()*.18;blade(x+Math.cos(a)*r,w.bed-.02,z+Math.sin(a)*r,Math.min(d*.7,.25+R()*.45),2,[lean[0]+Math.cos(a)*.35,lean[1]+Math.sin(a)*.35]);}
   }
  }
 }
 const root=new T.Group();root.name='Vida aquática';scene.add(root);
 const M=new T.Matrix4(),Q=new T.Quaternion(),E=new T.Euler(),V=new T.Vector3(),S=new T.Vector3(),C=new T.Color();

 // ---------- pedras (o estilo de pedra do jogo pinta o musgo no topo) ----------
 {const g=new T.SphereGeometry(1,11,8),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),f=1+.2*Math.sin(x*2.3+1)*Math.cos(y*2.1)+.14*Math.sin(z*2.9+x*1.7)+.06*Math.sin(x*6+z*5+y*4);p.setXYZ(i,x*f,y*f*.72,z*f);}
  g.computeVertexNormals();
  const n=rocks.length/4,im=new T.InstancedMesh(g,new T.MeshStandardMaterial({color:'#9c988e',roughness:1}),n);im.name='Pedras do fundo d\'água';
  for(let i=0;i<n;i++){const s=rocks[i*4+3];Q.setFromEuler(E.set((R()-.5)*.5,R()*TAU,(R()-.5)*.5));M.compose(V.set(rocks[i*4],rocks[i*4+1]+s*.22,rocks[i*4+2]),Q,S.set(s*(1+R()*.4),s*(.8+R()*.4),s*(.85+R()*.3)));im.setMatrixAt(i,M);}
  im.frustumCulled=false;im.receiveShadow=true;root.add(im);}
 // ---------- tapetes de musgo ----------
 {const g=new T.SphereGeometry(1,9,5,0,TAU,0,PI/2),n=moss.length/4,im=new T.InstancedMesh(g,new T.MeshStandardMaterial({color:'#ffffff',roughness:1}),n);im.name='Musgo do fundo';
  for(let i=0;i<n;i++){const s=moss[i*4+3];Q.setFromEuler(E.set(0,R()*TAU,0));M.compose(V.set(moss[i*4],moss[i*4+1]-.03,moss[i*4+2]),Q,S.set(s*(1+R()*.5),s*.16,s*(.8+R()*.4)));im.setMatrixAt(i,M);im.setColorAt(i,C.setHSL(.26+R()*.08,.5+R()*.2,.3+R()*.14));}
  im.frustumCulled=false;root.add(im);}
 // ---------- algas, plantas, juncos e taboas (fitas que balançam) ----------
 const U={uTime:{value:0},uDay:{value:1},uFogColor:{value:new T.Color('#b6c6bc')},uFogNear:{value:45},uFogFar:{value:120}};
 function makeRibbons(blades,name){const base=new T.PlaneGeometry(1,1,1,7);base.translate(0,.5,0);
  const g=new T.InstancedBufferGeometry();g.index=base.index;g.setAttribute('position',base.attributes.position);g.setAttribute('uv',base.attributes.uv);
  const n=blades.length/10,a=new Float32Array(n*3),b=new Float32Array(n*4),c=new Float32Array(n*3);
  for(let i=0;i<n;i++){a.set(blades.slice(i*10,i*10+3),i*3);b.set(blades.slice(i*10+3,i*10+7),i*4);c.set(blades.slice(i*10+7,i*10+10),i*3);}
  g.setAttribute('iPos',new T.InstancedBufferAttribute(a,3));g.setAttribute('iDat',new T.InstancedBufferAttribute(b,4));g.setAttribute('iLean',new T.InstancedBufferAttribute(c,3));g.instanceCount=n;
  const m=new T.Mesh(g,new T.ShaderMaterial({uniforms:U,side:T.DoubleSide,
   vertexShader:`attribute vec3 iPos;attribute vec4 iDat;attribute vec3 iLean;uniform float uTime,uFogNear,uFogFar;
   varying float vT;varying float vKind;varying float vTone;varying float vFog;varying float vX;
   void main(){float t=uv.y,kind=iDat.w,h=iDat.y;
    float wid=kind<.5?.05:kind<1.5?.17:kind<2.5?.12:kind>4.5?.34:.04;
    float taper=(kind<2.5||kind>4.5)?sin(clamp(t,0.,1.)*3.1416)*.85+.15*(1.-t):(1.-t*.8);
    if(kind>4.5)taper=pow(sin(clamp(t*.92+.06,0.,1.)*3.1416),.7);
    if(kind>3.5)taper=mix(taper,2.4,smoothstep(.72,.75,t)*smoothstep(.95,.92,t));
    float x=(uv.x-.5)*wid*(.7+.3*h)*taper;
    if(kind>.5&&kind<1.5)x+=sin(t*10.+iDat.z)*.025;
    float under=step(kind,2.5),amp=mix(.035,.2,under),sp=mix(.9,1.25,under);
    float s1=sin(uTime*sp+iDat.z+t*2.4),s2=sin(uTime*sp*.73+iDat.z*1.7+t*1.6);
    float c=cos(iDat.x),s=sin(iDat.x);
    vec3 p=vec3(x*c,t*h,-x*s);
    vec2 off=(vec2(s1,s2)*amp+iLean.xy*(under+step(4.5,kind)))*h*t*t;
    p.xz+=off;p.y-=dot(off,off)*.25/max(h,.1);
    vT=t;vKind=kind;vTone=iLean.z;vX=uv.x;
    vec4 mv=viewMatrix*vec4(iPos+p,1.);vFog=smoothstep(uFogNear,uFogFar,-mv.z);gl_Position=projectionMatrix*mv;}`,
   fragmentShader:`uniform float uDay;uniform vec3 uFogColor;varying float vT;varying float vKind;varying float vTone;varying float vFog;varying float vX;
   void main(){vec3 a,b;
    if(vKind<.5){a=mix(vec3(.06,.24,.16),vec3(.12,.30,.10),vTone);b=vTone<.33?vec3(.22,.58,.30):vTone<.66?vec3(.46,.70,.22):vec3(.16,.52,.44);}
    else if(vKind<1.5){a=vec3(.20,.26,.10);b=mix(vec3(.62,.60,.22),vec3(.44,.62,.24),vTone);}
    else if(vKind<2.5){a=vec3(.30,.10,.20);b=mix(vec3(.86,.36,.46),vec3(.74,.30,.62),vTone);}
    else if(vKind>4.5){a=vec3(.10,.34,.14);b=mix(vec3(.30,.64,.22),vec3(.44,.72,.26),vTone);}
    else{a=vec3(.22,.40,.16);b=mix(vec3(.66,.82,.38),vec3(.80,.84,.46),vTone);}
    vec3 col=mix(a,b,smoothstep(.05,.95,vT));
    if(vKind>.5&&vKind<2.5)col*=mix(.72,1.,smoothstep(.0,.2,abs(vX-.5)));      // nervura central
    if(vKind>4.5){float vn=abs(fract(vT*7.-abs(vX-.5)*5.)-.5);col*=mix(.74,1.,smoothstep(.0,.12,abs(vX-.5)))*mix(.86,1.,smoothstep(.05,.2,vn));}
    else if(vKind>3.5){float hd=smoothstep(.72,.75,vT)*smoothstep(.95,.92,vT);col=mix(col,vec3(.40,.23,.12)*(.8+.4*vX),hd);}
    col*=mix(.28,1.,uDay);
    gl_FragColor=vec4(mix(col,uFogColor,vFog),1.);}`}));
  m.name=name;m.frustumCulled=false;root.add(m);return m;}
 makeRibbons(blades,'Algas e juncos');
 // ---------- vitórias-régias e flores ----------
 {const g=new T.CircleGeometry(1,20,.22,TAU-.44);g.rotateX(-PI/2);
  const n=pads.length/5,im=new T.InstancedMesh(g,new T.MeshStandardMaterial({color:'#ffffff',roughness:1,side:T.DoubleSide}),n);im.name='Vitórias-régias';
  for(let i=0;i<n;i++){const s=pads[i*5+3];Q.setFromEuler(E.set(0,pads[i*5+4],0));M.compose(V.set(pads[i*5],pads[i*5+1],pads[i*5+2]),Q,S.set(s,1,s));im.setMatrixAt(i,M);im.setColorAt(i,C.setHSL(.28+R()*.06,.55,.3+R()*.12));}
  im.frustumCulled=false;root.add(im);
  // flor: dois anéis de pétalas e miolo amarelo, numa só geometria com cor por vértice
  const Pp=[],Nn=[],Cc=[];const addG=(geo,col)=>{const q=geo.index?geo.toNonIndexed():geo;q.computeVertexNormals();const p=q.attributes.position,nn=q.attributes.normal;for(let i=0;i<p.count;i++){Pp.push(p.getX(i),p.getY(i),p.getZ(i));Nn.push(nn.getX(i),nn.getY(i),nn.getZ(i));Cc.push(col.r,col.g,col.b);}};
  for(let ring=0;ring<2;ring++)for(let k=0;k<8;k++){const pg=new T.SphereGeometry(1,6,4);pg.scale(.07,.02,.2-ring*.05);pg.translate(0,0,.19-ring*.06);pg.rotateX(-.45-ring*.5);pg.rotateY(k/8*TAU+ring*.39);addG(pg,new T.Color(ring?'#ffd3e2':'#ff8fb4'));}
  {const cg=new T.SphereGeometry(.06,8,6);cg.translate(0,.05,0);addG(cg,new T.Color('#ffd54a'));}
  const fg=new T.BufferGeometry();fg.setAttribute('position',new T.Float32BufferAttribute(Pp,3));fg.setAttribute('normal',new T.Float32BufferAttribute(Nn,3));fg.setAttribute('color',new T.Float32BufferAttribute(Cc,3));
  const fn=flowers.length/5,fm=new T.InstancedMesh(fg,new T.MeshStandardMaterial({vertexColors:true,roughness:1}),fn);fm.name='Flores de vitória-régia';
  for(let i=0;i<fn;i++){const s=flowers[i*5+3];Q.setFromEuler(E.set(0,flowers[i*5+4],0));M.compose(V.set(flowers[i*5],flowers[i*5+1],flowers[i*5+2]),Q,S.setScalar(s));fm.setMatrixAt(i,M);}
  fm.frustumCulled=false;root.add(fm);}
 // relógio, dia/noite e neblina iguais aos da água
 (function tick(t){requestAnimationFrame(tick);U.uTime.value=t/1000;
  const rv=window.arcanoAnimeRiver&&window.arcanoAnimeRiver.material.uniforms;if(rv){const s=rv.uSun.value;U.uDay.value=Math.min(1,Math.max(0,(s.y+.1)/.28));U.uFogColor.value.copy(rv.fogColor.value);U.uFogNear.value=rv.fogNear.value;U.uFogFar.value=rv.fogFar.value;}})(0);
 const ground=(x,z)=>(x>B.x0+.5&&x<B.x1-.5&&z>B.z0+.5&&z<B.z1-.5)?G.heightAt(x,z):H(x,z);
 window.arcanoFundoAquatico={water,ground,regions,makeRibbons,pads,U,root,counts:{pedras:rocks.length/4,musgo:moss.length/4,fitas:blades.length/10,regias:pads.length/5,flores:flowers.length/5}};
 console.info('[Vida aquática]',JSON.stringify(window.arcanoFundoAquatico.counts));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,2500));else setTimeout(install,2500);
})();
