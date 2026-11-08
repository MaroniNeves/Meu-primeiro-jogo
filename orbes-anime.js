/* Esfera de Poder que acompanha o personagem.
   - Uma esfera por vez, entre as 9 em FBX (assets/esferas), com a animação do
     próprio arquivo (via esferas-fbx.js). Só baixa a escolhida.
   - Fica parada flutuando ao lado DIREITO do personagem, na altura do ombro,
     virando junto com ele (não orbita); segue com suavidade e balança de leve.
   - Esfera, tamanho, distância e velocidade da animação vêm de orbes.html. */
(function(){
'use strict';
const T=window.THREE,E=window.EsferasDePoder;
if(!T||!E)return;
const KEY='arcanoEsferasPoder';
const DEF={ativas:['fogo'],tamanho:1,distancia:1,velocidade:1};
function readCfg(){
 try{const c=Object.assign({},DEF,JSON.parse(localStorage.getItem(KEY)||'{}'));c.ativas=(c.ativas||[]).filter(id=>E.IDS.includes(id)).slice(0,1);return c;}
 catch(e){return Object.assign({},DEF);}
}
let cfg=readCfg();

function install(){
 const api=window.arcanoWaterV1226;
 if(!api||!api.scene){setTimeout(install,400);return;}
 const scene=api.scene;
 let cur=null; // {id, orb, pos}
 function sync(){
  const id=cfg.ativas[0]||null;
  if(cur&&cur.id===id)return;
  if(cur){if(cur.orb){scene.remove(cur.orb.root);cur.orb.dispose();}cur=null;}
  if(!id)return;
  const c={id,orb:null,pos:null};cur=c;
  E.create(id).then(orb=>{if(cur!==c){orb.dispose();return;}orb.root.visible=false;c.orb=orb;scene.add(orb.root);})
   .catch(e=>console.warn('[Esferas] não carregou',id,e));
 }
 sync();
 addEventListener('storage',e=>{if(e.key===KEY){cfg=readCfg();sync();}});
 window.arcanoEsferas={recarregar(){cfg=readCfg();sync();},get atual(){return cur;}};
 const tgt=new T.Vector3();let last=performance.now();
 (function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.1,(now-last)/1000);last=now;const t=now/1000;
  if(!cur||!cur.orb)return;
  const root=cur.orb.root,p=api.getGrassPlayer&&api.getGrassPlayer();
  if(!p){root.visible=false;cur.pos=null;return;}
  // Lado direito de quem olha para a frente (+z local do personagem).
  const h=p.heading||0,fx=Math.sin(h),fz=Math.cos(h),rx=-Math.cos(h),rz=Math.sin(h);
  const dist=+cfg.distancia||1,side=.62*dist,fwd=.08,up=1.5+Math.sin(t*1.6)*.06;
  tgt.set(p.position.x+rx*side+fx*fwd,p.position.y+up,p.position.z+rz*side+fz*fwd);
  if(!cur.pos)cur.pos=tgt.clone();
  cur.pos.lerp(tgt,1-Math.exp(-dt*8));
  root.position.copy(cur.pos);root.scale.setScalar(.16*(+cfg.tamanho||1));root.visible=true;
  cur.orb.update(dt*Math.max(.15,+cfg.velocidade||1));
 })(performance.now());
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
