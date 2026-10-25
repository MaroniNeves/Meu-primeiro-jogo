'use strict';
// V12.63: camera em terceira pessoa com raio estavel + zoom manual real.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const main=fs.readFileSync('agua-v1226.js','utf8');
const html=fs.readFileSync('index.html','utf8');
class V3{
 constructor(x=0,y=0,z=0){this.set(x,y,z);}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
 copy(v){return this.set(v.x,v.y,v.z);}
 length(){return Math.hypot(this.x,this.y,this.z);}
 distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}
 subVectors(a,b){return this.set(a.x-b.x,a.y-b.y,a.z-b.z);}
 addScaledVector(v,k){this.x+=v.x*k;this.y+=v.y*k;this.z+=v.z*k;return this;}
 lerp(v,a){this.x+=(v.x-this.x)*a;this.y+=(v.y-this.y)*a;this.z+=(v.z-this.z)*a;return this;}
}
const game={
 active:true,position:new V3(0,0,0),
 camHeading:Math.PI,camPitch:.35,camDistance:4.8,
 orbitPointer:null,orbitX:0,orbitY:0
};
const camera={position:new V3(0,3,-4.8),lookAt(){}};
const goal=new V3(),focus=new V3();
let occlusionCalls=0;
const elements={
 gameZoomIn:{handlers:{},addEventListener(t,fn){this.handlers[t]=fn;}},
 gameZoomOut:{handlers:{},addEventListener(t,fn){this.handlers[t]=fn;}},
 gameZoomLevel:{textContent:''}
};
const handlers={};
const stage={handlers,addEventListener(t,fn){this.handlers[t]=fn;},
 setPointerCapture(){},getBoundingClientRect(){return {x:0,y:0,width:800,height:600};}};
const ctx={
 Math,T:{Vector3:V3},game,camera,
 gameCameraFocus:focus,gameCameraGoal:goal,gameCameraActualDistance:0,
 terrainContact:()=>-2,
 updateGameCameraOcclusion(){occlusionCalls++;},
 $:id=>elements[id]||null,clamp:(v,lo,hi)=>Math.min(hi,Math.max(lo,v)),
 stage,pressedPointers:new Set(),paintWalkingStep:()=>false,
 tapAdd:()=>{},target:new V3(),radius:25,W:128,L:100,yaw:0,pitch:.5
};
vm.createContext(ctx);
const ca=main.indexOf('const gameCameraOffset=new T.Vector3();');
const cb=main.indexOf('// V12.62: se a copa invade a linha de visão',ca);
assert.ok(ca>0&&cb>ca,'Camera de distancia fixa deve existir');
vm.runInContext(main.slice(ca,cb)+';globalThis.applyCamera=applyGameCamera;',ctx);
function radius(){
 return Math.hypot(camera.position.x-focus.x,camera.position.y-focus.y,camera.position.z-focus.z);
}
for(let frame=0;frame<180;frame++){
 game.position.set(Math.sin(frame*.11)*3,0,Math.cos(frame*.04)*2);
 ctx.applyCamera();
 assert.ok(Math.abs(radius()-game.camDistance)<.00001,
  'Movimento de personagem ou arvores nao deve causar autozoom');
}
assert.equal(occlusionCalls,180);
game.camDistance=7.5;
for(let frame=0;frame<20;frame++)ctx.applyCamera();
assert.ok(Math.abs(radius()-7.5)<.00001,'Zoom escolhido pelo usuario deve ser preservado');

const ga=main.indexOf('function setGameZoom(distance){');
const gb=main.indexOf("stage.addEventListener('touchmove'",ga);
assert.ok(ga>0&&gb>ga,'Gestos de zoom e botoes devem estar registrados');
vm.runInContext(main.slice(ga,gb)+';globalThis.zoom=setGameZoom;',ctx);
assert.match(html,/id="gameZoomIn"/);
assert.match(html,/id="gameZoomOut"/);
assert.match(html,/id="gameZoomLevel"/);
elements.gameZoomIn.handlers.click();
assert.equal(game.camDistance,6.8,'Botao mais aproxima');
elements.gameZoomOut.handlers.click();
assert.equal(game.camDistance,7.5,'Botao menos afasta');
assert.equal(elements.gameZoomLevel.textContent,'7.5 m');
const e=(pointerId,clientX,clientY)=>({pointerId,clientX,clientY,preventDefault(){}});
handlers.pointerdown(e(1,100,100));
handlers.pointerdown(e(2,200,100));
const initialHeading=game.camHeading;
handlers.pointermove(e(2,300,100));
assert.ok(Math.abs(game.camDistance-3.75)<1e-9,'Abrir os dedos aproxima a camera');
assert.equal(game.camHeading,initialHeading,'Pinça nao gira camera');
handlers.pointermove(e(2,250,100));
assert.ok(game.camDistance>3.75,'Aproximar os dedos afasta camera');
handlers.pointerup(e(2,250,100));
const beforeRotate=game.camHeading;
handlers.pointermove(e(1,115,110));
assert.ok(game.camHeading!==beforeRotate,'Um dedo volta a girar a camera apos pinça');
handlers.pointerup(e(1,115,110));
let wheelPrevented=false;
handlers.wheel({deltaY:80,preventDefault(){wheelPrevented=true;}});
assert.ok(wheelPrevented,'Zoom da roda nao pode rolar a pagina');
ctx.zoom(0);assert.equal(game.camDistance,2.3);
ctx.zoom(100);assert.equal(game.camDistance,10);
console.log('OK V12.63: camera estavel em 180 quadros, zoom pinça, botoes, roda e rotacao sem conflitos.');
