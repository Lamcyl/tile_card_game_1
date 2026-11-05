// Ashkara sub-area 6: Dust Bazaar (ashkara/dust-bazaar). Ground, ground-detail, three 47-blob autotile sets, two connect-4 sets.
// Objects: gen-ashkara-dust-bazaar-objects.mjs; interest/landmark/gate: ...-interest.mjs; decals + overlays: ...-decals.mjs. Every file runs on its own (helpers live in dust-bazaar-lib.mjs).
// Palette shift: dusty brown-rose earth and mud brick; saturated cloth colours. Packed earth (BAZ) is the exact family Red Wadi ramps into, so the east seam is continuous.
import { T, rng, f, ell, circ, rect, path, line, ink, wrapped, FAMS, dskel, dint, speckle, ripples, crackNet, tuft, sh, pebbleD, mix, TERRA, BAZ, APRI, TOMB, ROSE, DUST, TRMP, STRW, PLAZ, COBB, BSHD, MUDF, RUBL, TILE, ramp, streaks, earthBase, roseBase, dustBase, trampBase, strawBase, plazaBase, cobbBase, shadeBase, mudfBase, rublBase, tileBase, rugBase, CLOTH, MUD, MUDS, PLUM, INKB, WOODS, BRASS, BONE, C, tile, mkT, outT, blobSet, pts, stroke, sides, arms, bricks, jar, bone, heap, wood, mud } from './dust-bazaar-lib.mjs';

const ground = (cat, name, v, base, fn, tags = []) => tile(cat, name, v, C, ['seamless', cat === 'ground' ? 'ground' : 'ground-detail', ...tags], (t, r) => base() + fn(r, t));
const sp = (r, n, s = [.5, .9], c = '#fbeadc') => pts(r, n, 10, 11).map(([x, y]) => circ(x, y, r.range(...s), c, .8)).join('');
const pb = (r, n, s, c, gap = 11) => pts(r, n, 10, gap).map(([x, y]) => pebbleD(x, y, r.range(...s), c)).join('');
// ---------------- ground ----------------
const ea = (seed, o = {}) => dint(BAZ, seed, { n: 3, ...o });
ground('ground', 'packed-earth', 'a', earthBase, () => ea(13001));
ground('ground', 'packed-earth', 'b', earthBase, () => ea(13002, { cols: ['#e2c8b4', '#bf9c88'] }) + streaks(13002, 2, '#9a7864', .22, 12, 20));
ground('ground', 'packed-earth', 'c', earthBase, (r) => ea(13003) + sp(r, 5, [.5, 1]), ['glint']);
ground('ground', 'packed-earth', 'd', earthBase, (r) => ea(13004) + pb(r, 4, [.3, .5], ['#f2dccc', '#9a7864'], 14), ['pebbles']);
const ro = (seed) => dint(ROSE, seed, { n: 3 });
ground('ground', 'earth-swept', 'a', roseBase, () => ro(13011));
ground('ground', 'earth-swept', 'b', roseBase, () => ro(13012) + streaks(13012, 3, '#94705f', .2, 14, 22));
ground('ground', 'earth-swept', 'c', roseBase, (r) => ro(13013) + sp(r, 5));
const du = (seed) => dint(DUST, seed, { n: 3 });
ground('ground', 'dust-fine', 'a', dustBase, () => du(13021));
ground('ground', 'dust-fine', 'b', dustBase, () => du(13022) + ripples(13022, 3, '#a48a70', .3, 12, 18));
ground('ground', 'dust-fine', 'c', dustBase, (r) => du(13023) + sp(r, 5, [.5, .9], '#fff6ea'), ['glint']);
const tr = (seed) => dint(TRMP, seed, { n: 3 });
ground('ground', 'earth-trampled', 'a', trampBase, () => tr(13031));
ground('ground', 'earth-trampled', 'b', trampBase, () => tr(13032) + streaks(13032, 2, '#785444', .22, 12, 18));
ground('ground', 'earth-trampled', 'c', trampBase, (r) => tr(13033) + pb(r, 5, [.3, .5], ['#e6cdbb', '#785444'], 10), ['pebbles']);
const sw = (seed) => dint(STRW, seed, { n: 3 });
const straw = (r, n) => pts(r, n, 10, 9).map(([x, y]) => line(`M${f(x - 4)} ${f(y)}l8 ${r.range(-2, 2).toFixed(1)}`, '#a8823c', 1.1, .85) + line(`M${f(x - 4)} ${f(y - .6)}l8 ${r.range(-2, 2).toFixed(1)}`, '#f4e0a8', .6, .8)).join('');
ground('ground', 'straw-litter', 'a', strawBase, (r) => sw(13041) + straw(r, 9), ['straw']);
ground('ground', 'straw-litter', 'b', strawBase, (r) => sw(13042) + straw(r, 13), ['straw']);
ground('ground', 'straw-litter', 'c', strawBase, (r) => sw(13043) + straw(r, 6) + sp(r, 4, [.5, .8], '#fff3cf'), ['straw']);
ground('ground', 'plaza-slab', 'a', () => plazaBase(661), () => dint(PLAZ, 13051, { n: 2 }), ['paving']);
ground('ground', 'plaza-slab', 'b', () => plazaBase(663), () => dint(PLAZ, 13052, { n: 2 }) + streaks(13052, 2, '#a07e60', .2, 12, 18), ['paving']);
ground('ground', 'plaza-slab', 'c', () => plazaBase(665), (r) => dint(PLAZ, 13053, { n: 2 }) + sp(r, 4), ['paving']);
ground('ground', 'plaza-slab', 'd', () => plazaBase(667), (r) => dint(PLAZ, 13054, { n: 2 }) + pb(r, 3, [.3, .45], ['#f2dccc', '#a07e60'], 14), ['paving', 'pebbles']);
const co = (seed) => dint(COBB, seed, { n: 3 });
const cobb = (r, n, c) => pts(r, n, 9, 12).map(([x, y]) => pebbleD(x, y, r.range(.7, 1), c)).join('');
ground('ground', 'plaza-cobble', 'a', cobbBase, (r) => co(13061) + cobb(r, 7, ['#e6cdbb', '#866650']), ['cobbles']);
ground('ground', 'plaza-cobble', 'b', cobbBase, (r) => co(13062) + cobb(r, 8, ['#dcc0ae', '#7a5c48']), ['cobbles']);
ground('ground', 'plaza-cobble', 'c', cobbBase, (r) => co(13063) + cobb(r, 6, ['#ecd6c6', '#8c6c58']), ['cobbles']);
ground('ground', 'court-tile', 'a', tileBase, () => '', ['tile', 'glazed']);
ground('ground', 'court-tile', 'b', tileBase, (r) => sp(r, 3, [.5, .8], '#fff'), ['tile', 'glazed', 'glint']);
ground('ground', 'court-tile', 'c', tileBase, () => line('M10 36l6 -4l4 6l-3 5M44 14l4 6l-3 4l4 5', '#5a3a2e', 1.1, .7) + line('M10 37l6 -4M44 15l4 6', '#fff', .6, .6), ['tile', 'cracked']);
for (const [nm, c1, c2, c3, s] of [['rug-red', '#9a2a2e', '#d8503a', '#f3c24f', 701], ['rug-teal', '#14646e', '#2fb0aa', '#e8d4a0', 711], ['rug-saffron', '#b06a10', '#f0a020', '#c03a3a', 721]])
  for (const [v, k] of [['a', 0]]) ground('ground', nm, v, () => rugBase(c1, k ? c3 : c2, k ? c2 : c3, s + k), () => '', ['rug', 'cloth']);
ground('ground', 'shade-ground', 'a', shadeBase, () => dint(BSHD, 13071, { n: 3 }), ['shade']);
ground('ground', 'shade-ground', 'b', shadeBase, () => dint(BSHD, 13072, { n: 3 }) + streaks(13072, 3, '#7a5c6e', .2, 14, 22), ['shade']);
ground('ground', 'mud-floor', 'a', () => mudfBase(691), () => dint(MUDF, 13081, { n: 3 }), ['mud-brick', 'cracks']);
ground('ground', 'mud-floor', 'b', () => mudfBase(693), () => dint(MUDF, 13082, { n: 3 }) + streaks(13082, 2, '#8c5e48', .2, 12, 18), ['mud-brick', 'cracks']);
ground('ground', 'brick-rubble', 'a', rublBase, (r) => dint(RUBL, 13091, { n: 2 }) + pts(r, 5, 10, 13).map(([x, y]) => path(`M${f(x - 4)} ${f(y + 2)}L${f(x - 3)} ${f(y - 2)}L${f(x + 4)} ${f(y - 1.4)}L${f(x + 3.4)} ${f(y + 2.4)}Z`, '#c98e74', 1, ink(INKB, .6, .8)) + line(`M${f(x - 3)} ${f(y - 1.6)}H${f(x + 3.4)}`, '#ecc8b0', .8, .8)).join(''), ['rubble', 'ruined']);
ground('ground', 'brick-rubble', 'b', rublBase, (r) => dint(RUBL, 13092, { n: 2 }) + pb(r, 7, [.4, .7], ['#e0b49c', '#8a5446'], 9), ['rubble', 'ruined']);
// ramps. Red Wadi already carries terra<->bazaar; ours mirror them, plus the common ground, the Singing Erg apricot sand (south, across the wadi) and the Tomb Approach slab (north)
const rampSets = [
  ['bazaar-sand-fringe', BAZ, FAMS.sand, 13100], ['bazaar-dune-fringe', BAZ, FAMS.dune, 13110], ['bazaar-pan-fringe', BAZ, FAMS.pan, 13120], ['bazaar-reg-fringe', BAZ, FAMS.reg, 13130],
  ['bazaar-terra-fringe', BAZ, TERRA, 13140], ['bazaar-apricot-fringe', BAZ, APRI, 13150], ['bazaar-slab-fringe', BAZ, TOMB, 13160],
  ['plaza-bazaar-fringe', PLAZ, BAZ, 13170], ['straw-bazaar-fringe', STRW, BAZ, 13180],
];
for (const [name, from, to, seed] of rampSets) for (const [v, u] of [['a', .35], ['b', .7]]) ground('ground', name, v, () => dskel(ramp(from, to, u)), (r) => dint(ramp(from, to, u), seed + u * 10, { n: 3 }) + pts(r, 2, 12, 16).map(([x, y]) => circ(x, y, .7, '#fbeadc', .6)).join(''), ['ramp', 'blend']);
for (const [name, from, to, seed] of [['trampled-bazaar-fringe', TRMP, BAZ, 13200], ['rose-bazaar-fringe', ROSE, BAZ, 13210], ['dust-bazaar-fringe', DUST, BAZ, 13220], ['shade-bazaar-fringe', BSHD, BAZ, 13230], ['mud-bazaar-fringe', MUDF, BAZ, 13240], ['rubble-bazaar-fringe', RUBL, BAZ, 13250], ['cobble-plaza-fringe', COBB, PLAZ, 13260], ['apricot-terra-bridge', APRI, TERRA, 13270]])
  ground('ground', name, 'a', () => dskel(ramp(from, to, .5)), () => dint(ramp(from, to, .5), seed, { n: 3 }), ['ramp', 'blend']);

// ---------------- ground-detail ----------------
const dung = (x, y, s) => ell(x + 1, y + 1.6, 4 * s, 1.8 * s, '#3b2a24', .16) + ell(x, y, 3.8 * s, 2.6 * s, '#6a4a34', 1, 0, ink('#3a2418', .6, .8)) + ell(x - 1, y - .8, 1.6 * s, 1 * s, '#8c6a4c', .9) + circ(x + 1.4 * s, y + .4, .7, '#4a3020');
const coin = (x, y, s) => ell(x + .6, y + 1, 2.4 * s, 1.2 * s, '#3b2a24', .2) + ell(x, y, 2.4 * s, 2 * s, BRASS[1], 1, 0, ink(BRASS[2], .6, .9)) + ell(x - .6, y - .6, 1 * s, .7 * s, BRASS[0], .9);
const spill = (x, y, c, s = 1) => ell(x + .8, y + 1.2, 6 * s, 2.6 * s, '#3b2a24', .12) + ell(x, y, 6 * s, 3 * s, c[1], .95) + ell(x - 1.6 * s, y - .8 * s, 3 * s, 1.4 * s, c[0], .85) + [0, 1, 2, 3].map(i => circ(x + (i - 1.5) * 3.2 * s, y + (i % 2 ? 3.4 : -3.4) * s, .8, c[1], .8)).join('');
const date = (x, y, a) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">${ell(.8, 1.2, 4, 1.8, '#3b2a24', .15)}${ell(0, 0, 3.6, 2, '#6a3a22', 1, 0, ink('#3a1c10', .5, .85))}${ell(-1, -.6, 1.4, .7, '#a86a44', .9)}</g>`;
const sherd = (x, y, a, s) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">` + ell(.8, 1.2, 4 * s, 1.8 * s, '#3b2a24', .15) + path(`M${-4 * s} 0L${-1 * s} ${-2.4 * s}L${4 * s} ${-1 * s}L${2 * s} ${2 * s}Z`, '#c98e74', 1, ink(INKB, .6, .85)) + line(`M${-2 * s} 0H${2 * s}`, CLOTH.teal[1], .8, .9) + `</g>`;
ground('ground-detail', 'dung-pats', 'a', trampBase, (r) => pts(r, 5, 10, 12).map(([x, y]) => dung(x, y, r.range(.7, 1.1))).join(''), ['dung', 'animals']);
ground('ground-detail', 'straw-bundles', 'a', strawBase, (r) => pts(r, 4, 12, 15).map(([x, y]) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${r.range(-30, 30).toFixed(0)})">` + ell(1, 2, 8, 3, '#3b2a24', .16) + rect(-7, -3, 14, 6, '#e6cc86', 3, 1, ink('#8a6a30', .8, .85)) + line('M-2 -3V3M2 -3V3', '#8a6a30', .8, .7) + line('M-7 -1H7', '#f4e0a8', .7, .8) + `</g>`).join(''), ['straw', 'hay']);
ground('ground-detail', 'spice-spill', 'a', trampBase, () => spill(22, 26, CLOTH.saff) + spill(42, 44, CLOTH.red, .9), ['spice', 'loot']);
ground('ground-detail', 'spice-spill', 'b', trampBase, () => spill(24, 40, CLOTH.green, .9) + spill(44, 24, CLOTH.mag, 1), ['spice', 'loot']);
ground('ground-detail', 'grain-spill', 'a', earthBase, (r) => pts(r, 18, 9, 7).map(([x, y]) => ell(x, y, 1.1, .7, '#e8c874', 1, r.range(0, 180), ink('#a07a30', .3, .8))).join(''), ['grain', 'loot']);
ground('ground-detail', 'coins-scatter', 'a', earthBase, (r) => pts(r, 6, 10, 11).map(([x, y]) => coin(x, y, r.range(.7, 1))).join(''), ['coins', 'loot']);
ground('ground-detail', 'dates-fallen', 'a', trampBase, (r) => pts(r, 7, 10, 9).map(([x, y]) => date(x, y, r.range(0, 180))).join(''), ['food']);
ground('ground-detail', 'potsherds', 'a', earthBase, (r) => pts(r, 5, 10, 12).map(([x, y]) => sherd(x, y, r.range(0, 180), r.range(.8, 1.2))).join(''), ['pottery', 'loot']);
ground('ground-detail', 'potsherds', 'b', rublBase, (r) => pts(r, 5, 10, 12).map(([x, y]) => sherd(x, y, r.range(0, 180), r.range(.8, 1.2))).join(''), ['pottery', 'loot']);
ground('ground-detail', 'cloth-scraps', 'a', trampBase, (r) => pts(r, 4, 11, 14).map(([x, y], i) => { const c = [CLOTH.red, CLOTH.teal, CLOTH.saff, CLOTH.mag][i]; return `<g transform="translate(${f(x)} ${f(y)}) rotate(${r.range(-40, 40).toFixed(0)})">` + ell(1, 1.6, 6, 2.6, '#3b2a24', .14) + path('M-6 -1Q-2 -3.4 2 -1T6 -1L5 2.4Q1 4 -3 2.4T-6 2Z', c[1], 1, ink(c[2], .6, .85)) + line('M-4 0q4 -2 8 0', c[0], .8, .8) + `</g>`; }).join(''), ['cloth']);
ground('ground-detail', 'ash-charcoal', 'a', trampBase, (r) => [[24, 28, 9], [44, 42, 7]].map(([x, y, rr]) => ell(x, y, rr, rr * .7, '#4a3a38', .55) + ell(x - 1, y - 1, rr * .6, rr * .4, '#8a7a76', .5) + pts(r, 3, 8, 6).slice(0, 2).map(([a, b]) => circ(x + (a - 32) * .25, y + (b - 32) * .2, 1, '#2a1c1a', .8)).join('')).join(''), ['ash', 'fire']);
ground('ground-detail', 'dye-spill', 'a', earthBase, () => path('M12 36Q18 24 30 28Q44 26 52 38Q40 46 26 44Q16 44 12 36Z', CLOTH.indigo[1], .5) + path('M18 36Q24 30 32 32Q42 32 46 38Q36 42 26 41Z', CLOTH.indigo[0], .45), ['dye', 'stain']);
ground('ground-detail', 'dye-spill', 'b', earthBase, () => path('M12 36Q18 24 30 28Q44 26 52 38Q40 46 26 44Q16 44 12 36Z', CLOTH.red[1], .5) + path('M18 36Q24 30 32 32Q42 32 46 38Q36 42 26 41Z', CLOTH.red[0], .45), ['dye', 'stain']);
ground('ground-detail', 'rope-coil', 'a', trampBase, () => [[24, 30, 8], [44, 44, 6]].map(([x, y, rr]) => ell(x + 1, y + 2, rr + 1, rr * .5, '#3b2a24', .16) + [1, .72, .46].map(k => ell(x, y, rr * k, rr * k * .6, 'none', 1, 0, { stroke: '#a88a54', 'stroke-width': 2.2, 'stroke-opacity': 1 })).join('') + ell(x - 1, y - 1, rr * .8, rr * .4, 'none', .6, 0, { stroke: '#e6cc86', 'stroke-width': .7, 'stroke-opacity': .9 })).join(''), ['rope']);
ground('ground-detail', 'bone-scraps', 'a', trampBase, (r) => pts(r, 4, 11, 13).map(([x, y]) => bone(x, y, r.range(6, 10), r.range(0, 180))).join(''), ['bones']);
ground('ground-detail', 'cracked-earth', 'a', () => dskel(BAZ) + crackNet(711, '#6a4a3a', .55), () => ea(13301, { n: 2 }), ['cracks']);
ground('ground-detail', 'weeds-dry', 'a', earthBase, (r) => pts(r, 5, 11, 12).map(([x, y]) => tuft(x, y + 3, '#a89058', .9, .8)).join(''), ['plants']);

// ---------------- autotiles (47-blob) ----------------
// 1. mudbrick-block: a raised flat-roofed mud-brick building mass; the unlit S and E sides drop as brick courses in plum shade
blobSet('mudbrick-block', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 18, tags: ['wall', 'building', 'raised', 'obstacle'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(earthBase(), `<path d="${G.d}" transform="translate(5 7)" fill="${PLUM}" opacity=".34"/>`, `<path d="${G.d}" transform="translate(3 4)" fill="#6a4048" opacity=".26"/>`);
    t.add(`<g clip-path="${clip}">`, rect(0, 0, 64, 64, t.lg(['#f2d4c0', '#e0b49c'], 60)), speckle(6002, 14, ['#c98e74', '#fff0e4'], 1, .35), sides(G, ['#8a5446', .66], ['#fbeadc', .6], 15, 6), '</g>');
    for (const [on, d] of [[!G.h(16), `M${G.x0} ${G.y1 - 15}H${G.x1}V${G.y1}H${G.x0}Z`], [!G.h(4), `M${G.x1 - 15} ${G.y0}H${G.x1}V${G.y1}H${G.x1 - 15}Z`]]) if (on) { const c2 = t.clip(d); t.add(`<g clip-path="${clip}"><g clip-path="${c2}">`, bricks(0, 0, 64, 64, 6001, MUDS, 5, 10), '</g></g>'); }
    t.add(`<g clip-path="${clip}">`, sides(G, [PLUM, .3], ['#fff', .3], 8, 3), '</g>');
    // brick courses on the dark faces, roof plaster and parapet line
    t.add(`<g clip-path="${clip}">`, [0, 1, 2].map(i => !G.h(16) ? line(`M${G.x0} ${G.y1 - 3 - i * 4.4}H${G.x1}`, '#5a3030', 1, .4) : '').join(''), [0, 1, 2].map(i => !G.h(4) ? line(`M${G.x1 - 3 - i * 4.4} ${G.y0}V${G.y1}`, '#5a3030', 1, .4) : '').join(''), '</g>');
    t.add(`<g clip-path="${clip}">`, `<path d="${G.d}" transform="translate(-.5 -.5)" fill="none" stroke="#fbeadc" stroke-width="5" stroke-opacity=".28"/>`, stroke(G.d, '#d9ab90', 11, .22), '</g>');
    t.add(path(G.d, 'none', 1, { stroke: INKB, 'stroke-width': 1.3, 'stroke-opacity': .75, 'stroke-linejoin': 'round' }));
  },
});
// 2. plaza-paving: flush sandstone paving patch with a raised kerb lip
blobSet('plaza-paving', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['paving', 'plaza', 'floor'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(earthBase(), stroke(G.d, '#8a6854', 13, .22), stroke(G.d, '#a07e60', 8, .3), stroke(G.d, '#f2dccc', 4, .6, -.4, -.4));
    t.add(`<g clip-path="${clip}">`, plazaBase(669), sides(G, ['#7a5c6e', .24], ['#fbeadc', .4], 9, 5), stroke(G.d, '#a07e60', 8, .2), '</g>');
    t.add(stroke(G.d, '#7a5240', 1.1, .65));
  },
});
// 3. awning-cloth: a stretched striped canopy seen from above; scalloped valance on the south side and a soft cast shadow
blobSet('awning-cloth', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 18, tags: ['awning', 'cloth', 'shade', 'overhead'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(earthBase(), `<path d="${G.d}" transform="translate(5 8)" fill="${PLUM}" opacity=".36"/>`, `<path d="${G.d}" transform="translate(3 5)" fill="#6a4048" opacity=".28"/>`);
    let st = ''; for (let x = -8; x < 72; x += 10) st += rect(x, 0, 5, 64, CLOTH.red[1], 0, 1) + rect(x + 5, 0, 5, 64, CLOTH.cream[0], 0, 1);
    t.add(`<g clip-path="${clip}">`, st, rect(0, 0, 64, 64, t.lg(['#ffffff', '#000000'], 60), 0, .0), `<path d="${G.d}" fill="none" stroke="#fff" stroke-width="8" stroke-opacity=".2" transform="translate(-1 -1)"/>`, sides(G, [PLUM, .34], ['#fff', .22], 7, 4), '</g>');
    // scalloped valance along a free south edge
    if (!G.h(16)) { let v = ''; for (let x = G.x0; x < G.x1 - 1; x += 8) v += path(`M${x} ${G.y1 - 4}H${Math.min(x + 8, G.x1)}V${G.y1}Q${x + 4} ${G.y1 + 5} ${x} ${G.y1}Z`, ((x - G.x0) / 8) % 2 ? CLOTH.cream[1] : CLOTH.red[2], 1, ink(INKB, .6, .8)); t.add(`<g>${v}</g>`); }
    t.add(path(G.d, 'none', 1, { stroke: '#5a2430', 'stroke-width': 1.2, 'stroke-opacity': .7, 'stroke-linejoin': 'round' }));
  },
});

// ---------------- connect-4 (N1 E2 S4 W8) ----------------
// 1. wall-mudbrick: a low market wall of mud brick with a plastered coping
for (let m = 0; m < 16; m++) {
  const v = String(m).padStart(2, '0'), t = mkT('fences', 'wall-mudbrick', v), cx = 32, cy = 40;
  const blk = (x, y, w, h, td) => path(`M${f(x)} ${f(y)}L${f(x + td)} ${f(y - td)}H${f(x + w + td)}L${f(x + w)} ${f(y)}Z`, '#f4d8c4', 1, ink(INKB, .8, .7)) + rect(x, y, w, h, t.lg([MUD[1], MUD[2]], 60), 0, 1, ink(INKB, .9, .8)) + path(`M${f(x + w)} ${f(y)}L${f(x + w + td)} ${f(y - td)}V${f(y + h - td)}L${f(x + w)} ${f(y + h)}Z`, MUD[2], .85, ink(INKB, .7, .7));
  t.add(ell(cx + 2, cy + 5, 11, 3.4, PLUM, .3));
  for (const [a, b, c, d] of arms(m, cx, cy)) {
    if (b === d) { const x0 = Math.min(a, c), x1 = Math.max(a, c); for (let x = x0; x < x1; x += 10) t.add(blk(x, cy - 6, Math.min(10, x1 - x), 11, 4)); }
    else { const y0 = Math.min(b, d), y1 = Math.max(b, d); for (let y = y0; y < y1; y += 9) t.add(ell(cx + 1, y + 6, 8, 2.6, '#3b2a24', .1), blk(cx - 6, y + 1, 12, 5, 3)); }
  }
  t.add(blk(cx - 7, cy - 10, 14, 15, 5), line(`M${cx - 4} ${cy - 3}h8M${cx - 4} ${cy + 1}h8`, MUD[2], .8, .6));
  outT(t, 'fences', 'wall-mudbrick', v, ['autotile', 'connect4', 'mask:' + m, 'wall', 'mud-brick', 'obstacle']);
}
// 2. rail-hitching: a camel hitching rail, forked posts with a rope-lashed pole
for (let m = 0; m < 16; m++) {
  const v = String(m).padStart(2, '0'), t = mkT('fences', 'rail-hitching', v), cx = 32, cy = 38;
  const post = (x, y, fork = true) => ell(x + 1.6, y + 1, 4, 1.6, '#3b2a24', .22) + rect(x - 2, y - 14, 4, 15, t.lg(WOODS, 0), .6, 1, ink('#3b2a1a', .6, .85)) + (!fork ? ell(x, y - 14, 2.4, 1.2, '#d8b080', 1, 0, ink('#3b2a1a', .5, .85)) : path(`M${x - 3.4} ${y - 14}L${x - 2} ${y - 18}L${x - .4} ${y - 14}M${x + .4} ${y - 14}L${x + 2} ${y - 18}L${x + 3.4} ${y - 14}`, 'none', 1, { stroke: '#3b2a1a', 'stroke-width': 1.4, 'stroke-linecap': 'round' }));
  const pole = (d) => line(d, '#3b2a1a', 4.2, .9) + line(d, '#b8905c', 2.6, 1) + line(d, '#e0c090', .8, .8);
  t.add(ell(cx + 2, cy + 4, 10, 3, PLUM, .22));
  for (const [a, b, c, d] of arms(m, cx, cy)) {
    if (b === d) { const x0 = Math.min(a, c), x1 = Math.max(a, c); if (x0 === 0 || x1 === 64) { t.add(post(x0 === 0 ? 8 : 56, cy)); } t.add(pole(`M${x0} ${cy - 11}H${x1}`)); if (x1 - x0 > 20) t.add(post((x0 + x1) / 2 + (x0 === 0 ? -8 : 8), cy)); }
    else { const y0 = Math.min(b, d), y1 = Math.max(b, d); t.add(pole(`M${cx} ${y0 - 0}V${y1}`)); for (let y = y0 + 10; y < y1; y += 22) t.add(post(cx, y + 6, false)); }
  }
  t.add(post(cx, cy, !(m === 1 || m === 4 || m === 5)));
  if (m === 0) t.add(post(cx - 8, cy), pole(`M${cx - 8} ${cy - 11}H${cx + 8}`), post(cx + 8, cy));
  t.add(path(`M${cx - 2} ${cy - 11}q-3 7 0 11q4 4 1 8`, 'none', 1, { stroke: '#a88a54', 'stroke-width': 1.4, 'stroke-linecap': 'round' }));
  outT(t, 'fences', 'rail-hitching', v, ['autotile', 'connect4', 'mask:' + m, 'rail', 'camel', 'obstacle']);
}
