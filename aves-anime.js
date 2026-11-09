/* Aves low-poly (Poly by Google, CC-BY 3.0) animadas por código.
   Os modelos vêm parados; aqui cada um é normalizado (de frente para +z, pés/ventre em y=0, tamanho real em metros)
   e ganha um deformador no shader:
     - asas: tudo que está além da "dobradiça" (|x| > hinge) gira em torno do eixo do corpo -> bater asas, planar, zumbir;
     - cabeça: a parte da frente (z > headZ) gira em torno do pescoço -> bicar, olhar para os lados;
     - cauda: a parte de trás (z < tailZ) sobe e desce.
   Uso (módulo): const {loadBird}=await import('./aves-anime.js'); const ave=await loadBird(THREE,'gaivota'); ave.update(dt,'voar'); */
const SPECIES={
 gaivota:  {file:'gaivota.glb',  nome:'Gaivota',    len:.42, rotY:-Math.PI/2, voo:true,  hinge:.14, soft:.08, amp:.55, freq:3.2, headZ:.33, tailZ:-.3},
 coruja:   {file:'coruja.glb',   nome:'Coruja',     len:.32, rotY:0, voo:false, hinge:.32, soft:.15, amp:1.1, freq:3.5, headZ:.0,  tailZ:-.6, up:true},
 beijaflor:{file:'beijaflor.glb',nome:'Beija-flor', len:.1,  rotY:0, voo:true,  hinge:.2,  soft:.1,  amp:.9,  freq:28,  headZ:.3,  tailZ:-.35},
 pomba:    {file:'pomba.glb',    nome:'Pombo',      len:.3,  rotY:0, voo:false, hinge:.32, soft:.15, amp:1.1,  freq:5,   headZ:.25, tailZ:-.35},
 pardal:   {file:'pardal.glb',   nome:'Pardal',     len:.15, rotY:0, voo:false, hinge:.32, soft:.15, amp:1.1,  freq:8,   headZ:.22, tailZ:-.3},
 aguia:    {file:'aguia.glb',    nome:'Águia',      len:.8,  rotY:0, voo:false, hinge:.32, soft:.15, amp:1.1,  freq:2.2, headZ:.25, tailZ:-.35},
 arara:    {file:'arara.glb',    nome:'Arara',      len:.8,  rotY:Math.PI/2, voo:false, hinge:.32, soft:.15, amp:1.1, freq:3,   headZ:.1,  tailZ:-.3, up:true}
};
export const ESPECIES=SPECIES;

const GLSL_DEF=`
uniform float uWingY,uFlap,uHinge,uSoft,uHalf,uHingeY,uHeadZ,uHeadPitch,uHeadYaw,uTailZ,uTail,uLen;
uniform vec2 uNeck;uniform vec2 uTailP;
vec2 rot2(vec2 v,float a){float c=cos(a),s=sin(a);return vec2(v.x*c-v.y*s,v.x*s+v.y*c);}
void aveDeform(inout vec3 p,inout vec3 n){
 float ax=abs(p.x),s=sign(p.x);
 float w=smoothstep(uHinge,uHinge+uSoft,ax)*smoothstep(uWingY,uWingY+uLen*.08,p.y);
 if(w>0.0){float tip=clamp((ax-uHinge)/max(.0001,uHalf-uHinge),0.,1.);float a=s*uFlap*w*(.55+.45*tip);
  vec2 pv=vec2(s*uHinge,uHingeY);p.xy=pv+rot2(p.xy-pv,a);n.xy=rot2(n.xy,a);}
 float hw=smoothstep(uHeadZ,uHeadZ+uLen*.08,p.z);
 if(hw>0.0){vec2 d=p.zy-uNeck.yx;float a=-uHeadPitch*hw;vec2 r=rot2(d,a);p.z=uNeck.y+r.x;p.y=uNeck.x+r.y;vec2 nn=rot2(n.zy,a);n.z=nn.x;n.y=nn.y;
  vec2 dx=vec2(p.x,p.z-uNeck.y);float b=uHeadYaw*hw;vec2 r2=rot2(dx,b);p.x=r2.x;p.z=uNeck.y+r2.y;vec2 n2=rot2(n.xz,b);n.x=n2.x;n.z=n2.y;}
 float tw=1.-smoothstep(uTailZ-uLen*.08,uTailZ,p.z);
 if(tw>0.0){vec2 d=p.zy-uTailP.yx;float a=uTail*tw;vec2 r=rot2(d,a);p.z=uTailP.y+r.x;p.y=uTailP.x+r.y;}
}
`;

function patchMaterial(mat,U){
 const m=mat.clone();
 m.onBeforeCompile=sh=>{
  Object.assign(sh.uniforms,U);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\n'+GLSL_DEF)
   .replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nvec3 aveP=position;aveDeform(aveP,objectNormal);')
   .replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed=aveP;');
 };
 m.customProgramCacheKey=()=>'ave-deform';
 return m;
}

export async function loadBird(THREE,id,opt){
 opt=opt||{};const cfg=SPECIES[id];if(!cfg)throw new Error('espécie '+id);
 const {GLTFLoader}=await import('https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/GLTFLoader.js');
 const base=opt.base||'./assets/aves/';
 const g=await new GLTFLoader().loadAsync(base+cfg.file);
 g.scene.updateMatrixWorld(true);
 // junta todas as malhas no mesmo referencial (geometria "assada"), gira para frente = +z
 const R=new THREE.Matrix4().makeRotationY(cfg.rotY||0),parts=[];
 g.scene.traverse(o=>{if(o.isMesh){const geo=o.geometry.clone();geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(R,o.matrixWorld));parts.push({geo,mat:o.material});}});
 const box=new THREE.Box3();for(const p of parts){p.geo.computeBoundingBox();box.union(p.geo.boundingBox);}
 const size=box.getSize(new THREE.Vector3()),ctr=box.getCenter(new THREE.Vector3());
 const S=cfg.len/Math.max(size.z,size.y*.85);
 for(const p of parts){p.geo.translate(-ctr.x,-box.min.y,-ctr.z);p.geo.scale(S,S,S);p.geo.computeVertexNormals&&!p.geo.attributes.normal&&p.geo.computeVertexNormals();}
 const half=size.x*S/2,H=size.y*S,Lz=size.z*S;
 const U={uWingY:{value:cfg.voo?-1e3:H*.38},uFlap:{value:0},uHinge:{value:half*cfg.hinge},uSoft:{value:half*cfg.soft},uHalf:{value:half},uHingeY:{value:H*(cfg.voo?.5:.62)},
  uHeadZ:{value:Lz*cfg.headZ},uNeck:{value:new THREE.Vector2(H*(cfg.up?.7:.6),Lz*(cfg.headZ-.05))},uHeadPitch:{value:0},uHeadYaw:{value:0},
  uTailZ:{value:Lz*cfg.tailZ},uTailP:{value:new THREE.Vector2(H*.45,Lz*cfg.tailZ)},uTail:{value:0},uLen:{value:Lz}};
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);root.name='Ave '+cfg.nome;
 let grad=null;if(opt.toon){const c=document.createElement('canvas');c.width=4;c.height=1;const x=c.getContext('2d');['#5a5a5a','#9a9a9a','#dcdcdc','#ffffff'].forEach((col,i)=>{x.fillStyle=col;x.fillRect(i,0,1,1);});grad=new THREE.CanvasTexture(c);grad.minFilter=grad.magFilter=THREE.NearestFilter;}
 for(const p of parts){if(grad){const o=p.mat;p.mat=new THREE.MeshToonMaterial({map:o.map||null,color:o.color?o.color.clone():new THREE.Color(1,1,1),gradientMap:grad,side:THREE.DoubleSide});}
  const me=new THREE.Mesh(p.geo,patchMaterial(p.mat,U));me.castShadow=true;me.receiveShadow=true;me.frustumCulled=false;body.add(me);}
 let t=0;
 const st={flap:0,head:0,yaw:0,tail:0,pitch:0,roll:0,bob:0};
 const smooth=(a,b,x)=>{x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x);};
 function update(dt,mode){
  t+=dt;const f=cfg.freq,A=cfg.amp;let flap=0,head=0,yaw=0,tail=0,pitch=0,roll=0,bob=0;
  switch(mode){
   case 'voar':{const p=t*f*Math.PI*2;flap=A*Math.sin(p)+.05;bob=Math.sin(p+1)*cfg.len*.03;tail=.05*Math.sin(p);pitch=.05;break;}
   case 'planar':{flap=cfg.voo?.06+.04*Math.sin(t*.9):A*.6;roll=.12*Math.sin(t*.6);tail=.08*Math.sin(t*.7);pitch=.02;break;}
   case 'bater':{const p=t*f*Math.PI*2*1.2;flap=A*1.15*(.5+.5*Math.sin(p));pitch=cfg.voo?.2:.35;bob=Math.abs(Math.sin(p))*cfg.len*.04;tail=-.2;break;}
   case 'bicar':{const c=t%2.2,u=c-1;const dn=c>1&&c<1.9?smooth(0,.2,u)*(1-smooth(.45,.75,u)):0;head=.9*dn;pitch=.25*dn;yaw=.4*Math.sin(t*.8)*(1-dn);tail=.1*dn;break;}
   case 'pousar':{const c=t%4;if(c<2){const p=t*f*Math.PI*2;flap=A*Math.sin(p)*(1-c/2*.4);pitch=.15+c*.15;bob=(2-c)/2*cfg.len*.6;}else if(c<2.8){const u=(c-2)/.8;flap=A*.9*(1-u)*Math.abs(Math.sin(t*f*6));pitch=.45*(1-u);}else{yaw=.3*Math.sin(t*1.2);head=.05*Math.sin(t*2);}break;}
   default:{yaw=.5*Math.sin(t*.7);head=.06*Math.sin(t*1.3);tail=.04*Math.sin(t*1.1);bob=Math.sin(t*2.2)*cfg.len*.004;if(cfg.voo){flap=cfg.id==='beijaflor'?A*Math.sin(t*f*Math.PI*2):.05*Math.sin(t*1.5);}}
  }
  U.uFlap.value=flap;U.uHeadPitch.value=head;U.uHeadYaw.value=yaw;U.uTail.value=tail;
  body.rotation.x=-pitch;body.rotation.z=roll;body.position.y=bob;
 }
 cfg.id=id;
 return {root,update,cfg,uniforms:U,size:{half,H,Lz}};
}
