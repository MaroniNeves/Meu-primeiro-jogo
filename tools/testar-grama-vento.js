// V12.59: teste de integração das animações da grama sem WebGL.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const ecology=fs.readFileSync(path.join(root,'ecossistema-v1232.js'),'utf8');
const main=fs.readFileSync(path.join(root,'agua-v1226.js'),'utf8');
const start=ecology.indexOf('const grassVisual={');
const stop=ecology.indexOf('function makeMesh(name,kind)',start);
assert.ok(start>=0&&stop>start,'Código visual da grama deve estar no módulo ecológico');
const sample=ecology.slice(start,stop);
class Vector2{
 constructor(x=0,y=0){this.x=x;this.y=y;}
 set(x,y){this.x=x;this.y=y;return this;}
}
class Vector4{
 constructor(x=0,y=0,z=0,w=0){this.set(x,y,z,w);}
 set(x,y,z,w){Object.assign(this,{x,y,z,w});return this;}
}
let player=null,wind=0,heading=0;
const geometry={
 boundingBox:{min:{y:-.1},max:{y:1.3}},
 computeBoundingBox(){}
};
const ctx={
 T:{Vector2,Vector4},
 material:()=>({}),
 meshLibrary:{grassShort1:geometry},
 api:{
   atmosphere:{getMetrics:()=>({wind}),getGrassWindHeading:()=>heading},
   getGrassPlayer:()=>player
 },
 clamp:(x,a,b)=>Math.min(b,Math.max(a,x)),
 Math
};
vm.createContext(ctx);
vm.runInContext(sample+';globalThis.result={grassVisual,grassAnimatedMaterial,animateGrassVisuals};',ctx);
const {grassVisual,grassAnimatedMaterial,animateGrassVisuals}=ctx.result;
const mat=grassAnimatedMaterial('grassShort1','grassShort');
const shader={uniforms:{},vertexShader:'void main(){\\n#include <begin_vertex>\\n#include <project_vertex>\\n}'};
mat.onBeforeCompile(shader);
assert.match(shader.vertexShader,/arcBlade\*=arcBlade/);
assert.match(shader.vertexShader,/arcRoot-uArcPlayer\.xy/);
assert.match(shader.vertexShader,/arcMove\+=d\*/);
assert.match(shader.vertexShader,/instanceMatrix\[0\]\.xz/);
assert.match(shader.vertexShader,/#include <begin_vertex>/);
assert.match(shader.vertexShader,/#include <project_vertex>/);
assert.equal(shader.uniforms.uArcGrassBase.value,-.1);
assert.ok(Math.abs(shader.uniforms.uArcGrassInvHeight.value-1/1.4)<1e-12);
assert.equal(shader.uniforms.uArcPlayer,grassVisual.uniforms.uArcPlayer);
assert.equal(shader.uniforms.uArcWindTime,grassVisual.uniforms.uArcWindTime);
assert.equal(shader.uniforms.uArcWindStrength.value,0);
wind=1.5;heading=Math.PI/2;animateGrassVisuals(.1);
assert.ok(Math.abs(grassVisual.uniforms.uArcWindStrength.value-.138)<1e-8);
assert.ok(Math.abs(grassVisual.uniforms.uArcWindDir.value.y-1)<1e-8);
player={position:{x:0,z:0},grassSpeed:1.65};
animateGrassVisuals(.1);
assert.ok(grassVisual.uniforms.uArcPlayer.value.w>.4);
for(let i=1;i<=8;i++){
 player.position.x=i*.13;
 animateGrassVisuals(.09);
}
const trails=[grassVisual.uniforms.uArcTrail0.value,grassVisual.uniforms.uArcTrail1.value];
assert.ok(trails.some(t=>t.w>.001),'Passagem deve afligir grama atrás do boneco');
player=null;for(let i=0;i<22;i++)animateGrassVisuals(.1);
assert.equal(grassVisual.uniforms.uArcPlayer.value.w,0);
assert.ok(trails.every(t=>t.w===0),'Grama volta gradualmente à posição após passagem');
assert.match(main,/getGrassPlayer:\(\)=>game\.active\?game:null/);
assert.match(main,/getGrassWindHeading:\(\)=>atmWindHeading/);
assert.match(main,/game\.grassSpeed=walked\/Math\.max\(dt,\.001\)/);
assert.match(ecology,/materials\.set\(name,grassAnimatedMaterial\(name,kind\)\)/);
assert.match(ecology,/animateGrassVisuals\(dt\)/);
assert.match(ecology,/const step=mobileDevice\?\.140:\.125/);
assert.match(ecology,/const names=\['grassShort1','grassMixed1','grassTall1','grassMixed2'\]/);
console.log('OK: vento em GPU, direção física, contato radial, trilha temporária e densidade original preservada.');
