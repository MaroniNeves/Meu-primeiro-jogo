/* Estilo anime (inspirado em Genshin Impact) + modo leve.
   - Sombreamento em degraus (cel-shading) injetado nos materiais existentes,
     sem substituí-los (mantém vento nas folhas, instanciamento e skinning).
   - Luz de contorno suave, contorno escuro no personagem e correção de cor.
   - Qualidade mais leve por padrão e resolução dinâmica para manter o FPS. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const mobile=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&innerWidth<900);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const OUTLINE_COLOR='#2b2140';

/* ---------- 1. Cel-shading nos materiais ---------- */
const STYLE_KEY='anime-genshin-v2';
function stylize(material){
 if(!material||material.userData.animeStyled||!material.isMeshStandardMaterial)return;
 material.userData.animeStyled=true;
 const previous=material.onBeforeCompile;
 material.onBeforeCompile=function(shader,rendererRef){
  if(previous)previous.call(this,shader,rendererRef);
  const frag=shader.fragmentShader;
  const hook=frag.includes('#include <opaque_fragment>')?'#include <opaque_fragment>':
   frag.includes('#include <output_fragment>')?'#include <output_fragment>':null;
  if(!hook)return;
  const toon=`
   {
    // Ombro suave: luz forte comprime em vez de estourar em branco (preserva o desenho da textura).
    float animeL0=dot(outgoingLight,vec3(.299,.587,.114));
    outgoingLight*=1.14/(1.+.62*animeL0);
    float animeL=dot(outgoingLight,vec3(.299,.587,.114));
    // Rampa de 4 degraus com transição curta (aparência pintada à mão).
    float animeSteps=4.;
    float animeBand=floor(animeL*animeSteps)/animeSteps;
    float animeFrac=fract(animeL*animeSteps);
    float animeSoft=animeBand+smoothstep(.40,.60,animeFrac)/animeSteps;
    float animeTarget=mix(animeL,animeSoft+.5/animeSteps*.25,.62);
    outgoingLight*=animeTarget/max(animeL,.0001);
    // Realce quente nas luzes e sombras levemente arroxeadas/azuladas.
    outgoingLight=mix(outgoingLight,outgoingLight*vec3(1.05,1.02,.96),smoothstep(.55,.95,animeL));
    outgoingLight=mix(outgoingLight*vec3(.90,.92,1.08),outgoingLight,smoothstep(.10,.45,animeL));
    #if !defined(FLAT_SHADED) && !defined(ANIME_NO_RIM)
     float animeRim=pow(1.-clamp(dot(normalize(vNormal),normalize(vViewPosition)),0.,1.),3.2);
     outgoingLight+=animeRim*vec3(.30,.36,.42)*.20;
    #endif
    outgoingLight*=.97;
   }
  `;
  shader.fragmentShader=frag.replace(hook,toon+hook);
 };
 const baseKey=material.customProgramCacheKey;
 material.customProgramCacheKey=function(){return (baseKey?baseKey.call(this):'')+STYLE_KEY;};
 material.needsUpdate=true;
}

/* ---------- 2. Contorno do personagem (casca invertida) ---------- */
const outlineMaterial=new T.MeshBasicMaterial({color:OUTLINE_COLOR,side:T.BackSide});
outlineMaterial.onBeforeCompile=shader=>{
 shader.uniforms.animeThickness={value:.018};
 shader.vertexShader='uniform float animeThickness;\n'+shader.vertexShader.replace(
  '#include <skinning_vertex>',
  '#include <skinning_vertex>\n#ifdef USE_SKINNING\n transformed+=normalize(objectNormal)*animeThickness;\n#endif');
};
function addOutline(mesh){
 if(mesh.userData.animeOutline||!mesh.isSkinnedMesh||!mesh.skeleton)return;
 mesh.userData.animeOutline=true;
 const shell=new T.SkinnedMesh(mesh.geometry,outlineMaterial);
 shell.bind(mesh.skeleton,mesh.bindMatrix);
 shell.frustumCulled=false;shell.castShadow=false;shell.receiveShadow=false;
 shell.userData.animeOutline=true;
 shell.renderOrder=-1;
 (mesh.parent||mesh).add(shell);
}

// Peças rígidas (personagem simples): casca levemente ampliada, vista só por trás.
const solidOutlineMaterial=new T.MeshBasicMaterial({color:OUTLINE_COLOR,side:T.BackSide});
function addSolidOutline(mesh){
 if(mesh.userData.animeOutline||mesh.userData.animeSolid||mesh.isSkinnedMesh||mesh.isInstancedMesh)return;
 mesh.userData.animeSolid=true;
 const shell=new T.Mesh(mesh.geometry,solidOutlineMaterial);
 shell.scale.setScalar(1.09);shell.userData.animeOutline=true;
 shell.castShadow=false;shell.receiveShadow=false;
 mesh.add(shell);
}

/* ---------- 3. Varredura em lotes da cena ---------- */
function scan(scene){
 const player=window.arcanoWaterV1226&&window.arcanoWaterV1226.getGrassPlayer&&window.arcanoWaterV1226.getGrassPlayer();
 if(player&&player.character)player.character.traverse(o=>{if(o.isMesh&&!o.userData.animeOutline)addSolidOutline(o);});
 let touched=0;
 scene.traverse(obj=>{
  if(!obj.isMesh||obj.userData.animeOutline)return;
  const list=Array.isArray(obj.material)?obj.material:[obj.material];
  for(const m of list)if(m&&!m.userData.animeStyled&&m.isMeshStandardMaterial){stylize(m);touched++;}
  if(obj.isSkinnedMesh&&!obj.userData.animeOutline)addOutline(obj);
 });
 return touched;
}

/* ---------- 4. Imagem final: cor e brilho suaves via CSS (sem custo de GPU) ---------- */
function installGrade(stage){
 const css=document.createElement('style');
 css.textContent=`
  #stage{filter:saturate(1.12) contrast(1.06) brightness(.98) hue-rotate(-3deg);}
  #animeGlow{position:fixed;inset:0;pointer-events:none;z-index:1;
   background:
    radial-gradient(120% 90% at 50% 0%,rgba(255,236,190,.20),transparent 55%),
    radial-gradient(130% 100% at 50% 110%,rgba(70,110,170,.18),transparent 60%),
    radial-gradient(ellipse at center,transparent 62%,rgba(30,25,60,.22) 100%);
   mix-blend-mode:soft-light;}
 `;
 document.head.appendChild(css);
 const glow=document.createElement('div');glow.id='animeGlow';
 document.body.appendChild(glow);
}

/* ---------- 5. Desempenho ---------- */
function lightenPresets(api){
 const q=api.QUALITY_PRESETS;
 if(!q||q.animeTuned)return;
 q.animeTuned=true;
 // Os limites originais (2,35x de pixels e sombras 2048) são a maior causa de lentidão.
 Object.assign(q.high,{mobilePixel:1.15,desktopPixel:1.45,shadowsMobile:512,shadowsDesktop:1024,anisotropy:4});
 Object.assign(q.balanced,{mobilePixel:1,desktopPixel:1.2,shadowsMobile:512,shadowsDesktop:1024,anisotropy:2});
 Object.assign(q.low,{mobilePixel:.8,desktopPixel:.95,shadowsMobile:256,shadowsDesktop:512,anisotropy:1});
}
/* ---------- Inicialização ---------- */
function start(){
 const api=window.arcanoWaterV1226;
 if(!api||!api.scene||!api.renderer){setTimeout(start,150);return;}
 const {scene,renderer}=api;
 lightenPresets(api);
 // Sem tone mapping ACES (que dessatura): cores vivas e limpas como em cel-shading.
 renderer.toneMapping=T.NoToneMapping;
 let saved=null;try{saved=localStorage.getItem('arcano.graphicsQuality');}catch(_){}
 if(!saved)api.setGraphicsQuality(mobile?'low':'balanced');else api.setGraphicsQuality(api.getGraphicsQuality());
 installGrade(renderer.domElement);
 // Aplica nos materiais já existentes e continua monitorando os que chegam depois
 // (árvores, rochas e modelos são carregados aos poucos).
 scan(scene);
 // Pinta cada objeto no instante em que entra na cena (sem trocar de cor depois).
 (window.__animeAddHooks=window.__animeAddHooks||[]).push(o=>o.traverse(obj=>{
  if(!obj.isMesh||obj.userData.animeOutline)return;
  const list=Array.isArray(obj.material)?obj.material:[obj.material];
  for(const m of list)if(m&&!m.userData.animeStyled&&m.isMeshStandardMaterial)stylize(m);
 }));
 /* continua ativo: o personagem e novos modelos aparecem depois */
 // Os objetos novos já são pintados ao entrar na cena; esta varredura é só reserva.
 setInterval(()=>{if(!document.hidden)scan(scene);},9000);
 // Resolução: controlada por resolucao-anime.js (carregado antes do jogo).
 window.arcanoAnimeStyle={rescan:()=>scan(scene),setOutline:v=>{outlineMaterial.visible=!!v;}};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
