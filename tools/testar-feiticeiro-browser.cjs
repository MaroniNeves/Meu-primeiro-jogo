'use strict';
// V12.64 — carrega o FBX original e três animações no Chrome real.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),js=fs.readFileSync(path.join(root,'agua-v1226.js'),'utf8');
const start=js.indexOf("const MAGE_MODEL='./magias/models/Idle.fbx';");
const end=js.indexOf('async function loadGameCharacter(){',start);
assert.ok(start>0&&end>start,'Função de carregamento do mago deve existir');
for(const name of ['Idle.fbx','cast1.fbx','cast2.fbx','cast3.fbx','diffuse.png']){
 const p=path.join(root,'magias/models',name);
 assert.ok(fs.existsSync(p),'Arquivo ausente '+name);
 assert.ok(fs.statSync(p).size>100000,'Arquivo incompleto '+name);
}
const entry=path.join(root,'mage-integration-test.html');
const script=[
 'import * as T from "three";',
 'const game={root:new T.Group(),character:null,mixer:null,actions:{},castAction:null,hasModel:false,isMage:false};',
 'const gameStatus=()=>{};',
 js.slice(start,end),
 '(async()=>{try{',
 'await loadLocalMage();',
 'const keys=["idle","cast1","cast2","cast3"];',
 'for(const key of keys)if(!game.actions[key])throw Error("Animação ausente: "+key);',
 'const meshes=[];game.character.traverse(o=>{if(o.isSkinnedMesh||o.isMesh)meshes.push(o);});',
 'if(meshes.length<1)throw Error("Mago sem malha");',
 'if(!game.isMage||!game.hasModel)throw Error("Mago não substituiu o personagem genérico");',
 'const box=new T.Box3().setFromObject(game.character),height=box.getSize(new T.Vector3()).y;',
 'if(height<1.3||height>2.3)throw Error("Escala incorreta: "+height);',
 'game.actions.cast1.reset().play();game.mixer.update(.25);',
 'game.actions.cast2.reset().play();game.mixer.update(.25);',
 'game.actions.cast3.reset().play();game.mixer.update(.25);',
 'document.querySelector("#result").textContent=JSON.stringify({ok:true,height,meshes:meshes.length,clips:keys});',
 '}catch(error){document.querySelector("#result").textContent="ERROR: "+(error.stack||error.message)}})();'
].join('\n');
const html='<!doctype html><html><head><meta charset="utf-8"><script type="importmap">'+
 JSON.stringify({imports:{three:"https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js"}})+
 '</script></head><body><div id="result">START</div><script type="module">'+script+
 '</script></body></html>';
fs.writeFileSync(entry,html);
try{
 const chrome=['google-chrome','chromium','chromium-browser'].find(s=>cp.spawnSync('which',[s],{encoding:'utf8'}).status===0);
 if(!chrome)throw Error('Chrome ausente no runner');
 const result=cp.spawnSync(chrome,[
 '--headless','--no-sandbox','--disable-gpu','--enable-unsafe-swiftshader',
 '--allow-file-access-from-files','--disable-dev-shm-usage',
 '--virtual-time-budget=22000','--dump-dom','file://'+entry
 ],{encoding:'utf8',timeout:75000,maxBuffer:1500000});
 const value=(result.stdout||'').match(/<div id="result">([\s\S]*?)<\/div>/)?.[1];
 console.log('Feiticeiro 3D: ',value||'sem resultado','Chrome:',result.status);
 if(!value||!value.includes('"ok":true')){
  console.error((result.stderr||'').slice(-2300));
  process.exitCode=1;
 }
}finally{fs.rmSync(entry,{force:true});}
