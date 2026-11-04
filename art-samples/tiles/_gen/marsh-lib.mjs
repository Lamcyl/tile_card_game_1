// Firefly Marsh shared helpers (dusk families, marsh water, reeds, fireflies, lilies). Used by gen-marsh.mjs and gen-marsh-objects.mjs.
import { P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, FAM, skeleton, T, shadow } from './sub.mjs';
import { wrapped } from './lib.mjs';

export const hx = (c) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
export const mixc = (a, b, u) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * u).toString(16).padStart(2, '0')).join(''); };
const fam = (key, b, w, rimc, tuftc) => ({ key, b, w, rim: rimc, tuft: tuftc });
// DUSK keeps the grass key, so its wash geometry is identical to the day grass skeleton; only the colours are tinted (indigo-rose dusk)
export const DUSK = fam('grass', '#b9c49c', ['#a9b891', '#c5c9a6', '#d1cdb6', '#b0ba9f'], '#6e8a6c', '#55794e');
export const DAWN = fam('grass', mixc(P.grass, '#b9c49c', .5), FAM.grass.w.map((c, i) => mixc(c, DUSK.w[i], .5)), '#76986a', '#5a8450');   // half-way dusk, for ramps
export const PEAT = fam('peat', '#bdb286', ['#b2a67a', '#cabf94', '#a79b70', '#d3c8a0'], '#7a6c48', '#6e7a3e');
export const MUD = fam('mud', '#b9a98a', ['#ad9c7e', '#c8b99b', '#a39379', '#d1c3a6'], '#76684e', '#7a7a48');
export const BOG = fam('bog', '#a8b47e', ['#9aa874', '#b9c48d', '#8e9c68', '#c6cc9a'], '#5f7a48', '#4d6a3c');
export const MWAT = fam('mwat', '#8db0bf', ['#80a6b8', '#9ebfcb', '#7a9eb4', '#93b0c8'], '#4a6f90', '#fff');
export const MDEEP = fam('mdeep', '#6f93ae', ['#628aa8', '#7ea3bb', '#5a82a2', '#6c93b4'], '#3f6688', '#fff');

// dusk washes: the shared skeleton plus rose and indigo sky-tint ellipses (wrapped, deterministic) so all dusk variants match
export function duskBase(F = DUSK, k = 1) {
  const r = rng(hash('dusk-tint')); let o = skeleton(F);
  for (let i = 0; i < 5; i++) { const x = r.range(0, T), y = r.range(0, T), rx = r.range(14, 26), ry = rx * r.range(.55, .8), rot = r.range(0, 180), col = i % 2 ? '#a8a2c6' : '#d6a8b4'; o += wrapped(x, y, rx, (a, b) => ell(a, b, rx, ry, col, .16 * k, rot)); }
  return o;
}
export const marshFill = (F = MWAT, k = 1) => {
  const r = rng(hash('mfill' + F.key)); let o = skeleton(F);
  for (let i = 0; i < 3; i++) { const x = r.range(0, T), y = r.range(0, T), rx = r.range(14, 22); o += wrapped(x, y, rx, (a, b) => ell(a, b, rx, rx * .45, i % 2 ? '#e8b8c8' : '#4a5f80', i % 2 ? .13 * k : .1 * k, r.range(-20, 20))); }
  for (let i = 0; i < 4; i++) { const x = r.range(0, T), y = r.range(0, T), w = r.range(9, 14); o += wrapped(x, y, 9, (a, b) => line(`M${f(a - w / 2)} ${f(b)}q${f(w / 4)}-3 ${f(w / 2)} 0t${f(w / 2)} 0`, '#eadcea', 1.1, .55)); }
  return o;
};
export const duckDots = (r, cx, cy, rx, ry, n, cols = ['#9bd070', '#7cc058', '#b4dc82']) => { let o = ''; for (let i = 0; i < n; i++) { const a = r.range(0, 6.283), d = Math.sqrt(r()); const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d; o += ell(x, y, r.range(.9, 1.5), r.range(.6, 1), r.pick(cols), .95, r.range(0, 180)); } return o; };
export const duckPatch = (r, cx, cy, rx, ry, n = 22) => ell(cx, cy, rx, ry, '#5f9a48', .3, r.range(-20, 20)) + duckDots(r, cx, cy, rx, ry, n);
// lily pad seen at an angle with a notch; bloom: null | 'pink' | 'white' | 'bud'
export function pad(x, y, rx = 7, bloom = null, col = ['#8fcf78', '#4f9a54']) {
  const ry = rx * .45; let o = ell(x + .8, y + 1.4, rx, ry, '#2c3a40', .16) + ell(x, y, rx, ry, col[1], 1, 0, ink('#2f6a3a', .7, .75)) + ell(x - rx * .15, y - ry * .2, rx * .8, ry * .7, col[0], .9)
    + path(`M${f(x)} ${f(y)}L${f(x + rx * .95)} ${f(y - ry * .45)}L${f(x + rx * .95)} ${f(y + ry * .1)}Z`, '#8fb4c0', .95) + line(`M${f(x - rx * .5)} ${f(y)}L${f(x + rx * .4)} ${f(y)}M${f(x - rx * .3)} ${f(y - ry * .5)}L${f(x + rx * .2)} ${f(y)}`, '#2f6a3a', .6, .45);
  if (bloom === 'pink' || bloom === 'white') { const c = bloom === 'pink' ? ['#fbdde6', '#e8a0bc'] : ['#fffaf0', '#e8dcc8']; for (const a of [-70, -35, 0, 35, 70]) o += ell(x - Math.sin(a * .0175) * 2.6, y - 2.4 - Math.cos(a * .0175) * 1.6, 1.3, 3, c[0], 1, a, ink(c[1], .5, .8)); o += ell(x, y - 2.8, 1.5, 1.6, '#f3c24f', 1) + ell(x, y + .2, 3, 1, c[1], .55); }
  if (bloom === 'bud') o += path(`M${f(x - 1.6)} ${f(y)}Q${f(x - 2)} ${f(y - 5)} ${f(x)} ${f(y - 7)}Q${f(x + 2)} ${f(y - 5)} ${f(x + 1.6)} ${f(y)}Z`, '#f6c6d4', 1, ink('#b0607a', .6, .8));
  return o;
}
// cattail (top 0..): stalk with a brown sausage head and a long leaf; base at (x,y)
export const cattailS = (x, y, h = 24, lean = 0, s = 1) => line(`M${f(x)} ${f(y)}q${f(lean * .4)} ${f(-h * .5)} ${f(lean)} ${f(-h)}`, '#6e8a48', 1.3 * s, .95) + line(`M${f(x + 1)} ${f(y)}q${f(lean * .2 + 4)} ${f(-h * .5)} ${f(lean * .6 + 7)} ${f(-h * .7)}`, '#7a9a54', 1.1 * s, .8)
  + path(`M${f(x + lean - 1.6 * s)} ${f(y - h + 1)}Q${f(x + lean - 2 * s)} ${f(y - h - 6 * s)} ${f(x + lean)} ${f(y - h - 9 * s)}Q${f(x + lean + 2 * s)} ${f(y - h - 6 * s)} ${f(x + lean + 1.6 * s)} ${f(y - h + 1)}Z`, '#7a4a2c', 1, ink('#3a2418', .6, .8)) + ell(x + lean - .6 * s, y - h - 5 * s, .6 * s, 2.4 * s, '#b4805a', .7) + line(`M${f(x + lean)} ${f(y - h - 9 * s)}v${f(-3 * s)}`, '#c8b078', .8, .8);
export const reedS = (x, y, h = 22, lean = 0, col = '#8ab45c', w = 1.2) => line(`M${f(x)} ${f(y)}q${f(lean * .3)} ${f(-h * .6)} ${f(lean)} ${f(-h)}`, col, w, .95) + line(`M${f(x + lean)} ${f(y - h)}l${f(lean * .25 + 1)} -5`, '#cdbf78', .9, .8);
// tapered blade for iris / sedge
export const blade = (x, y, h, lean, w = 2.2, col = '#6fa04c', dark = '#3f7a3c') => path(`M${f(x - w / 2)} ${f(y)}Q${f(x + lean * .3)} ${f(y - h * .6)} ${f(x + lean)} ${f(y - h)}Q${f(x + lean * .5 + w / 2)} ${f(y - h * .5)} ${f(x + w / 2)} ${f(y)}Z`, col, 1, ink(dark, .5, .6));
// firefly with glow: pass a shared radial gradient `gl` made once per tile via fireGrad(t)
export const fireGrad = (t, c1 = '#fffbc0', c2 = '#d8f070') => t.rg([c1, c2, c2], .5, .5, .5, [.9, .3, 0]);
export const firefly = (gl, x, y, s = 1, core = '#fffde0') => circ(x, y, 5.5 * s, gl) + circ(x, y, 1.15 * s, core, 1) + circ(x, y, .6 * s, '#fff', 1);
export const shS = (cx, cy, rx, ry) => shadow(cx, cy, rx, ry);
// water contact ring + soft shadow for objects standing in water (transparent, carries its own ripple patch)
export const wcontact = (x, y, rx, ry = rx * .3) => ell(x, y + 1, rx * 1.15, ry * 1.2, '#eadcea', .5) + ell(x, y + 1, rx * .95, ry, '#6f93ae', .5) + ell(x + 1, y + 1.5, rx * .7, ry * .6, '#2c3a40', .18);
