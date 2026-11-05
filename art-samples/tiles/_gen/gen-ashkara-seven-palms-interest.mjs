// Ashkara sub-area 2: Seven Palms interest objects: the oasis pool ringed by seven palms with a shaduf (landmark), the palm-frond gate (closed/open),
// market stall, pavilion, reed huts, fisher dock, spring fountain, lotus pond, wicker chests, camp, shaduf garden and date harvest.
import { T, f, ell, circ, rect, path, line, ink, D, sh, pebbleD, tuft, C, TALL, LG, tile, rng, pad, lotus, heap, mix } from './seven-palms-lib.mjs';
import { palmStr } from './gen-desert-nature.mjs';
import { curve } from './gen-ashkara-dune-shallows-objects.mjs';
import { DATE } from './gen-ashkara-seven-palms-objects.mjs';

const palmAt = (t, x, y, s, o) => `<g transform="translate(${f(x - 32 * s)} ${f(y - 112 * s)}) scale(${s})">${palmStr(t, { by: 112, ...o })}</g>`;
const water = (cx, cy, rx, ry, op = 1) => ell(cx, cy, rx + 4, ry + 3, '#f0e2a8', op) + ell(cx, cy + 1, rx + 4, ry + 3, 'none', 1, 0, ink('#b8965a', 1.2, .5)) + ell(cx, cy, rx, ry, '#62c9bd', op, 0, ink('#2a8190', 1, .7)) + ell(cx, cy + ry * .15, rx * .78, ry * .6, '#3fb0ac', .5) + ell(cx - rx * .3, cy - ry * .35, rx * .4, ry * .16, '#f2fffa', .65) + ell(cx + rx * .25, cy + ry * .2, rx * .3, ry * .1, '#f2fffa', .45);
const grassRing = (cx, cy, rx, ry, r) => { let o = ''; for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283; o += tuft(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry + 4, '#4f7f36', .95, .9); } return o; };
// ===== landmark: oasis pool ringed by seven date palms =====
const ring = (t, v) => {
  const cx = 64, cy = 78, rx = 36, ry = 17, r = rng(v === 'a' ? 5 : 6);
  let o = sh(64, 108, 58, 7) + ell(64, 80, 58, 27, "#8fb858", .5) + ell(64, 78, 54, 24, '#aac96c', .7);
  o += water(cx, cy, rx, ry) + [[-18, 2], [12, 8], [22, -4]].map(([dx, dy]) => pad(cx + dx, cy + dy, 5, '#5fae6a', dx * 6)).join('') + lotus(cx - 17, cy + 1, 1, '#f7b6cf') + lotus(cx + 22, cy - 5, .9, '#fff0f4');
  const angs = [200, 245, 290, 340, 20, 70, 120, 160].filter((_, i) => i !== 7).map((a, i) => a); // 7 palms
  const seven = [-100, -60, -20, 22, 62, 102, 142].map(a => a - 10);
  const P = seven.map((a, i) => { const A = a * Math.PI / 180; return { x: cx + Math.cos(A) * (rx + 14), y: cy + Math.sin(A) * (ry + 10) + 4, i, A }; }).sort((p, q) => p.y - q.y);
  const back = P.filter(p => p.y < cy + 4), front = P.filter(p => p.y >= cy + 4);
  const lean = (p) => Math.max(-8, Math.min(8, (cx - p.x) * .2));
  o += back.map(p => palmAt(t, p.x, p.y, .36 + p.y / 900, { lean: lean(p) * .5 + (p.i % 2 ? 4 : -4), top: 34 + (p.i % 3) * 3, nf: 10, len: 30, seed: 90 + p.i, dates: p.i % 3 === 0 })).join('');
  o += grassRing(cx, cy, rx + 10, ry + 8, r);
  if (v === 'a') {   // shaduf on the near-right bank
    const sx = 104, sy = 106;
    o += ell(sx + 2, sy + 2, 12, 3, '#3b3a24', .2) + path(`M${sx - 7} ${sy}L${sx - 5} ${sy - 18}H${sx + 5}L${sx + 7} ${sy}Z`, t.lg(D.brick, 90), 1, ink(D.inkB, 1, .8)) + line(`M${sx} ${sy - 18}V${sy - 34}`, D.wood[1], 3, 1) + line(`M${sx - 12} ${sy - 30}L${sx + 20 - 40} ${sy - 40}`, 'none', 1, 0)
      + line(`M${sx + 14} ${sy - 40}L${sx - 14} ${sy - 28}`, D.wood[1], 3, 1) + path(`M${sx - 18} ${sy - 28}l8 -2l2 6l-8 2Z`, '#8a8272', 1, ink('#4a4640', .8, .85)) + line(`M${sx + 12} ${sy - 38}V${sy - 22}`, '#9a7a4a', 1, 1) + path(`M${sx + 8.6} ${sy - 22}h6.8l-1 6h-4.8Z`, '#a07848', 1, ink(D.inkB, .7, .85));
  } else {
    o += `<g transform="translate(88 98)">` + ell(2, 3, 12, 3, '#3b3a24', .2) + line('M-4 2L4 -36', D.wood[1], 3, 1) + line('M8 2L6 -36', D.wood[1], 3, 1) + [0, 1, 2, 3, 4].map(i => line(`M${-3 + i * .4} ${-4 - i * 7}H${7 - i * .2}`, D.wood[2], 2, 1)).join('') + `</g>`;
    o += [[30, 100], [44, 104]].map(([x, y], i) => `<g transform="translate(${x} ${y}) scale(.6)">${ell(0, 5, 14, 4, '#3b3a24', .16)}${path('M-12 -8Q-12 6 0 6Q12 6 12 -8Z', t.lg(['#e8c488', '#b88a4c', '#7a5428'], 70), 1, ink('#5a3c20', .9, .8))}${ell(0, -8, 12, 3.4, i ? '#c0501e' : '#7a5428', 1, 0, ink('#5a3c20', .8, .8))}</g>`).join('');
  }
  o += front.map(p => palmAt(t, p.x, p.y, .36 + p.y / 900, { lean: lean(p) * .5 + (p.i % 2 ? 4 : -4), top: 34 + (p.i % 3) * 3, nf: 10, len: 30, seed: 90 + p.i, dates: p.i % 3 === 0 })).join('');
  return o;
};
for (const v of ['a', 'b']) tile('interest', 'oasis-pool-seven-palms', v, LG, ['large', 'landmark', 'oasis', 'palm', 'water', 'obstacle', 'signature', v === 'a' ? 'shaduf' : 'harvest'], (t) => ring(t, v));
// ===== gate: palm-frond gate between two date palms =====
const mat = (x0, x1, y0, y1, t) => { let o = path(`M${x0} ${y0}H${x1}V${y1}H${x0}Z`, t.lg(['#e8d88c', '#c8b060', '#8a7a38'], 0), 1, ink('#5a4a20', 1, .85)); for (let x = x0 + 4; x < x1; x += 5) o += line(`M${x} ${y0}V${y1}`, '#8a7a38', .8, .6); for (let y = y0 + 10; y < y1; y += 14) o += line(`M${x0} ${y}H${x1}`, '#5a4a20', 1.6, .7) + line(`M${x0} ${y - 1}H${x1}`, '#f6ecb0', .7, .6); return o; };
const frondGate = (t, open) => {
  const yb = 114; let o = sh(64, yb + 2, 58, 6) + heap(t, 64, yb, 56, 6, .8);
  o += `<g>` + palmAt(t, 20, yb, 1, { lean: 14, top: 34, nf: 12, len: 33, seed: 111 }) + `</g>`;
  if (!open) {
    o += mat(36, 92, 52, yb, t) + path('M36 52Q64 40 92 52V58Q64 46 36 58Z', '#c8b060', 1, ink('#5a4a20', .8, .85));
    o += line('M64 52V114', '#5a4a20', 1.4, .8) + circ(64, 84, 3.6, '#3fb0ac', 1, ink('#1f4a56', .8, .9)) + circ(64, 84, 1.4, '#f3c24f') + line('M64 60V78', '#9a7a4a', 1.4, 1);
    o += [48, 80].map(x => path(`M${x - 4} 40h8l-1.4 9h-5.2Z`, '#f3c24f', .95, ink('#5a3a0a', .7, .85)) + line(`M${x} 34V40`, '#9a7a4a', 1.2, 1) + ell(x, 45, 6, 6, '#fff0a8', .25)).join('');
  } else {
    o += ell(64, 106, 28, 7, '#fff6d8', .8) + ell(64, 112, 20, 3.4, '#e8c98c', .55);
    o += path('M36 52H46L44 100H36Z', t.lg(['#e8d88c', '#c8b060', '#8a7a38'], 0), 1, ink('#5a4a20', 1, .85)) + path('M82 52H92V100H84Z', t.lg(['#e8d88c', '#c8b060', '#8a7a38'], 0), 1, ink('#5a4a20', 1, .85));
    for (const x of [40, 88]) for (let y = 62; y < 100; y += 14) o += line(`M${x - 5} ${y}h10`, '#5a4a20', 1.4, .7);
    o += path('M36 52Q64 38 92 52V58Q64 44 36 58Z', '#c8b060', 1, ink('#5a4a20', .8, .85)) + path('M46 58Q64 52 82 58V66Q64 60 46 66Z', '#e8d88c', .95, ink('#5a4a20', .7, .8));
    o += line('M46 60Q50 70 44 82M82 60Q78 70 84 82', '#9a7a4a', 1.6, 1) + circ(44, 84, 2, '#3fb0ac', 1, ink('#1f4a56', .6, .9)) + circ(84, 84, 2, '#3fb0ac', 1, ink('#1f4a56', .6, .9));
    o += [48, 80].map(x => path(`M${x - 4} 40h8l-1.4 9h-5.2Z`, '#f3c24f', .95, ink('#5a3a0a', .7, .85)) + line(`M${x} 34V40`, '#9a7a4a', 1.2, 1)).join('');
  }
  o += palmAt(t, 108, yb, 1, { lean: -14, top: 34, nf: 12, len: 33, seed: 112, dates: true });
  o += [[30, 118], [100, 118], [14, 120]].map(([x, y]) => tuft(x, y, '#4f7f36', .95, 1.1)).join('');
  return o;
};
for (const open of [false, true]) tile('interest', 'gate-palm-frond', open ? 'open' : 'closed', LG, ['large', 'gate', 'interest', 'signature', open ? 'open' : 'closed', 'obstacle'], (t) => frondGate(t, open));
// ===== market stall of dates and fruit =====
const stall = (t, v) => {
  let o = sh(66, 112, 52, 6);
  const cols = v === 'a' ? ['#3fb0ac', '#fff6e0'] : ['#d8503a', '#fff6e0'];
  o += line('M20 112V52M108 112V52', D.wood[1], 4, 1) + line('M19 112V52', D.wood[0], 1.2, .6);
  o += path('M12 62H116L108 108H20Z', '#3b2a14', .0);
  o += path('M22 94H106V108H22Z', t.lg(D.wood, 90), 1, ink(D.inkB, 1, .85)) + path('M22 94L28 88H112L106 94Z', D.wood[0], 1, ink(D.inkB, .9, .8)) + line('M26 100H104', D.wood[2], 1, .5);
  for (let i = 0; i < 4; i++) o += `<g transform="translate(${34 + i * 22} 90)">${path('M-9 -2Q-9 8 0 8Q9 8 9 -2Z', t.lg(['#e8c488', '#b88a4c', '#7a5428'], 70), 1, ink('#5a3c20', .8, .8))}${ell(0, -2, 9, 2.6, i % 2 ? '#d8403a' : '#c0501e', 1, 0, ink('#5a3c20', .7, .8))}${[0, 1, 2, 3, 4, 5].map(k => circ(-6 + k * 2.4, -4 - (k % 2), 1.7, i % 2 ? (k % 2 ? '#d8403a' : '#f08a40') : DATE[k % 3], 1, ink('#5a2a14', .3, .6))).join('')}</g>`;
  o += path('M10 54Q64 38 118 54L112 70Q64 56 16 70Z', t.lg(cols, 0), 1, ink('#5a3a24', 1, .85));
  for (let i = 0; i < 6; i++) { const x = 16 + i * 17; o += path(`M${x} ${58 + i * .2}l8 -4l8 4V${72 - i * .4}Q${x + 8} 68 ${x} ${72}Z`, i % 2 ? cols[1] : cols[0], 1, ink('#5a3a24', .7, .8)); }
  o += line('M16 70Q40 76 64 68T112 70', '#5a3a24', 1, .5) + ell(50, 52, 24, 3, '#fff', .3, -4);
  o += `<g transform="translate(96 96)">` + path('M-6 -16Q-8 -4 -4 6H4Q8 -4 6 -16Z', t.lg(['#e8b484', '#c47e56', '#8c4e36'], 70), 1, ink('#5a2a14', .8, .8)) + ell(0, -16, 6, 2, '#8c4e36') + `</g>`;
  if (v === 'b') o += `<g transform="translate(20 100)">${path('M0 0l8 -8l8 8Z', '#f3c24f', 1, ink('#5a3a0a', .6, .85))}</g>`;
  return o + heap(t, 22, 114, 14, 4, .7) + heap(t, 106, 114, 14, 4, .7);
};
for (const v of ['a', 'b']) tile('interest', 'oasis-stall', v, LG, ['large', 'stall', 'shop', 'dates', 'obstacle'], (t) => stall(t, v));
// ===== palm-thatch pavilion with cushions =====
tile('interest', 'palm-pavilion', 'a', LG, ['large', 'shelter', 'rest', 'obstacle', 'signature'], (t) => {
  let o = sh(64, 112, 52, 6) + ell(64, 100, 44, 12, '#d8503a', .95, 0, ink('#7a1e24', .9, .8)) + ell(64, 100, 34, 8, '#f3c24f', .5) + ell(64, 100, 22, 5, '#d8503a', .8) + ell(64, 100, 10, 2.4, '#3fb0ac', .9);
  o += [[36, 100, '#3fb0ac'], [92, 102, '#f3c24f'], [64, 108, '#b02e2e']].map(([x, y, c]) => ell(x, y, 10, 5, c, 1, 0, ink('#5a3a24', .8, .85)) + ell(x - 2, y - 1.4, 4, 1.4, '#fff', .4)).join('');
  for (const x of [20, 108]) o += line(`M${x} 108V50`, D.wood[1], 4.4, 1) + line(`M${x - 1} 108V50`, D.wood[0], 1.2, .6);
  for (const x of [34, 94]) o += line(`M${x} 94V54`, D.wood[2], 3.4, 1);
  o += path('M6 56L64 10L122 56Q64 40 6 56Z', t.lg(['#e8d88c', '#b8a448', '#7a6a28'], 70), 1, ink('#5a4a20', 1.1, .85));
  for (let i = 0; i < 12; i++) o += line(`M${14 + i * 9} ${54 - Math.abs(i - 5.5) * 1.6}L${64 + (i - 5.5) * 3} ${16 + Math.abs(i - 5.5) * 1.4}`, '#7a6a28', 1, .45);
  for (let i = 0; i < 16; i++) { const x = 8 + i * 7.2; o += line(`M${x} ${53 - Math.abs(x - 64) * .12}l-2 8`, '#b8a448', 2, 1) + line(`M${x} ${53 - Math.abs(x - 64) * .12}l-2 8`, '#7a6a28', .6, .6); }
  o += ell(40, 30, 16, 2.4, '#fff', .3, -30) + circ(64, 13, 3, D.gold[1], 1, ink('#5a3a0a', .6, .85)) + path('M96 62h8l-1 9h-6Z', '#f3c24f', .9, ink('#5a3a0a', .6, .85)) + line('M100 56V62', '#9a7a4a', 1, 1);
  return o + `<g transform="translate(52 82)">${ell(0, 3, 6, 2, '#3b3a24', .2)}${path('M-4 2L-5 -6H5L4 2Z', '#a07848', 1, ink(D.inkB, .7, .85))}${ell(0, -6, 5, 1.6, '#c0501e')}</g>`;
});
// ===== reed huts =====
const hut = (t, v) => {
  let o = sh(66, 112, 46, 6) + path('M28 112Q24 74 40 62H88Q104 74 100 112Z', t.lg(['#e8d8a0', '#c8b070', '#8a7a40'], 90), 1, ink('#5a4a20', 1.1, .85));
  for (let i = 0; i < 12; i++) o += line(`M${34 + i * 5.2} 64V112`, '#8a7a40', .8, .55);
  o += path('M52 112V84Q64 74 76 84V112Z', '#2a1c10', 1, ink('#5a4a20', .9, .85)) + line('M54 86Q64 78 74 86', '#c8b070', 1, .6);
  o += path(`M14 70Q16 36 64 18Q112 36 114 70Q64 56 14 70Z`, t.lg(['#d8c878', '#a89448', '#6a5a24'], 70), 1, ink('#5a4a20', 1.1, .85));
  for (let i = 0; i < 18; i++) { const x = 16 + i * 5.5; o += line(`M${x} ${68 - Math.abs(x - 64) * .08}l-1 -${14 + (9 - Math.abs(i - 9)) * 2}`, '#7a6a28', 1, .4); }
  for (let i = 0; i < 20; i++) { const x = 14 + i * 5.1; o += line(`M${x} ${70 - Math.abs(x - 64) * .16}l-1.4 8`, '#c8b868', 2, 1) + line(`M${x} ${70 - Math.abs(x - 64) * .16}l-1.4 8`, '#6a5a24', .5, .5); }
  o += ell(44, 36, 16, 2.6, '#fff', .3, -32);
  if (v === 'b') o += `<g transform="translate(96 100)">${path('M-8 -4H8L6 12H-6Z', '#a07848', 1, ink(D.inkB, .8, .85))}${ell(0, -4, 8, 2.4, '#62c9bd', 1, 0, ink(D.inkB, .6, .85))}</g>` + line('M14 112Q8 90 20 80', '#4f7f36', 2, 1);
  else o += `<g transform="translate(26 98)">${path('M-4 0h8l-1 12h-6Z', '#e8b484', 1, ink('#5a2a14', .7, .85))}${ell(0, 0, 4, 1.4, '#8c4e36')}</g>` + line('M104 70Q112 86 108 100', '#9a7a4a', 1.4, 1);
  return o + heap(t, 30, 114, 18, 4, .8) + heap(t, 100, 114, 16, 4, .8);
};
for (const v of ['a', 'b']) tile('interest', 'reed-hut', v, LG, ['large', 'hut', 'building', 'obstacle'], (t) => hut(t, v));
// ===== fisher dock into the pool =====
tile('interest', 'fisher-dock', 'a', LG, ['large', 'dock', 'water', 'fishing'], (t) => {
  let o = ell(64, 76, 62, 36, '#f0e2a8', .9) + ell(64, 80, 56, 32, '#62c9bd', 1, 0, ink('#2a8190', 1, .7)) + ell(64, 86, 44, 22, '#3fb0ac', .5) + ell(42, 66, 20, 3, '#f2fffa', .6) + ell(86, 92, 14, 2.4, '#f2fffa', .5);
  o += path('M2 36H46V56H2Z', '#aac96c', 0);
  for (let i = 0; i < 6; i++) { const y = 54 + i * 7; o += rect(8, y, 74 - i * 0, 6, t.lg(D.wood, 90), 1, 1, ink(D.inkB, .9, .85)) + line(`M10 ${y + 3}H80`, D.wood[2], .8, .4); }
  for (const [x, y] of [[10, 96], [78, 96], [78, 56]]) o += `<g>${ell(x + 2, y + 4, 4, 1.6, '#1f5a52', .3)}${rect(x - 2, y - 18, 5, 20, D.wood[1], 1, 1, ink(D.inkB, .8, .85))}</g>`;
  o += `<g transform="translate(96 78)">${ell(2, 6, 22, 5, '#1f5a52', .3)}${path('M-20 0Q-18 12 0 12Q20 12 22 -2Q8 6 -20 0Z', t.lg(['#f0d8a0', '#c8a468', '#8a6a38'], 70), 1, ink('#5a3c20', 1, .85))}${path('M-20 0Q-16 -6 -2 -8Q14 -10 22 -2Q8 6 -20 0Z', '#b88a4c', 1, ink('#5a3c20', .9, .85))}${line('M0 -6L18 -22', D.wood[1], 2, 1)}</g>`;
  o += `<g transform="translate(30 50)">${path('M-5 8Q-6 -4 0 -8Q6 -4 5 8Z', '#a07848', 1, ink(D.inkB, .7, .85))}</g>` + pad(30, 100, 6) + lotus(30, 99, 1, '#f7b6cf') + pad(52, 108, 5, '#7cc47a');
  return o + [[8, 40], [14, 36]].map(([x, y]) => tuft(x, y + 20, '#4f7f36', .9, 1)).join('') + path('M4 112l8 -2l8 2Z', '#d8c898', 0);
});
// ===== spring fountain =====
tile('interest', 'spring-fountain', 'a', LG, ['large', 'fountain', 'water', 'obstacle', 'signature'], (t) => {
  let o = sh(66, 112, 48, 6) + ell(64, 94, 46, 18, t.lg(D.stone, 90), 1, 0, ink(D.inkS, 1.1, .85)) + path('M18 94V86A46 18 0 0 1 110 86V94A46 18 0 0 1 18 94Z', t.lg(D.stone, 90), 1, ink(D.inkS, 1, .85)) + ell(64, 86, 46, 18, D.stone[0], 1, 0, ink(D.inkS, 1, .85)) + ell(64, 87, 38, 14, '#62c9bd', 1, 0, ink('#2a8190', .9, .7)) + ell(64, 88, 28, 9, '#3fb0ac', .6);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; o += path(`M${f(64 + Math.cos(a) * 44 - 3)} ${f(88 + Math.sin(a) * 17 + 2)}h6v5h-6Z`, i % 2 ? '#3fb0ac' : '#f3c24f', .0); }
  for (let i = 0; i < 14; i++) o += line(`M${24 + i * 6.2} ${96 + Math.sin(i) * .6}v6`, D.stone[2], 1, .4);
  o += rect(56, 50, 16, 36, t.lg(D.stone, 0), 0, 1, ink(D.inkS, 1, .85)) + path('M54 50H74L70 40H58Z', D.stone[0], 1, ink(D.inkS, .9, .85)) + ell(64, 36, 8, 6, t.lg(['#8fe0d4', '#3fb0ac', '#1f7a86'], 70), 1, 0, ink('#1f4a56', .9, .85)) + circ(64, 28, 3.4, D.gold[1], 1, ink('#5a3a0a', .6, .85));
  for (const [dx, bend] of [[-1, -16], [1, 16], [0, 0]]) o += line(`M64 40Q${64 + bend * .6} 22 ${64 + bend * 1.8} 54`, '#d4f4ec', 1.8, .85) + line(`M64 40Q${64 + bend * .6} 22 ${64 + bend * 1.8} 54`, '#fff', .7, .9);
  o += [-18, -6, 8, 20].map((x, i) => ell(64 + x, 86 + (i % 2) * 3, 5, 1.4, '#f2fffa', .6)).join('') + [[24, 100], [100, 100]].map(([x, y]) => tuft(x, y, '#4f7f36', .95, 1)).join('');
  return o + heap(t, 20, 112, 14, 4, .8) + heap(t, 108, 112, 14, 4, .8);
});
// ===== lotus pond =====
tile('interest', 'lotus-pond', 'a', LG, ['large', 'water', 'lotus', 'pond'], (t, r) => {
  let o = water(64, 74, 46, 26) + [[40, 70, 8], [64, 84, 9], [86, 66, 7], [76, 88, 6], [50, 56, 6], [30, 82, 5]].map(([x, y, rx], i) => pad(x, y, rx, i % 2 ? '#7cc47a' : '#5fae6a', i * 40) + (i % 2 === 0 ? lotus(x, y - 1, 1.2, r.pick(['#f7b6cf', '#fff0f4', '#f9c8a0'])) : '')).join('');
  o += [[18, 100, 6], [110, 90, 5]].map(([x, y, s]) => ell(x, y, s, s * .6, t.lg(['#f6ead0', '#d6c4a0', '#a08c68'], 60), 1, 0, ink('#6b5a40', .7, .8))).join('');
  return o + [[16, 60], [112, 64], [30, 108], [96, 104]].map(([x, y]) => tuft(x, y + 4, '#4f7f36', .95, 1.2)).join('') + `<g transform="translate(100 56)">${line('M0 14V-4', '#4f8a3a', 1.6, 1)}${path('M-1.6 -4q1.6 -3 3.2 0v-8q-1.6 -2 -3.2 0Z', '#8a5a2a')}</g>`;
});
// ===== camp under the palms =====
tile('interest', 'camp-under-palms', 'a', LG, ['large', 'camp', 'obstacle'], (t) => {
  let o = sh(66, 112, 50, 6) + ell(36, 100, 26, 8, '#b02e2e', .95, -8, ink('#5a1a0a', .8, .8)) + ell(36, 100, 18, 5, '#f3c24f', .5, -8) + ell(34, 98, 8, 2, '#3fb0ac', .8, -8);
  o += path('M62 60L96 30L124 60L118 100H70Z', t.lg(['#fff6e0', '#d8c490', '#a89462'], 70), 1, ink('#6a5a38', 1, .85)) + path('M96 30L124 60L118 100L100 100Z', '#a89462', .7) + path('M88 100V76Q96 66 104 76V100Z', '#2a1c10', 1) + line('M96 30V22', D.wood[1], 2, 1) + path('M96 22l10 3l-10 3Z', '#d8503a', 1, ink('#7a1e24', .5, .85)) + line('M62 60Q80 66 96 60', '#6a5a38', 1, .5);
  o += ell(48, 72, 11, 4, '#3b3a24', .0) + [[40, 84], [54, 92], [26, 90]].map(([x, y], i) => pebbleD(x, y, .9, [D.stone[0], D.stone[1]])).join('');
  o += ell(42, 82, 10, 4.4, '#3b3a24', .3) + path('M32 80h20l-3 6H35Z', '#2a1c10', 1) + path('M42 80Q36 70 42 62Q46 70 42 80Z', '#f3a42a', 1) + path('M42 80Q40 72 42 68Q45 74 42 80Z', '#fff0a8', 1) + path('M34 70H50L47 78H37Z', '#8a8272', 1, ink('#4a4640', .8, .85));
  o += palmAt(t, 22, 70, .52, { lean: 3, top: 34, nf: 10, len: 30, seed: 120 });
  return o + [[100, 108], [20, 112], [60, 112]].map(([x, y]) => tuft(x, y, '#4f7f36', .9, 1)).join('');
});
// ===== shaduf garden =====
tile('interest', 'shaduf-garden', 'a', LG, ['large', 'farm', 'water', 'obstacle'], (t) => {
  let o = sh(66, 112, 50, 6) + path('M8 112L14 72H114L120 112Z', t.lg(['#b9a572', '#a18d5c', '#6a5a34'], 90), 1, ink('#5a4a28', 1, .85));
  for (let k = 0; k < 4; k++) { const y = 80 + k * 8; o += line(`M${14 - k * 1.4} ${y}H${114 + k * 1.4}`, '#6a5a34', 3, .5) + line(`M${14 - k * 1.4} ${y - 2}H${114 + k * 1.4}`, '#e0d2a4', .8, .5); for (let i = 0; i < 12; i++) o += line(`M${24 + i * 8 - k * 1.2} ${y - 1}q-2 -3 -3 -5M${24 + i * 8 - k * 1.2} ${y - 1}q0 -4 0 -6M${24 + i * 8 - k * 1.2} ${y - 1}q2 -3 3 -5`, k % 2 ? '#5fa84a' : '#7cc47a', 1.2, 1); }
  o += path('M6 112L14 72', 'none', 1, ink('#8e6038', 3, .9)) + path('M122 112L114 72', 'none', 1, ink('#8e6038', 3, .9));
  o += path('M10 66H118V74H10Z', '#62c9bd', 1, ink('#8e6038', 2, .9)) + line('M16 70q8 -2 16 0t16 0t16 0t16 0t16 0', '#f2fffa', 1, .7);
  o += `<g transform="translate(26 0)">${ell(10, 66, 16, 3, '#3b3a24', .18)}${path('M-1 64L1 36H15L17 64Z', t.lg(D.brick, 90), 1, ink(D.inkB, 1, .8))}${line('M8 36V14', D.wood[1], 3, 1)}${line('M-12 20L44 6', D.wood[1], 3.4, 1)}${line('M38 8V34', '#9a7a4a', 1.2, 1)}${path('M34 34h8l-1 6h-6Z', '#a07848', 1, ink(D.inkB, .7, .85))}${path('M-18 22l10 -2l2 7l-10 2Z', '#8a8272', 1, ink('#4a4640', .8, .85))}</g>`;
  return o;
});
// ===== date harvest: palm with ladder and baskets =====
tile('interest', 'date-harvest', 'a', LG, ['large', 'dates', 'harvest', 'obstacle', 'loot'], (t, r) => {
  let o = palmAt(t, 52, 112, 1, { lean: 6, top: 28, nf: 12, len: 34, seed: 131, dates: true }) + '';
  for (const [x, y] of [[40, 22], [58, 26], [66, 20]]) o += line(`M${x} ${y}q1 5 0 8`, '#8a6238', 1.6, 1) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => circ(x + (i % 3 - 1) * 2, y + 8 + Math.floor(i / 3) * 2.4, 1.6, DATE[i % 3], 1, ink('#5a2a14', .3, .6))).join('');
  o += line('M64 112L60 40M80 112L70 42', D.wood[1], 3.4, 1);
  for (let i = 0; i < 8; i++) o += line(`M${63 - i * .6} ${106 - i * 9}L${79 - i * 1.2} ${106 - i * 9 + 1}`, D.wood[2], 2.6, 1) + line(`M${63 - i * .6} ${106 - i * 9 - .8}L${79 - i * 1.2} ${106 - i * 9}`, D.wood[0], 1, .6);
  o += [[28, 106, 1], [96, 108, .9], [108, 100, .7]].map(([x, y, s], i) => `<g transform="translate(${x} ${y}) scale(${s})">${ell(0, 6, 16, 4, '#3b3a24', .18)}${path('M-14 -10Q-14 6 0 6Q14 6 14 -10Z', t.lg(['#e8c488', '#b88a4c', '#7a5428'], 70), 1, ink('#5a3c20', .9, .8))}${ell(0, -10, 14, 3.6, '#c0501e', 1, 0, ink('#5a3c20', .8, .8))}${Array.from({ length: 9 }, (_, k) => circ(-10 + k * 2.6, -12 - (k % 2) * 1.4, 2, DATE[k % 3], 1, ink('#5a2a14', .3, .6))).join('')}</g>`).join('');
  return o + [[20, 116], [88, 118]].map(([x, y]) => tuft(x, y, '#4f7f36', .9, 1.1)).join('');
});
// ===== wicker chests =====
for (const open of [false, true]) tile('interest', 'chest-wicker', open ? 'open' : 'closed', C, ['chest', 'loot', open ? 'open' : 'closed', 'obstacle'], (t) => {
  let o = sh(34, 54, 20, 5) + path('M12 32H52V52H12Z', t.lg(['#e8c488', '#b88a4c', '#7a5428'], 90), 1, ink('#5a3c20', 1, .85));
  for (let i = 0; i < 7; i++) o += line(`M${15 + i * 5.4} 33V51`, '#7a5428', .8, .5); for (let i = 0; i < 4; i++) o += line(`M12 ${37 + i * 4.4}H52`, '#d8b070', .8, .5);
  if (!open) o += path('M12 32Q12 14 32 14Q52 14 52 32Z', t.lg(['#f0d098', '#c8a068', '#8a6238'], 90), 1, ink('#5a3c20', 1, .85)) + line('M16 28Q32 20 48 28', '#f6e0b0', 1, .6) + rect(29, 28, 6, 8, '#f3c24f', 1, 1, ink('#5a3a0a', .8, .85)) + circ(32, 32, 1.2, '#5a3a0a') + line('M12 32H52', '#5a3c20', 1.6, .8);
  else o += path('M14 32L18 14H46L50 32Z', t.lg(['#f0d098', '#c8a068', '#8a6238'], 90), 1, ink('#5a3c20', 1, .85)) + path('M12 32H52V36H12Z', '#3b2a14', 1) + ell(32, 32, 19, 3, '#2a1c10', 1) + circ(26, 30, 2.4, '#f3c24f', 1, ink('#5a3a0a', .5, .85)) + circ(34, 29, 2.4, '#3fb0ac', 1, ink('#1f4a56', .5, .85)) + circ(40, 31, 2, '#d8403a', 1, ink('#7a1e24', .5, .85)) + ell(25, 29, 1, .6, '#fff', .9);
  return o;
});
