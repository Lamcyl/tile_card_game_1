// Misty Highlands shared helpers: ochre pasture / heather / scree / moor families, gorse, heather, standing-stone shapes, flags.
import { P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, FAM, skeleton, T, blobPath } from './sub.mjs';
import { wrapped } from './lib.mjs';
import { hx, mixc } from './marsh-lib.mjs';
export { hx, mixc };
const fam = (key, b, w, rimc, tuftc) => ({ key, b, w, rim: rimc, tuft: tuftc });
export const OCHRE = fam('ochre', '#d3c48e', ['#c7b77c', '#ddd1a0', '#e3d9ae', '#cbbb84'], '#9a8a58', '#8f8a48');
export const HEATH = fam('heath', '#c2b394', ['#b3a384', '#cfc0a4', '#aa9aa6', '#d6cabc'], '#8a7a78', '#7a7a50');
export const SCREE = fam('scree', '#cbc6b6', ['#bdb8a8', '#d9d4c4', '#b0ab9c', '#e2ddce'], '#8e8a7c', '#9a9a68');
export const MOOR = fam('moor', '#b6c58c', ['#a8ba80', '#c4d19a', '#9eb078', '#ced9a6'], '#5f7a48', '#4d6a3c');
export const SLAB = fam('slab', '#c2beb2', ['#b4b0a4', '#d0ccc0', '#a8a498', '#dad6ca'], '#8a8678', '#9a9a68');
export const CHASM = fam('chasm', '#4a5262', ['#424a5a', '#566070', '#3a4252', '#5c6676'], '#2e3644', '#fff');
export const mossy = (u) => ({ ...OCHRE, b: mixc(OCHRE.b, '#bcd88f', u), w: OCHRE.w.map((c, i) => mixc(c, ['#aed283', '#c8e1a0', '#a2c97c', '#d2e6ac'][i], u)), rim: mixc(OCHRE.rim, '#5f8f4c', u) });
export const wetOchre = (u) => ({ ...OCHRE, b: mixc(OCHRE.b, '#bdb286', u), w: OCHRE.w.map((c, i) => mixc(c, ['#b2a67a', '#cabf94', '#a79b70', '#d3c8a0'][i], u)), rim: mixc(OCHRE.rim, '#7a6c48', u) });
// rocky wrapped flecks for rock-top tiles
export const flecks = (seed, n = 6, col = '#8a8678') => { const r = rng(hash(seed)); let o = ''; for (let i = 0; i < n; i++) { const x = r.range(0, T), y = r.range(0, T); o += wrapped(x, y, 6, (a, b) => line(`M${f(a)} ${f(b)}l${f(r.range(3, 5))} ${f(r.range(-1, 1))}`, col, 1, .4)); } return o; };
// small rock (cell-scale): cut stone with highlight
export const stoneS = (x, y, s = 1, cols = ['#e0e1d6', '#b4b4a6', '#868678']) => ell(x + .8 * s, y + 1.8 * s, 5 * s, 1.8 * s, '#3b3a24', .16) + path(`M${f(x - 4.4 * s)} ${f(y + 1 * s)}L${f(x - 3 * s)} ${f(y - 2.6 * s)}L${f(x + 1 * s)} ${f(y - 3.4 * s)}L${f(x + 4.4 * s)} ${f(y - .6 * s)}L${f(x + 4 * s)} ${f(y + 1.8 * s)}Z`, cols[1], 1, ink(P.inkR, .6, .7)) + path(`M${f(x - 3 * s)} ${f(y - 2.6 * s)}L${f(x + 1 * s)} ${f(y - 3.4 * s)}L${f(x + .4 * s)} ${f(y - 1 * s)}L${f(x - 3.6 * s)} ${f(y)}Z`, cols[0], .9);
// heather sprig: tiny purple bells on a woody stem
export const heatherS = (x, y, s = 1, cols = ['#a070b8', '#c898d8', '#7a4a98']) => { let o = line(`M${f(x)} ${f(y + 2)}q.6-4 0-${f(7 * s)}`, '#6a6a40', 1, .8); for (let i = 0; i < 7; i++) o += circ(x + ((i % 3) - 1) * 1.4 * s, y - i * 1.1 * s, 1.1 * s, cols[i % 3]); return o; };
export const gorseS = (x, y, s = 1) => { let o = ''; for (let i = 0; i < 5; i++) { const a = -2.3 + i * .55; o += line(`M${f(x)} ${f(y)}l${f(Math.cos(a) * 7 * s)} ${f(Math.sin(a) * 7 * s)}`, '#4a7a3a', 1.1, .9); } for (const [dx, dy] of [[-4, -5], [0, -7], [4, -5], [-2, -2], [3, -2]]) o += circ(x + dx * s, y + dy * s, 1.5 * s, '#f6d42a', 1, ink('#a88a10', .3, .6)) + circ(x + dx * s - .4, y + dy * s - .4, .5 * s, '#fff6a0'); return o; };
export const flagCols = ['#e0583f', '#f3c24f', '#fffaf0', '#4d639a', '#5fae5c'];   // red, yellow, white, blue, green (prayer-flag order variant)
export const flagTri = (x, y, w, h, col, sway = 0) => path(`M${f(x)} ${f(y)}h${f(w)}q${f(sway)} ${f(h * .5)} ${f(sway * .6)} ${f(h)}l${f(-w * .5)} ${f(-2)}l${f(-w * .5)} ${f(2)}q${f(-sway * .4)} ${f(-h * .5)} 0 ${f(-h)}Z`, col, .95, ink('#3a2418', .4, .6));
export const mistBlob = (x, y, rx, ry, col = '#eef0ee', op = .25) => ell(x, y, rx, ry, col, op) + ell(x + rx * .15, y - ry * .3, rx * .6, ry * .5, '#fff', op * .55);
