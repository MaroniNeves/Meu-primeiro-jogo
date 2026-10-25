'use strict';
// V12.65 — mago original, conjurações, geometrias não esféricas e impactos no Chrome.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),js=fs.readFileSync(path.join(root,'agua-v1226.js'),'utf8');
assert.ok(fs.existsSync(path.join(root,'magias/vfx-jogo-v1265.js')));
const start=js.indexOf("const MAGE_MODEL='./magias/models/Idle.fbx';");
const end=js.indexOf('async function loadGameCharacter(){',start);
const effectsStart=js.indexOf('const mageSpells=['),effectsEnd=js.indexOf('function gameInput(){',effectsStart);
assert.ok(effectsStart>0&&effectsEnd>effectsStart,'Efeitos e disparo de magias devem existir');
assert.ok(start>0&&end>start,'Função de carregamento do mago deve existir');
for(const name of ['Idle.fbx','cast1.fbx','cast2.fbx','cast3.fbx','diffuse.png']){
 const p=path.join(root,'magias/models',name);
 assert.ok(fs.existsSync(p),'Arquivo ausente '+name);
 assert.ok(fs.statSync(p).size>100000,'Arquivo incompleto '+name);
}
const entry=path.join(root,'mage-integration-test.html');
const script=[
 'import * as T from "three";',
 'const game={root:new T.Group(),character:null,mixer:null,actions:{},castAction:null,hasModel:false,isMage:false,active:true,position:new T.Vector3(),heading:0,castCooldown:0,spellPending:null};',
 'const gameStatus=()=>{};',
 js.slice(start,end),
 'const scene=new T.Scene(),camera=new T.PerspectiveCamera(55,1,.1,200),W=128,L=100,rockAt=()=>false,treesNearGame=()=>false,terrainContact=()=>0,$=()=>null;camera.position.set(0,2,6);',
 js.slice(effectsStart,effectsEnd),
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
 'for(let spell=0;spell<3;spell++){',
 'if(!castMageSpell(spell))throw Error("Botão de magia não conjurou: "+spell);',
 'updateMageMagic(.25);',
 'const shooting=mageVfx.getState();',
 'if(shooting.travelling!==1)throw Error("Sem projétil: "+spell);',
 'if(shooting.specialShapes[0]<3||shooting.traces<2)throw Error("A magia ainda é só uma bolinha: "+spell);',
 'if(shooting.projectileMeshes[0]<4)throw Error("Faltam partículas, lâminas ou rastro: "+spell);',
 'let sawImpact=false;',
 'for(let frame=0;frame<80;frame++){updateMageMagic(.05);if(mageVfx.getState().impacts>0)sawImpact=true;}',
 'if(mageVfx.getState().travelling!==0||!sawImpact)throw Error("Impacto não apareceu: "+spell);',
 'clearMageMagic();',
 '}',
 'document.querySelector("#result").textContent=JSON.stringify({ok:true,height,meshes:meshes.length,clips:keys,spells:3});',
 '}catch(error){document.querySelector("#result").textContent="ERROR: "+(error.stack||error.message)}})();'
].join('\n');
const html='<!doctype html><html><head><meta charset="utf-8"><script type="importmap">'+
 JSON.stringify({imports:{three:"https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js"}})+
 '</script><script src="./magias/vfx-jogo-v1265.js"></script></head><body><div id="result">START</div><script type="module">'+script+
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
