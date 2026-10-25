'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const exists=p=>fs.existsSync(path.join(root,p));
const modules=[
 ['magias/index.html','100 Magias 3D Anime'],
 ['magias/espadas.html','Cortes de Espada 3D'],
 ['magias/rollshade.html','Rollshade'],
 ['magias/lightning.html','Raios'],
 ['magias/catalogo.html','bibliotecas externas']
];
for(const [page,title] of modules){
 assert.ok(exists(page),'Página não migrada: '+page);
 const html=fs.readFileSync(path.join(root,page),'utf8');
 assert.ok(html.includes(title),'Título original não preservado: '+page);
 const dir=path.dirname(page);
 const base=/<base\s+href="([^"]+)"/.exec(html);
 const assetDir=base?path.normalize(path.join(dir,base[1])):dir;
 for(const found of html.matchAll(/(?:src|href)="(\.\/(?:assets|models)\/[^"]+)"/g)){
  const local=path.join(assetDir,found[1]);
  assert.ok(exists(local),'Recurso local ausente: '+local);
 }
}
for(const p of [
 'magias/models/Idle.fbx','magias/models/diffuse.png',
 'magias/assets/index-B00Ds7Ug.js',
 'magias/rollshade-v2/assets/index-B6WZpQRo.js',
 'magias/lightning-vfx/assets/index-DfEPV-QC.js'
])assert.ok(exists(p),'Recurso da biblioteca ausente: '+p);
const assetCount=fs.readdirSync(path.join(root,'magias/assets')).length;
assert.ok(assetCount>=95,'Coleção de magias incompleta');
const main=fs.readFileSync(path.join(root,'index.html'),'utf8');
const lab=fs.readFileSync(path.join(root,'agua.html'),'utf8');
assert.equal(main,lab,'O jogo e laboratório devem ter menu idêntico');
for(const html of [main,lab]){
 assert.ok(html.includes('href="./magias/index.html"'),'Link de 100 magias ausente');
 assert.ok(html.includes('href="./magias/espadas.html"'),'Link de efeitos ausente');
}
assert.ok(fs.readFileSync(path.join(root,'magias/index.html'),'utf8').includes('href="../agua.html"'),'A biblioteca precisa voltar ao laboratório');
const script=fs.readFileSync(path.join(root,'agua-v1226.js'),'utf8');
const bridge=fs.readFileSync(path.join(root,'magias/originais-no-jogo.js'),'utf8');
assert.match(script,/const GAME_CHARACTER_GLB_URL=/,'Xbot original precisa estar na cena');
assert.doesNotMatch(script,/function loadLocalMage\(/,'Feiticeiro substituto não pode carregar');
assert.match(script,/loadOriginalSpells\(\)/,'Magias reais precisam ser carregadas no modo Jogar');
assert.match(script,/mageVfx\.cast\(slot,origin,direction,len\)/,'Magia deve usar classe real do catálogo');
for(const name of ['ArcaneVolleyAbility','DragonbreathAbility','GlacierAbility'])
 assert.ok(bridge.includes('import {'+name+'}'),'Classe real não importada: '+name);
assert.ok(!main.includes('vfx-jogo-v1265.js'),'HTML não pode carregar shaders improvisados');
assert.ok(!exists('magias/vfx-jogo-v1265.js'),'Remover magias improvisadas do repositório');
assert.ok(main.includes('id="gameDownloadHUD"')&&main.includes('Xbot.glb'),'Download do Xbot restaurado');
console.log('OK: cinco bibliotecas, magias originais ligadas, efeitos improvisados ausentes e Xbot restaurado.');
