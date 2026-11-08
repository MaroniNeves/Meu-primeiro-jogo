/* Ponte em arco no estilo anime (Genshin Impact), no lugar da ponte reta.
   - Mesma posição e vão da ponte original; mais larga (2,2 m).
   - Tábuas seguindo a curva do arco, vigas laterais, corrimão com postes,
     cabeceiras de pedra e lampiões que acendem à noite.
   - O piso de caminhada acompanha o arco (o personagem sobe e desce). */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
let seed=771;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
function canvasTex(draw){
 const c=document.createElement('canvas');c.width=c.height=256;draw(c.getContext('2d'),256);
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}
const woodTex=canvasTex((g,s)=>{
 for(let p=0;p<4;p++){const x=p*s/4;g.fillStyle=`hsl(25,${36+rnd()*10}%,${34+rnd()*10}%)`;g.fillRect(x,0,s/4,s);
  g.strokeStyle='rgba(40,22,10,.25)';for(let k=0;k<6;k++){g.beginPath();const gx=x+4+rnd()*(s/4-8);g.moveTo(gx,0);g.bezierCurveTo(gx+(rnd()-.5)*10,s*.3,gx+(rnd()-.5)*10,s*.7,gx,s);g.stroke();}
  g.fillStyle='rgba(25,12,5,.6)';g.fillRect(x,0,2,s);}
});
const stoneTex=canvasTex((g,s)=>{
 g.fillStyle='#6f7177';g.fillRect(0,0,s,s);
 for(let r=0;r<5;r++){let x=-rnd()*40;const y=r*s/5;while(x<s){const w=40+rnd()*50;g.fillStyle=`hsl(220,${6+rnd()*6}%,${55+rnd()*15}%)`;
  g.beginPath();g.roundRect?g.roundRect(x+2,y+2,w-4,s/5-4,6):g.rect(x+2,y+2,w-4,s/5-4);g.fill();x+=w;}}
});
const M={
 wood:new T.MeshStandardMaterial({color:'#9a7356',map:woodTex,roughness:1}),
 woodDark:new T.MeshStandardMaterial({color:'#6b4a35',map:woodTex,roughness:1}),
 red:new T.MeshStandardMaterial({color:'#b5483c',roughness:1}),
 stone:new T.MeshStandardMaterial({color:'#ffffff',map:stoneTex,roughness:1}),
 lamp:new T.MeshStandardMaterial({color:'#ffe2a0',emissive:new T.Color('#ffc766'),emissiveIntensity:.4,roughness:.6})
};
const outline=new T.MeshBasicMaterial({color:'#2b2140',side:T.BackSide});
function box(g,w,h,d,m,x,y,z,rz=0,line=true){
 const geo=new T.BoxGeometry(w,h,d);const mesh=new T.Mesh(geo,m);mesh.position.set(x,y,z);mesh.rotation.z=rz;
 mesh.castShadow=true;mesh.receiveShadow=true;
 if(line){const s=new T.Mesh(geo,outline);s.scale.setScalar(1.04);s.userData.animeOutline=true;mesh.add(s);}
 g.add(mesh);return mesh;
}

function install(){
 const api=window.arcanoWaterV1226,solid=window.arcanoBridgeSolid;
 if(!api||!api.scene||!solid||!solid.center){setTimeout(install,300);return;}
 let old=null;api.scene.traverse(o=>{if(!old&&o.name&&o.name.startsWith('Ponte de madeira'))old=o;});
 if(!old){setTimeout(install,300);return;}
 // Esconde só o visual da ponte antiga (as funções de colisão continuam existindo).
 old.traverse(o=>{if(o.isMesh)o.visible=false;});

 // Arco proporcional ao vão (ponte mais longa = arco mais alto).
 const half=solid.span/2,deck=solid.deckY,rot=solid.rotation||0,RISE=Math.max(.65,solid.span*.05),HW=1.25;
 const arch=a=>RISE*Math.max(0,1-(a/half)**2);
 const slope=a=>-2*RISE*a/(half*half);
 const g=new T.Group();g.name='Ponte em arco anime';
 g.position.set(solid.center.x,deck,solid.center.z);g.rotation.y=rot;
 // Tábuas do piso.
 const planks=Math.round(solid.span/.42);
 for(let i=0;i<=planks;i++){
  const a=-half+i*solid.span/planks;
  box(g,.38,.08,HW*2,M.wood,a,arch(a)-.02,(rnd()-.5)*.04,Math.atan(slope(a)),false);
 }
 // Vigas laterais curvas, postes, corrimão e travessas.
 const SEG=16;
 for(const side of [-1,1]){
  for(let i=0;i<SEG;i++){
   const a0=-half-.2+i*(solid.span+.4)/SEG,a1=a0+(solid.span+.4)/SEG,am=(a0+a1)/2;
   const len=Math.hypot(a1-a0,arch(a1)-arch(a0));
   const ang=Math.atan2(arch(a1)-arch(a0),a1-a0);
   box(g,len+.02,.28,.16,M.woodDark,am,arch(am)-.18,side*(HW+.02),ang);
   box(g,len+.02,.09,.12,M.red,am,arch(am)+.98,side*(HW+.02),ang);        // corrimão
   box(g,len+.02,.05,.06,M.woodDark,am,arch(am)+.55,side*(HW+.02),ang,false); // travessa
  }
  for(let i=0;i<=8;i++){
   const a=-half+i*solid.span/8;
   const post=box(g,.16,1.15,.16,M.red,a,arch(a)+.47,side*(HW+.02));
   box(g,.24,.1,.24,M.woodDark,a,arch(a)+1.08,side*(HW+.02));
   if(i===0||i===8){
    // Lampiões nas pontas.
    const l=new T.Mesh(new T.BoxGeometry(.26,.32,.26),M.lamp);l.position.set(a,arch(a)+1.32,side*(HW+.02));g.add(l);
    box(g,.32,.06,.32,M.woodDark,a,arch(a)+1.5,side*(HW+.02));
   }
   void post;
  }
 }
 // Cabeceiras de pedra nas duas margens.
 for(const end of [-1,1])box(g,1.2,.9,HW*2+.7,M.stone,end*(half+.2),-.38,0);
 api.scene.add(g);

 // Piso: segue o arco e é mais largo; corrimãos bloqueiam a passagem lateral.
 const cs=Math.cos(rot),sn=Math.sin(rot);
 const local=(x,z)=>{const dx=x-solid.center.x,dz=z-solid.center.z;return {along:dx*cs-dz*sn,side:dx*sn+dz*cs};};
 const baseSurface=solid.surfaceAt,baseBlocks=solid.blocksSegment;
 solid.surfaceAt=(x,z)=>{
  const p=local(x,z);
  if(Math.abs(p.along)<=half+.15&&Math.abs(p.side)<=HW-.15)return deck+.0325+arch(p.along);
  return baseSurface?baseSurface(x,z):null;
 };
 solid.blocksSegment=(x0,z0,x1,z1)=>{
  const a=local(x0,z0),b=local(x1,z1);
  // Atravessar o corrimão (de dentro para fora ou de fora para dentro) ao longo do vão.
  if(Math.abs(b.along)<half-.3&&Math.abs(a.along)<half-.3){
   const inA=Math.abs(a.side)<=HW-.15,inB=Math.abs(b.side)<=HW-.15;
   if(inA!==inB)return true;
  }
  return false;
 };
 setInterval(()=>{
  const s=window.arcanoAnimeSky&&window.arcanoAnimeSky.material.uniforms.uSunDir.value;
  const night=s?Math.min(1,Math.max(0,(-s.y+.02)/.2)):0;
  M.lamp.emissiveIntensity=.4+night*1.8;
 },1000);
 window.arcanoAnimeBridge=g;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
