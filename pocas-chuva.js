/* Poças de chuva (só visual, sem cálculo de solo/infiltração):
   - aparecem em lugares aleatórios e planos em volta do personagem quando a chuva é FORTE (nível 3 ou mais)
     e já está chovendo há um tempo; vão crescendo enquanto chove;
   - com chuva caindo, anéis de gotas aparecem na superfície;
   - quando a chuva para, encolhem e somem aos poucos (secam).
   O clima vem de window.arcanoClima (agua-v1226.js). */
(function(){
'use strict';
const T=window.THREE;if(!T)return;
const rr=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const MAX=window.innerWidth<680?14:26;
function install(){
 const api=window.arcanoWaterV1226,FA=window.arcanoFundoAquatico,C=window.arcanoClima;
 if(!api||!api.scene||!FA||!FA.ground||!C){setTimeout(install,800);return;}
 const ground=FA.ground,water=FA.water,NG=window.arcanoNoGrass||[];
 // forma irregular de poça (contorno ondulado), com uv radial
 const geo=(()=>{const N=40,pos=[0,0,0],uv=[.5,.5],idx=[];for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,r=1+.16*Math.sin(a*3+1)+.09*Math.sin(a*5+2)+.05*Math.sin(a*9);pos.push(Math.cos(a)*r,0,Math.sin(a)*r);uv.push(.5+Math.cos(a)*.5,.5+Math.sin(a)*.5);if(i<N)idx.push(0,i+2,i+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;})();
 const U={uTime:{value:0},uRain:{value:0},uSky:{value:new T.Color('#9fb3c4')},uDay:{value:1}};
 const mat=new T.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,
  vertexShader:`varying vec2 vUv;varying vec3 vW;
   void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`uniform float uTime,uRain,uDay;uniform vec3 uSky;varying vec2 vUv;varying vec3 vW;
   float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   void main(){vec2 q=vUv-.5;float r=length(q)*2.;float edge=1.-smoothstep(.72,1.,r);
    vec3 V=normalize(cameraPosition-vW);float fres=pow(1.-clamp(V.y,0.,1.),3.);
    vec3 col=mix(vec3(.07,.075,.08),uSky*(.45+.4*uDay),.12+.55*fres);
    // anéis de gotas: células de 35 cm, cada uma com uma gota que cai num tempo próprio
    float ring=0.;vec2 g=vW.xz/.35;vec2 id=floor(g),f=fract(g)-.5;
    for(int k=0;k<1;k++){float s=h(id),t=fract(uTime*(.8+s*.6)+s*7.);vec2 c=vec2(h(id+3.1),h(id+7.7))-.5;float d=length(f-c*.6);
     ring+=smoothstep(.04,0.,abs(d-t*.45))*(1.-t)*step(.35,s);}
    col+=vec3(.75,.82,.9)*ring*uRain*.8;
    gl_FragColor=vec4(col,edge*.82);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
   }`});
 const root=new T.Group();root.name='Poças de chuva';api.scene.add(root);
 const pools=[];
 const flat=(x,z,r)=>{const y=ground(x,z);let mx=0;for(let i=0;i<6;i++){const a=i/6*Math.PI*2;mx=Math.max(mx,Math.abs(ground(x+Math.cos(a)*r,z+Math.sin(a)*r)-y));}return mx<.07*r+.05?y:null;};
 const okSpot=(x,z)=>{const w=water(x,z);if(w&&w.depth>.02)return false;for(const f of NG)if(f(x,z))return false;
  const br=window.arcanoBridgeSolid;if(br&&br.surfaceAt&&br.surfaceAt(x,z)!=null)return false;
  const ex=window.arcanoExtraDecks;if(ex)for(const d of ex){try{if(d.surfaceAt(x,z)!=null)return false;}catch(e){}}return true;};
 function spawn(px,pz){for(let k=0;k<12;k++){const a=rr(0,Math.PI*2),d=rr(4,45),x=px+Math.cos(a)*d,z=pz+Math.sin(a)*d,size=rr(.6,1.9);
  if(pools.some(p=>Math.hypot(p.x-x,p.z-z)<p.max+size+1))continue;if(!okSpot(x,z))continue;const y=flat(x,z,size);if(y==null)continue;
  const m=new T.Mesh(geo,mat);m.position.set(x,y+.03,z);m.rotation.y=rr(0,Math.PI*2);m.scale.set(.01,1,.01);m.renderOrder=2;root.add(m);
  pools.push({m,x,z,y,max:size,grow:0,sx:rr(.7,1.15)});return;}}
 let last=performance.now(),spawnT=0,rainFor=0;
 (function loop(now){requestAnimationFrame(loop);const dt=Math.min(.1,(now-last)/1000);last=now;if(window.arcanoPausa)return;
  U.uTime.value+=dt;const st=C.estado,strong=st.chovendo&&st.nivel>=3;
  rainFor=strong?rainFor+dt:Math.max(0,rainFor-dt*2);
  U.uRain.value+=((st.nivel>0?1:0)-U.uRain.value)*Math.min(1,dt*2);
  const Rv=window.arcanoAnimeRiver,us=Rv&&Rv.material&&Rv.material.uniforms&&Rv.material.uniforms.uSun;U.uDay.value=us?clamp((us.value.y+.1)/.28,0,1):1;
  const pl=api.getGrassPlayer&&api.getGrassPlayer(),cam=api.getMainCamera&&api.getMainCamera(),src=pl?pl.position:cam&&cam.position;if(!src)return;
  // depois de ~1,5 min de chuva forte (temporal: ~1 min) começam a aparecer poças
  const wait=st.temporal?60:90;spawnT-=dt;
  if(strong&&rainFor>wait&&pools.length<MAX&&spawnT<=0){spawnT=rr(1.5,4);spawn(src.x,src.z);}
  for(let i=pools.length-1;i>=0;i--){const p=pools[i];
   if(strong)p.grow=Math.min(1,p.grow+dt/45);else p.grow-=dt/(st.chovendo?60:150);   // seca em ~2,5 min
   if(Math.hypot(p.x-src.x,p.z-src.z)>80)p.grow-=dt/5;                             // longe demais: some
   if(p.grow<=0){root.remove(p.m);pools.splice(i,1);continue;}
   const s=p.max*Math.sqrt(p.grow);p.m.scale.set(s*p.sx,1,s);}
 })(last);
 // teste: window.arcanoPocas.forcar(n) cria n poças já formadas em volta do personagem
 window.arcanoPocas={pools,forcar(n){const pl=api.getGrassPlayer&&api.getGrassPlayer(),cam=api.getMainCamera(),src=pl?pl.position:cam.position;for(let i=0;i<(n||8);i++)spawn(src.x,src.z);for(const p of pools)p.grow=Math.max(p.grow,.8);return pools.length;}};
}
install();
})();
