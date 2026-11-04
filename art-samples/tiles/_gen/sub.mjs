// Shared drawing helpers for the sub-area generators (gen-meadow.mjs, gen-oakwood.mjs).
// Same rules as the common set: light from the upper left, soft 3-layer drop shadow, ink edge in a dark tint of the fill.
import { T, P, rng, hash, f, newTile, save, ell, circ, rect, path, line, ink, shadow, blobPath, tuft } from './lib.mjs';
import { BIT, canon, BLOBS, blobGeom, pad3, skeleton, FAM, inShape } from './ground.mjs';

export const SUBS = { meadow: 'sunny-meadows', oak: 'old-oak-wood' };
export const maker = (sub) => ({
  mk: (cat, name, variant, w = T, h = T) => newTile({ sub, cat, name, variant }, w, h),
  out: (t, cat, name, variant, tags = []) => save(t, { sub, cat, name, variant, tags: [...tags, sub] }),
});

export const sh = (cx, cy, rx, ry) => shadow(cx, cy, rx, ry);
// tapered trunk with bark streaks (same look as the common trunk)
export const trunk = (t, x, y, wb, wt, h, cols = P.bark, lean = 0) => path(`M${f(x - wb)} ${f(y)}Q${f(x - wb * .6)} ${f(y - h * .5)} ${f(x - wt + lean)} ${f(y - h)}H${f(x + wt + lean)}Q${f(x + wb * .6)} ${f(y - h * .5)} ${f(x + wb)} ${f(y)}Z`, t.lg(cols, 0), 1, ink(P.inkW, .9, .8))
  + line(`M${f(x - wb * .2)} ${f(y - 2)}q-1-${f(h * .4)} ${f(lean * .5)}-${f(h * .8)}`, cols[2], 1, .45) + line(`M${f(x + wb * .35)} ${f(y - 4)}q1-${f(h * .3)} 0-${f(h * .6)}`, cols[2], 1, .35);

// ---------- flowers ----------
// bloom kinds: cosmos, poppy, cornflower, buttercup, daisy, lavender, bluebell, clover, rose, tulip. (x,y) is the base; all fit in r<=6*s.
export function bloom(kind, x, y, s = 1, col = null) {
  const stem = (h = 4) => line(`M${f(x)} ${f(y + 1)}v${f(h * s)}`, P.tuftG, 1, .6);
  switch (kind) {
    case 'cosmos': { const c = col || '#f2a6c0'; let o = stem(); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283 - 1.57; o += ell(x + Math.cos(a) * 2.2 * s, y + Math.sin(a) * 2.2 * s, 1.9 * s, 1.2 * s, c, 1, a * 57.3, ink('#b0607a', .4, .45)); } return o + circ(x, y, 1.2 * s, P.gold) + circ(x - .4 * s, y - .5 * s, .4 * s, '#fff6c0'); }
    case 'poppy': { const c = col || '#e0483a'; return stem() + circ(x - 1.7 * s, y, 2.4 * s, c, 1, ink('#8e2118', .4, .5)) + circ(x + 1.7 * s, y, 2.4 * s, '#c8352b') + circ(x, y - 1.6 * s, 2.3 * s, c) + circ(x - .7 * s, y - 1.2 * s, .9 * s, '#f6806a', .8) + circ(x, y + .3 * s, 1 * s, '#3a2430'); }
    case 'cornflower': { const c = col || '#6d8ede'; let o = stem(); for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283; o += ell(x + Math.cos(a) * 2.3 * s, y + Math.sin(a) * 2.3 * s, 1.9 * s, .7 * s, c, 1, a * 57.3); } return o + circ(x, y, 1.1 * s, '#33456f'); }
    case 'buttercup': { const c = col || '#f6d04a'; return stem(3) + circ(x - 1.6 * s, y, 1.8 * s, c) + circ(x + 1.6 * s, y, 1.8 * s, c) + circ(x, y - 1.6 * s, 1.8 * s, c) + circ(x, y + 1.2 * s, 1.8 * s, c) + circ(x, y, 1.1 * s, '#e8a83a') + circ(x - .6 * s, y - 2.2 * s, .6 * s, '#fffbd0', .8); }
    case 'daisy': { let o = stem(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; o += ell(x + Math.cos(a) * 2.4 * s, y + Math.sin(a) * 2.4 * s, 1.6 * s, .75 * s, '#fffaf0', 1, a * 57.3, ink('#c9c0a8', .3, .4)); } return o + circ(x, y, 1.4 * s, P.gold); }
    case 'lavender': { const c = col || '#a58ad8'; let o = line(`M${f(x)} ${f(y + 3)}q.6-5 0-${f(9 * s)}`, '#6f9a58', 1, .75); for (let i = 0; i < 6; i++) o += circ(x + (i % 2 ? .9 : -.9) * s, y - i * 1.5 * s + 1, 1.15 * s, i % 3 ? c : '#c9b3ee'); return o; }
    case 'bluebell': { const c = col || '#8aa0e8'; return line(`M${f(x)} ${f(y + 3)}q2-5 3-${f(7 * s)}`, '#6f9a58', 1, .75) + path(`M${f(x + 3 * s - 1.8)} ${f(y - 4 * s)}q1.8 -2 3.6 0q.3 3 1 4q-3 1 -5.6 0q.8 -1 1 -4Z`, c, 1, ink('#4d639a', .4, .5)) + path(`M${f(x + 3 * s - 4.2)} ${f(y - 1.5 * s)}q1.6-1.8 3.2 0q.2 2.6 .8 3.4q-2.6 .8-4.8 0q.8-1 .8-3.4Z`, '#a8b8f0', 1, ink('#4d639a', .4, .5)); }
    case 'clover': return circ(x, y, 2.5 * s, '#fffaf0', 1, ink('#b8b09a', .4, .5)) + circ(x - .7 * s, y - .8 * s, 1.1 * s, '#fff') + circ(x + .8 * s, y + .4 * s, .5 * s, '#f6c6d4', .9) + ell(x - 2.4 * s, y + 3 * s, 1.8 * s, 1.1 * s, '#5fae5c', 1, -20) + ell(x + 2.4 * s, y + 3 * s, 1.8 * s, 1.1 * s, '#5fae5c', 1, 20);
    case 'rose': { const c = col || '#f6a0b8'; return circ(x, y, 2.9 * s, c, 1, ink('#b0607a', .5, .55)) + circ(x - .3 * s, y - .3 * s, 1.7 * s, '#fbc4d2') + circ(x + .2 * s, y, .9 * s, '#e0809c') + ell(x - 3 * s, y + 3.4 * s, 1.8 * s, 1 * s, '#5fae5c', 1, -25); }
    case 'tulip': { const c = col || '#e0583f'; return line(`M${f(x)} ${f(y + 4)}v-3`, '#5f9a50', 1.1, .9) + path(`M${f(x - 2.2 * s)} ${f(y - 4.4 * s)}L${f(x - 1.1 * s)} ${f(y - 2.4 * s)}L${f(x)} ${f(y - 4.8 * s)}L${f(x + 1.1 * s)} ${f(y - 2.4 * s)}L${f(x + 2.2 * s)} ${f(y - 4.4 * s)}Q${f(x + 2.6 * s)} ${f(y)} ${f(x)} ${f(y + .6)}Q${f(x - 2.6 * s)} ${f(y)} ${f(x - 2.2 * s)} ${f(y - 4.4 * s)}Z`, c, 1, ink('#8e2118', .5, .6)) + ell(x - .8 * s, y - 1.8 * s, .6 * s, 1.2 * s, '#fff', .45); }
    case 'sunflower': return circ(x, y, 3.8 * s, '#f3c24f', 1, ink('#8a6a1c', .5, .6)) + circ(x, y, 2.2 * s, '#6b4a2c') + circ(x - .6 * s, y - .6 * s, .8 * s, '#8a6a44');
  }
  return '';
}
// seeded scatter on [pad, 64-pad] with a minimum gap
export function scat(r, n, pad = 8, gap = 8, x0 = null) {
  const pts = []; let tries = 0, lo = pad, hi = T - pad;
  while (pts.length < n && tries++ < 400) { const p = [r.range(lo, hi), r.range(lo + 2, hi)]; if (pts.every(q => Math.hypot(q[0] - p[0], q[1] - p[1]) > gap)) pts.push(p); }
  return pts;
}
// ---------- butterfly (flat, top view, ~7px wingspan), bee ----------
export function butterfly(x, y, c1, c2, rot = 0, s = 1, shadowOn = true) {
  const w = (sx) => path(`M0 0Q${sx * 3} ${-5.2 * s} ${sx * 6.2 * s} ${-3.2 * s}Q${sx * 5.6 * s} ${-.2 * s} 0 .4Z`, c1, 1, ink('#3b2a2a', .5, .7)) + path(`M0 .2Q${sx * 4.4 * s} ${1 * s} ${sx * 4.6 * s} ${3.6 * s}Q${sx * 1.4 * s} ${4.4 * s} 0 .8Z`, c2, 1, ink('#3b2a2a', .5, .7));
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">` + (shadowOn ? ell(1.2, 4.6, 5, 1.4, '#3b3a24', .16) : '') + w(-1) + w(1) + ell(-1.6 * s, -3 * s, 1.3 * s, .8 * s, '#fff', .55, 20) + ell(1.6 * s, -3 * s, 1.3 * s, .8 * s, '#fff', .55, -20) + ell(0, 1.2, .9, 3, '#3b2a2a') + line('M-.4 -1.6q-1.6-2.6-2.8-2.8M.4 -1.6q1.6-2.6 2.8-2.8', '#3b2a2a', .6, .8) + '</g>';
}
export function bee(x, y, rot = 0) {
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">` + ell(1, 5.4, 3.4, 1.1, '#3b3a24', .15) + ell(-1.8, -2.2, 2.4, 1.2, '#eef7fa', .85, -30, ink('#8aa0a8', .3, .5)) + ell(1.8, -2.2, 2.4, 1.2, '#eef7fa', .85, 30, ink('#8aa0a8', .3, .5))
    + ell(0, 0, 2.2, 3.2, '#f3c24f', 1, 0, ink('#3b2a1a', .6, .8)) + rect(-2.1, -.4, 4.2, 1, '#3b2a1a', 0, .9) + rect(-1.9, 1.5, 3.8, .9, '#3b2a1a', 0, .9) + circ(0, -2.8, 1.3, '#3b2a1a') + '</g>';
}
// ---------- mushrooms ----------
// cap colour pair [light, dark], optional spots and glow. Base at (x,y), size k.
export function mush(t, x, y, k, cap, { spots = true, glow = false, stem = '#fff6e0', gill = true } = {}) {
  let o = '';
  if (glow) o += circ(x, y - 5 * k, 11 * k, t.rg([cap[0], cap[0], cap[1]], .5, .5, .5, [.55, .22, 0]));
  o += ell(x + 1, y + 1.6, 5.4 * k, 1.7 * k, '#3b3a24', .18);
  o += path(`M${f(x - 1.7 * k)} ${f(y)}Q${f(x - 1.4 * k)} ${f(y - 4 * k)} ${f(x - 1.2 * k)} ${f(y - 7 * k)}H${f(x + 1.2 * k)}Q${f(x + 1.5 * k)} ${f(y - 4 * k)} ${f(x + 1.9 * k)} ${f(y)}Z`, stem, 1, ink('#b8b09a', .6, .7));
  o += path(`M${f(x - 8 * k)} ${f(y - 5.6 * k)}Q${f(x - 7 * k)} ${f(y - 15 * k)} ${f(x)} ${f(y - 15.5 * k)}Q${f(x + 7.6 * k)} ${f(y - 15 * k)} ${f(x + 8.2 * k)} ${f(y - 5.6 * k)}Q${f(x)} ${f(y - 3.6 * k)} ${f(x - 8 * k)} ${f(y - 5.6 * k)}Z`, t.lg([cap[0], cap[1]], 60), 1, ink(glow ? '#2a4a63' : '#5a1a14', .8, .75));
  o += ell(x - 3 * k, y - 11.4 * k, 2.6 * k, 1.1 * k, '#fff', .5, -25);
  if (spots) o += circ(x + 2.6 * k, y - 10 * k, 1.1 * k, '#fff6e0') + circ(x - 1.4 * k, y - 8 * k, .9 * k, '#fff6e0') + circ(x + 5 * k, y - 7.4 * k, .8 * k, '#fff6e0');
  return o;
}
// ---------- rocks ----------
export function rockS(t, r, cx, cy, rx, ry, cols, { moss = false, fern = false, flowers = false, facets = 3 } = {}) {
  let o = sh(cx + 2, cy + ry * .75, rx * 1.05, ry * .35);
  o += path(blobPath(r, cx, cy, rx, ry, 8, .14), t.lg(cols, 55), 1, ink(P.inkR, 1, .8));
  o += path(`M${f(cx - rx * .8)} ${f(cy - ry * .1)}Q${f(cx - rx * .6)} ${f(cy - ry * .9)} ${f(cx + rx * .1)} ${f(cy - ry * .85)}Q${f(cx - rx * .3)} ${f(cy - ry * .5)} ${f(cx - rx * .8)} ${f(cy - ry * .1)}Z`, '#fff', .35);
  for (let i = 0; i < facets; i++) o += line(`M${f(cx + r.range(-rx * .5, rx * .6))} ${f(cy + r.range(-ry * .3, ry * .2))}l${f(r.range(-5, 5))} ${f(r.range(4, 9))}`, cols[2], 1.1, .5);
  if (moss) o += path(`M${f(cx - rx * .8)} ${f(cy - ry * .3)}Q${f(cx - rx * .5)} ${f(cy - ry * 1.05)} ${f(cx + rx * .4)} ${f(cy - ry * .85)}Q${f(cx + rx * .1)} ${f(cy - ry * .5)} ${f(cx - rx * .1)} ${f(cy - ry * .45)}Q${f(cx - rx * .4)} ${f(cy - ry * .1)} ${f(cx - rx * .55)} ${f(cy + ry * .1)}Q${f(cx - rx * .8)} ${f(cy - ry * .05)} ${f(cx - rx * .8)} ${f(cy - ry * .3)}Z`, t.lg(['#a8cf86', '#6fa050'], 60), .95, ink('#3f6a38', .6, .6)) + tuft(cx - rx * .4, cy - ry * .2, '#4d7a40', .8, .5);
  if (fern) o += fronds(cx + rx * .6, cy + ry * .2, 3, 9, ['#6fb560', '#3f8048']);
  if (flowers) o += bloom('cosmos', cx - rx * .3, cy - ry * .7, .8, '#f6a0b8') + bloom('daisy', cx + rx * .2, cy - ry * .9, .8) + tuft(cx + rx * .4, cy - ry * .35, '#4a8a46', .8, .6);
  return o;
}
// fern fronds fanned from (x,y)
export function fronds(x, y, n, len, cols, spread = 1.5) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * spread / Math.max(1, n - 1) * 1.1, ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len * .9, cx = x + Math.cos(a) * len * .5 - Math.sin(a) * 3, cy = y + Math.sin(a) * len * .45;
    o += path(`M${f(x)} ${f(y)}Q${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}Q${f(cx + 2.4)} ${f(cy + 1.6)} ${f(x + 1)} ${f(y)}Z`, cols[i % cols.length], 1, ink(P.inkG, .6, .6));
    for (let k = 1; k < 4; k++) { const px = x + (ex - x) * k / 4, py = y + (ey - y) * k / 4; o += line(`M${f(px)} ${f(py)}l${f(-2.2)} ${f(-1)}M${f(px)} ${f(py)}l${f(2.2)} ${f(-1)}`, cols[(i + 1) % cols.length], .8, .6); }
  }
  return o;
}
export const acorn = (x, y, s = 1) => ell(x + .6, y + 2, 2.4 * s, .8 * s, '#3b3a24', .16) + ell(x, y, 1.7 * s, 2.2 * s, '#b8843a', 1, 0, ink(P.inkW, .5, .7)) + path(`M${f(x - 2 * s)} ${f(y - .8 * s)}Q${f(x)} ${f(y - 3.4 * s)} ${f(x + 2 * s)} ${f(y - .8 * s)}Q${f(x)} ${f(y - .2 * s)} ${f(x - 2 * s)} ${f(y - .8 * s)}Z`, '#6b4a2c', 1, ink(P.inkW, .5, .7)) + circ(x - .5 * s, y + .6 * s, .5 * s, '#e0b060', .9);
export const leafS = (x, y, rot, col, s = 1) => `<path d="M${f(x - 3.6 * s)} ${f(y)}Q${f(x)} ${f(y - 3.4 * s)} ${f(x + 3.6 * s)} ${f(y)}Q${f(x)} ${f(y + 3.4 * s)} ${f(x - 3.6 * s)} ${f(y)}Z" fill="${col}" stroke="${P.inkW}" stroke-width=".5" stroke-opacity=".5" transform="rotate(${f(rot)} ${f(x)} ${f(y)})"/>` + `<path d="M${f(x - 3 * s)} ${f(y)}h${f(6 * s)}" stroke="${P.inkW}" stroke-width=".4" stroke-opacity=".4" transform="rotate(${f(rot)} ${f(x)} ${f(y)})"/>`;
export const sparkle = (x, y, s = 1, col = '#fff6c0') => path(`M${f(x)} ${f(y - 5 * s)}Q${f(x + .8 * s)} ${f(y - .8 * s)} ${f(x + 5 * s)} ${f(y)}Q${f(x + .8 * s)} ${f(y + .8 * s)} ${f(x)} ${f(y + 5 * s)}Q${f(x - .8 * s)} ${f(y + .8 * s)} ${f(x - 5 * s)} ${f(y)}Q${f(x - .8 * s)} ${f(y - .8 * s)} ${f(x)} ${f(y - 5 * s)}Z`, col, .95);
export const glowC = (t, x, y, r, c1 = '#ffe6a0', c2 = '#ffc45a', a = .85) => circ(x, y, r, t.rg([c1, c2, c2], .5, .5, .5, [a, a * .35, 0]));
export const shimenawa = (t, x0, x1, y, sag = 9, thick = 4.4, drops = true) => {
  let o = path(`M${x0} ${y}Q${(x0 + x1) / 2} ${y + sag} ${x1} ${y}L${x1} ${y - thick}Q${(x0 + x1) / 2} ${y + sag - thick} ${x0} ${y - thick}Z`, t.lg(['#f2e4b4', '#d4bc7a'], 90), 1, ink('#a88a4a', 1, .8));
  const n = Math.round((x1 - x0) / 4.6); for (let i = 0; i < n; i++) { const u = (i + .5) / n, x = x0 + (x1 - x0) * u, yy = y - thick / 2 + sag * 2 * u * (1 - u); o += line(`M${f(x - 1.4)} ${f(yy + 2)}l2.8 -4`, '#a88a4a', 1, .8); }
  if (drops) for (const u of [.18, .5, .82]) { const x = x0 + (x1 - x0) * u, yy = y + sag * 2 * u * (1 - u) * .96; o += path(`M${f(x - 2)} ${f(yy)}l4 0l-1 7l3 -1l-2 7l-4 -2l1 -5l-3 1Z`, '#fffaf0', 1, ink('#b8b09a', .7, .8)); }
  return o;
};

// ---------- connect-4 builder: cb(t, mask) draws one piece. Returns nothing; writes 16 tiles ----------
export const C4 = { N: 1, E: 2, S: 4, W: 8 };

// ---------- blob47 helper with custom build(t, G) ----------
export function blobSet(sub, name, { mg = { n: 8, e: 8, s: 8, w: 8 }, R = 24, build, tags = [] }) {
  const { out } = maker(sub);
  for (const m of BLOBS) {
    const t = newTile({ sub, cat: 'edges', name, variant: pad3(m) });
    build(t, blobGeom(m, mg, R), m);
    out(t, 'edges', name, pad3(m), ['autotile', 'blob47', 'mask:' + m, ...tags]);
  }
}
export { BIT, canon, BLOBS, blobGeom, pad3, skeleton, FAM, inShape, T, P, rng, hash, f, newTile, save, ell, circ, rect, path, line, ink, shadow, blobPath, tuft };

// ---------- broadleaf tree (64x128): lobed crown over a trunk; same recipe as the common oak ----------
export function broad(t, { cols, cr, cy, seed, trunkH = 44, lean = 0, base = 112, extra = null, cx = 32, tw = 5.2, roots = true, barkCols = P.bark, lobes = null }) {
  const r = rng(seed);
  t.add(sh(cx + 3, base + 2, cr * .8, 6));
  t.add(trunk(t, cx, base, tw, tw * .6, trunkH, barkCols, lean));
  if (roots) t.add(path(`M${f(cx - tw - 3)} ${f(base + 1)}q4-1 ${f(tw + 1)}-5L${f(cx - 1)} ${f(base)}Z`, barkCols[1], .9), path(`M${f(cx + tw + 3)} ${f(base + 1)}q-4-1-${f(tw + 1)}-5L${f(cx + 1)} ${f(base)}Z`, barkCols[2], .9));
  t.add(line(`M${f(cx)} ${f(base - trunkH + 6)}l-9-10M${f(cx)} ${f(base - trunkH + 6)}l9-12`, barkCols[2], 2.4, .9));
  const L = lobes || [[0, 0, 1], [-.62, .22, .66], [.62, .2, .68], [-.3, -.5, .6], [.34, -.52, .58], [0, .48, .6]];
  const rgd = t.rg(cols, .32, .26, 1);
  for (const [dx, dy, k] of L) t.add(circ(cx + dx * cr + r.range(-1, 1), cy + dy * cr, cr * k * .95, cols[2], .95, ink(P.inkG, .9, .7)));
  for (const [dx, dy, k] of L) t.add(circ(cx + dx * cr - 1.5, cy + dy * cr - 2, cr * k * .8, rgd, 1));
  t.add(ell(cx - cr * .35, cy - cr * .45, cr * .42, cr * .26, cols[0], .55, -20));
  for (let k = 0; k < 5; k++) { const a = r.range(-3, 0), d = cr * r.range(.2, .85); t.add(ell(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .8, 3, 1.2, cols[0], .55, r.range(-50, 20))); }
  for (let k = 0; k < 6; k++) { const x = cx + r.range(-cr * .8, cr * .8), y = cy + r.range(0, cr * .8); t.add(ell(x, y, 2.6, 1, cols[2], .4, r.range(-40, 40))); }
  if (extra) t.add(extra(r));
}
export const dots = (n, cols, rad, cx, cy, rr, ring = '#5a2a1a') => (r) => { let o = ''; for (let i = 0; i < n; i++) { const a = r.range(0, 6.28), d = Math.sqrt(r()) * rr; const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * .85; o += circ(x, y, rad, r.pick(cols), 1, ink(ring, .4, .45)) + circ(x - rad * .3, y - rad * .35, rad * .35, '#fff', .75); } return o; };
export const spokes = (cx, cy, n, r0, r1, col, w = 1, op = .6, a0 = 0) => { let d = ''; for (let i = 0; i < n; i++) { const a = a0 + i / n * 6.283; d += `M${f(cx + Math.cos(a) * r0)} ${f(cy + Math.sin(a) * r0)}L${f(cx + Math.cos(a) * r1)} ${f(cy + Math.sin(a) * r1)}`; } return line(d, col, w, op); };
