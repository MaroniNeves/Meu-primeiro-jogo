/* Píer e escada do lago perto do castelo.
   Da água: uma plataforma de madeira (píer) avança pelo lago até a margem; dali começa uma escada de pedra
   que sobe o barranco até o patamar da cidade, de onde se segue para o castelo. Tem corrimão de pedra, lampiões,
   um pórtico no topo, um barquinho amarrado e o piso é "ponte" para o jogo (andar sobre a água sem nadar). */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const PI=Math.PI,TAU=PI*2;
function install(){
 const api=window.arcanoWaterV1226,VM=window.__vm,O=window.arcanoObstacles,H=window.arcanoIslandHeight,I=window.arcanoIsland,AT=window.arcanoTex;
 if(!api||!api.scene||!H||!O||!I||!I.lake||!VM||!VM.makeMats||!AT){setTimeout(install,500);return;}
 const scene=api.scene,L=I.lake,M=VM.makeMats(),{box,cyl,sph,rod,cone}=VM;
 /* lamparina de verdade: poste, braço de ferro com mão-francesa, corrente e lanterna sextavada pendurada
    (telhadinho, vidro que acende à noite, armação e base). (ax,az) = para onde o braço aponta. */
 const LAMPS=[],glassMat=new T.MeshBasicMaterial({color:'#e8dab0'});
 const LQ=[];function lantern(...a){LQ.push(a);}
 // Coloca as lamparinas depois que as passarelas existem: se o poste caiu em cima de um piso, empurra para fora (lado oposto ao braço).
 function flushLanterns(){const decks=window.arcanoExtraDecks||[],on=(x,z)=>{for(const d of decks){const y=d.surfaceAt(x,z);if(y!=null&&y>-50)return true;}return false;};
  for(const a of LQ){let [x,yb,z,ax,az,h,fy,pile]=a;const hadPile=pile!=null;let k=0;
   while(k<40&&(on(x,z)||on(x-ax*.18,z-az*.18)||on(x+az*.18,z-ax*.18)||on(x-az*.18,z+ax*.18))){x-=ax*.1;z-=az*.1;k++;}
   if(k>0&&hadPile)pile=Math.min(yb,H(x,z)-.3);lanternNow(x,yb,z,ax,az,h,fy,hadPile?pile:null);}}
 function lanternNow(x,yb,z,ax,az,h,fy,pile){h=h||2.3;
  if(pile!=null)cyl(g,.1,.12,yb-pile+.05,M.log,x,pile,z,7,1.4);
  cyl(g,.075,.1,h,M.woodDark,x,yb,z,8,1);cyl(g,.11,.11,.08,M.iron,x,yb+h-.06,z,8,1);sph(g,.065,M.gold||M.iron,x,yb+h+.08,z,1,1,1,8);
  const LL=.55,tx=x+ax*LL,tz=z+az*LL,ty=yb+h-.14;
  rod(g,x,ty,z,tx,ty,tz,.026,M.iron,5);rod(g,x,ty-.36,z,x+ax*LL*.55,ty,z+az*LL*.55,.018,M.iron,5);sph(g,.035,M.iron,tx,ty,tz,1,1,1,6);
  rod(g,tx,ty,tz,tx,ty-.13,tz,.012,M.iron,4);
  const by=ty-.13;cone(g,.17,.13,M.iron,tx,by-.13,tz,6,1);sph(g,.03,M.iron,tx,by+.01,tz,1,1,1,6);
  cyl(g,.118,.1,.3,glassMat,tx,by-.45,tz,6,1);
  for(let k=0;k<6;k+=2){const a=k/6*TAU+PI/6;rod(g,tx+Math.cos(a)*.122,by-.45,tz+Math.sin(a)*.122,tx+Math.cos(a)*.122,by-.14,tz+Math.sin(a)*.122,.013,M.iron,4);}
  cyl(g,.135,.09,.06,M.iron,tx,by-.5,tz,6,1);sph(g,.028,M.iron,tx,by-.56,tz,1,1,1,6);
  LAMPS.push({p:new T.Vector3(tx,by-.3,tz),fy});}
 const X0=0,ZS=-84.4,ZE=-96.6,N=30,W=4.4,WATER=L.y,DY=WATER+.5;
 const g=new T.Group(),root=new T.Group();root.name='Píer e escada do lago do castelo';scene.add(root);

 /* ---------- Escada: degraus que acompanham o barranco ---------- */
 const run=(ZS-ZE)/N,tops=[],lows=[];let prev=H(X0,ZS)+.1;
 const hS=H(X0,ZS)+.1,hE=10.05;
 for(let i=0;i<N;i++){
  const zc=ZS-(i+.5)*run;let hmax=-1e9,hmin=1e9;
  for(const dx of [-W/2,0,W/2])for(const dz of [-run/2,0,run/2]){const h=H(X0+dx,zc+dz);hmax=Math.max(hmax,h);hmin=Math.min(hmin,h);}
  let top=Math.max(hS+(i+1)*(hE-hS)/N,hmax+.07,prev+.1);if(i===N-1)top=Math.max(top,hE);
  tops.push(top);lows.push(hmin-.7);prev=top;}
 const zOf=i=>ZS-(i+.5)*run;
 for(let i=0;i<N;i++){const zc=zOf(i);
  box(g,W,tops[i]-lows[i],run+.02,M.stone,X0,lows[i],zc,0,2);
  box(g,W+.04,.08,.16,M.stoneDark,X0,tops[i]-.02,zc+run/2-.04,0,1);       // nariz do degrau
  for(const s of [-1,1]){box(g,.62,tops[i]-lows[i]+.95,run+.02,M.stoneDark,X0+s*(W/2+.31),lows[i],zc,0,2);box(g,.82,.12,run+.04,M.stone,X0+s*(W/2+.31),tops[i]+.95,zc,0,2);}
 }
 // lampiões sobre o parapeito
 for(const i of [1,9,19,28])for(const s of [-1,1]){const x=X0+s*(W/2+.31),z=zOf(i),y=tops[i]+1.07;lantern(x,y,z,-s,0,1.9,tops[i]);}
 // patamar e pórtico no alto
 {const topY=tops[N-1],zc=ZE-2.2;
  box(g,W+1.6,.5,4.4,M.stone,X0,topY-.4,zc,0,2);
  for(const s of [-1,1]){const x=X0+s*(W/2+.6);box(g,.9,4.6,.9,M.stoneDark,x,topY,ZE-.2,0,2);box(g,1.14,.3,1.14,M.stone,x,topY+4.6,ZE-.2,0,2);sph(g,.34,M.gold,x,topY+5.15,ZE-.2,1,1,1,8);}
  box(g,W+2.4,.55,1.1,M.stone,X0,topY+4.2,ZE-.2,0,2);box(g,W+1.2,.3,.9,M.stoneDark,X0,topY+3.9,ZE-.2,0,2);
  // placa e bandeiras
  box(g,2.6,.7,.12,M.wood,X0,topY+4.3,ZE+.4,0,1);
  const CL=window.arcanoCloth;if(CL)for(const s of [-1,1]){const bm=CL.banner(1.1,2.8,{kind:s>0?'blue':'red'});bm.position.set(X0+s*(W/2+.6),topY+3.7,ZE+.4);root.add(bm);}
 }
 // piso e colisão da escada
 (window.arcanoGroundOverrides=window.arcanoGroundOverrides||[]).push((x,z)=>{
  if(Math.abs(x-X0)>W/2+.15||z>ZS+.05||z<ZE-4.4)return null;
  if(z<ZE)return tops[N-1]+.02;
  const i=Math.min(N-1,Math.max(0,Math.floor((ZS-z)/run)));return tops[i]+.02;});
 for(const s of [-1,1])O.addBox({x:X0+s*(W/2+.31),z:(ZS+ZE)/2,hw:.34,hd:Math.abs(ZS-ZE)/2+.1,rot:0});
 for(const s of [-1,1])O.addBox({x:X0+s*(W/2+.6),z:ZE-.2,hw:.5,hd:.5,rot:0});

 /* ---------- Píer ---------- */
 const PZ0=ZS+.2,PZ1=-66.5,TZ1=-62.2,PW=3.6,TW=9.6;       // corpo do píer e cabeça em T
 {const len=PZ1-PZ0;
  box(g,PW,.2,len,M.deck,X0,DY-.2,(PZ0+PZ1)/2,0,2);
  box(g,TW,.2,TZ1-PZ1,M.deck,X0,DY-.2,(PZ1+TZ1)/2,0,2);
  // vigas e postes
  for(let z=PZ0+1.2;z<=TZ1;z+=2.4){const wide=z>PZ1?TW:PW;box(g,wide+.2,.22,.3,M.woodDark,X0,DY-.42,z,0,1.5);
   const xs=z>PZ1?[-TW/2+.2,-TW/4,0,TW/4,TW/2-.2]:[-PW/2+.1,PW/2-.1];
   for(const dx of xs){const x=X0+dx,hh=H(x,z);cyl(g,.15,.18,DY+.95-hh+.4,M.log,x,hh-.4,z,7,1.4);}}
  // corrimãos
  const post=(x,z)=>{cyl(g,.09,.1,1.15,M.woodDark,x,DY,z,6,1);};
  // vão nos dois lados onde saem as passarelas laterais (antes o corrimão fechava a passagem)
  const G0=-80.6,G1=-77.2;
  for(const s of [-1,1]){const x=X0+s*(PW/2-.08);
   for(const [za,zb] of [[PZ0+.6,G0],[G1,PZ1]]){
    for(let z=za;z<zb-.6;z+=2.4)post(x,z);post(x,zb);if(za===G1)post(x,za);
    rod(g,x,DY+1.05,za,x,DY+1.05,zb,.045,M.woodDark,5);rod(g,x,DY+.55,za,x,DY+.55,zb,.04,M.woodDark,5);
    O.addBox({x:x+s*.05,z:(za+zb)/2,hw:.12,hd:(zb-za)/2,rot:0});}}
  // cabeça em T: bordas (sem corrimão na frente, para a água)
  for(const s of [-1,1]){const x=X0+s*(TW/2-.1);for(let z=PZ1+.5;z<=TZ1;z+=2.2)post(x,z);rod(g,x,DY+1.05,PZ1+.5,x,DY+1.05,TZ1,.045,M.woodDark,5);O.addBox({x,z:(PZ1+TZ1)/2,hw:.12,hd:(TZ1-PZ1)/2,rot:0});}
  for(let x=-TW/2+.2;x<=TW/2;x+=2.2)post(X0+x,TZ1-.1);rod(g,X0-TW/2+.1,DY+1.05,TZ1-.1,X0+TW/2-.1,DY+1.05,TZ1-.1,.045,M.woodDark,5);O.addBox({x:X0,z:TZ1-.1,hw:TW/2,hd:.12,rot:0});
  for(const s of [-1,1])O.addBox({x:X0+s*(PW/2+(TW-PW)/4),z:PZ1+.05,hw:(TW-PW)/4,hd:.12,rot:0});
  // lampiões do píer
  for(const [x,z,ax,az] of [[X0-PW/2-.16,PZ0+5,1,0],[X0+PW/2+.16,PZ0+11,-1,0],[X0-TW/2-.16,TZ1-1.2,1,0],[X0+TW/2+.16,TZ1-1.2,-1,0],[X0,TZ1+.16,0,-1]])lantern(x,DY-.25,z,ax,az,2.3,DY,H(x,z)-.3);
  // cestos de peixe e caixote
  box(g,.9,.5,.9,M.wood,X0+TW/2-1.2,DY,TZ1-1.5,.3,1.2);box(g,.7,.4,.7,M.woodDark,X0+TW/2-2.3,DY,TZ1-1.2,-.2,1.2);
  (window.arcanoExtraDecks=window.arcanoExtraDecks||[]).push({
   surfaceAt(x,z){if(z>=PZ0&&z<=PZ1&&Math.abs(x-X0)<=PW/2)return DY+.03;if(z>PZ1&&z<=TZ1&&Math.abs(x-X0)<=TW/2)return DY+.03;return null;},blocksSegment(){return false;}});
 }
 /* ---------- Duas passarelas que saem do píer pelos lados do lago ---------- */
 // O último trecho desce ou sobe em degraus até o chão da margem (antes ficava enterrado de um lado e flutuando do outro).
 {const BW=2.6,decks=[];
  for(const s of [-1,1]){
   const pts=[[s*1.8,-79],[s*9,-78],[s*17,-74.6],[s*24.5,-70],[s*29,-64.5]],last=pts.length-2;
   const lx=X0+pts[pts.length-1][0],lz=pts[pts.length-1][1];
   let gE=-1e9;for(const ox of [-1.9,0,1.9])for(const oz of [-1.7,-.6,.5])gE=Math.max(gE,H(lx+ox,lz+oz));
   const yEnd=gE+.12>DY+.06?Math.min(DY+1.6,gE+.12):DY;   // só sobe até a margem; sobre a água fica no nível do píer, apoiado em estacas
   for(let k=0;k<pts.length-1;k++){const x0=X0+pts[k][0],z0=pts[k][1],x1=X0+pts[k+1][0],z1=pts[k+1][1],dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz),ry=Math.atan2(dx,dz),cx=(x0+x1)/2,cz=(z0+z1)/2,nx=Math.cos(ry),nz=-Math.sin(ry);
    const ya=DY,yb=k===last?yEnd:DY;
    if(Math.abs(yb-ya)<.06){box(g,BW,.2,len+.5,M.deck,cx,DY-.2,cz,ry,2);box(g,BW+.2,.22,.3,M.woodDark,cx,DY-.42,cz,ry,1.5);}
    else{const n=Math.max(2,Math.ceil(Math.abs(yb-ya)/.17)),sl=len/n;
     for(let i=0;i<n;i++){const t=(i+.5)/n,y=ya+(yb-ya)*(i+1)/n,px=x0+dx*t,pz=z0+dz*t,hh=Math.max(.2,y-Math.min(ya,yb)+.25);box(g,BW,hh,sl+.04,M.deck,px,y-hh,pz,ry,2);}}
    for(const e of [-1,1]){const o=BW/2-.08,ax=x0+nx*e*o,az=z0+nz*e*o,bx=x1+nx*e*o,bz=z1+nz*e*o;
     if(k===0&&e===-s)continue;
     cyl(g,.09,.1,1.15,M.woodDark,ax,ya,az,6,1);if(k===last)cyl(g,.09,.1,1.15,M.woodDark,bx,yb,bz,6,1);
     rod(g,ax,ya+1.05,az,bx,yb+1.05,bz,.045,M.woodDark,5);
     O.addBox({x:(ax+bx)/2,z:(az+bz)/2,hw:.12,hd:len/2,rot:ry});}
    for(const e of [-1,1]){const ex=x1+nx*e*(BW/2-.1),ez=z1+nz*e*(BW/2-.1),h2=H(ex,ez);if(yb-h2>.2)cyl(g,.15,.18,yb+.95-h2+.4,M.log,ex,h2-.4,ez,7,1.4);}
    decks.push({x0,z0,x1,z1,len,y0:ya,y1:yb});
    // lamparina no lado de fora (longe do lago), no meio dos trechos 1 e 3
    if(k===1||k===3){const mx=cx,mz=cz;let e=1;if((mx+nx-L.x)*nx+(mz+nz-L.z)*nz<0)e=-1;const px=mx+nx*e*(BW/2+.16),pz=mz+nz*e*(BW/2+.16),yy=(ya+yb)/2;lantern(px,yy-.25,pz,-nx*e,-nz*e,2.3,yy,H(px,pz)-.3);}
   }
   if(yEnd-gE>.35){box(g,BW+1.2,.2,2.2,M.deck,lx,yEnd-.2,lz-.6,0,1.5);box(g,BW+1.4,.22,.3,M.woodDark,lx,yEnd-.42,lz-1.5,0,1.5);box(g,BW+1.4,.22,.3,M.woodDark,lx,yEnd-.42,lz+.3,0,1.5);
    for(const ox of [-1,1])for(const oz of [-1.5,.3]){const px=lx+ox*((BW+1.2)/2-.15),pz=lz-.6+oz+.6,h2=H(px,pz);cyl(g,.15,.18,yEnd-h2+.4,M.log,px,h2-.4,pz,7,1.4);}
    for(const e of [-1,1]){const px=lx+e*((BW+1.2)/2-.08);cyl(g,.09,.1,1.15,M.woodDark,px,yEnd,lz+.45,6,1);rod(g,px,yEnd+1.05,lz-1.65,px,yEnd+1.05,lz+.45,.045,M.woodDark,5);O.addBox({x:px,z:lz-.6,hw:.12,hd:1.1,rot:0});}
    rod(g,lx-(BW+1.2)/2+.08,yEnd+1.05,lz+.45,lx+(BW+1.2)/2-.08,yEnd+1.05,lz+.45,.045,M.woodDark,5);O.addBox({x:lx,z:lz+.45,hw:(BW+1.2)/2,hd:.12,rot:0});}
   else box(g,BW+1.2,Math.max(.2,yEnd-gE+.3),2.2,M.deck,lx,yEnd-Math.max(.2,yEnd-gE+.3),lz-.6,0,1.5);
   decks.push({x0:lx,z0:lz-.6,len:0,end:true,y0:yEnd,y1:yEnd});
   lantern(lx+s*((BW+1.2)/2+.14),yEnd-.25,lz-1.3,-s,0,2.3,yEnd,Math.min(yEnd-.25,H(lx+s*((BW+1.2)/2+.14),lz-1.3)-.3));
  }
  const dist=(x,z,d)=>{if(d.end)return Math.max(Math.abs(x-d.x0)-(BW+1.2)/2,Math.abs(z-d.z0)-1.1);const ux=(d.x1-d.x0)/d.len,uz=(d.z1-d.z0)/d.len,t=Math.max(-.25,Math.min(d.len+.25,(x-d.x0)*ux+(z-d.z0)*uz));return Math.hypot(x-(d.x0+ux*t),z-(d.z0+uz*t))-BW/2;};
  const yAt=(x,z,d)=>{if(d.end)return d.y0;const ux=(d.x1-d.x0)/d.len,uz=(d.z1-d.z0)/d.len,t=Math.max(0,Math.min(1,((x-d.x0)*ux+(z-d.z0)*uz)/d.len));return d.y0+(d.y1-d.y0)*t;};
  (window.arcanoExtraDecks=window.arcanoExtraDecks||[]).push({surfaceAt(x,z){for(const d of decks)if(dist(x,z,d)<=0)return yAt(x,z,d)+.03;return null;},blocksSegment(){return false;}});
  // sem capim crescendo por cima das passarelas
  (window.arcanoNoGrass=window.arcanoNoGrass||[]).push((x,z)=>{if(z<-82||z>-60||Math.abs(x-X0)>33)return false;for(const d of decks)if(dist(x,z,d)<.5)return true;return false;});
 }
 flushLanterns();
 VM.mergeInto(g,root,'Píer e escada do lago do castelo');
 {const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,236,180,1)');gr.addColorStop(.22,'rgba(255,196,96,.6)');gr.addColorStop(1,'rgba(255,160,60,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);
  const tex=new T.CanvasTexture(c),halo=new T.SpriteMaterial({map:tex,blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:0,fog:false}),pool=new T.MeshBasicMaterial({map:tex,blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:0});
  const pg=new T.CircleGeometry(2.3,24);pg.rotateX(-PI/2);
  for(const l of LAMPS){const sp=new T.Sprite(halo);sp.position.copy(l.p);sp.scale.setScalar(1.5);sp.renderOrder=5;root.add(sp);const d=new T.Mesh(pg,pool);d.position.set(l.p.x,l.fy+.05,l.p.z);d.renderOrder=4;root.add(d);}
  const mob=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent),lights=[];for(let i=0;i<(mob?2:4);i++){const pl=new T.PointLight('#ffb25a',0,11,1.3);root.add(pl);lights.push(pl);}
  const tmp=new T.Vector3();
  (function tick(){requestAnimationFrame(tick);const rv=window.arcanoAnimeRiver;let day=1;if(rv){const su=rv.material.uniforms.uSun.value;day=Math.min(1,Math.max(0,(su.y+.1)/.28));}
   const n=Math.min(1,Math.max(0,(.45-day)/.35)),k=n*n*(3-2*n);
   glassMat.color.setRGB(.91+.09*k,.85-.02*k,.69-.22*k);halo.opacity=k*.95;pool.opacity=k*.5;
   const cam=api.getMainCamera&&api.getMainCamera();if(!cam)return;
   const near=LAMPS.map(l=>[l,l.p.distanceToSquared(cam.position)]).sort((a,b)=>a[1]-b[1]);
   lights.forEach((pl,i)=>{const o=near[i];if(!o||k<.02||o[1]>3600){pl.intensity=0;return;}pl.position.copy(o[0].p);pl.position.y-=.05;pl.intensity=k*1.9;});})();}

 /* ---------- Barquinho amarrado ---------- */
 {const boat=new T.Group();boat.position.set(X0+5.4,WATER-.08,-70);boat.rotation.y=.12;root.add(boat);
  const hull=new T.Mesh(new T.SphereGeometry(1,22,10,0,TAU,PI/2,PI/2),M.woodH||M.deck);hull.rotation.x=PI;hull.scale.set(.95,.62,2.5);hull.material=new T.MeshStandardMaterial({map:M.deck.map,bumpMap:M.deck.bumpMap,bumpScale:.8,side:T.DoubleSide,roughness:1});boat.add(hull);
  for(const z of [-.8,.3,1.2]){const b=new T.Mesh(new T.BoxGeometry(1.7,.08,.28),M.woodDark);b.position.set(0,.12,z);boat.add(b);}
  for(const s of [-1,1]){const o=new T.Mesh(new T.CylinderGeometry(.03,.03,2.2,5),M.woodDark);o.rotation.z=PI/2.5*s;o.position.set(s*.95,.35,.1);boat.add(o);}
  const t0=performance.now();(function bob(now){requestAnimationFrame(bob);const t=(now-t0)/1000;boat.position.y=WATER-.08+Math.sin(t*1.3)*.035;boat.rotation.z=Math.sin(t*1.1)*.025;boat.rotation.x=Math.sin(t*.9+1)*.018;})(t0);
  // corda até o poste do píer
  const rp=new T.Mesh(new T.CylinderGeometry(.015,.015,3.4,4),M.cloth);rp.position.set(X0+3.4,WATER+.25,-69.6);rp.rotation.z=PI/2-.15;rp.rotation.y=0;root.add(rp);
 }
 window.arcanoPierCastelo={x:X0,zStart:ZS,zEnd:PZ1,topY:tops[N-1]};
 console.info('[Lago do castelo] píer e escada prontos');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
