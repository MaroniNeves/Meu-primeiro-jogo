'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),entry=path.join(root,'arcano-mage-webgl-test.html');
const html="<!doctype html><html><head><meta charset=\"utf-8\">\n<script type=\"importmap\">{\"imports\":{\"three\":\"https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js\"}}</script>\n<script src=\"./magias/vfx-jogo-v1265.js\"></script></head>\n<body><pre id=\"result\">START</pre><script type=\"module\">\nimport * as T from 'three';\n(async()=>{try{\nconst scene=new T.Scene();scene.background=new T.Color(0x020307);\nconst camera=new T.PerspectiveCamera(57,512/320,.1,200);\ncamera.position.set(0,2.5,5.2);camera.lookAt(0,1,-1.8);\nconst renderer=new T.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});\nrenderer.setSize(512,320);renderer.setPixelRatio(1);\nconst buffer=new Uint8Array(512*320*4);\nconst target=new T.WebGLRenderTarget(512,320);\nconst vfx=window.arcanoSpellEffectsV1265(T,scene,{terrainAt:()=>0,collides:()=>false,bounds:{x:64,z:50}});\nfunction sample(){\n renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,camera);\n renderer.readRenderTargetPixels(target,0,0,512,320,buffer);\n let n=0,red=0,blue=0,green=0,left=512,right=0;\n for(let i=0;i<buffer.length;i+=4){\n  const r=buffer[i],g=buffer[i+1],b=buffer[i+2];\n  if(Math.max(r,g,b)>55){\n   n++;red+=r;green+=g;blue+=b;\n   const x=(i/4)%512;if(x<left)left=x;if(x>right)right=x;\n  }\n }\n return {n,r:n?red/n:0,g:n?green/n:0,b:n?blue/n:0,width:right-left};\n}\nconst stats=[];\nfor(let slot=0;slot<3;slot++){\n vfx.clear();\n vfx.begin(slot,new T.Vector3(0,1.3,0),new T.Vector3(0,0,-1));\n vfx.launch(slot,new T.Vector3(0,1.3,0),new T.Vector3(0,0,-1));\n for(let i=0;i<5;i++)vfx.update(.05,camera);\n const shapes=vfx.getState().specialShapes[0],pixels=sample();\n stats.push({slot,shapes,...pixels});\n}\nconst ok=stats.every(v=>v.n>75&&v.shapes>=3&&v.width>=2) &&\n stats[1].r>stats[1].b*1.10 && stats[0].b>stats[0].r*.85 &&\n stats[2].b>stats[2].r*.90;\ndocument.getElementById('result').textContent=JSON.stringify({ok,stats,drawcalls:renderer.info.render.calls,\ndiagnostics:renderer.info.programs?.map(x=>x.diagnostics||null)});\nrenderer.dispose();target.dispose();\n}catch(error){document.getElementById('result').textContent='ERROR: '+(error.stack||error.message)}})();\n</script></body></html>";
fs.writeFileSync(entry,html);
try{
 const chrome=['google-chrome','chromium','chromium-browser'].find(name=>cp.spawnSync('which',[name]).status===0);
 if(!chrome)throw Error('Chrome não disponível');
 const result=cp.spawnSync(chrome,['--headless','--no-sandbox','--disable-gpu','--enable-unsafe-swiftshader',
 '--allow-file-access-from-files','--disable-dev-shm-usage','--virtual-time-budget=14000',
 '--dump-dom','file://'+entry],{encoding:'utf8',timeout:65000,maxBuffer:1500000});
 const match=result.stdout?.match(/<pre id="result">([\s\S]*?)<\/pre>/);
 console.log('Magias WebGL:',match?.[1]||'nenhum resultado','Chrome:',result.status);
 if(!match?.[1]?.includes('"ok":true')){
  console.error((result.stderr||'').slice(-1500));process.exitCode=1;
 }
}finally{fs.rmSync(entry,{force:true});}
