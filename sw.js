/* Aplicativo do Ateliê Arcano (instalável). Não guarda o jogo em cache: tudo vem da rede, e a página continua
   conferindo a versão sozinha (versao.txt). Sem internet, a abertura mostra um aviso em vez da tela de erro. */
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
 if(e.request.mode!=='navigate')return;
 e.respondWith(fetch(e.request).catch(()=>new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="background:#0b141b;color:#e8f0ea;font:16px system-ui;display:grid;place-items:center;height:100vh;margin:0;text-align:center"><div><h2>Ateliê Arcano</h2><p>Sem internet agora.<br>Conecte e abra de novo.</p></div>',{headers:{'Content-Type':'text/html; charset=utf-8'}})));
});
