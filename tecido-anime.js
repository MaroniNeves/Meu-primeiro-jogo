/* Tecido de verdade: bandeiras e cortinas com trama, brasão, barra e franjas, presas pelo topo e
   balançando com o vento do céu do jogo (a onda é feita no shader: sem custo de CPU por vértice).
   window.arcanoCloth.banner(w, h, {kind, indoor}) devolve a malha com a origem no centro do topo;
   a bandeira pende para baixo (-y) e a frente olha para +z. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
let seed=515;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const U={uTime:{value:0}};
const WIND={out:{value:.6},in:{value:.18}};   // fora: vento do céu; dentro: só uma brisa pelas janelas

const KINDS={
 red:{base:'#a8262e',dark:'#6e1620',light:'#c8444a',trim:'#e2bd62',emblem:'star'},
 blue:{base:'#2a4f93',dark:'#16315f',light:'#4a74c0',trim:'#e2bd62',emblem:'crown'},
 green:{base:'#2f7a4a',dark:'#1a4a2c',light:'#4fa36a',trim:'#e2bd62',emblem:'leaf'},
 purple:{base:'#6a3a8f',dark:'#3d1f5e',light:'#8d5cb8',trim:'#e2bd62',emblem:'star'}
};
function emblem(g,kind,w,h,col){
 g.save();g.translate(w/2,h*.42);g.fillStyle=col;g.strokeStyle='rgba(60,34,10,.7)';g.lineWidth=3;
 if(kind==='star'){g.beginPath();for(let i=0;i<16;i++){const a=i/16*Math.PI*2-Math.PI/2,r=i%2?w*.1:w*.27;g.lineTo(Math.cos(a)*r,Math.sin(a)*r);}g.closePath();g.fill();g.stroke();g.beginPath();g.arc(0,0,w*.08,0,6.3);g.fillStyle='rgba(120,30,30,.85)';g.fill();}
 else if(kind==='crown'){const s=w*.26;g.beginPath();g.moveTo(-s,s*.7);g.lineTo(-s,-s*.2);g.lineTo(-s*.5,s*.25);g.lineTo(0,-s*.7);g.lineTo(s*.5,s*.25);g.lineTo(s,-s*.2);g.lineTo(s,s*.7);g.closePath();g.fill();g.stroke();for(const x of [-s,0,s]){g.beginPath();g.arc(x,x?-s*.28:-s*.8,s*.1,0,6.3);g.fill();}}
 else{for(let i=0;i<5;i++){g.save();g.rotate(i*1.2566);g.beginPath();g.ellipse(0,-w*.16,w*.07,w*.17,0,0,6.3);g.fill();g.stroke();g.restore();}}
 g.restore();
}
function clothTex(kind){
 const K=KINDS[kind]||KINDS.red,W=256,H=512,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
 g.fillStyle=K.base;g.fillRect(0,0,W,H);
 // dobras verticais pintadas (luz e sombra)
 for(let x=0;x<W;x+=1){const f=.5+.5*Math.sin(x*.09+Math.sin(x*.021)*3);g.fillStyle=`rgba(${f>.5?'255,255,255':'0,0,0'},${Math.abs(f-.5)*.12})`;g.fillRect(x,0,1,H);}
 // trama
 g.strokeStyle='rgba(0,0,0,.09)';g.lineWidth=1;for(let y=0;y<H;y+=3){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
 g.strokeStyle='rgba(255,255,255,.06)';for(let x=0;x<W;x+=3){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();}
 // brocado: losangos tom sobre tom
 g.fillStyle=K.light;g.globalAlpha=.2;for(let y=30;y<H-40;y+=44)for(let x=(y/44%2?22:0);x<W;x+=44){g.beginPath();g.moveTo(x,y-14);g.lineTo(x+10,y);g.lineTo(x,y+14);g.lineTo(x-10,y);g.closePath();g.fill();}g.globalAlpha=1;
 // faixas douradas laterais
 for(const x of [10,W-18]){g.fillStyle=K.trim;g.fillRect(x,40,8,H-90);g.fillStyle='rgba(0,0,0,.2)';g.fillRect(x+6,40,2,H-90);}
 // brasão em medalhão
 g.fillStyle=K.dark;g.beginPath();g.arc(W/2,H*.42,W*.34,0,6.3);g.fill();g.strokeStyle=K.trim;g.lineWidth=7;g.stroke();
 emblem(g,K.emblem,W,H,K.trim);
 // barra de cima (varão) e de baixo com franja
 g.fillStyle=K.dark;g.fillRect(0,0,W,30);g.fillStyle=K.trim;g.fillRect(0,28,W,5);
 for(let x=14;x<W;x+=28){g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.arc(x,14,5,0,6.3);g.fill();}
 g.fillStyle=K.trim;g.fillRect(0,H-70,W,6);
 for(let x=0;x<W;x+=16){g.fillStyle=K.trim;g.beginPath();g.moveTo(x,H-64);g.lineTo(x+16,H-64);g.lineTo(x+8,H);g.closePath();g.fill();g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.moveTo(x+8,H-64);g.lineTo(x+16,H-64);g.lineTo(x+8,H);g.closePath();g.fill();}
 // fios soltos nas pontas da franja
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}
const MATS={};
function material(kind,indoor){
 const key=kind+(indoor?'/in':'');if(MATS[key])return MATS[key];
 const m=new T.MeshStandardMaterial({map:clothTex(kind),side:T.DoubleSide,roughness:.95,name:'tecido '+kind});
 const wind=indoor?WIND.in:WIND.out;
 m.onBeforeCompile=sh=>{
  sh.uniforms.uTime=U.uTime;sh.uniforms.uWindK=wind;
  const wave=`
   float hang=1.0-uv.y;                                       // 0 no varão, 1 na ponta de baixo
   float gust=0.65+0.35*sin(uTime*0.55+position.x*0.4);
   float ph=position.x*2.2+uTime*2.3+hang*3.0;
   float amp=hang*hang*uWindK*gust;
   float dz=amp*(0.34*sin(ph)+0.16*sin(position.x*4.1+uTime*3.7+hang*6.0));
   float dx=hang*uWindK*0.06*sin(uTime*1.4+hang*2.0);
   float dy=-abs(dz)*0.18;
   float dzdx=amp*(0.34*2.2*cos(ph)+0.16*4.1*cos(position.x*4.1+uTime*3.7+hang*6.0));
   float dzdy=hang*uWindK*gust*(0.7*sin(ph)+0.3*cos(ph*1.7));`;
  sh.vertexShader='uniform float uTime;uniform float uWindK;\n'+sh.vertexShader
   .replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\n'+wave+'\n objectNormal=normalize(vec3(-dzdx*1.6,dzdy*0.6,1.0));')
   .replace('#include <begin_vertex>','#include <begin_vertex>\n transformed+=vec3(dx,dy,dz);');
 };
 m.customProgramCacheKey=()=>'tecido'+(indoor?'in':'out');
 return MATS[key]=m;
}
// Bandeira: pano w x h preso pelo topo (origem no centro do topo), com varão e pontas douradas.
function banner(w,h,o){
 o=o||{};const geo=new T.PlaneGeometry(w,h,14,28);geo.translate(0,-h/2,0);
 const mesh=new T.Mesh(geo,material(o.kind||'red',!!o.indoor));mesh.name='Bandeira de tecido';mesh.castShadow=false;mesh.receiveShadow=true;
 return mesh;
}
// Vento externo segue o vento do céu; atualiza tempo e intensidade.
let started=false;
function start(){
 if(started)return;started=true;
 (function frame(now){
  requestAnimationFrame(frame);
  U.uTime.value=now/1000;
  if(((now/1000|0)%2)===0){const sky=window.arcanoAnimeSky,wv=sky&&sky.material&&sky.material.uniforms&&sky.material.uniforms.uWind?sky.material.uniforms.uWind.value:.35;
   WIND.out.value=.45+Math.min(1.4,wv*1.6);WIND.in.value=.12+Math.min(.5,wv*.35);}
 })(performance.now());
}
start();
window.arcanoCloth={banner,material,tex:clothTex,wind:WIND};
})();
