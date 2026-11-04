// Bamboo Valley (greenvale/bamboo-valley): ground, stream water, decals, groves + stream autotiles, fences. Objects: gen-bamboo-objects.mjs.
import { T, P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, FAM, skeleton, inShape, blobSet, maker, bloom, scat, C4, SUBS, leafS, fronds, BIT } from './sub.mjs';
import { interior, crowns, waterFill } from './ground.mjs';
import { wrapped } from './lib.mjs';
import { BAM, blade, spray, culm, bambooCrown, bambooLeaves } from './bamboo-lib.mjs';
import { pebbleWater, koi, ripple, ring, stoneW, pebbleSmall, WMG, WR } from './water-lib.mjs';

const SUB = SUBS.bamboo, { mk, out } = maker(SUB);
const FL = FAM.floor, GR = FAM.grass, SH = FAM.shallow;
const LCOL = ['#d8c460', '#c9b050', '#b8c070', '#a8c868'];
const litter = (r, n, cols = LCOL, pad = 9, gap = 8) => scat(r, n, pad, gap).map(([x, y]) => bambooLeaves(x, y, r.range(0, 360), r.pick(cols), r.range(.8, 1.1))).join('');
const pebs = (r, n, pad = 10, gap = 10) => scat(r, n, pad, gap).map(([x, y]) => pebbleSmall(x, y, r.range(.8, 1.3), r.int(0, 3))).join('');
const shoot = (x, y, s = 1, tall = 1) => ell(x + 1, y + 1.2, 4 * s, 1.3 * s, '#3b3a24', .16) + path(`M${f(x - 2.2 * s)} ${f(y)}Q${f(x - 2 * s)} ${f(y - 7 * s * tall)} ${f(x + .3)} ${f(y - 11 * s * tall)}Q${f(x + 2.4 * s)} ${f(y - 6 * s * tall)} ${f(x + 2.4 * s)} ${f(y)}Z`, '#c9a86a', 1, ink('#6b4a2c', .6, .75))
  + path(`M${f(x - 2.2 * s)} ${f(y - 3 * s)}Q${f(x)} ${f(y - 4.4 * s)} ${f(x + 2.4 * s)} ${f(y - 3 * s)}`, 'none', 1, { fill: 'none', stroke: '#6b4a2c', 'stroke-width': .6, 'stroke-opacity': .7 }) + path(`M${f(x - 1.5 * s)} ${f(y - 7 * s * tall)}Q${f(x)} ${f(y - 8.4 * s * tall)} ${f(x + 1)} ${f(y - 10 * s * tall)}`, 'none', 1, { fill: 'none', stroke: '#8ac060', 'stroke-width': 1.4, 'stroke-opacity': .9 }) + ell(x - .8 * s, y - 5 * s * tall, .7 * s, 2.4 * s, '#fff', .35);

// ======================= ground (grass + floor skeleton, safe-zone interior) =======================
const G1 = {
  'grass-bamboo': { a: (r) => interior(GR, 3011, { n: 3, cols: ['#bcd98d', '#cfe1a0'], tufts: 2 }) + litter(r, 6), b: (r) => interior(GR, 3012, { n: 4, cols: ['#b3d283', '#bcd98d'], tufts: 3 }) + litter(r, 4, ['#9ccf70', '#b0d878']), c: (r) => interior(GR, 3013, { n: 3, cols: ['#cfe1a0', '#dfe8ae'], tufts: 2 }) + litter(r, 9, LCOL, 8, 6) },
  'floor-bamboo': { a: (r) => interior(FL, 3021, { n: 3, cols: ['#a8b86a', '#9bbd78'], tufts: 1 }) + litter(r, 9, LCOL, 8, 7), b: (r) => interior(FL, 3022, { n: 4, cols: ['#8fb26c', '#a8c884'], tufts: 2 }) + litter(r, 5, ['#d8c460', '#9ccf70']), c: (r) => interior(FL, 3023, { n: 3, cols: ['#b8c070', '#7ea45f'], tufts: 1 }) + litter(r, 12, ['#d8c460', '#c9b050', '#e0cc70'], 8, 5) },
};
for (const [name, vars] of Object.entries(G1)) for (const [v, fn] of Object.entries(vars)) { const t = mk('ground', name, v); t.add(skeleton(name.startsWith('grass') ? GR : FL), fn(rng(hash(name + v)))); out(t, 'ground', name, v, ['seamless', 'ground', name.startsWith('grass') ? 'grass' : 'forest-floor']); }

// stream water (shallow skeleton + clear-water interior). Flow runs west to east. Every streak stays inside [3,61].
const streaks = (r, n, op = .7, w0 = 9, w1 = 15) => { let o = ''; for (let i = 0; i < n; i++) { const w = r.range(w0, w1), x = r.range(4 + w / 2, 60 - w / 2), y = r.range(8, 56); o += line(`M${f(x - w / 2)} ${f(y)}q${f(w / 4)}-1.6 ${f(w / 2)} 0t${f(w / 2)} 0`, '#fff', 1.1, op); } return o; };
const foamBits = (r, n) => { let o = ''; for (let i = 0; i < n; i++) o += ell(r.range(10, 54), r.range(10, 54), r.range(2, 5), r.range(.7, 1.2), '#fff', r.range(.5, .85), r.range(-10, 10)); return o; };
const bed = (r, n) => scat(r, n, 10, 11).map(([x, y]) => ell(x, y, r.range(2, 3.6), r.range(1.4, 2.4), r.pick(['#8fa89a', '#9aa89a', '#b8b49a', '#7f9aa0']), .55)).join('');
const G2 = {
  'stream-water': { a: (r) => streaks(r, 6), b: (r) => streaks(r, 8, .6), c: (r) => streaks(r, 5, .8, 12, 18), d: (r) => streaks(r, 7) + foamBits(r, 2) },
  'stream-stones': { a: (r) => bed(r, 6) + streaks(r, 3) + stoneW(24, 30, 1) + stoneW(42, 40, .8), b: (r) => bed(r, 4) + streaks(r, 3) + stoneW(36, 24, 1.1) + stoneW(20, 42, .7) + stoneW(46, 46, .6) },
  'stream-rapids': { a: (r) => streaks(r, 9, .85, 8, 14) + foamBits(r, 7) + stoneW(32, 30, .9), b: (r) => streaks(r, 10, .8, 7, 13) + foamBits(r, 9) },
};
for (const [name, vars] of Object.entries(G2)) for (const [v, fn] of Object.entries(vars)) { const sd = hash(name + v) % 90000 + 10; const t = mk('ground', name, v); t.add(waterFill('shallow', sd), fn(rng(sd))); out(t, 'ground', name, v, ['seamless', 'ground', 'water', 'stream', 'flow-east']); }
// ground-detail: stream bed with fish / leaves / pebbles; land with shoots, litter, stones
const GD = {
  'stream-koi': { a: (r) => bed(r, 3) + koi(26, 26, -8, 1, 'kohaku') + koi(42, 40, 10, .85, 'gold'), b: (r) => koi(30, 32, 4, 1.05, 'ogon') + koi(44, 22, -14, .8, 'shiro') + koi(20, 44, 20, .75, 'kohaku'), c: (r) => bed(r, 3) + koi(34, 30, -4, 1.1, 'shiro') + koi(22, 42, 8, .8, 'ogon') },
  'stream-leaves': { a: (r) => streaks(r, 4) + scat(r, 6, 11, 10).map(([x, y]) => bambooLeaves(x, y, r.range(-20, 20), r.pick(LCOL), 1.1)).join(''), b: (r) => streaks(r, 3) + scat(r, 4, 12, 12).map(([x, y]) => bambooLeaves(x, y, r.range(-30, 30), '#9ccf70', 1.2) + ripple(x + 6, y + 3, 7, '#fff', .5, .9)).join('') },
  'stream-pebbles': { a: (r) => pebs(r, 9, 9, 9) + streaks(r, 3), b: (r) => pebs(r, 7, 10, 11) + streaks(r, 4, .6) },
};
for (const [name, vars] of Object.entries(GD)) for (const [v, fn] of Object.entries(vars)) { const sd = hash(name + v) % 90000 + 10; const t = mk('ground-detail', name, v); t.add(waterFill('shallow', sd), fn(rng(sd))); out(t, 'ground-detail', name, v, ['seamless', 'ground', 'water', 'stream', 'decal-baked']); }
const GL = {
  'bamboo-litter': { a: (r) => litter(r, 12, LCOL, 9, 5), b: (r) => litter(r, 10, ['#d8c460', '#9ccf70', '#c9b050'], 9, 6) },
  'bamboo-shoots': { a: (r) => scat(r, 5, 13, 12).map(([x, y]) => shoot(x, y + 5, r.range(.8, 1.1))).join(''), b: (r) => scat(r, 4, 14, 15).map(([x, y], i) => shoot(x, y + 5, 1.1, i % 2 ? 1 : .7)).join('') + litter(r, 3), c: (r) => scat(r, 7, 12, 10).map(([x, y]) => shoot(x, y + 4, .8, .8)).join('') },
  'moss-stones': { a: (r) => scat(r, 5, 11, 12).map(([x, y]) => ell(x + 1, y + 1.6, 5, 1.8, '#3b3a24', .16) + ell(x, y, 4.4, 3, '#a2a596', 1, 0, ink(P.inkR, .6, .6)) + ell(x - 1.2, y - 1, 2.2, 1.2, '#cfd0c4', .9) + ell(x - .6, y - 2, 3.4, 1.4, '#7fae5e', .95)).join(''), b: (r) => pebs(r, 9, 9, 8) },
  'sasa-grass': { a: (r) => scat(r, 4, 14, 14).map(([x, y]) => fronds(x, y + 6, 6, 10, ['#6fb560', '#8cc860', '#4a9a50'], 2)).join(''), b: (r) => scat(r, 6, 12, 11).map(([x, y]) => fronds(x, y + 5, 4, 8, ['#8cc860', '#a8d880', '#6fb560'], 1.7)).join('') },
};
for (const [name, vars] of Object.entries(GL)) for (const [v, fn] of Object.entries(vars)) { const t = mk('ground-detail', name, v), onFloor = name !== 'sasa-grass'; t.add(skeleton(onFloor ? GR : GR), interior(GR, 3100 + hash(name + v) % 900, { n: 3, tufts: 1 }), fn(rng(hash(name + v)))); out(t, 'ground-detail', name, v, ['seamless', 'ground', 'grass', 'decal-baked']); }

// ======================= decals =======================
const decal = (name, v, fn) => { const t = mk('decals', name, v); fn(t, rng(hash(name + v))); out(t, 'decals', name, v, ['overlay', 'decal', 'transparent']); };
for (const v of ['a', 'b', 'c', 'd']) decal('leaf-fall', v, (t, r) => { const n = 6 + r.int(0, 8); for (let i = 0; i < n; i++) { const a = r.range(0, 6.28), d = Math.sqrt(r()) * 18; t.add(bambooLeaves(32 + Math.cos(a) * d, 36 + Math.sin(a) * d * .55, r.range(0, 360), r.pick(LCOL), r.range(.9, 1.2))); } });
for (const v of ['a', 'b']) decal('shoots', v, (t, r) => { for (const [x, y] of scat(r, v === 'a' ? 3 : 5, 16, 12)) t.add(shoot(x, y + 5, r.range(.85, 1.1), r.range(.7, 1.1))); });
for (const v of ['a', 'b']) decal('fallen-culm', v, (t, r) => { const y = v === 'a' ? 38 : 34, a = v === 'a' ? 4 : -6; t.add(ell(32, y + 4, 26, 2.6, '#3b3a24', .15)); t.add(`<g transform="rotate(${a} 32 ${y})">`, rect(6, y - 3, 52, 6, t.lg([BAM.green.culm[0], BAM.green.culm[1], BAM.green.culm[2]], 90), 3, 1, ink('#1d4a26', .8, .75)), rect(9, y - 2, 46, 1.2, '#fff', .6, .35)); for (const x of [18, 32, 47]) t.add(rect(x - 1, y - 3, 2, 6, BAM.green.node, 0, .8)); t.add(spray(r, 52, y, 5, 8, BAM.green, { dir: -20, sp: 40, wd: 1.8 }), '</g>'); });
for (const v of ['a', 'b', 'c']) decal('pebbles-bank', v, (t, r) => { for (const [x, y] of scat(r, 7 + v.charCodeAt(0) % 3, 12, 8)) t.add(pebbleSmall(x, y, r.range(.8, 1.4), r.int(0, 3))); });
for (const [v, kinds] of [['a', ['kohaku']], ['b', ['gold']], ['c', ['shiro']], ['d', ['ogon', 'kohaku']]]) decal('koi', v, (t) => { kinds.forEach((k, i) => t.add(koi(32 - i * 8, 32 + i * 10, -12 + i * 40, 1.3 - i * .2, k))); });
for (const v of ['a', 'b', 'c']) decal('ripple-rings', v, (t, r) => { for (const [x, y] of scat(r, 2 + (v === 'c' ? 1 : 0), 18, 20)) { t.add(ring(x, y, 12, '#fff', .8), ring(x, y, 7, '#fff', .8), ring(x, y, 3, '#fff', .9)); } });
for (const v of ['a', 'b']) decal('floating-leaves', v, (t, r) => { for (const [x, y] of scat(r, 4, 14, 14)) t.add(ell(x + 1, y + 2, 7, 1.4, '#1d4a63', .12), bambooLeaves(x, y, r.range(-25, 25), r.pick(['#9ccf70', '#d8c460']), 1.3), ripple(x + 7, y + 2, 8, '#fff', .6, .9)); });
for (const v of ['a', 'b']) decal('foam-line', v, (t, r) => { for (let i = 0; i < 6; i++) t.add(ell(r.range(8, 56), v === 'a' ? 32 + r.range(-3, 3) : r.range(12, 52), r.range(3, 7), r.range(.8, 1.4), '#fff', r.range(.6, .9), r.range(-12, 12))); });

// ======================= edges (47 blob each) =======================
const GROVE_PAL = { green: [BAM.green, BAM.young, BAM.green, BAM.golden], golden: [BAM.goldtop, BAM.green, BAM.goldtop, BAM.young], thicket: [BAM.black, BAM.green, BAM.black, BAM.golden] };
const groveEdge = (name, pal, onGrass, tags, shade = .34) => blobSet(SUB, name, {
  mg: { n: 4, e: 4, s: 4, w: 4 }, R: 24, tags: ['forest', 'tree-line', 'bamboo', ...tags],
  build(t, G) {
    const clip = t.clip(G.d), id = clip.slice(5, -1), r = rng(hash('bamshade'));
    t.add(skeleton(onGrass ? GR : FL));
    t.add(path(G.d, 'none', 1, { stroke: '#2f5a34', 'stroke-width': 9, 'stroke-opacity': onGrass ? .16 : .24, 'stroke-linejoin': 'round' }));
    let sh = ''; for (let i = 0; i < 8; i++) { const x = r.range(0, T), y = r.range(0, T), rx = r.range(10, 18); sh += wrapped(x, y, rx, (a, b) => ell(a, b, rx, rx * .7, '#2f5a34', shade, r.range(0, 180))); }
    const lr = rng(hash('bamlitter')); let lt = ''; for (let i = 0; i < 5; i++) lt += wrapped(lr.range(0, T), lr.range(0, T), 9, (a, b) => bambooLeaves(a, b, lr.range(0, 360), '#d8c460', 1));
    t.add(`<g clip-path="url(#${id})">`, skeleton(FL), sh, lt, '</g>');
    crowns(t, G, { pal, tag: 'bam' + name, draw: bambooCrown });
  },
});
groveEdge('bamboo-grove', GROVE_PAL.green, true, ['grass-to-forest', 'green']);
groveEdge('bamboo-grove-golden', GROVE_PAL.golden, true, ['grass-to-forest', 'golden']);
groveEdge('bamboo-thicket', GROVE_PAL.thicket, false, ['inside-grove', 'black', 'dark'], .4);
// stream: clear shallow water between pebbly grass banks, flowing east. Same outline as the lake shore (mg 9, R 22) so it can feed the lake.
blobSet(SUB, 'stream', { mg: { n: WMG, e: WMG, s: WMG, w: WMG }, R: WR, tags: ['water', 'stream', 'flow-east', 'shore'], build: (t, G, m) => pebbleWater(t, G, m, { kind: 'stream' }) });
blobSet(SUB, 'stream-mouth', { mg: { n: WMG, e: WMG, s: WMG, w: WMG }, R: WR, tags: ['water', 'stream', 'lake', 'blend', 'transition', 'flow-east', 'shore'], build: (t, G, m) => pebbleWater(t, G, m, { kind: 'mouth' }) });

// ======================= fences / hedge (16 connect-4 pieces) =======================
function connectSet(name, draw, tags = []) { for (let m = 0; m < 16; m++) { const t = mk('fences', name, String(m).padStart(2, '0')); draw(t, m); out(t, 'fences', name, String(m).padStart(2, '0'), ['autotile', 'connect4', 'mask:' + m, 'obstacle', ...tags]); } }
const armX = (m) => [m & C4.W ? 0 : 32, m & C4.E ? 64 : 32];
const rope = (x, y, h = 5) => rect(x - 1.8, y, 3.6, h, '#a88a4a', 1, 1, ink('#6b5a28', .4, .6)) + line(`M${f(x - 1.8)} ${f(y + 1.5)}l3.6 1.2M${f(x - 1.8)} ${f(y + 3)}l3.6 1.2`, '#f2e4b4', .6, .8);
connectSet('fence-bamboo', (t, m) => {
  const [x0, x1] = armX(m), by = 48, cx = 32, pal = BAM.green, ry = [30, 39];
  t.add(ell(cx + 2, by + 3, 7, 2.4, '#3b3a24', .22)); if (x1 > x0) t.add(rect(x0 + 1, by + 1.5, x1 - x0, 2.6, '#3b3a24', 1.3, .17));
  if (m & C4.N) t.add(culm(t, cx, by - 2, 0, 5, pal, { seg: 9, inkOp: .7 }));
  if (x1 > x0) {
    for (const sx of [16, 48]) if (sx > x0 && sx < x1) t.add(culm(t, sx, by + 1, 20, 3.8, pal, { seg: 9, inkOp: .7 }));
    for (const y of ry) { t.add(rect(x0, y - 2.6, x1 - x0, 5.2, t.lg([pal.culm[0], pal.culm[1], pal.culm[2]], 90), 2.6, 1, ink(pal.inkc, .8, .75)), rect(x0 + 1, y - 1.6, x1 - x0 - 2, 1.1, '#fff', .5, .4)); for (const nx of [8, 24, 40, 56]) if (nx > x0 + 2 && nx < x1 - 2) t.add(rect(nx - .6, y - 2.6, 1.2, 5.2, pal.node, 0, .6)); }
  }
  t.add(culm(t, cx, by + 1, 14, 5.4, pal, { seg: 9 }), ell(cx, 14.5, 2.5, 1.2, '#3f7030', 1), ell(cx - .6, 14, 1, .5, '#e8f4c8', .8));
  for (const y of ry) t.add(rope(cx, y - 3, 6));
  if (m & C4.S) t.add(culm(t, cx, 64, by - 1, 5, pal, { seg: 9, inkOp: .7 }), rect(cx - 2.5, 60, 5, 4, '#3b3a24', 0, .12));
  t.add(tuft(cx + 10, by + 2, '#4d7a40', .8, .6), tuft(cx - 9, by + 3, '#5f9a48', .7, .5));
}, ['bamboo']);
connectSet('fence-bamboo-screen', (t, m) => {   // sudare-like screen: split bamboo slats between posts, lashed top and bottom
  const [x0, x1] = armX(m), by = 48, cx = 32, pal = BAM.golden, top = 22, g = t.lg(['#f6e8a0', '#e0bc4e', '#b98c2c'], 0);
  t.add(ell(cx + 2, by + 3, 8, 2.6, '#3b3a24', .22)); if (x1 > x0) t.add(rect(x0 + 1, by + 1.5, x1 - x0, 2.6, '#3b3a24', 1.3, .17));
  if (m & C4.N) t.add(culm(t, cx, by - 2, 0, 5, pal, { seg: 9, inkOp: .7 }));
  if (x1 > x0) {
    t.add(rect(x0, top, x1 - x0, by - top, g, 0, 1), rect(x0, top, x1 - x0, 1, pal.inkc, 0, .5), rect(x0, by - 1, x1 - x0, 1.2, pal.inkc, 0, .6));
    for (let x = Math.ceil(x0 / 3.2) * 3.2; x < x1; x += 3.2) t.add(rect(x - .35, top + 1, .7, by - top - 2, '#8a6420', 0, .4));
    for (const y of [top + 4, by - 6]) t.add(rect(x0, y - 1.3, x1 - x0, 2.6, '#8a6a44', 1.3, 1, ink('#4a3220', .5, .6)), rect(x0, y - 1, x1 - x0, .7, '#e2c892', 0, .5));
    t.add(rect(x0, top - 3, x1 - x0, 3.4, t.lg([pal.culm[0], pal.culm[2]], 90), 1.7, 1, ink(pal.inkc, .7, .7)));
  }
  t.add(culm(t, cx, by + 1, top - 7, 5.6, pal, { seg: 9 }), ell(cx, top - 7.4, 2.5, 1.2, '#8a6420', 1));
  if (m & C4.S) t.add(culm(t, cx, 64, by - 1, 5, pal, { seg: 9, inkOp: .7 }), rect(cx - 2.5, 60, 5, 4, '#3b3a24', 0, .12));
  t.add(tuft(cx + 11, by + 2, '#4d7a40', .8, .6));
}, ['bamboo', 'screen']);
connectSet('hedge-sasa', (t, m) => {   // low hedge of dwarf bamboo grass
  const cx = 32, cy = 40, rg = t.rg(['#a8dc80', '#6fb560', '#3f8048'], .35, .3, .9), arm = (dx, dy) => path(`M${cx} ${cy - 8}L${cx + dx * 32} ${cy + dy * 32 - 8}L${cx + dx * 32} ${cy + dy * 32 + 8}L${cx} ${cy + 8}Z`, rg, 1, ink(P.inkG, .8, .55));
  t.add(ell(cx + 2, cy + 12, 17, 4.2, '#3b3a24', .18));
  const r = rng(hash('sasa' + m)), arms = [[m & C4.N, 0, -1], [m & C4.E, 1, 0], [m & C4.S, 0, 1], [m & C4.W, -1, 0]];
  for (const [on, dx, dy] of arms) if (on) { t.add(path(`M${cx - (dy ? 12 : 0)} ${cy - (dx ? 12 : 0)}L${cx + dx * 32 - (dy ? 12 : 0)} ${cy + dy * 32 - (dx ? 12 : 0)}L${cx + dx * 32 + (dy ? 12 : 0)} ${cy + dy * 32 + (dx ? 12 : 0)}L${cx + (dy ? 12 : 0)} ${cy + (dx ? 12 : 0)}Z`, rg, 1)); }
  t.add(circ(cx, cy, 14, rg, 1, ink(P.inkG, .9, .65)));
  for (const [on, dx, dy] of arms) if (on) for (let k = 0; k < 4; k++) { const d = (k + .5) * 8; t.add(circ(cx + dx * d + (dy ? r.range(-6, 6) : 0), cy + dy * d + (dx ? r.range(-5, 5) : 0) - 2, 7, rg, 1)); }
  for (let i = 0; i < 12; i++) { const a = r.range(0, 6.28), d = r.range(0, 11); t.add(blade(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .8, r.range(-130, -50), r.range(7, 11), 1.6, r.pick(['#a8e496', '#7cc468', '#5fae5c']), '#1d4a26', .35)); }
  t.add(ell(cx - 5, cy - 7, 6, 3, '#d8f4b8', .45, -20));
}, ['bamboo', 'hedge']);

await import('./gen-bamboo-objects.mjs');
