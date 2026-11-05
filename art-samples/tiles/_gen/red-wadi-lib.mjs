// Ashkara sub-area 5, Red Wadi: shared helpers (palette, wash families, tile emit, drawing kit). Self-contained: only imports the common libs.
// Palette shift: deep terracotta and ochre with blue-violet shade. Same wash geometry as every desert family, so ground sits seamlessly beside the common ground.
import { T, rng, hash, f, newTile, save, ell, circ, rect, path, line, ink, wrapped, tuft, blobPath, shadow } from './lib.mjs';
import { D, FAMS, dskel, dint, speckle, ripples, crackNet, BLOBS, blobGeom, pad3, sh, pebbleD, rockD, block, dotsLine } from './desert-lib.mjs';
import { scatter } from './ground.mjs';
export { T, rng, hash, f, ell, circ, rect, path, line, ink, wrapped, tuft, blobPath, D, FAMS, dskel, dint, speckle, ripples, crackNet, sh, pebbleD, rockD, block, dotsLine, scatter, BLOBS, blobGeom, pad3 };
export const SUB = 'red-wadi', REGION = 'ashkara';
export const mix = (a, b, u) => { const p = (s) => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * u).toString(16).padStart(2, '0')).join(''); };
// ---- families ----
export const TERRA = { key: 'rterra', b: '#dcab88', w: ['#d19c78', '#e8c0a0', '#c78e6c', '#efcdb0'], rim: '#a06a4c', tuft: '#8c5238' };      // terracotta sandstone shelf
export const OCHRE = { key: 'rochre', b: '#e2b588', w: ['#d8a878', '#eecca2', '#cf9c6a', '#f2d6b0'], rim: '#b07c48', tuft: '#98702c' };      // ochre sand and rock
export const RSAND = { key: 'rsand', b: '#e6bc94', w: ['#dcae84', '#f0cca8', '#d2a27a', '#f4d6b8'], rim: '#b07c58', tuft: '#9a6844' };      // red wind-blown sand
export const WGRV = { key: 'rgrv', b: '#c8a888', w: ['#bb9a7a', '#d6bb9c', '#af8e70', '#dcc6aa'], rim: '#8a6a50', tuft: '#7a5c44' };        // dry river gravel (reg)
export const CLAYR = { key: 'rclay', b: '#cf9674', w: ['#c48868', '#dcaa8a', '#b87c5c', '#e2b79a'], rim: '#8e5a3e', tuft: '#7a4a32' };    // baked red clay
export const SHADE = { key: 'rshade', b: '#c2a0a6', w: ['#b494a0', '#cdb2b8', '#a88a98', '#d6c0c4'], rim: '#7c6678', tuft: '#6a5668' };    // canyon floor in blue shade
export const SILT = { key: 'rsilt', b: '#d8b8a0', w: ['#cdab92', '#e4c8b2', '#c2a086', '#ead4c0'], rim: '#9a7a62', tuft: '#8a6a52' };        // flood silt
export const WPOOL = { key: 'rpool', b: '#8fb0a8', w: ['#82a49e', '#a2c2ba', '#769890', '#b4d0c8'], rim: '#4a7470', tuft: '#fff' };         // still wadi pool, green-grey
export const SALT = { key: 'dsalt', b: '#f2ebe0', w: ['#e9e1d4', '#fbf6ee', '#e0d8cb', '#fffcf6'], rim: '#c9bcab', tuft: '#a89c88' };       // Salt Mirror crust (south)
export const BAZ = { key: 'rbaz', b: '#d6b8a0', w: ['#cba993', '#e2c8b4', '#bf9c88', '#e8d2c2'], rim: '#9a7864', tuft: '#8a6854' };           // Dust Bazaar packed earth (west)
export const GOLD = { key: 'rgold', b: '#ecdcae', w: ['#e2cf9c', '#f4e8c4', '#d8c490', '#f6ecc8'], rim: '#c2a870', tuft: '#a89058' };        // Sun Citadel pale gold (north-east)
export const ramp = (from, to, u) => ({ key: 'dramp', b: mix(from.b, to.b, u), w: from.w.map((c, i) => mix(c, to.w[i], u)), rim: mix(from.rim, to.rim, u), tuft: mix(from.tuft, to.tuft, u) });
const hl = (x, y, w, col, op, sw = 1.1) => line(`M${f(x - w / 2)} ${f(y)}q${f(w / 4)}-1.8 ${f(w / 2)} 0t${f(w / 2)} 0`, col, sw, op);
export function streaks(seed, n, col, op = .4, w0 = 14, w1 = 24) { const r = rng(seed); let o = ''; for (let i = 0; i < n; i++) { const x = r.range(0, T), y = (i + r()) * T / n, w = r.range(w0, w1); o += wrapped(x, y, w / 2 + 3, (a, b) => hl(a, b, w, col, op)); } return o; }
// wrapped horizontal strata bands (periodic in y)
export function strata(seed, cols, n = 5, op = .35) { const r = rng(seed); let o = ''; for (let i = 0; i < n; i++) { const y = (i + r.range(.1, .8)) * T / n, h = r.range(2.5, 5), c = cols[i % cols.length]; for (const oy of [-T, 0, T]) o += `<path d="M-2 ${f(y + oy)}Q16 ${f(y + oy + r.range(-1.6, 1.6))} 32 ${f(y + oy)}T66 ${f(y + oy)}V${f(y + oy + h)}Q48 ${f(y + oy + h + r.range(-1.4, 1.4))} 32 ${f(y + oy + h)}T-2 ${f(y + oy + h)}Z" fill="${c}" opacity="${op}"/>`; } return o; }
export const terraBase = () => dskel(TERRA) + speckle(511, 20, ['#a06a4c', '#f4d8c0'], 1, .45);
export const stratBase = (seed = 521) => dskel(TERRA) + strata(seed, ['#c47e56', '#efcdb0', '#a8664c', '#f0c898'], 5, .3);
export const ochreBase = () => dskel(OCHRE) + speckle(531, 22, ['#b08040', '#fbe6b8'], 1, .5) + ripples(532, 3, '#b08040', .3, 12, 18);
export const rsandBase = () => dskel(RSAND) + ripples(541, 6, '#b07c58', .38) + speckle(542, 14, ['#fbe0c4'], 1, .5);
export const wgrvBase = () => dskel(WGRV) + speckle(551, 34, ['#8a6a50', '#e8d4bc', '#6e5240', '#c49a78'], 1.6, .7);
export const clayBase = (seed = 561) => dskel(CLAYR) + crackNet(seed, '#6e3a28', .6) + speckle(seed + 1, 10, ['#e8c0a4'], .9, .5);
export const shadeBase = () => dskel(SHADE) + speckle(571, 18, ['#7c6678', '#e0d0d6'], 1, .45);
export const siltBase = () => dskel(SILT) + ripples(581, 6, '#9a7a62', .35) + speckle(582, 12, ['#f2dcc8'], .9, .5);
export const poolBase = () => dskel(WPOOL) + ripples(591, 7, '#e6f6f0', .55, 10, 16) + ripples(592, 4, '#4a7470', .22, 10, 14);
// ---- tile emit ----
export const mkT = (cat, name, variant, w = T, h = T) => newTile({ region: REGION, sub: SUB, cat, name, variant }, w, h);
export const outT = (t, cat, name, variant, tags = []) => save(t, { region: REGION, sub: SUB, cat, name, variant, tags: [...tags, 'desert', 'red-wadi'] });
export function tile(cat, name, variant, size, tags, fn) {
  const t = mkT(cat, name, variant, size[0], size[1]); const r = rng(hash(`rw/${cat}/${name}/${variant}`));
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
export const TER = ['#f0c8a4', '#c47e56', '#8c4e36'];      // terracotta
export const DEEP = ['#c8805e', '#9a5038', '#5e2c20'];     // deep red rock in shade
export const OCH = ['#f8e0b0', '#e0b070', '#a87a44'];      // ochre
export const BLU = ['#c8c8e4', '#8e90b8', '#5e6088'];      // blue-violet shade
export const WOODS = ['#b8905c', '#8a6238', '#5a3c20'];
export const ROPE = ['#e8d4a4', '#b89a60', '#7a6238'];
export const BONE = ['#fffaf0', '#eadcc0', '#bfa888'];
export const STONE = ['#f4dcb0', '#dcae7c', '#a97a52'];
export const GRN = ['#c8d68a', '#8aa05c', '#4a6a34'];      // wadi greens (tamarisk, juniper)
// low heap of red rubble / sand at a foot
export const mound = (t, cx, cy, rx, ry, op = .96) => ell(cx, cy + ry * .3, rx, ry, t.lg(['#efc8a0', '#d19c78', '#b07c58'], 70), op) + ell(cx - rx * .3, cy - ry * .1, rx * .45, ry * .3, '#fbe0c4', .6, -8) + ell(cx + rx * .35, cy + ry * .55, rx * .5, ry * .3, BLU[1], .22);
// red rock mass with blue shade side, strata lines and a pale lit top-left
export function rrock(t, r, cx, cy, rx, ry, facets = 3, cols = TER) {
  let o = sh(cx + 2, cy + ry * .75, rx * 1.05, ry * .35);
  const d = blobPath(r, cx, cy, rx, ry, 8, .13);
  o += path(d, t.lg(cols, 55), 1, ink('#5a2a20', 1, .8));
  o += path(`M${f(cx - rx * .8)} ${f(cy - ry * .1)}Q${f(cx - rx * .6)} ${f(cy - ry * .9)} ${f(cx + rx * .1)} ${f(cy - ry * .85)}Q${f(cx - rx * .3)} ${f(cy - ry * .5)} ${f(cx - rx * .8)} ${f(cy - ry * .1)}Z`, '#fbe0c4', .38);
  o += path(`M${f(cx + rx * .2)} ${f(cy + ry * .1)}Q${f(cx + rx * .8)} ${f(cy)} ${f(cx + rx * .9)} ${f(cy + ry * .3)}Q${f(cx + rx * .6)} ${f(cy + ry * .75)} ${f(cx)} ${f(cy + ry * .8)}Z`, BLU[2], .26);
  for (let i = 0; i < 2; i++) o += line(`M${f(cx - rx * .85)} ${f(cy + ry * (-.1 + i * .4))}q${f(rx * .8)} ${f(ry * .16)} ${f(rx * 1.7)} ${f(-ry * .04)}`, cols[2], 1, .4);
  for (let i = 0; i < facets; i++) o += line(`M${f(cx + r.range(-rx * .5, rx * .6))} ${f(cy + r.range(-ry * .3, ry * .2))}l${f(r.range(-4, 4))} ${f(r.range(3, 8))}`, cols[2], 1.1, .45);
  return o;
}
// a cut sandstone block (3/4 view) in red stone
export const rblock = (t, x, y, w, h, td = 4) => block(t, x, y, w, h, '#f0c8a4', ['#f0c8a4', '#c47e56', '#8c4e36'], td, '#5a2a20');
// banded cliff column (front face only) between x0..x1, from y0 down to y1, with strata lines; used by facade/hoodoo
export function bands(t, x0, x1, y0, y1, seed, cols = ['#e8b48a', '#c47e56', '#a8664c', '#d9996e', '#8c4e36']) { const r = rng(seed); let o = '', y = y0; let i = 0; while (y < y1) { const h = Math.min(r.range(5, 11), y1 - y); o += rect(x0, y, x1 - x0, h + .4, cols[i % cols.length], 0, .9); y += h; i++; } return o; }
export const dust = (cx, cy, rx, ry, op = .3) => ell(cx, cy, rx, ry, '#f0c8a4', op) + ell(cx + 2, cy - 1, rx * .6, ry * .6, '#fbe0c4', op * .8);
export const bone = (x, y, l, a, c = BONE) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">` + ell(1.2, 2.2, l * .6, 1.8, '#3b2a24', .14) + path(`M${-l / 2} 0H${l / 2}`, 'none', 1, { stroke: c[1], 'stroke-width': 3, 'stroke-linecap': 'round' }) + circ(-l / 2, -1, 2, c[0], 1, ink('#8a7458', .5, .8)) + circ(-l / 2, 1.4, 2, c[0], 1, ink('#8a7458', .5, .8)) + circ(l / 2, -1, 2, c[0], 1, ink('#8a7458', .5, .8)) + circ(l / 2, 1.4, 2, c[0], 1, ink('#8a7458', .5, .8)) + `</g>`;
export const skull = (x, y, s = 1, a = 0, c = BONE) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a}) scale(${s})">` + ell(1.4, 5, 8, 2.6, '#3b2a24', .16) + path('M-7 1Q-7 -7 0 -7Q7 -7 7 1Q7 4 4 5V8H-4V5Q-7 4 -7 1Z', c[0], 1, ink('#8a7458', .8, .85)) + circ(-2.6, 0, 1.7, '#3a2a20') + circ(2.6, 0, 1.7, '#3a2a20') + path('M0 2.4L-1 4.4H1Z', '#3a2a20') + line('M-2 6.2V8M0 6.2V8M2 6.2V8', '#8a7458', .7, .8) + `</g>`;
// a clay jar / amphora
export const jar = (t, x, y, s = 1) => ell(x + 2 * s, y + 2, 7 * s, 2 * s, '#3b2a24', .16) + path(`M${f(x - 3 * s)} ${f(y - 11 * s)}H${f(x + 3 * s)}L${f(x + 3.4 * s)} ${f(y - 8 * s)}Q${f(x + 8 * s)} ${f(y - 6 * s)} ${f(x + 7 * s)} ${f(y - 1 * s)}Q${f(x + 4 * s)} ${f(y + 2 * s)} ${f(x)} ${f(y + 2 * s)}Q${f(x - 4 * s)} ${f(y + 2 * s)} ${f(x - 7 * s)} ${f(y - 1 * s)}Q${f(x - 8 * s)} ${f(y - 6 * s)} ${f(x - 3.4 * s)} ${f(y - 8 * s)}Z`, t.lg(['#e8b48a', '#c47e56', '#8c4e36'], 20), 1, ink('#5a2a20', .9, .85)) + ell(x, y - 11 * s, 3.4 * s, 1.1 * s, '#5a2a20', 1) + line(`M${f(x - 6 * s)} ${f(y - 4 * s)}Q${f(x)} ${f(y - 2 * s)} ${f(x + 6 * s)} ${f(y - 4 * s)}`, '#f3c24f', 1, .8);
