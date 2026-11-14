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
  if(kind==='grass'){
   noise(ac,t,.16*k,[F(ac,'highpass',1400,.5),F(ac,'bandpass',rr(3200,4600),.8)],.16*k,.01);
   noise(ac,t+.03,.12,[F(ac,'bandpass',rr(6000,8000),1)],.05*k);
   tone(ac,t,rr(80,95),45,.07,.10*k);
   if(run)noise(ac,t+.05,.22,[F(ac,'highpass',2500,.6)],.06);}
  else if(kind==='dirt'){
   noise(ac,t,.11*k,[F(ac,'lowpass',rr(700,1000),.9)],.32*k);
   noise(ac,t+.01,.07,[F(ac,'bandpass',2600,1.2)],.05*k);
   tone(ac,t,rr(70,85),40,.08,.16*k);
   if(run)noise(ac,t+.06,.16,[F(ac,'bandpass',1800,.8)],.07);}            // arrasto de cascalho
  else if(kind==='stone'){
   noise(ac,t,.06,[F(ac,'bandpass',rr(1800,2600),1.6)],.26*k);
   tone(ac,t,rr(260,320),150,.05,.07*k,'triangle');
   tone(ac,t,rr(90,110),50,.06,.12*k);}
  else if(kind==='wood'){
   noise(ac,t,.08,[F(ac,'bandpass',rr(500,700),2.2)],.22*k);
   tone(ac,t,rr(170,210),110,.16,.2*k,'triangle');
   tone(ac,t+.008,rr(340,420),260,.07,.05*k);}
  else if(kind==='water'){
   noise(ac,t,.32*k,[F(ac,'bandpass',rr(900,1400),.7)],.22*k,.012);
   noise(ac,t+.05,.4,[F(ac,'lowpass',600,.8)],.12*k,.03);
   tone(ac,t+.02,rr(380,460),170,.12,.04);}
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

/* ---------- laço: mede a distância andada e toca os passos ---------- */
let lx=null,lz=null,acc=0,side=1,strokeAcc=0,wasSwim=false;
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
 if(wasSwim){wasSwim=false;step('water',false,side);}
 if(moved<.002){acc=Math.min(acc,.4);return;}
 acc+=moved;const stride=run?1.05:.72;
 if(acc>=stride){acc-=stride;side=-side;step(surface(p,g),run,side);}
}
tick();
window.arcanoSonsJogador={step,stroke,surface};
})();
