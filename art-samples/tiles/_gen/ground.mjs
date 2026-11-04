// Ground families, seamless variants, decals, and the 47-blob autotile engine.
import { T, P, rng, hash, f, Tile, newTile, save, ell, circ, rect, path, line, g, ink, wrapped, tuft, shadow, blobPath } from './lib.mjs';

// ---------- families ----------
export const FAM = {
  grass: { key: 'grass', b: P.grass, w: P.grassW, rim: P.rimG, tuft: P.tuftG },
  dirt: { key: 'dirt', b: P.dirt.b, w: P.dirt.w, rim: P.dirt.rim, tuft: '#9a8a4e' },
  sand: { key: 'sand', b: P.sand.b, w: P.sand.w, rim: P.sand.rim, tuft: '#b8a46a' },
  floor: { key: 'floor', b: P.floor.b, w: P.floor.w, rim: P.floor.rim, tuft: '#4d7a40' },
  top: { key: 'top', b: P.cliffTop.b, w: P.cliffTop.w, rim: P.cliffTop.rim, tuft: '#9a9a58' },
  shallow: { key: 'shallow', b: P.water.sh, w: P.water.shW, rim: P.water.rim, tuft: '#fff' },
  deep: { key: 'deep', b: P.water.dp, w: P.water.dpW, rim: '#3f78a0', tuft: '#fff' },
};
const ellS = (cx, cy, rx, ry, col, op, rot, w = 1.2) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="${col}" stroke-width="${w}" opacity="${op}" transform="rotate(${f(rot)} ${f(cx)} ${f(cy)})"/>`;

// EDGE-SAFE SKELETON: identical for every variant of a family (same seed), wrapped on both axes. Because every variant
// and every autotile piece draws exactly this first, edges of any two tiles of the family match pixel for pixel.
export function skeleton(fam, n = 9) {
  const r = rng(hash('skel-' + fam.key)); const out = [rect(0, 0, T, T, fam.b)];
  for (let i = 0; i < n; i++) {
    const cx = r.range(0, T), cy = r.range(0, T), rx = r.range(14, 28), ry = rx * r.range(.6, .88), rot = r.range(0, 180), col = fam.w[i % 4], op = +r.range(.28, .5).toFixed(2);
    out.push(wrapped(cx, cy, rx, (x, y) => ell(x, y, rx, ry, col, op, rot) + ellS(x, y, rx, ry, fam.rim, .13, rot)));
  }
  return out.join('');
}
// VARIANT INTERIOR: only touches [4,60]; ellipses centred in [20,44] with radius <= 15.
export function interior(fam, seed, { n = 4, cols = null, tufts = 3, strokeOp = .13 } = {}) {
  const r = rng(seed), out = [], cs = cols || fam.w;
  for (let i = 0; i < n; i++) {
    const cx = r.range(20, 44), cy = r.range(20, 44), rx = r.range(8, 15), ry = rx * r.range(.55, .85), rot = r.range(0, 180), op = +r.range(.25, .5).toFixed(2);
    out.push(ell(cx, cy, rx, ry, cs[i % cs.length], op, rot) + ellS(cx, cy, rx, ry, fam.rim, strokeOp, rot));
  }
  for (let i = 0; i < tufts; i++) out.push(tuft(r.range(9, 55), r.range(12, 56), fam.tuft, .5));
  return out.join('');
}

// ---------- small decals (all drawn inside a 12px safe radius) ----------
export const flower = (x, y, col, s = 1) => circ(x - 1.9 * s, y, 1.7 * s, col) + circ(x + 1.9 * s, y, 1.7 * s, col) + circ(x, y - 1.9 * s, 1.7 * s, col) + circ(x, y + 1.9 * s, 1.7 * s, col) + circ(x, y, 1.3 * s, P.gold) + line(`M${f(x)} ${f(y + 2 * s)}v${f(3 * s)}`, P.tuftG, 1, .55);
export const daisy = (x, y, s = 1) => { let o = ''; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; o += ell(x + Math.cos(a) * 2.4 * s, y + Math.sin(a) * 2.4 * s, 1.5 * s, .8 * s, '#fffaf0', 1, a * 180 / Math.PI); } return o + circ(x, y, 1.4 * s, P.gold); };
export const clover = (x, y, s = 1) => { const c = (dx, dy) => circ(x + dx * s, y + dy * s, 2.2 * s, '#5fae5c', 1, ink(P.inkG, .6, .6)); return c(-2, 0) + c(2, 0) + c(0, -2.2) + c(0, 1.6) + circ(x - .8 * s, y - 1.4 * s, .7 * s, '#9be08f', .9) + line(`M${f(x)} ${f(y + 2 * s)}q1 2 3 3`, P.tuftG, 1, .6); };
export const pebble = (x, y, s = 1, col = P.stone) => ell(x + .8 * s, y + 1.5 * s, 4.2 * s, 1.8 * s, '#3b3a24', .16) + ell(x, y, 3.8 * s, 2.7 * s, col[1], 1, 0, ink(P.inkR, .6, .6)) + ell(x - 1.1 * s, y - 1 * s, 2 * s, 1.1 * s, col[0], .9);
export const leaf = (x, y, rot, col) => `<path d="M${f(x - 3.6)} ${f(y)}Q${f(x)} ${f(y - 3.6)} ${f(x + 3.6)} ${f(y)}Q${f(x)} ${f(y + 3.6)} ${f(x - 3.6)} ${f(y)}Z" fill="${col}" stroke="${P.inkW}" stroke-width=".5" stroke-opacity=".5" transform="rotate(${f(rot)} ${f(x)} ${f(y)})"/>`;
export const dandelion = (x, y) => line(`M${f(x)} ${f(y)}q1-4 0-8`, P.tuftG, 1, .7) + circ(x, y - 9, 3, '#fff') + circ(x - .8, y - 9.8, 1.2, '#fffaf0') + line(`M${f(x)} ${f(y - 9)}h-4M${f(x)} ${f(y - 9)}h4M${f(x)} ${f(y - 9)}v-4M${f(x)} ${f(y - 9)}l3-3M${f(x)} ${f(y - 9)}l-3-3`, '#eef0e0', .6, .9);
export const shell = (x, y) => ell(x, y, 3, 2.1, '#f6e2d2', 1, 20, ink('#b99c86', .6, .7)) + line(`M${f(x - 1.5)} ${f(y - 1)}l3 2M${f(x - 1)} ${f(y + 1)}l3-2`, '#d9b8a0', .6);

// scatter helper: positions in [pad, 64-pad], min spacing
export function scatter(r, n, pad = 12, gap = 14) {
  const pts = []; let tries = 0;
  while (pts.length < n && tries++ < 300) { const p = [r.range(pad, T - pad), r.range(pad + 2, T - pad)]; if (pts.every(q => Math.hypot(q[0] - p[0], q[1] - p[1]) > gap)) pts.push(p); }
  return pts;
}

// ---------- water fill (shared by seamless water tiles and autotile interiors) ----------
const ripple = (x, y, w = 12, col = P.water.foam, op = .75) => line(`M${f(x - w / 2)} ${f(y)}q${f(w / 4)}-3 ${f(w / 2)} 0t${f(w / 2)} 0`, col, 1.2, op);
export function waterFill(kind, extraSeed = 0) {
  const fam = FAM[kind], r = rng(hash('rip-' + kind)), out = [skeleton(fam)];
  const n = kind === 'shallow' ? 6 : 5;
  for (let i = 0; i < n; i++) { const x = r.range(0, T), y = r.range(0, T), w = r.range(10, 15); out.push(wrapped(x, y, 10, (a, b) => ripple(a, b, w, kind === 'deep' ? '#cfe6ef' : P.water.foam, kind === 'deep' ? .55 : .7))); }
  if (extraSeed) {
    const e = rng(extraSeed);
    out.push(interior(fam, extraSeed, { n: 3, tufts: 0, cols: kind === 'deep' ? ['#4a80a6', '#86b9d4'] : ['#a9dbe2', '#86bfd0'] }));
    for (let i = 0; i < 3; i++) out.push(ripple(e.range(14, 50), e.range(10, 54), e.range(9, 14), P.water.foam, .75));
    if (kind === 'shallow' && extraSeed % 2) out.push(circ(e.range(16, 48), e.range(16, 48), 1.4, '#fff', .8));
  }
  return out.join('');
}

// ---------- seamless ground variants ----------
export function groundTile(famKey, variant, seed, build) {
  const fam = FAM[famKey], t = newTile({ cat: 'ground', name: famKey, variant });
  t.add(famKey === 'shallow' || famKey === 'deep' ? waterFill(famKey, seed) : skeleton(fam), ...(build ? [build(fam, t)] : []));
  return t;
}

// ---------- 47-blob autotile engine ----------
export const BIT = { N: 1, NE: 2, E: 4, SE: 8, S: 16, SW: 32, W: 64, NW: 128 };
export const canon = (m) => { let o = m; if (!(m & BIT.N && m & BIT.E)) o &= ~BIT.NE; if (!(m & BIT.S && m & BIT.E)) o &= ~BIT.SE; if (!(m & BIT.S && m & BIT.W)) o &= ~BIT.SW; if (!(m & BIT.N && m & BIT.W)) o &= ~BIT.NW; return o; };
export const BLOBS = [...new Set([...Array(256).keys()].map(canon))].sort((a, b) => a - b);   // 47 masks
const EXT = 26;
export function blobGeom(mask, mg, R) {
  const h = (b) => !!(mask & b);
  const x0 = h(BIT.W) ? -EXT : mg.w, x1 = h(BIT.E) ? T + EXT : T - mg.e, y0 = h(BIT.N) ? -EXT : mg.n, y1 = h(BIT.S) ? T + EXT : T - mg.s;
  const rTL = !h(BIT.N) && !h(BIT.W) ? R : 0, rTR = !h(BIT.N) && !h(BIT.E) ? R : 0, rBR = !h(BIT.S) && !h(BIT.E) ? R : 0, rBL = !h(BIT.S) && !h(BIT.W) ? R : 0;
  const cl = (r) => Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2);
  const [a, b, c, d] = [cl(rTL), cl(rTR), cl(rBR), cl(rBL)];
  let dstr = `M${f(x0 + a)} ${f(y0)}H${f(x1 - b)}${b ? `Q${f(x1)} ${f(y0)} ${f(x1)} ${f(y0 + b)}` : ''}V${f(y1 - c)}${c ? `Q${f(x1)} ${f(y1)} ${f(x1 - c)} ${f(y1)}` : ''}H${f(x0 + d)}${d ? `Q${f(x0)} ${f(y1)} ${f(x0)} ${f(y1 - d)}` : ''}V${f(y0 + a)}${a ? `Q${f(x0)} ${f(y0)} ${f(x0 + a)} ${f(y0)}` : ''}Z`;
  const notches = []; const rnW = Math.min(mg.w, mg.n), rnE = Math.min(mg.e, mg.n), rsW = Math.min(mg.w, mg.s), rsE = Math.min(mg.e, mg.s);
  if (h(BIT.N) && h(BIT.W) && !h(BIT.NW)) notches.push(`M${-EXT} ${-EXT}H${mg.w}V${mg.n - rnW}Q${mg.w} ${mg.n} ${mg.w - rnW} ${mg.n}H${-EXT}Z`);
  if (h(BIT.N) && h(BIT.E) && !h(BIT.NE)) notches.push(`M${T + EXT} ${-EXT}H${T - mg.e}V${mg.n - rnE}Q${T - mg.e} ${mg.n} ${T - mg.e + rnE} ${mg.n}H${T + EXT}Z`);
  if (h(BIT.S) && h(BIT.W) && !h(BIT.SW)) notches.push(`M${-EXT} ${T + EXT}H${mg.w}V${T - mg.s + rsW}Q${mg.w} ${T - mg.s} ${mg.w - rsW} ${T - mg.s}H${-EXT}Z`);
  if (h(BIT.S) && h(BIT.E) && !h(BIT.SE)) notches.push(`M${T + EXT} ${T + EXT}H${T - mg.e}V${T - mg.s + rsE}Q${T - mg.e} ${T - mg.s} ${T - mg.e + rsE} ${T - mg.s}H${T + EXT}Z`);
  return { d: dstr + notches.join(''), outer: dstr, x0, x1, y0, y1, mask, mg, R, notches, h };
}
const evenodd = { 'fill-rule': 'evenodd', 'clip-rule': 'evenodd' };
export const pad3 = (m) => String(m).padStart(3, '0');

// Style definitions. under(): what shows outside the shape. paint(t, geom, clipUrl): fill, details, rim.
const STYLES = {
  'water-shore': {
    cat: 'edges', mg: { n: 9, e: 9, s: 9, w: 9 }, R: 22,
    build(t, G) {
      const clip = t.clip(G.d.replace(/Z/g, 'Z')); const cl = `clip-path="${clip}"`;
      t.add(skeleton(FAM.grass));
      t.add(path(G.d, 'none', 1, { stroke: '#7fae6a', 'stroke-width': 11, 'stroke-opacity': .22, 'stroke-linejoin': 'round' })); // wet bank
      t.add(`<g ${cl}>`);
      t.add(waterFill('shallow'));
      t.add(path(G.d, 'none', 1, { stroke: '#d8f0ee', 'stroke-width': 13, 'stroke-opacity': .5, 'stroke-linejoin': 'round' }));
      t.add(path(G.d, 'none', 1, { stroke: '#e9f6f0', 'stroke-width': 5, 'stroke-opacity': .45, 'stroke-linejoin': 'round' }));
      t.add('</g>');
      t.add(path(G.d, 'none', 1, { stroke: P.water.rim, 'stroke-width': 1.3, 'stroke-opacity': .5, 'stroke-linejoin': 'round' }));
      // little reeds / grass fringe on the bank (only on missing sides, inside tile)
    },
  },
  'water-deep': {
    cat: 'edges', mg: { n: 11, e: 11, s: 11, w: 11 }, R: 24,
    build(t, G) {
      const clip = t.clip(G.d);
      t.add(waterFill('shallow'));
      t.add(path(G.d, 'none', 1, { stroke: '#6fb0c8', 'stroke-width': 14, 'stroke-opacity': .35, 'stroke-linejoin': 'round' }));
      t.add(`<g clip-path="url(#${clip.slice(5, -1)})">`);
      t.add(waterFill('deep'));
      t.add(path(G.d, 'none', 1, { stroke: '#8fc4dc', 'stroke-width': 9, 'stroke-opacity': .4, 'stroke-linejoin': 'round' }));
      t.add('</g>');
      t.add(path(G.d, 'none', 1, { stroke: '#3f78a0', 'stroke-width': 1.2, 'stroke-opacity': .45, 'stroke-linejoin': 'round' }));
    },
  },
  'dirt-patch': {
    cat: 'edges', mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, fam: 'dirt',
    build(t, G) { patchStyle(t, G, 'dirt', '#c0a26c'); },
  },
  'sand-patch': {
    cat: 'edges', mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, fam: 'sand',
    build(t, G) { patchStyle(t, G, 'sand', '#c9b27a'); },
  },
  'cliff': {
    cat: 'edges', mg: { n: 8, e: 8, s: 6, w: 8 }, R: 14,
    build(t, G) {
      const clip = t.clip(G.d), id = clip.slice(5, -1), WALL = 22;
      t.add(skeleton(FAM.grass));
      const hasS = G.h(BIT.S);
      // ground shadow under the wall
      const wy = T - G.mg.s;
      if (!hasS) t.add(rect(G.x0, wy - 1, G.x1 - G.x0, 8, '#3b3a24', 0, .17), rect(G.x0 + 2, wy, G.x1 - G.x0 - 4, 4, '#2e2c1a', 0, .12));
      t.add(path(G.d, 'none', 1, { stroke: '#8a7660', 'stroke-width': 5, 'stroke-opacity': .18, 'stroke-linejoin': 'round' }));
      t.add(`<g clip-path="url(#${id})">`);
      t.add(skeleton(FAM.top));
      // rocky top: a few canonical flecks (wrapped)
      const r = rng(hash('cliff-top'));
      for (let i = 0; i < 6; i++) { const x = r.range(0, T), y = r.range(0, T); t.add(wrapped(x, y, 6, (a, b) => line(`M${f(a)} ${f(b)}l${f(r.range(3, 5))} ${f(r.range(-1, 1))}`, '#9a8670', 1, .4))); }
      for (let i = 0; i < 2; i++) { const x = r.range(0, T), y = r.range(0, T), s = r.range(.8, 1.2); t.add(wrapped(x, y, 6, (a, b) => ell(a + 1, b + 1.6, 4.4 * s, 1.8 * s, '#3b3a24', .14) + ell(a, b, 4 * s, 2.8 * s, '#b4ad98', 1, 0, ink('#857d6c', .6, .6)) + ell(a - 1, b - 1, 2 * s, 1.1 * s, '#e0d9c4', .9))); }
      for (let i = 0; i < 3; i++) { const x = r.range(0, T), y = r.range(0, T); t.add(wrapped(x, y, 6, (a, b) => tuft(a, b, '#9a9a58', .7, .7))); }
      t.add(path(G.d, 'none', 1, { stroke: '#f1e9d3', 'stroke-width': 7, 'stroke-opacity': .45, 'stroke-linejoin': 'round' }));
      // wall(s)
      const walls = []; if (!hasS) walls.push([G.x0, G.x1]);
      if (G.notches.length) { if (G.h(BIT.S) && G.h(BIT.W) && !G.h(BIT.SW)) walls.push([-EXT, G.mg.w]); if (G.h(BIT.S) && G.h(BIT.E) && !G.h(BIT.SE)) walls.push([T - G.mg.e, T + EXT]); }
      const wallGrad = t.lg(P.cliffFace, 90), wr = rng(hash('cliff-wall'));
      for (const [a, b] of walls) {
        t.add(rect(a, wy - WALL, b - a, WALL + 1, wallGrad));
        t.add(rect(a, wy - WALL, b - a, 3, '#f1e9d3', 0, .55));
        for (let k = 0; k < 3; k++) t.add(rect(a, wy - WALL + 7 + k * 6, b - a, 1.3, '#5e4e3e', 0, .38));
        t.add(rect(a, wy - 5, b - a, 5, '#3b3a24', 0, .18));
      }
      // vertical cracks and chips, wrapped so they tile horizontally
      if (walls.length) for (let i = 0; i < 4; i++) { const x = wr.range(0, T); t.add(wrapped(x, wy - WALL / 2, 6, (a, b) => { const y0 = wy - WALL + 3 + wr.range(0, 4); return line(`M${f(a)} ${f(y0)}l2 4l-2 4`, '#5e4e3e', 1, .5); })); }
      t.add('</g>');
      t.add(path(G.d, 'none', 1, { stroke: '#6e5c49', 'stroke-width': 1.2, 'stroke-opacity': .55, 'stroke-linejoin': 'round' }));
    },
  },
  'forest': {
    cat: 'edges', mg: { n: 4, e: 4, s: 4, w: 4 }, R: 24,
    build(t, G, variant = 0) {
      const clip = t.clip(G.d), id = clip.slice(5, -1);
      t.add(skeleton(FAM.grass));
      t.add(path(G.d, 'none', 1, { stroke: '#2f5a34', 'stroke-width': 9, 'stroke-opacity': .16, 'stroke-linejoin': 'round' }));
      t.add(`<g clip-path="url(#${id})">`, skeleton(FAM.floor), forestShade(), '</g>');
      // shadows of the crowns on the ground for the lower boundary
      crowns(t, G);
    },
  },
};
function forestShade() { const r = rng(hash('fshade')); let o = ''; for (let i = 0; i < 7; i++) { const x = r.range(0, T), y = r.range(0, T), rx = r.range(10, 18); o += wrapped(x, y, rx, (a, b) => ell(a, b, rx, rx * .7, '#2f5a34', .32, r.range(0, 180))); } return o; }
function patchStyle(t, G, famKey, rimCol) {
  const clip = t.clip(G.d), id = clip.slice(5, -1), fam = FAM[famKey];
  t.add(skeleton(FAM.grass));
  t.add(path(G.d, 'none', 1, { stroke: fam.rim, 'stroke-width': 9, 'stroke-opacity': .2, 'stroke-linejoin': 'round' }));
  t.add(`<g clip-path="url(#${id})">`, skeleton(fam));
  t.add(path(G.d, 'none', 1, { stroke: fam.w[1], 'stroke-width': 8, 'stroke-opacity': .5, 'stroke-linejoin': 'round' }));
  t.add('</g>');
  t.add(path(G.d, 'none', 1, { stroke: rimCol, 'stroke-width': 1.2, 'stroke-opacity': .5, 'stroke-linejoin': 'round' }));
  // grass tufts sprouting on the margin of missing sides
  const r = rng(hash('fringe' + famKey));
  for (let i = 0; i < 5; i++) { const x = r.range(8, 56), y = r.range(8, 56); const inside = !G.h(BIT.N) && y < 12 || !G.h(BIT.S) && y > 52 || !G.h(BIT.W) && x < 12 || !G.h(BIT.E) && x > 52; if (false && inside) t.add(tuft(x, y)); }
}

// crowns for forest-edge pieces: every crown lies wholly inside the tile, so neighbouring tiles never need to agree on one
const CROWN_SPOTS = (() => { const r = rng(hash('crown-spots')); const base = [[16, 16], [48, 16], [16, 48], [48, 48]]; return base.map(([x, y]) => [x + r.range(-3, 3), y + r.range(-3, 3), r.range(13, 16)]); })();
const CROWN_FILL = (() => { const r = rng(hash('crown-spots2')); return [[32, 32, 11], [32, 6, 7], [32, 58, 7], [6, 32, 7], [58, 32, 7]]; })();
export function inShape(G, x, y, rad) {
  if (x - rad < G.x0 || x + rad > G.x1 || y - rad < G.y0 || y + rad > G.y1) return false;
  const corner = (cx, cy, R, sx, sy) => R && (x - cx) * sx > 0 && (y - cy) * sy > 0 && Math.hypot(x - cx, y - cy) > R - rad;
  const R = G.R; if (!G.h(BIT.N) && !G.h(BIT.W) && corner(G.x0 + R, G.y0 + R, R, -1, -1)) return false;
  if (!G.h(BIT.N) && !G.h(BIT.E) && corner(G.x1 - R, G.y0 + R, R, 1, -1)) return false;
  if (!G.h(BIT.S) && !G.h(BIT.E) && corner(G.x1 - R, G.y1 - R, R, 1, 1)) return false;
  if (!G.h(BIT.S) && !G.h(BIT.W) && corner(G.x0 + R, G.y1 - R, R, -1, 1)) return false;
  const mg = G.mg;
  if (G.h(BIT.N) && G.h(BIT.W) && !G.h(BIT.NW) && x < mg.w + rad && y < mg.n + rad) return false;
  if (G.h(BIT.N) && G.h(BIT.E) && !G.h(BIT.NE) && x > T - mg.e - rad && y < mg.n + rad) return false;
  if (G.h(BIT.S) && G.h(BIT.W) && !G.h(BIT.SW) && x < mg.w + rad && y > T - mg.s - rad) return false;
  if (G.h(BIT.S) && G.h(BIT.E) && !G.h(BIT.SE) && x > T - mg.e - rad && y > T - mg.s - rad) return false;
  return true;
}
export function crown(t, cx, cy, r, seed, cols = P.leaf2, trunk = false) {
  const rr = rng(seed), o = [];
  o.push(ell(cx + r * .1, cy + r * .85, r * .95, r * .3, '#2e2c1a', .2));
  const rgd = t.rg(cols, .34, .28, .95);
  o.push(path(blobPath(rr, cx, cy, r, r * .94, 11, .08), rgd, 1, ink(P.inkG, .9, .7)));
  o.push(ell(cx + r * .3, cy + r * .42, r * .6, r * .42, cols[2], .35, 30));
  for (let k = 0; k < 4; k++) { const a = -2.4 + k * .5 + rr.range(-.1, .1), d = r * rr.range(.35, .6); o.push(ell(cx + Math.cos(a) * d, cy + Math.sin(a) * d + 1, 3.4, 1.3, cols[0], .6, rr.range(-45, 20))); }
  o.push(ell(cx - r * .1, cy + r * .3, 2.8, 1, cols[2], .4, -20), ell(cx + r * .35, cy + r * .05, 2.8, 1, cols[2], .4, 15));
  return o.join('');
}
const CROWN_PAL = [P.leaf2, ['#6fb27a', '#3c7a47', '#27583a'], ['#a8d884', '#6fb05a', '#3f8048'], ['#7fc28a', '#3f8a52', '#2a5e3a']];
const DIRS = [[0, -1, 1], [1, -1, 2], [1, 0, 4], [1, 1, 8], [0, 1, 16], [-1, 1, 32], [-1, 0, 64], [-1, -1, 128]];
const geomCache = new Map();
// geometry of the tile at offset (ox,oy) from the tile being drawn, using only what that tile can know from our 8 neighbours
function virtualGeom(G, ox, oy, mg, R) {
  if (ox || oy) { const bit = DIRS.find(d => d[0] === ox && d[1] === oy)[2]; if (!(G.mask & bit)) return null; }
  let m = 0;
  for (const [dx, dy, bit] of DIRS) {
    const nx = ox + dx, ny = oy + dy; let present;
    if (nx === 0 && ny === 0) present = true;
    else if (Math.abs(nx) <= 1 && Math.abs(ny) <= 1) present = !!(G.mask & DIRS.find(d => d[0] === nx && d[1] === ny)[2]);
    else present = true;
    if (present) m |= bit;
  }
  m = canon(m); const key = m + '/' + mg.n + mg.s; if (!geomCache.has(key)) geomCache.set(key, blobGeom(m, mg, R)); return geomCache.get(key);
}
// Crowns follow a staggered lattice (period 64, identical in every tile). A crown that crosses a tile edge is drawn only if it
// fits inside the shape of every tile it touches, judged from data both tiles share, so neighbours always agree.
export function crowns(t, G, { pal = CROWN_PAL, tag = '', draw = null } = {}) {
  const slots = [];
  for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) {
    const r = rng(hash(`slot${tag}${i},${j}`)); slots.push({ x: 10.67 + 21.33 * i + (j % 2 ? 10.67 : 0) + r.range(-2.5, 2.5), y: 8 + 16 * j + r.range(-2.5, 2.5), r0: r.range(12.5, 15.5), pal: Math.floor(r.range(0, 4)), seed: 200 + i * 7 + j });
  }
  const fits = (px, py, r) => {
    for (let oy = Math.floor((py - r) / T); oy <= Math.floor((py + r) / T); oy++) for (let ox = Math.floor((px - r) / T); ox <= Math.floor((px + r) / T); ox++) {
      const gg = virtualGeom(G, ox, oy, G.mg, G.R); if (!gg || !inShape(gg, px - ox * T, py - oy * T, r)) return false;
    } return true;
  };
  const placed = [];
  for (const s of slots) for (const dx of [-T, 0, T]) for (const dy of [-T, 0, T]) {
    const px = s.x + dx, py = s.y + dy; if (px + s.r0 < 0 || px - s.r0 > T || py + s.r0 < 0 || py - s.r0 > T) continue;
    let r = s.r0; while (r >= 8 && !fits(px, py, r)) r -= 1; if (r < 8) continue;
    placed.push([px, py, r, s]);
  }
  placed.sort((a, b) => a[1] - b[1]);
  for (const [x, y, r, s] of placed) t.add((draw || crown)(t, x, y, r, s.seed, pal[s.pal % pal.length], false));
}
export function blobTile(styleKey, mask, variant = 0) {
  const S = STYLES[styleKey]; const t = newTile({ cat: S.cat, name: styleKey, variant: pad3(mask) });
  const G = blobGeom(mask, S.mg, S.R); S.build(t, G, variant); return t;
}
export const blobStyles = Object.keys(STYLES);
