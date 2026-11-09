/* Grande lago da floresta, com uma ilha no centro (a árvore gigante fica nela).
   Este arquivo só define o lago e a escavação do terreno; ilha-central.js lê window.arcanoLagoGrande
   para escavar a bacia, pintar a margem, desenhar a água e permitir nadar.
   Também registra a clareira (sem árvores) em volta. */
(function(){
'use strict';
const X=70,Z=-474,R=58,RI=20,LEVEL=15.0,ISLAND_Y=16.7;
const sm=(a,b,t)=>{t=Math.min(1,Math.max(0,(t-a)/(b-a)));return t*t*(3-2*t);};
const LG={x:X,z:Z,r:R,ri:RI,level:LEVEL,islandY:ISLAND_Y,
 // Profundidade do leito (ondulada, mais fundo no meio entre a ilha e a margem).
 bed(x,z,d){return LEVEL-3.2+.8*Math.sin(x*.07+z*.05)+.5*Math.sin(x*.13-z*.11)-1.4*(1-sm(RI+6,R*.82,d));},
 // Escavação: recebe a altura original e devolve a altura final do terreno.
 carve(x,z,y0){
  const d=Math.hypot(x-X,z-Z);if(d>R+14)return y0;
  const bed=LG.bed(x,z,d),outer=sm(R-6,R+14,d);
  let y=bed+(y0-bed)*outer;
  const isl=1-sm(RI,RI+9,d);                       // ilha: topo plano e praia suave
  const top=ISLAND_Y+.18*Math.sin(x*.4)*Math.cos(z*.35);
  y=y+(top-y)*isl;
  return y;
 },
 inside(x,z,pad){return Math.hypot(x-X,z-Z)<R+(pad||0);}
};
window.arcanoLagoGrande=LG;
(window.arcanoClearings=window.arcanoClearings||[]).push({x:X,z:Z,r:R+16});
})();
