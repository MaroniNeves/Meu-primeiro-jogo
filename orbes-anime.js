/* Esferas elementais que acompanham o personagem.
   - Usa os mesmos modelos FBX das orbes do laboratório de efeitos
     (assets/vfx/orbe_verde_v2, orbe_laranja_v2, orbe_azul_v2).
   - Quais esferas aparecem, tamanho, distância, velocidade e o jeito de
     seguir (órbita ou no ombro) vêm da página orbes.html, salvos no navegador.
   - Seguem o personagem com suavidade, flutuando e girando no próprio eixo;
     um halo de brilho na cor do elemento (sem luzes extras: nada de piscar).
   - Só carrega o modelo das esferas escolhidas. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const KEY='arcanoEsferas';
const DEF={ativas:['orbe_azul'],tamanho:1,distancia:1,velocidade:1,modo:'orbita'};
const FILES={orbe_verde:'orbe_verde_v2.fbx',orbe_laranja:'orbe_laranja_v2.fbx',orbe_azul:'orbe_azul_v2.fbx'};
const COLORS={orbe_verde:'#4cff80',orbe_laranja:'#ff8735',orbe_azul:'#54b7ff'};
const VERSION='20261027-stable-orb-rotation';
function readCfg(){try{return Object.assign({},DEF,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){return Object.assign({},DEF);}}
let cfg=readCfg();

let loaderP=null;
function getLoader(){return loaderP||(loaderP=import('https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/FBXLoader.js').then(m=>new m.FBXLoader()));}
const cache=new Map();
function loadOrb(id){
 if(cache.has(id))return cache.get(id);
 const p=getLoader().then(L=>L.loadAsync('./assets/vfx/'+FILES[id]+'?v='+VERSION)).then(fbx=>{
  // Sem luzes/câmeras do arquivo (luzes novas fariam a cena recompilar e piscar).
  const rm=[];fbx.traverse(o=>{if(o.isLight||o.isCamera)rm.push(o);});for(const o of rm)o.parent&&o.parent.remove(o);
  fbx.updateMatrixWorld(true);
  const box=new T.Box3().setFromObject(fbx),size=new T.Vector3(),center=new T.Vector3();box.getSize(size);box.getCenter(center);
  const holder=new T.Group();fbx.position.sub(center);holder.add(fbx);holder.scale.setScalar(1/Math.max(size.x,size.y,size.z,.001));
  fbx.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;o.frustumCulled=false;}});
  return holder;
 });
 cache.set(id,p);return p;
}
// Halo de brilho (sprite aditivo) na cor do elemento.
const haloTex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');const gr=g.createRadialGradient(64,64,0,64,64,64);
 gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;})();

function install(){
 const api=window.arcanoWaterV1226;
 if(!api||!api.scene){setTimeout(install,400);return;}
 const scene=api.scene;
 const companions=new Map(); // id -> {root,model,halo,pos}
 function sync(){
  const want=new Set((cfg.ativas||[]).filter(id=>FILES[id]));
  for(const [id,c] of companions)if(!want.has(id)){scene.remove(c.root);companions.delete(id);}
  for(const id of want){
   if(companions.has(id))continue;
   const root=new T.Group();root.name='Esfera elemental · '+id;root.visible=false;
   const spin=new T.Group();root.add(spin);
   const halo=new T.Sprite(new T.SpriteMaterial({map:haloTex,color:new T.Color(COLORS[id]),transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.75}));
   halo.scale.setScalar(1.6);root.add(halo);
   // Enquanto o modelo carrega: um núcleo brilhante simples no lugar.
   const core=new T.Mesh(new T.SphereGeometry(.32,20,14),new T.MeshBasicMaterial({color:new T.Color(COLORS[id])}));spin.add(core);
   scene.add(root);
   const c={root,spin,halo,core,pos:null};companions.set(id,c);
   loadOrb(id).then(model=>{if(companions.get(id)!==c)return;spin.remove(core);spin.add(model);}).catch(e=>console.warn('[Esferas] não carregou',id,e));
  }
 }
 sync();
 addEventListener('storage',e=>{if(e.key===KEY){cfg=readCfg();sync();}});
 window.arcanoEsferas={recarregar(){cfg=readCfg();sync();},companions};
 const tgt=new T.Vector3();let last=performance.now();
 (function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.1,(now-last)/1000);last=now;const t=now/1000;
  const p=api.getGrassPlayer&&api.getGrassPlayer();
  const list=[...companions.values()],n=list.length;
  const size=.5*(+cfg.tamanho||1),dist=+cfg.distancia||1,speed=+cfg.velocidade||1;
  list.forEach((c,i)=>{
   if(!p){c.root.visible=false;c.pos=null;return;}
   const h=p.heading||0,fx=Math.sin(h),fz=Math.cos(h),rx=Math.cos(h),rz=-Math.sin(h);
   const bob=Math.sin(t*1.8+i*2.1)*.12;
   if(cfg.modo==='ombro'){
    // Atrás dos ombros, cada uma num lugar; a terceira fica no alto, ao centro.
    const slots=[[ .75,1.95,-.45],[-.75,1.95,-.45],[0,2.45,-.65]],s=slots[i%3];
    tgt.set(p.position.x+(rx*s[0]+fx*s[2])*dist,p.position.y+s[1]+bob,p.position.z+(rz*s[0]+fz*s[2])*dist);
   }else{
    const a=t*.9*speed+i*Math.PI*2/Math.max(1,n),r=1.05*dist;
    tgt.set(p.position.x+Math.cos(a)*r,p.position.y+1.75+bob,p.position.z+Math.sin(a)*r);
   }
   if(!c.pos){c.pos=tgt.clone();}
   c.pos.lerp(tgt,1-Math.exp(-dt*(cfg.modo==='ombro'?7:5)));
   c.root.position.copy(c.pos);c.root.visible=true;
   c.root.scale.setScalar(size);
   c.spin.rotation.y+=dt*1.3*speed;
   c.halo.material.opacity=.6+.15*Math.sin(t*2.4+i);
  });
 })(performance.now());
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
