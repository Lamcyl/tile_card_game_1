// Ashkara sub-area 8: Sun Citadel (ashkara/sun-citadel). Ground and ground-detail (pale gold sand, fused glass sand, scorched earth, cinders, black basalt, obsidian slabs, gold court flags,
// polished mirror floor, inlays), ramps into the common ground and the neighbours (Red Wadi to the south, Tomb Approach to the west), four 47-blob autotile sets (gold citadel wall and basalt wall
// in 3/4 view, obsidian slab patch, fused glass pool) and two connect-4 sets (gold parapet, mirror screen).
// Objects: ...-objects.mjs; landmark/gate/structures: ...-interest.mjs; decals + overlays: ...-decals.mjs. Every file runs on its own (helpers in sun-citadel-lib.mjs).
import { T, rng, f, ell, circ, rect, path, line, ink, FAMS, dskel, dint, speckle, ripples, crackNet, slabLines, pebbleD, mix, ramp, GOLD, streaks, pts, stroke, sides, arms, BLOBS, pad3, AVE, TERRA, OCHRE, RSAND, WGRV, GM, GD, OB, BS, GL, SKY, FIRE, SHB, INKG, INKO, ikg, iko, GLASS, SCORCH, BAS, OBS, GFL, MIRF, EMBR, goldBase, glassBase, scorchBase, basaltBase, obsBase, courtBase, mirrorBase, emberBase, tile, mkT, outT, blobSet, wallBlob, cFace, cCap, sunDisc, mirrorPanel, glow, flagBase, GLYPH } from './sun-citadel-lib.mjs';

const ground = (cat, name, v, base, fn, tags = []) => tile(cat, name, v, [T, T], ['seamless', cat === 'ground' ? 'ground' : 'ground-detail', ...tags], (t, r) => base() + fn(r, t));
const sp = (r, n, s = [.5, .9], c = '#fffbe8', op = .85) => pts(r, n, 10, 11).map(([x, y]) => circ(x, y, r.range(...s), c, op)).join('');
const shard = (x, y, s, a, c = GL) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">` + path(`M${-5 * s} ${1.5 * s}L${-2 * s} ${-3.5 * s}L${5 * s} ${-1 * s}L${2.4 * s} ${3 * s}Z`, '#1e3a40', .18, { transform: 'translate(1 1.4)' }) + path(`M${-5 * s} ${1.5 * s}L${-2 * s} ${-3.5 * s}L${5 * s} ${-1 * s}L${2.4 * s} ${3 * s}Z`, c[1], .92, ink(c[2], .6, .85)) + path(`M${-2 * s} ${-3.5 * s}L${5 * s} ${-1 * s}L${0} ${0}Z`, c[0], .9) + `</g>`;
// ---------------- ground ----------------
for (const [v, seed] of [['a', 1101], ['b', 1103], ['c', 1105], ['d', 1107]]) ground('ground', 'gold-sand', v, () => goldBase(seed), (r) => dint(GOLD, 20000 + seed, { n: 2 }) + (v === 'b' ? ripples(seed, 3, '#cdb67a', .36, 12, 18) : v === 'c' ? sp(r, 6, [.5, 1], '#fff8d0', .9) : v === 'd' ? streaks(seed, 2, '#fff8d8', .3, 12, 18) : ''), ['sand', 'gold', ...(v === 'c' || v === 'd' ? ['glint'] : [])]);
for (const [v, seed] of [['a', 1111], ['b', 1113], ['c', 1115]]) ground('ground', 'glass-sand', v, () => glassBase(seed), (r) => dint(GLASS, 20100 + seed, { n: 2 }) + (v === 'b' ? sp(r, 5, [.6, 1.1], '#ffffff', .9) : v === 'c' ? line('M10 22l9 3l5 -6M40 44l7 -4l4 5', '#5a8a88', 1, .55) + line('M11 23l9 3', '#fff', .6, .7) : ''), ['glass', 'fused']);
const melt = (seed, n = 2) => { const r = rng(seed); let o = ''; for (let i = 0; i < n; i++) { const x = r.range(16, 48), y = r.range(16, 48), rx = r.range(7, 12); o += ell(x, y, rx, rx * .6, 'none', 1, r.range(0, 90), { stroke: '#6aa6a4', 'stroke-width': 1.1, 'stroke-opacity': .5 }) + ell(x, y, rx * .6, rx * .36, 'none', 1, 0, { stroke: '#fff', 'stroke-width': .8, 'stroke-opacity': .55 }) + ell(x - rx * .3, y - rx * .2, rx * .22, rx * .1, '#fff', .55); } return o; };
for (const [v, seed] of [['a', 1121], ['b', 1123]]) ground('ground', 'glass-fused', v, () => glassBase(seed), (r) => melt(seed, 3) + dint({ ...GLASS, w: ['#c6e0d8', '#e6f6ee', '#b8d6ce', '#f2fbf6'] }, 20200 + seed, { n: 3 }), ['glass', 'fused', 'smooth']);
for (const [v, seed] of [['a', 1131], ['b', 1133], ['c', 1135]]) ground('ground', 'scorched', v, () => scorchBase(seed), (r) => dint(SCORCH, 20300 + seed, { n: 2 }) + (v === 'b' ? streaks(seed, 2, '#2e2420', .22, 12, 18) : v === 'c' ? crackNet(seed, '#3a2e26', .5, .5) : ''), ['scorched', 'burnt']);
const emberDots = (r, n) => pts(r, n, 8, 9).map(([x, y]) => circ(x, y, 2.4, '#ff8a2a', .22) + circ(x, y, 1.1, '#ffb040', .9) + circ(x, y, .5, '#fff0b0', 1)).join('');
for (const [v, seed] of [['a', 1141], ['b', 1143]]) ground('ground', 'cinder', v, () => emberBase(seed), (r) => dint(EMBR, 20400 + seed, { n: 2 }) + (v === 'b' ? emberDots(r, 5) : ''), ['cinder', 'burnt', ...(v === 'b' ? ['embers'] : [])]);
for (const [v, seed] of [['a', 1151], ['b', 1153], ['c', 1155]]) ground('ground', 'basalt', v, () => basaltBase(seed), (r) => dint(BAS, 20500 + seed, { n: 2 }) + (v === 'b' ? sp(r, 5, [.5, .9], '#c4bed2', .6) : v === 'c' ? line('M8 40l12 -4l6 6M44 14l8 5l-3 8', '#d4a548', .9, .6) : ''), ['basalt', 'rock']);
for (const [v, seed] of [['a', 1161], ['b', 1163], ['c', 1165]]) ground('ground', 'obsidian-slab', v, () => obsBase(seed), (r) => dint(OBS, 20600 + seed, { n: 2 }) + (v === 'b' ? line('M10 48L28 30', '#cfc8f4', .9, .35) : v === 'c' ? sp(r, 5, [.5, 1], '#c8c2ec', .7) : ''), ['obsidian', 'paving', 'dark']);
for (const [v, seed] of [['a', 1171], ['b', 1173], ['c', 1175]]) ground('ground', 'court-flag', v, () => courtBase(seed), (r) => dint(GFL, 20700 + seed, { n: 2 }) + (v === 'c' ? sp(r, 4, [.5, .9], '#ffffff', .9) : v === 'b' ? line('M12 14l7 5l-2 8M46 40l6 -4', '#8a6a30', 1, .55) : ''), ['paving', 'court', 'gold']);
for (const [v, seed] of [['a', 1181], ['b', 1183]]) ground('ground', 'court-mirror', v, () => mirrorBase(seed), (r) => dint(MIRF, 20800 + seed, { n: 2 }) + (v === 'b' ? sp(r, 4, [.7, 1.2], '#ffffff', .95) : ''), ['paving', 'court', 'polished', 'glint']);
// court inlay: seamless 4x4 checker of obsidian and gold squares with a small sun in each gold square
function inlay(worn) { let o = dskel(OBS); const S = 16; for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const g = (i + j) % 2; o += rect(i * S + 1, j * S + 1, S - 2, S - 2, g ? GM[1] : '#3c384e', 1, g ? .92 : .9) + (g ? circ(i * S + 8, j * S + 8, 3.2, GM[0], .9) + circ(i * S + 8, j * S + 8, 5.4, 'none', 1, { stroke: GD[2], 'stroke-width': .8, 'stroke-opacity': .7 }) : rect(i * S + 3, j * S + 3, S - 6, S - 6, 'none', 0, 1, { stroke: '#8a84a8', 'stroke-width': .7, 'stroke-opacity': .5 })); } o += line('M0 0H64M0 16H64M0 32H64M0 48H64M0 64H64M0 0V64M16 0V64M32 0V64M48 0V64M64 0V64', INKO, 1.2, .8); return o + (worn ? speckle(1191, 20, ['#fff0c8', '#2c2838'], 1.1, .55) : ''); }
ground('ground', 'court-inlay', 'a', () => inlay(false), () => '', ['floor', 'inlay', 'gold', 'obsidian']);
ground('ground', 'court-inlay', 'b', () => inlay(true), () => '', ['floor', 'inlay', 'worn']);
// gold in ink-blue shade (cast by walls and obelisks)
const SHADE = { key: 'sshade', b: mix(GOLD.b, '#5a68a8', .34), w: GOLD.w.map(c => mix(c, '#5a68a8', .34)), rim: mix(GOLD.rim, '#3a4678', .4), tuft: '#5a5a78' };
for (const [v, seed] of [['a', 1201], ['b', 1203]]) ground('ground', 'gold-shade', v, () => dskel(SHADE) + ripples(seed, 4, '#6a74a8', .3) + speckle(seed + 1, 14, ['#d8dcf0', '#4a5488'], 1, .45), (r) => dint(SHADE, 20900 + seed, { n: 2 }), ['sand', 'shade']);
// ramps: the common ground and Red Wadi (south) into pale gold, Tomb Approach avenue (west) into glass and court, and inner transitions
const rampSets = [
  ['sand-gold-fringe', FAMS.sand, GOLD, 21000, 2], ['dune-gold-fringe', FAMS.dune, GOLD, 21010, 2], ['pan-gold-fringe', FAMS.pan, GOLD, 21020, 1], ['reg-gold-fringe', FAMS.reg, GOLD, 21030, 1],
  ['ochre-gold-fringe', OCHRE, GOLD, 21040, 2], ['rsand-gold-fringe', RSAND, GOLD, 21050, 1], ['wgrv-gold-fringe', WGRV, GOLD, 21060, 1], ['avenue-glass-fringe', AVE, GLASS, 21070, 2], ['avenue-court-fringe', AVE, GFL, 21080, 1],
  ['gold-glass-fringe', GOLD, GLASS, 21090, 2], ['gold-scorched-fringe', GOLD, SCORCH, 21100, 2], ['glass-scorched-fringe', GLASS, SCORCH, 21110, 1], ['scorched-cinder-fringe', SCORCH, EMBR, 21120, 1], ['scorched-basalt-fringe', SCORCH, BAS, 21130, 1],
  ['glass-basalt-fringe', GLASS, BAS, 21140, 1], ['basalt-obsidian-fringe', BAS, OBS, 21150, 1], ['gold-court-fringe', GOLD, GFL, 21160, 1], ['court-mirror-fringe', GFL, MIRF, 21170, 1], ['court-obsidian-fringe', GFL, OBS, 21180, 1], ['gold-shade-fringe', GOLD, SHADE, 21190, 1], ['gold-obsidian-fringe', GOLD, OBS, 21200, 1],
];
for (const [name, from, to, seed, nv] of rampSets) for (const [v, u] of (nv === 2 ? [['a', .35], ['b', .7]] : [['a', .5]])) ground('ground', name, v, () => dskel(ramp(from, to, u)), (r) => dint(ramp(from, to, u), seed + u * 10, { n: 3 }) + pts(r, 2, 12, 16).map(([x, y]) => circ(x, y, .7, '#fff8d8', .6)).join(''), ['ramp', 'blend']);

// ---------------- ground-detail ----------------
ground('ground-detail', 'glass-shards', 'a', () => glassBase(1301), (r) => pts(r, 6, 10, 12).map(([x, y]) => shard(x, y, r.range(.8, 1.3), r.range(0, 180))).join(''), ['glass', 'shards']);
ground('ground-detail', 'glass-shards', 'b', () => goldBase(1303), (r) => pts(r, 4, 12, 15).map(([x, y]) => shard(x, y, r.range(1, 1.5), r.range(0, 180), SKY)).join(''), ['glass', 'shards', 'sand']);
ground('ground-detail', 'fulgurite', 'a', () => goldBase(1305), () => line('M32 30L32 48M32 36L22 46M32 40L42 50M22 46L16 52M42 50L48 56M32 30L24 24', '#d8e8e0', 3.2, .9) + line('M32 30L32 48M32 36L22 46M32 40L42 50', '#fff', 1.2, .9) + circ(32, 30, 4, '#eef8f4', 1, ink('#5a8a88', .8, .8)), ['lightning', 'glass']);
ground('ground-detail', 'melt-pool', 'a', () => scorchBase(1307), () => ell(32, 34, 20, 12, '#2a2220', .3) + ell(32, 33, 17, 9.5, '#bfe8dc', .96, 0, ink('#4a8a88', .9, .8)) + ell(28, 31, 9, 4, '#fff', .55) + ell(38, 36, 6, 2, '#6aa6a4', .4) + circ(44, 28, 1.6, '#fff', .8) + circ(22, 38, 1.1, '#fff', .8), ['glass', 'pool']);
ground('ground-detail', 'glass-bubbles', 'a', () => glassBase(1309), (r) => pts(r, 7, 10, 10).map(([x, y]) => circ(x, y, r.range(1.8, 4), '#f4fff8', .35, ink('#5a9a98', .7, .7)) + circ(x - .8, y - .8, .7, '#fff', .9)).join(''), ['glass', 'bubbles']);
ground('ground-detail', 'scorch-mark', 'a', () => goldBase(1311), (r) => ell(32, 34, 22, 15, '#2a2018', .26, 20) + ell(32, 34, 15, 9, '#1a1410', .34, 20) + pts(r, 10, 8, 8).map(([x, y]) => circ(x, y, r.range(.6, 1.2), '#2a2018', .6)).join(''), ['scorch', 'burnt']);
ground('ground-detail', 'scorch-mark', 'b', () => scorchBase(1313), () => ell(30, 36, 16, 10, '#14100c', .4, -20) + line('M32 36L52 24M30 36L10 46M32 34L40 12', '#14100c', 2.4, .5), ['scorch', 'burnt', 'blast']);
ground('ground-detail', 'ember-scatter', 'a', () => emberBase(1315), (r) => emberDots(r, 8), ['embers', 'fire']);
ground('ground-detail', 'gold-flakes', 'a', () => goldBase(1317), (r) => pts(r, 9, 8, 8).map(([x, y]) => path(`M${f(x - 2)} ${f(y)}L${f(x)} ${f(y - 1.8)}L${f(x + 2.2)} ${f(y + .4)}L${f(x)} ${f(y + 1.6)}Z`, GM[1], 1, ink(GD[2], .4, .8))).join(''), ['gold', 'loot']);
ground('ground-detail', 'gold-flakes', 'b', () => basaltBase(1319), (r) => pts(r, 7, 8, 9).map(([x, y]) => circ(x, y, r.range(1, 1.8), GM[1], 1, ink(GD[2], .5, .85)) + circ(x - .4, y - .4, .5, '#fff', .9)).join(''), ['gold', 'coins', 'loot']);
ground('ground-detail', 'obsidian-chips', 'a', () => basaltBase(1321), (r) => pts(r, 6, 10, 12).map(([x, y]) => shard(x, y, r.range(.7, 1.2), r.range(0, 180), OB)).join(''), ['obsidian', 'shards']);
ground('ground-detail', 'obsidian-chips', 'b', () => goldBase(1323), (r) => pts(r, 5, 10, 13).map(([x, y]) => shard(x, y, r.range(.9, 1.4), r.range(0, 180), OB)).join(''), ['obsidian', 'shards']);
ground('ground-detail', 'ash-drift', 'a', () => scorchBase(1325), () => ell(26, 36, 18, 6, '#ece6dc', .8, -14) + ell(40, 26, 12, 4, '#f6f2ea', .8, 10) + ell(24, 34, 8, 2.4, '#fff', .5) + ell(46, 44, 10, 3, '#d8d0c4', .7), ['ash']);
ground('ground-detail', 'char-bones', 'a', () => scorchBase(1327), (r) => pts(r, 4, 12, 14).map(([x, y]) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${r.range(0, 180).toFixed(0)})">` + ell(1.2, 2.2, 5, 1.8, '#1a1410', .2) + line('M-4 0H4', '#3a3028', 3) + circ(-4, 0, 2, '#4a4036') + circ(4, 0, 2, '#4a4036') + `</g>`).join(''), ['bones', 'burnt']);
ground('ground-detail', 'cinder-pebbles', 'a', () => emberBase(1329), (r) => pts(r, 7, 10, 9).map(([x, y]) => pebbleD(x, y, r.range(.7, 1.1), ['#7a6a60', '#4a3e38', '#2a2420'])).join(''), ['pebbles', 'cinder']);
ground('ground-detail', 'basalt-pebbles', 'a', () => goldBase(1331), (r) => pts(r, 7, 10, 9).map(([x, y]) => pebbleD(x, y, r.range(.7, 1.2), ['#aaa4b8', '#5c5870', '#2c2838'])).join(''), ['pebbles', 'basalt']);
ground('ground-detail', 'mirror-shards', 'a', () => mirrorBase(1333), (r) => pts(r, 5, 10, 12).map(([x, y]) => shard(x, y, r.range(.9, 1.4), r.range(0, 180), SKY)).join(''), ['mirror', 'shards', 'glint']);
ground('ground-detail', 'sun-disc-inlay', 'a', () => courtBase(1335), () => circ(32, 32, 20, '#fff8dc', .9, ink(GD[1], 1.4, .8)) + sunDisc({ rg: (s, a, b, c) => 'url(#sdx)', lg: () => GM[1] }, 32, 32, 9, 16, .6).replace(/url\(#sdx\)/g, GM[1]), ['inlay', 'sun', 'gold']);
ground('ground-detail', 'sun-rays-inlay', 'a', () => courtBase(1337), () => { let o = ''; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; o += path(`M32 32L${f(32 + Math.cos(a - .08) * 30)} ${f(32 + Math.sin(a - .08) * 30)}L${f(32 + Math.cos(a + .08) * 30)} ${f(32 + Math.sin(a + .08) * 30)}Z`, i % 2 ? GM[1] : '#3c384e', .85); } return o + circ(32, 32, 7, GM[0], 1, ink(GD[2], 1, .9)) + circ(32, 32, 3, '#fff', .9); }, ['inlay', 'sun', 'rays']);
ground('ground-detail', 'rune-ring', 'a', () => obsBase(1339), () => circ(32, 32, 22, 'none', 1, { stroke: GM[1], 'stroke-width': 2, 'stroke-opacity': .9 }) + circ(32, 32, 15, 'none', 1, { stroke: GM[1], 'stroke-width': 1, 'stroke-opacity': .8 }) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4; return GLYPH[['sun', 'eye', 'ankh', 'wave'][i % 4]](32 + Math.cos(a) * 18.6, 32 + Math.sin(a) * 18.6, GM[0], .8); }).join(''), ['inlay', 'ring', 'gold']);
ground('ground-detail', 'heat-cracks', 'a', () => goldBase(1341), () => line('M6 20l10 4l4 10l12 4l8 -6l14 4', '#7a5a2a', 1.4, .6) + line('M7 21l10 4l4 10', '#fff8d8', .6, .7) + line('M32 38l-4 12l6 8M44 34l8 12', '#7a5a2a', 1.1, .55), ['cracks']);

// ---------------- autotiles (47-blob) ----------------
wallBlob('citadel-wall', 'gold', 9500, ['gold', 'citadel', 'mirror-panels']);
wallBlob('basalt-wall', 'basalt', 9600, ['basalt', 'gold-inlay']);
// obsidian-slab: flush black slab patch with a lit gold kerb
blobSet('obsidian-slab', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 22, tags: ['paving', 'obsidian', 'floor'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(goldBase(1401), stroke(G.d, '#7a5a2a', 13, .22), stroke(G.d, GD[1], 8, .45), stroke(G.d, GM[0], 4, .85, -.4, -.4));
    t.add(`<g clip-path="${clip}">`, obsBase(1403), sides(G, ['#0a0810', .4], ['#aaa4d4', .4], 9, 5), stroke(G.d, '#12101a', 8, .3), '</g>');
    t.add(stroke(G.d, INKO, 1.1, .8));
  },
});
// glass-melt: a pool of fused glass over scorched sand, bright gloss, dark scorched rim
blobSet('glass-melt', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 26, tags: ['glass', 'melt', 'floor'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(goldBase(1405), stroke(G.d, '#3a2a20', 14, .24), stroke(G.d, '#6a5444', 9, .3), `<path d="${G.d}" transform="translate(1.6 2.4)" fill="#2a3a40" opacity=".22"/>`);
    t.add(`<g clip-path="${clip}">`, glassBase(1407), `<path d="${G.d}" fill="${t.lg(['#d8f4ee', '#9ad4cc', '#6ab0b0'], 60)}" opacity=".55"/>`, melt(1409, 1), sides(G, ['#3a6a74', .3], ['#ffffff', .6], 11, 6), stroke(G.d, '#ffffff', 5, .5, -1, -1), '</g>');
    t.add(stroke(G.d, '#3a7a80', 1.2, .85));
  },
});

// ---------------- connect-4 (N1 E2 S4 W8) ----------------
// thin 3/4 walls: a cap (top surface) and a face on the exposed south sides
function wall4(name, { cd = 6, fh = 14, hw = 6, kind = 'gold', cy = 42, seed = 9700, tags = [] }) {
  const ic = kind === 'gold' ? INKG : INKO;
  for (let m = 0; m < 16; m++) {
    const v = String(m).padStart(2, '0'), t = mkT('fences', name, v), cx = 32, X0 = (m & 8) ? 0 : cx - hw, X1 = (m & 2) ? 64 : cx + hw, top = cy - cd - 6, fy0 = cy - 6;
    t.add(path(`M${X0 + 3} ${fy0 + fh}H${X1 + 4}V${fy0 + fh + 3}H${X0 + 3}Z`, SHB, .3));
    if (m & 1) t.add(cCap(t, cx - hw, 0, hw * 2, top + 1, kind), line(`M${cx - hw} 0V${top}M${cx + hw} 0V${top}`, ic, 1.2, .8), rect(cx - hw, 0, 2, top, '#fff', 0, .4), rect(cx + hw - 3, 0, 3, top, SHB, 0, .3));
    t.add(cCap(t, X0, top, X1 - X0, cd, kind), rect(X0, top + cd - 1.4, X1 - X0, 1.4, '#fff', 0, .5), line(`M${X0} ${top}H${X1}`, ic, 1.2, .8));
    t.add(cFace(t, X0, X1, top + cd, top + cd + fh, kind, seed + m), line(`M${X0} ${top + cd}H${X1}`, ic, 1.2, .85));
    if (!(m & 8)) t.add(line(`M${X0} ${top}V${top + cd + fh}`, ic, 1.3, .85), rect(X0, top + cd, 2.4, fh, '#fff', 0, .3));
    if (!(m & 2)) t.add(line(`M${X1} ${top}V${top + cd + fh}`, ic, 1.3, .85), rect(X1 - 3, top + cd, 3, fh, SHB, 0, .3));
    t.add(line(`M${X0} ${top + cd + fh}H${X1}`, ic, 1, .6));
    if (m & 4) t.add(cCap(t, cx - hw, top, hw * 2, 64 - top, kind), line(`M${cx - hw} ${top}V64M${cx + hw} ${top}V64`, ic, 1.2, .8), rect(cx - hw, top, 2, 64 - top, '#fff', 0, .4), rect(cx + hw - 3, top, 3, 64 - top, SHB, 0, .3));
    outT(t, 'fences', name, v, ['autotile', 'connect4', 'mask:' + m, '3/4-view', 'wall', 'obstacle', ...tags]);
  }
}
wall4('parapet-gold', { cd: 6, fh: 15, hw: 6, kind: 'gold', cy: 42, seed: 9700, tags: ['gold', 'low', 'citadel'] });
// mirror screen: gold posts with a sun-disc finial joined by framed mirror panels; N/S arms are a low gold plinth rail
for (let m = 0; m < 16; m++) {
  const v = String(m).padStart(2, '0'), t = mkT('fences', 'mirror-screen', v), cx = 32, by = 54, pH = 36;
  t.add(ell(cx + 4, by + 1, 24, 4, SHB, .22));
  for (const [a, b, c, d] of arms(m, cx, by)) {
    if (b === d) { const x0 = Math.min(a, c), x1 = Math.max(a, c); t.add(rect(x0, by - 5, x1 - x0, 5, t.lg(GM, 90), 0, 1, ikg(.8)), mirrorPanel(t, x0, by - 28, x1 - x0, 20, true).replace(/<rect x="[^"]*" y="[^"]*" width="[^"]*" height="[^"]*" rx="1.4"[^>]*\/>/, rect(x0, by - 29.6, x1 - x0, 23.2, t.lg(GM, 45), 0, 1, ikg(.8)))); }
    else { const y0 = Math.min(b, d), y1 = Math.max(b, d); t.add(rect(cx - 3.4, y0, 6.8, y1 - y0, t.lg(['#fff0a8', '#f0c050', '#b8862a'], 0), 0, 1, ikg(.8))); }
  }
  t.add(rect(cx - 5.4, by - 7, 10.8, 7, t.lg(GM, 90), 1, 1, ikg(.9)), rect(cx - 3.6, by - pH, 7.2, pH - 6, t.lg(['#fff0a8', '#f0c050', '#b8862a'], 0), 1, 1, ikg(.9)), rect(cx - 5, by - pH - 2, 10, 4, t.lg(GM, 90), 1, 1, ikg(.8)), circ(cx, by - pH - 6, 4.6, t.rg(GM, .36, .3, .8), 1, ikg(.8)), circ(cx - 1.2, by - pH - 7.4, 1.2, '#fffbe0', .9));
  outT(t, 'fences', 'mirror-screen', v, ['autotile', 'connect4', 'mask:' + m, '3/4-view', 'mirror', 'gold', 'obstacle']);
}
