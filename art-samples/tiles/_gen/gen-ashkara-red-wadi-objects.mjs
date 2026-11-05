// Ashkara sub-area 5 Red Wadi objects: trees (juniper, tamarisk, dead snags, caper, wild fig, oleander), rocks (hoodoo spires, boulders, rubble, slabs, balanced rock, natural arches, mesa buttes, scree),
// grass (wadi reeds, red tufts, thornbush) and props (rope ladders, cave mouths, flood debris, rock-cut steps, goats, jars, cairns, sconces). Runs on its own; helpers come from red-wadi-lib.mjs.
import { T, rng, f, ell, circ, rect, path, line, ink, sh, pebbleD, tuft, blobPath, pts, C, TALL, LG, tile, TER, DEEP, OCH, BLU, WOODS, ROPE, BONE, GRN, mound, rrock, rblock, bone, skull, jar, bands, dust } from './red-wadi-lib.mjs';

const TR = (n, v, size, tags, fn) => tile('trees', n, v, size, [...tags, size === TALL ? 'tall' : 'one', 'obstacle'], fn);
const RK = (n, v, size, tags, fn) => tile('rocks', n, v, size, [...tags, size === TALL ? 'tall' : size === LG ? 'large' : 'one', 'obstacle'], fn);
const GR = (n, v, size, tags, fn) => tile('grass', n, v, size, [...tags, size === TALL ? 'tall' : 'one'], fn);
const PR = (n, v, size, tags, fn) => tile('props', n, v, size, [...tags, size === TALL ? 'tall' : size === LG ? 'large' : 'one'], fn);
const wood = (t, ang = 0) => t.lg(WOODS, ang);
const red = (t, ang = 55) => t.lg(TER, ang);

// ================= trees =================
// twisted juniper: gnarled grey-brown trunk with dark green clumps, clinging to the rock
const juniper = (t, r, lean, clumps) => {
  const fy = 118; let o = sh(32, fy, 20, 5) + mound(t, 32, fy - 2, 22, 5.6);
  const tx = 32 + lean;
  o += path(`M24 ${fy - 3}Q${26 + lean * .4} ${fy - 22} ${30 + lean * .7} ${fy - 44}Q${tx - 6} ${fy - 62} ${tx - 2} 40L${tx + 4} 40Q${tx + 4} ${fy - 62} ${36 + lean * .7} ${fy - 44}Q${38 + lean * .4} ${fy - 22} 41 ${fy - 3}Z`, wood(t, 0), 1, ink('#3a2a1a', 1, .85));
  o += line(`M29 ${fy - 8}Q${30 + lean * .5} ${fy - 30} ${tx - 1} 48`, '#d8b080', 1, .5) + line(`M${tx - 8} ${fy - 50}q-8 -6 -12 -16`, '#5a3c20', 2.4, .9) + line(`M${tx + 6} ${fy - 60}q8 -6 12 -18`, '#5a3c20', 2.2, .9);
  const cl = [[tx, 30, 17, 11], [tx - 17, 50, 12, 8], [tx + 17, 44, 13, 9], [tx - 8, 66, 10, 7], [tx + 10, 72, 9, 6]].slice(0, clumps);
  for (const [cx, cy, rx, ry] of cl) { o += ell(cx + 1.5, cy + 2.4, rx, ry, '#2a3a2a', .2) + ell(cx, cy, rx, ry, t.lg(GRN, 60), 1, 0, ink('#2e4a2a', .8, .75)) + ell(cx - rx * .3, cy - ry * .3, rx * .5, ry * .4, '#d8e8a0', .5); for (let i = 0; i < 4; i++) o += circ(cx + r.range(-rx * .6, rx * .6), cy + r.range(-ry * .5, ry * .5), 1, '#6a8ab8', .9); }
  return o;
};
TR('juniper-twisted', 'a', TALL, ['juniper', 'green'], (t, r) => juniper(t, r, -3, 5));
TR('juniper-twisted', 'b', TALL, ['juniper', 'green'], (t, r) => juniper(t, r, 6, 4));
TR('juniper-twisted', 'c', TALL, ['juniper', 'green'], (t, r) => juniper(t, r, -8, 3));
// tamarisk of the wadi bed: feathery grey-green with pink plumes
const tama = (t, r, n, bloom) => {
  const fy = 52; let o = sh(30, fy, 15, 4) + mound(t, 32, fy - 1, 17, 4.4);
  o += path(`M29 ${fy - 2}Q28 ${fy - 12} 30 ${fy - 16}H34Q36 ${fy - 12} 35 ${fy - 2}Z`, wood(t, 0), 1, ink('#4a3a28', .9, .85));
  for (let i = 0; i < n; i++) { const cx = 32 + r.range(-14, 14), cy = fy - r.range(18, 34), rx = r.range(7, 11), ry = r.range(4, 6.5); o += ell(cx + 1.4, cy + 2, rx, ry, '#2f3a2a', .18) + ell(cx, cy, rx, ry, t.lg(['#d8e6c0', '#9ab88a', '#5a7e5a'], 60), 1, 0, ink('#3a5a3a', .7, .7)) + ell(cx - rx * .3, cy - ry * .3, rx * .45, ry * .4, '#eef6d8', .6);
    if (bloom) for (let k = 0; k < 4; k++) o += ell(cx + r.range(-rx * .7, rx * .7), cy + r.range(-ry, ry * .5), 1.8, 3.4, '#f0a0b8', .95, r.range(-30, 30)); }
  return o;
};
TR('tamarisk-wadi', 'a', C, ['shrub', 'green'], (t, r) => tama(t, r, 4, true));
TR('tamarisk-wadi', 'b', C, ['shrub', 'green'], (t, r) => tama(t, r, 3, false));
// bleached snag: dead trunk with broken limbs, red-grey wood
const snag = (t, r, lean, nb) => {
  const fy = 118; let o = sh(32, fy, 18, 5) + mound(t, 32, fy - 2, 22, 5.6);
  const tx = 32 + lean, ty = 30;
  o += path(`M25 ${fy - 4}Q27 ${fy - 40} ${tx - 4} ${ty}L${tx - 1} ${ty - 8}L${tx + 4} ${ty}Q37 ${fy - 40} 39 ${fy - 4}Z`, t.lg(['#e0cdb4', '#b49a80', '#7a6450'], 0), 1, ink('#4a3a28', 1, .85));
  o += line(`M31 ${fy - 10}Q${32 + lean * .3} ${fy - 44} ${tx} ${ty + 6}`, '#5a4634', 1, .5) + line(`M34 ${fy - 16}Q${35 + lean * .3} ${fy - 50} ${tx + 1} ${ty + 12}`, '#f6ead4', 1.2, .7);
  const br = [[ty + 16, -1, 16, -10], [ty + 34, 1, 14, -8], [ty + 52, -1, 11, -5], [ty + 24, 1, 12, -12]].slice(0, nb);
  for (const [y, d, l, up] of br) { const bx = tx + d * 3, ex = bx + d * l, ey = y + up; o += path(`M${bx} ${y + 2}Q${bx + d * l * .5} ${y + up * .3} ${ex} ${ey}L${ex + d} ${ey - 2}Q${bx + d * l * .5} ${y + up * .3 - 3} ${bx} ${y - 2}Z`, '#b49a80', 1, ink('#4a3a28', .8, .85)) + line(`M${ex} ${ey}l${d * 5} -4`, '#b49a80', 1.6, 1); }
  return o + ell(tx, ty + 1, 3.4, 1.4, '#4a3a28', .5);
};
TR('dead-snag', 'a', TALL, ['dead', 'tree'], (t, r) => snag(t, r, -3, 3));
TR('dead-snag', 'b', TALL, ['dead', 'tree'], (t, r) => snag(t, r, 5, 2));
// caper bush: sprawling green mat with white-pink flowers
const caper = (t, r, n, fl) => { const fy = 52; let o = sh(30, fy, 16, 4) + mound(t, 32, fy - 1, 16, 4); for (let i = 0; i < n; i++) { const cx = 32 + (i - (n - 1) / 2) * 10 + r.range(-2, 2), cy = fy - 10 - r.range(0, 8), rx = r.range(9, 12), ry = r.range(6, 8); o += ell(cx + 1.4, cy + 2, rx, ry, '#2f3a2a', .18) + ell(cx, cy, rx, ry, t.lg(['#d4e29a', '#86a85c', '#4a6e3a'], 60), 1, 0, ink('#2e4a2a', .7, .7)) + ell(cx - rx * .3, cy - ry * .3, rx * .45, ry * .4, '#eef6c0', .55); if (fl) for (let k = 0; k < 3; k++) { const x = cx + r.range(-rx * .6, rx * .6), y = cy + r.range(-ry * .6, ry * .3); o += [0, 72, 144, 216, 288].map(a => ell(x + Math.cos(a * .01745) * 1.6, y + Math.sin(a * .01745) * 1.6, 1.4, 1, '#fff', 1)).join('') + circ(x, y, .8, '#e8708c'); } } return o; };
TR('caper-bush', 'a', C, ['shrub', 'flower'], (t, r) => caper(t, r, 3, true));
TR('caper-bush', 'b', C, ['shrub', 'green'], (t, r) => caper(t, r, 2, false));
// wild fig rooted in a crack: pale roots over a red boulder
TR('wild-fig', 'a', TALL, ['fig', 'green', 'signature'], (t, r) => {
  const fy = 118; let o = rrock(t, r, 32, fy - 12, 26, 14, 3) + `<g>`;
  for (const [x0, x1] of [[22, 30], [30, 32], [42, 34]]) o += path(`M${x0} ${fy - 20}Q${x1 - 6} ${fy - 40} ${x1} ${fy - 60}L${x1 + 3} ${fy - 60}Q${x1 - 2} ${fy - 40} ${x0 + 3} ${fy - 20}Z`, '#c8a480', 1, ink('#6a4a30', .7, .8));
  o += `</g>` + path(`M28 ${fy - 60}Q30 ${fy - 80} 28 ${fy - 92}H38Q34 ${fy - 80} 36 ${fy - 60}Z`, wood(t, 0), 1, ink('#3a2a1a', .9, .85));
  for (const [cx, cy, rx, ry] of [[32, 24, 24, 14], [18, 40, 14, 9], [48, 38, 14, 9], [32, 46, 16, 8]]) o += ell(cx + 1.5, cy + 2.4, rx, ry, '#2a3a2a', .2) + ell(cx, cy, rx, ry, t.lg(['#b4d26a', '#6a9a48', '#3a6a38'], 60), 1, 0, ink('#2e4a2a', .8, .75)) + ell(cx - rx * .3, cy - ry * .3, rx * .5, ry * .4, '#d8f0a0', .5);
  for (const [x, y] of [[22, 34], [42, 30], [34, 44]]) o += circ(x, y, 2.2, '#8a5a8a', 1, ink('#4a2a4a', .6, .85)) + circ(x - .6, y - .6, .7, '#d8b0d8', .9);
  return o;
});
// wild oleander: pink-flowering shrub of the wadi bed
const olea = (t, r, col) => { const fy = 52; let o = sh(30, fy, 15, 4) + mound(t, 32, fy - 1, 16, 4); for (let i = 0; i < 3; i++) { const cx = 32 + (i - 1) * 11 + r.range(-2, 2), cy = fy - 14 - r.range(0, 8); o += ell(cx + 1.4, cy + 2, 10, 8, '#2f3a2a', .18) + ell(cx, cy, 10, 8, t.lg(['#a8c880', '#5a8a48', '#2e5a34'], 60), 1, 0, ink('#2e4a2a', .7, .7)); for (let k = 0; k < 5; k++) { const x = cx + r.range(-7, 7), y = cy + r.range(-6, 4); o += [0, 72, 144, 216, 288].map(a => ell(x + Math.cos(a * .01745) * 1.8, y + Math.sin(a * .01745) * 1.8, 1.7, 1.3, col, 1)).join('') + circ(x, y, .8, '#fff4c0'); } } return o; };
TR('oleander-wild', 'a', C, ['shrub', 'flower', 'pink'], (t, r) => olea(t, r, '#f08ca8'));
TR('oleander-wild', 'b', C, ['shrub', 'flower', 'white'], (t, r) => olea(t, r, '#fff6f0'));

// ================= rocks =================
// hoodoo: a spire of stacked red and ochre strata under a dark cap stone
const hoodoo = (t, r, h, segs, capW) => {
  const fy = 118, cx = 32; let o = sh(cx + 2, fy, 20, 5) + mound(t, cx, fy - 2, 24, 6);
  const cols = ['#e8b48a', '#c47e56', '#d9996e', '#a8664c', '#f0c8a4', '#8c4e36'];
  let y = fy - 4, k = 0; const seg = h / segs;
  for (let i = 0; i < segs; i++) {
    const wa = 15 - i * (7 / segs) + (i % 2 ? -3 : 1.5), wb = 15 - (i + 1) * (7 / segs) + ((i + 1) % 2 ? -3 : 1.5), y1 = y - seg;
    o += path(`M${f(cx - wa)} ${f(y)}L${f(cx - wb)} ${f(y1)}L${f(cx + wb)} ${f(y1)}L${f(cx + wa)} ${f(y)}Z`, cols[(k++ + (r() > .5 ? 1 : 0)) % cols.length], 1, ink('#5a2a20', .7, .6));
    o += path(`M${f(cx + wa * .35)} ${f(y)}L${f(cx + wb * .35)} ${f(y1)}L${f(cx + wb)} ${f(y1)}L${f(cx + wa)} ${f(y)}Z`, BLU[2], .28);
    o += line(`M${f(cx - wa + 2)} ${f(y - 1)}L${f(cx - wb + 2)} ${f(y1 + 1)}`, '#fbe0c4', 1, .5);
    y = y1;
  }
  const cy = y - 5;
  o += ell(cx + 2, cy + 5, capW + 2, 4, '#3b2a24', .22) + path(`M${f(cx - capW)} ${f(cy + 3)}Q${f(cx - capW - 2)} ${f(cy - 7)} ${f(cx - 4)} ${f(cy - 9)}Q${f(cx + capW)} ${f(cy - 9)} ${f(cx + capW + 1)} ${f(cy + 2)}Q${f(cx)} ${f(cy + 8)} ${f(cx - capW)} ${f(cy + 3)}Z`, t.lg(['#b8704c', '#8c4e36', '#5a2a20'], 55), 1, ink('#3a1a14', 1, .8)) + path(`M${f(cx - capW + 2)} ${f(cy)}Q${f(cx - capW)} ${f(cy - 6)} ${f(cx - 4)} ${f(cy - 8)}Q${f(cx - 6)} ${f(cy - 2)} ${f(cx - capW + 2)} ${f(cy)}Z`, '#e8b48a', .6);
  return o;
};
RK('hoodoo-spire', 'a', TALL, ['hoodoo', 'tall'], (t, r) => hoodoo(t, r, 78, 7, 15));
RK('hoodoo-spire', 'b', TALL, ['hoodoo', 'tall'], (t, r) => hoodoo(t, r, 62, 6, 13));
RK('hoodoo-spire', 'c', TALL, ['hoodoo', 'tall'], (t, r) => hoodoo(t, r, 88, 8, 11));
RK('hoodoo-spire', 'd', TALL, ['hoodoo', 'tall'], (t, r) => hoodoo(t, r, 50, 5, 16));
RK('red-boulder', 'a', C, ['boulder'], (t, r) => rrock(t, r, 32, 38, 20, 14, 3));
RK('red-boulder', 'b', C, ['boulder'], (t, r) => rrock(t, r, 30, 40, 16, 11, 2, DEEP) + rrock(t, r, 46, 46, 9, 6, 1));
RK('red-boulder', 'c', C, ['boulder', 'mossy'], (t, r) => rrock(t, r, 32, 38, 21, 15, 3) + ell(24, 28, 8, 3.4, '#8aa05c', .7) + ell(22, 27, 4, 1.6, '#c8d68a', .8));
RK('red-rubble', 'a', C, ['rubble'], (t, r) => [[22, 44, 9, 6], [40, 46, 10, 7], [32, 36, 8, 6], [48, 38, 6, 4]].map(([x, y, rx, ry]) => rrock(t, r, x, y, rx, ry, 1)).join(''));
RK('red-rubble', 'b', C, ['rubble'], (t, r) => mound(t, 32, 48, 22, 6) + [[26, 40, 8, 6], [40, 42, 7, 5], [34, 33, 6, 4.4]].map(([x, y, rx, ry]) => rrock(t, r, x, y, rx, ry, 1)).join(''));
RK('strata-slab', 'a', C, ['slab', 'strata'], (t, r) => { let o = sh(30, 50, 22, 4) + path('M8 46L14 22L46 18L56 40L48 50Z', t.lg(TER, 60), 1, ink('#5a2a20', 1, .8)); for (let i = 0; i < 4; i++) o += line(`M${10 + i} ${44 - i * 6}L${50 + i * 1.4} ${46 - i * 6}`, '#8c4e36', 1, .5); return o + path('M14 22L46 18L42 24L18 27Z', '#fbe0c4', .55) + path('M56 40L48 50L40 49L50 38Z', BLU[2], .3); });
RK('strata-slab', 'b', C, ['slab', 'strata'], (t, r) => { let o = sh(30, 50, 20, 4) + path('M10 48L12 28L40 20L54 30L50 48Z', t.lg(DEEP, 60), 1, ink('#3a1a14', 1, .8)); for (let i = 0; i < 3; i++) o += line(`M${12} ${44 - i * 7}L${52} ${42 - i * 7}`, '#e8b48a', 1, .45); return o + path('M12 28L40 20L36 27L15 33Z', '#f0c8a4', .5); });
RK('balanced-rock', 'a', TALL, ['hoodoo', 'balanced', 'tall'], (t, r) => { const fy = 118; return sh(32, fy, 20, 5) + mound(t, 32, fy - 2, 24, 6) + path(`M24 ${fy - 4}Q27 ${fy - 24} 29 ${fy - 40}H36Q38 ${fy - 24} 40 ${fy - 4}Z`, t.lg(TER, 0), 1, ink('#5a2a20', 1, .85)) + rrock(t, r, 32, fy - 54, 24, 14, 3, DEEP); });
// scree: loose chips spilled from a slope
RK('scree-slope', 'a', C, ['scree'], (t, r) => path('M2 54L2 40Q20 22 40 14L62 12V54Z', t.lg(['#e0b090', '#c08060', '#8c5038'], 70), 1, ink('#5a2a20', .7, .6)) + pts(r, 12, 6, 7).map(([x, y]) => pebbleD(x, y, r.range(.3, .5), ['#e8b48a', '#8c4e36'])).join(''));
RK('scree-slope', 'b', C, ['scree'], (t, r) => path('M62 54L62 40Q44 22 24 14L2 12V54Z', t.lg(['#e0b090', '#c08060', '#8c5038'], 110), 1, ink('#5a2a20', .7, .6)) + pts(r, 12, 6, 7).map(([x, y]) => pebbleD(x, y, r.range(.3, .5), ['#e8b48a', '#8c4e36'])).join(''));
// natural sandstone arch (128)
const arch = (t, r, wide) => {
  const o0 = `M6 116Q4 56 34 34Q64 12 96 32Q126 52 122 116Z`, hole = wide ? `M34 116Q32 76 64 62Q96 76 94 116Z` : `M42 116Q42 80 64 70Q86 80 86 116Z`, d = o0 + hole;
  const clip = t.clip(d);
  let o = sh(66, 116, 56, 6) + `<path d="${d}" fill="${t.lg(TER, 60)}" fill-rule="evenodd" stroke="#5a2a20" stroke-width="1.4" stroke-linejoin="round" stroke-opacity=".85"/>`;
  o += `<g clip-path="${clip}">` + bands(t, 0, 128, 14, 116, 7700 + (wide ? 1 : 0)).replace(/opacity="\.9"/g, 'opacity=".5"') + path('M0 0H128V128H0Z', 'none', 1) + path(`M80 30Q122 50 122 116H100Q104 60 70 40Z`, BLU[2], .28) + path('M6 116Q4 56 34 34Q50 22 66 20Q40 40 22 70Q14 90 18 116Z', '#fbe0c4', .32) + `</g>`;
  o += line(`M${wide ? 34 : 42} 116Q${wide ? 32 : 42} ${wide ? 76 : 80} 64 ${wide ? 62 : 70}`, '#5a2a20', 1.2, .6) + ell(64, 114, wide ? 24 : 17, 3, '#3b2a24', .16);
  for (const [x, y, s] of [[20, 112, 1], [108, 114, .9], [100, 108, .7]]) o += rrock(t, r, x, y, 8 * s, 5 * s, 1);
  return o;
};
RK('sandstone-arch', 'a', LG, ['arch', 'landmark', 'signature'], (t, r) => arch(t, r, true));
RK('sandstone-arch', 'b', LG, ['arch', 'landmark'], (t, r) => arch(t, r, false));
// mesa butte: flat-topped banded block with a talus skirt (128)
const butte = (t, r, tall, notch) => {
  const top = tall ? 14 : 30, d = `M18 116L26 ${top + 14}Q30 ${top} 46 ${top - 2}H82Q98 ${top} 102 ${top + 14}L112 116Z`, clip = t.clip(d);
  let o = sh(64, 116, 56, 6) + `<path d="${d}" fill="${t.lg(TER, 55)}" stroke="#5a2a20" stroke-width="1.4" stroke-linejoin="round" stroke-opacity=".85"/>`;
  o += `<g clip-path="${clip}">` + bands(t, 0, 128, top - 2, 116, 7800 + (tall ? 1 : 0)).replace(/opacity="\.9"/g, 'opacity=".55"') + path(`M84 ${top} L112 116H90Z`, BLU[2], .34) + path(`M18 116L26 ${top + 14}Q30 ${top} 46 ${top - 2}L44 116Z`, '#fbe0c4', .22) + `</g>`;
  o += path(`M30 ${top + 6}Q34 ${top - 3} 46 ${top - 4}H82Q96 ${top - 3} 99 ${top + 6}Q64 ${top + 14} 30 ${top + 6}Z`, '#f0d0a8', 1, ink('#8c4e36', .8, .7));
  if (notch) o += path(`M56 ${top - 2}L60 ${top + 26}L68 ${top + 26}L72 ${top - 2}Z`, '#6a3a30', .5);
  o += path('M10 116Q22 96 34 90L48 116Z', t.lg(['#e8c0a0', '#c08060'], 60), .95, ink('#5a2a20', .6, .6)) + path('M118 116Q106 98 94 92L82 116Z', t.lg(['#d8a888', '#a06848'], 60), .95, ink('#5a2a20', .6, .6));
  for (const [x, y] of [[20, 114], [40, 118], [92, 118], [112, 114]]) o += rrock(t, r, x, y - 2, 7, 4.4, 0);
  return o;
};
RK('mesa-butte', 'a', LG, ['mesa', 'landmark'], (t, r) => butte(t, r, false, true));
RK('mesa-butte', 'b', LG, ['mesa', 'landmark'], (t, r) => butte(t, r, true, false));

// ================= grass =================
const blades = (t, r, n, cols, h0 = 8, h1 = 16, w = 14) => { let o = ''; for (let i = 0; i < n; i++) { const x = 32 + r.range(-w, w), h = r.range(h0, h1), lean = r.range(-5, 5), c = cols[i % 3]; o += line(`M${f(x)} 50Q${f(x + lean * .4)} ${f(50 - h * .6)} ${f(x + lean)} ${f(50 - h)}`, c, 1.7, .95); } return ell(32, 51, 16, 3.4, '#3b2a24', .12) + o; };
GR('red-grass', 'a', C, ['grass', 'dry'], (t, r) => blades(t, r, 12, ['#e8d49a', '#b89a5c', '#8a7040']));
GR('red-grass', 'b', C, ['grass', 'dry'], (t, r) => blades(t, r, 9, ['#d8e0a0', '#98b068', '#5a7a3e'], 8, 18));
GR('dry-sedge', 'a', C, ['grass', 'pale'], (t, r) => blades(t, r, 13, ['#fffaf0', '#d8cfae', '#a89a78'], 10, 20));
GR('thornbush', 'a', C, ['shrub', 'thorn'], (t, r) => { const fy = 52; let o = sh(30, fy, 14, 4) + mound(t, 32, fy - 1, 14, 3.4); for (let i = 0; i < 9; i++) { const a = -150 + i * 15, A = a * .01745, l = r.range(12, 20), ex = 32 + Math.cos(A) * l, ey = fy - 2 + Math.sin(A) * l; o += line(`M32 ${fy - 2}Q${f(32 + Math.cos(A) * l * .5)} ${f(fy - 4 + Math.sin(A) * l * .6)} ${f(ex)} ${f(ey)}`, '#6a4a30', 1.8, .95) + line(`M${f(ex)} ${f(ey)}l${f(Math.cos(A) * 3)} ${f(Math.sin(A) * 3)}`, '#e8d49a', 1, 1); for (const u of [.4, .7]) o += circ(32 + Math.cos(A) * l * u, fy - 2 + Math.sin(A) * l * u, 1.3, '#7a9a54'); } return o; });
GR('thornbush', 'b', C, ['shrub', 'thorn'], (t, r) => { const fy = 52; let o = sh(30, fy, 15, 4) + mound(t, 32, fy - 1, 15, 3.6); for (let i = 0; i < 7; i++) { const cx = 32 + r.range(-12, 12), cy = fy - r.range(8, 22); o += ell(cx, cy, 6, 4, t.lg(['#b0c27a', '#6a8a4e', '#3e5e34'], 60), 1, 0, ink('#2e4a2a', .6, .7)) + line(`M${cx} ${cy}l${r.range(-5, 5)} -5`, '#e8d49a', 1, .9); } return o; });
GR('wadi-reed', 'a', TALL, ['reed', 'tall'], (t, r) => { const fy = 118; let o = sh(30, fy, 16, 4) + ell(32, fy - 1, 18, 4, '#7aa49a', .45); for (let i = 0; i < 10; i++) { const x = 32 + r.range(-12, 12), h = r.range(50, 94), lean = r.range(-9, 9); o += line(`M${f(x)} ${fy - 2}Q${f(x + lean * .3)} ${f(fy - h * .6)} ${f(x + lean)} ${f(fy - h)}`, ['#b8d08a', '#8aa860', '#5a7a44'][i % 3], 2, .95); if (i % 4 === 0) o += ell(x + lean, fy - h - 2, 1.8, 5, '#8a6238', 1, lean * 2); } return o; });
GR('wadi-reed', 'b', TALL, ['reed', 'tall', 'dry'], (t, r) => { const fy = 118; let o = sh(30, fy, 14, 4) + ell(32, fy - 1, 16, 4, '#7aa49a', .4); for (let i = 0; i < 8; i++) { const x = 32 + r.range(-10, 10), h = r.range(40, 80), lean = r.range(-8, 8); o += line(`M${f(x)} ${fy - 2}Q${f(x + lean * .3)} ${f(fy - h * .6)} ${f(x + lean)} ${f(fy - h)}`, ['#e8d49a', '#c8aa6a', '#9a8048'][i % 3], 2, .95); } return o; });
GR('desert-gourd', 'a', C, ['plant', 'fruit'], (t, r) => { let o = sh(30, 50, 18, 4) + mound(t, 32, 49, 16, 3); for (const [x, y, s] of [[20, 44, .9], [34, 40, 1.1], [46, 46, .8]]) o += line(`M${x} ${y}q${r.range(-8, 8)} -8 ${r.range(-10, 10)} -14`, '#6a8a4e', 1.4, .9) + ell(x, y, 6 * s, 5 * s, t.lg(['#f6e08a', '#e8b83e', '#a87a24'], 60), 1, 0, ink('#6a4a14', .8, .85)) + ell(x - 2 * s, y - 2 * s, 2 * s, 1.4 * s, '#fff6c0', .8); return o + ell(26, 34, 8, 4, '#8aa05c', .9) + ell(40, 32, 7, 3.6, '#6a8a4e', .9); });

// ================= props =================
// rope ladder up a cliff ledge (tall)
const ladder = (t, r, lean, rungs) => {
  const fy = 120; let o = sh(32, fy, 22, 4);
  o += path(`M12 ${fy}V30Q12 14 32 12Q52 14 52 30V${fy}Z`, t.lg(TER, 0), 1, ink('#5a2a20', 1, .8)) + bands(t, 13, 51, 22, fy - 4, 7900).replace(/opacity="\.9"/g, 'opacity=".4"') + path(`M40 22Q52 30 52 ${fy}H44Q46 60 40 22Z`, BLU[2], .3) + path(`M12 ${fy}V30Q12 14 32 12Q22 20 20 40V${fy}Z`, '#fbe0c4', .22);
  const x0 = 24 + lean, x1 = 40 + lean;
  o += rect(18 + lean, 16, 28, 5, '#8a6238', 1, 1, ink('#3a2a1a', .8, .85)) + circ(24 + lean, 18, 2, '#3a2a1a') + circ(40 + lean, 18, 2, '#3a2a1a');
  o += line(`M${x0} 20Q${x0 + 1.4} 70 ${x0 - 1} ${fy - 6}`, '#3b2a1a', 2.6, .9) + line(`M${x1} 20Q${x1 + 1.4} 70 ${x1 - 1} ${fy - 6}`, '#3b2a1a', 2.6, .9) + line(`M${x0} 20Q${x0 + 1.4} 70 ${x0 - 1} ${fy - 6}`, '#e0c88c', 1.2, 1) + line(`M${x1} 20Q${x1 + 1.4} 70 ${x1 - 1} ${fy - 6}`, '#e0c88c', 1.2, 1);
  for (let i = 0; i < rungs; i++) { const y = 28 + i * ((fy - 36) / rungs), dx = 1.4 * (y - 20) / 100; o += rect(x0 + dx - 1, y, x1 - x0 + 2, 3.6, t.lg(WOODS, 90), .8, 1, ink('#3a2a1a', .7, .85)); }
  return o;
};
PR('rope-ladder', 'a', TALL, ['ladder', 'cliff', 'signature', 'tall'], (t, r) => ladder(t, r, 0, 12));
PR('rope-ladder', 'b', TALL, ['ladder', 'cliff', 'tall'], (t, r) => ladder(t, r, 4, 9));
// cave mouth in a rock mass
const cave = (t, r, wide) => sh(30, 54, 24, 4) + path('M6 54Q4 22 24 12Q42 6 54 20Q62 34 58 54Z', t.lg(TER, 60), 1, ink('#5a2a20', 1, .85)) + path('M6 54Q4 22 24 12Q16 28 16 54Z', '#fbe0c4', .3) + path('M54 20Q62 34 58 54H48Q52 34 46 18Z', BLU[2], .3) +
  path(`M${wide ? 16 : 20} 54Q${wide ? 16 : 20} 30 32 28Q${wide ? 48 : 44} 30 ${wide ? 48 : 44} 54Z`, '#2a1814', 1, ink('#1a0c08', 1.2, .9)) + path(`M${wide ? 20 : 24} 54Q${wide ? 20 : 24} 36 32 34Q${wide ? 44 : 40} 36 ${wide ? 44 : 40} 54Z`, '#140a08', .9) + ell(32, 52, wide ? 14 : 10, 2.4, '#e8b48a', .6) + line('M20 30Q32 22 44 30', '#8c4e36', 1.2, .5) + (wide ? '' : circ(37, 46, 1.2, '#ffe6a0', .9) + circ(28, 48, 1, '#ffe6a0', .9));
PR('cave-mouth', 'a', C, ['cave', 'dark', 'signature', 'obstacle'], (t, r) => cave(t, r, true));
PR('cave-mouth', 'b', C, ['cave', 'dark', 'obstacle'], (t, r) => cave(t, r, false));
// flash-flood debris: tangled logs, branches, a broken pot, mud
const log = (x, y, a, l, th = 4) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">` + ell(1.4, 2, l / 2, th * .5, '#3b2a24', .16) + rect(-l / 2, -th / 2, l, th, '#8a6238', th / 2, 1, ink('#3a2a1a', .8, .85)) + line(`M${-l / 2 + 2} ${-th * .2}H${l / 2 - 2}`, '#d0a870', .8, .7) + ell(-l / 2, 0, th * .3, th * .5, '#e8c890', 1, 0, ink('#3a2a1a', .6, .85)) + `</g>`;
PR('flood-debris', 'a', C, ['debris', 'flood'], (t, r) => ell(32, 46, 24, 6, '#b8866a', .6) + log(26, 42, -14, 26, 5) + log(38, 40, 22, 22, 4) + log(32, 36, 78, 14, 3.4) + jar(t, 46, 50, .8) + [[14, 48], [52, 48]].map(([x, y]) => line(`M${x} ${y}l${r.range(-6, 6)} -6`, '#6a4a30', 1.4, .9)).join(''));
PR('flood-debris', 'b', C, ['debris', 'flood'], (t, r) => ell(32, 46, 24, 6, '#b8866a', .6) + [[20, 44, 10], [34, 42, -30], [44, 46, 40], [28, 36, 64]].map(([x, y, a]) => log(x, y, a, r.range(14, 24), r.range(2.4, 4))).join('') + bone(48, 50, 9, 20) + tuftBundle());
PR('flood-debris', 'c', C, ['debris', 'flood'], (t, r) => ell(32, 46, 22, 6, '#b8866a', .6) + log(32, 40, 4, 34, 6) + log(24, 34, -20, 18, 3.4) + [[14, 50], [50, 50], [34, 50]].map(([x, y]) => pebbleD(x, y, .6, ['#e8b48a', '#8c4e36'])).join(''));
function tuftBundle() { return line('M14 48Q20 38 24 46M16 50Q22 40 28 48', '#8aa05c', 1.6, .9); }
PR('driftwood', 'a', C, ['wood'], (t, r) => mound(t, 32, 50, 18, 3.4) + log(30, 44, -8, 40, 6) + log(42, 38, 28, 16, 3));
PR('driftwood', 'b', C, ['wood'], (t, r) => mound(t, 32, 50, 16, 3) + log(28, 44, 14, 30, 5) + log(40, 46, -18, 22, 4));
// rock-cut steps climbing diagonally
const steps = (t, flip) => { let o = sh(30, 54, 24, 3.6); for (let i = 0; i < 4; i++) { const x = flip ? 44 - i * 9 : 8 + i * 9, y = 50 - i * 8; o += rblock(t, x, y, 18, 8, 4); } return o; };
PR('rock-cut-steps', 'a', C, ['stairs', 'rock-cut', 'signature'], (t) => steps(t, false));
PR('rock-cut-steps', 'b', C, ['stairs', 'rock-cut'], (t) => steps(t, true));
// goats
const goat = (t, pose) => {
  let o = ell(32, 52, 16, 3, '#3b2a24', .2);
  const hy = pose === 'graze' ? 38 : 28, hx = pose === 'graze' ? 14 : 16;
  o += [[22, 0], [26, 1], [40, 0], [44, 1]].map(([x, k]) => rect(x - 1.2, 40, 2.4, 11, k ? '#6a5a50' : '#8a7a6c', 1, 1, ink('#3a2a20', .5, .8))).join('');
  o += ell(32, 38, 15, 8.5, t.lg(['#f4ecdc', '#d8c8ae', '#a89478'], 70), 1, 0, ink('#6a5a44', .9, .85)) + ell(26, 34, 7, 3.4, '#fffaf0', .6);
  o += path(`M${hx + 4} ${hy + 5}Q${hx + 6} ${hy - 3} ${hx + 8} ${hy - 6}L${hx + 18} ${hy + 4}Z`, '#e4d8c0', 1, ink('#6a5a44', .8, .85)) + ell(hx + 4, hy + 4, 6.4, 4.6, '#efe4cc', 1, 0, ink('#6a5a44', .8, .85)) + circ(hx + 4, hy + 2, 1, '#2a1a10') + path(`M${hx + 6} ${hy - 2}Q${hx + 10} ${hy - 12} ${hx + 16} ${hy - 10}`, 'none', 1, { stroke: '#8a7a64', 'stroke-width': 2, 'stroke-linecap': 'round' }) + line(`M${hx + 1} ${hy + 8}l-1 4`, '#d8c8ae', 1.2, 1);
  return o + line('M47 34q4 -2 5 -6', '#d8c8ae', 2.2, 1);
};
PR('goat', 'a', C, ['animal', 'goat'], (t) => goat(t, 'stand'));
PR('goat', 'b', C, ['animal', 'goat'], (t) => goat(t, 'graze'));
PR('clay-jar', 'a', C, ['pottery', 'jar'], (t) => jar(t, 32, 50, 2.2));
PR('clay-jar', 'b', C, ['pottery', 'jar'], (t) => jar(t, 22, 50, 1.6) + jar(t, 44, 50, 1.9));
PR('cairn-red', 'a', C, ['cairn', 'marker'], (t, r) => mound(t, 32, 52, 14, 3.4) + [[32, 48, 12, 6], [32, 40, 9, 5], [32, 33, 6.4, 4], [32, 28, 3.6, 2.8]].map(([x, y, rx, ry]) => ell(x + .8, y + 1.4, rx, ry, '#3b2a24', .15) + ell(x, y, rx, ry, t.lg(TER, 55), 1, 0, ink('#5a2a20', .8, .85)) + ell(x - rx * .3, y - ry * .3, rx * .4, ry * .3, '#fbe0c4', .6)).join(''));
PR('cairn-red', 'b', C, ['cairn', 'marker'], (t, r) => mound(t, 32, 52, 12, 3) + [[26, 48, 9, 5], [38, 48, 8, 5], [32, 41, 8, 4.6], [32, 34, 5, 3.4]].map(([x, y, rx, ry]) => ell(x + .8, y + 1.4, rx, ry, '#3b2a24', .15) + ell(x, y, rx, ry, t.lg(DEEP, 55), 1, 0, ink('#3a1a14', .8, .85)) + ell(x - rx * .3, y - ry * .3, rx * .4, ry * .3, '#e8b48a', .6)).join('') + line('M32 30V22', '#e0c88c', 1.2, 1) + path('M32 22L40 25L32 28Z', '#d8503a', 1, ink('#7a1e24', .6, .85)));
PR('offering-bowl', 'a', C, ['altar', 'bowl'], (t) => sh(30, 52, 14, 3.6) + path('M16 50V34H48V50Z', t.lg(TER, 20), 1, ink('#5a2a20', .9, .85)) + ell(32, 34, 16, 5, '#f0c8a4', 1, 0, ink('#5a2a20', .9, .85)) + ell(32, 34, 11, 3.4, '#5a3028') + ell(32, 33, 7, 2, '#f3c24f', .8) + circ(29, 32.6, 1.4, '#f3c24f') + circ(34, 33, 1.2, '#d8503a'));
PR('carved-niche', 'a', C, ['niche', 'rock-cut'], (t, r) => path('M10 54V16Q32 6 54 16V54Z', t.lg(TER, 60), 1, ink('#5a2a20', 1, .85)) + path('M22 54V30Q32 20 42 30V54Z', '#3a2018', 1, ink('#1a0c08', 1, .9)) + path('M26 54V33Q32 26 38 33V54Z', '#5a3028') + path('M44 16Q54 20 54 54H48Q50 24 44 16Z', BLU[2], .3) + ell(32, 54, 11, 2, '#e8b48a', .6) + path('M26 20L32 14L38 20Z', '#f3c24f', 1, ink('#a07a20', .7, .85)));
const sconce = (t, lit) => sh(30, 54, 10, 3) + path('M24 54V22H40V54Z', t.lg(TER, 0), 1, ink('#5a2a20', .9, .85)) + rect(20, 14, 24, 9, t.lg(TER, 55), 1, 1, ink('#5a2a20', .9, .85)) + path('M20 14L24 9H48L44 14Z', '#f0c8a4', 1, ink('#5a2a20', .8, .8)) + ell(32, 14, 8, 2.4, '#3a2018') + (lit ? ell(32, 8, 6, 8, 'rgba(255,200,90,.35)') + path('M32 14Q26 8 30 0Q32 6 36 2Q38 8 32 14Z', '#ffb02e', 1, ink('#c8501a', .6, .8)) + path('M32 13Q29 9 31 5Q33 8 34 6Q35 10 32 13Z', '#fff2a0') : line('M28 13Q30 9 34 11', '#3a2a20', 1.6, .7));
PR('torch-sconce', 'a', C, ['light', 'lit', 'rock-cut'], (t) => sconce(t, true));
PR('torch-sconce', 'b', C, ['light', 'unlit', 'rock-cut'], (t) => sconce(t, false));
PR('signpost-wadi', 'a', C, ['sign'], (t, r) => sh(30, 52, 10, 3) + mound(t, 32, 51, 12, 2.8) + path('M30 50V12H34V50Z', wood(t, 0), 1, ink('#3a2a1a', .9, .85)) + path('M34 16H52L56 20L52 24H34Z', wood(t, 90), 1, ink('#3a2a1a', .8, .85)) + path('M30 28H14L10 32L14 36H30Z', wood(t, 90), 1, ink('#3a2a1a', .8, .85)) + line('M38 20H48M16 32H26', '#f3c24f', 1.2, .9));
PR('water-skin', 'a', C, ['loot', 'camp'], (t) => mound(t, 32, 51, 13, 3) + path('M22 48Q18 34 28 28L34 28Q44 32 42 48Q32 54 22 48Z', t.lg(['#d8a070', '#a8683c', '#6a3a20'], 20), 1, ink('#3a1a0c', .9, .85)) + path('M28 28Q30 20 34 20Q36 24 34 28Z', '#8a5a34', 1, ink('#3a1a0c', .8, .85)) + line('M24 40Q32 44 40 40', '#6a3a20', 1, .6) + ell(27, 38, 3, 5, '#f4d8b8', .5, -14));
