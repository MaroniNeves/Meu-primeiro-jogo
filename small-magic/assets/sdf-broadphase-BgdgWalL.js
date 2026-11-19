import{i as e,n as t,r as n,t as r,u as i}from"./voxel-BcC6z-Mk.js";var a=()=>({optimizer:0,cacheSize:4,randomSamples:1,warmStart:!0,curvatureSampling:!0,skipConvexSamples:!0,epsilon:n(.1),alpha:n(.01),replacementThreshold:n(.01),tolerance:n(.01),maxIterations:50,stepSize:n(.1),margin:n(.02),allowedPenetration:n(.01)}),o=4096;function s(e){if(!e.surfaceTriangles?.length)return[];let t=new Map,n=e.surfaceTriangles;for(let e=0;e<n.length;e+=3)t.set(`${n[e]},${n[e+1]},${n[e+2]}`,[n[e],n[e+1],n[e+2]]);if(t.size>4096)throw Error(`meshVertexContacts supports at most ${o} unique surface vertices per field (got ${t.size}); decimate the source mesh`);return[...t.values()].sort((e,t)=>e[0]-t[0]||e[1]-t[1]||e[2]-t[2])}var c=(e=5)=>8+e*28;c();function l(e){if(!Number.isInteger(e)||e<2||e>20)throw Error(`SDF point capacity must be an integer 2–20`);return e}var u={box:0,sphere:1,capsule:2,cylinder:3,cone:4,torus:5,warp:6,"spike-plate":8,"spiky-wheel":9};function d(e,t){if(!e.every(Number.isFinite))throw Error(`${t} exceeds finite float32 range`)}function f(e,n=67108864,i=!1){if(!Number.isSafeInteger(n)||n<16)throw Error(`Invalid SDF atlas byte limit`);let a=[...new Set(e)],o=new Map,c=0,l=new Map(a.map(e=>[e,i?s(e):[]]));for(let e of a){if(!(e instanceof r)&&!(e instanceof t&&Object.hasOwn(u,e.spec.kind)))throw Error(`Unsupported GPU SDF: bake custom fields to voxels first`);if(o.set(e,c/4),c+=32+(e.seeds.length+l.get(e).length)*4+(e instanceof r?e.grid.length:0),!Number.isSafeInteger(c)||c*4>n||c>4294967295)throw Error(`SDF atlas exceeds byte/index limit`)}let f=new Uint32Array(Math.max(4,c)),p=new Float32Array(f.buffer);for(let e of a){let t=o.get(e)*4,n=t+32,i=n+(e instanceof r?e.grid.length:0);if(f.set([e instanceof r?7:u[e.spec.kind],+e.convex,i/4,e.seeds.length],t),p.set([...e.bounds.min,e instanceof r?e.cell:0],t+8),p.set([...e.bounds.max,0],t+12),p.set([...e.centerOfMass,0],t+16),e instanceof r)f.set([n/4,...e.dimensions],t+4),p.set(e.origin,t+28),p.set(e.grid,n);else{let n=e.spec;if(n.kind===`box`)p.set(n.halfExtents,t+20);else if(n.kind===`sphere`)p[t+20]=n.radius;else if(n.kind===`capsule`)p.set([n.radius,n.halfLength],t+20);else if(n.kind===`cone`||n.kind===`cylinder`)p.set([n.radius,n.halfHeight],t+20);else if(n.kind===`torus`)p.set([n.majorRadius,n.minorRadius],t+20);else if(n.kind===`spike-plate`){if(n.count>=2**24)throw Error(`GPU SDF spike count exceeds exact float32 range`);p.set([...n.halfExtents,n.count],t+20),p.set([n.spikeRadius,n.minHeight,n.maxHeight,0],t+24)}else if(n.kind===`spiky-wheel`){if(n.spikes>=2**24)throw Error(`GPU SDF spike count exceeds exact float32 range`);p.set([n.hubRadius,n.hubHalfWidth,n.spikeRadius,n.spikeHalfHeight],t+20),p[t+24]=n.spikes}else n.kind===`warp`&&(p.set([...n.halfExtents,n.k],t+20),f[t+24]=n.type)}e.seeds.forEach((e,t)=>p.set(e,i+4*t));let a=l.get(e);f[t+15]=a.length,a.forEach((t,n)=>p.set(t,i+4*(e.seeds.length+n))),d(p.subarray(t+8,t+24),`SDF header`),d(p.subarray(t+28,t+32),`SDF origin`),f[t]!==6&&d(p.subarray(t+24,t+28),`SDF secondary parameters`),d(p.subarray(n,i+(e.seeds.length+l.get(e).length)*4),`SDF grid/seeds`)}return{data:f,offsets:o}}function p(e,t){let n=new Uint32Array(Math.max(4,e.length*28)),r=new Float32Array(n.buffer);return e.forEach((e,i)=>{let a=i*28,o=t.offsets.get(e.field);if(o===void 0)throw Error(`Body field is absent from SDF atlas`);let s=Math.fround(e.scale);if(!Number.isFinite(s)||s<=0||Math.abs(Math.hypot(...e.orientation)-1)>1e-4)throw Error(`Invalid GPU SDF body transform`);let c=e.bounds;r.set([...e.position,e.scale,...e.orientation,...e.velocity,+e.isStatic,...e.angularVelocity,0,...c.min,0,...c.max,0,0,0,0,1],a),d(r.subarray(a,a+28),`SDF body`),n[a+15]=o}),n}function m(e,t,n){let r=new Uint32Array(Math.max(4,e.length*4)),i=new Set;return e.forEach((e,a)=>{if(![e.a,e.b].every(e=>Number.isSafeInteger(e)&&e>=0&&e<t)||e.a===e.b)throw Error(`Invalid SDF pair body IDs`);if(!Number.isSafeInteger(e.key)||e.key<0||e.key>=4294967295||i.has(e.key))throw Error(`SDF pair keys must be unique uint32 IDs`);if(e.previous!==void 0&&(!Number.isInteger(e.previous)||e.previous<0||e.previous>=n))throw Error(`Invalid previous SDF pair slot`);i.add(e.key),r.set([e.a,e.b,e.key,e.previous??4294967295],a*4)}),r}function h(e,t,n,r=a(),i=5){if(!Number.isInteger(e)||e<0||e>4294967295||!Number.isInteger(t)||t<0||t>4294967295||!Number.isFinite(n)||n<0)throw Error(`Invalid SDF dispatch parameters`);if(l(i),![0,1,2].includes(r.optimizer))throw Error(`Unknown SDF optimizer ${r.optimizer}`);if(r.optimizer===2&&!(Math.fround(r.stepSize)>0&&Number.isFinite(Math.fround(r.stepSize))))throw Error(`SDF gradient descent needs a finite positive stepSize`);if(!Number.isInteger(r.cacheSize)||r.cacheSize<0||r.cacheSize>i-1||!Number.isInteger(r.randomSamples)||r.randomSamples<0||r.cacheSize+r.randomSamples>i||!Number.isInteger(r.maxIterations)||r.maxIterations<1||r.maxIterations>512)throw Error(`This GPU SDF pass supports at most ${i-1} cached/${i} total samples and 1–512 iterations`);if(!(r.epsilon===0||Math.fround(r.epsilon)>0)||![r.tolerance].every(e=>Math.fround(e)>0&&Number.isFinite(Math.fround(e)))||![r.epsilon,r.alpha,r.margin,r.replacementThreshold].every(e=>e>=0&&Number.isFinite(Math.fround(e))))throw Error(`Invalid SDF collision distances`);let o=new Uint32Array(20),s=new Float32Array(o.buffer);return o.set([e,t,r.cacheSize,r.randomSamples]),s.set([n,r.epsilon,r.alpha,r.tolerance],4),s.set([r.margin,r.replacementThreshold,+(r.signedSeparation??!1),+(r.meshVertexContacts??!1)],8),o.set([r.maxIterations,+r.warmStart,+r.curvatureSampling,+r.skipConvexSamples],12),o[16]=r.optimizer,s[17]=r.optimizer===2?r.stepSize:0,o[18]=+(r.optimizer===2&&(r.sgdGradientStopOnly??!1)),d(s.subarray(4,12),`SDF parameters`),o}function g(e,t,n=5){let r=c(l(n));if(!Number.isSafeInteger(t)||t<0||e.byteLength<t*r*4)throw Error(`SDF result buffer too short`);let i=new Uint32Array(e),a=new Float32Array(e),o=[];for(let e=0;e<t;e++){let t=e*r,s=i[t+3];if(s>n)throw Error(`Invalid SDF result count`);let c=[];for(let e=0;e<s;e++){let n=t+8+e*28;d(a.subarray(n,n+16),`SDF output`),c.push({x:Array.from(a.slice(n,n+3)),depth:a[n+3],normal:Array.from(a.slice(n+4,n+7)),separation:a[n+7],anchorA:Array.from(a.slice(n+8,n+11)),anchorB:Array.from(a.slice(n+12,n+15)),rank:a[n+15],active:!!i[n+16],cached:!!i[n+17],id:i[n+18]})}o.push({a:i[t],b:i[t+1],key:i[t+2],queries:i[t+4],iterations:i[t+5],points:c})}return o}var _=(t=5)=>`
${i}
struct SdfBody { position: vec4f, rotation: vec4f, velocity: vec4f, omega: vec4f, lo: vec4f, hi: vec4f, anchorRotation: vec4f }
struct Point { x: vec4f, normal: vec4f, anchorA: vec4f, anchorB: vec4f, flags: vec4u, ellipsoidA: vec4f, ellipsoidB: vec4f }
struct Result { identity: vec4u, stats: vec4u, points: array<Point,${t}> }
// counts: bodies, pair capacity, cell table size, cache table size.
// offsets: next links, large head, pair counter, cache table. The next two words
// after the pair counter hold tested pairs and large-body count.
struct BroadParams { counts: vec4u, offsets: vec4u, distances: vec4f }
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<uniform> broad: BroadParams;
@group(0) @binding(2) var<storage,read> bodies: array<SdfBody>;
@group(0) @binding(3) var<storage,read_write> grid: array<atomic<u32>>;
@group(0) @binding(4) var<storage,read_write> pairs: array<vec4u>;
@group(0) @binding(5) var<storage,read> previous: array<Result>;
@group(0) @binding(6) var<storage,read> statics: array<u32>;
@group(0) @binding(7) var<storage,read> joints: array<Joint>;
@group(0) @binding(8) var<storage,read> filters: array<vec2u>;
@group(0) @binding(9) var<storage,read_write> counters: array<atomic<u32>>;
const EMPTY=0xffffffffu;
${e}
fn mixHash(value: u32) -> u32 {
  var x=value; x=(x^(x>>16u))*0x7feb352du; x=(x^(x>>15u))*0x846ca68bu; return x^(x>>16u);
}
fn pairHash(a:u32,b:u32) -> u32 { return mixHash(a^mixHash(b)); }
fn cell(i:u32) -> vec3i {
  let p=(bodies[i].lo.xyz*0.5+bodies[i].hi.xyz*0.5)/broad.distances.x;
  // Saturation preserves correctness (aliases are AABB-tested), avoids int overflow
  // in neighbour offsets, but remote saturated regions can lose spatial efficiency.
  return vec3i(clamp(floor(p),vec3f(-1e9),vec3f(1e9)));
}
fn bucket(c:vec3i) -> u32 { return mixHash((bitcast<u32>(c.x)*0x8da6b343u)^(bitcast<u32>(c.y)*0xd8163841u)^(bitcast<u32>(c.z)*0xcb1ab31fu))&(broad.counts.z-1u); }
fn large(i:u32) -> bool { return any(bodies[i].hi.xyz-bodies[i].lo.xyz+vec3f(broad.distances.y)>vec3f(broad.distances.x)); }
@compute @workgroup_size(64) fn clearGrid(@builtin(global_invocation_id) id:vec3u) {
  let i=id.x;
  if(i<arrayLength(&grid)) { atomicStore(&grid[i],EMPTY); }
  if(i<broad.counts.y) { pairs[i]=vec4u(EMPTY); }
  // These words are assigned only by their own invocation, never by a racing clear.
  if(i>=broad.offsets.z && i<=broad.offsets.z+2u) { atomicStore(&grid[i],0u); }
}
@compute @workgroup_size(64) fn buildGrid(@builtin(global_invocation_id) id:vec3u) {
  let i=id.x; if(i>=broad.counts.x) { return; }
  var head=bucket(cell(i));
  if(large(i)) { head=broad.offsets.y; atomicAdd(&grid[broad.offsets.z+2u],1u); }
  let old=atomicExchange(&grid[head],i); atomicStore(&grid[broad.offsets.x+i],old);
}
@compute @workgroup_size(64) fn cachePairs(@builtin(global_invocation_id) id:vec3u) {
  let i=id.x; if(i>=broad.counts.y) { return; }
  let p=previous[i].identity;
  if(p.x>=broad.counts.x || p.x<=p.y) { return; }
  var h=pairHash(p.x,p.y)&(broad.counts.w-1u);
  for(var probe=0u;probe<2u*broad.counts.w;probe++) {
    let result=atomicCompareExchangeWeak(&grid[broad.offsets.w+h],EMPTY,i);
    if(result.exchanged) { return; }
    if(result.old_value!=EMPTY) { h=(h+1u)&(broad.counts.w-1u); }
  }
  atomicOr(&counters[C_OVERFLOW],1u);
}
fn previousSlot(a:u32,b:u32) -> u32 {
  var h=pairHash(a,b)&(broad.counts.w-1u);
  for(var probe=0u;probe<broad.counts.w;probe++) {
    let i=atomicLoad(&grid[broad.offsets.w+h]); if(i==EMPTY) { return EMPTY; }
    if(all(previous[i].identity.xy==vec2u(a,b))) { return i; }
    h=(h+1u)&(broad.counts.w-1u);
  }
  return EMPTY;
}
fn candidate(i:u32,j:u32) {
  let a=max(i,j); let b=min(i,j); atomicAdd(&grid[broad.offsets.z+1u],1u);
  let ba=bodies[a]; let bb=bodies[b]; let fa=filters[a]; let fb=filters[b];
  if((ba.velocity.w!=0.0&&bb.velocity.w!=0.0) || (fa.x&fb.y)==0u || (fb.x&fa.y)==0u ||
    any(ba.lo.xyz>bb.hi.xyz+vec3f(broad.distances.y)) || any(bb.lo.xyz>ba.hi.xyz+vec3f(broad.distances.y)) || ignored(a,b)) { return; }
  let slot=atomicAdd(&grid[broad.offsets.z],1u);
  if(slot>=broad.counts.y) {
    atomicOr(&counters[C_OVERFLOW],1u); atomicAdd(&counters[C_PAIRS],1u); return;
  }
  // The hash is a sampling key; exact (a,b) is the identity, even on hash collision.
  pairs[slot]=vec4u(a,b,pairHash(a,b),previousSlot(a,b));
}
@compute @workgroup_size(64) fn findPairs(@builtin(global_invocation_id) id:vec3u) {
  let i=id.x; if(i>=broad.counts.x) { return; }
  let isLarge=large(i);
  if(!isLarge) {
    let c=cell(i);
    for(var z=-1;z<=1;z++) { for(var y=-1;y<=1;y++) { for(var x=-1;x<=1;x++) {
      let neighbor=c+vec3i(x,y,z); var j=atomicLoad(&grid[bucket(neighbor)]);
      while(j!=EMPTY) {
        if(i>j && all(cell(j)==neighbor)) { candidate(i,j); }
        j=atomicLoad(&grid[broad.offsets.x+j]);
      }
    } } }
  }
  var j=atomicLoad(&grid[broad.offsets.y]);
  while(j!=EMPTY) {
    if(!isLarge || i>j) { candidate(i,j); }
    j=atomicLoad(&grid[broad.offsets.x+j]);
  }
}
`;_();var v=e=>2**Math.ceil(Math.log2(Math.max(2,e)));function y(e,t,n){let r=t.length,i=Math.min(e.limits.maxBufferSize,e.limits.maxStorageBufferBindingSize),a=l(n.maxPointsPerPair??5),o=Math.min(Math.floor(i/(c(a)*4)),e.limits.maxComputeWorkgroupsPerDimension*64),s=n.maxPairs??Math.max(1,Math.min(r*(r-1)/2,Math.max(64,r*8),o)),u=t.map(e=>Math.hypot(...e.field.bounds.max.map((t,n)=>t-e.field.bounds.min[n]))*(e.scale??1)).sort((e,t)=>e-t),d=Math.fround(n.cellSize??u[Math.floor(r/2)]);if(!Number.isSafeInteger(s)||s<1||s>o)throw Error(`Invalid SDF broadphase pair capacity`);if(!(d>0)||!Number.isFinite(d))throw Error(`Invalid SDF broadphase cell size`);let f=v(r*2),p=v(s*2),m=f+r+4+p;if(m*4>i||Math.ceil(Math.max(m,s)/64)>e.limits.maxComputeWorkgroupsPerDimension)throw Error(`SDF spatial grid exceeds device limits`);return{maxPairs:s,maxPoints:a,cellSize:d,tableSize:f,cacheSize:p,words:m}}var b=class e{grid;uniform;layout;pipelines;device;size;bodyCount;disposed=!1;static async create(t,n,r){let i=t.createShaderModule({label:`sdf spatial broadphase`,code:_(r.maxPoints)}),a=(await i.getCompilationInfo()).messages.filter(e=>e.type===`error`);if(a.length)throw Error(a.map(e=>e.message).join(`
`));let o=t.createBindGroupLayout({entries:[`uniform`,`uniform`,`read-only-storage`,`storage`,`storage`,`read-only-storage`,`read-only-storage`,`read-only-storage`,`read-only-storage`,`storage`].map((e,t)=>({binding:t,visibility:GPUShaderStage.COMPUTE,buffer:{type:e}}))}),s=t.createPipelineLayout({bindGroupLayouts:[o]}),c=[];for(let e of[`clearGrid`,`buildGrid`,`cachePairs`,`findPairs`])c.push(await t.createComputePipelineAsync({layout:s,compute:{module:i,entryPoint:e}}));return new e(t,n,r,o,c)}constructor(e,t,n,r,i){this.device=e,this.bodyCount=t,this.size=n,this.layout=r,this.pipelines=i,this.grid=e.createBuffer({label:`sdf spatial grid/cache`,size:n.words*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});try{this.uniform=e.createBuffer({size:48,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}catch(e){throw this.grid.destroy(),e}}resized(t){let n=v(t*2),r=this.size.tableSize+this.bodyCount+4+n,i=Math.min(this.device.limits.maxBufferSize,this.device.limits.maxStorageBufferBindingSize);if(!Number.isSafeInteger(t)||t<this.size.maxPairs||t*c(this.size.maxPoints)*4>i||r*4>i||Math.ceil(Math.max(r,t)/64)>this.device.limits.maxComputeWorkgroupsPerDimension)throw Error(`SDF growth exceeds device limits`);return new e(this.device,this.bodyCount,{...this.size,maxPairs:t,cacheSize:n,words:r},this.layout,this.pipelines)}encode(e,t,n,r){if(this.disposed)throw Error(`SDF spatial broadphase disposed`);let i=this.size,a=this.bodyCount,o=new Uint32Array(12),s=new Float32Array(o.buffer);o.set([a,i.maxPairs,i.tableSize,i.cacheSize,i.tableSize,i.tableSize+a,i.tableSize+a+1,i.tableSize+a+4]),s.set([i.cellSize,r],8),this.device.queue.writeBuffer(this.uniform,0,o);let c=[t.params,this.uniform,n.storage.bodies,this.grid,n.storage.pairs,n.storage.current,t.statics,t.joints,t.filters,t.counters],l=this.device.createBindGroup({layout:this.layout,entries:c.map((e,t)=>({binding:t,resource:{buffer:e}}))});e.setBindGroup(0,l),[Math.max(i.words,i.maxPairs),a,i.maxPairs,a].forEach((t,n)=>{e.setPipeline(this.pipelines[n]),e.dispatchWorkgroups(Math.ceil(t/64))})}async readStats(){if(this.disposed)throw Error(`SDF spatial broadphase disposed`);let e=this.device.createBuffer({size:12,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let t=this.device.createCommandEncoder();t.copyBufferToBuffer(this.grid,(this.size.tableSize+this.bodyCount+1)*4,e,0,12),this.device.queue.submit([t.finish()]),await e.mapAsync(GPUMapMode.READ);let n=new Uint32Array(e.getMappedRange());return{pairs:n[0],testedPairs:n[1],largeBodies:n[2],capacity:this.size.maxPairs,cellSize:this.size.cellSize}}finally{e.destroy()}}destroy(){this.disposed||(this.disposed=!0,this.grid.destroy(),this.uniform.destroy())}};export{f as a,h as c,g as i,c as l,y as n,p as o,l as r,m as s,b as t,a as u};