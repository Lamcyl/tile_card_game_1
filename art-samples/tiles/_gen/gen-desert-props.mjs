// Ashkara common: bones, jars, columns, obelisk, tents, camel caravan pieces, camp, wells, signs, adobe house.
import { T, rng, hash, f, ell, circ, rect, path, line, ink, tuft, D, tile, sh, block, pebbleD, blobPath } from './desert-lib.mjs';
import { trunkPoly } from './gen-desert-nature.mjs';

const C = [T, T], TALL = [T, 128], LG = [128, 128];
const CLAY = ['#f0b888', '#cf8a58', '#96593a'];

// ---------- bones ----------
const bone = (x, y, len, rot, w = 2.4) => `<g transform="rotate(${rot} ${x} ${y})"><rect x="${f(x - len / 2)}" y="${f(y - w / 2)}" width="${len}" height="${w}" rx="${w / 2}" fill="#f4ead2" stroke="#6b5a40" stroke-width=".7" stroke-opacity=".7"/><circle cx="${f(x - len / 2)}" cy="${f(y - w / 2)}" r="${w * .62}" fill="#f4ead2" stroke="#6b5a40" stroke-width=".6" stroke-opacity=".6"/><circle cx="${f(x - len / 2)}" cy="${f(y + w / 2)}" r="${w * .62}" fill="#f4ead2" stroke="#6b5a40" stroke-width=".6" stroke-opacity=".6"/><circle cx="${f(x + len / 2)}" cy="${f(y - w / 2)}" r="${w * .62}" fill="#f4ead2" stroke="#6b5a40" stroke-width=".6" stroke-opacity=".6"/><circle cx="${f(x + len / 2)}" cy="${f(y + w / 2)}" r="${w * .62}" fill="#f4ead2" stroke="#6b5a40" stroke-width=".6" stroke-opacity=".6"/></g>`;
const skullHorn = (t, x, y, s = 1) => sh(x + 2, y + 10 * s, 15 * s, 3.4 * s)
  + path(`M${f(x - 5 * s)} ${f(y - 3 * s)}Q${f(x - 20 * s)} ${f(y - 4 * s)} ${f(x - 20 * s)} ${f(y - 14 * s)}Q${f(x - 14 * s)} ${f(y - 8 * s)} ${f(x - 8 * s)} ${f(y - 8 * s)}Z`, '#e8dcc0', 1, ink('#6b5a40', .8, .8)) + path(`M${f(x + 5 * s)} ${f(y - 3 * s)}Q${f(x + 20 * s)} ${f(y - 4 * s)} ${f(x + 20 * s)} ${f(y - 14 * s)}Q${f(x + 14 * s)} ${f(y - 8 * s)} ${f(x + 8 * s)} ${f(y - 8 * s)}Z`, '#d8c8a8', 1, ink('#6b5a40', .8, .8))
  + path(`M${f(x - 8 * s)} ${f(y - 6 * s)}Q${f(x)} ${f(y - 11 * s)} ${f(x + 8 * s)} ${f(y - 6 * s)}Q${f(x + 8 * s)} ${f(y + 4 * s)} ${f(x + 4 * s)} ${f(y + 9 * s)}H${f(x - 4 * s)}Q${f(x - 8 * s)} ${f(y + 4 * s)} ${f(x - 8 * s)} ${f(y - 6 * s)}Z`, t.lg(D.bone, 30), 1, ink('#6b5a40', .9, .85))
  + ell(x - 4 * s, y - 1 * s, 2.3 * s, 2.8 * s, '#3a2a1c', .95) + ell(x + 4 * s, y - 1 * s, 2.3 * s, 2.8 * s, '#3a2a1c', .95) + path(`M${f(x - 1 * s)} ${f(y + 4 * s)}l${f(1 * s)} ${f(-2.4 * s)}l${f(1 * s)} ${f(2.4 * s)}Z`, '#3a2a1c', .9) + line(`M${f(x - 3 * s)} ${f(y + 8 * s)}v${f(-2 * s)}M${f(x)} ${f(y + 8 * s)}v${f(-2 * s)}M${f(x + 3 * s)} ${f(y + 8 * s)}v${f(-2 * s)}`, '#6b5a40', .8, .8);
tile('props', 'skull-horned', 'a', C, ['decor', 'bones'], (t) => skullHorn(t, 32, 38, 1.1));
tile('props', 'skull-camel', 'a', C, ['decor', 'bones'], (t) => sh(36, 46, 17, 3.4) + path('M10 40Q12 32 22 31Q34 28 44 34Q50 38 52 44Q44 46 34 45Q20 47 12 44Z', t.lg(D.bone, 30), 1, ink('#6b5a40', .9, .85)) + ell(36, 36, 3, 2.4, '#3a2a1c', .95) + circ(14, 41, 1, '#3a2a1c') + line('M16 44l1-3M20 45l1-3M24 45l1-3', '#6b5a40', .9, .8) + bone(30, 48, 12, 10, 2));
tile('props', 'bones-ribcage', 'a', C, ['decor', 'bones'], (t) => { let o = sh(34, 48, 20, 4) + line('M10 40Q30 36 54 42', '#6b5a40', 3.6, .85) + line('M10 40Q30 36 54 42', '#f4ead2', 2.4, 1); for (let i = 0; i < 6; i++) { const x = 17 + i * 6.4, y = 39 + Math.sin(i * .5) * 1.6; o += line(`M${f(x)} ${f(y)}q${f(-2 - i * .3)} ${f(10 - Math.abs(i - 2.5) * 1.2)} ${f(5)} ${f(11 - Math.abs(i - 2.5))}`, '#6b5a40', 2.8, .85) + line(`M${f(x)} ${f(y)}q${f(-2 - i * .3)} ${f(10 - Math.abs(i - 2.5) * 1.2)} ${f(5)} ${f(11 - Math.abs(i - 2.5))}`, '#f4ead2', 1.6, 1); } return o; });
tile('props', 'bones-pile', 'a', C, ['decor', 'bones'], (t) => sh(34, 46, 17, 3.6) + bone(30, 44, 22, -8) + bone(36, 40, 20, 24) + bone(26, 38, 18, 62) + bone(38, 46, 16, -30) + ell(24, 33, 5, 4, '#f4ead2', 1, 0, ink('#6b5a40', .7, .8)) + ell(22.6, 32.6, 1.2, 1.4, '#3a2a1c') + ell(25.6, 33, 1.2, 1.4, '#3a2a1c'));
tile('props', 'bones-lying', 'a', C, ['decor', 'bones', 'obstacle'], (t) => sh(34, 48, 22, 4) + skullHorn(t, 18, 38, .7).replace(/<ellipse[^>]*#3b3a24[^>]*>/g, '') + bone(36, 46, 28, 3) + bone(40, 40, 24, -6, 2) + [0, 1, 2, 3].map(i => line(`M${30 + i * 6} 44q2 -8 6 -6`, '#6b5a40', 2.4, .85) + line(`M${30 + i * 6} 44q2 -8 6 -6`, '#f4ead2', 1.3, 1)).join(''));

// ---------- jars ----------
function jar(t, x, y0, h, wb, wn, ww, { band = true, lid = false, handles = false, tilt = 0, cols = CLAY, pat = '#2f9a9a' } = {}) {
  const d = `M${f(x - ww)} ${f(y0)}Q${f(x - wb)} ${f(y0 - h * .08)} ${f(x - wb)} ${f(y0 - h * .38)}Q${f(x - wb)} ${f(y0 - h * .68)} ${f(x - wn)} ${f(y0 - h * .8)}L${f(x - wn)} ${f(y0 - h)}H${f(x + wn)}L${f(x + wn)} ${f(y0 - h * .8)}Q${f(x + wb)} ${f(y0 - h * .68)} ${f(x + wb)} ${f(y0 - h * .38)}Q${f(x + wb)} ${f(y0 - h * .08)} ${f(x + ww)} ${f(y0)}Z`;
  let o = `<g${tilt ? ` transform="rotate(${tilt} ${x} ${y0})"` : ''}>`; const id = t.clip(d);
  if (handles) o += path(`M${f(x - wn)} ${f(y0 - h * .88)}q${f(-wb * .9)} ${f(-1)} ${f(-wb * .75)} ${f(h * .3)}`, 'none', 1, { stroke: cols[2], 'stroke-width': 2.4 }) + path(`M${f(x + wn)} ${f(y0 - h * .88)}q${f(wb * .9)} ${f(-1)} ${f(wb * .75)} ${f(h * .3)}`, 'none', 1, { stroke: cols[2], 'stroke-width': 2.4 });
  o += path(d, t.lg(cols, 0), 1, ink('#5a2e1a', .9, .85));
  o += `<g clip-path="${id}">`;
  if (band) o += rect(x - wb - 1, y0 - h * .52, wb * 2 + 2, h * .13, pat, 0, .9) + rect(x - wb - 1, y0 - h * .36, wb * 2 + 2, h * .05, '#fff6e0', 0, .9) + line(`M${f(x - wb)} ${f(y0 - h * .55)}l2 -2l2 2l2 -2l2 2l2 -2l2 2l2 -2l2 2l2 -2l2 2l2 -2l2 2`, '#fff6e0', .8, .8);
  o += ell(x - wb * .4, y0 - h * .55, wb * .18, h * .26, '#fff', .28) + rect(x + wb * .35, y0 - h, wb, h, '#3b1e0e', 0, .16) + '</g>';
  o += ell(x, y0 - h, wn + .8, 1.7, '#7a4a2c', 1, 0, ink('#5a2e1a', .8, .8)) + ell(x, y0 - h + .2, wn - .6, 1, '#2a1a10', .9);
  if (lid) o += ell(x, y0 - h - 1, wn + 2, 2.4, cols[1], 1, 0, ink('#5a2e1a', .8, .8)) + circ(x, y0 - h - 3.6, 1.6, cols[2]);
  return o + '</g>';
}
tile('props', 'jar-clay', 'a', C, ['decor', 'pot', 'obstacle'], (t) => sh(34, 52, 12, 3.6) + jar(t, 32, 52, 34, 10, 4, 6, { handles: true }));
tile('props', 'jar-clay', 'b', C, ['decor', 'pot', 'obstacle'], (t) => sh(34, 52, 15, 4) + jar(t, 32, 52, 22, 14, 7, 8, { lid: true, pat: '#c8352b' }));
tile('props', 'jar-clay', 'c', C, ['decor', 'pot'], (t) => sh(34, 52, 17, 4) + jar(t, 24, 52, 24, 8, 4, 5, { band: true, pat: '#c8a02a' }) + jar(t, 42, 52, 18, 8, 5, 5, { band: false, lid: true }) + jar(t, 34, 54, 14, 6, 3, 4, { band: false }));
tile('props', 'jar-clay', 'd', C, ['decor', 'pot', 'fallen'], (t) => sh(34, 50, 18, 4) + jar(t, 30, 50, 28, 10, 4, 6, { handles: true, tilt: 78 }) + ell(46, 49, 4, 1.6, '#e8c98c', .8) + pebbleD(18, 50, .5, D.stone));
tile('props', 'jar-broken', 'a', C, ['decor', 'pot', 'broken'], (t) => sh(34, 50, 15, 4) + path('M20 50L19 36L24 38L27 31L31 40L36 34L40 42L45 38L44 50Z', t.lg(CLAY, 0), 1, ink('#5a2e1a', .9, .85)) + rect(20, 42, 24, 4, '#2f9a9a', 0, .85) + path('M46 52l5-3l3 3l-4 2Z', CLAY[1], 1, ink('#5a2e1a', .7, .8)) + path('M12 52l4-2l3 3l-5 1Z', CLAY[2], 1, ink('#5a2e1a', .7, .8)) + ell(32, 38, 8, 2, '#2a1a10', .8));
tile('props', 'basket-woven', 'a', C, ['decor', 'basket'], (t) => { let o = sh(34, 52, 15, 4) + path('M16 36Q18 52 32 52Q46 52 48 36Z', t.lg(['#e8c070', '#c89a48', '#9a6e2c'], 30), 1, ink('#5a3a14', .9, .8)) + ell(32, 36, 16, 3.6, '#7a5226', 1, 0, ink('#5a3a14', .9, .8)); for (let i = 0; i < 4; i++) o += line(`M${18 + i * 1.2} ${39 + i * 3.4}Q32 ${43 + i * 3.4} ${46 - i * 1.2} ${39 + i * 3.4}`, '#7a5226', .9, .6); for (const [x, y, c] of [[26, 34, '#e0883a'], [34, 33, '#d86a2a'], [31, 35, '#f0a850']]) o += circ(x, y, 3.4, c, 1, ink('#6a3a14', .5, .7)) + circ(x - 1, y - 1, 1, '#fff', .5); return o; });

// ---------- columns, obelisk ----------
function column(t, { h = 64, broken = false, seed = 1 }) {
  const rr = rng(seed), top = 104 - h; let o = sh(36, 113, 18, 4.5);
  o += block(t, 18, 104, 28, 8, D.stone[0], D.stone, 5);
  const shaft = broken ? `M24 104L24 ${top + 6}L27 ${top}L30 ${top + 7}L35 ${top - 3}L39 ${top + 5}L41 ${top + 2}L41 104Z` : `M24 104L24 ${top + 8}H41L41 104Z`;
  o += path(shaft, t.lg(D.stone, 0), 1, ink(D.inkS, .9, .8));
  for (const x of [28, 32, 36]) o += line(`M${x} 102V${top + (broken ? 8 : 10)}`, D.stone[2], .8, .4);
  if (!broken) {
    o += rect(24, top + 12, 17, 3, '#2f9a9a', 0, .8) + rect(24, top + 17, 17, 2, '#c8352b', 0, .7);
    o += path(`M22 ${top + 8}Q20 ${top + 2} 25 ${top - 2}Q32 ${top - 6} 39 ${top - 2}Q44 ${top + 2} 42 ${top + 8}Z`, t.lg(['#f8e2b8', '#dcae7c', '#b0825a'], 20), 1, ink(D.inkS, .9, .8));
    o += line(`M26 ${top + 7}Q27 ${top + 1} 28 ${top - 2}M32 ${top + 7}V${top - 4}M38 ${top + 7}Q37 ${top + 1} 36 ${top - 2}`, D.stone[2], .8, .5);
    o += block(t, 19, top - 2, 26, 5, D.stone[0], D.stone, 4);
  } else {
    o += [[44, 108, 5], [14, 110, 3.6], [50, 112, 4]].map(([x, y, s]) => pebbleD(x, y, s / 4 + .3, D.stone)).join('') + ell(34, 105, 14, 2.2, '#e8c98c', .6);
    o += line(`M24 ${top + 6}L27 ${top + 1}`, '#fff6e0', .8, .6);
  }
  return o;
}
tile('props', 'column-standing', 'a', TALL, ['tall', 'ruin', 'obstacle'], (t) => column(t, { h: 70 }));
tile('props', 'column-standing', 'b', TALL, ['tall', 'ruin', 'obstacle'], (t) => column(t, { h: 52, broken: true }));
tile('props', 'column-toppled', 'a', C, ['ruin', 'obstacle'], (t) => sh(36, 52, 24, 4.5) + block(t, 8, 50, 14, 2, D.stone[0], D.stone, 3) + `<rect x="8" y="34" width="46" height="16" rx="3" fill="${t.lg(D.stone, 90)}" stroke="${D.inkS}" stroke-width=".9" stroke-opacity=".8"/>` + [18, 30, 42].map(x => line(`M${x} 35v14`, D.stone[2], 1, .4)).join('') + ell(55, 42, 3.4, 8, D.stone[1], 1, 0, ink(D.inkS, .9, .8)) + ell(55, 42, 1.8, 5, D.stone[2], .6) + rect(8, 38, 6, 3, '#2f9a9a', 0, .8) + pebbleD(24, 54, .5, D.stone));
tile('props', 'column-stump', 'a', C, ['ruin', 'obstacle'], (t) => sh(34, 52, 16, 4) + block(t, 16, 50, 30, 5, D.stone[0], D.stone, 4) + path('M21 46L21 33L24 31L28 34L33 29L38 34L42 32L42 46Z', t.lg(D.stone, 0), 1, ink(D.inkS, .9, .8)) + line('M27 44V35M33 44V32M38 44V35', D.stone[2], .8, .4) + pebbleD(48, 54, .6, D.stone));
tile('props', 'obelisk', 'a', TALL, ['tall', 'ruin', 'obstacle', 'monument'], (t) => {
  let o = sh(36, 114, 18, 5) + block(t, 14, 112, 36, 7, D.stone[0], D.stone, 5);
  o += path('M21 106L25 28L39 28L43 106Z', t.lg(['#e8c28e', '#c8946a', '#8a5a3a'], 0), 1, ink(D.inkS, 1, .85)) + path('M39 28L43 106L45 104L41 30Z', D.stone[2], .8);
  o += path('M25 28L32 12L39 28Z', t.lg(D.gold, 45), 1, ink('#7a5a14', .9, .85)) + line('M32 12L32 28', '#fff0a8', .8, .6);
  const rr = rng(7); for (let i = 0; i < 6; i++) { const y = 38 + i * 11; o += `<g stroke="#6b3a22" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"><path d="M${28 + (i % 2)} ${y}h4M${33} ${y - 3}v6M${28} ${y + 4}q2 -3 4 0"/></g>`; }
  return o + rect(22, 100, 20, 2, '#2f9a9a', 0, .7);
});

// ---------- tents ----------
tile('props', 'tent-bedouin', 'a', LG, ['large', 'tent', 'obstacle', 'camp'], (t) => {
  const cl = ['#7a6450', '#54402f', '#33261c']; let o = sh(66, 114, 58, 7);
  o += path('M10 108L26 52Q64 34 112 54L120 108Z', t.lg(cl, 0), 1, ink('#241810', 1.1, .85));
  for (let i = 0; i < 6; i++) o += path(`M${24 + i * 16} 50Q${28 + i * 16} 80 ${14 + i * 18} 108`, 'none', 1, { stroke: '#d8c8a0', 'stroke-width': 1.6, 'stroke-opacity': .4 });
  o += path('M10 108L26 52Q64 34 112 54', 'none', 1, { stroke: '#a08868', 'stroke-width': 2, 'stroke-opacity': .5 });
  o += path('M44 108L50 70Q66 62 82 72L88 108Z', '#1c130c', .95) + path('M48 108L53 74Q66 68 79 76L84 108Z', '#3a2a1c', .9) + path('M40 108L48 84Q66 76 84 86L96 108Z', '#b8402e', .9, ink('#5a1a14', .8, .8)) + path('M46 108L52 90Q66 84 80 92L88 108Z', '#d88a3a', .5);
  o += rect(24, 50, 3, 58, D.wood[1], 0, 1) + rect(98, 52, 3, 56, D.wood[2], 0, 1) + line('M26 52L12 108M100 54L118 108', '#2a1c12', 1.4, .8) + path('M12 106Q40 112 66 108T120 106', 'none', 1, { stroke: '#2a1c12', 'stroke-width': 1.5, 'stroke-opacity': .5 });
  return o + ell(94, 109, 7, 2.6, '#c8352b', .9) + ell(100, 110, 4, 2, '#e8c070', .9);
});
tile('props', 'tent-striped', 'a', LG, ['large', 'tent', 'obstacle', 'camp'], (t) => {
  let o = sh(66, 114, 52, 7); const cx = 64, ids = [];
  const stripes = ['#f4e8cc', '#c8352b'];
  const tri = (x0, x1, c) => path(`M${f(cx)} 20L${f(x0)} 98L${f(x1)} 98Z`, c, 1);
  const xs = [14, 32, 50, 64, 78, 96, 114];
  for (let i = 0; i < 6; i++) o += tri(xs[i], xs[i + 1], stripes[i % 2]);
  o += path(`M${cx} 20L114 98L64 98Z`, '#3b1e0e', .16) + path(`M${cx} 20L14 98L32 98L${cx} 20Z`, '#fff', .16);
  o += path(`M${cx} 20L14 98L114 98Z`, 'none', 1, ink('#5a1a14', 1.1, .85));
  let v = ''; for (let i = 0; i < 6; i++) v += `Q${f(xs[i] + 9)} 108 ${xs[i + 1]} 98`; o += path(`M14 98${v}L114 98Z`, '#c8352b', 1, ink('#5a1a14', .9, .85)); for (let i = 0; i < 6; i += 2) o += path(`M${xs[i]} 98Q${xs[i] + 9} 108 ${xs[i + 1]} 98Z`, '#f4e8cc', 1);
  o += path('M52 108L58 70Q64 64 70 70L76 108Z', '#2a1810', .95) + path('M56 108L60 76Q64 72 68 76L72 108Z', '#7a4a2a', .8);
  o += line(`M${cx} 20V8`, D.wood[2], 2, 1) + path(`M${cx} 8L${cx + 14} 12L${cx} 16Z`, '#2f9a9a', 1, ink('#1f4a56', .7, .8)) + circ(cx, 20, 3, D.gold[1], 1, ink('#7a5a14', .8, .8));
  return o;
});
tile('props', 'tent-small', 'a', C, ['tent', 'obstacle', 'camp'], (t) => sh(36, 54, 24, 4.5) + path('M8 52L32 14L56 52Z', '#e8d8b0', 1, ink('#6b5a3a', 1, .85)) + path('M32 14L56 52L40 52Z', '#b8a278', .7) + path('M26 52L32 32L38 52Z', '#2a1c12', .95) + line('M32 14L32 8', D.wood[2], 1.6) + path('M8 52L32 14L20 52Z', '#fff', .25));

// ---------- camels ----------
function camel(t, { pose = 'stand', load = false, seed = 1 }) {
  const rr = rng(seed), col = ['#f0d09a', '#d0a468', '#9a6e3c'], kn = pose === 'kneel', by = kn ? 40 : 34;
  let o = sh(36, 54, 22, 4.2);
  const leg = (x, c) => kn ? ell(x, 50, 6, 2.4, c, 1, 0, ink('#5a3a1a', .8, .8)) : path(`M${x - 2.2} ${by + 4}L${x - 1.4} 50L${x + 1.6} 50L${x + 2.4} ${by + 4}Z`, c, 1, ink('#5a3a1a', .8, .8)) + ell(x, 51, 2.6, 1.3, '#4a2e14');
  o += leg(28, '#b88a50') + leg(47, '#b88a50');
  o += path(`M52 ${by - 4}q4 4 2 12`, 'none', 1, { stroke: '#7a5a2c', 'stroke-width': 1.6 });
  const nk = trunkPoly(23, by - 2, 16, by - 12, 14, 16, 4.6, 2.6);
  o += path(nk.d, t.lg(col, 90), 1, ink('#5a3a1a', .9, .85));
  o += ell(36, by, 15, 8, t.lg(col, 90), 1, 0, ink('#5a3a1a', .9, .85)) + ell(37, by + 3, 11, 4, '#8a5a2c', .25);
  o += ell(36, by - 8, 5.4, 5.6, t.lg(col, 70), 1, 0, ink('#5a3a1a', .9, .85)) + ell(34, by - 11, 2, 2, '#fff6e0', .5);
  o += leg(24, col[1]) + leg(43, col[1]);
  o += ell(10, 15, 5.4, 3.2, col[1], 1, 22, ink('#5a3a1a', .9, .85)) + ell(6.4, 17.6, 3.2, 2.2, '#c89a60', 1, 18, ink('#5a3a1a', .7, .8)) + ell(12, 11.6, 1.2, 2, col[2], 1, -20) + circ(10.6, 14, .8, '#2a1a10') + circ(5, 18, .4, '#2a1a10');
  if (load) o += path(`M26 ${by - 6}Q36 ${by - 18} 46 ${by - 6}V${by + 3}H26Z`, '#b8402e', .96, ink('#5a1a14', .9, .85)) + rect(26, by - 2, 20, 2.4, '#f0c870', 0, .9) + ell(24, by + 6, 4.4, 6.4, '#c89a48', 1, 0, ink('#5a3a14', .9, .8)) + ell(48, by + 6, 4.4, 6.4, '#b88a38', 1, 0, ink('#5a3a14', .9, .8)) + path(`M31 ${by - 12}q5 -6 11 0Z`, '#e8c070', 1, ink('#5a3a14', .8, .8)) + line(`M24 ${by - 1}v-3M48 ${by - 1}v-3`, '#5a3a14', 1);
  return o;
}
tile('props', 'camel', 'a', C, ['creature-prop', 'caravan', 'obstacle'], (t) => camel(t, { pose: 'stand' }));
tile('props', 'camel', 'b', C, ['creature-prop', 'caravan', 'obstacle'], (t) => camel(t, { pose: 'kneel', load: true }));
tile('props', 'camel', 'c', C, ['creature-prop', 'caravan', 'obstacle'], (t) => camel(t, { pose: 'stand', load: true }));
function bales(t, kind) {
  let o = sh(34, 52, 21, 4.5);
  const bale = (x, y, w, h, c) => rect(x, y, w, h, t.lg(c, 60), 6, 1, ink('#5a3a14', .9, .8)) + line(`M${x + w * .3} ${y + 1}v${h - 2}M${x + w * .7} ${y + 1}v${h - 2}`, '#5a3a14', .8, .5) + line(`M${x + 2} ${y + h * .4}h${w - 4}`, '#8a6a30', .8, .5) + ell(x + w * .3, y + h * .2, w * .18, h * .1, '#fff', .35);
  const crate = (x, y, w, h) => rect(x, y, w, h, t.lg(D.wood, 60), 1, 1, ink(D.inkB, .9, .8)) + line(`M${x} ${y}L${x + w} ${y + h}M${x + w} ${y}L${x} ${y + h}`, D.wood[2], 1.1, .6) + rect(x, y + h * .45, w, 2, D.wood[2], 0, .25) + rect(x, y, w, 2, '#e0b87a', 0, .55);
  if (kind === 'a') o += bale(10, 34, 22, 18, ['#f0d898', '#c8a458', '#8a6a30']) + bale(30, 36, 24, 16, ['#e8c888', '#bf9648', '#80602a']) + bale(18, 20, 24, 16, ['#f4e0a8', '#d0ac5c', '#9a7a38']) + `<path d="M42 28q6 -3 8 4" stroke="#5a3a14" fill="none" stroke-width="1.2"/>`;
  else o += crate(10, 34, 20, 18) + crate(30, 36, 22, 16) + crate(18, 20, 20, 16) + bale(40, 22, 14, 14, ['#c8603a', '#a03a2a', '#6a2018']);
  return o;
}
tile('props', 'cargo', 'a', C, ['caravan', 'obstacle', 'loot'], (t) => bales(t, 'a'));
tile('props', 'cargo', 'b', C, ['caravan', 'obstacle'], (t) => bales(t, 'b'));
tile('props', 'water-skins', 'a', C, ['caravan', 'decor'], (t) => { let o = sh(34, 52, 18, 4); for (const [x, y, s, rot] of [[22, 44, 1, -8], [40, 42, .9, 10]]) o += `<g transform="rotate(${rot} ${x} ${y})">` + path(`M${x - 8 * s} ${y + 6}Q${x - 10 * s} ${y - 10 * s} ${x - 2 * s} ${y - 14 * s}Q${x} ${y - 18 * s} ${x + 2 * s} ${y - 14 * s}Q${x + 10 * s} ${y - 10 * s} ${x + 8 * s} ${y + 6}Q${x} ${y + 9} ${x - 8 * s} ${y + 6}Z`, t.lg(['#d8a868', '#b07a40', '#7a4e24'], 45), 1, ink('#4a2a10', .9, .85)) + ell(x - 3 * s, y - 4, 2, 5, '#fff', .3) + rect(x - 1.6, y - 20 * s, 3.2, 6 * s, '#7a4e24', 1, 1, ink('#4a2a10', .8, .8)) + line(`M${x - 6 * s} ${y - 2}q6 5 12 0`, '#4a2a10', .9, .6) + '</g>'; return o; });
tile('props', 'tea-rug', 'a', C, ['decor', 'caravan', 'camp'], (t) => path('M8 46L16 24H56L52 46Z', t.lg(D.rug, 45), 1, ink('#4a1014', .9, .85)) + path('M13 42L19 28H52L49 42Z', 'none', 1, { stroke: '#f0c870', 'stroke-width': 1.2, 'stroke-opacity': .8 }) + `<g fill="#f0c870" opacity=".85"><path d="M30 35l3-3l3 3l-3 3Z"/><circle cx="22" cy="35" r="1.2"/><circle cx="44" cy="35" r="1.2"/></g>` + sh(32, 38, 6, 2) + path('M27 38Q27 30 32 30Q37 30 37 38Z', t.lg(['#fff0a8', '#e0a830', '#9a6a14'], 30), 1, ink('#5a3a0a', .8, .85)) + rect(30.6, 27, 2.8, 3.4, '#e0a830', 1, 1, ink('#5a3a0a', .6, .8)) + path('M37 32q5 -1 4 4', 'none', 1, { stroke: '#c8901c', 'stroke-width': 1.4 }) + [[22, 41], [43, 41]].map(([x, y]) => ell(x, y + 2, 3, 1.2, '#3b2a14', .15) + path(`M${x - 2} ${y - 3}L${x + 2} ${y - 3}L${x + 1.4} ${y + 1.4}H${x - 1.4}Z`, '#e8f4f0', .85, ink('#6b7a78', .6, .8)) + rect(x - 1.6, y - 1.6, 3.2, 1.6, '#c8352b', 0, .8)).join(''));
tile('props', 'campfire', 'unlit', C, ['camp', 'unlit'], (t) => sh(34, 52, 18, 4) + [0, 1, 2, 3, 4, 5, 6].map(i => pebbleD(32 + Math.cos(i * .9) * 14, 46 + Math.sin(i * .9) * 5, .8, D.stone)).join('') + ell(32, 46, 9, 3.4, '#4a3a2c', .9) + path('M22 48L40 40L42 43L24 51Z', '#4a3220', 1, ink('#2a1a10', .8, .8)) + path('M24 40L42 48L40 51L22 43Z', '#5a3c24', 1, ink('#2a1a10', .8, .8)) + ell(32, 45, 5, 2, '#8a8478', .5));
tile('props', 'campfire', 'lit', C, ['camp', 'lit', 'light'], (t) => sh(34, 52, 18, 4) + circ(32, 38, 22, t.rg(['#ffe6a0', '#ffc45a', '#ffc45a'], .5, .5, .5, [.5, .18, 0])) + [0, 1, 2, 3, 4, 5, 6].map(i => pebbleD(32 + Math.cos(i * .9) * 14, 46 + Math.sin(i * .9) * 5, .8, D.stone)).join('') + path('M22 48L40 40L42 43L24 51Z', '#4a3220', 1, ink('#2a1a10', .8, .8)) + path('M24 40L42 48L40 51L22 43Z', '#5a3c24', 1, ink('#2a1a10', .8, .8)) + path('M24 46Q22 36 29 30Q28 38 33 26Q40 36 40 46Q32 50 24 46Z', t.lg(['#ffe08a', '#f08a30', '#c8352b'], 90), 1, ink('#8e2118', .6, .6)) + path('M28 46Q27 40 31 36Q32 41 35 34Q38 41 36 46Z', '#fff0a8', .9));

// ---------- water: well, shaduf ----------
tile('props', 'well-stone', 'a', C, ['well', 'obstacle', 'water'], (t) => {
  let o = sh(36, 54, 22, 5) + rect(14, 38, 4, 14, D.wood[1], 0, 1, ink(D.inkB, .8, .8)) + rect(46, 38, 4, 14, D.wood[2], 0, 1, ink(D.inkB, .8, .8));
  o += path('M12 44Q12 54 32 54Q52 54 52 44Z', t.lg(D.stone, 60), 1, ink(D.inkS, 1, .85)) + ell(32, 44, 20, 8, D.stone[0], 1, 0, ink(D.inkS, 1, .85)) + ell(32, 44.4, 15, 5.4, '#2a2218', 1) + ell(32, 45, 12, 3.6, '#4fa8b0', .9) + ell(29, 44, 4, 1, '#fff', .55);
  o += [18, 28, 38, 46].map((x, i) => line(`M${x} 47v6`, D.stone[2], .9, .5)).join('') + line('M12 49H52', D.stone[2], .9, .35);
  o += rect(12, 22, 40, 4, D.wood[1], 1, 1, ink(D.inkB, .9, .8)) + rect(30, 26, 1.4, 12, '#8a6a30', 0, 1) + path('M26 38h9v5h-9Z', D.wood[1], 1, ink(D.inkB, .8, .8)) + path('M10 52L14 24M54 52L50 24', 'none', 1, { stroke: D.wood[2], 'stroke-width': 2, 'stroke-opacity': .6 });
  return o;
});
tile('props', 'shaduf', 'a', TALL, ['tall', 'well', 'obstacle', 'water'], (t) => {
  let o = sh(36, 114, 26, 5);
  o += ell(46, 108, 14, 4.6, '#6a5232', 1, 0, ink('#2a1a10', .8, .8)) + ell(46, 108, 11, 3, '#4fa8b0', .95);
  o += path('M12 112L14 52H24L26 112Z', t.lg(D.brick, 0), 1, ink('#5a3a24', .9, .85)) + path('M34 112L36 52H46L48 112Z', t.lg(D.brick, 0), 1, ink('#5a3a24', .9, .85)) + [0, 1, 2, 3, 4, 5].map(i => line(`M${13 + i * .2} ${60 + i * 9}H25M${35 + i * .2} ${60 + i * 9}H47`, '#5a3a24', .8, .45)).join('');
  o += line('M2 50L66 38', '#2a1a10', 5, .8) + line('M2 50L66 38', D.wood[1], 3.6, 1) + line('M4 48L40 41', '#d0aa72', 1, .5);
  o += line('M58 40V62', '#6a5232', 1.2, 1) + path('M54 62h8l-1 10h-6Z', D.wood[1], 1, ink(D.inkB, .8, .8)) + ell(58, 62, 4, 1.2, '#2a1a10', .8);
  o += ell(8, 52, 6.6, 7, t.lg(D.brick, 45), 1, 0, ink('#5a3a24', .9, .85)) + line('M8 46v-4', '#6a5232', 1.2, 1);
  return o;
});

// ---------- signs, cairn, tumbleweed, adobe house ----------
tile('props', 'signpost', 'a', TALL, ['tall', 'sign', 'decor'], (t) => sh(36, 114, 11, 4) + rect(29, 52, 6, 62, t.lg(D.wood, 0), 1, 1, ink(D.inkB, .9, .8)) + [[58, 2, 1], [74, -3, -1]].map(([y, sk, dir]) => path(dir > 0 ? `M16 ${y}H44L50 ${y + 6}L44 ${y + 12}H16Z` : `M48 ${y}H20L14 ${y + 6}L20 ${y + 12}H48Z`, t.lg(['#d8b078', '#b08850', '#80602e'], 90), 1, ink(D.inkB, .9, .8)) + line(`M${dir > 0 ? 22 : 26} ${y + 6}h${dir > 0 ? 18 : 18}`, '#5a3a14', 1, .6) + circ(dir > 0 ? 44 : 20, y + 6, .8, '#3a2a14')).join('') + `<path d="M35 48l14 3l-3 7l-11 -2Z" fill="#c8352b" stroke="#5a1a14" stroke-width=".7"/>`);
tile('props', 'cairn', 'a', C, ['decor', 'marker'], (t) => sh(34, 53, 15, 4) + [[32, 48, 13, 6], [31, 41, 10, 5], [33, 35, 7.6, 4.4], [32, 30, 5, 3.4]].map(([x, y, rx, ry], i) => ell(x, y, rx, ry, t.lg(i % 2 ? D.stone : ['#e8c8a0', '#c09870', '#8a6044'], 60), 1, 0, ink(D.inkS, .9, .85)) + ell(x - rx * .3, y - ry * .35, rx * .4, ry * .3, '#fff', .35)).join(''));
tile('props', 'tumbleweed', 'a', C, ['decor', 'dry'], (t) => { const r = rng(5); let o = ell(36, 52, 14, 3, '#3b3a24', .14) + circ(32, 40, 13, '#c8aa6a', .35); for (let i = 0; i < 16; i++) { const a = r.range(0, 6.28), a2 = a + r.range(1.5, 3); o += line(`M${f(32 + Math.cos(a) * 12)} ${f(40 + Math.sin(a) * 12)}Q${f(32 + r.range(-6, 6))} ${f(40 + r.range(-6, 6))} ${f(32 + Math.cos(a2) * 12)} ${f(40 + Math.sin(a2) * 12)}`, i % 3 ? '#8a6a38' : '#c8aa6a', 1.1, .9); } return o; });
tile('props', 'adobe-house', 'a', LG, ['large', 'building', 'obstacle', 'village'], (t) => {
  let o = sh(66, 114, 54, 7);
  o += rect(12, 46, 96, 66, t.lg([D.brick[0], D.brick[1], D.brick[2]], 70), 4, 1, ink(D.inkB, 1, .85));
  o += path('M12 46L26 36H120L108 46Z', '#ecc898', 1, ink(D.inkB, 1, .8)) + path('M108 46L120 36V102L108 112Z', D.brick[2], .9, ink(D.inkB, 1, .8));
  o += rect(70, 22, 28, 24, t.lg([D.brick[0], D.brick[1]], 70), 3, 1, ink(D.inkB, 1, .85)) + path('M70 22L80 14H108L98 22Z', '#ecc898', 1, ink(D.inkB, 1, .8));
  for (let i = 0; i < 4; i++) o += ell(11, 50 + i * 3, 5, 1.4, D.wood[1], 1, 0, ink(D.inkB, .5, .8)) ;
  o += path('M24 112V84Q24 70 38 70Q52 70 52 84V112Z', '#2a1810', 1, ink(D.inkB, 1, .85)) + path('M28 112V86Q28 75 38 75Q48 75 48 86V112Z', t.lg(D.wood, 0), 1) + line('M38 75V112', D.wood[2], 1, .7) + circ(34, 96, 1, D.gold[1]) + circ(42, 96, 1, D.gold[1]);
  o += `<path d="M64 74Q64 66 71 66Q78 66 78 74V84H64Z" fill="#2a1810" stroke="${D.inkB}" stroke-width=".9"/><path d="M84 66h10v10H84Z" fill="#2a1810" stroke="${D.inkB}" stroke-width=".9"/><path d="M78 36q4 4 0 8M94 32l2 5" stroke="${D.inkB}" stroke-width="1" fill="none"/>`;
  o += `<path d="M58 52q3 8 3 14M62 52q3 8 3 14" stroke="#c8352b" stroke-width="1.6" fill="none"/><ellipse cx="58.5" cy="66" rx="1.5" ry="2.2" fill="#c8352b"/><ellipse cx="62.5" cy="66" rx="1.5" ry="2.2" fill="#d86a2a"/>`;
  o += rect(30, 24, 2, 22, D.wood[2], 0, 1) + path('M30 24l12 3l-12 4Z', '#2f9a9a', 1, ink('#1f4a56', .7, .8)) + rect(94, 38, 14, 3, D.brick[2], 0, .3);
  return o;
});
