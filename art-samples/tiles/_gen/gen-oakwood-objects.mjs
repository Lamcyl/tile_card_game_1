// Old Oak Wood objects: oaks of several ages, sacred oak + hollow door, root arches, fungi, logs, camp, shrine stones, ferns, overlays.
import { T, P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, maker, SUBS, sh, trunk, bloom, scat, sparkle, glowC, broad, dots, spokes, rockS, fronds, blobPath, mush, acorn, leafS, shimenawa } from './sub.mjs';
import { wrapped } from './lib.mjs';

const SUB = SUBS.oak, { mk, out } = maker(SUB);
const wood = ['#e2c892', '#b88e5a'];
const OAKC = { deep: ['#7dbb78', '#3f8a4c', '#27583a'], olive: ['#9fc46a', '#5f8f3c', '#3a5f2c'], fresh: ['#a8d884', '#5fae5c', '#3a8048'], gold: ['#f6d070', '#d49a2c', '#9a6a1c'], rust: ['#f3a45a', '#d2622e', '#a03c22'], dark: ['#6fae78', '#356f46', '#214a34'] };
const mossBlob = (x, y, w, h, t) => path(`M${f(x - w)} ${f(y + h * .3)}Q${f(x - w * .6)} ${f(y - h)} ${f(x + w * .2)} ${f(y - h * .7)}Q${f(x + w)} ${f(y - h * .2)} ${f(x + w * .8)} ${f(y + h * .5)}Q${f(x + w * .4)} ${f(y + h * .1)} ${f(x)} ${f(y + h * .6)}Q${f(x - w * .5)} ${f(y + h * .1)} ${f(x - w)} ${f(y + h * .3)}Z`, t.lg(['#a8cf86', '#6fa050'], 60), .96, ink('#3f6a38', .5, .6));
const owl = (t, x, y, k = 1) => ell(x + 1, y + 1, 7 * k, 1.8 * k, '#3b3a24', .0) + path(`M${f(x - 6 * k)} ${f(y)}Q${f(x - 7 * k)} ${f(y - 12 * k)} ${f(x - 3 * k)} ${f(y - 15 * k)}L${f(x - 4 * k)} ${f(y - 19 * k)}L${f(x - 1 * k)} ${f(y - 16 * k)}H${f(x + 1 * k)}L${f(x + 4 * k)} ${f(y - 19 * k)}L${f(x + 3 * k)} ${f(y - 15 * k)}Q${f(x + 7 * k)} ${f(y - 12 * k)} ${f(x + 6 * k)} ${f(y)}Q${f(x)} ${f(y + 2 * k)} ${f(x - 6 * k)} ${f(y)}Z`, t.lg(['#b08a5a', '#7a5a38', '#5a3a22'], 20), 1, ink(P.inkW, .9, .8)) + ell(x, y - 5 * k, 3.8 * k, 5 * k, '#f2e4c8', 1) + line(`M${f(x - 2 * k)} ${f(y - 7 * k)}q2 2 4 0M${f(x - 2 * k)} ${f(y - 4 * k)}q2 2 4 0`, '#a8845a', .8, .8) + circ(x - 2.6 * k, y - 12.5 * k, 2.4 * k, '#fff6e0', 1, ink(P.inkW, .5, .7)) + circ(x + 2.6 * k, y - 12.5 * k, 2.4 * k, '#fff6e0', 1, ink(P.inkW, .5, .7)) + circ(x - 2.6 * k, y - 12.5 * k, 1.4 * k, '#e8a83a') + circ(x + 2.6 * k, y - 12.5 * k, 1.4 * k, '#e8a83a') + circ(x - 2.6 * k, y - 12.5 * k, .7 * k, '#2a1a10') + circ(x + 2.6 * k, y - 12.5 * k, .7 * k, '#2a1a10') + path(`M${f(x - k)} ${f(y - 10.6 * k)}l${f(k)} ${f(1.8 * k)}l${f(k)} ${f(-1.8 * k)}Z`, '#e8a83a');

// ============================ trees ============================
{ const t = mk('trees', 'oak-sapling', 'a'); t.add(sh(34, 52, 12, 4)); t.add(trunk(t, 32, 52, 2.4, 1.4, 24, P.bark)); t.add(line('M32 38l-6 -6M32 34l6 -6', P.bark[2], 1.4)); const rg = t.rg(OAKC.fresh, .3, .25, 1); for (const [x, y, r] of [[32, 22, 10], [24, 30, 7], [40, 29, 7.5]]) t.add(circ(x, y, r, rg, 1, ink(P.inkG, .9, .7))); t.add(ell(28, 17, 4, 2, OAKC.fresh[0], .6, -20), acorn(34, 27, .6)); out(t, 'trees', 'oak-sapling', 'a', ['small', 'oak']); }
for (const [v, c] of [['a', { cr: 16, cy: 58, seed: 501, trunkH: 44, tw: 3.6 }], ['b', { cr: 18, cy: 56, seed: 502, trunkH: 46, tw: 4, lean: 2 }]]) { const t = mk('trees', 'oak-young', v, T, 128); broad(t, { ...c, cols: v === 'a' ? OAKC.fresh : OAKC.olive }); t.add(tuft(20, 114, '#5f8f4c', .8, .7), tuft(44, 116, '#5f8f4c', .8, .7)); out(t, 'trees', 'oak-young', v, ['tall', 'oak', 'obstacle']); }
for (const [v, c, cols, ex] of [['a', { cr: 27, cy: 44, seed: 511, trunkH: 44, tw: 7 }, OAKC.deep, 'moss'], ['b', { cr: 26, cy: 46, seed: 512, trunkH: 40, tw: 7.6, lean: -2 }, OAKC.olive, 'ivy'], ['c', { cr: 28, cy: 44, seed: 513, trunkH: 46, tw: 6.6 }, OAKC.dark, 'fungi']]) {
  const t = mk('trees', 'oak-mature', v, T, 128); broad(t, { ...c, cols, barkCols: ['#7a5e40', '#5a4028', '#3a2818'] });
  if (ex === 'moss') t.add(mossBlob(27, 104, 7, 6, t), mossBlob(38, 92, 4, 5, t), tuft(20, 114, '#4d7a40', .8, .8));
  if (ex === 'ivy') { t.add(line('M30 112q-5 -14 2 -26q-3 -10 1 -20', '#3f8048', 2, .95)); for (const [x, y] of [[28, 100], [33, 90], [30, 80], [34, 72], [27, 108]]) t.add(path(`M${x} ${y}q-4 -3 -2 -6q4 0 5 3q-1 3 -3 3Z`, '#4a9a50', 1, ink(P.inkG, .5, .6))); }
  if (ex === 'fungi') t.add(path('M38 96q9 -2 11 3q-6 3 -11 -3Z', '#e8b56a', 1, ink(P.inkW, .6, .7)), path('M37 86q8 -2 9 2q-5 3 -9 -2Z', '#d99a58', 1, ink(P.inkW, .6, .7)), mossBlob(26, 106, 6, 5, t));
  t.add(acorn(20, 118, .8), acorn(44, 120, .7), leafS(36, 118, 20, '#d2622e', .8));
  out(t, 'trees', 'oak-mature', v, ['tall', 'oak', 'obstacle', 'old-oak']);
}
for (const [v, cols, seed] of [['a', OAKC.gold, 521], ['b', OAKC.rust, 522]]) { const t = mk('trees', 'oak-autumn', v, T, 128); broad(t, { cr: 25, cy: 47, seed, cols, trunkH: 42, tw: 6 }); t.add(...[[24, 116, 20], [40, 120, -30], [32, 122, 70], [48, 114, 10]].map(([x, y, a]) => leafS(x, y, a, v === 'a' ? '#e8a83a' : '#d2622e', .85))); out(t, 'trees', 'oak-autumn', v, ['tall', 'oak', 'autumn', 'obstacle']); }
for (const [v, s] of [['a', 531], ['b', 532]]) {  // bare dead oak
  const t = mk('trees', 'oak-dead', v, T, 128), r = rng(s); t.add(sh(34, 114, 20, 6));
  t.add(trunk(t, 32, 112, 7, 3.6, 56, ['#9a8a78', '#6e5e4e', '#4a3e32'], v === 'a' ? -2 : 2));
  const br = (x, y, a, len, w) => { const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len; t.add(line(`M${f(x)} ${f(y)}Q${f(x + Math.cos(a - .3) * len * .5)} ${f(y + Math.sin(a - .3) * len * .5)} ${f(ex)} ${f(ey)}`, '#3b2e22', w + 1.4, .35), line(`M${f(x)} ${f(y)}Q${f(x + Math.cos(a - .3) * len * .5)} ${f(y + Math.sin(a - .3) * len * .5)} ${f(ex)} ${f(ey)}`, '#7a6a58', w, 1)); return [ex, ey]; };
  for (const [a, len, w] of [[-2.3, 24, 3.4], [-.8, 26, 3.4], [-1.57, 22, 3], [-2.8, 16, 2.4], [-.3, 16, 2.4]]) { const [x, y] = br(32 + (v === 'a' ? -2 : 2), 62, a, len, w); br(x, y, a + r.range(-.7, .7), 11, 1.8); br(x, y, a + r.range(-1.2, 1.2), 8, 1.4); }
  t.add(path('M26 100q-3 -8 1 -14q3 5 1 14Z', '#2e2418', .85), mossBlob(38, 106, 6, 4, t), tuft(20, 114, '#4d7a40', .8, .7));
  if (v === 'b') t.add(mush(t, 40, 96, .35, ['#e8b56a', '#b8843a'], { spots: false }));
  out(t, 'trees', 'oak-dead', v, ['tall', 'oak', 'dead', 'obstacle']);
}
for (const [v, kodama] of [['a', false], ['b', true]]) {   // hollow oak
  const t = mk('trees', 'oak-hollow', v, T, 128); broad(t, { cr: 26, cy: 42, seed: 541, cols: OAKC.deep, trunkH: 46, tw: 9, barkCols: ['#7a5e40', '#5a4028', '#3a2818'] });
  t.add(path('M26 112Q24 98 30 86Q32 80 36 86Q40 98 38 112Q32 116 26 112Z', '#241a12', .95, ink('#1a120c', .8, .8)), path('M27 108Q27 98 31 90', 'none', 1, { fill: 'none', stroke: '#6b4a2c', 'stroke-width': 1, 'stroke-opacity': .7 }));
  if (kodama) t.add(circ(32, 100, 9, t.rg(['#e8fff0', '#b8f0d0', '#b8f0d0'], .5, .5, .5, [.55, .2, 0])), ...[[30, 104, 1], [35, 98, .7]].map(([x, y, k]) => circ(x, y, 3.2 * k, '#f6fff6', 1, ink('#9ab8a0', .4, .6)) + circ(x - 1 * k, y - .4, .6 * k, '#2a3a30') + circ(x + 1 * k, y - .4, .6 * k, '#2a3a30')));
  else t.add(circ(30, 100, 1.3, '#e8a83a', .9), circ(34, 100, 1.3, '#e8a83a', .9));
  t.add(mossBlob(42, 104, 6, 5, t), tuft(18, 114, '#4d7a40', .8, .8));
  out(t, 'trees', 'oak-hollow', v, ['tall', 'oak', 'hollow', 'obstacle', kodama ? 'kodama' : 'dark']);
}

// ---- ancient / sacred oaks (128x128) ----
function greatOak(t, { seed, cols = OAKC.deep, hang = true, hollow = null, rope = false, lantern = false, door = null }) {
  const r = rng(seed); t.add(sh(66, 113, 48, 9));
  const bark = ['#7a5e40', '#5a4028', '#3a2818'];
  // root flare + trunk
  t.add(path('M30 118Q42 112 46 98Q42 80 50 62H78Q86 82 82 98Q88 112 102 118Q66 112 30 118Z', t.lg(bark, 0), 1, ink(P.inkW, 1.1, .85)));
  t.add(path('M44 114Q30 116 22 120', 'none', 1, { fill: 'none', stroke: '#5a4028', 'stroke-width': 4, 'stroke-linecap': 'round' }), path('M86 114Q100 116 108 120', 'none', 1, { fill: 'none', stroke: '#5a4028', 'stroke-width': 4, 'stroke-linecap': 'round' }));
  t.add(line('M54 70q-3 14 0 28M64 66q1 16 -1 34M74 70q3 14 1 26M48 104q-2 6 -6 10M80 104q2 6 6 10', '#2e2014', 1.3, .5), path('M50 66Q54 64 58 66Q52 80 52 96Q48 88 50 66Z', '#a8845a', .35));
  const L = [[0, 0, 1], [-.62, .2, .66], [.64, .2, .66], [-.32, -.5, .62], [.34, -.52, .6], [0, .52, .56], [-.9, .45, .4], [.9, .5, .4]], cr = 43, cx = 64, cy = 48, rg = t.rg(cols, .3, .25, 1);
  for (const [dx, dy, k] of L) t.add(circ(cx + dx * cr, cy + dy * cr, cr * k * .95, cols[2], 1, ink(P.inkG, 1.1, .7)));
  for (const [dx, dy, k] of L) t.add(circ(cx + dx * cr - 2, cy + dy * cr - 3, cr * k * .8, rg, 1));
  t.add(ell(cx - 14, cy - 20, 22, 11, cols[0], .5, -20));
  for (let k = 0; k < 16; k++) { const a = r.range(-3.3, .2), d = cr * r.range(.2, .9); t.add(ell(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .8, 5, 1.8, cols[0], .55, r.range(-50, 20))); }
  for (let k = 0; k < 10; k++) t.add(ell(cx + r.range(-34, 34), cy + r.range(8, 34), 4, 1.4, cols[2], .45, r.range(-40, 40)));
  if (hang) for (const x of [28, 44, 86, 100]) t.add(path(`M${x} ${f(70 + r.range(-4, 4))}q-3 8 0 14q3 -6 0 -14Z`, '#a8cf86', .9, ink('#3f6a38', .5, .6)), line(`M${x} 80v${f(r.range(6, 11))}`, '#8fc070', 1, .8));
  if (hollow) { t.add(hollow); }
  t.add(mossBlob(48, 106, 8, 6, t), mossBlob(84, 100, 6, 5, t), tuft(30, 118, '#4d7a40', .8, .9), tuft(100, 119, '#4d7a40', .8, .9));
  if (rope) t.add(shimenawa(t, 46, 82, 76, 9, 4.6));
  if (lantern) { t.add(glowC(t, 98, 98, 13), rect(96.6, 76, 1.4, 12, P.bark[2], 0), path('M92 88Q90 96 93 102H103Q106 96 104 88Z', t.lg(['#ffe9b0', '#ffb04a'], 90), 1, ink('#6b4a2c', .9, .8)), rect(91, 86, 14, 3, '#3a2a22', 1), rect(91, 101, 14, 3, '#3a2a22', 1)); }
}
for (const [v, opt] of [['a', { seed: 551, hollow: path('M58 112Q56 94 62 84Q64 80 68 84Q74 94 72 112Q65 114 58 112Z', '#241a12', .95) }], ['b', { seed: 552, cols: OAKC.dark, hollow: null }]]) {
  const t = mk('trees', 'oak-ancient', v, 128, 128); greatOak(t, opt);
  if (v === 'b') { t.add(mush(t, 40, 118, .5, ['#e8b56a', '#b8843a'], { spots: false }), mush(t, 92, 119, .45, ['#e0583f', '#a82a20']), mush(t, 98, 116, .35, ['#e0583f', '#a82a20'])); for (const [x, y] of [[26, 70], [100, 62], [60, 30]]) t.add(sparkle(x, y, .6, '#fff6c0')); }
  out(t, 'trees', 'oak-ancient', v, ['large', 'landmark', 'oak', 'obstacle']);
}
for (const [v, o] of [['a', { seed: 561, rope: true }], ['b', { seed: 562, rope: true, lantern: true, cols: ['#86d088', '#4aa058', '#2f7040'] }]]) {
  const t = mk('trees', 'oak-sacred', v, 128, 128); greatOak(t, o);
  if (v === 'b') t.add(rect(28, 100, 14, 6, t.lg(P.stone, 90), 1.5, 1, ink(P.inkR, .9, .8)), ell(35, 100, 5, 1.6, '#fff', .5), rect(32, 96, 6, 4, '#fffaf0', 1, 1, ink('#b8b09a', .6, .7)), circ(35, 94, 3.4, '#fffaf0', 1, ink('#b8b09a', .6, .7)));
  out(t, 'trees', 'oak-sacred', v, ['large', 'landmark', 'oak', 'shimenawa', 'obstacle']);
}
// the hollow-trunk door: the Old Oak Wood gate (128x128, footprint bottom row, boss stands beside it)
for (const open of [false, true]) {
  const t = mk('interest', 'gate-hollow-oak', open ? 'open' : 'closed', 128, 128);
  greatOak(t, { seed: 571, rope: false, hollow: '' });
  // arched opening + door
  t.add(path('M48 118Q46 94 52 82Q58 74 64 74Q70 74 76 82Q82 94 80 118Q64 122 48 118Z', '#1e150e', 1, ink('#120c08', 1.2, .9)));
  if (open) t.add(path('M52 116Q51 96 56 86Q60 80 64 80Q68 80 72 86Q77 96 76 116Q64 119 52 116Z', t.lg(['#fff6c0', '#ffd47a', '#ffb04a'], 90), 1), glowC(t, 64, 100, 28, '#ffe6a0', '#ffc45a', .55), path('M52 116L38 118L40 84L52 90Z', t.lg(['#a8844f', '#6b4a2c'], 0), 1, ink(P.inkW, 1, .85)), line('M44 92v22', '#3b2a1a', 1, .6), path('M50 114Q64 110 76 114', 'none', 1, { fill: 'none', stroke: '#fff6c0', 'stroke-width': 3, 'stroke-opacity': .7 }));
  else t.add(path('M52 116Q51 96 56 86Q60 80 64 80Q68 80 72 86Q77 96 76 116Q64 119 52 116Z', t.lg(['#a8844f', '#8a6038', '#5a3a22'], 0), 1, ink(P.inkW, 1.1, .85)), line('M64 80V117M57 96h14M56 106h16', '#3b2a1a', 1.2, .55), rect(52, 95, 24, 3, '#4a3a38', 0, .85), rect(52, 106, 24, 3, '#4a3a38', 0, .85), circ(70, 100, 2.2, P.gold, 1, ink('#8a6a1c', .6, .8)));
  t.add(path('M44 120Q64 124 84 120', 'none', 1, { fill: 'none', stroke: '#5a4028', 'stroke-width': 3 }));
  t.add(shimenawa(t, 46, 82, 72, 8, 4.6));
  t.add(rect(36, 108, 7, 6, t.lg(P.stone, 90), 1, 1, ink(P.inkR, .8, .8)), rect(85, 108, 7, 6, t.lg(P.stone, 90), 1, 1, ink(P.inkR, .8, .8)));
  out(t, 'interest', 'gate-hollow-oak', open ? 'open' : 'closed', ['large', 'gate', 'old-oak-wood', open ? 'open' : 'closed']);
}
// root arch over a passage (128x128): twin trunks, roots meeting overhead, free ground between them
for (const [v, lit] of [['a', false], ['b', true]]) {
  const t = mk('trees', 'root-arch', v, 128, 128), r = rng(581), bark = ['#7a5e40', '#5a4028', '#3a2818'];
  t.add(sh(66, 116, 52, 8));
  t.add(rect(30, 22, 68, 40, t.lg(OAKC.dark, 90), 14, 1, ink(P.inkG, 1, .7)), ellipseCrown());
  function ellipseCrown() { let o = ''; for (let i = 0; i < 4; i++) o += circ(30 + i * 22, 36 + (i % 2) * 6, 22, t.rg(OAKC.deep, .3, .25, 1), 1, ink(P.inkG, 1, .7)); return o; }
  t.add(ell(52, 26, 20, 7, OAKC.deep[0], .5, -10), ell(82, 36, 14, 4, OAKC.deep[0], .35, 10));
  t.add(ell(64, 90, 24, 22, '#1f2a1c', .22));    // shade inside the arch
  t.add(path('M16 118Q22 104 24 86Q22 66 30 52H46Q42 76 44 98Q46 110 50 118Q32 114 16 118Z', t.lg(bark, 0), 1, ink(P.inkW, 1.1, .85)), path('M112 118Q106 104 104 86Q106 66 98 52H82Q86 76 84 98Q82 110 78 118Q96 114 112 118Z', t.lg(bark, 0), 1, ink(P.inkW, 1.1, .85)));
  t.add(path('M26 62Q30 38 64 36Q98 38 102 62L90 66Q88 50 64 48Q40 50 38 66Z', t.lg(['#8a6a4a', '#6b4a2c', '#4a3220'], 90), 1, ink(P.inkW, 1.1, .85)), path('M34 56Q44 44 64 42', 'none', 1, { fill: 'none', stroke: '#b89468', 'stroke-width': 1.4, 'stroke-opacity': .5 }));
  t.add(line('M48 66q-2 8 1 16M70 54q2 8 -1 14M82 66q3 8 0 14', '#4a3220', 2, .9), line('M34 74q-2 12 0 26M94 74q2 12 0 26', '#2e2014', 1.2, .5));
  t.add(mossBlob(30, 68, 7, 5, t), mossBlob(98, 64, 6, 5, t), mossBlob(64, 41, 9, 4, t));
  for (const x of [40, 56, 74, 86]) t.add(path(`M${x} 48q-2 6 0 ${f(r.range(10, 18))}q2 -6 0 -${f(r.range(10, 18))}Z`, '#8fc070', .9, ink('#3f6a38', .5, .6)));
  t.add(fronds(24, 118, 4, 11, ['#6fb560', '#3f8048'], 1.8), fronds(106, 118, 4, 11, ['#6fb560', '#4a9a50'], 1.8), tuft(14, 119, '#4d7a40', .8, .8));
  if (lit) { t.add(line('M64 48V62', P.inkW, 1.2), glowC(t, 64, 76, 16), path('M58 62Q56 70 59 76H69Q72 70 70 62Z', t.lg(['#ffe9b0', '#ffb04a'], 90), 1, ink('#6b4a2c', .9, .8)), rect(57, 60, 14, 3, '#3a2a22', 1), rect(57, 75, 14, 3, '#3a2a22', 1), mush(t, 100, 118, .5, ['#9fe8f0', '#4a9ab8'], { glow: true, spots: false, stem: '#f0fbff' })); }
  else t.add(mush(t, 98, 118, .5, ['#e0583f', '#a82a20']), mush(t, 104, 116, .35, ['#e0583f', '#a82a20']));
  out(t, 'trees', 'root-arch', v, ['large', 'passage', 'obstacle', 'old-oak-wood']);
}

// ============================ rocks ============================
for (const [v, s, rx, ry] of [['a', 591, 18, 13], ['b', 592, 21, 12], ['c', 593, 15, 14]]) { const t = mk('rocks', 'boulder-mossy-oak', v), r = rng(s); t.add(rockS(t, r, 32, 40, rx, ry, P.stoneG, { moss: true, fern: v !== 'b' })); t.add(path('M18 52q4 -6 8 -3', 'none', 1, { fill: 'none', stroke: '#6b4a2c', 'stroke-width': 2.4, 'stroke-linecap': 'round' }), tuft(46, 50, '#4d7a40', .8, .6)); if (v === 'b') t.add(mush(t, 44, 38, .4, ['#e8b56a', '#b8843a'], { spots: false })); out(t, 'rocks', 'boulder-mossy-oak', v, ['obstacle', 'old-oak-wood']); }
for (const [v, n] of [['a', 3], ['b', 4]]) { const t = mk('rocks', 'stone-cairn', v); t.add(sh(34, 53, 16, 4.5)); const st = [[32, 48, 15, 7], [31, 39, 11, 6], [33, 31, 8, 5], [32, 24, 5.4, 4]].slice(0, n + 0); st.forEach(([x, y, rx, ry], i) => t.add(ell(x, y, rx, ry, t.lg(i % 2 ? P.stoneG : P.stone, 70), 1, 0, ink(P.inkR, .9, .8)), ell(x - rx * .3, y - ry * .35, rx * .5, ry * .3, '#fff', .5))); t.add(mossBlob(27, 45, 6, 3, t), tuft(46, 52, '#4d7a40', .8, .6)); out(t, 'rocks', 'stone-cairn', v, ['obstacle', 'shrine', 'old-oak-wood']); }
for (const [v, kind] of [['a', 'rope'], ['b', 'roofed'], ['c', 'cairn']]) {   // shrine stones (tall)
  const t = mk('rocks', 'shrine-stone', v, T, 128), r = rng(600 + v.charCodeAt(0)); t.add(sh(34, 114, 20, 6));
  if (kind === 'rope') {
    t.add(path('M18 114Q18 80 24 50Q30 36 40 42Q46 60 46 114Q32 120 18 114Z', t.lg(P.stoneG, 40), 1, ink(P.inkR, 1, .8)), path('M22 108Q22 78 28 54Q32 46 36 50Q30 70 28 108Z', '#fff', .3), mossBlob(30, 108, 9, 6, t), mossBlob(30, 48, 5, 3, t));
    t.add(shimenawa(t, 14, 52, 76, 9, 4.2));
  } else if (kind === 'roofed') {
    t.add(rect(18, 100, 28, 14, t.lg(P.stoneG, 90), 2, 1, ink(P.inkR, .9, .8)), rect(22, 66, 20, 34, t.lg(P.stoneG, 40), 2, 1, ink(P.inkR, .9, .8)), path('M12 66L32 50L52 66L48 70H16Z', t.lg(['#bfc0b0', '#74786a'], 90), 1, ink(P.inkR, .9, .8)), ell(32, 49, 3, 3, '#cfd0c4', 1, 0, ink(P.inkR, .8, .8)), rect(27, 76, 10, 14, '#2e2c28', 1, .9), line('M32 76v14', '#74786a', 1, .6), mossBlob(34, 66, 11, 4, t), mossBlob(24, 110, 6, 4, t));
  } else {
    [[32, 110, 17, 6.5], [31, 99, 13, 5.5], [33, 89, 10, 5], [31, 80, 7.6, 4.4], [32, 72, 5, 3.6]].forEach(([x, y, rx, ry], i) => t.add(ell(x + 1, y + 1.5, rx, ry, '#3b3a24', .1), ell(x, y, rx, ry, t.lg(i % 2 ? P.stoneG : P.stone, 70), 1, 0, ink(P.inkR, .9, .8)), ell(x - rx * .3, y - ry * .35, rx * .5, ry * .3, '#fff', .5)));
    t.add(mossBlob(26, 106, 7, 3, t), mossBlob(36, 86, 5, 2.4, t), shimenawa(t, 18, 46, 92, 5, 3, false), path('M32 96l4 0l-1 7l3 -1l-2 7l-4 -2l1 -5l-3 1Z', '#fffaf0', 1, ink('#b8b09a', .7, .8)));
  }
  t.add(tuft(14, 114, '#4d7a40', .8, .8), tuft(48, 114, '#4d7a40', .8, .7));
  out(t, 'rocks', 'shrine-stone', v, ['tall', 'shrine', 'obstacle', 'old-oak-wood']);
}
// stone circle (large), with a glowing variant
for (const [v, lit] of [['a', false], ['b', true]]) {
  const t = mk('interest', 'stone-circle', v, 128, 128); t.add(sh(66, 108, 50, 9));
  if (lit) t.add(ell(64, 96, 46, 18, '#9fe8f0', .2), ell(64, 96, 30, 11, '#c8f6f0', .25));
  t.add(ell(64, 96, 38, 13, '#7fae5e', .35), ell(64, 96, 26, 8, '#a8cf86', .3));
  const stones = []; for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + .35; stones.push([64 + Math.cos(a) * 42, 96 + Math.sin(a) * 15, 9 + (i % 3) * 2, 20 + (i * 5) % 9]); } stones.sort((a, b) => a[1] - b[1]);
  for (const [x, y, w, h] of stones) { t.add(ell(x + 3, y + 1, w * .9, 3, '#3b3a24', .18), path(`M${f(x - w)} ${f(y + 2)}Q${f(x - w * .9)} ${f(y - h * .6)} ${f(x - w * .4)} ${f(y - h)}Q${f(x + w * .2)} ${f(y - h - 3)} ${f(x + w * .8)} ${f(y - h * .8)}Q${f(x + w)} ${f(y - h * .3)} ${f(x + w)} ${f(y + 2)}Q${f(x)} ${f(y + 5)} ${f(x - w)} ${f(y + 2)}Z`, t.lg(P.stoneG, 40), 1, ink(P.inkR, 1, .8)), ell(x - w * .4, y - h * .6, w * .25, h * .3, '#fff', .35), mossBlob(x - 1, y - 1, w * .6, 3, t)); if (lit) t.add(line(`M${f(x)} ${f(y - h * .7)}v${f(h * .5)}M${f(x - 2.4)} ${f(y - h * .55)}h4.8`, '#7fe8f0', 1.4, .95), circ(x, y - h * .45, 6, t.rg(['#c8fcff', '#7fe8f0', '#7fe8f0'], .5, .5, .5, [.5, .2, 0]))); else t.add(line(`M${f(x)} ${f(y - h * .7)}v${f(h * .5)}M${f(x - 2.4)} ${f(y - h * .55)}h4.8`, '#6a7a6a', 1, .5)); }
  t.add(ell(64, 98, 8, 3, '#3b3a24', .16), path('M56 98Q56 86 64 84Q72 86 72 98Q64 101 56 98Z', t.lg(['#d8d8c8', '#a2a596', '#74786a'], 40), 1, ink(P.inkR, .9, .8)), lit ? circ(64, 90, 3, '#c8fcff', .95) : line('M64 87v6M61 90h6', '#6a7a6a', 1, .5));
  out(t, 'interest', 'stone-circle', v, ['large', 'shrine', 'old-oak-wood', lit ? 'lit' : 'unlit']);
}

// ============================ props ============================
for (const [v, s, rx] of [['a', 611, 11], ['b', 612, 14], ['c', 613, 10]]) {   // mossy stump
  const t = mk('props', 'stump-mossy', v), h = v === 'c' ? 10 : 17; t.add(sh(34, 50, rx + 5, 5));
  t.add(path(`M${32 - rx - 3} 50Q${32 - rx} ${50 - h * .5} ${32 - rx + 1} ${50 - h}H${32 + rx - 1}Q${32 + rx} ${50 - h * .5} ${32 + rx + 3} 50Q32 55 ${32 - rx - 3} 50Z`, t.lg(['#7a5e40', '#5a4028', '#3a2818'], 0), 1, ink(P.inkW, 1, .8)));
  t.add(ell(32, 50 - h, rx, rx * .42, '#e2c892', 1, 0, ink(P.inkW, .9, .8)), ell(32, 50 - h, rx * .66, rx * .27, 'none', 1, 0, { fill: 'none', stroke: '#b88e5a', 'stroke-width': .8 }), ell(32, 50 - h, rx * .3, rx * .12, 'none', 1, 0, { fill: 'none', stroke: '#b88e5a', 'stroke-width': .8 }));
  t.add(mossBlob(32 - rx + 3, 50 - h + 1, 7, 4, t), mossBlob(32 + rx - 2, 48, 5, 5, t), tuft(32 + rx, 52, '#4d7a40', .8, .6));
  if (v === 'b') t.add(mush(t, 40, 50 - h + 1, .42, ['#e0583f', '#a82a20'])); if (v === 'c') t.add(fronds(24, 52, 3, 8, ['#6fb560', '#4a9a50']), acorn(42, 46, .8));
  out(t, 'props', 'stump-mossy', v, ['obstacle', 'forest', 'old-oak-wood']);
}
for (const [v, s] of [['a', 621], ['b', 622], ['c', 623]]) {   // fallen log
  const t = mk('props', 'log-fallen', v), r = rng(s); t.add(sh(34, 52, 28, 5));
  t.add(path('M4 44Q2 36 10 34H50Q60 36 60 44Q58 52 50 52H10Q4 52 4 44Z', t.lg(['#7a5e40', '#5a4028', '#3a2818'], 90), 1, ink(P.inkW, 1, .85)), ell(58, 43, 4.4, 8.6, '#e2c892', 1, 0, ink(P.inkW, .9, .8)), ell(58, 43, 2.4, 5, 'none', 1, 0, { fill: 'none', stroke: '#b88e5a', 'stroke-width': .8 }), line('M12 38H48M10 46H50', '#2e2014', 1, .35), line('M12 36H46', '#c0a078', 1, .4));
  t.add(mossBlob(20, 36, 11, 4, t), mossBlob(42, 35, 7, 3, t));
  if (v === 'a') t.add(mush(t, 30, 36, .42, ['#e8b56a', '#b8843a'], { spots: false }), mush(t, 36, 35, .3, ['#e8b56a', '#b8843a'], { spots: false }));
  if (v === 'b') t.add(path('M16 46q6 -4 12 0q-6 3 -12 0Z', '#e8d8b0', 1, ink('#8a6a28', .6, .7)), path('M30 48q7 -4 13 0q-7 3 -13 0Z', '#f0e0bc', 1, ink('#8a6a28', .6, .7)), line('M10 36l-4 -6M14 34l1 -7', '#5a4028', 2, .95), tuft(52, 52, '#4d7a40', .8, .6));
  if (v === 'c') t.add(fronds(14, 36, 4, 9, ['#6fb560', '#4a9a50']), bloom('cornflower', 46, 33, .55, '#a58ad8'));
  out(t, 'props', 'log-fallen', v, ['obstacle', 'forest', 'old-oak-wood']);
}
const capSets = { a: [['#d6a05a', '#8a5a2c'], ['#e8b56a', '#b8843a']], b: [['#e0583f', '#a82a20'], ['#f2d8b0', '#c9a070']], c: [['#c9b3e6', '#8a72b0'], ['#e8d0f0', '#a888c0']] };
for (const [v, caps] of Object.entries(capSets)) { const t = mk('props', 'mushroom-cluster', v); t.add(sh(34, 52, 20, 4.5)); [[26, 48, 1.05, 0], [41, 50, .8, 1], [34, 43, .7, 1], [20, 51, .55, 1]].sort((a, b) => a[1] - b[1]).forEach(([x, y, k, c]) => t.add(mush(t, x, y, k, caps[c], { spots: v === 'b' && c === 0 }))); t.add(tuft(48, 52, '#4d7a40', .8, .6)); out(t, 'props', 'mushroom-cluster', v, ['decor', 'old-oak-wood']); }
for (const [v, g] of [['a', ['#9fe8f0', '#4a9ab8']], ['b', ['#f6c0f0', '#a864c0']], ['c', ['#fff0a0', '#e8a83a']]]) {   // glowing mushrooms
  const t = mk('props', 'mushroom-glow', v); t.add(sh(34, 52, 20, 4.5)); t.add(ell(32, 44, 24, 10, g[0], .22), ell(32, 44, 15, 6, g[0], .25));
  [[26, 48, 1.05], [41, 50, .8], [34, 43, .7], [18, 51, .5]].sort((a, b) => a[1] - b[1]).forEach(([x, y, k]) => t.add(mush(t, x, y, k, g, { spots: false, glow: true, stem: '#f4fcff' })));
  for (const [x, y] of [[48, 28], [14, 34], [38, 22], [24, 20]]) t.add(circ(x, y, 1.1, g[0], .85), circ(x, y, 3, g[0], .2));
  out(t, 'props', 'mushroom-glow', v, ['decor', 'glow', 'old-oak-wood']);
}
for (const [v, s] of [['a', 631], ['b', 632], ['c', 633]]) {   // spider web on a dead branch fork
  const t = mk('props', 'spider-web', v), r = rng(s); t.add(sh(34, 53, 14, 3.5));
  const fk = (x0, y0, x1, y1, w) => t.add(line(`M${x0} ${y0}L${x1} ${y1}`, '#3b2e22', w + 1.2, .3), line(`M${x0} ${y0}L${x1} ${y1}`, '#7a6a58', w, 1));
  fk(32, 54, 32, 38, 4); fk(32, 40, 14, 14, 3); fk(32, 40, 50, 12, 3); if (v !== 'c') fk(32, 36, 32, 8, 2.4); fk(20, 24, 12, 26, 1.6);
  const cx = 32, cy = v === 'c' ? 26 : 28; let d = ''; for (let i = 0; i < 9; i++) { const a = -3.14 + i / 8 * 3.14 + .05; d += `M${cx} ${cy + 6}L${f(cx + Math.cos(a) * 22)} ${f(cy + 6 + Math.sin(a) * 20)}`; } t.add(line(d, '#f4f4ea', .8, .9));
  for (const rad of [6, 11, 16, 21]) { let dd = ''; for (let i = 0; i <= 8; i++) { const a = -3.14 + i / 8 * 3.14, rr = rad * (i % 2 ? .93 : 1); dd += (i ? 'L' : 'M') + f(cx + Math.cos(a) * rr) + ' ' + f(cy + 6 + Math.sin(a) * rr * .92); } t.add(line(dd, '#f4f4ea', .7, .75)); }
  for (const [x, y] of [[40, 24], [24, 30], [34, 18], [18, 20]]) t.add(circ(x, y, 1, '#fff', .95), circ(x - .3, y - .3, .35, '#cfe8f0'));
  t.add(ell(32, 30, 2, 2.4, '#2a2a38', 1), line('M30 28l-3 -2M34 28l3 -2M30 31l-3 2M34 31l3 2', '#2a2a38', .7, .9), tuft(18, 53, '#4d7a40', .8, .6));
  if (v === 'b') t.add(ell(40, 36, 2.2, 3, '#e8d8b0', .95, 20, ink('#a8a090', .5, .7)));
  out(t, 'props', 'spider-web', v, ['decor', 'old-oak-wood', 'obstacle']);
}
for (const [v, two] of [['a', false], ['b', true]]) {   // owl perch (tall)
  const t = mk('props', 'owl-perch', v, T, 128); t.add(sh(34, 114, 14, 4.5));
  t.add(rect(28, 56, 8, 58, t.lg(['#7a5e40', '#5a4028', '#3a2818'], 0), 2, 1, ink(P.inkW, .9, .8)), path('M36 60L54 46L56 49L38 66Z', '#6b4a2c', 1, ink(P.inkW, .8, .8)), path('M28 66L12 54L10 57L28 72Z', '#6b4a2c', 1, ink(P.inkW, .8, .8)), ell(32, 56, 6, 2, '#a8845a', .6), mossBlob(32, 100, 6, 5, t), tuft(22, 114, '#4d7a40', .8, .8));
  t.add(owl(t, 32, 56, 1.5)); if (two) t.add(owl(t, 50, 47, 1));
  out(t, 'props', 'owl-perch', v, ['tall', 'critter', 'old-oak-wood']);
}
for (const [v, axe] of [['a', true], ['b', false]]) {   // chopping block
  const t = mk('props', 'chopping-block', v); t.add(sh(34, 53, 20, 5));
  t.add(path('M18 52Q16 38 20 32H44Q48 38 46 52Q32 57 18 52Z', t.lg(['#8a6a4a', '#5a4028'], 0), 1, ink(P.inkW, 1, .8)), ell(32, 32, 13, 5.2, '#e2c892', 1, 0, ink(P.inkW, .9, .8)), ell(32, 32, 8.4, 3.2, 'none', 1, 0, { fill: 'none', stroke: '#b88e5a', 'stroke-width': .8 }), ell(32, 32, 3.8, 1.5, 'none', 1, 0, { fill: 'none', stroke: '#b88e5a', 'stroke-width': .8 }));
  if (axe) t.add(line('M34 33L48 10', P.bark[1], 3), path('M42 18L52 10L54 22Q50 22 42 18Z', t.lg(['#d8dce0', '#7a828a'], 40), 1, ink('#3a424a', .8, .8)));
  for (const [x, y, a] of [[10, 50, 20], [52, 52, -30], [46, 56, 60]]) t.add(path(`M${x} ${y}l5 -1l2 2l-5 1Z`, '#e2c892', 1, ink(P.inkW, .4, .6)));
  if (!axe) t.add(path('M14 46l8 -2l1 5l-8 3Z', '#c9a874', 1, ink(P.inkW, .5, .7)), ell(44, 50, 6, 3, '#c9a874', 1, 10, ink(P.inkW, .5, .7)));
  out(t, 'props', 'chopping-block', v, ['obstacle', 'camp', 'old-oak-wood']);
}
for (const [v, n] of [['a', 6], ['b', 10]]) {   // stacked firewood
  const t = mk('props', 'log-stack', v); t.add(sh(34, 53, 22, 5)); const rows = v === 'a' ? [3, 2, 1] : [4, 3, 2, 1]; let i = 0;
  rows.forEach((c, row) => { for (let k = 0; k < c; k++) { const x = 32 + (k - (c - 1) / 2) * 11, y = 47 - row * 9 * (v === 'a' ? 1.1 : .9); t.add(circ(x, y, 5.6, t.rg(['#a8845a', '#6b4a2c', '#4a3220'], .4, .35, .9), 1, ink(P.inkW, .9, .85)), circ(x - .4, y, 4, '#e2c892', 1, ink(P.inkW, .4, .6)), circ(x - .4, y, 2.4, 'none', 1, { fill: 'none', stroke: '#b88e5a', 'stroke-width': .7 })); } });
  t.add(rect(14, 50, 36, 3, '#3a2818', 1, .0), tuft(52, 52, '#4d7a40', .8, .6));
  out(t, 'props', 'log-stack', v, ['obstacle', 'camp', 'old-oak-wood']);
}
for (const [v, lit] of [['a', false], ['b', true]]) {   // hokora: tiny wayside shrine (tall)
  const t = mk('props', 'hokora', v, T, 128); t.add(sh(34, 114, 20, 6));
  if (lit) t.add(glowC(t, 32, 96, 24, '#ffe6a0', '#ffc45a', .5));
  t.add(rect(16, 104, 32, 10, t.lg(P.stone, 90), 2, 1, ink(P.inkR, .9, .8)), rect(20, 96, 24, 8, t.lg(P.stoneG, 90), 2, 1, ink(P.inkR, .9, .8)));
  t.add(rect(20, 72, 24, 24, t.lg(['#c9a874', '#8a6038'], 0), 1, 1, ink(P.inkW, 1, .85)), rect(24, 76, 16, 18, lit ? '#ffd47a' : '#2e2418', 1, 1, ink(P.inkW, .8, .8)), line('M32 76v18', lit ? '#c8a050' : '#5a4a38', 1, .8), ell(32, 94, 4, 1.2, '#fffaf0', lit ? 1 : .0));
  t.add(path('M12 74L32 52L52 74L48 76H16Z', t.lg(['#7a5e50', '#4a3a34'], 90), 1, ink(P.inkW, 1, .85)), path('M18 72L32 56', 'none', 1, { fill: 'none', stroke: '#fff', 'stroke-width': 1, 'stroke-opacity': .25 }), rect(30, 50, 4, 4, '#6b4a2c', 1), mossBlob(24, 70, 8, 3, t));
  t.add(shimenawa(t, 18, 46, 84, 4, 2.8, false), path('M30 86l4 0l-1 6l3 -1l-2 6l-4 -2l1 -4l-3 1Z', '#fffaf0', 1, ink('#b8b09a', .7, .8)));
  t.add(ell(32, 104, 5, 1.6, '#e8eef0', 1, 0, ink('#7a8a90', .6, .8)), ell(32, 103, 3, 1, '#c97a4a', .8), tuft(14, 114, '#4d7a40', .8, .8), tuft(50, 114, '#4d7a40', .8, .7));
  out(t, 'props', 'hokora', v, ['tall', 'shrine', 'old-oak-wood', lit ? 'lit' : 'unlit', 'obstacle']);
}
// woodcutter's camp (large)
for (const [v, lit] of [['a', false], ['b', true]]) {
  const t = mk('interest', 'woodcutter-camp', v, 128, 128); t.add(sh(66, 114, 52, 8));
  // log pile (back right)
  [[100, 98, 3], [92, 98, 3], [96, 88, 2]].forEach(([x, y]) => { }); for (const [x, y] of [[92, 100], [104, 100], [116, 100], [98, 91], [110, 91], [104, 82]]) t.add(circ(x, y, 6.2, t.rg(['#a8845a', '#6b4a2c', '#4a3220'], .4, .35, .9), 1, ink(P.inkW, .9, .85)), circ(x - .4, y, 4.4, '#e2c892', 1, ink(P.inkW, .4, .6)), circ(x - .4, y, 2.6, 'none', 1, { fill: 'none', stroke: '#b88e5a', 'stroke-width': .7 }));
  // lean-to tent
  t.add(path('M12 110L44 44L84 110Z', t.lg(['#f2e8cc', '#d8c89c', '#b8a878'], 20), 1, ink('#6b5a3e', 1, .85)), path('M44 44L84 110H62Z', '#3b2e22', .22), path('M44 46L26 82L34 84L48 54Z', '#fff', .3), line('M44 44V110', '#8a7a58', 1.2, .5), path('M30 110L44 44L58 110Z', '#2e2418', .85), rect(30, 106, 28, 3, '#e8d8b0', 0, .0));
  t.add(line('M44 44l-4 -6M44 44l4 -6', P.bark[1], 3), line('M10 112l6 -8M86 112l-6 -8', P.bark[2], 2), path('M14 98h66', 'none', 1, { stroke: '#4d639a', 'stroke-width': 3, fill: 'none', opacity: .5 }), line('M44 50l2 -6l4 5', '#c8352b', 1.4, .9));
  // chopping block + axe
  t.add(path('M64 118Q62 108 66 103H82Q86 108 84 118Q74 122 64 118Z', t.lg(['#8a6a4a', '#5a4028'], 0), 1, ink(P.inkW, 1, .85)), ell(74, 103, 9, 3.6, '#e2c892', 1, 0, ink(P.inkW, .9, .8)), ell(74, 103, 5, 2, 'none', 1, 0, { fill: 'none', stroke: '#b88e5a', 'stroke-width': .7 }), line('M76 103L88 84', P.bark[1], 3), path('M82 90L92 84L94 96Q88 96 82 90Z', t.lg(['#d8dce0', '#7a828a'], 40), 1, ink('#3a424a', .8, .8)));
  // fire ring in front
  t.add(ell(40, 118, 14, 4, '#3b3a24', .16)); if (lit) t.add(glowC(t, 40, 112, 26, '#ffe6a0', '#ffc45a', .65));
  for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283; t.add(ell(40 + Math.cos(a) * 10, 116 + Math.sin(a) * 3.4, 3.4, 2.4, '#a2a596', 1, 0, ink(P.inkR, .6, .7))); }
  t.add(line('M33 116L47 113M34 113L46 117', P.bark[1], 3.2));
  if (lit) t.add(path('M36 114Q34 104 40 96Q42 104 46 100Q48 108 45 114Z', '#ff8a3a', 1), path('M38 114Q37 108 40 102Q43 108 43 114Z', '#ffd24a', 1), path('M39.4 114Q39 110 40.4 107Q42 110 41.6 114Z', '#fff6c0', 1));
  else t.add(ell(40, 114, 7, 2.4, '#4a4440', .7), line('M38 112q-1 -5 2 -9', '#bbb', 1, .3));
  t.add(tuft(8, 118, '#4d7a40', .8, .8), tuft(120, 118, '#4d7a40', .8, .8));
  out(t, 'interest', 'woodcutter-camp', v, ['large', 'camp', 'old-oak-wood', lit ? 'lit' : 'unlit', 'obstacle']);
}

// ============================ grass-layer plants ============================
for (const [v, n, cols, s] of [['a', 7, ['#6fb560', '#4a9a50', '#3f8048'], 641], ['b', 9, ['#7fc88a', '#4a9a58', '#2f7048'], 642], ['c', 6, ['#8fcf6a', '#5fae5c', '#4a9a50'], 643], ['d', 8, ['#6aae78', '#3f8a52', '#2a6a3c'], 644]]) {
  const t = mk('grass', 'fern-clump', v), r = rng(s); t.add(ell(33, 53, 20, 4.5, '#2e2c1a', .14));
  t.add(fronds(32, 52, n, v === 'b' ? 26 : 22, cols, 2.6)); if (v === 'c') t.add(...[[18, 50], [46, 50]].map(([x, y]) => fronds(x, y, 3, 12, cols, 1.5))); if (v === 'd') t.add(bloom('bluebell', 44, 40, .9));
  out(t, 'grass', 'fern-clump', v, ['concealing', 'overlay-prop', 'old-oak-wood']);
}
for (const [v, s] of [['a', 651], ['b', 652]]) { const t = mk('grass', 'moss-mound', v), r = rng(s); t.add(ell(34, 52, 20, 4.5, '#2e2c1a', .14)); t.add(path('M12 52Q12 30 32 28Q52 30 52 52Q32 57 12 52Z', t.lg(['#b8d890', '#7fae5e', '#5f8f4c'], 50), 1, ink('#3f6a38', .9, .75))); for (let i = 0; i < 16; i++) t.add(ell(r.range(16, 48), r.range(32, 50), 2.2, 1, i % 3 ? '#a8cf86' : '#4d7a40', .6, r.range(-40, 40))); t.add(ell(24, 34, 7, 2.4, '#e4f2c8', .5, -15)); if (v === 'b') t.add(mush(t, 40, 40, .38, ['#fff0a0', '#e8a83a'], { spots: false }), fronds(22, 40, 3, 8, ['#6fb560', '#4a9a50'], 1.4)); else t.add(bloom('clover', 30, 38, .8), bloom('clover', 42, 42, .7)); out(t, 'grass', 'moss-mound', v, ['decor', 'old-oak-wood']); }

// ============================ overlays ============================
for (const [v, s, nl, ns] of [['a', 661, 4, 3], ['b', 662, 5, 2], ['c', 663, 3, 4]]) {   // dappled light & shade: soft spots kept inside the cell so any mix of cells with/without it has no seams
  const t = mk('overlays', 'dapple-oak', v), r = rng(s);
  for (let i = 0; i < ns; i++) { const x = r.range(18, 46), y = r.range(18, 46), rx = r.range(8, 13); t.add(ell(x, y, rx, rx * .7, '#1f3a26', .07, i * 37), ell(x, y, rx * .72, rx * .5, '#1f3a26', .07, i * 37), ell(x, y, rx * .4, rx * .28, '#1f3a26', .07, i * 37)); }
  for (let i = 0; i < nl; i++) { const x = r.range(12, 52), y = r.range(12, 52), rx = r.range(3.5, 7); t.add(ell(x, y, rx, rx * .72, '#fff6c0', .18, i * 53), ell(x, y, rx * .7, rx * .5, '#fffbe0', .2, i * 53), ell(x, y, rx * .35, rx * .25, '#fffef0', .25, i * 53)); }
  out(t, 'overlays', 'dapple-oak', v, ['overlay', 'light', 'old-oak-wood']);
}
for (const [v, s] of [['a', 671], ['b', 672]]) {   // light shafts (tall 64x128), transparent
  const t = mk('overlays', 'light-shafts', v, T, 128), r = rng(s);
  for (let i = 0; i < 4; i++) { const x = 8 + i * 14 + r.range(-3, 3), w = r.range(5, 9); const id = t.id(); t.defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c0" stop-opacity=".42"/><stop offset="1" stop-color="#fff6c0" stop-opacity="0"/></linearGradient>`); t.add(`<path d="M${f(x)} 0L${f(x + w)} 0L${f(x + w - 26)} 128L${f(x - 22)} 128Z" fill="url(#${id})"/>`); }
  for (let i = 0; i < 6; i++) t.add(circ(r.range(6, 58), r.range(10, 110), r.range(.8, 1.4), '#fffbe0', .8));
  out(t, 'overlays', 'light-shafts', v, ['overlay', 'tall', 'light', 'old-oak-wood']);
}
for (const [v, s] of [['a', 681], ['b', 682]]) {   // leaves / acorns drifting down
  const t = mk('overlays', 'leaf-fall', v), r = rng(s);
  for (let i = 0; i < 8; i++) { const x = r.range(8, 56), y = r.range(8, 56); if (i % 4 === 3) t.add(acorn(x, y, .9)); else t.add(leafS(x, y, r.range(0, 180), r.pick(['#e8a83a', '#d2622e', '#a8cf86', '#c98a3a']), .95)); }
  t.add(`<path d="M10 14C22 24 34 8 54 30" fill="none" stroke="#fff6c0" stroke-width="1" stroke-dasharray="1 5" opacity=".5"/>`);
  out(t, 'overlays', 'leaf-fall', v, ['overlay', 'old-oak-wood']);
}
for (const [v, c, s] of [['a', '#bff8e8', 691], ['b', '#f6c0f0', 692]]) {   // glowing spores
  const t = mk('overlays', 'spore-glow', v), r = rng(s);
  for (let i = 0; i < 12; i++) { const x = r.range(5, 59), y = r.range(5, 59); t.add(circ(x, y, r.range(2.6, 4.6), t.rg([c, c, c], .5, .5, .5, [.6, .2, 0])), circ(x, y, r.range(.6, 1.1), '#fff', .95)); }
  out(t, 'overlays', 'spore-glow', v, ['overlay', 'glow', 'old-oak-wood']);
}
for (const [v, s] of [['a', 701], ['b', 702]]) {   // low green-tinted forest mist
  const t = mk('overlays', 'forest-mist', v, 128, 128), r = rng(s);
  for (let i = 0; i < 6; i++) { const x = r.range(20, 108), y = r.range(60, 112), rx = r.range(22, 38); t.add(ell(x, y, rx, rx * .26, '#e8f2e0', .2), ell(x + 4, y + 2, rx * .7, rx * .17, '#f4faee', .22)); }
  out(t, 'overlays', 'forest-mist', v, ['overlay', 'large', 'mist', 'old-oak-wood']);
}
{ const t = mk('overlays', 'canopy-shade', 'a'), r = rng(711); t.add(ell(32, 32, 34, 28, '#1f3a26', .14), ell(32, 32, 24, 19, '#1f3a26', .14), ell(32, 34, 14, 10, '#1f3a26', .12)); out(t, 'overlays', 'canopy-shade', 'a', ['overlay', 'shade', 'old-oak-wood']); }
