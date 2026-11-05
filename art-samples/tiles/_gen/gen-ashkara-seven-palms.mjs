// Ashkara sub-area 2: Seven Palms (ashkara/seven-palms). Ground, ground-detail, four 47-blob autotile sets, two connect-4 sets.
// Objects: gen-ashkara-seven-palms-objects.mjs; interest/landmark/gate: ...-interest.mjs; decals + overlays: ...-decals.mjs.
// Palette shift: lush yellow-green grass, cool turquoise water, sand fringe.
import { T, rng, f, ell, circ, rect, path, line, ink, wrapped, D, FAMS, dskel, dint, speckle, crackNet, sh, pebbleD, tuft, mix, CREAM, CLAY, LUSH, MEAD, LOAM, SOASIS, LAGOON, DEEP, lushBase, meadBase, loamBase, soasBase, lagoonBase, mkT, outT, tile, blobSet, C, pts, wscat, stroke, pad, lotus, grassTuft } from './seven-palms-lib.mjs';

const ground = (cat, name, v, base, fn, tags = []) => tile(cat, name, v, C, ['seamless', cat === 'ground' ? 'ground' : 'ground-detail', ...tags], (t, r) => base() + fn(r, t));
// ---------------- ground ----------------
const lu = (seed, o = {}) => dint(LUSH, seed, { n: 3, ...o });
ground('ground', 'grass-lush', 'a', lushBase, () => lu(9101));
ground('ground', 'grass-lush', 'b', lushBase, (r) => lu(9102) + pts(r, 4).map(([x, y]) => grassTuft(x, y + 4, .75)).join(''), ['tufts']);
ground('ground', 'grass-lush', 'c', lushBase, (r) => lu(9103, { cols: ['#c8e290', '#8fb458'] }) + pts(r, 3, 12, 14).map(([x, y]) => grassTuft(x, y + 4, .9, '#3f6f30')).join(''), ['tufts']);
ground('ground', 'grass-lush', 'd', lushBase, (r) => lu(9104) + pts(r, 5, 10, 10).map(([x, y]) => circ(x, y, r.range(.6, 1), '#e8f6b0', .8)).join(''), ['clover']);
ground('ground', 'grass-meadow', 'a', meadBase, () => dint(MEAD, 9111, { n: 3 }));
ground('ground', 'grass-meadow', 'b', meadBase, (r) => dint(MEAD, 9112, { n: 3 }) + pts(r, 4).map(([x, y]) => grassTuft(x, y + 4, .7, '#6f8f44')).join(''), ['tufts']);
ground('ground', 'grass-meadow', 'c', meadBase, (r) => dint(MEAD, 9113, { n: 3, cols: ['#d4e3a0', '#a4b966'] }) + pts(r, 3, 12, 16).map(([x, y]) => pebbleD(x, y, r.range(.4, .55), ['#efe4c0', '#bba37a'])).join(''), ['pebbles']);
ground('ground', 'loam-wet', 'a', loamBase, () => dint(LOAM, 9121, { n: 3 }));
ground('ground', 'loam-wet', 'b', loamBase, (r) => dint(LOAM, 9122, { n: 3, cols: ['#d2c294', '#a18d5c'] }) + pts(r, 4, 12, 12).map(([x, y]) => ell(x, y, r.range(3, 5), 1.4, '#6a5a34', .4, r.range(-20, 20))).join(''), ['furrows']);
ground('ground', 'loam-wet', 'c', loamBase, (r) => dint(LOAM, 9123, { n: 3 }) + pts(r, 3, 14, 16).map(([x, y]) => ell(x, y, r.range(5, 8), r.range(2, 3), '#8a7648', .5, r.range(-20, 20)) + ell(x - 1, y - .8, r.range(3, 4), 1, '#c8b684', .6)).join(''), ['mud']);
ground('ground', 'sand-oasis', 'a', soasBase, () => dint(SOASIS, 9131, { n: 3 }));
ground('ground', 'sand-oasis', 'b', soasBase, (r) => dint(SOASIS, 9132, { n: 3 }) + pts(r, 3).map(([x, y]) => grassTuft(x, y + 4, .6, '#9a9a48')).join(''), ['tufts']);
ground('ground', 'sand-oasis', 'c', soasBase, (r) => dint(SOASIS, 9133, { n: 3 }) + pts(r, 5, 10, 10).map(([x, y]) => pebbleD(x, y, r.range(.35, .5), ['#f2e6c6', '#cdb88e'])).join(''), ['pebbles']);
const lagRip = (seed, n) => () => lagoonBase(LAGOON, seed, n);
for (const [v, s, n] of [['a', 'pw-a', 6], ['b', 'pw-b', 9], ['c', 'pw-c', 4]]) ground('ground', 'pool-water', v, lagRip(s, n), () => dint(LAGOON, 9140 + n, { n: 3 }), ['water']);
for (const [v, s, n] of [['a', 'pd-a', 5], ['b', 'pd-b', 8]]) ground('ground', 'pool-deep', v, () => lagoonBase(DEEP, s, n, '#d4f4ec'), () => dint(DEEP, 9150 + n, { n: 3 }), ['water', 'deep']);
// ramps from lush grass into neighbouring ground (common desert + Dune Shallows cream sand)
const ramp = (from, to, u) => ({ key: 'dramp', b: mix(from.b, to.b, u), w: from.w.map((c, i) => mix(c, to.w[i], u)), rim: mix(from.rim, to.rim, u), tuft: mix(from.tuft, to.tuft, u) });
for (const [name, to, seed] of [['lush-fine', FAMS.sand, 9160], ['lush-dune', FAMS.dune, 9170], ['lush-cream', CREAM, 9180], ['lush-oasis', FAMS.oasis, 9190], ['lush-loam', LOAM, 9200], ['lush-meadow', MEAD, 9210]]) for (const [v, u] of [['a', .35], ['b', .7]]) ground('ground', name + '-fringe', v, () => dskel(ramp(LUSH, to, u)), (r) => dint(ramp(LUSH, to, u), seed + u * 10, { n: 3 }) + pts(r, 2, 12, 16).map(([x, y]) => grassTuft(x, y + 4, .6, mix(LUSH.tuft, to.tuft, u))).join(''), ['ramp', 'blend']);
ground('ground', 'sand-oasis-fringe', 'a', () => dskel(ramp(SOASIS, FAMS.sand, .5)), () => dint(ramp(SOASIS, FAMS.sand, .5), 9221, { n: 3 }), ['ramp', 'blend']);
ground('ground', 'cream-oasis-fringe', 'a', () => dskel(ramp(CREAM, SOASIS, .5)), () => dint(ramp(CREAM, SOASIS, .5), 9222, { n: 3 }), ['ramp', 'blend']);

// ---------------- ground-detail ----------------
const clover = (x, y, s = 1) => [[-2, 0], [2, 0], [0, -2.2]].map(([a, b]) => circ(x + a * s, y + b * s, 1.9 * s, '#5fae5c', 1, ink('#2e5a2e', .5, .6))).join('') + circ(x, y - .4, .7 * s, '#d8f0a0', .8);
const bloom = (x, y, s, c) => [0, 1, 2, 3, 4].map(i => circ(x + Math.cos(i * 1.257) * 1.6 * s, y + Math.sin(i * 1.257) * 1.6 * s, 1.3 * s, c)).join('') + circ(x, y, .9 * s, '#fff3a8');
const date = (x, y, s = 1, c = '#c0501e') => ell(x + .6, y + 1, 2.4 * s, 1.5 * s, '#3b3a24', .15) + ell(x, y, 2.2 * s, 1.4 * s, c, 1, 20, ink('#5a2a14', .5, .7)) + circ(x - .6 * s, y - .5 * s, .5 * s, '#ffc080', .8);
const litter = (x, y, a, l = 9) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})">` + path(`M${-l} 0Q0 ${-2.6} ${l} 0Q0 ${2} ${-l} 0Z`, '#a6a458', 1, ink('#6a6a30', .6, .8)) + line(`M${-l} 0H${l}`, '#e0d890', .8, .8) + `</g>`;
ground('ground-detail', 'lush-clover', 'a', lushBase, (r) => lu(9301, { n: 2 }) + pts(r, 6, 12, 10).map(([x, y]) => clover(x, y, r.range(.7, 1))).join(''), ['clover']);
ground('ground-detail', 'lush-clover', 'b', lushBase, (r) => lu(9302, { n: 2 }) + pts(r, 7, 10, 9).map(([x, y]) => clover(x, y, r.range(.55, .8))).join('') + pts(r, 3, 10, 12).map(([x, y]) => bloom(x, y, .8, '#fffaf0')).join(''), ['clover', 'flowers']);
ground('ground-detail', 'oleander-petals', 'a', lushBase, (r) => lu(9311, { n: 2 }) + pts(r, 9, 10, 8).map(([x, y]) => ell(x, y, 1.8, 1, r.pick(['#f6a8c4', '#fbd0e0', '#e8789c']), .95, r.range(0, 180))).join(''), ['petals']);
ground('ground-detail', 'oleander-petals', 'b', lushBase, (r) => lu(9312, { n: 2 }) + pts(r, 5, 12, 11).map(([x, y]) => bloom(x, y, 1, r.pick(['#f6a8c4', '#fbd0e0']))).join(''), ['petals', 'flowers']);
ground('ground-detail', 'fallen-dates', 'a', lushBase, (r) => lu(9321, { n: 2 }) + pts(r, 7, 11, 9).map(([x, y]) => date(x, y, r.range(.8, 1.1))).join(''), ['dates', 'loot']);
ground('ground-detail', 'fallen-dates', 'b', soasBase, (r) => dint(SOASIS, 9322, { n: 2 }) + pts(r, 5, 11, 11).map(([x, y]) => date(x, y, r.range(.8, 1.1), r.pick(['#c0501e', '#e8a030']))).join(''), ['dates', 'loot']);
ground('ground-detail', 'palm-litter', 'a', lushBase, (r) => lu(9331, { n: 2 }) + [[20, 24, -24], [44, 40, 30], [30, 50, 8]].map(([x, y, a]) => litter(x, y, a)).join(''), ['palm', 'litter']);
ground('ground-detail', 'palm-litter', 'b', soasBase, (r) => dint(SOASIS, 9332, { n: 2 }) + [[24, 30, 18], [42, 22, -30]].map(([x, y, a]) => litter(x, y, a, 11)).join('') + pts(r, 4, 12, 12).map(([x, y]) => date(x, y, .7)).join(''), ['palm', 'litter']);
ground('ground-detail', 'palm-litter', 'c', soasBase, (r) => dint(SOASIS, 9333, { n: 2 }) + [[32, 36, 4]].map(([x, y, a]) => litter(x, y, a, 14)).join('') + pts(r, 3, 12, 14).map(([x, y]) => litter(x, y, r.range(-60, 60), 5)).join(''), ['palm', 'litter']);
const pads = (r, n, w = [4, 6.4]) => pts(r, n, 10, 12).map(([x, y]) => pad(x, y, r.range(...w), r.pick(['#5fae6a', '#7cc47a', '#4f9c62']), r.range(0, 180))).join('');
ground('ground-detail', 'pool-lily-pads', 'a', lagRip('pw-a', 6), (r) => dint(LAGOON, 9341, { n: 2 }) + pads(r, 4), ['water', 'lily']);
ground('ground-detail', 'pool-lily-pads', 'b', lagRip('pw-b', 9), (r) => dint(LAGOON, 9342, { n: 2 }) + pads(r, 6, [3, 5]), ['water', 'lily']);
ground('ground-detail', 'pool-lotus', 'a', lagRip('pw-a', 6), (r) => dint(LAGOON, 9351, { n: 2 }) + pad(24, 38, 6) + pad(42, 26, 5.4, '#4f9c62') + lotus(26, 37, 1.1) + lotus(43, 25, .9, '#fff0f4'), ['water', 'lotus']);
ground('ground-detail', 'pool-lotus', 'b', lagRip('pw-c', 4), (r) => dint(LAGOON, 9352, { n: 2 }) + pad(32, 34, 7, '#7cc47a') + lotus(32, 33, 1.3) + pad(16, 20, 4) + pad(50, 48, 4.4), ['water', 'lotus']);
ground('ground-detail', 'pool-lotus', 'c', lagRip('pw-b', 9), (r) => dint(LAGOON, 9353, { n: 2 }) + pts(r, 3, 14, 18).map(([x, y]) => pad(x + 2, y + 1, 5) + lotus(x, y, .9, r.pick(['#f7b6cf', '#fff0f4', '#f9c8a0']))).join(''), ['water', 'lotus']);
ground('ground-detail', 'irrigation-seep', 'a', loamBase, (r) => dint(LOAM, 9361, { n: 2 }) + ell(32, 34, 13, 5, '#5a6a50', .4, -10) + ell(32, 33, 11, 3.6, '#79d0c4', .75, -10) + ell(29, 32, 5, 1, '#f2fffa', .7, -10) + pts(r, 4, 12, 12).map(([x, y]) => grassTuft(x, y + 4, .55, '#5f8a3e')).join(''), ['water', 'seep']);
ground('ground-detail', 'reed-sprouts', 'a', lushBase, (r) => lu(9371, { n: 2 }) + pts(r, 6, 10, 9).map(([x, y]) => line(`M${f(x)} ${f(y + 3)}l${f(r.range(-1.4, 1.4))} -7`, '#4f8a3a', 1.2, .95) + circ(x, y - 4.5, .9, '#a8c860')).join(''), ['reeds']);
ground('ground-detail', 'stepping-flags', 'a', lushBase, (r) => lu(9381, { n: 2 }) + [[14, 46, 7, 3.6], [29, 38, 6.4, 3.4], [43, 29, 7.4, 3.8], [53, 17, 5.6, 3]].map(([x, y, rx, ry]) => ell(x + 1, y + 1.4, rx, ry, '#3b3a24', .2) + ell(x, y, rx, ry, '#dcc79e', 1, -8, ink('#8a7456', .7, .8)) + ell(x - 1.4, y - 1, rx * .5, ry * .4, '#f8ecd2', .8)).join(''), ['flagstone', 'path']);

// ---------------- autotiles (47-blob) ----------------
// 1. pool-lagoon: turquoise pool with a sandy bank, lily pads, deeper in the middle; lush grass outside
blobSet('pool-lagoon', {
  mg: { n: 9, e: 9, s: 9, w: 9 }, R: 22, tags: ['water', 'oasis', 'pool'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(lushBase(), stroke(G.d, '#7a9a48', 22, .18), stroke(G.d, '#f0e2a8', 17, .9), stroke(G.d, '#b8965a', 9, .24), stroke(G.d, '#fffbe4', 3, .5, -2, -2));
    t.add(`<g clip-path="${clip}">`, lagoonBase(DEEP, 'lag-in', 6, '#d4f4ec'), wscat(931, 3, (r) => ({ rx: r.range(3.6, 5.4), c: r.pick(['#5fae6a', '#7cc47a']), a: r.range(0, 180) }), (x, y, p) => pad(x, y, p.rx, p.c, p.a), 6),
      stroke(G.d, '#62c9bd', 21, .62), stroke(G.d, '#8fe0d4', 13, .5), stroke(G.d, '#d4f4ec', 6, .55), stroke(G.d, '#f2fffa', 2.6, .55, 1.6, 1.6), '</g>');
    t.add(stroke(G.d, '#2a8190', 1.3, .55));
  },
});
// 2. lush-meadow: a patch of lush grass with clover on oasis sand
const lushFill = () => lushBase() + wscat(941, 14, (r) => ({ s: r.range(.6, 1) }), (x, y, p) => grassTuft(x, y + 4, p.s * .8, '#4f7f36'), 5) + wscat(942, 6, (r) => ({ s: r.range(.45, .7) }), (x, y, p) => clover(x, y, p.s), 4) + wscat(943, 3, () => ({}), (x, y) => bloom(x, y, .7, '#fffaf0'), 3);
blobSet('lush-meadow', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['grass', 'oasis'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(soasBase(), stroke(G.d, '#a8a050', 10, .2), stroke(G.d, '#d8e49a', 6, .35));
    t.add(`<g clip-path="${clip}">`, lushFill(), stroke(G.d, '#7fa84c', 9, .35), stroke(G.d, '#d6ec9c', 4, .4, -1, -1), '</g>');
    t.add(stroke(G.d, '#5b8a3a', 1.1, .5));
  },
});
// 3. papyrus-bed: dense papyrus stands (umbels on stalks) over damp ground
const umbel = (x, y, s, c) => line(`M${f(x)} ${f(y + 6 * s)}V${f(y - 2 * s)}`, '#4f8a3a', 1.3 * s, .95) + [-70, -35, 0, 35, 70].map(a => line(`M${f(x)} ${f(y - 2 * s)}l${f(Math.sin(a * Math.PI / 180) * 5 * s)} ${f(-Math.cos(a * Math.PI / 180) * 4.4 * s)}`, c, .9, .95)).join('') + circ(x, y - 2 * s, 1 * s, '#a8c860');
const papFill = () => dskel({ ...MEAD, b: '#8fb468', w: ['#84aa5e', '#a2c47c', '#7aa056', '#aecf88'] }) + wscat(951, 20, (r) => ({ s: r.range(.8, 1.2), c: r.pick(['#3f7f3a', '#5a9a44', '#2f6a34']) }), (x, y, p) => umbel(x, y + 2, p.s, p.c), 7) + speckle(952, 8, ['#e2edb0'], 1, .5);
blobSet('papyrus-bed', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['papyrus', 'vegetation'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(lushBase(), stroke(G.d, '#3f6f30', 9, .2));
    t.add(`<g clip-path="${clip}">`, papFill(), stroke(G.d, '#e2edb0', 6, .35), '</g>');
    t.add(stroke(G.d, '#4f7f36', 1.1, .5));
  },
});
// 4. irrigated-field: tilled wet loam with green sprout rows, mud-brick bund edge
const rows = () => { let o = ''; for (const y of [10, 26, 42, 58]) o += line(`M-2 ${y}H66`, '#6a5a34', 2.6, .45) + line(`M-2 ${y - 1.6}H66`, '#e0d2a4', 1, .5); return o; };
const fieldFill = () => dskel(LOAM) + rows() + wscat(961, 12, (r) => ({ s: r.range(.7, 1) }), (x, y, p) => '', 3) + [10, 26, 42, 58].map((y, k) => Array.from({ length: 6 }, (_, i) => { const x = i * 10.6 + (k % 2) * 5; return wrapped(x, y - 2, 4, (a, b) => line(`M${f(a)} ${f(b + 1)}q-2 -3 -3 -5M${f(a)} ${f(b + 1)}q0 -4 0 -6M${f(a)} ${f(b + 1)}q2 -3 3 -5`, '#5fa84a', 1.1, .95) + circ(a, b - 5, .7, '#b8e070')); }).join('')).join('');
blobSet('irrigated-field', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 20, tags: ['field', 'farm'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(lushBase(), stroke(G.d, '#8a6a3c', 11, .28, 1, 2), stroke(G.d, '#c9a06c', 9, .95), stroke(G.d, '#e8c894', 3, .8, -1.5, -1.5));
    t.add(`<g clip-path="${clip}">`, fieldFill(), stroke(G.d, '#5a4a28', 8, .3, 2, 2), '</g>');
    t.add(stroke(G.d, '#7a5a30', 1.2, .6));
  },
});

// ---------------- connect-4 (N1 E2 S4 W8) ----------------
// 1. irrigation ditch: mud-brick lined channel carrying turquoise water
for (let m = 0; m < 16; m++) {
  const v = String(m).padStart(2, '0'), t = mkT('fences', 'ditch-irrigation', v), N = m & 1, E = m & 2, S = m & 4, W = m & 8, cx = 32, cy = 34, hw = 9;
  const arms = [[cx, cy, 0, cy], [cx, cy, 64, cy], [cx, 0, cx, cy], [cx, cy, cx, 64]], on = [W, E, N, S];
  const bar = (a, b, c, d, w, col, op = 1) => line(`M${a} ${b}L${c} ${d}`, col, w, op);
  const segs = arms.filter((_, i) => on[i]); const cap = !m;
  const draw = (w, col, op) => (segs.map(([a, b, c, d]) => bar(a, b, c, d, w, col, op)).join('')) + circ(cx, cy, w / 2, col, op);
  t.add(draw(hw * 2 + 8, '#3b3a24', .14).replace(/<path /g, '<path transform="translate(1.5 2.5)" ').replace(/<circle /g, '<circle transform="translate(1.5 2.5)" '));
  t.add(draw(hw * 2 + 5, '#8e6038'), draw(hw * 2 + 3, '#c58f5c'), draw(hw * 2 - 1.4, '#e2b684'), draw(hw * 2 - 3, '#7a4a2a'), draw(hw * 2 - 4.4, '#62c9bd'), draw(hw * 2 - 9, '#8fe0d4', .8), draw(hw * 2 - 14, '#d4f4ec', .6));
  for (const [a, b, c, d] of segs) { const horiz = b === d; for (let k = 0; k < 4; k++) { const u = (k + .5) / 4; const x = a + (c - a) * u, y = b + (d - b) * u; t.add(horiz ? line(`M${f(x - 2)} ${f(y - 1)}q2 -1.4 4 0`, '#f2fffa', 1, .7) : line(`M${f(x - 1)} ${f(y - 2)}q-1.4 2 0 4`, '#f2fffa', 1, .7)); } }
  outT(t, 'fences', 'ditch-irrigation', v, ['autotile', 'connect4', 'mask:' + m, 'water', 'channel']);
}
// 2. oleander hedge: leafy hedge with pink flowers
for (let m = 0; m < 16; m++) {
  const v = String(m).padStart(2, '0'), t = mkT('fences', 'hedge-oleander', v), N = m & 1, E = m & 2, S = m & 4, W = m & 8, cx = 32, cy = 40, r = rng(7000 + m);
  const arms = [[cx, cy, 0, cy], [cx, cy, 64, cy], [cx, 0, cx, cy], [cx, cy, cx, 64]], on = [W, E, N, S], segs = arms.filter((_, i) => on[i]);
  const blobs = [[cx, cy]]; for (const [, , c, d] of segs) for (let k = 1; k <= 3; k++) blobs.push([cx + (c - cx) * k / 3 + (c === cx ? 0 : 0), cy + (d - cy) * k / 3]);
  blobs.sort((a, b) => a[1] - b[1]);
  t.add(ell(cx + 2, cy + 9, 14, 4, '#3b3a24', .16));
  for (const [x, y] of blobs) t.add(ell(x + 1.5, y + 6, 11, 5, '#3b3a24', .12));
  for (const [x, y] of blobs) {
    t.add(ell(x, y - 5, 11.5, 12, t.lg(['#9cc062', '#5f9a48', '#386a38'], 70), 1, 0, ink(D.inkG, .9, .75)));
    for (let i = 0; i < 7; i++) t.add(ell(x + r.range(-9, 9), y - 5 + r.range(-9, 8), 3.4, 1.4, i % 2 ? '#7cae52' : '#b0d070', .9, r.range(0, 180), ink('#3a6a34', .3, .5)));
    for (let i = 0; i < 4; i++) t.add(bloom(x + r.range(-8, 8), y - 4 + r.range(-8, 7), 1, r.pick(['#f08ab0', '#f6a8c4', '#e8688e'])));
  }
  outT(t, 'fences', 'hedge-oleander', v, ['autotile', 'connect4', 'mask:' + m, 'hedge', 'obstacle']);
}

import './gen-ashkara-seven-palms-objects.mjs';
import './gen-ashkara-seven-palms-interest.mjs';
import './gen-ashkara-seven-palms-decals.mjs';
