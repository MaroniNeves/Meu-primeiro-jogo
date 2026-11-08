/* Grama 3D da ilha inteira — usa a MESMA grama do jogo (tufos Quaternius do
   ecossistema, com o mesmo material: vento, passagem do personagem e cores
   anime). Criada em blocos de 16 × 16 m em volta do personagem, só onde o chão
   é verde (sem estradas, cidade, água, rocha, escadas ou praças).
   - Fora da área detalhada: segue o "verde" da ilha.
   - Dentro da área detalhada: preenche só os buracos (lugares onde a grama
     original não chegou), para não ficar com manchas verdes lisas.
   - Perto: densidade cheia; longe: metade (mais leve). */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const mobile=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||innerWidth<680;
const CHUNK=24,RANGE=mobile?44:72,NEAR=mobile?28:36,PER_M2=mobile?5:8;
const INNER={x0:-64,x1:64,z0:-50,z1:50};
// Outros módulos registram aqui áreas sem grama: (x,z)=>true.
window.arcanoNoGrass=window.arcanoNoGrass||[];

const tris=g=>(g.index?g.index.count:g.attributes.position.count)/3;
function hash(i,j,k){let h=(i*73856093)^(j*19349663)^(k*83492791);h=(h^(h>>>13))*1274126177;return ((h^(h>>>16))>>>0)/4294967296;}

function install(){
 const api=window.arcanoWaterV1226;
 if(!api||!api.scene||!window.arcanoIslandHeight||!window.arcanoIslandGreen||!window.arcanoAnimeGround){setTimeout(install,500);return;}
 const kinds=new Map(),orig=[];
 api.scene.traverse(o=>{if(o.isInstancedMesh&&o.name&&o.name.startsWith('Tapete de grama')){orig.push(o);if(!kinds.has(o.geometry.uuid))kinds.set(o.geometry.uuid,{geo:o.geometry,mat:o.material});}});
 if(kinds.size<1){setTimeout(install,1500);return;}
 // Tipos do mais leve ao mais pesado (triângulos por tufo): longe só os leves.
 const types=[...kinds.values()].sort((a,b)=>tris(a.geo)-tris(b.geo));
 const light=Math.min(2,types.length);
 // Ocupação da grama original da área detalhada (células de 2 m).
 const occ=new Map(),m4=new T.Matrix4(),v=new T.Vector3();
 for(const o of orig){o.updateMatrixWorld(true);for(let i=0;i<o.count;i++){o.getMatrixAt(i,m4);v.setFromMatrixPosition(m4).applyMatrix4(o.matrixWorld);const k=Math.floor(v.x/2)+','+Math.floor(v.z/2);occ.set(k,(occ.get(k)||0)+1);}}
 const filled=(x,z)=>{let n=0;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)n+=occ.get((Math.floor(x/2)+a)+','+(Math.floor(z/2)+b))||0;return n>6;};
 const innerGeo=api.terrain.geometry,IP=innerGeo.attributes.position,IG=innerGeo.attributes.animeGreen;
 let INX=1;while(INX<IP.count&&Math.abs(IP.getZ(INX)-IP.getZ(0))<1e-6)INX++;
 const INZ=Math.round(IP.count/INX),IX0=IP.getX(0),IX1=IP.getX(INX-1),IZ0=IP.getZ(0),IZ1=IP.getZ((INZ-1)*INX);
 const innerGreen=(x,z)=>{const i=Math.round((x-IX0)/(IX1-IX0)*(INX-1)),j=Math.round((z-IZ0)/(IZ1-IZ0)*(INZ-1));if(i<0||j<0||i>=INX||j>=INZ)return 0;return IG.array[(j*INX+i)*IG.itemSize];};
 const group=new T.Group();group.name='Grama da Ilha Central';api.scene.add(group);
 const chunks=new Map();
 const q=new T.Quaternion(),e=new T.Euler(),p=new T.Vector3(),s=new T.Vector3();
 const h=window.arcanoIslandHeight,gr=window.arcanoIslandGreen,water=window.arcanoOuterWater,ground=window.arcanoAnimeGround;
 const island=window.arcanoIsland;
 const inInner=(x,z)=>x>INNER.x0+.4&&x<INNER.x1-.4&&z>INNER.z0+.4&&z<INNER.z1-.4;
 const innerWater=(x,z)=>{const wl=window.arcanoWaterLevelAt;if(!wl)return false;const l=wl(x,z);return l!=null&&l>ground.heightAt(x,z)-.05;};
 // Altura do chão onde pode nascer grama (ou null).
 // Estradas: nada de grama no calçamento nem na borda dele.
 const roads=(island&&island.roads||[]).map(l=>{let a=1e9,b=-1e9,c=1e9,d=-1e9;for(const p of l){a=Math.min(a,p.x);b=Math.max(b,p.x);c=Math.min(c,p.z);d=Math.max(d,p.z);}return {l,box:[a-4,b+4,c-4,d+4]};});
 const onRoad=(x,z)=>{
  if(x>INNER.x0&&x<INNER.x1&&Math.abs(z-(.92-.70*Math.sin(x*.47+.6)+.17*Math.sin(x*1.34)))<2.6)return true; // trilha da área central
  for(const r of roads){const b=r.box;if(x<b[0]||x>b[1]||z<b[2]||z>b[3])continue;const L=r.l;
   for(let i=0;i<L.length-1;i++){const a=L[i],c=L[i+1],vx=c.x-a.x,vz=c.z-a.z,wx=x-a.x,wz=z-a.z,t=Math.max(0,Math.min(1,(wx*vx+wz*vz)/(vx*vx+vz*vz)));if(Math.hypot(wx-vx*t,wz-vz*t)<3.4)return true;}}
  return false;
 };
 // A grama original que nasceu em cima de estrada some (escala zero).
 {const zero=new T.Matrix4().makeScale(0,0,0),mm=new T.Matrix4(),vv=new T.Vector3();
  for(const o of orig){let ch=false;for(let i=0;i<o.count;i++){o.getMatrixAt(i,mm);vv.setFromMatrixPosition(mm).applyMatrix4(o.matrixWorld);if(onRoad(vv.x,vv.z)){o.setMatrixAt(i,zero);ch=true;}}if(ch)o.instanceMatrix.needsUpdate=true;}}
 function spot(x,z){
  for(const f of window.arcanoNoGrass)if(f(x,z))return null;
  if(onRoad(x,z))return null;
  const cs=window.arcanoCastleSite;if(cs&&Math.hypot(x-cs.x,z-cs.z)<cs.radius+2)return null; // castelo (o jardim tem a sua)
  if(inInner(x,z)){
   if(innerGreen(x,z)<.55||filled(x,z)||innerWater(x,z))return null;
   const y=ground.heightAt(x,z);if(Math.abs(ground.heightAt(x+1,z)-y)>.7||Math.abs(ground.heightAt(x,z+1)-y)>.7)return null;
   return y;
  }
  if(island&&Math.hypot(x-island.center.x,z-island.center.z)>island.radius-8)return null;
  if(gr(x,z)<.42)return null;
  if(water&&water(x,z))return null;
  const y=h(x,z);if(Math.abs(h(x+1,z)-y)>.75||Math.abs(h(x,z+1)-y)>.75)return null;
  return y;
 }
 function build(ci,cj,dens){
  const x0=ci*CHUNK,z0=cj*CHUNK,count=Math.round(CHUNK*CHUNK*PER_M2*dens);
  const lists=types.map(()=>[]);
  for(let k=0;k<count;k++){
   const x=x0+hash(ci,cj,k*3)*CHUNK,z=z0+hash(ci,cj,k*3+1)*CHUNK;
   const y=spot(x,z);if(y==null)continue;
   const nt=dens<1?light:types.length;
   lists[Math.floor(hash(ci,cj,k*3+2)*nt)%nt].push([x,y,z,hash(cj,ci,k)]);
  }
  const meshes=[];
  lists.forEach((list,t)=>{
   if(!list.length)return;
   const im=new T.InstancedMesh(types[t].geo,types[t].mat,list.length);
   im.name='Tapete de grama Ilha '+ci+','+cj;
   list.forEach(([x,y,z,r],i)=>{
    m4.compose(p.set(x,y-.02,z),q.setFromEuler(e.set(0,r*6.283,0)),s.setScalar(.85+r*.4));
    im.setMatrixAt(i,m4);
   });
   im.instanceMatrix.needsUpdate=true;im.castShadow=false;im.receiveShadow=true;
   im.computeBoundingSphere&&im.computeBoundingSphere();
   group.add(im);meshes.push(im);
  });
  return {meshes,dens};
 }
 const free=c=>{for(const m of c.meshes){group.remove(m);m.dispose&&m.dispose();}};
 // Atualiza no máximo 1 bloco por quadro (sem travadas).
 let queue=[];
 function update(){
  const pl=api.getGrassPlayer&&api.getGrassPlayer();
  const cam=api.getMainCamera&&api.getMainCamera();
  const src=pl?pl.position:cam&&cam.position;if(!src)return;
  const ci0=Math.floor(src.x/CHUNK),cj0=Math.floor(src.z/CHUNK),rc=Math.ceil(RANGE/CHUNK);
  const want=new Map();
  for(let i=ci0-rc;i<=ci0+rc;i++)for(let j=cj0-rc;j<=cj0+rc;j++){
   const cx=(i+.5)*CHUNK,cz=(j+.5)*CHUNK,d=Math.hypot(cx-src.x,cz-src.z);
   if(d>RANGE+CHUNK*.7)continue;
   const dens=d<NEAR+CHUNK*.7?1:.5,key=i+','+j;want.set(key,dens);
   const have=chunks.get(key);
   if((!have||have.dens!==dens)&&!queue.some(q=>q.key===key&&q.dens===dens))queue.push({key,i,j,d,dens});
  }
  for(const [key,c] of chunks){if(want.has(key))continue;free(c);chunks.delete(key);}
  queue=queue.filter(q=>want.get(q.key)===q.dens).sort((a,b)=>a.d-b.d);
 }
 setInterval(update,500);
 (function tick(){
  requestAnimationFrame(tick);
  const job=queue.shift();if(!job)return;
  const have=chunks.get(job.key);if(have&&have.dens===job.dens)return;
  const c=build(job.i,job.j,job.dens);if(have)free(have);chunks.set(job.key,c);
 })();
 window.arcanoIslandGrass={group,chunks};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
