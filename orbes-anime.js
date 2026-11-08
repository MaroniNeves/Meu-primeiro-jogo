/* Esferas de Poder que acompanham o personagem.
   - As 9 esferas em FBX (assets/esferas): fogo, água, elétrica, veneno,
     arcana, natureza, vórtice, trevas e universal, com as animações dos
     arquivos (via esferas-fbx.js). Só baixa as escolhidas.
   - Quais aparecem, tamanho, distância, velocidade e o jeito de seguir
     (órbita ou nos ombros) vêm da página orbes.html, salvos no navegador.
   - Seguem o personagem com suavidade, flutuando; sem luzes extras na cena. */
(function(){
'use strict';
const T=window.THREE,E=window.EsferasDePoder;
if(!T||!E)return;
const KEY='arcanoEsferasPoder';
const DEF={ativas:['fogo'],tamanho:1,distancia:1,velocidade:1,modo:'orbita'};
function readCfg(){try{const c=Object.assign({},DEF,JSON.parse(localStorage.getItem(KEY)||'{}'));c.ativas=(c.ativas||[]).filter(id=>E.IDS.includes(id));return c;}catch(e){return Object.assign({},DEF);}}
let cfg=readCfg();

function install(){
 const api=window.arcanoWaterV1226;
 if(!api||!api.scene||!api.getMainCamera){setTimeout(install,400);return;}
 const scene=api.scene,companions=new Map();
 function sync(){
  for(const [id,c] of companions)if(!cfg.ativas.includes(id)){if(c.orb){scene.remove(c.orb.root);c.orb.dispose();}companions.delete(id);}
  for(const id of cfg.ativas){if(companions.has(id))continue;const c={orb:null,pos:null};companions.set(id,c);
   E.create(id).then(orb=>{if(companions.get(id)!==c){orb.dispose();return;}orb.root.visible=false;c.orb=orb;scene.add(orb.root);}).catch(e=>console.warn('[Esferas] não carregou',id,e));}
 }
 sync();
 addEventListener('storage',e=>{if(e.key===KEY){cfg=readCfg();sync();}});
 window.arcanoEsferas={recarregar(){cfg=readCfg();sync();},companions};
 const tgt=new T.Vector3();let last=performance.now();
 (function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.1,(now-last)/1000);last=now;const t=now/1000;
  const p=api.getGrassPlayer&&api.getGrassPlayer(),cam=api.getMainCamera();
  const list=[...companions.values()],n=list.length;
  const size=.28*(+cfg.tamanho||1),dist=+cfg.distancia||1,speed=+cfg.velocidade||1;
  list.forEach((c,i)=>{
   if(!c.orb)return;const root=c.orb.root;
   if(!p||!cam){root.visible=false;c.pos=null;return;}
   const h=p.heading||0,fx=Math.sin(h),fz=Math.cos(h),rx=Math.cos(h),rz=-Math.sin(h);
   const bob=Math.sin(t*1.8+i*2.1)*.12;
   if(cfg.modo==='ombro'){
    const slots=[[.75,1.95,-.45],[-.75,1.95,-.45],[0,2.45,-.65],[1.25,1.6,-.7],[-1.25,1.6,-.7],[0,1.6,-1.2]],s=slots[i%slots.length];
    tgt.set(p.position.x+(rx*s[0]+fx*s[2])*dist,p.position.y+s[1]+bob,p.position.z+(rz*s[0]+fz*s[2])*dist);
   }else{
    const a=t*.9*speed+i*Math.PI*2/Math.max(1,n),r=(1.05+.12*Math.max(0,n-3))*dist;
    tgt.set(p.position.x+Math.cos(a)*r,p.position.y+1.75+bob,p.position.z+Math.sin(a)*r);
   }
   if(!c.pos)c.pos=tgt.clone();
   c.pos.lerp(tgt,1-Math.exp(-dt*(cfg.modo==='ombro'?7:5)));
   root.position.copy(c.pos);root.scale.setScalar(size);root.visible=true;
   c.orb.update(dt*Math.max(.15,speed));
  });
 })(performance.now());
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
