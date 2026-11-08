/* Ilha Central (Luz) — primeiro mapa, baseado no protótipo 2D (jogabilidade/).
   Ilha redonda e flutuante, com:
   - Cidade Aurora DEMARCADA (ainda sem construções): platô de ~260 m de
     diâmetro (como a cidade principal do Genshin), anel de fundação da muralha,
     quatro portões com estandartes e estradas de terra.
   - Local do grande castelo no centro: colina, fundação de pedra e o núcleo
     de energia da ilha (o "orbe" do protótipo) brilhando no alto.
   - Floresta em volta usando as MESMAS árvores originais do jogo (instanciadas).
   - A área detalhada atual (rio, cachoeira, casa, ponte) fica no anel de
     floresta ao sul da cidade; o rio nasce num lago ao norte e cai da borda
     da ilha no céu, ao sul.
   - Base de rocha pendurada sob a ilha e pedras flutuando em volta. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const mobile=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||innerWidth<680;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const sm=(e0,e1,v)=>{const t=clamp((v-e0)/(e1-e0),0,1);return t*t*(3-2*t);};

// ---------- Dimensões ----------
const C={x:0,z:-230};          // centro da ilha e da cidade
const R=430;                    // raio da ilha
const CITY_R=130;               // cidade Aurora (~260 m de diâmetro)
const CASTLE_R=42;              // colina do castelo
const CITY_Y=16,CASTLE_Y=CITY_Y+12;
const INNER={x0:-64,x1:64,z0:-50,z1:50};   // área detalhada já existente
const STEP=mobile?4.5:3;        // resolução da malha da ilha

let seed=4242;
const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

function install(){
 const api=window.arcanoWaterV1226,ground=window.arcanoAnimeGround,river=window.arcanoRiverProfile;
 if(!api||!api.scene||!api.terrain||!ground||!river||!api.terrain.geometry.attributes.animeGreen){setTimeout(install,300);return;}
 if(window.arcanoIsland)return;
 const scene=api.scene;
 const half=z=>typeof river.halfWidth==='function'?river.halfWidth(z):river.halfWidth;
 const roadZ=x=>.92-.70*Math.sin(x*.47+.6)+.17*Math.sin(x*1.34);
 const LAKE={x:river.center(-50),z:-76,r:18,y:river.levelAt(-50)};

 // ---------- Estradas (polilinhas) ----------
 const gate=(ang,extra=0)=>({x:C.x+Math.cos(ang)*(CITY_R+extra),z:C.z+Math.sin(ang)*(CITY_R+extra)});
 const PORT={x:C.x+R*.80,z:C.z+18};
 const roads=[
  // Portão sul da cidade até a borda norte da área detalhada (perto do lago).
  [gate(Math.PI/2,2),{x:14,z:-70},{x:22,z:-52}],
  // Estrada da área detalhada, a leste, até o porto.
  [{x:INNER.x1,z:roadZ(INNER.x1)},{x:120,z:-20},{x:210,z:-110},{x:PORT.x-30,z:PORT.z},PORT],
  // Ligação do portão leste ao porto.
  [gate(0,2),{x:200,z:C.z+6},{x:PORT.x-30,z:PORT.z}],
  // Estrada da área detalhada, a oeste, subindo até o portão oeste.
  [{x:INNER.x0,z:roadZ(INNER.x0)},{x:-120,z:-15},{x:-185,z:-120},gate(Math.PI,2)],
  // Portão norte: trilha para o norte da ilha.
  [gate(-Math.PI/2,2),{x:-20,z:C.z-230},{x:30,z:C.z-330}]
 ];
 function roadDist(x,z){
  let best=1e9;
  for(const line of roads)for(let i=0;i<line.length-1;i++){
   const a=line[i],b=line[i+1],vx=b.x-a.x,vz=b.z-a.z,wx=x-a.x,wz=z-a.z;
   const t=clamp((wx*vx+wz*vz)/(vx*vx+vz*vz),0,1);
   best=Math.min(best,Math.hypot(wx-vx*t,wz-vz*t));
  }
  return best;
 }

 // ---------- Relevo da ilha ----------
 function field(x,z){
  const d=Math.hypot(x-C.x,z-C.z);
  const zc=clamp(z,-200,200);
  let y=.32-.073*zc-2.6*sm(14,19,z);
  const hill=Math.sin(x*.021+z*.013)*.5+Math.sin(x*.047-z*.031+1.3)*.3+Math.sin(x*.011+z*.043+2.1)*.2;
  const forest=sm(CITY_R+15,CITY_R+55,d);
  y+=(1.5+7.5*Math.pow(Math.max(0,hill),1.3))*forest;
  // Platô da cidade e colina do castelo.
  y=y+(CITY_Y-y)*(1-sm(CITY_R,CITY_R+40,d));
  y+=(CASTLE_Y-CITY_Y)*(1-sm(CASTLE_R-6,CASTLE_R+26,d));
  // Estradas um pouco aplainadas.
  const rd=roadDist(x,z);
  y-=.25*(1-sm(2,6,rd));
  // Borda arredondada antes da queda para o céu.
  const e=sm(R-45,R,d);y-=7*e*e;
  return y;
 }
 // Rio ao sul (continua o rio da área detalhada) e lago da nascente ao norte.
 function carve(x,z,y){
  if(z>INNER.z1-2){
   const lat=Math.abs(x-river.center(z)),w=half(z),lvl=river.levelAt(z);
   if(lat<w)y=Math.min(y,lvl-1.0*(1-(lat/w)**2)-.15);
   else if(lat<w+9){const bank=lvl+.35+(lat-w)*.05;y=bank+(y-bank)*sm(w,w+9,lat);}
  }
  if(z<INNER.z0+2&&z>LAKE.z-LAKE.r-12){
   const dl=Math.hypot(x-LAKE.x,z-LAKE.z);
   const cz=clamp(z,LAKE.z,INNER.z0+2),lat=Math.abs(x-river.center(cz)),w=half(cz);
   const lake=dl<LAKE.r?LAKE.y-2.6*(1-(dl/LAKE.r)**2)-.2:Infinity;
   const chan=z>LAKE.z&&lat<w?LAKE.y-.9*(1-(lat/w)**2)-.15:Infinity;
   const bed=Math.min(lake,chan);
   if(bed<Infinity)y=Math.min(y,bed);
   else{
    const dist=Math.min(Math.max(0,dl-LAKE.r),z>LAKE.z?Math.max(0,lat-w):1e9);
    if(dist<9){const bank=LAKE.y+.35+dist*.05;y=bank+(y-bank)*sm(0,9,dist);}
   }
  }
  return y;
 }
 const outsideDist=(x,z)=>{
  const dx=Math.max(INNER.x0-x,0,x-INNER.x1),dz=Math.max(INNER.z0-z,0,z-INNER.z1);
  return Math.hypot(dx,dz);
 };
 function height(x,z){
  const od=outsideDist(x,z);
  if(od<=0)return ground.heightAt(x,z)-.12;
  // Emenda suave com a borda da área detalhada.
  const ex=clamp(x,INNER.x0+.3,INNER.x1-.3),ez=clamp(z,INNER.z0+.3,INNER.z1-.3);
  const edge=ground.heightAt(ex,ez);
  let y=edge+(field(x,z)-edge)*sm(0,38,od);
  return carve(x,z,y);
 }

 // ---------- Malha do terreno da ilha ----------
 const x0=C.x-R-6,z0=C.z-R-6,n=Math.ceil((2*R+12)/STEP)+1;
 const heights=new Float32Array(n*n);
 const pos=new Float32Array(n*n*3),uv=new Float32Array(n*n*2),col=new Float32Array(n*n*3);
 const green=new Float32Array(n*n),shore=new Float32Array(n*n*2);
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){
  const k=j*n+i,x=x0+i*STEP,z=z0+j*STEP;
  const d=Math.hypot(x-C.x,z-C.z);
  const y=d<R+4?height(x,z):field(x,z)-8;
  heights[k]=y;
  pos[k*3]=x;pos[k*3+1]=y;pos[k*3+2]=z;
  uv[k*2]=x/128+.5;uv[k*2+1]=z/100+.5;
  const rd=roadDist(x,z),city=1-sm(CITY_R-4,CITY_R+6,d);
  // Grama em quase toda a ilha; terra nas estradas, na cidade e nas margens.
  let g=1-(1-sm(2.5,5.5,rd));
  // Colina do castelo gramada; o anel plano da cidade recebe piso de pedra.
  g*=1-city*sm(CASTLE_R+18,CASTLE_R+28,d);
  // Margens do rio/lago (fora da área detalhada).
  let sd=99,hw=9;
  if(z>INNER.z1-2){sd=Math.abs(x-river.center(z))-half(z);hw=y-river.levelAt(z);}
  const dl=Math.hypot(x-LAKE.x,z-LAKE.z)-LAKE.r;
  if(dl<sd&&z<INNER.z0+2){sd=dl;hw=y-LAKE.y;}
  if(sd<14)g*=sm(2.6,4.6,sd)*sm(.55,1.1,hw);
  green[k]=g;shore[k*2]=sd;shore[k*2+1]=hw;
  // Cor base: terra quente; na cidade, piso claro (área a construir).
  const v=.92+.08*Math.sin(x*.7+z*1.1);
  if(city>.01){col[k*3]=(.62+.16*city)*v;col[k*3+1]=(.52+.17*city)*v;col[k*3+2]=(.40+.17*city)*v;}
  else{col[k*3]=.58*v;col[k*3+1]=.46*v;col[k*3+2]=.33*v;}
 }
 const idx=[];
 const inside=(x,z)=>x>INNER.x0+2&&x<INNER.x1-2&&z>INNER.z0+2&&z<INNER.z1-2;
 for(let j=0;j<n-1;j++)for(let i=0;i<n-1;i++){
  const a=j*n+i,b=a+1,c=a+n,d=c+1;
  const cx=x0+(i+.5)*STEP,cz=z0+(j+.5)*STEP;
  if(Math.hypot(cx-C.x,cz-C.z)>R+2)continue;
  if(inside(cx-STEP,cz-STEP)&&inside(cx+STEP,cz+STEP))continue; // coberto pela área detalhada
  idx.push(a,c,b,b,c,d);
 }
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.BufferAttribute(pos,3));
 geo.setAttribute('uv',new T.BufferAttribute(uv,2));
 geo.setAttribute('color',new T.BufferAttribute(col,3));
 geo.setAttribute('animeGreen',new T.BufferAttribute(green,1));
 geo.setAttribute('animeShore',new T.BufferAttribute(shore,2));
 geo.setIndex(idx);geo.computeVertexNormals();geo.computeBoundingSphere();
 // Mesmo material do solo detalhado: emenda sem diferença de cor/estilo.
 const land=new T.Mesh(geo,api.terrain.material);
 land.name='Ilha Central · terreno';land.receiveShadow=true;
 scene.add(land);

 // Altura para o personagem andar (mesma grade da malha).
 window.arcanoIslandHeight=(x,z)=>{
  const fi=clamp((x-x0)/STEP,0,n-1.001),fj=clamp((z-z0)/STEP,0,n-1.001);
  const i=Math.floor(fi),j=Math.floor(fj),u=fi-i,v=fj-j,k=j*n+i;
  return heights[k]*(1-u)*(1-v)+heights[k+1]*u*(1-v)+heights[k+n]*(1-u)*v+heights[k+n+1]*u*v;
 };
 window.arcanoIslandClamp=(x,z)=>{
  const dx=x-C.x,dz=z-C.z,d=Math.hypot(dx,dz),max=R-5;
  if(d<=max)return [x,z];
  return [C.x+dx/d*max,C.z+dz/d*max];
 };

 // As paredes de "horizontes do solo" nas bordas da área detalhada
 // apareciam como um corte no meio da ilha: ficam ocultas.
 scene.traverse(o=>{if(o.name&&o.name.startsWith('Horizontes O/A/B/C'))o.visible=false;});

 // ---------- Base de rocha da ilha flutuante ----------
 {
  const SEG=mobile?72:120,RINGS=mobile?16:24;
  const p=new Float32Array((SEG+1)*(RINGS+1)*3),ix=[];
  for(let r=0;r<=RINGS;r++){
   const t=r/RINGS;
   for(let s=0;s<=SEG;s++){
    const a=s/SEG*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a);
    const ex=C.x+ca*(R-1),ez=C.z+sa*(R-1);
    const top=window.arcanoIslandHeight(ex,ez)+.6;
    const jag=1+.10*Math.sin(a*7+t*5)+.07*Math.sin(a*17-t*9)+.05*Math.sin(a*31+t*13);
    const rad=(R+2)*Math.pow(1-t,.85)*(t>0?jag:1)*(1-.03*t);
    const y=top-t*(170+25*Math.sin(a*3))-Math.pow(t,3)*60-(t>0?4*Math.sin(a*11+t*20):0);
    const k=r*(SEG+1)+s;
    p[k*3]=C.x+ca*rad;p[k*3+1]=y;p[k*3+2]=C.z+sa*rad;
    if(r<RINGS&&s<SEG){const b=k+SEG+1;ix.push(k,k+1,b,k+1,b+1,b);}
   }
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();
  const base=new T.Mesh(g,new T.MeshStandardMaterial({color:'#a9a39b',roughness:1,metalness:0,side:T.DoubleSide}));
  base.name='Pedra da base da ilha flutuante';base.frustumCulled=false;
  scene.add(base);
  // Pedras flutuando em volta da ilha.
  const rockGeo=new T.SphereGeometry(1,14,10);
  const rp=rockGeo.attributes.position,v=new T.Vector3();
  for(let i=0;i<rp.count;i++){v.fromBufferAttribute(rp,i);const k=1+.18*Math.sin(v.x*3+v.z*2)+.12*Math.sin(v.y*4);v.multiplyScalar(k);if(v.y<0)v.y*=1.8;rp.setXYZ(i,v.x,v.y,v.z);}
  rockGeo.computeVertexNormals();
  const floating=new T.InstancedMesh(rockGeo,new T.MeshStandardMaterial({color:'#b1aca4',roughness:1}),mobile?10:18);
  floating.name='Pedras flutuantes da ilha';
  const m=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),sc=new T.Vector3(),pp=new T.Vector3();
  const floatData=[];
  for(let i=0;i<floating.count;i++){
   const a=rnd()*Math.PI*2,dist=R+25+rnd()*90,s=4+rnd()*11;
   floatData.push({x:C.x+Math.cos(a)*dist,z:C.z+Math.sin(a)*dist,y:-10-rnd()*70,s,r:rnd()*6.28,ph:rnd()*6.28});
  }
  scene.add(floating);
  const animateFloating=t=>{
   floatData.forEach((f,i)=>{
    m.compose(pp.set(f.x,f.y+Math.sin(t*.4+f.ph)*1.5,f.z),q.setFromEuler(e.set(0,f.r+t*.03,0)),sc.setScalar(f.s));
    floating.setMatrixAt(i,m);
   });
   floating.instanceMatrix.needsUpdate=true;
  };
  animateFloating(0);
  setInterval(()=>animateFloating(performance.now()/1000),100);
 }

 // ---------- Água fora da área detalhada (mesmo material do rio) ----------
 const riverMat=window.arcanoAnimeRiver&&window.arcanoAnimeRiver.material;
 if(riverMat){
  const u=riverMat.uniforms;
  const shareMat=fallZ=>{
   const m=riverMat.clone();
   for(const key of Object.keys(u))m.uniforms[key]=u[key];
   m.uniforms.uFallZ={value:fallZ};
   m.extensions.derivatives=true;
   return m;
  };
  // Faixa de água seguindo o rio (ou reta), com queda opcional no fim.
  function ribbon(zA,zB,levelFn,centerFn,widthFn,fallDepth){
   const COLS=11,rows=[];
   for(let z=zA;z<=zB+.01;z+=.5)rows.push({z,fall:0});
   if(fallDepth){for(let f=1;f<=40;f++)rows.push({z:zB+.25+f*.012,fall:f/40});}
   const N=rows.length,p=new Float32Array(N*COLS*3),uvA=new Float32Array(N*COLS*2),
    dep=new Float32Array(N*COLS),flow=new Float32Array(N*COLS*2),ix=[];
   rows.forEach((row,r)=>{
    const z=row.z,cz=Math.min(z,zB),w=widthFn(cz),cx=centerFn(cz),lvl=levelFn(cz);
    const turn=(centerFn(cz+.25)-centerFn(cz-.25))/.5,nrm=Math.hypot(turn,1);
    for(let c=0;c<COLS;c++){
     const s=c/(COLS-1),x=cx+(s*2-1)*w*.98,k=r*COLS+c;
     p[k*3]=x;p[k*3+1]=lvl+.003-row.fall*fallDepth;p[k*3+2]=z;
     uvA[k*2]=s;uvA[k*2+1]=r/(N-1);
     dep[k]=row.fall?1:Math.max(0,lvl-window.arcanoIslandHeight(x,cz));
     flow[k*2]=.6*turn/nrm;flow[k*2+1]=.6/nrm;
     if(r<N-1&&c<COLS-1){const a=k,b=k+1,cc=k+COLS,d=cc+1;ix.push(a,cc,b,b,cc,d);}
    }
   });
   const g=new T.BufferGeometry();
   g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('uv',new T.BufferAttribute(uvA,2));
   g.setAttribute('waterDepth',new T.BufferAttribute(dep,1));g.setAttribute('waterFlow',new T.BufferAttribute(flow,2));
   g.setIndex(ix);
   return g;
  }
  // Rio ao sul até a borda, caindo da ilha.
  let zEdge=INNER.z1;
  while(Math.hypot(river.center(zEdge)-C.x,zEdge-C.z)<R-1&&zEdge<C.z+R)zEdge+=.5;
  const south=new T.Mesh(ribbon(INNER.z1,zEdge,river.levelAt,river.center,half,0),shareMat(-9999));
  // Queda da borda da ilha: cortina de água com volume (rio-anime.js).
  if(window.arcanoMakeWaterfall)window.arcanoMakeWaterfall({x:river.center(zEdge),zLip:zEdge,yTop:river.levelAt(zEdge)+.02,drop:150,halfWidth:half(zEdge)*.95,rows:44,name:'Cachoeira da borda da ilha'});
  south.name='Rio da Ilha Central · até a borda';south.frustumCulled=false;south.renderOrder=3;
  scene.add(south);
  // Nascente: lago e canal até a área detalhada.
  const lakeLevel=()=>LAKE.y;
  const chan=new T.Mesh(ribbon(LAKE.z,INNER.z0,lakeLevel,river.center,half,0),shareMat(-9999));
  chan.name='Canal da nascente';chan.frustumCulled=false;chan.renderOrder=3;scene.add(chan);
  const lg=new T.CircleGeometry(LAKE.r+.5,48);lg.rotateX(-Math.PI/2);
  const lp=lg.attributes.position,ld=new Float32Array(lp.count),lf=new Float32Array(lp.count*2),luv=lg.attributes.uv;
  for(let i=0;i<lp.count;i++){
   const x=lp.getX(i)+LAKE.x,z=lp.getZ(i)+LAKE.z;
   lp.setXYZ(i,x,LAKE.y+.003,z);
   ld[i]=Math.max(0,LAKE.y-window.arcanoIslandHeight(x,z));
   lf[i*2]=.05;lf[i*2+1]=.08;
  }
  lg.setAttribute('waterDepth',new T.BufferAttribute(ld,1));lg.setAttribute('waterFlow',new T.BufferAttribute(lf,2));
  const lake=new T.Mesh(lg,shareMat(-9999));lake.name='Lago da nascente';lake.frustumCulled=false;lake.renderOrder=3;
  scene.add(lake);
 }

 // ---------- Demarcação da cidade Aurora ----------
 const stone=new T.MeshStandardMaterial({color:'#cfc8bb',roughness:1});
 {
  // Fundação da muralha (anel), com aberturas nos 4 portões.
  const segLen=4,count=Math.floor(2*Math.PI*CITY_R/segLen);
  const wall=new T.InstancedMesh(new T.BoxGeometry(segLen*1.02,1.4,2.2),stone,count);
  wall.name='Pedra da fundação da muralha de Aurora';
  const m=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),p=new T.Vector3(),s=new T.Vector3(1,1,1);
  let used=0;
  for(let i=0;i<count;i++){
   const a=i/count*Math.PI*2;
   const gateGap=[0,Math.PI/2,Math.PI,Math.PI*1.5].some(g=>Math.abs(Math.atan2(Math.sin(a-g),Math.cos(a-g)))<.06);
   if(gateGap)continue;
   const x=C.x+Math.cos(a)*CITY_R,z=C.z+Math.sin(a)*CITY_R;
   m.compose(p.set(x,window.arcanoIslandHeight(x,z)+.25,z),q.setFromEuler(e.set(0,-a+Math.PI/2,0)),s);
   wall.setMatrixAt(used++,m);
  }
  wall.count=used;wall.castShadow=true;wall.receiveShadow=true;
  scene.add(wall);
  // Estandartes nos portões.
  const poleGeo=new T.CylinderGeometry(.18,.22,9,8);poleGeo.translate(0,4.5,0);
  const flagGeo=new T.PlaneGeometry(2.2,4.2,1,4);flagGeo.translate(1.2,6.4,0);
  const poleMat=new T.MeshStandardMaterial({color:'#6b4630',roughness:1});
  const flagMats=[new T.MeshStandardMaterial({color:'#3f8fc4',side:T.DoubleSide,roughness:1}),
   new T.MeshStandardMaterial({color:'#f2c75a',side:T.DoubleSide,roughness:1})];
  [0,Math.PI/2,Math.PI,Math.PI*1.5].forEach((g,gi)=>{
   for(const side of [-1,1]){
    const a=g+side*.075,x=C.x+Math.cos(a)*CITY_R,z=C.z+Math.sin(a)*CITY_R,y=window.arcanoIslandHeight(x,z);
    const pole=new T.Mesh(poleGeo,poleMat);pole.position.set(x,y,z);pole.castShadow=true;
    const flag=new T.Mesh(flagGeo,flagMats[(gi+(side>0?1:0))%2]);flag.position.copy(pole.position);
    flag.rotation.y=-a;flag.name='Estandarte do portão';
    scene.add(pole,flag);
   }
  });
 }
 // Piso de pedra em toda a área da cidade (onde as casas serão construídas).
 {
  const cv=document.createElement('canvas');cv.width=cv.height=256;
  const g=cv.getContext('2d');g.fillStyle='#5f5a53';g.fillRect(0,0,256,256);
  for(let row=0;row<8;row++)for(let c=0;c<8;c++){
   const off=row%2?16:0,x=c*32+off,y=row*32,l=52+Math.floor(rnd()*16);
   g.fillStyle=`hsl(${34+rnd()*10},${10+rnd()*8}%,${l}%)`;
   g.beginPath();g.roundRect?g.roundRect(x+2,y+2,28,28,5):g.rect(x+2,y+2,28,28);g.fill();
   if(off&&c===7){g.beginPath();g.roundRect?g.roundRect(-14,y+2,28,28,5):g.rect(-14,y+2,28,28);g.fill();}
  }
  const tex=new T.CanvasTexture(cv);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.colorSpace=T.SRGBColorSpace;
  tex.repeat.set(CITY_R/1.5,CITY_R/1.5);tex.anisotropy=4;
  const ring=new T.RingGeometry(CASTLE_R+27,CITY_R-1.2,128,6);ring.rotateX(-Math.PI/2);
  const ruv=ring.attributes.uv,rp=ring.attributes.position;
  for(let i=0;i<rp.count;i++)ruv.setXY(i,rp.getX(i)/(2*CITY_R)+.5,rp.getZ(i)/(2*CITY_R)+.5);
  const pave=new T.Mesh(ring,new T.MeshStandardMaterial({map:tex,roughness:1,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
  pave.position.set(C.x,CITY_Y+.04,C.z);pave.receiveShadow=true;pave.name='Piso da cidade Aurora (área a construir)';
  scene.add(pave);
 }
 // ---------- Local do castelo + núcleo de energia ----------
 {
  const y=window.arcanoIslandHeight(C.x,C.z);
  const base=new T.Mesh(new T.CylinderGeometry(CASTLE_R-6,CASTLE_R-3,3,48),stone);
  base.position.set(C.x,y-1.2,C.z);base.receiveShadow=true;base.castShadow=true;
  base.name='Pedra da fundação do castelo';scene.add(base);
  // Marcos nos cantos do futuro castelo.
  const markGeo=new T.BoxGeometry(2.4,6,2.4);markGeo.translate(0,3,0);
  for(let i=0;i<8;i++){
   const a=i/8*Math.PI*2+Math.PI/8,x=C.x+Math.cos(a)*(CASTLE_R-9),z=C.z+Math.sin(a)*(CASTLE_R-9);
   const mk=new T.Mesh(markGeo,stone);mk.position.set(x,y+.3,z);mk.castShadow=true;mk.name='Pedra marco do castelo';scene.add(mk);
  }
  const coreMat=new T.MeshStandardMaterial({color:'#fff3c4',emissive:new T.Color('#ffd877'),emissiveIntensity:2.2,roughness:.4});
  const core=new T.Mesh(new T.IcosahedronGeometry(4,2),coreMat);
  core.position.set(C.x,y+26,C.z);core.name='Núcleo de energia da Ilha Central';
  scene.add(core);
  const beam=new T.Mesh(new T.CylinderGeometry(1.2,2.4,60,24,1,true),new T.MeshBasicMaterial({color:'#ffe9a8',transparent:true,opacity:.18,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}));
  beam.position.set(C.x,y+30,C.z);beam.name='Feixe do núcleo';scene.add(beam);
  const light=new T.PointLight('#ffd98a',2.2,90,1.6);light.position.copy(core.position);scene.add(light);
  setInterval(()=>{const t=performance.now()/1000;core.position.y=y+26+Math.sin(t*.8)*1.2;core.rotation.y=t*.3;},50);
 }

 // ---------- Floresta em volta da cidade (árvores originais instanciadas) ----------
 function buildForest(){
  const anchors=(api.forestInstances||[]).filter(a=>(a.type==='tree'||a.type==='pine')&&a.obj&&a.obj.scale.x>.01);
  // Espera a floresta original terminar de carregar (mais modelos = mais variedade).
  if(anchors.length<20||anchors.length!==buildForest.last){buildForest.last=anchors.length;setTimeout(buildForest,2500);return;}
  const byModel=new Map();
  // Evita copiar uma árvore que está translúcida na frente da câmera (material temporário).
  const faded=a=>{let f=false;a.obj.traverse(o=>{if(o.isMesh){const l=Array.isArray(o.material)?o.material:[o.material];if(l.some(m=>m&&m.transparent&&m.depthWrite===false))f=true;}});return f;};
  for(const a of anchors)if(!byModel.has(a.modelName)&&!faded(a))byModel.set(a.modelName,a);
  const templates=[];
  const inv=new T.Matrix4();
  for(const a of byModel.values()){
   a.obj.updateMatrixWorld(true);
   inv.makeTranslation(-a.x,-(a.contactY??a.y),-a.z);
   const parts=[];
   a.obj.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o.visible!==false)parts.push({geometry:o.geometry,material:o.material,rel:inv.clone().multiply(o.matrixWorld)});});
   if(parts.length)templates.push({name:a.modelName,pine:a.type==='pine',parts});
  }
  // Lugares: anel entre a cidade e a borda, com bosques densos e clareiras.
  const COUNT=mobile?700:2200,cell=4.2,taken=new Set(),spots=[];
  const free=(x,z)=>{const k=Math.round(x/cell)+','+Math.round(z/cell);if(taken.has(k))return false;taken.add(k);return true;};
  for(let tries=0;spots.length<COUNT&&tries<COUNT*30;tries++){
   const a=rnd()*Math.PI*2,d=CITY_R+16+Math.sqrt(rnd())*(R-CITY_R-34);
   const x=C.x+Math.cos(a)*d,z=C.z+Math.sin(a)*d;
   if(outsideDist(x,z)<6)continue;
   if(roadDist(x,z)<6||Math.hypot(x-PORT.x,z-PORT.z)<30)continue;
   if(z>INNER.z1-4&&Math.abs(x-river.center(z))<half(z)+8)continue;
   if(Math.hypot(x-LAKE.x,z-LAKE.z)<LAKE.r+8||(z<INNER.z0+2&&z>LAKE.z&&Math.abs(x-river.center(z))<half(z)+7))continue;
   const dens=Math.sin(x*.018+z*.011)*.5+Math.sin(x*.041-z*.027+2.)*.3+Math.sin(x*.07+z*.06)*.2;
   if(rnd()>.15+.85*sm(-.25,.35,dens))continue;
   const y=window.arcanoIslandHeight(x,z),yx=window.arcanoIslandHeight(x+2,z),yz=window.arcanoIslandHeight(x,z+2);
   if(Math.hypot(yx-y,yz-y)>1.6)continue;
   if(!free(x,z))continue;
   spots.push({x,y,z,rot:rnd()*Math.PI*2,s:.85+rnd()*.45,t:Math.floor(rnd()*templates.length)});
  }
  // Setores 3×3: cada setor só é desenhado quando aparece na tela.
  const SECT=7,minX=C.x-R,size=2*R/SECT,minZ=C.z-R;
  const buckets=new Map();
  for(const s of spots){
   const si=clamp(Math.floor((s.x-minX)/size),0,SECT-1),sj=clamp(Math.floor((s.z-minZ)/size),0,SECT-1);
   const key=si+','+sj+','+s.t;
   if(!buckets.has(key))buckets.set(key,[]);
   buckets.get(key).push(s);
  }
  const group=new T.Group();group.name='Floresta da Ilha Central';
  const M=new T.Matrix4(),Q=new T.Quaternion(),E=new T.Euler(),P=new T.Vector3(),S=new T.Vector3();
  for(const [key,list] of buckets){
   const tpl=templates[+key.split(',')[2]];
   for(const part of tpl.parts){
    const im=new T.InstancedMesh(part.geometry,part.material,list.length);
    im.name='Árvore da ilha · '+tpl.name;
    list.forEach((s,i)=>{
     M.compose(P.set(s.x,s.y-.08,s.z),Q.setFromEuler(E.set(0,s.rot,0)),S.setScalar(s.s)).multiply(part.rel);
     im.setMatrixAt(i,M);
    });
    im.instanceMatrix.needsUpdate=true;
    im.castShadow=false;im.receiveShadow=false; // sombra só nas árvores perto (área detalhada)
    if(im.computeBoundingSphere)im.computeBoundingSphere();else im.frustumCulled=false;
    group.add(im);
   }
  }
  scene.add(group);
  window.arcanoIsland.forest={group,count:spots.length,templates:templates.length};
 }
 window.arcanoIsland={center:C,radius:R,cityRadius:CITY_R,castleRadius:CASTLE_R,height:window.arcanoIslandHeight,land};
 buildForest();

 // ---------- Câmera, sombras e névoa para o mundo grande ----------
 const light=(()=>{let l=null;scene.traverse(o=>{if(!l&&o.isDirectionalLight&&o.castShadow)l=o;});return l;})();
 let sunVec=null;const focus=new T.Vector3();
 function frame(){
  requestAnimationFrame(frame);
  const cam=api.getMainCamera&&api.getMainCamera();
  if(cam&&cam.far<700){cam.far=700;cam.updateProjectionMatrix();}
  if(!light)return;
  // A sombra do sol acompanha o personagem (antes só existia perto do centro).
  sunVec=light.userData.sunVec||null;
  const player=api.getGrassPlayer&&api.getGrassPlayer();
  const src=player?player.position:(cam?cam.position:null);
  if(!src||!sunVec)return;
  const fx=Math.round(src.x/6)*6,fz=Math.round(src.z/6)*6,fy=Math.round(src.y/6)*6;
  focus.set(fx,fy,fz);
  light.target.position.copy(focus);light.target.updateMatrixWorld();
  light.position.copy(focus).add(sunVec);
 }
 requestAnimationFrame(frame);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
