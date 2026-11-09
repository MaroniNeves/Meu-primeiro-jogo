/* Arbustos folha por folha, com galhos por dentro.
   window.arcanoBush.make({w,h,d,...}) devolve um grupo com:
   - núcleo escuro e arredondado (fecha o miolo, projeta sombra),
   - galhos marrons que sobem do chão e se ramificam (aparecem entre as folhas),
   - centenas de folhas pintadas (cartões com nervura e contorno), cor variando com a altura,
     mais densas na casca e algumas pelo interior.
   O material se chama "bush leaf", então o vento das folhas do jogo também faz balançar. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
let seed=9001;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

const leafTex=(()=>{
 const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.translate(64,64);
 const shape=()=>{g.beginPath();g.moveTo(0,-60);g.bezierCurveTo(38,-36,36,30,0,60);g.bezierCurveTo(-36,30,-38,-36,0,-60);g.closePath();};
 const gr=g.createLinearGradient(0,-60,0,60);gr.addColorStop(0,'#b4e46a');gr.addColorStop(.5,'#74c04a');gr.addColorStop(1,'#3d8f3c');
 shape();g.fillStyle=gr;g.fill();
 g.save();shape();g.clip();
 g.strokeStyle='rgba(20,70,30,.55)';g.lineWidth=3.2;g.beginPath();g.moveTo(0,-58);g.lineTo(0,58);g.stroke();
 g.lineWidth=2;for(let i=-4;i<=4;i++){const y=i*12;g.beginPath();g.moveTo(0,y);g.lineTo(26,y-14);g.moveTo(0,y);g.lineTo(-26,y-14);g.stroke();}
 g.fillStyle='rgba(255,255,210,.22)';g.beginPath();g.ellipse(-12,-22,9,24,.25,0,6.3);g.fill();
 g.restore();
 shape();g.lineWidth=4;g.strokeStyle='rgba(18,54,26,.9)';g.stroke();
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
})();
const leafMat=new T.MeshStandardMaterial({map:leafTex,alphaTest:.5,side:T.DoubleSide,vertexColors:true,roughness:1,name:'bush leaf'});
const coreMat=new T.MeshStandardMaterial({color:'#2a5a2e',roughness:1,name:'bush core'});
const twigMat=new T.MeshStandardMaterial({color:'#5a3c24',roughness:1,name:'bush twig'});

function hsl2rgb(h,s,l){const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1));};return [f(0),f(8),f(4)];}

// Galhos: hastes que sobem do chão e se abrem; juntadas numa malha só.
function branchGeometry(w,h,d,count){
 const P=[],N=[];
 const add=(ax,ay,az,bx,by,bz,r)=>{
  const dir=new T.Vector3(bx-ax,by-ay,bz-az),len=dir.length();if(len<.01)return;
  const g=new T.CylinderGeometry(r*.6,r,len,5,1,true).toNonIndexed();
  const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),dir.clone().normalize());
  const m=new T.Matrix4().compose(new T.Vector3((ax+bx)/2,(ay+by)/2,(az+bz)/2),q,new T.Vector3(1,1,1));g.applyMatrix4(m);
  P.push(...g.attributes.position.array);N.push(...g.attributes.normal.array);g.dispose();};
 for(let i=0;i<count;i++){
  const bx=(rnd()-.5)*w*.55,bz=(rnd()-.5)*d*.55;
  const cl=(v,m)=>Math.max(-m,Math.min(m,v));
  const mx=cl(bx+(rnd()-.5)*w*.4,w*.3),my=h*(.3+rnd()*.22),mz=cl(bz+(rnd()-.5)*d*.4,d*.3);
  add(bx,0,bz,mx,my,mz,.05);
  for(let k=0;k<3;k++){const ex=cl(mx+(rnd()-.5)*w*.5,w*.36),ey=Math.min(h*.74,my+h*(.14+rnd()*.26)),ez=cl(mz+(rnd()-.5)*d*.5,d*.36);add(mx,my,mz,ex,ey,ez,.028);
   if(rnd()<.6)add((mx+ex)/2,(my+ey)/2,(mz+ez)/2,cl(ex+(rnd()-.5)*.35,w*.4),Math.min(h*.8,ey+rnd()*.15),cl(ez+(rnd()-.5)*.35,d*.4),.016);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('normal',new T.Float32BufferAttribute(N,3));return g;
}

/* opts: w,h,d (caixa do arbusto), leaf (tamanho da folha), density (folhas por m²), hue (matiz médio),
   round (0..1 arredondamento das quinas), branches (quantidade). */
function make(o){
 o=o||{};const w=o.w||1,h=o.h||1,d=o.d||1,leaf=o.leaf||.2,dens=o.density||95,hue=o.hue||108,rd=o.round==null?.55:o.round,nb=o.branches||Math.max(8,Math.round(w*d*7+8));
 if(o.seed)seed=o.seed>>>0;
 const g=new T.Group();g.name='Arbusto';
 // núcleo: caixa arredondada (esfera achatada + caixa) que fecha o miolo
 const core=new T.Mesh(new T.BoxGeometry(w*.72,h*.7,d*.72),coreMat);core.position.y=h*.42;core.castShadow=true;g.add(core);
 const tw=new T.Mesh(branchGeometry(w,h,d,nb),twigMat);g.add(tw);
 // folhas
 const area={px:d*h,pz:w*h,top:w*d},tot=2*area.px+2*area.pz+area.top,lite=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||innerWidth<700,n=Math.max(40,Math.round(tot*dens*(o.mult||1)*(lite?.62:1)));
 const P=new Float32Array(n*12),U=new Float32Array(n*8),C=new Float32Array(n*12),I=new Uint32Array(n*6);
 const nrm=new T.Vector3(),t1=new T.Vector3(),t2=new T.Vector3(),pt=new T.Vector3(),tmp=new T.Vector3();
 for(let i=0;i<n;i++){
  // escolhe uma face (pesos pela área) e um ponto nela; o miolo recebe folhas pelo "afundamento" para dentro
  const r=rnd()*tot;let fx=0,fy=0,fz=0;
  if(r<area.px){fx=1;pt.set(w/2,rnd()*h,(rnd()-.5)*d);}else if(r<2*area.px){fx=-1;pt.set(-w/2,rnd()*h,(rnd()-.5)*d);}
  else if(r<2*area.px+area.pz){fz=1;pt.set((rnd()-.5)*w,rnd()*h,d/2);}else if(r<2*area.px+2*area.pz){fz=-1;pt.set((rnd()-.5)*w,rnd()*h,-d/2);}
  else{fy=1;pt.set((rnd()-.5)*w,h,(rnd()-.5)*d);}
  const sink=Math.pow(rnd(),2.2)*Math.min(.34,Math.min(w,d)*.45);
  pt.x-=fx*sink;pt.y-=fy*sink;pt.z-=fz*sink;
  // arredonda as quinas: folhas perto das arestas se inclinam para fora e recuam
  nrm.set(fx,fy,fz);
  nrm.x+=(rnd()-.5)*.8;nrm.y+=(rnd()-.4)*.8;nrm.z+=(rnd()-.5)*.8;nrm.normalize();
  if(rd>0){const ex=Math.max(0,Math.abs(pt.x)-(w/2-.28)),ez=Math.max(0,Math.abs(pt.z)-(d/2-.28)),ey=Math.max(0,pt.y-(h-.28));pt.x-=Math.sign(pt.x)*ex*rd;pt.z-=Math.sign(pt.z)*ez*rd;pt.y-=ey*rd;}
  if(pt.y<.06)pt.y=.06+rnd()*.2;
  // folha: eixo comprido t2 (para cima, caindo um pouco), largura t1
  t1.set(rnd()-.5,rnd()-.5,rnd()-.5).cross(nrm).normalize();t2.copy(nrm).cross(t1).normalize();
  if(t2.y<0)t2.negate();tmp.copy(t2).multiplyScalar(-.25*rnd());
  const s=leaf*(.72+rnd()*.7),lw=s*.6,ll=s;
  const cx=pt.x,cy=pt.y,cz=pt.z,v=i*12;
  const px=[[-lw/2,0],[lw/2,0],[lw/2,ll],[-lw/2,ll]];
  for(let k=0;k<4;k++){const ax=px[k][0],ay=px[k][1];P[v+k*3]=cx+t1.x*ax+t2.x*ay;P[v+k*3+1]=cy+t1.y*ax+t2.y*ay;P[v+k*3+2]=cz+t1.z*ax+t2.z*ay;}
  U.set([0,0,1,0,1,1,0,1],i*8);
  const hh=cy/h,l=.2+.2*hh+rnd()*.12+(sink<.06?.04:0),col=hsl2rgb(hue+(rnd()-.5)*26+(rnd()<.08?-24:0),.5+rnd()*.2,l);
  for(let k=0;k<4;k++){C[v+k*3]=col[0];C[v+k*3+1]=col[1];C[v+k*3+2]=col[2];}
  I.set([i*4,i*4+1,i*4+2,i*4,i*4+2,i*4+3],i*6);
 }
 const lg=new T.BufferGeometry();lg.setAttribute('position',new T.BufferAttribute(P,3));lg.setAttribute('uv',new T.BufferAttribute(U,2));lg.setAttribute('color',new T.BufferAttribute(C,3));lg.setIndex(new T.BufferAttribute(I,1));lg.computeVertexNormals();
 // normais "de arbusto": apontam para fora do centro (sombreamento redondo em vez de cartões soltos)
 {const nn=lg.attributes.normal,pp=lg.attributes.position,cen=new T.Vector3(0,h*.45,0);for(let i=0;i<pp.count;i++){tmp.set(pp.getX(i),pp.getY(i),pp.getZ(i)).sub(cen);tmp.x/=w;tmp.y/=h;tmp.z/=d;tmp.normalize();nn.setXYZ(i,tmp.x,tmp.y*.8+.2,tmp.z);}}
 const lm=new T.Mesh(lg,leafMat);lm.name='Arbusto folhas';lm.castShadow=false;lm.receiveShadow=true;lm.frustumCulled=true;g.add(lm);
 return g;
}
window.arcanoBush={make,leafMat};
})();
