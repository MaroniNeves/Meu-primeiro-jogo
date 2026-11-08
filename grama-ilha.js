/* Grama 3D da ilha inteira — usa a MESMA grama do jogo (tufos Quaternius do
   ecossistema, com o mesmo material: vento, passagem do personagem e cores
   anime). A área detalhada já tem a sua; aqui a grama é criada em blocos de
   16 × 16 m em volta do personagem (até ~56 m), só onde o chão é verde
   (sem estradas, cidade, água ou rocha), e blocos distantes são liberados. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const mobile=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||innerWidth<680;
const CHUNK=16,RANGE=mobile?40:56,PER_M2=mobile?5:9;
const INNER={x0:-64,x1:64,z0:-50,z1:50};

function hash(i,j,k){let h=(i*73856093)^(j*19349663)^(k*83492791);h=(h^(h>>>13))*1274126177;return ((h^(h>>>16))>>>0)/4294967296;}

function install(){
 const api=window.arcanoWaterV1226;
 if(!api||!api.scene||!window.arcanoIslandHeight||!window.arcanoIslandGreen){setTimeout(install,500);return;}
 // Pega as malhas de grama já existentes (geometria + material de verdade).
 const kinds=new Map();
 api.scene.traverse(o=>{if(o.isInstancedMesh&&o.name&&o.name.startsWith('Tapete de grama')&&!kinds.has(o.geometry.uuid))kinds.set(o.geometry.uuid,{geo:o.geometry,mat:o.material});});
 if(kinds.size<1){setTimeout(install,1500);return;}
 const types=[...kinds.values()];
 const group=new T.Group();group.name='Grama da Ilha Central';api.scene.add(group);
 const chunks=new Map();
 const m4=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),p=new T.Vector3(),s=new T.Vector3();
 const h=window.arcanoIslandHeight,gr=window.arcanoIslandGreen,water=window.arcanoOuterWater;
 const island=window.arcanoIsland;
 function okAt(x,z){
  if(x>INNER.x0-1&&x<INNER.x1+1&&z>INNER.z0-1&&z<INNER.z1+1)return false; // área detalhada já tem grama
  if(island&&Math.hypot(x-island.center.x,z-island.center.z)>island.radius-8)return false;
  const cs=window.arcanoCastleSite;if(cs&&Math.hypot(x-cs.x,z-cs.z)<cs.radius+6)return false; // castelo e pátio
  if(gr(x,z)<.55)return false;
  if(water&&water(x,z))return false;
  // Sem grama em encostas íngremes (rocha).
  const y=h(x,z);if(Math.abs(h(x+1,z)-y)>.75||Math.abs(h(x,z+1)-y)>.75)return false;
  return true;
 }
 function build(ci,cj){
  const x0=ci*CHUNK,z0=cj*CHUNK,count=Math.round(CHUNK*CHUNK*PER_M2);
  const lists=types.map(()=>[]);
  for(let k=0;k<count;k++){
   const x=x0+hash(ci,cj,k*3)*CHUNK,z=z0+hash(ci,cj,k*3+1)*CHUNK;
   if(!okAt(x,z))continue;
   lists[Math.floor(hash(ci,cj,k*3+2)*types.length)%types.length].push([x,z,hash(cj,ci,k)]);
  }
  const meshes=[];
  lists.forEach((list,t)=>{
   if(!list.length)return;
   const im=new T.InstancedMesh(types[t].geo,types[t].mat,list.length);
   im.name='Tapete de grama Ilha '+ci+','+cj;
   list.forEach(([x,z,r],i)=>{
    m4.compose(p.set(x,h(x,z)-.02,z),q.setFromEuler(e.set(0,r*6.283,0)),s.setScalar(.85+r*.4));
    im.setMatrixAt(i,m4);
   });
   im.instanceMatrix.needsUpdate=true;im.castShadow=false;im.receiveShadow=true;
   im.computeBoundingSphere&&im.computeBoundingSphere();
   group.add(im);meshes.push(im);
  });
  return meshes;
 }
 // Atualiza no máximo 1 bloco por quadro (sem travadas).
 let queue=[];
 function update(){
  const pl=api.getGrassPlayer&&api.getGrassPlayer();
  const cam=api.getMainCamera&&api.getMainCamera();
  const src=pl?pl.position:cam&&cam.position;if(!src)return;
  const ci0=Math.floor(src.x/CHUNK),cj0=Math.floor(src.z/CHUNK),rc=Math.ceil(RANGE/CHUNK);
  const want=new Set();
  for(let i=ci0-rc;i<=ci0+rc;i++)for(let j=cj0-rc;j<=cj0+rc;j++){
   const cx=(i+.5)*CHUNK,cz=(j+.5)*CHUNK;
   if(Math.hypot(cx-src.x,cz-src.z)>RANGE+CHUNK*.7)continue;
   const key=i+','+j;want.add(key);
   if(!chunks.has(key)&&!queue.some(q=>q.key===key))queue.push({key,i,j,d:Math.hypot(cx-src.x,cz-src.z)});
  }
  for(const [key,meshes] of chunks){
   if(want.has(key))continue;
   for(const m of meshes){group.remove(m);m.dispose&&m.dispose();}
   chunks.delete(key);
  }
  queue=queue.filter(q=>want.has(q.key)).sort((a,b)=>a.d-b.d);
 }
 setInterval(update,500);
 (function tick(){
  requestAnimationFrame(tick);
  const job=queue.shift();
  if(job&&!chunks.has(job.key))chunks.set(job.key,build(job.i,job.j));
 })();
 window.arcanoIslandGrass={group,chunks};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
