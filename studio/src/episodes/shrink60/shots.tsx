import React from 'react';
import {
  kf, clamp, easeOut, easeIn, settle, lerp, rnd, LEG_LEN, stand, ShotProps, ShotMap,
  Bedroom, BEDROOM, Stairwell, Banister, stepTop, Kitchen, KitchenIsland, KITCHEN, Study, Desk, Rooftop, Cat, Mug, PaperStack, Glow,
} from '../../engine';
import { PrintDefs, Print, PaperFinish, NP, NP_FONT, Caliper, Squeeze, SpecimenTag, shrinkAt, Cracks, HandNote } from '../shrink/style';
import { Suitcase, SuitcaseTop, ClothesHeap, ClothesTop, Couch, Balance, Earth, Marble, BlackHole, LabLabel, Ink } from '../shrink/props';
import { Hall, HALL, holeCentre, PizzaTop, PizzaBoxTop, MoonFolder, LabSheetV, GridCube, TitleV, PartCard, ClockChip } from './props60';
import { ALL_DESIGNS } from '../../designs/CharacterDesigns';
import { Design, Fig3D, Pose3, A_POSE, pose3At, face3At, castFor, handAt, headAt } from '../../designs/juno3d';

// "What if you could shrink anything?" as a 60 s vertical Short (1080 x 1920), with the cast in 3D. One set of shots,
// built per style (Cel 3D, Paper Fold, Plush): makeShots(style) returns them. The world is Night Print (sets in two
// inks, the pink power); the cast is 3D on top with a hard cut-card shadow. Every shot is a pure function of its clock.

export type StyleKey = 'toon' | 'fold' | 'plush' | 'paint' | 'stick';
type Who = 'juno' | 'bea' | 'suit';
const W = 1080;
const H = 1920;
const camV = (cx: number, cy: number, s: number) => `translate(${W / 2} ${H / 2}) scale(${s}) translate(${-cx} ${-cy})`;
const closeP = (s: number, to: number) => clamp((1 - s) / (1 - to));
const NOSE = (x: number) => 420 + ((x - 420) * 70) / 150;
const SLOPE = (Math.atan2(70, 150) * 180) / Math.PI;
const COUCH = { x: 880, w: 430 };
const TOY = 0.13;

const Frame: React.FC<{ children: React.ReactNode; dots?: number; vig?: number }> = ({ children, dots, vig }) => (
  <g>
    <PrintDefs />
    {children}
    <PaperFinish dots={dots} vig={vig} w={W} h={H} />
  </g>
);

/** A walk for the 3D rig: legs and arms swing in opposition, `phase` advancing about 0.3 a frame. */
const walk3 = (phase: number, base: Pose3): Pose3 => {
  const s = Math.sin(phase);
  return {
    ...base,
    legL: { abd: 4, flex: 24 * s, bend: 8 + 26 * Math.max(0, -s) },
    legR: { abd: 4, flex: -24 * s, bend: 8 + 26 * Math.max(0, s) },
    armL: { abd: 12, flex: -22 * s, bend: 20 },
    armR: { abd: 12, flex: 22 * s, bend: 20 },
    walk: phase,
  };
};

/** A sleeve and a pointing fist reaching into an insert from off frame, shaded round like the 3D arm. */
const ArmIn: React.FC<{ x: number; y: number; from: { x: number; y: number }; col: string; skin: string; w?: number; id: string; flat?: boolean }> = ({ x, y, from, col, skin, w = 120, id, flat }) => {
  const a = Math.atan2(y - from.y, x - from.x);
  const deg = (a * 180) / Math.PI;
  const len = Math.hypot(x - from.x, y - from.y);
  if (flat)
    // the stick cast's arm: one ink stroke, a round fist and a finger, with the cut-card paper edge
    return (
      <g filter="url(#npDrop)">
        <g transform={`translate(${from.x} ${from.y}) rotate(${deg})`} fill={NP.ink} filter="url(#npCutR)">
          <path d={`M 0 0 L ${len - w * 0.3} 0`} stroke={NP.ink} strokeWidth={w * 0.36} strokeLinecap="round" />
          <circle cx={len - w * 0.3} cy={0} r={w * 0.34} />
          <path d={`M ${len - w * 0.3} ${-w * 0.06} L ${len + w * 0.42} ${-w * 0.06}`} stroke={NP.ink} strokeWidth={w * 0.2} strokeLinecap="round" />
        </g>
      </g>
    );
  return (
    <g filter="url(#npDrop)">
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} />
          <stop offset="35%" stopColor="#FFB3A0" stopOpacity={0.9} />
          <stop offset="55%" stopColor={col} />
          <stop offset="100%" stopColor="#5E1E16" />
        </linearGradient>
        <radialGradient id={`${id}h`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#FFF8EE" />
          <stop offset="70%" stopColor={skin} />
          <stop offset="100%" stopColor="#B88E74" />
        </radialGradient>
      </defs>
      <g transform={`translate(${from.x} ${from.y}) rotate(${deg})`}>
        <rect x={0} y={-w / 2} width={len - w * 0.55} height={w} rx={w / 2} fill={`url(#${id}g)`} stroke={NP.ink} strokeWidth={5} />
        <rect x={len - w * 0.95} y={-w * 0.56} width={w * 0.3} height={w * 1.12} rx={w * 0.14} fill="#5E1E16" />
        <ellipse cx={len - w * 0.35} cy={0} rx={w * 0.48} ry={w * 0.44} fill={`url(#${id}h)`} stroke={NP.ink} strokeWidth={4} />
        <rect x={len - w * 0.2} y={-w * 0.13} width={w * 0.75} height={w * 0.26} rx={w * 0.13} fill={`url(#${id}h)`} stroke={NP.ink} strokeWidth={4} />
      </g>
    </g>
  );
};

/** The vertical science grid bent toward a point. */
const BentGridV: React.FC<{ x: number; y: number; pull: number }> = ({ x, y, pull }) => {
  const warp = (px: number, py: number) => {
    const dx = px - x;
    const dy = py - y;
    const d = Math.hypot(dx, dy) + 1;
    const f = (pull * 150000) / (d * d + 36000);
    return [px - (dx / d) * f, py - (dy / d) * f];
  };
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    let d = '';
    for (let j = 0; j <= 50; j++) {
      const p = warp(-60 + i * 96, -100 + j * 42);
      d += `${j ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)} `;
    }
    out.push(<path key={`v${i}`} d={d} stroke={NP.teal} strokeWidth={2} fill="none" opacity={0.55} />);
  }
  for (let i = 0; i < 22; i++) {
    let d = '';
    for (let j = 0; j <= 30; j++) {
      const p = warp(-100 + j * 44, -40 + i * 96);
      d += `${j ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)} `;
    }
    out.push(<path key={`h${i}`} d={d} stroke={NP.teal} strokeWidth={2} fill="none" opacity={0.55} />);
  }
  return <g>{out}</g>;
};

export const makeShots = (key: StyleKey): ShotMap => {
  const D = ALL_DESIGNS.find((d) => d.key === key)!;
  const CAST: Record<Who, Design> = { juno: D, bea: castFor(D, 'bea'), suit: castFor(D, 'suit') };
  const HJ = D.head.y + D.head.r[1] * 1.15; // Juno's height in model units
  const s3 = (scale2d: number) => (scale2d * 378) / HJ; // the 3D scale that matches the 2D rig at a 2D scale
  const J = D.col;
  const q = key === 'fold' ? 1 : 0.85; // mesh density (the plush filter hides fine facets anyway)

  /** A member of the cast in 3D, standing at (x, y), with the cut-card shadow (or the pink edge, once shrunk). */
  const Fig: React.FC<{ who: Who; P: Pose3; yaw: number; x: number; y: number; s: number; id: string; mark?: boolean; d?: Design; pitch?: number; shadow?: boolean }> = ({ who, P, yaw, x, y, s, id, mark, d, pitch, shadow }) => (
    <g filter={mark ? 'url(#npMarked)' : 'url(#npDrop)'}>
      <Fig3D D={d ?? CAST[who]} P={P} yaw={yaw} x={x} y={y} s={s} id={`${key}${id}`} q={q} pitch={pitch} shadow={shadow} />
    </g>
  );

  // ================================================================ the bedroom
  const CASE = { x: 655, y: 712, w: 270 };
  const JB = stand(BEDROOM, 0.45, 0.42);
  const JBf = { x: JB.x, y: JB.y + LEG_LEN * JB.scale, s: s3(JB.scale) };

  const S1: React.FC<ShotProps> = ({ t, len }) => {
    const push = t < 12 ? easeOut(clamp(t / 8)) : 1 - easeOut(clamp((t - 12) / 5));
    const P = pose3At(t, [
      { f: 0, p: { lean: 8, armL: { abd: 12, flex: 60, bend: 26 }, armR: { abd: 12, flex: 60, bend: 26 }, headNod: 10, look: [-0.6, -0.3] } as Partial<Pose3> },
      { f: 8, p: { lean: 30, armL: { abd: 10, flex: 80, bend: 8 }, armR: { abd: 10, flex: 80, bend: 8 }, squash: 0.05 }, ease: easeOut },
      { f: 12, p: {} },
      { f: 16, p: { lean: 4, armL: { abd: 16, flex: 50, bend: 30 }, armR: { abd: 16, flex: 50, bend: 30 }, squash: -0.02, headNod: -4 }, ease: easeOut },
    ]);
    const lid = lerp(0.95, 0.06, push) + settle(t - 13, 0.18, 1.8, 4);
    const heapY = CASE.y - CASE.w * 0.2;
    return (
      <Frame>
        <g transform={camV(kf(t, [[0, 715], [len, 705]]), 620, kf(t, [[0, 1.8], [len, 1.88]]))}>
          <Print>
            <Bedroom t={t + 30} id="b1" veil={0.4} />
            <Suitcase x={CASE.x} y={CASE.y} w={CASE.w} lid={lid}>
              <g transform={`translate(${CASE.x} ${heapY}) scale(${1 + 0.06 * push} ${1 - 0.3 * push + settle(t - 13, 0.08, 1.8, 4)}) translate(${-CASE.x} ${-heapY})`}>
                <ClothesHeap x={CASE.x} y={heapY} w={CASE.w * 0.92} />
              </g>
            </Suitcase>
          </Print>
          <Fig who="juno" P={{ ...P, ...face3At(t, [[0, 'worried'], [13, 'shock']]) }} yaw={-0.95} x={JBf.x} y={JBf.y} s={JBf.s} id="s1" />
        </g>
      </Frame>
    );
  };

  const S2_TO = 0.28;
  const S2: React.FC<ShotProps> = ({ t }) => {
    const s = shrinkAt(t, 8, S2_TO, 7);
    const hand = { x: kf(t, [[0, 980], [4, 860], [7, 872]]), y: kf(t, [[0, 1700], [4, 1530], [7, 1542]]) };
    return (
      <Frame>
        <g transform={`translate(540 960) rotate(${-3 + t * 0.06}) scale(${1 + t * 0.003}) translate(-540 -960)`}>
          <Print>
            <rect x={-200} y={-200} width={1480} height={2320} fill="#4E5E92" />
            {Array.from({ length: 9 }).map((_, i) => (
              <path key={i} d={`M -200 ${i * 260} L 1280 ${i * 260 + 40}`} stroke="#43527F" strokeWidth={6} />
            ))}
            <SuitcaseTop x={540} y={1120} w={860} />
          </Print>
          <Squeeze ax={540} ay={1100} s={s} t={t - 8} dur={7}>
            <Print>
              <ClothesTop x={540} y={1100} w={960} />
            </Print>
          </Squeeze>
          <Caliper x0={110} x1={970} y0={720} y1={1480} on={(t - 1) / 4} p={closeP(s, S2_TO)} to={S2_TO} k={1.4} />
          <ArmIn flat={key === 'stick'} x={hand.x} y={hand.y} from={{ x: hand.x + 420, y: hand.y + 560 }} col={J.hood} skin={J.skin} w={130} id={`${key}a2`} />
        </g>
      </Frame>
    );
  };

  const S3: React.FC<ShotProps> = ({ t, len }) => {
    const zip = easeOut(clamp((t - 3) / 14));
    const P = pose3At(t, [
      { f: 0, p: { lean: 20, twist: -14, armL: { abd: 8, flex: 66, bend: 12 }, armR: { abd: 18, flex: 20, bend: 30 }, headNod: 12, look: [-0.5, -0.4] } as Partial<Pose3> },
      { f: 17, p: { twist: 10, armL: { abd: 14, flex: 62, bend: 16 } } },
    ]);
    return (
      <Frame>
        <g transform={camV(kf(t, [[0, 715], [len, 705]]), 640, kf(t, [[0, 2.55], [len, 2.7]]))}>
          <Print>
            <Bedroom t={t + 62} id="b3" veil={0.42} />
            <Suitcase x={CASE.x} y={CASE.y} w={CASE.w} lid={0} zip={zip}>
              {null}
            </Suitcase>
          </Print>
          <Fig who="juno" P={{ ...P, ...face3At(t, [[0, 'happy'], [14, 'smug']]) }} yaw={-0.85} x={JBf.x} y={JBf.y} s={JBf.s} id="s3" />
          <SpecimenTag x={CASE.x - 110} y={CASE.y - 44} t={t - 12} lines={['CLOTHES', '×0.28']} pink rot={8} s={0.55} />
        </g>
      </Frame>
    );
  };

  // ================================================================ the stairwell
  const JS = { x: 1250, y: stepTop(1250), s: s3(0.95) };

  const S4: React.FC<ShotProps> = ({ t, len }) => {
    const P = pose3At(t, [
      { f: 0, p: { lean: 26, armL: { abd: 10, flex: 92, bend: 14 }, armR: { abd: 10, flex: 92, bend: 14 }, legL: { abd: 4, flex: 26, bend: 34 }, legR: { abd: 4, flex: -24, bend: 4 }, headNod: -8, look: [-0.5, 0.2] } as Partial<Pose3> },
      { f: 10, p: { lean: 32, squash: 0.05 } },
      { f: 20, p: { lean: 26, squash: 0 } },
      { f: 30, p: { lean: 34, squash: 0.06 } },
      { f: 42, p: { lean: 28, squash: 0.01 } },
    ]);
    const jig = settle(t % 14, 1.4, 2.6, 3);
    return (
      <Frame>
        <g transform={camV(kf(t, [[0, 1070], [len, 1050]]), 640, kf(t, [[0, 1.26], [len, 1.32]]))}>
          <Print>
            <Stairwell t={t + 20} id="sw4" />
            <Couch x={COUCH.x + jig} y={NOSE(COUCH.x)} w={COUCH.w} rot={SLOPE} />
          </Print>
          <Fig who="juno" P={{ ...P, ...face3At(t, [[0, 'worried']]) }} yaw={-1.35} x={JS.x} y={JS.y} s={JS.s} id="s4" />
          <Print>
            <Banister />
          </Print>
        </g>
      </Frame>
    );
  };

  const S5: React.FC<ShotProps> = ({ t, len }) => {
    const s = shrinkAt(t, 8, TOY, 7);
    const drop = easeIn(clamp((t - 15) / 4));
    const land = settle(t - 19, 3, 2.2, 3);
    const cx = COUCH.x;
    const cy = lerp(NOSE(cx), stepTop(cx), drop) - (t > 19 ? Math.abs(land) : 0);
    const P = pose3At(t, [
      { f: 0, p: { lean: 4, armL: { abd: 20, flex: 30, bend: 20 }, look: [-0.7, 0.1] } as Partial<Pose3> },
      { f: 4, p: { armL: { abd: 26, flex: 84, bend: 2 }, point: 'L' }, ease: easeOut },
    ]);
    return (
      <Frame>
        <g transform={camV(kf(t, [[0, 1040], [len, 1030]]), 550, kf(t, [[0, 1.9], [len, 2.0]]))}>
          <Print>
            <Stairwell t={t + 65} id="sw5" />
          </Print>
          <Squeeze ax={cx} ay={cy} s={s} t={t - 8} dur={7}>
            <Print>
              <Couch x={cx} y={cy} w={COUCH.w} rot={lerp(SLOPE, 0, drop)} />
            </Print>
          </Squeeze>
          <Fig who="juno" P={{ ...P, ...face3At(t, [[0, 'neutral'], [7, 'smug']]) }} yaw={-0.95} x={JS.x} y={JS.y} s={JS.s} id="s5" />
          <Caliper x0={cx - 250} x1={cx + 250} y0={NOSE(cx) - 300} y1={stepTop(cx) + 6} on={(t - 1) / 4} p={closeP(s, TOY)} to={TOY} k={0.9} />
        </g>
      </Frame>
    );
  };

  const S6x = JS.x - 120;
  const S6: React.FC<ShotProps> = ({ t, len }) => {
    const P = pose3At(t, [
      { f: 0, p: { armL: { abd: 18, flex: 78, bend: 70 }, armR: { abd: 14, flex: 6, bend: 16 }, look: [-0.4, 0.2], headTilt: -4 } as Partial<Pose3> },
      { f: 4, p: { armL: { abd: 18, flex: 82, bend: 74 } } },
      { f: 7, p: { armL: { abd: 8, flex: 4, bend: 2 }, tilt: 14, lean: 10, squash: 0.09, headNod: 14, look: [-0.8, -0.6] }, ease: easeIn },
      { f: 10, p: { armL: { abd: 10, flex: 6, bend: 4 }, tilt: 11, squash: 0.05 } },
    ]);
    const F = { ...P, ...face3At(t, [[0, 'happy'], [8, 'shock'], [20, 'worried']]) };
    const x = S6x;
    const y = stepTop(x);
    const h = handAt(CAST.juno, F, 'L', -0.6, x, y, JS.s);
    return (
      <Frame>
        <g transform={camV(kf(t, [[0, 1110], [len, 1105]]), kf(t, [[0, 560], [len, 575]]), kf(t, [[0, 2.55], [len, 2.7]]))}>
          <Print>
            <Stairwell t={t + 90} id="sw6" />
          </Print>
          <Fig who="juno" P={F} yaw={-0.6} x={x} y={y} s={JS.s} id="s6" />
          <g filter="url(#npMarked)">
            <Print>
              <Couch x={h.x} y={h.y + 22} w={COUCH.w * TOY} shadow={false} />
            </Print>
          </g>
          <SpecimenTag x={h.x - 250} y={h.y - 190} t={t - 9} lines={['COUCH ×0.13', 'STILL 40 kg']} pink rot={-5} s={0.42} />
        </g>
      </Frame>
    );
  };

  // ================================================================ the kitchen
  const BEA_FEET = KITCHEN.P(0.5, 0.695, 0.53);
  const KS = s3((0.62 * 415 * KITCHEN.s(0.53)) / 378);
  const beaDance = (t: number): Pose3 => {
    const w = Math.sin(t / 3.4);
    return {
      ...A_POSE,
      armL: { abd: 150 + w * 18, flex: 10, bend: 26 },
      armR: { abd: 150 - w * 18, flex: 10, bend: 26 },
      legL: { abd: 8, flex: 14 * w, bend: 16 + 16 * Math.max(0, w) },
      legR: { abd: 8, flex: -14 * w, bend: 16 + 16 * Math.max(0, -w) },
      tilt: w * 8,
      headTilt: -w * 10,
      squash: Math.abs(Math.cos(t / 3.4)) * 0.06,
      expr: 'happy',
      look: [0.2, 0.1],
    };
  };
  const bounce = (t: number) => Math.abs(Math.sin(t / 3.4)) * 16;
  const JK = stand(KITCHEN, 0.63, 0.8);
  const JKf = { x: JK.x, y: JK.y + LEG_LEN * JK.scale, s: s3(JK.scale) };

  const S7: React.FC<ShotProps> = ({ t, len }) => {
    const cat = KITCHEN.P(0.14, 1, 0.62);
    return (
      <Frame>
        <g transform={camV(kf(t, [[0, 1020], [len, 1030]]), 640, kf(t, [[0, 1.42], [len, 1.48]]))}>
          <Print>
            <Kitchen t={t + 40} id="k7" veil={0.4} />
            <KitchenIsland />
            <Cat x={cat.x} y={cat.y} mood="alert" f={t} />
          </Print>
          <Fig who="bea" P={beaDance(t)} yaw={0.3} x={BEA_FEET.x} y={BEA_FEET.y - bounce(t)} s={KS} id="s7b" />
          <Fig who="juno" P={{ ...A_POSE, armL: { abd: 8, flex: 4, bend: 10 }, armR: { abd: 8, flex: 4, bend: 10 }, headTilt: -6, look: [-0.8, 0.3], ...face3At(t, [[0, 'stern']]) }} yaw={-0.7} x={JKf.x} y={JKf.y} s={JKf.s} id="s7j" />
        </g>
      </Frame>
    );
  };

  const S8_TO = 0.14;
  const S8: React.FC<ShotProps> = ({ t, len }) => {
    const s = shrinkAt(t, 8, S8_TO, 7);
    const P = { ...beaDance(Math.min(t, 7) + 40), ...(t >= 8 ? { armL: { abd: 120, flex: 10, bend: 40 }, armR: { abd: 120, flex: 10, bend: 40 }, tilt: 0, headTilt: 0, squash: 0 } : {}), ...face3At(t, [[0, 'happy'], [9, 'shock']]) };
    return (
      <Frame>
        <g transform={camV(960, kf(t, [[0, 520], [len, 540]]), kf(t, [[0, 2.45], [len, 2.6]]))}>
          <Print>
            <Kitchen t={t + 84} id="k8" veil={0.44} />
            <KitchenIsland />
          </Print>
          <Squeeze ax={BEA_FEET.x} ay={BEA_FEET.y} s={s} t={t - 8} dur={7}>
            <Fig who="bea" P={P} yaw={0.3} x={BEA_FEET.x} y={BEA_FEET.y - (t < 8 ? bounce(Math.min(t, 7) + 40) : 0)} s={KS} id="s8" />
          </Squeeze>
          <Caliper x0={BEA_FEET.x - 120} x1={BEA_FEET.x + 120} y0={BEA_FEET.y - 330} y1={BEA_FEET.y} on={(t - 1) / 4} p={closeP(s, S8_TO)} to={S8_TO} k={0.55} />
        </g>
      </Frame>
    );
  };

  const Stone: React.FC = () => (
    <Print>
      <rect x={-200} y={-200} width={1480} height={2320} fill="#A89C8A" />
      {Array.from({ length: 14 }).map((_, i) => (
        <path key={i} d={`M ${-200 + rnd(3, i) * 1400} ${-200 + i * 170} q 200 ${40 - rnd(5, i) * 80} 420 ${rnd(6, i) * 60}`} stroke="#968A78" strokeWidth={5} fill="none" />
      ))}
      <rect x={-200} y={1740} width={1480} height={400} fill="#2C2A30" />
      <rect x={-200} y={1730} width={1480} height={16} fill="#8E8474" />
    </Print>
  );

  const S9: React.FC<ShotProps> = ({ t, len }) => {
    const catX = kf(t, [[0, -380], [10, 250], [len, 275]], easeOut);
    const catY = kf(t, [[0, 1420], [10, 1360], [len, 1350]]);
    const P = { ...A_POSE, armL: { abd: 30, flex: 20, bend: 40 }, armR: { abd: 30, flex: 20, bend: 40 }, headNod: -16, headTilt: kf(t, [[0, 0], [12, 8]]), look: [-0.9, 0.6] as [number, number], ...face3At(t, [[0, 'shock'], [14, 'worried']]) };
    return (
      <Frame>
        <g transform={`translate(540 960) scale(${kf(t, [[0, 1.0], [len, 1.05]])}) translate(-540 -960)`}>
          <Stone />
          <Print>
            <g transform="translate(900 1600) scale(2.6)">
              <Mug x={0} y={0} rot={0} steam={0} f={t} />
            </g>
            <g transform={`translate(${catX} ${catY}) scale(-9 9)`}>
              <Cat x={0} y={0} mood="alert" f={t + 30} />
            </g>
          </Print>
          <Fig who="bea" P={P} yaw={-0.5} x={660} y={1660} s={1.25} id="s9" mark />
        </g>
      </Frame>
    );
  };

  // ================================================================ the title
  const ROOF = 840;
  const S10: React.FC<ShotProps> = ({ t, len }) => {
    const P = pose3At(t, [
      { f: 0, p: { armL: { abd: 18, flex: 4, bend: 10 }, armR: { abd: 18, flex: 4, bend: 10 } } as Partial<Pose3> },
      { f: 14, p: {} },
      { f: 20, p: { armL: { abd: 150, flex: 10, bend: 12 }, armR: { abd: 150, flex: 10, bend: 12 }, squash: -0.04 }, ease: easeOut },
      { f: 26, p: { squash: 0 } },
    ]);
    return (
      <Frame>
        <g transform={camV(960, kf(t, [[0, 600], [len, 620]]), kf(t, [[0, 1.3], [len, 1.36]]))}>
          <Print>
            <Rooftop t={t} sunX={960} sunY={700 - 40 * easeOut(clamp(t / 40))} />
          </Print>
          <g filter="url(#npMarked)">
            <Print>
              <Couch x={1050} y={ROOF + 4} w={56} />
              <Suitcase x={872} y={ROOF + 4} w={44} />
            </Print>
          </g>
          <Fig who="juno" P={{ ...P, ...face3At(t, [[0, 'happy']]) }} yaw={0.15} x={960} y={ROOF} s={s3(0.62)} id="s10" />
        </g>
        <TitleV t={t} y={560} />
      </Frame>
    );
  };

  // ================================================================ the fun part: homework and pizza
  const JD = { x: 900, y: 712 + LEG_LEN, s: s3(1) };
  const STACK = { x: 1120, y: 698 };
  const S11: React.FC<ShotProps> = ({ t, len }) => {
    const P = { ...A_POSE, headNod: -18, armL: { abd: 20, flex: 10, bend: 20 }, armR: { abd: 22, flex: 30, bend: 60 }, look: [0.7, 0.9] as [number, number], ...face3At(t, [[0, 'worried']]) };
    return (
      <Frame>
        <g transform={camV(kf(t, [[0, 1010], [len, 1000]]), kf(t, [[0, 540], [len, 520]]), kf(t, [[0, 1.75], [len, 1.82]]))}>
          <Print>
            <Study t={t + 10} id="st11" />
          </Print>
          <Fig who="juno" P={P} yaw={0.45} x={JD.x} y={JD.y} s={JD.s} id="s11" />
          <Print>
            <Desk x0={560} x1={1360} y={700} lamp={false} />
            <PaperStack x={STACK.x} y={STACK.y} n={54} w={220} />
            <PaperStack x={STACK.x + 170} y={STACK.y} n={24} w={170} />
          </Print>
        </g>
      </Frame>
    );
  };

  const S12_TO = 0.1;
  const S12: React.FC<ShotProps> = ({ t, len }) => {
    const s = shrinkAt(t, 8, S12_TO, 7);
    const P = pose3At(t, [
      { f: 0, p: { armR: { abd: 20, flex: 30, bend: 30 }, look: [0.8, 0.3] } as Partial<Pose3> },
      { f: 4, p: { armR: { abd: 30, flex: 78, bend: 2 }, point: 'R' }, ease: easeOut },
    ]);
    return (
      <Frame>
        <g transform={camV(kf(t, [[0, 1030], [len, 1020]]), 560, kf(t, [[0, 1.95], [len, 2.05]]))}>
          <Print>
            <Study t={t + 50} id="st12" />
          </Print>
          <Fig who="juno" P={{ ...P, ...face3At(t, [[0, 'neutral'], [7, 'smug']]) }} yaw={0.55} x={JD.x} y={JD.y} s={JD.s} id="s12" />
          <Print>
            <Desk x0={560} x1={1360} y={700} lamp={false} />
          </Print>
          <Squeeze ax={STACK.x} ay={STACK.y} s={s} t={t - 8} dur={7}>
            <Print>
              <PaperStack x={STACK.x} y={STACK.y} n={54} w={220} />
            </Print>
          </Squeeze>
          <Squeeze ax={STACK.x + 170} ay={STACK.y} s={s} t={t - 9} dur={7}>
            <Print>
              <PaperStack x={STACK.x + 170} y={STACK.y} n={24} w={170} />
            </Print>
          </Squeeze>
          <Caliper x0={STACK.x - 140} x1={STACK.x + 280} y0={STACK.y - 400} y1={STACK.y} on={(t - 1) / 4} p={closeP(s, S12_TO)} to={S12_TO} k={0.8} />
        </g>
      </Frame>
    );
  };

  const S13: React.FC<ShotProps> = ({ t, len }) => (
    <Frame>
      <g transform={`translate(540 960) rotate(${2 - t * 0.05}) scale(${1 + t * 0.003}) translate(-540 -960)`}>
        <Stone />
        <Print>
          <PizzaBoxTop x={540} y={1120} w={900} />
        </Print>
        <PizzaTop x={540} y={1120} r={390} />
        <Glow x={540} y={1000} r={700} o={0.25} />
      </g>
    </Frame>
  );

  const S14_TO = 0.07;
  const S14: React.FC<ShotProps> = ({ t }) => {
    const s = shrinkAt(t, 8, S14_TO, 7);
    const hand = { x: kf(t, [[0, 160], [4, 250], [7, 238]]), y: kf(t, [[0, 1720], [4, 1560], [7, 1572]]) };
    return (
      <Frame>
        <g transform={`translate(540 960) rotate(${2 - (t + 20) * 0.05}) scale(${1.06}) translate(-540 -960)`}>
          <Stone />
          <Print>
            <PizzaBoxTop x={540} y={1120} w={900} />
          </Print>
          <Squeeze ax={540} ay={1120} s={s} t={t - 8} dur={7}>
            <PizzaTop x={540} y={1120} r={390} />
          </Squeeze>
          <Caliper x0={150} x1={930} y0={730} y1={1510} on={(t - 1) / 4} p={closeP(s, S14_TO)} to={S14_TO} k={1.3} />
          <ArmIn flat={key === 'stick'} x={hand.x} y={hand.y} from={{ x: hand.x - 420, y: hand.y + 560 }} col={J.hood} skin={J.skin} w={130} id={`${key}a14`} />
        </g>
      </Frame>
    );
  };

  /** A blurred room behind a close-up. */
  const SoftKitchen: React.FC<{ t: number; id: string }> = ({ t, id }) => (
    <g filter="url(#blur16)">
      <g transform={camV(960, 520, 2.4)}>
        <Print>
          <Kitchen t={t} id={id} veil={0.42} />
        </Print>
      </g>
    </g>
  );

  const S15: React.FC<ShotProps> = ({ t, len }) => {
    const P = pose3At(t, [
      { f: 0, p: { armR: { abd: 10, flex: 50, bend: 70 }, look: [0.3, -0.2], headTilt: 4 } as Partial<Pose3> },
      { f: 8, p: { armR: { abd: 2, flex: 88, bend: 94 }, lean: 6, headNod: 6 }, ease: easeOut },
      { f: 12, p: { armR: { abd: 10, flex: 50, bend: 60 }, squash: 0.03, headNod: 2, lean: 0 } },
      { f: 18, p: { squash: 0 } },
    ]);
    const F = { ...P, ...face3At(t, [[0, 'happy'], [10, 'smug']]) };
    const fx = 560;
    const fy = 1980;
    const fs = 3.2;
    const h = handAt(CAST.juno, F, 'R', 0.3, fx, fy, fs);
    const eaten = t >= 10;
    return (
      <Frame>
        <SoftKitchen t={t + 120} id="k15" />
        <rect x={0} y={0} width={W} height={H} fill={NP.ink} opacity={0.25} />
        <Fig who="juno" P={F} yaw={0.3} x={fx} y={fy} s={fs} id="s15" shadow={false} />
        {!eaten ? (
          <g filter="url(#npMarked)">
            <PizzaTop x={h.x + 6} y={h.y - 16} r={27} />
          </g>
        ) : null}
        {/* crumbs on the chomp */}
        {t >= 10 && t < 22
          ? Array.from({ length: 6 }).map((_, i) => {
              const k = (t - 10) / 12;
              return <circle key={i} cx={h.x + (rnd(7, i) - 0.5) * 160 * k} cy={h.y - 40 + 300 * k * k + rnd(8, i) * 30} r={6} fill="#C98A4A" opacity={1 - k} />;
            })
          : null}
      </Frame>
    );
  };

  const S16: React.FC<ShotProps> = ({ t, len }) => {
    const k = easeOut(clamp((t - 20) / 10)) + settle(t - 30, 0.07, 1.8, 4);
    const T = CAST.juno.torso;
    const full: Design = { ...CAST.juno, torso: { ...T, rHip: T.rHip * (1 + 0.55 * k), depth: T.depth * (1 + 0.4 * k) } };
    const P = pose3At(t, [
      { f: 0, p: { armL: { abd: 18, flex: 8, bend: 14 }, armR: { abd: 18, flex: 8, bend: 14 }, headNod: 18, look: [0, -1] } as Partial<Pose3> },
      { f: 24, p: { armL: { abd: 40, flex: 10, bend: 24 }, armR: { abd: 40, flex: 10, bend: 24 }, squash: 0.05 } },
      { f: 32, p: { squash: 0 } },
    ]);
    return (
      <Frame>
        <g transform={camV(960, kf(t, [[0, 600], [len, 610]]), kf(t, [[0, 2.0], [len, 2.1]]))}>
          <Print>
            <Kitchen t={t + 150} id="k16" veil={0.42} />
          </Print>
          <Fig who="juno" d={full} P={{ ...P, ...face3At(t, [[0, 'neutral'], [22, 'shock'], [32, 'worried']]) }} yaw={0.2} x={960} y={KITCHEN.P(0.5, 1, 0.42).y} s={s3((0.62 * 415 * KITCHEN.s(0.42)) / 378)} id="s16" />
        </g>
      </Frame>
    );
  };

  // ================================================================ the science, on the lab sheet
  const S17: React.FC<ShotProps> = ({ t, len }) => {
    const landT = 58;
    const drop = clamp((t - 44) / (landT - 44));
    const tilt = t < landT ? -16 : settle(t - landT, -6, 1.4, 6);
    const r = (tilt * Math.PI) / 180;
    const span = 370;
    const L = { x: 540 - Math.cos(r) * span, y: 1040 - 520 - Math.sin(r) * span };
    const R = { x: 540 + Math.cos(r) * span, y: 1040 - 520 + Math.sin(r) * span };
    return (
      <Frame dots={0.05} vig={0.14}>
        <g transform={`translate(540 960) scale(${kf(t, [[0, 1], [len, 1.04]])}) translate(-540 -960)`}>
          <LabSheetV fig="FIG. 1 · MASS" />
          <g transform="translate(0 340)">
            <Balance
              x={540}
              y={1040}
              tilt={tilt}
              span={span}
              left={<Couch x={L.x} y={L.y + 240} w={250} shadow={false} />}
              right={t >= 44 ? <g filter="url(#npMarked)"><Couch x={R.x} y={lerp(R.y - 360, R.y + 240, easeIn(drop))} w={250 * TOY} shadow={false} /></g> : null}
            />
            <LabLabel x={L.x} y={L.y + 360} t={t - 2} text="40 kg" size={52} />
            <LabLabel x={R.x} y={R.y + 360} t={t - landT - 2} text="40 kg" size={52} color={NP.pinkDeep} />
          </g>
          <LabLabel x={540} y={420} t={t - 48} text="SMALLER," size={84} />
          <LabLabel x={540} y={520} t={t - landT} text="NOT LIGHTER" size={84} color={NP.pinkDeep} />
        </g>
      </Frame>
    );
  };

  const S18: React.FC<ShotProps> = ({ t, len }) => {
    const s = shrinkAt(t, 18, 0.05, 16);
    const dens = Math.round(lerp(1, 8000, easeOut(clamp((t - 56) / 18))));
    return (
      <Frame dots={0.05} vig={0.14}>
        <LabSheetV fig="FIG. 2 · DENSITY" />
        <LabLabel x={540} y={330} t={t - 2} text="1/20 THE SIZE" size={70} />
        <Squeeze ax={540} ay={1180} s={s} t={t - 18} dur={16}>
          <GridCube x={540} y={1180} a={360} n={20} />
        </Squeeze>
        <Caliper x0={540 - 312} x1={540 + 312} y0={1180 - 540} y1={1180} on={(t - 1) / 4} p={closeP(s, 0.05)} to={0.05} k={1.2} label={`1/${Math.round(1 / Math.max(0.05, s))}`} />
        <text x={540} y={1460} textAnchor="middle" fontFamily={NP_FONT.title} fontSize={190} fill={NP.pinkDeep} opacity={clamp((t - 56) / 4)}>
          ×{dens.toLocaleString('en-GB')}
        </text>
        <LabLabel x={540} y={1560} t={t - 88} text="DENSER" size={70} />
        <LabLabel x={540} y={1690} t={t - 98} text="(1/20)³ = 1/8,000 THE VOLUME" size={34} color={NP.teal} />
      </Frame>
    );
  };

  const S19: React.FC<ShotProps> = ({ t, len }) => {
    const E = { x: 540, y: 600, r: 290 };
    const s = shrinkAt(t, 14, 0.045, 18);
    const loupe = clamp((t - 46) / 8);
    const lk = loupe <= 0 ? 0 : 1 + 2.2 * Math.pow(loupe - 1, 3) + 1.2 * Math.pow(loupe - 1, 2);
    const km = Math.round(lerp(12742, 0.016, closeP(s, 0.045)));
    const read = closeP(s, 0.045) >= 1 ? '16 mm' : `${km.toLocaleString('en-GB')} km`;
    return (
      <Frame dots={0.05} vig={0.14}>
        <LabSheetV fig="FIG. 3 · SIZE" />
        <Squeeze ax={E.x} ay={E.y + E.r} s={s} t={t - 14} dur={18}>
          <Earth x={E.x} y={E.y} r={E.r} spin={t * 0.004} id={`${key}e19`} />
        </Squeeze>
        <Caliper x0={E.x - E.r} x1={E.x + E.r} y0={E.y - E.r} y1={E.y + E.r} on={(t + 2) / 4} p={closeP(s, 0.045)} to={0.045} label={read} k={1.3} />
        {lk > 0 ? (
          <g transform={`translate(540 1370) scale(${lk}) translate(-540 -1370)`}>
            <Ink d={`M ${E.x} ${E.y + E.r - 4} L 540 1040`} t={t - 46} dur={6} w={3} />
            <circle cx={540} cy={1370} r={340} fill={NP.paper} stroke={NP.ink} strokeWidth={10} />
            <circle cx={540} cy={1370} r={326} fill="none" stroke={NP.teal} strokeWidth={4} opacity={0.6} />
            <Earth x={420} y={1350} r={105} spin={t * 0.004} id={`${key}e19l`} />
            <Marble x={660} y={1350} r={105} />
            <path d="M 315 1500 L 765 1500 M 315 1486 L 315 1514 M 525 1486 L 525 1514 M 555 1486 L 555 1514 M 765 1486 L 765 1514" stroke={NP.ink} strokeWidth={4} />
            <LabLabel x={420} y={1570} t={t - 54} text="EARTH" size={34} />
            <LabLabel x={660} y={1570} t={t - 62} text="MARBLE" size={34} />
            <LabLabel x={540} y={1150} t={t - 66} text="BOTH 16 mm" size={42} color={NP.pinkDeep} />
          </g>
        ) : null}
      </Frame>
    );
  };

  const S20: React.FC<ShotProps> = ({ t, len }) => {
    const dark = easeOut(clamp((t - 2) / 10));
    const collapse = easeIn(clamp((t - 4) / 8));
    const on = clamp((t - 10) / 6);
    return (
      <Frame dots={0.04} vig={0.14 + 0.4 * dark}>
        <g transform={`translate(540 960) scale(${kf(t, [[0, 1], [len, 1.08]])}) translate(-540 -960)`}>
          <LabSheetV fig="FIG. 4 · BLACK HOLE" dark={dark * 0.94} />
          <BentGridV x={540} y={900} pull={on} />
          {collapse < 1 ? (
            <g transform={`translate(540 900) scale(${1 - collapse * 0.75}) translate(-540 -900)`} opacity={1 - collapse * 0.6}>
              <Earth x={540} y={900} r={160} id={`${key}e20`} />
            </g>
          ) : null}
          <BlackHole x={540} y={900} r={120} t={t} on={on} />
          <LabLabel x={540} y={1300} t={t - 16} text="r < 8.87 mm" size={56} color={NP.pink} />
        </g>
      </Frame>
    );
  };

  /** An extreme close-up of Juno's face, the stairwell soft behind, his edge pink for the turn. */
  const JunoECU: React.FC<{ t: number; len: number; id: string; expr: Pose3['expr']; look?: [number, number]; turn?: number }> = ({ t, len, id, expr, look = [0.1, 0], turn = 0 }) => {
    const sc = 5.4 * (1 + 0.05 * clamp(t / len));
    const P = { ...A_POSE, headTilt: 3, headTurn: turn, look, ...face3At(t, [[0, expr]]) };
    const hc = headAt(CAST.juno, P, 0.15, 0, 0, sc);
    return (
      <Frame>
        <g filter="url(#blur16)">
          <g transform={camV(1100, 560, 2.2)}>
            <Print>
              <Stairwell t={t + 200} id={`sw${id}`} />
            </Print>
          </g>
        </g>
        <rect x={0} y={0} width={W} height={H} fill={NP.ink} opacity={0.3} />
        <Fig who="juno" P={P} yaw={0.15} x={540 - hc.x} y={880 - hc.y} s={sc} id={id} mark shadow={false} />
      </Frame>
    );
  };
  const S21: React.FC<ShotProps> = ({ t, len }) => <JunoECU t={t} len={len} id="s21" expr="worried" />;

  // ================================================================ the floor gives way
  const TOYF = { x: 1610, y: 910 };
  const S22: React.FC<ShotProps> = ({ t, len }) => {
    const crack = clamp((t - 60) / 30) * 0.5;
    const P = { ...A_POSE, headNod: 22, armL: { abd: 14, flex: 10, bend: 20 }, armR: { abd: 14, flex: 10, bend: 20 }, look: [0.6, -0.8] as [number, number], ...face3At(t, [[0, 'neutral'], [22, 'worried']]) };
    return (
      <Frame>
        <g transform={camV(kf(t, [[0, 1520], [len, 1540]]), kf(t, [[0, 690], [len, 720]]), kf(t, [[0, 1.7], [len, 1.85]]))}>
          <Print>
            <Stairwell t={t + 230} id="sw22" />
            <Cracks x={TOYF.x} y={TOYF.y + 6} p={crack} r={360} seed={5} squashY={0.5} color="#0A0C10" />
          </Print>
          <g filter="url(#npMarked)">
            <Print>
              <Couch x={TOYF.x} y={TOYF.y} w={COUCH.w * TOY} />
            </Print>
          </g>
          <Fig who="juno" P={P} yaw={0.7} x={1380} y={stepTop(1380)} s={s3(0.95)} id="s22" />
          <SpecimenTag x={TOYF.x + 40} y={TOYF.y - 170} t={t - 48} lines={['STILL 40 kg']} pink rot={6} s={0.55} />
        </g>
      </Frame>
    );
  };

  const S23: React.FC<ShotProps> = ({ t, len }) => {
    const crack = 0.5 + clamp(t / 14) * 0.5;
    const gape = easeOut(clamp((t - 30) / 5));
    const fall = clamp((t - 31) / 12);
    const P = pose3At(t, [
      { f: 0, p: { headNod: 20, look: [0.6, -0.8] } as Partial<Pose3> },
      { f: 29, p: { squash: 0.08, lean: 8 } },
      { f: 33, p: { squash: -0.06, lean: -14, armL: { abd: 60, flex: 30, bend: 20 }, armR: { abd: 60, flex: 30, bend: 20 }, headNod: 6 }, ease: easeOut },
      { f: 39, p: { squash: 0.02 } },
    ]);
    const jump = t > 30 && t < 42 ? Math.sin(((t - 30) / 12) * Math.PI) * 40 : 0;
    return (
      <Frame>
        <g transform={camV(1500, kf(t, [[0, 780], [len, 820]]), kf(t, [[0, 1.85], [len, 2.0]]))}>
          <Print>
            <Stairwell t={t + 300} id="sw23" />
            <Cracks x={TOYF.x} y={TOYF.y + 6} p={crack} r={360} seed={5} squashY={0.5} color="#0A0C10" />
            {/* the boards give: a ragged black gap opens in the floor */}
            {gape > 0 ? (
              <path d={`M ${TOYF.x - 120 * gape} ${TOYF.y} L ${TOYF.x - 80 * gape} ${TOYF.y + 40 * gape} L ${TOYF.x - 30 * gape} ${TOYF.y + 18 * gape} L ${TOYF.x + 20 * gape} ${TOYF.y + 60 * gape} L ${TOYF.x + 70 * gape} ${TOYF.y + 22 * gape} L ${TOYF.x + 120 * gape} ${TOYF.y} Z`} fill="#050608" />
            ) : null}
            {/* splinters flying */}
            {t > 30
              ? Array.from({ length: 9 }).map((_, i) => {
                  const k = (t - 30) / 14;
                  const vx = (rnd(11, i) - 0.5) * 340;
                  const vy = -160 - rnd(12, i) * 220;
                  return <rect key={i} x={TOYF.x + vx * k} y={TOYF.y + vy * k + 600 * k * k} width={22} height={6} fill="#7A5747" transform={`rotate(${i * 40 + t * 20} ${TOYF.x + vx * k} ${TOYF.y + vy * k + 600 * k * k})`} opacity={1 - clamp(k)} />;
                })
              : null}
          </Print>
          {fall < 1 ? (
            <g filter="url(#npMarked)" opacity={1 - clamp((fall - 0.7) / 0.3)}>
              <Print>
                <Couch x={TOYF.x} y={TOYF.y + 220 * fall * fall} w={COUCH.w * TOY} rot={fall * 40} />
              </Print>
            </g>
          ) : null}
          <Fig who="juno" P={{ ...P, ...face3At(t, [[0, 'worried'], [31, 'shock']]) }} yaw={0.7} x={1380 - 30 * easeOut(clamp((t - 31) / 8))} y={stepTop(1380) - jump} s={s3(0.95)} id="s23" />
        </g>
      </Frame>
    );
  };

  // ================================================================ the next morning: the hall
  const hs = (u: number, w: number) => {
    const st = stand(HALL, u, w);
    return { x: st.x, y: st.y + LEG_LEN * st.scale, s: s3(st.scale) };
  };
  const SUIT_AT = hs(0.5, 0.06);
  const S24: React.FC<ShotProps> = ({ t, len }) => {
    const w = lerp(0.72, 0.5, clamp(t / len));
    const at = hs(0.48, w);
    const ph = t * 0.32;
    return (
      <Frame>
        <g transform={camV(940, kf(t, [[0, 600], [len, 590]]), kf(t, [[0, 1.42], [len, 1.5]]))}>
          <Print>
            <Hall t={t} id="h24" hole={1} />
          </Print>
          <Fig who="juno" P={{ ...walk3(ph, A_POSE), expr: 'neutral' }} yaw={Math.PI} x={at.x} y={at.y - Math.abs(Math.cos(ph)) * 5} s={at.s} id="s24" />
        </g>
        <ClockChip x={540} y={300} t={t - 2} text="07:42" />
      </Frame>
    );
  };

  const S25: React.FC<ShotProps> = ({ t }) => {
    const knocks = [18, 24, 30];
    const jx = knocks.reduce((a, k) => a + (t >= k && t < k + 4 ? Math.sin((t - k) * 3.1) * 6 * (1 - (t - k) / 4) : 0), 0);
    const d0 = HALL.P(0.36, 0.16, 0);
    const d1 = HALL.P(0.64, 1, 0);
    return (
      <Frame>
        <g transform={`${camV(940, 560, 2.7)} translate(${jx} 0)`}>
          <Print>
            <Hall t={t + 30} id="h25" hole={0} />
          </Print>
          {knocks.map((k) =>
            t >= k && t < k + 8 ? (
              <circle key={k} cx={(d0.x + d1.x) / 2} cy={(d0.y + d1.y) / 2} r={30 + (t - k) * 18} fill="none" stroke={NP.paper} strokeWidth={6} opacity={1 - (t - k) / 8} />
            ) : null,
          )}
        </g>
      </Frame>
    );
  };

  const S26: React.FC<ShotProps> = ({ t, len }) => {
    const open = easeOut(clamp(t / 10));
    const ju = hs(0.4, 0.7);
    const hc = holeCentre();
    return (
      <Frame>
        <g transform={camV(kf(t, [[0, 930], [len, 940]]), kf(t, [[0, 560], [len, 540]]), kf(t, [[0, 1.55], [len, 1.62]]))}>
          <Print>
            <Hall t={t + 60} id="h26" open={open} />
          </Print>
          <Fig who="suit" P={{ ...A_POSE, headNod: kf(t, [[0, 0], [14, 22]]), look: [0.3, -0.9], armL: { abd: 8, flex: 4, bend: 8 }, armR: { abd: 8, flex: 4, bend: 8 }, ...face3At(t, [[0, 'stern']]) }} yaw={0.12} x={SUIT_AT.x} y={SUIT_AT.y} s={SUIT_AT.s} id="s26s" />
          <Fig who="juno" P={{ ...A_POSE, headTurn: -20, look: [0.6, 0.2], expr: 'worried' }} yaw={Math.PI - 0.5} x={ju.x} y={ju.y} s={ju.s} id="s26j" />
          <circle cx={hc.x} cy={hc.y} r={140 * clamp((t - 12) / 6)} fill="none" stroke={NP.pink} strokeWidth={5} strokeDasharray="16 12" opacity={0.8} />
        </g>
      </Frame>
    );
  };

  const SoftHall: React.FC<{ t: number; id: string; cx?: number; cy?: number }> = ({ t, id, cx = 940, cy = 520 }) => (
    <g filter="url(#blur16)">
      <g transform={camV(cx, cy, 2.6)}>
        <Print>
          <Hall t={t} id={id} open={1} />
        </Print>
      </g>
    </g>
  );

  const SuitCU: React.FC<{ t: number; len: number; id: string; expr: Pose3['expr']; lean?: number; turn?: number }> = ({ t, len, id, expr, lean = 0, turn = 0 }) => {
    const sc = 4.6 * (1 + 0.04 * clamp(t / len));
    const P = { ...A_POSE, lean, headTurn: turn, headNod: lean * 0.6, look: [-0.5, -0.2] as [number, number], ...face3At(t, [[0, expr]]) };
    const hc = headAt(CAST.suit, P, -0.35, 0, 0, sc);
    return (
      <Frame>
        <SoftHall t={t + 90} id={`h${id}`} />
        <rect x={0} y={0} width={W} height={H} fill={NP.ink} opacity={0.2} />
        <Fig who="suit" P={P} yaw={-0.35} x={560 - hc.x} y={900 - hc.y} s={sc} id={id} shadow={false} />
      </Frame>
    );
  };
  const S27: React.FC<ShotProps> = ({ t, len }) => <SuitCU t={t} len={len} id="s27" expr="stern" turn={kf(t, [[0, 10], [10, -6]])} />;

  const S28: React.FC<ShotProps> = ({ t, len }) => {
    const reach = easeOut(clamp((t - 4) / 10));
    const SP = { ...A_POSE, lean: 8 * reach, armR: { abd: 20, flex: lerp(10, 70, reach), bend: lerp(20, 30, reach) }, headNod: 10, look: [0.6, -0.4] as [number, number], ...face3At(t, [[0, 'stern']]) };
    const sp = hs(0.36, 0.2);
    const ju = hs(0.66, 0.36);
    const h = handAt(CAST.suit, SP, 'R', 0.75, sp.x, sp.y, sp.s);
    return (
      <Frame>
        <g transform={camV(kf(t, [[0, 960], [len, 965]]), 560, kf(t, [[0, 1.85], [len, 1.95]]))}>
          <Print>
            <Hall t={t + 120} id="h28" open={1} />
          </Print>
          <Fig who="suit" P={SP} yaw={0.75} x={sp.x} y={sp.y} s={sp.s} id="s28s" />
          <Print>
            <g transform={`translate(${h.x + 10} ${h.y}) rotate(-8) scale(0.16) translate(-540 -960)`}>
              <MoonFolder t={0} w={700} x={540} y={960} />
            </g>
          </Print>
          <Fig who="juno" P={{ ...A_POSE, armL: { abd: 18, flex: lerp(6, 50, reach), bend: 30 }, look: [-0.6, 0.1], ...face3At(t, [[0, 'worried']]) }} yaw={-0.85} x={ju.x} y={ju.y} s={ju.s} id="s28j" />
        </g>
      </Frame>
    );
  };

  const S29: React.FC<ShotProps> = ({ t, len }) => (
    <Frame>
      <g transform={`translate(540 960) scale(${kf(t, [[0, 1.0], [len, 1.08]])}) translate(-540 -960)`}>
        <Print>
          <rect x={-200} y={-200} width={1480} height={2320} fill="#5B4038" />
          {Array.from({ length: 9 }).map((_, i) => (
            <path key={i} d={`M ${-100 + i * 150} -200 L ${-100 + i * 150} 2120`} stroke="#3A2826" strokeWidth={6} />
          ))}
        </Print>
        <MoonFolder t={t} w={760} x={540} y={980} />
      </g>
    </Frame>
  );

  // ================================================================ the stakes: Bea, still tiny
  const S30: React.FC<ShotProps> = ({ t, len }) => {
    const step = easeOut(clamp(t / 12));
    const BP = { ...A_POSE, headNod: -24, look: [0.7, 0.8] as [number, number], armL: { abd: 40, flex: 30, bend: 40 }, armR: { abd: 40, flex: 30, bend: 40 }, ...face3At(t, [[0, 'worried'], [14, 'shock']]) };
    const SP = pose3At(t, [
      { f: 2, p: { look: [-0.2, 0] } as Partial<Pose3> },
      { f: 14, p: { headNod: 30, headTurn: -22, look: [-0.5, -0.9] }, ease: easeOut },
    ]);
    const JP = pose3At(t, [
      { f: 8, p: { legL: { abd: 2, flex: 0, bend: 0 }, look: [0.2, 0] } as Partial<Pose3> },
      { f: 20, p: { headNod: 28, headTurn: 18, look: [0.5, -0.9] }, ease: easeOut },
    ]);
    return (
      <Frame>
        <g transform={camV(900, 860, 3.0)}>
          <Print>
            <Hall t={t + 150} id="h30" open={1} veil={0.36} />
          </Print>
        </g>
        {/* Juno's shoe and leg huge on the left, the suit's shoes stepping in from the right */}
        {/* "he looks at your sister": the suit's head drops to her first, Juno's a beat later */}
        <Fig who="juno" P={{ ...JP, ...face3At(t, [[0, 'neutral'], [12, 'worried']]) }} yaw={0.3} x={150} y={1820} s={3.6} id="s30j" shadow={false} pitch={-0.06} />
        <Fig who="suit" P={{ ...SP, legL: { abd: 2, flex: lerp(20, 0, step), bend: lerp(20, 0, step) }, legR: { abd: 2, flex: lerp(-10, 0, step), bend: 0 }, ...face3At(t, [[0, 'stern']]) }} yaw={-0.4} x={lerp(1400, 1000, step)} y={1840} s={3.4} id="s30s" shadow={false} pitch={-0.06} />
        <Fig who="bea" P={BP} yaw={0.35} x={560} y={1760} s={0.95} id="s30b" mark pitch={-0.06} />
      </Frame>
    );
  };
  const S31: React.FC<ShotProps> = ({ t, len }) => <SuitCU t={t} len={len} id="s31" expr="smug" lean={kf(t, [[0, 6], [len, 16]])} turn={-4} />;
  const S32: React.FC<ShotProps> = ({ t, len }) => <JunoECU t={t} len={len} id="s32" expr="worried" look={[-0.5, -0.4]} turn={kf(t, [[0, 0], [len, -10]])} />;

  const S33: React.FC<ShotProps> = ({ t, len }) => {
    const ju = hs(0.34, 0.6);
    const be = HALL.P(0.5, 1, 0.66);
    return (
      <Frame>
        <g transform={camV(940, kf(t, [[0, 600], [len, 590]]), kf(t, [[0, 1.42], [len, 1.62]]))}>
          <Print>
            <Hall t={t + 200} id="h33" open={1} />
          </Print>
          <Fig who="suit" P={{ ...A_POSE, armR: { abd: 8, flex: 4, bend: 8 }, look: [0.2, -0.4], ...face3At(t, [[0, 'smug']]) }} yaw={0.05} x={SUIT_AT.x} y={SUIT_AT.y} s={SUIT_AT.s} id="s33s" />
          <Fig who="juno" P={{ ...A_POSE, headTurn: 28, look: [0.8, -0.2], ...face3At(t, [[0, 'worried']]) }} yaw={Math.PI - 0.35} x={ju.x} y={ju.y} s={ju.s} id="s33j" />
          <Fig who="bea" P={{ ...A_POSE, headNod: -20, look: [0, 0.8], armL: { abd: 60, flex: 20, bend: 30 }, armR: { abd: 60, flex: 20, bend: 30 }, expr: 'worried' }} yaw={0.6} x={be.x} y={be.y} s={ju.s * 0.2} id="s33b" mark />
        </g>
        <rect x={0} y={0} width={W} height={H} fill={NP.pink} opacity={0.12 * clamp(t / 20)} style={{ mixBlendMode: 'screen' }} />
      </Frame>
    );
  };

  const S34: React.FC<ShotProps> = ({ t }) => (
    <Frame vig={0.3}>
      <PartCard t={t} />
    </Frame>
  );

  return { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19, S20, S21, S22, S23, S24, S25, S26, S27, S28, S29, S30, S31, S32, S33, S34 };
};
