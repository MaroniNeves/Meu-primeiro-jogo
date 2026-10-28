/* Shared Three.js module and ordered game startup. */
window.arcanoLaboratoryVisible=()=>{
 if(document.documentElement.dataset.arcanoMode!=='laboratory')return false;
 const panel=document.getElementById('rainControls');
 if(!panel||panel.hidden||panel.closest('[hidden]'))return false;
 const style=getComputedStyle(panel);
 return style.display!=='none'&&style.visibility!=='hidden'&&panel.getClientRects().length>0;
};
window.arcanoRuntimeReady=(async()=>{
 const THREE=await import('three');window.THREE=THREE;
 const load=src=>new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=src;
  script.onload=resolve;script.onerror=()=>reject(new Error('Não foi possível carregar '+src));document.head.appendChild(script);
 });
 for(const src of ['./arcano-water2-r152.js?v=1','./arcano-interactive-river.js?v=4',
  './agua-v1226.js?v=lazy-runtime-20261028','./arcano-assets-v1232.js','./nature-imported-v1239.js',
  './fogo-grama-v1267.js','./ecossistema-v1232.js?v=lazy-laboratory-20261028']){
  try{await load(src);}catch(error){
   if(src.includes('arcano-water2-')||src.includes('arcano-interactive-river'))console.warn('[Arcano] Componente atual indisponível; usando água de reserva.',error);
   else throw error;
  }
 }
 document.dispatchEvent(new Event('arcano-ready'));
})().catch(error=>{
 const diag=document.getElementById('diag');if(diag)diag.textContent='Não foi possível iniciar o jogo: '+error.message;
 console.error('[Arcano startup]',error);
});
