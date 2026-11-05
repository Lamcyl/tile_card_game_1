// Ashkara sub-area 6 Dust Bazaar interest objects: the ruined caravanserai with its market court (landmark), the bazaar city gate (closed/open), market stalls (spice, rug, pottery, lamp, fruit),
// mud-brick houses and towers, covered well courts, rug merchants, caravan wagons, dyer vats and chests. Runs on its own; helpers come from dust-bazaar-lib.mjs.
import { T, rng, f, ell, circ, rect, path, line, ink, sh, pebbleD, speckle, C, TALL, LG, tile, CLOTH, MUD, MUDS, PLUM, INKB, WOODS, BRASS, BONE, bricks, jar, heap, wood, mud, dust } from './dust-bazaar-lib.mjs';

const IN = (n, v, size, tags, fn) => tile('interest', n, v, size, [...tags, size === LG ? 'large' : size === TALL ? 'tall' : 'one'], fn);
const ik = (w = .9) => ink(INKB, w, .85), ikS = ink('#5a2a20', .9, .85);
const STONE = ['#f6d8b4', '#e0a880', '#b87850'];
const stone = (t, ang = 70) => t.lg(STONE, ang);
const pole = (t, x, y0, y1, w = 4) => rect(x - w / 2, y0, w, y1 - y0, t.lg(WOODS, 0), .6, 1, ink('#3b2a1a', .6, .85));
const rugPanel = (t, x, y, w, h, a, b) => { let o = rect(x, y, w, h, a[1], 1, 1, ink(a[2], .9, .9)); for (let i = 0; i < 4; i++) o += rect(x + 2, y + 3 + i * (h - 6) / 4, w - 4, (h - 6) / 8, b[1], 0, .9); o += path(`M${x + w / 2} ${y + 4}l4 ${h / 2 - 4}l-4 ${h / 2 - 4}l-4 ${-h / 2 + 4}Z`, CLOTH.cream[0], .75); for (let i = 0; i < w / 3; i++) o += line(`M${x + 1.5 + i * 3} ${y + h}v3`, CLOTH.cream[1], 1, .9); return o; };
const lampBrass = (x, y, s = 1) => ell(x + 1, y + 1.6, 6 * s, 1.6 * s, '#3b2a24', .2) + path(`M${x - 5 * s} ${y}Q${x - 5 * s} ${y - 4 * s} ${x} ${y - 4 * s}Q${x + 5 * s} ${y - 4 * s} ${x + 5 * s} ${y}Z`, BRASS[1], 1, ink(BRASS[2], .8, .9)) + path(`M${x + 4 * s} ${y - 2 * s}L${x + 9 * s} ${y - 4 * s}L${x + 8 * s} ${y - 2 * s}Z`, BRASS[1], 1, ink(BRASS[2], .6, .9)) + path(`M${x - 5 * s} ${y - 2 * s}q-4 0 -3 -4q1 -1 3 -1`, 'none', 1, { stroke: BRASS[2], 'stroke-width': 1.2 }) + circ(x - 1.4 * s, y - 5.4 * s, 1.2 * s, '#ffd35a') + ell(x - 1.4 * s, y - 5.4 * s, 2 * s, 3 * s, '#ffd35a', .35);
const hangLamp = (x, y, c, s = 1) => line(`M${x} ${y - 8 * s}V${y}`, '#3b2a1a', 1, .9) + path(`M${x - 4 * s} ${y}H${x + 4 * s}L${x + 5 * s} ${y + 9 * s}Q${x} ${y + 13 * s} ${x - 5 * s} ${y + 9 * s}Z`, c[1], 1, ink(c[2], .9, .9)) + rect(x - 2.6 * s, y + 2 * s, 5.2 * s, 7 * s, '#fff2b0', 1, .9) + circ(x, y + 5.6 * s, 7 * s, '#ffd35a', .2);

// ===== market stall frame (128x128): striped canopy on four poles over a draped table =====
function stall(t, c1, c2, cloth, goods, back = '') {
  const fy = 118; let o = sh(64, fy - 1, 54, 6);
  o += pole(t, 18, 44, 108) + pole(t, 110, 44, 108) + back;
  const d = 'M2 58L20 18H108L126 58Z', cl = t.clip(d); let st = '';
  for (let x = -6; x < 134; x += 16) st += rect(x, 14, 8, 48, c1[1], 0, 1) + rect(x + 8, 14, 8, 48, c2[0], 0, 1);
  const tx = 14, tw = 100;
  // table: top face then draped front
  o += goods.under || '';
  o += path(`M${tx + 8} 84H${tx + tw - 8}L${tx + tw + 2} 98H${tx - 2}Z`, t.lg(['#e8c898', '#c8985c', '#8a6238'], 90), 1, ik()) + rect(tx - 2, 98, tw + 4, 18, t.lg(cloth, 90), 1, 1, ink(cloth[2], 1, .9));
  for (let x = tx + 2; x < tx + tw; x += 9) o += line(`M${x} 100V114`, cloth[2], .9, .35);
  o += path(`M${tx - 2} 98H${tx + tw + 2}V101Q${tx + tw / 2} 104 ${tx - 2} 101Z`, cloth[0], .5);
  for (let x = tx; x < tx + tw; x += 4) o += line(`M${x} 116v3`, CLOTH.cream[1], 1, .8);
  o += goods.top || '';
  o += pole(t, 8, 58, 118, 4.6) + pole(t, 120, 58, 118, 4.6);
  o += `<g clip-path="${cl}">${st}${path('M2 58L20 18H34L16 58Z', '#fff', .18)}${path('M108 18L126 58H112Z', PLUM, .22)}</g>` + path(d, 'none', 1, ink(c1[2], 1.2, .9)) + rect(18, 14, 92, 5, c1[2], 0, 1, ink(INKB, .8, .85));
  for (let x = 2; x < 124; x += 12) o += path(`M${x + (x - 2) * .0} 58H${x + 12}V64Q${x + 6} 70 ${x} 64Z`, ((x - 2) / 12) % 2 ? c2[1] : c1[2], 1, ink(INKB, .6, .8));
  return o + ell(64, 76, 52, 6, PLUM, .14);
}
const sp = (c, n = 6, x0 = 26, dx = 15) => Array.from({ length: n }, (_, i) => heap(x0 + i * dx, 90, 7, 8 + (i % 3) * 1.4, c[i % c.length])).join('');
const SPC = [CLOTH.red, CLOTH.saff, CLOTH.green, CLOTH.mag, [ '#e8a850', '#c47a28', '#8a4a10'], CLOTH.indigo];
const bowl = (x, y, c) => ell(x + 1, y + 1.4, 8, 2, '#3b2a24', .2) + path(`M${x - 8} ${y - 3}H${x + 8}Q${x + 7} ${y + 2} ${x} ${y + 2}Q${x - 7} ${y + 2} ${x - 8} ${y - 3}Z`, '#a8785a', 1, ik(.8)) + ell(x, y - 3, 8, 2.4, c[1], 1) + ell(x - 2, y - 4, 3, .9, c[0], .9);
IN('stall-spice', 'a', LG, ['stall', 'shop', 'spice'], (t) => stall(t, CLOTH.red, CLOTH.cream, CLOTH.indigo, { top: sp(SPC, 6) + [0, 1, 2].map(i => bowl(30 + i * 34, 94, SPC[(i * 2 + 1) % 6])).join('') }));
IN('stall-spice', 'b', LG, ['stall', 'shop', 'spice'], (t) => stall(t, CLOTH.saff, CLOTH.cream, CLOTH.teal, { top: sp([CLOTH.saff, CLOTH.red, CLOTH.mag], 5, 30, 17) + bowl(104, 94, CLOTH.green) }, [0, 1, 2, 3].map(i => hangLamp(30 + i * 24, 38, [CLOTH.red, CLOTH.teal][i % 2], .8)).join('')));
IN('stall-rug', 'a', LG, ['stall', 'shop', 'rug'], (t) => stall(t, CLOTH.teal, CLOTH.cream, CLOTH.red, { top: [[28, CLOTH.indigo], [58, CLOTH.mag], [88, CLOTH.saff]].map(([x, c]) => rect(x - 12, 78, 26, 12, c[1], 3, 1, ink(c[2], .9, .9)) + line(`M${x - 10} 84H${x + 12}`, CLOTH.cream[0], 1.4, .8)).join('') }, [[24, 48, 28, 36, CLOTH.red, CLOTH.saff], [56, 46, 26, 40, CLOTH.indigo, CLOTH.cream], [86, 48, 24, 36, CLOTH.teal, CLOTH.saff]].map(([x, y, w, h, a, b]) => rugPanel(t, x, y, w, h, a, b)).join('') ).replace('', ''));
IN('stall-rug', 'b', LG, ['stall', 'shop', 'rug'], (t) => stall(t, CLOTH.mag, CLOTH.saff, CLOTH.indigo, { top: [[34, CLOTH.red], [70, CLOTH.teal]].map(([x, c]) => path(`M${x - 16} 92Q${x - 16} 78 ${x} 78Q${x + 16} 78 ${x + 16} 92Z`, c[1], 1, ink(c[2], .9, .9)) + line(`M${x - 12} 86H${x + 12}`, CLOTH.cream[0], 1.6, .8)).join('') + rugPanel(t, 92, 70, 16, 22, CLOTH.saff, CLOTH.red) }, [[26, 44, 22, 30, CLOTH.teal, CLOTH.cream], [54, 44, 24, 34, CLOTH.saff, CLOTH.indigo], [84, 44, 22, 28, CLOTH.mag, CLOTH.cream]].map(([x, y, w, h, a, b]) => rugPanel(t, x, y, w, h, a, b)).join('')));
const potShelf = (t) => [64, 84].map(y => rect(24, y, 80, 3, t.lg(WOODS, 90), 0, 1, ink('#3b2a1a', .6, .85))).join('') + [[34, 64], [50, 64], [68, 64], [84, 64], [98, 64], [40, 84], [60, 84], [78, 84], [94, 84]].map(([x, y], i) => jar(t, x, y, .85, [['#ecc8b0', '#c98e74', '#8a5446'], ['#a8d0c8', '#3fb0ac', '#1f7a86'], ['#f4dcb0', '#dcae7c', '#a97a52']][i % 3])).join('');
IN('stall-pottery', 'a', LG, ['stall', 'shop', 'pottery'], (t) => stall(t, CLOTH.indigo, CLOTH.cream, CLOTH.saff, { top: [28, 52, 76, 100].map((x, i) => jar(t, x, 96, 1.1 + (i % 2) * .3, [['#ecc8b0', '#c98e74', '#8a5446'], ['#a8d0c8', '#3fb0ac', '#1f7a86']][i % 2])).join('') }, potShelf(t)));
IN('stall-pottery', 'b', LG, ['stall', 'shop', 'pottery'], (t) => stall(t, CLOTH.green, CLOTH.cream, CLOTH.red, { top: [34, 64, 94].map((x, i) => jar(t, x, 96, 1.5 - (i % 2) * .3, [['#f4dcb0', '#dcae7c', '#a97a52'], ['#e0b49c', '#a86a50', '#6a3a34'], ['#a8d0c8', '#3fb0ac', '#1f7a86']][i])).join('') }, potShelf(t)));
IN('stall-lamp', 'a', LG, ['stall', 'shop', 'lamp'], (t) => stall(t, CLOTH.saff, CLOTH.red, CLOTH.teal, { top: [30, 50, 70, 90, 108].map((x, i) => lampBrass(x, 94, 1.2 - (i % 2) * .15)).join('') }, [0, 1, 2, 3, 4].map(i => hangLamp(30 + i * 17, 56, [CLOTH.red, CLOTH.teal, CLOTH.saff, CLOTH.mag, CLOTH.green][i], .9)).join('')));
IN('stall-lamp', 'b', LG, ['stall', 'shop', 'lamp'], (t) => stall(t, CLOTH.mag, CLOTH.cream, CLOTH.indigo, { top: [34, 58, 82].map((x, i) => lampBrass(x, 94, 1.5)).join('') + circ(104, 86, 6, '#ffd35a', .25) }, [0, 1, 2, 3, 4, 5].map(i => hangLamp(26 + i * 15, 54 + (i % 2) * 8, [CLOTH.teal, CLOTH.saff, CLOTH.red][i % 3], .85)).join('')));
const crateF = (t, x, y, w, cols) => rect(x - w / 2, y - 12, w, 12, t.lg(WOODS, 90), 1, 1, ink('#3b2a1a', .9, .85)) + Array.from({ length: Math.floor(w / 5.4) }, (_, i) => circ(x - w / 2 + 3 + i * 5.4, y - 13 - (i % 2) * 1.6, 3, cols[i % cols.length], 1, ink('#4a2a10', .4, .8)) + circ(x - w / 2 + 2.2 + i * 5.4, y - 14.4 - (i % 2) * 1.6, .8, '#fff', .55)).join('');
IN('stall-fruit', 'a', LG, ['stall', 'shop', 'fruit'], (t) => stall(t, CLOTH.green, CLOTH.cream, CLOTH.red, { top: crateF(t, 34, 96, 30, ['#f08a24', '#e8501c']) + crateF(t, 70, 96, 30, ['#c8283a', '#a01c30']) + crateF(t, 104, 96, 18, ['#e8c030', '#8ab84a']) }));
IN('stall-fruit', 'b', LG, ['stall', 'shop', 'fruit'], (t) => stall(t, CLOTH.red, CLOTH.saff, CLOTH.green, { top: crateF(t, 32, 96, 26, ['#8a5aa0', '#6a4a8a']) + crateF(t, 62, 96, 26, ['#e8c030', '#f08a24']) + crateF(t, 92, 96, 26, ['#8ab84a', '#c6d65a']) + crateF(t, 62, 84, 22, ['#c8283a']) }));

// ===== a seated figure (merchant) =====
const person = (t, x, y, robe, turban, s = 1) => ell(x + 2, y + 2, 14 * s, 4 * s, '#3b2a24', .2) + path(`M${x - 13 * s} ${y}Q${x - 12 * s} ${y - 14 * s} ${x - 5 * s} ${y - 20 * s}H${x + 5 * s}Q${x + 12 * s} ${y - 14 * s} ${x + 13 * s} ${y}Q${x} ${y + 4 * s} ${x - 13 * s} ${y}Z`, t.lg(robe, 60), 1, ink(robe[2], 1, .9)) + circ(x, y - 25 * s, 5.4 * s, '#c8946c', 1, ink('#5a3a24', .8, .9)) + path(`M${x - 6 * s} ${y - 27 * s}Q${x} ${y - 36 * s} ${x + 6 * s} ${y - 27 * s}Q${x} ${y - 24 * s} ${x - 6 * s} ${y - 27 * s}Z`, turban[0], 1, ink(turban[2], .8, .9)) + line(`M${x - 5 * s} ${y - 29 * s}Q${x} ${y - 32 * s} ${x + 5 * s} ${y - 29 * s}`, turban[2], .8, .6) + circ(x - 1.8 * s, y - 25 * s, .7, '#2a1a10') + circ(x + 1.8 * s, y - 25 * s, .7, '#2a1a10') + path(`M${x - 3 * s} ${y - 22 * s}Q${x} ${y - 19 * s} ${x + 3 * s} ${y - 22 * s}`, '#3a2a20', 1);
IN('rug-merchant', 'a', LG, ['merchant', 'rug', 'shop'], (t) => {
  let o = sh(64, 116, 56, 6) + ell(64, 104, 52, 14, '#3b2a24', .18);
  o += path('M12 106L22 82H106L116 106Z', t.lg(CLOTH.red, 90), 1, ink(CLOTH.red[2], 1.2, .9)) + path('M20 102L28 86H100L108 102Z', 'none', 1, { stroke: CLOTH.saff[1], 'stroke-width': 2.2 }) + path('M64 88L82 94L64 100L46 94Z', CLOTH.cream[0], .85) + path('M64 91L74 94L64 97L54 94Z', CLOTH.teal[1], 1);
  for (let x = 14; x < 114; x += 5) o += line(`M${x} 107v4`, CLOTH.cream[1], 1.2, .9);
  o += rugPanel(t, 10, 56, 26, 34, CLOTH.indigo, CLOTH.saff) + rugPanel(t, 94, 54, 26, 36, CLOTH.teal, CLOTH.cream);
  o += person(t, 62, 90, CLOTH.indigo, CLOTH.saff, 1.2);
  o += path('M40 22H88L96 38H32Z', CLOTH.saff[1], 1, ik()) + line('M64 22V12', '#3b2a1a', 2, 1) + path('M40 38Q64 48 88 38', 'none', 1, { stroke: CLOTH.red[1], 'stroke-width': 3 }) + line('M64 40V60', '#3b2a1a', 1.2, .7);
  return o;
});
IN('rug-merchant', 'b', LG, ['merchant', 'rug', 'shop'], (t) => {
  let o = sh(64, 116, 56, 6) + ell(64, 104, 52, 14, '#3b2a24', .18);
  for (const [x, y, w, a, b] of [[10, 96, 50, CLOTH.teal, CLOTH.cream], [68, 92, 50, CLOTH.mag, CLOTH.saff], [30, 78, 48, CLOTH.red, CLOTH.saff]]) { o += path(`M${x} ${y + 10}L${x + 8} ${y}H${x + w - 8}L${x + w} ${y + 10}Z`, t.lg(a, 90), 1, ink(a[2], 1.1, .9)) + path(`M${x + 6} ${y + 8}L${x + 11} ${y + 2}H${x + w - 11}L${x + w - 6} ${y + 8}Z`, 'none', 1, { stroke: b[1], 'stroke-width': 1.6 }) + path(`M${x + w / 2} ${y + 2}l5 4l-5 4l-5 -4Z`, b[0], .9); for (let i = x + 2; i < x + w - 2; i += 5) o += line(`M${i} ${y + 10}v3`, CLOTH.cream[1], 1.1, .9); }
  o += person(t, 96, 82, CLOTH.green, CLOTH.cream, 1.1) + rugPanel(t, 8, 44, 22, 30, CLOTH.saff, CLOTH.indigo) + rugPanel(t, 34, 40, 22, 32, CLOTH.indigo, CLOTH.cream);
  o += [[96, 52]].map(([x, y]) => path(`M${x - 22} ${y}Q${x} ${y - 24} ${x + 22} ${y}Z`, CLOTH.red[1], 1, ik()) + line(`M${x} ${y - 14}V${y + 24}`, '#3b2a1a', 1.8, .9) + path(`M${x - 22} ${y}Q${x - 11} ${y + 6} ${x} ${y}Q${x + 11} ${y + 6} ${x + 22} ${y}`, CLOTH.red[2], 1, ik())).join('');
  return o;
});

// ===== mud-brick houses (128x128) =====
function house(t, v) {
  const fy = 116; let o = sh(64, fy + 1, 56, 6);
  const wall = (x0, y0, x1, y1, seed) => { const d = `M${x0} ${y1}V${y0}H${x1}V${y1}Z`, c = t.clip(d); return `<path d="${d}" fill="${t.lg(MUD, 70)}"/><g clip-path="${c}">${bricks(x0, y0, x1 - x0, y1 - y0, seed, MUD, 5, 10)}${path(`M${x1 - 18} ${y0}H${x1}V${y1}H${x1 - 18}Z`, PLUM, .24)}${path(`M${x0} ${y0}H${x0 + 8}V${y1}H${x0}Z`, '#fff', .16)}</g>` + path(d, 'none', 1, ik(1.3)); };
  const arch = (x, y, w, h, shutter) => path(`M${x} ${y + h}V${y + w / 2}Q${x} ${y} ${x + w / 2} ${y}Q${x + w} ${y} ${x + w} ${y + w / 2}V${y + h}Z`, shutter || '#2a1612', 1, ink('#140806', 1, .9)) + path(`M${x - 1.6} ${y + h}V${y + w / 2}Q${x - 1.6} ${y - 1.6} ${x + w / 2} ${y - 1.6}Q${x + w + 1.6} ${y - 1.6} ${x + w + 1.6} ${y + w / 2}V${y + h}`, 'none', 1, { stroke: '#f4d8c4', 'stroke-width': 1.6 });
  const parapet = (x0, x1, y) => { let p = rect(x0 - 3, y, x1 - x0 + 6, 5, '#f0d4c0', 0, 1, ik()); for (let x = x0 - 3; x < x1 + 3; x += 9) p += rect(x, y - 5, 5, 5, '#e0b49c', 0, 1, ik(.8)); return p; };
  if (v === 'a') {
    // two storeys with a stair and a shade cloth
    o += wall(14, 54, 114, fy, 7101) + wall(30, 26, 90, 54, 7102) + parapet(30, 90, 26) + parapet(14, 114, 52) + rect(14, 52, 100, 4, '#f0d4c0', 0, .0);
    o += arch(54, 82, 20, 34, wood(t, 0)) + line('M64 84V116', '#3a2a1a', 1.2, .8) + circ(60, 100, 1.4, BRASS[1]) + circ(68, 100, 1.4, BRASS[1]);
    o += arch(26, 66, 12, 16, '#3a2a30') + arch(90, 66, 12, 16, '#3a2a30') + arch(52, 34, 12, 16, '#3a2a30') + arch(70, 34, 12, 16, '#3a2a30') + rect(25, 80, 14, 2.4, wood(t, 90), 0, 1, ik(.6)) + rect(89, 80, 14, 2.4, wood(t, 90), 0, 1, ik(.6));
    o += path('M100 116L114 86V116Z', '#d9ab90', 1, ik()) + line('M100 116L114 86', '#8a5446', 1, .7) + path('M18 70H46L50 80H14Z', t.lg(CLOTH.red, 90), 1, ik()) + [0, 1, 2, 3].map(i => line(`M${20 + i * 8} 70L${18 + i * 8} 80`, CLOTH.cream[0], 2.4, .85)).join('');
    o += [[100, 50]].map(([x, y]) => jar(t, x, y, .7)).join('') + jar(t, 20, 116, .8) + ell(86, 116, 3, 1, '#3b2a24', .2);
  } else if (v === 'b') {
    // single storey with a dome, an awning and hanging cloth
    o += wall(10, 66, 118, fy, 7111) + parapet(10, 118, 64);
    o += path('M30 64Q30 30 64 28Q98 30 98 64Z', t.lg(['#fbe4d0', '#e0b49c', '#b07860'], 40), 1, ik(1.2)) + path('M40 60Q42 40 58 36', 'none', 1, { stroke: '#fff', 'stroke-width': 3, 'stroke-opacity': .35 }) + line('M64 28V16', '#3b2a1a', 1.8, 1) + circ(64, 14, 3, BRASS[1], 1, ink(BRASS[2], .6, .9));
    o += arch(54, 84, 20, 32, wood(t, 0)) + line('M64 86V116', '#3a2a1a', 1.2, .8) + arch(20, 80, 14, 20, '#3a2a30') + arch(94, 80, 14, 20, '#3a2a30') + path('M10 76H46L52 88H4Z', t.lg(CLOTH.teal, 90), 1, ik()) + [0, 1, 2, 3, 4].map(i => line(`M${12 + i * 8} 76L${10 + i * 8} 88`, CLOTH.cream[0], 2.4, .85)).join('') + jar(t, 100, 116, .9) + jar(t, 110, 116, .6);
  } else {
    // corner house with a square tower, banner and a roof garden
    o += wall(12, 70, 116, fy, 7121) + wall(76, 22, 112, 70, 7122) + parapet(12, 70, 68) + parapet(76, 112, 20);
    o += arch(30, 88, 18, 28, wood(t, 0)) + line('M39 90V116', '#3a2a1a', 1.2, .8) + arch(84, 36, 12, 18, '#3a2a30') + arch(84, 84, 12, 18, '#3a2a30') + arch(60, 84, 10, 14, '#3a2a30');
    o += line('M94 22V2', '#3b2a1a', 2, 1) + path('M94 2H116L110 8L116 14H94Z', CLOTH.red[1], 1, ink(CLOTH.red[2], .9, .9));
    for (let i = 0; i < 4; i++) o += ell(16 + i * 12, 64, 6, 4, t.lg(['#c8d68a', '#8aa05c', '#4a6a34'], 40), 1, 0, ink('#2e4a2a', .6, .8)) + jar(t, 20 + i * 12, 70, .0 + .01);
    o += path('M14 100H40L36 110H10Z', t.lg(CLOTH.mag, 90), .0);
  }
  return o + ell(64, fy + 1, 44, 3, '#3b2a24', .16);
}
for (const v of ['a', 'b', 'c']) IN('mudbrick-house', v, LG, ['house', 'mud-brick', 'building', 'obstacle'], (t) => house(t, v));
// mud-brick towers (64x128)
function tower(t, v) {
  const fy = 118; let o = sh(32, fy + 1, 26, 5);
  const x0 = v === 'a' ? 12 : 14, x1 = 52 - (v === 'a' ? 0 : 2), top = v === 'a' ? 26 : 34, d = `M${x0 - 3} ${fy}L${x0} ${top}H${x1}L${x1 + 3} ${fy}Z`, c = t.clip(d);
  o += `<path d="${d}" fill="${t.lg(MUD, 70)}"/><g clip-path="${c}">${bricks(x0 - 4, top, x1 - x0 + 8, fy - top, 7201, MUD, 5, 10)}${path(`M${x1 - 12} ${top}H${x1 + 4}V${fy}H${x1 - 12}Z`, PLUM, .26)}${path(`M${x0 - 3} ${top}H${x0 + 6}V${fy}H${x0 - 3}Z`, '#fff', .16)}</g>` + path(d, 'none', 1, ik(1.3));
  o += rect(x0 - 5, top - 4, x1 - x0 + 10, 6, '#f0d4c0', 0, 1, ik()) + [0, 1, 2, 3, 4].map(i => rect(x0 - 5 + i * ((x1 - x0 + 6) / 4.5), top - 10, 5, 6, '#e0b49c', 0, 1, ik(.8))).join('');
  o += path(`M${32 - 5} ${top + 30}V${top + 22}Q32 ${top + 14} ${32 + 5} ${top + 22}V${top + 30}Z`, '#2a1a20', 1, ink('#140806', 1, .9)) + rect(30, top + 52, 4, 14, '#2a1a20') + path(`M${32 - 7} ${fy}V${fy - 22}Q32 ${fy - 32} ${32 + 7} ${fy - 22}V${fy}Z`, wood(t, 0), 1, ink('#2a1a0a', 1, .9)) + line(`M32 ${fy - 28}V${fy}`, '#2a1a0a', 1.2, .8);
  if (v === 'a') o += line(`M32 ${top - 10}V${top - 26}`, '#3b2a1a', 1.8, 1) + path(`M32 ${top - 26}H52L46 ${top - 21}L52 ${top - 16}H32Z`, CLOTH.teal[1], 1, ink(CLOTH.teal[2], .9, .9)); else o += ell(32, top - 12, 6, 4, '#e0a850', .5) + hangLamp(32, top + 36, CLOTH.saff, .8);
  return o + [[x0 - 6, fy - 2], [x1 + 6, fy - 1]].map(([x, y]) => ell(x, y, 8, 3, '#d9ab90', .9, 0, ink(INKB, .5, .6))).join('');
}
IN('mudbrick-tower', 'a', TALL, ['tower', 'mud-brick', 'building', 'obstacle'], (t) => tower(t, 'a'));
IN('mudbrick-tower', 'b', TALL, ['tower', 'mud-brick', 'building', 'obstacle'], (t) => tower(t, 'b'));

// ===== covered well court (128x128) =====
function wellCourt(t, v) {
  const fy = 114; let o = sh(64, fy, 52, 6);
  o += ell(64, 96, 54, 18, t.lg(['#e8d0b8', '#c8aa94', '#a08670'], 60), 1, 0, ik(.9)) + [[-40, 4], [0, -16], [40, 4], [-20, 14], [24, 14]].map(([dx, dy]) => path(`M${64 + dx - 8} ${96 + dy}h16`, 'none', 1, { stroke: '#8a6a54', 'stroke-width': .8, 'stroke-opacity': .5 })).join('');
  o += ell(64, 94, 22, 10, '#e8d4c0', 1, 0, ik()) + ell(64, 92, 17, 7, '#2a2a3a', 1) + ell(64, 93, 15, 5.4, '#3a5a6a', 1) + ell(60, 92, 6, 1.8, '#a8d0d8', .6);
  o += path('M42 94Q42 104 64 106Q86 104 86 94', t.lg(['#f0dcc8', '#c8aa94', '#8a6a54'], 90), 1, ik());
  for (const x of [32, 96]) o += pole(t, x, 38, 106, 5.4) + ell(x, 107, 6, 2, '#3b2a24', .2);
  for (const x of [48, 80]) o += pole(t, x, 36, 82, 4);
  o += line('M64 38V76', '#3b2a1a', 1.4, .8) + path('M60 76H68L67 86H61Z', t.lg(WOODS, 0), 1, ik(.8)) + path('M60 76q4 -3 8 0', 'none', 1, { stroke: '#3b2a1a', 'stroke-width': 1.2 });
  if (v === 'a') {
    const d = 'M20 40L40 12H88L108 40Z', cl = t.clip(d); let st = ''; for (let x = 14; x < 114; x += 14) st += rect(x, 8, 7, 36, CLOTH.red[1], 0, 1) + rect(x + 7, 8, 7, 36, CLOTH.cream[0], 0, 1);
    o += `<g clip-path="${cl}">${st}${path('M88 12L108 40H92Z', PLUM, .24)}</g>` + path(d, 'none', 1, ink(CLOTH.red[2], 1.2, .9)) + [0, 1, 2, 3, 4, 5, 6].map(i => path(`M${20 + i * 12.6} 40H${32.6 + i * 12.6}V44Q${26.3 + i * 12.6} 48 ${20 + i * 12.6} 44Z`, i % 2 ? CLOTH.cream[1] : CLOTH.red[2], 1, ink(INKB, .6, .8))).join('') + hangLamp(64, 46, CLOTH.saff, .8);
  } else {
    o += path('M18 42Q18 8 64 8Q110 8 110 42Z', t.lg(['#f6e0cc', '#d9ab90', '#a87260'], 40), 1, ik(1.3)) + path('M26 38Q28 18 52 12', 'none', 1, { stroke: '#fff', 'stroke-width': 3, 'stroke-opacity': .4 }) + rect(14, 40, 100, 6, '#f0d4c0', 0, 1, ik()) + path('M64 8V0', 'none', 1, ik()) + circ(64, 2, 3, BRASS[1], 1, ink(BRASS[2], .6, .9)) + path('M52 42V32Q64 22 76 32V42Z', '#7a4a52', .5);
    o += [[44, 22], [84, 22]].map(([x, y]) => circ(x, y, 3, '#2a1a20', .0)).join('');
  }
  o += jar(t, 18, 112, 1.1) + jar(t, 110, 112, .9, ['#a8d0c8', '#3fb0ac', '#1f7a86']) + ell(104, 114, 6, 1.4, '#3b2a24', .0);
  return o;
}
IN('well-court', 'a', LG, ['well', 'court', 'water', 'signature'], (t) => wellCourt(t, 'a'));
IN('well-court', 'b', LG, ['well', 'court', 'water', 'signature'], (t) => wellCourt(t, 'b'));

// ===== caravan wagons (128x128) =====
function wagon(t, v) {
  const fy = 114; let o = sh(64, fy + 2, 54, 6);
  const wheel = (x, y, r) => ell(x + 2, y + r * .9, r * 1.05, 3, '#3b2a24', .2) + circ(x, y, r, 'none', 1, { stroke: '#3b2a1a', 'stroke-width': 7 }) + circ(x, y, r, 'none', 1, { stroke: '#8a6238', 'stroke-width': 4.6 }) + circ(x, y, r - 3, 'none', 1, { stroke: '#d8b080', 'stroke-width': .8, 'stroke-opacity': .7 }) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => line(`M${x} ${y}l${f(Math.cos(i * .785) * (r - 2))} ${f(Math.sin(i * .785) * (r - 2))}`, '#5a3c20', 1.8, 1)).join('') + circ(x, y, 3.2, '#3a3438', 1, ink('#1a1618', .6, .9));
  o += line('M110 96H124', '#3b2a1a', 3.4, 1) + line('M110 96H124', '#8a6238', 1.8, 1) + path('M8 92H112L108 108H12Z', t.lg(WOODS, 90), 1, ink('#3b2a1a', 1.1, .85)) + [24, 44, 64, 84, 100].map(x => line(`M${x} 93V107`, '#3b2a1a', .9, .5)).join('');
  if (v === 'a') {
    const d = 'M12 92Q14 36 60 34Q106 36 108 92Z', cl = t.clip(d); let st = ''; for (let x = 6; x < 114; x += 16) st += rect(x, 30, 8, 64, CLOTH.cream[0], 0, 1) + rect(x + 8, 30, 8, 64, CLOTH.red[1], 0, 1);
    o += `<g clip-path="${cl}">${st}${path('M12 92Q14 36 40 34L38 92Z', '#fff', .16)}${path('M84 34Q106 40 108 92H84Z', PLUM, .26)}</g>` + path(d, 'none', 1, ink(CLOTH.red[2], 1.3, .9));
    for (const x of [26, 50, 74, 96]) o += path(`M${x} 92Q${x - 1} 52 ${x + 3} 36`, 'none', 1, { stroke: '#3b2a1a', 'stroke-width': 1.4, 'stroke-opacity': .5 });
    o += path('M92 92Q92 56 104 50Q108 60 108 92Z', '#2a1a20', .78);
  } else {
    for (const [x, y, w, c] of [[16, 80, 22, CLOTH.saff], [42, 78, 24, CLOTH.indigo], [70, 80, 20, CLOTH.teal]]) o += rect(x, y, w, 14, t.lg(WOODS, 90), 1, 1, ink('#3b2a1a', .9, .85)) + line(`M${x + w / 2} ${y}V${y + 14}`, '#3b2a1a', .8, .6) + ell(x + w / 2, y, w / 2, 3, c[1], 1, 0, ink(c[2], .6, .9));
    o += jar(t, 96, 94, 1.1) + path('M30 78Q40 52 56 62Q60 78 56 80Z', CLOTH.red[1], 1, ink(CLOTH.red[2], .9, .9)) + path('M42 64Q50 60 56 66', 'none', 1, { stroke: CLOTH.cream[0], 'stroke-width': 1.4 }) + path('M10 94L8 82H20', 'none', 1, ik());
  }
  return o + wheel(34, 104, 14) + wheel(90, 104, 14);
}
IN('caravan-wagon', 'a', LG, ['wagon', 'caravan', 'covered', 'obstacle'], (t) => wagon(t, 'a'));
IN('caravan-wagon', 'b', LG, ['wagon', 'caravan', 'open', 'obstacle'], (t) => wagon(t, 'b'));

// ===== dyer vats (128x128): a row of vats with cloth drying overhead =====
function dyer(t, v) {
  const fy = 114; let o = sh(64, fy, 54, 6);
  o += [10, 118].map(x => pole(t, x, 20, fy, 5)).join('') + rect(6, 18, 116, 5, wood(t, 90), 1, 1, ik(.7));
  const cs = v === 'a' ? [CLOTH.indigo, CLOTH.red, CLOTH.saff] : [CLOTH.mag, CLOTH.teal, CLOTH.green];
  cs.forEach((c, i) => { const x = 24 + i * 34; o += path(`M${x} 23H${x + 20}V${58 + i * 7}Q${x + 10} ${66 + i * 7} ${x} ${58 + i * 7}Z`, t.lg(c, 90), 1, ink(c[2], .9, .9)) + line(`M${x + 6} 25V${54 + i * 6}M${x + 14} 25V${56 + i * 6}`, c[0], .8, .5); });
  cs.forEach((c, i) => { const x = 8 + i * 37; o += ell(x + 20, 110, 20, 5, '#3b2a24', .2) + path(`M${x} 92Q${x - 1} 110 ${x + 6} 112H${x + 34}Q${x + 41} 110 ${x + 40} 92Z`, t.lg(['#e0b49c', '#a86a50', '#6a3a34'], 0), 1, ik()) + ell(x + 20, 92, 20, 6.4, c[2], 1, 0, ik(.8)) + ell(x + 20, 93, 17, 4.8, c[1], 1) + ell(x + 15, 92, 7, 1.6, c[0], .85) + line(`M${x + 2} 100H${x + 38}`, '#8a5446', 1.6, .7); });
  o += path('M96 60L104 86', 'none', 1, { stroke: '#3b2a1a', 'stroke-width': 2.4, 'stroke-linecap': 'round' });
  return o;
}
IN('dyer-vats', 'a', LG, ['dyer', 'cloth', 'workshop'], (t) => dyer(t, 'a'));
IN('dyer-vats', 'b', LG, ['dyer', 'cloth', 'workshop'], (t) => dyer(t, 'b'));

// ===== landmark: ruined caravanserai with a market court (128x128) =====
function caravanserai(t, v) {
  const fy = 116; let o = sh(64, fy + 1, 60, 6);
  const wallBlk = (x0, y0, x1, y1, seed, jag) => { const d = jag ? `M${x0} ${y1}V${y0 + 10}L${x0 + 8} ${y0 + 4}L${x0 + 16} ${y0 + 12}L${x0 + 26} ${y0}L${x0 + 34} ${y0 + 9}L${x1} ${y0 + 16}V${y1}Z` : `M${x0} ${y1}V${y0}H${x1}V${y1}Z`, c = t.clip(d); return `<path d="${d}" fill="${t.lg(MUD, 70)}"/><g clip-path="${c}">${bricks(x0, y0, x1 - x0, y1 - y0, seed, MUD, 5, 10)}${path(`M${x1 - 16} ${y0}H${x1}V${y1}H${x1 - 16}Z`, PLUM, .24)}${path(`M${x0} ${y0}H${x0 + 8}V${y1}H${x0}Z`, '#fff', .15)}</g>` + path(d, 'none', 1, ik(1.3)); };
  const archP = (x, y, w, h, fill = '#2a1612') => path(`M${x} ${y + h}V${y + w * .5}Q${x + w * .25} ${y + 4} ${x + w / 2} ${y}Q${x + w * .75} ${y + 4} ${x + w} ${y + w * .5}V${y + h}Z`, fill, 1, ink('#140806', 1.1, .9));
  const crenel = (x0, x1, y) => { let p = rect(x0 - 2, y, x1 - x0 + 4, 5, '#f0d4c0', 0, 1, ik()); for (let x = x0 - 2; x < x1 + 2; x += 9) p += rect(x, y - 5, 5, 5, '#e0b49c', 0, 1, ik(.8)); return p; };
  if (v === 'a') {
    // facade with a central portal block, a left tower and a collapsed right wing
    o += wallBlk(2, 54, 40, fy, 7301, false) + wallBlk(88, 62, 126, fy, 7302, true) + wallBlk(36, 22, 92, fy, 7303, false);
    o += crenel(36, 92, 22) + crenel(2, 40, 52);
    o += archP(52, 52, 24, 64) + path('M56 116V70Q64 62 72 70V116Z', '#f6e6d0', .88) + path('M52 52Q64 40 76 52', 'none', 1, { stroke: CLOTH.teal[1], 'stroke-width': 5 }) + path('M50 56Q64 38 78 56', 'none', 1, { stroke: '#f4d8c4', 'stroke-width': 1.6 });
    for (let i = 0; i < 6; i++) o += rect(40 + i * 8.4, 30, 5, 5, i % 2 ? CLOTH.teal[1] : CLOTH.cream[0], 0, 1, ink(CLOTH.teal[2], .5, .8));
    o += [14, 28].map(x => archP(x, 70, 9, 16, '#3a2a30')).join('') + archP(100, 80, 9, 16, '#3a2a30') + [44, 80].map(x => archP(x, 34, 7, 12, '#3a2a30')).join('');
    o += rect(2, 52, 4, 64, '#e8c8b0', 0, .0) + path('M2 54H40', 'none', 1, ik(.6)) + `<g>${[[96, 116], [108, 118], [118, 116], [90, 118]].map(([x, y], i) => `<g transform="translate(${x} ${y}) rotate(${i * 20})">${rect(-7, -3.4, 14, 6.8, t.lg(i % 2 ? MUD : MUDS, 60), 1, 1, ink(INKB, .8, .85))}</g>`).join('')}</g>`;
    o += line('M64 22V8', '#3b2a1a', 2, 1) + path('M64 8H86L80 14L86 20H64Z', CLOTH.red[1], 1, ink(CLOTH.red[2], .9, .9)) + hangLamp(46, 62, CLOTH.saff, .8) + hangLamp(82, 62, CLOTH.red, .8);
    o += ell(20, 118, 12, 3, '#3b2a24', .14) + pebbleD(20, 116, 1.4, ['#e0b49c', '#8a5446']) + pebbleD(108, 118, 1.6, ['#e0b49c', '#8a5446']);
  } else {
    // seen from inside the court: arcaded back wall, awnings, a central fountain and paving
    o += ell(64, 100, 60, 18, t.lg(['#e8d0b8', '#c8aa94', '#a08670'], 60), 1);
    o += wallBlk(2, 26, 126, 70, 7311, false) + crenel(2, 126, 26);
    for (let i = 0; i < 7; i++) { const x = 8 + i * 17; o += archP(x, 40, 11, 30, i === 3 ? '#f6e6d0' : '#2a1612') + (i === 3 ? '' : rect(x + 1, 62, 9, 8, '#3a2a30', 0, .0)); }
    o += rect(2, 66, 124, 6, '#f0d4c0', 0, 1, ik(.8));
    o += [[8, 14], [88, 14]].map(([x, c]) => '').join('');
    const aw = (x, w, c1, c2) => { const d = `M${x} 92L${x + 8} 72H${x + w - 8}L${x + w} 92Z`, cl = t.clip(d); let st = ''; for (let xx = x - 6; xx < x + w; xx += 12) st += rect(xx, 70, 6, 24, c1[1], 0, 1) + rect(xx + 6, 70, 6, 24, c2[0], 0, 1); return pole(t, x + 6, 82, 112, 3.4) + pole(t, x + w - 6, 82, 112, 3.4) + `<g clip-path="${cl}">${st}</g>` + path(d, 'none', 1, ink(c1[2], 1, .9)) + [0, 1, 2, 3].map(i => path(`M${x + i * w / 4} 92H${x + (i + 1) * w / 4}V96Q${x + (i + .5) * w / 4} 100 ${x + i * w / 4} 96Z`, i % 2 ? c2[1] : c1[2], 1, ink(INKB, .5, .8))).join(''); };
    o += aw(4, 40, CLOTH.teal, CLOTH.cream) + aw(84, 40, CLOTH.saff, CLOTH.red);
    o += ell(64, 106, 26, 8, '#e8d4c0', 1, 0, ik()) + ell(64, 104, 22, 6, '#3a5a6a', 1) + ell(58, 103, 8, 1.8, '#a8d0d8', .6) + rect(61, 84, 6, 20, t.lg(STONE, 0), 0, 1, ikS) + ell(64, 84, 8, 2.4, '#e0a880', 1, 0, ikS) + path('M64 78Q60 84 56 90M64 78Q68 84 72 90M64 78V90', 'none', 1, { stroke: '#a8d8e8', 'stroke-width': 1.2, 'stroke-opacity': .85 });
    o += jar(t, 24, 112, .9) + jar(t, 106, 112, 1, ['#a8d0c8', '#3fb0ac', '#1f7a86']) + [[48, 70, CLOTH.red], [78, 70, CLOTH.indigo]].map(([x, y, c]) => hangLamp(x, y, c, .7)).join('');
    o += line('M64 26V10', '#3b2a1a', 2, 1) + path('M64 10H84L78 15L84 20H64Z', CLOTH.teal[1], 1, ink(CLOTH.teal[2], .9, .9));
  }
  return o;
}
IN('caravanserai-court', 'a', LG, ['landmark', 'caravanserai', 'ruin', 'signature', 'obstacle'], (t) => caravanserai(t, 'a'));
IN('caravanserai-court', 'b', LG, ['landmark', 'caravanserai', 'court', 'signature'], (t) => caravanserai(t, 'b'));

// ===== gate: bazaar city gate (sandstone pylon gate) =====
const gate = (t, open) => {
  const fy = 116; let o = sh(64, fy + 1, 60, 6);
  const S = stone(t, 70), ikk = ink('#5a2a20', .9, .85);
  // two tapering pylons
  const pyl = (x0, x1) => { const d = `M${x0} ${fy}L${x0 + 4} 20H${x1 - 4}L${x1} ${fy}Z`, cl = t.clip(d); return `<path d="${d}" fill="${t.lg(STONE, 70)}"/><g clip-path="${cl}">` + [0, 1, 2, 3, 4, 5, 6].map(i => line(`M${x0} ${30 + i * 14}H${x1}`, '#b87850', .9, .5)).join('') + path(`M${x1 - 12} 20H${x1}V${fy}H${x1 - 14}Z`, PLUM, .24) + path(`M${x0} 20H${x0 + 7}V${fy}H${x0}Z`, '#fff', .2) + '</g>' + path(d, 'none', 1, ikk); };
  o += pyl(4, 46) + pyl(82, 124);
  o += rect(0, 14, 50, 7, '#f6d8b4', 0, 1, ikk) + rect(78, 14, 50, 7, '#f6d8b4', 0, 1, ikk);
  // tile frieze band and lamp niches
  for (const x0 of [10, 86]) { for (let i = 0; i < 4; i++) o += rect(x0 + i * 8, 34, 7, 7, i % 2 ? CLOTH.teal[1] : CLOTH.cream[0], 0, 1, ink(CLOTH.teal[2], .5, .8)); o += path(`M${x0 + 8} 70V60Q${x0 + 16} 52 ${x0 + 24} 60V70Z`, '#3a2018', 1, ikk) + (open ? '' : circ(x0 + 16, 64, 2.6, '#ffd35a', .9) + circ(x0 + 16, 64, 6, '#ffd35a', .25)); }
  // lintel and arch
  o += rect(40, 28, 48, 8, '#f6d8b4', 0, 1, ikk) + path('M38 30L64 8L90 30Z', '#f6d8b4', 1, ikk) + path('M46 30L64 14L82 30Z', '#e0a880') + circ(64, 24, 4, BRASS[1], 1, ink(BRASS[2], .8, .9)) + circ(64, 24, 1.6, '#2a1612');
  o += path(`M42 ${fy}V62Q42 38 64 38Q86 38 86 62V${fy}Z`, open ? t.lg(['#fff6e0', '#f0d8b0', '#c8a0a0'], 90) : '#2a1612', 1, ink('#140806', 1.2, .9));
  if (!open) {
    o += path(`M45 ${fy}V63Q45 42 64 42Q83 42 83 63V${fy}Z`, wood(t, 0), 1, ink('#2a1a0a', .9, .85)) + line(`M64 42V${fy}`, '#2a1a0a', 1.8, .9);
    for (let y = 66; y < fy - 4; y += 12) o += line(`M45 ${y}H83`, '#5a3c20', 1, .55);
    for (const [x, y] of [[52, 58], [52, 78], [52, 98], [76, 58], [76, 78], [76, 98]]) o += circ(x, y, 1.6, '#4a4448', 1, ink('#1a1618', .6, .85)) + circ(x - .4, y - .4, .5, '#d8d0d0');
    o += circ(58, 88, 3.6, BRASS[1], 1, ink(BRASS[2], .8, .9)) + circ(70, 88, 3.6, BRASS[1], 1, ink(BRASS[2], .8, .9));
  } else {
    o += path(`M42 ${fy}V62Q42 56 47 52V${fy - 8}Z`, wood(t, 0), 1, ink('#2a1a0a', .9, .85)) + path(`M86 ${fy}V62Q86 56 81 52V${fy - 8}Z`, wood(t, 0), 1, ink('#2a1a0a', .9, .85));
    o += path(`M52 ${fy - 6}Q64 ${fy - 14} 76 ${fy - 6}Q64 ${fy} 52 ${fy - 6}Z`, '#fbe0c4', .85) + path('M54 74Q64 56 74 74Q64 82 54 74Z', '#fff', .35) + path(`M50 ${fy - 2}H78L74 80H54Z`, '#f0d4b0', .45);
  }
  // banners, lamps and rubble
  for (const [x, c] of [[24, CLOTH.red], [104, CLOTH.teal]]) o += line(`M${x} 44V28`, '#3b2a1a', 1.6, 1) + path(`M${x - 8} 44H${x + 8}V80L${x} 74L${x - 8} 80Z`, c[1], 1, ink(c[2], .9, .9)) + circ(x, 56, 3.6, BRASS[1], 1, ink(BRASS[2], .7, .9));
  for (const [x, y, s] of [[10, 114, .9], [118, 114, .9], [24, 118, .6], [104, 119, .6]]) o += pebbleD(x, y - 2, 1.4 * s, ['#f0d4c0', '#a87260']);
  if (open) o += ell(64, fy + 1, 24, 3, '#fff', .55);
  return o;
};
IN('gate-bazaar-city', 'closed', LG, ['gate', 'closed', 'sandstone', 'pylon', 'signature', 'obstacle'], (t) => gate(t, false));
IN('gate-bazaar-city', 'open', LG, ['gate', 'open', 'sandstone', 'pylon', 'signature'], (t) => gate(t, true));

// ===== chests (64x64) =====
const chest = (t, open) => {
  let o = sh(32, 54, 20, 4.4) + rect(10, 30, 44, 22, t.lg(WOODS, 90), 2, 1, ink('#3b2a1a', 1.1, .85)) + [18, 46].map(x => rect(x - 2, 30, 4, 22, BRASS[1], 0, .9, ink(BRASS[2], .6, .9))).join('') + rect(10, 38, 44, 2.6, BRASS[2], 0, .9) + path('M28 38h8v6l-4 3l-4 -3Z', BRASS[1], 1, ink(BRASS[2], .8, .9)) + circ(32, 42, 1.4, '#3a2a20');
  if (!open) o += path('M10 30Q10 16 32 16Q54 16 54 30Z', t.lg(WOODS, 80), 1, ink('#3b2a1a', 1.1, .85)) + [18, 46].map(x => path(`M${x - 2} 28Q${x - 2} 18 ${x} 17Q${x + 2} 18 ${x + 2} 28Z`, BRASS[1], .9)).join('') + path('M14 24Q18 18 28 17', 'none', 1, { stroke: '#e0c090', 'stroke-width': 1.6, 'stroke-opacity': .7 });
  else o += path('M12 30V14Q12 8 32 8Q52 8 52 14V28Z', t.lg(WOODS, 80), 1, ink('#3b2a1a', 1.1, .85)) + path('M16 28V16Q32 12 48 16V28Z', '#4a2a1c', 1) + ell(32, 30, 20, 4.4, '#f8d878', .95) + [[24, 29], [32, 27], [40, 29]].map(([x, y]) => circ(x, y, 2.6, BRASS[1], 1, ink(BRASS[2], .5, .9)) + circ(x - .6, y - .6, .8, BRASS[0])).join('') + path('M30 22l2 -4l2 4l-2 3Z', CLOTH.mag[1], 1) + circ(32, 20, 2.4, CLOTH.teal[1], 1) + `<g opacity=".7">${line('M32 20V10M24 22L20 12M40 22L44 12', '#fff4b0', 1, .8)}</g>`;
  return o;
};
IN('chest-bazaar', 'closed', C, ['chest', 'closed', 'loot'], (t) => chest(t, false));
IN('chest-bazaar', 'open', C, ['chest', 'open', 'loot'], (t) => chest(t, true));
