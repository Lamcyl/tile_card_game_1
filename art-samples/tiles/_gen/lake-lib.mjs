// Mirror Lake drawing helpers: reflections, lily pads, lotus blooms.
import { P, f, ell, circ, path, line, ink } from './sub.mjs';
// ---- shared drawing bits (exported for the objects file) ----
// wobbly vertical reflection column: soft wavy-sided strip, light at the top fading downwards
export const refl = (x, y, w, h, col, op = .3, ph = 0) => { let l = '', rr = ''; const n = Math.max(2, Math.round(h / 5)); for (let i = 0; i <= n; i++) { const yy = y + h * i / n, wob = Math.sin(i * 1.7 + ph) * 1.2; l += `${i ? 'L' : 'M'}${f(x - w / 2 + wob)} ${f(yy)}`; } for (let i = n; i >= 0; i--) { const yy = y + h * i / n, wob = Math.sin(i * 1.7 + ph + 1) * 1.2; rr += `L${f(x + w / 2 + wob)} ${f(yy)}`; } return `<path d="${l}${rr}Z" fill="${col}" opacity="${op}"/>`; };
export const lilyPad = (x, y, r = 6, rot = 0, col = ['#8fd078', '#4a9a50'], notch = 40, shadow = true) => {
  const a0 = (rot + notch / 2) * Math.PI / 180, a1 = (rot - notch / 2 + 360) * Math.PI / 180, X = (a) => f(x + Math.cos(a) * r), Y = (a) => f(y + Math.sin(a) * r * .62);
  return (shadow ? ell(x + .8, y + 1.4, r, r * .62, '#1d4a63', .16) : '') + `<path d="M${f(x)} ${f(y)}L${X(a0)} ${Y(a0)}A${f(r)} ${f(r * .62)} 0 1 1 ${X(a1)} ${Y(a1)}Z" fill="${col[0]}" stroke="${col[1]}" stroke-width=".7" stroke-opacity=".8"/>` + line(`M${f(x)} ${f(y)}l${f(Math.cos(a0 + 1.4) * r * .7)} ${f(Math.sin(a0 + 1.4) * r * .45)}M${f(x)} ${f(y)}l${f(Math.cos(a0 + 3) * r * .7)} ${f(Math.sin(a0 + 3) * r * .45)}`, col[1], .5, .5);
};
export const lotusBloom = (x, y, s = 1, kind = 'pink', open = 1) => {
  const C = kind === 'pink' ? ['#fff0f4', '#f6a8c0', '#d0688a'] : ['#ffffff', '#f6f0e0', '#c9c0a8'], n = open > .6 ? 7 : 5; let o = '';
  for (const side of [-1, 1]) for (let i = 0; i < 2; i++) o += path(`M${f(x)} ${f(y)}Q${f(x + side * (9 - i * 2) * s)} ${f(y - (4 + i * 2) * s)} ${f(x + side * (7 - i * 3) * s)} ${f(y - (12 - i * 1) * s)}Q${f(x + side * 1.5 * s)} ${f(y - 5 * s)} ${f(x)} ${f(y)}Z`, C[i + (kind === 'pink' ? 0 : 0)] , 1, ink(C[2], .5, .7));
  o += path(`M${f(x)} ${f(y)}Q${f(x - 5 * s)} ${f(y - 8 * s)} ${f(x)} ${f(y - 15 * s * (open > .6 ? 1 : .8))}Q${f(x + 5 * s)} ${f(y - 8 * s)} ${f(x)} ${f(y)}Z`, C[0], 1, ink(C[2], .6, .75));
  if (open > .6) o += circ(x, y - 4 * s, 2.2 * s, '#f3c24f', 1, ink('#a07a1c', .4, .6)) + ell(x - 2 * s, y - 8 * s, 1.2 * s, 3 * s, '#fff', .5, 20);
  return o;
};
export const PADC = [['#8fd078', '#4a9a50'], ['#7cc468', '#3f8a48'], ['#a8dc88', '#5fae5c'], ['#6fb560', '#356f46']];
