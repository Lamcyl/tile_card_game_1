// Ashkara sub-area 8: Sun Citadel (ashkara/sun-citadel), shared helpers: palette, glass/basalt/gold floors, tile emit, 3/4 wall kit (gold and basalt faces), gold fittings.
// Palette shift: white-gold light, dark ink-blue shade, obsidian. Reuses the Tomb Approach interior kit (wallFace-style 3/4 walls, columns, braziers, glyphs).
// Self-contained: only imports the common libs, Red Wadi / Tomb Approach palettes and the Tomb Approach kit.
import { T, rng, hash, f, newTile, save, ell, circ, rect, path, line, ink, wrapped, tuft, blobPath, shadow } from './lib.mjs';
import { D, FAMS, dskel, dint, speckle, ripples, crackNet, slabLines, sh, pebbleD, rockD, block, dotsLine, BLOBS, blobGeom, pad3, frond } from './desert-lib.mjs';
import { scatter } from './ground.mjs';
import { mix, ramp, GOLD, streaks, pts, stroke, sides, arms, C, TALL, LG, TERRA, OCHRE, RSAND, WGRV, BAZ } from './red-wadi-lib.mjs';
import { AVE, HALL, STN, LAP, RED, TQ, GLD, BLK, LIN, WOODS, BONE, GRN, flagBase, GLYPH, glyphRow, frieze, lotus, column, bowl, jarT, hang } from './tomb-approach-lib.mjs';
export { T, rng, hash, f, ell, circ, rect, path, line, ink, wrapped, tuft, blobPath, D, FAMS, dskel, dint, speckle, ripples, crackNet, slabLines, sh, pebbleD, rockD, block, dotsLine, scatter, BLOBS, blobGeom, pad3, frond,
  mix, ramp, GOLD, streaks, pts, stroke, sides, arms, C, TALL, LG, TERRA, OCHRE, RSAND, WGRV, BAZ, AVE, HALL, STN, LAP, RED, TQ, GLD, BLK, LIN, WOODS, BONE, GRN, flagBase, GLYPH, glyphRow, frieze, lotus, column, bowl, jarT, hang };
export const SUB = 'sun-citadel', REGION = 'ashkara';
// ---- colours ----
export const GM = ['#fff7c4', '#f6c850', '#b8862a'];       // polished gold
export const GD = ['#f4d86a', '#c8923a', '#7a5214'];       // deep / old gold
export const OB = ['#6e6888', '#2c2838', '#0e0c16'];       // obsidian, light -> dark
export const BS = ['#8a8498', '#5c5870', '#34303e'];       // basalt
export const GL = ['#effcf6', '#a6dcd4', '#4f9aa2'];       // fused glass
export const SKY = ['#f6fcff', '#c4e6f0', '#82b8d4'];      // mirror reflection of the sky
export const FIRE = ['#fff0a0', '#ff9a2a', '#d8481c'];
export const SHB = '#2a3668';          // ink-blue shade
export const INKG = '#6a4414';         // ink for gold
export const INKO = '#0c0a14';         // ink for obsidian
export const ikg = (w = .9, op = .85) => ink(INKG, w, op);
export const iko = (w = .9, op = .9) => ink(INKO, w, op);
// ---- families (GOLD is the pale gold already used by the Red Wadi and Tomb Approach ramps) ----
export const GLASS = { key: 'sglass', b: '#dfe6cc', w: ['#d3dcc0', '#eaf0da', '#c8d2b6', '#f2f6e4'], rim: '#9aaa94', tuft: '#8a9a80' };      // fused glass sand
export const SCORCH = { key: 'sscorch', b: '#cdb596', w: ['#c0a688', '#dac4a6', '#b69c7e', '#e2d0b6'], rim: '#806650', tuft: '#6a5440' };   // scorched earth
export const BAS = { key: 'sbasalt', b: '#7a7688', w: ['#6e6a7c', '#8a8698', '#646072', '#94909f'], rim: '#3c384a', tuft: '#34303e' };       // black basalt grit
export const OBS = { key: 'sobs', b: '#4a4660', w: ['#403c56', '#58546e', '#38344c', '#625e78'], rim: '#1c1a28', tuft: '#14121c' };           // obsidian slab
export const GFL = { key: 'sgflag', b: '#f2e2b0', w: ['#e8d49c', '#f8ecc8', '#e0cc94', '#fcf2d2'], rim: '#c2a46a', tuft: '#a89058' };        // citadel court gold flags
export const MIRF = { key: 'smirror', b: '#f6eed0', w: ['#ece2c0', '#fcf6dc', '#e4d8b4', '#fffae8'], rim: '#cdbc8a', tuft: '#b0a070' };      // polished white-gold floor
export const EMBR = { key: 'sember', b: '#a08a76', w: ['#94806c', '#b09a86', '#8a7662', '#bca892'], rim: '#5a4638', tuft: '#4a3a30' };      // cinder and ember ground
// ---- seamless floors ----
export const goldBase = (seed = 11) => dskel(GOLD) + ripples(seed, 5, '#cdb67a', .34) + speckle(seed + 1, 18, ['#fff8d8', '#d8bf80', '#f6d878'], 1, .55);
export const glassBase = (seed = 21) => dskel(GLASS) + crackNet(seed, '#7a9c98', .45, .6) + streaks(seed + 2, 3, '#ffffff', .34, 14, 22) + speckle(seed + 3, 14, ['#ffffff', '#8cc4c0'], 1, .6);
export const scorchBase = (seed = 31) => dskel(SCORCH) + streaks(seed, 3, '#4a3a2c', .2, 12, 20) + speckle(seed + 1, 26, ['#3a2e26', '#e6d4b8', '#6a5444'], 1.2, .55);
export const basaltBase = (seed = 41) => dskel(BAS) + crackNet(seed, '#2a2636', .55, .45) + speckle(seed + 1, 30, ['#2c2838', '#aaa4b8', '#58546a'], 1.3, .6);
export const obsBase = (seed = 51) => flagBase(OBS, seed, { tone: .1, joint: '#0c0a14', lite: '#8a84a4', jo: .75 }) + streaks(seed + 3, 2, '#aaa4d0', .16, 12, 18) + speckle(seed + 1, 12, ['#b8b2d8', '#12101a'], .9, .45);
export const courtBase = (seed = 61) => flagBase(GFL, seed, { tone: .09, joint: '#a88848', lite: '#fff8dc', jo: .5 }) + speckle(seed + 1, 12, ['#fffbe8', '#d8bc78'], .9, .5);
export const mirrorBase = (seed = 71) => flagBase(MIRF, seed, { tone: .07, joint: '#b09a62', lite: '#ffffff', jo: .42 }) + line('M0 64L64 0M-8 32L32 -8M32 72L72 32', '#ffffff', 3, .38) + line('M0 64L64 0', '#ffffff', 1.2, .6);
export const emberBase = (seed = 81) => dskel(EMBR) + speckle(seed, 30, ['#3a2e28', '#d8b898', '#7a5a46'], 1.3, .6) + ripples(seed + 1, 3, '#6a5240', .3, 10, 16);
// ---- tile emit ----
export const mkT = (cat, name, variant, w = T, h = T) => newTile({ region: REGION, sub: SUB, cat, name, variant }, w, h);
export const outT = (t, cat, name, variant, tags = []) => save(t, { region: REGION, sub: SUB, cat, name, variant, tags: [...tags, 'desert', 'sun-citadel'] });
export function tile(cat, name, variant, size, tags, fn) {
  const t = mkT(cat, name, variant, size[0], size[1]); const r = rng(hash(`sc/${cat}/${name}/${variant}`));
  const s = fn(t, r); if (s) t.add(s); outT(t, cat, name, variant, tags); return t;
}
export const blobSet = (name, { mg = { n: 8, e: 8, s: 8, w: 8 }, R = 24, build, tags = [] }) => {
  for (const m of BLOBS) { const t = mkT('edges', name, pad3(m)); build(t, blobGeom(m, mg, R), m); outT(t, 'edges', name, pad3(m), ['autotile', 'blob47', 'mask:' + m, ...tags]); }
};
// ---- gold fittings ----
export const goldT = (t, a = 90) => t.lg(GM, a);
export const obsT = (t, a = 60) => t.lg(['#7c76a0', '#2c2838', '#100e18'], a);
export const glow = (cx, cy, r, op = .5) => circ(cx, cy, r, '#fff3b0', op * .35) + circ(cx, cy, r * .66, '#ffe580', op * .5) + circ(cx, cy, r * .34, '#fffbe0', op * .8);
// a sun disc with rays, centred (cx,cy)
export function sunDisc(t, cx, cy, r, rays = 12, rayLen = 0.5) {
  let o = '';
  for (let i = 0; i < rays; i++) { const a = i * Math.PI * 2 / rays; o += path(`M${f(cx + Math.cos(a - .12) * r * 1.05)} ${f(cy + Math.sin(a - .12) * r * 1.05)}L${f(cx + Math.cos(a) * r * (1.05 + rayLen))} ${f(cy + Math.sin(a) * r * (1.05 + rayLen))}L${f(cx + Math.cos(a + .12) * r * 1.05)} ${f(cy + Math.sin(a + .12) * r * 1.05)}Z`, GM[1], 1, ikg(.5, .8)); }
  return o + circ(cx, cy, r, t.rg(GM, .36, .3, .8), 1, ikg(.9, .9)) + circ(cx, cy, r * .62, 'none', 1, ink(GD[2], .7, .6)) + circ(cx - r * .3, cy - r * .3, r * .22, '#fffbe0', .85);
}
// mirror panel face (x,y,w,h): sky reflection with glare
export const mirrorPanel = (t, x, y, w, h, frame = true) => (frame ? rect(x - 1.6, y - 1.6, w + 3.2, h + 3.2, t.lg(GM, 45), 1.4, 1, ikg(.8)) : '') + rect(x, y, w, h, t.lg(SKY, 60), 1, 1, ink('#3a6a88', .7, .8)) + path(`M${f(x + w * .18)} ${f(y + h)}L${f(x + w * .55)} ${y}H${f(x + w * .78)}L${f(x + w * .4)} ${f(y + h)}Z`, '#fff', .55) + path(`M${f(x + w * .02)} ${f(y + h)}L${f(x + w * .22)} ${y}H${f(x + w * .3)}L${f(x + w * .1)} ${f(y + h)}Z`, '#fff', .3);
// ---- 3/4 wall faces: (x0,y0)-(x1,y1) is the vertical face under a cap whose front edge is at y0 ----
// kind 'gold' = gold plaster with a gold cornice, mirror panels and sun discs on a 16px rhythm and an ink-blue dado; 'basalt' = black ashlar with gold inlay lines
export function cFace(t, x0, x1, y0, y1, kind = 'gold', seed = 901) {
  const w = x1 - x0, h = y1 - y0, r = rng(seed);
  let o = rect(x0, y0, w, h, t.lg(kind === 'gold' ? ['#fdeeb0', '#f2cc68', '#c8923a'] : ['#6a667e', '#403c52', '#24222e'], 90), 0, 1);
  if (kind === 'gold') {
    o += rect(x0, y0, w, 3.6, '#fff6c4', 0, 1) + line(`M${x0} ${y0 + 3.6}H${x1}`, INKG, 1, .6);
    for (let x = Math.ceil(x0 / 4) * 4; x + 2.4 <= x1; x += 4) o += rect(x, y0 + 4, 2.4, 2, GD[1], 0, .8);
    const ph = h - 13;
    for (let px = Math.ceil((x0 - 1) / 16) * 16 + 2; px + 12 <= x1; px += 16) {
      const k = Math.round((px - 2) / 16) % 2;
      if (k) o += rect(px, y0 + 7, 12, ph, t.lg(SKY, 60), 1, 1, ink('#3a6a88', .6, .8)) + rect(px - 1.2, y0 + 5.8, 14.4, ph + 2.4, 'none', 1.4, 1, { stroke: GD[1], 'stroke-width': 1.4 }) + path(`M${px + 2} ${y0 + 7 + ph}L${px + 7} ${y0 + 7}H${px + 9}L${px + 4} ${y0 + 7 + ph}Z`, '#fff', .55);
      else o += circ(px + 6, y0 + 7 + ph / 2, Math.min(5.4, ph / 2), t.rg(GM, .36, .3, .8), 1, ikg(.7, .85)) + circ(px + 5, y0 + 6 + ph / 2, 1.3, '#fffbe0', .8) + line(`M${px + 6} ${y0 + 7 + ph / 2 - 6.4}v-1M${px + 6} ${y0 + 7 + ph / 2 + 6.4}v1M${px - .6} ${y0 + 7 + ph / 2}h1.6M${px + 11.8} ${y0 + 7 + ph / 2}h-1.6`, GD[2], .8, .8);
    }
    o += rect(x0, y1 - 5, w, 5, SHB, 0, .85) + line(`M${x0} ${y1 - 5}H${x1}`, GM[1], 1.2, .9) + line(`M${x0} ${y1 - 2.4}H${x1}`, GM[1], .6, .5);
  } else {
    for (let y = y0 + 8; y < y1 - 2; y += 8) o += line(`M${x0} ${y}H${x1}`, '#14121a', .9, .55);
    for (let j = 0; j < 3; j++) { let x = x0 - (j % 2 ? 9 : 0); while (x < x1) { const bw = r.range(14, 22); if (x > x0) o += line(`M${f(x)} ${y0 + 4 + j * 8}v8`, '#14121a', .9, .5); o += rect(Math.max(x0, x) + .4, y0 + 4 + j * 8 + .4, Math.min(x1, x + bw) - Math.max(x0, x) - .8, 3, '#fff', 0, r.range(.03, .1)); x += bw; } }
    o += rect(x0, y0, w, 3.4, t.lg(['#9a94ac', '#6a667e'], 90), 0, 1) + line(`M${x0} ${y0 + 3.4}H${x1}`, INKO, 1, .8);
    o += line(`M${x0} ${y0 + h * .55}H${x1}`, GM[1], 1.4, .9) + line(`M${x0} ${y0 + h * .55 + 1.4}H${x1}`, GM[0], .5, .6);
    for (let gx = Math.ceil((x0 - 1) / 16) * 16 + 8; gx <= x1; gx += 16) o += rect(gx - 2.4, y0 + h * .55 - 4, 4.8, 8, '#14121a', 1, .9) + circ(gx, y0 + h * .55, 1.5, GM[1]);
    o += rect(x0, y1 - 4, w, 4, '#14121a', 0, .6);
  }
  return o + rect(x0, y1 - 8, w, 8, SHB, 0, .12);
}
// a cap (top surface) of a wall: gold or basalt
export const cCap = (t, x, y, w, h, kind) => rect(x, y, w, h, t.lg(kind === 'gold' ? ['#fff6c0', '#f6d070', '#dca848'] : ['#928ca4', '#66627a', '#4a465c'], 60), 0, 1);
// 47-blob 3/4 wall mass (same geometry as the Tomb Approach walls): the cap shows everywhere, a tile with no south neighbour also shows the 24px face; a missing diagonal notches the corner
export function wallBlob(name, kind, seed, tags) {
  const FH = 24, K = 12, ic = kind === 'gold' ? INKG : INKO, shd = kind === 'gold' ? '#b8864e' : '#14121a';
  for (const m of BLOBS) {
    const t = mkT('edges', name, pad3(m)), h = (b) => !!(m & b), nw = h(1) && h(64) && !h(128), ne = h(1) && h(4) && !h(2), capH = h(16) ? 64 : 64 - FH;
    const d = `M${nw ? K : 0} 0H${ne ? 64 - K : 64}${ne ? `V${K}H64` : ''}V64H0V${nw ? K : 0}${nw ? `H${K}V0` : ''}Z`, cl = t.clip(d), cc = t.clip(`M0 0H64V${capH}H0Z`);
    t.add(goldBase(13));
    t.add(`<g clip-path="${cl}">`, `<g clip-path="${cc}">`, cCap(t, 0, 0, 64, capH, kind), slabLines(seed), kind === 'gold' ? sunBand(t) : '', '</g>');
    if (!h(1)) t.add(line('M0 .8H64', ic, 1.8, .85), line('M0 3H64', '#fff', 1.2, .55));
    if (!h(64)) t.add(rect(0, 0, 3, capH, '#fff', 0, .4), line('M.8 0V64', ic, 1.8, .8));
    if (!h(4)) t.add(rect(57, 0, 7, capH, shd, 0, .4), line('M63.2 0V64', ic, 1.8, .8));
    if (!h(16)) {
      t.add(cFace(t, 0, 64, capH, 64, kind, seed + 1), line(`M0 ${capH}H64`, ic, 1.4, .85), line(`M0 ${capH - 1.2}H64`, '#fff', 1, .55));
      if (!h(64)) t.add(rect(0, capH, 3, FH, '#fff', 0, .3), line(`M.8 ${capH}V64`, ic, 1.8, .8));
      if (!h(4)) t.add(rect(58, capH, 6, FH, SHB, 0, .3), line(`M63.2 ${capH}V64`, ic, 1.8, .8));
    }
    t.add('</g>');
    if (nw) t.add(line(`M0 ${K}H${K}V0`, ic, 1.4, .8), rect(K, 0, 2, K, '#fff', 0, .4));
    if (ne) t.add(line(`M${64 - K} 0V${K}H64`, ic, 1.4, .8), rect(64 - K - 3, 0, 3, K, SHB, 0, .25));
    outT(t, 'edges', name, pad3(m), ['autotile', 'blob47', 'mask:' + m, '3/4-view', 'wall', 'obstacle', ...tags]);
  }
}
const sunBand = (t) => ''; // (cap stays plain; the sun reliefs live on the face)
