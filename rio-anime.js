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
uniform float uTime,uWind,uFallZ,uFallTop,uFallDrop;
varying float vFallS;
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
 // Queda: o PRÓPRIO rio dobra na borda e cai em arco (um elemento só).
 float zone=1.-smoothstep(.36,.5,abs(p.z-uFallZ));
 float fs=clamp((uFallTop-p.y)/max(uFallDrop,.01),0.,1.)*zone;
 vFallS=fs;vFallV=step(.002,fs);
 float throwZ=.22+.11*sqrt(uFallDrop);
 p.z+=throwZ*sqrt(fs);
 p.z+=fs*(.03*sin(p.x*6.3+uTime*7.)+.02*sin(p.y*4.7-uTime*10.+p.x*2.));
 p.x+=fs*.02*sin(p.y*6.-uTime*8.);
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
varying float vFallS;
uniform vec3 uSun,uSunColor,uSkyTop,uSkyHorizon;
uniform vec3 uShallow,uDeep,uFoam;
uniform vec3 uPlayer;
uniform float uPlayerWet;
// Rastro: anéis soltos a cada passo na água (x,z, instante, força).
uniform vec4 uRings[12];
uniform float uClock;
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
 // Cada anel se expande a ~1,4 m/s e some aos poucos; vários anéis seguidos
 // (personagem andando) formam a esteira em V atrás dele.
 vec2 ringG=vec2(0.);float ringW=0.;
 for(int i=0;i<12;i++){
  vec4 rg=uRings[i];
  float age=uClock-rg.z;
  if(rg.w<=0.||age<0.||age>3.)continue;
  vec2 dv=vWorld.xz-rg.xy;float d=length(dv);
  float r=.15+age*1.4;
  float env=exp(-pow((d-r)*2.6,2.))*rg.w*exp(-age*1.3);
  float ph=(d-r)*16.;
  ringW+=sin(ph)*env;
  ringG+=(d>.001?dv/d:vec2(0.))*cos(ph)*env*1.2;
 }
 // Onde a queda bate no poço: ondas saindo da linha de impacto.
 {
  float pz2=vWorld.z-(uFallZ+.5);
  if(pz2>0.&&pz2<7.){
   float env=exp(-pz2*.55)*smoothstep(0.,.3,pz2);
   float ph=pz2*11.-uClock*7.+sin(vWorld.x*2.3)*1.5;
   ringG.y+=cos(ph)*env*.9;ringG.x+=sin(ph*.7+vWorld.x)*env*.25;
   ringW+=sin(ph)*env*.6;
  }
 }
 // Água empurrada logo em volta do corpo.
 vec2 toP=vWorld.xz-uPlayer.xz;float pd=length(toP);
 float bodyPush=smoothstep(.55,.15,pd)*uPlayerWet;
 ringG+=(pd>.001?toP/pd:vec2(0.))*sin(pd*18.-uClock*9.)*bodyPush*.5;
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
 // Caminho da luz dentro d'água: olhando de lado ela atravessa mais água,
 // então fica mais densa (dá volume em vez de parecer uma película).
 float path=vDepth/max(viewDir.y,.18);
 float thick=1.-exp(-path*1.6);
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
 float foam=clamp(foamBank*.85+foamFast*.5+max(ringW,0.)*.35+bodyPush*.35,0.,1.);
 col=mix(col,uFoam,foam);a=max(a,foam*.9);

 // ---------- Cachoeira ----------
 vec3 fdx=dFdx(vWorld),fdy=dFdy(vWorld);
 vec3 fnrm=normalize(cross(fdx,fdy));
 float steep=1.-abs(fnrm.y);
 // A parte vertical da superfície some: a queda é desenhada pela
 // "cortina" com volume (malha própria, ver makeWaterfall).
 float sheet=smoothstep(.30,.62,steep)*vFallV;
 if(sheet>.001){
  // Mesma água do rio (mesmas cores e reflexo), com listras de espuma descendo.
  // Listras na vertical (ao longo de x): a água cai reta, não na diagonal.
  float across=vWorld.x;
  float s1=fbm(vec2(across*4.,vWorld.y*1.1+uTime*4.5));
  float s2=fbm(vec2(across*10.+3.,vWorld.y*2.4+uTime*7.5));
  // A lâmina é a MESMA água (mesma cor e reflexo calculados acima);
  // só ganha listras de espuma conforme cai.
  float streak=smoothstep(.55,.85,s1*.6+s2*.5)*smoothstep(.1,.7,vFallS);
  col=mix(col,uFoam,streak*.75);
  a=mix(a,max(a,.88)+.1*streak,sheet);
 }
 float pz=vWorld.z-(uFallZ+.65);
 float plunge=exp(-pz*pz*.6)*smoothstep(-.9,-.15,pz)*(1.-sheet);
 float churn=fbm(vWorld.xz*2.4+vec2(0.,uTime*1.6))*.6+fbm(vWorld.xz*6.-uTime*1.3)*.4;
 // Espuma densa onde a queda bate: quase branca colada à queda, se abrindo em manchas.
 float near=exp(-pz*pz*2.2)*smoothstep(-.9,-.15,pz)*(1.-sheet);
 float plungeFoam=clamp(smoothstep(.30,.55,churn)*plunge+near*(.75+.25*churn),0.,1.);
 col=mix(col,uFoam*(.92+.08*churn),plungeFoam);a=max(a,plungeFoam*.95);

 // Vista de baixo (mergulhando): a superfície brilha, ondula e deixa
 // ver o céu só olhando quase para cima (janela de Snell).
 if(!gl_FrontFacing){
  vec3 nb=normalize(vec3(n.x,-n.y,n.z));
  float up=max(dot(-viewDir,vec3(0.,1.,0.)),0.);
  float window_=smoothstep(.62,.97,up+n.x*.06);
  vec3 under=mix(vec3(.22,.55,.64),vec3(.50,.82,.88),smoothstep(.1,.9,up)+(n.x+n.z)*.25);
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
   uRings:{value:Array.from({length:12},()=>new T.Vector4(0,0,-99,0))},uClock:{value:0},
   uRefl:{value:null},uReflMatrix:{value:new T.Matrix4()},uReflReady:{value:0},uMirrorY:{value:0},
   uFallZ:{value:profile&&profile.fall?profile.fall.z:-999},
   uFallTop:{value:profile&&profile.fall?profile.levelAt(profile.fall.z-.6):-999},
   uFallDrop:{value:profile&&profile.fall?profile.levelAt(profile.fall.z-.6)-profile.levelAt(profile.fall.z+.8):1},
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
 // Fora do reflexo: grama e o que fica longe do rio (floresta e base da ilha).
 // Toda água que usa o próprio reflexo também sai (senão a placa de vídeo lê e escreve a mesma imagem).
 const HIDE=new Set(['Tufos reais de grama Quaternius','Floresta da Ilha Central','Pedra da base da ilha flutuante','Pedras flutuantes da ilha','Rio da Ilha Central · até a borda','Canal da nascente','Lago da nascente']);
 const grassGroups=()=>{const out=[];scene.traverse(o=>{if(HIDE.has(o.name))out.push(o);});return out;};
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
  const y=window.arcanoWaterLevelAt?window.arcanoWaterLevelAt(player?player.position.x:camera.position.x,z):(profile?profile.levelAt(z):0);
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
  if(!grass||(frame++%240)===0)grass=grassGroups();
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

 let wet=0,ringIndex=0;const lastRing={x:0,z:0,t:0};
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
    const level=window.arcanoWaterLevelAt?window.arcanoWaterLevelAt(player.position.x,player.position.z):profile.levelAt(player.position.z);
    target=depth>.01&&player.position.y<level+.35?1:0;
   }
  }
  wet+=(target-wet)*.08;
  // Solta um anel a cada passo dentro d'água (mais vezes quando anda).
  const now=performance.now()/1000;u.uClock.value=now;
  if(player&&target>0){
   const p=player.position,moved=Math.hypot(p.x-lastRing.x,p.z-lastRing.z);
   if((moved>.35&&now-lastRing.t>.16)||now-lastRing.t>1.1){
    const slot=u.uRings.value[ringIndex++%12];
    slot.set(p.x,p.z,now,moved>.35?.55:.3);
    lastRing.x=p.x;lastRing.z=p.z;lastRing.t=now;
   }
  }
  u.uPlayerWet.value=wet;
 };

 // ---------- Cachoeira com volume ----------
 // Uma "cortina" de água com espessura e bordas arredondadas: sai da borda
 // fazendo a curva (lançamento) e cai, ondulando, com espuma escorrendo.
 const fallMaterial=new T.ShaderMaterial({
  transparent:true,depthWrite:false,side:T.DoubleSide,
  uniforms:{uTime:u.uTime,uSun:u.uSun,uSunColor:u.uSunColor,uSkyTop:u.uSkyTop,uSkyHorizon:u.uSkyHorizon,
   uSunPower:u.uSunPower,fogColor:u.fogColor,fogNear:u.fogNear,fogFar:u.fogFar},
  vertexShader:`
   attribute vec2 fallInfo; // x = posição ao longo da queda (0 borda, 1 base), y = cos do contorno (-1..1 lados)
   uniform float uTime;
   varying vec3 vWorld;varying vec3 vN;varying float vT;varying float vSide;varying float vFogDepth;
   void main(){
    vT=fallInfo.x;vSide=fallInfo.y;
    vec3 p=position;
    float t=max(vT,0.);
    p.x+=sin(t*9.-uTime*6.+p.x*2.3)*.035*t;
    p+=normal*(sin(p.x*5.+uTime*8.-t*14.)*.025+sin(p.x*11.-uTime*11.)*.012)*smoothstep(0.,.2,t);
    vec4 w=modelMatrix*vec4(p,1.);vWorld=w.xyz;vN=normalize(mat3(modelMatrix)*normal);
    vec4 mv=viewMatrix*w;vFogDepth=-mv.z;gl_Position=projectionMatrix*mv;
   }`,
  fragmentShader:`
   uniform float uTime,uSunPower;uniform vec3 uSun,uSunColor,uSkyTop,uSkyHorizon,fogColor;uniform float fogNear,fogFar;
   varying vec3 vWorld;varying vec3 vN;varying float vT;varying float vSide;varying float vFogDepth;
   float h(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453);}
   float nz(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
   float fbm(vec2 p){return nz(p)*.55+nz(p*2.1+3.7)*.3+nz(p*4.3-1.9)*.15;}
   void main(){
    float t=clamp(vT,0.,1.);
    // Listras escorrendo para baixo (rápidas) e espuma que aumenta na base.
    float f1=fbm(vec2(vWorld.x*2.6,vT*6.-uTime*3.4));
    float f2=fbm(vec2(vWorld.x*6.5+5.,vT*13.-uTime*5.6));
    float edge=smoothstep(.70,1.,abs(vSide));
    float foam=smoothstep(.48,.80,f1*.6+f2*.5+t*.38+edge*.30-(1.-smoothstep(0.,.18,vT))*.35);
    vec3 viewDir=normalize(cameraPosition-vWorld);
    vec2 g=vec2(f2-f1,fbm(vec2(vWorld.x*4.,vT*9.-uTime*4.))-.5);
    vec3 n=normalize(vN+vec3(g.x,0.,g.y)*.6);
    vec3 sun=normalize(uSun);
    float lit=.62+.38*max(dot(n,sun),0.);
    float fres=.04+.96*pow(1.-max(dot(n,viewDir),0.),4.);
    vec3 water=mix(vec3(.24,.62,.72),vec3(.50,.86,.90),f1);
    // Borda de cima: água lisa e espelhada antes de quebrar em espuma.
    float lip=1.-smoothstep(.02,.22,vT);
    vec3 sky=mix(uSkyHorizon,uSkyTop,.4);
    vec3 col=mix(water*lit,sky,fres*(.35+.4*lip));
    col=mix(col,vec3(.95,.99,1.)*(.82+.18*lit),foam);
    float spec=pow(max(dot(reflect(-sun,n),viewDir),0.),60.)*uSunPower;
    col+=uSunColor*spec*.6;
    float a=mix(.68,.97,foam);a=mix(a,.55,edge*(1.-foam));
    col=mix(col,fogColor,smoothstep(fogNear,fogFar,vFogDepth));
    gl_FragColor=vec4(col,a);
   }`
 });
 fallMaterial.name='Cachoeira com volume';
 function makeWaterfall(opt){
  const NT=opt.rows||26,NP=16,halfW=opt.halfWidth,drop=opt.drop;
  const throwZ=(.55+.18*Math.sqrt(drop))*(opt.dir||1);
  const pos=[],info=[],idx=[];
  const rows=[];
  for(let r=0;r<NT;r++){const t=-.14+r/(NT-1)*1.2;rows.push(t);}
  rows.forEach((t,r)=>{
   const tt=Math.max(t,0);
   const zc=opt.zLip+(t<0?t*1.2*(opt.dir||1):throwZ*tt);
   const yc=opt.yTop-(t<0?0:drop*tt*tt);
   // Tangente e normal no plano vertical (para a espessura).
   const tz=t<0?(opt.dir||1):throwZ,ty=t<0?0:-2*drop*tt,len=Math.hypot(tz,ty)||1;
   const nzv=-ty/len*(opt.dir||1),nyv=tz/len*(opt.dir||1);
   const w=halfW*(1+.18*Math.max(0,tt)),th=.10+.16*Math.min(1,tt);
   for(let k=0;k<NP;k++){
    const ph=k/NP*Math.PI*2,c=Math.cos(ph),s=Math.sin(ph);
    const across=c*w,off=s*th*(1-.4*Math.abs(c));
    pos.push(opt.x+across,yc+nyv*off,zc+nzv*off);
    info.push(t,c);
    if(r<NT-1){const a=r*NP+k,b=r*NP+(k+1)%NP,cc=a+NP,d=b+NP;idx.push(a,cc,b,b,cc,d);}
   }
  });
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  g.setAttribute('fallInfo',new T.Float32BufferAttribute(info,2));
  g.setIndex(idx);g.computeVertexNormals();
  const m=new T.Mesh(g,fallMaterial);m.name=opt.name||'Cachoeira com volume';
  m.frustumCulled=false;m.renderOrder=4;scene.add(m);
  return m;
 }
 window.arcanoMakeWaterfall=makeWaterfall;
 // A cachoeira do rio é desenhada pelo próprio rio (ver vertexShader): sem malha separada.

 // ---------- Volume da cachoeira ----------
 // A queda é a própria superfície do rio; para não parecer uma "linha" vista
 // de lado, ganha uma parede de trás e duas laterais com o MESMO material
 // (mesma água, mesma curva de queda calculada no shader).
 function fallShell(mat,rows,cx,w,back,name){
  // rows: [{y,z}] da frente (de cima para baixo), coordenadas antes da curva.
  const COLS=10,pos=[],dep=[],flw=[],uvs=[],idx=[];
  const push=(x,y,z,u,v)=>{pos.push(x,y,z);dep.push(1.6);flw.push(0,.52);uvs.push(u,v);return pos.length/3-1;};
  const R=rows.length;
  // Parede de trás.
  const backId=[];
  rows.forEach((r,j)=>{backId[j]=[];for(let c=0;c<COLS;c++)backId[j].push(push(cx-w+2*w*c/(COLS-1),r.y,r.z-back,c/(COLS-1),j/(R-1)));});
  for(let j=0;j<R-1;j++)for(let c=0;c<COLS-1;c++){const a=backId[j][c],b=backId[j][c+1],d=backId[j+1][c],e=backId[j+1][c+1];idx.push(a,d,b,b,d,e);}
  // Laterais (ligam a frente à parede de trás).
  for(const side of [-1,1]){
   const x=cx+side*w,ids=[];
   rows.forEach((r,j)=>ids.push([push(x,r.y,r.z,0,j/(R-1)),push(x,r.y,r.z-back,1,j/(R-1))]));
   for(let j=0;j<R-1;j++){const a=ids[j][0],b=ids[j][1],d=ids[j+1][0],e=ids[j+1][1];idx.push(a,d,b,b,d,e);}
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('waterDepth',new T.Float32BufferAttribute(dep,1));
  g.setAttribute('waterFlow',new T.Float32BufferAttribute(flw,2));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
  g.setIndex(idx);
  const m=new T.Mesh(g,mat);m.name=name;m.frustumCulled=false;m.renderOrder=3;scene.add(m);
  return m;
 }
 window.arcanoFallShell=fallShell;
 if(profile&&profile.fall){
  const fz=profile.fall.z,top=u.uFallTop.value,drop=u.uFallDrop.value;
  const rows=[];
  for(let k=0;k<=14;k++){const s=k/14;rows.push({y:top-.01-drop*s,z:fz-.35+.7*s});}
  const w=((typeof profile.halfWidth==='function'?profile.halfWidth(fz):profile.halfWidth)||3)*.96;
  fallShell(material,rows,profile.center(fz),w,.28,'Volume da cachoeira do rio');
 }

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
  // Respingos: gotas espirrando para cima e para fora na linha de impacto
  // (nascem embaixo, nunca sobre o rio de cima).
  makePoints(mobile?120:260,`attribute vec4 seed;uniform float uTime,uWidth,uScale,uBottom;uniform vec3 uCenter;varying float vA;
   void main(){
    float t=fract(uTime*(.9+.5*seed.w)+seed.y)*.95;
    float up=1.3+1.9*seed.w,out_=.5+.9*abs(seed.z);
    vec3 pos=vec3(uCenter.x+seed.x*uWidth+seed.x*.25*t,uBottom+up*t-4.9*t*t,uCenter.z+.75+out_*t);
    vA=(pos.y>uBottom-.05?1.:0.)*(1.-smoothstep(.55,.95,t))*.9;
    vec4 mv=modelViewMatrix*vec4(pos,1.);
    gl_PointSize=(.06+.08*seed.w)*uScale/max(.1,-mv.z);
    gl_Position=projectionMatrix*mv;
   }`,'','Respingos da cachoeira');
  // Nuvens de espuma branca, grandes e lentas, cobrindo o encontro com o poço.
  makePoints(mobile?40:80,`attribute vec4 seed;uniform float uTime,uWidth,uScale,uBottom;uniform vec3 uCenter;varying float vA;
   void main(){
    float t=fract(uTime*(.25+.15*seed.w)+seed.y);
    vec3 pos=vec3(uCenter.x+seed.x*uWidth*1.05,uBottom+.05+t*.45,uCenter.z+.6+abs(seed.z)*.9+t*.5);
    vA=sin(t*3.14159)*.75;
    vec4 mv=modelViewMatrix*vec4(pos,1.);
    gl_PointSize=(.55+.6*seed.w)*uScale/max(.1,-mv.z);
    gl_Position=projectionMatrix*mv;
   }`,'','Espuma do pé da cachoeira');
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
