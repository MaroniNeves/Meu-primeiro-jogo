/* Poses e animações dos personagens. Ângulos em graus, no espaço do personagem (x = esquerda, y = cima, z = frente).
   Braço: down 0 = aberto na horizontal, 90 = caído; fwd leva o braço caído para a frente (180 = para cima);
          across fecha o braço aberto para a frente; twist + = rotação interna; elbow dobra; ftwist 0 = palma para cima/frente,
          90 = polegar para cima, 180 = palma para baixo; wrist + dobra para a palma; wristIn + para o mindinho; grip 0..1.
   Perna: fwd + = coxa para a frente; out + = abre; twist + = ponta do pé para fora; knee dobra; foot + = ponta para baixo.
   root/spine/neck/head: [inclinar para a frente, virar à esquerda, tombar para a direita]. lift = subir; ground 1 = encostar no chão. */
const armB={down:72,fwd:0,across:0,twist:10,elbow:16,ftwist:80,wrist:0,wristIn:0,grip:.3,shrug:0,clavFwd:0};
const legB={fwd:0,out:3,twist:4,knee:2,foot:0,footRoll:0,toe:0};
export const BASE={root:[0,0,0],pelvis:[0,0,0],spine:[0,0,0],neck:[0,0,0],head:[0,0,0],lift:0,ground:1,px:0,pz:0,armL:armB,armR:armB,legL:legB,legR:legB};
const sin=Math.sin,cos=Math.cos,PI=Math.PI,TAU=PI*2,abs=Math.abs;
const sw=x=>Math.pow(Math.max(0,x),1.3),both=a=>({armL:a,armR:a}),legs=l=>({legL:l,legR:l}),J=(...o)=>Object.assign({},...o);
const K=(t,p,lin)=>({t,p,lin});
function gait(ph,o){const a=ph*TAU,s=sin(a),c=cos(a);
 const leg=(s,c)=>({fwd:o.off+o.A*s,knee:o.k0+o.K*sw(c),foot:-o.f*sw(s)+o.f2*sw(-s),toe:o.f2*.4*sw(-s)});
 const arm=s=>({down:o.ad,fwd:o.b0-o.B*s,elbow:o.e0+o.e1*sw(-s),twist:o.at,grip:o.grip});
 return {root:[o.lean,0,o.roll*c],pelvis:[0,-o.pelv*s,0],spine:[o.sp,o.pelv*s,-o.roll*c],neck:[-(o.lean+o.sp)*.35,-o.pelv*s*.5,0],head:[-(o.lean+o.sp)*.35,-o.pelv*s*.5,0],lift:o.air*Math.pow(abs(s),3),
  legL:leg(s,c),legR:leg(-s,-c),armL:arm(s),armR:arm(-s)};}
const G={slow:{off:2,A:15,K:28,k0:3,f:6,f2:12,ad:74,b0:2,B:10,e0:16,e1:8,at:10,grip:.3,lean:2,roll:1.5,pelv:4,sp:1,air:0},
 walk:{off:3,A:25,K:48,k0:4,f:10,f2:20,ad:74,b0:3,B:22,e0:18,e1:14,at:10,grip:.3,lean:4,roll:2,pelv:7,sp:2,air:0},
 run:{off:14,A:38,K:88,k0:14,f:8,f2:30,ad:78,b0:8,B:42,e0:85,e1:10,at:15,grip:.8,lean:12,roll:2.5,pelv:12,sp:6,air:.05},
 sprint:{off:18,A:50,K:108,k0:18,f:6,f2:38,ad:78,b0:10,B:58,e0:95,e1:12,at:15,grip:.9,lean:20,roll:3,pelv:16,sp:8,air:.09},
 stairs:{off:30,A:30,K:72,k0:8,f:4,f2:22,ad:74,b0:4,B:18,e0:30,e1:14,at:10,grip:.4,lean:8,roll:2,pelv:6,sp:3,air:0}};
/* posturas de combate */
const stance={root:[4,-22,0],spine:[4,-8,0],head:[0,26,0],legL:{fwd:26,knee:30,out:6},legR:{fwd:-16,knee:22,out:10,twist:24,foot:8}};
const swordR={down:76,fwd:32,elbow:88,twist:14,ftwist:90,grip:1},offL={down:68,fwd:8,elbow:62,twist:22,grip:.6};
const shieldL={down:62,fwd:36,elbow:100,twist:46,ftwist:90,grip:1};
const squat={root:[22,0,0],spine:[16,0,0],head:[-14,0,0],legL:{fwd:92,knee:118,out:12,foot:-22},legR:{fwd:92,knee:118,out:12,foot:-22}};
const kneel={root:[14,0,0],spine:[12,0,0],legL:{fwd:92,knee:96,out:8},legR:{fwd:-4,knee:104,out:6,foot:42}};
const lie={root:[-90,0,0],pz:-.55,head:[6,0,0],armL:{down:74,elbow:8,ftwist:120},armR:{down:74,elbow:8,ftwist:120},legL:{fwd:2,knee:4,out:6,foot:28},legR:{fwd:2,knee:4,out:6,foot:28}};
const sitG={root:[-18,0,0],spine:[16,0,0],pz:-.3,legL:{fwd:78,knee:70,out:8},legR:{fwd:78,knee:70,out:8},armL:{down:60,fwd:-30,elbow:14,ftwist:150},armR:{down:60,fwd:-30,elbow:14,ftwist:150}};
const V=(c,x,y,z)=>new c.V3(x,y,z);
/* arco: corda, flecha no arco e flecha voando */
function bowTick(c,nock,hold,rel){const bow=c.P.bow,u=bow.userData,t=c.t,top=V(c,u.tipX,u.tipY,0),bot=V(c,u.tipX,-u.tipY,0);let n=V(c,u.tipX,0,0);
 if(t>=hold&&t<rel){c.H.R.getWorldPosition(n);bow.worldToLocal(n);n.x=Math.min(n.x,u.tipX);n.y*=.5;n.z*=.3;}
 else if(t>=rel&&t<rel+.25)n.x+=.03*sin((t-rel)*90)*(1-(t-rel)/.25);
 c.setLine(u.str,[top,n,bot]);u.ar.visible=t>=nock&&t<rel;u.ar.position.copy(n);u.ar.rotation.set(0,0,Math.atan2(-n.y,.03-n.x));
 const fly=c.P.arrow;fly.visible=t>=rel&&t<rel+.7;if(fly.visible){const p0=c.pos(bow,V(c,0,0,0)),p1=c.root.worldToLocal(bow.localToWorld(V(c,1,0,0))),d=p1.sub(p0).normalize();fly.position.copy(p0).addScaledVector(d,.1+(t-rel)*30);fly.quaternion.setFromUnitVectors(V(c,1,0,0),d);}}
const flick=(f,t,s)=>{f.scale.set(s*(1+.08*sin(t*23)),s*(1+.18*sin(t*17+1)),s*(1+.08*sin(t*29)));};
const bowAim={root:[0,-82,0],head:[0,74,0],spine:[0,-4,0],legL:{out:10,twist:10},legR:{out:10,twist:10}};
const bowUp={down:0,across:0,elbow:4,twist:0,ftwist:0,grip:1},drawFull={down:-5,across:6,elbow:150,twist:0,ftwist:90,grip:.85};

export const ANIMS={
 parado:{nome:'Parado',dur:4,loop:true,fn:ph=>{const b=sin(ph*TAU),b2=sin(ph*TAU*2+.6);return {spine:[1.5+1.2*b,2*sin(ph*TAU+1),.8*b2],neck:[-.8*b,0,0],head:[b2,4*sin(ph*TAU),0],pelvis:[0,0,1.2*b],
  armL:{down:72-1.5*b,elbow:16+2*b,fwd:1.5*b2},armR:{down:72-1.5*b,elbow:16+2*b,fwd:-1.5*b2},legL:{knee:3+1.5*b,fwd:1+.7*b},legR:{knee:3+1.5*b,fwd:1+.7*b}};}},
 andarLento:{nome:'Caminhar devagar',dur:1.5,loop:true,fn:ph=>gait(ph,G.slow)},
 andar:{nome:'Andar',dur:1.02,loop:true,fn:ph=>gait(ph,G.walk)},
 correr:{nome:'Correr',dur:.64,loop:true,fn:ph=>gait(ph,G.run)},
 correrRapido:{nome:'Correr rápido',dur:.46,loop:true,fn:ph=>gait(ph,G.sprint)},
 pular:{nome:'Pular',dur:1.75,loop:true,keys:[K(0,{}),
  K(.3,J({root:[18,0,0],spine:[14,0,0],head:[-15,0,0]},legs({fwd:62,knee:100,foot:-20}),both({down:80,fwd:-45,elbow:25}))),
  K(.45,J({ground:0,lift:.12,root:[4,0,0]},legs({fwd:-4,knee:4,foot:38}),both({down:85,fwd:150,elbow:15}))),
  K(.74,{ground:0,lift:.62,root:[-3,0,0],legL:{fwd:48,knee:84,foot:20},legR:{fwd:20,knee:58,foot:26},armL:{down:60,fwd:60,elbow:40},armR:{down:60,fwd:60,elbow:40}}),
  K(1,J({ground:0,lift:.1},legs({fwd:12,knee:15,foot:12}),both({down:55,fwd:20,elbow:30}))),
  K(1.13,J({root:[14,0,0],spine:[10,0,0]},legs({fwd:50,knee:85,foot:-15}),both({down:70,fwd:25,elbow:35}))),K(1.5,{}),K(1.75,{})]},
 flutuar:{nome:'Flutuar (uma perna erguida)',dur:4,loop:true,fn:ph=>{const b=sin(ph*TAU);return {ground:0,lift:.38+.07*b,root:[-4+2*b,6*sin(ph*TAU*.5),0],spine:[-8,0,0],head:[6,0,0],
  legL:{fwd:58,knee:98,foot:38,out:6},legR:{fwd:-4,knee:6,foot:46},armL:{down:52+4*b,fwd:-8,elbow:24,ftwist:50,grip:.1},armR:{down:52+4*b,fwd:-8,elbow:24,ftwist:50,grip:.1}};}},
 agachar:{nome:'Agachar e pegar item',dur:3.2,loop:true,props:['item@world','itemH@R'],keys:[K(0,{}),
  K(.7,J(squat,{armR:{down:84,fwd:52,elbow:12,grip:0},armL:{down:70,fwd:30,elbow:50}})),K(1.05,J(squat,{armR:{down:84,fwd:58,elbow:8,grip:1},armL:{down:70,fwd:30,elbow:50}})),
  K(1.9,{armR:{down:78,fwd:58,elbow:92,twist:20,ftwist:30,grip:.8},head:[14,-12,0]}),K(2.6,{armR:{down:78,fwd:58,elbow:92,twist:20,ftwist:30,grip:.8},head:[14,-12,0]}),K(3.2,{})],
  tick:c=>{const w=c.P.item,h=c.P.itemH,g=c.t>=1.05&&c.t<3;w.visible=!g;h.visible=g;w.position.set(-.2,.05,.46);h.position.set(0,.03,.03);w.rotation.y=c.time;}},
 sentar:{nome:'Sentar',dur:2.2,loop:false,props:['log@world'],keys:[K(0,{}),K(.9,J({root:[24,0,0],spine:[10,0,0],pz:-.2},legs({fwd:62,knee:78,out:6}),both({down:74,fwd:20,elbow:30}))),
  K(1.7,J({root:[-4,0,0],spine:[8,0,0],pz:-.4},legs({fwd:88,knee:86,out:8}),both({down:84,fwd:34,elbow:52,twist:18,ftwist:170,grip:.2}))),K(2.2,J({root:[-6,0,0],spine:[8,0,0],pz:-.4,head:[-4,10,0]},legs({fwd:88,knee:86,out:8}),both({down:84,fwd:34,elbow:52,twist:18,ftwist:170,grip:.2})))],
  tick:c=>{c.P.log.position.set(0,0,-.4);}},
 deitar:{nome:'Deitar',dur:3,loop:false,keys:[K(0,{}),K(.8,J(squat,both({down:70,fwd:-20,elbow:20}))),K(1.5,sitG),K(2.4,lie),K(3,lie)]},
 levantar:{nome:'Levantar',dur:3,loop:false,keys:[K(0,lie),K(.4,lie),K(1.2,sitG),K(1.9,J(squat,both({down:74,fwd:30,elbow:30}))),K(2.7,{}),K(3,{})]},
 morrer:{nome:'Morrer',dur:2.6,loop:false,keys:[K(0,{}),K(.22,{root:[-10,0,0],spine:[-18,10,0],head:[-20,0,0],armL:{down:30,fwd:-20,elbow:40,grip:0},armR:{down:40,fwd:-30,elbow:30,grip:0},legL:{fwd:10,knee:20},legR:{fwd:-10,knee:14}}),
  K(.8,{root:[10,0,4],spine:[20,0,6],head:[20,0,8],armL:{down:60,elbow:30,grip:0},armR:{down:66,elbow:24,grip:0},legL:{fwd:60,knee:124,out:8},legR:{fwd:14,knee:118,foot:40}}),
  K(1.6,{root:[-84,0,10],pz:-.5,spine:[-4,0,4],head:[10,24,0],armL:{down:34,elbow:26,ftwist:140,grip:.1},armR:{down:52,elbow:40,ftwist:140,grip:.1},legL:{fwd:10,knee:34,out:14,foot:26},legR:{fwd:0,knee:6,out:8,foot:30}}),
  K(2.6,{root:[-90,0,8],pz:-.5,spine:[0,0,3],head:[12,30,0],armL:{down:30,elbow:22,ftwist:140,grip:.1},armR:{down:52,elbow:38,ftwist:140,grip:.1},legL:{fwd:8,knee:30,out:14,foot:30},legR:{fwd:0,knee:5,out:8,foot:32}})]},
 cumprimentar:{nome:'Cumprimentar',dur:2.8,loop:true,fn:(ph,t)=>{const e=Math.min(1,ph*5,(1-ph)*5),w=sin(ph*TAU*5);return {head:[-3*e,8*e,6*e],spine:[0,4*e,-2*e],
  armR:{down:72-78*e,twist:10-100*e,elbow:16+(64+22*w)*e,ftwist:80+10*e,grip:.3-.3*e},armL:{down:72,elbow:16}};}},
 tocha:{nome:'Segurar tocha',dur:5,loop:true,props:['torch@L'],fn:ph=>{const b=sin(ph*TAU);return {head:[-2,22*b,0],spine:[1,8*b,0],armL:{down:80,fwd:66+3*b,elbow:58,twist:4,ftwist:90,grip:1},armR:{down:70,fwd:6,elbow:24},legL:{fwd:8,knee:8},legR:{fwd:-6,knee:6,twist:12}};},
  tick:c=>flick(c.P.torch.userData.f,c.time,1)},
 espada1:{nome:'Espada: combo de 3 golpes',dur:3,loop:true,props:['sword@R'],keys:[K(0,J(stance,{armR:swordR,armL:offL})),
  K(.3,J(stance,{spine:[0,-32,0],armR:{down:-26,across:-22,twist:-70,elbow:98,ftwist:90,grip:1},armL:{down:60,fwd:40,elbow:50}})),
  K(.5,J(stance,{spine:[14,34,0],root:[8,-6,0],armR:{down:56,across:98,twist:20,elbow:18,ftwist:100,grip:1},armL:{down:60,fwd:-20,elbow:40}})),
  K(.85,J(stance,{spine:[8,30,0],root:[6,-8,0],armR:{down:8,across:124,twist:30,elbow:72,ftwist:90,grip:1},armL:{down:62,fwd:-10,elbow:40}})),
  K(1.05,J(stance,{spine:[4,-34,0],root:[4,-30,0],armR:{down:4,across:-26,twist:0,elbow:8,ftwist:90,grip:1},armL:{down:56,fwd:30,elbow:60}})),
  K(1.55,J(stance,{spine:[-10,-6,0],root:[0,-18,0],armR:{down:88,fwd:176,twist:0,elbow:104,ftwist:90,grip:1},armL:{down:60,fwd:60,elbow:50},legL:{fwd:20,knee:22,out:6}})),
  K(1.75,J(stance,{spine:[30,4,0],root:[14,-16,0],armR:{down:88,fwd:52,twist:0,elbow:8,ftwist:90,wristIn:30,grip:1},armL:{down:66,fwd:-30,elbow:40},legL:{fwd:44,knee:56,out:6}})),
  K(2.3,J(stance,{armR:swordR,armL:offL})),K(3,J(stance,{armR:swordR,armL:offL}))]},
 espada2:{nome:'Espada: estocada e giro',dur:2.6,loop:true,props:['sword@R'],keys:[K(0,J(stance,{armR:swordR,armL:offL})),
  K(.35,J(stance,{spine:[2,-24,0],armR:{down:82,fwd:-24,elbow:112,ftwist:90,wristIn:40,grip:1},armL:{down:70,fwd:60,elbow:30}})),
  K(.52,J(stance,{root:[12,-10,0],spine:[10,22,0],armR:{down:86,fwd:88,elbow:2,ftwist:90,wristIn:62,grip:1},armL:{down:60,fwd:-40,elbow:30},legL:{fwd:52,knee:62,out:6},legR:{fwd:-30,knee:10,out:10,twist:24,foot:20}})),
  K(1,J(stance,{armR:{down:6,across:28,elbow:14,ftwist:90,grip:1},armL:offL})),
  K(1.6,J(stance,{root:[4,-382,0],spine:[4,-20,0],armR:{down:6,across:-10,elbow:10,ftwist:90,grip:1},armL:{down:50,fwd:10,elbow:50},legL:{fwd:20,knee:26,out:8}}),true),
  K(2.1,J(stance,{root:[4,-382,0],armR:swordR,armL:offL})),K(2.6,J(stance,{root:[4,-382,0],armR:swordR,armL:offL}))]},
 escudo:{nome:'Defender com escudo',dur:2.4,loop:true,props:['shield@L','sword@R'],fn:ph=>{const hit=Math.max(0,sin(ph*TAU*2)),k=Math.pow(hit,6);return J(stance,{root:[8+3*k,-12,0],spine:[10+4*k,4,0],head:[-6,14,0],pz:-.03*k,
  armL:{down:62,fwd:40-6*k,elbow:104+6*k,twist:48,ftwist:90,grip:1,shrug:6},armR:{down:74,fwd:-12,elbow:70,twist:6,ftwist:90,grip:1},legL:{fwd:34+3*k,knee:42+6*k,out:6},legR:{fwd:-20,knee:30+4*k,out:10,twist:24,foot:10}});}},
 escudoGolpe:{nome:'Escudo: empurrão',dur:1.8,loop:true,props:['shield@L','sword@R'],keys:[K(0,J(stance,{armL:shieldL,armR:swordR})),K(.35,J(stance,{root:[2,-30,0],spine:[2,-14,0],armL:{down:66,fwd:8,elbow:112,twist:60,ftwist:90,grip:1},armR:swordR})),
  K(.52,J(stance,{root:[14,-2,0],spine:[12,16,0],armL:{down:70,fwd:84,elbow:38,twist:56,ftwist:90,grip:1},armR:{down:70,fwd:-30,elbow:60,ftwist:90,grip:1},legL:{fwd:48,knee:56,out:6},legR:{fwd:-28,knee:12,out:10,twist:24,foot:18}})),
  K(1.1,J(stance,{armL:shieldL,armR:swordR})),K(1.8,J(stance,{armL:shieldL,armR:swordR}))]},
 martelar:{nome:'Martelar',dur:1.5,loop:true,props:['hammer@R','anvil@world'],fn:ph=>{const p=(ph*2)%1,up=p<.55?sin(p/.55*PI/2):Math.max(0,1-(p-.55)/.13),hit=p>.68?Math.exp(-(p-.68)*14):0;return {root:[16-4*up,-6,0],spine:[14-8*up,-4,0],head:[-8,-4,0],
  armR:{down:84,fwd:38+88*up,elbow:26+78*up,twist:6,ftwist:90,wristIn:20-20*up,grip:1},armL:{down:76,fwd:44,elbow:36,twist:20,ftwist:150,grip:.2},legL:{fwd:14,knee:16,out:8},legR:{fwd:-8,knee:12,out:10,twist:14},lift:-.005*hit};}},
 marteloPesado:{nome:'Martelo: golpe pesado',dur:2.2,loop:true,props:['hammer@R'],keys:[K(0,J(stance,{armR:swordR,armL:offL})),
  K(.6,{root:[-8,0,0],spine:[-14,0,0],head:[6,0,0],armR:{down:88,fwd:172,elbow:92,ftwist:90,grip:1},armL:{down:88,fwd:166,elbow:104,twist:20,ftwist:90,grip:.8},legL:{fwd:10,knee:14,out:10},legR:{fwd:-6,knee:10,out:10}}),
  K(.8,{root:[38,0,0],spine:[30,0,0],head:[-24,0,0],armR:{down:88,fwd:48,elbow:6,ftwist:90,wristIn:30,grip:1},armL:{down:88,fwd:52,elbow:20,twist:20,ftwist:90,grip:.8},legL:{fwd:64,knee:86,out:14,foot:-14},legR:{fwd:64,knee:86,out:14,foot:-14}}),
  K(1.3,{root:[34,0,0],spine:[26,0,0],head:[-20,0,0],armR:{down:88,fwd:50,elbow:10,ftwist:90,wristIn:30,grip:1},armL:{down:88,fwd:52,elbow:22,twist:20,ftwist:90,grip:.8},legL:{fwd:60,knee:82,out:14,foot:-14},legR:{fwd:60,knee:82,out:14,foot:-14}}),K(2.2,J(stance,{armR:swordR,armL:offL}))]},
 arco:{nome:'Arco e flecha (pega a flecha)',dur:5.4,loop:true,props:['bow@L','quiver@back','arrowH@R','arrow@world'],keys:[K(0,J(bowAim,{armL:{down:70,elbow:20,ftwist:60,grip:1}})),
  K(.6,J(bowAim,{armL:{down:36,across:54,elbow:56,twist:0,ftwist:20,grip:1}})),
  K(1.2,J(bowAim,{head:[4,40,0],armL:{down:36,across:54,elbow:56,twist:0,ftwist:20,grip:1},armR:{down:-54,across:6,twist:-84,elbow:138,ftwist:60,grip:.2}})),
  K(1.55,J(bowAim,{head:[4,40,0],armL:{down:36,across:54,elbow:56,twist:0,ftwist:20,grip:1},armR:{down:-58,across:6,twist:-84,elbow:142,ftwist:60,grip:1}})),
  K(2.4,J(bowAim,{head:[10,56,0],armL:{down:36,across:54,elbow:56,twist:0,ftwist:20,grip:1},armR:{down:42,across:104,twist:12,elbow:66,ftwist:90,grip:1}})),
  K(3,J(bowAim,{armL:bowUp,armR:{down:0,across:150,twist:0,elbow:22,ftwist:90,grip:.85}})),
  K(3.8,J(bowAim,{spine:[0,-10,0],armL:bowUp,armR:drawFull})),K(4.3,J(bowAim,{spine:[0,-10,0],armL:bowUp,armR:drawFull})),
  K(4.38,J(bowAim,{spine:[0,-12,0],armL:bowUp,armR:{down:-5,across:-14,twist:0,elbow:140,ftwist:90,grip:0}}),true),
  K(4.9,J(bowAim,{armL:bowUp,armR:{down:20,across:-10,elbow:100,ftwist:90,grip:.2}})),K(5.4,J(bowAim,{armL:{down:70,elbow:20,ftwist:60,grip:1}}))],
  tick:c=>{bowTick(c,2.4,3,4.3);const a=c.P.arrowH;a.visible=c.t>=1.55&&c.t<2.4;a.position.set(0,-.3,0);a.rotation.set(0,0,Math.PI/2);}},
 arcoRapido:{nome:'Arco: tiro rápido',dur:1.7,loop:true,props:['bow@L','quiver@back','arrow@world'],keys:[K(0,J(bowAim,{armL:bowUp,armR:{down:0,across:150,elbow:22,ftwist:90,grip:.85}})),
  K(.55,J(bowAim,{spine:[0,-10,0],armL:bowUp,armR:drawFull})),K(.8,J(bowAim,{spine:[0,-10,0],armL:bowUp,armR:drawFull})),
  K(.88,J(bowAim,{armL:bowUp,armR:{down:-5,across:-14,elbow:140,ftwist:90,grip:0}}),true),K(1.3,J(bowAim,{armL:bowUp,armR:{down:20,across:60,elbow:80,ftwist:90,grip:.3}})),K(1.7,J(bowAim,{armL:bowUp,armR:{down:0,across:150,elbow:22,ftwist:90,grip:.85}}))],
  tick:c=>bowTick(c,0,0,.8)},
 magia1:{nome:'Magia: projétil',dur:2.4,loop:true,props:['orb@world'],keys:[K(0,{}),
  K(.7,{root:[2,-14,0],spine:[6,-8,0],head:[-2,14,0],armR:{down:74,fwd:34,elbow:104,twist:34,ftwist:60,grip:.1},armL:{down:74,fwd:34,elbow:104,twist:34,ftwist:60,grip:.1},legL:{fwd:14,knee:18},legR:{fwd:-10,knee:14,twist:14}}),
  K(1.1,{root:[0,-22,0],spine:[2,-18,0],head:[-2,26,0],armR:{down:78,fwd:20,elbow:118,twist:20,ftwist:60,grip:.1},armL:{down:74,fwd:40,elbow:96,twist:38,ftwist:60,grip:.1},legL:{fwd:16,knee:20},legR:{fwd:-12,knee:16,twist:14}}),
  K(1.28,{root:[10,6,0],spine:[10,24,0],head:[-6,-20,0],armR:{down:86,fwd:90,elbow:2,ftwist:150,wrist:-60,grip:0},armL:{down:60,fwd:-34,elbow:40,grip:.4},legL:{fwd:36,knee:44},legR:{fwd:-22,knee:10,twist:14,foot:16}}),
  K(1.8,{root:[8,4,0],spine:[8,20,0],head:[-4,-16,0],armR:{down:86,fwd:86,elbow:6,ftwist:150,wrist:-50,grip:0},armL:{down:62,fwd:-30,elbow:40,grip:.4},legL:{fwd:34,knee:42},legR:{fwd:-20,knee:10,twist:14,foot:14}}),K(2.4,{})],
  tick:c=>{const o=c.P.orb,t=c.t,s=c.st||(c.st={});if(t<1.2){const a=c.pos(c.H.L,V(c,0,0,0)),b=c.pos(c.H.R,V(c,0,0,0));o.position.copy(a).add(b).multiplyScalar(.5);o.scale.setScalar(.2+1.1*c.ramp(.3,1.1,t));o.visible=t>.3;s.p=null;}
   else{if(!s.p)s.p=c.pos(c.H.R,V(c,0,0,0)).clone();o.visible=t<2;o.position.copy(s.p);o.position.z+=.15+(t-1.2)*10;o.scale.setScalar(1.4*(1-c.ramp(1.8,2,t)));}o.rotation.y=c.time*5;}},
 magia2:{nome:'Magia: explosão em área',dur:3,loop:true,props:['ringFx@world','orb@world'],keys:[K(0,{}),
  K(.8,J(squat,{root:[26,0,0],armL:{down:84,fwd:30,elbow:20,ftwist:170,grip:0},armR:{down:84,fwd:30,elbow:20,ftwist:170,grip:0}})),
  K(1.2,{ground:0,lift:.22,root:[-10,0,0],spine:[-16,0,0],head:[14,0,0],armL:{down:60,fwd:168,elbow:10,ftwist:60,grip:0},armR:{down:60,fwd:168,elbow:10,ftwist:60,grip:0},legL:{fwd:14,knee:30,foot:40},legR:{fwd:-6,knee:12,foot:44}}),
  K(1.9,{ground:0,lift:.26,root:[-8,0,0],spine:[-14,0,0],head:[12,0,0],armL:{down:40,fwd:150,elbow:14,ftwist:60,grip:0},armR:{down:40,fwd:150,elbow:14,ftwist:60,grip:0},legL:{fwd:16,knee:32,foot:40},legR:{fwd:-6,knee:12,foot:44}}),
  K(2.4,J({root:[10,0,0]},legs({fwd:30,knee:50,foot:-8}),both({down:64,fwd:10,elbow:30}))),K(3,{})],
  tick:c=>{const r=c.P.ringFx,o=c.P.orb,t=c.t,k=c.ramp(1.15,2.1,t);r.visible=t>1.15&&t<2.2;r.scale.setScalar(.2+3.2*k);r.children[0].material.opacity=.8*(1-k);
   o.visible=t>.4&&t<1.9;const a=c.pos(c.H.L,V(c,0,0,0)),b=c.pos(c.H.R,V(c,0,0,0));o.position.copy(a).add(b).multiplyScalar(.5);o.position.y+=.12;o.scale.setScalar(.5+1.6*c.ramp(.4,1.2,t)-2*c.ramp(1.6,1.9,t));}},
 magia3:{nome:'Magia: canalizar',dur:3,loop:true,props:['orb@world'],fn:ph=>{const b=sin(ph*TAU),b2=sin(ph*TAU*2);return {root:[-2,0,0],spine:[-4+2*b,0,2*b2],head:[4,0,0],
  armL:{down:74,fwd:62+4*b,elbow:44,twist:26,ftwist:20,grip:.05},armR:{down:74,fwd:62+4*b,elbow:44,twist:26,ftwist:20,grip:.05},legL:{fwd:6,knee:8,out:8},legR:{fwd:-4,knee:6,out:8}};},
  tick:c=>{const o=c.P.orb,a=c.pos(c.H.L,V(c,0,0,0)),b=c.pos(c.H.R,V(c,0,0,0));o.visible=true;o.position.copy(a).add(b).multiplyScalar(.5);o.position.y+=.16+.03*sin(c.time*3);o.scale.setScalar(1.5+.25*sin(c.time*6));o.rotation.y=c.time*4;}},
 lanca:{nome:'Lançar lança',dur:2.6,loop:true,props:['spear@R','spearFly@world'],keys:[K(0,J(stance,{armR:{down:-8,across:-6,twist:-90,elbow:92,ftwist:180,grip:1},armL:{down:40,across:70,elbow:20,grip:.2}})),
  K(.7,J(stance,{root:[-6,-44,0],spine:[-8,-34,0],head:[0,62,0],armR:{down:-4,across:-40,twist:-96,elbow:74,ftwist:180,grip:1},armL:{down:24,across:74,elbow:12,grip:.2},legL:{fwd:30,knee:26,out:6},legR:{fwd:-18,knee:34,out:10,twist:24,foot:8}})),
  K(.92,J(stance,{root:[16,4,0],spine:[16,30,0],head:[-10,-24,0],armR:{down:10,across:84,twist:-40,elbow:16,ftwist:180,grip:0},armL:{down:64,fwd:-30,elbow:50},legL:{fwd:46,knee:54,out:6},legR:{fwd:-30,knee:12,out:10,twist:24,foot:22}}),true),
  K(1.5,J(stance,{root:[14,2,0],spine:[12,24,0],head:[-8,-18,0],armR:{down:50,across:90,twist:0,elbow:20,grip:.2},armL:{down:64,fwd:-24,elbow:50},legL:{fwd:42,knee:50,out:6}})),
  K(2.2,J(stance,{armR:{down:-8,across:-6,twist:-90,elbow:92,ftwist:180,grip:1},armL:{down:40,across:70,elbow:20,grip:.2}})),K(2.6,J(stance,{armR:{down:-8,across:-6,twist:-90,elbow:92,ftwist:180,grip:1},armL:{down:40,across:70,elbow:20,grip:.2}}))],
  tick:c=>{const s=c.P.spear,f=c.P.spearFly,t=c.t,st=c.st2||(c.st2={});const fl=t>=.9&&t<1.9;s.visible=!fl;f.visible=fl&&t<1.7;if(!fl)st.p=null;else{if(!st.p)st.p=c.pos(c.H.R,V(c,0,0,0)).clone();const d=V(c,0,.1,1).normalize();f.position.copy(st.p).addScaledVector(d,(t-.9)*22);f.quaternion.setFromUnitVectors(V(c,0,1,0),d);}}},
 lancaEstocada:{nome:'Lança: estocada',dur:1.7,loop:true,props:['spear@R'],keys:[K(0,J(stance,{armR:{down:80,fwd:-8,elbow:30,twist:6,ftwist:90,wristIn:8,grip:1},armL:offL})),
  K(.4,J(stance,{root:[0,-34,0],spine:[0,-14,0],armR:{down:80,fwd:-40,elbow:58,twist:6,ftwist:90,wristIn:-14,grip:1},armL:{down:66,fwd:50,elbow:30}})),
  K(.56,J(stance,{root:[14,-4,0],spine:[12,18,0],armR:{down:84,fwd:46,elbow:4,twist:6,ftwist:90,wristIn:44,grip:1},armL:{down:62,fwd:-36,elbow:40},legL:{fwd:52,knee:60,out:6},legR:{fwd:-30,knee:10,out:10,twist:24,foot:20}})),
  K(1.1,J(stance,{armR:{down:80,fwd:-8,elbow:30,twist:6,ftwist:90,wristIn:8,grip:1},armL:offL})),K(1.7,J(stance,{armR:{down:80,fwd:-8,elbow:30,twist:6,ftwist:90,wristIn:8,grip:1},armL:offL}))]},
 fogueira:{nome:'Acender fogueira',dur:6,loop:true,props:['campfire@world'],fn:(ph,t)=>{const T=ph*6,e=Math.min(1,T/.8,(6-T)/.6),lit=T>3.2?1:0,st=sin(T*13)*(T>.9&&T<3.2?1:0),w=T>3.4?Math.min(1,(T-3.4)/.6):0;
  const p={root:[14-10*w,0,0],spine:[20-12*w,0,0],head:[-10+8*w,0,0],legL:{fwd:92,knee:96,out:8},legR:{fwd:-4,knee:104,out:6,foot:42},
   armR:{down:82,fwd:46+6*st+10*w,elbow:44-14*st-16*w,twist:28-10*w,ftwist:90+60*w,grip:.9-.9*w},armL:{down:82,fwd:44+10*w,elbow:40-12*w,twist:30-12*w,ftwist:90+60*w,grip:.9-.9*w}};
  const o={};for(const k in p){const v=p[k];if(Array.isArray(v))o[k]=v.map((x,i)=>BASE[k][i]+(x-BASE[k][i])*e);else{o[k]={};for(const q in v){const b0=(k[0]==='a'?armB:legB)[q];o[k][q]=b0+(v[q]-b0)*e;}}}return o;},
  tick:c=>{const u=c.P.campfire.userData,T=c.t,k=c.ramp(3.2,3.9,T)*(1-c.ramp(5.7,6,T));flick(u.f,c.time,Math.max(.001,k));u.l.intensity=1.6*k;}},
 bau:{nome:'Abrir baú',dur:3.4,loop:false,props:['chest@world'],keys:[K(0,{}),K(.8,J(squat,both({down:84,fwd:60,elbow:36,twist:14,ftwist:170,grip:.5}))),K(1.5,J(squat,{root:[14,0,0],spine:[8,0,0]},both({down:84,fwd:92,elbow:26,twist:14,ftwist:170,grip:.3}))),
  K(2.3,J(squat,{root:[20,0,0],head:[6,0,0]},both({down:80,fwd:50,elbow:60,twist:20,grip:.3}))),K(3.4,J(squat,{root:[20,0,0],head:[8,6,0]},both({down:80,fwd:50,elbow:60,twist:20,grip:.3})))],
  tick:c=>{const u=c.P.chest.userData,k=c.ramp(.85,1.5,c.t);u.lid.rotation.x=-1.9*k*k*(3-2*k);u.gl.visible=k>.5;}},
 bauFechar:{nome:'Fechar baú',dur:2.6,loop:false,props:['chest@world'],keys:[K(0,J(squat,{root:[20,0,0]},both({down:80,fwd:50,elbow:60,twist:20,grip:.3}))),K(.7,J(squat,{root:[14,0,0],spine:[8,0,0]},both({down:84,fwd:92,elbow:26,twist:14,ftwist:170,grip:.3}))),
  K(1.3,J(squat,both({down:84,fwd:60,elbow:36,twist:14,ftwist:170,grip:.5}))),K(2.2,{}),K(2.6,{})],
  tick:c=>{const u=c.P.chest.userData,k=1-c.ramp(.7,1.3,c.t);u.lid.rotation.x=-1.9*k*k*(3-2*k);u.gl.visible=k>.5;}},
 porta:{nome:'Abrir porta',dur:2.6,loop:false,props:['door@world'],keys:[K(0,{}),K(.6,{spine:[6,6,0],armR:{down:84,fwd:64,elbow:30,twist:10,ftwist:90,grip:.2}}),K(.9,{spine:[6,6,0],armR:{down:84,fwd:64,elbow:30,twist:10,ftwist:90,grip:1}}),
  K(1.6,{root:[8,8,0],spine:[10,10,0],pz:.12,armR:{down:80,fwd:78,elbow:6,twist:0,ftwist:90,grip:.6},legL:{fwd:24,knee:22},legR:{fwd:-16,knee:8,foot:14}}),K(2.2,{pz:.12,legL:{fwd:6},legR:{fwd:-4}}),K(2.6,{pz:.12})],
  tick:c=>{const k=c.ramp(.95,1.7,c.t);c.P.door.userData.d.rotation.y=1.45*k*k*(3-2*k);}},
 portaFechar:{nome:'Fechar porta',dur:2.6,loop:false,props:['door@world'],keys:[K(0,{pz:.12}),K(.7,{root:[10,8,0],spine:[12,10,0],pz:.16,armR:{down:80,fwd:82,elbow:4,ftwist:90,grip:.2},legL:{fwd:26,knee:24},legR:{fwd:-16,knee:8,foot:14}}),
  K(.95,{root:[10,8,0],spine:[12,10,0],pz:.16,armR:{down:80,fwd:82,elbow:4,ftwist:90,grip:1},legL:{fwd:26,knee:24},legR:{fwd:-16,knee:8,foot:14}}),K(1.8,{spine:[4,4,0],armR:{down:84,fwd:60,elbow:40,twist:10,ftwist:90,grip:1}}),K(2.2,{}),K(2.6,{})],
  tick:c=>{const k=1-c.ramp(.95,1.8,c.t);c.P.door.userData.d.rotation.y=1.45*k*k*(3-2*k);}},
 janela:{nome:'Abrir janela',dur:2.6,loop:false,props:['window@world'],keys:[K(0,{}),K(.7,J({spine:[6,0,0]},both({down:66,fwd:74,elbow:64,twist:34,ftwist:150,wrist:-40,grip:0}))),K(1.5,J({root:[6,0,0],spine:[10,0,0]},both({down:34,fwd:70,elbow:10,twist:0,ftwist:150,wrist:-40,grip:0}))),
  K(2.1,J({head:[-6,0,0]},both({down:60,fwd:20,elbow:30}))),K(2.6,{})],
  tick:c=>{const u=c.P.window.userData,k=c.ramp(.75,1.5,c.t),a=1.75*k*k*(3-2*k);u.l.rotation.y=a;u.r.rotation.y=-a;}},
 janelaFechar:{nome:'Fechar janela',dur:2.6,loop:false,props:['window@world'],keys:[K(0,{}),K(.7,J({root:[6,0,0],spine:[10,0,0]},both({down:30,fwd:74,elbow:8,twist:0,ftwist:60,grip:.6}))),K(1.5,J({spine:[6,0,0]},both({down:66,fwd:74,elbow:66,twist:34,ftwist:60,grip:.6}))),K(2.1,{}),K(2.6,{})],
  tick:c=>{const u=c.P.window.userData,k=1-c.ramp(.75,1.5,c.t),a=1.75*k*k*(3-2*k);u.l.rotation.y=a;u.r.rotation.y=-a;}},
 escalar:{nome:'Escalar',dur:1.5,loop:true,props:['ladder@world'],fn:ph=>{const a=ph*TAU,s=sin(a),c=cos(a),u=x=>.5+.5*x;const arm=k=>({down:88,fwd:104+52*u(k),elbow:92-62*u(k),twist:4,ftwist:120,grip:1}),leg=k=>({fwd:20+62*u(k),knee:26+82*u(k),out:8,foot:-6});
  return {ground:0,lift:.3+.02*sin(a*2),root:[6,0,3*c],spine:[4,5*s,0],head:[-24,0,0],armL:arm(s),armR:arm(-s),legL:leg(-s),legR:leg(s)};},
  tick:c=>{c.P.ladder.userData.rg.position.y=-((c.ph*2)%1)*.3-.3;}},
 escada:{nome:'Subir escada',dur:1.1,loop:true,props:['stairs@world'],fn:ph=>gait(ph,G.stairs),
  tick:c=>{const st=c.P.stairs.userData.st,f=(c.ph*2)%1;st.forEach((b,i)=>{const k=i-3-f;b.position.set(0,k*.2-.1,k*.3+.12);});}},
 pescar:{nome:'Pescar',dur:7,loop:true,props:['rod@R','pond@world'],keys:[K(0,{armR:{down:84,fwd:40,elbow:60,ftwist:90,grip:1}}),
  K(.6,{root:[-6,-10,0],spine:[-10,-10,0],armR:{down:88,fwd:150,elbow:84,ftwist:90,grip:1},armL:{down:64,fwd:30,elbow:30}}),
  K(.85,{root:[10,6,0],spine:[12,10,0],armR:{down:86,fwd:64,elbow:12,ftwist:90,wristIn:20,grip:1},armL:{down:66,fwd:-20,elbow:30},legL:{fwd:20,knee:20},legR:{fwd:-12,knee:8}}),
  K(1.6,{armR:{down:84,fwd:44,elbow:52,twist:10,ftwist:90,grip:1},armL:{down:76,fwd:30,elbow:70,twist:40,grip:.8},legL:{fwd:10,knee:8},legR:{fwd:-8,knee:6,twist:10}}),
  K(4.4,{head:[4,-6,0],armR:{down:84,fwd:46,elbow:50,twist:10,ftwist:90,grip:1},armL:{down:76,fwd:30,elbow:70,twist:40,grip:.8},legL:{fwd:10,knee:8},legR:{fwd:-8,knee:6,twist:10}}),
  K(4.65,{root:[-8,0,0],spine:[-12,0,0],armR:{down:86,fwd:96,elbow:92,twist:6,ftwist:90,grip:1},armL:{down:80,fwd:60,elbow:80,twist:40,grip:.9},legL:{fwd:14,knee:16},legR:{fwd:-10,knee:14,twist:10}}),
  K(6.2,{root:[-10,0,0],spine:[-14,0,0],armR:{down:86,fwd:104,elbow:98,twist:6,ftwist:90,grip:1},armL:{down:80,fwd:64,elbow:84,twist:40,grip:.9},legL:{fwd:14,knee:16},legR:{fwd:-10,knee:14,twist:10}}),K(7,{armR:{down:84,fwd:40,elbow:60,ftwist:90,grip:1}})],
  tick:c=>{const pd=c.P.pond,u=pd.userData,t=c.t,tip=V(c,0,0,0);c.P.rod.userData.tip.getWorldPosition(tip);pd.worldToLocal(tip);
   const k=c.ramp(.8,1.5,t),r=c.ramp(4.6,6.4,t),b=u.bob.position;if(t<.8||t>6.6){b.copy(tip);b.y-=.5;}else{b.set(-.25*(1-k)+tip.x*(1-k),(tip.y)*(1-k)+.04+1.1*sin(k*PI)*(1-k*.2),tip.z*(1-k));b.z+=-2.2*r;b.y+=(t>4.3&&t<4.7?-.06:0)+.012*sin(c.time*4)+.9*r*r;}
   c.setLine(u.ln,[tip,b]);}}
};
