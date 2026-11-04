// Firefly Marsh objects, part 3: stilt huts, the stilt-hut gate, tower, pier, islet shrine, and the overlays (fireflies, lanterns, mist, dusk tint).
import { T, P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, sh, scat, sparkle, glowC, mush, blobPath, shimenawa } from './sub.mjs';
import { wrapped } from './lib.mjs';
import { mossBlob } from './ruins-lib.mjs';
import { pad, cattailS, reedS, blade, wcontact, fireGrad, firefly, hx, mixc } from './marsh-lib.mjs';
import { ring } from './water-lib.mjs';
import { prop, R, ST, ln, mk, out } from './marsh-kit.mjs';

const WD = ['#b59a74', '#8a6a44', '#5e4630'], iw = ink('#3a2418', .9, .8), TH = ['#e8d8a4', '#bfa468', '#8a7040'];
const moss = (x, y, w, h = w * .5, s = 1) => mossBlob(x, y, w, h, s);
const gl = (t, x, y, r, c1 = '#ffe6a0', c2 = '#ffc45a', a = .8) => glowC(t, x, y, r, c1, c2, a);
const pile = (t, x, top, bot = 112) => rect(x - 3.4, top, 6.8, bot - top, t.lg(['#9a7c58', '#6b4a2c', '#4a3220'], 0), 1.5, 1, iw) + ell(x, bot + 1, 5, 1.6, '#eadcea', .55) + moss(x, bot - 6, 4, 2.4, x);
// thatch roof over a path (reed thatch, dusk-lit)
function thatch(t, d, { seed = 1, topY = 24, mossy = false, x0 = 0, x1 = 128 } = {}) {
  const r = rng(seed), clip = t.clip(d), id = clip.slice(5, -1); let o = path(d, t.lg(TH, 60), 1, ink('#5a4018', 1.1, .85)) + `<g clip-path="url(#${id})">`;
  for (let k = 0; k < 10; k++) { const y = topY + 6 + k * 6, dd = `M${x0} ${f(y)}` + Array.from({ length: Math.ceil((x1 - x0) / 8) + 1 }, (_, i) => `L${x0 + i * 8} ${f(y + (i % 2 ? 1.4 : -1.4) + r.range(-.6, .6))}`).join(''); o += line(dd, '#6e5020', 1.1, .3) + line(dd, '#fff3c0', .7, .3, { transform: 'translate(0 -1.3)' }); }
  for (let i = 0; i < 26; i++) o += line(`M${f(r.range(x0 + 10, x1 - 10))} ${f(r.range(topY + 6, topY + 56))}l${f(r.range(-2, 2))} ${f(r.range(3, 6))}`, r() < .5 ? '#6e5020' : '#fff3c0', .8, .4);
  if (mossy) for (const [x, y, w] of [[34, 56, 12], [88, 50, 10], [60, 64, 14]]) o += moss(x, y, w / 2, 3, x);
  return o + '</g>';
}
function stiltHut(t, o) {
  const { v, lit = true } = o;
  t.add(wcontact(64, 118, 52, 7), ell(70, 119, 40, 5, '#1c2a3a', .25));
  for (const x of [28, 52, 78, 102]) t.add(pile(t, x, 84));
  t.add(line('M28 98L52 112M52 98L28 112M78 98L102 112M102 98L78 112', '#4a3220', 1.6, .8));
  // deck
  t.add(rect(14, 84, 100, 7, t.lg(['#cfba94', '#a98e68'], 90), 0, 1, iw), ...[...Array(11)].map((_, i) => line(`M${22 + i * 8.4} 84v7`, '#4a3220', .8, .5)), rect(14, 91, 100, 4, t.lg(['#8f765a', '#5e4a34'], 90), 0, 1, iw));
  // body
  t.add(rect(28, 52, 72, 33, t.lg(['#d8c8a4', '#b09a70'], 90), 0, 1, ink('#4a3220', 1, .85)), rect(28, 52, 72, 12, '#3b3a24', 0, .2));
  for (const x of [28, 52, 76, 100]) t.add(rect(x - 1.6, 52, 3.4, 33, WD[1], 0, 1, ink('#3a2418', .5, .6)));
  t.add(rect(54, 62, 20, 23, '#2a1c10', 2, 1, ink('#1a1208', .9, .9)), lit ? rect(55.5, 63.5, 17, 21.5, t.lg(['#ffd890', '#e89a3a', '#8a4a1c'], 90), 1.5, .95) : rect(55.5, 63.5, 17, 21.5, t.lg(['#8a6038', '#5a3c20'], 0), 1.5), ...[0, 1, 2].map(i => line(`M${60 + i * 5.4} 64V84`, '#3a2818', .8, .5)), circ(70, 76, 1.2, '#e8c870'));
  t.add(rect(34, 62, 14, 12, lit ? t.lg(['#ffe6a0', '#e8a84a'], 90) : '#cfd8d0', 1, 1, ink('#4a3220', .9, .85)), line('M41 62v12M34 68h14', '#4a3220', .8, .8));
  if (lit) t.add(gl(t, 41, 68, 22, '#ffe6a0', '#ffb04a', .55), gl(t, 64, 76, 26, '#ffe6a0', '#ffb04a', .5));
  // roof
  t.add(thatch(t, 'M14 62Q24 40 52 28Q60 22 64 14Q68 22 76 28Q104 40 114 62Q64 72 14 62Z', { seed: 1100 + v.charCodeAt(0), topY: 16, mossy: v !== 'c' }), path('M14 62Q64 72 114 62Q64 76 14 62Z', '#5a4018', .55), line('M56 16l-6 -8M72 16l6 -8', '#6b4a2c', 2.4), path('M52 16Q64 8 76 16L74 22Q64 16 54 22Z', t.lg(['#d8b05a', '#8a6420'], 90), 1, ink('#5a4018', .9, .85)));
  // ladder, lantern, rail
  t.add(rect(106, 62, 3, 54, WD[1], 0, 1, iw), rect(116, 62, 3, 54, WD[1], 0, 1, iw), ...[0, 1, 2, 3, 4, 5].map(i => line(`M107 ${70 + i * 8}H118`, '#4a3220', 1.6, .95)));
  t.add(line('M14 84V72M14 72H30', '#6b4a2c', 1.6), line('M120 84v0', '#6b4a2c', 1));
  if (v === 'b') { t.add(rect(8, 72, 3, 12, WD[1], 0, 1, iw), rect(8, 72, 24, 2.4, WD[1], 0, 1, iw), rect(28, 72, 2.4, 12, WD[1], 0, 1, iw)); for (let i = 0; i < 6; i++) t.add(line(`M${34 + i * 6} 56q-1 ${8 + i % 3 * 3} 1 ${14}`, '#8a8a70', 1, .85)); }
  if (v === 'c') t.add(path('M2 108Q10 118 28 118Q44 116 50 106Q40 110 26 110Q10 110 2 108Z', t.lg(['#b09670', '#6b4a2c'], 90), 1, iw), line('M30 110L30 96', '#6b4a2c', 1.2), ell(26, 111, 16, 2, '#eadcea', .5));
  if (lit) t.add(gl(t, 94, 70, 16, '#ffe6a0', '#ffb04a', .7), line('M94 62v6', '#6b4a2c', 1), ell(94, 74, 4, 5.6, '#e8604a', 1, 0, ink('#4a1410', .8, .8)), rect(90.6, 69, 6.8, 1.2, '#4a1410', 0, .7), rect(90.6, 77, 6.8, 1.2, '#4a1410', 0, .7));
  t.add(cattailS(8, 120, 26, -2, .8), cattailS(18, 122, 20, 3, .7), cattailS(120, 122, 24, 2, .8), pad(34, 120, 5, 'pink'), pad(88, 122, 4.4, null));
}
for (const [v, o] of [['a', {}], ['b', {}], ['c', {}], ['d', { lit: false }]]) prop('interest', 'stilt-hut', v, ['large', 'hut', 'obstacle', 'stilt', 'water', v === 'd' ? 'unlit' : 'lit'], (t) => stiltHut(t, { v, ...o }), 128, 128);
// ---- the stilt-hut gate (closed / open): a gatehouse bridging the boardwalk, with a hall on top ----
function gate(t, open) {
  const ik = iw, r = R('stg');
  t.add(wcontact(64, 120, 58, 7), ell(70, 121, 46, 5, '#1c2a3a', .25));
  for (const x of [10, 24, 42, 86, 104, 118]) t.add(pile(t, x, 96, 118));
  t.add(line('M10 108L24 118M24 108L10 118M104 108L118 118M118 108L104 118', '#4a3220', 1.6, .8));
  // boardwalk through
  t.add(rect(2, 106, 124, 8, t.lg(['#cfba94', '#a98e68'], 90), 0, 1, ik), ...[...Array(15)].map((_, i) => line(`M${10 + i * 8} 106v8`, '#4a3220', .8, .5)), rect(2, 114, 124, 4, t.lg(['#8f765a', '#5e4a34'], 90), 0, 1, ik));
  // side towers
  for (const [x0, x1] of [[6, 46], [82, 122]]) { t.add(rect(x0, 62, x1 - x0, 44, t.lg(['#cbb890', '#9a8458'], 90), 0, 1, ink('#3a2418', 1.1, .85)), rect(x0, 62, x1 - x0, 12, '#3b3a24', 0, .22)); for (let k = 0; k < 5; k++) t.add(line(`M${x0 + 4 + k * (x1 - x0 - 8) / 4} 64V106`, '#4a3220', .8, .45)); t.add(rect(x0 - 2, 62, 3.6, 44, WD[1], 0, 1, ik), rect(x1 - 1.6, 62, 3.6, 44, WD[1], 0, 1, ik), rect(x0 + 8, 74, x1 - x0 - 16, 10, open ? t.lg(['#ffe6a0', '#e8a84a'], 90) : '#2a2018', 1.5, 1, ik), line(`M${(x0 + x1) / 2} 74v10`, '#4a3220', 1, .8), rect(x0, 88, x1 - x0, 2.4, WD[1], 0, .9)); if (open) t.add(gl(t, (x0 + x1) / 2, 80, 24, '#ffe6a0', '#ffb04a', .45)); }
  // lower roofs of the towers
  for (const [a, b, c] of [[2, 26, 50], [78, 102, 126]]) t.add(thatch(t, `M${a} 70Q${a + 8} 54 ${b} 44Q${b + 8} 54 ${c} 70Q${b} 76 ${a} 70Z`, { seed: a + 30, topY: 44, x0: a, x1: c, mossy: false }), path(`M${a} 70Q${b} 76 ${c} 70Q${b} 80 ${a} 70Z`, '#5a4018', .5));
  // passage
  t.add(path('M46 106V70Q46 56 64 54Q82 56 82 70V106Z', open ? t.rg(['#fff0c0', '#ffb04a', '#6e3a14'], .5, .85, .95) : '#2a1c10', 1, ink('#1a1208', 1.2, .9)));
  if (open) t.add(ell(64, 104, 16, 3, '#fff3c8', .8), path('M46 106V72Q46 60 52 57V106Z', t.lg(['#8a6038', '#5a3c20'], 0), 1, ik), path('M82 106V72Q82 60 76 57V106Z', t.lg(['#8a6038', '#5a3c20'], 0), 1, ik), ...[0, 1, 2].map(i => ell(64 + (i - 1) * 4, 70 + i * 12, 1.4, 6, '#fff', .12)), sparkle(60, 80, .6, '#fff6c0'), sparkle(70, 92, .5, '#fff6c0'));
  else { t.add(path('M48 106V71Q48 59 64 57Q80 59 80 71V106Z', t.lg(['#8a6038', '#5a3c20'], 0), 1, ik), ...[54, 59, 64, 69, 74].map(x => line(`M${x} 60V106`, '#3a2818', .8, .5)), rect(48, 76, 32, 3.6, '#4a4a50', 0, 1, ink('#1d1d22', .6, .8)), rect(48, 94, 32, 3.6, '#4a4a50', 0, 1, ink('#1d1d22', .6, .8)), line('M64 58V106', '#2a1c10', 1.4, .9), circ(60, 88, 2.2, '#e8c870', 1, ink('#8a6420', .6, .8)), circ(68, 88, 2.2, '#e8c870', 1, ink('#8a6420', .6, .8))); for (const [x, y] of [[56, 66], [72, 66]]) t.add(rect(x - 2.6, y, 5.2, 11, '#f6f0e0', 1, 1, ink('#a89a80', .6, .8)), line(`M${x} ${y + 2}v7`, '#c8352b', 1, .8)); }
  t.add(shimenawa(t, 44, 84, 56, 6, 3.4, true));
  // stone feet and sill
  t.add(rect(42, 104, 44, 4, t.lg(['#cfd0c4', '#8a8e7c'], 90), 1, 1, ln));
  // upper hall bridging the towers: big curved roof with chigi ridge-ends
  t.add(rect(20, 36, 88, 20, t.lg(['#d8c8a4', '#a68e60'], 90), 0, 1, ink('#3a2418', 1.1, .85)), rect(20, 36, 88, 8, '#3b3a24', 0, .2));
  for (const x of [20, 40, 64, 88, 108]) t.add(rect(x - 1.8, 36, 3.6, 20, WD[1], 0, 1, ik));
  for (const x of [30, 52, 76, 98]) t.add(rect(x - 5, 42, 10, 8, open ? '#ffe6a0' : '#fff0c8', 1, 1, ink('#4a3220', .8, .85)), line(`M${x} 42v8`, '#4a3220', .7, .7), open || true ? gl(t, x, 46, 10, '#ffe6a0', '#ffb04a', .45) : '');
  t.add(thatch(t, 'M8 44Q20 24 52 14Q60 10 64 4Q68 10 76 14Q108 24 120 44Q64 54 8 44Z', { seed: 1203, topY: 4, mossy: true }), path('M8 44Q64 54 120 44Q64 58 8 44Z', '#5a4018', .55), line('M58 6l-9 -5M70 6l9 -5', '#6b4a2c', 2.6), path('M54 6Q64 -2 74 6L72 12Q64 6 56 12Z', t.lg(['#d8b05a', '#8a6420'], 90), 1, ink('#5a4018', .9, .85)));
  // serpent emblem plaque above the passage and hanging lanterns
  t.add(rect(52, 58, 24, 5, '#2a2018', 1, 1, ink('#1a1208', .7, .8)), line('M55 60.5q3 -2 5 0t5 0t5 0t4 0', '#e8c870', 1, .9));
  for (const x of [14, 114]) t.add(gl(t, x, 78, 16, '#ffe6a0', '#ffb04a', open ? .8 : .55), line(`M${x} 70v4`, '#6b4a2c', 1), ell(x, 80, 4.4, 6, '#e8604a', 1, 0, ink('#4a1410', .8, .8)), rect(x - 3.2, 74, 6.4, 1.2, '#4a1410', 0, .7), rect(x - 3.2, 83, 6.4, 1.2, '#4a1410', 0, .7));
  t.add(cattailS(4, 122, 28, -2, .8), cattailS(124, 122, 26, 2, .8), pad(30, 124, 5, 'pink'), pad(100, 124, 4.6, null));
}
for (const [v, o] of [['closed', false], ['open', true]]) prop('interest', 'gate-stilt-hut', v, ['large', 'gate', 'obstacle', 'stilt', 'water', o ? 'open' : 'closed'], (t) => gate(t, o), 128, 128);
// ---- watchtower on stilts ----
prop('interest', 'watchtower-stilt', 'a', ['large', 'tower', 'obstacle', 'stilt', 'water'], (t) => {
  t.add(wcontact(64, 120, 38, 6), ell(70, 121, 28, 4, '#1c2a3a', .25));
  for (const x of [40, 56, 72, 88]) t.add(pile(t, x, 62, 118));
  t.add(line('M40 100L88 116M88 100L40 116M40 80L88 98M88 80L40 98', '#4a3220', 1.6, .75));
  t.add(rect(34, 60, 60, 6, t.lg(['#cfba94', '#a98e68'], 90), 0, 1, iw), rect(34, 66, 60, 3, '#6b4a2c', 0, 1, iw));
  t.add(rect(42, 34, 44, 27, t.lg(['#d8c8a4', '#b09a70'], 90), 0, 1, ink('#4a3220', 1, .85)), rect(50, 40, 12, 12, t.lg(['#ffe6a0', '#e8a84a'], 90), 1, 1, iw), rect(68, 40, 12, 12, '#2a2018', 1, 1, iw), gl(t, 56, 46, 20, '#ffe6a0', '#ffb04a', .6));
  t.add(thatch(t, 'M32 38Q40 22 64 10Q88 22 96 38Q64 44 32 38Z', { seed: 1301, topY: 10, x0: 28, x1: 100, mossy: true }), path('M32 38Q64 44 96 38Q64 48 32 38Z', '#5a4018', .5), line('M60 10l-4 -8M68 10l4 -8', '#6b4a2c', 2));
  t.add(rect(98, 40, 3, 78, WD[1], 0, 1, iw), rect(112, 40, 3, 78, WD[1], 0, 1, iw), ...[...Array(9)].map((_, i) => line(`M99 ${48 + i * 8}H114`, '#4a3220', 1.6, .95)), line('M98 40L88 40', '#6b4a2c', 2));
  t.add(cattailS(22, 122, 28, -2, .8), cattailS(30, 124, 20, 2, .7), pad(106, 122, 5, null));
}, 128, 128);
// ---- pier landing (transparent over water), boat tied up ----
prop('interest', 'pier-landing', 'a', ['large', 'pier', 'walkable', 'water', 'boat'], (t) => {
  t.add(ell(64, 100, 58, 20, '#1c2a3a', .2), rect(4, 74, 120, 24, '#1c2a3a', 2, .22));
  for (const x of [12, 40, 68, 96]) t.add(pile(t, x, 80, 108));
  t.add(rect(6, 68, 116, 26, t.lg(['#d8c49e', '#b09670'], 0), 1.5, 1, iw), ...[...Array(14)].map((_, i) => line(`M${14 + i * 8} 68v26`, '#4a3220', .8, .5)), rect(6, 94, 116, 6, t.lg(['#8f765a', '#5e4a34'], 90), 0, 1, iw), rect(6, 94, 116, 1, '#c8b08a', 0, .5));
  t.add(rect(8, 56, 3, 14, WD[1], 0, 1, iw), rect(116, 56, 3, 14, WD[1], 0, 1, iw), rect(8, 56, 111, 2.4, WD[1], 0, 1, iw), gl(t, 116, 52, 14, '#ffe6a0', '#ffb04a', .7), ell(116, 56, 3.6, 5, '#e8604a', 1, 0, ink('#4a1410', .8, .8)));
  t.add(path('M30 108Q40 120 62 120Q82 118 90 106Q78 112 60 112Q42 112 30 108Z', t.lg(['#b09670', '#6b4a2c'], 90), 1, iw), line('M44 104Q40 100 42 96', '#8a8a70', 1.2), ell(62, 117, 32, 3, '#eadcea', .5), cattailS(14, 120, 22, -2, .8), pad(104, 114, 5, 'pink'));
}, 128, 128);
// ---- islet shrine ----
prop('interest', 'shrine-islet-marsh', 'a', ['large', 'shrine', 'obstacle', 'islet', 'water'], (t, r) => {
  t.add(wcontact(64, 112, 54, 9));
  t.add(path(blobPath(r, 64, 104, 46, 14, 9, .1), t.lg(['#c8b99b', '#a39379'], 90), 1, ink('#4a3a28', .9, .7)), ell(64, 100, 38, 8, '#bdb286', .8), ...[0, 1, 2, 3, 4].map(i => tuft(24 + i * 20, 108 + (i % 2) * 2, '#6e7a3e', .85, .7)));
  const g = t.lg(['#ec6a50', '#c8352b', '#8e2118'], 0), faded = t.lg(['#d0a090', '#a47060', '#6a4a3e'], 0), ik = ink('#5a1a14', .9, .85);
  for (const x of [38, 66]) t.add(rect(x - 3, 66, 6, 38, faded, 1, 1, ik));
  t.add(path('M30 66Q52 60 74 66L72 72Q52 66 32 72Z', '#2a2a30', 1, ink('#000', .5, .8)), rect(38, 76, 28, 4, g, 1, 1, ik), rect(34, 100, 10, 5, t.lg(ST, 0), 1, 1, ln), rect(60, 100, 10, 5, t.lg(ST, 0), 1, 1, ln), moss(52, 70, 10, 2.8, 5));
  t.add(line('M44 80v10M60 80v10', '#fffaf0', 1.4, .9), shimenawa(t, 38, 66, 82, 5, 3, false));
  // jizo + lantern + willow
  t.add(path('M84 104V88Q82 78 88 74H96Q102 78 100 88V104Z', t.lg(['#d8d6c6', '#a4a290', '#76766a'], 0), 1, ln), circ(92, 70, 6, t.lg(['#d8d6c6', '#a4a290'], 0), 1, ln), rect(86, 80, 12, 3.4, '#c8553f', 1), moss(90, 96, 6, 2.6, 2));
  t.add(rect(106, 92, 6, 12, t.lg(ST, 0), 1, 1, ln), rect(103, 86, 12, 7, '#ffe6a0', 1, 1, ln), rect(102, 82, 14, 4, t.lg(ST, 0), 1, 1, ln), gl(t, 109, 88, 14, '#ffe6a0', '#ffc45a', .7));
  for (const x of [14, 22, 120]) t.add(cattailS(x, 112, 24, x < 64 ? -2 : 2, .8));
  t.add(pad(10, 118, 5, 'pink'), pad(112, 118, 4.6, null));
}, 128, 128);

// ============================ overlays ============================
const ov = (name, v, w, h, fn, tags = []) => { const t = mk('overlays', name, v, w, h); fn(t, R(name + v)); out(t, 'overlays', name, v, ['overlay', 'marsh', ...tags]); };
const FF = { a: 3, b: 6, c: 10, d: 16 };
for (const [v, n] of Object.entries(FF)) ov('fireflies', v, T, T, (t, r) => { const gl2 = fireGrad(t); for (const [x, y] of scat(r, n, 6, v === 'd' ? 8 : 11)) t.add(firefly(gl2, x, y, r.range(.7, 1.1))); }, ['fireflies', 'glow', 'ambient', 'density:' + n]);
ov('fireflies', 'e', T, T, (t, r) => { const g1 = fireGrad(t, '#e8ffd0', '#8fe070'), g2 = fireGrad(t, '#fff0b0', '#ffd24a'); [[14, 40], [26, 30], [38, 36], [50, 24], [46, 46], [24, 50]].forEach(([x, y], i) => t.add(firefly(i % 2 ? g1 : g2, x, y, .8 + (i % 3) * .15, '#fffff0'))); t.add(line('M14 40Q20 32 26 30', '#fffbc0', 1, .35, { 'stroke-dasharray': '1 2' })); }, ['fireflies', 'glow', 'ambient', 'mixed']);
for (const [v, n] of [['a', 22], ['b', 40]]) ov('fireflies-swarm', v, 128, 128, (t, r) => { const gl2 = fireGrad(t), g2 = fireGrad(t, '#e8ffd0', '#8fe070'); for (let i = 0; i < n; i++) { const x = r.range(10, 118), y = r.range(10, 118); t.add(firefly(i % 4 ? gl2 : g2, x, y, r.range(.7, 1.2))); if (i % 5 === 0) t.add(line(`M${f(x)} ${f(y)}q${f(r.range(-8, 8))} ${f(r.range(-8, 8))} ${f(r.range(-14, 14))} ${f(r.range(-10, 10))}`, '#fffbc0', .9, .3, { 'stroke-dasharray': '1 2.4' })); } }, ['fireflies', 'glow', 'ambient', 'large', 'swarm']);
function lanternGlow(t, x, y, s, col = ['#fff0c0', '#ffc45a']) { return gl(t, x, y, 18 * s, col[0], col[1], .8) + ell(x, y, 3.8 * s, 5 * s, '#e8604a', 1, 0, ink('#6e1a10', .6, .8)) + ell(x - .8 * s, y - 1.2 * s, 1.2 * s, 2 * s, '#ffe6a0', .8) + rect(x - 2.8 * s, y - 5.4 * s, 5.6 * s, 1.2 * s, '#4a1410', 0, .8) + ell(x, y + 7 * s, 8 * s, 1.8 * s, '#ffc45a', .4); }
for (const [v, pts] of [['a', [[32, 34, 1]]], ['b', [[20, 30, .9], [44, 40, 1.1]]], ['c', [[16, 24, .8], [34, 38, 1.1], [50, 22, .9]]]]) ov('lanterns-floating', v, T, T, (t) => pts.forEach(([x, y, s]) => t.add(lanternGlow(t, x, y, s))), ['lantern', 'glow', 'water', 'ambient']);
for (const v of ['a', 'b']) ov('wisp-trail', v, T, T, (t, r) => { const c = v === 'a' ? ['#e8fff4', '#7fe0c0'] : ['#e0f0ff', '#8ab4f0']; for (let i = 0; i < 6; i++) { const x = 8 + i * 9, y = 40 - Math.sin(i * .9 + (v === 'b' ? 2 : 0)) * 12; t.add(circ(x, y, 7 - i * .7, c[1], .12 + i * .02), circ(x, y, 3.4 - i * .3, c[0], .35 + i * .08), circ(x, y, 1, '#fff', .9)); } }, ['wisp', 'glow', 'ambient']);
for (const v of ['a', 'b', 'c', 'd']) ov('mist-bank', v, 128, 128, (t, r) => { for (let i = 0; i < 11; i++) { const x = r.range(20, 108), y = r.range(44, 96), rx = r.range(24, 44); t.add(ell(x, y, rx, rx * r.range(.18, .28), i % 3 === 0 ? '#e6cfe0' : '#dfe6ee', r.range(.18, .3)), ell(x + 5, y - 2, rx * .6, rx * .12, '#fff', .18)); } }, ['mist', 'large', 'dusk']);
for (const v of ['a', 'b', 'c']) ov('mist-low', v, T, T, (t, r) => { for (let i = 0; i < 4; i++) { const x = r.range(14, 50), y = r.range(30, 54), rx = r.range(14, 26); t.add(ell(x, y, rx, rx * .26, '#e2e4ee', r.range(.2, .32)), ell(x + 3, y - 1.4, rx * .55, rx * .1, '#fff', .2)); } }, ['mist', 'low', 'dusk']);
// dusk tint washes: a uniform wash plus wrapped mottling, so neighbouring cells match exactly
const wash = (rose, ind, k) => (t, r) => { t.add(rect(0, 0, T, T, '#8a6a9a', 0, .08 * k)); for (let i = 0; i < 4; i++) { const x = r.range(0, T), y = r.range(0, T), rx = r.range(14, 24); t.add(wrapped(x, y, rx, (a, b) => ell(a, b, rx, rx * .6, i % 2 ? ind : rose, .08 * k, r.range(0, 180)))); } };
const hw = (n) => R('dt' + n);
for (const [v, k] of [['light', 1], ['mid', 1.8], ['deep', 2.8]]) { const t = mk('overlays', 'dusk-tint', v, T, T), r = hw(v); wash('#e8a8b8', '#7a88c8', k)(t, r); out(t, 'overlays', 'dusk-tint', v, ['overlay', 'marsh', 'dusk', 'tint', 'seamless']); }
for (const v of ['a', 'b']) ov('midges', v, T, T, (t, r) => { for (let i = 0; i < 18; i++) t.add(circ(r.range(6, 58), r.range(6, 58), r.range(.5, .9), '#3a3a50', r.range(.4, .7))); }, ['ambient', 'insects']);
ov('bats-flight', 'a', 128, 128, (t, r) => { const bat = (x, y, s, rot) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">` + path('M0 0Q-6 -7 -14 -3Q-10 -1 -9 3Q-5 0 -2 3Q0 0 2 3Q5 0 9 3Q10 -1 14 -3Q6 -7 0 0Z', '#2a2f48', .92, ink('#141a2c', .5, .8)) + ell(0, 1, 1.8, 3, '#2a2f48', 1) + '</g>'; t.add(bat(30, 40, 1, -8), bat(60, 26, .8, 6), bat(86, 54, 1.1, -4), bat(48, 74, .7, 10), bat(100, 30, .6, 0)); }, ['creature', 'bats', 'large', 'dusk']);
for (const v of ['a', 'b']) ov('sparkle-dusk', v, T, T, (t, r) => { for (let i = 0; i < (v === 'a' ? 4 : 7); i++) t.add(sparkle(r.range(10, 54), r.range(10, 54), r.range(.4, .8), r.pick(['#fbe4ec', '#f6d0e0', '#e8e8ff']))); }, ['water', 'glint', 'dusk']);
