// Teste da função de câmera publicada, em múltiplas obstruções.
// Os dados estão no mesmo formato real de forestInstances.
const fs=require('fs'),assert=require('node:assert/strict'),vm=require('vm');
const source=fs.readFileSync('agua-v1226.js','utf8');
const a=source.indexOf('function safeGameCameraDistance(');
const b=source.indexOf('function applyGameCamera(){',a);
assert.ok(a>=0&&b>a);
let forestInstances=[],T={},gameTreeGrid=new Map(),gameTreeCount=-1;
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
assert.match(source,/safeGameCameraDistance\(gameCameraFocus,gameCameraGoal\)/);
assert.match(source,/camera\.lookAt\(gameCameraFocus\)/);
console.log('OK câmera: visão livre, árvore obstrutiva, visibilidade, fora do caminho e retorno.');
