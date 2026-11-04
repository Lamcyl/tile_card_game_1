// Bamboo drawing helpers shared by gen-bamboo.mjs and gen-bamboo-objects.mjs (Bamboo Valley, step 3).
import { P, rng, hash, f, ell, circ, rect, path, line, ink } from './sub.mjs';

// palettes: culm light > dark, node colour, leaf light > dark
export const BAM = {
  green: { culm: ['#cdeaa0', '#8cc462', '#4d8a3c'], node: '#3f7030', leaf: ['#a8e496', '#5fae5c', '#2f6e3a'], inkc: '#1d4a26' },
  golden: { culm: ['#fdeea6', '#e8c14e', '#a8802a'], node: '#8a6420', leaf: ['#cfe88a', '#80b552', '#4a7a34'], inkc: '#5a4410' },
  black: { culm: ['#8a7a78', '#4a3c3e', '#22191c'], node: '#0f0a0c', leaf: ['#82c68c', '#3f8a52', '#235238'], inkc: '#140e12' },
  young: { culm: ['#e2f4ae', '#aad476', '#6aa04a'], node: '#5a8a3c', leaf: ['#bdeea0', '#7cc468', '#3f8a48'], inkc: '#1d4a26' },
};

// lanceolate leaf blade from (x,y) pointing at angle a (deg), length len, half-width wd
export function blade(x, y, a, len, wd, col, inkc = '#1d4a26', op = .55) {
  return `<path d="M0 0Q${f(len * .45)} ${f(-wd)} ${f(len)} 0Q${f(len * .45)} ${f(wd)} 0 0Z" fill="${col}" stroke="${inkc}" stroke-width=".5" stroke-opacity="${op}" transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})"/>`;
}
// fan of leaf blades from (x,y); angles centred on `dir` (deg, -90 = up) spread +-sp, drooping tips
export function spray(r, x, y, n, len, pal, { dir = -90, sp = 70, wd = 2, op = .55 } = {}) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = dir + (n === 1 ? 0 : (i / (n - 1) - .5) * 2 * sp) + r.range(-8, 8), l = len * r.range(.75, 1.1), q = r(), c = pal.leaf[q < .38 ? 0 : q < .72 ? 1 : 2];
    o += blade(x, y, a, l, wd * r.range(.8, 1.1), c, pal.inkc, op);
  }
  return o;
}
// cached gradients per tile
const gcache = new WeakMap();
export function culmGrad(t, pal, key = 'c') {
  if (!gcache.has(t)) gcache.set(t, {});
  const c = gcache.get(t), k = key + pal.node;
  return c[k] || (c[k] = t.lg(pal.culm, 0));
}
// one culm: base (x,y0) up to (x+lean,y1), width w. Nodes every ~seg px.
export function culm(t, x, y0, y1, w, pal, { lean = 0, seg = 13, inkOp = .8, nodes = true, leafy = null } = {}) {
  const h = y0 - y1, xt = x + lean, wt = w * .78;
  const midx = (a, b) => (x + (xt - x) * (y0 - a) / h);
  let o = path(`M${f(x - w / 2)} ${f(y0)}L${f(xt - wt / 2)} ${f(y1)}Q${f(xt)} ${f(y1 - wt * .5)} ${f(xt + wt / 2)} ${f(y1)}L${f(x + w / 2)} ${f(y0)}Z`, culmGrad(t, pal), 1, ink(pal.inkc, .8, inkOp));
  o += line(`M${f(x - w * .22)} ${f(y0 - 1)}L${f(xt - wt * .22)} ${f(y1 + 2)}`, '#fff', Math.max(.6, w * .14), .35);
  if (nodes) for (let y = y0 - seg * .8; y > y1 + 4; y -= seg) {
    const cx = midx(y), ww = w * (1 - (y0 - y) / h * .22);
    o += ell(cx, y, ww * .6, 1.2, pal.node, .85) + ell(cx - ww * .1, y - 1, ww * .5, .5, pal.culm[0], .55);
  }
  return o;
}
// clump of culms for tall tiles/sprites. returns svg string; base y = by; tops reach by - hMax
export function clump(t, r, { cx = 32, by = 112, n = 6, hMin = 70, hMax = 100, spread = 16, w = 4.2, pal = BAM.green, leaves = 9, lean = 3, nodes = true, skipTop = false } = {}) {
  const xs = []; for (let i = 0; i < n; i++) xs.push(cx - spread + (i + .5) / n * spread * 2 + r.range(-2, 2));
  const order = xs.map((x, i) => ({ x, h: r.range(hMin, hMax), l: (x - cx) / spread * lean + r.range(-1, 1), z: r() })).sort((a, b) => a.z - b.z);
  let o = '';
  for (const c of order) o += culm(t, c.x, by + r.range(-1, 2), by - c.h, w * r.range(.85, 1.1), pal, { lean: c.l, nodes, seg: r.range(12, 15) });
  if (!skipTop) for (const c of order) {
    const xt = c.x + c.l, yt = by - c.h;
    o += spray(r, xt, yt + 2, leaves, 17, pal, { dir: -90 + c.l * 6, sp: 78, wd: 2.2 });
    const yb = yt + r.range(14, 24), xb = c.x + c.l * (1 - (yb - yt) / c.h), side = r() < .5 ? -1 : 1;
    o += line(`M${f(xb)} ${f(yb)}q${f(side * 4)} -3 ${f(side * 8)} -4`, pal.node, 1.2, .8) + spray(r, xb + side * 8, yb - 4, 5, 13, pal, { dir: side > 0 ? -35 : -145, sp: 55, wd: 1.9 });
  }
  return o;
}
// top-view bamboo canopy (for autotile crowns): leaf plume on a dark base, culm bases peeking out below
export function bambooCrown(t, cx, cy, r, seed, pal) {
  const rr = rng(seed + 5), o = [];
  o.push(ell(cx + r * .12, cy + r * .86, r * .95, r * .3, '#2e2c1a', .2));
  for (let i = 0; i < 4; i++) { const x = cx + (i - 1.5) * r * .3 + rr.range(-1, 1); o.push(culm(t, x, cy + r * .9, cy + r * .1, r * .13 + .8, pal, { seg: 7, inkOp: .6 })); }
  o.push(circ(cx, cy, r * .95, pal.leaf[2], .96, ink(pal.inkc, .9, .7)));
  const rg = t.rg(pal.leaf, .34, .28, .9);
  o.push(circ(cx - r * .06, cy - r * .06, r * .84, rg, .95));
  const n = Math.round(r * 1.7);
  for (let i = 0; i < n; i++) {
    const a = rr.range(0, 6.283), d = Math.sqrt(rr()) * r * .62, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * .9, ang = a * 57.3 + rr.range(-40, 40) + 25;
    const light = Math.cos(a + 2.4) * .5 + .5; // upper-left light
    o.push(blade(x, y, ang, r * rr.range(.38, .55), r * .1, pal.leaf[light > .62 ? 0 : light > .3 ? 1 : 2], pal.inkc, .4));
  }
  o.push(ell(cx - r * .35, cy - r * .42, r * .32, r * .16, pal.leaf[0], .55, -25));
  return o.join('');
}
export const bambooLeaves = (x, y, rot, col = '#d8c460', s = 1) => blade(x, y, rot, 8 * s, 1.6 * s, col, '#6b5a28', .5) + blade(x + 1, y + .8, rot + 24, 7 * s, 1.4 * s, col, '#6b5a28', .5);
