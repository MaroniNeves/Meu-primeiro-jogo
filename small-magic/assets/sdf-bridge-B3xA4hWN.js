import{a as e,c as t,i as n,l as r,n as i,o as a,r as o,s,t as c,u as l}from"./sdf-broadphase-BgdgWalL.js";import{i as u,p as d,u as f}from"./voxel-BcC6z-Mk.js";import{n as p,t as m}from"./raycast-upVBO-W-.js";var h=(e=5)=>`
struct Point { x: vec4f, normal: vec4f, anchorA: vec4f, anchorB: vec4f, flags: vec4u, ellipsoidA: vec4f, ellipsoidB: vec4f }
struct Result { identity: vec4u, stats: vec4u, points: array<Point,${e}> }
@group(0) @binding(0) var<storage,read> source: array<Result>;
@group(0) @binding(1) var<storage,read_write> destination: array<Result>;
@group(0) @binding(2) var<storage,read> retained: array<u32>;
@compute @workgroup_size(64) fn copyHistory(@builtin(global_invocation_id) gid:vec3u) {
  let i=gid.x; if(i>=arrayLength(&destination)) { return; }
  destination[i].identity=vec4u(0xffffffffu,0xffffffffu,0xffffffffu,0u);
  if(i>=arrayLength(&source)) { return; }
  let p=source[i].identity;
  if(p.x>=arrayLength(&retained)||p.y>=arrayLength(&retained)) { return; }
  if(retained[p.x]!=0u&&retained[p.y]!=0u) { destination[i]=source[i]; }
}
`;h();var g=(e=5,t=!1)=>`
fn meshPlaneContacts(pair: vec4u) -> bool {
  if(params.distances.w==0.0) { return false; }
  let fixedA=bodyA.velocity.w!=0.0 && atlas[bodyHeader(bodyA)].x==0u;
  let fixedB=bodyB.velocity.w!=0.0 && atlas[bodyHeader(bodyB)].x==0u;
  if(!fixedA && !fixedB) { return false; }
  var mesh=bodyA; var plane=bodyB;
  if(fixedA) { mesh=bodyB; plane=bodyA; }
  let h=bodyHeader(mesh); let header=atlas[h]; let count=atlas[h+3u].w;
  if(mesh.velocity.w!=0.0 || count==0u) { return false; }
  let half=bitcast<vec4f>(atlas[bodyHeader(plane)+5u]).xyz;
  // Restrict the plane shortcut to a top face covering the entire moving AABB.
  // Edge/side/underside contacts must continue through the general SDF search.
  for(var i=0u;i<8u;i++) {
    let corner=vec3f(select(mesh.lo.x,mesh.hi.x,(i&1u)!=0u),select(mesh.lo.y,mesh.hi.y,(i&2u)!=0u),select(mesh.lo.z,mesh.hi.z,(i&4u)!=0u));
    let p=localPoint(plane,corner);
    if(abs(p.x)>=half.x || abs(p.z)>=half.z || p.y<=-half.y) { return false; }
  }
  let up=rot(plane.rotation,vec3f(0,1,0));
  let normal=select(-up,up,fixedA);
  var lowest=1e30; var best=0u;
  for(var i=0u;i<count;i++) {
    let p=worldPoint(mesh,bitcast<vec4f>(atlas[header.z+header.w+i]).xyz);
    let separation=(localPoint(plane,p).y-half.y)*plane.position.w;
    if(separation<lowest) { lowest=separation; best=i; }
  }
  work.stats.x+=count;
  // Supplemental safeguard only: preserve ordinary contacts and their ranking.
  if(lowest>=min(params.distances.x,0.5*params.values.w)) { return false; }
  let p=worldPoint(mesh,bitcast<vec4f>(atlas[header.z+header.w+best]).xyz);
  let separation=lowest; let projected=p-up*separation;
  var a=p; var b=projected; if(fixedA) { a=projected; b=p; }
  let id=0x40000000u+best;
  var cached=0u;
  if(params.flags.y!=0u && pair.w!=0xffffffffu && pair.w<arrayLength(&previous)) {
    // Read individual history entries; avoid a per-invocation copy of the entire contact array.
    if(all(previous[pair.w].identity.xyz==pair.xyz)) {
      for(var j=0u;j<previous[pair.w].identity.w;j++) { if(previous[pair.w].points[j].flags.z==id) { cached=1u; } }
    }
  }
  let slot=min(work.identity.w,${e-1}u);
  work.points[slot]=Point(vec4f(p,min(0.0,separation)),vec4f(normal,separation),
    vec4f(rot(bodyA.anchorRotation,invrot(bodyA.rotation,a-bodyA.position.xyz)),0),
    vec4f(rot(bodyB.anchorRotation,invrot(bodyB.rotation,b-bodyB.position.xyz)),0),vec4u(1,cached,id,0),vec4f(1,0,0,1),vec4f(0,1,0,0));
  work.identity.w=slot+1u;
  return true;
}
/** Deepest source vertex of 'mesh' (inside the pair volume) in 'other's field. */
fn meshVertexScan(mesh: Body, other: Body, side: u32, best: ptr<function,vec4f>, bestId: ptr<function,u32>) {
  let h=bodyHeader(mesh); let header=atlas[h]; let count=min(atlas[h+3u].w,0x08000000u);
  for(var i=0u;i<count;i++) {
    // Re-evaluate the selected vertex in the original scalar arithmetic context.
    // Reusing a workgroup-computed point/phi changed normals by a few ULPs on Metal.
    ${t?`if((0x40000000u|(side<<27u)|i)!=meshWitnesses[witnessSlot].info.x) { continue; }`:``}
    let p=worldPoint(mesh,bitcast<vec4f>(atlas[header.z+header.w+i]).xyz);
    if(!inside(p)) { continue; }
    let s=worldField(other,p); ${t?``:`work.stats.x++;`}
    // A vanishing gradient gives no usable normal; leave that vertex to Algorithm 1.
    if(s.phi<(*best).w && dot(s.gradient,s.gradient)>=0.25) { *best=vec4f(p,s.phi); *bestId=0x40000000u|(side<<27u)|i; }
  }
}
/** Mesh-to-mesh analogue of the plane support: one exact vertex witness per pair. */
fn meshMeshContacts(pair: vec4u) -> bool {
  if(params.distances.w==0.0 || bodyA.velocity.w!=0.0 || bodyB.velocity.w!=0.0) { return false; }
  var best=vec4f(0,0,0,1e30); var id=0u;
  ${t?`work.stats.x+=meshWitnesses[witnessSlot].info.y;`:``}
  meshVertexScan(bodyA,bodyB,0u,&best,&id);meshVertexScan(bodyB,bodyA,1u,&best,&id);
  if(id==0u || best.w>=min(params.distances.x,0.5*params.values.w)) { return false; }
  let p=best.xyz; let separation=best.w; let fromB=((id>>27u)&1u)!=0u;
  var a=p; var b=p; var normal: vec3f;
  // Point normals follow addPoint: na=unit(gradA), nb=-unit(gradB).
  if(fromB) { let n=unit(worldField(bodyA,p).gradient); normal=n; a=p-n*separation; }
  else { let n=unit(worldField(bodyB,p).gradient); normal=-n; b=p-n*separation; }
  var cached=0u;
  if(params.flags.y!=0u && pair.w!=0xffffffffu && pair.w<arrayLength(&previous)) {
    // Read individual history entries; avoid a per-invocation copy of the entire contact array.
    if(all(previous[pair.w].identity.xyz==pair.xyz)) {
      for(var j=0u;j<previous[pair.w].identity.w;j++) { if(previous[pair.w].points[j].flags.z==id) { cached=1u; } }
    }
  }
  let slot=min(work.identity.w,${e-1}u);
  work.points[slot]=Point(vec4f(p,min(0.0,separation)),vec4f(normal,separation),
    vec4f(rot(bodyA.anchorRotation,invrot(bodyA.rotation,a-bodyA.position.xyz)),0),
    vec4f(rot(bodyB.anchorRotation,invrot(bodyB.rotation,b-bodyB.position.xyz)),0),vec4u(1,cached,id,0),vec4f(1,0,0,1),vec4f(0,1,0,0));
  work.identity.w=slot+1u;
  return true;
}
`;g();var _=e=>`
var<workgroup> witnessBest: array<vec4f,64>;
var<workgroup> witnessId: array<u32,64>;
var<workgroup> witnessQueries: array<u32,64>;
@compute @workgroup_size(64)
fn supplementContacts(@builtin(workgroup_id) group: vec3u,@builtin(local_invocation_index) lane: u32) {
  let slot=group.x+group.y*${e}u;
  var pair=vec4u(0xffffffffu);var eligible=false;
  if(slot<params.counts.x && params.distances.w!=0.0) {
    pair=pairs[slot];
    if(pair.x!=0xffffffffu) {
      bodyA=bodies[pair.x];bodyB=bodies[pair.y];
      let margin=vec3f(0.5*params.distances.x);
      lo=max(bodyA.lo.xyz-margin,bodyB.lo.xyz-margin);hi=min(bodyA.hi.xyz+margin,bodyB.hi.xyz+margin);
      eligible=!any(lo>hi) && bodyA.velocity.w==0.0 && bodyB.velocity.w==0.0;
    }
  }
  var best=vec4f(0,0,0,1e30);var id=0u;var queries=0u;
  if(eligible) {
    for(var side=0u;side<2u;side++) {
      var mesh=bodyA;var other=bodyB;if(side==1u) { mesh=bodyB;other=bodyA; }
      let h=bodyHeader(mesh);let header=atlas[h];let count=min(atlas[h+3u].w,0x08000000u);
      for(var i=lane;i<count;i+=64u) {
        let p=worldPoint(mesh,bitcast<vec4f>(atlas[header.z+header.w+i]).xyz);
        if(!inside(p)) { continue; }
        let s=worldField(other,p);queries++;
        if(s.phi<best.w && dot(s.gradient,s.gradient)>=0.25) { best=vec4f(p,s.phi);id=0x40000000u|(side<<27u)|i; }
      }
    }
  }
  witnessBest[lane]=best;witnessId[lane]=id;witnessQueries[lane]=queries;
  workgroupBarrier();
  for(var stride=32u;stride>0u;stride/=2u) {
    if(lane<stride) {
      let other=witnessBest[lane+stride];let otherId=witnessId[lane+stride];
      if(other.w<witnessBest[lane].w || (other.w==witnessBest[lane].w && otherId<witnessId[lane])) { witnessBest[lane]=other;witnessId[lane]=otherId; }
      witnessQueries[lane]+=witnessQueries[lane+stride];
    }
    workgroupBarrier();
  }
  if(lane==0u && slot<params.counts.x) {
    meshWitnesses[slot]=MeshWitness(witnessBest[0],vec4u(witnessId[0],witnessQueries[0],0,0));
  }
}
`,v=`
struct Sample { phi: f32, gradient: vec3f }
fn rot(q: vec4f, v: vec3f) -> vec3f { let t = 2.0 * cross(q.xyz, v); return v + q.w * t + cross(q.xyz, t); }
fn invrot(q: vec4f, v: vec3f) -> vec3f { return rot(vec4f(-q.xyz, q.w), v); }
fn unit(v: vec3f) -> vec3f { let l = length(v); if (l > 1e-12) { return v / l; } return vec3f(0,1,0); }
fn signnz(x: f32) -> f32 { return select(1.0, -1.0, x < 0.0); }
fn radial(p: vec3f, r: f32) -> vec3f { if (r > 1e-9) { return vec3f(p.x / r, 0, p.z / r); } return vec3f(1,0,0); }
fn boxField(p: vec3f, h: vec3f) -> Sample {
  let q = abs(p) - h; let outside = max(q, vec3f(0)); let d = length(outside); var g = vec3f(0);
  if (d > 0.0) { g = outside / d * vec3f(signnz(p.x), signnz(p.y), signnz(p.z)); }
  else { var axis = 2u; if (q.x > q.y) { if (q.x > q.z) { axis = 0u; } } else if (q.y > q.z) { axis = 1u; } g[axis] = signnz(p[axis]); }
  return Sample(d + min(max(q.x, max(q.y, q.z)), 0.0), g);
}
fn sphereField(p: vec3f, r: f32) -> Sample { let d = length(p); var g = vec3f(0,1,0); if (d > 1e-9) { g = p / d; } return Sample(d-r,g); }
fn cylinderField(p: vec3f, r: f32, h: f32) -> Sample {
  let radialLength = length(p.xz); let d = vec2f(radialLength-r, abs(p.y)-h); let outside = max(d,vec2f(0)); let l = length(outside); let e = radial(p,radialLength);
  var g = vec3f(0,signnz(p.y),0); if (d.x > d.y) { g = e; }
  if (l > 0.0) { g = e * (outside.x/l) + vec3f(0,signnz(p.y)*outside.y/l,0); }
  return Sample(l + min(max(d.x,d.y),0.0),g);
}
fn coneField(p: vec3f, radius: f32, h: f32) -> Sample {
  let qx = length(p.xz); let qy = p.y;
  let ca = vec2f(qx-min(qx,select(0.0,radius,qy<0.0)),abs(qy)-h); let k = vec2f(-radius,2.0*h);
  let t = clamp((qx*radius+(h-qy)*k.y)/dot(k,k),0.0,1.0); let cb = vec2f(qx,qy-h)+k*t;
  let s = select(1.0,-1.0,cb.x<0.0 && ca.y<0.0); let da=dot(ca,ca); let db=dot(cb,cb);
  var g=cb; if (da<db) { g=vec2f(ca.x,ca.y*signnz(qy)); }
  let l=length(g); if(l>1e-9) { g *= s/l; } else if(da<db) { g=vec2f(0,signnz(qy)); } else { g=normalize(vec2f(k.y,radius)); }
  return Sample(s*sqrt(min(da,db)),radial(p,qx)*g.x+vec3f(0,g.y,0));
}
fn torusField(p: vec3f, major: f32, minor: f32) -> Sample {
  let r=length(p.xz); let q=vec2f(r-major,p.y); let l=length(q); let e=radial(p,r); var g=e;
  if(l>1e-9) { g=e*(q.x/l)+vec3f(0,q.y/l,0); } return Sample(l-minor,g);
}
fn warpField(p: vec3f, h: vec3f, k: f32, kind: u32) -> Sample {
  if(kind==2u) { let s=sin(p*7.0); let c=cos(p*7.0); let b=boxField(p,h); return Sample(b.phi+k*s.x*s.y*s.z,b.gradient+7.0*k*vec3f(c.x*s.y*s.z,s.x*c.y*s.z,s.x*s.y*c.z)); }
  let angle=k*select(p.y,p.x,kind==0u); let c=cos(angle); let s=sin(angle); var q=vec3f(c*p.x-s*p.z,s*p.x+c*p.z,p.y);
  if(kind==0u) { q=vec3f(c*p.x-s*p.y,s*p.x+c*p.y,p.z); }
  let b=boxField(q,h); let g=b.gradient;
  if(kind==0u) { return Sample(b.phi,vec3f(dot(vec3f(c-k*q.y,s+k*q.x,0),g),dot(vec3f(-s,c,0),g),g.z)); }
  return Sample(b.phi,vec3f(dot(vec3f(c,s,0),g),dot(vec3f(-k*q.y,k*q.x,1),g),dot(vec3f(-s,c,0),g)));
}
fn shapeHash01(value: u32) -> f32 {
  var x=value; x=(x^(x>>16u))*0x7feb352du; x=(x^(x>>15u))*0x846ca68bu; x=x^(x>>16u); return f32(x&0xffffffu)/16777216.0;
}
fn spikePlateField(p: vec3f, primary: vec4f, secondary: vec4f) -> Sample {
  let h=primary.xyz; let count=i32(primary.w); let radius=secondary.x; let pitch=h*(2.0/primary.w);
  let ci=clamp(i32(floor((p.x+h.x)/pitch.x)),0,count-1); let cj=clamp(i32(floor((p.z+h.z)/pitch.z)),0,count-1);
  var result=boxField(p,h);
  for(var j=max(cj-1,0);j<=min(cj+1,count-1);j++) { for(var i=max(ci-1,0);i<=min(ci+1,count-1);i++) {
    let height=secondary.y+(secondary.z-secondary.y)*shapeHash01(17u*(u32(i)+u32(j)*u32(count))+11u);
    let center=vec3f(-h.x+(f32(i)+0.5)*pitch.x,h.y+0.5*height-0.5*radius,-h.z+(f32(j)+0.5)*pitch.z);
    let candidate=coneField(p-center,radius*(height+radius)/height,0.5*(height+radius));
    if(candidate.phi<result.phi) { result=candidate; }
  } }
  return result;
}
fn spikyWheelField(p: vec3f, primary: vec4f, spikes: f32) -> Sample {
  let radius=primary.x; let halfWidth=primary.y; let spikeRadius=primary.z; let spikeHeight=primary.w;
  var result=cylinderField(p,radius,halfWidth); let step=(2.0*3.1415927410125732)/spikes; let ring=halfWidth-spikeRadius;
  let nearest=i32(floor(atan2(p.z,p.x)/step+0.5));
  for(var k=nearest-1;k<=nearest+1;k++) {
    let a=f32(k)*step; let side=vec3f(-sin(a),0,cos(a)); let dir=vec3f(cos(a),0,sin(a));
    for(var j=0u;j<2u;j++) {
      let y=select(-ring,ring,j==1u); let r=p-dir*(radius+spikeHeight)-vec3f(0,y,0);
      let candidate=coneField(vec3f(dot(r,side),dot(r,dir),r.y),spikeRadius,spikeHeight);
      if(candidate.phi<result.phi) { result=Sample(candidate.phi,side*candidate.gradient.x+dir*candidate.gradient.y+vec3f(0,candidate.gradient.z,0)); }
    }
  }
  return result;
}
fn localField(h: u32, p: vec3f) -> Sample {
  let kind=atlas[h].x; let param=bitcast<vec4f>(atlas[h+5u]);
  switch(kind) {
    case 0u: { return boxField(p,param.xyz); }
    case 1u: { return sphereField(p,param.x); }
    case 2u: { return sphereField(vec3f(p.x,p.y-clamp(p.y,-param.y,param.y),p.z),param.x); }
    case 3u: { return cylinderField(p,param.x,param.y); }
    case 4u: { return coneField(p,param.x,param.y); }
    case 5u: { return torusField(p,param.x,param.y); }
    case 6u: { return warpField(p,param.xyz,param.w,atlas[h+6u].x); }
    case 8u: { return spikePlateField(p,param,bitcast<vec4f>(atlas[h+6u])); }
    case 9u: { return spikyWheelField(p,param,bitcast<vec4f>(atlas[h+6u]).x); }
    default: {
      let grid=atlas[h+1u]; let dims=grid.yzw; let origin=bitcast<vec4f>(atlas[h+7u]).xyz; let cell=bitcast<vec4f>(atlas[h+2u]).w;
      let hi=origin+vec3f(dims-vec3u(1u))*cell; let q=clamp(p,origin,hi); let coord=(q-origin)/cell;
      let base=min(vec3u(coord),dims-vec3u(2u)); let t=coord-vec3f(base); var value=vec4f(0);
      for(var i=0u;i<8u;i++) {
        let offset=vec3u(i&1u,(i>>1u)&1u,(i>>2u)&1u); let v=base+offset;
        let w=select(vec3f(1)-t,t,offset!=vec3u(0));
        value += bitcast<vec4f>(atlas[grid.x+v.x+dims.x*(v.y+dims.y*v.z)])*(w.x*w.y*w.z);
      }
      let outside=p-q; let d=length(outside); var g=value.yzw; if(d>0.0) { g=unit(g+outside/d); }
      return Sample(value.x+d,g);
    }
  }
}
fn bodyHeader(body: Body) -> u32 { return bitcast<u32>(body.omega.w); }
fn localPoint(body: Body, p: vec3f) -> vec3f { return invrot(body.rotation,p-body.position.xyz)/body.position.w+bitcast<vec4f>(atlas[bodyHeader(body)+4u]).xyz; }
fn worldPoint(body: Body, p: vec3f) -> vec3f { return body.position.xyz+rot(body.rotation,(p-bitcast<vec4f>(atlas[bodyHeader(body)+4u]).xyz)*body.position.w); }
fn worldField(body: Body, p: vec3f) -> Sample { let s=localField(bodyHeader(body),localPoint(body,p)); return Sample(s.phi*body.position.w,rot(body.rotation,s.gradient)); }
`,y=(e=5,t=0,n=!1,r=65535)=>`
struct Params { counts: vec4u, values: vec4f, distances: vec4f, flags: vec4u, opt: vec4u }
struct Body { position: vec4f, rotation: vec4f, velocity: vec4f, omega: vec4f, lo: vec4f, hi: vec4f, anchorRotation: vec4f }
struct Point { x: vec4f, normal: vec4f, anchorA: vec4f, anchorB: vec4f, flags: vec4u, ellipsoidA: vec4f, ellipsoidB: vec4f }
struct Result { identity: vec4u, stats: vec4u, points: array<Point,${e}> }
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage,read> atlas: array<vec4u>;
@group(0) @binding(2) var<storage,read> bodies: array<Body>;
@group(0) @binding(3) var<storage,read> pairs: array<vec4u>;
@group(0) @binding(4) var<storage,read> previous: array<Result>;
@group(0) @binding(5) var<storage,read_write> results: array<Result>;
${t?`@group(0) @binding(6) var<storage,read_write> worldSeeds: array<vec4f>;
var<private> seedBodyA: u32;
var<private> seedBodyB: u32;
@compute @workgroup_size(64) fn transformSeeds(@builtin(global_invocation_id) gid: vec3u) {
  let body=bodies[gid.y];let header=atlas[bodyHeader(body)];
  if(gid.x<header.w) { worldSeeds[gid.y*${t}u+gid.x]=vec4f(worldPoint(body,bitcast<vec4f>(atlas[header.z+gid.x]).xyz),0); }
}`:``}
${n?`struct MeshWitness { best: vec4f, info: vec4u }
@group(0) @binding(6) var<storage,read_write> meshWitnesses: array<MeshWitness>;
var<private> witnessSlot: u32;`:``}
var<private> work: Result;
var<private> bodyA: Body;
var<private> bodyB: Body;
var<private> lo: vec3f;
var<private> hi: vec3f;
var<private> rng: u32;
${v}
// Per-pair/step 32-bit RNG. Intentional scheduling-independent GPU policy, not
// the CPU oracle's global 64-bit PCG stream. Seed selection is tested separately.
fn hash(value: u32) -> u32 { var x=value; x=(x^(x>>16u))*0x7feb352du; x=(x^(x>>15u))*0x846ca68bu; return x^(x>>16u); }
fn randomU32() -> u32 { rng=hash(rng+0x9e3779b9u); return rng; }
fn randomFloat() -> f32 { return f32(randomU32()>>8u)/16777216.0; }
fn smoothMax(a: f32,b: f32) -> f32 { return 0.5*(a+b+sqrt((a-b)*(a-b)+params.values.y)); }
fn objective(p: vec3f) -> f32 {
  work.stats.x++; var value=smoothMax(worldField(bodyA,p).phi,worldField(bodyB,p).phi);
  for(var i=0u;i<work.identity.w;i++) { value -= params.values.z*length(p-work.points[i].x.xyz); }
  return value;
}
// Objective with its analytic gradient (collide.cpp): xyz gradient, w value. One query.
fn objectiveGradient(p: vec3f) -> vec4f {
  work.stats.x++; let a=worldField(bodyA,p); let b=worldField(bodyB,p);
  let root=sqrt((a.phi-b.phi)*(a.phi-b.phi)+params.values.y); var value=0.5*(a.phi+b.phi+root);
  // Hardmax (epsilon=0) uses the midpoint subgradient at an exact tie.
  var t=0.0; if(root>0.0) { t=(a.phi-b.phi)/root; }
  var gradient=a.gradient*(0.5*(1.0+t))+b.gradient*(0.5*(1.0-t));
  for(var i=0u;i<work.identity.w;i++) {
    let dx=p-work.points[i].x.xyz; let len=length(dx);
    value-=params.values.z*len; if(len>1e-9) { gradient-=dx*(params.values.z/len); }
  }
  return vec4f(gradient,value);
}
var<private> ellipsoidState: mat3x3f;
// Deep-cut ellipsoid method [LM24] (optimize.cpp). E is symmetric, so row/column order agrees.
fn ellipsoidMethod(seed: vec3f, initial: mat3x3f) -> vec3f {
  var x=seed; var E=initial; var best=clamp(x,lo,hi); var bestValue=3.4e38; var it=0u;
  for(;it<params.flags.x;it++) {
    var grad=vec3f(0); var value=0.0; var violation=0.0;
    for(var i=0u;i<3u;i++) {
      let below=lo[i]-x[i]; let above=x[i]-hi[i];
      if(max(below,above)>violation) { violation=max(below,above); grad=vec3f(0); grad[i]=select(-1.0,1.0,above>below); }
    }
    if(violation==0.0) {
      let r=objectiveGradient(x); value=r.w; grad=r.xyz;
      if(value<bestValue) { bestValue=value; best=x; }
      if(length(grad)<params.values.w) { break; }
    }
    let Eg=E*grad; let gEg=dot(grad,Eg);
    if(!(gEg>1e-12)) { break; }
    let s=sqrt(gEg); let a=min(select(value-bestValue,violation,violation>0.0)/s,0.5);
    let step=Eg*((1.0+3.0*a)/(4.0*s)); x-=step;
    E=(E-mat3x3f(Eg*Eg.x,Eg*Eg.y,Eg*Eg.z)*(2.0*(1.0+3.0*a)/(4.0*(1.0+a)*gEg)))*(9.0*(1.0-a*a)/8.0);
    E=(E+transpose(E))*0.5;
    if(length(step)<params.values.w) { break; }
  }
  work.stats.y+=it; ellipsoidState=E; return best;
}
// Uniform direction (maths.h onSphere): z, then the angle.
fn onSphere() -> vec3f { let z=-1.0+2.0*randomFloat(); let angle=6.2831855*randomFloat(); let r=sqrt(max(0.0,1.0-z*z)); return vec3f(r*cos(angle),r*sin(angle),z); }
// Stochastic projected gradient descent [RM51] (optimize.cpp).
fn gradientDescent(seed: vec3f) -> vec3f {
  var x=clamp(seed,lo,hi); var best=x; var bestValue=3.4e38; var it=0u; let stepSize=bitcast<f32>(params.opt.y);
  for(;it<params.flags.x;it++) {
    let r=objectiveGradient(x);
    if(r.w<bestValue) { bestValue=r.w; best=x; }
    let gradLength=length(r.xyz); if(gradLength<params.values.w) { break; }
    let decay=1.0/sqrt(f32(it+1u)); let noise=onSphere()*(0.25*decay*max(gradLength,1.0));
    let next=clamp(x-(r.xyz+noise)*(stepSize*decay),lo,hi); let converged=params.opt.z==0u && length(next-x)<params.values.w;
    x=next; if(converged) { break; }
  }
  work.stats.y+=it; return best;
}
fn optimize(seed: vec3f, step: vec3f) -> vec3f {
  var x: array<vec3f,4>; var values: array<f32,4>; x[0]=clamp(seed,lo,hi);
  for(var i=0u;i<3u;i++) { x[i+1u]=x[0]; x[i+1u][i] += select(-step[i],step[i],x[0][i]+step[i]<=hi[i]); x[i+1u]=clamp(x[i+1u],lo,hi); }
  for(var i=0u;i<4u;i++) { values[i]=objective(x[i]); }
  var iterations=0u;
  for(;iterations<params.flags.x;iterations++) {
    for(var i=1u;i<4u;i++) { var j=i; loop { if(j==0u) { break; } if(values[j]>=values[j-1u]) { break; }
      let v=values[j]; values[j]=values[j-1u]; values[j-1u]=v; let point=x[j]; x[j]=x[j-1u]; x[j-1u]=point; j--; } }
    let extent=max(length(x[1]-x[0]),max(length(x[2]-x[0]),length(x[3]-x[0])));
    if(extent<params.values.w || values[3]-values[0]<0.05*params.values.w) { break; }
    let centroid=(x[0]+x[1]+x[2])/3.0; let reflected=clamp(centroid+(centroid-x[3]),lo,hi); let fr=objective(reflected);
    if(fr<values[0]) { let expanded=clamp(centroid+2.0*(centroid-x[3]),lo,hi); let fe=objective(expanded);
      x[3]=select(reflected,expanded,fe<fr); values[3]=min(fe,fr);
    } else if(fr<values[2]) { x[3]=reflected; values[3]=fr; }
    else { let contracted=centroid+0.5*(select(x[3],reflected,fr<values[3])-centroid); let fc=objective(contracted);
      if(fc<min(fr,values[3])) { x[3]=contracted; values[3]=fc; }
      else { for(var i=1u;i<4u;i++) { x[i]=x[0]+0.5*(x[i]-x[0]); values[i]=objective(x[i]); } }
    }
  }
  work.stats.y += iterations; var best=0u; for(var i=1u;i<4u;i++) { if(values[i]<values[best]) { best=i; } } return x[best];
}
fn inside(p: vec3f) -> bool { return all(p>=lo) && all(p<=hi); }
fn seedPoint() -> vec3f {
  // Explicit draws avoid depending on constructor-argument evaluation ordering.
  let rx=randomFloat(); let ry=randomFloat(); let rz=randomFloat(); var p=lo+(hi-lo)*vec3f(rx,ry,rz); var n=0u;
  if(params.flags.z==0u) { return p; }
  for(var b=0u;b<2u;b++) {
    var body=bodyA; if(b==1u) { body=bodyB; } let header=atlas[bodyHeader(body)];
    for(var i=0u;i<header.w;i++) {
      let candidate=${t?`worldSeeds[select(seedBodyA,seedBodyB,b==1u)*${t}u+i].xyz`:`worldPoint(body,bitcast<vec4f>(atlas[header.z+i]).xyz)`};
      if(inside(candidate)) { n++; if(randomU32()%n==0u) { p=candidate; } }
    }
  }
  return p;
}
fn velocity(body: Body,p: vec3f) -> vec3f { return body.velocity.xyz+cross(body.omega.xyz,p-body.position.xyz); }
fn addPoint(old: Point, seed: vec3f, cached: bool) {
  var ellipsoidA=vec4f(1,0,0,1); var ellipsoidB=vec4f(0,1,0,0); var p: vec3f;
  if(params.opt.x==1u) {
    // An ellipsoid centred at the seed enclosing V; cached points blend 0.75/0.25 (collide.cpp).
    let extent=0.5*(hi-lo)+abs(seed-0.5*(lo+hi)); let d=extent*extent*3.0;
    var E=mat3x3f(vec3f(d.x,0,0),vec3f(0,d.y,0),vec3f(0,0,d.z));
    if(cached) {
      let C=mat3x3f(old.ellipsoidA.xyz,vec3f(old.ellipsoidA.y,old.ellipsoidA.w,old.ellipsoidB.x),vec3f(old.ellipsoidA.z,old.ellipsoidB.x,old.ellipsoidB.y));
      E=C*0.75+E*0.25;
    }
    p=ellipsoidMethod(seed,E); let F=ellipsoidState;
    ellipsoidA=vec4f(F[0][0],F[0][1],F[0][2],F[1][1]); ellipsoidB=vec4f(F[1][2],F[2][2],0,0);
  } else if(params.opt.x==2u) {
    p=gradientDescent(seed);
  } else {
    var step=max(0.1*(hi-lo),vec3f(0.5*params.values.w));
    if(cached) { step=min(step,vec3f(max(length(seed-old.x.xyz),5.0*params.values.w))); }
    p=optimize(seed,step);
  }
  let a=worldField(bodyA,p); let b=worldField(bodyB,p); work.stats.x++;
  let na=unit(a.gradient); let nb=-unit(b.gradient); var normal=select(nb,na,a.phi<b.phi);
  if(cached) { normal=select(nb,na,dot(na,old.normal.xyz)>dot(nb,old.normal.xyz)); }
  let offsetA=a.gradient*(a.phi/max(dot(a.gradient,a.gradient),1e-8)); let offsetB=b.gradient*(b.phi/max(dot(b.gradient,b.gradient),1e-8));
  var separation=a.phi+b.phi;
  if(a.phi>0.0 || b.phi>0.0) {
    let gap=offsetA-offsetB; separation=length(gap);
    // Unsigned distance misclassifies an embedded surface as a positive gap.
    if(params.distances.z!=0.0 && (a.phi<=0.0 || b.phi<=0.0)) {
      let fixedA=bodyA.velocity.w!=0.0 && atlas[bodyHeader(bodyA)].x==0u;
      let fixedB=bodyB.velocity.w!=0.0 && atlas[bodyHeader(bodyB)].x==0u;
      if(fixedA || fixedB) {
        normal=select(nb,na,fixedA); separation=dot(gap,normal);
        // phi/|grad|^2 is unbounded where a voxel gradient vanishes; fall back to the bounded sum.
        let moving=select(a.gradient,b.gradient,fixedA); if(dot(moving,moving)<0.25) { separation=a.phi+b.phi; }
      }
    }
    if(a.phi>0.0 && b.phi>0.0 && separation>1e-6 && !(cached && dot(gap,old.normal.xyz)<0.0)) { normal=gap/separation; }
  }
  // New ids stay below SDF_ROLLING_BIT and never equal SPHERE_FEATURE, which evalContact
  // would otherwise treat as a built-in sphere contact.
  var id=old.flags.z; if(!cached) { work.stats.z++; if(work.stats.z==${d}u) { work.stats.z++; }
    if(work.stats.z==0u || work.stats.z>=0x20000000u) { work.stats.z=1u; } id=work.stats.z; }
  let point=Point(vec4f(p,min(a.phi,b.phi)),vec4f(normal,separation),
    vec4f(rot(bodyA.anchorRotation,invrot(bodyA.rotation,p-offsetA-bodyA.position.xyz)),smoothMax(a.phi,b.phi)),
    vec4f(rot(bodyB.anchorRotation,invrot(bodyB.rotation,p-offsetB-bodyB.position.xyz)),0),vec4u(u32(separation<params.distances.x),u32(cached),id,0),ellipsoidA,ellipsoidB);
  work.points[work.identity.w]=point; work.identity.w++;
}
${g(e,n)}
@compute @workgroup_size(64)
fn narrowphase(@builtin(global_invocation_id) invocation: vec3u) {
  let slot=invocation.x; ${n?`witnessSlot=slot;`:``} if(slot>=params.counts.x) { return; }
  let pair=pairs[slot]; work.identity=vec4u(pair.xyz,0u); work.stats=vec4u(0);
  if(pair.x==0xffffffffu) { results[slot]=work; return; }
  ${t?`seedBodyA=pair.x;seedBodyB=pair.y;`:``}
  bodyA=bodies[pair.x]; bodyB=bodies[pair.y]; let margin=vec3f(0.5*params.distances.x);
  // Rolling surfaces must refresh anchors rather than pinning last frame's material point: analytic
  // sphere, capsule, cylinder, cone and torus (atlas kinds 1-5). A pinned anchor sank rolling cylinders.
  let kindA=atlas[bodyHeader(bodyA)].x; let kindB=atlas[bodyHeader(bodyB)].x;
  work.stats.w=u32((kindA>=1u && kindA<=5u) || (kindB>=1u && kindB<=5u));
  lo=max(bodyA.lo.xyz-margin,bodyB.lo.xyz-margin); hi=min(bodyA.hi.xyz+margin,bodyB.hi.xyz+margin);
  if(any(lo>hi) || (bodyA.velocity.w!=0.0 && bodyB.velocity.w!=0.0)) { results[slot]=work; return; }
  rng=hash(pair.z^hash(params.counts.y)^hash(pair.x)^hash(pair.y+0x9e3779b9u));
  var cached=0u; var activeCount=0u;
  if(params.flags.y!=0u && pair.w!=0xffffffffu && pair.w<arrayLength(&previous)) {
    // Read individual history entries; avoid a per-invocation copy of the entire contact array.
    if(all(previous[pair.w].identity.xyz==pair.xyz)) {
      work.stats.z=previous[pair.w].stats.z;
      for(var i=0u;i<min(previous[pair.w].identity.w,${e-1}u);i++) {
        let point=previous[pair.w].points[i];
        if(point.flags.z>=0x40000000u) { continue; }
        if(cached>=params.counts.z) { break; }
        cached++; activeCount += point.flags.x;
        let va=velocity(bodyA,point.x.xyz); let vb=velocity(bodyB,point.x.xyz); var v=0.5*(va+vb);
        if(bodyA.velocity.w!=0.0) { v=vb; } else if(bodyB.velocity.w!=0.0) { v=va; }
        addPoint(point,point.x.xyz+v*params.values.x,true);
      }
    }
  }
  // Gradient descent keeps its samples under the convex skip (collide.cpp).
  let skip=params.flags.w!=0u && params.opt.x!=2u && activeCount>0u && activeCount==params.counts.z && atlas[bodyHeader(bodyA)].y!=0u && atlas[bodyHeader(bodyB)].y!=0u;
  let samples=select(params.counts.w,0u,skip)+params.counts.z-cached;
  for(var i=0u;i<samples;i++) { var empty: Point; addPoint(empty,seedPoint(),false); }
  // First-wins duplicate rejection, then stable ranking (Algorithm 1).
  var unique=0u;
  for(var i=0u;i<work.identity.w;i++) {
    let point=work.points[i]; var duplicate=false;
    for(var j=0u;j<unique;j++) { let d=point.x.xyz-work.points[j].x.xyz; if(dot(d,d)<params.values.w*params.values.w) { duplicate=true; } }
    if(!duplicate) { work.points[unique]=point; unique++; }
  }
  work.identity.w=unique;
  for(var i=0u;i<unique;i++) {
    var rank=work.points[i].anchorA.w+select(params.distances.y,0.0,work.points[i].flags.y!=0u);
    for(var j=0u;j<unique;j++) { rank -= params.values.z*length(work.points[i].x.xyz-work.points[j].x.xyz); }
    work.points[i].anchorB.w=rank;
  }
  for(var i=1u;i<unique;i++) { var j=i; loop { if(j==0u) { break; } if(work.points[j].anchorB.w>=work.points[j-1u].anchorB.w) { break; }
    let point=work.points[j]; work.points[j]=work.points[j-1u]; work.points[j-1u]=point; j--; } }
  if(!meshPlaneContacts(pair)) { _ = meshMeshContacts(pair); }
  results[slot]=work;
}
${n?_(r):``}
`;y();var b=class i{device;atlas;options;pipeline;witnessBuffer;supportPipeline;supportGroup;seedPipeline;seedBuffer;seedGroup;seedStride;historyPipeline;shapeBuffer;bodyBuffer;pairBuffer;paramsBuffer;output;groups;current=0;count=0;stepIndex=0;disposed=!1;get maxPoints(){return this.options.maxPoints??5}get resultWords(){return r(this.maxPoints)}static async create(t,n,a){for(let e of[a.maxBodies,a.maxPairs])if(!Number.isSafeInteger(e)||e<1)throw Error(`SDF capacities must be positive integers`);let s=Math.min(t.limits.maxBufferSize,t.limits.maxStorageBufferBindingSize),c=o(a.maxPoints??5),l=r(c);if(a.maxBodies*28*4>s||a.maxPairs*l*4>s||Math.ceil(a.maxPairs/64)>t.limits.maxComputeWorkgroupsPerDimension)throw Error(`SDF pass capacities exceed device limits`);if(t.limits.maxStorageBuffersPerShaderStage<5||t.limits.maxComputeInvocationsPerWorkgroup<64)throw Error(`Device cannot run the SDF pass`);let u=e(n,Math.min(a.maxAtlasBytes??67108864,s),a.meshVertexContacts),d=n.reduce((e,t)=>Math.max(e,t.seeds.length),0),f=t.limits.maxStorageBuffersPerShaderStage>=6&&a.maxBodies>=256&&a.maxBodies<=t.limits.maxComputeWorkgroupsPerDimension&&Math.ceil(d/64)<=t.limits.maxComputeWorkgroupsPerDimension&&d*a.maxBodies*16<=Math.min(s,134217728)?d:0,p=!!a.meshVertexContacts&&a.parallelMeshWitnesses!==!1&&!f&&t.limits.maxStorageBuffersPerShaderStage>=6&&a.maxPairs*32<=Math.min(s,67108864),m=t.createShaderModule({label:`experimental sdf narrowphase`,code:y(c,f,p,t.limits.maxComputeWorkgroupsPerDimension)}),g=(await m.getCompilationInfo()).messages.filter(e=>e.type===`error`);if(g.length)throw Error(g.map(e=>`${e.lineNum}:${e.linePos} ${e.message}`).join(`
`));let _=await t.createComputePipelineAsync({label:`experimental sdf narrowphase`,layout:`auto`,compute:{module:m,entryPoint:`narrowphase`}}),v=p?await t.createComputePipelineAsync({label:`sdf mesh witnesses`,layout:`auto`,compute:{module:m,entryPoint:`supplementContacts`}}):null,b=f?await t.createComputePipelineAsync({label:`sdf transform seeds`,layout:`auto`,compute:{module:m,entryPoint:`transformSeeds`}}):null,x=t.createShaderModule({label:`sdf history transfer`,code:h(c)}),S=await t.createComputePipelineAsync({layout:`auto`,compute:{module:x,entryPoint:`copyHistory`}});return new i(t,u,{...a,maxPoints:c},_,S,b,f,v)}constructor(e,t,n,r,i,a,o,s){this.device=e,this.atlas=t,this.options={...n},this.pipeline=r,this.historyPipeline=i,this.seedPipeline=a,this.seedStride=o,this.supportPipeline=s;let c=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC,l=[],u=(t,n,r=c)=>{let i=e.createBuffer({label:t,size:n,usage:r});return l.push(i),i};try{this.shapeBuffer=u(`sdf atlas`,t.data.byteLength),e.queue.writeBuffer(this.shapeBuffer,0,t.data),this.bodyBuffer=u(`sdf bodies`,n.maxBodies*28*4),this.seedBuffer=o?u(`sdf world seeds`,n.maxBodies*o*16):null,this.seedGroup=a?e.createBindGroup({layout:a.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:this.shapeBuffer}},{binding:2,resource:{buffer:this.bodyBuffer}},{binding:6,resource:{buffer:this.seedBuffer}}]}):null,this.pairBuffer=u(`sdf pairs`,n.maxPairs*16),this.paramsBuffer=u(`sdf params`,80,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST),this.witnessBuffer=s?u(`sdf mesh witnesses`,n.maxPairs*32):null,this.output=[u(`sdf results 0`,n.maxPairs*this.resultWords*4),u(`sdf results 1`,n.maxPairs*this.resultWords*4)];let i=t=>e.createBindGroup({layout:r.getBindGroupLayout(0),entries:[this.paramsBuffer,this.shapeBuffer,this.bodyBuffer,this.pairBuffer,this.output[t^1],this.output[t],...this.seedBuffer?[this.seedBuffer]:this.witnessBuffer?[this.witnessBuffer]:[]].map((e,t)=>({binding:t,resource:{buffer:e}}))});this.groups=[i(0),i(1)];let c=()=>e.createBindGroup({layout:s.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.paramsBuffer}},{binding:1,resource:{buffer:this.shapeBuffer}},{binding:2,resource:{buffer:this.bodyBuffer}},{binding:3,resource:{buffer:this.pairBuffer}},{binding:6,resource:{buffer:this.witnessBuffer}}]});this.supportGroup=s?c():null}catch(e){for(let e of l)e.destroy();throw e}}step(e,n,r,i=l()){if(this.disposed)throw Error(`SDF pass is disposed`);if(i.meshVertexContacts&&!this.options.meshVertexContacts)throw Error(`meshVertexContacts must be enabled when creating the SDF pass`);if(e.length>this.options.maxBodies||n.length>this.options.maxPairs)throw Error(`SDF pass capacity exceeded`);let o=a(e,this.atlas),c=s(n,e.length,this.count),u=t(n.length,this.stepIndex,r,i,this.maxPoints),d=this.current^1;this.device.queue.writeBuffer(this.bodyBuffer,0,o),this.device.queue.writeBuffer(this.pairBuffer,0,c),this.device.queue.writeBuffer(this.paramsBuffer,0,u);let f=this.device.createCommandEncoder({label:`sdf narrowphase`});if(n.length){let e=f.beginComputePass();this.encodeSeeds(e,i),this.encodeSupports(e,n.length,i),e.setPipeline(this.pipeline),e.setBindGroup(0,this.groups[d]),e.dispatchWorkgroups(Math.ceil(n.length/64)),e.end()}this.device.queue.submit([f.finish()]),this.current=d,this.count=n.length,this.stepIndex=this.stepIndex+1>>>0}get storage(){return{atlas:this.shapeBuffer,bodies:this.bodyBuffer,pairs:this.pairBuffer,current:this.output[this.current],previous:this.output[this.current^1]}}encodeFromGpu(e,n,r,i,a,o){if(this.disposed)throw Error(`SDF pass is disposed`);if(a.meshVertexContacts&&!this.options.meshVertexContacts)throw Error(`meshVertexContacts must be enabled when creating the SDF pass`);if(n>this.options.maxBodies||r.length>this.options.maxPairs)throw Error(`SDF pass capacity exceeded`);let c=s(r,n,this.count),l=t(r.length,this.stepIndex,i,a,this.maxPoints);this.device.queue.writeBuffer(this.pairBuffer,0,c),this.device.queue.writeBuffer(this.paramsBuffer,0,l),o?.(),this.encodeSeeds(e,a);let u=this.current^1;r.length&&(this.encodeSupports(e,r.length,a),e.setPipeline(this.pipeline),e.setBindGroup(0,this.groups[u]),e.dispatchWorkgroups(Math.ceil(r.length/64))),this.current=u,this.count=r.length,this.stepIndex=this.stepIndex+1>>>0}encodeGeneratedPairs(e,n,r,i){if(this.disposed)throw Error(`SDF pass is disposed`);if(r.meshVertexContacts&&!this.options.meshVertexContacts)throw Error(`meshVertexContacts must be enabled when creating the SDF pass`);let a=this.options.maxPairs;this.device.queue.writeBuffer(this.paramsBuffer,0,t(a,this.stepIndex,n,r,this.maxPoints)),i(),this.encodeSeeds(e,r);let o=this.current^1;this.encodeSupports(e,a,r),e.setPipeline(this.pipeline),e.setBindGroup(0,this.groups[o]),e.dispatchWorkgroups(Math.ceil(a/64)),this.current=o,this.count=a,this.stepIndex=this.stepIndex+1>>>0}encodeSupports(e,t,n){this.supportPipeline&&n.meshVertexContacts&&(e.setPipeline(this.supportPipeline),e.setBindGroup(0,this.supportGroup),e.dispatchWorkgroups(Math.min(t,this.device.limits.maxComputeWorkgroupsPerDimension),Math.ceil(t/this.device.limits.maxComputeWorkgroupsPerDimension)))}encodeSeeds(e,t){this.seedPipeline&&t.curvatureSampling&&(e.setPipeline(this.seedPipeline),e.setBindGroup(0,this.seedGroup),e.dispatchWorkgroups(Math.ceil(this.seedStride/64),this.options.maxBodies))}resized(e){if(this.disposed)throw Error(`SDF pass is disposed`);let t=Math.min(this.device.limits.maxBufferSize,this.device.limits.maxStorageBufferBindingSize);if(!Number.isSafeInteger(e)||e<this.options.maxPairs||e*this.resultWords*4>t||Math.ceil(e/64)>this.device.limits.maxComputeWorkgroupsPerDimension)throw Error(`Invalid SDF growth capacity`);if(this.witnessBuffer&&e*32>Math.min(t,67108864))throw Error(`SDF mesh witness growth exceeds cache byte limit`);return new i(this.device,this.atlas,{...this.options,maxPairs:e},this.pipeline,this.historyPipeline,this.seedPipeline,this.seedStride,this.supportPipeline)}inheritHistory(e,t){if(this.disposed||e.disposed||this.device!==e.device||this===e)throw Error(`Invalid SDF history owner`);if(t.length!==this.options.maxBodies)throw Error(`Invalid SDF retained slot count`);if(e.maxPoints!==this.maxPoints)throw Error(`SDF history requires matching point capacity`);let n=this.device,r=n.createBuffer({size:t.length*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});try{n.queue.writeBuffer(r,0,new Uint32Array(t.map(e=>+e)));let i=n.createBindGroup({layout:this.historyPipeline.getBindGroupLayout(0),entries:[e.storage.current,this.storage.current,r].map((e,t)=>({binding:t,resource:{buffer:e}}))}),a=n.createCommandEncoder(),o=a.beginComputePass();o.setPipeline(this.historyPipeline),o.setBindGroup(0,i),o.dispatchWorkgroups(Math.ceil(this.options.maxPairs/64)),o.end(),n.queue.submit([a.finish()]),this.count=Math.min(e.count,this.options.maxPairs),this.stepIndex=e.stepIndex}finally{r.destroy()}}async readResults(){if(this.disposed)throw Error(`SDF pass is disposed`);let e=this.count;if(!e)return[];let t=e*this.resultWords*4,r=this.device.createBuffer({label:`sdf readback`,size:t,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST});try{let i=this.device.createCommandEncoder();return i.copyBufferToBuffer(this.output[this.current],0,r,0,t),this.device.queue.submit([i.finish()]),await r.mapAsync(GPUMapMode.READ),n(r.getMappedRange().slice(0),e,this.maxPoints)}finally{r.destroy()}}destroy(){if(!this.disposed){this.disposed=!0,this.seedBuffer?.destroy(),this.witnessBuffer?.destroy();for(let e of[this.shapeBuffer,this.bodyBuffer,this.pairBuffer,this.paramsBuffer,...this.output])e.destroy()}}},x=`
${f}
struct SdfBody { position: vec4f, rotation: vec4f, velocity: vec4f, omega: vec4f, lo: vec4f, hi: vec4f, anchorRotation: vec4f }
@group(0) @binding(0) var<storage,read> bodies: array<Body>;
struct Config { info: vec4u, rotation: vec4f }
@group(0) @binding(1) var<storage,read> configs: array<Config>;
@group(0) @binding(2) var<storage,read> atlas: array<vec4u>;
@group(0) @binding(3) var<storage,read_write> output: array<SdfBody>;
@compute @workgroup_size(64) fn prepare(@builtin(global_invocation_id) gid: vec3u) {
  let i=gid.x; if(i>=arrayLength(&configs)) { return; }
  let body=bodies[i]; let config=configs[i].info; let rotation=qmul(body.rot,configs[i].rotation); let h=config.x; let scale=bitcast<f32>(config.y);
  let localLo=bitcast<vec4f>(atlas[h+2u]).xyz; let localHi=bitcast<vec4f>(atlas[h+3u]).xyz;
  let com=bitcast<vec4f>(atlas[h+4u]).xyz;
  var lo=vec3f(3.4e38); var hi=vec3f(-3.4e38);
  for(var c=0u;c<8u;c++) {
    let p=vec3f(select(localLo.x,localHi.x,(c&1u)!=0u),select(localLo.y,localHi.y,(c&2u)!=0u),select(localLo.z,localHi.z,(c&4u)!=0u));
    let world=body.pos.xyz+qrotate(rotation,(p-com)*scale); lo=min(lo,world); hi=max(hi,world);
  }
  output[i]=SdfBody(vec4f(body.pos.xyz,scale),rotation,vec4f(body.vel.xyz,f32(body.size.w<=0.0)),
    vec4f(body.angVel.xyz,bitcast<f32>(h)),vec4f(lo,bitcast<f32>(config.z)),vec4f(hi,0),configs[i].rotation);
}`,S=(e=5)=>`
${f}
struct Point { x: vec4f, normal: vec4f, anchorA: vec4f, anchorB: vec4f, flags: vec4u, ellipsoidA: vec4f, ellipsoidB: vec4f }
struct Result { identity: vec4u, stats: vec4u, points: array<Point,${e}> }
struct BridgeParams { counts: vec4u, distances: vec4f }
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<uniform> bridge: BridgeParams;
@group(0) @binding(2) var<storage,read> bodies: array<Body>;
@group(0) @binding(3) var<storage,read_write> results: array<Result>;
@group(0) @binding(4) var<storage,read> previous: array<Result>;
@group(0) @binding(5) var<storage,read> pairs: array<vec4u>;
@group(0) @binding(6) var<storage,read> prevContacts: array<Contact>;
@group(0) @binding(7) var<storage,read_write> contacts: array<Contact>;
@group(0) @binding(8) var<storage,read_write> manifolds: array<Manifold>;
@group(0) @binding(9) var<storage,read_write> counters: array<atomic<u32>>;
@compute @workgroup_size(64) fn exportContacts(@builtin(global_invocation_id) gid: vec3u) {
  let slot=gid.x; if(slot>=bridge.counts.x) { return; }
  let pair=pairs[slot]; if(pair.x==0xffffffffu) { return; }
  let result=results[slot]; let a=pair.x; let b=pair.y;
  atomicAdd(&counters[C_PAIRS],1u);
  for(var i=0u;i<result.identity.w;i++) {
    let point=result.points[i]; results[slot].points[i].flags.w=0u;
    if(point.flags.x==0u) { continue; }
    let n=-point.normal.xyz; let basis=orthonormal(n);
    var rA=point.anchorA.xyz; var rB=point.anchorB.xyz;
    var lam=vec3f(0); var pen=vec3f(0); var stick=0u;
    // Only the previous SDF result can identify the solved production point.
    // Its export slot is separate from pair keys and from rank/sort position.
    if(point.flags.y!=0u && pair.w!=0xffffffffu && pair.w<arrayLength(&previous)) {
      // Read individual history entries; avoid a per-invocation copy of the entire contact array.
      if(all(previous[pair.w].identity.xyz==pair.xyz)) {
        for(var j=0u;j<previous[pair.w].identity.w;j++) {
          let prior=previous[pair.w].points[j];
          if(prior.flags.z==point.flags.z && prior.flags.w>0u && prior.flags.w<=arrayLength(&prevContacts)) {
            let k=prevContacts[prior.flags.w-1u];
            let oldBasis=orthonormal(-prior.normal.xyz);
            lam=transpose(basis)*(oldBasis*k.lam); pen=k.pen;
            stick=select(k.key&STICK_BIT,0u,result.stats.w!=0u);
            if(stick!=0u && bridge.distances.z>0.0) {
              let retained=bodies[a].pos.xyz+qrotate(bodies[a].rot,k.rA)-bodies[b].pos.xyz-qrotate(bodies[b].rot,k.rB);
              let moved=max(length(rA-k.rA),length(rB-k.rB));
              // A relocated optimizer point cannot keep an unrelated material constraint.
              if(moved>3.0*bridge.distances.z && point.normal.w<dot(n,retained)-bridge.distances.z) { stick=0u; }
            }
            if(stick!=0u) { rA=k.rA; rB=k.rB; }
            break;
          }
        }
      }
    }
    let d=bodies[a].pos.xyz+qrotate(bodies[a].rot,rA)-bodies[b].pos.xyz-qrotate(bodies[b].rot,rB);
    // A sticking constraint retains its material anchors. Its normal error must
    // use those same anchors, not the optimizer's newly relocated contact.
    let separation=select(point.normal.w,dot(n,d),stick!=0u);
    let c0=vec3f(separation-bridge.distances.x+bridge.distances.y,
      select(0.0,dot(basis[1],d),stick!=0u),select(0.0,dot(basis[2],d),stick!=0u));
    lam *= params.alpha*params.gamma;
    pen=clamp(pen*params.gamma,vec3f(PENALTY_MIN),vec3f(PENALTY_MAX));
    if((params.flags&FLAG_MASS_PENALTY)!=0u) {
      let mA=select(bodies[a].size.w,3.4e38,bodies[a].size.w<=0.0);
      let mB=select(bodies[b].size.w,3.4e38,bodies[b].size.w<=0.0);
      pen.x=max(pen.x,clamp(min(mA,mB)/(params.dt*params.dt),PENALTY_MIN,PENALTY_MAX));
    }
    let m=atomicAdd(&counters[C_MANIFOLDS],1u);
    if(m>=params.manifoldCapacity) { atomicOr(&counters[C_OVERFLOW],4u); continue; }
    let c=atomicAdd(&counters[C_CONTACTS],1u);
    if(c>=params.contactCapacity) {
      atomicOr(&counters[C_OVERFLOW],2u); manifolds[m]=Manifold(vec4u(a,b,0u,0u),vec4f(n,0)); continue;
    }
    let rolling=select(0u,SDF_ROLLING_BIT,result.stats.w!=0u);
    contacts[c]=Contact(rA,(point.flags.z&~STICK_BIT)|stick|rolling,rB,c0.x,pen,c0.y,lam,c0.z);
    manifolds[m]=Manifold(vec4u(a,b,c,1u|(params.step<<4u)),vec4f(n,sqrt(bodies[a].pos.w*bodies[b].pos.w)));
    results[slot].points[i].flags.w=c+1u;
  }
}`;S();var C=`
${f}
struct SdfBody { position: vec4f, rotation: vec4f, velocity: vec4f, omega: vec4f, lo: vec4f, hi: vec4f, anchorRotation: vec4f }
struct BridgeParams { counts: vec4u, distances: vec4f }
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<uniform> bridge: BridgeParams;
@group(0) @binding(2) var<storage,read> sdfBodies: array<SdfBody>;
@group(0) @binding(3) var<storage,read_write> pairs: array<vec4u>;
@group(0) @binding(4) var<storage,read> statics: array<u32>;
@group(0) @binding(5) var<storage,read> joints: array<Joint>;
@group(0) @binding(6) var<storage,read> filters: array<vec2u>;
${u}
@compute @workgroup_size(64) fn filterPairs(@builtin(global_invocation_id) gid: vec3u) {
  let slot=gid.x; if(slot>=bridge.counts.x) { return; }
  let pair=pairs[slot]; let a=sdfBodies[pair.x]; let b=sdfBodies[pair.y];
  let fa=filters[pair.x]; let fb=filters[pair.y];
  let margin=vec3f(bridge.distances.x);
  if((a.velocity.w!=0.0&&b.velocity.w!=0.0) || (fa.x&fb.y)==0u || (fb.x&fa.y)==0u ||
    any(a.lo.xyz>b.hi.xyz+margin) || any(b.lo.xyz>a.hi.xyz+margin) || ignored(pair.x,pair.y)) {
    pairs[slot].x=0xffffffffu;
  }
}`,w=(e=5)=>`
${f}
struct Point { x: vec4f, normal: vec4f, anchorA: vec4f, anchorB: vec4f, flags: vec4u, ellipsoidA: vec4f, ellipsoidB: vec4f }
struct Result { identity: vec4u, stats: vec4u, points: array<Point,${e}> }
struct BridgeParams { counts: vec4u, distances: vec4f }
@group(0) @binding(0) var<uniform> bridge: BridgeParams;
@group(0) @binding(1) var<storage,read> results: array<Result>;
@group(0) @binding(2) var<storage,read> solved: array<Contact>;
@group(0) @binding(3) var<storage,read_write> manifolds: array<Manifold>;
@group(0) @binding(4) var<storage,read_write> contacts: array<Contact>;
@group(0) @binding(5) var<storage,read_write> counters: array<u32>;
@compute @workgroup_size(64) fn reportPairs(@builtin(global_invocation_id) id: vec3u) {
  let i=id.x;
  if(i==0u) { counters[C_MANIFOLDS]=bridge.counts.x; }
  if(i>=bridge.counts.x) { return; }
  let r=results[i]; var count=0u; var anchor=vec3f(0); var normal=vec3f(0); var fallback=vec3f(0,1,0); var force=0.0;
  for(var j=0u;j<r.identity.w;j++) {
    let p=r.points[j];
    if(p.flags.x==0u || p.flags.w==0u || p.flags.w>arrayLength(&solved)) { continue; }
    let k=solved[p.flags.w-1u]; count++; anchor+=k.rA;
    let strength=abs(k.lam.x); force+=strength;
    fallback=-p.normal.xyz; normal+=fallback*strength;
  }
  if(length(normal)>1e-12) { normal=normalize(normal); } else { normal=fallback; }
  manifolds[i]=Manifold(vec4u(r.identity.xy,i,select(0u,1u,count>0u)),vec4f(normal,0));
  contacts[i]=Contact(anchor/f32(max(count,1u)),0u,vec3f(0),0,vec3f(0),0,vec3f(force,0,0),0);
}`;w();function T(e,t){let n=e.data,r=new Float32Array(n.buffer),i=t*4,a=1;if(n[i]===7){let[e,t,o,s]=n.subarray(i+4,i+8),c=r[i+11],l=[0,0,0];for(let n=0;n<s;n++)for(let i=0;i<o;i++)for(let a=0;a<t;a++){let u=e*4+4*(a+t*(i+o*n));a+1<t&&(l[0]=Math.max(l[0],Math.abs(r[u+4]-r[u])/c)),i+1<o&&(l[1]=Math.max(l[1],Math.abs(r[u+4*t]-r[u])/c)),n+1<s&&(l[2]=Math.max(l[2],Math.abs(r[u+4*t*o]-r[u])/c))}a=Math.hypot(...l)+1}else if(n[i]===6){let e=Math.abs(r[i+23]),t=Math.hypot(...[0,1,2].map(e=>Math.max(Math.abs(r[i+8+e]),Math.abs(r[i+12+e]))));a=1+e*(n[i+24]===2?7*Math.sqrt(3):t)}let o=Math.fround(a*1.001);if(!Number.isFinite(o))throw Error(`SDF ray slope bound exceeds float32 range`);return o}var E=`
struct Body { position: vec4f, rotation: vec4f, velocity: vec4f, omega: vec4f, lo: vec4f, hi: vec4f, anchorRotation: vec4f }
struct Ray { o: vec4f, d: vec4f }
struct Params { bodies: u32, rays: u32, ignored: u32, mask: u32, ignore: array<vec4u,4> }
struct Hit { t: f32, n: vec3f }
@group(0) @binding(0) var<storage,read> bodies: array<Body>;
@group(0) @binding(1) var<storage,read> atlas: array<vec4u>;
@group(0) @binding(2) var<storage,read> rays: array<Ray>;
@group(0) @binding(3) var<storage,read_write> best: array<atomic<u32>>;
@group(0) @binding(4) var<storage,read_write> hits: array<vec4f>;
@group(0) @binding(5) var<uniform> params: Params;
@group(0) @binding(6) var<storage,read> filters: array<vec2u>;
const NONE=0xffffffffu;
const MISS=Hit(-1.0,vec3f(0));
${v}
fn ignored(b: u32) -> bool {
  if((filters[b].x&params.mask)==0u) { return true; }
  for(var i=0u;i<params.ignored;i++) { if(params.ignore[i/4u][i%4u]==b) { return true; } }
  return false;
}
fn worldNormal(b: u32, n: vec3f) -> vec3f { return n; }
fn trace(b: u32, r: Ray) -> Hit {
  let body=bodies[b]; var enter=0.0; var leave=r.o.w;
  if(leave<0.0 || dot(r.d.xyz,r.d.xyz)<0.5) { return MISS; }
  // Clip in field space: a rotated world AABB includes points beyond the domain
  // used for the warped-field slope bound. Parameter t remains in world units.
  let h=bodyHeader(body);
  let lo=bitcast<vec4f>(atlas[h+2u]).xyz; let hi=bitcast<vec4f>(atlas[h+3u]).xyz;
  let origin=localPoint(body,r.o.xyz); let direction=invrot(body.rotation,r.d.xyz)/body.position.w;
  for(var axis=0u;axis<3u;axis++) {
    let d=direction[axis]; let o=origin[axis];
    // Uniform scale can make a valid local direction arbitrarily small.
    if(d==0.0) {
      if(o<lo[axis] || o>hi[axis]) { return MISS; }
    } else {
      let a=(lo[axis]-o)/d; let c=(hi[axis]-o)/d;
      enter=max(enter,min(a,c)); leave=min(leave,max(a,c));
    }
  }
  if(enter>leave) { return MISS; }
  let extent=hi-lo;
  let tolerance=max(1e-6, min(extent.x,min(extent.y,extent.z))*1e-4)*body.position.w;
  var t=enter;
  for(var i=0u;i<512u;i++) {
    let s=worldField(body,r.o.xyz+r.d.xyz*t);
    if(s.phi<=tolerance) {
      var normal=unit(s.gradient);
      if(t==0.0 && s.phi<=0.0) { normal=-r.d.xyz; }
      return Hit(t,normal);
    }
    let next=t+s.phi/body.lo.w*0.9;
    if(next<=t || next>leave) { return MISS; }
    t=next;
  }
  // A bounded query that failed to converge is a miss, never a fabricated hit.
  return MISS;
}
${m}
`,D=class e{pairs=[];prior=[];disposed=!1;config;uniform;prepareGroup;buffers=[];eventManifolds;eventContacts;eventCounters;raycaster=null;eventPipeline;spatial;bindings;params;solver;sdf;preparePipeline;exportPipeline;filterPipeline;static async createAutomatic(e,t,n={},r={}){if(e.isDestroyed)throw Error(`SDF solver was destroyed`);if(!t.length||t.length!==e.bodyCount)throw Error(`SDF bridge requires a field for every GPU body slot`);let a=i(e.device,t,r);return e.reserveCollisionCapacity(a.maxPairs*a.maxPoints),this.create(e,t,[],n,a)}static async create(n,r,i,a={},s,u=5){if(n.isDestroyed)throw Error(`SDF solver was destroyed`);if(r.length!==n.bodyCount||!r.length)throw Error(`SDF bridge requires a field for every GPU body slot`);if(Math.ceil(r.length/64)>n.device.limits.maxComputeWorkgroupsPerDimension)throw Error(`SDF body preparation exceeds workgroup limit`);if(n.device.limits.maxStorageBuffersPerShaderStage<8)throw Error(`SDF bridge requires eight storage bindings`);for(let e of r)if(!(Math.fround(e.scale??1)>0)||!Number.isFinite(Math.fround(e.scale??1)))throw Error(`Invalid SDF bridge scale`);for(let e of r)if(e.rotation&&(e.rotation.length!==4||!e.rotation.every(Number.isFinite)||Math.abs(Math.hypot(...e.rotation)-1)>1e-5))throw Error(`SDF field rotation must be a unit quaternion`);let d={...l(),...a};if(!Number.isFinite(Math.fround(d.allowedPenetration))||d.allowedPenetration<0)throw Error(`Invalid SDF allowed penetration`);let f=o(s?.maxPoints??u);t(i.length,0,n.params.dt,d,f);let p=s?.maxPairs??Math.max(1,i.length);if(p*f>Math.min(n.contactCapacity,n.manifoldCapacity))throw Error(`SDF bridge requires capacity for ${f} contacts/manifolds per candidate pair`);let m=await b.create(n.device,r.map(e=>e.field),{maxBodies:r.length,maxPairs:p,meshVertexContacts:d.meshVertexContacts,maxPoints:f}),h=null;try{let t=async(e,t)=>{let r=n.device.createShaderModule({code:e}),i=(await r.getCompilationInfo()).messages.filter(e=>e.type===`error`);if(i.length)throw Error(i.map(e=>e.message).join(`
`));return n.device.createComputePipelineAsync({layout:`auto`,compute:{module:r,entryPoint:t}})},a=await t(x,`prepare`),o=await t(S(f),`exportContacts`),l=await t(C,`filterPairs`),u=await t(w(f),`reportPairs`);if(s&&(h=await c.create(n.device,r.length,s)),n.isDestroyed)throw Error(`SDF solver was destroyed during setup`);return new e(n,r,i,d,m,a,o,l,u,h)}catch(e){throw h?.destroy(),m.destroy(),e}}constructor(e,t,n,r,i,a,o,s,c,l){this.bindings=t.map(e=>({...e,rotation:e.rotation?[...e.rotation]:void 0})),this.spatial=l,this.solver=e,this.sdf=i,this.preparePipeline=a,this.exportPipeline=o,this.filterPipeline=s,this.params=r,this.eventPipeline=c;let u=e.device;try{this.config=u.createBuffer({size:t.length*32,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.buffers.push(this.config),this.uniform=u.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.buffers.push(this.uniform);let r=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST;this.eventManifolds=u.createBuffer({size:i.options.maxPairs*32,usage:r}),this.buffers.push(this.eventManifolds),this.eventContacts=u.createBuffer({size:i.options.maxPairs*64,usage:r}),this.buffers.push(this.eventContacts),this.eventCounters=u.createBuffer({size:64,usage:r}),this.buffers.push(this.eventCounters);let o=new Uint32Array(t.length*8),s=new Float32Array(o.buffer),c=new Map;t.forEach((e,t)=>{let n=i.atlas.offsets.get(e.field);c.has(n)||c.set(n,T(i.atlas,n)),o[t*8]=n,s[t*8+1]=e.scale??1,s[t*8+2]=c.get(n),s.set(e.rotation??[0,0,0,1],t*8+4)}),u.queue.writeBuffer(this.config,0,o),this.prepareGroup=this.group(a,[e.bodyBuffer,this.config,i.storage.atlas,i.storage.bodies]),l||this.setPairs(n)}catch(e){for(let e of this.buffers)e.destroy();throw e}}group(e,t){return this.solver.device.createBindGroup({layout:e.getBindGroupLayout(0),entries:t.map((e,t)=>({binding:t,resource:{buffer:e}}))})}setPairs(e){if(this.disposed)throw Error(`SDF bridge is disposed`);if(this.spatial)throw Error(`Automatic SDF candidates are GPU generated`);if(e.length>this.sdf.options.maxPairs)throw Error(`SDF candidate capacity exceeded`);let t=e.map(({a:e,b:t,key:n})=>({a:e,b:t,key:n}));s(t,this.sdf.options.maxBodies,0);let n=new Set;for(let e of t){let t=`${e.a}:${e.b}`;if(e.a<=e.b||n.has(t))throw Error(`SDF candidates require unique body pairs with a > b`);n.add(t)}this.pairs=t}prepare(e){if(this.disposed||e!==this.solver)throw Error(`Invalid SDF bridge owner/lifecycle`);if(e.bodyCount!==this.sdf.options.maxBodies)throw Error(`Recreate SDF bridge after changing body slots`);if((this.spatial?this.sdf.options.maxPairs:this.pairs.length)*this.sdf.maxPoints>Math.min(e.contactCapacity,e.manifoldCapacity))throw Error(`Insufficient SDF solver contact capacity`);if(!Number.isFinite(Math.fround(this.params.allowedPenetration))||this.params.allowedPenetration<0)throw Error(`Invalid SDF allowed penetration`);t(this.pairs.length,0,e.params.dt,this.params,this.sdf.maxPoints)}encode(e,t){e.setPipeline(this.preparePipeline),e.setBindGroup(0,this.prepareGroup),e.dispatchWorkgroups(Math.ceil(this.sdf.options.maxBodies/64));let n=new Uint32Array(8),r=new Float32Array(n.buffer),i=this.spatial?this.sdf.options.maxPairs:this.pairs.length;if(n[0]=i,r[4]=this.params.margin,r[5]=this.params.allowedPenetration,r[6]=this.params.refreshDeeperContacts?this.params.tolerance:0,this.solver.device.queue.writeBuffer(this.uniform,0,n),this.spatial)this.sdf.encodeGeneratedPairs(e,this.solver.params.dt,this.params,()=>this.spatial.encode(e,t,this.sdf,this.params.margin));else{let n=new Map(this.prior.map((e,t)=>[e.key,t])),r=this.pairs.map(e=>{let t=n.get(e.key),r=t===void 0?void 0:this.prior[t],i=r&&r.a===e.a&&r.b===e.b?t:-1;return{...e,...i>=0?{previous:i}:{}}}),i=this.sdf.storage,a=this.group(this.filterPipeline,[t.params,this.uniform,i.bodies,i.pairs,t.statics,t.joints,t.filters]);this.sdf.encodeFromGpu(e,this.sdf.options.maxBodies,r,this.solver.params.dt,this.params,()=>{r.length&&(e.setPipeline(this.filterPipeline),e.setBindGroup(0,a),e.dispatchWorkgroups(Math.ceil(r.length/64)))})}let a=this.sdf.storage,o=this.group(this.exportPipeline,[t.params,this.uniform,t.bodies,a.current,a.previous,a.pairs,t.previousContacts,t.contacts,t.manifolds,t.counters]);i&&(e.setPipeline(this.exportPipeline),e.setBindGroup(0,o),e.dispatchWorkgroups(Math.ceil(i/64))),this.prior=this.pairs.map(e=>({...e}))}contactEventStorage(){this.prepare(this.solver);let e=this.solver.device,t=e.createCommandEncoder(),n=t.beginComputePass(),r=this.group(this.eventPipeline,[this.uniform,this.sdf.storage.current,this.solver.contactStorage.contacts,this.eventManifolds,this.eventContacts,this.eventCounters]);return n.setPipeline(this.eventPipeline),n.setBindGroup(0,r),n.dispatchWorkgroups(Math.max(1,Math.ceil((this.spatial?this.sdf.options.maxPairs:this.prior.length)/64))),n.end(),e.queue.submit([t.finish()]),{manifolds:this.eventManifolds,contacts:this.eventContacts,counters:this.eventCounters}}raycasts(e,t,n){if(this.prepare(this.solver),e.length>256)throw Error(`SDF raycasts support at most 256 rays per call`);for(let t of e){let e=[t.origin[0],t.origin[1],t.origin[2],t.direction[0],t.direction[1],t.direction[2],t.maxDistance??3e38];if(!e.every(e=>Number.isFinite(Math.fround(e)))||Math.hypot(...e.slice(3,6))===0||e[6]<0)throw Error(`SDF ray requires finite origin, nonzero direction and nonnegative distance`)}this.raycaster??=new p(this.solver.device,E);let r=this.solver.device.createCommandEncoder(),i=r.beginComputePass();return i.setPipeline(this.preparePipeline),i.setBindGroup(0,this.prepareGroup),i.dispatchWorkgroups(Math.ceil(this.sdf.options.maxBodies/64)),i.end(),this.solver.device.queue.submit([r.finish()]),this.raycaster.cast(this.sdf.storage.bodies,this.sdf.storage.atlas,this.solver.filterStorage,this.sdf.options.maxBodies,e,t,n)}get capacity(){return this.sdf.options.maxPairs}grown(t){if(this.disposed||!this.spatial)throw Error(`SDF growth requires an active spatial bridge`);if(!Number.isSafeInteger(t)||t<=this.capacity)throw Error(`Invalid SDF requested capacity`);let n=Math.min(this.solver.device.limits.maxBufferSize,this.solver.device.limits.maxStorageBufferBindingSize),i=Math.max(t,Math.min(this.capacity*2,Math.floor(n/(r(this.sdf.maxPoints)*4)))),a;try{a=this.spatial.resized(i)}catch(e){if(i===t)throw e;i=t,a=this.spatial.resized(i)}let o,s;try{return o=this.sdf.resized(i),this.solver.reserveCollisionCapacity(i*this.sdf.maxPoints),s=new e(this.solver,this.bindings,[],{...this.params},o,this.preparePipeline,this.exportPipeline,this.filterPipeline,this.eventPipeline,a),s.inheritHistory(this,Array(this.bindings.length).fill(!0)),s}catch(e){throw s?s.destroy():(o?.destroy(),a.destroy()),e}}inheritHistory(e,t){if(this.disposed||e.disposed||this.solver!==e.solver||!this.spatial||!e.spatial)throw Error(`Invalid SDF bridge history transfer`);this.sdf.inheritHistory(e.sdf,t)}async readResults(){let e=await this.sdf.readResults();return this.spatial?e.filter(e=>e.a!==4294967295):e}readBroadphaseStats(){if(!this.spatial)throw Error(`Explicit candidates have no spatial grid`);return this.spatial.readStats()}destroy(){if(!this.disposed){this.disposed=!0,this.spatial?.destroy(),this.sdf.destroy();for(let e of this.buffers)e.destroy()}}};export{D as SdfCollisionBridge};