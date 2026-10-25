/* Ateliê Arcano — adapta os módulos originais do laboratório de 100 Magias.
 * NÃO reinterpreta os efeitos com formas novas: instancia exatamente as
 * classes de shaders do catálogo V8, com seus próprios sistemas de partículas.
 */
import {R as originalUniforms} from './assets/settings-DdywqLlV.js';
import {t as ParticleEngine} from './assets/ParticleEngine-DLxipNH0.js';
const SOURCES=[
 './assets/ArcaneVolleyAbility-F0sG67Uf.js',
 './assets/DragonbreathAbility-x2rdc5jW.js',
 './assets/GlacierAbility-CelHSKik.js'
];
const EXPORTS=['ArcaneVolleyAbility','DragonbreathAbility','GlacierAbility'];
export function createOriginalMagicBridge(THREE,scene,options={}){
 const limit=options.mobile?180:440;
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
  object.traverse?.(child=>child.layers?.enable?.(0));
  object.layers?.enable?.(0);
 }
 async function prepare(slot){
  slot=Math.max(0,Math.min(2,slot|0));
  const mod=await import(SOURCES[slot]);
  const Type=mod[EXPORTS[slot]];
  if(!Type)throw new Error('Efeito original indisponível: '+EXPORTS[slot]);
  return new Type(ctx);
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
  return true;
 }
 function update(dt){
  if(originalUniforms?.uTime)originalUniforms.uTime.value+=dt;
  if(!active)return;
  active.update(dt);
  visibleInForest(active.group);
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
