/* Céu anime (inspirado em Genshin Impact) com ciclo de dia e noite.
   Usa o relógio solar do jogo (1 dia = 24 min): o sol, a cobertura de nuvens
   e o vento vêm dos mesmos uniformes do céu original.
   - Dia: azul limpo com horizonte claro e nuvens de borda recortada.
   - Pôr/nascer do sol: laranja, rosa e lilás, nuvens douradas.
   - Noite: azul-marinho e roxo, estrelas que cintilam, Via Láctea e lua.
   - A névoa da paisagem acompanha a cor do horizonte e uma luz da lua
     azulada ilumina a cena à noite. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;

const fragmentShader=`
precision highp float;
varying vec3 vSkyDir;
uniform float uTime,uCoverage,uWind,uSunVisible,uNight,uClock;
uniform vec3 uSunDir;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
 vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){
 float v=0.,a=.5;
 for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}
 return v;
}

void main(){
 vec3 dir=normalize(vSkyDir);
 vec3 sun=normalize(uSunDir);
 float h=dir.y;
 float sunY=sun.y;

 float day=smoothstep(-.10,.18,sunY);
 float night=1.-smoothstep(-.22,-.02,sunY);
 float dusk=(1.-smoothstep(.0,.32,abs(sunY+.02)))*(1.-night*.6);
 float toSun=max(dot(dir,sun),0.);

 // ---------- Gradientes ----------
 vec3 dayTop=vec3(.22,.55,.92),dayHor=vec3(.74,.90,1.);
 vec3 duskTop=vec3(.30,.33,.66),duskHor=vec3(1.,.62,.45),duskSun=vec3(1.,.80,.50);
 vec3 nightTop=vec3(.03,.05,.16),nightHor=vec3(.13,.17,.36);
 float g=pow(clamp(h,0.,1.),.55);
 vec3 skyDay=mix(dayHor,dayTop,g);
 vec3 skyDusk=mix(mix(duskHor,vec3(.85,.55,.70),smoothstep(.05,.3,h)),duskTop,smoothstep(.15,.85,g));
 skyDusk=mix(skyDusk,duskSun,pow(toSun,6.)*.8*(1.-g));
 vec3 skyNight=mix(nightHor,nightTop,g);
 vec3 col=mix(skyNight,skyDay,day);
 col=mix(col,skyDusk,dusk*.85);
 // Abaixo do horizonte: tom do horizonte um pouco mais escuro.
 col=mix(col,col*.82,smoothstep(.0,-.25,h));

 // ---------- Tempo fechado: céu acinzentado ----------
 float grey=smoothstep(.55,.95,uCoverage);
 col=mix(col,mix(vec3(.10,.12,.17),vec3(.62,.67,.72),day)*(1.-dusk*.25),grey*.75);

 // ---------- Estrelas e Via Láctea ----------
 float starVis=night*(1.-grey)*smoothstep(-.02,.12,h);
 if(starVis>.001){
  vec2 sp=vec2(atan(dir.z,dir.x),asin(clamp(dir.y,-1.,1.)));
  vec2 grid=sp*vec2(70.,70.);
  vec2 cell=floor(grid),f=fract(grid)-.5;
  float r=hash(cell);
  vec2 off=vec2(hash(cell+3.1),hash(cell+7.7))-.5;
  float size=mix(.06,.16,hash(cell+1.3));
  float star=smoothstep(size,0.,length(f-off*.6))*step(.93,r);
  float tw=.6+.4*sin(uTime*2.2+r*60.);
  col+=vec3(.85,.90,1.)*star*tw*starVis*1.4;
  // Algumas estrelas grandes com brilho em cruz.
  vec2 grid2=sp*vec2(18.,18.);
  vec2 c2=floor(grid2),f2=fract(grid2)-.5;
  float r2=hash(c2+11.);
  if(r2>.965){
   vec2 o2=(vec2(hash(c2+2.),hash(c2+5.))-.5)*.5;
   vec2 q=f2-o2;
   float cross_=max(smoothstep(.012,0.,abs(q.x))*smoothstep(.22,0.,abs(q.y)),
    smoothstep(.012,0.,abs(q.y))*smoothstep(.22,0.,abs(q.x)));
   float core=smoothstep(.06,0.,length(q));
   col+=vec3(.9,.92,1.)*(core+cross_*.6)*(.7+.3*sin(uTime*1.3+r2*40.))*starVis;
  }
  // Faixa da Via Láctea inclinada.
  vec3 axis=normalize(vec3(.35,.25,.9));
  float band=1.-smoothstep(0.,.32,abs(dot(dir,axis)));
  float milky=fbm(sp*3.5)*band;
  col+=mix(vec3(.30,.22,.55),vec3(.45,.55,.85),fbm(sp*6.+2.))*milky*.35*starVis;
 }

 // ---------- Sol ----------
 float sunVis=uSunVisible*(1.-grey*.8);
 float disc=smoothstep(.9988,.9992,toSun);
 float halo=pow(toSun,180.)*.6+pow(toSun,24.)*.22+pow(toSun,5.)*.10*dusk;
 vec3 sunCol=mix(vec3(1.,.97,.86),vec3(1.,.72,.42),dusk);
 col+=sunCol*(disc*1.2+halo)*sunVis*smoothstep(-.06,.02,h);

 // ---------- Lua (oposta ao sol) com fase crescente ----------
 vec3 moon=normalize(vec3(-sun.x,max(-sun.y,.05),-sun.z));
 float md=dot(dir,moon);
 float moonDisc=smoothstep(.99935,.99955,md);
 vec3 shadowDir=normalize(moon+vec3(.022,.012,0.));
 float moonShadow=smoothstep(.99935,.99955,dot(dir,shadowDir));
 float moonLit=moonDisc*(1.-moonShadow*.85);
 float moonGlow=pow(max(md,0.),300.)*.35+pow(max(md,0.),40.)*.10;
 col+=vec3(.92,.95,1.)*(moonLit+moonGlow)*night*(1.-grey*.7);

 // ---------- Nuvens anime: bordas recortadas e base sombreada ----------
 if(h>-.02){
  vec2 cp=dir.xz/(h+.18)*1.15;
  // Nuvens andando de verdade (relógio real) e mudando de forma aos poucos:
  // duas camadas em velocidades diferentes dão profundidade.
  vec2 drift=vec2(uClock*(.010+.018*uWind),uClock*.004);
  vec2 drift2=vec2(uClock*(.017+.026*uWind),-uClock*.003);
  vec2 morph=vec2(sin(uClock*.031),cos(uClock*.027))*.35;
  float n=fbm(cp+drift+morph*.3)*.78+fbm(cp*1.9+drift2-morph*.5+7.3)*.30-.04;
  float n2=fbm(cp+drift+morph*.3+sun.xz*.06)*.78+fbm(cp*1.9+drift2-morph*.5+7.3+sun.xz*.1)*.30-.04;
  float threshold=mix(.66,.40,clamp(uCoverage,0.,1.));
  float mask=smoothstep(threshold,threshold+.035,n);
  // Sombra interna: amostra deslocada na direção do sol.
  float lit=smoothstep(-.02,.06,n-n2+.02);
  vec3 cLitDay=vec3(1.),cShadeDay=vec3(.70,.80,.95);
  vec3 cLitDusk=vec3(1.,.80,.60),cShadeDusk=vec3(.55,.45,.66);
  vec3 cLitNight=vec3(.30,.35,.55),cShadeNight=vec3(.10,.12,.24);
  vec3 cLit=mix(mix(cLitNight,cLitDay,day),cLitDusk,dusk*.9);
  vec3 cShade=mix(mix(cShadeNight,cShadeDay,day),cShadeDusk,dusk*.9);
  cLit=mix(cLit,mix(vec3(.25,.27,.32),vec3(.80,.83,.87),day),grey*.8);
  cShade=mix(cShade,mix(vec3(.12,.13,.17),vec3(.52,.56,.62),day),grey*.8);
  vec3 cloud=mix(cShade,cLit,lit);
  // Contorno claro voltado ao sol (borda prateada).
  float rimC=smoothstep(threshold,threshold+.015,n)-smoothstep(threshold+.02,threshold+.05,n);
  cloud+=vec3(1.,.95,.85)*rimC*pow(toSun,3.)*.6*sunVis;
  float fade=smoothstep(-.02,.20,h);
  col=mix(col,cloud,mask*fade*.95);
 }
 gl_FragColor=vec4(col,1.);
}`;

// Mesma lógica de cor do horizonte, em JS, para tingir a névoa.
const tmpA=new T.Color(),tmpB=new T.Color(),tmpC=new T.Color();
const smooth=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
function horizonColor(sunY,coverage,out){
 const day=smooth(-.10,.18,sunY);
 const night=1-smooth(-.22,-.02,sunY);
 const dusk=(1-smooth(0,.32,Math.abs(sunY+.02)))*(1-night*.6);
 tmpA.setRGB(.13,.17,.36,T.SRGBColorSpace);
 tmpB.setRGB(.74,.90,1,T.SRGBColorSpace);
 tmpC.setRGB(1,.66,.50,T.SRGBColorSpace);
 out.copy(tmpA).lerp(tmpB,day).lerp(tmpC,dusk*.7);
 const grey=smooth(.55,.95,coverage);
 tmpA.setRGB(.10,.12,.17,T.SRGBColorSpace).lerp(tmpB.setRGB(.62,.67,.72,T.SRGBColorSpace),day);
 out.lerp(tmpA,grey*.75);
 return out;
}

function install(){
 const api=window.arcanoWaterV1226;
 if(!api||!api.scene){setTimeout(install,200);return;}
 let dome=null;
 api.scene.traverse(o=>{if(!dome&&o.isMesh&&o.material&&o.material.isShaderMaterial&&o.material.uniforms&&o.material.uniforms.uSunDir&&o.material.uniforms.uNight)dome=o;});
 if(!dome){setTimeout(install,300);return;}
 if(dome.userData.animeSky)return;
 const old=dome.material,ou=old.uniforms;
 const material=new T.ShaderMaterial({
  side:T.BackSide,depthWrite:false,depthTest:true,fog:false,toneMapped:false,
  uniforms:{uClock:{value:0},uTime:ou.uTime,uCoverage:ou.uCoverage,uWind:ou.uWind,uNight:ou.uNight,
   uSunDir:ou.uSunDir,uSunVisible:ou.uSunVisible},
  vertexShader:old.vertexShader,fragmentShader
 });
 material.name='Céu anime';
 dome.material=material;dome.userData.animeSky=true;

 // Luz da lua: azulada, só à noite, oposta ao sol.
 const moonLight=new T.DirectionalLight('#9db4ff',0);
 moonLight.name='Luar anime';
 api.scene.add(moonLight);api.scene.add(moonLight.target);

 const horizon=new T.Color(),fogBase=new T.Color();
 const scene=api.scene;
 const radius=dome.geometry.boundingSphere?dome.geometry.boundingSphere.radius:
  (dome.geometry.computeBoundingSphere(),dome.geometry.boundingSphere.radius);
 dome.onBeforeRender=function(renderer,sceneRef,camera){
  material.uniforms.uClock.value=performance.now()/1000;
  // O domo original ficava além do alcance da câmera e era cortado,
  // mostrando só o fundo cinza. Agora ele segue a câmera, dentro do alcance.
  if(camera&&camera.isPerspectiveCamera){
   dome.position.copy(camera.position);
   dome.scale.setScalar(camera.far*.9/radius);
   dome.updateMatrixWorld(true);
  }
  const sun=material.uniforms.uSunDir.value,cover=ou.uCoverage.value;
  const night=1-smooth(-.22,-.02,sun.y);
  // A névoa da paisagem passa a seguir o horizonte do céu (dia, pôr do sol, noite).
  if(scene.fog&&scene.fog.isFog&&!window.arcanoUnderwater){
   fogBase.copy(scene.fog.color);
   horizonColor(sun.y,cover,horizon);
   scene.fog.color.copy(fogBase).lerp(horizon,.75);
   if(scene.background&&scene.background.isColor)scene.background.copy(horizon);
  }
  moonLight.intensity=.55*night*(1-smooth(.6,.95,cover)*.7);
  moonLight.position.set(-sun.x*22,Math.max(.3,-sun.y)*22,-sun.z*22);
 };
 window.arcanoAnimeSky={material,moonLight,restore(){dome.material=old;dome.userData.animeSky=false;dome.onBeforeRender=()=>{};api.scene.remove(moonLight);}};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
