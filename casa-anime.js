/* Casa no estilo anime (Mondstadt, Genshin Impact) — com texturas e interior.
   - Paredes ocas com aberturas reais: porta que abre para dentro e janelas
     com vidro e venezianas de madeira que abrem para fora (tecla E ou botão
     "Interagir" perto delas).
   - Texturas pintadas: reboco, madeira, telhas e pedra.
   - Interior: tapete, mesa com cadeiras e lampião, cama, estante com livros,
     lareira acesa, baú e planta.
   - Ao entrar, o telhado e o andar de cima somem e a câmera mostra o cômodo
     por cima; ao sair, tudo volta.
   - Paredes, porta fechada e móveis bloqueiam o personagem; o piso é chão. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;

let seed=913;
const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

// ---------- Texturas pintadas (canvas) ----------
function canvasTex(size,draw){
 const c=document.createElement('canvas');c.width=c.height=size;
 draw(c.getContext('2d'),size);
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;
 return t;
}
const TEX={
 plaster:canvasTex(256,(g,s)=>{
  g.fillStyle='#efe1c3';g.fillRect(0,0,s,s);
  for(let i=0;i<900;i++){g.fillStyle=`rgba(${150+rnd()*60},${120+rnd()*50},${80+rnd()*40},${.05+rnd()*.08})`;g.beginPath();g.arc(rnd()*s,rnd()*s,1+rnd()*5,0,6.3);g.fill();}
  g.strokeStyle='rgba(120,95,70,.18)';g.lineWidth=1;
  for(let i=0;i<6;i++){g.beginPath();let x=rnd()*s,y=rnd()*s;g.moveTo(x,y);for(let k=0;k<5;k++){x+=(rnd()-.5)*30;y+=rnd()*20;g.lineTo(x,y);}g.stroke();}
 }),
 wood:canvasTex(256,(g,s)=>{
  const planks=4;
  for(let p=0;p<planks;p++){
   const x=p*s/planks,l=30+rnd()*10;
   g.fillStyle=`hsl(26,${38+rnd()*10}%,${l}%)`;g.fillRect(x,0,s/planks,s);
   g.strokeStyle='rgba(40,22,10,.25)';g.lineWidth=1.2;
   for(let k=0;k<7;k++){g.beginPath();const gx=x+4+rnd()*(s/planks-8);g.moveTo(gx,0);g.bezierCurveTo(gx+(rnd()-.5)*10,s*.3,gx+(rnd()-.5)*10,s*.7,gx+(rnd()-.5)*6,s);g.stroke();}
   g.fillStyle='rgba(25,12,5,.6)';g.fillRect(x,0,2,s);
  }
 }),
 floor:canvasTex(256,(g,s)=>{
  const rows=6;
  for(let r=0;r<rows;r++){
   const y=r*s/rows;let x=-rnd()*80;
   while(x<s){const w=60+rnd()*90;g.fillStyle=`hsl(30,${34+rnd()*10}%,${36+rnd()*12}%)`;g.fillRect(x,y,w,s/rows);g.fillStyle='rgba(30,15,5,.55)';g.fillRect(x,y,2,s/rows);x+=w;}
   g.fillStyle='rgba(30,15,5,.6)';g.fillRect(0,y,s,2);
  }
 }),
 roof:canvasTex(256,(g,s)=>{
  g.fillStyle='#2d5791';g.fillRect(0,0,s,s);
  const rows=8,cols=8;
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
   const x=c*s/cols+(r%2?s/cols/2:0),y=r*s/rows;
   g.fillStyle=`hsl(214,${48+rnd()*10}%,${36+rnd()*10}%)`;
   g.beginPath();g.moveTo(x,y);g.lineTo(x+s/cols,y);g.lineTo(x+s/cols,y+s/rows*.7);
   g.quadraticCurveTo(x+s/cols/2,y+s/rows*1.15,x,y+s/rows*.7);g.closePath();g.fill();
   g.strokeStyle='rgba(15,30,60,.5)';g.lineWidth=2;g.stroke();
  }
 }),
 stone:canvasTex(256,(g,s)=>{
  g.fillStyle='#6f7177';g.fillRect(0,0,s,s);
  const rows=5;
  for(let r=0;r<rows;r++){let x=-rnd()*40;const y=r*s/rows;
   while(x<s){const w=40+rnd()*50,l=55+rnd()*15;g.fillStyle=`hsl(220,${6+rnd()*6}%,${l}%)`;
    g.beginPath();g.roundRect?g.roundRect(x+2,y+2,w-4,s/rows-4,6):g.rect(x+2,y+2,w-4,s/rows-4);g.fill();x+=w;}}
 }),
 rug:canvasTex(256,(g,s)=>{
  g.fillStyle='#9b3b3b';g.fillRect(0,0,s,s);g.strokeStyle='#e8c56a';g.lineWidth=10;g.strokeRect(14,14,s-28,s-28);
  g.lineWidth=4;g.strokeRect(34,34,s-68,s-68);g.fillStyle='#e8c56a';
  for(let i=0;i<5;i++){g.beginPath();g.arc(s/2,s/2,20+i*14,0,6.3);g.globalAlpha=.25;g.fill();}g.globalAlpha=1;
 })
};
function mat(color,map,extra){return new T.MeshStandardMaterial(Object.assign({color,map:map||null,roughness:1,metalness:0},extra||{}));}
const M={
 stone:mat('#ffffff',TEX.stone),plaster:mat('#ffffff',TEX.plaster),wood:mat('#8a6a52',TEX.wood),
 woodLight:mat('#c49a72',TEX.wood),floor:mat('#ffffff',TEX.floor),roof:mat('#ffffff',TEX.roof),
 roofDark:mat('#284a7e'),metal:mat('#3b3a40'),
 glass:mat('#b9e2f2',null,{transparent:true,opacity:.32,emissive:new T.Color('#ffcf7a'),emissiveIntensity:0,depthWrite:false}),
 lamp:mat('#ffe2a0',null,{emissive:new T.Color('#ffc766'),emissiveIntensity:.4}),
 fire:mat('#ff9a3c',null,{emissive:new T.Color('#ff7a1a'),emissiveIntensity:1.8}),
 cloth:mat('#3e78b8'),clothRed:mat('#b8453e'),white:mat('#f4efe6'),rug:mat('#ffffff',TEX.rug),
 flowerA:mat('#e8607a'),flowerB:mat('#f5c64a'),flowerC:mat('#c86be0'),leaf:mat('#5aa34a')
};
const outlineMat=new T.MeshBasicMaterial({color:'#2b2140',side:T.BackSide});

// UV proporcional ao tamanho real da caixa (a textura não estica).
function boxUV(geo,w,h,d,tile){
 const uv=geo.attributes.uv;
 const faces=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
 for(let f=0;f<6;f++)for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,uv.getX(i)*faces[f][0]/tile,uv.getY(i)*faces[f][1]/tile);}
 return geo;
}
function part(group,w,h,d,material,x,y,z,opts={}){
 const geo=opts.geo||boxUV(new T.BoxGeometry(w,h,d),w,h,d,opts.tile||1.6);
 const m=new T.Mesh(geo,material);m.position.set(x,y,z);
 if(opts.rot)m.rotation.set(opts.rot[0],opts.rot[1],opts.rot[2]);
 m.castShadow=opts.shadow!==false;m.receiveShadow=true;
 if(opts.outline!==false){const s=new T.Mesh(geo,outlineMat);s.scale.setScalar(opts.outlineScale||1.03);s.userData.animeOutline=true;m.add(s);}
 group.add(m);return m;
}

// ---------- Construção ----------
const W=5.6,D=4.6,F=.3,H1=2.8,H2=2.3,TH=.2,over=.35;
function buildHouse(state){
 const g=new T.Group();g.name='Casa anime estilo Mondstadt';
 const upper=new T.Group();upper.name='Andar de cima e telhado';g.add(upper);
 state.upper=upper;state.interactables=[];state.solids=[];
 // Base de pedra (o topo é o piso da casa).
 part(g,W+.5,1.6,D+.5,M.stone,0,F-.8,0,{tile:1.2});
 part(g,W-.1,.04,D-.1,M.floor,0,F+.02,0,{outline:false,tile:2,shadow:false});
 // Degrau da porta.
 part(g,1.7,.25,.8,M.stone,.9,.12,D/2+.55,{tile:1});

 // Parede com aberturas: comprimento len, girada rotY, centro (cx,cz).
 function wall(cx,cz,len,rotY,openings,name){
  const wg=new T.Group();wg.position.set(cx,F,cz);wg.rotation.y=rotY;wg.name=name;g.add(wg);
  (state.walls=state.walls||[]).push(wg);
  const ops=[...openings].sort((a,b)=>a.x0-b.x0);
  let cur=-len/2;
  for(const o of ops){
   if(o.x0>cur)part(wg,o.x0-cur,H1,TH,M.plaster,(cur+o.x0)/2,H1/2,0,{tile:1.8});
   if(o.y0>0)part(wg,o.x1-o.x0,o.y0,TH,M.plaster,(o.x0+o.x1)/2,o.y0/2,0,{tile:1.8});
   if(o.y1<H1)part(wg,o.x1-o.x0,H1-o.y1,TH,M.plaster,(o.x0+o.x1)/2,(o.y1+H1)/2,0,{tile:1.8});
   // Moldura de madeira.
   const ow=o.x1-o.x0,oh=o.y1-o.y0,mx=(o.x0+o.x1)/2,my=(o.y0+o.y1)/2;
   part(wg,ow+.24,.12,TH+.08,M.wood,mx,o.y1+.06,0,{outline:false});
   if(o.y0>0)part(wg,ow+.24,.1,TH+.14,M.wood,mx,o.y0-.05,0,{outline:false});
   for(const sx of [-1,1])part(wg,.12,oh,TH+.08,M.wood,mx+sx*(ow/2+.06),my,0,{outline:false});
   cur=o.x1;
  }
  if(cur<len/2)part(wg,len/2-cur,H1,TH,M.plaster,(cur+len/2)/2,H1/2,0,{tile:1.8});
  return wg;
 }
 // Janela com vidro e duas venezianas que abrem para fora.
 function windowIn(wg,o,label){
  const ow=o.x1-o.x0,oh=o.y1-o.y0,mx=(o.x0+o.x1)/2,my=(o.y0+o.y1)/2;
  part(wg,ow,oh,.03,M.glass,mx,my,0,{outline:false,shadow:false});
  part(wg,.05,oh,.06,M.wood,mx,my,0,{outline:false});
  const shutters=[];
  for(const side of [-1,1]){
   const hinge=new T.Group();hinge.position.set(side<0?o.x0:o.x1,my,TH/2+.04);wg.add(hinge);
   part(hinge,ow/2,oh,.05,M.cloth,-side*ow/4,0,0,{tile:.6});
   for(let k=0;k<4;k++)part(hinge,ow/2-.06,.04,.07,M.wood,-side*ow/4,-oh/2+.15+k*oh/4,0,{outline:false,shadow:false});
   shutters.push({hinge,side});
  }
  // Floreira embaixo.
  part(wg,ow+.2,.2,.3,M.woodLight,mx,o.y0-.2,TH/2+.17);
  const fl=[M.flowerA,M.flowerB,M.flowerC];
  for(let i=0;i<5;i++)part(wg,.16,.16,.16,fl[i%3],mx-ow/2+.15+i*(ow-.3)/4,o.y0-.02,TH/2+.17,{geo:new T.SphereGeometry(.09,8,6),outline:false,shadow:false});
  const it={label,kind:'window',open:false,anim:0,wg,local:new T.Vector3(mx,my,TH/2+.6),
   apply(t){for(const s of shutters)s.hinge.rotation.y=s.side<0?-2.7*t:2.7*t;}};
  state.interactables.push(it);
 }

 // Fachada (porta + janela), fundos, laterais.
 const doorOp={x0:.3,x1:1.5,y0:0,y1:2.1};
 const front=wall(0,D/2-TH/2,W,0,[doorOp,{x0:-1.9,x1:-.9,y0:.95,y1:2.0}],'Parede da frente');
 windowIn(front,{x0:-1.9,x1:-.9,y0:.95,y1:2.0},'janela da frente');
 const back=wall(0,-(D/2-TH/2),W,Math.PI,[{x0:-.5,x1:.5,y0:.95,y1:2.0}],'Parede dos fundos');
 windowIn(back,{x0:-.5,x1:.5,y0:.95,y1:2.0},'janela dos fundos');
 const right=wall(W/2-TH/2,0,D,Math.PI/2,[{x0:-.5,x1:.5,y0:.95,y1:2.0}],'Parede direita');
 windowIn(right,{x0:-.5,x1:.5,y0:.95,y1:2.0},'janela lateral');
 const left=wall(-(W/2-TH/2),0,D,-Math.PI/2,[{x0:-1.1,x1:-.1,y0:.95,y1:2.0}],'Parede esquerda');
 windowIn(left,{x0:-1.1,x1:-.1,y0:.95,y1:2.0},'janela lateral');

 // Porta (abre para dentro).
 {
  const hinge=new T.Group();hinge.position.set(doorOp.x0,F,D/2-TH/2);g.add(hinge);
  const w=doorOp.x1-doorOp.x0;
  part(hinge,w,2.08,.08,M.wood,w/2,1.04,0,{tile:1.2});
  for(const y of [.4,1.04,1.7])part(hinge,w-.1,.08,.11,M.woodLight,w/2,y,0,{outline:false});
  part(hinge,.1,.1,.18,M.metal,w-.15,1.0,0,{geo:new T.SphereGeometry(.06,8,6),outline:false});
  const it={label:'porta',kind:'door',open:false,anim:0,wg:g,local:new T.Vector3((doorOp.x0+doorOp.x1)/2,1,D/2+.4),
   apply(t){hinge.rotation.y=1.5*t;}};
  state.interactables.push(it);state.door=it;
 }

 // Vigas de madeira nos cantos (lado de fora).
 for(const sx of [-1,1])for(const sz of [-1,1])part(g,.22,H1,.22,M.wood,sx*W/2,F+H1/2,sz*D/2,{tile:1});
 part(g,W+.1,.18,.24,M.wood,0,F+H1-.09,D/2,{outline:false});

 // ---------- Andar de cima e telhado (somem quando se entra) ----------
 const y2=F+H1;
 part(upper,W+over*2,.24,D+over*2,M.wood,0,y2+.12,0,{tile:1.2});
 part(upper,W+over*2-.1,H2,D+over*2-.1,M.plaster,0,y2+.24+H2/2,0,{tile:1.8});
 for(const sx of [-1,1])for(const sz of [-1,1])part(upper,.2,H2,.2,M.wood,sx*(W/2+over-.05),y2+.24+H2/2,sz*(D/2+over-.05),{outline:false});
 const fz=D/2+over-.03;
 part(upper,W+over*2,.16,.14,M.wood,0,y2+.24+H2*.5,fz,{outline:false});
 for(const sx of [-1,1])part(upper,.14,1.25,.14,M.wood,sx*(W/2+over)*.62,y2+.24+H2*.27,fz,{rot:[0,0,sx*.75],outline:false});
 // Janelas falsas do andar de cima (acendem à noite).
 for(const sx of [-1.5,1.5]){
  part(upper,.95,1.0,.06,M.glass,sx,y2+.24+H2*.58,fz+.02,{outline:false,shadow:false});
  part(upper,1.1,.1,.12,M.wood,sx,y2+.24+H2*.58+.55,fz+.03,{outline:false});
  part(upper,1.1,.1,.12,M.wood,sx,y2+.24+H2*.58-.55,fz+.03,{outline:false});
 }
 const roofY=y2+.24+H2,roofH=2.1,roofW=(W+over*2)/2+.7,roofD=D+over*2+1.1;
 const slope=Math.atan2(roofH,roofW-.25),len=Math.hypot(roofW,roofH)+.15;
 for(const sx of [-1,1])part(upper,len,.26,roofD,M.roof,sx*roofW/2,roofY+roofH/2,0,{rot:[0,0,-sx*slope],tile:1.4});
 part(upper,.3,.3,roofD+.1,M.wood,0,roofY+roofH+.05,0);
 {
  const s=new T.Shape(),gw=W+over*2-.1;
  s.moveTo(-gw/2,0);s.lineTo(gw/2,0);s.lineTo(0,roofH-.1);s.lineTo(-gw/2,0);
  const gg=new T.ExtrudeGeometry(s,{depth:D+over*2-.2,bevelEnabled:false});gg.translate(0,0,-(D+over*2-.2)/2);
  part(upper,1,1,1,M.plaster,0,roofY,0,{geo:gg,outline:false});
 }
 part(upper,.7,1.9,.7,M.stone,-roofW*.45,roofY+roofH*.75,-.9,{tile:.8});
 part(upper,.85,.2,.85,M.stone,-roofW*.45,roofY+roofH*.75+1,-.9,{outline:false});

 // ---------- Interior ----------
 const inside=new T.Group();inside.name='Interior da casa';g.add(inside);
 const solid=(x,z,hw,hd)=>state.solids.push({x,z,hw,hd});
 part(inside,2.4,.02,1.7,M.rug,-.4,F+.045,.35,{outline:false,shadow:false,tile:2.4});
 // Mesa e cadeiras.
 part(inside,1.3,.07,.85,M.woodLight,-.6,F+.76,.35);
 for(const [lx,lz] of [[-.55,-.35],[.55,-.35],[-.55,.35],[.55,.35]])part(inside,.07,.72,.07,M.wood,-.6+lx*.95,F+.37,.35+lz*.95,{outline:false});
 solid(-.6,.35,.7,.48);
 for(const sx of [-1,1]){
  const cx=-.6+sx*1.0;
  part(inside,.45,.06,.45,M.wood,cx,F+.46,.35);
  part(inside,.06,.6,.45,M.wood,cx+sx*.2,F+.78,.35,{outline:false});
  for(const [lx,lz] of [[-.18,-.18],[.18,-.18],[-.18,.18],[.18,.18]])part(inside,.05,.44,.05,M.wood,cx+lx,F+.22,.35+lz,{outline:false});
 }
 // Lampião na mesa.
 part(inside,.2,.26,.2,M.lamp,-.6,F+.92,.35,{outline:false});
 // Cama.
 part(inside,1.05,.32,2.0,M.wood,1.95,F+.2,-1.0);
 part(inside,.98,.16,1.92,M.white,1.95,F+.43,-1.0,{outline:false});
 part(inside,1.0,.1,1.25,M.cloth,1.95,F+.53,-.6,{outline:false,tile:.8});
 part(inside,.6,.12,.35,M.white,1.95,F+.56,-1.75,{outline:false});
 part(inside,1.05,.9,.08,M.wood,1.95,F+.55,-2.0);
 solid(1.95,-1.0,.55,1.05);
 // Estante com livros.
 part(inside,1.2,2.0,.35,M.wood,-1.75,F+1.0,-2.0);
 const bookC=[M.cloth,M.clothRed,M.flowerB,M.leaf,M.flowerC];
 for(let sh=0;sh<4;sh++){
  part(inside,1.1,.04,.3,M.woodLight,-1.75,F+.25+sh*.48,-1.98,{outline:false,shadow:false});
  let bx=-2.25;
  while(bx<-1.3){const bw=.06+rnd()*.07,bh=.28+rnd()*.12;part(inside,bw,bh,.22,bookC[Math.floor(rnd()*5)],bx+bw/2,F+.27+sh*.48+bh/2,-1.95,{outline:false,shadow:false});bx+=bw+.01;}
 }
 solid(-1.75,-2.0,.62,.2);
 // Lareira na parede esquerda.
 part(inside,.6,1.3,1.2,M.stone,-2.45,F+.65,1.2,{tile:.9});
 part(inside,.5,.5,.7,M.metal,-2.25,F+.3,1.2,{outline:false});
 part(inside,.3,.3,.4,M.fire,-2.2,F+.25,1.2,{geo:new T.ConeGeometry(.2,.4,8),outline:false,shadow:false});
 solid(-2.45,1.2,.32,.62);
 // Baú, planta e quadro.
 part(inside,.8,.5,.45,M.woodLight,2.1,F+.25,.6);solid(2.1,.6,.42,.25);
 part(inside,.3,.35,.3,M.stone,.0,F+.18,1.85,{geo:new T.CylinderGeometry(.16,.12,.35,10)});
 part(inside,.5,.5,.5,M.leaf,.0,F+.55,1.85,{geo:new T.IcosahedronGeometry(.3,1),outline:false});
 // Luz interna quente.
 const light=new T.PointLight('#ffcf8a',.9,8,1.6);light.position.set(-.4,F+2.2,0);g.add(light);
 state.light=light;
 return g;
}

function findSpot(ground){
 const b=ground.bounds;
 let best=null;
 for(let r=12;r<=34&&!best;r+=2.5){
  for(let a=0;a<24;a++){
   const ang=a/24*Math.PI*2+r*.13;
   const x=Math.cos(ang)*r,z=Math.sin(ang)*r;
   if(x<b.x0+8||x>b.x1-8||z<b.z0+8||z>b.z1-8)continue;
   if(!ground.isOpen(x,z,4))continue;
   if(ground.greenAt(x,z)<.01)continue;
   let lo=Infinity,hi=-Infinity;
   for(const dx of [-3.5,0,3.5])for(const dz of [-3,0,3]){
    const h=ground.heightAt(x+dx,z+dz);lo=Math.min(lo,h);hi=Math.max(hi,h);
   }
   if(hi-lo>.9)continue;
   // O piso fica acima do ponto mais alto do terreno sob a casa.
   best={x,z,y:hi-.05};break;
  }
 }
 return best;
}

function install(){
 const api=window.arcanoWaterV1226,ground=window.arcanoAnimeGround;
 if(!api||!api.scene||!ground){setTimeout(install,300);return;}
 const spot=findSpot(ground);
 if(!spot){console.warn('[Casa anime] sem espaço plano disponível');return;}
 const state={};
 const house=buildHouse(state);
 house.position.set(spot.x,spot.y,spot.z);
 const rot=Math.atan2(-spot.x,-spot.z);
 house.rotation.y=rot;
 house.updateMatrixWorld(true);
 api.scene.add(house);
 window.arcanoAnimeHouse=house;
 const cs=Math.cos(rot),sn=Math.sin(rot);
 const toWorld=(lx,lz)=>({x:spot.x+lx*cs+lz*sn,z:spot.z-lx*sn+lz*cs});
 const toLocal=(x,z)=>{const dx=x-spot.x,dz=z-spot.z;return {x:dx*cs-dz*sn,z:dx*sn+dz*cs};};

 // ---------- Colisões e piso ----------
 const O=window.arcanoObstacles;
 if(O){
  const addLocalBox=(lx,lz,hw,hd,extra)=>{const w=toWorld(lx,lz);return O.addBox(Object.assign({x:w.x,z:w.z,hw,hd,rot},extra||{}));};
  const t=TH/2;
  addLocalBox((-W/2+.3)/2,D/2-t,(W/2+.3)/2,t);           // frente, esquerda da porta
  addLocalBox((1.5+W/2)/2,D/2-t,(W/2-1.5)/2,t);           // frente, direita da porta
  addLocalBox(0,-(D/2-t),W/2,t);                          // fundos
  addLocalBox(W/2-t,0,t,D/2);addLocalBox(-(W/2-t),0,t,D/2); // laterais
  addLocalBox(.9,D/2-t,.6,t,{enabled:()=>!state.door.open}); // porta fechada
  for(const s of state.solids)addLocalBox(s.x,s.z,s.hw,s.hd);
 }
 const floorY=spot.y+F+.04;
 if(window.arcanoGroundOverrides)window.arcanoGroundOverrides.push((x,z)=>{
  const l=toLocal(x,z);
  if(Math.abs(l.x)<W/2+.25&&Math.abs(l.z)<D/2+.25)return floorY;
  if(l.x>.05&&l.x<1.75&&l.z>D/2+.15&&l.z<D/2+.95)return spot.y+.25;
  return null;
 });

 // Árvores e arbustos originais que nasceram em cima da casa somem.
 const clear=()=>{
  for(const a of api.forestInstances||[]){
   if(!a||!a.obj||a.type==='grass')continue;
   const p=a.obj.position;
   if((p.x-spot.x)**2+(p.z-spot.z)**2<7.5*7.5){
    if(a.fullScale&&a.fullScale.setScalar)a.fullScale.setScalar(.0001);
    if(a.obj.scale.x>.001){a.obj.scale.setScalar(.0001);a.obj.updateMatrixWorld(true);}
   }
  }
 };
 clear();setInterval(clear,3000);
 // Grama 3D não atravessa o piso: tufos sob a casa e o degrau ficam com escala zero.
 const zero=new T.Matrix4().makeScale(0,0,0),im=new T.Matrix4(),ip=new T.Vector3();
 const clearGrass=()=>{
  api.scene.traverse(o=>{
   if(!o.isInstancedMesh||!o.name||!o.name.startsWith('Tapete de grama')||o.userData.houseFar)return;
   // Setores longe da casa são marcados e nunca mais percorridos (sem travadas).
   let changed=false,near=false;
   for(let i=0;i<o.count;i++){
    o.getMatrixAt(i,im);ip.setFromMatrixPosition(im);
    if(Math.abs(ip.x-spot.x)>6||Math.abs(ip.z-spot.z)>6)continue;
    near=true;
    const l=toLocal(ip.x,ip.z);
    const under=Math.abs(l.x)<W/2+.45&&Math.abs(l.z)<D/2+.45;
    const step=l.x>-.1&&l.x<1.9&&l.z>D/2&&l.z<D/2+1.1;
    if((under||step)&&im.elements[0]!==0){o.setMatrixAt(i,zero);changed=true;}
   }
   if(!near)o.userData.houseFar=true;
   if(changed)o.instanceMatrix.needsUpdate=true;
  });
 };
 clearGrass();setInterval(clearGrass,4000);

 // ---------- Interação: E / botão "Interagir" ----------
 const css=document.createElement('style');
 css.textContent=`#houseInteract{position:fixed;left:50%;bottom:120px;transform:translateX(-50%);z-index:45;display:none;
  font:600 14px system-ui,Segoe UI,sans-serif;color:#fff8e6;background:rgba(32,24,16,.82);border:1px solid #e8c56a;
  border-radius:12px;padding:10px 16px;cursor:pointer;pointer-events:auto}`;
 document.head.appendChild(css);
 const button=document.createElement('button');button.id='houseInteract';button.type='button';document.body.appendChild(button);
 let nearest=null;
 const toggle=()=>{if(nearest){nearest.open=!nearest.open;}};
 button.addEventListener('click',toggle);
 addEventListener('keydown',e=>{if(e.key&&e.key.toLowerCase()==='e'&&api.getGrassPlayer&&api.getGrassPlayer()){toggle();}});
 const wp=new T.Vector3();
 let inside=false,saved=null,last=performance.now();
 function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.1,(now-last)/1000);last=now;
  for(const it of state.interactables){
   const target=it.open?1:0;it.anim+=(target-it.anim)*Math.min(1,dt*6);it.apply(it.anim);
  }
  const player=api.getGrassPlayer&&api.getGrassPlayer();
  nearest=null;
  if(player){
   let best=2.1;
   for(const it of state.interactables){
    wp.copy(it.local);it.wg.localToWorld(wp);
    const d=Math.hypot(wp.x-player.position.x,wp.z-player.position.z);
    if(d<best){best=d;nearest=it;}
   }
  }
  if(nearest){
   const verb=nearest.open?'Fechar':'Abrir';
   button.textContent=(matchMedia('(pointer:fine)').matches?'E — ':'')+verb+' '+nearest.label;
   button.style.display='block';
  }else button.style.display='none';
  // Dentro da casa: telhado e andar de cima somem; câmera vê o cômodo por cima.
  const l=player?toLocal(player.position.x,player.position.z):null;
  const nowInside=!!l&&Math.abs(l.x)<W/2-.15&&Math.abs(l.z)<D/2-.15;
  if(nowInside!==inside){
   inside=nowInside;state.upper.visible=!inside;
   if(inside){saved={d:player.camDistance,p:player.camPitch};player.camDistance=Math.min(player.camDistance,4.2);player.camPitch=Math.max(player.camPitch,1.2);}
   else if(saved&&player){player.camDistance=saved.d;player.camPitch=saved.p;saved=null;}
   if(!inside)for(const w of state.walls)w.visible=true;
  }
  // Paredes entre a câmera e o personagem ficam ocultas enquanto ele está dentro.
  if(inside){
   const cam=api.getMainCamera&&api.getMainCamera();
   if(cam)for(const w of state.walls){
    const lc=w.worldToLocal(wp.copy(cam.position));
    w.visible=lc.z<TH;
   }
  }
  // Noite: janelas e lareira brilham mais.
  const s=window.arcanoAnimeSky&&window.arcanoAnimeSky.material.uniforms.uSunDir.value;
  const night=s?Math.min(1,Math.max(0,(-s.y+.02)/.2)):0;
  M.glass.emissiveIntensity=night*1.1;M.lamp.emissiveIntensity=.4+night*1.4;
  state.light.intensity=.7+night*1.3;
  M.fire.emissiveIntensity=1.6+Math.sin(now*.013)*.25+Math.sin(now*.031)*.15;
 }
 requestAnimationFrame(frame);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
