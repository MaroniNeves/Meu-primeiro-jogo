/* V12.67 — queimada ecológica no gramado 3D.
 * Fogo animado CC0: "Animated Fire", BenHickling, OpenGameArt (2018).
 * O atlas está local em fire-assets/fire1_64.png (10×6, 60 quadros).
 * Somente células incendiadas atualizam: sem replantar instâncias.
 */
(function(){
'use strict';
window.createArcanoWildfireV1267=function(T,scene,opts={}){
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 const WIDTH=opts.width||128,LENGTH=opts.length||100;
 const NX=128,NZ=100,N=NX*NZ,DT=.17;
 const stepX=WIDTH/NX,stepZ=LENGTH/NZ;
 const charred=new Float32Array(N),flames=new Float32Array(N);
 const fuel=new Float32Array(N),age=new Float32Array(N);
 const pixels=new Uint8Array(N*4);for(let k=0;k<N;k++)pixels[k*4+3]=255;
 const active=new Set(),damaged=new Set();
 let tick=0,clock=0,acc=0,visible=0,extinguished=0,ignitions=0;
 let texture=null,flameMesh=null,smokeMesh=null,burnMesh=null,atlas=null;
 // Um GLB CC0 de fogo (ex.: Flame Decal do Poly Pizza) pode substituir
 // alguns sprites, mantendo a queima/chuva/cinzas totalmente independentes.
 const mobile=!!opts.mobile,MAX=mobile?72:138;
 const MODEL_MAX=mobile?12:24;
 let modelFlames=[],modelSource=null,modelError='',modelReady=false;
 if(T&&scene){
  texture=new T.DataTexture(pixels,NX,NZ,T.RGBAFormat);
  texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearFilter;
  texture.wrapS=texture.wrapT=T.ClampToEdgeWrapping;
  texture.generateMipmaps=false;texture.needsUpdate=true;
  atlas=new T.TextureLoader().load('./fire-assets/fire1_64.png',t=>{
   t.colorSpace=T.SRGBColorSpace;t.flipY=true;
   t.magFilter=T.LinearFilter;t.minFilter=T.LinearFilter;
   t.wrapS=t.wrapT=T.RepeatWrapping;
   t.repeat.set(.1,1/6);
   t.needsUpdate=true;
  },undefined,e=>console.warn('[Incêndio] imagem de fogo CC0:',e));
  atlas.repeat.set(.1,1/6);
  const plane=new T.PlaneGeometry(.86,1.27);
  const material=new T.MeshBasicMaterial({
   map:atlas,transparent:true,depthWrite:false,side:T.DoubleSide,
   alphaTest:.065,color:0xffdcc4
  });
  flameMesh=new T.InstancedMesh(plane,material,MAX);
  flameMesh.name='Fogo CC0 • gramado';
  flameMesh.count=0;flameMesh.frustumCulled=false;
  flameMesh.renderOrder=12;scene.add(flameMesh);
  const cv=typeof document!=='undefined'?document.createElement('canvas'):null;
  if(cv){
   cv.width=cv.height=64;
   const g=cv.getContext('2d'),grad=g.createRadialGradient(32,32,1,32,32,31);
   grad.addColorStop(0,'rgba(71,70,66,.47)');
   grad.addColorStop(.42,'rgba(68,66,61,.20)');
   grad.addColorStop(1,'rgba(60,57,50,0)');
   g.fillStyle=grad;g.fillRect(0,0,64,64);
   const smokeTex=new T.CanvasTexture(cv);
   smokeMesh=new T.InstancedMesh(new T.PlaneGeometry(1.18,1.18),
    new T.MeshBasicMaterial({map:smokeTex,transparent:true,depthWrite:false,
      side:T.DoubleSide,opacity:.72}),MAX);
   smokeMesh.count=0;smokeMesh.frustumCulled=false;smokeMesh.renderOrder=13;
   scene.add(smokeMesh);
  }
  burnMesh=new T.InstancedMesh(new T.CircleGeometry(.72,16),
   new T.MeshBasicMaterial({color:0x2b2822,transparent:true,opacity:.63,
    depthWrite:false,side:T.DoubleSide}),MAX);
  burnMesh.count=0;burnMesh.frustumCulled=false;burnMesh.renderOrder=2;
  scene.add(burnMesh);
 }
 // O site Poly Pizza fornece GLB ao usuário pelo botão Download.
 // Não inventamos uma URL de CDN nem incluímos modelo sem verificar licença.
 // GLBs são usados SOMENTE como visual dos focos já simulados no solo.
 async function importFireGLB(file){
  if(!T||!scene)throw new Error('Cena WebGL ainda não inicializada');
  if(!file||!(/\.glb$/i.test(file.name||'')))throw new Error('Selecione um arquivo .glb');
  if(file.size<20||file.size>12*1024*1024)throw new Error('GLB precisa ter entre 20 B e 12 MB');
  const data=await file.arrayBuffer();
  const head=new DataView(data);
  if(head.getUint32(0,true)!==0x46546c67||head.getUint32(4,true)!==2)
   throw new Error('Arquivo não é glTF binário GLB versão 2');
  const {GLTFLoader}=await import(
   'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/GLTFLoader.js'
  );
  const loader=new GLTFLoader();
  const gltf=await loader.parseAsync(data,'');
  const source=gltf.scene;
  if(!source)throw new Error('GLB não contém objeto 3D');
  let meshCount=0,triangles=0;
  source.traverse(obj=>{
   if(!obj.isMesh)return;
   meshCount++;
   const geom=obj.geometry;
   if(geom?.index)triangles+=geom.index.count/3;
   else if(geom?.attributes?.position)triangles+=geom.attributes.position.count/3;
  });
  if(!meshCount||triangles>25000)throw new Error('Modelo vazio ou detalhado demais para fogo no celular');
  const box=new T.Box3().setFromObject(source);
  const height=box.max.y-box.min.y;
  if(!Number.isFinite(height)||height<.001)throw new Error('Modelo de fogo sem altura válida');
  // Células de grama têm largura aproximada de 1 metro.
  const scale=Math.min(3.5,1.18/height);
  const center=box.getCenter(new T.Vector3());
  const normalized=new T.Group();
  normalized.add(source);
  source.position.set(-center.x,-box.min.y,-center.z);
  normalized.scale.setScalar(scale);
  // Compartilhar texturas e geometrias entre clones; sem criar centenas de GLBs.
  const clones=[];
  try{
   for(let i=0;i<MODEL_MAX;i++){
    const model=new T.Group();
    model.add(normalized.clone(true)); // preserva a normalização de escala
    model.visible=false;model.name='Fogo Poly Pizza GLB '+i;
    model.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.castShadow=false;}});
    scene.add(model);clones.push(model);
   }
  }catch(err){
   for(const obj of clones)scene.remove(obj);
   throw err;
  }
  clearImportedFire();
  modelFlames=clones;modelSource=source;modelReady=true;modelError='';
  return {objects:modelFlames.length,meshes:meshCount,triangles:Math.round(triangles)};
 }
 function clearImportedFire(){
  for(const obj of modelFlames)scene?.remove(obj);
  // Clones compartilham os buffers GLB: descarte apenas UMA vez depois
  // de retirar todas as instâncias, sem liberar a grama ou os sprites CC0.
  if(modelSource)modelSource.traverse(o=>{
   if(!o.isMesh)return;
   o.geometry?.dispose?.();
   const mats=Array.isArray(o.material)?o.material:[o.material];
   for(const mat of mats){
    if(!mat)continue;
    for(const key of ['map','normalMap','alphaMap','emissiveMap','roughnessMap'])
     mat[key]?.dispose?.();
    mat.dispose?.();
   }
  });
  modelFlames=[];modelSource=null;modelReady=false;modelError='';
 }
 function getImportedFire(){return {
  ready:modelReady,count:modelFlames.length,error:modelError
 };}
 const grid=(x,z)=>{
  const ix=Math.floor((x/WIDTH+.5)*NX),iz=Math.floor((z/LENGTH+.5)*NZ);
  return ix<0||ix>=NX||iz<0||iz>=NZ?-1:iz*NX+ix;
 };
 const locate=k=>({x:-WIDTH*.5+(k%NX+.5)*stepX,
                    z:-LENGTH*.5+(Math.floor(k/NX)+.5)*stepZ});
 const moisture=(x,z)=>clamp(opts.moistureAt?.(x,z)??.28,0,1);
 const vegetation=(x,z)=>clamp(opts.coverAt?.(x,z)??1,0,1);
 const soaked=(x,z)=>Boolean(opts.waterAt?.(x,z));
 const rainfall=()=>clamp(opts.getRainLevel?.()??0,0,5);
 const wind=()=>{
  const s=opts.windAt?.()||{};
  const direction=s.heading||0,force=clamp(s.strength??.3,0,3);
  return {x:Math.cos(direction),z:Math.sin(direction),strength:force};
 };
 const rnd=(seed)=>{let n=(Math.imul((seed+7)|0,1664525)+1013904223)|0;
  n=Math.imul((n^(n>>>16)),2246822519);n^=n>>>13;
  return (n>>>0)/4294967296;
 };
 function allowed(k){
  if(k<0)return false;
  const {x,z}=locate(k);
  return !soaked(x,z)&&vegetation(x,z)>.11;
 }
 function start(k,strength=.82){
  if(!allowed(k))return false;
  const {x,z}=locate(k),wet=moisture(x,z),rain=rainfall();
  if(wet>.91||rain>=5)return false;
  if(active.size>=MAX*2&&!active.has(k))return false;
  const dryness=clamp(1-wet*.74-rain*.13,.08,1);
  const value=clamp(strength*dryness,.12,1);
  if(flames[k]<value){
   flames[k]=value;active.add(k);damaged.add(k);
   fuel[k]=Math.max(fuel[k],clamp(vegetation(x,z),.32,1));
   age[k]=0;ignitions++;return true;
  }
  return false;
 }
 function ignite(x,z,radius=1.35,strength=.94){
  if(!Number.isFinite(x)||!Number.isFinite(z))return false;
  let lit=false;
  const rx=Math.ceil(radius/stepX),rz=Math.ceil(radius/stepZ);
  const cx=Math.floor((x/WIDTH+.5)*NX),cz=Math.floor((z/LENGTH+.5)*NZ);
  for(let dz=-rz;dz<=rz;dz++)for(let dx=-rx;dx<=rx;dx++){
   if((dx*stepX)**2+(dz*stepZ)**2>radius*radius)continue;
   const ix=cx+dx,iz=cz+dz;if(ix<0||ix>=NX||iz<0||iz>=NZ)continue;
   lit=start(iz*NX+ix,strength*(1-.30*Math.hypot(dx*stepX,dz*stepZ)/Math.max(.1,radius)))||lit;
  }
  return lit;
 }
 function igniteCone(origin,direction,length=6){
  if(!origin||!direction)return false;
  const norm=Math.hypot(direction.x,direction.z)||1;
  const dx=direction.x/norm,dz=direction.z/norm;
  let lit=false;
  for(const t of [2.7,3.8,5,6.1]){
   if(t>length+.3)continue;
   const x=origin.x+dx*t,z=origin.z+dz*t;
   const r=.75+t*.115;
   lit=ignite(x,z,r,.97)||lit;
  }
  return lit;
 }
 function quench(x,z,radius=Infinity){
  if(radius===Infinity){
   for(const k of active)flames[k]=0;
   extinguished+=active.size;active.clear();return;
  }
  for(const k of [...active]){
   const p=locate(k);
   if(Math.hypot(p.x-x,p.z-z)<=radius){
    flames[k]=0;active.delete(k);extinguished++;
   }
  }
 }
 function simulate(dt){
  dt=clamp(dt,0,.3);tick++;
  const w=wind(),rain=rainfall(),targets=[];
  for(const k of active){
   const pos=locate(k),wet=moisture(pos.x,pos.z);
   age[k]+=dt;
   const wetFactor=clamp(wet*.87+rain*.22,0,2);
   charred[k]=clamp(charred[k]+flames[k]*(1.03-wet*.24)*dt*.24,0,1);
   fuel[k]=Math.max(0,fuel[k]-flames[k]*dt*(.095+.05*w.strength));
   flames[k]=clamp(flames[k]+dt*(.13-.51*wetFactor-(fuel[k]<.20?.66:0)),0,1);
   if(fuel[k]<=.03||flames[k]<.045||soaked(pos.x,pos.z)){
    flames[k]=0;active.delete(k);extinguished++;continue;
   }
   // Dispersão influenciada por vento e umidade. Frequência delimitada;
   // novos incêndios só surgem de células em contato com fogo existente.
   if(age[k]>.42&&tick%2===0&&rain<4){
    const x=k%NX,z=(k-x)/NX;
    for(const [ox,oz] of [[1,0],[-1,0],[0,1],[0,-1]]){
     const xx=x+ox,zz=z+oz;
     if(xx<1||xx>=NX-1||zz<1||zz>=NZ-1)continue;
     const to=zz*NX+xx;if(active.has(to)||charred[to]>.73||!allowed(to))continue;
     const next=locate(to),dry=clamp(1-moisture(next.x,next.z)-rain*.16,0,1);
     const downwind=Math.max(0,(ox*w.x+oz*w.z)*(1+w.strength)*.5);
     const odds=dt*(.026+.24*downwind)*dry*flames[k];
     if(rnd(to+tick*3299)<odds)targets.push(to);
    }
   }
  }
  for(const k of targets)start(k,.60);
  // Retorno em minutos, não segundos: a mancha preta não desaparece
  // imediatamente ao apagar, mesmo em chuva.
  for(const k of damaged){
   if(active.has(k))continue;
   age[k]+=dt;
   if(age[k]>22){
    const pos=locate(k),wet=moisture(pos.x,pos.z);
    const regen=clamp(.0017+wet*.004+rain*.0008,.0017,.0078);
    charred[k]=Math.max(0,charred[k]-regen*dt);
    fuel[k]=clamp(fuel[k]+dt*.003,0,1);
   }
   if(charred[k]<.005&&age[k]>23){
    charred[k]=0;damaged.delete(k);fuel[k]=1;age[k]=0;
   }
  }
  for(const k of damaged){
   const n=k*4;
   pixels[n]=Math.round(charred[k]*255);
   pixels[n+1]=Math.round(flames[k]*255);
   pixels[n+2]=0;
  }
  if(texture)texture.needsUpdate=true;
 }
 const dummy=T?new T.Object3D():null;
 let visualAccumulator=0;
 function visuals(dt,camera){
  if(!T||!scene||!flameMesh)return;
  visualAccumulator+=dt;
  const frame=Math.floor(clock*15)%60;
  const col=frame%10,row=5-Math.floor(frame/10);
  if(atlas){atlas.offset.set(col*.1,row/6);}
  const heading=wind(),hasCamera=Boolean(camera);
  let num=0,spriteCount=0,modelCount=0;
  for(const k of active){
   if(num>=MAX)break;
   const pos=locate(k),power=flames[k];
   const y=opts.terrainAt?.(pos.x,pos.z)||0;
   const sway=.08*Math.sin(clock*6+pos.x*.73+pos.z*.37);
   dummy.position.set(pos.x+heading.x*sway,y+.42+power*.27,pos.z+heading.z*sway);
   if(hasCamera)dummy.quaternion.copy(camera.quaternion);
   else dummy.rotation.set(0,0,0);
   const size=(.58+power*.8)*(.86+.14*Math.sin(clock*3.6+k));
   dummy.scale.set(size,size,1);dummy.updateMatrix();
   if(modelReady&&modelCount<modelFlames.length){
    const model=modelFlames[modelCount++];
    model.visible=true;
    model.position.set(pos.x,y+.014,pos.z);
    model.rotation.set(0,Math.sin(clock*1.3+k)*.11,0);
    // Altura um pouco maior em chamas fortes, mas sem esmagar a grama.
    model.scale.setScalar((.58+power*.52)*(1+.025*Math.sin(clock*5+k)));
   }else flameMesh.setMatrixAt(spriteCount++,dummy.matrix);
   if(smokeMesh){
    dummy.position.set(pos.x+heading.x*.13,y+1.10+Math.sin(clock*1.5+k)*.16,pos.z+heading.z*.13);
    dummy.scale.set(size*1.08,size*.92,1);dummy.updateMatrix();
    smokeMesh.setMatrixAt(num,dummy.matrix);
   }
   num++;
  }
  for(let i=modelCount;i<modelFlames.length;i++)modelFlames[i].visible=false;
  flameMesh.count=spriteCount;flameMesh.instanceMatrix.needsUpdate=true;
  if(smokeMesh){smokeMesh.count=num;smokeMesh.instanceMatrix.needsUpdate=true;}
  // Marcas de fuligem no chão: plano escuro independente da grama original.
  let marked=0;
  for(const k of damaged){
   if(marked>=MAX)break;
   if(charred[k]<.15)continue;
   const pos=locate(k),y=opts.terrainAt?.(pos.x,pos.z)||0;
   dummy.position.set(pos.x,y+.014,pos.z);
   dummy.rotation.set(-Math.PI/2,0,0);
   const scale=.52+.38*charred[k];
   dummy.scale.set(scale,scale,1);dummy.updateMatrix();
   burnMesh.setMatrixAt(marked++,dummy.matrix);
  }
  burnMesh.count=marked;burnMesh.instanceMatrix.needsUpdate=true;
  visible=num;
 }
 function update(dt,camera){
  dt=clamp(dt,0,.09);clock+=dt;acc+=dt;
  if(acc>=DT){const n=Math.min(3,Math.floor(acc/DT));acc-=n*DT;
   for(let i=0;i<n;i++)simulate(DT);
  }
  visuals(dt,camera);
 }
 function status(){return {
  burning:active.size,scorched:damaged.size,visible,
  extinguished,ignitions,
  meanScorch:damaged.size?[...damaged].reduce((a,k)=>a+charred[k],0)/damaged.size:0,
  texture:!!texture
 }}
 function sample(x,z){const k=grid(x,z);return k<0?{burn:0,fire:0}:
  {burn:charred[k],fire:flames[k]};}
 return {ignite,igniteCone,quench,update,status,sample,
  importFireGLB,clearImportedFire,getImportedFire,
  texture,mask: pixels,dimensions:[NX,NZ],active,damaged};
};
})();