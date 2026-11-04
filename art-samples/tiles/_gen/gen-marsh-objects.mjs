// Firefly Marsh objects, part 1: trees, reeds and water plants, rocks. (Part 2: gen-marsh-props.mjs, part 3: gen-marsh-interest.mjs)
import { T, P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, maker, SUBS, sh, trunk, scat, sparkle, glowC, broad, rockS, mush, blobPath, bloom } from './sub.mjs';
import { mossBlob } from './ruins-lib.mjs';
import { pad, cattailS, reedS, blade, duckPatch, wcontact, mixc } from './marsh-lib.mjs';
import { ring } from './water-lib.mjs';

import { SUB, mk, out, R, prop, ST, ln, MS } from './marsh-kit.mjs';
const WL = ['#a8d29a', '#6fae80', '#3f7a5c'];   // dusk willow leaves
const AL = ['#9bc6a0', '#5f9a70', '#3a6e50'];
const mud = (cx, cy, rx, ry) => ell(cx, cy, rx, ry, '#8a7a5e', .5) + ell(cx - 1, cy - .5, rx * .7, ry * .6, '#a89878', .55);
const water = (cx, cy, rx) => wcontact(cx, cy, rx);

// ============================ trees (tall 64x128) ============================
function willow(t, v) {
  const cx = 32, by = 112, r = R('wl' + v), lean = v === 'b' ? 5 : -2;
  if (v === 'b') t.add(water(cx + 2, by, 22)); else t.add(sh(cx + 3, by + 2, 20, 6));
  t.add(trunk(t, cx, by, 6.6, 4, 54, P.bark, lean), path(`M${cx - 9} ${by + 1}q5-1 7-6L${cx - 1} ${by}Z`, P.bark[1], .9), path(`M${cx + 9} ${by + 1}q-5-1-7-6L${cx + 1} ${by}Z`, P.bark[2], .9));
  const cy = 46, g = t.rg(WL, .32, .26, 1);
  for (const [dx, dy, k] of [[0, 0, 1], [-.6, .25, .7], [.62, .22, .72], [-.25, -.45, .62], [.3, -.5, .6]]) t.add(ellG(cx + dx * 24 + lean, cy + dy * 18, 24 * k, 18 * k, WL[2]));
  for (const [dx, dy, k] of [[0, 0, 1], [-.6, .25, .7], [.62, .22, .72], [-.25, -.45, .62], [.3, -.5, .6]]) t.add(ell(cx + dx * 24 + lean - 1.2, cy + dy * 18 - 1.6, 24 * k * .82, 18 * k * .82, g));
  t.add(ell(cx - 8 + lean, cy - 12, 12, 5, WL[0], .55, -15));
  // hanging curtains
  const n = 17; for (let i = 0; i < n; i++) {
    const x = 8 + i * (48 / (n - 1)) + r.range(-1, 1) + lean * .3, y0 = cy + 10 + Math.sin(i * .9) * 4 - Math.abs(i - 8) * .9, len = r.range(28, 52) - Math.abs(i - 8) * 1.4, sw = r.range(-3, 3);
    t.add(line(`M${f(x)} ${f(y0)}q${f(sw)} ${f(len * .5)} ${f(sw * .6)} ${f(len)}`, i % 3 ? WL[1] : WL[2], 1.4, .95));
    for (let k = 1; k < len / 6; k++) t.add(ell(x + sw * .3 * (k * 6 / len) + (k % 2 ? 1.6 : -1.6), y0 + k * 6, 1, 2.2, i % 2 ? WL[0] : WL[1], .9, k % 2 ? 20 : -20));
  }
  if (v === 'b') for (const [x, y] of [[20, 110], [46, 112]]) t.add(cattailS(x, y, 18, 2, .7));
}
const ellG = (cx, cy, rx, ry, c) => ell(cx, cy, rx, ry, c, .97, 0, ink(P.inkG, .9, .65));
for (const v of ['a', 'b']) prop('trees', 'willow-marsh', v, ['tall', 'obstacle', 'willow', 'tree', 'dusk', v === 'b' ? 'water' : 'land'], (t) => willow(t, v), T, 128);
function snag(t, v) {
  const cx = 32, by = 112, r = R('sn' + v), g = t.lg(['#9a8a76', '#74665a', '#4e443c'], 0), ik = ink('#2e2620', .9, .8), lean = v === 'b' ? 9 : 0;
  if (v === 'c') t.add(water(cx, by, 20)); else t.add(sh(cx + 3, by + 2, 16, 5));
  const top = v === 'c' ? 52 : 18;
  t.add(path(`M${cx - 8} ${by + 1}Q${cx - 5} ${by - 10} ${cx - 4 + lean * .3} ${by - 30}L${cx - 3 + lean} ${top + 6}L${cx - 1 + lean} ${top}L${cx + 2 + lean} ${top + 7}L${cx + 4 + lean} ${top + 2}L${cx + 5 + lean} ${top + 12}Q${cx + 5} ${by - 30} ${cx + 8} ${by + 1}Z`, g, 1, ik));
  t.add(line(`M${cx - 2} ${by - 4}q-1-30 ${lean * .6}-${by - top - 22}`, '#3a322a', 1, .5), rect(cx - 5 + lean * .2, top + 14, 2, 36, '#fff', 0, .18));
  const br = (x, y, dx, dy, w) => t.add(line(`M${f(x)} ${f(y)}q${f(dx * .5)} ${f(dy * .3 - 3)} ${f(dx)} ${f(dy)}`, '#5e5246', w, 1), line(`M${f(x + dx * .6)} ${f(y + dy * .6)}l${f(dx * .3)} ${f(-6)}`, '#5e5246', w * .6, 1), line(`M${f(x)} ${f(y)}q${f(dx * .5)} ${f(dy * .3 - 3)} ${f(dx)} ${f(dy)}`, '#b4a692', .8, .35));
  if (v !== 'c') { br(cx - 3 + lean * .5, top + 22, -18, -14, 2.6); br(cx + 4 + lean * .6, top + 34, 20, -18, 2.8); br(cx - 3 + lean * .3, top + 52, -22, 4, 2.4); }
  else br(cx + 3, top + 6, 16, -8, 2.4);
  t.add(mossBlob(cx - 3, by - 14, 8, 4, 31), mossBlob(cx + 4, by - 36, 5, 3, 32));
  if (v === 'b') for (const [x, y] of [[cx + 5, by - 44], [cx + 4, by - 30]]) t.add(path(`M${x} ${y}q8 -3 10 2q-2 5-10 3Z`, '#e0c8a0', 1, ink('#8a6a44', .6, .8)), line(`M${x + 2} ${y + 1}q4 -1 6 1`, '#b89868', .8, .8));
  if (v === 'c') { t.add(cattailS(cx - 16, by - 2, 18, -2, .7), cattailS(cx + 14, by, 14, 2, .6)); }
  if (v === 'a') t.add(ell(cx + 3, by - 52, 3, 4, '#1a1410', .85), tuft(cx - 14, by + 2, '#5f8f4c', .8, .7));
}
for (const v of ['a', 'b', 'c']) prop('trees', 'snag-marsh', v, ['tall', 'obstacle', 'dead', 'tree', v === 'c' ? 'water' : 'land'], (t) => snag(t, v), T, 128);
function cypress(t, v) {
  const cx = 32, by = 112, r = R('cy' + v), g = t.lg(['#b08a5e', '#8a6444', '#5a3e2a'], 0), ik = ink('#3a2418', .9, .8);
  t.add(v === 'b' ? water(cx, by, 24) : sh(cx + 3, by + 2, 22, 6));
  for (const [dx, h] of [[-17, 7], [-11, 11], [12, 9], [18, 6], [6, 6]]) t.add(path(`M${cx + dx - 3} ${by + 2}Q${cx + dx - 2} ${by - h} ${cx + dx} ${by - h - 2}Q${cx + dx + 2} ${by - h} ${cx + dx + 3} ${by + 2}Z`, g, 1, ik), ell(cx + dx - 1, by - h + 1, .8, 2, '#fff', .35));
  t.add(path(`M${cx - 15} ${by + 2}Q${cx - 8} ${by - 8} ${cx - 6} ${by - 40}L${cx - 5} ${by - 62}H${cx + 5}L${cx + 6} ${by - 40}Q${cx + 8} ${by - 8} ${cx + 15} ${by + 2}Z`, g, 1, ik), line(`M${cx - 3} ${by - 4}v-48M${cx + 2} ${by - 4}v-44`, '#3a2418', 1, .45));
  const g2 = t.rg(['#c8a070', '#a8764c', '#7a4e30'], .3, .3, 1), cols = ['#b4d29a', '#7fae78', '#4f8060'];
  for (const [x, y, rx, ry] of [[cx, 28, 20, 9], [cx - 4, 44, 26, 10], [cx + 4, 28, 14, 7], [cx - 8, 60, 22, 8]]) { t.add(ell(x, y, rx, ry, cols[2], 1, 0, ink(P.inkG, .8, .65)), ell(x - 2, y - 1.6, rx * .86, ry * .7, cols[1], 1), ell(x - 4, y - 3, rx * .5, ry * .35, cols[0], .7)); for (let k = 0; k < 6; k++) t.add(line(`M${f(x - rx * .8 + k * rx * .32)} ${f(y + ry * .5)}v${f(r.range(5, 10))}`, cols[2], 1.1, .7)); }
  t.add(line(`M${cx} ${by - 62}v-6`, '#5a3e2a', 2));
}
for (const v of ['a', 'b']) prop('trees', 'cypress-knees', v, ['tall', 'obstacle', 'cypress', 'tree', v === 'b' ? 'water' : 'land'], (t) => cypress(t, v), T, 128);
for (const v of ['a', 'b']) prop('trees', 'alder-marsh', v, ['tall', 'obstacle', 'alder', 'tree'], (t) => broad(t, { cols: AL, cr: 20, cy: 46, seed: 7100 + v.charCodeAt(0), trunkH: 46, lean: v === 'b' ? -3 : 0, extra: (r) => { let o = ''; for (let i = 0; i < 12; i++) { const x = 32 + r.range(-22, 22), y = 46 + r.range(-14, 22); o += ell(x, y, .9, 2.8, '#6a4a3a', .9, r.range(-30, 30)); } return o; } }), T, 128);
// bushes (cell)
const bush = (t, cols, rx, ry, seed, extra = '') => { const r = R('bs' + seed); let o = sh(33, 52, rx, 5); const L = [[0, 0, 1], [-.55, .2, .65], [.55, .18, .68], [-.2, -.4, .6], [.3, -.4, .55]], gd = t.rg(cols, .32, .26, 1); for (const [dx, dy, k] of L) o += circ(32 + dx * rx, 40 + dy * ry, ry * k * 1.02, cols[2], .97, ink(P.inkG, .9, .7)); for (const [dx, dy, k] of L) o += circ(32 + dx * rx - 1.2, 40 + dy * ry - 1.4, ry * k * .82, gd); o += ell(26, 32, 6, 2.4, cols[0], .5, -20); for (let k = 0; k < 6; k++) o += ell(32 + r.range(-rx * .7, rx * .7), 40 + r.range(-ry * .4, ry * .6), 2.4, 1, cols[0], .5, r.range(-40, 40)); return o + extra; };
prop('trees', 'bush-bog-myrtle', 'a', ['bush', 'obstacle'], (t, r) => t.add(bush(t, ['#b4d29a', '#7fae78', '#4f8060'], 15, 11, 1, scat(r, 7, 20, 6).map(([x, y]) => ell(x + 4, y * .5 + 18, .9, 1.8, '#c8a050', .95, r.range(-20, 20))).join(''))));
prop('trees', 'bush-bog-myrtle', 'b', ['bush', 'obstacle'], (t, r) => t.add(bush(t, ['#a8d29a', '#6fae80', '#3f7a5c'], 14, 11, 2, scat(r, 5, 20, 8).map(([x, y]) => circ(x + 2, y * .5 + 20, 1.7, '#7a4a8a', 1, ink('#3a1a4a', .4, .6)) + circ(x + 1.5, y * .5 + 19.4, .5, '#d8b0e0')).join(''))));
prop('trees', 'bush-willow-scrub', 'a', ['bush', 'obstacle'], (t, r) => { t.add(bush(t, WL, 16, 10, 3)); for (let i = 0; i < 9; i++) { const x = 18 + i * 3.6; t.add(line(`M${x} 44q${r.range(-2, 2)} 6 ${r.range(-2, 2)} ${r.range(7, 12)}`, WL[1], 1.2, .9)); } });
prop('trees', 'bush-bramble-dusk', 'a', ['bush', 'obstacle'], (t, r) => t.add(bush(t, ['#8fb078', '#567a52', '#34543c'], 15, 11, 4, scat(r, 8, 20, 6).map(([x, y]) => circ(x, y * .5 + 18, 1.6, '#5a2a6a', 1, ink('#2a0a3a', .4, .6)) + circ(x - .4, y * .5 + 17.4, .5, '#c8a0d8')).join(''))));
prop('trees', 'bush-reed-willow', 'a', ['bush', 'obstacle', 'water'], (t, r) => { t.add(water(32, 50, 20)); t.add(bush(t, WL, 13, 9, 5)); });

// ============================ grass / reeds / water plants (cell) ============================
const gtuft = (x, y) => tuft(x, y, '#5f8f4c', .8, .7);
function cattails(t, v) {
  const r = R('ct' + v), n = v === 'a' ? 5 : v === 'b' ? 7 : 4, inW = v === 'c';
  t.add(inW ? water(32, 54, 18) : ell(34, 54, 15, 4, '#3b3a24', .16));
  for (let i = 0; i < n; i++) { const x = 18 + i * (28 / (n - 1)) + r.range(-2, 2); t.add(cattailS(x, 54 + (i % 2) * 2, r.range(22, 38) - (i % 3) * 3, r.range(-6, 6), .8)); }
  t.add(blade(26, 56, 24, -8, 2.6), blade(40, 56, 20, 9, 2.4), blade(33, 56, 28, 2, 2.4, '#7aa850'));
  if (v === 'b') t.add(...[0, 1].map(i => cattailS(24 + i * 18, 56, 14, i ? 5 : -5, .8)));
}
for (const v of ['a', 'b', 'c']) prop('grass', 'cattail-dusk', v, ['plant', 'cattail', 'concealing', v === 'c' ? 'water' : 'land'], (t) => cattails(t, v));
const plume = (x, y, ang) => `<g transform="rotate(${ang} ${f(x)} ${f(y)})">` + path(`M${f(x)} ${f(y)}q-3 -4 -1.4 -9q3 2 4.4 8Z`, '#d8c8a0', .95, ink('#8a7a50', .4, .6)) + ell(x + .6, y - 5, .6, 3, '#f6ecd0', .6) + '</g>';
function reeds(t, v) {
  const r = R('rd' + v), n = v === 'b' ? 8 : 13, wind = v === 'c' ? 12 : 0, inW = v === 'd';
  t.add(inW ? water(32, 54, 20) : ell(33, 55, 17, 4, '#3b3a24', .15));
  for (let i = 0; i < n; i++) { const x = 14 + i * (36 / (n - 1)) + r.range(-2, 2), h = r.range(30, 46), lean = r.range(-5, 5) + wind; t.add(reedS(x, 55 + (i % 2) * 2, h, lean, i % 3 ? '#8ab45c' : '#6e9a48', 1.3)); if (i % 2 === 0 || v === 'a') t.add(plume(x + lean, 55 - h, lean * 3)); }
  t.add(blade(24, 57, 26, -10, 2.4), blade(42, 57, 24, 10, 2.4), gtuft(14, 58), gtuft(50, 58));
  if (v === 'd') t.add(ring(32, 56, 22, '#eadcea', .5));
}
for (const v of ['a', 'b', 'c', 'd']) prop('grass', 'reeds-dusk', v, ['plant', 'reeds', 'concealing', v === 'd' ? 'water' : 'land'], (t) => reeds(t, v));
function iris(t, v) {
  const col = v === 'a' ? ['#a58ad8', '#6a4aa8', '#f3c24f'] : ['#f6d04a', '#d8a020', '#8a5a1c'], r = R('ir' + v);
  t.add(ell(34, 53, 14, 3.6, '#3b3a24', .15));
  for (let i = 0; i < 7; i++) t.add(blade(20 + i * 4.4, 55, r.range(26, 38), (i - 3) * 2.6, 3, '#6fa04c', '#2f6a3a'));
  for (const [x, y, s] of [[26, 22, 1], [38, 16, 1.1], [33, 30, .8]]) { t.add(line(`M${x} ${y + 3}L${x + (x < 32 ? 3 : -3)} 52`, '#4a8a46', 1.2)); for (const a of [-24, 24, 0]) t.add(ell(x + a * .2, y - 4 * s, 2.2 * s, 4.4 * s, col[0], 1, a, ink(col[1], .5, .8))); for (const a of [-50, 50, 0]) t.add(ell(x + a * .1, y + 1.5 * s, 2 * s, 4 * s, col[1], 1, a * .6, ink('#2a1a4a', .4, .7))); t.add(ell(x, y, 1, 2.2 * s, col[2], 1)); }
}
for (const v of ['a', 'b']) prop('grass', 'iris-marsh', v, ['plant', 'iris', 'flowers'], (t) => iris(t, v));
function lilies(t, v) {
  const r = R('lp' + v);
  t.add(ell(32, 36, 28, 11, '#6f93ae', .22), ell(32, 36, 22, 8, '#eadcea', .3));
  const L = { a: [[30, 36, 11, 'pink'], [46, 30, 6, null], [18, 42, 6, 'bud']], b: [[22, 32, 8, null], [40, 28, 8, null], [32, 44, 8, null], [48, 42, 6, null], [14, 44, 5, null]], c: [[34, 34, 10, 'white'], [18, 30, 6, 'bud'], [48, 44, 6, null]], d: [[16, 28, 4.6, null], [28, 38, 5, null], [40, 26, 4.6, 'pink'], [50, 40, 5, null], [34, 48, 4.4, null], [22, 46, 4, null]] }[v];
  for (const [x, y, s, b] of L) t.add(pad(x, y, s, b));
}
for (const v of ['a', 'b', 'c', 'd']) prop('grass', 'lily-pads-dusk', v, ['plant', 'lily', 'water', v === 'd' ? 'cluster' : 'bloom'], (t) => lilies(t, v));
for (const v of ['a', 'b']) prop('grass', 'duckweed-float', v, ['plant', 'duckweed', 'water'], (t, r) => { t.add(ell(32, 38, 26, 10, '#6f93ae', .22)); t.add(duckPatch(r, 30, 38, v === 'a' ? 20 : 14, v === 'a' ? 8 : 6, v === 'a' ? 46 : 30)); if (v === 'b') t.add(duckPatch(r, 44, 28, 8, 4, 16), pad(22, 44, 5)); });
prop('grass', 'horsetail', 'a', ['plant', 'concealing'], (t, r) => { t.add(ell(33, 54, 14, 3.4, '#3b3a24', .15)); for (let i = 0; i < 9; i++) { const x = 18 + i * 3.6 + r.range(-1, 1), h = r.range(24, 40); t.add(line(`M${f(x)} 55v${-h}`, '#6fa04c', 1.6, .95)); for (let k = 1; k < h / 7; k++) t.add(line(`M${f(x - 2.2)} ${f(55 - k * 7)}l2.2 -2l2.2 2`, '#3f7a3c', .9, .9)); t.add(ell(x, 55 - h - 1, 1, 2.4, '#8aa860', 1)); } });
prop('grass', 'bulrush-giant', 'a', ['plant', 'tall', 'obstacle', 'reeds'], (t, r) => { t.add(ell(34, 112, 20, 5, '#3b3a24', .15)); for (let i = 0; i < 12; i++) { const x = 14 + i * 3.6 + r.range(-1.5, 1.5), h = r.range(60, 98), lean = r.range(-8, 8); t.add(reedS(x, 114 + (i % 2) * 2, h, lean, i % 3 ? '#8ab45c' : '#6e9a48', 1.8)); if (i % 2) t.add(plume(x + lean, 114 - h, lean * 2.4)); } t.add(blade(22, 116, 40, -14, 3.4), blade(44, 116, 36, 14, 3.2), gtuft(14, 118), gtuft(50, 118)); }, T, 128);
const sedgeP = (t, x, y, n, h, cols) => { let o = ell(x + 1, y + 1.2, n * 1.2, 2, '#3b3a24', .15); for (let i = 0; i < n; i++) { const a = (i - (n - 1) / 2) * 7; o += blade(x + a * .35, y, h * (.7 + (i % 3) * .15), a * .5, 2, cols[i % cols.length], '#3f6a3a'); } return o; };
for (const v of ['a', 'b']) prop('grass', 'sedge-clump', v, ['plant', 'sedge'], (t) => t.add(sedgeP(t, 32, 52, v === 'a' ? 9 : 7, v === 'a' ? 26 : 20, ['#8ab45c', '#5f9a48', '#b4c878']), v === 'b' ? sedgeP(t, 18, 54, 5, 14, ['#8ab45c', '#6e9a48']) : ''));
prop('grass', 'marigold-clump', 'a', ['plant', 'flowers'], (t, r) => { t.add(ell(33, 52, 14, 3.4, '#3b3a24', .15)); for (const [x, y] of [[22, 52], [32, 54], [42, 52]]) t.add(ell(x, y - 4, 7, 3.4, '#5f9a50', 1, r.range(-20, 20), ink('#2f6a3a', .5, .7)), ell(x + 4, y - 6, 5, 2.4, '#7fb860', 1, 30)); for (const [x, y, s] of [[22, 38, 1.4], [34, 30, 1.6], [42, 40, 1.3], [28, 46, 1.1]]) t.add(line(`M${x} ${y + 2}L${x + 1} 52`, '#4a8a46', 1), bloom('buttercup', x, y, s, '#f6c82a')); });
prop('grass', 'cotton-grass', 'a', ['plant', 'flowers'], (t, r) => { t.add(ell(33, 52, 13, 3.2, '#3b3a24', .15)); for (let i = 0; i < 8; i++) { const x = 18 + i * 4, h = r.range(16, 28); t.add(line(`M${x} 54q${r.range(-2, 2)} ${-h / 2} ${r.range(-3, 3)} ${-h}`, '#7a9a54', 1.1, .9), circ(x + r.range(-2, 2), 54 - h, 2.6, '#fffaf0', 1, ink('#cfc8b0', .4, .5)), circ(x - 1, 54 - h - .8, 1.2, '#fff')); } t.add(blade(26, 56, 14, -6, 2), blade(40, 56, 14, 6, 2)); });
// ============================ rocks ============================
for (const v of ['a', 'b']) prop('rocks', 'mossy-boulder-marsh', v, ['rock', 'obstacle'], (t, r) => t.add(rockS(t, r, 32, 38, v === 'a' ? 18 : 14, v === 'a' ? 13 : 11, ['#cfd0c4', '#a2a596', '#74786a'], { moss: true, fern: v === 'a' }), mud(32, 54, 22, 3)));
for (const v of ['a', 'b']) prop('rocks', 'stepping-stones-marsh', v, ['rock', 'walkable', 'stepping', 'water'], (t, r) => { t.add(ell(32, 36, 28, 12, '#6f93ae', .2)); const pts = v === 'a' ? [[14, 46], [30, 36], [46, 24]] : [[12, 26], [28, 34], [42, 42], [54, 30]]; for (const [x, y] of pts) t.add(ell(x, y + 2, 9, 3.4, '#eadcea', .6), ell(x + 1, y + 3, 8, 2.4, '#2c3a40', .18), ell(x, y, 8, 5, '#a2a596', 1, 0, ln), ell(x - 2, y - 1.6, 4, 2, '#e0e1d6', .8), mossBlob(x + 2, y - 2, 4, 1.8, x)); });
for (const v of ['a', 'b']) prop('rocks', 'mud-mound', v, ['rock', 'obstacle', 'mud'], (t, r) => { t.add(sh(33, 52, 18, 5)); t.add(path(blobPath(r, 32, 40, v === 'a' ? 19 : 15, v === 'a' ? 11 : 12, 8, .12), t.lg(['#c8b99b', '#a39379', '#76684e'], 55), 1, ink('#4a3a28', .9, .7)), ell(26, 33, 8, 2.6, '#e6dcd0', .5, -15), ...[0, 1, 2].map(i => tuft(22 + i * 10, 44 + (i % 2) * 4, '#6e7a3e', .8, .7)), ...(v === 'b' ? [ell(34, 38, 3, 2, '#4a3a28', .8), ell(34, 37.4, 2, 1, '#a8987a', .8)] : [])); });
prop('rocks', 'sunken-log', 'a', ['rock', 'obstacle', 'water', 'log'], (t, r) => { t.add(water(32, 46, 26)); const g = t.lg(['#9a8a76', '#74665a', '#4e443c'], 90); t.add(path('M6 40Q8 30 20 30L46 28Q58 28 58 38Q58 46 46 46L18 48Q6 48 6 40Z', g, 1, ink('#2e2620', .9, .8)), ell(54, 38, 4, 8, '#b8a88a', 1, 0, ink('#2e2620', .8, .8)), ell(54, 38, 2.4, 5, '#8a7a62', 1), line('M20 34q10-2 24 0M18 42q12 2 26 -1', '#3a322a', 1, .5), mossBlob(26, 30, 9, 3.4, 5), mossBlob(42, 29, 6, 2.6, 6), ell(18, 33, 6, 1.4, '#fff', .35)); });
prop('rocks', 'turtle-rock', 'a', ['rock', 'obstacle', 'water', 'turtle'], (t, r) => { t.add(water(32, 46, 24)); t.add(rockS(t, r, 30, 40, 17, 9, ['#cfd0c4', '#a2a596', '#74786a'], { moss: true })); const tg = t.lg(['#9ab070', '#5a7a46', '#3a5a34'], 55); t.add(ell(38, 28, 8, 5.4, tg, 1, 0, ink('#2a4a2a', .8, .8)), ...[[35, 27], [41, 27], [38, 31]].map(([x, y]) => ell(x, y, 2.2, 1.6, '#c8d8a0', .5)), circ(47, 28, 2.4, '#7a8a58', 1, ink('#2a4a2a', .6, .8)), circ(47.8, 27.6, .5, '#111'), ell(31, 31, 2.4, 1.6, '#7a8a58', 1)); });
