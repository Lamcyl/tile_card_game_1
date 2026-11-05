// Ashkara sub-area 6 Dust Bazaar objects: trees (shade fig, acacia, potted pomegranate, trellis vine), rocks (fallen brick, ruined wall stubs, column stumps, millstones, rubble),
// grass (dry weeds, thistle, hay, drying reeds) and props (awnings, hanging lamps, hitching posts, camels, braziers, teapots, rugs, sacks, crates, jars, banners, ovens, hay and more).
// Runs on its own; helpers come from dust-bazaar-lib.mjs.
import { T, rng, f, ell, circ, rect, path, line, ink, sh, pebbleD, tuft, blobPath, pts, C, TALL, LG, tile, CLOTH, MUD, MUDS, PLUM, INKB, WOODS, BRASS, BONE, GRN, bricks, jar, bone, heap, wood, mud, dust } from './dust-bazaar-lib.mjs';

const TR = (n, v, size, tags, fn) => tile('trees', n, v, size, [...tags, size === TALL ? 'tall' : 'one', 'obstacle'], fn);
const RK = (n, v, size, tags, fn) => tile('rocks', n, v, size, [...tags, size === TALL ? 'tall' : size === LG ? 'large' : 'one', 'obstacle'], fn);
const GR = (n, v, size, tags, fn) => tile('grass', n, v, size, [...tags, size === TALL ? 'tall' : 'one'], fn);
const PR = (n, v, size, tags, fn) => tile('props', n, v, size, [...tags, size === TALL ? 'tall' : size === LG ? 'large' : 'one'], fn);
const FIG = ['#c0d48a', '#7a9c4e', '#3e6a36'];
const clay = (t, ang = 60) => t.lg(['#ecc8b0', '#c98e74', '#8a5446'], ang);
const ikc = (w = .9) => ink(INKB, w, .85);
const moundB = (t, cx, cy, rx, ry) => ell(cx, cy + ry * .3, rx, ry, t.lg(['#f0d4c0', '#d9ab90', '#b07860'], 70), .96) + ell(cx - rx * .3, cy - ry * .1, rx * .45, ry * .3, '#fbeadc', .6, -8);

// ================= trees =================
// courtyard fig: broad dark-green crown on a thick pale trunk, with figs
const fig = (t, r, lean, big) => {
  const fy = 118; let o = sh(32, fy, 22, 5) + moundB(t, 32, fy - 2, 22, 5.6);
  const tx = 32 + lean;
  o += path(`M24 ${fy - 3}Q27 ${fy - 20} ${tx - 5} ${fy - 38}L${tx + 5} ${fy - 38}Q${38 + lean * .5} ${fy - 20} 41 ${fy - 3}Z`, t.lg(['#d8b890', '#a8845c', '#6a4a30'], 0), 1, ink('#3a2a20', 1, .85)) + line(`M29 ${fy - 8}Q${30 + lean * .5} ${fy - 24} ${tx - 2} ${fy - 36}`, '#e8dcc8', 1, .5);
  const cl = [[tx, 32, 21, 16], [tx - 13, 50, 14, 10], [tx + 14, 48, 14, 10], [tx - 2, 64, 17, 8]].slice(0, big ? 4 : 3);
  for (const [cx, cy, rx, ry] of cl) { o += ell(cx + 1.5, cy + 2.4, rx, ry, '#2a3a2a', .22) + ell(cx, cy, rx, ry, t.lg(FIG, 60), 1, 0, ink('#2e4a2a', .8, .75)) + ell(cx - rx * .3, cy - ry * .3, rx * .5, ry * .4, '#d8e8a0', .45); for (let i = 0; i < 5; i++) o += circ(cx + r.range(-rx * .7, rx * .7), cy + r.range(-ry * .6, ry * .6), 1.7, '#6a3a5a', .95, ink('#3a1a30', .4, .8)); }
  return o;
};
TR('fig-court', 'a', TALL, ['fig', 'green', 'shade'], (t, r) => fig(t, r, -2, true));
TR('fig-court', 'b', TALL, ['fig', 'green', 'shade'], (t, r) => fig(t, r, 5, false));
// flat-topped acacia
const acacia = (t, r, lean, dry) => {
  const fy = 118; let o = sh(32, fy, 20, 5) + moundB(t, 32, fy - 2, 20, 5);
  o += path(`M28 ${fy - 2}Q${30 + lean * .4} ${fy - 22} ${32 + lean} 50L${36 + lean} 50Q36 ${fy - 22} 38 ${fy - 2}Z`, wood(t, 0), 1, ink('#3a2a1a', 1, .85)) + line(`M${33 + lean} 54Q${30 + lean * .5} 80 ${31} ${fy - 6}`, '#d8b080', 1, .5) + line(`M${33 + lean} 54l-14 -8M${35 + lean} 52l16 -10`, '#5a3c20', 2.6, .95);
  const pads = dry ? [[20 + lean * .3, 36, 13, 6], [44 + lean * .3, 32, 13, 6]] : [[19 + lean * .3, 38, 13, 6], [33 + lean * .3, 24, 17, 7], [48 + lean * .3, 36, 13, 6]];
  for (const [cx, cy, rx, ry] of pads) o += ell(cx + 1.4, cy + 2.4, rx, ry, '#2a3a2a', .2) + ell(cx, cy, rx, ry, dry ? t.lg(['#d8d6a0', '#a8a468', '#6a6a40'], 60) : t.lg(['#c6cf7a', '#93ab52', '#5f7f3a'], 60), 1, 0, ink('#3e5a2a', .8, .75)) + ell(cx - rx * .3, cy - ry * .3, rx * .5, ry * .4, '#eef0b8', .5);
  return o;
};
TR('acacia-shade', 'a', TALL, ['acacia', 'green', 'shade'], (t, r) => acacia(t, r, -2, false));
TR('acacia-shade', 'b', TALL, ['acacia', 'dry', 'shade'], (t, r) => acacia(t, r, 4, true));
// potted pomegranate in a clay jar
const pomegranate = (t, r, fruit) => {
  let o = sh(32, 54, 15, 4) + path('M20 54Q18 44 24 40H40Q46 44 44 54Z', clay(t, 20), 1, ikc()) + ell(32, 40, 8.6, 2.2, '#4a2a24', 1) + line('M21 48Q32 51 43 48', BRASS[1], 1.2, .9);
  o += line('M32 40V30', '#5a3c20', 2.6, 1);
  for (const [cx, cy, rx, ry] of [[32, 22, 15, 10], [22, 30, 9, 6.5], [43, 30, 9, 6.5]]) o += ell(cx + 1, cy + 1.6, rx, ry, '#2a3a2a', .2) + ell(cx, cy, rx, ry, t.lg(['#b8dc7a', '#6aa04a', '#3a6e34'], 60), 1, 0, ink('#2e4a2a', .8, .75)) + ell(cx - rx * .3, cy - ry * .3, rx * .45, ry * .4, '#e0f0a8', .5);
  for (let i = 0; i < fruit; i++) o += circ(22 + i * 8 + r.range(-2, 2), 22 + (i % 2) * 7, 2.8, '#c8283a', 1, ink('#701420', .6, .9)) + circ(22 + i * 8 - .8, 21 + (i % 2) * 7, .8, '#f08a90', .9);
  return o;
};
TR('pomegranate-pot', 'a', C, ['pot', 'fruit'], (t, r) => pomegranate(t, r, 3));
TR('pomegranate-pot', 'b', C, ['pot', 'fruit'], (t, r) => pomegranate(t, r, 4));
// trellis vine: two posts, a cross-beam and a leafy roof of vine with grape bunches
const trellis = (t, r, c) => {
  let o = sh(32, 56, 24, 4);
  for (const x of [12, 52]) o += rect(x - 2.4, 22, 4.8, 34, wood(t, 0), .8, 1, ink('#3a2a1a', .7, .85));
  o += rect(8, 18, 48, 5, wood(t, 90), 1, 1, ink('#3a2a1a', .7, .85)) + line('M16 18l-6 8M48 18l6 8', '#5a3c20', 1.8, 1);
  for (let i = 0; i < 9; i++) { const x = 10 + i * 5.4, y = 18 + r.range(-1, 3); o += ell(x, y, 6, 4.6, t.lg(c, 60), 1, r.range(-30, 30), ink('#2e4a2a', .6, .75)) + ell(x - 1.4, y - 1, 2.6, 1.6, '#e0f0a8', .45); }
  for (const x of [20, 32, 44]) { o += line(`M${x} 22V28`, '#5a3c20', 1, .9); for (let k = 0; k < 6; k++) o += circ(x + (k % 2) * 2.4 - 1.2, 29 + k * 2.2, 1.8, c[2] === '#3a6e34' ? '#6a4a8a' : '#7a3a6a', 1, ink('#2a1030', .4, .8)); }
  return o;
};
TR('trellis-vine', 'a', C, ['vine', 'grapes'], (t, r) => trellis(t, r, ['#b8dc7a', '#6aa04a', '#3a6e34']));
TR('trellis-vine', 'b', C, ['vine', 'grapes'], (t, r) => trellis(t, r, ['#d0d680', '#8aa04a', '#566e34']));

// ================= rocks =================
const brickHeap = (t, r, n, s) => { let o = sh(32, 50, 22 * s, 5); const cs = [MUD, MUDS]; for (let i = 0; i < n; i++) { const x = 32 + r.range(-14, 14) * s, y = 46 - r.range(0, 14) * s * (1 - Math.abs(x - 32) / 30), a = r.range(-30, 30); o += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})">` + rect(-6 * s, -3 * s, 12 * s, 6 * s, t.lg(cs[i % 2], 60), 1, 1, ink(INKB, .8, .85)) + line(`M${-5 * s} ${-1 * s}H${5 * s}`, '#f4d8c4', .7, .7) + `</g>`; } return o; };
RK('brick-fall', 'a', C, ['brick', 'rubble'], (t, r) => brickHeap(t, r, 9, 1));
RK('brick-fall', 'b', C, ['brick', 'rubble'], (t, r) => brickHeap(t, r, 6, .9));
RK('brick-fall', 'c', C, ['brick', 'rubble'], (t, r) => brickHeap(t, r, 12, 1.1));
// ruined wall stub: crumbling mud-brick stump
const wallStub = (t, r, w, h) => {
  let o = sh(32, 54, w * .6, 4.4); const x0 = 32 - w / 2, y0 = 54 - h, d = `M${x0} 54V${y0 + 6}L${x0 + 5} ${y0 + 2}L${x0 + w * .4} ${y0 + 7}L${x0 + w * .6} ${y0}L${x0 + w - 3} ${y0 + 5}L${x0 + w} ${y0 + 3}V54Z`, c = t.clip(d);
  o += `<path d="${d}" fill="${clay(t, 80)}" stroke="${INKB}" stroke-opacity=".85" stroke-width="1.2"/><g clip-path="${c}">${bricks(x0, y0, w, h, r.range(1, 99999) | 0, MUD, 5, 9)}${path(`M${x0 + w - 9} ${y0}H${x0 + w}V54H${x0 + w - 9}Z`, PLUM, .3)}</g>`;
  o += path(d, 'none', 1, ikc(1.2)) + mound(t, 32, 54, w * .55, 3.4);
  return o;
};
const mound = moundB;
RK('ruined-wall', 'a', C, ['wall', 'ruin'], (t, r) => wallStub(t, r, 34, 26));
RK('ruined-wall', 'b', C, ['wall', 'ruin'], (t, r) => wallStub(t, r, 26, 34));
RK('ruined-wall', 'c', C, ['wall', 'ruin'], (t, r) => wallStub(t, r, 44, 18));
// stump of a sandstone column on a square base
const colStump = (t, r, h) => sh(32, 54, 16, 4) + rect(16, 48, 32, 7, t.lg(['#f6d8b4', '#e0a880', '#b87850'], 60), 1, 1, ikc()) + rect(21, 54 - 7 - h, 22, h, t.lg(['#f6d8b4', '#d9996e'], 0), 1, 1, ikc()) + [0, 1, 2].map(i => line(`M${25 + i * 7} ${54 - 6 - h + 2}V${48}`, '#b87850', .8, .7)).join('') + ell(32, 54 - 7 - h, 11, 3, '#f6d8b4', 1, 0, ikc(.7)) + path(`M24 ${54 - 7 - h}l4 -3l2 3z`, '#e0a880', .8);
RK('column-stump', 'a', C, ['column', 'sandstone'], (t, r) => colStump(t, r, 10));
RK('column-stump', 'b', C, ['column', 'sandstone'], (t, r) => colStump(t, r, 16));
// millstone leaning on its pit
const mill = (t, r, tilt) => sh(32, 50, 18, 4) + ell(32, 44, 20, 8.6, '#7a5c48', 1, 0, ikc()) + (tilt ? `<g transform="rotate(-18 32 40)">${ell(32, 38, 15, 16, t.lg(['#e8d4c0', '#bfa088', '#8a6a58'], 50), 1, 0, ikc())}${ell(32, 38, 4, 4.4, '#4a3428', 1)}${[0, 60, 120].map(a => line(`M32 38l${f(Math.cos(a * 0.01745) * 12)} ${f(Math.sin(a * 0.01745) * 12)}`, '#8a6a58', 1, .7)).join('')}</g>` : ell(32, 40, 17, 8, t.lg(['#e8d4c0', '#bfa088', '#8a6a58'], 50), 1, 0, ikc()) + ell(32, 40, 4, 1.8, '#4a3428', 1) + ell(26, 37, 8, 2.4, '#fff', .35, -8));
RK('millstone', 'a', C, ['millstone', 'stone'], (t, r) => mill(t, r, false));
RK('millstone', 'b', C, ['millstone', 'stone'], (t, r) => mill(t, r, true));
RK('stone-trough', 'a', C, ['trough', 'water'], (t, r) => sh(32, 50, 22, 4.4) + path('M10 36H54L50 50H14Z', t.lg(['#e8d4c0', '#c0a088', '#8a6a58'], 60), 1, ikc()) + path('M12 36H52L50 40H14Z', '#7ab0b0', 1) + line('M16 38q8 -1.6 16 0t16 0', '#e6f6f0', .9, .7) + ell(32, 36, 21, 3, 'none', 1, 0, { stroke: '#f4e8dc', 'stroke-width': 1.6 }));
const rubble = (t, r, n) => { let o = sh(32, 50, 20, 4.4); for (let i = 0; i < n; i++) o += pebbleD(32 + r.range(-16, 16), 44 + r.range(-6, 6), r.range(.9, 1.5), i % 3 ? ['#e0b49c', '#8a5446'] : ['#f4dcb0', '#a97a52']); return o; };
RK('rubble-pile', 'a', C, ['rubble'], (t, r) => rubble(t, r, 7));
RK('rubble-pile', 'b', C, ['rubble'], (t, r) => rubble(t, r, 10));

// ================= grass =================
GR('weeds-dry', 'a', C, ['dry', 'weeds'], (t, r) => [0, 1, 2, 3, 4].map(i => tuft(14 + i * 9, 54 - (i % 2) * 3, '#b09a5c', .95, 1.3)).join('') + [0, 1, 2].map(i => tuft(20 + i * 12, 48, '#c8b478', .9, 1)).join(''));
GR('weeds-dry', 'b', C, ['dry', 'weeds'], (t, r) => [0, 1, 2, 3].map(i => tuft(16 + i * 11, 52, '#a89058', .95, 1.5)).join('') + tuft(32, 42, '#d0bc80', .9, 1.2));
const thistle = (t, r, n) => { let o = sh(32, 54, 14, 3.4); for (let i = 0; i < n; i++) { const x = 32 + (i - (n - 1) / 2) * 12, h = 22 + (i % 2) * 8; o += line(`M${x} 54Q${x + r.range(-3, 3)} ${54 - h / 2} ${x} ${54 - h}`, '#6a8a4a', 1.6, 1) + `<path d="M${x - 5} ${54 - h * .4}l5 -5l5 5Z" fill="#8aa05c"/>` + circ(x, 54 - h - 2, 3.2, '#9a6ab0', 1, ink('#5a2a70', .7, .9)) + line(`M${x - 3} ${54 - h - 4}l6 4M${x + 3} ${54 - h - 4}l-6 4`, '#d0a8e0', .7, .9) + ell(x, 54 - h + 1, 3.6, 2.2, '#7a9a4a', 1, 0, ink('#3a5a2a', .6, .85)); } return o; };
GR('thistle', 'a', C, ['thistle', 'flower'], (t, r) => thistle(t, r, 3));
GR('thistle', 'b', C, ['thistle', 'flower'], (t, r) => thistle(t, r, 2));
GR('hay-tuft', 'a', C, ['hay', 'dry'], (t, r) => [0, 1, 2, 3, 4, 5].map(i => tuft(12 + i * 8, 54 - (i % 3) * 2, '#d8c078', .95, 1.4)).join(''));
GR('reed-bundle', 'a', TALL, ['reeds', 'drying'], (t, r) => sh(32, 118, 14, 4) + [0, 1, 2, 3, 4, 5, 6].map(i => line(`M${24 + i * 2.6} 118Q${26 + i * 2.2} 70 ${22 + i * 4.6} ${26 + (i % 3) * 5}`, i % 2 ? '#c8b070' : '#a89048', 2, 1)).join('') + line('M24 100Q32 104 41 100', '#7a5a30', 2.6, 1) + line('M24 80Q32 84 40 80', '#7a5a30', 2.6, 1));

// ================= props =================
const pole = (t, x, y0, y1, w = 3.6) => rect(x - w / 2, y0, w, y1 - y0, t.lg(WOODS, 0), .6, 1, ink('#3b2a1a', .6, .85));
// awning on two poles (front view): striped canopy with scalloped valance
const awning = (t, c1, c2) => {
  let o = sh(32, 58, 26, 3.4) + pole(t, 10, 22, 58) + pole(t, 54, 22, 58);
  const d = 'M4 36L14 12H50L60 36Z', cl = t.clip(d); let st = '';
  for (let x = 2; x < 64; x += 10) st += rect(x, 10, 5, 30, c1[1], 0, 1) + rect(x + 5, 10, 5, 30, c2[0], 0, 1);
  o += `<g clip-path="${cl}">${st}${path('M4 36L14 12H26L16 36Z', '#fff', .18)}${path('M50 12L60 36H48Z', PLUM, .22)}</g>` + path(d, 'none', 1, ink(c1[2], 1.1, .9));
  for (let x = 4; x < 60; x += 8) o += path(`M${x} 36H${x + 8}V40Q${x + 4} 44 ${x} 40Z`, ((x - 4) / 8) % 2 ? c2[1] : c1[2], 1, ink(INKB, .6, .8));
  return o + ell(32, 52, 24, 4, PLUM, .18);
};
PR('awning-pole', 'a', C, ['awning', 'cloth', 'shade'], (t) => awning(t, CLOTH.red, CLOTH.cream));
PR('awning-pole', 'b', C, ['awning', 'cloth', 'shade'], (t) => awning(t, CLOTH.teal, CLOTH.cream));
PR('awning-pole', 'c', C, ['awning', 'cloth', 'shade'], (t) => awning(t, CLOTH.saff, CLOTH.red));
PR('awning-pole', 'd', C, ['awning', 'cloth', 'shade'], (t) => awning(t, CLOTH.indigo, CLOTH.cream));
PR('awning-pole', 'e', C, ['awning', 'cloth', 'shade'], (t) => awning(t, CLOTH.mag, CLOTH.saff));
// hanging lanterns on a bracket pole
const lantern = (x, y, c, s = 1) => line(`M${x} ${y - 6 * s}V${y}`, '#3b2a1a', 1, .9) + path(`M${x - 4 * s} ${y}H${x + 4 * s}L${x + 5 * s} ${y + 9 * s}Q${x} ${y + 13 * s} ${x - 5 * s} ${y + 9 * s}Z`, c[1], 1, ink(c[2], .9, .9)) + rect(x - 2.6 * s, y + 2 * s, 5.2 * s, 7 * s, '#fff2b0', 1, .9) + circ(x, y + 5.6 * s, 6.6 * s, '#ffd35a', .22) + ell(x, y - .5 * s, 4.4 * s, 1.4 * s, BRASS[1], 1, 0, ink(BRASS[2], .5, .9));
PR('lamp-post', 'a', TALL, ['lamp', 'light'], (t) => sh(32, 120, 10, 3) + pole(t, 32, 20, 120, 4.4) + path('M32 22Q44 14 52 24', 'none', 1, { stroke: '#3b2a1a', 'stroke-width': 3, 'stroke-linecap': 'round' }) + lantern(52, 24, CLOTH.saff) + circ(32, 18, 2.6, BRASS[1], 1, ink(BRASS[2], .6, .9)));
PR('lamp-post', 'b', TALL, ['lamp', 'light'], (t) => sh(32, 120, 10, 3) + pole(t, 32, 20, 120, 4.4) + path('M32 36Q20 28 12 38M32 24Q44 16 52 26', 'none', 1, { stroke: '#3b2a1a', 'stroke-width': 3, 'stroke-linecap': 'round' }) + lantern(12, 38, CLOTH.red) + lantern(52, 26, CLOTH.teal) + circ(32, 18, 2.6, BRASS[1], 1, ink(BRASS[2], .6, .9)));
PR('lantern-hanging', 'a', C, ['lamp', 'light', 'hanging'], () => lantern(32, 14, CLOTH.red, 1.5) + lantern(14, 30, CLOTH.saff, 1) + lantern(50, 28, CLOTH.teal, 1));
PR('lantern-hanging', 'b', C, ['lamp', 'light', 'hanging'], () => lantern(32, 8, CLOTH.indigo, 1.6) + lantern(16, 34, CLOTH.mag, 1.1));
PR('lantern-hanging', 'c', C, ['lamp', 'light', 'hanging'], () => [[14, 12], [32, 22], [50, 12]].map(([x, y], i) => lantern(x, y, [CLOTH.saff, CLOTH.red, CLOTH.green][i], 1.2)).join('') + line('M0 6Q32 20 64 6', '#3b2a1a', 1.1, .9));
// camel hitching posts
const hpost = (t, h, ropes) => sh(32, 56, 14, 3.4) + rect(29, 54 - h, 6, h, wood(t, 0), .8, 1, ink('#3b2a1a', .7, .85)) + path(`M26 ${54 - h}L29 ${50 - h}L32 ${54 - h}L35 ${50 - h}L38 ${54 - h}Z`, wood(t, 0), 1, ink('#3b2a1a', .7, .85)) + (ropes ? line(`M30 ${58 - h}q-10 8 -12 16M34 ${60 - h}q8 6 10 18`, '#a88a54', 1.8, 1) + `<path d="M18 ${62 - h + 9}q-3 5 0 8" fill="none" stroke="#a88a54" stroke-width="1.8"/>` : '') + line(`M31 ${56 - h}h4M31 ${60 - h}h4`, '#a88a54', 1.6, 1);
PR('hitching-post', 'a', C, ['camel', 'post'], (t) => hpost(t, 30, false));
PR('hitching-post', 'b', C, ['camel', 'post'], (t) => hpost(t, 34, true));
PR('hitching-post', 'c', C, ['camel', 'post'], (t) => hpost(t, 26, true));
// kneeling camel, side view, facing left
const camel = (t, c, blanket) => {
  const fur = t.lg(['#e6c696', '#c8a070', '#8a6a44'], 80);
  let o = sh(34, 54, 24, 4.4) + path('M46 46Q58 42 60 52', 'none', 1, { stroke: '#8a6a44', 'stroke-width': 2.4, 'stroke-linecap': 'round' }) + circ(60, 52, 2, '#5a4028');
  o += path('M16 46Q15 36 26 35Q30 26 36 34Q50 33 53 44Q53 54 40 54H24Q16 54 16 46Z', fur, 1, ink('#4a3220', 1, .85));
  o += path('M20 38Q10 34 11 24Q11 17 17 16L24 20Q21 27 26 35Z', fur, 1, ink('#4a3220', 1, .85)) + ell(15, 15, 6.6, 3.8, fur, 1, -22, ink('#4a3220', .9, .85)) + ell(10.6, 17, 2.8, 2.2, '#a8845a', 1) + circ(16, 13.6, 1, '#2a1a10') + path('M19 11l1 -3l2 3Z', '#8a6a44');
  o += ell(32, 33, 7, 6, fur, 1, 0, ink('#4a3220', .8, .85));
  o += path('M24 37Q32 30 42 36L41 44Q32 40 25 45Z', blanket[1], 1, ink(blanket[2], .9, .9)) + path('M26 40Q32 36 40 40', 'none', 1, { stroke: CLOTH.cream[0], 'stroke-width': 1.2 }) + [0, 1, 2].map(i => circ(26 + i * 7, 46 - i * .4, 1.3, BRASS[1])).join('');
  o += path('M22 54Q26 50 34 52H44Q50 53 50 54Z', '#a8845a', .8) + ell(25, 54, 4.6, 1.8, '#8a6a44', 1);
  return o;
};
PR('camel-kneeling', 'a', C, ['camel', 'animal'], (t) => camel(t, 0, CLOTH.red));
PR('camel-kneeling', 'b', C, ['camel', 'animal'], (t) => camel(t, 0, CLOTH.teal));
// brazier lit/unlit, tripod with coals
const brazier = (t, lit) => sh(32, 56, 16, 3.4) + line('M22 56L28 40M42 56L36 40M32 57V42', '#3b2a1a', 2.4, 1) + path('M18 34H46L42 44Q32 48 22 44Z', t.lg(['#7a6a62', '#4a3e3a', '#2a2220'], 20), 1, ink('#1a1412', .9, .9)) + ell(32, 34, 14, 3.4, lit ? '#e8501c' : '#3a2e2c', 1, 0, ink('#1a1412', .7, .9))
  + (lit ? ell(32, 34, 9, 2, '#ffb030', .9) + path('M26 33Q24 24 30 18Q30 26 34 22Q34 14 38 10Q42 22 38 33Z', '#ff8a24', .95) + path('M30 33Q30 26 34 22Q38 28 36 33Z', '#ffd060', .95) + circ(40, 12, 1, '#ffcf70') + circ(26, 18, .8, '#ffcf70') : ell(30, 33, 6, 1.6, '#6a5e5a', .7) + circ(36, 33, 1, '#8a7e7a'));
PR('brazier', 'a', C, ['fire', 'lit'], (t) => brazier(t, true));
PR('brazier', 'b', C, ['fire', 'unlit'], (t) => brazier(t, false));
// teapots and glasses on a copper tray / small tea table
const teapot = (x, y, s, c) => ell(x + 1.4, y + 1.6, 6 * s, 1.6 * s, '#3b2a24', .2) + path(`M${x - 5 * s} ${y}Q${x - 6 * s} ${y - 6 * s} ${x} ${y - 7 * s}Q${x + 6 * s} ${y - 6 * s} ${x + 5 * s} ${y}Z`, t_lg(c), 1, ink('#5a3a10', .8, .9)) + path(`M${x + 4 * s} ${y - 4 * s}L${x + 9 * s} ${y - 8 * s}L${x + 8 * s} ${y - 9 * s}L${x + 3 * s} ${y - 6 * s}Z`, c[1], 1, ink('#5a3a10', .6, .9)) + path(`M${x - 5 * s} ${y - 4 * s}q-4 0 -3 -4q1 -2 4 -1`, 'none', 1, { stroke: c[2], 'stroke-width': 1.4 }) + ell(x, y - 8 * s, 2.2 * s, 1 * s, c[0], 1, 0, ink('#5a3a10', .5, .9)) + circ(x, y - 10 * s, 1 * s, c[0]);
const t_lg = (c) => c[1];
const glass = (x, y) => path(`M${x - 2} ${y - 5}H${x + 2}L${x + 1.4} ${y}H${x - 1.4}Z`, '#f0a838', .9, ink('#8a5a10', .6, .9)) + line(`M${x - 1.6} ${y - 5}H${x + 1.6}`, '#fff', .8, .8);
PR('teapots', 'a', C, ['tea', 'brass'], (t) => sh(32, 52, 22, 4) + ell(32, 44, 22, 8, BRASS[1], 1, 0, ink(BRASS[2], 1, .9)) + ell(32, 44, 17, 5.6, BRASS[0], 1) + teapot(24, 44, 1.3, BRASS) + teapot(42, 42, 1, BRASS) + glass(32, 48) + glass(36, 49) + glass(28, 49));
PR('teapots', 'b', C, ['tea', 'brass'], (t) => sh(32, 52, 20, 4) + ell(32, 46, 18, 6.6, '#7a4a30', 1, 0, ink('#3a2418', .9, .9)) + teapot(32, 44, 1.6, ['#e8e0d0', '#b8b0a0', '#7a7468']) + glass(20, 48) + glass(44, 48) + glass(24, 51));
PR('tea-table', 'a', C, ['tea', 'table'], (t) => sh(32, 56, 20, 3.6) + [[16, 56, 22], [48, 56, 22]].map(([x, y, h]) => line(`M${x} ${y}L${x + (x < 32 ? 5 : -5)} 38`, '#3b2a1a', 2.4, 1)).join('') + ell(32, 38, 22, 8, t.lg(WOODS, 0), 1, 0, ink('#3a2a1a', .9, .9)) + ell(32, 36, 18, 5.4, '#d8b080', .55) + teapot(26, 36, 1.1, BRASS) + glass(40, 38) + glass(44, 36));
// floor cushions (low seats)
const cushion = (x, y, c) => ell(x + 1.4, y + 2, 11, 3.6, '#3b2a24', .2) + path(`M${x - 11} ${y}Q${x - 10} ${y - 7} ${x} ${y - 7}Q${x + 10} ${y - 7} ${x + 11} ${y}Q${x + 8} ${y + 4} ${x} ${y + 4}Q${x - 8} ${y + 4} ${x - 11} ${y}Z`, c[1], 1, ink(c[2], 1, .9)) + ell(x - 3, y - 3, 5, 1.8, c[0], .8) + circ(x - 11, y, 1.4, BRASS[1]) + circ(x + 11, y, 1.4, BRASS[1]);
PR('cushions', 'a', C, ['seat', 'cloth'], () => cushion(22, 40, CLOTH.red) + cushion(42, 38, CLOTH.teal) + cushion(32, 50, CLOTH.saff));
PR('cushions', 'b', C, ['seat', 'cloth'], () => cushion(30, 44, CLOTH.indigo) + cushion(44, 36, CLOTH.mag));
// rolled rugs standing and stacked
const roll = (x, y, h, c, c2) => ell(x, y, 5.4, 2, '#3b2a24', .2) + rect(x - 5, y - h, 10, h, t_roll(c), 2, 1, ink(c[2], .9, .9)) + [0, 1, 2, 3].map(i => rect(x - 5, y - h + 3 + i * (h - 6) / 3, 10, 2, c2[1], 0, .85)).join('') + ell(x, y - h, 5, 2, c[0], 1, 0, ink(c[2], .8, .9)) + [1, 2].map(i => ell(x, y - h, i * 1.6, i * .6, 'none', 1, 0, { stroke: c2[1], 'stroke-width': .7 })).join('');
const t_roll = (c) => c[1];
PR('rug-rolls', 'a', C, ['rug', 'cloth'], () => roll(20, 54, 26, CLOTH.red, CLOTH.saff) + roll(32, 54, 32, CLOTH.teal, CLOTH.cream) + roll(44, 54, 22, CLOTH.indigo, CLOTH.saff));
PR('rug-rolls', 'b', C, ['rug', 'cloth'], () => roll(24, 54, 30, CLOTH.mag, CLOTH.cream) + roll(38, 54, 24, CLOTH.red, CLOTH.cream) + roll(31, 40, 24, CLOTH.saff, CLOTH.red));
PR('rug-stack', 'a', C, ['rug', 'cloth'], (t) => sh(32, 54, 22, 4) + [[CLOTH.indigo, 46, 24], [CLOTH.red, 40, 20], [CLOTH.teal, 34, 22], [CLOTH.saff, 28, 18], [CLOTH.mag, 22, 20]].map(([c, y, w]) => path(`M${32 - w} ${y + 6}Q${32 - w} ${y} ${32 - w + 3} ${y}H${32 + w - 3}Q${32 + w} ${y} ${32 + w} ${y + 6}Z`, c[1], 1, ink(c[2], .9, .9)) + line(`M${32 - w + 3} ${y + 4}H${32 + w - 3}`, c[0], 1, .9) + [0, 1, 2, 3, 4].map(i => line(`M${32 - w + 2 + i * 3} ${y + 5}v2`, CLOTH.cream[1], 1, .8)).join('')).join(''));
// sacks and crates and barrels
const sack = (x, y, s, c = ['#f0e0b8', '#d4bc88', '#a8905c'], mark) => ell(x + 1.6, y + 1, 9 * s, 2.6 * s, '#3b2a24', .2) + path(`M${x - 8 * s} ${y}Q${x - 10 * s} ${y - 12 * s} ${x - 4 * s} ${y - 15 * s}L${x - 5 * s} ${y - 18 * s}H${x + 5 * s}L${x + 4 * s} ${y - 15 * s}Q${x + 10 * s} ${y - 12 * s} ${x + 8 * s} ${y}Q${x} ${y + 3 * s} ${x - 8 * s} ${y}Z`, c[1], 1, ink(c[2], 1, .9)) + line(`M${x - 4.6 * s} ${y - 15 * s}H${x + 4.6 * s}`, c[2], 1.4, .9) + ell(x - 3 * s, y - 8 * s, 2.6 * s, 4 * s, '#fff', .26, -10) + (mark ? circ(x + 1 * s, y - 7 * s, 2.6 * s, mark, .85) : '');
PR('sacks', 'a', C, ['sack', 'grain'], () => sack(22, 50, 1) + sack(40, 50, 1.1) + sack(31, 38, .9, undefined, '#c03a3a'));
PR('sacks', 'b', C, ['sack', 'grain'], () => sack(32, 52, 1.5, ['#d8b8a0', '#b08c70', '#7a5a44']) + sack(16, 46, .8, ['#e8d0a0', '#c8a870', '#9a7c44']) + sack(50, 48, .9, ['#e8d0a0', '#c8a870', '#9a7c44'], '#1f9a9a'));
PR('sacks', 'c', C, ['sack', 'spice'], () => [[20, 50, CLOTH.red], [34, 50, CLOTH.saff], [46, 50, CLOTH.green]].map(([x, y, c]) => path(`M${x - 8} ${y}Q${x - 9} ${y - 8} ${x - 6} ${y - 11}H${x + 6}Q${x + 9} ${y - 8} ${x + 8} ${y}Q${x} ${y + 3} ${x - 8} ${y}Z`, '#d4bc88', 1, ink('#8a7040', .9, .9)) + ell(x, y - 11, 6.4, 2.2, c[1], 1, 0, ink(c[2], .8, .9)) + ell(x - 1.6, y - 12, 3, 1, c[0], .9)).join(''));
const crate = (t, x, y, w, h, fill) => ell(x + 2, y + 2, w * .55, 2.6, '#3b2a24', .2) + rect(x - w / 2, y - h, w, h, t.lg(WOODS, 90), 1, 1, ink('#3b2a1a', .9, .85)) + line(`M${x - w / 2 + 1} ${y - h * .5}H${x + w / 2 - 1}`, '#3b2a1a', .9, .7) + line(`M${x - w / 2 + w * .33} ${y - h}V${y}M${x + w / 2 - w * .33} ${y - h}V${y}`, '#3b2a1a', .8, .5) + (fill || '');
const fruits = (x, y, w, cols) => { let o = ''; for (let i = 0; i < Math.floor(w / 4.6); i++) o += circ(x - w / 2 + 3 + i * 4.6, y - 1 - (i % 2) * 1.4, 2.6, cols[i % cols.length], 1, ink('#4a2a10', .4, .8)) + circ(x - w / 2 + 2.2 + i * 4.6, y - 2 - (i % 2) * 1.4, .7, '#fff', .55); return o; };
PR('crates-fruit', 'a', C, ['crate', 'fruit'], (t) => crate(t, 22, 52, 22, 14, fruits(22, 38, 22, ['#f08a24', '#e8501c'])) + crate(t, 44, 52, 22, 14, fruits(44, 38, 22, ['#c8283a', '#a01c30'])) + crate(t, 33, 38, 22, 14, fruits(33, 24, 22, ['#8ab84a', '#c6d65a'])));
PR('crates-fruit', 'b', C, ['crate', 'fruit'], (t) => crate(t, 32, 52, 34, 14, fruits(32, 38, 34, ['#e8c030', '#f08a24', '#c8283a'])) + crate(t, 20, 38, 18, 12, fruits(20, 26, 18, ['#8a5aa0', '#6a4a8a'])));
PR('crates-goods', 'a', C, ['crate'], (t) => crate(t, 22, 52, 22, 16) + crate(t, 44, 52, 22, 16) + crate(t, 33, 36, 22, 16));
PR('barrel', 'a', C, ['barrel'], (t) => ell(34, 54, 14, 3.6, '#3b2a24', .22) + path('M18 48Q15 36 18 24Q32 20 46 24Q49 36 46 48Q32 54 18 48Z', t.lg(WOODS, 0), 1, ink('#3b2a1a', 1, .85)) + ell(32, 24, 14, 4, '#d8b080', 1, 0, ink('#3b2a1a', .9, .85)) + [30, 42].map(y => line(`M16.6 ${y}Q32 ${y + 5} 47.4 ${y}`, '#3a3438', 2.2, .9)).join(''));
PR('barrel', 'b', C, ['barrel', 'oil'], (t) => ell(34, 54, 14, 3.6, '#3b2a24', .22) + path('M18 48Q15 36 18 24Q32 20 46 24Q49 36 46 48Q32 54 18 48Z', t.lg(['#9a6a40', '#6a4426', '#3a2414'], 0), 1, ink('#2a1a0a', 1, .85)) + ell(32, 24, 14, 4, '#7a5a38', 1, 0, ink('#2a1a0a', .9, .85)) + circ(32, 24, 2.4, '#2a1a0a') + [30, 42].map(y => line(`M16.6 ${y}Q32 ${y + 5} 47.4 ${y}`, '#2a2428', 2.2, .9)).join('') + path('M24 32Q32 36 40 32V40Q32 44 24 40Z', '#e0c898', .7));
PR('jar-big', 'a', C, ['jar', 'pottery'], (t) => jar(t, 22, 52, 1.8) + jar(t, 46, 52, 1.2, ['#e0b49c', '#a86a50', '#6a3a34']));
PR('jar-big', 'b', C, ['jar', 'pottery'], (t) => jar(t, 32, 54, 2.4, ['#e8d0a0', '#c8a070', '#8a6a44']) + jar(t, 14, 52, 1, ['#a8d0c8', '#3fb0ac', '#1f7a86']));
PR('amphora-rack', 'a', C, ['jar', 'rack'], (t) => sh(32, 56, 22, 3.6) + rect(8, 36, 48, 3.6, wood(t, 90), 1, 1, ink('#3b2a1a', .7, .85)) + [14, 26, 38, 50].map((x, i) => `<g transform="translate(${x} 42) rotate(${i % 2 ? 62 : -62})">${path('M-3 -13H3L3.4 -9Q8 -6 7 -1Q4 2 0 2Q-4 2 -7 -1Q-8 -6 -3.4 -9Z', clay(t, 20), 1, ikc(.8))}</g>`).join('') + [12, 52].map(x => rect(x - 2, 38, 4, 18, wood(t, 0), .6, 1, ink('#3b2a1a', .7, .85))).join(''));
PR('water-skin', 'a', C, ['water', 'skin'], (t) => ell(34, 50, 16, 3.6, '#3b2a24', .2) + path('M16 44Q16 32 28 30Q34 22 42 28Q52 32 50 44Q44 52 30 52Q18 52 16 44Z', t.lg(['#d8a070', '#a8703c', '#6a4220'], 40), 1, ink('#3a2210', 1, .85)) + path('M42 28Q46 20 52 22', 'none', 1, { stroke: '#6a4220', 'stroke-width': 3.2, 'stroke-linecap': 'round' }) + line('M22 40q6 -4 12 -2', '#f0d0a0', 1, .6) + line('M20 46q10 4 24 0', '#6a4220', 1, .5));
PR('merchant-scales', 'a', C, ['scales', 'brass'], (t) => sh(32, 56, 14, 3.4) + rect(30, 18, 4, 38, wood(t, 0), .6, 1, ink('#3b2a1a', .7, .85)) + ell(32, 56, 9, 2.6, wood(t, 0), 1, 0, ink('#3b2a1a', .7, .85)) + line('M10 22H54', BRASS[2], 2.6, 1) + line('M10 22H54', BRASS[0], 1, .9) + circ(32, 18, 3, BRASS[1], 1, ink(BRASS[2], .6, .9)) + [[10, 0], [54, 1]].map(([x, k]) => line(`M${x} 22L${x - 6} 36M${x} 22L${x + 6} 36`, '#3b2a1a', .9, .9) + ell(x, 37, 8, 2.4, BRASS[1], 1, 0, ink(BRASS[2], .8, .9)) + (k ? heap(x, 36, 4, 3.4, CLOTH.red) : circ(x - 1, 34, 2, '#7a7468') + circ(x + 3, 35, 1.6, '#7a7468')).toString()).join(''));
PR('hookah', 'a', C, ['hookah', 'brass'], (t) => sh(32, 56, 14, 3.4) + path('M20 54Q16 44 24 40H40Q48 44 44 54Z', t.lg(CLOTH.teal, 20), 1, ink(CLOTH.teal[2], 1, .9)) + rect(29, 22, 6, 18, BRASS[1], 1, 1, ink(BRASS[2], .8, .9)) + ell(32, 20, 7, 3, BRASS[1], 1, 0, ink(BRASS[2], .8, .9)) + ell(32, 17, 3.4, 4, '#4a3a38', 1) + path('M44 46Q54 46 54 34', 'none', 1, { stroke: CLOTH.red[1], 'stroke-width': 2.4, 'stroke-linecap': 'round' }) + ell(32, 41, 8, 2, BRASS[0], .9));
const sign = (t, c, glyph) => sh(32, 56, 14, 3.4) + pole(t, 32, 14, 56, 4.4) + rect(10, 12, 44, 18, c[1], 2, 1, ink(c[2], 1.2, .9)) + rect(13, 15, 38, 12, 'none', 1, 1, { stroke: BRASS[1], 'stroke-width': 1, 'stroke-opacity': .9 }) + glyph;
PR('signboard', 'a', C, ['sign', 'wood'], (t) => sign(t, ['#f0d8b0', '#c8985c', '#7a5030'], circ(32, 21, 4.4, '#c03a3a') + line('M24 21H28M36 21H40', '#3a2a1a', 1.4, .9)));
PR('signboard', 'b', C, ['sign', 'wood'], (t) => sign(t, ['#a8d0c8', '#2f9a9a', '#14646e'], path('M32 16L36 21L32 26L28 21Z', BRASS[1], 1, ink(BRASS[2], .6, .9)) + line('M22 21H26M38 21H42', '#fff6e0', 1.4, .9)));
const banner = (t, c, glyph) => sh(32, 120, 10, 3) + pole(t, 18, 8, 120, 4) + circ(18, 8, 3, BRASS[1], 1, ink(BRASS[2], .6, .9)) + path('M20 12H54V70L37 60L20 70Z', c[1], 1, ink(c[2], 1.1, .9)) + path('M20 12H54V18H20Z', c[2], .5) + glyph + [24, 32, 40, 48].map(x => line(`M${x} 66V72`, BRASS[1], 1.4, .9)).join('');
PR('banner-pole', 'a', TALL, ['banner', 'cloth'], (t) => banner(t, CLOTH.red, circ(37, 36, 7, BRASS[1], 1, ink(BRASS[2], .8, .9)) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => line(`M37 36l${f(Math.cos(i * .785) * 11)} ${f(Math.sin(i * .785) * 11)}`, BRASS[1], 1, .9)).join('')));
PR('banner-pole', 'b', TALL, ['banner', 'cloth'], (t) => banner(t, CLOTH.teal, path('M37 24L45 38L37 52L29 38Z', CLOTH.saff[1], 1, ink(CLOTH.saff[2], .8, .9))));
PR('banner-pole', 'c', TALL, ['banner', 'cloth'], (t) => banner(t, CLOTH.indigo, path('M37 22Q47 30 37 40Q31 34 37 22ZM37 40Q47 46 37 54Q27 46 37 40Z', CLOTH.cream[0], 1, ink(CLOTH.indigo[2], .6, .9))));
PR('notice-board', 'a', C, ['board', 'notice'], (t) => sh(32, 56, 18, 3.6) + [14, 50].map(x => pole(t, x, 24, 56, 4)).join('') + rect(10, 14, 44, 30, wood(t, 90), 1, 1, ink('#3b2a1a', 1, .85)) + [[16, 20, '#fff6e0'], [30, 18, '#f0d0a0'], [40, 26, '#fff6e0'], [18, 32, '#e8c8c0']].map(([x, y, c]) => rect(x, y, 10, 11, c, 0, 1, ink('#8a7458', .5, .8)) + line(`M${x + 2} ${y + 3}h6M${x + 2} ${y + 6}h5`, '#6a5a48', .7, .8) + circ(x + 5, y + 1, .9, '#c03a3a')).join(''));
PR('brick-pile', 'a', C, ['brick', 'building'], (t) => sh(32, 54, 22, 4.4) + [[14, 54], [28, 54], [42, 54], [20, 46], [35, 46], [27, 38]].map(([x, y], i) => `<g>${rect(x - 6, y - 8, 12, 7, t.lg(i % 2 ? MUD : MUDS, 60), 1, 1, ink(INKB, .9, .85))}${line(`M${x - 5} ${y - 6}H${x + 5}`, '#f4d8c4', .7, .7)}</g>`).join(''));
PR('mud-oven', 'a', C, ['oven', 'bread'], (t) => sh(32, 56, 20, 4.4) + path('M12 54Q10 28 32 24Q54 28 52 54Z', clay(t, 50), 1, ikc()) + path('M20 40Q32 20 44 40Z', '#f8e0cc', .22) + path('M24 54V44Q32 36 40 44V54Z', '#2a1612', 1, ink('#140806', 1, .9)) + path('M28 54V47Q32 43 36 47V54Z', '#ff8a24', .9) + ell(32, 24, 6, 2, '#3a2a28', 1) + [[18, 30], [46, 32], [14, 44], [50, 46]].map(([x, y]) => line(`M${x} ${y}h5`, MUD[2], .9, .6)).join('') + circ(32, 18, 2, '#fff', .4) + circ(34, 13, 2.6, '#fff', .26));
PR('bread-basket', 'a', C, ['bread', 'food'], (t) => ell(34, 50, 20, 4.4, '#3b2a24', .2) + path('M12 38Q14 52 32 52Q50 52 52 38Z', t.lg(['#d8b878', '#b08c48', '#7a5a28'], 0), 1, ink('#4a3414', 1, .85)) + [[22, 36], [32, 33], [42, 36], [27, 40], [37, 40]].map(([x, y]) => ell(x, y, 7, 3.6, t.lg(['#f4dca0', '#d8a850', '#a8742c'], 40), 1, 0, ink('#6a4414', .7, .85)) + line(`M${x - 3} ${y - 1}h6`, '#a8742c', .6, .7)).join('') + line('M14 44H50M16 48H48', '#7a5a28', .8, .6));
PR('cloth-rack', 'a', TALL, ['cloth', 'dye'], (t) => sh(32, 120, 26, 4) + [8, 56].map(x => pole(t, x, 24, 120, 4.4)).join('') + rect(6, 22, 52, 4, wood(t, 90), 1, 1, ink('#3b2a1a', .7, .85)) + [[10, CLOTH.red], [24, CLOTH.indigo], [38, CLOTH.saff]].map(([x, c]) => path(`M${x} 26H${x + 14}V${76 + (x % 3) * 4}Q${x + 7} ${82 + (x % 3) * 4} ${x} ${76 + (x % 3) * 4}Z`, t.lg(c, 90), 1, ink(c[2], .9, .9)) + line(`M${x + 3} 28V70M${x + 8} 28V72`, c[0], .8, .5)).join('') + [[16, 100], [40, 108]].map(([x, y]) => ell(x, y, 8, 3, '#3b2a24', .14)).join(''));
const bale = (t, x, y, w, h, c) => ell(x + 2, y + 2, w * .6, 3, '#3b2a24', .2) + rect(x - w / 2, y - h, w, h, t.lg(c, 80), 2, 1, ink('#6a5028', .9, .85)) + [0, 1, 2, 3, 4].map(i => line(`M${x - w / 2 + 2} ${y - h + 3 + i * h / 5}h${w - 4}`, c[2], .6, .55)).join('') + [x - w / 4, x + w / 4].map(xx => line(`M${xx} ${y - h}V${y}`, '#7a5a28', 1.4, .9)).join('');
PR('hay-bale', 'a', C, ['hay', 'bale'], (t) => bale(t, 22, 52, 24, 16, ['#f0dc98', '#d8b860', '#a88838']) + bale(t, 44, 52, 22, 14, ['#f0dc98', '#d8b860', '#a88838']) + bale(t, 33, 36, 24, 14, ['#f0dc98', '#d8b860', '#a88838']));
PR('dung-cakes', 'a', C, ['dung', 'fuel'], (t) => sh(32, 54, 18, 4) + [[22, 52], [36, 52], [48, 50], [28, 42], [42, 40], [34, 31]].map(([x, y]) => ell(x, y - 4, 7.4, 4.6, t.lg(['#8c6a4c', '#6a4a34', '#4a3020'], 40), 1, 0, ink('#2a1810', .8, .85)) + line(`M${x - 3} ${y - 4}h6`, '#a88860', .7, .6)).join(''));
PR('cloth-bundle', 'a', C, ['cloth', 'bale'], (t) => sh(32, 54, 20, 4.4) + path('M12 48Q10 34 24 30Q40 26 52 36Q56 46 48 52Q30 56 12 48Z', t.lg(CLOTH.cream, 40), 1, ink(CLOTH.cream[2], 1, .9)) + [0, 1, 2].map(i => path(`M${16 + i * 12} ${46 - i * 3}Q${20 + i * 12} ${34 - i * 2} ${26 + i * 12} ${36 - i * 2}`, 'none', 1, { stroke: [CLOTH.red[1], CLOTH.teal[1], CLOTH.saff[1]][i], 'stroke-width': 3.4, 'stroke-linecap': 'round' })).join('') + line('M14 44Q32 50 50 44', '#a88a54', 1.4, .9));
PR('cloth-bundle', 'b', C, ['cloth', 'bale'], (t) => sh(32, 54, 18, 4) + [[22, 50, CLOTH.mag], [40, 50, CLOTH.indigo], [30, 38, CLOTH.saff]].map(([x, y, c]) => path(`M${x - 11} ${y}Q${x - 12} ${y - 10} ${x - 2} ${y - 11}Q${x + 10} ${y - 11} ${x + 11} ${y}Q${x} ${y + 4} ${x - 11} ${y}Z`, t.lg(c, 40), 1, ink(c[2], 1, .9)) + line(`M${x - 8} ${y - 4}Q${x} ${y - 7} ${x + 8} ${y - 4}`, c[0], 1.2, .8)).join(''));
PR('chicken-coop', 'a', C, ['coop', 'animal'], (t) => sh(32, 56, 22, 4) + [12, 52].map(x => rect(x - 1.6, 44, 3.2, 12, wood(t, 0), .6, 1, ink('#3b2a1a', .6, .85))).join('') + path('M10 44V30H54V44Z', t.lg(WOODS, 90), 1, ink('#3b2a1a', 1, .85)) + path('M6 32L32 18L58 32Z', clay(t, 50), 1, ikc()) + path('M24 44V36H34V44Z', '#2a1612') + ell(44, 38, 4.4, 3.4, '#f4f0e8', 1, 0, ink('#8a7458', .6, .85)) + path('M47 36l3 -2l-1 3Z', '#d84a2a') + circ(46, 36.4, .7, '#2a1a10') + path('M40 41l-4 3', 'none', 1, { stroke: '#e8b040' }) + line('M12 56q8 2 16 0t16 0', '#b8a060', 1, .7));
