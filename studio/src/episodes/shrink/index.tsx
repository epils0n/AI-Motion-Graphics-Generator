import React from 'react';
import { defineEpisode, Timeline, LookDef } from '../../engine';
import timeline from './timeline.json';
import { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15 } from './shots';
import { NP, NP_FONT } from './style';

// The power's look while a shrink runs: the picture tightens a touch, pink viewfinder corners close in on the frame
// and a SHRINK chip blinks in the corner with its icon (a square with arrows pressing in).
const Corners: React.FC<{ p: number }> = ({ p }) => {
  const m = 70 + 26 * Math.sin(Math.min(1, p * 3) * Math.PI * 0.5);
  const L = 90;
  return (
    <g stroke={NP.pink} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.9}>
      <path d={`M ${m} ${m + L} L ${m} ${m} L ${m + L} ${m}`} />
      <path d={`M ${1920 - m - L} ${m} L ${1920 - m} ${m} L ${1920 - m} ${m + L}`} />
      <path d={`M ${m} ${1080 - m - L} L ${m} ${1080 - m} L ${m + L} ${1080 - m}`} />
      <path d={`M ${1920 - m - L} ${1080 - m} L ${1920 - m} ${1080 - m} L ${1920 - m} ${1080 - m - L}`} />
    </g>
  );
};
const ShrinkChip: React.FC<{ f: number }> = ({ f }) => {
  const blink = Math.floor(f / 5) % 2 ? 1 : 0.55;
  return (
    <g transform="translate(150 150)">
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

export const shrink = defineEpisode('Shrink', {
  timeline: timeline as Timeline,
  shots: { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15 },
  looks: { shrink: shrinkLook },
  bg: NP.ink,
  vignette: false, // each shot draws its own (PaperFinish), soft on the lab sheet
});
