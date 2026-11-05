// Ashkara sub-area 7: Tomb Approach (ashkara/tomb-approach). Ground and ground-detail (avenue slabs, hall floors, painted floors, sand), four 47-blob autotile sets
// (hall-wall and tomb-wall with a visible cap and face in 3/4 view, avenue-paving, sand-drift) and three connect-4 sets (painted wall, low wall, colonnade).
// Objects: ...-objects.mjs; interest/landmark/gate: ...-interest.mjs; decals + overlays: ...-decals.mjs. Every file runs on its own (helpers live in tomb-approach-lib.mjs).
// Palette shift: golden sandstone, lapis and red paint. Bazaar slab fringe (TOMB = common slab) ramps in from the south.
import { T, rng, f, ell, circ, rect, path, line, ink, FAMS, dskel, dint, speckle, ripples, crackNet, slabLines, sandBase, tuft, pebbleD, mix, ramp, BAZ, GOLD, streaks, pts, stroke, sides, arms, BLOBS, pad3, STN, STS, LAP, RED, TQ, GLD, BLK, LIN, SHD, INKT, INKL, ik, AVE, WORN, HALL, HSHD, HDRK, HSND, PLST, TOMB, flagBase, paintBase, avenueBase, wornBase, hallBase, shadeBase, darkBase, sandBaseT, plasterBase, tile, mkT, outT, blobSet, C, GLYPH, glyphRow, frieze, wallFace, capFill, column, lotus, sh } from './tomb-approach-lib.mjs';

const ground = (cat, name, v, base, fn, tags = []) => tile(cat, name, v, C, ['seamless', cat === 'ground' ? 'ground' : 'ground-detail', ...tags], (t, r) => base() + fn(r, t));
const sp = (r, n, s = [.5, .9], c = '#fff3cf') => pts(r, n, 10, 11).map(([x, y]) => circ(x, y, r.range(...s), c, .8)).join('');
const pb = (r, n, s, c, gap = 11) => pts(r, n, 10, gap).map(([x, y]) => pebbleD(x, y, r.range(...s), c)).join('');
// ---------------- ground ----------------
const av = (seed, o = {}) => dint(AVE, seed, { n: 2, ...o });
for (const [v, seed] of [['a', 821], ['b', 823], ['c', 825]]) ground('ground', 'avenue-slab', v, () => avenueBase(seed), (r) => av(14000 + seed) + (v === 'c' ? sp(r, 4) : ''), ['paving', 'avenue', ...(v === 'c' ? ['glint'] : [])]);
const sandJoint = (r) => line(`M0 32H64M16 32V64M48 32V64M32 0V32`, '#e8cf94', 2.2, .7);
for (const [v, seed] of [['a', 831], ['b', 833], ['c', 835]]) ground('ground', 'avenue-worn', v, () => wornBase(seed), (r) => dint(WORN, 14100 + seed, { n: 2 }) + (v === 'b' ? sandJoint(r) : '') + (v === 'c' ? crackLn() : '') + sp(r, 4, [.5, 1], '#f6e2b0'), ['paving', 'worn', ...(v === 'c' ? ['cracks'] : [])]);
function crackLn() { return line('M12 18l6 5l-2 7l6 4M44 40l5 -4l-1 -7l6 -3', '#6a4a30', 1.1, .65) + line('M12.8 19l6 5M44.8 41l5 -4', '#fff3cf', .6, .6); }
const sandy = () => dskel(HSND) + ripples(891, 5, '#c9a468', .38) + line('M0 32H20M44 32H64M16 32V50M48 32V64', '#caa470', 1.4, .35) + speckle(892, 16, ['#fff6d8', '#c9a468'], 1, .5);
for (const [v, seed] of [['a', 14201], ['b', 14202], ['c', 14203]]) ground('ground', 'avenue-sand', v, sandy, (r) => dint(HSND, seed, { n: 2 }) + (v === 'b' ? ripples(seed, 3, '#c9a468', .4, 12, 18) : '') + (v === 'c' ? sp(r, 5, [.5, .9], '#fffbe8') : ''), ['sand', 'drift']);
const ha = (seed) => dint(HALL, seed, { n: 2 });
for (const [v, seed] of [['a', 841], ['b', 843], ['c', 845]]) ground('ground', 'hall-flag', v, () => hallBase(seed), (r) => ha(14300 + seed) + (v === 'c' ? sp(r, 4, [.5, .9], '#fffbe8') : v === 'd' ? streaks(seed, 2, '#b88a58', .2, 12, 18) : ''), ['floor', 'interior', 'flagstone']);
for (const [v, seed] of [['a', 851], ['b', 853]]) ground('ground', 'hall-shade', v, () => shadeBase(seed), () => dint(HSHD, 14400 + seed, { n: 2 }) + (v === 'b' ? streaks(seed, 2, '#7c5e6e', .2, 12, 18) : ''), ['floor', 'interior', 'shade']);
for (const [v, seed] of [['a', 861], ['b', 863]]) ground('ground', 'hall-dark', v, () => darkBase(seed), (r) => dint(HDRK, 14500 + seed, { n: 2 }) + (v === 'b' ? sp(r, 5, [.5, .9], '#d8d2e0') : ''), ['floor', 'interior', 'basalt', 'sanctum']);
for (const [nm, kind, seed] of [['hall-painted-lotus', 'lotus', 811], ['hall-painted-diamond', 'diamond', 813], ['hall-painted-band', 'band', 815]]) for (const v of nm.endsWith('lotus') ? ['a', 'b'] : ['a']) ground('ground', nm, v, () => paintBase(kind, seed + (v === 'b' ? 20 : 0)), (r) => v === 'b' ? line('M14 42l7 -6l-1 -8M42 18l6 5l-2 7', '#5a3a22', 1.1, .6) + line('M44 19l4 4', '#fff3cf', .6, .6) + pts(r, 3, 12, 14).map(([x, y]) => circ(x, y, 1.2, '#f6e8c4', .8)).join('') : '', ['floor', 'painted', 'interior', ...(v === 'b' ? ['worn'] : [])]);
// black-and-gold inlay: seamless 4x4 checker of basalt and gold-leaf squares
function inlay(worn) { let o = dskel(HDRK); const S = 16; for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const g = (i + j) % 2; o += rect(i * S + 1, j * S + 1, S - 2, S - 2, g ? '#e8b848' : '#5a5666', 1, g ? .88 : .8) + (g ? rect(i * S + 3, j * S + 3, S - 6, S - 6, 'none', 0, 1, { stroke: '#fff0a8', 'stroke-width': .8, 'stroke-opacity': .7 }) : ''); } o += line('M0 0H64M0 16H64M0 32H64M0 48H64M0 64H64M0 0V64M16 0V64M32 0V64M48 0V64M64 0V64', '#221f2a', 1.2, .7); return o + (worn ? speckle(883, 22, ['#fff0c8', '#3a3644'], 1.1, .55) : ''); }
ground('ground', 'hall-inlay', 'a', () => inlay(false), () => '', ['floor', 'interior', 'inlay', 'gold']);
ground('ground', 'hall-inlay', 'b', () => inlay(true), () => '', ['floor', 'interior', 'inlay', 'worn']);
for (const [v, seed] of [['a', 871]]) ground('ground', 'hall-cracked', v, () => flagBase(HALL, seed, { tone: .1 }) + crackNet(seed, '#6a4a30', .6, .7), () => ha(14600 + seed), ['floor', 'interior', 'cracks']);
const driftHeap = (x, y, s) => ell(x, y + 2 * s, 11 * s, 4 * s, '#caa470', .5) + ell(x - .5, y, 10 * s, 4.6 * s, '#f3de9e', .95, 0, ink('#c9a468', .6, .6)) + ell(x - 3 * s, y - 1.4 * s, 5 * s, 1.8 * s, '#fffae0', .8) + ell(x + 4 * s, y + 1.6 * s, 5 * s, 1.6 * s, SHD, .16);
ground('ground', 'hall-drift', 'a', () => hallBase(841), () => driftHeap(20, 22, 1) + driftHeap(46, 44, 1.2), ['floor', 'interior', 'sand']);
ground('ground', 'hall-drift', 'b', () => hallBase(843), () => driftHeap(40, 20, 1.1) + driftHeap(20, 42, .9) + sp(rng(5), 5, [.5, .8], '#fffbe8'), ['floor', 'interior', 'sand']);
for (const [v, seed] of [['a', 14701], ['b', 14702]]) ground('ground', 'hall-sand', v, sandBaseT, (r) => dint(HSND, seed, { n: 3 }) + (v === 'b' ? ripples(seed, 3, '#c9a468', .35, 12, 18) : '') + (v === 'c' ? sp(r, 5, [.5, .9], '#fffbe8') : ''), ['sand', 'interior', 'drift']);
const chip = (r) => pts(r, 6, 10, 12).map(([x, y]) => path(`M${f(x - 4)} ${f(y + 2)}L${f(x - 3)} ${f(y - 2)}L${f(x + 4)} ${f(y - 1.4)}L${f(x + 3.4)} ${f(y + 2.4)}Z`, '#f0cf98', 1, ink(INKT, .6, .8)) + line(`M${f(x - 3)} ${f(y - 1.6)}H${f(x + 3.4)}`, '#fff3cf', .8, .8)).join('');
ground('ground', 'hall-rubble', 'a', () => hallBase(845), (r) => ha(14801) + chip(r), ['floor', 'interior', 'rubble', 'ruined']);
ground('ground', 'hall-rubble', 'b', () => wornBase(837), (r) => dint(WORN, 14802, { n: 2 }) + pb(r, 7, [.4, .7], ['#f0cf98', '#a98050'], 9), ['paving', 'rubble', 'ruined']);
// ramps: the Dust Bazaar slab (south) and its earth, common ground, avenue to sand / hall / shade / dark, Sun Citadel gold (east)
const rampSets = [
  ['slab-avenue-fringe', TOMB, AVE, 14900], ['bazaar-avenue-fringe', BAZ, AVE, 14910], ['avenue-sand-fringe', AVE, HSND, 14920], ['avenue-hall-fringe', AVE, HALL, 14930], ['gold-avenue-fringe', GOLD, AVE, 14940], ['hall-sand-fringe', HALL, HSND, 14950],
];
for (const [name, from, to, seed] of rampSets) for (const [v, u] of (name.startsWith('avenue-sand') || name.startsWith('hall-sand') ? [['a', .5]] : [['a', .35], ['b', .7]])) ground('ground', name, v, () => dskel(ramp(from, to, u)), (r) => dint(ramp(from, to, u), seed + u * 10, { n: 3 }) + pts(r, 2, 12, 16).map(([x, y]) => circ(x, y, .7, '#fff3cf', .6)).join(''), ['ramp', 'blend']);
for (const [name, from, to, seed] of [['sand-avenue-fringe', FAMS.sand, AVE, 14960], ['dune-avenue-fringe', FAMS.dune, AVE, 14961], ['pan-avenue-fringe', FAMS.pan, AVE, 14962], ['reg-avenue-fringe', FAMS.reg, AVE, 14963], ['hall-shade-fringe', HALL, HSHD, 14964], ['hall-dark-fringe', HALL, HDRK, 14965], ['worn-avenue-fringe', WORN, AVE, 14966], ['hall-painted-fringe', HALL, PLST, 14967]])
  ground('ground', name, 'a', () => dskel(ramp(from, to, .5)), () => dint(ramp(from, to, .5), seed, { n: 3 }), ['ramp', 'blend']);

// ---------------- ground-detail ----------------
const disc = (x, y, r, c1, c2) => circ(x, y, r, c1, 1, ink(c2, 1, .85)) + circ(x, y, r * .62, c2, .35);
ground('ground-detail', 'floor-scarab', 'a', hallBase, () => circ(32, 32, 17, '#f8e4bc', .9, ink(INKT, 1, .6)) + GLYPH.scarab(32, 32, LAP[1], 3.2) + line('M18 32H10M46 32H54M32 15V9M32 49V55', GLD[1], 2, .9), ['inlay', 'scarab', 'seal']);
ground('ground-detail', 'floor-sun-disc', 'a', hallBase, () => disc(32, 32, 14, GLD[1], GLD[2]) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4; return line(`M${f(32 + Math.cos(a) * 17)} ${f(32 + Math.sin(a) * 17)}L${f(32 + Math.cos(a) * 24)} ${f(32 + Math.sin(a) * 24)}`, RED[1], 2.4, .9); }).join(''), ['inlay', 'sun']);
ground('ground-detail', 'floor-ankh', 'a', hallBase, () => rect(10, 10, 44, 44, '#f6e4bc', 3, .85, ink(INKT, .8, .5)) + GLYPH.ankh(32, 30, LAP[1], 3.6) + rect(14, 14, 36, 36, 'none', 2, 1, { stroke: RED[1], 'stroke-width': 1.4, 'stroke-opacity': .8 }), ['inlay', 'ankh']);
ground('ground-detail', 'floor-cartouche', 'a', hallBase, () => rect(12, 22, 40, 20, '#f6e4bc', 10, .95, ink(RED[2], 1.4, .85)) + glyphRow(14, 50, 32, 1401, INKL, .7, 9, ['bird', 'feather', 'sun', 'wave']) + line('M52 18V46', RED[1], 2.4, .9), ['inlay', 'cartouche']);
ground('ground-detail', 'floor-eye', 'a', hallBase, () => rect(10, 18, 44, 28, '#f6e4bc', 4, .9, ink(INKT, .8, .5)) + GLYPH.eye(32, 30, LAP[2], 4.4) + line('M12 20H52M12 44H52', LAP[1], 1.2, .8), ['inlay', 'eye']);
ground('ground-detail', 'sand-ripples-stone', 'a', avenueBase, () => ripples(1411, 6, '#c9a468', .45, 12, 20) + ripples(1412, 4, '#fff6d8', .5, 10, 14), ['sand', 'wind']);
const sherd = (x, y, a, s) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">` + ell(.8, 1.2, 4 * s, 1.8 * s, '#3b2a24', .15) + path(`M${-4 * s} 0L${-1 * s} ${-2.4 * s}L${4 * s} ${-1 * s}L${2 * s} ${2 * s}Z`, '#e4a870', 1, ink(INKT, .6, .85)) + line(`M${-2 * s} 0H${2 * s}`, LAP[1], .9, .9) + `</g>`;
ground('ground-detail', 'potsherds', 'a', hallBase, (r) => pts(r, 6, 10, 12).map(([x, y]) => sherd(x, y, r.range(0, 180), r.range(.8, 1.2))).join(''), ['pottery', 'loot']);
const nug = (x, y, s) => ell(x + .6, y + 1, 2.6 * s, 1.2 * s, '#3b2a24', .2) + ell(x, y, 2.6 * s, 2 * s, GLD[1], 1, 0, ink(GLD[2], .6, .9)) + ell(x - .6, y - .6, 1 * s, .7 * s, GLD[0], .9);
ground('ground-detail', 'gold-scatter', 'a', hallBase, (r) => pts(r, 8, 10, 9).map(([x, y]) => nug(x, y, r.range(.7, 1.1))).join(''), ['gold', 'loot']);
ground('ground-detail', 'gold-scatter', 'b', darkBase, (r) => pts(r, 6, 10, 11).map(([x, y]) => nug(x, y, r.range(.8, 1.2))).join('') + circ(40, 24, 3, LAP[1], 1, ink(LAP[2], .6, .9)) + circ(24, 42, 2.4, TQ[1], 1, ink(TQ[2], .6, .9)), ['gold', 'jewels', 'loot']);
ground('ground-detail', 'bone-scraps', 'a', wornBase, (r) => pts(r, 4, 11, 13).map(([x, y]) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${r.range(0, 180).toFixed(0)})">` + ell(1.2, 2.2, 5, 1.8, '#3b2a24', .14) + line('M-4 0H4', '#eadcc0', 3) + circ(-4, 0, 2, '#fffaf0', 1, ink('#8a7458', .5, .8)) + circ(4, 0, 2, '#fffaf0', 1, ink('#8a7458', .5, .8)) + `</g>`).join(''), ['bones']);
ground('ground-detail', 'snake-trail', 'a', sandBaseT, () => line('M-2 40Q8 30 16 38T32 36T48 30T66 38', '#b8905a', 2.6, .55) + line('M-2 41Q8 31 16 39T32 37T48 31T66 39', '#fff6d8', .8, .6), ['tracks', 'snake']);
ground('ground-detail', 'lapis-flakes', 'a', hallBase, (r) => pts(r, 10, 8, 8).map(([x, y], i) => path(`M${f(x - 2)} ${f(y)}L${f(x)} ${f(y - 1.8)}L${f(x + 2)} ${f(y + .4)}L${f(x)} ${f(y + 1.6)}Z`, [LAP, RED, TQ][i % 3][1], 1, ink([LAP, RED, TQ][i % 3][2], .4, .8))).join(''), ['paint', 'flakes']);
ground('ground-detail', 'candle-stubs', 'a', hallBase, () => [[22, 28], [42, 40], [30, 46]].map(([x, y]) => ell(x + 1, y + 1.4, 4, 1.6, '#3b2a24', .2) + rect(x - 2.4, y - 5, 4.8, 6, LIN[0], 1, 1, ink(LIN[2], .6, .9)) + ell(x, y - 5, 2.4, .9, LIN[1], 1) + path(`M${x} ${y - 6}q-1.4 -2.4 0 -4q1.4 1.6 0 4Z`, '#ffb040', .95) + ell(x + 2, y + 1.4, 3, 1.2, LIN[0], .7)).join(''), ['candle', 'wax']);
ground('ground-detail', 'linen-strips', 'a', hallBase, (r) => pts(r, 3, 12, 15).map(([x, y]) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${r.range(-40, 40).toFixed(0)})">` + ell(1, 1.6, 9, 2.6, '#3b2a24', .14) + path('M-9 -1.4Q-3 -3 3 -1T9 -1L8 2Q2 3.4 -3 2T-9 2Z', LIN[0], 1, ink(LIN[2], .6, .85)) + line('M-6 0q5 -1.4 10 0', LIN[2], .7, .7) + `</g>`).join(''), ['linen', 'mummy']);
ground('ground-detail', 'dried-lotus', 'a', hallBase, (r) => pts(r, 5, 10, 12).map(([x, y]) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${r.range(0, 180).toFixed(0)})">` + ell(.6, 1.2, 4, 1.6, '#3b2a24', .14) + path('M0 0Q-4 -3 -5 0Q-4 3 0 0ZM0 0Q4 -3 5 0Q4 3 0 0ZM0 0Q-1 -4 0 -5Q1 -4 0 0Z', '#caa8a0', 1, ink('#7a5448', .5, .8)) + circ(0, 0, 1, GLD[1]) + `</g>`).join(''), ['plants', 'offering']);
ground('ground-detail', 'broken-slab', 'a', avenueBase, () => path('M14 20L30 14L40 24L34 38L18 36Z', '#f0d4a0', .9, ink(INKT, 1, .8)) + line('M18 21L28 17M34 38L40 24', '#fff3cf', 1, .7) + line('M20 30L34 26', '#6a4a30', 1.1, .6) + path('M40 24L50 30L46 44L34 38Z', '#e0b27e', .9, ink(INKT, 1, .8)), ['rubble', 'broken']);
ground('ground-detail', 'joint-weeds', 'a', avenueBase, (r) => [[18, 32], [32, 32], [48, 22], [48, 46], [16, 8], [16, 56]].map(([x, y], i) => tuft(x, y + 3, '#8a9a50', .85, .8)).join(''), ['plants']);

// ---------------- autotiles (47-blob) ----------------
// 3/4 walls: a mass of tiles shows its cap everywhere; a tile with no south neighbour also shows the wall face (painted or rough ashlar) in its lower 24px. Corners notch where a diagonal is missing.
const FH = 24, K = 12;
function wallBlob(name, kind, seed, tags) {
  for (const m of BLOBS) {
    const t = mkT('edges', name, pad3(m)), h = (b) => !!(m & b), nw = h(1) && h(64) && !h(128), ne = h(1) && h(4) && !h(2), capH = h(16) ? 64 : 64 - FH;
    const d = `M${nw ? K : 0} 0H${ne ? 64 - K : 64}${ne ? `V${K}H64` : ''}V64H0V${nw ? K : 0}${nw ? `H${K}V0` : ''}Z`, cl = t.clip(d), cc = t.clip(`M0 0H64V${capH}H0Z`);
    t.add(hallBase());
    t.add(`<g clip-path="${cl}">`, `<g clip-path="${cc}">`, capFill(t, 0, 0, 64, capH), slabLines(seed), '</g>');
    if (!h(1)) t.add(line('M0 .8H64', INKT, 1.8, .85), line('M0 3H64', '#fff', 1.2, .5));
    if (!h(64)) t.add(rect(0, 0, 3, capH, '#fff', 0, .4), line('M.8 0V64', INKT, 1.8, .8));
    if (!h(4)) t.add(rect(57, 0, 7, capH, '#b8864e', 0, .4), line('M63.2 0V64', INKT, 1.8, .8));
    if (!h(16)) {
      t.add(wallFace(t, 0, 64, capH, 64, kind, seed + 1), line(`M0 ${capH}H64`, INKT, 1.4, .85), line(`M0 ${capH - 1.2}H64`, '#fff', 1, .55));
      if (!h(64)) t.add(rect(0, capH, 3, FH, '#fff', 0, .3), line(`M.8 ${capH}V64`, INKT, 1.8, .8));
      if (!h(4)) t.add(rect(58, capH, 6, FH, SHD, 0, .3), line(`M63.2 ${capH}V64`, INKT, 1.8, .8));
    }
    t.add('</g>');
    if (nw) t.add(line(`M0 ${K}H${K}V0`, INKT, 1.4, .8), rect(K, 0, 2, K, '#fff', 0, .4));
    if (ne) t.add(line(`M${64 - K} 0V${K}H64`, INKT, 1.4, .8), rect(64 - K - 3, 0, 3, K, SHD, 0, .25));
    outT(t, 'edges', name, pad3(m), ['autotile', 'blob47', 'mask:' + m, '3/4-view', 'wall', 'interior', 'obstacle', ...tags]);
  }
}
wallBlob('hall-wall', 'paint', 9100, ['painted', 'hieroglyph']);
wallBlob('tomb-wall', 'rough', 9200, ['ashlar', 'pylon']);
// avenue-paving: flush sandstone slab patch on the sand, with a lit kerb
blobSet('avenue-paving', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 22, tags: ['paving', 'avenue', 'floor'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(sandBase(), stroke(G.d, '#8a6240', 13, .2), stroke(G.d, '#a98050', 8, .3), stroke(G.d, '#fff3cf', 4, .6, -.4, -.4));
    t.add(`<g clip-path="${clip}">`, avenueBase(829), sides(G, ['#7a5448', .22], ['#fff6dc', .4], 9, 5), stroke(G.d, '#a98050', 8, .2), '</g>');
    t.add(stroke(G.d, '#7a5238', 1.1, .65));
  },
});
// sand-drift: a wind-sculpted drift lying over the hall floor, crest lit, lee side in violet shade
blobSet('sand-drift', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 26, tags: ['sand', 'drift', 'floor'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(hallBase(), `<path d="${G.d}" transform="translate(2 3)" fill="${SHD}" opacity=".2"/>`);
    t.add(`<g clip-path="${clip}">`, sandBaseT(), sides(G, ['#a07848', .3], ['#fffbe8', .55], 11, 6), stroke(G.d, '#fff6d8', 4, .5, -1, -1), '</g>');
    t.add(stroke(G.d, '#c9a468', 1, .75));
  },
});

// ---------------- connect-4 (N1 E2 S4 W8) ----------------
// thin free-standing walls in 3/4 view: a cap (top surface), and a painted or rough face on the exposed south sides
function wall4(name, { cd = 8, fh = 20, hw = 7, kind = 'paint', cy = 40, seed = 9300, tags = [] }) {
  for (let m = 0; m < 16; m++) {
    const v = String(m).padStart(2, '0'), t = mkT('fences', name, v), cx = 32, X0 = (m & 8) ? 0 : cx - hw, X1 = (m & 2) ? 64 : cx + hw, top = cy - cd - 6, fy0 = cy - 6;
    const cap = (x, y, w, hh) => rect(x, y, w, hh, t.lg(['#fff0c4', '#f0d098', '#e0b87e'], 60), 0, 1);
    t.add(path(`M${X0 + 3} ${fy0 + fh}H${X1 + 4}V${fy0 + fh + 3}H${X0 + 3}Z`, SHD, .26));
    if (m & 1) t.add(cap(cx - hw, 0, hw * 2, top + 1), line(`M${cx - hw} 0V${top}M${cx + hw} 0V${top}`, INKT, 1.2, .8), rect(cx - hw, 0, 2, top, '#fff', 0, .4), rect(cx + hw - 3, 0, 3, top, '#b8864e', 0, .4));
    t.add(cap(X0, top, X1 - X0, cd), rect(X0, top + cd - 1.4, X1 - X0, 1.4, '#fff', 0, .5), line(`M${X0} ${top}H${X1}`, INKT, 1.2, .8));
    t.add(wallFace(t, X0, X1, top + cd, top + cd + fh, kind, seed + m), line(`M${X0} ${top + cd}H${X1}`, INKT, 1.2, .85));
    if (!(m & 8)) t.add(line(`M${X0} ${top}V${top + cd + fh}`, INKT, 1.3, .85), rect(X0, top + cd, 2.4, fh, '#fff', 0, .3));
    if (!(m & 2)) t.add(line(`M${X1} ${top}V${top + cd + fh}`, INKT, 1.3, .85), rect(X1 - 3, top + cd, 3, fh, SHD, 0, .3));
    t.add(line(`M${X0} ${top + cd + fh}H${X1}`, INKT, 1, .6));
    if (m & 4) t.add(cap(cx - hw, top, hw * 2, 64 - top), line(`M${cx - hw} ${top}V64M${cx + hw} ${top}V64`, INKT, 1.2, .8), rect(cx - hw, top, 2, 64 - top, '#fff', 0, .4), rect(cx + hw - 3, top, 3, 64 - top, '#b8864e', 0, .4), line(`M${cx - hw} ${top}H${cx + hw}`, 'none', 1, 0));
    outT(t, 'fences', name, v, ['autotile', 'connect4', 'mask:' + m, '3/4-view', 'wall', 'obstacle', ...tags]);
  }
}
wall4('wall-hieroglyph', { cd: 8, fh: 22, hw: 7, kind: 'paint', cy: 42, seed: 9300, tags: ['painted', 'interior', 'hieroglyph'] });
wall4('wall-sandstone-low', { cd: 6, fh: 12, hw: 6, kind: 'rough', cy: 42, seed: 9400, tags: ['rough', 'low', 'ruined'] });
// colonnade: papyrus columns joined by a painted architrave; N/S arms are a low stylobate step
for (let m = 0; m < 16; m++) {
  const v = String(m).padStart(2, '0'), t = mkT('fences', 'colonnade', v), cx = 32, by = 58, shh = 30, capY = by - 9 - shh;
  t.add(ell(cx + 4, by + 1, 26, 4, SHD, .2));
  if (m & 5) t.add(rect(cx - 12, 0, 24, 64, 'none', 0, 0)), t.add(rect(cx - 11, m & 1 ? 0 : by - 5, 22, (m & 1 ? by : 64) - (m & 1 ? 0 : by - 5) + (m & 4 ? 64 - by : 0), t.lg(['#fbe8b8', '#ecc890', '#c89a62'], 0), 0, 1, ik(.8)));
  for (const [a, b, c, d] of arms(m, cx, by)) if (b === d) t.add(rect(Math.min(a, c), by - 6, Math.abs(c - a), 6, t.lg(STN, 90), 0, 1, ik(.8)));
  for (const [a, b, c, d] of arms(m, cx, capY + 3)) if (b === d) { const x0 = Math.min(a, c), x1 = Math.max(a, c); t.add(rect(x0, capY - 6, x1 - x0, 11, t.lg(['#f6dcaa', '#e0b27e', '#b8864e'], 90), 0, 1, ik(.9)), frieze(x0, capY - 4, x1 - x0, 4, 'checker', [LAP, RED]).replace(/<rect[^>]*stroke[^>]*\/>/, ''), line(`M${x0} ${capY - 6}H${x1}`, '#fff', 1, .55), rect(x0, capY + 1.5, x1 - x0, 3.5, SHD, 0, .22)); }
  t.add(column(t, cx, by, shh, 'bud', 8));
  outT(t, 'fences', 'colonnade', v, ['autotile', 'connect4', 'mask:' + m, '3/4-view', 'columns', 'interior', 'obstacle']);
}
