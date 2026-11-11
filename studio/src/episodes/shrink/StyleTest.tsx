import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import {
  ShotFrame, Hero, basePose, Pose, camT, LEG_LEN, stand, faceAt,
  Kitchen, KitchenIsland, KITCHEN, Bedroom, BEDROOM, Stairwell, Banister, Rooftop, Cat,
} from '../../engine';
import { PrintDefs, Print, PaperFinish, NP_LOOKS, Caliper, Squeeze, SpecimenTag, NPTitle, NP } from './style';

// Style frames for NIGHT PRINT: one frame per set, to check the look before building the episode.
//   npx remotion still src/index.ts ShrinkStyle out/shrink/style-0.png --frame=0

const J = NP_LOOKS.juno;
const B = NP_LOOKS.bea;

const KitchenFrame: React.FC = () => {
  const js = stand(KITCHEN, 0.36, 0.4);
  const bs = stand(KITCHEN, 0.62, 0.4);
  const juno: Pose = { ...basePose, x: js.x, y: js.y, scale: js.scale, yaw: 0.5, look: 0.8, armR: { a: 75, b: 0 }, handR: 'point', ...faceAt(30, [[0, 'smug']]) };
  const beaScale = bs.scale * 0.72;
  const bea: Pose = { ...basePose, x: bs.x, y: bs.y + LEG_LEN * (bs.scale - beaScale), scale: beaScale, yaw: -0.4, look: -0.8, armL: { a: 150, b: 20 }, armR: { a: 40, b: 30 }, expr: 'happy' };
  const feet = bs.y + LEG_LEN * bs.scale;
  const cat = KITCHEN.P(0.86, 1, 0.66);
  const cam = camT(980, 600, 1.7);
  return (
    <>
      <Print>
        <g transform={cam}>
          <Kitchen t={40} id="tk" />
        </g>
      </Print>
      <g transform={cam}>
        <Hero look={J} pose={juno} rimId="npCutR" shadow={0} />
        <Squeeze ax={bs.x} ay={feet} s={0.45} t={14} dur={8}>
          <Hero look={B} pose={bea} rimId="npCutL" shadow={0} />
        </Squeeze>
      </g>
      <Print>
        <g transform={cam}>
          <KitchenIsland />
          <Cat x={cat.x} y={cat.y} mood="alert" f={30} />
        </g>
      </Print>
      <g transform={cam}>
        <Caliper x0={bs.x - 70} x1={bs.x + 70} y0={bs.y - 250 * bs.scale} y1={feet} on={1} p={1} to={0.45} k={0.6} />
      </g>
    </>
  );
};

const BedroomFrame: React.FC = () => {
  const s = stand(BEDROOM, 0.62, 0.5);
  const juno: Pose = { ...basePose, x: s.x, y: s.y, scale: s.scale, yaw: -0.45, look: -0.7, armL: { a: 60, b: 20 }, expr: 'worried' };
  const cam = camT(960, 560, 1.15);
  return (
    <>
      <Print>
        <g transform={cam}>
          <Bedroom t={20} id="tb" />
        </g>
      </Print>
      <g transform={cam}>
        <Hero look={J} pose={juno} rimId="npCutL" shadow={0} />
        <SpecimenTag x={s.x + 90} y={s.y - 330} t={20} lines={['SPECIMEN 01', 'JUNO · 1:1']} />
      </g>
    </>
  );
};

const StairFrame: React.FC = () => {
  const juno: Pose = { ...basePose, x: 1640, y: 910 - LEG_LEN * 0.9, scale: 0.9, yaw: -0.5, look: -0.6, armL: { a: 30, b: 10 }, armR: { a: 30, b: 10 }, expr: 'shock' };
  const cam = camT(1000, 560, 0.95);
  return (
    <>
      <Print>
        <g transform={cam}>
          <Stairwell t={60} id="ts" />
        </g>
      </Print>
      <g transform={cam}>
        <Hero look={J} pose={juno} rimId="npCutL" shadow={0} />
      </g>
      <Print>
        <g transform={cam}>
          <Banister />
        </g>
      </Print>
    </>
  );
};

const TitleFrame: React.FC = () => {
  const juno: Pose = { ...basePose, x: 960, y: 840 - LEG_LEN * 0.62, scale: 0.62, armL: { a: 150, b: 10 }, armR: { a: 150, b: 10 }, expr: 'happy' };
  return (
    <>
      <Print>
        <Rooftop t={30} sunX={960} sunY={660} />
      </Print>
      <Hero look={J} pose={juno} rimId="npCutR" shadow={0} />
      <NPTitle t={60} lines={['WHAT IF YOU COULD', 'SHRINK ANYTHING?']} accent="SHRINK" y={330} />
    </>
  );
};

const FRAMES = [KitchenFrame, BedroomFrame, StairFrame, TitleFrame];

export const ShrinkStyle: React.FC = () => {
  const f = useCurrentFrame();
  const F = FRAMES[Math.min(f, FRAMES.length - 1)];
  return (
    <AbsoluteFill style={{ backgroundColor: NP.ink }}>
      <ShotFrame>
        <PrintDefs />
        <F />
        <PaperFinish />
      </ShotFrame>
    </AbsoluteFill>
  );
};
export const SHRINK_STYLE_FRAMES = FRAMES.length;
