import React from 'react';
import {
  Hero, Pose, basePose, poseAt, faceAt, kf, clamp, easeOut, easeIn, settle, camT, LEG_LEN, HEAD, joints, toWorld, reachAngle, stand, lerp,
  Bedroom, BEDROOM, Stairwell, Banister, stepTop, Kitchen, KitchenIsland, KITCHEN, Rooftop, Tabletop, Cat, Mug, ShotProps,
} from '../../engine';
import { PrintDefs, Print, PaperFinish, NP, NP_LOOKS, Caliper, Squeeze, Marked, SpecimenTag, NPTitle, shrinkAt, Cracks } from './style';
import { Suitcase, SuitcaseTop, ClothesHeap, ClothesTop, Couch, LabSheet, LabLabel, Ink, Balance, Earth, Marble, BlackHole, BentGrid } from './props';

// "What if you could shrink anything?" in NIGHT PRINT. Fifteen shots on three sets (bedroom, stairwell, kitchen),
// the rooftop for the title and a printed lab sheet for the science. The power: pink caliper jaws clamp the thing,
// the readout counts down, the thing squeezes down with pink ghost trails. Every shot is a pure function of its clock.
// Layers in every shot: the world through <Print> (two inks), the cast on top in colour, the pink power on top of
// that, then the paper finish.

const J = NP_LOOKS.juno;
const B = NP_LOOKS.bea;

/** Every shot's frame: the style's defs, the shot, the paper finish (in screen space, outside any camera). */
const Frame: React.FC<{ children: React.ReactNode; dots?: number; vig?: number }> = ({ children, dots, vig }) => (
  <g>
    <PrintDefs />
    {children}
    <PaperFinish dots={dots} vig={vig} />
  </g>
);

/** The shrink's progress 0..1 for the caliper, from the same curve as the squeeze. */
const closeP = (s: number, to: number) => clamp((1 - s) / (1 - to));

/** A sleeve and a pointing mitten coming into an insert from off frame (the hand from the side Juno stands on). */
const PointingArm: React.FC<{ x: number; y: number; from: { x: number; y: number }; rot: number; k?: number }> = ({ x, y, from, rot, k = 4.8 }) => (
  <g filter="url(#npCutRs)">
    <path d={`M ${x + 30} ${y + 30} L ${from.x} ${from.y}`} stroke={J.line} strokeWidth={26 * k} strokeLinecap="round" />
    <path d={`M ${x + 30} ${y + 30} L ${from.x} ${from.y}`} stroke={J.jacket} strokeWidth={22 * k} strokeLinecap="round" />
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`}>
      <rect x={-4} y={10} width={8} height={24} rx={4} fill={J.hand} stroke={J.line} strokeWidth={2.4} />
      <path d="M -11 -2 Q -14 14 -6 18 L 7 18 Q 14 14 11 -2 Z" fill={J.hand} stroke={J.line} strokeWidth={2.6} strokeLinejoin="round" />
      <ellipse cx={10} cy={6} rx={4.5} ry={7} fill={J.hand} stroke={J.line} strokeWidth={2.4} />
    </g>
  </g>
);

// ====================================================================== the bedroom
const CASE = { x: 655, y: 712, w: 270 }; // the suitcase on the bed: bottom centre, width
const JB = stand(BEDROOM, 0.43, 0.4); // Juno beside the bed

// ---------- S1: medium wide, the bedroom: Juno leans on the overflowing suitcase, the lid springs back up ----------
export const S1: React.FC<ShotProps> = ({ t, len }) => {
  const push = t < 12 ? easeOut(clamp(t / 8)) : 1 - easeOut(clamp((t - 12) / 5));
  const pose = poseAt(t, [
    { f: 0, p: { x: JB.x, y: JB.y, scale: JB.scale, yaw: -0.55, facing: -1, look: -0.6, armL: { a: 70, b: -10 }, armR: { a: -60, b: -10 }, tilt: -6 } },
    { f: 8, p: { tilt: -16, armL: { a: 92, b: 6 }, armR: { a: -82, b: 6 }, squash: 0.05 }, ease: easeOut },
    { f: 12, p: {} },
    { f: 16, p: { tilt: -2, armL: { a: 60, b: -20 }, armR: { a: -50, b: -20 }, squash: -0.02 }, ease: easeOut },
  ]);
  const face = faceAt(t, [[0, 'worried'], [13, 'shock']]);
  const lid = lerp(0.95, 0.06, push) + settle(t - 13, 0.18, 1.8, 4);
  const heapY = CASE.y - CASE.w * 0.2;
  return (
    <Frame>
      <g transform={camT(kf(t, [[0, 770], [len, 760]]), 610, kf(t, [[0, 1.62], [len, 1.7]]))}>
        <Print>
          <Bedroom t={t + 30} id="b1" veil={0.4} />
          <Suitcase x={CASE.x} y={CASE.y} w={CASE.w} lid={lid}>
            {/* the heap squashes under the lid and bulges back up when he lets go */}
            <g transform={`translate(${CASE.x} ${heapY}) scale(${1 + 0.06 * push} ${1 - 0.3 * push + settle(t - 13, 0.08, 1.8, 4)}) translate(${-CASE.x} ${-heapY})`}>
              <ClothesHeap x={CASE.x} y={heapY} w={CASE.w * 0.92} />
            </g>
          </Suitcase>
        </Print>
        <Hero look={J} pose={{ ...pose, ...face }} rimId="npCutL" shadow={0} />
      </g>
    </Frame>
  );
};

// ---------- S2: top-down insert, the open suitcase: the caliper clamps the heap, it squeezes down into the case ----------
const S2_AT = 8;
const S2_TO = 0.28;
export const S2: React.FC<ShotProps> = ({ t, len }) => {
  const s = shrinkAt(t, S2_AT, S2_TO, 7);
  const hand = { x: kf(t, [[0, 1620], [4, 1440], [7, 1455]]), y: kf(t, [[0, 960], [4, 800], [7, 812]]) };
  return (
    <Frame>
      <g transform={`translate(960 540) rotate(${-3 + t * 0.06}) scale(${1 + t * 0.003}) translate(-960 -540)`}>
        <Print>
          <Tabletop edge={1500} wood="#4E5E92" grain="#43527F" lip="#3E4C7A" />
          <SuitcaseTop x={960} y={660} w={880} />
        </Print>
        <Squeeze ax={960} ay={640} s={s} t={t - S2_AT} dur={7}>
          <Print>
            <ClothesTop x={960} y={640} w={980} />
          </Print>
        </Squeeze>
        <Caliper x0={380} x1={1540} y0={300} y1={980} on={(t - 1) / 4} p={closeP(s, S2_TO)} to={S2_TO} k={1.5} />
        <PointingArm x={hand.x} y={hand.y} from={{ x: hand.x + 560, y: hand.y + 460 }} rot={130} k={5.2} />
      </g>
    </Frame>
  );
};

// ---------- S3: medium close, the bed: the case shuts with room to spare, Juno zips it round, smug ----------
export const S3: React.FC<ShotProps> = ({ t, len }) => {
  const zip = easeOut(clamp((t - 3) / 14));
  const top = CASE.y - CASE.w * 0.34 + 6;
  const pull = { x: CASE.x - CASE.w / 2 + 12 + (CASE.w - 24) * zip, y: top };
  const base: Partial<Pose> = { x: JB.x - 20, y: JB.y, scale: JB.scale, yaw: -0.5, facing: -1, look: -0.5, tilt: -10, armR: { a: -20, b: -10 } };
  const aim = reachAngle({ ...basePose, ...base } as Pose, pull);
  const pose: Pose = { ...basePose, ...base, armL: { a: -aim + 6, b: 4 }, handL: 'open', ...faceAt(t, [[0, 'happy'], [14, 'smug']]) };
  return (
    <Frame>
      <g transform={camT(kf(t, [[0, 760], [len, 750]]), 640, kf(t, [[0, 2.35], [len, 2.5]]))}>
        <Print>
          <Bedroom t={t + 62} id="b3" veil={0.42} />
          <Suitcase x={CASE.x} y={CASE.y} w={CASE.w} lid={0} zip={zip}>
            {null}
          </Suitcase>
        </Print>
        <Hero look={J} pose={pose} rimId="npCutL" shadow={0} />
        <SpecimenTag x={CASE.x - 108} y={CASE.y - 40} t={t - 12} lines={['CLOTHES', '×0.28']} pink rot={8} s={0.55} />
      </g>
    </Frame>
  );
};

// ====================================================================== the stairwell
const NOSE = (x: number) => 420 + ((x - 420) * 70) / 150; // the line along the step noses
const SLOPE = (Math.atan2(70, 150) * 180) / Math.PI; // about 25 degrees
const COUCH = { x: 880, w: 430 }; // wedged across the stairs, bottom centre on the noses
const JS = { x: 1250, feet: stepTop(1250), scale: 0.95 }; // Juno a few steps below it

const junoStairs = (extra: Partial<Pose> = {}): Pose => ({ ...basePose, x: JS.x, y: JS.feet - LEG_LEN * JS.scale, scale: JS.scale, yaw: -0.55, facing: -1, ...extra });

// ---------- S4: wide, the stairwell: a couch wedged across the stairs; Juno shoves from below, it won't move ----------
export const S4: React.FC<ShotProps> = ({ t, len }) => {
  const shove = Math.max(0, Math.sin(t / 3.2)) * 0.6;
  const pose = poseAt(t, [
    { f: 0, p: junoStairs({ tilt: -14, armL: { a: 96, b: 4 }, armR: { a: -96, b: 4 }, look: -0.4 }) },
    { f: 10, p: { tilt: -22, squash: 0.05 } },
    { f: 20, p: { tilt: -16, squash: 0 } },
    { f: 30, p: { tilt: -24, squash: 0.06 } },
  ]);
  const jig = settle(t % 14, 1.4, 2.6, 3);
  return (
    <Frame>
      <g transform={camT(kf(t, [[0, 1010], [len, 990]]), 560, kf(t, [[0, 1.0], [len, 1.06]]))}>
        <Print>
          <Stairwell t={t + 20} id="sw4" />
          <Couch x={COUCH.x + jig} y={NOSE(COUCH.x)} w={COUCH.w} rot={SLOPE} />
          {/* a scuff on the wall where it jammed */}
          <path d={`M ${COUCH.x - 160} ${NOSE(COUCH.x) - 330} q 60 -16 130 -10`} stroke="#151A20" strokeWidth={6} opacity={0.5} fill="none" />
        </Print>
        <Hero look={J} pose={{ ...pose, x: pose.x - shove * 6, ...faceAt(t, [[0, 'worried']]) }} rimId="npCutL" shadow={0} />
        <Print>
          <Banister />
        </Print>
      </g>
    </Frame>
  );
};

// ---------- S5: medium, the couch: the caliper clamps it; it squeezes to a toy and drops onto the tread ----------
const S5_AT = 8;
const S5_TO = 0.13;
export const S5: React.FC<ShotProps> = ({ t, len }) => {
  const s = shrinkAt(t, S5_AT, S5_TO, 7);
  const drop = easeIn(clamp((t - 15) / 4));
  const land = settle(t - 19, 3, 2.2, 3);
  const cx = COUCH.x;
  const cy = lerp(NOSE(cx), stepTop(cx), drop) - (t > 19 ? Math.abs(land) : 0);
  const rot = lerp(SLOPE, 0, drop);
  const pose = poseAt(t, [
    { f: 0, p: junoStairs({ tilt: -8, armL: { a: 30, b: 10 }, armR: { a: -20, b: 10 }, look: -0.6 }) },
    { f: 3, p: { armL: { a: 84, b: 0 }, handL: 'point' }, ease: easeOut },
    { f: 5, p: { armL: { a: 80, b: 0 } } },
  ]);
  return (
    <Frame>
      <g transform={camT(kf(t, [[0, 990], [len, 980]]), 610, kf(t, [[0, 1.75], [len, 1.85]]))}>
        <Print>
          <Stairwell t={t + 65} id="sw5" />
        </Print>
        <Squeeze ax={cx} ay={cy} s={s} t={t - S5_AT} dur={7}>
          <Print>
            <Couch x={cx} y={cy} w={COUCH.w} rot={rot} />
          </Print>
        </Squeeze>
        <Hero look={J} pose={{ ...pose, handL: t >= 3 ? 'point' : 'open', ...faceAt(t, [[0, 'neutral'], [6, 'smug']]) }} rimId="npCutL" shadow={0} />
        <Caliper x0={cx - 250} x1={cx + 250} y0={NOSE(cx) - 300} y1={stepTop(cx) + 6} on={(t - 1) / 4} p={closeP(s, S5_TO)} to={S5_TO} k={0.9} />
        <Print>
          <Banister />
        </Print>
      </g>
    </Frame>
  );
};

// ---------- S6: medium close: Juno picks the toy couch up in one hand; his arm drops like it's still full size ----------
export const S6: React.FC<ShotProps> = ({ t, len }) => {
  const pose = poseAt(t, [
    // he holds it up in front of him, proud: the upper arm forward, the forearm up
    { f: 0, p: junoStairs({ x: JS.x - 120, y: stepTop(JS.x - 120) - LEG_LEN * JS.scale, armL: { a: 96, b: 44 }, armR: { a: -20, b: -10 }, look: -0.5, headTilt: 4 }) },
    { f: 4, p: { armL: { a: 100, b: 46 } } },
    // then it yanks his arm straight down and pulls him over after it
    { f: 7, p: { armL: { a: 6, b: -2 }, tilt: -16, squash: 0.09, headTilt: -10, look: -0.9 }, ease: easeIn },
    { f: 10, p: { armL: { a: 10, b: -4 }, tilt: -12, squash: 0.05 } },
  ]);
  const face = faceAt(t, [[0, 'happy'], [8, 'shock'], [20, 'oops']]);
  const j = joints(pose);
  const hand = toWorld(pose, j.armL.end);
  const cw = COUCH.w * S5_TO;
  return (
    <Frame>
      <g transform={camT(kf(t, [[0, 1070], [len, 1060]]), kf(t, [[0, 588], [len, 604]]), kf(t, [[0, 2.5], [len, 2.65]]))}>
        <Print>
          <Stairwell t={t + 90} id="sw6" />
        </Print>
        <Hero look={J} pose={{ ...pose, ...face }} rimId="npCutL" shadow={0} />
        <Marked>
          <Print>
            <Couch x={hand.x - 4} y={hand.y + 16} w={cw} shadow={false} />
          </Print>
        </Marked>
        {/* the near hand closes over the couch's arm (drawn again on top so it holds it) */}
        <circle cx={hand.x} cy={hand.y} r={10 * JS.scale} fill={J.hand} stroke={J.line} strokeWidth={2.6} />
        <SpecimenTag x={hand.x - 230} y={hand.y - 190} t={t - 9} lines={['COUCH ×0.13', 'STILL 40 kg']} pink rot={-5} s={0.42} />
      </g>
    </Frame>
  );
};

// ====================================================================== the kitchen
const ISLE = { u: 0.5, d: 0.53 };
const BEA_FEET = KITCHEN.P(ISLE.u, 0.695, ISLE.d); // standing on the island top
const BEA_SC = 0.76;
const beaPose = (t: number, extra: Partial<Pose> = {}): Pose => {
  const bounce = Math.abs(Math.sin(t / 3.4)) * 14;
  const wave = Math.sin(t / 3.4) * 22;
  return {
    ...basePose,
    x: BEA_FEET.x,
    y: BEA_FEET.y - LEG_LEN * BEA_SC - bounce,
    scale: BEA_SC,
    yaw: 0.2,
    armL: { a: 150 + wave, b: 20 },
    armR: { a: 150 - wave, b: 20 },
    legL: { a: 8 + wave * 0.3, b: 0 },
    legR: { a: -8 + wave * 0.3, b: 0 },
    tilt: wave * 0.2,
    headTilt: -wave * 0.2,
    expr: 'happy',
    sway: wave,
    ...extra,
  };
};
const JK = stand(KITCHEN, 0.8, 0.76);

// ---------- S7: wide two-shot, the kitchen: Bea dances on the island; Juno, in the foreground, has had enough ----------
export const S7: React.FC<ShotProps> = ({ t, len }) => {
  const juno: Pose = { ...basePose, x: JK.x, y: JK.y, scale: JK.scale, yaw: -0.6, facing: -1, look: -0.8, armL: { a: 16, b: -6 }, armR: { a: -14, b: -6 }, headTilt: -4, ...faceAt(t, [[0, 'tired']]) };
  const cat = KITCHEN.P(0.12, 1, 0.62);
  return (
    <Frame>
      <g transform={camT(kf(t, [[0, 990], [len, 1000]]), 600, kf(t, [[0, 1.02], [len, 1.08]]))}>
        <Print>
          <Kitchen t={t + 40} id="k7" veil={0.4} />
        </Print>
        <Print>
          <KitchenIsland />
          <Cat x={cat.x} y={cat.y} mood="alert" f={t} />
        </Print>
        <Hero look={B} pose={beaPose(t)} rimId="npCutR" shadow={0} />
        <Hero look={J} pose={juno} rimId="npCutL" shadow={0} />
      </g>
    </Frame>
  );
};

// ---------- S8: medium, low, on the island: the caliper clamps Bea mid-dance; she squeezes down to mouse size ----------
const S8_AT = 8;
const S8_TO = 0.14;
export const S8: React.FC<ShotProps> = ({ t, len }) => {
  const s = shrinkAt(t, S8_AT, S8_TO, 7);
  const frozen = Math.min(t, 6);
  const pose = beaPose(frozen + 40, t >= 6 ? { armL: { a: 120, b: 30 }, armR: { a: 120, b: 30 }, legL: { a: 10, b: 0 }, legR: { a: -10, b: 0 }, tilt: 0, headTilt: 0 } : {});
  const feetY = BEA_FEET.y;
  return (
    <Frame>
      <g transform={camT(kf(t, [[0, 960], [len, 960]]), kf(t, [[0, 520], [len, 540]]), kf(t, [[0, 2.15], [len, 2.3]]))}>
        <Print>
          <Kitchen t={t + 84} id="k8" veil={0.44} />
          <KitchenIsland />
        </Print>
        <Squeeze ax={BEA_FEET.x} ay={feetY} s={s} t={t - S8_AT} dur={7}>
          <Hero look={B} pose={{ ...pose, ...faceAt(t, [[0, 'happy'], [9, 'shock']]) }} rimId="npCutR" shadow={0} />
        </Squeeze>
        <Caliper x0={BEA_FEET.x - 120} x1={BEA_FEET.x + 120} y0={feetY - 420} y1={feetY} on={(t - 1) / 4} p={closeP(s, S8_TO)} to={S8_TO} k={0.55} />
      </g>
    </Frame>
  );
};

// ---------- S9: macro insert on the island top: tiny Bea looks up; the cat's head slides into frame ----------
export const S9: React.FC<ShotProps> = ({ t, len }) => {
  const bea: Pose = { ...basePose, x: 1020, y: 790 - LEG_LEN * 1.0, scale: 1.0, yaw: -0.5, facing: -1, look: -1, armL: { a: 40, b: 30 }, armR: { a: -30, b: 30 }, headTilt: kf(t, [[0, 0], [10, 8]]), ...faceAt(t, [[0, 'shock'], [12, 'worried']]) };
  // the cat, mirrored so its head leads in from the left: its head lands at about (480, 430)
  const catX = kf(t, [[0, -360], [10, 190], [len, 215]], easeOut);
  const catY = kf(t, [[0, 860], [10, 800], [len, 792]]);
  return (
    <Frame>
      <g transform={camT(960, 540, kf(t, [[0, 1.0], [len, 1.06]]))}>
        <Print>
          <Tabletop edge={860} wood="#A89C8A" grain="#968A78" lip="#8E8474" kind="stone" floor="#2C2A30" floorLines="#232127" />
          <Mug x={1460} y={760} rot={0} steam={0} f={t} />
          <g transform={`translate(${catX} ${catY}) scale(-6.2 6.2)`}>
            <Cat x={0} y={0} mood="alert" f={t + 30} />
          </g>
        </Print>
        <Marked>
          <Hero look={B} pose={bea} rimId="npCutR" shadow={0} />
        </Marked>
      </g>
    </Frame>
  );
};

// ====================================================================== the title
// ---------- S10: the title, wide on the roof at night; Juno with the toy couch and the tiny suitcase at his feet ----------
const ROOF = 840;
export const S10: React.FC<ShotProps> = ({ t, len }) => {
  const pose = poseAt(t, [
    { f: 0, p: { ...basePose, x: 960, y: ROOF - LEG_LEN * 0.62, scale: 0.62, armL: { a: 20, b: 6 }, armR: { a: 20, b: 6 } } },
    { f: 16, p: {} },
    { f: 22, p: { armL: { a: 150, b: 10 }, armR: { a: 150, b: 10 } }, ease: easeOut },
  ]);
  return (
    <Frame>
      <g transform={camT(960, kf(t, [[0, 520], [len, 545]]), kf(t, [[0, 1.0], [len, 1.06]]))}>
        <Print>
          <Rooftop t={t} sunX={960} sunY={690 - 40 * easeOut(clamp(t / 40))} />
        </Print>
        <Marked>
          <Print>
            <Couch x={1060} y={ROOF + 4} w={56} />
            <Suitcase x={878} y={ROOF + 4} w={44} />
          </Print>
        </Marked>
        <Hero look={J} pose={{ ...pose, ...faceAt(t, [[0, 'happy']]) }} rimId="npCutR" shadow={0} />
        <NPTitle t={t} lines={['WHAT IF YOU COULD', 'SHRINK ANYTHING?']} accent="SHRINK" y={340} size={200} />
      </g>
    </Frame>
  );
};

// ====================================================================== the lab sheet
// ---------- S11: lab sheet: a balance; the big couch on one pan, the toy couch drops on the other: dead level ----------
export const S11: React.FC<ShotProps> = ({ t, len }) => {
  const landT = 16;
  const drop = clamp((t - 8) / (landT - 8));
  const tilt = t < landT ? -16 : settle(t - landT, -6, 1.4, 6);
  const L = { x: 960 - Math.cos((tilt * Math.PI) / 180) * 520, y: 420 - Math.sin((tilt * Math.PI) / 180) * 520 };
  const R = { x: 960 + Math.cos((tilt * Math.PI) / 180) * 520, y: 420 + Math.sin((tilt * Math.PI) / 180) * 520 };
  return (
    <Frame dots={0.05} vig={0.14}>
      <g transform={`translate(960 540) scale(${kf(t, [[0, 1], [len, 1.04]])}) translate(-960 -540)`}>
        <LabSheet t={t} fig="FIG. 1 · MASS" />
        <Balance
          x={960}
          y={940}
          tilt={tilt}
          left={<Couch x={L.x} y={L.y + 240} w={300} shadow={false} />}
          right={
            t >= 8 ? (
              <Marked>
                <Couch x={R.x} y={lerp(R.y - 360, R.y + 240, easeIn(drop))} w={300 * 0.13} shadow={false} />
              </Marked>
            ) : null
          }
        />
        {/* a pink ring and its scale, so the toy couch reads at a glance */}
        {t >= landT ? (
          <g opacity={clamp((t - landT) / 4)}>
            <circle cx={R.x} cy={R.y + 228} r={62} fill="none" stroke={NP.pink} strokeWidth={5} strokeDasharray="14 10" />
            <LabLabel x={R.x + 120} y={R.y + 150} t={t - landT} text="×0.13" size={36} color={NP.pinkDeep} anchor="start" />
          </g>
        ) : null}
        <LabLabel x={L.x} y={L.y + 360} t={t - 2} text="40 kg" size={52} />
        <LabLabel x={R.x} y={R.y + 360} t={t - landT - 2} text="40 kg" size={52} color={NP.pinkDeep} />
        <LabLabel x={960} y={170} t={t - landT - 8} text="SMALLER · NOT LIGHTER" size={58} />
      </g>
    </Frame>
  );
};

// ---------- S12: lab sheet: the Earth in the calipers squeezes down; the loupe shows it beside a 16 mm marble ----------
const S12_AT = 12;
const S12_TO = 0.045;
export const S12: React.FC<ShotProps> = ({ t, len }) => {
  const s = shrinkAt(t, S12_AT, S12_TO, 16);
  const E = { x: 560, y: 560, r: 300 };
  const loupe = backOutK(clamp((t - 40) / 8));
  const km = Math.round(lerp(12742, 0.016, closeP(s, S12_TO)) * 1000) / 1000;
  const read = closeP(s, S12_TO) >= 1 ? '16 mm' : `${km.toLocaleString('en-GB', { maximumFractionDigits: 0 })} km`;
  return (
    <Frame dots={0.05} vig={0.14}>
      <LabSheet t={t} fig="FIG. 2 · SIZE" />
      <Squeeze ax={E.x} ay={E.y + E.r} s={s} t={t - S12_AT} dur={16}>
        <Earth x={E.x} y={E.y} r={E.r} spin={t * 0.004} id="e12" />
      </Squeeze>
      <Caliper x0={E.x - E.r} x1={E.x + E.r} y0={E.y - E.r} y1={E.y + E.r} on={(t + 2) / 4} p={closeP(s, S12_TO)} to={S12_TO} label={read} k={1.3} />
      {/* the loupe: the shrunk Earth and a marble, side by side, both 16 mm */}
      {loupe > 0 ? (
        <g transform={`translate(1390 560) scale(${loupe}) translate(-1390 -560)`}>
          <Ink d={`M ${E.x + 20} ${E.y + E.r - 20} L 1150 640`} t={t - 40} dur={6} w={3} color={NP.ink} />
          <circle cx={1390} cy={560} r={330} fill={NP.paper} stroke={NP.ink} strokeWidth={10} />
          <circle cx={1390} cy={560} r={316} fill="none" stroke={NP.teal} strokeWidth={4} opacity={0.6} />
          <Earth x={1270} y={540} r={100} spin={t * 0.004} id="e12l" />
          <Marble x={1510} y={540} r={100} />
          <path d="M 1170 690 L 1610 690 M 1170 676 L 1170 704 M 1370 676 L 1370 704 M 1410 676 L 1410 704 M 1610 676 L 1610 704" stroke={NP.ink} strokeWidth={4} />
          <LabLabel x={1270} y={760} t={t - 48} text="EARTH" size={34} />
          <LabLabel x={1510} y={760} t={t - 52} text="MARBLE" size={34} />
          <LabLabel x={1390} y={330} t={t - 56} text="BOTH 16 mm" size={40} color={NP.pinkDeep} />
        </g>
      ) : null}
    </Frame>
  );
};
const backOutK = (x: number) => (x <= 0 ? 0 : 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2));

// ---------- S13: the sheet floods with ink; the marble-Earth caves in to a black hole; the grid bends into it ----------
export const S13: React.FC<ShotProps> = ({ t, len }) => {
  const dark = easeOut(clamp((t - 2) / 10));
  const collapse = easeIn(clamp((t - 4) / 8));
  const on = clamp((t - 10) / 6);
  return (
    <Frame dots={0.04} vig={0.14 + 0.4 * dark}>
      <g transform={`translate(960 540) scale(${kf(t, [[0, 1], [len, 1.08]])}) translate(-960 -540)`}>
        <LabSheet t={t} fig="FIG. 3 · DENSITY" dark={dark * 0.94} />
        <BentGrid x={960} y={540} pull={on} color={NP.teal} />
        {collapse < 1 ? (
          <g transform={`translate(960 540) scale(${1 - collapse * 0.75}) translate(-960 -540)`} opacity={1 - collapse * 0.6}>
            <Earth x={960} y={540} r={150} id="e13" />
          </g>
        ) : null}
        <BlackHole x={960} y={540} r={110} t={t} on={on} />
        <LabLabel x={960} y={900} t={t - 16} text="r < 8.87 mm" size={48} color={NP.pink} />
      </g>
    </Frame>
  );
};

// ====================================================================== the turn and the end
// ---------- S14: extreme close-up: "That's real." Juno, worried; his paper edge turns pink ----------
export const S14: React.FC<ShotProps> = ({ t, len }) => {
  const sc = 6.4 * (1 + 0.04 * clamp(t / len));
  const head = { x: 960, y: 700 };
  const pose: Pose = { ...basePose, x: head.x, y: head.y - HEAD.y * sc, scale: sc, yaw: 0.12, look: 0.15, armL: { a: 14, b: -6 }, armR: { a: 14, b: -6 }, ...faceAt(t, [[0, 'worried']]) };
  return (
    <Frame>
      <g filter="url(#blur16)">
        <g transform="translate(-900 -520) scale(2)">
          <Print>
            <Stairwell t={t + 200} id="sw14" />
          </Print>
        </g>
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill={NP.ink} opacity={0.3} />
      <Hero look={J} pose={pose} rimId={t > 8 ? 'npCutPinkS' : 'npCutRs'} shadow={0} />
    </Frame>
  );
};

// ---------- S15: wide, the bottom of the stairs: the toy couch on the floor; the boards crack out from under it ----------
const TOY = { x: 1610, y: 910 };
export const S15: React.FC<ShotProps> = ({ t, len }) => {
  const crack = clamp((t - 8) / 46);
  const sink = easeIn(clamp((t - 10) / 50)) * 10;
  const pose = poseAt(t, [
    { f: 0, p: { ...basePose, x: 1330, y: stepTop(1330) - LEG_LEN * 0.95, scale: 0.95, yaw: 0.55, look: 0.7, armL: { a: 20, b: 10 }, armR: { a: 20, b: 10 } } },
    { f: 22, p: { headTilt: 6 } },
    { f: 28, p: { tilt: -8, armL: { a: 50, b: 30 }, armR: { a: 50, b: 30 }, look: 1, headTilt: 8 }, ease: easeOut },
  ]);
  return (
    <Frame>
      <g transform={camT(kf(t, [[0, 1480], [len, 1530]]), kf(t, [[0, 700], [len, 760]]), kf(t, [[0, 1.3], [len, 1.55]]))}>
        <Print>
          <Stairwell t={t + 230} id="sw15" />
          {/* the floorboards' front edge splits and bows under the couch */}
          <Cracks x={TOY.x} y={TOY.y + 6} p={crack} r={460} seed={5} squashY={0.5} color="#0A0C10" />
          <Cracks x={TOY.x} y={TOY.y + 4} p={crack * 0.8} r={240} seed={9} squashY={0.18} color="#0A0C10" />
          <path d={`M ${TOY.x - 140} ${TOY.y} Q ${TOY.x} ${TOY.y + sink * 2.2} ${TOY.x + 140} ${TOY.y}`} stroke="#0A0C10" strokeWidth={5} fill="none" opacity={clamp(crack * 3)} />
        </Print>
        <Marked>
          <Print>
            <Couch x={TOY.x} y={TOY.y + sink} w={COUCH.w * S5_TO} />
          </Print>
        </Marked>
        <Hero look={J} pose={{ ...pose, ...faceAt(t, [[0, 'neutral'], [24, 'shock']]) }} rimId="npCutR" shadow={0} />
        {t > 30 ? <SpecimenTag x={TOY.x + 50} y={TOY.y - 160} t={t - 30} lines={['COUCH ×0.13', 'STILL 40 kg']} pink rot={6} s={0.5} /> : null}
      </g>
    </Frame>
  );
};
