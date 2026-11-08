
/* ---------- Adaptação para Three.js (r152) ---------- */
const sphereCache=new WeakMap();
function sphereGeo(T,detail){
 let m=sphereCache.get(T);if(!m){m={};sphereCache.set(T,m);}
 if(m[detail])return m[detail];
 const nx=detail,ny=Math.round(detail*.75),P=[],I=[];
 for(let j=0;j<=ny;j++){const th=Math.PI*j/ny;for(let i=0;i<=nx;i++){const ph=2*Math.PI*i/nx;P.push(Math.sin(th)*Math.cos(ph),Math.cos(th),Math.sin(th)*Math.sin(ph));}}
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;I.push(a,b,a+1,a+1,b,b+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setIndex(I);g.computeBoundingSphere();
 g.boundingSphere.radius=2.5;return m[detail]=g;
}
// Shaders originais, só trocando o que o Three.js já declara (posição, câmera, saída).
const VS3=VS.replace('#version 300 es','').replace('in vec3 aPos;','').replace(/uniform mat4 uVP; uniform vec3 uCenter;/,'')
 .replace('vec3 n=aPos;','vec3 n=position;')
 .replace('vec3 w=uCenter+n*','vec3 w=n*')
 .replace('vN=n; vW=w; gl_Position=uVP*vec4(w,1.0);','vN=n; vW=w; gl_Position=projectionMatrix*modelViewMatrix*vec4(w,1.0);'); // tudo no espaço da esfera
const FS3=FS.replace('#version 300 es','').replace('in vec3 vN; in vec3 vW; out vec4 o;','in vec3 vN; in vec3 vW; layout(location=0) out highp vec4 o;')
 .replace('uniform vec3 uCam;','').split('uCam').join('uCamL')
 .replace(/void main\(\)\{(\s*)vec3 N=/,'uniform vec3 uCamL;\nvoid main(){$1vec3 N=');
// sRGB -> linear (materiais comuns do Three convertem de volta na saída).
const lin=c=>c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);
const HALO_TEX=new WeakMap();
function haloTexture(T){
 if(HALO_TEX.has(T))return HALO_TEX.get(T);
 const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),img=g.createImageData(128,128);
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){const r=Math.hypot(x-63.5,y-63.5)/64,v=r>1?0:Math.pow(1-r,2.6)*.6,k=(y*128+x)*4;img.data[k]=img.data[k+1]=img.data[k+2]=255;img.data[k+3]=Math.round(v*255);}
 g.putImageData(img,0,0);const t=new T.CanvasTexture(c);HALO_TEX.set(T,t);return t;
}
// Malha dinâmica (efeitos gerados a cada quadro: chamas, fumaça, brilhos, raios).
function dynMesh(T,cap,opts){
 const g=new T.BufferGeometry();
 const pos=new T.BufferAttribute(new Float32Array(cap*3),3),col=new T.BufferAttribute(new Float32Array(cap*opts.ch),opts.ch);
 pos.setUsage(T.DynamicDrawUsage);col.setUsage(T.DynamicDrawUsage);g.setAttribute('position',pos);g.setAttribute('color',col);g.setDrawRange(0,0);
 const m=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,transparent:!!opts.transparent,depthWrite:!opts.transparent,blending:opts.additive?T.AdditiveBlending:T.NormalBlending,fog:false,toneMapped:false});
 const mesh=new T.Mesh(g,m);mesh.frustumCulled=false;mesh.renderOrder=opts.order||5;
 mesh.fill=(arr)=>{const n=Math.min(cap,arr.length/7),P=pos.array,C=col.array,ch=opts.ch;
  for(let i=0;i<n;i++){P[i*3]=arr[i*7];P[i*3+1]=arr[i*7+1];P[i*3+2]=arr[i*7+2];const a=arr[i*7+6];
   const k=opts.premul?a:1;C[i*ch]=lin(arr[i*7+3]*k);C[i*ch+1]=lin(arr[i*7+4]*k);C[i*ch+2]=lin(arr[i*7+5]*k);if(ch===4)C[i*ch+3]=a;}
  g.setDrawRange(0,n);pos.needsUpdate=true;col.needsUpdate=true;};
 return mesh;
}
const IDS=['fogo','agua','eletrica','veneno','arcana','natureza','vortice','trevas','universal'];
const INFO={
 fogo:{nome:'Fogo',desc:'Lava em brasa com explosões e respingos'},
 agua:{nome:'Água',desc:'Água viva com espuma e respingos'},
 eletrica:{nome:'Elétrica',desc:'Energia azul com raios que estalam'},
 veneno:{nome:'Veneno',desc:'Gosma verde rachada e borbulhante'},
 arcana:{nome:'Arcana',desc:'Magia roxa com portais'},
 natureza:{nome:'Natureza',desc:'Verde vivo com veios de raiz'},
 vortice:{nome:'Vórtice',desc:'Espiral rosa e vermelha girando'},
 trevas:{nome:'Trevas',desc:'Energia negra soltando fumaça'},
 universal:{nome:'Universal',desc:'Uma galáxia dentro, com estrelas'}
};
/* Cria uma esfera (raio 1) pronta para pôr na cena.
   T = THREE (global ou módulo). update(t, camera) a cada quadro. */
function create(T,id,o={}){
 const def=orbs[IDS.indexOf(id)];if(!def)throw Error('Esfera desconhecida: '+id);
 const root=new T.Group();root.name='Esfera de Poder · '+INFO[id].nome;
 const geo=sphereGeo(T,o.detail||72),mats=[];
 const halo=new T.Sprite(new T.SpriteMaterial({map:haloTexture(T),color:new T.Color().setRGB(def.halo[0],def.halo[1],def.halo[2],T.SRGBColorSpace),blending:T.AdditiveBlending,transparent:true,depthWrite:false,fog:false,toneMapped:false}));
 halo.scale.setScalar(2*(def.fire?3.3:2.9));halo.renderOrder=1;root.add(halo);
 def.L.forEach((l,k)=>{
  const tint=l[3]||[1,1,1];
  const m=new T.ShaderMaterial({glslVersion:T.GLSL3,vertexShader:VS3,fragmentShader:FS3,transparent:l[0]===2,depthWrite:true,
   uniforms:{uTime:{value:0},uKind:{value:l[0]},uScale:{value:l[1]},uShell:{value:l[2]},uTint:{value:new T.Vector3(tint[0],tint[1],tint[2])},uCamL:{value:new T.Vector3()}}});
  const mesh=new T.Mesh(geo,m);mesh.renderOrder=2+k;mesh.frustumCulled=false;root.add(mesh);mats.push(m);
 });
 const fx={};
 if(def.fire)fx.flames=dynMesh(T,40000,{ch:3,order:6});
 if(def.smoke)fx.smoke=dynMesh(T,40000,{ch:4,transparent:true,order:7});
 if(def.stars)fx.sparks=dynMesh(T,4000,{ch:4,transparent:true,additive:true,order:7});
 if(def.elec)fx.bolts=dynMesh(T,6000,{ch:3,transparent:true,additive:true,premul:true,order:8});
 for(const k in fx)root.add(fx[k]);
 const eye=new T.Vector3();let lastBolt=-1;
 return {root,id,
  update(t,camera){
   root.updateMatrixWorld();
   eye.copy(camera.position);root.worldToLocal(eye); // câmera no espaço da esfera (raio 1)
   for(const m of mats){m.uniforms.uTime.value=t;m.uniforms.uCamL.value.copy(eye);}
   halo.material.opacity=Math.min(1,.9+.1*Math.sin(t*3)+(def.elec?.15*(Math.sin(t*37)>.6?1:0):0));
   const e=[eye.x,eye.y,eye.z],c=[0,0,0];
   if(fx.flames)fx.flames.fill(makeFlames(e,c,t));
   if(fx.smoke)fx.smoke.fill(makeSmoke(e,c,t));
   if(fx.sparks)fx.sparks.fill(makeSparkles(e,c,t));
   if(fx.bolts&&(lastBolt<0||t-lastBolt>.1||t<lastBolt)){lastBolt=t;fx.bolts.fill(makeBolts(e,c));}
  },
  dispose(){for(const m of mats)m.dispose();for(const k in fx){fx[k].geometry.dispose();fx[k].material.dispose();}halo.material.dispose();}
 };
}
window.EsferasDePoder={IDS,INFO,create,cor:id=>orbs[IDS.indexOf(id)].lab,shaders:{vertex:VS3,fragment:FS3}};
