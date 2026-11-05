// Ashkara sub-area 7, Tomb Approach: shared helpers (palette, floor families, tile emit, painted-wall kit, 3/4 wall faces, columns, braziers).
// Palette shift: golden sandstone, lapis and red paint, indigo-violet shade. The interior kit (floors, walls with a visible cap and painted face,
// columns, braziers, doorways, wall paint) is written to be reused by future regions that sit entirely inside structures.
// Self-contained: only imports the common libs and the neighbouring Red Wadi palette for the ramps.
import { T, rng, hash, f, newTile, save, ell, circ, rect, path, line, ink, wrapped, tuft, blobPath, shadow } from './lib.mjs';
import { D, frond, FAMS, dskel, dint, speckle, ripples, crackNet, slabLines, sandBase, BLOBS, blobGeom, pad3, sh, pebbleD, rockD, block, dotsLine } from './desert-lib.mjs';
import { scatter } from './ground.mjs';
import { mix, ramp, BAZ, GOLD, streaks, pts, stroke, sides, arms, C, TALL, LG } from './red-wadi-lib.mjs';
export { frond, T, rng, hash, f, ell, circ, rect, path, line, ink, wrapped, tuft, blobPath, D, FAMS, dskel, dint, speckle, ripples, crackNet, slabLines, sandBase, sh, pebbleD, rockD, block, dotsLine, scatter, BLOBS, blobGeom, pad3, mix, ramp, BAZ, GOLD, streaks, pts, stroke, sides, arms, C, TALL, LG };
export const SUB = 'tomb-approach', REGION = 'ashkara';
// ---- colour ramps (light -> dark) ----
export const STN = ['#f9e3b0', '#e6bd7e', '#b8864e'];     // golden sandstone, lit
export const STS = ['#e0b27e', '#b88660', '#7a5448'];     // sandstone in shade (violet-brown)
export const LAP = ['#86a4ee', '#3558c0', '#1e3482'];     // lapis blue paint
export const RED = ['#f07c5e', '#c03a30', '#7c1e22'];     // red ochre paint
export const TQ = ['#8fe0d4', '#3fb0ac', '#1f7a86'];      // turquoise paint
export const GLD = ['#fff0a8', '#f3c24f', '#b8862a'];     // gold leaf
export const BLK = ['#8a8494', '#4a4654', '#221f2a'];     // basalt / black granite
export const LIN = ['#fff8e6', '#eeddb8', '#c8aa7c'];     // linen and plaster
export const WOODS = ['#b8905c', '#8a6238', '#5a3c20'];
export const BONE = ['#fffaf0', '#eadcc0', '#bfa888'];
export const GRN = ['#c8d68a', '#8aa05c', '#4a6a34'];
export const SHD = '#4a3a66';       // shade colour
export const INKT = '#5a3a22';      // ink for sandstone
export const INKL = '#1c2a6a';      // ink for lapis paint
export const ik = (w = .9, op = .85) => ink(INKT, w, op);
// ---- families ----
export const AVE = { key: 'tavenue', b: '#e2bf8a', w: ['#d6b07a', '#ecd0a0', '#caa470', '#f2d9b0'], rim: '#a98050', tuft: '#8a7040' };       // sphinx avenue slabs, golden
export const WORN = { key: 'tworn', b: '#dcb884', w: ['#d0aa76', '#e6c898', '#c49e6a', '#ecd3a8'], rim: '#9a7448', tuft: '#8a7040' };        // worn, sand-filled joints
export const HALL = { key: 'thall', b: '#ecd09a', w: ['#e2c38a', '#f4dcb0', '#d8b680', '#f8e4bc'], rim: '#b88a58', tuft: '#9a7a48' };       // hall flagstones in sun
export const HSHD = { key: 'thshade', b: '#c9a98a', w: ['#bd9c80', '#d8bba0', '#b28f78', '#e0c8b0'], rim: '#7c5e6e', tuft: '#6a5668' };    // hall flagstones in violet shade
export const HDRK = { key: 'thdark', b: '#7e7886', w: ['#726c7c', '#8c8694', '#68626f', '#96909c'], rim: '#4a4452', tuft: '#3a3444' };      // black granite sanctum floor
export const HSND = { key: 'thsand', b: '#f0d9a0', w: ['#e8cb88', '#f8e8bc', '#e0c07c', '#fcefc8'], rim: '#c9a468', tuft: '#b08c4c' };      // drifted gold sand
export const PLST = { key: 'tplast', b: '#f0dcb0', w: ['#e8d0a0', '#f8e8c4', '#e0c898', '#fcf0d0'], rim: '#c0a070', tuft: '#a08850' };      // painted plaster floor
export const TOMB = FAMS.slab;     // south: where Dust Bazaar's bazaar-slab-fringe ends
// ---- seamless floors ----
// running-bond flagstones: rows of 32, joints staggered by half a slab, so the pattern wraps on all four sides
export function flagBase(fam, seed = 801, { tone = .12, joint = '#8a6240', lite = '#fbf0d6', jo = .55 } = {}) {
  const r = rng(seed); let o = dskel(fam), a = '', b = '';
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const x = i * 32 + (j ? 16 : 0), y = j * 32; for (const ox of [-64, 0]) o += rect(x + ox + 1, y + 1, 30, 30, r() < .5 ? '#ffffff' : '#5a3a22', 1, tone * r.range(.3, 1)); }
  for (let j = 0; j < 2; j++) { const y = j * 32; a += `M0 ${y}H64`; b += `M0 ${y + 1}H64`; for (let i = 0; i < 2; i++) { const x = i * 32 + (j ? 16 : 0); a += `M${x} ${y}V${y + 32}`; b += `M${x + 1} ${y + 1}V${y + 32}`; if (j && x === 48) { a += `M16 ${y}V${y + 32}`; b += `M17 ${y + 1}V${y + 32}`; } } }
  return o + line(b, lite, .9, .55) + line(a, joint, 1.2, jo);
}
// seamless square-set floor with a painted pattern per slab; kind picks the pattern
export function paintBase(kind, seed = 811) {
  let o = dskel(PLST); const S = 32;
  const tiles = { lotus: [[LAP, RED], [TQ, GLD]], diamond: [[RED, GLD], [LAP, LIN]], band: [[TQ, LAP], [RED, TQ]] }[kind] || [[LAP, RED], [TQ, GLD]];
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
    const x = i * S, y = j * S, [c1, c2] = tiles[(i + j) % 2], cx = x + S / 2, cy = y + S / 2;
    o += rect(x + 2, y + 2, S - 4, S - 4, LIN[0], 1, .8) + rect(x + 3.4, y + 3.4, S - 6.8, S - 6.8, 'none', 0, 1, { stroke: c1[1], 'stroke-width': 2.4, 'stroke-opacity': .9 });
    if (kind === 'lotus') o += lotus(cx, cy + 1, 1.5, c2) + circ(cx, cy - 7, 1.4, c1[1]) + circ(cx, cy + 9, 1.4, c1[1]);
    else if (kind === 'diamond') o += path(`M${cx} ${cy - 9}L${cx + 9} ${cy}L${cx} ${cy + 9}L${cx - 9} ${cy}Z`, c2[1], 1, ink(c2[2], .8, .9)) + path(`M${cx} ${cy - 4}L${cx + 4} ${cy}L${cx} ${cy + 4}L${cx - 4} ${cy}Z`, c1[1], 1);
    else for (let k = 0; k < 3; k++) o += rect(x + 6, y + 8 + k * 6, S - 12, 3, k === 1 ? c2[1] : c1[1], 0, .95);
    for (const [dx, dy] of [[0, 0], [S, 0], [0, S], [S, S]]) o += circ(x + dx * 0 + (dx ? S - 6 : 6), y + (dy ? S - 6 : 6), .8, GLD[1], .8);
  }
  return o + line('M0 0H64M0 32H64M0 64H64M0 0V64M32 0V64M64 0V64', '#8a6240', 1.4, .6) + line('M0 1H64M0 33H64M1 0V64M33 0V64', '#fbf0d6', .8, .5);
}
export const avenueBase = (seed = 821) => flagBase(AVE, seed, { jo: .5 }) + speckle(seed + 1, 16, ['#a98050', '#fff3cf'], 1, .4);
export const wornBase = (seed = 831) => flagBase(WORN, seed, { jo: .5 }) + speckle(seed + 1, 22, ['#f0d9a0', '#a98050'], 1.1, .55);
export const hallBase = (seed = 841) => flagBase(HALL, seed, { tone: .1 }) + speckle(seed + 1, 12, ['#fff6dc'], .9, .45);
export const shadeBase = (seed = 851) => flagBase(HSHD, seed, { joint: '#5a4658', lite: '#e8d4cc', tone: .1 });
export const darkBase = (seed = 861) => flagBase(HDRK, seed, { joint: '#221f2a', lite: '#aaa4b4', tone: .1, jo: .7 }) + speckle(seed + 1, 18, ['#c8c2d2', '#3a3644'], .9, .4);
export const sandBaseT = () => dskel(HSND) + ripples(871, 7, '#c9a468', .42) + speckle(872, 16, ['#fff6d8'], .9, .5);
export const plasterBase = () => dskel(PLST) + speckle(881, 14, ['#c0a070', '#fff'], 1, .35);
// ---- tile emit ----
export const mkT = (cat, name, variant, w = T, h = T) => newTile({ region: REGION, sub: SUB, cat, name, variant }, w, h);
export const outT = (t, cat, name, variant, tags = []) => save(t, { region: REGION, sub: SUB, cat, name, variant, tags: [...tags, 'desert', 'tomb-approach'] });
export function tile(cat, name, variant, size, tags, fn) {
  const t = mkT(cat, name, variant, size[0], size[1]); const r = rng(hash(`ta/${cat}/${name}/${variant}`));
  const s = fn(t, r); if (s) t.add(s); outT(t, cat, name, variant, tags); return t;
}
// ---- painted details ----
export const lotus = (x, y, s, c) => path(`M${f(x)} ${f(y + 3 * s)}Q${f(x - 5 * s)} ${f(y)} ${f(x)} ${f(y - 6 * s)}Q${f(x + 5 * s)} ${f(y)} ${f(x)} ${f(y + 3 * s)}Z`, c[1], 1, ink(c[2], .6, .9)) + path(`M${f(x - 1 * s)} ${f(y + 3 * s)}Q${f(x - 7 * s)} ${f(y + 1 * s)} ${f(x - 5 * s)} ${f(y - 3 * s)}Q${f(x - 2 * s)} ${f(y)} ${f(x - 1 * s)} ${f(y + 3 * s)}ZM${f(x + 1 * s)} ${f(y + 3 * s)}Q${f(x + 7 * s)} ${f(y + 1 * s)} ${f(x + 5 * s)} ${f(y - 3 * s)}Q${f(x + 2 * s)} ${f(y)} ${f(x + 1 * s)} ${f(y + 3 * s)}Z`, c[0], 1, ink(c[2], .5, .9));
const gs = (c, w = 1) => ({ stroke: c, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' });
// hieroglyph set, each about 8 high centred on (x,y); c = ink colour
export const GLYPH = {
  ankh: (x, y, c, s) => ell(x, y - 2.2 * s, 1.5 * s, 2 * s, 'none', 1, 0, gs(c, 1)) + line(`M${x} ${y - .2 * s}V${y + 4 * s}M${x - 2.4 * s} ${y + 1 * s}H${x + 2.4 * s}`, c, 1.1),
  eye: (x, y, c, s) => path(`M${x - 4 * s} ${y}Q${x} ${y - 3.6 * s} ${x + 4 * s} ${y}Q${x} ${y + 3 * s} ${x - 4 * s} ${y}Z`, 'none', 1, gs(c, .9)) + circ(x, y, 1.1 * s, c) + line(`M${x - 1 * s} ${y + 2.4 * s}Q${x - 2 * s} ${y + 4.6 * s} ${x - 4 * s} ${y + 4.4 * s}`, c, .9),
  wave: (x, y, c, s) => line(`M${x - 4 * s} ${y - 2.4 * s}l2 -1.4l2 1.4l2 -1.4l2 1.4M${x - 4 * s} ${y + .4 * s}l2 -1.4l2 1.4l2 -1.4l2 1.4M${x - 4 * s} ${y + 3 * s}l2 -1.4l2 1.4l2 -1.4l2 1.4`, c, 1),
  bird: (x, y, c, s) => ell(x, y + 1 * s, 3.4 * s, 2.2 * s, c, 1) + circ(x + 3 * s, y - 1.6 * s, 1.4 * s, c) + path(`M${x + 4.2 * s} ${y - 1.8 * s}L${x + 6 * s} ${y - .8 * s}L${x + 4 * s} ${y - .6 * s}Z`, c) + line(`M${x - 1 * s} ${y + 3 * s}V${y + 5 * s}M${x + 1 * s} ${y + 3 * s}V${y + 5 * s}`, c, .9),
  sun: (x, y, c, s) => circ(x, y, 3 * s, 'none', 1, gs(c, 1)) + circ(x, y, 1 * s, c) + line(`M${x - 5 * s} ${y}H${x - 3.6 * s}M${x + 3.6 * s} ${y}H${x + 5 * s}M${x} ${y - 5 * s}V${y - 3.6 * s}M${x} ${y + 3.6 * s}V${y + 5 * s}`, c, .9),
  feather: (x, y, c, s) => ell(x, y, 1.6 * s, 4.4 * s, c, 1) + line(`M${x} ${y - 4 * s}V${y + 5 * s}`, '#fff', .6, .8),
  cobra: (x, y, c, s) => path(`M${x - 2 * s} ${y + 4 * s}Q${x + 3 * s} ${y + 2 * s} ${x} ${y}Q${x - 3 * s} ${y - 2 * s} ${x} ${y - 4 * s}`, 'none', 1, gs(c, 1.6)) + ell(x + .4 * s, y - 3.4 * s, 2.4 * s, 2 * s, c, 1) + circ(x + 1.6 * s, y - 3.8 * s, .5, '#fff'),
  was: (x, y, c, s) => line(`M${x} ${y - 4 * s}V${y + 4 * s}M${x} ${y + 4 * s}l-1.6 1.6M${x} ${y + 4 * s}l1.6 1.6M${x} ${y - 4 * s}q2.4 -1 3 1.2`, c, 1.1),
  scarab: (x, y, c, s) => ell(x, y + .6 * s, 2.6 * s, 3 * s, c, 1) + circ(x, y - 3 * s, 1.3 * s, c) + line(`M${x - 2.6 * s} ${y - 1 * s}l-2 -1.4M${x + 2.6 * s} ${y - 1 * s}l2 -1.4M${x - 2.6 * s} ${y + 2 * s}l-2 1.4M${x + 2.6 * s} ${y + 2 * s}l2 1.4`, c, .9) + line(`M${x} ${y - 1.6 * s}V${y + 3 * s}`, '#fff', .5, .7),
  lotus: (x, y, c, s) => line(`M${x} ${y + 5 * s}V${y}`, c, .9) + path(`M${x} ${y + 1 * s}Q${x - 3.6 * s} ${y - 1 * s} ${x - 2.6 * s} ${y - 4.4 * s}Q${x - .6 * s} ${y - 2 * s} ${x} ${y + 1 * s}ZM${x} ${y + 1 * s}Q${x + 3.6 * s} ${y - 1 * s} ${x + 2.6 * s} ${y - 4.4 * s}Q${x + .6 * s} ${y - 2 * s} ${x} ${y + 1 * s}Z`, c),
  djed: (x, y, c, s) => line(`M${x} ${y - 4.4 * s}V${y + 4.4 * s}M${x - 2 * s} ${y - 3 * s}H${x + 2 * s}M${x - 2 * s} ${y - 1.2 * s}H${x + 2 * s}M${x - 2 * s} ${y + .6 * s}H${x + 2 * s}M${x - 3 * s} ${y + 4.4 * s}H${x + 3 * s}`, c, 1.1),
  man: (x, y, c, s) => circ(x, y - 3.6 * s, 1.5 * s, c) + path(`M${x - 2 * s} ${y - 2 * s}H${x + 2 * s}L${x + 2.6 * s} ${y + 3 * s}H${x - 2.6 * s}Z`, c) + line(`M${x + 2 * s} ${y - 1 * s}L${x + 5 * s} ${y - 2.6 * s}M${x - 1 * s} ${y + 3 * s}V${y + 5 * s}M${x + 1 * s} ${y + 3 * s}V${y + 5 * s}`, c, 1),
  reed: (x, y, c, s) => line(`M${x} ${y + 4 * s}V${y - 3 * s}M${x - 3 * s} ${y + 4 * s}Q${x - 3 * s} ${y - 1 * s} ${x} ${y - 4 * s}Q${x + 3 * s} ${y - 1 * s} ${x + 3 * s} ${y + 4 * s}`, c, 1),
};
const GKEYS = Object.keys(GLYPH);
// a row of glyphs from x0 to x1 at height y (not cut at the tile edges: stepped by `step`, first centre at x0 + step/2)
export function glyphRow(x0, x1, y, seed, c = INKL, s = .8, step = 11, only = null) {
  const r = rng(seed); let o = '';
  for (let x = x0 + step / 2; x < x1; x += step) o += GLYPH[(only || GKEYS)[Math.floor(r() * (only || GKEYS).length)]](x, y, c, s);
  return o;
}
// painted frieze bands (x,y,w,h): lotus-and-bud, checker, zigzag, stripes
export function frieze(x, y, w, h, kind = 'checker', cs = [LAP, RED, TQ]) {
  let o = rect(x, y, w, h, LIN[0], 0, 1, ink(INKT, .5, .6));
  const n = Math.floor(w / h);
  if (kind === 'checker') for (let i = 0; i < n * 2; i++) o += rect(x + i * w / (n * 2), y + (i % 2) * h / 2, w / (n * 2), h / 2, cs[(i >> 1) % cs.length][1], 0, 1);
  else if (kind === 'zigzag') o += line(`M${x} ${y + h}` + Array.from({ length: n * 2 }, (_, i) => `L${f(x + (i + 1) * w / (n * 2))} ${f(y + (i % 2 ? h : 0))}`).join(''), cs[0][1], 1.4);
  else if (kind === 'lotus') for (let i = 0; i < n; i++) o += lotus(x + (i + .5) * w / n, y + h * .55, h / 9, i % 2 ? cs[1] : cs[0]);
  else for (let i = 0; i < 3; i++) o += rect(x, y + i * h / 3, w, h / 3, cs[i % cs.length][1], 0, 1);
  return o;
}
// ---- 3/4 wall faces: (x0,y0)-(x1,y1) is the vertical face under a cap whose front edge is at y0 ----
// kind 'paint' = plaster with cornice, hieroglyph register and a lapis/red dado; 'rough' = coursed ashlar with a cavetto cornice
export function wallFace(t, x0, x1, y0, y1, kind = 'paint', seed = 901) {
  const w = x1 - x0, h = y1 - y0;
  let o = rect(x0, y0, w, h, t.lg(kind === 'paint' ? ['#f6dcaa', '#e8c088', '#c89462'] : ['#ecc48c', '#d2a068', '#a67450'], 90), 0, 1);
  if (kind === 'paint') {
    o += rect(x0, y0, w, 4, '#fbe8bc', 0, 1) + line(`M${x0} ${y0 + 4}H${x1}`, INKT, 1, .6) + frieze(x0, y0 + 1, w, 3, 'checker', [LAP, RED]).replace(/<rect[^>]*stroke[^>]*\/>/, '');
    o += rect(x0, y0 + 5, w, h - 12, '#f6e4bc', 0, .55) + glyphRow(x0, x1, y0 + 5 + (h - 12) / 2, seed, INKL, .62, 10);
    o += line(`M${x0} ${y0 + 5.2}H${x1}M${x0} ${y1 - 7}H${x1}`, LAP[1], .8, .8);
    o += frieze(x0, y1 - 6, w, 6, 'stripes', [RED, GLD, LAP]);
  } else {
    const r = rng(seed); const rows = [[y0 + 4, 7], [y0 + 11, 6.5], [y0 + 17.5, h - 17.5]];
    o += path(`M${x0} ${y0}H${x1}V${y0 + 4}Q${f((x0 + x1) / 2)} ${y0 + 6} ${x0} ${y0 + 4}Z`, '#f6d49a', 1) + line(`M${x0} ${y0 + 4}H${x1}`, INKT, 1, .5);
    rows.forEach(([yy, hh], j) => { let x = x0 - (j % 2 ? 11 : 0); while (x < x1) { const bw = r.range(16, 24); o += rect(Math.max(x0, x) + .4, yy + .4, Math.min(x1, x + bw) - Math.max(x0, x) - .8, hh - .8, r() < .5 ? '#fff' : SHD, 0, r.range(.05, .14)); o += line(`M${f(x + bw)} ${yy}V${yy + hh}`, '#7a5238', .9, .5); x += bw; } o += line(`M${x0} ${yy + hh}H${x1}`, '#7a5238', .9, .5); });
    o += path(`M${x0} ${y1 - 3}H${x1}V${y1}H${x0}Z`, '#b88650', .6);
  }
  return o + rect(x0, y0 + 4, w, h - 4, 'none', 0, 1, { stroke: 'none' }) + rect(x0, y1 - 8, w, 8, SHD, 0, .1);
}
// a stone cap (top surface) with slab joints
export const capFill = (t, x, y, w, h, seed = 77) => rect(x, y, w, h, t.lg(['#f8dc9c', '#e8c27a', '#d4a460'], 60), 0, 1);
// ---- columns, braziers, lamps ----
// a papyrus/lotus/palm-capital column in 3/4 view; base at (cx, by), shaft height sh. kind: 'bud' | 'open' | 'lotus' | 'palm' | 'plain' | 'broken'
export function column(t, cx, by, shh, kind = 'bud', wd = 10, lit = false) {
  let o = sh(cx + 1, by - 1, wd * 1.6, 3.6);
  o += rect(cx - wd * 1.15, by - 6, wd * 2.3, 6, t.lg(STN, 90), 1, 1, ik(.9)) + rect(cx - wd * .95, by - 9, wd * 1.9, 4, t.lg(STN, 90), 1, 1, ik(.8));
  const top = by - 9 - shh;
  if (kind === 'broken') return o + path(`M${cx - wd} ${by - 8}L${cx - wd} ${by - 18}L${cx - wd * .4} ${by - 22}L${cx} ${by - 17}L${cx + wd * .5} ${by - 24}L${cx + wd} ${by - 15}V${by - 8}Z`, t.lg(['#f6dca4', '#dcae78', '#a87a4c'], 0), 1, ik()) + line(`M${cx - wd * .3} ${by - 12}l2 4M${cx + wd * .4} ${by - 14}l-1 5`, '#7a5238', 1, .5);
  o += rect(cx - wd, top, wd * 2, shh, t.lg(['#fff0c4', '#e6bd7e', '#b8864e', '#8a603c'], 0), 0, 1, ik(.9));
  // reeds: vertical flutes, painted bands at the foot and under the capital
  for (let i = -2; i <= 2; i++) o += line(`M${f(cx + i * wd * .36)} ${top + 4}V${by - 10}`, '#7a5238', .8, .3);
  o += rect(cx - wd, by - 17, wd * 2, 3, RED[1], 0, .9) + rect(cx - wd, by - 14, wd * 2, 2, LAP[1], 0, .9);
  o += rect(cx - wd, top + 3, wd * 2, 2.4, LAP[1], 0, .9) + rect(cx - wd, top + 5.4, wd * 2, 2, GLD[1], 0, .9) + rect(cx - wd, top + 7.4, wd * 2, 2.4, RED[1], 0, .9);
  if (kind !== 'plain') o += glyphRow(cx - wd + 2, cx + wd - 2, top + (shh) * .45, cx, INKL, .5, 6, ['ankh', 'feather', 'reed', 'djed']);
  o += rect(cx + wd * .5, top, wd * .5, shh, SHD, 0, .22) + rect(cx - wd, top, wd * .35, shh, '#fff', 0, .24);
  const capY = top;
  if (kind === 'bud') o += path(`M${cx - wd * 1.1} ${capY + 2}Q${cx - wd * 1.5} ${capY - 8} ${cx - wd * .6} ${capY - 14}Q${cx} ${capY - 20} ${cx + wd * .6} ${capY - 14}Q${cx + wd * 1.5} ${capY - 8} ${cx + wd * 1.1} ${capY + 2}Z`, t.lg(['#fff0c4', '#e0b070', '#a87a4c'], 0), 1, ik(1)) + [-.5, 0, .5].map(k => line(`M${f(cx + k * wd * 1.6)} ${capY + 1}Q${f(cx + k * wd * 1.8)} ${capY - 8} ${f(cx + k * wd * .7)} ${capY - 15}`, '#7a5238', .9, .5)).join('') + rect(cx - wd * 1.1, capY - 2, wd * 2.2, 3, GRN[1], 0, .0) + line(`M${cx - wd * 1.1} ${capY - 1}H${cx + wd * 1.1}`, LAP[1], 1.4, .8);
  else if (kind === 'open') o += [-1, -.5, 0, .5, 1].map((k, i) => path(`M${f(cx + k * wd * .5)} ${capY + 2}Q${f(cx + k * wd * 1.7)} ${capY - 6} ${f(cx + k * wd * 1.4)} ${capY - 15 + Math.abs(k) * 5}Q${f(cx + k * wd * .3)} ${capY - 7} ${f(cx + k * wd * .5)} ${capY + 2}Z`, i % 2 ? TQ[1] : GRN[1], 1, ink(i % 2 ? TQ[2] : GRN[2], .7, .9))).join('') + ell(cx, capY, wd * 1.1, 2, STN[1], 1, 0, ik(.7));
  else if (kind === 'lotus') o += [-1, 0, 1].map((k) => lotus(cx + k * wd * .8, capY - 4 - (k ? 0 : 4), 1.5, k ? TQ : LAP)).join('') + ell(cx, capY, wd * 1.1, 2, STN[1], 1, 0, ik(.7));
  else if (kind === 'palm') o += [-70, -40, -10, 20, 50, 80, 110].map((a, i) => { const A = (a - 90) * Math.PI / 180; return path(`M${cx} ${capY + 1}Q${f(cx + Math.cos(A) * wd * 1.4)} ${f(capY + Math.sin(A) * wd * 1.4 - 4)} ${f(cx + Math.cos(A) * wd * 2.1)} ${f(capY + Math.sin(A) * wd * 1.7 + 4)}Q${f(cx + Math.cos(A) * wd * 1.1)} ${f(capY + Math.sin(A) * wd * .9)} ${cx} ${capY + 1}Z`, GRN[i % 3 ? 1 : 0], 1, ink(GRN[2], .7, .9)); }).join('') + ell(cx, capY, wd * 1.1, 2, STN[1], 1, 0, ik(.7));
  else o += rect(cx - wd * 1.3, capY - 5, wd * 2.6, 5, t.lg(STN, 90), 1, 1, ik(.9)) + rect(cx - wd * 1.6, capY - 9, wd * 3.2, 4.4, t.lg(STN, 90), 1, 1, ik(.9));
  return o;
}
// a bronze brazier bowl on a stand (lit or not), base at (cx, by)
export function bowl(t, cx, by, rx, lit, hgt = 10) {
  let o = sh(cx + 1, by, rx * 1.1, 3) + path(`M${cx - rx * .5} ${by}L${cx - rx * .3} ${by - hgt}H${cx + rx * .3}L${cx + rx * .5} ${by}Z`, t.lg(BLK, 0), 1, ink('#14121a', .8, .9));
  const y = by - hgt;
  o += path(`M${cx - rx} ${y - 8}H${cx + rx}L${cx + rx * .7} ${y}Q${cx} ${y + 4} ${cx - rx * .7} ${y}Z`, t.lg(['#d0a050', '#8a6226', '#4a3410'], 20), 1, ink('#2a1c08', .9, .9)) + ell(cx, y - 8, rx, 2.6, lit ? '#ff7a2a' : '#3a2e2c', 1, 0, ink('#2a1c08', .8, .9)) + line(`M${cx - rx * .8} ${y - 4}H${cx + rx * .8}`, GLD[1], .9, .7);
  if (lit) o += ell(cx, y - 9, rx * .9, 2, '#ffd35a', .9) + path(`M${cx - rx * .7} ${y - 9}Q${cx - rx * .5} ${y - 20} ${cx - rx * .1} ${y - 24}Q${cx - rx * .1} ${y - 16} ${cx + rx * .2} ${y - 20}Q${cx + rx * .8} ${y - 14} ${cx + rx * .7} ${y - 9}Z`, '#f26a1c', .95) + path(`M${cx - rx * .35} ${y - 9}Q${cx - rx * .2} ${y - 16} ${cx} ${y - 19}Q${cx + rx * .1} ${y - 14} ${cx + rx * .4} ${y - 9}Z`, '#ffd35a', .95) + circ(cx, y - 12, rx * 1.9, '#ffb040', .16);
  else o += ell(cx - 1, y - 9, rx * .6, 1.2, '#6a5a58', .8) + ell(cx + rx * .3, y - 9.4, 2, 1, '#8a7a76', .6);
  return o;
}
export const hang = (x, y, c, s = 1) => line(`M${x} ${y - 8 * s}V${y}`, '#3b2a1a', 1, .9) + path(`M${x - 4 * s} ${y}H${x + 4 * s}L${x + 5 * s} ${y + 9 * s}Q${x} ${y + 13 * s} ${x - 5 * s} ${y + 9 * s}Z`, c[1], 1, ink(c[2], .9, .9)) + rect(x - 2.6 * s, y + 2 * s, 5.2 * s, 7 * s, '#fff2b0', 1, .9) + circ(x, y + 5.6 * s, 7 * s, '#ffd35a', .2);
export const jarT = (t, x, y, s = 1, c = ['#f0d09c', '#d29a60', '#8a5a34']) => ell(x + 2 * s, y + 2, 7 * s, 2 * s, '#3b2a24', .16) + path(`M${f(x - 3 * s)} ${f(y - 11 * s)}H${f(x + 3 * s)}L${f(x + 3.4 * s)} ${f(y - 8 * s)}Q${f(x + 8 * s)} ${f(y - 6 * s)} ${f(x + 7 * s)} ${f(y - 1 * s)}Q${f(x + 4 * s)} ${f(y + 2 * s)} ${f(x)} ${f(y + 2 * s)}Q${f(x - 4 * s)} ${f(y + 2 * s)} ${f(x - 7 * s)} ${f(y - 1 * s)}Q${f(x - 8 * s)} ${f(y - 6 * s)} ${f(x - 3.4 * s)} ${f(y - 8 * s)}Z`, t.lg(c, 20), 1, ik(.9)) + ell(x, y - 11 * s, 3.4 * s, 1.1 * s, '#4a2a18', 1) + line(`M${f(x - 6 * s)} ${f(y - 4 * s)}Q${f(x)} ${f(y - 2 * s)} ${f(x + 6 * s)} ${f(y - 4 * s)}`, LAP[1], 1.2, .9);
// light haze / sand heap at a foot
export const drift = (t, cx, cy, rx, ry, op = .96) => ell(cx, cy + ry * .3, rx, ry, t.lg(['#fff0c0', '#f0d596', '#d4ac6c'], 70), op) + ell(cx - rx * .3, cy - ry * .1, rx * .45, ry * .3, '#fffae0', .6, -8) + ell(cx + rx * .35, cy + ry * .55, rx * .5, ry * .3, SHD, .14);
export const stoneT = (t, ang = 70) => t.lg(STN, ang);
export const blobSet = (name, { mg = { n: 8, e: 8, s: 8, w: 8 }, R = 24, build, tags = [] }) => {
  for (const m of BLOBS) { const t = mkT('edges', name, pad3(m)); build(t, blobGeom(m, mg, R), m); outT(t, 'edges', name, pad3(m), ['autotile', 'blob47', 'mask:' + m, ...tags]); }
};
