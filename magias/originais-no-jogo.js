/* Ateliê Arcano — adapta os módulos originais do laboratório de 100 Magias.
 * NÃO reinterpreta os efeitos com formas novas: instancia exatamente as
 * classes de shaders do catálogo V8, com seus próprios sistemas de partículas.
 */
import {G as originalUniforms} from './assets/settings-DdywqLlV.js';
import {t as ParticleEngine} from './assets/ParticleEngine-DLxipNH0.js';
import {ArcaneVolleyAbility} from './assets/ArcaneVolleyAbility-F0sG67Uf.js';
import {DragonbreathAbility} from './assets/DragonbreathAbility-x2rdc5jW.js';
import {GlacierAbility} from './assets/GlacierAbility-CelHSKik.js';
const TYPES=[ArcaneVolleyAbility,DragonbreathAbility,GlacierAbility];
export function createOriginalMagicBridge(THREE,scene,options={}){
 const limit=options.mobile?180:440;
 // O laboratório renderiza os feitiços sobre um prepass de profundidade
 // próprio. A floresta não fornece esse sampler: uma textura de "profundidade
 // distante" mantém os pixels dos shaders originais visíveis no modo Jogar.
 // É apenas um recurso de compatibilidade, sem alterar o código dos VFX.
 const depthFar=new THREE.DataTexture(new Uint8Array([255,255,255,255]),
  1,1,THREE.RGBAFormat);
 depthFar.needsUpdate=true;
 if(originalUniforms.uSceneDepth)originalUniforms.uSceneDepth.value=depthFar;
 if(originalUniforms.uResolution){
  const dpr=typeof window==='undefined'?1:window.devicePixelRatio||1;
  originalUniforms.uResolution.value.set(
   (typeof window==='undefined'?360:window.innerWidth)*dpr,
   (typeof window==='undefined'?225:window.innerHeight)*dpr);
 }
 if(originalUniforms.uCameraNear)originalUniforms.uCameraNear.value=.1;
 if(originalUniforms.uCameraFar)originalUniforms.uCameraFar.value=260;
 const system=new ParticleEngine(scene);
 // Usa o ParticleSystem ORIGINAL, mas limita apenas a CAPACIDADE no celular
 // para não degradar a floresta, água e vegetação.
 const particles={get:(name,config)=>system.get(name,{
  ...config,capacity:Math.min(limit,config.capacity||limit)
 })};
 const noop=()=>{};
 const ctx={
  particles,
  environment:{},
  lights:{acquire:()=>({}),set:noop,release:noop},
  shake:{rumble:noop,add:noop},
  flash:{trigger:noop},
  bursts:{spawn:noop},
  decals:{spawn:noop}
 };
 let active=null,loading=null,clock=0;
 function visibleInForest(object){
  if(!object)return;
  object.traverse?.(child=>{
   child.layers?.enable?.(0);
   // O catálogo usa BufferAttribute moderno (updateRanges), enquanto
   // o renderer da floresta r152 ainda consulta updateRange.count.
   const geom=child.geometry;
   if(geom){
    const attrs=[...Object.values(geom.attributes||{})];
    if(geom.index)attrs.push(geom.index);
    if(child.instanceMatrix)attrs.push(child.instanceMatrix);
    if(child.instanceColor)attrs.push(child.instanceColor);
    if(geom.morphAttributes)for(const list of Object.values(geom.morphAttributes))
     attrs.push(...list);
    for(const attr of attrs){
     if(!attr||!attr.array)continue;
     if(!attr.updateRange)attr.updateRange={offset:0,count:-1};
    }
   }
   // O laboratório usa uma revisão diferente de THREE. Sua classe Material
   // não possui onBuild(), exigido pelo renderer da floresta (r152).
   const materials=Array.isArray(child.material)?child.material:
    (child.material?[child.material]:[]);
   for(const mat of materials){
    if(typeof mat.onBuild!=='function')mat.onBuild=()=>{};
    if(typeof mat.onBeforeCompile!=='function')mat.onBeforeCompile=()=>{};
    if(typeof mat.customProgramCacheKey!=='function')mat.customProgramCacheKey=()=>mat.onBeforeCompile.toString();
   }
  });
  object.layers?.enable?.(0);
 }
 async function prepare(slot){
  slot=Math.max(0,Math.min(2,slot|0));
  options.onProgress?.('module-ready-'+slot);
  const effect=new TYPES[slot](ctx);
  options.onProgress?.('instantiated-'+slot);
  return effect;
 }
 async function cast(slot,origin,direction,length=12){
  if(loading)return false;
  // Conjurações pesadas: apenas um efeito ativo por vez, os shaders continuam
  // intocados. Os próximos lançamentos esperam a animação atual terminar.
  loading=prepare(slot);
  let next;
  try{next=await loading;}finally{loading=null;}
  if(active){
   try{active.destroy();active.dispose();}catch(err){console.warn('Fim de efeito original:',err);}
  }
  active=next;
  scene.add(next.group);
  visibleInForest(next.group);
  next.spawn(origin,direction,length);
  visibleInForest(next.group);
  for(const systemGroup of system.systems.values())visibleInForest(systemGroup.object3D);
  return true;
 }
 function update(dt){
  if(originalUniforms?.uTime)originalUniforms.uTime.value+=dt;
  if(!active)return;
  active.update(dt);
  visibleInForest(active.group);
  for(const p of system.systems.values())visibleInForest(p.object3D);
  system.flush();
  if(active.isFinished){
   active.destroy();active.dispose();
   active=null;
  }
 }
 function clear(){
  if(active){
   try{active.destroy();active.dispose();}catch(err){console.warn('Limpeza de magia:',err);}
   active=null;
  }
  system.reset();
 }
 function state(){
  return {active:active?.element||null,phase:active?.phase||null,
   meshes:active?.group?.children?.length||0,
   particles:system.systems.size,loading:!!loading};
 }
 return {cast,update,clear,state,original:true};
}
