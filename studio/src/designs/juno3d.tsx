import React from 'react';
import { V3, add, sub, mul, dot, cross, len, norm, rad, rotX, rotY, rotZ, Rot, Mat, mat, Poly, Group, Proj, Shader, ellipsoid, shell, tube, limb, xf, basis, mix, Render3D } from '../engine3d';
import { Stick2D, stickHandAt, stickHeadAt } from './stick';

// Juno in 3D: one skeleton (pelvis, a twisting upper body, a turning head, two-bone arms and legs), built from real
// 3D shapes, so every view is the same character turned, not redrawn. A Design sets the proportions, the shading
// and the face; a Pose3 sets the joints. Faces are drawn onto the head's surface, so they turn with it.

export type Expr3 = 'neutral' | 'happy' | 'shock' | 'smug' | 'worried' | 'stern';
/** A limb's swing: abd out to the side, flex forward (both degrees from hanging straight down), bend at the elbow or knee. */
export type Limb3 = { abd: number; flex: number; bend: number };
export type Pose3 = {
  twist: number; // the upper body turns (degrees, + turns toward screen-right at yaw 0)
  tilt: number; // the upper body leans sideways
  lean: number; // the upper body leans forward
  headTurn: number;
  headTilt: number;
  headNod: number;
  hip: number; // the pelvis shifts sideways (contrapposto)
  armL: Limb3;
  armR: Limb3;
  legL: Limb3;
  legR: Limb3;
  point?: 'L' | 'R';
  look: [number, number];
  expr: Expr3;
  squash?: number; // + squashes (a landing), - stretches (a jump), about the feet
  blink?: number; // 0 open .. 1 shut
  t?: number; // the clock the pose was taken at (pose3At sets it; the 2D rig's idle motion runs on it)
  fx?: Fx3; // follow-through (pose3At sets it): how far loose parts trail the pose, from the last second of motion
  walk?: number; // the walk phase, when walking (walk3 sets it)
};
/** Follow-through: springs that trail the pose (degrees; sq in squash units). The 3D rig ignores them. */
export type Fx3 = { nod: number; tilt: number; lean: number; btilt: number; armL: number; armR: number; hair: number; sq: number };

export type EyeKind = 'toon' | 'bean' | 'bead' | 'paper' | 'button';
export type Design = {
  key: string;
  name: string;
  tag: string;
  notes: string[];
  sh: Shader;
  filter?: 'clay' | 'plush';
  seg: { head: [number, number]; body: [number, number]; limb: number };
  head: { r: V3; y: number };
  torso: { hipY: number; below: number; chest: number; rHip: number; rChest: number; depth: number };
  shoulder: { x: number; y: number };
  arm: { upper: number; lower: number; r0: number; r1: number; hand: number };
  leg: { hipX: number; upper: number; lower: number; r0: number; r1: number; foot: V3 };
  hood: { scale: number; cut: number } | null;
  hair?: 'bunches' | 'comb';
  stick?: { who: 'juno' | 'bea' | 'suit' }; // drawn as a flat 2D stick figure (see stick.tsx), not built in 3D
  outfit?: 'hoodie' | 'suit' | 'pinafore';
  eye: { kind: EyeKind; lon: number; lat: number; w: number; h: number };
  mouth: { lat: number; w: number };
  nose?: number;
  blush?: boolean;
  stitches?: boolean;
  col: { skin: string; hood: string; hoodIn: string; pants: string; shoe: string; sole: string; string: string; ink: string; mouth: string; sleeve?: string; hair?: string; tie?: string; shirt?: string };
};

// ---------------------------------------------------------------- poses
export const A_POSE: Pose3 = {
  twist: 0, tilt: 0, lean: 0, headTurn: 0, headTilt: 0, headNod: 0, hip: 0,
  armL: { abd: 16, flex: 4, bend: 14 }, armR: { abd: 16, flex: 4, bend: 14 },
  legL: { abd: 4, flex: 0, bend: 2 }, legR: { abd: 4, flex: 0, bend: 2 },
  look: [0, 0], expr: 'neutral',
};
/** The power pose: weight on one leg, the near arm pointing out at the thing he's about to shrink. */
export const POINT_POSE: Pose3 = {
  twist: 10, tilt: -5, lean: 3, headTurn: 8, headTilt: -6, headNod: 3, hip: -6,
  armL: { abd: 64, flex: 46, bend: 4 }, armR: { abd: 18, flex: 12, bend: 34 },
  legR: { abd: 6, flex: -6, bend: 3 }, legL: { abd: 12, flex: 16, bend: 20 },
  point: 'L', look: [0.8, 0.05], expr: 'smug',
};
/** A relaxed three-quarter stand for the expression close-ups. */
export const HEAD_POSE = (expr: Expr3): Pose3 => ({ ...A_POSE, headTilt: expr === 'smug' ? -8 : expr === 'shock' ? 4 : 3, headNod: expr === 'shock' ? -6 : 2, expr, look: expr === 'smug' ? [0.7, 0] : [0.15, 0.05] });

// ---------------------------------------------------------------- the skeleton
const limbDir = (side: number, l: Limb3): V3 => {
  const a = rad(l.abd);
  const f = rad(l.flex);
  const d: V3 = [side * Math.sin(a), -Math.cos(a), 0];
  return norm([d[0], d[1] * Math.cos(f), -d[1] * Math.sin(f)]);
};
/** The lower segment: the upper one folded by `bend` toward forward (arms, sign 1) or backward (knees, sign -1). */
const bendDir = (d1: V3, bend: number, sign: 1 | -1): V3 => {
  const z: V3 = [0, 0, sign];
  let f = sub(z, mul(d1, dot(z, d1)));
  if (len(f) < 0.2) f = sub([0, 1, 0], mul(d1, d1[1]));
  f = norm(f);
  const b = rad(bend);
  return norm(add(mul(d1, Math.cos(b)), mul(f, Math.sin(b))));
};
const frameFor = (d: V3): Rot => {
  let ex = cross(d, [0, 0, 1]);
  if (len(ex) < 0.2) ex = cross(d, [1, 0, 0]);
  ex = norm(ex);
  const ez = norm(cross(ex, d));
  return basis(ex, d, ez);
};

export const buildJuno = (D: Design, P: Pose3, q = 1) => {
  const S = (n: number) => Math.max(4, Math.round(n * q));
  const C = D.col;
  const M = {
    skin: mat(C.skin),
    hood: mat(C.hood, { spec: 0.35, shine: 40 }),
    hoodIn: mat(C.hoodIn),
    pants: mat(C.pants, { spec: 0.3, shine: 30 }),
    shoe: mat(C.shoe, { spec: 0.6 }),
    sole: mat(C.sole),
    sleeve: mat(C.sleeve ?? C.hood, { spec: 0.35, shine: 40 }),
    hair: mat(C.hair ?? '#2A1C18', { spec: 0.4, shine: 30 }),
  };
  if (D.sh.mode === 'gloss') {
    M.skin = mat(C.skin, { spec: 0.9, shine: 80 });
    M.hood = mat(C.hood, { spec: 0.85, shine: 60 });
    M.pants = mat(C.pants, { spec: 0.8, shine: 60 });
    M.sleeve = mat(C.sleeve ?? C.hood, { spec: 0.85, shine: 60 });
  }
  const groups: Group[] = [];
  let minY = 0;
  const sq = P.squash ?? 0;
  // the ground shift (applied once it's known), then squash and stretch about the feet
  const g0 = (p: V3): V3 => [p[0] * (1 + sq * 0.5), (p[1] - minY) * (1 - sq), p[2] * (1 + sq * 0.5)];

  // the upper body turns about the pelvis
  const U: Rot = (v) => rotY(rotZ(rotX(v, rad(P.lean)), rad(-P.tilt)), rad(P.twist));
  const pelvis: V3 = [P.hip, D.torso.hipY, 0];
  const up = (p: V3): V3 => add(pelvis, U(p));
  const T = D.torso;
  const H0 = T.chest + T.below;
  const rAt = (y: number) => T.rHip + (T.rChest - T.rHip) * Math.min(1, Math.max(0, (y + T.below) / H0));
  const frontZ = (x: number, y: number) => {
    const r = rAt(y);
    return r * T.depth * Math.sqrt(Math.max(0, 1 - (x / r) ** 2)) + 1.2;
  };

  // ---- torso (the hoodie) and the pelvis (the joggers)
  const nb = S(D.seg.body[0]);
  const torso: Poly[] = [
    ...tube([0, -T.below, 0], [0, T.chest, 0], T.rHip, T.rChest, M.hood, nb, T.depth),
    ...ellipsoid([0, -T.below, 0], [T.rHip, T.rHip * 0.42, T.rHip * T.depth], M.hood, nb, S(D.seg.body[1])),
    ...ellipsoid([0, T.chest, 0], [T.rChest, T.rChest * 0.46, T.rChest * T.depth], M.hood, nb, S(D.seg.body[1])),
  ];
  const frontVis = (pr: Proj) => pr.camN(U([0, 0, 1]))[2] > 0.12;
  groups.push({
    polys: xf(torso, up, U),
    decal: (pr) => {
      if (!frontVis(pr)) return null;
      const L = (pts: V3[]) => pts.map((p) => pr.scr(g0(up(p))));
      const path = (pts: [number, number][], close = false) => 'M ' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ') + (close ? ' Z' : '');
      const sw = Math.max(1.2, 2.2 * pr.s);
      // the kangaroo pocket
      const y0 = -T.below + 0.1 * H0;
      const y1 = -T.below + 0.42 * H0;
      const pk: V3[] = [];
      for (let i = 0; i <= 10; i++) {
        const x = -0.5 * rAt(y1) + (rAt(y1) * i) / 10;
        pk.push([x, y1, frontZ(x, y1)]);
      }
      const xb = 0.62 * rAt(y0);
      pk.push([xb, y0, frontZ(xb, y0)]);
      for (let i = 10; i >= 0; i--) {
        const x = -xb + (2 * xb * i) / 10;
        pk.push([x, y0, frontZ(x, y0)]);
      }
      pk.push([-xb, y0, frontZ(-xb, y0)]);
      // the drawstrings, from the neckline down, with aglets
      const strings = [-1, 1].map((sd) => {
        const xs = sd * 0.2 * T.rChest;
        const ya = T.chest + T.rChest * 0.12;
        const yb = T.chest - 0.42 * H0;
        const pts: V3[] = [];
        for (let i = 0; i <= 6; i++) {
          const y = ya + ((yb - ya) * i) / 6;
          const x = xs + sd * 0.04 * T.rChest * i;
          pts.push([x, y, frontZ(x, y) + 2]);
        }
        return pts;
      });
      const outfit = D.outfit ?? 'hoodie';
      if (outfit === 'suit') {
        // an open jacket: a shirt V, a tie, the lapels, two buttons
        const yt = T.chest + T.rChest * 0.2;
        const yv = T.chest - 0.45 * H0;
        const v: V3[] = [[-0.34 * T.rChest, yt, frontZ(-0.34 * T.rChest, yt)], [0, yv, frontZ(0, yv)], [0.34 * T.rChest, yt, frontZ(0.34 * T.rChest, yt)]];
        const ty = (y: number) => frontZ(0, y) + 1.5;
        const tie: V3[] = [[-0.07 * T.rChest, yt - 4, ty(yt)], [0.07 * T.rChest, yt - 4, ty(yt)], [0.11 * T.rChest, yv + 0.22 * H0, ty(yv + 0.22 * H0)], [0, yv + 0.08 * H0, ty(yv)], [-0.11 * T.rChest, yv + 0.22 * H0, ty(yv + 0.22 * H0)]];
        const lap = (sd: number): V3[] => [[sd * 0.34 * T.rChest, yt, frontZ(sd * 0.34 * T.rChest, yt) + 1], [sd * 0.5 * T.rChest, yt - 0.25 * H0, frontZ(sd * 0.5 * T.rChest, yt - 0.25 * H0) + 1], [0, yv, frontZ(0, yv) + 1]];
        return (
          <g>
            <path d={path(L(v), true)} fill={C.shirt ?? '#F2EEE6'} />
            <path d={path(L(tie), true)} fill={C.tie ?? '#C42A3A'} stroke={mix(C.tie ?? '#C42A3A', '#000000', 0.35)} strokeWidth={sw * 0.6} />
            {[-1, 1].map((sd) => (
              <path key={sd} d={path(L(lap(sd)))} stroke={mix(C.hood, '#000000', 0.4)} strokeWidth={sw * 1.1} fill="none" strokeLinejoin="round" />
            ))}
            {[0.1, 0.28].map((k) => {
              const yb = -T.below + k * H0;
              const b = L([[0.06 * rAt(yb), yb, frontZ(0.06 * rAt(yb), yb) + 1]])[0];
              return <circle key={k} cx={b[0]} cy={b[1]} r={sw * 1.3} fill={mix(C.hood, '#000000', 0.45)} />;
            })}
          </g>
        );
      }
      if (outfit === 'pinafore') {
        // two straps over the shoulders and a front pocket
        const at = (x: number, y: number): V3 => [x, y, frontZ(x, y) + 1.5];
        const yS = T.chest - 0.35 * H0;
        const straps = [-1, 1].map((sd) => L([at(sd * 0.32 * T.rChest, T.chest + T.rChest * 0.25), at(sd * 0.28 * rAt(yS), yS)]));
        const yb = -T.below + 0.3 * H0;
        const pc: V3[] = [at(-0.25 * rAt(yb), yb + 0.1 * H0), at(0.25 * rAt(yb), yb + 0.1 * H0), at(0.22 * rAt(yb), yb - 0.08 * H0), at(-0.22 * rAt(yb), yb - 0.08 * H0)];
        return (
          <g>
            {straps.map((st, i) => (
              <path key={i} d={path(st)} stroke={mix(C.hood, '#000000', 0.25)} strokeWidth={sw * 2.2} strokeLinecap="round" fill="none" />
            ))}
            <path d={path(L(pc), true)} fill={mix(C.hood, '#000000', 0.12)} stroke={mix(C.hood, '#000000', 0.3)} strokeWidth={sw * 0.8} />
          </g>
        );
      }
      return (
        <g>
          <path d={path(L(pk), true)} fill={mix(C.hood, '#000000', 0.14)} opacity={0.5} stroke={mix(C.hood, '#000000', 0.35)} strokeWidth={sw} strokeLinejoin="round" />
          {strings.map((pts, i) => {
            const sp = L(pts);
            const e = sp[sp.length - 1];
            return (
              <g key={i}>
                <path d={path(sp)} stroke={C.string} strokeWidth={sw * 1.3} fill="none" strokeLinecap="round" />
                <rect x={e[0] - sw * 1.3} y={e[1] - sw} width={sw * 2.6} height={sw * 4.4} rx={sw} fill={mix(C.string, '#FFFFFF', 0.4)} />
              </g>
            );
          })}
          {D.stitches ? <path d={path(L(pk.slice(0, 11)))} stroke={mix(C.hood, '#FFFFFF', 0.5)} strokeWidth={sw * 0.7} strokeDasharray={`${sw * 2} ${sw * 1.6}`} fill="none" /> : null}
        </g>
      );
    },
  });
  groups.push({ polys: ellipsoid([P.hip, T.hipY - T.below * 0.7, 0], [T.rHip * 0.92, T.rHip * 0.5, T.rHip * T.depth * 0.92], M.pants, nb, S(D.seg.body[1])), bias: -6, outline: true });

  // ---- head, hood, neck
  const Hr = D.head.r;
  const H: Rot = (v) => U(rotY(rotZ(rotX(v, rad(-P.headNod)), rad(-P.headTilt)), rad(P.headTurn)));
  const neckLocal: V3 = [0, T.chest + T.rChest * 0.3, 0];
  const headLocal: V3 = [0, D.head.y - T.hipY, 0];
  const hc = add(up(neckLocal), H(sub(headLocal, neckLocal)));
  const headM = (p: V3): V3 => add(hc, H(p));
  const nh = S(D.seg.head[0]);
  const mh = S(D.seg.head[1]);
  const HD = D.hood;
  const headPolys: Poly[] = HD
    ? [
        // only the face shows (a cap with a clean round edge, just past the hood's opening); then the hood over it
        ...xf(shell([0, 0, 0], Hr, M.skin, Math.max(3, Math.round(mh * 0.55)), nh, 0, undefined, undefined, HD.cut + 5, 1), headM, H),
        ...xf(shell([0, -Hr[1] * 0.04, -Hr[2] * 0.12], mul(Hr, HD.scale), M.hood, Math.max(3, Math.round(mh * 0.8)), nh, HD.cut, M.hoodIn, (d) => d[1] < -0.74, 180, 2), headM, H),
      ]
    : xf(ellipsoid([0, 0, 0], Hr, M.skin, nh, mh), headM, H).map((p) => ({ ...p, layer: 1 }));
  if (!HD && D.hair) {
    // hair: a cap over the top and back, its opening tipped forward and down to make the hairline
    const tip: Rot = (v) => rotX(v, rad(D.hair === 'comb' ? 34 : 30));
    const capR: V3 = [Hr[0] * 1.07, Hr[1] * 1.08, Hr[2] * 1.07];
    const cap = shell([0, 0, 0], capR, M.hair, Math.max(3, Math.round(mh * 0.7)), nh, D.hair === 'comb' ? 66 : 72, undefined, undefined, 180, 2);
    headPolys.push(...xf(xf(cap, (p) => add(tip(p), [0, Hr[1] * 0.04, -Hr[2] * 0.04]), tip), headM, H));
    if (D.hair === 'bunches') {
      ([-1, 1] as const).forEach((sd) => {
        const c: V3 = [sd * Hr[0] * 1.0, Hr[1] * 0.18, -Hr[2] * 0.15];
        headPolys.push(...xf(ellipsoid(c, [Hr[0] * 0.36, Hr[1] * 0.4, Hr[2] * 0.36], M.hair, S(16), S(10)), headM, H).map((p) => ({ ...p, layer: 0 })));
        headPolys.push(...xf(ellipsoid([c[0] - sd * Hr[0] * 0.24, c[1], c[2]], [Hr[0] * 0.1, Hr[1] * 0.16, Hr[2] * 0.16], mat(C.shoe), S(10), S(6)), headM, H).map((p) => ({ ...p, layer: 0.5 })));
      });
    } else {
      // a side part: a swept quiff over the forehead
      headPolys.push(...xf(ellipsoid([-Hr[0] * 0.25, Hr[1] * 0.72, Hr[2] * 0.42], [Hr[0] * 0.55, Hr[1] * 0.24, Hr[2] * 0.4], M.hair, S(14), S(8)), headM, H).map((p) => ({ ...p, layer: 2.5 })));
    }
  }
  if (D.nose) headPolys.push(...xf(ellipsoid([0, -Hr[1] * 0.12, Hr[2] * 0.97], [D.nose, D.nose * 0.85, D.nose * 0.8], M.skin, S(12), S(7)), headM, H).map((p) => ({ ...p, layer: 1.5 })));
  const neckTop = add(hc, H([0, -Hr[1] * 0.8, -Hr[2] * 0.08]));
  groups.push({ polys: limb(up(neckLocal), neckTop, Hr[0] * 0.26, Hr[0] * 0.26, M.skin, S(10), [false, false]), bias: -3, outline: true });

  // a point on the face, by longitude and latitude (radians), and whether it faces the camera
  const sp = (pr: Proj, lon: number, lat: number, lift = 1.012) => {
    const d: V3 = [Math.sin(lon) * Math.cos(lat), Math.sin(lat), Math.cos(lon) * Math.cos(lat)];
    const p = g0(headM([d[0] * Hr[0] * lift, d[1] * Hr[1] * lift, d[2] * Hr[2] * lift]));
    const n = pr.camN(H(norm([d[0] / Hr[0], d[1] / Hr[1], d[2] / Hr[2]])));
    return { s: pr.scr(p), z: n[2] };
  };
  groups.push({ polys: headPolys, bias: 6, decal: (pr) => <Face D={D} P={P} pr={pr} sp={sp} hoodRim={(lon, lat) => {
    const d: V3 = [Math.sin(lon) * Math.cos(lat), Math.sin(lat), Math.cos(lon) * Math.cos(lat)];
    const hs = HD ? HD.scale : 1;
    const p = g0(headM(add([0, -Hr[1] * 0.04, -Hr[2] * 0.12], [d[0] * Hr[0] * hs, d[1] * Hr[1] * hs, d[2] * Hr[2] * hs])));
    return { s: pr.scr(p), z: pr.camN(H(d))[2] };
  }} /> });

  const hands: Record<'L' | 'R', V3> = { L: [0, 0, 0], R: [0, 0, 0] };
  // ---- arms (character right is -x: the near side when he faces screen-right)
  ([['R', -1], ['L', 1]] as const).forEach(([name, side]) => {
    const A = D.arm;
    const l = name === 'R' ? P.armR : P.armL;
    const sh: V3 = [side * D.shoulder.x, D.shoulder.y, 0];
    const d1 = limbDir(side, l);
    const el = add(sh, mul(d1, A.upper));
    const fl = rad(l.flex);
    const fold: V3 = [0, Math.sin(fl), Math.cos(fl)]; // the way the elbow folds: forward, turning up as the arm comes up
    const d2 = norm(add(mul(d1, Math.cos(rad(l.bend))), mul(fold, Math.sin(rad(l.bend)))));
    const wr = add(el, mul(d2, A.lower));
    const ns = S(D.seg.limb);
    groups.push({ polys: xf(limb(sh, el, A.r0 * 1.08, A.r0 * 0.96, M.sleeve, ns), up, U), outline: true });
    const R = frameFor(d2);
    const hcL = add(wr, mul(d2, A.hand * 0.75));
    hands[name] = up(hcL);
    const pointing = P.point === name;
    const hr: V3 = pointing ? [A.hand * 0.85, A.hand * 0.9, A.hand * 0.8] : [A.hand * 0.86, A.hand * 1.08, A.hand * 0.72];
    const hand: Poly[] = [
      ...xf(ellipsoid([0, 0, 0], hr, M.skin, ns, Math.max(4, Math.round(ns * 0.6))), (p) => add(hcL, R(p)), R),
      ...ellipsoid(add(hcL, R([0, -A.hand * 0.1, A.hand * 0.62])), [A.hand * 0.34, A.hand * 0.34, A.hand * 0.34], M.skin, 10, 6),
    ];
    if (pointing) {
      const a = add(hcL, mul(d2, A.hand * 0.55));
      hand.push(...limb(a, add(a, mul(d2, A.hand * 1.25)), A.hand * 0.3, A.hand * 0.27, M.skin, 10, [false, true]));
    }
    groups.push({ joint: true, polys: xf([...limb(el, wr, A.r0 * 0.96, A.r1, M.sleeve, ns, [true, false]), ...tube(wr, add(wr, mul(d2, A.r1 * 0.5)), A.r1 * 1.12, A.r1 * 1.08, mat(mix(C.sleeve ?? C.hood, '#000000', 0.12)), ns), ...hand], up, U), outline: true });
  });

  // ---- legs (the pelvis isn't twisted: the hips stay square while the chest turns)
  ([['R', -1], ['L', 1]] as const).forEach(([name, side]) => {
    const L = D.leg;
    const l = name === 'R' ? P.legR : P.legL;
    const hp: V3 = [P.hip + side * L.hipX, T.hipY - T.below * 0.55, 0];
    const d1 = limbDir(side, l);
    const kn = add(hp, mul(d1, L.upper));
    const d2 = bendDir(d1, l.bend, -1);
    const an = add(kn, mul(d2, L.lower));
    const ns = S(D.seg.limb);
    groups.push({ polys: limb(hp, kn, L.r0, L.r0 * 0.92, M.pants, ns), outline: true });
    groups.push({ joint: true, polys: [...limb(kn, an, L.r0 * 0.92, L.r1, M.pants, ns, [true, false]), ...tube(an, add(an, [0, L.r1 * 0.6, 0]), L.r1 * 1.1, L.r1 * 1.1, mat(mix(C.pants, '#000000', 0.15)), ns)], outline: true });
    // the shoe: turned out a little, toe forward, a rubber sole
    const F = L.foot;
    const out = rad(side * 10);
    const fwd: Rot = (v) => rotY(v, out);
    const fc = add(an, fwd([0, -F[1] * 0.45, F[2] * 0.42]));
    groups.push({
      polys: [
        ...xf(ellipsoid([0, 0, 0], F, M.shoe, ns, Math.max(5, Math.round(ns * 0.6))), (p) => add(fc, fwd(p)), fwd),
        ...xf(ellipsoid([0, -F[1] * 0.62, 0], [F[0] * 1.08, F[1] * 0.42, F[2] * 1.06], M.sole, ns, 5), (p) => add(fc, fwd(p)), fwd),
      ],
      outline: true,
    });
  });

  // ---- stand it on the ground
  minY = Infinity;
  for (const g of groups) for (const P2 of g.polys) for (const p of P2.p) minY = Math.min(minY, p[1]);
  for (const g of groups) g.polys = g.polys.map((P2) => ({ ...P2, p: P2.p.map(g0) }));
  void sq;
  return { groups, head: g0(hc), hands: { L: g0(hands.L), R: g0(hands.R) } };
};

// ---------------------------------------------------------------- the face
type SP = (pr: Proj, lon: number, lat: number, lift?: number) => { s: [number, number]; z: number };
const pathOf = (pts: [number, number][], close = false) => 'M ' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ') + (close ? ' Z' : '');
const oval = (cx: number, cy: number, a: number, b: number, from = 0, to = Math.PI * 2, n = 22): [number, number][] =>
  Array.from({ length: n + 1 }).map((_, i) => {
    const t = from + ((to - from) * i) / n;
    return [cx + a * Math.cos(t), cy + b * Math.sin(t)];
  });

const Face: React.FC<{ D: Design; P: Pose3; pr: Proj; sp: SP; hoodRim: (lon: number, lat: number) => { s: [number, number]; z: number } }> = ({ D, P, pr, sp, hoodRim }) => {
  const E = D.eye;
  const C = D.col;
  const ink = C.ink;
  const s = pr.s;
  const toS = (pts: [number, number][]) => pts.map(([lo, la]) => sp(pr, lo, la).s);
  const vis = (lo: number, la: number) => sp(pr, lo, la).z > 0.14;
  const out: React.ReactNode[] = [];
  const sw = (k: number) => Math.max(1, k * s);
  const lid = mix(C.skin, '#C79A86', 0.25);

  // the hood's edge: a soft lip round the face (and stitches on the plush)
  const rim: [number, number][][] = [[]];
  const c = rad(D.hood ? D.hood.cut : 0);
  for (let i = 0; i <= (D.hood ? 48 : -1); i++) {
    const a = (i / 48) * Math.PI * 2;
    const d: V3 = [Math.sin(c) * Math.cos(a), Math.sin(c) * Math.sin(a), Math.cos(c)];
    const lon = Math.atan2(d[0], d[2]);
    const lat = Math.asin(d[1]);
    const r = hoodRim(lon, lat);
    if (r.z > 0.05 && d[1] > -0.72) rim[rim.length - 1].push(r.s);
    else if (rim[rim.length - 1].length) rim.push([]);
  }
  rim.filter((r) => r.length > 1).forEach((r, i) => {
    out.push(<path key={`rim${i}`} d={pathOf(r)} stroke={mix(C.hood, '#000000', 0.3)} strokeWidth={sw(3)} fill="none" strokeLinecap="round" opacity={0.6} />);
    if (D.stitches) out.push(<path key={`st${i}`} d={pathOf(r)} stroke={mix(C.hood, '#FFFFFF', 0.55)} strokeWidth={sw(1.4)} strokeDasharray={`${sw(4)} ${sw(3.5)}`} fill="none" />);
  });

  if (D.blush) {
    [-1, 1].forEach((sd) => {
      const cl = sd * (E.lon + 0.2);
      const ct = E.lat - E.h - 0.05;
      if (vis(cl, ct)) out.push(<path key={`bl${sd}`} d={pathOf(toS(oval(cl, ct, 0.11, 0.055)), true)} fill="#FF7E8A" opacity={0.42} />);
    });
  }

  // the eyes
  [-1, 1].forEach((sd) => {
    const cx = sd * E.lon;
    const cy = E.lat;
    if (!vis(cx, cy)) return;
    const lx = P.look[0] * E.w * 0.38;
    const ly = P.look[1] * E.h * 0.3;
    const k = `e${sd}`;
    const ex = P.expr;
    const happyArc = () => out.push(<path key={k + 'h'} d={pathOf(toS(oval(cx, cy - E.h * 0.25, E.w * 0.95, E.h * 0.8, 0, Math.PI, 14)))} stroke={ink} strokeWidth={sw(E.kind === 'bean' ? 6 : 4.2)} fill="none" strokeLinecap="round" />);
    const highlight = (px: number, py: number, r: number, key: string) => {
      const a = sp(pr, px, py).s;
      return <circle key={key} cx={a[0]} cy={a[1]} r={r} fill="#FFFFFF" />;
    };
    const lidOver = (w: number, h: number) =>
      out.push(<path key={k + 'l'} d={pathOf(toS([...oval(cx, cy, w * 1.12, h * 1.14, 0, Math.PI, 14), [cx - w * 1.12, cy + h * 0.06], [cx + w * 1.12, cy + h * 0.06]]), true)} fill={lid} stroke={ink} strokeWidth={sw(2.4)} strokeLinejoin="round" />);
    if (ex === 'happy' && E.kind !== 'button') return happyArc();
    if ((P.blink ?? 0) > 0.6 && E.kind !== 'button') {
      out.push(<path key={k + 'z'} d={pathOf(toS(oval(cx, cy - E.h * 0.1, E.w * 0.95, E.h * 0.35, Math.PI, Math.PI * 2, 12)))} stroke={ink} strokeWidth={sw(3.6)} fill="none" strokeLinecap="round" />);
      return;
    }
    const big = ex === 'shock' ? 1.18 : 1;
    const w = E.w * big;
    const h = E.h * (ex === 'shock' ? 1.22 : 1);
    if (E.kind === 'toon') {
      out.push(<path key={k + 's'} d={pathOf(toS(oval(cx, cy, w, h)), true)} fill="#FFFFFF" stroke={ink} strokeWidth={sw(2.6)} />);
      const pw = ex === 'shock' ? 0.3 : 0.52;
      out.push(<path key={k + 'p'} d={pathOf(toS(oval(cx + lx, cy + ly - h * 0.06, w * pw, h * (pw + 0.08))), true)} fill={ink} />);
      out.push(highlight(cx + lx + w * 0.16, cy + ly + h * 0.22, sw(3.2), k + 'g'));
      if (ex === 'smug' || ex === 'stern') lidOver(w, h * (ex === 'stern' ? 0.7 : 1));
    } else if (E.kind === 'bean') {
      out.push(<path key={k + 's'} d={pathOf(toS(oval(cx + lx * 0.4, cy + ly * 0.4, w, h)), true)} fill="#141A22" />);
      out.push(highlight(cx + lx * 0.4 + w * 0.38, cy + ly * 0.4 + h * 0.42, sw(6), k + 'g1'));
      out.push(highlight(cx + lx * 0.4 - w * 0.3, cy + ly * 0.4 - h * 0.36, sw(2.6), k + 'g2'));
      if (ex === 'smug' || ex === 'stern') lidOver(w, h * (ex === 'stern' ? 0.7 : 1));
    } else if (E.kind === 'bead') {
      out.push(<path key={k + 's'} d={pathOf(toS(oval(cx + lx * 0.5, cy + ly * 0.5, w, h)), true)} fill="#16120F" />);
      out.push(highlight(cx + lx * 0.5 + w * 0.32, cy + ly * 0.5 + h * 0.36, sw(2.8), k + 'g'));
      if (ex === 'smug') lidOver(w, h);
    } else if (E.kind === 'paper') {
      const dm: [number, number][] = [[cx, cy + h], [cx + w, cy], [cx, cy - h], [cx - w, cy]];
      out.push(<path key={k + 's'} d={pathOf(toS(dm), true)} fill={ink} />);
      if (ex === 'shock') out.push(<path key={k + 'i'} d={pathOf(toS([[cx + lx, cy + h * 0.35], [cx + lx + w * 0.35, cy], [cx + lx, cy - h * 0.35], [cx + lx - w * 0.35, cy]]), true)} fill={C.sole} />);
      out.push(<path key={k + 'g'} d={pathOf(toS([[cx + w * 0.15, cy + h * 0.62], [cx + w * 0.5, cy + h * 0.2], [cx + w * 0.12, cy + h * 0.28]]), true)} fill="#FFFFFF" opacity={0.85} />);
      if (ex === 'smug') out.push(<path key={k + 'l'} d={pathOf(toS([[cx - w * 1.15, cy + h * 0.05], [cx, cy + h * 1.15], [cx + w * 1.15, cy + h * 0.05]]), true)} fill={lid} stroke={ink} strokeWidth={sw(2)} />);
    } else {
      // a sewn-on button: a dark disc, a lighter ring, four holes and the thread across them
      const bw = E.w * (ex === 'shock' ? 1.15 : 1);
      out.push(<path key={k + 's'} d={pathOf(toS(oval(cx, cy, bw, bw * 1.05)), true)} fill="#22343C" stroke="#10181C" strokeWidth={sw(2)} />);
      out.push(<path key={k + 'r'} d={pathOf(toS(oval(cx, cy, bw * 0.72, bw * 0.75)), true)} fill="none" stroke="#3C5660" strokeWidth={sw(2.4)} />);
      const holes: [number, number][] = [[-0.25, 0.25], [0.25, 0.25], [0.25, -0.25], [-0.25, -0.25]].map(([a, b]) => [cx + a * bw, cy + b * bw]);
      const hs = toS(holes);
      out.push(<path key={k + 't'} d={`M ${hs[0][0]} ${hs[0][1]} L ${hs[2][0]} ${hs[2][1]} M ${hs[1][0]} ${hs[1][1]} L ${hs[3][0]} ${hs[3][1]}`} stroke={C.string} strokeWidth={sw(2)} />);
      hs.forEach((p, i) => out.push(<circle key={k + 'o' + i} cx={p[0]} cy={p[1]} r={sw(2)} fill="#0E1418" />));
      out.push(highlight(cx + bw * 0.45, cy + bw * 0.5, sw(2.2), k + 'g'));
    }
  });

  // the brows
  [-1, 1].forEach((sd) => {
    const cx = sd * E.lon;
    const base = E.lat + E.h + 0.09 + (P.expr === 'shock' ? 0.07 : P.expr === 'happy' ? 0.04 : 0);
    if (!vis(cx, base)) return;
    const raise = P.expr === 'smug' ? (sd > 0 ? 0.06 : -0.02) : P.expr === 'worried' ? 0.03 : P.expr === 'stern' ? -0.03 : 0;
    const tiltB = P.expr === 'smug' ? sd * 0.04 : P.expr === 'worried' ? -sd * 0.07 : P.expr === 'stern' ? sd * 0.08 : 0;
    const pts: [number, number][] = Array.from({ length: 7 }).map((_, i) => {
      const t = i / 6 - 0.5;
      return [cx + t * E.w * 1.7, base + raise + 0.035 * (1 - 4 * t * t) + tiltB * t * 2];
    });
    out.push(<path key={`b${sd}`} d={pathOf(toS(pts))} stroke={E.kind === 'button' ? mix(C.hood, '#000000', 0.25) : ink} strokeWidth={sw(E.kind === 'bean' ? 3 : 3.6)} fill="none" strokeLinecap="round" strokeDasharray={E.kind === 'button' ? `${sw(3)} ${sw(2)}` : undefined} />);
  });

  // the mouth
  const ml = D.mouth.lat;
  const mw = D.mouth.w;
  if (vis(0, ml)) {
    const line = (f: (t: number) => number, n = 12): [number, number][] => Array.from({ length: n + 1 }).map((_, i) => {
      const t = (i / n) * 2 - 1;
      return [(t * mw) / 2, f(t)];
    });
    const dash = E.kind === 'button' ? `${sw(4)} ${sw(2.5)}` : undefined;
    const msw = sw(E.kind === 'bean' ? 3 : 3.4);
    if (P.expr === 'neutral') out.push(<path key="m" d={pathOf(toS(E.kind === 'paper' ? [[-mw / 2, ml + 0.01], [0, ml - 0.04], [mw / 2, ml + 0.01]] : line((t) => ml - 0.045 * (1 - t * t))))} stroke={ink} strokeWidth={msw} fill="none" strokeLinecap="round" strokeDasharray={dash} />);
    if (P.expr === 'stern') out.push(<path key="m" d={pathOf(toS(line((t) => ml + 0.005 * t * t)))} stroke={ink} strokeWidth={msw} fill="none" strokeLinecap="round" strokeDasharray={dash} />);
    if (P.expr === 'worried') out.push(<path key="m" d={pathOf(toS(line((t) => ml - 0.03 + 0.03 * (1 - t * t) + 0.012 * Math.sin(t * 6))))} stroke={ink} strokeWidth={msw} fill="none" strokeLinecap="round" strokeDasharray={dash} />);
    if (P.expr === 'smug') out.push(<path key="m" d={pathOf(toS(line((t) => ml - 0.02 * (1 - t * t) + 0.035 * t)))} stroke={ink} strokeWidth={msw} fill="none" strokeLinecap="round" strokeDasharray={dash} />);
    if (P.expr === 'happy') {
      const top = line((t) => ml + 0.012 - 0.012 * (1 - t * t));
      const bot = line((t) => ml - 0.14 * (1 - t * t)).reverse();
      out.push(<path key="m" d={pathOf(toS([...top, ...bot]), true)} fill={C.mouth} stroke={ink} strokeWidth={sw(2.6)} strokeLinejoin="round" />);
      out.push(<path key="mt" d={pathOf(toS(oval(0, ml - 0.1, mw * 0.18, 0.035)), true)} fill="#F28A8A" />);
    }
    if (P.expr === 'shock') out.push(<path key="m" d={pathOf(toS(oval(0, ml - 0.035, mw * 0.17, 0.085)), true)} fill={C.mouth} stroke={ink} strokeWidth={sw(2.6)} />);
  }
  return <g>{out}</g>;
};

// ---------------------------------------------------------------- the figure
/** Juno in a design and a pose, seen at `yaw`, standing at screen (x, y), `s` pixels per unit. */
export const Juno3D: React.FC<{ D: Design; P: Pose3; yaw: number; x: number; y: number; s: number; q?: number; id: string; pitch?: number; shadow?: boolean }> = ({ D, P, yaw, x, y, s, q = 1, id, pitch = 0.14, shadow = true }) => {
  const { groups } = React.useMemo(() => buildJuno(D, P, q), [D, P, q]);
  const fid = `${id}f`;
  return (
    <g>
      {shadow ? <ellipse cx={x} cy={y + 2 * s} rx={74 * s} ry={13 * s} fill="#000000" opacity={0.38} /> : null}
      {D.filter ? (
        <defs>
          {D.filter === 'clay' ? (
            <filter id={fid} x="-15%" y="-10%" width="130%" height="120%">
              {/* a slow wobble on the edges (hand-made, not machined) and faint thumb-pressed dents */}
              <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={2} seed={4} result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale={3.2 * s} xChannelSelector="R" yChannelSelector="G" result="d" />
              <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves={2} seed={8} result="t" />
              <feColorMatrix in="t" type="matrix" values="0 0 0 0 0.25  0 0 0 0 0.15  0 0 0 0 0.1  0.55 0 0 0 -0.27" result="ta" />
              <feComposite in="ta" in2="d" operator="in" result="tx" />
              <feMerge>
                <feMergeNode in="d" />
                <feMergeNode in="tx" />
              </feMerge>
            </filter>
          ) : (
            <filter id={fid} x="-15%" y="-10%" width="130%" height="120%">
              {/* felt: a fine fuzz on the edges and a soft light nap across the surface */}
              <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves={1} seed={2} result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale={2.6 * s} xChannelSelector="R" yChannelSelector="G" result="d" />
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={5} result="t" />
              <feColorMatrix in="t" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.5 0 0 0 -0.3" result="ta" />
              <feComposite in="ta" in2="d" operator="in" result="tx" />
              <feMerge>
                <feMergeNode in="d" />
                <feMergeNode in="tx" />
              </feMerge>
            </filter>
          )}
        </defs>
      ) : null}
      <g filter={D.filter ? `url(#${fid})` : undefined}>
        <Render3D groups={groups} yaw={yaw} pitch={pitch} x={x} y={y} s={s} sh={D.sh} id={id} />
      </g>
    </g>
  );
};

/** The same figure for any of the cast (Juno, Bea or the suit, by Design): built in 3D, or drawn as a 2D stick figure. */
export const Fig3D: typeof Juno3D = (props) => (props.D.stick ? <Stick2D {...props} /> : <Juno3D {...props} />);

type Key3 = { f: number; p: Partial<Pose3>; ease?: (t: number) => number };
const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpL = (a: Limb3, b: Limb3, t: number): Limb3 => ({ abd: lerpN(a.abd, b.abd, t), flex: lerpN(a.flex, b.flex, t), bend: lerpN(a.bend, b.bend, t) });
const smooth = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Eased keys for the 3D rig, like poseAt: numbers and limbs interpolate, the face and the pointing hand swap at their key. */
const poseRaw = (f: number, keys: Key3[], from: Pose3 = A_POSE): Pose3 => {
  const full: { f: number; p: Pose3; ease?: (t: number) => number }[] = [];
  let cur = from;
  for (const k of keys) {
    cur = { ...cur, ...k.p };
    full.push({ f: k.f, p: cur, ease: k.ease });
  }
  if (f <= full[0].f) return full[0].p;
  for (let i = 0; i < full.length - 1; i++) {
    const A = full[i].p;
    const B = full[i + 1].p;
    if (f <= full[i + 1].f) {
      const t = (full[i + 1].ease ?? smooth)((f - full[i].f) / Math.max(1e-6, full[i + 1].f - full[i].f));
      return {
        ...A,
        twist: lerpN(A.twist, B.twist, t), tilt: lerpN(A.tilt, B.tilt, t), lean: lerpN(A.lean, B.lean, t),
        headTurn: lerpN(A.headTurn, B.headTurn, t), headTilt: lerpN(A.headTilt, B.headTilt, t), headNod: lerpN(A.headNod, B.headNod, t), hip: lerpN(A.hip, B.hip, t),
        armL: lerpL(A.armL, B.armL, t), armR: lerpL(A.armR, B.armR, t), legL: lerpL(A.legL, B.legL, t), legR: lerpL(A.legR, B.legR, t),
        look: [lerpN(A.look[0], B.look[0], t), lerpN(A.look[1], B.look[1], t)],
        squash: lerpN(A.squash ?? 0, B.squash ?? 0, t), blink: lerpN(A.blink ?? 0, B.blink ?? 0, t),
      };
    }
  }
  return full[full.length - 1].p;
};
/** A damped spring chasing xs (oldest first), one step a frame: how far it trails the last value. */
const trail = (xs: number[], w: number, z: number) => {
  let x = xs[0];
  let v = 0;
  for (let i = 1; i < xs.length; i++) {
    v += -w * w * (x - xs[i]) - 2 * z * w * v;
    x += v;
  }
  return x - xs[xs.length - 1];
};
const HIST = 30;
/** Eased keys, plus follow-through: the head, hair, elbows and squash trail the body and overshoot, then settle. */
export const pose3At = (f: number, keys: Key3[], from: Pose3 = A_POSE): Pose3 => {
  const P = poseRaw(f, keys, from);
  const hist = Array.from({ length: HIST + 1 }).map((_, i) => poseRaw(f - HIST + i, keys, from));
  const ch = (g: (q: Pose3) => number, w: number, z: number) => trail(hist.map(g), w, z);
  const fx: Fx3 = {
    nod: ch((q) => q.lean + q.headNod, 0.34, 0.3),
    tilt: ch((q) => q.tilt + q.headTilt, 0.34, 0.3),
    lean: 0.6 * ch((q) => q.lean, 0.42, 0.34),
    btilt: 0.6 * ch((q) => q.tilt, 0.42, 0.34),
    armL: ch((q) => q.armL.flex + q.armL.abd, 0.3, 0.32),
    armR: ch((q) => q.armR.flex + q.armR.abd, 0.3, 0.32),
    hair: 1.6 * ch((q) => q.tilt + q.headTilt + 0.5 * (q.lean + q.headNod) + 0.3 * q.twist, 0.22, 0.2),
    sq: ch((q) => q.squash ?? 0, 0.5, 0.24),
  };
  return { ...P, t: f, fx };
};
/** Faces swap through a blink, two frames either side of each change. */
export const face3At = (f: number, keys: [number, Expr3][]): { expr: Expr3; blink: number } => {
  let expr = keys[0][1];
  let blink = 0;
  keys.forEach(([k, e], i) => {
    if (f >= k) expr = e;
    if (i > 0 && f >= k - 2 && f < k + 1) blink = 1;
  });
  return { expr, blink };
};

/** The rest of the cast in a style: Bea (the little sister) and the man in the suit, derived from that style's Juno. */
export const castFor = (D: Design, who: 'juno' | 'bea' | 'suit'): Design => {
  if (who === 'juno') return D;
  const k = who === 'bea' ? 0.7 : 1.15;
  const kh = who === 'bea' ? 0.84 : 0.92;
  const T = D.torso;
  const torso = { hipY: T.hipY * k, below: T.below * k, chest: T.chest * k, rHip: T.rHip * k * (who === 'bea' ? 1.32 : 1.02), rChest: T.rChest * k * (who === 'suit' ? 1.08 : 1), depth: T.depth };
  const gap = D.head.y - (T.hipY + T.chest + T.rChest * 0.3) - D.head.r[1] * 0.85;
  const r: V3 = [D.head.r[0] * kh, D.head.r[1] * kh * (who === 'suit' ? 1.05 : 1), D.head.r[2] * kh];
  const head = { r, y: torso.hipY + torso.chest + torso.rChest * 0.3 + gap * k + r[1] * 0.85 };
  const sc = (o: { [key: string]: number }) => Object.fromEntries(Object.entries(o).map(([a, b]) => [a, b * k]));
  const base: Design = {
    ...D,
    key: `${D.key}-${who}`,
    head,
    torso,
    shoulder: { x: D.shoulder.x * k * (who === 'suit' ? 1.1 : 1), y: D.shoulder.y * k },
    arm: sc(D.arm) as Design['arm'],
    leg: { ...(sc({ hipX: D.leg.hipX, upper: D.leg.upper, lower: D.leg.lower, r0: D.leg.r0, r1: D.leg.r1 }) as Omit<Design['leg'], 'foot'>), foot: mul(D.leg.foot, k) },
    hood: null,
    stitches: D.stitches,
  };
  if (D.stick) base.stick = { who };
  if (who === 'bea')
    return { ...base, hair: 'bunches', outfit: 'pinafore', blush: true, col: { ...D.col, hood: '#F0B53A', hoodIn: '#B07A1E', sleeve: '#F7F0E2', pants: '#F3E7CD', shoe: '#E4523B', sole: '#FFFFFF', hair: '#5A3226' } };
  return { ...base, hair: 'comb', outfit: 'suit', blush: false, nose: D.nose, col: { ...D.col, hood: '#4A5468', hoodIn: '#2E3442', sleeve: '#4A5468', pants: '#3E4658', shoe: '#17191F', sole: '#2A2D35', hair: '#1E1A1A', tie: '#C42A3A', shirt: '#F2EEE6', skin: '#E9CBB0' } };
};

/** Where a figure's hand is on screen (to put a prop in it), for the same D, P, yaw, x, y, s as the figure. */
export const handAt = (D: Design, P: Pose3, side: 'L' | 'R', yaw: number, x: number, y: number, s: number, pitch = 0.14) => {
  if (D.stick) return stickHandAt(D, P, side, yaw, x, y, s, pitch);
  const { hands } = buildJuno(D, P, 0.5);
  const c = rotX(rotY(hands[side], yaw), pitch);
  return { x: x + c[0] * s, y: y - c[1] * s };
};
/** Where the head's centre is on screen, likewise (for close-ups and glints). */
export const headAt = (D: Design, P: Pose3, yaw: number, x: number, y: number, s: number, pitch = 0.14) => {
  if (D.stick) return stickHeadAt(D, P, yaw, x, y, s, pitch);
  const { head } = buildJuno(D, P, 0.5);
  const c = rotX(rotY(head, yaw), pitch);
  return { x: x + c[0] * s, y: y - c[1] * s };
};
