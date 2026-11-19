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
 // Reflexo da água: a grama (o objeto mais pesado do jogo) não entra no reflexo — ela fica só na câmera principal.
 // Antes, com tempo seco, o reflexo redesenhava a cena inteira COM a grama: o dobro de triângulos por quadro.
 const GRASS=/Tapete de grama|Grama da Ilha|Tufos reais de grama/i,GL=2;
 const tag=o=>{if(o&&o.isMesh&&GRASS.test(o.name||(o.parent&&o.parent.name)||''))o.layers.set(GL);};
 // a grama nasce aos poucos dentro de grupos que já estão na cena: remarcar de tempos em tempos
 setInterval(()=>scene.traverse(tag),2500);
 scene.traverse(tag);(window.__animeAddHooks=window.__animeAddHooks||[]).push(o=>{if(o)o.traverse?o.traverse(tag):tag(o);});
 const camLayers=()=>{const c=api.getMainCamera&&api.getMainCamera();if(c&&!c.layers.isEnabled(GL))c.layers.enable(GL);};camLayers();setInterval(camLayers,1000);
 const sigs=new WeakMap();let frame=0,sinceUpdate=0,lastPlayer=null,updates=0,reused=0;
 const orig=r.render;
 r.render=function(s,c){
  if(s===scene&&(r.getRenderTarget()===null||r.getRenderTarget()===window.arcanoMainRT)){
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
 // Corte por distância das peças pequenas de construções (castelo, vilas, torres, árvore gigante, pontes, porto...):
 // cada peça só é desenhada até uma distância proporcional ao seu tamanho (uma xícara some antes de uma casa).
 // Usa uma 'camada' própria (não mexe em .visible, que outros scripts controlam). Nada que se move entra aqui.
 const STATIC=/castelo|Vilas e acampamentos|Torre da muralha|Árvore gigante|Grande portão|Ponte em arco|Píer e escada|Porto dos Ventos|Casa anime|Vila da Montanha|Floresta Quaternius|Muralha|Fonte|Lago do castelo/i;
 let pieces=[],built=0;const FAR=3,v3=new (window.THREE.Vector3)();
 function collect(){pieces=[];for(const top of scene.children){let nm=top.name||'';if(!nm){let hit=false;top.traverse(o=>{if(!hit&&/castelo/i.test(o.name||''))hit=true;});if(hit)nm='castelo';}
   if(!STATIC.test(nm))continue;top.updateMatrixWorld(true);
   top.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||!o.geometry)return;const g=o.geometry;if(!g.boundingSphere)g.computeBoundingSphere();if(!g.boundingSphere)return;
    const c=g.boundingSphere.center.clone().applyMatrix4(o.matrixWorld),sc=new (window.THREE.Vector3)();o.matrixWorld.decompose(new (window.THREE.Vector3)(),new (window.THREE.Quaternion)(),sc);
    const r=g.boundingSphere.radius*Math.max(sc.x,sc.y,sc.z);pieces.push({o,c,lim:45+r*55,off:false});});}
  built=scene.children.length;}
 setTimeout(collect,8000);setInterval(()=>{if(scene.children.length!==built)collect();},15000);
 let li=0;setInterval(()=>{const cam=api.getMainCamera&&api.getMainCamera();if(!cam||!pieces.length)return;const p=cam.position;
  const n=Math.min(pieces.length,1500);for(let k=0;k<n;k++){li=(li+1)%pieces.length;const q=pieces[li],d=q.c.distanceTo(p),off=d>q.lim;
   if(off!==q.off){q.off=off;if(off){q.o.layers.disable(0);q.o.layers.enable(FAR);}else{q.o.layers.enable(0);q.o.layers.disable(FAR);}}}},200);
 window.arcanoRenderCache={pecas:()=>({total:pieces.length,cortadas:pieces.filter(q=>q.off).length}),stats:()=>({sombrasRefeitas:updates,sombrasReaproveitadas:reused}),invalidate:()=>{r.shadowMap.needsUpdate=true;}};
}
install();
})();
