import React from 'react';
import { loadFont as loadAnton } from '@remotion/google-fonts/Anton';
import { loadFont as loadDMMono } from '@remotion/google-fonts/DMMono';
import { loadFont as loadCaveat } from '@remotion/google-fonts/Caveat';
import { Look, clamp, easeOut, backOut, lerp, settle, rnd } from '../../engine';

// NIGHT PRINT: the shrink episode's own art style.
//
// Drawn from the two reference films (flat vector rooms, pools of light in the dark, small mono readouts) and turned
// into something new: a two-colour risograph print.
//   1. The world is printed in two inks: every set goes through a gradient map, ink-teal in the shadows to warm paper
//      in the light. The lamps and windows still light the rooms, but as paper showing through the ink.
//   2. The cast is printed on top in full colour, cut out of card: a hard offset shadow on the side away from the
//      light and a thin paper edge on the lit side, so they always lift off the page.
//   3. One spot colour for the power: fluorescent pink. Only the shrink is pink (the calipers, the readout, the ghost
//      trails), so the eye goes straight to it.
//   4. A paper finish on top of everything: a soft mottle and a fine halftone screen.
// Titles are tall and condensed (Anton), readouts are a clean mono (DM Mono), notes are a quick hand (Caveat).

loadAnton('normal', { weights: ['400'], subsets: ['latin'] });
loadDMMono('normal', { weights: ['400', '500'], subsets: ['latin'] });
loadCaveat('normal', { weights: ['600', '700'], subsets: ['latin'] });

export const NP_FONT = { title: 'Anton', ui: 'DM Mono', hand: 'Caveat' };

/** The two inks, the paper, and the spot colour. */
export const NP = {
  ink: '#0A161D',
  deep: '#163A44',
  teal: '#2F6A6F',
  mist: '#9CC0B3',
  paper: '#F3E7CD',
  pink: '#FF4FA3',
  pinkDeep: '#C42A78',
  pinkGlow: '#FF8CC6',
};

// The gradient map: luminance to ink, deep, teal, mist, paper (five even stops). Gamma lifts the dark rooms a touch
// first so the walls sit in the deep teal rather than in black.
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const STOPS = [NP.ink, NP.deep, NP.teal, NP.mist, NP.paper].map(hex);
const table = (ch: number) => STOPS.map((s) => s[ch].toFixed(3)).join(' ');

/** The cast for this style: same rig, new costumes. Juno is "you"; Bea is the little sister (draw her at 0.7). */
export const NP_LOOKS: Record<'juno' | 'bea', Look> = {
  // a tomato-red tracksuit hoodie, yellow drawstrings, paper-white shoes: warm against the teal world
  juno: { skin: '#FBF2E2', skinShade: '#E9D9C0', hand: '#FBF2E2', jacket: '#E4523B', jacketShade: '#BF3F2C', accent: '#F6CF55', limb: '#D24A35', line: '#0C171D', shoe: '#F3E7CD', face: '#0C171D', hair: '#0C171D', extra: 'hood' },
  // a mustard pinafore over a paper-white top, red bands in her bunches
  bea: { skin: '#FBF2E2', skinShade: '#E9D9C0', hand: '#FBF2E2', jacket: '#F0B53A', jacketShade: '#CC9227', accent: '#E4523B', limb: '#F3E7CD', line: '#0C171D', shoe: '#E4523B', face: '#0C171D', hair: '#3A2620', extra: 'bunches' },
};

/** Filters and patterns for the style. Put <PrintDefs /> once at the top of every shot. */
export const PrintDefs: React.FC = () => (
  <defs>
    <filter id="npPrint" filterUnits="userSpaceOnUse" x={-4000} y={-4000} width={10000} height={10000} colorInterpolationFilters="sRGB">
      <feComponentTransfer>
        <feFuncR type="gamma" exponent={0.78} />
        <feFuncG type="gamma" exponent={0.78} />
        <feFuncB type="gamma" exponent={0.78} />
      </feComponentTransfer>
      <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0" />
      <feComponentTransfer>
        <feFuncR type="table" tableValues={table(0)} />
        <feFuncG type="table" tableValues={table(1)} />
        <feFuncB type="table" tableValues={table(2)} />
      </feComponentTransfer>
    </filter>
    {/* cut card: a paper edge on the lit side, a hard ink shadow on the other (R: light from the right) */}
    <filter id="npCutR" x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
      <feDropShadow dx={3.5} dy={-1.5} stdDeviation={0.6} floodColor={NP.paper} floodOpacity={0.95} />
      <feDropShadow dx={-10} dy={9} stdDeviation={0} floodColor={NP.ink} floodOpacity={0.55} />
    </filter>
    <filter id="npCutL" x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
      <feDropShadow dx={-3.5} dy={-1.5} stdDeviation={0.6} floodColor={NP.paper} floodOpacity={0.95} />
      <feDropShadow dx={10} dy={9} stdDeviation={0} floodColor={NP.ink} floodOpacity={0.55} />
    </filter>
    {/* the same cut for close-ups, where the rig is drawn at 4 to 7 times its size (offsets scale with it) */}
    <filter id="npCutRs" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
      <feDropShadow dx={0.9} dy={-0.4} stdDeviation={0.25} floodColor={NP.paper} floodOpacity={0.95} />
      <feDropShadow dx={-2.2} dy={2} stdDeviation={0} floodColor={NP.ink} floodOpacity={0.5} />
    </filter>
    <filter id="npCutLs" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
      <feDropShadow dx={-0.9} dy={-0.4} stdDeviation={0.25} floodColor={NP.paper} floodOpacity={0.95} />
      <feDropShadow dx={2.2} dy={2} stdDeviation={0} floodColor={NP.ink} floodOpacity={0.5} />
    </filter>
    <filter id="npCutPinkS" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
      <feDropShadow dx={0} dy={-0.5} stdDeviation={0.3} floodColor={NP.pink} floodOpacity={1} />
      <feDropShadow dx={0} dy={0} stdDeviation={2.2} floodColor={NP.pink} floodOpacity={0.45} />
      <feDropShadow dx={-2.2} dy={2} stdDeviation={0} floodColor={NP.ink} floodOpacity={0.5} />
    </filter>
    {/* the 3D cast's cut-card shadow: a hard ink offset behind the figure, as the 2D cast had */}
    <filter id="npDrop" x="-30%" y="-20%" width="160%" height="140%" colorInterpolationFilters="sRGB">
      <feDropShadow dx={-9} dy={8} stdDeviation={0} floodColor={NP.ink} floodOpacity={0.42} />
    </filter>
    {/* the turn: the paper edge goes pink */}
    <filter id="npCutPink" x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
      <feDropShadow dx={0} dy={-2} stdDeviation={1} floodColor={NP.pink} floodOpacity={1} />
      <feDropShadow dx={-10} dy={9} stdDeviation={0} floodColor={NP.ink} floodOpacity={0.6} />
    </filter>
    {/* the spot colour glows a little, like fluorescent ink */}
    <filter id="npGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation={7} result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    {/* marked: anything the power has shrunk keeps a thin glowing pink edge, so a tiny thing still reads */}
    <filter id="npMarked" x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius={2.2} result="d" />
      <feFlood floodColor={NP.pink} />
      <feComposite in2="d" operator="in" result="o" />
      <feGaussianBlur in="o" stdDeviation={3} result="g" />
      <feMerge>
        <feMergeNode in="g" />
        <feMergeNode in="o" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    {/* a ghost trail: anything drawn through it becomes a flat pink silhouette */}
    <filter id="npGhost" x="-20%" y="-20%" width="140%" height="140%">
      <feFlood floodColor={NP.pink} result="c" />
      <feComposite in="c" in2="SourceAlpha" operator="in" />
    </filter>
    <filter id="npPaper" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035 0.05" numOctaves={2} seed={11} />
      <feColorMatrix type="matrix" values="0 0 0 0 0.95  0 0 0 0 0.9  0 0 0 0 0.8  0 0 0 0.12 -0.035" />
    </filter>
    <radialGradient id="npVig" cx="50%" cy="50%" r="75%">
      <stop offset="55%" stopColor={NP.ink} stopOpacity={0} />
      <stop offset="100%" stopColor={NP.ink} stopOpacity={1} />
    </radialGradient>
    <pattern id="npDots" width={7} height={7} patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
      <circle cx={3.5} cy={3.5} r={1.25} fill={NP.ink} />
    </pattern>
  </defs>
);

/** Prints whatever it wraps in the two inks (the sets, the furniture, anything that isn't cast or power). */
export const Print: React.FC<{ children: React.ReactNode }> = ({ children }) => <g filter="url(#npPrint)">{children}</g>;

/** The paper finish over the whole frame (screen space): a mottle and a fine halftone screen. Draw it last. */
export const PaperFinish: React.FC<{ dots?: number; mottle?: number; vig?: number; w?: number; h?: number }> = ({ dots = 0.07, mottle = 1, vig = 0.55, w = 1920, h = 1080 }) => (
  <g pointerEvents="none">
    {/* the vignette lives here, per shot (the episode's own is off): soft on the paper lab sheet, deeper in the rooms */}
    <rect x={0} y={0} width={w} height={h} fill="url(#npVig)" opacity={vig} />
    <rect x={0} y={0} width={w} height={h} filter="url(#npPaper)" opacity={mottle} />
    <rect x={0} y={0} width={w} height={h} fill="url(#npDots)" opacity={dots} style={{ mixBlendMode: 'multiply' }} />
  </g>
);

/** How small a thing is at shot time t: 1 until `at`, then down to `to` over `dur` frames with a squash and a settle. */
export const shrinkAt = (t: number, at: number, to: number, dur = 8) => {
  const p = easeOut(clamp((t - at) / dur));
  return lerp(1, to, p);
};

/**
 * Wraps anything that shrinks. It scales about its anchor (the point it stands on: ax, ay) to `s`, squashing on the
 * way (it narrows first, then drops) and wobbling as it settles; pink ghosts of its old size trail behind while it
 * moves. `t` is frames since the shrink started.
 */
export const Squeeze: React.FC<{ ax: number; ay: number; s: number; t: number; dur?: number; children: React.ReactNode; ghosts?: boolean }> = ({ ax, ay, s, t, dur = 8, children, ghosts = true }) => {
  const moving = t > 0 && t < dur + 6;
  const wob = settle(t - dur, 0.08, 1.7, 3.5);
  const sx = s * (1 - (t > 0 && t < dur ? 0.12 * Math.sin((t / dur) * Math.PI) : 0) + wob);
  const sy = s * (1 + (t > 0 && t < dur ? 0.05 * Math.sin((t / dur) * Math.PI) : 0) - wob);
  const tf = (x: number, y: number) => `translate(${ax} ${ay}) scale(${x} ${y}) translate(${-ax} ${-ay})`;
  const trail = moving && ghosts ? [0.25, 0.55].map((k) => lerp(1, s, clamp((t - 1 - k * 3) / dur) ** 0.6 * (1 - k) + k * clamp(t / dur))) : [];
  return (
    <g>
      {trail.map((g, i) => (
        <g key={i} transform={tf(g, g)} filter="url(#npGhost)" opacity={0.28 - i * 0.1}>
          {children}
        </g>
      ))}
      <g transform={tf(sx, sy)} filter={t >= dur * 0.6 ? 'url(#npMarked)' : undefined}>
        {children}
      </g>
    </g>
  );
};

/** Gives a shrunk thing its pink edge outside a Squeeze (in later shots: the toy couch, tiny Bea). */
export const Marked: React.FC<{ children: React.ReactNode }> = ({ children }) => <g filter="url(#npMarked)">{children}</g>;

/**
 * The power's mark: two caliper jaws on a ruler, clamping a thing. Jaws sit at x0..x1 (screen or world units) over a
 * thing standing on y; `p` 0..1 is how far the clamp has closed toward the centre (match it to the shrink), `on` 0..1
 * draws it in. The readout shows the scale.
 */
export const Caliper: React.FC<{ x0: number; x1: number; y0: number; y1: number; on: number; p?: number; to?: number; label?: string; k?: number }> = ({ x0, x1, y0, y1, on, p = 0, to = 0.05, label, k = 1 }) => {
  if (on <= 0) return null;
  const cx = (x0 + x1) / 2;
  const w = (x1 - x0) * lerp(1, to, p);
  const a = cx - w / 2;
  const b = cx + w / 2;
  const top = y0 - 46 * k;
  const reveal = easeOut(clamp(on));
  const scale = lerp(1, to, p);
  const read = label ?? `×${scale.toFixed(2)}`;
  const ticks = Math.max(6, Math.round((x1 - x0) / (26 * k)));
  return (
    <g opacity={reveal} filter="url(#npGlow)" stroke={NP.pink} fill="none" strokeLinecap="round">
      {/* the ruler bar along the top, ticks every step, the jaws hanging from it */}
      <line x1={x0 - 30 * k} y1={top} x2={x0 - 30 * k + (x1 - x0 + 60 * k) * reveal} y2={top} strokeWidth={4 * k} />
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const x = x0 + ((x1 - x0) * i) / ticks;
        return x <= x0 - 30 * k + (x1 - x0 + 60 * k) * reveal ? <line key={i} x1={x} y1={top} x2={x} y2={top + (i % 5 === 0 ? 18 : 10) * k} strokeWidth={2.5 * k} /> : null;
      })}
      <path d={`M ${a} ${top} L ${a} ${y1} M ${a} ${y1} L ${a + 26 * k} ${y1}`} strokeWidth={6 * k} />
      <path d={`M ${b} ${top} L ${b} ${y1} M ${b} ${y1} L ${b - 26 * k} ${y1}`} strokeWidth={6 * k} />
      {/* the readout in a pill above the ruler */}
      <g transform={`translate(${cx} ${top - 44 * k}) scale(${k})`}>
        <rect x={-Math.max(92, read.length * 11 + 30)} y={-30} width={2 * Math.max(92, read.length * 11 + 30)} height={56} rx={28} fill={NP.ink} stroke={NP.pink} strokeWidth={3} opacity={0.92} />
        <text y={12} textAnchor="middle" fontFamily={NP_FONT.ui} fontWeight={500} fontSize={34} fill={NP.pink} stroke="none" letterSpacing={2}>
          {read}
        </text>
      </g>
    </g>
  );
};

/** A specimen tag on a string (paper card, mono text): names a thing and its size. Pops in at t = 0. */
export const SpecimenTag: React.FC<{ x: number; y: number; t: number; lines: string[]; rot?: number; s?: number; pink?: boolean }> = ({ x, y, t, lines, rot = -6, s = 1, pink }) => {
  if (t < 0) return null;
  const k = backOut(clamp(t / 6));
  const sw = settle(t - 6, 3, 1.2, 6);
  const w = 58 + Math.max(...lines.map((l) => l.length)) * 19; // room for the punched hole after the text
  const h = 26 + lines.length * 38;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + sw}) scale(${k * s})`}>
      <rect x={4} y={6} width={w} height={h} rx={6} fill={NP.ink} opacity={0.5} />
      <path d={`M 0 0 L ${w - 26} 0 L ${w} ${h / 2} L ${w - 26} ${h} L 0 ${h} Z`} fill={NP.paper} />
      <circle cx={w - 30} cy={h / 2} r={7} fill={NP.ink} opacity={0.7} />
      {lines.map((l, i) => (
        <text key={i} x={18} y={44 + i * 38} fontFamily={NP_FONT.ui} fontWeight={i === 0 ? 500 : 400} fontSize={30} fill={i === lines.length - 1 && pink ? NP.pinkDeep : NP.ink} letterSpacing={1}>
          {l}
        </text>
      ))}
    </g>
  );
};

/**
 * The title card: a small mono line, then the premise huge in Anton, printed in paper with a pink plate slightly out
 * of register behind it (the riso tell). The accent word prints pink. Letters drop in one by one from t = 0.
 */
export const NPTitle: React.FC<{ t: number; lines: [string, string]; accent?: string; y?: number; size?: number; x?: number }> = ({ t, lines, accent, y = 300, size = 210, x = 960 }) => {
  if (t < 0) return null;
  const l1 = clamp(t / 6);
  const words = lines[1].split(' ');
  let n = 0;
  const off = 7 + 3 * Math.sin(t / 5);
  return (
    <g>
      <text x={x} y={y - size * 1.04} textAnchor="middle" fontFamily={NP_FONT.ui} fontWeight={500} fontSize={size * 0.2} fill={NP.paper} letterSpacing={size * 0.06} opacity={l1}>
        {lines[0]}
      </text>
      {[0, 1].map((plate) => (
        <text
          key={plate}
          x={x + (plate === 0 ? -off : 0)}
          y={y + (plate === 0 ? off * 0.6 : 0)}
          textAnchor="middle"
          fontFamily={NP_FONT.title}
          fontSize={size}
          letterSpacing={size * 0.01}
          fill={plate === 0 ? NP.pink : NP.paper}
          opacity={plate === 0 ? 0.85 : 1}
          style={plate === 0 ? { mixBlendMode: 'screen' } : undefined}
        >
          {words.map((w, wi) => {
            const chars = (wi > 0 ? ' ' : '') + w;
            return (
              <tspan key={wi} fill={plate === 1 && accent && w.replace(/[^A-Z0-9]/g, '') === accent ? NP.pink : undefined}>
                {chars.split('').map((ch, ci) => {
                  const at = 3 + n++ * 1.1;
                  const k = clamp((t - at) / 4);
                  return (
                    <tspan key={ci} opacity={k} dy={0}>
                      {ch}
                    </tspan>
                  );
                })}
              </tspan>
            );
          })}
        </text>
      ))}
    </g>
  );
};

/** A note in the hand face with an underline drawn on (a quick annotation on a schematic or an insert). */
export const HandNote: React.FC<{ x: number; y: number; t: number; text: string; size?: number; color?: string; rot?: number; anchor?: 'start' | 'middle' | 'end' }> = ({ x, y, t, text, size = 64, color = NP.paper, rot = -3, anchor = 'middle' }) => {
  if (t < 0) return null;
  const k = clamp(t / 5);
  const u = clamp((t - 4) / 6);
  const w = text.length * size * 0.42;
  const x0 = anchor === 'middle' ? -w / 2 : anchor === 'end' ? -w : 0;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={k}>
      <text textAnchor={anchor} fontFamily={NP_FONT.hand} fontWeight={700} fontSize={size} fill={color}>
        {text}
      </text>
      <path d={`M ${x0} ${size * 0.22} Q ${x0 + w / 2} ${size * 0.32} ${x0 + w * u} ${size * 0.18}`} stroke={color} strokeWidth={size * 0.07} fill="none" strokeLinecap="round" />
    </g>
  );
};

/** Floor cracks spreading out from a point (the ending): `p` 0..1 grows them, `seed` varies the pattern. */
export const Cracks: React.FC<{ x: number; y: number; p: number; r?: number; seed?: number; squashY?: number; color?: string }> = ({ x, y, p, r = 300, seed = 3, squashY = 0.32, color = NP.ink }) => {
  if (p <= 0) return null;
  const arms = 9;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < arms; i++) {
    const a0 = (i / arms) * Math.PI * 2 + rnd(seed, i) * 0.5;
    const len = r * (0.55 + rnd(seed, i + 20) * 0.45) * easeOut(clamp(p * 1.3 - rnd(seed, i + 40) * 0.3));
    if (len <= 2) continue;
    let px = 0;
    let py = 0;
    let d = 'M 0 0';
    const segs = 5;
    for (let s = 1; s <= segs; s++) {
      const a = a0 + (rnd(seed + s, i) - 0.5) * 0.7;
      px += Math.cos(a) * (len / segs);
      py += Math.sin(a) * (len / segs);
      d += ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
    }
    out.push(<path key={i} d={d} stroke={color} strokeWidth={7 - (i % 3) * 1.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />);
  }
  return <g transform={`translate(${x} ${y}) scale(1 ${squashY})`}>{out}</g>;
};
