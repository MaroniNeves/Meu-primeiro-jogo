'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),p=path.join(root,'arcano-original-visual.html');
const html="<!doctype html><html><head><meta charset=\"utf-8\"><script type=\"importmap\">{\"imports\":{\"three\":\"https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js\"}}</script></head>\n<body><pre id=\"result\">START</pre><script type=\"module\">\nimport * as T from 'three';\nimport {createOriginalMagicBridge} from './magias/originais-no-jogo.js';\n(async()=>{try{\n const slot=Number(new URLSearchParams(location.search).get('slot')||0);\n const scene=new T.Scene();scene.background=new T.Color(0x030407);\n const camera=new T.PerspectiveCamera(55,360/225,.1,100);\n camera.position.set(0,2.3,10);camera.lookAt(0,1,-1);\n camera.layers.set(0);\n const renderer=new T.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});\n renderer.setSize(360,225);renderer.setPixelRatio(1);\n const bridge=createOriginalMagicBridge(T,scene,{mobile:true});\n await bridge.cast(slot,new T.Vector3(0,0,1),new T.Vector3(0,0,-1),9);\n let maxColored=0,snapshot={},frames=0,glErrors=[];\n for(let i=0;i<30;i++){\n  bridge.update(.06);\n  renderer.render(scene,camera);\n  const gl=renderer.getContext(),buf=new Uint8Array(360*225*4);\n  gl.readPixels(0,0,360,225,gl.RGBA,gl.UNSIGNED_BYTE,buf);\n  let bright=0,red=0,blue=0,green=0;\n  for(let j=0;j<buf.length;j+=4){\n   const r=buf[j],g=buf[j+1],b=buf[j+2];\n   if(Math.max(r,g,b)>28){bright++;red+=r;green+=g;blue+=b;}\n  }\n  if(bright>maxColored){\n   maxColored=bright;\n   snapshot={pixels:bright,r:bright?Math.round(red/bright):0,\n     g:bright?Math.round(green/bright):0,b:bright?Math.round(blue/bright):0,\n     drawcalls:renderer.info.render.calls,frame:i};\n  }\n  frames++;\n }\n glErrors=renderer.info.programs?.map(p=>p.diagnostics?.runnable===false?p.diagnostics:null).filter(Boolean)||[];\n const ok=maxColored>65&&glErrors.length===0&&snapshot.drawcalls>=3;\n document.querySelector('#result').textContent=JSON.stringify({ok,slot,frames,snapshot,glErrors});\n bridge.clear();renderer.dispose();\n}catch(error){document.querySelector('#result').textContent='ERROR: '+(error.stack||error.message)}})();\n</script></body></html>";
fs.writeFileSync(p,html);
try{
 const chrome=['google-chrome','chromium','chromium-browser'].find(x=>cp.spawnSync('which',[x]).status===0);
 if(!chrome)throw Error('Chrome indisponível');
 for(const slot of [0,1,2]){
  const r=cp.spawnSync(chrome,[
  '--headless','--no-sandbox','--disable-gpu','--enable-unsafe-swiftshader',
  '--allow-file-access-from-files','--disable-dev-shm-usage',
  '--virtual-time-budget=35000','--dump-dom','file://'+p+'?slot='+slot
  ],{encoding:'utf8',timeout:70000,maxBuffer:1200000});
  const data=(r.stdout||'').match(/<pre id="result">([\s\S]*?)<\/pre>/)?.[1];
  console.log('MAGIA ORIGINAL VISÍVEL',slot,data);
  if(!data?.includes('"ok":true')){
   console.error((r.stderr||'').slice(-1000));process.exitCode=1;
  }
 }
}finally{fs.rmSync(p,{force:true});}
