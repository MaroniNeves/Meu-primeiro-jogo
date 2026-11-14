/* Neblina baixa: véus de névoa rente ao chão em manchas da floresta (vales, beira d'água)
   e saindo da boca das minas, com partículas de luz flutuando dentro dela.
   - Cartões grandes virados para a câmera (só em torno do eixo vertical), com ruído animado,
     bordas e base esmaecidas (não aparece a "linha" onde o cartão encontra o chão).
   - A cor e a força vêm da luz do céu e do sol: branca-azulada de dia, azul escura e fraca à noite.
   - Some perto da câmera (não cobre a tela) e ao longe (não pesa). */
(function(){
'use strict';
const T=window.THREE;if(!T)return;
const sm=(a,b,t)=>{t=Math.min(1,Math.max(0,(t-a)/(b-a)));return t*t*(3-2*t);};
const mkR=seed=>{let s=seed>>>0||1;return()=>(s=(s*1664525+1013904223)>>>0)/4294967296;};

const NOISE=`
float nh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float nn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(nh(i),nh(i+vec2(1,0)),f.x),mix(nh(i+vec2(0,1)),nh(i+vec2(1,1)),f.x),f.y);}
float nf(vec2 p){float a=0.,w=.5;for(int i=0;i<4;i++){a+=w*nn(p);p=p*2.03+vec2(1.7,9.2);w*=.5;}return a;}`;

function install(){
 const api=window.arcanoWaterV1226,H=window.arcanoIslandHeight,I=window.arcanoIsland;
 if(!api||!api.scene||!H||!I||!I.forest||!I.forest.spots||!window.arcanoMinasObj){setTimeout(install,700);return;}
 const scene=api.scene,R=mkR(9157);
 const cards=[];   // [x,y,z,size, seed,stretch,height,dens]
 const motes=[];   // [x,y,z, seed]
 const add=(x,y,z,s,st,h,dens)=>cards.push([x,y,z,s,R(),st,h,dens]);

 /* ---------- Onde há névoa ---------- */
 // Floresta: manchas (ruído grande) preferindo vales e beira d'água, só onde há mata.
 const spots=I.forest.spots,C=I.center,RAD=I.radius,cityR=I.cityRadius||130;
 const grid=new Map();for(const s of spots){const k=Math.round(s.x/20)+','+Math.round(s.z/20);grid.set(k,(grid.get(k)||0)+1);}
 const ow=window.arcanoOuterWater;
 const nearWater=(x,z)=>{for(const a of [0,1.57,3.14,4.71])for(const r of [6,14]){if(ow&&ow(x+Math.cos(a)*r,z+Math.sin(a)*r))return true;}return false;};
 const patch=(x,z)=>.5+.3*Math.sin(x*.021+z*.013+1.3)+.2*Math.sin(x*.047-z*.031+.4);
 let forestCards=0;
 for(let gx=C.x-RAD;gx<C.x+RAD;gx+=22)for(let gz=C.z-RAD;gz<C.z+RAD;gz+=22){
  const x=gx+(R()-.5)*14,z=gz+(R()-.5)*14,d=Math.hypot(x-C.x,z-C.z);if(d<cityR+25||d>RAD-25)continue;
  const dense=grid.get(Math.round(x/20)+','+Math.round(z/20))||0;if(dense<4)continue;
  const y=H(x,z);let mean=0;for(const a of [0,2.1,4.2])mean+=H(x+Math.cos(a)*30,z+Math.sin(a)*30)/3;
  const valley=sm(-.5,3,mean-y),wet=nearWater(x,z)?.45:0,p=patch(x,z);
  if(p+valley*.35+wet<.68)continue;
  const n=2+Math.floor(R()*3);
  for(let k=0;k<n;k++){const cx=x+(R()-.5)*18,cz=z+(R()-.5)*18,s=12+R()*12;add(cx,H(cx,cz)+.7+R()*.5,cz,s,1.5+R()*.9,.3,.5+R()*.25);forestCards++;}
  for(let k=0;k<5;k++){const mx=x+(R()-.5)*22,mz=z+(R()-.5)*22;motes.push([mx,H(mx,mz)+.4+R()*2.2,mz,R()]);}
 }
 // Boca das minas: névoa mais densa saindo da entrada, escorrendo pela trilha, e um pouco já dentro do túnel.
 for(const s of window.arcanoMinasObj.SITES){
  const PZ=8;
  for(let k=0;k<9;k++){const lx=(R()-.5)*9,lz=PZ+1.5+R()*13,w=s.toW(lx,lz),sz=7+R()*7;add(w.x,H(w.x,w.z)+.5+R()*.4,w.z,sz,1.4+R()*.6,.3,.42+R()*.18);}
  for(let k=0;k<4;k++){const lx=(R()-.5)*2.4,lz=PZ-1-R()*7,w=s.toW(lx,lz);add(w.x,s.g+.8+R()*.3,w.z,3.2+R()*1.5,1.1,.45,.6);}
  for(let k=0;k<26;k++){const lx=(R()-.5)*8,lz=PZ-6+R()*18,w=s.toW(lx,lz);motes.push([w.x,(lz<PZ?s.g:H(w.x,w.z))+.3+R()*2.4,w.z,R()]);}
 }

 /* ---------- Véus de névoa ---------- */
 const N=cards.length,geo=new T.InstancedBufferGeometry();
 const base=new T.PlaneGeometry(1,1,1,1);geo.index=base.index;geo.setAttribute('position',base.attributes.position);geo.setAttribute('uv',base.attributes.uv);
 const off=new Float32Array(N*4),sd=new Float32Array(N*4);
 cards.forEach((c,i)=>{off.set([c[0],c[1],c[2],c[3]],i*4);sd.set([c[4],c[5],c[6],c[7]],i*4);});
 geo.setAttribute('aOff',new T.InstancedBufferAttribute(off,4));geo.setAttribute('aSeed',new T.InstancedBufferAttribute(sd,4));geo.instanceCount=N;
 const TR=8,trail=Array.from({length:TR},()=>new T.Vector4(0,0,0,0));
 const U={uTime:{value:0},uColor:{value:new T.Color('#e8f1ff')},uOpacity:{value:.5},uTrail:{value:trail}};
 const mat=new T.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,
  vertexShader:`attribute vec4 aOff;attribute vec4 aSeed;uniform float uTime;varying vec2 vUv;varying float vFade;varying float vDens;varying vec3 vW;varying float vSeed;
  void main(){vec3 c=aOff.xyz;float s=aOff.w;
   vec3 tc=cameraPosition-c;tc.y=0.;vec3 f=normalize(tc+vec3(1e-4,0.,0.));vec3 r=vec3(f.z,0.,-f.x);
   c.x+=sin(uTime*.05+aSeed.x*6.28)*1.6;c.z+=cos(uTime*.043+aSeed.x*4.1)*1.6;
   vec3 p=c+r*position.x*s*aSeed.y+vec3(0.,1.,0.)*(position.y+.5)*s*aSeed.z-vec3(0.,s*aSeed.z*.18,0.);
   vW=p;vUv=uv;vSeed=aSeed.x;vDens=aSeed.w;
   float d=distance(cameraPosition,c);vFade=smoothstep(1.5,8.,distance(cameraPosition,p))*mix(.45,1.,smoothstep(14.,34.,d))*(1.-smoothstep(150.,210.,d)); // perto, quem dá o volume são os flocos
   gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`,
  fragmentShader:`uniform vec3 uColor;uniform float uOpacity,uTime;uniform vec4 uTrail[${TR}];varying vec2 vUv;varying float vFade;varying float vDens;varying vec3 vW;varying float vSeed;${NOISE}
  void main(){if(vFade<.002)discard;
   float side=smoothstep(0.,.32,vUv.x)*smoothstep(1.,.68,vUv.x);
   float vy=smoothstep(.08,.32,vUv.y)*(1.-smoothstep(.45,1.,vUv.y));
   // o personagem abre caminho: a névoa é empurrada para os lados e gira atrás dele (redemoinho), depois fecha de novo
   vec2 disp=vec2(0.);float clear=0.;
   for(int i=0;i<${TR};i++){vec4 t=uTrail[i];if(t.z<.01)continue;vec2 d=vW.xz-t.xy;float r=length(d);
    float k=t.z*exp(-r*r/6.5);vec2 dir=d/max(r,.3);vec2 sw=vec2(-dir.y,dir.x)*sign(sin(t.w));
    disp+=(dir*1.6+sw*2.2*(1.-t.z*.5))*k;clear=max(clear,k*(1.-smoothstep(.6,2.6,r)));}
   vec2 q0=vec2(vW.x+vW.z*.6,vW.y*2.2)*.09+vec2(uTime*.025,vSeed*11.)+vec2(0.,uTime*.012);
   float n=nf(q0+disp*.22);
   float a=side*vy*smoothstep(.22,.66,n)*vFade*uOpacity*vDens*(1.-clear*.75);if(a<.003)discard;
   gl_FragColor=vec4(uColor*(.92+.16*n),a);
   #include <tonemapping_fragment>
   #include <encodings_fragment>
  }`});
 const fog=new T.Mesh(geo,mat);fog.frustumCulled=false;fog.renderOrder=7;fog.name='Neblina baixa';scene.add(fog);

 /* ---------- Partículas de luz flutuando na névoa ---------- */
 const M=motes.length,mg=new T.BufferGeometry(),mp=new Float32Array(M*3),ms=new Float32Array(M);
 motes.forEach((m,i)=>{mp.set([m[0],m[1],m[2]],i*3);ms[i]=m[3];});
 mg.setAttribute('position',new T.BufferAttribute(mp,3));mg.setAttribute('aSeed',new T.BufferAttribute(ms,1));
 const MU={uTime:{value:0},uColor:{value:new T.Color('#cfe8ff')},uOpacity:{value:.8},uScale:{value:300},uTrail:{value:trail}};
 const mm=new T.ShaderMaterial({uniforms:MU,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
  vertexShader:`attribute float aSeed;uniform float uTime,uScale;uniform vec4 uTrail[${TR}];varying float vA;
  void main(){vec3 p=position;for(int i=0;i<${TR};i++){vec4 t=uTrail[i];if(t.z<.01)continue;vec2 d=p.xz-t.xy;float r=length(d);float k=t.z*exp(-r*r/5.);vec2 dir=d/max(r,.3);p.xz+=(dir*1.2+vec2(-dir.y,dir.x)*1.4)*k;p.y+=.6*k;}float t=uTime*(.25+aSeed*.3)+aSeed*40.;p.x+=sin(t)*.8+sin(t*2.3)*.2;p.y+=sin(t*.7+aSeed*9.)*.45;p.z+=cos(t*.83)*.8;
   vec4 mv=modelViewMatrix*vec4(p,1.);float d=-mv.z;vA=(1.-smoothstep(35.,60.,d))*(.55+.45*sin(uTime*2.+aSeed*30.));
   gl_PointSize=uScale*(.05+.04*aSeed)/max(d,.5);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`uniform vec3 uColor;uniform float uOpacity;varying float vA;
  void main(){vec2 q=gl_PointCoord-.5;float r=length(q);float a=(1.-smoothstep(.0,.5,r));a*=a;if(a*vA<.01)discard;gl_FragColor=vec4(uColor*a*vA*uOpacity,1.);}`});
 const pts=new T.Points(mg,mm);pts.frustumCulled=false;pts.renderOrder=8;pts.name='Luzes na névoa';scene.add(pts);

 /* ---------- Volume perto do personagem: nuvem de flocos de névoa ---------- */
 // Os véus grandes ficam para a distância; perto, a névoa é feita de muitos flocos macios que se sobrepõem
 // (volume de verdade: dá para entrar nela, ver camadas na frente e atrás do personagem).
 // Cada floco tem velocidade: o personagem empurra e faz redemoinho ao passar; depois a névoa volta a se acomodar.
 const mobile=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
 const PN=mobile?380:1000,PA=new Float32Array(PN*4),PB=new Float32Array(PN*4),vel=new Float32Array(PN*3),life=new Float32Array(PN*2);
 const pgeo=new T.InstancedBufferGeometry();pgeo.index=base.index;pgeo.setAttribute('position',base.attributes.position);pgeo.setAttribute('uv',base.attributes.uv);
 const aP=new T.InstancedBufferAttribute(PA,4).setUsage(T.DynamicDrawUsage),aB=new T.InstancedBufferAttribute(PB,4).setUsage(T.DynamicDrawUsage);
 pgeo.setAttribute('aP',aP);pgeo.setAttribute('aB',aB);pgeo.instanceCount=PN;
 const PU={uTime:U.uTime,uColor:U.uColor,uOpacity:{value:.3}};
 const pmat=new T.ShaderMaterial({uniforms:PU,transparent:true,depthWrite:false,
  vertexShader:`attribute vec4 aP;attribute vec4 aB;varying vec2 vUv;varying float vA;varying float vSeed;
  void main(){vec4 mc=viewMatrix*vec4(aP.xyz,1.);float d=-mc.z;
   vA=aB.y*aB.z*smoothstep(.9,3.2,d)*(1.-smoothstep(30.,42.,d));vUv=uv;vSeed=aB.x;
   if(vA<.002){gl_Position=vec4(2.,2.,2.,1.);return;}
   float rot=aB.x*6.283;vec2 q=mat2(cos(rot),-sin(rot),sin(rot),cos(rot))*position.xy*aP.w;
   gl_Position=projectionMatrix*(mc+vec4(q.x,q.y*.62,0.,0.));}`,
  fragmentShader:`uniform vec3 uColor;uniform float uOpacity,uTime;varying vec2 vUv;varying float vA;varying float vSeed;${NOISE}
  void main(){vec2 q=vUv-.5;float r=length(q)*2.;float b=1.-smoothstep(.15,1.,r);if(b<=0.)discard;
   float n=nf(q*2.6+vec2(vSeed*13.,vSeed*7.)+vec2(uTime*.06,-uTime*.04));
   float a=b*b*smoothstep(.2,.75,n)*vA*uOpacity;if(a<.003)discard;
   gl_FragColor=vec4(uColor*(.94+.12*n),a);
   #include <tonemapping_fragment>
   #include <encodings_fragment>
  }`});
 const puffs=new T.Mesh(pgeo,pmat);puffs.frustumCulled=false;puffs.renderOrder=0;puffs.name='Neblina em volume (perto)';scene.add(puffs);
 let near=[],nearAt=-1e9;
 const spawn=(i,px,pz)=>{if(!near.length){PB[i*4+1]=0;life[i*2]=0;life[i*2+1]=1+Math.random()*2;return;}
  const c=near[Math.floor(Math.random()*near.length)],a=Math.random()*6.283,rr=c[3]*.55*Math.sqrt(Math.random());
  const x=c[0]+Math.cos(a)*rr,z=c[2]+Math.sin(a)*rr,y=H(x,z)+.25+Math.pow(Math.random(),1.6)*1.9;
  PA.set([x,y,z,1.8+Math.random()*2.6],i*4);PB.set([Math.random(),Math.min(1,c[7]*1.15),0,0],i*4);
  vel[i*3]=(Math.random()-.5)*.15;vel[i*3+1]=0;vel[i*3+2]=(Math.random()-.5)*.15;life[i*2]=0;life[i*2+1]=7+Math.random()*9;};
 let ppx=null,ppz=null;
 function updatePuffs(dt){
  const pl=api.getGrassPlayer&&api.getGrassPlayer(),cam=api.getMainCamera&&api.getMainCamera();
  const playing=pl&&document.body.classList.contains('play-active'),src=playing?pl.position:cam&&cam.position;if(!src)return;
  if(t-nearAt>1.2){nearAt=t;near=cards.filter(c=>Math.hypot(c[0]-src.x,c[2]-src.z)<52);}
  // velocidade do personagem
  let vx=0,vz=0;if(playing){if(ppx!=null&&dt>0){vx=(src.x-ppx)/dt;vz=(src.z-ppz)/dt;}ppx=src.x;ppz=src.z;}
  const sp=Math.min(8,Math.hypot(vx,vz)),py=src.y;
  for(let i=0;i<PN;i++){const o=i*4;
   life[i*2]+=dt;const L=life[i*2],LM=life[i*2+1];
   if(L>=LM||Math.hypot(PA[o]-src.x,PA[o+2]-src.z)>48){spawn(i,src.x,src.z);continue;}
   PB[o+2]=Math.min(1,L/1.6)*Math.min(1,(LM-L)/2);
   if(playing){const dx=PA[o]-src.x,dz=PA[o+2]-src.z,dy=PA[o+1]-(py+.9),r=Math.hypot(dx,dz);
    if(r<3.2&&Math.abs(dy)<2.4){const k=(1-r/3.2)*(1-r/3.2),ix=dx/Math.max(r,.2),iz=dz/Math.max(r,.2),side=(ix*vz-iz*vx)>0?1:-1;
     const push=(1.2+sp*1.1)*k,swirl=sp*.9*k;
     vel[i*3]+=(ix*push-iz*swirl*side+vx*.35*k)*dt*3;vel[i*3+2]+=(iz*push+ix*swirl*side+vz*.35*k)*dt*3;vel[i*3+1]+=.5*k*sp*dt;}}
   const damp=Math.exp(-dt*1.1);vel[i*3]*=damp;vel[i*3+1]*=Math.exp(-dt*1.6);vel[i*3+2]*=damp;
   PA[o]+=(vel[i*3]+.12)*dt;PA[o+1]+=vel[i*3+1]*dt;PA[o+2]+=(vel[i*3+2]+.05)*dt;}
  aP.needsUpdate=true;aB.needsUpdate=true;}

 /* ---------- Cor pela luz do dia ---------- */
 const lights=[];scene.traverse(q=>{if(q.isHemisphereLight||q.isDirectionalLight||q.isAmbientLight)lights.push(q);});
 const dayF=()=>{const Rv=window.arcanoAnimeRiver,u=Rv&&Rv.material&&Rv.material.uniforms&&Rv.material.uniforms.uSun;const y=u?u.value.y:.5;return Math.min(1,Math.max(0,(y+.1)/.28));};
 const cDay=new T.Color('#eef4ff'),cNight=new T.Color('#2b3f66'),cDusk=new T.Color('#ffd9b8'),tmp=new T.Color(),mDay=new T.Color('#d8efff'),mNight=new T.Color('#b8ff9a');
 let t=0,last=performance.now();
 function tick(){requestAnimationFrame(tick);const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;t+=dt;
  U.uTime.value=t;MU.uTime.value=t;const day=dayF(),dusk=day*(1-day)*4;
  tmp.copy(cNight).lerp(cDay,day).lerp(cDusk,dusk*.35);
  // um pouco da cor real do céu/sol (as luzes da cena mudam com a hora)
  let sky=null;for(const l of lights)if(l.isHemisphereLight){sky=l.color;break;}if(sky)tmp.lerp(sky,.15);
  U.uColor.value.copy(tmp);U.uOpacity.value=.5+.35*day;
  MU.uColor.value.copy(mNight).lerp(mDay,day);MU.uOpacity.value=.55+.45*(1-day); // à noite viram vaga-lumes
  MU.uScale.value=api.renderer.domElement.height*.9;
  PU.uOpacity.value=.24+.14*day;updatePuffs(dt);
  // rastro: um ponto novo a cada ~0,5 m andado; cada ponto se apaga em ~3 s
  for(const v of trail)v.z*=Math.exp(-dt/2.6);
  const pl=api.getGrassPlayer&&api.getGrassPlayer();
  if(pl&&document.body.classList.contains('play-active')){const p=pl.position;
   if(lastP==null||Math.hypot(p.x-lastP.x,p.z-lastP.z)>.5){const v=trail[ti];ti=(ti+1)%TR;const mv=lastP?Math.hypot(p.x-lastP.x,p.z-lastP.z):0;v.set(p.x,p.z,Math.min(1,.55+mv*.3),Math.random()*6.28);lastP={x:p.x,z:p.z};}
   else{const v=trail[(ti+TR-1)%TR];v.z=Math.max(v.z,.55);v.x+=(p.x-v.x)*.2;v.y+=(p.z-v.y)*.2;} // parado: ainda afasta um pouco em volta
  }}
 let lastP=null,ti=0;
 tick();
 window.arcanoNevoa={fog,pts,cards:N,motes:M,forestCards};
}
install();
})();
