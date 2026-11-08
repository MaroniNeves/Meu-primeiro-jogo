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

// ---------- Obstáculos e pisos extras (usados pelo movimento do personagem) ----------
// Círculos (árvores, pedras, postes) e caixas giradas (paredes, porta, móveis).
// Uma caixa pode ter enabled() — ex.: a porta só bloqueia quando está fechada.
const CELL=4,cells=new Map(),boxes=[],floors=[];
const key=(i,j)=>i+','+j;
window.arcanoObstacles={
 // Registra o círculo em TODAS as células que ele cobre (objetos grandes, como o
 // chafariz, antes ficavam fora da busca e dava para atravessar).
 // opt.ymin/ymax: só vale nessa faixa de altura (paredes de um andar).
 addCircle(x,z,r,opt){const c=Object.assign({x,z,r},opt||{});
  const e=r+.35;for(let i=Math.floor((x-e)/CELL);i<=Math.floor((x+e)/CELL);i++)for(let j=Math.floor((z-e)/CELL);j<=Math.floor((z+e)/CELL);j++){
   const k=key(i,j);if(!cells.has(k))cells.set(k,[]);cells.get(k).push(c);}},
 addBox(b){boxes.push(b);return b;},
 blocked(fx,fz,tx,tz){
  const pr=.28;
  const pl=window.arcanoWaterV1226&&window.arcanoWaterV1226.getGrassPlayer&&window.arcanoWaterV1226.getGrassPlayer();
  const py=pl?pl.position.y:0;
  const outY=o=>(o.ymin!=null&&py<o.ymin)||(o.ymax!=null&&py>o.ymax);
  const ci=Math.floor(tx/CELL),cj=Math.floor(tz/CELL);
  for(let i=ci;i<=ci;i++)for(let j=cj;j<=cj;j++){
   const list=cells.get(key(i,j));if(!list)continue;
   for(const c of list){
    if(outY(c))continue;
    const rr=c.r+pr,after=Math.hypot(tx-c.x,tz-c.z);
    if(after<rr&&after<Math.hypot(fx-c.x,fz-c.z)-1e-6)return true;
   }
  }
  for(const b of boxes){
   if(b.enabled&&!b.enabled())continue;
   if(outY(b))continue;
   const cs=Math.cos(b.rot||0),sn=Math.sin(b.rot||0);
   const lx=(x,z)=>(x-b.x)*cs-(z-b.z)*sn,lz=(x,z)=>(x-b.x)*sn+(z-b.z)*cs;
   const ax=Math.abs(lx(tx,tz)),az=Math.abs(lz(tx,tz)),hw=b.hw+pr,hd=b.hd+pr;
   if(ax<hw&&az<hd){
    const bx=Math.abs(lx(fx,fz)),bz=Math.abs(lz(fx,fz));
    // Bloqueia entrar na caixa ou ir mais para dentro dela.
    if(!(bx<hw&&bz<hd))return true;
    if(Math.min(hw-ax,hd-az)>Math.min(hw-bx,hd-bz)+1e-6)return true; // só bloqueia ir mais para dentro
   }
  }
  return false;
 }
};
// Pisos: funções (x,z)=>altura ou null (chão da casa, fundação do castelo...).
window.arcanoGroundOverrides=floors;
})();
