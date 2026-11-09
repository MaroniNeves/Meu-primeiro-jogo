/* Masmorras em cavernas, espalhadas pela floresta.
   Cada uma é uma colina de rocha com a boca de uma caverna; atrás da boca há um labirinto de 5x5 salas
   de pedra (gerado por sorteio, com passagens, laços e uma sala do chefe no ponto mais distante),
   iluminado por tochas e decorado conforme o tema:
     cripta (sarcófagos, ossos), prisão (celas de grades, correntes), cofre do dragão (baús e ouro),
     mina (escoras, trilhos, vagonete, cristais) e gruta (estalagmites, lago subterrâneo, cristais).
   Ao entrar, a colina e o teto somem para a câmera ver as salas (como no castelo); na primeira pessoa o teto aparece. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const PI=Math.PI,TAU=PI*2,CASTLE={x:0,z:-230};
const SITES=[
 {id:'cripta',nome:'Cripta dos Esquecidos',x:248,z:-495,seed:11},
 {id:'prisao',nome:'Prisão da Colina',x:204,z:-373,seed:22},
 {id:'cofre',nome:'Cofre do Dragão',x:77,z:-576,seed:33},
 {id:'mina',nome:'Mina Abandonada',x:-236,z:-466,seed:44},
 {id:'gruta',nome:'Gruta Cristalina',x:177,z:-531,seed:55}
];
for(const s of SITES){s.rot=Math.atan2(CASTLE.x-s.x,CASTLE.z-s.z);}
(window.arcanoClearings=window.arcanoClearings||[]);for(const s of SITES)window.arcanoClearings.push({x:s.x,z:s.z,r:35});
window.arcanoMasmorras=SITES;
const NG=[];(window.arcanoNoGrass=window.arcanoNoGrass||[]).push((x,z)=>{for(let i=0;i<NG.length;i++){const n=NG[i];if(Math.hypot(x-n[0],z-n[1])<n[2])return true;}return false;});
const mkRng=seed=>{let s=(seed>>>0)||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};};
const G=5,C=7.2,HALF=G*C/2,HW=4.4,TK=.8;           // 5x5 salas de 7,2 m, paredes de 0,8 m e 4,4 m de altura

function install(){
 const api=window.arcanoWaterV1226,VM=window.__vm,O=window.arcanoObstacles,H=window.arcanoIslandHeight,AT=window.arcanoTex;
 if(!api||!api.scene||!H||!O||!VM||!VM.makeMats||!AT){setTimeout(install,500);return;}
 const scene=api.scene,{box,cyl,sph,cone,rod}=VM;
 const M=VM.makeMats();
 const at=(t,sc,o)=>new T.MeshStandardMaterial(Object.assign({map:t.map,bumpMap:t.bump,bumpScale:sc,roughness:1},o||{}));
 M.rock=at(AT.stone({hue:215,sat:7,l0:34,l1:50,seed:201,rows:5,moss:.5,cracks:.4}),1.3,{vertexColors:true});
 M.rockPlain=at(AT.stone({hue:215,sat:7,l0:34,l1:50,seed:201,rows:5,moss:.5,cracks:.4}),1.3);
 M.dwall=at(AT.stone({hue:225,sat:9,l0:28,l1:42,seed:202,rows:6,moss:.45,cracks:.3}),1.1);
 M.dfloor=at(AT.marble({n:8,dark:26,light:36,seed:203}),.6);
 M.dceil=at(AT.stone({hue:225,sat:8,l0:22,l1:34,seed:204,rows:5}),.9);
 M.coin=new T.MeshStandardMaterial({color:'#ffd35a',emissive:new T.Color('#a06a10'),emissiveIntensity:.5,roughness:.35,metalness:.4});
 M.bone=new T.MeshStandardMaterial({color:'#efe6d0',roughness:1});
 M.eye=new T.MeshStandardMaterial({color:'#1a1414',roughness:1});
 M.crystalC=new T.MeshStandardMaterial({color:'#bff8ff',emissive:new T.Color('#2fd0ff'),emissiveIntensity:1.7,roughness:.25});
 M.crystalP=new T.MeshStandardMaterial({color:'#f0c8ff',emissive:new T.Color('#c05cff'),emissiveIntensity:1.6,roughness:.25});
 M.web=new T.MeshStandardMaterial({color:'#e8e8e8',transparent:true,opacity:.35,side:T.DoubleSide,roughness:1});
 const tx=VM.TEX;
 const flameMat=new T.SpriteMaterial({map:tx.flame(),transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false});
 const glowMat=new T.SpriteMaterial({map:tx.glow(),transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false,opacity:.7});
 const root=new T.Group();root.name='Masmorras';scene.add(root);
 const label=document.createElement('div');label.id='masmorraLabel';label.style.cssText='position:fixed;top:92px;left:50%;transform:translateX(-50%);z-index:45;display:none;font:600 15px Georgia,serif;color:#fff5dc;background:rgba(30,24,40,.82);border:1px solid #9a8ac8;border-radius:10px;padding:6px 16px;pointer-events:none';document.body.appendChild(label);
 const dungeons=[];

 for(const site of SITES){
  const R=mkRng(site.seed*977+13),rnd=R;
  let gmax=-1e9,gmin=1e9;for(const dx of [-20,-10,0,10,20])for(const dz of [-20,-10,0,10,20]){const hh=H(site.x+dx,site.z+dz);gmax=Math.max(gmax,hh);gmin=Math.min(gmin,hh);}
  const ground=gmax,drop=Math.max(.6,ground-gmin)+.6,floorY=.22,rot=site.rot,c=Math.cos(rot),s=Math.sin(rot);
  const W=(lx,lz)=>({x:site.x+lx*c+lz*s,z:site.z-lx*s+lz*c});
  const group=new T.Group();group.name=site.nome;group.position.set(site.x,ground,site.z);group.rotation.y=rot;root.add(group);
  const live=new T.Group();group.add(live);
  const tmp=new T.Group(),ceilTmp=new T.Group(),shell=new T.Group();group.add(shell);
  const colBox=(lx,lz,hw,hd,ang)=>{const w=W(lx,lz);O.addBox({x:w.x,z:w.z,hw,hd,rot:rot+(ang||0)});};
  const colCircle=(lx,lz,r)=>{const w=W(lx,lz);O.addCircle(w.x,w.z,r);};

  /* ----- labirinto: árvore geradora por busca em profundidade + laços ----- */
  const openV=[],openH=[];for(let i=0;i<=G;i++){openV.push(new Array(G).fill(false));}for(let i=0;i<G;i++){openH.push(new Array(G+1).fill(false));}
  // openV[i][j]: parede vertical em x entre coluna i-1 e i, linha j; openH[i][j]: parede horizontal em z entre linha j-1 e j, coluna i
  const seen=new Set(),stack=[[2,4]],key=(i,j)=>i+','+j;seen.add(key(2,4));const dist={[key(2,4)]:0};
  while(stack.length){const [i,j]=stack[stack.length-1];const nb=[[i+1,j],[i-1,j],[i,j+1],[i,j-1]].filter(([a,b])=>a>=0&&a<G&&b>=0&&b<G&&!seen.has(key(a,b)));
   if(!nb.length){stack.pop();continue;}const [a,b]=nb[Math.floor(rnd()*nb.length)];seen.add(key(a,b));dist[key(a,b)]=dist[key(i,j)]+1;
   if(a!==i)openV[Math.max(a,i)][j]=true;else openH[i][Math.max(b,j)]=true;stack.push([a,b]);}
  for(let k=0;k<7;k++){const i=1+Math.floor(rnd()*(G-1)),j=Math.floor(rnd()*G);if(rnd()<.5)openV[i][j]=true;else openH[Math.floor(rnd()*G)][1+Math.floor(rnd()*(G-1))]=true;}
  let boss=[2,0],bd=-1;for(let i=0;i<G;i++)for(let j=0;j<G;j++){const d=dist[key(i,j)]+((i===2&&j===4)?-99:0);if(d>bd){bd=d;boss=[i,j];}}
  const cx=i=>-HALF+C*(i+.5),cz=j=>-HALF+C*(j+.5);
  const bossC={x:cx(boss[0]),z:cz(boss[1])};

  /* ----- paredes com passagens (vão de 2,8 m com verga) ----- */
  const WM=(site.id==='mina'||site.id==='gruta')?M.rockPlain:M.dwall;
  const wallSeg=(x,z,len,vertical,gap)=>{ // centro (x,z); gap = passagem
   const lw=vertical?TK:len,ld=vertical?len:TK;
   const put=(ox,oz,a,b)=>{const w=vertical?TK:a,d=vertical?a:TK;if(a<.05)return;box(tmp,w,HW,d,WM,ox,floorY-.02,oz,0,2.5);colBox(ox,oz,w/2,d/2,0);};
   if(!gap){const bw=vertical?TK:len+TK,bd2=vertical?len+TK:TK;box(tmp,bw,HW,bd2,WM,x,floorY-.02,z,0,2.5);colBox(x,z,bw/2,bd2/2,0);return;}
   const gw=2.8,sideLen=(len-gw)/2;
   if(vertical){put(x,z-(gw/2+sideLen/2),sideLen+TK/2,0);put(x,z+(gw/2+sideLen/2),sideLen+TK/2,0);}
   else{put(x-(gw/2+sideLen/2),z,sideLen+TK/2,0);put(x+(gw/2+sideLen/2),z,sideLen+TK/2,0);}
   box(tmp,vertical?TK:gw+.4,HW-3.1,vertical?gw+.4:TK,WM,x,floorY+3.1,z,0,2.5);       // verga sobre a passagem
  };
  for(let i=1;i<G;i++)for(let j=0;j<G;j++)wallSeg(-HALF+C*i,cz(j),C,true,openV[i][j]);
  for(let i=0;i<G;i++)for(let j=1;j<G;j++)wallSeg(cx(i),-HALF+C*j,C,false,openH[i][j]);
  // paredes externas (a entrada fica na coluna 2 do lado +z)
  wallSeg(0,-HALF,G*C,false,false);wallSeg(-HALF,0,G*C,true,false);wallSeg(HALF,0,G*C,true,false);
  {const gw=2.8,sl=(G*C-gw)/2;for(const sgn of [-1,1]){const ox=sgn*(gw/2+sl/2);box(tmp,sl+TK/2,HW,TK,WM,ox,floorY-.02,HALF,0,2.5);colBox(ox,HALF,(sl+TK/2)/2,TK/2,0);}box(tmp,gw+.4,HW-3.1,TK,WM,0,floorY+3.1,HALF,0,2.5);}
  // piso (labirinto + túnel de entrada) e tetos por sala
  box(tmp,G*C+TK*2,.3+drop,G*C+TK*2,M.dfloor,0,floorY-.3-drop,0,0,3);box(tmp,5.6,.3+drop,3.4,M.dfloor,0,floorY-.3-drop,HALF+1.5,0,3);
  {const fw=W(0,HALF+14),yf=H(fw.x,fw.z)-ground+floorY,P=[],U=[];VM.pushQuad(P,U,[-2.8,floorY,HALF+3],[2.8,floorY,HALF+3],[2.8,yf,HALF+14],[-2.8,yf,HALF+14],[0,0],[1.9,0],[1.9,3.8],[0,3.8]);VM.roofMesh(tmp,P,U,M.dfloor,0,0,0);window.__rampY=window.__rampY||{};window.__rampY[site.id]=yf;}
  for(let i=0;i<G;i++)for(let j=0;j<G;j++)box(ceilTmp,C+TK,.5,C+TK,M.dceil,cx(i),floorY+HW,cz(j),0,3);

  /* ----- tochas: suporte + chama animada ----- */
  const flames=[];
  const torch=(x,z,faceX,faceZ)=>{ // faceX/faceZ: direção para onde a chama olha (para dentro da sala)
   const y=floorY+2.0;box(tmp,.14,.7,.14,M.woodDark,x,y,z,0,1);box(tmp,.3,.1,.3,M.iron,x,y+.65,z,0,1);cyl(tmp,.12,.08,.16,M.iron,x+faceX*.15,y+.7,z+faceZ*.15,6,1);
   const f=new T.Sprite(flameMat);f.center.set(.5,.1);f.position.set(x+faceX*.15,y+.85,z+faceZ*.15);f.scale.set(.5,.9,1);live.add(f);flames.push({s:f,k:.9,ph:rnd()*6,sp:8+rnd()*5});
   const gl=new T.Sprite(glowMat);gl.position.set(x+faceX*.3,y+1.0,z+faceZ*.3);gl.scale.set(3,3,1);live.add(gl);VM.anim.glows.push({s:gl,base:3,night:false,ph:rnd()*6});};
  const torchesAt=[];
  for(let i=0;i<G;i++)for(let j=0;j<G;j++){if(rnd()<.62){const side=Math.floor(rnd()*4),off=(rnd()-.5)*2;
   if(side===0)torchesAt.push([cx(i)+off,cz(j)-C/2+TK/2+.05,0,1]);else if(side===1)torchesAt.push([cx(i)+off,cz(j)+C/2-TK/2-.05,0,-1]);else if(side===2)torchesAt.push([cx(i)-C/2+TK/2+.05,cz(j)+off,1,0]);else torchesAt.push([cx(i)+C/2-TK/2-.05,cz(j)+off,-1,0]);}}
  for(const t of torchesAt)torch(...t);
  for(const sg of [-1,1])torch(sg*1.8,HALF-TK/2-.05,0,-1);
  VM.anim.flames.push(...flames);

  /* ----- decoração por tema ----- */
  const bone=(x,z)=>{for(let k=0;k<5;k++){const b=cyl(tmp,.04,.05,.5+rnd()*.3,M.bone,x+(rnd()-.5)*.9,floorY+.04,z+(rnd()-.5)*.9,5,1);b.rotation.z=PI/2;b.rotation.y=rnd()*3;b.position.y=floorY+.06;}
   const sk=sph(tmp,.17,M.bone,x,floorY+.18,z,1,.9,1,8);sph(tmp,.04,M.eye,x-.06,floorY+.22,z+.14,1,1,1,5);sph(tmp,.04,M.eye,x+.06,floorY+.22,z+.14,1,1,1,5);};
  const sarco=(x,z,ry,big)=>{const k=big?1.5:1;box(tmp,1.1*k,.8,2.3*k,M.stone,x,floorY,z,ry,1.6);box(tmp,1.25*k,.28,2.45*k,M.stoneDark,x,floorY+.8,z,ry,1.6);box(tmp,.18,.04,.9*k,M.gold,x,floorY+1.08,z,ry,1);box(tmp,.5*k,.04,.18,M.gold,x,floorY+1.08,z,ry,1);colBox(x,z,.65*k*Math.abs(Math.cos(ry))+1.2*k*Math.abs(Math.sin(ry)),.65*k*Math.abs(Math.sin(ry))+1.2*k*Math.abs(Math.cos(ry)),0);};
  const urn=(x,z)=>{cyl(tmp,.28,.22,.7,M.roofTerra,x,floorY,z,8,1);sph(tmp,.3,M.roofTerra,x,floorY+.75,z,1,.8,1,8);colCircle(x,z,.35);};
  const web=(x,z,ry)=>{const w=new T.Mesh(new T.PlaneGeometry(2.0,2.0),M.web);w.position.set(x,floorY+HW-1.1,z);w.rotation.set(0,ry,0);w.rotation.x=.25;tmp.add(w);};
  const chest=(x,z,ry,gold)=>{box(tmp,1.1,.6,.7,M.wood,x,floorY,z,ry,1.4);const lid=cyl(tmp,.36,.36,1.1,M.wood,0,0,0,10,1.4);lid.rotation.z=PI/2;lid.rotation.y=ry;lid.position.set(x,floorY+.6,z);lid.scale.set(1,1,1);
   box(tmp,1.14,.1,.74,M.gold,x,floorY+.28,z,ry,1);box(tmp,.14,.3,.8,M.gold,x,floorY+.34,z,ry,1);if(gold)for(let k=0;k<5;k++)sph(tmp,.07,M.coin,x+(rnd()-.5)*.7,floorY+.86+rnd()*.1,z+(rnd()-.5)*.4,1,.6,1,6);colCircle(x,z,.7);};
  const goldPile=(x,z,sc)=>{cone(tmp,1.3*sc,.9*sc,M.coin,x,floorY,z,12,1);for(let k=0;k<26;k++){const a=rnd()*TAU,r=rnd()*1.6*sc;const c2=cyl(tmp,.1,.1,.03,M.coin,x+Math.cos(a)*r,floorY+.02+rnd()*.2,z+Math.sin(a)*r,8,1);c2.rotation.x=(rnd()-.5);c2.rotation.z=(rnd()-.5);}colCircle(x,z,1.1*sc);};
  const crystal=(x,z,sc,m)=>{for(let k=0;k<5;k++){const h=(.6+rnd()*1.4)*sc,a=rnd()*TAU,r=rnd()*.5*sc,o=cone(tmp,.2*sc,h,m,x+Math.cos(a)*r,floorY,z+Math.sin(a)*r,5,1);o.rotation.x=(rnd()-.5)*.5;o.rotation.z=(rnd()-.5)*.5;}colCircle(x,z,.7*sc);ctxGlow(x,z,m===M.crystalC?'#4fe0ff':'#c05cff');};
  const ctxGlow=(x,z,col)=>{const m=new T.SpriteMaterial({map:tx.glow(),color:col,transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false,opacity:.55});const g=new T.Sprite(m);g.position.set(x,floorY+.9,z);g.scale.set(3.2,3.2,1);live.add(g);};
  const stalag=(x,z,sc)=>{const h=(.8+rnd()*1.8)*sc;cone(tmp,.38*sc,h,M.rockPlain,x,floorY,z,6,1.5);colCircle(x,z,.4*sc);};
  const post=(x,z)=>{box(tmp,.3,3.2,.3,M.wood,x,floorY,z,0,1.2);};
  const bars=(x,z,ry,len)=>{const g2=new T.Group();g2.position.set(x,floorY,z);g2.rotation.y=ry;tmp.add(g2);for(let k=0;k<=Math.round(len/.3);k++)cyl(g2,.03,.03,3.2,M.iron,-len/2+k*.3,0,0,5,1);rod(g2,-len/2,.4,0,len/2,.4,0,.04,M.iron,5);rod(g2,-len/2,3.0,0,len/2,3.0,0,.04,M.iron,5);colBox(x,z,Math.abs(Math.cos(ry))*len/2+.12,Math.abs(Math.sin(ry))*len/2+.12,0);};
  const cart=(x,z,ry)=>{const g2=new T.Group();g2.position.set(x,floorY,z);g2.rotation.y=ry;tmp.add(g2);box(g2,1.5,.7,1.0,M.woodDark,0,.35,0,0,1);for(const sx of [-.55,.55])for(const sz of [-.5,.5]){const w=cyl(g2,.22,.22,.1,M.iron,0,0,0,10,1);w.rotation.x=PI/2;w.position.set(sx,.22,sz*1.05);}for(let k=0;k<6;k++)sph(g2,.15,M.stoneDark,(rnd()-.5)*1.0,1.05+rnd()*.1,(rnd()-.5)*.6,1,.8,1,5);colCircle(x,z,.9);};
  const rails=(x0,z0,x1,z1)=>{const L=Math.hypot(x1-x0,z1-z0),an=Math.atan2(-(z1-z0),x1-x0);const g2=new T.Group();g2.position.set((x0+x1)/2,floorY,(z0+z1)/2);g2.rotation.y=an;tmp.add(g2);for(const sz of [-.45,.45])box(g2,L,.08,.08,M.iron,0,.12,sz,0,1);for(let k=-L/2+.4;k<L/2;k+=.9)box(g2,.2,.07,1.2,M.woodDark,k,.04,0,0,1);};
  const cx0=i=>cx(i),cz0=j=>cz(j);
  const cells=[];for(let i=0;i<G;i++)for(let j=0;j<G;j++)if(!(i===2&&j===4)&&!(i===boss[0]&&j===boss[1]))cells.push([i,j]);
  const pickOff=()=>[(rnd()-.5)*3.2,(rnd()-.5)*3.2];
  const theme=site.id;
  for(const [i,j] of cells){
   const x=cx(i),z=cz(j),[ox,oz]=pickOff(),k=rnd();
   if(theme==='cripta'){ if(k<.5)sarco(x+ox*.5,z+oz*.5,rnd()<.5?0:PI/2);else if(k<.75){urn(x+ox,z+oz);urn(x-ox,z-oz+.8);bone(x+oz,z-ox);}else{bone(x+ox,z+oz);bone(x-ox,z-oz);} if(rnd()<.5)web(x-C/2+TK+.1,z+oz,PI/2); }
   else if(theme==='prisao'){ if(k<.55){bars(x,z+1.2,0,C-1.6);bars(x-C/2+1.8,z-.2,PI/2,2.6);box(tmp,1.6,.3,.9,M.hay,x-.6,floorY,z-1.3,0,1);bone(x+1.4,z-1.5);} else if(k<.8){bone(x+ox,z+oz);box(tmp,.4,.3,.4,M.woodDark,x+oz,floorY,z-ox,0,1);} else {barrel(tmp,M,x+ox,floorY,z+oz);barrel(tmp,M,x-ox,floorY,z-oz+.6);} }
   else if(theme==='cofre'){ if(k<.45){chest(x+ox*.4,z+oz*.4,rnd()*3,true);}else if(k<.75){goldPile(x+ox*.3,z+oz*.3,.8+rnd()*.5);}else{box(tmp,1.0,3,1.0,M.stoneDark,x+ox*.4,floorY,z,0,1.6);box(tmp,1.3,.3,1.3,M.stone,x+ox*.4,floorY+3,z,0,1.6);colCircle(x+ox*.4,z,.7);chest(x-1.6,z+1.4,.6,false);} }
   else if(theme==='mina'){ post(x-C/2+.8,z-1.6);post(x-C/2+.8,z+1.6);box(tmp,.3,.3,3.6,M.wood,x-C/2+.8,floorY+3.1,z,0,1.2); if(k<.5){rails(x-C/2+.5,z+.4,x+C/2-.5,z+.4);} if(k<.28)cart(x+1.2,z-1.4,.4);else if(k<.6)crystal(x+ox,z-1.8,.8,rnd()<.5?M.crystalC:M.crystalP); else{for(let q=0;q<4;q++){const r2=sph(tmp,.4+rnd()*.3,M.stoneDark,x+(rnd()-.5)*3,floorY+.3,z+(rnd()-.5)*3,1,.7,1,6);}} }
   else { // gruta
    if(k<.5){for(let q=0;q<3;q++)stalag(x+(rnd()-.5)*4.4,z+(rnd()-.5)*4.4,.8+rnd()*.7);} else if(k<.8)crystal(x+ox,z+oz,.9+rnd()*.5,rnd()<.5?M.crystalC:M.crystalP); else{bone(x+ox,z+oz);stalag(x-ox,z-oz,1);}
   }
  }
  // sala do chefe
  {const x=bossC.x,z=bossC.z;
   if(theme==='cripta'){box(tmp,3.6,.5,5.0,M.stone,x,floorY,z,0,2);sarco(x,z,0,true);for(const sx of [-1,1]){for(const sz of [-1,1]){cyl(tmp,.28,.34,3.2,M.stone,x+sx*2.8,floorY,z+sz*2.4,8,1.5);const f=new T.Sprite(flameMat);f.center.set(.5,.1);f.position.set(x+sx*2.8,floorY+3.25,z+sz*2.4);f.scale.set(.6,1.1,1);live.add(f);VM.anim.flames.push({s:f,k:1.1,ph:rnd()*6,sp:8+rnd()*4});}}ctxGlow(x,z,'#80ffd0');}
   else if(theme==='prisao'){box(tmp,2.6,.9,1.2,M.woodDark,x,floorY,z-1.6,0,1.5);box(tmp,2.8,.1,1.4,M.wood,x,floorY+.9,z-1.6,0,1.5);for(let k=0;k<4;k++)rod(tmp,x-1.6+k*1.1,floorY+2.8,z+2.6,x-1.6+k*1.1,floorY+1.3,z+2.6,.025,M.iron,4);bars(x,z+1.0,0,C-1.4);bone(x+1.8,z+2.2);chest(x-2.3,z-2.0,.4,false);}
   else if(theme==='cofre'){goldPile(x,z,2.1);chest(x-2.4,z-1.6,.5,true);chest(x+2.2,z-1.9,-.4,true);chest(x+2.6,z+1.6,-1.1,true);crystal(x-2.6,z+2.2,1,M.crystalP);const col=cone(tmp,.9,2.6,M.stoneDark,x,floorY+1.4,z-2.0,6,1);}
   else if(theme==='mina'){crystal(x,z,2.2,M.crystalC);crystal(x+2.4,z-1.4,1.2,M.crystalP);cart(x-2.2,z+1.6,1.1);rails(x-C/2+.5,z+2.4,x,z+2.4);post(x-C/2+.8,z-1.6);post(x-C/2+.8,z+1.6);}
   else{cyl(tmp,2.6,2.6,.1,M.water,x,floorY,z,18,2);cyl(tmp,2.9,3.0,.35,M.rockPlain,x,floorY-.1,z,18,2);crystal(x,z,1.6,M.crystalC);crystal(x+3.0,z-1.8,1.1,M.crystalP);crystal(x-2.9,z+1.9,1.0,M.crystalC);for(let q=0;q<5;q++)stalag(x+(rnd()-.5)*6,z+(rnd()-.5)*6,1);}
   colCircle(x,z,1.2);
  }
  // luz da entrada e plaquinha
  {const tf=new T.Sprite(glowMat);tf.position.set(0,floorY+1.5,HALF+3);tf.scale.set(5,5,1);live.add(tf);VM.anim.glows.push({s:tf,base:5,night:false,ph:rnd()*6});}
  VM.mergeInto(tmp,group,site.nome+' · salas');
  const ceilMesh=new T.Group();group.add(ceilMesh);VM.mergeInto(ceilTmp,ceilMesh,site.nome+' · teto');

  /* ----- colina de rocha com a boca da caverna ----- */
  {const NA=72,NR=14,a=23.5,n=4,Hmax=10.5,P=[],Nn=[],U=[],Cc=[],I=[];
   const rs=phi=>a/Math.pow(Math.pow(Math.abs(Math.cos(phi)),n)+Math.pow(Math.abs(Math.sin(phi)),n),1/n);
   const noise=(x,z)=>.9*Math.sin(x*.31+z*.17)+.7*Math.sin(x*.13-z*.37+2)+.5*Math.sin(x*.57+z*.49)+.35*Math.sin(x*1.1-z*.9);
   const sector=(phi,t)=>Math.abs(Math.atan2(Math.sin(phi),Math.cos(phi)))<.27&&t>.66;
   for(let i=0;i<=NA;i++)for(let j=0;j<=NR;j++){
    const phi=i/NA*TAU,t=j/NR,r=rs(phi)*(t<.001?0:Math.max(.02,t)),x=Math.sin(phi)*r,z=Math.cos(phi)*r;
    let h=Hmax*Math.pow(1-Math.pow(t,2.6),.8)+noise(x,z)*(.35+.5*Math.sin(t*PI))*1.5;
    if(t>.985)h=-drop;
    P.push(x,Math.max(-drop,h),z);Nn.push(0,1,0);U.push(x*.16,z*.16+h*.12);
    const mo=Math.max(0,Math.min(1,(h/Hmax)*.9+.15*Math.sin(x*.4)));Cc.push(1-mo*.35,1,1-mo*.5);
   }
   const ring=NR+1;
   for(let i=0;i<NA;i++)for(let j=0;j<NR;j++){const t=(j+.5)/NR,phi=(i+.5)/NA*TAU;if(sector(phi,t))continue;const q=i*ring+j,q2=(i+1)*ring+j;I.push(q,q+1,q2,q2,q+1,q2+1);}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('uv',new T.Float32BufferAttribute(U,2));g.setAttribute('color',new T.Float32BufferAttribute(Cc,3));g.setIndex(I);g.computeVertexNormals();
   const mound=new T.Mesh(g,M.rock);mound.name=site.nome+' · colina';mound.castShadow=true;mound.receiveShadow=true;mound.material.side=T.DoubleSide;shell.add(mound);
   // boca da caverna: ombreiras e verga de rocha, estalactites e pedras soltas
   const rockBox=(w,h,d,x,y,z,ry)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),M.rockPlain);b.position.set(x,y+h/2,z);b.rotation.y=ry||0;b.castShadow=true;shell.add(b);return b;};
   for(const sg of [-1,1]){rockBox(2.2,7.1+drop,12.5,sg*3.8,-drop,HALF+2.75,0);rockBox(1.8,3.9+drop,9,sg*5.6,-drop,HALF+5.5,-sg*.2);}
   rockBox(10,3.8,12.5,0,4.4,HALF+2.75,0);rockBox(7,1.8,8,0,8.1,HALF+1.5,.06);
   for(let k=0;k<12;k++){const sg=k%2?1:-1,rk=new T.Mesh(new T.IcosahedronGeometry(1.1+rnd()*1.5,1),M.rockPlain);rk.position.set(sg*(3.6+rnd()*3.4),.3+rnd()*2.6,HALF+1+rnd()*9);rk.scale.set(1,.8,1);rk.rotation.set(rnd()*3,rnd()*3,rnd()*3);rk.castShadow=true;shell.add(rk);}
   for(let k=0;k<7;k++){const st=cone(shell,.22+rnd()*.12,.9+rnd()*1.0,M.rockPlain,(rnd()-.5)*4,0,HALF+1.5+rnd()*5,5,1);st.rotation.x=PI;st.position.y=4.6+.3;}
   for(let k=0;k<16;k++){const ang=rnd()*TAU,r=rs(ang)*(.95+rnd()*.08);if(Math.abs(Math.atan2(Math.sin(ang),Math.cos(ang)))<.34)continue;const rk=new T.Mesh(new T.IcosahedronGeometry(1.4+rnd()*1.8,1),M.rockPlain);rk.position.set(Math.sin(ang)*r,.4+rnd()*.6,Math.cos(ang)*r);rk.scale.set(1,.7,1);rk.rotation.set(rnd()*3,rnd()*3,rnd()*3);rk.castShadow=true;shell.add(rk);
     colCircle(Math.sin(ang)*r,Math.cos(ang)*r,1.8);}
   // colisão do perímetro da colina (fora da boca) — um anel de pedras
   for(let k=0;k<44;k++){const ang=k/44*TAU;if(Math.abs(Math.atan2(Math.sin(ang),Math.cos(ang)))<.36)continue;const r=rs(ang)*.93;colCircle(Math.sin(ang)*r,Math.cos(ang)*r,2.1);}
   // paredes do túnel de entrada
   for(const sg of [-1,1])colBox(sg*2.7,HALF+7,.3,7.2,0);
  }
  NG.push([site.x,site.z,34]);

  // piso: dentro do labirinto e no túnel
  (window.arcanoGroundOverrides=window.arcanoGroundOverrides||[]).push((x,z)=>{
   const dx=x-site.x,dz=z-site.z,lx=dx*c-dz*s,lz=dx*s+dz*c;
   if((Math.abs(lx)<HALF-.3&&Math.abs(lz)<HALF-.3)||(Math.abs(lx)<2.7&&lz>=HALF-.3&&lz<HALF+3.1))return ground+floorY+.05;
   if(Math.abs(lx)<2.7&&lz>=HALF+3.1&&lz<HALF+14){const yf=window.__rampY[site.id],t=(lz-(HALF+3))/11;return ground+floorY+.05+(yf-floorY)*t;}return null;});
  dungeons.push({site,group,shell,ceil:ceilMesh,lx:(x,z)=>{const dx=x-site.x,dz=z-site.z;return [dx*c-dz*s,dx*s+dz*c];}});
 }
 VM.startAnim();window.arcanoMasmorrasObj=dungeons;

 // dentro: colina e teto somem (câmera por cima); na primeira pessoa o teto volta
 let cur=null,saved=null;
 (function frame(){requestAnimationFrame(frame);
  const p=api.getGrassPlayer&&api.getGrassPlayer();if(!p)return;
  let found=null;
  for(const d of dungeons){const [lx,lz]=d.lx(p.position.x,p.position.z);if(Math.abs(lx)<HALF+TK&&Math.abs(lz)<HALF+TK||(Math.abs(lx)<2.9&&lz>=HALF&&lz<HALF+10)){found=d;break;}}
  if(found!==cur){
   if(cur){cur.shell.visible=true;cur.ceil.visible=true;}
   cur=found;
   if(cur){saved={d:p.camDistance,pt:p.camPitch};p.camDistance=Math.min(Math.max(p.camDistance,7),9);p.camPitch=Math.max(p.camPitch,1.25);}
   else if(saved){p.camDistance=saved.d;p.camPitch=saved.pt;saved=null;label.style.display='none';}
  }
  if(cur){const [lx,lz]=cur.lx(p.position.x,p.position.z),inRoom=Math.abs(lx)<HALF&&Math.abs(lz)<HALF;
   const fp=!!(window.arcanoFirstPerson&&window.arcanoFirstPerson.active);
   cur.shell.visible=!inRoom;cur.ceil.visible=inRoom&&fp;
   label.textContent=cur.site.nome;label.style.display='block';}
 })();
 console.info('[Masmorras] '+dungeons.length+' masmorras montadas');
}
function barrel(g,M,x,y,z){VM_cyl(g,.4,.4,.8,M.woodDark,x,y,z,10,1.2);}
function VM_cyl(g,r1,r2,h,m,x,y,z,seg,tile){const VMx=window.__vm;return VMx.cyl(g,r1,r2,h,m,x,y,z,seg,tile);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
