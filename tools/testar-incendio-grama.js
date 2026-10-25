'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('fogo-grama-v1267.js','utf8');
assert.doesNotThrow(()=>new Function(src));
const window={};
vm.runInNewContext(src,{window,Math,Uint8Array,Float32Array,Set,Number});
assert.equal(typeof window.createArcanoWildfireV1267,'function');
let rain=0,moist=.20,wind={heading:0,strength:1};
const fire=window.createArcanoWildfireV1267(null,null,{
 width:128,length:100,mobile:true,
 coverAt:(x,z)=>x>-15&&z>-15?1:0,
 moistureAt:()=>moist,waterAt:(x,z)=>x>15,
 getRainLevel:()=>rain,windAt:()=>wind
});
assert.equal(fire.mask.length,128*100*4);
assert.equal(fire.ignite(0,0,1.6),true,'Grama seca deve pegar fogo');
assert.ok(fire.status().burning>0);
for(let i=0;i<200;i++)fire.update(.085);
const scorched=fire.sample(0,0).burn;
assert.ok(scorched>.02,'A própria grama deve acumular carvão');
assert.ok(fire.status().scorched>0,'Carvão persiste após queimar');
fire.quench();
assert.equal(fire.status().burning,0,'Água apaga todas as frentes ativas');
assert.ok(fire.sample(0,0).burn>0,'Apagar chamas não restaura grama verde imediatamente');
assert.equal(fire.ignite(16,1,1.0),false,'Água profunda impede incêndio');
assert.equal(fire.ignite(-30,-30,1.0),false,'Solo sem grama não incendeia');
rain=5;
assert.equal(fire.ignite(4,3,1.0),false,'Temporal impede novas ignições');
rain=0;
moist=.95;
assert.equal(fire.ignite(5,4,1.0),false,'Solo saturado impede nova ignição');
moist=.2;
assert.equal(fire.igniteCone({x:2,z:0},{x:1,z:0},6.1),true,
 'Dragonbreath incendeia células adiante do personagem');
const burning=fire.status().burning;
rain=5;
for(let i=0;i<140;i++)fire.update(.085);
assert.ok(fire.status().burning<burning,'Chuva forte deve apagar incêndio existente');
fire.quench();
const beforeRecovery=fire.sample(0,0).burn;
rain=2;
for(let i=0;i<1000;i++)fire.update(.085);
assert.ok(fire.sample(0,0).burn<beforeRecovery,
 'Cobertura vegetal deve começar a se recuperar ao longo do tempo');
assert.ok(!src.includes('new T.IcosahedronGeometry'),'Fogo não pode virar bolinha mágica');
assert.ok(src.includes('fire-assets/fire1_64.png'),'Chamas devem usar atlas real CC0');
assert.ok(src.includes('new T.InstancedMesh'),'Visual deve usar instanciamento eficiente');
console.log('OK: fogo CC0; ignição, vento, carvão da grama, águas, temporal, apagar e regeneração.');
