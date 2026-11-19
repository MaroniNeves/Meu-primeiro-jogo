import"./voxel-BcC6z-Mk.js";var e=65535,t=`
@compute @workgroup_size(64)
fn nearest(@builtin(global_invocation_id) id: vec3u) {
  let b = id.x;
  if (b >= params.bodies || ignored(b)) { return; }
  let h = trace(b, rays[id.y]);
  if (h.t >= 0.0) { atomicMin(&best[2u * id.y], bitcast<u32>(h.t)); }
}

@compute @workgroup_size(64)
fn owner(@builtin(global_invocation_id) id: vec3u) {
  let b = id.x;
  if (b >= params.bodies || ignored(b)) { return; }
  let h = trace(b, rays[id.y]);
  if (h.t >= 0.0 && bitcast<u32>(h.t) == atomicLoad(&best[2u * id.y])) { atomicMin(&best[2u * id.y + 1u], b); }
}

@compute @workgroup_size(64)
fn finish(@builtin(global_invocation_id) id: vec3u) {
  let r = id.x;
  if (r >= params.rays) { return; }
  let b = atomicLoad(&best[2u * r + 1u]);
  if (b == NONE) {
    hits[2u * r] = vec4f(0.0, 0.0, 0.0, -1.0);
    return;
  }
  let h = trace(b, rays[r]);
  hits[2u * r] = vec4f(worldNormal(b, h.n), h.t);
  hits[2u * r + 1u] = vec4f(bitcast<f32>(b), 0.0, 0.0, 0.0);
}
`,n=`
struct Ray { o: vec4f, d: vec4f }   // o.w: the most distance, d: unit direction
struct Params { bodies: u32, rays: u32, ignored: u32, mask: u32, ignore: array<vec4u, 4> }
struct Hit { t: f32, n: vec3f }

@group(0) @binding(0) var<storage, read> bodies: array<vec4f>;
@group(0) @binding(1) var<storage, read> hulls: array<vec4u>;
@group(0) @binding(2) var<storage, read> rays: array<Ray>;
@group(0) @binding(3) var<storage, read_write> best: array<atomic<u32>>;   // per ray: distance bits, body
@group(0) @binding(4) var<storage, read_write> hits: array<vec4f>;         // per ray: normal + distance, body bits
@group(0) @binding(5) var<uniform> params: Params;
@group(0) @binding(6) var<storage, read> filters: array<vec2u>;          // per body: groups, collides with

const STRIDE = 10u;
const NONE = 0xffffffffu;
const MISS = Hit(-1.0, vec3f(0.0));

fn turn(q: vec4f, v: vec3f) -> vec3f {
  let t = 2.0 * cross(q.xyz, v);
  return v + q.w * t + cross(q.xyz, t);
}

fn ignored(b: u32) -> bool {
  if ((filters[b].x & params.mask) == 0u) { return true; }
  for (var i = 0u; i < params.ignored; i++) {
    if (params.ignore[i / 4u][i % 4u] == b) { return true; }
  }
  return false;
}

/** Ray r against body b: the distance to its surface (0 from inside) and the normal there, in the body's frame. */
fn trace(b: u32, r: Ray) -> Hit {
  let base = b * STRIDE;
  let q = bodies[base + 1u];
  let size = bodies[base + 4u].xyz;
  let shape = bodies[base + 9u].w;
  let inv = vec4f(-q.xyz, q.w);
  let o = turn(inv, r.o.xyz - bodies[base + 0u].xyz);
  let d = turn(inv, r.d.xyz);
  var t: f32;
  var n: vec3f;
  if (abs(shape - 1.0) < 0.5) {
    let radius = size.x * 0.5;
    let bh = dot(o, d);
    let c = dot(o, o) - radius * radius;
    let disc = bh * bh - c;
    if (disc < 0.0) { return MISS; }
    t = -bh - sqrt(disc);
    if (c <= 0.0) { t = 0.0; } else if (t < 0.0) { return MISS; }
    n = select(normalize(o + d * t), -d, c <= 0.0);
  } else {
    // A convex shape as planes: entering through the last plane crossed inwards, out at the first crossed outwards
    var tin = -3.0e38;
    var tout = 3.0e38;
    let isHull = shape > 3.0 - 0.5;
    var faces = 6u;
    var fs = 0u;
    if (isHull) {
      let head = hulls[u32(shape - 3.0 + 0.5)];
      fs = head.z;
      faces = head.w;
    }
    for (var k = 0u; k < faces; k++) {
      var plane: vec4f;
      if (isHull) { plane = bitcast<vec4f>(hulls[fs + 2u * k]); }
      else {
        // A box's faces: +x -x +y -y +z -z, half its size out
        let axis = k / 2u;
        var e = vec3f(0.0);
        e[axis] = select(-1.0, 1.0, k % 2u == 0u);
        plane = vec4f(e, size[axis] * 0.5);
      }
      let denom = dot(plane.xyz, d);
      let dist = plane.w - dot(plane.xyz, o);
      if (abs(denom) < 1.0e-12) {
        if (dist < 0.0) { return MISS; }
        continue;
      }
      let s = dist / denom;
      if (denom < 0.0) {
        if (s > tin) { tin = s; n = plane.xyz; }
      } else {
        tout = min(tout, s);
      }
      if (tin > tout) { return MISS; }
    }
    if (tout < 0.0) { return MISS; }
    t = tin;
    if (t <= 0.0) { t = 0.0; n = -d; }
  }
  if (t > r.o.w) { return MISS; }
  // (Never -0: its bits would sort as a huge distance)
  return Hit(select(t, 0.0, t <= 0.0), n);
}

fn worldNormal(b: u32, n: vec3f) -> vec3f {
  return normalize(turn(bodies[b * STRIDE + 1u], n));
}
${t}
`,r=class{device;pipelines;layout;constructor(e,t=n){this.device=e;let r=e.createShaderModule({label:`raycast`,code:t}),i=e=>({visibility:GPUShaderStage.COMPUTE,buffer:{type:e}});this.layout=e.createBindGroupLayout({label:`raycast`,entries:[i(`read-only-storage`),i(`read-only-storage`),i(`read-only-storage`),i(`storage`),i(`storage`),i(`uniform`),i(`read-only-storage`)].map((e,t)=>({...e,binding:t}))});let a=e.createPipelineLayout({bindGroupLayouts:[this.layout]}),o=t=>e.createComputePipeline({label:`raycast ${t}`,layout:a,compute:{module:r,entryPoint:t}});this.pipelines={nearest:o(`nearest`),owner:o(`owner`),finish:o(`finish`)}}async cast(t,n,r,i,a,o=[],s=4294967295){let c=a.length;if(!c)return[];if(o.length>16)throw Error(`raycast: at most 16 bodies to ignore`);if(c>65535)throw Error(`raycast: at most ${e} rays a call`);let l=this.device,u=new Float32Array(c*8);a.forEach((e,t)=>{let n=Math.hypot(e.direction[0],e.direction[1],e.direction[2])||1,r=[e.direction[0]/n,e.direction[1]/n,e.direction[2]/n];u.set([e.origin[0],e.origin[1],e.origin[2],e.maxDistance??3e38,r[0],r[1],r[2],0],t*8)});let d=new Uint32Array(20);d.set([i,c,o.length,s>>>0]),d.set(o,4);let f=new Uint32Array(2*c);for(let e=0;e<c;e++)f.set([2139095039,4294967295],2*e);let p=(e,t)=>{let n=l.createBuffer({size:Math.max(16,e.byteLength),usage:t|GPUBufferUsage.COPY_DST});return l.queue.writeBuffer(n,0,e),n},m=p(u,GPUBufferUsage.STORAGE),h=p(f,GPUBufferUsage.STORAGE),g=l.createBuffer({size:c*32,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),_=p(d,GPUBufferUsage.UNIFORM),v=l.createBuffer({size:c*32,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),y=l.createBindGroup({layout:this.layout,entries:[t,n,m,h,g,_,r].map((e,t)=>({binding:t,resource:{buffer:e}}))}),b=l.createCommandEncoder({label:`raycast`}),x=b.beginComputePass({label:`raycast`});x.setBindGroup(0,y);let S=Math.max(1,Math.ceil(i/64));for(let e of[`nearest`,`owner`])x.setPipeline(this.pipelines[e]),x.dispatchWorkgroups(S,c);x.setPipeline(this.pipelines.finish),x.dispatchWorkgroups(Math.ceil(c/64)),x.end(),b.copyBufferToBuffer(g,0,v,0,c*32),l.queue.submit([b.finish()]);let C;try{await v.mapAsync(GPUMapMode.READ),C=new Float32Array(v.getMappedRange().slice(0)),v.unmap()}finally{for(let e of[m,h,g,_,v])e.destroy()}let w=new Uint32Array(C.buffer);return Array.from({length:c},(e,t)=>{let n=C[t*8+3];return n<0?null:{index:w[t*8+4],distance:n,point:[u[t*8]+u[t*8+4]*n,u[t*8+1]+u[t*8+5]*n,u[t*8+2]+u[t*8+6]*n],normal:[C[t*8],C[t*8+1],C[t*8+2]]}})}};export{r as n,t};