/* Som ambiente gerado na hora (Web Audio, sem arquivos):
   - vento (rajadas) e folhas farfalhando perto das árvores, segundo o vento do jogo;
   - água: rio corrente (mais brilhante) e lago calmo, pela distância até a água;
   - dia: pássaros de vários tipos (sabiá, pardal, canário, bem-te-vi) e cigarras na mata;
   - entardecer e noite: grilos, sapos coaxando (nos sapos de verdade, com direção), corujas;
   - insetos: zumbido das moscas perto do jogador; patos grasnando perto das famílias;
   - dentro das minas: o lado de fora some, entra um zumbido grave de caverna e gotas com eco.
   Começa no primeiro clique/tecla (regra dos navegadores). Botão 🔊 e tecla M liga/desliga. */
(function(){
'use strict';
let ac=null,master=null,on=true,NB=null,beds=null,echo=null;
const rr=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let saved=null;try{saved=localStorage.getItem('arcanoSom');}catch(e){}
if(saved==='0')on=false;

function start(){if(ac){if(ac.state==='suspended')ac.resume();return;}
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ac=new AC();
 master=ac.createGain();master.gain.value=on?1.3:0;
 const comp=ac.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;master.connect(comp);comp.connect(ac.destination);
 // ruído base (mistura de marrom e branco)
 NB=ac.createBuffer(1,ac.sampleRate*6,ac.sampleRate);{const d=NB.getChannelData(0);let l=0;for(let i=0;i<d.length;i++){const w=Math.random()*2-1;l=(l+.02*w)/1.02;d[i]=l*1.7+w*.15;}}
 const noise=()=>{const s=ac.createBufferSource();s.buffer=NB;s.loop=true;s.start(0,Math.random()*5);return s;};
 const bed=(chain)=>{const g=ac.createGain();g.gain.value=0;let n=noise();for(const f of chain){n.connect(f);n=f;}n.connect(g);g.connect(master);return g;};
 const F=(type,f,q)=>{const b=ac.createBiquadFilter();b.type=type;b.frequency.value=f;if(q!=null)b.Q.value=q;return b;};
 const windF=F('bandpass',420,.6),leafF=F('highpass',2200,.5),leafF2=F('peaking',5200,1.2),waterF=F('lowpass',700,.7),riverF=F('bandpass',1500,1.4),caveF=F('lowpass',160,.8);leafF2.gain.value=6;
 beds={wind:bed([windF]),leaves:bed([leafF,leafF2]),lake:bed([waterF]),river:bed([riverF]),cave:bed([caveF]),windF,leafF,riverF};
 // cigarras: ruído agudo com tremolo rápido
 {const g=ac.createGain();g.gain.value=0;const am=ac.createGain();am.gain.value=.5;const lfo=ac.createOscillator();lfo.frequency.value=31;const lg=ac.createGain();lg.gain.value=.5;lfo.connect(lg);lg.connect(am.gain);lfo.start();
  const n=noise(),bp=F('bandpass',5400,9);n.connect(bp);bp.connect(am);am.connect(g);g.connect(master);beds.cicada=g;}
 // zumbido de mosca (uma voz, segue a mosca mais próxima)
 {const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=205;const vib=ac.createOscillator();vib.frequency.value=9;const vg=ac.createGain();vg.gain.value=14;vib.connect(vg);vg.connect(o.frequency);vib.start();
  const lp=F('lowpass',1300,1),g=ac.createGain();g.gain.value=0;const pan=ac.createStereoPanner();o.connect(lp);lp.connect(g);g.connect(pan);pan.connect(master);o.start();beds.fly={g,pan,o};}
 // eco para sons dentro da mina
 {const d=ac.createDelay(1);d.delayTime.value=.23;const fb=ac.createGain();fb.gain.value=.42;const lp=F('lowpass',2400);d.connect(lp);lp.connect(fb);fb.connect(d);const out=ac.createGain();out.gain.value=.8;lp.connect(out);out.connect(master);echo=d;}
}
addEventListener('pointerdown',start,{passive:true});addEventListener('keydown',e=>{start();if(e.key&&e.key.toLowerCase()==='m'&&!e.repeat&&!(e.target&&/INPUT|TEXTAREA/.test(e.target.tagName)))toggle();});

/* ---------- botão ---------- */
const btn=document.createElement('button');btn.type='button';btn.id='arcSom';btn.title='Som ambiente (tecla M)';
btn.style.cssText='position:fixed;left:12px;bottom:12px;z-index:60;font:600 13px system-ui;color:#f1f5e6;background:rgba(20,30,28,.72);border:1px solid #839b82;border-radius:10px;padding:6px 10px;cursor:pointer';
const label=()=>{btn.textContent=on?'🔊 Som':'🔇 Som';};label();
const mount=()=>{if(document.body)document.body.appendChild(btn);else requestAnimationFrame(mount);};mount();
function toggle(){on=!on;try{localStorage.setItem('arcanoSom',on?'1':'0');}catch(e){}label();if(master)master.gain.setTargetAtTime(on?1.3:0,ac.currentTime,.15);}
btn.addEventListener('click',e=>{e.stopPropagation();start();toggle();});

/* ---------- sons curtos ---------- */
function voice(pan,vol,useEcho){const g=ac.createGain();g.gain.value=0;const p=ac.createStereoPanner();p.pan.value=clamp(pan,-1,1);g.connect(p);p.connect(master);if(useEcho&&echo){const s=ac.createGain();s.gain.value=.55;p.connect(s);s.connect(echo);}return {g,vol};}
function tone(type,t0,dur,f0,f1,pan,vol,opts){opts=opts||{};const o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t0);if(f1&&f1!==f0)o.frequency.exponentialRampToValueAtTime(f1,t0+dur);
 const v=voice(pan,vol,opts.echo);let node=o;if(opts.bp){const b=ac.createBiquadFilter();b.type='bandpass';b.frequency.value=opts.bp;b.Q.value=opts.q||4;o.connect(b);node=b;}node.connect(v.g);
 const a=opts.att||.008;v.g.gain.setValueAtTime(0,t0);v.g.gain.linearRampToValueAtTime(vol,t0+a);v.g.gain.setTargetAtTime(0,t0+dur*.6,dur*.25);o.start(t0);o.stop(t0+dur*1.6+.05);}
const BIRDS={
 sabia(t,p,v){const n=3+(Math.random()*3|0);let x=t;for(let i=0;i<n;i++){const f=rr(1700,3100),d=rr(.16,.3);tone('sine',x,d,f,f*rr(.9,1.12),p,v);x+=d+rr(.04,.12);}},
 pardal(t,p,v){const n=4+(Math.random()*5|0);for(let i=0;i<n;i++)tone('sine',t+i*.11,.06,rr(4200,5200),rr(2800,3400),p,v*.8);},
 canario(t,p,v){const n=12+(Math.random()*8|0),a=rr(2900,3400),b=a*rr(1.12,1.22);for(let i=0;i<n;i++)tone('sine',t+i*.045,.04,i%2?a:b,i%2?a:b,p,v*.7);},
 bemtevi(t,p,v){tone('sine',t,.12,2400,3200,p,v);tone('sine',t+.18,.12,2600,3400,p,v);tone('sine',t+.36,.32,3600,2500,p,v);}};
function owl(t,p,v){for(let i=0;i<(Math.random()<.5?2:3);i++)tone('sine',t+i*.55,.42,390,345,p,v,{att:.09});}
function cricket(t,p,v){const f=rr(4300,4900);for(let i=0;i<3;i++)tone('sine',t+i*.045,.022,f,f,p,v,{att:.003});}
function frog(t,p,v,deep){const f=deep?rr(95,125):rr(150,210);for(let i=0;i<(Math.random()<.6?2:3);i++)tone('sawtooth',t+i*.13,.11,f,f*.85,p,v,{bp:deep?420:650,q:5,att:.01});}
function quack(t,p,v){for(let i=0;i<1+(Math.random()*3|0);i++)tone('sawtooth',t+i*.22,.13,420,300,p,v,{bp:1150,q:6,att:.01});}
function drip(t,p,v){const f=rr(1400,2600);tone('sine',t,.07,f,f*1.6,p,v,{att:.002,echo:true});}

/* ---------- leitura do mundo ---------- */
const api=()=>window.arcanoWaterV1226;
let env={water:0,river:0,trees:0,inMine:false,under:false},envT=0,cool={bird:2,owl:6,frog:2,duck:4,drip:1};const crick=[];for(let i=0;i<7;i++)crick.push({pan:rr(-1,1),t:rr(0,2),rate:rr(.55,1.1),vol:rr(.5,1)});
function dayF(){const R=window.arcanoAnimeRiver,u=R&&R.material&&R.material.uniforms&&R.material.uniforms.uSun;const y=u?u.value.y:.5;return clamp((y+.1)/.28,0,1);}
function panOf(x,z){const a=api(),cam=a&&a.getMainCamera&&a.getMainCamera();if(!cam)return 0;const e=cam.matrixWorld.elements,rx=e[0],rz=e[2],px=cam.position.x,pz=cam.position.z,dx=x-px,dz=z-pz,l=Math.hypot(dx,dz)||1;return clamp((dx*rx+dz*rz)/l,-1,1)*.85;}
function scan(p){const FA=window.arcanoFundoAquatico,H=window.arcanoIslandHeight;let best=99,flow=0;
 if(FA&&FA.water){for(const r of [1.5,4,8,13,20])for(let k=0;k<12;k++){const a=k/12*Math.PI*2,x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r,w=FA.water(x,z);if(w&&r<best){best=r;flow=Math.hypot(w.flow[0],w.flow[1]);}}
  const w0=FA.water(p.x,p.z);if(w0){best=0;flow=Math.hypot(w0.flow[0],w0.flow[1]);}}
 const near=clamp(1-best/22,0,1);env.water=near*near;env.river=clamp(flow*2.5,0,1);
 const a=api(),fi=a&&a.forestInstances;let n=0;if(fi)for(let i=0;i<fi.length;i++){const q=fi[i];if(q.type!=='tree'&&q.type!=='pine')continue;const dx=q.x-p.x,dz=q.z-p.z;if(dx*dx+dz*dz<196)n++;}
 env.trees=clamp(n/10,0,1);
 env.inMine=false;const M=window.arcanoMinasObj;if(M&&M.SITES)for(const s of M.SITES){if(!s.L)continue;const dx=p.x-s.x,dz=p.z-s.z;if(dx*dx+dz*dz>2600)continue;const l=s.toL(p.x,p.z),c=M.findCell(s,l.x,l.z,p.y-s.g);if(c&&!(c.L===0&&l.z>2))env.inMine=true;}
 env.under=env.inMine||(H&&p.y<H(p.x,p.z)-2.5);}

let last=performance.now();
function tick(){requestAnimationFrame(tick);const now=performance.now(),dt=Math.min(.2,(now-last)/1000);last=now;if(!ac||!beds||ac.state!=='running')return;
 const a=api(),pl=a&&a.getGrassPlayer&&a.getGrassPlayer(),cam=a&&a.getMainCamera&&a.getMainCamera();const p=pl?pl.position:cam?cam.position:null;if(!p)return;
 envT-=dt;if(envT<=0){envT=.5;try{scan(p);}catch(e){}}
 const T=ac.currentTime,day=dayF(),night=1-day,dusk=clamp(1-Math.abs(day-.45)/.35,0,1),out=env.under?0:1;
 let wind=.45;try{wind=clamp(a.atmosphere.getGrassWindPower(),0,2);}catch(e){}
 const gust=.55+.45*Math.sin(now*.00031)*Math.sin(now*.00017+1)+.25*Math.sin(now*.0013);
 const set=(g,v)=>g.gain.setTargetAtTime(v,T,.35);
 set(beds.wind,out*(.05+.09*wind*gust));beds.windF.frequency.setTargetAtTime(300+260*gust,T,.4);
 set(beds.leaves,out*env.trees*(.03+.1*wind*clamp(gust,0,1.3)));
 set(beds.lake,out*env.water*(1-env.river*.6)*.22);set(beds.river,out*env.water*env.river*.26);
 set(beds.cicada,out*day*env.trees*.035*(.6+.4*Math.sin(now*.0007)));
 set(beds.cave,env.inMine?.14:0);
 // pássaros (dia) e corujas (noite) perto das árvores
 cool.bird-=dt;if(out&&cool.bird<=0){cool.bird=rr(1.2,4.5)/(.3+env.trees+(day>.5?.2:0));if(day>.25&&Math.random()<.4+.6*env.trees){const k=Object.keys(BIRDS),b=BIRDS[k[Math.random()*k.length|0]];b(T+.05,rr(-.9,.9),rr(.04,.09)*(.4+env.trees*.6)*day);}}
 cool.owl-=dt;if(out&&cool.owl<=0){cool.owl=rr(8,20);if(night>.65&&env.trees>.2)owl(T+.05,rr(-.8,.8),.07*env.trees);}
 // grilos: entardecer e noite, onde tem mato
 if(out&&(night>.35||dusk>.5))for(const c of crick){c.t-=dt;if(c.t<=0){c.t=c.rate*rr(.85,1.2);if(Math.random()<.85)cricket(T+.02,c.pan,.018*c.vol*Math.max(night,dusk*.6)*(.4+.6*(1-env.water*.5)));}}
 // sapos de verdade: coaxam de onde estão
 cool.frog-=dt;const FR=window.arcanoFauna&&window.arcanoFauna.frogs;if(out&&cool.frog<=0&&FR&&FR.length){cool.frog=rr(.5,2.2)/(.4+night);const f=FR[Math.random()*FR.length|0],d=Math.hypot(f.x-p.x,f.z-p.z);if(d<35&&f.st!=='under'){frog(T+.03,panOf(f.x,f.z),.12/(1+d*d/40)*(.35+.65*Math.max(night,dusk)),f.size>.14);}}
 else if(out&&cool.frog<=0)cool.frog=2;
 // patos
 cool.duck-=dt;const VA=window.arcanoVidaAquatica;if(out&&cool.duck<=0&&VA&&VA.families&&VA.families.length){cool.duck=rr(3,9);const F=VA.families[Math.random()*VA.families.length|0],m=F.mom,d=Math.hypot(m.x-p.x,m.z-p.z);if(d<30)quack(T+.03,panOf(m.x,m.z),(F.st==='fly'||F.st==='flee'?.12:.07)/(1+d*d/60));}
 // mosca mais próxima zumbindo
 let fd=99,fx=0,fz=0;const FL=window.arcanoFauna&&window.arcanoFauna.flies;if(FL)for(const m of FL){if(m.st==='dead'||m.st==='eaten'||m.st==='land')continue;const d=Math.hypot(m.x-p.x,(m.y||0)-p.y-1,m.z-p.z);if(d<fd){fd=d;fx=m.x;fz=m.z;}}
 beds.fly.g.gain.setTargetAtTime(out*(fd<4?.05*(1-fd/4)**2:0),T,.1);beds.fly.pan.pan.setTargetAtTime(panOf(fx,fz),T,.1);beds.fly.o.frequency.setTargetAtTime(195+25*Math.sin(now*.003),T,.1);
 // gotas dentro da mina
 cool.drip-=dt;if(env.inMine&&cool.drip<=0){cool.drip=rr(.6,2.6);drip(T+.02,rr(-.8,.8),rr(.04,.09));}
}
tick();
window.arcanoAudio={start,toggle,get env(){return env;},get ctx(){return ac;},get master(){return master;}};
})();
