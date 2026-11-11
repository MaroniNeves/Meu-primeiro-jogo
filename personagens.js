/* Personagens com esqueleto + animações feitas por poses (sem arquivos de animação).
   - Esqueleto: o do modelo 2 (quadril, coluna, pescoço, braços com dedos, pernas, ossos de torção e de "dobra").
     Os modelos sem esqueleto recebem o mesmo esqueleto, com os pesos copiados do vértice mais próximo do modelo 2;
     o cabelo (reconhecido pela cor da textura e por estar afastado do corpo) fica preso à cabeça e ao tronco, não aos braços.
   - Poses: escritas em ângulos "de boneco" no espaço do personagem (x = esquerda, y = cima, z = frente) e convertidas
     para cada osso. Cada pose é "aterrada": o ponto mais baixo do corpo encosta no chão.
   - Deformação: a torção do braço, antebraço e coxa é repartida pelos ossos de torção; os ossos de "dobra" de joelho e
     cotovelo ficam a meio caminho; a clavícula sobe junto quando o braço levanta. Isso evita a malha afinar ou torcer.
   Uso: const p=await loadCharacter(THREE,'female2'); cena.add(p.root); p.play('andar'); a cada quadro p.update(dt). */
import {ANIMS,BASE} from './personagens-anims.js?v=3';
import {makeProps} from './personagens-props.js?v=3';
export const PERSONAGENS={female1:{nome:'Personagem 1 (cabelo)',file:'female1.fbx'},female2:{nome:'Personagem 2',file:'female2.fbx'},female3:{nome:'Personagem 3 (sem pintura)',file:'female3.fbx'}};
export const ANIMACOES=Object.keys(ANIMS).filter(id=>!ANIMS[id].oculto).map(id=>({id,nome:ANIMS[id].nome}));
const ALTURA=1.62,DONOR='female2',DEG=Math.PI/180;
let loaderP=null;const rawCache={};
async function fbx(file,fresh){
 if(!loaderP)loaderP=import('https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/FBXLoader.js').then(m=>new m.FBXLoader());
 const L=await loaderP,url=new URL('./assets/personagens/'+file,import.meta.url).href;if(fresh)return L.loadAsync(url);return rawCache[file]||(rawCache[file]=L.loadAsync(url));
}
const FINGERS=['Index','Mid','Ring','Pinky'];
function flat(p,out,pre){for(const k in p){const v=p[k];if(typeof v==='number')out[pre+k]=v;else if(Array.isArray(v))v.forEach((x,i)=>{out[pre+k+'.'+i]=x;});else if(v&&typeof v==='object')flat(v,out,pre+k+'.');}return out;}
const BASEF=flat(BASE,{},'');
export function poseVec(over){const o=Object.assign({},BASEF);if(over)flat(over,o,'');return o;}
function lerpVec(a,b,t){const o={};for(const k in a)o[k]=a[k]+((b[k]===undefined?a[k]:b[k])-a[k])*t;return o;}
const ease=t=>t*t*(3-2*t),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export async function loadCharacter(THREE,id){
 const cfg=PERSONAGENS[id];if(!cfg)throw new Error('personagem '+id);
 const {Quaternion:Q,Vector3:V3}=THREE;
 let g=await fbx(cfg.file,true);
 let skinned=null;g.traverse(o=>{if(o.isSkinnedMesh)skinned=o;});
 if(!skinned){const donor=await fbx(PERSONAGENS[DONOR].file,true);g=await transferSkin(THREE,g,donor);g.traverse(o=>{if(o.isSkinnedMesh)skinned=o;});}
 skinned.frustumCulled=false;skinned.castShadow=true;skinned.receiveShadow=true;
 g.position.set(0,0,0);g.rotation.set(0,0,0);g.scale.set(1,1,1);g.updateMatrixWorld(true);
 const bones=[];g.traverse(o=>{if(o.isBone)bones.push(o);});const B={};for(const b of bones)B[b.name]=b;
 // tamanho pelo comprimento do braço aberto (o cabelo não entra na conta) e chão pela malha em repouso
 const box=new THREE.Box3().setFromObject(skinned),ground0=box.min.y;
 const hl=new V3(),hr=new V3();B.L_Hand.getWorldPosition(hl);B.R_Hand.getWorldPosition(hr);
 const S=ALTURA*.66/hl.distanceTo(hr);
 const root=new THREE.Group();root.name=cfg.nome;const norm=new THREE.Group();root.add(norm);norm.add(g);
 norm.rotation.y=-Math.PI/2;norm.scale.setScalar(S);g.position.y=-ground0;
 const world=new THREE.Group();world.name='objetos de cena';root.add(world);
 root.updateMatrixWorld(true);
 const info=new Map(),gInv=new THREE.Matrix4().copy(g.matrixWorld).invert();
 for(const b of bones){const wq=new Q();b.getWorldQuaternion(wq);const pq=new Q();b.parent.getWorldQuaternion(pq);const ps=new V3();b.parent.getWorldScale(ps);const ws=new V3();b.getWorldScale(ws);
  const wp=new V3();b.getWorldPosition(wp).applyMatrix4(gInv);
  info.set(b,{restW:wq,restP:b.position.clone(),parentW:pq,parentS:ps.x||1,scale:ws.x||1,restY:wp.y,A:new Q(),W:new Q()});}
 const contact=[];const addC=(n,r)=>{if(B[n])contact.push([B[n],r]);};
 for(const s of ['L_','R_']){addC(s+'ToeBase',info.get(B[s+'ToeBase']).restY-ground0);addC(s+'Foot',info.get(B[s+'Foot']).restY-ground0);addC(s+'Calf',.045);addC(s+'Hand',.02);addC(s+'Forearm',.03);addC(s+'Upperarm',.04);}
 addC('Pelvis',.085);addC('Spine01',.08);addC('Spine02',.085);addC('Head',.075);
 // suportes de objetos: alinhados ao personagem na pose de repouso e em metros
 const holder=(bone,off)=>{const I=info.get(bone),h=new THREE.Group(),qi=I.restW.clone().invert();h.quaternion.copy(qi);h.scale.setScalar(1/I.scale);h.position.copy(new V3(off[0],off[1],off[2]).applyQuaternion(qi).divideScalar(I.scale));bone.add(h);return h;};
 const H={L:holder(B.L_Hand,[.085,0,.028]),R:holder(B.R_Hand,[-.085,0,.028]),back:holder(B.Spine02,[0,0,0]),hip:holder(B.Pelvis,[0,0,0]),world};
 const props=makeProps(THREE,H);
 const ax={x:new V3(1,0,0),y:new V3(0,1,0),z:new V3(0,0,1)};
 const R=(a,deg)=>new Q().setFromAxisAngle(ax[a],deg*DEG);
 const mul=(...qs)=>{const o=new Q();for(const q of qs)o.multiply(q);return o;};
 const tmpV=new V3(),tmpQ=new Q(),tmpM=new THREE.Matrix4();
 function applyPose(p){
  const D={};const set=(n,q)=>{if(B[n])D[n]=q;};
  set('Hip',mul(R('y',p['root.1']),R('x',p['root.0']),R('z',p['root.2'])));
  set('Pelvis',mul(R('y',p['pelvis.1']),R('x',p['pelvis.0']),R('z',p['pelvis.2'])));
  for(const n of ['Waist','Spine01','Spine02'])set(n,mul(R('y',p['spine.1']/3),R('x',p['spine.0']/3),R('z',p['spine.2']/3)));
  for(const n of ['NeckTwist01','NeckTwist02'])set(n,mul(R('y',p['neck.1']/2),R('x',p['neck.0']/2),R('z',p['neck.2']/2)));
  set('Head',mul(R('y',p['head.1']),R('x',p['head.0']),R('z',p['head.2'])));
  for(const [S_,s,k] of [['L_',1,'armL.'],['R_',-1,'armR.']]){
   const tw=p[k+'twist'],ft=p[k+'ftwist'],el=clamp(p[k+'elbow'],0,150),dn=p[k+'down'],fw=p[k+'fwd'];
   const auto=clamp(-dn*.3,0,24)+clamp((fw-70)*.2,0,20)*clamp(dn/60,0,1);            // a clavícula acompanha o braço que sobe
   set(S_+'Clavicle',mul(R('z',s*(p[k+'shrug']+auto)),R('y',-s*p[k+'clavFwd'])));
   set(S_+'Upperarm',mul(R('x',-fw),R('y',-s*p[k+'across']),R('z',-s*dn)));
   set(S_+'UpperarmTwist01',R('x',tw/2));set(S_+'UpperarmTwist02',R('x',tw/2));
   set(S_+'Forearm',mul(R('x',tw),R('y',-s*el)));
   set(S_+'ElbowShareBone',R('y',s*el/2));
   set(S_+'ForearmTwist01',R('x',ft/2));set(S_+'ForearmTwist02',R('x',ft/2));
   set(S_+'Hand',mul(R('x',ft),R('y',-s*p[k+'wrist']),R('z',-s*p[k+'wristIn'])));
   const c=clamp(p[k+'grip'],0,1);
   for(const f of FINGERS)for(let i=1;i<=3;i++)set(S_+f+i,R('y',-s*c*(i===1?62:80)));
   set(S_+'Thumb1',mul(R('y',-s*c*30),R('z',-s*c*22)));set(S_+'Thumb2',R('y',-s*c*28));set(S_+'Thumb3',R('y',-s*c*35));
  }
  for(const [S_,s,k] of [['L_',1,'legL.'],['R_',-1,'legR.']]){
   const tw=p[k+'twist'],kn=clamp(p[k+'knee'],0,140);
   set(S_+'Thigh',mul(R('z',s*p[k+'out']),R('x',-p[k+'fwd'])));
   set(S_+'ThighTwist01',R('y',s*tw/2));set(S_+'ThighTwist02',R('y',s*tw/2));
   set(S_+'Calf',mul(R('y',s*tw),R('x',kn)));
   set(S_+'KneeShareBone',R('x',-kn/2));
   set(S_+'Foot',mul(R('x',p[k+'foot']),R('z',s*p[k+'footRoll'])));
   set(S_+'ToeBase',R('x',-p[k+'toe']));
  }
  for(const b of bones){const I=info.get(b),par=b.parent.isBone?info.get(b.parent):null,d=D[b.name];
   if(par)I.A.copy(par.A);else I.A.identity();
   if(d)I.A.multiply(d);
   I.W.copy(I.A).multiply(I.restW);
   tmpQ.copy(par?par.W:I.parentW).invert();b.quaternion.copy(tmpQ).multiply(I.W);
   if(b.name==='Hip')b.position.copy(I.restP);}
  const hip=B.Hip,HI=info.get(hip);g.updateMatrixWorld(true);tmpM.copy(g.matrixWorld).invert();
  let low=1e9;for(const [b,r] of contact){tmpV.setFromMatrixPosition(b.matrixWorld).applyMatrix4(tmpM);low=Math.min(low,tmpV.y-ground0-r);}
  const off=new V3(p.px,p.ground*(-low*S)+p.lift,p.pz);
  tmpQ.copy(HI.parentW).invert();off.applyQuaternion(tmpQ).divideScalar(HI.parentS);hip.position.copy(HI.restP).add(off);
 }
 /* ---------- reprodução ---------- */
 let cur=null,t=0,from=null,blend=1,lastVec=poseVec(),clock=0;
 function evalAnim(a,time){
  if(a.fn){const ph=a.loop?(time/a.dur)%1:Math.min(1,time/a.dur);return poseVec(a.fn(ph,time));}
  const ks=a.keys,T=a.loop?time%a.dur:Math.min(time,a.dur);let i=0;while(i<ks.length-2&&T>=ks[i+1].t)i++;
  const k0=ks[i],k1=ks[i+1]||k0,u=k1.t>k0.t?clamp((T-k0.t)/(k1.t-k0.t),0,1):0;
  return lerpVec(k0.v||(k0.v=poseVec(k0.p)),k1.v||(k1.v=poseVec(k1.p)),(k1.lin)?u:ease(u));
 }
 const v3=new V3();
 const ctx={P:props.items,H,root,S,t:0,ph:0,dur:1,dt:0,
  pos(obj,out){obj.getWorldPosition(out||v3);return root.worldToLocal(out||v3);},
  ramp:(a,b,x)=>clamp((x-a)/(b-a),0,1),V3,setLine:props.setLine};
 function play(id){const a=ANIMS[id]||ANIMS.parado;if(cur===a)return;from=lastVec;blend=0;cur=a;t=0;props.show(a.props||[]);}
 function setTime(time){t=time;blend=1;step(0);}
 function update(dt){t+=dt;clock+=dt;blend=Math.min(1,blend+dt/.22);step(dt);}
 function step(dt){if(!cur)return;let v=evalAnim(cur,t);if(blend<1&&from)v=lerpVec(from,v,ease(blend));
  if(!cur.fn){v['spine.0']+=.9*Math.sin(clock*1.7);v['head.0']-=.5*Math.sin(clock*1.7);}       // respiração leve em tudo
  lastVec=v;applyPose(v);
  if(cur.tick){root.updateMatrixWorld(true);ctx.t=cur.loop?t%cur.dur:Math.min(t,cur.dur);ctx.ph=ctx.t/cur.dur;ctx.dur=cur.dur;ctx.dt=dt;ctx.time=t;cur.tick(ctx);}}
 const api={root,play,update,setTime,skeletonRoot:g,bones:B,holders:H,props,scale:S,applyPose,poseVec,get anim(){return cur;}};
 play('parado');step(0);return api;
}

/* ---------- copia esqueleto e pesos do doador para uma malha sem esqueleto ---------- */
async function transferSkin(THREE,target,donor){
 let dm=null;donor.traverse(o=>{if(o.isSkinnedMesh)dm=o;});let tm=null;target.traverse(o=>{if(o.isMesh&&!tm)tm=o;});
 donor.updateMatrixWorld(true);target.updateMatrixWorld(true);
 const dg=dm.geometry,dp=dg.attributes.position,dsi=dg.attributes.skinIndex.array,dsw=dg.attributes.skinWeight.array;
 const tg=tm.geometry.clone();tg.applyMatrix4(tm.matrixWorld);const tp=tg.attributes.position;
 const DP=new Float32Array(dp.count*3),v=new THREE.Vector3();
 for(let i=0;i<dp.count;i++){v.fromBufferAttribute(dp,i).applyMatrix4(dm.matrixWorld);DP[i*3]=v.x;DP[i*3+1]=v.y;DP[i*3+2]=v.z;}
 const bbD=new THREE.Box3().setFromArray(DP);tg.computeBoundingBox();const bbT=tg.boundingBox;
 // alinha pela envergadura (z), pelo chão (y) e pela posição dos pés (x)
 const sc=(bbD.max.z-bbD.min.z)/(bbT.max.z-bbT.min.z);
 const feetX=(n,bb,get)=>{let sx=0,c=0;const lim=bb.min.y+(bb.max.y-bb.min.y)*.06;for(let i=0;i<n;i++)if(get(i,1)<lim){sx+=get(i,0);c++;}return c?sx/c:0;};
 const fxD=feetX(dp.count,bbD,(i,k)=>DP[i*3+k]),fxT=feetX(tp.count,bbT,(i,k)=>k?tp.getY(i):tp.getX(i));
 tg.scale(sc,sc,sc);tg.translate(fxD-fxT*sc,bbD.min.y-bbT.min.y*sc,(bbD.min.z+bbD.max.z)/2-(bbT.min.z+bbT.max.z)/2*sc);
 const Hh=bbD.max.y-bbD.min.y,y0=bbD.min.y,zc=(bbD.min.z+bbD.max.z)/2;
 // cor da textura (para reconhecer o cabelo)
 let px=null,pw=0,ph=0;const uv=tg.attributes.uv,img=tm.material&&tm.material.map&&tm.material.map.image;
 if(img&&uv){try{if(img.decode)await img.decode().catch(()=>{});else if(!img.complete)await new Promise(r=>{img.onload=r;img.onerror=r;});
   const c=document.createElement('canvas');pw=c.width=Math.min(1024,img.width||1024);ph=c.height=Math.min(1024,img.height||1024);const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,pw,ph);px=x.getImageData(0,0,pw,ph).data;}catch(e){px=null;}}
 const cell=.02,key=(x,y,z)=>((x*73856093)^(y*19349663)^(z*83492791))|0,grid=new Map();
 for(let i=0;i<dp.count;i++){const k=key(Math.floor(DP[i*3]/cell),Math.floor(DP[i*3+1]/cell),Math.floor(DP[i*3+2]/cell));let a=grid.get(k);if(!a)grid.set(k,a=[]);a.push(i);}
 const names=dm.skeleton.bones.map(b=>b.name),iHead=names.indexOf('Head'),iSp=names.indexOf('Spine02');
 // mãos rígidas: os dedos do modelo sem esqueleto não casam com os do doador; pesos dos dedos vão para a mão (evita "espinhos" ao fechar a mão)
 const remap=names.map((nm,i)=>{const m=/^([LR]_)(Index|Mid|Ring|Pinky|Thumb)d$/.exec(nm);return m?names.indexOf(m[1]+'Hand'):i;});
 const n=tp.count,SI=new Uint16Array(n*4),SW=new Float32Array(n*4);let hair=0;
 for(let i=0;i<n;i++){const x=tp.getX(i),y=tp.getY(i),z=tp.getZ(i),cx=Math.floor(x/cell),cy=Math.floor(y/cell),cz=Math.floor(z/cell);let best=-1,bd=1e9;
  for(let rad=1;rad<=3&&best<0;rad++){for(let a=-rad;a<=rad;a++)for(let b=-rad;b<=rad;b++)for(let c=-rad;c<=rad;c++){const arr=grid.get(key(cx+a,cy+b,cz+c));if(!arr)continue;for(const j of arr){const dx=DP[j*3]-x,dy=DP[j*3+1]-y,dz=DP[j*3+2]-z,d=dx*dx+dy*dy+dz*dz;if(d<bd){bd=d;best=j;}}}}
  if(best<0){for(let j=0;j<dp.count;j+=97){const dx=DP[j*3]-x,dy=DP[j*3+1]-y,dz=DP[j*3+2]-z,d=dx*dx+dy*dy+dz*dz;if(d<bd){bd=d;best=j;}}}
  let isHair=false;const yy=(y-y0)/Hh;
  if(px){const u=uv.getX(i),w=uv.getY(i),ix=Math.min(pw-1,Math.max(0,Math.floor((u-Math.floor(u))*pw))),iy=Math.min(ph-1,Math.max(0,Math.floor((1-(w-Math.floor(w)))*ph))),o=(iy*pw+ix)*4,r=px[o]/255,gg=px[o+1]/255,b=px[o+2]/255,lum=.3*r+.59*gg+.11*b;
   isHair=lum<.62&&(r-b)>.06&&gg<.5&&yy>.42&&(Math.sqrt(bd)>.003*Hh||yy>.8);}
  if(isHair&&Math.abs(z-zc)>.105*Hh)isHair=false;   // mechas deitadas sobre os braços seguem o braço
  if(isHair){hair++;const wh=Math.min(1,Math.max(0,(yy-.68)/.16));SI[i*4]=iHead;SW[i*4]=wh;SI[i*4+1]=iSp;SW[i*4+1]=1-wh;}
  else{const acc=new Map();for(let k=0;k<4;k++){const bi=remap[dsi[best*4+k]];acc.set(bi,(acc.get(bi)||0)+dsw[best*4+k]);}let k=0;for(const [bi,w] of acc){SI[i*4+k]=bi;SW[i*4+k]=w;k++;}}}
 tg.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(SI,4));tg.setAttribute('skinWeight',new THREE.Float32BufferAttribute(SW,4));
 const g=new THREE.Group();const map=new Map();
 const cloneTree=(o,parent)=>{if(o.isSkinnedMesh)return;const c=o.isBone?new THREE.Bone():new THREE.Group();c.name=o.name;c.position.copy(o.position);c.quaternion.copy(o.quaternion);c.scale.copy(o.scale);parent.add(c);map.set(o,c);for(const ch of o.children)cloneTree(ch,c);};
 for(const ch of donor.children)cloneTree(ch,g);
 g.updateMatrixWorld(true);
 const bones=dm.skeleton.bones.map(b=>map.get(b)),skel=new THREE.Skeleton(bones,dm.skeleton.boneInverses.map(m=>m.clone()));
 tg.applyMatrix4(new THREE.Matrix4().copy(dm.matrixWorld).invert());
 const mesh=new THREE.SkinnedMesh(tg,tm.material);mesh.name=tm.name;mesh.position.copy(dm.position);mesh.quaternion.copy(dm.quaternion);mesh.scale.copy(dm.scale);g.add(mesh);mesh.bind(skel,dm.bindMatrix.clone());
 g.userData.hairVerts=hair;
 return g;
}
