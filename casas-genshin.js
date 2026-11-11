/* Casas de enxaimel em anime pintado (referência: Mondstadt / Porto Ormos).
   Tudo é gerado por código e juntado por material (poucas chamadas de desenho):
   - paredes de reboco pintado com estrutura de madeira grossa (postes, vigas, esquadros curvos, X),
   - telhados íngremes de beirais côncavos, com tábuas de empena e telhas pintadas,
   - torre octogonal com espigão côncavo e lucarnas, janelas em arco com treliça,
   - varanda com balaústres sobre pórtico em arcos, porta em arco, chaminé, barris e vasos,
   - hera folha por folha pendendo dos beirais e das paredes.
   window.arcanoCasas.build({style:'mond'|'porto', floors, w, d, tower, seed}) -> THREE.Group */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const PI=Math.PI,TAU=PI*2;
const rng=s=>{s=(s>>>0)||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};};
const cv=S=>{const c=document.createElement('canvas');c.width=c.height=S;return c;};
const tex=(c,rep)=>{const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t;};
const gm=(()=>{const t=new T.DataTexture(new Uint8Array([108,108,108,255,188,188,188,255,255,255,255,255]),3,1,T.RGBAFormat);t.minFilter=t.magFilter=T.NearestFilter;t.needsUpdate=true;return t;})();

/* ---------- Texturas pintadas ---------- */
function brush(base,pal,n,seed,o){o=o||{};const S=256,c=cv(S),g=c.getContext('2d'),R=rng(seed);g.fillStyle=base;g.fillRect(0,0,S,S);
 for(let i=0;i<n;i++){const x=R()*S,y=R()*S,a=(o.ang||0)+(R()-.5)*(o.spread==null?.8:o.spread),l=(o.l0||26)+R()*((o.l1||80)-(o.l0||26)),w=(o.w0||8)+R()*((o.w1||20)-(o.w0||8));
  g.fillStyle=pal[(R()*pal.length)|0];g.globalAlpha=.4+R()*.5;
  for(const ox of[-S,0,S])for(const oy of[-S,0,S]){g.save();g.translate(x+ox,y+oy);g.rotate(a);g.beginPath();g.ellipse(0,0,l/2,w/2,0,0,7);g.fill();g.restore();}}
 g.globalAlpha=1;return {c,g,S};}
const TEX={};
/* madeira "limpa": cor chapada com faixas largas e suaves e só 3 ou 4 fios de veio. */
function cleanWood(pal,seed,horizontal){const S=256,c=cv(S),g=c.getContext('2d'),R=rng(seed);g.fillStyle=pal[1];g.fillRect(0,0,S,S);
 for(let i=0;i<7;i++){const x=R()*S,w=26+R()*52,col=R()<.5?pal[0]:pal[2];g.fillStyle=col;g.globalAlpha=.22+R()*.2;
  for(const ox of[-S,0,S]){g.beginPath();g.moveTo(x+ox,-10);g.bezierCurveTo(x+ox+(R()-.5)*14,S*.3,x+ox+(R()-.5)*14,S*.7,x+ox+(R()-.5)*8,S+10);g.lineTo(x+ox+w,S+10);g.bezierCurveTo(x+ox+w+(R()-.5)*14,S*.7,x+ox+w+(R()-.5)*14,S*.3,x+ox+w,-10);g.closePath();g.fill();}}
 g.globalAlpha=1;g.lineCap='round';
 for(let i=0;i<4;i++){const x=R()*S,len=S*(.35+R()*.5),y0=R()*S,ph=R()*6;g.strokeStyle=pal[0];g.globalAlpha=.32;g.lineWidth=2.2+R()*1.6;
  for(const oy of[-S,0]){g.beginPath();for(let t=0;t<=len;t+=8){const xx=x+Math.sin(t*.03+ph)*2.4,yy=y0+oy+t;t?g.lineTo(xx,yy):g.moveTo(xx,yy);}g.stroke();}}
 g.globalAlpha=1;
 if(horizontal){const r=cv(S),rg=r.getContext('2d');rg.translate(S/2,S/2);rg.rotate(PI/2);rg.drawImage(c,-S/2,-S/2);return tex(r);}
 return tex(c);}
function mats(S){
 const P=S.pal,M={};
 const plaster=brush(S.plaster[0],S.plaster,260,11,{l0:30,l1:90,w0:10,w1:26,spread:1.3});
 M.plaster=new T.MeshToonMaterial({map:tex(plaster.c),gradientMap:gm});
 M.timber=new T.MeshToonMaterial({map:cleanWood(S.timber,7,false),gradientMap:gm});
 M.timberH=new T.MeshToonMaterial({map:cleanWood(S.timber,9,true),gradientMap:gm});
 M.door=new T.MeshToonMaterial({map:cleanWood(S.door||S.timber,21,false),gradientMap:gm});
 // telhas: escamas pintadas
 const sh=brush(S.roof[0],S.roof,240,31,{l0:20,l1:60,w0:8,w1:16,spread:1.6});const g=sh.g;g.strokeStyle=S.roofLine;g.lineWidth=3;g.globalAlpha=.75;
 for(let r=0;r<8;r++)for(let k=-1;k<5;k++){g.beginPath();g.arc((k+(r%2)*.5)*64+32,r*32,32,0,PI);g.stroke();}g.globalAlpha=1;
 M.roof=new T.MeshToonMaterial({map:tex(sh.c),gradientMap:gm,side:T.DoubleSide});
 // pedra
 const st=brush('#d9ccb0',['#e8dcc2','#c9bb9e','#bfb39c','#efe4cc'],220,41,{});const gs=st.g;gs.strokeStyle='#8f8068';gs.lineWidth=3;gs.globalAlpha=.8;
 for(let r=0;r<4;r++){gs.beginPath();gs.moveTo(0,r*64);gs.lineTo(256,r*64);gs.stroke();for(let k=0;k<2;k++){const x=(k+(r%2)*.5)*128;gs.beginPath();gs.moveTo(x,r*64);gs.lineTo(x,r*64+64);gs.stroke();}}gs.globalAlpha=1;
 M.stone=new T.MeshToonMaterial({map:tex(st.c),gradientMap:gm});
 M.glass=new T.MeshToonMaterial({color:S.glass,emissive:S.glassEm,emissiveIntensity:.55,gradientMap:gm});
 M.iron=new T.MeshToonMaterial({color:'#3a3d48',gradientMap:gm});
 M.cap=new T.MeshToonMaterial({color:S.cap||'#7a7570',gradientMap:gm});
 // folha da hera
 const lc=cv(128),lg=lc.getContext('2d');lg.translate(64,64);lg.beginPath();lg.moveTo(0,56);lg.bezierCurveTo(-60,34,-48,-34,0,-58);lg.bezierCurveTo(48,-34,60,34,0,56);lg.closePath();lg.fillStyle='#8c8c8c';lg.fill();
 lg.strokeStyle='#5c5c5c';lg.lineWidth=5;lg.beginPath();lg.moveTo(0,56);lg.lineTo(0,-50);lg.stroke();
 const lt=new T.CanvasTexture(lc);lt.colorSpace=T.SRGBColorSpace;
 M.leaf=new T.MeshStandardMaterial({map:lt,alphaTest:.5,side:T.DoubleSide,vertexColors:true,roughness:1,name:'ivy leaf'});
 if(window.arcanoPaintLeaf)window.arcanoPaintLeaf(M.leaf);
 return M;}

/* ---------- Construtor: junta tudo por material ---------- */
const TILE={plaster:2.4,timber:1.5,timberH:1.5,door:1.2,stone:1.8,roof:0,glass:0,iron:1,cap:1,leaf:0};
function Builder(){
 const buckets={},stack=[new T.Matrix4()],V=new T.Vector3(),Q=new T.Quaternion(),E=new T.Euler(),Sc=new T.Vector3(),N=new T.Vector3(),A=new T.Vector3(),Bv=new T.Vector3(),Cv=new T.Vector3();
 const B={
  push(x,y,z,ry){const m=new T.Matrix4().compose(V.set(x,y,z),Q.setFromEuler(E.set(0,ry||0,0)),Sc.set(1,1,1));stack.push(stack[stack.length-1].clone().multiply(m));},
  pop(){stack.pop();},
  add(key,geo,x,y,z,ry,o){o=o||{};
   const m=new T.Matrix4().compose(V.set(x||0,y||0,z||0),Q.setFromEuler(E.set(o.rx||0,ry||0,o.rz||0,'YXZ')),Sc.set(o.sx||1,o.sy||1,o.sz||1));m.premultiply(stack[stack.length-1]);
   let g=geo.index?geo.toNonIndexed():geo.clone();if(!g.attributes.normal)g.computeVertexNormals();g.applyMatrix4(m);
   const b=buckets[key]||(buckets[key]={P:[],N:[],U:[],C:[]});const P=g.attributes.position,Nn=g.attributes.normal,U=g.attributes.uv,n=P.count,tile=TILE[key]||0,col=o.color;
   for(let i=0;i<n;i+=3){
    A.fromBufferAttribute(P,i);Bv.fromBufferAttribute(P,i+1);Cv.fromBufferAttribute(P,i+2);N.crossVectors(Bv.clone().sub(A),Cv.clone().sub(A)).normalize();
    const ax=Math.abs(N.x),ay=Math.abs(N.y),az=Math.abs(N.z),mode=ax>ay&&ax>az?0:ay>az?1:2;
    for(let k=0;k<3;k++){const j=i+k;const x0=P.getX(j),y0=P.getY(j),z0=P.getZ(j);b.P.push(x0,y0,z0);b.N.push(Nn.getX(j),Nn.getY(j),Nn.getZ(j));
     if(tile&&!o.keepUV){const u=mode===0?z0:x0,v=mode===1?z0:y0;b.U.push(u/tile,v/tile);}
     else if(U)b.U.push(U.getX(j)*(o.us||1),U.getY(j)*(o.vs||1));else b.U.push(0,0);
     if(col)b.C.push(col.r,col.g,col.b);else b.C.push(1,1,1);}
   }
   g.dispose();},
  box(key,w,h,d,x,y,z,ry,o){B.add(key,new T.BoxGeometry(w,h,d),x,y,z,ry,o);},
  finish(M,shadow){const grp=new T.Group();
   for(const k in buckets){const b=buckets[k],g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.P,3));g.setAttribute('normal',new T.Float32BufferAttribute(b.N,3));g.setAttribute('uv',new T.Float32BufferAttribute(b.U,2));g.setAttribute('color',new T.Float32BufferAttribute(b.C,3));
    g.computeBoundingSphere();const me=new T.Mesh(g,M[k]);me.name='casa '+k;me.castShadow=k!=='leaf'&&k!=='glass'||k==='leaf'&&shadow;me.receiveShadow=true;grp.add(me);}
   return grp;}
 };
 return B;}

/* ---------- Formas ---------- */
function archShape(w,h,holes){const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(-w/2,h-w/2);s.absarc(0,h-w/2,w/2,PI,0,true);s.lineTo(w/2,0);s.lineTo(-w/2,0);return s;}
function archGeo(w,h,depth){return new T.ExtrudeGeometry(archShape(w,h),{depth,bevelEnabled:false,curveSegments:10});}
function archFrame(w,h,f,depth){const s=archShape(w+2*f,h+f),hole=new T.Path();const iw=w;hole.moveTo(-iw/2,0);hole.lineTo(-iw/2,h-iw/2);hole.absarc(0,h-iw/2,iw/2,PI,0,true);hole.lineTo(iw/2,0);hole.lineTo(-iw/2,0);s.holes.push(hole);return new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:10});}
// esquadro curvo (mão-francesa): quarto de arco côncavo
function kneeGeo(s,t,depth){const sh=new T.Shape();sh.moveTo(0,0);sh.lineTo(s,0);sh.quadraticCurveTo(t*.9,t*.9,0,s);sh.lineTo(0,0);return new T.ExtrudeGeometry(sh,{depth,bevelEnabled:false,curveSegments:8});}

/* faixa curva de madeira: quarto de círculo centrado em (cx,cy), de a0 a a1 (rad) */
function arcBrace(B,cx,cy,r,a0,a1,z,th){const n=7;let p=null;for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;if(p){const dx=x-p[0],dy=y-p[1],L=Math.hypot(dx,dy);B.add('timber',new T.BoxGeometry(L+.05,th||.17,.2),(x+p[0])/2,(y+p[1])/2,z==null?.08:z,0,{rz:Math.atan2(dy,dx)});}p=[x,y];}}
/* janela em arco com moldura, treliça em losango e peitoril. Frente em +z, base em y=0. */
function windowArch(B,S,x,y,z,w,h,opt){opt=opt||{};B.push(x,y,z,0);
 B.add('timber',archFrame(w,h,.13,.2),0,0,-.04);
 B.add('glass',archGeo(w,h,.04),0,0,.02);
 // treliça: barras finas em X (losangos)
 for(const d of[-1,1])B.box('timber',.03,h*.95,.03,0,h*.45,.1,0,{rz:d*.42});
 B.box('timber',.04,h-w*.4,.04,0,(h-w*.4)/2,.11);
 B.box('timber',w+.3,.07,.1,0,h*.55,.1);
 B.box('timberH',w+.4,.1,.3,0,-.04,.1); // peitoril
 if(opt.shutters){for(const sx of[-1,1]){B.box('door',w*.52,h*.95,.06,sx*(w/2+w*.3),h*.48,.06);}}
 if(opt.flowers){B.box('door',w+.2,.2,.24,0,-.2,.22);}
 B.pop();}

/* parede com estrutura de madeira. Em coordenadas locais: x∈[-w/2,w/2], y de 0 a h, normal +z. */
function wallFrame(B,S,w,h,floors,fh,o){o=o||{};
 const post=S.postW||.24,nx=Math.max(1,Math.round(w/(o.step||3))),xs=[];for(let i=0;i<=nx;i++)xs.push(-w/2+w*i/nx);
 for(const x of xs)B.box('timber',post,h,.22,x,h/2,.1);
 for(let f=0;f<=floors;f++)B.box('timberH',w+post,S.beamH||.24,.24,0,f*fh+.02,.1);
 B.box('timberH',w+post,.2,.24,0,h-.05,.1);
 for(let f=0;f<floors;f++)for(let i=0;i<nx;i++){
  const cx=(xs[i]+xs[i+1])/2,pw=xs[i+1]-xs[i],yb=f*fh+.14,yt=(f+1)*fh-.12;
  if(o.skip&&o.skip(cx,f))continue;
  if(S.braces==='x'){const L=Math.hypot(pw-post,fh-.3),an=Math.atan2(fh-.3,pw-post);for(const sg of[-1,1])B.box('timber',L*.98,.15,.14,cx,yb+(fh-.3)/2,.08,0,{rz:sg*an});}
  else{const k=Math.min(.6,(pw-post)*.2,(fh-.3)*.2),xl=xs[i]+post/2,xr=xs[i+1]-post/2;
   arcBrace(B,xl+k,yt-k,k,PI/2,PI,.08);arcBrace(B,xr-k,yt-k,k,0,PI/2,.08);arcBrace(B,xl+k,yb+k,k,PI,PI*1.5,.08);arcBrace(B,xr-k,yb+k,k,PI*1.5,PI*2,.08);}
 }
 return xs;}

/* ---------- Telhado de beirais côncavos (cumeeira em x) ---------- */
function yprof(d,D,Hr,q){return Hr*Math.pow(Math.max(0,1-d/D),q);}
function roofGable(B,S,len,s,ov,Hr,q,wallTop,thick,o){o=o||{};
 const D=s+ov,ys=yprof(s,D,Hr,q),base=wallTop+.1-ys,seg=18,th=thick||.16;
 // pontos do perfil
 const prof=[];for(let i=0;i<=seg;i++){const d=D*i/seg;prof.push([d,yprof(d,D,Hr,q)]);}
 const xl=len/2+.35;
 const mk=(offY,flip)=>{const P=[],U=[],I=[];let arc=0;
  for(const sg of[1,-1]){const off=P.length/3;arc=0;
   for(let i=0;i<=seg;i++){if(i){const dd=prof[i][0]-prof[i-1][0],dy=prof[i][1]-prof[i-1][1];arc+=Math.hypot(dd,dy);}
    for(const x of[-xl,xl]){P.push(x,prof[i][1]+offY,sg*prof[i][0]);U.push(x/2.2,arc/1.6);}}
   for(let i=0;i<seg;i++){const a=off+i*2;I.push(a,a+1,a+2,a+1,a+3,a+2);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('uv',new T.Float32BufferAttribute(U,2));g.setIndex(I);g.computeVertexNormals();return g;};
 // face superior (normais arrumadas: sempre para cima) e inferior
 const top=mk(0),bot=mk(-th);
 const fixUp=(g,up)=>{const N=g.attributes.normal;for(let i=0;i<N.count;i++){if((N.getY(i)<0)===up)N.setXYZ(i,-N.getX(i),-N.getY(i),-N.getZ(i));}};
 fixUp(top,true);fixUp(bot,false);
 B.push(0,base,0,0);
 B.add('roof',top,0,0,0,0,{keepUV:true});B.add('roof',bot,0,0,0,0,{keepUV:true});
 // beiral: fascia
 for(const sg of[1,-1]){const d=D,y=prof[seg][1];B.box('timberH',len+.7,th+.06,.1,0,y-th/2,sg*d,0);}
 // tábuas de empena: caixas seguindo o perfil nas duas pontas
 for(const ex of[-1,1])for(const sg of[1,-1])for(let i=0;i<seg;i++){const [d0,y0]=prof[i],[d1,y1]=prof[i+1],cz=sg*(d0+d1)/2,cy=(y0+y1)/2-.05,L=Math.hypot(d1-d0,y1-y0)+.02,an=Math.atan2(y1-y0,(d1-d0)*sg);
  B.add('timber',new T.BoxGeometry(.16,.34,L),ex*(xl-.02),cy,cz,0,{rx:-Math.atan2((y1-y0),(d1-d0))*sg*-1});}
 // cumeeira
 B.box('timberH',len+.7,.2,.4,0,Hr+.06,0,0);
 // empena: preenchimento de reboco com estrutura
 if(!o.noGable){
  const sh=new T.Shape(),y0=ys-th-.45;sh.moveTo(-s,y0);sh.lineTo(s,y0);for(let i=seg;i>=0;i--){const [d,y]=prof[i];if(d<=s+1e-6)sh.lineTo(d,y-th-.01);}for(let i=0;i<=seg;i++){const [d,y]=prof[i];if(d<=s+1e-6&&d>0)sh.lineTo(-d,y-th-.01);}sh.lineTo(-s,y0);
  const eg=new T.ExtrudeGeometry(sh,{depth:.14,bevelEnabled:false});
  for(const ex of[-1,1]){B.push(ex*(len/2-.07),0,0,ex>0?PI/2:-PI/2);B.add('plaster',eg,0,0,0,0);
   // estrutura da empena: poste central, viga e escoras
   B.box('timber',.22,Hr*.95,.2,0,Hr*.5+.05,.1);B.box('timberH',s*2,.22,.2,0,ys-th-.3,.1);
   for(const sg of[-1,1]){const L=Math.hypot(s*.55,Hr*.5);B.box('timber',.16,L,.16,sg*s*.28,ys*.1+Hr*.3,.1,0,{rz:-sg*Math.atan2(s*.55,Hr*.5)*-1});}
   B.pop();}
 }
 B.pop();
 return {base,prof,D,ys,yAt:d=>base+yprof(d,D,Hr,q)};}

/* telhado cônico de torre: espigão côncavo com beiral aberto */
function spire(B,S,R,Hh,p,y0,sides){
 const pts=[];for(let i=0;i<=22;i++){const t=i/22;pts.push(new T.Vector2(R*Math.pow(1-t,p),Hh*t));}
 const g=new T.LatheGeometry(pts,sides||8);B.add('roof',g,0,y0,0,0,{us:3,vs:2.5,keepUV:true});
 const gb=new T.LatheGeometry([new T.Vector2(R,0),new T.Vector2(R-.03,-.16),new T.Vector2(R*.7,-.16),new T.Vector2(R*.7,-.02)],sides||8);B.add('timberH',gb,0,y0,0,0,{});
 // nervuras de madeira nos cantos do espigão
 const n=sides||8;for(let k=0;k<n;k++){const a=k*TAU/n;let prev=null;for(let i=0;i<=14;i++){const t=i/14,r=R*Math.pow(1-t,p),y=Hh*t;if(prev){const dx=r-prev.r,dy=y-prev.y,L=Math.hypot(dx,dy);B.add('timber',new T.BoxGeometry(.11,L+.03,.13),Math.sin(a)*(r+prev.r)/2,y0+(y+prev.y)/2,Math.cos(a)*(r+prev.r)/2,a,{rx:Math.atan2(dx,dy)});}prev={r,y};}}
 B.add('cap',new T.ConeGeometry(.16,.7,8),0,y0+Hh+.3,0,0);B.add('cap',new T.SphereGeometry(.14,8,6),0,y0+Hh+.72,0,0);}

/* lucarna (mini-empena com janela) sobre o telhado */
function dormer(B,S,x,yRoof,z,ry,w){B.push(x,yRoof,z,ry);
 B.box('plaster',w,w*.95,.5,0,w*.47,-.1);
 B.box('timber',.18,w*.95,.2,-w/2,w*.47,.1);B.box('timber',.18,w*.95,.2,w/2,w*.47,.1);
 B.box('timberH',w+.15,.16,.22,0,.02,.1);
 B.add('glass',new T.BoxGeometry(w*.56,w*.5,.05),0,w*.42,.16,0);B.box('timber',.05,w*.5,.06,0,w*.42,.2);B.box('timber',w*.56,.05,.06,0,w*.42,.2);
 // telhadinho
 const sh=new T.Shape();sh.moveTo(-w*.68,0);sh.lineTo(w*.68,0);sh.lineTo(0,w*.62);sh.lineTo(-w*.68,0);
 const g=new T.ExtrudeGeometry(sh,{depth:w*1.0,bevelEnabled:false});B.add('roof',g,0,w*.92,-w*.8,0,{us:.5,vs:.5,keepUV:true});
 B.pop();}

/* hera: cartões de folha pendendo */
function ivy(B,R,x0,y0,z0,w,hang,n,nrm,ry){
 const pg=new T.PlaneGeometry(.24,.29);
 for(let i=0;i<n;i++){
  const fx=(R()-.5)*w,len=hang*(.2+.8*Math.pow(R(),.8)),fy=-R()*len,sway=Math.sin(fx*2.1+i)*.15;
  const c=new T.Color().setHSL(.23+R()*.08,.6,.26+R()*.22);
  B.push(x0,y0,z0,ry);
  B.add('leaf',pg,fx+sway,fy,.08+R()*.16,0,{rx:(R()-.5)*1.2-.2,rz:(R()-.5)*2.4,sx:.7+R()*.6,sy:.7+R()*.6,color:c,keepUV:true});
  B.pop();}}

/* barril com arcos de ferro */
function barrel(B,x,z,s){B.add('door',new T.CylinderGeometry(.34*s,.34*s,.8*s,12),x,.4*s+.02,z,0,{});B.add('door',new T.CylinderGeometry(.42*s,.34*s,.5*s,12),x,.4*s+.02,z,0,{});
 for(const h of[.16,.44,.66])B.add('iron',new T.CylinderGeometry(.4*s,.4*s,.05,12),x,h*s+.02,z,0);}

const STYLES={
 rosa:{plaster:['#f3cfc9','#f8ddd7','#eab9b3','#e8b0aa','#fbe9e4'],timber:['#4f3b3a','#65504c','#7c6560','#95807a'],door:['#4a3a3a','#625050','#7a6a66','#94847e'],
  roof:['#3f9a92','#55b0a6','#2f847d','#6dc4b8','#276e68'],roofLine:'#1c514d',glass:'#9cc0d8',glassEm:'#2a4768',postW:.26,beamH:.26,braces:'knee',cap:'#8a7d78'},
 verde:{plaster:['#dfe7c4','#e9efd2','#cfd9ae','#c5d0a2','#f1f5e0'],timber:['#5a3b22','#74502d','#8d6a41','#a68458'],door:['#4f3420','#6a4a2c','#85613a','#a07c50'],
  roof:['#8d4c36','#a45e42','#783c2b','#b87654','#65301f'],roofLine:'#4a2216',glass:'#8fb2d8',glassEm:'#2a4768',postW:.28,beamH:.28,braces:'knee',cap:'#85796a'},
 branca:{plaster:['#f4f1ea','#faf8f3','#e8e3d8','#dcd6c8','#ffffff'],timber:['#2e3a4e','#3e4e68','#51647f','#67799a'],door:['#2e3a4e','#3e4e68','#51647f','#67799a'],
  roof:['#3d62b0','#4f78c6','#2f4f94','#6892d8','#243e78'],roofLine:'#1a2c5c',glass:'#88b4dc',glassEm:'#1f4a70',postW:.26,beamH:.26,braces:'x',cap:'#7a7c84'},
 amarela:{plaster:['#f8dc8a','#fbe8a8','#efc86a','#e8bd58','#fdf1c6'],timber:['#6b3e22','#865230','#a06a40','#ba8458'],door:['#5e3620','#7a4c2c','#966440','#b07e58'],
  roof:['#d85a30','#ea7244','#bf4624','#f58d5c','#a23618'],roofLine:'#7a2810',glass:'#8fb2d8',glassEm:'#2a4768',postW:.28,beamH:.28,braces:'knee',cap:'#8a7a62'},
 mond:{plaster:['#f4dda8','#f9e8c0','#ecce92','#e6c487','#fbf0d2'],timber:['#68402a','#835331','#9c6a42','#b58259'],door:['#6a4026','#8a5733','#a76f3f','#c28a4e'],
  roof:['#e4602c','#f07a40','#d24d22','#f5935a','#c9441c'],roofLine:'#9a3516',glass:'#8fb2d8',glassEm:'#2a4768',postW:.3,beamH:.3,braces:'knee',cap:'#8a7d6b'},
 porto:{plaster:['#aebfcf','#bccbd8','#9fb2c4','#c8d6e2','#94a8bb'],timber:['#24283a','#323850','#444c68','#5a6384'],door:['#2f3a4a','#3f4c5f','#566478','#6e7e92'],
  roof:['#b95a42','#c96c4e','#a24a34','#d7805e','#8f3f2c'],roofLine:'#6e2e22',glass:'#7aa8cc',glassEm:'#1d4262',postW:.26,beamH:.26,braces:'x',cap:'#6f7279'}
};

/* ---------- Casa completa ---------- */
function build(o){o=o||{};
 const S=STYLES[o.style||'mond'],M=mats(S),R=rng(o.seed||5),B=Builder();
 const floors=o.floors||2,fh=2.9,W=o.w||9.5,D=o.d||6.4,Y0=.55,H=floors*fh,wallTop=Y0+H;
 const towerSide=o.tower===false||o.tower==='none'?0:(o.tower==='right'?1:-1),tower=!!towerSide,bay=o.bay!==false;
 // base de pedra
 B.box('stone',W+.5,Y0,D+.5,0,Y0/2,0);
 // volume principal (reboco)
 B.box('plaster',W,H,D,0,Y0+H/2,0);
 // ---- fachada frontal (+z) com pórtico no centro
 const doorX=0,Wc=bay?(o.bayW||4.6):0;
 const win=(B2,fx,f,w,h,opt)=>windowArch(B2,S,fx,f*fh+.85,.22,w,h,opt);
 const faces=[
  {ry:0,w:W,dz:D/2,front:true},{ry:PI,w:W,dz:D/2},{ry:PI/2,w:D,dz:W/2},{ry:-PI/2,w:D,dz:W/2}];
 for(const F of faces){B.push(0,Y0,0,F.ry);B.push(0,0,F.dz,0);
  const skip=F.front&&bay?((cx,f)=>Math.abs(cx)<Wc/2+.1&&f===0):null;
  const xs=wallFrame(B,S,F.w,H,floors,fh,{skip,step:F.front?3.2:3.0});
  for(let i=0;i<xs.length-1;i++){const cx=(xs[i]+xs[i+1])/2,pw=xs[i+1]-xs[i];
   for(let f=0;f<floors;f++){
    if(F.front&&bay&&Math.abs(cx)<Wc/2+.1&&f===0)continue; // pórtico
    if(F.front&&bay&&Math.abs(cx)<Wc/2+.1&&f>0)continue;    // vai aparecer na baía
    if(F.front&&f===0&&Math.abs(cx)<.01)continue;
    if(!F.front&&f===0&&R()<.35)continue;
    win(B,cx,f,Math.min(.9,pw*.27),1.6,{shutters:R()<(o.shut==null?.4:o.shut),flowers:f===0&&R()<.5});}}
  B.pop();B.pop();}
 // ---- telhado principal
 const Hr=o.roofH||3.9,qq=o.roofQ||1.55,sMain=D/2,roof=roofGable(B,S,W,sMain,o.ov||.95,Hr,qq,Y0+H,.17);
 // ---- baía frontal com pórtico e varanda
 if(bay){
  const pb=1.5,zf=D/2+pb,yb=Y0+fh;
  // piso e parede da baía (andares superiores)
  B.box('plaster',Wc,H-fh,pb,0,yb+(H-fh)/2,D/2+pb/2);
  // pórtico: 4 postes + vigas + arcos
  for(const px of[-Wc/2+.1,-Wc/4,Wc/4,Wc/2-.1])B.box('timber',.26,fh-.1,.26,px,Y0+(fh-.1)/2,zf-.2);
  B.box('timberH',Wc+.4,.34,.4,0,yb-.15,zf-.2);B.box('timberH',Wc+.4,.2,.3,0,Y0+.1,zf-.2);
  {const xp=[-Wc/2+.1,-Wc/4,Wc/4,Wc/2-.1],k=.5,yt=Y0+fh-.3;for(let i=0;i<3;i++){B.push(0,0,zf-.2,0);arcBrace(B,xp[i]+.15+k,yt-k,k,PI/2,PI,0,.2);arcBrace(B,xp[i+1]-.15-k,yt-k,k,0,PI/2,0,.2);B.pop();}}
  // porta em arco recuada na parede principal
  B.push(0,Y0,D/2,0);
  B.add('timber',archFrame(1.5,2.5,.2,.3),0,0,.04);B.add('door',archGeo(1.5,2.5,.12),0,0,.1);
  B.box('timber',.07,2.0,.06,0,1.0,.24);B.box('timberH',1.5,.07,.06,0,1.2,.24);B.box('timberH',1.5,.07,.06,0,.5,.24);B.add('iron',new T.SphereGeometry(.07,6,5),-.12,1.05,.27,0);B.add('iron',new T.SphereGeometry(.07,6,5),.12,1.05,.27,0);
  B.box('stone',2.2,.1,1.1,0,.05,.8);B.box('stone',2.6,.1,.5,0,.0,1.5);
  B.pop();
  // varanda: balaústres sobre o pórtico
  B.push(0,yb,zf,0);
  B.box('timberH',Wc+.6,.2,.3,0,.12,.35);
  const nb=Math.round(Wc/.22);for(let i=0;i<=nb;i++){const x=-Wc/2-.1+i*(Wc+.2)/nb;B.add('timber',new T.CylinderGeometry(.045,.055,.78,6),x,.55,.32,0);}
  B.box('timberH',Wc+.6,.12,.18,0,.97,.32);for(const px of[-Wc/2-.2,Wc/2+.2])B.box('timber',.16,1.05,.16,px,.5,.32);
  B.pop();
  // fachada da baía: 3 janelas em arco
  B.push(0,Y0,zf,0);
  for(let f=1;f<floors;f++){for(const wx of[-1.45,0,1.45])windowArch(B,S,wx,f*fh+.9,.0,1.0,1.75,{});
   for(const px of[-Wc/2,Wc/2])B.box('timber',S.postW,fh,.24,px,f*fh+fh/2,.05);
   B.box('timberH',Wc+.3,.26,.26,0,f*fh+.02,.06);}
  B.box('timberH',Wc+.3,.22,.26,0,H-.05,.06);
  {const k=.7;arcBrace(B,-Wc/2+.15+k,H-.2-k,k,PI/2,PI,.06);arcBrace(B,Wc/2-.15-k,H-.2-k,k,0,PI/2,.06);}
  B.pop();
  // telhado cruzado: cumeeira em z. Interseção numérica com o telhado principal.
  const sc=Wc/2+.1,Hrc=Hr*.62,Dc=sc+.8,ysc=yprof(sc,Dc,Hrc,1.55),baseC=wallTop+.1-ysc,ridgeY=baseC+Hrc;
  let d=0;{const f=dd=>roof.yAt(dd)-ridgeY;let lo=0,hi=sMain+.95;for(let i=0;i<30;i++){const mid=(lo+hi)/2;f(mid)>0?lo=mid:hi=mid;}d=(lo+hi)/2;}
  const frontEdge=zf+.7,lenC=frontEdge-d+.1;
  B.push(0,0,(frontEdge+d)/2-.35,PI/2);
  roofGable(B,S,lenC,sc,.8,Hrc,1.55,wallTop,.16,{noGable:true});
  B.pop();
  // empena frontal da baía com estrutura
  B.push(0,0,zf-.05,0);
  {const sh=new T.Shape(),y0=wallTop-.4,prof=[];for(let i=0;i<=18;i++){const dd=Dc*i/18;prof.push([dd,yprof(dd,Dc,Hrc,1.55)]);}
   sh.moveTo(-sc,y0);sh.lineTo(sc,y0);for(let i=18;i>=0;i--){const [dd,y]=prof[i];if(dd<=sc+1e-6)sh.lineTo(dd,baseC+y-.2);}for(let i=1;i<=18;i++){const [dd,y]=prof[i];if(dd<=sc+1e-6)sh.lineTo(-dd,baseC+y-.2);}
   B.add('plaster',new T.ExtrudeGeometry(sh,{depth:.16,bevelEnabled:false}),0,0,-.06,0);
   B.box('timber',.22,Hrc*.8,.2,0,wallTop+Hrc*.35,.14);B.box('timberH',sc*2,.2,.2,0,wallTop-.1,.14);
   for(const sg of[-1,1])B.box('timber',.16,Hrc*.55,.16,sg*sc*.5,wallTop+Hrc*.25,.14,0,{rz:-sg*.7});
   windowArch(B,S,0,wallTop+.15,.12,.8,1.0,{});
   ivy(B,R,0,wallTop+Hrc*.85,.3,3.2,2.2,119,1,0);}
  B.pop();
 }
 // ---- torre octogonal no canto
 if(tower){const r=o.towerR||1.9,tx=towerSide*(W/2+.2),tz=D/2-.5,th=H+1.1,sides=8;
  B.push(tx,0,tz,0);
  B.add('stone',new T.CylinderGeometry(r+.3,r+.35,Y0,sides),0,Y0/2,0,0);
  B.add('plaster',new T.CylinderGeometry(r,r,th,sides),0,Y0+th/2,0,0);
  for(let k=0;k<sides;k++){const a=k*TAU/sides;B.box('timber',.3,th,.3,Math.sin(a)*(r+.02),Y0+th/2,Math.cos(a)*(r+.02),a);}
  for(let f=0;f<=floors;f++)B.add('timberH',new T.CylinderGeometry(r+.16,r+.16,.28,sides),0,Y0+f*fh+.1,0,0);
  B.add('timberH',new T.CylinderGeometry(r+.34,r+.2,.34,sides),0,Y0+th,0,0);
  for(let k=0;k<sides;k++){const a=(k+.5)*TAU/sides;if(Math.abs(Math.sin(a))>.9&&Math.cos(a)<0)continue;
   for(let f=0;f<floors;f++){B.push(Math.sin(a)*(r*.93),Y0+f*fh+.9,Math.cos(a)*(r*.93),a);windowArch(B,S,0,0,.0,.95,1.7,{});B.pop();
    }}
  spire(B,S,r*1.62,4.9,1.6,Y0+th+.2,sides);
  // lucarnas na espiga
  for(const a of[0,PI/2+.0,-PI/2]){const rr=r*1.62*Math.pow(1-.3,1.6),yy=Y0+th+.2+4.9*.3;dormer(B,S,Math.sin(a)*rr*.98,yy,Math.cos(a)*rr*.98,a,.8);}
  ivy(B,R,0,Y0+th-.2,r+.2,2.6,3.4,102,1,0.0);ivy(B,R,0,Y0+th-.2,r+.2,2.6,3.4,102,1,PI/4);
  B.pop();}
 // ---- anexo lateral baixo, com telhado próprio
 if(o.annex&&floors>=2){const side=towerSide?-towerSide:(o.annex==='left'?-1:1),aw=3.8,ad=D*.78,ah=fh+.2,ax=side*(W/2+aw/2-.15),az=-(D-ad)/2-.1;
  B.push(ax,0,az,0);
  B.box('stone',aw+.4,Y0,ad+.4,0,Y0/2,0);B.box('plaster',aw,ah,ad,0,Y0+ah/2,0);
  for(const sx of[-1,1])for(const sz of[-1,1])B.box('timber',.28,ah,.28,sx*aw/2,Y0+ah/2,sz*ad/2);
  B.box('timberH',aw+.3,.24,ad+.3,0,Y0+.02,0);B.box('timberH',aw+.3,.24,ad+.3,0,Y0+ah-.05,0);
  B.push(0,Y0,ad/2,0);windowArch(B,S,-.6,.9,.14,.9,1.5,{shutters:true});B.pop();
  B.push(0,Y0,ad/2,0);B.add('timber',archFrame(1.1,2.1,.16,.26),1.1,0,.06);B.add('door',archGeo(1.1,2.1,.1),1.1,0,.1);B.pop();
  B.push(side*aw/2,Y0,0,side*PI/2);windowArch(B,S,0,.9,.14,.9,1.5,{});B.pop();
  B.pop();
  B.push(ax,0,az,PI/2);roofGable(B,S,ad,aw/2,.75,2.1,qq,Y0+ah,.15);B.pop();
  barrel(B,ax+side*.2,az+ad/2+.7,.9);
 }
 // ---- lucarnas no telhado principal
 if(o.dormers!==0)for(const sx of(o.dormers===1?[W*.28]:[-W*.28,W*.28])){const dd=sMain*.55,y=roof.yAt(dd);dormer(B,S,sx,y-.2,dd-.1,0,1.0);}
 // ---- chaminé
 {const cx=W*.32,dd=sMain*.2,y=roof.yAt(dd);B.box('stone',.9,2.2,.9,cx,y+.7,-dd);B.box('cap',1.1,.18,1.1,cx,y+1.85,-dd);B.box('stone',.7,.3,.7,cx,y+2.05,-dd);}
 // ---- hera pelas paredes
 ivy(B,R,W*.22,wallTop-.1,D/2+.05,3.4,3.2,153,1,0);
 ivy(B,R,-W*.1,wallTop-.1,D/2+.05,2.4,2.0,85,1,0);
 ivy(B,R,W/2+.02,wallTop-.1,.5,3.2,3.0,119,1,PI/2);
 // ---- barris e vasos
 barrel(B,-Wc/2-.4,D/2+1.9,1);barrel(B,Wc/2+.5,D/2+1.8,1.1);
 const g=B.finish(M,o.leafShadow);g.name='Casa '+(o.style||'mond');
 const bb=new T.Box3().setFromObject(g);g.userData.size=bb.getSize(new T.Vector3());
 return g;}

/* sorteia uma configuração de casa a partir de um número */
function random(seed){const R=rng(seed*7919+13),names=Object.keys(STYLES),f=R();
 return {style:names[(R()*names.length)|0],floors:f<.2?1:f<.72?2:3,w:7.6+R()*3.6,d:5.8+R()*1.8,tower:R()<.55?(R()<.5?'left':'right'):'none',bay:R()<.82,bayW:3.8+R()*1.4,
  roofH:3.0+R()*1.9,roofQ:1.35+R()*.6,ov:.8+R()*.5,annex:R()<.5,dormers:R()<.3?0:R()<.4?1:2,shut:R()*.7,towerR:1.7+R()*.5,seed:(R()*99999)|0};}
window.arcanoCasas={build,STYLES,random};
})();
