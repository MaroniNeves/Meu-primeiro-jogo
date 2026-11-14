/* Cache de renderização: o que já foi desenhado e não mudou não é desenhado de novo.
   - Sombras do sol: antes eram recalculadas a cada quadro para ~2.300 objetos, mesmo com tudo parado.
     Agora o mapa de sombras fica guardado e só é refeito quando o sol/luz mudam, quando o personagem se mexe
     (a cada 2 quadros enquanto anda) ou, no máximo, a cada ~0,5 s (galhos ao vento, bichos andando).
   window.arcanoRenderCache.stats() mostra quantas vezes as sombras foram refeitas e quantas foram reaproveitadas. */
(function(){
'use strict';
function install(){
 const api=window.arcanoWaterV1226;
 if(!api||!api.renderer||!api.scene){setTimeout(install,500);return;}
 const r=api.renderer,scene=api.scene;
 if(!r.shadowMap.enabled)return;
 let lights=[];const refreshLights=()=>{lights=[];scene.traverse(o=>{if(o.isLight&&o.castShadow)lights.push(o);});};
 refreshLights();setInterval(refreshLights,5000);
 r.shadowMap.autoUpdate=false;r.shadowMap.needsUpdate=true;
 const sigs=new WeakMap();let frame=0,sinceUpdate=0,lastPlayer=null,updates=0,reused=0;
 const orig=r.render;
 r.render=function(s,c){
  if(s===scene&&r.getRenderTarget()===null){
   frame++;sinceUpdate++;let dirty=false,playerOnly=false;
   for(const l of lights){
    const p=l.position,t=l.target?l.target.position:p,sg=[p.x,p.y,p.z,t.x,t.y,t.z,l.intensity];
    const old=sigs.get(l);
    if(!old||Math.abs(sg[0]-old[0])>.08||Math.abs(sg[1]-old[1])>.08||Math.abs(sg[2]-old[2])>.08||
       Math.abs(sg[3]-old[3])>.08||Math.abs(sg[4]-old[4])>.08||Math.abs(sg[5]-old[5])>.08||Math.abs(sg[6]-old[6])>.02){dirty=true;sigs.set(l,sg);}
   }
   const pl=api.getGrassPlayer&&api.getGrassPlayer();
   if(pl&&document.body.classList.contains('play-active')){const p=pl.position;
    if(!lastPlayer||Math.abs(p.x-lastPlayer.x)+Math.abs(p.y-lastPlayer.y)+Math.abs(p.z-lastPlayer.z)>.01){if(!dirty)playerOnly=true;lastPlayer={x:p.x,y:p.y,z:p.z};}}
   if(playerOnly&&frame%2===0)dirty=true;           // personagem andando: sombra dele a 30 quadros/s
   if(sinceUpdate>=30)dirty=true;                     // o resto que se mexe (vento, bichos): ~2 vezes por segundo
   if(dirty){r.shadowMap.needsUpdate=true;sinceUpdate=0;updates++;}else reused++;
  }
  return orig.apply(this,arguments);
 };
 window.arcanoRenderCache={stats:()=>({sombrasRefeitas:updates,sombrasReaproveitadas:reused}),invalidate:()=>{r.shadowMap.needsUpdate=true;}};
}
install();
})();
