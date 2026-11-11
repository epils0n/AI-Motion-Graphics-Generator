import React from 'react';
import { clamp, easeOut, backOut, rnd, makeRoom, RoomShell, Box, FloorShadow, WallFrame, FloorPlant, Pendant, pendantLight, LightVeil, Glow, Dust, Moon } from '../../engine';
import { NP, NP_FONT } from '../shrink/style';

// New pieces for the 60 s Short: the morning hall (the suit's scenes), a whole pizza, the folder with the Moon,
// the 1/20 cube, a vertical lab sheet, the vertical title and the PART 1 card.

const LINE = '#151A20';

// ---------------------------------------------------------------- the hall, in the morning
export const HALL = makeRoom({ x: 940, y: 500 }, { x0: 600, x1: 1300, y0: 290, y1: 770 }, 3.3);
export const DOOR = { u0: 0.36, u1: 0.64, v0: 0.16 };
/** The hole in the floor where the couch went through: centre (u, w) on the floor. */
export const HOLE = { u: 0.68, w: 0.6 };

/** The front hall: a door on the back wall (it opens onto the morning: `open` 0..1), a window, a rug, coats. */
export const Hall: React.FC<{ t: number; id: string; open?: number; veil?: number; hole?: number; sun?: number }> = ({ t, id, open = 0, veil = 0.42, hole = 1, sun = 1 }) => {
  const R = HALL;
  const { P, Q } = R;
  const d0 = P(DOOR.u0, DOOR.v0, 0);
  const d1 = P(DOOR.u1, 1, 0);
  const hinge = P(DOOR.u1, DOOR.v0, 0);
  // the door swings in toward the right wall: its free edge comes toward the camera
  const sw = easeOut(clamp(open));
  const free = (v: number) => P(DOOR.u1 - (DOOR.u1 - DOOR.u0) * Math.cos(sw * 1.3), v, (DOOR.u1 - DOOR.u0) * Math.sin(sw * 1.3) * 0.62);
  const hc = P(HOLE.u, 1, HOLE.w);
  const hk = R.s(HOLE.w);
  return (
    <g>
      <RoomShell r={R} id={id} floor="boards" />
      {/* the doorway: the morning outside (sky, a hedge, a path) */}
      <rect x={d0.x} y={d0.y} width={d1.x - d0.x} height={d1.y - d0.y} fill="#F6EBD2" />
      <rect x={d0.x} y={d0.y + (d1.y - d0.y) * 0.62} width={d1.x - d0.x} height={(d1.y - d0.y) * 0.38} fill="#9DB79A" />
      <path d={`M ${d0.x + (d1.x - d0.x) * 0.35} ${d1.y} L ${d0.x + (d1.x - d0.x) * 0.48} ${d0.y + (d1.y - d0.y) * 0.62} L ${d0.x + (d1.x - d0.x) * 0.56} ${d0.y + (d1.y - d0.y) * 0.62} L ${d0.x + (d1.x - d0.x) * 0.72} ${d1.y} Z`} fill="#D8C9A8" />
      <Glow x={(d0.x + d1.x) / 2} y={(d0.y + d1.y) / 2} r={520 * sun} o={0.55 * sun} />
      {/* the door itself, swinging in */}
      <polygon points={`${free(DOOR.v0).x},${free(DOOR.v0).y} ${hinge.x},${hinge.y} ${d1.x},${d1.y} ${free(1).x},${free(1).y}`} fill="#3E5A66" stroke={LINE} strokeWidth={5} strokeLinejoin="round" />
      {open < 0.05 ? (
        <g>
          {/* shut: panels, a glass light, the letter slot, the knob */}
          <rect x={d0.x + 22} y={d0.y + 26} width={d1.x - d0.x - 44} height={(d1.y - d0.y) * 0.3} rx={6} fill="#F3E2B8" opacity={0.9} />
          <path d={`M ${(d0.x + d1.x) / 2} ${d0.y + 26} L ${(d0.x + d1.x) / 2} ${d0.y + 26 + (d1.y - d0.y) * 0.3}`} stroke="#3E5A66" strokeWidth={8} />
          <rect x={d0.x + 30} y={d0.y + (d1.y - d0.y) * 0.45} width={d1.x - d0.x - 60} height={(d1.y - d0.y) * 0.45} rx={6} fill="none" stroke="#2C434C" strokeWidth={5} />
          <rect x={(d0.x + d1.x) / 2 - 34} y={d0.y + (d1.y - d0.y) * 0.5} width={68} height={12} rx={4} fill="#C9B48A" />
          <circle cx={d0.x + 26} cy={d0.y + (d1.y - d0.y) * 0.62} r={9} fill="#C9B48A" />
        </g>
      ) : null}
      <rect x={d0.x - 14} y={d0.y - 14} width={d1.x - d0.x + 28} height={d1.y - d0.y + 14} fill="none" stroke="#2A2230" strokeWidth={14} />
      {/* a window on the left wall with the low morning sun in it */}
      <polygon points={Q([[0, 0.2, 0.18], [0, 0.2, 0.42], [0, 0.66, 0.42], [0, 0.66, 0.18]])} fill="#F6EBD2" />
      <polygon points={Q([[0, 0.43, 0.18], [0, 0.43, 0.42]])} stroke="#2A2230" strokeWidth={8} fill="none" />
      <path d={`M ${P(0, 0.2, 0.3).x} ${P(0, 0.2, 0.3).y} L ${P(0, 0.66, 0.3).x} ${P(0, 0.66, 0.3).y}`} stroke="#2A2230" strokeWidth={8} />
      <polygon points={Q([[0, 0.2, 0.18], [0, 0.2, 0.42], [0, 0.66, 0.42], [0, 0.66, 0.18]])} fill="none" stroke="#2A2230" strokeWidth={12} />
      <Glow x={P(0, 0.43, 0.3).x} y={P(0, 0.43, 0.3).y} r={420 * sun} o={0.45 * sun} />
      {/* the sun's patch on the floor from the window */}
      <polygon points={Q([[0.04, 1, 0.3], [0.3, 1, 0.42], [0.36, 1, 0.66], [0.06, 1, 0.5]])} fill="#F6EBD2" opacity={0.28 * sun} />
      {/* furniture: a console with a lamp and a bowl, coats on hooks, a frame, a plant, a rug */}
      <Box r={R} u={[0.74, 0.97]} v={[0.66, 0.7]} w={[0.02, 0.14]} front="#5B4038" top="#7A5747" />
      {[[0.76, 0.03], [0.95, 0.03], [0.76, 0.13], [0.95, 0.13]].map(([u, w], i) => (
        <path key={i} d={`M ${P(u, 0.7, w).x} ${P(u, 0.7, w).y} L ${P(u, 1, w).x} ${P(u, 1, w).y}`} stroke="#3A2826" strokeWidth={8} />
      ))}
      <FloorShadow r={R} u={[0.74, 0.97]} w={[0.02, 0.14]} />
      <ellipse cx={P(0.9, 0.66, 0.08).x} cy={P(0.9, 0.66, 0.08).y - 6} rx={34} ry={9} fill="#C9B48A" />
      {[0.18, 0.28, 0.38].map((u, i) => (
        <g key={i}>
          <circle cx={P(u, 0.36, 0).x} cy={P(u, 0.36, 0).y} r={6} fill="#C9B48A" />
          <path d={`M ${P(u, 0.36, 0).x} ${P(u, 0.36, 0).y} Q ${P(u, 0.36, 0).x - 30} ${P(u, 0.6, 0).y} ${P(u, 0.36, 0).x - 20 + i * 6} ${P(u, 0.8, 0).y} L ${P(u, 0.36, 0).x + 26} ${P(u, 0.78, 0).y} Q ${P(u, 0.36, 0).x + 26} ${P(u, 0.55, 0).y} ${P(u, 0.36, 0).x} ${P(u, 0.36, 0).y} Z`} fill={['#7A5A6A', '#4A5A6A', '#8A6A4A'][i]} />
        </g>
      ))}
      <WallFrame x={P(0.78, 0.22, 0).x} y={P(0.78, 0.22, 0).y} w={110} h={86} art={1} />
      <FloorPlant r={R} u={0.06} w={0.72} size={1.2} />
      <polygon points={Q([[0.3, 1, 0.3], [0.62, 1, 0.3], [0.64, 1, 0.82], [0.26, 1, 0.82]])} fill="#6A3644" opacity={0.8} />
      <polygon points={Q([[0.32, 1, 0.33], [0.6, 1, 0.33], [0.62, 1, 0.79], [0.28, 1, 0.79]])} fill="none" stroke="#E9C46A" strokeWidth={4} opacity={0.6} />
      <Pendant r={R} u={0.5} w={0.42} t={t} />
      {/* the hole the couch made: splintered boards round a dark pit */}
      {hole > 0 ? (
        <g opacity={hole}>
          <ellipse cx={hc.x} cy={hc.y} rx={92 * hk} ry={30 * hk} fill="#07090C" />
          {Array.from({ length: 11 }).map((_, i) => {
            const a = (i / 11) * Math.PI * 2;
            const r0 = 1 + rnd(4, i) * 0.25;
            return <path key={i} d={`M ${hc.x + Math.cos(a) * 92 * hk * r0} ${hc.y + Math.sin(a) * 30 * hk * r0} L ${hc.x + Math.cos(a + 0.12) * 70 * hk} ${hc.y + Math.sin(a + 0.12) * 22 * hk} L ${hc.x + Math.cos(a - 0.1) * 72 * hk} ${hc.y + Math.sin(a - 0.1) * 23 * hk} Z`} fill="#7A5747" />;
          })}
        </g>
      ) : null}
      <LightVeil id={`${id}veil`} lights={[[(d0.x + d1.x) / 2, (d0.y + d1.y) / 2, 360 * sun + 120], [P(0, 0.43, 0.3).x, P(0, 0.43, 0.3).y, 300], pendantLight(R, 0.5, 0.42)]} o={veil} />
      <Glow x={(d0.x + d1.x) / 2} y={(d0.y + d1.y) / 2} r={300} o={0.35 * sun} />
      <Dust t={t} seed={21} x0={P(0, 0.2, 0.3).x} y0={P(0, 0.2, 0.3).y} w={600} h={500} n={40} />
    </g>
  );
};
export const holeCentre = () => HALL.P(HOLE.u, 1, HOLE.w);

// ---------------------------------------------------------------- the pizza
/** A whole pizza from above, centre (x, y), radius r, cut into eight, pepperoni and basil. */
export const PizzaTop: React.FC<{ x: number; y: number; r: number; seed?: number }> = ({ x, y, r, seed = 3 }) => (
  <g>
    <circle cx={x + r * 0.05} cy={y + r * 0.06} r={r * 1.02} fill="#000" opacity={0.28} />
    <circle cx={x} cy={y} r={r} fill="#C98A4A" stroke={LINE} strokeWidth={Math.max(2, r * 0.02)} />
    <circle cx={x} cy={y} r={r * 0.86} fill="#B8402F" />
    <circle cx={x} cy={y} r={r * 0.8} fill="#F2D27A" />
    {Array.from({ length: 13 }).map((_, i) => {
      const a = rnd(seed, i) * Math.PI * 2;
      const d = Math.sqrt(rnd(seed + 1, i)) * r * 0.68;
      return <circle key={i} cx={x + Math.cos(a) * d} cy={y + Math.sin(a) * d} r={r * 0.09} fill="#A8323E" stroke="#7A2430" strokeWidth={Math.max(1, r * 0.012)} />;
    })}
    {Array.from({ length: 6 }).map((_, i) => {
      const a = rnd(seed + 5, i) * Math.PI * 2;
      const d = Math.sqrt(rnd(seed + 6, i)) * r * 0.6;
      return <ellipse key={i} cx={x + Math.cos(a) * d} cy={y + Math.sin(a) * d} rx={r * 0.06} ry={r * 0.03} fill="#4E7350" transform={`rotate(${a * 60} ${x + Math.cos(a) * d} ${y + Math.sin(a) * d})`} />;
    })}
    {Array.from({ length: 4 }).map((_, i) => (
      <path key={i} d={`M ${x - Math.cos((i * Math.PI) / 4) * r} ${y - Math.sin((i * Math.PI) / 4) * r} L ${x + Math.cos((i * Math.PI) / 4) * r} ${y + Math.sin((i * Math.PI) / 4) * r}`} stroke="#9A6A3A" strokeWidth={Math.max(1, r * 0.015)} opacity={0.7} />
    ))}
  </g>
);

/** The open pizza box under it (from above): the lid stands open at the top. */
export const PizzaBoxTop: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) => (
  <g>
    <rect x={x - w / 2 + 14} y={y - w / 2 + 18} width={w} height={w} fill="#000" opacity={0.3} />
    <rect x={x - w / 2} y={y - w / 2 - w * 0.92} width={w} height={w * 0.9} fill="#C8B48C" stroke={LINE} strokeWidth={6} />
    <circle cx={x} cy={y - w / 2 - w * 0.47} r={w * 0.2} fill="none" stroke="#A8323E" strokeWidth={8} />
    <rect x={x - w / 2} y={y - w / 2} width={w} height={w} fill="#D8C49C" stroke={LINE} strokeWidth={6} />
    <rect x={x - w / 2 + 16} y={y - w / 2 + 16} width={w - 32} height={w - 32} fill="#E6D4AE" />
  </g>
);

// ---------------------------------------------------------------- the folder with the Moon
export const MoonFolder: React.FC<{ t: number; w: number; x: number; y: number }> = ({ t, w, x, y }) => {
  const open = easeOut(clamp(t / 8));
  const h = w * 1.25;
  const circ = clamp((t - 10) / 10);
  const L = 2 * Math.PI * w * 0.3;
  return (
    <g>
      <rect x={x - w / 2 + 16} y={y - h / 2 + 20} width={w} height={h} fill="#000" opacity={0.35} />
      {/* the folder's back, a photo clipped on it, the front cover swinging open to the left */}
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={10} fill="#C9A86A" stroke={LINE} strokeWidth={6} />
      <rect x={x - w * 0.42} y={y - h * 0.4} width={w * 0.84} height={w * 0.84} fill="#0C1418" stroke="#F3E7CD" strokeWidth={10} />
      <g>
        <Moon x={x} y={y - h * 0.4 + w * 0.42} r={w * 0.26} bloom={0.5} />
      </g>
      <path d={`M ${x - w * 0.36} ${y - h * 0.4 + w * 0.42} m 0 0 a ${w * 0.3} ${w * 0.3} 0 1 0 ${w * 0.72} 0 a ${w * 0.3} ${w * 0.3} 0 1 0 ${-w * 0.72} 0`} stroke={NP.pink} strokeWidth={8} fill="none" strokeDasharray={L} strokeDashoffset={L * (1 - circ)} strokeLinecap="round" filter="url(#npGlow)" />
      <text x={x} y={y + h * 0.3} textAnchor="middle" fontFamily={NP_FONT.hand} fontWeight={700} fontSize={w * 0.13} fill={NP.pinkDeep} opacity={clamp((t - 18) / 6)}>
        shrink?
      </text>
      <rect x={x - w * 0.1} y={y - h / 2 - 12} width={w * 0.2} height={30} rx={6} fill="#8A8A90" />
      <g transform={`translate(${x - w / 2} 0) scale(${1 - 2 * open} 1) translate(${-(x - w / 2)} 0)`}>
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={10} fill="#D9B97A" stroke={LINE} strokeWidth={6} />
        <text x={x} y={y - h * 0.1} textAnchor="middle" fontFamily={NP_FONT.ui} fontWeight={500} fontSize={w * 0.08} fill="#7A2430" letterSpacing={6}>
          CONFIDENTIAL
        </text>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- the vertical lab sheet and its figures
export const LabSheetV: React.FC<{ fig: string; dark?: number }> = ({ fig, dark = 0 }) => (
  <g>
    <rect x={-100} y={-100} width={1280} height={2120} fill={NP.paper} />
    {Array.from({ length: 30 }).map((_, i) => (
      <line key={`v${i}`} x1={-12 + i * 48} y1={-100} x2={-12 + i * 48} y2={2020} stroke={NP.teal} strokeWidth={i % 5 === 0 ? 2.4 : 1} opacity={i % 5 === 0 ? 0.42 : 0.2} />
    ))}
    {Array.from({ length: 44 }).map((_, i) => (
      <line key={`h${i}`} x1={-100} y1={-24 + i * 48} x2={1180} y2={-24 + i * 48} stroke={NP.teal} strokeWidth={i % 5 === 0 ? 2.4 : 1} opacity={i % 5 === 0 ? 0.42 : 0.2} />
    ))}
    {[[60, 60], [1020, 60], [60, 1860], [1020, 1860]].map(([cx, cy], i) => (
      <g key={i} stroke={NP.ink} strokeWidth={2.5} fill="none">
        <circle cx={cx} cy={cy} r={16} />
        <path d={`M ${cx - 28} ${cy} L ${cx + 28} ${cy} M ${cx} ${cy - 28} L ${cx} ${cy + 28}`} />
      </g>
    ))}
    <text x={104} y={70} fontFamily={NP_FONT.ui} fontWeight={500} fontSize={26} fill={NP.ink} letterSpacing={4} opacity={0.75}>
      {fig}
    </text>
    <rect x={-100} y={-100} width={1280} height={2120} fill={NP.ink} opacity={dark} />
  </g>
);

/** A cube drawn in isometric, `n` x `n` cells on each face, side `a`, standing on (x, y). */
export const GridCube: React.FC<{ x: number; y: number; a: number; n: number; color?: string; fill?: string }> = ({ x, y, a, n, color = NP.ink, fill = NP.mist }) => {
  const c = Math.cos(Math.PI / 6) * a;
  const s = Math.sin(Math.PI / 6) * a;
  const top = [[x, y - a - 2 * s], [x + c, y - a - s], [x, y - a], [x - c, y - a - s]];
  const left = [[x - c, y - a - s], [x, y - a], [x, y], [x - c, y - s]];
  const right = [[x, y - a], [x + c, y - a - s], [x + c, y - s], [x, y]];
  const poly = (p: number[][]) => p.map((q) => q.join(',')).join(' ');
  const lines: React.ReactNode[] = [];
  const sw = Math.max(0.6, a / 120);
  if (n > 1) {
    for (let i = 1; i < n; i++) {
      const k = i / n;
      lines.push(<line key={`l${i}`} x1={x - c + c * k} y1={y - a - s + s * k} x2={x - c + c * k} y2={y - s + s * k} stroke={color} strokeWidth={sw} opacity={0.5} />);
      lines.push(<line key={`m${i}`} x1={x - c} y1={y - s - a * k} x2={x} y2={y - a * k} stroke={color} strokeWidth={sw} opacity={0.5} />);
      lines.push(<line key={`r${i}`} x1={x + c * k} y1={y - a - s * k} x2={x + c * k} y2={y - s * k} stroke={color} strokeWidth={sw} opacity={0.5} />);
      lines.push(<line key={`q${i}`} x1={x} y1={y - a * k} x2={x + c} y2={y - s - a * k} stroke={color} strokeWidth={sw} opacity={0.5} />);
      lines.push(<line key={`t${i}`} x1={x - c + c * k} y1={y - a - s - s * k} x2={x + c * k} y2={y - a - 2 * s + s * k} stroke={color} strokeWidth={sw} opacity={0.5} />);
      lines.push(<line key={`u${i}`} x1={x - c * k} y1={y - a - 2 * s + s * k} x2={x + c - c * k} y2={y - a - s + s * k} stroke={color} strokeWidth={sw} opacity={0.5} />);
    }
  }
  return (
    <g>
      <polygon points={poly(left)} fill={fill} />
      <polygon points={poly(right)} fill={NP.teal} opacity={0.75} />
      <polygon points={poly(top)} fill={NP.paper} />
      {lines}
      <polygon points={poly([...top.slice(0, 1), top[1], right[2], right[3], left[3], left[0]])} fill="none" stroke={color} strokeWidth={Math.max(1.5, a / 50)} strokeLinejoin="round" />
      <path d={`M ${x - c} ${y - a - s} L ${x} ${y - a} L ${x + c} ${y - a - s} M ${x} ${y - a} L ${x} ${y}`} stroke={color} strokeWidth={Math.max(1.5, a / 50)} fill="none" />
    </g>
  );
};

// ---------------------------------------------------------------- the vertical title and the PART 1 card
export const TitleV: React.FC<{ t: number; y?: number }> = ({ t, y = 520 }) => {
  if (t < 0) return null;
  const k = (d: number) => easeOut(clamp((t - d) / 6));
  const off = 8 + 3 * Math.sin(t / 5);
  const line = (txt: string, yy: number, size: number, d: number, pink: boolean) => (
    <g opacity={k(d)} transform={`translate(0 ${(1 - k(d)) * 40})`}>
      <text x={540 - off} y={yy + off * 0.6} textAnchor="middle" fontFamily={NP_FONT.title} fontSize={size} fill={NP.pink} opacity={0.8} style={{ mixBlendMode: 'screen' }}>
        {txt}
      </text>
      <text x={540} y={yy} textAnchor="middle" fontFamily={NP_FONT.title} fontSize={size} fill={pink ? NP.pink : NP.paper}>
        {txt}
      </text>
    </g>
  );
  return (
    <g>
      <text x={540} y={y - 250} textAnchor="middle" fontFamily={NP_FONT.ui} fontWeight={500} fontSize={46} fill={NP.paper} letterSpacing={12} opacity={k(0)}>
        WHAT IF YOU COULD
      </text>
      {line('SHRINK', y, 250, 4, true)}
      {line('ANYTHING?', y + 220, 196, 9, false)}
    </g>
  );
};

export const PartCard: React.FC<{ t: number }> = ({ t }) => {
  const k = backOut(clamp(t / 8));
  const off = 10 + 4 * Math.sin(t / 4);
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={NP.ink} />
      <circle cx={540} cy={900} r={520} fill={NP.pink} opacity={0.08} />
      <g transform={`translate(540 960) scale(${k}) translate(-540 -960)`}>
        <text x={540 - off} y={1000 + off * 0.6} textAnchor="middle" fontFamily={NP_FONT.title} fontSize={330} fill={NP.pink} opacity={0.85} style={{ mixBlendMode: 'screen' }}>
          PART 1
        </text>
        <text x={540} y={1000} textAnchor="middle" fontFamily={NP_FONT.title} fontSize={330} fill={NP.paper}>
          PART 1
        </text>
      </g>
      <text x={540} y={1130} textAnchor="middle" fontFamily={NP_FONT.ui} fontWeight={500} fontSize={40} fill={NP.mist} letterSpacing={10} opacity={clamp((t - 10) / 6)}>
        WHAT WOULD YOU DO?
      </text>
    </g>
  );
};

/** A small clock readout in a pill (a time-skip chip): "07:42". */
export const ClockChip: React.FC<{ x: number; y: number; t: number; text: string }> = ({ x, y, t, text }) => {
  if (t < 0) return null;
  const k = backOut(clamp(t / 6));
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <rect x={-130} y={-44} width={260} height={88} rx={44} fill={NP.ink} opacity={0.8} stroke={NP.paper} strokeWidth={3} />
      <text y={18} textAnchor="middle" fontFamily={NP_FONT.ui} fontWeight={500} fontSize={52} fill={NP.paper} letterSpacing={4}>
        {text}
      </text>
    </g>
  );
};
