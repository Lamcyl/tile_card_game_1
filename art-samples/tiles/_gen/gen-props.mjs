// Trees, bushes, rocks, grass/reeds, fences/hedges, small props. 64x64 (1 cell), 64x128 (tall), 128x128 (large) canvases.
// Footprint = bottom cell (tall) or bottom row (large). Ground contact point of a tall prop is (32,112); of a 1-cell prop (32,52).
import { T, P, rng, hash, f, newTile, save, ell, circ, rect, path, line, ink, g, shadow, blobPath, tuft } from './lib.mjs';
import { crown, flower, clover } from './ground.mjs';

const mk = (cat, name, variant, w = T, h = T) => newTile({ cat, name, variant }, w, h);
const out = (t, cat, name, variant, tags = []) => save(t, { cat, name, variant, tags });
const trunk = (t, x, y, wb, wt, h, cols = P.bark, lean = 0) => path(`M${f(x - wb)} ${f(y)}Q${f(x - wb * .6)} ${f(y - h * .5)} ${f(x - wt + lean)} ${f(y - h)}H${f(x + wt + lean)}Q${f(x + wb * .6)} ${f(y - h * .5)} ${f(x + wb)} ${f(y)}Z`, t.lg(cols, 0), 1, ink(P.inkW, .9, .8))
  + line(`M${f(x - wb * .2)} ${f(y - 2)}q-1-${f(h * .4)} ${f(lean * .5)}-${f(h * .8)}`, cols[2], 1, .45) + line(`M${f(x + wb * .35)} ${f(y - 4)}q1-${f(h * .3)} 0-${f(h * .6)}`, cols[2], 1, .35);
const sh = (cx, cy, rx, ry) => shadow(cx, cy, rx, ry);

// ---------- pines / cedars (64x128) ----------
function conifer(t, { tiers, top, w, cols, cx = 32, base = 112, trunkH = 12, scallop = 6 }) {
  t.add(sh(cx + 2, base + 2, w * .75, 6));
  t.add(trunk(t, cx, base, 4.2, 3.2, trunkH + 4));
  const step = (base - trunkH - top) / (tiers + .4), gr = t.lg(cols, 0);
  for (let i = 0; i < tiers; i++) {
    const yb = base - trunkH + 4 - i * step * .86, ww = w * (1 - i / (tiers + .8) * .78), th = step * 1.75;
    const d = `M${f(cx - ww)} ${f(yb)}Q${f(cx - ww * .55)} ${f(yb + scallop)} ${f(cx - ww * .1)} ${f(yb + 1.5)}Q${f(cx + ww * .3)} ${f(yb + scallop)} ${f(cx + ww)} ${f(yb)}Q${f(cx + ww * .45)} ${f(yb - th * .45)} ${f(cx + 1)} ${f(yb - th)}Q${f(cx - ww * .45)} ${f(yb - th * .45)} ${f(cx - ww)} ${f(yb)}Z`;
    t.add(path(d, gr, 1, ink(P.inkG, .9, .75)));
    t.add(path(`M${f(cx - ww * .8)} ${f(yb - 1)}Q${f(cx - ww * .35)} ${f(yb - th * .45)} ${f(cx - 1)} ${f(yb - th + 3)}Q${f(cx - ww * .4)} ${f(yb - th * .2)} ${f(cx - ww * .6)} ${f(yb + 2)}Z`, cols[0], .45));
    t.add(line(`M${f(cx - ww * .4)} ${f(yb + 2)}q${f(ww * .2)} 2 ${f(ww * .4)} 0`, cols[2], 1.1, .5));
  }
}
const pineCfg = { a: { tiers: 5, top: 8, w: 24 }, b: { tiers: 4, top: 22, w: 26 }, c: { tiers: 3, top: 40, w: 22 }, d: { tiers: 6, top: 4, w: 21 } };
for (const [v, c] of Object.entries(pineCfg)) { const t = mk('trees', 'pine', v, T, 128); conifer(t, { ...c, cols: v === 'd' ? ['#7fb98a', '#4a8656', '#2f5e40'] : P.pineC }); out(t, 'trees', 'pine', v, ['tall', 'forest', 'conifer']); }
for (const [v, c] of Object.entries({ a: { tiers: 5, top: 6, w: 17 }, b: { tiers: 4, top: 20, w: 18 } })) { const t = mk('trees', 'cedar', v, T, 128); conifer(t, { ...c, cols: ['#5b9a78', '#2f6e52', '#1f4a3a'], scallop: 4 }); out(t, 'trees', 'cedar', v, ['tall', 'highlands', 'ruins', 'conifer']); }
{ const t = mk('trees', 'pine-sapling', 'a'); conifer(t, { tiers: 3, top: 14, w: 14, cols: P.pineC, base: 54, trunkH: 6 }); out(t, 'trees', 'pine-sapling', 'a', ['small']); }

// ---------- broadleaf trees: oak / blossom / maple / willow (64x128) ----------
function broad(t, { cols, cr, cy, seed, trunkH = 44, lean = 0, base = 112, extra = null, cx = 32, tw = 5.2 }) {
  const r = rng(seed);
  t.add(sh(cx + 3, base + 2, cr * .8, 6));
  t.add(trunk(t, cx, base, tw, tw * .6, trunkH, P.bark, lean));
  // roots
  t.add(path(`M${f(cx - tw - 3)} ${f(base + 1)}q4-1 ${f(tw + 1)}-5L${f(cx - 1)} ${f(base)}Z`, P.bark[1], .9), path(`M${f(cx + tw + 3)} ${f(base + 1)}q-4-1-${f(tw + 1)}-5L${f(cx + 1)} ${f(base)}Z`, P.bark[2], .9));
  // inner branches
  t.add(line(`M${f(cx)} ${f(base - trunkH + 6)}l-9-10M${f(cx)} ${f(base - trunkH + 6)}l9-12`, P.bark[2], 2.4, .9));
  const lobes = [[0, 0, 1], [-.62, .22, .66], [.62, .2, .68], [-.3, -.5, .6], [.34, -.52, .58], [0, .48, .6]];
  // dark underlayer lobes then lit lobes
  const rg = t.rg(cols, .32, .26, 1);
  for (const [dx, dy, k] of lobes) t.add(circ(cx + dx * cr + r.range(-1, 1), cy + dy * cr, cr * k * .95, cols[2], .95, ink(P.inkG, .9, .7)));
  for (const [dx, dy, k] of lobes) t.add(circ(cx + dx * cr - 1.5, cy + dy * cr - 2, cr * k * .8, rg, 1));
  t.add(ell(cx - cr * .35, cy - cr * .45, cr * .42, cr * .26, cols[0], .55, -20));
  for (let k = 0; k < 5; k++) { const a = r.range(-3, 0), d = cr * r.range(.2, .85); t.add(ell(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .8, 3, 1.2, cols[0], .55, r.range(-50, 20))); }
  for (let k = 0; k < 6; k++) { const x = cx + r.range(-cr * .8, cr * .8), y = cy + r.range(0, cr * .8); t.add(ell(x, y, 2.6, 1, cols[2], .4, r.range(-40, 40))); }
  if (extra) t.add(extra(r));
}
const petals = (n, cols, cx, cy, rr) => (r) => { let o = ''; for (let i = 0; i < n; i++) { const a = r.range(0, 6.28), d = r.range(.1, 1) * rr; o += circ(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .85, r.range(1.1, 2), r.pick(cols), .9); } return o; };
const oakCfg = { a: { cr: 24, cy: 46, seed: 1 }, b: { cr: 24, cy: 50, seed: 2, trunkH: 36, tw: 6 }, c: { cr: 21, cy: 52, seed: 3, trunkH: 34, lean: 2 }, d: { cr: 24, cy: 44, seed: 4, trunkH: 46 } };
for (const [v, c] of Object.entries(oakCfg)) { const t = mk('trees', 'oak', v, T, 128); broad(t, { ...c, cols: v === 'd' ? ['#a8d884', '#6fb05a', '#3f8048'] : P.leaf2 }); out(t, 'trees', 'oak', v, ['tall', 'forest', 'broadleaf']); }
for (const [v, c] of Object.entries({ a: { cr: 24, cy: 46, seed: 11, lean: -1 }, b: { cr: 24, cy: 48, seed: 12, trunkH: 38, tw: 5.8 }, c: { cr: 22, cy: 50, seed: 13, trunkH: 36 } })) {
  const t = mk('trees', 'blossom', v, T, 128); broad(t, { ...c, cols: P.blossom.map((x, i) => [P.blossom[0], P.blossom[1], P.blossom[2]][i]).reverse().reverse(), extra: petals(16, ['#fff', '#fbdde6', '#f2b0c4'], 32, c.cy, c.cr * .9) });
  // ground petals
  t.add(ell(40, 116, 3, 1.3, '#f6c6d4', .9, 10), ell(22, 118, 2.4, 1.1, '#fbdde6', .9, -15), ell(46, 120, 2.2, 1, '#f6c6d4', .8)); out(t, 'trees', 'blossom', v, ['tall', 'sakura', 'sunny-meadows']);
}
for (const [v, c] of Object.entries({ a: { cr: 23, cy: 46, seed: 21 }, b: { cr: 25, cy: 49, seed: 22, trunkH: 38 } })) { const t = mk('trees', 'maple', v, T, 128); broad(t, { ...c, cols: v === 'a' ? P.maple : ['#f8c36a', '#e8802e', '#b04a22'] }); t.add(ell(38, 117, 3, 1.3, '#d2622e', .9, 10), ell(24, 119, 2.4, 1.1, '#e8a83a', .9)); out(t, 'trees', 'maple', v, ['tall', 'rice-terraces', 'autumn']); }
// willow: dome plus hanging fronds
for (const [v, s] of [['a', 31], ['b', 32]]) {
  const t = mk('trees', 'willow', v, T, 128), r = rng(s); const cols = ['#b4de9c', '#7fbc78', '#4a9060'];
  t.add(sh(36, 114, 22, 6), trunk(t, 31, 112, 5.4, 3.6, 46, P.bark, v === 'a' ? -2 : 2));
  const rg = t.rg(cols, .3, .25, 1);
  t.add(path(`M7 56Q8 22 32 20Q56 22 57 56Q32 46 7 56Z`, rg, 1, ink(P.inkG, .9, .7)));
  for (let i = 0; i < 17; i++) { const x = 8 + i * 3.05, len = r.range(20, 36) - Math.abs(x - 32) * .2, sway = r.range(-2, 2); t.add(line(`M${f(x)} ${f(52 - Math.abs(x - 32) * .08)}q${f(sway)} ${f(len / 2)} ${f(sway * 1.4)} ${f(len)}`, cols[i % 3 === 0 ? 0 : (i % 3 === 1 ? 1 : 2)], 2, .9)); }
  t.add(ell(24, 30, 10, 4, cols[0], .55, -15)); for (let k = 0; k < 6; k++) t.add(circ(r.range(14, 50), r.range(28, 50), r.range(3, 5), cols[1], .6));
  out(t, 'trees', 'willow', v, ['tall', 'mirror-lake', 'marsh']);
}
// big trees (128x128): great oak with shimenawa
for (const [v, rope] of [['a', false], ['b', true]]) {
  const t = mk('trees', 'oak-great', v, 128, 128), r = rng(40 + (rope ? 1 : 0)), cols = P.leaf2;
  t.add(sh(66, 112, 44, 9));
  t.add(path('M44 114Q50 100 52 84Q50 66 54 52H76Q80 68 78 84Q80 100 88 114Q66 109 44 114Z', t.lg(P.bark, 0), 1, ink(P.inkW, 1, .8)));
  t.add(path('M58 96Q64 86 66 96Q66 106 62 112Q58 106 58 96Z', '#2e2418', .85));            // hollow
  t.add(line('M56 70q2 10 0 24M72 66q-2 12 1 26', P.bark[2], 1.2, .5));
  const lobes = [[0, 0, 1], [-.62, .2, .66], [.64, .2, .66], [-.32, -.5, .62], [.34, -.52, .6], [0, .52, .56], [-.9, .45, .4], [.9, .5, .4]];
  const cr = 40, cx = 64, cy = 52, rg = t.rg(cols, .3, .25, 1);
  for (const [dx, dy, k] of lobes) t.add(circ(cx + dx * cr, cy + dy * cr, cr * k * .95, cols[2], 1, ink(P.inkG, 1, .7)));
  for (const [dx, dy, k] of lobes) t.add(circ(cx + dx * cr - 2, cy + dy * cr - 3, cr * k * .8, rg, 1));
  t.add(ell(cx - 14, cy - 18, 20, 11, cols[0], .5, -20));
  for (let k = 0; k < 14; k++) { const a = r.range(-3.3, .2), d = cr * r.range(.2, .9); t.add(ell(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .8, 5, 1.8, cols[0], .55, r.range(-50, 20))); }
  if (rope) {
    t.add(path('M51 77Q64 87 79 77L79 71Q64 80 51 71Z', '#e8d9a8', 1, ink('#a88a4a', 1, .8)));
    for (let i = 0; i < 6; i++) t.add(line(`M${f(54 + i * 4.6)} ${f(76 + Math.sin(i * .5) * 3)}l2 -4`, '#a88a4a', 1, .8));
    for (const x of [56, 66, 76]) t.add(path(`M${x} 80l4 0l-1 7l3 -1l-2 7l-4 -2l1 -5l-3 1Z`, '#fffaf0', 1, ink('#b8b09a', .7, .8)));
  }
  out(t, 'trees', 'oak-great', v, ['large', 'landmark', 'old-oak-wood', rope ? 'shimenawa' : 'plain']);
}
// large blossom tree (128x128) — Sunny Meadows landmark
{
  const t = mk('trees', 'blossom-great', 'a', 128, 128), r = rng(50), cols = P.blossom;
  t.add(sh(68, 112, 44, 9));
  t.add(path('M52 114Q58 100 58 84Q54 70 50 60Q56 62 60 66Q64 52 68 46Q70 62 72 68Q80 62 88 58Q80 72 76 84Q78 100 84 114Q68 109 52 114Z', t.lg(P.bark, 0), 1, ink(P.inkW, 1, .8)));
  const cr = 40, cx = 64, cy = 52, rg = t.rg([cols[0], cols[1], cols[2]], .3, .25, 1);
  for (const [dx, dy, k] of [[0, 0, 1], [-.62, .2, .66], [.64, .2, .66], [-.32, -.5, .62], [.34, -.52, .6], [0, .52, .56], [-.9, .45, .4], [.9, .5, .4]]) t.add(circ(cx + dx * cr, cy + dy * cr, cr * k * .95, cols[2], 1, ink('#b0607a', 1, .55)));
  for (const [dx, dy, k] of [[0, 0, 1], [-.62, .2, .66], [.64, .2, .66], [-.32, -.5, .62], [.34, -.52, .6], [0, .52, .56], [-.9, .45, .4], [.9, .5, .4]]) t.add(circ(cx + dx * cr - 2, cy + dy * cr - 3, cr * k * .8, rg, 1));
  t.add(ell(cx - 14, cy - 18, 20, 11, '#fff', .45, -20));
  for (let i = 0; i < 40; i++) { const a = r.range(0, 6.28), d = r.range(.1, 1) * cr * .95; t.add(circ(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .85, r.range(1.2, 2.2), r.pick(['#fff', '#fbdde6', '#f2b0c4']), .9)); }
  for (let i = 0; i < 14; i++) t.add(ell(r.range(30, 100), r.range(108, 124), 2.4, 1.1, r.pick(['#f6c6d4', '#fbdde6']), .9, r.range(0, 180)));
  out(t, 'trees', 'blossom-great', 'a', ['large', 'landmark', 'sunny-meadows']);
}

// ---------- bamboo (64x128) ----------
for (const [v, n, seed] of [['a', 4, 61], ['b', 6, 62], ['c', 3, 63]]) {
  const t = mk('trees', 'bamboo', v, T, 128), r = rng(seed);
  t.add(sh(34, 114, 22, 6));
  const stalks = []; for (let i = 0; i < n; i++) stalks.push([32 + (i - (n - 1) / 2) * (n > 4 ? 7.5 : 9) + r.range(-2, 2), 112 - r.range(0, 5), r.range(62, 90), r.range(-3, 3)]);
  stalks.sort((a, b) => a[1] - b[1]);
  for (const [x, y, h, lean] of stalks) {
    const gr = t.lg(['#b6dc86', '#7fb75a', '#4f8a44'], 0);
    t.add(path(`M${f(x - 2.6)} ${f(y)}L${f(x - 2.2 + lean)} ${f(y - h)}H${f(x + 2.2 + lean)}L${f(x + 2.6)} ${f(y)}Z`, gr, 1, ink('#2f5a34', .8, .7)));
    for (let k = 1; k < h / 17; k++) { const yy = y - k * 17, xx = x + lean * k * 17 / h; t.add(rect(xx - 3, yy - 1, 6, 2.4, '#3f7a3a', 1, .85)); }
    // leaf sprays at the top
    const ty = y - h, tx = x + lean;
    for (const [dx, dy, rot] of [[-9, 2, -30], [9, 0, 28], [-6, -7, -60], [7, -8, 52], [0, -10, 5]]) t.add(path(`M${f(tx)} ${f(ty + 4)}q${f(dx * .5)} ${f(dy - 6)} ${f(dx)} ${f(dy)}q${f(-dx * .4)} 3 ${f(-dx)} ${f(-dy + 1)}Z`, '#6fb560', .95, ink('#2f5a34', .6, .6)));
  }
  out(t, 'trees', 'bamboo', v, ['tall', 'bamboo-valley']);
}

// ---------- bushes (64x64) ----------
function bush(t, { cols, seed, dots = null, w = 22, h = 17, cy = 38, fern = false }) {
  const r = rng(seed); t.add(sh(34, 52, w * .9, 5.5));
  if (fern) {
    for (let i = 0; i < 9; i++) { const a = -2.9 + i * .4, len = r.range(16, 24); const ex = 32 + Math.cos(a) * len, ey = 50 + Math.sin(a) * len * 1.1; t.add(path(`M32 50Q${f(32 + Math.cos(a) * len * .5)} ${f(50 + Math.sin(a) * len * .8 - 4)} ${f(ex)} ${f(ey)}Q${f(32 + Math.cos(a) * len * .6)} ${f(50 + Math.sin(a) * len * .8 + 2)} 32 50Z`, cols[i % 3], .95, ink(P.inkG, .6, .6))); }
    return;
  }
  const rg = t.rg(cols, .3, .25, 1);
  for (const [dx, dy, k] of [[-.55, .1, .62], [.55, .1, .6], [0, -.3, .7], [0, .15, .75]]) t.add(path(blobPath(r, 32 + dx * w, cy + dy * h, w * k, h * k * 1.05, 9, .1), rg, 1, ink(P.inkG, .9, .7)));
  t.add(ell(24, cy - 8, 9, 4, cols[0], .55, -15));
  for (let k = 0; k < 5; k++) t.add(ell(r.range(14, 46), r.range(cy - 8, cy + 10), 2.6, 1, cols[2], .4, r.range(-40, 40)));
  if (dots) t.add(dots(r));
}
const dotsOf = (n, cols, rad) => (r) => { let o = ''; for (let i = 0; i < n; i++) { const x = r.range(16, 48), y = r.range(28, 46); o += circ(x, y, rad, r.pick(cols), 1, ink('#5a2a1a', .4, .4)) + circ(x - .4, y - .5, rad * .35, '#fff', .8); } return o; };
const bushes = { 'bush-round-a': { cols: ['#9be08f', '#5fae5c', '#3a8048'], seed: 71 }, 'bush-round-b': { cols: P.leaf2, seed: 72, w: 19, h: 15 }, 'bush-berry': { cols: P.leaf2, seed: 73, dots: dotsOf(9, ['#c8352b', '#e0583f'], 1.6) }, 'bush-blossom': { cols: ['#8fd08a', '#4a9a50', '#2f6e3a'], seed: 74, dots: dotsOf(12, ['#fbdde6', '#f2b0c4', '#fff'], 1.7) }, 'bush-hydrangea': { cols: ['#8fd08a', '#4a9a50', '#2f6e3a'], seed: 75, dots: dotsOf(10, ['#a8b6ee', '#c9b3e6', '#8ea0e0'], 2) }, 'bush-fern': { cols: ['#7fbf6a', '#4f9a52', '#2f6e3a'], seed: 76, fern: true }, 'bush-autumn': { cols: ['#f3a45a', '#d2622e', '#a03c22'], seed: 77 } };
for (const [n, c] of Object.entries(bushes)) { const t = mk('trees', n.replace(/-[ab]$/, ''), n.endsWith('-b') ? 'b' : 'a'); bush(t, c); save(t, { cat: 'trees', name: n.replace(/-[ab]$/, ''), variant: n.endsWith('-b') ? 'b' : 'a', tags: ['small', 'bush'] }); }

// ---------- rocks ----------
function rock(t, r, cx, cy, rx, ry, cols, moss = false, facets = 3) {
  t.add(sh(cx + 2, cy + ry * .75, rx * 1.05, ry * .35));
  const d = blobPath(r, cx, cy, rx, ry, 8, .14), gr = t.lg(cols, 55);
  t.add(path(d, gr, 1, ink(P.inkR, 1, .8)));
  t.add(path(`M${f(cx - rx * .8)} ${f(cy - ry * .1)}Q${f(cx - rx * .6)} ${f(cy - ry * .9)} ${f(cx + rx * .1)} ${f(cy - ry * .85)}Q${f(cx - rx * .3)} ${f(cy - ry * .5)} ${f(cx - rx * .8)} ${f(cy - ry * .1)}Z`, '#fff', .35));
  for (let i = 0; i < facets; i++) t.add(line(`M${f(cx + r.range(-rx * .5, rx * .6))} ${f(cy + r.range(-ry * .3, ry * .2))}l${f(r.range(-5, 5))} ${f(r.range(4, 9))}`, cols[2], 1.1, .5));
  if (moss) { t.add(path(`M${f(cx - rx * .7)} ${f(cy - ry * .5)}Q${f(cx - rx * .2)} ${f(cy - ry * 1.05)} ${f(cx + rx * .5)} ${f(cy - ry * .6)}Q${f(cx + rx * .3)} ${f(cy - ry * .3)} ${f(cx)} ${f(cy - ry * .4)}Q${f(cx - rx * .3)} ${f(cy - ry * .1)} ${f(cx - rx * .7)} ${f(cy - ry * .5)}Z`, '#86b865', .95, ink(P.inkG, .6, .5)), tuft(cx - rx * .3, cy - ry * .5, '#4d7a40', .8, .6)); }
}
for (const [v, rx, ry, cols, moss, s] of [['a', 17, 13, P.stone, false, 1], ['b', 20, 12, P.stoneG, false, 2], ['c', 15, 14, P.stone, false, 3], ['d', 21, 15, ['#d2c8b0', '#a29a86', '#756c5c'], false, 4]]) { const t = mk('rocks', 'boulder', v); rock(t, rng(s), 32, 40, rx, ry, cols, moss); out(t, 'rocks', 'boulder', v, ['obstacle']); }
for (const [v, rx, ry, s] of [['a', 18, 13, 5], ['b', 21, 14, 6], ['c', 16, 12, 7]]) { const t = mk('rocks', 'boulder-mossy', v); rock(t, rng(s), 32, 40, rx, ry, P.stoneG, true); out(t, 'rocks', 'boulder-mossy', v, ['obstacle', 'old-oak-wood', 'ruins']); }
for (const [v, s] of [['a', 8], ['b', 9], ['c', 10]]) { const t = mk('rocks', 'rock-cluster', v), r = rng(s); rock(t, r, 22, 44, 11, 8, P.stone); rock(t, r, 42, 42, 13, 10, P.stoneG, v === 'b'); rock(t, r, 33, 33, 10, 8, P.stone, false, 2); out(t, 'rocks', 'rock-cluster', v, ['obstacle']); }
for (const [v, s] of [['a', 12], ['b', 13]]) { const t = mk('rocks', 'rock-small', v), r = rng(s); rock(t, r, 24, 44, 8, 6, P.stone, false, 1); rock(t, r, 40, 46, 6, 5, P.stoneG, false, 1); rock(t, r, 33, 38, 5, 4, P.stone, v === 'b', 0); out(t, 'rocks', 'rock-small', v, ['decor']); }
// big boulder, 2 cells wide
for (const [v, s] of [['a', 14], ['b', 15]]) { const t = mk('rocks', 'boulder-large', v, 128, 128), r = rng(s); rock(t, r, 62, 90, 44, 30, v === 'a' ? P.stone : P.stoneG, v === 'b', 6); rock(t, r, 98, 104, 18, 13, P.stone, false, 2); out(t, 'rocks', 'boulder-large', v, ['large', 'obstacle']); }
// standing stones (tall) with optional shimenawa
for (const [v, rope, s] of [['a', false, 16], ['b', true, 17], ['c', false, 18]]) {
  const t = mk('rocks', 'standing-stone', v, T, 128), r = rng(s); t.add(sh(34, 114, 20, 6));
  const gr = t.lg(P.stoneG, 40); const w = v === 'c' ? 13 : 16, top = v === 'c' ? 34 : 18;
  t.add(path(`M${32 - w - 3} 114Q${32 - w} 70 ${32 - w + 3} ${top + 6}Q${32 - 2} ${top - 4} ${32 + w - 3} ${top + 4}Q${32 + w + 1} 70 ${32 + w + 3} 114Q32 120 ${32 - w - 3} 114Z`, gr, 1, ink(P.inkR, 1, .8)));
  t.add(path(`M${32 - w + 1} 108Q${32 - w + 3} 70 ${32 - w + 6} ${top + 9}Q${32 - 4} ${top} 32 ${top + 4}Q${32 - 6} ${top + 20} ${32 - w + 6} 108Z`, '#fff', .3));
  t.add(path(`M${32 - w + 2} 112q6-8 14-6q-8 -3 -14 -14Z`, '#86b865', .9)); t.add(line(`M${32 + 3} ${top + 20}l3 10l-2 8M${32 + 6} 80l-4 8`, P.stoneG[2], 1.2, .5));
  if (v !== 'c') t.add(line(`M${32 - 3} 62h6M${32} 56v14M${32 - 4} 76q4 3 8 0`, '#6a7a6a', 1.2, .6));
  if (rope) { t.add(path(`M${32 - w - 2} 78Q32 94 ${32 + w + 2} 78V73Q32 88 ${32 - w - 2} 73Z`, '#e8d9a8', 1, ink('#a88a4a', 1, .8))); for (const x of [24, 32, 40]) t.add(path(`M${x} 85l4 0l-1 7l3 -1l-2 7l-4 -2l1 -5l-3 1Z`, '#fffaf0', 1, ink('#b8b09a', .7, .8))); }
  out(t, 'rocks', 'standing-stone', v, ['tall', rope ? 'shimenawa' : 'plain', 'misty-highlands']);
}

// ---------- tall grass, reeds, lilies ----------
function blades(t, r, n, cx, base, spread, hmin, hmax, cols) {
  for (let i = 0; i < n; i++) { const x = cx + r.range(-spread, spread), h = r.range(hmin, hmax), lean = (x - cx) * .25 + r.range(-3, 3); t.add(path(`M${f(x - 1.6)} ${f(base)}Q${f(x + lean * .3)} ${f(base - h * .6)} ${f(x + lean)} ${f(base - h)}Q${f(x + lean * .4 + 1.5)} ${f(base - h * .5)} ${f(x + 1.6)} ${f(base)}Z`, cols[i % cols.length], .95)); }
}
for (const [v, s, cols] of [['a', 20, ['#7fbf6a', '#5fae5c', '#4a9a50']], ['b', 21, ['#9bd07a', '#6fb560', '#4f9a52']], ['c', 22, ['#c8c870', '#a8b858', '#8aa84a']]]) {
  const t = mk('grass', 'tall-grass', v), r = rng(s); t.add(ell(33, 53, 18, 4, '#2e2c1a', .13));
  blades(t, r, 22, 32, 52, 15, 18, 36, cols); if (v === 'a') t.add(flower(40, 30, '#fffaf0', .9)), t.add(flower(24, 34, '#f6c6d4', .9)); out(t, 'grass', 'tall-grass', v, ['concealing', 'overlay-prop']);
}
for (const [v, s, hd] of [['a', 23, 3], ['b', 24, 2], ['c', 25, 4]]) {
  const t = mk('grass', 'reeds', v), r = rng(s); t.add(ell(33, 54, 17, 4, '#2e2c1a', .12), ell(33, 55, 15, 2, '#4f8aa8', .25));
  blades(t, r, 16, 32, 54, 14, 20, 34, ['#7fae5e', '#5f8f4c', '#9ccf78']);
  for (let i = 0; i < hd; i++) { const x = 32 + (i - (hd - 1) / 2) * 9 + r.range(-2, 2), h = r.range(30, 42); t.add(line(`M${f(x)} 54q${f(r.range(-2, 2))}-${f(h / 2)} 0-${f(h)}`, '#6a8a4a', 1.4), rect(x - 2, 54 - h - 5, 4, 10, '#8a5a34', 2, 1, ink(P.inkW, .7, .7)), rect(x - 1.2, 54 - h - 4, 1.2, 7, '#b88a5a', .6, .8)); }
  out(t, 'grass', 'reeds', v, ['water-edge', 'mirror-lake', 'marsh']);
}
for (const [v, s] of [['a', 26], ['b', 27], ['c', 28]]) {
  const t = mk('grass', 'lily-pads', v), r = rng(s);
  for (let i = 0; i < (v === 'b' ? 4 : 3); i++) { const x = r.range(18, 46), y = r.range(20, 46), rx = r.range(8, 11); t.add(ell(x + 1, y + 1.5, rx, rx * .6, '#2a5a6a', .2), path(`M${f(x)} ${f(y)}L${f(x + rx)} ${f(y - 1)}A${f(rx)} ${f(rx * .6)} 0 1 1 ${f(x + rx * .6)} ${f(y - rx * .45)}Z`, '#6fbf78', 1, ink('#2f6e3a', .8, .7)), ell(x - 2, y - 1.5, rx * .4, rx * .2, '#a8e09a', .7)); if (i === 0 && v !== 'a') t.add(flower(x + 3, y - 2, v === 'b' ? '#f6c6d4' : '#fffaf0', 1.3)); }
  out(t, 'grass', 'lily-pads', v, ['water-overlay', 'mirror-lake', 'marsh']);
}

// ---------- connecting fences and hedges: 16 pieces (bit N=1,E=2,S=4,W=8) ----------
const C = { N: 1, E: 2, S: 4, W: 8 };
function fence(t, m) {
  const wood = t.lg(['#d9bc8a', '#b99562'], 90), dark = '#8a6a44', cx = 32, by = 48;
  const rails = (x0, x1) => rect(x0, 29, x1 - x0, 4.2, wood, 1.5, 1, ink(P.inkW, .7, .7)) + rect(x0, 39, x1 - x0, 4.2, wood, 1.5, 1, ink(P.inkW, .7, .7)) + rect(x0, 29.4, x1 - x0, 1.2, '#f1dcb2', 0, .6);
  const x0 = m & C.W ? 0 : 32, x1 = m & C.E ? 64 : 32;
  t.add(ell(cx + 2, by + 3, 8, 2.6, '#3b3a24', .22));
  if (x1 > x0) t.add(rect(x0 + 1, by + 1.5, x1 - x0, 2.6, '#3b3a24', 1.3, .17));
  if (m & C.N) t.add(rect(cx - 2, 0, 4, by - 2, t.lg(['#cfae78', '#a88458'], 0), 1, 1, ink(P.inkW, .7, .7)), rect(cx - 2, 2, 4, 3, '#f1dcb2', 0, .5));
  if (m & C.N) t.add(ell(cx + 4, 12, 2, 3, '#3b3a24', 0));
  if (x1 > x0) t.add(rails(x0, x1));
  // post
  t.add(path(`M${cx - 3.6} ${by}V26L${cx} 22.5L${cx + 3.6} 26V${by}Z`, t.lg(['#d9bc8a', '#9a7442'], 0), 1, ink(P.inkW, .9, .8)));
  t.add(rect(cx - 2.6, 27, 1.2, 18, '#f1dcb2', 0, .5));
  if (m & C.S) t.add(rect(cx - 2.2, by - 1, 4.4, 64 - by + 1, t.lg(['#e2c892', '#b88e5a'], 0), 1, 1, ink(P.inkW, .7, .7)), rect(cx - 2.2, by + 1, 4.4, 3, '#f1dcb2', 0, .55), rect(cx - 2.2, 60, 4.4, 4, '#3b3a24', 0, .12));
}
function hedge(t, m, kind) {
  const r = rng(hash('hedge' + kind)), cols = kind === 'blossom' ? ['#9be08f', '#4a9a50', '#2f6e3a'] : ['#8fd08a', '#4a9a50', '#2f6e3a'];
  const rg = t.rg(cols, .3, .2, 1.1), ink_ = ink(P.inkG, .9, .7);
  const box = (x, y, w, h) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="9" fill="${rg}" stroke="${P.inkG}" stroke-width=".9" stroke-opacity=".7"/>`;
  const hy = 22, hb = 52;
  t.add(ell(34, hb + 1, 14, 4, '#3b3a24', .2));
  if (m & C.N) t.add(box(19, 0, 26, hb - 18));
  const x0 = m & C.W ? -4 : 17, x1 = m & C.E ? 68 : 47;
  if ((m & (C.W | C.E)) || !(m & (C.N | C.S))) { if (m & (C.W | C.E)) t.add(ell((x0 + x1) / 2 + 2, hb, (x1 - x0) / 2, 3.4, '#3b3a24', .17)); }
  t.add(box(x0, hy, x1 - x0, hb - hy));
  if (m & C.S) t.add(ell(34, 61, 12, 3.5, '#3b3a24', .15), box(19, hy + 10, 26, 64 - hy - 8));
  // texture: leaf scallops + light on top
  const clipPath = '';
  for (let i = 0; i < 14; i++) { const x = r.range(x0 + 4, x1 - 4), y = r.range(hy + 4, hb - 4); t.add(ell(Math.max(3, Math.min(61, x)), y, 3, 1.1, i % 3 ? cols[0] : cols[2], i % 3 ? .6 : .4, r.range(-40, 40))); }
  t.add(ell((x0 + x1) / 2 - 2, hy + 4, Math.min(24, (x1 - x0) / 2 - 3), 2.4, cols[0], .55));
  if (kind === 'blossom') for (let i = 0; i < 9; i++) t.add(circ(r.range(Math.max(4, x0 + 3), Math.min(60, x1 - 3)), r.range(hy + 5, hb - 3), 1.6, r.pick(['#fbdde6', '#f2b0c4', '#fff']), .95));
}
for (let m = 0; m < 16; m++) {
  const tags = ['autotile', 'connect4', 'mask:' + m, 'obstacle'];
  const a = mk('fences', 'fence-wood', String(m).padStart(2, '0')); fence(a, m); out(a, 'fences', 'fence-wood', String(m).padStart(2, '0'), tags);
  const b = mk('fences', 'hedge', String(m).padStart(2, '0')); hedge(b, m, 'plain'); out(b, 'fences', 'hedge', String(m).padStart(2, '0'), tags);
  const c = mk('fences', 'hedge-blossom', String(m).padStart(2, '0')); hedge(c, m, 'blossom'); out(c, 'fences', 'hedge-blossom', String(m).padStart(2, '0'), tags);
}

// ---------- small props ----------
for (const [v, s] of [['a', 31], ['b', 32], ['c', 33]]) {
  const t = mk('props', 'stump', v), r = rng(s); const rx = v === 'b' ? 14 : 11, h = v === 'c' ? 12 : 17;
  t.add(sh(34, 50, rx + 5, 5));
  t.add(path(`M${32 - rx - 2} 50Q${32 - rx} ${50 - h * .5} ${32 - rx + 1} ${50 - h}H${32 + rx - 1}Q${32 + rx} ${50 - h * .5} ${32 + rx + 2} 50Q32 55 ${32 - rx - 2} 50Z`, t.lg(P.bark, 0), 1, ink(P.inkW, 1, .8)));
  t.add(ell(32, 50 - h, rx, rx * .42, '#e2c892', 1, 0, ink(P.inkW, .9, .8)), ell(32, 50 - h, rx * .66, rx * .27, 'none', 1, 0, { fill: 'none', stroke: '#b88e5a', 'stroke-width': .8 }), ell(32, 50 - h, rx * .3, rx * .12, 'none', 1, 0, { fill: 'none', stroke: '#b88e5a', 'stroke-width': .8 }));
  if (v !== 'a') t.add(path(`M${32 - rx + 1} ${50 - h}q4-4 8 0q-4 2 -8 0Z`, '#86b865', 1)), t.add(tuft(32 + rx - 3, 50, '#5f8f4c', .8, .6));
  if (v === 'c') { t.add(path('M40 30q3-5 6-1q-2 4-6 1Z', '#e8a83a', .9)); }
  out(t, 'props', 'stump', v, ['obstacle', 'forest']);
}
for (const [v, s] of [['a', 34], ['b', 35]]) { // fairy ring
  const t = mk('props', 'mushroom-ring', v), r = rng(s); const n = v === 'a' ? 9 : 7;
  t.add(ell(32, 40, 22, 11, '#7fae5e', .35), ell(32, 40, 17, 8, '#a8cf86', .3));
  const pts = []; for (let i = 0; i < n; i++) { const a = i / n * 6.28 + .3; pts.push([32 + Math.cos(a) * 19, 41 + Math.sin(a) * 8.5]); } pts.sort((a, b) => a[1] - b[1]);
  for (const [x, y] of pts) { const k = r.range(.8, 1.15); t.add(ell(x + 1, y + 2, 5 * k, 1.6, '#3b3a24', .18), rect(x - 1.4 * k, y - 4 * k, 2.8 * k, 5.5 * k, '#fff6e0', 1, 1, ink('#b8b09a', .6, .7)), path(`M${f(x - 5.5 * k)} ${f(y - 3 * k)}Q${f(x)} ${f(y - 11 * k)} ${f(x + 5.5 * k)} ${f(y - 3 * k)}Q${f(x)} ${f(y - 1 * k)} ${f(x - 5.5 * k)} ${f(y - 3 * k)}Z`, v === 'a' ? t.lg(['#e0583f', '#a82a20'], 90) : t.lg(['#f6c6d4', '#c98aa0'], 90), 1, ink('#5a2a1a', .7, .6)), circ(x - 1.5 * k, y - 6 * k, .9 * k, '#fff', .9), circ(x + 2 * k, y - 4.5 * k, .8 * k, '#fff', .9)); }
  out(t, 'props', 'mushroom-ring', v, ['interest', 'fairy', 'old-oak-wood']);
}
for (const [v, s] of [['a', 36], ['b', 37], ['c', 38]]) {
  const t = mk('props', 'mushrooms', v), r = rng(s), cols = { a: ['#e0583f', '#a82a20'], b: ['#e8b56a', '#b8843a'], c: ['#c9b3e6', '#8a72b0'] }[v];
  const cl = [[26, 48, 1.3], [40, 50, 1], [34, 42, .8]];
  t.add(sh(34, 52, 20, 4.5));
  for (const [x, y, k] of cl) t.add(rect(x - 1.6 * k, y - 8 * k, 3.2 * k, 9 * k, '#fff6e0', 1, 1, ink('#b8b09a', .6, .7)), path(`M${f(x - 8 * k)} ${f(y - 6 * k)}Q${f(x)} ${f(y - 19 * k)} ${f(x + 8 * k)} ${f(y - 6 * k)}Q${f(x)} ${f(y - 3 * k)} ${f(x - 8 * k)} ${f(y - 6 * k)}Z`, t.lg(cols, 90), 1, ink('#5a2a1a', .8, .6)), circ(x - 2.5 * k, y - 10 * k, 1.2 * k, '#fff', .9), circ(x + 3 * k, y - 8 * k, 1 * k, '#fff', .9));
  out(t, 'props', 'mushrooms', v, ['decor']);
}
for (const [v, s] of [['a', 0], ['b', 1], ['c', 2]]) { // signpost
  const t = mk('props', 'signpost', v, T, 128); t.add(sh(34, 114, 14, 4.5));
  t.add(rect(29, 52, 6, 62, t.lg(P.bark, 0), 1.5, 1, ink(P.inkW, .9, .8)));
  const board = (y, w, dir, col) => path(dir > 0 ? `M20 ${y}H${20 + w}L${26 + w} ${y + 7}L${20 + w} ${y + 14}H20Z` : `M${44 - w} ${y}H44V${y + 14}H${44 - w}L${38 - w} ${y + 7}Z`, t.lg(col, 90), 1, ink(P.inkW, .9, .8)) + line(`M${dir > 0 ? 24 : 48 - w} ${y + 5}h${w - 6}M${dir > 0 ? 24 : 48 - w} ${y + 9}h${w - 12}`, '#6b4a2c', 1.1, .5);
  if (v === 'a') t.add(board(58, 26, 1, ['#e2c892', '#b88e5a']), board(78, 22, -1, ['#d9bc8a', '#a8844f']));
  if (v === 'b') t.add(path('M12 56H52V90H12Z', t.lg(['#e2c892', '#b88e5a'], 90), 1, ink(P.inkW, 1, .8)), line('M20 66h24M20 73h24M20 80h14', '#6b4a2c', 1.4, .55), rect(12, 56, 40, 4, '#f1dcb2', 0, .5));
  if (v === 'c') t.add(board(56, 26, 1, ['#e2c892', '#b88e5a']), path('M24 76H40V96H24Z', '#c8352b', 1, ink('#5a1a14', .9, .8)), line('M28 82h8M28 86h8M28 90h5', '#fff6e0', 1.2, .8));
  t.add(path('M28 52Q32 46 36 52Z', '#8a6a44', 1, ink(P.inkW, .8, .8)));
  out(t, 'props', 'signpost', v, ['tall', 'interest']);
}
// stone lanterns (tall)
for (const [v, lit, moss] of [['a', false, false], ['b', true, false], ['c', false, true]]) {
  const t = mk('props', 'stone-lantern', v, T, 128); t.add(sh(34, 114, 18, 5.5));
  const gr = t.lg(P.stone, 40);
  if (lit) t.add(circ(32, 62, 26, t.rg(['#ffe6a0', '#ffc45a', '#ffc45a'], .5, .5, .5, [.85, .3, 0]), 1));
  t.add(path('M20 114H44L42 106H22Z', gr, 1, ink(P.inkR, .9, .8)));
  t.add(path('M27 106H37L36 82H28Z', gr, 1, ink(P.inkR, .9, .8)));
  t.add(path('M22 82H42L40 76H24Z', gr, 1, ink(P.inkR, .9, .8)));
  t.add(rect(24, 56, 16, 20, gr, 1, 1, ink(P.inkR, .9, .8)));
  t.add(rect(27, 60, 10, 12, lit ? '#ffd47a' : '#5a5448', 1, 1, ink(P.inkR, .8, .8)));
  if (lit) t.add(rect(29, 62, 6, 8, '#fff6c0', 1, .9));
  else t.add(rect(27, 60, 10, 12, 'none', 1, 1, { fill: 'none' }), line('M32 60v12M27 66h10', '#3b362c', 1, .6));
  t.add(path('M16 56L32 44L48 56L45 58H19Z', t.lg(['#bdb6a0', '#7a7464'], 90), 1, ink(P.inkR, .9, .8)), ell(32, 43, 3.2, 3.2, '#cfc8b2', 1, 0, ink(P.inkR, .8, .8)));
  if (moss) t.add(path('M20 114q5-7 12-4q6-6 12 2Z', '#86b865', .95), path('M16 56q8-8 16-10q8 2 16 10q-8-2-16-3q-8 1-16 3Z', '#86b865', .9), tuft(26, 108, '#4d7a40', .8, .6));
  out(t, 'props', 'stone-lantern', v, ['tall', lit ? 'lit' : 'unlit', 'shrine']);
}
for (const [v, lit] of [['a', false], ['b', true]]) { // paper event lantern on a post
  const t = mk('props', 'event-lantern', v, T, 128); t.add(sh(34, 114, 14, 4.5));
  if (lit) t.add(circ(32, 62, 28, t.rg(['#ffd47a', '#ffb04a', '#ffb04a'], .5, .5, .5, [.9, .35, 0]), 1));
  t.add(rect(30, 40, 4, 74, t.lg(P.bark, 0), 1, 1, ink(P.inkW, .9, .8)), path('M32 42Q50 42 50 50H40', 'none', 1, { fill: 'none', stroke: P.inkW, 'stroke-width': 3 }));
  t.add(path('M26 78Q22 92 26 102H38Q42 92 38 78Z', lit ? t.lg(['#ffe9b0', '#ffb04a'], 90) : t.lg(['#f2e6c4', '#cdbd94'], 90), 1, ink('#6b4a2c', .9, .8)));
  t.add(rect(25, 76, 14, 3, '#3a2a22', 1), rect(25, 100, 14, 3, '#3a2a22', 1), line('M26 86Q32 88 38 86M26 94Q32 96 38 94', '#c8352b', 1.2, lit ? .7 : .5));
  out(t, 'props', 'event-lantern', v, ['tall', 'interest', lit ? 'lit' : 'unlit']);
}
for (const [v, s] of [['a', 0], ['b', 1], ['c', 2]]) { // barrel
  const t = mk('props', 'barrel', v); t.add(sh(34, 53, 19, 5));
  const gr = t.lg(['#d9bc8a', '#b08050', '#8a6038'], 0);
  t.add(path('M18 24Q14 38 18 52Q32 58 46 52Q50 38 46 24Q32 18 18 24Z', gr, 1, ink(P.inkW, 1, .8)));
  t.add(ell(32, 24, 14, 5, '#e2c892', 1, 0, ink(P.inkW, .9, .8)), ell(32, 24, 10, 3, '#c9a06a', .6));
  t.add(path('M17 31Q32 37 47 31V35Q32 41 17 35Z', '#5a4a3e', 1, ink('#2a2018', .6, .7)), path('M17 44Q32 50 47 44V48Q32 54 17 48Z', '#5a4a3e', 1, ink('#2a2018', .6, .7)));
  t.add(line('M26 26v26M32 28v28M38 26v26', P.bark[2], 1, .3));
  if (v === 'b') t.add(circ(32, 40, 5, '#f6efdc', .9, ink('#6b4a2c', .5, .6)), line('M30 40h4', '#c8352b', 1.4)); if (v === 'c') t.add(path('M36 24q4-8 8-3', 'none', 1, { fill: 'none', stroke: '#7fae5e', 'stroke-width': 1.5 }));
  out(t, 'props', 'barrel', v, ['obstacle', 'village']);
}
for (const [v, s] of [['a', 0], ['b', 1], ['c', 2]]) { // crates
  const t = mk('props', 'crate', v); t.add(sh(34, 53, v === 'b' ? 22 : 17, 5));
  const bx = (x, y, w, h) => { t.add(path(`M${x} ${y}h${w}v${h}h${-w}Z`, t.lg(['#d9bc8a', '#a8844f'], 90), 1, ink(P.inkW, 1, .8)), rect(x + 1.5, y + 1.5, w - 3, 2.5, '#f1dcb2', 0, .5), line(`M${x} ${y}L${x + w} ${y + h}M${x + w} ${y}L${x} ${y + h}`, '#8a6a44', 1.6, .8), rect(x, y, w, 3, 'none', 0, 1, { fill: 'none' })); };
  if (v === 'a') bx(20, 32, 24, 20); if (v === 'b') { bx(8, 36, 22, 16); bx(32, 36, 22, 16); bx(19, 22, 22, 16); } if (v === 'c') { bx(22, 34, 20, 18); t.add(path('M26 34q6-12 14-4q-2 6-8 8Z', '#e0583f', 1, ink('#5a2a1a', .7, .7)), circ(30, 28, 2.2, '#fff', .8)); }
  out(t, 'props', 'crate', v, ['obstacle', 'village']);
}
for (const [v, s] of [['a', 40], ['b', 41]]) { // hay bale / sacks
  const t = mk('props', 'haybale', v); t.add(sh(34, 53, 20, 5));
  if (v === 'a') { t.add(path('M14 34Q14 26 22 26H42Q50 26 50 34V50H14Z', t.lg(['#f0d98a', '#d4b252'], 90), 1, ink('#8a6a28', 1, .8)), line('M14 36H50M14 44H50M28 26V50M40 26V50', '#a88a34', 1.1, .6), line('M20 28l-3-4M26 28l1-5M44 28l3-4', '#d4b252', 1.4, .9)); }
  else { t.add(path('M20 52Q14 44 20 34Q32 28 44 34Q50 44 44 52Z', t.lg(['#e8d8b0', '#c6b080'], 90), 1, ink('#8a6a28', 1, .8)), line('M24 36q8 3 16 0', '#8a6a28', 1.4), path('M26 34q6-6 12 0', '#e8d8b0', 1, ink('#8a6a28', .8, .7)), line('M22 46q10 3 20 0', '#a88a34', 1, .5)); }
  out(t, 'props', v === 'a' ? 'haybale' : 'sack', v === 'a' ? 'a' : 'a', ['obstacle', 'village']);
}
for (const [v, s] of [['a', 50], ['b', 51]]) { // log pile / fallen log
  const t = mk('props', 'log', v); t.add(sh(34, 51, 22, 5));
  if (v === 'a') { t.add(path('M8 42Q6 36 12 34H50Q58 36 56 44Q54 50 48 50H12Q8 50 8 42Z', t.lg(P.bark, 90), 1, ink(P.inkW, 1, .8)), ell(54, 42, 4, 7, '#e2c892', 1, 0, ink(P.inkW, .9, .8)), ell(54, 42, 2, 3.6, 'none', 1, 0, { fill: 'none', stroke: '#b88e5a', 'stroke-width': .8 }), line('M16 38q10-2 20 0M20 45q10 2 22 0', P.bark[2], 1, .4), path('M24 34q6-5 12 0Z', '#86b865', .95)); }
  else { for (const [x, y] of [[20, 46], [38, 46], [29, 36]]) t.add(path(`M${x - 14} ${y - 5}H${x + 14}V${y + 5}H${x - 14}Z`, t.lg(P.bark, 90), 1, ink(P.inkW, 1, .8)), ell(x + 14, y, 3.6, 5, '#e2c892', 1, 0, ink(P.inkW, .9, .8)), ell(x + 14, y, 1.7, 2.5, 'none', 1, 0, { fill: 'none', stroke: '#b88e5a', 'stroke-width': .8 })); }
  out(t, 'props', 'log', v, ['obstacle']);
}
{ // well + scarecrow + bench + flowerpot as extra village dressing
  const t = mk('props', 'scarecrow', 'a', T, 128); t.add(sh(34, 114, 14, 4.5));
  t.add(rect(30, 40, 4, 74, t.lg(P.bark, 0), 1, 1, ink(P.inkW, .9, .8)), rect(10, 58, 44, 4, t.lg(P.bark, 90), 1.5, 1, ink(P.inkW, .9, .8)));
  t.add(path('M24 58Q32 50 40 58L42 84Q32 90 22 84Z', t.lg(['#7a8fc0', '#4d639a'], 0), 1, ink(P.inkB, 1, .8)), path('M24 70H40V74H24Z', '#e8a83a', .8), line('M12 62q-2 6 0 10M52 62q2 6 0 10M26 88l-1 8M38 88l1 8', '#d9bc8a', 2, .95));
  t.add(circ(32, 40, 9, '#f0d98a', 1, ink('#8a6a28', 1, .8)), path('M20 38Q32 20 44 38Q32 34 20 38Z', '#a8844f', 1, ink(P.inkW, .9, .8)), path('M24 36Q32 26 40 36Z', '#c9a06a', 1), circle2(t));
  function circle2(t) { return circ(29, 41, 1.2, '#3b2a1a') + circ(35, 41, 1.2, '#3b2a1a') + line('M29 45q3 2 6 0', '#3b2a1a', 1, .8); }
  out(t, 'props', 'scarecrow', 'a', ['tall', 'village', 'rice-terraces']);
}
{ const t = mk('props', 'well', 'a', T, 128); t.add(sh(34, 114, 24, 6));
  t.add(path('M12 110Q10 92 14 84H50Q54 92 52 110Q32 118 12 110Z', t.lg(P.stone, 0), 1, ink(P.inkR, 1, .8)), ell(32, 84, 18, 6, '#4f8aa8', 1, 0, ink(P.inkR, 1, .8)), ell(32, 84, 15, 4, '#2a5a7a', .8));
  t.add(rect(14, 50, 4, 36, t.lg(P.bark, 0), 1, 1, ink(P.inkW, .9, .8)), rect(46, 50, 4, 36, t.lg(P.bark, 0), 1, 1, ink(P.inkW, .9, .8)), path('M8 54L32 36L56 54L52 56H12Z', t.lg(['#7a8fc0', '#33456f'], 90), 1, ink(P.inkB, 1, .8)), line('M32 56v20', '#8a6a44', 1.2), rect(28, 76, 8, 6, '#a8844f', 1, 1, ink(P.inkW, .8, .8)));
  out(t, 'props', 'well', 'a', ['tall', 'village']); }
{ const t = mk('props', 'bench', 'a'); t.add(sh(34, 52, 24, 5));
  t.add(rect(10, 28, 44, 6, t.lg(['#d9bc8a', '#b08050'], 90), 2, 1, ink(P.inkW, 1, .8)), rect(8, 38, 48, 6, t.lg(['#e2c892', '#b88e5a'], 90), 2, 1, ink(P.inkW, 1, .8)), rect(14, 44, 5, 8, P.bark[1], 1, 1, ink(P.inkW, .8, .8)), rect(45, 44, 5, 8, P.bark[1], 1, 1, ink(P.inkW, .8, .8)), rect(12, 34, 4, 4, P.bark[1], 0), rect(48, 34, 4, 4, P.bark[1], 0));
  out(t, 'props', 'bench', 'a', ['decor']); }
