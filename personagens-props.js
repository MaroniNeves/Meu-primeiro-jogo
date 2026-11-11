/* Objetos usados nas animações (espada, escudo, arco, tocha, baú, porta...). Medidas em metros.
   Nas mãos, o eixo +y do objeto sai pelo lado do polegar, +z é a palma e x segue os dedos. */
export function makeProps(THREE,H){
 const {Group,Mesh,Vector3}=THREE;
 const mat=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.7},o||{}));
 const M={wood:mat('#7a5132'),woodD:mat('#4f3320'),steel:mat('#c9d2dc',{metalness:.7,roughness:.3}),gold:mat('#d9b04a',{metalness:.6,roughness:.4}),leather:mat('#5a3a26'),stone:mat('#8a8f98'),
  red:mat('#b8322c'),blue:mat('#2f62b8'),white:mat('#f2efe6'),rope:mat('#d9cfae'),iron:mat('#4a4f58',{metalness:.5,roughness:.5}),
  fire:new THREE.MeshBasicMaterial({color:'#ffb347',transparent:true,opacity:.92}),fire2:new THREE.MeshBasicMaterial({color:'#fff2b0',transparent:true,opacity:.95}),
  glow:new THREE.MeshBasicMaterial({color:'#7fe9ff',transparent:true,opacity:.85}),glow2:new THREE.MeshBasicMaterial({color:'#e8fbff'}),ring:new THREE.MeshBasicMaterial({color:'#9d7bff',transparent:true,opacity:.7,side:THREE.DoubleSide}),
  water:mat('#3d8fbf',{transparent:true,opacity:.8,roughness:.2}),gem:mat('#39d98a',{emissive:'#0d6b3d',roughness:.2}),glass:mat('#bfe3f5',{transparent:true,opacity:.45})};
 const m=(geo,ma,x,y,z)=>{const o=new Mesh(geo,ma);o.position.set(x||0,y||0,z||0);o.castShadow=true;o.receiveShadow=true;return o;};
 const box=(w,h,d,ma,x,y,z)=>m(new THREE.BoxGeometry(w,h,d),ma,x,y,z);
 const cyl=(r1,r2,h,ma,x,y,z,seg)=>m(new THREE.CylinderGeometry(r1,r2,h,seg||12),ma,x,y,z);
 const sph=(r,ma,x,y,z)=>m(new THREE.SphereGeometry(r,16,12),ma,x,y,z);
 const flame=(s)=>{const g=new Group();const a=m(new THREE.ConeGeometry(.07*s,.28*s,10),M.fire,0,.14*s,0),b=m(new THREE.ConeGeometry(.04*s,.17*s,8),M.fire2,0,.1*s,0);a.castShadow=b.castShadow=false;g.add(a,b);g.userData.flame=true;return g;};
 const line=(n,color)=>{const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));const l=new THREE.Line(geo,new THREE.LineBasicMaterial({color}));l.frustumCulled=false;return l;};
 const setLine=(l,pts)=>{const a=l.geometry.attributes.position;pts.forEach((p,i)=>a.setXYZ(i,p.x,p.y,p.z));a.needsUpdate=true;};
 const arrow=()=>{const g=new Group();const sh=cyl(.006,.006,.72,M.wood,.36,0,0,6);sh.rotation.z=Math.PI/2;const tip=m(new THREE.ConeGeometry(.016,.06,6),M.steel,.75,0,0);tip.rotation.z=-Math.PI/2;g.add(sh,tip);
  for(let i=0;i<3;i++){const f=box(.09,.03,.002,M.red,.05,0,0);f.rotation.x=i*Math.PI/1.5;f.position.set(.05,Math.cos(i*2.09)*.014,Math.sin(i*2.09)*.014);g.add(f);}return g;};   // ponta em +x, penas na origem
 const B={
  sword(){const g=new Group();const bl=m(new THREE.CylinderGeometry(.004,.034,.82,4),M.steel,0,.53,0);bl.scale.z=.28;g.add(bl,box(.2,.028,.04,M.gold,0,.11,0),cyl(.016,.018,.17,M.leather,0,.02,0),sph(.026,M.gold,0,-.08,0));return g;},
  shield(){const g=new Group();const d=cyl(.3,.3,.03,M.blue,0,0,0,28);d.rotation.x=Math.PI/2;const rim=m(new THREE.TorusGeometry(.3,.02,8,32),M.steel);const boss=sph(.07,M.steel,0,0,-.03);boss.scale.z=.5;
   const cr=box(.4,.05,.012,M.gold,0,0,-.02),cr2=box(.05,.4,.012,M.gold,0,0,-.02);g.add(d,rim,boss,cr,cr2);g.position.set(-.1,0,-.075);return g;},
  hammer(){const g=new Group();g.add(cyl(.016,.018,.5,M.wood,0,.17,0),box(.2,.09,.09,M.iron,0,.43,0));return g;},
  bow(){const g=new Group();const pts=[];for(let i=0;i<=20;i++){const y=-.62+i*.062,k=y/.62;pts.push(new Vector3(.03-.2*k*k,y,0));}
   g.add(m(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),40,.013,8),M.wood),cyl(.018,.018,.14,M.leather,.03,0,0));
   const str=line(3,'#f2efe6');g.add(str);const ar=arrow();g.add(ar);g.userData={str,ar,tipX:-.17,tipY:.62};return g;},
  arrow(){return arrow();},arrowH(){return arrow();},spearFly(){return B.spear();},itemH(){return B.item();},
  quiver(){const g=new Group();const q=cyl(.05,.04,.5,M.leather,0,0,0);g.add(q);for(let i=0;i<5;i++){const a=i*1.26;g.add(cyl(.005,.005,.2,M.wood,Math.cos(a)*.022,.33,Math.sin(a)*.022,5),box(.03,.06,.003,M.red,Math.cos(a)*.022,.4,Math.sin(a)*.022));}
   g.position.set(-.1,.08,-.15);g.rotation.z=.45;return g;},
  torch(){const g=new Group();const f=flame(1.1);f.position.y=.48;g.add(cyl(.018,.014,.55,M.woodD,0,.16,0),cyl(.035,.03,.1,M.rope,0,.44,0),f);const l=new THREE.PointLight('#ffb35a',1.2,5);l.position.y=.6;g.add(l);g.userData.f=f;return g;},
  spear(){const g=new Group();g.add(cyl(.014,.014,1.9,M.wood,0,.15,0,8));const t=m(new THREE.ConeGeometry(.035,.2,6),M.steel,0,1.2,0);g.add(t,cyl(.02,.02,.05,M.gold,0,1.08,0));return g;},
  rod(){const g=new Group();g.add(cyl(.006,.014,1.9,M.woodD,0,.85,0,6),cyl(.03,.03,.04,M.iron,.03,.1,0));g.rotation.x=.5;const tip=new Group();tip.position.y=1.8;g.add(tip);g.userData.tip=tip;return g;},
  item(){const g=new Group();const o=m(new THREE.OctahedronGeometry(.05),M.gem);g.add(o);return g;},
  orb(){const g=new Group();const a=sph(.09,M.glow),b=sph(.05,M.glow2);a.castShadow=b.castShadow=false;g.add(a,b);return g;},
  ringFx(){const g=new Group();const r=m(new THREE.RingGeometry(.8,1,40),M.ring);r.rotation.x=-Math.PI/2;r.position.y=.03;r.castShadow=false;g.add(r);return g;},
  chest(){const g=new Group();g.add(box(.7,.32,.42,M.wood,0,.16,0),box(.72,.04,.44,M.iron,0,.02,0),box(.06,.1,.02,M.gold,0,.27,.22));const lid=new Group();lid.position.set(0,.32,-.21);
   lid.add(box(.7,.1,.42,M.woodD,0,.05,.21),box(.72,.03,.44,M.iron,0,.1,.21));g.add(lid);const gl=sph(.12,M.fire2,0,.26,0);gl.castShadow=false;gl.visible=false;g.add(gl);g.position.set(0,0,.68);g.userData={lid,gl};return g;},
  door(){const g=new Group();g.add(box(.1,2.1,.14,M.woodD,.5,1.05,0),box(.1,2.1,.14,M.woodD,-.5,1.05,0),box(1.1,.1,.14,M.woodD,0,2.15,0));const d=new Group();d.position.set(.45,0,0);
   d.add(box(.9,2.05,.05,M.wood,-.45,1.03,0),sph(.035,M.gold,-.8,1.0,-.05),sph(.035,M.gold,-.8,1.0,.05),box(.9,.06,.06,M.iron,-.45,.5,0),box(.9,.06,.06,M.iron,-.45,1.6,0));g.add(d);g.position.set(0,0,.72);g.userData={d};return g;},
  window(){const g=new Group();g.add(box(1.3,.08,.14,M.woodD,0,1.75,0),box(1.3,.08,.14,M.woodD,0,.95,0),box(.08,.88,.14,M.woodD,.61,1.35,0),box(.08,.88,.14,M.woodD,-.61,1.35,0),box(2.2,.95,.1,M.white,0,.475,0),box(.5,.8,.1,M.white,.9,1.35,0),box(.5,.8,.1,M.white,-.9,1.35,0));
   const mk=(s)=>{const p=new Group();p.position.set(s*.57,1.35,-.06);p.add(box(.57,.72,.03,M.wood,-s*.285,0,0),box(.5,.03,.04,M.woodD,-s*.285,.2,0),box(.5,.03,.04,M.woodD,-s*.285,-.2,0));g.add(p);return p;};
   g.userData={l:mk(1),r:mk(-1)};g.position.set(0,0,.62);return g;},
  ladder(){const g=new Group();g.add(box(.05,4,.05,M.wood,.25,2,0),box(.05,4,.05,M.wood,-.25,2,0));const rg=new Group();for(let i=0;i<14;i++)rg.add(box(.5,.04,.04,M.woodD,0,i*.3,0));g.add(rg);g.position.set(0,0,.36);g.userData={rg};return g;},
  stairs(){const g=new Group();const st=[];for(let i=0;i<7;i++){const b=box(1,.2,.3,M.stone);g.add(b);st.push(b);}g.userData={st};return g;},
  campfire(){const g=new Group();for(let i=0;i<8;i++){const a=i/8*6.283;g.add(sph(.07,M.stone,Math.cos(a)*.3,.04,Math.sin(a)*.3));}for(let i=0;i<4;i++){const l=cyl(.04,.04,.5,M.woodD,0,.1,0,7);l.rotation.z=1.1;l.rotation.y=i*1.57;g.add(l);}
   const f=flame(2.2);f.position.y=.08;f.scale.setScalar(.001);g.add(f);const l=new THREE.PointLight('#ffa24a',0,6);l.position.y=.5;g.add(l);g.position.set(0,0,.62);g.userData={f,l};return g;},
  log(){const g=new Group();const l=cyl(.19,.19,.38,M.woodD,0,.19,0,14);g.add(l,cyl(.17,.17,.01,M.wood,0,.385,0,14));return g;},
  anvil(){const g=new Group();g.add(cyl(.2,.22,.5,M.woodD,0,.25,0,12),box(.34,.12,.18,M.iron,0,.56,0),box(.2,.06,.14,M.iron,0,.47,0));g.position.set(-.2,0,.5);return g;},
  pond(){const g=new Group();const w=cyl(1.6,1.6,.02,M.water,0,.01,0,32);w.castShadow=false;const bob=sph(.045,M.red,0,.04,0);g.add(w,bob);const ln=line(2,'#f2efe6');g.add(ln);g.position.set(0,0,3.3);g.userData={bob,ln};return g;}
 };
 const items={},active=[];
 function get(name){if(!items[name]){items[name]=B[name]();items[name].name=name;}return items[name];}
 function show(list){
  for(const o of active){o.visible=false;}active.length=0;
  for(const e of list){const [name,where]=e.split('@'),o=get(name),h=H[where||'world'];if(o.parent!==h)h.add(o);o.visible=true;active.push(o);
   if(name==='shield'&&where==='R'){o.position.x=.1;}}
 }
 return {items:new Proxy(items,{get:(t,k)=>t[k]||(B[k]?get(k):undefined)}),show,setLine,Vector3};
}
