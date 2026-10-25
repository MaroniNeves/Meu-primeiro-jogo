// Teste da função de câmera publicada, em múltiplas obstruções.
// Os dados estão no mesmo formato real de forestInstances.
const fs=require('fs'),assert=require('node:assert/strict'),vm=require('vm');
const source=fs.readFileSync('agua-v1226.js','utf8');
const a=source.indexOf('function safeGameCameraDistance(');
const b=source.indexOf('function applyGameCamera(){',a);
assert.ok(a>=0&&b>a);
let forestInstances=[],T={Vector3:class {}},gameTreeGrid=new Map(),gameTreeCount=-1;
function treesNearGame(){
 if(gameTreeCount!==forestInstances.length){
  gameTreeGrid.clear();gameTreeCount=forestInstances.length;
  for(const a of forestInstances){
   if(a.type!=='tree'&&a.type!=='pine')continue;
   const key=Math.floor(a.x/3)+','+Math.floor(a.z/3);
   if(!gameTreeGrid.has(key))gameTreeGrid.set(key,[]);
   gameTreeGrid.get(key).push(a);
  }
 }
}
const ctx={forestInstances,Math,T,gameTreeGrid,treesNearGame};
Object.defineProperty(ctx,'gameTreeCount',{get:()=>gameTreeCount});
vm.createContext(ctx);
vm.runInContext(source.slice(a,b)+';globalThis.f=safeGameCameraDistance;',ctx);
const f=ctx.f;
const focus={x:0,y:1.3,z:0},dest={x:0,y:2.8,z:-5};
const full=Math.hypot(dest.x-focus.x,dest.y-focus.y,dest.z-focus.z);
assert.ok(Math.abs(f(focus,dest)-full)<1e-8,'Sem árvores, manter distância');
forestInstances.push({type:'tree',obj:{visible:true},x:0,z:-2,y:0,dropY:5,crownWidth:3.5});
const blocked=f(focus,dest);
assert.ok(blocked<full-1,'Árvore entre câmera e jogador precisa aproximar câmera');
forestInstances[0].obj.visible=false;
assert.ok(Math.abs(f(focus,dest)-full)<1e-8,'Árvore invisível não bloqueia');
forestInstances[0].obj.visible=true;forestInstances[0].x=6;
assert.ok(Math.abs(f(focus,dest)-full)<1e-8,'Árvore fora da linha de visão não bloqueia');
forestInstances[0].x=0;forestInstances[0].z=2;
assert.ok(Math.abs(f(focus,dest)-full)<1e-8,'Árvore atrás do boneco não bloqueia');
assert.match(source,/gameCameraActualDistance=0/);
assert.doesNotMatch(source.slice(source.indexOf('function applyGameCamera(){'),source.indexOf('// V12.62: se a copa')),/const safe=safeGameCameraDistance/, 'Árvores não podem forçar zoom automático');
assert.match(source,/updateGameCameraOcclusion\(gameCameraFocus,camera\.position\)/);
assert.match(source,/camera\.lookAt\(gameCameraFocus\)/);
console.log('OK câmera: visão livre, árvore obstrutiva, visibilidade, fora do caminho e retorno.');
// V12.62: obstáculos entre o jogador e a CÂMERA REAL fazem somente
// a árvore em primeiro plano ficar semitransparente; restaura integralmente.
const begin=source.indexOf('const gameCameraFades=new Map();');
const finish=source.indexOf('async function setPlayActive(active){',begin);
assert.ok(begin>0&&finish>begin,'Rotina de esmaecimento temporário deve existir');
let time=1000,disposals=0;
ctx.game={active:true};
ctx.performance={now:()=>time};
vm.runInContext(source.slice(begin,finish)+
 ';globalThis.fadeTest={cameraTreeCrossesView,setGameCameraTreeFade,restoreGameCameraTreeFade,updateGameCameraOcclusion,clearGameCameraOcclusion,gameCameraFades};',ctx);
const fades=ctx.fadeTest;
const leafMap={id:'folhas-originais'},barkMap={id:'casca-original'};
const leafMaterial={map:leafMap,alphaTest:.35,opacity:1,clone(){
 return {map:leafMap,alphaTest:.35,opacity:1,dispose(){disposals++;}};
}};
const barkMaterial={map:barkMap,alphaTest:0,opacity:1,clone(){
 return {map:barkMap,alphaTest:0,opacity:1,dispose(){disposals++;}};
}};
const leafMesh={isMesh:true,material:leafMaterial};
const trunkMesh={isMesh:true,material:barkMaterial};
const occludingTree={
 type:'tree',x:0,z:-2,y:0,dropY:5,crownWidth:3.5,
 obj:{visible:true,traverse(fn){fn(leafMesh);fn(trunkMesh);}}
};
const farTree={
 type:'tree',x:30,z:30,y:0,dropY:5,crownWidth:3,
 obj:{visible:true,traverse(){throw Error('Árvore distante não pode ter material modificado');}}
};
forestInstances.splice(0,forestInstances.length,occludingTree,farTree);
gameTreeCount=-1;gameTreeGrid.clear();
assert.equal(fades.cameraTreeCrossesView(occludingTree,focus,dest),true);
assert.equal(fades.cameraTreeCrossesView(farTree,focus,dest),false);
fades.updateGameCameraOcclusion(focus,dest);
assert.equal(fades.gameCameraFades.size,1,'Somente árvore na frente da câmera');
assert.notEqual(leafMesh.material,leafMaterial);
assert.equal(leafMesh.material.map,leafMap,'Textura original preservada');
assert.equal(trunkMesh.material.map,barkMap,'Casca original preservada');
for(let i=0;i<12;i++){time+=100;fades.updateGameCameraOcclusion(focus,dest);}
assert.ok(leafMesh.material.opacity<=.181,'Árvore bloqueando deve deixar personagem visível');
assert.ok(leafMesh.material.transparent&&!leafMesh.material.depthWrite);
assert.equal(leafMesh.material.alphaTest,.008,'Folhagem com mapa alpha deve continuar válida');
occludingTree.obj.visible=false;
for(let i=0;i<15;i++){time+=100;fades.updateGameCameraOcclusion(focus,dest);}
assert.equal(fades.gameCameraFades.size,0,'Árvore fora da visão deve voltar ao normal');
assert.equal(leafMesh.material,leafMaterial);
assert.equal(trunkMesh.material,barkMaterial);
assert.ok(disposals>=2,'Cópias temporárias são liberadas');
occludingTree.obj.visible=true;
time+=100;fades.updateGameCameraOcclusion(focus,dest);
assert.equal(fades.gameCameraFades.size,1);
fades.clearGameCameraOcclusion();
assert.equal(fades.gameCameraFades.size,0,'Sair do jogo restaura todas as árvores');
assert.equal(leafMesh.material,leafMaterial);
assert.match(source,/safeNow<actualDistance-\.10/,'A câmera tem de sair da obstrução imediatamente');
console.log('OK câmera V12.62: árvore bloqueante fica translúcida, árvore distante preservada, materiais originais restaurados.');

