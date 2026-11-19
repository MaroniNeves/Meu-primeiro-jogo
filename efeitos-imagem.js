/* Efeitos de imagem opcionais — Ajustes (P) → "✨ Efeitos de imagem". Tudo desligado por padrão; a escolha fica salva.
   1. FSR 1 (AMD FidelityFX Super Resolution 1, técnica aberta): a cena é desenhada numa imagem menor e ampliada
      para a tela com o EASU (ampliação que segue as bordas) + RCAS (nitidez). Mais FPS com pouca perda de detalhe.
   2. SSAO (oclusão de ambiente em tela): cantos, encontros de paredes com o chão e frestas ficam levemente
      sombreados. Usa a profundidade da própria imagem (não desenha a cena de novo).
   3. Luz pré-calculada (lightmap por vértice): ao ligar, calcula UMA vez quanto do céu cada ponto das construções
      e do chão em volta enxerga (32 direções, com mapas de profundidade). Interiores, beirais, pés de parede e
      vielas ficam com a sombra suave da luz do céu. O cálculo roda aos poucos, sem travar o jogo.
   Com FSR e SSAO desligados o caminho de desenho é exatamente o de antes. */
(function(){
'use strict';
const T=window.THREE;if(!T)return;
const KEY='arcano.efeitos.v1';
const cfg={fsr:'0',ssao:'0',luz:'0'};
try{Object.assign(cfg,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(cfg));}catch(e){}};
const FSR={'0':1,q:.77,e:.67,d:.5};
const SSAO={'0':0,s:.75,f:1.25};

function install(){
 const api=window.arcanoWaterV1226;
 if(!api||!api.renderer||!api.scene||!api.getMainCamera){setTimeout(install,400);return;}
 const r=api.renderer,scene=api.scene,gl=r.getContext(),GL2=r.capabilities.isWebGL2;
 const V2=new T.Vector2();

 // ---------- passes de tela cheia ----------
 const quadCam=new T.OrthographicCamera(-1,1,1,-1,0,1),quadScene=new T.Scene();
 const quad=new T.Mesh(new T.PlaneGeometry(2,2));quad.frustumCulled=false;quadScene.add(quad);
 const VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
 const mk=(fs,uniforms)=>new T.ShaderMaterial({vertexShader:VS,fragmentShader:fs,uniforms,depthTest:false,depthWrite:false,toneMapped:false});
 const pass=(mat,target)=>{quad.material=mat;r.setRenderTarget(target);r.render(quadScene,quadCam);};

 const aoMat=mk(`
uniform sampler2D tDepth;uniform mat4 uProjInv;uniform vec2 uRes;uniform float uRadius,uInt,uP00,uP11;varying vec2 vUv;
vec3 vp(vec2 uv){float d=texture2D(tDepth,uv).r;vec4 v=uProjInv*vec4(uv*2.-1.,d*2.-1.,1.);return v.xyz/v.w;}
void main(){
 float d=texture2D(tDepth,vUv).r;if(d>=.99999){gl_FragColor=vec4(1.);return;}
 vec3 P=vp(vUv);vec2 px=1./uRes;
 vec3 r1=vp(vUv+vec2(px.x,0.))-P,l1=P-vp(vUv-vec2(px.x,0.)),u1=vp(vUv+vec2(0.,px.y))-P,d1=P-vp(vUv-vec2(0.,px.y));
 vec3 dx=abs(r1.z)<abs(l1.z)?r1:l1,dy=abs(u1.z)<abs(d1.z)?u1:d1;
 vec3 n=normalize(cross(dx,dy));if(dot(n,-P)<0.)n=-n;
 float z=-P.z;vec2 rad=vec2(uP00,uP11)*uRadius*.5/z;rad=min(rad,vec2(.12));
 vec2 q=mod(floor(gl_FragCoord.xy),4.);float noise=(q.x*4.+q.y)/16.+.03;
 float occ=0.;
 for(int i=0;i<16;i++){float t=(float(i)+.6)/16.;float a=noise*6.2832+float(i)*2.39996;
  vec3 S=vp(vUv+vec2(cos(a),sin(a))*rad*t);vec3 v=S-P;float vv=dot(v,v);
  float f=max(0.,1.-vv/(uRadius*uRadius));occ+=max(0.,dot(v,n)-.012-.004*z)/(vv+.006)*f;}
 float ao=clamp(1.-uInt*occ*uRadius/16.*.9,0.,1.);
 ao=mix(ao,1.,smoothstep(30.,85.,z));
 gl_FragColor=vec4(ao,ao,ao,1.);}`,
  {tDepth:{value:null},uProjInv:{value:new T.Matrix4()},uRes:{value:new T.Vector2()},uRadius:{value:.6},uInt:{value:1},uP00:{value:1},uP11:{value:1}});

 // composição: oclusão (a imagem interna já está em sRGB)
 const compMat=mk(`
uniform sampler2D tColor,tAO;uniform float uAO;uniform vec2 uAORes;varying vec2 vUv;
void main(){
 vec3 c=texture2D(tColor,vUv).rgb;
 if(uAO>0.){vec2 h=1.5/uAORes;float ao=0.;for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++)ao+=texture2D(tAO,vUv+vec2(float(i),float(j))*h).r;c*=ao/9.;}
 gl_FragColor=vec4(clamp(c,0.,1.),1.);}`,
  {tColor:{value:null},tAO:{value:null},uAO:{value:0},uAORes:{value:new T.Vector2()}});

 // FSR 1 · EASU (Edge Adaptive Spatial Upsampling), adaptado do código aberto da AMD (licença MIT)
 const easuMat=mk(`
uniform sampler2D tIn;uniform vec2 uIn,uOut;
vec3 F(ivec2 p){return texelFetch(tIn,clamp(p,ivec2(0),ivec2(uIn)-1),0).rgb;}
float L(vec3 c){return c.g+.5*(c.r+c.b);}
void tap(inout vec3 aC,inout float aW,vec2 off,vec2 dir,vec2 len,float lob,float clp,vec3 c){
 vec2 v=vec2(dot(off,dir),dot(off,vec2(-dir.y,dir.x)));v*=len;float d2=min(dot(v,v),clp);
 float wB=.4*d2-1.,wA=lob*d2-1.;wB*=wB;wA*=wA;wB=1.5625*wB-.5625;float w=wB*wA;aW+=w;aC+=w*c;}
void set(inout vec2 dir,inout float len,float w,float lA,float lB,float lC,float lD,float lE){
 float lenX=max(abs(lD-lC),abs(lC-lB));float dirX=lD-lB;dir.x+=dirX*w;lenX=clamp(abs(dirX)/max(lenX,1e-5),0.,1.);lenX*=lenX;len+=lenX*w;
 float lenY=max(abs(lE-lC),abs(lC-lA));float dirY=lE-lA;dir.y+=dirY*w;lenY=clamp(abs(dirY)/max(lenY,1e-5),0.,1.);lenY*=lenY;len+=lenY*w;}
void main(){
 vec2 pp=(floor(gl_FragCoord.xy)+.5)*(uIn/uOut)-.5;vec2 fp=floor(pp);pp-=fp;ivec2 f0=ivec2(fp);
 vec3 bC=F(f0+ivec2(0,-1)),cC=F(f0+ivec2(1,-1)),eC=F(f0+ivec2(-1,0)),fC=F(f0),gC=F(f0+ivec2(1,0)),hC=F(f0+ivec2(2,0)),
      iC=F(f0+ivec2(-1,1)),jC=F(f0+ivec2(0,1)),kC=F(f0+ivec2(1,1)),lC=F(f0+ivec2(2,1)),nC=F(f0+ivec2(0,2)),oC=F(f0+ivec2(1,2));
 float bL=L(bC),cL=L(cC),eL=L(eC),fL=L(fC),gL=L(gC),hL=L(hC),iL=L(iC),jL=L(jC),kL=L(kC),lL=L(lC),nL=L(nC),oL=L(oC);
 vec2 dir=vec2(0.);float len=0.;
 set(dir,len,(1.-pp.x)*(1.-pp.y),bL,eL,fL,gL,jL);
 set(dir,len,pp.x*(1.-pp.y),cL,fL,gL,hL,kL);
 set(dir,len,(1.-pp.x)*pp.y,fL,iL,jL,kL,nL);
 set(dir,len,pp.x*pp.y,gL,jL,kL,lL,oL);
 vec2 dir2=dir*dir;float dirR=dir2.x+dir2.y;bool zro=dirR<(1./32768.);dirR=inversesqrt(max(dirR,1e-12));
 dirR=zro?1.:dirR;dir.x=zro?1.:dir.x;dir*=dirR;
 len=len*.5;len*=len;
 float stretch=dot(dir,dir)/max(abs(dir.x),abs(dir.y));
 vec2 len2=vec2(1.+(stretch-1.)*len,1.-.5*len);float lob=.5-.29*len,clp=1./lob;
 vec3 mn=min(min(fC,gC),min(jC,kC)),mx=max(max(fC,gC),max(jC,kC));
 vec3 aC=vec3(0.);float aW=0.;
 tap(aC,aW,vec2(0.,-1.)-pp,dir,len2,lob,clp,bC);tap(aC,aW,vec2(1.,-1.)-pp,dir,len2,lob,clp,cC);
 tap(aC,aW,vec2(-1.,1.)-pp,dir,len2,lob,clp,iC);tap(aC,aW,vec2(0.,1.)-pp,dir,len2,lob,clp,jC);
 tap(aC,aW,vec2(0.,0.)-pp,dir,len2,lob,clp,fC);tap(aC,aW,vec2(-1.,0.)-pp,dir,len2,lob,clp,eC);
 tap(aC,aW,vec2(1.,1.)-pp,dir,len2,lob,clp,kC);tap(aC,aW,vec2(2.,1.)-pp,dir,len2,lob,clp,lC);
 tap(aC,aW,vec2(2.,0.)-pp,dir,len2,lob,clp,hC);tap(aC,aW,vec2(1.,0.)-pp,dir,len2,lob,clp,gC);
 tap(aC,aW,vec2(1.,2.)-pp,dir,len2,lob,clp,oC);tap(aC,aW,vec2(0.,2.)-pp,dir,len2,lob,clp,nC);
 gl_FragColor=vec4(min(mx,max(mn,aC/aW)),1.);}`,
  {tIn:{value:null},uIn:{value:new T.Vector2()},uOut:{value:new T.Vector2()}});

 // FSR 1 · RCAS (Robust Contrast Adaptive Sharpening)
 const rcasMat=mk(`
uniform sampler2D tIn;uniform vec2 uSize;uniform float uSharp;
vec3 F(ivec2 p){return texelFetch(tIn,clamp(p,ivec2(0),ivec2(uSize)-1),0).rgb;}
void main(){
 ivec2 p=ivec2(gl_FragCoord.xy);
 vec3 b=F(p+ivec2(0,-1)),d=F(p+ivec2(-1,0)),e=F(p),f=F(p+ivec2(1,0)),h=F(p+ivec2(0,1));
 float bL=b.g+.5*(b.b+b.r),dL=d.g+.5*(d.b+d.r),eL=e.g+.5*(e.b+e.r),fL=f.g+.5*(f.b+f.r),hL=h.g+.5*(h.b+h.r);
 float nz=.25*(bL+dL+fL+hL)-eL;
 nz=clamp(abs(nz)/(max(max(max(bL,dL),max(eL,fL)),hL)-min(min(min(bL,dL),min(eL,fL)),hL)+1e-5),0.,1.);
 nz=-.5*nz+1.;
 vec3 mn4=min(min(b,d),min(f,h)),mx4=max(max(b,d),max(f,h));
 vec3 hitMin=mn4/(4.*mx4+1e-5),hitMax=(1.-mx4)/(4.*mn4-4.-1e-5);
 vec3 lobeRGB=max(-hitMin,hitMax);
 float lobe=max(-.1875,min(max(lobeRGB.r,max(lobeRGB.g,lobeRGB.b)),0.))*uSharp;
 lobe*=nz;
 vec3 c=(lobe*(b+d+h+f)+e)/(4.*lobe+1.);
 gl_FragColor=vec4(clamp(c,0.,1.),1.);}`,
  {tIn:{value:null},uSize:{value:new T.Vector2()},uSharp:{value:Math.pow(2,-.25)}});

 // ---------- imagens internas ----------
 let mainRT=null,aoRT=null,ldrRT=null,upRT=null,grabLin=null;
 const rt=(w,h,o)=>new T.WebGLRenderTarget(w,h,Object.assign({minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:false},o||{}));
 function ensure(fs){
  r.getDrawingBufferSize(V2);const W=V2.x|0,H=V2.y|0,w=Math.max(16,Math.round(W*fs)),h=Math.max(16,Math.round(H*fs));
  if(!mainRT||mainRT.width!==w||mainRT.height!==h){
   if(mainRT){mainRT.dispose();mainRT.depthTexture.dispose();}
   mainRT=rt(w,h,{type:T.HalfFloatType,depthBuffer:true,samples:GL2?4:0});
   mainRT.depthTexture=new T.DepthTexture(w,h);mainRT.depthTexture.type=T.UnsignedIntType;
   // os materiais escrevem a cor já em sRGB, como na tela: transparências e brilhos se misturam igual a antes
   mainRT.isXRRenderTarget=true;mainRT.texture.colorSpace=T.SRGBColorSpace;
   if(aoRT)aoRT.dispose();aoRT=rt(Math.max(8,w>>1),Math.max(8,h>>1));
   if(ldrRT)ldrRT.dispose();ldrRT=rt(w,h);
  }
  if(fs<1&&(!upRT||upRT.width!==W||upRT.height!==H)){if(upRT)upRT.dispose();upRT=rt(W,H,{minFilter:T.NearestFilter,magFilter:T.NearestFilter});}
  return {W,H,w,h};
 }
 const active=()=>GL2&&(FSR[cfg.fsr]<1||SSAO[cfg.ssao]>0);

 // A água do rio copia a tela já desenhada (refração). Com a imagem interna, a cópia sai dela.
  function grab(){
  if(!mainRT)return null;const w=mainRT.width,h=mainRT.height;
  if(!grabLin||grabLin.width!==w||grabLin.height!==h){if(grabLin)grabLin.dispose();grabLin=rt(w,h,{type:T.HalfFloatType});r.setRenderTarget(grabLin);r.setRenderTarget(mainRT);}
  const P=r.properties,src=P.get(mainRT),dst=P.get(grabLin);
  const sfb=src.__webglMultisampledFramebuffer||src.__webglFramebuffer,dfb=dst.__webglFramebuffer;if(!sfb||!dfb)return null;
  r.state.bindFramebuffer(gl.READ_FRAMEBUFFER,sfb);r.state.bindFramebuffer(gl.DRAW_FRAMEBUFFER,dfb);
  gl.blitFramebuffer(0,0,w,h,0,0,w,h,gl.COLOR_BUFFER_BIT,gl.NEAREST);
  r.state.bindFramebuffer(gl.READ_FRAMEBUFFER,null);r.state.bindFramebuffer(gl.DRAW_FRAMEBUFFER,null);
  r.setRenderTarget(mainRT);
  return grabLin;
 }

 const prev=r.render;let inside=false,polys=[];
 setInterval(()=>{if(!active()||FSR[cfg.fsr]>=1)return;const set=new Set();scene.traverse(o=>{if(!o.material)return;for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m&&m.polygonOffset&&m.polygonOffsetFactor)set.add(m);});polys=[...set];},3000);
 r.render=function(s,c){
  if(inside||s!==scene||r.getRenderTarget()!==null||!active())return prev.apply(this,arguments);
  inside=true;
  try{
   const fs=FSR[cfg.fsr],ao=SSAO[cfg.ssao],S=ensure(fs);
   window.arcanoMainRT=mainRT;
   // polygonOffset cresce com a inclinação por pixel: em resolução menor a estrada cobriria as pedrinhas
   if(fs<1)for(const m of polys)m.polygonOffsetFactor*=fs;
   r.setRenderTarget(mainRT);try{prev.call(this,s,c);}finally{if(fs<1)for(const m of polys)m.polygonOffsetFactor/=fs;}
   const calls=r.info.render.calls,tris=r.info.render.triangles;
   if(ao>0){const u=aoMat.uniforms;u.tDepth.value=mainRT.depthTexture;u.uProjInv.value.copy(c.projectionMatrixInverse);u.uRes.value.set(S.w,S.h);
    u.uInt.value=ao;u.uP00.value=c.projectionMatrix.elements[0];u.uP11.value=c.projectionMatrix.elements[5];pass(aoMat,aoRT);}
   const cu=compMat.uniforms;cu.tColor.value=mainRT.texture;cu.tAO.value=aoRT.texture;cu.uAO.value=ao>0?1:0;cu.uAORes.value.set(aoRT.width,aoRT.height);
   if(fs<1){
    pass(compMat,ldrRT);
    const eu=easuMat.uniforms;eu.tIn.value=ldrRT.texture;eu.uIn.value.set(S.w,S.h);eu.uOut.value.set(S.W,S.H);pass(easuMat,upRT);
    const ru=rcasMat.uniforms;ru.tIn.value=upRT.texture;ru.uSize.value.set(S.W,S.H);pass(rcasMat,null);
   }else pass(compMat,null);
   r.info.render.calls=calls;r.info.render.triangles=tris;
  }finally{inside=false;window.arcanoMainRT=null;r.setRenderTarget(null);}
 };

 // ---------- luz pré-calculada ----------
 const LM=bakeModule(r,scene,api);

 // ---------- painel de ajustes ----------
 function ui(){
  const panel=document.getElementById('arcanoQuickPanel');if(!panel){setTimeout(ui,800);return;}
  if(document.getElementById('arcanoEfeitos'))return;
  const det=document.createElement('details');det.className='arcano-quick-section';det.id='arcanoEfeitos';det.open=true;
  det.innerHTML=`<summary>✨ Efeitos de imagem</summary><div>
   <label class="arcano-setting"><span>FSR 1 · ampliação inteligente (mais FPS)</span><select id="efFsr">
    <option value="0">Desligado</option><option value="q">Qualidade (77%)</option><option value="e">Equilibrado (67%)</option><option value="d">Desempenho (50%)</option></select></label>
   <label class="arcano-setting"><span>SSAO · sombra nos cantos e encontros</span><select id="efSsao">
    <option value="0">Desligado</option><option value="s">Suave</option><option value="f">Forte</option></select></label>
   <label class="arcano-setting"><span>Luz pré-calculada (lightmap) nas construções</span><select id="efLuz">
    <option value="0">Desligada</option><option value="1">Ligada</option></select></label>
   <small id="efStatus" style="display:block;opacity:.8;margin-top:4px"></small></div>`;
  const fc=document.getElementById('arcanoQuickForecast');if(fc)panel.insertBefore(det,fc);else panel.appendChild(det);
  const sel=(id,k,fn)=>{const e=document.getElementById(id);e.value=cfg[k];e.addEventListener('change',()=>{cfg[k]=e.value;save();fn&&fn();status();});};
  sel('efFsr','fsr');sel('efSsao','ssao');sel('efLuz','luz',()=>LM.set(cfg.luz==='1',status));
  status();
 }
 function status(t){const e=document.getElementById('efStatus');if(!e)return;
  if(!GL2&&(cfg.fsr!=='0'||cfg.ssao!=='0')){e.textContent='FSR e SSAO precisam de WebGL 2, que este aparelho não tem.';return;}
  e.textContent=t||LM.status()||'';}
 ui();
 // calcula depois que o mundo está montado e o jogo começou (com o menu aberto parte do cenário ainda não existe)
 if(cfg.luz==='1'){const go=()=>{if(document.body.classList.contains('play-active'))setTimeout(()=>LM.set(true,status),4000);else setTimeout(go,1000);};go();}
 window.arcanoEfeitos={cfg,grab,set(k,v){cfg[k]=String(v);save();const m={fsr:'efFsr',ssao:'efSsao',luz:'efLuz'}[k],e=m&&document.getElementById(m);if(e)e.value=cfg[k];if(k==='luz')LM.set(cfg.luz==='1',status);status();},luz:LM,get mainRT(){return mainRT;}};
}

// =====================================================================================================
// Luz pré-calculada: visibilidade do céu por vértice (construções + chão em volta)
// =====================================================================================================
function bakeModule(r,scene,api){
 const U={uBake:{value:0}};
 let state='idle',pct=0,info='',mats=new Set();
 const STATIC=/castelo|Vilas e acampamentos|Torre da muralha|Grande portão|Ponte em arco|Píer e escada|Porto dos Ventos|Casa anime|Vila da Montanha|Muralha|Fonte|Pátio|Escadaria|Jardim do castelo/i;
 const TERRAIN=/terreno|Terra absorvente|Costura|Estrada calçada/i;
 const okMat=m=>m&&!m.isShaderMaterial&&!m.isRawShaderMaterial&&!m.isPointsMaterial&&!m.isLineBasicMaterial&&!m.isSpriteMaterial;

 function patch(m){
  if(!okMat(m))return;mats.add(m);
  if(m.userData.bakeWrap&&m.onBeforeCompile===m.userData.bakeWrap)return;
  const prevF=m.onBeforeCompile,prevKey=(m.hasOwnProperty('customProgramCacheKey')?m.customProgramCacheKey.call(m):(prevF?prevF.toString():''));
  const wrap=function(sh,rr){
   if(prevF)prevF.call(this,sh,rr);
   if(!/#include <begin_vertex>/.test(sh.vertexShader))return;
   sh.uniforms.uBake=U.uBake;
   sh.vertexShader='attribute float bakeAO;\nvarying float vBakeAO;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBakeAO=bakeAO;');
   let f='uniform float uBake;\nvarying float vBakeAO;\n'+sh.fragmentShader;
   if(f.includes('#include <aomap_fragment>'))f=f.replace('#include <aomap_fragment>','#include <aomap_fragment>\n{float bk=1.-vBakeAO*uBake;reflectedLight.indirectDiffuse*=bk;reflectedLight.indirectSpecular*=bk;reflectedLight.directDiffuse*=mix(1.,bk,.5);}');
   else if(f.includes('#include <fog_fragment>'))f=f.replace('#include <fog_fragment>','gl_FragColor.rgb*=1.-vBakeAO*uBake*.7;\n#include <fog_fragment>');
   sh.fragmentShader=f;};
  m.userData.bakeWrap=wrap;m.onBeforeCompile=wrap;
  m.customProgramCacheKey=function(){return prevKey+'|bakeAO1';};
  m.needsUpdate=true;
 }
 // outros módulos podem trocar o onBeforeCompile depois: reaplica
 setInterval(()=>{if(state!=='done')return;for(const m of mats)if(m.onBeforeCompile!==m.userData.bakeWrap){m.userData.bakeWrap=null;patch(m);}},4000);

 async function bake(report){
  state='baking';pct=0;const t0=performance.now();
  const frame=()=>new Promise(res=>requestAnimationFrame(()=>res()));
  // 1) alvos: construções inteiras + terreno nos blocos onde há construções
  const builds=[];
  for(const top of scene.children){let nm=top.name||'';if(!nm){let hit=false;top.traverse(o=>{if(!hit&&/castelo/i.test(o.name||''))hit=true;});if(hit)nm='castelo';}
   if(!STATIC.test(nm))continue;
   top.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||!o.geometry||!o.geometry.attributes.position)return;const ms=Array.isArray(o.material)?o.material:[o.material];if(!ms.every(okMat))return;if(ms.some(m=>m.transparent&&m.opacity<.9))return;builds.push(o);});}
  const TILE=96,tk=(x,z)=>Math.floor(x/TILE)*10000+Math.floor(z/TILE);
  const tiles=new Set(),v=new T.Vector3();
  for(const o of builds){o.updateMatrixWorld(true);const p=o.geometry.attributes.position,step=Math.max(1,Math.floor(p.count/200));for(let i=0;i<p.count;i+=step){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);tiles.add(tk(v.x,v.z));}}
  const near=new Set();for(const k of tiles){const i=Math.floor(k/10000+.5),j=k-i*10000;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)near.add((i+a)*10000+(j+b));}
  const terr=[];scene.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&TERRAIN.test(o.name||'')&&!/Base inferior/i.test(o.name)&&okMat(Array.isArray(o.material)?o.material[0]:o.material))terr.push(o);});
  // geometria compartilhada entre peças: cada uma precisa da sua (a luz depende da posição)
  const uses=new Map();scene.traverse(o=>{if(o.geometry)uses.set(o.geometry,(uses.get(o.geometry)||0)+1);});
  for(const o of [...builds,...terr])if(uses.get(o.geometry)>1){uses.set(o.geometry,uses.get(o.geometry)-1);o.geometry=o.geometry.clone();}
  // 2) vértices em mundo, agrupados por bloco
  const meshes=[...builds,...terr];let N=0;const off=[];for(const o of meshes){off.push(N);N+=o.geometry.attributes.position.count;}
  const W=4096,H=Math.ceil(N/W);
  const WP=new Float32Array(N*3),WN=new Int8Array(N*3),tileOf=new Int32Array(N),nm3=new T.Matrix3(),nv=new T.Vector3();
  for(let mi=0;mi<meshes.length;mi++){const o=meshes[mi],g=o.geometry,p=g.attributes.position,n=g.attributes.normal,base=off[mi],isT=mi>=builds.length;
   // chão e estrada: vale a face de cima (a estrada é de duas faces, com a normal para baixo)
   o.updateMatrixWorld(true);nm3.getNormalMatrix(o.matrixWorld);
   for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);const k=base+i;WP[k*3]=v.x;WP[k*3+1]=v.y;WP[k*3+2]=v.z;
    if(n){nv.fromBufferAttribute(n,i).applyMatrix3(nm3).normalize();if(isT&&nv.y<0)nv.negate();}else nv.set(0,1,0);WN[k*3]=Math.round(nv.x*127);WN[k*3+1]=Math.round(nv.y*127);WN[k*3+2]=Math.round(nv.z*127);
    const t=tk(v.x,v.z);tileOf[k]=isT&&!near.has(t)?-1:t;}
   if(mi%40===0)await frame();}
  const byTile=new Map();for(let k=0;k<N;k++){const t=tileOf[k];if(t===-1)continue;let a=byTile.get(t);if(!a)byTile.set(t,a=[]);a.push(k);}
  // 3) direções do céu (meia esfera, acima de 6°)
  const K=r.capabilities.maxTextureSize>=4096&&!/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)?32:20,DIRS=[];
  for(let i=0;i<K;i++){const y=Math.sin((6+84*Math.sqrt((i+.5)/K))*Math.PI/180),a=i*2.39996,h=Math.sqrt(1-y*y);DIRS.push(new T.Vector3(Math.cos(a)*h,y,Math.sin(a)*h));}
  // 4) quem faz sombra: construções, terreno, árvores e pedras (sem céu, água, nuvens, grama, chuva)
  const OCC=6,occ=[];
  scene.traverse(o=>{if(!(o.isMesh||o.isInstancedMesh)||o.isSkinnedMesh||!o.geometry)return;if(o.layers.mask===4)return;
   const m=Array.isArray(o.material)?o.material[0]:o.material;if(!m||m.isShaderMaterial||(m.transparent&&m.opacity<.9)||m.visible===false)return;
   if(/céu|ceu|sky|nuvem|cloud|chuva|rain|névoa|nevoa|fog|água|agua|water|rio |lago|mar |oceano|ocean|espuma|reflexo|grama|Tapete/i.test(o.name||''))return;
   if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();if(!o.isInstancedMesh&&o.geometry.boundingSphere&&o.geometry.boundingSphere.radius>450)return;
   o.layers.enable(OCC);occ.push(o);});
  const S=2048,depthRT=new T.WebGLRenderTarget(S,S,{depthBuffer:true});depthRT.depthTexture=new T.DepthTexture(S,S);depthRT.depthTexture.type=T.UnsignedIntType;
  const acc=new T.WebGLRenderTarget(W,H,{type:T.HalfFloatType,depthBuffer:false,minFilter:T.NearestFilter,magFilter:T.NearestFilter});
  const cam=new T.OrthographicCamera(-100,100,100,-100,1,900);cam.layers.set(OCC);
  const depthMat=new T.MeshBasicMaterial({side:T.DoubleSide,colorWrite:false});
  const ptMat=new T.ShaderMaterial({
   vertexShader:`attribute vec3 nrm0;attribute float aId;uniform mat4 uVP;uniform vec3 uDir;uniform vec2 uTex;varying vec3 vL,vL2;varying float vCos,vCos2;
    void main(){vec3 nrm=nrm0/max(length(nrm0),1e-4);vec4 l=uVP*vec4(position+nrm*.14+uDir*.04,1.);vL=l.xyz/l.w*.5+.5;vCos=max(dot(nrm,uDir),0.);
     l=uVP*vec4(position-nrm*.14+uDir*.04,1.);vL2=l.xyz/l.w*.5+.5;vCos2=max(dot(-nrm,uDir),0.);
     float y=floor((aId+.5)/uTex.x),x=aId-y*uTex.x;gl_Position=vec4((vec2(x,y)+.5)/uTex*2.-1.,0.,1.);gl_PointSize=1.;}`,
   fragmentShader:`uniform sampler2D uDepth;uniform float uBias,uTexel;varying vec3 vL,vL2;varying float vCos,vCos2;
    float V(vec3 L){if(!(L.x>0.&&L.x<1.&&L.y>0.&&L.y<1.&&L.z<1.))return 1.;float v=0.;for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++){float d=texture2D(uDepth,L.xy+vec2(float(i),float(j))*uTexel).r;v+=L.z-uBias<=d?1.:0.;}return v/9.;}
    // os dois lados da superfície (há paredes de duas faces com a normal para dentro): fica o lado que vê mais céu
    void main(){gl_FragColor=vec4(vCos>0.?vCos*V(vL):0.,vCos,vCos2>0.?vCos2*V(vL2):0.,vCos2);}`,
   uniforms:{uVP:{value:new T.Matrix4()},uDir:{value:new T.Vector3()},uTex:{value:new T.Vector2(W,H)},uDepth:{value:depthRT.depthTexture},uBias:{value:.12/899},uTexel:{value:1/S}},
   blending:T.CustomBlending,blendEquation:T.AddEquation,blendSrc:T.OneFactor,blendDst:T.OneFactor,depthTest:false,depthWrite:false,toneMapped:false});
  const ptScene=new T.Scene(),pcam=new T.OrthographicCamera(-1,1,1,-1,0,1);
  const oldClear=r.autoClear,oldOv=scene.overrideMaterial,oldBg=scene.background,oldFog=scene.fog;
  const oldCC=new T.Color();r.getClearColor(oldCC);const oldCA=r.getClearAlpha();
  r.setRenderTarget(acc);r.setClearColor(0x000000,0);r.clear(true,false,false);r.setRenderTarget(null);r.setClearColor(oldCC,oldCA);
  let tilesL=[...byTile.entries()];
  let done=0;const total=tilesL.length*K;
  try{
   for(const [t,ids] of tilesL){
    const n=ids.length,pos=new Float32Array(n*3),nrm=new Int8Array(n*3),aid=new Float32Array(n);let cx=0,cy=0,cz=0;
    for(let q=0;q<n;q++){const k=ids[q];pos[q*3]=WP[k*3];pos[q*3+1]=WP[k*3+1];pos[q*3+2]=WP[k*3+2];nrm[q*3]=WN[k*3];nrm[q*3+1]=WN[k*3+1];nrm[q*3+2]=WN[k*3+2];aid[q]=k;cx+=WP[k*3];cy+=WP[k*3+1];cz+=WP[k*3+2];}
    cx/=n;cy/=n;cz/=n;
    const pg=new T.BufferGeometry();pg.setAttribute('position',new T.BufferAttribute(pos,3));pg.setAttribute('nrm0',new T.BufferAttribute(nrm,3,true));pg.setAttribute('aId',new T.BufferAttribute(aid,1));
    const pts=new T.Points(pg,ptMat);pts.frustumCulled=false;ptScene.add(pts);
    for(let di=0;di<K;di++){const d=DIRS[di];
     cam.position.set(cx+d.x*450,cy+d.y*450,cz+d.z*450);cam.up.set(0,Math.abs(d.y)>.99?0:1,Math.abs(d.y)>.99?1:0);cam.lookAt(cx,cy,cz);cam.updateMatrixWorld(true);
     scene.overrideMaterial=depthMat;scene.background=null;scene.fog=null;r.autoClear=true;
     r.setRenderTarget(depthRT);r.render(scene,cam);
     scene.overrideMaterial=oldOv;scene.background=oldBg;scene.fog=oldFog;
     ptMat.uniforms.uVP.value.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse);ptMat.uniforms.uDir.value.copy(d);
     r.autoClear=false;r.setRenderTarget(acc);r.render(ptScene,pcam);r.autoClear=oldClear;r.setRenderTarget(null);
     done++;pct=Math.round(done/total*100);
     if(di%4===3){report&&report();await frame();}}
    ptScene.remove(pts);pg.dispose();}
   // 5) resultado → valor por vértice (0 = céu todo visível, 1 = nada de céu)
   const out=new T.WebGLRenderTarget(W,H,{depthBuffer:false,minFilter:T.NearestFilter,magFilter:T.NearestFilter});
   const resMat=new T.ShaderMaterial({vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`uniform sampler2D tA;varying vec2 vUv;void main(){vec4 a=texture2D(tA,vUv);
     float V1=a.g>.02*${K}.?a.r/a.g:-1.,V2=a.a>.02*${K}.?a.b/a.a:-1.;float V=max(V1,V2);if(V<0.)V=1.;float o=clamp((1.-V)*1.1,0.,.72);gl_FragColor=vec4(o,0.,0.,1.);}`,uniforms:{tA:{value:acc.texture}},depthTest:false,depthWrite:false});
   const qs=new T.Scene(),qm=new T.Mesh(new T.PlaneGeometry(2,2),resMat);qm.frustumCulled=false;qs.add(qm);
   r.autoClear=true;r.setRenderTarget(out);r.render(qs,pcam);
   const buf=new Uint8Array(W*H*4);r.readRenderTargetPixels(out,0,0,W,H,buf);r.setRenderTarget(null);r.autoClear=oldClear;
   for(let mi=0;mi<meshes.length;mi++){const o=meshes[mi],c=o.geometry.attributes.position.count,base=off[mi],a=new Uint8Array(c);
    for(let i=0;i<c;i++){const k=base+i;a[i]=tileOf[k]===-1?0:buf[k*4];}
    o.geometry.setAttribute('bakeAO',new T.BufferAttribute(a,1,true));
    for(const m of (Array.isArray(o.material)?o.material:[o.material]))patch(m);}
   out.dispose();resMat.dispose();qm.geometry.dispose();
   state='done';info=`${(N/1e6).toFixed(1)} mi de pontos · ${tilesL.length} blocos · ${((performance.now()-t0)/1000).toFixed(1)} s`;
  }catch(e){console.warn('[Arcano] luz pré-calculada falhou:',e);state='erro';info=String(e&&e.message||e);}
  finally{for(const o of occ)o.layers.disable(OCC);depthRT.depthTexture.dispose();depthRT.dispose();acc.dispose();depthMat.dispose();ptMat.dispose();
   scene.overrideMaterial=oldOv;scene.background=oldBg;scene.fog=oldFog;r.autoClear=oldClear;r.setRenderTarget(null);}
 }
 return {
  set(on,report){
   if(!on){U.uBake.value=0;report&&report();return;}
   if(state==='done'){U.uBake.value=1;report&&report();return;}
   if(state==='baking'||state==='wait')return;
   if(!document.body.classList.contains('play-active')){state='wait';const w=()=>{if(document.body.classList.contains('play-active')){state='idle';setTimeout(()=>this.set(cfg.luz==='1',report),3000);}else setTimeout(w,1000);};w();return;}
   bake(report).then(()=>{if(cfg.luz==='1'&&state==='done')U.uBake.value=1;report&&report();});
  },
  refazer(report){if(state==='baking')return;state='idle';this.set(true,report);},
  dbg:null,
  status(){if(state==='wait')return 'A luz pré-calculada será feita quando o jogo começar.';if(state==='baking')return 'Calculando a luz pré-calculada… '+pct+'%';if(state==='done'&&U.uBake.value>0)return 'Luz pré-calculada pronta · '+info;if(state==='erro')return 'Luz pré-calculada: '+info;return '';},
  get state(){return state;},U
 };
}
install();
})();
