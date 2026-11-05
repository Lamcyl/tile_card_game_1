// Ashkara sub-area 3, Singing Erg: shared helpers (palette, wash families, tile emit, drawing kit). Self-contained: only imports the common libs.
// Palette shift: warm apricot sand with violet lee shadows. Same wash geometry as every desert family, so ground still sits seamlessly beside the common ground.
import { T, rng, hash, f, newTile, save, ell, circ, rect, path, line, ink, wrapped, tuft, blobPath, shadow } from './lib.mjs';
import { D, FAMS, dskel, dint, speckle, ripples, BLOBS, blobGeom, pad3, sh, pebbleD, rockD, block, dotsLine } from './desert-lib.mjs';
import { scatter } from './ground.mjs';
export { T, rng, hash, f, ell, circ, rect, path, line, ink, wrapped, tuft, blobPath, D, FAMS, dskel, dint, speckle, ripples, sh, pebbleD, rockD, block, dotsLine, scatter, BLOBS, blobGeom, pad3 };
export const SUB = 'singing-erg', REGION = 'ashkara';
export const mix = (a, b, u) => { const p = (s) => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * u).toString(16).padStart(2, '0')).join(''); };
// ---- families ----
export const APRI = { key: 'derg', b: '#f1cb94', w: ['#e8bc82', '#f8dcae', '#e0b074', '#fae4bc'], rim: '#c48a5a', tuft: '#a8703c' };     // rippled apricot dune sand
export const FINE = { key: 'dergf', b: '#f4d3a2', w: ['#ecc590', '#fbe5bc', '#e4ba84', '#fdeccc'], rim: '#cc9462', tuft: '#b07a44' };     // smooth wind-packed apricot
export const LEE = { key: 'dlee', b: '#d3afb5', w: ['#caa5ae', '#dfc0c5', '#bf9ba8', '#e7cbd0'], rim: '#86688a', tuft: '#8a6a7c' };       // violet-shadowed lee sand
export const SLIP = { key: 'dslip', b: '#e8b98c', w: ['#dca87a', '#f2cca0', '#d29c70', '#f6d6b0'], rim: '#b07a52', tuft: '#9a6a42' };    // steep slip face
export const CREST = { key: 'dcrest', b: '#f8deb2', w: ['#f0d0a0', '#fdecc8', '#e8c698', '#fff2d6'], rim: '#d0a26e', tuft: '#b88a54' };  // bright crest
export const LAG = { key: 'dlag', b: '#d8b890', w: ['#cca984', '#e2c6a2', '#c29e78', '#e8d2b2'], rim: '#9a7650', tuft: '#8a6a40' };        // wind-polished gravel lag
export const SOASIS = { key: 'dsoas', b: '#e6d49c', w: ['#dcc890', '#f0e2b2', '#d2bc84', '#f4e8c0'], rim: '#bf9f60', tuft: '#9a8a48' };   // Seven Palms oasis sand (to the south)
export const LUSH = { key: 'dlush', b: '#aac96c', w: ['#9cc062', '#bddb82', '#90b658', '#c8e290'], rim: '#6c9842', tuft: '#4f7f36' };     // Seven Palms grass (to the south)
export const CREAM = { key: 'dcream', b: '#f1e1b2', w: ['#e8d5a0', '#f8edca', '#e0cb96', '#f4e6bc'], rim: '#cdb078', tuft: '#b89a58' };
export const ramp = (from, to, u) => ({ key: 'dramp', b: mix(from.b, to.b, u), w: from.w.map((c, i) => mix(c, to.w[i], u)), rim: mix(from.rim, to.rim, u), tuft: mix(from.tuft, to.tuft, u) });
// wind ripples: short wavy dashes drawn wrapped so they continue across all four sides
const rd = (x, y, w, col, op, sw = 1.1) => line(`M${f(x - w / 2)} ${f(y)}q${f(w / 4)}-2.2 ${f(w / 2)} 0t${f(w / 2)} 0`, col, sw, op);
export function wind(seed, n, col, op = .5, w0 = 16, w1 = 26, hi = '#fff3d6') {
  const r = rng(seed); let o = '';
  for (let i = 0; i < n; i++) { const x = r.range(0, T), y = (i + r()) * T / n, w = r.range(w0, w1); o += wrapped(x, y, w / 2 + 3, (a, b) => rd(a, b, w, col, op) + rd(a + 1.6, b + 1.5, w * .7, hi, op * .8, .8)); }
  return o;
}
export const ergBase = () => dskel(APRI) + wind(311, 12, '#c48a5a', .42) + speckle(312, 16, ['#d8a870', '#fff0cc'], .9, .45);
export const fineBase = () => dskel(FINE) + wind(321, 6, '#cc9462', .3, 20, 30) + speckle(322, 16, ['#d8a870', '#fff0cc'], .8, .4);
export const leeBase = () => dskel(LEE) + wind(331, 8, '#8a6a7c', .32, 16, 24, '#f0d8d0') + speckle(332, 12, ['#8a6a7c', '#f0d8d0'], .8, .4);
export const slipBase = () => dskel(SLIP) + slipStreaks(341) + speckle(342, 14, ['#c08858', '#ffe8c0'], .8, .4);
export const crestBase = () => dskel(CREST) + wind(351, 5, '#d0a26e', .3, 18, 28) + speckle(352, 14, ['#e0b680', '#ffffff'], .8, .5);
export const lagBase = () => dskel(LAG) + speckle(361, 18, ['#9a7650', '#f0e0c0', '#7a5a3a'], 1.6, .75);
export const soasBase = () => dskel(SOASIS) + speckle(214, 22, ['#c9a468', '#fff3cf'], 1, .5);
// slip face streaks: short diagonal avalanche furrows (wrapped)
export function slipStreaks(seed, n = 9, col = '#b07a52') {
  const r = rng(seed); let o = '';
  for (let i = 0; i < n; i++) { const x = r.range(0, T), y = r.range(0, T), l = r.range(10, 18); o += wrapped(x, y, l, (a, b) => line(`M${f(a)} ${f(b)}q${f(l * .3)} ${f(l * .6)} ${f(l * .5)} ${f(l)}`, col, 1.2, .42) + line(`M${f(a + 1.6)} ${f(b + 1)}q${f(l * .3)} ${f(l * .6)} ${f(l * .5)} ${f(l)}`, '#fff0d0', .8, .45)); }
  return o;
}
// ---- tile emit ----
export const mkT = (cat, name, variant, w = T, h = T) => newTile({ region: REGION, sub: SUB, cat, name, variant }, w, h);
export const outT = (t, cat, name, variant, tags = []) => save(t, { region: REGION, sub: SUB, cat, name, variant, tags: [...tags, 'desert', 'singing-erg'] });
export function tile(cat, name, variant, size, tags, fn) {
  const t = mkT(cat, name, variant, size[0], size[1]); const r = rng(hash(`se/${cat}/${name}/${variant}`));
  const s = fn(t, r); if (s) t.add(s); outT(t, cat, name, variant, tags); return t;
}
export function blobSet(name, { mg = { n: 8, e: 8, s: 8, w: 8 }, R = 24, build, tags = [] }) {
  for (const m of BLOBS) { const t = mkT('edges', name, pad3(m)); build(t, blobGeom(m, mg, R), m); outT(t, 'edges', name, pad3(m), ['autotile', 'blob47', 'mask:' + m, ...tags]); }
}
export const C = [T, T], TALL = [T, 128], LG = [128, 128];
export const pts = (r, n, pad = 11, gap = 11) => scatter(r, n, pad, gap);
export function wscat(seed, n, par, draw, rad = 6) { const r = rng(seed); let o = ''; for (let i = 0; i < n; i++) { const x = r.range(0, T), y = r.range(0, T), p = par(r, i); o += wrapped(x, y, rad, (a, b) => draw(a, b, p, i)); } return o; }
export const stroke = (d, col, w, op, dx = 0, dy = 0) => `<path d="${d}" transform="translate(${dx} ${dy})" fill="none" stroke="${col}" stroke-width="${w}" stroke-opacity="${op}" stroke-linejoin="round"/>`;
// side strokes so every run of a side is continuous across tiles. dark = shaded side (S, E), light = lit side (N, W)
export const sides = (G, dark, light, wd = 13, wl = 8) => {
  const st = (d, c, w) => path(d, 'none', 1, { stroke: c[0], 'stroke-width': w * 2, 'stroke-opacity': c[1] });
  let o = '';
  if (!G.h(16)) o += st(`M${G.x0} ${G.y1}H${G.x1}`, dark, wd);
  if (!G.h(4)) o += st(`M${G.x1} ${G.y0}V${G.y1}`, dark, wd);
  if (!G.h(1)) o += st(`M${G.x0} ${G.y0}H${G.x1}`, light, wl);
  if (!G.h(64)) o += st(`M${G.x0} ${G.y0}V${G.y1}`, light, wl);
  return o;
};
export const VIO = ['#b9a2c4', '#8e7aa8', '#6a5a88'];   // violet lee shadow, light -> dark
export const AP = ['#fff0cc', '#f1cb94', '#c48a5a'];    // apricot sand, light -> dark
export const heap = (t, cx, cy, rx, ry, op = .96) => ell(cx, cy + ry * .3, rx, ry, t.lg(AP, 70), op) + ell(cx - rx * .3, cy - ry * .1, rx * .45, ry * .3, '#fff', .45, -8) + ell(cx + rx * .35, cy + ry * .55, rx * .5, ry * .3, VIO[1], .3);
export const dgrass = (x, y, s = 1, c = '#9a9a4c', op = .95) => tuft(x, y, c, op, s);
// ---- drawing kit ----
// an arc-shaped sand drift hugging the foot of an object
export const drift = (cx, cy, rx, ry, t, op = .95) => ell(cx, cy + ry * .25, rx, ry, t.lg(AP, 70), op) + ell(cx - rx * .3, cy - ry * .05, rx * .45, ry * .3, '#fff', .45, -8) + ell(cx + rx * .35, cy + ry * .5, rx * .45, ry * .3, VIO[1], .28);
// wind-chime pole: a leaning timber pole with a crossbar and a cluster of hanging chime tubes. (x,y) = foot, h = pole height, s = scale
export function chimePole(t, x, y, h = 70, s = 1, lean = 0, kind = 'bronze') {
  const topx = x + lean, topy = y - h, cols = kind === 'bronze' ? ['#f5d886', '#c8923a', '#7a5420'] : kind === 'bone' ? ['#fffaf0', '#eadcc0', '#a89070'] : ['#e8f4f0', '#8fc4c0', '#4a8088'];
  let o = ell(x + 2, y + 1, 7 * s, 2.2 * s, '#3b3a24', .22) + ell(x, y - 1, 8 * s, 3 * s, t.lg(AP, 70), 1) + ell(x + 2, y, 4.4 * s, 1.4 * s, VIO[1], .35);
  o += path(`M${f(x - 2 * s)} ${f(y - 1)}L${f(topx - 1.6 * s)} ${f(topy)}H${f(topx + 1.6 * s)}L${f(x + 2 * s)} ${f(y - 1)}Z`, t.lg(['#b8905c', '#8a6238', '#5a3c20'], 0), 1, ink(D.inkS, .8, .85));
  o += line(`M${f(topx - 9 * s)} ${f(topy + 4)}L${f(topx + 9 * s)} ${f(topy + 2)}`, '#5a3c20', 2 * s, 1) + line(`M${f(topx - 9 * s)} ${f(topy + 3.4)}L${f(topx + 9 * s)} ${f(topy + 1.4)}`, '#c8a070', .8, .8);
  for (const [dx, l, k] of [[-8, 11, 0], [-4, 16, 1], [0, 13, 2], [4, 18, 3], [8, 12, 4]]) {
    const cx = topx + dx * s, by = topy + 3.6 + (dx + 9) * -.11;
    o += line(`M${f(cx)} ${f(by)}V${f(by + 4)}`, '#5a3c20', .7, .9) + rect(cx - 1.6 * s, by + 4, 3.2 * s, l * s * .8, t.lg(cols, 0), 1.2, 1, ink('#4a3220', .6, .85)) + rect(cx - .6 * s, by + 5, .8 * s, l * s * .6, '#fff', 0, .5);
  }
  o += circ(topx, topy - .6, 1.6 * s, '#f3c24f', 1, ink('#5a3a0a', .5, .8));
  // pennant ribbon
  o += path(`M${f(topx + 1.4 * s)} ${f(topy + .4)}q${f(7 * s)} ${f(-1)} ${f(12 * s)} ${f(2 * s)}q${f(-5 * s)} ${f(2.4 * s)} ${f(-12 * s)} ${f(3.4 * s)}Z`, '#b0405a', .92, ink('#5a1a2a', .5, .8));
  return o;
}
// bleached bone (femur-like) lying at (x,y), length l, angle a
export const bone = (x, y, l, a, c = D.bone) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">` + ell(1.2, 2.2, l * .6, 1.8, '#3b3a24', .14) + path(`M${-l / 2} 0H${l / 2}`, 'none', 1, { stroke: c[1], 'stroke-width': 3, 'stroke-linecap': 'round' }) + path(`M${-l / 2} 0H${l / 2}`, 'none', 1, { stroke: c[0], 'stroke-width': 1.4, 'stroke-linecap': 'round', transform: 'translate(0 -.6)' }) + circ(-l / 2, -1.4, 2.1, c[0], 1, ink('#8a7458', .5, .8)) + circ(-l / 2, 1.4, 2.1, c[0], 1, ink('#8a7458', .5, .8)) + circ(l / 2, -1.4, 2.1, c[0], 1, ink('#8a7458', .5, .8)) + circ(l / 2, 1.4, 2.1, c[0], 1, ink('#8a7458', .5, .8)) + `</g>`;
export const rib = (x, y, l, a, c = D.bone) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">` + path(`M${-l / 2} 3Q0 ${-l * .55} ${l / 2} 3`, 'none', 1, { stroke: '#3b3a24', 'stroke-width': 2.8, 'stroke-opacity': .14, 'stroke-linecap': 'round', transform: 'translate(1 1.8)' }) + path(`M${-l / 2} 3Q0 ${-l * .55} ${l / 2} 3`, 'none', 1, { stroke: c[1], 'stroke-width': 2.6, 'stroke-linecap': 'round' }) + path(`M${-l / 2} 2.4Q0 ${-l * .55 - .6} ${l / 2} 2.4`, 'none', 1, { stroke: c[0], 'stroke-width': 1, 'stroke-linecap': 'round' }) + `</g>`;
export const skull = (x, y, s = 1, a = 0, c = D.bone) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a}) scale(${s})">` + ell(1.4, 5, 8, 2.6, '#3b3a24', .16) + path('M-7 1Q-7 -7 0 -7Q7 -7 7 1Q7 4 4 5V8H-4V5Q-7 4 -7 1Z', c[0], 1, ink('#8a7458', .8, .85)) + ell(-2.8, 0, 2, 2.4, '#4a3a2a', 1) + ell(2.8, 0, 2, 2.4, '#4a3a2a', 1) + path('M-.8 3.4L0 1.8L.8 3.4Z', '#6a5a46', 1) + line('M-3 6.4v1.6M-1 6.4v1.6M1 6.4v1.6M3 6.4v1.6', '#8a7458', .7, .8) + `</g>`;
// scarab beetle seen from above, at (x,y), rotated a
export const scarab = (x, y, s = 1, a = 0, c = '#2a3a5a') => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a}) scale(${s})">` + ell(.6, 1.2, 2.4, 3, '#3b3a24', .22) + line('M-2 -1l-2.4 -1M-2 1l-2.6 0M-2 3l-2.2 1.6M2 -1l2.4 -1M2 1l2.6 0M2 3l2.2 1.6', '#1a1a2a', .7, .9) + ell(0, 0, 2.3, 3, c, 1, 0, ink('#0a0a1a', .4, .9)) + line('M0 -2.6V2.8', '#0a0a1a', .5, .8) + ell(-.7, -1, .8, 1.2, '#7aa8d8', .8) + circ(0, -3.4, 1.1, '#1a1a2a') + `</g>`;
// sand-blasted rock mass in apricot tones with violet lee side
export const ERGROCK = ['#fbe2b8', '#d8a572', '#946a52'];
export function erock(t, r, cx, cy, rx, ry, facets = 3) {
  let o = sh(cx + 2, cy + ry * .75, rx * 1.05, ry * .35);
  const d = blobPath(r, cx, cy, rx, ry, 8, .13);
  o += path(d, t.lg(ERGROCK, 55), 1, ink(D.inkS, 1, .8));
  o += path(`M${f(cx - rx * .8)} ${f(cy - ry * .1)}Q${f(cx - rx * .6)} ${f(cy - ry * .9)} ${f(cx + rx * .1)} ${f(cy - ry * .85)}Q${f(cx - rx * .3)} ${f(cy - ry * .5)} ${f(cx - rx * .8)} ${f(cy - ry * .1)}Z`, '#fff', .32);
  o += path(`M${f(cx + rx * .2)} ${f(cy + ry * .1)}Q${f(cx + rx * .8)} ${f(cy)} ${f(cx + rx * .9)} ${f(cy + ry * .3)}Q${f(cx + rx * .6)} ${f(cy + ry * .75)} ${f(cx)} ${f(cy + ry * .8)}Z`, VIO[1], .26);
  for (let i = 0; i < 2; i++) o += line(`M${f(cx - rx * .85)} ${f(cy + ry * (-.1 + i * .38))}q${f(rx * .8)} ${f(ry * .16)} ${f(rx * 1.7)} ${f(-ry * .04)}`, ERGROCK[2], 1, .38);
  for (let i = 0; i < facets; i++) o += line(`M${f(cx + r.range(-rx * .5, rx * .6))} ${f(cy + r.range(-ry * .3, ry * .2))}l${f(r.range(-4, 4))} ${f(r.range(3, 8))}`, ERGROCK[2], 1.1, .45);
  return o;
}
