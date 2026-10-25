/* Ateliê Arcano V12.65 — VFX do feiticeiro, reconstruídos com base nas
 * linguagens visuais ArcaneVolley, Dragonbreath e Glacier do catálogo V8.
 * Cena independente, sem mexer em física, chuva, grama ou árvores.
 * Os componentes usam geometria compartilhada e poucas instâncias.
 */
(function(){
'use strict';
window.arcanoSpellEffectsV1265=function(T,scene,options={}){
 const terrain=options.terrainAt||(()=>0);
 const collides=options.collides||(()=>false);
 const bounds=options.bounds||{x:64,z:50};
 const palettes=[
  {core:0xb3c6e8,light:0x788cba,dim:0x414f77,name:'Rajada Arcana'},
  {core:0xffb46c,light:0xc77743,dim:0x843b31,name:'Sopro de Brasas'},
  {core:0xc5f4fa,light:0x83b6ca,dim:0x436e94,name:'Lâminas Glaciais'}
 ];
 const V=new T.Vector3(),Y=new T.Vector3(0,1,0),dummy=new T.Object3D();
 const octa=new T.OctahedronGeometry(1,0),
  shard=new T.ConeGeometry(1,1,5),
  embers=new T.TetrahedronGeometry(1,0),
  ringGeom=new T.RingGeometry(.76,1,48),
  runeGeom=new T.BufferGeometry();
 const runes=[],radii=1.0;
 const segs=[];
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6, inner=.66,outer=(i%3===0?1.12:.94);
  segs.push(Math.cos(a)*inner,Math.sin(a)*inner,0,
    Math.cos(a)*outer,Math.sin(a)*outer,0);
  const b=a+.20;
  segs.push(Math.cos(a)*.56,Math.sin(a)*.56,0,
    Math.cos(b)*.48,Math.sin(b)*.48,0);
 }
 runeGeom.setAttribute('position',new T.Float32BufferAttribute(segs,3));
 const travel=[],impact=[],casting=[];
 let created=0;
 const mats=[];
 const solidMat=(hex,alpha=1,blend=false)=>new T.MeshBasicMaterial({
  color:hex,transparent:alpha<1,opacity:alpha,depthWrite:alpha>=1,
  blending:blend?T.AdditiveBlending:T.NormalBlending,
  side:T.DoubleSide
 });
 const lineMat=(hex,alpha)=>new T.LineBasicMaterial({
  color:hex,transparent:true,opacity:alpha,depthWrite:false,
  blending:T.AdditiveBlending
 });
 function item(group,geom,mat){const mesh=new T.Mesh(geom,mat);group.add(mesh);return mesh;}
 function instance(group,geom,mat,count){
  const inst=new T.InstancedMesh(geom,mat,count);
  inst.frustumCulled=false;inst.count=count;group.add(inst);return inst;
 }
 function dispose(group){
  scene.remove(group);
  group.traverse(o=>{
   if(!o.material)return;
   const all=Array.isArray(o.material)?o.material:[o.material];
   for(const m of all)m.dispose?.();
   if(o.geometry?.userData?.arcanoDisposable)o.geometry.dispose();
  });
 }
 function geometryLine(points){
  const geom=new T.BufferGeometry();
  geom.setAttribute('position',new T.BufferAttribute(new Float32Array(points*3),3));
  geom.setDrawRange(0,0);geom.userData.arcanoDisposable=true;
  return geom;
 }
 function makeRune(slot,origin,dir){
  const p=palettes[slot],group=new T.Group();
  group.position.copy(origin);
  const outer=item(group,ringGeom,solidMat(p.light,.45,true));
  outer.scale.setScalar(.36);
  const marks=new T.LineSegments(runeGeom,lineMat(p.core,.80));
  marks.scale.setScalar(.39);group.add(marks);
  // A placa de glifos olha para a câmera, não para o chão.
  scene.add(group);casting.push({slot,group,outer,marks,age:0,life:.47,dir:dir.clone()});
  if(casting.length>8)dispose(casting.shift().group);
 }
 function decorateArcane(p){
  const group=p.group,pal=palettes[0],bolts=[];
  for(let n=0;n<3;n++){
   const blade=item(group,octa,solidMat(n===0?pal.core:pal.light,n===0?.94:.83));
   blade.scale.set(.075,n===0?.42:.34,.075);
   blade.quaternion.setFromUnitVectors(Y,p.dir);
   bolts.push(blade);
  }
  p.blades=bolts;
  p.sparks=instance(group,embers,solidMat(pal.core,.75,true),25);
  p.trails=[];
  for(let n=0;n<3;n++){
   const path=new T.Line(geometryLine(26),lineMat(n===0?pal.core:pal.light,n===0?.73:.43));
   path.frustumCulled=false;scene.add(path);p.trails.push(path);
  }
 }
 function decorateFire(p){
  const pal=palettes[1],g=p.group;
  p.flames=[];
  for(let i=0;i<5;i++){
   const mesh=item(g,shard,solidMat(i%2?pal.light:pal.core,.81-i*.075,true));
   mesh.scale.set(.125+i*.024,.48+i*.10,.14+i*.022);
   mesh.quaternion.setFromUnitVectors(Y,p.dir);
   p.flames.push(mesh);
  }
  p.sparks=instance(g,embers,solidMat(pal.light,.75,true),34);
  p.trails=[];
  for(let i=0;i<2;i++){
   const path=new T.Line(geometryLine(26),lineMat(i?pal.dim:pal.light,i?.38:.70));
   path.frustumCulled=false;scene.add(path);p.trails.push(path);
  }
 }
 function decorateIce(p){
  const pal=palettes[2],g=p.group;
  p.crystals=[];
  for(let i=0;i<7;i++){
   const blade=item(g,octa,solidMat(i%3?pal.light:pal.core,i%2?.84:.98));
   blade.scale.set(.075,.40+(i%3)*.12,.095);
   blade.quaternion.setFromUnitVectors(Y,p.dir);
   p.crystals.push(blade);
  }
  p.sparks=instance(g,embers,solidMat(pal.core,.77,true),18);
  p.trails=[];
  for(let i=0;i<3;i++){
   const path=new T.Line(geometryLine(26),lineMat(pal.light,.55));
   path.frustumCulled=false;scene.add(path);p.trails.push(path);
  }
 }
 function launch(slot,origin,dir){
  slot=Math.min(2,Math.max(0,slot|0));
  if(travel.length>=5)finishProjectile(travel.shift(),false);
  const direction=dir.clone().normalize();
  const g=new T.Group();g.position.copy(origin);
  const projectile={
   slot,group:g,dir:direction,age:0,distance:0,history:[],sparks:null,
   trails:[],seed:created++*.723,launchY:origin.y,
   speed:[11.3,8.1,10.4][slot],range:[15,11,13.5][slot]
  };
  scene.add(g);
  if(slot===0)decorateArcane(projectile);
  if(slot===1)decorateFire(projectile);
  if(slot===2)decorateIce(projectile);
  travel.push(projectile);
  return projectile;
 }
 function begin(slot,origin,dir){makeRune(slot,origin,dir);}
 function updateTrace(p){
  p.history.unshift(p.group.position.clone());
  if(p.history.length>24)p.history.length=24;
  for(let i=0;i<p.trails.length;i++){
   const line=p.trails[i],arr=line.geometry.attributes.position.array;
   const offset=i*.075;
   for(let k=0;k<p.history.length;k++){
    const point=p.history[k];
    arr[k*3]=point.x+Math.sin(p.age*7+k*.28+i*2)*offset;
    arr[k*3+1]=point.y+Math.cos(p.age*6+k*.22+i)*offset;
    arr[k*3+2]=point.z+Math.cos(p.age*5+k*.23+i*2)*offset;
   }
   line.geometry.setDrawRange(0,p.history.length);
   line.geometry.attributes.position.needsUpdate=true;
  }
 }
 function scatter(p){
  const count=p.sparks.count;
  for(let i=0;i<count;i++){
   const a=i*2.39996+p.seed;
   const t=p.age*(p.slot===1?8:5)+i*.39;
   const fan=p.slot===1?.30:p.slot===2?.24:.19;
   const r=(.045+(i%6)*fan/5)*(0.65+.35*Math.sin(t));
   const bx=Math.sin(a+t*.24)*r,bz=Math.cos(a+t*.24)*r;
   const back=(i%9)*(.04+(p.slot===1?.033:.021));
   const side=new T.Vector3(-p.dir.z,0,p.dir.x);
   dummy.position.copy(p.group.position).addScaledVector(p.dir,-back);
   dummy.position.addScaledVector(side,bx);
   dummy.position.y+=bz;
   if(p.slot===1)dummy.position.y+=i%3*.055;
   dummy.scale.setScalar(p.slot===1?.028+(i%4)*.009:.019+(i%3)*.008);
   dummy.rotation.set(a,t,a*.37);
   dummy.updateMatrix();p.sparks.setMatrixAt(i,dummy.matrix);
  }
  p.sparks.instanceMatrix.needsUpdate=true;
 }
 function moveDetails(p,dt){
  const t=p.age;
  if(p.slot===0){
   const lateral=V.set(-p.dir.z,0,p.dir.x);
   p.blades.forEach((blade,i)=>{
    const angle=t*10+i*Math.PI*2/3;
    const r=i===0?.075:.19;
    blade.position.copy(lateral).multiplyScalar(Math.cos(angle)*r);
    blade.position.y=Math.sin(angle)*r;
    blade.rotation.y+=dt*6;
   });
  }else if(p.slot===1){
   p.flames.forEach((mesh,i)=>{
    const t2=t*9+i*1.43;
    mesh.position.copy(p.dir).multiplyScalar(-i*.095);
    mesh.position.x+=Math.sin(t2)*(.075+i*.017);
    mesh.position.y+=Math.cos(t2*1.1)*(.085+i*.011);
    mesh.scale.x=(.10+i*.028)*(1+.22*Math.sin(t2*1.7));
    mesh.scale.z=mesh.scale.x;
   });
  }else{
   const side=V.set(-p.dir.z,0,p.dir.x);
   p.crystals.forEach((mesh,i)=>{
    const r=i-3;
    mesh.position.copy(side).multiplyScalar(r*.087);
    mesh.position.y=Math.sin(t*6+i)*.065+Math.abs(r)*-.04;
    mesh.position.addScaledVector(p.dir,-Math.abs(r)*.12);
    mesh.rotation.z+=dt*(i%2?3:-2.2);
   });
  }
  scatter(p);updateTrace(p);
 }
 function createImpact(slot,position){
  if(impact.length>=6)dispose(impact.shift().group);
  const pal=palettes[slot],g=new T.Group(),pieces=[];
  g.position.copy(position);
  const main=item(g,ringGeom,solidMat(pal.light,.69,true));
  main.rotation.x=-Math.PI/2;main.scale.setScalar(.22);
  const second=item(g,ringGeom,solidMat(pal.core,.34,true));
  second.rotation.x=-Math.PI/2;second.scale.setScalar(.13);
  const count=slot===0?10:slot===1?18:12;
  const frag=instance(g,slot===2?octa:embers,solidMat(pal.core,.83,true),count);
  const p={slot,group:g,main,second,frag,age:0,life:slot===1?.79:.70,count};
  scene.add(g);impact.push(p);
  return p;
 }
 function finishProjectile(p,withImpact=true){
  if(withImpact){
   const pos=p.group.position.clone();
   pos.y=Math.max(terrain(pos.x,pos.z)+.04,pos.y-.45);
   createImpact(p.slot,pos);
  }
  for(const line of p.trails){
   scene.remove(line);line.geometry.dispose();line.material.dispose();
  }
  dispose(p.group);
 }
 function update(dt,camera=null){
  dt=Math.min(Math.max(dt||0,0),.075);
  for(let i=casting.length-1;i>=0;i--){
   const p=casting[i];p.age+=dt;
   const phase=Math.min(1,p.age/p.life);
   p.group.scale.setScalar(.76+phase*.5);
   p.group.rotation.z+=dt*2;
   if(camera)p.group.quaternion.copy(camera.quaternion);
   p.outer.material.opacity=.45*(1-phase);
   p.marks.material.opacity=.78*(1-phase);
   if(phase>=1){dispose(p.group);casting.splice(i,1);}
  }
  for(let i=travel.length-1;i>=0;i--){
   const p=travel[i];p.age+=dt;
   const distance=p.speed*dt;
   p.distance+=distance;
   p.group.position.addScaledVector(p.dir,distance);
   if(p.slot===1)p.group.position.y+=Math.sin(p.age*7)*dt*.24;
   moveDetails(p,dt);
   const pos=p.group.position;
   if(p.distance>=p.range||p.age>2.4||
      Math.abs(pos.x)>=bounds.x||Math.abs(pos.z)>=bounds.z||
      p.distance>1.4&&collides(pos.x,pos.z)){
    finishProjectile(p);
    travel.splice(i,1);
   }
  }
  for(let i=impact.length-1;i>=0;i--){
   const p=impact[i];p.age+=dt;
   const t=Math.min(1,p.age/p.life);
   p.main.scale.setScalar(.24+t*(p.slot===1?2.6:p.slot===2?2.2:1.8));
   p.second.scale.setScalar(.11+t*(p.slot===0?1.8:1.5));
   p.main.material.opacity=.69*(1-t);
   p.second.material.opacity=.34*(1-t);
   p.frag.material.opacity=.83*(1-t);
   for(let k=0;k<p.count;k++){
    const angle=k*2.399963+p.slot*.6;
    const r=(.13+t*(p.slot===1?1.9:1.4))*(.55+(k%4)*.14);
    dummy.position.set(Math.cos(angle)*r,t*.55+Math.sin(angle*3)*.04,
      Math.sin(angle)*r);
    dummy.rotation.set(angle,t*5+k,angle*.7);
    const size=(p.slot===2?.12:.07)*(1-t*.65);
    dummy.scale.set(size*.6,size*(p.slot===2?3:1.2),size*.6);
    dummy.updateMatrix();p.frag.setMatrixAt(k,dummy.matrix);
   }
   p.frag.instanceMatrix.needsUpdate=true;
   if(t>=1){dispose(p.group);impact.splice(i,1);}
  }
 }
 function clear(){
  while(travel.length)finishProjectile(travel.pop(),false);
  for(const arr of [impact,casting])while(arr.length)dispose(arr.pop().group);
 }
 function getState(){return{
  travelling:travel.length,impacts:impact.length,casting:casting.length,
  projectileMeshes:travel.map(p=>p.group.children.filter(o=>o.isMesh).length),
  projectileTypes:travel.map(p=>p.slot),
  traces:travel.reduce((n,p)=>n+p.trails.length,0),
  specialShapes:travel.map(p=>p.slot===0?p.blades.length:
    p.slot===1?p.flames.length:p.crystals.length)
 }}
 return {begin,launch,update,clear,getState,palettes};
};
})();