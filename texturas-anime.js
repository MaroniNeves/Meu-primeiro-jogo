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

/* ---------- Calçamento de pedras redondas (praças, ruas) ---------- */
function cobble(o){
 o=o||{};const S=o.size||512,R=rng(o.seed||11),n=o.n||7;
 const hue=o.hue!=null?o.hue:36,sat=o.sat!=null?o.sat:22,l0=o.l0!=null?o.l0:44,l1=o.l1!=null?o.l1:66;
 const cm=mk(S),ch=mk(S),g=cm.getContext('2d'),h=ch.getContext('2d');
 g.fillStyle=o.dirt||`hsl(${hue+4},${sat-4}%,${l0-24}%)`;g.fillRect(0,0,S,S);h.fillStyle='#505050';h.fillRect(0,0,S,S);
 const c=S/n,pts=[];
 for(let j=0;j<n;j++)for(let i=0;i<n;i++)pts.push([(i+.5+(R()-.5)*.35)*c,(j+.5+(R()-.5)*.35)*c,c*(.40+R()*.08),c*(.34+R()*.09),R()*Math.PI]);
 // pedras maiores primeiro; cada uma é desenhada nas 9 posições de ladrilho para repetir sem emenda
 for(const [x,y,rx,ry,a] of pts){
  const wob=[];for(let k=0;k<10;k++)wob.push(.9+R()*.2);
  const L=l0+R()*(l1-l0),H=hue+(R()-.5)*18,Sa=sat+(R()-.5)*12;
  const path=(gg,ox,oy,sc)=>{gg.beginPath();for(let k=0;k<=10;k++){const t=k/10*Math.PI*2,r=wob[k%10]*sc,px=Math.cos(t)*rx*r,py=Math.sin(t)*ry*r;gg[k?'lineTo':'moveTo'](x+ox+px*Math.cos(a)-py*Math.sin(a),y+oy+px*Math.sin(a)+py*Math.cos(a));}gg.closePath();};
  for(const ox of [-S,0,S])for(const oy of [-S,0,S]){
   if(x+ox<-c||x+ox>S+c||y+oy<-c||y+oy>S+c)continue;
   const gr=g.createRadialGradient(x+ox-rx*.25,y+oy-ry*.35,2,x+ox,y+oy,Math.max(rx,ry));
   gr.addColorStop(0,`hsl(${H},${Sa}%,${L+9}%)`);gr.addColorStop(.7,`hsl(${H},${Sa}%,${L}%)`);gr.addColorStop(1,`hsl(${H+4},${Sa+5}%,${L-9}%)`);
   g.fillStyle=gr;path(g,ox,oy,1);g.fill();
   g.save();path(g,ox,oy,1);g.clip();
   for(let i=0;i<26;i++){const px=x+ox+(R()-.5)*rx*2,py=y+oy+(R()-.5)*ry*2,len=3+R()*10,ang=R()*6.3;g.strokeStyle=R()<.5?`rgba(255,246,226,${.05+R()*.07})`:`rgba(64,46,44,${.05+R()*.07})`;g.lineWidth=1+R()*2;g.beginPath();g.moveTo(px,py);g.lineTo(px+Math.cos(ang)*len,py+Math.sin(ang)*len);g.stroke();}
   for(let i=0;i<7;i++){g.fillStyle=`rgba(52,40,38,${.12+R()*.16})`;g.beginPath();g.arc(x+ox+(R()-.5)*rx*1.6,y+oy+(R()-.5)*ry*1.6,.6+R()*1.3,0,6.3);g.fill();}
   g.restore();
   g.strokeStyle=INK;g.lineWidth=1.6;path(g,ox,oy,1);g.stroke();
   for(let i=0;i<4;i++){const v=Math.min(255,120+i*26);h.fillStyle=`rgb(${v},${v},${v})`;path(h,ox,oy,1-i*.12);h.fill();}
  }
 }
 grain(g,S,R,S*2,'40,30,34','255,244,224',.1);
 return out(cm,ch);
}

/* ---------- Madeira em tábuas (vertical): veios, nós, pregos e juntas fundas ---------- */
function wood(o){
 o=o||{};const S=o.size||512,R=rng(o.seed||3),boards=o.boards||4;
 const hue=o.hue!=null?o.hue:28,light=o.light!=null?o.light:38,sat=o.sat!=null?o.sat:46;
 const cm=mk(S),ch=mk(S),g=cm.getContext('2d'),h=ch.getContext('2d');
 h.fillStyle='#8a8a8a';h.fillRect(0,0,S,S);
 const bw=S/boards;
 for(let b=0;b<boards;b++){
  const x0=b*bw,l=light+(R()-.5)*10,H=hue+(R()-.5)*8;
  const gr=g.createLinearGradient(x0,0,x0+bw,0);
  gr.addColorStop(0,`hsl(${H},${sat}%,${l-5}%)`);gr.addColorStop(.35,`hsl(${H},${sat}%,${l+3}%)`);gr.addColorStop(1,`hsl(${H},${sat+4}%,${l-4}%)`);
  g.fillStyle=gr;g.fillRect(x0,0,bw,S);
  // veios: faixas onduladas longas
  for(let k=0;k<26;k++){
   const gx=x0+4+R()*(bw-8),amp=2+R()*5,fq=.012+R()*.02,ph=R()*6,dark=R()<.6,a=.10+R()*.2,lw=.8+R()*2.2;
   g.strokeStyle=dark?`rgba(${52+R()*30},${28+R()*18},14,${a})`:`rgba(255,226,180,${a*.6})`;g.lineWidth=lw;
   h.strokeStyle=dark?`rgba(40,40,40,${a*1.5})`:`rgba(200,200,200,${a*.7})`;h.lineWidth=lw;
   g.beginPath();h.beginPath();
   for(let y=0;y<=S;y+=6){const xx=gx+Math.sin(y*fq+ph)*amp;if(y){g.lineTo(xx,y);h.lineTo(xx,y);}else{g.moveTo(xx,y);h.moveTo(xx,y);}}
   g.stroke();h.stroke();
  }
  // nós
  for(let k=0;k<(R()<.7?2:1);k++){
   const kx=x0+14+R()*(bw-28),ky=R()*S,rx=4+R()*5,ry=8+R()*8;
   for(let r=4;r>=1;r--){g.strokeStyle=`rgba(70,34,14,${.18+.12*(5-r)/4})`;g.lineWidth=1.4;g.beginPath();g.ellipse(kx,ky,rx*r/2.2,ry*r/2.2,0,0,6.3);g.stroke();h.strokeStyle='rgba(30,30,30,.5)';h.lineWidth=1.6;h.beginPath();h.ellipse(kx,ky,rx*r/2.2,ry*r/2.2,0,0,6.3);h.stroke();}
   g.fillStyle='rgba(60,28,12,.7)';g.beginPath();g.ellipse(kx,ky,rx*.5,ry*.5,0,0,6.3);g.fill();
   h.fillStyle='rgba(20,20,20,.8)';h.beginPath();h.ellipse(kx,ky,rx*.5,ry*.5,0,0,6.3);h.fill();
  }
  // luz de cima (acabamento pintado) e pregos
  const lg=g.createLinearGradient(0,0,0,S);lg.addColorStop(0,'rgba(255,236,200,.10)');lg.addColorStop(1,'rgba(40,20,10,.10)');g.fillStyle=lg;g.fillRect(x0,0,bw,S);
  for(const ny of [S*.1,S*.9]){for(const nx of [x0+bw*.18,x0+bw*.82]){g.fillStyle='rgba(30,22,20,.85)';g.beginPath();g.arc(nx,ny,2.4,0,6.3);g.fill();g.fillStyle='rgba(220,200,170,.5)';g.beginPath();g.arc(nx-.6,ny-.6,.9,0,6.3);g.fill();h.fillStyle='#d0d0d0';h.beginPath();h.arc(nx,ny,2.6,0,6.3);h.fill();}}
  // junta funda entre tábuas + filete de luz
  g.fillStyle='rgba(22,10,6,.85)';g.fillRect(x0,0,3,S);g.fillStyle='rgba(255,226,184,.16)';g.fillRect(x0+3,0,3,S);
  h.fillStyle='#0c0c0c';h.fillRect(x0,0,4,S);h.fillStyle='#cfcfcf';h.fillRect(x0+4,0,3,S);
 }
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
 o=o||{};const S=o.size||512,R=rng(o.seed||13);
 const hue=o.hue!=null?o.hue:38,sat=o.sat!=null?o.sat:36,l=o.l!=null?o.l:78;
 const cm=mk(S),ch=mk(S),g=cm.getContext('2d'),h=ch.getContext('2d');
 g.fillStyle=`hsl(${hue},${sat}%,${l}%)`;g.fillRect(0,0,S,S);h.fillStyle='#808080';h.fillRect(0,0,S,S);
 for(let i=0;i<70;i++){const x=R()*S,y=R()*S,r=30+R()*70,a=.05+R()*.07;const tone=R()<.5?'255,246,226':'150,110,90';
  for(const ox of [0,-S])for(const oy of [0,-S]){const gr=g.createRadialGradient(x+ox,y+oy,0,x+ox,y+oy,r);gr.addColorStop(0,`rgba(${tone},${a})`);gr.addColorStop(1,`rgba(${tone},0)`);g.fillStyle=gr;g.fillRect(x+ox-r,y+oy-r,r*2,r*2);}}
 for(let i=0;i<S*3;i++){const x=R()*S,y=R()*S,r=.6+R()*1.9,v=R()<.5?90:170;h.fillStyle=`rgba(${v},${v},${v},.55)`;h.beginPath();h.arc(x,y,r,0,6.3);h.fill();}
 grain(g,S,R,S*2,'80,56,52','255,246,230',.12);
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
