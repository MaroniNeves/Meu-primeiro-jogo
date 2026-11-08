/* Grama e terra no estilo anime (inspirado em Genshin Impact).
   - Grama: degradê da base escura até pontas verde-amareladas e manchas
     grandes de cor pelo mapa, como os campos pintados de Mondstadt.
   - Terra: paleta quente de 3 tons (siena, areia e creme) com manchas
     pintadas à mão; gramado do chão no mesmo verde vivo da grama.
   Só acrescenta código aos shaders existentes: vento, fogo, pegadas e
   cel-shading continuam funcionando. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;

const NOISE=`
float animeHash(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453);}
float animeNoise(vec2 p){
 vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(animeHash(i),animeHash(i+vec2(1,0)),f.x),
  mix(animeHash(i+vec2(0,1)),animeHash(i+vec2(1,1)),f.x),f.y);
}
float animeFbm(vec2 p){return animeNoise(p)*.55+animeNoise(p*2.3+7.1)*.3+animeNoise(p*5.1-3.7)*.15;}
vec3 animeLin(vec3 c){return pow(c,vec3(2.2));}
`;

/* ---------- Grama ---------- */
const GRASS_KEY='anime-grass-v1';
function patchGrass(material){
 if(material.userData.animeGrass)return;
 material.userData.animeGrass=true;
 material.defines=Object.assign({},material.defines,{ANIME_NO_RIM:""});
 const previous=material.onBeforeCompile;
 material.onBeforeCompile=function(shader,r){
  if(previous)previous.call(this,shader,r);
  if(!shader.vertexShader.includes('uArcGrassBase'))return;
  shader.vertexShader='varying float vAnimeTip;\nvarying vec2 vAnimeRoot;\n'+shader.vertexShader.replace(
   '#include <begin_vertex>',
   `#include <begin_vertex>
   vAnimeTip=clamp((position.y-uArcGrassBase)*uArcGrassInvHeight,0.0,1.0);
   #ifdef USE_INSTANCING
    vAnimeRoot=instanceMatrix[3].xz;
   #else
    vAnimeRoot=(modelMatrix*vec4(position,1.0)).xz;
   #endif`);
  shader.fragmentShader='varying float vAnimeTip;\nvarying vec2 vAnimeRoot;\n'+NOISE+shader.fragmentShader.replace(
   '#include <color_fragment>',
   `#include <color_fragment>
   {
    float tex=dot(diffuseColor.rgb,vec3(.299,.587,.114));
    // Manchas grandes de cor espalhadas pelo campo.
    float patchA=animeFbm(vAnimeRoot*.07);
    float patchB=animeNoise(vAnimeRoot*.21+3.3);
    vec3 baseC=animeLin(vec3(.18,.43,.22));
    vec3 midC=mix(animeLin(vec3(.40,.71,.27)),animeLin(vec3(.33,.66,.36)),patchB);
    vec3 tipC=mix(animeLin(vec3(.78,.90,.38)),animeLin(vec3(.62,.86,.42)),patchA);
    float h=smoothstep(0.,1.,vAnimeTip);
    vec3 grass=mix(baseC,midC,smoothstep(.0,.55,h));
    grass=mix(grass,tipC,smoothstep(.55,1.,h));
    // Variação amarelada e leve, como flores-do-campo ao sol.
    grass=mix(grass,animeLin(vec3(.86,.88,.42)),smoothstep(.68,.86,patchA)*h*.45);
    // Mantém só um pouco do detalhe da textura original.
    grass*=mix(1.,clamp(tex*2.2,.75,1.2),.25);
    diffuseColor.rgb=grass*.80;
   }`);
 };
 const baseKey=material.customProgramCacheKey;
 material.customProgramCacheKey=function(){return (baseKey?baseKey.call(this):'')+GRASS_KEY;};
 material.needsUpdate=true;
}

/* ---------- Terra ---------- */
const LAND_KEY='anime-land-v2';
// Relógio das cáusticas no fundo do rio.
const landTime={value:0};
(function tick(t){landTime.value=t/1000;requestAnimationFrame(tick);})(0);
const CAUSTIC=`
uniform float uAnimeTime;
vec2 animeHash2(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return fract(sin(p)*43758.5453);}
float animeCaustic(vec2 p,float t){
 vec2 n=floor(p),f=fract(p);float d1=8.,d2=8.;
 for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
  vec2 g=vec2(float(i),float(j));vec2 o=animeHash2(n+g);o=.5+.45*sin(t+6.2831*o);
  float d=length(g+o-f);
  if(d<d1){d2=d1;d1=d;}else if(d<d2)d2=d;
 }
 return 1.-smoothstep(.0,.12,d2-d1);
}
// Cáusticas orgânicas (padrão iterativo clássico, fios curvos sem cantos).
float animeWaterCaustic(vec2 p,float t){
 vec2 q=mod(p,6.2831853)-250.;vec2 i=q;float c=1.;float inten=.005;
 for(int n=0;n<4;n++){
  float tt=t*(1.-(3.5/float(n+1)));
  i=q+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));
  c+=1./length(vec2(q.x/(sin(i.x+tt)/inten),q.y/(cos(i.y+tt)/inten)));
 }
 c/=4.;c=1.17-pow(c,1.4);
 return clamp(pow(abs(c),8.),0.,1.);
}
// Versão suave para a luz no fundo d'água (borda larga, sem "rachaduras").
float animeCausticSoft(vec2 p,float t){
 vec2 n=floor(p),f=fract(p);float d1=8.,d2=8.;
 for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
  vec2 g=vec2(float(i),float(j));vec2 o=animeHash2(n+g);o=.5+.45*sin(t+6.2831*o);
  float d=length(g+o-f);
  if(d<d1){d2=d1;d1=d;}else if(d<d2)d2=d;
 }
 float e=1.-smoothstep(.0,.38,d2-d1);return e*e;
}
`;
function patchLand(material){
 if(material.userData.animeLand)return;
 material.userData.animeLand=true;
 material.defines=Object.assign({},material.defines,{ANIME_NO_RIM:""});
 const previous=material.onBeforeCompile;
 material.onBeforeCompile=function(shader,r){
  if(previous)previous.call(this,shader,r);
  shader.vertexShader='attribute float animeGreen;\nattribute vec2 animeShore;\nvarying vec2 vAnimeShore;\nvarying float vAnimeGreen;\nvarying float vAnimeUpN;\nvarying vec3 vAnimeWorld;\n'+shader.vertexShader.replace(
   '#include <begin_vertex>',
   '#include <begin_vertex>\n vAnimeWorld=(modelMatrix*vec4(transformed,1.0)).xyz;\n vAnimeGreen=animeGreen;\n vAnimeShore=animeShore;\n vAnimeUpN=normalize(normal).y;');
  shader.uniforms.uAnimeTime=landTime;
  shader.fragmentShader='varying float vAnimeUpN;\nvarying vec2 vAnimeShore;\nvarying float vAnimeGreen;\nvarying vec3 vAnimeWorld;\n'+NOISE+CAUSTIC+shader.fragmentShader.replace(
   '#include <color_fragment>',
   `#include <color_fragment>
   {
    vec3 c=diffuseColor.rgb;
    float lum=dot(c,vec3(.299,.587,.114));
    vec2 w=vAnimeWorld.xz;
    float big=animeFbm(w*.06);
    float small=animeNoise(w*.9);
    // Quanto do pixel é gramado (o mapa original pinta o verde nas cores do vértice).
    // Faixa larga + ruído: o gramado vai sumindo em degradê irregular na terra.
    // Verde suavizado na CPU (~2 m): o gramado some aos poucos na terra.
    float green=smoothstep(.12,.88,vAnimeGreen+(animeFbm(w*.45)-.5)*.30);
    // Terra: rampa de 3 tons quentes, suavizada como pintura.
    float t=clamp(lum*3.2+(big-.5)*.55+(small-.5)*.10,0.,1.);
    vec3 dirtDark=animeLin(vec3(.58,.44,.33));
    vec3 dirtMid=animeLin(vec3(.80,.68,.50));
    vec3 dirtLight=animeLin(vec3(.92,.85,.68));
    vec3 dirt=mix(dirtDark,dirtMid,smoothstep(.18,.42,t));
    dirt=mix(dirt,dirtLight,smoothstep(.62,.86,t));
    // Gramado do chão: verde suave e um pouco dessaturado, perto da base dos tufos.
    vec3 lawnA=animeLin(vec3(.42,.60,.31)),lawnB=animeLin(vec3(.52,.68,.36));
    vec3 lawn=mix(lawnA,lawnB,smoothstep(.3,.8,big));
    lawn=mix(lawn,animeLin(vec3(.36,.54,.30)),smoothstep(.6,.9,small)*.2);
    // Na transição o verde se mistura à terra (tom oliva) antes de sumir.
    vec3 edgeTone=mix(dirtMid,lawnA,.45);
    float g1=smoothstep(.0,.55,green),g2=smoothstep(.45,1.,green);
    vec3 outC=mix(dirt,edgeTone,g1);
    outC=mix(outC,lawn,g2);
    // Partes úmidas/escuras (barro do rio) continuam mais escuras.
    float wet=1.-smoothstep(.05,.16,lum);
    outC*=mix(1.,.80,wet*(1.-green));
    // ---------- Margens do rio ----------
    // x = distância até a borda da água (m, negativo = dentro), y = altura acima da água.
    float sd=vAnimeShore.x,hw=vAnimeShore.y;
    if(sd<9.){
     // Leito submerso: tons frios e escuros, com manchas.
     float under=(1.-smoothstep(-.04,.02,hw))*(1.-smoothstep(.3,.8,sd));
     vec3 bed=mix(animeLin(vec3(.50,.46,.36)),animeLin(vec3(.32,.38,.34)),smoothstep(.0,1.2,-hw));
     outC=mix(outC,bed*(.85+.3*big),under);
     // Cáusticas: redes de luz dançando no leito, só debaixo d'água.
     // Areia do leito com marcas de ondulação da correnteza.
     float rip=sin(dot(w,vec2(.35,.94))*7.5+animeNoise(w*1.3)*4.)*.5+.5;
     outC*=mix(1.,.90+.14*rip,under);
     // Cáusticas suaves: duas camadas distorcidas, combinadas pelo mínimo
     // (a luz forma manchas e fios ondulando, não uma rede rígida).
     float caus=animeWaterCaustic(w*1.6,uAnimeTime*.55+23.);
     caus=caus*.85+animeWaterCaustic(w*2.7+1.7,uAnimeTime*.4+11.)*.35;
     outC+=animeLin(vec3(.85,1.,.95))*caus*under*.30*(1.-smoothstep(.8,3.5,-hw));
     // Areia molhada logo acima da linha d'água.
     float wetSand=(1.-smoothstep(.0,.55,sd))*(1.-smoothstep(.06,.30,hw))*(1.-under);
     outC=mix(outC,animeLin(vec3(.66,.55,.42)),wetSand*.6);
     // Faixa de cascalho e seixos arredondados.
     float gravel=smoothstep(.1,.6,sd)*(1.-smoothstep(1.8,3.2,sd))*(1.-smoothstep(.9,1.6,hw));
     // Pedrinhas irregulares (forma deformada por ruído, tamanhos e tons variados).
     vec2 gp=w*5.3+vec2(animeNoise(w*1.7),animeNoise(w*1.7+4.))*.6;vec2 cellId=floor(gp);
     vec2 o=vec2(animeHash(cellId+3.1),animeHash(cellId+7.7))*.5+.25;
     vec2 q=fract(gp)-o;float ang=animeHash(cellId+9.)*6.283;q=mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*q;
     q*=vec2(1.,1.3+animeHash(cellId+2.)*.9);
     float rad=(.10+.13*animeHash(cellId+1.9))*(1.+.35*(animeNoise(q*9.+cellId)-.5));
     float pebble=step(.58,animeHash(cellId))*smoothstep(rad,rad-.04,length(q));
     vec3 pebC=mix(animeLin(vec3(.58,.55,.50)),animeLin(vec3(.72,.66,.56)),animeHash(cellId+5.));
     pebC*=.85+.3*smoothstep(-.05,.08,q.y); // topo mais claro, base mais escura
     outC=mix(outC,mix(animeLin(vec3(.70,.62,.50)),outC,.4),gravel*.6);
     outC=mix(outC,pebC*(.9+.2*small),pebble*gravel*.85);
    }
    // ---------- Penhascos: encostas íngremes viram rocha em camadas ----------
    float cliff=1.-smoothstep(.50,.78,vAnimeUpN+(small-.5)*.12);
    if(cliff>.001){
     float layer=fract(vAnimeWorld.y*1.6+animeNoise(w*.8)*.6);
     vec3 rockA=animeLin(vec3(.60,.58,.56)),rockB=animeLin(vec3(.47,.46,.48)),rockC=animeLin(vec3(.70,.67,.62));
     vec3 cliffC=mix(rockB,rockA,smoothstep(.15,.35,layer));
     cliffC=mix(cliffC,rockC,smoothstep(.75,.9,layer)*.7);
     cliffC*=.85+.3*animeNoise(vec2(w.x+w.y,vAnimeWorld.y)*2.3);
     outC=mix(outC,cliffC,cliff);
    }
    diffuseColor.rgb=outC*.78;
   }`);
 };
 const baseKey=material.customProgramCacheKey;
 material.customProgramCacheKey=function(){return (baseKey?baseKey.call(this):'')+LAND_KEY;};
 material.needsUpdate=true;
}

/* ---------- Pedras ---------- */
// Cinza-azulado nas laterais, topo claro com musgo e contorno escuro.
const ROCK_KEY='anime-rock-v2';
const ROCK_NAME=/pedra|pedrinha|rock|seixo|stone/i;
// Grupos cujos filhos (às vezes sem nome) são pedras.
const ROCK_GROUP=/pedra original|rochas|rocks.fbx|pedras do leito|leito do rio/i;
const rockOutline=new T.MeshBasicMaterial({color:'#2b2140',side:T.BackSide});
function patchRock(material){
 if(material.userData.animeRock)return;
 if(!material.isMeshStandardMaterial&&!material.isMeshToonMaterial&&!material.isMeshLambertMaterial)return;
 material.userData.animeRock=true;
 const previous=material.onBeforeCompile;
 material.onBeforeCompile=function(shader,r){
  if(previous)previous.call(this,shader,r);
  if(!shader.vertexShader.includes('#include <defaultnormal_vertex>'))return;
  shader.vertexShader='varying float vAnimeUp;\nvarying vec3 vAnimeWorld;\n'+shader.vertexShader
   .replace('#include <defaultnormal_vertex>',
    `#include <defaultnormal_vertex>
    {
     vec3 animeN=objectNormal;
     #ifdef USE_INSTANCING
      animeN=mat3(instanceMatrix)*animeN;
     #endif
     vAnimeUp=normalize(mat3(modelMatrix)*animeN).y;
    }`)
   .replace('#include <begin_vertex>',
    `#include <begin_vertex>
    {
     vec4 animeW=vec4(transformed,1.0);
     #ifdef USE_INSTANCING
      animeW=instanceMatrix*animeW;
     #endif
     vAnimeWorld=(modelMatrix*animeW).xyz;
    }`);
  shader.uniforms.uAnimeTime=landTime;
  shader.fragmentShader='varying float vAnimeUp;\nvarying vec3 vAnimeWorld;\n'+NOISE+CAUSTIC+shader.fragmentShader.replace(
   '#include <color_fragment>',
   `#include <color_fragment>
   {
    vec3 wp=vAnimeWorld;
    float tex=dot(diffuseColor.rgb,vec3(.299,.587,.114));
    float n=animeFbm(wp.xz*1.3+wp.y*.7);
    float up=vAnimeUp+(n-.5)*.35;
    vec3 darkC=animeLin(vec3(.36,.39,.47)),sideC=animeLin(vec3(.55,.58,.63));
    vec3 topC=animeLin(vec3(.74,.76,.74)),moss=animeLin(vec3(.46,.60,.31));
    vec3 rock=mix(darkC,sideC,smoothstep(-.35,.15,up));
    rock=mix(rock,topC,smoothstep(.45,.70,up));
    // Textura pintada: grão fino em 3 planos, camadas, rachaduras e líquen.
    float grain=animeNoise(wp.xz*9.+wp.y*3.)*.4+animeNoise(wp.xy*12.)*.3+animeNoise(wp.zy*12.)*.3;
    float coarse=animeFbm(wp.xz*3.1+wp.y*2.2);
    rock*=.78+.32*grain+.18*(coarse-.5);
    float strata=smoothstep(.42,.5,fract(wp.y*2.6+coarse*.9))*(1.-smoothstep(.5,.58,fract(wp.y*2.6+coarse*.9)));
    rock*=1.-strata*.14*(1.-smoothstep(.4,.8,up));
    float crack=animeCaustic(wp.xz*1.6+vec2(wp.y*.9,-wp.y*.5),0.);
    crack*=smoothstep(.45,.65,animeFbm(wp.xz*.9+5.3));
    rock=mix(rock,rock*.45,crack*.85);
    float lichen=smoothstep(.62,.80,animeFbm(wp.xz*2.4+wp.y*1.1+9.1));
    rock=mix(rock,mix(moss,animeLin(vec3(.80,.78,.55)),animeNoise(wp.xz*6.)),lichen*.35*smoothstep(-.2,.4,up));
    rock=mix(rock,moss*(.85+.3*grain),smoothstep(.72,.92,up)*.65);
    rock*=mix(1.,clamp(tex*2.,.8,1.15),.2);
    diffuseColor.rgb=rock*.85;
   }`);
 };
 const baseKey=material.customProgramCacheKey;
 material.customProgramCacheKey=function(){return (baseKey?baseKey.call(this):'')+ROCK_KEY;};
 material.needsUpdate=true;
}
function isRock(o){
 if(o.name&&ROCK_NAME.test(o.name))return true;
 for(let p=o.parent;p&&!p.isScene;p=p.parent)if(p.name&&ROCK_GROUP.test(p.name))return true;
 return false;
}
function addRockOutline(mesh){
 return; // Sem contorno nas pedras: parecia uma sombra errada. Só a sombra do sol.
 if(mesh.isInstancedMesh||mesh.isSkinnedMesh||mesh.userData.animeRockOutline||mesh.userData.animeOutline)return;
 mesh.userData.animeRockOutline=true;
 const g=mesh.geometry;if(!g.boundingSphere)g.computeBoundingSphere();
 const s=1.045,shell=new T.Mesh(g,rockOutline);
 shell.scale.setScalar(s);
 shell.position.copy(g.boundingSphere.center).multiplyScalar(1-s);
 shell.userData.animeOutline=true;shell.castShadow=false;shell.receiveShadow=false;
 mesh.add(shell);
}

/* ---------- Altura e tipo de chão (para a casa e as árvores) ---------- */
function makeGroundHelper(land){
 const pos=land.geometry.attributes.position,col=land.geometry.attributes.color;
 const n=pos.count,z0=pos.getZ(0);
 let nxCount=1;while(nxCount<n&&Math.abs(pos.getZ(nxCount)-z0)<1e-6)nxCount++;
 const nzCount=Math.round(n/nxCount);
 const x0=pos.getX(0),x1=pos.getX(nxCount-1),zA=z0,zB=pos.getZ((nzCount-1)*nxCount);
 const cell=(x,z)=>{
  const fi=(x-x0)/(x1-x0)*(nxCount-1),fj=(z-zA)/(zB-zA)*(nzCount-1);
  return [Math.max(0,Math.min(nxCount-2,Math.floor(fi))),Math.max(0,Math.min(nzCount-2,Math.floor(fj))),fi,fj];
 };
 function bilinear(get,x,z){
  const [i,j,fi,fj]=cell(x,z),u=Math.min(1,Math.max(0,fi-i)),v=Math.min(1,Math.max(0,fj-j));
  const k=j*nxCount+i;
  return get(k)*(1-u)*(1-v)+get(k+1)*u*(1-v)+get(k+nxCount)*(1-u)*v+get(k+nxCount+1)*u*v;
 }
 return {
  bounds:{x0:Math.min(x0,x1),x1:Math.max(x0,x1),z0:Math.min(zA,zB),z1:Math.max(zA,zB)},
  heightAt:(x,z)=>bilinear(k=>pos.getY(k),x,z),
  // >0 onde o chão é gramado (verde predominante nas cores do terreno).
  greenAt:(x,z)=>col?bilinear(k=>col.getY(k)-Math.max(col.getX(k),col.getZ(k)),x,z):0,
  // Longe do rio e da estrada de terra.
  isOpen(x,z,margin=0){
   const river=window.arcanoRiverProfile;
   if(river&&river.center){
    const half=(typeof river.halfWidth==='function'?river.halfWidth(z):river.halfWidth)||3;
    const bank=(typeof river.bankWidth==='function'?river.bankWidth(z):river.bankWidth)||2;
    if(Math.abs(x-river.center(z))<half+bank+2.5+margin)return false;
   }
   const roadZ=.92-.70*Math.sin(x*.47+.6)+.17*Math.sin(x*1.34);
   if(Math.abs(z-roadZ)<2.4+margin)return false;
   return true;
  }
 };
}

/* ---------- Verde suavizado do chão ---------- */
// As cores do terreno mudam de uma vez entre pontos vizinhos da malha (~45 cm).
// Aqui o "quanto é gramado" é borrado por ~2 m e guardado num atributo,
// para o gramado se dissolver em degradê largo na terra.
function updateGreenAttribute(land){
 const geo=land.geometry,pos=geo.attributes.position,col=geo.attributes.color;
 if(!col)return;
 // Calculado UMA vez. O jogo repinta o chão a cada passo (marcas na estrada);
 // recalcular aqui travava o jogo a cada 2,5 s e o personagem "teleportava".
 if(geo.attributes.animeGreen)return;
 const n=pos.count,z0=pos.getZ(0);
 let nx=1;while(nx<n&&Math.abs(pos.getZ(nx)-z0)<1e-6)nx++;
 const nz=Math.round(n/nx);
 let a=new Float32Array(n),b=new Float32Array(n);
 // Distância até a água e altura acima dela (para areia molhada, cascalho e
 // grama nas encostas). Calculado uma vez: o rio não muda de lugar.
 const river=window.arcanoRiverProfile;
 let shore=geo.attributes.animeShore;
 if(!shore||shore.count!==n){
  const arr=new Float32Array(n*2);
  for(let k=0;k<n;k++){
   const x=pos.getX(k),z=pos.getZ(k),y=pos.getY(k);
   if(river&&river.center){
    const half=typeof river.halfWidth==='function'?river.halfWidth(z):river.halfWidth;
    arr[k*2]=Math.abs(x-river.center(z))-half;
    arr[k*2+1]=y-river.levelAt(z);
   }else{arr[k*2]=99;arr[k*2+1]=9;}
  }
  shore=new T.BufferAttribute(arr,2);
  geo.setAttribute('animeShore',shore);
 }
 const sm=(e0,e1,v)=>{const t=Math.min(1,Math.max(0,(v-e0)/(e1-e0)));return t*t*(3-2*t);};
 for(let k=0;k<n;k++){
  const g=col.getY(k)-Math.max(col.getX(k),col.getZ(k));
  a[k]=Math.min(1,Math.max(0,(g+.01)/.09));
  // Encostas altas das margens ficam gramadas (rio de verdade, não um canal de areia).
  const sd=shore.getX(k),hw=shore.getY(k);
  if(sd<14)a[k]=Math.max(a[k],sm(2.6,4.6,sd)*sm(.55,1.1,hw));
 }
 const R=4;
 for(let pass=0;pass<2;pass++){
  for(let j=0;j<nz;j++){ // horizontal
   let sum=0,cnt=0;const row=j*nx;
   for(let i=-R;i<nx;i++){
    const add=i+R,rem=i-R-1;
    if(add<nx){sum+=a[row+add];cnt++;}
    if(rem>=0){sum-=a[row+rem];cnt--;}
    if(i>=0)b[row+i]=sum/cnt;
   }
  }
  for(let i=0;i<nx;i++){ // vertical
   let sum=0,cnt=0;
   for(let j=-R;j<nz;j++){
    const add=j+R,rem=j-R-1;
    if(add<nz){sum+=b[add*nx+i];cnt++;}
    if(rem>=0){sum-=b[rem*nx+i];cnt--;}
    if(j>=0)a[j*nx+i]=sum/cnt;
   }
  }
 }
 // A estrada fica sempre de terra: o verde some antes de chegar nela.
 for(let k=0;k<n;k++){
  const x=pos.getX(k),z=pos.getZ(k);
  const road=.92-.70*Math.sin(x*.47+.6)+.17*Math.sin(x*1.34);
  a[k]*=sm(.7,2.3,Math.abs(z-road));
 }
 if(geo.attributes.animeGreen&&geo.attributes.animeGreen.count===n){
  geo.attributes.animeGreen.array.set(a);geo.attributes.animeGreen.needsUpdate=true;
 }else geo.setAttribute('animeGreen',new T.BufferAttribute(a,1));
 geo.userData.animeGreenVersion=col.version;
}

/* ---------- Busca dos materiais ---------- */
function scan(api){
 const land=api.terrain;
 if(land)updateGreenAttribute(land);
 if(land&&land.material&&!Array.isArray(land.material))patchLand(land.material);
 if(land&&!window.arcanoAnimeGround)window.arcanoAnimeGround=makeGroundHelper(land);
 api.scene.traverse(o=>{
  if(!o.isMesh||o===land||o.userData.animeOutline||!isRock(o))return;
  const list=Array.isArray(o.material)?o.material:[o.material];
  for(const m of list)if(m)patchRock(m);
  addRockOutline(o);
 });
 api.scene.traverse(o=>{
  if(!o.isMesh||!o.name||!o.name.startsWith('Tapete de grama'))return;
  const list=Array.isArray(o.material)?o.material:[o.material];
  for(const m of list)if(m&&m.isMeshStandardMaterial)patchGrass(m);
 });
}
function start(){
 const api=window.arcanoWaterV1226;
 if(!api||!api.scene){setTimeout(start,200);return;}
 scan(api);
 // Grama e pedras novas recebem o estilo no instante em que entram na cena.
 (window.__animeAddHooks=window.__animeAddHooks||[]).push(o=>o.traverse(obj=>{
  if(!obj.isMesh||obj.userData.animeOutline)return;
  const list=Array.isArray(obj.material)?obj.material:[obj.material];
  if(obj.name&&obj.name.startsWith('Tapete de grama')){for(const m of list)if(m&&m.isMeshStandardMaterial)patchGrass(m);}
  else if(isRock(obj)){for(const m of list)if(m)patchRock(m);}
 }));
 // A grama é criada em setores ao longo do carregamento.
 setInterval(()=>{if(!document.hidden)scan(api);},9000);
 window.arcanoAnimeTerrain={rescan:()=>scan(api)};
 // Plantas e arbustos: folhas visíveis dos dois lados (antes alguns lados
 // ficavam "abertos") e plantas que vieram deitadas no modelo são escondidas.
 const box=new T.Box3(),size=new T.Vector3();
 let lastCount=-1;
 const fixPlants=()=>{
  const list=api.forestInstances||[];
  // Roda de novo de tempos em tempos: plantas também carregam depois que o jogo começa.
  setTimeout(fixPlants,5000);
  if(list.length!==lastCount){lastCount=list.length;return;}
  for(const a of list){
   if(!a||!a.obj||a.userData_animePlant||!['bush','flower','fern','grass'].includes(a.type))continue;
   a.userData_animePlant=true;
   a.obj.traverse(o=>{
    if(!o.isMesh)return;
    for(const m of Array.isArray(o.material)?o.material:[o.material])
     if(m&&m.side!==T.DoubleSide){m.side=T.DoubleSide;m.needsUpdate=true;}
   });
   a.obj.updateMatrixWorld(true);box.setFromObject(a.obj);box.getSize(size);
   const wide=Math.max(size.x,size.z);
   // O arbusto "Bush_Large_Flowers" tem partes invisíveis no modelo: removido do jogo.
   if((wide>.45&&size.y<wide*.28)||/Bush_Large_Flowers|Flower_1_Clump|Fern_1|Plant_Flowers/i.test(a.modelName||"")){
    if(a.fullScale&&a.fullScale.setScalar)a.fullScale.setScalar(.0001);
    a.obj.scale.setScalar(.0001);a.obj.updateMatrixWorld(true);
   }
  }
 };
 setTimeout(fixPlants,4000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
