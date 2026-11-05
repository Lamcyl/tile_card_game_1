// Ashkara sub-area 1, Dune Shallows: shared helpers. Builds on desert-lib.mjs (palette, wash skeleton, ink, shadow) and only changes the sub-area folder.
import { T, rng, hash, f, newTile, save, ell, circ, rect, path, line, ink, wrapped, tuft, blobPath, shadow } from './lib.mjs';
import { D, FAMS, dskel, dint, speckle, ripples, crackNet, BLOBS, blobGeom, pad3, sh, pebbleD, rockD, block, dotsLine } from './desert-lib.mjs';
import { scatter } from './ground.mjs';
export { T, rng, hash, f, ell, circ, rect, path, line, ink, wrapped, D, FAMS, dskel, dint, speckle, ripples, crackNet, sh, pebbleD, tuft, blobPath, rockD, block, dotsLine, scatter };
export const SUB = 'dune-shallows', REGION = 'ashkara';
export const mix = (a, b, u) => { const p = (s) => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * u).toString(16).padStart(2, '0')).join(''); };
// pale cream sand of the shallows: same wash geometry as every desert family, a touch lighter and cooler than fine sand
export const CREAM = { key: 'dcream', b: '#f1e1b2', w: ['#e8d5a0', '#f8edca', '#e0cb96', '#f4e6bc'], rim: '#cdb078', tuft: '#b89a58' };
export const CLAY = { key: 'dclay', b: '#e2cca2', w: ['#d8c093', '#ecdcb8', '#cfb486', '#f0e4c6'], rim: '#a8885c', tuft: '#8f7448' };
export const creamBase = () => dskel(CREAM) + speckle(111, 22, ['#cdb078', '#fffbe6'], .9, .5);
export const mkT = (cat, name, variant, w = T, h = T) => newTile({ region: REGION, sub: SUB, cat, name, variant }, w, h);
export const outT = (t, cat, name, variant, tags = []) => save(t, { region: REGION, sub: SUB, cat, name, variant, tags: [...tags, 'desert', 'dune-shallows'] });
export function tile(cat, name, variant, size, tags, fn) {
  const t = mkT(cat, name, variant, size[0], size[1]); const r = rng(hash(`ds/${cat}/${name}/${variant}`));
  const s = fn(t, r); if (s) t.add(s); outT(t, cat, name, variant, tags); return t;
}
export function blobSet(name, { mg = { n: 8, e: 8, s: 8, w: 8 }, R = 24, build, tags = [] }) {
  for (const m of BLOBS) { const t = mkT('edges', name, pad3(m)); build(t, blobGeom(m, mg, R), m); outT(t, 'edges', name, pad3(m), ['autotile', 'blob47', 'mask:' + m, ...tags]); }
}
export const C = [T, T], TALL = [T, 128], LG = [128, 128];
export const pts = (r, n, pad = 11, gap = 11) => scatter(r, n, pad, gap);
// a periodic scatter of small things (wraps in both axes) so autotile fills stay seamless between neighbours
export function wscat(seed, n, par, draw, rad = 6) { const r = rng(seed); let o = ''; for (let i = 0; i < n; i++) { const x = r.range(0, T), y = r.range(0, T), p = par(r, i); o += wrapped(x, y, rad, (a, b) => draw(a, b, p, i)); } return o; }
export const dry = (x, y, s = 1, c = '#b09450', op = .85) => tuft(x, y, c, op, s);
