/* Tela de carregamento: cobre o jogo enquanto a ilha, as minas e os shaders ficam prontos,
   e de novo ao entrar no modo Jogar (personagem + compilação dos materiais), para começar sem travadas. */
(function(){
'use strict';
const css=document.createElement('style');
css.textContent=`#arcLoad{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;
 background:radial-gradient(ellipse at 50% 40%,#1d2a44 0%,#0c1222 60%,#06080f 100%);color:#eaf2ff;font:600 15px system-ui,Segoe UI,sans-serif;transition:opacity .6s}
#arcLoad.hide{opacity:0;pointer-events:none}
#arcLoad h1{margin:0;font:700 34px Georgia,serif;letter-spacing:.04em;color:#f4e9c8;text-shadow:0 0 18px rgba(255,210,120,.35)}
#arcLoad .gem{width:46px;height:46px;transform:rotate(45deg);background:linear-gradient(135deg,#bff3ff,#3fa4ff 55%,#1b4fb0);box-shadow:0 0 26px #5fc8ff;animation:arcSpin 2.4s ease-in-out infinite}
@keyframes arcSpin{0%,100%{transform:rotate(45deg) scale(1)}50%{transform:rotate(225deg) scale(.86)}}
#arcLoad .bar{width:min(420px,78vw);height:10px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden;border:1px solid rgba(160,200,255,.25)}
#arcLoad .fill{height:100%;width:0;background:linear-gradient(90deg,#5fc8ff,#ffd27a);transition:width .35s}
#arcLoad .step{opacity:.85;font-weight:500;min-height:20px}`;
document.head.appendChild(css);
const el=document.createElement('div');el.id='arcLoad';
el.innerHTML='<div class="gem"></div><h1>Ateliê Arcano</h1><div class="bar"><div class="fill"></div></div><div class="step">Carregando…</div>';
const mount=()=>{if(document.body)document.body.appendChild(el);else requestAnimationFrame(mount);};mount();
const fill=el.querySelector('.fill'),step=el.querySelector('.step');
const set=(p,msg)=>{fill.style.width=Math.round(p*100)+'%';if(msg)step.textContent=msg;};
const wait=(cond,max)=>new Promise(res=>{const t0=performance.now(),f=()=>{let ok=false;try{ok=cond();}catch(e){}if(ok||performance.now()-t0>max)res(ok);else setTimeout(f,120);};f();});
const frames=n=>new Promise(res=>{let k=0;const f=()=>{if(++k>=n)res();else requestAnimationFrame(f);};requestAnimationFrame(f);});
const show=()=>{el.classList.remove('hide');el.style.display='flex';};
const hide=()=>{el.classList.add('hide');setTimeout(()=>{if(el.classList.contains('hide'))el.style.display='none';},700);};
function compile(){const api=window.arcanoWaterV1226;if(!api||!api.renderer)return;const cam=api.getMainCamera&&api.getMainCamera();if(!cam)return;
 const M=window.arcanoMinasObj;try{if(M&&M.showAll)M.showAll(true);api.renderer.compile(api.scene,cam);}catch(e){console.warn('compile',e);}}
async function boot(){
 set(.05,'Carregando scripts…');
 await wait(()=>window.arcanoWaterV1226&&window.arcanoWaterV1226.scene,30000);set(.2,'Construindo a ilha…');
 await wait(()=>window.arcanoIsland&&window.arcanoIsland.forest,35000);set(.45,'Plantando a floresta e as vilas…');
 await wait(()=>document.readyState==='complete',15000);await wait(()=>window.arcanoMinasObj,15000);set(.6,'Escavando as minas…');
 if(window.arcanoMinasObj&&window.arcanoMinasObj.prewarm)await window.arcanoMinasObj.prewarm();
 set(.8,'Compilando shaders…');await frames(2);compile();await frames(3);compile();
 set(1,'Pronto!');await frames(4);hide();}
boot().catch(e=>{console.warn(e);hide();});
setTimeout(()=>{if(!el.classList.contains('hide')&&!window.__arcPlayLoading)hide();},70000);
// ao entrar no modo Jogar
let wasPlay=false;
new MutationObserver(async()=>{const on=document.body.classList.contains('play-active');if(on&&!wasPlay){wasPlay=true;window.__arcPlayLoading=true;show();set(.3,'Preparando o personagem…');
  const api=window.arcanoWaterV1226;await wait(()=>{const g=api&&api.getGrassPlayer&&api.getGrassPlayer();return g&&g.hasModel&&!g.loading;},15000);
  set(.7,'Compilando shaders…');await frames(2);compile();await frames(4);set(1,'Pronto!');await frames(3);window.__arcPlayLoading=false;hide();}
 else if(!on)wasPlay=false;}).observe(document.body||document.documentElement,{attributes:true,attributeFilter:['class']});
})();
