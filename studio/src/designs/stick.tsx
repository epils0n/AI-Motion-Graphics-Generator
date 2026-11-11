import React from 'react';
import { useCurrentFrame } from 'remotion';
import { V3, add, sub, mul, dot, len, norm, rad, rotX, rotY, rotZ, Rot } from '../engine3d';
import type { Design, Pose3, Limb3 } from './juno3d';
import { NP } from '../episodes/shrink/style';

// The cast as stick figures, cut from the same ink and paper as the sets: one flat black silhouette each, paper-white
// eyes, a paper edge on the lit side and a hard shadow, like every other cut-card thing in the world. No skin, no
// shading: who's who comes from size, hair, eyes and one telling shape (Juno's hood and strings, Bea's bunches and
// dress, the suit's square shoulders, shirt and glasses).
//
// The shots pose the cast with Pose3; this rig draws those poses in 2D and adds the life a drawn character has:
// limbs that bend in curves, a head and hair that trail the body and overshoot (pose3At's springs), breathing, a slow
// idle sway, blinks, a squash on every landing and a little pop on every change of face.

type P2 = [number, number];
type Who = 'juno' | 'bea' | 'suit';
const INK = NP.ink;
const PAPER = NP.paper;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

// ---------------------------------------------------------------- the pose as drawn
const seedOf = (who: Who) => (who === 'juno' ? 0.3 : who === 'bea' ? 1.7 : 2.9);
const whoOf = (D: Design): Who => D.stick?.who ?? 'juno';

/** The pose with its life added: follow-through, breathing and sway, and a bouncier walk. */
export const livePose = (D: Design, P: Pose3): Pose3 => {
  const fx = P.fx;
  const sd = seedOf(whoOf(D));
  const t = P.t;
  const breathe = t === undefined ? 0 : Math.sin(t / 9 + sd);
  const sway = t === undefined ? 0 : Math.sin(t / 14 + sd * 2);
  const w = P.walk;
  const walking = w !== undefined;
  const arm = (l: Limb3, trail: number): Limb3 => ({ abd: l.abd, flex: l.flex * (walking ? 1.4 : 1), bend: clamp(l.bend - trail * 0.8, 0, 160) });
  return {
    ...P,
    lean: P.lean + (fx?.lean ?? 0) + (walking ? 5 : 1.2 * sway),
    tilt: P.tilt + (fx?.btilt ?? 0) + (walking ? 0 : 1.0 * sway),
    headNod: P.headNod + (fx?.nod ?? 0) + 1.6 * breathe + (walking ? 3.5 * Math.sin(2 * w) : 0),
    headTilt: P.headTilt + (fx?.tilt ?? 0) + 1.4 * sway,
    armL: arm(P.armL, fx?.armL ?? 0),
    armR: arm(P.armR, fx?.armR ?? 0),
    squash: 1.4 * (P.squash ?? 0) + 1.2 * (fx?.sq ?? 0) + (walking ? 0.04 * Math.abs(Math.cos(w)) - 0.02 : 0),
  };
};

// ---------------------------------------------------------------- the skeleton (the same joints as the 3D rig)
const limbDir = (side: number, l: Limb3): V3 => {
  const a = rad(l.abd);
  const f = rad(l.flex);
  const d: V3 = [side * Math.sin(a), -Math.cos(a), 0];
  return norm([d[0], d[1] * Math.cos(f), -d[1] * Math.sin(f)]);
};
const bendDir = (d1: V3, bend: number, sign: 1 | -1): V3 => {
  const z: V3 = [0, 0, sign];
  let f = sub(z, mul(d1, dot(z, d1)));
  if (len(f) < 0.2) f = sub([0, 1, 0], mul(d1, d1[1]));
  f = norm(f);
  const b = rad(bend);
  return norm(add(mul(d1, Math.cos(b)), mul(f, Math.sin(b))));
};

type Arm = { sh: V3; el: V3; wr: V3; hand: V3; dir: V3 };
/** Where the limbs join the stick body: just inside its outline, so an arm never hangs from thin air. */
const shoulderX = (D: Design) => (whoOf(D) === 'suit' ? D.shoulder.x * 1.06 : D.torso.rChest * 0.46) * 0.7;
const hipX = (D: Design) => D.torso.rHip * 0.48 * 0.42;
type Leg = { hp: V3; kn: V3; an: V3; foot: V3; toe: V3 };
const skel = (D: Design, Q: Pose3) => {
  const T = D.torso;
  const U: Rot = (v) => rotY(rotZ(rotX(v, rad(Q.lean)), rad(-Q.tilt)), rad(Q.twist));
  const pelvis: V3 = [Q.hip, T.hipY, 0];
  const up = (p: V3): V3 => add(pelvis, U(p));
  const H: Rot = (v) => U(rotY(rotZ(rotX(v, rad(-Q.headNod)), rad(-Q.headTilt)), rad(Q.headTurn)));
  const neckLocal: V3 = [0, T.chest + T.rChest * 0.3, 0];
  const headLocal: V3 = [0, D.head.y - T.hipY, 0];
  const hc = add(up(neckLocal), H(sub(headLocal, neckLocal)));
  const arms = {} as Record<'L' | 'R', Arm>;
  (['L', 'R'] as const).forEach((name) => {
    const side = name === 'R' ? -1 : 1;
    const A = D.arm;
    const l = name === 'R' ? Q.armR : Q.armL;
    const sh: V3 = [side * shoulderX(D), D.shoulder.y, 0];
    const d1 = limbDir(side, l);
    const el = add(sh, mul(d1, A.upper));
    const fl = rad(l.flex);
    const fold: V3 = [0, Math.sin(fl), Math.cos(fl)];
    const d2 = norm(add(mul(d1, Math.cos(rad(l.bend))), mul(fold, Math.sin(rad(l.bend)))));
    const wr = add(el, mul(d2, A.lower));
    arms[name] = { sh: up(sh), el: up(el), wr: up(wr), hand: up(add(wr, mul(d2, A.hand * 0.75))), dir: U(d2) };
  });
  const legs = {} as Record<'L' | 'R', Leg>;
  (['L', 'R'] as const).forEach((name) => {
    const side = name === 'R' ? -1 : 1;
    const L = D.leg;
    const l = name === 'R' ? Q.legR : Q.legL;
    const hp: V3 = [Q.hip + side * hipX(D), T.hipY - T.below * 0.55, 0];
    const d1 = limbDir(side, l);
    const kn = add(hp, mul(d1, L.upper));
    const an = add(kn, mul(bendDir(d1, l.bend, -1), L.lower));
    const out = rad(side * 10);
    const F = L.foot;
    legs[name] = { hp, kn, an, foot: add(an, rotY([0, -F[1] * 0.45, F[2] * 0.42], out)), toe: rotY([0, 0, 1], out) };
  });
  // stand it on the ground (its lowest point), then squash and stretch about the feet
  const F = D.leg.foot;
  const minY = Math.min(legs.L.foot[1] - F[1] * 1.04, legs.R.foot[1] - F[1] * 1.04, arms.L.hand[1] - D.arm.hand, arms.R.hand[1] - D.arm.hand, hc[1] - D.head.r[1]);
  const sq = Q.squash ?? 0;
  const g0 = (p: V3): V3 => [p[0] * (1 + sq * 0.5), (p[1] - minY) * (1 - sq), p[2] * (1 + sq * 0.5)];
  return { U, H, up, hc, arms, legs, g0, pelvis };
};

const camOf = (yaw: number, pitch: number) => (v: V3) => rotX(rotY(v, yaw), pitch);
const norm2 = (v: P2): P2 => {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
};
/**
 * One limb segment as a 2D figure draws it, from joint a along the modelled screen vector v: never shorter than 80%
 * of its length (a flat figure has no shading to sell foreshortening, so a limb aimed at the camera read as a stub),
 * and one aimed straight at the camera hangs down and out instead of pointing nowhere.
 */
const seg2 = (a: P2, v: P2, L: number, out: number): P2 => {
  const l = Math.hypot(v[0], v[1]);
  const k = clamp(1 - l / (0.35 * L), 0, 1);
  let d: P2 = l > 1e-6 ? [v[0] / l, v[1] / l] : [0, 1];
  if (k > 0) {
    const fb = norm2([out * 0.45, 1]);
    d = norm2([d[0] * (1 - k) + fb[0] * k, d[1] * (1 - k) + fb[1] * k]);
  }
  const nl = L * (0.8 + 0.2 * clamp(l / L, 0, 1));
  return [a[0] + d[0] * nl, a[1] + d[1] * nl];
};
type Arm2 = { sh: P2; el: P2; wr: P2; hand: P2; dir: P2; z: number };
type Leg2 = { hp: P2; kn: P2; an: P2; foot: P2; toe: P2; z: number };
/** The figure laid out flat, in its own units (y down, feet at 0): what the drawing and handAt both use. */
const layout = (D: Design, P: Pose3, yaw: number, pitch: number) => {
  const Q = livePose(D, P);
  const K = skel(D, Q);
  const camD = camOf(yaw, pitch);
  const raw = (p: V3): P2 => {
    const c = camD(K.g0(p));
    return [c[0], -c[1]];
  };
  // depth for drawing order, from the turn alone: tilting the camera up mustn't put the head behind the body
  const zz = (p: V3) => rotY(K.g0(p), yaw)[2];
  const dir2 = (v: V3): P2 => {
    const c = camD(v);
    return [c[0], -c[1]];
  };
  const ks = 1 - 0.4 * (Q.squash ?? 0);
  const c0 = raw(K.pelvis);
  const flip = Math.cos(yaw) >= 0 ? 1 : -1;
  const arms = {} as Record<'L' | 'R', Arm2>;
  (['L', 'R'] as const).forEach((name) => {
    const A = K.arms[name];
    const sh = raw(A.sh);
    const out = Math.sign(sh[0] - c0[0]) || (name === 'R' ? -1 : 1) * flip;
    const e0 = raw(A.el);
    const el = seg2(sh, [e0[0] - sh[0], e0[1] - sh[1]], D.arm.upper * ks, out);
    const w0 = raw(A.wr);
    const wr = seg2(el, [w0[0] - e0[0], w0[1] - e0[1]], D.arm.lower * ks, out);
    const d = norm2([wr[0] - el[0], wr[1] - el[1]]);
    arms[name] = { sh, el, wr, hand: [wr[0] + d[0] * D.arm.hand * 0.75, wr[1] + d[1] * D.arm.hand * 0.75], dir: d, z: (zz(A.sh) + zz(A.el) + zz(A.wr) + zz(A.hand)) / 4 + 2 };
  });
  const legs = {} as Record<'L' | 'R', Leg2>;
  (['L', 'R'] as const).forEach((name) => {
    const L = K.legs[name];
    const hp = raw(L.hp);
    const out = Math.sign(hp[0] - c0[0]) || (name === 'R' ? -1 : 1) * flip;
    const k0 = raw(L.kn);
    const kn = seg2(hp, [k0[0] - hp[0], k0[1] - hp[1]], D.leg.upper * ks, out);
    const a0 = raw(L.an);
    const an = seg2(kn, [a0[0] - k0[0], a0[1] - k0[1]], D.leg.lower * ks, out);
    const f0 = raw(L.foot);
    legs[name] = { hp, kn, an, foot: [an[0] + f0[0] - a0[0], an[1] + f0[1] - a0[1]], toe: dir2(L.toe), z: (zz(L.hp) + zz(L.kn) + zz(L.an)) / 3 - 6 };
  });
  // stand the flat figure where the modelled one stood: its lowest foot on the same line
  const dy = Math.max(raw(K.legs.L.foot)[1], raw(K.legs.R.foot)[1]) - Math.max(legs.L.foot[1], legs.R.foot[1]);
  const mv = (p: P2): P2 => [p[0], p[1] + dy];
  for (const a of Object.values(arms)) Object.assign(a, { sh: mv(a.sh), el: mv(a.el), wr: mv(a.wr), hand: mv(a.hand) });
  for (const l of Object.values(legs)) Object.assign(l, { hp: mv(l.hp), kn: mv(l.kn), an: mv(l.an), foot: mv(l.foot) });
  const pt = (p: V3): P2 => mv(raw(p));
  return { Q, K, camD, pt, zz, dir2, arms, legs };
};

export const stickHandAt = (D: Design, P: Pose3, side: 'L' | 'R', yaw: number, x: number, y: number, s: number, pitch = 0.14) => {
  const h = layout(D, P, yaw, pitch).arms[side].hand;
  return { x: x + h[0] * s, y: y + h[1] * s };
};
export const stickHeadAt = (D: Design, P: Pose3, yaw: number, x: number, y: number, s: number, pitch = 0.14) => {
  const Lo = layout(D, P, yaw, pitch);
  const h = Lo.pt(Lo.K.hc);
  return { x: x + h[0] * s, y: y + h[1] * s };
};

// ---------------------------------------------------------------- drawing helpers
const f1 = (v: number) => v.toFixed(1);
const pathOf = (pts: P2[], close = true) => 'M ' + pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join(' L ') + (close ? ' Z' : '');
const lerp2 = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** A limb through three joints as one curve (rubber hose): it bends where the joint is, never kinks. */
const hose = (a: P2, m: P2, b: P2) => {
  const mid = lerp2(a, b, 0.5);
  const c: P2 = [m[0] + (m[0] - mid[0]) * 0.6, m[1] + (m[1] - mid[1]) * 0.6];
  return `M ${f1(a[0])} ${f1(a[1])} Q ${f1(c[0])} ${f1(c[1])} ${f1(b[0])} ${f1(b[1])}`;
};

type Eye = { lon: number; lat: number; w: number; h: number; pupil: number; lid0: number; lashes?: boolean; glasses?: boolean };
const EYES: Record<Who, Eye> = {
  juno: { lon: 0.34, lat: 0.1, w: 0.17, h: 0.24, pupil: 0.085, lid0: 0 },
  bea: { lon: 0.36, lat: 0.02, w: 0.2, h: 0.27, pupil: 0.11, lid0: 0, lashes: true },
  suit: { lon: 0.32, lat: 0.12, w: 0.17, h: 0.11, pupil: 0.07, lid0: 0.15, glasses: true },
};
// how far the lid comes down (0 open .. 1 shut) and how it slants (+ frowns, - worries)
const LIDS: Record<string, [number, number]> = { neutral: [0, 0], shock: [0, 0], happy: [0, 0], smug: [0.48, 0.1], worried: [0.28, -0.7], stern: [0.36, 0.8] };

// ---------------------------------------------------------------- the figure
export const Stick2D: React.FC<{ D: Design; P: Pose3; yaw: number; x: number; y: number; s: number; q?: number; id: string; pitch?: number; shadow?: boolean }> = ({ D, P, yaw, x, y, s, id, pitch = 0.14, shadow = true }) => {
  const frame = useCurrentFrame();
  const who = whoOf(D);
  const Lo = layout(D, P, yaw, pitch);
  const { Q, K, camD, pt, zz } = Lo;
  const dir2 = Lo.dir2;
  const T = D.torso;
  const R = D.head.r[0] * 1.06;
  const armW = D.arm.r0;
  const legW = D.leg.r0 * 0.92;
  const hipHalf = T.rHip * 0.48;
  const chestHalf = who === 'suit' ? D.shoulder.x * 1.06 : T.rChest * 0.46;
  const H0 = T.chest + T.below;

  // the torso's width across the screen, from its two body axes (so it narrows as it turns)
  const ex = dir2(K.U([1, 0, 0]));
  const ez = dir2(K.U([0, 0, 1]));
  const b2 = pt(K.up([0, -T.below - T.rHip * 0.12, 0]));
  const t2 = pt(K.up([0, T.chest + T.rChest * 0.12, 0]));
  let u: P2 = [t2[0] - b2[0], t2[1] - b2[1]];
  const ul = Math.hypot(u[0], u[1]) || 1;
  u = [u[0] / ul, u[1] / ul];
  const n: P2 = [-u[1], u[0]];
  const across = (w: number) => w * Math.hypot(n[0] * ex[0] + n[1] * ex[1], T.depth * (n[0] * ez[0] + n[1] * ez[1]));
  const capsule = (a: P2, ha: number, b: P2, hb: number, flatTop = 1) => {
    const pts: P2[] = [];
    for (let i = 0; i <= 10; i++) {
      const th = (Math.PI * i) / 10;
      pts.push([b[0] + hb * n[0] * Math.cos(th) + hb * flatTop * u[0] * Math.sin(th), b[1] + hb * n[1] * Math.cos(th) + hb * flatTop * u[1] * Math.sin(th)]);
    }
    for (let i = 0; i <= 10; i++) {
      const th = (Math.PI * i) / 10;
      pts.push([a[0] - ha * n[0] * Math.cos(th) - ha * u[0] * Math.sin(th), a[1] - ha * n[1] * Math.cos(th) - ha * u[1] * Math.sin(th)]);
    }
    return pathOf(pts);
  };
  const frontOn = camD(K.U([0, 0, 1]))[2];

  // ---- the parts, each one flat ink, sorted back to front
  type Part = { z: number; key: string; ink: React.ReactNode; over?: React.ReactNode };
  const parts: Part[] = [];

  // torso, with each character's telling shape
  const torsoInk: React.ReactNode[] = [<path key="t" d={capsule(b2, across(hipHalf), t2, across(chestHalf), who === 'suit' ? 0.45 : 1)} />];
  const torsoOver: React.ReactNode[] = [];
  if (who === 'juno') {
    // the hood, bunched at the back of the neck; the drawstrings on the front
    const hb = pt(K.up([0, T.chest + T.rChest * 0.15, -T.rChest * 0.55]));
    torsoInk.push(<circle key="h" cx={hb[0]} cy={hb[1]} r={T.rChest * 0.5} />);
    if (frontOn > 0.25)
      [-1, 1].forEach((sd) => {
        const a = pt(K.up([sd * 0.26 * chestHalf, T.chest - 0.02 * H0, chestHalf * T.depth * 0.9]));
        const b = pt(K.up([sd * 0.3 * chestHalf, T.chest - 0.42 * H0, chestHalf * T.depth * 0.9]));
        torsoOver.push(
          <g key={`s${sd}`} opacity={clamp((frontOn - 0.25) * 4, 0, 1)}>
            <path d={`M ${f1(a[0])} ${f1(a[1])} L ${f1(b[0])} ${f1(b[1])}`} stroke={PAPER} strokeWidth={3.2} strokeLinecap="round" />
            <circle cx={b[0]} cy={b[1]} r={3.6} fill={PAPER} />
          </g>,
        );
      });
  }
  if (who === 'bea') {
    // an A-line dress over the hips
    const wa = pt(K.up([0, -T.below + 0.3 * H0, 0]));
    const he = pt(K.up([0, -T.below - D.leg.upper * 0.45, 0]));
    const hw = across(hipHalf * 0.95);
    const hh = across(hipHalf * 1.8);
    torsoInk.push(<path key="d" d={pathOf([[wa[0] + n[0] * hw, wa[1] + n[1] * hw], [he[0] + n[0] * hh, he[1] + n[1] * hh], [he[0] - u[0] * 6, he[1] - u[1] * 6], [he[0] - n[0] * hh, he[1] - n[1] * hh], [wa[0] - n[0] * hw, wa[1] - n[1] * hw]])} strokeLinejoin="round" stroke={INK} strokeWidth={6} />);
  }
  if (who === 'suit' && frontOn > 0.2) {
    // the shirt in the V of the jacket, and the tie
    const at = (x: number, yy: number): P2 => pt(K.up([x, yy, chestHalf * T.depth * 0.85]));
    const yt = T.chest + T.rChest * 0.12;
    const yv = T.chest - 0.48 * H0;
    const o = clamp((frontOn - 0.2) * 4, 0, 1);
    torsoOver.push(
      <g key="v" opacity={o}>
        <path d={pathOf([at(-0.42 * chestHalf, yt), at(0, yv), at(0.42 * chestHalf, yt)])} fill={PAPER} />
        <path d={pathOf([at(-0.07 * chestHalf, yt - 2), at(0.07 * chestHalf, yt - 2), at(0.12 * chestHalf, yv + 0.2 * H0), at(0, yv + 0.04 * H0), at(-0.12 * chestHalf, yv + 0.2 * H0)])} fill={INK} />
      </g>,
    );
  }
  parts.push({ z: zz(K.pelvis), key: 'torso', ink: torsoInk, over: torsoOver });

  // legs and feet
  (['L', 'R'] as const).forEach((name) => {
    const L = Lo.legs[name];
    const F = D.leg.foot;
    const a = L.hp;
    const m = L.kn;
    const b = L.an;
    const fc = L.foot;
    const toe = L.toe;
    const tl = Math.hypot(toe[0], toe[1]);
    const rx = F[0] * 0.95 + (F[2] * 0.85 - F[0] * 0.95) * clamp(tl, 0, 1);
    const ang = tl > 0.25 ? (Math.atan2(toe[1], toe[0]) * 180) / Math.PI : 0;
    parts.push({
      z: L.z, // a little behind the hips, which sit in front of the tops of the legs
      key: `leg${name}`,
      ink: [
        <path key="l" d={hose(a, m, b)} stroke={INK} strokeWidth={legW} strokeLinecap="round" fill="none" />,
        <ellipse key="f" cx={fc[0]} cy={fc[1]} rx={rx} ry={F[1] * 0.74} transform={`rotate(${f1(ang > 90 ? ang - 180 : ang < -90 ? ang + 180 : ang)} ${f1(fc[0])} ${f1(fc[1])})`} />,
      ],
    });
  });

  // arms and mitten hands (a finger out when pointing)
  (['L', 'R'] as const).forEach((name) => {
    const A = Lo.arms[name];
    const a = A.sh;
    const m = A.el;
    const b = A.wr;
    const h = A.hand;
    const ink: React.ReactNode[] = [
      <path key="a" d={hose(a, m, b) + ` L ${f1(h[0])} ${f1(h[1])}`} stroke={INK} strokeWidth={armW} strokeLinecap="round" strokeLinejoin="round" fill="none" />,
      <circle key="h" cx={h[0]} cy={h[1]} r={D.arm.hand * 0.74} />,
    ];
    if (Q.point === name) {
      const d = A.dir;
      const e: P2 = [h[0] + d[0] * D.arm.hand * 1.4, h[1] + d[1] * D.arm.hand * 1.4];
      ink.push(<path key="p" d={`M ${f1(h[0])} ${f1(h[1])} L ${f1(e[0])} ${f1(e[1])}`} stroke={INK} strokeWidth={D.arm.hand * 0.5} strokeLinecap="round" />);
    }
    parts.push({ z: A.z, key: `arm${name}`, ink });
  });

  // ---- the head: one round shape, the hair, and the face on top
  const hc2 = pt(K.hc);
  const neck0 = pt(K.up([0, T.chest + T.rChest * 0.1, 0]));
  const hu = camD(K.H([0, 1, 0]));
  const roll = (Math.atan2(hu[0], hu[1]) * 180) / Math.PI;
  const fwd = camD(K.H([0, 0, 1]));
  const fo = fwd[0]; // -1..1: which way the face is turned
  const sd0 = seedOf(who);
  const swing = (P.fx?.hair ?? 0) + (P.t !== undefined ? 3 * Math.sin(P.t / 7 + sd0) : 0) + (Q.walk !== undefined ? 7 * Math.sin(2 * Q.walk + 0.9) : 0);
  const polar = (deg: number, r: number): P2 => [Math.sin(rad(deg)) * r, -Math.cos(rad(deg)) * r];
  const hairInk: React.ReactNode[] = [];
  const hairOver: React.ReactNode[] = [];
  if (who === 'juno') {
    // a crown of spikes, shifted toward the way he's facing, swinging a beat behind the head
    [-50, -27, -4, 19, 42].forEach((a0, i) => {
      const a = a0 + fo * 16;
      const tip = polar(a + 9 + swing * (0.6 + i * 0.12), R * [1.22, 1.33, 1.38, 1.3, 1.2][i]);
      hairInk.push(<path key={`sp${i}`} d={pathOf([polar(a - 17, R * 0.86), tip, polar(a + 17, R * 0.86)])} strokeLinejoin="round" stroke={INK} strokeWidth={7} />);
    });
  }
  if (who === 'bea') {
    // two bunches, tied with paper bands, bouncing on their ties
    [-1, 1].forEach((sd) => {
      const at = polar(sd * 76 - fo * 10, R * 0.86);
      const sw = rad(swing * 1.6 + sd * 6);
      const off: P2 = [sd * R * 0.34, R * 0.1];
      const c: P2 = [at[0] + off[0] * Math.cos(sw) - off[1] * Math.sin(sw), at[1] + off[0] * Math.sin(sw) + off[1] * Math.cos(sw)];
      hairInk.push(<circle key={`b${sd}`} cx={c[0]} cy={c[1]} r={R * 0.36} />);
      const bx = lerp2(at, c, 0.32);
      const bd = Math.atan2(c[1] - at[1], c[0] - at[0]) + Math.PI / 2;
      const bl = R * 0.13;
      hairOver.push(<path key={`t${sd}`} d={`M ${f1(bx[0] - Math.cos(bd) * bl)} ${f1(bx[1] - Math.sin(bd) * bl)} L ${f1(bx[0] + Math.cos(bd) * bl)} ${f1(bx[1] + Math.sin(bd) * bl)}`} stroke={PAPER} strokeWidth={R * 0.07} strokeLinecap="round" />);
    });
  }
  if (who === 'suit') {
    // combed flat on top, a forelock on the parting side
    const cap: P2[] = [];
    for (let a = -100; a <= 100; a += 10) {
      const p = polar(a, R * 1.06);
      cap.push([p[0], Math.max(p[1], -R * 1.0)]);
    }
    hairInk.push(<path key="cap" d={pathOf(cap)} />);
    const fl = polar(-30 + fo * 40, R * 0.92);
    hairInk.push(<ellipse key="fl" cx={fl[0]} cy={fl[1]} rx={R * 0.34} ry={R * 0.2} transform={`rotate(${f1(-30 + fo * 40 + swing * 0.3)} ${f1(fl[0])} ${f1(fl[1])})`} />);
  }

  // the face, drawn on the turning head
  const face: React.ReactNode[] = [];
  const E = EYES[who];
  const expr = Q.expr;
  const autoBlink = (() => {
    const ph = (frame + Math.round(sd0 * 41)) % 104;
    return ph < 4 ? [0.6, 1, 1, 0.6][ph] : 0;
  })();
  const blink = Math.max(P.blink ?? 0, autoBlink);
  const onHead = (lon: number, lat: number) => {
    const c = camD(K.H(norm([Math.sin(lon) * Math.cos(lat), Math.sin(lat), Math.cos(lon) * Math.cos(lat)])));
    return { p: [hc2[0] + c[0] * R * 0.97, hc2[1] - c[1] * R * 0.97] as P2, z: c[2] };
  };
  const eyeAt: P2[] = [];
  if (fwd[2] > -0.2) {
    [-1, 1].forEach((sd) => {
      const o = onHead(sd * E.lon, E.lat);
      if (o.z < 0.12) return;
      eyeAt.push(o.p);
      const fsq = clamp(o.z * 1.15, 0.25, 1);
      if (E.glasses && o.z < 0.4) {
        // the far lens, turned nearly edge-on: just its frame
        face.push(<rect key={`g${sd}`} transform={`translate(${f1(o.p[0])} ${f1(o.p[1])}) rotate(${f1(roll)}) scale(${f1(fsq)} 1)`} x={-E.w * R * 1.55} y={-E.w * R * 1.05} width={E.w * R * 3.1} height={E.w * R * 2.0} rx={E.w * R * 0.4} fill="none" stroke={PAPER} strokeWidth={R * 0.028} />);
        return;
      }
      const ew = E.w * R;
      const big = expr === 'shock' ? 1.22 : 1;
      const eh = E.h * R * big;
      const k = `e${sd}`;
      const tf = `translate(${f1(o.p[0])} ${f1(o.p[1])}) rotate(${f1(roll)}) scale(${f1(fsq)} 1)`;
      if (expr === 'happy' && blink < 0.9) {
        face.push(<path key={k} transform={tf} d={`M ${f1(-ew * 0.95)} ${f1(eh * 0.2)} Q 0 ${f1(-eh * 1.25)} ${f1(ew * 0.95)} ${f1(eh * 0.2)}`} stroke={PAPER} strokeWidth={R * 0.06} fill="none" strokeLinecap="round" />);
      } else if (blink > 0.9) {
        face.push(<path key={k} transform={tf} d={`M ${f1(-ew)} 0 Q 0 ${f1(eh * 0.45)} ${f1(ew)} 0`} stroke={PAPER} strokeWidth={R * 0.045} fill="none" strokeLinecap="round" />);
      } else {
        const [l0, slant] = LIDS[expr] ?? [0, 0];
        const lid = Math.max(E.lid0, l0, blink * 0.8);
        const inner = -sd;
        const ly = (xe: number) => -eh + 2 * eh * lid + slant * eh * 0.5 * ((xe * inner) / ew);
        const pr = E.pupil * R * (expr === 'shock' ? 0.62 : 1);
        const px = Q.look[0] * ew * 0.42;
        const py = -Q.look[1] * eh * 0.3 + (lid > 0.3 ? eh * 0.2 : 0);
        const cid = `${id}${k}`;
        face.push(
          <g key={k} transform={tf}>
            <defs>
              <clipPath id={cid}>
                <ellipse cx={0} cy={0} rx={ew} ry={eh} />
              </clipPath>
            </defs>
            <ellipse cx={0} cy={0} rx={ew} ry={eh} fill={PAPER} />
            <g clipPath={`url(#${cid})`}>
              <circle cx={px} cy={py} r={pr} fill={INK} />
              <circle cx={px + pr * 0.38} cy={py - pr * 0.38} r={pr * 0.3} fill={PAPER} />
              {lid > 0.01 || slant ? <path d={pathOf([[-ew * 1.3, -eh * 1.4], [ew * 1.3, -eh * 1.4], [ew * 1.3, ly(ew * 1.3)], [-ew * 1.3, ly(-ew * 1.3)]])} fill={INK} /> : null}
            </g>
            {E.lashes ? <path d={`M ${f1(sd * ew * 0.62)} ${f1(-eh * 0.8)} l ${f1(sd * ew * 0.42)} ${f1(-eh * 0.34)} M ${f1(sd * ew * 0.88)} ${f1(-eh * 0.45)} l ${f1(sd * ew * 0.42)} ${f1(-eh * 0.2)}`} stroke={PAPER} strokeWidth={R * 0.03} strokeLinecap="round" /> : null}
          </g>,
        );
      }
      if (E.glasses)
        face.push(<rect key={`g${sd}`} transform={tf} x={-ew * 1.55} y={-ew * 1.05} width={ew * 3.1} height={ew * 2.0} rx={ew * 0.4} fill="none" stroke={PAPER} strokeWidth={R * 0.028} />);
    });
    if (E.glasses && eyeAt.length === 2) {
      const [a, b] = eyeAt;
      const m = lerp2(a, b, 0.5);
      const dl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const hw = Math.max(0, dl / 2 - E.w * R * 1.55);
      const ux = (b[0] - a[0]) / dl;
      const uy = (b[1] - a[1]) / dl;
      face.push(<path key="br" d={`M ${f1(m[0] - ux * hw)} ${f1(m[1] - uy * hw)} L ${f1(m[0] + ux * hw)} ${f1(m[1] + uy * hw)}`} stroke={PAPER} strokeWidth={R * 0.028} />);
    }
    // the mouth, in paper, only for the faces that need one
    const mo = onHead(0, who === 'bea' ? -0.36 : -0.4);
    if (mo.z > 0.15) {
      const fsq = clamp(mo.z * 1.15, 0.3, 1);
      const tf = `translate(${f1(mo.p[0])} ${f1(mo.p[1])}) rotate(${f1(roll)}) scale(${f1(fsq)} 1)`;
      const r = R;
      const st = { stroke: PAPER, strokeWidth: r * 0.032, fill: 'none', strokeLinecap: 'round' as const };
      const m: Record<string, React.ReactNode> = {
        neutral: <path d={`M ${f1(-r * 0.07)} 0 Q 0 ${f1(r * 0.02)} ${f1(r * 0.07)} 0`} {...st} opacity={0.8} />,
        happy: <path d={`M ${f1(-r * 0.2)} ${f1(-r * 0.03)} Q 0 ${f1(r * 0.24)} ${f1(r * 0.2)} ${f1(-r * 0.03)} Z`} fill={PAPER} />,
        shock: <ellipse cx={0} cy={r * 0.02} rx={r * 0.065} ry={r * 0.09} fill={PAPER} />,
        smug: <path d={`M ${f1(-r * 0.1)} ${f1(r * 0.02)} Q ${f1(r * 0.03)} ${f1(r * 0.06)} ${f1(r * 0.14)} ${f1(-r * 0.05)}`} {...st} />,
        worried: <path d={`M ${f1(-r * 0.12)} ${f1(r * 0.02)} Q ${f1(-r * 0.06)} ${f1(-r * 0.04)} 0 ${f1(r * 0.02)} Q ${f1(r * 0.06)} ${f1(r * 0.08)} ${f1(r * 0.12)} ${f1(r * 0.02)}`} {...st} />,
        stern: <path d={`M ${f1(-r * 0.09)} ${f1(r * 0.01)} L ${f1(r * 0.09)} ${f1(r * 0.01)}`} {...st} />,
      };
      face.push(<g key="m" transform={tf}>{m[expr]}</g>);
    }
  }
  // a pop on every change of face (the swap happens through a blink)
  const pop = P.blink ?? 0;
  const popT = `translate(${f1(hc2[0])} ${f1(hc2[1])}) scale(${f1(1 + 0.05 * pop)} ${f1(1 - 0.06 * pop)}) translate(${f1(-hc2[0])} ${f1(-hc2[1])})`;
  parts.push({
    z: zz(K.hc) + 6,
    key: 'head',
    ink: (
      <g transform={popT}>
        <path d={`M ${f1(neck0[0])} ${f1(neck0[1])} L ${f1(hc2[0])} ${f1(hc2[1])}`} stroke={INK} strokeWidth={chestHalf * 0.7} strokeLinecap="round" />
        <g transform={`translate(${f1(hc2[0])} ${f1(hc2[1])}) rotate(${f1(roll)})`}>{hairInk}</g>
        <circle cx={hc2[0]} cy={hc2[1]} r={R} />
      </g>
    ),
    over: (
      <g transform={popT}>
        <g transform={`translate(${f1(hc2[0])} ${f1(hc2[1])}) rotate(${f1(roll)})`}>{hairOver}</g>
        {face}
      </g>
    ),
  });

  parts.sort((a, b) => a.z - b.z);
  // the cut-card paper edge: offset toward the light, kept about the same on screen at any size
  const e = 2.6 * clamp(1.1 / s, 0.32, 1.3);
  const shadowRx = Math.max(40, D.leg.hipX * 3.2);
  return (
    <g>
      {shadow ? <ellipse cx={x} cy={y + 2 * s} rx={shadowRx * s} ry={shadowRx * 0.17 * s} fill="#000000" opacity={0.38} /> : null}
      <g transform={`translate(${f1(x)} ${f1(y)}) scale(${s})`}>
        <defs>
          <filter id={`${id}cut`} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feDropShadow dx={f1(e)} dy={f1(-e * 0.6)} stdDeviation={f1(e * 0.12)} floodColor={PAPER} floodOpacity={0.9} />
          </filter>
        </defs>
        {parts.map((p) => (
          <g key={p.key}>
            <g fill={INK} filter={`url(#${id}cut)`}>
              {p.ink}
            </g>
            {p.over}
          </g>
        ))}
      </g>
    </g>
  );
};
