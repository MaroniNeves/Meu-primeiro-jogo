// Botão para voltar ao Ateliê Arcano (adicionado pelo Ateliê; não faz parte do Small Magic original).
(function(){
 const b=document.createElement('a');b.href='../index.html';b.textContent='← Ateliê Arcano';b.id='voltarAtelie';
 b.style.cssText='position:fixed;left:10px;bottom:10px;z-index:99999;padding:7px 11px;border-radius:9px;background:#152826db;border:1px solid #98ac99;color:#f1e3af;font:700 12px system-ui;text-decoration:none;opacity:.75';
 b.onmouseenter=()=>b.style.opacity='1';b.onmouseleave=()=>b.style.opacity='.75';
 if(matchMedia('(pointer: coarse)').matches||location.search.includes('touch')){b.style.left='auto';b.style.right='118px';b.style.bottom='auto';b.style.top='18px';}
 const add=()=>document.body.appendChild(b);document.body?add():addEventListener('DOMContentLoaded',add);
 // com o mouse preso no jogo, Esc solta o mouse e o botão fica clicável
})();
