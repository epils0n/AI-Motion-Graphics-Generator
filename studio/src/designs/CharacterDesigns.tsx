import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Design, Juno3D, Fig3D, A_POSE, POINT_POSE, HEAD_POSE, Expr3, castFor, headAt } from './juno3d';
import { NP, NP_FONT, PrintDefs, PaperFinish } from '../episodes/shrink/style';

// Five 3D directions for Juno, the same character (red hoodie, yellow drawstrings, paper-white shoes) in five builds.
// Frame 0 is the overview; frames 1-5 are one direction each: a turnaround, four expressions and the power pose.
//   npx remotion still src/index.ts Designs out/designs/overview.png --frame=0

const COL = {
  skin: '#F7E4CF',
  hood: '#E4523B',
  hoodIn: '#8C2C22',
  pants: '#A93A2B',
  shoe: '#F3E7CD',
  sole: '#FFFFFF',
  string: '#F6CF55',
  ink: '#0C171D',
  mouth: '#5A1A22',
};

export const DESIGNS: Design[] = [
  {
    key: 'toon',
    name: 'CEL 3D',
    tag: 'a 3D cartoon, painted in 3 tones',
    notes: ['Real volume, flat-painted: light, mid and shadow bands', 'Ink outline on every part, a teal bounce on the dark side', 'Closest to the 2D Juno, so the switch is gentle'],
    sh: { mode: 'toon', outline: 4.2, ink: COL.ink, rim: '#5FB3B0' },
    seg: { head: [30, 20], body: [24, 10], limb: 16 },
    head: { r: [80, 78, 74], y: 314 },
    torso: { hipY: 150, below: 14, chest: 80, rHip: 44, rChest: 52, depth: 0.72 },
    shoulder: { x: 50, y: 80 },
    arm: { upper: 64, lower: 58, r0: 15, r1: 12, hand: 17 },
    leg: { hipX: 21, upper: 74, lower: 68, r0: 19, r1: 14, foot: [19, 14, 32] },
    hood: { scale: 1.13, cut: 58 },
    eye: { kind: 'toon', lon: 0.3, lat: 0.06, w: 0.19, h: 0.27 },
    mouth: { lat: -0.36, w: 0.34 },
    col: COL,
  },
  {
    key: 'vinyl',
    name: 'VINYL TOY',
    tag: 'a glossy designer figure',
    notes: ['Big glossy head on a small body: reads at phone size', 'Plastic shine and a cool rim from the room', 'The cutest; the most "collectible"'],
    sh: { mode: 'gloss', outline: 0, ink: COL.ink, rim: '#7CC7C2' },
    seg: { head: [34, 22], body: [26, 12], limb: 18 },
    head: { r: [116, 106, 104], y: 266 },
    torso: { hipY: 78, below: 10, chest: 58, rHip: 50, rChest: 46, depth: 0.86 },
    shoulder: { x: 44, y: 54 },
    arm: { upper: 38, lower: 36, r0: 17, r1: 16, hand: 20 },
    leg: { hipX: 24, upper: 32, lower: 30, r0: 22, r1: 21, foot: [24, 17, 34] },
    hood: { scale: 1.1, cut: 56 },
    eye: { kind: 'bean', lon: 0.33, lat: -0.02, w: 0.15, h: 0.24 },
    mouth: { lat: -0.34, w: 0.26 },
    blush: true,
    col: COL,
  },
  {
    key: 'clay',
    name: 'CLAY',
    tag: 'stop-motion plasticine',
    notes: ['Matte, thumb-pressed surface with a wobbly edge', 'Chunky limbs, a nose, bead eyes', 'Warm and handmade; slower, heavier acting'],
    sh: { mode: 'clay', outline: 0, ink: COL.ink, rim: '#6AA9A6' },
    filter: 'clay',
    seg: { head: [28, 18], body: [24, 10], limb: 14 },
    head: { r: [76, 72, 72], y: 298 },
    torso: { hipY: 134, below: 18, chest: 72, rHip: 62, rChest: 50, depth: 0.84 },
    shoulder: { x: 50, y: 68 },
    arm: { upper: 56, lower: 52, r0: 21, r1: 19, hand: 24 },
    leg: { hipX: 28, upper: 62, lower: 58, r0: 25, r1: 22, foot: [25, 16, 36] },
    hood: { scale: 1.14, cut: 60 },
    eye: { kind: 'bead', lon: 0.27, lat: 0.08, w: 0.09, h: 0.12 },
    mouth: { lat: -0.42, w: 0.3 },
    nose: 13,
    blush: true,
    col: { ...COL, skin: '#F2D9C0', hood: '#DE5038' },
  },
  {
    key: 'fold',
    name: 'PAPER FOLD',
    tag: 'low-poly folded card',
    notes: ['Flat facets you could fold from card', 'Matches the Night Print world best', 'Bold and graphic; very light to render'],
    sh: { mode: 'facet', flat: true, outline: 0, ink: COL.ink, rim: '#6AA9A6', facetLine: 1.2 },
    seg: { head: [8, 6], body: [6, 3], limb: 6 },
    head: { r: [82, 86, 76], y: 318 },
    torso: { hipY: 152, below: 12, chest: 84, rHip: 38, rChest: 58, depth: 0.62 },
    shoulder: { x: 54, y: 84 },
    arm: { upper: 68, lower: 62, r0: 14, r1: 11, hand: 16 },
    leg: { hipX: 20, upper: 76, lower: 70, r0: 17, r1: 12, foot: [17, 12, 32] },
    hood: { scale: 1.12, cut: 60 },
    eye: { kind: 'paper', lon: 0.3, lat: 0.05, w: 0.15, h: 0.2 },
    mouth: { lat: -0.36, w: 0.3 },
    col: COL,
  },
  {
    key: 'plush',
    name: 'PLUSH',
    tag: 'felt, stitches, buttons',
    notes: ['Fuzzy felt, stitched seams, sewn-on button eyes', 'Soft bean body; squash and stretch come naturally', 'Cosy; a little uncanny in the turn'],
    sh: { mode: 'plush', outline: 0, ink: COL.ink, rim: '#6AA9A6' },
    filter: 'plush',
    seg: { head: [28, 18], body: [24, 10], limb: 14 },
    head: { r: [92, 84, 84], y: 290 },
    torso: { hipY: 120, below: 22, chest: 76, rHip: 64, rChest: 56, depth: 0.86 },
    shoulder: { x: 52, y: 64 },
    arm: { upper: 50, lower: 44, r0: 22, r1: 21, hand: 22 },
    leg: { hipX: 30, upper: 46, lower: 44, r0: 26, r1: 25, foot: [26, 18, 32] },
    hood: { scale: 1.12, cut: 60 },
    eye: { kind: 'button', lon: 0.33, lat: 0.04, w: 0.14, h: 0.14 },
    mouth: { lat: -0.36, w: 0.28 },
    stitches: true,
    blush: true,
    col: { ...COL, skin: '#F4E2CC' },
  },
];

/** The sixth direction: Juno drawn as a flat 2D cartoon, made to read as 3D by its painted light alone. */
export const PAINT: Design = {
  key: 'paint',
  name: 'PAINTED 2D',
  tag: 'flat 2D, lit like 3D',
  notes: ['Flat colour and a hand-weighted line: drawn, not modelled', 'Soft violet shadows, a warm bounce, a thin teal rim', 'Each part throws a crisp shadow on the one behind'],
  sh: { mode: 'paint', outline: 5, ink: COL.ink, rim: '#8FE3DA', cast: 9 },
  seg: { head: [36, 24], body: [28, 12], limb: 18 },
  head: { r: [80, 78, 74], y: 314 },
  torso: { hipY: 150, below: 14, chest: 80, rHip: 44, rChest: 52, depth: 0.72 },
  shoulder: { x: 50, y: 80 },
  arm: { upper: 64, lower: 58, r0: 15, r1: 12, hand: 17 },
  leg: { hipX: 21, upper: 74, lower: 68, r0: 19, r1: 14, foot: [19, 14, 32] },
  hood: { scale: 1.13, cut: 58 },
  eye: { kind: 'toon', lon: 0.3, lat: 0.06, w: 0.19, h: 0.27 },
  mouth: { lat: -0.36, w: 0.34 },
  blush: true,
  col: COL,
};
/** The seventh: no 3D at all. Stick figures cut from the sets' own ink and paper, told apart by size, hair and eyes. */
export const STICK: Design = {
  ...PAINT,
  key: 'stick',
  name: 'INK STICK',
  tag: 'cut from the same ink as the world',
  notes: ['One flat black silhouette, paper-white eyes', 'Told apart by size, hair, eyes and one shape each', 'Bendy limbs, trailing hair, breathing, blinks'],
  stick: { who: 'juno' },
};
/** The directions after the five-up overview, each with a detail page and a cast page. */
export const EXTRA_DESIGNS: Design[] = [PAINT, STICK];
/** Every direction. */
export const ALL_DESIGNS: Design[] = [...DESIGNS, ...EXTRA_DESIGNS];

// ---------------------------------------------------------------- the stage: a pool of lamp light in the dark
const Stage: React.FC<{ x: number; y: number; w: number; top: number; id: string }> = ({ x, y, w, top, id }) => (
  <g>
    <defs>
      <radialGradient id={`${id}pool`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={NP.paper} stopOpacity={0.34} />
        <stop offset="100%" stopColor={NP.paper} stopOpacity={0} />
      </radialGradient>
      <linearGradient id={`${id}cone`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={NP.paper} stopOpacity={0.16} />
        <stop offset="100%" stopColor={NP.paper} stopOpacity={0.02} />
      </linearGradient>
    </defs>
    <path d={`M ${x - 26} ${top} L ${x + 26} ${top} L ${x + w * 0.55} ${y} L ${x - w * 0.55} ${y} Z`} fill={`url(#${id}cone)`} />
    <ellipse cx={x} cy={y} rx={w * 0.55} ry={w * 0.11} fill={`url(#${id}pool)`} />
  </g>
);

const Label: React.FC<{ x: number; y: number; n: number; d: Design; size?: number; anchor?: 'middle' | 'start' }> = ({ x, y, n, d, size = 46, anchor = 'middle' }) => (
  <g>
    <text x={x} y={y} textAnchor={anchor} fontFamily={NP_FONT.title} fontSize={size} fill={NP.paper} letterSpacing={size * 0.02}>
      <tspan fill={NP.pink}>{`0${n} `}</tspan>
      {d.name}
    </text>
    <text x={x} y={y + size * 0.72} textAnchor={anchor} fontFamily={NP_FONT.ui} fontWeight={400} fontSize={size * 0.38} fill={NP.mist} letterSpacing={1}>
      {d.tag}
    </text>
  </g>
);

const Backdrop: React.FC = () => (
  <g>
    <rect x={0} y={0} width={1920} height={1080} fill={NP.ink} />
    <rect x={0} y={0} width={1920} height={1080} fill={NP.deep} opacity={0.35} />
  </g>
);

// ---------------------------------------------------------------- frame 0: the overview
const Overview: React.FC = () => (
  <g>
    <Backdrop />
    <text x={70} y={92} fontFamily={NP_FONT.title} fontSize={64} fill={NP.paper} letterSpacing={1.5}>
      JUNO IN 3D <tspan fill={NP.pink}>·</tspan> FIVE DIRECTIONS
    </text>
    <text x={72} y={128} fontFamily={NP_FONT.ui} fontSize={22} fill={NP.mist} letterSpacing={2}>
      SAME CHARACTER, SAME SKELETON, FIVE BUILDS · THE POWER POSE, THEN FRONT, SIDE AND BACK
    </text>
    {DESIGNS.map((d, i) => {
      const cx = 192 + i * 384;
      return (
        <g key={d.key}>
          {i > 0 ? <line x1={cx - 192} y1={170} x2={cx - 192} y2={1040} stroke={NP.teal} strokeWidth={1.5} opacity={0.5} /> : null}
          <Label x={cx} y={214} n={i + 1} d={d} size={42} />
          <Stage x={cx} y={782} w={320} top={262} id={`ov${i}`} />
          <Fig3D D={d} P={POINT_POSE} yaw={0.42} x={cx - 24} y={782} s={1.08} id={`ov${i}h`} />
          {[0, Math.PI / 2, Math.PI].map((yaw, k) => (
            <Fig3D key={k} D={d} P={A_POSE} yaw={yaw} x={cx - 112 + k * 112} y={1000} s={0.38} q={0.6} id={`ov${i}m${k}`} />
          ))}
          {['FRONT', 'SIDE', 'BACK'].map((t, k) => (
            <text key={t} x={cx - 112 + k * 112} y={1034} textAnchor="middle" fontFamily={NP_FONT.ui} fontSize={15} fill={NP.mist} letterSpacing={2} opacity={0.8}>
              {t}
            </text>
          ))}
        </g>
      );
    })}
  </g>
);

// ---------------------------------------------------------------- frames 1-5: one direction
const EXPRS: Expr3[] = ['neutral', 'happy', 'shock', 'smug'];
const Detail: React.FC<{ i: number }> = ({ i }) => {
  const d = ALL_DESIGNS[i];
  const views = [0, 0.7, Math.PI / 2, 2.35, Math.PI];
  const names = ['FRONT', '3/4', 'SIDE', '3/4 BACK', 'BACK'];
  return (
    <g>
      <Backdrop />
      <Label x={70} y={96} n={i + 1} d={d} size={62} anchor="start" />
      {/* the turnaround */}
      {views.map((yaw, k) => (
        <g key={k}>
          <Stage x={175 + k * 245} y={630} w={250} top={170} id={`dt${k}`} />
          <Fig3D D={d} P={A_POSE} yaw={yaw} x={175 + k * 245} y={630} s={0.98} id={`dt${k}j`} />
          <text x={175 + k * 245} y={668} textAnchor="middle" fontFamily={NP_FONT.ui} fontSize={17} fill={NP.mist} letterSpacing={2}>
            {names[k]}
          </text>
        </g>
      ))}
      {/* four expressions, close up */}
      {EXPRS.map((e, k) => {
        const x0 = 70 + k * 310;
        const y0 = 700;
        const w = 290;
        const h = 320;
        const s = (1.55 * 80) / d.head.r[0];
        const P = HEAD_POSE(e);
        const hc = headAt(d, P, 0.32, 0, 0, s);
        const x = x0 + w / 2 - hc.x;
        const y = y0 + h * 0.5 - hc.y;
        return (
          <g key={e}>
            <defs>
              <clipPath id={`dx${k}`}>
                <rect x={x0} y={y0} width={w} height={h} rx={14} />
              </clipPath>
            </defs>
            <rect x={x0} y={y0} width={w} height={h} rx={14} fill={NP.deep} opacity={0.7} />
            <g clipPath={`url(#dx${k})`}>
              <circle cx={x0 + w * 0.62} cy={y0 + h * 0.32} r={220} fill={NP.paper} opacity={0.06} />
              <Fig3D D={d} P={P} yaw={0.32} x={x} y={y} s={s} id={`dx${k}j`} shadow={false} />
            </g>
            <rect x={x0} y={y0} width={w} height={h} rx={14} fill="none" stroke={NP.teal} strokeWidth={2} />
            <text x={x0 + 16} y={y0 + h - 16} fontFamily={NP_FONT.ui} fontWeight={500} fontSize={18} fill={NP.paper} letterSpacing={3}>
              {e.toUpperCase()}
            </text>
          </g>
        );
      })}
      {/* the power pose, big, with its notes */}
      <line x1={1300} y1={60} x2={1300} y2={1030} stroke={NP.teal} strokeWidth={1.5} opacity={0.5} />
      {d.notes.map((n, k) => (
        <text key={k} x={1330} y={96 + k * 30} fontFamily={NP_FONT.ui} fontSize={16} fill={NP.mist}>
          <tspan fill={NP.pink}>{'· '}</tspan>
          {n}
        </text>
      ))}
      <Stage x={1590} y={1000} w={420} top={230} id="dp" />
      <Fig3D D={d} P={POINT_POSE} yaw={0.42} x={1560} y={1000} s={1.45} id="dpj" />
      <text x={1340} y={1046} fontFamily={NP_FONT.ui} fontSize={17} fill={NP.mist} letterSpacing={2}>
        POWER POSE
      </text>
    </g>
  );
};


// ---------------------------------------------------------------- frame 6: the cast in the three chosen styles
export const CHOSEN = ['toon', 'fold', 'plush'];
const Lineup: React.FC<{ keys?: string[] }> = ({ keys = CHOSEN }) => (
  <g>
    <Backdrop />
    <text x={70} y={92} fontFamily={NP_FONT.title} fontSize={60} fill={NP.paper}>
      THE CAST <tspan fill={NP.pink}>·</tspan> JUNO, BEA AND THE SUIT
    </text>
    {keys.map((key, i) => {
      const d = ALL_DESIGNS.find((x) => x.key === key)!;
      const cx = keys.length === 1 ? 960 : 330 + i * 630;
      return (
        <g key={key}>
          <Label x={cx} y={170} n={ALL_DESIGNS.indexOf(d) + 1} d={d} size={40} />
          <Stage x={cx} y={940} w={560} top={230} id={`ln${i}`} />
          <Fig3D D={castFor(d, 'suit')} P={{ ...A_POSE, expr: 'stern' }} yaw={0.35} x={cx - 170} y={940} s={1.05} id={`ln${i}s`} />
          <Fig3D D={d} P={{ ...A_POSE, expr: 'happy' }} yaw={0.25} x={cx + 20} y={940} s={1.05} id={`ln${i}j`} />
          <Fig3D D={castFor(d, 'bea')} P={{ ...A_POSE, expr: 'smug', look: [-0.6, 0] }} yaw={-0.3} x={cx + 190} y={940} s={1.05} id={`ln${i}b`} />
        </g>
      );
    })}
  </g>
);

// ---------------------------------------------------------------- the last frame: the Ink Stick model sheet
const SHEET_EXPRS: Expr3[] = ['neutral', 'happy', 'shock', 'smug', 'worried', 'stern'];
const SHEET_ROWS: { who: 'juno' | 'bea' | 'suit'; name: string; size: string; lines: string[] }[] = [
  { who: 'juno', name: 'JUNO', size: 'HEIGHT 1.0', lines: ['the kid with the power', 'spiky crown, round eyes', 'hood + paper drawstrings'] },
  { who: 'bea', name: 'BEA', size: 'HEIGHT 0.7', lines: ['his little sister', 'bunches tied in paper', 'big lashed eyes, A-line dress'] },
  { who: 'suit', name: 'THE SUIT', size: 'HEIGHT 1.15', lines: ['the man from the lab', 'combed flat, glasses', 'square shoulders, shirt + tie'] },
];
const ModelSheet: React.FC = () => (
  <g>
    <Backdrop />
    <text x={70} y={84} fontFamily={NP_FONT.title} fontSize={54} fill={NP.paper} letterSpacing={1}>
      INK STICK <tspan fill={NP.pink}>·</tspan> MODEL SHEET
    </text>
    <text x={72} y={116} fontFamily={NP_FONT.ui} fontSize={19} fill={NP.mist} letterSpacing={2}>
      ONE FLAT INK SILHOUETTE EACH · PAPER EYES · PAPER EDGE ON THE LIT SIDE · TOLD APART BY SIZE, HAIR AND EYES
    </text>
    {['FRONT', '3/4', 'SIDE', 'BACK'].map((t, k) => (
      <text key={t} x={400 + k * 160} y={160} textAnchor="middle" fontFamily={NP_FONT.ui} fontSize={15} fill={NP.mist} letterSpacing={2}>
        {t}
      </text>
    ))}
    {SHEET_EXPRS.map((e, k) => (
      <text key={e} x={1052 + k * 141 + 67} y={160} textAnchor="middle" fontFamily={NP_FONT.ui} fontSize={15} fill={NP.mist} letterSpacing={2}>
        {e.toUpperCase()}
      </text>
    ))}
    {SHEET_ROWS.map((r, i) => {
      const d = r.who === 'juno' ? STICK : castFor(STICK, r.who);
      const y0 = 176 + i * 300;
      const ground = y0 + 262;
      const tall = d.head.y + d.head.r[1] * 1.45;
      const s = 230 / tall;
      const R = d.head.r[0] * 1.06;
      return (
        <g key={r.who}>
          {i > 0 ? <line x1={70} y1={y0 - 8} x2={1850} y2={y0 - 8} stroke={NP.teal} strokeWidth={1.5} opacity={0.45} /> : null}
          <text x={70} y={y0 + 52} fontFamily={NP_FONT.title} fontSize={44} fill={NP.paper}>
            {r.name}
          </text>
          <text x={72} y={y0 + 82} fontFamily={NP_FONT.ui} fontWeight={500} fontSize={16} fill={NP.pink} letterSpacing={2}>
            {r.size}
          </text>
          {r.lines.map((l, k) => (
            <text key={k} x={72} y={y0 + 116 + k * 26} fontFamily={NP_FONT.ui} fontSize={16} fill={NP.mist}>
              {l}
            </text>
          ))}
          <line x1={320} y1={ground + 4} x2={960} y2={ground + 4} stroke={NP.teal} strokeWidth={2} opacity={0.5} />
          {[0, 0.7, Math.PI / 2, Math.PI].map((yaw, k) => (
            <Fig3D key={k} D={d} P={{ ...A_POSE, expr: r.who === 'suit' ? 'stern' : 'neutral' }} yaw={yaw} x={400 + k * 160} y={ground} s={s} id={`ms${i}${k}`} />
          ))}
          {SHEET_EXPRS.map((e, k) => {
            const x0 = 1052 + k * 141;
            const w = 134;
            const h = 262;
            const hs = 64 / R;
            const P = HEAD_POSE(e);
            const hc = headAt(d, P, 0.25, 0, 0, hs);
            return (
              <g key={e}>
                <defs>
                  <clipPath id={`msx${i}${k}`}>
                    <rect x={x0} y={y0} width={w} height={h} rx={12} />
                  </clipPath>
                </defs>
                <rect x={x0} y={y0} width={w} height={h} rx={12} fill={NP.deep} opacity={0.7} />
                <g clipPath={`url(#msx${i}${k})`}>
                  <Fig3D D={d} P={P} yaw={0.25} x={x0 + w / 2 - hc.x} y={y0 + h * 0.47 - hc.y} s={hs} id={`msx${i}${k}j`} shadow={false} />
                </g>
                <rect x={x0} y={y0} width={w} height={h} rx={12} fill="none" stroke={NP.teal} strokeWidth={2} />
              </g>
            );
          })}
        </g>
      );
    })}
  </g>
);

export const CharacterDesigns: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: NP.ink }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <PrintDefs />
        {f === DESIGN_FRAMES - 1 ? <ModelSheet /> : f === 0 ? <Overview /> : f <= DESIGNS.length ? <Detail i={f - 1} /> : f === DESIGNS.length + 1 ? <Lineup /> : (f - DESIGNS.length) % 2 === 0 ? <Detail i={DESIGNS.length + (f - DESIGNS.length - 2) / 2} /> : <Lineup keys={[EXTRA_DESIGNS[(f - DESIGNS.length - 3) / 2].key]} />}
        <PaperFinish dots={0.04} vig={0.4} />
      </svg>
    </AbsoluteFill>
  );
};
// frames 7 and 8: the painted direction and its cast; 9 and 10: ink stick
// and the last frame (11): the Ink Stick model sheet
export const DESIGN_FRAMES = DESIGNS.length + 2 + 2 * EXTRA_DESIGNS.length + 1;
