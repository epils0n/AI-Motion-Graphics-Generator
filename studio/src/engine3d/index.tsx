import React from 'react';

// A small 3D renderer that draws to SVG. Characters are built from real 3D primitives (ellipsoids, tapered tubes),
// rotated by a camera, shaded per polygon from a light, and drawn back to front. It gives the cast real volume and
// real turnarounds (front, three-quarter, side, back) while staying pure code: no image model, nothing to drift.
//
// Coordinates: x right, y up, z toward the camera; the character faces +z at yaw 0. A positive yaw turns it to face
// screen-right. Units are about one pixel at s = 1; the ground is y = 0.

export type V3 = [number, number, number];
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: V3): V3 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const rad = (d: number) => (d * Math.PI) / 180;
export const rotX = (p: V3, a: number): V3 => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};
export const rotY = (p: V3, a: number): V3 => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};
export const rotZ = (p: V3, a: number): V3 => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};
export type Rot = (v: V3) => V3;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// ---------------------------------------------------------------- colour
const rgbCache = new Map<string, V3>();
const hexRgb = (h: string): V3 => {
  let c = rgbCache.get(h);
  if (!c) {
    c = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    rgbCache.set(h, c);
  }
  return c;
};
const rgbHex = (c: V3) => '#' + c.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
/** Adds b's light onto a (a screen blend at strength k): a rim of teal on red goes salmon, not grey. */
export const screen = (a: string, b: string, k: number) => {
  const A = hexRgb(a);
  const B = hexRgb(b);
  return rgbHex([0, 1, 2].map((i) => 255 - ((255 - A[i]) * (255 - B[i] * k)) / 255) as V3);
};
export const mix = (a: string, b: string, t: number) => {
  const A = hexRgb(a);
  const B = hexRgb(b);
  const k = clamp01(t);
  return rgbHex([A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k]);
};

/** A surface: its base colour, and optionally its lit and shadow colours, shine and how strong the highlight is. */
export type Mat = { base: string; light?: string; shadow?: string; spec?: number; shine?: number };
export const mat = (base: string, extra: Partial<Mat> = {}): Mat => ({ base, ...extra });

// ---------------------------------------------------------------- meshes
/** A polygon: its points, its normal, and (for smooth shading) a normal at each point. */
export type Poly = { p: V3[]; n: V3; m: Mat; back?: Mat; vn?: V3[]; layer?: number };

/** An ellipsoid at c with radii r. `keep` drops faces by their direction (to cut a hood's opening); `back` draws the inside. */
export const ellipsoid = (c: V3, r: V3, m: Mat, nu: number, nv: number, keep?: (d: V3) => boolean, back?: Mat): Poly[] => {
  const out: Poly[] = [];
  const dir = (i: number, j: number): V3 => {
    const th = (2 * Math.PI * i) / nu;
    const ph = (Math.PI * j) / nv;
    return [Math.sin(ph) * Math.sin(th), Math.cos(ph), Math.sin(ph) * Math.cos(th)];
  };
  const pt = (d: V3): V3 => [c[0] + d[0] * r[0], c[1] + d[1] * r[1], c[2] + d[2] * r[2]];
  const nr = (d: V3): V3 => norm([d[0] / r[0], d[1] / r[1], d[2] / r[2]]);
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const dc = norm(dir(i + 0.5, j + 0.5));
      if (keep && !keep(dc)) continue;
      const ds = [dir(i, j), dir(i + 1, j), dir(i + 1, j + 1), dir(i, j + 1)];
      out.push({ p: ds.map(pt), n: nr(dc), m, back, vn: ds.map(nr) });
    }
  }
  return out;
};

/**
 * An ellipsoid shell with a round opening facing +z (a hood): its grid runs round the forward axis, so the opening's
 * edge is one clean ring at `open` degrees from the front. `skip` drops faces by direction (the neck hole).
 */
export const shell = (c: V3, r: V3, m: Mat, nt: number, na: number, open: number, back?: Mat, skip?: (d: V3) => boolean, to = 180, layer?: number): Poly[] => {
  const out: Poly[] = [];
  const t0 = rad(open);
  const t1 = rad(to);
  const dir = (i: number, j: number): V3 => {
    const t = t0 + ((t1 - t0) * i) / nt;
    const a = (2 * Math.PI * j) / na;
    return [Math.sin(t) * Math.cos(a), Math.sin(t) * Math.sin(a), Math.cos(t)];
  };
  const pt = (d: V3): V3 => [c[0] + d[0] * r[0], c[1] + d[1] * r[1], c[2] + d[2] * r[2]];
  const nr = (d: V3): V3 => norm([d[0] / r[0], d[1] / r[1], d[2] / r[2]]);
  for (let i = 0; i < nt; i++) {
    for (let j = 0; j < na; j++) {
      const dc = norm(dir(i + 0.5, j + 0.5));
      if (skip && skip(dc)) continue;
      const ds = [dir(i, j), dir(i, j + 1), dir(i + 1, j + 1), dir(i + 1, j)];
      out.push({ p: ds.map(pt), n: nr(dc), m, back, vn: ds.map(nr), layer });
    }
  }
  return out;
};

/** A tapered tube from a (radius r0) to b (radius r1), n sides; `sq` squashes its second cross-section axis (a flat torso). */
export const tube = (a: V3, b: V3, r0: number, r1: number, m: Mat, n: number, sq = 1): Poly[] => {
  const ax = norm(sub(b, a));
  let u = cross(ax, [0, 0, 1]);
  if (len(u) < 1e-3) u = cross(ax, [1, 0, 0]);
  u = norm(u);
  const w = cross(u, ax);
  const ring = (c: V3, r: number, k: number): V3 => add(c, add(mul(u, Math.cos(k) * r), mul(w, Math.sin(k) * r * sq)));
  const rn = (k: number): V3 => norm(add(mul(u, Math.cos(k)), mul(w, Math.sin(k) / sq)));
  const out: Poly[] = [];
  for (let k = 0; k < n; k++) {
    const a0 = (2 * Math.PI * k) / n;
    const a1 = (2 * Math.PI * (k + 1)) / n;
    const am = (a0 + a1) / 2;
    out.push({ p: [ring(a, r0, a0), ring(a, r0, a1), ring(b, r1, a1), ring(b, r1, a0)], n: rn(am), m, vn: [rn(a0), rn(a1), rn(a1), rn(a0)] });
  }
  return out;
};

/** A joint: a sphere and the tube to the next joint, as one piece (a capsule when both radii match). */
export const limb = (a: V3, b: V3, r0: number, r1: number, m: Mat, n: number, caps: [boolean, boolean] = [true, true]): Poly[] => [
  ...(caps[0] ? ellipsoid(a, [r0, r0, r0], m, n, Math.max(3, Math.round(n / 2))) : []),
  ...tube(a, b, r0, r1, m, n),
  ...(caps[1] ? ellipsoid(b, [r1, r1, r1], m, n, Math.max(3, Math.round(n / 2))) : []),
];

/** Moves and turns a set of polygons: f maps points, g maps normals (a rotation). */
export const xf = (polys: Poly[], f: (p: V3) => V3, g: Rot): Poly[] => polys.map((P) => ({ ...P, p: P.p.map(f), n: norm(g(P.n)), vn: P.vn?.map((v) => norm(g(v))) }));

/** A rotation that takes local axes to the basis (ex, ey, ez). */
export const basis = (ex: V3, ey: V3, ez: V3): Rot => (v) => add(add(mul(ex, v[0]), mul(ey, v[1])), mul(ez, v[2]));

// ---------------------------------------------------------------- shading
export type ShadeMode = 'toon' | 'gloss' | 'clay' | 'facet' | 'plush' | 'paint';
/** `cast` (paint): how far, in figure units, a part's shadow falls on the parts behind it. */
export type Shader = { mode: ShadeMode; flat?: boolean; outline?: number; ink: string; rim: string; facetLine?: number; cast?: number };
export const LIGHT = norm([0.55, 0.7, 0.5]); // the key light: upper right, in front (a lamp)
const HALF = norm(add(LIGHT, [0, 0, 1]));
const RIMDIR = norm([-0.9, 0.2, -0.15]); // the bounce from the room, from the left: teal

const ramp = (m: Mat, k: number) => {
  const L = m.light ?? mix(m.base, '#FFF4E2', 0.32);
  const S = m.shadow ?? mix(m.base, '#10303A', 0.58);
  return k < 0.55 ? mix(S, m.base, k / 0.55) : mix(m.base, L, (k - 0.55) / 0.45);
};

const rimOf = (n: V3) => Math.pow(1 - Math.max(0, n[2]), 2.4) * clamp01(dot(n, RIMDIR) + 0.35);
const TOON_K = (d: number) => (d > 0.45 ? 1 : d > -0.1 ? 0.56 : 0.12);

// ---- paint: a flat 2D cartoon lit like a 3D one. The lit side is one flat colour; the shadow is a cool violet
// shape with a soft edge, a warm bounce from the floor inside it, a small painted sheen, and a teal rim on the dark side.
const sstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const PAINT_SHADOW = '#2A2148';
const PAINT_EDGE: [number, number] = [-0.06, 0.1];
const PAINT_T = Array.from({ length: 11 }).map((_, i) => PAINT_EDGE[0] - 0.02 + i * 0.018);
const paint = (n: V3, m: Mat) => {
  const lit = sstep(PAINT_EDGE[0], PAINT_EDGE[1], dot(n, LIGHT));
  const S = m.shadow ?? mix(m.base, PAINT_SHADOW, 0.6);
  const bounce = sstep(0.0, -0.8, n[1]) * (1 - lit);
  return mix(mix(S, mix(S, '#E8875F', 0.34), bounce * 0.6), m.base, lit);
};
const PAINT_RIM = 0.42;

/** The value smooth shading is banded on: the key light, plus the highlight on glossy surfaces. */
const level = (n: V3, m: Mat, sh: Shader) => {
  const d = dot(n, LIGHT);
  if (sh.mode === 'toon') return d;
  if (sh.mode === 'paint') return d;
  const spec = sh.mode === 'gloss' ? Math.pow(Math.max(0, dot(n, HALF)), m.shine ?? 70) * (m.spec ?? 0.95) : 0;
  return 0.5 + 0.5 * d + spec;
};
const TOON_T = [-0.1, 0.45];
const SMOOTH_T = Array.from({ length: 46 }).map((_, i) => -0.06 + i * 0.045);

// Polygons are cut along the light's bands (marching through each polygon's corner values), so the edge of a
// shadow or a highlight runs smoothly across the mesh instead of stepping polygon by polygon.
type Piece = { pts: [number, number][]; ns: V3[]; vals: number[] };
const split = (pc: Piece, t: number): [Piece | null, Piece | null] => {
  const lo: Piece = { pts: [], ns: [], vals: [] };
  const hi: Piece = { pts: [], ns: [], vals: [] };
  const n = pc.pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const a = pc.vals[i];
    const b = pc.vals[j];
    const side = a < t ? lo : hi;
    side.pts.push(pc.pts[i]);
    side.ns.push(pc.ns[i]);
    side.vals.push(a);
    if (a < t !== b < t) {
      const k = (t - a) / (b - a);
      const p: [number, number] = [pc.pts[i][0] + (pc.pts[j][0] - pc.pts[i][0]) * k, pc.pts[i][1] + (pc.pts[j][1] - pc.pts[i][1]) * k];
      const nn = norm(add(mul(pc.ns[i], 1 - k), mul(pc.ns[j], k)));
      for (const s of [lo, hi]) {
        s.pts.push(p);
        s.ns.push(nn);
        s.vals.push(t);
      }
    }
  }
  return [lo.pts.length >= 3 ? lo : null, hi.pts.length >= 3 ? hi : null];
};
const bands = (pc: Piece, ts: number[]) => {
  const out: Piece[] = [];
  let rest: Piece | null = pc;
  for (const t of ts) {
    if (!rest) break;
    let mn = Infinity;
    let mx = -Infinity;
    for (const v of rest.vals) {
      mn = Math.min(mn, v);
      mx = Math.max(mx, v);
    }
    if (mx < t) break;
    if (mn >= t) continue;
    const [lo, hi]: [Piece | null, Piece | null] = split(rest, t);
    if (lo) out.push(lo);
    rest = hi;
  }
  if (rest) out.push(rest);
  return out;
};

export const shade = (n: V3, m: Mat, sh: Shader): string => {
  const d = dot(n, LIGHT);
  const edge = Math.pow(1 - Math.max(0, n[2]), 2.4);
  const rimK = rimOf(n);
  switch (sh.mode) {
    case 'toon': {
      const c = ramp(m, TOON_K(d));
      return rimK > 0.3 ? mix(c, sh.rim, 0.55) : c;
    }
    case 'gloss': {
      let c = ramp(m, 0.18 + 0.82 * clamp01(0.5 + 0.5 * d));
      const s = Math.pow(Math.max(0, dot(n, HALF)), m.shine ?? 70) * (m.spec ?? 0.95);
      c = mix(c, '#FFFFFF', s);
      return mix(c, sh.rim, rimK * 0.75);
    }
    case 'clay': {
      const c = ramp(m, 0.28 + 0.62 * clamp01(0.5 + 0.55 * d));
      const s = Math.pow(Math.max(0, dot(n, HALF)), 10) * 0.1;
      return mix(mix(c, '#FFFFFF', s), sh.rim, rimK * 0.3);
    }
    case 'facet': {
      const k = clamp01(0.3 + 0.7 * d);
      return mix(ramp(m, Math.round(k * 7) / 7), sh.rim, rimK * 0.35);
    }
    case 'plush': {
      const c = ramp(m, 0.3 + 0.6 * clamp01((d + 0.7) / 1.7));
      return mix(c, m.light ?? mix(m.base, '#FFF4E2', 0.4), edge * 0.35);
    }
    case 'paint': {
      const c = paint(n, m);
      return rimOf(n) > PAINT_RIM ? screen(c, sh.rim, 0.62) : c;
    }
  }
};

// ---------------------------------------------------------------- rendering
/** What a decal (a face, a seam, a string) gets to draw with: camera space, screen space, the scale. */
export type Proj = { cam: (p: V3) => V3; scr: (p: V3) => [number, number]; camN: Rot; s: number };
/** A piece of the figure drawn as one unit (an upper arm, the head and hood): sorted against the others by depth. */
export type Group = { polys: Poly[]; outline?: boolean; bias?: number; decal?: (pr: Proj) => React.ReactNode; joint?: boolean };

const newell = (ps: V3[]): V3 => {
  let x = 0;
  let y = 0;
  let z = 0;
  for (let i = 0; i < ps.length; i++) {
    const a = ps[i];
    const b = ps[(i + 1) % ps.length];
    x += (a[1] - b[1]) * (a[2] + b[2]);
    y += (a[2] - b[2]) * (a[0] + b[0]);
    z += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return norm([x, y, z]);
};

const hull = (pts: [number, number][]) => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const crossZ = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: [number, number][] = [];
  for (const q of p) {
    while (lo.length >= 2 && crossZ(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const hi: [number, number][] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (hi.length >= 2 && crossZ(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop();
    hi.push(q);
  }
  return [...lo.slice(0, -1), ...hi.slice(0, -1)];
};

export const makeProj = (yaw: number, pitch: number, x: number, y: number, s: number): Proj => {
  const cam = (p: V3) => rotX(rotY(p, yaw), pitch);
  return { cam, camN: cam, s, scr: (p) => {
    const c = cam(p);
    return [x + c[0] * s, y - c[1] * s];
  } };
};

const f1 = (v: number) => v.toFixed(1);

/** Draws the groups seen from a camera at yaw/pitch, with the ground point (0, 0, 0) at screen (x, y). */
// On screen, the key light comes from the upper right, so shadows fall down and to the left.
const SHADOW_SIDE: [number, number] = [-0.62, 0.79];
const pathD = (pts: [number, number][]) => 'M ' + pts.map((v) => `${f1(v[0])} ${f1(v[1])}`).join(' L ') + ' Z';

export const Render3D: React.FC<{ groups: Group[]; yaw: number; pitch?: number; x: number; y: number; s: number; sh: Shader; id?: string }> = (props) =>
  props.sh.mode === 'paint' ? <RenderPaint {...props} /> : <RenderSolid {...props} />;

/**
 * The painted look: each part is a flat 2D shape in a coloured line (the part's own colour, darkened), heavier on
 * the shadow side; inside it, soft painted light (see `paint`); and each part throws a crisp shadow on the parts
 * behind it (the hood on the shoulders, an arm on the chest, the hoodie on the joggers).
 */
const RenderPaint: React.FC<{ groups: Group[]; yaw: number; pitch?: number; x: number; y: number; s: number; sh: Shader; id?: string }> = ({ groups, yaw, pitch = 0.14, x, y, s, sh, id = 'p3' }) => {
  const pr = makeProj(yaw, pitch, x, y, s);
  const sp = (q: V3): [number, number] => [x + q[0] * s, y - q[1] * s];
  const items = groups
    .map((g, gi) => {
      const polys = g.polys.map((P) => {
        const cp = P.p.map(pr.cam);
        const z = cp.reduce((a, q) => a + q[2], 0) / cp.length;
        return { cp, z, n: pr.camN(P.n), P };
      });
      const z = polys.length ? polys.reduce((a, q) => a + q.z, 0) / polys.length : 0;
      const front = (q: (typeof polys)[number]) => q.n[2] > -0.22;
      const lay = (q: (typeof polys)[number]) => (front(q) ? q.P.layer ?? 0 : q.P.back ? -1 : q.P.layer ?? 0);
      const vis = polys.filter((q) => front(q) || q.P.back).sort((a, b) => lay(a) - lay(b) || a.z - b.z);
      const h = vis.length ? hull(vis.flatMap((q) => q.cp.map(sp))) : [];
      // the part's main colour, for its line and the shadows it takes
      const count = new Map<string, number>();
      for (const q of vis) count.set(q.P.m.base, (count.get(q.P.m.base) ?? 0) + q.cp.length);
      let main = vis[0]?.P.m.base ?? '#808080';
      for (const [c, k] of count) if (k > (count.get(main) ?? 0)) main = c;
      let bx: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
      for (const p of h) bx = [Math.min(bx[0], p[0]), Math.min(bx[1], p[1]), Math.max(bx[2], p[0]), Math.max(bx[3], p[1])];
      return { g, gi, vis, h, main, bx, z: z + (g.bias ?? 0) };
    })
    .filter((it) => it.vis.length)
    .sort((a, b) => a.z - b.z);
  const ow = (sh.outline ?? 5) * s;
  const cast = (sh.cast ?? 9) * s;
  const off: [number, number] = [SHADOW_SIDE[0] * cast * 0.45, SHADOW_SIDE[1] * cast];
  const lw = `translate(${f1(SHADOW_SIDE[0] * ow * 0.45)} ${f1(SHADOW_SIDE[1] * ow * 0.45)})`;
  const lineOf = (c: string) => mix(c, '#140C1C', 0.74);
  const lined = items.filter((it) => it.g.outline !== false);
  return (
    <g>
      {/* the silhouette line, under everything: heavier on the shadow side, and a little uneven, as if inked by hand */}
      <defs>
        <filter id={`${id}ink`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency={(0.02 / Math.max(0.5, s)).toFixed(4)} numOctaves={1} seed={3} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={f1(2.2 * s)} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter={`url(#${id}ink)`}>
      {ow > 0
        ? lined.map((it) => (
            <g key={`o${it.gi}`} fill={lineOf(it.main)} stroke={lineOf(it.main)} strokeWidth={ow} strokeLinejoin="round">
              <path d={pathD(it.h)} />
              <path d={pathD(it.h)} transform={lw} />
            </g>
          ))
        : null}
      </g>
      {items.map((it, ii) => {
        const d = pathD(it.h);
        // the parts in front whose shifted shadow lands on this one
        const over = items.slice(ii + 1).filter((o) => o.bx[0] + off[0] < it.bx[2] && o.bx[2] + off[0] > it.bx[0] && o.bx[1] + off[1] < it.bx[3] && o.bx[3] + off[1] > it.bx[1]);
        const cid = `${id}c${it.gi}`;
        return (
          <g key={it.gi}>
            {it.g.outline !== false && !it.g.joint && ow > 0 && ii > 0 ? <path d={d} fill={lineOf(it.main)} stroke={lineOf(it.main)} strokeWidth={ow * 0.62} strokeLinejoin="round" /> : null}
            {it.vis.map((q, i) => {
              const front = q.n[2] > -0.22;
              if (front && q.P.vn) {
                const ns = q.P.vn.map(pr.camN);
                const pieces = bands({ pts: q.cp.map(sp), ns, vals: ns.map((n) => dot(n, LIGHT)) }, PAINT_T);
                return (
                  <g key={i}>
                    {pieces.flatMap((pc, k) => {
                      const c = paint(norm(pc.ns.reduce((a, b) => add(a, b), [0, 0, 0] as V3)), q.P.m);
                      const rc = screen(c, sh.rim, 0.62);
                      const [lo, hi] = split({ ...pc, vals: pc.ns.map(rimOf) }, PAINT_RIM);
                      return [lo, hi].map((r, j) => (r ? <path key={`${k}${j}`} d={pathD(r.pts)} fill={j ? rc : c} stroke={j ? rc : c} strokeWidth={0.8} strokeLinejoin="round" /> : null));
                    })}
                  </g>
                );
              }
              const c = front || !q.P.back ? shade(q.n, q.P.m, sh) : shade(mul(q.n, -1), q.P.back, sh);
              return <path key={i} d={pathD(q.cp.map(sp))} fill={c} stroke={c} strokeWidth={0.9} strokeLinejoin="round" />;
            })}
            {it.g.decal ? it.g.decal(pr) : null}
            {over.length ? (
              <g>
                <defs>
                  <clipPath id={cid}>
                    <path d={d} />
                  </clipPath>
                </defs>
                <g clipPath={`url(#${cid})`}>
                  <g fill={PAINT_SHADOW} opacity={0.5} transform={`translate(${f1(off[0])} ${f1(off[1])})`}>
                    {over.map((o) => (
                      <path key={o.gi} d={pathD(o.h)} />
                    ))}
                  </g>
                </g>
              </g>
            ) : null}
          </g>
        );
      })}
    </g>
  );
};

const RenderSolid: React.FC<{ groups: Group[]; yaw: number; pitch?: number; x: number; y: number; s: number; sh: Shader; id?: string }> = ({ groups, yaw, pitch = 0.14, x, y, s, sh }) => {
  const pr = makeProj(yaw, pitch, x, y, s);
  const items = groups
    .map((g, gi) => {
      const polys = g.polys.map((P) => {
        const cp = P.p.map(pr.cam);
        const z = cp.reduce((a, q) => a + q[2], 0) / cp.length;
        let n = pr.camN(P.n);
        if (sh.flat) {
          const fn = newell(cp);
          n = dot(fn, n) < 0 ? mul(fn, -1) : fn;
        }
        return { cp, z, n, P };
      });
      const z = polys.length ? polys.reduce((a, q) => a + q.z, 0) / polys.length : 0;
      return { g, gi, polys, z: z + (g.bias ?? 0) };
    })
    .sort((a, b) => a.z - b.z);
  const ow = (sh.outline ?? 0) * s;
  return (
    <g>
      {items.map((it) => {
        // within a group, layers first (a hood's lining, then the face, then the hood), then depth
        const lay = (q: (typeof it.polys)[number]) => (q.n[2] > (sh.flat ? 0 : -0.22) ? q.P.layer ?? 0 : q.P.back ? -1 : q.P.layer ?? 0);
        const vis = it.polys.filter((q) => q.n[2] > (sh.flat ? 0 : -0.22) || q.P.back).sort((a, b) => lay(a) - lay(b) || a.z - b.z);
        const sp = (q: V3): [number, number] => [x + q[0] * s, y - q[1] * s];
        let outline: React.ReactNode = null;
        if (it.g.outline !== false && ow > 0 && vis.length) {
          const h = hull(vis.flatMap((q) => q.cp.map(sp)));
          outline = <path d={'M ' + h.map((p) => `${f1(p[0])} ${f1(p[1])}`).join(' L ') + ' Z'} fill={sh.ink} stroke={sh.ink} strokeWidth={ow} strokeLinejoin="round" />;
        }
        return (
          <g key={it.gi}>
            {outline}
            {vis.map((q, i) => {
              const front = q.n[2] > (sh.flat ? 0 : -0.22);
              const pd = (pts: [number, number][]) => 'M ' + pts.map((v) => `${f1(v[0])} ${f1(v[1])}`).join(' L ') + ' Z';
              if (front && !sh.flat && q.P.vn) {
                // smooth: band the polygon by the light, colour each piece from its own normal
                const ns = q.P.vn.map(pr.camN);
                const pieces = bands({ pts: q.cp.map(sp), ns, vals: ns.map((n) => level(n, q.P.m, sh)) }, sh.mode === 'toon' ? TOON_T : SMOOTH_T);
                return (
                  <g key={i}>
                    {pieces.flatMap((pc, k) => {
                      if (sh.mode !== 'toon') {
                        const c = shade(norm(pc.ns.reduce((a, b) => add(a, b), [0, 0, 0] as V3)), q.P.m, sh);
                        return [<path key={k} d={pd(pc.pts)} fill={c} stroke={c} strokeWidth={0.8} strokeLinejoin="round" />];
                      }
                      const v = pc.vals.reduce((a, b) => a + b, 0) / pc.vals.length;
                      const c = ramp(q.P.m, TOON_K(v));
                      const rimmed = mix(c, sh.rim, 0.55);
                      const [lo, hi] = split({ ...pc, vals: pc.ns.map(rimOf) }, 0.3);
                      return [lo, hi].map((r, j) => (r ? <path key={`${k}${j}`} d={pd(r.pts)} fill={j ? rimmed : c} stroke={j ? rimmed : c} strokeWidth={0.8} strokeLinejoin="round" /> : null));
                    })}
                  </g>
                );
              }
              const c = front || !q.P.back ? shade(q.n, q.P.m, sh) : shade(mul(q.n, -1), q.P.back, sh);
              const edge = sh.facetLine ? mix(c, '#FFFFFF', 0.16) : c;
              return <path key={i} d={pd(q.cp.map(sp))} fill={c} stroke={edge} strokeWidth={sh.facetLine ?? 0.9} strokeLinejoin="round" />;
            })}
            {it.g.decal ? it.g.decal(pr) : null}
          </g>
        );
      })}
    </g>
  );
};
