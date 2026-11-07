/* Grama e terra no estilo anime (inspirado em Genshin Impact).
   - Grama: degradê da base escura até pontas verde-amareladas e manchas
     grandes de cor pelo mapa, como os campos pintados de Mondstadt.
   - Terra: paleta quente de 3 tons (siena, areia e creme) com manchas
     pintadas à mão; gramado do chão no mesmo verde vivo da grama.
   Só acrescenta código aos shaders existentes: vento, fogo, pegadas e
   cel-shading continuam funcionando. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;

const NOISE=`
float animeHash(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453);}
float animeNoise(vec2 p){
 vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(animeHash(i),animeHash(i+vec2(1,0)),f.x),
  mix(animeHash(i+vec2(0,1)),animeHash(i+vec2(1,1)),f.x),f.y);
}
float animeFbm(vec2 p){return animeNoise(p)*.55+animeNoise(p*2.3+7.1)*.3+animeNoise(p*5.1-3.7)*.15;}
vec3 animeLin(vec3 c){return pow(c,vec3(2.2));}
`;

/* ---------- Grama ---------- */
const GRASS_KEY='anime-grass-v1';
function patchGrass(material){
 if(material.userData.animeGrass)return;
 material.userData.animeGrass=true;
 const previous=material.onBeforeCompile;
 material.onBeforeCompile=function(shader,r){
  if(previous)previous.call(this,shader,r);
  if(!shader.vertexShader.includes('uArcGrassBase'))return;
  shader.vertexShader='varying float vAnimeTip;\nvarying vec2 vAnimeRoot;\n'+shader.vertexShader.replace(
   '#include <begin_vertex>',
   `#include <begin_vertex>
   vAnimeTip=clamp((position.y-uArcGrassBase)*uArcGrassInvHeight,0.0,1.0);
   #ifdef USE_INSTANCING
    vAnimeRoot=instanceMatrix[3].xz;
   #else
    vAnimeRoot=(modelMatrix*vec4(position,1.0)).xz;
   #endif`);
  shader.fragmentShader='varying float vAnimeTip;\nvarying vec2 vAnimeRoot;\n'+NOISE+shader.fragmentShader.replace(
   '#include <color_fragment>',
   `#include <color_fragment>
   {
    float tex=dot(diffuseColor.rgb,vec3(.299,.587,.114));
    // Manchas grandes de cor espalhadas pelo campo.
    float patchA=animeFbm(vAnimeRoot*.07);
    float patchB=animeNoise(vAnimeRoot*.21+3.3);
    vec3 baseC=animeLin(vec3(.18,.43,.22));
    vec3 midC=mix(animeLin(vec3(.40,.71,.27)),animeLin(vec3(.33,.66,.36)),patchB);
    vec3 tipC=mix(animeLin(vec3(.78,.90,.38)),animeLin(vec3(.62,.86,.42)),patchA);
    float h=smoothstep(0.,1.,vAnimeTip);
    vec3 grass=mix(baseC,midC,smoothstep(.0,.55,h));
    grass=mix(grass,tipC,smoothstep(.55,1.,h));
    // Variação amarelada e leve, como flores-do-campo ao sol.
    grass=mix(grass,animeLin(vec3(.86,.88,.42)),smoothstep(.68,.86,patchA)*h*.45);
    // Mantém só um pouco do detalhe da textura original.
    grass*=mix(1.,clamp(tex*2.2,.75,1.2),.25);
    diffuseColor.rgb=grass;
   }`);
 };
 const baseKey=material.customProgramCacheKey;
 material.customProgramCacheKey=function(){return (baseKey?baseKey.call(this):'')+GRASS_KEY;};
 material.needsUpdate=true;
}

/* ---------- Terra ---------- */
const LAND_KEY='anime-land-v1';
function patchLand(material){
 if(material.userData.animeLand)return;
 material.userData.animeLand=true;
 const previous=material.onBeforeCompile;
 material.onBeforeCompile=function(shader,r){
  if(previous)previous.call(this,shader,r);
  shader.vertexShader='varying vec3 vAnimeWorld;\n'+shader.vertexShader.replace(
   '#include <begin_vertex>',
   '#include <begin_vertex>\n vAnimeWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
  shader.fragmentShader='varying vec3 vAnimeWorld;\n'+NOISE+shader.fragmentShader.replace(
   '#include <color_fragment>',
   `#include <color_fragment>
   {
    vec3 c=diffuseColor.rgb;
    float lum=dot(c,vec3(.299,.587,.114));
    vec2 w=vAnimeWorld.xz;
    float big=animeFbm(w*.06);
    float small=animeNoise(w*.9);
    // Quanto do pixel é gramado (o mapa original pinta o verde nas cores do vértice).
    float green=smoothstep(.01,.08,c.g-max(c.r,c.b));
    // Terra: rampa de 3 tons quentes, suavizada como pintura.
    float t=clamp(lum*3.2+(big-.5)*.55+(small-.5)*.10,0.,1.);
    vec3 dirtDark=animeLin(vec3(.58,.44,.33));
    vec3 dirtMid=animeLin(vec3(.80,.68,.50));
    vec3 dirtLight=animeLin(vec3(.92,.85,.68));
    vec3 dirt=mix(dirtDark,dirtMid,smoothstep(.18,.42,t));
    dirt=mix(dirt,dirtLight,smoothstep(.62,.86,t));
    // Gramado do chão: verde vivo com manchas, combinando com os tufos.
    vec3 lawnA=animeLin(vec3(.36,.66,.27)),lawnB=animeLin(vec3(.55,.79,.33));
    vec3 lawn=mix(lawnA,lawnB,smoothstep(.35,.75,big));
    lawn=mix(lawn,animeLin(vec3(.27,.53,.25)),smoothstep(.6,.9,small)*.35);
    // Faixa de transição clara entre a grama e a terra (borda pintada).
    float border=smoothstep(.15,.45,green)*(1.-smoothstep(.45,.85,green));
    vec3 outC=mix(dirt,lawn,smoothstep(.25,.7,green));
    outC=mix(outC,animeLin(vec3(.72,.84,.42)),border*.35);
    // Partes úmidas/escuras (barro do rio) continuam mais escuras.
    float wet=1.-smoothstep(.05,.16,lum);
    outC*=mix(1.,.72,wet*(1.-green));
    diffuseColor.rgb=outC;
   }`);
 };
 const baseKey=material.customProgramCacheKey;
 material.customProgramCacheKey=function(){return (baseKey?baseKey.call(this):'')+LAND_KEY;};
 material.needsUpdate=true;
}

/* ---------- Busca dos materiais ---------- */
function scan(api){
 const land=api.terrain;
 if(land&&land.material&&!Array.isArray(land.material))patchLand(land.material);
 api.scene.traverse(o=>{
  if(!o.isMesh||!o.name||!o.name.startsWith('Tapete de grama'))return;
  const list=Array.isArray(o.material)?o.material:[o.material];
  for(const m of list)if(m&&m.isMeshStandardMaterial)patchGrass(m);
 });
}
function start(){
 const api=window.arcanoWaterV1226;
 if(!api||!api.scene){setTimeout(start,200);return;}
 scan(api);
 // A grama é criada em setores ao longo do carregamento.
 setInterval(()=>{if(!document.hidden)scan(api);},2500);
 window.arcanoAnimeTerrain={rescan:()=>scan(api)};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
