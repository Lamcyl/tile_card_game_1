// Ashkara sub-area 1: Dune Shallows interest objects: the half-buried caravan wagon (landmark), the dune-crest waypoint cairn, the bleached rib arch gate (closed/open),
// a whale skeleton, fossil dig, abandoned camp, driftwood shelter and a sand-buried chest.
import { T, f, ell, circ, rect, path, line, ink, D, sh, pebbleD, C, TALL, LG, tile, rng } from './dune-shallows-lib.mjs';
import { BONE, DRIFT, ROPE, boneC, curve } from './gen-ashkara-dune-shallows-objects.mjs';

const SAND = ['#fffaea', '#f1dfae', '#d8bc82'];
const heap = (t, cx, cy, rx, ry, op = .96) => ell(cx, cy + ry * .3, rx, ry, t.lg(SAND, 70), op) + ell(cx - rx * .3, cy - ry * .1, rx * .45, ry * .3, '#fff', .5, -8);
const ripl = (x, y, w, n = 2) => Array.from({ length: n }, (_, i) => line(`M${x + i * 4} ${y + i * 3.4}q${w / 4} -2 ${w / 2} 0t${w / 2} 0`, '#c4a468', 1, .45)).join('');
const wheel = (t, cx, cy, rx, ry, spokes = 10, broken = 0) => {
  let o = ell(cx, cy, rx + 1.2, ry + 1.2, 'none', 1, 0, { stroke: '#3b3a24', 'stroke-width': 6.4, 'stroke-opacity': .3 }) + ell(cx, cy, rx, ry, 'none', 1, 0, { stroke: D.wood[1], 'stroke-width': 5 }) + ell(cx, cy, rx, ry, 'none', 1, 0, { stroke: D.wood[0], 'stroke-width': 1.3, 'stroke-opacity': .7 }) + ell(cx, cy, rx - 2.4, ry - 2.4, 'none', 1, 0, { stroke: D.wood[2], 'stroke-width': .8, 'stroke-opacity': .7 }) + ell(cx, cy, rx + 2.4, ry + 2.4, 'none', 1, 0, { stroke: '#5a3c20', 'stroke-width': .8, 'stroke-opacity': .8 });
  for (let i = 0; i < spokes; i++) { if (broken && i % broken === 1) continue; const a = i / spokes * 6.283 + .2; o += line(`M${f(cx)} ${f(cy)}L${f(cx + Math.cos(a) * (rx - 1))} ${f(cy + Math.sin(a) * (ry - 1))}`, '#3b2a14', 2.8, .3) + line(`M${f(cx)} ${f(cy)}L${f(cx + Math.cos(a) * (rx - 1))} ${f(cy + Math.sin(a) * (ry - 1))}`, D.wood[0], 1.6, 1); }
  return o + ell(cx, cy, rx * .3, ry * .22, D.wood[1], 1, 0, ink(D.inkB, .9, .85)) + circ(cx, cy, 1.6, '#4a4640');
};
// ===== landmark: half-buried caravan wagon =====
const wagon = (t, v) => {
  let o = sh(64, 108, 54, 7) + heap(t, 64, 108, 58, 9, .55);
  o += `<g transform="rotate(${v === 'a' ? -3 : 2} 64 100)">`;
  o += wheel(t, 96, 82, 12, 27, 10, v === 'b' ? 3 : 0);                                     // far wheel
  o += path('M22 58L106 58L104 98L24 98Z', t.lg(D.wood, 90), 1, ink(D.inkB, 1.1, .85));    // bed side
  for (let i = 1; i < 4; i++) o += line(`M23 ${58 + i * 10}H105`, D.wood[2], 1, .55) + line(`M23 ${59 + i * 10}H105`, '#e8c894', .8, .35);
  o += rect(22, 54, 84, 5, D.wood[0], 0, 1, ink(D.inkB, .9, .85)) + line('M26 54V98M102 54V98', D.wood[2], 3, .5);
  if (v === 'a') {                                                                          // canvas cover, torn
    o += path('M26 56Q28 24 64 22Q100 24 102 56Z', t.lg(['#fff9ea', '#ecd9b4', '#c8aa7c'], 60), 1, ink('#8a7458', 1, .85));
    for (const x of [44, 64, 84]) o += line(`M${x} ${f(23 + Math.abs(x - 64) * .15)}Q${x - 2} 40 ${x - 1} 56`, '#8a7458', 1, .55);
    o += path('M62 30L70 38L64 42L72 52L58 52L60 44L54 38Z', '#4a3a28', .85) + line('M62 30L70 38L64 42L72 52', '#8a7458', .8, .8) + line('M64 24Q64 40 62 56', '#fffdf6', 1.2, .5);
    o += line('M28 28Q24 38 27 52', D.wood[1], 1.6, .9);
  } else {                                                                                  // collapsed hoops, cloth slumped over the tailgate
    for (const [x, tip] of [[34, 30], [54, 22], [76, 26], [96, 44]]) o += line(`M${x} 56Q${x + 3} ${tip} ${x + 14} ${tip + 4}`, D.wood[1], 2.4, 1) + line(`M${x} 56Q${x + 3} ${tip} ${x + 14} ${tip + 4}`, D.wood[0], 1, .6);
    o += path('M72 56Q76 42 90 46Q104 48 104 60L100 70Q88 64 80 66Q72 64 72 56Z', t.lg(['#fff9ea', '#ecd9b4', '#c8aa7c'], 60), 1, ink('#8a7458', 1, .85));
  }
  o += wheel(t, 42, 88, 13, 28, 10, v === 'b' ? 4 : 0);
  o += line('M104 80L124 66', D.wood[1], 3.4, 1) + line('M104 79L124 65', D.wood[0], 1, .7) + circ(124, 65, 1.8, '#4a4640');   // shaft
  o += `</g>`;
  o += heap(t, 40, 110, 32, 9) + heap(t, 92, 112, 34, 8) + ripl(18, 116, 16) + ripl(80, 118, 18);
  if (v === 'a') o += path('M70 100h12l-1 8h-10Z', D.wood[1], 1, ink(D.inkB, .8, .85)) + ell(76, 100, 6, 2, '#f1dfae', 1);
  else o += path('M52 98L64 94L68 102L56 106Z', D.wood[1], 1, ink(D.inkB, .8, .85)) + path('M70 104L80 100L84 106L74 110Z', D.wood[2], 1, ink(D.inkB, .8, .85)) + ell(112, 108, 6, 3, '#ecd9b4', 1, 0, ink('#8a7458', .6, .8));
  return o;
};
for (const v of ['a', 'b']) tile('interest', 'caravan-wagon-buried', v, LG, ['large', 'landmark', 'wagon', 'obstacle', 'signature', v === 'a' ? 'covered' : 'collapsed'], (t) => wagon(t, v));
// ===== landmark: waypoint cairn on the dune crest =====
const stoneC = ['#f4dcb0', '#dcae7c', '#a97a52'];
const crest = (t, v) => {
  let o = sh(64, 112, 58, 6) + path('M4 116Q20 82 52 80Q86 78 106 94Q122 104 124 116Z', t.lg(['#fffaea', '#f1dfae', '#d0aa6c'], 55), 1) + path('M4 116Q20 82 52 80Q86 78 106 94', 'none', 1, ink('#c4a468', 1, .5)) + path('M24 100Q54 86 100 100', 'none', 1, ink('#fffbe8', 3, .7)) + ripl(22, 108, 18, 3) + ripl(72, 104, 18, 3);
  const st = [[19, 8, 100], [15, 7.4, 90], [11.5, 6.6, 80.6], [8, 5.4, 72.4]];
  st.forEach(([rx, ry, y], i) => { const x = 64 + (i % 2 ? 1.6 : -1.6); o += ell(x + 1, y + ry * .55, rx, ry * .5, '#3b3a24', .12) + ell(x, y, rx, ry, t.lg([stoneC[i % 2 ? 1 : 0], stoneC[i % 2 ? 2 : 1]], 60), 1, 0, ink(D.inkS, 1, .85)) + ell(x - rx * .3, y - ry * .35, rx * .45, ry * .3, '#fff', .55) + line(`M${f(x - rx * .7)} ${f(y + ry * .3)}q${f(rx * .7)} ${f(ry * .3)} ${f(rx * 1.4)} 0`, '#a97a52', 1, .4); });
  if (v === 'a') {
    o += line('M64 70L64 14', D.wood[1], 3, 1) + line('M62.8 70L62.8 14', D.wood[0], 1, .6) + circ(64, 12, 2.6, D.gold[1], 1, ink('#5a3a0a', .5, .85));
    for (const [y, c, w] of [[18, '#d8503a', 22], [28, '#fff6e0', 20], [38, '#3fb0ac', 24], [48, '#f3c24f', 18]]) o += path(`M64 ${y}q${w / 2} -4 ${w} 1q-${w * .35} 2 -${w * .1} 5q-${w * .5} -2 -${w * .9} -1Z`, c, 1, ink('#5a3a24', .5, .8));
  } else {
    o += ell(64, 64, 14, 4, '#3b3a24', .15) + path('M52 62L54 70H74L76 62Q64 58 52 62Z', t.lg(['#f4dcb0', '#c88858'], 90), 1, ink(D.inkS, .9, .85)) + ell(64, 62, 11, 2.8, '#2a1c10', .9) + ell(64, 61, 8, 1.6, '#f3e2a0', .9);
    o += boneC(t, [34, 100], [28, 54], [58, 40], 3, 1) + boneC(t, [94, 100], [100, 54], [70, 40], 3, 1) + line('M56 42l16 0', ROPE, 2, 1);
    for (const [x, y] of [[44, 98], [84, 96], [100, 102]]) o += ell(x, y, 3, 2, '#fff6e8', 1, 20, ink('#b99c86', .5, .7));
  }
  return o + heap(t, 30, 114, 26, 6, .8) + heap(t, 100, 114, 24, 6, .8);
};
for (const v of ['a', 'b']) tile('interest', 'waypoint-cairn-crest', v, LG, ['large', 'landmark', 'cairn', 'waypoint', 'obstacle', 'signature'], (t) => crest(t, v));
// ===== gate: arch of bleached whale ribs =====
const lashing = (x, y) => path(`M${x - 5} ${y - 3}H${x + 5}V${y + 3}H${x - 5}Z`, ROPE, 1, ink('#5a3c20', .8, .85)) + line(`M${x - 5} ${y - 1}h10M${x - 5} ${y + 1.4}h10`, '#5a3c20', .7, .7);
const ribGate = (t, open) => {
  let o = sh(64, 114, 58, 6) + heap(t, 64, 114, 56, 7, .9);
  const R = (a) => (p) => [a ? 128 - p[0] : p[0], p[1]];
  const ribs = [[[12, 114], [4, 60], [30, 52], 7, 2.4, 1], [[116, 114], [124, 60], [98, 52], 7, 2.4, 1]];
  for (const [p0, c, p1, w0, w1] of ribs) o += path(curve(p0, c, p1, w0, w1).d, t.lg(['#eadcc0', '#cbb890', '#9a8662'], 0), 1, ink('#6b5a40', 1, .85));        // outer short ribs
  const cap = (x) => ell(x, 114, 11, 4, '#fffaea', .9);
  for (const left of [true, false]) { const m = (p) => left ? p : [128 - p[0], p[1]], k = curve(m([30, 114]), m([22, 22]), m([66, 22]), 7.6, 3.4); o += path(k.d, t.lg(left ? ['#fffaf0', '#e4d4b4', '#a89470'] : ['#f2e6cc', '#d6c4a0', '#9a8662'], 0), 1, ink('#6b5a40', 1.1, .9)) + line(k.mid(.04, .9), '#fff', 1.2, .6) + line(k.mid(.1, .9).replace(/M/, 'M'), '#a89470', .6, .25); }
  o += lashing(64, 22) + circ(64, 22, 3.6, BONE[1], 1, ink('#6b5a40', .9, .85)) + circ(63, 21, 1.2, '#fff', .8);
  // vertebra pillars at the feet
  for (const x of [30, 98]) for (let i = 0; i < 3; i++) o += ell(x, 112 - i * 6.4, 9 - i, 4, t.lg(BONE, 60), 1, 0, ink('#6b5a40', .8, .85)) + ell(x, 110 - i * 6.4, 3.2, 1.2, '#6b5a40', .5);
  const top = (x) => 30 + 30 * ((x - 64) / 28) ** 2;
  if (!open) {
    for (let i = 0; i < 7; i++) { const x = 38.6 + i * 7.5, y0 = top(x + 3.7) + 6; o += path(`M${f(x)} 114V${f(y0 + 2)}L${f(x + 3.7)} ${f(y0)}L${f(x + 7.2)} ${f(y0 + 2)}V114Z`, t.lg(i % 2 ? DRIFT : ['#f2e6cc', '#d8c6a0', '#a08a68'], 0), 1, ink('#5a4a30', .9, .85)) + line(`M${f(x + 2)} 112V${f(y0 + 6)}`, '#8f7a5a', .8, .5); }
    for (const y of [64, 92]) o += line(`M34 ${y}H94`, '#3b2a14', 4.2, .3) + boneC(t, [32, y], [64, y - 2], [96, y], 3, 3) + lashing(50, y) + lashing(78, y);
    o += line('M64 22V60', ROPE, 1.4, 1) + path('M60 64h8l-1 8h-6Z', BONE[0], 1, ink('#6b5a40', .7, .85)) + circ(64, 68, 1.2, '#4a3a28');
    o += line('M64 88V108', '#3b2a14', 1.6, .6);
  } else {
    o += ell(64, 106, 24, 6, '#fff6d8', .8) + ell(64, 112, 18, 3.4, '#e8c98c', .55);
    o += line('M64 24V44', ROPE, 1.4, 1) + path('M62 44q2 6 4 0q1 6-2 8q-3-2-2-8Z', ROPE, 1, ink('#5a3c20', .5, .8));
    for (const [x, a, h] of [[30, 76, 54], [38, 70, 50], [23, 82, 44]]) o += `<g transform="rotate(${a - 90 + 18} ${x} 114)">` + path(`M${x - 3.2} 114V${114 - h}L${x} ${114 - h - 2.4}L${x + 3.2} ${114 - h}V114Z`, t.lg(DRIFT, 0), 1, ink('#5a4a30', .9, .85)) + `</g>`;
    o += boneC(t, [34, 112], [48, 100], [58, 108], 2.4, 2.4) + lashing(34, 110);
    o += pebbleD(80, 108, .7, [D.stone[0], D.stone[1]]) + pebbleD(88, 111, .5, [D.stone[0], D.stone[1]]);
  }
  return o + heap(t, 14, 115, 14, 4.4, .9) + heap(t, 114, 115, 14, 4.4, .9);
};
for (const open of [false, true]) tile('interest', 'gate-rib-arch', open ? 'open' : 'closed', LG, ['large', 'gate', 'interest', 'signature', open ? 'open' : 'closed', 'obstacle'], (t) => ribGate(t, open));
// ===== whale skeleton on the dunes =====
tile('interest', 'whale-skeleton', 'a', LG, ['large', 'bone', 'whale', 'obstacle', 'signature'], (t, r) => {
  let o = sh(66, 110, 58, 6) + heap(t, 66, 110, 56, 8, .8);
  o += path('M14 100Q20 84 38 86Q50 88 52 98Q40 108 24 106Q14 104 14 100Z', t.lg(BONE, 50), 1, ink('#6b5a40', 1.1, .9)) + ell(28, 94, 4, 3.2, '#4a3a28', 1) + line('M14 100Q30 104 52 98', '#6b5a40', 1.2, .8) + [0, 1, 2, 3, 4].map(i => path(`M${20 + i * 6} 102l1 4l2 -3Z`, '#fff', 1, ink('#6b5a40', .5, .8))).join('');
  const hs = [40, 52, 60, 62, 56, 46, 34];
  hs.forEach((h, i) => { const x = 58 + i * 9; o += boneC(t, [x, 104], [x - 12, 104 - h * .7], [x + 8, 104 - h], 3.6, 1.2, i % 2 ? ['#eadcc0', '#cbb890', '#9a8662'] : ['#fffaf0', '#e4d4b4', '#a89470']); });
  for (let i = 0; i < 9; i++) o += ell(52 + i * 7.6, 104, 5, 3.6, t.lg(BONE, 50), 1, 0, ink('#6b5a40', .8, .85)) + ell(52 + i * 7.6, 103, 1.8, 1.2, '#6b5a40', .5);
  return o + heap(t, 40, 110, 20, 5, .95) + heap(t, 106, 110, 20, 5, .95) + ripl(56, 117, 20, 2);
});
// ===== fossil dig site =====
tile('interest', 'fossil-dig', 'a', LG, ['large', 'dig', 'fossil', 'obstacle', 'signature'], (t, r) => {
  let o = sh(64, 112, 54, 6) + ell(60, 92, 44, 16, '#c9aa7c', .5) + path('M24 90Q30 76 64 74Q98 76 104 92Q98 106 64 108Q30 106 24 90Z', t.lg(['#b8946a', '#9a7a52', '#7a5c3a'], 90), 1, ink('#6b4a2c', 1, .8));
  o += path('M30 88Q40 80 64 80Q88 80 98 88Q90 100 64 102Q38 100 30 88Z', '#a88458', .8);
  o += boneC(t, [38, 94], [48, 78], [70, 84], 3.4, 1.2) + boneC(t, [48, 98], [58, 84], [80, 90], 3, 1) + boneC(t, [60, 100], [70, 88], [90, 94], 2.8, 1) + ell(88, 88, 5, 3, t.lg(BONE, 50), 1, 0, ink('#6b5a40', .8, .85));
  for (const [x, y] of [[22, 100], [106, 100], [30, 72], [100, 72]]) o += line(`M${x} ${y}V${y - 14}`, D.wood[1], 2.4, 1) + circ(x, y - 14, 1.4, '#d8503a');
  o += line('M22 86L30 58L100 58L106 86', '#f4ead0', 1, .9) + line('M22 86L30 58', '#c8aa7c', 1.4, .5);
  o += heap(t, 24, 112, 22, 7) + heap(t, 108, 110, 20, 6) + `<g transform="translate(86 104)">` + path('M-12 0L-8 -12H8L12 0Z', 'none', 1, ink(D.inkB, 2.4, .9)) + path('M-12 0L-8 -12H8L12 0Z', '#e8d4a0', .6) + line('M-8 -4h16M-10 -8h20', '#8a6238', .8, .6) + `</g>`;
  o += line('M48 108L66 66', D.wood[1], 2.4, 1) + path('M60 70L72 68L70 76L60 77Z', '#9a9488', 1, ink('#4a4640', .8, .85));
  return o;
});
// ===== abandoned camp =====
tile('interest', 'abandoned-camp', 'a', LG, ['large', 'camp', 'obstacle', 'signature'], (t, r) => {
  let o = sh(64, 112, 56, 6) + heap(t, 64, 112, 54, 8, .75);
  o += path('M16 106L44 40L72 106Z', t.lg(['#fff9ea', '#e4cfa4', '#b8966a'], 20), 1, ink('#8a7458', 1.1, .85)) + path('M44 40L50 106H72Z', '#c8aa7c', .55) + line('M44 40L44 106', '#8a7458', 1, .6) + path('M30 106Q44 92 58 106', '#2a1c10', .9) + path('M44 40L26 82L22 104', 'none', 1, ink('#8a7458', 1.2, .5));
  o += line('M16 106L8 112M72 106L82 112', ROPE, 1.4, 1) + line('M44 40V32', D.wood[1], 2, 1) + path('M44 32l8 2-8 3Z', '#d8503a', 1, ink('#7a1e24', .5, .8));
  o += ell(96, 100, 14, 5, '#3b3a24', .14) + ell(96, 98, 11, 4, '#5a4a38', .9) + [0, 1, 2, 3, 4, 5, 6].map(i => { const a = i / 7 * 6.283; return ell(96 + Math.cos(a) * 11, 98 + Math.sin(a) * 4, 3, 2.2, t.lg([['#f4dcb0', '#dcae7c'], ['#e8d4b4', '#c4a47c']][i % 2], 60), 1, 0, ink(D.inkS, .7, .8)); }).join('') + line('M90 98l12-2M92 95l8 6', '#2a1c10', 2, .9) + ell(96, 98, 4, 1.4, '#9a9488', .6);
  o += path('M80 112L82 94H104L106 110Z', t.lg(D.wood, 60), 1, ink(D.inkB, .9, .85)) + line('M81 102H105', D.wood[2], 1, .6);
  o += path('M104 112Q102 100 106 94H116Q120 100 118 112Q111 114 104 112Z', t.lg(D.wood, 0), 1, ink(D.inkB, 1, .85)) + line('M104 100Q111 103 118 100M104 107Q111 110 118 107', '#5a4a30', 1.2, .8);
  o += path('M60 110L68 100L78 104L70 112Z', D.linen[1], 1, ink('#8a7458', .8, .8));
  return o + heap(t, 20, 114, 18, 5) + heap(t, 116, 114, 12, 4);
});
// ===== driftwood lean-to =====
tile('interest', 'driftwood-shelter', 'a', LG, ['large', 'camp', 'shelter', 'obstacle'], (t, r) => {
  let o = sh(66, 112, 52, 6) + heap(t, 64, 112, 52, 8, .75);
  o += path('M20 108L30 52L100 44L112 108Z', t.lg(['#fff9ea', '#e4cfa4', '#b8966a'], 40), 1, ink('#8a7458', 1, .85));
  for (const x of [38, 54, 70, 86]) o += line(`M${x} ${f(50 - (x - 38) * .1)}L${x - 2 + (x - 64) * .1} 108`, '#8a7458', 1, .5);
  o += path('M44 108L50 70Q64 64 80 70L84 108Z', '#2a1c10', .9);
  for (const [x0, y0, x1, y1] of [[18, 112, 30, 44], [112, 112, 100, 40]]) o += line(`M${x0} ${y0}L${x1} ${y1}`, '#3b2a14', 5, .3) + path(curve([x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2], [x1, y1], 3.4, 2.4).d, t.lg(DRIFT, 0), 1, ink('#5a4a30', .9, .85));
  o += boneC(t, [26, 48], [64, 36], [106, 42], 2.6, 2.2, DRIFT, '#5a4a30') + lashing(34, 47) + lashing(98, 42);
  o += line('M24 90q-6 6-4 18', ROPE, 1.4, 1);
  return o + heap(t, 30, 114, 24, 6) + heap(t, 104, 114, 20, 5);
});
// ===== sand-buried chest (64x64) =====
for (const open of [false, true]) tile('interest', 'chest-sand-bone', open ? 'open' : 'closed', C, ['chest', 'loot', 'interest', open ? 'open' : 'closed', 'obstacle'], (t) => {
  let o = sh(34, 54, 20, 4) + path('M12 54L14 34H50L52 54Z', t.lg(D.wood, 60), 1, ink(D.inkB, 1, .85)) + line('M13 42H51M13 48H51', D.wood[2], 1, .5);
  o += rect(29, 38, 6, 9, BONE[1], 1, 1, ink('#6b5a40', .7, .85)) + circ(32, 42, 1.2, '#4a3a28');
  if (!open) o += path('M12 36Q14 20 32 18Q50 20 52 36Z', t.lg([D.wood[0], D.wood[1], D.wood[2]], 70), 1, ink(D.inkB, 1, .85)) + line('M14 30Q32 24 50 30', '#e8c894', 1, .5) + line('M22 22V36M42 22V36', BONE[1], 2.2, .9);
  else o += path('M14 34L18 10Q32 6 46 10L50 34Z', '#2a1c10', 1, ink(D.inkB, 1, .85)) + path('M16 34L19 14Q32 11 45 14L48 34Z', t.lg(['#5a3c20', '#3a2412'], 90), 1) + ell(32, 34, 16, 3, '#f3c24f', .9) + circ(26, 32, 2.4, D.gold[1], 1, ink('#7a5a14', .5, .8)) + circ(38, 33, 2, '#3fb0ac', 1, ink('#1f4a56', .5, .8)) + circ(32, 31, 1.6, '#d8503a');
  return o + heap(t, 20, 56, 16, 4.6) + heap(t, 46, 56, 14, 4);
});
