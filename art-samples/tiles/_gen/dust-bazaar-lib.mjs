// Ashkara sub-area 6, Dust Bazaar: shared helpers (palette, wash families, tile emit, drawing kit). Self-contained: imports the common libs and the neighbouring Red Wadi / Singing Erg palettes for the ramps.
// Palette shift: dusty brown-rose earth and mud brick with saturated cloth colours (madder red, teal, saffron, indigo, magenta).
import { T, rng, hash, f, newTile, save, ell, circ, rect, path, line, ink, wrapped, tuft, blobPath, shadow } from './lib.mjs';
import { D, FAMS, dskel, dint, speckle, ripples, crackNet, slabLines, BLOBS, blobGeom, pad3, sh, pebbleD, rockD, block, dotsLine } from './desert-lib.mjs';
import { scatter } from './ground.mjs';
import { mix, TERRA, BAZ, ramp, streaks, strata, pts, wscat, stroke, sides, arms, C, TALL, LG } from './red-wadi-lib.mjs';
import { APRI } from './singing-erg-lib.mjs';
export { T, rng, hash, f, ell, circ, rect, path, line, ink, wrapped, tuft, blobPath, D, FAMS, dskel, dint, speckle, ripples, crackNet, slabLines, sh, pebbleD, rockD, block, dotsLine, scatter, BLOBS, blobGeom, pad3, mix, TERRA, BAZ, APRI, ramp, streaks, strata, pts, wscat, stroke, sides, arms, C, TALL, LG };
export const SUB = 'dust-bazaar', REGION = 'ashkara';
// ---- families (BAZ is the exact Red Wadi bazaar-earth family, so the ramps meet) ----
export const ROSE = { key: 'bxrose', b: '#d3afa2', w: ['#c8a294', '#e0c2b6', '#bd9688', '#e6cdc2'], rim: '#94705f', tuft: '#84604e' };     // swept brown-rose earth
export const DUST = { key: 'bxdust', b: '#dcc4ac', w: ['#d2b89f', '#e8d4c0', '#c8ac92', '#eedcca'], rim: '#a48a70', tuft: '#8f7860' };     // fine road dust
export const TRMP = { key: 'bxtramp', b: '#c9a48c', w: ['#be9880', '#d6b6a0', '#b38c74', '#dcc2ae'], rim: '#8a6450', tuft: '#785444' };    // trampled stall ground
export const STRW = { key: 'bxstraw', b: '#d8bc8c', w: ['#ceb07e', '#e6cea0', '#c4a470', '#ecd8b0'], rim: '#a88a54', tuft: '#9a7c44' };    // straw-strewn
export const PLAZ = { key: 'bxplaza', b: '#dcbea0', w: ['#d2b090', '#e8cfb4', '#c8a484', '#eed8c0'], rim: '#a07e60', tuft: '#8a6a50' };    // plaza sandstone slab
export const COBB = { key: 'bxcobb', b: '#c8aa94', w: ['#bc9c86', '#d6bba6', '#b08f7a', '#dcc6b4'], rim: '#866650', tuft: '#765848' };    // cobbled lane court
export const BSHD = { key: 'bxshade', b: '#bd9aa0', w: ['#b08e98', '#ccaeb2', '#a48490', '#d4bcc0'], rim: '#7a5c6e', tuft: '#6a5062' };    // ground under an awning
export const MUDF = { key: 'bxmud', b: '#c99a7e', w: ['#be8e72', '#d8ae94', '#b38468', '#dfbaa2'], rim: '#8c5e48', tuft: '#7a4e3c' }; // mud-brick floor
export const RUBL = { key: 'bxrubl', b: '#cdae98', w: ['#c2a28c', '#dac0ac', '#b69882', '#e0cab8'], rim: '#8e705a', tuft: '#7c5e4a' };    // collapsed brick ground
export const TILE = { key: 'bxtile', b: '#9fc7c0', w: ['#92bcb4', '#b0d4cc', '#86b0a8', '#bcded6'], rim: '#4e8480', tuft: '#fff' };         // glazed court tile (teal)
export const TOMB = FAMS.slab;                                                                                                              // north: the Tomb Approach slabs are not made yet, ramp to the common slab
export const earthBase = () => dskel(BAZ) + speckle(611, 22, ['#9a7864', '#f2dccc'], 1, .45);
export const roseBase = () => dskel(ROSE) + speckle(621, 18, ['#94705f', '#f0dcd2'], 1, .45) + ripples(622, 3, '#94705f', .25, 12, 18);
export const dustBase = () => dskel(DUST) + ripples(631, 5, '#a48a70', .32) + speckle(632, 14, ['#fbefe0'], .9, .5);
export const trampBase = () => dskel(TRMP) + speckle(641, 26, ['#785444', '#e6cdbb', '#5e4034'], 1.2, .6);
export const strawBase = () => dskel(STRW) + speckle(651, 14, ['#a88a54'], 1, .4);
export const plazaBase = (seed = 661) => dskel(PLAZ) + slabLines(seed);
export const cobbBase = () => dskel(COBB) + speckle(671, 20, ['#866650', '#ecd8c8'], 1.1, .5);
export const shadeBase = () => dskel(BSHD) + speckle(681, 14, ['#7a5c6e', '#e2d0d4'], 1, .4);
export const mudfBase = (seed = 691) => dskel(MUDF) + crackNet(seed, '#6a3e2c', .45, .6);
export const rublBase = () => dskel(RUBL) + speckle(701, 28, ['#8e705a', '#e6d2c0', '#a86a50'], 1.5, .65);
// seamless glazed tile: 2x2 lattice of square tiles with grout and a cross motif every other tile
export function tileBase() {
  let o = dskel(TILE); const S = 32;
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const x = i * S, y = j * S, alt = (i + j) % 2; o += rect(x + 1.2, y + 1.2, S - 2.4, S - 2.4, alt ? '#2f8a96' : '#d8eee8', 2, alt ? .5 : .45) + rect(x + 5, y + 5, S - 10, S - 10, 'none', 0, 1, { stroke: alt ? '#e8f6f0' : '#2f8a96', 'stroke-width': 1, 'stroke-opacity': .7 }) + circ(x + S / 2, y + S / 2, 3, alt ? '#f3c24f' : '#c03a3a', .85); }
  return o + line('M0 0H64M0 32H64M0 64H64M0 0V64M32 0V64M64 0V64', '#f6f0e0', 1.8, .85);
}
// seamless woven rug: horizontal stripe bands (periodic in y) with a fringe-free weave texture
export function rugBase(c1, c2, c3, seed) {
  const r = rng(seed); let o = rect(0, 0, 64, 64, c1);
  const ys = [0, 10, 18, 26, 38, 46, 54]; const cols = [c2, c3, c2, c3, c2, c3, c2];
  ys.forEach((y, i) => { const h = (ys[i + 1] ?? 64) - y; o += rect(0, y + 1, 64, h - 2, cols[i], 0, i % 2 ? .75 : .9); });
  for (let i = 0; i < 4; i++) for (let k = 0; k < 8; k++) { const x = k * 8 + 4; o += path(`M${x} ${6 + i * 16}l4 4l-4 4l-4 -4Z`, '#fff0c8', .85) ; }
  for (let y = 2; y < 64; y += 4) o += line(`M0 ${y}H64`, '#000', .5, .07);
  for (let x = 2; x < 64; x += 4) o += line(`M${x} 0V64`, '#000', .5, .05);
  return o;
}
export const CLOTH = { red: ['#e8654c', '#c03a3a', '#7e2230'], teal: ['#58d0c4', '#1f9a9a', '#14646e'], saff: ['#ffd35a', '#f0a020', '#b06a10'], indigo: ['#7a82e0', '#4a52b8', '#2e2f7a'], mag: ['#e86aa8', '#b82e7e', '#7a1a54'], green: ['#8fd070', '#3f9a50', '#24663a'], cream: ['#fff6e0', '#ecd9b4', '#c8aa7c'] };
export const MUD = ['#ecc8b0', '#c98e74', '#8a5446'];       // mud brick, brown-rose
export const MUDS = ['#d9ab90', '#b07860', '#6e4238'];      // mud brick in shade
export const PLUM = '#5a3a58';                              // shade colour
export const INKB = '#4a2a24';                              // ink for brick and clay
export const WOODS = ['#b8905c', '#8a6238', '#5a3c20'];
export const BRASS = ['#fff0a8', '#e8b040', '#9a6a1a'];
export const BONE = ['#fffaf0', '#eadcc0', '#bfa888'];
export const GRN = ['#c8d68a', '#8aa05c', '#4a6a34'];
// ---- tile emit ----
export const mkT = (cat, name, variant, w = T, h = T) => newTile({ region: REGION, sub: SUB, cat, name, variant }, w, h);
export const outT = (t, cat, name, variant, tags = []) => save(t, { region: REGION, sub: SUB, cat, name, variant, tags: [...tags, 'desert', 'dust-bazaar'] });
export function tile(cat, name, variant, size, tags, fn) {
  const t = mkT(cat, name, variant, size[0], size[1]); const r = rng(hash(`db/${cat}/${name}/${variant}`));
  const s = fn(t, r); if (s) t.add(s); outT(t, cat, name, variant, tags); return t;
}
export function blobSet(name, { mg = { n: 8, e: 8, s: 8, w: 8 }, R = 24, build, tags = [] }) {
  for (const m of BLOBS) { const t = mkT('edges', name, pad3(m)); build(t, blobGeom(m, mg, R), m); outT(t, 'edges', name, pad3(m), ['autotile', 'blob47', 'mask:' + m, ...tags]); }
}
// ---- drawing kit ----
export const dust = (cx, cy, rx, ry, op = .3) => ell(cx, cy, rx, ry, '#f0d4c0', op) + ell(cx + 2, cy - 1, rx * .6, ry * .6, '#fbeadc', op * .8);
export const cloth = (t, c, ang = 60) => t.lg(c, ang);
export const wood = (t, ang = 0) => t.lg(WOODS, ang);
export const mud = (t, ang = 60) => t.lg(MUD, ang);
// a mud-brick wall face: rows of bricks with offset joints inside rect (x,y,w,h)
export function bricks(x, y, w, h, seed, cols = MUD, bh = 5, bw = 9) {
  const r = rng(seed); let o = rect(x, y, w, h, cols[1], 0, 1);
  for (let j = 0, yy = y; yy < y + h; j++, yy += bh) { const hh = Math.min(bh, y + h - yy); let xx = x - (j % 2 ? bw / 2 : 0); while (xx < x + w) { const x0 = Math.max(x, xx), x1 = Math.min(x + w, xx + bw); if (x1 - x0 > .5) o += rect(x0 + .3, yy + .3, x1 - x0 - .6, hh - .6, r() < .5 ? cols[0] : cols[1], 0, r.range(.35, .7)); xx += bw; } }
  for (let yy = y + bh; yy < y + h; yy += bh) o += line(`M${x} ${f(yy)}H${x + w}`, cols[2], .8, .55);
  return o;
}
// a clay jar / amphora in dusty rose
export const jar = (t, x, y, s = 1, c = MUD) => ell(x + 2 * s, y + 2, 7 * s, 2 * s, '#3b2a24', .16) + path(`M${f(x - 3 * s)} ${f(y - 11 * s)}H${f(x + 3 * s)}L${f(x + 3.4 * s)} ${f(y - 8 * s)}Q${f(x + 8 * s)} ${f(y - 6 * s)} ${f(x + 7 * s)} ${f(y - 1 * s)}Q${f(x + 4 * s)} ${f(y + 2 * s)} ${f(x)} ${f(y + 2 * s)}Q${f(x - 4 * s)} ${f(y + 2 * s)} ${f(x - 7 * s)} ${f(y - 1 * s)}Q${f(x - 8 * s)} ${f(y - 6 * s)} ${f(x - 3.4 * s)} ${f(y - 8 * s)}Z`, t.lg(c, 20), 1, ink(INKB, .9, .85)) + ell(x, y - 11 * s, 3.4 * s, 1.1 * s, '#4a2a24', 1) + line(`M${f(x - 6 * s)} ${f(y - 4 * s)}Q${f(x)} ${f(y - 2 * s)} ${f(x + 6 * s)} ${f(y - 4 * s)}`, '#f3c24f', 1, .8);
export const bone = (x, y, l, a, c = BONE) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">` + ell(1.2, 2.2, l * .6, 1.8, '#3b2a24', .14) + path(`M${-l / 2} 0H${l / 2}`, 'none', 1, { stroke: c[1], 'stroke-width': 3, 'stroke-linecap': 'round' }) + circ(-l / 2, 0, 2, c[0], 1, ink('#8a7458', .5, .8)) + circ(l / 2, 0, 2, c[0], 1, ink('#8a7458', .5, .8)) + `</g>`;
// a heap of loose spice/grain/powder in a given colour (small cone)
export const heap = (cx, cy, rx, ry, c) => ell(cx + 1, cy + ry * .4, rx * 1.05, ry * .5, '#3b2a24', .16) + path(`M${f(cx - rx)} ${f(cy + ry * .3)}Q${f(cx - rx * .5)} ${f(cy - ry * .2)} ${f(cx - rx * .12)} ${f(cy - ry)}Q${f(cx + rx * .12)} ${f(cy - ry * 1.05)} ${f(cx + rx * .2)} ${f(cy - ry * .9)}Q${f(cx + rx * .6)} ${f(cy - ry * .1)} ${f(cx + rx)} ${f(cy + ry * .3)}Q${f(cx)} ${f(cy + ry * .75)} ${f(cx - rx)} ${f(cy + ry * .3)}Z`, c[1], 1, ink(c[2], .8, .8)) + path(`M${f(cx - rx * .7)} ${f(cy + ry * .1)}Q${f(cx - rx * .3)} ${f(cy - ry * .3)} ${f(cx - rx * .12)} ${f(cy - ry * .85)}Q${f(cx - rx * .1)} ${f(cy - ry * .2)} ${f(cx - rx * .5)} ${f(cy + ry * .2)}Z`, c[0], .7);
