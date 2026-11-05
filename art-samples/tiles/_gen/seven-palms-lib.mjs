// Ashkara sub-area 2, Seven Palms: shared helpers. Builds on desert-lib.mjs (palette, wash skeleton, ink, shadow) and dune-shallows-lib.mjs; only changes the sub-area folder.
import { T, rng, hash, f, newTile, save, ell, circ, rect, path, line, ink, wrapped, tuft, blobPath, shadow } from './lib.mjs';
import { D, FAMS, dskel, dint, speckle, ripples, crackNet, BLOBS, blobGeom, pad3, sh, pebbleD, rockD, block, dotsLine, frond } from './desert-lib.mjs';
import { scatter } from './ground.mjs';
import { mix, CREAM, CLAY } from './dune-shallows-lib.mjs';
export { T, rng, hash, f, ell, circ, rect, path, line, ink, wrapped, D, FAMS, dskel, dint, speckle, ripples, crackNet, sh, pebbleD, tuft, blobPath, rockD, block, dotsLine, frond, scatter, mix, CREAM, CLAY };
export const SUB = 'seven-palms', REGION = 'ashkara';
// lush yellow-green oasis grass, loam, and a cooler turquoise pool (all on the shared desert wash geometry)
export const LUSH = { key: 'dlush', b: '#aac96c', w: ['#9cc062', '#bddb82', '#90b658', '#c8e290'], rim: '#6c9842', tuft: '#4f7f36' };
export const MEAD = { key: 'dmead', b: '#bccd7c', w: ['#b0c470', '#cbdc90', '#a4b966', '#d4e3a0'], rim: '#7f9f50', tuft: '#5f8a3e' };
export const LOAM = { key: 'dloam', b: '#b9a572', w: ['#ad9966', '#c8b684', '#a18d5c', '#d2c294'], rim: '#80693e', tuft: '#6a5a34' };
export const SOASIS = { key: 'dsoas', b: '#e6d49c', w: ['#dcc890', '#f0e2b2', '#d2bc84', '#f4e8c0'], rim: '#bf9f60', tuft: '#9a8a48' };
export const LAGOON = { key: 'dlag', b: '#62c9bd', w: ['#56bdb4', '#7cd8cc', '#4cb0ac', '#92e2d6'], rim: '#2a8190', tuft: '#fff' };
export const DEEP = { key: 'ddeep', b: '#3fb0ac', w: ['#38a2a4', '#58c4bc', '#2f949c', '#6cd0c6'], rim: '#1f6f82', tuft: '#fff' };
export const lushBase = () => dskel(LUSH) + speckle(211, 20, ['#7fa84c', '#d6ec9c'], 1, .45);
export const meadBase = () => dskel(MEAD) + speckle(212, 18, ['#8fae58', '#e2edb0'], 1, .45);
export const loamBase = () => dskel(LOAM) + speckle(213, 28, ['#8a7648', '#d8c898', '#6a5a34'], 1.1, .6);
export const soasBase = () => dskel(SOASIS) + speckle(214, 22, ['#c9a468', '#fff3cf'], 1, .5);
const rip = (x, y, w, col, op, sw = 1.1) => line(`M${f(x - w / 2)} ${f(y)}q${f(w / 4)}-2.6 ${f(w / 2)} 0t${f(w / 2)} 0`, col, sw, op);
export function lagoonBase(fam = LAGOON, seed = 'lag-rip', n = 6, col = '#f2fffa') { const r = rng(hash(seed)); let o = dskel(fam); for (let i = 0; i < n; i++) { const x = r.range(0, T), y = r.range(0, T), w = r.range(10, 15); o += wrapped(x, y, 10, (a, b) => rip(a, b, w, col, .62, 1.2)); } return o; }
export const mkT = (cat, name, variant, w = T, h = T) => newTile({ region: REGION, sub: SUB, cat, name, variant }, w, h);
export const outT = (t, cat, name, variant, tags = []) => save(t, { region: REGION, sub: SUB, cat, name, variant, tags: [...tags, 'desert', 'seven-palms'] });
export function tile(cat, name, variant, size, tags, fn) {
  const t = mkT(cat, name, variant, size[0], size[1]); const r = rng(hash(`sp/${cat}/${name}/${variant}`));
  const s = fn(t, r); if (s) t.add(s); outT(t, cat, name, variant, tags); return t;
}
export function blobSet(name, { mg = { n: 8, e: 8, s: 8, w: 8 }, R = 24, build, tags = [] }) {
  for (const m of BLOBS) { const t = mkT('edges', name, pad3(m)); build(t, blobGeom(m, mg, R), m); outT(t, 'edges', name, pad3(m), ['autotile', 'blob47', 'mask:' + m, ...tags]); }
}
export const C = [T, T], TALL = [T, 128], LG = [128, 128];
export const pts = (r, n, pad = 11, gap = 11) => scatter(r, n, pad, gap);
export function wscat(seed, n, par, draw, rad = 6) { const r = rng(seed); let o = ''; for (let i = 0; i < n; i++) { const x = r.range(0, T), y = r.range(0, T), p = par(r, i); o += wrapped(x, y, rad, (a, b) => draw(a, b, p, i)); } return o; }
export const stroke = (d, col, w, op, dx = 0, dy = 0) => `<path d="${d}" transform="translate(${dx} ${dy})" fill="none" stroke="${col}" stroke-width="${w}" stroke-opacity="${op}" stroke-linejoin="round"/>`;
export const SAND = ['#fffaea', '#f1dfae', '#d8bc82'];
export const heap = (t, cx, cy, rx, ry, op = .96) => ell(cx, cy + ry * .3, rx, ry, t.lg(SAND, 70), op) + ell(cx - rx * .3, cy - ry * .1, rx * .45, ry * .3, '#fff', .5, -8);
export const grassTuft = (x, y, s = 1, c = '#5f8a3e', op = .9) => tuft(x, y, c, op, s);
// pad / leaf shapes
export const pad = (x, y, rx, col = '#5fae6a', rot = 0) => ell(x + .8, y + 1, rx, rx * .62, '#1f5a52', .25, rot) + ell(x, y, rx, rx * .62, col, 1, rot, ink('#2f6a3e', .6, .75)) + line(`M${f(x)} ${f(y)}l${f(rx * .9)} ${f(-rx * .1)}`, '#2f6a3e', .7, .5);
export const lotus = (x, y, s = 1, col = '#f7b6cf') => { let o = ''; for (const a of [-50, 50, -26, 26, 0]) o += `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">` + path(`M0 0Q${f(-2.4 * s)} ${f(-3.4 * s)} 0 ${f(-6.4 * s)}Q${f(2.4 * s)} ${f(-3.4 * s)} 0 0Z`, a === 0 ? '#ffe6ee' : col, 1, ink('#b05a80', .4, .7)) + `</g>`; return o + circ(x, y - 1, 1.1 * s, '#f3c24f'); };
