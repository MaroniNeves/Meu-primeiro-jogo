/* Rio estilo anime (inspirado em Genshin Impact).
   Substitui o shader da superfície do rio por uma versão estilizada:
   - gradiente turquesa → azul profundo pela profundidade;
   - linhas de cáustica animadas que seguem a correnteza (flow map em duas fases);
   - espuma recortada nas margens e listras de correnteza nas partes rápidas;
   - brilhos do sol em degraus, cintilância e fresnel com a cor do céu;
   - ondulações em anel ao redor do personagem quando ele entra na água.
   Também desliga a captura de reflexo planar (uma renderização extra da cena
   inteira a cada poucos quadros), o que deixa o jogo mais leve. */
(function(){
'use strict';
const T=window.THREE;
// O shader escreve a cor direto na tela (sRGB); THREE.Color guarda em linear.
const srgb=hex=>new T.Color(hex).convertLinearToSRGB();
if(!T)return;

const vertexShader=`
precision highp float;
attribute float waterDepth;
attribute vec2 waterFlow;
uniform float uTime,uWind;
varying vec3 vWorld;
varying float vDepth;
varying vec2 vFlow;
varying vec2 vAcross;
varying float vFogDepth;
#ifdef HAS_WAVE
attribute float waveHeight;
#endif
void main(){
 vec3 p=position;
 #ifdef HAS_WAVE
 p.y+=waveHeight;
 #endif
 vDepth=waterDepth;vFlow=waterFlow;vAcross=uv;
 float body=smoothstep(.01,.09,waterDepth);
 float speed=clamp(length(waterFlow),0.,1.3);
 // Ondulação suave e lenta, com amplitude maior onde a correnteza é forte.
 float a=p.x*2.6+p.z*1.1-uTime*(1.1+speed);
 float b=p.z*3.9-p.x*1.3+uTime*(1.3+.8*speed);
 p.y+=(sin(a)*.6+sin(b)*.4)*(.006+.012*speed+.006*uWind)*body;
 vec4 w=modelMatrix*vec4(p,1.);
 vWorld=w.xyz;
 vec4 mv=viewMatrix*w;
 vFogDepth=-mv.z;
 gl_Position=projectionMatrix*mv;
}`;

const fragmentShader=`
precision highp float;
uniform float uTime,uWind,uSunPower,uCloudiness;
uniform vec3 uSun;
uniform vec3 uShallow,uMid,uDeep,uSky,uFoam;
uniform vec3 uPlayer;
uniform float uPlayerWet;
uniform vec3 fogColor;
uniform float fogNear,fogFar;
varying vec3 vWorld;
varying float vDepth;
varying vec2 vFlow;
varying vec2 vAcross;
varying float vFogDepth;

vec2 hash2(vec2 p){
 p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));
 return fract(sin(p)*43758.5453);
}
float hash1(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453);}
float noise(vec2 p){
 vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 float a=hash1(i),b=hash1(i+vec2(1,0)),c=hash1(i+vec2(0,1)),d=hash1(i+vec2(1,1));
 return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}
// Distância à borda das células de Voronoi: gera as linhas de cáustica.
float voronoiEdge(vec2 p,float t){
 vec2 n=floor(p),f=fract(p);
 vec2 mg,mr;float md=8.;
 for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
  vec2 g=vec2(float(i),float(j));
  vec2 o=hash2(n+g);o=.5+.5*sin(t+6.2831*o);
  vec2 r=g+o-f;float d=dot(r,r);
  if(d<md){md=d;mr=r;mg=g;}
 }
 md=8.;
 for(int j=-2;j<=2;j++)for(int i=-2;i<=2;i++){
  vec2 g=mg+vec2(float(i),float(j));
  vec2 o=hash2(n+g);o=.5+.5*sin(t+6.2831*o);
  vec2 r=g+o-f;
  if(dot(mr-r,mr-r)>.00001)md=min(md,dot(.5*(mr+r),normalize(r-mr)));
 }
 return md;
}
// Padrão de superfície arrastado pela correnteza sem esticar (duas fases cruzadas).
float flowPattern(vec2 p,vec2 flow,float speed,float scale){
 float t=uTime*.32;
 float ph0=fract(t),ph1=fract(t+.5);
 float w=abs(ph0-.5)*2.;
 vec2 f=flow*speed;
 float a=voronoiEdge((p-f*ph0*1.6)*scale,uTime*.9);
 float b=voronoiEdge((p-f*ph1*1.6)*scale+vec2(.37,.71),uTime*.9);
 return mix(a,b,w);
}

void main(){
 float edgeNoise=noise(vWorld.xz*3.1+uTime*.25)*.012;
 float alpha=smoothstep(.002,.02,vDepth-.004+edgeNoise);
 if(alpha<.02)discard;

 float speed=clamp(length(vFlow),0.,1.3);
 vec2 flowDir=speed>.001?vFlow/speed:vec2(0.,1.);
 vec2 flow=vec2(flowDir.x,flowDir.y);

 // ---------- Cor base pela profundidade (degraus suaves, tipo anime) ----------
 float d1=smoothstep(.02,.22,vDepth);
 float d2=smoothstep(.22,.75,vDepth);
 float d3=smoothstep(.75,1.4,vDepth);
 vec3 col=mix(uShallow,uMid,d1);
 col=mix(col,uDeep,d2*.85);
 col=mix(col,uDeep*.85,d3*.5);

 // ---------- Normal estilizada para luz e fresnel ----------
 vec2 np=vWorld.xz*1.7-flow*uTime*.55*(.4+speed);
 vec2 tilt=vec2(noise(np)-.5,noise(np+vec2(5.2,1.3))-.5);
 vec3 n=normalize(vec3(tilt.x*.55,1.,tilt.y*.55));
 vec3 viewDir=normalize(cameraPosition-vWorld);
 float fres=pow(1.-clamp(dot(n,viewDir),0.,1.),3.);
 col=mix(col,uSky,smoothstep(.15,.85,fres)*.55);

 // ---------- Linhas de cáustica (as "redes" claras do Genshin) ----------
 float cell=flowPattern(vWorld.xz,flow,.55+speed,1.15);
 float caustic=1.-smoothstep(.02,.075,cell);
 float shallowView=1.-d2*.7;
 col+=vec3(.70,.98,1.)*caustic*.30*shallowView;
 float fine=1.-smoothstep(.015,.05,flowPattern(vWorld.xz*1.9+3.1,flow,.7+speed,1.));
 col+=vec3(.75,1.,1.)*fine*.12*shallowView;

 // ---------- Listras de correnteza nas partes rápidas ----------
 vec2 side=vec2(-flow.y,flow.x);
 float along=dot(vWorld.xz,flow),across=dot(vWorld.xz,side);
 float streak=noise(vec2(across*5.,along*.55-uTime*(1.4+speed*2.2)));
 streak=smoothstep(.70,.78,streak)*smoothstep(.45,1.,speed)*d1;
 col=mix(col,uFoam,streak*.55);

 // ---------- Espuma recortada nas margens ----------
 float bank=1.-smoothstep(.0,.075,vDepth);
 float edgeUv=1.-smoothstep(.0,.10,min(vAcross.x,1.-vAcross.x));
 float foamField=max(bank,edgeUv*.8);
 float foamNoise=noise(vWorld.xz*4.5+flow*uTime*.6)*.6+noise(vWorld.xz*11.-uTime*.4)*.4;
 float foam=step(.55,foamField+foamNoise*.55-.25);
 float foamLine=step(.5,foamField+foamNoise*.4)*(1.-foam);
 col=mix(col,uFoam,foam*.92);
 col=mix(col,mix(col,uFoam,.55),foamLine*.6);

 // ---------- Anéis ao redor do personagem ----------
 float pd=length(vWorld.xz-uPlayer.xz);
 float ring=sin(pd*9.-uTime*7.);
 ring=smoothstep(.82,.94,ring)*smoothstep(2.8,.25,pd)*uPlayerWet;
 float wake=smoothstep(.55,.18,pd)*uPlayerWet;
 col=mix(col,uFoam,clamp(ring*.75+wake*.5,0.,1.));

 // ---------- Brilho do sol em degraus + cintilância ----------
 vec3 sunDir=normalize(uSun);
 vec3 h=normalize(sunDir+viewDir);
 float spec=pow(max(dot(n,h),0.),140.);
 float sunUp=smoothstep(-.05,.25,sunDir.y)*(1.-uCloudiness*.7);
 col+=vec3(1.,.97,.86)*step(.35,spec)*.85*uSunPower*sunUp;
 vec2 gp=floor(vWorld.xz*13.);
 float glitter=step(.985,hash1(gp+floor(uTime*3.)))*step(.45,noise(vWorld.xz*2.-uTime*.3));
 col+=vec3(1.)*glitter*.55*sunUp*fres*2.;

 // ---------- Transparência: rasa e clara, funda e cheia ----------
 float a=mix(.55,.90,d1);
 a=mix(a,.96,d2);
 a=max(a,foam*.97);
 a=max(a,fres*.85);
 gl_FragColor=vec4(col,a*alpha);

 float fogF=smoothstep(fogNear,fogFar,vFogDepth);
 gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,fogF);
}`;

function install(){
 const api=window.arcanoWaterV1226;
 if(!api||!api.water||!api.water.material){setTimeout(install,200);return;}
 const water=api.water;
 if(water.userData.animeRiver)return;
 const old=water.material;
 const ou=old.uniforms||{};
 const geo=water.geometry;
 const shared=name=>ou[name]||{value:name==='uSun'?new T.Vector3(.4,.8,.3):name==='uSunPower'?.8:name==='uCloudiness'?.4:name==='uWind'?.35:0};
 const material=new T.ShaderMaterial({
  transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,
  defines:geo.getAttribute('waveHeight')?{HAS_WAVE:''}:{},
  uniforms:{
   uTime:shared('uTime'),uWind:shared('uWind'),uSun:shared('uSun'),
   uSunPower:shared('uSunPower'),uCloudiness:shared('uCloudiness'),
   uShallow:{value:srgb('#8ff0dc')},
   uMid:{value:srgb('#3cc6cf')},
   uDeep:{value:srgb('#2b86c2')},
   uSky:{value:srgb('#c9ecff')},
   uFoam:{value:srgb('#f4fffd')},
   uPlayer:{value:new T.Vector3(0,-999,0)},uPlayerWet:{value:0},
   fogColor:{value:srgb('#b6c6bc')},fogNear:{value:45},fogFar:{value:120}
  },
  vertexShader,fragmentShader
 });
 material.name='Rio anime';
 water.material=material;
 water.userData.animeRiver=true;
 // O shader novo não usa o reflexo planar: o laço principal deixa de
 // renderizar a cena uma segunda vez para o espelho da água.
 water.userData.water2=true;

 const scene=api.scene;
 const u=material.uniforms;
 let wet=0;
 water.onBeforeRender=function(){
  const f=scene.fog;
  if(f&&f.isFog){u.fogColor.value.copy(f.color).convertLinearToSRGB();u.fogNear.value=f.near;u.fogFar.value=f.far;}
  const player=api.getGrassPlayer&&api.getGrassPlayer();
  const profile=window.arcanoRiverProfile;
  let target=0;
  if(player&&player.position){
   u.uPlayer.value.copy(player.position);
   if(profile&&profile.depthAt){
    const depth=profile.depthAt(player.position.x,player.position.z);
    // Só conta como "na água" se estiver no nível do rio (não em cima da ponte).
    const level=profile.levelAt?profile.levelAt(player.position.z):player.position.y;
    target=depth>.01&&player.position.y<level+.35?1:0;
   }
  }
  wet+=(target-wet)*.08;
  u.uPlayerWet.value=wet;
 };
 window.arcanoAnimeRiver={material,restore(){water.material=old;water.userData.water2=false;water.userData.animeRiver=false;water.onBeforeRender=()=>{};}};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
