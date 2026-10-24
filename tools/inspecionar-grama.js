// Inspeciona a orientação/altura de malhas de grama compactadas.
const fs=require('node:fs'),vm=require('node:vm'),zlib=require('node:zlib');
const root=require('node:path').resolve(__dirname,'..');
const src=fs.readFileSync(root+'/arcano-assets-v1232.js','utf8');
const context={window:{}};vm.runInNewContext(src,context);
const packed=context.window.ARCANO_ASSETS_V1232.compressed;
const meshes=JSON.parse(zlib.inflateSync(Buffer.from(packed,'base64')).toString('utf8'));
for(const [name,mesh] of Object.entries(meshes)){
 if(!/grass/i.test(name))continue;
 const axis=[0,1,2].map(i=>{
  let min=Infinity,max=-Infinity,mean=0;
  for(let j=i;j<mesh.v.length;j+=3){const v=mesh.v[j];min=Math.min(min,v);max=Math.max(max,v);mean+=v;}
  return {min,max,size:max-min,mean:mean/(mesh.v.length/3)};
 });
 console.log(JSON.stringify({name,vertices:mesh.v.length/3,axes:axis,indexCount:mesh.i.length}));
}
