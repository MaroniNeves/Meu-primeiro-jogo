/* Seis vilas espalhadas pela floresta da ilha, cada uma num estilo diferente, e acampamentos soltos.
   - As clareiras são registradas ANTES da floresta ser plantada (ilha-central.js lê window.arcanoClearings).
   - Em cada vila as casas NÃO ficam em fileiras: são sorteadas ao longo das estradas, com recuos,
     giros e tamanhos diferentes, cada uma de frente para a estrada mais próxima.
   - Estradas de vários tipos (paralelepípedo, lajes de pedra, terra, barro com poças, cascalho, tábuas),
     curvas, com ramais e caminhos até as portas; grades de madeira só em trechos.
   - Os acampamentos (tendas, fogueira acesa ou apagada) ficam espalhados pelo mapa, fora das vilas.
   Sistema local da vila: x = estrada principal (aponta para o castelo), z = perpendicular. */
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
// tipos de estrada por vila: praça, principal, travessa, ramais, caminhos das portas, ligação ao castelo
const ROADS={
 moinho:{plaza:'cobble',main:'dirt',cross:'mud',branch:'gravel',stub:'gravel',conn:'dirt'},
 lenhadores:{plaza:'plank',main:'mud',cross:'dirt',branch:'mud',stub:'plank',conn:'mud'},
 mediterranea:{plaza:'flag',main:'flag',cross:'cobble',branch:'gravel',stub:'flag',conn:'gravel'},
 nordica:{plaza:'cobble',main:'cobble',cross:'dirt',branch:'mud',stub:'plank',conn:'mud'},
 oriental:{plaza:'flag',main:'gravel',cross:'flag',branch:'dirt',stub:'flag',conn:'dirt'},
 cogumelos:{plaza:'cobble',main:'dirt',cross:'cobble',branch:'gravel',stub:'gravel',conn:'mud'}
};
// acampamentos: pontos planos escolhidos longe das vilas, estradas, porto e rios; aceso/apagado alternados
const CAMPS=[[-198,-446],[66,-403],[-306,-205],[167,-291],[134,-357],[288,-473],[239,-349],[131,-536],[40,-602],[-50,-401],[-317,-439],[-372,-285],[220,-538],[-265,-498]]
 .map(([x,z],i)=>({x,z,rot:i*1.37+.4,lit:i%2===0,kind:['a','teepee','lean'][i%3],mat:i%4}));

for(const s of SITES){const dx=CASTLE.x-s.x,dz=CASTLE.z-s.z,L=Math.hypot(dx,dz);s.rot=Math.atan2(-dz/L,dx/L);s.dist=L;s.conn=Math.min(Math.max(40,L-STOP),150);}

/* ---------- Clareiras na floresta ---------- */
const CLEAR=window.arcanoClearings=window.arcanoClearings||[];
for(const s of SITES){
 const c=Math.cos(s.rot),sn=Math.sin(s.rot),W=(lx,lz)=>({x:s.x+lx*c+lz*sn,z:s.z-lx*sn+lz*c});
 CLEAR.push({x:s.x,z:s.z,r:54});
 const a=W(-52,0),b=W(s.conn,0);CLEAR.push({x1:a.x,z1:a.z,x2:b.x,z2:b.z,r:7});
 const p=W(0,-30),q=W(0,30);CLEAR.push({x1:p.x,z1:p.z,x2:q.x,z2:q.z,r:7});
}
for(const c of CAMPS)CLEAR.push({x:c.x,z:c.z,r:11});
window.arcanoVilas=SITES;window.arcanoAcampamentos=CAMPS;

const NG=[];(window.arcanoNoGrass=window.arcanoNoGrass||[]).push((x,z)=>{for(let i=0;i<NG.length;i++){const n=NG[i];if(Math.hypot(x-n[0],z-n[1])<n[2])return true;}return false;});

/* ---------- Geometria 2D para o sorteio das casas ---------- */
const segPt=(px,pz,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz||1;let t=((px-a.x)*dx+(pz-a.z)*dz)/l;t=Math.max(0,Math.min(1,t));return {x:a.x+dx*t,z:a.z+dz*t};};
function nearestOnRoads(px,pz,roads){let best=null;for(const r of roads)for(let i=1;i<r.length;i++){const q=segPt(px,pz,r[i-1],r[i]),d=Math.hypot(px-q.x,pz-q.z);if(!best||d<best.d)best={d,x:q.x,z:q.z};}return best;}
const corners=(cx,cz,w,d,ry)=>{const c=Math.cos(ry),s=Math.sin(ry),out=[];for(const [i,j] of [[-1,-1],[1,-1],[1,1],[-1,1],[0,-1],[1,0],[0,1],[-1,0]]){const ox=i*w/2,oz=j*d/2;out.push({x:cx+ox*c+oz*s,z:cz-ox*s+oz*c});}return out;};
// SAT entre dois retângulos girados, com folga
function obbHit(a,b,m){
 const ax=[[Math.cos(a.ry),-Math.sin(a.ry)],[Math.sin(a.ry),Math.cos(a.ry)]],bx=[[Math.cos(b.ry),-Math.sin(b.ry)],[Math.sin(b.ry),Math.cos(b.ry)]];
 const dx=b.cx-a.cx,dz=b.cz-a.cz;
 for(const ax2 of [...ax,...bx]){
  const proj=(o,half)=>Math.abs(ax2[0]*o[0][0]+ax2[1]*o[0][1])*half[0]+Math.abs(ax2[0]*o[1][0]+ax2[1]*o[1][1])*half[1];
  const ra=proj(ax,[a.w/2+m/2,a.d/2+m/2]),rb=proj(bx,[b.w/2+m/2,b.d/2+m/2]),dist=Math.abs(dx*ax2[0]+dz*ax2[1]);
  if(dist>ra+rb)return false;}
 return true;
}
const mkRng=seed=>{let s=(seed>>>0)||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};};

function install(){
 const api=window.arcanoWaterV1226,VM=window.__vm,O=window.arcanoObstacles,H=window.arcanoIslandHeight;
 if(!api||!api.scene||!H||!O||!window.arcanoIsland||!VM||!VM.KIT||!VM.campfire){setTimeout(install,400);return;}
 const scene=api.scene,KITS=VM.KIT;
 const M=VM.mats=VM.makeMats();
 const tx=VM.TEX,sp={
  flame:new T.SpriteMaterial({map:tx.flame(),transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false}),
  glow:new T.SpriteMaterial({map:tx.glow(),transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false,opacity:.5}),
  smoke:new T.SpriteMaterial({map:tx.smoke(),transparent:true,depthWrite:false,opacity:.3}),
  ember:new T.SpriteMaterial({map:tx.glow(),transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false}),
  pool:new T.MeshBasicMaterial({map:tx.glow(),transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false,opacity:.15})
 };
 const root=new T.Group();root.name='Vilas e acampamentos da floresta';scene.add(root);

 // contexto de construção (vila ou acampamento): grupo no mundo + malha unida + objetos vivos
 function makeCtx(name,x,z,rot){
  const baseY=H(x,z),group=new T.Group();group.name=name;group.position.set(x,baseY,z);group.rotation.y=rot;root.add(group);
  const live=new T.Group();group.add(live);const c=Math.cos(rot),s=Math.sin(rot);
  const W=(lx,lz)=>({x:x+lx*c+lz*s,z:z-lx*s+lz*c});
  const gy=(lx,lz)=>{const w=W(lx,lz);return H(w.x,w.z)-baseY;};
  const tmp=new T.Group();
  const ctx={g:tmp,live,M,sp,rot,W,gy,group,K:{tree:null},
   pad(lx,lz,w,d,ry){let hi=-1e9,lo=1e9;const cr=Math.cos(ry),sr=Math.sin(ry);for(const i of [-1,0,1])for(const j of [-1,0,1]){const ox=i*w/2,oz=j*d/2,px=lx+ox*cr+oz*sr,pz=lz-ox*sr+oz*cr,h=gy(px,pz);hi=Math.max(hi,h);lo=Math.min(lo,h);}return {y:hi,depth:Math.max(0,hi-lo)+.12};},
   colBox(lx,lz,hw,hd,ang){const w=W(lx,lz);O.addBox({x:w.x,z:w.z,hw,hd,rot:rot+(ang||0)});},
   colCircle(lx,lz,r){const w=W(lx,lz);O.addCircle(w.x,w.z,r);},
   noGrassC(lx,lz,r){const w=W(lx,lz);NG.push([w.x,w.z,r]);}};
  ctx.K.tree=(cx,px,pz,sc,crown)=>{const y=gy(px,pz);VM.cyl(tmp,.16*sc,.24*sc,2.2*sc,M.bark,px,y,pz,7,1.5);for(const [dx,dy,dz,r] of [[0,2.7,0,1.35],[.8,2.2,.3,.95],[-.7,2.35,-.3,1.0],[.1,3.3,.2,.85]])VM.sph(tmp,r*sc,crown||M.leaf,px+dx*sc,y+dy*sc,pz+dz*sc,1,.85,1,8);ctx.colCircle(px,pz,.45*sc);ctx.noGrassC(px,pz,1.5*sc);};
  return ctx;
 }

 /* ================= VILAS ================= */
 for(const site of SITES){
  const R=mkRng(Math.abs(site.x*73856093^site.z*19349663)),rnd=R;
  const ctx=makeCtx(site.nome,site.x,site.z,site.rot),K=KITS[site.id],RT=ROADS[site.id],gy=ctx.gy;
  // ----- estradas: curvas suaves (principal, travessa) e ramais sorteados -----
  const f1=.05+R()*.03,f2=.14+R()*.06,A1=2.4+R()*1.6,A2=.8+R()*.9,g1=.06+R()*.03,g2=.17+R()*.05,B1=2.0+R()*1.6,B2=.6+R()*.8;
  const mz=x=>A1*Math.sin(x*f1)+A2*Math.sin(x*f2),cx=z=>B1*Math.sin(z*g1)+B2*Math.sin(z*g2);
  const main=[];for(let x=-50;x<=site.conn+.1;x+=4)main.push({x,z:mz(x)});
  const cross=[];for(let z=-28;z<=28.1;z+=4)cross.push({x:cx(z),z});
  const branches=[];
  for(let i=0;i<3;i++){const sgn=i%2?1:-1,x0=(sgn*(10+R()*20))*(R()<.5?1:-1),a0=sgn*(1.0+R()*1.1),len=15+R()*10;let px=x0,pz=mz(x0),ang=a0;const pts=[{x:px,z:pz}];
   for(let k=0;k<4;k++){ang+=(R()-.5)*.6;px+=Math.sin(ang)*0+Math.cos(ang)*len/4;pz+=Math.sin(ang)*len/4;pts.push({x:px,z:pz});}branches.push(pts);}
  // só considera para o sorteio a parte das estradas dentro da vila
  const near=main.filter(p=>p.x<=58),allRoads=[near,cross,...branches];
  const roadPieces=(pts,x0,x1)=>pts.filter(p=>p.x>=x0-.01&&p.x<=x1+.01);
  // principal em trechos de tipos diferentes; a ligação ao castelo é outra estrada
  const mpiece=(a,b,t)=>{const p=roadPieces(main,a,b);if(p.length>1)VM.road(ctx,p,3.6,t);};
  mpiece(-50,-22,RT.main);mpiece(-22,22,RT.plaza);mpiece(22,58,RT.main);mpiece(58,site.conn,RT.conn);
  VM.road(ctx,cross.filter(p=>Math.abs(p.z)<=11),3.2,RT.plaza);VM.road(ctx,cross.filter(p=>p.z<=-9),3.2,RT.cross);VM.road(ctx,cross.filter(p=>p.z>=9),3.2,RT.cross);
  for(const b of branches)VM.road(ctx,b,2.4,RT.branch);
  // praça
  {const pg=new T.CircleGeometry(7.2,32);pg.rotateX(-PI/2);const uv=pg.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*4.8,uv.getY(i)*4.8);
   const pm=new T.Mesh(pg,M.cobble.clone());{const PS={moinho:{style:'round',hue:38,sat:20,l0:52,l1:70,seed:301,n:7},lenhadores:{style:'rubble',hue:28,sat:12,l0:38,l1:54,seed:302,n:6},mediterranea:{style:'flag',hue:40,sat:22,l0:66,l1:82,seed:303,n:5},nordica:{style:'rubble',hue:215,sat:8,l0:40,l1:58,seed:304,n:6},oriental:{style:'round',hue:30,sat:10,l0:50,l1:66,seed:305,n:12},cogumelos:{style:'setts',hue:280,sat:10,l0:48,l1:64,seed:306,n:8}}[site.id];if(PS&&window.arcanoTex){const ct=window.arcanoTex.cobble(PS);pm.material.map=ct.map;pm.material.bumpMap=ct.bump;pm.material.needsUpdate=true;}}pm.material.polygonOffset=true;pm.material.polygonOffsetFactor=-1;pm.material.polygonOffsetUnits=-1;pm.position.set(0,gy(0,0)+.1,0);pm.receiveShadow=true;ctx.live.add(pm);{const pw=ctx.W(0,0),py=window.arcanoIslandHeight(pw.x,pw.z)+.1;(window.arcanoGroundOverrides=window.arcanoGroundOverrides||[]).push((x,z)=>{const dx=x-pw.x,dz=z-pw.z;return dx*dx+dz*dz<7.3*7.3?py:null;});}
   const ring=new T.Mesh(new T.RingGeometry(7.1,7.55,32),M.stoneDark);ring.rotation.x=-PI/2;ring.position.set(0,gy(0,0)+.12,0);ctx.live.add(ring);ctx.noGrassC(0,0,9);}
  // ----- sorteio das construções ao longo das estradas -----
  const occ=[],samples=[];for(const r of [near,cross,...branches])for(let i=1;i<r.length;i++){const a=r[i-1],b=r[i],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/3));for(let k=0;k<n;k++)samples.push({x:a.x+(b.x-a.x)*k/n,z:a.z+(b.z-a.z)*k/n});}
  const stubs=[];
  const valid=(cx,cz,w,d,ry,o)=>{
   if(Math.hypot(cx,cz)>(o.maxR||46)||Math.hypot(cx,cz)<(o.minR||0))return false;
   for(const p of corners(cx,cz,w,d,ry)){if(Math.hypot(p.x,p.z)<(o.plaza||9.6))return false;const n=nearestOnRoads(p.x,p.z,allRoads);if(n&&n.d<(o.road||2.4))return false;}
   const me={cx,cz,w,d,ry};for(const q of occ)if(obbHit(me,q,o.gap||1.6))return false;return true;};
  const place=(w,d,o,run)=>{
   o=o||{};
   for(let a=0;a<320;a++){
    let x,z,ry;
    if(o.mode==='edge'){const ang=R()*PI*2,r=(o.r0||26)+R()*(o.r1||14);x=Math.cos(ang)*r;z=Math.sin(ang)*r;const n=nearestOnRoads(x,z,allRoads);ry=n?Math.atan2(n.x-x,n.z-z)+(R()-.5)*.5:R()*6;}
    else if(o.mode==='free'){const ang=R()*PI*2,r=(o.r0||12)+R()*(o.r1||32);x=Math.cos(ang)*r;z=Math.sin(ang)*r;ry=R()*6.28;}
    else{ // casa: perto de uma estrada, recuo e giro variáveis
     const s=samples[Math.floor(R()*samples.length)],a2=R()*PI*2,off=Math.max(w,d)/2+2.6+R()*9;
     const nx=Math.cos(a2),nz=Math.sin(a2);x=s.x+nx*off;z=s.z+nz*off;const n=nearestOnRoads(x,z,allRoads);ry=n?Math.atan2(n.x-x,n.z-z)+(R()-.5)*.55:R()*6;}
    const gap=o.gap||(o.mode==='free'?.4:1.6);
    if(!valid(x,z,w,d,ry,Object.assign({},o,{gap}))){continue;}
    occ.push({cx:x,cz:z,w,d,ry});
    run(x,z,ry);
    if(o.door!==false){const fx=Math.sin(ry),fz=Math.cos(ry),dp={x:x+fx*(d/2+.5),z:z+fz*(d/2+.5)},n=nearestOnRoads(dp.x,dp.z,allRoads);
     if(n&&n.d>1.4&&n.d<20){VM.road(ctx,[dp,{x:n.x,z:n.z}],1.5,RT.stub);stubs.push({x:n.x,z:n.z});}}
    return true;}
   return false;};
  const many=(count,wf,df,o,run)=>{for(let i=0;i<count;i++){const w=wf(),d=df();place(w,d,o,(x,z,ry)=>run(x,z,ry,w,d));}};
  const rr=(a,b)=>()=>a+R()*(b-a);
  const free=(count,r,run,o)=>{for(let i=0;i<count;i++)place(r*2,r*2,Object.assign({mode:'free',door:false},o||{}),(x,z,ry)=>run(x,z,ry));};
  const casaOpt=(w,d)=>({w,d});
  // cabanas pequenas: sempre as duas, nas bordas
  const cabanas=()=>{for(let i=0;i<2;i++)place(4.4,3.8,{mode:'edge',r0:27,r1:14},(x,z,ry)=>K.cabana(ctx,x,z,ry));};
  switch(site.id){
   case 'moinho':{
    K.poco(ctx,0,0);
    place(7.6,7.6,{mode:'edge',r0:24,r1:14},(x,z,ry)=>K.moinho(ctx,x,z,ry));
    place(10.8,8.2,{},(x,z,ry)=>K.celeiro(ctx,x,z,ry));place(4.8,4.8,{},(x,z,ry)=>K.silo(ctx,x,z,ry));
    many(6,rr(6.2,7.4),rr(4.8,5.6),{},(x,z,ry,w,d)=>K.casa(ctx,x,z,ry,{w,d}));
    for(let i=0;i<5;i++){const w=11+R()*5,d=8+R()*3;place(w,d,{mode:'edge',r0:18,r1:24,door:false,road:1.6,gap:1},(x,z,ry)=>K.campo(ctx,x,z,ry,w,d));}
    free(9,1.6,(x,z)=>ctx.K.tree(ctx,x,z,.9+R()*.3,M.leaf));cabanas();break;}
   case 'lenhadores':{
    K.poco(ctx,0,0);
    place(9,6.2,{},(x,z,ry)=>K.serraria(ctx,x,z,ry));
    many(2,()=>10.2,()=>7,{},(x,z,ry)=>K.casarao(ctx,x,z,ry));
    many(5,rr(6.2,7.2),rr(4.8,5.6),{},(x,z,ry,w,d)=>K.casa(ctx,x,z,ry,{w,d}));
    free(7,1.6,(x,z,ry)=>K.pilha(ctx,x,z,ry),{r0:10,r1:34});free(6,.8,(x,z,ry)=>K.toco(ctx,x,z,ry));
    free(9,1.7,(x,z)=>ctx.K.tree(ctx,x,z,1+R()*.3,M.leafDark));cabanas();break;}
   case 'mediterranea':{
    K.fonte(ctx,0,0);
    place(4.2,4.2,{},(x,z,ry)=>K.torre(ctx,x,z,ry));
    many(7,rr(5.8,6.8),rr(4.8,5.6),{},(x,z,ry,w,d)=>K.casa(ctx,x,z,ry,{w,d,terraco:R()<.4}));
    free(10,1.4,(x,z)=>K.oliveira(ctx,x,z,.9+R()*.3));cabanas();break;}
   case 'nordica':{
    K.runa(ctx,0,0,0);
    place(14.8,7,{},(x,z,ry)=>K.longa(ctx,x,z,ry));
    many(3,()=>9.2,()=>6.2,{},(x,z,ry)=>K.sala(ctx,x,z,ry));
    many(3,()=>4.4,()=>4,{},(x,z,ry)=>K.celeiro(ctx,x,z,ry));
    free(3,2,(x,z,ry)=>K.rack(ctx,x,z,ry),{r0:14,r1:30});place(2.8,2.8,{mode:'edge',r0:22,r1:16,door:false},(x,z)=>K.poco(ctx,x,z));
    free(7,1.6,(x,z)=>ctx.K.tree(ctx,x,z,1+R()*.2,M.leafDark));cabanas();break;}
   case 'oriental':{
    // portal torii no fim da estrada principal; lanternas de pedra na praça
    {const tx2=40,tz=mz(tx2),sl=A1*f1*Math.cos(tx2*f1)+A2*f2*Math.cos(tx2*f2);K.torii(ctx,tx2,tz,Math.atan2(-1,-sl));}
    for(const [x,z] of [[-3.8,4],[3.8,-4],[-3.8,-4],[3.8,4]])K.toro(ctx,x,z);K.cerejeira(ctx,0,0,1.25);
    place(6.4,6.4,{},(x,z,ry)=>K.pagode(ctx,x,z,ry));
    many(7,rr(5.8,6.8),rr(4.8,5.6),{},(x,z,ry,w,d)=>K.casa(ctx,x,z,ry,{w,d}));
    for(let i=0;i<2;i++){const r=3.3+R()*.8;place(r*2+1.6,r*2+1.6,{mode:'free',door:false,r0:14,r1:28},(x,z)=>K.lago(ctx,x,z,r));}
    free(9,1.4,(x,z)=>K.cerejeira(ctx,x,z,.9+R()*.3));free(4,1.2,(x,z)=>K.bambu(ctx,x,z,8));cabanas();break;}
   case 'cogumelos':{
    K.anel(ctx,0,0,3.6,14);K.poco(ctx,0,0.01);
    const caps=[M.capRed,M.capPurple,M.capTeal,M.capOrange,M.capPink];let ci=0;
    many(3,()=>6.4,()=>6.4,{},(x,z,ry)=>K.grande(ctx,x,z,ry,{cap:caps[(ci++)%5]}));
    many(5,()=>4.8,()=>4.8,{},(x,z,ry)=>K.casa(ctx,x,z,ry,{cap:caps[(ci++)%5],sr:1.8+R()*.3,sh:3+R()*.5,cr:3.5+R()*.4}));
    free(11,1.4,(x,z)=>K.brilho(ctx,x,z,6));free(6,.5,(x,z)=>K.flor(ctx,x,z));cabanas();break;}
  }
  // ----- grades de madeira só em trechos das margens das estradas -----
  const offsetLine=(pts,off)=>pts.map((p,i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];let dx=b.x-a.x,dz=b.z-a.z;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;return {x:p.x-dz*off,z:p.z+dx*off};});
  const ph=R()*6,ph2=R()*6;
  const stubNear=(x,z)=>stubs.some(s=>Math.hypot(x-s.x,z-s.z)<2.6);
  const gate=(x,z)=>Math.hypot(x,z)<10.8||stubNear(x,z)||Math.sin(x*.115+z*.17+ph)>.3;
  for(const side of [-1,1])VM.fence(ctx,offsetLine(main.filter(p=>p.x<=58),side*3.0),site.fence,gate);
  // ao longo da ligação com o castelo: lances de 22 m a cada ~38 m
  for(const side of [-1,1]){const cp=offsetLine(main.filter(p=>p.x>=58),side*3.0);VM.fence(ctx,cp,site.fence,(x)=>((x-58)%38)>22);}
  for(const side of [-1,1])VM.fence(ctx,offsetLine(cross,side*2.8),site.fence,(x,z)=>Math.hypot(x,z)<10.8||stubNear(x,z)||Math.sin(x*.2+z*.13+ph2)>.2);
  for(const b of branches)for(const side of [-1,1])VM.fence(ctx,offsetLine(b,side*2.4),site.fence,(x,z)=>stubNear(x,z)||Math.sin(x*.19+z*.15+ph)>-.1);
  VM.mergeInto(ctx.g,ctx.group,site.nome+' · construções');
 }

 /* ================= ACAMPAMENTOS SOLTOS ================= */
 for(let i=0;i<CAMPS.length;i++){
  const c=CAMPS[i],ctx=makeCtx('Acampamento '+(i+1)+(c.lit?' (aceso)':' (apagado)'),c.x,c.z,c.rot);
  VM.camp(ctx,0,0,0,{lit:c.lit,kind:c.kind,mat:c.mat,two:i%3!==1});
  VM.mergeInto(ctx.g,ctx.group,'Acampamento '+(i+1));
 }
 VM.startAnim();
 console.info('[Vilas] 6 vilas e '+CAMPS.length+' acampamentos montados');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
