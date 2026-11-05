// Ashkara common: palms, acacia, cacti, shrubs, dead trees, rocks, mesas, spires, arches, reeds and grasses.
import { T, rng, hash, f, ell, circ, rect, path, line, ink, tuft, D, tile, sh, frond, rockD, pebbleD, blobPath } from './desert-lib.mjs';

// tapered curved trunk polygon (quadratic centre line); returns {d, pt(u), n(u)}
export function trunkPoly(x0, y0, cx, cy, x1, y1, w0, w1) {
  const pt = (u) => [(1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * cx + u * u * x1, (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * cy + u * u * y1];
  const n = (u) => { const a = pt(Math.min(1, u + .02)), b = pt(Math.max(0, u - .02)), dx = a[0] - b[0], dy = a[1] - b[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
  const L = [], R = []; for (let i = 0; i <= 10; i++) { const u = i / 10, p = pt(u), q = n(u), w = w0 + (w1 - w0) * u; L.push([p[0] + q[0] * w, p[1] + q[1] * w]); R.push([p[0] - q[0] * w, p[1] - q[1] * w]); }
  return { d: 'M' + L.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'L' + R.reverse().map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z', pt, n, w0, w1 };
}
const FR = { dark: [D.palm[1], D.palm[2], '#2a5a2e'], mid: D.palm, light: ['#dcf09a', D.palm[0], D.palm[1]] };
// date palm, drawn in a 64x128 frame
export function palmStr(t, { bx = 32, by = 112, lean = 6, top = 36, nf = 11, len = 31, dates = false, seed = 1, young = false, dead = 0 } = {}) {
  const r = rng(seed), cx = bx + lean, cy = top; let o = sh(bx + 3, by + 2, young ? 9 : 14, 5);
  const tr = trunkPoly(bx, by, bx + lean * .1, (by + top) / 2 + 6, cx, cy + 3, young ? 3.6 : 5.2, young ? 2.4 : 3.2);
  o += path(tr.d, t.lg(D.wood, 0), 1, ink(D.inkB, .9, .8));
  let k = '', k2 = '';
  for (let i = 1; i < 11; i++) { const u = i / 11, p = tr.pt(u), n = tr.n(u), w = tr.w0 + (tr.w1 - tr.w0) * u; k += `M${f(p[0] + n[0] * w)} ${f(p[1] + n[1] * w)}q${f(-n[0] * w - 1)} ${f(-n[1] * w + 1.8)} ${f(-n[0] * w * 2)} ${f(-n[1] * w * 2 + .6)}`; if (i % 2) k2 += `M${f(p[0] - n[0] * w * .5)} ${f(p[1] - n[1] * w * .5)}l.1 -1.5`; }
  o += line(k, D.wood[2], 1, .55) + line(k2, '#d0aa72', 1, .5);
  const angs = []; for (let i = 0; i < nf; i++) angs.push(-170 + i * (160 / (nf - 1)) + r.range(-6, 6));
  const order = angs.map((a, i) => [a, i]).sort((p, q) => Math.abs(Math.cos(q[0] * Math.PI / 180)) - Math.abs(Math.cos(p[0] * Math.PI / 180)));
  for (const [a, i] of order) { const side = Math.abs(Math.cos(a * Math.PI / 180)); const l = len * (.82 + r() * .3) * (young ? .75 : 1), dr = side * (young ? 12 : 17) + r.range(0, 5); o += frond(cx, cy + 2, a, l, dr, side > .75 ? (dead && i % 2 ? ['#d8c890', '#b8a468', '#8a7a48'] : FR.dark) : (side > .35 ? FR.mid : FR.light), young ? 3.4 : 4.2); }
  o += ell(cx, cy + 4, 4.6, 3.2, D.wood[1], 1, 0, ink(D.inkB, .8, .8));
  if (dates) for (let i = 0; i < 9; i++) o += circ(cx - 5 + (i % 3) * 3.6 + r.range(-.8, .8), cy + 7 + Math.floor(i / 3) * 2.8, 1.8, i % 2 ? '#d86a2a' : '#b84a1e', 1, ink('#5a2a14', .4, .6)) + circ(cx - 5.6 + (i % 3) * 3.6, cy + 6.4 + Math.floor(i / 3) * 2.8, .5, '#ffb070', .8);
  return o;
}
const T128 = [T, 128];
for (const [v, c] of Object.entries({ a: { lean: 6, top: 38, nf: 11, seed: 3 }, b: { lean: -7, top: 30, nf: 12, len: 32, dates: true, seed: 8 }, c: { lean: 3, top: 52, nf: 10, len: 28, seed: 12 }, d: { lean: -3, top: 44, nf: 9, len: 24, dead: 1, seed: 20 } }))
  tile('trees', 'date-palm', v, T128, ['tall', 'palm', 'obstacle', ...(c.dates ? ['dates', 'loot'] : [])], (t) => palmStr(t, c));
tile('trees', 'date-palm-young', 'a', [T, T], ['small', 'palm'], (t) => palmStr(t, { by: 54, top: 30, lean: 2, nf: 8, len: 17, young: true, seed: 5 }));
tile('trees', 'date-palm-young', 'b', [T, T], ['small', 'palm'], (t) => palmStr(t, { by: 54, top: 26, lean: -3, nf: 9, len: 18, young: true, seed: 6 }));
tile('trees', 'palm-grove', 'a', [128, 128], ['large', 'palm', 'obstacle', 'oasis'], (t) => {
  let o = ''; for (const [dx, dy, s, sd, ln] of [[-6, -4, .92, 31, 5], [40, -8, 1, 32, -6], [20, 8, .86, 33, 2]]) o += `<g transform="translate(${dx} ${dy}) scale(${s})">${palmStr(t, { lean: ln, top: 34, seed: sd, dates: sd === 32, by: 112 })}</g>`;
  return o + [[34, 112], [84, 110], [60, 116]].map(([x, y]) => tuft(x, y, '#5f8a3e', .9, 1.1)).join('');
});

// acacia: umbrella canopy (64x128)
for (const [v, c] of Object.entries({ a: { cy: 50, ry: 13, seed: 4, fork: 76 }, b: { cy: 38, ry: 12, seed: 9, fork: 62 } })) tile('trees', 'acacia', v, T128, ['tall', 'acacia', 'obstacle'], (t, r) => {
  const rr = rng(c.seed); let o = sh(35, 114, 17, 5);
  const tr = trunkPoly(32, 112, 28 + rr.range(-4, 4), 92, 32 + rr.range(-4, 4), c.fork, 4.6, 2.8); o += path(tr.d, t.lg(D.wood, 0), 1, ink(D.inkB, .9, .8));
  o += line(`M${f(tr.pt(1)[0])} ${c.fork}L16 ${c.cy + 6}M${f(tr.pt(1)[0])} ${c.fork}L32 ${c.cy + 6}M${f(tr.pt(1)[0])} ${c.fork}L50 ${c.cy + 6}`, D.wood[2], 2.6, .95);
  const cols = D.acacia; o += ell(33, c.cy + 7, 30, 9, cols[2], 1, 0, ink(D.inkG, .9, .7));
  o += path(blobPath(rr, 32, c.cy, 30, c.ry, 11, .08), t.rg([cols[0], cols[1], cols[2]], .3, .22, 1), 1, ink(D.inkG, .9, .7));
  o += ell(24, c.cy - 4, 14, 3.6, cols[0], .6, -6) + ell(42, c.cy - 2, 9, 2.6, cols[0], .45, 5) + ell(34, c.cy + 6, 22, 3.4, cols[2], .45);
  for (let i = 0; i < 12; i++) o += ell(32 + rr.range(-24, 24), c.cy + rr.range(-8, 7), 3.2, 1, rr() < .5 ? cols[0] : cols[2], .55, rr.range(-12, 12));
  return o;
});
// dead / bleached trees
for (const [v, lean, sd] of [['a', 5, 41], ['b', -6, 42]]) tile('trees', 'dead-tree', v, T128, ['tall', 'dead', 'obstacle'], (t, r) => {
  const rr = rng(sd), cs = ['#efe4cc', '#c4b490', '#8f7f60']; let o = sh(34, 114, 13, 4.5);
  const tr = trunkPoly(32, 112, 30 + lean * .6, 84, 32 + lean, 52, 5, 2.6); o += path(tr.d, t.lg(cs, 0), 1, ink('#5a4a30', .9, .8));
  const br = [[32 + lean, 54, 12, 30, 2.2], [32 + lean, 60, 54, 36, 2], [32 + lean * .8, 72, 14, 56, 2], [32 + lean * .6, 78, 52, 62, 1.8], [32 + lean, 52, 34 + lean * 2, 24, 1.8]];
  for (const [x, y, ex, ey, w] of br) { const mx = (x + ex) / 2 + rr.range(-4, 4), my = (y + ey) / 2; o += line(`M${x} ${y}Q${f(mx)} ${f(my)} ${ex} ${ey}`, '#5a4a30', w + 1.2, .85) + line(`M${x} ${y}Q${f(mx)} ${f(my)} ${ex} ${ey}`, cs[1], w, 1) + line(`M${ex} ${ey}l${f(rr.range(-6, 6))} ${f(-rr.range(4, 8))}`, cs[1], 1.2, 1); }
  return o + line(`M30 100q1-8 0-16M34 96q-1-8 1-14`, cs[2], 1, .5) + path('M26 112q3-4 6-5l-1 5Z', cs[1], 1);
});
// cacti
const tube = (d, w, col, hi) => line(d, '#2e4a2a', w + 1.8, .85) + line(d, col, w, 1) + line(d, hi, w * .3, .5, { transform: 'translate(-1.4 0)' });
function saguaro(t, { arms = 2, h = 62, flower = false, seed = 1 }) {
  const rr = rng(seed), cols = D.cactus; let o = sh(35, 113, 12, 4.5), top = 112 - h;
  o += tube(`M32 112V${top + 6}`, 12, t.lg([cols[0], cols[1], cols[2]], 0), '#d4f0c0');
  o += line(`M32 112V${top + 6}`, '#2e4a2a', 12 + 1.8, 0);
  for (const dx of [-3.6, 0, 3.6]) o += line(`M${32 + dx} 110V${top + 8}`, '#2e5a34', .9, .5);
  const armSpec = [[-1, 88, 16, 26], [1, 74, 15, 22]].slice(0, arms);
  for (const [s, y, dx, up] of armSpec) { const x1 = 32 + s * dx; o += tube(`M32 ${y}H${x1 - s * 4}Q${x1} ${y} ${x1} ${y - 4}V${y - up}`, 7.4, cols[1], '#d4f0c0'); o += line(`M${x1} ${y - 4}V${y - up + 2}`, '#2e5a34', .8, .5); if (flower) o += circ(x1, y - up - 1, 2.6, '#f6a0b8', 1, ink('#b0607a', .4, .6)); }
  for (let i = 0; i < 16; i++) { const x = 32 + rr.range(-5, 5), y = rr.range(top + 8, 108); o += line(`M${f(x)} ${f(y)}l.1-1.8`, '#fff6d8', .7, .7); }
  if (flower) o += circ(32, top + 2, 3, '#f6a0b8', 1, ink('#b0607a', .4, .6)) + circ(31.4, top + 1.4, 1, '#fff', .8);
  return o;
}
tile('trees', 'cactus-tall', 'a', T128, ['tall', 'cactus', 'obstacle'], (t) => saguaro(t, { arms: 2, h: 62, seed: 1 }));
tile('trees', 'cactus-tall', 'b', T128, ['tall', 'cactus', 'obstacle'], (t) => saguaro(t, { arms: 1, h: 44, flower: true, seed: 2 }));
function pear(t, seed, fruit) {
  const rr = rng(seed); let o = sh(34, 53, 18, 4.5);
  const pad = (x, y, rx, ry, rot, k) => ell(x, y, rx, ry, t.rg([D.cactus[0], D.cactus[1], D.cactus[2]], .3, .25, 1), 1, rot, ink('#2e4a2a', .9, .8)) + ell(x - rx * .3, y - ry * .35, rx * .45, ry * .28, '#d4f0c0', .5, rot) + [0, 1, 2, 3, 4].map(i => circ(x + rr.range(-rx * .6, rx * .6), y + rr.range(-ry * .6, ry * .6), .6, '#fff6d8', .8)).join('');
  o += pad(32, 44, 12, 7.4, -4) + pad(22, 33, 8.4, 6.2, -35) + pad(41, 31, 8.8, 6.4, 30) + pad(30, 22, 7, 5.4, -10);
  if (fruit) for (const [x, y] of [[20, 27], [43, 25], [30, 17], [46, 33]]) o += circ(x, y, 2.4, '#c8352b', 1, ink('#6a1a14', .5, .7)) + circ(x - .7, y - .7, .7, '#f08a70', .9);
  return o;
}
tile('trees', 'prickly-pear', 'a', [T, T], ['small', 'cactus', 'obstacle'], (t) => pear(t, 7, false));
tile('trees', 'prickly-pear', 'b', [T, T], ['small', 'cactus', 'obstacle', 'fruit'], (t) => pear(t, 8, true));
function agave(t, seed, n, bloom) {
  const rr = rng(seed), cols = ['#a8d0b8', '#5f9a88', '#2f6a5c']; let o = sh(34, 53, 18, 4.5);
  const ang = []; for (let i = 0; i < n; i++) ang.push(-175 + i * (170 / (n - 1)) + rr.range(-5, 5));
  const order = ang.map(a => [a, Math.abs(Math.cos(a * Math.PI / 180))]).sort((p, q) => q[1] - p[1]);
  for (const [a, s] of order) { const A = a * Math.PI / 180, L = 13 + s * 12 + rr.range(0, 3), x0 = 32, y0 = 50, x1 = x0 + Math.cos(A) * L, y1 = y0 + Math.sin(A) * L * .95 - 2, nx = -Math.sin(A) * 4, ny = Math.cos(A) * 4; o += path(`M${f(x0 + nx * .5)} ${f(y0 + ny * .5)}Q${f(x0 + Math.cos(A) * L * .5 + nx)} ${f(y0 + Math.sin(A) * L * .5 + ny)} ${f(x1)} ${f(y1)}Q${f(x0 + Math.cos(A) * L * .5 - nx)} ${f(y0 + Math.sin(A) * L * .5 - ny)} ${f(x0 - nx * .5)} ${f(y0 - ny * .5)}Z`, s > .7 ? cols[2] : s > .35 ? cols[1] : cols[0], 1, ink('#1f4a3e', .8, .8)) + line(`M${x0} ${y0}L${f(x1)} ${f(y1)}`, cols[0], .8, .6) + circ(x1, y1, .7, '#5a2a1a'); }
  if (bloom) o += line('M32 50V12', '#8a7a4a', 2.4, 1) + [[-4, 20], [4, 16], [-3, 28], [4, 26], [0, 12]].map(([dx, y]) => ell(32 + dx, y, 3, 1.5, '#f3e08a', 1, dx * 8, ink('#8a7a30', .4, .7))).join('');
  return o;
}
tile('trees', 'agave', 'a', [T, T], ['small', 'succulent', 'obstacle'], (t) => agave(t, 11, 13, false));
tile('trees', 'agave', 'b', T128, ['tall', 'succulent', 'obstacle', 'bloom'], (t) => `<g transform="translate(0 58)">${agave(t, 12, 13, true)}</g>`);
// shrubs: tamarisk, creosote, dry bush
function shrub(t, seed, cols, blossom, dry) {
  const rr = rng(seed); let o = sh(34, 52, 17, 4.5);
  const lobes = [[0, 0, 1], [-.7, .2, .66], [.7, .18, .66], [-.3, -.5, .6], [.35, -.5, .58]];
  for (const [dx, dy, k] of lobes) o += circ(32 + dx * 16 + rr.range(-1, 1), 40 + dy * 10, 11 * k, cols[2], 1, ink(D.inkG, .9, .7));
  for (const [dx, dy, k] of lobes) o += circ(30.5 + dx * 16, 38 + dy * 10, 9 * k, t.rg(cols, .3, .25, 1), 1);
  for (let i = 0; i < 14; i++) { const a = rr.range(-3.1, 0), d = rr.range(2, 18); o += ell(32 + Math.cos(a) * d, 40 + Math.sin(a) * d * .55, 3, 1, blossom ? rr.pick(blossom) : cols[0], blossom ? .95 : .6, rr.range(-40, 40)); }
  if (dry) o += [0, 1, 2, 3].map(i => line(`M${28 + i * 3} 48l${f(rr.range(-3, 3))} -5`, '#6b5a38', 1, .7)).join('');
  return o;
}
tile('trees', 'tamarisk', 'a', [T, T], ['small', 'shrub', 'obstacle'], (t) => shrub(t, 21, ['#bcd6a8', '#8ab08a', '#5f8a6a'], ['#f6c6d4', '#fbdde6']));
tile('trees', 'tamarisk', 'b', [T, T], ['small', 'shrub', 'obstacle'], (t) => shrub(t, 22, ['#bcd6a8', '#8ab08a', '#5f8a6a'], null));
tile('trees', 'creosote', 'a', [T, T], ['small', 'shrub'], (t) => shrub(t, 23, ['#d4d88a', '#a8b060', '#7a8a44'], ['#f3d64a'], false));
tile('trees', 'dry-bush', 'a', [T, T], ['small', 'shrub', 'dry'], (t) => shrub(t, 24, ['#e0cf98', '#bfa96a', '#8a7a48'], null, true));

// ---------- rocks ----------
for (const [v, rx, ry, sd] of [['a', 17, 12, 31], ['b', 14, 10, 32], ['c', 19, 11, 33]]) tile('rocks', 'boulder-sandstone', v, [T, T], ['obstacle', 'rock'], (t, r) => rockD(t, rng(sd), 32, 38, rx, ry));
for (const [v, rx, ry, sd] of [['a', 17, 12, 34], ['b', 13, 9, 35]]) tile('rocks', 'boulder-red', v, [T, T], ['obstacle', 'rock', 'red'], (t, r) => rockD(t, rng(sd), 32, 38, rx, ry, D.stoneRed));
for (const [v, sd] of [['a', 36], ['b', 37]]) tile('rocks', 'rock-cluster', v, [T, T], ['rock', 'small'], (t) => rockD(t, rng(sd), 22, 42, 9, 6.4, D.stone, 1, false) + rockD(t, rng(sd + 1), 40, 38, 11, 8, D.stoneRed, 2, false) + rockD(t, rng(sd + 2), 33, 47, 6, 4.4, D.stone, 0, false));
// banded rock mass: polygon with strata clipped inside. pts = outline points
function smooth(pts) { const n = pts.length; let d = `M${f((pts[0][0] + pts[n - 1][0]) / 2)} ${f((pts[0][1] + pts[n - 1][1]) / 2)}`; for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; d += `Q${f(p[0])} ${f(p[1])} ${f((p[0] + q[0]) / 2)} ${f((p[1] + q[1]) / 2)}`; } return d + 'Z'; }
function massive(t, d, y0, y1, x0, x1, cols, rr, nb = 9) {
  const id = t.clip(d); let o = path(d, t.lg([cols[0], cols[1], cols[2]], 0), 1);
  o += `<g clip-path="${id}">`; const bh = (y1 - y0) / nb;
  for (let i = 0; i < nb; i++) { const c = ['#f0c9a0', '#d49a68', '#e4b284', '#b87a50', '#c88a5c'][i % 5]; o += rect(x0, y0 + i * bh + rr.range(-1, 1), x1 - x0, bh * rr.range(.5, .9), c, 0, .28); o += rect(x0, y0 + i * bh, x1 - x0, .9, '#6b3a22', 0, .3); }
  o += path(`M${x0} ${y0}H${f(x0 + (x1 - x0) * .42)}V${y1}H${x0}Z`, '#fff6e0', .14) + path(`M${f(x1 - (x1 - x0) * .38)} ${y0}H${x1}V${y1}H${f(x1 - (x1 - x0) * .38)}Z`, '#3b1e0e', .22);
  for (let i = 0; i < 7; i++) { const x = rr.range(x0 + 6, x1 - 6); o += line(`M${f(x)} ${f(y0 + rr.range(4, 20))}v${f(rr.range(10, 30))}`, '#6b3a22', 1, .35); }
  return o + '</g>' + path(d, 'none', 1, ink('#5a3622', 1.2, .85));
}
for (const [v, sd, w] of [['a', 51, 40], ['b', 52, 30]]) tile('rocks', 'mesa', v, [128, 128], ['large', 'obstacle', 'rock', 'mesa'], (t) => {
  const rr = rng(sd), cx = 64, tw = w + rr.range(-3, 3); let o = sh(70, 114, 54, 7);
  const pts = [[cx - 54, 112], [cx - 48, 96], [cx - 44, 80], [cx - tw - 4, 60], [cx - tw, 40], [cx - tw + 6, 34], [cx, 31], [cx + tw - 6, 34], [cx + tw, 40], [cx + tw + 2, 60], [cx + 42, 82], [cx + 48, 98], [cx + 54, 112]];
  const d = smooth(pts.map(p => [p[0] + rr.range(-1.5, 1.5), p[1]])); o += massive(t, d, 31, 112, cx - 56, cx + 56, D.stoneRed, rr);
  o += ell(cx, 34, tw - 2, 6, '#f2c8a0', 1, 0, ink('#5a3622', 1, .8)) + ell(cx - 8, 32.6, tw * .55, 2.4, '#fff2d8', .6);
  o += ell(cx, 112, 52, 6, '#ecd6a0', .75) + [0, 1, 2, 3].map(i => pebbleD(cx - 40 + i * 24 + rr.range(-4, 4), 112 + rr.range(-1, 2), .8, D.stoneRed)).join('');
  return o;
});
for (const [v, sd, bulge] of [['a', 53, 1], ['b', 54, .7]]) tile('rocks', 'rock-spire', v, T128, ['tall', 'obstacle', 'rock', 'hoodoo'], (t) => {
  const rr = rng(sd); let o = sh(36, 114, 16, 4.5);
  const lv = [[112, 15], [100, 11], [88, 9], [78, 10 + 5 * bulge], [66, 8], [54, 11 + 3 * bulge], [44, 12 + 4 * bulge], [36, 8]], L = [], R = [];
  for (const [y, w] of lv) { L.push([32 - w + rr.range(-1, 1), y]); R.push([32 + w + rr.range(-1, 1), y]); }
  const d = smooth([...L, [27, 26], [33, 24], [38, 28], ...R.reverse()]); o += massive(t, d, 24, 112, 14, 52, D.stoneRed, rr, 8);
  o += ell(32, 36, 9, 2.6, '#f2c8a0', .8) + ell(31, 34, 5, 1.2, '#fff2d8', .6);
  return o;
});
tile('rocks', 'rock-arch', 'a', [128, 128], ['large', 'obstacle', 'rock', 'arch'], (t) => {
  const rr = rng(55); let o = sh(70, 114, 52, 7);
  const out = smooth([[10, 112], [12, 84], [18, 56], [34, 34], [64, 28], [94, 34], [110, 56], [116, 84], [118, 112], [96, 110], [92, 84], [88, 64], [64, 54], [42, 64], [36, 84], [32, 110]].map(p => [p[0] + rr.range(-1.2, 1.2), p[1]]));
  o += massive(t, out, 28, 112, 6, 122, D.stoneRed, rr, 10);
  o += ell(64, 32, 30, 3, '#fff2d8', .5) + ell(64, 112, 50, 5, '#ecd6a0', .7);
  return o;
});

// ---------- grass / reeds ----------
const blade = (x, y, h, lean, c, w = 1.2) => line(`M${f(x)} ${f(y)}q${f(lean * .5)} ${f(-h * .6)} ${f(lean)} ${f(-h)}`, c, w, .95);
for (const [v, sd, cols] of [['a', 61, ['#b8a458', '#d4c47a', '#8a7a3c']], ['b', 62, ['#9aa85a', '#c4cc7a', '#6a7a3c']]]) tile('grass', 'dune-grass', v, [T, T], ['grass', 'concealing', 'dune'], (t) => {
  const rr = rng(sd); let o = ell(33, 50, 17, 3.4, '#3b3a24', .13);
  for (let i = 0; i < 26; i++) { const x = 32 + rr.range(-15, 15), h = rr.range(14, 30) * (1 - Math.abs(x - 32) / 40); o += blade(x, 50 + rr.range(-1, 2), h, (x - 32) * .5 + rr.range(-4, 4), cols[i % 3], 1.1); }
  return o;
});
for (const [v, sd] of [['a', 63], ['b', 64]]) tile('grass', 'reeds-oasis', v, [T, T], ['grass', 'oasis', 'reeds'], (t) => {
  const rr = rng(sd); let o = ell(33, 50, 17, 3.6, '#3b3a24', .14);
  for (let i = 0; i < 20; i++) { const x = 32 + rr.range(-15, 15), h = rr.range(20, 40) * (1 - Math.abs(x - 32) / 44); o += blade(x, 50, h, (x - 32) * .4 + rr.range(-3, 3), ['#6fa84a', '#4f8a3e', '#98c868'][i % 3], 1.3); }
  if (v === 'b') for (const [x, h] of [[26, 38], [37, 42]]) o += line(`M${x} 50V${50 - h}`, '#6a8a3a', 1.2, 1) + ell(x, 50 - h - 3, 1.7, 4.6, '#7a5a30', 1, 0, ink('#3a2a14', .5, .8));
  return o;
});
for (const [v, sd] of [['a', 65], ['b', 66]]) tile('grass', 'papyrus', v, [T, T], ['grass', 'oasis', 'papyrus'], (t) => {
  const rr = rng(sd); let o = ell(33, 51, 17, 3.8, '#3b3a24', .14);
  const stems = [[24, 34], [32, 44], [40, 38], [28, 28], [37, 30]].slice(0, v === 'a' ? 4 : 5);
  for (const [x, h] of stems) { const lean = (x - 32) * .3; o += line(`M${x} 51q${f(lean * .5)} ${-h * .6} ${f(lean)} ${-h}`, '#4f8a3e', 1.8, 1); const tx = x + lean, ty = 51 - h; for (let k = 0; k < 11; k++) { const a = -Math.PI / 2 + (k - 5) * .28; o += line(`M${f(tx)} ${f(ty)}q${f(Math.cos(a) * 5)} ${f(Math.sin(a) * 5 - 1)} ${f(Math.cos(a) * 9 + (k - 5) * .6)} ${f(Math.sin(a) * 9 + 5)}`, k % 2 ? '#6fa84a' : '#98c868', .9, .95); } }
  return o;
});
