/* Rio líquido (estilo Genshin Impact).
   - Ondas 3D na própria malha (4 trens de onda seguindo a correnteza) e
     micro-ondulações por normal map procedural que escorre com o fluxo.
   - Reflexo planar real (árvores, margens, céu, personagem) distorcido pelas
     ondas, com fresnel: de cima a água é transparente e mostra o leito;
     de lado ela espelha a paisagem.
   - Cor por absorção (raso verde-água, fundo azul), brilho do sol e espuma
     suave nas margens e nas partes rápidas.
   - Cachoeira: lâmina d'água que se curva, ondula e escorre, com listras de
     espuma, gotas caindo, espuma revolta e névoa no pé da queda.
   - Anéis de ondulação reais (na normal) em volta do personagem na água. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const mobile=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||innerWidth<680;
const srgb=hex=>new T.Color(hex).convertLinearToSRGB();

const vertexShader=`
precision highp float;
attribute float waterDepth;
attribute vec2 waterFlow;
uniform float uTime,uWind,uFallZ;
varying vec3 vWorld;
varying float vDepth;
varying vec2 vFlow;
varying vec2 vAcross;
varying float vFogDepth;
varying vec3 vWaveN;
varying float vCrest;
varying float vFallV;
#ifdef HAS_WAVE
attribute float waveHeight;
#endif
void wave(vec2 p,vec2 dir,float k,float spd,float amp,inout float h,inout vec2 g){
 float ph=k*dot(dir,p)-uTime*spd;
 h+=amp*sin(ph);g+=amp*k*cos(ph)*dir;
}
void main(){
 vec3 p=position;
 #ifdef HAS_WAVE
 p.y+=waveHeight;
 #endif
 vDepth=waterDepth;vFlow=waterFlow;vAcross=uv;
 float speed=clamp(length(waterFlow),0.,1.3);
 vec2 fd=speed>.001?waterFlow/speed:vec2(0.,1.);
 vec2 sd=vec2(-fd.y,fd.x);
 float h=0.;vec2 g=vec2(0.);
 wave(p.xz,fd,2.2,1.6+speed*1.5,.020,h,g);
 wave(p.xz,normalize(fd+sd*.6),3.7,2.1+speed,.012,h,g);
 wave(p.xz,normalize(fd-sd*.8),5.3,2.6+speed,.007,h,g);
 wave(p.xz,sd,1.35,.9,.010,h,g);
 float body=smoothstep(.02,.18,waterDepth);
 // Pé da cachoeira: água agitada.
 float foot=exp(-pow(p.z-(uFallZ+.7),2.)*1.1);
 float scale=body*(.55+.8*speed+.5*uWind)+foot*2.2;
 p.y+=h*scale;
 // Lâmina da cachoeira: curva para fora e ondula enquanto cai.
 float fall=1.-smoothstep(.22,.5,abs(p.z-uFallZ));
 vFallV=fall;
 p.z+=fall*(.05+.035*sin(p.x*6.3+uTime*7.)+.025*sin(p.y*4.7-uTime*10.+p.x*2.));
 p.x+=fall*.02*sin(p.y*6.-uTime*8.);
 vWaveN=normalize(vec3(-g.x*scale,1.,-g.y*scale));
 vCrest=clamp(h*scale/.03,-1.,1.);
 vec4 w=modelMatrix*vec4(p,1.);
 vWorld=w.xyz;
 vec4 mv=viewMatrix*w;
 vFogDepth=-mv.z;
 gl_Position=projectionMatrix*mv;
}`;

const fragmentShader=`
precision highp float;
uniform float uTime,uWind,uSunPower,uCloudiness,uFallZ;
uniform vec3 uSun,uSunColor,uSkyTop,uSkyHorizon;
uniform vec3 uShallow,uDeep,uFoam;
uniform vec3 uPlayer;
uniform float uPlayerWet;
uniform sampler2D uRefl;
uniform mat4 uReflMatrix;
uniform float uReflReady,uMirrorY;
uniform vec3 fogColor;
uniform float fogNear,fogFar;
varying vec3 vWorld;
varying float vDepth;
varying vec2 vFlow;
varying vec2 vAcross;
varying float vFogDepth;
varying vec3 vWaveN;
varying float vCrest;
varying float vFallV;

float hash1(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453);}
float noise(vec2 p){
 vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
 return mix(mix(hash1(i),hash1(i+vec2(1,0)),u.x),mix(hash1(i+vec2(0,1)),hash1(i+vec2(1,1)),u.x),u.y);
}
float fbm(vec2 p){return noise(p)*.55+noise(p*2.1+3.7)*.3+noise(p*4.3-1.9)*.15;}
// Gradiente da altura das micro-ondas (diferenças finitas).
vec2 ripple(vec2 p){
 float e=.08,c=fbm(p);
 return vec2(fbm(p+vec2(e,0.))-c,fbm(p+vec2(0.,e))-c)/e;
}

void main(){
 float edgeNoise=noise(vWorld.xz*3.1+uTime*.25)*.012;
 float alpha=smoothstep(.002,.02,vDepth-.004+edgeNoise);
 if(alpha<.02)discard;

 float speed=clamp(length(vFlow),0.,1.3);
 vec2 flow=speed>.001?vFlow/speed:vec2(0.,1.);

 // ---------- Normal: ondas da malha + micro-ondas que escorrem com o fluxo ----------
 float t=uTime*.32,ph0=fract(t),ph1=fract(t+.5),mixW=abs(ph0-.5)*2.;
 vec2 adv=flow*(.9+speed*1.6);
 vec2 g0=ripple(vWorld.xz*2.3-adv*ph0);
 vec2 g1=ripple(vWorld.xz*2.3+vec2(.43,.71)-adv*ph1);
 vec2 gr=mix(g0,g1,mixW)+ripple(vWorld.xz*6.2+vec2(uTime*.35,-uTime*.27))*.45;
 float rough=.10+.10*speed+.05*uWind;
 // Anéis em volta do personagem (ondulação de verdade, não só desenho).
 vec2 toP=vWorld.xz-uPlayer.xz;float pd=length(toP);
 float ringW=cos(pd*10.-uTime*6.)*smoothstep(2.6,.2,pd)*uPlayerWet;
 vec2 ringG=(pd>.001?toP/pd:vec2(0.))*ringW*.9;
 vec3 n=normalize(vWaveN+vec3(gr.x*rough+ringG.x,0.,gr.y*rough+ringG.y));

 vec3 viewDir=normalize(cameraPosition-vWorld);
 float ndv=max(dot(n,viewDir),0.);
 float fres=.02+.98*pow(1.-ndv,5.);
 fres=clamp(fres*1.15,0.,1.);

 // ---------- Reflexo: céu + paisagem (espelho planar) ----------
 vec3 r=reflect(-viewDir,n);
 vec3 sky=mix(uSkyHorizon,uSkyTop,smoothstep(-.02,.55,r.y));
 vec3 refl=sky;
 if(uReflReady>.5){
  vec4 c=uReflMatrix*vec4(vWorld.x,uMirrorY,vWorld.z,1.);
  vec2 ruv=c.xy/c.w+n.xz*.045;
  vec3 scene=pow(max(texture2D(uRefl,ruv).rgb,vec3(0.)),vec3(1./2.2));
  float valid=(1.-smoothstep(.35,.9,abs(vWorld.y-uMirrorY)))*
   smoothstep(0.,.04,ruv.x)*smoothstep(1.,.96,ruv.x)*smoothstep(0.,.04,ruv.y)*smoothstep(1.,.96,ruv.y);
  refl=mix(sky,scene,valid);
 }

 // ---------- Corpo d'água: absorção pela profundidade ----------
 float thick=1.-exp(-vDepth*1.9);
 vec3 body=mix(uShallow,uDeep,thick);
 // Luz atravessando a crista das ondas (verde-água).
 body+=vec3(.05,.20,.16)*max(vCrest,0.)*(1.-thick*.6);
 float bodyA=mix(.30,.90,smoothstep(0.,.9,thick));

 vec3 col=mix(body,refl,fres);
 float a=mix(bodyA,1.,fres*.85);

 // ---------- Sol ----------
 vec3 sunDir=normalize(uSun);
 vec3 hv=normalize(sunDir+viewDir);
 float sunUp=smoothstep(-.05,.2,sunDir.y)*(1.-uCloudiness*.65);
 float spec=pow(max(dot(n,hv),0.),260.)*4.+pow(max(dot(n,hv),0.),40.)*.12;
 col+=uSunColor*spec*uSunPower*sunUp;
 a=max(a,min(1.,spec*uSunPower*sunUp));

 // ---------- Espuma suave ----------
 float fn=fbm(vWorld.xz*2.8-flow*uTime*(.5+speed));
 float bank=1.-smoothstep(.0,.07,vDepth);
 float foamBank=bank*smoothstep(.40,.70,fn+.25);
 float foamFast=smoothstep(.8,1.2,speed)*smoothstep(.62,.80,fbm(vWorld.xz*vec2(4.,1.2)-flow*uTime*2.));
 float foam=clamp(foamBank*.85+foamFast*.5+ringW*.15*step(0.,ringW),0.,1.);
 col=mix(col,uFoam,foam);a=max(a,foam*.9);

 // ---------- Cachoeira ----------
 vec3 fdx=dFdx(vWorld),fdy=dFdy(vWorld);
 vec3 fnrm=normalize(cross(fdx,fdy));
 float steep=1.-abs(fnrm.y);
 float sheet=smoothstep(.30,.62,steep)*vFallV;
 if(sheet>.001){
  vec2 side=vec2(-flow.y,flow.x);float across=dot(vWorld.xz,side);
  float s1=fbm(vec2(across*5.,vWorld.y*.9+uTime*4.2));
  float s2=fbm(vec2(across*11.+3.,vWorld.y*2.+uTime*7.));
  float streak=smoothstep(.45,.75,s1*.6+s2*.5);
  // Lábio da queda mais liso e espelhado, base mais branca.
  float lip=smoothstep(uMirrorY-.3,uMirrorY+.25,vWorld.y);
  vec3 sheetC=mix(vec3(.50,.82,.88),vec3(.80,.95,.97),.35+.4*s1);
  sheetC=mix(sheetC,uFoam,streak*(1.-lip*.6));
  sheetC=mix(sheetC,refl,fres*.5*lip);
  col=mix(col,sheetC,sheet);
  a=mix(a,.82+.15*streak,sheet);
 }
 float pz=vWorld.z-(uFallZ+.65);
 float plunge=exp(-pz*pz*.6)*smoothstep(-.9,-.15,pz)*(1.-sheet);
 float churn=fbm(vWorld.xz*2.4+vec2(0.,uTime*1.6))*.6+fbm(vWorld.xz*6.-uTime*1.3)*.4;
 float plungeFoam=smoothstep(.40,.62,churn)*plunge;
 col=mix(col,uFoam,plungeFoam*.9);a=max(a,plungeFoam*.9);

 // Vista de baixo (mergulhando): a superfície brilha, ondula e deixa
 // ver o céu só olhando quase para cima (janela de Snell).
 if(!gl_FrontFacing){
  vec3 nb=normalize(vec3(n.x,-n.y,n.z));
  float up=max(dot(-viewDir,vec3(0.,1.,0.)),0.);
  float window_=smoothstep(.55,.85,up+(gr.x+gr.y)*.08);
  vec3 under=mix(vec3(.28,.62,.68),vec3(.62,.90,.92),.5+.5*sin((gr.x-gr.y)*3.));
  col=mix(under,mix(uSkyHorizon,vec3(1.),.35),window_);
  col+=uSunColor*pow(max(dot(-viewDir,normalize(uSun)),0.),40.)*.6;
  a=.88;
 }
 gl_FragColor=vec4(col,a*alpha);
 float fogF=smoothstep(fogNear,fogFar,vFogDepth);
 gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,fogF);
}`;

function install(){
 const api=window.arcanoWaterV1226;
 if(!api||!api.water||!api.water.material||!api.renderer){setTimeout(install,200);return;}
 const water=api.water,renderer=api.renderer,scene=api.scene;
 if(water.userData.animeRiver)return;
 const old=water.material,ou=old.uniforms||{};
 const geo=water.geometry;
 const profile=window.arcanoRiverProfile;
 const shared=(name,fallback)=>ou[name]||{value:fallback};
 const material=new T.ShaderMaterial({
  transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,
  defines:geo.getAttribute('waveHeight')?{HAS_WAVE:''}:{},
  uniforms:{
   uTime:shared('uTime',0),uWind:shared('uWind',.35),uSun:shared('uSun',new T.Vector3(.4,.8,.3)),
   uSunPower:shared('uSunPower',.8),uCloudiness:shared('uCloudiness',.4),
   uSunColor:{value:srgb('#fff4dc')},
   uSkyTop:{value:srgb('#3d8fe0')},uSkyHorizon:{value:srgb('#bfe8ff')},
   uShallow:{value:srgb('#86d6c6')},uDeep:{value:srgb('#1d6f92')},uFoam:{value:srgb('#f2fbfa')},
   uPlayer:{value:new T.Vector3(0,-999,0)},uPlayerWet:{value:0},
   uRefl:{value:null},uReflMatrix:{value:new T.Matrix4()},uReflReady:{value:0},uMirrorY:{value:0},
   uFallZ:{value:profile&&profile.fall?profile.fall.z:-999},
   fogColor:{value:srgb('#b6c6bc')},fogNear:{value:45},fogFar:{value:120}
  },
  vertexShader,fragmentShader
 });
 material.extensions.derivatives=true;
 material.name='Rio líquido anime';
 water.material=material;
 water.userData.animeRiver=true;
 // O espelho antigo (plano fixo numa poça e atualizado aos saltos) fica
 // desligado; este rio tem o próprio reflexo.
 water.userData.water2=true;
 const u=material.uniforms;

 // ---------- Reflexo planar próprio ----------
 const rtScale=mobile?.25:.35;
 const rt=new T.WebGLRenderTarget(256,256,{minFilter:T.LinearFilter,magFilter:T.LinearFilter,generateMipmaps:false});
 u.uRefl.value=rt.texture;
 const mirror=new T.PerspectiveCamera();
 const plane=new T.Plane(new T.Vector3(0,1,0),0);
 const bias=new T.Matrix4().set(.5,0,0,.5, 0,.5,0,.5, 0,0,.5,.5, 0,0,0,1);
 const tmp=new T.Vector3(),look=new T.Vector3(),size=new T.Vector2();
 let frame=0,rendering=false;
 const grassGroups=()=>{const out=[];scene.traverse(o=>{if(o.name==='Tufos reais de grama Quaternius')out.push(o);});return out;};
 let grass=null;

 function renderReflection(camera){
  const q=api.getGraphicsQuality?api.getGraphicsQuality():'balanced';
  if(q==='low'){u.uReflReady.value=0;return;}
  renderer.getDrawingBufferSize(size);
  const w=Math.max(128,Math.round(size.x*rtScale)),h=Math.max(128,Math.round(size.y*rtScale));
  if(rt.width!==w||rt.height!==h)rt.setSize(w,h);
  // Altura do espelho: nível do rio perto de quem joga.
  const player=api.getGrassPlayer&&api.getGrassPlayer();
  const z=player?player.position.z:camera.position.z;
  const y=profile?profile.levelAt(z):0;
  u.uMirrorY.value=y;
  mirror.copy(camera,false);
  mirror.position.copy(camera.position);mirror.position.y=2*y-camera.position.y;
  camera.getWorldDirection(tmp);
  look.copy(camera.position).add(tmp);look.y=2*y-look.y;
  mirror.up.set(camera.up.x,-camera.up.y,camera.up.z);
  mirror.lookAt(look);
  mirror.far=Math.min(camera.far,48);
  mirror.updateProjectionMatrix();mirror.updateMatrixWorld(true);
  u.uReflMatrix.value.copy(bias).multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);
  plane.constant=-y+.02;
  if(!grass)grass=grassGroups();
  const grassVis=grass.map(g=>g.visible);
  grass.forEach(g=>g.visible=false);
  const oldTarget=renderer.getRenderTarget(),oldClip=renderer.clippingPlanes,
   oldLocal=renderer.localClippingEnabled,oldShadow=renderer.shadowMap.autoUpdate;
  water.visible=false;
  try{
   renderer.shadowMap.autoUpdate=false;
   // Soma no contador de desenho em vez de zerá-lo no meio do quadro.
   renderer.info.autoReset=false;
   renderer.clippingPlanes=[plane];
   renderer.setRenderTarget(rt);renderer.clear(true,true,true);
   renderer.render(scene,mirror);
   u.uReflReady.value=1;
  }catch(e){u.uReflReady.value=0;console.warn('[Rio anime] reflexo indisponível',e);}
  finally{
   renderer.setRenderTarget(oldTarget);renderer.clippingPlanes=oldClip;
   renderer.localClippingEnabled=oldLocal;renderer.shadowMap.autoUpdate=oldShadow;
   renderer.info.autoReset=true;
   water.visible=true;
   grass.forEach((g,i)=>g.visible=grassVis[i]);
  }
 }

 let wet=0;
 const sunTmp=new T.Color();
 water.onBeforeRender=function(r,sc,camera){
  if(rendering)return;
  const main=api.getMainCamera&&api.getMainCamera();
  if(camera!==main)return;
  // Reflexo em TODO quadro, em resolução baixa: alternar quadros pesados e
  // leves deixava o movimento do personagem irregular (pequenos saltos).
  {
   rendering=true;
   try{renderReflection(camera);}finally{rendering=false;}
  }
  const f=scene.fog;
  if(f&&f.isFog){u.fogColor.value.copy(f.color).convertLinearToSRGB();u.fogNear.value=f.near;u.fogFar.value=f.far;}
  // Céu refletido acompanha dia, pôr do sol e noite.
  const s=u.uSun.value,day=Math.min(1,Math.max(0,(s.y+.1)/.28));
  u.uSkyTop.value.setRGB(.03+.19*day,.05+.50*day,.16+.76*day);
  u.uSkyHorizon.value.setRGB(.13+.61*day,.17+.73*day,.36+.64*day);
  sunTmp.setRGB(1,.72+.25*day,.45+.4*day);u.uSunColor.value.copy(sunTmp);
  const player=api.getGrassPlayer&&api.getGrassPlayer();
  let target=0;
  if(player&&player.position){
   u.uPlayer.value.copy(player.position);
   if(profile&&profile.depthAt){
    const depth=profile.depthAt(player.position.x,player.position.z);
    const level=profile.levelAt?profile.levelAt(player.position.z):player.position.y;
    target=depth>.01&&player.position.y<level+.35?1:0;
   }
  }
  wet+=(target-wet)*.08;
  u.uPlayerWet.value=wet;
 };

 // ---------- Névoa e gotas da cachoeira ----------
 if(profile&&profile.fall){
  const fz=profile.fall.z,halfW=(typeof profile.halfWidth==='function'?profile.halfWidth(fz):profile.halfWidth)||3;
  const top=profile.levelAt(fz-.6),bottom=profile.levelAt(fz+.8),cx=profile.center(fz);
  const pointsMaterial=(vs,fsAlpha)=>new T.ShaderMaterial({
   transparent:true,depthWrite:false,
   uniforms:{uTime:u.uTime,uScale:{value:innerHeight*.5},uTop:{value:top},uBottom:{value:bottom},
    uCenter:{value:new T.Vector3(cx,bottom,fz)},uWidth:{value:halfW*.85}},
   vertexShader:vs,
   fragmentShader:`varying float vA;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.96,.99,1.,vA*smoothstep(.5,.0,d)${fsAlpha});}`
  });
  const makePoints=(count,vs,fsAlpha,name)=>{
   const seeds=new Float32Array(count*4);
   for(let i=0;i<count;i++){seeds[i*4]=Math.random()*2-1;seeds[i*4+1]=Math.random();seeds[i*4+2]=Math.random()*2-1;seeds[i*4+3]=Math.random();}
   const g=new T.BufferGeometry();
   g.setAttribute('position',new T.BufferAttribute(new Float32Array(count*3),3));
   g.setAttribute('seed',new T.BufferAttribute(seeds,4));
   const p=new T.Points(g,pointsMaterial(vs,fsAlpha));
   p.name=name;p.frustumCulled=false;p.renderOrder=4;scene.add(p);
  };
  // Névoa subindo do pé da queda.
  makePoints(mobile?80:160,`attribute vec4 seed;uniform float uTime,uWidth,uScale;uniform vec3 uCenter;varying float vA;
   void main(){
    float p=fract(uTime*(.16+.12*seed.w)+seed.y);
    vec3 pos=uCenter+vec3(seed.x*uWidth,p*2.4,.7+seed.z*.9+p*1.3);
    vA=sin(p*3.14159)*.38;
    vec4 mv=modelViewMatrix*vec4(pos,1.);
    gl_PointSize=(.6+p*1.4)*uScale/max(.1,-mv.z);
    gl_Position=projectionMatrix*mv;
   }`,'','Névoa da cachoeira');
  // Gotas caindo junto da lâmina e respingando no poço.
  makePoints(mobile?90:200,`attribute vec4 seed;uniform float uTime,uWidth,uScale,uTop,uBottom;uniform vec3 uCenter;varying float vA;
   void main(){
    float life=fract(uTime*(.55+.35*seed.w)+seed.y);
    float drop=uTop-uBottom;
    float fallT=clamp(life/.7,0.,1.);
    float y=uTop+.05-drop*fallT*fallT;
    float z=uCenter.z-.65+fallT*.55;
    // Depois de cair, as gotas respingam para cima e para fora.
    if(life>.7){float b=(life-.7)/.3;y=uBottom+sin(b*3.14159)*(.35+.4*seed.w);z+=b*(.6+seed.z*.5);}
    vec3 pos=vec3(uCenter.x+seed.x*uWidth,y,z);
    vA=.75*(1.-smoothstep(.85,1.,life));
    vec4 mv=modelViewMatrix*vec4(pos,1.);
    gl_PointSize=(.05+.05*seed.w)*uScale/max(.1,-mv.z);
    gl_Position=projectionMatrix*mv;
   }`,'','Gotas da cachoeira');
 }
 // ---------- Debaixo d'água: tom azul, raios de luz e bolhas ----------
 const css=document.createElement('style');
 css.textContent=`#animeUnderwater{position:fixed;inset:0;pointer-events:none;z-index:2;opacity:0;transition:opacity .35s;
   background:linear-gradient(180deg,rgba(150,230,235,.30),rgba(30,110,130,.18) 45%,rgba(10,50,70,.38));}
  #animeUnderwater.on{opacity:1}
  #animeUnderwater::before{content:'';position:absolute;inset:-20% -10% 0;opacity:.35;mix-blend-mode:screen;
   background:repeating-linear-gradient(100deg,rgba(255,255,255,0) 0 40px,rgba(220,255,250,.35) 55px,rgba(255,255,255,0) 80px 140px);
   -webkit-mask-image:linear-gradient(180deg,#000,transparent 75%);mask-image:linear-gradient(180deg,#000,transparent 75%);
   animation:animeRays 6s ease-in-out infinite alternate}
  @keyframes animeRays{from{transform:translateX(-30px) skewX(-4deg)}to{transform:translateX(30px) skewX(4deg)}}`;
 document.head.appendChild(css);
 const overlay=document.createElement('div');overlay.id='animeUnderwater';document.body.appendChild(overlay);
 const bubbleUniforms={uTime:u.uTime,uPlayer:u.uPlayer,uOn:{value:0},uScale:{value:innerHeight*.5}};
 {
  const count=60,seeds=new Float32Array(count*4);
  for(let i=0;i<count;i++){seeds[i*4]=Math.random()*2-1;seeds[i*4+1]=Math.random();seeds[i*4+2]=Math.random()*2-1;seeds[i*4+3]=Math.random();}
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.BufferAttribute(new Float32Array(count*3),3));
  g.setAttribute('seed',new T.BufferAttribute(seeds,4));
  const bubbles=new T.Points(g,new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:bubbleUniforms,
   vertexShader:`attribute vec4 seed;uniform float uTime,uOn,uScale;uniform vec3 uPlayer;varying float vA;
    void main(){
     float p=fract(uTime*(.35+.3*seed.w)+seed.y);
     vec3 pos=uPlayer+vec3(seed.x*.35+sin(uTime*3.+seed.y*20.)*.05,1.4+p*2.2,seed.z*.35);
     vA=uOn*(1.-p)*.8;
     vec4 mv=modelViewMatrix*vec4(pos,1.);
     gl_PointSize=(.04+.05*seed.w)*uScale/max(.1,-mv.z);
     gl_Position=projectionMatrix*mv;
    }`,
   fragmentShader:`varying float vA;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;
    float ring=smoothstep(.5,.38,d)*(.35+.65*smoothstep(.25,.45,d));gl_FragColor=vec4(.9,1.,1.,vA*ring);}`}));
  bubbles.name='Bolhas do mergulho';bubbles.frustumCulled=false;bubbles.renderOrder=5;scene.add(bubbles);
 }
 const baseBefore=water.onBeforeRender;
 water.onBeforeRender=function(r,sc,camera){
  baseBefore.call(this,r,sc,camera);
  const under=!!window.arcanoUnderwater;
  overlay.classList.toggle('on',under);
  const player=api.getGrassPlayer&&api.getGrassPlayer();
  bubbleUniforms.uOn.value=under&&player&&player.swimming?1:0;
 };
 window.arcanoAnimeRiver={material,reflection:rt,restore(){water.material=old;water.userData.water2=false;water.userData.animeRiver=false;water.onBeforeRender=()=>{};}};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
