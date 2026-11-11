/* Seis estilos de vila, cada um com casas, cabanas e marcos próprios:
   moinho (campo), lenhadores (toras), mediterrânea (branca e telha), nórdica (casa longa com teto de grama),
   oriental (pagodes e torii) e cogumelos (casas-cogumelo). Cada construtor recebe (ctx, x, z, ry, opções):
   posição e giro no sistema local da vila; a frente da construção aponta para +z antes do giro. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const VM=window.__vm;
if(!VM)return;
const {box,cyl,sph,cone,rod}=VM,rnd=VM.rnd,PI=Math.PI;
const F=.5;                           // altura do piso sobre o chão (soco de pedra)
const KIT=VM.KIT={};

/* ---------- Peças comuns ---------- */
// Grupo da construção: assenta no ponto mais alto do terreno sob a planta e desce um soco de pedra até o mais baixo.
function base(ctx,x,z,ry,w,d,plinthM){
 const pd=ctx.pad(x,z,w+.5,d+.5,ry),bg=new T.Group();bg.position.set(x,pd.y,z);bg.rotation.y=ry;ctx.g.add(bg);
 box(bg,w+.4,pd.depth+F,d+.4,plinthM||ctx.M.stone,0,-pd.depth,0,0,2);
 ctx.colBox(x,z,w/2+.15,d/2+.15,ry);ctx.noGrassC(x,z,Math.max(w,d)*.62+1.8);
 return bg;
}
function doorAt(bg,M,x,z,w,h,leaf,frame,arch){
 box(bg,w,h,.1,leaf,x,F,z+.02,0,1.2);
 for(const s of [-1,1])box(bg,.14,h+.14,.22,frame,x+s*(w/2+.07),F,z,0,1);
 box(bg,w+.42,.16,.24,frame,x,F+h,z,0,1);
 sph(bg,.045,M.gold,x+w*.32,F+h*.5,z+.09,1,1,1,6);
 if(arch){const a=new T.Mesh(new T.TorusGeometry(w/2+.08,.08,6,14,PI),frame);a.position.set(x,F+h,z+.02);bg.add(a);const d=new T.Mesh(new T.CircleGeometry(w/2,14,0,PI),leaf);d.position.set(x,F+h,z+.07);bg.add(d);}
 box(bg,w+.5,.12,.6,M.stone,x,F-.12,z+.4,0,1.5);
}
function winAt(bg,M,x,y,z,ry,w,h,o){
 o=o||{};const wg=new T.Group();wg.position.set(x,y,z);wg.rotation.y=ry;bg.add(wg);          // origem = centro da janela
 box(wg,w,h,.08,M.glass,0,-h/2,.02,0,1);
 const fm=o.frame||M.woodDark;
 box(wg,w+.26,.11,.2,fm,0,-h/2-.11,.05,0,1);box(wg,w+.26,.1,.16,fm,0,h/2,.03,0,1);
 for(const s of [-1,1])box(wg,.1,h,.16,fm,s*(w/2+.06),-h/2,.03,0,1);
 box(wg,w,.05,.1,fm,0,-.02,.05,0,1);box(wg,.05,h,.1,fm,0,-h/2,.05,0,1);
 if(o.shut)for(const s of [-1,1])box(wg,w*.5,h,.05,o.shut,s*(w/2+w*.31),-h/2,.02,0,1);
 if(o.flowers){box(wg,w+.2,.2,.3,M.wood,0,-h/2-.34,.2,0,1);const cl=[M.pink,M.hay,M.capPurple];for(let i=0;i<4;i++)sph(wg,.1,cl[i%3],-w*.36+i*w*.24,-h/2-.14,.22,1,1,1,6);}
}
function lie(g,r,len,m,x,yc,z,axis){const c=cyl(g,r,r,len,m,0,0,0,7,1);if(axis==='x')c.rotation.z=PI/2;else c.rotation.x=PI/2;c.position.set(x,yc,z);return c;}
function chimney(bg,M,x,y,z,h,m){box(bg,.8,h,.8,m||M.stone,x,y,z,0,1.5);box(bg,1.0,.16,1.0,M.stoneDark,x,y+h,z,0,1.5);}
function barrel(g,M,x,y,z){cyl(g,.4,.4,.8,M.woodDark,x,y,z,10,1.2);for(const hh of [.14,.62])cyl(g,.42,.42,.06,M.iron,x,y+hh,z,10,1);}
function woodpile(ctx,x,z,ry,len){
 len=len||2.4;const y=ctx.gy(x,z),M=ctx.M,g=new T.Group();g.position.set(x,y,z);g.rotation.y=ry;ctx.g.add(g);
 for(let row=0;row<4;row++)for(let i=0;i<5-row;i++){const l=cyl(g,.15,.15,len,M.log,0,0,0,7,1);l.rotation.x=PI/2;l.position.set(-1.0+i*.31+row*.155,.16+row*.27,0);
  const e=new T.Mesh(new T.CircleGeometry(.14,7),M.deck);e.position.set(l.position.x,l.position.y,len/2+.01);g.add(e);}
 ctx.colBox(x,z,Math.cos(ry)*1.0+.9,.5,ry);
}
function hayBale(ctx,x,z,ry){const y=ctx.gy(x,z),g=ctx.g,M=ctx.M,b=cyl(g,.5,.5,.95,M.hay,x,y+.5,z,10,.8);b.rotation.x=PI/2;b.rotation.z=ry;b.position.y=y+.5;ctx.colCircle(x,z,.6);}
function tree(ctx,x,z,s,crown,trunkM){
 const M=ctx.M,y=ctx.gy(x,z),g=ctx.g;
 if(!(window.arcanoVillageTree&&window.arcanoVillageTree(g,x,y,z,s,crown===M.leafDark))){cyl(g,.16*s,.24*s,2.2*s,trunkM||M.bark,x,y,z,7,1.5);
 for(const [dx,dy,dz,r] of [[0,2.7,0,1.35],[.8,2.2,.3,.95],[-.7,2.35,-.3,1.0],[.1,3.3,.2,.85]])sph(g,r*s,crown||M.leaf,x+dx*s,y+dy*s,z+dz*s,1,.85,1,8);}
 ctx.colCircle(x,z,.45*s);ctx.noGrassC(x,z,1.4*s);
}
function well(ctx,x,z,o){
 o=o||{};const M=ctx.M,y=ctx.gy(x,z),g=ctx.g;
 cyl(g,1.15,1.2,.95,o.stone||M.stone,x,y,z,12,1.4);cyl(g,.82,.82,.04,M.water,x,y+.95,z,12,1);
 for(const s of [-1,1])box(g,.16,2.3,.16,M.woodDark,x+s*1.0,y+.5,z,0,1.5);
 box(g,2.4,.16,.16,M.woodDark,x,y+2.5,z,0,1.5);
 VM.gableRoof(g,2.6,1.9,.85,o.roof||M.roofShake,M.woodDark,x,y+2.65,z,.15,.2,2);
 cyl(g,.18,.18,.28,M.woodDark,x,y+1.0,z,8,1);rod(g,x,y+2.5,z,x,y+1.2,z,.015,M.cloth,3);
 ctx.colCircle(x,z,1.45);ctx.noGrassC(x,z,3);
}
function lanternPost(ctx,x,z,m){const M=ctx.M,y=ctx.gy(x,z),g=ctx.g;cyl(g,.07,.1,2.7,m||M.woodDark,x,y,z,6,1.5);box(g,.34,.4,.34,M.lantern,x,y+2.5,z,0,1);box(g,.46,.08,.46,M.iron,x,y+2.9,z,0,1);ctx.colCircle(x,z,.2);}
function cabinSign(ctx,x,z,ry){const M=ctx.M,y=ctx.gy(x,z),g=ctx.g;cyl(g,.05,.05,1.9,M.woodDark,x,y,z,5,1);box(g,.9,.38,.06,M.wood,x+.35*Math.cos(ry),y+1.25,z-.35*Math.sin(ry),ry,1);}

/* =============== 1. VILA DO MOINHO (campo) =============== */
KIT.moinho={
 casa(ctx,x,z,ry,o){o=o||{};const M=ctx.M,w=o.w||6.8,d=o.d||5.2,h=2.7,bg=base(ctx,x,z,ry,w,d);
  box(bg,w,1.0,d,M.stone,0,F,0,0,2);box(bg,w,h-1,d,M.plaster,0,F+1,0,0,2.5);
  for(const sx of [-1,1])for(const sz of [-1,1])box(bg,.22,h,.22,M.woodDark,sx*w/2,F,sz*d/2,0,1);
  box(bg,w+.12,.18,d+.12,M.woodDark,0,F+1,0,0,1.5);box(bg,w+.12,.2,d+.12,M.woodDark,0,F+h-.1,0,0,1.5);
  VM.hipRoof(bg,w+1.7,d+1.7,2.4,M.thatch,0,F+h,0,2.6);
  chimney(bg,M,w/2-1.2,F+h-.4,-d/4,3.0,M.stone);
  doorAt(bg,M,-w/4,d/2,1.1,2.1,M.wood,M.woodDark,true);
  winAt(bg,M,w/4+.3,F+1.9,d/2+.02,0,1.0,1.1,{shut:M.green,flowers:true,frame:M.woodDark});
  winAt(bg,M,w/2+.02,F+1.9,0,PI/2,1.0,1.1,{shut:M.green,frame:M.woodDark});winAt(bg,M,-w/2-.02,F+1.9,0,-PI/2,1.0,1.1,{shut:M.green,frame:M.woodDark});
  // lucarna de palha sobre a porta
  VM.gableRoof(bg,1.8,1.4,.8,M.thatch,M.plaster,-w/4,F+h+.5,d/2+.15,.2,.2,2);
  return bg;},
 celeiro(ctx,x,z,ry){const M=ctx.M,w=10,d=7.4,h=3.4,bg=base(ctx,x,z,ry,w,d);
  box(bg,w,h,d,M.woodDark,0,F,0,0,2.5);for(const sx of [-1,1])for(const sz of [-1,1])box(bg,.3,h,.3,M.wood,sx*w/2,F,sz*d/2,0,1);
  VM.gableRoof(bg,w,d,3.1,M.roofShake,M.woodDark,0,F+h,0,.7,.7,2.6);box(bg,w+1.6,.3,.5,M.woodDark,0,F+h+3.1,0,0,1.5);
  // portão duplo com X e janela do palheiro
  box(bg,3.6,3.0,.12,M.wood,0,F,d/2+.03,0,1.4);box(bg,.14,3.0,.2,M.woodDark,0,F,d/2+.06,0,1);
  for(const s of [-1,1]){const dg=box(bg,.14,3.4,.1,M.woodDark,s*.9,F-.1,d/2+.1,0,1);dg.rotation.z=s*.55;}
  box(bg,3.9,.16,.22,M.woodDark,0,F+3.0,d/2+.06,0,1);
  box(bg,1.0,1.1,.1,M.wood,0,F+h+.35,d/2+.05,0,1.2);box(bg,1.2,.1,.2,M.woodDark,0,F+h+.9,d/2+.08,0,1);
  winAt(bg,M,w/2-1.8,F+2.3,d/2+.02,0,.9,.9,{frame:M.woodDark});
  return bg;},
 silo(ctx,x,z,ry){const M=ctx.M,y=ctx.pad(x,z,4.2,4.2,ry),bg=new T.Group();bg.position.set(x,y.y,z);bg.rotation.y=ry;ctx.g.add(bg);
  cyl(bg,2.15,2.15,y.depth+.5,M.stone,0,-y.depth,0,14,2);cyl(bg,1.85,1.85,5.2,M.woodDark,0,.5,0,14,2.4);
  for(const hh of [1.2,2.8,4.4])cyl(bg,1.92,1.92,.1,M.iron,0,hh,0,14,1);
  VM.coneRoof(bg,2.3,1.9,M.roofShake,0,5.7,0,14,2.6);cyl(bg,.05,.05,.7,M.iron,0,7.5,0,5,1);
  box(bg,.9,1.7,.12,M.wood,0,.5,1.86,0,1);ctx.colCircle(x,z,2.3);ctx.noGrassC(x,z,3.6);return bg;},
 moinho(ctx,x,z,ry){const M=ctx.M,pd=ctx.pad(x,z,6.6,6.6,ry),bg=new T.Group();bg.position.set(x,pd.y,z);bg.rotation.y=ry;ctx.g.add(bg);
  cyl(bg,3.4,3.4,pd.depth+.6,M.stone,0,-pd.depth,0,8,2);
  cyl(bg,3.05,2.35,3.0,M.stone,0,.6,0,8,2);cyl(bg,2.35,1.75,6.2,M.white,0,3.6,0,8,2.4);
  cyl(bg,2.75,2.75,.3,M.wood,0,3.5,0,8,2);   // varanda
  for(let i=0;i<8;i++){const a=i/8*PI*2+PI/8;box(bg,.12,.9,.12,M.woodDark,Math.cos(a)*2.7,3.8,Math.sin(a)*2.7,0,1);}
  VM.coneRoof(bg,2.3,2.8,M.thatch,0,9.8,0,8,2.6);cyl(bg,.1,.1,.9,M.woodDark,0,12.5,0,5,1);
  doorAt(bg,M,0,2.88,1.2,2.1,M.wood,M.woodDark,true);
  winAt(bg,M,0,F+6.0,2.05,0,.8,1.0,{shut:M.green});winAt(bg,M,0,F+8.7,1.82,0,.7,.9,{});
  ctx.colCircle(x,z,3.5);ctx.noGrassC(x,z,5.5);
  // pás giratórias (animadas, fora da malha unida)
  const sx=x+Math.sin(ry)*2.5,sz=z+Math.cos(ry)*2.5,sg=new T.Group();sg.position.set(sx,pd.y+9.0,sz);sg.rotation.y=ry;ctx.live.add(sg);
  const spin=new T.Group();sg.add(spin);const sailM=M.sail||(M.sail=new T.MeshStandardMaterial({color:'#efe6cf',roughness:1,side:T.DoubleSide}));
  const hub=new T.Mesh(new T.CylinderGeometry(.28,.34,.5,8),M.woodDark);hub.rotation.x=PI/2;hub.position.z=.1;spin.add(hub);
  for(let i=0;i<4;i++){const arm=new T.Group();arm.rotation.z=i*PI/2;spin.add(arm);
   const m1=new T.Mesh(new T.BoxGeometry(.22,8.2,.16),M.woodDark);m1.position.set(0,4.1,.25);arm.add(m1);
   for(let k=1;k<7;k++){const rb=new T.Mesh(new T.BoxGeometry(1.5,.07,.1),M.woodDark);rb.position.set(.75,k*1.1,.28);arm.add(rb);}
   const sl=new T.Mesh(new T.PlaneGeometry(1.45,6.2),sailM);sl.position.set(.78,4.3,.3);arm.add(sl);}
  VM.anim.sails.push({obj:spin,sp:.45});
  return bg;},
 poco(ctx,x,z){well(ctx,x,z,{roof:ctx.M.thatch});},
 campo(ctx,x,z,ry,w,d){const M=ctx.M,g=ctx.g,y=ctx.gy(x,z);
  const geo=new T.PlaneGeometry(w,d,8,6);geo.rotateX(-PI/2);const uv=geo.attributes.uv,ps=geo.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*w/4,uv.getY(i)*d/4);
  // acompanha o relevo (antes metade do campo ficava enterrada nas colinas)
  {const cr=Math.cos(ry),sr=Math.sin(ry);for(let i=0;i<ps.count;i++){const ox=ps.getX(i),oz=ps.getZ(i);ps.setY(i,ctx.gy(x+ox*cr+oz*sr,z-ox*sr+oz*cr)-y+.14);}}
  geo.computeVertexNormals();
  const m=new T.Mesh(geo,M.wheat);m.position.set(x,y,z);m.rotation.y=ry;g.add(m);
  // sebe baixa em volta e espantalho
  ctx.noGrassC(x,z,Math.max(w,d)*.6);
  const sc=(sx,sz)=>{const yy=ctx.gy(sx,sz);cyl(g,.05,.05,2.0,M.woodDark,sx,yy,sz,5,1);box(g,1.4,.08,.08,M.woodDark,sx,yy+1.5,sz,ry,1);sph(g,.2,M.hay,sx,yy+1.95,sz,1,1,1,8);cone(g,.28,.3,M.woodDark,sx,yy+2.05,sz,8,1);box(g,.5,.7,.3,M.blue,sx,yy+.8,sz,ry,1);};
  sc(x+Math.cos(ry)*w*.2,z-Math.sin(ry)*w*.2);
  for(let i=0;i<3;i++)hayBale(ctx,x+Math.cos(ry)*(w/2+1)+i*.1,z-Math.sin(ry)*(w/2+1)+i*1.1,rnd()*3);
 },
 cabana(ctx,x,z,ry){const M=ctx.M,w=3.8,d=3.2,bg=base(ctx,x,z,ry,w,d);
  box(bg,w,.8,d,M.stone,0,F,0,0,2);box(bg,w,1.6,d,M.plaster,0,F+.8,0,0,2.5);
  VM.hipRoof(bg,w+1.2,d+1.2,1.7,M.thatch,0,F+2.4,0,2.6);doorAt(bg,M,0,d/2,.9,1.9,M.wood,M.woodDark,false);winAt(bg,M,w/2+.02,F+1.7,0,PI/2,.7,.8,{shut:M.green});
  chimney(bg,M,-w/2+.7,F+2.1,-d/4,2.0,M.stone);barrel(bg,M,w/2+.1,0,d/2-.3);return bg;}
};
KIT.moinho.extras=function(ctx,L){ // L: layout pronto; árvores frutíferas, hortas
 for(const [x,z] of L.trees||[])tree(ctx,x,z,1,ctx.M.leaf);
};

/* =============== 2. VILA DOS LENHADORES (toras) =============== */
KIT.lenhadores={
 casa(ctx,x,z,ry,o){o=o||{};const M=ctx.M,w=o.w||6.6,d=o.d||5.2,h=2.7,bg=base(ctx,x,z,ry,w,d);
  box(bg,w,h,d,M.log,0,F,0,0,1.6);
  // pontas de tora nos cantos (entrelaçadas)
  for(let r=0;r<8;r++){const yy=F+.2+r*.33;for(const sx of [-1,1])for(const sz of [-1,1]){const l=cyl(bg,.17,.17,.9,M.log,sx*w/2,yy,sz*d/2,7,1);if(r%2)l.rotation.z=PI/2;else l.rotation.x=PI/2;}}
  VM.gableRoof(bg,w,d,2.3,M.roofShake,M.woodH,0,F+h,0,.9,.7,2.6);
  lie(bg,.16,w+1.7,M.log,0,F+h+2.3,0,'x');
  doorAt(bg,M,0,d/2,1.1,2.1,M.woodDark,M.log,false);
  winAt(bg,M,w/3,F+1.9,d/2+.02,0,1.0,1.0,{frame:M.log});winAt(bg,M,-w/3,F+1.9,d/2+.02,0,1.0,1.0,{frame:M.log});
  winAt(bg,M,w/2+.02,F+1.9,0,PI/2,1.0,1.0,{frame:M.log});
  chimney(bg,M,-w/2+.9,F+h-.3,-d/4,3.1,M.stoneDark);
  // varanda com dois pilares e telhado inclinado
  box(bg,w*.6,.14,1.4,M.deck,0,F-.1,d/2+.8,0,1.5);for(const s of [-1,1])cyl(bg,.12,.12,2.5,M.log,s*w*.28,F,d/2+1.35,7,1);
  {const P=[],U=[];VM.pushQuad(P,U,[-w*.34,2.45+F,d/2+1.6],[w*.34,2.45+F,d/2+1.6],[w*.34,F+h+.1,d/2-.1],[-w*.34,F+h+.1,d/2-.1],[0,0],[2,0],[2,1],[0,1]);VM.roofMesh(bg,P,U,M.roofShake,0,0,0);}
  return bg;},
 casarao(ctx,x,z,ry){const M=ctx.M,w=9.6,d=6.4,h=2.9,bg=base(ctx,x,z,ry,w,d);
  box(bg,w,h,d,M.log,0,F,0,0,1.6);
  for(let r=0;r<9;r++){const yy=F+.2+r*.32;for(const sx of [-1,1])for(const sz of [-1,1]){const l=cyl(bg,.17,.17,.9,M.log,sx*w/2,yy,sz*d/2,7,1);if(r%2)l.rotation.z=PI/2;else l.rotation.x=PI/2;}}
  VM.gableRoof(bg,w,d,2.6,M.roofShake,M.woodH,0,F+h,0,.9,.8,2.6);lie(bg,.18,w+1.9,M.log,0,F+h+2.6,0,'x');
  for(const s of [-1,1]){const a=box(bg,.12,1.3,.12,M.cream,s*(w/2+.75),F+h+1.6,0,0,1);a.rotation.z=-s*.5;}  // galhadas na empena
  doorAt(bg,M,0,d/2,1.3,2.2,M.woodDark,M.log,false);
  for(const sx of [-1,1]){winAt(bg,M,sx*w*.3,F+1.9,d/2+.02,0,1.1,1.0,{frame:M.log});winAt(bg,M,sx*w*.42,F+1.9,-d/2-.02,PI,1.0,1.0,{frame:M.log});}
  chimney(bg,M,w/2-1.2,F+h-.3,0,3.4,M.stoneDark);chimney(bg,M,-w/2+1.2,F+h-.3,0,3.4,M.stoneDark);
  return bg;},
 serraria(ctx,x,z,ry){const M=ctx.M,w=8.4,d=5.4,bg=new T.Group(),pd=ctx.pad(x,z,w,d,ry);bg.position.set(x,pd.y,z);bg.rotation.y=ry;ctx.g.add(bg);
  box(bg,w+.4,pd.depth+.3,d+.4,M.deck,0,-pd.depth,0,0,2);
  for(const sx of [-1,1])for(const sz of [-1,1])cyl(bg,.15,.17,3.3,M.log,sx*w/2,.3,sz*d/2,7,1);
  {const P=[],U=[];VM.pushQuad(P,U,[-w/2-.4,3.9,-d/2-.3],[w/2+.4,3.9,-d/2-.3],[w/2+.4,3.0,d/2+.5],[-w/2-.4,3.0,d/2+.5],[0,0],[3,0],[3,2],[0,2]);VM.roofMesh(bg,P,U,M.roofShake,0,0,0);}
  box(bg,2.6,.9,1.0,M.woodDark,-1.2,.3,0,0,1.5);lie(bg,.34,3.4,M.log,-1.4,1.55,0,'x');
  const bl=cyl(bg,.62,.62,.07,M.iron,0,1.4,.3,16,1);bl.rotation.x=PI/2;bl.position.set(.2,1.95,.62);box(bg,.5,.9,.6,M.iron,.2,.8,.62,0,1);
  for(let i=0;i<6;i++)box(bg,2.4,.08,.7,M.wood,2.3,.3+i*.09,-1.3,0,1.2);
  for(let i=0;i<5;i++)box(bg,2.0,.08,.5,M.wood,2.2,.3+i*.09,1.4,0,1.2);
  ctx.colBox(x,z,w/2+.2,d/2+.2,ry);ctx.noGrassC(x,z,6);return bg;},
 toco(ctx,x,z,ry){const M=ctx.M,y=ctx.gy(x,z),g=ctx.g;cyl(g,.42,.5,.55,M.log,x,y,z,10,1);const e=new T.Mesh(new T.CircleGeometry(.42,10),M.deck);e.rotation.x=-PI/2;e.position.set(x,y+.56,z);g.add(e);
  const ax=new T.Group();ax.position.set(x,y+.56,z);ax.rotation.y=ry;g.add(ax);const h=box(ax,.05,.9,.05,M.wood,.2,0,0,0,1);h.rotation.z=-.4;box(ax,.28,.2,.04,M.iron,.55,.62,0,0,1).rotation.z=-.4;ctx.colCircle(x,z,.55);},
 pilha(ctx,x,z,ry){woodpile(ctx,x,z,ry,2.6);},
 poco(ctx,x,z){well(ctx,x,z,{roof:ctx.M.roofShake});},
 cabana(ctx,x,z,ry){const M=ctx.M,w=3.8,d=3.2,bg=base(ctx,x,z,ry,w,d);
  box(bg,w,2.0,d,M.log,0,F,0,0,1.6);for(let r=0;r<6;r++){const yy=F+.2+r*.32;for(const sx of [-1,1])for(const sz of [-1,1]){const l=cyl(bg,.15,.15,.8,M.log,sx*w/2,yy,sz*d/2,7,1);if(r%2)l.rotation.z=PI/2;else l.rotation.x=PI/2;}}
  VM.gableRoof(bg,w,d,1.5,M.roofShake,M.woodH,0,F+2.0,0,.6,.5,2.6);doorAt(bg,M,0,d/2,.9,1.8,M.woodDark,M.log,false);winAt(bg,M,w/2+.02,F+1.5,0,PI/2,.7,.7,{frame:M.log});chimney(bg,M,-w/2+.6,F+1.8,-d/4,1.8,M.stoneDark);
  woodpile(ctx,x-Math.cos(ry)*(w/2+1.4),z+Math.sin(ry)*(w/2+1.4),ry,1.6);return bg;}
};

/* =============== 3. VILA BRANCA (mediterrânea) =============== */
function arcDoor(bg,M,x,z,w,h,leaf){doorAt(bg,M,x,z,w,h,leaf,M.stone,true);}
KIT.mediterranea={
 casa(ctx,x,z,ry,o){o=o||{};const M=ctx.M,w=o.w||6.4,d=o.d||5.4,h=o.h||3.3,bg=base(ctx,x,z,ry,w,d,M.stone);
  box(bg,w,h,d,M.white,0,F,0,0,3);box(bg,w+.12,.22,d+.12,M.stone,0,F+h-.1,d*0,0,2);
  if(o.terraco){
   // terraço com parapeito, pérgula e escada externa
   box(bg,w+.3,.3,d+.3,M.white,0,F+h,0,0,3);for(const sx of [-1,1])box(bg,.3,.8,d+.3,M.white,sx*(w/2+.1),F+h+.3,0,0,3);box(bg,w,.8,.3,M.white,0,F+h+.3,-d/2-.1,0,3);
   for(const sx of [-1,1])for(const sz of [0,1])cyl(bg,.1,.1,2.2,M.woodDark,sx*(w/2-.5),F+h+.3,(sz?1:-1)*(d/2-.6),6,1);
   for(let i=0;i<6;i++)box(bg,w-.6,.07,.1,M.woodDark,0,F+h+2.5,-d/2+.6+i*(d-1.2)/5,0,1);box(bg,.1,.1,d-1,M.woodDark,-w/2+.5,F+h+2.5,0,0,1);box(bg,.1,.1,d-1,M.woodDark,w/2-.5,F+h+2.5,0,0,1);
   for(let i=0;i<6;i++){box(bg,.9,.3,.5,M.white,w/2+.6+.0,F+i*.5,d/2-1-i*.62+0,0,2);}
   sph(bg,.45,M.leaf,-w/2+.8,F+h+1.0,-d/2+.8,1,.8,1,8);
  }else VM.hipRoof(bg,w+1.2,d+1.2,1.25,M.roofTerra,0,F+h,0,2.4);
  arcDoor(bg,M,-w/5,d/2,1.2,2.1,M.blueDoor);
  winAt(bg,M,w/4+.2,F+2.0,d/2+.02,0,1.0,1.3,{shut:M.blue,flowers:true,frame:M.stone});
  winAt(bg,M,w/2+.02,F+2.0,0,PI/2,.9,1.2,{shut:M.blue,frame:M.stone});winAt(bg,M,-w/2-.02,F+2.0,0,-PI/2,.9,1.2,{shut:M.blue,frame:M.stone});
  // toldo listrado e vasos
  {const aw=box(bg,2.2,.06,1.1,M.blue,w/4+.2,F+2.65,d/2+.55,0,1);aw.rotation.x=.35;for(let i=0;i<4;i++)box(bg,.3,.07,1.12,M.cloth,w/4+.2-.8+i*.55,F+2.66,d/2+.55,0,1).rotation.x=.35;}
  for(const s of [-1,1]){cyl(bg,.22,.16,.4,M.roofTerra,-w/5+s*1.2,F,d/2+.5,8,1);sph(bg,.3,M.leaf,-w/5+s*1.2,F+.55,d/2+.5,1,.8,1,7);}
  return bg;},
 torre(ctx,x,z,ry){const M=ctx.M,w=3.6,bg=base(ctx,x,z,ry,w,w,M.stone);
  box(bg,w,9.2,w,M.white,0,F,0,0,3);box(bg,w+.3,.3,w+.3,M.stone,0,F+9.2,0,0,2);box(bg,w+.3,.3,w+.3,M.stone,0,F+4.4,0,0,2);
  for(const [ax,az,ra] of [[0,w/2+.02,0],[0,-w/2-.02,PI],[w/2+.02,0,PI/2],[-w/2-.02,0,-PI/2]]){const ag=new T.Group();ag.position.set(ax,F+7.0,az);ag.rotation.y=ra;bg.add(ag);box(ag,.9,1.8,.12,M.char,0,0,0,0,1);const a=new T.Mesh(new T.CircleGeometry(.45,12,0,PI),M.char);a.position.set(0,1.8,.07);ag.add(a);}
  sph(bg,.28,M.gold,0,F+7.3,0,1,1.2,1,8);
  winAt(bg,M,0,F+3.9,w/2+.02,0,.8,1.2,{shut:M.blue,frame:M.stone});arcDoor(bg,M,0,w/2,1.1,2.0,M.blueDoor);
  const cl=new T.Mesh(new T.CircleGeometry(.5,16),M.cloth);cl.position.set(0,F+5.4,w/2+.04);bg.add(cl);box(bg,.05,.4,.03,M.iron,0,F+5.4,w/2+.06,0,1);
  VM.pyramid(bg,w+1,w+1,3.0,M.roofTerra,0,F+9.5,0,2.4);cyl(bg,.04,.04,.9,M.iron,0,F+12.5,0,5,1);
  return bg;},
 fonte(ctx,x,z){const M=ctx.M,y=ctx.gy(x,z),g=ctx.g;
  cyl(g,2.4,2.5,.8,M.stone,x,y,z,16,2);cyl(g,2.0,2.0,.05,M.water,x,y+.78,z,16,1);
  cyl(g,.3,.4,1.5,M.white,x,y+.4,z,10,1.5);cyl(g,.9,.35,.3,M.stone,x,y+1.7,z,12,1.5);cyl(g,.7,.7,.04,M.water,x,y+2.0,z,12,1);sph(g,.22,M.stone,x,y+2.15,z,1,1,1,8);
  ctx.colCircle(x,z,2.55);ctx.noGrassC(x,z,4);},
 poco(ctx,x,z){well(ctx,x,z,{roof:ctx.M.roofTerra,stone:ctx.M.white});},
 oliveira(ctx,x,z,s){const M=ctx.M,y=ctx.gy(x,z),g=ctx.g;s=s||1;
  const t=cyl(g,.18*s,.3*s,1.9*s,M.bark,x,y,z,6,1.5);rod(g,x,y+1.4*s,z,x+.5*s,y+2.4*s,z+.1,.12*s,M.bark,5);rod(g,x,y+1.4*s,z,x-.5*s,y+2.3*s,z-.1,.1*s,M.bark,5);
  const ol=ctx.M.olive||(ctx.M.olive=new T.MeshStandardMaterial({color:'#859d6a',roughness:1}));
  for(const [dx,dy,dz,r] of [[.5,2.7,.1,.95],[-.5,2.6,-.1,.9],[0,3.1,0,.8]])sph(g,r*s,ol,x+dx*s,y+dy*s,z+dz*s,1.15,.7,1.15,8);ctx.colCircle(x,z,.4*s);},
 cabana(ctx,x,z,ry){const M=ctx.M,w=3.8,d=3.2,bg=base(ctx,x,z,ry,w,d,M.stone);
  box(bg,w,2.3,d,M.white,0,F,0,0,3);VM.hipRoof(bg,w+1,d+1,1.0,M.roofTerra,0,F+2.3,0,2.4);arcDoor(bg,M,-.4,d/2,.9,1.8,M.blueDoor);winAt(bg,M,w/2+.02,F+1.6,0,PI/2,.7,.8,{shut:M.blue,frame:M.stone});
  cyl(bg,.22,.16,.4,M.roofTerra,1.0,F,d/2+.4,8,1);sph(bg,.3,M.leaf,1.0,F+.55,d/2+.4,1,.8,1,7);return bg;}
};

/* =============== 4. VILA DO NORTE (nórdica) =============== */
function dragonEnds(bg,M,L,yRidge){
 for(const s of [-1,1]){const g=new T.Group();g.position.set(s*(L/2+.55),yRidge,0);bg.add(g);
  for(const k of [-1,1]){const b=box(g,.14,1.8,.14,M.woodDark,0,0,0,0,1);b.rotation.z=k*.62;b.position.set(s*.25,.9,0);sph(g,.15,M.gold,s*(.25+k*.55),1.75,0,1,1,1,6);}}
}
KIT.nordica={
 longa(ctx,x,z,ry){const M=ctx.M,w=14,d=6.4,h=2.5,bg=base(ctx,x,z,ry,w,d,M.stoneDark);
  box(bg,w,h,d,M.woodDark,0,F,0,0,2.4);for(let i=0;i<=7;i++)box(bg,.22,h,.28,M.wood,-w/2+i*w/7,F,d/2+.02,0,1);box(bg,w+.1,.2,.3,M.wood,0,F+h-.1,d/2+.02,0,1);
  VM.gableRoof(bg,w,d,3.3,M.turf,M.woodDark,0,F+h,0,1.0,1.0,2.8);box(bg,w+2,.28,.5,M.woodDark,0,F+h+3.3,0,0,1.5);dragonEnds(bg,M,w+.6,F+h+3.3);
  doorAt(bg,M,0,d/2,1.4,2.2,M.red,M.gold,false);
  const sh=[M.red,M.blue,M.hay,M.cream,M.red,M.blue];for(let i=0;i<6;i++){const sx=-w/2+1.4+i*(w-2.8)/5;if(Math.abs(sx)<1.4)continue;const dd=cyl(bg,.42,.42,.08,sh[i],0,0,0,12,1);dd.rotation.x=PI/2;dd.position.set(sx,F+1.8,d/2+.08);sph(bg,.08,M.iron,sx,F+1.8,d/2+.14,1,1,1,6);}
  winAt(bg,M,w/2-1.2,F+2.0,d/2+.02,0,.6,.5,{frame:M.woodDark});winAt(bg,M,-w/2+1.2,F+2.0,d/2+.02,0,.6,.5,{frame:M.woodDark});
  chimney(bg,M,w/4,F+h+1.2,-d/4,2.6,M.stoneDark);
  return bg;},
 sala(ctx,x,z,ry){const M=ctx.M,w=8.6,d=5.6,h=2.4,bg=base(ctx,x,z,ry,w,d,M.stoneDark);
  box(bg,w,h,d,M.woodDark,0,F,0,0,2.4);for(let i=0;i<=5;i++)box(bg,.2,h,.26,M.wood,-w/2+i*w/5,F,d/2+.02,0,1);
  VM.gableRoof(bg,w,d,2.9,M.turf,M.woodDark,0,F+h,0,.9,.9,2.8);box(bg,w+1.8,.26,.5,M.woodDark,0,F+h+2.9,0,0,1.5);dragonEnds(bg,M,w+.3,F+h+2.9);
  doorAt(bg,M,-1,d/2,1.2,2.1,M.red,M.gold,false);winAt(bg,M,2.1,F+1.9,d/2+.02,0,.8,.7,{frame:M.woodDark});
  const dd=cyl(bg,.4,.4,.08,M.blue,0,0,0,12,1);dd.rotation.x=PI/2;dd.position.set(3.3,F+1.6,d/2+.08);
  barrel(bg,M,-w/2+.5,F-.45,d/2+.5);return bg;},
 celeiro(ctx,x,z,ry){const M=ctx.M,w=3.6,d=3.2,pd=ctx.pad(x,z,w+.6,d+.6,ry),bg=new T.Group();bg.position.set(x,pd.y,z);bg.rotation.y=ry;ctx.g.add(bg);
  for(const sx of [-1,1])for(const sz of [-1,1]){cyl(bg,.2,.28,pd.depth+1.0,M.stoneDark,sx*w*.4,-pd.depth,sz*d*.4,7,1.2);cyl(bg,.34,.34,.1,M.stone,sx*w*.4,.95,sz*d*.4,8,1);}
  box(bg,w,2.7,d,M.woodDark,0,1.05,0,0,2.2);box(bg,w+.4,.14,d+.4,M.wood,0,3.75,0,0,1.5);
  VM.gableRoof(bg,w,d,2.0,M.turf,M.woodDark,0,3.75,0,1.0,.7,2.8);dragonEnds(bg,M,w-.2,5.75);
  box(bg,1.0,1.8,.1,M.wood,0,1.15,d/2+.02,0,1);for(let i=0;i<3;i++)box(bg,.9,.12,.5,M.wood,0,.4+i*.22,d/2+.7-i*.0+.4+i*.3,0,1);
  ctx.colBox(x,z,w/2+.3,d/2+.3,ry);ctx.noGrassC(x,z,3.4);return bg;},
 runa(ctx,x,z,ry){const M=ctx.M,y=ctx.gy(x,z),g=new T.Group();g.position.set(x,y,z);g.rotation.y=ry;ctx.g.add(g);
  const st=box(g,1.3,3.2,.6,M.stoneDark,0,0,0,0,2);st.rotation.z=.04;box(g,.9,.7,.5,M.stoneDark,0,3.2,0,0,2).rotation.z=.04;
  for(const [rx,ry2,rw,rh] of [[0,2.7,.12,.7],[-.2,2.5,.5,.1],[.2,2.2,.5,.1],[0,1.6,.12,.8],[-.25,1.2,.4,.1],[.25,.9,.4,.1],[0,3.3,.5,.1]])box(g,rw,rh,.05,M.rune,rx,ry2-rh/2,.32,0,1);
  ctx.colCircle(x,z,.95);ctx.noGrassC(x,z,2.5);},
 rack(ctx,x,z,ry){const M=ctx.M,y=ctx.gy(x,z),g=new T.Group();g.position.set(x,y,z);g.rotation.y=ry;ctx.g.add(g);
  for(const s of [-1,1]){rod(g,s*1.6,0,-.5,s*1.0,2.3,0,.06,M.woodDark,5);rod(g,s*1.6,0,.5,s*1.0,2.3,0,.06,M.woodDark,5);}
  rod(g,-1.0,2.1,0,1.0,2.1,0,.06,M.woodDark,5);rod(g,-1.2,1.3,0,1.2,1.3,0,.05,M.woodDark,5);
  for(let i=0;i<8;i++){const f=box(g,.14,.5,.04,M.cloth,-.85+i*.24,1.55,0,0,1);f.rotation.z=.08*(i%2?1:-1);}
  for(let i=0;i<6;i++)box(g,.14,.5,.04,M.cloth,-.7+i*.28,.8+.5,.0,0,1);
  ctx.colBox(x,z,1.6*Math.abs(Math.cos(ry))+.7,1.6*Math.abs(Math.sin(ry))+.7,0);},
 poco(ctx,x,z){well(ctx,x,z,{roof:ctx.M.turf,stone:ctx.M.stoneDark});},
 cabana(ctx,x,z,ry){const M=ctx.M,w=3.8,d=3.2,bg=base(ctx,x,z,ry,w,d,M.stoneDark);
  box(bg,w,1.9,d,M.woodDark,0,F,0,0,2.2);VM.gableRoof(bg,w,d,1.7,M.turf,M.woodDark,0,F+1.9,0,.8,.6,2.8);doorAt(bg,M,0,d/2,.9,1.8,M.red,M.gold,false);
  const dd=cyl(bg,.3,.3,.06,M.blue,0,0,0,12,1);dd.rotation.x=PI/2;dd.position.set(-1.2,F+1.6,d/2+.06);return bg;}
};

/* =============== 5. VILA DAS CEREJEIRAS (oriental) =============== */
function goldCorners(bg,M,w,d,y,k){for(const sx of [-1,1])for(const sz of [-1,1]){const c=cone(bg,.13,.7,M.gold,sx*(w/2),y,sz*(d/2),5,1);c.rotation.z=-sx*.9;c.rotation.x=sz*.9;}}
KIT.oriental={
 casa(ctx,x,z,ry,o){o=o||{};const M=ctx.M,w=o.w||6.4,d=o.d||5.4,bg=base(ctx,x,z,ry,w,d,M.stoneDark);
  box(bg,w+.6,.35,d+.6,M.stone,0,F-.1,0,0,2);const fy=F+.25;
  for(const sx of [-1,1])for(const sz of [-1,1])cyl(bg,.2,.2,2.8,M.redLacquer,sx*w/2,fy,sz*d/2,8,1.5);
  for(const sx of [-1,0,1])cyl(bg,.15,.15,2.8,M.redLacquer,sx*w/2,fy,d/2,8,1.5);
  // paredes shoji (acendem à noite) e portas de correr
  box(bg,w,2.5,.1,M.shoji,0,fy,-d/2,0,1.2);for(const s of [-1,1])box(bg,.1,2.5,d,M.shoji,s*w/2,fy,0,0,1.2);
  box(bg,w/2,2.5,.1,M.shoji,-w/4,fy,d/2-.05,0,1.2);box(bg,w/2,2.5,.1,M.shoji,w/4+.0,fy,d/2-.02,0,1.2);
  box(bg,w,.2,d+.1,M.woodDark,0,fy+2.5,0,0,1.5);
  box(bg,w+.1,.5,.14,M.woodDark,0,fy,d/2+.02,0,1.5);
  // telhado em dois níveis com cantos dourados
  VM.hipRoof(bg,w+2.8,d+2.8,1.5,M.roofSlate,0,fy+2.7,0,2.6);goldCorners(bg,M,w+2.6,d+2.6,fy+2.55);
  box(bg,w-.6,1.2,d-.6,M.white,0,fy+4.0,0,0,2);VM.hipRoof(bg,w+1.2,d+1.2,1.4,M.roofSlate,0,fy+5.1,0,2.6);goldCorners(bg,M,w+1.0,d+1.0,fy+4.95);
  cyl(bg,.06,.06,.7,M.gold,0,fy+6.5,0,5,1);sph(bg,.16,M.gold,0,fy+7.2,0,1,1,1,6);
  // lanternas penduradas
  for(const s of [-1,1]){rod(bg,s*(w/2+.9),fy+2.7,d/2+1.0,s*(w/2+.9),fy+2.2,d/2+1.0,.012,M.iron,3);sph(bg,.24,M.lantern,s*(w/2+.9),fy+1.95,d/2+1.0,.9,1.15,.9,8);}
  box(bg,1.6,.14,.8,M.stone,0,F-.3,d/2+.8,0,1.5);
  return bg;},
 torii(ctx,x,z,ry){const M=ctx.M,y=ctx.pad(x,z,5,1.5,ry),g=new T.Group();g.position.set(x,y.y,z);g.rotation.y=ry;ctx.g.add(g);
  for(const s of [-1,1]){cyl(g,.22,.26,4.6,M.redLacquer,s*2.0,-y.depth,0,10,2);cyl(g,.3,.3,.2,M.char,s*2.0,-y.depth,0,10,1);}
  box(g,5.8,.34,.4,M.redLacquer,0,3.5,0,0,2);box(g,5.2,.3,.34,M.redLacquer,0,2.95,0,0,2);box(g,6.6,.22,.5,M.char,0,4.55,0,0,2);
  for(const s of [-1,1]){const e=box(g,.9,.22,.5,M.char,s*3.45,4.7,0,0,2);e.rotation.z=s*.3;}
  box(g,.34,.7,.3,M.redLacquer,0,3.55,0,0,1);ctx.colCircle(x+Math.cos(ry)*2.0,z-Math.sin(ry)*2.0,.4);ctx.colCircle(x-Math.cos(ry)*2.0,z+Math.sin(ry)*2.0,.4);},
 toro(ctx,x,z){const M=ctx.M,y=ctx.gy(x,z),g=ctx.g;
  box(g,.9,.2,.9,M.stoneDark,x,y,z,0,1);cyl(g,.16,.2,1.1,M.stone,x,y+.2,z,8,1);box(g,.8,.15,.8,M.stoneDark,x,y+1.3,z,0,1);box(g,.5,.5,.5,M.lantern,x,y+1.45,z,0,1);
  VM.pyramid(g,1.1,1.1,.5,M.stoneDark,x,y+1.95,z,1);sph(g,.1,M.stone,x,y+2.5,z,1,1,1,6);ctx.colCircle(x,z,.5);},
 lago(ctx,x,z,r){const M=ctx.M,y=ctx.gy(x,z),g=ctx.g;
  cyl(g,r+.35,r+.4,.3,M.stone,x,y,z,20,2);cyl(g,r,r,.05,M.water,x,y+.26,z,20,1);
  for(let i=0;i<5;i++){const a=i*1.3,l=cyl(g,.35,.35,.02,M.leaf,x+Math.cos(a)*r*.55,y+.3,z+Math.sin(a)*r*.55,8,1);}
  for(let i=0;i<4;i++){const a=i*1.7+.5,f=sph(g,.13,M.redLacquer,x+Math.cos(a)*r*.4,y+.32,z+Math.sin(a)*r*.4,1.8,.5,.8,6);f.rotation.y=a;}
  ctx.colCircle(x,z,r+.4);ctx.noGrassC(x,z,r+2.5);},
 cerejeira(ctx,x,z,s){const M=ctx.M,y=ctx.gy(x,z),g=ctx.g;s=s||1;
  const lite=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||innerWidth<700;
  // tronco orgânico: tubo suave com raiz alargada, caroços na casca e galhos que afinam; casca com lenticelas horizontais
  if(!M.cherryBark){const c=document.createElement('canvas');c.width=128;c.height=256;const cg=c.getContext('2d');cg.fillStyle='#5b3a30';cg.fillRect(0,0,128,256);
   for(let i=0;i<60;i++){const x=Math.random()*128,w=2+Math.random()*7,l=36+Math.random()*28;cg.fillStyle='rgba('+(Math.random()<.5?'40,24,20':'110,76,62')+','+(.18+Math.random()*.3)+')';cg.fillRect(x,0,w,256);}
   for(let i=0;i<150;i++){const x=Math.random()*128,y=Math.random()*256,w=6+Math.random()*16;cg.strokeStyle='rgba(190,170,160,'+(.25+Math.random()*.3)+')';cg.lineWidth=1.6;cg.beginPath();cg.moveTo(x,y);cg.lineTo(x+w,y+(Math.random()-.5)*2);cg.stroke();}
   for(let i=0;i<24;i++){const x=Math.random()*128,y=Math.random()*256;const gr=cg.createRadialGradient(x,y,0,x,y,10);gr.addColorStop(0,'rgba(120,140,100,.35)');gr.addColorStop(1,'rgba(120,140,100,0)');cg.fillStyle=gr;cg.fillRect(x-10,y-10,20,20);}
   const bt=new T.CanvasTexture(c);bt.wrapS=bt.wrapT=T.RepeatWrapping;bt.colorSpace=T.SRGBColorSpace;M.cherryBark=new T.MeshStandardMaterial({map:bt,roughness:1});}
  const organic=(pts,rad,flare,sd)=>{const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(p[0],p[1],p[2]))),N=18,S=10,fr=curve.computeFrenetFrames(N,false),len=curve.getLength();
   const P=[],U=[],I=[];
   for(let i=0;i<=N;i++){const t=i/N,pos=curve.getPoint(t),f=t*(rad.length-1),k=Math.min(rad.length-2,Math.floor(f)),rr=(rad[k]+(rad[k+1]-rad[k])*(f-k))*(1+flare*Math.exp(-t*8)),nn=fr.normals[i],bb=fr.binormals[i];
    for(let j=0;j<=S;j++){const an=j/S*Math.PI*2,lump=1+.1*Math.sin(an*3+t*8+sd)+.07*Math.sin(an*5-t*13+sd*2)+(flare>0?.16*Math.max(0,Math.sin(an*4+sd))*Math.exp(-t*7):0),dx=nn.x*Math.cos(an)+bb.x*Math.sin(an),dy=nn.y*Math.cos(an)+bb.y*Math.sin(an),dz=nn.z*Math.cos(an)+bb.z*Math.sin(an);
     P.push(pos.x+dx*rr*lump,pos.y+dy*rr*lump,pos.z+dz*rr*lump);U.push(j/S*Math.max(1,rr*5),t*len/1.1);}}
   for(let i=0;i<N;i++)for(let j=0;j<S;j++){const q=i*(S+1)+j;I.push(q,q+S+1,q+1,q+1,q+S+1,q+S+2);}
   const gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute(P,3));gg.setAttribute('uv',new T.Float32BufferAttribute(U,2));gg.setIndex(I);gg.computeVertexNormals();
   const m=new T.Mesh(gg,M.cherryBark);m.castShadow=true;m.receiveShadow=true;g.add(m);};
  organic([[x,y-.2,z],[x+.04*s,y+.9*s,z+.05*s],[x+.22*s,y+1.7*s,z-.04*s],[x+.14*s,y+2.5*s,z+.03*s]],[.36*s,.26*s,.21*s,.16*s],.9,rnd()*6);
  for(let q=0;q<5;q++){const a2=q/5*6.283+rnd()*.5,dx=Math.cos(a2),dz=Math.sin(a2);organic([[x+dx*.2*s,y+.35*s,z+dz*.2*s],[x+dx*.7*s,y+.08*s,z+dz*.7*s],[x+dx*1.25*s,y-.12*s,z+dz*1.25*s]],[.17*s,.1*s,.04*s],0,rnd()*6);}
  const tips=[[1.05,3.0,.45],[-1.0,2.9,-.4],[.35,3.9,.1],[.1,3.0,-1.0],[-.2,3.2,1.0]];
  for(const [dx,dy,dz] of tips){const st=[x+.16*s,y+(1.8+rnd()*.5)*s,z+.02*s],en=[x+dx*s,y+dy*s,z+dz*s],mid=[(st[0]+en[0])/2+(rnd()-.5)*.3*s,(st[1]+en[1])/2-.15*s,(st[2]+en[2])/2+(rnd()-.5)*.3*s];
   organic([st,mid,en],[.13*s,.09*s,.045*s],.15,rnd()*6);
   for(let k=0;k<2;k++){const sub=[en[0]+(rnd()-.5)*1.1*s,en[1]+(rnd()*.7)*s,en[2]+(rnd()-.5)*1.1*s];organic([en,[(en[0]+sub[0])/2,(en[1]+sub[1])/2+.1*s,(en[2]+sub[2])/2],sub],[.05*s,.035*s,.018*s],0,rnd()*6);}}
  if(!M.cherryLeaf){const c=document.createElement('canvas');c.width=c.height=128;const gx=c.getContext('2d');gx.translate(64,64);
   const petal=ang=>{gx.save();gx.rotate(ang);gx.beginPath();gx.moveTo(0,-4);gx.bezierCurveTo(-26,-18,-24,-52,-7,-56);gx.lineTo(0,-48);gx.lineTo(7,-56);gx.bezierCurveTo(24,-52,26,-18,0,-4);gx.closePath();
    const gr=gx.createLinearGradient(0,-4,0,-56);gr.addColorStop(0,'#e0608a');gr.addColorStop(.35,'#ff9cbd');gr.addColorStop(1,'#fff2f6');gx.fillStyle=gr;gx.fill();gx.strokeStyle='rgba(150,40,80,.55)';gx.lineWidth=2.2;gx.stroke();
    gx.strokeStyle='rgba(190,70,110,.4)';gx.lineWidth=1.3;gx.beginPath();gx.moveTo(0,-8);gx.lineTo(0,-40);gx.stroke();gx.restore();};
   for(let i=0;i<5;i++)petal(i*Math.PI*2/5);
   gx.fillStyle='#c0305f';gx.beginPath();gx.arc(0,0,7,0,6.3);gx.fill();for(let i=0;i<9;i++){const an=i/9*6.283;gx.strokeStyle='#ffe27a';gx.lineWidth=2;gx.beginPath();gx.moveTo(0,0);gx.lineTo(Math.cos(an)*16,Math.sin(an)*16);gx.stroke();gx.fillStyle='#ffd24a';gx.beginPath();gx.arc(Math.cos(an)*16,Math.sin(an)*16,2.4,0,6.3);gx.fill();}
   const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;
   const lc=document.createElement('canvas');lc.width=lc.height=64;const lx=lc.getContext('2d');lx.translate(32,32);lx.beginPath();lx.moveTo(0,-30);lx.bezierCurveTo(20,-18,18,16,0,30);lx.bezierCurveTo(-18,16,-20,-18,0,-30);const lgr=lx.createLinearGradient(0,-30,0,30);lgr.addColorStop(0,'#9ed46a');lgr.addColorStop(1,'#4d9a3e');lx.fillStyle=lgr;lx.fill();lx.strokeStyle='rgba(30,80,30,.7)';lx.lineWidth=2;lx.stroke();lx.beginPath();lx.moveTo(0,-28);lx.lineTo(0,28);lx.stroke();
   const lt=new T.CanvasTexture(lc);lt.colorSpace=T.SRGBColorSpace;
   M.cherryLeaf=new T.MeshStandardMaterial({map:tx,alphaTest:.45,side:T.DoubleSide,vertexColors:true,roughness:1,name:'cherry leaf blossom'});
   M.cherryGreen=new T.MeshStandardMaterial({map:lt,alphaTest:.45,side:T.DoubleSide,vertexColors:true,roughness:1,name:'cherry leaf green'});if(window.arcanoPaintLeaf){window.arcanoPaintLeaf(M.cherryLeaf);window.arcanoPaintLeaf(M.cherryGreen);}}
  const build=(list,mat)=>{const n=list.length,P=new Float32Array(n*12),U=new Float32Array(n*8),Cc=new Float32Array(n*12),Nn=new Float32Array(n*12),I=new Uint32Array(n*6);
   list.forEach((q,i)=>{for(let k=0;k<4;k++){P.set(q.p[k],i*12+k*3);Nn.set(q.n,i*12+k*3);Cc.set(q.c,i*12+k*3);}U.set([0,0,1,0,1,1,0,1],i*8);I.set([i*4,i*4+1,i*4+2,i*4,i*4+2,i*4+3],i*6);});
   const gg=new T.BufferGeometry();gg.setAttribute('position',new T.BufferAttribute(P,3));gg.setAttribute('uv',new T.BufferAttribute(U,2));gg.setAttribute('color',new T.BufferAttribute(Cc,3));gg.setAttribute('normal',new T.BufferAttribute(Nn,3));gg.setIndex(new T.BufferAttribute(I,1));
   const m=new T.Mesh(gg,mat);m.castShadow=false;m.receiveShadow=true;g.add(m);};
  const blossoms=[],greens=[];
  const clump=(cx,cy,cz,r)=>{const n=Math.round(520*r*r*(lite?.55:1));
   for(let i=0;i<n;i++){let vx=rnd()-.5,vy=rnd()-.5,vz=rnd()-.5;const l=Math.hypot(vx,vy,vz)||1;vx/=l;vy/=l;vz/=l;if(vy<0)vy*=.55;
    const sh=.45+.55*Math.pow(rnd(),.5),px=cx+vx*r*s*sh,py=cy+vy*r*s*sh*.85,pz=cz+vz*r*s*sh;
    const sz=(.26+rnd()*.2)*s,a=rnd()*6.283,ca=Math.cos(a),sa=Math.sin(a),tl=rnd()*1.4-.7;
    // cartão voltado mais ou menos para fora da copa
    const ux=[ca,0,sa],uy=[-sa*Math.sin(tl),Math.cos(tl),ca*Math.sin(tl)];
    const hs=sz/2,p=[[-hs,-hs],[hs,-hs],[hs,hs],[-hs,hs]].map(([u,v])=>[px+ux[0]*u+uy[0]*v,py+ux[1]*u+uy[1]*v,pz+ux[2]*u+uy[2]*v]);
    const t=rnd(),bright=.72+.28*sh,col=t<.35?[1,.95,.97]:t<.75?[1,.82,.9]:[.98,.7,.82];
    (rnd()<.035?greens:blossoms).push({p,n:[vx,vy*.8+.2,vz],c:col.map(v=>v*bright)});}};
  for(const [dx,dy,dz,r] of [[.3,3.2,0,1.3],[1.1,2.9,.4,1.0],[-1.0,2.8,-.3,1.05],[.2,3.9,.1,.9],[.1,3.0,-1.0,.85],[-.2,3.2,1.0,.85]])clump(x+dx*s,y+dy*s,z+dz*s,r);
  build(blossoms,M.cherryLeaf);if(greens.length)build(greens.map(q=>({p:q.p,n:q.n,c:[.55,.8,.45]})),M.cherryGreen);
  const p=new T.Mesh(new T.CircleGeometry(2.4*s,14),M.petals||(M.petals=new T.MeshStandardMaterial({color:'#f7c0d4',roughness:1,transparent:true,opacity:.75,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1})));p.rotation.x=-PI/2;p.position.set(x,y+.09,z);g.add(p);
  ctx.colCircle(x,z,.4*s);},
 pagode(ctx,x,z,ry){const M=ctx.M,w=4.6,bg=base(ctx,x,z,ry,w+1,w+1,M.stoneDark);
  let yy=F,ww=w;for(let t=0;t<3;t++){box(bg,ww,2.0,ww,t===2?M.shoji:M.white,0,yy,0,0,2);for(const sx of [-1,1])for(const sz of [-1,1])cyl(bg,.14,.14,2.0,M.redLacquer,sx*ww/2,yy,sz*ww/2,8,1.5);
   VM.hipRoof(bg,ww+2.2,ww+2.2,1.2,M.roofSlate,0,yy+2.0,0,2.6);goldCorners(bg,M,ww+2.0,ww+2.0,yy+1.9);yy+=3.0;ww-=.9;}
  cyl(bg,.07,.07,1.6,M.gold,0,yy-.7,0,5,1);for(let i=0;i<4;i++)cyl(bg,.28-i*.05,.28-i*.05,.1,M.gold,0,yy-.2+i*.28,0,8,1);
  doorAt(bg,M,0,w/2,1.1,1.9,M.woodDark,M.redLacquer,false);return bg;},
 bambu(ctx,x,z,n){const M=ctx.M,y=ctx.gy(x,z),g=ctx.g;if(!M.bamb)M.bamb=new T.MeshStandardMaterial({color:'#b9c46a',roughness:1});for(let i=0;i<(n||7);i++){const a=rnd()*6.28,r=rnd()*1.1,h=4+rnd()*3;cyl(g,.06,.07,h,M.bamb,x+Math.cos(a)*r,y,z+Math.sin(a)*r,5,1);sph(g,.5,M.leaf,x+Math.cos(a)*r,y+h-.2,z+Math.sin(a)*r,1,.5,1,6);}ctx.colCircle(x,z,1.2);},
 cabana(ctx,x,z,ry){const M=ctx.M,w=3.8,d=3.4,bg=base(ctx,x,z,ry,w,d,M.stoneDark);
  box(bg,w+.4,.3,d+.4,M.deck,0,F-.1,0,0,1.5);const fy=F+.2;for(const sx of [-1,1])for(const sz of [-1,1])cyl(bg,.13,.13,2.1,M.redLacquer,sx*w/2,fy,sz*d/2,8,1);
  box(bg,w,2.0,.08,M.shoji,0,fy,-d/2,0,1.2);box(bg,.08,2.0,d,M.shoji,-w/2,fy,0,0,1.2);VM.hipRoof(bg,w+1.8,d+1.8,1.3,M.roofSlate,0,fy+2.1,0,2.6);goldCorners(bg,M,w+1.6,d+1.6,fy+2.0);
  sph(bg,.2,M.lantern,0,fy+1.7,d/2-.3,1,1.2,1,8);return bg;}
};

/* =============== 6. VILA DOS COGUMELOS (fantasia) =============== */
function lathe(g,pts,m,x,y,z,seg){const mm=new T.Mesh(new T.LatheGeometry(pts.map(p=>new T.Vector2(p[0],p[1])),seg||18),m);mm.position.set(x,y,z);g.add(mm);return mm;}
function mushHouse(ctx,x,z,ry,o){
 const M=ctx.M,sr=o.sr||1.9,sh=o.sh||3.2,cr=o.cr||3.7,ch=o.ch||1.7,capM=o.cap||M.capRed;
 const pd=ctx.pad(x,z,sr*2+.6,sr*2+.6,ry),bg=new T.Group();bg.position.set(x,pd.y,z);bg.rotation.y=ry;ctx.g.add(bg);
 // pé do cogumelo (torneado) com soquinho de pedra
 cyl(bg,sr+.3,sr+.4,pd.depth+.4,M.stone,0,-pd.depth,0,14,2);
 lathe(bg,[[0,.4],[sr+.25,.4],[sr+.05,.9],[sr-.1,sh*.5],[sr*.82,sh*.8],[sr*.95,sh],[0,sh]],M.stem,0,0,0,18);
 // chapéu: calota achatada com saia e lamelas por baixo
 const cap=new T.Mesh(new T.SphereGeometry(cr,24,12,0,PI*2,0,PI/2),capM);cap.scale.set(1,ch/cr,1);cap.position.y=sh;bg.add(cap);
 const gl=new T.Mesh(new T.CircleGeometry(cr,24),M.gills);gl.rotation.x=PI/2;gl.position.y=sh-.02;bg.add(gl);
 // porta redonda e janelas redondas
 const dr=cyl(bg,.62,.62,.1,M.wood,0,0,0,16,1);dr.rotation.x=PI/2;dr.position.set(0,.4+.75,sr-.12);
 const df=new T.Mesh(new T.TorusGeometry(.66,.09,6,18),M.stone);df.position.set(0,1.15,sr-.06);bg.add(df);sph(bg,.07,M.gold,.25,1.15,sr,1,1,1,6);
 box(bg,1.4,.14,.8,M.stone,0,.35,sr+.35,0,1.5);
 const wn=o.windows||[[1.0,2.3],[-1.0,2.3]];
 for(const [wx,wy] of wn){const a=Math.atan2(wx,Math.sqrt(Math.max(.1,sr*sr-wx*wx)));const px=Math.sin(a)*(sr-.05),pz=Math.cos(a)*(sr-.05);
  const w=cyl(bg,.34,.34,.08,M.glass,0,0,0,14,1);w.rotation.order='YXZ';w.rotation.x=PI/2;w.rotation.y=a;w.position.set(px,wy,pz);
  const wf=new T.Mesh(new T.TorusGeometry(.38,.07,6,16),M.woodDark);wf.position.set(px,wy,pz);wf.rotation.y=a;bg.add(wf);}
 // brilho dentro da casa
 ctx.colCircle(x,z,sr+.35);ctx.noGrassC(x,z,cr+1.2);
 return bg;
}
KIT.cogumelos={
 casa(ctx,x,z,ry,o){return mushHouse(ctx,x,z,ry,o||{});},
 grande(ctx,x,z,ry,o){o=Object.assign({sr:2.4,sh:4.8,cr:4.7,ch:2.2,windows:[[1.3,3.6],[-1.3,3.6],[0,2.2]]},o||{});return mushHouse(ctx,x,z,ry,o);},
 cabana(ctx,x,z,ry,o){o=Object.assign({sr:1.25,sh:2.0,cr:2.2,ch:1.1,windows:[[.7,1.4]]},o||{});return mushHouse(ctx,x,z,ry,o);},
 brilho(ctx,x,z,n){const M=ctx.M,y=ctx.gy(x,z),g=ctx.g;for(let i=0;i<(n||5);i++){const a=rnd()*6.28,r=rnd()*1.2,h=.35+rnd()*.5,cm=rnd()<.5?M.glowCyan:M.glowPink;cyl(g,.05,.07,h,M.stem,x+Math.cos(a)*r,y,z+Math.sin(a)*r,5,1);const c=new T.Mesh(new T.SphereGeometry(.2+rnd()*.15,9,5,0,PI*2,0,PI/2),cm);c.position.set(x+Math.cos(a)*r,y+h,z+Math.sin(a)*r);c.scale.y=.7;g.add(c);}ctx.noGrassC(x,z,1.6);},
 anel(ctx,x,z,r,n){const M=ctx.M,y=ctx.gy(x,z),g=ctx.g,caps=[M.capRed,M.capPurple,M.capTeal,M.capOrange,M.capPink];for(let i=0;i<n;i++){const a=i/n*PI*2,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r,h=.3+rnd()*.3;cyl(g,.06,.08,h,M.stem,px,y,pz,6,1);const c=new T.Mesh(new T.SphereGeometry(.22,9,5,0,PI*2,0,PI/2),caps[i%5]);c.position.set(px,y+h,pz);c.scale.y=.75;g.add(c);}ctx.noGrassC(x,z,r+1.6);},
 flor(ctx,x,z){const M=ctx.M,y=ctx.gy(x,z),g=ctx.g;cyl(g,.06,.09,2.6,M.leaf,x,y,z,6,1);for(let i=0;i<6;i++){const a=i/6*PI*2,p=cone(g,.2,.7,M.pink,x+Math.cos(a)*.3,y+2.5,z+Math.sin(a)*.3,5,1);p.rotation.z=-Math.cos(a)*1.0;p.rotation.x=Math.sin(a)*1.0;}sph(g,.2,M.glowPink,x,y+2.6,z,1,1,1,8);ctx.colCircle(x,z,.25);},
 poco(ctx,x,z){const M=ctx.M,y=ctx.gy(x,z),g=ctx.g;cyl(g,1.1,1.2,.9,M.stem,x,y,z,12,1.6);cyl(g,.8,.8,.04,M.water,x,y+.9,z,12,1);
  const c=new T.Mesh(new T.SphereGeometry(1.7,16,8,0,PI*2,0,PI/2),M.capTeal);c.scale.y=.55;c.position.set(x,y+2.5,z);g.add(c);for(const s of [-1,1])cyl(g,.07,.07,1.6,M.woodDark,x+s*1.0,y+.9,z,6,1);rod(g,x,y+2.5,z,x,y+1.2,z,.015,M.cloth,3);cyl(g,.16,.16,.26,M.woodDark,x,y+.95,z,8,1);ctx.colCircle(x,z,1.4);ctx.noGrassC(x,z,3);}
};
})();
