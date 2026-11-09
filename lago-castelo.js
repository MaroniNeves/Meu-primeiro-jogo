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
 const scene=api.scene,L=I.lake,M=VM.makeMats(),{box,cyl,sph,rod}=VM;
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
 for(const i of [1,9,19,28])for(const s of [-1,1]){const x=X0+s*(W/2+.31),z=zOf(i),y=tops[i]+1.07;cyl(g,.07,.09,1.9,M.iron,x,y,z,6,1);box(g,.34,.42,.34,M.lantern,x,y+1.85,z,0,1);box(g,.46,.08,.46,M.iron,x,y+2.27,z,0,1);}
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
  for(const s of [-1,1]){const x=X0+s*(PW/2-.08);for(let z=PZ0+.6;z<=PZ1;z+=2.4)post(x,z);rod(g,x,DY+1.05,PZ0+.6,x,DY+1.05,PZ1,.045,M.woodDark,5);rod(g,x,DY+.55,PZ0+.6,x,DY+.55,PZ1,.04,M.woodDark,5);
   O.addBox({x:x+s*.05,z:(PZ0+PZ1)/2,hw:.12,hd:len/2,rot:0});}
  // cabeça em T: bordas (sem corrimão na frente, para a água)
  for(const s of [-1,1]){const x=X0+s*(TW/2-.1);for(let z=PZ1+.5;z<=TZ1;z+=2.2)post(x,z);rod(g,x,DY+1.05,PZ1+.5,x,DY+1.05,TZ1,.045,M.woodDark,5);O.addBox({x,z:(PZ1+TZ1)/2,hw:.12,hd:(TZ1-PZ1)/2,rot:0});}
  for(let x=-TW/2+.2;x<=TW/2;x+=2.2)post(X0+x,TZ1-.1);rod(g,X0-TW/2+.1,DY+1.05,TZ1-.1,X0+TW/2-.1,DY+1.05,TZ1-.1,.045,M.woodDark,5);O.addBox({x:X0,z:TZ1-.1,hw:TW/2,hd:.12,rot:0});
  for(const s of [-1,1])O.addBox({x:X0+s*(PW/2+(TW-PW)/4),z:PZ1+.05,hw:(TW-PW)/4,hd:.12,rot:0});
  // lampiões do píer
  for(const [dx,z] of [[-PW/2+.1,PZ0+5],[PW/2-.1,PZ0+11],[-TW/2+.3,TZ1-.5],[TW/2-.3,TZ1-.5],[0,TZ1-.5]]){const x=X0+dx;cyl(g,.06,.08,1.9,M.iron,x,DY,z,6,1);box(g,.32,.4,.32,M.lantern,x,DY+1.85,z,0,1);}
  // cestos de peixe e caixote
  box(g,.9,.5,.9,M.wood,X0+TW/2-1.2,DY,TZ1-1.5,.3,1.2);box(g,.7,.4,.7,M.woodDark,X0+TW/2-2.3,DY,TZ1-1.2,-.2,1.2);
  (window.arcanoExtraDecks=window.arcanoExtraDecks||[]).push({
   surfaceAt(x,z){if(z>=PZ0&&z<=PZ1&&Math.abs(x-X0)<=PW/2)return DY+.03;if(z>PZ1&&z<=TZ1&&Math.abs(x-X0)<=TW/2)return DY+.03;return null;},blocksSegment(){return false;}});
 }
 /* ---------- Duas passarelas que saem do píer pelos lados do lago ---------- */
 {const BW=2.6,decks=[];
  for(const s of [-1,1]){
   const pts=[[s*1.8,-79],[s*9,-78],[s*17,-74.6],[s*24.5,-70],[s*29,-64.5]];
   for(let k=0;k<pts.length-1;k++){const x0=X0+pts[k][0],z0=pts[k][1],x1=X0+pts[k+1][0],z1=pts[k+1][1],dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz),ry=Math.atan2(dx,dz),cx=(x0+x1)/2,cz=(z0+z1)/2,nx=Math.cos(ry),nz=-Math.sin(ry);
    box(g,BW,.2,len+.5,M.deck,cx,DY-.2,cz,ry,2);
    box(g,BW+.2,.22,.3,M.woodDark,cx,DY-.42,cz,ry,1.5);
    for(const e of [-1,1]){const o=BW/2-.08,px=cx+nx*e*o,pz=cz+nz*e*o,ax=x0+nx*e*o,az=z0+nz*e*o,bx=x1+nx*e*o,bz=z1+nz*e*o;
     if(k===0&&e===-s)continue;
     cyl(g,.09,.1,1.15,M.woodDark,ax,DY,az,6,1);
     rod(g,ax,DY+1.05,az,bx,DY+1.05,bz,.045,M.woodDark,5);
     O.addBox({x:px,z:pz,hw:.12,hd:len/2,rot:ry});}
    for(const e of [-1,1]){const ex=x1+nx*e*(BW/2-.1),ez=z1+nz*e*(BW/2-.1),h2=H(ex,ez);cyl(g,.15,.18,DY+.95-h2+.4,M.log,ex,h2-.4,ez,7,1.4);}
    decks.push({x0,z0,x1,z1,len});}
   const lx=X0+pts[pts.length-1][0],lz=pts[pts.length-1][1];
   box(g,BW+1.2,.2,2.2,M.deck,lx,DY-.2,lz-.6,0,1.5);
   cyl(g,.06,.08,1.9,M.iron,lx,DY,lz,6,1);box(g,.32,.4,.32,M.lantern,lx,DY+1.85,lz,0,1);
   decks.push({x0:lx,z0:lz-.6,len:0,end:true});
   cyl(g,.06,.08,1.9,M.iron,X0+s*10,DY,-77.4,6,1);box(g,.32,.4,.32,M.lantern,X0+s*10,DY+1.85,-77.4,0,1);
  }
  const dist=(x,z,d)=>{if(d.end)return Math.max(Math.abs(x-d.x0)-(BW+1.2)/2,Math.abs(z-d.z0)-1.1);const ux=(d.x1-d.x0)/d.len,uz=(d.z1-d.z0)/d.len,t=Math.max(-.25,Math.min(d.len+.25,(x-d.x0)*ux+(z-d.z0)*uz));return Math.hypot(x-(d.x0+ux*t),z-(d.z0+uz*t))-BW/2;};
  (window.arcanoExtraDecks=window.arcanoExtraDecks||[]).push({surfaceAt(x,z){for(const d of decks)if(dist(x,z,d)<=0)return DY+.03;return null;},blocksSegment(){return false;}});
 }
 VM.mergeInto(g,root,'Píer e escada do lago do castelo');

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
