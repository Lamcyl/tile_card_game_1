// Ashkara (desert region) shared palette and drawing helpers. Used by gen-desert-*.mjs. Same rules as Greenvale:
// light from the upper left, 3-layer soft drop shadow, ink edge in a dark tint of the fill, wrapped (seamless) ground skeletons.
import { T, P, rng, hash, f, newTile, save, ell, circ, rect, path, line, ink, shadow, blobPath, tuft, wrapped } from './lib.mjs';
import { BLOBS, blobGeom, pad3 } from './ground.mjs';
export { T, P, rng, hash, f, ell, circ, rect, path, line, ink, shadow, blobPath, tuft, wrapped, BLOBS, blobGeom, pad3 };

export const REGION = 'ashkara';
export const D = {
  sand: ['#f3e2b4', '#ecd6a0', '#dcc080'],
  stone: ['#f4dcb0', '#dcae7c', '#a97a52'],        // sandstone light -> dark
  stoneRed: ['#e8b48a', '#c47e56', '#8c4e36'],
  brick: ['#e2b684', '#c58f5c', '#8e6038'],        // mud brick
  wood: ['#b8905c', '#8a6238', '#5a3c20'],
  palm: ['#b8d66e', '#74a84a', '#3e7a3a'],         // date palm fronds
  acacia: ['#c6cf7a', '#93ab52', '#5f7f3a'],
  cactus: ['#9ccf8a', '#5fa05e', '#37733f'],
  linen: ['#fff6e0', '#ecd9b4', '#c8aa7c'],
  teal: ['#8fe0d4', '#3fb0ac', '#1f7a86'],
  rug: ['#d8503a', '#b02e2e', '#7a1e24'],
  gold: ['#fff0a8', '#f3c24f', '#b8862a'],
  inkS: '#6b4528', inkB: '#5a3a24', inkG: '#2e4a2a', inkT: '#1f4a56', inkL: '#8a7860',
  bone: ['#fffaf0', '#eadcc0', '#bfa888'],
};
// ground families: all share one wash geometry (seed 'dskel'), only colours differ, so washes continue across family borders
export const FAMS = {
  sand: { key: 'dsand', b: '#ecd6a0', w: ['#e4c88a', '#f3e2b4', '#dcc080', '#f0dca8'], rim: '#c9a468', tuft: '#b08c4c' },
  dune: { key: 'ddune', b: '#e8c98c', w: ['#dcb676', '#f1d9a2', '#d2aa68', '#f4e0b2'], rim: '#b98d52', tuft: '#a07c3c' },
  pan: { key: 'dpan', b: '#d9bf94', w: ['#cdb083', '#e2cca4', '#c2a475', '#e8d6b4'], rim: '#9f8058', tuft: '#8a7048' },
  reg: { key: 'dreg', b: '#cdb892', w: ['#bfa87e', '#d8c6a2', '#b39b72', '#dfd0b0'], rim: '#8f7a58', tuft: '#8a7a50' },
  slab: { key: 'dslab', b: '#d6b48a', w: ['#c9a37a', '#e0c29c', '#bd966b', '#e6cba8'], rim: '#9a7650', tuft: '#8a7a40' },
  oasis: { key: 'doasis', b: '#b3c57a', w: ['#a6ba6e', '#c0d28a', '#9cb064', '#cad996'], rim: '#74914c', tuft: '#4f7a3a' },
  owat: { key: 'dowat', b: '#79d0c4', w: ['#6ac4ba', '#8fdcd0', '#5eb8b4', '#a2e4d8'], rim: '#2f8a98', tuft: '#fff' },
};
const ellS = (cx, cy, rx, ry, col, op, rot, w = 1.2) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="${col}" stroke-width="${w}" opacity="${op}" transform="rotate(${f(rot)} ${f(cx)} ${f(cy)})"/>`;
export function dskel(fam, n = 9) {
  const r = rng(hash('skel-desert')); const o = [rect(0, 0, T, T, fam.b)];
  for (let i = 0; i < n; i++) {
    const cx = r.range(0, T), cy = r.range(0, T), rx = r.range(14, 28), ry = rx * r.range(.6, .88), rot = r.range(0, 180), col = fam.w[i % 4], op = +r.range(.28, .5).toFixed(2);
    o.push(wrapped(cx, cy, rx, (x, y) => ell(x, y, rx, ry, col, op, rot) + ellS(cx === x && cy === y ? x : x, y, rx, ry, fam.rim, .13, rot)));
  }
  return o.join('');
}
// variant interior inside the safe zone
export function dint(fam, seed, { n = 3, cols = null, strokeOp = .13 } = {}) {
  const r = rng(seed), o = [], cs = cols || fam.w;
  for (let i = 0; i < n; i++) {
    const cx = r.range(20, 44), cy = r.range(20, 44), rx = r.range(8, 15), ry = rx * r.range(.55, .85), rot = r.range(0, 180), op = +r.range(.25, .5).toFixed(2);
    o.push(ell(cx, cy, rx, ry, cs[i % cs.length], op, rot) + ellS(cx, cy, rx, ry, fam.rim, strokeOp, rot));
  }
  return o.join('');
}
// ----- shared (wrapped) ground features per family -----
export function speckle(seed, n, cols, rmax = 1.1, op = .55) { const r = rng(seed); let o = ''; for (let i = 0; i < n; i++) { const x = r.range(0, T), y = r.range(0, T), c = cols[i % cols.length], s = r.range(.5, rmax); o += wrapped(x, y, 2, (a, b) => circ(a, b, s, c, op)); } return o; }
const ripple = (x, y, w, col, op, sw = 1.1) => line(`M${f(x - w / 2)} ${f(y)}q${f(w / 4)}-2.6 ${f(w / 2)} 0t${f(w / 2)} 0`, col, sw, op);
export function ripples(seed, n, col, op = .5, w0 = 12, w1 = 20) { const r = rng(seed); let o = ''; for (let i = 0; i < n; i++) { const x = r.range(0, T), y = r.range(0, T), w = r.range(w0, w1); o += wrapped(x, y, w / 2 + 3, (a, b) => ripple(a, b, w, col, op) + ripple(a + 2, b + 1.4, w * .6, '#fff6d8', op * .55, .8)); } return o; }
export const sandBase = () => dskel(FAMS.sand) + speckle(11, 26, ['#c9a468', '#fff3cf'], 1, .5);
export const duneBase = () => dskel(FAMS.dune) + ripples(21, 9, '#b98d52', .5);
// periodic crack network (4x4 jittered lattice, so it wraps exactly)
export function crackNet(seed, col = '#8f6f48', op = .55, p = .78) {
  const r = rng(seed), N = 4, S = T / N, pts = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) pts.push([i * S + S / 2 + r.range(-6, 6), j * S + S / 2 + r.range(-6, 6)]);
  const P_ = (i, j) => { const ii = ((i % N) + N) % N, jj = ((j % N) + N) % N; const q = pts[jj * N + ii]; return [q[0] + (i - ii) * S + (Math.floor(i / N) - Math.floor((i - ii) / N)) * 0, q[1] + Math.floor(j / N) * T]; };
  const get = (i, j) => { const ii = ((i % N) + N) % N, jj = ((j % N) + N) % N, q = pts[jj * N + ii]; return [q[0] + Math.floor(i / N) * T, q[1] + Math.floor(j / N) * T]; };
  let a = '', b = '';
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) for (const [di, dj] of [[1, 0], [0, 1], [1, 1]]) {
    if (r() > p * (di && dj ? .45 : 1)) continue;
    const A = get(i, j), B = get(i + di, j + dj), mx = (A[0] + B[0]) / 2 + r.range(-2, 2), my = (A[1] + B[1]) / 2 + r.range(-2, 2);
    for (const ox of [-T, 0, T]) for (const oy of [-T, 0, T]) {
      const x0 = Math.min(A[0], B[0]) + ox, x1 = Math.max(A[0], B[0]) + ox, y0 = Math.min(A[1], B[1]) + oy, y1 = Math.max(A[1], B[1]) + oy;
      if (x1 < -1 || x0 > T + 1 || y1 < -1 || y0 > T + 1) continue;
      const d = `M${f(A[0] + ox)} ${f(A[1] + oy)}Q${f(mx + ox)} ${f(my + oy)} ${f(B[0] + ox)} ${f(B[1] + oy)}`;
      a += d; b += `M${f(A[0] + ox + .9)} ${f(A[1] + oy + .9)}Q${f(mx + ox + .9)} ${f(my + oy + .9)} ${f(B[0] + ox + .9)} ${f(B[1] + oy + .9)}`;
    }
  }
  return line(b, '#fbf0d6', .9, .5) + line(a, col, 1.1, op);
}
export const panBase = () => dskel(FAMS.pan) + crackNet(31);
export const regBase = () => dskel(FAMS.reg) + speckle(41, 30, ['#a08a64', '#e6d8b8', '#8a7656'], 1.5, .7);
// sandstone slab seams: periodic 2x2 lattice with jitter
export function slabLines(seed) {
  const r = rng(seed); let o = '', o2 = ''; const ys = [r.range(8, 24), r.range(36, 56)], xs = [[r.range(10, 54)], [r.range(10, 54)]];
  for (let k = 0; k < 2; k++) { const y = ys[k]; const d = `M-2 ${f(y)}Q16 ${f(y + r.range(-2, 2))} 32 ${f(y)}T66 ${f(y)}`; o += d; o2 += `M-2 ${f(y + 1)}Q16 ${f(y + 1 + r.range(-2, 2))} 32 ${f(y + 1)}T66 ${f(y + 1)}`; }
  // vertical joints between seams; joints wrap in y
  for (let k = 0; k < 2; k++) { const y0 = ys[k], y1 = ys[(k + 1) % 2] + (k ? T : 0), x = xs[k][0]; const d = `M${f(x)} ${f(y0)}L${f(x + r.range(-2, 2))} ${f(y1)}`; o += d; o2 += `M${f(x + 1)} ${f(y0)}L${f(x + 1)} ${f(y1)}`; if (k === 1) { o += `M${f(x)} ${f(y0 - T)}L${f(x)} ${f(y1 - T)}`; o2 += `M${f(x + 1)} ${f(y0 - T)}L${f(x + 1)} ${f(y1 - T)}`; } }
  return line(o2, '#fbf0d6', .9, .5) + line(o, '#8a6240', 1.2, .5);
}
export const slabBase = () => dskel(FAMS.slab) + slabLines(51);
export const oasisBase = () => dskel(FAMS.oasis);
export function owatBase() { const r = rng(hash('owat-rip')); let o = dskel(FAMS.owat); for (let i = 0; i < 6; i++) { const x = r.range(0, T), y = r.range(0, T), w = r.range(10, 15); o += wrapped(x, y, 10, (a, b) => ripple(a, b, w, '#f2fffa', .65, 1.2)); } return o; }

// ----- tile emit helpers -----
export const mk = (cat, name, variant, w = T, h = T) => newTile({ region: REGION, sub: 'common', cat, name, variant }, w, h);
export const out = (t, cat, name, variant, tags = []) => save(t, { region: REGION, sub: 'common', cat, name, variant, tags: [...tags, 'desert'] });
// tile(cat, name, variant, [w,h], tags, fn(t, r)) : fn adds to t (or returns a string)
export function tile(cat, name, variant, size, tags, fn) {
  const t = mk(cat, name, variant, size[0], size[1]); const r = rng(hash(`${cat}/${name}/${variant}`));
  const s = fn(t, r); if (s) t.add(s); out(t, cat, name, variant, tags); return t;
}
export const sh = (cx, cy, rx, ry, op = 1) => shadow(cx, cy, rx, ry, op);
const cellTag = (w, h) => w === 64 && h === 128 ? ['tall'] : w === 128 ? ['large'] : [];
export const sizeTags = cellTag;
// blob47 writer with a custom build(t, G, mask)
export function blobSet(name, { mg = { n: 8, e: 8, s: 8, w: 8 }, R = 24, build, tags = [] }) {
  for (const m of BLOBS) { const t = mk('edges', name, pad3(m)); build(t, blobGeom(m, mg, R), m); out(t, 'edges', name, pad3(m), ['autotile', 'blob47', 'mask:' + m, ...tags]); }
}

// ----- drawing helpers -----
// a palm frond: curved blade from (x,y) at angle a (deg, 0 = right, -90 = up), length len, droop pulls the tip down
export function frond(x, y, a, len, droop, cols, w = 4.2, leaflets = true) {
  const A = a * Math.PI / 180, c = [x + Math.cos(A) * len * .55, y + Math.sin(A) * len * .55 - len * .18], e = [x + Math.cos(A) * len, y + Math.sin(A) * len + droop];
  const pt = (u) => [(1 - u) * (1 - u) * x + 2 * u * (1 - u) * c[0] + u * u * e[0], (1 - u) * (1 - u) * y + 2 * u * (1 - u) * c[1] + u * u * e[1]];
  const nrm = (u) => { const p = pt(Math.min(1, u + .02)), q = pt(Math.max(0, u - .02)), dx = p[0] - q[0], dy = p[1] - q[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
  const up = [], dn = []; for (let i = 0; i <= 8; i++) { const u = i / 8, p = pt(u), n = nrm(u), wd = w * Math.sin(Math.PI * Math.min(1, u * .9 + .08)) * (1 - u * .3); up.push([p[0] + n[0] * wd, p[1] + n[1] * wd]); dn.push([p[0] - n[0] * wd * .8, p[1] - n[1] * wd * .8]); }
  const d = 'M' + up.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'L' + dn.reverse().map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';
  let o = path(d, a < -90 || a > 90 ? cols[1] : cols[1], 1, ink(D.inkG, .7, .75));
  o += path(d, 'none', 1, { stroke: 'none' });
  if (leaflets) { let k = ''; for (let i = 1; i < 8; i++) { const u = i / 8, p = pt(u), n = nrm(u), wd = w * .95 * Math.sin(Math.PI * Math.min(1, u * .9 + .08)); k += `M${f(p[0])} ${f(p[1])}l${f(n[0] * wd)} ${f(n[1] * wd)}M${f(p[0])} ${f(p[1])}l${f(-n[0] * wd * .8)} ${f(-n[1] * wd * .8)}`; } o += line(k, cols[2], .7, .7); }
  let rib = 'M' + [0, .25, .5, .75, 1].map(u => { const p = pt(u); return f(p[0]) + ' ' + f(p[1]); }).join('L'); o += line(rib, cols[0], 1, .8);
  return o;
}
// stone block (3/4 view): front face + top face + light edge. (x,y) = top-left of the front face
export function block(t, x, y, w, h, top, cols = D.stone, tdepth = 5, inkc = D.inkS) {
  return path(`M${f(x)} ${f(y)}L${f(x + tdepth)} ${f(y - tdepth)}H${f(x + w + tdepth)}L${f(x + w)} ${f(y)}Z`, top || cols[0], 1, ink(inkc, .8, .7))
    + rect(x, y, w, h, t.lg([cols[1], cols[2]], 60), 0, 1, ink(inkc, .9, .8))
    + path(`M${f(x + w)} ${f(y)}L${f(x + w + tdepth)} ${f(y - tdepth)}V${f(y + h - tdepth)}L${f(x + w)} ${f(y + h)}Z`, cols[2], .8, ink(inkc, .7, .7));
}
export const dotsLine = (r, n, x0, y0, x1, y1, col, rad = .8, op = .6) => { let o = ''; for (let i = 0; i < n; i++) { const u = r(); o += circ(x0 + (x1 - x0) * u, y0 + (y1 - y0) * r(), rad * r.range(.6, 1.3), col, op); } return o; };
// small pebble/rock top view
export const pebbleD = (x, y, s = 1, c = D.stone) => ell(x + .8 * s, y + 1.4 * s, 4 * s, 1.6 * s, '#3b3a24', .16) + ell(x, y, 3.8 * s, 2.6 * s, c[1], 1, 0, ink(D.inkS, .6, .6)) + ell(x - 1 * s, y - 1 * s, 1.9 * s, 1 * s, c[0], .9);
// moulded sandstone rock mass; returns shadow+body+facets
export function rockD(t, r, cx, cy, rx, ry, cols = D.stone, facets = 3, strata = true) {
  let o = sh(cx + 2, cy + ry * .75, rx * 1.05, ry * .35);
  const d = blobPath(r, cx, cy, rx, ry, 8, .13);
  o += path(d, t.lg(cols, 55), 1, ink(D.inkS, 1, .8));
  o += path(`M${f(cx - rx * .8)} ${f(cy - ry * .1)}Q${f(cx - rx * .6)} ${f(cy - ry * .9)} ${f(cx + rx * .1)} ${f(cy - ry * .85)}Q${f(cx - rx * .3)} ${f(cy - ry * .5)} ${f(cx - rx * .8)} ${f(cy - ry * .1)}Z`, '#fff', .32);
  if (strata) for (let i = 0; i < 2; i++) o += line(`M${f(cx - rx * .85)} ${f(cy + ry * (-.1 + i * .38))}q${f(rx * .8)} ${f(ry * .16)} ${f(rx * 1.7)} ${f(-ry * .04)}`, cols[2], 1, .38);
  for (let i = 0; i < facets; i++) o += line(`M${f(cx + r.range(-rx * .5, rx * .6))} ${f(cy + r.range(-ry * .3, ry * .2))}l${f(r.range(-4, 4))} ${f(r.range(3, 8))}`, cols[2], 1.1, .45);
  return o;
}
