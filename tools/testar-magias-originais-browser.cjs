'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),p=path.join(root,'arcano-real-magic-test.html');
fs.writeFileSync(p,"<!doctype html><html><head><meta charset=\"utf-8\">\n<script type=\"importmap\">{\"imports\":{\"three\":\"https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js\"}}</script>\n</head><body><pre id=\"result\">START</pre><script type=\"module\">\nimport * as T from 'three';\nimport {createOriginalMagicBridge} from './magias/originais-no-jogo.js';\n(async()=>{\ntry{\nconst scene=new T.Scene();scene.background=new T.Color('#020308');\nconst camera=new T.PerspectiveCamera(60,1.6,.1,100);\ncamera.position.set(0,3,11);camera.lookAt(0,1,0);\ncamera.layers.enableAll();\nconst renderer=new T.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});\nrenderer.setSize(360,225);renderer.setPixelRatio(1);\nconst bridge=createOriginalMagicBridge(T,scene,{mobile:true});\nconst origin=new T.Vector3(0,0,1),direction=new T.Vector3(0,0,-1);\nconst stats=[],errors=[];\nfor(let slot=0;slot<3;slot++){\nawait bridge.cast(slot,origin,direction,8);\nlet steps=0,nonBlack=0,drawCalls=0,shaderErrors=[];\nfor(let frame=0;frame<35;frame++){\n bridge.update(.05);\n renderer.render(scene,camera);\n steps++;\n if(frame===18){\n   const pixels=new Uint8Array(360*225*4);\n   renderer.readRenderTargetPixels(new T.WebGLRenderTarget(360,225),0,0,360,225,pixels);\n   drawCalls=renderer.info.render.calls;\n   shaderErrors=renderer.info.programs?.map(p=>p.diagnostics?.runnable===false?p.diagnostics:null).filter(Boolean)||[];\n }\n}\nstats.push({slot,steps,drawCalls,...bridge.state(),shaderErrors});\nbridge.clear();\n}\ndocument.querySelector('#result').textContent=JSON.stringify({ok:true,stats});\nrenderer.dispose();\n}catch(error){document.querySelector('#result').textContent='ERROR: '+(error.stack||error.message);}\n})();\n</script></body></html>");
try{
 const chrome=['google-chrome','chromium','chromium-browser'].find(name=>cp.spawnSync('which',[name]).status===0);
 const r=cp.spawnSync(chrome,['--headless','--no-sandbox','--disable-gpu','--enable-unsafe-swiftshader',
 '--allow-file-access-from-files','--disable-dev-shm-usage','--virtual-time-budget=30000',
 '--dump-dom','file://'+p],{encoding:'utf8',timeout:65000,maxBuffer:1400000});
 const result=r.stdout?.match(/<pre id="result">([\s\S]*?)<\/pre>/)?.[1];
 console.log('Magias ORIGINAIS:',result||'sem resultado');
 if(!result||!result.includes('"ok":true')){
  console.error((r.stderr||'').slice(-1200));process.exitCode=1;
 }
}finally{fs.rmSync(p,{force:true});}
