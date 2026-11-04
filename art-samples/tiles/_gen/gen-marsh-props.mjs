// Firefly Marsh objects, part 2: boats, stumps, lanterns, wisps, frogs, herons, shrine pieces, props.
import { T, P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, sh, trunk, scat, sparkle, glowC, mush, blobPath, bloom } from './sub.mjs';
import { mossBlob } from './ruins-lib.mjs';
import { pad, cattailS, reedS, blade, wcontact, mixc } from './marsh-lib.mjs';
import { ring } from './water-lib.mjs';
import { prop, R, ST, ln, MS } from './marsh-kit.mjs';

const WD = ['#b59a74', '#8a6a44', '#5e4630'], iw = ink('#3a2418', .9, .8);
const water = (cx, cy, rx) => wcontact(cx, cy, rx);
const moss = (x, y, w, h = w * .5, s = 1) => mossBlob(x, y, w, h, s);
const gl = (t, x, y, r, c1 = '#ffe6a0', c2 = '#ffc45a', a = .8) => glowC(t, x, y, r, c1, c2, a);

// ---- sunken boats ----
function boat(t, v) {
  const g = t.lg(['#b09670', '#7a5e40', '#4a3624'], 90), gi = t.lg(['#5e4630', '#3a2a1c'], 90);
  t.add(water(32, 44, 28));
  if (v === 'b') {   // capsized: upturned hull
    t.add(path('M6 40Q10 22 32 20Q54 22 58 40Q32 46 6 40Z', g, 1, iw), ...[14, 22, 30, 38, 46].map(x => line(`M${x} ${24 + Math.abs(x - 32) * .25}Q${x + 1} 34 ${x} ${40 - Math.abs(x - 32) * .05}`, '#3a2418', 1, .5)), line('M32 20V42', '#3a2418', 2, .8), ell(24, 26, 8, 2, '#fff', .35, -10), moss(40, 28, 8, 3, 3), cattailS(54, 42, 18, 3, .7));
  } else if (v === 'c') {   // nearly sunk: rim and a thwart
    t.add(ell(32, 38, 26, 9, '#3a2a1c', .9, -6, ink('#2a1c10', .9, .8)), ell(32, 40, 23, 6.6, '#5f8aa0', .95, -6), ell(32, 40, 18, 4, '#3f6688', .5, -6), rect(30, 30, 5, 14, WD[1], 1, 1, iw), pad(44, 38, 5, 'pink'), pad(20, 42, 4, null), ell(24, 33, 12, 1.4, '#fff', .25, -10));
  } else {   // bow up, stern under
    t.add(`<g transform="rotate(-10 32 38)">`, path('M4 28Q10 44 32 46Q54 44 60 36Q58 46 32 50Q8 50 2 28Z', g, 1, iw), path('M4 28Q10 40 32 41Q54 40 60 36Q54 44 32 46Q10 44 4 28Z', gi, 1, iw), ...[14, 24, 34, 44].map(x => line(`M${x} 41V46`, '#3a2418', 1, .5)), rect(26, 34, 6, 9, WD[0], 1, 1, iw), path('M4 28Q2 24 6 20', 'none', 1, { fill: 'none', stroke: '#3a2418', 'stroke-width': 2 }), '</g>', ell(44, 49, 20, 3.4, '#4a7a96', .85), ell(42, 48, 16, 1.4, '#eadcea', .6), moss(18, 34, 7, 2.6, 5), cattailS(52, 50, 16, 4, .7), pad(52, 46, 4.6, null));
  }
}
for (const v of ['a', 'b', 'c']) prop('props', 'sunken-boat', v, ['boat', 'obstacle', 'water', 'wreck'], (t) => boat(t, v));
// ---- stumps in water ----
function stump(t, v) {
  const g = t.lg(['#a8886a', '#7a5e44', '#4e3a28'], 0), ik = ink('#2e2218', .9, .8), cx = 32, top = v === 'c' ? 20 : 34, by = 54;
  t.add(water(cx, by, 22));
  const w = v === 'c' ? 10 : 15;
  t.add(path(`M${cx - w - 3} ${by + 1}Q${cx - w} ${by - 4} ${cx - w + 1} ${top + 4}${v === 'b' ? `L${cx - 6} ${top - 3}L${cx - 2} ${top + 4}L${cx + 3} ${top - 6}L${cx + 6} ${top + 3}L${cx + w - 1} ${top - 1}` : `Q${cx} ${top - 4} ${cx + w - 1} ${top + 4}`}Q${cx + w} ${by - 4} ${cx + w + 3} ${by + 1}Z`, g, 1, ik));
  if (v !== 'b') t.add(ell(cx, top + 3, w - 1, 5, '#c8ae88', 1, 0, ik), ell(cx, top + 3, w - 4.4, 3, '#b0946c', 1), ell(cx, top + 3, w - 8, 1.6, '#c8ae88', 1), ell(cx - 2, top + 1.6, w * .5, 1.4, '#fff', .35));
  t.add(line(`M${cx - 5} ${by - 2}v${top - by + 12}M${cx + 4} ${by - 2}v${top - by + 14}`, '#3a2818', 1, .45), moss(cx - 6, by - 8, 8, 3.4, 11), moss(cx + 6, top + 8, 5, 2.6, 12));
  if (v === 'a') t.add(...[[16, 10], [46, 8]].map(([x, y]) => cattailS(x, by + 1, y + 10, 0, .6)), pad(48, 54, 4.4, null));
  if (v === 'c') t.add(path('M40 30q8 -3 10 2q-2 4 -10 3Z', '#e0c8a0', 1, ink('#8a6a44', .6, .8)), path('M38 40q7 -2 9 2q-2 4-9 2Z', '#e0c8a0', 1, ink('#8a6a44', .6, .8)), mush(t, 22, 36, .5, ['#f0c4d0', '#c88aa0'], { spots: false }));
}
for (const v of ['a', 'b', 'c']) prop('props', 'stump-water', v, ['stump', 'obstacle', 'water'], (t) => stump(t, v));
// ---- floating lanterns (on water, glowing) ----
function floatLantern(t, v) {
  t.add(ell(32, 46, 26, 9, '#6f93ae', .25), ring(32, 46, 22, '#eadcea', .55), ring(32, 46, 14, '#eadcea', .5));
  const col = v === 'a' ? ['#ffd890', '#e8604a'] : v === 'b' ? ['#fff6e0', '#f0a0b8'] : ['#ffe6f0', '#e870a0'];
  t.add(gl(t, 32, 38, 26, '#ffe6a0', '#ffb04a', .8), ell(32, 48, 12, 3.4, '#ffc45a', .5));
  t.add(rect(20, 44, 24, 4, t.lg(['#b59a74', '#7a5e44'], 90), 1.5, 1, iw));
  if (v === 'c') { for (const a of [-58, -30, 0, 30, 58]) t.add(`<g transform="rotate(${a} 32 44)">`, path('M32 44Q27 34 32 26Q37 34 32 44Z', t.lg([col[0], col[1]], 90), 1, ink('#a03060', .7, .8)), '</g>'); t.add(ell(32, 41, 3, 2, '#fff6c0', 1)); }
  else if (v === 'a') t.add(ell(32, 34, 10, 10, t.rg(['#fff0c0', col[0], col[1]], .5, .5, .6), 1, 0, ink('#6e1a10', .9, .85)), line('M22 34h20M32 24v20', '#8e2118', .8, .5), rect(27, 22, 10, 2.4, '#4a1410', 1), rect(27, 43, 10, 2.4, '#4a1410', 1), ell(29, 30, 2.4, 3, '#fff', .5));
  else t.add(rect(23, 24, 18, 20, t.lg([col[0], col[1]], 90), 2, 1, ink('#a03060', .9, .85)), line('M23 34h18M32 24v20', '#c8788c', .8, .6), rect(21, 22, 22, 3, '#4a1410', 1), rect(21, 43, 22, 3, '#4a1410', 1), rect(25, 26, 4, 10, '#fff', 1, .5));
}
for (const v of ['a', 'b', 'c']) prop('props', 'floating-lantern', v, ['lantern', 'lit', 'water', 'glow', 'decor'], (t) => floatLantern(t, v));
// ---- lantern pole (tall): post with crossbar and paper lanterns ----
function lanternPole(t, v) {
  const lit = v !== 'a', n = v === 'c' ? 3 : 2, cx = 32, by = 112;
  t.add(sh(34, by + 2, 12, 4));
  t.add(rect(cx - 3.4, 28, 6.8, by - 28, t.lg(['#a8886a', '#6b4a2c', '#4a3220'], 0), 1.5, 1, iw), rect(cx - 1.6, 30, 1.4, by - 34, '#fff', 0, .25), rect(cx - 5, by - 5, 10, 6, WD[2], 1, 1, iw), moss(cx - 2, by - 20, 6, 3, 8));
  t.add(rect(cx - 22, 30, 44, 4.4, t.lg(['#c0a27a', '#6b4a2c'], 90), 1.5, 1, iw), path(`M${cx - 6} 30Q${cx} 22 ${cx + 6} 30Z`, WD[1], 1, iw));
  const xs = n === 3 ? [cx - 18, cx, cx + 18] : [cx - 16, cx + 16];
  xs.forEach((x, i) => { const y = 54 + (i % 2) * 6; if (lit) t.add(gl(t, x, y + 6, 22, '#ffe6a0', '#ffb04a', .75)); t.add(line(`M${x} 34V${y - 2}`, '#3a2418', 1), rect(x - 4, y - 3, 8, 2, '#4a1410', 1), ell(x, y + 6, 7, 8.4, lit ? t.rg(['#fff0c0', '#ffc45a', '#e8604a'], .5, .5, .65) : t.lg(['#f6e6d0', '#c8b8a0'], 0), 1, 0, ink('#6e1a10', .9, .85)), line(`M${x - 6} ${y + 6}h12`, '#8e2118', .7, .5), rect(x - 3.6, y + 13, 7.2, 2, '#4a1410', 1), line(`M${x} ${y + 15}v4`, '#e8c860', 1)); });
  t.add(tuft(16, by + 2, '#5f8f4c', .8, .7), tuft(50, by + 3, '#5f8f4c', .8, .7));
  if (lit) t.add(sparkle(cx + 24, 44, .7, '#fff6c0'));
}
for (const [v, tg] of [['a', 'unlit'], ['b', 'lit'], ['c', 'lit']]) prop('props', 'lantern-pole', v, ['tall', 'obstacle', 'lantern', tg, 'marsh'], (t) => lanternPole(t, v), T, 128);
// ---- will-o-wisps ----
const WCOL = { a: ['#e8fff4', '#7fe0c0'], b: ['#e0f0ff', '#8ab4f0'], c: ['#fff0d0', '#ffb04a'], d: ['#f6e0ff', '#c08af0'] };
for (const v of ['a', 'b', 'c', 'd']) prop('props', 'will-o-wisp', v, ['wisp', 'glow', 'ambient', 'creature'], (t, r) => {
  const c = WCOL[v], x = 32, y = 30;
  t.add(ell(32, 54, 12, 3, c[1], .18), ell(32, 54, 6, 1.4, c[0], .3));
  t.add(gl(t, x, y, 26, c[0], c[1], .8));
  t.add(path(`M${x} ${y - 16}Q${x + 10} ${y - 3} ${x + 8} ${y + 4}Q${x + 6} ${y + 12} ${x} ${y + 12}Q${x - 6} ${y + 12} ${x - 8} ${y + 4}Q${x - 10} ${y - 3} ${x} ${y - 16}Z`, t.rg(['#ffffff', c[0], c[1]], .5, .65, .7), 1, ink(c[1], .8, .7)), path(`M${x + 1} ${y - 9}Q${x + 5} ${y - 1} ${x + 4} ${y + 4}Q${x + 1} ${y + 7} ${x - 1} ${y + 3}Q${x - 2} ${y - 3} ${x + 1} ${y - 9}Z`, '#fff', .75));
  if (v !== 'a') t.add(...[[-16, 14, 3], [18, 8, 2.4]].map(([dx, dy, s]) => circ(x + dx, y + dy, s * 1.6, c[0], .5) + circ(x + dx, y + dy, s * .6, '#fff', .9)));
  if (v === 'd') t.add(path(`M${x - 22} ${y + 18}Q${x - 12} ${y + 22} ${x - 8} ${y + 10}`, 'none', 1, { fill: 'none', stroke: c[0], 'stroke-width': 1.6, 'stroke-opacity': .6, 'stroke-linecap': 'round' }));
  t.add(line(`M${x - 4} ${y + 12}q-6 5 -14 4`, c[0], 1.4, .55), line(`M${x + 3} ${y + 12}q5 6 12 6`, c[0], 1.2, .45), sparkle(x + 18, y - 12, .6, c[0]), sparkle(x - 18, y - 6, .45, c[0]));
});
// ---- frogs ----
function frog(t, x, y, s, pose, col = ['#9ad06c', '#5f9a48', '#2f6a38']) {
  const g = t.rg(col, .35, .3, .8), ik = ink('#1d4a26', .8, .85); let o = ell(x + 1, y + 4 * s, 9 * s, 2.4 * s, '#2c3a40', .22);
  if (pose === 'leap') {
    o = ell(x + 6, y + 18, 9 * s, 2.4 * s, '#2c3a40', .2) + line(`M${f(x - 7 * s)} ${f(y + 5 * s)}Q${f(x - 15 * s)} ${f(y + 8 * s)} ${f(x - 18 * s)} ${f(y + 2 * s)}`, col[1], 2.4 * s, 1) + line(`M${f(x - 7 * s)} ${f(y + 5 * s)}Q${f(x - 15 * s)} ${f(y + 8 * s)} ${f(x - 18 * s)} ${f(y + 2 * s)}`, col[2], .9, .6);
    o += `<g transform="rotate(-22 ${x} ${y})">` + ell(x, y, 8 * s, 5 * s, g, 1, 0, ik) + ell(x - 1, y + 2 * s, 5 * s, 2.4 * s, '#f0f0c0', .8) + '</g>' + circ(x + 5 * s, y - 5 * s, 2.2 * s, '#b8dc84', 1, ik) + circ(x + 5.6 * s, y - 5.4 * s, 1.2 * s, '#f3c24f') + circ(x + 6 * s, y - 5.4 * s, .6 * s, '#111') + line(`M${f(x + 5 * s)} ${f(y)}l${f(8 * s)} ${f(5 * s)}`, col[1], 1.8 * s) + ell(x + 6 * s, y - 1 * s, 5 * s, 2 * s, col[1], 1, 20);
    return o;
  }
  o += ell(x - 5 * s, y + 3 * s, 4 * s, 3 * s, col[1], 1, 20, ik) + ell(x + 5 * s, y + 3 * s, 4 * s, 3 * s, col[1], 1, -20, ik);
  o += path(`M${f(x - 8 * s)} ${f(y + 3 * s)}Q${f(x - 9 * s)} ${f(y - 5 * s)} ${f(x)} ${f(y - 6 * s)}Q${f(x + 9 * s)} ${f(y - 5 * s)} ${f(x + 8 * s)} ${f(y + 3 * s)}Q${f(x)} ${f(y + 5 * s)} ${f(x - 8 * s)} ${f(y + 3 * s)}Z`, g, 1, ik);
  o += ell(x - 3 * s, y - 2 * s, 3.4 * s, 1.6 * s, '#fff', .35, -20) + circ(x + 2 * s, y - 1 * s, .9 * s, col[2], .8) + circ(x - 3 * s, y + 1 * s, .8 * s, col[2], .8) + circ(x + 4.6 * s, y + .6 * s, .8 * s, col[2], .8);
  if (pose === 'croak') o += ell(x, y - 2.6 * s, 4.6 * s, 4 * s, '#f0e8c0', .95, 0, ink('#8a7a50', .6, .8)) + line(`M${f(x - 2 * s)} ${f(y - 2 * s)}q2 3 4 0`, '#c8b078', .8);
  o += circ(x - 4.4 * s, y - 6 * s, 2.5 * s, '#b8dc84', 1, ik) + circ(x + 4.4 * s, y - 6 * s, 2.5 * s, '#b8dc84', 1, ik) + circ(x - 4.4 * s, y - 6.2 * s, 1.5 * s, '#f3c24f') + circ(x + 4.4 * s, y - 6.2 * s, 1.5 * s, '#f3c24f') + circ(x - 4.4 * s, y - 6.2 * s, .7 * s, '#111') + circ(x + 4.4 * s, y - 6.2 * s, .7 * s, '#111');
  return o + ell(x - 6 * s, y + 6 * s, 3 * s, 1.1 * s, col[2], .8) + ell(x + 6 * s, y + 6 * s, 3 * s, 1.1 * s, col[2], .8);
}
prop('props', 'frog', 'a', ['creature', 'frog', 'water', 'lily'], (t) => t.add(ell(32, 46, 26, 9, '#6f93ae', .22), pad(32, 44, 13, null), frog(t, 32, 38, 1.1, 'sit')));
prop('props', 'frog', 'b', ['creature', 'frog', 'mud', 'croak'], (t) => t.add(ell(32, 50, 20, 5, '#8a7a5e', .5), ell(32, 49, 15, 3.4, '#a89878', .55), frog(t, 32, 42, 1.3, 'croak', ['#b8a068', '#8a7040', '#4a3a20'])));
prop('props', 'frog', 'c', ['creature', 'frog', 'leaping'], (t) => t.add(frog(t, 32, 28, 1.1, 'leap')));
prop('props', 'frog', 'd', ['creature', 'frog', 'reed'], (t) => { t.add(reedS(30, 56, 46, 6, '#8ab45c', 1.8), reedS(40, 56, 40, -4, '#6e9a48', 1.5), ell(34, 56, 12, 3, '#3b3a24', .15), frog(t, 32, 32, .75, 'sit', ['#b8e084', '#7ab858', '#3f7a3c'])); });
// ---- heron silhouettes (dusk) ----
function heron(t, v) {
  const body = t.lg(['#5a6c8c', '#34405e', '#222c44'], 60), ik = ink('#141a2c', .7, .9), c = '#2a3550';
  t.add(wcontact(32, 56, 14, 3));
  const leg = (x, y0, y1, k = 0) => line(`M${x} ${y0}L${x + k} ${y1}`, '#1e2640', 1.3, 1) + line(`M${x + k} ${y1}l-3 2M${x + k} ${y1}l3 2`, '#1e2640', .9, .9);
  if (v === 'a') {         // standing, neck S-curve
    t.add(leg(30, 42, 56, -1), leg(36, 42, 56, 1), path('M18 34Q22 28 34 30Q44 32 46 40Q38 46 28 44Q20 42 18 34Z', body, 1, ik), path('M20 32Q8 30 4 38Q10 34 22 36Z', c, 1), path('M38 32Q40 20 34 14Q32 8 38 8Q44 10 40 18Q44 26 44 34Z', c, 1, ik), path('M40 8L56 12L40 12Z', '#c8a040', 1, ink('#6a5018', .5, .8)), circ(39, 9, 1, '#f3e0a0'), ell(26, 33, 6, 2, '#8a9cc0', .55, -15), line('M36 8Q30 6 28 10', '#6a7ea4', 1.2, .8));
  } else if (v === 'b') {  // wading, head down
    t.add(leg(26, 40, 56, 0), leg(33, 40, 56, 2), path('M14 32Q20 26 34 28Q46 30 46 38Q36 44 24 42Q14 40 14 32Z', body, 1, ik), path('M16 30Q6 28 4 36Q10 32 18 34Z', c, 1), path('M42 30Q48 34 46 44Q44 50 40 52', 'none', 1, { fill: 'none', stroke: c, 'stroke-width': 3.4, 'stroke-linecap': 'round' }), path('M40 52L36 62L42 56Z', '#c8a040', 1, ink('#6a5018', .5, .8)), ell(24, 31, 6, 2, '#8a9cc0', .55, -15), ring(38, 58, 8, '#eadcea', .6));
  } else {                 // one leg up, preening
    t.add(leg(32, 42, 56, 0), line('M38 44l6 -4l4 4', '#1e2640', 1.3), path('M18 30Q24 22 36 24Q48 28 48 38Q38 46 26 44Q16 40 18 30Z', body, 1, ik), path('M20 28Q8 24 4 32Q10 30 22 32Z', c, 1), path('M38 26Q44 24 46 18Q48 12 42 12Q38 14 40 20Q36 22 38 26Z', c, 1, ik), path('M42 12L36 22L40 16Z', '#c8a040', 1), ell(28, 30, 6, 2, '#8a9cc0', .55, -15), path('M26 36Q34 40 42 36', 'none', 1, { fill: 'none', stroke: '#8a9cc0', 'stroke-width': 1, 'stroke-opacity': .5 }));
  }
}
for (const v of ['a', 'b', 'c']) prop('props', 'heron-silhouette', v, ['creature', 'heron', 'silhouette', 'water', 'dusk'], (t) => heron(t, v));
// ---- stone / shrine pieces (tall) ----
function jizoM(t, v) {
  const cx = 32, by = 112, g = t.lg(['#d8d6c6', '#a4a290', '#76766a'], 0);
  t.add(sh(34, by + 2, 15, 4.5));
  t.add(path(`M${cx - 14} ${by + 1}H${cx + 14}V${by - 9}H${cx - 14}Z`, t.lg(ST, 0), 1, ln), rect(cx - 11, by - 22, 22, 13, t.lg(ST, 0), 1, 1, ln), moss(cx - 6, by - 9, 8, 3.4, 1), moss(cx + 7, by - 20, 5, 2.4, 2));
  t.add(path(`M${cx - 9} ${by - 22}Q${cx - 13} ${by - 40} ${cx - 6} ${by - 54}H${cx + 6}Q${cx + 13} ${by - 40} ${cx + 9} ${by - 22}Z`, g, 1, ln), circ(cx, by - 60, 8, g, 1, ln), ell(cx - 3, by - 63, 3, 2, '#fff', .45), line(`M${cx - 3} ${by - 60}q1.4 1.4 2.8 0M${cx + 1} ${by - 60}q1.4 1.4 2.8 0`, P.inkR, .9, .8));
  t.add(path(`M${cx - 7} ${by - 52}l14 0l0 6q-7 4 -14 0Z`, '#c8553f', .9, ink('#6e1a10', .6, .7)), moss(cx - 2, by - 66, 7, 2.6, 3));
  if (v === 'b') t.add(gl(t, cx, by - 30, 24, '#ffe6a0', '#ffc45a', .55), rect(cx - 8, by - 6, 16, 4, '#e8c870', 1, 1, ink('#8a6420', .6, .8)), ell(cx - 14, by - 3, 3, 3, '#f6a0b8', 1, 0, ink('#8e3a5a', .5, .8)), ell(cx + 15, by - 2, 3, 3, '#e8c870', 1, 0, ink('#8a6420', .5, .8)), sparkle(cx + 14, by - 54, .6, '#fff6c0'));
  else t.add(path(`M${cx + 12} ${by - 28}l10 -3l3 3`, 'none', 1, { fill: 'none' }), cattailS(cx + 20, by + 1, 20, 2, .7));
  t.add(tuft(14, by + 2, '#5f8f4c', .8, .7), tuft(52, by + 3, '#5f8f4c', .8, .7));
}
for (const v of ['a', 'b']) prop('props', 'jizo-marsh', v, ['tall', 'obstacle', 'jizo', 'shrine', v === 'b' ? 'offerings' : 'mossy'], (t) => jizoM(t, v), T, 128);
function lanternM(t, lit) {
  const cx = 32, by = 112, g = t.lg(ST, 0);
  t.add(sh(34, by + 2, 15, 4.5));
  if (lit) t.add(gl(t, cx, 82, 34, '#ffe6a0', '#ffc45a', .85));
  t.add(path(`M${cx - 13} ${by + 1}Q${cx - 13} ${by - 7} ${cx - 8} ${by - 8}H${cx + 8}Q${cx + 13} ${by - 7} ${cx + 13} ${by + 1}Z`, g, 1, ln), path(`M${cx - 4} ${by - 8}L${cx - 3.4} ${by - 28}H${cx + 3.4}L${cx + 4} ${by - 8}Z`, g, 1, ln), path(`M${cx - 12} ${by - 28}Q${cx} ${by - 33} ${cx + 12} ${by - 28}L${cx + 10} ${by - 25}Q${cx} ${by - 22} ${cx - 10} ${by - 25}Z`, g, 1, ln));
  t.add(rect(cx - 8.5, by - 44, 17, 16, lit ? t.lg(['#ffe9b0', '#ffb04a'], 90) : t.lg(['#d8d4c0', '#8f8c7a'], 0), 0, 1, ln), rect(cx - 5, by - 41, 10, 10, lit ? '#fff3c8' : '#3a463c', 1.5, 1, ink(P.inkR, .6, .7)), line(`M${cx} ${by - 41}v10M${cx - 5} ${by - 36}h10`, lit ? '#d89a3a' : '#1f2620', .8, .8));
  t.add(path(`M${cx - 20} ${by - 44}Q${cx - 6} ${by - 49} ${cx} ${by - 62}Q${cx + 6} ${by - 49} ${cx + 20} ${by - 44}Q${cx} ${by - 40} ${cx - 20} ${by - 44}Z`, t.lg(['#eeeadb', '#a09c88', '#74705e'], 60), 1, ln), circ(cx, by - 63, 3.2, g, 1, ln), moss(cx - 8, by - 49, 8, 3.4, 5), moss(cx - 8, by - 1, 7, 3, 7));
  t.add(path(`M${cx + 20} ${by - 44}v10`, 'none', 1, { fill: 'none', stroke: '#c8352b', 'stroke-width': 1.4 }), rect(cx + 18, by - 36, 4, 8, '#fffaf0', 0, 1, ink('#b8b09a', .5, .8)));
  if (lit) t.add(sparkle(cx + 15, by - 64, .8, '#fff6c0'), sparkle(cx - 15, by - 52, .55, '#fff6c0'));
  t.add(tuft(16, by + 4, '#5f8f4c', .8, .7), tuft(48, by + 4, '#5f8f4c', .8, .7));
}
for (const [v, lit] of [['a', false], ['b', true]]) prop('props', 'lantern-marsh', v, ['tall', 'obstacle', 'lantern', lit ? 'lit' : 'unlit', 'event'], (t) => lanternM(t, lit), T, 128);
function hokora(t, v) {   // small stilted shrine
  const cx = 32, by = 112, ik = iw;
  t.add(v === 'b' ? water(cx, by, 24) : sh(34, by + 2, 20, 5));
  for (const dx of [-14, 14]) t.add(rect(cx + dx - 2.4, by - 28, 4.8, 30, t.lg(['#9a7c58', '#5e4630'], 0), 1, 1, ik));
  t.add(rect(cx - 20, by - 34, 40, 6, WD[1], 1, 1, ik), rect(cx - 17, by - 62, 34, 28, t.lg(['#d8c098', '#a88a5e'], 90), 1, 1, ik), rect(cx - 6, by - 56, 12, 22, '#2a2018', 1.5, 1, ik), line(`M${cx - 6} ${by - 45}h12`, '#6b4a2c', 1, .7), circ(cx, by - 44, 1.6, '#e8c870'));
  t.add(path(`M${cx - 26} ${by - 60}Q${cx - 10} ${by - 66} ${cx} ${by - 82}Q${cx + 10} ${by - 66} ${cx + 26} ${by - 60}Q${cx} ${by - 54} ${cx - 26} ${by - 60}Z`, t.lg(['#d8c8a0', '#9a8a60', '#6a5a3c'], 60), 1, ik), path(`M${cx - 20} ${by - 61}Q${cx - 6} ${by - 65} ${cx} ${by - 76}Q${cx - 6} ${by - 63} ${cx - 20} ${by - 61}Z`, '#fff', .4), moss(cx - 10, by - 66, 9, 3, 4));
  t.add(line(`M${cx - 14} ${by - 34}q14 6 28 0`, '#f2e4b4', 2.4, 1), ...[-9, 0, 9].map(x => path(`M${cx + x - 1.6} ${by - 33}l3.2 0l-.6 6l2 -.6l-1.4 5l-3 -1.4Z`, '#fffaf0', 1, ink('#b8b09a', .6, .8))));
  if (v === 'b') t.add(gl(t, cx, by - 46, 30, '#ffe6a0', '#ffc45a', .5), cattailS(cx - 22, by + 1, 20, -2, .7), pad(cx + 22, by + 2, 5, 'pink')); else t.add(tuft(14, by + 2, '#5f8f4c', .8, .7), tuft(52, by + 3, '#5f8f4c', .8, .7));
}
for (const v of ['a', 'b']) prop('props', 'hokora-marsh', v, ['tall', 'obstacle', 'shrine', v === 'b' ? 'water' : 'land'], (t) => hokora(t, v), T, 128);
prop('props', 'signpost-marsh', 'a', ['tall', 'obstacle', 'sign'], (t) => { const cx = 32, by = 112; t.add(sh(34, by + 2, 10, 3.4), rect(cx - 3, 56, 6, by - 56, t.lg(['#a8886a', '#6b4a2c'], 0), 1.5, 1, iw), path(`M10 60L${cx - 4} 56H52L58 64L52 72H${cx - 4}L10 68Z`, t.lg(['#c8ae84', '#8a6a44'], 90), 1, iw), line('M20 64h28', '#4a3220', 1.6, .7), path(`M${cx + 4} 80L${cx - 20} 82L${cx - 24} 90L${cx - 20} 98L${cx + 4} 96Z`, t.lg(['#c8ae84', '#8a6a44'], 90), 1, iw), line('M20 90h16', '#4a3220', 1.6, .7), moss(cx - 2, by - 12, 6, 3, 9), cattailS(18, by + 1, 20, -2, .7)); }, T, 128);
// ---- small stuff ----
for (const v of ['a', 'b', 'c']) prop('props', 'pile-water', v, ['pile', 'obstacle', 'water', 'stilt'], (t, r) => { t.add(water(32, 54, 22)); const ps = v === 'a' ? [[32, 6]] : v === 'b' ? [[22, 8], [40, 4]] : [[18, 6], [32, 10], [46, 5]]; for (const [x, h] of ps) { const top = 50 - 14 - h * 1.2; t.add(rect(x - 3.4, top, 6.8, 54 - top, t.lg(['#9a7c58', '#6b4a2c', '#4a3220'], 0), 1.5, 1, iw), ell(x, top, 3.4, 1.6, '#cdb892', 1, 0, iw), ell(x - .8, top - .4, 1.4, .6, '#fff', .5), moss(x, 48, 4, 2.4, x), line(`M${x - 3.4} 40h6.8`, '#3a2418', 1, .5)); } if (v === 'c') t.add(line('M18 36Q32 40 46 34', '#a8885a', 1.4, .9)); });
prop('props', 'fish-trap', 'a', ['prop', 'water', 'fishing'], (t, r) => { t.add(water(32, 46, 24)); const g = t.lg(['#d8c08a', '#a88a52'], 0); t.add(path('M18 44Q18 26 32 26Q46 26 46 44Z', g, 1, ink('#5a4a22', .9, .85)), ...[-8, -3, 3, 8].map(x => line(`M${32 + x} 27Q${32 + x * 1.3} 36 ${32 + x * 1.5} 44`, '#8a7040', .9, .8)), ...[32, 38].map(y => line(`M${19 + (y - 26) * .1} ${y}Q32 ${y - 4} ${45 - (y - 26) * .1} ${y}`, '#6a5028', 1, .8)), ell(32, 44, 14, 3, '#3a3a2a', .7), rect(44, 36, 12, 2.4, WD[1], 1, 1, iw), ell(24, 32, 4, 2, '#fff', .35)); });
prop('props', 'net-rack', 'a', ['prop', 'obstacle', 'fishing'], (t, r) => { t.add(sh(34, 56, 24, 4)); for (const x of [12, 52]) t.add(rect(x - 2.4, 20, 4.8, 36, t.lg(['#9a7c58', '#5e4630'], 0), 1, 1, iw)); t.add(rect(10, 20, 44, 3.4, WD[1], 1, 1, iw)); for (let i = 0; i < 9; i++) t.add(line(`M${14 + i * 4.6} 23q-1 ${10 + (i % 3) * 3} 1 ${22 + (i % 2) * 6}`, '#8a8a70', 1, .85)); for (let j = 0; j < 4; j++) t.add(line(`M14 ${30 + j * 6}q18 ${3 + j} 36 ${j % 2 ? -1 : 1}`, '#8a8a70', 1, .7)); t.add(ell(44, 50, 3, 1.8, '#c8c0a8', 1, 0, ink('#6a6a58', .5, .8)), ell(20, 52, 2.4, 1.6, '#c8c0a8', 1, 0, ink('#6a6a58', .5, .8))); });
for (const v of ['a', 'b']) prop('props', 'mushroom-glow', v, ['mushroom', 'glow', 'ambient'], (t, r) => { const c = v === 'a' ? ['#bff5d8', '#5fcfa0'] : ['#e0d0ff', '#9a70e0']; t.add(ell(32, 52, 18, 4, '#3b3a24', .14), gl(t, 32, 42, 24, c[0], c[1], .55), mush(t, 24, 52, .8, c, { spots: false, glow: false }), mush(t, 38, 54, .6, c, { spots: false }), mush(t, 44, 46, .42, c, { spots: false }), sparkle(34, 22, .55, c[0])); });
prop('props', 'reed-bundle', 'a', ['prop', 'decor'], (t, r) => { t.add(ell(34, 52, 20, 4, '#3b3a24', .16)); const g = t.lg(['#e0d2a0', '#b8a468', '#8a7842'], 90); for (const [x, y, rot] of [[30, 44, -4], [34, 36, 2]]) t.add(`<g transform="rotate(${rot} ${x} ${y})">`, rect(x - 20, y - 5, 40, 10, g, 5, 1, ink('#5a4a22', .8, .8)), ...[-14, 0, 14].map(dx => rect(x + dx - 1, y - 5, 2, 10, '#6e4a2c', 0, .9)), line(`M${x - 18} ${y - 2}H${x + 18}M${x - 18} ${y + 2}H${x + 18}`, '#8a7842', .7, .6), '</g>'); });
prop('props', 'stone-frog', 'a', ['prop', 'statue', 'obstacle', 'frog'], (t, r) => { const g = t.lg(['#d8d6c6', '#a4a290', '#76766a'], 55); t.add(sh(34, 54, 16, 4), path('M14 54L16 46H48L50 54Z', t.lg(ST, 0), 1, ln), ell(32, 40, 13, 9, g, 1, 0, ln), ell(24, 46, 5, 4, g, 1, 20, ln), ell(40, 46, 5, 4, g, 1, -20, ln), circ(26, 31, 3.6, g, 1, ln), circ(38, 31, 3.6, g, 1, ln), circ(26, 31, 1.2, '#4a463c'), circ(38, 31, 1.2, '#4a463c'), line('M26 38q6 3 12 0', P.inkR, 1, .8), ell(27, 35, 3, 1.2, '#fff', .45), moss(30, 34, 6, 2.6, 5), moss(18, 52, 4, 2, 6)); });
