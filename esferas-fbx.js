/* Esferas de Poder em FBX (assets/esferas/esfera_*.fbx).
   Carrega os modelos e animações publicados e ajusta os materiais que o
   exportador gravou com "emissivo branco":
   - Halo0..Halo27: cascas de brilho → aditivas, translúcidas, mais fracas
     para fora (formam o halo suave em volta da esfera);
   - "vcadd": efeitos com cor nos vértices somando luz (raios);
   - "vc": efeitos com cor nos vértices (chamas, respingos);
   - corpo e texturas: sem iluminação, cor da própria textura.
   Tamanho normalizado: o corpo fica com raio 1. Animação em loop.
   Uso: const e=await EsferasDePoder.create('fogo'); scene.add(e.root);
        e.update(dt) a cada quadro. */
(function(){
'use strict';
const IDS=['fogo','agua','eletrica','veneno','arcana','natureza','vortice','trevas','universal'];
const INFO={
 fogo:{nome:'Fogo',desc:'Lava em brasa com chamas e faíscas',cor:'#ffb056'},
 agua:{nome:'Água',desc:'Água viva com espuma',cor:'#7fd6ff'},
 eletrica:{nome:'Elétrica',desc:'Energia azul com teias de raios',cor:'#c8dcff'},
 veneno:{nome:'Veneno',desc:'Gosma verde borbulhante',cor:'#9dff5a'},
 arcana:{nome:'Arcana',desc:'Magia roxa com portais',cor:'#d3a2ff'},
 natureza:{nome:'Natureza',desc:'Verde vivo com veios de raiz',cor:'#8fe07a'},
 vortice:{nome:'Vórtice',desc:'Espiral rosa e vermelha girando',cor:'#ff7aa8'},
 trevas:{nome:'Trevas',desc:'Energia negra soltando fumaça',cor:'#b58cff'},
 universal:{nome:'Universal',desc:'Uma galáxia dentro, com estrelas',cor:'#f3f0ff'}
};
const VERSION='1';
// Esferas mostradas exatamente com os materiais do arquivo (só o halo é ajustado).
const ORIGINAL=new Set();
// Engrossamento dos raios (miolo e brilho) para aparecerem com a esfera pequena.
const WIDTH={core:3,glow:1.8};
const RAY_GEO=new WeakMap();
const base=(()=>{const s=document.currentScript&&document.currentScript.src;return s?s.replace(/[^/]*$/,''):'./';})();
let libs=null;
function getLibs(){return libs||(libs=Promise.all([import('three'),import('https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/FBXLoader.js')]).then(([THREE,F])=>({THREE,loader:new F.FBXLoader()})));}
const fileCache=new Map();
function loadFile(id){
 if(!fileCache.has(id))fileCache.set(id,getLibs().then(({loader})=>loader.loadAsync(base+'assets/esferas/esfera_'+id+'.fbx?v='+VERSION)));
 return fileCache.get(id);
}
// keep=true: corpo, texturas e efeitos ficam com os materiais do próprio arquivo (sem alterar).
function prepare(THREE,fbx,keep){
 const halos=[];
 // Peças que começam com escala 0 (raios, clarões, faíscas) chegam do FBXLoader com a
 // rotação NaN: o objeto não é desenhado nunca. Zera só o que for inválido.
 fbx.traverse(o=>{
  const r=o.rotation;if(!isFinite(r.x)||!isFinite(r.y)||!isFinite(r.z)){r.set(isFinite(r.x)?r.x:0,isFinite(r.y)?r.y:0,isFinite(r.z)?r.z:0);}
  const q=o.quaternion;if(!isFinite(q.x)||!isFinite(q.y)||!isFinite(q.z)||!isFinite(q.w))o.quaternion.setFromEuler(o.rotation);
  for(const v of [o.position,o.scale])if(!isFinite(v.x)||!isFinite(v.y)||!isFinite(v.z))v.set(isFinite(v.x)?v.x:0,isFinite(v.y)?v.y:0,isFinite(v.z)?v.z:0);
 });
 fbx.traverse(o=>{
  if(!o.isMesh&&!o.isPoints&&!o.isLine)return;
  o.frustumCulled=false;o.castShadow=false;o.receiveShadow=false;
  const list=Array.isArray(o.material)?o.material:[o.material];
  const out=list.map(m=>{
   const name=(m.name||'').toLowerCase(),map=m.map||null;
   if(map)map.colorSpace=THREE.SRGBColorSpace;
   const halo=/^halo(\d+)/.exec(name);
   // Aditivo, mas na fila dos opacos (transparent:false): é desenhado ANTES do corpo,
   // então o corpo cobre o halo na frente e o brilho fica só em volta (como no original).
   if(halo){const nm=new THREE.MeshBasicMaterial({vertexColors:true,transparent:false,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false,side:THREE.FrontSide});
    nm.userData.haloIndex=+halo[1];halos.push(nm);return nm;}
   if(keep)return m;
   if(name==='vcadd'){
    // Raios: miolo branco + faixa de brilho azul. No desenho original a faixa tem
    // 30% de força (o miolo, 100%); aplica isso às cores do próprio arquivo.
    // (cache por geometria do arquivo: o clone() do Three compartilha o userData)
    const g=o.geometry;let ng=RAY_GEO.get(g);
    if(!ng&&g&&g.attributes.color){
     ng=g.clone();ng.userData={};const nc=ng.attributes.color;
     for(let i=0;i<nc.count;i++){const r=nc.getX(i),gg=nc.getY(i),b=nc.getZ(i);if(Math.min(r,gg,b)<.9)nc.setXYZ(i,r*.3,gg*.3,b*.3);}
     // Com a esfera pequena no jogo os fios ficam finos demais (somem na tela):
     // engrossa cada faixa em volta do próprio centro, sem mudar o caminho do raio.
     const P=ng.attributes.position;
     if(!ng.index&&P.count%6===0){const v=[0,0,0,0,0,0].map(()=>new THREE.Vector3()),m=new THREE.Vector3();
      for(let q=0;q<P.count;q+=6){for(let k=0;k<6;k++)v[k].fromBufferAttribute(P,q+k);const K=nc.getX(q)>.9?WIDTH.core:WIDTH.glow;
       for(const [i0,i1] of [[0,1],[2,5]]){m.copy(v[i0]).add(v[i1]).multiplyScalar(.5);v[i0].sub(m).multiplyScalar(K).add(m);v[i1].sub(m).multiplyScalar(K).add(m);}
       v[3].copy(v[2]);v[4].copy(v[1]);for(let k=0;k<6;k++)P.setXYZ(q+k,v[k].x,v[k].y,v[k].z);}}
     nc.needsUpdate=true;P.needsUpdate=true;ng.computeBoundingSphere();RAY_GEO.set(g,ng);
    }
    if(ng)o.geometry=ng;
    return new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:true,fog:false,toneMapped:false,side:THREE.DoubleSide});}
   if(name==='vc')return new THREE.MeshBasicMaterial({vertexColors:true,fog:false,toneMapped:false,side:THREE.DoubleSide});
   const transparent=!!(m.transparent||/^tex_|neb|gal/.test(name));
   return new THREE.MeshBasicMaterial({map,color:map?0xffffff:(m.color||0xffffff),vertexColors:!map&&!!(o.geometry&&o.geometry.attributes.color),transparent,depthWrite:!transparent,alphaTest:transparent?.02:0,fog:false,toneMapped:false,side:transparent?THREE.DoubleSide:THREE.FrontSide});
  });
  for(const m of list)if(!out.includes(m))m.dispose&&m.dispose();
  o.material=Array.isArray(o.material)?out:out[0];
  if(/^halo/i.test(o.name))o.renderOrder=1;else if(out.some(m=>m.transparent))o.renderOrder=3;else o.renderOrder=2;
 });
 // Brilho mais forte perto da esfera, sumindo para fora (perfil do halo original).
 const n=Math.max(1,halos.length);
 for(const m of halos){const k=m.userData.haloIndex/(n-1||1);m.opacity=.16*Math.pow(1-k,2.2)+.012;}
}
async function create(id){
 if(!IDS.includes(id))throw Error('Esfera desconhecida: '+id);
 const [{THREE},src]=await Promise.all([getLibs(),loadFile(id)]);
 // Cada esfera ganha a sua cópia (o mesmo arquivo pode estar em uso na prévia e no jogo).
 const fbx=src.clone(true);
 prepare(THREE,fbx,ORIGINAL.has(id)); 
 const body=fbx.getObjectByName('Corpo')||fbx.getObjectByName('Casca');
 fbx.updateMatrixWorld(true);
 const bb=new THREE.Box3();if(body)bb.setFromObject(body);
 const size=body&&!bb.isEmpty()?bb.getSize(new THREE.Vector3()):new THREE.Vector3(100,100,100);
 const center=body&&!bb.isEmpty()?bb.getCenter(new THREE.Vector3()):new THREE.Vector3();
 const holder=new THREE.Group(),root=new THREE.Group();
 fbx.position.sub(center);holder.add(fbx);holder.scale.setScalar(2/Math.max(size.x,size.y,size.z,.001));
 root.add(holder);root.name='Esfera de Poder · '+INFO[id].nome;
 const clips=src.animations||[];
 const mixer=clips.length?new THREE.AnimationMixer(fbx):null;
 if(mixer)for(const c of clips){const a=mixer.clipAction(c);a.setLoop(THREE.LoopRepeat,Infinity);a.play();}
 return {id,root,
  update(dt){if(mixer)mixer.update(dt);},
  dispose(){root.traverse(o=>{if(o.material)[].concat(o.material).forEach(m=>m.dispose());});if(mixer)mixer.stopAllAction();}
 };
}
window.EsferasDePoder={IDS,INFO,create,cor:id=>INFO[id].cor,preload:id=>loadFile(id)};
})();
