/* Madeira em anime pintado.
   Gera textura de tábuas pintadas com pinceladas largas ao longo do veio:
   3 a 4 tons chapados de borda definida (sombra, meio, luz), riscos escuros do veio,
   nós desenhados como poucas elipses, junta escura entre tábuas e um contorno de tinta.
   Devolve {map,bump} como o gerador de madeira atual (window.arcanoTex.wood). */
(function(){
'use strict';
const T=window.THREE;
if(!T)return;
const rng=seed=>{let s=(seed>>>0)||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};};
const mk=S=>{const c=document.createElement('canvas');c.width=c.height=S;return c;};
const tex=(c,color)=>{const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;if(color)t.colorSpace=T.SRGBColorSpace;return t;};
const rot=c=>{const r=mk(c.width),g=r.getContext('2d');g.translate(c.width/2,c.height/2);g.rotate(Math.PI/2);g.drawImage(c,-c.width/2,-c.height/2);return r;};

/* pincelada longa e levemente curva, com pontas arredondadas, sem emenda (repete nas bordas) */
function stroke(g,S,x,y,len,w,bend,col){
 g.fillStyle=col;
 for(const ox of [0,-S,S])for(const oy of [0,-S,S]){
  g.beginPath();g.moveTo(x+ox-w/2,y+oy);
  g.bezierCurveTo(x+ox-w/2+bend,y+oy+len*.35,x+ox-w/2-bend,y+oy+len*.7,x+ox-w*.3,y+oy+len);
  g.lineTo(x+ox+w*.3,y+oy+len);
  g.bezierCurveTo(x+ox+w/2-bend,y+oy+len*.7,x+ox+w/2+bend,y+oy+len*.35,x+ox+w/2,y+oy);
  g.closePath();g.fill();}
}

function woodPainted(o){
 o=o||{};const S=o.size||512,R=rng(o.seed||5),boards=o.boards||3;
 const pal=o.palette||['#6b4228','#8a5733','#a76f3f','#c58b50']; // sombra, meio, luz, brilho
 const ink=o.ink||'#3a2216';
 const cm=mk(S),ch=mk(S),g=cm.getContext('2d'),h=ch.getContext('2d');
 h.fillStyle='#8c8c8c';h.fillRect(0,0,S,S);
 const ws=[];let sum=0;for(let b=0;b<boards;b++){const w=.75+R()*.6;ws.push(w);sum+=w;}
 let x0=0;
 for(let b=0;b<boards;b++){
  const bw=ws[b]/sum*S;
  // base chapada da tábua: tom do meio com leve variação por tábua
  const tone=(R()*2.2)|0;g.fillStyle=pal[1+(tone>1?1:0)*(R()<.5?1:0)];g.fillRect(x0,0,bw,S);
  g.save();g.beginPath();g.rect(x0,0,bw,S);g.clip();
  // faixas largas de luz e de sombra (pinceladas longas ao longo do veio)
  const nS=Math.round(bw/11);
  for(let k=0;k<nS;k++){
   const cx=x0+R()*bw,len=S*(.35+R()*.6),w=11+R()*22,cy=R()*S,bend=(R()-.5)*7;
   const r=R();stroke(g,S,cx,cy,len,w,bend,r<.30?pal[0]:r<.62?pal[1]:r<.90?pal[2]:pal[3]);
  }
  // pinceladas finas mais claras no topo de cada tábua (luz)
  for(let k=0;k<Math.round(bw/12);k++){
   const cx=x0+R()*bw,cy=R()*S,len=S*(.2+R()*.4),w=5+R()*8;stroke(g,S,cx,cy,len,w,(R()-.5)*5,R()<.6?pal[2]:pal[3]);
  }
  // riscos do veio: linhas ondulantes escuras, poucas e bem marcadas (como desenhadas à mão)
  for(let k=0;k<Math.round(bw/17);k++){
   const fx=x0+bw*(.08+R()*.84),fy=R()*S,len=S*(.25+R()*.5),ph=R()*6,am=.8+R()*2.2;
   g.strokeStyle=R()<.7?ink+'cc':pal[0];g.globalAlpha=.55+R()*.35;g.lineWidth=2.4+R()*2.6;g.lineCap='round';
   for(const oy of [0,-S]){g.beginPath();for(let t=0;t<=len;t+=10){const xx=fx+Math.sin(t*.045+ph)*am,yy=fy+oy+t;t?g.lineTo(xx,yy):g.moveTo(xx,yy);}g.stroke();}
   g.globalAlpha=1;
  }
  // nó: poucas elipses concêntricas, escuras no centro
  if(R()<.65){const kx=x0+bw*(.25+R()*.5),ky=R()*S,kr=6+R()*8;
   for(const oy of [-S,0,S]){
    for(let i=4;i>=1;i--){g.strokeStyle=i%2?pal[0]:ink;g.globalAlpha=.55;g.lineWidth=2;g.beginPath();g.ellipse(kx,ky+oy,kr*i*.55,kr*i*1.25,0,0,6.3);g.stroke();}
    g.globalAlpha=1;g.fillStyle=ink;g.beginPath();g.ellipse(kx,ky+oy,kr*.6,kr*1.1,0,0,6.3);g.fill();
    h.fillStyle='rgba(30,30,30,.6)';h.beginPath();h.ellipse(kx,ky+oy,kr*.7,kr*1.2,0,0,6.3);h.fill();}
  }
  // emenda de topo: corte reto com sombra embaixo
  const jy=S*(.3+R()*.4);g.fillStyle=ink;g.globalAlpha=.9;g.fillRect(x0,jy,bw,3);g.globalAlpha=.16;g.fillRect(x0,jy+3,bw,9);g.globalAlpha=1;
  h.fillStyle='#161616';h.fillRect(x0,jy,bw,3);
  g.restore();
  // junta: tinta escura de um lado e fio de luz do outro
  g.fillStyle=ink;g.fillRect(x0,0,3.5,S);g.fillStyle=pal[3];g.globalAlpha=.7;g.fillRect(x0+4,0,2,S);g.globalAlpha=1;
  h.fillStyle='#0e0e0e';h.fillRect(x0,0,4,S);h.fillStyle='#c8c8c8';h.fillRect(x0+5,0,2.5,S);
  // pregos (poucos, simples)
  for(const ny of [S*.07,S*.94])for(const nx of [x0+bw*.22,x0+bw*.78]){g.fillStyle=ink;g.beginPath();g.arc(nx,ny,2.8,0,6.3);g.fill();g.fillStyle=pal[3];g.beginPath();g.arc(nx-.8,ny-.8,1,0,6.3);g.fill();}
  x0+=bw;
 }
 if(o.horizontal)return {map:tex(rot(cm),true),bump:tex(rot(ch),false)};
 return {map:tex(cm,true),bump:tex(ch,false)};
}
window.arcanoWoodPainted=woodPainted;
})();
