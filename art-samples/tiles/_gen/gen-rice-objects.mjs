// Rice Terraces objects: trees, scarecrows, shrines, racks, stacks, water props, waterwheel, farmhouses, kura gate, overlays.
import { T, P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, maker, SUBS, sh, trunk, scat, sparkle, glowC, broad, dots, blobPath, leafS, shimenawa } from './sub.mjs';
import { ripple, ring } from './water-lib.mjs';
import { sym, use, clump } from './rice-lib.mjs';

const SUB = SUBS.rice, { mk, out } = maker(SUB);
const R = (s) => rng(hash(s));
const tufts = (t, y = 114) => t.add(tuft(16, y, '#5f8f4c', .8, .7), tuft(48, y + 2, '#5f8f4c', .8, .7));
const WOOD = ['#b08a58', '#8a6a44', '#6b4a2c'], STRAW = ['#f3dd96', '#d8b860', '#a8883c'], ln = ink(P.inkW, .9, .8);
const prop = (cat, name, v, tags, fn, w = T, h = T) => { const t = mk(cat, name, v, w, h); fn(t, R(name + v)); out(t, cat, name, v, tags); };

// ============================ trees: persimmon (kaki), tall 64x128 ============================
const KAKI = ['#f6b25a', '#ec8a32', '#c8561e'];
const fruit = (x, y, s = 1) => ell(x + .6, y + 1.8, 3 * s, .9 * s, '#3b3a24', .12) + circ(x, y, 3 * s, KAKI[1], 1, ink('#8a3a14', .6, .7)) + circ(x - .9 * s, y - 1 * s, 1.1 * s, KAKI[0], .9) + path(`M${f(x - 1.8 * s)} ${f(y - 2.6 * s)}l1.8 1.2l1.8 -1.2l-1.8 -.8Z`, '#5f8f4c', 1);
prop('trees', 'persimmon', 'a', ['tall', 'tree', 'obstacle', 'fruit-tree'], (t, r) => broad(t, { cols: ['#9be08f', '#5fae5c', '#2f6e3a'], cr: 22, cy: 52, seed: 9101, trunkH: 46, extra: (rr) => [[18, 58], [40, 48], [30, 66], [46, 62], [22, 44]].map(([x, y]) => fruit(x, y, .8)).join('') }), T, 128);
prop('trees', 'persimmon', 'b', ['tall', 'tree', 'obstacle', 'fruit-tree', 'autumn'], (t) => broad(t, { cols: ['#f3c45a', '#e08a38', '#a85428'], cr: 22, cy: 52, seed: 9102, trunkH: 46, extra: () => [[16, 58], [38, 46], [28, 68], [46, 60], [24, 44], [44, 74], [33, 56], [14, 72]].map(([x, y]) => fruit(x, y, .9)).join('') }), T, 128);
prop('trees', 'persimmon', 'c', ['tall', 'tree', 'obstacle', 'fruit-tree', 'winter', 'bare'], (t, r) => {   // bare tree, fruit still hanging
  t.add(sh(34, 114, 18, 5.5), trunk(t, 32, 112, 5.2, 3, 44, P.bark, 1));
  const br = [['M32 70L18 50L12 36', 12, 36], ['M32 72L48 54L54 40', 54, 40], ['M30 78L20 70L8 66', 8, 66], ['M34 82L46 72L58 70', 58, 70], ['M18 50L26 34L24 22', 24, 22], ['M48 54L40 36L42 24', 42, 24], ['M32 66L32 44L34 26', 34, 26]];
  for (const [d] of br) t.add(line(d, '#4a3220', 2.6, .95), line(d, '#8a6a44', 1, .7));
  for (const [x, y] of [[12, 40], [54, 44], [10, 68], [56, 72], [24, 26], [42, 28], [34, 32], [18, 58], [48, 62], [28, 50]]) t.add(line(`M${x} ${y - 6}V${y - 2}`, '#4a3220', .8, .8), fruit(x, y + 1, .85));
  t.add(tuft(16, 116, '#5f8f4c', .8, .7), tuft(48, 118, '#5f8f4c', .8, .7), ell(26, 120, 3, 1, KAKI[1], 1), ell(42, 117, 2.6, .9, KAKI[2], 1));
}, T, 128);

// ============================ scarecrows (kakashi), tall ============================
function kakashi(t, v) {
  const cx = 32, by = 112; t.add(sh(34, by + 2, 15, 4.5), rect(cx - 2, 52, 4, by - 52, t.lg(WOOD, 0), 1, 1, ln), rect(cx - 20, 66, 40, 4, t.lg(WOOD, 0), 1.6, 1, ln));
  t.add(path(`M${cx - 11} 66Q${cx - 14} 84 ${cx - 9} 96H${cx + 9}Q${cx + 14} 84 ${cx + 11} 66Z`, t.lg(v === 'b' ? ['#e0583f', '#c8352b', '#8e2118'] : ['#7a8fc0', '#4d639a', '#33456f'], 60), 1, ink('#2a3a63', 1, .8)), path(`M${cx - 13} 82q13 6 26 0l1 4q-14 8 -28 0Z`, '#e8cf86', 1, ink('#6b5a38', .6, .8)), line(`M${cx - 10} 72h20M${cx - 8} 88l4 -3M${cx + 3} 90l4 -3`, '#f0e6c8', 1, .5));
  for (let i = 0; i < 9; i++) t.add(line(`M${cx - 12 + i * 3} 90l${i % 2 ? 1 : -1} ${10 + (i % 3) * 3}`, STRAW[i % 3], 1.5, .95));
  for (const s of [-1, 1]) { for (let i = 0; i < 3; i++) t.add(line(`M${cx + s * 18} 68l${s * (4 + i * 2)} ${3 + i * 1.6}`, STRAW[i], 1.5, .95)); t.add(path(`M${cx + s * 22} 66q${s * 2} 4 ${s * 1} 9q${s * -3} -1 ${s * -4} -9Z`, '#7a8fc0', 1, ink('#2a3a63', .6, .7))); }
  t.add(circ(cx, 48, 9.6, t.lg(['#f6ecd0', '#d8c490'], 45), 1, ln), line(`M${cx - 4} 42q-1 2 0 4M${cx + 4} 42q1 2 0 4`, '#3b2a1a', 1.4, .85), line(`M${cx - 3} 53q3 2 6 0`, '#7a3a2a', 1.2, .85), circ(cx - 5, 51, 1.6, '#f6a0a0', .5), circ(cx + 5, 51, 1.6, '#f6a0a0', .5));
  t.add(path(`M${cx - 21} 44Q${cx} 20 ${cx + 21} 44Q${cx} 49 ${cx - 21} 44Z`, t.lg(STRAW, 60), 1, ink('#7a6430', .9, .85)), path(`M${cx - 9} 41Q${cx} 29 ${cx + 9} 41Z`, '#a8883c', .6), line(`M${cx - 8} 38l-2 7M${cx} 33v10M${cx + 8} 38l2 7`, '#a8883c', .8, .6), ell(cx - 9, 36, 5, 1.4, '#fff', .45, -20), line(`M${cx - 12} 46q-3 6 -2 12M${cx + 12} 46q3 6 2 12`, '#e0583f', 1.6, .9));
  if (v === 'b') t.add(path(`M${cx - 20} 66l-3 14l4 -3l3 4l3 -16Z`, '#fffaf0', 1, ink('#b8b09a', .6, .8)), path(`M${cx + 20} 66l3 14l-4 -3l-3 4l-3 -16Z`, '#fffaf0', 1, ink('#b8b09a', .6, .8)));
  if (v === 'c') for (const [x, y, s] of [[cx - 19, 60, 1], [cx + 19, 62, -1], [cx + 3, 20, 1]]) t.add(`<g transform="translate(${x} ${y}) scale(${s} 1)">` + ell(0, 5, 5, 1.2, '#3b3a24', .15) + path('M-6 0Q-4 -6 3 -5Q7 -2 8 2L4 2L-1 5L-6 3Z', '#2a2a30', 1, ink('#111', .5, .8)) + path('M7 -1l5 1l-5 2Z', '#d8a030') + circ(4.4, -2, .7, '#fff') + '</g>');
  tufts(t, by + 2);
}
for (const v of ['a', 'b', 'c']) prop('props', 'scarecrow-kakashi', v, ['tall', 'obstacle', 'scarecrow', 'field'], (t) => kakashi(t, v), T, 128);

// ============================ field shrine, fox, sluice, racks, stacks, tools (1 cell) ============================
const ST = ['#e0d9c4', '#b4ad98', '#857d6c'];
function hokora(t, v) {
  t.add(sh(34, 56, 17, 4)); t.add(path('M14 54Q14 48 18 47H46Q50 48 50 54Z', t.lg(ST, 0), 1, ink(P.inkR, .9, .8)));
  t.add(rect(20, 30, 24, 17, t.lg(['#f6e4c0', '#c8a870'], 90), 0, 1, ln), rect(27, 34, 10, 13, '#3a2818', 1, 1, ln), line('M32 34v13', '#6b4a2c', .8, .7));
  if (v === 'b') t.add(glowC(t, 32, 42, 14, '#ffe6a0', '#ffc45a', .6), rect(27.5, 34.5, 9, 12, '#ffd878', 1, .8));
  t.add(path('M14 32L32 16L50 32Q32 29 14 32Z', t.lg(['#b8a888', '#7d6e58'], 60), 1, ink('#4a3a2a', .9, .85)), path('M18 31L32 19L36 22Q26 24 18 31Z', '#fff', .3), circ(32, 15, 1.8, '#e8c870', 1, ink('#7a5a1c', .5, .8)), rect(24, 43, 16, 2, '#e0583f', 0, .9), shimenawa(t, 18, 46, 33, 3, 1.6, false), tuft(14, 55, '#5f8f4c', .8, .7), tuft(50, 56, '#5f8f4c', .8, .7));
  t.add(path('M44 54l3 -8h6l2 8Z', '#e0583f', 1, ink('#8e2118', .5, .8)));
}
for (const v of ['a', 'b']) prop('props', 'field-shrine', v, ['obstacle', 'shrine', 'inari', v === 'b' ? 'lit' : 'unlit'], (t) => hokora(t, v));
function fox(t, v) {
  t.add(sh(34, 54, 14, 3.6), rect(18, 46, 28, 8, t.lg(ST, 0), 2, 1, ink(P.inkR, .9, .8)));
  t.add(path('M23 46Q20 34 24 26Q22 20 26 16L28 22H36L38 16Q42 20 40 26Q44 34 41 46Z', t.lg(['#eae6d6', '#b4b09c', '#857d6c'], 30), 1, ink(P.inkR, 1, .85)), path('M44 46Q54 44 50 34Q46 38 41 40Z', '#b4b09c', 1, ink(P.inkR, .8, .8)), path('M24 24L26 14L30 22Z', '#e0d9c4', 1, ink(P.inkR, .6, .8)), path('M40 24L38 14L34 22Z', '#e0d9c4', 1, ink(P.inkR, .6, .8)), path('M26 28Q32 33 38 28L35 38Q32 40 29 38Z', '#e0d9c4', 1, ink(P.inkR, .6, .7)), line('M28 24q1 -1 3 0M33 24q2 -1 3 0', '#4a463c', 1, .9), circ(32, 29, 1, '#4a463c'));
  t.add(path('M27 36h10v4q-5 3 -10 0Z', '#e0583f', 1, ink('#8e2118', .5, .8)), line('M28 38l-1 5M36 38l1 5', '#e0583f', 1, .9), ell(26, 26, 3, 1.2, '#fff', .45, -30));
  if (v === 'b') t.add(path('M22 48q3 -6 6 -2q1 3 -2 4Z', '#7fae5e', .95), path('M38 40q4 -5 7 -1q-2 3 -7 1Z', '#7fae5e', .95), line('M30 34l-3 -2', '#7fae5e', 1, .8));
  t.add(tuft(15, 54, '#5f8f4c', .8, .6));
}
for (const v of ['a', 'b']) prop('props', 'fox-statue', v, ['obstacle', 'statue', 'inari', v === 'b' ? 'mossy' : 'clean'], (t) => fox(t, v));
function sluice(t, v) {   // gate across a channel: transparent, carries its own water patch
  const open = v === 'b', mid = v === 'c';
  t.add(rect(0, 22, 64, 24, t.lg(['#b8e2e6', '#8cc3d3'], 90), 0, .95), rect(0, 20, 64, 3, '#d6bc88'), rect(0, 45, 64, 3, '#a98a58'), line('M2 30q5 -2 10 0M46 38q5 -2 10 0', '#fff', 1, .7));
  t.add(ell(32, 52, 22, 4, '#3b3a24', .16), rect(12, 12, 8, 36, t.lg(ST, 0), 1.6, 1, ink(P.inkR, .9, .8)), rect(44, 12, 8, 36, t.lg(ST, 0), 1.6, 1, ink(P.inkR, .9, .8)), rect(10, 10, 12, 4, '#eeeadb', 1.4, 1, ink(P.inkR, .8, .8)), rect(42, 10, 12, 4, '#eeeadb', 1.4, 1, ink(P.inkR, .8, .8)), line('M14 18v26M48 18v26', '#fff', 1, .3));
  const gy = open ? 10 : mid ? 22 : 30;   // board top
  t.add(rect(20, gy, 24, 46 - gy, t.lg(WOOD, 90), 1, 1, ln), ...[0, 1, 2, 3].map(i => line(`M20 ${gy + 6 + i * 6}H44`, '#4a3220', .8, .5)));
  t.add(rect(18, 4, 28, 3.6, t.lg(['#c9a874', '#7a5230'], 90), 1.4, 1, ln), rect(30, gy - 4, 4, 10 - 0, '#6b4a2c', 1, 1, ln), circ(32, 5.6, 2.4, '#e8c870', 1, ln));
  if (open || mid) t.add(path('M20 46q12 5 24 0l2 8q-14 6 -28 0Z', '#cfeaf0', .9), line('M22 50h20M24 54h16', '#fff', 1.2, .8), ring(32, 56, 12, '#fff', .8));
  else t.add(line('M22 49q10 3 20 0', '#fff', 1, .6));
}
for (const v of ['a', 'b', 'c']) prop('props', 'sluice-gate', v, ['obstacle', 'water', 'channel', v === 'a' ? 'closed' : v === 'b' ? 'open' : 'half'], (t) => sluice(t, v));
// drying rack (hasa): four posts, sheaves
function hasa(t, v) {
  t.add(sh(34, 56, 24, 4));
  const post = t.lg(WOOD, 0); for (const x of [12, 52]) t.add(rect(x - 2, 10, 4, 46, post, 1, 1, ln));
  for (const y of [16, 30]) t.add(rect(8, y, 48, 2.8, t.lg(['#b08a58', '#7a5230'], 90), 1, 1, ln));
  const n = v === 'a' ? 6 : v === 'b' ? 3 : 0, xs = v === 'b' ? [15, 25, 35] : [14, 21, 28, 35, 42, 49];
  for (const y of [17, 31]) for (let i = 0; i < n; i++) { const x = xs[i]; t.add(path(`M${x - 4.4} ${y}L${x - 1.8} ${y + 13}H${x + 1.8}L${x + 4.4} ${y}Z`, t.lg(STRAW, 90), 1, ink('#7a5a1c', .6, .8)), line(`M${x - 2} ${y + 3}v8M${x + 2} ${y + 3}v8`, '#a8802a', .8, .6)); }
  if (v === 'c') t.add(path('M44 52l5 -3l4 3l-5 3Z', '#e8cf86', 1, ink('#7a5a1c', .5, .8)));
  t.add(tuft(8, 56, '#5f8f4c', .8, .6), tuft(56, 57, '#5f8f4c', .8, .6));
}
for (const v of ['a', 'b', 'c']) prop('props', 'drying-rack', v, ['obstacle', 'rack', 'harvest', v === 'a' ? 'full' : v === 'b' ? 'half' : 'empty'], (t) => hasa(t, v));
// straw stack (nio): conical stack on a pole; round bale; bale pile; sheaf stooks
function stack(t, v) {
  t.add(sh(34, 56, 18, 4.4));
  if (v === 'a') {
    t.add(rect(30.6, 4, 2.8, 20, '#6b4a2c', 1, 1, ln));
    let y = 52; for (const [rx, ry, h] of [[20, 7, 12], [17, 6.6, 12], [13, 6, 11], [8, 5, 10]]) { t.add(path(`M${32 - rx} ${y}Q${32 - rx} ${y - h} 32 ${y - h - 3}Q${32 + rx} ${y - h} ${32 + rx} ${y}Q32 ${y + ry} ${32 - rx} ${y}Z`, t.lg(STRAW, 40), 1, ink('#7a5a1c', .9, .85))); y -= h - 2; }
    t.add(path('M22 20Q32 4 42 20Q32 25 22 20Z', t.lg(['#e8cf86', '#a8883c'], 60), 1, ink('#7a5a1c', .9, .85)), line('M16 44q16 5 32 0M20 33q12 4 24 0', '#a8883c', 1.6, .6), line('M18 40l4 8M28 38l1 9M38 38l-1 9M46 40l-4 8', '#a8883c', 1, .5));
  } else if (v === 'b') {
    t.add(ell(32, 40, 18, 15, t.rg(STRAW, .36, .3, .9), 1, 0, ink('#7a5a1c', 1, .85)), ell(32, 40, 10, 8, 'none', 1, 0, { fill: 'none', stroke: '#a8883c', 'stroke-width': 1.2, 'stroke-opacity': .6 }), ell(32, 40, 4.4, 3.4, 'none', 1, 0, { fill: 'none', stroke: '#a8883c', 'stroke-width': 1, 'stroke-opacity': .6 }), line('M20 34q12 -8 24 0M16 44q16 8 32 0', '#a8883c', 1.2, .5), ell(24, 30, 6, 2.4, '#fff', .45, -30), rect(14, 38, 2.4, 7, '#a8883c', 1, .9), rect(48, 38, 2.4, 7, '#a8883c', 1, .9));
  } else if (v === 'c') {
    for (const [x, y, w] of [[8, 42, 24], [32, 42, 24], [20, 28, 24]]) t.add(rect(x, y, w, 14, t.lg(STRAW, 90), 4, 1, ink('#7a5a1c', .9, .85)), line(`M${x + 6} ${y + 2}v10M${x + 12} ${y + 2}v10M${x + 18} ${y + 2}v10`, '#a8883c', 1, .5), rect(x + 2, y + 1, w - 4, 2, '#fff', 1, .35), rect(x + w * .5 - 1, y, 2, 14, '#6a5a3a', 0, .5));
    t.add(path('M44 24l6 -4l6 4l-6 4Z', '#e8cf86', 1, ink('#7a5a1c', .5, .8)));
  } else {
    for (let i = 0; i < 3; i++) { const x = 14 + i * 18; t.add(rect(x - 1.4, 16, 2.8, 38, '#6b4a2c', 1, 1, ln)); for (let k = 0; k < 5; k++) t.add(path(`M${x - 8 + k % 2 * 1} ${46 - k * 6}Q${x} ${42 - k * 6} ${x + 8} ${46 - k * 6}L${x + 6} ${51 - k * 6}Q${x} ${49 - k * 6} ${x - 6} ${51 - k * 6}Z`, t.lg(STRAW, 90), 1, ink('#7a5a1c', .7, .8))); t.add(path(`M${x - 7} 18Q${x} 8 ${x + 7} 18Z`, '#e8cf86', 1, ink('#7a5a1c', .7, .8))); }
  }
  t.add(tuft(10, 56, '#5f8f4c', .8, .6), tuft(54, 57, '#5f8f4c', .8, .6));
}
for (const v of ['a', 'b', 'c', 'd']) prop('props', 'straw-stack', v, ['obstacle', 'harvest', 'straw'], (t) => stack(t, v));
// tawara (rice bales), basket and tools
prop('props', 'tawara', 'a', ['obstacle', 'harvest', 'sacks'], (t) => { t.add(sh(34, 54, 22, 4.4)); for (const [x, y, rot] of [[18, 46, 0], [40, 46, 0], [29, 33, 0], [50, 36, 90]]) t.add(rot ? ell(x, y, 8, 11, t.lg(STRAW, 0), 1, 0, ln) : `<g>` + rect(x - 11, y - 8, 22, 16, t.lg(STRAW, 90), 7, 1, ink('#7a5a1c', .9, .85)) + line(`M${x - 4} ${y - 8}v16M${x + 4} ${y - 8}v16`, '#6a5a3a', 1.3, .8) + ell(x - 8, y, 2.4, 6, '#d8b860', 1, 0, ink('#7a5a1c', .6, .8)) + rect(x - 8, y - 5, 12, 2, '#fff', 1, .35) + '</g>'); });
prop('props', 'tawara', 'b', ['obstacle', 'harvest', 'sacks'], (t) => { t.add(sh(34, 54, 18, 4)); for (const [x, y] of [[22, 46], [42, 46], [32, 32]]) t.add(rect(x - 11, y - 8, 22, 16, t.lg(STRAW, 90), 7, 1, ink('#7a5a1c', .9, .85)), line(`M${x - 4} ${y - 8}v16M${x + 4} ${y - 8}v16`, '#6a5a3a', 1.3, .8), ell(x - 8, y, 2.4, 6, '#d8b860', 1, 0, ink('#7a5a1c', .6, .8)), rect(x - 8, y - 5, 12, 2, '#fff', 1, .35)); t.add(rect(30, 10, 12, 10, '#fffaf0', 1, 1, ink('#b8b09a', .6, .8)), line('M33 13h6M33 16h5', '#c8352b', 1, .8)); });
for (const v of ['a', 'b']) prop('props', 'harvest-basket', v, ['harvest', 'basket'], (t) => { t.add(sh(34, 54, 16, 3.6)); t.add(path('M14 32Q14 52 32 52Q50 52 50 32Z', t.lg(['#d8b274', '#a87c46'], 60), 1, ln), ell(32, 32, 18, 5, '#7a5230', 1, 0, ln)); for (let i = 0; i < 5; i++) t.add(line(`M${18 + i * 7} 34v16`, '#6b4a2c', .8, .5)); line('M14 40q18 6 36 0', '#6b4a2c', .8, .5); t.add(line('M16 40q16 6 32 0M17 46q15 5 30 0', '#6b4a2c', .8, .5)); if (v === 'a') for (let i = 0; i < 9; i++) t.add(line(`M${20 + i * 3} 32l${(i - 4) * 1.2} ${-9 - i % 3 * 2}`, STRAW[i % 3], 1.6, .95), ell(20 + i * 3 + (i - 4) * 1.6, 22 - i % 3 * 2, 1.4, 2.6, '#e8b84a', 1, (i - 4) * 12)); else t.add(path('M18 31Q32 22 46 31Q32 35 18 31Z', '#8fd078', 1, ln), path('M24 29q8 -6 14 0Z', '#5fae5c', 1)); t.add(rect(14, 20, 3, 14, '#a87c46', 1, 1, ln), rect(47, 20, 3, 14, '#a87c46', 1, 1, ln), path('M15 20Q32 6 49 20', 'none', 1, { fill: 'none', stroke: '#7a5230', 'stroke-width': 2.2 })); });
prop('props', 'harvest-tools', 'a', ['harvest', 'tools'], (t) => { t.add(ell(34, 52, 20, 3.4, '#3b3a24', .16)); t.add(`<g transform="rotate(-20 32 40)">`, rect(10, 38, 34, 3.6, '#8a6a44', 1.6, 1, ln), path('M44 38Q56 34 58 44Q50 40 44 42Z', t.lg(['#e8ecee', '#9aa4a8'], 90), 1, ink('#4a5a63', .8, .85)), '</g>', rect(12, 42, 20, 7, t.lg(WOOD, 90), 2, 1, ln), line('M16 42v7M22 42v7M28 42v7', '#4a3220', .8, .5), rect(36, 34, 14, 14, t.lg(['#d8b274', '#8a6a44'], 90), 2, 1, ln), line('M36 40h14', '#4a3220', .8, .5)); });
// plank bridges over channels (h / v)
prop('props', 'plank-bridge', 'h', ['bridge', 'walkable', 'channel'], (t) => { t.add(rect(0, 20, 64, 26, t.lg(['#b8e2e6', '#8cc3d3'], 90), 0, .95), rect(0, 19, 64, 3, '#d6bc88'), rect(0, 45, 64, 3, '#a98a58'), rect(6, 18, 52, 4, '#1d4a63', 0, .15), rect(6, 26, 52, 22, '#3b3a24', 2, .18)); t.add(rect(6, 14, 52, 28, t.lg(['#d8b274', '#a87c46'], 90), 3, 1, ln)); for (let x = 12; x < 58; x += 6) t.add(line(`M${x} 15V41`, '#4a3220', .9, .5), line(`M${x + 1} 16V40`, '#fff', .7, .2)); t.add(rect(6, 12, 52, 4, '#c9a874', 2, 1, ln), rect(6, 38, 52, 4, '#8a6a44', 2, 1, ln)); });
prop('props', 'plank-bridge', 'v', ['bridge', 'walkable', 'channel'], (t) => { t.add(rect(18, 0, 28, 64, t.lg(['#b8e2e6', '#8cc3d3'], 0), 0, .95), rect(17, 0, 3, 64, '#d6bc88'), rect(44, 0, 3, 64, '#a98a58'), rect(22, 8, 26, 50, '#3b3a24', 2, .16)); t.add(rect(20, 6, 24, 52, t.lg(['#d8b274', '#a87c46'], 0), 3, 1, ln)); for (let y = 12; y < 56; y += 6) t.add(line(`M21 ${y}H43`, '#4a3220', .9, .5), line(`M22 ${y + 1}H42`, '#fff', .7, .2)); t.add(rect(20, 6, 4, 52, '#c9a874', 2, 1, ln), rect(40, 6, 4, 52, '#8a6a44', 2, 1, ln)); });

// ============================ water props (transparent; carry their own ripple patch) ============================
function duck(x, y, flip = 1, col = ['#fffaf0', '#c8a870'], drake = false) {
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${flip} 1)">` + ell(0, 5.4, 9, 2.4, '#fff', .55) + ell(1, 4.6, 8, 2, '#8cc3d3', .5) + ell(.6, 5.2, 7.6, 1.6, '#1d4a63', .16)
    + path('M-8 0Q-8 -5 -2 -5Q5 -5 7 -1L10 -3Q9 2 6 3Q0 6 -6 4Z', col[0], 1, ink('#8a7a60', .8, .8)) + path('M-6 0Q-2 -3 3 -1Q-2 2 -6 0Z', drake ? '#6fa6c6' : col[1], 1)
    + circ(7, -4, 3.2, drake ? '#2f6e3a' : col[0], 1, ink('#8a7a60', .7, .8)) + path('M9.6 -4.4l4 1.2l-4 1.2Z', '#f3a030', 1, ink('#a05a10', .5, .8)) + circ(7.6, -4.8, .7, '#2a2a30') + line('M-8 -1q-3 -3 -4 -1', col[1], 1.4, .9) + '</g>';
}
prop('props', 'ducks-paddy', 'a', ['water', 'animal', 'paddy'], (t) => { t.add(duck(24, 32, 1), duck(42, 42, -1, ['#fffaf0', '#c8a870']), ripple(12, 48, 12, '#fff', .6)); });
prop('props', 'ducks-paddy', 'b', ['water', 'animal', 'paddy'], (t) => { t.add(duck(30, 36, 1, ['#d8b890', '#7a5a38'], true), duck(18, 46, 1, ['#c8a070', '#6a4a2c']), duck(46, 30, -1, ['#d8b890', '#7a5a38'], true)); });
prop('props', 'ducks-paddy', 'c', ['water', 'animal', 'paddy'], (t) => { t.add(duck(34, 34, -1), ell(20, 46, 3.4, 2, '#fff7c8', 1, 0, ink('#a8883c', .5, .7)), circ(19, 44.6, 1.4, '#fff7c8'), ell(26, 48, 3, 1.8, '#fff7c8', 1, 0, ink('#a8883c', .5, .7)), ell(32, 46, 3, 1.8, '#fff7c8', 1, 0, ink('#a8883c', .5, .7)), ring(26, 49, 10, '#fff', .55)); });
function egret(t, v) {
  t.add(ell(34, 55, 14, 3, '#1d4a63', .2), ring(31, 54, 11, '#fff', .7), ring(31, 54, 5, '#fff', .8));
  t.add(line('M30 50V38M34 50V36', '#4a3a2a', 1.6, .95));
  if (v === 'a') t.add(path('M20 34Q22 22 32 24Q42 22 46 30Q40 40 30 40Q22 40 20 34Z', t.lg(['#ffffff', '#e8e8e0'], 45), 1, ink('#a8a89c', .8, .8)), path('M44 30Q48 12 38 10Q34 12 36 18Q40 18 41 26Z', '#fff', 1, ink('#a8a89c', .8, .8)), path('M37 11l-8 1l8 2Z', '#f3c24f', 1, ink('#a07a1c', .5, .8)), circ(37, 12.4, .8, '#2a2a30'), path('M20 34L12 42Q20 40 26 36Z', '#f4f4ee', 1, ink('#a8a89c', .6, .8)));
  else t.add(path('M18 38Q22 26 32 28Q42 26 46 34Q40 42 30 42Q20 42 18 38Z', t.lg(['#ffffff', '#e8e8e0'], 45), 1, ink('#a8a89c', .8, .8)), path('M44 32Q54 30 54 36Q50 34 46 38Z', '#fff', 1, ink('#a8a89c', .8, .8)), path('M54 35l7 1l-6 2Z', '#f3c24f', 1, ink('#a07a1c', .5, .8)), circ(53, 35, .8, '#2a2a30'), path('M18 38L8 36Q14 42 24 42Z', '#f4f4ee', 1, ink('#a8a89c', .6, .8)));
}
for (const v of ['a', 'b']) prop('props', 'egret-paddy', v, ['water', 'animal', 'bird'], (t) => egret(t, v));
prop('props', 'frog-paddy', 'a', ['water', 'animal'], (t) => { t.add(ring(32, 40, 12, '#fff', .6), ell(32, 44, 9, 3, '#1d4a63', .18), ell(30, 40, 8, 5.4, t.lg(['#9be08f', '#4a9a50'], 45), 1, 0, ink('#1d4a26', .8, .8)), circ(25, 34, 2.8, '#9be08f', 1, ink('#1d4a26', .7, .8)), circ(35, 34, 2.8, '#9be08f', 1, ink('#1d4a26', .7, .8)), circ(25, 33.6, 1.2, '#2a2a30'), circ(35, 33.6, 1.2, '#2a2a30'), path('M22 44q-6 2 -8 6q6 -1 10 -3Z', '#6fb560', 1, ink('#1d4a26', .6, .8)), path('M38 44q6 2 8 6q-6 -1 -10 -3Z', '#6fb560', 1, ink('#1d4a26', .6, .8)), ell(27, 37, 4, 1.2, '#fff', .35, -20)); });

// ============================ large (128x128): waterwheel, farmhouses, kura gate, storehouse, rack row ============================
const GRAY = ['#9aa4b8', '#6f7f98', '#4a5870'];
function wheel(t, deg) {
  const cx = 70, cy = 62, Ro = 40;
  t.add(ell(64, 116, 56, 8, '#3b3a24', .1), ell(76, 112, 30, 8, t.lg(['#d8f0ee', '#8cc3d3'], 90), 1, 0, ink('#4f8aa8', .7, .6)), ring(76, 112, 28, '#fff', .8), ring(76, 112, 18, '#fff', .8), line('M54 114q6 -3 12 0t12 0t12 0', '#fff', 1.4, .8));
  t.add(path('M44 124L58 60H70L74 124Z', 'none', 1, { fill: 'none' }));
  for (const [x, w] of [[58, 5], [84, 5]]) t.add(path(`M${x - 14} 118L${x} 60H${x + w}L${x + w + 12} 118Z`, t.lg(WOOD, 0), 1, ln), line(`M${x - 6} 100h${w + 10}`, '#4a3220', 1.2, .6));
  t.add(rect(8, 28, 56, 12, t.lg(['#d8b274', '#8a6a44'], 90), 2, 1, ln), rect(8, 26, 56, 6, '#9fd0dc', 2, 1, ink('#4f8aa8', .6, .6)), line('M12 29q5 -1.6 10 0M30 28.6q5 -1.6 10 0', '#fff', 1, .8), ...[14, 36, 58].map(x => rect(x - 2, 40, 4, 24, t.lg(WOOD, 0), 1, 1, ln)));
  t.add(path('M60 28Q68 30 70 44Q64 40 58 38Z', '#cfeaf0', .9), line('M62 30q3 6 5 12', '#fff', 1.4, .8));
  t.add(`<g transform="rotate(${deg} ${cx} ${cy})">`);
  t.add(circ(cx, cy, Ro, 'none', 1, { fill: 'none', stroke: '#4a3220', 'stroke-width': 7, 'stroke-opacity': .9 }), circ(cx, cy, Ro, 'none', 1, { fill: 'none', stroke: '#b08a58', 'stroke-width': 4.6 }), circ(cx, cy, Ro - 12, 'none', 1, { fill: 'none', stroke: '#6b4a2c', 'stroke-width': 3, 'stroke-opacity': .9 }));
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832, ca = Math.cos(a), sa = Math.sin(a); t.add(`<g transform="translate(${f(cx + ca * Ro)} ${f(cy + sa * Ro)}) rotate(${f(a * 57.3)})">` + rect(-1, -7, 9, 14, t.lg(['#c9a874', '#7a5230'], 0), 1, 1, ln) + '</g>', line(`M${f(cx + ca * 8)} ${f(cy + sa * 8)}L${f(cx + ca * (Ro - 2))} ${f(cy + sa * (Ro - 2))}`, '#6b4a2c', 3.4, 1), line(`M${f(cx + ca * 8)} ${f(cy + sa * 8)}L${f(cx + ca * (Ro - 2))} ${f(cy + sa * (Ro - 2))}`, '#c9a874', 1.2, .8)); }
  t.add('</g>', circ(cx, cy, 8, t.rg(['#d8b274', '#8a6a44', '#4a3220']), 1, ln), circ(cx - 1.6, cy - 1.8, 2.2, '#fff', .45), circ(cx, cy, 2.4, '#4a3220'));
  t.add(tuft(10, 114, '#5f8f4c', .8, .8), tuft(112, 116, '#5f8f4c', .8, .7));
}
for (const [v, d] of [['a', 0], ['b', 11], ['c', 22], ['d', 33]]) prop('interest', 'waterwheel', v, ['large', 'obstacle', 'waterwheel', 'animated', 'water'], (t) => wheel(t, d), 128, 128);
const thatch = (t, d, seed, topY) => { const r = rng(seed), clip = t.clip(d), id = clip.slice(5, -1); let o = path(d, t.lg(STRAW, 60), 1, ink('#6b4a1c', 1.1, .85)) + `<g clip-path="url(#${id})">`; for (let k = 0; k < 9; k++) { const y = topY + 8 + k * 6.6; let dd = `M0 ${f(y)}`; for (let x = 0; x <= 128; x += 8) dd += `L${x} ${f(y + (x / 8 % 2 ? 1.4 : -1.4) + r.range(-.6, .6))}`; o += line(dd, '#7a5a20', 1.1, .32) + line(dd, '#fff3c0', .7, .3, { transform: 'translate(0 -1.3)' }); } return o + '</g>'; };
const tileRoof = (t, d, topY, cols = GRAY) => { const clip = t.clip(d), id = clip.slice(5, -1); let o = path(d, t.lg(cols, 60), 1, ink('#2a3a53', 1.1, .85)) + `<g clip-path="url(#${id})">`; for (let k = 0; k < 9; k++) { const y = topY + 6 + k * 6; o += line(`M0 ${y}H128`, '#2a3a53', 1, .35); for (let x = (k % 2) * 4; x < 128; x += 8) o += line(`M${x} ${y}v6`, '#2a3a53', .8, .25); } return o + '</g>'; };
function house(t, v) {
  t.add(sh(66, 116, 54, 8));
  t.add(rect(20, 70, 88, 44, t.lg(['#f6ecd0', '#e0cfa0'], 90), 0, 1, ink(P.inkW, 1, .85)), rect(20, 106, 88, 8, t.lg(['#cfd0c4', '#8a8e7c'], 90), 2, 1, ink(P.inkR, .9, .8)));
  for (const x of [20, 44, 68, 92, 106]) t.add(rect(x - 1.6, 70, 3.6, 36, '#8a6a44', 0, 1, ink(P.inkW, .5, .6)));
  t.add(rect(20, 88, 88, 2.6, '#8a6a44', 0, .9), rect(20, 70, 88, 12, '#3b3a24', 0, .18));
  t.add(rect(50, 80, 24, 28, t.lg(['#8a6038', '#5a3c20'], 0), 2, 1, ink(P.inkW, 1, .85)), ...[0, 1, 2, 3].map(i => line(`M${55 + i * 5} 82V108`, '#3a2818', .8, .5)), circ(70, 96, 1.4, '#e8c870'));
  for (const x of [26, 82]) t.add(rect(x, 78, 16, 14, '#fff6dc', 1, 1, ink(P.inkW, .9, .85)), line(`M${x + 8} 78V92M${x} 85H${x + 16}`, P.inkW, .9, .7), rect(x, 78, 16, 14, t.rg(['#ffe9a8', '#fff6dc', '#fff6dc'], .5, .5, .7, [.5, .1, 0]), 1));
  if (v === 'a') {
    t.add(thatch(t, 'M6 82Q14 62 38 46Q54 32 64 20Q74 32 90 46Q114 62 122 82Q64 92 6 82Z', 9201, 20), path('M6 82Q64 92 122 82Q64 96 6 82Z', '#6b4a1c', .5), line('M56 20h16', '#a8883c', 3, 1), rect(84, 24, 10, 20, t.lg(WOOD, 0), 1, 1, ln));
    for (const [x, y, rx, a] of [[92, 14, 5, .5], [96, 6, 7, .35], [100, -2, 8, .2]]) t.add(ell(x, y, rx, rx * .55, '#f6efdc', a));
    for (let i = 0; i < 7; i++) t.add(line(`M${16 + i * 15} ${80 + (i % 2) * 2}q2 6 0 10`, '#7a5a20', 1, .4));
  } else {
    t.add(tileRoof(t, 'M4 82Q10 64 36 50Q54 40 64 32Q74 40 92 50Q118 64 124 82Q64 92 4 82Z', 32), path('M4 82Q64 92 124 82Q64 96 4 82Z', '#2a3a53', .5), path('M50 34Q64 24 78 34L64 28Z', '#4a5870', 1, ink('#2a3a53', .8, .8)), path('M58 30q6 -6 12 0', 'none', 1, { fill: 'none', stroke: '#e8edf4', 'stroke-width': 1.5, 'stroke-opacity': .5 }), rect(58, 24, 12, 7, '#6f7f98', 2, 1, ink('#2a3a53', .8, .8)));
  }
  t.add(rect(18, 108, 16, 8, '#d6bc88', 3, 1, ink('#7a5c3c', .6, .8)), path('M100 114q4 -8 8 -3q-2 5 -8 3Z', '#e8a83a', 1), path('M14 112q-2 -8 4 -10q4 6 -4 10Z', '#5fae5c', .9), tuft(10, 116, '#5f8f4c', .8, .7), tuft(118, 116, '#5f8f4c', .8, .7));
  if (v === 'b') t.add(rect(86, 100, 14, 8, '#f6ecd0', 1, 1, ln), line('M89 100v8M93 100v8M97 100v8', '#8a6a44', .8, .6));
}
for (const v of ['a', 'b']) prop('interest', 'farmhouse', v, ['large', 'obstacle', 'house', v === 'a' ? 'thatched' : 'tiled'], (t) => house(t, v), 128, 128);
// kura (white-plaster storehouse). gate variants straddle the trail; the passage is the doorway.
function kura(t, kind) {
  const gate = kind !== 'plain', open = kind === 'open';
  t.add(sh(66, 117, 58, 8));
  t.add(rect(10, 52, 108, 62, t.lg(['#fffaf0', '#ece2c8'], 90), 0, 1, ink('#8a7a60', 1.1, .8)), rect(10, 52, 108, 8, '#3b3a24', 0, .12));
  t.add(rect(10, 92, 108, 22, t.lg(['#4a5258', '#2e353a'], 90), 0, 1, ink('#1d2326', 1, .85)));
  for (let r2 = 0; r2 < 3; r2++) for (let c = 0; c < 14; c++) { const x = 10 + c * 8 + (r2 % 2 ? 4 : 0), y = 93 + r2 * 7; if (x + 8 <= 118) t.add(line(`M${x} ${y + 7}l8 -7M${x + 8} ${y + 7}l-8 -7`, '#d8dcd8', .9, .75)); }
  t.add(rect(10, 91, 108, 2.4, '#e8e2d0', 0, 1, ink('#8a7a60', .6, .8)));
  t.add(tileRoof(t, 'M2 56Q8 38 34 26Q52 16 64 8Q76 16 94 26Q120 38 126 56Q64 64 2 56Z', 8, ['#a8b2c4', '#6f7f98', '#46546c']), path('M2 56Q64 64 126 56Q64 70 2 56Z', '#2a3a53', .5), path('M44 28Q64 14 84 28Q64 22 44 28Z', '#e8edf4', .4));
  t.add(path('M26 70Q64 60 102 70L98 76Q64 68 30 76Z', t.lg(['#9aa4b8', '#6f7f98'], 90), 1, ink('#2a3a53', .9, .85)));
  if (gate) {
    t.add(path('M40 114V82Q40 62 64 62Q88 62 88 82V114Z', '#e8e2d0', 1, ink('#8a7a60', 1.2, .85)), path('M44 114V84Q44 66 64 66Q84 66 84 84V114Z', open ? '#1d2a24' : t.lg(['#9a6a3e', '#6a4424', '#4a2e18'], 0), 1, ink('#3a2818', 1.2, .9)));
    if (open) { t.add(path('M48 114V86Q48 71 64 71Q80 71 80 86V114Z', t.lg(['#2a3a30', '#1d2a24'], 90), 1), ell(64, 112, 14, 2.6, '#3b4a38', 1), path('M44 114V84Q44 70 52 68L52 114Z', t.lg(['#9a6a3e', '#5a3c20'], 0), 1, ink('#3a2818', 1, .9)), path('M84 114V84Q84 70 76 68L76 114Z', t.lg(['#9a6a3e', '#5a3c20'], 0), 1, ink('#3a2818', 1, .9)), ell(64, 90, 8, 12, '#46604a', .35)); }
    else { t.add(line('M64 66V114', '#2a1a0c', 1.6, .9), rect(44, 84, 40, 2.8, '#2a2a30', 0, .85), rect(44, 100, 40, 2.8, '#2a2a30', 0, .85), circ(59, 93, 2.6, '#e8c870', 1, ink('#7a5a1c', .6, .8)), circ(69, 93, 2.6, '#e8c870', 1, ink('#7a5a1c', .6, .8)), ...[0, 1, 2, 3].map(i => circ(50 + i * 9.4, 90 + (i % 2) * 6, 1, '#2a2a30', .8))); }
    t.add(rect(54, 74, 20, 8, '#f6efdc', 1, 1, ink('#8a7a60', .6, .8)), line('M57 77h14M57 80h9', '#8e2118', .9, .8), ell(64, 116, 24, 3, '#d6bc88', 1, 0, ink('#7a5c3c', .6, .7)));
  } else {
    t.add(rect(52, 70, 24, 44, t.lg(['#9a6a3e', '#6a4424'], 0), 2, 1, ink('#3a2818', 1.2, .9)), rect(48, 66, 32, 6, '#e8e2d0', 2, 1, ink('#8a7a60', .8, .8)), line('M64 72V114', '#2a1a0c', 1.4, .9), circ(60, 94, 2, '#e8c870'), circ(68, 94, 2, '#e8c870'), rect(18, 70, 14, 12, '#3a2c20', 1, 1, ink('#8a7a60', .8, .85)), line('M25 70v12M18 76h14', '#8a6a44', 1, .8), rect(96, 70, 14, 12, '#3a2c20', 1, 1, ink('#8a7a60', .8, .85)), line('M103 70v12M96 76h14', '#8a6a44', 1, .8), rect(56, 76, 16, 3, '#6a4424', 1));
  }
  for (const x of [14, 98]) t.add(path(`M${x} 108q4 -8 8 -2q-3 5 -8 2Z`, '#7fae5e', .9));
  t.add(tuft(8, 116, '#5f8f4c', .8, .8), tuft(120, 117, '#5f8f4c', .8, .7));
}
for (const k of ['closed', 'open']) prop('interest', 'kura-gate', k, ['large', 'obstacle', 'gate', 'kura', k, 'rice-terraces', 'mossy-ruins'], (t) => kura(t, k), 128, 128);
prop('interest', 'kura-storehouse', 'a', ['large', 'obstacle', 'storehouse', 'kura'], (t) => kura(t, 'plain'), 128, 128);
// wide drying rack (two tiers, large)
prop('interest', 'rack-wide', 'a', ['large', 'obstacle', 'rack', 'harvest'], (t, r) => {
  t.add(sh(66, 116, 54, 7)); const post = t.lg(WOOD, 0);
  for (const x of [12, 44, 76, 108]) t.add(rect(x - 2.4, 22, 4.8, 92, post, 1, 1, ln));
  for (const y of [30, 52, 74, 96]) t.add(rect(8, y, 112, 3, t.lg(['#b08a58', '#7a5230'], 90), 1, 1, ln));
  for (const y of [32, 54, 76]) for (let x = 14; x < 116; x += 7) if (r() < .93 && !(x > 40 && x < 48) && !(x > 72 && x < 80)) t.add(path(`M${x - 4.6} ${y}L${x - 2} ${y + 18}H${x + 2}L${x + 4.6} ${y}Z`, t.lg(STRAW, 90), 1, ink('#7a5a1c', .5, .8)), line(`M${x - 2} ${y + 4}v11M${x + 2} ${y + 4}v11`, '#a8802a', .7, .6));
  t.add(tuft(8, 116, '#5f8f4c', .8, .7), tuft(116, 117, '#5f8f4c', .8, .7), ...[0, 1, 2].map(i => ell(24 + i * 34, 116, 8, 1.4, '#e8cf86', .6)));
}, 128, 128);
// three small red torii leading uphill (inari path)
prop('interest', 'inari-torii-row', 'a', ['large', 'gate', 'waypoint', 'inari', 'shrine'], (t) => {
  t.add(sh(66, 116, 44, 6));
  [[64, 112, 1, 1], [64, 92, .78, .9], [64, 76, .6, .8]].forEach(([cx, by, s, a]) => {
    const w = 38 * s, h = 52 * s, g = t.lg(['#ec6a50', '#c8352b', '#8e2118'], 0);
    t.add(ell(cx + 3, by + 1, w * .7, 3 * s, '#3b3a24', .14 * a), rect(cx - w * .9, by - h, 5 * s, h, g, 1, 1, ink('#5a1a14', .9, .85)), rect(cx + w * .9 - 5 * s, by - h, 5 * s, h, g, 1, 1, ink('#5a1a14', .9, .85)), rect(cx - w * 1.05, by - h - 3 * s, w * 2.1, 6 * s, t.lg(['#2a2a30', '#111'], 90), 2, 1, ink('#000', .5, .8)), rect(cx - w * .95, by - h + 11 * s, w * 1.9, 4.6 * s, g, 1, 1, ink('#5a1a14', .8, .85)), rect(cx - w * 1.05, by - h - 4 * s, w * 2.1, 2.4 * s, '#e0583f', 1, 1), rect(cx - 2, by - h + 6 * s, 4, 6 * s, '#f6efdc', 1, 1, ink('#8a7a60', .5, .8)));
  });
  t.add(path('M52 118q6 -6 12 -2q6 -4 12 2Q64 124 52 118Z', '#cfd0c4', .8), tuft(26, 114, '#5f8f4c', .8, .8), tuft(100, 114, '#5f8f4c', .8, .8));
}, 128, 128);

// ============================ overlays ============================
const ov = (name, v, w, h, fn, tags = []) => { const t = mk('overlays', name, v, w, h); fn(t, R(name + v)); out(t, 'overlays', name, v, ['overlay', 'rice-terraces', ...tags]); };
for (const v of ['a', 'b']) ov('paddy-glint', v, T, T, (t, r) => { for (let i = 0; i < 7; i++) t.add(sparkle(r.range(8, 56), r.range(8, 56), r.range(.5, .9), '#fff')); for (let i = 0; i < 5; i++) t.add(line(`M${f(r.range(8, 46))} ${f(r.range(8, 56))}h${f(r.range(6, 12))}`, '#fff', 1, .65)); }, ['light', 'water']);
for (const v of ['a', 'b', 'c']) ov('terrace-mist', v, 128, 128, (t, r) => { for (let i = 0; i < 9; i++) { const x = r.range(26, 102), y = r.range(30, 98), rx = r.range(20, 36); t.add(ell(x, y, rx, rx * r.range(.22, .34), '#f6efdc', r.range(.14, .26)), ell(x + 4, y - 2, rx * .6, rx * .14, '#fff', .16)); } }, ['mist', 'large']);
for (const v of ['a', 'b']) ov('dragonflies-red', v, T, T, (t, r) => { for (let i = 0; i < 3; i++) { const x = r.range(14, 50), y = r.range(14, 50), a = r.range(-60, 60); t.add(`<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)}) scale(.7)">` + ell(-3, -1.8, 4.2, 1.1, '#eef7fa', .85, -18) + ell(3, -1.8, 4.2, 1.1, '#eef7fa', .85, 18) + path('M-.9 -3Q0 -5 .9 -3L.7 8L-.7 8Z', '#d8402c', 1, ink('#6e1a10', .5, .7)) + circ(0, -3.4, 1.5, '#a02818') + '</g>'); } }, ['ambient', 'insect']);
for (const v of ['a', 'b']) ov('sparrows', v, 128, 128, (t, r) => { for (let i = 0; i < 6; i++) { const x = r.range(20, 108), y = r.range(20, 100), s = r.range(.8, 1.2); t.add(`<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">` + ell(2, 8, 5, 1.4, '#3b3a24', .1) + path('M-6 0Q-3 -4 0 0Q3 -4 6 0Q3 -1.6 0 1.6Q-3 -1.6 -6 0Z', '#5a4a3a', 1, ink('#2a1a0a', .5, .8)) + '</g>'); } }, ['ambient', 'birds', 'large']);
for (const v of ['a', 'b']) ov('harvest-motes', v, T, T, (t, r) => { for (let i = 0; i < 12; i++) t.add(circ(r.range(6, 58), r.range(6, 58), r.range(.7, 1.5), r.pick(['#f6d878', '#fff3c0', '#eab84a']), r.range(.6, .95)), ...(i % 3 === 0 ? [line(`M${f(r.range(10, 50))} ${f(r.range(10, 50))}l5 -2`, '#f3dd96', 1, .8)] : [])); }, ['ambient', 'harvest']);
