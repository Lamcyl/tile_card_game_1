// Ashkara sub-area 5 Red Wadi interest objects: the rock-cut tomb facade (landmark), the rock-cut canyon door (gate, closed/open), cliff dwellings, a hoodoo grove, a wadi spring,
// flood wreck, bedouin camp, carved steles and obelisk, a high-place altar, small tomb doors and chests. Runs on its own; helpers come from red-wadi-lib.mjs.
import { T, rng, f, ell, circ, rect, path, line, ink, sh, pebbleD, blobPath, C, TALL, LG, tile, TER, DEEP, OCH, BLU, WOODS, ROPE, BONE, GRN, D, mound, rrock, rblock, bone, skull, jar, bands, dust, mix } from './red-wadi-lib.mjs';

const IN = (n, v, size, tags, fn) => tile('interest', n, v, size, [...tags, size === LG ? 'large' : size === TALL ? 'tall' : 'one'], fn);
const wood = (t, ang = 0) => t.lg(WOODS, ang);
const stone = (t, ang = 60) => t.lg(['#f6d8b4', '#e0a880', '#b87850'], ang);
const BR = ['#e2b684', '#c58f5c', '#8e6038'];
// canyon wall backdrop (rounded top), banded and shaded; returns svg and the clip id string
const wall = (t, x0, x1, y0, y1, seed, rt = 14) => {
  const d = `M${x0} ${y1}V${y0 + rt}Q${x0} ${y0} ${x0 + rt} ${y0}H${x1 - rt}Q${x1} ${y0} ${x1} ${y0 + rt}V${y1}Z`, clip = t.clip(d);
  return `<path d="${d}" fill="${t.lg(TER, 60)}" stroke="#5a2a20" stroke-width="1.4" stroke-opacity=".85"/><g clip-path="${clip}">` + bands(t, x0, x1, y0, y1, seed).replace(/opacity="\.9"/g, 'opacity=".5"') + path(`M${x1 - 26} ${y0}H${x1}V${y1}H${x1 - 14}Q${x1 - 20} ${(y0 + y1) / 2} ${x1 - 26} ${y0}Z`, BLU[2], .3) + path(`M${x0} ${y0}H${x0 + 22}Q${x0 + 10} ${(y0 + y1) / 2} ${x0 + 12} ${y1}H${x0}Z`, '#fbe0c4', .25) + `</g>`;
};
// ===== landmark: rock-cut tomb facade =====
const facade = (t, v) => {
  let o = sh(64, 118, 60, 6) + wall(t, 2, 126, 8, 118, v === 'a' ? 8100 : 8101, 16);
  const S = stone(t, 70), ik = ink('#5a2a20', .9, .85);
  // base steps
  o += rect(26, 110, 76, 6, '#e8b48a', 0, 1, ik) + rect(20, 114, 88, 5, '#d9996e', 0, 1, ik);
  if (v === 'a') {
    // lower order: four pilasters and a central door
    o += rect(30, 70, 68, 40, S, 0, 1, ik) + rect(30, 66, 68, 5, '#f6d8b4', 0, 1, ik);
    for (const x of [32, 50, 70, 88]) o += rect(x, 70, 8, 40, t.lg(['#f6d8b4', '#d9996e'], 0), 0, 1, ik) + rect(x - 1.4, 67, 10.8, 4, '#f6d8b4', 0, 1, ik) + rect(x - 1, 108, 10, 3, '#e0a880', 0, 1, ik) + line(`M${x + 2.6} 74V106M${x + 5.2} 74V106`, '#b87850', .8, .7);
    o += path('M54 110V84Q64 74 74 84V110Z', '#2a1612', 1, ink('#140806', 1.2, .9)) + path('M57 110V88Q64 80 71 88V110Z', '#4a2a22') + rect(52, 82, 24, 3, '#f6d8b4', 0, 1, ik);
    // upper order: pediment, urn tholos
    o += rect(40, 38, 48, 28, S, 0, 1, ik) + path('M34 40L64 22L94 40Z', '#f6d8b4', 1, ik) + path('M42 38L64 26L86 38Z', '#e0a880') + rect(38, 38, 52, 4, '#f6d8b4', 0, 1, ik);
    for (const x of [42, 80]) o += rect(x, 42, 6, 24, t.lg(['#f6d8b4', '#d9996e'], 0), 0, 1, ik);
    o += circ(64, 54, 9, '#2a1612', 1, ink('#f6d8b4', 3, 1)) + path('M58 56Q64 46 70 56Z', '#e0a880') + ell(64, 49, 3, 3.6, '#f6d8b4', 1, 0, ik) + line('M64 45V42', '#b87850', 1.4, 1);
    o += path('M64 20L61 14Q64 8 67 14Z', '#f6d8b4', 1, ik);
  } else {
    // single order with a broken pediment, urn between and flanking niches
    o += rect(24, 56, 80, 54, S, 0, 1, ik) + rect(24, 52, 80, 5, '#f6d8b4', 0, 1, ik);
    for (const x of [26, 94]) o += rect(x, 56, 8, 54, t.lg(['#f6d8b4', '#d9996e'], 0), 0, 1, ik) + rect(x - 1.4, 53, 10.8, 4, '#f6d8b4', 0, 1, ik);
    o += path('M24 52L48 34L56 38L52 52Z', '#f6d8b4', 1, ik) + path('M104 52L80 34L72 38L76 52Z', '#f6d8b4', 1, ik) + path('M56 52V42H72V52Z', '#e0a880', 1, ik) + path('M60 42Q64 30 68 42Z', '#f6d8b4', 1, ik) + circ(64, 40, 1.6, '#b87850');
    o += path('M48 110V76Q64 62 80 76V110Z', '#2a1612', 1, ink('#140806', 1.2, .9)) + path('M53 110V80Q64 70 75 80V110Z', '#4a2a22') + path('M46 76Q64 60 82 76', 'none', 1, { stroke: '#f6d8b4', 'stroke-width': 3 });
    for (const x of [38, 90]) o += path(`M${x - 5} 94V72Q${x} 64 ${x + 5} 72V94Z`, '#3a2018', 1, ik) + ell(x, 90, 2.4, 3.4, '#f6d8b4', 1, 0, ik);
  }
  o += ell(64, 117, 22, 2.6, '#3b2a24', .18);
  for (const [x, y, s] of [[14, 114, 1], [114, 116, .9], [104, 119, .6]]) o += rrock(t, rng(x), x, y - 2, 8 * s, 5 * s, 1);
  return o;
};
IN('rock-cut-facade', 'a', LG, ['landmark', 'tomb', 'rock-cut', 'signature', 'obstacle'], (t) => facade(t, 'a'));
IN('rock-cut-facade', 'b', LG, ['landmark', 'tomb', 'rock-cut', 'obstacle'], (t) => facade(t, 'b'));
// ===== gate: rock-cut canyon door =====
const gate = (t, open) => {
  const fy = 116; let o = sh(64, fy + 1, 58, 6);
  o += wall(t, 2, 126, 6, fy, 8200, 14);
  // carved frame: tall door recess in the middle of the cliff
  const S = stone(t, 70), ik = ink('#5a2a20', .9, .85);
  o += rect(34, 30, 60, 6, '#f6d8b4', 0, 1, ik) + path('M30 36H98V' + (fy - 2) + 'H30Z', S, 1, ik);
  for (const x of [32, 86]) o += rect(x, 36, 10, fy - 38, t.lg(['#f6d8b4', '#d9996e'], 0), 0, 1, ik) + line(`M${x + 3.4} 40V${fy - 6}M${x + 6.6} 40V${fy - 6}`, '#b87850', .8, .7) + rect(x - 1.4, 33, 12.8, 4, '#f6d8b4', 0, 1, ik);
  o += path(`M44 ${fy - 2}V62Q64 44 84 62V${fy - 2}Z`, open ? t.lg(['#fff6e0', '#f0d8b0', '#c8a0a0'], 90) : '#2a1612', 1, ink('#140806', 1.2, .9));
  if (!open) {
    o += path(`M47 ${fy - 2}V64Q64 49 81 64V${fy - 2}Z`, wood(t, 0), 1, ink('#2a1a0a', .9, .85)) + line(`M64 52V${fy - 2}`, '#2a1a0a', 1.6, .9);
    for (let y = 70; y < fy - 4; y += 11) o += line(`M47 ${y}H81`, '#5a3c20', 1, .6);
    for (const [x, y] of [[53, 74], [53, 92], [75, 74], [75, 92], [53, 106], [75, 106]]) o += circ(x, y, 1.5, '#4a4448', 1, ink('#1a1618', .6, .85)) + circ(x - .4, y - .4, .5, '#d8d0d0');
    o += circ(64, 85, 4, '#f3c24f', 1, ink('#a07a20', .8, .9)) + circ(64, 85, 1.6, '#a07a20');
  } else {
    // open doors fold back, bright shaded passage beyond
    o += path(`M44 ${fy - 2}V62Q50 56 52 54V${fy - 6}Z`, wood(t, 0), 1, ink('#2a1a0a', .9, .85)) + path(`M84 ${fy - 2}V62Q78 56 76 54V${fy - 6}Z`, wood(t, 0), 1, ink('#2a1a0a', .9, .85)) + path(`M52 ${fy - 8}Q64 ${fy - 14} 76 ${fy - 8}Q64 ${fy - 2} 52 ${fy - 8}Z`, '#fbe0c4', .8) + path('M54 70Q64 60 74 70V84Q64 76 54 84Z', '#8e90b8', .3) + line('M58 100Q64 94 70 100', '#c47e56', 1.2, .6) + ell(64, fy - 4, 10, 2.4, '#fff', .7);
  }
  o += path('M40 36Q64 14 88 36', 'none', 1, { stroke: '#f6d8b4', 'stroke-width': 5 }) + path('M40 36Q64 14 88 36', 'none', 1, { stroke: '#5a2a20', 'stroke-width': 1, 'stroke-opacity': .8 });
  o += path('M56 24Q64 10 72 24Z', '#f6d8b4', 1, ik) + circ(64, 21, 3.4, '#f3c24f', 1, ink('#a07a20', .7, .9)) + circ(64, 21, 1.4, '#2a1612');
  // dark cliff towers flanking and boulders at the foot
  for (const [x, y, s] of [[12, 112, 1.2], [116, 112, 1.2], [24, 118, .8], [104, 119, .8]]) o += rrock(t, rng(x), x, y - 4, 9 * s, 6 * s, 1);
  if (open) o += ell(64, fy + 1, 24, 3, '#fff', .55);
  return o;
};
IN('gate-rock-cut-door', 'closed', LG, ['gate', 'closed', 'rock-cut', 'signature', 'obstacle'], (t) => gate(t, false));
IN('gate-rock-cut-door', 'open', LG, ['gate', 'open', 'rock-cut', 'signature'], (t) => gate(t, true));
// ===== cliff dwellings =====
const dwell = (t, v) => {
  let o = sh(64, 118, 58, 6) + wall(t, 4, 124, 8, 118, 8300 + (v === 'a' ? 0 : 1), 16);
  const ik = ink('#5a2a20', .9, .85);
  const ledge = (y, x0, x1) => path(`M${x0} ${y}H${x1}L${x1 + 4} ${y + 6}H${x0 - 4}Z`, '#d9996e', 1, ik) + path(`M${x0 - 4} ${y + 6}H${x1 + 4}V${y + 9}H${x0 - 4}Z`, '#8c4e36', 1, ik);
  const house = (x, y, w, h, win) => rblock(t, x, y - h, w, h, 4).replace(/#f0c8a4/g, '#e2b684').replace(/#c47e56/g, '#c58f5c').replace(/#8c4e36/g, '#8e6038') + (win ? rect(x + w * .3, y - h * .66, w * .26, h * .4, '#2a1612', 0, 1, ink('#140806', .7, .9)) : '') + line(`M${x + 1} ${y - h * .2}h${w - 2}`, '#8e6038', .8, .5);
  if (v === 'a') {
    o += ledge(54, 30, 98) + house(36, 54, 18, 14, true) + house(58, 54, 16, 18, true) + house(78, 54, 14, 12, false) + rect(63, 40, 6, 5, '#8e6038', 0, 1, ik);
    o += ledge(92, 14, 86) + house(18, 92, 20, 16, true) + house(44, 92, 18, 12, true) + path('M70 92V74Q78 68 84 74V92Z', '#2a1612', 1, ik);
    o += line('M92 56V94', '#3b2a1a', 2, .9) + line('M100 56V94', '#3b2a1a', 2, .9) + [0, 1, 2, 3, 4, 5].map(i => line(`M92 ${60 + i * 7}H100`, '#d8c090', 1.4, 1)).join('');
  } else {
    o += ledge(44, 40, 90) + house(46, 44, 16, 12, true) + house(66, 44, 18, 15, true);
    o += ledge(74, 16, 100) + house(22, 74, 20, 15, true) + house(48, 74, 16, 11, false) + house(70, 74, 22, 17, true) + path('M96 74V58Q102 54 106 58V74Z', '#2a1612', 1, ik);
    o += ledge(104, 24, 94) + path('M50 104V86Q60 78 70 86V104Z', '#2a1612', 1, ik) + house(28, 104, 14, 11, true) + house(76, 104, 14, 13, false);
    o += line('M20 76V106', '#3b2a1a', 2, .9) + line('M27 76V106', '#3b2a1a', 2, .9) + [0, 1, 2, 3].map(i => line(`M20 ${80 + i * 7}H27`, '#d8c090', 1.4, 1)).join('');
  }
  o += circ(78, 88, 1.4, '#ffe6a0', .8);
  for (const [x, y, s] of [[10, 116, 1], [118, 117, 1], [60, 120, .7]]) o += rrock(t, rng(x), x, y - 3, 7 * s, 4.4 * s, 0);
  return o;
};
IN('cliff-dwelling', 'a', LG, ['dwelling', 'cliff', 'building', 'obstacle'], (t) => dwell(t, 'a'));
IN('cliff-dwelling', 'b', LG, ['dwelling', 'cliff', 'building', 'obstacle'], (t) => dwell(t, 'b'));
// ===== hoodoo grove =====
IN('hoodoo-grove', 'a', LG, ['hoodoo', 'grove', 'obstacle'], (t, r) => {
  let o = ell(64, 114, 58, 6, '#3b2a24', .14) + mound(t, 64, 110, 56, 7);
  const spire = (cx, fy, h, w, segs, seed) => { const cols = ['#e8b48a', '#c47e56', '#d9996e', '#a8664c', '#f0c8a4']; let s = '', y = fy; const sg = h / segs; for (let i = 0; i < segs; i++) { const wa = w - i * (w * .35 / segs) - (i % 2 ? 2 : -1), wb = w - (i + 1) * (w * .35 / segs) - ((i + 1) % 2 ? 2 : -1), y1 = y - sg; s += path(`M${f(cx - wa)} ${f(y)}L${f(cx - wb)} ${f(y1)}L${f(cx + wb)} ${f(y1)}L${f(cx + wa)} ${f(y)}Z`, cols[(i + seed) % cols.length], 1, ink('#5a2a20', .7, .6)) + path(`M${f(cx + wa * .35)} ${f(y)}L${f(cx + wb * .35)} ${f(y1)}L${f(cx + wb)} ${f(y1)}L${f(cx + wa)} ${f(y)}Z`, BLU[2], .28); y = y1; } return s + ell(cx + 1, y - 1, w * .9 + 1, 4, '#3b2a24', .2) + path(`M${f(cx - w)} ${f(y)}Q${f(cx - w - 2)} ${f(y - 9)} ${f(cx - 3)} ${f(y - 10)}Q${f(cx + w)} ${f(y - 9)} ${f(cx + w + 1)} ${f(y)}Q${f(cx)} ${f(y + 6)} ${f(cx - w)} ${f(y)}Z`, t.lg(['#b8704c', '#8c4e36', '#5a2a20'], 55), 1, ink('#3a1a14', 1, .8)); };
  o += spire(36, 108, 70, 11, 6, 0) + spire(88, 110, 86, 10, 8, 2) + spire(62, 112, 46, 12, 4, 1);
  for (const [x, y, s] of [[18, 112, 1.1], [108, 113, 1], [74, 118, .8]]) o += rrock(t, r, x, y - 3, 8 * s, 5 * s, 1);
  return o;
});
// ===== wadi spring: a seep in a rock niche with reeds =====
IN('wadi-spring', 'a', LG, ['spring', 'water', 'oasis', 'obstacle'], (t, r) => {
  let o = sh(64, 118, 56, 6) + wall(t, 8, 120, 14, 84, 8400, 20);
  o += path('M44 84V58Q64 38 84 58V84Z', '#3a2018', 1, ink('#1a0c08', 1.2, .9)) + path('M50 84V62Q64 46 78 62V84Z', '#5a3028');
  o += path('M60 56Q62 70 60 84H68Q66 70 68 56Z', 'rgba(180,230,226,.8)') + line('M62 58V84M66 60V84', '#fff', .8, .6);
  o += ell(64, 100, 50, 14, '#c47e56', 1, 0, ink('#5a2a20', 1, .8)) + ell(64, 99, 44, 11, '#a8664c') + ell(64, 99, 40, 9, t.lg(['#8fc0b4', '#5a9a96', '#3a6e70'], 90), 1, 0, ink('#2f5a58', 1.2, .8)) + ell(52, 96, 12, 2.4, '#e6f6f0', .55) + line('M46 102q6 -2 12 0t12 0t12 0', '#e6f6f0', 1.2, .6) + ell(64, 84, 3, 1.4, '#fff', .7);
  for (const [x, y] of [[20, 100], [30, 108], [100, 104], [110, 98], [92, 110]]) o += [0, 1, 2, 3, 4].map(i => line(`M${x + i * 1.8} ${y + 4}q${r.range(-3, 3)} -10 ${r.range(-6, 6)} ${-r.range(10, 18)}`, ['#b8d08a', '#8aa860', '#5a7a44'][i % 3], 1.8, .95)).join('') + ell(x + 3, y - 14, 1.6, 4.4, '#8a6238');
  for (const [x, y] of [[18, 114], [112, 114], [40, 118], [92, 118]]) o += rrock(t, r, x, y - 3, 8, 5, 1);
  return o + [[44, 118], [60, 120], [78, 119]].map(([x, y]) => pebbleD(x, y - 4, .6, ['#e8b48a', '#a8664c'])).join('');
});
// ===== flood wreck: a smashed cart in a heap of silt and logs =====
IN('flood-wreck', 'a', LG, ['wreck', 'flood', 'cart', 'obstacle'], (t, r) => {
  let o = ell(64, 112, 58, 7, '#3b2a24', .14) + ell(64, 108, 56, 12, '#b8866a', .75) + ell(60, 104, 40, 7, '#d8b090', .6);
  const lg = (x, y, a, l, th) => `<g transform="translate(${x} ${y}) rotate(${a})">` + ell(1.4, 2, l / 2, th * .5, '#3b2a24', .16) + rect(-l / 2, -th / 2, l, th, wood(t, 90), th / 2, 1, ink('#3a2a1a', .8, .85)) + ell(-l / 2, 0, th * .3, th * .5, '#e8c890', 1, 0, ink('#3a2a1a', .6, .85)) + `</g>`;
  o += lg(40, 100, -22, 56, 7) + lg(88, 98, 14, 40, 6) + lg(66, 108, 4, 70, 6);
  o += `<g transform="rotate(-16 66 76)">` + path('M30 72H96L90 92H36Z', wood(t, 90), 1, ink('#3a2a1a', 1, .85)) + [0, 1, 2, 3, 4].map(i => line(`M${36 + i * 13} 73L${40 + i * 12} 91`, '#3a2a1a', 1, .6)).join('') + `</g>`;
  o += `<g transform="translate(94 94)">` + circ(0, 0, 15, '#4a3a28', 1, ink('#2a1a0a', 1.4, .9)) + circ(0, 0, 11, 'none', 1, ink('#8a6238', 2, 1)) + circ(0, 0, 3, '#8a6238') + [0, 1, 2, 3, 4, 5].map(i => line(`M0 0L${f(Math.cos(i * 1.05) * 12)} ${f(Math.sin(i * 1.05) * 12)}`, '#8a6238', 2, i === 2 ? 0 : 1)).join('') + `</g>`;
  o += jar(t, 24, 96, 1.4) + path('M14 106Q18 98 24 104L20 110Z', '#c47e56', 1, ink('#5a2a20', .6, .85)) + bone(52, 112, 14, 12) + skull(106, 108, .7, 10);
  o += [[16, 104], [112, 112], [70, 116]].map(([x, y]) => line(`M${x} ${y}l${r.range(-7, 7)} -9`, '#6a4a30', 1.6, .9)).join('');
  return o;
});
// ===== bedouin camp =====
IN('bedouin-camp', 'a', LG, ['camp', 'tent', 'obstacle'], (t, r) => {
  let o = ell(64, 112, 58, 6, '#3b2a24', .14) + ell(64, 108, 50, 9, '#d8b090', .45);
  o += `<g>` + path('M16 108L34 54L70 52L88 108Z', t.lg(['#5a3c34', '#3a2420', '#241410'], 20), 1, ink('#140806', 1, .85)) + path('M16 108L34 54L52 53L48 108Z', '#6a4a3c', .7) + path('M34 54L70 52L74 62L30 64Z', '#3a2420', 1, ink('#140806', .8, .85)) + path('M44 108V80Q56 70 68 80V108Z', '#140806') + line('M30 64H74', '#d8503a', 2, .9) + line('M22 90H84', '#d8503a', 1.4, .7) + `</g>`;
  o += [[34, 54], [70, 52]].map(([x, y]) => line(`M${x} ${y}V${y - 10}`, '#6a4a30', 2, 1) + circ(x, y - 11, 1.6, '#6a4a30')).join('') + line('M14 108L8 112M90 108L98 112', '#6a4a30', 1.4, .9);
  // fire, rug and pot
  o += ell(104, 108, 10, 3, '#3b2a24', .25) + [0, 1, 2, 3, 4].map(i => ell(98 + i * 3.4, 108 + (i % 2), 3.4, 1.8, '#8a7a6c', 1, i * 20, ink('#3a2a20', .5, .8))).join('') + ell(104, 100, 7, 9, 'rgba(255,200,90,.28)') + path('M104 106Q98 98 102 90Q104 96 108 92Q110 100 104 106Z', '#ffb02e', 1, ink('#c8501a', .6, .8)) + path('M104 105Q101 100 103 96Q105 99 106 97Q107 101 104 105Z', '#fff2a0');
  o += path('M60 112L96 112L100 118H56Z', '#b02e2e', 1, ink('#7a1e24', .8, .85)) + line('M64 115H92', '#f3c24f', 1, .9) + jar(t, 22, 118, 1.2) + circ(116, 100, 1, '#fff', 0);
  return o;
});
// ===== carved steles, rock obelisk, altar =====
const stele = (t, v) => { const fy = 118; let o = sh(32, fy, 16, 4.4) + mound(t, 32, fy - 2, 20, 5) + rblock(t, 18, fy - 12, 28, 10, 4);
  o += path(`M23 ${fy - 12}V44Q23 28 32 24Q41 28 41 44V${fy - 12}Z`, t.lg(['#f6d8b4', '#d9996e', '#a8664c'], 20), 1, ink('#5a2a20', 1, .85)) + path(`M36 30Q41 34 41 44V${fy - 12}H35Q37 60 36 30Z`, BLU[2], .26) + path('M25 40Q25 30 30 27Q26 34 26 46Z', '#fff', .35);
  if (v === 'a') o += path('M32 34Q27 38 32 42Q37 38 32 34Z', '#2a1612', 1, ink('#5a2a20', .6, .85)) + circ(32, 38, 1.6, '#f3c24f') + line('M32 46V70M27 52H37M28 62H36', '#6a3a30', 1.6, .85);
  else o += path('M28 36H36V46H28Z', 'none', 1, { stroke: '#6a3a30', 'stroke-width': 1.4 }) + line('M32 50V74M27 56L32 62L37 56M27 68H37', '#6a3a30', 1.6, .85) + circ(32, 40, 2, '#6a3a30');
  return o; };
IN('stele-carved', 'a', TALL, ['stele', 'carved', 'tall', 'obstacle'], (t) => stele(t, 'a'));
IN('stele-carved', 'b', TALL, ['stele', 'carved', 'tall', 'obstacle'], (t) => stele(t, 'b'));
IN('obelisk-rock-cut', 'a', TALL, ['obelisk', 'rock-cut', 'tall', 'signature', 'obstacle'], (t) => { const fy = 118; return sh(32, fy, 18, 5) + mound(t, 32, fy - 2, 24, 6) + rblock(t, 14, fy - 10, 36, 9, 5) + rblock(t, 18, fy - 20, 28, 9, 4) + path(`M22 ${fy - 20}L27 22L32 8L37 22L42 ${fy - 20}Z`, t.lg(['#f6d8b4', '#d9996e', '#a8664c'], 20), 1, ink('#5a2a20', 1, .85)) + path(`M32 8L37 22L42 ${fy - 20}H34Q35 50 32 8Z`, BLU[2], .28) + path('M32 8L27 22L22 ' + (fy - 20) + 'H25Q28 60 31 12Z', '#fff', .3) + line('M32 30V70M28 40H36M29 54H35', '#6a3a30', 1.4, .7); });
IN('high-place-altar', 'a', C, ['altar', 'steps', 'obstacle'], (t) => sh(30, 56, 24, 4) + rblock(t, 8, 52, 46, 8, 5) + rblock(t, 14, 44, 36, 8, 4) + rblock(t, 20, 36, 24, 9, 4) + ell(32, 28, 9, 3.4, '#3a2018', 1, 0, ink('#5a2a20', .8, .85)) + ell(32, 27, 6, 2, '#5a3028') + path('M32 26Q26 18 30 8Q32 14 36 10Q38 18 32 26Z', '#ffb02e', 1, ink('#c8501a', .6, .8)) + path('M32 25Q29 20 31 15Q33 18 34 16Q35 20 32 25Z', '#fff2a0') + ell(32, 18, 8, 12, 'rgba(255,200,90,.22)'));
for (const [v, open] of [['a', false], ['b', true]]) IN('tomb-door-small', v, C, ['door', 'rock-cut', 'tomb', 'obstacle'], (t, r) => sh(30, 56, 22, 3.6) + path('M6 56V20Q32 4 58 20V56Z', t.lg(TER, 60), 1, ink('#5a2a20', 1, .85)) + path('M44 12Q58 20 58 56H50Q52 24 44 12Z', BLU[2], .3) + rect(18, 22, 28, 4, '#f6d8b4', 0, 1, ink('#5a2a20', .8, .85)) + path('M20 56V32H44V56Z', '#2a1612', 1, ink('#140806', 1, .9)) + (open ? path('M24 56V36H40V56Z', '#4a2a22') + ell(32, 55, 9, 1.6, '#e8b48a', .6) : path('M23 56V34H41V56Z', t.lg(['#d8c0a0', '#a89070', '#6a5a44'], 90), 1, ink('#3a2a1a', .8, .85)) + line('M32 34V56M23 45H41', '#6a5a44', 1, .6) + circ(32, 46, 2, '#8a8084')));
for (const [v, open] of [['closed', false], ['open', true]]) IN('chest-red', v, C, ['chest', 'loot'], (t) => {
  let o = sh(30, 52, 17, 4);
  if (!open) o += path('M12 48V32Q12 22 32 22Q52 22 52 32V48Z', wood(t, 90), 1, ink('#3a2a1a', 1, .85)) + path('M12 34Q12 24 32 24Q52 24 52 34Z', t.lg(['#c9a070', '#9a6a40'], 90), 1, ink('#3a2a1a', .8, .8)) + [18, 32, 46].map(x => line(`M${x} 26V48`, '#4a4448', 2.4, .9)).join('') + rect(28, 34, 8, 8, '#f3c24f', 1, 1, ink('#a07a20', .8, .9)) + circ(32, 38, 1.2, '#5a3c20');
  else o += path('M12 48V32H52V48Z', wood(t, 90), 1, ink('#3a2a1a', 1, .85)) + ell(32, 32, 20, 5, '#3a2018', 1, 0, ink('#3a2a1a', .8, .85)) + circ(24, 31, 2.4, '#f3c24f', 1, ink('#a07a20', .6, .9)) + circ(34, 30, 2, '#d8503a') + circ(40, 32, 2.2, '#3fb0ac') + circ(30, 33, 1.6, '#f3c24f') + path('M12 32L8 14Q32 6 56 14L52 32Z', t.lg(['#c9a070', '#9a6a40', '#6a4a28'], 90), 1, ink('#3a2a1a', .8, .8)) + [18, 46].map(x => line(`M${x} 32L${x < 30 ? 14 : 50} 12`, '#4a4448', 2, .7)).join('');
  return o;
});
