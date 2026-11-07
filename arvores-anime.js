/* Árvores no estilo anime (inspiradas em Genshin Impact) para formar floresta.
   - Árvores de copa redonda (vários "tufos" macios) e pinheiros em camadas.
   - Degradê na copa: base mais escura e topo iluminado, com contorno escuro.
   - Balançam com o vento no próprio shader.
   - Tudo em malhas instanciadas: centenas de árvores com poucas chamadas de
     desenho, para o jogo continuar leve. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const mobile=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||innerWidth<680;
const TREE_COUNT=mobile?140:300;
const OUTLINE='#2b2140';

// Aleatório com semente: a floresta é sempre a mesma.
let seed=20261107;
const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

// Tufo de copa: esfera levemente deformada (normais suaves para o contorno).
function blobGeometry(){
 const g=new T.SphereGeometry(1,12,9);
 const p=g.attributes.position,v=new T.Vector3();
 for(let i=0;i<p.count;i++){
  v.fromBufferAttribute(p,i);
  const k=1+.10*Math.sin(v.x*3.1+v.y*2.3)+.08*Math.sin(v.z*4.2-v.y*1.7);
  v.multiplyScalar(k);v.y*=.86;
  p.setXYZ(i,v.x,v.y,v.z);
 }
 g.computeVertexNormals();
 return g;
}
function coneGeometry(){
 const g=new T.ConeGeometry(1,1.5,12,2);
 const p=g.attributes.position,v=new T.Vector3();
 // Borda inferior ondulada (aparência de ramos).
 for(let i=0;i<p.count;i++){
  v.fromBufferAttribute(p,i);
  if(v.y<-.5){const a=Math.atan2(v.z,v.x);const k=1+.10*Math.sin(a*6);v.x*=k;v.z*=k;v.y-=.06*Math.cos(a*6);}
  p.setXYZ(i,v.x,v.y,v.z);
 }
 g.computeVertexNormals();
 return g;
}

const windUniforms={uAnimeTime:{value:0}};
// Degradê vertical + vento. "span" é a altura da geometria (para normalizar).
function foliageMaterial(span){
 const m=new T.MeshStandardMaterial({color:'#ffffff',roughness:1,metalness:0});
 m.onBeforeCompile=shader=>{
  shader.uniforms.uAnimeTime=windUniforms.uAnimeTime;
  shader.vertexShader='uniform float uAnimeTime;\nvarying float vAnimeShade;\n'+shader.vertexShader.replace(
   '#include <begin_vertex>',
   `#include <begin_vertex>
   vAnimeShade=clamp(position.y/${span.toFixed(2)}+.5,0.,1.);
   #ifdef USE_INSTANCING
   {
    vec2 root=instanceMatrix[3].xz;
    float sway=sin(uAnimeTime*1.3+root.x*.4+root.y*.3)*.06+sin(uAnimeTime*2.3+root.x*.9)*.025;
    transformed.x+=sway*(position.y/${span.toFixed(2)}+.5);
    transformed.z+=sway*.6*(position.y/${span.toFixed(2)}+.5);
   }
   #endif`);
  shader.fragmentShader='varying float vAnimeShade;\n'+shader.fragmentShader.replace(
   '#include <color_fragment>',
   `#include <color_fragment>
   diffuseColor.rgb*=mix(.62,1.12,smoothstep(.05,.95,vAnimeShade));`);
 };
 m.customProgramCacheKey=()=>'anime-foliage-'+span;
 return m;
}
function outlineMaterial(thickness){
 const m=new T.MeshBasicMaterial({color:OUTLINE,side:T.BackSide});
 m.onBeforeCompile=shader=>{
  shader.uniforms.uAnimeTime=windUniforms.uAnimeTime;
  shader.vertexShader='uniform float uAnimeTime;\n'+shader.vertexShader.replace(
   '#include <begin_vertex>',
   `#include <begin_vertex>
   transformed+=normal*${thickness.toFixed(3)};`);
 };
 m.customProgramCacheKey=()=>'anime-tree-outline-'+thickness;
 return m;
}

function placeTrees(ground,house){
 const b=ground.bounds,spots=[];
 const near=(x,z,d)=>spots.some(s=>(s.x-x)**2+(s.z-z)**2<d*d);
 const okAt=(x,z)=>{
  if(x<b.x0+2||x>b.x1-2||z<b.z0+2||z>b.z1-2)return false;
  if(!ground.isOpen(x,z,.5))return false;
  if(ground.greenAt(x,z)<.012)return false;
  if(house&&(x-house.position.x)**2+(z-house.position.z)**2<11*11)return false;
  // Deixa uma clareira em volta da ponte, onde o jogador começa.
  if(x*x+z*z<10*10)return false;
  return !near(x,z,2.4);
 };
 // Bosques: centros de agrupamento + algumas árvores soltas.
 const centers=[];
 for(let tries=0;tries<400&&centers.length<16;tries++){
  const x=b.x0+rnd()*(b.x1-b.x0),z=b.z0+rnd()*(b.z1-b.z0);
  if(ground.isOpen(x,z,2)&&ground.greenAt(x,z)>.02&&x*x+z*z>14*14)centers.push({x,z,r:5+rnd()*7});
 }
 let tries=0;
 while(spots.length<TREE_COUNT&&tries<TREE_COUNT*40){
  tries++;
  let x,z;
  if(centers.length&&rnd()<.75){
   const c=centers[Math.floor(rnd()*centers.length)],a=rnd()*Math.PI*2,r=Math.sqrt(rnd())*c.r;
   x=c.x+Math.cos(a)*r;z=c.z+Math.sin(a)*r;
  }else{x=b.x0+rnd()*(b.x1-b.x0);z=b.z0+rnd()*(b.z1-b.z0);}
  if(!okAt(x,z))continue;
  spots.push({x,z,y:ground.heightAt(x,z),pine:rnd()<.35,s:.8+rnd()*.6,rot:rnd()*Math.PI*2});
 }
 return spots;
}

function build(api,ground){
 const house=window.arcanoAnimeHouse||null;
 const spots=placeTrees(ground,house);
 const broad=spots.filter(s=>!s.pine),pines=spots.filter(s=>s.pine);
 const group=new T.Group();group.name='Floresta anime';

 const trunkGeo=new T.CylinderGeometry(.16,.26,1,7);trunkGeo.translate(0,.5,0);
 const trunkMat=new T.MeshStandardMaterial({color:'#7a5338',roughness:1});
 const trunks=new T.InstancedMesh(trunkGeo,trunkMat,spots.length);
 trunks.name='Troncos anime';

 const blob=blobGeometry(),cone=coneGeometry();
 const BLOBS=4,TIERS=3;
 const blobs=new T.InstancedMesh(blob,foliageMaterial(2),broad.length*BLOBS);
 const cones=new T.InstancedMesh(cone,foliageMaterial(1.5),pines.length*TIERS);
 blobs.name='Copas anime';cones.name='Pinheiros anime';
 const blobLine=new T.InstancedMesh(blob,outlineMaterial(.05),blobs.count);
 const coneLine=new T.InstancedMesh(cone,outlineMaterial(.045),cones.count);

 const broadColors=['#5fae4e','#6dbb52','#4f9a48','#86c454','#9ccb4e'].map(c=>new T.Color(c));
 const pineColors=['#3f8a5a','#347a52','#4b9562'].map(c=>new T.Color(c));
 const m=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),pos=new T.Vector3(),sc=new T.Vector3();
 let ti=0,bi=0,ci=0;
 for(const s of spots){
  const trunkH=(s.pine?1.6:2.0)*s.s;
  m.compose(pos.set(s.x,s.y-.1,s.z),q.setFromEuler(e.set(0,s.rot,0)),sc.set(s.s,trunkH,s.s));
  trunks.setMatrixAt(ti++,m);
  if(s.pine){
   const col=pineColors[Math.floor(rnd()*pineColors.length)];
   for(let k=0;k<TIERS;k++){
    const r=(1.55-k*.38)*s.s,h=s.y+trunkH*.55+k*1.0*s.s+.75*s.s;
    m.compose(pos.set(s.x,h,s.z),q.setFromEuler(e.set(0,s.rot+k,0)),sc.set(r,s.s*1.05,r));
    cones.setMatrixAt(ci,m);coneLine.setMatrixAt(ci,m);
    cones.setColorAt(ci,col.clone().offsetHSL(0,0,k*.03));ci++;
   }
  }else{
   const col=broadColors[Math.floor(rnd()*broadColors.length)];
   const top=s.y+trunkH;
   const offs=[[0,.55,0,1.35],[.85,.05,.3,1.0],[-.75,.1,-.35,1.05],[.1,.2,-.85,.95]];
   for(let k=0;k<BLOBS;k++){
    const [ox,oy,oz,r]=offs[k],c=Math.cos(s.rot),sn=Math.sin(s.rot);
    const x=s.x+(ox*c-oz*sn)*s.s,z=s.z+(ox*sn+oz*c)*s.s;
    m.compose(pos.set(x,top+oy*s.s,z),q.setFromEuler(e.set(0,s.rot+k*1.7,0)),sc.setScalar(r*s.s));
    blobs.setMatrixAt(bi,m);blobLine.setMatrixAt(bi,m);
    blobs.setColorAt(bi,col.clone().offsetHSL((rnd()-.5)*.02,0,(rnd()-.5)*.04));bi++;
   }
  }
 }
 for(const im of [trunks,blobs,cones,blobLine,coneLine]){
  im.instanceMatrix.needsUpdate=true;
  if(im.instanceColor)im.instanceColor.needsUpdate=true;
  im.frustumCulled=false;
  group.add(im);
 }
 trunks.castShadow=blobs.castShadow=cones.castShadow=!mobile;
 trunks.receiveShadow=blobs.receiveShadow=cones.receiveShadow=true;
 blobLine.userData.animeOutline=coneLine.userData.animeOutline=true;
 api.scene.add(group);

 const start=performance.now();
 blobs.onBeforeRender=()=>{windUniforms.uAnimeTime.value=(performance.now()-start)/1000;};
 window.arcanoAnimeForest={group,count:spots.length};
}

function install(){
 const api=window.arcanoWaterV1226,ground=window.arcanoAnimeGround;
 if(!api||!api.scene||!ground){setTimeout(install,300);return;}
 // Espera a casa (se houver) para não plantar árvores em cima dela.
 if(!window.arcanoAnimeHouse&&!install.waited){install.waited=true;setTimeout(install,1500);return;}
 build(api,ground);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
