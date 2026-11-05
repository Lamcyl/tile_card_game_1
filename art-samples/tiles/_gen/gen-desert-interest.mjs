// Ashkara common: interest objects (chests, shop stalls, waypoint stele, djinn lamp, gates, cache, sphinx) and overlays.
import { T, rng, hash, f, ell, circ, rect, path, line, ink, wrapped, D, tile, sh, block, pebbleD } from './desert-lib.mjs';

const C = [T, T], TALL = [T, 128], LG = [128, 128];
const spark = (x, y, s = 1, col = '#fff6c0') => path(`M${f(x)} ${f(y - 5 * s)}Q${f(x + .8 * s)} ${f(y - .8 * s)} ${f(x + 5 * s)} ${f(y)}Q${f(x + .8 * s)} ${f(y + .8 * s)} ${f(x)} ${f(y + 5 * s)}Q${f(x - .8 * s)} ${f(y + .8 * s)} ${f(x - 5 * s)} ${f(y)}Q${f(x - .8 * s)} ${f(y - .8 * s)} ${f(x)} ${f(y - 5 * s)}Z`, col, .95);
const glow = (t, x, y, r, a = .8) => circ(x, y, r, t.rg(['#ffe6a0', '#ffc45a', '#ffc45a'], .5, .5, .5, [a, a * .35, 0]));

// ---- chests: wood and gilded, closed / open ----
function chest(t, gilded, open) {
  const w = gilded ? ['#c8803a', '#9a5a26', '#6a3a18'] : D.wood, band = gilded ? D.gold : ['#8a8478', '#6a665c', '#4a463e'];
  let o = sh(34, 53, 20, 4.5);
  o += rect(12, 32, 40, 20, t.lg(w, 90), 2, 1, ink(D.inkB, 1, .85)) + rect(12, 32, 40, 3, '#fff', 0, .18);
  for (const x of [16, 46]) o += rect(x, 32, 5, 20, t.lg(band, 90), 0, 1, ink('#4a3a14', .6, .7));
  o += rect(29, 38, 6, 7, band[1], 1, 1, ink('#4a3a14', .7, .8)) + circ(32, 41, 1, '#3a2a10');
  if (!open) o += path('M12 33Q12 20 32 20Q52 20 52 33Z', t.lg(w, 90), 1, ink(D.inkB, 1, .85)) + path('M16 33Q16 23 22 21.6L22 33Z', band[1], 1) + path('M42 33Q42 23 42 21.6Q48 23 48 33Z', band[1], 1) + path('M16 27Q32 19 48 27', 'none', 1, { stroke: '#fff', 'stroke-opacity': .22, 'stroke-width': 1.6 });
  else {
    o += rect(13, 33, 38, 4, '#2a1a10', 1, 1) + ell(32, 34, 17, 3, gilded ? '#ffe08a' : '#c8a070', 1) + [[22, 33], [30, 32], [38, 33.4], [44, 32.4]].map(([x, y]) => ell(x, y, 2.6, 1.4, D.gold[1], 1, 0, ink('#7a5a14', .4, .8))).join('') + spark(34, 28, 1.2);
    o += path('M13 32L16 14Q32 8 48 14L51 32Z', t.lg(w, 90), 1, ink(D.inkB, 1, .85)) + rect(16, 14, 5, 18, 'none', 0, 1) + path('M15 28L17 16H22L21 28Z', band[1], 1) + path('M43 28L42 16H47L49 28Z', band[1], 1);
    o += ell(32, 22, 14, 6, '#2a1a10', .55);
  }
  if (gilded) o += circ(32, 41, 1.8, '#3fb0ac', 1, ink('#1f4a56', .5, .8)) + circ(31.4, 40.4, .6, '#fff', .8);
  return o;
}
for (const [n, g] of [['chest-wood', false], ['chest-gilded', true]]) for (const open of [false, true]) tile('interest', n, open ? 'open' : 'closed', C, ['interest', 'loot', open ? 'open' : 'closed', ...(g ? ['rare'] : [])], (t) => chest(t, g, open));

// ---- shop stalls (large) ----
function stall(t, kind) {
  const aw = kind === 'a' ? ['#c8352b', '#f4e8cc'] : ['#2f9a9a', '#f4e8cc'];
  let o = sh(66, 114, 54, 7);
  o += rect(18, 52, 4, 60, D.wood[2], 0, 1) + rect(106, 52, 4, 60, D.wood[2], 0, 1);
  o += path('M18 84H110V112H18Z', t.lg(D.wood, 90), 1, ink(D.inkB, 1, .85)) + rect(14, 80, 100, 6, '#e0b87a', 1, 1, ink(D.inkB, .9, .8)) + [30, 46, 62, 78, 94].map(x => line(`M${x} 88V110`, D.wood[2], 1, .4)).join('');
  if (kind === 'a') {
    for (const [x, c, c2] of [[28, '#d8603a', '#a83a22'], [44, '#e8b838', '#b8882a'], [60, '#a83a52', '#7a2238'], [76, '#7a9a3a', '#56722a'], [92, '#d88a3a', '#a8601e']]) o += rect(x - 7, 78, 14, 3, '#7a5a30', 0, 1) + path(`M${x - 7} 78Q${x} 62 ${x + 7} 78Z`, t.lg(['#ffffff', c, c2], 45), 1, ink('#4a2a10', .8, .8)) + ell(x - 2, 72, 1.6, 3, '#fff', .35);
    o += ell(106, 76, 7, 4, '#d8a868', 1, 0, ink(D.inkB, .8, .8)) + ell(14, 76, 6, 4, '#e8c070', 1, 0, ink(D.inkB, .8, .8));
  } else {
    for (const [x, c] of [[26, D.rug], [52, ['#f0d898', '#3fb0ac', '#1f7a86']], [78, ['#e8b858', '#b02e2e', '#7a1e24']], [100, ['#c8a8e8', '#7a5aa8', '#4a3278']]]) o += path(`M${x - 11} 80V54Q${x} 50 ${x + 11} 54V80Z`, t.lg(c, 0), 1, ink('#3a1a1a', .8, .8)) + [60, 66, 72].map(y => line(`M${x - 10} ${y}H${x + 10}`, '#f0c870', .9, .7)).join('') + `<g fill="#f0c870" opacity=".85"><path d="M${x} 62l3 3l-3 3l-3-3Z"/></g>`;
  }
  // awning
  const n = 8, x0 = 8, x1 = 120, wd = (x1 - x0) / n;
  for (let i = 0; i < n; i++) o += path(`M${x0 + i * wd} 36H${x0 + (i + 1) * wd}V52Q${x0 + (i + .5) * wd} 60 ${x0 + i * wd} 52Z`, aw[i % 2], 1, ink('#4a1a14', .8, .8));
  o += path(`M${x0} 36L22 20H106L${x1} 36Z`, t.lg([aw[0], aw[0], '#7a1e1a'], 90), 1, ink('#4a1a14', 1, .85));
  for (let i = 1; i < n; i++) o += line(`M${x0 + i * wd} 36L${22 + (i / n) * 84} 20`, '#fff', 1, .25);
  o += path(`M${x0} 36H${x1}`, 'none', 1, { stroke: '#4a1a14', 'stroke-width': 1.2, 'stroke-opacity': .7 }) + ell(64, 22, 40, 2, '#fff', .3);
  return o + circ(64, 16, 3, D.gold[1], 1, ink('#7a5a14', .8, .8));
}
tile('interest', 'shop-stall', 'a', LG, ['large', 'shop', 'obstacle', 'interest', 'spices'], (t) => stall(t, 'a'));
tile('interest', 'shop-stall', 'b', LG, ['large', 'shop', 'obstacle', 'interest', 'rugs'], (t) => stall(t, 'b'));

// ---- waypoint stele (tall): unlit / lit ----
for (const lit of [false, true]) tile('interest', 'waypoint-stele', lit ? 'lit' : 'unlit', TALL, ['tall', 'waypoint', 'interest', lit ? 'lit' : 'unlit', 'obstacle'], (t) => {
  let o = sh(36, 114, 20, 5); if (lit) o += glow(t, 32, 44, 30, .85);
  o += block(t, 14, 112, 36, 8, D.stone[0], D.stone, 5);
  o += path('M20 104V44Q20 24 32 24Q44 24 44 44V104Z', t.lg(lit ? ['#fff0c8', '#e8b878', '#a8744a'] : D.stone, 0), 1, ink(D.inkS, 1, .85));
  o += circ(32, 48, 9, 'none', 1, { stroke: lit ? '#b8861a' : '#8a6040', 'stroke-width': 1.6, 'stroke-opacity': .8 }) + circ(32, 48, 4, lit ? '#ffe08a' : '#b89068', 1, ink('#6b3a22', .6, .8));
  for (let i = 0; i < 8; i++) o += line(`M${f(32 + Math.cos(i * .785) * 6)} ${f(48 + Math.sin(i * .785) * 6)}l${f(Math.cos(i * .785) * 5)} ${f(Math.sin(i * .785) * 5)}`, lit ? '#b8861a' : '#8a6040', 1, .8);
  o += path('M22 62Q32 66 42 62V68Q32 72 22 68Z', lit ? '#3fb0ac' : '#6a9a98', .9) + line('M26 80h12M24 88h16M28 96h8', lit ? '#b8861a' : '#8a6040', 1.2, .6);
  o += ell(26, 40, 2.6, 8, '#fff', .3, 8);
  if (lit) o += path('M26 20Q22 14 32 4Q42 14 38 20Q32 24 26 20Z', t.lg(['#ffe08a', '#f08a30', '#c8352b'], 90), 1, ink('#8e2118', .6, .6)) + path('M29 20Q28 15 32 11Q36 15 35 20Z', '#fff0a8', .9) + ell(32, 24, 9, 2.4, '#5a3a24', 1, 0, ink('#2a1a10', .8, .8));
  else o += ell(32, 24, 8, 2.4, '#8a7a68', 1, 0, ink('#2a1a10', .8, .8)) + ell(32, 23.4, 5, 1.2, '#3a2a1c', .9);
  return o;
});
// ---- event object: djinn lamp (tall) dormant / awake ----
for (const awake of [false, true]) tile('interest', 'djinn-lamp', awake ? 'awake' : 'dormant', TALL, ['tall', 'event', 'interest', awake ? 'lit' : 'unlit'], (t) => {
  let o = sh(36, 114, 18, 5); if (awake) o += glow(t, 32, 78, 34, .7);
  o += block(t, 18, 112, 28, 6, D.stone[0], D.stone, 5) + path('M22 106V92H42V106Z', t.lg(D.stone, 0), 1, ink(D.inkS, .9, .85)) + block(t, 18, 92, 28, 4, D.stone[0], D.stone, 4);
  const br = awake ? ['#fff0a8', '#e0a830', '#9a6a14'] : ['#d8b860', '#a8842c', '#6a4e14'];
  o += path('M20 82Q22 72 32 72Q42 72 44 82Q40 88 32 88Q24 88 20 82Z', t.lg(br, 60), 1, ink('#5a3a0a', .9, .85)) + path('M42 78Q54 76 52 82Q50 86 44 83Z', t.lg(br, 60), 1, ink('#5a3a0a', .8, .85)) + path('M20 78Q12 70 16 80L20 82Z', br[1], 1, ink('#5a3a0a', .8, .85)) + ell(32, 72, 6, 1.8, br[2], 1, 0, ink('#5a3a0a', .7, .85)) + ell(28, 78, 4, 1.4, '#fff', .45, -12) + circ(32, 70.6, 1.8, awake ? '#ffe6a0' : br[0]);
  if (awake) { let sm = ''; for (let i = 0; i < 5; i++) { const y = 70 - i * 11; sm += ell(32 + Math.sin(i * 1.6) * 5, y, 6 - i * .6, 5.4, i % 2 ? '#a89ae8' : '#8a7ad8', .75 - i * .1); } o += sm + ell(32, 24, 5, 6, '#c8bcf4', .55) + circ(30, 22, .8, '#fff') + circ(34, 22, .8, '#fff') + spark(20, 40, .8) + spark(46, 28, .6) + spark(40, 54, .7); }
  else o += ell(30, 78, 6, 1, '#fff', .2);
  return o;
});
// ---- gate: sandstone pylon gate (closed / open), the region gate between sub-areas ----
for (const open of [false, true]) tile('interest', 'gate-pylon', open ? 'open' : 'closed', LG, ['large', 'gate', 'interest', open ? 'open' : 'closed', 'obstacle'], (t) => {
  let o = sh(66, 114, 58, 6);
  const pyl = (x0, x1, tl) => path(`M${x0} 112L${x0 + (tl ? 3 : 5)} 38H${x1 - (tl ? 5 : 3)}L${x1} 112Z`, t.lg(tl ? ['#f4dcb0', '#dcae7c', '#b88458'] : ['#dcae7c', '#b88458', '#8a5a3a'], 0), 1, ink(D.inkS, 1.1, .85));
  o += pyl(4, 40, true) + pyl(88, 124, false);
  for (const [x0, w] of [[4, 36], [88, 36]]) { o += path(`M${x0 + 2} 38Q${x0 + w / 2} 28 ${x0 + w - 2} 38V34Q${x0 + w / 2} 24 ${x0 + 2} 34Z`, D.stone[0], 1, ink(D.inkS, .9, .85)); for (let i = 0; i < 5; i++) o += line(`M${x0 + 8 + i * 5} 44V${100 - i % 2 * 10}`, '#6b3a22', 1, .3); o += rect(x0 + 6, 56, w - 12, 3, '#2f9a9a', 0, .75) + rect(x0 + 6, 62, w - 12, 2, '#c8352b', 0, .7) + `<g stroke="#6b3a22" stroke-width="1.2" fill="none" opacity=".5" stroke-linecap="round"><path d="M${x0 + 12} 72h4M${x0 + 14} 70v5M${x0 + 22} 80q2-4 4 0M${x0 + 12} 90h12"/></g>`; }
  o += path('M36 62L40 38H88L92 62Z', t.lg(['#f4dcb0', '#dcae7c', '#b88458'], 90), 1, ink(D.inkS, 1, .85)) + path('M38 44Q64 34 90 44V40Q64 30 38 40Z', D.stone[0], 1, ink(D.inkS, .8, .85)) + circ(64, 52, 6, D.gold[1], 1, ink('#7a5a14', .9, .85)) + path('M56 54Q64 44 72 54Q64 50 56 54Z', '#3fb0ac', 1, ink('#1f4a56', .6, .8)) + line('M36 62H92', D.stone[2], 1.4, .5);
  if (!open) {
    o += path('M42 112V70Q42 62 64 62Q86 62 86 70V112Z', '#2a1810', 1) + path('M44 112V72Q44 65 63 64V112Z', t.lg(D.wood, 0), 1, ink(D.inkB, 1, .85)) + path('M65 64Q84 65 84 72V112H65Z', t.lg([D.wood[1], D.wood[2], '#3a2412'], 0), 1, ink(D.inkB, 1, .85));
    for (const y of [74, 90, 104]) o += rect(44, y, 40, 2.4, '#5a4020', 0, .6);
    for (const [x, y] of [[52, 80], [58, 96], [72, 80], [78, 96], [52, 98], [76, 106]]) o += circ(x, y, 1.1, D.gold[1], 1, ink('#5a3a0a', .4, .8));
    o += line('M64 64V112', '#2a1810', 1.8, .9) + circ(60, 90, 1.8, D.gold[1], 1, ink('#5a3a0a', .5, .8)) + circ(68, 90, 1.8, D.gold[1], 1, ink('#5a3a0a', .5, .8));
  } else {
    o += path('M42 112V70Q42 62 64 62Q86 62 86 70V112Z', t.lg(['#1a1008', '#4a3420', '#c8a060'], 90), 1, ink(D.inkB, 1, .85)) + ell(64, 112, 20, 3, '#e8c98c', .9) + path('M42 112L36 72L44 70L48 108Z', D.wood[1], 1, ink(D.inkB, .9, .85)) + path('M86 112L92 72L84 70L80 108Z', D.wood[2], 1, ink(D.inkB, .9, .85)) + ell(64, 74, 6, 3, '#e8c98c', .35);
  }
  return o + [[12, 112], [118, 114], [30, 116]].map(([x, y]) => pebbleD(x, y, .7, D.stone)).join('') + `<path d="M6 40L2 34M122 40L126 34" stroke="${D.wood[2]}" stroke-width="2"/>`;
});
// ---- secret cache (cell): hidden / revealed ----
tile('interest', 'sand-cache', 'hidden', C, ['interest', 'cache', 'hidden', 'secret'], (t) => ell(34, 50, 16, 4, '#a8783c', .14) + path('M14 50Q20 38 32 38Q46 38 52 50Q32 54 14 50Z', t.lg(['#fbeec6', '#e8c98c', '#c4a064'], 60), 1) + ell(28, 42, 6, 1.6, '#fffaf0', .6, -10) + pebbleD(44, 46, .5, D.stone) + spark(32, 34, .8));
tile('interest', 'sand-cache', 'revealed', C, ['interest', 'cache', 'revealed', 'secret', 'loot'], (t) => ell(34, 52, 18, 4, '#3b2a14', .15) + path('M12 52Q18 36 32 36Q46 36 52 52Q32 56 12 52Z', '#e8c98c', .9) + path('M18 44H46V52H18Z', t.lg(D.stone, 90), 1, ink(D.inkS, 1, .85)) + path('M18 44L24 38H52L46 44Z', D.stone[0], 1, ink(D.inkS, .9, .85)) + path('M24 38L44 38L40 42H22Z', '#2a1a10', .85) + path('M28 34L50 26L56 32L34 40Z', t.lg(D.stone, 45), 1, ink(D.inkS, .9, .85)) + ell(32, 41, 5, 1.2, '#ffe08a', .9) + spark(34, 35, 1.1, '#fff0a8'));
// ---- sphinx (large) ----
tile('interest', 'sphinx', 'a', LG, ['large', 'monument', 'obstacle', 'interest', 'ruin'], (t) => {
  let o = sh(66, 114, 60, 6); const sg = t.lg(['#f4dcb0', '#dcae7c', '#a97a52'], 40), dg = t.lg(['#e6c08e', '#c8946a', '#8a5a3a'], 40);
  o += path('M16 112L26 104H118L124 112Z', D.stone[1], 1, ink(D.inkS, 1, .85)) + path('M16 112H124V116H16Z', D.stone[2], .6);
  o += path('M44 102Q46 76 70 72Q100 66 112 84Q120 96 116 104H44Z', sg, 1, ink(D.inkS, 1.1, .85)) + ell(98, 90, 15, 13, dg, 1, 0, ink(D.inkS, .9, .8)) + path('M112 92Q124 98 120 108', 'none', 1, { stroke: '#8a5a3a', 'stroke-width': 2.4 });
  o += path('M6 102H46L50 108H8Z', sg, 1, ink(D.inkS, 1, .85)) + path('M6 102Q4 98 10 96L24 98L26 102Z', dg, 1, ink(D.inkS, .9, .85)) + line('M10 102V96M16 102V97M22 102V98', '#6b3a22', .8, .6);
  o += path('M40 104Q38 76 44 62H66Q70 78 68 104Z', sg, 1, ink(D.inkS, 1, .85));
  // head with nemes
  o += path('M32 54Q30 30 56 26Q82 30 78 54L84 78L66 70H46L26 78Z', t.lg(['#3fb0ac', '#1f7a86', '#12505e'], 0), 1, ink('#0f3a46', 1, .85));
  for (const x of [34, 40, 72, 78]) o += line(`M${x} 44L${x - 2} 72`, '#f3c24f', 1.6, .85);
  o += path('M60 24Q56 20 56 28Q58 30 60 28Z', '#f3c24f', 1, ink('#7a5a14', .6, .8));
  o += path('M42 42Q42 30 56 30Q70 30 70 42V56Q70 66 56 68Q42 66 42 56Z', sg, 1, ink(D.inkS, 1, .85));
  o += rect(47, 43, 7, 2.2, '#3a2a1c', 1) + rect(58, 43, 7, 2.2, '#3a2a1c', 1) + line('M46 42Q50 40 54 42M58 42Q62 40 66 42', '#2a1a10', 1.2, .9) + path('M54 48Q56 54 58 48Z', D.stone[2], 1) + path('M50 58Q56 60 62 58', 'none', 1, { stroke: '#8a5a3a', 'stroke-width': 1.4 }) + path('M52 66L56 78L60 66Z', '#3fb0ac', 1, ink('#0f3a46', .6, .8)) + ell(46, 48, 3, 6, '#fff', .25);
  o += [[40, 112], [74, 116], [110, 114]].map(([x, y]) => pebbleD(x, y, .6, D.stone)).join('');
  return o;
});

// ================= overlays (transparent; each stays inside its cell) =================
const ov = (name, v, fn, tags = []) => tile('overlays', name, v, C, ['overlay', ...tags], fn);
// heat shimmer: wavy light bands over a faint warm haze, wrapped so it repeats seamlessly across cells
for (const [v, sd, n] of [['a', 71, 4], ['b', 72, 6], ['c', 73, 8]]) ov('heat-shimmer', v, (t) => {
  const r = rng(sd); let o = '';
  for (let i = 0; i < n; i++) { const y = r.range(4, 60), x = r.range(0, 64), w = r.range(22, 40), a = r.range(1.4, 2.6); o += wrapped(x, y, w, (xx, yy) => line(`M${f(xx - w / 2)} ${f(yy)}q${f(w / 8)}-${a} ${f(w / 4)} 0t${f(w / 4)} 0t${f(w / 4)} 0t${f(w / 4)} 0`, '#fff6d0', 1.2, .3 + r() * .15) + line(`M${f(xx - w / 3)} ${f(yy + 3)}q${f(w / 8)}-${a} ${f(w / 4)} 0t${f(w / 4)} 0t${f(w / 4)} 0`, '#ffe9b0', 1, .22)); }
  return o + wrapped(32, 32, 30, (x, y) => ell(x, y, 30, 14, '#fff0c0', .09, -8));
}, ['shimmer', 'heat']);
// blown sand: horizontal streaks and flying grains, wrapped in x and y
for (const [v, sd, n] of [['a', 81, 5], ['b', 82, 8], ['c', 83, 12]]) ov('blown-sand', v, (t) => {
  const r = rng(sd); let o = '';
  for (let i = 0; i < n; i++) { const y = r.range(2, 62), x = r.range(0, 64), w = r.range(14, 30); o += wrapped(x, y, w / 2 + 2, (xx, yy) => line(`M${f(xx - w / 2)} ${f(yy)}q${f(w / 4)}-1.4 ${f(w / 2)} -.4t${f(w / 2)} .6`, i % 2 ? '#f0d49a' : '#d9b676', 1.4 - i % 2 * .4, .36)); }
  for (let i = 0; i < n * 4; i++) { const x = r.range(0, 64), y = r.range(0, 64); o += wrapped(x, y, 2, (xx, yy) => circ(xx, yy, r.range(.5, 1.1), i % 3 ? '#f0d494' : '#c9a468', .65)); }
  return o + wrapped(32, 30, 28, (x, y) => ell(x, y, 28, 9, '#f0d494', .09, -6));
}, ['sand', 'wind']);
// dune shadow: soft diagonal bands of cool shade (lee of a dune), for laying over sand
for (const [v, k] of [['a', 1], ['b', 2], ['c', 3]]) ov('dune-shadow', v, (t) => {   // soft fading bands (alpha gradients), so no hard cell edge shows
  const g = (a) => t.rg(['#6a3a2a', '#7a4a34', '#8a5a40'], .5, .5, .5, [a, a * .55, 0]);
  if (k === 1) return ell(32, 38, 31, 14, g(.34), 1, -14) + ell(34, 24, 26, 8, g(.2), 1, -14);
  if (k === 2) return ell(30, 26, 30, 11, g(.3), 1, 12) + ell(36, 46, 24, 9, g(.26), 1, 12) + path('M8 20Q30 10 56 22', 'none', 1, { stroke: '#fff3d0', 'stroke-width': 1.4, 'stroke-opacity': .3 });
  return ell(32, 34, 14, 30, g(.32), 1, 24) + ell(22, 30, 8, 24, g(.2), 1, 24);
}, ['shadow', 'dune']);
ov('dust-devil', 'a', (t) => { let o = ell(34, 54, 14, 3.4, '#a8783c', .16); for (let i = 0; i < 7; i++) { const y = 50 - i * 6.4, w = 5 + i * 1.7, x = 32 + Math.sin(i * 1.2) * 4; o += ell(x, y, w, 3, i % 2 ? '#e8c98c' : '#f4dcb0', .5 + i * .04, Math.sin(i) * 8, ink('#c9a468', .6, .35)); } return o + [[18, 20], [46, 14], [50, 34], [14, 40]].map(([x, y]) => circ(x, y, 1, '#e8c98c', .8)).join(''); }, ['dust']);
ov('sun-glare', 'a', (t) => circ(10, 8, 40, t.rg(['#fff6d0', '#ffe9a8', '#ffe9a8'], .5, .5, .5, [.55, .2, 0])) + path('M0 0L64 40L64 46L0 6Z', '#fff6d0', .12), ['light', 'sun']);
