'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),p=path.join(root,'test-fire-webgl.html');
fs.writeFileSync(p,"<!doctype html><html><head><meta charset=\"utf-8\"></head>\n<body><div id=\"result\">START</div>\n<script src=\"https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.min.js\"></script>\n<script src=\"./fogo-grama-v1267.js\"></script>\n<script>\n(async()=>{try{\n const T=window.THREE,scene=new T.Scene();\n scene.background=new T.Color(0x020306);\n const camera=new T.PerspectiveCamera(55,256/256,.1,100);\n camera.position.set(0,3.4,6.8);camera.lookAt(0,.65,0);\n const renderer=new T.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});\n renderer.setSize(256,256);renderer.setPixelRatio(1);\n const fire=createArcanoWildfireV1267(T,scene,{\n  width:128,length:100,mobile:true,\n  moistureAt:()=>.1,coverAt:()=>1,waterAt:()=>false,\n  terrainAt:()=>0,getRainLevel:()=>0,\n  windAt:()=>({heading:0,strength:.9})\n });\n const t=new T.WebGLRenderTarget(256,256),rgba=new Uint8Array(256*256*4);\n function sample(){\n  renderer.setRenderTarget(t);renderer.render(scene,camera);\n  renderer.readRenderTargetPixels(t,0,0,256,256,rgba);\n  let warm=0;\n  for(let j=0;j<rgba.length;j+=4){\n   const r=rgba[j],g=rgba[j+1],b=rgba[j+2];\n   if(r>110&&r>g*1.10&&g>b*1.10)warm++;\n  }\n  return {warm,drawCalls:renderer.info.render.calls};\n }\n const before=sample();\n fire.ignite(0,0,2.2);\n for(let i=0;i<25;i++)fire.update(.085,camera);\n await new Promise(ok=>setTimeout(ok,500));\n const after=sample(),flames=fire.status().burning;\n const atlas=scene.children.find(x=>x.name&&x.name.includes('Fogo CC0'))?.material.map;\n const validAtlas=(atlas?.image?.naturalWidth||atlas?.image?.width||0)>=640;\n const ok=after.warm>before.warm+50&&after.drawCalls>=2&&flames>0&&validAtlas;\n document.querySelector('#result').textContent=JSON.stringify({ok,before,after,flames,validAtlas,\n  atlasWidth:atlas?.image?.naturalWidth||0,fireTexture:fire.status().texture});\n renderer.dispose();t.dispose();\n}catch(e){document.querySelector('#result').textContent='ERROR: '+(e.stack||e.message)}})();\n</script></body></html>");
try{
 const chrome=['google-chrome','chromium','chromium-browser'].find(name=>cp.spawnSync('which',[name]).status===0);
 if(!chrome)throw Error('Chrome indisponível no runner');
 const res=cp.spawnSync(chrome,['--headless','--no-sandbox','--disable-gpu','--enable-unsafe-swiftshader',
 '--allow-file-access-from-files','--disable-dev-shm-usage','--virtual-time-budget=10000',
 '--dump-dom','file://'+p],{encoding:'utf8',timeout:65000,maxBuffer:1600000});
 const match=res.stdout?.match(/<div id="result">([\s\S]*?)<\/div>/);
 console.log('Fogo CC0 WebGL:',match?.[1]||'SEM RESULTADO');
 if(!match?.[1]?.includes('"ok":true')){
  console.error((res.stderr||'').slice(-1500));process.exitCode=1;
 }
}finally{fs.rmSync(p,{force:true});}