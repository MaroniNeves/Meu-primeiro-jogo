/* Carregado ANTES do jogo (logo depois do Three.js) para evitar o "piscar":
   1. Resolução com um único dono: o jogo e os módulos pediam valores diferentes
      (ex.: 1,2x e 1,25x) e cada troca recriava a imagem da tela. Agora todo
      pedido passa por aqui e só vale a resolução escolhida no botão.
   2. Sem tone mapping desde o primeiro quadro (antes era trocado depois e
      recompilava todos os shaders).
   3. Ganchos de "objeto adicionado": os módulos de estilo anime pintam cada
      objeto no instante em que entra na cena, sem aparecer primeiro com as
      cores antigas e trocar alguns segundos depois. */
(function(){
'use strict';
const T=window.THREE;
if(!T||!T.WebGLRenderer)return;
const mobile=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&innerWidth<900);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const MODES=[{id:'auto',label:'Auto'},{id:'.75',label:'75%'},{id:'1',label:'100%'},{id:'1.5',label:'150%'},{id:'2',label:'200%'}];
const state={mode:'auto',scale:1,renderer:null,realSet:null};
try{const s=localStorage.getItem('arcano.animeResolution');if(MODES.some(m=>m.id===s))state.mode=s;}catch(_){}
const dpr=()=>devicePixelRatio||1;
function target(){
 if(state.mode==='auto')return clamp(Math.min(dpr(),mobile?1:1.25)*state.scale,.6,2);
 return clamp(dpr()*Number(state.mode),.5,4);
}
function apply(){
 const r=state.renderer;if(!r)return;
 const want=target();
 if(Math.abs(r.getPixelRatio()-want)<.01)return;
 state.realSet.call(r,want);
 window.dispatchEvent(new Event('resize'));
}

// ---------- Renderizador ----------
const Base=T.WebGLRenderer;
class AnimeRenderer extends Base{
 constructor(params){
  super(params);
  const real=this.setPixelRatio;
  state.renderer=this;state.realSet=real;
  // Qualquer pedido de resolução (do jogo ou de módulos) vira a escolhida.
  this.setPixelRatio=()=>{
   const want=target();
   if(Math.abs(this.getPixelRatio()-want)>=.01)real.call(this,want);
  };
  Object.defineProperty(this,'toneMapping',{configurable:true,get:()=>T.NoToneMapping,set:()=>{}});
 }
}
try{T.WebGLRenderer=AnimeRenderer;}catch(_){}

// ---------- Ganchos de objetos adicionados ----------
const hooks=window.__animeAddHooks=window.__animeAddHooks||[];
const add=T.Object3D.prototype.add;
T.Object3D.prototype.add=function(...objects){
 const result=add.apply(this,objects);
 if(hooks.length)for(const o of objects){
  if(!o||o===this)continue;
  for(const h of hooks){try{h(o);}catch(e){console.warn('[anime]',e);}}
 }
 return result;
};

// ---------- Botão e modo automático ----------
function setup(){
 let frames=0,last=performance.now(),low=0,high=0,lastChange=performance.now();
 function tick(now){
  requestAnimationFrame(tick);frames++;
  if(now-last<2000)return;
  const fps=frames*1000/(now-last);frames=0;last=now;
  if(document.hidden||state.mode!=='auto'||!state.renderer)return;
  // Só muda depois de 6 s seguidos e no máximo a cada 15 s.
  low=fps<36?low+1:0;high=fps>58?high+1:0;
  if(now-lastChange<15000)return;
  if(low>=3&&state.scale>.62){state.scale=Math.max(.62,state.scale-.15);lastChange=now;low=high=0;apply();}
  else if(high>=3&&state.scale<1){state.scale=Math.min(1,state.scale+.1);lastChange=now;low=high=0;apply();}
 }
 requestAnimationFrame(tick);
 const button=document.createElement('button');
 button.type='button';button.id='animeResolution';
 const css=document.createElement('style');
 css.textContent=`#animeResolution{position:fixed;top:52px;right:12px;z-index:40;
  font:600 12px system-ui,Segoe UI,sans-serif;color:#eaf1ed;cursor:pointer;
  background:rgba(16,29,41,.82);border:1px solid #45606b;border-radius:10px;padding:7px 11px;}
  #animeResolution:hover{border-color:#80c0bf}`;
 document.head.appendChild(css);
 const label=()=>{
  button.textContent='🖥 Resolução: '+MODES.find(m=>m.id===state.mode).label;
  button.title='Toque para mudar a resolução. Mais alta = mais nítida e mais pesada.';
 };
 button.addEventListener('click',()=>{
  const i=MODES.findIndex(m=>m.id===state.mode);
  state.mode=MODES[(i+1)%MODES.length].id;state.scale=1;
  try{localStorage.setItem('arcano.animeResolution',state.mode);}catch(_){}
  label();apply();
 });
 label();document.body.appendChild(button);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
window.arcanoAnimeResolution={state,apply};
})();
