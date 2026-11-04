// Misty Highlands objects, part 2: the mountain gate, stone circle, standing-stone group, shepherd huts, waterfalls, boulder; overlays (mist, cloud shadow, wind, birds).
import { T, P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, sh, scat, sparkle, glowC, rockS, blobPath, bloom, shimenawa } from './sub.mjs';
import { wrapped } from './lib.mjs';
import { mossBlob } from './ruins-lib.mjs';
import { stoneS, heatherS, flagCols, flagTri, mistBlob, mixc } from './hills-lib.mjs';
import { ring } from './water-lib.mjs';
import { prop, R, GS, ln, iw, mk, out } from './hills-kit.mjs';

const lichen = (x, y, w, h = w * .5, s = 1) => mossBlob(x, y, w, h, s, ['#d8d098', '#a8a060']);
const SL = ['#8a9ab4', '#566884', '#3a4a66'];     // slate roof
const STG = ['#e2e4e6', '#aab0b6', '#6e747c'];    // gate stone
const gl = (t, x, y, r, c1 = '#ffe6a0', c2 = '#ffc45a', a = .8) => glowC(t, x, y, r, c1, c2, a);
// ---- the stone mountain gate (region exit): twin slate-roofed towers, a heavy arch, carved lintel, studded doors ----
function mountainGate(t, open) {
  const ik = ink('#3a3e46', 1.1, .85), r = R('mg' + open);
  t.add(sh(66, 118, 60, 8));
  // stairs and base
  t.add(rect(30, 112, 68, 5, t.lg(['#e2e4e6', '#9aa0a6'], 90), 1, 1, ik), rect(24, 116, 80, 5, t.lg(['#d4d8da', '#868c92'], 90), 1, 1, ik), line('M30 114h68', '#fff', .8, .5));
  // curtain wall with ashlar courses and crenellations
  t.add(rect(10, 52, 108, 62, t.lg(STG, 90), 0, 1, ik));
  for (let row = 0; row < 7; row++) { const y = 54 + row * 8.6; t.add(line(`M10 ${y}H118`, '#4a5058', 1, .35)); for (let x = (row % 2 ? 6 : 14); x < 118; x += 16) t.add(line(`M${x} ${y}v8.6`, '#4a5058', 1, .3)); }
  t.add(rect(10, 52, 108, 8, '#fff', 0, .18), rect(10, 98, 108, 16, '#3b3a24', 0, .12));
  for (let x = 14; x < 114; x += 16) t.add(rect(x, 44, 10, 10, t.lg(STG, 90), 0, 1, ik), rect(x, 44, 10, 2, '#fff', 0, .45));
  t.add(rect(10, 52, 108, 2.4, '#8a9096', 0, 1, ik));
  // towers with battered sides and slate roofs
  for (const [x0, x1] of [[8, 44], [84, 120]]) {
    t.add(path(`M${x0 + 3} 114L${x0} 40H${x1}L${x1 - 3} 114Z`, t.lg(STG, 0), 1, ik));
    for (let row = 0; row < 8; row++) { const y = 44 + row * 8.6; t.add(line(`M${x0 + 1} ${y}H${x1 - 1}`, '#4a5058', 1, .32), ...[0, 1, 2].map(k => line(`M${x0 + (row % 2 ? 8 : 14) + k * 13} ${y}v8.6`, '#4a5058', 1, .28))); }
    t.add(rect(x0 + 1, 40, 5, 74, '#fff', 0, .16), rect(x1 - 7, 40, 7, 74, '#3b3a24', 0, .14));
    const wx = (x0 + x1) / 2; t.add(rect(wx - 3.6, 62, 7.2, 16, '#1c2230', 3, 1, ik), rect(wx - 3, 62.4, 6, 4, '#4a5068', 2, .8), ell(wx, 62, 3.6, 1.4, '#1c2230', 1));
    if (open) t.add(gl(t, wx, 70, 12, '#fff0c0', '#ffb04a', .5));
    t.add(rect(x0 - 2, 36, x1 - x0 + 4, 6, t.lg(['#b0b6bc', '#6e747c'], 90), 1, 1, ik));
    t.add(path(`M${x0 - 6} 38Q${x0 + 4} 30 ${wx - 6} 14Q${wx} 4 ${wx} 2Q${wx} 4 ${wx + 6} 14Q${x1 - 4} 30 ${x1 + 6} 38Q${wx} 34 ${x0 - 6} 38Z`, t.lg(SL, 60), 1, ink('#1a2438', 1.1, .85)), ...[0, 1, 2, 3].map(k => line(`M${x0 - 6 + k * 3} ${36 - k * 2}Q${wx} ${30 - k * 6 + 6} ${x1 + 6 - k * 3} ${36 - k * 2}`, '#1a2438', .8, .35)), path(`M${x0 - 2} 36Q${x0 + 8} 28 ${wx - 5} 14Q${wx - 1} 8 ${wx} 6Q${wx - 4} 18 ${x0 + 6} 32Z`, '#fff', .3), circ(wx, 2, 2.4, '#e8c870', 1, ink('#6a5018', .6, .85)), path(`M${x0 - 6} 38q-3 2 -2 4q4 -1 6 -3Z`, SL[1], 1, ink('#1a2438', .6, .8)), path(`M${x1 + 6} 38q3 2 2 4q-4 -1 -6 -3Z`, SL[1], 1, ink('#1a2438', .6, .8)));
  }
  // arch and lintel
  t.add(path('M40 114V74Q40 50 64 48Q88 50 88 74V114Z', t.lg(['#caced2', '#8a9096'], 0), 1, ik));
  for (let i = 0; i < 11; i++) { const a = Math.PI + (i + .5) / 11 * Math.PI, ca = Math.cos(a), sa = Math.sin(a); t.add(line(`M${f(64 + ca * 18)} ${f(76 + sa * 22)}L${f(64 + ca * 24)} ${f(76 + sa * 28)}`, '#4a5058', 1.1, .5)); }
  t.add(path('M46 114V76Q46 56 64 54Q82 56 82 76V114Z', open ? t.rg(['#fff8e0', '#e8d8b0', '#7a8aa0'], .5, .9, .95) : '#1c2230', 1, ink('#0e121a', 1.2, .9)));
  if (open) { t.add(ell(64, 110, 14, 3, '#fff6d8', .9), path('M46 114V78Q46 62 52 58V114Z', t.lg(['#5a4a3a', '#3a2c20'], 0), 1, ik), path('M82 114V78Q82 62 76 58V114Z', t.lg(['#5a4a3a', '#3a2c20'], 0), 1, ik), ...[0, 1, 2, 3].map(i => mistBlob(58 + i * 4, 70 + i * 10, 8, 3, '#fff', .45)), sparkle(60, 84, .6, '#fff6c0'), sparkle(68, 98, .5, '#fff6c0')); }
  else { t.add(path('M48 114V77Q48 60 64 58Q80 60 80 77V114Z', t.lg(['#5a4a3a', '#3a2c20', '#241a12'], 0), 1, ik), line('M64 58V114', '#12100c', 1.6, .9)); for (const y of [72, 88, 102]) t.add(rect(48, y, 32, 4, '#3a3e46', 0, 1, ink('#10141c', .6, .8))); for (const [x, y] of [[54, 80], [54, 96], [74, 80], [74, 96], [58, 66], [70, 66]]) t.add(circ(x, y, 1.2, '#9aa0a8', 1, ink('#10141c', .4, .8)), circ(x - .4, y - .4, .4, '#fff', .8)); t.add(circ(60, 90, 3, '#d8b050', 1, ink('#6a5018', .6, .85)), circ(68, 90, 3, '#d8b050', 1, ink('#6a5018', .6, .85)), rect(57, 84, 14, 2, '#d8b050', 0, 1)); }
  t.add(rect(36, 50, 56, 8, t.lg(['#d4d8da', '#7a8086'], 90), 1.5, 1, ik), rect(36, 50, 56, 2, '#fff', 1, .5));
  // carved relief panel above the arch: a cloud and thunder crest (raijin)
  t.add(rect(50, 36, 28, 12, '#8a9096', 2, 1, ik), rect(51, 37, 26, 10, t.lg(['#aab0b6', '#6e747c'], 90), 1.5, 1), path('M58 44q-2 -4 2 -5q1 -3 5 -2q3 -2 5 1q4 0 3 4Z', '#e2e4e6', 1, ink('#3a3e46', .6, .8)), path('M62 40l3 -3l-1.4 3l3 0l-4 5l1 -3Z', '#f3c24f', 1, ink('#8a6a1c', .5, .85)));
  // banners, braziers, flags
  for (const x of [48, 80]) t.add(rect(x - 1, 54, 2, 30, '#6b4a2c', 0, 1), path(`M${x - 5} 58h10v22l-5 -4l-5 4Z`, '#33456f', 1, ink('#1a2438', .7, .85)), line(`M${x} 62v10`, '#f3c24f', 1.2, .9));
  for (const x of [20, 108]) { t.add(rect(x - 5, 100, 10, 4, '#6e747c', 1, 1, ik), path(`M${x - 7} 100l14 0l-3 -6l-8 0Z`, '#4a5058', 1, ik), rect(x - 1, 104, 2, 10, '#4a5058', 0, 1)); t.add(gl(t, x, 94, 16, '#ffe6a0', '#ff9a3a', open ? .9 : .7), path(`M${x} 84Q${x + 5} 92 ${x + 2} 98H${x - 2}Q${x - 5} 92 ${x} 84Z`, '#ffb04a', 1), path(`M${x} 88Q${x + 3} 93 ${x + 1} 98H${x - 1}Q${x - 3} 93 ${x} 88Z`, '#fff0a0', 1)); }
  for (const [x1, y1, x2, y2] of [[6, 8, 42, 24], [122, 8, 88, 24]]) { const cx = (x1 + x2) / 2, cy = Math.max(y1, y2) + 8; t.add(line(`M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`, '#6a5238', 1, .95)); for (let k = 0; k < 5; k++) { const u = (k + .5) / 5, x = (1 - u) * (1 - u) * x1 + 2 * (1 - u) * u * cx + u * u * x2, y = (1 - u) * (1 - u) * y1 + 2 * (1 - u) * u * cy + u * u * y2; t.add(flagTri(x - 2.4, y, 4.8, 7, flagCols[(k + (x1 > 60 ? 2 : 0)) % 5], 1)); } }
  t.add(lichen(20, 70, 8, 3, 1), lichen(106, 84, 7, 2.6, 2), lichen(40, 110, 6, 2.4, 3), tuft(8, 119, '#8f8a48', .8, .9), tuft(120, 120, '#8f8a48', .8, .8), stoneS(14, 120, 1.4), stoneS(112, 121, 1.2));
}
for (const [v, o] of [['closed', false], ['open', true]]) prop('interest', 'gate-mountain', v, ['large', 'gate', 'obstacle', 'stone', 'boss-gate', 'region-exit', o ? 'open' : 'closed'], (t) => mountainGate(t, o), 128, 128);
// ---- stone circle (dim / lit) ----
function circle(t, lit) {
  const cx = 64, cy = 96, r = R('sc');
  t.add(ell(64, 100, 56, 18, '#b4a870', .35), ell(64, 100, 48, 14, '#d3c48e', .45));
  if (lit) t.add(gl(t, 64, 92, 54, '#c8f0ff', '#7ab0f0', .45));
  const pts = [[14, 100, .8], [24, 112, 1], [42, 118, 1.05], [64, 120, 1.1], [86, 118, 1.05], [104, 112, 1], [114, 100, .8], [104, 86, .75], [86, 80, .7], [64, 78, .7], [42, 80, .7], [24, 86, .75]];
  const order = [...pts].sort((a, b) => a[1] - b[1]);
  for (const [x, y, k] of order) { const w = 6.6 * k, h = 24 * k; t.add(ell(x + 3, y + 1, 9 * k, 2.4 * k, '#3b3a24', .2), path(`M${x - w} ${y}L${x - w * .9} ${y - h * .6}L${x - w * .3} ${y - h}L${x + w * .6} ${y - h * .94}L${x + w} ${y - h * .5}L${x + w * .9} ${y}Z`, t.lg(GS, 0), 1, ln), line(`M${x - w * .5} ${y - h * .3}h${w}`, '#4a4e54', 1, .35), path(`M${x - w * .8} ${y - h * .6}L${x - w * .3} ${y - h * .96}L${x - w * .2} ${y - h * .5}Z`, '#fff', .35), lichen(x - w * .3, y - h * .35, w * .6, 2, x)); if (lit) t.add(line(`M${x - w * .4} ${y - h * .6}l${w * .3} -3l${w * .3} 4`, '#bff0ff', 1.2, .9), sparkle(x, y - h - 2, .5, '#d8f4ff')); }
  t.add(path(`M54 94L56 84H74L76 94Z`, t.lg(['#e2e4e0', '#9aa09c'], 90), 1, ln), ell(64, 84, 10, 3, lit ? '#d8f4ff' : '#cfd2cc', 1, 0, ln));
  if (lit) t.add(gl(t, 64, 82, 12, '#fff', '#8ac8ff', .8), ...[0, 1, 2, 3, 4].map(i => circ(54 + i * 5, 76 - (i % 2) * 6, 1, '#fff', .85)));
  t.add(tuft(8, 114, '#8f8a48', .8, .9), tuft(118, 116, '#8f8a48', .8, .8));
}
for (const [v, lit] of [['a', false], ['b', true]]) prop('interest', 'stone-circle', v, ['large', 'obstacle', 'stone-circle', 'landmark', lit ? 'lit' : 'dim'], (t) => circle(t, lit), 128, 128);
// ---- three great stones with a shimenawa (from the Misty Highlands mockup) ----
prop('interest', 'standing-stones-trio', 'a', ['large', 'obstacle', 'standing-stone', 'shimenawa', 'landmark'], (t, r) => {
  t.add(ell(66, 114, 54, 8, '#3b3a24', .16));
  const S = (x, y, w, h, lean, i) => { t.add(ell(x + 4, y + 1, w + 3, 3, '#3b3a24', .2), `<g transform="rotate(${lean} ${x} ${y})">`, path(`M${x - w} ${y}L${x - w * .9} ${y - h * .6}L${x - w * .3} ${y - h}Q${x + w * .3} ${y - h - 3} ${x + w * .7} ${y - h * .9}L${x + w} ${y - h * .4}L${x + w * .9} ${y}Z`, t.lg(GS, 0), 1, ln), path(`M${x - w * .8} ${y - h * .6}L${x - w * .3} ${y - h * .98}L${x - w * .2} ${y - h * .4}Z`, '#fff', .4), ...[0, 1, 2, 3].map(k => line(`M${x - w * .8} ${y - h * .2 - k * h * .18}h${w * r.range(.7, 1.4)}`, '#4a4e54', 1, .35)), lichen(x - w * .3, y - h * .3, w * .6, 2.4, i), lichen(x + w * .3, y - h * .7, w * .4, 2, i + 3), '</g>'); };
  S(36, 112, 11, 74, -3, 1); S(88, 114, 12, 86, 3, 2); S(62, 108, 9, 56, 0, 3);
  t.add(shimenawa(t, 28, 98, 66, 12, 4.6, true), tuft(10, 118, '#8f8a48', .8, .9), tuft(116, 118, '#8f8a48', .8, .8), stoneS(14, 114, 1.4), stoneS(108, 116, 1.2), lichen(20, 112, 9, 3, 6));
}, 128, 128);
prop('interest', 'trilithon', 'a', ['large', 'obstacle', 'standing-stone', 'landmark', 'gate'], (t, r) => { t.add(ell(66, 116, 54, 7, '#3b3a24', .18)); for (const x of [30, 96]) t.add(path(`M${x - 12} 114L${x - 11} 52L${x - 4} 38H${x + 8}L${x + 12} 52L${x + 13} 114Z`, t.lg(GS, 0), 1, ln), path(`M${x - 10} 52L${x - 4} 40L${x - 4} 100Z`, '#fff', .3), line(`M${x - 8} 80h16M${x - 6} 62h14`, '#4a4e54', 1, .4), lichen(x - 4, 96, 7, 2.6, x)); t.add(path('M12 44L16 28L40 22L110 26L118 32L116 46L40 50Z', t.lg(GS, 25), 1, ln), path('M16 28L40 22L40 30L18 34Z', '#fff', .35), line('M30 36h60', '#4a4e54', 1, .4), lichen(50, 28, 9, 2.6, 5), lichen(96, 32, 7, 2.4, 6), ell(64, 112, 14, 2.4, '#d3c48e', .6), stoneS(64, 114, 1.2), tuft(8, 118, '#8f8a48', .8, .9), tuft(120, 118, '#8f8a48', .8, .8)); }, 128, 128);
prop('interest', 'boulder-great', 'a', ['large', 'obstacle', 'rock', 'landmark'], (t, r) => { t.add(rockS(t, r, 64, 88, 50, 32, ['#e0dcd0', '#b4ae9c', '#847e6e'], { moss: false, facets: 7 }), lichen(44, 68, 14, 5, 1), lichen(84, 78, 10, 4, 2), lichen(64, 102, 12, 3.6, 3), tuft(10, 118, '#8f8a48', .8, .9), tuft(118, 118, '#8f8a48', .8, .8), stoneS(14, 112, 1.4), stoneS(112, 114, 1.2)); }, 128, 128);
// ---- shepherd huts: dry-stone walls, turf roof ----
function hut(t, v) {
  const ik = ink('#3a3e46', 1, .85), r = R('sh' + v);
  t.add(sh(66, 115, 54, 8));
  t.add(rect(18, 66, 92, 48, t.lg(['#dcdad0', '#a8a498', '#7e7a6e'], 90), 0, 1, ik));
  for (let row = 0; row < 6; row++) { const y = 68 + row * 7.6; let x = row % 2 ? 14 : 20; while (x < 108) { const w = 9 + r.range(0, 8); t.add(rect(x + .4, y, w - .8, 7, t.lg(['#e6e2d6', '#a8a498'], 90), 2.4, 1, ink('#4a463c', .6, .65)), rect(x + 2, y + 1, w - 4, 1.4, '#fff', 1, .35)); x += w; } }
  t.add(rect(18, 66, 92, 8, '#3b3a24', 0, .14));
  t.add(path('M52 114V84Q52 76 64 76Q76 76 76 84V114Z', '#2a2018', 1, ik), path('M54 114V85Q54 78 64 78Q74 78 74 85V114Z', t.lg(['#8a6038', '#5a3c20'], 0), 1, ik), ...[58, 64, 70].map(x => line(`M${x} 79V114`, '#3a2818', .8, .5)), circ(71, 98, 1.2, '#e8c870'), rect(48, 74, 32, 4, t.lg(['#cfd0c4', '#8a8e7c'], 90), 1, 1, ln));
  t.add(rect(86, 82, 14, 12, '#2a3038', 1.5, 1, ik), rect(86, 82, 14, 12, v === 'b' ? t.lg(['#ffe6a0', '#e8a84a'], 90) : '#4a5a68', 1.5, 1), line('M93 82v12M86 88h14', '#3a2818', .8, .8), rect(84, 94, 18, 3, '#cfd0c4', 1, 1, ln));
  if (v === 'b') t.add(gl(t, 93, 88, 20, '#ffe6a0', '#ffb04a', .5));
  // turf roof: green-ochre sod over timber, with a smoking chimney
  t.add(path('M8 72Q16 46 40 34Q56 26 64 22Q72 26 88 34Q112 46 120 72Q64 82 8 72Z', t.lg(['#b4c47a', '#8aa458', '#5f7a40'], 60), 1, ink('#2f4a22', 1.1, .85)), ...[0, 1, 2, 3, 4].map(k => line(`M${14 + k * 2} ${64 - k * 7}Q64 ${70 - k * 14} ${114 - k * 2} ${64 - k * 7}`, '#3f5a2c', 1, .35)), path('M16 66Q30 46 56 30Q40 44 24 70Z', '#e0eca0', .4));
  for (let i = 0; i < 14; i++) t.add(tuft(r.range(20, 108), r.range(44, 70), '#d3c48e', .85, .7));
  for (const [x, y] of [[40, 50], [86, 52], [60, 38]]) t.add(bloom('daisy', x, y, .8));
  t.add(path('M8 72Q64 82 120 72Q64 86 8 72Z', '#3a4a22', .55), rect(92, 24, 10, 22, t.lg(GS, 0), 1, 1, ln), rect(90, 20, 14, 6, t.lg(GS, 0), 1, 1, ln));
  if (v === 'b') t.add(mistBlob(98, 12, 8, 4, '#eef0ee', .6), mistBlob(104, 4, 10, 4, '#eef0ee', .45), mistBlob(96, -2, 7, 3, '#eef0ee', .3));
  if (v === 'a') t.add(...[0, 1, 2].map(i => ell(26 + i * 6, 112, 4, 2.4, '#fffaf0', 1, 0, ink('#cfc8b0', .4, .6))));
  t.add(tuft(10, 118, '#8f8a48', .8, .9), tuft(118, 119, '#8f8a48', .8, .8), stoneS(12, 114, 1.3), stoneS(114, 116, 1.1), heatherS(106, 118, 1.2));
}
for (const v of ['a', 'b']) prop('interest', 'hut-shepherd', v, ['large', 'hut', 'obstacle', 'village', v === 'b' ? 'lit' : 'dark'], (t) => hut(t, v), 128, 128);
// ---- mountain waterfalls (128x128, transparent, flows into a pool at the foot) ----
function falls(t, v) {
  const ik = ink('#3a3e46', 1, .85), r = R('wf' + v), xs = v === 'a' ? [[52, 76]] : [[34, 52], [66, 92]];
  t.add(sh(66, 114, 54, 7));
  t.add(path('M6 114L10 44Q14 22 40 16H88Q114 22 118 44L122 114Z', t.lg(['#b4b8ba', '#868c90', '#5a6066'], 90), 1, ik));
  for (let k = 0; k < 6; k++) t.add(line(`M${8 + k} ${34 + k * 12}H${120 - k}`, '#3a3e46', 1.1, .3));
  for (let i = 0; i < 8; i++) t.add(line(`M${r.range(12, 116)} ${r.range(20, 70)}l${r.range(-2, 3)} ${r.range(6, 14)}`, '#3a3e46', 1, .4));
  t.add(rect(10, 10, 108, 14, t.lg(['#d4d8c0', '#9aa06c'], 90), 4, 1, ink('#4a5a30', .8, .8)), ...Array.from({ length: 9 }, (_, i) => tuft(14 + i * 12, 16, '#8f8a48', .85, .7)), lichen(30, 50, 12, 4, 1), lichen(96, 60, 10, 3.4, 2));
  for (const [a, b] of xs) { t.add(path(`M${a} 20H${b}L${b + 4} 98H${a - 4}Z`, t.lg(['#f6fcfc', '#cfeaf0', '#9fd0dc'], 90), 1, ink('#4f8aa8', .7, .8))); for (let i = 0; i < 5; i++) t.add(line(`M${a + 4 + i * (b - a - 8) / 4} 22v72`, '#fff', 1.4, .75)); t.add(ell((a + b) / 2, 98, (b - a) / 2 + 10, 6, '#fff', .85), ell((a + b) / 2, 99, (b - a) / 2 + 4, 3, '#cfeaf0', .9)); }
  t.add(ell(64, 108, 52, 10, '#7db1cf', .9, 0, ink('#4f8aa8', .8, .7)), ell(64, 108, 46, 7, '#9fd0dc', .95), ring(60, 108, 34), ring(60, 108, 22), ...xs.map(([a, b]) => ell((a + b) / 2, 104, (b - a) / 2 + 12, 4, '#fff', .7)));
  for (const [x, y, s] of [[16, 112, 1.9], [112, 112, 1.7], [30, 118, 1.3], [96, 119, 1.4]]) t.add(stoneS(x, y, s, ['#e0e1d6', '#a4a498', '#6a6a60']));
  t.add(tuft(8, 118, '#8f8a48', .8, .9), tuft(120, 118, '#8f8a48', .8, .8));
}
for (const v of ['a', 'b']) prop('interest', 'waterfall-mountain', v, ['large', 'waterfall', 'obstacle', 'water', v === 'b' ? 'twin' : 'single'], (t) => falls(t, v), 128, 128);

// ============================ overlays ============================
const ov = (name, v, w, h, fn, tags = []) => { const t = mk('overlays', name, v, w, h); fn(t, R(name + v)); out(t, 'overlays', name, v, ['overlay', 'highland', ...tags]); };
for (const v of ['a', 'b', 'c', 'd']) ov('mist-drift', v, 128, 128, (t, r) => { for (let i = 0; i < 10; i++) { const x = r.range(24, 104), y = r.range(30, 100), rx = r.range(26, 46); t.add(mistBlob(x, y, rx, rx * r.range(.16, .26), '#f0f2f2', r.range(.2, .34))); } for (let i = 0; i < 4; i++) t.add(line(`M${f(r.range(10, 60))} ${f(r.range(30, 100))}h${f(r.range(30, 56))}`, '#fff', 1.2, .3)); }, ['mist', 'large', 'drift']);
for (const v of ['a', 'b', 'c']) ov('mist-low', v, T, T, (t, r) => { for (let i = 0; i < 4; i++) t.add(mistBlob(r.range(14, 50), r.range(34, 56), r.range(14, 26), r.range(3, 6), '#eceeec', r.range(.22, .34))); }, ['mist', 'low']);
for (const v of ['a', 'b', 'c']) ov('mist-rise', v, T, T, (t, r) => { for (let i = 0; i < 5; i++) { const x = r.range(14, 50), y = 56 - i * 9 + r.range(-3, 3); t.add(mistBlob(x, y, r.range(10, 20) - i * 1.2, r.range(4, 6), '#e4e8ee', .34 - i * .05)); } }, ['mist', 'rising', 'ravine']);
for (const v of ['a', 'b']) ov('cloud-shadow', v, 128, 128, (t, r) => { for (let i = 0; i < 3; i++) t.add(ell(r.range(40, 88), r.range(40, 88), r.range(26, 44), r.range(16, 26), '#4a5a6a', .12, r.range(-20, 20))); }, ['shadow', 'large']);
for (const v of ['a', 'b']) ov('wind-streaks', v, T, T, (t, r) => { for (let i = 0; i < 5; i++) { const x = r.range(4, 28), y = r.range(10, 56), w = r.range(18, 34); t.add(line(`M${f(x)} ${f(y)}q${f(w / 2)} -3 ${f(w)} ${f(r.range(-2, 2))}`, '#fff', 1.2, .5)); } }, ['wind']);
ov('birds-high', 'a', 128, 128, (t) => { const b = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})">` + path('M0 0Q-4 -4 -10 -1Q-5 -1 0 2Q5 -1 10 -1Q4 -4 0 0Z', '#3a3a4a', .85) + '</g>'; t.add(b(30, 30, 1.2), b(46, 38, 1), b(60, 24, 1.1), b(84, 46, .8), b(98, 34, .9), b(40, 56, .7)); }, ['creature', 'birds', 'large']);
for (const v of ['a', 'b']) ov('light-shafts-highland', v, T, 128, (t, r) => { for (let i = 0; i < 3; i++) { const x = 8 + i * 18 + r.range(-3, 3), w = r.range(7, 11); t.add(path(`M${f(x)} 4L${f(x + w)} 4L${f(x + w + 30)} 124L${f(x + 14)} 124Z`, '#fff6d8', .09 + r() * .09)); } for (let i = 0; i < 8; i++) t.add(circ(r.range(8, 56), r.range(10, 114), r.range(.7, 1.2), '#fff6c0', .7)); }, ['light', 'tall']);
for (const v of ['a', 'b']) ov('dew-glint', v, T, T, (t, r) => { for (let i = 0; i < (v === 'a' ? 5 : 8); i++) t.add(sparkle(r.range(8, 56), r.range(8, 56), r.range(.4, .7), '#fff')); }, ['glint']);
