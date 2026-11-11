import React from 'react';
import { defineEpisode, Timeline, LookDef } from '../../engine';
import timeline from './timeline.json';
import { makeShots, StyleKey } from './shots';
import { NP, NP_FONT } from '../shrink/style';

// The 60 s vertical Short, three times: the same timeline, voice and sound, the cast rendered in Cel 3D, Paper Fold
// and Plush. Each is its own composition: Shrink60Cel, Shrink60Fold, Shrink60Plush (and their Board).

const W = 1080;
const H = 1920;
const Corners: React.FC<{ p: number }> = ({ p }) => {
  const m = 60 + 24 * Math.sin(Math.min(1, p * 3) * Math.PI * 0.5);
  const L = 90;
  return (
    <g stroke={NP.pink} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.9}>
      <path d={`M ${m} ${m + L} L ${m} ${m} L ${m + L} ${m}`} />
      <path d={`M ${W - m - L} ${m} L ${W - m} ${m} L ${W - m} ${m + L}`} />
      <path d={`M ${m} ${H - m - L} L ${m} ${H - m} L ${m + L} ${H - m}`} />
      <path d={`M ${W - m - L} ${H - m} L ${W - m} ${H - m} L ${W - m} ${H - m - L}`} />
    </g>
  );
};
const ShrinkChip: React.FC<{ f: number }> = ({ f }) => {
  const blink = Math.floor(f / 5) % 2 ? 1 : 0.55;
  return (
    <g transform="translate(150 190)">
      <rect x={-34} y={-38} width={268} height={76} rx={38} fill={NP.ink} opacity={0.75} stroke={NP.pink} strokeWidth={3} />
      <g opacity={blink} stroke={NP.pink} strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x={-10} y={-10} width={20} height={20} fill={NP.pink} />
        <path d="M -24 -24 L -14 -14 M 24 -24 L 14 -14 M -24 24 L -14 14 M 24 24 L 14 14" />
      </g>
      <text x={46} y={13} fontFamily={NP_FONT.ui} fontWeight={500} fontSize={36} fill={NP.paper} letterSpacing={7}>
        SHRINK
      </text>
    </g>
  );
};
const shrinkLook: LookDef = {
  grade: (lv) => `contrast(${1 + 0.08 * lv}) saturate(${1 + 0.12 * lv})`,
  Overlay: ({ f, p }) => (
    <g>
      <Corners p={p} />
      <ShrinkChip f={f} />
    </g>
  ),
};

const VERSIONS: [string, StyleKey][] = [
  ['Shrink60Cel', 'toon'],
  ['Shrink60Fold', 'fold'],
  ['Shrink60Plush', 'plush'],
  ['Shrink60Paint', 'paint'],
  ['Shrink60Stick', 'stick'],
];

// the Ink Stick version gives the man in the suit his own voice for his two lines (castvoice.py: the same slots, so
// nothing moves); the other versions keep the narrator's reading
const voiced = (key: StyleKey): Timeline => {
  const tl = timeline as Timeline;
  return key === 'stick' ? { ...tl, audio: { ...tl.audio, voice: 'shrink60/voice-cast.mp3' } } : tl;
};

export const shrink60 = VERSIONS.map(([id, key]) =>
  defineEpisode(id, {
    timeline: voiced(key),
    shots: makeShots(key),
    looks: { shrink: shrinkLook },
    bg: NP.ink,
    vignette: false,
    width: W,
    height: H,
  }),
);
