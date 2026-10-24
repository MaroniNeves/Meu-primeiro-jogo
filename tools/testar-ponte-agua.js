// V12.58 — valida colisores reais da ponte e integração com os efeitos.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const eco=fs.readFileSync(path.join(root,'ecossistema-v1232.js'),'utf8');
const game=fs.readFileSync(path.join(root,'agua-v1226.js'),'utf8');
const begin=eco.indexOf('const alongX=Math.cos(direction),alongZ=Math.sin(direction);');
const finish=eco.indexOf("console.info('[Arcano V12.37]",begin);
assert.ok(begin>0&&finish>begin,'Colisor deve estar na mesma rotina que desenha a ponte');
const build=new Function('span','direction','mx','mz','deckY','realm','window','console',
 eco.slice(begin,finish)); // testa a própria função de colisão publicada, não uma cópia simulada
for(const angle of [0,Math.PI/4,Math.PI/2,-Math.PI/3]){
 const rootWindow={};const realm={visible:true};
 build(2.5,angle,4,-3,1.75,realm,rootWindow,{info:()=>{}});
 const col=rootWindow.arcanoBridgeSolid;
 assert.ok(col,'Ponte precisa publicar o colisor');
 const axis={x:Math.cos(angle),z:Math.sin(angle)};
 const side={x:-Math.sin(angle),z:Math.cos(angle)};
 const pos=(a,b)=>[4+axis.x*a+side.x*b,-3+axis.z*a+side.z*b];
 const surface=(a,b)=>{const [x,z]=pos(a,b);return col.surfaceAt(x,z);};
 const blocks=(a,b,c,d)=>{const [x,z]=pos(a,b),[nx,nz]=pos(c,d);return col.blocksSegment(x,z,nx,nz);};
 assert.ok(Math.abs(surface(0,0)-1.7825)<1e-9,'Piso na altura do topo real da tábua');
 assert.ok(surface(1,0)!==null&&surface(-1,0)!==null,'Piso contínuo');
 assert.equal(surface(0,.66),null,'Corrimão não é parte do piso');
 assert.equal(surface(1.3,0),null,'Fora do vão não tem piso suspenso');
 assert.equal(blocks(-1,0,1,0),false,'Atravessar o vão na direção correta deve ser permitido');
 assert.equal(blocks(0,0,0,.83),true,'Não pode atravessar o corrimão lateral');
 assert.equal(blocks(0,.83,0,0),true,'Não pode atravessar para dentro pela lateral');
 assert.equal(blocks(1.5,0,1.6,.8),false,'Corrimão não bloqueia fora do comprimento da ponte');
 realm.visible=false;
 assert.equal(surface(0,0),null,'Ponte escondida não é piso físico');
 assert.equal(blocks(0,0,0,.83),false,'Ponte escondida não bloqueia');
}
assert.match(game,/function solidGameFootHeight\(x,z\)/);
assert.match(game,/window\.arcanoBridgeSolid\?\.surfaceAt\(x,z\)/);
assert.match(game,/bridge\?\.blocksSegment\(game\.position\.x/);
assert.match(game,/game\.position\.y=solidGameFootHeight\(/);
assert.match(game,/const footWater=!onBridge&&sample\(depth,/);
assert.match(game,/emitGameWaterFootstep\(game\.position\.x/);
assert.match(game,/kind:'water'/);
assert.match(game,/const count=running\?10:6/);
const start=game.indexOf('function emitGameWaterFootstep(');
const end=game.indexOf('function dropStep(dt){',start);
assert.ok(start>0&&end>start);
const effect=game.slice(start,end);
for(const forbidden of ['turbidity[','add(','stats.','totalImpacts++','soilMoisture['])
 assert.ok(!effect.includes(forbidden),'Passos não podem alterar física: '+forbidden);
console.log('OK — ponte sólida em 4 orientações, corrimãos, piso elevado e ondas/respingos puramente visuais.');
