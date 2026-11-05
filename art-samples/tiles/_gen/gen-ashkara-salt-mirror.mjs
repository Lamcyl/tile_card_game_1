// Ashkara sub-area 4: Salt Mirror (ashkara/salt-mirror). Ground, ground-detail, four 47-blob autotile sets, three connect-4 sets.
// Objects: gen-ashkara-salt-mirror-objects.mjs; interest/landmark/gate: ...-interest.mjs; decals + overlays: ...-decals.mjs. Every file runs on its own (helpers live in salt-mirror-lib.mjs).
// Palette shift: near-white bleached ground, pink brine, hard cold light; cracked hardpan, salt crust, shallow brine, mirage shimmer.
import { T, rng, f, ell, circ, rect, path, line, ink, wrapped, D, FAMS, dskel, dint, speckle, ripples, crackNet, sh, pebbleD, tuft, mix, SALT, PAN, MUD, GYP, BRSH, BRDP, MIRG, APRI, CREAM, RED, ramp, glare, saltBase, polyBase, flatBase, panBase, mudBase, gypBase, brineBase, deepBase, mirageBase, sandSaltBase, mkT, outT, tile, blobSet, C, pts, wscat, stroke, sides, arms, SLT, CLD, PNK, IRON, RUST, WOODS, BONE, mound, crystal, bone, skull, sblock } from './salt-mirror-lib.mjs';

const ground = (cat, name, v, base, fn, tags = []) => tile(cat, name, v, C, ['seamless', cat === 'ground' ? 'ground' : 'ground-detail', ...tags], (t, r) => base() + fn(r, t));
const sp = (r, n, s = [.5, .9], c = '#fff') => pts(r, n, 10, 11).map(([x, y]) => circ(x, y, r.range(...s), c, .85)).join('');
// ---------------- ground ----------------
const sa = (seed, o = {}) => dint(SALT, seed, { n: 3, ...o });
ground('ground', 'salt-crust', 'a', saltBase, () => sa(9801));
ground('ground', 'salt-crust', 'b', saltBase, () => sa(9802, { cols: ['#fbf6ee', '#e0d8cb'] }) + glare(9802, 2, '#c9bcab', .3, 12, 18));
ground('ground', 'salt-crust', 'c', saltBase, (r) => sa(9803) + crackNet(9803, '#c0b0a0', .35, .4), ['cracks']);
ground('ground', 'salt-crust', 'd', saltBase, (r) => sa(9804) + sp(r, 6, [.5, 1]), ['glint']);
ground('ground', 'salt-polygon', 'a', () => polyBase(31), () => '', ['cracks', 'polygons']);
ground('ground', 'salt-polygon', 'b', () => polyBase(33), (r) => sa(9812, { n: 2 }) + sp(r, 4), ['cracks', 'polygons']);
ground('ground', 'salt-polygon', 'c', () => polyBase(35), (r) => sa(9813, { n: 2 }), ['cracks', 'polygons']);
ground('ground', 'salt-flat', 'a', flatBase, () => sa(9821, { n: 2 }));
ground('ground', 'salt-flat', 'b', flatBase, (r) => sa(9822, { n: 2 }) + sp(r, 5, [.4, .8]), ['glint']);
// puffy salt crust: raised blisters with a cold shade side
const blister = (x, y, s) => ell(x + 1.6 * s, y + 1.8 * s, 6 * s, 3 * s, CLD[1], .22) + ell(x, y, 6 * s, 3.2 * s, '#fffdf8', 1, 0, ink('#cfc2b4', .6, .8)) + ell(x - 1.4 * s, y - .8 * s, 3 * s, 1.2 * s, '#fff', .9);
ground('ground', 'salt-puffed', 'a', saltBase, (r) => sa(9831, { n: 2 }) + pts(r, 4, 12, 15).map(([x, y]) => blister(x, y, r.range(.8, 1.2))).join(''), ['puffy']);
ground('ground', 'salt-puffed', 'b', saltBase, (r) => sa(9832, { n: 2 }) + pts(r, 5, 12, 13).map(([x, y]) => blister(x, y, r.range(.6, 1))).join(''), ['puffy']);
const pa = (seed) => dint(PAN, seed, { n: 3 });
ground('ground', 'pan-bleached', 'a', () => panBase(31), () => pa(9841));
ground('ground', 'pan-bleached', 'b', () => panBase(33), () => pa(9842) + glare(9842, 2, '#fff6e6', .4, 12, 18));
ground('ground', 'pan-bleached', 'c', () => panBase(35), (r) => pa(9843) + pts(r, 4, 10, 12).map(([x, y]) => pebbleD(x, y, r.range(.3, .5), ['#f6eedc', '#bda98c'])).join(''), ['pebbles']);
// curled mud flakes
const flake = (x, y, a, s) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">` + ell(1, 1.8, 6 * s, 3 * s, '#3b3a24', .14) + path(`M${-6 * s} 0Q${-4 * s} ${-3.4 * s} ${0} ${-3 * s}Q${5 * s} ${-3 * s} ${6 * s} 0Q${3 * s} ${3 * s} ${-2 * s} ${3 * s}Z`, '#e8dcc8', 1, ink('#8f7a62', .6, .85)) + line(`M${-4 * s} ${-1 * s}Q0 ${-2.4 * s} ${4 * s} ${-.6 * s}`, '#fff', .8, .8) + `</g>`;
ground('ground', 'pan-flaked', 'a', () => panBase(37), (r) => pts(r, 5, 11, 13).map(([x, y]) => flake(x, y, r.range(0, 180), r.range(.8, 1.1))).join(''), ['flakes']);
ground('ground', 'pan-flaked', 'b', () => panBase(39), (r) => pts(r, 6, 10, 11).map(([x, y]) => flake(x, y, r.range(0, 180), r.range(.6, .9))).join(''), ['flakes']);
const mu = (seed) => dint(MUD, seed, { n: 3 });
ground('ground', 'mud-brine', 'a', mudBase, () => mu(9851));
ground('ground', 'mud-brine', 'b', mudBase, (r) => mu(9852) + pts(r, 3, 12, 15).map(([x, y]) => ell(x, y, r.range(3, 5), r.range(1.4, 2.4), '#e690a8', .55, 0, ink('#fff0f4', .7, .7))).join(''), ['wet']);
ground('ground', 'mud-brine', 'c', mudBase, (r) => mu(9853) + glare(9853, 3, '#f2e2dc', .4, 12, 20), ['wet']);
ground('ground', 'gypsum-flour', 'a', gypBase, () => dint(GYP, 9861, { n: 3 }));
ground('ground', 'gypsum-flour', 'b', gypBase, (r) => dint(GYP, 9862, { n: 3 }) + pts(r, 5, 10, 11).map(([x, y]) => crystal(x, y + 2, r.range(3, 5), 2, r.range(-20, 20))).join(''), ['crystals']);
const ss = (seed) => dint(ramp(FAMS.sand, SALT, .45), seed, { n: 3 });
ground('ground', 'salt-sand', 'a', sandSaltBase, () => ss(9871));
ground('ground', 'salt-sand', 'b', sandSaltBase, () => ss(9872) + glare(9872, 3, '#c9a468', .3, 12, 20));
ground('ground', 'salt-sand', 'c', sandSaltBase, (r) => ss(9873) + sp(r, 6, [.5, .9]), ['glint']);
// water tiles as full ground: shallow brine, deep brine, wet mirror
ground('ground', 'brine-shallow', 'a', brineBase, () => dint(BRSH, 9881, { n: 3 }), ['water', 'brine']);
ground('ground', 'brine-shallow', 'b', brineBase, () => dint(BRSH, 9882, { n: 3 }) + glare(9882, 3, '#fff4f6', .6, 10, 16), ['water', 'brine']);
ground('ground', 'brine-shallow', 'c', brineBase, (r) => dint(BRSH, 9883, { n: 3 }) + sp(r, 4, [.6, 1], '#fff4f6'), ['water', 'brine', 'sparkle']);
ground('ground', 'brine-deep', 'a', deepBase, () => dint(BRDP, 9891, { n: 3 }), ['water', 'brine', 'deep']);
ground('ground', 'brine-deep', 'b', deepBase, (r) => dint(BRDP, 9892, { n: 3 }) + sp(r, 4, [.6, 1], '#f6c0cc'), ['water', 'brine', 'deep', 'sparkle']);
ground('ground', 'mirage-flat', 'a', mirageBase, () => dint(MIRG, 9895, { n: 3 }), ['water', 'mirage']);
ground('ground', 'mirage-flat', 'b', mirageBase, (r) => dint(MIRG, 9896, { n: 3 }) + glare(9896, 3, '#ffffff', .85, 16, 26), ['water', 'mirage', 'sparkle']);
// ramps: salt into the common ground, the Singing Erg sand to the west, the Dune Shallows sand to the south, the Red Wadi shelves to the north, and water/mud into salt
for (const [name, from, to, seed, nm] of [
  ['salt-sand-fringe', SALT, FAMS.sand, 9900], ['salt-dune-fringe', SALT, FAMS.dune, 9910], ['salt-pan-fringe', SALT, FAMS.pan, 9920], ['salt-apricot-fringe', SALT, APRI, 9930], ['salt-cream-fringe', SALT, CREAM, 9940], ['salt-red-fringe', SALT, RED, 9950],
  ['pan-apricot-fringe', PAN, APRI, 9960], ['pan-cream-fringe', PAN, CREAM, 9970], ['pan-red-fringe', PAN, RED, 9980], ['pan-common-fringe', PAN, FAMS.pan, 9990],
]) for (const [v, u] of [['a', .35], ['b', .7]]) ground('ground', name, v, () => dskel(ramp(from, to, u)), (r) => dint(ramp(from, to, u), seed + u * 10, { n: 3 }) + pts(r, 2, 12, 16).map(([x, y]) => circ(x, y, .7, '#fff', .7)).join(''), ['ramp', 'blend']);
for (const [name, from, to, seed] of [['brine-salt-fringe', BRSH, SALT, 10010], ['mud-salt-fringe', MUD, SALT, 10020], ['mirage-salt-fringe', MIRG, SALT, 10030], ['gypsum-salt-fringe', GYP, SALT, 10040], ['pan-salt-fringe', PAN, SALT, 10050], ['mud-pan-fringe', MUD, PAN, 10060]])
  ground('ground', name, 'a', () => dskel(ramp(from, to, .5)), () => dint(ramp(from, to, .5), seed, { n: 3 }), ['ramp', 'blend']);

// ---------------- ground-detail ----------------
const mineral = (x, y, s, col) => ell(x, y, 5 * s, 2.6 * s, col, .45, r0(x), ink(col, .5, .3));
const r0 = (x) => (x * 37) % 180;
const flamPrint = (x, y, a) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">` + line('M0 0L-3 -6M0 0L0 -7M0 0L3 -6', '#9a6a7c', 1, .7) + line('M-3 -6L0 -7L3 -6', '#9a6a7c', .8, .5) + `</g>`;
const rustp = (x, y, a) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">` + ell(.8, 1.2, 5, 1.6, '#3b3a24', .15) + rect(-5, -1.3, 10, 2.6, '#a8603c', 1, 1, ink('#5a2a14', .5, .85)) + line('M-4 -.3H4', '#d89a74', .6, .8) + `</g>`;
ground('ground-detail', 'salt-crystals', 'a', saltBase, (r) => sa(9911, { n: 2 }) + pts(r, 6, 11, 10).map(([x, y]) => crystal(x, y + 3, r.range(4, 7), r.range(2, 3), r.range(-18, 18))).join(''), ['crystals', 'loot']);
ground('ground-detail', 'salt-crystals', 'b', polyBase, (r) => pts(r, 4, 12, 14).map(([x, y]) => crystal(x - 3, y + 3, r.range(5, 8), 2.6, -12) + crystal(x + 2, y + 4, r.range(3, 6), 2, 10)).join(''), ['crystals', 'loot']);
ground('ground-detail', 'halite-cubes', 'a', saltBase, (r) => pts(r, 6, 10, 10).map(([x, y]) => { const s = r.range(.8, 1.3); return ell(x + 1, y + 2, 4 * s, 1.4 * s, '#3b3a24', .15) + rect(x - 2.4 * s, y - 2.4 * s, 4.8 * s, 4.8 * s, '#fbf6ee', 1, 1, ink('#8f9ac0', .7, .8)) + path(`M${f(x - 2.4 * s)} ${f(y - 2.4 * s)}L${f(x - 1.2 * s)} ${f(y - 3.6 * s)}H${f(x + 3.6 * s)}L${f(x + 2.4 * s)} ${f(y - 2.4 * s)}Z`, '#fff', 1, ink('#8f9ac0', .5, .8)); }).join(''), ['crystals']);
ground('ground-detail', 'pink-algae', 'a', brineBase, (r) => dint(BRSH, 9921, { n: 2 }) + wscat(9921, 6, (r) => ({ w: r.range(10, 18) }), (x, y, p) => line(`M${f(x - p.w / 2)} ${f(y)}q${f(p.w / 4)} -3 ${f(p.w / 2)} 0t${f(p.w / 2)} 0`, '#c0406a', 2.2, .4), 10), ['algae', 'brine']);
ground('ground-detail', 'pink-algae', 'b', mudBase, (r) => mu(9922) + pts(r, 4, 12, 13).map(([x, y]) => ell(x, y, r.range(4, 7), r.range(2, 3), '#e06a90', .38, r.range(-20, 20), ink('#a8486a', .6, .35))).join(''), ['algae', 'brine']);
ground('ground-detail', 'brine-shrimp', 'a', brineBase, (r) => dint(BRSH, 9923, { n: 2 }) + pts(r, 8, 9, 8).map(([x, y]) => line(`M${f(x)} ${f(y)}q1.4 -1.4 2.6 0`, '#c0406a', 1.1, .85)).join(''), ['brine', 'creature']);
ground('ground-detail', 'flamingo-prints', 'a', mudBase, (r) => mu(9931) + [[10, 50, -70], [22, 38, -50], [34, 30, -60], [46, 20, -75], [56, 10, -55]].map(([x, y, a]) => flamPrint(x, y, a)).join(''), ['tracks', 'bird']);
ground('ground-detail', 'flamingo-prints', 'b', mudBase, (r) => mu(9932) + [[12, 16, 70], [24, 28, 60], [38, 36, 80], [52, 46, 65]].map(([x, y, a]) => flamPrint(x, y, a + 180)).join(''), ['tracks', 'bird']);
ground('ground-detail', 'glass-shards', 'a', saltBase, (r) => pts(r, 5, 11, 12).map(([x, y]) => path(`M${f(x - 3)} ${f(y + 1.6)}L${f(x - .6)} ${f(y - 3)}L${f(x + 3.2)} ${f(y + 1)}L${f(x + 1)} ${f(y + 2.6)}Z`, 'rgba(176,226,214,.85)', 1, ink('#3f8f8a', .6, .8)) + line(`M${f(x - 1)} ${f(y)}L${f(x + 1)} ${f(y - 1.6)}`, '#fff', .7, .9)).join(''), ['glass', 'loot']);
ground('ground-detail', 'glass-shards', 'b', panBase, (r) => pts(r, 4, 11, 14).map(([x, y]) => path(`M${f(x - 2.4)} ${f(y + 2)}L${f(x - 1)} ${f(y - 3.4)}L${f(x + 2.6)} ${f(y + 1.4)}Z`, 'rgba(120,196,170,.85)', 1, ink('#2f6f6a', .6, .8)) + line(`M${f(x - 1)} ${f(y + 1)}L${f(x)} ${f(y - 2)}`, '#fff', .7, .9)).join(''), ['glass', 'loot']);
ground('ground-detail', 'salt-pebbles', 'a', saltBase, (r) => sa(9941, { n: 2 }) + pts(r, 7, 10, 9).map(([x, y]) => pebbleD(x, y, r.range(.3, .55), ['#ffffff', '#cbbfb0'])).join(''), ['pebbles']);
ground('ground-detail', 'evaporation-rings', 'a', saltBase, (r) => [[22, 24, 11], [44, 42, 14], [14, 48, 7]].map(([x, y, rr]) => [0, 1, 2].map(i => ell(x, y, rr - i * 3, (rr - i * 3) * .55, 'none', .6, 0, ink(['#e690a8', '#d8c8b8', '#f2e0e6'][i], 1, .55))).join('')).join(''), ['rings', 'brine']);
ground('ground-detail', 'sulphur-stain', 'a', gypBase, (r) => pts(r, 4, 12, 14).map(([x, y]) => ell(x, y, r.range(5, 9), r.range(2.4, 4), '#e8d46a', .42, r.range(-30, 30))).join('') + sp(r, 4), ['stain']);
ground('ground-detail', 'rust-stain', 'a', panBase, (r) => pts(r, 3, 12, 15).map(([x, y]) => ell(x, y, r.range(5, 8), r.range(2.4, 4), '#b8683c', .38, r.range(-30, 30))).join(''), ['stain']);
ground('ground-detail', 'rail-spikes', 'a', panBase, (r) => pts(r, 4, 12, 14).map(([x, y]) => rustp(x, y, r.range(0, 180))).join(''), ['rust', 'loot']);
ground('ground-detail', 'bone-flecks', 'a', saltBase, (r) => pts(r, 5, 10, 12).map(([x, y]) => bone(x, y, r.range(6, 10), r.range(0, 180))).join(''), ['bones']);
ground('ground-detail', 'bone-flecks', 'b', panBase, (r) => pts(r, 4, 12, 13).map(([x, y]) => bone(x, y, r.range(6, 9), r.range(0, 180))).join('') + circ(44, 44, 2.2, '#f4ecd8', 1, ink('#8a7458', .5, .8)), ['bones']);
ground('ground-detail', 'camel-prints', 'a', panBase, (r) => { let o = ''; for (let i = 0; i < 6; i++) { const x = 6 + i * 10, y = 30 + (i % 2) * 8 - i * 1.2; o += ell(x, y, 3, 2.2, '#8f7a62', .55) + ell(x, y, 1.2, 1, '#e0d2bf', .6); } return o; }, ['tracks']);
ground('ground-detail', 'wheel-ruts', 'a', panBase, () => line('M-2 24Q20 22 40 26T66 24', '#8f7a62', 2.6, .55) + line('M-2 40Q20 38 40 42T66 40', '#8f7a62', 2.6, .55) + line('M-2 25.4Q20 23.4 40 27.4T66 25.4', '#fff6e6', .9, .6) + line('M-2 41.4Q20 39.4 40 43.4T66 41.4', '#fff6e6', .9, .6), ['tracks', 'cart']);
ground('ground-detail', 'mud-curls', 'a', mudBase, (r) => pts(r, 5, 11, 12).map(([x, y]) => flake(x, y, r.range(0, 180), r.range(.7, 1))).join(''), ['flakes']);
ground('ground-detail', 'salt-frost', 'a', saltBase, () => wscat(9951, 12, () => ({}), (x, y) => line(`M${f(x)} ${f(y)}l2 -2M${f(x)} ${f(y)}l2 2M${f(x)} ${f(y)}l-2 -2M${f(x)} ${f(y)}l-2 2M${f(x - 2.6)} ${f(y)}h5.2M${f(x)} ${f(y - 2.6)}v5.2`, '#fff', .8, .9), 4), ['crystals', 'efflorescence']);
ground('ground-detail', 'samphire-sprouts', 'a', mudBase, (r) => mu(9961) + pts(r, 6, 10, 9).map(([x, y]) => line(`M${f(x)} ${f(y + 3)}v-5M${f(x - 1.6)} ${f(y + 3)}l-1 -4M${f(x + 1.6)} ${f(y + 3)}l1 -4`, '#c0406a', 1.4, .95) + circ(x, y - 2, .8, '#e06a90')).join(''), ['plants']);
ground('ground-detail', 'mirage-streaks', 'a', mirageBase, () => dint(MIRG, 9971, { n: 2 }) + glare(9971, 6, '#ffffff', .8, 18, 30) + glare(9972, 3, '#8aaabf', .3, 18, 28), ['mirage']);

// ---------------- autotiles (47-blob) ----------------
// 1. brine-pool: shallow pink brine inside a white salt-crust lip
blobSet('brine-pool', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['water', 'brine', 'shore'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(saltBase(), stroke(G.d, '#e690a8', 15, .2), stroke(G.d, '#f6dce2', 9, .55), stroke(G.d, '#ffffff', 5, .95, -.5, -.5));
    t.add(`<g clip-path="${clip}">`, brineBase(), sides(G, ['#a8486a', .3], ['#fff4f6', .5], 9, 5), stroke(G.d, '#f6c0cc', 9, .3), '</g>');
    t.add(stroke(G.d, '#b4566f', 1.1, .6));
  },
});
// 2. brine-deep: deeper rose water that sits inside the shallow pool
blobSet('brine-deep', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['water', 'brine', 'deep'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(brineBase(), stroke(G.d, '#c85f82', 14, .25), stroke(G.d, '#a8486a', 6, .3));
    t.add(`<g clip-path="${clip}">`, deepBase(), sides(G, ['#4a1a30', .3], ['#f6c0cc', .4], 9, 5), stroke(G.d, '#8e3a5e', 10, .22), '</g>');
    t.add(stroke(G.d, '#7a2c4e', 1.1, .55));
  },
});
// 3. salt-crust-shelf: a raised plate of white crust with a pink-grey cliff on the shaded sides
blobSet('salt-crust-shelf', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 22, tags: ['salt', 'raised', 'obstacle'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(saltBase(), `<path d="${G.d}" transform="translate(5 6)" fill="#6e6c92" opacity=".3"/>`, `<path d="${G.d}" transform="translate(3 4)" fill="#9a98b8" opacity=".24"/>`);
    t.add(`<g clip-path="${clip}">`, polyBase(425), sides(G, ['#a8909c', .55], ['#ffffff', .85], 14, 7), sides(G, [CLD[1], .3], ['#ffffff', .5], 8, 3.4), '</g>');
    t.add(path(G.d, 'none', 1, { stroke: '#a89aa4', 'stroke-width': 1.2, 'stroke-opacity': .65, 'stroke-linejoin': 'round' }));
  },
});
// 4. mirage-flat: a wet glassy flat holding the sky, with a hairline of white at the rim
blobSet('mirage-flat', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['water', 'mirage', 'shore'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(saltBase(), stroke(G.d, '#8aaabf', 11, .18), stroke(G.d, '#ffffff', 5, .9));
    t.add(`<g clip-path="${clip}">`, mirageBase(), sides(G, ['#6a8aa4', .25], ['#ffffff', .6], 8, 5), stroke(G.d, '#ffffff', 7, .35), '</g>');
    t.add(stroke(G.d, '#7a9ab4', 1.1, .5));
  },
});

// ---------------- connect-4 (N1 E2 S4 W8) ----------------
// 1. wall-salt-block: a low wall of cut salt blocks, white tops, cold-violet shade
for (let m = 0; m < 16; m++) {
  const v = String(m).padStart(2, '0'), t = mkT('fences', 'wall-salt-block', v), cx = 32, cy = 40, r = rng(7300 + m);
  const segs = arms(m, cx, cy);
  t.add(ell(cx + 2, cy + 5, 11, 3.4, CLD[1], .3));
  for (const [a, b, c, d] of segs) {
    if (b === d) { const x0 = Math.min(a, c), x1 = Math.max(a, c);
      for (let x = x0; x < x1; x += 10) { const w = Math.min(10, x1 - x); t.add(sblock(t, x, cy - 6, w, 11, 4)); }
    } else { const y0 = Math.min(b, d), y1 = Math.max(b, d); for (let y = y0; y < y1; y += 9) { t.add(ell(cx + 1, y + 6, 8, 2.6, '#3b3a24', .1), sblock(t, cx - 6, y + 1, 12, 5, 3)); } }
  }
  t.add(sblock(t, cx - 7, cy - 10, 14, 15, 5), line(`M${cx - 4} ${cy - 3}h8`, '#c9bcab', .8, .6));
  outT(t, 'fences', 'wall-salt-block', v, ['autotile', 'connect4', 'mask:' + m, 'wall', 'salt', 'obstacle']);
}
// 2. track-mine: narrow-gauge mine rails on sleepers
for (let m = 0; m < 16; m++) {
  const v = String(m).padStart(2, '0'), t = mkT('fences', 'track-mine', v), cx = 32, cy = 36;
  const segs = arms(m, cx, cy), rail = (d, dy = 0, dx = 0) => line(d, '#3b3a3c', 3.4, .9, { transform: `translate(${dx} ${dy})` }) + line(d, '#8a8084', 2, 1, { transform: `translate(${dx} ${dy})` }) + line(d, '#e0d8dc', .7, .9, { transform: `translate(${dx - .3} ${dy - .6})` });
  const tie = (x, y, hor) => hor ? rect(x - 1.6, y - 8, 3.2, 16, WOODS[1], .6, 1, ink('#3b2a1a', .5, .8)) : rect(x - 8, y - 1.6, 16, 3.2, WOODS[1], .6, 1, ink('#3b2a1a', .5, .8));
  t.add(ell(cx + 1, cy + 6, 11, 4, '#fbf6ee', .7));
  for (const [a, b, c, d] of segs) {
    const hor = b === d;
    if (hor) { const x0 = Math.min(a, c), x1 = Math.max(a, c); for (let x = x0 + 3; x < x1; x += 8) t.add(tie(x, cy, true)); t.add(rail(`M${x0} ${cy - 4}H${x1}`), rail(`M${x0} ${cy + 4}H${x1}`)); }
    else { const y0 = Math.min(b, d), y1 = Math.max(b, d); for (let y = y0 + 3; y < y1; y += 8) t.add(tie(cx, y, false)); t.add(rail(`M${cx - 4} ${y0}V${y1}`), rail(`M${cx + 4} ${y0}V${y1}`)); }
  }
  if (m === 0) t.add(tie(cx, cy, false), rail(`M${cx - 4} ${cy - 6}V${cy + 6}`), rail(`M${cx + 4} ${cy - 6}V${cy + 6}`));
  if ([1, 2, 4, 8].includes(m)) { const [a, b, c, d] = segs[0]; const ex = a === c ? a : (m === 8 ? 4 : 60), ey = b === d ? b : (m === 1 ? 4 : 60); t.add(rect(m === 2 ? 56 : m === 8 ? 2 : cx - 7, m === 1 ? 2 : m === 4 ? 56 : cy - 7, a === c ? 14 : 3, a === c ? 3 : 14, '#a8603c', 1, 1, ink('#5a2a14', .6, .85))); }
  outT(t, 'fences', 'track-mine', v, ['autotile', 'connect4', 'mask:' + m, 'rail', 'mine']);
}
// 3. fence-salt-rope: crusted posts joined by a drooping rope hung with pink warning rags
for (let m = 0; m < 16; m++) {
  const v = String(m).padStart(2, '0'), t = mkT('fences', 'fence-salt-rope', v), cx = 32, cy = 42;
  t.add(ell(cx + 2, cy + 2, 8, 2.6, '#3b3a24', .18), mound(t, cx, cy + 1, 9, 3));
  const cord = (x0, y0, x1, y1, h) => { const mx = (x0 + x1) / 2, my = (y0 + y1) / 2; let o = line(`M${x0} ${y0 - h}Q${mx} ${my - h + 5} ${x1} ${y1 - h}`, '#6a5a44', 1.4, .95) + line(`M${x0} ${y0 - h - .8}Q${mx} ${my - h + 4.2} ${x1} ${y1 - h - .8}`, '#eadcc0', .6, .8); const u = .5, bx = mx, by = .25 * (y0 - h) + .5 * (my - h + 5) + .25 * (y1 - h) + 1; return o + path(`M${f(bx - 1.6)} ${f(by)}h3.2l1 5.4l-2.6 -1.2l-2.6 1.2Z`, '#e06a90', 1, ink('#7a2c4e', .5, .85)); };
  for (const [a, b, c, d] of arms(m, cx, cy)) for (const h of [16, 26]) t.add(cord(a, b, c, d, h * (a === c ? .6 : 1)));
  t.add(path(`M${cx - 2.8} ${cy}L${cx - 2.2} ${cy - 32}Q${cx} ${cy - 34.4} ${cx + 2.2} ${cy - 32}L${cx + 2.8} ${cy}Z`, t.lg(WOODS, 0), 1, ink('#4a3a28', .8, .85)), path(`M${cx - 2.8} ${cy}L${cx - 2.6} ${cy - 9}H${cx + 2.6}L${cx + 2.8} ${cy}Z`, '#fffdf8', .9), ell(cx, cy - 9, 3.4, 1.2, '#fff', .9));
  outT(t, 'fences', 'fence-salt-rope', v, ['autotile', 'connect4', 'mask:' + m, 'fence', 'rope', 'obstacle']);
}
