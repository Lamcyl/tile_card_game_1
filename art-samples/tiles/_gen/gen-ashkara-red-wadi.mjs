// Ashkara sub-area 5: Red Wadi (ashkara/red-wadi). Ground, ground-detail, three 47-blob autotile sets, two connect-4 sets.
// Objects: gen-ashkara-red-wadi-objects.mjs; interest/landmark/gate: ...-interest.mjs; decals + overlays: ...-decals.mjs. Every file runs on its own (helpers live in red-wadi-lib.mjs).
// Palette shift: deep terracotta and ochre with blue shade; red sandstone shelves, dry river gravel (reg), cracked clay, a still pool.
import { T, rng, f, ell, circ, rect, path, line, ink, wrapped, FAMS, dskel, dint, speckle, ripples, crackNet, sh, pebbleD, tuft, mix, TERRA, OCHRE, RSAND, WGRV, CLAYR, SHADE, SILT, WPOOL, SALT, BAZ, GOLD, ramp, streaks, strata, terraBase, stratBase, ochreBase, rsandBase, wgrvBase, clayBase, shadeBase, siltBase, poolBase, C, tile, mkT, outT, blobSet, pts, wscat, stroke, sides, arms, TER, DEEP, OCH, BLU, WOODS, ROPE, BONE, rrock, rblock, mound, bone, jar } from './red-wadi-lib.mjs';

const ground = (cat, name, v, base, fn, tags = []) => tile(cat, name, v, C, ['seamless', cat === 'ground' ? 'ground' : 'ground-detail', ...tags], (t, r) => base() + fn(r, t));
const wg = (seed) => dint(WGRV, seed, { n: 3 });
const sp = (r, n, s = [.5, .9], c = '#fbe0c4') => pts(r, n, 10, 11).map(([x, y]) => circ(x, y, r.range(...s), c, .8)).join('');
// ---------------- ground ----------------
const te = (seed, o = {}) => dint(TERRA, seed, { n: 3, ...o });
ground('ground', 'terra-shelf', 'a', terraBase, () => te(12001));
ground('ground', 'terra-shelf', 'b', terraBase, () => te(12002, { cols: ['#efcdb0', '#c78e6c'] }) + streaks(12002, 2, '#a06a4c', .22, 12, 20));
ground('ground', 'terra-shelf', 'c', terraBase, (r) => te(12003) + sp(r, 5, [.5, 1]), ['glint']);
ground('ground', 'terra-shelf', 'd', terraBase, (r) => te(12004) + pts(r, 4, 10, 14).map(([x, y]) => pebbleD(x, y, r.range(.3, .5), ['#f4d8c0', '#a8664c'])).join(''), ['pebbles']);
ground('ground', 'terra-strata', 'a', () => stratBase(521), () => te(12011, { n: 2 }), ['strata']);
ground('ground', 'terra-strata', 'b', () => stratBase(523), () => te(12012, { n: 2 }) + streaks(12012, 2, '#fbe0c4', .3, 14, 22), ['strata']);
ground('ground', 'terra-strata', 'c', () => stratBase(527), (r) => te(12013, { n: 2 }) + sp(r, 4), ['strata']);
const oc = (seed) => dint(OCHRE, seed, { n: 3 });
ground('ground', 'ochre-sand', 'a', ochreBase, () => oc(12021));
ground('ground', 'ochre-sand', 'b', ochreBase, () => oc(12022) + streaks(12022, 2, '#b08040', .25, 12, 18));
ground('ground', 'ochre-sand', 'c', ochreBase, (r) => oc(12023) + sp(r, 5, [.5, .9], '#fbe6b8'), ['glint']);
const rs = (seed) => dint(RSAND, seed, { n: 3 });
ground('ground', 'red-sand', 'a', rsandBase, () => rs(12031));
ground('ground', 'red-sand', 'b', rsandBase, () => rs(12032) + ripples(12032, 3, '#b07c58', .3, 12, 18));
ground('ground', 'red-sand', 'c', rsandBase, (r) => rs(12033) + sp(r, 5, [.5, .9]), ['glint']);
ground('ground', 'wadi-gravel', 'a', wgrvBase, () => wg(12041));
ground('ground', 'wadi-gravel', 'b', wgrvBase, () => wg(12042) + streaks(12042, 2, '#6e5240', .2, 12, 18));
ground('ground', 'wadi-gravel', 'c', wgrvBase, (r) => wg(12043) + pts(r, 6, 10, 10).map(([x, y]) => pebbleD(x, y, r.range(.3, .5), ['#e8d4bc', '#8a6a50'])).join(''), ['pebbles']);
ground('ground', 'wadi-gravel', 'd', wgrvBase, (r) => wg(12044) + pts(r, 4, 11, 13).map(([x, y]) => pebbleD(x, y, r.range(.45, .7), ['#d8b898', '#7a5c44'])).join(''), ['pebbles']);
ground('ground', 'wadi-cobble', 'a', wgrvBase, (r) => wg(12051) + pts(r, 7, 9, 12).map(([x, y]) => pebbleD(x, y, r.range(.7, 1), ['#e0c4a4', '#a8664c'])).join(''), ['cobbles']);
ground('ground', 'wadi-cobble', 'b', wgrvBase, (r) => wg(12052) + pts(r, 8, 9, 11).map(([x, y]) => pebbleD(x, y, r.range(.6, .95), ['#d8b8a8', '#8c5a48'])).join(''), ['cobbles']);
const cl = (seed) => dint(CLAYR, seed, { n: 3 });
ground('ground', 'clay-cracked', 'a', () => clayBase(561), () => cl(12061), ['cracks']);
ground('ground', 'clay-cracked', 'b', () => clayBase(563), () => cl(12062) + streaks(12062, 2, '#e2b79a', .3, 12, 18), ['cracks']);
ground('ground', 'clay-cracked', 'c', () => clayBase(565), (r) => cl(12063, { n: 2 }) + sp(r, 4), ['cracks']);
ground('ground', 'shade-floor', 'a', shadeBase, () => dint(SHADE, 12071, { n: 3 }), ['shade']);
ground('ground', 'shade-floor', 'b', shadeBase, (r) => dint(SHADE, 12072, { n: 3 }) + streaks(12072, 2, '#7c6678', .22, 12, 18), ['shade']);
ground('ground', 'flood-silt', 'a', siltBase, () => dint(SILT, 12081, { n: 3 }), ['silt']);
ground('ground', 'flood-silt', 'b', siltBase, (r) => dint(SILT, 12082, { n: 3 }) + ripples(12082, 3, '#9a7a62', .35, 12, 18), ['silt']);
ground('ground', 'wadi-pool', 'a', poolBase, () => dint(WPOOL, 12091, { n: 3 }), ['water', 'pool']);
ground('ground', 'wadi-pool', 'b', poolBase, (r) => dint(WPOOL, 12092, { n: 3 }) + sp(r, 4, [.6, 1], '#f2fffa'), ['water', 'pool', 'sparkle']);
// ramps: terracotta into the common ground, the Salt Mirror crust (south), the Dust Bazaar earth (west), the Sun Citadel gold (north-east); and between the families
const rampSets = [
  ['terra-sand-fringe', TERRA, FAMS.sand, 12100], ['terra-dune-fringe', TERRA, FAMS.dune, 12110], ['terra-pan-fringe', TERRA, FAMS.pan, 12120], ['terra-reg-fringe', TERRA, FAMS.reg, 12130],
  ['terra-salt-fringe', TERRA, SALT, 12140], ['terra-bazaar-fringe', TERRA, BAZ, 12150], ['terra-gold-fringe', TERRA, GOLD, 12160],
  ['ochre-terra-fringe', OCHRE, TERRA, 12170], ['gravel-terra-fringe', WGRV, TERRA, 12180], ['gravel-sand-fringe', WGRV, FAMS.sand, 12190],
];
for (const [name, from, to, seed] of rampSets) for (const [v, u] of [['a', .35], ['b', .7]]) ground('ground', name, v, () => dskel(ramp(from, to, u)), (r) => dint(ramp(from, to, u), seed + u * 10, { n: 3 }) + pts(r, 2, 12, 16).map(([x, y]) => circ(x, y, .7, '#fbe0c4', .6)).join(''), ['ramp', 'blend']);
for (const [name, from, to, seed] of [['gravel-reg-fringe', WGRV, FAMS.reg, 12200], ['red-sand-terra-fringe', RSAND, TERRA, 12210], ['clay-terra-fringe', CLAYR, TERRA, 12220], ['silt-gravel-fringe', SILT, WGRV, 12230], ['pool-gravel-fringe', WPOOL, WGRV, 12240], ['shade-terra-fringe', SHADE, TERRA, 12250], ['salt-terra-fringe', SALT, TERRA, 12260]])
  ground('ground', name, 'a', () => dskel(ramp(from, to, .5)), () => dint(ramp(from, to, .5), seed, { n: 3 }), ['ramp', 'blend']);

// ---------------- ground-detail ----------------
const flood = (x, y, a, l) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">` + line(`M${-l / 2} 0H${l / 2}`, '#3b2a24', 2.2, .2, { transform: 'translate(1 1.4)' }) + line(`M${-l / 2} 0H${l / 2}`, '#8a6238', 2, 1) + line(`M${-l / 2} -.5H${l / 2}`, '#c9a070', .7, .8) + `</g>`;
const sherd = (x, y, a, s) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">` + ell(.8, 1.2, 4 * s, 1.8 * s, '#3b2a24', .15) + path(`M${-4 * s} 0L${-1 * s} ${-2.4 * s}L${4 * s} ${-1 * s}L${2 * s} ${2 * s}Z`, '#c47e56', 1, ink('#5a2a20', .6, .85)) + line(`M${-2 * s} 0H${2 * s}`, '#f3c24f', .7, .8) + `</g>`;
ground('ground-detail', 'strata-lines', 'a', stratBase, () => strata(12301, ['#8c4e36', '#fbe0c4'], 3, .22) + te(12301, { n: 2 }), ['strata']);
ground('ground-detail', 'quartz-veins', 'a', terraBase, (r) => te(12311, { n: 2 }) + [[8, 20, 58, 36], [4, 48, 60, 40]].map(([x0, y0, x1, y1]) => line(`M${x0} ${y0}Q${(x0 + x1) / 2} ${y0 + 8} ${x1} ${y1}`, '#fff', 1.6, .85) + line(`M${x0} ${y0 + 1}Q${(x0 + x1) / 2} ${y0 + 9} ${x1} ${y1 + 1}`, '#c47e56', .8, .5)).join(''), ['quartz']);
ground('ground-detail', 'iron-nodules', 'a', terraBase, (r) => pts(r, 7, 10, 10).map(([x, y]) => { const s = r.range(.7, 1.2); return ell(x + .8, y + 1.4, 3.6 * s, 1.4 * s, '#3b2a24', .16) + circ(x, y, 2.4 * s, '#5a3028', 1, ink('#2a1410', .6, .8)) + circ(x - .8, y - .8, .8 * s, '#a8664c', .9); }).join(''), ['nodules', 'loot']);
ground('ground-detail', 'red-pebbles', 'a', wgrvBase, (r) => wg(12321) + pts(r, 8, 9, 9).map(([x, y]) => pebbleD(x, y, r.range(.35, .6), ['#e8b48a', '#a8664c'])).join(''), ['pebbles']);
ground('ground-detail', 'potsherds', 'a', siltBase, (r) => pts(r, 5, 10, 12).map(([x, y]) => sherd(x, y, r.range(0, 180), r.range(.8, 1.2))).join(''), ['pottery', 'loot']);
ground('ground-detail', 'flood-sticks', 'a', siltBase, (r) => pts(r, 5, 11, 12).map(([x, y]) => flood(x, y, r.range(-60, 60), r.range(10, 18))).join(''), ['debris', 'flood']);
ground('ground-detail', 'flood-sticks', 'b', wgrvBase, (r) => wg(12332) + pts(r, 4, 11, 14).map(([x, y]) => flood(x, y, r.range(-70, 70), r.range(12, 20))).join(''), ['debris', 'flood']);
ground('ground-detail', 'ammonite', 'a', stratBase, (r) => [[22, 28, 8], [44, 44, 6]].map(([x, y, rr]) => ell(x + 1, y + 1.4, rr, rr * .9, '#3b2a24', .14) + circ(x, y, rr, '#f0c8a4', 1, ink('#8c4e36', .8, .9)) + [.7, .45, .2].map(k => circ(x, y, rr * k, 'none', 1, ink('#a8664c', .9, .8))).join('')).join(''), ['fossil', 'loot']);
ground('ground-detail', 'goat-prints', 'a', clayBase, (r) => { let o = ''; for (let i = 0; i < 6; i++) { const x = 8 + i * 9.5, y = 34 - i * 2 + (i % 2) * 6; o += path(`M${x - 2} ${y}q-1 -3.4 1 -4.4q2 -.4 2 2.4M${x + 1.6} ${y + .4}q-1 -3.4 1 -4.4q2 -.4 2 2.4`, 'none', 1, { stroke: '#6e3a28', 'stroke-width': 1.2, 'stroke-opacity': .65, 'stroke-linecap': 'round' }); } return o; }, ['tracks']);
ground('ground-detail', 'camel-prints', 'a', siltBase, () => { let o = ''; for (let i = 0; i < 6; i++) { const x = 6 + i * 10, y = 30 + (i % 2) * 8 - i * 1.2; o += ell(x, y, 3, 2.2, '#9a7a62', .6) + ell(x, y, 1.2, 1, '#e4c8b2', .6); } return o; }, ['tracks']);
ground('ground-detail', 'rain-pits', 'a', clayBase, (r) => pts(r, 9, 8, 10).map(([x, y]) => circ(x, y, r.range(.8, 1.4), '#8e5a3e', .5) + circ(x - .4, y - .4, .5, '#e8c0a4', .7)).join(''), ['pits']);
ground('ground-detail', 'ripple-marks', 'a', siltBase, () => ripples(12361, 8, '#9a7a62', .5, 12, 22), ['ripples']);
ground('ground-detail', 'dry-tufts', 'a', terraBase, (r) => te(12371, { n: 2 }) + pts(r, 5, 11, 12).map(([x, y]) => tuft(x, y + 3, '#a89058', .9, .8)).join(''), ['plants']);
ground('ground-detail', 'lichen-patch', 'a', stratBase, (r) => pts(r, 4, 11, 14).map(([x, y]) => ell(x, y, r.range(4, 7), r.range(2.4, 3.6), '#c8d68a', .6, r.range(-30, 30), ink('#8aa05c', .6, .5)) + circ(x - 1, y - .6, .8, '#f4f0b0', .9)).join(''), ['lichen']);
ground('ground-detail', 'hematite-flecks', 'a', terraBase, (r) => sp(r, 6, [.6, 1.1], '#6a2a22') + sp(r, 6, [.5, .9], '#fbe0c4'), ['flecks']);
ground('ground-detail', 'bone-flecks', 'a', wgrvBase, (r) => pts(r, 4, 11, 13).map(([x, y]) => bone(x, y, r.range(6, 10), r.range(0, 180))).join(''), ['bones']);

// ---------------- autotiles (47-blob) ----------------
// 1. red-cliff: a raised terracotta shelf; the unlit sides drop as layered red strata in blue shade
blobSet('red-cliff', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 22, tags: ['cliff', 'raised', 'obstacle'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(terraBase(), `<path d="${G.d}" transform="translate(5 7)" fill="#4a3a58" opacity=".32"/>`, `<path d="${G.d}" transform="translate(3 4)" fill="#6a4a60" opacity=".26"/>`);
    t.add(`<g clip-path="${clip}">`, stratBase(525), sides(G, ['#8c4e36', .62], ['#fbe0c4', .6], 15, 6), sides(G, ['#5e2c20', .3], ['#fff', .3], 8, 3), '</g>');
    // strata lines on the cliff faces
    t.add(`<g clip-path="${clip}">`, [0, 1, 2].map(i => !G.h(16) ? line(`M${G.x0} ${G.y1 - 3 - i * 4.4}H${G.x1}`, '#5e2c20', 1, .38) : '').join(''), [0, 1, 2].map(i => !G.h(4) ? line(`M${G.x1 - 3 - i * 4.4} ${G.y0}V${G.y1}`, '#5e2c20', 1, .38) : '').join(''), '</g>');
    t.add(path(G.d, 'none', 1, { stroke: '#5a2a20', 'stroke-width': 1.3, 'stroke-opacity': .7, 'stroke-linejoin': 'round' }));
  },
});
// 2. wadi-bed: a sunk dry river bed of gravel between dark red banks
blobSet('wadi-bed', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['wadi', 'gravel', 'bed'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(terraBase(), stroke(G.d, '#8c4e36', 14, .22), stroke(G.d, '#a8664c', 8, .3), stroke(G.d, '#efcdb0', 4, .6, -.4, -.4));
    t.add(`<g clip-path="${clip}">`, wgrvBase(), sides(G, ['#5e2c20', .34], ['#f0d8c0', .4], 10, 5), stroke(G.d, '#8a6a50', 9, .22), '</g>');
    t.add(stroke(G.d, '#6e3a28', 1.1, .6));
  },
});
// 3. wadi-pool: a still green-grey pool in a red clay lip
blobSet('wadi-pool', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['water', 'pool', 'shore'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(clayBase(567), stroke(G.d, '#6e3a28', 15, .2), stroke(G.d, '#e8c0a4', 9, .5), stroke(G.d, '#f6dcc8', 5, .8, -.5, -.5));
    t.add(`<g clip-path="${clip}">`, poolBase(), sides(G, ['#2f5a58', .34], ['#e6f6f0', .45], 9, 5), stroke(G.d, '#4a7470', 10, .2), '</g>');
    t.add(stroke(G.d, '#3a5e5a', 1.1, .6));
  },
});

// ---------------- connect-4 (N1 E2 S4 W8) ----------------
// 1. wall-red-stone: a low dry-stone wall of red sandstone blocks
for (let m = 0; m < 16; m++) {
  const v = String(m).padStart(2, '0'), t = mkT('fences', 'wall-red-stone', v), cx = 32, cy = 40;
  t.add(ell(cx + 2, cy + 5, 11, 3.4, BLU[2], .3));
  for (const [a, b, c, d] of arms(m, cx, cy)) {
    if (b === d) { const x0 = Math.min(a, c), x1 = Math.max(a, c); for (let x = x0; x < x1; x += 10) t.add(rblock(t, x, cy - 6, Math.min(10, x1 - x), 11, 4)); }
    else { const y0 = Math.min(b, d), y1 = Math.max(b, d); for (let y = y0; y < y1; y += 9) t.add(ell(cx + 1, y + 6, 8, 2.6, '#3b2a24', .1), rblock(t, cx - 6, y + 1, 12, 5, 3)); }
  }
  t.add(rblock(t, cx - 7, cy - 10, 14, 15, 5), line(`M${cx - 4} ${cy - 3}h8`, '#8c4e36', .8, .6));
  outT(t, 'fences', 'wall-red-stone', v, ['autotile', 'connect4', 'mask:' + m, 'wall', 'stone', 'obstacle']);
}
// 2. bridge-rope: a plank walkway with rope rails
for (let m = 0; m < 16; m++) {
  const v = String(m).padStart(2, '0'), t = mkT('fences', 'bridge-rope', v), cx = 32, cy = 36;
  const plank = (x, y, hor) => hor ? rect(x - 2.2, y - 8, 4.4, 16, t.lg(WOODS, 0), .6, 1, ink('#3b2a1a', .5, .85)) : rect(x - 8, y - 2.2, 16, 4.4, t.lg(WOODS, 90), .6, 1, ink('#3b2a1a', .5, .85));
  const rail = (d, dy = 0, dx = 0) => line(d, '#3b2a1a', 2.6, .9, { transform: `translate(${dx} ${dy})` }) + line(d, '#d8c090', 1.4, 1, { transform: `translate(${dx} ${dy})` });
  t.add(ell(cx + 2, cy + 8, 11, 4, BLU[2], .22));
  for (const [a, b, c, d] of arms(m, cx, cy)) {
    if (b === d) { const x0 = Math.min(a, c), x1 = Math.max(a, c); for (let x = x0 + 2; x < x1; x += 5) t.add(plank(x, cy, true)); t.add(rail(`M${x0} ${cy - 9}H${x1}`), rail(`M${x0} ${cy + 9}H${x1}`)); }
    else { const y0 = Math.min(b, d), y1 = Math.max(b, d); for (let y = y0 + 2; y < y1; y += 5) t.add(plank(cx, y, false)); t.add(rail(`M${cx - 9} ${y0}V${y1}`), rail(`M${cx + 9} ${y0}V${y1}`)); }
  }
  if (m === 0 || [1, 2, 4, 8].includes(m)) t.add(plank(cx, cy, false), plank(cx, cy - 5, false), plank(cx, cy + 5, false));
  for (const [px, py] of [[cx - 9, cy - 9], [cx + 9, cy - 9], [cx - 9, cy + 9], [cx + 9, cy + 9]]) t.add(rect(px - 1.8, py - 7, 3.6, 9, t.lg(WOODS, 0), .8, 1, ink('#3b2a1a', .6, .85)));
  outT(t, 'fences', 'bridge-rope', v, ['autotile', 'connect4', 'mask:' + m, 'bridge', 'rope']);
}
