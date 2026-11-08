// Monta esferas-poder.js a partir do repositório MaroniNeves/esferas-de-poder:
// copia os shaders e os efeitos (chamas, fumaça, brilhos, raios) sem alterar e
// junta a adaptação para Three.js (tools/esferas-adaptador.js).
// Uso: node tools/montar-esferas.cjs ../esferas-de-poder/index.html
'use strict';
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(process.argv[2]||path.join(__dirname,'../../esferas-de-poder/index.html'),'utf8').replace(/\r\n/g,'\n');
const between=(a,b)=>{const i=src.indexOf(a);const j=src.indexOf(b,i+a.length);if(i<0||j<0)throw Error('Trecho não encontrado: '+a);return src.slice(i,j);};
const shaders=between('const VS=`','const HVS=`');
const math=between('const sub=(a,b)=>','\n',).trim();
const nrmLine=src.slice(src.indexOf('const nrm=a=>'),src.indexOf('\n',src.indexOf('const nrm=a=>')));
const orbsTable=between('const SP=3.5;','const cam=');
const rnd=between('function rnd(a,b)','\n');
const bolts=between('function makeBolts(','/* lava:');
const lava=between('/* lava:','function resize(');
const adapter=fs.readFileSync(path.join(__dirname,'esferas-adaptador.js'),'utf8');
const out=`/* Esferas de Poder — nove esferas elementais em estilo anime.
   Shaders e efeitos copiados de github.com/MaroniNeves/esferas-de-poder
   (gerado por tools/montar-esferas.cjs; não editar à mão).
   Uso: EsferasDePoder.create(THREE,'fogo') -> {root, update(t,camera)}. */
(function(){
'use strict';
${shaders}
${math.startsWith('const sub')?math:''}
${math.includes('const nrm')?'':nrmLine}
${rnd}
${orbsTable}
${bolts}
${lava}
${adapter}
})();
`;
const dest=path.join(__dirname,'..','esferas-poder.js');
fs.writeFileSync(dest,out);
console.log('esferas-poder.js gerado:',(out.length/1024).toFixed(1),'KB');
