/* Seis vilas espalhadas pela floresta da ilha, cada uma num estilo diferente.
   - Define as clareiras ANTES da floresta ser plantada (ilha-central.js lê window.arcanoClearings).
   - Monta estrada principal + travessa + praça, casas e cabanas do estilo, grades de madeira nas
     margens das estradas, e dois acampamentos (fogueira acesa e outra apagada).
   - Uma estrada de terra liga cada vila ao castelo.
   Cada vila usa o sistema local x = estrada principal (aponta para o castelo), z = perpendicular. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const PI=Math.PI;
const CASTLE={x:0,z:-230},STOP=150;
const SITES=[
 {id:'moinho',nome:'Vila do Moinho',x:-252,z:-293,fence:'rail'},
 {id:'lenhadores',nome:'Vila dos Lenhadores',x:-166,z:-367,fence:'log'},
 {id:'mediterranea',nome:'Vila Branca',x:-102,z:-464,fence:'wall'},
 {id:'nordica',nome:'Vila do Norte',x:-22,z:-544,fence:'picket'},
 {id:'oriental',nome:'Vila das Cerejeiras',x:181,z:-450,fence:'bamboo'},
 {id:'cogumelos',nome:'Vila dos Cogumelos',x:318,z:-269,fence:'cute'}
];
// orientação: +x local aponta para o castelo; a estrada principal continua até a cidade
for(const s of SITES){const dx=CASTLE.x-s.x,dz=CASTLE.z-s.z,L=Math.hypot(dx,dz);s.rot=Math.atan2(-dz/L,dx/L);s.dist=L;s.conn=Math.min(Math.max(40,L-STOP),150);}

/* ---------- Clareiras na floresta (lidas por ilha-central.js antes de plantar as árvores) ---------- */
const CLEAR=window.arcanoClearings=[];
for(const s of SITES){
 const c=Math.cos(s.rot),sn=Math.sin(s.rot),W=(lx,lz)=>({x:s.x+lx*c+lz*sn,z:s.z-lx*sn+lz*c});
 CLEAR.push({x:s.x,z:s.z,r:54});
 const a=W(-52,0),b=W(s.conn,0);CLEAR.push({x1:a.x,z1:a.z,x2:b.x,z2:b.z,r:7});
 const p=W(0,-30),q=W(0,30);CLEAR.push({x1:p.x,z1:p.z,x2:q.x,z2:q.z,r:7});
}
window.arcanoVilas=SITES;

/* ---------- Montagem ---------- */
const NG=[];(window.arcanoNoGrass=window.arcanoNoGrass||[]).push((x,z)=>{for(let i=0;i<NG.length;i++){const n=NG[i];if(Math.hypot(x-n[0],z-n[1])<n[2])return true;}return false;});

function layoutFor(id,K,ctx){
 const M=ctx.M;
 const N=-1,S=1;                                      // lados: norte (z<0, de frente para a estrada) e sul
 const rowZ=(side,d)=>side*(8.6+d/2);
 const out={doors:[],paths:[]};                       // portas (abrem vão na grade) e caminhos de terra
 const house=(fn,x,side,opt,d)=>{d=d||5.4;const z=rowZ(side,d);fn(ctx,x,z,side<0?0:PI,opt);out.doors.push(x);out.paths.push([{x,z:side*3.6},{x,z:side*(8.2)}]);};
 const at=(fn,x,z,ry,opt)=>fn(ctx,x,z,ry,opt);
 switch(id){
  case 'moinho':{
   house(K.casa,-27,N,{w:6.8,d:5.2},5.2);house(K.celeiro,-12.5,N,null,7.4);house(K.casa,14,N,{w:7.2,d:5.4},5.4);house(K.casa,28,N,{w:6.4,d:5},5);
   house(K.casa,-28,S,{w:6.4,d:5},5);house(K.casa,-15,S,{w:6.2,d:4.8},4.8);at(K.silo,15,rowZ(S,4.2)+.3,PI);out.doors.push(15);house(K.casa,29,S,{w:6.6,d:5.2},5.2);
   K.moinho(ctx,24,-28,0);
   K.campo(ctx,-27,-26,0,15,10);K.campo(ctx,-9,-26.5,0,12,9);K.campo(ctx,-24,27,PI,14,9);K.campo(ctx,-4,28,PI,11,8);K.campo(ctx,40,22,PI,12,8);
   K.poco(ctx,0,0);for(const [x,z] of [[-36,-21],[8,-21],[36,-18],[-38,20],[8,22]])ctx.K.tree(ctx,x,z,1.0,M.leaf);
   at(K.cabana,0,-27,0);at(K.cabana,0,27.5,PI);
   break;}
  case 'lenhadores':{
   house(K.casa,-27,N,{w:6.6,d:5.2},5.2);house(K.casarao,-12.5,N,null,6.4);house(K.casa,14,N,{w:6.4,d:5},5);house(K.casa,28,N,{w:6.8,d:5.4},5.4);
   house(K.casa,-29,S,{w:6.2,d:4.8},4.8);at(K.serraria,-15,rowZ(S,5.4)+.4,PI);out.doors.push(-15);house(K.casarao,17,S,null,6.4);house(K.casa,31,S,{w:6.4,d:5},5);
   for(const [x,z,r] of [[-22,-20,.4],[-18,-19,2],[24,-19,1.2],[40,16,.3],[-36,17,2.4],[3,20,0]])K.pilha(ctx,x,z,r);
   for(const [x,z] of [[-5,-17],[6,-18],[-34,-17],[-9,20],[22,21]])K.toco(ctx,x,z,rnd2());
   K.poco(ctx,0,0);for(const [x,z] of [[-36,-23],[6,-24],[36,-22],[38,24],[-6,25],[-24,23]])ctx.K.tree(ctx,x,z,1.15,M.leafDark);
   at(K.cabana,0,-27,0);at(K.cabana,0,27.5,PI);
   break;}
  case 'mediterranea':{
   house(K.casa,-27,N,{w:6.4,d:5.4,terraco:true},5.4);house(K.casa,-13,N,{w:5.8,d:5},5);house(K.casa,14,N,{w:6.4,d:5.4},5.4);house(K.casa,28,N,{w:6.2,d:5.2,terraco:true},5.2);
   house(K.casa,-27,S,{w:6.2,d:5.2},5.2);at(K.torre,-13,rowZ(S,3.6),PI);out.doors.push(-13);house(K.casa,14,S,{w:6.4,d:5.4,terraco:true},5.4);house(K.casa,28,S,{w:5.8,d:5},5);
   K.fonte(ctx,0,0);for(const [x,z,s] of [[-36,-22,1],[-6,-22,.9],[8,-22,1],[37,-21,1.1],[-37,22,1],[-8,23,1],[6,22,.9],[36,23,1]])K.oliveira(ctx,x,z,s);
   at(K.cabana,0,-27,0);at(K.cabana,0,27.5,PI);
   break;}
  case 'nordica':{
   house(K.longa,-21,N,null,6.4);house(K.sala,12,N,null,5.6);house(K.sala,26.5,N,null,5.6);
   at(K.celeiro,-28,rowZ(S,3.2)+.3,PI);out.doors.push(-28);house(K.sala,-13.5,S,null,5.6);at(K.celeiro,13,rowZ(S,3.2)+.3,PI);out.doors.push(13);house(K.sala,27,S,null,5.6);
   K.runa(ctx,0,0,0);K.rack(ctx,-8,-21,0);K.rack(ctx,17,-21,0);K.rack(ctx,-34,19,PI);K.poco(ctx,36,22);
   for(const [x,z] of [[-36,-21],[36,-20],[-5,22],[6,24],[-20,23]])ctx.K.tree(ctx,x,z,1.0,ctx.M.leafDark);
   at(K.cabana,0,-27,0);at(K.cabana,0,27.5,PI);
   break;}
  case 'oriental':{
   house(K.casa,-27,N,{w:6.4,d:5.4},5.4);house(K.casa,-13.5,N,{w:5.8,d:5},5);house(K.casa,14,N,{w:6.4,d:5.4},5.4);house(K.casa,28,N,{w:6.4,d:5.2},5.2);
   house(K.casa,-27,S,{w:6.2,d:5.2},5.2);at(K.pagode,-13,rowZ(S,5.6),PI);out.doors.push(-13);house(K.casa,14,S,{w:6.4,d:5.4},5.4);house(K.casa,28,S,{w:5.8,d:5},5);
   K.torii(ctx,41,0,PI/2);K.toro(ctx,-3.6,3.9);K.toro(ctx,3.6,-3.9);K.toro(ctx,-3.6,-3.9);K.toro(ctx,3.6,3.9);K.cerejeira(ctx,0,0,1.25);
   K.lago(ctx,-22,-24,3.8);K.lago(ctx,22,24,3.3);
   for(const [x,z,s] of [[-8,-22,1],[7,-22,.9],[36,-22,1.1],[-36,-21,1],[-6,23,1],[8,24,.9],[36,23,1]])K.cerejeira(ctx,x,z,s);
   for(const [x,z] of [[-38,-17],[38,-17],[-38,17],[40,17]])K.bambu(ctx,x,z,8);
   at(K.cabana,0,-27,0);at(K.cabana,0,27.5,PI);
   break;}
  case 'cogumelos':{
   house(K.grande,-27,N,{cap:M.capRed},6.8);house(K.casa,-12.5,N,{cap:M.capPurple,sr:1.9,sh:3.2,cr:3.7},4.4);house(K.casa,14,N,{cap:M.capTeal,sr:2.0,sh:3.4,cr:3.9},4.6);house(K.grande,29,N,{cap:M.capOrange},6.8);
   house(K.casa,-27,S,{cap:M.capPink,sr:2.0,sh:3.4,cr:3.9},4.6);house(K.casa,-13,S,{cap:M.capTeal,sr:1.8,sh:3.0,cr:3.5},4.2);house(K.grande,15,S,{cap:M.capPurple},6.8);house(K.casa,29,S,{cap:M.capRed,sr:1.9,sh:3.2,cr:3.7},4.4);
   K.anel(ctx,0,0,3.6,14);K.poco(ctx,0,0.0+0.01);
   for(const [x,z] of [[-36,-20],[-6,-19],[8,-19],[36,-18],[-38,19],[-6,21],[6,20],[37,20],[-20,-21],[20,22]])K.brilho(ctx,x,z,6);
   for(const [x,z] of [[-5,-9],[5,-9],[-5,9],[5,9],[40,9],[-41,-9]])K.flor(ctx,x,z);
   at(K.cabana,0,-26.5,0);at(K.cabana,0,27,PI);
   break;}
 }
 return out;
}
let seedB=77;const rnd2=()=>{seedB=(seedB*1664525+1013904223)>>>0;return seedB/4294967296*6.28;};

function install(){
 const api=window.arcanoWaterV1226,VM=window.__vm,O=window.arcanoObstacles,H=window.arcanoIslandHeight;
 if(!api||!api.scene||!H||!O||!window.arcanoIsland||!VM||!VM.KIT||!VM.campfire){setTimeout(install,400);return;}
 const scene=api.scene,KITS=VM.KIT;
 const M=VM.mats=VM.makeMats();
 // materiais de efeito (chamas, brilho, fumaça, poça de luz)
 const tx=VM.TEX,sp={
  flame:new T.SpriteMaterial({map:tx.flame(),transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false}),
  glow:new T.SpriteMaterial({map:tx.glow(),transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false,opacity:.5}),
  smoke:new T.SpriteMaterial({map:tx.smoke(),transparent:true,depthWrite:false,opacity:.3}),
  ember:new T.SpriteMaterial({map:tx.glow(),transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false}),
  pool:new T.MeshBasicMaterial({map:tx.glow(),transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false,opacity:.15})
 };
 const root=new T.Group();root.name='Vilas da floresta';scene.add(root);
 for(const site of SITES){
  const baseY=H(site.x,site.z),village=new T.Group();village.name=site.nome;village.position.set(site.x,baseY,site.z);village.rotation.y=site.rot;root.add(village);
  const live=new T.Group();village.add(live);
  const rot=site.rot,c=Math.cos(rot),s=Math.sin(rot);
  const W=(lx,lz)=>({x:site.x+lx*c+lz*s,z:site.z-lx*s+lz*c});
  const gy=(lx,lz)=>{const w=W(lx,lz);return H(w.x,w.z)-baseY;};
  const tmp=new T.Group();
  const ctx={g:tmp,live,M,sp,rot,W,gy,K:{tree:null},
   pad(lx,lz,w,d,ry){let hi=-1e9,lo=1e9;const cr=Math.cos(ry),sr=Math.sin(ry);for(const i of [-1,0,1])for(const j of [-1,0,1]){const ox=i*w/2,oz=j*d/2,x=lx+ox*cr+oz*sr,z=lz-ox*sr+oz*cr,h=gy(x,z);hi=Math.max(hi,h);lo=Math.min(lo,h);}return {y:hi,depth:Math.max(0,hi-lo)+.12};},
   colBox(lx,lz,hw,hd,ang){const w=W(lx,lz);O.addBox({x:w.x,z:w.z,hw,hd,rot:rot+(ang||0)});},
   colCircle(lx,lz,r){const w=W(lx,lz);O.addCircle(w.x,w.z,r);},
   noGrassC(lx,lz,r){const w=W(lx,lz);NG.push([w.x,w.z,r]);}};
  // árvore genérica compartilhada pelos estilos
  ctx.K.tree=(cx,x,z,sc,crown)=>{const y=gy(x,z);VM.cyl(tmp,.16*sc,.24*sc,2.2*sc,M.bark,x,y,z,7,1.5);for(const [dx,dy,dz,r] of [[0,2.7,0,1.35],[.8,2.2,.3,.95],[-.7,2.35,-.3,1.0],[.1,3.3,.2,.85]])VM.sph(tmp,r*sc,crown||M.leaf,x+dx*sc,y+dy*sc,z+dz*sc,1,.85,1,8);ctx.colCircle(x,z,.45*sc);ctx.noGrassC(x,z,1.5*sc);};
  const K=KITS[site.id];
  // ----- praça e estradas -----
  {const pg=new T.CircleGeometry(7.2,32);pg.rotateX(-PI/2);const uv=pg.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*4.8,uv.getY(i)*4.8);
   const pm=new T.Mesh(pg,M.cobble.clone());pm.material.polygonOffset=true;pm.material.polygonOffsetFactor=-3;pm.material.polygonOffsetUnits=-3;pm.position.set(0,gy(0,0)+.1,0);pm.receiveShadow=true;live.add(pm);
   const ring=new T.Mesh(new T.RingGeometry(7.1,7.55,32),M.stoneDark);ring.rotation.x=-PI/2;ring.position.set(0,gy(0,0)+.12,0);live.add(ring);ctx.noGrassC(0,0,9);}
  const mainPts=[{x:-50,z:0},{x:-24,z:0},{x:0,z:0},{x:26,z:0}];
  for(let x=60;x<site.conn;x+=34)mainPts.push({x,z:3.5*Math.sin(x*.03+site.x)});mainPts.push({x:site.conn,z:3.5*Math.sin(site.conn*.03+site.x)});
  VM.road(ctx,mainPts,3.6);
  VM.road(ctx,[{x:0,z:-24},{x:0,z:0},{x:0,z:24}],3.2);
  const lay=layoutFor(site.id,K,ctx);
  for(const p of lay.paths)VM.road(ctx,p,1.8);
  // ----- grades nas margens das estradas -----
  const near=(x,list,r)=>list.some(d=>Math.abs(x-d)<r);
  const offs=(side)=>mainPts.map(p=>({x:p.x,z:p.z+side*3.0}));
  const skipMain=(x)=>(x>-4.6&&x<4.6)||near(x,lay.doors,1.9)||(x>39&&x<43)||(x>45&&x<51)||(x<-40&&x>-48)||(x>51&&((x-51)%34)>22);
  // ponto de passagem para os acampamentos
  for(const side of [-1,1]){const pts=offs(side);VM.fence(ctx,pts,site.fence,(x,z)=>skipMain(x));}
  const crossPts=side=>[{x:side*2.8,z:-23},{x:side*2.8,z:23}];
  for(const side of [-1,1])VM.fence(ctx,crossPts(side),site.fence,(x,z)=>Math.abs(z)<5.4);
  // ----- acampamentos: um aceso (oeste) e um apagado (leste) -----
  const kinds={moinho:['a','teepee'],lenhadores:['lean','a'],mediterranea:['a','lean'],nordica:['teepee','a'],oriental:['a','teepee'],cogumelos:['a','lean']}[site.id];
  const mats={moinho:[0,2],lenhadores:[2,1],mediterranea:[1,3],nordica:[3,0],oriental:[3,1],cogumelos:[2,0]}[site.id];
  VM.road(ctx,[{x:-44,z:-2.6},{x:-44,z:-10}],1.8);VM.road(ctx,[{x:48,z:2.6},{x:48,z:11}],1.8);
  VM.camp(ctx,-44,-14,.6,{lit:true,kind:kinds[0],mat:mats[0]});
  VM.camp(ctx,48,15,3.6,{lit:false,kind:kinds[1],mat:mats[1]});
  VM.mergeInto(tmp,village,site.nome+' · construções');
 }
 // luz da noite e animação
 VM.startAnim();
 console.info('[Vilas] 6 vilas montadas');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
