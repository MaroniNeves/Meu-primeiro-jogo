// Navegador real: abre HTML e scripts completos (somente reduz a contagem
// de tufos NA COPIA TEMPORARIA para testar a integração em CI).
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'arcano-integracao-'));
for(const file of ['index.html','agua.html','agua-v1226.js','arcano-assets-v1232.js','nature-imported-v1239.js']){
 fs.copyFileSync(path.join(root,file),path.join(dir,file));
}
fs.symlinkSync(path.join(root,'assets'),path.join(dir,'assets'),'dir');
const eco=fs.readFileSync(path.join(root,'ecossistema-v1232.js'),'utf8');
const budget='const grassBudgets=mobileDevice?{high:1900000,balanced:1900000,low:800000}:{high:2400000,balanced:2400000,low:1000000};';
if(!eco.includes(budget))throw Error('Orçamento de grama mudou; verificar teste');
fs.writeFileSync(path.join(dir,'ecossistema-v1232.js'),eco.replace(budget,'const grassBudgets={high:12000,balanced:12000,low:12000};'));
let server,browser;
(async()=>{
 try{
  server=cp.spawn('python3',['-m','http.server','8897','--bind','127.0.0.1','--directory',dir],{stdio:'ignore'});
  await new Promise(r=>setTimeout(r,900));
  browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
   args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  const page=await browser.newPage({viewport:{width:1000,height:740}});
  const issues=[];
  page.on('pageerror',e=>issues.push(e.message));
  page.on('console',e=>{if(e.type()==='error')issues.push(e.text().slice(0,500));});
  await page.goto('http://127.0.0.1:8897/index.html',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.arcanoEcoV1232?.ready?.()&&
   window.arcanoEcoV1232.getGrassMotionState?.().chunks>0,
   null,{timeout:100000});
  const before=await page.evaluate(()=>window.arcanoEcoV1232.getGrassMotionState());
  await page.evaluate(()=>{
   const slider=document.getElementById('windIntensity');
   slider.value='100';slider.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.waitForTimeout(1100);
  const windy=await page.evaluate(()=>window.arcanoEcoV1232.getGrassMotionState());
  await page.evaluate(()=>document.getElementById('playEntry').click());
  await page.waitForFunction(()=>window.arcanoWaterV1226.getGrassPlayer(),null,{timeout:12000});
  await page.evaluate(()=>{
   const player=window.arcanoWaterV1226.getGrassPlayer();
   player.keys.add('w');
  });
  await page.waitForTimeout(1400);
  const active=await page.evaluate(()=>({
   grass:window.arcanoEcoV1232.getGrassMotionState(),
   player:window.arcanoWaterV1226.getGrassPlayer()&&{
    position:window.arcanoWaterV1226.getGrassPlayer().position.toArray(),
    speed:window.arcanoWaterV1226.getGrassPlayer().grassSpeed
   },
   meshes:(()=>{
    let n=0,animated=0;
    window.arcanoWaterV1226.scene.traverse(o=>{
     if(o.isInstancedMesh&&o.name.startsWith('Tapete de grama Quaternius')){
      n++;
      if(o.material?.onBeforeCompile) animated++;
     }
    });
    return {n,animated};
   })(),
   renderPrograms:window.arcanoWaterV1226.renderer.info.programs?.length
  }));
  const ok=before.chunks>0&&before.tufts>0&&windy.wind>.37&&
   windy.time>before.time+.25&&active.grass.contact>.35&&
   active.player?.speed>.02&&active.meshes.n>0&&
   active.meshes.animated===active.meshes.n;
  console.log(JSON.stringify({ok,before,windy,active,issues:issues.slice(0,12)}));
  if(!ok)process.exitCode=1;
 }catch(e){console.error('INTEGRATION FAIL',e.stack||e);process.exitCode=1;
 }finally{
  if(browser)await browser.close();
  if(server)server.kill('SIGTERM');
 }
})();
