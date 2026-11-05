// Ashkara sub-area 4 Salt Mirror interest objects: the blinding salt lake with its mirage island (landmark), the salt-block gate (closed/open), salt works, mining shack,
// ore hoist, wrecked carts, salt-pillar grove, caravan remains, brine spring, salt statues, obelisk, crystal cave and chests. Runs on its own; helpers come from salt-mirror-lib.mjs.
import { T, rng, f, ell, circ, rect, path, line, ink, D, sh, tuft, blobPath, C, TALL, LG, tile, SLT, CLD, PNK, IRON, RUST, WOODS, BONE, mound, crust, crystal, bone, rib, skull, hornSkull, srock, SROCK, sblock, mix, glare } from './salt-mirror-lib.mjs';

const IN = (n, v, size, tags, fn) => tile('interest', n, v, size, [...tags, size === LG ? 'large' : size === TALL ? 'tall' : 'one'], fn);
const wood = (t, ang = 0) => t.lg(WOODS, ang);
const salty = (t, ang = 0) => t.lg(['#ffffff', '#e8dfd4', '#a89aa4'], ang);
const iron = (t, ang = 0) => t.lg(['#d89a74', '#a8603c', '#6a3a24'], ang);
// ===== landmark: the salt lake with a mirage island =====
const mpalm = (x, y, h, lean, op) => `<g opacity="${op}">` + path(`M${x - 1} ${y}Q${x + lean * .4} ${y - h * .5} ${x + lean} ${y - h}L${x + lean + 1.4} ${y - h}Q${x + lean * .4 + 2} ${y - h * .5} ${x + 1} ${y}Z`, '#6a8a74') + [-60, -20, 20, 60, 100, 140, 180].map(a => { const A = a * Math.PI / 180; return line(`M${f(x + lean)} ${f(y - h)}q${f(Math.cos(A) * 5)} ${f(Math.sin(A) * 4 - 3)} ${f(Math.cos(A) * 9)} ${f(Math.sin(A) * 6 + 2)}`, '#5f8a6a', 1.8, 1); }).join('') + `</g>`;
const lakeScene = (t, v) => {
  let o = ell(64, 118, 60, 6, '#e690a8', .25);
  const body = 'M4 90Q2 46 34 38Q64 30 94 38Q126 46 124 90Q64 106 4 90Z';
  o += `<path d="${body}" fill="${t.lg(['#fbfeff', '#dcebf3', '#a8c8dc'], 90)}" stroke="#e690a8" stroke-opacity=".7" stroke-width="3"/>`;
  o += `<path d="${body}" fill="none" stroke="#fff" stroke-width="1.4" transform="translate(0 -1)"/>`;
  // the horizon haze and the mirror streaks
  o += ell(64, 46, 52, 5, '#fff', .8) + ell(64, 49, 40, 3, '#e8f2f8', .7);
  for (let i = 0; i < 7; i++) o += line(`M${14 + (i * 13) % 30} ${58 + i * 5}q10 -2 20 0t20 0t20 0t10 0`, i % 2 ? '#fff' : '#8aaabf', 1.2, i % 2 ? .8 : .3);
  const ix = v === 'a' ? 64 : 48, iy = 52;
  // mirage island floats above the haze, with its inverted reflection beneath
  const isl = (x, y, s, op) => `<g opacity="${op}">` + ell(x, y + 2, 20 * s, 3.4 * s, '#8aa0a8', .5) + path(`M${x - 18 * s} ${y + 2}Q${x - 10 * s} ${y - 10 * s} ${x} ${y - 9 * s}Q${x + 10 * s} ${y - 10 * s} ${x + 18 * s} ${y + 2}Z`, '#b8a890', 1) + path(`M${x - 4 * s} ${y + 2}Q${x + 4 * s} ${y - 9 * s} ${x + 18 * s} ${y + 2}Z`, '#8a7a68', .5) + `</g>` + mpalm(x - 8 * s, y - 4 * s, 18 * s, -3, op) + mpalm(x + 4 * s, y - 6 * s, 24 * s, 3, op) + (v === 'a' ? mpalm(x + 12 * s, y - 2 * s, 14 * s, 4, op) : path(`M${x + 6 * s} ${y - 6 * s}V${y - 22 * s}H${x + 12 * s}V${y - 6 * s}Z`, '#c8b8a0', op, ink('#8a7a68', .6, op)) + path(`M${x + 5 * s} ${y - 22 * s}L${x + 9 * s} ${y - 28 * s}L${x + 13 * s} ${y - 22 * s}Z`, '#b0524a', op));
  o += `<g transform="translate(0 ${2 * (iy + 6)}) scale(1 -1)" opacity=".28">${isl(ix, iy, 1, 1)}</g>`;
  o += isl(ix, iy - 4, 1, .92);
  if (v === 'b') o += isl(100, iy + 8, .5, .75);
  for (let i = 0; i < 6; i++) o += line(`M${ix - 28 + (i * 7) % 12} ${iy + 3 + i * 1.6}q14 -2 28 0t28 0`, '#fff', 1.4, .75 - i * .08);
  // salt crust foreground with pink brine pools
  o += path('M0 128V98Q20 88 40 96T84 94T128 98V128Z', salty(t, 80), 1, ink('#a89aa4', .9, .6)) + path('M0 128V108Q30 100 64 108T128 106V128Z', '#e8dfd4', .5);
  o += [[22, 108, 12, 3.4], [98, 112, 16, 4]].map(([x, y, rx, ry]) => ell(x, y, rx, ry, '#f0a6bc', 1, 0, ink('#fff', 1.6, .95)) + ell(x - 2, y - 1, rx * .6, ry * .5, '#fbd5de', .8)).join('');
  o += crystal(60, 112, 10, 3.4, -10) + crystal(66, 114, 7, 3, 12) + bone(40, 118, 10, 14) + skull(88, 100, .6, 10);
  return o;
};
IN('salt-lake-mirage', 'a', LG, ['landmark', 'lake', 'mirage', 'salt', 'signature', 'obstacle'], (t) => lakeScene(t, 'a'));
IN('salt-lake-mirage', 'b', LG, ['landmark', 'lake', 'mirage', 'salt', 'signature', 'obstacle'], (t) => lakeScene(t, 'b'));
// ===== gate: salt-block gate =====
const blockCol = (t, x, fy, rows, w = 20, h = 11) => { let o = ''; for (let i = 0; i < rows; i++) o += sblock(t, x - w / 2 + (i % 2 ? 1.4 : -1), fy - (i + 1) * h, w, h - .4, 4); return o; };
const gate = (t, open) => {
  const fy = 114; let o = sh(64, fy + 1, 58, 6) + ell(64, fy, 60, 6, t.lg(SLT, 70), .95) + ell(98, fy + 2, 22, 4, CLD[1], .2) + ell(64, fy + 3, 40, 3, '#e690a8', .25);
  const lx = 30, rx = 98;
  if (!open) {
    o += path(`M${lx + 11} ${fy - 4}V50Q64 34 ${rx - 11} 50V${fy - 4}Z`, t.lg(['#f6ebe0', '#d8c8c0', '#a89aa4'], 0), 1, ink('#6e6480', 1, .85));
    for (let y = 62; y < fy - 6; y += 14) o += line(`M${lx + 12} ${y}H${rx - 12}`, '#a89aa4', 1, .6) + line(`M${lx + 12} ${y - 1}H${rx - 12}`, '#fff', .8, .7);
    for (let x = 44; x < 90; x += 18) o += line(`M${x} 50V${fy - 6}`, '#a89aa4', 1, .45);
    o += circ(64, 76, 12, '#f0a6bc', 1, ink('#8e3a5e', 1, .85)) + circ(64, 76, 7, '#fbd5de', 1, ink('#b4566f', .8, .8)) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => line(`M${f(64 + Math.cos(i * .785) * 13)} ${f(76 + Math.sin(i * .785) * 13)}l${f(Math.cos(i * .785) * 5)} ${f(Math.sin(i * .785) * 5)}`, '#e06a90', 1.6, 1)).join('');
    o += rect(58, 96, 12, 14, '#62503a', 1, 1, ink('#3a2a1a', .8, .85)) + circ(64, 103, 2.2, '#e06a90');
  } else {
    o += path(`M${lx + 11} ${fy - 4}V50Q64 34 ${rx - 11} 50V${fy - 4}Z`, t.lg(['#fbfeff', '#e8dcd0', '#d8c7b4'], 90), 1);   // bright pan beyond the opened door
    o += path(`M${lx + 11} 50Q64 34 ${rx - 11} 50V76Q64 62 ${lx + 11} 76Z`, '#9a98b8', .3) + ell(64, fy - 10, 18, 4, '#fff', .8) + line('M44 98Q64 88 84 98', '#c9bcab', 1.4, .5) + line('M50 90Q64 84 78 90', '#e690a8', 1.2, .4);
    o += path(`M${lx + 11} 50V${fy - 4}H${lx + 21}V56Z`, '#a89aa4', .6) + [[34, 96], [90, 100]].map(([x, y]) => crystal(x, y, 12, 4, 8)).join('');
  }
  for (const x of [lx, rx]) o += blockCol(t, x, fy, 8, 22, 11.4);
  o += sblock(t, lx - 12, 26, 24 + 8, 11, 4) + sblock(t, rx - 12, 26, 24 + 8, 11, 4);
  o += sblock(t, lx - 12, 38 - 11, 80 + 8, 11, 5).replace('', '');
  // lintel with the brine-pink sun disc and a stepped crown
  o += sblock(t, 48, 15, 32, 11, 4) + circ(64, 22, 4.4, '#f0a6bc', 1, ink('#8e3a5e', .8, .85)) + sblock(t, 56, 5, 16, 10, 3);
  o += [[lx + 2, 24], [rx + 2, 24]].map(([x, y]) => crystal(x, y, 10, 3.4, -8)).join('') + crystal(64, 6, 8, 3, 0);
  if (open) o += [[16, 108], [112, 104]].map(([x, y]) => ell(x, y, 8, 2.4, '#fff', .9)).join('');
  return o;
};
IN('gate-salt-block', 'closed', LG, ['gate', 'closed', 'salt', 'signature', 'obstacle'], (t) => gate(t, false));
IN('gate-salt-block', 'open', LG, ['gate', 'open', 'salt', 'signature'], (t) => gate(t, true));
// ===== salt works: evaporation pans with sluices =====
IN('salt-works', 'a', LG, ['salt-works', 'brine', 'camp', 'obstacle'], (t, r) => {
  let o = ell(64, 116, 58, 6, '#3b3a24', .12);
  const pan = (x, y, w, h, c0, c1) => path(`M${x} ${y}L${x + w} ${y}L${x + w + 6} ${y + h}L${x - 6} ${y + h}Z`, wood(t, 90), 1, ink('#3a2a1a', 1, .85)) + path(`M${x + 3} ${y + 2}L${x + w - 3} ${y + 2}L${x + w + 1} ${y + h - 3}L${x - 1} ${y + h - 3}Z`, c0, 1, ink(c1, .7, .8)) + ell(x + w / 2, y + h / 2, w * .35, h * .2, '#fff', .55);
  o += pan(8, 62, 40, 22, '#f0a6bc', '#8e3a5e') + pan(60, 58, 44, 24, '#f6dce2', '#b4566f') + pan(14, 90, 44, 22, '#fff', '#a89aa4') + pan(70, 90, 40, 22, '#f8f2ea', '#a89aa4');
  o += path('M48 72H60M54 112H64', 'none', 1, { stroke: '#e690a8', 'stroke-width': 3, 'stroke-opacity': .7 }) + rect(47, 66, 13, 10, wood(t, 0), 1, 1, ink('#3a2a1a', .8, .85)) + path('M52 32L52 56M58 32V56', 'none', 1, { stroke: '#62503a', 'stroke-width': 2 });
  // windpump
  o += rect(98, 30, 4, 34, '#8a8084', 0, 1, ink('#2a2024', .8, .85)) + [0, 1, 2, 3, 4, 5].map(i => `<g transform="translate(100 28) rotate(${i * 60 + 12})">${path('M0 0L3 -14L-3 -14Z', '#d8cfd0', 1, ink('#6a6064', .6, .85))}</g>`).join('') + circ(100, 28, 2.4, '#4a4448') + path('M96 64L100 40L104 64Z', '#6a5a44', .7);
  // piles and a rake
  o += [[26, 52, 11], [80, 46, 9]].map(([x, y, rr]) => ell(x, y + 4, rr * 1.2, rr * .45, '#3b3a24', .15) + path(`M${x - rr} ${y + 4}Q${x} ${y - rr * 1.2} ${x + rr} ${y + 4}Z`, t.lg(SLT, 70), 1, ink('#a89aa4', .6, .8))).join('');
  o += `<g transform="rotate(-18 112 80)">` + line('M112 56V106', '#8a6a44', 2.4, 1) + rect(104, 102, 16, 3, '#8a6a44', 0, 1, ink('#3a2a1a', .6, .85)) + `</g>` + crystal(118, 100, 10, 3.4, 6);
  return o;
});
// ===== mining shack =====
IN('mining-shack', 'a', LG, ['mine', 'building', 'salt', 'obstacle'], (t, r) => {
  const fy = 112; let o = sh(60, fy, 50, 6) + mound(t, 62, fy - 2, 54, 6) + ell(36, fy, 20, 3, '#e690a8', .25);
  o += path(`M18 ${fy - 4}V58L64 44L98 54V${fy - 4}Z`, wood(t, 20), 1, ink('#3a2a1a', 1, .85));
  o += path(`M98 54L112 60V${fy - 8}L98 ${fy - 4}Z`, '#62503a', 1, ink('#3a2a1a', .9, .85));
  for (let x = 26; x < 96; x += 9) o += line(`M${x} ${fy - 6}V${60 + (x < 64 ? -(x - 18) * .13 : (x - 64) * .3)}`, '#62503a', 1, .5);
  o += path('M10 62L64 34L112 56L102 62L64 46L18 68Z', iron(t, 20), 1, ink('#3a1a0c', 1, .85));
  for (let i = 0; i < 9; i++) o += line(`M${16 + i * 11} ${66 - i * 2.6}L${22 + i * 11} ${40 + i * 1.4}`, '#6a3a24', 1, .55);
  o += path('M10 62L64 34L112 56', 'none', 1, { stroke: '#e8c8b0', 'stroke-width': 1, 'stroke-opacity': .7 });
  o += rect(44, 78, 18, 30, '#4a3a28', 0, 1, ink('#2a1a0a', .9, .85)) + rect(46, 80, 14, 28, '#2a2024') + rect(72, 74, 16, 14, '#fff3c0', 0, 1, ink('#3a2a1a', .9, .85)) + line('M80 74V88M72 81H88', '#62503a', 1.4, 1);
  o += ell(80, 90, 12, 2, '#fff', .3) + path('M94 28V44', 'none', 1, { stroke: '#4a4448', 'stroke-width': 3 }) + line('M92 28h6', '#4a4448', 2, 1);
  o += `<g transform="translate(110 100) scale(.7)">${ell(0, 14, 16, 3, '#3b3a24', .15)}${path('M-14 -4H14L10 12H-10Z', iron(t, 20), 1, ink('#3a1a0c', 1, .85))}${circ(-8, 14, 4, '#4a4448')}${circ(8, 14, 4, '#4a4448')}</g>`;
  o += crystal(16, fy - 2, 12, 4, -8) + crystal(24, fy, 8, 3, 8) + [[30, 96], [28, 92]].map(([x, y]) => sblock(t, x - 4, y + 10, 10, 8, 3)).join('');
  return o;
});
// ===== ore hoist: a headframe over a shaft =====
IN('ore-hoist', 'a', LG, ['mine', 'structure', 'salt', 'obstacle'], (t, r) => {
  const fy = 112; let o = sh(64, fy, 40, 6) + mound(t, 64, fy - 2, 46, 6) + ell(64, fy - 6, 18, 6, '#2a2024', 1, 0, ink('#62503a', 3, .9));
  const leg = (x0, x1) => path(`M${x0} ${fy - 6}L${x1 - 2} 24H${x1 + 2}L${x0 + 5} ${fy - 6}Z`, wood(t, 0), 1, ink('#3a2a1a', .9, .85));
  o += leg(30, 58) + leg(98, 70) + line('M36 90L96 60M96 90L36 60', '#62503a', 2.4, .9) + line('M34 98H94', '#62503a', 3, 1) + line('M44 62H84', '#62503a', 2.4, 1);
  o += circ(64, 22, 11, '#8a8084', 1, ink('#2a2024', 1, .85)) + circ(64, 22, 7, '#4a4448') + circ(64, 22, 2.6, '#e0d8dc') + [0, 1, 2, 3, 4, 5].map(i => line(`M64 22l${f(Math.cos(i * 1.05) * 10)} ${f(Math.sin(i * 1.05) * 10)}`, '#b8aeb0', 1, .8)).join('');
  o += line('M54 22Q50 60 52 92', '#3a2a1a', 1.6, 1) + line('M74 22Q78 60 76 70', '#3a2a1a', 1.6, 1) + path('M44 90H62V104H44Z', iron(t, 20), 1, ink('#3a1a0c', 1, .85)) + ell(53, 90, 9, 2, t.lg(SLT, 70)) + path('M70 70H86V82H70Z', iron(t, 20), 1, ink('#3a1a0c', 1, .85));
  o += path('M22 112H34L32 100H24Z', '#a8603c') + crystal(106, fy - 2, 12, 4, 8) + hornSkull(100, 104, .8, 8);
  return o;
});
// ===== derailed cart wreck on broken rails =====
IN('cart-wreck', 'a', LG, ['mine', 'wreck', 'obstacle'], (t, r) => {
  let o = ell(64, 112, 58, 5, '#3b3a24', .12);
  o += [[0, 100, 40, 94], [88, 98, 128, 102]].map(([x0, y0, x1, y1]) => [0, 7].map(d => line(`M${x0} ${y0 + d}L${x1} ${y1 + d}`, '#3b3a3c', 3.4, .9) + line(`M${x0} ${y0 + d}L${x1} ${y1 + d}`, '#8a8084', 1.8, 1)).join('') + [0, 1, 2, 3].map(i => rect(x0 + 6 + i * 10, y0 - 4 + (y1 - y0) * (6 + i * 10) / (x1 - x0), 3, 16, WOODS[1], 0, 1, ink('#3b2a1a', .5, .8))).join('')).join('');
  o += `<g transform="translate(46 70) rotate(-24)">` + path('M-22 -14H22L16 14H-16Z', iron(t, 20), 1, ink('#3a1a0c', 1, .85)) + rect(-24, -17, 48, 5, '#7e7478', 0, 1, ink('#2a2024', .8, .85)) + ell(0, -15, 20, 3, '#2a2024') + [-14, 0, 14].map(x => circ(x, 0, 1, '#3a1a0c')).join('') + `</g>`;
  o += [[84, 76, 22], [100, 90, 18]].map(([x, y, rr]) => path(`M${x - rr} ${y + 6}Q${x} ${y - rr} ${x + rr} ${y + 6}Z`, t.lg(SLT, 70), 1, ink('#a89aa4', .7, .8))).join('');
  o += `<g transform="translate(76 108)">${circ(0, 0, 8, '#4a4448', 1, ink('#1a1618', 1, .85))}${circ(0, 0, 3, '#b8aeb0')}${[0, 1, 2, 3].map(i => line(`M0 0l${f(Math.cos(i * 1.57) * 7)} ${f(Math.sin(i * 1.57) * 7)}`, '#8a8084', 1.4, 1)).join('')}</g>`;
  return o + crystal(112, 108, 12, 4, 8) + bone(20, 112, 10, 12) + skull(30, 110, .6, 10);
});
// ===== salt-pillar grove =====
IN('salt-pillar-grove', 'a', LG, ['salt', 'formation', 'obstacle'], (t, r) => {
  const fy = 114; let o = ell(64, fy, 60, 6, '#e690a8', .22) + mound(t, 64, fy - 2, 56, 6);
  const pil = (x, h, w, base) => { const n = 7, wd = (u) => w + Math.sin(u * 4 + x) * 2.4 + (u > .75 ? (u - .75) * 12 : 0); const L = [], R = []; for (let i = 0; i <= n; i++) { const u = i / n, y = base - u * h; L.push(`${f(x - wd(u))} ${f(y)}`); R.unshift(`${f(x + wd(u))} ${f(y)}`); } const d = 'M' + L.join('L') + `Q${x} ${f(base - h - 9)} ` + R[0] + 'L' + R.slice(1).join('L') + 'Z'; return sh(x + 2, base, w + 8, 3) + path(d, salty(t, 20), 1, ink('#6e6480', 1, .8)) + path(`M${x + w * .3} ${base - 2}V${base - h + 6}Q${x + w + 1} ${base - h + 6} ${x + w + 1} ${base - 2}Z`, CLD[1], .24) + [1, 2, 3, 4].map(k => line(`M${x - w} ${f(base - k * h / 5)}q${w} ${(k % 2 ? 2 : -1)} ${w * 2} 0`, '#a89aa4', 1, .4)).join('') + ell(x - w * .4, base - h + 8, 2.4, 6, '#fff', .55); };
  for (const [x, h, w, b] of [[22, 40, 7, 100], [100, 48, 8, 102], [60, 66, 10, 98], [40, 34, 6, 108], [84, 30, 6, 110], [64, 28, 5, 112]]) o += pil(x, h, w, b);
  return o + [[12, 112], [112, 112], [48, 116]].map(([x, y]) => crystal(x, y, 10, 3.4, x % 3 * 6 - 6)).join('');
});
// ===== caravan remains: camel skeleton and a broken wagon =====
IN('caravan-remains', 'a', LG, ['bones', 'wreck', 'caravan', 'obstacle'], (t, r) => {
  const fy = 112; let o = ell(64, fy, 58, 5, '#3b3a24', .12) + mound(t, 50, fy - 2, 46, 5);
  // camel ribcage, spine and legs
  o += line('M16 80Q40 62 74 74', BONE[1], 4, 1) + line('M16 79Q40 61 74 73', BONE[0], 1.4, 1);
  for (let i = 0; i < 7; i++) o += rib(26 + i * 6.4, 88 - Math.sin(i / 6 * 3.14) * 4, 22, (i - 3) * 5);
  o += `<g transform="translate(78 74)">` + line('M0 0Q10 -14 20 -22', BONE[1], 4, 1) + hornSkull(24, -26, .8, 18).replace('translate', 'translate') + `</g>`;
  o += [[24, 100], [34, 102], [66, 100], [74, 102]].map(([x, y]) => line(`M${x} 88L${x - 2} ${y + 8}`, BONE[1], 3, 1) + line(`M${x - .6} 88L${x - 2.6} ${y + 8}`, BONE[0], 1, 1)).join('');
  // wheel and broken axle
  o += `<g transform="translate(98 94)">` + circ(0, 0, 15, 'none', 1, ink('#62503a', 3.4, .95)) + circ(0, 0, 15, 'none', 1, ink('#c9b79a', 1, .8)) + circ(0, 0, 4, '#9a8264', 1, ink('#3a2a1a', .8, .85)) + [0, 1, 2, 3, 4, 5].map(i => line(`M0 0l${f(Math.cos(i * 1.05) * 15)} ${f(Math.sin(i * 1.05) * 15)}`, '#9a8264', 1.8, i === 4 ? .0 : 1)).join('') + `</g>`;
  o += path('M84 108L112 104L114 108L86 112Z', wood(t, 0), 1, ink('#3a2a1a', .8, .85)) + hornSkull(18, 104, .7, -12) + crystal(112, 112, 10, 3.4, 6);
  return o;
});
// ===== brine spring: pink pool on crusted terraces =====
IN('brine-spring', 'a', LG, ['brine', 'spring', 'salt', 'obstacle'], (t, r) => {
  let o = ell(64, 114, 58, 6, '#e690a8', .25);
  const terr = (cy, rx, ry, c0, c1) => ell(64, cy + 4, rx + 4, ry, '#a89aa4', .5) + ell(64, cy, rx, ry, c0, 1, 0, ink('#fff', 2.4, .95)) + ell(64, cy, rx - 4, ry - 3, c1, 1, 0, ink('#b4566f', .8, .6)) + ell(60, cy - 1, rx * .5, ry * .35, '#fbd5de', .6);
  o += terr(96, 54, 15, '#fffdf8', '#f0a6bc') + terr(72, 38, 11, '#fffdf8', '#e68aa8') + terr(52, 22, 7, '#fffdf8', '#d86a8a');
  o += ell(64, 50, 9, 3, '#8e2e4c', .7) + [[60, 36, 5], [68, 28, 4], [64, 20, 3]].map(([x, y, rr]) => ell(x, y, rr, rr * 1.2, '#fff', .35)).join('') + [[58, 42], [70, 36]].map(([x, y]) => circ(x, y, 1.4, '#fff', .8)).join('');
  for (let i = 0; i < 7; i++) o += crystal(14 + i * 16 + (i % 2) * 3, 114 - (i % 3) * 2, 8 + (i % 3) * 3, 3, (i - 3) * 5);
  return o + [[26, 100], [100, 98]].map(([x, y]) => ell(x, y, 8, 2.6, '#f0a6bc', .8, 0, ink('#fff', 1, .9))).join('');
});
// ===== crystal cave mouth in a crust bank =====
IN('crystal-cave', 'a', LG, ['cave', 'salt', 'crystals', 'obstacle'], (t, r) => {
  const fy = 114; let o = sh(64, fy, 56, 6) + ell(64, fy, 56, 6, '#e690a8', .2);
  o += path(`M6 ${fy}Q4 52 36 34Q64 18 92 34Q124 52 122 ${fy}Z`, t.lg(['#ffffff', '#e8dfd4', '#a89aa4'], 40), 1, ink('#6e6480', 1.2, .8));
  o += path(`M96 36Q122 52 122 ${fy}H108Q110 62 90 44Z`, CLD[1], .26) + path('M18 70Q24 46 44 36Q30 56 28 90Z', '#fff', .6);
  o += path(`M34 ${fy - 2}Q32 66 64 56Q96 66 94 ${fy - 2}Z`, '#2a2438', 1, ink('#6e6480', 1.4, .9)) + path(`M42 ${fy - 2}Q44 78 64 68Q84 78 86 ${fy - 2}Z`, '#463e66', .8);
  for (const [x, y, h, w, a] of [[40, 70, 22, 5, 160], [52, 62, 18, 4, 168], [64, 58, 24, 5, 180], [76, 62, 16, 4, 192], [88, 72, 20, 5, 200], [46, ((fy) - 2), 20, 5, -14], [80, fy - 2, 26, 6, 10], [60, fy - 2, 12, 4, 0]]) o += crystal(x, y, h, w, a, ['#fff4f6', '#c8c0e8', '#6a5a98']);
  o += ell(64, fy - 6, 18, 3, '#9a8ad0', .35) + [[14, 108], [114, 106]].map(([x, y]) => crystal(x, y, 12, 4, x < 60 ? -8 : 8)).join('');
  return o;
});
// ===== salt statues: travellers turned to salt =====
const statue = (t, v) => {
  const fy = 118; let o = sh(32, fy, 18, 5) + mound(t, 32, fy - 2, 22, 5.4) + ell(32, fy - 1, 14, 3, '#e690a8', .3);
  o += path(`M22 ${fy - 4}H42V${fy - 10}H22Z`, salty(t, 0), 1, ink('#6e6480', .9, .8));
  if (v === 'a') {   // walker with a staff, one arm raised, hood
    o += path(`M24 ${fy - 10}Q22 76 28 62Q32 58 36 62Q42 76 40 ${fy - 10}Z`, salty(t, 10), 1, ink('#6e6480', 1, .8)) + circ(32, 48, 7.4, salty(t, 40), 1, ink('#6e6480', 1, .8)) + path('M24 50Q24 38 32 38Q40 38 40 50Q36 44 32 44Q28 44 24 50Z', '#e8dfd4', 1, ink('#6e6480', .8, .8)) + path('M38 66Q48 58 50 46L53 47Q52 62 40 72Z', salty(t, 10), 1, ink('#6e6480', .9, .8)) + path('M26 66Q22 74 22 84L25 85Q27 76 30 70Z', salty(t, 10), 1, ink('#6e6480', .9, .8)) + line(`M16 ${fy - 8}V50`, '#9a8264', 2, 1) + line(`M15 ${fy - 8}V50`, '#f2ead0', .8, .8);
    o += ell(30, 48, 2, 3, '#fff', .8) + path(`M36 ${fy - 14}Q40 88 40 66`, 'none', 1, { stroke: CLD[1], 'stroke-width': 3, 'stroke-opacity': .3 });
  } else {   // kneeling figure with a water jar
    o += path(`M22 ${fy - 10}Q18 90 28 78L40 78Q48 90 42 ${fy - 10}Z`, salty(t, 10), 1, ink('#6e6480', 1, .8)) + circ(31, 66, 7, salty(t, 40), 1, ink('#6e6480', 1, .8)) + path('M24 68Q24 56 31 56Q39 56 39 68Q35 62 31 62Q27 62 24 68Z', '#e8dfd4', 1, ink('#6e6480', .8, .8)) + path('M38 80Q50 82 52 92L48 94Q44 88 36 88Z', salty(t, 10), 1, ink('#6e6480', .9, .8)) + path('M44 90Q58 90 58 104Q58 112 50 112Q42 112 44 98Z', t.lg(['#fff', '#e0d6ca', '#a89aa4'], 30), 1, ink('#6e6480', .9, .8)) + ell(51, 90, 4, 1.6, '#e8dfd4');
    o += ell(29, 66, 2, 3, '#fff', .8);
  }
  return o + [[18, fy - 2], [46, fy - 1]].map(([x, y]) => crystal(x, y, 8, 3, x < 30 ? -10 : 10)).join('');
};
IN('salt-statue', 'a', TALL, ['statue', 'salt', 'signature', 'obstacle'], (t) => statue(t, 'a'));
IN('salt-statue', 'b', TALL, ['statue', 'salt', 'obstacle'], (t) => statue(t, 'b'));
IN('salt-obelisk', 'a', TALL, ['monument', 'salt', 'obstacle'], (t) => {
  const fy = 118; let o = sh(32, fy, 20, 5) + mound(t, 32, fy - 2, 24, 5.6) + ell(32, fy - 1, 16, 3, '#e690a8', .3);
  o += sblock(t, 16, fy - 14, 32, 12, 5) + sblock(t, 20, fy - 26, 24, 12, 4);
  o += path(`M24 ${fy - 26}L28 28H36L40 ${fy - 26}Z`, t.lg(['#ffffff', '#e8dfd4', '#a89aa4'], 0), 1, ink('#6e6480', 1, .85)) + path(`M28 28L32 14L36 28Z`, '#fff', 1, ink('#6e6480', .9, .85)) + path(`M34 ${fy - 26}L36 28L32 14L32 28V${fy - 26}Z`, CLD[1], .24);
  for (let i = 0; i < 6; i++) o += line(`M29 ${44 + i * 10}h6`, '#a89aa4', 1.2, .6) + (i % 2 ? '' : line(`M32 ${40 + i * 10}v5`, '#a89aa4', 1, .5));
  o += circ(32, 20, 2.6, '#f0a6bc', 1, ink('#8e3a5e', .6, .85));
  return o;
});
// ===== chests =====
const chest = (t, open) => { let o = sh(30, 52, 17, 4) + mound(t, 32, 52, 18, 3.2); o += path('M12 50V30H52V50Z', wood(t, 90), 1, ink('#3a2a1a', 1, .85)) + line('M12 40H52M24 30V50M40 30V50', '#62503a', 1.2, .7); if (!open) o += path('M12 30Q12 18 32 18Q52 18 52 30Z', t.lg(['#d8c8a8', '#9a8264', '#62503a'], 90), 1, ink('#3a2a1a', 1, .85)) + line('M12 26H52', '#4a4448', 2, .9); else o += path('M12 30L16 14Q32 10 48 14L52 30Z', '#62503a', 1, ink('#3a2a1a', 1, .85)) + ell(32, 30, 18, 3, '#2a1a0a') + [[24, 28], [32, 26], [40, 28]].map(([x, y]) => crystal(x, y, 7, 3, 0, ['#fff4f6', '#f2c4d2', '#c0708a'])).join('') + circ(30, 25, 1.4, '#f3c24f'); o += rect(28, open ? 40 : 28, 8, 8, '#a8603c', 1, 1, ink('#3a1a0c', .8, .85)) + circ(32, open ? 44 : 32, 1.4, '#f0a6bc') + ell(18, 46, 6, 2, '#fff', .8) + ell(46, 49, 6, 2, '#fff', .8); return o; };
IN('chest-salt', 'closed', C, ['chest', 'loot', 'closed'], (t) => chest(t, false));
IN('chest-salt', 'open', C, ['chest', 'loot', 'open'], (t) => chest(t, true));
