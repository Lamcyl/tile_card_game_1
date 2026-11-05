// Ashkara sub-area 7 Tomb Approach objects: trees (date palms, tamarisk, potted papyrus, lone acacia), rocks (fallen blocks, column drums, toppled heads, rubble, slabs, sand mounds),
// grass (dry scrub, thorn, papyrus, sedge) and props (braziers lit and unlit, papyrus/lotus/palm columns, sphinx and ram statues, Anubis, obelisks, steles, sarcophagi,
// canopic jars, offerings, scarab seals, banners, mummy cases and more). Runs on its own; helpers come from tomb-approach-lib.mjs.
import { T, rng, f, ell, circ, rect, path, line, ink, sh, pebbleD, tuft, blobPath, rockD, block, pts, frond, C, TALL, LG, tile, STN, STS, LAP, RED, TQ, GLD, BLK, LIN, WOODS, BONE, GRN, SHD, INKT, INKL, ik, GLYPH, glyphRow, frieze, lotus, column, bowl, hang, jarT, drift, stoneT, D } from './tomb-approach-lib.mjs';

const TR = (n, v, size, tags, fn) => tile('trees', n, v, size, [...tags, size === TALL ? 'tall' : 'one', 'obstacle'], fn);
const RK = (n, v, size, tags, fn) => tile('rocks', n, v, size, [...tags, size === TALL ? 'tall' : size === LG ? 'large' : 'one', 'obstacle'], fn);
const GR = (n, v, size, tags, fn) => tile('grass', n, v, size, [...tags, size === TALL ? 'tall' : 'one'], fn);
const PR = (n, v, size, tags, fn) => tile('props', n, v, size, [...tags, size === TALL ? 'tall' : size === LG ? 'large' : 'one'], fn);
const ikS = ink(INKT, 1, .85);
const sandBlock = (t, x, y, w, h, td = 5, ang = 60) => block(t, x, y, w, h, '#fbe6b4', STN, td, INKT);
const base = (t, cx, y, w = 24) => rect(cx - w / 2, y - 6, w, 6, t.lg(STN, 90), 1, 1, ik(.9)) + rect(cx - w / 2 + 3, y - 10, w - 6, 4.4, t.lg(STN, 90), 1, 1, ik(.8));

// ================= trees =================
const palm = (t, r, lean, n) => {
  const fy = 122; let o = sh(32, fy, 20, 5) + drift(t, 32, fy - 2, 18, 5);
  const tx = 34 + lean; o += path(`M27 ${fy - 2}Q29 ${fy - 40} ${tx - 3.4} 52L${tx + 3.4} 52Q35 ${fy - 40} 38 ${fy - 2}Z`, t.lg(['#d8b080', '#a88056', '#6a4a30'], 0), 1, ink('#3a2a20', 1, .85));
  for (let y = 56; y < fy - 6; y += 6) o += line(`M${f(30 + (y - 56) * .05 + lean * (1 - (y - 56) / 70) * .5)} ${y}q3 1.6 7 0`, '#6a4a30', 1, .55);
  const ang = n === 7 ? [-165, -135, -105, -75, -45, -15, 15] : [-160, -120, -80, -40, 0, 20];
  const fr = ang.map((a, i) => ({ a, i })).sort((p, q) => Math.abs(q.a + 90) - Math.abs(p.a + 90)); for (const { a } of fr) o += frond(tx, 50, a, 30, 12, D.palm, 4.6);
  o += [[-3, 4], [3, 5], [0, 7]].map(([dx, dy]) => ell(tx + dx, 54 + dy, 2.6, 3.4, '#a0501c', 1, 0, ink('#5a2a10', .6, .85)) + ell(tx + dx - .8, 53 + dy, .8, 1.2, '#e08a40', .8)).join('');
  return o;
};
TR('palm-date', 'a', TALL, ['palm', 'date', 'golden'], (t, r) => palm(t, r, -2, 7));
TR('palm-date', 'b', TALL, ['palm', 'date', 'golden'], (t, r) => palm(t, r, 3, 6));
const tamarisk = (t, r, v) => { const cx = 32, by = 54; let o = sh(cx, by, 18, 4) + drift(t, cx, by - 1, 16, 4); for (let i = 0; i < 5; i++) { const a = -90 + (i - 2) * 22 + v * 6; o += line(`M${cx + (i - 2) * 3} ${by - 2}Q${f(cx + (i - 2) * 6 + Math.cos(a * Math.PI / 180) * 8)} ${f(by - 18)} ${f(cx + Math.cos(a * Math.PI / 180) * 22)} ${f(by - 12 + Math.sin(a * Math.PI / 180) * 18 + 18)}`, '#6a4a30', 1.8, .95); } for (let i = 0; i < 26; i++) o += ell(cx + r.range(-18, 18), by - r.range(8, 34), r.range(2.6, 5), r.range(1.4, 2.4), r() < .5 ? '#a8bca0' : '#8aa488', .9, r.range(-40, 40)); for (let i = 0; i < 9; i++) o += circ(cx + r.range(-16, 16), by - r.range(10, 34), 1, i % 2 ? '#f4c8d0' : '#fff', .9); return o; };
TR('tamarisk-dry', 'a', C, ['tamarisk', 'shrub'], (t, r) => tamarisk(t, r, 0));
TR('tamarisk-dry', 'b', C, ['tamarisk', 'shrub'], (t, r) => tamarisk(t, r, 1));
const papyrusPot = (t, r, v) => {
  const cx = 32, by = 58; let o = sh(cx, by, 18, 4) + rect(cx - 16, by - 18, 32, 18, t.lg(STN, 60), 3, 1, ikS) + rect(cx - 17, by - 22, 34, 6, t.lg(['#fff0c4', '#f0d098', '#c89a62'], 90), 2, 1, ikS) + ell(cx, by - 22, 15, 3, '#3a3020', 1) + frieze(cx - 12, by - 14, 24, 6, 'lotus', [LAP, RED]).replace(/<rect[^>]*stroke[^>]*\/>/, '');
  for (let i = 0; i < 9; i++) { const a = (i - 4) * (v ? 11 : 9), x1 = cx + a * .9, top = 6 + Math.abs(i - 4) * 3; o += line(`M${cx + (i - 4) * 2} ${by - 22}Q${f(cx + a * .3)} ${by - 36} ${f(x1)} ${top + 6}`, GRN[1], 1.6, 1); o += [0, 1, 2, 3, 4, 5, 6].map(k => { const ang = (-170 + k * 30) * Math.PI / 180; return line(`M${f(x1)} ${top + 6}q${f(Math.cos(ang) * 6)} ${f(Math.sin(ang) * 4 - 2)} ${f(Math.cos(ang) * 11)} ${f(Math.sin(ang) * 8 + 4)}`, GRN[(k + i) % 2], 1, .9); }).join(''); }
  return o;
};
TR('papyrus-pot', 'a', C, ['papyrus', 'planter', 'interior'], (t, r) => papyrusPot(t, r, 0));
TR('papyrus-pot', 'b', C, ['papyrus', 'planter', 'interior'], (t, r) => papyrusPot(t, r, 1));
TR('acacia-lone', 'a', TALL, ['acacia', 'tree'], (t, r) => {
  const fy = 122; let o = sh(32, fy, 20, 5) + drift(t, 32, fy - 2, 16, 4.6);
  o += path(`M28 ${fy - 2}Q31 ${fy - 24} 30 ${fy - 44}Q22 ${fy - 54} 10 ${fy - 58}L12 ${fy - 62}Q26 ${fy - 58} 31 ${fy - 52}Q37 ${fy - 60} 52 ${fy - 62}L53 ${fy - 58}Q40 ${fy - 54} 35 ${fy - 44}Q36 ${fy - 24} 38 ${fy - 2}Z`, t.lg(['#b08a60', '#7a5a3a', '#4a3220'], 0), 1, ink('#2a1a10', 1, .85));
  for (const [cx, cy, rx, ry] of [[14, 62, 14, 7], [32, 54, 20, 8], [50, 62, 14, 7], [30, 68, 18, 5]]) o += ell(cx + 1, cy + 2, rx, ry, '#3a4a2a', .25) + ell(cx, cy, rx, ry, t.lg(['#d6dc8a', '#9ab35a', '#5f7f3a'], 80), 1, 0, ink('#2e4a2a', .8, .75)) + ell(cx - rx * .3, cy - ry * .35, rx * .5, ry * .35, '#eef0b0', .45);
  for (let i = 0; i < 12; i++) o += line(`M${f(r.range(6, 56))} ${f(r.range(54, 70))}l${f(r.range(-2, 2))} 3`, '#4a6a30', 1, .5);
  return o;
});

// ================= rocks =================
const rockT = (t, r, cx, cy, rx, ry, facets = 3) => rockD(t, r, cx, cy, rx, ry, ['#f9e3b0', '#e0b27e', '#a87a4c'], facets);
RK('sandstone-fallen', 'a', C, ['block', 'ruin'], (t, r) => drift(t, 32, 54, 24, 5) + sandBlock(t, 14, 30, 30, 22, 7) + line('M20 36H40M16 44H44', '#a87a4c', 1, .45) + sandBlock(t, 40, 42, 14, 10, 4));
RK('sandstone-fallen', 'b', C, ['block', 'ruin'], (t, r) => drift(t, 32, 54, 24, 5) + `<g transform="rotate(-12 32 40)">${sandBlock(t, 12, 26, 32, 20, 6)}</g>` + sandBlock(t, 38, 44, 16, 9, 4) + pebbleD(12, 54, 1.1, STN));
RK('sandstone-fallen', 'c', C, ['boulder', 'rock'], (t, r) => rockT(t, r, 32, 38, 22, 15, 4) + pebbleD(12, 54, 1.2, STN) + pebbleD(52, 52, 1, STN));
const drum = (t, cx, cy, len, ang, band) => `<g transform="rotate(${ang} ${cx} ${cy})">` + ell(cx + 2, cy + 8, len * .56, 4, '#3b2a24', .2) + rect(cx - len / 2, cy - 9, len, 18, t.lg(['#fff0c4', '#e6bd7e', '#b8864e', '#8a603c'], 90), 2, 1, ikS) + ell(cx + len / 2, cy, 4, 9, '#f2d49c', 1, 0, ikS) + ell(cx + len / 2, cy, 2, 5, '#dcae78', 1) + [-.3, .1].map(k => rect(cx + k * len - 1.5, cy - 9, 3, 18, band[1], 0, .9)).join('') + rect(cx - len / 2 + 1, cy - 7, 3, 14, SHD, 0, .0) + `</g>`;
RK('column-drum', 'a', C, ['column', 'ruin', 'painted'], (t) => drift(t, 32, 54, 24, 4) + drum(t, 30, 38, 34, -8, LAP) + circ(50, 48, 3, '#f0d098', 1, ik(.7)));
RK('column-drum', 'b', C, ['column', 'ruin', 'painted'], (t) => drift(t, 32, 54, 24, 4) + drum(t, 32, 40, 38, 6, RED) + sandBlock(t, 8, 50, 14, 7, 3));
const head = (t, r, flip) => {
  let o = drift(t, 32, 54, 26, 5) + sh(32, 54, 22, 4); const s = flip ? -1 : 1, X = (x) => 32 + s * x;
  o += path(`M${X(-18)} 50Q${X(-22)} 30 ${X(-8)} 18Q${X(6)} 12 ${X(16)} 22Q${X(22)} 34 ${X(18)} 50Z`, t.lg(['#fff0c4', '#dcae78', '#a87a4c'], 40), 1, ikS);
  o += path(`M${X(-18)} 50Q${X(-24)} 34 ${X(-10)} 18L${X(-4)} 16L${X(-8)} 50Z`, LAP[1], .9) + path(`M${X(-12)} 46L${X(-14)} 22L${X(-10)} 19L${X(-8)} 46Z`, GLD[1], .8);
  o += ell(X(8), 36, 9, 12, '#e8c08a', 1, 0, ik(.7)) + path(`M${X(2)} 30Q${X(7)} 28 ${X(12)} 30M${X(2)} 38Q${X(7)} 36 ${X(12)} 38`, 'none', 1, { stroke: INKT, 'stroke-width': 1.2 }) + path(`M${X(7)} 36L${X(5)} 42H${X(9)}`, 'none', 1, { stroke: INKT, 'stroke-width': 1 }) + line(`M${X(3)} 46Q${X(8)} 48 ${X(13)} 46`, INKT, 1, .8) + line(`M${X(0)} 25H${X(14)}`, GLD[1], 2, .9) + path(`M${X(-8)} 50L${X(-4)} 40L${X(2)} 48L${X(6)} 42L${X(14)} 50Z`, '#c89a62', .0);
  return o + line(`M${X(14)} 26l-3 8l3 8`, '#6a4a30', 1.1, .5);
};
RK('toppled-head', 'a', C, ['statue', 'head', 'ruin'], (t, r) => head(t, r, false));
RK('toppled-head', 'b', C, ['statue', 'head', 'ruin'], (t, r) => head(t, r, true));
RK('rubble-pile', 'a', C, ['rubble', 'ruin'], (t, r) => drift(t, 32, 52, 26, 6) + pts(r, 8, 12, 9).map(([x, y]) => pebbleD(x, y * .5 + 26, r.range(1, 1.7), STN)).join('') + sandBlock(t, 24, 28, 14, 9, 4));
RK('rubble-pile', 'b', C, ['rubble', 'ruin'], (t, r) => drift(t, 32, 52, 26, 6) + pts(r, 9, 11, 8).map(([x, y]) => pebbleD(x, y * .55 + 24, r.range(.9, 1.5), STN)).join('') + `<g transform="rotate(14 20 40)">${sandBlock(t, 10, 34, 16, 9, 4)}</g>`);
const slabB = (t, v) => drift(t, 32, 54, 26, 5) + `<g transform="rotate(${v ? 16 : -14} 32 36)">` + path('M10 40L18 24H48L54 40Z', '#fbe6b4', 1, ikS) + rect(10, 40, 44, 8, t.lg(STN, 90), 0, 1, ikS) + glyphRow(14, 50, 44, 77 + v, '#7a5238', .5, 8) + `</g>` + path('M44 30L50 24L46 26Z', '#fff', .0);
RK('slab-broken', 'a', C, ['slab', 'ruin'], (t) => slabB(t, 0));
RK('slab-broken', 'b', C, ['slab', 'ruin'], (t) => slabB(t, 1));
RK('sand-mound', 'a', C, ['sand', 'drift'], (t) => drift(t, 32, 44, 26, 12) + ell(26, 38, 12, 3, '#fff', .35));
RK('sand-mound', 'b', C, ['sand', 'drift'], (t, r) => drift(t, 24, 46, 20, 10) + drift(t, 44, 50, 16, 7) + pebbleD(50, 40, 1, STN));

// ================= grass =================
const scrub = (t, r, n, col) => { let o = sh(32, 54, 14, 3.4) + drift(t, 32, 53, 14, 3.4); for (let i = 0; i < n; i++) { const x = 32 + r.range(-12, 12), h = r.range(12, 26); o += line(`M${f(x)} 54Q${f(x + r.range(-4, 4))} ${f(54 - h * .6)} ${f(x + r.range(-9, 9))} ${f(54 - h)}`, col[i % 3], 1.5, .95); } return o; };
GR('scrub-dry', 'a', C, ['scrub'], (t, r) => scrub(t, r, 11, ['#b0a060', '#8a8048', '#cdbf80']));
GR('scrub-dry', 'b', C, ['scrub'], (t, r) => scrub(t, r, 15, ['#a89a58', '#c4b476', '#7a7040']));
const thorn = (t, r, v) => { let o = sh(32, 52, 16, 3.6) + drift(t, 32, 51, 14, 3.4); for (let i = 0; i < 7; i++) { const a = -150 + i * 20 + v * 8, L = r.range(14, 22); const ex = 32 + Math.cos(a * Math.PI / 180) * L, ey = 50 + Math.sin(a * Math.PI / 180) * L; o += line(`M32 50Q${f((32 + ex) / 2)} ${f(ey + 8)} ${f(ex)} ${f(ey)}`, '#6a4a30', 1.6, 1) + line(`M${f(ex)} ${f(ey)}l3 -2M${f(ex)} ${f(ey)}l-3 -3`, '#6a4a30', 1, .9) + circ(ex, ey, 1.2, '#8aa04a'); } for (let i = 0; i < 6; i++) o += ell(32 + r.range(-12, 12), 38 + r.range(-8, 8), 3, 1.6, '#8aa04a', .9, r.range(-30, 30)); return o; };
GR('thorn-bush', 'a', C, ['thorn'], (t, r) => thorn(t, r, 0));
GR('thorn-bush', 'b', C, ['thorn'], (t, r) => thorn(t, r, 1));
GR('papyrus-dry', 'a', TALL, ['papyrus', 'reeds'], (t, r) => { let o = sh(32, 118, 14, 3.4); for (let i = 0; i < 10; i++) { const x = 32 + (i - 5) * 3, top = 40 + Math.abs(i - 5) * 6 + r.range(0, 8); o += line(`M${x} 118Q${f(x + (i - 5) * 1.6)} ${f(80)} ${f(x + (i - 5) * 3)} ${f(top)}`, i % 2 ? '#b8a45c' : '#8a7a40', 1.8, 1) + ell(x + (i - 5) * 3, top, 3.4, 1.8, '#a89a50', .95); } return o; });
GR('sedge-sand', 'a', C, ['sedge'], (t, r) => drift(t, 32, 52, 18, 5) + [-9, -4, 0, 5, 10].map((dx, i) => tuft(32 + dx, 52, ['#a8a460', '#c8c07c'][i % 2], .95, 1.3)).join(''));
GR('sedge-sand', 'b', C, ['sedge'], (t, r) => drift(t, 32, 50, 22, 6) + [-14, -7, 0, 8, 15].map((dx, i) => tuft(32 + dx, 50 + (i % 2) * 3, ['#9a9858', '#c0b878'][i % 2], .95, 1.1)).join(''));
GR('weeds-joint', 'a', C, ['weeds'], (t, r) => [[14, 50], [26, 44], [40, 50], [52, 42]].map(([x, y], i) => tuft(x, y, '#8a9a50', .9, .9)).join('') + circ(40, 38, 1.4, '#f4c8d0'));

// ================= props =================
PR('brazier-bowl', 'a', C, ['brazier', 'fire', 'lit', 'light'], (t) => bowl(t, 32, 56, 12, true));
PR('brazier-bowl', 'b', C, ['brazier', 'unlit'], (t) => bowl(t, 32, 56, 12, false));
const pillarBraz = (t, lit) => { const fy = 120; let o = sh(32, fy, 16, 4) + rect(16, fy - 8, 32, 8, t.lg(STN, 90), 1, 1, ik()) + rect(21, fy - 14, 22, 7, t.lg(STN, 90), 1, 1, ik(.9)) + rect(25, fy - 56, 14, 44, t.lg(['#fff0c4', '#e6bd7e', '#a87a4c'], 0), 0, 1, ik()) + rect(25, fy - 30, 14, 3, LAP[1], 0, .9) + rect(25, fy - 26, 14, 2, GLD[1], 0, .9) + GLYPH.ankh(32, fy - 42, RED[2], 1.3) + rect(23, fy - 58, 18, 4, t.lg(STN, 90), 1, 1, ik(.9)); return o + bowl(t, 32, fy - 56, 15, lit, 8); };
PR('brazier-pillar', 'a', TALL, ['brazier', 'fire', 'lit', 'light', 'pillar'], (t) => pillarBraz(t, true));
PR('brazier-pillar', 'b', TALL, ['brazier', 'unlit', 'pillar'], (t) => pillarBraz(t, false));
for (const [v, k] of [['a', 'bud'], ['b', 'open']]) PR('column-papyrus', v, TALL, ['column', 'papyrus', 'painted', 'interior', 'obstacle'], (t) => column(t, 32, 122, 66, k, 10));
PR('column-lotus', 'a', TALL, ['column', 'lotus', 'painted', 'interior', 'obstacle'], (t) => column(t, 32, 122, 62, 'lotus', 10));
PR('column-palm', 'a', TALL, ['column', 'palm', 'painted', 'interior', 'obstacle'], (t) => column(t, 32, 122, 62, 'palm', 9));
PR('column-plain', 'a', TALL, ['column', 'plain', 'interior', 'obstacle'], (t) => column(t, 32, 122, 70, 'plain', 11));
PR('column-broken', 'a', C, ['column', 'ruin', 'obstacle'], (t) => drift(t, 32, 56, 22, 4) + column(t, 32, 58, 0, 'broken', 11));
PR('column-broken', 'b', C, ['column', 'ruin', 'obstacle'], (t) => drift(t, 32, 56, 22, 4) + column(t, 28, 58, 0, 'broken', 9) + pebbleD(48, 54, 1.4, STN));
// sphinx (side view, facing right or left) on a plinth
const sphinx = (t, flip) => {
  const X = (x) => flip ? 64 - x : x; let o = sh(32, 58, 28, 4);
  o += path(`M${X(4)} 56V48H${X(60)}V56Z`, t.lg(STN, 90), 1, ikS) + path(`M${X(4)} 48L${X(8)} 45H${X(64)}L${X(60)} 48Z`, '#fbe6b4', 1, ik(.8)) + line(`M${X(12)} 52H${X(52)}`, LAP[1], 1.4, .8);
  o += path(`M${X(8)} 46Q${X(6)} 34 ${X(16)} 30Q${X(28)} 26 ${X(38)} 32L${X(42)} 46Z`, t.lg(['#fff0c4', '#dcae78', '#a87a4c'], flip ? 140 : 40), 1, ikS) + ell(X(18), 38, 7, 8, '#e6bd7e', .8) + path(`M${X(36)} 46V40H${X(60)}V46Z`, t.lg(['#f6dca4', '#dcae78', '#b8864e'], 90), 1, ikS) + line(`M${X(52)} 46v-6M${X(56)} 46v-6`, '#a87a4c', .9, .7);
  o += path(`M${X(36)} 40L${X(36)} 18Q${X(36)} 8 ${X(46)} 8Q${X(56)} 8 ${X(56)} 18L${X(58)} 40Z`, t.lg(['#7c9cf0', '#3558c0', '#1e3482'], flip ? 140 : 40), 1, ink(INKL, 1, .85));
  for (let i = 0; i < 5; i++) o += line(`M${X(37)} ${14 + i * 5.4}H${X(57)}`, GLD[1], 1.2, .8);
  o += ell(X(48), 22, 5.4, 7.4, '#ecc08a', 1, 0, ik(.7)) + circ(X(50.4), 20, .9, '#2a1a10') + line(`M${X(47)} 26q${flip ? -2 : 2} 2 ${flip ? -4 : 4} 0`, INKT, 1, .8) + path(`M${X(46)} 29v6h${flip ? -3 : 3}z`, LAP[2], 1) + path(`M${X(42)} 8Q${X(46)} 2 ${X(50)} 8Z`, RED[1], .0) + path(`M${X(46)} 9Q${X(46)} 3 ${X(47)} 3Q${X(48)} 3 ${X(48)} 9Z`, GLD[1], 1, ink(GLD[2], .6, .9));
  return o;
};
PR('statue-sphinx', 'a', C, ['sphinx', 'statue', 'avenue', 'obstacle'], (t) => sphinx(t, false));
PR('statue-sphinx', 'b', C, ['sphinx', 'statue', 'avenue', 'obstacle'], (t) => sphinx(t, true));
// ram (crioshinx): a crouching ram with a sun disc between its horns, on a plinth
const ram = (t, flip) => {
  const X = (x) => flip ? 64 - x : x; let o = sh(32, 58, 24, 4);
  o += path(`M${X(8)} 56V47H${X(56)}V56Z`, t.lg(STN, 90), 1, ikS) + path(`M${X(8)} 47L${X(12)} 44H${X(60)}L${X(56)} 47Z`, '#fbe6b4', 1, ik(.8));
  o += path(`M${X(14)} 45Q${X(10)} 30 ${X(22)} 27Q${X(38)} 24 ${X(44)} 34L${X(46)} 45Z`, t.lg(['#fff0c4', '#dcae78', '#a87a4c'], flip ? 140 : 40), 1, ikS) + ell(X(24), 36, 8, 8, '#e6bd7e', .8);
  o += path(`M${X(38)} 34Q${X(36)} 22 ${X(44)} 20Q${X(54)} 20 ${X(54)} 30L${X(50)} 40H${X(40)}Z`, t.lg(['#fff0c4', '#dcae78', '#a87a4c'], 60), 1, ikS) + path(`M${X(40)} 24Q${X(34)} 22 ${X(34)} 30Q${X(36)} 36 ${X(42)} 32`, 'none', 1, { stroke: '#a87a4c', 'stroke-width': 3.4, 'stroke-linecap': 'round' }) + path(`M${X(40)} 24Q${X(34)} 22 ${X(34)} 30Q${X(36)} 36 ${X(42)} 32`, 'none', 1, { stroke: '#f6dca4', 'stroke-width': 1.4 });
  o += circ(X(47), 28, 1, '#2a1a10') + circ(X(54), 33, 1, '#6a4a30') + circ(X(44), 14, 5, GLD[1], 1, ink(GLD[2], .8, .9)) + circ(X(44), 14, 2.4, RED[1]) + line(`M${X(16)} 42H${X(40)}`, LAP[1], 2, .9) + path(`M${X(46)} 40L${X(46)} 44`, 'none', 1, ik());
  return o;
};
PR('statue-ram', 'a', C, ['ram', 'statue', 'avenue', 'obstacle'], (t) => ram(t, false));
PR('statue-ram', 'b', C, ['ram', 'statue', 'avenue', 'obstacle'], (t) => ram(t, true));
// Anubis: black jackal-headed guardian with gold collar, on a plinth
const anubis = (t, v) => {
  const fy = 120; let o = sh(32, fy, 20, 4) + rect(14, fy - 14, 36, 14, t.lg(STN, 90), 1, 1, ikS) + frieze(18, fy - 11, 28, 5, 'checker', [LAP, RED]).replace(/<rect[^>]*stroke[^>]*\/>/, '') + rect(18, fy - 18, 28, 5, t.lg(STN, 90), 1, 1, ik(.9));
  o += path(`M22 ${fy - 18}L24 ${fy - 54}H40L42 ${fy - 18}Z`, t.lg(['#7a7488', '#4a4654', '#221f2a'], 0), 1, ink('#0c0a10', 1, .9)) + path('M22 ' + (fy - 18) + 'L24 ' + (fy - 34) + 'H40L42 ' + (fy - 18) + 'Z', '#f4f0e0', .92) + line(`M24 ${fy - 34}H40`, GLD[1], 1.6) + path(`M23 ${fy - 52}Q32 ${fy - 44} 41 ${fy - 52}L40 ${fy - 46}Q32 ${fy - 38} 24 ${fy - 46}Z`, GLD[1], 1, ink(GLD[2], .8, .9)) + circ(32, fy - 47, 1.4, TQ[1]);
  o += path(`M26 ${fy - 52}Q24 ${fy - 66} 30 ${fy - 74}L36 ${fy - 74}Q40 ${fy - 66} 38 ${fy - 52}Z`, t.lg(BLK, 0), 1, ink('#0c0a10', 1, .9)) + path(`M30 ${fy - 70}L${v ? 18 : 22} ${fy - 66}L${v ? 18 : 22} ${fy - 62}L30 ${fy - 64}Z`, t.lg(BLK, 0), 1, ink('#0c0a10', .9, .9)) + path(`M29 ${fy - 74}L25 ${fy - 92}L33 ${fy - 76}Z M35 ${fy - 74}L39 ${fy - 92}L35 ${fy - 74}Z`, BLK[1], 1, ink('#0c0a10', .8, .9)) + path(`M36 ${fy - 74}L41 ${fy - 90}L40 ${fy - 74}Z`, BLK[1], 1) + circ(33, fy - 68, 1.1, GLD[1]) + line(`M27 ${fy - 62}Q30 ${fy - 60} 33 ${fy - 62}`, GLD[1], 1, .8);
  o += line(`M46 ${fy - 20}V${fy - 62}`, GLD[2], 1.8, 1) + path(`M44 ${fy - 62}Q46 ${fy - 68} 48 ${fy - 62}`, 'none', 1, { stroke: GLD[1], 'stroke-width': 1.6 }) + line(`M24 ${fy - 50}L18 ${fy - 34}M40 ${fy - 50}L46 ${fy - 40}`, BLK[1], 3.2, 1);
  return o + rect(23, fy - 2, 18, 0, '#000', 0, 0);
};
PR('statue-anubis', 'a', TALL, ['anubis', 'statue', 'guardian', 'obstacle'], (t) => anubis(t, 0));
PR('statue-anubis', 'b', TALL, ['anubis', 'statue', 'guardian', 'obstacle'], (t) => anubis(t, 1));
const obelisk = (t, v) => { const fy = 120; let o = sh(32, fy, 18, 4) + rect(16, fy - 8, 32, 8, t.lg(STN, 90), 1, 1, ik()) + rect(20, fy - 14, 24, 7, t.lg(STN, 90), 1, 1, ik(.9)); const d = `M23 ${fy - 14}L27 ${v ? 30 : 24}H37L41 ${fy - 14}Z`, c = t.clip(d); o += `<path d="${d}" fill="${t.lg(['#fff0c4', '#e6bd7e', '#a87a4c'], 0)}"/><g clip-path="${c}">${glyphRow(26, 38, 50, 90 + v, INKL, .6, 8, ['ankh', 'feather', 'eye', 'was'])}${[0, 1, 2, 3].map(i => GLYPH[['eye', 'ankh', 'bird', 'feather'][(i + v) % 4]](32, 46 + i * 15, RED[2], .8)).join('')}<path d="M37 ${v ? 30 : 24}L41 ${fy - 14}H32Z" fill="${SHD}" opacity=".22"/></g>` + path(d, 'none', 1, ikS); const ty = v ? 30 : 24; o += path(`M27 ${ty}L32 ${ty - 14}L37 ${ty}Z`, GLD[1], 1, ink(GLD[2], .9, .9)) + path(`M27 ${ty}L32 ${ty - 14}L30 ${ty}Z`, GLD[0], .8) + line(`M32 ${ty - 14}V${ty - 20}`, GLD[0], 0); return o; };
PR('obelisk-small', 'a', TALL, ['obelisk', 'monument', 'obstacle'], (t) => obelisk(t, 0));
PR('obelisk-small', 'b', TALL, ['obelisk', 'monument', 'obstacle'], (t) => obelisk(t, 1));
// painted stele: arched slab with a winged sun and an offering scene
const stele = (t, v) => { const fy = 120; let o = sh(32, fy, 18, 4) + rect(14, fy - 8, 36, 8, t.lg(STN, 90), 1, 1, ik()); const d = `M18 ${fy - 8}V50Q18 28 32 28Q46 28 46 50V${fy - 8}Z`, c = t.clip(d); o += `<path d="${d}" fill="${t.lg(['#f9e3b0', '#e6bd7e', '#b8864e'], 0)}"/><g clip-path="${c}">${rect(18, 30, 28, 90, '#f4e2b4', 0, .5)}${path('M20 42Q26 34 32 38Q38 34 44 42Q38 40 32 42Q26 40 20 42Z', LAP[1], 1, ink(LAP[2], .6, .9))}${circ(32, 40, 3, v ? RED[1] : GLD[1], 1, ink(RED[2], .6, .9))}${glyphRow(19, 45, 52, 95 + v, INKL, .6, 8)}${GLYPH.man(26, 70, RED[2], 1.4)}${GLYPH.man(38, 70, LAP[2], 1.4)}${line(`M22 ${fy - 40}H42`, GLD[1], 1.4, .9)}${glyphRow(19, 45, 88, 99 + v, INKL, .6, 8)}${glyphRow(19, 45, 100, 103 + v, RED[2], .6, 8)}<path d="M40 28H46V${fy - 8}H38Z" fill="${SHD}" opacity=".2"/></g>` + path(d, 'none', 1, ikS); return o; };
PR('stele-painted', 'a', TALL, ['stele', 'painted', 'monument', 'obstacle'], (t) => stele(t, 0));
PR('stele-painted', 'b', TALL, ['stele', 'painted', 'monument', 'obstacle'], (t) => stele(t, 1));
// sarcophagus (3/4 view, head to the left): closed painted lapis lid, open with a wrapped mummy, plain granite
const sarc = (t, v) => {
  let o = sh(34, 54, 28, 4);
  const lid = v === 'c' ? t.lg(BLK, 60) : t.lg(['#7c9cf0', '#3558c0', '#1e3482'], 60), fac = v === 'c' ? t.lg(['#6a6474', '#4a4654', '#221f2a'], 90) : t.lg(STN, 90);
  o += path('M6 46L10 38H54L60 46V54H6Z', fac, 1, ikS) + path('M6 46H60', 'none', 1, ik(.8));
  if (v === 'b') {
    o += path('M10 38L14 28H52L58 38Z', '#1a1418', 1, ikS) + path('M14 36L18 30H48L52 36Z', LIN[1], 1, ik(.6)) + [0, 1, 2, 3, 4].map(i => line(`M${20 + i * 6} 31L${18 + i * 6} 35`, LIN[2], 1, .7)).join('') + circ(18, 33, 3, LIN[0], 1, ik(.6)) + path('M12 22L16 12H56L60 22V30L56 30L12 30Z', lid, 1, ink(INKL, 1, .85)) + rect(0, 0, 0, 0, '#000', 0, 0);
    return o + `<g transform="translate(10 -4)">${path('M0 36L4 26H42L48 36Z', 'none', 1, { stroke: 'none' })}</g>` + path('M16 16L50 16', 'none', 1, { stroke: GLD[1], 'stroke-width': 1.4 });
  }
  o += path('M10 38L14 28H52L58 38Z', lid, 1, ink(v === 'c' ? '#0c0a10' : INKL, 1, .85)) + path('M14 28H52L50 31H16Z', '#fff', .25);
  if (v === 'a') o += ell(20, 33, 5, 4.4, GLD[1], 1, 0, ink(GLD[2], .8, .9)) + path('M16 30H24L25 37H15Z', LAP[2], .8) + glyphRow(28, 54, 33, 111, GLD[0], .6, 7, ['ankh', 'feather', 'eye', 'wave']) + line('M26 30V37', GLD[1], 1.2, .8) + line('M12 34H58', RED[1], 1, .0);
  else o += glyphRow(18, 54, 33, 113, '#c8c2d2', .6, 8, ['ankh', 'feather', 'eye', 'wave']) + line('M12 38H56', GLD[1], 1, .6);
  return o + frieze(10, 47, 46, 5, 'checker', [LAP, RED, GLD]).replace(/<rect[^>]*stroke[^>]*\/>/, '');
};
PR('sarcophagus', 'a', C, ['sarcophagus', 'tomb', 'obstacle'], (t) => sarc(t, 'a'));
PR('sarcophagus', 'b', C, ['sarcophagus', 'tomb', 'open', 'obstacle'], (t) => sarc(t, 'b'));
PR('sarcophagus', 'c', C, ['sarcophagus', 'tomb', 'obstacle'], (t) => sarc(t, 'c'));
// canopic jars: four lidded jars (human, ape, jackal, falcon), set on a low stone stand
const canopic = (t, v) => { let o = sh(32, 56, 26, 3.4) + rect(4, 46, 56, 9, t.lg(STN, 90), 1, 1, ikS) + rect(2, 43, 60, 4, t.lg(['#fff0c4', '#e6bd7e', '#c89a62'], 90), 1, 1, ik(.8)); [14, 26, 38, 50].forEach((x, i) => { const hd = [['#ecc08a'], ['#c8a070'], ['#4a4654'], ['#c89a62']][(i + v) % 4][0]; o += path(`M${x - 5} 43Q${x - 7} 30 ${x - 4} 22H${x + 4}Q${x + 7} 30 ${x + 5} 43Z`, t.lg(['#fff8e6', '#e8d4b0', '#b89a70'], 0), 1, ik(.8)) + path(`M${x - 4} 22Q${x - 5} 12 ${x} 11Q${x + 5} 12 ${x + 4} 22Z`, hd, 1, ik(.8)) + rect(x - 5, 29, 10, 2, [LAP, RED, TQ, GLD][i][1], 0, .9) + circ(x - 1.4, 17, .7, '#2a1a10') + circ(x + 1.4, 17, .7, '#2a1a10') + (i === 2 ? path(`M${x - 4} 12L${x - 5} 5L${x - 1} 11ZM${x + 4} 12L${x + 5} 5L${x + 1} 11Z`, hd, 1, ik(.6)) : '') + (i === 3 ? path(`M${x - 1} 18L${x + 2} 20L${x - 1} 22Z`, GLD[2], 1) : '') + line(`M${x - 4} 36q4 2 8 0`, INKL, .8, .5); }); return o; };
PR('canopic-jars', 'a', C, ['canopic', 'tomb', 'jars'], (t) => canopic(t, 0));
PR('canopic-jars', 'b', C, ['canopic', 'tomb', 'jars'], (t) => canopic(t, 1));
PR('offering-table', 'a', C, ['offering', 'table', 'altar'], (t) => { let o = sh(32, 56, 24, 4) + rect(10, 36, 44, 7, t.lg(STN, 90), 1, 1, ikS) + path('M10 36L16 30H48L54 36Z', '#fbe6b4', 1, ik(.8)) + rect(14, 43, 6, 12, t.lg(STN, 0), 0, 1, ik(.8)) + rect(44, 43, 6, 12, t.lg(STN, 0), 0, 1, ik(.8)); o += ell(24, 31, 6, 2, '#e8d4b0', 1, 0, ik(.6)) + ell(24, 29, 5, 2.4, '#c03a30', 1) + ell(38, 31, 5, 2, '#a07a30', 1, 0, ik(.6)) + ell(38, 29, 4.4, 2, '#e8c050', 1) + path('M44 30Q46 24 49 30Z', '#e07a50', 1, ik(.6)) + lotus(32, 28, 1.2, TQ); return o; });
PR('offering-bowls', 'a', C, ['offering', 'bowls'], (t) => [[20, 44], [38, 40], [30, 52], [46, 52]].map(([x, y], i) => ell(x + 1, y + 2, 8, 2.4, '#3b2a24', .2) + path(`M${x - 8} ${y - 4}H${x + 8}Q${x + 7} ${y + 2} ${x} ${y + 3}Q${x - 7} ${y + 2} ${x - 8} ${y - 4}Z`, t.lg(['#f0d098', '#c8985c', '#8a6238'], 90), 1, ik(.8)) + ell(x, y - 4, 8, 2.4, ['#c03a30', '#e8c050', '#f6e8c4', '#3fb0ac'][i], 1, 0, ik(.5))).join(''));
PR('incense-burner', 'a', C, ['incense', 'smoke'], (t) => sh(32, 56, 14, 3.4) + path('M22 56L26 46H38L42 56Z', t.lg(BLK, 0), 1, ink('#0c0a10', .9, .9)) + path('M20 38Q20 46 32 48Q44 46 44 38Z', t.lg(['#d0a050', '#8a6226', '#4a3410'], 20), 1, ink('#2a1c08', .9, .9)) + ell(32, 38, 12, 3, '#3a2a20', 1, 0, ink('#2a1c08', .8, .9)) + circ(28, 37, 1.5, '#ff7a2a') + circ(36, 38, 1.2, '#ffb040') + [[30, 28, 5], [34, 20, 4], [30, 12, 5], [35, 5, 4]].map(([x, y, r], i) => circ(x, y, r, '#e8e0dc', .5 - i * .07)).join(''));
PR('urn-tall', 'a', C, ['urn', 'jar', 'painted'], (t) => jarT(t, 32, 54, 2.2, ['#f6dca4', '#d29a60', '#8a5a34']) + line('M20 36q12 3 24 0', RED[1], 2, .8));
// scarab seal: a round stone disc set into the floor, sealed with a scarab (intact) or split (broken)
for (const [v, br] of [['a', false], ['b', true]]) PR('seal-scarab', v, C, ['scarab', 'seal', 'door', br ? 'broken' : 'sealed'], (t) => { let o = ell(33, 38, 25, 17, '#3b2a24', .22) + ell(32, 36, 24, 16, t.lg(STN, 60), 1, 0, ikS) + ell(32, 35, 19, 12, '#f4dcaa', 1, 0, ik(.7)) + ell(32, 35, 14, 9, '#f8ecc8', .8); o += GLYPH.scarab(32, 35, LAP[1], 2.5) + line('M16 35H8M48 35H56', GLD[1], 2.4, .9) + [0, 1, 2, 3, 4, 5].map(i => line(`M${f(32 + Math.cos(i * 1.05) * 20)} ${f(35 + Math.sin(i * 1.05) * 13)}l1 0`, RED[1], 2, .9)).join(''); if (br) o += line('M22 26L32 34L28 42L36 48', '#3a2a20', 1.6, .85) + line('M32 34L44 30', '#3a2a20', 1.3, .8) + path('M30 42L40 38L38 46Z', '#1a1418', .55); return o; });
for (const [v, c] of [['a', LAP], ['b', RED]]) PR('banner-pole', v, TALL, ['banner', 'pole', 'cloth'], (t) => { const fy = 120; let o = sh(32, fy, 12, 3.4) + rect(24, fy - 6, 16, 6, t.lg(STN, 90), 1, 1, ik(.9)) + rect(30, 14, 4, fy - 20, t.lg(WOODS, 0), .6, 1, ink('#3b2a1a', .6, .85)) + circ(32, 12, 3.4, GLD[1], 1, ink(GLD[2], .8, .9)); o += path('M34 20H58V70L46 62L34 70Z', t.lg(c, 90), 1, ink(c[2], 1, .9)) + path('M34 20H44V66L34 70Z', '#fff', .14) + GLYPH[v === 'a' ? 'sun' : 'ankh'](46, 38, GLD[1], 1.8) + line('M38 28H54', GLD[1], 1.4, .9) + line('M38 54H54', GLD[1], 1.4, .8) + path('M32 20H20L24 32L20 44L32 40Z', t.lg(c, 90), 1, ink(c[2], 1, .9)); return o; });
// mummy case: an upright painted anthropoid coffin
const mummy = (t, v) => { const fy = 120; let o = sh(32, fy, 14, 3.4); const d = `M22 ${fy}L20 ${fy - 50}Q18 ${fy - 70} 24 ${fy - 80}Q32 ${fy - 92} 40 ${fy - 80}Q46 ${fy - 70} 44 ${fy - 50}L42 ${fy}Z`, c = t.clip(d); o += `<path d="${d}" fill="${t.lg(v ? ['#f9e3b0', '#e0b27e', '#a87a4c'] : ['#7c9cf0', '#3558c0', '#1e3482'], 0)}"/><g clip-path="${c}">`; o += rect(20, fy - 74, 24, 12, GLD[1], 0, .0) + path(`M24 ${fy - 66}Q32 ${fy - 60} 40 ${fy - 66}L40 ${fy - 54}Q32 ${fy - 48} 24 ${fy - 54}Z`, GLD[1], 1, ink(GLD[2], .8, .9)) + frieze(20, fy - 44, 24, 5, 'checker', [RED, GLD]).replace(/<rect[^>]*stroke[^>]*\/>/, '') + glyphRow(21, 43, fy - 32, 120 + v, v ? INKL : GLD[0], .6, 7) + glyphRow(21, 43, fy - 20, 122 + v, v ? RED[2] : GLD[0], .6, 7) + rect(40, fy - 90, 8, 100, SHD, 0, .22) + '</g>' + path(d, 'none', 1, ink(v ? INKT : INKL, 1.1, .9)); o += ell(32, fy - 76, 6.4, 8, '#ecc08a', 1, 0, ik(.7)) + circ(29.4, fy - 77, 1.1, '#2a1a10') + circ(34.6, fy - 77, 1.1, '#2a1a10') + line(`M29.6 ${fy - 72}q2.4 1.4 4.8 0`, INKT, 1, .8) + path(`M24 ${fy - 80}Q32 ${fy - 94} 40 ${fy - 80}L38 ${fy - 74}Q32 ${fy - 82} 26 ${fy - 74}Z`, v ? LAP[1] : GLD[1], 1, ink(v ? INKL : GLD[2], .8, .9)); return o; };
PR('mummy-case', 'a', TALL, ['mummy', 'coffin', 'tomb', 'obstacle'], (t) => mummy(t, 0));
PR('mummy-case', 'b', TALL, ['mummy', 'coffin', 'tomb', 'obstacle'], (t) => mummy(t, 1));
PR('treasure-heap', 'a', C, ['treasure', 'gold', 'loot'], (t, r) => { let o = sh(32, 54, 24, 4) + ell(32, 48, 22, 8, t.lg(['#fff0a8', '#f3c24f', '#b8862a'], 90), 1, 0, ik(.7)); for (let i = 0; i < 20; i++) o += ell(32 + r.range(-18, 18), 44 + r.range(-8, 3), 2.6, 1.8, i % 5 ? GLD[0] : '#fff', .95, 0, ink(GLD[2], .4, .8)); o += circ(40, 36, 3, LAP[1], 1, ink(LAP[2], .6, .9)) + circ(22, 40, 2.4, RED[1], 1, ink(RED[2], .6, .9)) + circ(30, 32, 2.2, TQ[1], 1, ink(TQ[2], .6, .9)) + path('M14 42Q26 30 40 42', 'none', 1, { stroke: GLD[1], 'stroke-width': 1.4, 'stroke-opacity': .9 }); return o; });
PR('papyrus-scrolls', 'a', C, ['scrolls', 'papyrus', 'loot'], (t) => [[18, 46, -10], [30, 40, 8], [44, 46, 90]].map(([x, y, a]) => `<g transform="translate(${x} ${y}) rotate(${a})">` + ell(1.2, 2.6, 13, 3, '#3b2a24', .16) + rect(-11, -3.4, 22, 6.8, t.lg(['#fff6dc', '#ecd8a8', '#c8aa70'], 90), 3, 1, ik(.7)) + ell(11, 0, 1.6, 3.4, '#c8aa70', 1, 0, ik(.6)) + line('M-8 -1H8M-8 1.2H8', INKL, .7, .6) + `</g>`).join(''));
PR('basin-lotus', 'a', C, ['basin', 'lotus', 'water'], (t) => sh(32, 56, 24, 4) + ell(32, 44, 24, 12, t.lg(STN, 90), 1, 0, ikS) + ell(32, 42, 20, 9, '#4a8aa0', 1, 0, ik(.6)) + ell(28, 40, 8, 2, '#b4e0e8', .6) + lotus(24, 44, 1.2, TQ) + lotus(40, 42, 1.4, LAP) + ell(34, 47, 5, 1.6, '#5a9a54', .9) + path('M8 44Q8 54 32 56Q56 54 56 44', t.lg(['#f0d098', '#c89a62', '#8a603c'], 90), 1, ik(.8)) + frieze(14, 49, 36, 4, 'checker', [LAP, RED]).replace(/<rect[^>]*stroke[^>]*\/>/, ''));
PR('torch-standing', 'a', TALL, ['torch', 'fire', 'light', 'lit'], (t) => sh(32, 120, 10, 3) + rect(30, 60, 4, 60, t.lg(WOODS, 0), .6, 1, ink('#3b2a1a', .6, .85)) + path('M24 62H40L37 72H27Z', t.lg(['#d0a050', '#8a6226', '#4a3410'], 20), 1, ink('#2a1c08', .9, .9)) + path('M26 62Q24 48 31 40Q30 50 35 48Q40 54 38 62Z', '#f26a1c', .95) + path('M29 62Q29 54 32 50Q35 56 35 62Z', '#ffd35a', .95) + circ(32, 54, 18, '#ffb040', .15) + rect(24, 112, 16, 8, t.lg(STN, 90), 1, 1, ik(.8)));
PR('lantern-hanging', 'a', C, ['lantern', 'light'], (t) => hang(24, 8, [TQ[0], TQ[1], TQ[2]], 1.4) + hang(44, 22, [RED[0], RED[1], RED[2]], 1.2));
