/* Esferas de Poder — nove esferas elementais em estilo anime.
   Shaders e efeitos copiados de github.com/MaroniNeves/esferas-de-poder
   (gerado por tools/montar-esferas.cjs; não editar à mão).
   Uso: EsferasDePoder.create(THREE,'fogo') -> {root, update(t,camera)}. */
(function(){
'use strict';
const VS=`#version 300 es
precision highp float; precision highp int;
in vec3 aPos;
uniform mat4 uVP; uniform vec3 uCenter; uniform float uScale; uniform float uTime; uniform int uKind;
out vec3 vN; out vec3 vW;
void main(){
  vec3 n=aPos; float d=0.0;
  if(uKind==2){ d=0.022*sin(n.y*8.0+uTime*2.6)*sin(n.x*6.0-uTime*2.1)+0.012*sin(n.z*13.0+n.y*5.0-uTime*3.4); }
  if(uKind==3||uKind==11){ d=0.03*sin(n.y*7.0-uTime*3.0+n.x*4.0+uScale*9.0); }
  if(uKind==1){ float k=uScale; d=(k-1.0)*(0.5+0.9*max(n.y,0.0)+0.25*sin(n.x*5.0+uTime*2.0)*max(n.y,0.0)); k=1.0+0.012*(k-1.0)*80.0*0.0; }
  vec3 w=uCenter+n*(uKind==1?1.0+d:uScale+d);
  vN=n; vW=w; gl_Position=uVP*vec4(w,1.0);
}`;
const FS=`#version 300 es
precision highp float; precision highp int;
in vec3 vN; in vec3 vW; out vec4 o;
uniform vec3 uCam; uniform float uTime; uniform int uKind; uniform float uShell; uniform vec3 uTint;
float hash(vec3 p){p=fract(p*0.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
vec3 h33(vec3 p){p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));return fract(sin(p)*43758.5453);}
float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);
 return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=0.5,s=0.0;for(int i=0;i<4;i++){s+=a*noise(p);p=p*2.03+1.7;a*=0.5;}return s;}
vec2 vor(vec3 p){vec3 ip=floor(p),fp=fract(p);float f1=9.0,f2=9.0;
 for(int z=-1;z<=1;z++)for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec3 g=vec3(x,y,z);vec3 r=g+h33(ip+g)-fp;float d=dot(r,r);
  if(d<f1){f2=f1;f1=d;}else if(d<f2){f2=d;}}
 return vec2(sqrt(f1),sqrt(f2));}
mat3 rotY(float a){float c=cos(a),s=sin(a);return mat3(c,0,-s,0,1,0,s,0,c);}
vec3 pal4(float b,vec3 a0,vec3 a1,vec3 a2,vec3 a3){return b<0.5?a0:(b<1.5?a1:(b<2.5?a2:a3));}
void main(){
  vec3 N=normalize(vN); vec3 V=normalize(uCam-vW); vec3 L=normalize(vec3(-0.5,0.7,0.6));
  float t=uTime; float fr=1.0-clamp(dot(N,V),0.0,1.0);
  vec3 col=vec3(1.0); float a=1.0;
  if(uKind==0){ /* corpo do fogo */
    vec3 p=rotY(t*0.25)*N;
    vec3 w=p*2.0+0.35*vec3(noise(p*3.0+t*0.3),noise(p*3.0+7.0),noise(p*3.0+13.0));
    vec2 v=vor(w*1.25+vec3(0.0,t*0.15,0.0));
    float heat=fbm(p*2.2+vec3(0,t*0.2,0));
    float h=clamp(heat*0.95+0.45*(0.62-v.x),0.0,0.999);
    float band=floor(h*4.0);
    col=pal4(band,vec3(0.42,0.06,0.07),vec3(0.86,0.17,0.06),vec3(1.0,0.48,0.07),vec3(1.0,0.82,0.25));
    float e=v.y-v.x; col=mix(vec3(0.30,0.03,0.05),col,smoothstep(0.015,0.065,e));
    col*=0.78+0.22*step(0.15,dot(N,L));
    col+=vec3(1.0,0.62,0.15)*step(0.62,fr)*0.55;
    float sp=dot(reflect(-L,N),V); col=mix(col,vec3(1.0,0.97,0.85),step(0.975,sp)*0.9);
    col=mix(col,vec3(1.0,0.95,0.8),step(0.9,dot(normalize(L+V),N))*0.25);
  } else if(uKind==1){ /* línguas de fogo em camadas */
    float i=uShell; float f=(i-1.0)/4.0;
    vec3 q=N*vec3(1.7,1.0,1.7)*2.3;
    vec3 wq=q+vec3(sin(N.y*5.0-t*1.5)*0.35,0.0,cos(N.y*4.0-t*1.2)*0.35);
    float n=fbm(wq+vec3(0.0,-t*0.9,0.0));
    n+=0.22*N.y+0.10*sin(N.x*6.0+N.z*5.0+t*2.0)*N.y;
    float thr=0.47+0.055*(i-1.0);
    if(n<thr) discard;
    vec3 c0=vec3(0.50,0.05,0.06),c1=vec3(0.88,0.14,0.05),c2=vec3(1.0,0.42,0.06),c3=vec3(1.0,0.72,0.16),c4=vec3(1.0,0.93,0.55);
    float dd=n-thr; col= dd<0.022?c0:(dd<0.055?c1:(dd<0.10?c2:(dd<0.16?c3:c4)));
    col*=0.9+0.1*step(0.1,dot(N,L));
  } else if(uKind==2){ /* corpo da água */
    vec3 p=rotY(t*0.2)*N;
    vec3 w=p*2.2+0.28*vec3(sin(p.y*5.0+t*1.2),sin(p.z*5.0+t*1.0),sin(p.x*5.0+t*1.4));
    vec2 v=vor(w*1.15);
    float s=floor(clamp(v.x*1.4,0.0,0.99)*3.0);
    col=pal4(s,vec3(0.22,0.72,1.0),vec3(0.12,0.52,0.98),vec3(0.06,0.32,0.88),vec3(0.06,0.32,0.88));
    float e=1.0-smoothstep(0.0,0.085,v.y-v.x); col=mix(col,vec3(0.62,0.93,1.0),e*0.85);
    float rg=sin(length(p-normalize(vec3(sin(t*0.4),0.3,cos(t*0.4))))*13.0-t*3.2);
    col=mix(col,vec3(0.75,0.96,1.0),step(0.93,rg)*0.45);
    col*=0.82+0.18*step(0.1,dot(N,L));
    col=mix(col,vec3(0.78,0.97,1.0),step(0.58,fr)*0.7);
    float sp=dot(reflect(-L,N),V); col=mix(col,vec3(1.0),step(0.968,sp));
    col=mix(col,vec3(1.0),step(0.935,dot(normalize(L+V),N))*0.35);
    a=0.82+0.16*fr;
  } else if(uKind==3){ /* espuma / respingos */
    float n=fbm(N*3.2+vec3(0.0,t*0.35,0.0)+vec3(sin(t*0.6)*0.5,0,0));
    float thr=0.50+0.07*(uShell-1.0);
    if(n<thr) discard;
    col=mix(vec3(0.70,0.96,1.0),vec3(1.0),step(0.04,n-thr)); a=0.97;
  } else if(uKind==4){ /* corpo elétrico */
    vec3 p=rotY(t*0.3)*N;
    vec3 w=p*2.5+0.22*sin(p.yzx*4.0+t*0.8);
    vec2 v=vor(w*1.1);
    float s=clamp(v.x*1.3,0.0,0.99);
    col=mix(vec3(0.16,0.42,1.0),vec3(0.05,0.14,0.80),smoothstep(0.25,0.7,s));
    col=floor(col*4.0+0.5)/4.0;
    float fl=0.75+0.25*step(0.5,hash(vec3(floor(t*12.0),1.0,2.0)));
    float e=1.0-smoothstep(0.0,0.055,v.y-v.x); col=mix(col,vec3(0.92,0.97,1.0),e*fl);
    float c=clamp(dot(N,V),0.0,1.0); col=mix(col,vec3(0.86,0.95,1.0),smoothstep(0.62,1.0,c)*0.55);
    col=mix(col,vec3(0.95,0.99,1.0),step(0.6,fr)*0.8);
    float sp=dot(reflect(-L,N),V); col=mix(col,vec3(1.0),step(0.975,sp));
  } else if(uKind==6){ /* veneno: gosma verde rachada */
    vec3 p=rotY(t*0.18)*N; vec2 v=vor(p*2.0+0.3*sin(p.yzx*4.0+t*0.7));
    float s=clamp(v.x*1.5,0.0,0.99);
    col=pal4(floor(s*3.0),vec3(0.62,0.98,0.22),vec3(0.30,0.82,0.16),vec3(0.12,0.58,0.14),vec3(0.12,0.58,0.14));
    float e=v.y-v.x; col=mix(vec3(0.05,0.30,0.10),col,smoothstep(0.02,0.14,e));
    col=mix(col,vec3(0.85,1.0,0.45),step(0.02,e)*step(e,0.045)*0.6);
    col*=0.8+0.2*step(0.12,dot(N,L)); col=mix(col,vec3(0.85,1.0,0.5),step(0.62,fr)*0.55);
    col=mix(col,vec3(1.0),step(0.972,dot(reflect(-L,N),V)));
  } else if(uKind==7){ /* arcano: roxo com buracos */
    vec3 p=rotY(t*0.15)*N; vec2 v=vor(p*1.9+vec3(0,t*0.05,0));
    float h=fbm(p*2.6+t*0.1);
    col=pal4(floor(clamp(h*1.5,0.0,0.99)*3.0),vec3(0.62,0.22,0.95),vec3(0.46,0.13,0.80),vec3(0.30,0.07,0.62),vec3(0.30,0.07,0.62));
    float hole=smoothstep(0.30,0.26,v.x);
    col=mix(col,vec3(0.07,0.02,0.18),hole);
    col=mix(col,vec3(0.95,0.45,1.0),step(0.26,v.x)*step(v.x,0.31)*0.9);
    col*=0.82+0.18*step(0.12,dot(N,L)); col=mix(col,vec3(0.9,0.5,1.0),step(0.6,fr)*0.65);
    col=mix(col,vec3(1.0),step(0.972,dot(reflect(-L,N),V)));
  } else if(uKind==8){ /* natureza: verde com veios marrons */
    vec3 p=rotY(t*0.15)*N; float h=fbm(p*2.4+3.0);
    col=pal4(floor(clamp(h*1.5,0.0,0.99)*3.0),vec3(0.55,0.92,0.25),vec3(0.30,0.76,0.18),vec3(0.14,0.55,0.14),vec3(0.14,0.55,0.14));
    float r=1.0-abs(2.0*noise(p*3.0+vec3(5.0))-1.0); col=mix(col,vec3(0.36,0.20,0.10),step(0.935,r));
    float r2=1.0-abs(2.0*noise(p*5.5+vec3(9.0))-1.0); col=mix(col,vec3(0.50,0.30,0.14),step(0.955,r2)*0.9);
    col*=0.82+0.18*step(0.12,dot(N,L)); col=mix(col,vec3(0.78,1.0,0.4),step(0.6,fr)*0.6);
    col=mix(col,vec3(1.0),step(0.972,dot(reflect(-L,N),V)));
  } else if(uKind==9){ /* vórtice: espiral rosa e vermelha */
    vec3 up=vec3(0,1,0); vec3 rt=normalize(cross(up,V)); vec3 u2=cross(V,rt);
    float x=dot(N,rt),y=dot(N,u2); float r=length(vec2(x,y)); float ang=atan(y,x);
    float sp=sin(ang*1.0+r*8.5-t*1.6+0.6*fbm(N*3.0+t*0.2));
    float b=floor((sp*0.5+0.5)*3.0);
    col=pal4(b,vec3(0.22,0.03,0.20),vec3(0.72,0.05,0.28),vec3(1.0,0.28,0.50),vec3(1.0,0.28,0.50));
    float core=smoothstep(0.22,0.0,r); col=mix(col,vec3(1.0,0.55,0.70),core*0.7);
    float edge=smoothstep(0.7,1.0,r); col=mix(col,vec3(0.22,0.03,0.22),edge*0.6);
    col*=0.85+0.15*step(0.12,dot(N,L)); col=mix(col,vec3(1.0,0.45,0.6),step(0.66,fr)*0.5);
    col=mix(col,vec3(1.0),step(0.975,dot(reflect(-L,N),V)));
  } else if(uKind==12){ /* energia negra */
    vec3 p=rotY(t*0.2)*N;
    vec3 w=p*2.0+0.5*vec3(fbm(p*2.0+t*0.15),fbm(p*2.0+9.0),fbm(p*2.0+4.0));
    float h=fbm(w*1.3+vec3(0,t*0.1,0));
    col=pal4(floor(clamp(h*1.5,0.0,0.99)*4.0),vec3(0.015,0.005,0.03),vec3(0.05,0.015,0.10),vec3(0.10,0.03,0.20),vec3(0.20,0.06,0.36));
    vec2 v=vor(p*2.3+vec3(0,t*0.08,0)); float e=v.y-v.x;
    float pl=0.75+0.25*sin(t*2.0+p.y*4.0);
    col=mix(col,vec3(0.65,0.3,1.0)*pl,(1.0-smoothstep(0.0,0.045,e))*0.9);
    col*=0.85+0.15*step(0.1,dot(N,L));
    col=mix(col,vec3(0.55,0.2,0.95),step(0.64,fr)*0.9);
    col=mix(col,vec3(0.9,0.8,1.0),step(0.972,dot(reflect(-L,N),V)));
  } else if(uKind==13){ /* energia branca universal: galáxia dentro */
    vec3 ro=N; vec3 rd=normalize(vW-uCam);
    float tl=1.1; mat3 rx=mat3(1.0,0.0,0.0, 0.0,cos(tl),sin(tl), 0.0,-sin(tl),cos(tl));
    vec3 o2=rx*ro,d2=rx*rd;
    col=mix(vec3(0.05,0.03,0.20),vec3(0.20,0.11,0.48),fr);
    float nb=fbm(rd*2.6+ro*0.6+vec3(t*0.03)); col+=vec3(0.30,0.10,0.50)*step(0.56,nb)*0.35;
    vec3 sd=normalize(rd+ro*0.45)*34.0; float hs=hash(floor(sd)); vec3 fp=fract(sd)-0.5;
    float st=step(0.968,hs)*step(length(fp),0.2)*(0.6+0.4*sin(t*3.0+hs*60.0)); col=mix(col,vec3(1.0),st);
    if(abs(d2.y)>0.001){ float th=-o2.y/d2.y; vec3 hp=o2+d2*th; float r=length(hp.xz);
      if(th>0.0&&r<0.97){ float ang=atan(hp.z,hp.x);
        float sp=2.0*ang-5.5*log(r+0.06)-t*0.7; float arm=pow(0.5+0.5*cos(sp),1.6);
        float dens=arm*exp(-r*2.0)*1.5+exp(-r*7.0)*1.9+0.22*noise(hp*14.0)*exp(-r*1.5);
        dens=floor(clamp(dens,0.0,1.0)*5.0)/5.0;
        vec3 g=mix(vec3(0.45,0.25,0.95),vec3(0.95,0.5,0.95),clamp(r*1.6,0.0,1.0)); g=mix(g,vec3(0.5,0.85,1.0),arm*0.35);
        g=mix(g,vec3(1.0,0.97,0.9),smoothstep(0.55,1.0,dens));
        col=mix(col,g,dens*step(0.04,dens)); } }
    col+=vec3(0.45,0.4,0.8)*smoothstep(0.42,0.66,fr)*0.4;
    col=mix(col,vec3(0.95,0.93,1.0),step(0.68,fr)*0.9);
    col=mix(col,vec3(1.0),step(0.972,dot(reflect(-L,N),V)));
    col=mix(col,vec3(1.0),step(0.93,dot(normalize(L+V),N))*0.2);
  } else if(uKind==11){ /* gosma / respingos coloridos */
    float n=fbm(N*3.0+vec3(0.0,t*0.3,0.0)+vec3(sin(t*0.5)*0.4,0,0)+uShell*4.0);
    float thr=0.56+0.06*uShell; if(n<thr) discard;
    col=mix(uTint*0.8,min(uTint*1.25,vec3(1.0)),step(0.04,n-thr)); a=0.98;
  } else { /* raios finos em volta da esfera elétrica */
    float k=floor(t*9.0)*1.73;
    float n=noise(N*3.6+vec3(k));
    float r=1.0-abs(2.0*n-1.0);
    float mask=noise(N*1.6+vec3(k*0.3,t*0.4,0.0));
    if(!(r>0.95 && mask>0.42)) discard;
    col=r>0.975?vec3(1.0):vec3(0.55,0.85,1.0);
  }
  o=vec4(col,a);
}`;

const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const nrm=a=>{const l=Math.hypot(...a)||1;return [a[0]/l,a[1]/l,a[2]/l]};
function rnd(a,b){return a+Math.random()*(b-a)}
const SP=3.5;
const TG=[0.35,1.0,0.35],TP=[0.78,0.45,1.0],TM=[0.95,0.25,0.5],TD=[0.45,0.9,0.3];
const orbs=[
 {n:'FOGO',  lab:'#ffb056',c:[-1.5*SP,2.1,0],halo:[1.0,0.45,0.08],L:[[0,1,0]],fire:1},
 {n:'ÁGUA',  lab:'#7fd6ff',c:[-0.5*SP,2.1,0],halo:[0.15,0.55,1.0],L:[[2,1,0],[3,1.06,1],[3,1.12,2],[3,1.18,3]]},
 {n:'ELÉTRICA',lab:'#c8dcff',c:[0.5*SP,2.1,0],halo:[0.35,0.55,1.0],L:[[4,1,0],[5,1.045,0]],elec:1},
 {n:'VENENO',lab:'#9dff5a',c:[1.5*SP,2.1,0],halo:[0.3,0.9,0.15],L:[[6,1,0],[11,1.07,1,TG],[11,1.14,2,TG]]},
 {n:'ARCANA',lab:'#d3a2ff',c:[-2*SP,-2.3,0],halo:[0.6,0.25,1.0],L:[[7,1,0],[11,1.07,1,TP]]},
 {n:'NATUREZA',lab:'#8fe07a',c:[-SP,-2.3,0],halo:[0.25,0.8,0.2],L:[[8,1,0],[11,1.07,1,TD]]},
 {n:'VÓRTICE',lab:'#ff7aa8',c:[0,-2.3,0],halo:[1.0,0.2,0.45],L:[[9,1,0],[11,1.07,1,TM]]},
 {n:'TREVAS',lab:'#b58cff',c:[SP,-2.3,0],halo:[0.30,0.09,0.50],L:[[12,1,0],[11,1.07,1,[0.22,0.07,0.38]],[11,1.13,2,[0.22,0.07,0.38]]],smoke:1},
 {n:'UNIVERSAL',lab:'#f3f0ff',c:[2*SP,-2.3,0],halo:[0.55,0.5,0.95],L:[[13,1,0]],stars:1}
];

function makeBolts(eye,center){
  const out=[];const toEye=nrm(sub(eye,center));
  function strip(pts,w,rgb,al){
    for(let i=0;i<pts.length-1;i++){
      const t=nrm(sub(pts[i+1],pts[i]));let s=nrm(cross(t,toEye));
      const k0=1-i/(pts.length-1),k1=1-(i+1)/(pts.length-1);
      const w0=w*(0.35+0.65*k0),w1=w*(0.35+0.65*k1);
      const a=[pts[i][0]+s[0]*w0,pts[i][1]+s[1]*w0,pts[i][2]+s[2]*w0],b=[pts[i][0]-s[0]*w0,pts[i][1]-s[1]*w0,pts[i][2]-s[2]*w0];
      const c=[pts[i+1][0]+s[0]*w1,pts[i+1][1]+s[1]*w1,pts[i+1][2]+s[2]*w1],d=[pts[i+1][0]-s[0]*w1,pts[i+1][1]-s[1]*w1,pts[i+1][2]-s[2]*w1];
      for(const p of [a,b,c,c,b,d])out.push(p[0],p[1],p[2],rgb[0],rgb[1],rgb[2],al);
    }
  }
  function bolt(start,dir,len,seg,amp,depth){
    const u=nrm(cross(dir,Math.abs(dir[1])<0.9?[0,1,0]:[1,0,0])),v=cross(dir,u);const pts=[start];
    for(let k=1;k<=seg;k++){const f=k/seg;const j=amp*(k<seg?1:0.4);
      const a=rnd(-j,j),b=rnd(-j,j);
      pts.push([start[0]+dir[0]*len*f+u[0]*a+v[0]*b,start[1]+dir[1]*len*f+u[1]*a+v[1]*b,start[2]+dir[2]*len*f+u[2]*a+v[2]*b]);}
    glows.push(pts);
    if(depth<1&&Math.random()<0.8){const m=Math.floor(seg*0.45)+1,bd=nrm([dir[0]+rnd(-0.9,0.9),dir[1]+rnd(-0.9,0.9),dir[2]+rnd(-0.9,0.9)]);bolt(pts[m],bd,len*0.45,5,amp*0.8,depth+1);}
  }
  const glows=[];
  /* arcos curtos que saem da esfera e voltam para ela mesma */
  const nA=3+(Math.random()<0.4?1:0);
  for(let i=0;i<nA;i++){
    let A=nrm([rnd(-1,1),rnd(-1,1),rnd(-1,1)]);if(dot(A,toEye)<-0.1)A=[-A[0],-A[1],-A[2]];
    const T=nrm(cross(A,nrm([rnd(-1,1),rnd(-1,1),rnd(-1,1)])));
    const ang=rnd(0.55,1.1),h=rnd(0.26,0.46),seg=10;const pts=[];
    for(let k=0;k<=seg;k++){const f=k/seg,th=ang*f;
      const dir=[A[0]*Math.cos(th)+T[0]*Math.sin(th),A[1]*Math.cos(th)+T[1]*Math.sin(th),A[2]*Math.cos(th)+T[2]*Math.sin(th)];
      const rr=0.98+h*Math.sin(Math.PI*f)+(k>0&&k<seg?rnd(-0.05,0.05):0);
      const tw=(k>0&&k<seg)?rnd(-0.05,0.05):0;
      pts.push([center[0]+dir[0]*rr+T[0]*tw,center[1]+dir[1]*rr+T[1]*tw,center[2]+dir[2]*rr+T[2]*tw]);}
    glows.push(pts);
    if(Math.random()<0.35){const m=4+Math.floor(Math.random()*3),q=pts[m],o=nrm(sub(q,center));
      const e2=[];for(let k=0;k<=4;k++){const f=k/4,rr=1.0+(1-f)*0.0;const od=nrm([o[0]+T[0]*f*0.7+rnd(-0.1,0.1),o[1]+T[1]*f*0.7+rnd(-0.1,0.1),o[2]+T[2]*f*0.7+rnd(-0.1,0.1)]);
        const rad=Math.hypot(...sub(q,center))-0.16*f*(1-f)*0.0-0.18*f;e2.push([center[0]+od[0]*rad,center[1]+od[1]*rad,center[2]+od[2]*rad]);}
      glows.push(e2);}
  }
  for(const p of glows)strip(p,0.1,[0.2,0.5,0.9],0.3);
  for(const p of glows)strip(p,0.036,[1,1,1],1.0);
  return new Float32Array(out);
}


/* lava: pequenas explosões ao redor da esfera */
const H1=x=>{const v=Math.sin(x*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const LAVA=[[0.80,0.10,0.05],[0.98,0.42,0.07],[1.0,0.80,0.20],[1.0,0.96,0.74]];
const NSL=11,SLP=[];for(let i=0;i<NSL;i++)SLP.push({per:1.5+H1(i*3.1)*1.4,off:H1(i*7.7)});
const embers=[];for(let i=0;i<16;i++){const y=rnd(-0.3,1),r=Math.sqrt(1-y*y),a=Math.random()*6.283;embers.push({u:[r*Math.cos(a),y,r*Math.sin(a)],per:[4,8/3,2][i%3],ph:Math.random(),L:rnd(0.14,0.24),gold:i%2});}
function makeFlames(eye,c,t){
  const out=[];const NS=10;
  const toEye=nrm(sub(eye,c));
  function tongue(B,d,L,W,k,toEye,zoff,col){
    const e=nrm(cross(d,toEye)),pts=[];
    for(let q=0;q<=NS;q++){const s=q/NS;
      pts.push([k*L*(s*s-0.55*s*s*s),L*s*(1-0.12*s*s),W*2.36*Math.pow(s,0.45)*Math.pow(1-s,0.9)]);}
    const P=(x,y,wd)=>[B[0]+e[0]*(x+wd)+d[0]*y+toEye[0]*zoff,B[1]+e[1]*(x+wd)+d[1]*y+toEye[1]*zoff,B[2]+e[2]*(x+wd)+d[2]*y+toEye[2]*zoff];
    for(let q=0;q<NS;q++){const a=pts[q],b=pts[q+1];
      const p0=P(a[0],a[1],a[2]),p1=P(a[0],a[1],-a[2]),p2=P(b[0],b[1],b[2]),p3=P(b[0],b[1],-b[2]);
      for(const p of [p0,p1,p2,p2,p1,p3])out.push(p[0],p[1],p[2],col[0],col[1],col[2],1);}
  }
  const ex=nrm(cross([0,1,0],toEye)),ey=cross(toEye,ex);
  function star(B,r,zoff,col,rot){const n=9;
    for(let i=0;i<n*2;i++){const a0=rot+Math.PI*i/n,a1=rot+Math.PI*(i+1)/n;const r0=i%2?r*0.55:r,r1=(i+1)%2?r*0.55:r;
      const P=(a,rr)=>[B[0]+(ex[0]*Math.cos(a)+ey[0]*Math.sin(a))*rr+toEye[0]*zoff,B[1]+(ex[1]*Math.cos(a)+ey[1]*Math.sin(a))*rr+toEye[1]*zoff,B[2]+(ex[2]*Math.cos(a)+ey[2]*Math.sin(a))*rr+toEye[2]*zoff];
      for(const p of [[B[0]+toEye[0]*zoff,B[1]+toEye[1]*zoff,B[2]+toEye[2]*zoff],P(a0,r0),P(a1,r1)])out.push(p[0],p[1],p[2],col[0],col[1],col[2],1);}}
  SLP.forEach((sl,si)=>{
    const ph=t/sl.per+sl.off,ev=Math.floor(ph),a=(ph-ev)*sl.per,id=si*131+ev*17.3;
    if(a>1.0)return;
    const y=H1(id)*2-1,az=H1(id+1.7)*6.283,r=Math.sqrt(1-y*y);
    const u=[r*Math.cos(az),y,r*Math.sin(az)];
    if(dot(u,toEye)<-0.25)return;                      /* explosões das costas ficam atrás da esfera */
    const base=[c[0]+u[0]*0.98,c[1]+u[1]*0.98,c[2]+u[2]*0.98];
    /* clarão em estrela */
    if(a<0.32){const g=a/0.32,rad=0.15+0.34*Math.sin(Math.PI*Math.min(1,g*0.9+0.1))*(1-0.3*g);
      star(base,rad,0.012,LAVA[0],id);star(base,rad*0.78,0.016,LAVA[1],id+0.2);star(base,rad*0.52,0.02,LAVA[2],id+0.4);star(base,rad*0.26,0.024,LAVA[3],id+0.6);}
    /* respingos de lava em gota */
    const n=9;
    for(let k=0;k<n;k++){
      const hk=id+k*3.7;const sp=1.5+H1(hk)*2.0,cone=0.8;
      const tx=nrm(cross(u,[H1(hk+1)-0.5,H1(hk+2)-0.5,H1(hk+3)-0.5])),tz=cross(u,tx);
      const ca=H1(hk+4)*6.283,cr=Math.sqrt(H1(hk+5))*cone;
      const v=[u[0]+(tx[0]*Math.cos(ca)+tz[0]*Math.sin(ca))*cr,u[1]+(tx[1]*Math.cos(ca)+tz[1]*Math.sin(ca))*cr,u[2]+(tx[2]*Math.cos(ca)+tz[2]*Math.sin(ca))*cr];
      const vn=nrm([v[0],v[1]+0.55,v[2]]);const aa=a-0.04*k*0.3;if(aa<0)continue;
      const G=1.7;
      const pos=[base[0]+vn[0]*sp*aa,base[1]+vn[1]*sp*aa-0.5*G*aa*aa,base[2]+vn[2]*sp*aa];
      const vel=nrm([vn[0]*sp,vn[1]*sp-G*aa,vn[2]*sp]);
      const life=Math.max(0,1-aa/1.0);const sz=(0.5+0.5*H1(hk+6))*life;
      if(sz<0.02)continue;
      const Ln=(0.10+0.16*sz)*(1.0),Wn=0.045+0.05*sz;
      [[0,1,1],[1,0.74,0.75],[2,0.5,0.45]].forEach(([li,ls,ws])=>tongue(pos,vel,Ln*ls,Wn*ws,0.15*(H1(hk+7)-0.5),toEye,0.03+0.003*li,LAVA[li]));
    }
  });
  embers.forEach(m=>{const g=((t/m.per+m.ph)%1+1)%1;const gr=Math.sin(Math.PI*g);
    const B=[c[0]+m.u[0]*(1.1+0.3*g),c[1]+m.u[1]*(1.1+0.3*g)+0.45*g,c[2]+m.u[2]*(1.1+0.3*g)];
    tongue(B,[0.1,1,0],m.L*gr+0.001,0.05*gr+0.001,0.2,toEye,0.05,m.gold?[1,0.86,0.3]:[1,0.5,0.1]);});
  return new Float32Array(out);
}
function makeSmoke(eye,c,t){
  const out=[];const toEye=nrm(sub(eye,c));
  const ex=nrm(cross([0,1,0],toEye)),ey=cross(toEye,ex);let A=1;
  function disc(B,r,zoff,col){const n=12;
    for(let k=0;k<n;k++){const a0=6.2832*k/n,a1=6.2832*(k+1)/n;
      const P=(a)=>[B[0]+(ex[0]*Math.cos(a)+ey[0]*Math.sin(a))*r+toEye[0]*zoff,B[1]+(ex[1]*Math.cos(a)+ey[1]*Math.sin(a))*r+toEye[1]*zoff,B[2]+(ex[2]*Math.cos(a)+ey[2]*Math.sin(a))*r+toEye[2]*zoff];
      for(const p of [[B[0]+toEye[0]*zoff,B[1]+toEye[1]*zoff,B[2]+toEye[2]*zoff],P(a0),P(a1)])out.push(p[0],p[1],p[2],col[0],col[1],col[2],A);}}
  const mv=(B,x,y)=>[B[0]+ex[0]*x+ey[0]*y,B[1]+ex[1]*x+ey[1]*y,B[2]+ex[2]*x+ey[2]*y];
  const LOBES=[[0,0,1],[0.6,0.1,0.62],[-0.58,0.1,0.64],[0.15,0.55,0.55],[-0.2,-0.5,0.55]];
  function cloud(B,r,zb,sd){
    const L=[[1.0,0.0,0.0,[0.36,0.10,0.52]],[0.86,-0.07,-0.08,[0.12,0.04,0.21]],[0.58,-0.12,-0.15,[0.03,0.01,0.06]]];
    L.forEach((l,li)=>LOBES.forEach((lb,k)=>{
      const wob=1+0.14*Math.sin(sd*3+k*2.1);
      disc(mv(B,(lb[0]*r)*l[0]+l[1]*r,(lb[1]*r)*l[0]+l[2]*r),lb[2]*r*l[0]*wob,zb+0.002*li,l[3]);}));
  }
  /* fumacinhas curtas saindo de vários pontos da orbe e se dissolvendo */
  const N=34;
  for(let i=0;i<N;i++){
    const life=1.5+H1(i*3.3)*0.8,ph=t/life+H1(i*7.9),ev=Math.floor(ph),a=ph-ev,id=i*53+ev*11.9;
    const y=H1(id)*2-1,az=H1(id+1.1)*6.283,rr=Math.sqrt(1-y*y),u=[rr*Math.cos(az),y,rr*Math.sin(az)];
    if(dot(u,toEye)<-0.3)continue;
    const dir=nrm([u[0],u[1]+0.45,u[2]]);
    const sw=0.1*a*Math.sin(a*5+id);
    const dist=0.6*(1-Math.pow(1-a,2));
    const B=[c[0]+u[0]*0.98+dir[0]*dist+ex[0]*sw,c[1]+u[1]*0.98+dir[1]*dist+ex[1]*sw,c[2]+u[2]*0.98+dir[2]*dist+ex[2]*sw];
    const rad=0.07+0.2*Math.sqrt(a);
    A=Math.min(1,a/0.1)*Math.pow(1-a,1.3)*0.95;
    if(A<0.02)continue;
    cloud(B,rad,0.05+0.001*(i%7),id);
  }
  return new Float32Array(out);
}
function makeSparkles(eye,c,t){
  const out=[];const toEye=nrm(sub(eye,c));
  const ex=nrm(cross([0,1,0],toEye)),ey=cross(toEye,ex);
  const COL=[[1,1,1],[0.85,0.8,1],[0.7,0.9,1],[1,0.9,0.98]];
  for(let i=0;i<30;i++){
    const life=1.1+H1(i*2.9)*1.1,ph=t/life+H1(i*6.1),ev=Math.floor(ph),a=ph-ev,id=i*47+ev*9.3;
    const y=H1(id)*2-1,az=H1(id+1.7)*6.283,rr=Math.sqrt(1-y*y),u=[rr*Math.cos(az),y,rr*Math.sin(az)];
    if(dot(u,toEye)<-0.2)continue;
    const rad=1.03+H1(id+2.2)*0.42,B=[c[0]+u[0]*rad,c[1]+u[1]*rad,c[2]+u[2]*rad];
    const tw=Math.pow(Math.sin(Math.PI*a),1.5);
    const R=(0.05+0.11*H1(id+3.3))*tw,al=Math.min(1,tw*1.6),col=COL[i%4],rot=H1(id+4.4)*0.8;
    for(let k=0;k<8;k++){const a0=rot+Math.PI/4*k,a1=rot+Math.PI/4*(k+1);const r0=k%2?R*0.2:R,r1=(k+1)%2?R*0.2:R;
      const P=(an,r)=>[B[0]+(ex[0]*Math.cos(an)+ey[0]*Math.sin(an))*r+toEye[0]*0.07,B[1]+(ex[1]*Math.cos(an)+ey[1]*Math.sin(an))*r+toEye[1]*0.07,B[2]+(ex[2]*Math.cos(an)+ey[2]*Math.sin(an))*r+toEye[2]*0.07];
      for(const p of [[B[0]+toEye[0]*0.07,B[1]+toEye[1]*0.07,B[2]+toEye[2]*0.07],P(a0,r0),P(a1,r1)])out.push(p[0],p[1],p[2],col[0],col[1],col[2],al);}
  }
  return new Float32Array(out);
}


/* ---------- Adaptação para Three.js (r152) ---------- */
const sphereCache=new WeakMap();
function sphereGeo(T,detail){
 let m=sphereCache.get(T);if(!m){m={};sphereCache.set(T,m);}
 if(m[detail])return m[detail];
 const nx=detail,ny=Math.round(detail*.75),P=[],I=[];
 for(let j=0;j<=ny;j++){const th=Math.PI*j/ny;for(let i=0;i<=nx;i++){const ph=2*Math.PI*i/nx;P.push(Math.sin(th)*Math.cos(ph),Math.cos(th),Math.sin(th)*Math.sin(ph));}}
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;I.push(a,b,a+1,a+1,b,b+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setIndex(I);g.computeBoundingSphere();
 g.boundingSphere.radius=2.5;return m[detail]=g;
}
// Shaders originais, só trocando o que o Three.js já declara (posição, câmera, saída).
const VS3=VS.replace('#version 300 es','').replace('in vec3 aPos;','').replace(/uniform mat4 uVP; uniform vec3 uCenter;/,'')
 .replace('vec3 n=aPos;','vec3 n=position;')
 .replace('vec3 w=uCenter+n*','vec3 w=n*')
 .replace('vN=n; vW=w; gl_Position=uVP*vec4(w,1.0);','vN=n; vW=w; gl_Position=projectionMatrix*modelViewMatrix*vec4(w,1.0);'); // tudo no espaço da esfera
const FS3=FS.replace('#version 300 es','').replace('in vec3 vN; in vec3 vW; out vec4 o;','in vec3 vN; in vec3 vW; layout(location=0) out highp vec4 o;')
 .replace('uniform vec3 uCam;','').split('uCam').join('uCamL')
 .replace(/void main\(\)\{(\s*)vec3 N=/,'uniform vec3 uCamL;\nvoid main(){$1vec3 N=');
// sRGB -> linear (materiais comuns do Three convertem de volta na saída).
const lin=c=>c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);
const HALO_TEX=new WeakMap();
function haloTexture(T){
 if(HALO_TEX.has(T))return HALO_TEX.get(T);
 const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),img=g.createImageData(128,128);
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){const r=Math.hypot(x-63.5,y-63.5)/64,v=r>1?0:Math.pow(1-r,2.6)*.6,k=(y*128+x)*4;img.data[k]=img.data[k+1]=img.data[k+2]=255;img.data[k+3]=Math.round(v*255);}
 g.putImageData(img,0,0);const t=new T.CanvasTexture(c);HALO_TEX.set(T,t);return t;
}
// Malha dinâmica (efeitos gerados a cada quadro: chamas, fumaça, brilhos, raios).
function dynMesh(T,cap,opts){
 const g=new T.BufferGeometry();
 const pos=new T.BufferAttribute(new Float32Array(cap*3),3),col=new T.BufferAttribute(new Float32Array(cap*opts.ch),opts.ch);
 pos.setUsage(T.DynamicDrawUsage);col.setUsage(T.DynamicDrawUsage);g.setAttribute('position',pos);g.setAttribute('color',col);g.setDrawRange(0,0);
 const m=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,transparent:!!opts.transparent,depthWrite:!opts.transparent,blending:opts.additive?T.AdditiveBlending:T.NormalBlending,fog:false,toneMapped:false});
 const mesh=new T.Mesh(g,m);mesh.frustumCulled=false;mesh.renderOrder=opts.order||5;
 mesh.fill=(arr)=>{const n=Math.min(cap,arr.length/7),P=pos.array,C=col.array,ch=opts.ch;
  for(let i=0;i<n;i++){P[i*3]=arr[i*7];P[i*3+1]=arr[i*7+1];P[i*3+2]=arr[i*7+2];const a=arr[i*7+6];
   const k=opts.premul?a:1;C[i*ch]=lin(arr[i*7+3]*k);C[i*ch+1]=lin(arr[i*7+4]*k);C[i*ch+2]=lin(arr[i*7+5]*k);if(ch===4)C[i*ch+3]=a;}
  g.setDrawRange(0,n);pos.needsUpdate=true;col.needsUpdate=true;};
 return mesh;
}
const IDS=['fogo','agua','eletrica','veneno','arcana','natureza','vortice','trevas','universal'];
const INFO={
 fogo:{nome:'Fogo',desc:'Lava em brasa com explosões e respingos'},
 agua:{nome:'Água',desc:'Água viva com espuma e respingos'},
 eletrica:{nome:'Elétrica',desc:'Energia azul com raios que estalam'},
 veneno:{nome:'Veneno',desc:'Gosma verde rachada e borbulhante'},
 arcana:{nome:'Arcana',desc:'Magia roxa com portais'},
 natureza:{nome:'Natureza',desc:'Verde vivo com veios de raiz'},
 vortice:{nome:'Vórtice',desc:'Espiral rosa e vermelha girando'},
 trevas:{nome:'Trevas',desc:'Energia negra soltando fumaça'},
 universal:{nome:'Universal',desc:'Uma galáxia dentro, com estrelas'}
};
/* Cria uma esfera (raio 1) pronta para pôr na cena.
   T = THREE (global ou módulo). update(t, camera) a cada quadro. */
function create(T,id,o={}){
 const def=orbs[IDS.indexOf(id)];if(!def)throw Error('Esfera desconhecida: '+id);
 const root=new T.Group();root.name='Esfera de Poder · '+INFO[id].nome;
 const geo=sphereGeo(T,o.detail||72),mats=[];
 const halo=new T.Sprite(new T.SpriteMaterial({map:haloTexture(T),color:new T.Color().setRGB(def.halo[0],def.halo[1],def.halo[2],T.SRGBColorSpace),blending:T.AdditiveBlending,transparent:true,depthWrite:false,fog:false,toneMapped:false}));
 halo.scale.setScalar(2*(def.fire?3.3:2.9));halo.renderOrder=1;root.add(halo);
 def.L.forEach((l,k)=>{
  const tint=l[3]||[1,1,1];
  const m=new T.ShaderMaterial({glslVersion:T.GLSL3,vertexShader:VS3,fragmentShader:FS3,transparent:l[0]===2,depthWrite:true,
   uniforms:{uTime:{value:0},uKind:{value:l[0]},uScale:{value:l[1]},uShell:{value:l[2]},uTint:{value:new T.Vector3(tint[0],tint[1],tint[2])},uCamL:{value:new T.Vector3()}}});
  const mesh=new T.Mesh(geo,m);mesh.renderOrder=2+k;mesh.frustumCulled=false;root.add(mesh);mats.push(m);
 });
 const fx={};
 if(def.fire)fx.flames=dynMesh(T,40000,{ch:3,order:6});
 if(def.smoke)fx.smoke=dynMesh(T,40000,{ch:4,transparent:true,order:7});
 if(def.stars)fx.sparks=dynMesh(T,4000,{ch:4,transparent:true,additive:true,order:7});
 if(def.elec)fx.bolts=dynMesh(T,6000,{ch:3,transparent:true,additive:true,premul:true,order:8});
 for(const k in fx)root.add(fx[k]);
 const eye=new T.Vector3();let lastBolt=-1;
 return {root,id,
  update(t,camera){
   root.updateMatrixWorld();
   eye.copy(camera.position);root.worldToLocal(eye); // câmera no espaço da esfera (raio 1)
   for(const m of mats){m.uniforms.uTime.value=t;m.uniforms.uCamL.value.copy(eye);}
   halo.material.opacity=Math.min(1,.9+.1*Math.sin(t*3)+(def.elec?.15*(Math.sin(t*37)>.6?1:0):0));
   const e=[eye.x,eye.y,eye.z],c=[0,0,0];
   if(fx.flames)fx.flames.fill(makeFlames(e,c,t));
   if(fx.smoke)fx.smoke.fill(makeSmoke(e,c,t));
   if(fx.sparks)fx.sparks.fill(makeSparkles(e,c,t));
   if(fx.bolts&&(lastBolt<0||t-lastBolt>.1||t<lastBolt)){lastBolt=t;fx.bolts.fill(makeBolts(e,c));}
  },
  dispose(){for(const m of mats)m.dispose();for(const k in fx){fx[k].geometry.dispose();fx[k].material.dispose();}halo.material.dispose();}
 };
}
window.EsferasDePoder={IDS,INFO,create,cor:id=>orbs[IDS.indexOf(id)].lab,shaders:{vertex:VS3,fragment:FS3}};

})();
