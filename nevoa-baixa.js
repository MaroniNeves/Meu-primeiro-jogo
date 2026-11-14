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
  if(p+valley*.35+wet<.78)continue;
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
 const U={uTime:{value:0},uColor:{value:new T.Color('#e8f1ff')},uOpacity:{value:.5}};
 const mat=new T.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,
  vertexShader:`attribute vec4 aOff;attribute vec4 aSeed;uniform float uTime;varying vec2 vUv;varying float vFade;varying float vDens;varying vec3 vW;varying float vSeed;
  void main(){vec3 c=aOff.xyz;float s=aOff.w;
   vec3 tc=cameraPosition-c;tc.y=0.;vec3 f=normalize(tc+vec3(1e-4,0.,0.));vec3 r=vec3(f.z,0.,-f.x);
   c.x+=sin(uTime*.05+aSeed.x*6.28)*1.6;c.z+=cos(uTime*.043+aSeed.x*4.1)*1.6;
   vec3 p=c+r*position.x*s*aSeed.y+vec3(0.,1.,0.)*(position.y+.5)*s*aSeed.z-vec3(0.,s*aSeed.z*.18,0.);
   vW=p;vUv=uv;vSeed=aSeed.x;vDens=aSeed.w;
   float d=distance(cameraPosition,c);vFade=smoothstep(1.5,8.,distance(cameraPosition,p))*(1.-smoothstep(150.,210.,d));
   gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`,
  fragmentShader:`uniform vec3 uColor;uniform float uOpacity,uTime;varying vec2 vUv;varying float vFade;varying float vDens;varying vec3 vW;varying float vSeed;${NOISE}
  void main(){if(vFade<.002)discard;
   float side=smoothstep(0.,.32,vUv.x)*smoothstep(1.,.68,vUv.x);
   float vy=smoothstep(.08,.32,vUv.y)*(1.-smoothstep(.45,1.,vUv.y));
   float n=nf(vec2(vW.x+vW.z*.6,vW.y*2.2)*.09+vec2(uTime*.025,vSeed*11.)+vec2(0.,uTime*.012));
   float a=side*vy*smoothstep(.28,.72,n)*vFade*uOpacity*vDens;if(a<.003)discard;
   gl_FragColor=vec4(uColor*(.92+.16*n),a);
   #include <tonemapping_fragment>
   #include <encodings_fragment>
  }`});
 const fog=new T.Mesh(geo,mat);fog.frustumCulled=false;fog.renderOrder=7;fog.name='Neblina baixa';scene.add(fog);

 /* ---------- Partículas de luz flutuando na névoa ---------- */
 const M=motes.length,mg=new T.BufferGeometry(),mp=new Float32Array(M*3),ms=new Float32Array(M);
 motes.forEach((m,i)=>{mp.set([m[0],m[1],m[2]],i*3);ms[i]=m[3];});
 mg.setAttribute('position',new T.BufferAttribute(mp,3));mg.setAttribute('aSeed',new T.BufferAttribute(ms,1));
 const MU={uTime:{value:0},uColor:{value:new T.Color('#cfe8ff')},uOpacity:{value:.8},uScale:{value:300}};
 const mm=new T.ShaderMaterial({uniforms:MU,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
  vertexShader:`attribute float aSeed;uniform float uTime,uScale;varying float vA;
  void main(){vec3 p=position;float t=uTime*(.25+aSeed*.3)+aSeed*40.;p.x+=sin(t)*.8+sin(t*2.3)*.2;p.y+=sin(t*.7+aSeed*9.)*.45;p.z+=cos(t*.83)*.8;
   vec4 mv=modelViewMatrix*vec4(p,1.);float d=-mv.z;vA=(1.-smoothstep(35.,60.,d))*(.55+.45*sin(uTime*2.+aSeed*30.));
   gl_PointSize=uScale*(.05+.04*aSeed)/max(d,.5);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`uniform vec3 uColor;uniform float uOpacity;varying float vA;
  void main(){vec2 q=gl_PointCoord-.5;float r=length(q);float a=(1.-smoothstep(.0,.5,r));a*=a;if(a*vA<.01)discard;gl_FragColor=vec4(uColor*a*vA*uOpacity,1.);}`});
 const pts=new T.Points(mg,mm);pts.frustumCulled=false;pts.renderOrder=8;pts.name='Luzes na névoa';scene.add(pts);

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
  U.uColor.value.copy(tmp);U.uOpacity.value=.4+.3*day;
  MU.uColor.value.copy(mNight).lerp(mDay,day);MU.uOpacity.value=.55+.45*(1-day); // à noite viram vaga-lumes
  MU.uScale.value=api.renderer.domElement.height*.9;}
 tick();
 window.arcanoNevoa={fog,pts,cards:N,motes:M,forestCards};
}
install();
})();
