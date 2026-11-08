/* Minimapa da Ilha Central inteira (substitui o mapa só da área detalhada).
   O fundo é pintado uma vez, aos poucos (sem travar o jogo), a partir do
   próprio terreno: grama, terra, água, cidade, castelo, estradas e floresta.
   Pequeno: acompanha o personagem. Ampliado: a ilha toda, com nomes. */
(function(){
'use strict';
const small=document.getElementById('forestMapSmall'),big=document.getElementById('forestMapBig');
const toggle=document.getElementById('forestMini'),dialog=document.getElementById('forestMapDialog'),close=document.getElementById('forestMapClose');
if(!small||!big)return;
function expanded(open){dialog.hidden=!open;toggle.setAttribute('aria-expanded',String(open));if(open)draw(big,true);}
toggle.addEventListener('click',()=>expanded(true));
close.addEventListener('click',()=>expanded(false));
dialog.addEventListener('click',e=>{if(e.target===dialog)expanded(false);});
addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.hidden)expanded(false);});
const label=toggle.querySelector('strong');if(label)label.textContent='◈ ILHA CENTRAL';
const legend=document.getElementById('forestMapLegend');
if(legend)legend.innerHTML='▲ Você · <span style="color:#8bd3e5">━</span> Rio e lago · <span style="color:#d5bb83">━</span> Estradas · <span style="color:#e8dcc4">●</span> Cidade Aurora · <span style="color:#ffd877">✦</span> Núcleo do castelo';
const title=dialog&&dialog.querySelector('h2');if(title)title.textContent='Mapa da Ilha Central';

const RES=640;
const base=document.createElement('canvas');base.width=base.height=RES;
let ready=false,info=null;

function build(){
 const isl=window.arcanoIsland,height=window.arcanoIslandHeight,api=window.arcanoWaterV1226;
 if(!isl||!height||!api){setTimeout(build,500);return;}
 // Espera a floresta da ilha (até ~30 s) para desenhar as árvores também.
 if(!isl.forest&&(build.tries=(build.tries||0)+1)<60){info=isl;setTimeout(build,500);return;}
 info=isl;
 const C=isl.center,R=isl.radius,x0=C.x-R,z0=C.z-R,step=2*R/RES;
 const g=base.getContext('2d'),img=g.createImageData(RES,RES),d=img.data;
 const water=(x,z)=>{
  const inner=Math.abs(x)<64&&Math.abs(z)<50;
  if(inner){const p=window.arcanoRiverProfile;return p&&p.depthAt(x,z)>.02;}
  const o=window.arcanoOuterWater&&window.arcanoOuterWater(x,z);return !!(o&&o.depth>.02);
 };
 const roadDist=(x,z)=>{
  let best=1e9;
  for(const line of isl.roads||[])for(let i=0;i<line.length-1;i++){
   const a=line[i],b=line[i+1],vx=b.x-a.x,vz=b.z-a.z,wx=x-a.x,wz=z-a.z;
   const t=Math.max(0,Math.min(1,(wx*vx+wz*vz)/(vx*vx+vz*vz)));
   best=Math.min(best,Math.hypot(wx-vx*t,wz-vz*t));
  }
  const inRoad=Math.abs(z-(.92-.70*Math.sin(x*.47+.6)+.17*Math.sin(x*1.34)));
  if(Math.abs(x)<64&&Math.abs(z)<50)best=Math.min(best,inRoad);
  return best;
 };
 let row=0;
 function chunk(){
  const end=Math.min(RES,row+24);
  for(;row<end;row++)for(let col=0;col<RES;col++){
   const x=x0+(col+.5)*step,z=z0+(row+.5)*step,k=(row*RES+col)*4;
   const dist=Math.hypot(x-C.x,z-C.z);
   if(dist>R){d[k+3]=0;continue;}
   const h=height(x,z),hx=height(x+step,z);
   const shade=Math.max(.75,Math.min(1.2,1+(h-hx)*.35));
   let r,gg,b;
   if(dist<isl.castleRadius+20){r=104;gg=168;b=86;}
   else if(dist<isl.cityRadius){r=226;gg=216;b=196;}
   else{r=96;gg=160;b=82;}
   if(dist>isl.cityRadius-2&&dist<isl.cityRadius+2){r=150;gg=144;b=134;}
   if(roadDist(x,z)<2.6){r=205;gg=180;b=128;}
   if(water(x,z)){r=56;gg=150;b=186;}
   if(dist>R-6){r=150;gg=140;b=128;}
   d[k]=Math.min(255,r*shade);d[k+1]=Math.min(255,gg*shade);d[k+2]=Math.min(255,b*shade);d[k+3]=255;
  }
  if(row<RES){g.putImageData(img,0,0);setTimeout(chunk,16);return;}
  g.putImageData(img,0,0);
  // Árvores: pontos verde-escuros.
  const toPx=(x,z)=>[(x-x0)/step,(z-z0)/step];
  g.fillStyle='rgba(38,92,52,.85)';
  const trees=(api.forestInstances||[]).filter(a=>a.type==='tree'||a.type==='pine');
  for(const t of trees){const [px,py]=toPx(t.x,t.z);g.beginPath();g.arc(px,py,1.6,0,6.3);g.fill();}
  const forest=isl.forest&&isl.forest.group;
  if(isl.forest&&isl.forest.spots){
   for(const s of isl.forest.spots){const [px,py]=toPx(s.x,s.z);g.beginPath();g.arc(px,py,1.3,0,6.3);g.fill();}
  }else if(forest){
   const m=new THREE.Matrix4(),p=new THREE.Vector3(),seen=new Set();
   forest.children.forEach(im=>{
    if(!im.isInstancedMesh)return;
    for(let i=0;i<im.count;i+=1){im.getMatrixAt(i,m);p.setFromMatrixPosition(m);
     const key=Math.round(p.x)+','+Math.round(p.z);if(seen.has(key))continue;seen.add(key);
     const [px,py]=toPx(p.x,p.z);g.beginPath();g.arc(px,py,1.4,0,6.3);g.fill();}
   });
  }
  // Casas da vila e o mirante.
  const V=isl.village;
  if(V&&V.pads){
   for(const p of V.pads){const [px,py]=toPx(p.x,p.z),s=Math.max(3,p.w/step);g.save();g.translate(px,py);g.rotate(-p.rot);g.fillStyle='#b5523e';g.fillRect(-s/2,-s/2,s,s*.8);g.strokeStyle='#4a2a1a';g.lineWidth=1;g.strokeRect(-s/2,-s/2,s,s*.8);g.restore();}
   if(V.peakPad){const [px,py]=toPx(V.peakPad.x,V.peakPad.z);g.fillStyle='#3f9a7a';g.beginPath();g.arc(px,py,4,0,6.3);g.fill();}
  }
  ready=true;
 }
 chunk();
}
build();

function game(){return window.arcanoWaterV1226?.getGrassPlayer?.()||null;}
function draw(canvas,full){
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#0d1e2a';ctx.fillRect(0,0,w,h);
 if(!info){ctx.fillStyle='#cfe';ctx.font='14px system-ui';ctx.textAlign='center';ctx.fillText('Carregando mapa…',w/2,h/2);return;}
 const C=info.center,R=info.radius;
 const p=game(),px=p?.position?.x??0,pz=p?.position?.z??0,heading=p?.heading||0;
 // Escala: ampliado mostra a ilha inteira; pequeno, ~70 m em volta.
 const zoom=full?Math.min(w,h)/(2*R)*.92:w/140;
 const cx=full?C.x:px,cz=full?C.z:pz;
 const at=(x,z)=>[w/2+(x-cx)*zoom,h/2+(z-cz)*zoom];
 const [bx,by]=at(C.x-R,C.z-R);
 ctx.imageSmoothingEnabled=true;
 if(ready||base)ctx.drawImage(base,bx,by,2*R*zoom,2*R*zoom);
 // Contorno da ilha.
 ctx.strokeStyle='#e8d9b0';ctx.lineWidth=full?2:1.5;
 ctx.beginPath();const [ix,iy]=at(C.x,C.z);ctx.arc(ix,iy,R*zoom,0,6.3);ctx.stroke();
 // Núcleo do castelo.
 ctx.fillStyle='#ffd877';ctx.shadowColor='#ffd877';ctx.shadowBlur=full?14:8;
 ctx.beginPath();ctx.arc(ix,iy,full?6:Math.max(3,2*zoom),0,6.3);ctx.fill();ctx.shadowBlur=0;
 // Casa e ponte.
 const house=window.arcanoAnimeHouse,bridge=window.arcanoBridgeSolid;
 if(house){const [hx,hy]=at(house.position.x,house.position.z);ctx.fillStyle='#3a68a8';ctx.fillRect(hx-4,hy-4,8,8);ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.strokeRect(hx-4,hy-4,8,8);}
 if(bridge&&bridge.center){const [qx,qy]=at(bridge.center.x,bridge.center.z);ctx.fillStyle='#b5483c';ctx.fillRect(qx-6,qy-2,12,4);}
 if(full){
  ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.fillStyle='#2b2140';
  ctx.fillText('Aurora',ix,iy-info.cityRadius*zoom*.55);
  ctx.fillStyle='#e3e5ca';ctx.fillText('Ilha Central · Luz',w/2,26);
  if(info.port){const [ox,oy]=at(info.port.x,info.port.z);ctx.fillStyle='#e3e5ca';ctx.font='12px system-ui';ctx.fillText('Porto',ox,oy-8);}
 }
 // Jogador (seta).
 const [ax,ay]=at(px,pz);
 ctx.save();ctx.translate(ax,ay);ctx.rotate(Math.PI-heading);
 ctx.shadowColor='#fbe3a0';ctx.shadowBlur=full?18:10;ctx.fillStyle='#ffe098';ctx.strokeStyle='#352818';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(7,8);ctx.lineTo(0,4);ctx.lineTo(-7,8);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.restore();
}
// ---------- Teleporte (só para teste) ----------
// Clique/toque no mapa ampliado leva o personagem até o ponto; botões rápidos
// para os lugares principais.
function groundAt(x,z){
 const inner=Math.abs(x)<63.6&&Math.abs(z)<49.6;
 let y=inner&&window.arcanoAnimeGround?window.arcanoAnimeGround.heightAt(x,z):(window.arcanoIslandHeight?window.arcanoIslandHeight(x,z):0);
 for(const f of window.arcanoGroundOverrides||[]){const h=f(x,z);if(h!=null&&h>y)y=h;}
 const w=window.arcanoOuterWater&&window.arcanoOuterWater(x,z);if(w)y=Math.max(y,w.level);
 return y;
}
function teleport(x,z){
 const p=game();if(!p)return false;
 if(window.arcanoIslandClamp){const c=window.arcanoIslandClamp(x,z);x=c[0];z=c[1];}
 p.position.set(x,groundAt(x,z)+.4,z);
 if(p.velocity&&p.velocity.set)p.velocity.set(0,0,0);
 expanded(false);return true;
}
big.style.cursor='crosshair';
big.addEventListener('click',e=>{
 if(!info)return;
 const r=big.getBoundingClientRect(),sx=(e.clientX-r.left)*big.width/r.width,sy=(e.clientY-r.top)*big.height/r.height;
 const zoom=Math.min(big.width,big.height)/(2*info.radius)*.92;
 const x=info.center.x+(sx-big.width/2)/zoom,z=info.center.z+(sy-big.height/2)/zoom;
 if(Math.hypot(x-info.center.x,z-info.center.z)<=info.radius)teleport(x,z);
});
{
 const card=document.getElementById('forestMapCard')||dialog;
 const bar=document.createElement('div');
 bar.style.cssText='display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0 2px;font:600 12px system-ui;color:#e3e5ca';
 bar.innerHTML='<span style="opacity:.85">🧪 Teleporte de teste — clique no mapa ou:</span>';
 const spots=[
  ['Início',()=>[0,1]],
  ['Castelo',()=>{const s=window.arcanoCastleSite;return s?[s.x,s.z+31]:null;}],
  ['Jardim',()=>{const s=window.arcanoCastleSite;return s?[s.x+9,s.z+20]:null;}],
  ['Chafariz',()=>{const s=window.arcanoCastleSite;return s?[s.x+9,s.z+88]:null;}],
  ['Portão sul',()=>{const i=info;return i?[i.center.x,i.center.z+i.cityRadius+8]:null;}],
  ['Lago',()=>{const l=info&&info.lake;return l?[l.x+l.rx+6,l.z]:null;}],
  ['Nascente',()=>{const s=info&&info.streams&&info.streams[0].pts[0];return s?[s.x+7,s.z+7]:null;}],
  ['Vila',()=>{const v=info&&info.village;return v?[v.spiral[20].x,v.spiral[20].z]:null;}],
  ['Mirante',()=>{const v=info&&info.village;return v?[v.peakPad.x+2,v.peakPad.z]:null;}],
  ['Porto',()=>{const p=info&&info.portSite;if(!p)return null;const w=p.at(info.radius-30,-3);return [w.x,w.z];}],
  ['Navio',()=>{const p=info&&info.portSite;if(!p)return null;const w=p.at(info.radius+25,13.2);return [w.x,w.z];}]
 ];
 for(const [name,fn] of spots){
  const b=document.createElement('button');b.type='button';b.textContent=name;
  b.style.cssText='background:#324d42;color:#f1f5e6;border:1px solid #839b82;border-radius:8px;padding:5px 9px;cursor:pointer;font:600 12px system-ui';
  b.addEventListener('click',ev=>{ev.stopPropagation();const p=fn();if(p)teleport(p[0],p[1]);});
  bar.appendChild(b);
 }
 const canvasEl=big;canvasEl.parentNode.insertBefore(bar,canvasEl);
}
let counter=0;
function tick(){
 if(document.body.classList.contains('play-active')&&(counter++%6===0)){draw(small,false);if(!dialog.hidden)draw(big,true);}
 requestAnimationFrame(tick);
}
tick();
})();
