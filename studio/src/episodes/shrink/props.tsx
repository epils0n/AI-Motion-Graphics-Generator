import React from 'react';
import { clamp, lerp, rnd } from '../../engine';
import { NP, NP_FONT } from './style';

// Props for the shrink episode. Most of them print in the two inks (draw them inside <Print>), so what matters is
// their value: light faces toward the light, a darker side, a dark outline, stripes and seams that survive the print.

const LINE = '#151A20';

// ---------- the clothes heap ----------
/** A heap of clothes, bottom centre at (x, y), `w` wide: shirts, a striped jumper, socks, a sleeve hanging over. */
export const ClothesHeap: React.FC<{ x: number; y: number; w: number; seed?: number }> = ({ x, y, w, seed = 2 }) => {
  const k = w / 300;
  const pieces = [
    { dx: -95, dy: -40, rx: 70, ry: 42, c: '#B9C3C6', stripes: 0, r: -12 },
    { dx: 70, dy: -44, rx: 82, ry: 46, c: '#8E6A72', stripes: 0, r: 10 },
    { dx: -20, dy: -78, rx: 96, ry: 50, c: '#D9D2C2', stripes: 5, r: -4 },
    { dx: 40, dy: -120, rx: 72, ry: 40, c: '#5E7486', stripes: 0, r: 14 },
    { dx: -60, dy: -128, rx: 60, ry: 34, c: '#E8C77A', stripes: 3, r: -18 },
    { dx: 10, dy: -160, rx: 50, ry: 28, c: '#C8CED2', stripes: 0, r: 6 },
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <ellipse cx={0} cy={-6} rx={150} ry={22} fill="#000" opacity={0.25} />
      {/* a sleeve and a sock hanging over the front */}
      <path d="M -120 -40 Q -160 -10 -150 40 L -118 44 Q -122 0 -92 -30 Z" fill="#B9C3C6" stroke={LINE} strokeWidth={5} strokeLinejoin="round" />
      <path d="M 110 -30 Q 130 0 120 30 L 150 34 L 154 18 L 136 14 Q 140 -10 132 -34 Z" fill="#E8C77A" stroke={LINE} strokeWidth={5} strokeLinejoin="round" />
      {pieces.map((p, i) => (
        <g key={i} transform={`translate(${p.dx} ${p.dy}) rotate(${p.r + (rnd(seed, i) - 0.5) * 6})`}>
          <ellipse rx={p.rx} ry={p.ry} fill={p.c} stroke={LINE} strokeWidth={5} />
          {Array.from({ length: p.stripes }).map((_, s) => (
            <path key={s} d={`M ${-p.rx * 0.8} ${-p.ry * 0.6 + (s * p.ry * 1.2) / Math.max(1, p.stripes - 1)} q ${p.rx * 0.8} ${-8} ${p.rx * 1.6} 0`} stroke={LINE} strokeWidth={6} fill="none" opacity={0.55} />
          ))}
          <path d={`M ${-p.rx * 0.5} ${-p.ry * 0.55} q ${p.rx * 0.4} ${-p.ry * 0.35} ${p.rx * 0.9} ${-p.ry * 0.05}`} stroke="#FFFFFF" strokeWidth={5} fill="none" opacity={0.5} strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
};

// ---------- the suitcase ----------
/**
 * A suitcase seen from the front and a little above, bottom centre (x, y), `w` wide. `lid` 0 shut .. 1 wide open
 * (the lid stands up behind the case). `zip` 0..1 how far the zip has run round.
 */
export const Suitcase: React.FC<{ x: number; y: number; w: number; lid?: number; zip?: number; children?: React.ReactNode }> = ({ x, y, w, lid = 0, zip = 0, children }) => {
  const h = w * 0.34;
  const top = w * 0.16; // the top face's depth
  const L = { x: x - w / 2, y: y - h };
  const lidH = lerp(w * 0.09, w * 0.5, lid);
  return (
    <g>
      <ellipse cx={x} cy={y + 4} rx={w * 0.56} ry={w * 0.05} fill="#000" opacity={0.3} />
      {/* the lid, standing up behind the case as it opens (its lining facing us) */}
      {lid > 0.05 ? (
        <g>
          <path d={`M ${L.x + 6} ${L.y - top + 4} L ${L.x + w - 6} ${L.y - top + 4} L ${L.x + w - 20} ${L.y - top - lidH} L ${L.x + 20} ${L.y - top - lidH} Z`} fill="#3E5560" stroke={LINE} strokeWidth={6} strokeLinejoin="round" />
          <path d={`M ${L.x + 26} ${L.y - top - 6} L ${L.x + w - 26} ${L.y - top - 6} L ${L.x + w - 36} ${L.y - top - lidH + 14} L ${L.x + 36} ${L.y - top - lidH + 14} Z`} fill="#8FA7AE" />
          <path d={`M ${x - w * 0.3} ${L.y - top - lidH * 0.5} L ${x + w * 0.3} ${L.y - top - lidH * 0.5}`} stroke="#5D7680" strokeWidth={6} />
        </g>
      ) : null}
      {/* what's inside, behind the front wall */}
      {children}
      {/* the body: the top rim (only when open), the front face */}
      {lid > 0.05 ? (
        <path d={`M ${L.x} ${L.y} L ${L.x + 16} ${L.y - top} L ${L.x + w - 16} ${L.y - top} L ${L.x + w} ${L.y}`} fill="none" stroke={LINE} strokeWidth={6} />
      ) : (
        <g>
          {/* shut: the lid's top face and its edge */}
          <path d={`M ${L.x} ${L.y} L ${L.x + 16} ${L.y - top} L ${L.x + w - 16} ${L.y - top} L ${L.x + w} ${L.y} Z`} fill="#7E98A2" stroke={LINE} strokeWidth={6} strokeLinejoin="round" />
          <path d={`M ${x - w * 0.18} ${L.y - top * 0.5} L ${x + w * 0.18} ${L.y - top * 0.5}`} stroke="#4E6670" strokeWidth={8} strokeLinecap="round" />
        </g>
      )}
      <rect x={L.x} y={L.y} width={w} height={h} rx={14} fill="#5D7680" stroke={LINE} strokeWidth={6} />
      <rect x={L.x + 8} y={L.y + 8} width={w - 16} height={12} rx={6} fill="#8FA7AE" opacity={0.8} />
      {/* ribs, corner caps, the zip running along the seam */}
      {[0.28, 0.5, 0.72].map((u) => (
        <path key={u} d={`M ${L.x + w * u} ${L.y + 26} L ${L.x + w * u} ${y - 14}`} stroke="#4A606A" strokeWidth={8} strokeLinecap="round" />
      ))}
      {[L.x + 4, L.x + w - 30].map((cx) => (
        <rect key={cx} x={cx} y={y - 30} width={26} height={26} rx={8} fill={LINE} />
      ))}
      <path d={`M ${L.x + 12} ${L.y + 6} L ${L.x + 12 + (w - 24) * zip} ${L.y + 6}`} stroke="#E8DDC4" strokeWidth={5} strokeDasharray="6 4" />
      {zip > 0 ? <rect x={L.x + 4 + (w - 24) * zip} y={L.y - 2} width={16} height={22} rx={4} fill="#E8DDC4" stroke={LINE} strokeWidth={3} /> : null}
      {/* the handle on the front */}
      <path d={`M ${x - w * 0.12} ${L.y + h * 0.38} q 0 ${-h * 0.2} ${w * 0.04} ${-h * 0.2} L ${x + w * 0.08} ${L.y + h * 0.18} q ${w * 0.04} 0 ${w * 0.04} ${h * 0.2}`} stroke={LINE} strokeWidth={12} fill="none" strokeLinecap="round" />
    </g>
  );
};

/** The open suitcase straight from above (the S2 insert): centre (x, y), `w` wide; the lid lies open above it. */
export const SuitcaseTop: React.FC<{ x: number; y: number; w: number; children?: React.ReactNode }> = ({ x, y, w, children }) => {
  const h = w * 0.62;
  return (
    <g>
      <rect x={x - w / 2 + 18} y={y - h / 2 + 22} width={w} height={h} rx={30} fill="#000" opacity={0.35} />
      {/* the lid, open above the hinge, lining up */}
      <rect x={x - w / 2} y={y - h / 2 - h * 0.92} width={w} height={h * 0.9} rx={30} fill="#3E5560" stroke={LINE} strokeWidth={8} />
      <rect x={x - w / 2 + 34} y={y - h / 2 - h * 0.92 + 34} width={w - 68} height={h * 0.9 - 68} rx={18} fill="#8FA7AE" />
      <path d={`M ${x - w / 2 + 34} ${y - h / 2 - h * 0.5} L ${x + w / 2 - 34} ${y - h / 2 - h * 0.5}`} stroke="#5D7680" strokeWidth={10} />
      {/* the case: the rim, the lining, the straps */}
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={30} fill="#5D7680" stroke={LINE} strokeWidth={8} />
      <rect x={x - w / 2 + 30} y={y - h / 2 + 30} width={w - 60} height={h - 60} rx={18} fill="#2E3E46" />
      <path d={`M ${x - w * 0.18} ${y - h / 2 + 30} L ${x - w * 0.18} ${y + h / 2 - 30} M ${x + w * 0.18} ${y - h / 2 + 30} L ${x + w * 0.18} ${y + h / 2 - 30}`} stroke="#7E98A2" strokeWidth={14} />
      {children}
    </g>
  );
};

/** Clothes from above: overlapping garments, centre (x, y), `w` across, spilling past the case's edges. */
export const ClothesTop: React.FC<{ x: number; y: number; w: number; seed?: number }> = ({ x, y, w, seed = 4 }) => {
  const k = w / 600;
  const items = [
    { dx: -180, dy: 40, rx: 170, ry: 110, c: '#B9C3C6', st: 0, r: -20 },
    { dx: 170, dy: 60, rx: 180, ry: 120, c: '#8E6A72', st: 0, r: 15 },
    { dx: 0, dy: -30, rx: 210, ry: 130, c: '#D9D2C2', st: 7, r: -6 },
    { dx: -120, dy: -110, rx: 130, ry: 80, c: '#E8C77A', st: 4, r: 24 },
    { dx: 150, dy: -120, rx: 140, ry: 80, c: '#5E7486', st: 0, r: -14 },
    { dx: 40, dy: 120, rx: 120, ry: 70, c: '#C8CED2', st: 3, r: 8 },
    { dx: -30, dy: -170, rx: 90, ry: 52, c: '#B07A6A', st: 0, r: -30 },
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      {/* sleeves hanging off the edges */}
      <path d="M -340 -20 Q -420 30 -440 140 L -380 150 Q -360 60 -300 30 Z" fill="#B9C3C6" stroke={LINE} strokeWidth={8} strokeLinejoin="round" />
      <path d="M 330 -60 Q 420 -40 450 60 L 392 80 Q 370 10 316 0 Z" fill="#5E7486" stroke={LINE} strokeWidth={8} strokeLinejoin="round" />
      {items.map((p, i) => (
        <g key={i} transform={`translate(${p.dx} ${p.dy}) rotate(${p.r + (rnd(seed, i) - 0.5) * 8})`}>
          <ellipse rx={p.rx} ry={p.ry} fill={p.c} stroke={LINE} strokeWidth={8} />
          {Array.from({ length: p.st }).map((_, s) => (
            <path key={s} d={`M ${-p.rx * 0.85} ${-p.ry * 0.7 + (s * p.ry * 1.4) / Math.max(1, p.st - 1)} q ${p.rx * 0.85} -12 ${p.rx * 1.7} 0`} stroke={LINE} strokeWidth={9} fill="none" opacity={0.5} />
          ))}
          <path d={`M ${-p.rx * 0.4} ${-p.ry * 0.2} q ${p.rx * 0.3} ${p.ry * 0.25} ${p.rx * 0.7} 0`} stroke={LINE} strokeWidth={6} fill="none" opacity={0.35} />
        </g>
      ))}
    </g>
  );
};

// ---------- the couch ----------
/** A two-seat couch from the front, bottom centre (x, y), `w` wide, rotated `rot` degrees about its base. */
export const Couch: React.FC<{ x: number; y: number; w: number; rot?: number; shadow?: boolean }> = ({ x, y, w, rot = 0, shadow = true }) => {
  const k = w / 400;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`}>
      {shadow ? <ellipse cx={0} cy={2} rx={215} ry={16} fill="#000" opacity={0.3} /> : null}
      {/* legs */}
      {[-170, 170].map((lx) => (
        <path key={lx} d={`M ${lx - 10} -24 L ${lx - 6} 0 L ${lx + 6} 0 L ${lx + 10} -24 Z`} fill={LINE} />
      ))}
      {/* the back, two back cushions */}
      <rect x={-190} y={-210} width={380} height={130} rx={34} fill="#7C8F96" stroke={LINE} strokeWidth={7} />
      <rect x={-172} y={-196} width={168} height={108} rx={26} fill="#93A6AC" stroke={LINE} strokeWidth={5} />
      <rect x={4} y={-196} width={168} height={108} rx={26} fill="#93A6AC" stroke={LINE} strokeWidth={5} />
      {/* the base and seat cushions */}
      <rect x={-200} y={-96} width={400} height={74} rx={18} fill="#62757C" stroke={LINE} strokeWidth={7} />
      <rect x={-166} y={-120} width={164} height={52} rx={18} fill="#A9BABF" stroke={LINE} strokeWidth={5} />
      <rect x={2} y={-120} width={164} height={52} rx={18} fill="#A9BABF" stroke={LINE} strokeWidth={5} />
      {/* the arms */}
      <rect x={-216} y={-150} width={58} height={128} rx={26} fill="#6E8289" stroke={LINE} strokeWidth={7} />
      <rect x={158} y={-150} width={58} height={128} rx={26} fill="#6E8289" stroke={LINE} strokeWidth={7} />
      <path d="M -204 -138 q 18 -10 36 0 M 170 -138 q 18 -10 36 0" stroke="#FFFFFF" strokeWidth={5} opacity={0.45} fill="none" strokeLinecap="round" />
      {/* a cushion seam, a pillow */}
      <rect x={-140} y={-176} width={84} height={70} rx={20} fill="#D9C07A" stroke={LINE} strokeWidth={5} transform="rotate(-10 -98 -141)" />
    </g>
  );
};

// ---------- the lab sheet (the science beat) ----------
/**
 * The science beat's ground in this style: a printed lab sheet. Paper, a teal grid (heavier every fifth line),
 * registration marks in the corners, a figure number. `dark` 0..1 floods it with ink (the black hole).
 */
export const LabSheet: React.FC<{ t: number; fig?: string; dark?: number }> = ({ t, fig = 'FIG. 1', dark = 0 }) => (
  <g>
    <rect x={-200} y={-200} width={2320} height={1480} fill={NP.paper} />
    {Array.from({ length: 50 }).map((_, i) => (
      <line key={`v${i}`} x1={-40 + i * 48} y1={-200} x2={-40 + i * 48} y2={1280} stroke={NP.teal} strokeWidth={i % 5 === 0 ? 2.4 : 1} opacity={i % 5 === 0 ? 0.42 : 0.2} />
    ))}
    {Array.from({ length: 32 }).map((_, i) => (
      <line key={`h${i}`} x1={-200} y1={-36 + i * 48} x2={2120} y2={-36 + i * 48} stroke={NP.teal} strokeWidth={i % 5 === 0 ? 2.4 : 1} opacity={i % 5 === 0 ? 0.42 : 0.2} />
    ))}
    {[[70, 70], [1850, 70], [70, 1010], [1850, 1010]].map(([cx, cy], i) => (
      <g key={i} stroke={NP.ink} strokeWidth={2.5} fill="none">
        <circle cx={cx} cy={cy} r={16} />
        <path d={`M ${cx - 28} ${cy} L ${cx + 28} ${cy} M ${cx} ${cy - 28} L ${cx} ${cy + 28}`} />
      </g>
    ))}
    <text x={120} y={80} fontFamily={NP_FONT.ui} fontWeight={500} fontSize={26} fill={NP.ink} letterSpacing={4} opacity={0.75}>
      {fig}
    </text>
    <rect x={-200} y={-200} width={2320} height={1480} fill={NP.ink} opacity={dark} />
  </g>
);

/** A line drawn on from t = 0 over `dur` frames (ink by default). */
export const Ink: React.FC<{ d: string; t: number; dur?: number; color?: string; w?: number; len?: number }> = ({ d, t, dur = 10, color = NP.ink, w = 6, len = 2400 }) => {
  if (t <= 0) return null;
  const p = clamp(t / dur);
  return <path d={d} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />;
};

/** A mono label on the lab sheet that types on letter by letter from t = 0. */
export const LabLabel: React.FC<{ x: number; y: number; t: number; text: string; size?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; weight?: number }> = ({ x, y, t, text, size = 40, color = NP.ink, anchor = 'middle', weight = 500 }) => {
  if (t <= 0) return null;
  const n = Math.min(text.length, Math.floor(t * 1.6) + 1);
  return (
    <text x={x} y={y} textAnchor={anchor} fontFamily={NP_FONT.ui} fontWeight={weight} fontSize={size} fill={color} letterSpacing={size * 0.06}>
      {text.slice(0, n)}
      <tspan fillOpacity={0}>{text.slice(n)}</tspan>
    </text>
  );
};

/** A balance: a stand, a beam tilted `tilt` degrees (+ dips right), two pans on strings. Items go on the pans. */
export const Balance: React.FC<{ x: number; y: number; tilt: number; left?: React.ReactNode; right?: React.ReactNode; span?: number }> = ({ x, y, tilt, left, right, span = 520 }) => {
  const r = (tilt * Math.PI) / 180;
  const top = { x, y: y - 520 };
  const L = { x: top.x - Math.cos(r) * span, y: top.y - Math.sin(r) * span };
  const R = { x: top.x + Math.cos(r) * span, y: top.y + Math.sin(r) * span };
  const pan = (p: { x: number; y: number }, item: React.ReactNode, key: string) => (
    <g key={key}>
      <path d={`M ${p.x} ${p.y} L ${p.x - 170} ${p.y + 240} M ${p.x} ${p.y} L ${p.x + 170} ${p.y + 240}`} stroke={NP.ink} strokeWidth={4} />
      {item}
      <path d={`M ${p.x - 200} ${p.y + 240} L ${p.x + 200} ${p.y + 240} Q ${p.x + 170} ${p.y + 300} ${p.x} ${p.y + 300} Q ${p.x - 170} ${p.y + 300} ${p.x - 200} ${p.y + 240} Z`} fill={NP.mist} stroke={NP.ink} strokeWidth={6} strokeLinejoin="round" />
    </g>
  );
  return (
    <g>
      <path d={`M ${x - 160} ${y} L ${x + 160} ${y} L ${x + 120} ${y - 40} L ${x - 120} ${y - 40} Z`} fill={NP.deep} stroke={NP.ink} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M ${x} ${y - 40} L ${x} ${top.y}`} stroke={NP.ink} strokeWidth={18} />
      <path d={`M ${x - 26} ${top.y + 46} L ${x} ${top.y - 6} L ${x + 26} ${top.y + 46} Z`} fill={NP.ink} />
      <path d={`M ${L.x} ${L.y} L ${R.x} ${R.y}`} stroke={NP.ink} strokeWidth={16} strokeLinecap="round" />
      <circle cx={top.x} cy={top.y} r={16} fill={NP.paper} stroke={NP.ink} strokeWidth={6} />
      {/* the pointer: straight up means level */}
      <path d={`M ${top.x} ${top.y} L ${top.x + Math.sin(r) * 120} ${top.y - Math.cos(r) * 120}`} stroke={NP.pinkDeep} strokeWidth={6} strokeLinecap="round" />
      {pan(L, left, 'l')}
      {pan(R, right, 'r')}
    </g>
  );
};

// ---------- the Earth, the marble, the black hole ----------
/** The Earth in the two inks: teal sea, paper land, an ink rim, a soft terminator. */
export const Earth: React.FC<{ x: number; y: number; r: number; spin?: number; id: string }> = ({ x, y, r, spin = 0, id }) => {
  const lands = [
    'M -0.55 -0.55 Q -0.2 -0.75 0.05 -0.55 Q 0.15 -0.35 -0.05 -0.25 Q -0.25 -0.05 -0.45 -0.2 Q -0.7 -0.3 -0.55 -0.55 Z',
    'M 0.15 -0.15 Q 0.45 -0.25 0.6 -0.05 Q 0.7 0.25 0.45 0.45 Q 0.25 0.6 0.18 0.35 Q 0.05 0.1 0.15 -0.15 Z',
    'M -0.6 0.15 Q -0.4 0.1 -0.3 0.3 Q -0.3 0.55 -0.5 0.62 Q -0.72 0.45 -0.6 0.15 Z',
    'M -0.25 0.75 Q 0 0.68 0.25 0.78 Q 0 0.92 -0.25 0.75 Z',
  ];
  return (
    <g>
      <defs>
        <clipPath id={`${id}c`}>
          <circle cx={x} cy={y} r={r} />
        </clipPath>
        <radialGradient id={`${id}g`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#000" stopOpacity={0} />
          <stop offset="70%" stopColor="#000" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#000" stopOpacity={0.55} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={NP.teal} />
      <g clipPath={`url(#${id}c)`}>
        <g transform={`translate(${x + ((spin * r) % (2 * r))} ${y}) scale(${r})`}>
          {[-2, 0].map((o) => (
            <g key={o} transform={`translate(${o} 0)`}>
              {lands.map((d, i) => (
                <path key={i} d={d} fill={NP.paper} stroke={NP.ink} strokeWidth={0.02} />
              ))}
            </g>
          ))}
        </g>
        <circle cx={x} cy={y} r={r} fill={`url(#${id}g)`} />
      </g>
      <circle cx={x} cy={y} r={r} fill="none" stroke={NP.ink} strokeWidth={Math.max(2, r * 0.035)} />
    </g>
  );
};

/** A glass marble: an ink outline, a teal swirl, a paper highlight. */
export const Marble: React.FC<{ x: number; y: number; r: number }> = ({ x, y, r }) => (
  <g>
    <ellipse cx={x + r * 0.15} cy={y + r * 1.02} rx={r * 0.9} ry={r * 0.18} fill={NP.ink} opacity={0.3} />
    <circle cx={x} cy={y} r={r} fill={NP.mist} stroke={NP.ink} strokeWidth={Math.max(2, r * 0.07)} />
    <path d={`M ${x - r * 0.7} ${y + r * 0.2} Q ${x - r * 0.1} ${y - r * 0.6} ${x + r * 0.7} ${y - r * 0.1} Q ${x + r * 0.1} ${y + r * 0.1} ${x - r * 0.4} ${y + r * 0.6} Z`} fill={NP.teal} />
    <ellipse cx={x - r * 0.35} cy={y - r * 0.42} rx={r * 0.22} ry={r * 0.13} fill={NP.paper} transform={`rotate(-30 ${x - r * 0.35} ${y - r * 0.42})`} />
  </g>
);

/** A black hole: an ink disc, a pink photon ring that glows, light bending round it (grid lines pulled in). */
export const BlackHole: React.FC<{ x: number; y: number; r: number; t: number; on: number }> = ({ x, y, r, t, on }) => {
  if (on <= 0) return null;
  const k = clamp(on);
  return (
    <g>
      {/* the accretion glow, a slow turn */}
      <g transform={`translate(${x} ${y}) rotate(${t * 2.2}) scale(1 0.32)`} opacity={k}>
        <ellipse rx={r * 2.6} ry={r * 2.6} fill="none" stroke={NP.pink} strokeWidth={r * 0.18} opacity={0.55} filter="url(#npGlow)" />
        <ellipse rx={r * 2.0} ry={r * 2.0} fill="none" stroke={NP.pinkGlow} strokeWidth={r * 0.1} opacity={0.8} />
      </g>
      <circle cx={x} cy={y} r={r * 1.18 * k} fill="none" stroke={NP.pink} strokeWidth={r * 0.12} filter="url(#npGlow)" />
      <circle cx={x} cy={y} r={r * k} fill="#020507" />
      {/* the front half of the disc passes in front of the hole */}
      <g transform={`translate(${x} ${y}) scale(1 0.32)`} opacity={k}>
        <path d={`M ${-r * 2.6} 0 A ${r * 2.6} ${r * 2.6} 0 0 0 ${r * 2.6} 0`} fill="none" stroke={NP.pink} strokeWidth={r * 0.2} filter="url(#npGlow)" />
      </g>
    </g>
  );
};

/** Grid lines bending toward a point (spacetime pulled in), for the black hole shot. `pull` 0..1. */
export const BentGrid: React.FC<{ x: number; y: number; pull: number; color?: string }> = ({ x, y, pull, color = NP.teal }) => {
  const lines: React.ReactNode[] = [];
  const warp = (px: number, py: number) => {
    const dx = px - x;
    const dy = py - y;
    const d = Math.hypot(dx, dy) + 1;
    const f = (pull * 160000) / (d * d + 40000);
    return { x: px - (dx / d) * f * 1.0, y: py - (dy / d) * f * 1.0 };
  };
  for (let i = 0; i < 26; i++) {
    const gx = -40 + i * 96;
    let d = '';
    for (let j = 0; j <= 40; j++) {
      const p = warp(gx, -100 + j * 32);
      d += `${j ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
    }
    lines.push(<path key={`v${i}`} d={d} stroke={color} strokeWidth={2} fill="none" opacity={0.55} />);
  }
  for (let i = 0; i < 16; i++) {
    const gy = -36 + i * 96;
    let d = '';
    for (let j = 0; j <= 64; j++) {
      const p = warp(-100 + j * 34, gy);
      d += `${j ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
    }
    lines.push(<path key={`h${i}`} d={d} stroke={color} strokeWidth={2} fill="none" opacity={0.55} />);
  }
  return <g>{lines}</g>;
};
