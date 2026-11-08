/* Pedras no estilo anime espalhadas pelo mapa.
   - Rochedos grandes nos dois lados da cachoeira e ao longo da escarpa.
   - Pedras médias nas margens (algumas dentro d'água) e nas colinas.
   - Cada pedra é enterrada em ~30% da altura, usando o ponto MAIS BAIXO do
     terreno sob ela, para nunca parecer flutuar em encostas.
   O sombreamento (cinza-azulado, topo claro e musgo) vem de terreno-anime.js,
   que reconhece o nome "Pedras anime". */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const mobile=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||innerWidth<680;

let seed=7310;
const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

// Pedra facetada: icosaedro deformado e achatado (visual low-poly pintado).
function rockGeometry(variant){
 // Esfera indexada: normais suaves depois da deformação (sem faces retas).
 const g=new T.SphereGeometry(1,22,16);
 const p=g.attributes.position,v=new T.Vector3();
 const k1=1.7+variant*.9,k2=2.9+variant*.6;
 // O deslocamento depende só da posição: vértices repetidos continuam unidos.
 for(let i=0;i<p.count;i++){
  v.fromBufferAttribute(p,i);
  const d=1+.16*Math.sin(v.x*k1+v.z*2.1+variant)+.12*Math.sin(v.y*k2-v.x*1.3)+.08*Math.cos(v.z*3.7+variant*2.);
  v.multiplyScalar(d);v.y*=.68;if(v.y<-.2)v.y=-.2-(v.y+.2)*.3;
  p.setXYZ(i,v.x,v.y,v.z);
 }
 g.computeVertexNormals();
 return g;
}

function collectSpots(ground){
 const river=window.arcanoRiverProfile,b=ground.bounds,out=[];
 const fall=river&&river.fall;
 const half=z=>typeof river.halfWidth==='function'?river.halfWidth(z):river.halfWidth;
 const roadZ=x=>.92-.70*Math.sin(x*.47+.6)+.17*Math.sin(x*1.34);
 const house=window.arcanoAnimeHouse;
 const free=(x,z,r)=>{
  if(x<b.x0+1||x>b.x1-1||z<b.z0+1||z>b.z1-1)return false;
  if(Math.abs(z-roadZ(x))<2.2+r)return false;
  if(house&&(x-house.position.x)**2+(z-house.position.z)**2<(6.5+r)**2)return false;
  return !out.some(s=>(s.x-x)**2+(s.z-z)**2<(s.r+r)**2*.8);
 };
 const add=(x,z,r)=>{if(free(x,z,r))out.push({x,z,r,rot:rnd()*6.283,tilt:(rnd()-.5)*.35,v:Math.floor(rnd()*3)});};
 if(river&&fall){
  // Rochedos emoldurando a queda d'água e o poço.
  for(const side of [-1,1]){
   for(let i=0;i<7;i++){
    const z=fall.z-1.6+i*.75+(rnd()-.5)*.4;
    const x=river.center(z)+side*(half(z)+.25+rnd()*1.6);
    add(x,z,.9+rnd()*.9);
   }
   for(let i=0;i<6;i++){
    const z=fall.pool0+1+i*1.2;
    const x=river.center(z)+side*(half(z)+.1+rnd()*1.2);
    add(x,z,.5+rnd()*.6);
   }
  }
  // Algumas pedras na borda da queda (a água passa entre elas).
  for(let i=0;i<3;i++){const z=fall.z-.9;add(river.center(z)+(i-1)*1.4+(rnd()-.5)*.4,z,.35+rnd()*.25);}
  // Afloramentos ao longo da escarpa, atravessando o mapa.
  for(let x=b.x0+3;x<b.x1-3;x+=mobile?3.2:2.2){
   const lateral=Math.abs(x-river.center(fall.z));
   if(lateral<half(fall.z)+1)continue;
   const near=Math.min(1,Math.max(0,(lateral-3)/8));
   const cz=fall.z+(1.3*Math.sin(x*.13)+.6*Math.sin(x*.41))*near;
   if(rnd()<.75)add(x+(rnd()-.5)*1.2,cz+(rnd()-.5)*1.6,.6+rnd()*1.1);
  }
 }
 // Margens: pedras médias e pequenas, algumas um pouco dentro d'água.
 if(river){
  const n=mobile?60:120;
  for(let i=0;i<n;i++){
   const z=b.z0+2+rnd()*(b.z1-b.z0-4),side=rnd()<.5?-1:1;
   const x=river.center(z)+side*(half(z)-.4+rnd()*3.4);
   add(x,z,.22+rnd()*.42);
  }
 }
 // Colinas: pedras espalhadas, mais nas partes altas.
 const hillCount=mobile?50:110;
 for(let i=0,t=0;i<hillCount&&t<hillCount*20;t++){
  const x=b.x0+2+rnd()*(b.x1-b.x0-4),z=b.z0+2+rnd()*(b.z1-b.z0-4);
  if(river&&Math.abs(x-river.center(z))<half(z)+11)continue;
  const h=ground.heightAt(x,z);
  if(rnd()>.25+Math.max(0,h-(-.073*z))*.25)continue;
  add(x,z,.35+rnd()*.85);i++;
 }
 return out;
}

function build(api,ground){
 const spots=collectSpots(ground);
 const geos=[0,1,2].map(rockGeometry);
 const material=new T.MeshStandardMaterial({color:'#b9bec6',roughness:1,metalness:0});
 const group=new T.Group();group.name='Pedras anime';
 const lowRocks=[];
 const m=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),pos=new T.Vector3(),sc=new T.Vector3();
 for(let v=0;v<3;v++){
  const list=spots.filter(s=>s.v===v);
  if(!list.length)continue;
  const mesh=new T.InstancedMesh(geos[v],material,list.length);
  mesh.name='Pedras anime '+(v+1);
  list.forEach((s,i)=>{
   // Enterra a pedra: parte do ponto mais baixo sob ela.
   let lo=Infinity;
   for(let a=0;a<6;a++){
    const ang=a/6*6.283;
    lo=Math.min(lo,ground.heightAt(s.x+Math.cos(ang)*s.r*.8,s.z+Math.sin(ang)*s.r*.8));
   }
   lo=Math.min(lo,ground.heightAt(s.x,s.z));
   const sy=s.r*(.75+rnd()*.35);
   const y=lo-sy*.68*.3;
   // Pedras altas bloqueiam; as baixas (até ~70 cm) viram chão: dá para subir nelas.
   const topY=y+sy*.95;
   if(topY-ground.heightAt(s.x,s.z)>.7){if(window.arcanoObstacles)window.arcanoObstacles.addCircle(s.x,s.z,s.r*1.05);}
   else lowRocks.push({x:s.x,z:s.z,r:s.r*.85,top:topY});
   e.set(s.tilt,s.rot,s.tilt*.6);q.setFromEuler(e);
   m.compose(pos.set(s.x,y,s.z),q,sc.set(s.r,sy,s.r*(.85+rnd()*.3)));
   mesh.setMatrixAt(i,m);
  });
  mesh.instanceMatrix.needsUpdate=true;
  // Sombra só a do sol (o contorno escuro parecia uma sombra errada).
  mesh.castShadow=true;mesh.receiveShadow=true;
  mesh.frustumCulled=false;
  group.add(mesh);
 }
 api.scene.add(group);
 // Pedras baixas: o chão sobe em cúpula por cima delas (o personagem passa por cima).
 const cells=new Map(),key=(i,j)=>i+','+j;
 for(const r of lowRocks){const i=Math.floor(r.x/4),j=Math.floor(r.z/4);for(let a=i-1;a<=i+1;a++)for(let b=j-1;b<=j+1;b++){const k=key(a,b);if(!cells.has(k))cells.set(k,[]);cells.get(k).push(r);}}
 if(window.arcanoGroundOverrides)window.arcanoGroundOverrides.push((x,z)=>{
  const list=cells.get(key(Math.floor(x/4),Math.floor(z/4)));if(!list)return null;
  let best=null;
  for(const r of list){const d=Math.hypot(x-r.x,z-r.z)/r.r;if(d<1){const y=r.top-(r.top-ground.heightAt(r.x,r.z))*d*d;if(best==null||y>best)best=y;}}
  return best;
 });
 window.arcanoAnimeRocks={group,count:spots.length,spots};
}

function install(){
 const api=window.arcanoWaterV1226,ground=window.arcanoAnimeGround;
 if(!api||!api.scene||!ground){setTimeout(install,300);return;}
 // Espera a casa para não pôr pedras em cima dela.
 if(!window.arcanoAnimeHouse&&!install.waited){install.waited=true;setTimeout(install,1500);return;}
 build(api,ground);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
