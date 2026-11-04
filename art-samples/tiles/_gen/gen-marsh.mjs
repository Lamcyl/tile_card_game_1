// Firefly Marsh (greenvale/firefly-marsh): dusk ground, peat/mud/bog, marsh water, pool/peat/reed/dusk-blend autotiles, boardwalks, decals. Objects: gen-marsh-objects.mjs.
import { T, P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, FAM, skeleton, inShape, blobSet, maker, bloom, scat, C4, SUBS, sparkle, mush, fronds } from './sub.mjs';
import { interior, crowns } from './ground.mjs';
import { wrapped } from './lib.mjs';
import { ring, pebbleSmall } from './water-lib.mjs';
import { MOSS, mossBlob } from './ruins-lib.mjs';
import { connect, armX, sym, use } from './rice-lib.mjs';
import { DUSK, DAWN, PEAT, MUD, BOG, MWAT, MDEEP, duskBase, marshFill, duckDots, duckPatch, pad, cattailS, reedS, blade, hx, mixc } from './marsh-lib.mjs';

const SUB = SUBS.marsh, { mk, out } = maker(SUB);
const rr = (s) => rng(hash(s));
const GR = FAM.grass;

// ======================= ground =======================
const gnd = (cat, name, v, base, fn, tags = []) => { const t = mk(cat, name, v); t.add(base, fn(rr(name + v), t)); out(t, cat, name, v, ['seamless', 'ground', ...tags]); };
const sedge = (x, y, n = 7, h = 9, cols = ['#8ab45c', '#5f9a48', '#b4c878']) => { let o = ell(x + 1, y + 1.2, 5, 1.6, '#3b3a24', .15); for (let i = 0; i < n; i++) { const a = (i - (n - 1) / 2) * 7; o += blade(x + a * .12, y, h * (.7 + (i % 3) * .15), a * .3, 1.8, cols[i % cols.length], '#3f6a3a'); } return o; };
const splash = (x, y, w, h) => ell(x, y, w, h, '#7a8a96', .35, 0) + ell(x, y + .4, w - 1.2, h - .8, '#a9c0cc', .9) + ell(x - w * .25, y - h * .3, w * .45, h * .2, '#f3ecf4', .7);
const rosew = ['#d6a8b4', '#c9a8c6', '#e0b4bc'], indw = ['#8a9cc6', '#9aa8cc', '#7a8cb8'];
const dusk = (n) => (r) => interior(DUSK, 9100 + n, { n: 3, tufts: 3 });
// dusk grass: plain, little flowers, rose wash, indigo wash, toadstools
gnd('ground', 'dusk-grass', 'a', duskBase(), (r) => interior(DUSK, 9101, { n: 4, tufts: 3 }), ['dusk', 'grass']);
gnd('ground', 'dusk-grass', 'b', duskBase(), (r) => interior(DUSK, 9102, { n: 3, tufts: 4 }) + scat(r, 4, 12, 12).map(([x, y], i) => bloom(['lavender', 'bluebell', 'clover', 'lavender'][i], x, y, .8, i === 3 ? '#b49ad8' : null)).join(''), ['dusk', 'grass', 'flowers']);
gnd('ground', 'dusk-grass', 'c', duskBase(DUSK, 1.6), (r) => interior(DUSK, 9103, { n: 4, cols: rosew, tufts: 2 }), ['dusk', 'grass', 'rose']);
gnd('ground', 'dusk-grass', 'd', duskBase(DUSK, 1.6), (r) => interior(DUSK, 9104, { n: 4, cols: indw, tufts: 2 }), ['dusk', 'grass', 'indigo']);
gnd('ground', 'dusk-grass', 'e', duskBase(), (r, t) => interior(DUSK, 9105, { n: 3, tufts: 2 }) + mush(t, 24, 40, .5, ['#f0c4d0', '#c88aa0'], { spots: false }) + mush(t, 40, 34, .4, ['#d8d0f0', '#8a80b8'], { spots: false }), ['dusk', 'grass', 'mushroom']);
// dawn ramp: half-way between day grass and dusk grass (same wash geometry, so it tiles with both)
for (const [v, s, n] of [['a', 9111, 4], ['b', 9112, 3]]) gnd('ground', 'dusk-ramp', v, skeleton(DAWN), (r) => interior(DAWN, s, { n, tufts: 3 }), ['dusk', 'blend', 'ramp', 'grass']);
// peat, mud, bog
gnd('ground', 'peat', 'a', skeleton(PEAT), (r) => interior(PEAT, 9201, { n: 4, tufts: 0 }) + scat(r, 3, 12, 14).map(([x, y]) => tuft(x, y, '#6e7a3e', .7, .6)).join(''), ['peat', 'wetland']);
gnd('ground', 'peat', 'b', skeleton(PEAT), (r) => interior(PEAT, 9202, { n: 3, tufts: 0 }) + sedge(24, 40, 7, 9) + sedge(42, 24, 6, 8), ['peat', 'wetland', 'sedge']);
gnd('ground', 'peat', 'c', skeleton(PEAT), (r) => interior(PEAT, 9203, { n: 3, tufts: 0 }) + splash(26, 28, 9, 3.4) + splash(42, 44, 7, 2.6), ['peat', 'wetland', 'puddle']);
gnd('ground', 'peat', 'd', skeleton(PEAT), (r) => interior(PEAT, 9204, { n: 3, tufts: 0 }) + scat(r, 4, 12, 12).map(([x, y]) => line(`M${f(x - 5)} ${f(y)}l${f(r.range(3, 5))} ${f(r.range(-2, 2))}l${f(r.range(3, 5))} ${f(r.range(-2, 2))}`, '#6a5a3a', 1.3, .75)).join(''), ['peat', 'wetland', 'twigs']);
gnd('ground', 'mud', 'a', skeleton(MUD), (r) => interior(MUD, 9211, { n: 4, tufts: 0 }) + ell(30, 30, 10, 2.4, '#e6dcd0', .35, -10), ['mud', 'wetland']);
gnd('ground', 'mud', 'b', skeleton(MUD), (r) => { let o = interior(MUD, 9212, { n: 3, tufts: 0 }); for (const [x, y, k] of [[22, 40, 0], [30, 34, 1], [38, 28, 0], [46, 22, 1]]) o += `<g transform="translate(${x} ${y}) rotate(-30)">` + ell(0, 0, 2.2, 1.2, '#6e5e46', .5) + ell(-1.6, k ? 2 : -2, .8, .5, '#6e5e46', .45) + ell(1.8, k ? 2 : -2, .8, .5, '#6e5e46', .45) + '</g>'; return o; }, ['mud', 'wetland', 'tracks']);
gnd('ground', 'mud', 'c', skeleton(MUD), (r) => interior(MUD, 9213, { n: 3, tufts: 0 }) + splash(24, 26, 10, 3.6) + splash(44, 42, 8, 3) + splash(26, 46, 5, 2), ['mud', 'wetland', 'puddle']);
gnd('ground', 'mud', 'd', skeleton(MUD), (r) => interior(MUD, 9214, { n: 3, tufts: 0 }) + scat(r, 6, 11, 10).map(([x, y]) => reedS(x, y + 2, r.range(5, 8), r.range(-2, 2), '#b4a878', 1.4)).join(''), ['mud', 'wetland', 'stubble']);
const sundew = (r, n) => scat(r, n, 12, 8).map(([x, y]) => ell(x, y, 2.2, 1.4, '#c8453a', 1, 0, ink('#6e1a14', .4, .6)) + circ(x - 1.6, y - .8, .5, '#ffb0a0') + circ(x + 1.4, y - 1, .5, '#ffb0a0')).join('');
gnd('ground', 'bog-moss', 'a', skeleton(BOG), (r) => interior(BOG, 9221, { n: 4, tufts: 2 }) + sundew(r, 3), ['bog', 'moss', 'wetland']);
gnd('ground', 'bog-moss', 'b', skeleton(BOG), (r) => interior(BOG, 9222, { n: 4, cols: ['#8e9c68', '#c6cc9a'], tufts: 1 }) + scat(r, 6, 11, 9).map(([x, y]) => ell(x, y, 3.4, 1.5, '#d8dcaa', .7, r.range(0, 180))).join(''), ['bog', 'moss', 'wetland']);
gnd('ground', 'bog-moss', 'c', skeleton(BOG), (r) => interior(BOG, 9223, { n: 3, tufts: 2 }) + splash(30, 34, 8, 3) + sundew(r, 2), ['bog', 'moss', 'wetland', 'puddle']);
// marsh water: murky, duckweed, lily, sky reflection, glow, deep
const mw = (v, fn, F = MWAT, tags = []) => gnd('ground', 'marsh-water', v, marshFill(F), fn, ['water', 'marsh', ...tags]);
mw('a', (r) => ring(24, 28, 8, '#eadcea', .5) + ring(44, 42, 6, '#eadcea', .45));
mw('b', (r) => { let o = ''; for (const [x, y, rx] of [[26, 28, 12], [42, 40, 9]]) o += duckPatch(r, x, y, rx, rx * .5, 26); return o; }, MWAT, ['duckweed']);
mw('c', (r) => pad(24, 26, 7, 'pink') + pad(42, 40, 6) + pad(40, 22, 5, 'bud') + pad(20, 44, 5), MWAT, ['lily']);
mw('d', (r) => ell(32, 30, 22, 4, '#f0b8c4', .35, -8) + ell(30, 40, 16, 2.6, '#f6d0d8', .3, -8) + ell(34, 22, 12, 2, '#fbe4e0', .3, -8), MWAT, ['sky-reflection', 'dusk']);
mw('e', (r) => { let o = ''; for (const [x, y] of [[22, 24], [44, 34], [30, 46]]) o += circ(x, y, 5, '#e8f6a8', .18) + circ(x, y, 1.4, '#f6fcc8', .75); return o + ell(34, 28, 6, 1.4, '#e8f6a8', .3); }, MWAT, ['glow', 'firefly-reflection']);
mw('f', (r) => ring(30, 30, 9, '#c8d8ea', .5) + ring(30, 30, 4, '#c8d8ea', .4), MDEEP, ['deep']);
// baked detail ground
const gd = (name, v, base, fn, tags = []) => gnd('ground-detail', name, v, base, fn, tags);
const marig = (x, y, s = 1) => bloom('buttercup', x, y, s, '#f6c82a');
const loose = (x, y, s = 1) => { let o = line(`M${f(x)} ${f(y + 3)}q.6-5 0-${f(10 * s)}`, '#6f9a58', 1, .8); for (let i = 0; i < 7; i++) o += circ(x + (i % 2 ? 1 : -1) * s, y - i * 1.4 * s + 1, 1.2 * s, i % 3 ? '#b050b4' : '#d890d8'); return o; };
gd('marigold', 'a', skeleton(PEAT), (r) => interior(PEAT, 9301, { n: 3, tufts: 0 }) + scat(r, 5, 12, 11).map(([x, y]) => marig(x, y, .9) + ell(x - 3, y + 3, 2, 1.1, '#5f9a50', 1, -20)).join(''), ['peat', 'flowers']);
gd('marigold', 'b', skeleton(BOG), (r) => interior(BOG, 9302, { n: 3, tufts: 1 }) + scat(r, 4, 12, 13).map(([x, y]) => marig(x, y, 1.1)).join(''), ['bog', 'flowers']);
gd('loosestrife', 'a', skeleton(DUSK), (r) => interior(DUSK, 9303, { n: 3, tufts: 1 }) + scat(r, 5, 12, 11).map(([x, y]) => loose(x, y, .9)).join(''), ['dusk', 'flowers']);
gd('loosestrife', 'b', skeleton(PEAT), (r) => interior(PEAT, 9304, { n: 3, tufts: 0 }) + scat(r, 4, 12, 13).map(([x, y]) => loose(x, y, 1.1)).join(''), ['peat', 'flowers']);
gd('sedge-tussock', 'a', skeleton(PEAT), (r) => interior(PEAT, 9305, { n: 3, tufts: 0 }) + sedge(22, 34, 8, 11) + sedge(42, 44, 7, 9) + sedge(44, 20, 6, 8), ['peat', 'sedge']);
gd('sedge-tussock', 'b', skeleton(DUSK), (r) => interior(DUSK, 9306, { n: 3, tufts: 1 }) + sedge(30, 32, 9, 12) + sedge(46, 46, 6, 8), ['dusk', 'sedge']);
gd('mud-puddles', 'a', skeleton(MUD), (r) => interior(MUD, 9307, { n: 3, tufts: 0 }) + splash(24, 24, 8, 3) + splash(42, 36, 11, 4) + splash(26, 46, 6, 2.4), ['mud', 'puddle']);
gd('mud-puddles', 'b', skeleton(PEAT), (r) => interior(PEAT, 9308, { n: 3, tufts: 0 }) + splash(32, 32, 14, 5) + splash(46, 18, 5, 2), ['peat', 'puddle']);
gd('bog-cotton', 'a', skeleton(BOG), (r) => interior(BOG, 9309, { n: 3, tufts: 1 }) + scat(r, 6, 12, 9).map(([x, y]) => line(`M${f(x)} ${f(y + 3)}v-5`, '#7a9a54', 1, .8) + circ(x, y - 3, 2.1, '#fffaf0', 1, ink('#cfc8b0', .4, .5)) + circ(x - .6, y - 3.6, 1, '#fff')).join(''), ['bog', 'flowers']);
gd('reed-stubble', 'a', skeleton(MUD), (r) => interior(MUD, 9310, { n: 3, tufts: 0 }) + scat(r, 8, 11, 8).map(([x, y]) => reedS(x, y + 2, r.range(6, 10), r.range(-3, 3), '#a89c68', 1.4)).join(''), ['mud', 'reeds']);
gd('reed-stubble', 'b', skeleton(DUSK), (r) => interior(DUSK, 9311, { n: 3, tufts: 1 }) + scat(r, 6, 11, 9).map(([x, y]) => reedS(x, y + 2, r.range(7, 11), r.range(-3, 3), '#9ab464', 1.3)).join(''), ['dusk', 'reeds']);
gd('duckweed-mat', 'a', marshFill(), (r) => duckPatch(r, 24, 24, 14, 8, 36) + duckPatch(r, 42, 42, 12, 8, 30), ['water', 'duckweed']);
gd('duckweed-mat', 'b', marshFill(), (r) => duckPatch(r, 32, 30, 22, 14, 70) + ring(32, 46, 5, '#eadcea', .5), ['water', 'duckweed']);
gd('lily-dusk', 'a', marshFill(), (r) => pad(22, 24, 7, 'pink') + pad(42, 28, 6, 'white') + pad(30, 44, 6) + pad(46, 46, 4.4, 'bud'), ['water', 'lily']);
gd('lily-dusk', 'b', marshFill(), (r) => pad(32, 30, 9) + pad(18, 20, 5) + pad(46, 20, 5, 'pink') + pad(44, 46, 6) + pad(18, 46, 4.6, 'bud'), ['water', 'lily']);
gd('wisp-water', 'a', marshFill(), (r) => ell(32, 32, 14, 6, '#bff5d8', .2) + ell(32, 32, 7, 3, '#e8fff4', .5) + circ(32, 31, 1.6, '#fff', .9) + ring(32, 33, 10, '#bff5d8', .45), ['water', 'wisp', 'glow']);

// ======================= decals =======================
const decal = (name, v, fn, tags = []) => { const t = mk('decals', name, v); fn(t, rr(name + v)); out(t, 'decals', name, v, ['overlay', 'decal', 'transparent', 'marsh', ...tags]); };
for (const v of ['a', 'b', 'c']) decal('duckweed-clump', v, (t, r) => { for (let i = 0; i < 2 + (v === 'c' ? 1 : 0); i++) t.add(duckPatch(r, r.range(18, 46), r.range(20, 44), r.range(8, 14), r.range(5, 8), 26)); }, ['water', 'duckweed']);
for (const v of ['a', 'b']) decal('mud-splat', v, (t, r) => { for (let i = 0; i < 3; i++) t.add(ell(r.range(18, 46), r.range(20, 44), r.range(7, 13), r.range(4, 7), '#8a7a5e', .45, r.range(0, 180)), ell(r.range(18, 46), r.range(20, 44), r.range(3, 7), r.range(2, 4), '#6e5e46', .35, r.range(0, 180))); });
for (const v of ['a', 'b', 'c']) decal('ripple-rings', v, (t, r) => { for (let i = 0; i < 2 + (v !== 'a' ? 1 : 0); i++) { const x = r.range(18, 46), y = r.range(20, 44); t.add(ring(x, y, 11, '#f0e6f2', .7), ring(x, y, 6, '#f0e6f2', .65), ring(x, y, 2.6, '#f0e6f2', .7)); } }, ['water']);
for (const v of ['a', 'b', 'c']) decal('lily-leaf', v, (t, r) => t.add(pad(r.range(22, 42), r.range(26, 40), r.range(6, 9), v === 'a' ? 'pink' : v === 'b' ? null : 'white'), pad(r.range(14, 50), r.range(14, 50), 4.4, v === 'c' ? 'bud' : null)), ['water', 'lily']);
for (const v of ['a', 'b']) decal('bubbles', v, (t, r) => { for (let i = 0; i < 7; i++) { const x = r.range(14, 50), y = r.range(14, 50), s = r.range(.8, 2.2); t.add(circ(x, y, s, '#e8f4f6', .25, ink('#f6fbfc', .6, .8)), circ(x - s * .3, y - s * .3, s * .3, '#fff', .9)); } }, ['water']);
for (const v of ['a', 'b']) decal('bog-mushrooms', v, (t, r) => { for (const [x, y] of scat(r, v === 'a' ? 3 : 4, 14, 12)) t.add(mush(t, x, y + 4, r.range(.4, .6), r.pick([['#f0c4d0', '#c88aa0'], ['#d8d0f0', '#8a80b8'], ['#f3dca0', '#c8a050']]), { spots: false })); });
for (const v of ['a', 'b']) decal('fallen-reeds', v, (t, r) => { for (let i = 0; i < 5; i++) { const x = r.range(12, 40), y = r.range(16, 50); t.add(line(`M${f(x)} ${f(y)}q${f(r.range(6, 12))} ${f(r.range(-3, 3))} ${f(r.range(16, 24))} ${f(r.range(-4, 4))}`, i % 2 ? '#a8a068' : '#8ab45c', 1.4, .9)); } });
for (const v of ['a', 'b', 'c']) decal('heron-tracks', v, (t, r) => { for (let i = 0; i < 4; i++) { const x = 14 + i * 11, y = 32 + (i % 2 ? 6 : -4) + (v === 'c' ? i * 2 : 0); t.add(line(`M${x} ${y}l-3 -4M${x} ${y}l0 -5M${x} ${y}l3 -4`, '#6e5e46', 1.1, .6)); } });
for (const v of ['a', 'b', 'c', 'd']) decal('dusk-fringe', v, (t, r) => { for (let i = 0; i < 4; i++) { const x = r.range(14, 50), y = r.range(14, 50), rx = r.range(10, 20); t.add(ell(x, y, rx, rx * r.range(.5, .8), i % 2 ? '#a8a2c6' : '#d6a8b4', .2, r.range(0, 180)), ell(x, y, rx * .6, rx * .35, '#b9c49c', .2, r.range(0, 180))); } }, ['dusk', 'blend']);
for (const v of ['a', 'b']) decal('dead-leaves', v, (t, r) => { for (const [x, y] of scat(r, 7, 10, 8)) t.add(`<g transform="rotate(${f(r.range(0, 360))} ${f(x)} ${f(y)})"><path d="M${f(x - 3.4)} ${f(y)}Q${f(x)} ${f(y - 3.4)} ${f(x + 3.4)} ${f(y)}Q${f(x)} ${f(y + 3.4)} ${f(x - 3.4)} ${f(y)}Z" fill="${r.pick(['#a8884a', '#8a6a3c', '#c8a058'])}" stroke="#4a3220" stroke-width=".5" stroke-opacity=".5"/></g>`); });
for (const v of ['a', 'b']) decal('frog-spawn', v, (t, r) => { for (let i = 0; i < 2; i++) { const x = r.range(20, 44), y = r.range(24, 42); t.add(ell(x, y, 9, 4, '#cfe0d8', .35, r.range(-20, 20))); for (let k = 0; k < 14; k++) t.add(circ(x + r.range(-8, 8), y + r.range(-3, 3), 1.1, '#e8f4ee', .8, ink('#4a6a5a', .4, .6)), circ(x + r.range(-8, 8), y + r.range(-3, 3), .45, '#2a3a30', .9)); } }, ['water']);

export { duskBase };
await import('./gen-marsh-edges.mjs');
await import('./gen-marsh-objects.mjs');
await import('./gen-marsh-props.mjs');
await import('./gen-marsh-interest.mjs');
