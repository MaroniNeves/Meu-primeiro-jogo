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
const CITY_Y=10,CASTLE_Y=CITY_Y+12; // platô baixo o bastante para a estrada subir em rampa
const INNER={x0:-64,x1:64,z0:-50,z1:50};   // área detalhada já existente
// 2 m: as linhas da malha caem EXATAMENTE nas bordas da área detalhada
// (x=±64, z=±50), sem triângulos atravessando o terreno detalhado.
const STEP=2;

let seed=4242;
const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

function install(){
 const api=window.arcanoWaterV1226,ground=window.arcanoAnimeGround,river=window.arcanoRiverProfile;
 if(!api||!api.scene||!api.terrain||!ground||!river||!api.terrain.geometry.attributes.animeGreen){setTimeout(install,300);return;}
 if(window.arcanoIsland)return;
 const scene=api.scene;
 const half=z=>typeof river.halfWidth==='function'?river.halfWidth(z):river.halfWidth;
 const roadZ=x=>.92-.70*Math.sin(x*.47+.6)+.17*Math.sin(x*1.34);
 // Lago maior (elipse 60 x 30 m). lakeE = 1 na margem, <1 dentro.
 const LAKE={x:river.center(-50),z:-71,rx:30,rz:15,r:15,y:river.levelAt(-50)};
 const lakeE=(x,z)=>Math.hypot((x-LAKE.x)/LAKE.rx,(z-LAKE.z)/LAKE.rz);
 // Montanha encostada na cidade (oeste) com a nascente do afluente na ponta.
 const MT={x:-178,z:-186,h:44,sig:30};

 // ---------- Estradas (polilinhas) ----------
 const gate=(ang,extra=0)=>({x:C.x+Math.cos(ang)*(CITY_R+extra),z:C.z+Math.sin(ang)*(CITY_R+extra)});
 const PORT={x:C.x+R*.80,z:C.z+18};
 const roads=[
  // Portão sul da cidade até a borda norte da área detalhada (perto do lago).
  [gate(Math.PI/2,2),{x:46,z:-92},{x:42,z:-52}],
  // Estrada da área detalhada, a leste, até o porto.
  [{x:INNER.x1,z:roadZ(INNER.x1)},{x:120,z:-20},{x:210,z:-110},{x:PORT.x-30,z:PORT.z},PORT],
  // Estrada da área detalhada, a oeste, contornando até o grande portão (sul).
  [{x:INNER.x0,z:roadZ(INNER.x0)},{x:-110,z:-20},{x:-72,z:-82},{x:-38,z:-98},gate(Math.PI/2,6)],
  // Rua que atravessa o portão e entra na cidade.
  [gate(Math.PI/2,14),gate(Math.PI/2,-30)]
 ];
 // ---------- Vila da montanha: rua em espiral subindo a encosta ----------
 // Sai da estrada oeste, contorna o pé da montanha pelo sudoeste e sobe em
 // espiral (lado oeste e norte, longe dos afluentes) até um mirante no alto.
 const VILLAGE=(()=>{
  const deg=Math.PI/180,P=(r,a)=>({x:MT.x+Math.cos(a*deg)*r,z:MT.z+Math.sin(a*deg)*r});
  const access=[{x:-110,z:-20},{x:-132,z:-52},{x:-158,z:-88},P(60,97)];
  const spiral=[];const A0=97,A1=300,R0=60,R1=17,N=40;
  for(let i=0;i<=N;i++){const t=i/N;spiral.push(Object.assign(P(R0+(R1-R0)*t,A0+(A1-A0)*t),{t}));}
  return {access,spiral,peak:P(0,0),P,deg};
 })();
 roads.push(VILLAGE.access,VILLAGE.spiral.map(p=>({x:p.x,z:p.z})));
 const roadBoxes=roads.map(l=>{let a=1e9,b=-1e9,c=1e9,d=-1e9;for(const p of l){a=Math.min(a,p.x);b=Math.max(b,p.x);c=Math.min(c,p.z);d=Math.max(d,p.z);}return [a,b,c,d];});
 function roadDist(x,z){
  let best=1e9;
  for(let r=0;r<roads.length;r++){
   const line=roads[r],bx=roadBoxes[r];
   if(x<bx[0]-best||x>bx[1]+best||z<bx[2]-best||z>bx[3]+best)continue;
   for(let i=0;i<line.length-1;i++){
   const a=line[i],b=line[i+1],vx=b.x-a.x,vz=b.z-a.z,wx=x-a.x,wz=z-a.z;
   const t=clamp((wx*vx+wz*vz)/(vx*vx+vz*vz),0,1);
   best=Math.min(best,Math.hypot(wx-vx*t,wz-vz*t));
   }
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
  // (dentro da cidade o piso é plano: estradas não rebaixam o chão)
  y-=.25*(1-sm(2,6,rd))*sm(CITY_R+3,CITY_R+10,d);
  // Borda arredondada antes da queda para o céu.
  // Montanha (não sobe dentro da cidade).
  const md=Math.hypot(x-MT.x,z-MT.z);
  y+=MT.h*Math.exp(-md*md/(2*MT.sig*MT.sig))*(1+.12*Math.sin(x*.21)*Math.sin(z*.17))*sm(CITY_R+4,CITY_R+24,d);
  const e=sm(R-45,R,d);y-=7*e*e;
  return y;
 }
 // ---------- Afluentes: nascem na ponta da montanha e descem até o lago ----------
 // O curso principal (A) se divide: B sai do meio de A e entra no lago pelo sul;
 // C sai do alto de A, contorna pelo oeste e se junta a B. Ilhotas entre eles.
 const STREAM_W=3.4;
 function mkStream(way,startLevel,endLevel,mouth){
  const pts=[];
  for(let i=0;i<way.length-1;i++){const a=way[i],b=way[i+1],L=Math.hypot(b.x-a.x,b.z-a.z),k=Math.ceil(L/2);
   for(let j=0;j<k;j++){const t=j/k,wig=(i||j)?Math.sin((pts.length)*.35)*1.2*Math.sin(Math.PI*t):0;pts.push({x:a.x+(b.x-a.x)*t+wig,z:a.z+(b.z-a.z)*t});}}
  pts.push({x:way[way.length-1].x,z:way[way.length-1].z});
  // Nível da água: sempre abaixo do terreno e só descendo (corredeiras na encosta).
  let lvl=startLevel;
  for(const p of pts){lvl=Math.min(lvl,field(p.x,p.z)-.6);p.level=Math.max(lvl,endLevel);}
  pts[0].level=Math.min(startLevel,pts[0].level);
  // Últimos metros: o nível desce suave até o da foz (lago ou outro braço), sem degrau.
  {let acc=0;const dist=new Array(pts.length).fill(0);for(let i=pts.length-2;i>=0;i--){acc+=Math.hypot(pts[i+1].x-pts[i].x,pts[i+1].z-pts[i].z);dist[i]=acc;}
   // A foz é o primeiro ponto que entra no lago (ou o fim): dali em diante, nível do lago.
   let iE=pts.length-1;if(mouth)for(let i=0;i<pts.length;i++)if(mouth(pts[i])){iE=i;break;}
   const dE=dist[iE],D=Math.min(40,(acc-dE)*.4);let i0=0;while(i0<iE&&dist[i0]-dE>D)i0++;const L0=pts[i0].level;
   for(let i=i0;i<pts.length;i++)pts[i].level=Math.min(pts[i].level,i>=iE?endLevel:endLevel+(L0-endLevel)*(dist[i]-dE)/D);}
  pts.forEach((p,i)=>{const q=pts[Math.min(pts.length-1,i+1)],o=pts[Math.max(0,i-1)];let tx=q.x-o.x,tz=q.z-o.z;const tl=Math.hypot(tx,tz)||1;p.tx=tx/tl;p.tz=tz/tl;
   p.speed=.35+Math.min(.9,Math.max(0,(o.level-q.level)/Math.max(.1,tl))*4);});
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const p of pts){x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);z0=Math.min(z0,p.z);z1=Math.max(z1,p.z);}
  return {pts,box:[x0-12,x1+12,z0-12,z1+12],spring:pts[0]};
 }
 const nearPt=(s,x,z)=>{let b=null,bd=1e9;for(const p of s.pts){const d=Math.hypot(p.x-x,p.z-z);if(d<bd){bd=d;b=p;}}return b;};
 const dirL=Math.atan2(LAKE.z-MT.z,LAKE.x-MT.x);
 const SPRING={x:MT.x+Math.cos(dirL)*22,z:MT.z+Math.sin(dirL)*22};
 const stream=mkStream([SPRING,{x:-136,z:-152},{x:-110,z:-126},{x:-82,z:-104},{x:-56,z:-86},{x:LAKE.x-LAKE.rx+3,z:LAKE.z-1},{x:LAKE.x-LAKE.rx*.6,z:LAKE.z-1}],Infinity,LAKE.y,p=>lakeE(p.x,p.z)<1.02);
 const splitB=nearPt(stream,-82,-104),splitC=nearPt(stream,-136,-152);
 const streamB=mkStream([splitB,{x:-84,z:-80},{x:-62,z:-66},{x:LAKE.x-LAKE.rx+1,z:LAKE.z+7},{x:LAKE.x-LAKE.rx*.62,z:LAKE.z+4}],splitB.level,LAKE.y,p=>lakeE(p.x,p.z)<1.02);
 const joinC=nearPt(streamB,-84,-80);
 const streamC=mkStream([splitC,{x:-142,z:-122},{x:-128,z:-98},{x:-104,z:-86},joinC],splitC.level,joinC.level);
 const STREAMS=[stream,streamB,streamC];
 // Distância ao afluente mais próximo, nível da água e direção da correnteza.
 function streamInfo(x,z){
  let best=1e9,res=null;
  for(let si_=0;si_<STREAMS.length;si_++){const S=STREAMS[si_];
   const b=S.box;if(x<b[0]||x>b[1]||z<b[2]||z>b[3])continue;
   const P=S.pts;
   for(let i=0;i<P.length-1;i++){
    const a=P[i],c=P[i+1],vx=c.x-a.x,vz=c.z-a.z,wx=x-a.x,wz=z-a.z;
    const t=clamp((wx*vx+wz*vz)/(vx*vx+vz*vz),0,1),dd=Math.hypot(wx-vx*t,wz-vz*t);
    if(dd<best){best=dd;res={d:dd,level:a.level+(c.level-a.level)*t,s:i+t,tx:a.tx,tz:a.tz,speed:a.speed,sid:si_};}
   }
  }
  return res;
 }
 // Rio ao sul (continua o rio da área detalhada) e lago da nascente ao norte.
 // Canal do rio com a MESMA fórmula da área detalhada (agua-v1226.js, elevation):
 // fundo e margens continuam iguais dos dois lados da emenda — um mapa só.
 const sI=t=>t*t*(3-2*t);
 function channel(x,z,y,waterline,width){
  const lateral=Math.abs(x-river.center(z));
  const depth=.95-1.65*sI(clamp((lateral/width-.50)/.45,0,1));
  const bankT=sI(clamp((width+7-lateral)/7,0,1));
  return y+(waterline-depth-y)*bankT;
 }
 // Rio e canal do lago: entram na mistura com a área detalhada (emenda sem degrau).
 function carveRiver(x,z,y){
  if(z>INNER.z1-4)y=channel(x,z,y,river.levelAt(z),half(z));
  if(z<INNER.z0+4&&z>LAKE.z&&z>LAKE.z-LAKE.rz-14)y=channel(x,z,y,LAKE.y,half(z));
  return y;
 }
 // Afluentes e bacia do lago: escavados POR INTEIRO (antes eram misturados com o
 // terreno perto da área detalhada e a água ficava flutuando acima do leito).
 function carveWater(x,z,y){
  const si=streamInfo(x,z);
  if(si&&si.d<STREAM_W+6){
   const depth=.75-1.2*sI(clamp((si.d/STREAM_W-.45)/.5,0,1));
   const bankT=sI(clamp((STREAM_W+6-si.d)/6,0,1));
   y=y+(si.level-depth-y)*bankT;
   // Barranco: as margens nunca ficam abaixo da água (encosta da montanha).
   if(si.d>STREAM_W*.78&&si.d<STREAM_W+3.5&&lakeE(x,z)>1.15)y=Math.max(y,si.level+.12+(si.d-STREAM_W*.78)*.12);
  }
  if(z<INNER.z0+4&&z>LAKE.z-LAKE.rz-14){
   // Bacia do lago com margem suave.
   const le=lakeE(x,z),bw=7/LAKE.rz;
   const bankT=sI(clamp((1+bw-le)/bw,0,1));
   const bed=LAKE.y-(.95+2.2*(1-clamp(le,0,1)**2))+1.65*sI(clamp((le-.45)/.55,0,1));
   y=Math.min(y,y+(bed-y)*bankT); // só escava: não levanta um dique entre o lago e o canal
  }
  return y;
 }
 // ---------- Vila da montanha: alturas da rua, terraços das casas e escadas ----------
 {
  const S=VILLAGE.spiral;
  let hm=-1e9;for(const p of S){hm=Math.max(hm,field(p.x,p.z)-.25);p.y=hm;}
  for(let pass=0;pass<4;pass++){const c=S.map(p=>p.y);for(let i=1;i<S.length-1;i++)S[i].y=(c[i-1]+c[i]*2+c[i+1])/4;}
  const pads=[],stairs=[];
  const styles=['enxaimel','pagode','torre','sobrado','chale','pagode','enxaimel','sobrado','torre','chale','sobrado','enxaimel'];
  let n=0;
  let run=0;
  for(let i=2;i<S.length-2;i++){
   run+=Math.hypot(S[i].x-S[i-1].x,S[i].z-S[i-1].z);if(run<13)continue;run=0;
   const p=S[i],ur={x:(p.x-MT.x),z:(p.z-MT.z)},rl=Math.hypot(ur.x,ur.z);ur.x/=rl;ur.z/=rl;
   const style=styles[n%styles.length];
   const w=style==='torre'?7:7+((n*37)%3),d=style==='pagode'?7.5:6+((n*53)%2);
   const rp=Math.hypot(w,d)/2+.6;
   let side=(n%2)?-1:1;if(rl-(2.4+5.5+rp)<20)side=1;    // perto do topo: só do lado de fora
   const off=side>0?2.4+1.4+rp:2.4+5.5+rp;
   const x=p.x+ur.x*off*side,z=p.z+ur.z*off*side;
   const nat=field(x,z);
   const y=side>0?p.y+.15:p.y+clamp((nat-p.y)*.55,.6,3.2);
   pads.push({x,z,y,r:rp,w,d,style,rot:Math.atan2(-ur.x*side,-ur.z*side),side,road:p,idx:n});
   if(side<0){const a={x:p.x-ur.x*2.2,z:p.z-ur.z*2.2,y:p.y},b={x:p.x-ur.x*(off-rp+.4),z:p.z-ur.z*(off-rp+.4),y};stairs.push({a,b,w:1.7});}
   n++;
  }
  // Mirante no alto: terraço redondo e escada desde o fim da rua.
  const end=S[S.length-1],pk=VILLAGE.peak,peakY=Math.max(field(pk.x,pk.z)-.3,end.y+1);
  const toP={x:pk.x-end.x,z:pk.z-end.z},tl=Math.hypot(toP.x,toP.z);
  stairs.push({a:{x:end.x+toP.x/tl*2.2,z:end.z+toP.z/tl*2.2,y:end.y},b:{x:pk.x-toP.x/tl*6,z:pk.z-toP.z/tl*6,y:peakY},w:2});
  VILLAGE.pads=pads;VILLAGE.stairs=stairs;VILLAGE.peakPad={x:pk.x,z:pk.z,y:peakY,r:6.4};
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const p of S.concat(pads)){x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);z0=Math.min(z0,p.z);z1=Math.max(z1,p.z);}
  VILLAGE.box=[x0-14,x1+14,z0-14,z1+14];
 }
 function villageRoad(x,z){
  const S=VILLAGE.spiral;let best=1e9,y=0,k=0;
  for(let i=0;i<S.length-1;i++){const a=S[i],c=S[i+1],vx=c.x-a.x,vz=c.z-a.z,wx=x-a.x,wz=z-a.z;
   const t=clamp((wx*vx+wz*vz)/(vx*vx+vz*vz),0,1),dd=Math.hypot(wx-vx*t,wz-vz*t);if(dd<best){best=dd;y=a.y+(c.y-a.y)*t;k=i+t;}}
  return {d:best,y,k};
 }
 function stairInfo(st,x,z){
  const vx=st.b.x-st.a.x,vz=st.b.z-st.a.z,L2=vx*vx+vz*vz,t=((x-st.a.x)*vx+(z-st.a.z)*vz)/L2;
  const tc=clamp(t,0,1),d=Math.hypot(x-st.a.x-vx*tc,z-st.a.z-vz*tc);
  return {t,d,y:st.a.y+(st.b.y-st.a.y)*tc};
 }
 function villageNear(x,z,m){
  const b=VILLAGE.box;if(x<b[0]||x>b[1]||z<b[2]||z>b[3])return false;
  for(const p of VILLAGE.pads)if(Math.hypot(x-p.x,z-p.z)<p.r+m)return true;
  if(Math.hypot(x-VILLAGE.peakPad.x,z-VILLAGE.peakPad.z)<VILLAGE.peakPad.r+m)return true;
  for(const st of VILLAGE.stairs){const q=stairInfo(st,x,z);if(q.t>-.1&&q.t<1.1&&q.d<st.w*.5+m)return true;}
  return false;
 }
 function carveVillage(x,z,y){
  const b=VILLAGE.box;if(x<b[0]||x>b[1]||z<b[2]||z>b[3])return y;
  // Rua: plana de lado a lado, encaixada na encosta.
  const r=villageRoad(x,z);if(r.d<7.5)y=r.y+(y-r.y)*sm(2.7,7.5,r.d);
  // Terraços: as casas ficam sobre chão plano (corte no morro / aterro embaixo).
  for(const p of VILLAGE.pads.concat([VILLAGE.peakPad])){const d=Math.hypot(x-p.x,z-p.z);if(d<p.r+5.5)y=p.y+(y-p.y)*sm(p.r,p.r+5.5,d);}
  // Escadas: rampa por baixo dos degraus.
  for(const st of VILLAGE.stairs){const s=stairInfo(st,x,z);if(s.t>-.08&&s.t<1.08&&s.d<3.2)y=s.y+(y-s.y)*sm(st.w*.5+.15,3.2,s.d);}
  return y;
 }
 // Nível único da água do lago + canal + afluentes (e a correnteza no ponto).
 function pondWater(x,z){
  if(z>INNER.z0+.01)return null;
  const le=lakeE(x,z),canal=z>LAKE.z&&Math.abs(x-river.center(z))<half(z)+3;
  const si=streamInfo(x,z),inS=si&&si.d<STREAM_W+3.4;
  const lakeish=le<1.6||canal;
  if(!lakeish&&!inS)return null;
  const toRiver=sm(LAKE.z,INNER.z0,z);
  let level=LAKE.y,fx=0,fz=.08+.44*toRiver,sid=-1;
  if(inS){
   const w=lakeish?sm(1.0,1.5,le):1;
   level=Math.max(si.level,LAKE.y);sid=level>LAKE.y+.05?si.sid:-1;
   fx=fx*(1-w)+si.tx*si.speed*w;fz=fz*(1-w)+si.tz*si.speed*w;
  }
  return {level,fx,fz,sid};
 }
 const outsideDist=(x,z)=>{
  const dx=Math.max(INNER.x0-x,0,x-INNER.x1),dz=Math.max(INNER.z0-z,0,z-INNER.z1);
  return Math.hypot(dx,dz);
 };
 function height(x,z){
  const od=outsideDist(x,z);
  if(od<=0)return ground.heightAt(x,z);
  // Emenda suave com a borda da área detalhada.
  const ex=clamp(x,INNER.x0+.3,INNER.x1-.3),ez=clamp(z,INNER.z0+.3,INNER.z1-.3);
  const edge=ground.heightAt(ex,ez);
  // O canal entra na mistura (antes era aplicado por cima e criava um degrau).
  let y=edge+(carveRiver(x,z,field(x,z))-edge)*sm(0,38,od);
  const k=sm(0,8,od);if(k>0){const yw=carveWater(x,z,y);y+=(yw-y)*k;}
  return carveVillage(x,z,y);
 }

 // ---------- Malha do terreno da ilha ----------
 // Amostra atributos da área detalhada (cor, verde, normal) para emendar sem corte.
 const innerGeo=api.terrain.geometry,IP=innerGeo.attributes.position;
 let INX=1;while(INX<IP.count&&Math.abs(IP.getZ(INX)-IP.getZ(0))<1e-6)INX++;
 const INZ=Math.round(IP.count/INX),IX0=IP.getX(0),IX1=IP.getX(INX-1),IZ0=IP.getZ(0),IZ1=IP.getZ((INZ-1)*INX);
 function innerSample(attr,x,z,c){
  const fi=clamp((x-IX0)/(IX1-IX0)*(INX-1),0,INX-1.001),fj=clamp((z-IZ0)/(IZ1-IZ0)*(INZ-1),0,INZ-1.001);
  const i=Math.floor(fi),j=Math.floor(fj),u=fi-i,v=fj-j,k=j*INX+i;
  const arr=attr.array,sz=attr.itemSize,g=q=>arr[q*sz+c];
  return g(k)*(1-u)*(1-v)+g(k+1)*u*(1-v)+g(k+INX)*(1-u)*v+g(k+INX+1)*u*v;
 }
 const x0=C.x-R-6,z0=C.z-R-6,n=Math.ceil((2*R+12)/STEP)+1;
 // Atributos de um vértice do terreno (uv, cor, verde, margem).
 function vAttr(x,z,y,k,U,Cc,G,S){
  const d=Math.hypot(x-C.x,z-C.z);
  U[k*2]=x/128+.5;U[k*2+1]=z/100+.5;
  const rd=roadDist(x,z),city=1-sm(CITY_R-4,CITY_R+6,d);
  // Grama em quase toda a ilha; terra nas estradas, na cidade e nas margens.
  let g=1-(1-sm(2.5,5.5,rd));
  // Colina do castelo gramada; o anel plano da cidade recebe piso de pedra.
  g*=1-city*sm(CASTLE_R+18,CASTLE_R+28,d);
  // Margens do rio/lago (fora da área detalhada).
  let sd=99,hw=9;
  if(z>INNER.z1-2){sd=Math.abs(x-river.center(z))-half(z);hw=y-river.levelAt(z);}
  const dl=(lakeE(x,z)-1)*LAKE.rz;
  if(dl<sd&&z<INNER.z0+2){sd=dl;hw=y-LAKE.y;}
  {const si=streamInfo(x,z);if(si&&si.d-STREAM_W<sd){sd=si.d-STREAM_W;hw=y-si.level;}}
  if(sd<14)g*=sm(2.6,4.6,sd)*sm(.55,1.1,hw);
  // Vila: terraços das casas e escadas sem grama (a rua já entra nas estradas).
  {const b=VILLAGE.box;if(x>b[0]&&x<b[1]&&z>b[2]&&z<b[3]){
   for(const p of VILLAGE.pads)g*=sm(p.r-.5,p.r+1.5,Math.hypot(x-p.x,z-p.z));
   g*=sm(5,7,Math.hypot(x-VILLAGE.peakPad.x,z-VILLAGE.peakPad.z));
   for(const st of VILLAGE.stairs){const s=stairInfo(st,x,z);if(s.t>-.1&&s.t<1.1)g*=sm(st.w*.5,st.w*.5+1.5,s.d);}
  }}
  const od=outsideDist(x,z),seam=sm(0,25,od);
  if(seam<1){
   const ex=clamp(x,INNER.x0,INNER.x1),ez=clamp(z,INNER.z0,INNER.z1);
   g=innerSample(innerGeo.attributes.animeGreen,ex,ez,0)*(1-seam)+g*seam;
  }
  G[k]=g;S[k*2]=sd;S[k*2+1]=hw;
  // Cor base: terra quente; na cidade, piso claro (área a construir).
  const v=.92+.08*Math.sin(x*.7+z*1.1);
  if(city>.01){Cc[k*3]=(.62+.16*city)*v;Cc[k*3+1]=(.52+.17*city)*v;Cc[k*3+2]=(.40+.17*city)*v;}
  else{Cc[k*3]=.58*v;Cc[k*3+1]=.46*v;Cc[k*3+2]=.33*v;}
  if(seam<1){
   const ex=clamp(x,INNER.x0,INNER.x1),ez=clamp(z,INNER.z0,INNER.z1),ca=innerGeo.attributes.color;
   for(let c=0;c<3;c++)Cc[k*3+c]=innerSample(ca,ex,ez,c)*(1-seam)+Cc[k*3+c]*seam;
  }
 }
 const heights=new Float32Array(n*n);
 const pos=new Float32Array(n*n*3),uv=new Float32Array(n*n*2),col=new Float32Array(n*n*3);
 const green=new Float32Array(n*n),shore=new Float32Array(n*n*2);
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){
  const k=j*n+i,x=x0+i*STEP,z=z0+j*STEP;
  const d=Math.hypot(x-C.x,z-C.z);
  const y=d<R+4?height(x,z):field(x,z)-8;
  heights[k]=y;
  pos[k*3]=x;pos[k*3+1]=y;pos[k*3+2]=z;
  vAttr(x,z,y,k,uv,col,green,shore);
 }
 const idx=[];
 // Fica de fora a área detalhada + um anel de 1 célula: esse anel é preenchido
 // pela costura (ver abaixo), que liga ponto a ponto as duas malhas.
 const inside=(x,z)=>x>INNER.x0-STEP&&x<INNER.x1+STEP&&z>INNER.z0-STEP&&z<INNER.z1+STEP;
 // ---------- Contorno suave perto da água ----------
 // Células de 2 m perto do rio, lago e afluentes viram 4×4 células de 50 cm: a
 // linha entre areia e água fica curva em vez de "em degraus". Nas bordas com
 // células normais os pontos seguem a reta da célula vizinha (sem frestas).
 const SUB=4,SS=STEP/SUB,NC=n-1,refined=new Uint8Array(NC*NC);
 const nearWater=(x,z)=>{
  if(z>INNER.z1-2&&Math.abs(x-river.center(z))<half(z)+8)return true;
  if(z<INNER.z0+2&&lakeE(x,z)<1.7)return true;
  const si=streamInfo(x,z);return !!(si&&si.d<STREAM_W+7);
 };
 for(let j=0;j<NC;j++)for(let i=0;i<NC;i++){
  const cx=x0+(i+.5)*STEP,cz=z0+(j+.5)*STEP;
  if(Math.hypot(cx-C.x,cz-C.z)>R-12||inside(cx,cz))continue;
  if(nearWater(cx,cz))refined[j*NC+i]=1;
 }
 const isRef=(i,j)=>i>=0&&j>=0&&i<NC&&j<NC&&refined[j*NC+i]===1;
 for(let j=0;j<n-1;j++)for(let i=0;i<n-1;i++){
  const a=j*n+i,b=a+1,c=a+n,d=c+1;
  const cx=x0+(i+.5)*STEP,cz=z0+(j+.5)*STEP;
  if(Math.hypot(cx-C.x,cz-C.z)>R+2)continue;
  if(inside(cx,cz))continue; // célula dentro da área detalhada: sem sobreposição
  if(refined[j*(n-1)+i])continue; // desenhada na malha detalhada perto da água
  idx.push(a,c,b,b,c,d);
 }
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.BufferAttribute(pos,3));
 geo.setAttribute('uv',new T.BufferAttribute(uv,2));
 geo.setAttribute('color',new T.BufferAttribute(col,3));
 geo.setAttribute('animeGreen',new T.BufferAttribute(green,1));
 geo.setAttribute('animeShore',new T.BufferAttribute(shore,2));
 geo.setIndex(idx);geo.computeVertexNormals();geo.computeBoundingSphere();
 // Na borda, a normal (iluminação) é a mesma do terreno detalhado: sem vinco.
 {
  const nrm=geo.attributes.normal,inN=innerGeo.attributes.normal;
  for(let k=0;k<n*n;k++){
   const x=pos[k*3],z=pos[k*3+2],od=outsideDist(x,z);
   if(od>6||!inN)continue;
   const t=sm(0,6,od),ex=clamp(x,INNER.x0,INNER.x1),ez=clamp(z,INNER.z0,INNER.z1);
   const nx=innerSample(inN,ex,ez,0)*(1-t)+nrm.getX(k)*t,ny=innerSample(inN,ex,ez,1)*(1-t)+nrm.getY(k)*t,nz=innerSample(inN,ex,ez,2)*(1-t)+nrm.getZ(k)*t;
   const l=Math.hypot(nx,ny,nz)||1;nrm.setXYZ(k,nx/l,ny/l,nz/l);
  }
  nrm.needsUpdate=true;
 }
 // Mesmo material do solo detalhado: emenda sem diferença de cor/estilo.
 const land=new T.Mesh(geo,api.terrain.material);
 land.name='Ilha Central · terreno';land.receiveShadow=true;
 scene.add(land);
 const fine=new Map();let fineGeoPos=null;   // índice global (I,J) -> vértice da malha detalhada
 {
  const P=[],UV=[],CO=[],GR=[],SH=[],NR=[],fixedN=[],ix=[];
  const mN=geo.attributes.normal;
  const tU=new Float32Array(2),tC=new Float32Array(3),tG=new Float32Array(1),tS=new Float32Array(2);
  const vert=(I,J)=>{
   const key=I*65536+J;let v=fine.get(key);if(v!=null)return v;
   const i=Math.floor(I/SUB),j=Math.floor(J/SUB),si=I-i*SUB,sj=J-j*SUB,x=x0+I*SS,z=z0+J*SS;
   v=P.length/3;fine.set(key,v);
   let ka=-1,kb=-1,t=0;
   if(si===0&&sj===0){ka=kb=j*n+i;}
   else if(si===0&&!(isRef(i-1,j)&&isRef(i,j))){ka=j*n+i;kb=ka+n;t=sj/SUB;}
   else if(sj===0&&!(isRef(i,j-1)&&isRef(i,j))){ka=j*n+i;kb=ka+1;t=si/SUB;}
   if(ka>=0){
    const L=(arr,sz,c)=>arr[ka*sz+c]*(1-t)+arr[kb*sz+c]*t;
    P.push(x,L(pos,3,1),z);UV.push(L(uv,2,0),L(uv,2,1));CO.push(L(col,3,0),L(col,3,1),L(col,3,2));GR.push(L(green,1,0));SH.push(L(shore,2,0),L(shore,2,1));
    const nx=mN.getX(ka)*(1-t)+mN.getX(kb)*t,ny=mN.getY(ka)*(1-t)+mN.getY(kb)*t,nz=mN.getZ(ka)*(1-t)+mN.getZ(kb)*t,l=Math.hypot(nx,ny,nz);
    if(l>.5)fixedN.push([v,nx/l,ny/l,nz/l]); // normal da malha normal (se ela ainda desenha ali)
   }else{
    const y=height(x,z);vAttr(x,z,y,0,tU,tC,tG,tS);
    P.push(x,y,z);UV.push(tU[0],tU[1]);CO.push(tC[0],tC[1],tC[2]);GR.push(tG[0]);SH.push(tS[0],tS[1]);
   }
   return v;
  };
  for(let j=0;j<NC;j++)for(let i=0;i<NC;i++){
   if(!refined[j*NC+i])continue;
   for(let sj=0;sj<SUB;sj++)for(let si=0;si<SUB;si++){
    const I=i*SUB+si,J=j*SUB+sj,a=vert(I,J),b=vert(I+1,J),c=vert(I,J+1),d=vert(I+1,J+1);
    ix.push(a,c,b,b,c,d);
   }
  }
  const fg=new T.BufferGeometry();
  fg.setAttribute('position',new T.Float32BufferAttribute(P,3));fg.setAttribute('uv',new T.Float32BufferAttribute(UV,2));
  fg.setAttribute('color',new T.Float32BufferAttribute(CO,3));fg.setAttribute('animeGreen',new T.Float32BufferAttribute(GR,1));
  fg.setAttribute('animeShore',new T.Float32BufferAttribute(SH,2));fg.setIndex(ix);fg.computeVertexNormals();
  const fn=fg.attributes.normal;for(const [v,nx,ny,nz] of fixedN)fn.setXYZ(v,nx,ny,nz);fn.needsUpdate=true;
  fg.computeBoundingSphere();
  fineGeoPos=fg.attributes.position.array;const fm=new T.Mesh(fg,api.terrain.material);fm.name='Ilha Central · terreno perto da água';fm.receiveShadow=true;scene.add(fm);
 }
 // Costura: cada ponto da borda da área detalhada (a cada ~45 cm) é ligado
 // por triângulos ao anel de pontos da ilha (a cada 2 m). Malha fechada, sem
 // frestas, degraus ou paredes — o terreno vira uma superfície só.
 {
  const iPos=innerGeo.attributes.position,iNrm=innerGeo.attributes.normal,iUv=innerGeo.attributes.uv,
   iCol=innerGeo.attributes.color,iGr=innerGeo.attributes.animeGreen,iSh=innerGeo.attributes.animeShore,oNrm=geo.attributes.normal;
  const oIdx=(x,z)=>Math.round((z-z0)/STEP)*n+Math.round((x-x0)/STEP);
  const verts=[],map=new Map();
  const vid=(src,k)=>{const key=src+k;if(map.has(key))return map.get(key);map.set(key,verts.length);verts.push([src,k]);return verts.length-1;};
  const tris=[];
  const zip=(A,B,sa,sb)=>{
   let i=0,j=0;
   while(i<A.length-1||j<B.length-1){
    if(j>=B.length-1||(i<A.length-1&&sa[i+1]<=sb[j+1])){tris.push([['I',A[i]],['I',A[i+1]],['O',B[j]]]);i++;}
    else{tris.push([['I',A[i]],['O',B[j+1]],['O',B[j]]]);j++;}
   }
  };
  const X0=INNER.x0,X1=INNER.x1,Z0=INNER.z0,Z1=INNER.z1,E=STEP;
  const outerLine=(fixed,axis,from,to)=>{const out=[];for(let v=from;v<=to+1e-6;v+=E)out.push(axis==='x'?oIdx(v,fixed):oIdx(fixed,v));return out;};
  const param=(arr,get,lo,hi)=>arr.map(k=>(get(k)-lo)/(hi-lo));
  const ix=k=>iPos.getX(k),iz=k=>iPos.getZ(k),ox=k=>pos[k*3],oz=k=>pos[k*3+2];
  // 4 lados (cantos compartilhados entre lados consecutivos).
  let A=[],B;
  A=[];for(let i=0;i<INX;i++)A.push(i);B=outerLine(Z0-E,'x',X0-E,X1+E);
  zip(A,B,param(A,ix,X0,X1),param(B,ox,X0-E,X1+E));
  A=[];for(let j=0;j<INZ;j++)A.push(j*INX+INX-1);B=outerLine(X1+E,'z',Z0-E,Z1+E);
  zip(A,B,param(A,iz,Z0,Z1),param(B,oz,Z0-E,Z1+E));
  A=[];for(let i=0;i<INX;i++)A.push((INZ-1)*INX+i);B=outerLine(Z1+E,'x',X0-E,X1+E);
  zip(A,B,param(A,ix,X0,X1),param(B,ox,X0-E,X1+E));
  A=[];for(let j=0;j<INZ;j++)A.push(j*INX);B=outerLine(X0-E,'z',Z0-E,Z1+E);
  zip(A,B,param(A,iz,Z0,Z1),param(B,oz,Z0-E,Z1+E));
  const indices=[];
  for(const t of tris)indices.push(vid(...t[0]),vid(...t[1]),vid(...t[2]));
  const N=verts.length,P=new Float32Array(N*3),NM=new Float32Array(N*3),U=new Float32Array(N*2),CO=new Float32Array(N*3),GR=new Float32Array(N),SH=new Float32Array(N*2);
  verts.forEach(([src,k],v)=>{
   if(src==='I'){
    P.set([iPos.getX(k),iPos.getY(k),iPos.getZ(k)],v*3);NM.set([iNrm.getX(k),iNrm.getY(k),iNrm.getZ(k)],v*3);
    U.set([iUv.getX(k),iUv.getY(k)],v*2);CO.set([iCol.getX(k),iCol.getY(k),iCol.getZ(k)],v*3);
    GR[v]=iGr?iGr.getX(k):0;SH.set(iSh?[iSh.getX(k),iSh.getY(k)]:[99,9],v*2);
   }else{
    P.set([pos[k*3],pos[k*3+1],pos[k*3+2]],v*3);NM.set([oNrm.getX(k),oNrm.getY(k),oNrm.getZ(k)],v*3);
    U.set([uv[k*2],uv[k*2+1]],v*2);CO.set([col[k*3],col[k*3+1],col[k*3+2]],v*3);
    GR[v]=green[k];SH.set([shore[k*2],shore[k*2+1]],v*2);
   }
  });
  // Triângulos virados para cima.
  for(let t=0;t<indices.length;t+=3){
   const a=indices[t]*3,b=indices[t+1]*3,c=indices[t+2]*3;
   const ux=P[b]-P[a],uz=P[b+2]-P[a+2],vx=P[c]-P[a],vz=P[c+2]-P[a+2];
   if(uz*vx-ux*vz<0){const tmp=indices[t+1];indices[t+1]=indices[t+2];indices[t+2]=tmp;}
  }
  const sg=new T.BufferGeometry();
  sg.setAttribute('position',new T.BufferAttribute(P,3));sg.setAttribute('normal',new T.BufferAttribute(NM,3));
  sg.setAttribute('uv',new T.BufferAttribute(U,2));sg.setAttribute('color',new T.BufferAttribute(CO,3));
  sg.setAttribute('animeGreen',new T.BufferAttribute(GR,1));sg.setAttribute('animeShore',new T.BufferAttribute(SH,2));
  sg.setIndex(indices);sg.computeBoundingSphere();
  const stitch=new T.Mesh(sg,api.terrain.material);stitch.name='Costura do terreno';stitch.receiveShadow=true;
  scene.add(stitch);
 }

 // Altura para o personagem andar (mesma grade da malha).
 window.arcanoIslandHeight=(x,z)=>{
  const fi=clamp((x-x0)/STEP,0,n-1.001),fj=clamp((z-z0)/STEP,0,n-1.001);
  const i=Math.floor(fi),j=Math.floor(fj),u=fi-i,v=fj-j,k=j*n+i;
  if(i<NC&&j<NC&&refined[j*NC+i]){
   const FI=fi*SUB,FJ=fj*SUB,I=Math.min(Math.floor(FI),i*SUB+SUB-1),J=Math.min(Math.floor(FJ),j*SUB+SUB-1),uu=FI-I,vv=FJ-J;
   const fp=fineGeoPos,g=(a,b)=>fp[fine.get(a*65536+b)*3+1];
   const h00=g(I,J),h10=g(I+1,J),h01=g(I,J+1),h11=g(I+1,J+1);
   if(uu+vv<=1)return h00+(h10-h00)*uu+(h01-h00)*vv;
   return h11+(h01-h11)*(1-uu)+(h10-h11)*(1-vv);
  }
  // Mesma divisão em triângulos da malha (a,c,b / b,c,d): o pé fica exatamente
  // na superfície desenhada, sem afundar em encostas íngremes.
  const h00=heights[k],h10=heights[k+1],h01=heights[k+n],h11=heights[k+n+1];
  if(u+v<=1)return h00+(h10-h00)*u+(h01-h00)*v;
  return h11+(h01-h11)*(1-u)+(h10-h11)*(1-v);
 };
 // Quanto o chão é gramado (0..1) — usado pela grama 3D da ilha.
 window.arcanoIslandGreen=(x,z)=>{
  const fi=clamp((x-x0)/STEP,0,n-1.001),fj=clamp((z-z0)/STEP,0,n-1.001);
  const i=Math.floor(fi),j=Math.floor(fj),u=fi-i,v=fj-j,k=j*n+i;
  return green[k]*(1-u)*(1-v)+green[k+1]*u*(1-v)+green[k+n]*(1-u)*v+green[k+n+1]*u*v;
 };
 window.arcanoIslandClamp=(x,z)=>{
  const dx=x-C.x,dz=z-C.z,d=Math.hypot(dx,dz),max=R-7; // antes do paredão de pedras
  if(d<=max)return [x,z];
  return [C.x+dx/d*max,C.z+dz/d*max];
 };

 // As paredes de "horizontes do solo" nas bordas da área detalhada
 // apareciam como um corte no meio da ilha: ficam ocultas.
 // Também somem: as paredes translúcidas que fechavam o volume da água nas pontas
 // do rio (pareciam um corte) e as pegadas de lama antigas (pontos pretos).
 scene.traverse(o=>{if(o.name&&(o.name.startsWith('Horizontes O/A/B/C')||o.name.startsWith('Volume fechado entre o leito')||o.name.startsWith('Pegadas de lama')))o.visible=false;});

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
  // Pedras pontiagudas ao longo da borda (maiores que o personagem), inclinadas
  // para fora; uma abertura onde o rio cai. Também impedem de cair da ilha.
  {
   const sg=new T.ConeGeometry(1,1,7,4);sg.translate(0,.5,0);
   const sp=sg.attributes.position,vv=new T.Vector3();
   for(let i=0;i<sp.count;i++){
    vv.fromBufferAttribute(sp,i);
    const k=1+.22*Math.sin(vv.x*5.1+vv.y*3.3)+.15*Math.sin(vv.z*6.7-vv.y*2.1);
    vv.x*=k;vv.z*=k;vv.x+=.12*Math.sin(vv.y*3.)*vv.y;sp.setXYZ(i,vv.x,vv.y,vv.z);
   }
   sg.computeVertexNormals();
   const exitZ=(()=>{let z=INNER.z1;while(Math.hypot(river.center(z)-C.x,z-C.z)<R-1&&z<C.z+R)z+=.5;return z;})();
   const exitA=Math.atan2(exitZ-C.z,river.center(exitZ)-C.x),gap=(half(exitZ)+3)/R;
   // Paredão contínuo: pedras encostadas umas nas outras formam o limite da ilha.
   const COUNT=mobile?1100:1800,list=[];
   for(let i=0;i<COUNT;i++){
    const a=i/COUNT*Math.PI*2+(rnd()-.5)*.006;
    if(Math.abs(Math.atan2(Math.sin(a-exitA),Math.cos(a-exitA)))<gap)continue;
    const inner=i%2===0,r=inner?R-4.5-rnd()*1.5:R-1.8+rnd()*2;
    const x=C.x+Math.cos(a)*r,z=C.z+Math.sin(a)*r;
    const hgt=inner?2.2+rnd()*2.4:3.4+rnd()*5.5,rad=(inner?1.3:1.8)+rnd()*1.2;
    list.push({a,x,z,y:window.arcanoIslandHeight(x,z)-.6,hgt,rad,tilt:.08+rnd()*.3,ry:rnd()*6.28});
    if(window.arcanoObstacles)window.arcanoObstacles.addCircle(x,z,rad*.8);
   }
   // Textura própria de rocha cinza (sem musgo): faces facetadas e veios.
   const rc=document.createElement('canvas');rc.width=rc.height=128;const rg=rc.getContext('2d');
   rg.fillStyle='#7e7c7a';rg.fillRect(0,0,128,128);
   for(let k=0;k<26;k++){rg.strokeStyle='rgba('+(40+rnd()*30)+','+(40+rnd()*30)+','+(45+rnd()*30)+',.5)';rg.lineWidth=1+rnd()*2;rg.beginPath();rg.moveTo(rnd()*128,0);rg.lineTo(rnd()*128,128);rg.stroke();}
   for(let k=0;k<300;k++){rg.fillStyle='rgba(255,255,255,'+(rnd()*.08)+')';rg.fillRect(rnd()*128,rnd()*128,2,2);}
   const rt=new T.CanvasTexture(rc);rt.wrapS=rt.wrapT=T.RepeatWrapping;rt.colorSpace=T.SRGBColorSpace;
   const spikes=new T.InstancedMesh(sg,new T.MeshStandardMaterial({color:'#b7b4b0',map:rt,roughness:1,flatShading:true}),list.length);
   spikes.name='Paredão de rocha da borda da ilha';
   const m=new T.Matrix4(),q=new T.Quaternion(),qy=new T.Quaternion(),axis=new T.Vector3(),pp=new T.Vector3(),sc=new T.Vector3();
   list.forEach((s,i)=>{
    axis.set(-Math.sin(s.a),0,Math.cos(s.a));
    q.setFromAxisAngle(axis,-s.tilt).multiply(qy.setFromAxisAngle(new T.Vector3(0,1,0),s.ry));
    m.compose(pp.set(s.x,s.y,s.z),q,sc.set(s.rad,s.hgt,s.rad*(.8+rnd()*.4)));
    spikes.setMatrixAt(i,m);
   });
   spikes.instanceMatrix.needsUpdate=true;spikes.castShadow=!mobile;spikes.receiveShadow=true;
   if(spikes.computeBoundingSphere)spikes.computeBoundingSphere();else spikes.frustumCulled=false;
   scene.add(spikes);
  }
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
  const shareMat=(fallZ,fallTop=-999,fallDrop=1)=>{
   const m=riverMat.clone();
   for(const key of Object.keys(u))m.uniforms[key]=u[key];
   m.uniforms.uFallZ={value:fallZ};m.uniforms.uFallTop={value:fallTop};m.uniforms.uFallDrop={value:fallDrop};
   m.extensions.derivatives=true;
   return m;
  };
  // Faixa de água seguindo o rio (ou reta), com queda opcional no fim.
  function ribbon(zA,zB,levelFn,centerFn,widthFn,fallDepth){
   const COLS=11,rows=[];
   for(let z=zA;z<=zB+.01;z+=.5)rows.push({z,fall:0});
   if(fallDepth){for(let f=1;f<=60;f++)rows.push({z:zB+.25+f*.008,fall:Math.pow(f/60,1.6)});}
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
     // Mesma velocidade da correnteza do rio da área detalhada.
     flow[k*2]=.52*turn/nrm;flow[k*2+1]=.52/nrm;
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
  // O próprio rio dobra na borda e cai (um elemento só com o rio).
  const south=new T.Mesh(ribbon(INNER.z1,zEdge,river.levelAt,river.center,half,150),shareMat(zEdge+.45,river.levelAt(zEdge),150));
  // Queda da borda da ilha com volume (parede de trás e laterais da mesma água).
  if(window.arcanoFallShell){
   const lv=river.levelAt(zEdge),rows=[{y:lv-.01,z:zEdge}];
   for(let f=4;f<=60;f+=4)rows.push({y:lv-Math.pow(f/60,1.6)*150,z:zEdge+.25+f*.008});
   window.arcanoFallShell(south.material,rows,river.center(zEdge),half(zEdge)*.98,.3,'Volume da queda da borda');
  }

  south.name='Rio da Ilha Central · até a borda';south.frustumCulled=false;south.renderOrder=3;
  scene.add(south);
  // Nascente, afluentes, lago e canal numa ÚNICA superfície d'água (uma malha
  // só, nível contínuo): os braços do rio se juntam ao lago sem emenda nem
  // duas águas diferentes. A borda some sozinha onde o chão fica acima d'água.
  {
   let xA=LAKE.x-LAKE.rx-6,xB=LAKE.x+LAKE.rx+6,zA=LAKE.z-LAKE.rz-4;const zB=INNER.z0,S=.7;
   for(const s of STREAMS){xA=Math.min(xA,s.box[0]+6);xB=Math.max(xB,s.box[1]-6);zA=Math.min(zA,s.box[2]+6);}
   const nx=Math.round((xB-xA)/S)+1,nz=Math.round((zB-zA)/S)+1;
   const p=new Float32Array(nx*nz*3),uvA=new Float32Array(nx*nz*2),dep=new Float32Array(nx*nz),fl=new Float32Array(nx*nz*2),ok=new Uint8Array(nx*nz),ix=[],lev=new Float32Array(nx*nz),sidA=new Int8Array(nx*nz);
   for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
    const k=j*nx+i,x=xA+i*S,z=Math.min(zB,zA+j*S),w=pondWater(x,z);
    p[k*3]=x;p[k*3+2]=z;uvA[k*2]=i/(nx-1);uvA[k*2+1]=j/(nz-1);
    if(!w){p[k*3+1]=LAKE.y;continue;}
    ok[k]=1;p[k*3+1]=w.level+.003;lev[k]=w.level;sidA[k]=w.sid;
    dep[k]=Math.max(0,w.level-window.arcanoIslandHeight(x,z));
    fl[k*2]=w.fx;fl[k*2+1]=w.fz;
   }
   // Célula molhada: os 4 cantos com nível definido, alguma profundidade e sem
   // degrau (cantos de braços diferentes com níveis distintos viravam paredes).
   const CN=(nx-1)*(nz-1),wet=new Uint8Array(CN),seen=new Uint8Array(CN);
   for(let j=0;j<nz-1;j++)for(let i=0;i<nx-1;i++){
    const a=j*nx+i,b=a+1,c=a+nx,d=c+1;
    if(!(ok[a]&&ok[b]&&ok[c]&&ok[d]))continue;
    if(dep[a]+dep[b]+dep[c]+dep[d]<=0)continue;
    const lo=Math.min(lev[a],lev[b],lev[c],lev[d]),hi=Math.max(lev[a],lev[b],lev[c],lev[d]);
    const same=sidA[a]===sidA[b]&&sidA[a]===sidA[c]&&sidA[a]===sidA[d];
    if(hi-lo>(same?1.2:.25))continue;
    wet[j*(nx-1)+i]=1;
   }
   // Só a água ligada ao corpo principal (poças soltas na margem eram os 'vazamentos').
   const q=[];
   for(let c=0;c<CN;c++){if(!wet[c])continue;const i=c%(nx-1),j=(c/(nx-1))|0,a=j*nx+i;if(dep[a]+dep[a+1]+dep[a+nx]+dep[a+nx+1]>1.0){seen[c]=1;q.push(c);}}
   while(q.length){const c=q.pop(),i=c%(nx-1),j=(c/(nx-1))|0;
    for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=nx-1||jj>=nz-1)continue;const n=jj*(nx-1)+ii;if(wet[n]&&!seen[n]){seen[n]=1;q.push(n);}}}
   for(let c=0;c<CN;c++){if(!seen[c])continue;const i=c%(nx-1),j=(c/(nx-1))|0,a=j*nx+i,b=a+1,cc=a+nx,d=cc+1;ix.push(a,cc,b,b,cc,d);}
   const lg=new T.BufferGeometry();
   lg.setAttribute('position',new T.BufferAttribute(p,3));lg.setAttribute('uv',new T.BufferAttribute(uvA,2));
   lg.setAttribute('waterDepth',new T.BufferAttribute(dep,1));lg.setAttribute('waterFlow',new T.BufferAttribute(fl,2));
   lg.setIndex(ix);
   const lake=new T.Mesh(lg,shareMat(-9999));lake.name='Lago da nascente';lake.frustumCulled=false;lake.renderOrder=3;
   scene.add(lake);
  }
  {
   const P=stream.pts;
   // Rochas em volta da nascente.
   const rg=new T.SphereGeometry(1,14,10);const rp=rg.attributes.position,vv=new T.Vector3();
   for(let i=0;i<rp.count;i++){vv.fromBufferAttribute(rp,i);vv.multiplyScalar(1+.2*Math.sin(vv.x*4+vv.z*3));vv.y*=.75;rp.setXYZ(i,vv.x,vv.y,vv.z);}
   rg.computeVertexNormals();
   for(let k=0;k<9;k++){
    const a=k/9*Math.PI*2+.3;if(Math.abs(Math.atan2(Math.sin(a-Math.atan2(P[3].z-P[0].z,P[3].x-P[0].x)),Math.cos(a-Math.atan2(P[3].z-P[0].z,P[3].x-P[0].x))))<.5)continue;
    const r=new T.Mesh(rg,new T.MeshStandardMaterial({color:'#aaa59c',roughness:1}));
    const x=stream.spring.x+Math.cos(a)*5.6,z=stream.spring.z+Math.sin(a)*5.6,s=1.2+rnd()*1.4;
    r.position.set(x,window.arcanoIslandHeight(x,z)-.3,z);r.scale.set(s,s*(1+rnd()*.8),s);r.name='Pedra da nascente';scene.add(r);if(window.arcanoObstacles)window.arcanoObstacles.addCircle(x,z,s*1.1);
   }
  }
 }

 // ---------- Demarcação da cidade Aurora ----------
 const stone=new T.MeshStandardMaterial({color:'#cfc8bb',roughness:1});
 // Muralha de Aurora no estilo Mondstadt: muralha alta com ameias e passarela,
 // torres redondas, estandartes e um GRANDE PORTÃO de entrada ao sul.
 {
  const O=window.arcanoObstacles;
  const stoneTex=(()=>{
   const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
   g.fillStyle='#5c6068';g.fillRect(0,0,256,256);
   for(let r=0;r<8;r++){let x=-rnd()*40;const y=r*32;
    while(x<256){const w=34+rnd()*40,l=52+rnd()*14;g.fillStyle=`hsl(222,${6+rnd()*7}%,${l}%)`;
     g.beginPath();if(g.roundRect)g.roundRect(x+2,y+2,w-4,28,4);else g.rect(x+2,y+2,w-4,28);g.fill();
     g.fillStyle='rgba(255,255,255,.06)';g.fillRect(x+4,y+4,w-8,5);x+=w;}}
   const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
  })();
  const wallMat=new T.MeshStandardMaterial({color:'#e6e8ee',map:stoneTex,roughness:1});
  const darkMat=new T.MeshStandardMaterial({color:'#2a2a33',roughness:1});
  const roofMat=new T.MeshStandardMaterial({color:'#3b7a8a',roughness:1});
  const woodMat=new T.MeshStandardMaterial({color:'#6b4630',roughness:1});
  const lampMat=new T.MeshStandardMaterial({color:'#ffe2a0',emissive:new T.Color('#ffc766'),emissiveIntensity:.6});
  const bannerTex=(()=>{
   const c=document.createElement('canvas');c.width=128;c.height=320;const g=c.getContext('2d');
   g.fillStyle='#a8322d';g.fillRect(0,0,128,320);
   g.fillStyle='#e8c56a';g.fillRect(0,0,128,14);g.fillRect(10,0,6,300);g.fillRect(112,0,6,300);
   g.beginPath();g.arc(64,120,30,0,6.3);g.fill();g.fillStyle='#a8322d';g.beginPath();g.arc(64,120,20,0,6.3);g.fill();
   g.fillStyle='#e8c56a';g.beginPath();g.moveTo(64,96);g.lineTo(76,128);g.lineTo(64,150);g.lineTo(52,128);g.closePath();g.fill();
   const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
  })();
  const bannerMat=new T.MeshStandardMaterial({map:bannerTex,side:T.DoubleSide,roughness:1});
  const boxUV=(geo,w,h,d,tile)=>{const uv=geo.attributes.uv,F=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];for(let f=0;f<6;f++)for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,uv.getX(i)*F[f][0]/tile,uv.getY(i)*F[f][1]/tile);}return geo;};
  const WALL_H=11,BASE=4,THK=3.2,GATE_A=Math.PI/2,GATE_HALF=9.5/CITY_R;
  const ang=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
  const towerAngles=[];for(let i=0;i<10;i++)towerAngles.push(GATE_A+Math.PI/10+i*(2*Math.PI-Math.PI/5)/9);
  // Paredão em segmentos.
  const segLen=4,count=Math.floor(2*Math.PI*CITY_R/segLen),H=WALL_H+BASE;
  const wallGeo=boxUV(new T.BoxGeometry(segLen*1.04,H,THK),segLen,H,THK,3.2);
  const walls=new T.InstancedMesh(wallGeo,wallMat,count);walls.name='Muralha de Aurora';
  const merlonGeo=boxUV(new T.BoxGeometry(1.3,1.7,.9),1.3,1.7,.9,3.2);
  const merlons=new T.InstancedMesh(merlonGeo,wallMat,count*2);merlons.name='Ameias da muralha';
  const parapet=new T.InstancedMesh(boxUV(new T.BoxGeometry(segLen*1.04,1,.6),segLen,1,.6,3.2),wallMat,count);
  const M4=new T.Matrix4(),Q=new T.Quaternion(),E=new T.Euler(),P=new T.Vector3(),S=new T.Vector3(1,1,1);
  let wi=0,mi=0,pi=0;
  for(let i=0;i<count;i++){
   const a=(i+.5)/count*Math.PI*2;
   if(ang(a,GATE_A)<GATE_HALF+.02)continue;
   const rot=-a+Math.PI/2,x=C.x+Math.cos(a)*CITY_R,z=C.z+Math.sin(a)*CITY_R;
   M4.compose(P.set(x,CITY_Y-BASE+H/2,z),Q.setFromEuler(E.set(0,rot,0)),S);walls.setMatrixAt(wi++,M4);
   for(const k of [-.25,.25]){
    const aa=a+k*segLen/CITY_R,ro=CITY_R+THK/2-.45;
    M4.compose(P.set(C.x+Math.cos(aa)*ro,CITY_Y+WALL_H+.85,C.z+Math.sin(aa)*ro),Q,S);merlons.setMatrixAt(mi++,M4);
   }
   const ri=CITY_R-THK/2+.3;
   M4.compose(P.set(C.x+Math.cos(a)*ri,CITY_Y+WALL_H+.5,C.z+Math.sin(a)*ri),Q,S);parapet.setMatrixAt(pi++,M4);
   if(O)O.addBox({x,z,hw:segLen*.52,hd:THK/2,rot});
  }
  walls.count=wi;merlons.count=mi;parapet.count=pi;
  for(const im of [walls,merlons,parapet]){im.castShadow=true;im.receiveShadow=true;im.instanceMatrix.needsUpdate=true;if(im.computeBoundingSphere)im.computeBoundingSphere();else im.frustumCulled=false;scene.add(im);}
  // Torre redonda com coroa de ameias (e telhado opcional).
  const towerMerlon=boxUV(new T.BoxGeometry(1.2,1.6,.9),1.2,1.6,.9,3.2);
  function tower(x,z,r,h,roof){
   const g=new T.Group();g.position.set(x,CITY_Y-BASE,z);
   const body=new T.Mesh(new T.CylinderGeometry(r,r*1.1,h+BASE,24),wallMat);body.position.y=(h+BASE)/2;
   const bu=body.geometry.attributes.uv;for(let i=0;i<bu.count;i++)bu.setXY(i,bu.getX(i)*2*Math.PI*r/3.2,bu.getY(i)*(h+BASE)/3.2);
   const crown=new T.Mesh(new T.CylinderGeometry(r+.8,r+.3,1.4,24),wallMat);crown.position.y=h+BASE+.2;
   g.add(body,crown);
   const nm=Math.round(r*2.6);
   for(let k=0;k<nm;k++){const a=k/nm*Math.PI*2;const mm=new T.Mesh(towerMerlon,wallMat);mm.position.set(Math.cos(a)*(r+.4),h+BASE+1.7,Math.sin(a)*(r+.4));mm.rotation.y=-a+Math.PI/2;g.add(mm);}
   for(let k=0;k<4;k++){const a=k/4*Math.PI*2+.4;const sl=new T.Mesh(new T.BoxGeometry(.35,1.6,.3),darkMat);sl.position.set(Math.cos(a)*(r+.02),BASE+h*.6,Math.sin(a)*(r+.02));sl.rotation.y=-a+Math.PI/2;g.add(sl);}
   if(roof){const cone=new T.Mesh(new T.ConeGeometry(r+1.2,r*1.5,24),roofMat);cone.position.y=h+BASE+1+r*.75;g.add(cone);}
   g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
   g.name='Torre da muralha';scene.add(g);
   if(O)O.addCircle(x,z,r+.3);
   return g;
  }
  for(const a of towerAngles)tower(C.x+Math.cos(a)*CITY_R,C.z+Math.sin(a)*CITY_R,5,WALL_H+3,false);
  // Estandartes vermelhos pendurados na face externa de algumas torres.
  towerAngles.forEach((a,i)=>{
   if(i%2)return;
   const ro=CITY_R+5.2,b=new T.Mesh(new T.PlaneGeometry(2.4,6),bannerMat);
   b.position.set(C.x+Math.cos(a)*ro,CITY_Y+WALL_H-2,C.z+Math.sin(a)*ro);b.rotation.y=Math.atan2(Math.cos(a),Math.sin(a));scene.add(b);
  });
  // ---------- Grande portão (sul) ----------
  {
   const gx=C.x+Math.cos(GATE_A)*CITY_R,gz=C.z+Math.sin(GATE_A)*CITY_R,rotY=Math.atan2(Math.cos(GATE_A),Math.sin(GATE_A));
   const G=new T.Group();G.position.set(gx,CITY_Y,gz);G.rotation.y=rotY;G.name='Grande portão de Aurora';scene.add(G);
   const GW=19,GH=WALL_H+4,GD=9,AW=7.5,AH=7.5;
   const shape=new T.Shape();
   shape.moveTo(-GW/2,-BASE);shape.lineTo(GW/2,-BASE);shape.lineTo(GW/2,GH);shape.lineTo(-GW/2,GH);shape.lineTo(-GW/2,-BASE);
   const hole=new T.Path();hole.moveTo(-AW/2,0);hole.lineTo(AW/2,0);hole.lineTo(AW/2,AH);hole.absarc(0,AH,AW/2,0,Math.PI,false);hole.lineTo(-AW/2,0);
   shape.holes.push(hole);
   const gg=new T.ExtrudeGeometry(shape,{depth:GD,bevelEnabled:false});gg.translate(0,0,-GD/2);
   const gu=gg.attributes.uv;for(let i=0;i<gu.count;i++)gu.setXY(i,gu.getX(i)/3.2,gu.getY(i)/3.2);
   const body=new T.Mesh(gg,wallMat);body.castShadow=true;body.receiveShadow=true;G.add(body);
   // Pedras do arco (aduelas) e ameias do topo.
   for(let k=0;k<=12;k++){
    const t=Math.PI*k/12,v=new T.Mesh(boxUV(new T.BoxGeometry(1.1,1.2,GD+.3),1.1,1.2,GD,3.2),wallMat);
    v.position.set(Math.cos(t)*(AW/2+.4),AH+Math.sin(t)*(AW/2+.4),0);v.rotation.z=t-Math.PI/2;G.add(v);
   }
   for(let k=0;k<8;k++)for(const zz of [GD/2-.45,-GD/2+.45]){const mm=new T.Mesh(merlonGeo,wallMat);mm.position.set(-GW/2+1.2+k*(GW-2.4)/7,GH+.85,zz);G.add(mm);}
   // Portas de madeira abertas para dentro.
   for(const side of [-1,1]){
    const hinge=new T.Group();hinge.position.set(side*AW/2,0,-GD/2+.6);G.add(hinge);
    const leaf=new T.Mesh(new T.BoxGeometry(AW/2,AH+1.6,.35),woodMat);leaf.position.set(-side*AW/4,(AH+1.6)/2,0);hinge.add(leaf);
    for(const y of [1.2,AH*.55,AH]){const band=new T.Mesh(new T.BoxGeometry(AW/2-.1,.22,.42),darkMat);band.position.set(-side*AW/4,y,0);hinge.add(band);}
    hinge.rotation.y=side*1.25;
   }
   // Grade levadiça erguida (aparece no alto do arco).
   for(let k=0;k<7;k++){const bar=new T.Mesh(new T.BoxGeometry(.16,2.4,.16),darkMat);bar.position.set(-AW/2+.5+k*(AW-1)/6,AH+AW/2-1.6,GD/2-1.2);G.add(bar);}
   // Estandartes grandes e lanternas na fachada.
   for(const side of [-1,1]){
    const b=new T.Mesh(new T.PlaneGeometry(2.8,7.5),bannerMat);b.position.set(side*(AW/2+2.6),GH-5,GD/2+.06);G.add(b);
    const lamp=new T.Mesh(new T.BoxGeometry(.5,.7,.5),lampMat);lamp.position.set(side*(AW/2+1.1),4.2,GD/2+.5);G.add(lamp);
   }
   // Torres do portão, mais altas e com telhado.
   for(const side of [-1,1]){
    const lx=side*(GW/2+3.8),wx=gx+lx*Math.cos(rotY),wz=gz-lx*Math.sin(rotY);
    tower(wx,wz,6,WALL_H+9,true);
   }
   // Colisão: blocos laterais do portão (a passagem sob o arco fica livre).
   if(O)for(const side of [-1,1]){
    const lx=side*(AW/2+(GW-AW)/4),wx=gx+lx*Math.cos(rotY),wz=gz-lx*Math.sin(rotY);
    O.addBox({x:wx,z:wz,hw:(GW-AW)/4,hd:GD/2,rot:rotY});
   }
   setInterval(()=>{const s=window.arcanoAnimeSky&&window.arcanoAnimeSky.material.uniforms.uSunDir.value;const night=s?Math.min(1,Math.max(0,(-s.y+.02)/.2)):0;lampMat.emissiveIntensity=.6+night*1.8;},1000);
  }
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
  // Meio-fio de pedra nas duas bordas do piso (sem fresta entre piso e chão).
  for(const r of [CASTLE_R+27,CITY_R-1.2]){
   const curb=new T.Mesh(new T.CylinderGeometry(r,r,1.1,160,1,true),new T.MeshStandardMaterial({color:'#9b958b',roughness:1,side:T.DoubleSide}));
   curb.position.set(C.x,CITY_Y-.48,C.z);curb.name='Pedra do meio-fio da cidade';curb.receiveShadow=true;scene.add(curb);
  }
 }
 // ---------- Estradas calçadas estilizadas ----------
 {
  const cv=document.createElement('canvas');cv.width=256;cv.height=256;
  const g=cv.getContext('2d');
  // Bordas transparentes (terra/grama aparecem), centro com pedras irregulares.
  const grad=g.createLinearGradient(0,0,256,0);
  grad.addColorStop(0,'rgba(150,120,80,0)');grad.addColorStop(.14,'rgba(150,120,80,.85)');
  grad.addColorStop(.86,'rgba(150,120,80,.85)');grad.addColorStop(1,'rgba(150,120,80,0)');
  g.fillStyle=grad;g.fillRect(0,0,256,256);
  for(let k=0;k<70;k++){
   const x=40+rnd()*176,y=rnd()*256,w=14+rnd()*16,h=11+rnd()*12,l=60+rnd()*14;
   g.fillStyle=`hsl(${32+rnd()*12},${12+rnd()*10}%,${l}%)`;
   g.beginPath();g.ellipse(x,y,w/2,h/2,rnd()*3,0,6.3);g.fill();
   g.strokeStyle='rgba(70,55,40,.45)';g.lineWidth=2;g.stroke();
   if(y<20||y>236){g.beginPath();g.ellipse(x,y+(y<20?256:-256),w/2,h/2,0,0,6.3);g.fill();g.stroke();}
  }
  const tex=new T.CanvasTexture(cv);tex.wrapS=T.ClampToEdgeWrapping;tex.wrapT=T.RepeatWrapping;tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
  const mat=new T.MeshStandardMaterial({map:tex,transparent:true,depthWrite:false,roughness:1,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});
  const groundAt=(x,z)=>(Math.abs(x)<INNER.x1-.3&&Math.abs(z)<INNER.z1-.3)?ground.heightAt(x,z):window.arcanoIslandHeight(x,z);
  const bridge=window.arcanoBridgeSolid;
  const lines=roads.map(l=>({pts:l,w:2.4}));
  {const pts=[];for(let x=INNER.x0;x<=INNER.x1;x+=1.5)pts.push({x,z:roadZ(x)});lines.push({pts,w:1.7});}
  const pos=[],uvs=[],idx=[];
  for(const line of lines){
   // Reamostra a cada 1,2 m.
   const P=[];
   for(let i=0;i<line.pts.length-1;i++){const a=line.pts[i],b=line.pts[i+1],len=Math.hypot(b.x-a.x,b.z-a.z),steps=Math.max(1,Math.ceil(len/1.2));for(let s=0;s<steps;s++)P.push({x:a.x+(b.x-a.x)*s/steps,z:a.z+(b.z-a.z)*s/steps});}
   P.push(line.pts[line.pts.length-1]);
   let along=0,prev=null;
   for(let i=0;i<P.length;i++){
    const p=P[i],q=P[Math.min(P.length-1,i+1)],o=P[Math.max(0,i-1)];
    let tx=q.x-o.x,tz=q.z-o.z;const tl=Math.hypot(tx,tz)||1;tx/=tl;tz/=tl;
    if(prev)along+=Math.hypot(p.x-prev.x,p.z-prev.z);prev=p;
    const onBridge=bridge&&bridge.center&&Math.abs(p.x-bridge.center.x)<bridge.span/2+1&&Math.abs(p.z-bridge.center.z)<3||((streamInfo(p.x,p.z)||{d:99}).d<STREAM_W+1.2); // vau do afluente: sem calçada
    const base=pos.length/3;
    for(let c=0;c<3;c++){
     const off=(c-1)*line.w,x=p.x-tz*off,z=p.z+tx*off;
     pos.push(x,groundAt(x,z)+.05-(onBridge?50:0),z);uvs.push(c/2,along/3);
    }
    if(i>0&&!onBridge){const a=base-3;idx.push(a,base,a+1,a+1,base,base+1,a+1,base+1,a+2,a+2,base+1,base+2);}
   }
  }
  const rg=new T.BufferGeometry();
  rg.setAttribute('position',new T.Float32BufferAttribute(pos,3));rg.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
  rg.setIndex(idx);rg.computeVertexNormals();
  const roadMesh=new T.Mesh(rg,mat);roadMesh.name='Estrada calçada';roadMesh.receiveShadow=true;roadMesh.renderOrder=1;
  scene.add(roadMesh);
 }
 // ---------- Pontes de pedra onde as estradas cruzam os afluentes ----------
 {
  const bridgeMat=new T.MeshStandardMaterial({color:'#c9c0b0',roughness:1});
  const darkMat=new T.MeshStandardMaterial({color:'#8d857a',roughness:1});
  const H=window.arcanoIslandHeight,list=[];
  for(const line of roads){
   const P=[];
   for(let i=0;i<line.length-1;i++){const a=line[i],b=line[i+1],L=Math.hypot(b.x-a.x,b.z-a.z),k=Math.max(1,Math.ceil(L/.5));for(let j=0;j<k;j++)P.push({x:a.x+(b.x-a.x)*j/k,z:a.z+(b.z-a.z)*j/k});}
   let s=-1;
   for(let i=0;i<=P.length;i++){
    const wet=i<P.length&&outsideDist(P[i].x,P[i].z)>2&&((streamInfo(P[i].x,P[i].z)||{d:99}).d<STREAM_W+1.2);
    if(wet&&s<0)s=i;
    if(!wet&&s>=0){const a=P[Math.max(0,s-4)],b=P[Math.min(P.length-1,i+3)];list.push({a,b});s=-1;}
   }
  }
  const grp=new T.Group();
  for(const br of list){
   const dx=br.b.x-br.a.x,dz=br.b.z-br.a.z,L=Math.hypot(dx,dz),tx=dx/L,tz=dz/L,ang=Math.atan2(tx,tz);
   const y0=H(br.a.x,br.a.z),y1=H(br.b.x,br.b.z),RISE=.55+L*.03,HW=2.1;
   const deck=t=>y0+(y1-y0)*t+.12+RISE*Math.sin(Math.PI*clamp(t,0,1));
   const N=Math.ceil(L/.6);
   for(let i=0;i<N;i++){
    const t0=i/N,t1=(i+1)/N,tm=(t0+t1)/2,ya=deck(t0),yb=deck(t1),seg=Math.hypot(L/N,yb-ya);
    const cx=br.a.x+tx*L*tm,cz=br.a.z+tz*L*tm,ym=(ya+yb)/2,tilt=Math.atan2(yb-ya,L/N);
    const add=(w,h,d,m,ox,oy)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),m);b.position.set(cx+tz*ox,ym+oy,cz-tx*ox);b.rotation.set(0,ang,0);b.rotateX(-tilt);b.castShadow=true;b.receiveShadow=true;grp.add(b);};
    add(HW*2,.35,seg+.02,bridgeMat,0,-.17);                        // tabuleiro
    for(const sd of [-1,1]){add(.4,.75,seg+.02,bridgeMat,sd*(HW-.2),.3);add(.5,.12,seg+.04,darkMat,sd*(HW-.2),.72);}
    // Arco por baixo (volume de pedra até perto da água).
    const under=Math.max(.3,ym-(Math.min(y0,y1)-.6));
    if(tm>.12&&tm<.88)add(HW*2-.2,.3,seg,darkMat,0,-.45);
    else add(HW*2,under,seg,darkMat,0,-.35-under/2);
   }
   // Pilaretes com lanterna nas cabeceiras.
   for(const t of [0,1])for(const sd of [-1,1]){
    const x=br.a.x+tx*L*t+tz*sd*(HW-.2),z=br.a.z+tz*L*t-tx*sd*(HW-.2),y=deck(t);
    const p=new T.Mesh(new T.BoxGeometry(.6,1.3,.6),bridgeMat);p.position.set(x,y+.55,z);p.castShadow=true;grp.add(p);
    const c=new T.Mesh(new T.BoxGeometry(.75,.14,.75),darkMat);c.position.set(x,y+1.25,z);grp.add(c);
   }
   // Piso para andar e parapeitos que não deixam cair (quem nada por baixo passa).
   const loc=(x,z)=>{const wx=x-br.a.x,wz=z-br.a.z;return {t:(wx*tx+wz*tz)/L,s:wx*tz-wz*tx};};
   if(window.arcanoGroundOverrides)window.arcanoGroundOverrides.push((x,z)=>{const q=loc(x,z);return (q.t>=0&&q.t<=1&&Math.abs(q.s)<HW-.35)?deck(q.t):null;});
   if(window.arcanoObstacles)for(const sd of [-1,1]){const t=.5,cx=br.a.x+tx*L*t+tz*sd*(HW-.2),cz=br.a.z+tz*L*t-tx*sd*(HW-.2);
    window.arcanoObstacles.addBox({x:cx,z:cz,hw:.2,hd:L/2,rot:ang,ymin:Math.min(y0,y1)-.4,ymax:deck(.5)+2});}
  }
  // Junta tudo por material (poucas chamadas de desenho).
  grp.updateMatrixWorld(true);
  const byMat=new Map();grp.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone().applyMatrix4(o.matrixWorld).toNonIndexed();if(!byMat.has(o.material))byMat.set(o.material,[]);byMat.get(o.material).push(g);});
  for(const [m,gs] of byMat){let n=0;for(const g of gs)n+=g.attributes.position.count;const P=new Float32Array(n*3),Nn=new Float32Array(n*3);let o=0;for(const g of gs){P.set(g.attributes.position.array,o*3);Nn.set(g.attributes.normal.array,o*3);o+=g.attributes.position.count;}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(P,3));geo.setAttribute('normal',new T.BufferAttribute(Nn,3));
   const mesh=new T.Mesh(geo,m);mesh.name='Pontes de pedra dos afluentes';mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);}
  window.arcanoStreamBridges=list;
 }
 // ---------- Local do castelo + núcleo de energia ----------
 {
  const y=window.arcanoIslandHeight(C.x,C.z);
  const base=new T.Mesh(new T.CylinderGeometry(CASTLE_R-6,CASTLE_R-3,3,48),stone);
  base.position.set(C.x,y-1.2,C.z);base.receiveShadow=true;base.castShadow=true;
  base.name='Pedra da fundação do castelo';scene.add(base);
  // O topo da fundação é piso (o personagem sobe nele em vez de atravessar).
  const topY=y+.3;
  if(window.arcanoGroundOverrides)window.arcanoGroundOverrides.push((px,pz)=>Math.hypot(px-C.x,pz-C.z)<CASTLE_R-5.6?topY:null);
  // O castelo (com o núcleo de energia no alto da torre central) é montado em castelo-anime.js.
  window.arcanoCastleSite={x:C.x,z:C.z,y:topY,radius:CASTLE_R-6};
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
  const tb=new T.Box3(),ts=new T.Vector3();
  for(const a of byModel.values()){
   // Copia a árvore em pé: zera a inclinação do vento naquele instante.
   const rx=a.obj.rotation.x,rz=a.obj.rotation.z;a.obj.rotation.x=0;a.obj.rotation.z=0;
   a.obj.updateMatrixWorld(true);
   tb.setFromObject(a.obj);tb.getSize(ts);
   const lying=ts.y<Math.max(ts.x,ts.z)*.9;
   inv.makeTranslation(-a.x,-(a.contactY??a.y),-a.z);
   const parts=[];
   a.obj.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o.visible!==false)parts.push({geometry:o.geometry,material:o.material,rel:inv.clone().multiply(o.matrixWorld)});});
   a.obj.rotation.x=rx;a.obj.rotation.z=rz;a.obj.updateMatrixWorld(true);
   if(parts.length&&!lying)templates.push({name:a.modelName,pine:a.type==='pine',parts,h:ts.y,w:Math.max(ts.x,ts.z)});
  }
  // Floresta DENSA em todo o anel entre a cidade e a borda: grade com sorteio
  // (uma árvore a cada ~5,5 m), só pequenas clareiras, longe de estradas,
  // água, vila e porto.
  const SP=mobile?7:5.5,spots=[];
  const ok=(x,z)=>{
   const d=Math.hypot(x-C.x,z-C.z);
   if(d<CITY_R+14||d>R-16)return false;
   if(outsideDist(x,z)<6)return false;
   if(roadDist(x,z)<5||Math.hypot(x-PORT.x,z-PORT.z)<30)return false;
   if(z>INNER.z1-4&&Math.abs(x-river.center(z))<half(z)+7)return false;
   {const si=streamInfo(x,z);if(si&&si.d<STREAM_W+5)return false;}
   if(villageNear(x,z,3))return false;
   if(lakeE(x,z)<1+7/LAKE.rz||(z<INNER.z0+2&&z>LAKE.z&&Math.abs(x-river.center(z))<half(z)+7))return false;
   return true;
  };
  for(let gz=C.z-R;gz<C.z+R;gz+=SP)for(let gx=C.x-R;gx<C.x+R;gx+=SP){
   const x=gx+(rnd()-.5)*SP*.85,z=gz+(rnd()-.5)*SP*.85;
   if(!ok(x,z))continue;
   // Poucas clareiras pequenas (o resto é mata fechada).
   const dens=Math.sin(x*.031+z*.017)*.5+Math.sin(x*.057-z*.043+2.)*.3+Math.sin(x*.09+z*.08)*.2;
   if(dens<-.62||rnd()<.06)continue;
   const y=window.arcanoIslandHeight(x,z),yx=window.arcanoIslandHeight(x+2,z),yz=window.arcanoIslandHeight(x,z+2);
   if(Math.hypot(yx-y,yz-y)>1.7)continue;
   spots.push({x,y,z,rot:rnd()*Math.PI*2,s:.8+rnd()*.5,t:Math.floor(rnd()*templates.length)});
  }
  // Árvores em volta da nascente (modelos originais).
  for(let k=0;k<26;k++){
   const a=k/26*Math.PI*2+rnd()*.2,r=8+rnd()*14,x=stream.spring.x+Math.cos(a)*r,z=stream.spring.z+Math.sin(a)*r;
   const si=streamInfo(x,z);if(si&&si.d<STREAM_W+3)continue;
   if(villageNear(x,z,3)||roadDist(x,z)<5)continue;
   if(spots.some(s=>Math.hypot(s.x-x,s.z-z)<3))continue;
   spots.push({x,y:window.arcanoIslandHeight(x,z),z,rot:rnd()*Math.PI*2,s:.85+rnd()*.4,t:Math.floor(rnd()*templates.length)});
  }
  if(window.arcanoObstacles)for(const s of spots)window.arcanoObstacles.addCircle(s.x,s.z,.42*s.s+.05); // tronco
  // ---------- Nível de detalhe ----------
  // Perto do personagem: os modelos originais. Longe: árvore leve no mesmo
  // formato e cor (uma chamada de desenho para milhares). Troca ao andar.
  const NEAR=mobile?38:58;
  const group=new T.Group();group.name='Floresta da Ilha Central';
  const M=new T.Matrix4(),Q=new T.Quaternion(),E=new T.Euler(),P=new T.Vector3(),S=new T.Vector3();
  const perT=templates.map(()=>0);for(const s of spots)perT[s.t]++;
  const nearMeshes=templates.map((tpl,t)=>tpl.parts.map(part=>{
   const cap=Math.max(1,Math.min(perT[t],mobile?160:420));
   const im=new T.InstancedMesh(part.geometry,part.material,cap);im.name='Árvore da ilha · '+tpl.name;
   im.count=0;im.castShadow=false;im.receiveShadow=false;im.frustumCulled=false;group.add(im);return {im,part,cap};
  }));
  // Árvore leve: tronco + copa arredondada (folhosas) ou cones (pinheiros), em 1 m
  // de altura; grupo 0 = tronco, grupo 1 = copa (material com a cor do tipo).
  const part=(geo,x,y,z,sy)=>{const g=geo.toNonIndexed();g.scale(1,sy,1);g.translate(x,y,z);g.computeVertexNormals();return g;};
  const merge=(trunk,crown)=>{const list=trunk.concat(crown);let n=0;for(const g of list)n+=g.attributes.position.count;const Pp=new Float32Array(n*3),Nn=new Float32Array(n*3);let o=0;
   for(const g of list){Pp.set(g.attributes.position.array,o*3);Nn.set(g.attributes.normal.array,o*3);o+=g.attributes.position.count;}
   let nt=0;for(const g of trunk)nt+=g.attributes.position.count;
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(Pp,3));geo.setAttribute('normal',new T.BufferAttribute(Nn,3));geo.addGroup(0,nt,0);geo.addGroup(nt,n-nt,1);return geo;};
  const roundGeo=merge([part(new T.CylinderGeometry(.035,.05,.45,6),0,.225,0,1)],
   [part(new T.IcosahedronGeometry(.32,1),0,.58,0,.85),part(new T.IcosahedronGeometry(.24,1),.12,.78,.05,.9),part(new T.IcosahedronGeometry(.22,1),-.13,.72,-.06,.9)]);
  const pineGeo=merge([part(new T.CylinderGeometry(.03,.045,.3,6),0,.15,0,1)],
   [part(new T.ConeGeometry(.3,.45,8),0,.42,0,1),part(new T.ConeGeometry(.23,.38,8),0,.66,0,1),part(new T.ConeGeometry(.15,.3,8),0,.86,0,1)]);
  const trunkMat=new T.MeshStandardMaterial({color:'#7a4a2c',roughness:1});
  const leafColor=name=>/Birch/i.test(name)?'#d6c65c':/Maple/i.test(name)?'#d77a45':/Pine/i.test(name)?'#3f7a4a':'#4f8f42';
  const farMeshes=templates.map((tpl,t)=>{const im=new T.InstancedMesh(tpl.pine?pineGeo:roundGeo,[/Birch/i.test(tpl.name)?new T.MeshStandardMaterial({color:'#ece6d6',roughness:1}):trunkMat,new T.MeshStandardMaterial({color:leafColor(tpl.name),roughness:1})],Math.max(1,perT[t]));
   im.name='Floresta distante (árvores leves)';im.count=0;im.castShadow=false;im.receiveShadow=false;im.frustumCulled=false;group.add(im);return im;});
  let lastX=1e9,lastZ=1e9;
  function rebuild(px,pz){
   lastX=px;lastZ=pz;
   const nearCount=templates.map(()=>0),farCount=templates.map(()=>0);
   for(const s of spots){
    const d=Math.hypot(s.x-px,s.z-pz),tpl=templates[s.t];
    if(d<NEAR&&nearCount[s.t]<nearMeshes[s.t][0].cap){
     const k=nearCount[s.t]++;
     for(const nm of nearMeshes[s.t]){M.compose(P.set(s.x,s.y-.08,s.z),Q.setFromEuler(E.set(0,s.rot,0)),S.setScalar(s.s)).multiply(nm.part.rel);nm.im.setMatrixAt(k,M);}
     continue;
    }
    const f=farMeshes[s.t],k=farCount[s.t]++;
    M.compose(P.set(s.x,s.y-.05,s.z),Q.setFromEuler(E.set(0,s.rot,0)),S.set(tpl.w*s.s*1.25,tpl.h*s.s,tpl.w*s.s*1.25));f.setMatrixAt(k,M);
   }
   nearMeshes.forEach((parts,t)=>parts.forEach(nm=>{nm.im.count=nearCount[t];nm.im.instanceMatrix.needsUpdate=true;}));
   farMeshes.forEach((f,t)=>{f.count=farCount[t];f.instanceMatrix.needsUpdate=true;});
  }
  function where(){const p=api.getGrassPlayer&&api.getGrassPlayer();if(p)return p.position;const c=api.getMainCamera&&api.getMainCamera();return c?c.position:null;}
  {const w=where();rebuild(w?w.x:0,w?w.z:0);}
  setInterval(()=>{const w=where();if(w&&Math.hypot(w.x-lastX,w.z-lastZ)>8)rebuild(w.x,w.z);},300);
  scene.add(group);
  window.arcanoIsland.forest={group,count:spots.length,templates:templates.length,spots};
 }
 window.arcanoIsland={center:C,radius:R,cityRadius:CITY_R,castleRadius:CASTLE_R,height:window.arcanoIslandHeight,land,roads,lake:LAKE,port:PORT,inner:INNER,village:VILLAGE,streams:STREAMS};
 // Água fora da área detalhada (rio até a borda, canal e lago): nível e profundidade.
 // Usado para nadar, mergulhar e fazer ondulações também nessas águas.
 window.arcanoOuterWater=(x,z)=>{
  let level=null;
  if(z>INNER.z1&&Math.abs(x-river.center(z))<half(z)+.2)level=river.levelAt(z);
  else{const w=pondWater(x,z);if(w)level=w.level;}
  if(level==null)return null;
  const depth=level-window.arcanoIslandHeight(x,z);
  return depth>0?{level,depth}:null;
 };
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
