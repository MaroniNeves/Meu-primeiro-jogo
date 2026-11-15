/* Sons do personagem (gerados na hora com Web Audio, sem arquivos):
   - passos que mudam com o chão: grama (farfalhar), terra/trilha (batida abafada), pedra (estalo seco; com eco nas minas),
     madeira (pontes, píer, decks: toque oco);
   - correr: passos mais rápidos, mais fortes e com um "arrasto";
   - água rasa: chapinhar a cada passo; nadando: braçadas (água empurrada) e respingos.
   Usa o som do jogo (window.arcanoAudio): o botão 🔊 / tecla M também liga e desliga estes sons. */
(function(){
'use strict';
const rr=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let NB=null,out=null,ctxRef=null;
function ready(){
 const A=window.arcanoAudio,ac=A&&A.ctx;if(!ac||!A.master||ac.state!=='running')return null;
 if(ctxRef!==ac){ctxRef=ac;
  NB=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  out=ac.createGain();out.gain.value=.9;out.connect(A.master);}
 return ac;}
function noise(ac,t,dur,chain,gain,attack){
 const s=ac.createBufferSource();s.buffer=NB;s.playbackRate.value=rr(.9,1.1);
 const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+(attack||.004));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 let n=s;for(const f of chain){n.connect(f);n=f;}n.connect(g);g.connect(out);s.start(t,Math.random()*1.5);s.stop(t+dur+.05);}
function tone(ac,t,f0,f1,dur,gain,type){
 const o=ac.createOscillator();o.type=type||'sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
 const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.05);}
const F=(ac,type,f,q)=>{const b=ac.createBiquadFilter();b.type=type;b.frequency.value=f;if(q!=null)b.Q.value=q;return b;};
let mineEcho=null;
function echoNode(ac){if(mineEcho&&mineEcho.ac===ac)return mineEcho.in;
 const inp=ac.createGain(),dl=ac.createDelay(1),fb=ac.createGain(),lp=F(ac,'lowpass',1800,.7);dl.delayTime.value=.19;fb.gain.value=.38;inp.connect(dl);dl.connect(lp);lp.connect(fb);fb.connect(dl);lp.connect(out);
 mineEcho={ac,in:inp};return inp;}

/* ---------- um passo ---------- */
function step(kind,run,side){
 const ac=ready();if(!ac)return;const t=ac.currentTime+.005,k=run?1.45:1,pan=ac.createStereoPanner();pan.pan.value=side*.12;
 const prevOut=out;const tmp=ac.createGain();tmp.connect(pan);pan.connect(kind==='stone'&&window.arcanoAudio.env&&window.arcanoAudio.env.inMine?echoNode(ac):prevOut);
 if(kind==='stone'&&window.arcanoAudio.env&&window.arcanoAudio.env.inMine)pan.connect(prevOut);
 out=tmp;
 try{
  // passos MACIOS: só ruído filtrado com ataque suave (sem tons de "batida na tábua")
  const att=.014;
  if(kind==='grass'){
   noise(ac,t,.2*k,[F(ac,'bandpass',rr(1700,2500),.55),F(ac,'lowpass',4200,.5)],.06*k,att);   // capim amassando
   noise(ac,t,.12,[F(ac,'lowpass',170,.7)],.07*k,att);                                         // pisada abafada
   if(run)noise(ac,t+.04,.2,[F(ac,'bandpass',3200,.6)],.025,.02);}
  else if(kind==='dirt'){
   noise(ac,t,.13*k,[F(ac,'lowpass',rr(520,700),.6)],.1*k,att);
   noise(ac,t+.01,.09,[F(ac,'bandpass',1500,.7)],.022*k,att);                                   // terrinha
   if(run)noise(ac,t+.05,.14,[F(ac,'bandpass',1200,.6)],.03,.02);}
  else if(kind==='stone'){
   noise(ac,t,.09,[F(ac,'bandpass',rr(1000,1400),.7)],.05*k,att);                               // sola na pedra
   noise(ac,t,.1,[F(ac,'lowpass',220,.7)],.06*k,att);}
  else if(kind==='wood'){
   noise(ac,t,.12,[F(ac,'lowpass',rr(700,950),.6)],.075*k,att);
   noise(ac,t,.14,[F(ac,'lowpass',180,.8)],.07*k,att);}
  else if(kind==='water'){
   noise(ac,t,.3*k,[F(ac,'bandpass',rr(900,1300),.6)],.12*k,.02);
   noise(ac,t+.05,.38,[F(ac,'lowpass',550,.7)],.07*k,.04);}
 }finally{out=prevOut;}
}
/* ---------- uma braçada nadando ---------- */
function stroke(strong){
 const ac=ready();if(!ac)return;const t=ac.currentTime+.005,k=strong?1.3:1;
 noise(ac,t,.55*k,[F(ac,'bandpass',rr(500,800),.6)],.18*k,.12);        // água empurrada
 noise(ac,t+.25,.35,[F(ac,'bandpass',rr(1600,2400),.9)],.12*k,.02);     // respingo
 noise(ac,t+.3,.6,[F(ac,'lowpass',350,.7)],.10,.05);                    // borbulhar grave
 tone(ac,t+.28,rr(500,650),220,.1,.03);}

/* ---------- que chão está sob o pé ---------- */
function surface(p,g){
 const x=p.x,z=p.z;
 // tablados (pontes, píer, decks, escadas de madeira)
 const br=window.arcanoBridgeSolid;if(br&&br.surfaceAt&&br.surfaceAt(x,z)!=null)return 'wood';
 const ex=window.arcanoExtraDecks;if(ex)for(const d of ex){try{const y=d.surfaceAt(x,z);if(y!=null&&Math.abs(y-p.y)<.6)return (window.arcanoAudio&&window.arcanoAudio.env&&window.arcanoAudio.env.inMine)?'stone':'wood';}catch(e){}}
 if(window.arcanoAudio&&window.arcanoAudio.env&&window.arcanoAudio.env.inMine)return 'stone';
 // água rasa
 const wl=window.arcanoWaterLevelAt&&window.arcanoWaterLevelAt(x,z);if(wl!=null&&wl>p.y+.06&&g.wasInWater)return 'water';
 if(g.wasInWater)return 'water';
 // cidade e castelo: pedra
 const I=window.arcanoIsland;if(I&&I.center&&Math.hypot(x-I.center.x,z-I.center.z)<(I.cityRadius||130)-4)return 'stone';
 // grama x terra/trilha
 const gr=window.arcanoIslandGreen?window.arcanoIslandGreen(x,z):.6;return gr>.42?'grass':'dirt';
}

/* ---------- laço: o passo toca quando o pé da animação encosta no chão (sincronizado com o personagem) ---------- */
let lx=null,lz=null,strokeAcc=0,wasSwim=false,feet=null,feetRoot=null;const wp={x:0,y:0,z:0};
function findFeet(g){const r=g.root;if(!r)return null;if(feetRoot===r&&feet)return feet;feetRoot=r;const L=[],R=[];r.traverse(o=>{if(!o.isBone)return;if(/LeftFoot$/i.test(o.name))L.push(o);if(/RightFoot$/i.test(o.name))R.push(o);});
 feet=L.length&&R.length?[{b:L[0],side:-1,base:.07,up:false},{b:R[0],side:1,base:.07,up:false}]:null;return feet;}
const V=window.THREE?new window.THREE.Vector3():null;
function tick(){requestAnimationFrame(tick);
 if(!document.body.classList.contains('play-active')){lx=null;return;}
 const api=window.arcanoWaterV1226,g=api&&api.getGrassPlayer&&api.getGrassPlayer();if(!g||!g.position)return;
 const p=g.position;if(lx==null){lx=p.x;lz=p.z;return;}
 const moved=Math.hypot(p.x-lx,p.z-lz);lx=p.x;lz=p.z;if(moved>3)return;                     // teleporte
 const run=!!(g.keys&&g.keys.has&&g.keys.has('shift'))||!!(g.input&&g.input.run);
 if(g.swimming){
  if(!wasSwim){stroke(true);strokeAcc=0;}                                                   // entrou nadando: tchibum
  strokeAcc+=moved;if(strokeAcc>(run?1.1:.95)){strokeAcc=0;stroke(run);}
  wasSwim=true;return;}
 if(wasSwim){wasSwim=false;step('water',false,1);}
 const F2=findFeet(g);if(!F2||!V)return;
 const moving=moved>.004;
 for(const f of F2){f.b.getWorldPosition(V);const h=V.y-p.y;
  f.base=Math.min(f.base+.02*(1/60),h);                                                     // altura do pé apoiado (se adapta ao modelo)
  if(h>f.base+.045)f.up=true;
  else if(f.up&&h<f.base+.014){f.up=false;if(moving){wp.x=V.x;wp.y=p.y;wp.z=V.z;step(surface(wp,g),run,f.side);}}}
}
tick();
window.arcanoSonsJogador={step,stroke,surface};
})();
