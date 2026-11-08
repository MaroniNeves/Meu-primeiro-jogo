/* Câmera em primeira pessoa (opcional).
   - Botão "👁 1ª pessoa" na barra do jogo e tecla V alternam.
   - A câmera fica nos olhos do personagem e olha para onde a câmera de
     terceira pessoa olharia (arrastar gira, como antes; WASD anda na direção
     do olhar). O corpo do personagem some para não tampar a visão.
   - A escolha fica salva no navegador. */
(function(){
'use strict';
const KEY='arcanoPrimeiraPessoa';
let active=false;try{active=localStorage.getItem(KEY)==='1';}catch(e){}
let game=null,eyeY=null;
const fp={
 get active(){return active;},
 set active(v){
  active=!!v;try{localStorage.setItem(KEY,active?'1':'0');}catch(e){}
  if(!active&&game&&game.root&&game.active)game.root.visible=true;
  eyeY=null;paint();
 },
 apply(camera,g,ground){
  game=g;
  if(g.root)g.root.visible=false;
  // Altura dos olhos suavizada (degraus e rampas não sacodem a visão).
  const target=g.position.y+1.62;
  eyeY=eyeY==null||Math.abs(target-eyeY)>2?target:eyeY+(target-eyeY)*.35;
  const h=g.camHeading,p=Math.max(-1.25,Math.min(1.25,(g.camPitch||0)-.35));
  const fx=Math.sin(h),fz=Math.cos(h);
  camera.position.set(g.position.x+fx*.12,eyeY,g.position.z+fz*.12);
  camera.lookAt(camera.position.x+fx*Math.cos(p),eyeY-Math.sin(p),camera.position.z+fz*Math.cos(p));
 }
};
window.arcanoFirstPerson=fp;
let btn=null;
function paint(){if(btn){btn.textContent=active?'🎥 3ª pessoa':'👁 1ª pessoa';btn.setAttribute('aria-pressed',active);}}
function install(){
 const bar=document.querySelector('.game-top');
 if(!bar){setTimeout(install,500);return;}
 btn=document.createElement('button');btn.type='button';btn.id='gameFirstPerson';
 btn.title='Alternar primeira/terceira pessoa (tecla V)';
 btn.addEventListener('click',()=>{fp.active=!active;});
 const near=bar.querySelector('a[href="./orbes.html"]');if(near)near.after(btn);else bar.appendChild(btn);paint();
 addEventListener('keydown',e=>{if(e.key&&e.key.toLowerCase()==='v'&&!e.repeat&&document.body.classList.contains('play-active')&&!/INPUT|TEXTAREA/.test(document.activeElement&&document.activeElement.tagName))fp.active=!active;});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
