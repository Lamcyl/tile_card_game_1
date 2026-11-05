// Ashkara sub-area 7 Tomb Approach interest objects: the entrance hall (landmark: pylon front seen from the avenue, and the open-roof hall seen from inside), the sealed tomb door
// (gate, closed and open, 128x128), pylon towers, the great sphinx, a seated colossus, doorways, a false door, shrine niches, sand-choked stairs, a sarcophagus chamber, an altar and tomb chests.
// Runs on its own; helpers come from tomb-approach-lib.mjs.
import { T, rng, f, ell, circ, rect, path, line, ink, sh, pebbleD, speckle, C, TALL, LG, tile, STN, STS, LAP, RED, TQ, GLD, BLK, LIN, WOODS, GRN, SHD, INKT, INKL, ik, GLYPH, glyphRow, frieze, lotus, column, bowl, hang, jarT, drift, stoneT, wallFace, hallBase } from './tomb-approach-lib.mjs';

const IN = (n, v, size, tags, fn) => tile('interest', n, v, size, [...tags, size === LG ? 'large' : size === TALL ? 'tall' : 'one'], fn);
const ikS = ink(INKT, 1, .85), ikL = ink(INKL, 1, .85);
const nf = (s) => s.replace(/<rect[^>]*stroke[^>]*\/>/, '');         // frieze without its outlined backing rect
const cav = (x0, x1, y, t) => path(`M${x0 - 3} ${y + 6}Q${x0 - 1} ${y} ${x0 + 3} ${y}H${x1 - 3}Q${x1 + 1} ${y} ${x1 + 3} ${y + 6}Z`, t.lg(['#fff0c4', '#f0d098', '#d4a870'], 90), 1, ikS) + line(`M${x0} ${y + 3}H${x1}`, '#fff', .8, .5);
// a tapering painted pylon tower with a banner niche
function pylon(t, x0, x1, top, fy, o2 = {}) {
  const inset = 5, d = `M${x0} ${fy}L${x0 + inset} ${top}H${x1 - inset}L${x1} ${fy}Z`, cl = t.clip(d); const w = x1 - x0;
  let o = `<path d="${d}" fill="${t.lg(['#fbe6b4', '#e6bd7e', '#b8864e'], 70)}"/><g clip-path="${cl}">`;
  for (let y = top + 8; y < fy; y += 9) o += line(`M${x0} ${y}H${x1}`, '#a87a4c', .8, .4);
  o += path(`M${x1 - w * .3} ${top}H${x1}V${fy}H${x1 - w * .34}Z`, SHD, .24) + path(`M${x0} ${top}H${x0 + 7}V${fy}H${x0 - 2}Z`, '#fff', .22);
  const nx = x0 + w * .3, nw = w * .4; o += rect(nx, top + 14, nw, fy - top - 40, '#2a1c22', 0, o2.dark ? 1 : .0) + rect(nx - 1, top + 14, nw + 2, 3, GLD[1], 0, .9) + rect(nx, top + 20, nw, 14, LIN[0], 0, .85) + glyphRow(nx + 1, nx + nw - 1, top + 27, (o2.seed || 5), INKL, .5, 6) + rect(nx, top + 36, nw, 4, LAP[1], 0, .9) + rect(nx, top + 40, nw, 3, RED[1], 0, .9) + GLYPH.sun(x0 + w / 2, top + 54, RED[2], 1.4) + glyphRow(nx + 1, nx + nw - 1, top + 70, (o2.seed || 5) + 3, INKL, .5, 6);
  o += '</g>' + path(d, 'none', 1, ink(INKT, 1.2, .9));
  return o;
}
// ============ landmark: the entrance hall ============
function hallFront(t) {
  const fy = 116; let o = sh(64, fy + 1, 60, 6) + drift(t, 20, fy - 1, 22, 4) + drift(t, 108, fy - 1, 22, 4);
  // open roof: capitals of the papyrus columns and a blue sky strip show above the wall between the towers
  o += rect(40, 14, 48, 30, t.lg(['#bfe0f4', '#e8f0ee', '#fbe8c0'], 90), 0, 1) + [52, 64, 76].map((x, i) => column(t, x, 62, 20, i === 1 ? 'open' : 'bud', 4.6).replace(/<ellipse[^>]*opacity[^>]*\/>/, '')).join('').slice(0, 0);
  for (const x of [50, 64, 78]) o += rect(x - 3.4, 36, 6.8, 30, t.lg(['#fff0c4', '#e6bd7e', '#a87a4c'], 0), 0, 1, ik(.7)) + path(`M${x - 6} 38Q${x - 7} 28 ${x - 2} 24Q${x} 22 ${x + 2} 24Q${x + 7} 28 ${x + 6} 38Z`, t.lg(['#fff0c4', '#e0b070', '#a87a4c'], 0), 1, ik(.8)) + rect(x - 3.4, 38, 6.8, 2.4, LAP[1], 0, .9);
  o += pylon(t, 4, 44, 16, fy, { seed: 3 }) + pylon(t, 84, 124, 16, fy, { seed: 8 });
  o += rect(0, 10, 50, 7, '#f6dca4', 0, 1, ikS) + rect(78, 10, 50, 7, '#f6dca4', 0, 1, ikS) + frieze(2, 11, 46, 3, 'checker', [LAP, RED]).replace(/<rect[^>]*stroke[^>]*\/>/, '') + frieze(80, 11, 46, 3, 'checker', [LAP, RED]).replace(/<rect[^>]*stroke[^>]*\/>/, '');
  // portal: lintel with winged sun, dark doorway with a glimpse of lit floor and braziers
  o += rect(40, 60, 48, 10, t.lg(['#fff0c4', '#f0d098', '#d4a870'], 90), 0, 1, ikS) + cav(36, 92, 54, t) + path('M44 64Q54 56 64 62Q74 56 84 64Q74 62 64 66Q54 62 44 64Z', LAP[1], 1, ink(LAP[2], .6, .9)) + circ(64, 62, 3.2, RED[1], 1, ink(RED[2], .8, .9));
  o += path(`M44 ${fy}V76Q44 72 48 72H80Q84 72 84 76V${fy}Z`, '#241820', 1, ink('#0c0a10', 1.2, .9)) + path(`M50 ${fy}V80H78V${fy}Z`, t.lg(['#fff0c0', '#e8c890', '#b88a5c'], 90), .9) + [56, 72].map(x => bowl(t, x, fy - 2, 5, true, 6)).join('') + rect(44, 70, 40, 3, GLD[1], 0, .8);
  // steps and the first sphinxes of the avenue
  o += rect(40, fy - 4, 48, 5, t.lg(STN, 90), 0, 1, ik(.8)) + rect(36, fy, 56, 4, t.lg(STN, 90), 0, 1, ik(.8));
  for (const [x, c] of [[24, RED], [104, LAP]]) o += line(`M${x} 46V16`, '#3b2a1a', 1.6, 1) + path(`M${x} 16H${x + 10}L${x + 6} 21L${x + 10} 26H${x}Z`, c[1], 1, ink(c[2], .8, .9));
  for (const [x, y, s] of [[10, 114, 1], [118, 115, 1], [30, 119, .6], [98, 119, .6]]) o += pebbleD(x, y - 2, 1.5 * s, ['#fbe6b4', '#a87a4c']);
  return o;
}
IN('entrance-hall', 'a', LG, ['landmark', 'entrance-hall', 'pylon', 'signature', 'obstacle'], hallFront);
function hallInside(t) {
  const fy = 118; let o = rect(0, 0, 128, 128, t.lg(['#bfe0f4', '#f6ecd0'], 90), 0, 1);
  // back wall, painted
  o += rect(0, 22, 128, 58, t.lg(['#f6dca4', '#e8c088', '#c89462'], 90), 0, 1) + rect(0, 18, 128, 6, '#fbe6b4', 0, 1, ikS) + nf(frieze(0, 19, 128, 4, 'checker', [LAP, RED])) + glyphRow(2, 126, 36, 41, INKL, .85, 14) + rect(0, 42, 128, 2, LAP[1], 0, .9) + glyphRow(2, 126, 54, 43, RED[2], .7, 12, ['sun', 'eye', 'ankh', 'cobra']) + nf(frieze(0, 70, 128, 8, 'stripes', [RED, GLD, LAP]));
  // floor with converging joints
  o += path('M0 80H128V128H0Z', t.lg(['#f2d9a4', '#ecd09a', '#dcb882'], 90), 1) + [8, 24, 40, 56, 72, 88, 104, 120].map(x => line(`M${x} 128L${f(64 + (x - 64) * .52)} 80`, '#a98050', 1, .4)).join('') + [86, 94, 104, 116].map(y => line(`M0 ${y}H128`, '#a98050', 1, .4)).join('');
  o += path('M52 80V52Q52 46 58 46H70Q76 46 76 52V80Z', '#241820', 1, ink('#0c0a10', 1.2, .9)) + path('M56 80V56H72V80Z', t.lg(['#fff0c0', '#d8b080'], 90), .85) + rect(48, 40, 32, 5, GLD[1], 0, .9) + path('M48 44Q58 38 64 42Q70 38 80 44', 'none', 1, { stroke: LAP[1], 'stroke-width': 3 });
  // shade bands and sun shaft
  o += path('M96 22H112L84 128H60Z', '#fff6d8', .16) + path('M104 22H108L80 128H76Z', '#fff6d8', .14);
  // columns: back pair small, front pair large
  const col = (x, by, h, w, k) => column(t, x, by, h, k, w);
  o += col(26, 86, 30, 5, 'bud') + col(102, 86, 30, 5, 'bud') + bowl(t, 44, 84, 6, true, 8) + bowl(t, 84, 84, 6, true, 8) + col(10, 120, 62, 9, 'open') + col(118, 120, 62, 9, 'open');
  o += drift(t, 30, 118, 26, 5) + drift(t, 96, 112, 18, 3.4) + pebbleD(70, 112, 1.2, STN);
  return o;
}
IN('entrance-hall', 'b', LG, ['landmark', 'entrance-hall', 'interior', 'signature'], hallInside);

// ============ gate: the sealed tomb door (pylon gate) ============
const gate = (t, open) => {
  const fy = 116; let o = sh(64, fy + 1, 60, 6) + drift(t, 14, fy, 16, 3.6) + drift(t, 114, fy, 16, 3.6);
  o += pylon(t, 2, 40, 22, fy, { seed: 11 }) + pylon(t, 88, 126, 22, fy, { seed: 21 });
  o += rect(0, 16, 46, 7, '#f6dca4', 0, 1, ikS) + rect(82, 16, 46, 7, '#f6dca4', 0, 1, ikS);
  // door frame: square-headed with a cavetto lintel and a winged sun
  o += rect(36, 38, 56, 80, t.lg(['#fbe6b4', '#e6bd7e', '#b8864e'], 0), 0, 1, ikS) + cav(32, 96, 24, t) + rect(34, 30, 60, 8, t.lg(['#fff0c4', '#f0d098', '#d4a870'], 90), 0, 1, ikS) + path('M40 36Q52 26 64 34Q76 26 88 36Q76 34 64 38Q52 34 40 36Z', LAP[1], 1, ink(LAP[2], .6, .9)) + circ(64, 33, 3.6, RED[1], 1, ink(RED[2], .8, .9)) + path('M60 36Q64 42 68 36', 'none', 1, { stroke: GLD[2], 'stroke-width': 1.2 });
  for (const x of [38, 84]) o += rect(x, 40, 6, fy - 40, t.lg(['#fff0c4', '#e6bd7e', '#a87a4c'], 0), 0, 1, ik(.8)) + glyphRow(x, x + 6, 54, x, INKL, .5, 6) + rect(x, 80, 6, 3, RED[1], 0, .9) + rect(x, 70, 6, 3, LAP[1], 0, .9);
  const dx0 = 44, dx1 = 84, dy0 = 42;
  if (!open) {
    o += rect(dx0, dy0, dx1 - dx0, fy - dy0, t.lg(['#d8d0c8', '#a8a0a0', '#6a6470'], 90), 0, 1, ink('#1a1618', 1.2, .9));
    for (let y = dy0 + 14; y < fy - 4; y += 14) o += line(`M${dx0} ${y}H${dx1}`, '#4a4654', 1, .6);
    o += circ(64, 74, 15, '#e8e0d0', 1, ink('#3a3644', 1.2, .9)) + circ(64, 74, 11.4, '#f6f0e0', 1, ink('#a8a090', .8, .8)) + GLYPH.scarab(64, 74, LAP[1], 2.6) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => circ(64 + Math.cos(i * .785) * 13, 74 + Math.sin(i * .785) * 13, 1.1, GLD[1])).join('') + path('M60 58Q64 62 68 58', 'none', 1, { stroke: RED[1], 'stroke-width': 1.6 });
    o += line(`M${dx0} ${dy0 + 6}H${dx1}`, GLD[1], 2, .8) + glyphRow(dx0 + 2, dx1 - 2, dy0 + 11, 61, INKL, .5, 8) + [[dx0 + 6, 98], [dx1 - 6, 98]].map(([x, y]) => GLYPH.eye(x, y, LAP[2], 1.1)).join('') + path('M60 90Q64 96 68 90Q66 100 64 104Q62 100 60 90Z', '#c03a30', .95, ink(RED[2], .6, .9)) + line('M56 92Q64 100 72 92', '#f6e8c4', 1.2, .8);
  } else {
    o += path(`M${dx0} ${fy}V${dy0}H${dx1}V${fy}Z`, '#150e14', 1, ink('#0c0a10', 1.2, .9)) + path(`M${dx0 + 4} ${fy}V${dy0 + 20}Q64 ${dy0 + 4} ${dx1 - 4} ${dy0 + 20}V${fy}Z`, t.lg(['#7a5a40', '#3a2a28', '#150e14'], 90), .9) + [0, 1, 2, 3, 4].map(i => rect(dx0 + 4 + i * 1.6, fy - 6 - i * 7, dx1 - dx0 - 8 - i * 3.2, 5, t.lg(['#c89a62', '#8a603c'], 90), 0, .8 - i * .12)).join('') + circ(64, 76, 14, '#ffd35a', .16) + path(`M${dx0 + 2} ${fy}V${dy0 + 8}L${dx0 - 4} ${dy0 + 10}V${fy}Z`, '#a8a0a0', 1, ink('#1a1618', .9, .9)) + rect(dx1, dy0, 3, fy - dy0, '#6a6470', 0, 1);
    o += path(`M${dx1 + 1} ${fy - 2}L${dx1 + 12} ${fy - 10}V${dy0 + 28}L${dx1 + 1} ${dy0 + 32}Z`, t.lg(['#d8d0c8', '#a8a0a0', '#6a6470'], 40), 1, ink('#1a1618', 1, .9)) + circ(dx1 + 6, 80, 5, '#f6f0e0', 1, ink('#3a3644', .8, .9)) + GLYPH.scarab(dx1 + 6, 80, LAP[1], 1) + path(`M${dx1 + 4} ${fy + 2}Q${dx1 + 10} ${fy - 6} ${dx1 + 16} ${fy + 1}Z`, '#f2d9a4', .9);
  }
  for (const [x, c] of [[20, RED], [108, LAP]]) o += line(`M${x} 50V30`, '#3b2a1a', 1.6, 1) + path(`M${x - 7} 50H${x + 7}V84L${x} 78L${x - 7} 84Z`, c[1], 1, ink(c[2], .9, .9)) + circ(x, 62, 3.4, GLD[1], 1, ink(GLD[2], .7, .9));
  for (const [x, y, s] of [[10, 114, .9], [118, 114, .9], [44, 119, .6], [92, 119, .6]]) o += pebbleD(x, y - 2, 1.4 * s, ['#fbe6b4', '#a87a4c']);
  if (open) o += ell(64, fy + 1, 26, 3, '#fff6d8', .5);
  return o;
};
IN('gate-tomb-sealed', 'closed', LG, ['gate', 'closed', 'sealed', 'sandstone', 'pylon', 'signature', 'obstacle'], (t) => gate(t, false));
IN('gate-tomb-sealed', 'open', LG, ['gate', 'open', 'sandstone', 'pylon', 'signature'], (t) => gate(t, true));

// ============ pylon towers (64x128) ============
IN('pylon-tower', 'a', TALL, ['pylon', 'tower', 'obstacle'], (t) => { const fy = 120; let o = sh(32, fy, 28, 5) + drift(t, 12, fy - 1, 14, 3.4) + pylon(t, 6, 58, 10, fy, { seed: 31 }) + rect(2, 4, 60, 7, '#f6dca4', 0, 1, ikS) + nf(frieze(4, 5, 56, 3, 'checker', [LAP, RED])); return o + line('M32 4V-1', '#3b2a1a', 1.6); });
IN('pylon-tower', 'b', TALL, ['pylon', 'tower', 'ruin', 'obstacle'], (t) => { const fy = 120; let o = sh(32, fy, 28, 5) + drift(t, 50, fy - 1, 16, 4) + pylon(t, 6, 58, 30, fy, { seed: 41 }); o += path('M4 30L10 22L18 28L26 20L34 30L44 24L52 32L60 30V36H4Z', t.lg(['#f6dca4', '#e0b27e'], 90), 1, ikS) + path('M40 40L46 52L42 66L48 80', 'none', 1, { stroke: '#4a3220', 'stroke-width': 1.4, 'stroke-opacity': .7 }) + [[14, 116, 1.6], [50, 118, 1.4], [28, 120, 1]].map(([x, y, s]) => pebbleD(x, y, s, STN)).join(''); return o; });
// ============ great sphinx (128x128) and seated colossus ============
IN('sphinx-great', 'a', LG, ['sphinx', 'monument', 'landmark', 'signature', 'obstacle'], (t) => {
  const fy = 116; let o = sh(64, fy + 1, 60, 6) + drift(t, 20, fy - 2, 26, 5) + drift(t, 108, fy - 2, 18, 5);
  o += path('M8 112V96H120V112Z', t.lg(STN, 90), 1, ikS) + path('M8 96L14 90H126L120 96Z', '#fbe6b4', 1, ik(.9)) + nf(frieze(14, 100, 100, 6, 'checker', [LAP, RED]));
  o += path('M16 92Q10 70 28 62Q56 54 78 66L88 92Z', t.lg(['#fff0c4', '#dcae78', '#a87a4c'], 40), 1, ikS) + ell(34, 78, 14, 14, '#e6bd7e', .8) + path('M72 92V80H120V92Z', t.lg(['#f6dca4', '#dcae78', '#b8864e'], 90), 1, ikS) + line('M104 92v-10M112 92v-10', '#a87a4c', 1.2, .7) + line('M20 70Q40 62 62 68', '#fff', 1.4, .5) + line('M40 74l4 8M50 72l3 10', '#7a5238', 1, .4);
  o += path('M70 80L70 34Q70 14 92 14Q114 14 114 34L118 80Z', t.lg(['#7c9cf0', '#3558c0', '#1e3482'], 40), 1, ikL) + [0, 1, 2, 3, 4, 5, 6].map(i => line(`M71 ${24 + i * 8}H${i % 2 ? 116 : 113}`, GLD[1], 1.6, .8)).join('') + ell(94, 40, 12, 17, '#ecc08a', 1, 0, ik(.8)) + circ(99, 35, 1.8, '#2a1a10') + circ(90, 35, 1.8, '#2a1a10') + line('M88 33l-4 -2M101 33l4 -2', INKT, 1.2, .8) + path('M94 38l-2 8h4Z', '#c89868', 1) + line('M90 52q4 3 9 0', RED[2], 1.4, .9) + path('M88 14Q92 4 94 4Q96 4 96 14Z', GLD[1], 1, ink(GLD[2], .8, .9)) + path('M92 56Q94 70 90 78H98Q96 70 96 56Z', LAP[2], .9);
  o += path('M84 20Q80 40 84 56', 'none', 1, { stroke: '#7a5238', 'stroke-width': 1.2, 'stroke-opacity': .5 });
  return o;
});
IN('colossus-seated', 'a', LG, ['colossus', 'statue', 'monument', 'obstacle'], (t) => {
  const fy = 118; let o = sh(64, fy + 1, 44, 5) + drift(t, 24, fy - 2, 20, 4) + drift(t, 104, fy - 2, 18, 4);
  o += rect(26, 92, 76, 24, t.lg(STN, 90), 0, 1, ikS) + nf(frieze(30, 100, 68, 6, 'checker', [LAP, RED])) + path('M26 92L32 86H108L102 92Z', '#fbe6b4', 1, ik(.9));
  o += path('M36 92V74H56V92Z M72 92V74H92V92Z', t.lg(['#fff0c4', '#dcae78', '#a87a4c'], 0), 1, ikS) + path('M34 78H94V70H34Z', t.lg(['#f6dca4', '#dcae78', '#b8864e'], 90), 1, ikS) + path('M44 70H84L82 44H46Z', t.lg(['#fff0c4', '#dcae78', '#a87a4c'], 0), 1, ikS);
  o += path('M44 70H84L82 66H46Z', LIN[0], .9) + path('M46 44L40 66L44 74L48 66Z M82 44L88 66L84 74L80 66Z', t.lg(['#f6dca4', '#dcae78', '#a87a4c'], 0), 1, ikS) + path('M50 50H78L74 56L64 60L54 56Z', GLD[1], 1, ink(GLD[2], .8, .9)) + [54, 60, 66, 72].map((x, i) => circ(x + 1, 52 + (i % 2), 1.2, [LAP, RED][i % 2][1])).join('');
  o += path('M48 44V30Q48 16 64 16Q80 16 80 30V44Z', t.lg(['#7c9cf0', '#3558c0', '#1e3482'], 0), 1, ikL) + [0, 1, 2, 3].map(i => line(`M49 ${22 + i * 5.4}H79`, GLD[1], 1.4, .8)).join('') + ell(64, 30, 9, 11, '#ecc08a', 1, 0, ik(.8)) + circ(60.4, 28, 1.2, '#2a1a10') + circ(67.6, 28, 1.2, '#2a1a10') + line('M61 36q3 2 6 0', RED[2], 1.2, .9) + path('M62 18Q64 8 66 18Z', GLD[1], 1, ink(GLD[2], .6, .9)) + path('M56 42H72L70 52H58Z', '#c89868', 0);
  o += `<path d="M82 44L88 66H84L80 66Z" fill="${SHD}" opacity=".25"/>` + path('M70 44H82V70H70Z', SHD, .2) + line('M40 80H88', LAP[1], 1.4, .7);
  return o;
});
// ============ doorways, false door, niches (64x128) ============
const doorway = (t, open, v) => {
  const fy = 120; let o = sh(32, fy, 28, 4);
  o += rect(2, 16, 60, fy - 16, t.lg(['#fbe6b4', '#e6bd7e', '#b8864e'], 70), 0, 1, ikS) + cav(0, 64, 6, t) + rect(2, 12, 60, 6, t.lg(['#fff0c4', '#f0d098', '#d4a870'], 90), 0, 1, ikS) + path('M10 32Q20 22 32 30Q44 22 54 32Q44 30 32 34Q20 30 10 32Z', LAP[1], 1, ink(LAP[2], .6, .9)) + circ(32, 29, 3, RED[1], 1, ink(RED[2], .8, .9));
  o += `<path d="M44 16H62V${fy}H52Z" fill="${SHD}" opacity=".2"/>` + rect(8, 40, 8, fy - 40, '#fff', 0, .0);
  o += rect(12, 40, 40, fy - 40, '#1c1218', 1, 1, ink('#0c0a10', 1.2, .9));
  if (open) o += rect(16, 44, 32, fy - 44, t.lg(['#2a1c22', '#6a5040', '#c8a070'], 90), 0, 1) + path(`M20 ${fy}V90H44V${fy}Z`, '#fff0c0', .25) + [0, 1, 2].map(i => rect(14 + i * 1.5, fy - 5 - i * 5, 36 - i * 3, 4, '#c89a62', 0, .7 - i * .15)).join('') + path(`M12 ${fy}L12 40L8 44V${fy}Z`, t.lg(WOODS, 0), 1, ikS);
  else o += rect(13, 41, 19, fy - 41, t.lg(WOODS, 0), 0, 1, ink('#2a1a0a', 1, .9)) + rect(32, 41, 19, fy - 41, t.lg(WOODS, 0), 0, 1, ink('#2a1a0a', 1, .9)) + [56, 76, 96].map(y => line(`M13 ${y}H51`, '#3a2810', 1.4, .7)).join('') + [[19, 52], [45, 52], [19, 100], [45, 100]].map(([x, y]) => circ(x, y, 1.6, '#4a4448', 1, ink('#1a1618', .5, .9))).join('') + circ(29, 82, 2.4, GLD[1], 1, ink(GLD[2], .7, .9)) + circ(35, 82, 2.4, GLD[1], 1, ink(GLD[2], .7, .9)) + path('M32 42V' + (fy - 1), 'none', 1, { stroke: '#2a1a0a', 'stroke-width': 1.4 }) + GLYPH.ankh(22, 66, GLD[1], 1.2) + GLYPH.ankh(42, 66, GLD[1], 1.2);
  o += rect(2, 40, 10, fy - 40, t.lg(['#fff0c4', '#e6bd7e', '#a87a4c'], 0), 0, 1, ik(.8)) + rect(52, 40, 10, fy - 40, t.lg(['#fff0c4', '#e6bd7e', '#a87a4c'], 0), 0, 1, ik(.8)) + glyphRow(2, 12, 62, 2 + v, INKL, .6, 8, ['ankh', 'feather', 'djed']) + glyphRow(52, 62, 62, 4 + v, INKL, .6, 8, ['ankh', 'feather', 'djed']) + rect(2, 80, 10, 3, RED[1], 0, .9) + rect(52, 80, 10, 3, RED[1], 0, .9);
  return o + (v ? drift(t, 32, fy - 1, 26, 5) : '');
};
IN('doorway-hall', 'closed', TALL, ['doorway', 'door', 'closed', 'interior', 'obstacle'], (t) => doorway(t, false, 0));
IN('doorway-hall', 'open', TALL, ['doorway', 'door', 'open', 'interior'], (t) => doorway(t, true, 0));
IN('doorway-sand', 'a', TALL, ['doorway', 'buried', 'sand', 'interior'], (t) => doorway(t, true, 1) + drift(t, 32, 118, 28, 11) + drift(t, 20, 112, 16, 6));
IN('false-door', 'a', TALL, ['false-door', 'stele', 'painted', 'interior', 'obstacle'], (t) => { const fy = 120; let o = sh(32, fy, 26, 4) + rect(4, 12, 56, fy - 12, t.lg(['#fbe6b4', '#e6bd7e', '#b8864e'], 70), 0, 1, ikS) + cav(2, 62, 6, t); for (const [i, c] of [[0, RED], [1, LAP], [2, TQ]]) o += rect(8 + i * 5, 24 + i * 5, 48 - i * 10, fy - 30 - i * 5, 'none', 0, 1, { stroke: c[1], 'stroke-width': 3, 'stroke-opacity': .95 }); o += rect(22, 44, 20, fy - 46, '#2a1c22', 0, 1, ink('#0c0a10', 1, .9)) + rect(24, 46, 16, 10, LIN[0], 0, .9) + glyphRow(25, 39, 51, 51, INKL, .5, 6) + GLYPH.man(32, 76, GLD[1], 1.6) + glyphRow(10, 22, 40, 53, INKL, .5, 6) + glyphRow(42, 54, 40, 54, INKL, .5, 6) + rect(6, fy - 8, 52, 8, t.lg(STN, 90), 0, 1, ik(.8)) + path('M20 ' + (fy - 8) + 'L24 ' + (fy - 14) + 'H40L44 ' + (fy - 8) + 'Z', '#fbe6b4', 1, ik(.7)) + ell(32, fy - 16, 5, 2, '#c03a30', 1) + `<path d="M46 12H60V${fy}H50Z" fill="${SHD}" opacity=".18"/>`; return o; });
const niche = (t, lit) => { const fy = 120; let o = sh(32, fy, 24, 4) + rect(6, 20, 52, fy - 20, t.lg(['#fbe6b4', '#e6bd7e', '#b8864e'], 70), 0, 1, ikS) + cav(4, 60, 12, t) + path(`M14 ${fy - 8}V50Q14 30 32 30Q50 30 50 50V${fy - 8}Z`, t.lg(['#3a2a30', '#6a5048', '#2a1c22'], 90), 1, ik(1)) + path(`M18 ${fy - 8}V52Q18 36 32 36Q46 36 46 52V${fy - 8}Z`, t.lg(['#7a5a50', '#a88068', '#d8b088'], 90), .55) + rect(10, fy - 10, 44, 10, t.lg(STN, 90), 0, 1, ik(.8)) + nf(frieze(12, fy - 8, 40, 5, 'checker', [LAP, RED]));
  o += path(`M24 ${fy - 10}V${fy - 34}Q24 ${fy - 40} 32 ${fy - 40}Q40 ${fy - 40} 40 ${fy - 34}V${fy - 10}Z`, t.lg(['#7a7488', '#4a4654', '#221f2a'], 0), 1, ink('#0c0a10', 1, .9)) + path(`M26 ${fy - 40}Q32 ${fy - 52} 38 ${fy - 40}Z`, t.lg(BLK, 0), 1, ink('#0c0a10', .9, .9)) + path(`M28 ${fy - 50}L25 ${fy - 62}L31 ${fy - 52}ZM36 ${fy - 50}L39 ${fy - 62}L33 ${fy - 52}Z`, BLK[1], 1) + rect(25, fy - 34, 14, 3, GLD[1], 0, .9) + circ(32, fy - 46, 1, GLD[1]);
  if (lit) o += rect(46, fy - 34, 3, 24, '#3b2a1a', 0) + bowl(t, 12, fy - 10, 5, true, 8) + circ(32, fy - 36, 22, '#ffb040', .12); return o; };
IN('shrine-niche', 'a', TALL, ['shrine', 'niche', 'statue', 'interior', 'lit', 'light'], (t) => niche(t, true));
IN('shrine-niche', 'b', TALL, ['shrine', 'niche', 'statue', 'interior'], (t) => niche(t, false));
// ============ stairs (64x64): top-down in 3/4, treads light, risers dark ============
const stairs = (t, kind) => {
  let o = rect(0, 0, 64, 64, '#c89a62', 0, 1);
  const n = 6;
  for (let i = 0; i < n; i++) { const y = 2 + i * 10, tone = kind === 'up' ? 1 - (n - 1 - i) * .0 : 1; const dark = kind === 'up' ? (n - 1 - i) / n : i / n; o += rect(2, y, 60, 7, mixc('#fbe6b4', '#7a5448', kind === 'up' ? 0 : dark * .9 * 0 + dark * .55), 0, 1) + rect(2, y + 7, 60, 3, mixc('#c89a62', '#2a1c22', dark * .8), 0, 1) + line(`M2 ${y + 7}H62`, '#fff', .8, kind === 'up' ? .6 : .0); }
  o += rect(0, 0, 4, 64, t.lg(STN, 0), 0, 1, ik(.9)) + rect(60, 0, 4, 64, t.lg(['#e6bd7e', '#b8864e'], 0), 0, 1, ik(.9)) + rect(0, 0, 64, 64, 'none', 0, 1, ink(INKT, 1.4, .8)) + line('M4 2V64M60 2V64', INKT, 1, .5);
  if (kind === 'down') o += rect(4, 40, 56, 24, '#150e14', 0, .3) + rect(4, 52, 56, 12, '#150e14', 0, .3);
  return o;
};
const mixc = (a, b, u) => { const p = (s) => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * u).toString(16).padStart(2, '0')).join(''); };
IN('stairs-down', 'a', C, ['stairs', 'down', 'interior'], (t) => stairs(t, 'down'));
IN('stairs-up', 'a', C, ['stairs', 'up', 'interior'], (t) => stairs(t, 'up'));
const sandStairs = (t, v) => stairs(t, 'down') + path(v ? 'M4 64V44Q14 36 30 42Q46 34 60 44V64Z' : 'M4 64V30Q10 22 22 26Q34 28 40 38Q50 30 60 40V64Z', t.lg(['#fff0c0', '#f0d596', '#d4ac6c'], 70), .96, ink('#c9a468', .8, .6)) + ell(20, v ? 46 : 36, 9, 2.4, '#fffae0', .7, -10) + path(v ? 'M30 64Q40 52 60 54V64Z' : 'M38 64Q48 46 60 48V64Z', SHD, .15) + pebbleD(48, 60, 1, STN);
IN('stairs-sand', 'a', C, ['stairs', 'sand', 'choked', 'interior'], (t) => sandStairs(t, 0));
IN('stairs-sand', 'b', C, ['stairs', 'sand', 'choked', 'interior'], (t) => sandStairs(t, 1));
// ============ sarcophagus chamber (128x128), altar and chests ============
IN('sarcophagus-chamber', 'a', LG, ['sarcophagus', 'chamber', 'tomb', 'interior', 'obstacle'], (t) => {
  const fy = 116; let o = sh(64, fy + 1, 56, 6) + rect(4, 24, 120, 50, t.lg(['#f6dca4', '#e8c088', '#c89462'], 90), 0, 1) + rect(4, 20, 120, 5, '#fbe6b4', 0, 1, ikS) + nf(frieze(4, 21, 120, 3, 'checker', [LAP, RED])) + glyphRow(6, 122, 40, 71, INKL, .8, 13) + glyphRow(6, 122, 58, 73, RED[2], .7, 12, ['sun', 'eye', 'ankh', 'cobra']) + path('M0 74H128V120H0Z', t.lg(['#f2d9a4', '#ecd09a', '#dcb882'], 90), 1);
  o += path('M14 110L20 90H108L114 110Z', t.lg(STN, 90), 1, ikS) + path('M20 90L26 84H102L108 90Z', '#fbe6b4', 1, ik(.9)) + nf(frieze(18, 104, 92, 5, 'stripes', [RED, GLD, LAP]));
  o += path('M28 90L32 70H96L100 90Z', t.lg(BLK, 90), 1, ink('#0c0a10', 1.2, .9)) + path('M32 70L38 60H90L96 70Z', t.lg(['#7c9cf0', '#3558c0', '#1e3482'], 60), 1, ikL) + ell(44, 65, 6, 4.6, GLD[1], 1, 0, ink(GLD[2], .8, .9)) + glyphRow(54, 90, 65, 79, GLD[0], .6, 8, ['ankh', 'feather', 'eye', 'wave']) + glyphRow(36, 94, 80, 81, '#c8c2d2', .6, 9) + line('M34 68H94', GLD[1], 1, .5);
  o += [20, 108].map(x => bowl(t, x, 100, 8, true, 10)).join('') + [[8, RED], [120, LAP]].map(([x, c]) => line(`M${x} 70V26`, '#3b2a1a', 1.6, 1) + path(`M${x - 7} 34H${x + 7}V66L${x} 60L${x - 7} 66Z`, c[1], 1, ink(c[2], .9, .9))).join('') + [30, 98].map(x => jarT(t, x, 114, 1)).join('');
  return o;
});
IN('altar-sun', 'a', C, ['altar', 'sun', 'offering', 'obstacle'], (t) => sh(32, 56, 22, 4) + ell(32, 48, 22, 9, t.lg(STN, 90), 1, 0, ikS) + ell(32, 44, 18, 7, '#fbe6b4', 1, 0, ik(.8)) + ell(32, 40, 14, 12, GLD[1], 1, 0, ink(GLD[2], 1, .9)) + ell(32, 38, 9, 8, GLD[0], 1) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => line(`M${f(32 + Math.cos(i * .785) * 15)} ${f(40 + Math.sin(i * .785) * 13)}l${f(Math.cos(i * .785) * 4)} ${f(Math.sin(i * .785) * 3.4)}`, RED[1], 2, .9)).join('') + ell(32, 38, 3, 3, RED[1], 1));
const chest = (t, open) => { let o = sh(32, 54, 24, 4) + rect(8, 30, 48, 22, t.lg(['#d8a868', '#a07038', '#5a3c20'], 90), 2, 1, ink('#2a1a0a', 1, .9)) + [14, 32, 50].map(x => rect(x - 2, 30, 4, 22, LAP[1], 0, .9)).join('') + rect(8, 38, 48, 3, GLD[1], 0, .9);
  if (!open) o += path('M8 30Q8 14 32 14Q56 14 56 30Z', t.lg(['#e0b878', '#a87a40', '#5a3c20'], 90), 1, ink('#2a1a0a', 1, .9)) + [14, 32, 50].map(x => path(`M${x - 2} 28Q${x - 2} 16 ${x} 15Q${x + 2} 16 ${x + 2} 28Z`, LAP[1], .9)).join('') + circ(32, 30, 3, GLD[1], 1, ink(GLD[2], .8, .9)) + GLYPH.ankh(32, 22, GLD[0], .8);
  else o += path('M10 30Q12 8 32 6Q52 8 54 30Z', t.lg(['#d8a868', '#8a5a30', '#3a2410'], 20), 1, ink('#2a1a0a', 1, .9)) + ell(32, 30, 22, 5, '#1a1214', 1) + ell(32, 29, 20, 4, GLD[1], 1) + [0, 1, 2, 3, 4, 5, 6].map(i => circ(16 + i * 5.4, 28 + (i % 2), 1.8, i % 3 ? GLD[0] : [LAP, RED, TQ][i % 3][1], 1, ink(GLD[2], .4, .8))).join('') + circ(32, 20, 12, '#ffd35a', .16);
  return o; };
IN('chest-tomb', 'closed', C, ['chest', 'loot', 'closed', 'interest'], (t) => chest(t, false));
IN('chest-tomb', 'open', C, ['chest', 'loot', 'open', 'interest'], (t) => chest(t, true));
