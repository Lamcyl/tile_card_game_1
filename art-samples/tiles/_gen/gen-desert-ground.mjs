// Ashkara common: seamless ground, baked ground-detail, decals, four 47-blob autotile sets, one connect-4 wall.
import { T, P, rng, hash, f, ell, circ, rect, path, line, ink, wrapped, tuft, D, FAMS, dskel, dint, sandBase, duneBase, panBase, regBase, slabBase, oasisBase, owatBase, speckle, tile, blobSet, sh, pebbleD, mk, out } from './desert-lib.mjs';
import { scatter } from './ground.mjs';

const ground = (cat, name, v, base, fn, tags = []) => tile(cat, name, v, [T, T], ['seamless', 'ground', ...tags], (t, r) => base() + fn(r, t));
const pts = (r, n, pad = 11, gap = 11) => scatter(r, n, pad, gap);
const grassTuft = (x, y, c = '#5f8a3e', s = 1) => tuft(x, y, c, .8, s);
const dryTuft = (x, y, s = 1) => tuft(x, y, '#b09450', .85, s);

// ---- fine sand ----
ground('ground', 'sand-fine', 'a', sandBase, (r) => dint(FAMS.sand, 7101, { n: 3 }));
ground('ground', 'sand-fine', 'b', sandBase, (r) => dint(FAMS.sand, 7102, { n: 3 }) + pts(r, 3).map(([x, y]) => dryTuft(x, y, .8)).join(''));
ground('ground', 'sand-fine', 'c', sandBase, (r) => dint(FAMS.sand, 7103, { n: 3, cols: ['#f6e8c0', '#e8d098'] }) + pts(r, 4, 10, 10).map(([x, y]) => pebbleD(x, y, r.range(.45, .7), ['#e8d4ac', '#c8b08a'])).join(''), ['pebbles']);
ground('ground', 'sand-fine', 'd', sandBase, (r) => dint(FAMS.sand, 7104, { n: 3 }) + [0, 1, 2, 3].map(i => { const x = r.range(10, 42), y = r.range(14, 50); return line(`M${f(x)} ${f(y)}q4 -2 8 0t8 0`, '#c9a468', 1, .4); }).join(''));
// ---- rippled dune sand ----
ground('ground', 'sand-dune', 'a', duneBase, (r) => dint(FAMS.dune, 7201, { n: 3 }));
ground('ground', 'sand-dune', 'b', duneBase, (r) => dint(FAMS.dune, 7202, { n: 3, cols: ['#f6e4b8', '#d2aa68'] }) + [0, 1, 2].map(() => { const x = r.range(10, 40), y = r.range(16, 50); return line(`M${f(x)} ${f(y)}q5-3 10 0t10 0`, '#fff2cc', 1.2, .6); }).join(''));
ground('ground', 'sand-dune', 'c', duneBase, (r) => dint(FAMS.dune, 7203, { n: 4 }) + [0, 1, 2].map(() => { const x = r.range(10, 40), y = r.range(16, 50); return line(`M${f(x)} ${f(y)}q5-3 10 0t10 0`, '#a8783c', 1, .45); }).join(''));
ground('ground', 'sand-dune', 'd', duneBase, (r) => dint(FAMS.dune, 7204, { n: 3 }) + pts(r, 2, 14, 18).map(([x, y]) => dryTuft(x, y, .9)).join(''), ['tufts']);
// ---- cracked hardpan ----
ground('ground', 'hardpan', 'a', panBase, (r) => dint(FAMS.pan, 7301, { n: 3 }));
ground('ground', 'hardpan', 'b', panBase, (r) => dint(FAMS.pan, 7302, { n: 3, cols: ['#e8d8b8', '#f2e8cc'] }) + pts(r, 3, 14, 16).map(([x, y]) => ell(x, y, r.range(5, 8), r.range(2.4, 3.6), '#fffaf0', .5, r.range(-20, 20))).join(''), ['salt']);
ground('ground', 'hardpan', 'c', panBase, (r) => dint(FAMS.pan, 7303, { n: 3 }) + pts(r, 4, 12, 12).map(([x, y]) => pebbleD(x, y, r.range(.4, .65), ['#d8c4a0', '#a89070'])).join(''), ['pebbles']);
ground('ground', 'hardpan', 'd', panBase, (r) => dint(FAMS.pan, 7304, { n: 3, cols: ['#c2a475', '#d2b888'] }) + ell(30, 36, 9, 3.4, '#8a6a44', .22) + ell(29, 35, 6, 2, '#b69666', .35) + dryTuft(44, 22, .8), ['dry-pool']);
// ---- reg (gravel) ----
const gravel = (r, n, s0 = .45, s1 = .9) => pts(r, n, 9, 8).map(([x, y]) => pebbleD(x, y, r.range(s0, s1), r.pick([['#ddc9a4', '#b49b74'], ['#c9b08a', '#9a8260'], ['#e4d6b8', '#bca888'], ['#b8a07c', '#8a7454']]))).join('');
ground('ground', 'reg-gravel', 'a', regBase, (r) => dint(FAMS.reg, 7401, { n: 3 }) + gravel(r, 8));
ground('ground', 'reg-gravel', 'b', regBase, (r) => dint(FAMS.reg, 7402, { n: 3 }) + gravel(r, 12, .35, .7));
ground('ground', 'reg-gravel', 'c', regBase, (r) => dint(FAMS.reg, 7403, { n: 3 }) + gravel(r, 5, .6, 1.1) + dryTuft(30, 40, .8));
ground('ground', 'reg-gravel', 'd', regBase, (r) => dint(FAMS.reg, 7404, { n: 3, cols: ['#a89470', '#d8c6a2'] }) + gravel(r, 6, .4, .8) + pebbleD(38, 26, 1.3, ['#e0c8a0', '#b09470']));
// ---- sandstone slab ----
ground('ground', 'slab-sandstone', 'a', slabBase, (r) => dint(FAMS.slab, 7501, { n: 3 }));
ground('ground', 'slab-sandstone', 'b', slabBase, (r) => dint(FAMS.slab, 7502, { n: 3 }) + pts(r, 3, 12, 14).map(([x, y]) => ell(x, y, r.range(4, 7), r.range(1.6, 2.6), '#f3e2b4', .75, r.range(-25, 25))).join(''), ['sand-drift']);
ground('ground', 'slab-sandstone', 'c', slabBase, (r) => dint(FAMS.slab, 7503, { n: 3 }) + line('M16 30l6 4l-3 6l8 5', '#7a5434', 1.1, .6) + line('M44 18l-4 7l5 5', '#7a5434', 1, .5) + pts(r, 2, 12, 20).map(([x, y]) => dryTuft(x, y, .7)).join(''), ['cracked']);
// ---- oasis grass ----
const OG = ['#5f8a3e', '#7aa24a'];
ground('ground', 'oasis-grass', 'a', oasisBase, (r) => dint(FAMS.oasis, 7601, { n: 3 }) + pts(r, 4).map(([x, y]) => grassTuft(x, y, '#4f7a3a')).join(''));
ground('ground', 'oasis-grass', 'b', oasisBase, (r) => dint(FAMS.oasis, 7602, { n: 3 }) + pts(r, 7, 10, 9).map(([x, y]) => grassTuft(x, y, '#5f8a3e', .8)).join(''));
ground('ground', 'oasis-grass', 'c', oasisBase, (r) => dint(FAMS.oasis, 7603, { n: 3 }) + pts(r, 3, 12, 14).map(([x, y]) => grassTuft(x, y, '#4f7a3a', .8)).join('') + pts(r, 4, 10, 10).map(([x, y]) => circ(x, y, 1.5, r.pick(['#f6a0b8', '#fff', '#f3c24f']), 1, ink('#6b4a2c', .3, .5))).join(''), ['flowers']);
ground('ground', 'oasis-grass', 'd', oasisBase, (r) => dint(FAMS.oasis, 7604, { n: 3, cols: ['#d8c88a', '#b9d084'] }) + pts(r, 3, 12, 12).map(([x, y]) => dryTuft(x, y, .9)).join('') + pts(r, 2, 12, 16).map(([x, y]) => grassTuft(x, y)).join(''), ['dry']);
// ---- oasis water ----
ground('ground', 'oasis-water', 'a', owatBase, (r) => dint(FAMS.owat, 7701, { n: 3, cols: ['#a2e4d8', '#6ac4ba'] }));
ground('ground', 'oasis-water', 'b', owatBase, (r) => dint(FAMS.owat, 7702, { n: 3, cols: ['#a2e4d8', '#6ac4ba'] }) + circ(22, 24, 1.6, '#fff', .8) + circ(42, 40, 1.2, '#fff', .8) + line('M20 44q4-2 8 0t8 0', '#f2fffa', 1.2, .75));
ground('ground', 'oasis-water', 'c', owatBase, (r) => dint(FAMS.owat, 7703, { n: 3, cols: ['#7ccfc8', '#4fa8b0'] }) + [[24, 26, 6], [44, 38, 5]].map(([x, y, s]) => ell(x, y, s, s * .55, '#6aa84a', 1, 10, ink(D.inkG, .6, .6)) + ell(x - 1, y - .8, s * .5, s * .22, '#b8d86e', .7)).join('') + circ(46, 22, 2, '#fbdde6', 1, ink('#b0607a', .4, .5)), ['lily']);
// ---- ramps: oasis grass <-> sand (same wash geometry, mixed colours) ----
const mix = (a, b, u) => { const p = (s) => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * u).toString(16).padStart(2, '0')).join(''); };
const ramp = (u) => ({ key: 'dramp', b: mix(FAMS.oasis.b, FAMS.sand.b, u), w: FAMS.oasis.w.map((c, i) => mix(c, FAMS.sand.w[i], u)), rim: mix(FAMS.oasis.rim, FAMS.sand.rim, u), tuft: mix(FAMS.oasis.tuft, FAMS.sand.tuft, u) });
for (const [v, u] of [['a', .35], ['b', .65]]) ground('ground', 'oasis-fringe', v, () => dskel(ramp(u)), (r) => dint(ramp(u), 7800 + u * 10, { n: 3 }) + pts(r, 3, 12, 14).map(([x, y]) => tuft(x, y, mix('#5f8a3e', '#b09450', u), .8, .8)).join(''), ['ramp', 'blend']);
// ---- sand -> hardpan / slab ramps ----
ground('ground', 'dune-fringe', 'a', () => dskel({ ...FAMS.sand, b: '#eacd92', w: ['#e0c286', '#f1dcae', '#d8ba7c', '#eed8a4'] }), (r) => dint(FAMS.dune, 7811, { n: 3 }), ['ramp', 'blend']);

// ---- ground-detail (baked into seamless ground) ----
const gd = (name, v, base, fn, tags = []) => tile('ground-detail', name, v, [T, T], ['seamless', 'ground-detail', ...tags], (t, r) => base() + fn(r, t));
gd('sand-shells', 'a', sandBase, (r) => dint(FAMS.sand, 7901, { n: 2 }) + pts(r, 4, 12, 12).map(([x, y]) => ell(x, y, 3, 2.1, '#fff6e8', 1, r.range(0, 90), ink('#b99c86', .6, .7)) + line(`M${f(x - 1.3)} ${f(y - .8)}l2.6 1.6`, '#d9b8a0', .6)).join(''), ['fossil']);
gd('sand-scrub', 'a', sandBase, (r) => dint(FAMS.sand, 7902, { n: 2 }) + [[22, 40, 1.2], [44, 26, .9]].map(([x, y, s]) => ell(x + 1, y + 2, 7 * s, 2 * s, '#3b3a24', .14) + [0, 1, 2, 3, 4].map(i => line(`M${f(x)} ${f(y)}q${f((i - 2) * 2.4)} ${f(-5 * s)} ${f((i - 2) * 3.6)} ${f(-9 * s)}`, i % 2 ? '#9a8a4c' : '#b8a864', 1.2, .9)).join('')).join(''), ['scrub']);
gd('dune-grass-baked', 'a', duneBase, (r) => dint(FAMS.dune, 7903, { n: 2 }) + pts(r, 5, 12, 10).map(([x, y]) => tuft(x, y, '#8fa04c', .9, 1)).join(''), ['grass']);
gd('hardpan-salt', 'a', panBase, (r) => dint(FAMS.pan, 7904, { n: 2 }) + pts(r, 5, 12, 11).map(([x, y]) => ell(x, y, r.range(3, 6), r.range(1.4, 2.4), '#fffdf6', .85, r.range(-30, 30))).join(''), ['salt']);
gd('oasis-flowers', 'a', oasisBase, (r) => dint(FAMS.oasis, 7905, { n: 2 }) + pts(r, 6, 11, 9).map(([x, y]) => { const c = r.pick(['#f6a0b8', '#fbdde6', '#f3c24f']); return line(`M${f(x)} ${f(y + 2)}v3`, '#4f7a3a', 1, .7) + [[-1.6, 0], [1.6, 0], [0, -1.6], [0, 1.2]].map(([dx, dy]) => circ(x + dx, y + dy, 1.5, c)).join('') + circ(x, y, 1, '#fff6c0'); }).join(''), ['flowers', 'oleander']);
gd('oasis-clover', 'a', oasisBase, (r) => dint(FAMS.oasis, 7906, { n: 2 }) + pts(r, 5, 11, 10).map(([x, y]) => [[-2, 0], [2, 0], [0, -2.2], [0, 1.6]].map(([dx, dy]) => circ(x + dx, y + dy, 2.1, '#7fb85a', 1, ink(D.inkG, .5, .5))).join('') + circ(x - .6, y - 1.2, .7, '#c4e48a', .9)).join(''), ['clover']);
gd('reg-fossils', 'a', regBase, (r) => dint(FAMS.reg, 7907, { n: 2 }) + gravel(r, 5) + ell(34, 34, 5, 3.2, '#eadcc0', 1, 20, ink('#8a7456', .6, .7)) + line('M31 33q3-2 6 1M31 35q3-2 6 1', '#bfa888', .7), ['fossil']);
gd('slab-glyphs', 'a', slabBase, (r) => dint(FAMS.slab, 7908, { n: 2 }) + `<g stroke="#8a6240" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".55"><path d="M20 24l4 0M22 24v-5M18 30h8M20 30l2 6M24 30l-2 6"/><circle cx="40" cy="26" r="3"/><path d="M40 29v6M37 32h6M32 44l5-3 5 3"/></g>`, ['glyphs', 'ruin']);

// ---- decals (transparent) ----
const dec = (name, v, fn, tags = []) => tile('decals', name, v, [T, T], ['decal', ...tags], fn);
for (const [v, y0] of [['a', 24], ['b', 34], ['c', 28]]) dec('sand-ripples', v, (t, r) => [0, 1, 2].map(i => line(`M${12 + i * 3} ${y0 + i * 9}q6-4 12 0t12 0t12 0`, '#b98d52', 1.3, .5) + line(`M${14 + i * 3} ${y0 + 1.5 + i * 9}q6-4 12 0t12 0`, '#fff6d8', 1, .6)).join(''));
dec('wind-scour', 'a', () => line('M10 22q18-8 40 0', '#fff6d8', 3, .5) + line('M14 34q18-6 38 2', '#b98d52', 2, .28) + line('M8 46q16-6 40-1', '#fff6d8', 2.4, .45) + ell(52, 40, 4, 2, '#fff6d8', .5));
dec('camel-tracks', 'a', () => [[14, 44], [24, 38], [34, 33], [44, 26], [52, 20]].map(([x, y], i) => ell(x, y + (i % 2 ? 3 : 0), 3.2, 2.2, '#b98d52', .4, -20) + ell(x - .6, y - .6 + (i % 2 ? 3 : 0), 2.2, 1.4, '#7a5a30', .22, -20)).join(''));
dec('foot-prints', 'a', () => [[16, 46], [24, 40], [31, 34], [40, 30], [49, 22]].map(([x, y], i) => ell(x, y + (i % 2 ? 2 : 0), 2, 3.4, '#b98d52', .38, 60) + ell(x - .5, y - .5 + (i % 2 ? 2 : 0), 1.3, 2.4, '#7a5a30', .2, 60)).join(''));
dec('snake-trail', 'a', () => line('M8 40q8-10 14-2t14-2t14-8', '#b98d52', 2.4, .35) + line('M8 39q8-10 14-2t14-2t14-8', '#fff6d8', 1, .5));
dec('sand-drift', 'a', (t, r) => ell(32, 44, 20, 5, '#a8783c', .13) + path('M12 44Q22 28 36 30Q50 32 54 44Q32 49 12 44Z', t.lg(['#fbeec6', '#e8c98c', '#c4a064'], 60), .92) + ell(26, 36, 8, 2.2, '#fffaf0', .6, -12), ['dune']);
dec('sand-drift', 'b', (t, r) => ell(32, 46, 14, 4, '#a8783c', .13) + path('M18 46Q26 34 36 36Q46 38 48 46Q32 50 18 46Z', t.lg(['#fbeec6', '#e8c98c', '#c4a064'], 60), .92) + ell(30, 40, 6, 1.8, '#fffaf0', .6, -12), ['dune']);
dec('pebble-scatter', 'a', (t, r) => pts(r, 6, 12, 10).map(([x, y]) => pebbleD(x, y, r.range(.5, 1), r.pick([D.stone, ['#e4d6b8', '#b49b74']]))).join(''));
dec('bone-scatter', 'a', () => `<g stroke="#6b5a40" stroke-width=".6" stroke-opacity=".6">` + [[20, 36, 20], [34, 28, -40], [42, 42, 70], [26, 46, 5]].map(([x, y, a]) => `<g transform="rotate(${a} ${x} ${y})"><rect x="${x - 6}" y="${y - 1.1}" width="12" height="2.2" rx="1.1" fill="#f4ead2"/><circle cx="${x - 6}" cy="${y - 1}" r="1.5" fill="#f4ead2"/><circle cx="${x - 6}" cy="${y + 1}" r="1.5" fill="#f4ead2"/><circle cx="${x + 6}" cy="${y}" r="1.7" fill="#f4ead2"/></g>`).join('') + '</g>');
dec('crack-large', 'a', () => line('M10 20l10 6l-2 8l12 4l6 10l10 2', '#6b5030', 1.4, .6) + line('M20 26l6-6M30 38l8-4M36 48l-2 8', '#6b5030', 1, .5) + line('M11 21l10 6l-2 8l12 4l6 10l10 2', '#fbf0d6', .8, .45));
dec('crack-large', 'b', () => line('M14 10l6 12l-6 10l10 10l-2 10', '#6b5030', 1.4, .6) + line('M20 22l12-2M24 42l14 4', '#6b5030', 1, .5) + line('M15 10l6 12l-6 10l10 10l-2 10', '#fbf0d6', .8, .45));
dec('dry-grass', 'a', () => [[20, 44], [34, 36], [44, 46]].map(([x, y], i) => dryTuft(x, y, 1 - i * .1)).join(''));
dec('dry-grass', 'b', () => [[16, 40], [30, 46], [46, 34], [36, 24]].map(([x, y], i) => dryTuft(x, y, .9)).join(''));
dec('scarab', 'a', () => ell(33, 36, 3, 2, '#3b3a24', .18) + ell(32, 34, 2.6, 3.2, '#2a4a63', 1, 0, ink('#10202c', .5, .8)) + ell(31.4, 33, 1, 1.4, '#7fc8e0', .8) + circ(32, 30.4, 1.2, '#10202c') + line('M29.6 33l-3 -1M29.5 35l-3 1M34.4 33l3-1M34.5 35l3 1', '#10202c', .7, .8));
dec('lizard', 'a', () => ell(33, 38, 8, 3, '#3b3a24', .14) + path('M22 36Q28 32 36 34Q42 35 46 33Q42 38 36 38Q28 40 22 36Z', '#a8a060', 1, ink('#5a5a30', .6, .8)) + line('M22 36q-5 1-8 5', '#a8a060', 1.4, 1) + line('M28 34l-2 -3M30 38l-2 3M38 34l2 -3M37 38l2 3', '#8a8448', 1.2) + circ(45, 33.6, .6, '#222'));
dec('oleander-petals', 'a', (t, r) => pts(r, 7, 10, 7).map(([x, y]) => ell(x, y, 1.8, 1, r.pick(['#f6a0b8', '#fbdde6']), .9, r.range(0, 180))).join(''));
dec('palm-litter', 'a', (t, r) => pts(r, 3, 12, 14).map(([x, y]) => line(`M${f(x - 7)} ${f(y)}q7-4 14 0`, '#8a9a4c', 1.4, .9) + line(`M${f(x - 5)} ${f(y - .4)}l1.6 -2M${f(x - 1)} ${f(y - 1.6)}l1.2 -2.4M${f(x + 3)} ${f(y - 1.2)}l1.6 -2`, '#6f8a3e', .8, .8)).join(''));

// ---- autotile 1: dune-ridge (raised sand dune: lit slope upper-left, shaded lee side lower-right) ----
const LIGHT = 'M0 0H64V24H0ZM0 24H24V64H0Z';
const shade = (t, G, dark, light, wd = 13, wl = 8) => {   // explicit side strokes, so every run of a side is continuous across tiles
  const st = (d, c, w) => path(d, 'none', 1, { stroke: c[0], 'stroke-width': w * 2, 'stroke-opacity': c[1] });
  let o = '';
  if (!G.h(16)) o += st(`M${G.x0} ${G.y1}H${G.x1}`, dark, wd);
  if (!G.h(4)) o += st(`M${G.x1} ${G.y0}V${G.y1}`, dark, wd);
  if (!G.h(1)) o += st(`M${G.x0} ${G.y0}H${G.x1}`, light, wl);
  if (!G.h(64)) o += st(`M${G.x0} ${G.y0}V${G.y1}`, light, wl);
  return o;
};
blobSet('dune-ridge', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['dune'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(sandBase());
    t.add(`<path d="${G.d}" transform="translate(4 5)" fill="#8a5a2a" opacity=".22"/>`);
    t.add(`<g clip-path="${clip}">`, duneBase(), shade(t, G, ['#9a642c', .42], ['#fff8e0', .7], 13, 8), '</g>');
    t.add(path(G.d, 'none', 1, { stroke: '#b98d52', 'stroke-width': 1.2, 'stroke-opacity': .5, 'stroke-linejoin': 'round' }));
  },
});
// ---- autotile 2: oasis-shore (turquoise pool with a sandy bank, grass outside) ----
blobSet('oasis-shore', {
  mg: { n: 9, e: 9, s: 9, w: 9 }, R: 22, tags: ['water', 'oasis'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(oasisBase());
    t.add(path(G.d, 'none', 1, { stroke: '#ecd9a0', 'stroke-width': 17, 'stroke-opacity': .85, 'stroke-linejoin': 'round' }));
    t.add(path(G.d, 'none', 1, { stroke: '#a88c52', 'stroke-width': 9, 'stroke-opacity': .22, 'stroke-linejoin': 'round' }));
    t.add(`<g clip-path="${clip}">`, owatBase(), path(G.d, 'none', 1, { stroke: '#d4f4ec', 'stroke-width': 13, 'stroke-opacity': .5, 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#f2fffa', 'stroke-width': 5, 'stroke-opacity': .5, 'stroke-linejoin': 'round' }), '</g>');
    t.add(path(G.d, 'none', 1, { stroke: '#2f8a98', 'stroke-width': 1.3, 'stroke-opacity': .5, 'stroke-linejoin': 'round' }));
  },
});
// ---- autotile 3: hardpan-patch (cracked clay pan on sand) ----
blobSet('hardpan-patch', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['hardpan'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(sandBase());
    t.add(path(G.d, 'none', 1, { stroke: '#9f8058', 'stroke-width': 9, 'stroke-opacity': .2, 'stroke-linejoin': 'round' }));
    t.add(`<g clip-path="${clip}">`, panBase(), path(G.d, 'none', 1, { stroke: '#e2cca4', 'stroke-width': 8, 'stroke-opacity': .5, 'stroke-linejoin': 'round' }), '</g>');
    t.add(path(G.d, 'none', 1, { stroke: '#8a6a44', 'stroke-width': 1.2, 'stroke-opacity': .5, 'stroke-linejoin': 'round' }));
  },
});
// ---- autotile 4: sandstone-cliff (raised plateau with a stratified wall on the S side) ----
const BANDS = ['#e8b88a', '#d49a68', '#c88a5c', '#d8a876', '#b87a52', '#c48e60'];
blobSet('sandstone-cliff', {
  mg: { n: 8, e: 8, s: 6, w: 8 }, R: 14, tags: ['cliff'], build(t, G) {
    const clip = t.clip(G.d), WALL = 24, hasS = G.h(16), wy = T - G.mg.s, EXT = 26;
    t.add(sandBase());
    if (!hasS) t.add(rect(G.x0, wy - 1, G.x1 - G.x0, 9, '#3b2a14', 0, .18), rect(G.x0 + 2, wy, G.x1 - G.x0 - 4, 4, '#2e1e0a', 0, .13));
    t.add(path(G.d, 'none', 1, { stroke: '#8a5a3a', 'stroke-width': 5, 'stroke-opacity': .18, 'stroke-linejoin': 'round' }));
    t.add(`<g clip-path="${clip}">`, slabBase());
    const r = rng(hash('sc-top'));
    for (let i = 0; i < 2; i++) { const x = r.range(0, T), y = r.range(0, T); t.add(wrapped(x, y, 7, (a, b) => pebbleD(a, b, .8, D.stone))); }
    t.add(path(G.d, 'none', 1, { stroke: '#fbf0d6', 'stroke-width': 7, 'stroke-opacity': .45, 'stroke-linejoin': 'round' }));
    const walls = []; if (!hasS) walls.push([G.x0, G.x1]);
    if (G.notches.length) { if (G.h(16) && G.h(64) && !G.h(32)) walls.push([-EXT, G.mg.w]); if (G.h(16) && G.h(4) && !G.h(8)) walls.push([T - G.mg.e, T + EXT]); }
    for (const [a, b] of walls) {
      const bh = WALL / BANDS.length;
      BANDS.forEach((c, k) => t.add(rect(a, wy - WALL + k * bh, b - a, bh + .6, c)));
      t.add(rect(a, wy - WALL, b - a, 3, '#fff2d8', 0, .6));
      for (let k = 1; k < BANDS.length; k++) t.add(rect(a, wy - WALL + k * bh - .4, b - a, .9, '#6b3a22', 0, .35));
      t.add(rect(a, wy - 6, b - a, 6, '#3b2210', 0, .2));
      const wr = rng(hash('sc-wall'));
      for (let i = 0; i < 4; i++) { const x = wr.range(0, T); t.add(wrapped(x, wy - WALL / 2, 5, (aa, bb) => line(`M${f(aa)} ${f(wy - WALL + 3 + wr.range(0, 5))}l2 4l-2 5`, '#6b3a22', 1, .5))); }
      // sand talus at the foot
      t.add(rect(a, wy - 1, b - a, 3, '#e8c98c', 0, .5));
    }
    t.add('</g>');
    t.add(path(G.d, 'none', 1, { stroke: '#8a5a3a', 'stroke-width': 1.2, 'stroke-opacity': .55, 'stroke-linejoin': 'round' }));
  },
});

// ---- connect-4: mud-brick wall (bits N1 E2 S4 W8). Top face at elevation, front (south) face below it; arms reach the cell edge ----
const WALLW = 14, WH = 15, TY = 20;     // top strip half-width 7, top y centre = TY+? (top face band y 22..36 at the centre), wall height 15
for (let m = 0; m < 16; m++) {
  const v = String(m).padStart(2, '0'), t = mk('fences', 'wall-mudbrick', v);
  const N = m & 1, E = m & 2, S = m & 4, W = m & 8, cx = 32, cy = 34, hw = WALLW / 2, x0 = W ? 0 : cx - hw, x1 = E ? 64 : cx + hw, y0 = N ? 0 : cy - hw - 2, y1 = S ? 64 : cy + hw - 2;
  const topG = t.lg(['#e8c294', '#d6a874'], 60), frontG = t.lg([D.brick[1], D.brick[2]], 90);
  // ground shadow (lower right)
  t.add(rect(x0 + 2, y1 + WH - 3, x1 - x0, 5, '#3b2a14', 3, .16), rect(x0 + 3, y1 + WH - 1, x1 - x0 - 3, 3, '#2e1e0a', 2, .12));
  // front faces: E/W arms and the end cap (only where no S arm continues)
  const segs = !S ? [[x0, x1]] : [...(W ? [[0, cx - hw]] : []), ...(E ? [[cx + hw, 64]] : [])];
  for (const [fx0, fx1] of segs) {
    const yf = cy + hw - 2;
    t.add(rect(fx0, yf, fx1 - fx0, WH, frontG, 0, 1));
    t.add(rect(fx0, yf + WH - 2, fx1 - fx0, 2, '#5a3a24', 0, .25));
    let bj = '', rows = 3; for (let k = 1; k < rows; k++) bj += `M${f(fx0)} ${f(yf + k * WH / rows)}H${f(fx1)}`;
    for (let k = 0; k < rows; k++) for (let X = (k % 2 ? 4 : 0); X <= 64; X += 8) if (X >= fx0 + 1 && X <= fx1 - 1) bj += `M${X} ${f(yf + k * WH / rows)}v${f(WH / rows)}`;
    t.add(line(bj, '#6b4528', .9, .5));
    t.add(rect(fx0, yf, fx1 - fx0, 2.4, '#fff2d8', 0, .35));
    if (fx0 === x0 && !W) t.add(`<path d="M${fx0} ${yf}V${yf + WH}" stroke="#5a3a24" stroke-width=".9" opacity=".7"/>`);
    if (fx1 === x1 && !E) t.add(`<path d="M${fx1} ${yf}V${yf + WH}" stroke="#5a3a24" stroke-width=".9" opacity=".7"/>`);
  }
  if (N || S) t.add(rect(cx + hw, N ? 0 : cy, 5, (S ? 64 : cy + hw + WH) - (N ? 0 : cy), '#3b2a14', 0, .14));
  // top face (union of centre + arms)
  let top = `M${x0} ${cy - hw - 2}`; const boxes = [[cx - hw, cy - hw - 2, cx + hw, cy + hw - 2]];
  if (N) boxes.push([cx - hw, 0, cx + hw, cy]); if (S) boxes.push([cx - hw, cy, cx + hw, 64]); if (W) boxes.push([0, cy - hw - 2, cx, cy + hw - 2]); if (E) boxes.push([cx, cy - hw - 2, 64, cy + hw - 2]);
  for (const [a, b, c, d] of boxes) t.add(rect(a - .02, b - .02, c - a + .04, d - b + .04, topG));
  // outline of top: draw edges of the strip only on free sides
  let ol = '';
  const ty0 = cy - hw - 2, ty1 = cy + hw - 2;
  if (!N) ol += `M${f(x0)} ${f(ty0)}H${f(x1)}`; else { if (!W) ol += `M${cx - hw} ${ty0}V0`; if (!E) ol += `M${cx + hw} ${ty0}V0`; }
  if (!S) ol += `M${f(x0)} ${f(ty1)}H${f(x1)}`;
  if (!W && !N) ol += `M${x0} ${ty0}V${ty1}`; if (!W && N) ol += `M${x0} ${ty0}V${ty1}`; if (!E) ol += `M${f(x1)} ${f(ty0)}V${f(ty1)}`;
  if (W) { if (!N) ol += `M0 ${ty0}H${cx - hw}`; if (!S) ol += `M0 ${ty1}H${cx - hw}`; }
  if (E) { if (!N) ol += `M${cx + hw} ${ty0}H64`; if (!S) ol += `M${cx + hw} ${ty1}H64`; }
  if (S) { ol += !W ? `M${cx - hw} ${ty1}V64` : ''; ol += !E ? `M${cx + hw} ${ty1}V64` : ''; }
  t.add(line(ol, '#6b4528', 1, .8));
  // top texture: light upper-left edge and straw flecks (aligned to global grid so arms continue)
  const wr = rng(hash('wall-top')); let fl = '';
  for (let i = 0; i < 6; i++) { const x = 4 + i * 11 + wr.range(-2, 2), y = cy - 2 + wr.range(-3, 3); if (((x > x0 && x < x1) && Math.abs(y - (cy - 2)) < hw)) fl += `M${f(x)} ${f(y)}l3 .4`; }
  t.add(line(fl, '#a8743c', 1, .5));
  if (!N) t.add(rect(x0 + 1, ty0 + 1, x1 - x0 - 2, 1.6, '#fff6e0', 0, .45));
  out(t, 'fences', 'wall-mudbrick', v, ['autotile', 'connect4', 'mask:' + m, 'wall', 'obstacle']);
}
