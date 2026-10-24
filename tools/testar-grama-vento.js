// V12.60: integração do shader GPU de vento/temporal e afastamento por contato.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const ecology=fs.readFileSync(path.join(root,'ecossistema-v1232.js'),'utf8');
const main=fs.readFileSync(path.join(root,'agua-v1226.js'),'utf8');
const start=ecology.indexOf('const grassVisual={');
const stop=ecology.indexOf('function makeMesh(name,kind)',start);
assert.ok(start>=0&&stop>start,'Shader e movimento da grama devem estar no módulo ecológico');
const source=ecology.slice(start,stop);
class Vector2{
 constructor(x=0,y=0){this.x=x;this.y=y;}
 set(x,y){this.x=x;this.y=y;return this;}
}
class Vector4{
 constructor(x=0,y=0,z=0,w=0){this.set(x,y,z,w);}
 set(x,y,z,w){Object.assign(this,{x,y,z,w});return this;}
}
let player=null,wind=.35,heading=0,power=70,storm=false;
const geometry={
 boundingBox:{min:{y:0},max:{y:1}},
 computeBoundingBox(){}
};
const context={
 T:{Vector2,Vector4},
 material:()=>({}),meshLibrary:{grassShort1:geometry},
 api:{
  atmosphere:{
   getMetrics:()=>({wind}),
   getGrassWindHeading:()=>heading,
   getGrassWindPower:()=>power,
   getGrassStorm:()=>storm
  },
  getGrassPlayer:()=>player
 },
 clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),Math
};
vm.createContext(context);
vm.runInContext(source+';globalThis.result={grassVisual,grassAnimatedMaterial,animateGrassVisuals};',context);
const {grassVisual,grassAnimatedMaterial,animateGrassVisuals}=context.result;
const mat=grassAnimatedMaterial('grassShort1','grassShort');
const shader={
 uniforms:{},
 vertexShader:'void main(){\n#include <begin_vertex>\n#include <project_vertex>\n}'
};
mat.onBeforeCompile(shader);
for(const fragment of [
 'uniform float uArcWindTime;','uniform float uArcStorm;',
 'arcBlade*=arcBlade','arcRoot=instanceMatrix[3].xz',
 'arcMove=uArcWindDir*(uArcWindStrength*arcGust)',
 'vec2 away=normalize(d+across*.075)',
 'arcMove+=away*(.48*uArcPlayer.w*pressure)',
 'arcMove+=normalize(d+vec2(.015,.019))',
 'instanceMatrix[0].xz','instanceMatrix[2].xz',
 '#include <begin_vertex>','#include <project_vertex>'
])assert.ok(shader.vertexShader.includes(fragment),'Shader sem '+fragment);
assert.equal(shader.uniforms.uArcGrassBase.value,0);
assert.equal(shader.uniforms.uArcGrassInvHeight.value,1);
assert.equal(shader.uniforms.uArcPlayer,grassVisual.uniforms.uArcPlayer);
assert.equal(shader.uniforms.uArcWindTime,grassVisual.uniforms.uArcWindTime);
assert.equal(shader.uniforms.uArcStorm,grassVisual.uniforms.uArcStorm);
const u=grassVisual.uniforms;
power=0;wind=0;storm=false;
animateGrassVisuals(.1);
assert.equal(u.uArcWindStrength.value,0,'Vento desligado não agita a grama');
power=100;wind=.35;heading=Math.PI/2;storm=false;
animateGrassVisuals(.1);
const maxNormal=u.uArcWindStrength.value;
assert.ok(maxNormal>.37,'Vento a 100% deve produzir dobra claramente visível');
assert.ok(Math.abs(u.uArcWindDir.value.y-1)<1e-8);
storm=true;
animateGrassVisuals(.1);
const maxStorm=u.uArcWindStrength.value;
assert.ok(maxStorm>maxNormal+.20,'Temporal reforça rajadas');
assert.ok(maxStorm>=.62&&maxStorm<=.68,'Temporal forte deve respeitar limites do shader');
assert.equal(u.uArcStorm.value,1);
power=20;wind=.15;storm=true;
animateGrassVisuals(.1);
assert.ok(u.uArcWindStrength.value<maxStorm*.5,'Painel diminui a reação visual do temporal');
player={position:{x:0,z:0},heading:1.2,grassSpeed:1.65,grassOnGround:true};
animateGrassVisuals(.1);
assert.ok(u.uArcPlayer.value.w>=.95);
assert.equal(u.uArcPlayer.value.z,1.2);
for(let i=1;i<=12;i++){
 player.position.x=i*.13;
 animateGrassVisuals(.09);
}
const trail=[u.uArcTrail0.value,u.uArcTrail1.value];
assert.ok(trail.some(t=>t.w>.001),'Passos deslocam a grama atrás do personagem');
player.grassOnGround=false;
animateGrassVisuals(.1);
assert.equal(u.uArcPlayer.value.w,0,'Sem contato na ponte não afasta o gramado');
player=null;for(let i=0;i<22;i++)animateGrassVisuals(.1);
assert.equal(u.uArcPlayer.value.w,0);
assert.ok(trail.every(t=>t.w===0),'Grama retorna progressivamente após os passos');
assert.match(main,/getGrassPlayer:\(\)=>game\.active\?game:null/);
assert.match(main,/getGrassWindPower:\(\)=>windUserPower/);
assert.match(main,/getGrassStorm:\(\)=>stormActive\(\)\|\|climate==='storm'/);
assert.match(main,/game\.grassOnGround=!onBridge/);
assert.match(main,/game\.grassSpeed=walked\/Math\.max\(dt,\.001\)/);
assert.match(ecology,/materials\.set\(name,grassAnimatedMaterial\(name,kind\)\)/);
assert.match(ecology,/animateGrassVisuals\(dt\)/);
assert.match(ecology,/const step=mobileDevice\?\.140:\.125/);
assert.match(ecology,/const names=\['grassShort1','grassMixed1','grassTall1','grassMixed2'\]/);
console.log('OK: vento 0/100%, tempestade, orientação, pressão da grama, ponte e recuperação gradual.');
