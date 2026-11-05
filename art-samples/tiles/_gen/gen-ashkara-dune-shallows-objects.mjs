// Ashkara sub-area 1: Dune Shallows objects (trees and scrub, rocks, grass, props). Interest objects, landmark and gate: gen-ashkara-dune-shallows-interest.mjs.
import { T, rng, hash, f, ell, circ, rect, path, line, ink, D, sh, pebbleD, tuft, blobPath, rockD, C, TALL, LG, tile, mix } from './dune-shallows-lib.mjs';

export const BONE = ['#fffaf0', '#eadcc0', '#b9a583'], DRIFT = ['#f4ead4', '#cdb890', '#8f7a5a'], ROPE = '#9a7a4a';
const SCR = { gray: ['#b6bd8a', '#8f9a60', '#5f6b3e'], olive: ['#c4c48a', '#9a9a58', '#66663a'], blue: ['#b4c8a8', '#86a38a', '#58745c'], dry: ['#d8c88a', '#b09a5a', '#7a6a3a'] };
// curved tapered bone/branch: quadratic p0 -> p1 via c, widths w0 -> w1; returns {d, pt(u)}
export function curve(p0, c, p1, w0, w1) {
  const pt = (u) => [(1 - u) * (1 - u) * p0[0] + 2 * u * (1 - u) * c[0] + u * u * p1[0], (1 - u) * (1 - u) * p0[1] + 2 * u * (1 - u) * c[1] + u * u * p1[1]];
  const nr = (u) => { const a = pt(Math.min(1, u + .02)), b = pt(Math.max(0, u - .02)), dx = a[0] - b[0], dy = a[1] - b[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
  const L = [], R = []; for (let i = 0; i <= 12; i++) { const u = i / 12, p = pt(u), n = nr(u), w = w0 + (w1 - w0) * u; L.push([p[0] + n[0] * w, p[1] + n[1] * w]); R.push([p[0] - n[0] * w, p[1] - n[1] * w]); }
  const s = (q) => f(q[0]) + ' ' + f(q[1]);
  return { d: 'M' + L.map(s).join('L') + 'L' + R.reverse().map(s).join('L') + 'Z', pt, nr, mid: (a, b) => { const out = []; for (let i = 0; i <= 8; i++) { const u = a + (b - a) * i / 8, p = pt(u), n = nr(u), w = (w0 + (w1 - w0) * u) * .45; out.push(f(p[0] + n[0] * w) + ' ' + f(p[1] + n[1] * w)); } return 'M' + out.join('L'); } };
}
export const boneC = (t, p0, c, p1, w0, w1, cols = BONE, inkc = '#6b5a40') => { const k = curve(p0, c, p1, w0, w1); return path(k.d, t.lg(cols, 0), 1, ink(inkc, .9, .85)) + line(k.mid(.04, .92), '#fff', 1, .55); };
const sandHeap = (cx, cy, rx, ry, t) => ell(cx, cy + ry * .3, rx, ry, t.lg(['#fffaea', '#f1dfae', '#d8bc82'], 70), .95) + ell(cx - rx * .3, cy - ry * .15, rx * .45, ry * .3, '#fff', .5, -10);

// ================= trees and scrub =================
function scrubClump(t, r, { cx = 32, cy = 48, n = 12, h = 26, spread = 20, cols = SCR.gray, flower = null, drop = 8 }) {
  let o = sh(cx + 2, cy + 3, spread * .8, 5) + ell(cx, cy + 1, spread * .55, 3.4, '#d8bc82', .55);
  const tips = [];
  for (let i = 0; i < n; i++) { const dx = (i / (n - 1) - .5) * 2 * spread + r.range(-2, 2), hh = h * r.range(.6, 1) * (1 - Math.abs(dx) / (spread * 1.6)); tips.push([dx, hh, i]); }
  tips.sort((a, b) => b[1] - a[1] * 0 - a[1]);
  for (const [dx, hh, i] of tips) {
    const x1 = cx + dx, y1 = cy - hh, cxm = cx + dx * .35, cym = cy - hh * .6;
    o += line(`M${f(cx + dx * .1)} ${f(cy)}Q${f(cxm)} ${f(cym)} ${f(x1)} ${f(y1 + drop * Math.abs(dx) / spread)}`, mix(cols[2], '#2a3a1a', .35), 2.6, .55) + line(`M${f(cx + dx * .1)} ${f(cy)}Q${f(cxm)} ${f(cym)} ${f(x1)} ${f(y1 + drop * Math.abs(dx) / spread)}`, cols[i % 3 === 0 ? 0 : 1], 1.5, 1);
    for (let k = 0; k < 3; k++) { const u = .45 + k * .22, lx = cx + dx * (.1 + u * .9), ly = cy - hh * u + drop * Math.abs(dx) / spread * u * u; o += ell(lx + 1, ly, 2.2, 1, cols[k % 2 ? 0 : 1], .95, -35 + dx * 2) + ell(lx - 1, ly + 1, 2, .9, cols[2], .55, 30); }
    if (flower) o += circ(x1, y1 + drop * Math.abs(dx) / spread, 1.3, flower, 1, ink('#7a6a1c', .3, .5));
  }
  return o + ell(cx, cy, 6, 2.4, cols[2], .55);
}
const SC = { a: { n: 12, h: 26, spread: 20 }, b: { n: 9, h: 20, spread: 15, cols: SCR.olive, flower: '#f3d45a' }, c: { n: 14, h: 30, spread: 23, cols: SCR.blue }, d: { n: 8, h: 16, spread: 13, cols: SCR.dry } };
for (const [v, c] of Object.entries(SC)) tile('trees', 'dune-scrub', v, C, ['small', 'scrub', 'obstacle', 'signature'], (t, r) => scrubClump(t, r, c));
function saltbush(t, r, { cx = 32, cy = 46, rx = 18, ry = 14, c = ['#d6dcb0', '#a4b480', '#6a7c4a'], berries = false }) {
  let o = sh(cx + 2, cy + ry * .5, rx * .95, 5) + path(blobPath(r, cx, cy, rx * .9, ry * .9, 9, .2), t.lg(c, 60), 1, ink('#4a5a3a', .6, .5));
  for (let i = 0; i < 30; i++) { const a = i / 30 * 6.283 + r.range(-.1, .1), x = cx + Math.cos(a) * rx * .98, y = cy + Math.sin(a) * ry * .95; o += ell(x, y, 3.2, 1.3, i % 2 ? c[1] : c[0], 1, a * 57.3 + 90, ink('#4a5a3a', .4, .5)); }
  for (let i = 0; i < 26; i++) { const a = r.range(0, 6.283), d = r.range(.1, .85), x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d * .9 - 1; o += ell(x, y, 2.6, 1.1, i % 3 ? c[0] : c[1], .9, r.range(0, 180), ink(c[2], .3, .4)) + (i % 5 === 0 ? circ(x + 1, y + 1, .9, c[2], .6) : ''); }
  if (berries) for (let i = 0; i < 6; i++) o += circ(cx + r.range(-rx * .6, rx * .6), cy + r.range(-ry * .6, ry * .3), 1.3, '#e8744a', 1, ink('#8a3418', .3, .6));
  return o + ell(cx - rx * .35, cy - ry * .45, rx * .35, ry * .2, '#fff', .35, -20);
}
tile('trees', 'saltbush', 'a', C, ['small', 'bush', 'obstacle'], (t, r) => saltbush(t, r, {}));
tile('trees', 'saltbush', 'b', C, ['small', 'bush', 'obstacle'], (t, r) => saltbush(t, r, { rx: 14, ry: 11, cy: 47, c: ['#e4e8c8', '#b8c4a0', '#7a9072'] }));
tile('trees', 'saltbush', 'c', C, ['small', 'bush', 'obstacle', 'berries'], (t, r) => saltbush(t, r, { rx: 19, ry: 12, berries: true }));
function deadBrush(t, r, { cx = 32, cy = 50, n = 7, len = 22, pale = true }) {
  let o = sh(cx + 2, cy + 2, 14, 4); const col = pale ? ['#f2e8d0', '#c9b894', '#8f7a5a'] : ['#c9b08a', '#9a8260', '#6a5238'];
  const br = (x, y, a, l, d) => { if (d > 3 || l < 4) return ''; const A = a * Math.PI / 180, x1 = x + Math.cos(A) * l, y1 = y + Math.sin(A) * l, c = d === 0 ? col[2] : col[1]; let s = line(`M${f(x)} ${f(y)}L${f(x1)} ${f(y1)}`, '#4a3a24', 2.4 - d * .5, .35) + line(`M${f(x)} ${f(y)}L${f(x1)} ${f(y1)}`, d === 0 ? col[1] : col[0], 1.7 - d * .35, 1); return s + br(x1, y1, a + r.range(-45, -10), l * r.range(.55, .72), d + 1) + br(x1, y1, a + r.range(10, 45), l * r.range(.55, .72), d + 1); };
  for (let i = 0; i < n; i++) o += br(cx + r.range(-4, 4), cy, -90 + (i / (n - 1) - .5) * 120 + r.range(-8, 8), len * r.range(.6, 1), 0);
  return o + ell(cx, cy, 4, 2, col[2], .7);
}
for (const [v, c] of Object.entries({ a: { n: 7, len: 22 }, b: { n: 5, len: 18, pale: false }, c: { n: 9, len: 26 } })) tile('trees', 'dead-brush', v, C, ['small', 'dead', 'obstacle'], (t, r) => deadBrush(t, r, c));
// thorn acacia sapling (64x128): thin leaning trunk, flat sparse canopy
function thornTree(t, r, { lean = 6, top = 40, w = 24, dead = false }) {
  const bx = 32, by = 114; let o = sh(bx + 3, by + 2, 12, 4) + sandHeap(bx, by + 1, 13, 4, t);
  const k = curve([bx, by], [bx - lean, (by + top) / 2 + 10], [bx + lean, top + 8], 3.6, 2.2);
  o += path(k.d, t.lg(dead ? DRIFT : D.wood, 0), 1, ink(D.inkB, .9, .8));
  const arms = [[-1, 18], [1, 22], [-1, 8], [1, 10]];
  for (const [s, dy] of arms) { const k2 = curve([bx + lean * .6, top + dy + 14], [bx + lean + s * w * .5, top + dy + 6], [bx + lean + s * w, top + dy + 12], 2, 1.1); o += path(k2.d, t.lg(dead ? DRIFT : D.wood, 0), 1, ink(D.inkB, .7, .8)); }
  if (!dead) for (const [dx, dy, rx] of [[-w * .8, 16, 11], [-w * .3, 4, 12], [w * .3, 2, 13], [w * .85, 14, 11], [0, 14, 10]]) { const x = bx + lean + dx, y = top + dy + 4; o += ell(x + 1, y + 2, rx, 4.4, '#3b3a24', .1) + ell(x, y, rx, 4.6, t.lg(['#d6dc96', '#a4b25e', '#6f8a3e'], 90), 1, 0, ink(D.inkG, .7, .7)) + ell(x - rx * .3, y - 1.4, rx * .5, 1.5, '#f0f4c0', .7) + [0, 1, 2, 3].map(i => circ(x - rx * .6 + i * rx * .4, y + 1, .7, '#f3d45a', .9)).join(''); }
  else for (const [dx, dy] of [[-20, 24], [20, 28], [-8, 10], [10, 6]]) o += line(`M${bx + lean + dx * .4} ${top + dy + 6}l${dx * .6} ${-6}`, '#8f7a5a', 1.2, .8);
  return o;
}
tile('trees', 'thorn-acacia', 'a', TALL, ['tall', 'tree', 'obstacle', 'signature'], (t, r) => thornTree(t, r, {}));
tile('trees', 'thorn-acacia', 'b', TALL, ['tall', 'tree', 'obstacle'], (t, r) => thornTree(t, r, { lean: -7, top: 48, w: 20 }));
tile('trees', 'thorn-acacia', 'c', TALL, ['tall', 'tree', 'obstacle', 'dead'], (t, r) => thornTree(t, r, { lean: 3, top: 44, dead: true }));
function deadTree(t, r, { lean = -4, fork = true }) {
  const bx = 32, by = 114; let o = sh(bx + 3, by + 2, 13, 4) + sandHeap(bx, by, 14, 4.4, t);
  o += path(curve([bx, by], [bx + lean * 2, 84], [bx + lean * 3, 52], 5.6, 2.4).d, t.lg(DRIFT, 0), 1, ink('#5a4a30', .9, .8));
  for (const [x0, y0, a, l, w] of [[bx + lean * 2.4, 70, -150, 26, 2.2], [bx + lean * 2.8, 60, -35, 22, 2], [bx + lean * 3, 52, -110, 22, 1.8], ...(fork ? [[bx + lean * 3, 52, -70, 18, 1.6]] : [])]) { const A = a * Math.PI / 180, x1 = x0 + Math.cos(A) * l, y1 = y0 + Math.sin(A) * l; o += path(curve([x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 - 4], [x1, y1], w, .7).d, t.lg(DRIFT, 0), 1, ink('#5a4a30', .7, .8)); }
  for (let i = 0; i < 6; i++) o += line(`M${bx - 3 + i * 1.2 + lean * (i / 4)} ${by - 4 - i * 9}q1.6-3 .4-6`, '#8f7a5a', 1, .55);
  return o + ell(bx + lean * 3 - 1, 54, 2, 4, '#fffaf0', .5);
}
tile('trees', 'dead-tree-bleached', 'a', TALL, ['tall', 'dead', 'obstacle'], (t, r) => deadTree(t, r, {}));
tile('trees', 'dead-tree-bleached', 'b', TALL, ['tall', 'dead', 'obstacle'], (t, r) => deadTree(t, r, { lean: 5, fork: false }));
// sea-rocket / beach-morning-glory style creeper cushion: low flowering mat
tile('trees', 'dune-creeper', 'a', C, ['small', 'flowers'], (t, r) => { let o = sh(34, 50, 18, 4); o += ell(32, 46, 20, 8, t.lg(['#b8d28a', '#8fb062', '#5f8a42'], 70), 1, 0, ink(D.inkG, .8, .7)); for (let i = 0; i < 9; i++) { const x = r.range(16, 48), y = r.range(41, 51); o += circ(x, y, 3.2, '#f6b4cc', 1, ink('#a8607a', .4, .5)) + circ(x, y, 1.2, '#fff6c0'); } return o; });

// ================= rocks =================
const PALE = ['#f8ecd2', '#dcc79e', '#a8906a'], PINK = ['#f6dcc4', '#dcae88', '#a47a58'];
const buried = (t, cx, cy, rx) => ell(cx, cy, rx, 5.4, t.lg(['#fffaea', '#f1dfae', '#d8bc82'], 80), .96) + ell(cx - rx * .3, cy - 1.4, rx * .45, 1.8, '#fff', .55);
for (const [v, cx, cy, rx, ry, c] of [['a', 32, 42, 17, 13, PALE], ['b', 30, 44, 13, 10, PINK], ['c', 34, 42, 20, 11, PALE], ['d', 32, 44, 10, 8, PALE]]) tile('rocks', 'sandwashed-rock', v, C, ['small', 'rock', 'obstacle'], (t, r) => rockD(t, r, cx, cy, rx, ry, c, 3, true) + (v === 'b' ? buried(t, 31, 49, 15) : ''));
for (const [v, rx, ry, k] of [['a', 15, 11, 0], ['b', 12, 9, 1], ['c', 18, 10, 2]]) tile('rocks', 'half-buried-rock', v, C, ['small', 'rock', 'obstacle', 'buried'], (t, r) => { let o = rockD(t, r, 32, 44, rx, ry, PALE, 2, true); return o + buried(t, 32, 44 + ry * .5, rx + 3) + buried(t, 22 + k * 10, 44 + ry * .55, 9); });
tile('rocks', 'pitted-boulder', 'a', C, ['small', 'rock', 'obstacle'], (t, r) => { let o = rockD(t, r, 32, 42, 19, 14, PALE, 0, false); for (let i = 0; i < 9; i++) { const x = r.range(20, 44), y = r.range(32, 50); o += ell(x, y, r.range(1.3, 2.6), r.range(1, 1.8), '#8f7448', .5) + ell(x - .4, y - .5, 1, .6, '#fff', .5); } return o; });
tile('rocks', 'fossil-boulder', 'a', C, ['small', 'rock', 'obstacle', 'fossil'], (t, r) => { let o = rockD(t, r, 32, 42, 19, 14, PINK, 1, true); o += circ(33, 40, 6, '#f8ecd2', .9, ink('#8f7a5a', .7, .8)); for (const rr of [4.2, 2.8, 1.4]) o += circ(33, 40, rr, 'none', 1, ink('#b9a583', .8, .8)); return o; });
tile('rocks', 'fossil-boulder', 'b', C, ['small', 'rock', 'obstacle', 'fossil'], (t, r) => rockD(t, r, 30, 43, 17, 12, PALE, 1, true) + `<g stroke="#8f7a5a" stroke-width=".8" fill="#f6ecd6"><path d="M22 40q8-6 18-1l4 3q-7 4-14 2q-5 2-8-4Z"/><circle cx="41" cy="40.4" r=".9" fill="#6b5a40" stroke="none"/></g>` + buried(t, 30, 51, 14));
for (const [v, h, lean] of [['a', 74, 2], ['b', 62, -2]]) tile('rocks', 'wind-pillar', v, TALL, ['tall', 'rock', 'obstacle', 'signature'], (t, r) => {
  let o = sh(36, 112, 18, 5), by = 112, top = by - h;
  o += path(`M18 ${by}Q22 ${top + 40} ${26 + lean} ${top + 14}Q30 ${top - 2} 36 ${top}Q44 ${top + 2} 44 ${top + 16}Q44 ${top + 46} 50 ${by}Z`, t.lg(['#f8ecd2', '#dcc79e', '#a8906a'], 10), 1, ink(D.inkS, 1, .8));
  o += path(`M${26 + lean} ${top + 16}Q32 ${top + 2} 38 ${top + 3}Q32 ${top + 18} ${27 + lean} ${top + 48}Z`, '#fff', .35);
  for (let i = 0; i < 4; i++) { const y = top + 18 + i * (h - 26) / 4; o += line(`M${22 + i} ${f(y)}q12 ${i % 2 ? 3 : -3} 24 0`, '#a8906a', 1.1, .45) + line(`M${23 + i} ${f(y + 1.4)}q12 ${i % 2 ? 3 : -3} 22 0`, '#fff6e0', .8, .4); }
  return o + buried(t, 34, by + 1, 22);
});
// ================= grass =================
function marram(t, r, { n = 14, h = 28, spread = 18, cols = ['#e8e2a8', '#c2c07a', '#8a8a4e'], seeds = false, cx = 32, cy = 52 }) {
  let o = sh(cx + 2, cy + 2, spread * .7, 4);
  for (let i = 0; i < n; i++) { const dx = (i / (n - 1) - .5) * 2 * spread * r.range(.7, 1), hh = h * r.range(.55, 1) * (1 - Math.abs(dx) / (spread * 2.2)), c = cols[i % 3]; const d = `M${f(cx + dx * .15)} ${f(cy)}Q${f(cx + dx * .5)} ${f(cy - hh * .7)} ${f(cx + dx * 1.2)} ${f(cy - hh + Math.abs(dx) * .35)}`; o += line(d, cols[2], 2.2, .5) + line(d, c, 1.3, 1); if (seeds && i % 3 === 0) o += ell(cx + dx * 1.2, cy - hh + Math.abs(dx) * .35 - 2, 1, 3, '#e8c870', 1, dx * 2, ink('#8a6a28', .4, .6)); }
  return o;
}
for (const [v, c] of Object.entries({ a: {}, b: { n: 10, h: 22, spread: 13 }, c: { n: 16, h: 32, spread: 20, cols: ['#d6d890', '#a8b068', '#6f8040'] } })) tile('grass', 'marram-pale', v, C, ['small', 'grass', 'dune', 'signature'], (t, r) => marram(t, r, c));
for (const [v, c] of Object.entries({ a: { n: 8, h: 30, spread: 12, seeds: true }, b: { n: 11, h: 26, spread: 16, seeds: true, cols: ['#e8d8a0', '#c4b070', '#8f7a40'] } })) tile('grass', 'sea-oats', v, C, ['small', 'grass', 'dune'], (t, r) => marram(t, r, c));

// ================= props =================
const prop = (name, v, fn, tags = [], size = C) => tile('props', name, v, size, ['prop', ...tags], fn);
// cairn: stacked stones, widest at the bottom
const STN = [['#f4dcb0', '#dcae7c'], ['#e8d4b4', '#c4a47c'], ['#f0e0c4', '#cbb08a'], ['#e0c8a4', '#b8946c']];
function cairn(t, r, stones, cx = 32, by = 54, ex = '') {
  let o = sh(cx + 2, by + 1, stones[0][0] + 3, 4) + ell(cx, by + 1, stones[0][0] + 2, 3, '#e8c98c', .7); let y = by;
  stones.forEach(([rx, ry], i) => { y -= ry * 1.45; const x = cx + (i % 2 ? 1.2 : -1.2) * (i / 2); o += ell(x + .6, y + ry * .55, rx, ry * .5, '#3b3a24', .12) + ell(x, y, rx, ry, t.lg(STN[i % 4], 60), 1, 0, ink(D.inkS, .8, .8)) + ell(x - rx * .3, y - ry * .35, rx * .45, ry * .3, '#fff', .55) + line(`M${f(x - rx * .7)} ${f(y + ry * .3)}q${f(rx * .7)} ${f(ry * .3)} ${f(rx * 1.4)} 0`, '#a97a52', 1, .35); });
  return o + ex(y, cx);
}
prop('cairn-trail', 'a', (t, r) => cairn(t, r, [[11, 5], [8.5, 4.2], [6, 3.6]], 32, 54, () => ''), ['cairn', 'signature', 'obstacle']);
prop('cairn-trail', 'b', (t, r) => cairn(t, r, [[13, 5.4], [10, 4.6], [7.6, 4], [5, 3.2]], 32, 56, (y, cx) => ''), ['cairn', 'signature', 'obstacle']);
prop('cairn-trail', 'c', (t, r) => cairn(t, r, [[9, 4.6], [6.6, 3.6]], 32, 54, (y, cx) => path(`M${cx - 4} ${y - 2}l1-6l3 1l2 5Z`, BONE[1], 1, ink('#6b5a40', .7, .8))), ['cairn', 'bone']);
prop('cairn-trail', 'd', (t, r) => cairn(t, r, [[12, 5], [9.4, 4.4], [7, 3.8], [4.6, 3]], 32, 56, (y, cx) => line(`M${cx} ${y - 3}v-8`, '#8a6238', 1.2) + path(`M${cx} ${y - 11}l9 2l-9 3Z`, '#d8503a', 1, ink('#7a1e24', .5, .8))), ['cairn', 'flag']);
for (const [v, rr, n] of [['a', 12, 9], ['b', 9, 7], ['c', 14, 11]]) prop('tumbleweed', v, (t, r) => { let o = sh(34, 49, rr * 1.05, 4) ; o += circ(32, 44 - 1, rr, 'none', 1, ink('#5a4a30', 1.4, .4)); for (let i = 0; i < n * 3; i++) { const a = r.range(0, 6.283), a2 = a + r.range(1.6, 3.4), c = r.pick(['#d8c28a', '#b49a5c', '#e8d8a8', '#8f7a48']); const cx = 32, cy = 43; o += line(`M${f(cx + Math.cos(a) * rr * .95)} ${f(cy + Math.sin(a) * rr * .95)}Q${f(cx + r.range(-3, 3))} ${f(cy + r.range(-3, 3))} ${f(cx + Math.cos(a2) * rr * .95)} ${f(cy + Math.sin(a2) * rr * .95)}`, c, 1, .9); } return o + ell(32 - rr * .3, 43 - rr * .4, rr * .4, rr * .2, '#fff6d0', .3); }, ['tumbleweed', 'signature']);
// bones
prop('rib-bone', 'a', (t) => ell(34, 46, 16, 3, '#3b3a24', .14) + boneC(t, [14, 46], [24, 26], [50, 40], 3.8, 1.2), ['bone', 'signature']);
prop('rib-bone', 'b', (t) => ell(34, 48, 15, 3, '#3b3a24', .14) + boneC(t, [16, 48], [18, 28], [46, 30], 3.4, 1.1) + boneC(t, [22, 50], [32, 40], [52, 44], 2.6, 1), ['bone']);
prop('rib-bone', 'c', (t) => ell(34, 46, 17, 3, '#3b3a24', .14) + boneC(t, [12, 44], [30, 38], [54, 46], 3.4, 1.1) + circ(54, 46, 1.6, BONE[1], 1, ink('#6b5a40', .6, .8)), ['bone']);
prop('vertebra', 'a', (t) => ell(34, 48, 12, 3.4, '#3b3a24', .14) + ell(32, 44, 11, 8, t.lg(BONE, 50), 1, 0, ink('#6b5a40', 1, .85)) + ell(32, 44, 4.6, 3.4, '#6b5a40', .6) + ell(32, 43, 3.4, 2.4, '#8a7456', .7) + [[-9, -2, 18], [9, -2, -18], [0, -9, 0]].map(([x, y, a]) => path(`M${32 + x} ${44 + y}l${a / 6} -5l3 4Z`, BONE[1], 1, ink('#6b5a40', .6, .8))).join(''), ['bone', 'whale']);
prop('vertebra', 'b', (t) => ell(34, 48, 15, 4, '#3b3a24', .14) + [0, 1].map(i => ell(24 + i * 15, 44 + i * 1, 8, 6.4, t.lg(BONE, 50), 1, 0, ink('#6b5a40', 1, .85)) + ell(24 + i * 15, 44 + i, 3, 2.4, '#6b5a40', .6)).join(''), ['bone', 'whale']);
prop('whale-jaw', 'a', (t) => ell(34, 50, 24, 3.4, '#3b3a24', .14) + boneC(t, [8, 50], [22, 22], [56, 44], 4.6, 1.4) + [0, 1, 2, 3, 4].map(i => { const u = .25 + i * .15, x = 8 + (56 - 8) * u * .9 + 4, y = 50 - Math.sin(u * 3.1) * 20 + u * 6; return path(`M${f(x)} ${f(y + 1)}l1.6 4l1.6 -4Z`, '#fff', 1, ink('#6b5a40', .5, .8)); }).join(''), ['bone', 'whale', 'signature']);
prop('skull-camel', 'a', (t) => ell(34, 48, 16, 4, '#3b3a24', .14) + path('M12 44Q14 34 26 33Q36 32 46 38Q54 41 54 46Q50 49 40 48Q30 49 12 44Z', t.lg(BONE, 60), 1, ink('#6b5a40', 1, .85)) + ell(27, 39, 3.4, 2.6, '#4a3a28', 1) + circ(50, 43.6, 1, '#4a3a28') + ell(18, 42, 1.2, 1.8, '#4a3a28') + path('M30 48l2 3h3l1-3Z', BONE[1], 1, ink('#6b5a40', .5, .8)), ['bone', 'skull']);
// driftwood
for (const [v, pp] of [['a', [[10, 46], [34, 38], [56, 44]]], ['b', [[12, 40], [30, 46], [54, 36]]], ['c', [[14, 48], [34, 34], [52, 30]]]]) prop('driftwood', v, (t) => ell(34, 50, 20, 3, '#3b3a24', .14) + path(curve(pp[0], pp[1], pp[2], 4, 2.4).d, t.lg(DRIFT, 90), 1, ink('#5a4a30', 1, .85)) + line(`M${pp[0][0] + 4} ${pp[0][1] - 1}Q${pp[1][0]} ${pp[1][1] - 2} ${pp[2][0] - 4} ${pp[2][1] - 1}`, '#fffaf0', 1, .6) + (v === 'b' ? line('M30 41l-5 -9M30 41l8 -8', '#cdb890', 2, 1) : ''), ['driftwood']);
prop('wagon-wheel', 'a', (t) => { let o = ell(34, 52, 17, 4, '#3b3a24', .16) + ell(32, 43, 16, 14, 'none', 1, 0, { stroke: '#3b3a24', 'stroke-width': 5, 'stroke-opacity': .35 }) + ell(32, 43, 16, 14, 'none', 1, 0, { stroke: D.wood[1], 'stroke-width': 4 }) + ell(32, 43, 16, 14, 'none', 1, 0, { stroke: D.wood[0], 'stroke-width': 1.2, 'stroke-opacity': .7 }); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; o += line(`M32 43L${f(32 + Math.cos(a) * 15)} ${f(43 + Math.sin(a) * 13)}`, D.wood[2], 1.8, 1); } return o + ell(32, 43, 3.6, 3.2, D.wood[1], 1, 0, ink(D.inkB, .8, .8)) + circ(32, 43, 1.2, '#3a3a3a') + ell(32, 56, 22, 5, '#f1dfae', .95); }, ['wagon', 'buried']);
prop('wagon-wheel', 'b', (t) => { let o = ell(34, 52, 17, 4, '#3b3a24', .16) + ell(32, 40, 15, 14, 'none', 1, 0, { stroke: D.wood[1], 'stroke-width': 4 }); for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7 - .4; o += line(`M32 40L${f(32 + Math.cos(a) * 14)} ${f(40 + Math.sin(a) * 13)}`, D.wood[2], 1.8, 1); } return o + ell(32, 40, 3.2, 3, D.wood[1], 1, 0, ink(D.inkB, .8, .8)) + sandHeap(32, 54, 24, 7, t) ; }, ['wagon', 'buried']);
prop('crate-broken', 'a', (t) => ell(34, 52, 17, 4, '#3b3a24', .16) + path('M14 50L16 34L38 32L40 48Z', t.lg(D.wood, 60), 1, ink(D.inkB, .9, .85)) + line('M15 41L39 39M17 34L38 33', D.wood[2], 1, .6) + path('M36 50L44 40L52 44L46 52Z', t.lg(D.wood, 60), 1, ink(D.inkB, .8, .85)) + line('M16 36l22 12M38 34l-20 12', D.wood[2], 1.4, .6) + sandHeap(30, 54, 18, 5, t), ['crate', 'wagon']);
prop('barrel-sand', 'a', (t) => ell(34, 52, 15, 4, '#3b3a24', .16) + path('M18 50Q15 40 18 30Q32 26 46 30Q49 40 46 50Q32 54 18 50Z', t.lg(D.wood, 0), 1, ink(D.inkB, 1, .85)) + [34, 41, 47].map(y => line(`M17 ${y}Q32 ${y + 3} 47 ${y}`, '#5a4a30', 1.4, .8)).join('') + ell(32, 30, 14, 3.4, D.wood[0], 1, 0, ink(D.inkB, .8, .85)) + ell(32, 30, 11, 2.4, '#f1dfae', 1) + sandHeap(30, 55, 18, 4, t), ['barrel']);
for (const [v, a] of [['a', 18], ['b', -70]]) prop('amphora-buried', v, (t) => { let o = ell(34, 52, 13, 3.4, '#3b3a24', .14) + `<g transform="rotate(${a} 32 44)">` + path('M24 30Q22 44 28 56Q32 60 36 56Q42 44 40 30Q32 26 24 30Z', t.lg(D.brick, 0), 1, ink(D.inkB, 1, .85)) + path('M28 30Q28 22 30 18H34Q36 22 36 30Z', D.brick[0], 1, ink(D.inkB, .9, .85)) + path('M26 30Q18 32 26 40', 'none', 1, ink(D.inkB, 1.4, .85)) + path('M38 30Q46 32 38 40', 'none', 1, ink(D.inkB, 1.4, .85)) + line('M26 40Q32 43 38 40M26 46Q32 49 38 46', D.brick[2], 1, .5) + '</g>'; return o + sandHeap(32, 54, 18, 5, t); }, ['jar', 'buried']);
prop('water-skin', 'a', (t) => ell(34, 52, 15, 3.6, '#3b3a24', .15) + path('M18 48Q16 38 24 36Q34 32 44 38Q50 44 44 50Q30 54 18 48Z', t.lg(['#d8a878', '#b07c4c', '#7a5030'], 40), 1, ink(D.inkB, 1, .85)) + path('M44 40l6-4l2 4l-6 5Z', '#8a6238', 1, ink(D.inkB, .8, .85)) + line('M22 46q10 3 22-2', '#5a3c20', 1, .6) + ell(26, 40, 4, 1.6, '#fff', .35, -20), ['skin', 'supply']);
prop('sack-cloth', 'a', (t) => ell(34, 52, 13, 3.4, '#3b3a24', .15) + path('M20 52Q16 40 24 32Q26 28 30 28H34Q38 28 40 32Q48 40 44 52Q32 56 20 52Z', t.lg(D.linen, 50), 1, ink('#8a7458', 1, .8)) + path('M27 30Q32 34 37 30', 'none', 1, ink('#8a7458', 1.4, .8)) + line('M28 31q4 -3 8 0', ROPE, 2, 1) + line('M24 40q8 4 16 0', '#c8aa7c', 1, .6), ['sack', 'supply']);
for (const [v, flip] of [['a', 1], ['b', -1]]) prop('signpost-arrow', v, (t) => { const s = flip; let o = ell(34, 54, 10, 3, '#3b3a24', .15) + sandHeap(32, 54, 12, 3, t) + path('M30 54L30.6 14Q32 12 33.4 14L34 54Z', t.lg(DRIFT, 0), 1, ink('#5a4a30', .9, .85)); const bd = (y, dir, w) => path(dir > 0 ? `M31 ${y}H${31 + w}L${31 + w + 7} ${y + 4}L${31 + w} ${y + 8}H31Z` : `M33 ${y}H${33 - w}L${33 - w - 7} ${y + 4}L${33 - w} ${y + 8}H33Z`, t.lg(['#f2e6cc', '#cdb890'], 90), 1, ink('#5a4a30', .8, .85)) + circ(32, y + 4, .9, '#5a4a30'); return o + bd(16, s, 14) + bd(30, -s, 11); }, ['sign', 'tall-ish']);
for (const [v, c] of [['a', '#d8503a'], ['b', '#3fb0ac']]) prop('pennant-stake', v, (t) => ell(33, 55, 6, 2, '#3b3a24', .15) + line('M32 56L31 10', D.wood[1], 2, 1) + path(`M31 12Q42 12 52 16Q42 20 31 22Z`, c, 1, ink('#5a3a24', .6, .8)) + path('M31 12Q42 12 52 16Q44 14 31 15Z', '#fff', .35) + circ(31, 10, 1.6, D.gold[1], 1, ink('#5a3a0a', .4, .8)), ['flag', 'waypoint']);
prop('fire-ring-cold', 'a', (t) => ell(32, 46, 17, 7, '#3b3a24', .13) + ell(32, 45, 14, 5.6, '#6a5a44', .9) + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => { const a = i / 9 * 6.283; return ell(32 + Math.cos(a) * 14, 45 + Math.sin(a) * 5.4, 3.8, 2.8, t.lg(STN[i % 4], 60), 1, 0, ink(D.inkS, .8, .8)); }).join('') + line('M24 46l10-3M26 42l8 5M36 44l-9 2', '#3a2c20', 2.2, 1) + ell(32, 45, 5, 1.6, '#9a9488', .7), ['camp', 'fire']);
prop('tent-scrap', 'a', (t) => ell(34, 52, 18, 4, '#3b3a24', .14) + path('M12 50Q20 36 30 40Q40 30 52 46Q44 54 30 52Q20 54 12 50Z', t.lg(D.linen, 45), 1, ink('#8a7458', 1, .8)) + line('M30 40Q32 46 28 51M40 34Q42 42 44 49', '#c8aa7c', 1.2, .7) + line('M16 49l-3 4M50 46l4 3', ROPE, 1.4, 1) + sandHeap(34, 54, 18, 4, t), ['camp', 'cloth']);
prop('lantern-fallen', 'a', (t) => ell(34, 52, 12, 3, '#3b3a24', .15) + path('M22 52L24 40H40L42 52Z', t.lg(['#7a6a5a', '#4a3a2a'], 0), 1, ink('#2a2018', .9, .85)) + path('M26 42H38V50H26Z', '#f3e2a0', .85) + line('M24 40Q32 30 40 40', '#2a2018', 1.4, 1) + line('M32 46v-2', '#c88a3a', 1, 1), ['lantern']);
prop('sandal-lost', 'a', (t) => ell(34, 50, 10, 2.6, '#3b3a24', .14) + path('M22 44Q20 38 26 36L38 40Q44 42 42 48Q32 50 22 44Z', '#c8946a', 1, ink(D.inkB, .9, .85)) + line('M28 38q4 4 2 8M33 40q3 3 2 7', '#7a5030', 1.3, .9), ['lost']);
prop('rope-coil', 'a', (t) => ell(34, 50, 12, 3.4, '#3b3a24', .14) + [11, 8, 5].map((rr, i) => ell(32, 44 - i * .6, rr, rr * .6, 'none', 1, 0, { stroke: i % 2 ? ROPE : '#b8945a', 'stroke-width': 2.6 })).join('') + ell(32, 43, 2, 1.2, '#5a3c20', .8) + line('M40 46q8 3 12 8', ROPE, 2.4, 1), ['rope']);
prop('tools-dig', 'a', (t) => ell(34, 54, 16, 3, '#3b3a24', .14) + sandHeap(30, 52, 14, 4, t) + line('M22 54L40 16', D.wood[1], 2.4, 1) + path('M34 24L46 20L48 28L38 32Z', '#9a9488', 1, ink('#4a4640', .9, .85)) + line('M36 26l10-4', '#fff', .8, .6) + line('M30 54L16 22', D.wood[0], 2.2, 1) + path('M10 22L22 18L22 26L12 28Z', '#b8b4a8', 1, ink('#4a4640', .8, .85)), ['dig', 'tools']);
prop('sieve-frame', 'a', (t) => ell(34, 52, 16, 3.4, '#3b3a24', .14) + path('M14 48L18 30H48L52 48Z', 'none', 1, ink(D.inkB, 3.2, .9)) + path('M14 48L18 30H48L52 48Z', '#e8d4a0', .55) + `<g stroke="#8a6238" stroke-width=".7" opacity=".6">${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${20 + i * 5.4} 31L${17 + i * 6.2} 47"/>`).join('')}${[0, 1, 2].map(i => `<path d="M17 ${35 + i * 5}H50"/>`).join('')}</g>` + path('M14 48L18 30H48L52 48Z', 'none', 1, ink(D.wood[1], 2, 1)), ['dig', 'tools']);
prop('bottle-message', 'a', (t) => ell(34, 52, 12, 3, '#3b3a24', .14) + sandHeap(32, 52, 14, 4, t) + path('M22 48Q20 44 24 42L40 40Q46 42 44 46Q32 50 22 48Z', '#9fd8d0', .75, ink('#2f7a86', .9, .8)) + path('M42 41l4-1l1 3l-4 1Z', '#b88458', 1, ink(D.inkB, .5, .8)) + path('M26 44l12-2v3l-12 2Z', '#fff6e0', .9) + ell(28, 43, 4, 1, '#fff', .6, -10), ['bottle', 'loot']);
prop('bone-pile', 'a', (t) => ell(34, 52, 18, 4, '#3b3a24', .14) + [[16, 48, 36, 40], [24, 44, 52, 48], [20, 52, 44, 46], [30, 38, 46, 50]].map(([x0, y0, x1, y1]) => boneC(t, [x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 - 5], [x1, y1], 2.2, 1.4)).join('') + circ(32, 42, 4.6, t.lg(BONE, 50), 1, ink('#6b5a40', .9, .85)) + ell(31, 41.4, 1, 1.2, '#4a3a28') + ell(34, 41.4, 1, 1.2, '#4a3a28'), ['bone']);
prop('well-dry', 'a', (t) => { let o = ell(36, 54, 22, 5, '#3b3a24', .16) + sandHeap(32, 54, 24, 6, t); o += path('M16 52L18 34H46L48 52Z', t.lg(['#f4dcb0', '#dcae7c', '#b88458'], 0), 1, ink(D.inkS, 1, .85)) + ell(32, 34, 14, 5, D.stone[2], 1, 0, ink(D.inkS, 1, .85)) + ell(32, 35, 11, 3.6, '#2a1c10', 1) + line('M18 40h28M18 46h28', D.stone[2], 1, .45); o += line('M18 34L18 12M46 34L46 12', D.wood[1], 2.4, 1) + line('M16 14H48', D.wood[2], 2.8, 1) + line('M32 14v14', ROPE, 1.2, 1) + path('M28 28h8l-1 6h-6Z', D.wood[1], 1, ink(D.inkB, .8, .85)); return o; }, ['well', 'dry', 'obstacle']);
// windsock poles (64x128)
for (const [v, filled] of [['a', true], ['b', false]]) prop('windsock-pole', v, (t) => {
  let o = ell(34, 118, 9, 3, '#3b3a24', .16) + sandHeap(32, 118, 12, 3.6, t) + path('M30 118L30.6 16Q32 14 33.4 16L34 118Z', t.lg(['#f2f2f0', '#c8c8c4', '#8a8a86'], 0), 1, ink('#4a4a46', .9, .85)) + circ(32, 14, 2.4, D.gold[1], 1, ink('#5a3a0a', .6, .85)) + line('M32 16v6', '#8a8a86', 1.2, 1);
  const bands = ['#e8503a', '#fff6e8', '#e8503a', '#fff6e8', '#e8503a'];
  if (filled) { for (let i = 0; i < 5; i++) { const x0 = 33 + i * 5.4, w0 = 11 - i * 1.5, w1 = 11 - (i + 1) * 1.5, y = 24 + i * .6; o += path(`M${f(x0)} ${f(y - w0 / 2)}L${f(x0 + 5.6)} ${f(y + .6 - w1 / 2)}V${f(y + .6 + w1 / 2)}L${f(x0)} ${f(y + w0 / 2)}Z`, bands[i], 1, ink('#7a2418', .6, .8)); } o += ell(33, 24, 1.4, 5.6, '#7a6a5a', 1, 0, ink('#4a3a2a', .8, .8)); }
  else { for (let i = 0; i < 5; i++) { const y0 = 24 + i * 6, w0 = 10 - i * 1.5, w1 = 10 - (i + 1) * 1.5; o += path(`M${f(33 - w0 / 2)} ${f(y0)}L${f(33 + w0 / 2)} ${f(y0)}L${f(33 + w1 / 2)} ${f(y0 + 6.2)}L${f(33 - w1 / 2)} ${f(y0 + 6.2)}Z`, bands[i], 1, ink('#7a2418', .6, .8)); } o += ell(33, 24, 5.6, 1.4, '#7a6a5a', 1, 0, ink('#4a3a2a', .8, .8)); }
  return o;
}, ['windsock', 'tall', 'signature', 'obstacle'], TALL);
// tall waypoint cairn pole (64x128): cairn with a staff and ribbons
prop('waypoint-staff', 'a', (t) => { let o = ell(36, 118, 15, 4, '#3b3a24', .16) + sandHeap(32, 118, 18, 5, t) + line('M32 106L32 14', D.wood[1], 3, 1) + line('M30.8 106L30.8 14', D.wood[0], 1, .6); for (const [x, y, c] of [[32, 20, '#d8503a'], [32, 30, '#3fb0ac'], [32, 40, '#f3c24f']]) o += path(`M${x} ${y}q10 -3 18 2q-8 2 -18 5Z`, c, 1, ink('#5a3a24', .5, .8)); o += path('M18 112Q16 100 22 96H42Q48 100 46 112Z', t.lg(STN[0], 60), 1, ink(D.inkS, .9, .8)) + path('M22 98Q22 90 28 88H38Q44 90 42 98Z', t.lg(STN[1], 60), 1, ink(D.inkS, .9, .8)); return o + circ(32, 12, 2.4, D.gold[1], 1, ink('#5a3a0a', .5, .85)); }, ['waypoint', 'tall', 'obstacle'], TALL);
