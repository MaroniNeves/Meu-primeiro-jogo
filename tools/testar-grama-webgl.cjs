// V12.61: testa a compilação real e deslocamento visível em WebGL.
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const root=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(root,'ecossistema-v1232.js'),'utf8');
const a=code.indexOf('const grassVisual={'),b=code.indexOf('function makeMesh(name,kind)',a);
if(a<0||b<=a)throw Error('Shader de grama não localizado');
const snippet=JSON.stringify(code.slice(a,b));
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'arcano-gpu-'));
const p=path.join(dir,'check.html');
const html=[
'<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>',
'<div id="result">START</div>',
'<script src="https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.min.js"></script>',
'<script>',
'window.onerror=(msg,src,line,col)=>{document.getElementById("result").textContent="ERROR: "+msg+" "+src+":"+line+":"+col};',
'(async()=>{try{',
'const T=window.THREE;if(!T)throw Error("Biblioteca THREE não carregou");',
'const geo=new T.BufferGeometry();',
'geo.setAttribute("position",new T.Float32BufferAttribute([-.10,0,0,.10,0,0,.10,1,0,-.10,0,0,.10,1,0,-.10,1,0],3));',
'geo.computeVertexNormals();geo.computeBoundingBox();',
'const meshLibrary={grassShort1:geo};',
'const material=()=>new T.MeshStandardMaterial({color:0xffffff,side:T.DoubleSide});',
'const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));',
'let wind=0,power=0,storm=false,heading=0,player=null;',
'const api={atmosphere:{getMetrics:()=>({wind}),getGrassWindPower:()=>power,getGrassWindHeading:()=>heading,getGrassStorm:()=>storm},getGrassPlayer:()=>player};',
'const source='+snippet+';',
'const helpers=new Function("T","meshLibrary","material","clamp","api",source+";return {grassVisual,grassAnimatedMaterial,animateGrassVisuals};");',
'const {grassVisual,grassAnimatedMaterial,animateGrassVisuals}=helpers(T,meshLibrary,material,clamp,api);',
'const canvas=document.createElement("canvas");const renderer=new T.WebGLRenderer({canvas,antialias:false,alpha:false,preserveDrawingBuffer:true});',
'renderer.setSize(256,256);renderer.setClearColor(0x000000,1);',
'const scene=new T.Scene();scene.add(new T.AmbientLight(0xffffff,2));',
'const camera=new T.OrthographicCamera(-1.4,1.4,1.4,-1.4,.1,10);camera.position.set(0,1,4);camera.lookAt(0,.55,0);',
'const inst=new T.InstancedMesh(geo,grassAnimatedMaterial("grassShort1","grassShort"),1);',
'inst.setMatrixAt(0,new T.Matrix4().identity());inst.instanceMatrix.needsUpdate=true;inst.frustumCulled=false;scene.add(inst);',
'const target=new T.WebGLRenderTarget(256,256);const bytes=new Uint8Array(256*256*4);',
'function frame(){renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.readRenderTargetPixels(target,0,0,256,256,bytes);',
'let n=0,sx=0,sy=0;for(let i=0;i<bytes.length;i+=4){if(bytes[i]>45||bytes[i+1]>45){n++;sx+=(i/4)%256;sy+=Math.floor((i/4)/256);}}',
'return {n,cx:n?sx/n:0,cy:n?sy/n:0};}',
'const still=frame();power=100;wind=2.4;storm=true;heading=0;animateGrassVisuals(.5);const blow=frame();',
'power=0;wind=0;storm=false;player={position:{x:0,z:0},grassSpeed:3.2,grassOnGround:true,heading:0};animateGrassVisuals(.5);const contact=frame();',
'const diagnostics=renderer.info.programs?.map(p=>p.diagnostics||null)||[];',
'const ok=still.n>300&&blow.n>300&&Math.abs(still.cx-blow.cx)>6&&contact.n>300&&Math.abs(still.cx-contact.cx)>2;',
'document.getElementById("result").textContent=JSON.stringify({ok,still,blow,contact,diagnostics});renderer.dispose();',
'}catch(e){document.getElementById("result").textContent="ERROR: "+(e.stack||e.message)}})();',
'</script></body></html>'
].join('\n');
fs.writeFileSync(p,html);
const chrome=['google-chrome','chromium','chromium-browser'].find(s=>cp.spawnSync('which',[s],{encoding:'utf8'}).status===0);
if(!chrome)throw Error('Chrome não instalado no runner');
const res=cp.spawnSync(chrome,['--headless','--no-sandbox','--disable-gpu','--enable-unsafe-swiftshader','--allow-file-access-from-files','--virtual-time-budget=15000','--disable-dev-shm-usage','--dump-dom','file://'+p],{encoding:'utf8',timeout:60000,maxBuffer:2000000});
const match=(res.stdout||'').match(/<div id="result">([\s\S]*?)<\/div>/);
console.log('Chrome:',chrome,'status:',res.status,'result:',match?.[1]||'SEM RESULTADO');
if(!match||!match[1].includes('"ok":true')){console.error((res.stderr||'').slice(-1600));process.exit(1)}
