// Interest objects (chests, torii waypoints, shops, caches, gates, camp) and overlays (fog, mist, fireflies, light).
import { T, P, rng, hash, f, newTile, save, ell, circ, rect, path, line, ink, g, shadow, wrapped, tuft } from './lib.mjs';

const mk = (cat, name, variant, w = T, h = T) => newTile({ cat, name, variant }, w, h);
const out = (t, cat, name, variant, tags = []) => save(t, { cat, name, variant, tags });
const sparkle = (x, y, s = 1, col = '#fff6c0') => path(`M${f(x)} ${f(y - 5 * s)}Q${f(x + .8 * s)} ${f(y - .8 * s)} ${f(x + 5 * s)} ${f(y)}Q${f(x + .8 * s)} ${f(y + .8 * s)} ${f(x)} ${f(y + 5 * s)}Q${f(x - .8 * s)} ${f(y + .8 * s)} ${f(x - 5 * s)} ${f(y)}Q${f(x - .8 * s)} ${f(y - .8 * s)} ${f(x)} ${f(y - 5 * s)}Z`, col, .95, ink('#e8a83a', .4, .6));
const glow = (t, x, y, r, c1 = '#ffe6a0', c2 = '#ffc45a', a = .85) => circ(x, y, r, t.rg([c1, c2, c2], .5, .5, .5, [a, a * .35, 0]));

// ---------- chests ----------
for (const [v, kind, open] of [['closed-a', 'wood', false], ['open-a', 'wood', true], ['closed-b', 'lacquer', false], ['open-b', 'lacquer', true]]) {
  const t = mk('interest', 'chest', v), body = kind === 'wood' ? ['#c98a4a', '#9a6030'] : ['#5a64a0', '#33396a'], lid = kind === 'wood' ? ['#d99a58', '#a86a36'] : ['#6a74b4', '#3d4378'];
  t.add(shadow(34, 52, 21, 5.5));
  if (open) t.add(glow(t, 32, 30, 24));
  t.add(path('M13 34H51V51Q32 56 13 51Z', t.lg(body, 90), 1, ink(P.inkW, 1, .85)));
  if (open) {
    t.add(rect(15, 33, 34, 5, '#3b2a1a', 1, .9)); t.add(ell(32, 34, 15, 3.2, '#fff0b0', .95));
    t.add(path('M13 33Q13 17 32 15Q51 17 51 33Q32 27 13 33Z', t.lg(lid, 90), 1, ink(P.inkW, 1, .85)), path('M16 31Q17 21 32 18Q33 24 16 31Z', '#fff', .25));
    t.add(circ(26, 28, 2.4, P.gold, 1, ink('#b98a1c', .6, .8)), circ(35, 26, 2, '#f3d27a', 1, ink('#b98a1c', .6, .8)), sparkle(40, 20, .9), sparkle(22, 20, .7));
  } else {
    t.add(path('M13 36Q13 20 32 18Q51 20 51 36Z', t.lg(lid, 90), 1, ink(P.inkW, 1, .85)), path('M16 34Q17 24 32 21Q31 28 16 34Z', '#fff', .25));
    t.add(rect(13, 33, 38, 3, '#6b4a2c', 0, .7));
  }
  const band = kind === 'wood' ? '#e8b93a' : '#f3c24f';
  t.add(rect(18, 19, 4.5, 33, band, 1, .95, ink('#b98a1c', .6, .7)), rect(41.5, 19, 4.5, 33, band, 1, .95, ink('#b98a1c', .6, .7)));
  if (!open) t.add(rect(28, 31, 8, 9, band, 1.5, 1, ink('#8a6a1c', .8, .8)), circ(32, 35, 1.5, '#4a3220'));
  if (kind === 'lacquer') t.add(circ(32, 26, 3, '#c8352b', 1, ink('#6a1a14', .5, .7)));
  out(t, 'interest', 'chest', v, ['loot', open ? 'open' : 'closed']);
}

// ---------- torii (waypoint) 128x128 ----------
for (const [v, lit, broken] of [['unlit', false, false], ['lit', true, false], ['broken', false, true]]) {
  const t = mk('interest', 'torii', v, 128, 128), r = rng(7);
  const red = lit ? ['#e0583f', '#c8352b', '#8e2118'] : (broken ? ['#c9806a', '#a85a48', '#7a3a30'] : ['#cf7a64', '#b0483c', '#7a2a22']);
  t.add(shadow(66, 116, 50, 7));
  if (lit) { t.add(ell(64, 100, 40, 14, '#ffd47a', .22), ell(64, 100, 26, 9, '#ffe9b0', .3)); t.add(glow(t, 64, 82, 34, '#ffe6a0', '#ffc45a', .6)); }
  const pil = (x, h0 = 40) => path(`M${x - 6} 116Q${x - 5} 80 ${x - 4.4} ${h0}H${x + 4.4}Q${x + 5} 80 ${x + 6} 116Z`, t.lg(red, 0), 1, ink('#4a1410', 1, .8));
  t.add(rect(18, 112, 18, 6, '#4a3a38', 2, 1, ink('#2a2018', .8, .8)), rect(92, 112, 18, 6, '#4a3a38', 2, 1, ink('#2a2018', .8, .8)));
  t.add(pil(27, broken ? 62 : 40), pil(101, 40));
  if (broken) { t.add(path('M17 62L25 56L30 63L35 58L38 62Z', '#e8dfc8', .9, ink('#7a3a30', .7, .6)), line('M24 66l4 10M26 90l-3 6', '#4a1410', 1.2, .6)); }
  t.add(path('M30 56H98V66H30Z', t.lg(red, 90), 1, ink('#4a1410', 1, .8)), rect(30, 56, 68, 2.4, '#fff', 0, .22));    // nuki (lower beam)
  if (!broken) {
    t.add(path('M4 36Q34 44 64 40Q94 44 124 36Q122 28 118 28Q94 36 64 34Q34 36 10 28Q6 28 4 36Z', t.lg(['#3a3a40', '#1f1f26'], 90), 1, ink('#0a0a10', 1, .8)));
    t.add(path('M12 44Q64 52 116 44V38Q64 44 12 38Z', t.lg(red, 90), 1, ink('#4a1410', 1, .8)), path('M8 34Q36 38 64 36Q92 38 120 34', 'none', 1, { fill: 'none', stroke: '#fff', 'stroke-width': 1.2, 'stroke-opacity': .25 }));
    t.add(rect(58, 44, 12, 14, '#e8dfc8', 1, 1, ink('#4a3220', .8, .8)), line('M61 49h6M61 53h6', '#4a3220', 1, .6));
  } else {
    t.add(path('M30 40Q64 46 98 40Q108 38 112 36Q106 30 100 31Q64 38 30 32Z', t.lg(['#3a3a40', '#1f1f26'], 90), 1, ink('#0a0a10', 1, .8)), line('M96 32l8-10', '#8a6a44', 3));
    t.add(path('M90 40q6 8 2 20', 'none', 1, { fill: 'none', stroke: '#2a2018', 'stroke-width': 1.4, 'stroke-opacity': .6 }));
  }
  // moss / tufts, shimenawa
  if (!lit) { t.add(path('M21 114q4-9 8-6q4-5 8 6Z', '#86b865', .9), path('M95 114q4-9 8-6q4-5 8 6Z', '#86b865', .9), tuft(40, 116, '#4d7a40', .8, .8)); }
  if (v === 'unlit') { t.add(path('M33 62Q64 76 95 62V58Q64 72 33 58Z', '#e8d9a8', 1, ink('#a88a4a', .9, .8))); for (const x of [46, 64, 82]) t.add(path(`M${x} 70l4 0l-1 7l3 -1l-2 7l-4 -2l1 -5l-3 1Z`, '#fffaf0', 1, ink('#b8b09a', .7, .8))); }
  if (lit) {
    t.add(path('M33 62Q64 76 95 62V58Q64 72 33 58Z', '#f3dc9a', 1, ink('#a88a4a', .9, .8)));
    for (let i = 0; i < 10; i++) t.add(sparkle(r.range(26, 102), r.range(30, 108), r.range(.4, .8)));
    t.add(glow(t, 64, 96, 12, '#fff6c0', '#ffd47a', .9));
  }
  out(t, 'interest', 'torii', v, ['large', 'waypoint', 'shrine', v]);
}
{ // jizo shrine
  const t = mk('interest', 'jizo', 'a', T, 128); t.add(shadow(34, 114, 18, 5.5));
  t.add(path('M16 114H48L45 104H19Z', t.lg(P.stone, 0), 1, ink(P.inkR, .9, .8)), path('M22 104H42V94H22Z', t.lg(P.stone, 0), 1, ink(P.inkR, .9, .8)));
  t.add(path('M23 94Q22 74 28 70H36Q42 74 41 94Z', t.lg(P.stone, 0), 1, ink(P.inkR, .9, .8)), circ(32, 62, 9, t.lg(P.stone, 45), 1, ink(P.inkR, .9, .8)), line('M28 62q1.5 1.5 3 0M33 62q1.5 1.5 3 0', '#6a6a5a', 1, .8));
  t.add(path('M27 72Q32 78 37 72L38 78Q32 84 26 78Z', '#c8352b', 1, ink('#6a1a14', .7, .8)), path('M27 54Q32 46 37 54Z', '#e0583f', 1, ink('#6a1a14', .7, .8)));
  t.add(rect(18, 104, 4, 6, '#fff6e0', 1), rect(42, 106, 4, 5, '#c8352b', 1), ell(32, 108, 5, 2, '#f3c24f', .9), path('M20 108q4-6 9-2Z', '#86b865', .9));
  out(t, 'interest', 'jizo', 'a', ['tall', 'shrine', 'firefly-marsh']);
}

// ---------- shop stalls 128x128 ----------
for (const [v, c1, c2] of [['a', '#4d639a', '#f6efdc'], ['b', '#c8352b', '#f6efdc'], ['c', '#5f8f4c', '#f6efdc']]) {
  const t = mk('interest', 'shop-stall', v, 128, 128);
  t.add(shadow(66, 118, 52, 7));
  for (const x of [20, 108]) t.add(rect(x - 3, 44, 6, 74, t.lg(P.bark, 0), 1, 1, ink(P.inkW, .9, .8)));
  t.add(rect(12, 78, 104, 38, t.lg(['#d9bc8a', '#a8844f'], 90), 2, 1, ink(P.inkW, 1, .85)), rect(8, 72, 112, 9, t.lg(['#e8cf9a', '#b88e5a'], 90), 2, 1, ink(P.inkW, 1, .85)), rect(14, 84, 100, 1.5, '#8a6a44', 0, .5), rect(14, 98, 100, 1.5, '#8a6a44', 0, .5));
  // goods
  t.add(path('M20 72Q22 60 34 60Q46 60 48 72Z', '#c9a06a', 1, ink(P.inkW, .8, .8)), circ(28, 60, 4, '#e0583f'), circ(36, 58, 4, '#e0583f', 1), circ(42, 62, 3.6, '#c8352b'), circ(27, 58.6, 1.2, '#fff', .7));
  t.add(path('M58 72V58Q58 54 64 54Q70 54 70 58V72Z', '#7a8fc0', 1, ink(P.inkB, .9, .8)), rect(60, 50, 8, 5, '#d9bc8a', 1, 1, ink(P.inkW, .8, .8)), path('M76 72V62H92V72Z', '#e8d9a8', 1, ink('#8a6a28', .8, .8)), path('M80 62q4-8 8 0', '#f3c24f', 1), path('M98 72Q98 60 106 60Q114 60 114 72Z', '#c9a06a', 1, ink(P.inkW, .8, .8)), circ(103, 59, 3.4, '#f3c24f'), circ(109, 60, 3.4, '#e8a83a'));
  // awning
  const stripes = []; for (let i = 0; i < 8; i++) stripes.push(path(`M${8 + i * 14} 36H${22 + i * 14}L${22 + i * 14} 56Q${15 + i * 14} 62 ${8 + i * 14} 56Z`, i % 2 ? c2 : t.lg([c1, c1 === '#4d639a' ? '#33456f' : (c1 === '#c8352b' ? '#8e2118' : '#3f6a34')], 90), 1, ink('#3b3a24', .6, .5)));
  t.add(path('M4 40L18 22H110L124 40Z', t.lg([c1, c1 === '#4d639a' ? '#33456f' : (c1 === '#c8352b' ? '#8e2118' : '#3f6a34')], 90), 1, ink('#3b3a24', 1, .8)), path('M22 24H106L116 38H12Z', '#fff', .16));
  t.add(...stripes);
  t.add(ell(64, 62, 52, 3, '#3b3a24', .1));
  t.add(line('M96 62v14', '#6b4a2c', 1.2), circ(96, 80, 6, P.gold, 1, ink('#b98a1c', .8, .8)), rect(94, 77, 4, 6, '#b98a1c', 0, .7));
  out(t, 'interest', 'shop-stall', v, ['large', 'shop']);
}

// ---------- secret cache ----------
for (const [v, open] of [['hidden', false], ['revealed', true]]) {
  const t = mk('interest', 'secret-cache', v); t.add(shadow(34, 50, 20, 5));
  if (open) t.add(glow(t, 32, 40, 22, '#d6f0ff', '#8fd0ff', .6));
  t.add(path(open ? 'M12 48Q10 38 16 34H48Q54 38 52 48Q32 54 12 48Z' : 'M12 48Q10 36 16 32H48Q54 36 52 48Q32 54 12 48Z', t.lg(P.stoneG, 40), 1, ink(P.inkR, 1, .85)));
  t.add(path('M16 36Q18 30 32 31Q30 35 16 36Z', '#fff', .35), line('M22 40l6 4l6-6l8 4', P.stoneG[2], 1.1, .6));
  if (open) { t.add(path('M24 34H44L46 24L22 24Z', '#2a3a4a', .9), sparkle(30, 20, 1, '#e6f6ff'), sparkle(44, 28, .7, '#e6f6ff'), circ(34, 28, 2.2, '#8fd0ff', 1, ink('#33456f', .5, .7))); }
  else { t.add(path('M12 46q4-6 9-3q3-5 8 2Z', '#86b865', .95), tuft(44, 34, '#4d7a40', .8, .6), sparkle(42, 26, .8), sparkle(22, 24, .5)); }
  out(t, 'interest', 'secret-cache', v, ['loot', 'secret', open ? 'open' : 'hidden']);
}

// ---------- gates (128x128, footprint bottom row; boss stands beside, never in front) ----------
function post(t, x, top, base = 118, w = 5) { return rect(x - w, top, w * 2, base - top, t.lg(P.bark, 0), 1.5, 1, ink(P.inkW, 1, .85)) + ell(x, top, w, 2, '#c9a06a', 1); }
function farmGate(t, open) {
  t.add(shadow(66, 118, 48, 6)); t.add(post(t, 22, 56), post(t, 106, 56));
  // flower arch
  t.add(path('M16 62Q16 18 64 16Q112 18 112 62', 'none', 1, { fill: 'none', stroke: '#6b8a44', 'stroke-width': 7, 'stroke-linecap': 'round' }), path('M16 62Q16 18 64 16Q112 18 112 62', 'none', 1, { fill: 'none', stroke: '#8a6a44', 'stroke-width': 2.4, 'stroke-linecap': 'round' }));
  const r = rng(4); for (let i = 0; i < 26; i++) { const a = Math.PI + (i / 25) * Math.PI, rx = 48, cx = 64 + Math.cos(a) * rx, cy = 62 + Math.sin(a) * 46; t.add(circ(cx + r.range(-3, 3), cy + r.range(-3, 3), r.range(2.2, 3.6), r.pick(['#fbdde6', '#f2b0c4', '#fff', '#f6c6d4', '#8fd08a']), 1, ink('#b0607a', .3, .4))); }
  if (!open) {
    for (const [x0, dir] of [[26, 1], [102, -1]]) { const w = 36; t.add(path(`M${x0} 72h${dir * w}v40h${-dir * w}Z`, t.lg(['#d9bc8a', '#b08050'], 90), 1, ink(P.inkW, 1, .85))); for (let k = 1; k < 5; k++) t.add(rect(Math.min(x0, x0 + dir * w) + k * w / 5 - .6, 72, 1.2, 40, '#8a6a44', 0, .5)); t.add(line(`M${x0} 80h${dir * w}M${x0} 104h${dir * w}`, '#8a6a44', 1.6, .8), line(`M${x0} 104L${x0 + dir * w} 80`, '#8a6a44', 1.6, .6)); }
    t.add(rect(60, 86, 8, 12, '#4a3a32', 1, 1, ink('#1a1410', .6, .8)), circ(64, 92, 1.8, P.gold));
  } else {
    for (const [x0, dir] of [[26, 1], [102, -1]]) t.add(path(`M${x0} 70L${x0 + dir * 12} 66V112L${x0} 114Z`, t.lg(['#c9a06a', '#9a7442'], 90), 1, ink(P.inkW, 1, .85)), line(`M${x0} 82L${x0 + dir * 12} 80M${x0} 104L${x0 + dir * 12} 102`, '#8a6a44', 1.4, .8));
    t.add(ell(64, 114, 26, 5, '#fff6c0', .35));
  }
  t.add(tuft(10, 118, '#4d7a40', .8, .9), tuft(118, 118, '#4d7a40', .8, .9));
}
for (const open of [false, true]) { const t = mk('interest', 'gate-farm', open ? 'open' : 'closed', 128, 128); farmGate(t, open); out(t, 'interest', 'gate-farm', open ? 'open' : 'closed', ['large', 'gate', 'sunny-meadows', open ? 'open' : 'closed']); }
function stoneGate(t, open) {
  t.add(shadow(66, 118, 52, 7));
  const gr = t.lg(P.stoneG, 0);
  t.add(path('M14 118V52Q14 12 64 10Q114 12 114 52V118H96V54Q96 30 64 28Q32 30 32 54V118Z', gr, 1, ink(P.inkR, 1.2, .85)));
  t.add(path('M18 112V54Q18 20 64 14Q40 22 36 54V112Z', '#fff', .22));
  for (let i = 0; i < 6; i++) { const a = Math.PI + i / 5 * Math.PI; t.add(line(`M${f(64 + Math.cos(a) * 33)} ${f(54 + Math.sin(a) * 26)}l${f(Math.cos(a) * 14)} ${f(Math.sin(a) * 12)}`, P.stoneG[2], 1.2, .6)); }
  t.add(path('M32 118V54Q32 36 64 34Q96 36 96 54V118Z', open ? '#1e2a24' : t.lg(['#7a5a3a', '#4a3220'], 90), 1, ink('#1a1410', 1, .8)));
  if (!open) { for (const x of [48, 64, 80]) t.add(rect(x - .8, 38, 1.6, 78, '#3a2618', 0, .5)); t.add(rect(32, 62, 64, 4, '#3a3a40', 0, .9), rect(32, 92, 64, 4, '#3a3a40', 0, .9), circ(58, 80, 3, P.gold, 1, ink('#8a6a1c', .6, .8)), circ(70, 80, 3, P.gold, 1, ink('#8a6a1c', .6, .8))); }
  else { t.add(ell(64, 100, 20, 10, '#4a6a5a', .6), ell(64, 112, 14, 4, '#fff6c0', .22)); for (const [x0, dir] of [[32, 1], [96, -1]]) t.add(path(`M${x0} 40L${x0 + dir * 9} 44V112L${x0} 114Z`, t.lg(['#7a5a3a', '#4a3220'], 90), 1, ink('#1a1410', 1, .8))); }
  t.add(path('M20 24Q64 -2 108 24L106 30Q64 6 22 30Z', 'none', 0, { fill: 'none' }));
  t.add(tuft(12, 118, '#4d7a40', .8, .9), tuft(116, 118, '#4d7a40', .8, .9), path('M14 80q6-8 14-3q4-6 6 2Z', '#86b865', .9));
}
for (const open of [false, true]) { const t = mk('interest', 'gate-stone', open ? 'open' : 'closed', 128, 128); stoneGate(t, open); out(t, 'interest', 'gate-stone', open ? 'open' : 'closed', ['large', 'gate', 'misty-highlands', open ? 'open' : 'closed']); }
function hutGate(t, open) { // thatched hut gate (bamboo valley) / boathouse style roof gate
  t.add(shadow(66, 118, 50, 7));
  t.add(rect(20, 60, 88, 58, t.lg(['#e8d9a8', '#c9b27a'], 90), 2, 1, ink(P.inkW, 1, .85)));
  for (let x = 28; x < 108; x += 12) t.add(rect(x, 60, 1.4, 58, '#a8844f', 0, .6));
  t.add(rect(46, 70, 36, 48, open ? '#2a2018' : t.lg(['#9a7442', '#6b4a2c'], 90), 1, 1, ink('#1a1410', 1, .8)));
  if (!open) { for (let x = 52; x < 82; x += 7) t.add(rect(x, 70, 1.2, 48, '#4a3220', 0, .55)); t.add(circ(76, 96, 2.4, P.gold)); }
  else { t.add(path('M46 70L38 74V116L46 118Z', t.lg(['#9a7442', '#6b4a2c'], 90), 1, ink('#1a1410', 1, .8)), ell(64, 114, 14, 3, '#fff6c0', .3)); }
  t.add(path('M6 62Q20 40 64 26Q108 40 122 62Q64 54 6 62Z', t.lg(['#d9c27a', '#9a8040'], 90), 1, ink('#5a4a20', 1, .8)));
  for (let x = 14; x < 118; x += 7) t.add(line(`M${x} 57L${x - 2} 62`, '#7a6430', 1.1, .6));
  t.add(path('M6 62Q64 54 122 62V66Q64 58 6 66Z', '#8a7030', 1, ink('#5a4a20', .8, .8)), path('M30 40Q64 30 98 40', 'none', 1, { fill: 'none', stroke: '#fff', 'stroke-width': 1.6, 'stroke-opacity': .25 }));
}
for (const open of [false, true]) { const t = mk('interest', 'gate-hut', open ? 'open' : 'closed', 128, 128); hutGate(t, open); out(t, 'interest', 'gate-hut', open ? 'open' : 'closed', ['large', 'gate', 'bamboo-valley', 'firefly-marsh', open ? 'open' : 'closed']); }

// ---------- camp ----------
for (const [v, lit] of [['unlit', false], ['lit', true]]) {
  const t = mk('interest', 'campfire', v); t.add(shadow(34, 52, 18, 5));
  if (lit) t.add(glow(t, 32, 38, 28, '#ffd47a', '#ff9a3a', .6));
  for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; t.add(ell(32 + Math.cos(a) * 14, 48 + Math.sin(a) * 4.5, 3.6, 2.6, '#a2a596', 1, 0, ink(P.inkR, .6, .7))); }
  t.add(path('M18 48L46 40L48 44L20 52Z', t.lg(P.bark, 90), 1, ink(P.inkW, .8, .8)), path('M18 40L46 50L44 53L16 44Z', t.lg(P.bark, 90), 1, ink(P.inkW, .8, .8)));
  if (lit) t.add(path('M32 46Q22 38 28 26Q30 32 34 28Q34 18 40 14Q40 26 46 32Q48 40 38 46Z', t.lg(['#ffd23a', '#ff7a2a', '#d2381a'], 90), 1), path('M32 46Q27 40 31 34Q34 38 36 34Q38 40 36 46Z', '#fff2b0', 1));
  else t.add(ell(32, 46, 10, 3, '#3a3430', .8), line('M30 42q1-4 0-7M35 42q-1-3 1-6', '#8a8a8a', 1.4, .35));
  out(t, 'interest', 'campfire', v, ['camp', v]);
}
{ const t = mk('interest', 'tent', 'a', 128, 128); t.add(shadow(66, 116, 46, 7));
  t.add(path('M16 114L64 30L112 114Z', t.lg(['#e8d9a8', '#c9b27a'], 0), 1, ink(P.inkW, 1.2, .85)), path('M64 30L112 114H78Z', '#a8884f', .55), path('M54 114L64 70L76 114Z', '#2a2018', 1, ink('#1a1410', 1, .8)), path('M54 114L64 70L58 114Z', '#4a3a28', 1));
  t.add(line('M64 30V22', P.bark[1], 2.4), path('M64 22l12 3l-12 4Z', '#c8352b', 1, ink('#6a1a14', .6, .7)), line('M16 114l-8 6M112 114l8 6', '#8a6a44', 1.6), path('M40 100h14l-4-24Z', '#c8352b', .55));
  out(t, 'interest', 'tent', 'a', ['large', 'camp']); }

// ---------- overlays: fog / mist / fireflies / light ----------
const wrapX = (cx, cy, rad, fn) => [-T, 0, T].filter(dx => cx + dx + rad > 0 && cx + dx - rad < T).map(dx => fn(cx + dx, cy)).join('');
function fogBand(t) { // fog along the TOP edge; identical for every tile, wraps horizontally
  const r = rng(91); let o = rect(0, 0, T, 34, t.lg(['#efe5cd', '#efe5cd', '#efe5cd'].map((c, i) => c), 90), 0, 0);
  const gr = t.lg(['#f6efdc', '#f6efdc'], 90); // placeholder to keep ids stable
  o = `<rect width="64" height="30" fill="url(#${t.pre}fadeN)"/>`;
  t.defs.push(`<linearGradient id="${t.pre}fadeN" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efe5cd" stop-opacity=".95"/><stop offset=".55" stop-color="#efe5cd" stop-opacity=".75"/><stop offset="1" stop-color="#efe5cd" stop-opacity="0"/></linearGradient>`);
  for (let i = 0; i < 6; i++) { const x = 5 + i * 11.5 + r.range(-3, 3), y = r.range(-2, 14), rx = r.range(12, 19), ry = rx * .55; o += wrapX(x, y, rx, (a, b) => ell(a, b, rx, ry, '#f6efdc', +r.range(.55, .85).toFixed(2)) + ell(a + 4, b + ry * .75, rx * .75, ry * .3, '#cfc6b0', .2)); }
  return o;
}
for (let m = 1; m < 16; m++) {
  const t = mk('overlays', 'fog-edge', String(m).padStart(2, '0')); const sides = [[1, 0], [2, 90], [4, 180], [8, 270]]; // N E S W
  for (const [bit, rot] of sides) if (m & bit) { const band = fogBand(t); t.add(g(band, { transform: `rotate(${rot} 32 32)` })); }
  out(t, 'overlays', 'fog-edge', String(m).padStart(2, '0'), ['overlay', 'fog', 'autotile', 'connect4', 'mask:' + m]);
}
for (const [v, s, dens] of [['a', 101, 9], ['b', 102, 11], ['c', 103, 8]]) {
  const t = mk('overlays', 'fog-full', v), r = rng(s); t.add(rect(0, 0, T, T, '#efe5cd', 0, .8));
  for (let i = 0; i < dens; i++) { const x = r.range(0, T), y = r.range(0, T), rx = r.range(14, 22); t.add(wrapped(x, y, rx, (a, b) => ell(a, b, rx, rx * .55, '#f6efdc', +r.range(.5, .8).toFixed(2)) + ell(a + 4, b + rx * .45, rx * .75, rx * .16, '#cfc6b0', .2))); }
  out(t, 'overlays', 'fog-full', v, ['overlay', 'fog', 'seamless']);
}
for (const [v, s, col, n] of [['a', 111, '#f6f3e6', 6], ['b', 112, '#e8f0ee', 7], ['c', 113, '#f1ead8', 5]]) {
  const t = mk('overlays', 'mist-low', v), r = rng(s);
  for (let i = 0; i < n; i++) { const x = r.range(0, T), y = r.range(8, T - 8), rx = r.range(14, 24); t.add(wrapped(x, y, rx, (a, b) => ell(a, b, rx, rx * .26, col, +r.range(.18, .38).toFixed(2)) + ell(a - 3, b - 1, rx * .6, rx * .14, '#fff', .2))); }
  out(t, 'overlays', 'mist-low', v, ['overlay', 'mist', 'seamless', 'misty-highlands', 'ruins']);
}
for (const [v, s, n] of [['a', 121, 4], ['b', 122, 6], ['c', 123, 3]]) {
  const t = mk('overlays', 'fireflies', v), r = rng(s);
  for (let i = 0; i < n; i++) { const x = r.range(8, 56), y = r.range(8, 56), k = r.range(.8, 1.4); t.add(circ(x, y, 7 * k, t.rg(['#f4ff9a', '#d4f070', '#d4f070'], .5, .5, .5, [.95, .35, 0])), circ(x, y, 1.3 * k, '#fffde0')); }
  out(t, 'overlays', 'fireflies', v, ['overlay', 'glow', 'firefly-marsh']);
}
for (const [v, s] of [['a', 131], ['b', 132]]) { // dappled light through leaves (dark, multiply-ish soft spots), seamless
  const t = mk('overlays', 'dapple', v), r = rng(s);
  for (let i = 0; i < 7; i++) { const x = r.range(0, T), y = r.range(0, T), rx = r.range(5, 11); t.add(wrapped(x, y, rx, (a, b) => ell(a, b, rx, rx * .8, '#1f4a26', .13, r.range(0, 180)) + ell(a - 1, b - 1, rx * .5, rx * .4, '#1f4a26', .07))); }
  for (let i = 0; i < 4; i++) { const x = r.range(0, T), y = r.range(0, T); t.add(wrapped(x, y, 8, (a, b) => ell(a, b, 6, 4, '#fff6c0', .22))); }
  out(t, 'overlays', 'dapple', v, ['overlay', 'light', 'seamless', 'old-oak-wood']);
}
{ const t = mk('overlays', 'sunbeam', 'a'); const r = rng(5);
  t.add(`<path d="M20 0H40L60 64H10Z" fill="url(#${t.pre}sb)"/>`); t.defs.push(`<linearGradient id="${t.pre}sb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c0" stop-opacity=".5"/><stop offset="1" stop-color="#fff6c0" stop-opacity=".05"/></linearGradient>`);
  for (let i = 0; i < 5; i++) t.add(circ(r.range(16, 48), r.range(8, 56), r.range(.8, 1.6), '#fff', .7));
  out(t, 'overlays', 'sunbeam', 'a', ['overlay', 'light']); }
for (const [v, s, cols] of [['a', 141, ['#f6c6d4', '#fbdde6']], ['b', 142, ['#e8a83a', '#d2622e', '#b8b068']]]) {
  const t = mk('overlays', v === 'a' ? 'petals-drift' : 'leaves-drift', 'a'), r = rng(s);
  for (let i = 0; i < 9; i++) t.add(ell(r.range(6, 58), r.range(6, 58), 2.4, 1.3, r.pick(cols), .9, r.range(0, 180)));
  out(t, 'overlays', v === 'a' ? 'petals-drift' : 'leaves-drift', 'a', ['overlay', 'ambient']);
}
