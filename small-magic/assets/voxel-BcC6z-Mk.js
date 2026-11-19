var e=3e38,t=.05,n=`
const T_NONE = 0;

const MAX_COLORS = 64u;
const NO_COLOR = 255u;
const PENDING = 256u;

const C_PAIRS = 0u;
const C_CONTACTS = 1u;
const C_PREV_CONTACTS = 2u;
const C_OVERFLOW = 3u;
const C_CLASHES = 4u;
const C_NUM_COLORS = 5u;

const IA_PAIRS = 0u;
const IA_CONTACTS = 3u;
const IA_PREV = 6u;
const IA_CONSTRAINTS = 9u;
const IA_COLOR = 12u;

const WG = 64u;
const COLOR_WG = 256u;

const BIG = 3e38;
const HARD = 1e30;

fn groupsFor(n: u32) -> u32 {
  return (n + WG - 1u) / WG;
}

/** lowbias32 integer hash (same as the CPU colouring priorities). */
fn hash32(v: u32) -> u32 {
  var x = v;
  x ^= x >> 16u;
  x *= 0x7feb352du;
  x ^= x >> 15u;
  x *= 0x846ca68bu;
  x ^= x >> 16u;
  return x;
}
`,r=`
// Shared by every 2D module (layout.ts)
${n}
const T_JOINT = 1;
const T_SPRING = 2;
const T_MOTOR = 3;

const PENALTY_MIN = 1.0;
const PENALTY_MAX = 1e9;
const STICK_THRESH = 0.01;
const COLLISION_MARGIN = 0.0005;

const FLAG_VBD = 1u;
const FLAG_RESCALE = 2u;
const FLAG_POST_STABILIZE = 4u;
const FLAG_MATCH_NEAREST = 8u;
const NEAREST_FRACTION = ${t};

struct Body {
  pose: vec4f,      // x, y, angle, friction
  initial: vec4f,   // pose at the start of the step (x-)
  inertial: vec4f,  // inertial target y
  vel: vec4f,
  prevVel: vec4f,
  shape: vec4f,     // width, height, mass, moment
}

struct Joint {
  pen: vec4f,       // per-row penalty (stiffness parameter k)
  lam: vec4f,       // per-row dual variable
  stiff: vec4f,     // per-row material stiffness (>= HARD: hard constraint)
  fmin: vec4f,
  fmax: vec4f,
  frac: vec4f,      // per-row fracture threshold on |lambda|
  c0: vec4f,        // C(x-)
  anchors: vec4f,   // rA.xy (world point for world joints), rB.xy
  param: vec4f,     // joint: restAngle, torqueArm; spring: rest; motor: speed
}

struct Contact {
  ids: vec4u,       // bodyA, bodyB (A > B), feature key, stick flag
  pl: vec4f,        // penalty normal/tangent, lambda normal/tangent
  anchors: vec4f,   // rA.xy, rB.xy in body-local space
  geo: vec4f,       // C0 normal, C0 tangent, normal.xy (B to A)
  misc: vec4f,      // friction
}

struct Params {
  dt: f32,
  gravity: f32,
  beta: f32,
  gamma: f32,
  alpha: f32,
  vbdStiffness: f32,
  flags: u32,
  bodyCount: u32,
  jointCount: u32,
  colorCap: u32,
  cellSize: f32,
  tableMask: u32,
  maxSmallRadius: f32,
  largeCount: u32,
  noCollideCount: u32,
  pairCapacity: u32,
  contactCapacity: u32,
  hashMask: u32,
  adjFillOffset: u32,
  adjListOffset: u32,
  gridCursorOffset: u32,
  gridSortedOffset: u32,
  gridCellOffset: u32,
  stateBOffset: u32,
  colorHistOffset: u32,   // per (colour, workgroup) body counts, scanned into slot offsets
  colorStartOffset: u32,
  colorGroups: u32,       // workgroups of COLOR_WG bodies covering the body capacity
  colorBodiesOffset: u32,
  rounds: u32,
  pad0: u32,
  pad1: u32,
  pad2: u32,
}

/**
 * (cos x, sin x) to ~1e-7. WGSL promises the built-ins only to 2^-11 absolute and GPUs differ:
 * on an M1 Pro, stiff springs (Spring Ratio) drifted 9 cm from the CPU in 60 steps and a
 * single friction step missed by 1.2e-4, where the M4 Max tracked to 1.6e-4 and 4e-6; rounding
 * the built-ins to 2^-13 on the M4 reproduced it. Cody-Waite reduction by pi/2 (three-part
 * constant) and the Cephes single-precision polynomials on [-pi/4, pi/4].
 */
fn cosSin(x: f32) -> vec2f {
  let q = floor(x * 0.63661977236 + 0.5);
  // fma keeps the three parts apart: written as subtractions, fast math folded them back into
  // one rounded pi/2 and the error grew with the angle (2.8e-6 at 100 rad)
  let r = fma(-q, 7.549789954891882e-8, fma(-q, 4.837512969970703e-4, fma(-q, 1.5703125, x)));
  let z = r * r;
  let s = r + r * z * (-1.6666654611e-1 + z * (8.3321608736e-3 + z * -1.9515295891e-4));
  let c = 1.0 - 0.5 * z + z * z * (4.1666645683e-2 + z * (-1.3887316255e-3 + z * 2.4433157468e-5));
  switch (u32(i32(q)) & 3u) {
    case 0u: { return vec2f(c, s); }
    case 1u: { return vec2f(-s, c); }
    case 2u: { return vec2f(-c, -s); }
    default: { return vec2f(s, -c); }
  }
}

fn rot(angle: f32, v: vec2f) -> vec2f {
  let cs = cosSin(angle);
  return vec2f(cs.x * v.x - cs.y * v.y, cs.y * v.x + cs.x * v.y);
}

`,i=(e,t={counter:`C_CONTACTS`,prevCounter:`C_PREV_CONTACTS`,capacity:`params.contactCapacity`})=>`
${e}
${t.colorThreads??`fn colorThreads(bodies: u32) -> u32 { return bodies; }`}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> counters: array<u32>;
@group(0) @binding(2) var<storage, read> color: array<u32>;
@group(0) @binding(3) var<storage, read_write> args: array<u32>;

fn setArgs(at: u32, count: u32) {
  args[at] = groupsFor(count);
  args[at + 1u] = 1u;
  args[at + 2u] = 1u;
}

@compute @workgroup_size(1)
fn argsPrev() {
  setArgs(IA_PREV, counters[${t.prevCounter}]);
}

@compute @workgroup_size(1)
fn argsPairs() {
  setArgs(IA_PAIRS, min(counters[C_PAIRS], params.pairCapacity));
}

@compute @workgroup_size(1)
fn argsContacts() {
  let items = min(counters[${t.counter}], ${t.capacity});
  setArgs(IA_CONTACTS, items);
  setArgs(IA_CONSTRAINTS, params.jointCount + items);
}

@compute @workgroup_size(64)
fn argsColors(@builtin(local_invocation_id) lid: vec3u) {
  let c = lid.x;
  ${t.colors??`setArgs(IA_COLOR + 3u * c, colorThreads(color[params.colorStartOffset + c + 1u] - color[params.colorStartOffset + c]));`}
}
`;i(r);var a=[`collision`,`adjacency`,`coloring`,`solve`],o=2147483648,s=3<<24,c=536870912,l=.1,u=.002,d=.002,f=`
// Shared by every 3D module (avbd3d/gpu/layout.ts)
${n}
const T_JOINT = 1;
const T_SPRING = 2;

const PENALTY_MIN = 1.0;
const PENALTY_MAX = 1e10;
// Least LDLᵀ pivot of the primal solve, relative to its diagonal (wgsl-solve.ts finishBody)
const PIVOT_FLOOR = 1e-5;
const COLLISION_MARGIN = 0.01;
const STICK_THRESH = 0.00001;

const SHAPE_SPHERE = 1.0;
const SHAPE_SAIL = 2.0;
const SHAPE_HULL = 3.0;
const STICK_BIT = ${o}u;
const C_MANIFOLDS = 6u;
const C_PREV_MANIFOLDS = 7u;
const C_CLASHING_COLORS = 9u;
/** Feature key of every contact involving a sphere (one contact per pair). */
const SPHERE_FEATURE = ${s}u;
// SDF contact on a rolling analytic body (sphere..torus): evaluate lever arms at the step-start
// rotation, like SPHERE_FEATURE. Ordinary SDF ids stay below it; built-in features never set it.
const SDF_ROLLING_BIT = ${c}u;

const FLAG_MATCH_NEAREST = 1u;
const FLAG_FACE_BIAS = 2u;
const FLAG_REUSE_CONTACTS = 4u;
const FLAG_START_AT_REST = 8u;
const FLAG_MASS_PENALTY = 16u;
const FLAG_REUSE_MANIFOLDS = 64u;
const FLAG_SPARSE_COLORS = 32u;
const SPARSE_COLOR_START = 16u;
const REST_SPEED = ${l};
const NEAREST_FRACTION = 0.05;

struct Body {
  pos: vec4f,          // xyz, w: friction
  rot: vec4f,          // orientation quaternion (x, y, z, w)
  initialPos: vec4f,   // pose at the start of the step (x-)
  initialRot: vec4f,
  size: vec4f,         // full widths, w: mass (0 = static)
  moment: vec4f,       // principal moments, w: bounding radius
  inertialPos: vec4f,  // inertial target y, w: step it last moved from its reference pose (u32)
  inertialRot: vec4f,
  vel: vec4f,          // xyz, w: previous step's velocity along up (adaptive warm start)
  angVel: vec4f,       // xyz, w: shape (SHAPE_BOX, SHAPE_SPHERE, SHAPE_SAIL, or SHAPE_HULL + hull offset)
}

struct Joint {
  penLin: vec4f,  // xyz, w: linear stiffness (>= HARD: hard); spring: its stiffness
  penAng: vec4f,  // xyz, w: angular stiffness
  lamLin: vec4f,  // xyz, w: fracture threshold on |lamAng| (negative: on |lamLin| too)
  lamAng: vec4f,  // xyz, w: torque arm
  c0Lin: vec4f,   // C(x-)
  c0Ang: vec4f,   // xyz: C(x-), w: yield threshold on |lamAng| (BIG: never yields)
  rA: vec4f,      // xyz: anchor on A (world point when A is the world), w: spring rest length
  rB: vec4f,      // xyz: anchor on B, w: bend limit in radians (BIG: a plastic joint never breaks on it)
  rest: vec4f,    // the relative rotation the angle lock holds: rotB = rotA·rest (quaternion x, y, z, w)
  restStart: vec4f, // the rest it was made with: its bend is the turn from this to rest
}

struct Manifold {
  ids: vec4u,     // bodyA, bodyB (A > B), first contact, count | generation step << 4
  geo: vec4f,     // normal (B to A), friction
}

fn pairCount(m: Manifold) -> u32 {
  return m.ids.w & 15u;
}

struct Contact {
  rA: vec3f,      // body-local anchors
  key: u32,       // feature | STICK_BIT
  rB: vec3f,
  c0x: f32,       // C(x-) in the pair's basis, including the collision margin
  pen: vec3f,     // normal, tangent, tangent
  c0y: f32,
  lam: vec3f,
  c0z: f32,
}

struct Params {
  dt: f32,
  gravity: f32,         // acceleration along up (m/s², negative: down)
  betaLin: f32,
  betaAng: f32,
  gamma: f32,
  alpha: f32,
  flags: u32,
  bodyCount: u32,
  jointCount: u32,
  colorCap: u32,
  cellSize: f32,
  tableMask: u32,
  maxSmallRadius: f32,
  largeCount: u32,
  noCollideCount: u32,
  pairCapacity: u32,
  contactCapacity: u32,
  hashMask: u32,
  adjFillOffset: u32,
  adjListOffset: u32,
  gridCursorOffset: u32,
  gridSortedOffset: u32,
  gridCellOffset: u32,
  stateBOffset: u32,
  colorHistOffset: u32,
  colorStartOffset: u32,
  colorGroups: u32,
  colorBodiesOffset: u32,
  rounds: u32,
  manifoldCapacity: u32,
  step: u32,           // steps since the solver was created (from 1)
  primalLanes: u32,    // bytes 0-2: log2 of the colour sizes from which 1, 2, 4 lanes per body suffice
  wind: vec4f,         // xyz: wind velocity (m/s), w: air pressure coefficient ½ρC_d
  gust: vec4f,         // x: gust strength (fraction of the wind)
  up: vec4f,           // xyz: which way is up (unit)
  fineGrid: vec4f,     // x: fine cell size, y: fine radius threshold, z: coarse movers present
}

fn qmul(a: vec4f, b: vec4f) -> vec4f {
  return vec4f(
    a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z);
}

fn qconj(q: vec4f) -> vec4f {
  return vec4f(-q.xyz, q.w);
}

/** The demo's quat - quat: 2·vec(a·b⁻¹), a small-angle rotation vector. */
fn qsub(a: vec4f, b: vec4f) -> vec3f {
  return qmul(a, qconj(b) / dot(b, b)).xyz * 2.0;
}

/** The demo's quat + float3: integrate a rotation vector, normalize(a + (v, 0)·a·½). */
fn qadd(a: vec4f, v: vec3f) -> vec4f {
  return normalize(a + qmul(vec4f(v, 0.0), a) * 0.5);
}

fn qrotate(q: vec4f, v: vec3f) -> vec3f {
  let t = cross(q.xyz, v) * 2.0;
  return v + t * q.w + cross(q.xyz, t);
}

/** Contact basis rows (n, t1, t2), as maths.h orthonormal(). */
fn orthonormal(n: vec3f) -> mat3x3f {
  var t1 = select(vec3f(0.0, -n.z, n.y), vec3f(-n.y, n.x, 0.0), abs(n.x) > abs(n.z));
  t1 = normalize(t1);
  // Columns of the WGSL matrix are the basis rows
  return mat3x3f(n, t1, cross(n, t1));
}
`,p=`
alias TopoItem = Manifold;

// SDF pairs have multiple one-point manifolds; atomic export slots are not stable.
@group(0) @binding(8) var<storage, read> contactPoints: array<Contact>;
fn topoSecondary(i: u32) -> u32 {
  let m=contacts[i];
  if((m.ids.w&15u)==0u) { return 0u; }
  return contactPoints[m.ids.z].key & ~STICK_BIT;
}

fn topoCount() -> u32 {
  return min(atomicLoad(&counters[C_MANIFOLDS]), params.manifoldCapacity);
}

fn dynamicBody(i: i32) -> bool {
  return i >= 0 && bodies[i].size.w > 0.0;
}

/** A joint or spring takes part unless disabled (fracture, released drag): stiffness zeroed. */
fn jointActive(j: u32) -> bool {
  let k = joints[j];
  return info[j].x != T_NONE && (k.penLin.w != 0.0 || k.penAng.w != 0.0);
}
`,m=`
fn lanesFor(bodies: u32) -> u32 {
  let rule = params.primalLanes;
  if (bodies >= (1u << (rule & 255u))) { return 1u; }
  if (bodies >= (1u << ((rule >> 8u) & 255u))) { return 2u; }
  if (bodies >= (1u << ((rule >> 16u) & 255u))) { return 4u; }
  return 8u;
}

fn colorThreads(bodies: u32) -> u32 {
  return bodies * lanesFor(bodies);
}
`,h={counter:`C_MANIFOLDS`,prevCounter:`C_PREV_MANIFOLDS`,capacity:`params.manifoldCapacity`,colorThreads:m},g=`
const MAX_CLIP = 64u;
const NO_HULL = 0xffffffffu;

/** A convex shape as the hull code sees it: a box (hull = NO_HULL, extents h) or a hull. */
struct Poly {
  c: vec3f,
  q: vec4f,
  h: vec3f,
  hull: u32,
  vs: u32, nv: u32, fs: u32, nf: u32, es: u32, ne: u32, is: u32,
}

// Box topology: vertex v has signs (bit 0: x, 1: y, 2: z); faces +x -x +y -y +z -z as vertex
// loops; edges as vertex a, vertex b, the two faces they separate.
var<private> BOX_FACE_VERTS: array<u32, 24> = array<u32, 24>(1u, 3u, 7u, 5u, 0u, 2u, 6u, 4u, 2u, 3u, 7u, 6u, 0u, 1u, 5u, 4u, 4u, 5u, 7u, 6u, 0u, 1u, 3u, 2u);
var<private> BOX_EDGES: array<vec4u, 12> = array<vec4u, 12>(
  vec4u(0u, 1u, 3u, 5u), vec4u(2u, 3u, 2u, 5u), vec4u(4u, 5u, 3u, 4u), vec4u(6u, 7u, 2u, 4u),
  vec4u(0u, 2u, 1u, 5u), vec4u(1u, 3u, 0u, 5u), vec4u(4u, 6u, 1u, 4u), vec4u(5u, 7u, 0u, 4u),
  vec4u(0u, 4u, 1u, 3u), vec4u(1u, 5u, 0u, 3u), vec4u(2u, 6u, 1u, 2u), vec4u(3u, 7u, 0u, 2u));

fn isHull(i: u32) -> bool {
  return bodies[i].angVel.w >= SHAPE_HULL;
}

fn polyOf(i: u32) -> Poly {
  var P: Poly;
  P.c = bodies[i].pos.xyz;
  P.q = bodies[i].rot;
  P.h = bodies[i].size.xyz * 0.5;
  P.hull = NO_HULL;
  P.nv = 8u; P.nf = 6u; P.ne = 12u;
  if (isHull(i)) {
    let h = u32(bodies[i].angVel.w - SHAPE_HULL + 0.5);
    let h0 = hulls[h];
    let h1 = hulls[h + 1u];
    P.hull = h;
    P.vs = h0.x; P.nv = h0.y; P.fs = h0.z; P.nf = h0.w;
    P.es = h1.x; P.ne = h1.y; P.is = h1.z;
  }
  return P;
}

fn vertLocal(P: Poly, v: u32) -> vec3f {
  if (P.hull == NO_HULL) {
    return vec3f(select(-P.h.x, P.h.x, (v & 1u) != 0u), select(-P.h.y, P.h.y, (v & 2u) != 0u), select(-P.h.z, P.h.z, (v & 4u) != 0u));
  }
  return bitcast<vec4f>(hulls[P.vs + v]).xyz;
}

fn vert(P: Poly, v: u32) -> vec3f {
  return P.c + qrotate(P.q, vertLocal(P, v));
}

/** Face f's world plane: outward normal (xyz) and offset (w). */
fn facePlane(P: Poly, f: u32) -> vec4f {
  var nl: vec3f;
  var d: f32;
  if (P.hull == NO_HULL) {
    let k = f / 2u;
    let s = select(1.0, -1.0, (f & 1u) != 0u);
    nl = vec3f(0.0);
    nl[k] = s;
    d = P.h[k];
  } else {
    let p = bitcast<vec4f>(hulls[P.fs + 2u * f]);
    nl = p.xyz;
    d = p.w;
  }
  let n = qrotate(P.q, nl);
  return vec4f(n, d + dot(n, P.c));
}

fn faceVertCount(P: Poly, f: u32) -> u32 {
  if (P.hull == NO_HULL) { return 4u; }
  return hulls[P.fs + 2u * f + 1u].y;
}

fn faceVert(P: Poly, f: u32, j: u32) -> u32 {
  if (P.hull == NO_HULL) { return BOX_FACE_VERTS[f * 4u + j]; }
  let k = hulls[P.fs + 2u * f + 1u].x + j;
  return hulls[P.is + k / 4u][k % 4u];
}

fn edgeOf(P: Poly, e: u32) -> vec4u {
  if (P.hull == NO_HULL) { return BOX_EDGES[e]; }
  return hulls[P.es + e];
}

fn polySupport(P: Poly, dir: vec3f) -> vec3f {
  let l = qrotate(qconj(P.q), dir);
  if (P.hull == NO_HULL) { return P.c + qrotate(P.q, select(-P.h, P.h, l >= vec3f(0.0))); }
  var best = -3.4e38;
  var at = vec3f(0.0);
  for (var v = 0u; v < P.nv; v++) {
    let p = bitcast<vec4f>(hulls[P.vs + v]).xyz;
    let s = dot(p, l);
    if (s > best) { best = s; at = p; }
  }
  return P.c + qrotate(P.q, at);
}

struct FaceQuery { sep: f32, face: u32 }

/** The face of A whose plane B sticks out of least (largest separation). */
fn queryFaces(A: Poly, B: Poly) -> FaceQuery {
  var out = FaceQuery(-3.4e38, 0u);
  for (var f = 0u; f < A.nf; f++) {
    let p = facePlane(A, f);
    let s = dot(p.xyz, polySupport(B, -p.xyz)) - p.w;
    if (s > out.sep) { out = FaceQuery(s, f); }
  }
  return out;
}

/** The edges' Gauss-map arcs (a-b on A's, c-d on B's negated) cross: their cross product is a candidate axis. */
fn minkowskiFace(a: vec3f, b: vec3f, c: vec3f, d: vec3f) -> bool {
  let bxa = cross(b, a);
  let dxc = cross(d, c);
  let cba = dot(c, bxa);
  let dba = dot(d, bxa);
  let adc = dot(a, dxc);
  let bdc = dot(b, dxc);
  return cba * dba < 0.0 && adc * bdc < 0.0 && cba * bdc > 0.0;
}

struct EdgeQuery { sep: f32, ea: u32, eb: u32, n: vec3f, valid: bool }

/** Face f's outward normal in the shape's own frame. */
fn faceNormalLocal(P: Poly, f: u32) -> vec3f {
  if (P.hull == NO_HULL) {
    var n = vec3f(0.0);
    n[f / 2u] = select(1.0, -1.0, (f & 1u) != 0u);
    return n;
  }
  return bitcast<vec4f>(hulls[P.fs + 2u * f]).xyz;
}

fn queryEdges(A: Poly, B: Poly) -> EdgeQuery {
  var out: EdgeQuery;
  out.sep = -3.4e38;
  // The Gauss-map test in B's frame: A's normals turned once per A edge, B's read as stored
  let toB = qmul(qconj(B.q), A.q);
  for (var i = 0u; i < A.ne; i++) {
    let ea = edgeOf(A, i);
    let a = qrotate(toB, faceNormalLocal(A, ea.z));
    let b = qrotate(toB, faceNormalLocal(A, ea.w));
    for (var j = 0u; j < B.ne; j++) {
      let eb = edgeOf(B, j);
      if (!minkowskiFace(a, b, -faceNormalLocal(B, eb.z), -faceNormalLocal(B, eb.w))) { continue; }
      let pa = vert(A, ea.x);
      let qa = vert(A, ea.y);
      let pb = vert(B, eb.x);
      let qb = vert(B, eb.y);
      var n = cross(qa - pa, qb - pb);
      let l = length(n);
      // Parallel edges: their faces' normals already cover the axis
      if (l < 1e-5 * length(qa - pa) * length(qb - pb)) { continue; }
      n /= l;
      if (dot(n, pa - A.c) < 0.0) { n = -n; }
      let s = dot(n, pb - pa);
      if (s > out.sep) { out = EdgeQuery(s, i, j, n, true); }
    }
  }
  return out;
}

/** Clip poly (n points) to dot(pn, x) <= offset. */
fn clipHull(src: ptr<function, array<vec3f, 64>>, n: u32, dst: ptr<function, array<vec3f, 64>>, pn: vec3f, offset: f32) -> u32 {
  if (n == 0u) { return 0u; }
  var count = 0u;
  var a = (*src)[n - 1u];
  var da = dot(pn, a) - offset;
  for (var i = 0u; i < n; i++) {
    let b = (*src)[i];
    let db = dot(pn, b) - offset;
    if ((da <= PLANE_EPSILON) != (db <= PLANE_EPSILON)) {
      var t = 0.0;
      if (abs(da - db) > SAT_AXIS_EPSILON) { t = clamp(da / (da - db), 0.0, 1.0); }
      if (count < MAX_CLIP) { (*dst)[count] = a + (b - a) * t; count++; }
    }
    if (db <= PLANE_EPSILON && count < MAX_CLIP) { (*dst)[count] = b; count++; }
    a = b;
    da = db;
  }
  return count;
}

/** Face contact: A's (refIsA) or B's face refFace is the reference face; the other shape's is clipped to it. */
fn hullFaceContact(A: Poly, B: Poly, refIsA: bool, refFace: u32) -> Found {
  var found: Found;
  var R = B;
  var I = A;
  if (refIsA) { R = A; I = B; }
  let plane = facePlane(R, refFace);
  let rn = plane.xyz;
  // Incident face: the other shape's most anti-parallel among those with its deepest vertex. The
  // most anti-parallel of all may not touch that vertex on an irregular hull (it does on a box), and
  // clipping it would then leave the deepest corner without a contact.
  var deepest = 0u;
  var low = 3.4e38;
  for (var v = 0u; v < I.nv; v++) {
    let d = dot(vert(I, v), rn);
    if (d < low) { low = d; deepest = v; }
  }
  var inc = 0u;
  var least = 3.4e38;
  for (var f = 0u; f < I.nf; f++) {
    var touches = false;
    for (var j = 0u; j < faceVertCount(I, f); j++) { if (faceVert(I, f, j) == deepest) { touches = true; break; } }
    if (!touches) { continue; }
    let d = dot(facePlane(I, f).xyz, rn);
    if (d < least) { least = d; inc = f; }
  }
  var poly: array<vec3f, 64>;
  var tmp: array<vec3f, 64>;
  var n = min(faceVertCount(I, inc), MAX_CLIP);
  for (var j = 0u; j < n; j++) { poly[j] = vert(I, faceVert(I, inc, j)); }
  // Side planes of the reference face, outward from its centre
  let k = faceVertCount(R, refFace);
  var centre = vec3f(0.0);
  for (var j = 0u; j < k; j++) { centre += vert(R, faceVert(R, refFace, j)); }
  centre /= f32(k);
  for (var j = 0u; j < k && n > 0u; j++) {
    let v0 = vert(R, faceVert(R, refFace, j));
    let v1 = vert(R, faceVert(R, refFace, (j + 1u) % k));
    var s = cross(v1 - v0, rn);
    let l = length(s);
    if (l < SAT_AXIS_EPSILON) { continue; }
    s /= l;
    if (dot(s, centre - v0) > 0.0) { s = -s; }
    n = clipHull(&poly, n, &tmp, s, dot(s, v0));
    for (var m = 0u; m < n; m++) { poly[m] = tmp[m]; }
  }
  // Points on or below the reference plane; at most MAX_CONTACTS, the deepest first then the
  // farthest from those chosen (the patch's extent is what keeps a resting shape upright)
  // (feature keys use the point's index in the clipped polygon, as faceManifold does: stable from
  // step to step, so warm starts and static-friction anchors stay with their point)
  var depth: array<f32, 64>;
  var index: array<u32, 64>;
  var keep = 0u;
  for (var m = 0u; m < n; m++) {
    let dist = dot(rn, poly[m]) - plane.w;
    if (dist <= PLANE_EPSILON) { tmp[keep] = poly[m]; depth[keep] = dist; index[keep] = m; keep++; }
  }
  let prefix = (select(AXIS_FACE_B, AXIS_FACE_A, refIsA) << 24u) | (min(refFace, 255u) << 16u) | (min(inc, 255u) << 8u);
  var chosen: array<bool, 64>;
  for (var c = 0u; c < min(keep, MAX_CONTACTS); c++) {
    var pick = 0u;
    var bestScore = -3.4e38;
    for (var m = 0u; m < keep; m++) {
      if (chosen[m]) { continue; }
      var score = -depth[m];
      if (c > 0u) {
        score = 3.4e38;
        for (var o = 0u; o < keep; o++) { if (chosen[o]) { score = min(score, dot(tmp[m] - tmp[o], tmp[m] - tmp[o])); } }
      }
      if (score > bestScore) { bestScore = score; pick = m; }
    }
    chosen[pick] = true;
    let p = tmp[pick];
    let onRef = p - rn * depth[pick];
    addFound(&found, select(p, onRef, refIsA), select(onRef, p, refIsA), prefix | min(index[pick], 255u));
  }
  if (found.count == 0u) {
    let nAB = select(-rn, rn, refIsA);
    addFound(&found, polySupport(A, nAB), polySupport(B, -nAB), prefix);
  }
  return found;
}

fn hullEdgeContact(A: Poly, B: Poly, q: EdgeQuery) -> Found {
  var found: Found;
  let ea = edgeOf(A, q.ea);
  let eb = edgeOf(B, q.eb);
  let p0 = vert(A, ea.x);
  let q0 = vert(B, eb.x);
  let d1 = vert(A, ea.y) - p0;
  let d2 = vert(B, eb.y) - q0;
  let r = p0 - q0;
  let a = dot(d1, d1);
  let e = dot(d2, d2);
  let f = dot(d2, r);
  let c = dot(d1, r);
  let b = dot(d1, d2);
  let denom = a * e - b * b;
  var s = 0.0;
  if (abs(denom) > SAT_AXIS_EPSILON * a * e) { s = clamp((b * f - c * e) / denom, 0.0, 1.0); }
  var t = (b * s + f) / max(e, SAT_AXIS_EPSILON);
  if (t < 0.0) { t = 0.0; s = clamp(-c / max(a, SAT_AXIS_EPSILON), 0.0, 1.0); }
  else if (t > 1.0) { t = 1.0; s = clamp((b - c) / max(a, SAT_AXIS_EPSILON), 0.0, 1.0); }
  addFound(&found, p0 + d1 * s, q0 + d2 * t, (AXIS_EDGE << 24u) | (min(q.ea, 255u) << 8u) | min(q.eb, 255u));
  return found;
}

/** Collide two convex shapes (at least one a hull); sat.n from A towards B. */
fn collidePoly(A: Poly, B: Poly, sat: ptr<function, Sat>) -> Found {
  var none: Found;
  let fa = queryFaces(A, B);
  if (fa.sep > 0.0) { return none; }
  let fb = queryFaces(B, A);
  if (fb.sep > 0.0) { return none; }
  let eq = queryEdges(A, B);
  if (eq.valid && eq.sep > 0.0) { return none; }
  // Faces are preferred (stabler manifolds) unless an edge axis is clearly better, as in collide
  let faceSep = max(fa.sep, fb.sep);
  var edgeWins = eq.valid && eq.sep > 0.95 * faceSep + 0.01;
  if ((params.flags & FLAG_FACE_BIAS) == 0u) { edgeWins = eq.valid && 0.95 * eq.sep > faceSep + 0.01; }
  if (edgeWins) {
    *sat = Sat(AXIS_EDGE, eq.ea, eq.eb, eq.sep, eq.n, true);
    return hullEdgeContact(A, B, eq);
  }
  // A's face unless B's separates more, as collide does
  if (fb.sep > fa.sep) {
    *sat = Sat(AXIS_FACE_B, 0u, fb.face, fb.sep, -facePlane(B, fb.face).xyz, true);
    return hullFaceContact(A, B, false, fb.face);
  }
  *sat = Sat(AXIS_FACE_A, fa.face, 0u, fa.sep, facePlane(A, fa.face).xyz, true);
  return hullFaceContact(A, B, true, fa.face);
}

/** Closest point of segment ab to p. */
fn segmentPoint(a: vec3f, b: vec3f, p: vec3f) -> vec3f {
  let d = b - a;
  return a + d * clamp(dot(p - a, d) / max(dot(d, d), 1e-20), 0.0, 1.0);
}

/** Sphere S (centre c, radius r) against hull X: as sphereBox (n from the sphere towards X). */
fn sphereHull(c: vec3f, r: f32, X: Poly) -> SphereBoxHit {
  var out: SphereBoxHit;
  var deepest = -3.4e38;
  var deepFace = 0u;
  for (var f = 0u; f < X.nf; f++) {
    let s = dot(facePlane(X, f).xyz, c) - facePlane(X, f).w;
    if (s > deepest) { deepest = s; deepFace = f; }
  }
  if (deepest > r) { return out; }
  if (deepest <= 0.0) {
    // Centre inside: out through the face it is least deep behind
    let n = facePlane(X, deepFace).xyz;
    out.hit = true;
    out.n = -n;
    out.onBox = c - n * deepest;
    out.onSphere = c - n * r;
    return out;
  }
  // Outside: the closest point is on a face the centre is in front of
  var best = vec3f(0.0);
  var bestDist = 3.4e38;
  for (var f = 0u; f < X.nf; f++) {
    let plane = facePlane(X, f);
    let s = dot(plane.xyz, c) - plane.w;
    if (s <= 0.0) { continue; }
    var p = c - plane.xyz * s;
    let k = faceVertCount(X, f);
    var centre = vec3f(0.0);
    for (var j = 0u; j < k; j++) { centre += vert(X, faceVert(X, f, j)); }
    centre /= f32(k);
    var inside = true;
    var edgeBest = vec3f(0.0);
    var edgeDist = 3.4e38;
    for (var j = 0u; j < k; j++) {
      let v0 = vert(X, faceVert(X, f, j));
      let v1 = vert(X, faceVert(X, f, (j + 1u) % k));
      var side = cross(v1 - v0, plane.xyz);
      if (dot(side, centre - v0) > 0.0) { side = -side; }
      if (dot(side, p - v0) > 0.0) { inside = false; }
      let q = segmentPoint(v0, v1, c);
      let dq = dot(q - c, q - c);
      if (dq < edgeDist) { edgeDist = dq; edgeBest = q; }
    }
    if (!inside) { p = edgeBest; }
    let dist = length(p - c);
    if (dist < bestDist) { bestDist = dist; best = p; }
  }
  if (bestDist > r) { return out; }
  var n = vec3f(0.0, 0.0, 1.0);
  if (bestDist > 0.0) { n = (c - best) / bestDist; }  // from the hull towards the sphere
  out.hit = true;
  out.n = -n;
  out.onBox = best;
  out.onSphere = c - n * r;
  return out;
}
`,_=`
${f}

struct RefPose {
  pos: vec4f,
  rot: vec4f,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read_write> bodies: array<Body>;
@group(0) @binding(2) var<storage, read_write> refs: array<RefPose>;

@compute @workgroup_size(64)
fn updateRefs(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= params.bodyCount) { return; }
  let pos = bodies[i].pos.xyz;
  let rot = bodies[i].rot;
  let last = refs[i];
  // A zero quaternion marks a body without a reference yet
  let moved = dot(last.rot, last.rot) == 0.0
    || length(pos - last.pos.xyz) > ${u}
    || length(qsub(rot, last.rot)) > ${d};
  if (moved) {
    refs[i] = RefPose(vec4f(pos, 0.0), rot);
    bodies[i].inertialPos.w = bitcast<f32>(params.step);
  }
}
`,v=`
/** Binary search of the (hi, lo) no-collide list; false if every connecting joint has broken. */
fn ignored(hi: u32, lo: u32) -> bool {
  let base = params.largeCount;
  var first = 0u;
  var count = params.noCollideCount;
  while (count > 0u) {
    let step = count / 2u;
    let mid = first + step;
    let mh = statics[base + 3u * mid];
    let ml = statics[base + 3u * mid + 1u];
    if (mh < hi || (mh == hi && ml < lo)) {
      first = mid + 1u;
      count -= step + 1u;
    } else {
      count = step;
    }
  }
  for (var k = first; k < params.noCollideCount; k++) {
    if (statics[base + 3u * k] != hi || statics[base + 3u * k + 1u] != lo) { break; }
    let j = statics[base + 3u * k + 2u];
    if (j == 0xffffffffu) { return true; }
    if (joints[j].penLin.w != 0.0 || joints[j].penAng.w != 0.0) { return true; }
  }
  return false;
}

`,y=`
${f}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> bodies: array<Body>;
// Grid: bucketStart[tableMask + 2] | cursor[tableMask + 1] | sorted[bodies] | cell[3 * bodies]
@group(0) @binding(2) var<storage, read_write> grid: array<atomic<u32>>;
@group(0) @binding(3) var<storage, read_write> pairs: array<vec2u>;
@group(0) @binding(4) var<storage, read_write> counters: array<atomic<u32>>;
// Static: large body indices[largeCount] | noCollide (hi, lo, joint) triples, sorted by (hi, lo)
@group(0) @binding(5) var<storage, read> statics: array<u32>;
@group(0) @binding(6) var<storage, read> joints: array<Joint>;
// Per body: its collision groups and the groups it collides with (GpuSolver3D.setFilters)
@group(0) @binding(7) var<storage, read> filters: array<vec2u>;

@compute @workgroup_size(1)
fn beginFrame() {
  // Last step's pairs and contacts become "previous" (they sit in the other ping-pong buffers)
  atomicStore(&counters[C_PREV_MANIFOLDS], min(atomicLoad(&counters[C_MANIFOLDS]), params.manifoldCapacity));
  atomicStore(&counters[C_PREV_CONTACTS], min(atomicLoad(&counters[C_CONTACTS]), params.contactCapacity));
  atomicStore(&counters[C_MANIFOLDS], 0u);
  atomicStore(&counters[C_CONTACTS], 0u);
  if ((params.flags & FLAG_REUSE_MANIFOLDS) == 0u) { atomicStore(&counters[C_PAIRS], 0u); }
  atomicStore(&counters[C_OVERFLOW], 0u);
  atomicStore(&counters[C_CLASHES], 0u);
  atomicStore(&counters[C_NUM_COLORS], 0u);
}

fn radius(i: u32) -> f32 {
  return bodies[i].moment.w;
}

fn isLarge(i: u32) -> bool {
  return radius(i) > params.maxSmallRadius;
}

fn levelOf(i: u32) -> u32 {
  return select(0u, 1u, radius(i) > params.fineGrid.y);
}

fn cellAt(i: u32, level: u32) -> vec3i {
  let size = select(params.fineGrid.x, params.cellSize, level == 1u);
  return vec3i(floor(bodies[i].pos.xyz / size));
}

fn cellHash(c: vec3i, level: u32) -> u32 {
  return ((u32(c.x) * 73856093u) ^ (u32(c.y) * 19349663u) ^ (u32(c.z) * 83492791u) ^ (level * 2654435769u)) & params.tableMask;
}

@compute @workgroup_size(64)
fn gridCount(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= params.bodyCount || isLarge(i)) { return; }
  let c = cellAt(i, levelOf(i));
  for (var k = 0u; k < 3u; k++) { atomicStore(&grid[params.gridCellOffset + 3u * i + k], bitcast<u32>(c[k])); }
  atomicAdd(&grid[cellHash(c, levelOf(i))], 1u);
}

@compute @workgroup_size(64)
fn gridScatter(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= params.bodyCount || isLarge(i)) { return; }
  let h = cellHash(cellAt(i, levelOf(i)), levelOf(i));
  let slot = atomicLoad(&grid[h]) + atomicAdd(&grid[params.gridCursorOffset + h], 1u);
  atomicStore(&grid[params.gridSortedOffset + slot], i);
}

${v}

/** Body i as the broadphase sees it: world axes and half extents (a sphere: its radius). */
struct Shape {
  ax: array<vec3f, 3>,
  h: vec3f,
  sphere: bool,
}

fn shapeOf(i: u32) -> Shape {
  let q = bodies[i].rot;
  var s: Shape;
  s.h = bodies[i].size.xyz * 0.5;
  s.sphere = bodies[i].angVel.w == SHAPE_SPHERE;
  s.ax[0] = qrotate(q, vec3f(1.0, 0.0, 0.0));
  s.ax[1] = qrotate(q, vec3f(0.0, 1.0, 0.0));
  s.ax[2] = qrotate(q, vec3f(0.0, 0.0, 1.0));
  return s;
}

/** Half width of a shape along unit axis n. */
fn extent(s: Shape, n: vec3f) -> f32 {
  if (s.sphere) { return s.h.x; }
  return s.h.x * abs(dot(n, s.ax[0])) + s.h.y * abs(dot(n, s.ax[1])) + s.h.z * abs(dot(n, s.ax[2]));
}

/** Half extents of a shape's world-space bounding box. */
fn aabbHalf(s: Shape) -> vec3f {
  if (s.sphere) { return vec3f(s.h.x); }
  return abs(s.ax[0]) * s.h.x + abs(s.ax[1]) * s.h.y + abs(s.ax[2]) * s.h.z;
}

/**
 * A face axis of either shape separates them by more than 1 mm (d: centre A minus centre B).
 * The narrowphase rejects any pair a separating axis finds (it tests these axes and the edge
 * axes), so this only drops pairs it would drop; the millimetre keeps round-off out of it.
 */
fn faceSeparated(A: Shape, B: Shape, d: vec3f) -> bool {
  for (var k = 0u; k < 3u; k++) {
    if (abs(dot(d, A.ax[k])) - extent(A, A.ax[k]) - extent(B, A.ax[k]) > 1e-3) { return true; }
    if (abs(dot(d, B.ax[k])) - extent(A, B.ax[k]) - extent(B, B.ax[k]) > 1e-3) { return true; }
  }
  return false;
}

/** What the pair tests need of the body a findPairs thread starts from, loaded once. */
struct Probe {
  index: u32,
  pos: vec3f,
  radius: f32,
  aabb: vec3f,
  dynamic: bool,
  shape: Shape,
}

fn probeOf(i: u32) -> Probe {
  let shape = shapeOf(i);
  return Probe(i, bodies[i].pos.xyz, radius(i), aabbHalf(shape), bodies[i].size.w > 0.0, shape);
}

fn testPair(P: Probe, j: u32) {
  if (!P.dynamic && bodies[j].size.w <= 0.0) { return; }
  // Each in a group the other collides with
  let fi = filters[P.index];
  let fj = filters[j];
  if ((fi.x & fj.y) == 0u || (fj.x & fi.y) == 0u) { return; }
  let d = P.pos - bodies[j].pos.xyz;
  let r = P.radius + radius(j);
  if (dot(d, d) > r * r) { return; }
  // Bounding spheres of boxes overlap far more often than the boxes do (neighbouring
  // columns, rows of bricks); world AABBs are a cheap, conservative second test (with a
  // small pad for f32 round-off), and face axes a third: rings of bricks and piles sent
  // 48-72% of their pairs to the narrowphase only to be found apart.
  let B = shapeOf(j);
  if (any(abs(d) > P.aabb + aabbHalf(B) + vec3f(1e-4))) { return; }
  if (faceSeparated(P.shape, B, d)) { return; }
  let a = max(P.index, j);
  let b = min(P.index, j);
  if (ignored(a, b)) { return; }
  let slot = atomicAdd(&counters[C_PAIRS], 1u);
  if (slot >= params.pairCapacity) {
    atomicOr(&counters[C_OVERFLOW], 1u);
    return;
  }
  pairs[slot] = vec2u(a, b);
}

/**
 * Only dynamic bodies probe: a pair with a fixed body (or one sleeping as fixed) is emitted
 * from its dynamic body. Fixed invocations return before loading shapes or scanning the grid,
 * without a probe-list allocation, atomic append or indirect-argument dispatch. Their pairs with
 * the large dynamic bodies, which scan no grid, are findFixedLarge's.
 */
@compute @workgroup_size(64)
fn findPairs(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= params.bodyCount || bodies[i].size.w <= 0.0) { return; }
  let small = !isLarge(i);
  let P = probeOf(i);
  if (small) {
    let ownLevel = levelOf(i);
    let lastLevel = select(0u, 1u, params.fineGrid.x < params.cellSize);
    // Same-level dynamic pairs belong to the higher index, fixed pairs to the mover;
    // cross-level pairs belong to the finer body (fixed ones use findFixedLarge). Each queried cell is at least twice the
    // largest radius in that level, so 27 cells conservatively cover every overlap.
    for (var level = ownLevel; level <= lastLevel; level++) {
      let c = cellAt(i, level);
      for (var oz = -1; oz <= 1; oz++) {
        for (var oy = -1; oy <= 1; oy++) {
          for (var ox = -1; ox <= 1; ox++) {
            let cell = c + vec3i(ox, oy, oz);
            let h = cellHash(cell, level);
            let end = atomicLoad(&grid[h + 1u]);
            for (var k = atomicLoad(&grid[h]); k < end; k++) {
              let j = atomicLoad(&grid[params.gridSortedOffset + k]);
              if (levelOf(j) != level || (j == i || (ownLevel == level && j > i && bodies[j].size.w > 0.0))) { continue; }
              let o = params.gridCellOffset + 3u * j;
              let cj = vec3i(bitcast<i32>(atomicLoad(&grid[o])), bitcast<i32>(atomicLoad(&grid[o + 1u])), bitcast<i32>(atomicLoad(&grid[o + 2u])));
              if (any(cj != cell)) { continue; }
              testPair(P, j);
            }
          }
        }
      }
    }
  }
  // Large bodies against everything: a dynamic large-large pair once (from the smaller index),
  // a fixed large body from this dynamic one
  for (var k = 0u; k < params.largeCount; k++) {
    let l = statics[k];
    if (l == i || (!small && l < i && bodies[l].size.w > 0.0)) { continue; }
    testPair(P, l);
  }
}

/** Small fixed bodies against the large dynamic ones; dispatched only while there are any. */
@compute @workgroup_size(64)
fn findFixedLarge(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= params.bodyCount || bodies[i].size.w > 0.0 || isLarge(i)) { return; }
  // Fine fixed bodies own their pairs with coarse movers, since fixed bodies do not
  // run findPairs and a coarse body cannot cover fine cells with just 27 probes.
  if (params.fineGrid.z > 0.0 && levelOf(i) == 0u) {
    let c = cellAt(i, 1u);
    let F = probeOf(i);
    for (var oz = -1; oz <= 1; oz++) {
      for (var oy = -1; oy <= 1; oy++) {
        for (var ox = -1; ox <= 1; ox++) {
          let cell = c + vec3i(ox, oy, oz);
          let h = cellHash(cell, 1u);
          let end = atomicLoad(&grid[h + 1u]);
          for (var k = atomicLoad(&grid[h]); k < end; k++) {
            let j = atomicLoad(&grid[params.gridSortedOffset + k]);
            if (levelOf(j) != 1u || bodies[j].size.w <= 0.0) { continue; }
            let o = params.gridCellOffset + 3u * j;
            let cj = vec3i(bitcast<i32>(atomicLoad(&grid[o])), bitcast<i32>(atomicLoad(&grid[o + 1u])), bitcast<i32>(atomicLoad(&grid[o + 2u])));
            if (any(cj != cell)) { continue; }
            testPair(F, j);
          }
        }
      }
    }
  }
  var P: Probe;
  var loaded = false;
  for (var k = 0u; k < params.largeCount; k++) {
    let l = statics[k];
    if (bodies[l].size.w <= 0.0) { continue; }
    if (!loaded) {
      P = probeOf(i);
      loaded = true;
    }
    testPair(P, l);
  }
}
`,b=e=>`
${f}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> bodies: array<Body>;
@group(0) @binding(2) var<storage, read> pairs: array<vec2u>;
@group(0) @binding(3) var<storage, read_write> contacts: array<Contact>;
@group(0) @binding(4) var<storage, read> prevContacts: array<Contact>;
@group(0) @binding(5) var<storage, read_write> manifolds: array<Manifold>;
@group(0) @binding(6) var<storage, read> prevManifolds: array<Manifold>;
@group(0) @binding(7) var<storage, read_write> table: array<atomic<u32>>;
@group(0) @binding(8) var<storage, read_write> counters: array<atomic<u32>>;
${e?`@group(0) @binding(9) var<storage, read> hulls: array<vec4u>;`:``}

fn pairHash(a: u32, b: u32) -> u32 {
  return hash32((a * 0x9e3779b1u) ^ hash32(b));
}

/**
 * Last step's pairs into the table (slot value = pair index + 1), linear probing. Slots are
 * claimed by atomicExchange, not compare-exchange (Safari's Metal backend fails to compile
 * atomicCompareExchangeWeak, github issue 1): a taken slot's occupant is swapped out and
 * carried on to the next slot, which keeps it on its own probe chain.
 */
@compute @workgroup_size(64)
fn hashInsert(@builtin(global_invocation_id) gid: vec3u) {
  let m = gid.x;
  if (m >= atomicLoad(&counters[C_PREV_MANIFOLDS])) { return; }
  let ids = prevManifolds[m].ids;
  var h = pairHash(ids.x, ids.y) & params.hashMask;
  var value = m + 1u;
  for (var probe = 0u; probe <= params.hashMask; probe++) {
    value = atomicExchange(&table[h], value);
    if (value == 0u) { return; }
    h = (h + 1u) & params.hashMask;
  }
}

/** Index of last step's pair (a, b), or -1. */
fn hashFind(a: u32, b: u32) -> i32 {
  var h = pairHash(a, b) & params.hashMask;
  for (var probe = 0u; probe <= params.hashMask; probe++) {
    let v = atomicLoad(&table[h]);
    if (v == 0u) { return -1; }
    let ids = prevManifolds[v - 1u].ids;
    if (ids.x == a && ids.y == b) { return i32(v - 1u); }
    h = (h + 1u) & params.hashMask;
  }
  return -1;
}

// --- Narrowphase: OBB SAT + clipping (../ref/collide.ts) -----------------------------------

const MAX_CONTACTS = 8u;
const MAX_POLY = 8u;
const SAT_AXIS_EPSILON = 1.0e-6;
const PLANE_EPSILON = 1.0e-5;
const CONTACT_MERGE_DIST_SQ = 1.0e-6;
const AXIS_FACE_A = 0u;
const AXIS_FACE_B = 1u;
const AXIS_EDGE = 2u;

struct Box {
  c: vec3f,
  h: vec3f,
  ax: array<vec3f, 3>,
}

struct Sat {
  kind: u32,
  ia: u32,
  ib: u32,
  sep: f32,
  n: vec3f,  // from A towards B
  valid: bool,
}

struct Found {
  feature: array<u32, 8>,
  xA: array<vec3f, 8>,
  xB: array<vec3f, 8>,
  count: u32,
}

fn makeBox(i: u32) -> Box {
  let q = bodies[i].rot;
  var b: Box;
  b.c = bodies[i].pos.xyz;
  b.h = bodies[i].size.xyz * 0.5;
  b.ax[0] = qrotate(q, vec3f(1.0, 0.0, 0.0));
  b.ax[1] = qrotate(q, vec3f(0.0, 1.0, 0.0));
  b.ax[2] = qrotate(q, vec3f(0.0, 0.0, 1.0));
  return b;
}

fn projRadius(b: Box, n: vec3f) -> f32 {
  return b.h.x * abs(dot(n, b.ax[0])) + b.h.y * abs(dot(n, b.ax[1])) + b.h.z * abs(dot(n, b.ax[2]));
}

/** SAT test of one axis; false when it separates the boxes. Tracks the least-separated axis. */
fn testAxis(A: Box, B: Box, delta: vec3f, axis: vec3f, kind: u32, ia: u32, ib: u32, best: ptr<function, Sat>) -> bool {
  let lenSq = dot(axis, axis);
  if (lenSq < SAT_AXIS_EPSILON) { return true; }
  var n = axis * inverseSqrt(lenSq);
  if (dot(n, delta) < 0.0) { n = -n; }
  let sep = abs(dot(delta, n)) - (projRadius(A, n) + projRadius(B, n));
  if (sep > 0.0) { return false; }
  if (!(*best).valid || sep > (*best).sep) { *best = Sat(kind, ia, ib, sep, n, true); }
  return true;
}

fn support(b: Box, dir: vec3f) -> vec3f {
  let s = select(vec3f(-1.0), vec3f(1.0), vec3f(dot(dir, b.ax[0]), dot(dir, b.ax[1]), dot(dir, b.ax[2])) >= vec3f(0.0));
  return b.c + b.ax[0] * (b.h.x * s.x) + b.ax[1] * (b.h.y * s.y) + b.ax[2] * (b.h.z * s.z);
}

fn addFound(f: ptr<function, Found>, xA: vec3f, xB: vec3f, feature: u32) {
  let mid = (xA + xB) * 0.5;
  for (var i = 0u; i < (*f).count; i++) {
    let d = mid - ((*f).xA[i] + (*f).xB[i]) * 0.5;
    if (dot(d, d) < CONTACT_MERGE_DIST_SQ) { return; }
  }
  if ((*f).count >= MAX_CONTACTS) { return; }
  (*f).feature[(*f).count] = feature;
  (*f).xA[(*f).count] = xA;
  (*f).xB[(*f).count] = xB;
  (*f).count++;
}

/**
 * Sutherland-Hodgman: clip src (n verts) against dot(pn, x) <= offset into dst. A quad
 * clipped by four planes has at most 8 vertices (the reference allows 16 but never needs them),
 * and the vertex order is the reference's, so contact indices (feature keys) match.
 */
fn clipPlane(src: ptr<function, array<vec3f, 8>>, n: u32, dst: ptr<function, array<vec3f, 8>>, pn: vec3f, offset: f32) -> u32 {
  if (n == 0u) { return 0u; }
  var count = 0u;
  var a = (*src)[n - 1u];
  var da = dot(pn, a) - offset;
  for (var i = 0u; i < n; i++) {
    let b = (*src)[i];
    let db = dot(pn, b) - offset;
    let aIn = da <= PLANE_EPSILON;
    let bIn = db <= PLANE_EPSILON;
    if (aIn != bIn) {
      var t = 0.0;
      let denom = da - db;
      if (abs(denom) > SAT_AXIS_EPSILON) { t = clamp(da / denom, 0.0, 1.0); }
      if (count < MAX_POLY) { (*dst)[count] = a + (b - a) * t; count++; }
    }
    if (bIn && count < MAX_POLY) { (*dst)[count] = b; count++; }
    a = b;
    da = db;
  }
  return count;
}

/** Face-axis (u, v) extents: axis 0 -> (1, 2), 1 -> (0, 2), 2 -> (0, 1). */
fn faceU(k: u32) -> u32 { return select(0u, 1u, k == 0u); }
fn faceV(k: u32) -> u32 { return select(1u, 2u, k != 2u); }

fn faceManifold(A: Box, B: Box, refIsA: bool, refAxis: u32, nAB: vec3f) -> Found {
  var found: Found;
  var R = B;
  var I = A;
  if (refIsA) {
    R = A;
    I = B;
  }
  let outward = select(-nAB, nAB, refIsA);

  // Reference face
  let rs = select(-1.0, 1.0, dot(outward, R.ax[refAxis]) >= 0.0);
  let rn = R.ax[refAxis] * rs;
  let rc = R.c + rn * R.h[refAxis];
  let ru = R.ax[faceU(refAxis)];
  let rv = R.ax[faceV(refAxis)];
  let eu = R.h[faceU(refAxis)];
  let ev = R.h[faceV(refAxis)];

  // Incident face: the incident box's face most anti-parallel to the reference normal
  var incAxis = 0u;
  var bestDot = -1.0;
  for (var k = 0u; k < 3u; k++) {
    let d = abs(dot(I.ax[k], rn));
    if (d > bestDot) { bestDot = d; incAxis = k; }
  }
  let is = select(1.0, -1.0, dot(I.ax[incAxis], rn) > 0.0);
  let ic = I.c + I.ax[incAxis] * (is * I.h[incAxis]);
  let iu = I.ax[faceU(incAxis)] * I.h[faceU(incAxis)];
  let iv = I.ax[faceV(incAxis)] * I.h[faceV(incAxis)];
  var poly: array<vec3f, 8>;
  var tmp: array<vec3f, 8>;
  poly[0] = ic + iu + iv;
  poly[1] = ic - iu + iv;
  poly[2] = ic - iu - iv;
  poly[3] = ic + iu - iv;
  var n = 4u;
  n = clipPlane(&poly, n, &tmp, ru, dot(ru, rc) + eu);
  n = clipPlane(&tmp, n, &poly, -ru, dot(-ru, rc) + eu);
  n = clipPlane(&poly, n, &tmp, rv, dot(rv, rc) + ev);
  n = clipPlane(&tmp, n, &poly, -rv, dot(-rv, rc) + ev);
  if (n == 0u) { return found; }

  let prefix = (select(AXIS_FACE_B, AXIS_FACE_A, refIsA) << 24u) | (refAxis << 16u) | (incAxis << 8u);
  for (var i = 0u; i < n && found.count < MAX_CONTACTS; i++) {
    let p = poly[i];
    let dist = dot(p - rc, rn);
    if (dist > PLANE_EPSILON) { continue; }
    let onRef = p - rn * dist;
    addFound(&found, select(p, onRef, refIsA), select(onRef, p, refIsA), prefix | i);
  }
  if (found.count == 0u) { addFound(&found, support(A, nAB), support(B, -nAB), prefix); }
  return found;
}

fn supportEdge(b: Box, k: u32, dir: vec3f) -> array<vec3f, 2> {
  let k1 = (k + 1u) % 3u;
  let k2 = (k + 2u) % 3u;
  let s1 = select(-1.0, 1.0, dot(dir, b.ax[k1]) >= 0.0);
  let s2 = select(-1.0, 1.0, dot(dir, b.ax[k2]) >= 0.0);
  let c = b.c + b.ax[k1] * (b.h[k1] * s1) + b.ax[k2] * (b.h[k2] * s2);
  let e = b.ax[k] * b.h[k];
  return array<vec3f, 2>(c - e, c + e);
}

fn edgeContact(A: Box, B: Box, ia: u32, ib: u32, nAB: vec3f) -> Found {
  var found: Found;
  let ea = supportEdge(A, ia, nAB);
  let eb = supportEdge(B, ib, -nAB);
  // Closest points between the two segments
  let p0 = ea[0];
  let q0 = eb[0];
  let d1 = ea[1] - p0;
  let d2 = eb[1] - q0;
  let r = p0 - q0;
  let a = dot(d1, d1);
  let e = dot(d2, d2);
  let f = dot(d2, r);
  var s = 0.0;
  var t = 0.0;
  if (a <= SAT_AXIS_EPSILON && e <= SAT_AXIS_EPSILON) {
    // both degenerate: s = t = 0
  } else if (a <= SAT_AXIS_EPSILON) {
    t = clamp(f / e, 0.0, 1.0);
  } else {
    let c = dot(d1, r);
    if (e <= SAT_AXIS_EPSILON) {
      s = clamp(-c / a, 0.0, 1.0);
    } else {
      let b = dot(d1, d2);
      let denom = a * e - b * b;
      if (abs(denom) > SAT_AXIS_EPSILON) { s = clamp((b * f - c * e) / denom, 0.0, 1.0); }
      t = (b * s + f) / e;
      if (t < 0.0) {
        t = 0.0;
        s = clamp(-c / a, 0.0, 1.0);
      } else if (t > 1.0) {
        t = 1.0;
        s = clamp((b - c) / a, 0.0, 1.0);
      }
    }
  }
  let key = (AXIS_EDGE << 24u) | (ia << 8u) | ib;
  addFound(&found, p0 + d1 * s, q0 + d2 * t, key);
  if (found.count == 0u) { addFound(&found, support(A, nAB), support(B, -nAB), key); }
  return found;
}

// --- Spheres (GPU-only extension, ../shapes.ts) -------------------------------------------

/** Sphere against sphere: one contact, normal along the centre line. */
fn sphereSphere(A: Box, B: Box, sat: ptr<function, Sat>) -> Found {
  var found: Found;
  let d = B.c - A.c;
  let dist = length(d);
  if (dist > A.h.x + B.h.x) { return found; }
  var n = vec3f(0.0, 0.0, 1.0);
  if (dist > 0.0) { n = d / dist; }
  (*sat).n = n;
  addFound(&found, A.c + n * A.h.x, B.c - n * B.h.x, SPHERE_FEATURE);
  return found;
}

struct SphereBoxHit {
  hit: bool,
  onSphere: vec3f,
  onBox: vec3f,
  n: vec3f,  // from the sphere towards the box
}

/** Sphere S against box X: closest point of the box, or the shallowest face when inside. */
fn sphereBox(S: Box, X: Box, qX: vec4f) -> SphereBoxHit {
  var out: SphereBoxHit;
  let p = qrotate(qconj(qX), S.c - X.c);
  let q = clamp(p, -X.h, X.h);
  let r = S.h.x;
  var nLocal: vec3f;  // from the box towards the sphere, box frame
  var onBox = q;
  if (any(p != q)) {
    let d = p - q;
    let dist = length(d);
    if (dist > r) { return out; }
    nLocal = d / dist;
  } else {
    // Centre inside the box: push out through the face of least penetration
    let depth = X.h - abs(p);
    var k = 0u;
    if (depth.y < depth[k]) { k = 1u; }
    if (depth.z < depth[k]) { k = 2u; }
    let s = select(-1.0, 1.0, p[k] >= 0.0);
    nLocal = vec3f(0.0);
    nLocal[k] = s;
    onBox[k] = s * X.h[k];
  }
  let n = qrotate(qX, nLocal);
  out.hit = true;
  out.n = -n;
  out.onBox = X.c + qrotate(qX, onBox);
  out.onSphere = S.c - n * r;
  return out;
}

/** Collide boxes a and b; the contact normal (B to A) is -sat.n. */
fn collide(A: Box, B: Box, sat: ptr<function, Sat>) -> Found {
  var none: Found;
  let delta = B.c - A.c;
  var face: Sat;
  var edge: Sat;
  for (var i = 0u; i < 3u; i++) { if (!testAxis(A, B, delta, A.ax[i], AXIS_FACE_A, i, 0u, &face)) { return none; } }
  for (var i = 0u; i < 3u; i++) { if (!testAxis(A, B, delta, B.ax[i], AXIS_FACE_B, 0u, i, &face)) { return none; } }
  for (var i = 0u; i < 3u; i++) {
    for (var j = 0u; j < 3u; j++) {
      if (!testAxis(A, B, delta, cross(A.ax[i], B.ax[j]), AXIS_EDGE, i, j, &edge)) { return none; }
    }
  }
  if (!face.valid) { return none; }
  // Prefer a face axis unless an edge axis is clearly better (stabler manifolds). The demo
  // scales the edge separation by 0.95, which for penetrating boxes (negative separations)
  // favours the edge: a box sunk 0.7 into another, faces aligned, gets a single edge contact
  // and never recovers (docs/FINDINGS.md). FLAG_FACE_BIAS scales the face separation instead
  // (as Box2D does), so an edge must beat the face by a margin that grows with penetration.
  var best = face;
  if (edge.valid) {
    var edgeWins = 0.95 * edge.sep > face.sep + 0.01;
    if ((params.flags & FLAG_FACE_BIAS) != 0u) { edgeWins = edge.sep > 0.95 * face.sep + 0.01; }
    if (edgeWins) { best = edge; }
  }
  *sat = best;
  if (best.kind == AXIS_EDGE) { return edgeContact(A, B, best.ia, best.ib, best.n); }
  return faceManifold(A, B, best.kind == AXIS_FACE_A, select(best.ib, best.ia, best.kind == AXIS_FACE_A), best.n);
}

/**
 * Keep pair (a, b)'s contact points from last step, skipping SAT and clipping, when they were
 * computed no earlier than both bodies last moved beyond the reuse tolerance (refsWGSL). The
 * points keep their warm-start data; C(x-) is recomputed from the current poses. Returns
 * false when the pair must go through the narrowphase.
 */
/**
 * A contact's least normal penalty with FLAG_MASS_PENALTY: the lighter dynamic body's mass over
 * dt², its inertia term in the primal Hessian. From the demo's PENALTY_MIN the ramp (β|C| an
 * iteration) takes many steps to catch up with a heavy body, which sinks through the floor
 * meanwhile; at m/dt² a contact removes about half its error an iteration from the start,
 * whatever the mass. Not in the paper; for unit-scale bodies it is ~10³, below where their
 * penalties settle anyway. Friction rows keep the demo's ramp (Coulomb stopping distances).
 */
fn contactPenaltyMin(a: u32, b: u32) -> f32 {
  if ((params.flags & FLAG_MASS_PENALTY) == 0u) { return PENALTY_MIN; }
  let mA = select(bodies[a].size.w, 3.4e38, bodies[a].size.w <= 0.0);
  let mB = select(bodies[b].size.w, 3.4e38, bodies[b].size.w <= 0.0);
  return clamp(min(mA, mB) / (params.dt * params.dt), PENALTY_MIN, PENALTY_MAX);
}

fn reuseContacts(a: u32, b: u32) -> bool {
  let pm = hashFind(a, b);
  if (pm < 0) { return false; }
  let prev = prevManifolds[pm];
  let count = pairCount(prev);
  let generated = prev.ids.w >> 4u;
  let moved = max(bitcast<u32>(bodies[a].inertialPos.w), bitcast<u32>(bodies[b].inertialPos.w));
  if (count == 0u || generated < moved) { return false; }

  copyContacts(prev);
  return true;
}

// Refresh C(x-) and warm-start values without generating a new contact set. The caller
// explicitly opts into retaining normals/anchors across the remaining substeps.
fn copyContacts(prev: Manifold) {
  let a = prev.ids.x;
  let b = prev.ids.y;
  let count = pairCount(prev);
  let m = atomicAdd(&counters[C_MANIFOLDS], 1u);
  if (m >= params.manifoldCapacity) {
    atomicOr(&counters[C_OVERFLOW], 4u);
    return;
  }
  let base = atomicAdd(&counters[C_CONTACTS], count);
  if (base + count > params.contactCapacity) {
    atomicOr(&counters[C_OVERFLOW], 2u);
    manifolds[m] = Manifold(vec4u(a, b, base, prev.ids.w & ~15u), prev.geo);
    return;
  }
  manifolds[m] = Manifold(vec4u(a, b, base, prev.ids.w), prev.geo);

  let pA = bodies[a].pos.xyz;
  let qA = bodies[a].rot;
  let pB = bodies[b].pos.xyz;
  let qB = bodies[b].rot;
  let basis = orthonormal(prev.geo.xyz);
  for (var i = 0u; i < count; i++) {
    var k = prevContacts[prev.ids.z + i];
    // C(x-) at the current poses, then the usual warm start (Eq. 19)
    let d = (qrotate(qA, k.rA) + pA) - (qrotate(qB, k.rB) + pB);
    k.c0x = dot(basis[0], d) + COLLISION_MARGIN;
    k.c0y = dot(basis[1], d);
    k.c0z = dot(basis[2], d);
    k.lam = k.lam * params.alpha * params.gamma;
    k.pen = clamp(k.pen * params.gamma, vec3f(PENALTY_MIN), vec3f(PENALTY_MAX));
    k.pen.x = max(k.pen.x, contactPenaltyMin(a, b));
    contacts[base + i] = k;
  }
}

@compute @workgroup_size(64)
fn reuseManifolds(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= min(atomicLoad(&counters[C_PREV_MANIFOLDS]), params.manifoldCapacity)) { return; }
  let prev = prevManifolds[gid.x];
  if (pairCount(prev) > 0u) { copyContacts(prev); }
}

${e?g:`fn isHull(i: u32) -> bool { return false; }`}

@compute @workgroup_size(64)
fn narrowphase(@builtin(global_invocation_id) gid: vec3u) {
  let p = gid.x;
  if (p >= min(atomicLoad(&counters[C_PAIRS]), params.pairCapacity)) { return; }
  let a = pairs[p].x;
  let b = pairs[p].y;
  if ((params.flags & FLAG_REUSE_CONTACTS) != 0u && reuseContacts(a, b)) { return; }
  let A = makeBox(a);
  let B = makeBox(b);
  var sat: Sat;
  var found: Found;
  let sphereA = bodies[a].angVel.w == SHAPE_SPHERE;
  let sphereB = bodies[b].angVel.w == SHAPE_SPHERE;
  if (sphereA && sphereB) {
    found = sphereSphere(A, B, &sat);
  }${e?` else if (isHull(a) || isHull(b)) {
    if (sphereA || sphereB) {
      // sat.n points from A towards B
      if (sphereA) {
        let h = sphereHull(A.c, A.h.x, polyOf(b));
        sat.n = h.n;
        if (h.hit) { addFound(&found, h.onSphere, h.onBox, SPHERE_FEATURE); }
      } else {
        let h = sphereHull(B.c, B.h.x, polyOf(a));
        sat.n = -h.n;
        if (h.hit) { addFound(&found, h.onBox, h.onSphere, SPHERE_FEATURE); }
      }
    } else {
      found = collidePoly(polyOf(a), polyOf(b), &sat);
    }
  }`:``} else if (sphereA || sphereB) {
    // sat.n points from A towards B
    var h: SphereBoxHit;
    if (sphereA) {
      h = sphereBox(A, B, bodies[b].rot);
      sat.n = h.n;
      if (h.hit) { addFound(&found, h.onSphere, h.onBox, SPHERE_FEATURE); }
    } else {
      h = sphereBox(B, A, bodies[a].rot);
      sat.n = -h.n;
      if (h.hit) { addFound(&found, h.onBox, h.onSphere, SPHERE_FEATURE); }
    }
  } else {
    found = collide(A, B, &sat);
  }
  if (found.count == 0u) { return; }

  // Reserve the pair record and its consecutive contact points
  let m = atomicAdd(&counters[C_MANIFOLDS], 1u);
  if (m >= params.manifoldCapacity) {
    atomicOr(&counters[C_OVERFLOW], 4u);
    return;
  }
  let base = atomicAdd(&counters[C_CONTACTS], found.count);
  var count = found.count;
  if (base + count > params.contactCapacity) {
    atomicOr(&counters[C_OVERFLOW], 2u);
    count = 0u;
  }
  let n = -sat.n;
  manifolds[m] = Manifold(vec4u(a, b, base, count | (params.step << 4u)), vec4f(n, sqrt(bodies[a].pos.w * bodies[b].pos.w)));
  if (count == 0u) { return; }

  let qA = bodies[a].rot;
  let qB = bodies[b].rot;
  let basis = orthonormal(n);
  let anySphere = sphereA || sphereB;
  // Last step's contacts of this pair (at most 8, consecutive)
  var prevFirst = 0u;
  var prevCount = 0u;
  let pm = hashFind(a, b);
  if (pm >= 0) {
    prevFirst = prevManifolds[pm].ids.z;
    prevCount = pairCount(prevManifolds[pm]);
  }
  let matchNearest = (params.flags & FLAG_MATCH_NEAREST) != 0u;
  let minSide = min(min(min(A.h.x, A.h.y), A.h.z), min(min(B.h.x, B.h.y), B.h.z)) * 2.0;
  let penaltyMin = contactPenaltyMin(a, b);

  for (var i = 0u; i < count; i++) {
    var rA = qrotate(qconj(qA), found.xA[i] - A.c);
    var rB = qrotate(qconj(qB), found.xB[i] - B.c);
    var pen = vec3f(0.0);
    var lam = vec3f(0.0);
    var stick = 0u;

    // Warm start from last step's point with this feature; with matchNearest, fall back to
    // the pair's previous point nearest in A-local anchor position
    var j = -1;
    for (var c = prevFirst; c < prevFirst + prevCount; c++) {
      if ((prevContacts[c].key & ~STICK_BIT) == found.feature[i]) { j = i32(c); break; }
    }
    if (j < 0 && matchNearest) {
      var bestDist = NEAREST_FRACTION * minSide;
      for (var c = prevFirst; c < prevFirst + prevCount; c++) {
        let dist = length(prevContacts[c].rA - rA);
        if (dist <= bestDist) {
          bestDist = dist;
          j = i32(c);
        }
      }
    }
    if (j >= 0) {
      let prev = prevContacts[j];
      pen = prev.pen;
      lam = prev.lam;
      stick = prev.key & STICK_BIT;
      // Static friction last step: keep the old anchors. Not for spheres: their contact point
      // moves over both surfaces as they roll, and pinned anchors would rotate away with them
      if (stick != 0u && !anySphere) {
        rA = prev.rA;
        rB = prev.rB;
      }
    }

    // C(x-) in the contact basis, plus the collision margin on the normal row
    let d = (qrotate(qA, rA) + A.c) - (qrotate(qB, rB) + B.c);
    let c0 = vec3f(dot(basis[0], d) + COLLISION_MARGIN, dot(basis[1], d), dot(basis[2], d));

    // Warm start the dual variables and penalty parameters (Eq. 19)
    lam = lam * params.alpha * params.gamma;
    pen = clamp(pen * params.gamma, vec3f(PENALTY_MIN), vec3f(PENALTY_MAX));
    pen.x = max(pen.x, penaltyMin);

    contacts[base + i] = Contact(rA, found.feature[i] | stick, rB, c0.x, pen, c0.y, lam, c0.z);
  }
}
`,x=b(!1),S=b(!0),C=Math.fround,w=(e,t)=>C(C(e)+C(t)),T=(e,t)=>C(C(e)-C(t)),E=(e,t)=>C(C(e)*C(t)),D=(e,t)=>C(C(e)/C(t)),O=e=>C(Math.sqrt(e)),k=e=>C(Math.sin(e)),A=e=>C(Math.cos(e)),j=e=>e<0?-1:1,M=(e,t,n)=>Math.max(t,Math.min(n,e)),N=e=>[C(e[0]),C(e[1]),C(e[2])],P=(e,t)=>[w(e[0],t[0]),w(e[1],t[1]),w(e[2],t[2])],F=(e,t)=>[T(e[0],t[0]),T(e[1],t[1]),T(e[2],t[2])],I=(e,t)=>[E(e[0],t),E(e[1],t),E(e[2],t)],L=(e,t)=>[D(e[0],t),D(e[1],t),D(e[2],t)],R=(e,t)=>w(w(E(e[0],t[0]),E(e[1],t[1])),E(e[2],t[2])),z=e=>O(R(e,e)),B=e=>z(e)>1e-12?L(e,z(e)):[0,1,0],V=(e,t)=>[Math.min(e[0],t[0]),Math.min(e[1],t[1]),Math.min(e[2],t[2])],H=(e,t)=>[Math.max(e[0],t[0]),Math.max(e[1],t[1]),Math.max(e[2],t[2])],U=(e,t)=>({min:F(e.min,[t,t,t]),max:P(e.max,[t,t,t])}),W=(e,t)=>V(H(e,t.min),t.max),G=(e,t)=>t>1e-9?[D(e[0],t),0,D(e[2],t)]:[1,0,0];function K(e,t){let n=[T(Math.abs(e[0]),t[0]),T(Math.abs(e[1]),t[1]),T(Math.abs(e[2]),t[2])],r=[Math.max(n[0],0),Math.max(n[1],0),Math.max(n[2],0)],i=z(r),a=[0,0,0];if(i>0)a=[E(D(r[0],i),j(e[0])),E(D(r[1],i),j(e[1])),E(D(r[2],i),j(e[2]))];else{let t=n[0]>n[1]?n[0]>n[2]?0:2:n[1]>n[2]?1:2;a[t]=j(e[t])}return{phi:w(i,Math.min(Math.max(...n),0)),gradient:a}}function q(e,t){let n=z(e);return{phi:T(n,t),gradient:n>1e-9?L(e,n):[0,1,0]}}function J(e,t,n){let r=O(w(E(e[0],e[0]),E(e[2],e[2]))),i=T(r,t),a=T(Math.abs(e[1]),n),o=Math.max(i,0),s=Math.max(a,0),c=O(w(E(o,o),E(s,s))),l=G(e,r);return{phi:w(c,Math.min(Math.max(i,a),0)),gradient:c>0?P(I(l,D(o,c)),[0,D(E(j(e[1]),s),c),0]):i>a?l:[0,j(e[1]),0]}}function Y(e,t,n){let r=O(w(E(e[0],e[0]),E(e[2],e[2]))),i=e[1],a=T(r,Math.min(r,i<0?t:0)),o=T(Math.abs(i),n),s=-t,c=E(2,n),l=M(D(w(E(r,t),E(T(n,i),c)),w(E(s,s),E(c,c))),0,1),u=w(r,E(s,l)),d=w(T(i,n),E(c,l)),f=u<0&&o<0?-1:1,p=w(E(a,a),E(o,o)),m=w(E(u,u),E(d,d)),h=p<m?a:u,g=p<m?E(o,j(i)):d,_=O(w(E(h,h),E(g,g)));return _>1e-9?(h=E(h,D(f,_)),g=E(g,D(f,_))):p<m?(h=0,g=j(i)):(h=c,g=t,_=O(w(E(h,h),E(g,g))),h=D(h,_),g=D(g,_)),{phi:E(f,O(Math.min(p,m))),gradient:P(I(G(e,r),h),[0,g,0])}}function X(e,t,n){let r=O(w(E(e[0],e[0]),E(e[2],e[2]))),i=T(r,t),a=e[1],o=O(w(E(i,i),E(a,a))),s=G(e,r);return{phi:T(o,n),gradient:o>1e-9?P(I(s,D(i,o)),[0,D(a,o),0]):s}}function Z(e,t,n,r){if(n===2){let n=e.map(e=>k(E(7,e))),i=e.map(e=>A(E(7,e))),a=K(e,t);return{phi:w(a.phi,E(E(E(r,n[0]),n[1]),n[2])),gradient:P(a.gradient,I([E(E(i[0],n[1]),n[2]),E(E(n[0],i[1]),n[2]),E(E(n[0],n[1]),i[2])],E(r,7)))}}let i=A(E(r,e[n===0?0:1])),a=k(E(r,e[n===0?0:1])),o=n===0?[T(E(i,e[0]),E(a,e[1])),w(E(a,e[0]),E(i,e[1])),e[2]]:[T(E(i,e[0]),E(a,e[2])),w(E(a,e[0]),E(i,e[2])),e[1]],s=K(o,t),c=s.gradient,l=n===0?[R([T(i,E(r,o[1])),w(a,E(r,o[0])),0],c),R([-a,i,0],c),c[2]]:[R([i,a,0],c),R([-E(r,o[1]),E(r,o[0]),1],c),R([-a,i,0],c)];return{phi:s.phi,gradient:l}}function Q(e){return e=Math.imul(e^e>>>16,2146121005),e=Math.imul(e^e>>>15,2221713035),e^=e>>>16,(e&16777215)/16777216}var $=class{spec;bounds;convex;centerOfMass=[0,0,0];seeds=[];constructor(e){let t={box:[],sphere:[`radius`],capsule:[`radius`,`halfLength`],cylinder:[`radius`,`halfHeight`],cone:[`radius`,`halfHeight`],torus:[`majorRadius`,`minorRadius`],warp:[],"spike-plate":[`spikeRadius`,`minHeight`,`maxHeight`],"spiky-wheel":[`hubRadius`,`hubHalfWidth`,`spikeRadius`,`spikeHalfHeight`]};if(!Object.hasOwn(t,e.kind))throw Error(`Unknown field`);let n=e;for(let r of t[e.kind]){let e=n[r];if(typeof e!=`number`||!Number.isFinite(C(e))||(r===`halfLength`?e<0:C(e)<=0))throw Error(`Invalid SDF ${r}`)}if(`halfExtents`in e&&(e.halfExtents.length!==3||!e.halfExtents.every(e=>Number.isFinite(C(e))&&C(e)>0)))throw Error(`Invalid SDF halfExtents`);if(e.kind===`warp`&&(![0,1,2].includes(e.type)||!Number.isFinite(C(e.k))))throw Error(`Invalid SDF warp`);if(e.kind===`spike-plate`&&(!Number.isSafeInteger(e.count)||e.count<1||e.maxHeight<e.minHeight))throw Error(`Invalid SDF spike count/heights`);if(e.kind===`spiky-wheel`&&(!Number.isSafeInteger(e.spikes)||e.spikes<1))throw Error(`Invalid SDF spike count`);this.spec=Object.fromEntries(Object.entries(e).map(([e,t])=>[e,typeof t==`number`?C(t):Array.isArray(t)?N(t):t]));let r=this.spec,i;if(this.convex=[`box`,`sphere`,`capsule`,`cylinder`,`cone`].includes(r.kind),r.kind===`box`||r.kind===`spike-plate`)i=r.halfExtents;else if(r.kind===`sphere`)i=[r.radius,r.radius,r.radius];else if(r.kind===`capsule`)i=[r.radius,w(r.radius,r.halfLength),r.radius];else if(r.kind===`cone`||r.kind===`cylinder`)i=[r.radius,r.halfHeight,r.radius];else if(r.kind===`torus`)i=[w(r.majorRadius,r.minorRadius),r.minorRadius,w(r.majorRadius,r.minorRadius)];else if(r.kind===`spiky-wheel`)i=[w(r.hubRadius,E(2,r.spikeHalfHeight)),r.hubHalfWidth,w(r.hubRadius,E(2,r.spikeHalfHeight))];else if(r.kind===`warp`){let e=O(w(E(r.halfExtents[0],r.halfExtents[0]),E(r.halfExtents[1],r.halfExtents[1])));i=r.type===0?[e,e,r.halfExtents[2]]:r.type===1?[e,r.halfExtents[2],e]:r.halfExtents}else throw Error(`Unknown field`);if(this.bounds={min:I(i,-1),max:[...i]},r.kind===`warp`&&r.type===2&&(this.bounds=U(this.bounds,Math.abs(r.k))),r.kind===`spike-plate`&&(this.bounds.max[1]=w(i[1],r.maxHeight)),![...this.bounds.min,...this.bounds.max].every(Number.isFinite))throw Error(`SDF bounds exceed float32 range`)}sample(e){let t=N(e),n=this.spec;switch(n.kind){case`box`:return K(t,n.halfExtents);case`sphere`:return q(t,n.radius);case`capsule`:return q([t[0],T(t[1],M(t[1],-n.halfLength,n.halfLength)),t[2]],n.radius);case`cylinder`:return J(t,n.radius,n.halfHeight);case`cone`:return Y(t,n.radius,n.halfHeight);case`torus`:return X(t,n.majorRadius,n.minorRadius);case`warp`:return Z(t,n.halfExtents,n.type,n.k);case`spike-plate`:{let e=K(t,n.halfExtents),r=I(n.halfExtents,D(2,n.count)),i=M(Math.floor(D(w(t[0],n.halfExtents[0]),r[0])),0,n.count-1),a=M(Math.floor(D(w(t[2],n.halfExtents[2]),r[2])),0,n.count-1);for(let o=Math.max(a-1,0);o<=Math.min(a+1,n.count-1);o++)for(let a=Math.max(i-1,0);a<=Math.min(i+1,n.count-1);a++){let i=w(n.minHeight,E(T(n.maxHeight,n.minHeight),Q(17*(a+o*n.count)+11))),s=Y(F(t,[w(-n.halfExtents[0],E(w(a,.5),r[0])),T(w(n.halfExtents[1],E(.5,i)),E(.5,n.spikeRadius)),w(-n.halfExtents[2],E(w(o,.5),r[2]))]),D(E(n.spikeRadius,w(i,n.spikeRadius)),i),E(.5,w(i,n.spikeRadius)));s.phi<e.phi&&(e=s)}return e}case`spiky-wheel`:{let e=J(t,n.hubRadius,n.hubHalfWidth),r=D(E(2,C(Math.PI)),n.spikes),i=T(n.hubHalfWidth,n.spikeRadius),a=Math.floor(w(D(C(Math.atan2(t[2],t[0])),r),.5));for(let o=a-1;o<=a+1;o++){let a=E(o,r),s=[-k(a),0,A(a)],c=[A(a),0,k(a)];for(let r of[-i,i]){let i=F(F(t,I(c,w(n.hubRadius,n.spikeHalfHeight))),[0,r,0]),a=Y([R(i,s),R(i,c),i[1]],n.spikeRadius,n.spikeHalfHeight);a.phi<e.phi&&(e={phi:a.phi,gradient:P(P(I(s,a.gradient[0]),I(c,a.gradient[1])),[0,a.gradient[2],0])})}}return e}}}},ee=class{convex=!1;centerOfMass=[0,0,0];seeds=[];bounds;dimensions;origin;cell;grid;surfaceTriangles;constructor(e,t,n,r,i,a){if(!e.every(e=>Number.isSafeInteger(e)&&e>=2)||!Number.isFinite(C(n))||C(n)<=0||!t.every(e=>Number.isFinite(C(e))))throw Error(`Invalid SDF grid geometry`);if(![...i.min,...i.max].every(e=>Number.isFinite(C(e)))||i.min.some((e,t)=>e>i.max[t]))throw Error(`Invalid SDF bounds`);if(!r.every(Number.isFinite))throw Error(`SDF grid must be finite`);if(!e.every((e,r)=>Number.isFinite(C(C(t[r])+C((e-1)*C(n))))))throw Error(`SDF grid exceeds float32 range`);if(r.length!==e[0]*e[1]*e[2]*4)throw Error(`SDF grid length mismatch`);if(a&&(!a.length||a.length%9||!a.every(Number.isFinite)))throw Error(`Invalid SDF surface triangles`);this.surfaceTriangles=a,this.dimensions=[...e],this.origin=N(t),this.cell=C(n),this.grid=r,this.bounds={min:N(i.min),max:N(i.max)}}sample(e){let t=N(e),[n,r,i]=this.dimensions,a=P(this.origin,I([n-1,r-1,i-1],this.cell)),o=W(t,{min:this.origin,max:a}),s=L(F(o,this.origin),this.cell),c=Math.min(Math.trunc(s[0]),n-2),l=Math.min(Math.trunc(s[1]),r-2),u=Math.min(Math.trunc(s[2]),i-2),d=[T(s[0],c),T(s[1],l),T(s[2],u)],f=0,p=[0,0,0];for(let e=0;e<8;e++){let t=E(E(e&1?d[0]:T(1,d[0]),e&2?d[1]:T(1,d[1])),e&4?d[2]:T(1,d[2])),i=4*(c+(e&1)+n*(l+(e>>1&1)+r*(u+(e>>2&1))));f=w(f,E(t,this.grid[i])),p=P(p,I([this.grid[i+1],this.grid[i+2],this.grid[i+3]],t))}let m=F(t,o),h=z(m);return{phi:w(f,h),gradient:h>0?B(P(p,L(m,h))):p}}};export{a as _,y as a,_ as c,m as d,c as f,e as g,p as h,v as i,h as l,o as m,$ as n,S as o,s as p,C as r,x as s,ee as t,f as u,r as v,i as y};