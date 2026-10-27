/* Ateliê Arcano V12.36 — folhas, fauna na chuva, túneis vivos e ponte ancorada.
 * Malhas FBX/OBJ compactadas dos arquivos do usuário; não simula parâmetros de
 * campo cientificamente calibrados. Conserva modelos invisíveis fora da lupa.
 */
(function(){
'use strict';
const T=window.THREE,api=window.arcanoWaterV1226,raw=window.ARCANO_ASSETS_V1232;
const $=id=>document.getElementById(id);
if(!T||!api||!raw){console.warn('[Arcano Ecologia] Cena ou pacote ainda não disponível.');return;}
// Área 10x e grade adaptativa compartilhada com a hidrologia.
const NX=innerWidth<680?174:286,NZ=innerWidth<680?138:228,W=128,L=100,dx=W/(NX-1),dz=L/(NZ-1);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),rand=(seed)=>()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const random=rand(6232026),cells=NX*NZ,cover=new Float32Array(cells),
 traffic=new Float32Array(cells),roadMask=new Float32Array(cells),
 fixedRoadMask=new Float32Array(cells),
 riverMask=new Float32Array(cells),animalTrail=new Float32Array(cells),
 compaction=new Float32Array(cells),lightField=new Float32Array(cells);
const green=new T.Color('#477e3d'),roadColor=new T.Color('#9e7954');
// Pequenas fontes renováveis de sementes e néctar das plantas; se esgotam
// localmente quando as operárias forrageiam e se recuperam com vegetação viva.
const foodResources=new Float32Array(cells);
// Clareiras de terra escavada: 0..255. Persistem junto aos formigueiros,
// mas não eliminam cobertura verde nas outras áreas do mapa.
const nestBareMask=new Uint8Array(cells);
function paintNestBareSoil(x,z){
 const radius=.91,inner=.52;
 const i0=Math.max(0,Math.floor((x-radius+W*.5)/dx));
 const i1=Math.min(NX-1,Math.ceil((x+radius+W*.5)/dx));
 const j0=Math.max(0,Math.floor((z-radius+L*.5)/dz));
 const j1=Math.min(NZ-1,Math.ceil((z+radius+L*.5)/dz));
 for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
  const px=-W*.5+i*dx,pz=-L*.5+j*dz,k=j*NX+i;
  const d=Math.hypot(px-x,pz-z);
  if(d>=radius)continue;
  const mask=clamp((radius-d)/(radius-inner),0,1);
  const eased=mask*mask*(3-2*mask);
  nestBareMask[k]=Math.max(nestBareMask[k],Math.round(255*eased));
  cover[k]=Math.min(cover[k],1-eased);
  foodResources[k]*=1-eased;
 }
 // Força uma atualização das instâncias sem esperar uma nova geração de grama.
 grassRefreshRequested=true;
}
const realm=new T.Group();realm.name='V12.32 | Rio estrada grama e fauna do solo';api.scene.add(realm);
const foliage=new T.Group(),rocks=new T.Group(),animals=new T.Group(),roads=new T.Group();
foliage.name='Tufos reais de grama Quaternius';rocks.name='Cinco geometrias de pedras Rocks.fbx';
animals.name='Formigas e minhocas minúsculas';roads.name='Estrada e ponte demonstrativas';
for(const g of [foliage,rocks,animals,roads])realm.add(g);
const meshLibrary={},textureLibrary={};let ready=false, biologicalSpeed=4,previewMagnification=1, trampleEnabled=true;
const grassPatches=[],rockPositions=[],colonies=[],antDraws=[];
const nestDisplays=new Map();
let colonySequence=0,ecologicalDays=0,burrowLength=0,castsReturned=0;
const ecoEvents=[];
function recordEcoEvent(message){
 const entry='Dia '+Math.floor(ecologicalDays)+' · '+message;
 if(ecoEvents[0]===entry)return;
 ecoEvents.unshift(entry);ecoEvents.length=Math.min(6,ecoEvents.length);
}
const targetNativeGrass=api.forestInstances.filter(a=>a.type==='grass');
// A estrada atravessa a clareira central, não fica escondida atrás da floresta.
const roadZ=x=>.92-.70*Math.sin(x*.47+.6)+.17*Math.sin(x*1.34);
const riverX=z=>-2.3+.55*Math.sin(z*.69)+.48*Math.sin(z*.29+1.3);
function idx(x,z){const i=clamp(Math.round((x+W*.5)/dx),0,NX-1),j=clamp(Math.round((z+L*.5)/dz),0,NZ-1);return j*NX+i;}
function position(k){const i=k%NX,j=(k-i)/NX;return {x:-W*.5+i*dx,z:-L*.5+j*dz};}
function height(x,z){
 const fx=clamp((x+W*.5)/dx,0,NX-1.00001),fz=clamp((z+L*.5)/dz,0,NZ-1.00001);
 const i=fx|0,j=fz|0,a=fx-i,b=fz-j;
 const A=api.soil[j*NX+i],B=api.soil[j*NX+i+1],C=api.soil[(j+1)*NX+i],D=api.soil[(j+1)*NX+i+1];
 return A*(1-a)*(1-b)+B*a*(1-b)+C*(1-a)*b+D*a*b;
}
const mobileDevice=innerWidth<680;
// Orçamento alto igual no modo Equilibrado: vegetação fechada por TODO o mapa.
const grassBudgets=mobileDevice?{high:1900000,balanced:1900000,low:800000}:{high:2400000,balanced:2400000,low:1000000};
let grassDrawn=0,lastGrassQuality='';
const grassChunkMeshes=new Map();
// Cada célula do solo é avaliada UMA vez por atualização, mesmo quando
// dezenas de tufos ocupam essa mesma célula.
const grassCurrentScale=new Float64Array(cells);
const grassCellLastScale=new Float32Array(cells);
grassCellLastScale.fill(NaN);
let grassForceRefresh=true;
function grassAliveScale(k){
 const wear=Math.max(traffic[k],animalTrail[k]),c=cover[k];
 const hydro=riverMask[k]>.01?0:1;
 const alive=fixedRoadMask[k]>.06?0:
  clamp(c*(1-wear)*hydro*(1-nestBareMask[k]/255),0,1);
 return alive>.11?(.47+.53*alive):.0001;
}
function applyGrassQuality(){
 const quality=api.getGraphicsQuality()||'balanced';
 const ratio=Math.min(1,(grassBudgets[quality]||grassBudgets.balanced)/grassBudgets.high);
 grassDrawn=0;
 for(const m of foliage.children)if(m.isInstancedMesh){
  m.count=Math.min(m.userData.planted||0,Math.round((m.userData.planted||0)*ratio));
  // Alterar apenas o número de instâncias não altera o conteúdo do buffer
  // e não exige transferir novamente as matrizes para a GPU.
  grassDrawn+=m.count;
 }
 if(lastGrassQuality!==quality)grassForceRefresh=true;
 lastGrassQuality=quality;
}
async function loadMeshes(){
 // Decodificar de forma linear, sem callback/alocação por byte.
 // O conteúdo comprimido e todas as malhas permanecem idênticos.
 const bytes=(()=>{
  const packed=atob(raw.compressed),binary=new Uint8Array(packed.length);
  for(let i=0;i<packed.length;i++)binary[i]=packed.charCodeAt(i);
  return binary;
 })(); // A string base64 decodificada sai do escopo antes da descompressão.
 if(!('DecompressionStream' in window))throw new Error('Navegador sem DecompressionStream');
 const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
 const data=JSON.parse(await new Response(stream).text());
 for(const [name,source] of Object.entries(data)){
  const geom=new T.BufferGeometry();
  geom.setAttribute('position',new T.Float32BufferAttribute(source.v,3));
  if(source.uv)geom.setAttribute('uv',new T.Float32BufferAttribute(source.uv,2));
  geom.setIndex(source.i);geom.computeVertexNormals();geom.computeBoundingSphere();
  meshLibrary[name]=geom;
 }
 for(const [name,src] of Object.entries(raw.textures)){
  const t=new T.TextureLoader().load(src);t.colorSpace=T.SRGBColorSpace;
  t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=innerWidth<680?2:4;
  textureLibrary[name]=t;
 }
 ready=true;
}
function material(kind){
 const map=textureLibrary[kind]||null;
 const tint=kind==='rock'?'#d5d0c5':kind==='grassTall'?'#b4dc9e':'#c9edba';
 return new T.MeshStandardMaterial({color:tint,map,roughness:1,metalness:0,side:T.DoubleSide,
  alphaTest:kind==='rock'?0:kind==='grassTall'?.15:.10,transparent:false,depthWrite:true});
}
// V12.59: um só conjunto de uniformes alimenta TODOS os setores 3D.
// O vento atua no shader, sem reduzir gramíneas ou atualizar matrizes na CPU.
// As duas marcas recentes de passagem desaparecem gradualmente (<1 s).
// V12.60: dinâmica visual no GPU, mantendo todas as instâncias 3D originais.
// Velocidade física, potência definida no painel e temporais participam da
// resposta: em 100% a grama dobra visivelmente e oscila com rajadas.
// Proximidade e pisadas abrem os tufos sem diminuir contagem nem escala.
const grassVisual={
 clock:0,lastWallTime:-1,stepDistance:0,lastPlayerX:NaN,lastPlayerZ:NaN,
 trailIndex:0,
 uniforms:{
  uArcWindTime:{value:0},
  uArcWindDir:{value:new T.Vector2(1,0)},
  uArcWindStrength:{value:0},
  uArcStorm:{value:0},
  uArcPlayer:{value:new T.Vector4(0,0,0,0)},
  uArcTrail0:{value:new T.Vector4(0,0,0,0)},
  uArcTrail1:{value:new T.Vector4(0,0,0,0)}
 }
};
// Disponível mesmo enquanto as milhões de instâncias ainda são plantadas.
window.arcanoGrassMotionState=()=>({
 chunks:grassChunkMeshes.size,tufts:grassDrawn,
 wind:grassVisual.uniforms.uArcWindStrength.value,
 time:grassVisual.uniforms.uArcWindTime.value,
 contact:grassVisual.uniforms.uArcPlayer.value.w,
 playerX:grassVisual.uniforms.uArcPlayer.value.x,
 playerZ:grassVisual.uniforms.uArcPlayer.value.y
});
// V12.67: mapa dinâmico de queimadas na GPU; os milhões de tufos originais
// continuam nas mesmas InstancedMesh. Somente a textura RG registra cinzas
// e chamas por célula (nenhuma reconstrução de grama).
const wildfire=window.createArcanoWildfireV1267?.(T,api.scene,{
 width:W,length:L,mobile:mobileDevice,
 terrainAt:(x,z)=>height(x,z),
 coverAt:(x,z)=>cover[idx(x,z)]*(1-roadMask[idx(x,z)]*.78),
 waterAt:(x,z)=>api.depth[idx(x,z)]>.045||riverMask[idx(x,z)]>.79,
 moistureAt:(x,z)=>clamp(
  api.soilMoisture[idx(x,z)]/Math.max(.001,api.soilCapacity[idx(x,z)]),0,1),
 getRainLevel:()=>api.getRainLevel?.()??0,
 windAt:()=>({heading:api.getGrassWindHeading?.()||0,
  strength:(api.getGrassWindPower?.()||70)/100})
});
window.arcanoWildfire=wildfire||null;
if(wildfire)grassVisual.uniforms.uArcBurnMap={value:wildfire.texture};
function grassAnimatedMaterial(name,kind){
 const mat=material(kind),geo=meshLibrary[name];
 geo.computeBoundingBox();
 const minY=geo.boundingBox.min.y,span=Math.max(.0001,geo.boundingBox.max.y-minY);
 const base={value:minY},inverseHeight={value:1/span};
 mat.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,grassVisual.uniforms);
  shader.uniforms.uArcGrassBase=base;
  shader.uniforms.uArcGrassInvHeight=inverseHeight;
  shader.vertexShader=`uniform float uArcWindTime;
uniform vec2 uArcWindDir;
uniform float uArcWindStrength;
uniform float uArcStorm;
uniform vec4 uArcPlayer;
uniform vec4 uArcTrail0;
uniform vec4 uArcTrail1;
uniform float uArcGrassBase;
uniform float uArcGrassInvHeight;
uniform sampler2D uArcBurnMap;
varying float vArcBurn;
`+shader.vertexShader;
  const marker='#include <begin_vertex>';
  if(!shader.vertexShader.includes(marker))throw new Error('Shader padrão da grama incompatível');
  shader.vertexShader=shader.vertexShader.replace(marker,`
#include <begin_vertex>
vArcBurn=0.0;
#ifdef USE_INSTANCING
 vec2 arcBurnUV=instanceMatrix[3].xz/vec2(128.0,100.0)+vec2(.5);
 vec4 arcBurnData=texture2D(uArcBurnMap,clamp(arcBurnUV,vec2(.001),vec2(.999)));
 vArcBurn=arcBurnData.r;
 float arcBlade=clamp((transformed.y-uArcGrassBase)*uArcGrassInvHeight,0.0,1.0);
 if(arcBlade>0.001){
  // Base fixa, caules dobram progressivamente com a altura; nenhuma
  // instância é deletada ou escalada para simular o afastamento.
  arcBlade*=arcBlade;
  vec2 arcRoot=instanceMatrix[3].xz;
  float arcT=uArcWindTime;
  float arcCompression=0.0;
  float arcWave=sin(arcT*(2.05+uArcStorm*.85)+arcRoot.x*.28+arcRoot.y*.37);
  float arcFlutter=sin(arcT*(3.65+uArcStorm*1.25)+arcRoot.x*.61-arcRoot.y*.23);
  float arcGust=max(.07,.70+.32*arcWave+.16*arcFlutter);
  vec2 arcSide=vec2(-uArcWindDir.y,uArcWindDir.x);
  vec2 arcMove=uArcWindDir*(uArcWindStrength*arcGust);
  arcMove+=arcSide*(uArcWindStrength*(.07+.13*uArcStorm)*arcFlutter);
  // Colisão visual radial com a região das pernas do boneco.
  // Um pequeno desvio lateral evita que d=0 deixe as lâminas imóveis.
  if(uArcPlayer.w>.001){
   vec2 d=arcRoot-uArcPlayer.xy;
   float reach=max(0.0,1.0-length(d)/1.38);
   float pressure=reach*reach*(3.0-2.0*reach);
   if(pressure>.001){
    vec2 across=vec2(cos(uArcPlayer.z),-sin(uArcPlayer.z));
    vec2 away=normalize(d+across*.075);
    arcMove+=away*(.83*uArcPlayer.w*pressure);
    arcCompression=max(arcCompression,.32*uArcPlayer.w*pressure);
   }
  }
  // Marcas passageiras continuam a ceder por cerca de um segundo,
  // recuperando altura sem reduzir a quantidade de plantas.
  if(uArcTrail0.w>.001){
   vec2 d=arcRoot-uArcTrail0.xy;
   float reach=max(0.0,1.0-length(d)/1.12);
   float pressure=reach*reach*(3.0-2.0*reach);
   arcMove+=normalize(d+vec2(.015,.019))*(.34*uArcTrail0.w*pressure);
   arcCompression=max(arcCompression,.16*uArcTrail0.w*pressure);
  }
  if(uArcTrail1.w>.001){
   vec2 d=arcRoot-uArcTrail1.xy;
   float reach=max(0.0,1.0-length(d)/1.12);
   float pressure=reach*reach*(3.0-2.0*reach);
   arcMove+=normalize(d+vec2(-.017,.013))*(.34*uArcTrail1.w*pressure);
   arcCompression=max(arcCompression,.16*uArcTrail1.w*pressure);
  }
  // Deslocamento mundo XZ -> coordenadas do tufo, que pode estar rotacionado.
  vec2 arcAxisX=instanceMatrix[0].xz,arcAxisZ=instanceMatrix[2].xz;
  transformed.x+=dot(arcMove,arcAxisX)/
   max(dot(arcAxisX,arcAxisX),.0001)*arcBlade;
  transformed.z+=dot(arcMove,arcAxisZ)/
   max(dot(arcAxisZ,arcAxisZ),.0001)*arcBlade;
  // Tufos cedem para o lado, abaixam ao redor das canelas e
  // carbonizam conforme a textura regional de queimadas.
  transformed.y-=(arcCompression+vArcBurn*.74)*arcBlade/
   max(length(instanceMatrix[1].xyz),.01);
 }
#endif
`);
  // Colorir a PRÓPRIA grama (não apenas o solo): cinza carvão persiste
  // mesmo após apagar o fogo; novas folhas brotam lentamente.
  shader.fragmentShader='varying float vArcBurn;\n'+shader.fragmentShader;
  const c='#include <color_fragment>';
  if(!shader.fragmentShader.includes(c))throw new Error('Shader de cor incompatível');
  shader.fragmentShader=shader.fragmentShader.replace(c,
   c+'\n diffuseColor.rgb=mix(diffuseColor.rgb, vec3(.105,.087,.068), clamp(vArcBurn*.94,0.,1.));');
 };
 mat.customProgramCacheKey=()=> 'arcano-grass-fire-cc0-burn-v1267-'+name;
 return mat;
}
function animateGrassVisuals(dt){
 const atm=api.atmosphere;
 const wind=atm?.getMetrics?.().wind||0;
 const heading=atm?.getGrassWindHeading?.()||0;
 const userPower=clamp(atm?.getGrassWindPower?.()??70,0,100)/100;
 const storm=!!atm?.getGrassStorm?.();
 // Com milhões de gramíneas, quadros podem levar > 90 ms no celular.
 // O acumulador ecológico limita dt para estabilidade da física; animar
 // vento com esse dt deixava as ondas artificialmente lentas no FPS baixo.
 // Apenas esta animação visual usa o relógio real (não a física).
 const wallNow=typeof performance!=='undefined'?
  performance.now()*.001:grassVisual.clock+dt;
 const realDt=grassVisual.lastWallTime<0?Math.min(dt,.09):
  clamp(wallNow-grassVisual.lastWallTime,0,.8);
 grassVisual.lastWallTime=wallNow;
 grassVisual.clock=wallNow;
 const u=grassVisual.uniforms;
 u.uArcWindTime.value=wallNow;
 u.uArcWindDir.value.set(Math.cos(heading),Math.sin(heading));
 u.uArcStorm.value=storm?1:0;
 // V12.59 aplicava wind*.092, ~2 cm nos ventos usuais.
 // Agora respeita 0%, 100% e as rajadas do temporal sem alterar
 // a velocidade física, apenas a flexibilidade visual das hastes.
 const windPhysical=clamp(wind/2.4,0,1);
 const control=userPower*(.12+.28*Math.pow(userPower,.9));
 u.uArcWindStrength.value=userPower<.001?0:
  clamp(control+windPhysical*.20+(storm?userPower*.27:0),0,.68);
 const p=api.getGrassPlayer?.();
 const current=u.uArcPlayer.value;
 const trail=[u.uArcTrail0.value,u.uArcTrail1.value];
 for(let i=0;i<2;i++){
  const t=trail[i];
  if(t.w>0)t.w=Math.max(0,t.w-realDt*1.20);
 }
 if(!p||p.grassOnGround===false){
  current.w=0;grassVisual.stepDistance=0;
  grassVisual.lastPlayerX=NaN;grassVisual.lastPlayerZ=NaN;
  return;
 }
 const x=p.position.x,z=p.position.z,speed=p.grassSpeed||0;
 current.set(x,z,p.heading||0,clamp(.67+speed*.20,.67,1.3));
 if(Number.isFinite(grassVisual.lastPlayerX)){
  const moved=Math.hypot(x-grassVisual.lastPlayerX,z-grassVisual.lastPlayerZ);
  if(moved>.001&&moved<1.5&&speed>.12){
   grassVisual.stepDistance+=moved;
   const step=speed>2.4?.31:.43;
   if(grassVisual.stepDistance>=step){
    grassVisual.stepDistance%=step;
    trail[grassVisual.trailIndex].set(x,z,0,1);
    grassVisual.trailIndex=1-grassVisual.trailIndex;
   }
  }
 }else grassVisual.stepDistance=0;
 grassVisual.lastPlayerX=x;grassVisual.lastPlayerZ=z;
}
function makeMesh(name,kind){const geo=meshLibrary[name];return geo?new T.Mesh(geo,material(kind)):null;}
// V12.34: a estrada é uma ALTERAÇÃO DE COR no shader do solo,
 // nunca uma fita de polígonos sobreposta. Apenas a ponte é geometria extra.
const footprintSites=[];
const printShapes=new T.Group();printShapes.name='Pegadas de lama compactada';roads.add(printShapes);
function generateFootprints(){
 printShapes.clear();footprintSites.length=0;
 const sole=new T.CircleGeometry(.045,10);
 const mudMaterial=new T.MeshStandardMaterial({
  color:'#36261b',transparent:true,opacity:.0,depthWrite:false,
  polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2,
  roughness:1,metalness:0,side:T.DoubleSide
 });
 // Sempre existe apenas uma malha instanciada para solas e calcanhares.
 const max=160,stamps=new T.InstancedMesh(sole,mudMaterial,max);
 stamps.name='Marcas de passos pressionadas no barro';
 stamps.count=0;stamps.frustumCulled=false;printShapes.add(stamps);
 const dummy=new T.Object3D(),marks=[];
 for(let k=0;k<76;k++){
  const x=-8.6+k*.226,z=roadZ(x),side=k%2?1:-1;
  for(let part=0;part<2;part++){
   const fx=x+(part?.047:0),fz=z+side*.15+(part?.016:0);
   const cell=idx(fx,fz);
   if(roadMask[cell]<.55||riverMask[cell]>.64||api.depth[cell]>.09)continue;
   const tilt=Math.atan2(roadZ(x+.08)-roadZ(x-.08),.16);
   dummy.position.set(fx,height(fx,fz)+.016,fz);
   dummy.rotation.set(-Math.PI/2,0,tilt);
   dummy.scale.set(part?.80:1.25,part?1.15:1.6,1);
   dummy.updateMatrix();marks.push(dummy.matrix.clone());
  }
 }
 footprintSites.push(...marks);
 for(let i=0;i<Math.min(max,marks.length);i++)stamps.setMatrixAt(i,marks[i]);
 stamps.count=Math.min(max,marks.length);stamps.instanceMatrix.needsUpdate=true;
 return stamps;
}
let muddyFootprints=null;
function markFootprint(x,z){
 if(!muddyFootprints)return;
 const k=idx(x,z),moist=api.soilMoisture[k]/Math.max(.001,api.soilCapacity[k]);
 if(moist<.33||api.depth[k]>.045)return;
 const o=new T.Object3D();
 for(const offset of [-.09,.09]){
  const fx=x+.048*(random()-.5),fz=z+offset;
  o.position.set(fx,height(fx,fz)+.017,fz);
  o.rotation.set(-Math.PI/2,0,random()*.36-.18);
  o.scale.set(.85+random()*.45,1.1+random()*.45,1);o.updateMatrix();
  footprintSites.push(o.matrix.clone());
  if(footprintSites.length>160)footprintSites.shift();
 }
 for(let i=0;i<footprintSites.length;i++)muddyFootprints.setMatrixAt(i,footprintSites[i]);
 muddyFootprints.count=footprintSites.length;
 muddyFootprints.instanceMatrix.needsUpdate=true;
 updateFootprints();
}
function updateFootprints(){
 if(!muddyFootprints)return;
 let wet=0;for(let k=0;k<cells;k+=7){
  if(roadMask[k]>.60)wet=Math.max(wet,
   clamp(api.soilMoisture[k]/Math.max(.001,api.soilCapacity[k]),0,1));
 }
 const intensity=clamp((wet-.32)*1.25,0,.74);
 muddyFootprints.visible=intensity>.02;
 muddyFootprints.material.opacity=intensity*.70;
}
// Material do caminho, não uma faixa de malha: grãos soltos, seixos
// minúsculos e fragmentos de galhos apoiados diretamente no relevo.
// Os maiores blocos continuam fora da estrada.
function makeRoadSurfaceDetails(){
 const group=new T.Group();
 group.name='Terra batida · grãos, seixos e gravetos sobre a estrada fixa';
 roads.add(group);
 const rng=rand(27821),total=mobileDevice?3600:6500;
 const kinds=[
  {geometry:new T.IcosahedronGeometry(.050,0),color:'#a8906f'},
  {geometry:new T.IcosahedronGeometry(.034,0),color:'#574332'},
  {geometry:new T.BoxGeometry(.11,.008,.025),color:'#766149'},
  {geometry:new T.IcosahedronGeometry(.020,0),color:'#c6ae89'}
 ];
 const meshes=kinds.map((k,j)=>{
  const mesh=new T.InstancedMesh(k.geometry,
   new T.MeshStandardMaterial({color:k.color,roughness:1,metalness:0,
    side:T.DoubleSide}),Math.ceil(total*.38));
  mesh.name=['Pedrinhas desgastadas','Grãos escuros de terra',
   'Gravetos e cascas','Areia e minerais'][j];
  mesh.frustumCulled=false;mesh.count=0;mesh.castShadow=false;
  mesh.receiveShadow=true;group.add(mesh);return mesh;
 });
 const o=new T.Object3D();
 let count=0,attempts=0;
 while(count<total&&attempts<total*5){
  attempts++;
  const x=(rng()-.5)*W*.955;
  const z=roadZ(x)+(rng()-.5)*1.66;
  const k=idx(x,z);
  if(fixedRoadMask[k]<.13||api.depth[k]>.045||riverMask[k]>.56||
     (Math.abs(x+1.5)<2.2&&Math.abs(z-roadZ(x))<.6))continue;
  const t=rng(),kind=t<.38?0:t<.62?1:t<.79?2:3;
  const mesh=meshes[kind],index=mesh.count;
  if(index>=mesh.instanceMatrix.count)continue;
  const sz=kind===2?.65+rng()*.65:.45+rng()*.95;
  o.position.set(x,height(x,z)+.014,z);
  o.rotation.set(kind===2?0:(rng()-.5)*.23,rng()*Math.PI*2,
   kind===2?0:(rng()-.5)*.22);
  o.scale.set(sz*(.7+rng()*.6),sz*(.42+rng()*.25),
   sz*(.8+rng()*.5));
  o.updateMatrix();mesh.setMatrixAt(index,o.matrix);
  mesh.count++;count++;
 }
 for(const mesh of meshes)mesh.instanceMatrix.needsUpdate=true;
 console.info('[Arcano V12.41] Estrada de terra:',count,
  'grãos e fragmentos ancorados, sem tapar o solo.');
}
// O tablado ecológico é uma superfície sólida: o modo Jogar consulta
// a MESMA posição, ângulo e largura usados para construir suas tábuas.
// Não cria malhas invisíveis, rampas decorativas ou nova física de solo.
function makeRoad(){
 window.arcanoBridgeSolid=null;
 // Um tablado CONTÍNUO, horizontal, sustentado por vigas e fixado em dois
 // encontros elevados. Nenhuma tábua cresce em degraus sobre o terreno.
 // O vão precisa atravessar rio com margens opostas — sem ponte aleatória.
 let crossing=null,nearest=Infinity;
 for(let x=-7.8;x<7.8;x+=.045){
  const z=roadZ(x),k=idx(x,z);
  if(riverMask[k]>.62&&Math.abs(x-riverX(z))<nearest){
   crossing=x;nearest=Math.abs(x-riverX(z));
  }
 }
 if(crossing!==null){
  function bank(direction){
   for(let d=.2;d<2.45;d+=.035){
    const x=crossing+d*direction,z=roadZ(x),k=idx(x,z);
    if(riverMask[k]<.075&&api.depth[k]<.065&&roadMask[k]>.50)
     return {x,z,y:height(x,z)};
   }
   return null;
  }
  const left=bank(-1),right=bank(1);
  if(left&&right){
   const span=Math.hypot(right.x-left.x,right.z-left.z);
   if(span>.95&&span<4.7){
    const mx=(left.x+right.x)*.5,mz=(left.z+right.z)*.5;
    const direction=Math.atan2(right.z-left.z,right.x-left.x);
    const deckY=Math.max(left.y,right.y)+.13;
    const bridge=new T.Group();
    bridge.name='Ponte de madeira nivelada · vão entre duas margens elevadas';
    bridge.position.set(mx,deckY,mz);
    // X local = eixo longitudinal da ponte; Z local = largura.
    bridge.rotation.y=-direction;
    const deckMat=new T.MeshStandardMaterial({color:'#86664a',roughness:1,metalness:0});
    const timber=new T.MeshStandardMaterial({color:'#4c382a',roughness:1,metalness:0});
    const addBox=(w,h,d,mat,x,y,z,name)=>{
     const o=new T.Mesh(new T.BoxGeometry(w,h,d),mat);
     o.name=name;o.position.set(x,y,z);
     o.castShadow=true;o.receiveShadow=true;bridge.add(o);return o;
    };
    // O tablado possui uma base contínua, para não parecer escada suspensa.
    addBox(span+.10,.11,1.29,timber,0,-.095,0,'Estrutura de apoio contínua');
    for(const lateral of [-.53,.53])
     addBox(span+.28,.18,.13,timber,0,-.175,lateral,'Viga longitudinal');
    const planks=Math.max(8,Math.ceil(span/.15));
    for(let i=0;i<planks;i++){
     const x=-span*.5+(i+.5)*span/planks;
     addBox(span/planks*.97,.065,1.32,deckMat,x,0,0,'Tábua nivelada '+i);
    }
    // Encontros enterram-se no terreno das duas margens; só o meio vence
    // o vão sem encostar no leito.
    for(const [side,bankPoint] of [[-1,left],[1,right]]){
     const bankGap=Math.max(.06,deckY-bankPoint.y);
     addBox(.33,bankGap+.24,1.47,timber,
      side*span*.5,-bankGap*.5-.035,0,'Encontro embutido na margem');
     for(const offset of [-.54,.54])
      addBox(.14,bankGap+.31,.15,deckMat,
       side*(span*.5-.13),-bankGap*.5-.02,offset,'Poste da cabeceira');
    }
    for(const lateral of [-.57,.57]){
     for(let p=0;p<=4;p++){
      const x=-span*.5+.08+(span-.16)*p/4;
      addBox(.09,.43,.09,timber,x,.22,lateral,'Balaústre');
     }
     addBox(span+.10,.095,.10,deckMat,0,.47,lateral,'Corrimão da ponte');
    }
    roads.add(bridge);
    // Coordenadas locais da ponte: X = comprimento, Z = largura.
    // O centro do boneco não pode atravessar os corrimãos laterais.
    const alongX=Math.cos(direction),alongZ=Math.sin(direction);
    // Colisão do corpo com as vigas: reservar margem para o raio do boneco.
    // Piso físico de 1.32 u; centro caminhável precisa ficar entre os corrimãos.
    // Reversão da barreira excessiva: manter o piso e testar somente
    // a travessia real da linha dos corrimãos dentro do comprimento da ponte.
    const halfSpan=span*.5,walkHalfWidth=.33;
    const local=(x,z)=>{
     const px=x-mx,pz=z-mz;
     return {along:px*alongX+pz*alongZ,side:-px*alongZ+pz*alongX};
    };
    const surfaceAt=(x,z)=>{
     if(!realm.visible)return null;
     const p=local(x,z);
     return Math.abs(p.along)<=halfSpan+.045&&Math.abs(p.side)<=walkHalfWidth?deckY+.0325:null;
    };
    const blocksSegment=(x0,z0,x1,z1)=>{
     if(!realm.visible)return false;
     const p0=local(x0,z0),p1=local(x1,z1);
     // Uma colisão só existe quando se cruza um corrimão, não ao se
     // aproximar da cabeceira ou caminhar paralelo pelo lado de fora.
     for(const side of [-.57,.57]){
      const d=p1.side-p0.side;
      if(Math.abs(d)<1e-8)continue;
      const t=(side-p0.side)/d;
      if(t<0||t>1)continue;
      const along=p0.along+(p1.along-p0.along)*t;
      if(Math.abs(along)<=halfSpan+.025)return true;
     }
     return false;
    };
    window.arcanoBridgeSolid={surfaceAt,blocksSegment,
     center:{x:mx,z:mz},deckY:deckY+.0325,span,width:1.32,
     rotation:-direction};
    console.info('[Arcano V12.58] Ponte com piso e corrimãos sólidos',window.arcanoBridgeSolid.center);
    console.info('[Arcano V12.37] Ponte horizontal entre margens',
     {left,right,span,deckY,clearance:deckY-height(mx,mz)});
   }else console.warn('[Arcano] Vão fora da faixa segura, ponte omitida.');
  }else console.warn('[Arcano] Margens opostas não encontradas, ponte omitida.');
 }
 muddyFootprints=generateFootprints();updateFootprints();
 makeRoadSurfaceDetails();
}
function initializeLandscape(){
 for(let k=0;k<cells;k++){
  const {x,z}=position(k),distRoad=Math.abs(z-roadZ(x)),distRiver=Math.abs(x-riverX(z));
  // A trilha é desgaste por PASSAGENS acumuladas. A passagem central
  // preexistente é apenas um histórico inicial, não um desenho permanente.
  const roadT=clamp(1-distRoad/1.10,0,1);
  const historic=roadT*roadT*(3-2*roadT);
  traffic[k]=historic*.76;
  fixedRoadMask[k]=historic;
  roadMask[k]=historic;
  riverMask[k]=clamp(1-distRiver/1.2,0,1);
  // O leito já foi escavado pelo terreno principal; evitar escavar duas vezes.
  // A margem fica sem cobertura vegetal.
  if(roadMask[k]>.1)
   api.permeability[k]*=(1-roadMask[k]*.38);
  compaction[k]=roadMask[k]*.48;
  const shade=.5+.5*Math.sin(x*.85+z*.34)*Math.cos(z*.6);
  const moist=api.soilMoisture[k]/Math.max(.001,api.soilCapacity[k]);
  lightField[k]=clamp(.45+.35*shade,0,1);
  cover[k]=distRiver<3.1||fixedRoadMask[k]>.06?0:
   clamp(.89+.08*shade+.12*moist-roadMask[k]*1.06-riverMask[k]*.90,0,1);
  foodResources[k]=Math.max(0,cover[k]*(1-roadMask[k])*.12);
 }
 const geom=api.terrain.geometry,positionAttribute=geom.getAttribute('position');
 for(let k=0;k<cells;k++)positionAttribute.setY(k,api.soil[k]);
 positionAttribute.needsUpdate=true;geom.computeVertexNormals();
 makeRoad();
}
// Um só renderizador aplica verde, barro e chuva a cada quadro.
// Uma segunda escrita periódica causava a piscada observada no Android.
function terrainTint(){/* delegated to main rebuild() */}
async function grassShape(){
 // V12.52: três estratos de grama Quaternius em TODO solo vegetável:
 // forração baixa contínua, segunda moita curta entre as primeiras e
 // grupamentos altos no mesmo estilo V12.42. Sem cones/triângulos antigos.
 // Estrada, rio e pequenas clareiras dos formigueiros continuam descobertos.
 const names=['grassShort1','grassMixed1','grassTall1','grassMixed2'];
 const materials=new Map(),obj=new T.Object3D();
 for(const name of names){
  const kind=name.startsWith('grassMixed')?'grassMixed':
   name==='grassTall1'?'grassTall':'grassShort';
  if(meshLibrary[name])materials.set(name,grassAnimatedMaterial(name,kind));
 }
 if(!materials.size)return;
 const step=mobileDevice?.140:.125,chunkSize=10;
 const nxChunk=Math.ceil(W/chunkSize),nzChunk=Math.ceil(L/chunkSize);
 let planted=0,available=0,nearRoad=0,farRoad=0,chunkCount=0,carpet=0,clumps=0;
 const matColor=new T.Color();
 function suitable(x,z){
  if(Math.abs(x)>W*.49||Math.abs(z)>L*.49)return -1;
  const k=idx(x,z);
  if(fixedRoadMask[k]>.045||Math.abs(z-roadZ(x))<1.11||
    nestBareMask[k]>20||Math.abs(x-riverX(z))<3.1||api.depth[k]>.068||
    cover[k]<.025)return -1;
  return k;
 }
 // O ponto inicial da câmera tem prioridade: a vegetação começa a
 // aparecer ao redor do jogador e depois se espalha até as bordas.
 // Cada setor recebe a MESMA quantidade por metro quadrado.
 const sectorOrder=[];
 for(let cz=0;cz<nzChunk;cz++)for(let cx=0;cx<nxChunk;cx++)
  sectorOrder.push({cx,cz,distance:
   Math.pow(-W*.48+(cx+.5)*chunkSize,2)+
   Math.pow(-L*.48+(cz+.5)*chunkSize,2)});
 sectorOrder.sort((a,b)=>a.distance-b.distance);
 let sectorIndex=0;
 for(const {cx,cz} of sectorOrder){
  const minX=-W*.48+cx*chunkSize,maxX=Math.min(W*.48,minX+chunkSize);
  const minZ=-L*.48+cz*chunkSize,maxZ=Math.min(L*.48,minZ+chunkSize);
  if(maxX<=minX||maxZ<=minZ)continue;
  const cols=Math.ceil((maxX-minX)/step),rows=Math.ceil((maxZ-minZ)/step);
  // Pacotes binários reutilizáveis: não criar milhões de Object3D/Matrix4
  // temporários no carregamento. Dados/posições são idênticos aos originais.
  const groups=new Map(names.map(name=>[name,{
   matrices:new Float32Array(128*16),keys:new Uint32Array(128),
   biomes:new Float64Array(128),count:0
  }]));
  function plant(name,x,z,multiplier=1){
   const geo=meshLibrary[name],out=groups.get(name);
   if(!geo||planted>=grassBudgets.high)return false;
   const k=suitable(x,z);if(k<0)return false;
   const growth=clamp(cover[k]*(1-traffic[k])*
     (.55+.45*clamp(api.soilPlant[k],0,1)),0,1);
   if(growth<.02)return false;
   const scale=(name==='grassShort1'?.43:name==='grassTall1'?.72:.63)*
     (.73+random()*.58)*multiplier;
   obj.position.set(x,height(x,z)-.018,z);
   obj.rotation.set((random()-.5)*.08,random()*Math.PI*2,(random()-.5)*.08);
   obj.scale.set(scale*(.74+random()*.50),scale*(.93+random()*.38),
     scale*(.78+random()*.44));
   obj.updateMatrix();
   const color=api.biomeField?.(x,z)||0;
   if(out.count===out.keys.length){
    const cap=out.keys.length*2;
    const matrices=new Float32Array(cap*16),keys=new Uint32Array(cap);
    const biomes=new Float64Array(cap);
    matrices.set(out.matrices);keys.set(out.keys);biomes.set(out.biomes);
    out.matrices=matrices;out.keys=keys;out.biomes=biomes;
   }
   out.matrices.set(obj.matrix.elements,out.count*16);
   out.keys[out.count]=k;out.biomes[out.count]=color;out.count++;
   planted++;
   if(Math.abs(z-roadZ(x))<7.5)nearRoad++;else farRoad++;
   return true;
  }
  // Mesmo adensamento em TODAS as regiões: não depender de grama
  // triangular preexistente, nem dar prioridade à estrada.
  for(let iz=0;iz<rows;iz++)for(let ix=0;ix<cols;ix++){
   const x=minX+(ix+random())/cols*(maxX-minX);
   const z=minZ+(iz+random())/rows*(maxZ-minZ);
   const k=suitable(x,z);if(k<0)continue;
   available++;
   const growth=clamp(cover[k]*(1-traffic[k])*
     (.55+.45*clamp(api.soilPlant[k],0,1)),0,1);
   // Estrato de preenchimento SEMPRE presente na grama saudável.
   // Reutiliza as malhas 3D Quaternius. Sem vegetação sobre solo pisado.
   if(plant(random()<.21?'grassMixed1':'grassShort1',
      x,z,1.18+growth*.33))carpet++;
   // Uma segunda moita fecha os intervalos; também passa pelo teste
   // de estrada, água, crescimento e solo descoberto em cada posição.
   if(random()<.76){
    const dx2=(random()-.5)*step*1.34,dz2=(random()-.5)*step*1.34;
    const px=x+dx2,pz=z+dz2;
    if(px>minX&&px<maxX&&pz>minZ&&pz<maxZ&&
       plant(random()<.24?'grassMixed2':'grassShort1',px,pz,1.02+growth*.25))carpet++;
   }
   // Touceiras altas da V12.42; por cima do tapete baixo, e não no lugar.
   if(random()<.68){
    const chance=random(),name=chance<.45?'grassTall1':
     chance<.82?'grassMixed1':'grassMixed2';
    if(plant(name,x+(random()-.5)*step*.7,
       z+(random()-.5)*step*.7,1.04+growth*.30))clumps++;
    if(random()<.68){
     const px=x+(random()-.5)*.42,pz=z+(random()-.5)*.42;
     if(px>minX&&px<maxX&&pz>minZ&&pz<maxZ){
      const other=random(),secondary=other<.45?'grassTall1':
       other<.82?'grassMixed1':'grassMixed2';
      if(plant(secondary,px,pz,1.04+growth*.30))clumps++;
     }
    }
   }
  }
  // Cada setor vira apenas 4 meshes instanciados. O GPU não recebe
  // os milhões de vértices dos setores fora da câmera.
  for(const name of names){
   const entries=groups.get(name);if(!entries.count)continue;
   const mesh=new T.InstancedMesh(meshLibrary[name],materials.get(name),entries.count);
   // Copiar os mesmos 16 floats de cada matriz de uma única vez.
   mesh.instanceMatrix.array.set(entries.matrices.subarray(0,entries.count*16));
   mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
   mesh.name='Tapete de grama Quaternius V12.52 · '+name+' · '+cx+','+cz;
   mesh.frustumCulled=true;mesh.castShadow=false;mesh.receiveShadow=true;
   mesh.userData.planted=entries.count;
   // A visualização exact-size não retém o buffer temporário dobrado
   // durante o plantio (reduz memória residente após carregar o mapa).
   mesh.userData.grassKeys=new Uint32Array(entries.keys.subarray(0,entries.count));
   mesh.userData.lastScale=new Float32Array(entries.count);
   mesh.userData.lastScale.fill(1);
   for(let i=0;i<entries.count;i++){
    const biome=entries.biomes[i];
    matColor.setRGB(1,1-biome*.13,1-biome*.28);
    mesh.setColorAt(i,matColor);
   }
   mesh.computeBoundingSphere();
   // A ponta pode inclinar-se ~30 cm além da caixa estática original.
   // Expande só o limite de culling, sem mudar a geometria nem a densidade.
   if(mesh.boundingSphere)mesh.boundingSphere.radius+=.55;
   mesh.instanceMatrix.needsUpdate=true;
   if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
   foliage.add(mesh);chunkCount++;
   const sectorId=cz*nxChunk+cx;
   if(!grassChunkMeshes.has(sectorId))grassChunkMeshes.set(sectorId,[]);
   grassChunkMeshes.get(sectorId).push(mesh);
  }
  // Libera temporários antes de entregar o controle ao navegador.
  groups.clear();
  sectorIndex++;
  if(sectorIndex%3===0){
   if($('ecoStatus'))$('ecoStatus').textContent=
    '🌱 Preenchendo gramado 3D '+Math.round(sectorIndex/sectorOrder.length*100)+
    '% · '+planted.toLocaleString('pt-BR')+' tufos (sem triângulos antigos)';
   await new Promise(resolve=>requestAnimationFrame(resolve));
  }
 }
 applyGrassQuality();
 console.info('[Arcano V12.52] Tapete baixo + tufo alto em TODO o mapa',
   {planted,carpet,clumps,eligibleSites:available,chunks:chunkCount,nearRoad,farRoad,quality:lastGrassQuality});
}
// FOLHAS: pequena malha 3D low-poly de seis faces (nervura central elevada),
// nas cores dos modelos Quaternius já carregados. O próprio MegaKit/Ultimate
// possui texturas de folha; este fragmento usa geometria pequena isolada para
// queda individual sem carregar centenas de FBX/GLB adicionais.
const fallingLeaves=[],leafLitterField=new Float32Array(cells);
const leafMeshes=[],leafGroup=new T.Group();
leafGroup.name='Queda de folhas, serrapilheira e decomposição';realm.add(leafGroup);
let leafClock=0,leafVisualClock=0,leafDeposited=0,leafCollected=0;
function leafGeometry(){
 const geo=new T.BufferGeometry();
 const v=[
  0,0,-.08, -.039,0,-.018, 0,.012,.020,
  0,0,-.08,0,.012,.020,.039,0,-.018,
  -.039,0,-.018,-.049,0,.052,0,.012,.020,
  0,.012,.020,-.049,0,.052,0,0,.092,
  0,.012,.020,0,0,.092,.049,0,.052,
  .039,0,-.018,0,.012,.020,.049,0,.052
 ];
 geo.setAttribute('position',new T.Float32BufferAttribute(v,3));
 geo.computeVertexNormals();return geo;
}
function setupLeafVisuals(){
 const geometry=window.ARCANO_NATURE_MODELS_V1239?.geometry?.(T,'leaf')||leafGeometry();
 const needles=leafGeometry();
 const palette=['#598739','#c8ab54','#b96443','#5b7140'];
 const capacity=mobileDevice?260:520;
 for(let kind=0;kind<4;kind++){
  const material=new T.MeshStandardMaterial({color:'#ffffff',
   roughness:1,metalness:0,side:T.DoubleSide,depthWrite:true});
  const m=new T.InstancedMesh(kind===3?needles:geometry,material,capacity);
  m.name=['Folhas verdes','Folhas amarelas','Folhas outonais',
   'Agulhas de pinheiro'][kind];
  m.count=0;m.frustumCulled=false;m.castShadow=false;
  leafGroup.add(m);leafMeshes.push(m);
 }
}
function treeLeafKind(a){
 const n=(a.modelName||'').toLowerCase();
 if(a.type==='pine'||/pine/.test(n))return 3;
 if(/maple|bordo|red/.test(n))return 2;
 if(/birch|bétula|yellow/.test(n))return 1;
 return 0;
}
function spawnFallingLeaf(){
 const trees=api.forestInstances.filter(a=>(a.type==='tree'||a.type==='pine')&&a.obj.visible);
 if(!trees.length||fallingLeaves.length>=(mobileDevice?230:460))return;
 const a=trees[Math.floor(random()*trees.length)];
 const width=clamp(a.crownWidth*.25,.20,.95),angle=random()*6.283;
 const radial=Math.sqrt(random())*width;
 const x=clamp(a.x+Math.cos(angle)*radial,-W*.48,W*.48);
 const z=clamp(a.z+Math.sin(angle)*radial,-L*.48,L*.48);
 const ground=height(x,z),startY=Math.max(ground+.22,
  (a.dropY||ground+2.3)-random()*.9);
 fallingLeaves.push({kind:treeLeafKind(a),x,z,y:startY,ground,
  age:0,mass:.0006+random()*.0006,stage:'falling',
  turn:random()*6.28,phase:random()*6.28,
  rotX:random()*6.28,rotZ:random()*6.28,scale:.45+random()*.65});
}
function collectLeafFragments(k,limit){
 if(limit<=0||leafLitterField[k]<=0)return 0;
 let remaining=Math.min(limit,leafLitterField[k]),picked=0;
 for(const leaf of fallingLeaves){
  if(leaf.stage!=='ground'||idx(leaf.x,leaf.z)!==k||leaf.mass<=0)continue;
  if(leaf.age>42)continue;
  const take=Math.min(leaf.mass,remaining);
  leaf.mass-=take;picked+=take;remaining-=take;
  if(leaf.mass<.000008)leaf.stage='picked';
  if(remaining<.000005)break;
 }
 leafLitterField[k]=Math.max(0,leafLitterField[k]-picked);
 leafCollected+=picked;return picked;
}
function animateLeafFall(dt){
 if(!leafMeshes.length)return;
 const atm=api.atmosphere.getMetrics();
 const rain=api.getRainLevel?.()||0;
 const wind=clamp((atm.wind||0)/3,0,1.4);
 // Queda ocasional: probabilidade baixa em calmaria, maior com ventania.
 leafClock+=dt*(.60+wind*wind*1.35+(rain>=3?.56:0));
 while(leafClock>1.0){
  leafClock-=1.0;
  if(random()<.60+clamp(wind*.26,0,.35))spawnFallingLeaf();
 }
 const compostMult=1+(rain>0?.45:0)+
  clamp((atm.humidity||.5),0,1)*.5;
 for(let i=fallingLeaves.length-1;i>=0;i--){
  const leaf=fallingLeaves[i];
  if(leaf.stage==='picked'){fallingLeaves.splice(i,1);continue;}
  leaf.age+=dt*clamp(.75+biologicalSpeed*.09,1,5);
  if(leaf.stage==='falling'){
   leaf.y-=dt*(.38+wind*.18);
   leaf.x=clamp(leaf.x+dt*(wind*.06+Math.sin(leaf.phase+leaf.age*2)*.06),-W*.49,W*.49);
   leaf.z=clamp(leaf.z+dt*Math.cos(leaf.phase+leaf.age*2)*.055,-L*.49,L*.49);
   leaf.rotX+=dt*2.6;leaf.rotZ+=dt*1.8;leaf.turn+=dt*.6;
   leaf.ground=height(leaf.x,leaf.z);
   if(leaf.y<=leaf.ground+.02){
    leaf.y=leaf.ground+.018;leaf.stage='ground';
    const k=idx(leaf.x,leaf.z);leafLitterField[k]+=leaf.mass;
    leaf.age=0;
   }
  }else{
   const k=idx(leaf.x,leaf.z),water=clamp(api.soilMoisture[k]/
    Math.max(.001,api.soilCapacity[k]),0,1.4);
   // Serrapilheira apodrece gradualmente; solo úmido acelera a conversão.
   const decomposed=Math.min(leaf.mass,dt*(.0000009+.0000025*water)*compostMult);
   leaf.mass-=decomposed;
   leafLitterField[k]=Math.max(0,leafLitterField[k]-decomposed);
   api.soilLitter[k]=clamp(api.soilLitter[k]+decomposed*.76,0,1.8);
   api.soilOrganic[k]=clamp(api.soilOrganic[k]+decomposed*.24,0,1.8);
   leafDeposited+=decomposed;
   leaf.y=height(leaf.x,leaf.z)+.019;
   if(leaf.mass<.00001){fallingLeaves.splice(i,1);continue;}
  }
 }
 leafVisualClock+=dt;
 if(leafVisualClock<.055)return;
 leafVisualClock=0;
 const counts=[0,0,0,0],obj=new T.Object3D();
 const palette=['#579640','#caba48','#c06c42','#66834c'];
 const brown=new T.Color('#77502e'),black=new T.Color('#221c17');
 for(const leaf of fallingLeaves){
  const kind=leaf.kind,m=leafMeshes[kind],index=counts[kind]++;
  if(index>=m.instanceMatrix.count){counts[kind]--;continue;}
  obj.position.set(leaf.x,leaf.y,leaf.z);
  obj.rotation.set(leaf.stage==='falling'?leaf.rotX:0,leaf.turn,
   leaf.stage==='falling'?leaf.rotZ:-Math.PI/2);
  const size=leaf.scale*(kind===3?.45:.16);
  obj.scale.setScalar(size);obj.updateMatrix();m.setMatrixAt(index,obj.matrix);
  const color=new T.Color(palette[kind]);
  if(leaf.stage==='ground'){
   const age=clamp(leaf.age/80,0,1);
   color.lerp(brown,clamp(age*2,0,1));
   if(age>.52)color.lerp(black,clamp((age-.52)*2.08,0,1));
  }
  m.setColorAt(index,color);
 }
 for(let kind=0;kind<4;kind++){
  const m=leafMeshes[kind];m.count=counts[kind];
  m.instanceMatrix.needsUpdate=true;
  if(m.instanceColor)m.instanceColor.needsUpdate=true;
 }
}

const fruitGroup=new T.Group();fruitGroup.name='Maçãs originais · verde, madura, podre e húmus';realm.add(fruitGroup);
const fruits=[];let fruitClock=0,fruitFallen=0,fruitNutrients=0,fruitGeo=null;
function setupFruits(){
 fruitGeo=window.ARCANO_NATURE_MODELS_V1239?.geometry?.(T,'apple')||
   new T.SphereGeometry(.5,8,7);
}
function spawnFruit(test=false){
 if(!fruitGeo||fruits.length>=(mobileDevice?42:80))return;
 // Apenas um subconjunto fixo das árvores do mapa frutifica por enquanto.
 // fruitBearing poderá ser definido individualmente no futuro.
 const candidates=api.forestInstances.filter(a=>
  a.type==='tree'&&a.obj.visible&&Number.isFinite(a.dropY)&&a.dropY>a.y+.8&&
  (a.fruitBearing===true||(a.fruitBearing!==false&&Math.abs(Math.round(a.x*13+a.z*17))%4===0)));
 if(!candidates.length)return;
 const tree=candidates[Math.floor(random()*candidates.length)];
 const spread=clamp((tree.crownWidth||2.5)*.22,.12,.70);
 const x=clamp(tree.x+(random()-.5)*spread*2,-W*.48,W*.48);
 const z=clamp(tree.z+(random()-.5)*spread*2,-L*.48,L*.48);
 const y=Math.max(height(x,z)+.6,tree.dropY-.45-random()*.52);
 const mat=new T.MeshStandardMaterial({color:'#57a63f',roughness:.91,metalness:0});
 const mesh=new T.Mesh(fruitGeo,mat);mesh.castShadow=false;
 mesh.name='Maçã Kenney importada: verde / madura / podre';
 mesh.position.set(x,y,z);mesh.scale.setScalar(.12+random()*.04);
 fruitGroup.add(mesh);
 fruits.push({mesh,x,z,y,age:test?random()*24:0,
  ripeAt:12+random()*11,fallAt:26+random()*14,
  rotAt:53+random()*19,mass:.0028+random()*.0026,
  phase:random()*6.283,fallVelocity:0,stage:'green'});
}
function animateFruits(dt){
 if(!fruitGeo)return;
 const wind=clamp((api.atmosphere.getMetrics().wind||0)/3,0,1.5);
 fruitClock+=dt;
 if(fruitClock>6){
  fruitClock=0;
  if(random()<.68)spawnFruit();
 }
 const step=dt*clamp(.8+biologicalSpeed*.1,1,4);
 for(let i=fruits.length-1;i>=0;i--){
  const f=fruits[i];f.age+=step;
  if(f.stage==='green'&&f.age>f.ripeAt){
   f.stage='ripe';f.mesh.material.color.set('#cb4936');
  }
  if(f.stage==='ripe'&&f.age>f.fallAt&&
    (random()<dt*(.045+wind*.18)||f.age>f.fallAt+17)){
    f.stage='falling';fruitFallen++;f.fallVelocity=0;
  }
  if(f.stage==='falling'){
   f.fallVelocity=Math.min(3.5,f.fallVelocity+dt*2.3);
   f.y-=f.fallVelocity*dt;
   f.x+=wind*dt*.012*Math.sin(f.phase+f.age);
   f.z+=wind*dt*.012*Math.cos(f.phase+f.age);
   const ground=height(f.x,f.z)+.075;
   if(f.y<=ground){f.y=ground;f.stage='fallen';}
   f.mesh.position.set(f.x,f.y,f.z);
   f.mesh.rotation.z+=dt*1.8;
  }else if(f.stage==='fallen'||f.stage==='rotten'){
   const k=idx(f.x,f.z),moist=clamp(api.soilMoisture[k]/
    Math.max(.001,api.soilCapacity[k]),0,1.4);
   if(f.age>f.rotAt&&f.stage==='fallen'){
    f.stage='rotten';f.mesh.material.color.set('#201a17');
   }
   if(f.stage==='rotten'){
    const decay=Math.min(f.mass,dt*(.000021+.000028*moist));
    f.mass-=decay;fruitNutrients+=decay;
    
    
    f.mesh.scale.multiplyScalar(Math.max(.96,1-dt*.025));
    if(f.mass<.000007){
     fruitGroup.remove(f.mesh);f.mesh.material.dispose();fruits.splice(i,1);
    }
   }
  }else{
   f.mesh.position.y=f.y+Math.sin(f.age*.6+f.phase)*wind*.004;
  }
 }
}
function rockShape(){
 api.stones.visible=false;const names=['rock1','rock2','rock3','rock4','rock5'];
 const mat=material('rock');
 for(let i=0;i<45;i++){
  const physical=api.rockSolids[i%Math.max(1,api.rockSolids.length)];
  const x=physical?physical.x:(random()-.5)*W*.92;
  const z=physical?physical.z:(random()-.5)*L*.92,k=idx(x,z);
  // Pedras grandes nunca nascem dentro da estrada ou junto a suas bordas.
  // Rotas novas contornam as rochas existentes.
  // Excluir rochas grandes de caminhos e suas bordas, incluindo trilhas
  // recentes de animais. Amostrar todo o perímetro do volume da rocha.
  const radius=.70+(i%5)*.18;
  let clashes=false;
  for(const [ox,oz] of [[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius],
   [radius*.7,radius*.7],[-radius*.7,-radius*.7]]){
   const cell=idx(x+ox,z+oz);
   if(roadMask[cell]>.08||animalTrail[cell]>.16||riverMask[cell]>.75){
    clashes=true;break;
   }
  }
  if(clashes||Math.abs(z-roadZ(x))<radius+1.1)continue;
  const key=names[i%names.length];const geom=meshLibrary[key];if(!geom)continue;
  const m=new T.Mesh(geom,mat.clone());m.name='Rocks.fbx '+key;
  const scale=.30+random()*.65;
  m.scale.set(scale*(.70+random()*.8),scale*(.46+random()*.65),scale*(.65+random()*.8));
  m.rotation.set((random()-.5)*.35,random()*Math.PI*2,(random()-.5)*.35);
  m.position.set(x,height(x,z)-.065,z);
  m.castShadow=true;m.receiveShadow=true;rocks.add(m);rockPositions.push({x,z});
 }
}
function ecologicalDayRate(dt){return dt*biologicalSpeed/1440;}
// Trilha química discreta na malha: evapora/é lavada pela chuva e é reforçada
// quando a forrageadora retorna com alimento.
function reinforceTrail(c,site,intensity=1){
 const start=idx(c.x,c.z),a=position(start),b=position(site);
 const count=Math.max(2,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/dx));
 for(let step=0;step<=count;step++){
  const t=step/count,k=idx(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t);
  const dry=clamp(api.soilMoisture[k]/Math.max(.001,api.soilCapacity[k]),0,1);
  c.pheromones[k]=clamp(c.pheromones[k]+(.05+.26*intensity)*(1-dry*.15),0,2);
 }
 c.lastFoodSite=site;
}
function chooseFoodSites(c){
 const origin=idx(c.x,c.z),o=position(origin),sites=[];
 for(let iz=-8;iz<=8;iz+=2)for(let ix=-8;ix<=8;ix+=2){
  const x=clamp(Math.round((c.x+W*.5)/dx)+ix,0,NX-1);
  const z=clamp(Math.round((c.z+L*.5)/dz)+iz,0,NZ-1),k=z*NX+x;
  const site=position(k),distance=Math.hypot(o.x-site.x,o.z-site.z);
  const food=foodResources[k]+api.soilLitter[k]*.55+leafLitterField[k]*.85;
  const pheromone=c.pheromones[k];
  const submerged=api.depth[k]>.06;
  sites.push({k,score:(food*1.85+pheromone*.26)/(1+distance*.27)
   *(submerged?.05:1)*(1-roadMask[k]*.28)});
 }
 sites.sort((a,b)=>b.score-a.score);
 return sites.slice(0,18);
}
function newColony(x,z,workers=24,food=12,founder=false){
 const c={id:colonySequence++,queen:true,queenFertile:true,queenAge:0,x,z,
 workers,food,deathProgress:0,eggProgress:0,foodGathered:0,
 brood:founder?[]:[{stage:'egg',age:0,count:5},{stage:'larva',age:8,count:4},
  {stage:'pupa',age:18,count:3}],
 scouts:0,foragers:0,nurses:0,builders:0,guards:0,dead:0,
 temperature:23,queenStress:0,pheromones:new Float32Array(cells),lastFoodSite:idx(x,z),
 tunnels:founder?.09:Math.max(.76,workers*.014),chambers:founder?1:3,
 spoil:Math.max(.03,workers*.0006),
 foodStored:food*.35,founder, reproductiveCooldown:0,daysWithoutFood:0,
 leafCargo:0,queenDepth:.78,subterranean:[
  {depth:.15,role:'entrada / vigias / forrageio',chambers:1,workers:0},
  {depth:.42,role:'depósito / alimento / operárias',chambers:founder?0:1,workers:0},
  {depth:.78,role:'rainha / ovos / larvas',chambers:founder?0:1,workers:0},
  {depth:1.08,role:'refúgio profundo / pupas',chambers:0,workers:0}
 ]};
 distributeTasks(c);return c;
}
function distributeTasks(c){
 const n=c.workers;
 c.foragers=Math.floor(n*.44);c.nurses=Math.floor(n*.23);
 c.builders=Math.floor(n*.17);c.guards=Math.floor(n*.10);
 c.scouts=Math.max(0,n-c.foragers-c.nurses-c.builders-c.guards);
 if(c.subterranean){
  c.subterranean[0].workers=c.scouts+c.guards;
  c.subterranean[1].workers=c.foragers+c.builders;
  c.subterranean[2].workers=c.nurses;
  c.subterranean[3].workers=0;
 }
}
function nestSurface(c){
 const anchor=position(idx(c.x,c.z)),y=height(c.x,c.z);
 if(nestDisplays.has(c.id))return nestDisplays.get(c.id);
 paintNestBareSoil(c.x,c.z);
 const g=new T.Group();g.name='Formigueiro colônia '+(c.id+1);g.position.set(c.x,y,c.z);
 const granules=new T.MeshStandardMaterial({color:'#98764e',roughness:1,metalness:0});
 const mound=new T.Mesh(new T.ConeGeometry(.18,.085,16,3),granules);
 mound.rotation.y=c.id*1.2;mound.position.y=.035;g.add(mound);
 const entrance=new T.Mesh(new T.CircleGeometry(.042,20),
  new T.MeshBasicMaterial({color:'#24170f',depthWrite:false,side:T.DoubleSide}));
 entrance.rotation.x=-Math.PI/2;entrance.position.y=.088;g.add(entrance);
 const rim=new T.Mesh(new T.TorusGeometry(.056,.012,5,20),
  new T.MeshStandardMaterial({color:'#b48c62',roughness:1,metalness:0}));
 rim.rotation.x=-Math.PI/2;rim.position.y=.092;g.add(rim);
 const grainsG=new T.SphereGeometry(.009,4,3);
 for(let i=0;i<18;i++){
  const angle=i*2.399,dist=.08+.085*random();
  const grain=new T.Mesh(grainsG,granules);
  grain.position.set(Math.cos(angle)*dist,.012+random()*.025,Math.sin(angle)*dist);
  grain.scale.set(.4+random(),.30+random(),.5+random());g.add(grain);
 }
 realm.add(g);nestDisplays.set(c.id,{group:g,mound,entrance,rim});
 updateNestSurface(c);
 return nestDisplays.get(c.id);
}
function updateNestSurface(c){
 const nest=nestDisplays.get(c.id);if(!nest)return;
 const scale=clamp(.55+c.spoil*1.4,.65,1.75);
 nest.mound.scale.set(scale,Math.min(1.55,scale*.7),scale);
 nest.group.position.y=height(c.x,c.z);
 nest.entrance.visible=c.workers>0||c.queen;
 nest.rim.visible=nest.entrance.visible;
}
// Galerias computadas abaixo da superfície: comprimento/câmaras são físicos
// no estado do solo, mas não se abre geometria cara no mapa à distância.
function excavateNest(c,days,safe){
 if(c.workers<=0)return;
 const k=idx(c.x,c.z);
 const saturation=clamp(api.soilMoisture[k]/Math.max(.001,api.soilCapacity[k]),0,1);
 const effort=Math.max(0,c.builders)*days*.0015*safe*(1-saturation*.6);
 if(effort<=0)return;
 const available=Math.min(effort,.035*days);
 c.tunnels=clamp(c.tunnels+available,0,8);
 const previousChambers=c.chambers;
 c.chambers=Math.min(12,1+Math.floor(c.tunnels/.32));
 // Câmaras distribuídas em horizontes, rainha protegida abaixo da entrada.
 const allocations=[1,Math.max(0,Math.floor(c.chambers*.30)),
  Math.max(0,Math.floor(c.chambers*.35)),0];
 allocations[3]=Math.max(0,c.chambers-allocations[0]-
  allocations[1]-allocations[2]);
 for(let layer=0;layer<4;layer++)
  c.subterranean[layer].chambers=allocations[layer];
 const groundwater=api.deepWater?.[k]||0;
 const deepFlood=groundwater>.42;
 c.queenDepth=deepFlood?.42:.78;
 if(c.chambers>previousChambers)
  recordEcoEvent('Colônia '+(c.id+1)+' construiu a câmara '+c.chambers+'.');
 c.spoil=clamp(c.spoil+available*.64,0,1);
 burrowLength+=available;
 // Solo escavado vai para o monte exterior. Túneis melhoram macroporosidade
 // local mas obras excessivas não transformam o solo em meio infinito.
 api.permeability[k]=clamp(api.permeability[k]*(1+available*.13),.000001,.16);
 api.soilBiota[k]=clamp(api.soilBiota[k]+available*.06,0,1);
 updateNestSurface(c);
}
function initialColonies(){
 recordEcoEvent('Três colônias fixas: dez formigas coletoras em cada uma.');
 for(const [x,z] of [[-6,2.5],[4.5,2.9],[-2,-4.1]]){
  const c=newColony(x,z,10,15,false);
  c.brood=[];c.queenFertile=false;
  colonies.push(c);nestSurface(c);
 }
 // Minhocas removidas: não criar indivíduos, galerias nem malhas.
}
function addCarcass(x,z,mass=.03){
 const k=idx(x,z);api.soilLitter[k]=clamp(api.soilLitter[k]+mass,0,1.8);
 api.soilOrganic[k]=clamp(api.soilOrganic[k]+mass*.15,0,1.8);
 return k;
}
// Passos ecológicos discretos por dia simulado; parâmetros são didáticos
// e dependem de espécies/condições reais, não constituem previsão de campo.
function lifeDay(days){
 // Colônias fixas: sem reprodução, mortalidade, adubo ou biologia subterrânea.
 ecologicalDays+=days;
 for(const c of colonies){c.workers=10;c.brood.length=0;c.foragers=10;c.nurses=0;c.builders=0;c.guards=0;c.scouts=0;}
}
function antGeometry(name){
 const source=meshLibrary[name]||meshLibrary.ant1;
 if(!source)return null;
 if(normalizedAntGeometries.has(source))return normalizedAntGeometries.get(source);
 const geom=source.clone();geom.computeBoundingBox();
 let bounds=geom.boundingBox,size=new T.Vector3();bounds.getSize(size);
 // Evitar eixo vertical incorreto em alguns modelos antigos Z-up.
 if(size.y>Math.max(size.x,size.z)*1.6){
  geom.rotateX(Math.PI*.5);geom.computeBoundingBox();
  bounds=geom.boundingBox;bounds.getSize(size);
 }
 const largest=Math.max(size.x,size.y,size.z,.000001);
 geom.scale(1/largest,1/largest,1/largest);
 geom.computeBoundingBox();bounds=geom.boundingBox;
 const center=new T.Vector3();bounds.getCenter(center);
 geom.translate(-center.x,-bounds.min.y,-center.z);
 geom.computeBoundingSphere();
 normalizedAntGeometries.set(source,geom);
 return geom;
}
// Esconde quaisquer modelos antigos de formiga inseridos fora do sistema
// de instâncias animadas; protege contra a formiga gigante estática.
function hideDetachedAntModels(){
 // A versão antiga só procurava "ant" no NOME DA MALHA. Nos OBJ/FBX
 // originais, o nome costuma pertencer ao GRUPO PAI e a malha chama-se
 // Mesh_0 ou Object_0. Remover a origem de qualquer formiga estática.
 const pattern=/(^|[\s_.-])(ant|formiga|leaf.?cutter|red.?ant)([\s_.-]|\d|$)|^(leaf.?cutter|red.?ant|formiga)/i;
 const roots=new Set();
 api.scene.traverse(obj=>{
  if(!obj.isMesh&&!obj.isSkinnedMesh)return;
  let p=obj,insideEcology=false,antRoot=null;
  while(p&&p!==api.scene){
   if(p===realm){insideEcology=true;break;}
   if(pattern.test(p.name||''))antRoot=p;
   p=p.parent;
  }
  if(!insideEcology&&antRoot)roots.add(antRoot);
 });
 for(const obj of roots){
  // Não descartar os recursos compartilhados; apenas retirar do cenário.
  if(obj.parent)obj.parent.remove(obj);
 }
 if(roots.size)console.info('[Arcano V12.40] Formigas estáticas removidas:',roots.size);
}
let compactAntMesh=null;
function compactAntGeometry(){
 if(compactAntMesh)return compactAntMesh;
 const bodies=[
  {x:-.43,r:.32},{x:.07,r:.23},{x:.43,r:.22}
 ];
 const vertices=[],indices=[];
 const sphere=new T.SphereGeometry(1,7,5);
 const pos=sphere.getAttribute('position');
 const face=sphere.getIndex();
 for(const b of bodies){
  const offset=vertices.length/3;
  for(let i=0;i<pos.count;i++){
   vertices.push(pos.getX(i)*b.r+b.x,
    pos.getY(i)*b.r*.75+.28,pos.getZ(i)*b.r*.75);
  }
  for(let j=0;j<face.count;j++)indices.push(offset+face.getX(j));
 }
 const limb=(ax,ay,az,bx,by,bz,r=.022)=>{
  const a=new T.Vector3(ax,ay,az),b=new T.Vector3(bx,by,bz);
  const d=b.clone().sub(a),length=d.length();
  const g=new T.CylinderGeometry(r,r*.8,length,4);
  g.rotateZ(Math.PI/2);g.translate(length/2,0,0);
  const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(1,0,0),d.normalize());
  g.applyQuaternion(q);g.translate(...a.toArray());
  const gp=g.getAttribute('position'),ix=g.getIndex(),base=vertices.length/3;
  for(let i=0;i<gp.count;i++)vertices.push(gp.getX(i),gp.getY(i),gp.getZ(i));
  for(let i=0;i<ix.count;i++)indices.push(base+ix.getX(i));
  g.dispose();
 };
 for(const x of [-.3,0,.28])for(const sign of [-1,1]){
  limb(x,.3,sign*.10,x+.08,.12,sign*.45);
  limb(x+.08,.12,sign*.45,x+.14,.015,sign*.58);
 }
 for(const sign of [-1,1])limb(.49,.44,sign*.07,.68,.65,sign*.28,.016);
 sphere.dispose();
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
 g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();
 compactAntMesh=g;return g;
}
function visualizeAnimals(){
 for(const child of [...animals.children]){
  animals.remove(child);
  if(child.isInstancedMesh)child.material.dispose();
  
 }
 antDraws.length=0;
 const variants=['ant1','ant2','ant3','antRed','ant4','ant5'];
 for(const c of colonies){
  // Malhas OBJ antigas tinham transformações e eixos inconsistentes.
  // Um modelo minúsculo procedural elimina definitivamente a formiga
  // gigante e mantém colônias completas sem mutação de asset global.
  const geo=compactAntGeometry();if(!geo)continue;
  const max=10;
  const mesh=new T.InstancedMesh(geo,new T.MeshStandardMaterial({
   color:c.id%2?'#a3533b':'#49332b',roughness:1,metalness:0,side:T.DoubleSide}),max);
  mesh.name='Operárias · reconhecimento, coleta, retorno · colônia '+(c.id+1);
  mesh.count=0;
  mesh.frustumCulled=false;mesh.castShadow=false;
  // A InstancedMesh nasce com matrizes IDENTIDADE. Sem esta inicialização,
  // uma formiga pode aparecer gigante no (0,0,0) enquanto o módulo carrega.
  const hidden=new T.Matrix4().makeScale(.0000001,.0000001,.0000001);
  hidden.setPosition(0,-500,0);
  for(let instance=0;instance<max;instance++)mesh.setMatrixAt(instance,hidden);
  mesh.instanceMatrix.needsUpdate=true;animals.add(mesh);
  // Os OBJ enviados são estáticos, sem clips rigados de morte.
  // O corpo morto será achatado e tombado antes de sumir.
  const cargo=new T.InstancedMesh(leafGeometry(),
   new T.MeshStandardMaterial({color:'#baa458',roughness:1,side:T.DoubleSide}),max);
  cargo.name='Fragmentos de folhas transportados';cargo.count=0;
  cargo.frustumCulled=false;animals.add(cargo);
  const agents=Array.from({length:max},(_,i)=>({
   dead:false,deadUntil:0,retreatAt:-1,returning:false,carrying:false,
   originX:c.x,originZ:c.z,retreatDuration:1,x:c.x,z:c.z,phase:random()*2,
   targetX:c.x,targetZ:c.z,goalAt:0,lastTick:0,walkPhase:random()*6.283
  }));
  antDraws.push({m,c,max,agents,cargo});
 }

}let lastAntImpactReport=-999,antsDrowned=0,antsCrushed=0;
function killSurfaceAnt(item,agent,x,z,cause){
 return; // Colônias fixas de dez operárias, sem mortalidade.
 if(agent.dead)return;
 agent.dead=true;agent.deadUntil=time+3.4;agent.x=x;agent.z=z;
 item.c.workers=Math.max(0,item.c.workers-1);item.c.dead++;
 distributeTasks(item.c);
 addCarcass(x,z,.0012);
 if(cause==='pisoteio')antsCrushed++;else antsDrowned++;
 if(time-lastAntImpactReport>8){
  lastAntImpactReport=time;
  recordEcoEvent('Operária da colônia '+(item.c.id+1)+
   (cause==='pisoteio'?' morreu esmagada.':' não retornou antes da chuva forte.'));
 }
}
function checkAntTrampling(x,z,weight){
 return; // Passadas não reduzem o número fixo de formigas.
 const radius=.12+Math.min(.14,weight*.12);
 for(const item of antDraws)for(const agent of item.agents){
  if(agent.dead||!Number.isFinite(agent.x))continue;
  if(Math.hypot(agent.x-x,agent.z-z)<radius&&random()<.38+weight*.36)
   killSurfaceAnt(item,agent,agent.x,agent.z,'pisoteio');
 }
}
function moveAnimals(t){
 const body=new T.Object3D(),carrier=new T.Object3D();
 const magnify=clamp(previewMagnification,1,4);
 for(const item of antDraws){
  const {m,c,agents,cargo}=item;
  m.count=10;cargo.count=0;
  for(let i=0;i<10;i++){
   const a=agents[i],dt=Math.min(.09,Math.max(.001,t-(a.lastTick||t-.016)));
   a.lastTick=t;
   // Alterna entre explorar locais com comida e regressar ao formigueiro.
   if(!a.returning&&(a.goalAt<=t||Math.hypot(a.targetX-a.x,a.targetZ-a.z)<.06)){
    if(a.goalAt>0){a.returning=true;a.carrying=true;}
    else{
     const angle=random()*Math.PI*2,radius=.6+random()*1.6;
     a.targetX=clamp(c.x+Math.cos(angle)*radius,-W*.48,W*.48);
     a.targetZ=clamp(c.z+Math.sin(angle)*radius,-L*.48,L*.48);
     a.goalAt=t+12;
    }
   }
   if(a.returning){a.targetX=c.x;a.targetZ=c.z;}
   const vx=a.targetX-a.x,vz=a.targetZ-a.z,dist=Math.hypot(vx,vz);
   const step=Math.min(dist,dt*.21);
   if(dist>.0001){a.x+=vx/dist*step;a.z+=vz/dist*step;}
   if(a.returning&&Math.hypot(a.x-c.x,a.z-c.z)<.065){
    a.returning=false;a.carrying=false;a.goalAt=0;
    c.foodStored=Math.min(120,(c.foodStored||0)+.01);
   }
   const heading=Math.atan2(vx,vz);
   body.position.set(a.x,height(a.x,a.z)+.004,a.z);
   body.rotation.set(0,heading,0);body.scale.setScalar(.011*magnify);
   body.updateMatrix();m.setMatrixAt(i,body.matrix);
   if(a.carrying){
    carrier.position.set(a.x,height(a.x,a.z)+.01,a.z);
    carrier.rotation.set(0,heading,0);carrier.scale.setScalar(.03*magnify);
    carrier.updateMatrix();cargo.setMatrixAt(cargo.count++,carrier.matrix);
   }
  }
  m.instanceMatrix.needsUpdate=true;
  cargo.instanceMatrix.needsUpdate=true;
 }
}
//
// V12.53: uma só leitura dos índices ecológicos por célula, em vez de
// percorrer as ~2 milhões de instâncias a cada 0,7 s. Os setores que
// realmente mudaram são os únicos cujos buffers são revisitados.
function updateGrassMeshes(force=false){
 if(!grassChunkMeshes.size)return;
 const dirty=new Set();
 if(force||grassForceRefresh){
  for(const id of grassChunkMeshes.keys())dirty.add(id);
  for(let k=0;k<cells;k++){
   const scale=grassAliveScale(k);
   grassCurrentScale[k]=scale;grassCellLastScale[k]=scale;
  }
  grassForceRefresh=false;
 }else{
  const chunkSize=10,nxChunk=Math.ceil(W/chunkSize),nzChunk=Math.ceil(L/chunkSize);
  const xMargin=dx*1.05,zMargin=dz*1.05;
  for(let k=0;k<cells;k++){
   const scale=grassAliveScale(k),prev=grassCellLastScale[k];
   grassCurrentScale[k]=scale;
   if(Math.abs(scale-prev)<.018)continue;
   grassCellLastScale[k]=scale;
   const x=-W*.5+(k%NX)*dx,z=-L*.5+Math.floor(k/NX)*dz;
   const ux=(x+W*.48)/chunkSize,uz=(z+L*.48)/chunkSize;
   const cx=Math.floor(ux),cz=Math.floor(uz);
   // Amostragem da célula arredonda o centro em até meio dx/dz.
   // Incluir os setores vizinhos apenas perto de suas fronteiras.
   const xs=[cx],zs=[cz];
   if(ux-cx<xMargin/chunkSize)xs.push(cx-1);
   if(cx+1-ux<xMargin/chunkSize)xs.push(cx+1);
   if(uz-cz<zMargin/chunkSize)zs.push(cz-1);
   if(cz+1-uz<zMargin/chunkSize)zs.push(cz+1);
   for(const ax of xs)for(const az of zs)
    if(ax>=0&&az>=0&&ax<nxChunk&&az<nzChunk)
     dirty.add(az*nxChunk+ax);
  }
 }
 if(!dirty.size)return;
 for(const id of dirty){
  const sector=grassChunkMeshes.get(id);
  if(!sector)continue;
  for(const mesh of sector){
   const keys=mesh.userData.grassKeys,previous=mesh.userData.lastScale;
   const buffer=mesh.instanceMatrix.array;
   let firstChanged=mesh.count,lastChanged=-1;
   for(let i=0;i<mesh.count;i++){
    const scale=grassCurrentScale[keys[i]];
    const last=previous[i]||1;
    if(Math.abs(scale-last)<.018)continue;
    const ratio=scale/last,off=i*16;
    for(let j=0;j<12;j++)buffer[off+j]*=ratio;
    previous[i]=scale;
    if(i<firstChanged)firstChanged=i;
    lastChanged=i;
   }
   if(lastChanged>=0){
    // r152: updateRange conta floats (16 por matriz). Preserva todas as
    // instâncias e transfere somente o intervalo alterado à GPU.
    const attr=mesh.instanceMatrix;
    attr.updateRange.offset=firstChanged*16;
    attr.updateRange.count=(lastChanged-firstChanged+1)*16;
    attr.needsUpdate=true;
   }
  }
 }
}
// A estrada NÃO é um objeto gerado: é o resultado histórico de pisoteio,
// compactação, perda de clorofila e redução dos tufos de grama.
const largeAnimals=[];
let grassRefreshRequested=false;
function stampTraffic(x,z,weight=.25,animal=false){
 const ix=Math.round((x+W*.5)/dx),iz=Math.round((z+L*.5)/dz);
 const cellRadius=animal?3:2;
 for(let oz=-cellRadius;oz<=cellRadius;oz++)for(let ox=-cellRadius;ox<=cellRadius;ox++){
  const cx=ix+ox,cz=iz+oz;
  if(cx<0||cz<0||cx>=NX||cz>=NZ)continue;
  const k=cz*NX+cx,dist=Math.hypot(ox,oz)/cellRadius;
  if(dist>1||riverMask[k]>.88)continue;
  const f=Math.pow(1-dist,1.35);
  const press=weight*(animal?.51:.66)*f;
  traffic[k]=clamp(traffic[k]+press,0,1);
  if(animal)animalTrail[k]=clamp(animalTrail[k]+press*.96,0,1);
  compaction[k]=clamp(compaction[k]+press*.33,0,1);
  // Pisoteio afeta apenas a trilha; não altera a fertilidade.
  // Permeabilidade estática: sem custo de recalcular por pisada.
  const t=clamp((Math.max(traffic[k],animalTrail[k])-.18)/.65,0,1);
  roadMask[k]=Math.max(fixedRoadMask[k],t*t*(3-2*t));
  // Muito trânsito remove vegetação de imediato, mas ela pode rebrotar
  // posteriormente com a água e os nutrientes que voltam ao solo.
  cover[k]=clamp(cover[k]-press*.48,0,1);
 }
}
function clearLargeRocksFromTrails(){
 for(const mesh of rocks.children){
  const x=mesh.position.x,z=mesh.position.z,k=idx(x,z);
  if(Math.max(roadMask[k],animalTrail[k])>.22)mesh.visible=false;
 }
}
function trample(x,z,weight=.22){
 if(!trampleEnabled)return;
 markFootprint(x,z);
 // Formigas não morrem por pisoteio: total fixo de dez por colônia.
 stampTraffic(x,z,weight,false);
 // Atualização da malha é consolidada a cada passo da simulação.
 // Recalcular mais de 100 mil instâncias em CADA pegada travava o Android.
 grassRefreshRequested=true;
}
function registerAnimalFootfall(x,z,mass=1){
 // API para grandes animais que forem integrados no laboratório:
 // andar pela mata compacta terra; seguir uma trilha facilita o percurso.
 stampTraffic(x,z,clamp(mass*.22,.12,.68),true);
}
function movementCost(x,z){
 if(Math.abs(x)>W*.48||Math.abs(z)>L*.48)return 30;
 const k=idx(x,z),rock=rockPositions.some(p=>Math.hypot(p.x-x,p.z-z)<1.6);
 const slope=Math.abs(height(x+.35,z)-height(x-.35,z))+
             Math.abs(height(x,z+.35)-height(x,z-.35));
 return .85+cover[k]*.30+compaction[k]*.06+
  clamp(slope,0,3)*2+api.depth[k]*14+(rock?10:0)
  -clamp(Math.max(roadMask[k],animalTrail[k]),0,1)*.55;
}
function initializeLargeAnimalRoutes(){
 // Enquanto não há modelos 3D dos animais grandes, o trânsito é simulado
 // sem introduzir criaturas artificiais visíveis ao usuário.
 for(let i=0;i<6;i++){
  const x=(i-2.5)*W*.11,z=i%2?L*.12:-L*.12;
  largeAnimals.push({x,z,angle:random()*Math.PI*2,
   speed:.35+random()*.31,phase:random()*6.28,steps:0});
 }
}
function animateAnimalTrails(dt){
 if(!largeAnimals.length)return;
 for(const a of largeAnimals){
  a.steps++;
  const options=[-1.1,-.75,-.4,0,.4,.75,1.1];
  let best=null,cost=Infinity;
  for(const offset of options){
   const angle=a.angle+offset;
   const tx=a.x+Math.cos(angle)*1.1,tz=a.z+Math.sin(angle)*1.1;
   const score=movementCost(tx,tz)+Math.abs(offset)*.08+random()*.13;
   if(score<cost){cost=score;best=angle;}
  }
  if(best===null)continue;
  a.angle=best;
  const nx=clamp(a.x+Math.cos(a.angle)*a.speed*dt,-W*.46,W*.46);
  const nz=clamp(a.z+Math.sin(a.angle)*a.speed*dt,-L*.46,L*.46);
  if(Math.hypot(nx-a.x,nz-a.z)>.0001){
   a.x=nx;a.z=nz;
   stampTraffic(a.x,a.z,.095,true);
  }
 }
}
let ecologicalAccumulator=0,time=0,grassAccumulator=0,uiAccumulator=0;
function update(dt){
 if(!ready)return;
 dt=Math.min(dt,.09);time+=dt;ecologicalAccumulator+=ecologicalDayRate(dt);
 animateGrassVisuals(dt);
 wildfire?.update(dt,api.getMainCamera?.());
 // Queda de folhas desativada; manter apenas maturacao visual de frutos.
 animateFruits(dt);
 grassAccumulator+=dt;uiAccumulator+=dt;
 // Recarrega o rio somente pela fonte a montante, sem água infinita em toda a cena.
 if(grassAccumulator>.7){
  grassAccumulator=0;
  animateAnimalTrails(.7);
  if(api.getGraphicsQuality()!==lastGrassQuality)applyGrassQuality();
  updateFootprints();clearLargeRocksFromTrails();
  // Alimentação distribuída ao longo da entrada do canal.
  // A célula única forçada a 9 cm criava um disco azul desconectado no canto.
  // Adiciona pequenas parcelas sem substituir a profundidade existente.
  for(let entry=0;entry<7;entry++){
   const z=-7.26+entry*.17,x=riverX(z),k=idx(x,z);
   const water=(.0045-entry*.00035);
   if(water>0&&riverMask[k]>.36&&api.depth[k]<.06)
    api.depth[k]=Math.min(.06,api.depth[k]+water);
  }
  // Grama recupera volume somente com tempo sem novas passadas.
  // Não há fotossíntese, fertilidade, umidade ou química do solo nessa regra.
  const dtBio=.7;
  for(let cell=0;cell<cells;cell++){
   traffic[cell]=Math.max(0,traffic[cell]-.00085*dtBio);
   animalTrail[cell]=Math.max(0,animalTrail[cell]-.00075*dtBio);
   const wear=Math.max(traffic[cell],animalTrail[cell]);
   const normalized=clamp((wear-.18)/.65,0,1);
   roadMask[cell]=Math.max(fixedRoadMask[cell],normalized*normalized*(3-2*normalized));
   const p=position(cell);
   const permanent=fixedRoadMask[cell]>.06||nestBareMask[cell]>105||Math.abs(p.x-riverX(p.z))<3.1;
   const desired=permanent?0:clamp(1-roadMask[cell]*1.1,0,1);
   cover[cell]=permanent?0:clamp(cover[cell]+(desired-cover[cell])*.008,0,1);
  }
  if(grassRefreshRequested||grassAccumulator===0)grassRefreshRequested=false;
  updateGrassMeshes();
 }
 while(ecologicalAccumulator>1){lifeDay(1);ecologicalAccumulator-=1;if(nestCutGroup.visible)drawNestCutaway();}
 moveAnimals(time);
 if(uiAccumulator>1.4){uiAccumulator=0;hideDetachedAntModels();status();}
}
function status(){
 if(wildfire){
  const f=wildfire.status(),element=$('fireStatus');
  if(element)element.textContent='🔥 Fogo: '+f.burning+' células queimando · '
   +f.scorched+' marcadas/recuperando · chuva '+(api.getRainLevel?.()||0)
   +'/5 · vento controla a propagação. Braços e pontas da grama carbonizam.';
 }
 const workers=colonies.reduce((a,b)=>a+b.workers,0),eggs=colonies.reduce((a,b)=>a+b.brood.filter(g=>g.stage==='egg').reduce((sum,c)=>sum+c.count,0),0);
 const larva=colonies.reduce((a,b)=>a+b.brood.reduce((sum,c)=>sum+(c.stage==='larva'?c.count:0),0),0);
 const adults=0,cocoons=0;
 updateColonyInspector();
 const el=$('ecoStatus');if(el)el.textContent=
  grassDrawn+' tufos de grama ('+lastGrassQuality+') · '+colonies.length+' colônias · '+workers+' operárias · '+eggs+' ovos · '+larva+' larvas · somente busca de comida e retorno ao ninho. '+
  'É uma simulação ecológica simplificada; rainhas e crias ficam nos ninhos. Quase invisíveis fora da lupa.';
 const eventPanel=$('ecoEvents');if(eventPanel)eventPanel.textContent=ecoEvents.join('\n');
 const waterStatus=$('ecoWaterStatus');if(waterStatus)waterStatus.textContent=
  '💧 Solo: '+api.stats.infiltrated.toFixed(2)+' m³ infiltrados · '+
  api.stats.evaporated.toFixed(2)+' m³ evaporados · '+
  api.getWetArea().toFixed(1)+' m² de água visível · '+
  (api.deepWater.reduce((a,b)=>a+b,0)*dx*dz).toFixed(2)+' m³ no aquífero raso. '+
  'A precipitação contínua pode repor a água enquanto chove.';
 const fruitsStatus=$('ecoFruitStatus');if(fruitsStatus)fruitsStatus.textContent=
  '🍎 '+fruits.length+' frutas · verdes '+fruits.filter(f=>f.stage==='green').length+
  ' · maduras '+fruits.filter(f=>f.stage==='ripe').length+
  ' · podres '+fruits.filter(f=>f.stage==='rotten').length+
  ' · caídas '+fruitFallen+' · adubo '+fruitNutrients.toFixed(3)+' u';
 const leaves=$('ecoLeafStatus');
 if(leaves)leaves.textContent=
  '🍂 '+fallingLeaves.length+' folhas 3D na cena · '+leafCollected.toFixed(3)+
  ' u recolhidas por formigas · '+leafDeposited.toFixed(3)+
  ' u transformadas em nutrientes · '+antsCrushed+' formigas esmagadas · '+
  antsDrowned+' perdidas na chuva · minhocas removidas';
}
const nestCutGroup=new T.Group();
nestCutGroup.name='Raio-X das galerias do formigueiro';
nestCutGroup.visible=false;realm.add(nestCutGroup);
let undergroundAgents=null,undergroundQueen=null;
function drawNestCutaway(){
 undergroundAgents=null;undergroundQueen=null;
 for(const mesh of [...nestCutGroup.children]){
  nestCutGroup.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();
 }
 const id=Number($('ecoColonySelect')?.value||0),c=colonies.find(x=>x.id===id);
 if(!c||!c.subterranean)return;
 const points=[],y=height(c.x,c.z);
 const entrance=new T.Vector3(c.x,y-.02,c.z);
 let previous=entrance;
 // Corte com corredores verticais ligados às quatro profundidades físicas.
 for(const [index,layer] of c.subterranean.entries()){
  const depth=layer.depth;
  const trunk=new T.Vector3(c.x,y-depth,c.z);
  if(index===0||layer.chambers>0){
   points.push(previous,trunk);previous=trunk;
  }
  for(let chamber=0;chamber<layer.chambers;chamber++){
   const side=chamber%2?1:-1;
   const angle=chamber*2.1+index*.6;
   const span=.19+Math.min(.53,c.tunnels*.07)+chamber*.045;
   const room=new T.Vector3(c.x+Math.cos(angle)*span*side,
    y-depth,c.z+Math.sin(angle)*span*side);
   const wall=room.clone().add(new T.Vector3(.075,0,.10));
   points.push(trunk,room,room,wall);
  }
 }
 if(points.length){
  const geo=new T.BufferGeometry().setFromPoints(points);
  const mat=new T.LineBasicMaterial({color:'#dda970',transparent:true,
   opacity:.85,depthTest:false,depthWrite:false});
  const lines=new T.LineSegments(geo,mat);lines.renderOrder=20;
  nestCutGroup.add(lines);
 }
 // Indivíduos diminutos circulam ENTRE camadas/câmaras. Renderização
 // somente no raio-X para não onerar o Android durante o jogo normal.
 if(meshLibrary.ant1&&c.workers>0){
  const geo=compactAntGeometry(),mat=new T.MeshBasicMaterial({
   color:'#b28c56',depthTest:false,depthWrite:false,side:T.DoubleSide});
  const m=new T.InstancedMesh(geo,mat,12);
  m.name='Operárias movendo-se entre câmaras subterrâneas';
  m.frustumCulled=false;m.renderOrder=22;nestCutGroup.add(m);
  undergroundAgents={mesh:m,colony:c};
 }
 if(c.queen){
  const q=new T.Mesh(new T.SphereGeometry(.025,8,6),
   new T.MeshBasicMaterial({color:'#e6ac73',depthTest:false,depthWrite:false}));
  q.position.set(c.x,y-c.queenDepth,c.z);
  q.renderOrder=23;nestCutGroup.add(q);undergroundQueen=q;
 }
 // O raio-X só existe quando solicitado; no cenário normal tudo fica
 // sob o solo, com operárias emergindo exclusivamente pela entrada.
 nestCutGroup.visible=!!$('ecoBurrows')?.checked;
}
function animateUndergroundWorkers(t){
 if(!nestCutGroup.visible||!undergroundAgents)return;
 const {mesh,colony:c}=undergroundAgents;
 const o=new T.Object3D(),y=height(c.x,c.z);
 let count=0;
 for(let i=0;i<12;i++){
  const layerIndex=1+i%3,layer=c.subterranean[layerIndex];
  if(!layer||layer.chambers===0)continue;
  const speed=t*.5+i*.8,offset=.09+Math.sin(speed)*.12;
  const angle=i*2.399+Math.sin(t*.4+i)*.3;
  o.position.set(c.x+Math.cos(angle)*offset,y-layer.depth,
   c.z+Math.sin(angle)*offset);
  o.rotation.set(0,angle+Math.PI*.5,0);
  o.scale.setScalar(Math.min(.014*previewMagnification,.056));o.updateMatrix();
  mesh.setMatrixAt(count++,o.matrix);
 }
 mesh.count=count;mesh.instanceMatrix.needsUpdate=true;
 if(undergroundQueen)undergroundQueen.position.set(c.x,y-c.queenDepth,c.z);
}
function updateColonyInspector(){
 const select=$('ecoColonySelect'),panel=$('ecoColonyDetails');
 if(!select||!panel)return;
 const prior=select.value;
 if(select.options.length!==colonies.length){
  select.textContent='';
  for(const c of colonies){
   const option=document.createElement('option');
   option.value=String(c.id);option.textContent='Colônia '+(c.id+1);
   select.appendChild(option);
  }
  select.value=colonies.some(c=>String(c.id)===prior)?prior:String(colonies[0]?.id??0);
 }
 const c=colonies.find(c=>String(c.id)===select.value);if(!c)return;
 const stages={egg:0,larva:0,pupa:0};
 for(const brood of c.brood)stages[brood.stage]+=brood.count;
 panel.textContent='👑 Rainha '+(c.queen?'viva, fértil':'ausente')+
  ' · alimento '+c.food.toFixed(1)+' · '+c.workers+' operárias: '+
  c.foragers+' coletoras, '+c.scouts+' exploradoras, '+c.nurses+
  ' cuidadoras, '+c.builders+' escavadoras, '+c.guards+' guardas'+
  ' · '+stages.egg+' ovos, '+stages.larva+' larvas, '+stages.pupa+
  ' pupas · '+c.tunnels.toFixed(2)+' m de túneis · '+c.chambers+
  ' câmaras · rainha a '+c.queenDepth.toFixed(2)+' m · 4 níveis de solo'+
 ' · feromônios '+c.pheromones.reduce((a,v)=>a+v,0).toFixed(1);
}
async function setup(){
 await loadMeshes();initializeLandscape();initialColonies();
 // V12.61: o plantio das ~2 milhões de plantas é assíncrono.
 // Antes, a animação só começava depois do plantio completo: enquanto
 // apareciam os primeiros setores, o vento e o contato ficavam congelados.
 // Rodar os uniformes GPU desde o primeiro setor, sem antecipar a física
 // ecológica para não mudar o desenvolvimento do solo.
 let sceneReady=false,lastFrame=performance.now();
 function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.09,Math.max(0,(now-lastFrame)/1000));
  lastFrame=now;
  if(document.hidden)return;
  if(sceneReady)update(dt);
  else animateGrassVisuals(dt);
 }
 requestAnimationFrame(frame);
 await grassShape();rockShape();setupLeafVisuals();setupFruits();visualizeAnimals();initializeLargeAnimalRoutes();
 drawNestCutaway();hideDetachedAntModels();
 const board=$('ecoStatus');if(board)board.textContent='Pacotes enviados integrados: '+Object.keys(meshLibrary).length+' malhas · '+colonies.length+' colônias.';
 const s=$('ecoSpeed');if(s){s.oninput=e=>{biologicalSpeed=clamp(+e.target.value,1,200);$('ecoSpeedVal').textContent=biologicalSpeed+'×';};}
 const mag=$('ecoMagnify');if(mag)mag.onchange=e=>{previewMagnification=e.target.checked?4:1;};
 const sim=$('ecoTraffic');if(sim)sim.onclick=()=>{
  // Cada passada humana deixa pressão onde o pé efetivamente tocou.
  for(let pass=0;pass<4;pass++)for(let i=0;i<105;i++){
   const x=-W*.23+i*W*.46/104;
   trample(x,roadZ(x)+(random()-.5)*.16,.22);
  }
  recordEcoEvent('Passadas humanas compactaram o solo e reduziram o capim.');
  status();
 };
 const animalButton=$('ecoAnimalTrailTest');
 if(animalButton)animalButton.onclick=()=>{
  // Trilhas novas fora do caminho original: caminho formado apenas por
  // repetição de passos, nunca por um plano sobreposto.
  for(let pass=0;pass<6;pass++)for(let i=0;i<130;i++){
   const x=-W*.30+i*W*.60/129;
   const z=9.5+Math.sin(x*.10)*2.1;
   registerAnimalFootfall(x,z,.95);
  }
  recordEcoEvent('Trilha de animais grandes formada por trânsito repetido.');
  clearLargeRocksFromTrails();updateGrassMeshes();status();
 };
 const regrowButton=$('ecoRegrowTest');
 if(regrowButton)regrowButton.onclick=()=>{
  const living=largeAnimals.splice(0);
  // Sem tráfego por 90 dias: estrada vai sendo tomada pelo gramado.
  lifeDay(90);
  largeAnimals.push(...living);
  recordEcoEvent('Área sem novas passadas por 90 dias: grama e solo se recuperam.');
  updateGrassMeshes();status();
 };
 const colonySelect=$('ecoColonySelect');if(colonySelect)colonySelect.onchange=()=>{updateColonyInspector();drawNestCutaway();};
 const cut=$('ecoBurrows');if(cut)cut.onchange=()=>{drawNestCutaway();nestCutGroup.visible=cut.checked;};
 const feed=$('ecoFeedColony');if(feed)feed.onclick=()=>{
  const id=Number($('ecoColonySelect')?.value||0);
  const c=colonies.find(x=>x.id===id);if(!c)return;
  // Resíduos orgânicos alimentam microrganismos e as forrageadoras reais.
  for(let j=-4;j<=4;j++)for(let i=-4;i<=4;i++){
   const x=clamp(c.x+i*dx,-W*.48,W*.48),z=clamp(c.z+j*dz,-L*.48,L*.48);
   const k=idx(x,z),dist=Math.hypot(i,j);
   if(dist<1||dist>5||api.depth[k]>.07)continue;
   api.soilLitter[k]=clamp(api.soilLitter[k]+.035/(1+dist),0,1.8);
  }
  status();
 };
 const advance=$('ecoAdvance');if(advance)advance.onclick=()=>{
  for(let d=0;d<30;d++)lifeDay(1);
  if(nestCutGroup.visible)drawNestCutaway();
  status();
 };
 const igniteButton=$('fireIgnite');
 if(igniteButton)igniteButton.onclick=()=>{
  if(!wildfire)return;
  // O teste usa uma clareira com grama real em vez da estrada/água.
  const p=api.getGrassPlayer?.()?.position;
  const center=p?{x:p.x,z:p.z}:{x:7,z:6};
  let ignited=false;
  for(const [x,z] of [[0,1.8],[2,2],[3,-2],[-2,3],[4,4],[6,0],[-4,-3]]){
   ignited=wildfire.ignite(center.x+x,center.z+z,1.6,.94)||ignited;
  }
  if(!ignited)recordEcoEvent('Fogo impedido por água, vegetação ausente ou solo muito úmido.');
  else recordEcoEvent('🔥 Queimada iniciada: grama aquece, escurece e reage ao vento e à chuva.');
  status();
 };
 const extinguishButton=$('fireExtinguish');
 if(extinguishButton)extinguishButton.onclick=()=>{
  wildfire?.quench();recordEcoEvent('💧 Chamas apagadas; carvão permanece até a regeneração.');
  status();
 };
 // V12.68: carregar manualmente o GLB CC0 baixado no Poly Pizza.
 // Os arquivos de modelos não passam pela rede nem substituem texturas
 // da grama: apenas 12–24 instâncias visuais dos focos usam o GLB.
 const fireModelInput=$('fireGLBModel');
 if(fireModelInput)fireModelInput.addEventListener('change',async()=>{
  const file=fireModelInput.files?.[0],out=$('fireGLBStatus');
  if(!file||!wildfire)return;
  if(out)out.textContent='Importando modelo 3D de fogo...';
  try{
   const meta=await wildfire.importFireGLB(file);
   if(out)out.textContent='Fogo GLB ativo · '+meta.objects+
    ' focos simultâneos · '+meta.triangles+' triângulos por modelo';
   recordEcoEvent('🔥 Modelo de fogo GLB integrado aos focos de incêndio.');
  }catch(error){
   if(out)out.textContent='Falha no GLB: '+error.message+
    ' · a chama animada padrão continua funcionando';
   console.warn('[Arcano] Fogo GLB:',error);
  }finally{fireModelInput.value='';}
 });
 const fireModelReset=$('fireGLBReset');
 if(fireModelReset)fireModelReset.onclick=()=>{
  wildfire?.clearImportedFire();
  const out=$('fireGLBStatus');
  if(out)out.textContent='Chama animada padrão restaurada';
 };
 const dryTest=$('ecoDryTest');if(dryTest)dryTest.onclick=()=>{
  api.setRainLevel(0);
  recordEcoEvent('Teste de secagem iniciado: chuva parada; a poça infiltra e evapora.');
  status();
 };
 const fruitTest=$('ecoFruitTest');if(fruitTest)fruitTest.onclick=()=>{
  for(let i=0;i<14;i++)spawnFruit(true);
  recordEcoEvent('Maçãs geradas: amadurecimento, queda e decomposição.');
  status();
 };
 const leafTest=$('ecoLeafTest');
 if(leafTest)leafTest.onclick=()=>{
  // Folhas caindo foram desativadas para reduzir custo visual e de física.
  recordEcoEvent('A simulação de folhas caindo está desativada.');
  status();
 };
 const organic=$('ecoCarcass');if(organic)organic.onclick=()=>{
  addCarcass(4,3,.16);addCarcass(-5,-2,.10);status();
 };
 const toggle=$('ecoToggle');if(toggle)toggle.onchange=e=>{
  realm.visible=e.target.checked;
  window.arcanoEcoV1232.active=e.target.checked;
  api.stones.visible=!e.target.checked;
  // Desativar a ecologia não ressuscita os cones triangulares antigos.
  if(api.grass){api.grass.visible=false;api.grass.count=0;}
 };
 const original=api.grass;if(original){original.visible=false;original.count=0;}
 for(const obj of targetNativeGrass)obj.obj.visible=false;
 window.arcanoEcoV1232={active:true,cover,traffic,roadMask,animalTrail,riverMask,nestBareMask,colonies,
  registerAnimalFootfall,movementCost,largeAnimals,
  trample,addCarcass,update,status,api,ready:()=>ready,setMagnification:n=>previewMagnification=n,
  getColony:id=>colonies.find(c=>c.id===id),getWorms:()=>[],inspectColony:updateColonyInspector,
  getWildfire:()=>wildfire,
  igniteGrass:(x,z,radius=1.35)=>wildfire?.ignite(x,z,radius)||false,
  extinguishFire:()=>wildfire?.quench(),
  getGrassMotionState:()=>({chunks:grassChunkMeshes.size,tufts:grassDrawn,
   wind:grassVisual.uniforms.uArcWindStrength.value,
   time:grassVisual.uniforms.uArcWindTime.value,
   contact:grassVisual.uniforms.uArcPlayer.value.w,
   playerX:grassVisual.uniforms.uArcPlayer.value.x,
   playerZ:grassVisual.uniforms.uArcPlayer.value.y}),
  events:ecoEvents,getDays:()=>ecologicalDays};
 sceneReady=true;
 status();
}
setup().catch(e=>{
 console.error('[Arcano V12.32] falha ao inicializar ecossistema:',e);
 const el=$('ecoStatus');if(el)el.textContent='Falha no carregamento de modelos: '+(e.message||e);
});
})();