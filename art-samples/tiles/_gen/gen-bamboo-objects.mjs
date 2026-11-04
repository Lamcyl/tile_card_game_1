// Bamboo Valley objects: bamboo clumps, plants, stones, props, huts/tea house/bridges/waterfall, overlays.
import { T, P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, maker, SUBS, sh, trunk, bloom, scat, sparkle, glowC, broad, rockS, fronds, blobPath, mush, leafS, C4 } from './sub.mjs';
import { wrapped } from './lib.mjs';
import { BAM, blade, spray, culm, clump, bambooLeaves } from './bamboo-lib.mjs';
import { koi, ripple, ring, stoneW, pebbleSmall } from './water-lib.mjs';

const SUB = SUBS.bamboo, { mk, out } = maker(SUB);
const R = (s) => rng(hash(s));
const grassTufts = (t, y = 114) => t.add(tuft(18, y, '#5f8f4c', .8, .7), tuft(46, y + 2, '#5f8f4c', .8, .7));
const shootS = (x, y, s = 1, tall = 1) => ell(x + 1, y + 1.2, 4 * s, 1.3 * s, '#3b3a24', .16) + path(`M${f(x - 2.2 * s)} ${f(y)}Q${f(x - 2 * s)} ${f(y - 7 * s * tall)} ${f(x + .3)} ${f(y - 11 * s * tall)}Q${f(x + 2.4 * s)} ${f(y - 6 * s * tall)} ${f(x + 2.4 * s)} ${f(y)}Z`, '#c9a86a', 1, ink('#6b4a2c', .6, .75)) + line(`M${f(x - 1.5 * s)} ${f(y - 7 * s * tall)}Q${f(x)} ${f(y - 8.4 * s * tall)} ${f(x + 1)} ${f(y - 10 * s * tall)}`, '#8ac060', 1.4, .9);

// ============================ bamboo (tall 64x128) ============================
const TALL = [
  ['bamboo-green', 'a', BAM.green, { n: 6, hMin: 78, hMax: 104, seed: 601 }], ['bamboo-green', 'b', BAM.green, { n: 7, hMin: 70, hMax: 100, spread: 18, seed: 602 }], ['bamboo-green', 'c', BAM.green, { n: 5, hMin: 84, hMax: 106, spread: 13, seed: 603 }],
  ['bamboo-golden', 'a', BAM.golden, { n: 6, hMin: 78, hMax: 104, seed: 611 }], ['bamboo-golden', 'b', BAM.golden, { n: 7, hMin: 72, hMax: 100, spread: 17, seed: 612 }],
  ['bamboo-black', 'a', BAM.black, { n: 6, hMin: 78, hMax: 104, seed: 621 }], ['bamboo-black', 'b', BAM.black, { n: 5, hMin: 80, hMax: 106, spread: 13, seed: 622 }],
  ['bamboo-young', 'a', BAM.young, { n: 7, hMin: 40, hMax: 62, spread: 16, w: 3.4, leaves: 6, seed: 631 }], ['bamboo-young', 'b', BAM.young, { n: 5, hMin: 50, hMax: 74, spread: 13, w: 3.6, leaves: 7, seed: 632 }],
  ['bamboo-slender', 'a', BAM.green, { n: 3, hMin: 90, hMax: 110, spread: 8, w: 3.4, leaves: 10, seed: 641 }], ['bamboo-slender', 'b', BAM.golden, { n: 3, hMin: 88, hMax: 108, spread: 8, w: 3.4, leaves: 10, seed: 642 }],
];
for (const [name, v, pal, o] of TALL) {
  const t = mk('trees', name, v, T, 128), r = rng(o.seed);
  t.add(sh(34, 114, 11 + (o.spread || 16), 5.5));
  if (name === 'bamboo-young') for (const [x, y] of [[14, 114], [50, 116], [32, 118]]) t.add(shootS(x, y, .8, .8));
  t.add(clump(t, r, { by: 112, pal, ...o }));
  t.add(ell(32, 113, 14, 2.4, '#2e2c1a', .12), tuft(16, 116, '#5f8f4c', .8, .7), tuft(48, 118, '#5f8f4c', .8, .7));
  if (v === 'b' && name === 'bamboo-green') t.add(shootS(50, 116, .9), shootS(15, 117, .7));
  out(t, 'trees', name, v, ['tall', 'bamboo', 'obstacle', name.split('-')[1]]);
}
{ const t = mk('trees', 'bamboo-mixed', 'a', T, 128), r = rng(651); t.add(sh(34, 114, 28, 6));
  for (const [cx, pal, o] of [[20, BAM.golden, { n: 3, hMin: 76, hMax: 96, spread: 8 }], [44, BAM.black, { n: 3, hMin: 82, hMax: 104, spread: 8 }], [32, BAM.green, { n: 4, hMin: 70, hMax: 100, spread: 10 }]]) t.add(clump(t, r, { cx, by: 112, pal, ...o }));
  grassTufts(t, 116); out(t, 'trees', 'bamboo-mixed', 'a', ['tall', 'bamboo', 'obstacle']); }
// small bamboo bush (one cell)
for (const [v, pal, s] of [['a', BAM.green, 661], ['b', BAM.golden, 662], ['c', BAM.young, 663]]) {
  const t = mk('trees', 'bamboo-bush', v), r = rng(s); t.add(sh(34, 54, 18, 4.5));
  t.add(clump(t, r, { cx: 32, by: 52, n: 5, hMin: 22, hMax: 34, spread: 12, w: 3, pal, leaves: 6, lean: 3 }));
  t.add(tuft(14, 54, '#5f8f4c', .8, .6), tuft(50, 55, '#5f8f4c', .8, .6)); out(t, 'trees', 'bamboo-bush', v, ['bush', 'bamboo', 'obstacle']);
}
// grove giants (128x128): dense stands that close a trail
for (const [v, pal, s] of [['a', BAM.green, 671], ['b', BAM.golden, 672]]) {
  const t = mk('trees', 'bamboo-stand', v, 128, 128), r = rng(s); t.add(sh(68, 116, 52, 8));
  for (const [cx, sp, n] of [[38, 18, 6], [90, 18, 6], [64, 22, 8]]) t.add(clump(t, r, { cx, by: 114, n, hMin: 88, hMax: 120, spread: sp, w: 4.6, pal: r() < .5 || v === 'b' ? pal : BAM.green, leaves: 9, lean: 4 }));
  t.add(tuft(24, 119, '#5f8f4c', .8, .9), tuft(104, 120, '#5f8f4c', .8, .9), shootS(60, 120, 1, 1)); out(t, 'trees', 'bamboo-stand', v, ['large', 'bamboo', 'obstacle']);
}
// companions: plum in blossom, twisted pine, maple (the three friends of winter + autumn colour)
for (const [name, v, cols, s, kw] of [['plum-blossom', 'a', P.blossom, 681, { cr: 20, cy: 52 }], ['plum-blossom', 'b', ['#fff4f4', '#f6d0da', '#e0a0b6'], 682, { cr: 21, cy: 50, lean: 2 }], ['maple-valley', 'a', P.maple, 683, { cr: 22, cy: 50 }], ['maple-valley', 'b', ['#f6c85a', '#e08a2e', '#b05a22'], 684, { cr: 21, cy: 51 }]]) {
  const t = mk('trees', name, v, T, 128); broad(t, { ...kw, seed: s, cols, trunkH: 42, tw: 4.2, barkCols: ['#7a5e40', '#5a4028', '#3a2818'] });
  t.add(...[[22, 118, 20], [42, 120, -30], [34, 122, 70]].map(([x, y, a]) => name === 'plum-blossom' ? ell(x, y, 3, 1.4, cols[1], .9, a) : leafS(x, y, a, cols[1], .8)));
  out(t, 'trees', name, v, ['tall', 'obstacle', name.split('-')[0]]);
}
for (const v of ['a', 'b']) {   // twisted pine on a bank
  const t = mk('trees', 'pine-twisted', v, T, 128), r = rng(691 + (v === 'b' ? 5 : 0)), s = v === 'b' ? -1 : 1; t.add(sh(34, 114, 20, 6));
  t.add(path(`M${32 - 7 * s} 114Q${32 + 3 * s} 98 ${32 - 4 * s} 82Q${32 - 12 * s} 64 ${32 + 2 * s} 48L${32 + 8 * s} 50Q${32 - 4 * s} 66 ${32 + 2 * s} 82Q${32 + 10 * s} 98 ${32 + 6 * s} 114Z`, t.lg(['#9a7650', '#6b4a2c', '#4a3220'], 0), 1, ink(P.inkW, .9, .8)));
  const pad = (x, y, rx) => { t.add(ell(x + 2, y + 3, rx, rx * .42, P.pineC[2], 1, 0, ink(P.inkG, .9, .7)), ell(x, y, rx, rx * .42, t.rg(P.pineC, .3, .3, .9), 1, 0, ink(P.inkG, .9, .7))); for (let i = 0; i < 6; i++) t.add(ell(x + r.range(-rx * .7, rx * .6), y + r.range(-rx * .2, rx * .2), 3, .9, P.pineC[0], .6, r.range(-30, 30))); };
  pad(32 - 3 * s, 46, 18); pad(32 + 12 * s, 66, 14); pad(32 - 14 * s, 76, 12); pad(32 + 3 * s, 30, 11);
  grassTufts(t); out(t, 'trees', 'pine-twisted', v, ['tall', 'pine', 'obstacle']);
}

// ============================ plants & stones ============================
for (const [v, s] of [['a', 701], ['b', 702], ['c', 703]]) {   // bamboo shoots in clusters (cell, obstacle-free)
  const t = mk('grass', 'bamboo-shoots', v), r = rng(s); t.add(ell(34, 54, 18, 3.5, '#3b3a24', .1));
  for (const [x, y] of [[22, 48], [38, 52], [32, 40], [46, 44], [18, 40]].slice(0, 3 + (v === 'c' ? 2 : v === 'b' ? 1 : 0))) t.add(shootS(x, y + 4, r.range(.9, 1.3), r.range(.9, 1.5)));
  t.add(bambooLeaves(26, 54, 10, '#d8c460'), tuft(46, 56, '#5f8f4c', .8, .7)); out(t, 'grass', 'bamboo-shoots', v, ['concealing', 'forage', 'bamboo']);
}
for (const [v, s, cols] of [['a', 711, ['#a8e496', '#6fb560', '#3f8048']], ['b', 712, ['#cfe88a', '#8cc860', '#4a9a50']], ['c', 713, ['#7cc468', '#4a9a50', '#2f6e3a']]]) {   // sasa (dwarf bamboo grass), waist-high
  const t = mk('grass', 'sasa-clump', v), r = rng(s); t.add(ell(33, 54, 17, 4, '#2e2c1a', .12));
  for (let i = 0; i < 16; i++) { const x = 32 + r.range(-12, 12), a = -90 + r.range(-50, 50); t.add(blade(x, 54 - r.range(0, 3), a, r.range(18, 30), 2.2, cols[i % 3], '#1d4a26', .5)); }
  if (v === 'c') t.add(bloom('cornflower', 40, 30, .8)); out(t, 'grass', 'sasa-clump', v, ['concealing', 'bamboo']);
}
for (const [v, c] of [['a', ['#b890e8', '#7a5cc0']], ['b', ['#f6f0a0', '#e8c14e']]]) {   // iris at the water's edge
  const t = mk('grass', 'iris-bank', v), r = rng(721); t.add(ell(33, 54, 15, 3.5, '#2e2c1a', .12), ell(33, 55, 13, 2, '#4f8aa8', .22));
  for (let i = 0; i < 9; i++) t.add(blade(32 + r.range(-9, 9), 54, -90 + r.range(-24, 24), r.range(22, 34), 2.2, ['#6fb560', '#4a9a50', '#8cc860'][i % 3], '#1d4a26', .5));
  for (const [x, y, k] of [[24, 24, 1], [38, 18, 1.15], [32, 32, .85]]) t.add(path(`M${x} ${y + 4}Q${x - 6 * k} ${y - 2} ${x - 3 * k} ${y - 6 * k}Q${x} ${y - 2} ${x} ${y + 4}Z`, c[0], 1, ink(c[1], .6, .7)), path(`M${x} ${y + 4}Q${x + 6 * k} ${y - 2} ${x + 3 * k} ${y - 6 * k}Q${x} ${y - 2} ${x} ${y + 4}Z`, c[0], 1, ink(c[1], .6, .7)), path(`M${x - 2} ${y + 3}Q${x} ${y - 7 * k} ${x + 2} ${y + 3}Z`, c[1], 1), circ(x, y, .9, '#f6d04a'));
  out(t, 'grass', 'iris-bank', v, ['water-edge', 'bamboo', 'flowers']);
}
// stepping stones & stream rocks (transparent, sit on water or bank)
const stepStone = (t, x, y, k, moss, ringOn = true) => (ringOn ? ell(x, y + 3, 13 * k, 4.6 * k, '#f6f3e6', .5) + ell(x, y + 3, 10.4 * k, 3.4 * k, '#8cc3d3', .5) : '') + ell(x + 1.4, y + 5, 10 * k, 3 * k, '#3b3a24', .22) + path(`M${f(x - 10 * k)} ${f(y + 2)}Q${f(x - 10 * k)} ${f(y - 4 * k)} ${f(x)} ${f(y - 5 * k)}Q${f(x + 10 * k)} ${f(y - 4 * k)} ${f(x + 10.4 * k)} ${f(y + 2)}Q${f(x + 8 * k)} ${f(y + 6 * k)} ${f(x)} ${f(y + 6 * k)}Q${f(x - 8 * k)} ${f(y + 6 * k)} ${f(x - 10 * k)} ${f(y + 2)}Z`, t.lg(['#d8d8c8', '#a8aa9a', '#7d8274'], 55), 1, ink(P.inkR, .9, .8))
  + ell(x - 3 * k, y - 2.4 * k, 5 * k, 1.8 * k, '#fff', .45, -8) + (moss ? path(`M${f(x - 9 * k)} ${f(y)}Q${f(x - 5 * k)} ${f(y - 6 * k)} ${f(x + 2 * k)} ${f(y - 4 * k)}Q${f(x - 3 * k)} ${f(y - 1 * k)} ${f(x - 9 * k)} ${f(y)}Z`, '#7fae5e', .95, ink('#3f6a38', .5, .6)) : '') + line(`M${f(x + 3 * k)} ${f(y + 1 * k)}l3 2`, '#5e4e3e', .9, .5);
for (const [v, mossy, k] of [['a', false, 1], ['b', true, 1], ['c', false, .85], ['d', true, 1.1]]) { const t = mk('rocks', 'stepping-stone', v); t.add(stepStone(t, 32, 34, k, mossy)); out(t, 'rocks', 'stepping-stone', v, ['water', 'stream', 'walkable']); }
for (const [v, pts] of [['a', [[14, 22, .7], [32, 36, .8], [50, 22, .7]]], ['b', [[16, 44, .75], [34, 30, .8], [52, 16, .65]]]]) { const t = mk('rocks', 'stepping-stones', v); for (const [x, y, k] of pts) t.add(stepStone(t, x, y, k, v === 'b' && k > .7)); out(t, 'rocks', 'stepping-stones', v, ['water', 'stream', 'walkable']); }
for (const [v, s, cols, mo] of [['a', 731, ['#cfd0c4', '#a2a596', '#74786a'], false], ['b', 732, ['#e0d9c4', '#b4ad98', '#857d6c'], true], ['c', 733, ['#bfc4c0', '#8a9494', '#5e6a6a'], false], ['d', 734, ['#cfd0c4', '#a2a596', '#74786a'], true]]) {
  const t = mk('rocks', 'stream-rock', v), r = rng(s); const cx = 32, cy = 36, rx = v === 'c' ? 15 : 12, ry = v === 'c' ? 11 : 9;
  t.add(ell(cx, cy + 6, rx + 7, ry * .6 + 3, '#f6f3e6', .55), ell(cx, cy + 6, rx + 3, ry * .6, '#8cc3d3', .4), ripple(cx - rx - 4, cy + 10, 9, '#fff', .8, 1), ripple(cx + rx - 2, cy + 12, 9, '#fff', .8, 1));
  t.add(rockS(t, r, cx, cy, rx, ry, cols, { moss: mo })); out(t, 'rocks', 'stream-rock', v, ['water', 'stream', 'obstacle']);
}
for (const [v, s, mo] of [['a', 741, true], ['b', 742, false]]) {   // mossy boulder with shoots
  const t = mk('rocks', 'boulder-bamboo', v), r = rng(s); t.add(rockS(t, r, 30, 38, 17, 13, ['#e0d9c4', '#b4ad98', '#857d6c'], { moss: mo }));
  t.add(shootS(46, 52, .8), shootS(50, 50, .6), tuft(16, 54, '#4d7a40', .8, .7)); out(t, 'rocks', 'boulder-bamboo', v, ['obstacle', 'bamboo']);
}
for (const [v, s] of [['a', 751], ['b', 752]]) {   // tall ink-painting pillar rock
  const t = mk('rocks', 'rock-pillar', v, T, 128), r = rng(s); t.add(sh(36, 114, 20, 6));
  t.add(path(`M16 114Q12 96 18 78Q14 58 24 40Q24 26 34 18Q42 24 44 38Q52 56 48 78Q54 96 50 114Q32 120 16 114Z`, t.lg(['#d3d6cc', '#a2a8a0', '#6e7870'], 40), 1, ink(P.inkR, 1.1, .85)));
  for (let i = 0; i < 5; i++) t.add(line(`M${f(r.range(20, 44))} ${f(r.range(30, 100))}l${f(r.range(-4, 4))} ${f(r.range(8, 18))}`, '#4a5a56', 1.2, .5));
  t.add(path('M20 80Q22 60 28 44Q30 56 26 80Z', '#fff', .3), path(`M18 112Q22 100 30 104Q26 110 18 112Z`, '#7fae5e', .95, ink('#3f6a38', .5, .6)), path('M36 28Q40 20 44 26Q40 32 36 28Z', '#6fa050', .95), tuft(46, 116, '#4d7a40', .8, .7));
  out(t, 'rocks', 'rock-pillar', v, ['tall', 'obstacle', 'scenery']);
}

// ============================ props ============================
const STONE = ['#e6e3d4', '#b4b09c', '#7d7a6a'];
function lantern(t, { lit = false, moss = false, event = false, k = 1 }) {
  const cx = 32, by = 112, g = t.lg(STONE, 0), ln = ink(P.inkR, .9, .8);
  t.add(sh(34, by + 2, 15, 4.5));
  if (lit) t.add(glowC(t, cx, 82, 26, '#ffe6a0', '#ffc45a', .75));
  t.add(path(`M${cx - 13} ${by + 1}Q${cx - 13} ${by - 7} ${cx - 8} ${by - 8}H${cx + 8}Q${cx + 13} ${by - 7} ${cx + 13} ${by + 1}Z`, g, 1, ln), ell(cx - 5, by - 6, 4, 1.2, '#fff', .45));       // base
  t.add(path(`M${cx - 4} ${by - 8}L${cx - 3.4} ${by - 28}H${cx + 3.4}L${cx + 4} ${by - 8}Z`, g, 1, ln), rect(cx - 2.6, by - 26, 1.2, 16, '#fff', 0, .3));              // pole
  t.add(path(`M${cx - 12} ${by - 28}Q${cx} ${by - 33} ${cx + 12} ${by - 28}L${cx + 10} ${by - 25}Q${cx} ${by - 22} ${cx - 10} ${by - 25}Z`, g, 1, ln));                    // dais
  t.add(rect(cx - 8.5, by - 44, 17, 16, lit ? t.lg(['#ffe9b0', '#ffb04a'], 90) : t.lg(['#d8d4c0', '#8f8c7a'], 0), 1, 1, ln));                                              // firebox
  t.add(rect(cx - 5, by - 41, 10, 10, lit ? '#fff3c8' : '#4a463c', 1.5, 1, ink('#5e4e3e', .6, .7)), line(`M${cx} ${by - 41}v10M${cx - 5} ${by - 36}h10`, lit ? '#d89a3a' : '#2a2620', .8, .8));
  t.add(path(`M${cx - 20} ${by - 44}Q${cx - 6} ${by - 49} ${cx} ${by - 62}Q${cx + 6} ${by - 49} ${cx + 20} ${by - 44}Q${cx} ${by - 40} ${cx - 20} ${by - 44}Z`, t.lg(['#eeeadb', '#a09c88', '#74705e'], 60), 1, ln), path(`M${cx - 16} ${by - 46}Q${cx - 4} ${by - 50} ${cx} ${by - 59}Q${cx - 4} ${by - 49} ${cx - 16} ${by - 46}Z`, '#fff', .45));
  t.add(circ(cx, by - 63, 3.2, g, 1, ln), circ(cx - 1, by - 64, 1, '#fff', .6));
  if (moss) t.add(path(`M${cx - 14} ${by - 45}Q${cx - 8} ${by - 52} ${cx - 1} ${by - 55}Q${cx - 3} ${by - 49} ${cx - 8} ${by - 45}Z`, '#7fae5e', .95, ink('#3f6a38', .5, .6)), path(`M${cx - 13} ${by}q3-7 6-3q1 3-1 5Z`, '#7fae5e', .95), path(`M${cx + 5} ${by - 8}q4-5 7-2q-2 4-7 2Z`, '#7fae5e', .9));
  if (event) { t.add(sparkle(cx + 14, by - 70, 1, '#fff6c0'), sparkle(cx - 16, by - 58, .7, '#fff6c0'), sparkle(cx + 18, by - 46, .6, '#fff6c0')); }
  t.add(tuft(cx - 16, by + 4, '#5f8f4c', .8, .7), tuft(cx + 16, by + 5, '#5f8f4c', .8, .7));
}
for (const [v, o] of [['a', {}], ['b', { lit: true }], ['c', { moss: true }], ['d', { lit: true, moss: true, event: true }]]) { const t = mk('props', 'stone-lantern', v, T, 128); lantern(t, o); out(t, 'props', 'stone-lantern', v, ['tall', 'lantern', 'obstacle', o.lit ? 'lit' : 'unlit', ...(o.event ? ['event'] : [])]); }
for (const v of ['a', 'b']) {   // shishi-odoshi: bamboo deer-scarer tipping into a stone basin
  const t = mk('props', 'shishi-odoshi', v), tip = v === 'b'; t.add(sh(34, 56, 17, 4));
  t.add(path('M12 56Q10 44 16 40H48Q54 44 52 56Q32 60 12 56Z', t.lg(STONE, 60), 1, ink(P.inkR, .9, .8)), ell(32, 41, 15.5, 4.4, '#8cc3d3', 1, 0, ink('#4f8aa8', .8, .7)), ell(30, 40.4, 8, 1.6, '#f6f3e6', .6), rect(26, 20, 5, 36, t.lg(BAM.green.culm, 0), 1, 1, ink('#1d4a26', .8, .8)), rect(46, 20, 5, 36, t.lg(BAM.green.culm, 0), 1, 1, ink('#1d4a26', .8, .8)));
  t.add(rect(24, 18, 30, 3, '#8a6a44', 1, 1, ink(P.inkW, .7, .8)));
  const sp = tip ? 'rotate(26 40 25)' : 'rotate(-14 40 25)';
  t.add(`<g transform="${sp}">`, rect(14, 22, 38, 6.4, t.lg(BAM.green.culm, 90), 3.2, 1, ink('#1d4a26', .8, .8)), ell(14.5, 25.2, 1.5, 2.8, '#2e5a2a', 1), rect(24, 22.5, 1, 5.5, BAM.green.node, 0, .8), '</g>');
  t.add(rect(8, 8, 3.4, 10, t.lg(BAM.green.culm, 0), 1.2, 1, ink('#1d4a26', .6, .7)), line('M10 18Q9 28 19 36', '#8cc3d3', 2.6, .85)); if (tip) t.add(line('M16 38l-3 5M20 38l1 6', '#fff', 1.2, .8), ring(26, 42, 6, '#fff', .8));
  out(t, 'props', 'shishi-odoshi', v, ['obstacle', 'garden', tip ? 'tipped' : 'filling']);
}
{ const t = mk('props', 'tsukubai', 'a'); t.add(sh(34, 56, 18, 4));
  t.add(path('M10 54Q8 40 18 32H46Q56 40 54 54Q32 60 10 54Z', t.lg(['#d3d6cc', '#a2a8a0', '#6e7870'], 60), 1, ink(P.inkR, .9, .8)), ell(32, 33, 15, 4.6, '#7f8a84', 1), ell(32, 34, 13, 3.4, '#8cc3d3', 1), ell(30, 33.4, 6, 1.2, '#fff', .55));
  t.add(rect(46, 10, 4, 22, t.lg(BAM.green.culm, 0), 1.5, 1, ink('#1d4a26', .7, .8)), line('M48 12Q40 12 36 30', '#8cc3d3', 2, .8), line('M14 30h-4', 'none', 1), rect(12, 20, 20, 3, '#a87c46', 1.5, 1, ink(P.inkW, .6, .8)), rect(30, 20.4, 7, 2.4, '#a87c46', 1, 1, ink(P.inkW, .5, .8)), tuft(14, 54, '#4d7a40', .8, .7), path('M44 50q4-6 8-3q-2 4-8 3Z', '#7fae5e', .95)); out(t, 'props', 'tsukubai', 'a', ['obstacle', 'garden']); }
for (const [v, pal] of [['a', BAM.green], ['b', BAM.golden]]) {   // bench of bamboo poles
  const t = mk('props', 'bamboo-bench', v); t.add(sh(34, 54, 22, 4.5));
  for (const x of [14, 50]) t.add(rect(x - 2.4, 34, 4.8, 22, t.lg(pal.culm, 0), 1.5, 1, ink(pal.inkc, .8, .75)));
  for (const y of [26, 33, 40]) t.add(rect(8, y - 3, 48, 6, t.lg(pal.culm, 90), 3, 1, ink(pal.inkc, .8, .75)), rect(10, y - 2, 44, 1.1, '#fff', .5, .35), ...[20, 32, 44].map(x => rect(x - .6, y - 3, 1.2, 6, pal.node, 0, .6)));
  t.add(rect(14, 47, 36, 2.4, pal.node, 1, .5), tuft(10, 58, '#5f8f4c', .8, .6)); out(t, 'props', 'bamboo-bench', v, ['obstacle', 'seat']);
}
for (const [v, pal] of [['a', BAM.green], ['b', BAM.golden]]) {   // pile of cut poles
  const t = mk('props', 'bamboo-pile', v), r = rng(761 + v.charCodeAt(0)); t.add(sh(34, 54, 24, 4.5));
  const row = (y, n, x0) => { for (let i = 0; i < n; i++) t.add(rect(x0 + i * 0, y - 3, 50 - i * 0, 6, 'none', 0, 1, { fill: 'none' })); };
  for (const [y, w, x0] of [[48, 48, 8], [41, 46, 10], [34, 44, 12], [27, 40, 14]]) { t.add(rect(x0, y - 3.2, w, 6.4, t.lg(pal.culm, 90), 3.2, 1, ink(pal.inkc, .8, .75)), rect(x0 + 2, y - 2, w - 4, 1.1, '#fff', .5, .35), ...[0, 1, 2].map(i => rect(x0 + w * (.22 + i * .26) + r.range(-2, 2), y - 3.2, 1.2, 6.4, pal.node, 0, .6)), ell(x0, y, 1.6, 3, pal.culm[2], 1, 0, ink(pal.inkc, .5, .7)), ell(x0 + w, y, 1.6, 3, pal.culm[1], 1, 0, ink(pal.inkc, .5, .7))); }
  t.add(rect(26, 22, 3.4, 30, '#a88a4a', 1, 1, ink('#6b5a28', .5, .7)), rect(40, 24, 3.4, 28, '#a88a4a', 1, 1, ink('#6b5a28', .5, .7)), tuft(8, 56, '#5f8f4c', .8, .6)); out(t, 'props', 'bamboo-pile', v, ['obstacle']);
}
for (const [v, shoots] of [['a', true], ['b', false]]) {   // woven basket
  const t = mk('props', 'bamboo-basket', v); t.add(sh(34, 54, 16, 4));
  t.add(path('M14 28Q12 50 24 54H42Q54 50 50 28Z', t.lg(['#e6c880', '#c49a50', '#8a6420'], 0), 1, ink('#6b4a1c', .9, .8)));
  for (let y = 32; y < 52; y += 4.4) t.add(line(`M14 ${y}Q32 ${y + 4} 50 ${y}`, '#8a6420', .9, .55));
  for (let x = 20; x < 46; x += 5) t.add(line(`M${x} 29V53`, '#f0d8a0', .8, .4));
  t.add(ell(32, 28, 18.4, 5, '#8a6420', 1, 0, ink('#6b4a1c', .9, .8)), ell(32, 28.6, 16, 3.6, v === 'a' ? '#5a3c18' : '#7a5628', 1));
  if (shoots) for (const [x, y, k] of [[24, 28, 1], [32, 24, 1.2], [40, 28, .9]]) t.add(shootS(x, y + 4, k, 1));
  else for (const [x, y] of [[22, 28], [34, 25], [42, 29]]) t.add(blade(x, y + 2, -90 + (x - 32) * 2, 18, 2, '#6fb560', '#1d4a26', .5));
  t.add(path('M16 30Q32 6 48 30', 'none', 1, { fill: 'none', stroke: '#8a6420', 'stroke-width': 2.2, 'stroke-linecap': 'round' }), tuft(12, 56, '#5f8f4c', .8, .6)); out(t, 'props', 'bamboo-basket', v, ['obstacle', v === 'a' ? 'shoots' : 'leaves']);
}
for (const [v, what] of [['a', 'shoots'], ['b', 'radish']]) {   // drying rack (tall)
  const t = mk('props', 'drying-rack', v, T, 128), pal = BAM.golden; t.add(sh(34, 114, 24, 5));
  for (const x of [10, 54]) t.add(culm(t, x, 114, 40, 5, pal, { seg: 12, inkOp: .75 }));
  for (const y of [52, 76]) t.add(rect(6, y - 2.8, 52, 5.6, t.lg(pal.culm, 90), 2.8, 1, ink(pal.inkc, .8, .75)));
  for (const [x, y] of [[20, 52], [32, 52], [44, 52], [18, 76], [30, 76], [42, 76]]) {
    if (what === 'shoots') t.add(path(`M${x - 4} ${y}L${x + 4} ${y}L${x + 2} ${y + 18}Q${x} ${y + 21} ${x - 2} ${y + 18}Z`, '#e8d49a', 1, ink('#8a6a44', .6, .7)), path(`M${x - 3} ${y + 5}Q${x} ${y + 7} ${x + 3} ${y + 5}`, 'none', 1, { fill: 'none', stroke: '#8a6a44', 'stroke-width': .6 }), line(`M${x} ${y}v-2`, '#6b4a2c', 1));
    else t.add(line(`M${x} ${y}v6`, '#a88a4a', 1), path(`M${x - 2.6} ${y + 5}Q${x} ${y + 24} ${x + 2.6} ${y + 5}Z`, '#f6f0e0', 1, ink('#a89a80', .6, .7)), path(`M${x - 4} ${y + 3}L${x} ${y + 8}L${x + 4} ${y + 3}L${x + 1} ${y + 9}H${x - 1}Z`, '#6fb560', 1));
  }
  t.add(tuft(14, 118, '#5f8f4c', .8, .7), tuft(52, 119, '#5f8f4c', .8, .7)); out(t, 'props', 'drying-rack', v, ['tall', 'obstacle', 'village']);
}
for (const v of ['a', 'b']) {   // signpost: two hanging plank arrows on a pole
  const t = mk('props', 'sign-bamboo', v, T, 128), pal = BAM.green; t.add(sh(34, 114, 11, 4));
  t.add(culm(t, 32, 114, 48, 5, pal, { seg: 12, inkOp: .75 }), ell(32, 47, 2.6, 1.3, '#3f7030', 1));
  const arrow = (y, dir, w) => path(dir > 0 ? `M20 ${y - 6}H${20 + w}L${28 + w} ${y}L${20 + w} ${y + 6}H20Z` : `M${44 - w} ${y - 6}H44V${y + 6}H${44 - w}L${36 - w} ${y}Z`, t.lg(['#e2c892', '#b88e5a'], 90), 1, ink(P.inkW, .8, .8));
  t.add(arrow(62, 1, 20), arrow(80, -1, 18), line('M24 59h14M24 65h10', P.inkW, .9, .6), line('M30 80h12', P.inkW, .9, .6), tuft(18, 118, '#5f8f4c', .8, .7), v === 'b' ? bambooLeaves(40, 118, 20, '#d8c460') : '');
  out(t, 'props', 'sign-bamboo', v, ['tall', 'sign', 'obstacle']);
}
{ const t = mk('props', 'wind-chime-pole', 'a', T, 128), pal = BAM.green; t.add(sh(34, 114, 10, 4)); t.add(culm(t, 22, 114, 30, 5, pal, { seg: 12, inkOp: .75 }), rect(20, 28, 28, 4, '#8a6a44', 2, 1, ink(P.inkW, .7, .8)));
  for (const [x, len] of [[28, 26], [36, 34], [44, 22]]) t.add(line(`M${x} 32v10`, '#8a6a44', .8), rect(x - 2, 42, 4, len, t.lg(pal.culm, 0), 2, 1, ink(pal.inkc, .7, .8)), rect(x - 1.4, 42 + len, 2.8, 5, '#f6f0e0', 1, 1, ink('#a89a80', .5, .7)));
  t.add(tuft(16, 118, '#5f8f4c', .8, .7)); out(t, 'props', 'wind-chime-pole', 'a', ['tall', 'obstacle', 'village']); }
for (const v of ['a', 'b']) {   // fish trap in the stream
  const t = mk('props', 'fish-trap', v), r = rng(771); t.add(ell(32, 46, 22, 8, '#f6f3e6', .5), ell(32, 46, 17, 5.5, '#8cc3d3', .5), ripple(8, 54, 10, '#fff', .8, 1), ripple(46, 56, 10, '#fff', .8, 1));
  t.add(`<g transform="rotate(${v === 'a' ? -8 : 10} 32 38)">`, path('M12 36Q12 26 24 26H46Q54 28 52 40Q50 50 38 50H22Q12 48 12 36Z', t.lg(['#e6c880', '#c49a50', '#8a6420'], 55), 1, ink('#6b4a1c', .9, .8)), ...[0, 1, 2, 3, 4].map(i => line(`M${16 + i * 8} 28Q${14 + i * 8} 38 ${18 + i * 8} 49`, '#8a6420', .9, .55)), ...[0, 1].map(i => line(`M13 ${32 + i * 8}Q32 ${36 + i * 8} 52 ${32 + i * 8}`, '#6b4a1c', 1, .5)), ell(14, 36, 3, 8, '#5a3c18', 1, 0, ink('#6b4a1c', .8, .8)), '</g>');
  if (v === 'b') t.add(koi(46, 22, 20, .55, 'gold', .85)); out(t, 'props', 'fish-trap', v, ['water', 'stream', 'obstacle']);
}
{ const t = mk('props', 'well-bamboo', 'a'); t.add(sh(34, 56, 17, 4.5));
  t.add(path('M12 52Q10 36 20 32H44Q54 36 52 52Q32 58 12 52Z', t.lg(STONE, 60), 1, ink(P.inkR, 1, .8)), ell(32, 33, 14, 5, '#3a4a50', 1, 0, ink(P.inkR, .9, .8)), ell(32, 34, 11, 3.2, '#4f6a78', 1));
  for (const y of [40, 47]) t.add(line(`M13 ${y}Q32 ${y + 5} 51 ${y}`, P.inkR, .8, .45));
  t.add(rect(12, 8, 3.6, 28, t.lg(BAM.green.culm, 0), 1.2, 1, ink('#1d4a26', .7, .8)), rect(48, 8, 3.6, 28, t.lg(BAM.green.culm, 0), 1.2, 1, ink('#1d4a26', .7, .8)), rect(9, 6, 46, 4, '#8a6a44', 2, 1, ink(P.inkW, .7, .8)), line('M32 10v14', '#a88a4a', 1), rect(28, 24, 8, 8, t.lg(['#e6c880', '#8a6420'], 0), 1.5, 1, ink('#6b4a1c', .7, .8)), tuft(12, 56, '#4d7a40', .8, .7)); out(t, 'props', 'well-bamboo', 'a', ['obstacle', 'village']); }
{ const t = mk('props', 'tea-stool-parasol', 'a', T, 128); t.add(sh(34, 114, 20, 5));
  t.add(rect(30, 56, 3.4, 56, t.lg(BAM.golden.culm, 0), 1.2, 1, ink(BAM.golden.inkc, .7, .8)));
  t.add(path('M6 62Q10 30 32 20Q54 30 58 62Q45 56 32 62Q19 56 6 62Z', t.lg(['#e8604a', '#c8352b', '#8e2118'], 40), 1, ink('#4a1410', 1, .8)), path('M32 20L32 62M32 20L18 60M32 20L46 60', 'none', 1, { fill: 'none', stroke: '#4a1410', 'stroke-width': .8, 'stroke-opacity': .5 }), path('M14 44Q22 30 32 28Q24 34 20 50Z', '#fff', .25), circ(32, 19, 2, '#c49a50'));
  t.add(rect(14, 94, 36, 5, '#a87c46', 2, 1, ink(P.inkW, .8, .8)), rect(18, 99, 4, 14, '#8a6a44', 1), rect(42, 99, 4, 14, '#8a6a44', 1), rect(20, 90, 14, 5, '#c8352b', 2, 1, ink('#4a1410', .7, .8)), ell(40, 90, 4, 3.2, '#f6f0e0', 1, 0, ink('#a89a80', .6, .7)), tuft(12, 118, '#5f8f4c', .8, .7)); out(t, 'props', 'tea-stool-parasol', 'a', ['tall', 'obstacle', 'shop']); }

// ============================ plank bridges (cell pieces, transparent over water) ============================
const PL = { a: ['#e8cf9a', '#c49a5a', '#8a6038'], b: ['#cfc08c', '#a08a58', '#6b5a3a'], c: ['#e8cf9a', '#c49a5a', '#8a6038'] };
function bridgePiece(t, dir, part, style) {
  const pl = PL[style], moss = style === 'b', rail = style === 'c', ln = ink('#4a3220', .8, .75);
  const H = dir === 'h', a = (x, y, w, h, fill, rx = 0, op = 1, ex = {}) => H ? rect(x, y, w, h, fill, rx, op, ex) : rect(y, x, h, w, fill, rx, op, ex);   // a(): along-axis x, across y
  const lo = part.startsWith('end-') && (part === 'end-w' || part === 'end-n') ? 6 : 0, hi = part.startsWith('end-') && (part === 'end-e' || part === 'end-s') ? 58 : 64;
  const C = 32, W = 11; // half deck width
  // water shadow under the deck + rail posts
  t.add(a(lo - 2, C + W + 1, hi - lo + 4, 7, '#1d4a63', 3, .22));
  t.add(a(lo, C - W - 2, hi - lo, 3.4, '#6b4a2c', 0, 1, ln)); // back beam
  if (rail) t.add(a(lo, C - W - 16, hi - lo, 1.6, '#c9b070', 0, 1), a(lo, C - W - 10, hi - lo, 1.6, '#c9b070', 0, 1));
  // deck
  t.add(a(lo, C - W, hi - lo, 2 * W, t.lg(pl, H ? 90 : 0), 0, 1));
  for (let p = Math.ceil(lo / 6) * 6; p < hi + .1; p += 6) t.add(a(p - .5, C - W, 1, 2 * W, '#4a3220', 0, .55), a(p + .8, C - W + 1, 1, 2 * W - 2, '#fff', 0, .18));
  t.add(a(lo, C - W, hi - lo, 1.4, '#fff', 0, .35), a(lo, C + W - 1.4, hi - lo, 1.4, '#4a3220', 0, .35));
  if (moss) for (const [p, w] of [[10, 9], [34, 12], [52, 7]]) if (p > lo && p + w < hi + 2) t.add(path(H ? `M${p} ${C - W}q${w / 2} -3 ${w} 0q-1 6 -${w * .4} 7q-${w * .3} -3 -${w * .6} -1Z` : `M${C - W} ${p}q-3 ${w / 2} 0 ${w}q6 -1 7 -${w * .4}q-3 -${w * .3} -1 -${w * .6}Z`, '#7fae5e', .9));
  t.add(a(lo, C + W, hi - lo, 4, t.lg(['#8a6038', '#4a3220'], 90), 0, 1, ln));   // front beam
  // posts
  const postsAt = part === 'mid' ? [] : [part === 'end-w' || part === 'end-n' ? lo + 3 : hi - 3];
  for (const p of rail ? [...new Set([...postsAt, 16, 48])].filter(p => p > lo && p < hi) : postsAt) {
    if (H) { t.add(a(p - 2.4, C - W - 9, 4.8, 9, t.lg(['#a87c46', '#6b4a2c'], 0), 1, 1, ln)); t.add(a(p - 2.6, C + W - 4, 5.2, 16, t.lg(['#a87c46', '#6b4a2c'], 0), 1.2, 1, ln), a(p - 2.6, C + W - 4, 5.2, 2, '#e2c892', 1, .6)); }
    else for (const x of [C - W - 5, C + W + .4]) t.add(rect(x, p - 10, 4.6, 14, t.lg(['#a87c46', '#6b4a2c'], 0), 1.2, 1, ln), rect(x, p - 10, 4.6, 2, '#e2c892', 1, .6));
  }
  if (rail) { for (const y of [C + W - 8, C + W + 2]) t.add(a(lo, y, hi - lo, 1.5, '#d8c88c', 0, 1, ink('#6b5a28', .4, .6))) }
  if (part !== 'mid') { // abutment sill where the bridge meets land
    const e = part === 'end-w' || part === 'end-n' ? lo - 2 : hi - 2; t.add(a(e, C - W - 3, 4, 2 * W + 8, '#6b4a2c', 1.2, 1, ln), a(e + .6, C - W - 2, 1.4, 2 * W + 6, '#e2c892', 0, .5));
  }
}
for (const style of ['a', 'b', 'c']) for (const [dir, parts] of [['h', ['end-w', 'mid', 'end-e']], ['v', ['end-n', 'mid', 'end-s']]]) for (const part of parts) {
  const t = mk('props', `bridge-plank-${dir}-${part}`, style); bridgePiece(t, dir, part, style); out(t, 'props', `bridge-plank-${dir}-${part}`, style, ['bridge', 'walkable', 'water', dir === 'h' ? 'east-west' : 'north-south', part.startsWith('end') ? 'end' : 'mid']);
}

// ============================ interest (128x128): huts, hut gate, tea house, arched bridge, waterfall ============================
const STRAW = ['#f8e29a', '#dcb860', '#a8823a'];
const thatchRoof = (t, d, { moss = false, seed = 1, topY = 24 } = {}) => {
  const r = rng(seed), clip = t.clip(d), id = clip.slice(5, -1); let o = path(d, t.lg(STRAW, 60), 1, ink('#6b4a1c', 1.1, .85)) + `<g clip-path="url(#${id})">`;
  for (let k = 0; k < 9; k++) { const y = topY + 8 + k * 6.6; let dd = `M0 ${f(y)}`; for (let x = 0; x <= 128; x += 8) dd += `L${x} ${f(y + (x / 8 % 2 ? 1.4 : -1.4) + r.range(-.6, .6))}`; o += line(dd, '#7a5a20', 1.1, .32) + line(dd, '#fff3c0', .7, .3, { transform: 'translate(0 -1.3)' }); }
  for (let i = 0; i < 36; i++) o += line(`M${f(r.range(14, 114))} ${f(r.range(topY + 6, topY + 58))}l${f(r.range(-2, 2))} ${f(r.range(3, 6))}`, r() < .5 ? '#7a5a20' : '#fff3c0', .8, .4);
  if (moss) for (const [x, y, w] of [[34, 58, 12], [88, 52, 10], [60, 66, 14], [100, 70, 9]]) o += path(`M${x} ${y}q${w / 2} -5 ${w} 0q-2 5 -${w * .5} 6q-${w * .3} -3 -${w * .5} -2Z`, '#7fae5e', .9);
  return o + '</g>';
};
function hut(t, { moss = false, fence = false, seed = 1, gourd = false, lantern = false }) {
  t.add(sh(66, 115, 54, 8));
  t.add(rect(26, 70, 76, 42, t.lg(['#f6ecd0', '#e0cfa0'], 90), 0, 1, ink(P.inkW, 1, .85)));
  for (const x of [26, 52, 78, 100]) t.add(rect(x - 1.6, 70, 3.6, 42, '#8a6a44', 0, 1, ink(P.inkW, .5, .6)));
  t.add(rect(26, 90, 76, 2.6, '#8a6a44', 0, .9), rect(26, 70, 76, 14, '#3b3a24', 0, .18));
  t.add(rect(54, 82, 20, 30, t.lg(['#8a6038', '#5a3c20'], 0), 2, 1, ink(P.inkW, 1, .85)), ...[0, 1, 2].map(i => line(`M${58 + i * 6} 84V112`, '#3a2818', .8, .5)), circ(70, 98, 1.3, '#e8c870'), path('M54 82Q64 74 74 82', 'none', 1, { fill: 'none', stroke: '#6b4a2c', 'stroke-width': 2 }));
  t.add(rect(80, 80, 18, 16, '#fff6dc', 1, 1, ink(P.inkW, .9, .85)), line('M89 80V96M80 88H98', P.inkW, .9, .7), rect(80, 80, 18, 16, t.rg(['#ffe9a8', '#fff6dc', '#fff6dc'], .5, .5, .7, [.5, .1, 0]), 1), rect(30, 82, 14, 12, '#fff6dc', 1, 1, ink(P.inkW, .9, .85)), line('M37 82V94M30 88H44', P.inkW, .8, .7));
  t.add(rect(24, 106, 80, 8, t.lg(['#cfd0c4', '#8a8e7c'], 90), 2, 1, ink(P.inkR, .9, .8)), ...[34, 52, 70, 88].map(x => line(`M${x} 106V114`, P.inkR, .8, .4)), ell(64, 114, 11, 2.6, '#a2a596', 1, 0, ink(P.inkR, .8, .8)));
  t.add(thatchRoof(t, 'M8 80Q16 62 38 46Q54 32 64 20Q74 32 90 46Q112 62 120 80Q64 90 8 80Z', { moss, seed }));
  t.add(path('M8 80Q64 90 120 80Q64 96 8 80Z', '#6b4a1c', .55), path('M54 22Q64 14 74 22L72 28Q64 22 56 28Z', t.lg(['#d8b05a', '#8a6420'], 90), 1, ink('#6b4a1c', .9, .85)), line('M54 20l-8 -10M74 20l8 -10', '#6b4a2c', 2.2));
  if (gourd) for (const [x, y] of [[40, 74], [48, 76]]) t.add(line(`M${x} ${y - 3}v3`, '#6b4a2c', 1), ell(x, y + 5, 3.4, 4.6, '#e8c870', 1, 0, ink('#8a6420', .6, .8)), ell(x, y + 1, 2.2, 2.4, '#e8c870', 1, 0, ink('#8a6420', .6, .8)));
  if (lantern) t.add(glowC(t, 106, 88, 11), line('M106 74v8', '#6b4a2c', 1), ell(106, 88, 4, 5.4, '#e8604a', 1, 0, ink('#4a1410', .8, .8)), rect(103, 83, 6, 1.2, '#4a1410', 0, .7), rect(103, 90, 6, 1.2, '#4a1410', 0, .7));
  if (fence) for (const x0 of [4, 106]) { for (let i = 0; i < 3; i++) t.add(culm(t, x0 + 4 + i * 6, 118, 96, 3.6, BAM.green, { seg: 8, inkOp: .7 })); t.add(rect(x0 + 1, 103, 20, 3, BAM.green.culm[1], 1.5, 1, ink('#1d4a26', .6, .7))); }
  t.add(tuft(20, 118, '#5f8f4c', .8, .9), tuft(110, 119, '#5f8f4c', .8, .9));
}
for (const [v, o] of [['a', { seed: 801 }], ['b', { seed: 802, fence: true, gourd: true }], ['c', { seed: 803, moss: true, lantern: true }]]) { const t = mk('interest', 'hut-thatched', v, 128, 128); hut(t, o); out(t, 'interest', 'hut-thatched', v, ['large', 'hut', 'obstacle', 'village']); }
// hut gate: a thatched gatehouse straddling the trail. The passage is the middle of the footprint.
for (const [v, open] of [['closed', false], ['open', true]]) {
  const t = mk('interest', 'hut-gate', v, 128, 128); t.add(sh(66, 115, 56, 8));
  t.add(rect(14, 68, 100, 46, t.lg(['#f0e4c0', '#d8c490'], 90), 0, 1, ink(P.inkW, 1.1, .85)));
  for (const x of [14, 40, 88, 112]) t.add(rect(x - 2.4, 66, 5.4, 48, t.lg(['#a87c46', '#6b4a2c'], 0), 1, 1, ink(P.inkW, .7, .8)));
  t.add(rect(14, 68, 100, 14, '#3b3a24', 0, .2), rect(14, 100, 24, 2.6, '#8a6a44', 0, .9), rect(90, 100, 24, 2.6, '#8a6a44', 0, .9));
  t.add(path('M42 114V84Q42 70 64 68Q86 70 86 84V114Z', open ? t.rg(['#ffe9b0', '#ffb04a', '#8a4a1c'], .5, .8, .9) : '#3a2818', 1, ink('#2a1c10', 1.1, .9)));
  if (open) { t.add(ell(64, 112, 16, 3, '#fff3c8', .7), path('M42 114V84Q42 74 50 71V114Z', t.lg(['#8a6038', '#5a3c20'], 0), 1, ink(P.inkW, .9, .85)), path('M86 114V84Q86 74 78 71V114Z', t.lg(['#8a6038', '#5a3c20'], 0), 1, ink(P.inkW, .9, .85))); }
  else { t.add(path('M44 114V84Q44 72 64 70Q84 72 84 84V114Z', t.lg(['#8a6038', '#5a3c20'], 0), 1, ink(P.inkW, .9, .85)), ...[50, 57, 64, 71, 78].map(x => line(`M${x} 74V114`, '#3a2818', .8, .5)), rect(44, 86, 40, 3.4, '#4a4a50', 0, 1, ink('#1d1d22', .6, .8)), rect(44, 102, 40, 3.4, '#4a4a50', 0, 1, ink('#1d1d22', .6, .8)), circ(64, 96, 3, '#e8c870', 1, ink('#8a6420', .6, .8)), rect(61, 82, 6, 8, '#f6f0e0', 1, 1, ink('#a89a80', .6, .8))); }
  t.add(rect(38, 112, 52, 4, t.lg(['#cfd0c4', '#8a8e7c'], 90), 1, 1, ink(P.inkR, .8, .8)), rect(34, 114, 60, 3, '#a2a596', 1, 1, ink(P.inkR, .7, .8)));
  t.add(thatchRoof(t, 'M2 76Q10 58 32 44Q52 28 64 18Q76 28 96 44Q118 58 126 76Q64 88 2 76Z', { seed: 811, moss: true, topY: 20 }), path('M2 76Q64 88 126 76Q64 92 2 76Z', '#6b4a1c', .55), path('M52 20Q64 10 76 20L74 27Q64 20 54 27Z', t.lg(['#d8b05a', '#8a6420'], 90), 1, ink('#6b4a1c', .9, .85)), line('M52 18l-8 -10M76 18l8 -10', '#6b4a2c', 2.4));
  for (const x of [26, 102]) t.add(open ? glowC(t, x, 92, 12) : '', line(`M${x} 76v8`, '#6b4a2c', 1), ell(x, 91, 4.6, 6, '#e8604a', 1, 0, ink('#4a1410', .8, .8)), rect(x - 3.4, 85, 6.8, 1.2, '#4a1410', 0, .7), rect(x - 3.4, 93, 6.8, 1.2, '#4a1410', 0, .7));
  t.add(tuft(8, 118, '#5f8f4c', .8, .9), tuft(118, 119, '#5f8f4c', .8, .9), shootS(104, 120, .9));
  out(t, 'interest', 'hut-gate', v, ['large', 'gate', open ? 'open' : 'closed', 'obstacle']);
}
// tea house: open front, indigo tile roof, noren curtain
for (const [v, banner] of [['a', '#ffffff'], ['b', '#fff0d0']]) {
  const t = mk('interest', 'tea-house', v, 128, 128); t.add(sh(66, 115, 54, 8));
  t.add(rect(14, 92, 100, 14, t.lg(['#c49a5a', '#8a6038'], 90), 0, 1, ink(P.inkW, 1, .85)), ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => line(`M${22 + i * 12} 94V104`, '#4a3220', .8, .4)), rect(14, 106, 100, 6, '#8a8e7c', 2, 1, ink(P.inkR, .8, .8)));
  t.add(rect(20, 62, 88, 30, t.lg(['#3a2818', '#2a1c10'], 90), 0, 1), rect(20, 62, 88, 30, t.rg(['#ffd890', '#a8621c', '#2a1c10'], .5, .9, .8, [.5, .15, 0]), 0));
  for (const x of [20, 108]) t.add(rect(x - 3, 58, 6, 36, t.lg(['#a87c46', '#6b4a2c'], 0), 1, 1, ink(P.inkW, .8, .85)));
  t.add(rect(20, 62, 88, 4, '#6b4a2c', 0, 1, ink(P.inkW, .7, .85)));
  for (const [x, w] of [[28, 22], [54, 22], [80, 22]]) t.add(path(`M${x} 66H${x + w}V${86}L${x + w - 3} 84L${x + w / 2} 88L${x + 3} 84L${x} 86Z`, banner, 1, ink('#a89a80', .8, .8)), path(`M${x + w / 2 - 4} 72Q${x + w / 2} 70 ${x + w / 2 + 4} 72Q${x + w / 2 + 3} 80 ${x + w / 2} 80Q${x + w / 2 - 3} 80 ${x + w / 2 - 4} 72Z`, '#c8352b', 1));
  t.add(rect(28, 96, 30, 8, '#c8352b', 2, 1, ink('#4a1410', .8, .8)), rect(76, 98, 24, 6, '#a87c46', 2, 1, ink(P.inkW, .8, .8)), ell(92, 96, 4, 3, '#f6f0e0', 1, 0, ink('#a89a80', .6, .7)), ell(86, 96, 3.4, 2.6, '#e8c870', 1, 0, ink('#8a6420', .6, .7)));
  const roof = 'M4 66Q10 50 34 40Q52 30 64 16Q76 30 94 40Q118 50 124 66Q64 76 4 66Z', clip = t.clip(roof), id = clip.slice(5, -1);
  t.add(path(roof, t.lg(['#7a8fc0', '#4d639a', '#33456f'], 60), 1, ink('#1d2a44', 1.1, .85)), `<g clip-path="url(#${id})">`);
  for (let k = 0; k < 7; k++) { const y = 26 + k * 7; let dd = ''; for (let x = 4 - (k % 2) * 5; x < 128; x += 10) dd += `M${x} ${y}q5 6 10 0`; t.add(line(dd, '#1d2a44', 1, .45), line(dd, '#a8b8e0', .7, .3, { transform: 'translate(0 -1.2)' })); }
  t.add('</g>', path('M4 66Q64 76 124 66Q64 82 4 66Z', '#1d2a44', .5), path('M58 17Q64 10 70 17L68 22Q64 17 60 22Z', t.lg(['#a8b8e0', '#33456f'], 90), 1, ink('#1d2a44', .8, .85)));
  t.add(glowC(t, 64, 70, 9), line('M64 66v4', '#6b4a2c', 1), ell(64, 78, 5, 6.4, '#e8604a', 1, 0, ink('#4a1410', .8, .8)), rect(60, 72, 8, 1.2, '#4a1410', 0, .7), rect(60, 82, 8, 1.2, '#4a1410', 0, .7), tuft(8, 118, '#5f8f4c', .8, .9), tuft(120, 118, '#5f8f4c', .8, .9));
  out(t, 'interest', 'tea-house', v, ['large', 'shop', 'obstacle', 'rest']);
}
// arched plank bridge (128x128, east-west)
for (const [v, rail] of [['a', true], ['b', false]]) {
  const t = mk('interest', 'bridge-arched', v, 128, 128), mid = (x0, y0, cx, cy, x1, y1, u) => [(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1];
  t.add(ell(66, 106, 56, 10, '#1d4a63', .22), ell(66, 98, 48, 6, '#f6f3e6', .35));
  const D = 'M8 98Q64 36 120 98';
  t.add(path('M8 102Q64 40 120 102', 'none', 1, { fill: 'none', stroke: '#4a3220', 'stroke-width': 7 }), path('M16 100Q64 50 112 100', 'none', 1, { fill: 'none', stroke: '#3b3a24', 'stroke-opacity': .25, 'stroke-width': 10 }));
  if (rail) t.add(path('M8 80Q64 18 120 80', 'none', 1, { fill: 'none', stroke: '#6b4a2c', 'stroke-width': 3 }), ...[0.12, .3, .5, .7, .88].map(u => { const [x, y] = mid(8, 98, 64, 36, 120, 98, u), [x2, y2] = mid(8, 80, 64, 18, 120, 80, u); return line(`M${f(x)} ${f(y - 6)}L${f(x2)} ${f(y2)}`, '#6b4a2c', 3); }));
  t.add(path(D, 'none', 1, { fill: 'none', stroke: '#4a3220', 'stroke-width': 19 }), path(D, 'none', 1, { fill: 'none', stroke: t.lg(['#e8cf9a', '#c49a5a', '#a07040'], 90), 'stroke-width': 16 }));
  for (let k = 1; k < 17; k++) { const u = k / 17, [x, y] = mid(8, 98, 64, 36, 120, 98, u), dx = 2 * (1 - u) * (64 - 8) + 2 * u * (120 - 64), dy = 2 * (1 - u) * (36 - 98) + 2 * u * (98 - 36), l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l; t.add(line(`M${f(x - nx * 8)} ${f(y - ny * 8)}L${f(x + nx * 8)} ${f(y + ny * 8)}`, '#4a3220', 1.1, .55)); }
  t.add(path('M8 98Q64 36 120 98', 'none', 1, { fill: 'none', stroke: '#fff', 'stroke-width': 1.4, 'stroke-opacity': .3, transform: 'translate(0 -7)' }));
  for (const x of [8, 120]) t.add(rect(x - 4, 90, 8, 22, t.lg(['#a87c46', '#6b4a2c'], 0), 1.5, 1, ink(P.inkW, .9, .85)), rect(x - 4, 90, 8, 2.4, '#e2c892', 1, .6));
  t.add(ripple(24, 110, 14, '#fff', .8), ripple(94, 112, 14, '#fff', .8), ripple(58, 114, 10, '#fff', .8));
  out(t, 'interest', 'bridge-arched', v, ['large', 'bridge', 'walkable', 'east-west']);
}
// waterfall (128x128): cliff, falling water, splash pool. Water leaves south into the stream.
for (const [v, twin] of [['a', false], ['b', true]]) {
  const t = mk('interest', 'waterfall', v, 128, 128), r = rng(821 + v.charCodeAt(0));
  t.add(sh(66, 100, 52, 8));
  t.add(path('M14 96Q10 60 24 40Q36 22 64 18Q92 22 104 40Q118 60 114 96Q64 104 14 96Z', t.lg(['#bda890', '#8a7660', '#5e4e3e'], 70), 1, ink('#3e3226', 1.2, .85)));
  for (let i = 0; i < 6; i++) t.add(line(`M${f(r.range(20, 108))} ${f(r.range(30, 70))}l${f(r.range(-6, 6))} ${f(r.range(10, 22))}`, '#3e3226', 1.2, .35));
  t.add(path('M26 38Q40 24 64 22Q88 24 102 38Q88 32 64 30Q40 32 26 38Z', '#f1e9d3', .5), path('M20 50Q24 40 30 44Q28 52 20 50Z', '#7fae5e', .95), path('M96 40Q104 38 106 46Q100 48 96 40Z', '#7fae5e', .95), path('M40 24Q50 18 58 24Q50 28 40 24Z', '#6fa050', .95));
  const fall = (x, w) => { const g = t.lg(['#ffffff', '#cfeaf0', '#9fd0dc'], 90); t.add(path(`M${x - w} 30Q${x - w - 2} 60 ${x - w - 3} 92H${x + w + 3}Q${x + w + 2} 60 ${x + w} 30Z`, g, .96, ink('#4f8aa8', .8, .5))); for (let i = 0; i < 5; i++) { const xx = x - w + (i + .5) * (2 * w / 5); t.add(line(`M${f(xx)} ${f(34 + r.range(0, 8))}V${f(80 + r.range(0, 10))}`, '#fff', 1.4, .8), line(`M${f(xx + 1.6)} ${f(44 + r.range(0, 10))}v${f(r.range(14, 24))}`, '#4f8aa8', .9, .35)); } };
  if (twin) { fall(46, 8); fall(82, 7); } else fall(64, 11);
  t.add(ell(64, 98, 54, 13, '#f6f3e6', .55), ell(64, 98, 48, 10, t.lg(['#b2dce4', '#7fb7cb'], 90), 1, 0, ink('#4f8aa8', 1, .6)));
  for (const [x, y, s] of (twin ? [[46, 92, 1], [82, 92, .9]] : [[64, 92, 1.3]])) t.add(ell(x, y, 14 * s, 5 * s, '#fff', .9), ell(x - 6, y + 2, 6 * s, 2 * s, '#fff', .8), circ(x + 4, y - 4, 2, '#fff', .7), circ(x - 8, y - 6, 1.4, '#fff', .7));
  for (let i = 0; i < 5; i++) t.add(ripple(r.range(24, 96), r.range(100, 110), r.range(8, 14), '#fff', .8, 1));
  for (const [x, y, s] of [[14, 100, 1], [112, 102, .9], [32, 108, .7]]) t.add(stoneW(x, y, s, true));
  t.add(tuft(8, 100, '#5f8f4c', .8, .9), tuft(120, 100, '#5f8f4c', .8, .9)); out(t, 'interest', 'waterfall', v, ['large', 'water', 'stream', 'obstacle', 'landmark']);
}

// ============================ overlays ============================
const ov = (name, v, w, h, fn, tags = []) => { const t = mk('overlays', name, v, w, h); fn(t, rng(hash(name + v))); out(t, 'overlays', name, v, ['overlay', 'bamboo-valley', ...tags]); };
for (const v of ['a', 'b', 'c']) ov('valley-mist', v, 128, 128, (t, r) => { for (let i = 0; i < 9; i++) { const x = r.range(26, 102), y = r.range(30, 98), rx = r.range(20, 36); t.add(ell(x, y, rx, rx * r.range(.22, .34), '#f6efdc', r.range(.14, .26)), ell(x + 4, y - 2, rx * .6, rx * .14, '#fff', .16)); } }, ['mist', 'large']);
for (const v of ['a', 'b']) ov('light-shafts', v, T, 128, (t, r) => { for (let i = 0; i < 4; i++) { const x = 14 + i * 12 + r.range(-3, 3), w = r.range(5, 9); t.add(path(`M${f(x)} 6L${f(x + w)} 6L${f(x + w + 26)} 122L${f(x + 14)} 122Z`, t.lg(['#fff6c0', '#fff6c0'], 90), .1 + r() * .1)); } for (let i = 0; i < 8; i++) t.add(circ(r.range(10, 54), r.range(14, 112), r.range(.7, 1.4), '#fff6c0', .8)); }, ['light', 'tall']);
for (const v of ['a', 'b']) ov('leaf-drift', v, T, T, (t, r) => { for (let i = 0; i < 6; i++) t.add(bambooLeaves(r.range(8, 56), r.range(8, 56), r.range(0, 360), r.pick(['#d8c460', '#9ccf70', '#c9b050']), r.range(1, 1.4))); }, ['ambient', 'leaves']);
for (const v of ['a', 'b']) ov('water-glint', v, T, T, (t, r) => { for (let i = 0; i < 7; i++) t.add(sparkle(r.range(8, 56), r.range(8, 56), r.range(.5, .9), '#ffffff')); for (let i = 0; i < 4; i++) t.add(line(`M${f(r.range(8, 46))} ${f(r.range(8, 56))}h${f(r.range(6, 11))}`, '#fff', 1, .6)); }, ['light', 'water']);
for (const v of ['a', 'b', 'c']) ov('sway-shadow', v, T, T, (t, r) => { for (let i = 0; i < 9; i++) t.add(blade(r.range(8, 56), r.range(8, 56), r.range(0, 360), r.range(10, 17), 2.6, '#2f5a34', '#2f5a34', .0).replace('fill="#2f5a34"', 'fill="#2f5a34" opacity=".16"')); }, ['shade', 'leaves']);
