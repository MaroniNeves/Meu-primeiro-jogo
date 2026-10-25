'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),p=path.join(root,'test-poly-pizza-glb.html');
const gltf={
 asset:{version:'2.0',generator:'Teste local de GLB, não é modelo Poly Pizza'},
 buffers:[{byteLength:36}],
 bufferViews:[{buffer:0,byteOffset:0,byteLength:36,target:34962}],
 accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[-.35,0,0],max:[.35,1,0]}],
 meshes:[{primitives:[{attributes:{POSITION:0},mode:4}]}],
 nodes:[{mesh:0}],scenes:[{nodes:[0]}],scene:0
};
function align4(buffer,padding=0x20){
 const len=(buffer.length+3)&~3;
 return Buffer.concat([buffer,Buffer.alloc(len-buffer.length,padding)]);
}
const json=align4(Buffer.from(JSON.stringify(gltf)));
const vertices=Buffer.from(new Float32Array([-.35,0,0,.35,0,0,0,1,0]).buffer);
const bin=align4(vertices,0);
const buf=Buffer.alloc(12+8+json.length+8+bin.length);
buf.writeUInt32LE(0x46546c67,0);buf.writeUInt32LE(2,4);buf.writeUInt32LE(buf.length,8);
buf.writeUInt32LE(json.length,12);buf.writeUInt32LE(0x4e4f534a,16);json.copy(buf,20);
const binAt=20+json.length;buf.writeUInt32LE(bin.length,binAt);buf.writeUInt32LE(0x004e4942,binAt+4);bin.copy(buf,binAt+8);
const encoded=buf.toString('base64');
const page='<!doctype html><html><head><meta charset="utf-8">'+
 '<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js"}}</script>'+
 '<script src="https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.min.js"></script>'+
 '<script src="./fogo-grama-v1267.js"></script></head><body><pre id="result">START</pre>'+
 '<script>(async()=>{try{const T=window.THREE,scene=new T.Scene();'+
 'const fire=window.createArcanoWildfireV1267(T,scene,{width:128,length:100,mobile:true,'+
 'moistureAt:()=>.12,coverAt:()=>1,waterAt:()=>false,terrainAt:()=>0,getRainLevel:()=>0,'+
 'windAt:()=>({heading:0,strength:.7})});'+
 'const raw=Uint8Array.from(atob('+JSON.stringify(encoded)+'),c=>c.charCodeAt(0));'+
 'const file=new File([raw],"Flame-Decal-CC0.glb",{type:"model/gltf-binary"});'+
 'const result=await fire.importFireGLB(file);'+
 'fire.ignite(0,0,2);const camera=new T.PerspectiveCamera(60,1,.1,100);camera.position.set(0,3,5);'+
 'camera.lookAt(0,0,0);for(let i=0;i<9;i++)fire.update(.05,camera);'+
 'const models=scene.children.filter(m=>m.name&&m.name.includes("Fogo Poly Pizza"));'+
 'const visible=models.filter(m=>m.visible).length;const renderer=new T.WebGLRenderer({antialias:false});'+
 'renderer.setSize(32,32);renderer.render(scene,camera);'+
 'const before=fire.getImportedFire();fire.clearImportedFire();const after=fire.getImportedFire();'+
 'const ok=result.objects===12&&result.meshes>=1&&visible>0&&before.ready&&!after.ready;'+
 'document.getElementById("result").textContent=JSON.stringify({ok,result,visible,before,after});'+
 'renderer.dispose();}catch(e){document.getElementById("result").textContent="ERROR: "+(e.stack||e.message);}})();'+
 '</script></body></html>';
fs.writeFileSync(p,page);
try{
 const chrome=['google-chrome','chromium','chromium-browser'].find(name=>cp.spawnSync('which',[name]).status===0);
 if(!chrome)throw Error('Chrome ausente no runner');
 const res=cp.spawnSync(chrome,['--headless','--no-sandbox','--disable-gpu','--enable-unsafe-swiftshader',
 '--allow-file-access-from-files','--disable-dev-shm-usage','--virtual-time-budget=16000',
 '--dump-dom','file://'+p],{encoding:'utf8',timeout:70000,maxBuffer:1400000});
 const result=res.stdout?.match(/<pre id="result">([\s\S]*?)<\/pre>/)?.[1];
 console.log('Importação GLB em WebGL:',result||'sem resultado');
 if(!result?.includes('"ok":true')){
  console.error((res.stderr||'').slice(-1800));process.exitCode=1;
 }
}finally{fs.rmSync(p,{force:true});}
