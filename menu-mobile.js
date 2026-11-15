/* Menu de pausa no celular.
   No celular (tela de toque), durante o jogo, os botões espalhados pela tela (sair, visão 1ª/3ª pessoa, magias,
   esferas, baixar modelo, ajustes, resolução, som, textos de status e FPS) somem da tela e vão para um painel
   que abre no botão ⏸ (canto superior direito). Abrir o painel PAUSA o jogo; "Continuar" volta.
   O minimapa sai de cima do direcional (canto inferior esquerdo) e vai para o canto superior direito.
   Os botões originais continuam existindo (escondidos): o painel apenas os aciona. */
(function(){
'use strict';
const touch=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||(navigator.maxTouchPoints>0&&matchMedia('(pointer:coarse)').matches);
if(!touch)return;
const css=document.createElement('style');
css.textContent=`
body.arc-mobile.play-active .game-top,body.arc-mobile.play-active #gameStatus,body.arc-mobile.play-active #gameFPS,
body.arc-mobile.play-active #arcanoQuickToggle,body.arc-mobile.play-active #animeResolution,body.arc-mobile.play-active #arcSom{display:none!important}
body.arc-mobile.play-active #forestMini{left:10px!important;right:auto!important;top:10px!important;bottom:auto!important;width:84px!important;height:84px!important}
body.arc-mobile.play-active #forestMini canvas{width:80px!important;height:80px!important}
#arcPauseBtn{position:fixed;top:10px;right:10px;z-index:60;width:42px;height:42px;border-radius:12px;border:1px solid rgba(255,255,255,.28);
 background:rgba(12,18,34,.62);color:#f4e9c8;font:700 18px system-ui,sans-serif;display:none;align-items:center;justify-content:center;backdrop-filter:blur(4px);-webkit-tap-highlight-color:transparent}
body.arc-mobile.play-active #arcPauseBtn{display:flex}
#arcPause{position:fixed;inset:0;z-index:70;display:none;align-items:center;justify-content:center;background:rgba(6,9,18,.62);backdrop-filter:blur(3px)}
#arcPause.on{display:flex}
#arcPause .box{width:min(600px,94vw);max-height:92vh;overflow:auto;background:linear-gradient(160deg,#18233a,#0e1526);border:1px solid rgba(255,220,150,.28);border-radius:18px;padding:14px 14px 12px;box-shadow:0 12px 40px rgba(0,0,0,.5);color:#eaf2ff;font:500 14px system-ui,Segoe UI,sans-serif}
#arcPause h2{margin:2px 4px 10px;font:700 20px Georgia,serif;color:#f4e9c8;letter-spacing:.03em}
#arcPause .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:8px}
#arcPause button,#arcPause a{display:flex;align-items:center;gap:8px;min-height:40px;padding:7px 10px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#eaf2ff;font:600 14px system-ui,sans-serif;text-decoration:none;text-align:left;-webkit-tap-highlight-color:transparent}
#arcPause button:active,#arcPause a:active{background:rgba(255,255,255,.16)}
#arcPause .wide{grid-column:1/-1;justify-content:center}
#arcPause .go{background:linear-gradient(90deg,#3f8cff,#5fc8ff);border:none;color:#06101f}
#arcPause .exit{background:rgba(220,70,60,.25);border-color:rgba(255,120,110,.4)}
#arcPause .info{grid-column:1/-1;opacity:.75;font-size:12px;padding:2px 4px}`;
document.head.appendChild(css);

const btn=document.createElement('button');btn.id='arcPauseBtn';btn.type='button';btn.setAttribute('aria-label','Pausar e abrir as configurações');btn.textContent='⏸';
const panel=document.createElement('div');panel.id='arcPause';panel.innerHTML=`<div class="box" role="dialog" aria-label="Pausa">
 <h2>⏸ Pausado</h2>
 <div class="grid">
  <button class="wide go" data-a="continuar">▶ Continuar</button>
  <button data-a="visao"><span data-l="visao">👁 Visão</span></button>
  <button data-a="som">🔊 <span data-l="som">Som</span></button>
  <button data-a="resolucao">🖥 <span data-l="res">Resolução</span></button>
  <button data-a="ajustes">⚙ Ajustes</button>
  <a href="./magias/index.html" data-a="link">✨ Magias</a>
  <a href="./orbes.html" data-a="link">🔮 Esferas</a>
  <div class="info" data-l="status"></div>
  <button class="wide exit" data-a="sair">← Sair do jogo</button>
 </div></div>`;
const mount=()=>{if(!document.body){requestAnimationFrame(mount);return;}document.body.appendChild(btn);document.body.appendChild(panel);document.body.classList.add('arc-mobile');};mount();

const $=id=>document.getElementById(id);
const label=(k,t)=>{const e=panel.querySelector('[data-l="'+k+'"]');if(e)e.textContent=t;};
function refresh(){
 const fp=$('gameFirstPerson');const clean=t=>(t||'').replace(/[^A-Za-zÀ-ÿ0-9ª%., ]/g,' ').replace(/\s+/g,' ').trim();
 label('visao','👁 '+(fp?clean(fp.textContent).slice(0,24):'Visão'));
 let somOn=true;try{somOn=localStorage.getItem('arcanoSom')!=='0';}catch(e){}label('som','Som: '+(somOn?'ligado':'desligado'));
 const rs=$('animeResolution');label('res',rs?clean(rs.textContent).slice(0,24):'Resolução');
 const st=$('gameStatus'),fps=$('gameFPS');label('status',[(fps&&fps.textContent)||'',(st&&st.textContent)||''].filter(Boolean).join(' · '));
}
function open(){window.arcanoPausa=true;const g=window.arcanoWaterV1226&&window.arcanoWaterV1226.getGrassPlayer&&window.arcanoWaterV1226.getGrassPlayer();
 if(g){if(g.keys&&g.keys.clear)g.keys.clear();if(g.input){g.input.x=0;g.input.y=0;g.input.run=false;}}
 refresh();panel.classList.add('on');}
function close(){panel.classList.remove('on');window.arcanoPausa=false;}
btn.addEventListener('click',e=>{e.stopPropagation();open();});
panel.addEventListener('click',e=>{if(e.target===panel)close();});
panel.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
 if(a==='continuar')close();
 else if(a==='visao'){$('gameFirstPerson')&&$('gameFirstPerson').click();setTimeout(refresh,60);}
 else if(a==='som'){$('arcSom')&&$('arcSom').click();setTimeout(refresh,60);}
 else if(a==='resolucao'){$('animeResolution')&&$('animeResolution').click();setTimeout(refresh,120);}
 else if(a==='ajustes'){close();$('arcanoQuickToggle')&&$('arcanoQuickToggle').click();}
 else if(a==='sair'){close();$('gameExit')&&$('gameExit').click();}
 else if(a==='link'){window.arcanoPausa=false;}});
// saiu do modo Jogar: fecha o painel
new MutationObserver(()=>{if(!document.body.classList.contains('play-active')&&panel.classList.contains('on'))close();}).observe(document.body||document.documentElement,{attributes:true,attributeFilter:['class']});
// botão "voltar" do Android abre/fecha a pausa em vez de sair
addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('play-active')){panel.classList.contains('on')?close():open();}});
window.arcanoMenuMobile={open,close};
})();
