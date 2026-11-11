/* Folhas em anime pintado.
   Cada folha continua sendo desenhada uma a uma (cartão com o desenho da folha),
   mas a cor passa a ser pintada em 4 tons chapados, de borda definida:
   sombra fria (azulada) -> meio -> luz -> brilho quente (amarelado), bem saturados.
   O matiz vem da própria folha (verde, amarelo da bétula, laranja do bordo,
   rosa da cerejeira), então serve para todas as árvores e arbustos.
   Só acrescenta código ao shader: vento, sombras e cel-shading continuam. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const KEY='paint-leaf-v1';
function paint(material){
 if(!material||material.userData.paintLeaf||!material.isMeshStandardMaterial)return material;
 material.userData.paintLeaf=true;
 const previous=material.onBeforeCompile;
 material.onBeforeCompile=function(shader,r){
  if(previous)previous.call(this,shader,r);
  if(!shader.fragmentShader.includes('#include <color_fragment>'))return;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  {
   vec3 plC=diffuseColor.rgb;
   float plL=dot(plC,vec3(.299,.587,.114));
   vec3 plHue=plC/max(plL,.03);
   // 4 degraus de tom, com transição curta (pincelada chapada)
   float plB=smoothstep(.085,.105,plL)+smoothstep(.17,.19,plL)+smoothstep(.29,.31,plL);
   float plV=mix(mix(.14,.25,clamp(plB,0.,1.)),mix(.40,.58,clamp(plB-2.,0.,1.)),clamp(plB-1.,0.,1.));
   plV=mix(plV,.82,smoothstep(.48,.52,plL)); // flores e folhas claras: brilho extra
   vec3 plP=plHue*plV;
   float plG=dot(plP,vec3(.299,.587,.114));
   plP=mix(vec3(plG),plP,1.06);
   plP*=mix(vec3(.90,.97,1.10),vec3(1.06,1.03,.90),clamp(plB/3.,0.,1.));
   diffuseColor.rgb=max(plP,vec3(0.));
  }`);
 };
 const baseKey=material.customProgramCacheKey;
 material.customProgramCacheKey=function(){return (baseKey?baseKey.call(this):'')+KEY;};
 material.needsUpdate=true;
 return material;
}
window.arcanoPaintLeaf=paint;

// Folhagens que vêm de modelos prontos (floresta): pinta as que têm "leaf/leaves" no nome.
const NAME=/leaf|leaves|folha|foliage|canopy/i;
function scan(scene){
 scene.traverse(o=>{
  if(!o.isMesh||(o.name&&o.name.startsWith('Tapete de grama')))return;
  const list=Array.isArray(o.material)?o.material:[o.material];
  for(const m of list)if(m&&m.name&&NAME.test(m.name))paint(m);
 });
}
function start(){
 const api=window.arcanoWaterV1226;
 if(!api||!api.scene){setTimeout(start,400);return;}
 scan(api.scene);setInterval(()=>{if(!document.hidden)scan(api.scene);},8000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
