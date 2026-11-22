/* Texturas pintadas à mão com relevo (estilo anime) para pedra, calçamento, madeira,
   mármore, telhas e reboco. Cada gerador devolve {map, bump}: a cor e um mapa de altura
   que o sombreamento anime transforma em relevo de verdade (juntas, bordas lascadas,
   veios da madeira). Sementes fixas: o desenho é sempre o mesmo e repete sem emenda. */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const rng=seed=>{let s=(seed>>>0)||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};};
const mk=S=>{const c=document.createElement('canvas');c.width=c.height=S;return c;};
const tex=(c,color)=>{const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;if(color)t.colorSpace=T.SRGBColorSpace;return t;};
const rr=(g,x,y,w,h,r)=>{r=Math.max(0,Math.min(r,w/2,h/2));g.beginPath();g.moveTo(x+r,y);g.lineTo(x+w-r,y);g.quadraticCurveTo(x+w,y,x+w,y+r);g.lineTo(x+w,y+h-r);g.quadraticCurveTo(x+w,y+h,x+w-r,y+h);g.lineTo(x+r,y+h);g.quadraticCurveTo(x,y+h,x,y+h-r);g.lineTo(x,y+r);g.quadraticCurveTo(x,y,x+r,y);g.closePath();};
const INK='rgba(48,36,56,.42)';
const out=(cm,ch)=>({map:tex(cm,true),bump:tex(ch,false)});
const rot=c=>{const r=mk(c.width),g=r.getContext('2d');g.translate(c.width/2,c.height/2);g.rotate(Math.PI/2);g.drawImage(c,-c.width/2,-c.height/2);return r;};

/* Grão fino por cima (cor e altura), sem emenda: pontos que atravessam a borda voltam do outro lado. */
function grain(g,S,R,n,dark,light,amount){
 for(let i=0;i<n;i++){const x=R()*S,y=R()*S,r=.5+R()*1.5;g.fillStyle=R()<.5?`rgba(${dark},${amount*R()})`:`rgba(${light},${amount*R()})`;
  for(const ox of [0,-S])for(const oy of [0,-S]){g.beginPath();g.arc(x+ox,y+oy,r,0,6.3);g.fill();}}
}

/* ---------- Pedra em blocos (muros, torres, bases) ---------- */
function stone(o){
 o=o||{};const S=o.size||512,R=rng(o.seed||7),rows=o.rows||8;
 const hue=o.hue!=null?o.hue:36,sat=o.sat!=null?o.sat:20,l0=o.l0!=null?o.l0:40,l1=o.l1!=null?o.l1:60;
 const cm=mk(S),ch=mk(S),g=cm.getContext('2d'),h=ch.getContext('2d');
 g.fillStyle=o.mortar||`hsl(${hue+8},${Math.max(6,sat-8)}%,${Math.max(14,l0-22)}%)`;g.fillRect(0,0,S,S);
 h.fillStyle='#585858';h.fillRect(0,0,S,S);
 const rh=S/rows,m=1.6+S/256;
 const block=(x,y,w,hh)=>{
  const bx=x+m,by=y+m,bw=w-2*m,bh=hh-2*m,rad=Math.min(bh,bw)*.13;
  const L=l0+R()*(l1-l0),H=hue+(R()-.5)*14,Sa=sat+(R()-.5)*10;
  const gr=g.createLinearGradient(0,by,0,by+bh);
  gr.addColorStop(0,`hsl(${H},${Sa}%,${L+8}%)`);gr.addColorStop(.5,`hsl(${H},${Sa}%,${L}%)`);gr.addColorStop(1,`hsl(${H+5},${Sa+6}%,${L-10}%)`);
  g.fillStyle=gr;rr(g,bx,by,bw,bh,rad);g.fill();
  g.save();rr(g,bx,by,bw,bh,rad);g.clip();
  // pinceladas curtas (acabamento pintado)
  for(let i=0,n=bw*bh/240;i<n;i++){const px=bx+R()*bw,py=by+R()*bh,len=4+R()*16,ang=-.3+R()*.6;
   g.strokeStyle=R()<.5?`rgba(255,246,226,${.04+R()*.08})`:`rgba(64,46,44,${.04+R()*.08})`;g.lineWidth=1+R()*2.4;
   g.beginPath();g.moveTo(px,py);g.lineTo(px+Math.cos(ang)*len,py+Math.sin(ang)*len);g.stroke();}
  // poros
  for(let i=0,n=bw*bh/900;i<n;i++){g.fillStyle=`rgba(52,40,38,${.05+R()*.09})`;g.beginPath();g.arc(bx+R()*bw,by+R()*bh,.5+R()*1.1,0,6.3);g.fill();}
  // escorrido de chuva a partir do topo
  if(R()<.35){const sx=bx+R()*bw,sw=2+R()*5,gl=g.createLinearGradient(0,by,0,by+bh);gl.addColorStop(0,'rgba(40,34,40,.26)');gl.addColorStop(1,'rgba(40,34,40,0)');g.fillStyle=gl;g.fillRect(sx,by,sw,bh);}
  // musgo na parte de baixo
  if(o.moss&&R()<o.moss){for(let k=0;k<3;k++){const mx=bx+R()*bw,my=by+bh*(.65+R()*.4),mr=bw*(.12+R()*.2);const mg=g.createRadialGradient(mx,my,0,mx,my,mr);mg.addColorStop(0,'rgba(92,128,62,.62)');mg.addColorStop(1,'rgba(92,128,62,0)');g.fillStyle=mg;g.fillRect(mx-mr,my-mr,mr*2,mr*2);}}
  // rachadura
  if(R()<(o.cracks!=null?o.cracks:.16)){let cx=bx+R()*bw,cy=by+R()*bh*.4;g.strokeStyle='rgba(40,30,34,.65)';g.lineWidth=1.3;g.beginPath();g.moveTo(cx,cy);for(let k=0;k<4;k++){cx+=(R()-.5)*bw*.22;cy+=bh*.16+R()*bh*.1;g.lineTo(cx,cy);}g.stroke();}
  g.restore();
  // contorno de tinta e filete de luz no topo
  g.strokeStyle=INK;g.lineWidth=1.7;rr(g,bx,by,bw,bh,rad);g.stroke();
  g.strokeStyle='rgba(255,250,236,.38)';g.lineWidth=1.5;g.beginPath();g.moveTo(bx+rad+1,by+1.6);g.lineTo(bx+bw-rad-1,by+1.6);g.stroke();
  // altura: bloco levemente abaulado, com borda chanfrada
  const base=128+(R()-.5)*26;
  for(let i=0;i<4;i++){const v=Math.min(255,base+i*16);h.fillStyle=`rgb(${v},${v},${v})`;rr(h,bx+i*1.7,by+i*1.7,Math.max(2,bw-i*3.4),Math.max(2,bh-i*3.4),Math.max(1,rad-i));h.fill();}
 };
 for(let r=0;r<rows;r++){
  const ws=[];let sum=0;while(sum<S-rh*.9){const w=rh*(1.2+R()*1.2);ws.push(w);sum+=w;}
  const k=S/sum;for(let i=0;i<ws.length;i++)ws[i]*=k;
  const off=R()*S;let x=0;
  for(const w of ws){const px=(x+off)%S;block(px,r*rh,w,rh);if(px+w>S)block(px-S,r*rh,w,rh);x+=w;}
 }
 grain(g,S,R,S*2,'40,30,34','255,244,224',.12);
 return out(cm,ch);
}

/* ---------- Ruído suave periódico (repete sem emenda) ---------- */
function ruido(R,periodos){const T=periodos.map(P=>{const v=new Float32Array(P*P);for(let i=0;i<v.length;i++)v[i]=R();return {P,v};});
 const um=(t,x,y)=>{const P=t.P,xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);
  const i0=((xi%P)+P)%P,j0=((yi%P)+P)%P,i1=(i0+1)%P,j1=(j0+1)%P,v=t.v,a=v[j0*P+i0],b=v[j0*P+i1],c=v[j1*P+i0],d=v[j1*P+i1];
  return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy;};
 return (u,v)=>{let s=0,w=0,a=1;for(const t of T){s+=um(t,u*t.P,v*t.P)*a;w+=a;a*=.55;}return s/w;};}

/* ---------- Calçamento (praças, ruas) ----------
   Antes: pedras numa grade regular, contorno preto grosso e relevo em 4 anéis concêntricos (parecia carimbo/serra).
   Agora: células de Voronoi que repetem sem emenda — pedras encaixadas de tamanhos variados, cantos arredondados
   (mínimo suave entre as 2 vizinhas), juntas de terra com variação, relevo em domo e luz suave de cima à esquerda.
   style: round (seixos de rio), rubble (pedra bruta), flag (lajes), setts (paralelepípedos em fiadas). */
function cobble(o){
 o=o||{};const S=o.size||512,R=rng(o.seed||11),n=o.n||7,style=o.style||'round';
 const hue=o.hue!=null?o.hue:36,sat=o.sat!=null?o.sat:22,l0=o.l0!=null?o.l0:44,l1=o.l1!=null?o.l1:66;
 const cm=mk(S),ch=mk(S),g=cm.getContext('2d'),h=ch.getContext('2d');
 const img=g.createImageData(S,S),hb=h.createImageData(S,S),D=img.data,HB=hb.data;
 const nz=ruido(R,[5,11,27]),nz2=ruido(R,[3,7]);
 const k=S/512;
 const mw=(style==='flag'?2.2:style==='setts'?1.8:style==='rubble'?3.2:2.6)*k,bev=(style==='flag'?5:style==='setts'?6:style==='rubble'?8:11)*k;
 // cor de uma pedra
 const hsl=(H,s,l)=>{s/=100;l/=100;const a=s*Math.min(l,1-l),f=q=>{const kk=(q+H/30)%12;return l-a*Math.max(-1,Math.min(kk-3,9-kk,1));};return [f(0)*255,f(8)*255,f(4)*255];};
 const dirt=hsl(hue+6,Math.max(4,sat-6),Math.max(12,l0-24));
 const mkStone=()=>({L:l0+R()*(l1-l0),H:hue+(R()-.5)*16,Sa:Math.max(0,sat+(R()-.5)*12),amp:.75+R()*.35,ph:R()*6.3,moss:o.moss&&R()<o.moss});
 // ---- sementes (Voronoi) ou fiadas (setts)
 let seeds=null,rows=null;
 if(style==='setts'){rows=[];for(let j=0;j<n;j++){const ws=[];let sum=0;while(sum<1.5*n){const w=.75+R()*.6;ws.push(w);sum+=w;}const cols=[];let acc=0;for(const w of ws){cols.push({a:acc/sum,b:(acc+w)/sum,st:mkStone()});acc+=w;}rows.push({off:R(),cols});}}
 else{const jit=style==='flag'?.8:style==='rubble'?.75:.62;seeds=[];
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){seeds.push(Object.assign({x:i+.5+(R()-.5)*jit,y:j+.5+(R()-.5)*jit},mkStone()));}}
 const smin=(a,b,kk)=>{const hh=Math.max(kk-Math.abs(a-b),0)/kk;return Math.min(a,b)-hh*hh*kk*.25;};
 for(let py=0;py<S;py++)for(let px=0;px<S;px++){
  const u=(px+.5)/S,v=(py+.5)/S;let e,st,cx,cy;
  if(rows){const fy=v*n,j=Math.floor(fy),row=rows[j%n],fv=fy-j;let fu=(u+row.off)%1;let c=row.cols[0];for(const q of row.cols)if(fu>=q.a&&fu<q.b){c=q;break;}
   const wpx=(c.b-c.a)*S,hpx=S/n,du=(fu-c.a)*S,dv=fv*hpx;e=smin(smin(du,wpx-du,bev),smin(dv,hpx-dv,bev),bev);st=c.st;cx=(du/wpx-.5)*2;cy=(dv/hpx-.5)*2;}
  else{const gx=u*n,gy=v*n,ci=Math.floor(gx),cj=Math.floor(gy);let d1=1e9,d2=1e9,d3=1e9,s1=null,x1=0,y1=0,s2x=0,s2y=0,s3x=0,s3y=0;
   for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const ii=ci+di,jj=cj+dj,s=seeds[((jj%n+n)%n)*n+((ii%n+n)%n)],sx=s.x+ii-((ii%n+n)%n),sy=s.y+jj-((jj%n+n)%n),d=(sx-gx)*(sx-gx)+(sy-gy)*(sy-gy);
    if(d<d1){d3=d2;s3x=s2x;s3y=s2y;d2=d1;s2x=x1;s2y=y1;d1=d;s1=s;x1=sx;y1=sy;}else if(d<d2){d3=d2;s3x=s2x;s3y=s2y;d2=d;s2x=sx;s2y=sy;}else if(d<d3){d3=d;s3x=sx;s3y=sy;}}
   const bis=(ax,ay)=>{const mx=(x1+ax)/2,my=(y1+ay)/2,vx=ax-x1,vy=ay-y1,l=Math.hypot(vx,vy)||1;return ((mx-gx)*vx+(my-gy)*vy)/l*S/n;};
   e=smin(bis(s2x,s2y),bis(s3x,s3y),bev*(style==='flag'?.6:1.4));st=s1;cx=(gx-x1)*1.6;cy=(gy-y1)*1.6;}
  const nn=nz(u,v),n2=nz2(u,v),i4=(py*S+px)*4;let r,gg,b,hgt;
  const jw=mw*(.75+nn*.6);
  if(e<jw){ // junta de terra/argamassa
   const t=e/Math.max(.001,jw);const base=dirt||[110,92,70];const sh=.78+.22*t+(n2-.5)*.25;
   r=base[0]*sh;gg=base[1]*sh;b=base[2]*sh;if(o.moss&&nn>.62){r=r*.6+60*.4;gg=gg*.6+92*.4;b=b*.6+44*.4;}hgt=.16+.1*t+(nn-.5)*.06;}
  else{const t=Math.min(1,(e-jw)/bev),prof=style==='flag'||style==='setts'?Math.sqrt(t):Math.pow(t,.6),c=hsl(st.H,st.Sa,st.L);
   const lit=1+(-(cx*.55+cy*.75))*.07*(1-t*.6)+(nn-.5)*.16+(n2-.5)*.08+(prof-1)*.18;
   r=c[0]*lit;gg=c[1]*lit;b=c[2]*lit;
   if(e-jw<1.3*k){r*=.72;gg*=.7;b*=.72;} // filete escuro na borda (traço anime fino)
   if(st.moss&&nn>.58&&t<.6){const m=(nn-.58)*2.4;r=r*(1-m)+70*m;gg=gg*(1-m)+104*m;b=b*(1-m)+52*m;}
   hgt=.32+.5*prof*st.amp+(nn-.5)*.08;}
  D[i4]=Math.max(0,Math.min(255,r));D[i4+1]=Math.max(0,Math.min(255,gg));D[i4+2]=Math.max(0,Math.min(255,b));D[i4+3]=255;
  const hv=Math.max(0,Math.min(255,hgt*255));HB[i4]=HB[i4+1]=HB[i4+2]=hv;HB[i4+3]=255;}
 g.putImageData(img,0,0);h.putImageData(hb,0,0);
 // pinceladas finas e lascas por cima (acabamento pintado), poucas e suaves
 for(let i=0;i<S*1.2;i++){const x=R()*S,y=R()*S,len=2+R()*7,ang=R()*6.3;g.strokeStyle=R()<.5?`rgba(255,246,226,${.03+R()*.05})`:`rgba(64,46,44,${.03+R()*.05})`;g.lineWidth=.8+R()*1.4;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(ang)*len,y+Math.sin(ang)*len);g.stroke();}
 grain(g,S,R,S*2,'40,30,34','255,244,224',.07);
 return out(cm,ch);
}

/* ---------- Madeira em tábuas: anéis de crescimento ("catedral"), fibras finas, poros, nós e juntas ---------- */
function wood(o){
 /* Tábuas com aparência natural (antes: 4 tábuas iguais com anéis ovais perfeitos e emendas na mesma altura,
    que viravam um carimbo alinhado no piso, nas paredes e nas portas):
    - 6 a 8 tábuas de larguras diferentes, cada uma com 1 ou 2 emendas de topo em alturas próprias;
    - cada trecho de tábua tem o seu tom; o veio são fibras longas e onduladas que desviam dos nós;
    - "catedral" só em alguns trechos, suave e irregular; pregos apenas nas emendas. Repete sem emenda. */
 o=o||{};const S=o.size||512,R=rng(o.seed||3),boards=o.boards||(6+Math.floor(R()*3));
 const hue=o.hue!=null?o.hue:28,light=o.light!=null?o.light:38,sat=o.sat!=null?o.sat:46;
 const cm=mk(S),ch=mk(S),g=cm.getContext('2d'),h=ch.getContext('2d');
 h.fillStyle='#8a8a8a';h.fillRect(0,0,S,S);
 const ws=[];let sum=0;for(let b=0;b<boards;b++){const w=.55+R()*.9;ws.push(w);sum+=w;}
 const wrapY=(y0,y1,fn)=>{for(const oy of [-S,0,S]){const a=y0+oy,b=y1+oy;if(b<0||a>S)continue;fn(a,b);}};
 let x0=0;
 for(let b=0;b<boards;b++){
  const bw=ws[b]/sum*S,bH=hue+(R()-.5)*10,bS=sat+(R()-.5)*12,bL=light+(R()-.5)*12;
  g.save();g.beginPath();g.rect(x0,0,bw,S);g.clip();h.save();h.beginPath();h.rect(x0,0,bw,S);h.clip();
  // emendas de topo desta tábua (posições próprias) → trechos cíclicos
  const nj=1+(R()<.45?1:0),js=[];for(let k=0;k<nj;k++)js.push(R()*S);js.sort((a,c)=>a-c);
  const trechos=[];for(let k=0;k<js.length;k++){const a=js[k],c=k+1<js.length?js[k+1]:js[0]+S;trechos.push([a,c]);}
  for(const [ya,yb] of trechos){
   const l=bL+(R()-.5)*9,Hh=bH+(R()-.5)*5,Sa=bS+(R()-.5)*8;
   const gr=g.createLinearGradient(x0,0,x0+bw,0);
   gr.addColorStop(0,`hsl(${Hh},${Sa}%,${l-5}%)`);gr.addColorStop(.2+R()*.2,`hsl(${Hh},${Sa}%,${l+1}%)`);gr.addColorStop(.6+R()*.2,`hsl(${Hh+2},${Sa-2}%,${l+3}%)`);gr.addColorStop(1,`hsl(${Hh},${Sa+3}%,${l-6}%)`);
   wrapY(ya,yb,(a,c)=>{g.fillStyle=gr;g.fillRect(x0,a,bw,c-a);
    // variação longa de tom ao longo do trecho
    const lg=g.createLinearGradient(0,a,0,c);lg.addColorStop(0,`rgba(40,20,8,${.04+R()*.06})`);lg.addColorStop(.5,'rgba(255,236,200,0)');lg.addColorStop(1,`rgba(40,20,8,${.04+R()*.06})`);g.fillStyle=lg;g.fillRect(x0,a,bw,c-a);});
   // nós do trecho (0 ou 1, raramente 2)
   const nos=[];const nk=(R()<.35?1:0)+(R()<.08?1:0);
   for(let k=0;k<nk;k++)nos.push({x:x0+bw*(.25+R()*.5),y:ya+(yb-ya)*(.2+R()*.6),r:3.5+R()*6});
   // veio: fibras longas onduladas que desviam dos nós
   const nf=Math.round(bw*(.28+R()*.14));
   // faixas largas e suaves de tom (veio visto de longe)
   for(let k=0;k<3;k++){const fx=x0+R()*bw,ww=bw*(.12+R()*.25);wrapY(ya,yb,(a,c)=>{const bg=g.createLinearGradient(fx-ww,0,fx+ww,0);const dk=R()<.5;bg.addColorStop(0,'rgba(0,0,0,0)');bg.addColorStop(.5,dk?`rgba(60,30,10,${.05+R()*.06})`:`rgba(255,235,200,${.04+R()*.05})`);bg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=bg;g.fillRect(fx-ww,a,ww*2,c-a);});}
   for(let k=0;k<nf;k++){
    const fx=x0+R()*bw,f1=.006+R()*.012,f2=.03+R()*.05,a1=1.5+R()*4,a2=.3+R()*1.2,ph=R()*6.3,ph2=R()*6.3;
    const tardio=R()<.45,al=tardio?.04+R()*.06:.02+R()*.04,lw=tardio?.7+R()*1.1:.5+R()*.6;
    const cor=tardio?`rgba(${48+R()*24},${24+R()*12},${8+R()*8},${al})`:`rgba(255,232,196,${al*.9})`;
    g.strokeStyle=cor;g.lineWidth=lw;
    for(const oy of [-S,0,S]){g.beginPath();let first=true;
     for(let yy=ya;yy<=yb;yy+=6){let xx=fx+Math.sin(yy*f1+ph)*a1+Math.sin(yy*f2+ph2)*a2;
      for(const n of nos){const dx=xx-n.x,dy=yy-n.y,d2=dx*dx+dy*dy*.35,inf=Math.exp(-d2/(n.r*n.r*6));xx+=Math.sign(dx||1)*inf*n.r*1.8;}
      if(first){g.moveTo(xx,yy+oy);first=false;}else g.lineTo(xx,yy+oy);}
     g.stroke();}
    if(tardio&&R()<.3){h.strokeStyle=`rgba(40,40,40,${al*1.4})`;h.lineWidth=lw;h.beginPath();for(let yy=ya;yy<=yb;yy+=10){const xx=fx+Math.sin(yy*f1+ph)*a1;yy===ya?h.moveTo(xx,yy):h.lineTo(xx,yy);}h.stroke();}
   }
   // "catedral" suave e irregular só em alguns trechos (antes: elipses perfeitas em todas as tábuas)
   if(R()<.32){const cx=x0+bw*(.3+R()*.4),cy=ya+(yb-ya)*(.3+R()*.5),na=4+Math.floor(R()*4);let rx=bw*.06;
    for(let r=0;r<na;r++){rx+=bw*(.04+R()*.05);const alto=rx*(5+R()*4),al=.04+R()*.06;
     g.strokeStyle=`rgba(${60+R()*20},${30+R()*12},10,${al})`;g.lineWidth=.8+R()*1.4;
     for(const oy of [-S,0,S]){g.beginPath();for(let t=-1;t<=1.001;t+=.08){const wob=Math.sin(t*7+r*2.1)*rx*.08;const xx=cx+t*rx+wob,yy=cy-alto*(1-t*t)+oy;t===-1?g.moveTo(xx,yy):g.lineTo(xx,yy);}g.stroke();}}}
   // nós desenhados
   for(const n of nos)for(const oy of [-S,0,S]){
    const kg=g.createRadialGradient(n.x,n.y+oy,0,n.x,n.y+oy,n.r*1.3);kg.addColorStop(0,'rgba(34,16,6,.85)');kg.addColorStop(.6,'rgba(70,36,16,.35)');kg.addColorStop(1,'rgba(70,36,16,0)');
    g.fillStyle=kg;g.beginPath();g.ellipse(n.x,n.y+oy,n.r*.9,n.r*1.35,R()*.4-.2,0,6.3);g.fill();
    g.strokeStyle='rgba(40,18,6,.35)';g.lineWidth=.9;for(let r=1;r<=3;r++){g.beginPath();g.ellipse(n.x,n.y+oy,n.r*(.9+r*.35),n.r*(1.35+r*.6),0,0,6.3);g.stroke();}
    h.fillStyle='rgba(25,25,25,.6)';h.beginPath();h.ellipse(n.x,n.y+oy,n.r*.8,n.r*1.2,0,0,6.3);h.fill();}
   // desgaste ocasional e rachadura curta
   if(R()<.4){const wy=ya+R()*(yb-ya),wh=30+R()*90;wrapY(wy,wy+wh,(a,c)=>{const wg=g.createLinearGradient(0,a,0,c);wg.addColorStop(0,'rgba(205,195,175,0)');wg.addColorStop(.5,`rgba(205,195,175,${.04+R()*.06})`);wg.addColorStop(1,'rgba(205,195,175,0)');g.fillStyle=wg;g.fillRect(x0,a,bw,c-a);});}
   if(R()<.3){let cx2=x0+bw*(.2+R()*.6),cy2=ya+R()*(yb-ya)*.8;g.strokeStyle='rgba(22,10,4,.6)';g.lineWidth=1;g.beginPath();g.moveTo(cx2,cy2);for(let t=0;t<4;t++){cx2+=(R()-.5)*2.5;cy2+=5+R()*12;g.lineTo(cx2,cy2);}g.stroke();}
  }
  // emendas de topo (linha escura) e pregos só nelas, em posições levemente diferentes
  for(const jy of js){for(const oy of [-S,0,S]){g.fillStyle='rgba(18,8,4,.75)';g.fillRect(x0,jy+oy-1,bw,2.2);g.fillStyle='rgba(255,228,190,.12)';g.fillRect(x0,jy+oy+1.2,bw,1.2);h.fillStyle='#121212';h.fillRect(x0,jy+oy-1.5,bw,3);}
   for(const side of [-1,1]){if(R()<.15)continue;const nx=x0+bw*(.5+side*(.22+R()*.12)),ny=jy+side*(4+R()*4)+(R()-.5)*3;
    for(const oy of [-S,0,S]){g.fillStyle='rgba(30,22,20,.8)';g.beginPath();g.arc(nx,ny+oy,1.9+R()*.6,0,6.3);g.fill();g.fillStyle='rgba(220,200,170,.35)';g.beginPath();g.arc(nx-.5,ny+oy-.5,.7,0,6.3);g.fill();h.fillStyle='#cfcfcf';h.beginPath();h.arc(nx,ny+oy,2.1,0,6.3);h.fill();}}}
  g.restore();h.restore();
  // junta funda entre tábuas
  g.fillStyle='rgba(20,9,5,.85)';g.fillRect(x0,0,2.2,S);g.fillStyle='rgba(255,226,184,.1)';g.fillRect(x0+2.6,0,1.6,S);
  h.fillStyle='#0c0c0c';h.fillRect(x0,0,3.2,S);h.fillStyle='#bdbdbd';h.fillRect(x0+3.6,0,2,S);
  x0+=bw;
 }
 grain(g,S,R,S*2,'40,24,12','255,240,215',.05);
 if(o.horizontal)return out(rot(cm),rot(ch));
 return out(cm,ch);
}

/* ---------- Piso de mármore xadrez com veios e rejunte ---------- */
function marble(o){
 o=o||{};const S=o.size||512,R=rng(o.seed||5),n=o.n||8;
 const cm=mk(S),ch=mk(S),g=cm.getContext('2d'),h=ch.getContext('2d');
 const c=S/n;h.fillStyle='#1a1a1a';h.fillRect(0,0,S,S);
 for(let r=0;r<n;r++)for(let q=0;q<n;q++){
  const dark=(r+q)%2,x=q*c,y=r*c;
  const L=dark?(o.dark!=null?o.dark:50):(o.light!=null?o.light:70),H=dark?30:38,Sa=dark?14:12;
  const gr=g.createLinearGradient(x,y,x+c,y+c);gr.addColorStop(0,`hsl(${H},${Sa}%,${L+7}%)`);gr.addColorStop(1,`hsl(${H},${Sa+2}%,${L-5}%)`);
  g.fillStyle=gr;g.fillRect(x,y,c,c);
  g.save();g.beginPath();g.rect(x,y,c,c);g.clip();
  for(let k=0;k<4;k++){let vx=x+R()*c,vy=y+R()*c;g.strokeStyle=dark?`rgba(235,225,210,${.10+R()*.12})`:`rgba(110,96,92,${.10+R()*.14})`;g.lineWidth=.8+R()*1.6;g.beginPath();g.moveTo(vx,vy);for(let s=0;s<5;s++){vx+=(R()-.3)*c*.28;vy+=(R()-.5)*c*.28;g.lineTo(vx,vy);}g.stroke();}
  g.restore();
  g.fillStyle='rgba(255,255,255,.10)';g.fillRect(x+2,y+2,c-4,3);
  g.strokeStyle='rgba(44,34,40,.55)';g.lineWidth=2.4;g.strokeRect(x+1,y+1,c-2,c-2);
  for(let i=0;i<3;i++){const v=150+i*40;h.fillStyle=`rgb(${v},${v},${v})`;h.fillRect(x+2+i*1.6,y+2+i*1.6,c-4-i*3.2,c-4-i*3.2);}
 }
 grain(g,S,R,S,'40,30,34','255,250,240',.08);
 return out(cm,ch);
}

/* ---------- Telhas em escama (terracota, ardósia, azul) ---------- */
function shingles(o){
 o=o||{};const S=o.size||512,R=rng(o.seed||9),rows=o.rows||10,cols=o.cols||8;
 const hue=o.hue!=null?o.hue:12,sat=o.sat!=null?o.sat:52,l0=o.l0!=null?o.l0:36,l1=o.l1!=null?o.l1:52;
 const cm=mk(S),ch=mk(S),g=cm.getContext('2d'),h=ch.getContext('2d');
 g.fillStyle=`hsl(${hue},${sat}%,${l0-16}%)`;g.fillRect(0,0,S,S);h.fillStyle='#202020';h.fillRect(0,0,S,S);
 const rh=S/rows,cw=S/cols;
 for(let r=rows;r>=-1;r--)for(let c=-1;c<=cols;c++){
  const x=c*cw+(r%2?cw/2:0),y=r*rh,L=l0+R()*(l1-l0),H=hue+(R()-.5)*10;
  const draw=(ox)=>{
   const px=x+ox;
   const shape=gg=>{gg.beginPath();gg.moveTo(px+1.5,y);gg.lineTo(px+cw-1.5,y);gg.lineTo(px+cw-1.5,y+rh*1.35);gg.quadraticCurveTo(px+cw/2,y+rh*1.95,px+1.5,y+rh*1.35);gg.closePath();};
   const gr=g.createLinearGradient(0,y,0,y+rh*1.8);gr.addColorStop(0,`hsl(${H},${sat}%,${L+7}%)`);gr.addColorStop(.7,`hsl(${H},${sat}%,${L}%)`);gr.addColorStop(1,`hsl(${H+3},${sat+6}%,${L-12}%)`);
   g.fillStyle=gr;shape(g);g.fill();g.strokeStyle=INK;g.lineWidth=1.6;shape(g);g.stroke();
   g.strokeStyle='rgba(255,236,214,.26)';g.lineWidth=1.3;g.beginPath();g.moveTo(px+4,y+2);g.lineTo(px+cw-4,y+2);g.stroke();
   for(let i=0;i<4;i++){const v=Math.min(255,70+i*50);h.fillStyle=`rgb(${v},${v},${v})`;h.beginPath();h.moveTo(px+1.5+i*2,y+i*1.5);h.lineTo(px+cw-1.5-i*2,y+i*1.5);h.lineTo(px+cw-1.5-i*2,y+rh*1.3-i);h.quadraticCurveTo(px+cw/2,y+rh*1.8-i*2,px+1.5+i*2,y+rh*1.3-i);h.closePath();h.fill();}
  };
  draw(0);if(x+cw>S)draw(-S);if(x<0)draw(S);
 }
 grain(g,S,R,S,'30,20,24','255,236,214',.1);
 return out(cm,ch);
}

/* ---------- Reboco/estuque pintado (paredes de casas) ---------- */
function plaster(o){
 /* Reboco: antes eram ~1500 pontinhos de relevo fortes (parecia teto "pipoca"). Agora: manchas largas e suaves de cor,
    marcas curvas de desempenadeira (cor e relevo baixos), grão fino e raras fissuras de cabelo. Repete sem emenda. */
 o=o||{};const S=o.size||512,R=rng(o.seed||13);
 const hue=o.hue!=null?o.hue:38,sat=o.sat!=null?o.sat:36,l=o.l!=null?o.l:78;
 const cm=mk(S),ch=mk(S),g=cm.getContext('2d'),h=ch.getContext('2d');
 g.fillStyle=`hsl(${hue},${sat}%,${l}%)`;g.fillRect(0,0,S,S);h.fillStyle='#808080';h.fillRect(0,0,S,S);
 const wrap=(fn)=>{for(const ox of [0,-S,S])for(const oy of [0,-S,S])fn(ox,oy);};
 // manchas largas de tom (umidade, sol, pó)
 for(let i=0;i<46;i++){const x=R()*S,y=R()*S,r=40+R()*110,a=.04+R()*.06,tone=R()<.55?'255,248,232':(R()<.5?'150,112,92':'120,120,110');
  wrap((ox,oy)=>{if(x+ox+r<0||x+ox-r>S||y+oy+r<0||y+oy-r>S)return;const gr=g.createRadialGradient(x+ox,y+oy,0,x+ox,y+oy,r);gr.addColorStop(0,`rgba(${tone},${a})`);gr.addColorStop(1,`rgba(${tone},0)`);g.fillStyle=gr;g.fillRect(x+ox-r,y+oy-r,r*2,r*2);});}
 // marcas de desempenadeira: arcos largos e rasos
 g.lineCap=h.lineCap='round';g.filter='blur(4px)';h.filter='blur(3px)';
 for(let i=0;i<55;i++){const x=R()*S,y=R()*S,rad=30+R()*70,a0=R()*6.3,a1=a0+.6+R()*1.2,w=6+R()*16,lit=R()<.6,ag=lit?.04+R()*.04:.018+R()*.022,ah=.035+R()*.03;
  wrap((ox,oy)=>{if(x+ox+rad<0||x+ox-rad>S||y+oy+rad<0||y+oy-rad>S)return;
   g.strokeStyle=lit?`rgba(255,250,236,${ag})`:`rgba(120,96,84,${ag})`;g.lineWidth=w;g.beginPath();g.arc(x+ox,y+oy,rad,a0,a1);g.stroke();
});}
 g.filter=h.filter='none';
 // grão fino (relevo leve, sem pontos fortes)
 for(let i=0;i<S*5;i++){const x=R()*S,y=R()*S,r=.5+R()*1.1,v=R()<.5?104:152;h.fillStyle=`rgba(${v},${v},${v},.22)`;h.beginPath();h.arc(x,y,r,0,6.3);h.fill();}
 // fissuras finas e raras
 for(let i=0;i<(o.cracks!=null?o.cracks:3);i++){let x=R()*S,y=R()*S;g.strokeStyle='rgba(90,70,64,.28)';g.lineWidth=.9;h.strokeStyle='rgba(60,60,60,.5)';h.lineWidth=1;
  g.beginPath();h.beginPath();g.moveTo(x,y);h.moveTo(x,y);for(let k=0;k<6;k++){x+=(R()-.5)*18;y+=6+R()*14;g.lineTo(x,y);h.lineTo(x,y);}g.stroke();h.stroke();}
 grain(g,S,R,S*2,'80,56,52','255,246,230',.08);
 return out(cm,ch);
}

/* Vidraça repetível (1 m): céu e reflexos de dia, chumbo em cruz; o mapa emissivo acende de dia só o chumbo escuro. */
function windowTile(){
 const S=128,cm=mk(S),ce=mk(S),g=cm.getContext('2d'),e=ce.getContext('2d');
 const gr=g.createLinearGradient(0,0,0,S);gr.addColorStop(0,'#8ec3e8');gr.addColorStop(.6,'#c4e2f4');gr.addColorStop(1,'#e8f3fa');g.fillStyle=gr;g.fillRect(0,0,S,S);
 g.fillStyle='rgba(255,255,255,.4)';g.beginPath();g.moveTo(14,0);g.lineTo(50,0);g.lineTo(0,90);g.lineTo(0,50);g.closePath();g.fill();
 const eg=e.createRadialGradient(S/2,S/2,4,S/2,S/2,S*.75);eg.addColorStop(0,'#ffe9b0');eg.addColorStop(1,'#d9822e');e.fillStyle=eg;e.fillRect(0,0,S,S);
 for(const c of [g,e]){c.strokeStyle=c===g?'rgba(38,32,52,.9)':'#000';c.lineWidth=7;c.strokeRect(0,0,S,S);c.beginPath();c.moveTo(S/2,0);c.lineTo(S/2,S);c.moveTo(0,S/2);c.lineTo(S,S/2);c.stroke();}
 return {map:tex(cm,true),emit:tex(ce,true)};
}
function apply(material,t,scale){if(!material||!t)return material;material.bumpMap=t.bump;material.bumpScale=scale!=null?scale:2;material.needsUpdate=true;return material;}
window.arcanoTex={stone,cobble,wood,marble,shingles,plaster,windowTile,apply};
})();
