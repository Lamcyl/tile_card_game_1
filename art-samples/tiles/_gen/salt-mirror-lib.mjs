// Ashkara sub-area 4, Salt Mirror: shared helpers (palette, wash families, tile emit, drawing kit). Self-contained: only imports the common libs.
// Palette shift: near-white bleached ground, pink brine, hard cold light (cool blue-violet shade). Same wash geometry as every desert family, so ground sits seamlessly beside the common ground.
import { T, rng, hash, f, newTile, save, ell, circ, rect, path, line, ink, wrapped, tuft, blobPath, shadow } from './lib.mjs';
import { D, FAMS, dskel, dint, speckle, ripples, crackNet, BLOBS, blobGeom, pad3, sh, pebbleD, rockD, block, dotsLine } from './desert-lib.mjs';
import { scatter } from './ground.mjs';
export { T, rng, hash, f, ell, circ, rect, path, line, ink, wrapped, tuft, blobPath, D, FAMS, dskel, dint, speckle, ripples, crackNet, sh, pebbleD, rockD, block, dotsLine, scatter, BLOBS, blobGeom, pad3 };
export const SUB = 'salt-mirror', REGION = 'ashkara';
export const mix = (a, b, u) => { const p = (s) => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * u).toString(16).padStart(2, '0')).join(''); };
// ---- families ----
export const SALT = { key: 'dsalt', b: '#f2ebe0', w: ['#e9e1d4', '#fbf6ee', '#e0d8cb', '#fffcf6'], rim: '#c9bcab', tuft: '#a89c88' };      // blinding salt crust
export const PAN = { key: 'dbpan', b: '#e0d2bf', w: ['#d6c7b2', '#eadecb', '#cdbda7', '#f0e6d6'], rim: '#a8957a', tuft: '#8f7e64' };       // bleached hardpan
export const MUD = { key: 'dmud', b: '#d8c2bc', w: ['#cdb5b0', '#e4d0ca', '#c2aaa6', '#eadad4'], rim: '#9a7c7c', tuft: '#8a6c6c' };        // pink-grey salt mud
export const GYP = { key: 'dgyp', b: '#e8e6ee', w: ['#dedce8', '#f4f2fa', '#d4d2e0', '#fafaff'], rim: '#aaa6bc', tuft: '#8a86a0' };        // cool gypsum flour
export const BRSH = { key: 'dbrs', b: '#eca7b8', w: ['#e594a9', '#f6c0cc', '#dc8aa0', '#fad2da'], rim: '#b4566f', tuft: '#fff' };           // shallow pink brine
export const BRDP = { key: 'dbrd', b: '#d27090', w: ['#c85f82', '#de88a4', '#bc5276', '#e69ab2'], rim: '#8e3a5e', tuft: '#fff' };           // deep rose brine
export const MIRG = { key: 'dmir', b: '#dfeaf0', w: ['#d2e2ec', '#eef6fa', '#c6dae6', '#f8fcff'], rim: '#8aaabf', tuft: '#fff' };           // wet glassy flat that holds the sky
export const APRI = { key: 'derg', b: '#f1cb94', w: ['#e8bc82', '#f8dcae', '#e0b074', '#fae4bc'], rim: '#c48a5a', tuft: '#a8703c' };       // Singing Erg sand (to the west)
export const CREAM = { key: 'dcream', b: '#f1e1b2', w: ['#e8d5a0', '#f8edca', '#e0cb96', '#f4e6bc'], rim: '#cdb078', tuft: '#b89a58' };    // Dune Shallows sand (south shore)
export const RED = { key: 'dred', b: '#e0b99a', w: ['#d6aa88', '#ecccb0', '#cc9e7c', '#f2d8c0'], rim: '#a8745a', tuft: '#8c5a40' };         // Red Wadi shelves (to the north)
export const ramp = (from, to, u) => ({ key: 'dramp', b: mix(from.b, to.b, u), w: from.w.map((c, i) => mix(c, to.w[i], u)), rim: mix(from.rim, to.rim, u), tuft: mix(from.tuft, to.tuft, u) });
const hl = (x, y, w, col, op, sw = 1.1) => line(`M${f(x - w / 2)} ${f(y)}q${f(w / 4)}-1.8 ${f(w / 2)} 0t${f(w / 2)} 0`, col, sw, op);
// flat glare streaks (wrapped)
export function glare(seed, n, col, op = .5, w0 = 14, w1 = 24) { const r = rng(seed); let o = ''; for (let i = 0; i < n; i++) { const x = r.range(0, T), y = (i + r()) * T / n, w = r.range(w0, w1); o += wrapped(x, y, w / 2 + 3, (a, b) => hl(a, b, w, col, op)); } return o; }
export const saltBase = () => dskel(SALT) + speckle(411, 22, ['#d8cdbd', '#ffffff'], 1, .55);
export const polyBase = (seed = 421) => dskel(SALT) + crackNet(seed, '#b3a392', .5) + speckle(seed + 1, 12, ['#ffffff'], .9, .7);
export const flatBase = () => dskel(SALT) + glare(412, 3, '#ffffff', .6, 20, 30) + speckle(413, 10, ['#ffffff'], .8, .5);
export const panBase = (seed = 431) => dskel(PAN) + crackNet(seed, '#8f7a62', .6) + speckle(seed + 1, 12, ['#fff6e6', '#a8957a'], 1, .5);
export const mudBase = () => dskel(MUD) + speckle(441, 16, ['#9a7c7c', '#f2e2dc'], 1, .45);
export const gypBase = () => dskel(GYP) + speckle(451, 18, ['#ffffff', '#aaa6bc'], 1, .55);
export const brineBase = () => dskel(BRSH) + ripples(461, 7, '#fff4f6', .6, 10, 16) + ripples(462, 4, '#b4566f', .22, 10, 14);
export const deepBase = () => dskel(BRDP) + ripples(471, 6, '#f6c0cc', .45, 10, 16) + ripples(472, 4, '#6a2442', .25, 10, 14);
export const mirageBase = () => dskel(MIRG) + glare(481, 5, '#ffffff', .8, 16, 28) + glare(482, 3, '#8aaabf', .25, 14, 22);
export const sandSaltBase = () => dskel(ramp(FAMS.sand, SALT, .45)) + speckle(491, 20, ['#ffffff', '#c9a468'], 1, .55);
// ---- tile emit ----
export const mkT = (cat, name, variant, w = T, h = T) => newTile({ region: REGION, sub: SUB, cat, name, variant }, w, h);
export const outT = (t, cat, name, variant, tags = []) => save(t, { region: REGION, sub: SUB, cat, name, variant, tags: [...tags, 'desert', 'salt-mirror'] });
export function tile(cat, name, variant, size, tags, fn) {
  const t = mkT(cat, name, variant, size[0], size[1]); const r = rng(hash(`sm/${cat}/${name}/${variant}`));
  const s = fn(t, r); if (s) t.add(s); outT(t, cat, name, variant, tags); return t;
}
export function blobSet(name, { mg = { n: 8, e: 8, s: 8, w: 8 }, R = 24, build, tags = [] }) {
  for (const m of BLOBS) { const t = mkT('edges', name, pad3(m)); build(t, blobGeom(m, mg, R), m); outT(t, 'edges', name, pad3(m), ['autotile', 'blob47', 'mask:' + m, ...tags]); }
}
export const C = [T, T], TALL = [T, 128], LG = [128, 128];
export const pts = (r, n, pad = 11, gap = 11) => scatter(r, n, pad, gap);
export function wscat(seed, n, par, draw, rad = 6) { const r = rng(seed); let o = ''; for (let i = 0; i < n; i++) { const x = r.range(0, T), y = r.range(0, T), p = par(r, i); o += wrapped(x, y, rad, (a, b) => draw(a, b, p, i)); } return o; }
export const stroke = (d, col, w, op, dx = 0, dy = 0) => `<path d="${d}" transform="translate(${dx} ${dy})" fill="none" stroke="${col}" stroke-width="${w}" stroke-opacity="${op}" stroke-linejoin="round"/>`;
export const sides = (G, dark, light, wd = 13, wl = 8) => {
  const st = (d, c, w) => path(d, 'none', 1, { stroke: c[0], 'stroke-width': w * 2, 'stroke-opacity': c[1] });
  let o = '';
  if (!G.h(16)) o += st(`M${G.x0} ${G.y1}H${G.x1}`, dark, wd);
  if (!G.h(4)) o += st(`M${G.x1} ${G.y0}V${G.y1}`, dark, wd);
  if (!G.h(1)) o += st(`M${G.x0} ${G.y0}H${G.x1}`, light, wl);
  if (!G.h(64)) o += st(`M${G.x0} ${G.y0}V${G.y1}`, light, wl);
  return o;
};
export const arms = (m, cx, cy) => { const a = []; if (m & 8) a.push([0, cy, cx, cy]); if (m & 2) a.push([cx, cy, 64, cy]); if (m & 1) a.push([cx, 0, cx, cy]); if (m & 4) a.push([cx, cy, cx, 64]); return a; };
// ---- colour ramps (light -> dark) ----
export const SLT = ['#ffffff', '#f2ebe0', '#b9a8a4'];      // salt, cold pink-grey shade
export const CLD = ['#cfd0e4', '#9a98b8', '#6e6c92'];      // cold blue-violet shade
export const PNK = ['#fbd5de', '#e690a8', '#a8486a'];      // brine
export const BONE = ['#fffaf0', '#eadcc0', '#bfa888'];
export const RUST = ['#d89a74', '#a8603c', '#6a3a24'];
export const IRON = ['#b8aeb0', '#7e7478', '#4a4448'];
export const WOODS = ['#c9b79a', '#9a8264', '#62503a'];    // salt-bleached timber
export const STONE = ['#f4dcb0', '#dcae7c', '#a97a52'];
// low heap of salt at a foot
export const mound = (t, cx, cy, rx, ry, op = .96) => ell(cx, cy + ry * .3, rx, ry, t.lg(SLT, 70), op) + ell(cx - rx * .3, cy - ry * .1, rx * .45, ry * .3, '#fff', .6, -8) + ell(cx + rx * .35, cy + ry * .55, rx * .5, ry * .3, CLD[1], .26);
export const crust = (cx, cy, rx, ry, t, op = .95) => ell(cx, cy + ry * .25, rx, ry, t.lg(SLT, 70), op) + ell(cx - rx * .3, cy - ry * .05, rx * .45, ry * .3, '#fff', .6, -8) + ell(cx + rx * .35, cy + ry * .5, rx * .45, ry * .3, CLD[1], .22);
export const brineEdge = (cx, cy, rx, ry, op = .5) => ell(cx, cy, rx, ry, '#e690a8', op) + ell(cx - 1, cy - 1, rx * .7, ry * .6, '#fbd5de', op * .8);
// pointed salt crystal (hex prism): base (x,y), height h, width w, tilt a
export const crystal = (x, y, h, w, a = 0, cols = ['#ffffff', '#e6dcf0', '#a89cc0']) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">` + path(`M${-w / 2} 0L${-w / 2 + .5} ${-h * .78}L0 ${-h}L${w / 2 - .5} ${-h * .78}L${w / 2} 0Z`, cols[1], 1, ink('#7a6e98', .8, .8)) + path(`M${-w / 2} 0L${-w / 2 + .5} ${-h * .78}L0 ${-h}L${-w * .05} 0Z`, cols[0], .9) + path(`M${w * .2} 0L${w * .2} ${-h * .84}L${w / 2 - .5} ${-h * .78}L${w / 2} 0Z`, cols[2], .55) + `</g>`;
// bleached bone (femur) and skull
export const bone = (x, y, l, a, c = BONE) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">` + ell(1.2, 2.2, l * .6, 1.8, '#3b3a24', .14) + path(`M${-l / 2} 0H${l / 2}`, 'none', 1, { stroke: c[1], 'stroke-width': 3, 'stroke-linecap': 'round' }) + path(`M${-l / 2} 0H${l / 2}`, 'none', 1, { stroke: c[0], 'stroke-width': 1.4, 'stroke-linecap': 'round', transform: 'translate(0 -.6)' }) + [-1.4, 1.4].map(d => circ(-l / 2, d, 2.1, c[0], 1, ink('#8a7458', .5, .8)) + circ(l / 2, d, 2.1, c[0], 1, ink('#8a7458', .5, .8))).join('') + `</g>`;
export const rib = (x, y, l, a, c = BONE) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">` + path(`M${-l / 2} 3Q0 ${-l * .55} ${l / 2} 3`, 'none', 1, { stroke: '#3b3a24', 'stroke-width': 2.8, 'stroke-opacity': .14, 'stroke-linecap': 'round', transform: 'translate(1 1.8)' }) + path(`M${-l / 2} 3Q0 ${-l * .55} ${l / 2} 3`, 'none', 1, { stroke: c[1], 'stroke-width': 2.6, 'stroke-linecap': 'round' }) + path(`M${-l / 2} 2.4Q0 ${-l * .55 - .6} ${l / 2} 2.4`, 'none', 1, { stroke: c[0], 'stroke-width': 1, 'stroke-linecap': 'round' }) + `</g>`;
export const skull = (x, y, s = 1, a = 0, c = BONE) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a}) scale(${s})">` + ell(1.4, 5, 8, 2.6, '#3b3a24', .16) + path('M-7 1Q-7 -7 0 -7Q7 -7 7 1Q7 4 4 5V8H-4V5Q-7 4 -7 1Z', c[0], 1, ink('#8a7458', .8, .85)) + ell(-2.8, 0, 2, 2.4, '#4a3a2a', 1) + ell(2.8, 0, 2, 2.4, '#4a3a2a', 1) + path('M-.8 3.4L0 1.8L.8 3.4Z', '#6a5a46', 1) + line('M-3 6.4v1.6M-1 6.4v1.6M1 6.4v1.6M3 6.4v1.6', '#8a7458', .7, .8) + `</g>`;
// cow / ox skull with horns (sun-bleached), bigger
export const hornSkull = (x, y, s = 1, a = 0) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a}) scale(${s})">` + ell(1.4, 7, 11, 3, '#3b3a24', .16) + path('M-8 -2Q-16 -4 -14 -11Q-12 -6 -6 -5Z', BONE[1], 1, ink('#8a7458', .7, .85)) + path('M8 -2Q16 -4 14 -11Q12 -6 6 -5Z', BONE[1], 1, ink('#8a7458', .7, .85)) + path('M-6 -4Q0 -8 6 -4Q7 3 4 8L0 10L-4 8Q-7 3 -6 -4Z', BONE[0], 1, ink('#8a7458', .8, .85)) + ell(-2.6, 0, 1.9, 2.3, '#4a3a2a') + ell(2.6, 0, 1.9, 2.3, '#4a3a2a') + path('M-1.4 6h2.8v2h-2.8Z', '#6a5a46') + `</g>`;
// salt-sculpted rock mass (white with a cold violet shaded side and a pink brine stain at the foot)
export const SROCK = ['#ffffff', '#e8dfd4', '#a89aa4'];
export function srock(t, r, cx, cy, rx, ry, facets = 3, stain = true) {
  let o = sh(cx + 2, cy + ry * .75, rx * 1.05, ry * .35);
  const d = blobPath(r, cx, cy, rx, ry, 8, .13);
  o += path(d, t.lg(SROCK, 55), 1, ink('#7a6e84', 1, .75));
  o += path(`M${f(cx - rx * .8)} ${f(cy - ry * .1)}Q${f(cx - rx * .6)} ${f(cy - ry * .9)} ${f(cx + rx * .1)} ${f(cy - ry * .85)}Q${f(cx - rx * .3)} ${f(cy - ry * .5)} ${f(cx - rx * .8)} ${f(cy - ry * .1)}Z`, '#fff', .6);
  o += path(`M${f(cx + rx * .2)} ${f(cy + ry * .1)}Q${f(cx + rx * .8)} ${f(cy)} ${f(cx + rx * .9)} ${f(cy + ry * .3)}Q${f(cx + rx * .6)} ${f(cy + ry * .75)} ${f(cx)} ${f(cy + ry * .8)}Z`, CLD[1], .26);
  if (stain) o += ell(cx, cy + ry * .78, rx * .8, ry * .2, '#e690a8', .35);
  for (let i = 0; i < facets; i++) o += line(`M${f(cx + r.range(-rx * .5, rx * .6))} ${f(cy + r.range(-ry * .3, ry * .2))}l${f(r.range(-4, 4))} ${f(r.range(3, 8))}`, SROCK[2], 1.1, .45);
  return o;
}
// a salt block (3/4 view)
export const sblock = (t, x, y, w, h, td = 4) => block(t, x, y, w, h, '#ffffff', ['#fffdf8', '#e8dfd4', '#a89aa4'], td, '#7a6e84');
