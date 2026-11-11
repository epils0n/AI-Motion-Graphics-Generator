import React from 'react';
import { LEG_LEN, Room, stand } from '../engine';
import { PrintDefs, PaperFinish, NP } from '../episodes/shrink/style';
import { STICK } from '../designs/CharacterDesigns';
import { Design, Fig3D, Pose3, A_POSE, castFor } from '../designs/juno3d';

// The Ink Stick kit: everything a new episode needs to draw in the house look, from one import.
//   import { InkFrame, InkFig, inkStand, camV, Print, pose3At, face3At, ... } from '../../kit/ink';
// The world is Night Print (sets printed in two inks, pink for the power); the cast are Ink Stick figures cut from the
// same ink. The full style guide is the skill's references/ink-stick.md; shrink60/shots.tsx is the worked example.

export { PrintDefs, Print, PaperFinish, NP, NP_FONT, Caliper, Squeeze, SpecimenTag, Marked, NPTitle, HandNote, Cracks, shrinkAt } from '../episodes/shrink/style';
export { Fig3D, pose3At, face3At, castFor, handAt, headAt, A_POSE, POINT_POSE, HEAD_POSE } from '../designs/juno3d';
export type { Pose3, Design, Expr3, Limb3 } from '../designs/juno3d';
export { STICK } from '../designs/CharacterDesigns';

/** The house cast. Juno is the hero (the "you" of the narration), Bea his little sister, the suit the man from the lab. */
export const INK_CAST = { juno: STICK, bea: castFor(STICK, 'bea'), suit: castFor(STICK, 'suit') };
export type InkWho = keyof typeof INK_CAST;

/**
 * A member of the cast, standing with their feet at (x, y), at scale s, turned by yaw (0 faces camera, + turns to face
 * screen-right, PI shows their back). The hard cut-card shadow of the world, or the pink edge once they're shrunk.
 */
export const InkFig: React.FC<{ who?: InkWho; d?: Design; P: Pose3; yaw: number; x: number; y: number; s: number; id: string; mark?: boolean; pitch?: number; shadow?: boolean }> = ({ who = 'juno', d, P, yaw, x, y, s, id, mark, pitch, shadow }) => (
  <g filter={mark ? 'url(#npMarked)' : 'url(#npDrop)'}>
    <Fig3D D={d ?? INK_CAST[who]} P={P} yaw={yaw} x={x} y={y} s={s} id={id} pitch={pitch} shadow={shadow} />
  </g>
);

/** The Ink Stick scale that matches the room kit's 2D scale (what stand() and the sets are measured in). */
export const inkScale = (scale2d: number, d: Design = STICK) => (scale2d * 378) / (d.head.y + d.head.r[1] * 1.15);

/** Where to stand someone on a room's floor point (u, w): their feet, and their Ink Stick scale. */
export const inkStand = (r: Room, u: number, w: number, k?: number) => {
  const p = stand(r, u, w, k);
  return { x: p.x, y: p.y + LEG_LEN * p.scale, s: inkScale(p.scale) };
};

/** A walk: legs and arms in opposition, `phase` advancing about 0.3 a frame. The rig adds the bounce, the lean and the hair. */
export const walkInk = (phase: number, base: Pose3 = A_POSE): Pose3 => {
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

/** A vertical camera (1080 x 1920 Shorts): centre the world point (cx, cy) at zoom s. For 16:9 use the engine's camT. */
export const camV = (cx: number, cy: number, s: number) => `translate(540 960) scale(${s}) translate(${-cx} ${-cy})`;

/** One shot's frame: the print's filters, the picture, then the paper finish (vignette, mottle, halftone) on top. */
export const InkFrame: React.FC<{ children: React.ReactNode; w?: number; h?: number; dots?: number; vig?: number }> = ({ children, w = 1080, h = 1920, dots, vig }) => (
  <g>
    <PrintDefs />
    <rect x={0} y={0} width={w} height={h} fill={NP.ink} />
    {children}
    <PaperFinish dots={dots} vig={vig} w={w} h={h} />
  </g>
);
