// Ashkara sub-area 3: Singing Erg objects: trees (saxaul, ghost trees, wind acacia, broom), rocks (buried column tops, statue heads, crest cairns, yardangs),
// dune grass, and props (chime poles, bone drifts, scarab swarms, sand devils, drum, bells). Runs on its own; helpers come from singing-erg-lib.mjs.
import { T, rng, f, ell, circ, rect, path, line, ink, D, sh, pebbleD, tuft, blobPath, C, TALL, LG, tile, VIO, AP, ERGROCK, erock, heap, drift, dgrass, chimePole, bone, rib, skull, scarab, mix } from './singing-erg-lib.mjs';

const TR = (n, v, size, tags, fn) => tile('trees', n, v, size, [...tags, size === TALL ? 'tall' : 'one', 'obstacle'], fn);
const RK = (n, v, size, tags, fn) => tile('rocks', n, v, size, [...tags, size === TALL ? 'tall' : size === LG ? 'large' : 'one', 'obstacle'], fn);
const GR = (n, v, size, tags, fn) => tile('grass', n, v, size, [...tags, size === TALL ? 'tall' : 'one'], fn);
const PR = (n, v, size, tags, fn) => tile('props', n, v, size, [...tags, size === TALL ? 'tall' : size === LG ? 'large' : 'one'], fn);
const wood = (t, ang = 0) => t.lg(['#b8905c', '#8a6238', '#5a3c20'], ang);
const bleach = (t, ang = 0) => t.lg(['#f2e6cc', '#c8b48e', '#8f7a5a'], ang);

// ================= trees =================
// saxaul: a gnarled leafless shrub with jointed grey-green twigs
const saxaul = (t, r, n, spread) => {
  const fy = 52; let o = sh(30, fy, 15, 4) + heap(t, 32, fy - 1, 17, 4.4);
  o += path(`M28 ${fy - 2}Q26 ${fy - 14} 30 ${fy - 20}Q33 ${fy - 14} 36 ${fy - 2}Z`, t.lg(['#b8a888', '#8a7860', '#5a4a38'], 0), 1, ink(D.inkS, .9, .85));
  for (let i = 0; i < n; i++) {
    const a = -90 + (i - (n - 1) / 2) * spread + r.range(-8, 8), len = r.range(17, 25); let x = 31 + r.range(-2, 3), y = fy - 18, ang = a * Math.PI / 180;
    for (let k = 0; k < 4; k++) {
      const l = len / 4, nx = x + Math.cos(ang) * l, ny = y + Math.sin(ang) * l, col = k < 2 ? '#7f9a62' : '#9ab478';
      o += line(`M${f(x)} ${f(y)}L${f(nx)} ${f(ny)}`, '#4a5a3a', 3, .9) + line(`M${f(x)} ${f(y)}L${f(nx)} ${f(ny)}`, col, 1.9, 1) + line(`M${f(x - .2)} ${f(y - .8)}L${f(nx - .2)} ${f(ny - .8)}`, '#d4e4a8', .6, .7) + circ(nx, ny, 1.5, '#a4bc80', 1, ink('#4a5a3a', .4, .8));
      x = nx; y = ny; ang += r.range(-.5, .5);
    }
    if (r() < .6) o += circ(x, y, 1.3, '#f3c24f') + circ(x - .4, y - .4, .5, '#fff3b0');
  }
  return o;
};
TR('saxaul', 'a', C, ['shrub', 'desert'], (t, r) => saxaul(t, r, 5, 22));
TR('saxaul', 'b', C, ['shrub', 'desert'], (t, r) => saxaul(t, r, 6, 18));
TR('saxaul', 'c', C, ['shrub', 'desert'], (t, r) => saxaul(t, r, 4, 30));
// ghost tree: a bleached, sand-scoured dead trunk leaning from the wind, half buried
const ghost = (t, r, lean, big) => {
  const fy = 118; let o = sh(32, fy, 22, 5) + drift(32, fy - 2, 26, 6, t);
  const tx = 32 + lean, ty = 30;
  o += path(`M${26} ${fy - 4}Q${28 + lean * .3} ${fy - 40} ${tx - 4} ${ty}Q${tx} ${ty - 5} ${tx + 4} ${ty}Q${36 + lean * .3} ${fy - 40} ${38} ${fy - 4}Z`, bleach(t, 0), 1, ink('#5a4a30', 1, .85));
  o += line(`M${30} ${fy - 8}Q${31 + lean * .3} ${fy - 44} ${tx - 1} ${ty + 4}`, '#8f7a5a', 1, .5) + line(`M${33} ${fy - 14}Q${34 + lean * .3} ${fy - 50} ${tx + 1} ${ty + 8}`, '#fffaf0', 1, .6);
  const br = [[ty + 14, -1, 16, -10], [ty + 30, 1, 14, -8], [ty + 48, -1, 12, -4]].slice(0, big ? 3 : 2);
  for (const [y, d, l, up] of br) { const bx = tx + lean * -.1 + d * 3, ex = bx + d * l, ey = y + up; o += path(`M${bx} ${y + 2}Q${bx + d * l * .5} ${y + up * .3} ${ex} ${ey}L${ex + (d) * 1} ${ey - 2}Q${bx + d * l * .5} ${y + up * .3 - 4} ${bx} ${y - 2}Z`, bleach(t, 0), 1, ink('#5a4a30', .8, .85)) + line(`M${ex} ${ey}l${d * 5} ${-5}M${ex - d * 4} ${ey + 1.4}l${d * 3} ${-6}`, '#c8b48e', 1.4, 1); }
  o += line(`M${tx - 2} ${ty + 1}l-5 -9M${tx + 2} ${ty + 1}l4 -10M${tx} ${ty}l0 -8`, '#c8b48e', 1.6, 1) + ell(tx, ty + 2, 3.4, 1.6, '#4a3a28', .55);
  return o;
};
TR('ghost-tree', 'a', TALL, ['dead', 'bleached'], (t, r) => ghost(t, r, -4, true));
TR('ghost-tree', 'b', TALL, ['dead', 'bleached'], (t, r) => ghost(t, r, 6, false));
// wind acacia: flat crown combed downwind (to the right), thin crooked trunk
const wacacia = (t, r, flip, big) => {
  const fy = 118; let o = sh(32, fy, 22, 5) + drift(32, fy - 1, 22, 5, t);
  const s = flip ? -1 : 1, X = (x) => flip ? 64 - x : x;
  o += path(`M${X(28)} ${fy - 2}Q${X(30)} ${fy - 30} ${X(34)} ${fy - 52}Q${X(38)} ${fy - 66} ${X(46)} ${fy - 76}L${X(49)} ${fy - 73}Q${X(41)} ${fy - 62} ${X(37)} ${fy - 50}Q${X(34)} ${fy - 28} ${X(37)} ${fy - 2}Z`, wood(t, 0), 1, ink(D.inkS, 1, .85));
  const crown = [[X(30), fy - 84, 22, 9], [X(48), fy - 82, 17, 8], [X(14), fy - 76, 12, 6], [X(40), fy - 92, 16, 8]];
  for (const [cx, cy, rx, ry] of (big ? crown : crown.slice(0, 3))) {
    o += ell(cx + 2, cy + 4, rx, ry * .8, '#2f3a1a', .22) + ell(cx, cy, rx, ry, t.lg(['#d8dc88', '#93ab52', '#5f7f3a'], 80), 1, 0, ink(D.inkG, .9, .75));
    for (let i = 0; i < 5; i++) o += ell(cx + r.range(-rx * .7, rx * .7), cy + r.range(-ry * .5, ry * .3), 3.4, 1.2, i % 2 ? '#b6c870' : '#7f9a46', .85, r.range(-14, 14));
    o += ell(cx - rx * .25, cy - ry * .4, rx * .5, ry * .22, '#f2f4b8', .5);
  }
  o += line(`M${X(34)} ${fy - 60}l${s * -8} -6M${X(36)} ${fy - 68}l${s * 6} -4`, '#5a3c20', 2, .9);
  return o;
};
TR('wind-acacia', 'a', TALL, ['acacia', 'windswept'], (t, r) => wacacia(t, r, false, true));
TR('wind-acacia', 'b', TALL, ['acacia', 'windswept'], (t, r) => wacacia(t, r, true, false));
// desert broom: dense green switches fanning from one crown
const broom = (t, r, n, col) => {
  const fy = 53; let o = sh(30, fy, 15, 4) + heap(t, 32, fy - 1, 16, 4.2);
  const sticks = Array.from({ length: n }, (_, i) => ({ a: -90 + (i - (n - 1) / 2) * (110 / n) + r.range(-6, 6), l: r.range(24, 34) })).sort((p, q) => Math.abs(q.a + 90) - Math.abs(p.a + 90));
  for (const { a, l } of sticks) { const A = a * Math.PI / 180, ex = 32 + Math.cos(A) * l, ey = fy - 3 + Math.sin(A) * l; o += line(`M32 ${fy - 3}Q${f(32 + Math.cos(A) * l * .5 + 3)} ${f(fy - 3 + Math.sin(A) * l * .6)} ${f(ex)} ${f(ey)}`, '#4a6a34', 2, .95) + line(`M32 ${fy - 3}Q${f(32 + Math.cos(A) * l * .5 + 3)} ${f(fy - 3 + Math.sin(A) * l * .6)} ${f(ex)} ${f(ey)}`, col, 1.2, 1); if (r() < .5) o += circ(ex, ey, 1.2, '#f6e07a') + circ(ex - .4, ey - .4, .5, '#fff'); }
  return o + ell(32, fy - 2, 5, 2.4, '#7a5a3a', 1);
};
TR('desert-broom', 'a', C, ['shrub', 'green'], (t, r) => broom(t, r, 14, '#8fb260'));
TR('desert-broom', 'b', C, ['shrub', 'green'], (t, r) => broom(t, r, 10, '#a4b868'));
TR('ephedra', 'a', C, ['shrub', 'green'], (t, r) => { let o = sh(30, 53, 14, 4) + heap(t, 32, 52, 15, 4); for (let i = 0; i < 9; i++) { const x = 32 + (i - 4) * 3.2, h = r.range(16, 30); let y = 52; o += line(`M${x} 52V${52 - h}`, '#4a6a34', 2.6, .95) + line(`M${x} 52V${52 - h}`, '#9ab876', 1.4, 1); for (let k = 8; k < h; k += 7) o += line(`M${x - 2} ${52 - k}h4`, '#4a6a34', .9, .9); o += circ(x, 52 - h, 1.2, i % 3 ? '#c8d890' : '#f0c870'); } return o; });
for (const v of ['a', 'b']) TR('dune-stump', v, C, ['dead', 'buried'], (t, r) => { const fy = 52; let o = sh(30, fy, 14, 4) + path(`M20 ${fy}Q18 ${fy - 14} ${v === 'a' ? 22 : 24} ${fy - 24}L${v === 'a' ? 27 : 30} ${fy - 20}L${v === 'a' ? 32 : 34} ${fy - 28}L38 ${fy - 18}L42 ${fy - 22}Q46 ${fy - 12} 44 ${fy}Z`, bleach(t, 0), 1, ink('#5a4a30', 1, .85)) + line(`M26 ${fy - 4}Q27 ${fy - 14} 28 ${fy - 20}M36 ${fy - 2}Q37 ${fy - 10} 36 ${fy - 16}`, '#8f7a5a', 1, .6) + ell(32, fy - 24, 6, 2, '#4a3a28', .5); return o + drift(32, fy - 1, 20, 5, t); });

// ================= rocks =================
const colTop = (t, r, v) => {
  const fy = 54; let o = drift(32, fy - 2, 22, 6, t, .6);
  if (v === 'a') { // fluted drum, tilted, half buried
    o += `<g transform="rotate(-8 32 40)">` + path('M16 50V28Q16 22 32 22T48 28V50Z', t.lg(['#f8dcae', '#dcae7c', '#a97a52'], 0), 1, ink(D.inkS, 1, .85)) + ell(32, 24, 16, 5.4, '#f4dcb0', 1, 0, ink(D.inkS, .9, .85)) + ell(32, 24, 11, 3.4, '#dcae7c', 1) + [0, 1, 2, 3].map(i => line(`M${22 + i * 7} 28V50`, '#a97a52', 1, .5)).join('') + `</g>`;
  } else if (v === 'b') { // lotus capital poking from the sand
    o += path('M18 52Q16 38 22 30Q32 22 42 30Q48 38 46 52Z', t.lg(['#f8dcae', '#dcae7c', '#a97a52'], 20), 1, ink(D.inkS, 1, .85)) + [24, 32, 40].map(x => path(`M${x} 50Q${x - 4} 38 ${x} 28Q${x + 4} 38 ${x} 50Z`, '#f4dcb0', .8, ink(D.inkS, .6, .7))).join('') + line('M20 36H44', '#6aaa9a', 2.6, .9) + line('M20 40H44', '#c0504a', 1.6, .9);
  } else { // square abacus block, hieroglyph hint
    o += path('M14 52V30L20 22H50V46L44 52Z', t.lg(['#f8dcae', '#dcae7c', '#a97a52'], 30), 1, ink(D.inkS, 1, .85)) + path('M14 30L20 22H50L44 30Z', '#fff0cc', 1, ink(D.inkS, .8, .8)) + path('M44 30L50 22V46L44 52Z', '#a97a52', .8) + [[20, 38], [28, 42], [36, 38]].map(([x, y]) => line(`M${x} ${y}h5M${x + 2.5} ${y}v-4M${x} ${y + 3}h5`, '#7a4a2a', 1, .8)).join('');
  }
  return o + drift(32, fy + 1, 24, 4, t, .95);
};
for (const v of ['a', 'b', 'c']) RK('column-top', v, C, ['ruin', 'buried', 'column'], (t, r) => colTop(t, r, v));
// half-buried statue head
const head = (t, v) => {
  const fy = 56; let o = ell(34, fy - 2, 26, 6, '#3b3a24', .16);
  o += path('M16 52Q12 30 24 18Q32 12 42 18Q52 28 48 52Z', t.lg(['#f8dcae', '#d09a6a', '#946a52'], 40), 1, ink(D.inkS, 1, .85));
  o += path('M20 28Q32 12 46 26L44 20Q32 8 22 22Z', v === 'a' ? '#3a6a9a' : '#c8923a', 1, ink(D.inkS, .8, .85)) + line('M22 24Q32 14 44 24', '#fff', .8, .5);   // nemes headcloth stripe
  o += ell(27, 33, 3.2, 1.8, '#4a3220', .9) + ell(39, 33, 3.2, 1.8, '#4a3220', .9) + path('M31.5 34L33 40L34.5 34Z', '#c08858', .8) + path('M28 45Q33 48 38 45', 'none', 1, { stroke: '#7a4a2a', 'stroke-width': 1.4 });
  if (v === 'b') o += path('M42 20L47 30L44 34Z', '#6a5a46', .5) + line('M36 18l4 12', '#4a3220', 1, .7);   // crack
  o += `<path d="M10 56Q14 44 24 46Q34 42 40 48Q50 44 56 56Z" fill="${t.lg(AP, 80)}" stroke="#c48a5a" stroke-width=".8" stroke-opacity=".5"/>` + ell(30, 49, 12, 3, '#fff', .35, -6);
  return o;
};
RK('statue-head', 'a', C, ['statue', 'ruin', 'signature'], (t) => head(t, 'a'));
RK('statue-head', 'b', C, ['statue', 'ruin', 'signature'], (t) => head(t, 'b'));
// dune crest cairns
const cairn = (t, r, n, flag) => {
  const fy = 52; let o = drift(32, fy - 1, 22, 6, t) + sh(32, fy, 14, 3.4);
  let y = fy - 1, w = 17; const cols = [['#f4dcb0', '#dcae7c', '#a97a52'], ['#e8c8a0', '#c8926a', '#946a52'], ['#f0d4aa', '#d4a074', '#9a704c']];
  for (let i = 0; i < n; i++) { const h = 6.4 - i * .4; o += ell(32 + r.range(-1.6, 1.6), y - h / 2, w, h, t.lg(cols[i % 3], 70), 1, r.range(-3, 3), ink(D.inkS, .9, .85)) + ell(32 - w * .3, y - h / 2 - 1.4, w * .4, h * .26, '#fff', .45); y -= h * 1.5; w -= 2.6; }
  if (flag) o += line(`M32 ${y + 3}V${y - 20}`, '#6b4a2c', 1.4, 1) + path(`M32.6 ${y - 19}h14l-3.4 3.6l3.4 3.6h-14Z`, flag, .95, ink('#5a1a2a', .6, .85));
  return o;
};
RK('crest-cairn', 'a', C, ['cairn', 'waypoint'], (t, r) => cairn(t, r, 4, null));
RK('crest-cairn', 'b', C, ['cairn', 'waypoint'], (t, r) => cairn(t, r, 5, '#b0405a'));
RK('crest-cairn', 'c', C, ['cairn', 'waypoint'], (t, r) => cairn(t, r, 3, '#3fb0ac'));
// yardang: wind-carved sandstone fin, tall
const yard = (t, r, v) => {
  const fy = 118; let o = sh(32, fy, 24, 5);
  const d = v === 'a' ? `M10 ${fy - 2}Q8 ${fy - 40} 16 ${fy - 66}Q22 ${fy - 92} 34 ${fy - 96}Q44 ${fy - 82} 42 ${fy - 62}Q50 ${fy - 40} 54 ${fy - 2}Z` : `M12 ${fy - 2}Q12 ${fy - 34} 18 ${fy - 52}Q20 ${fy - 80} 28 ${fy - 90}Q38 ${fy - 84} 40 ${fy - 60}Q46 ${fy - 36} 52 ${fy - 2}Z`;
  o += path(d, t.lg(ERGROCK, 25), 1, ink(D.inkS, 1.1, .85)) + path(d, VIO[1], .0);
  for (let i = 0; i < 7; i++) { const y = fy - 14 - i * 11; o += line(`M${14 + i * .6} ${y}q${14} ${-3 + (i % 2) * 5} ${26 - i * 1.2} ${(i % 3) - 1}`, i % 2 ? ERGROCK[2] : '#fff0d0', 1.2, .5); }
  o += path(`M${v === 'a' ? 36 : 34} ${fy - 90}Q${v === 'a' ? 50 : 46} ${fy - 60} 52 ${fy - 4}L44 ${fy - 4}Q44 ${fy - 50} ${v === 'a' ? 36 : 34} ${fy - 90}Z`, VIO[1], .3);
  o += path(`M20 ${fy - 50}Q24 ${fy - 80} 30 ${fy - 90}Q26 ${fy - 70} 24 ${fy - 50}Z`, '#fff', .35);
  return o + drift(32, fy - 1, 26, 5, t);
};
RK('yardang', 'a', TALL, ['wind-carved', 'spire'], (t, r) => yard(t, r, 'a'));
RK('yardang', 'b', TALL, ['wind-carved', 'spire'], (t, r) => yard(t, r, 'b'));
for (const [v, n] of [['a', 3], ['b', 4], ['c', 2]]) RK('ventifact', v, C, ['rock', 'faceted'], (t, r) => { let o = ''; const ps = [[26, 46, 11, 7], [41, 49, 8, 5], [34, 40, 7, 5], [18, 50, 6, 4]].slice(0, n + 1); for (const [x, y, rx, ry] of ps) { o += sh(x + 1, y + ry * .7, rx, ry * .35) + path(`M${x - rx} ${y + ry * .4}L${x - rx * .6} ${y - ry * .6}L${x + rx * .2} ${y - ry}L${x + rx} ${y - ry * .1}L${x + rx * .8} ${y + ry * .6}Z`, t.lg(ERGROCK, 55), 1, ink(D.inkS, .9, .85)) + path(`M${x - rx * .6} ${y - ry * .6}L${x + rx * .2} ${y - ry}L${x} ${y - ry * .1}Z`, '#fff', .35) + path(`M${x + rx * .2} ${y - ry}L${x + rx} ${y - ry * .1}L${x + rx * .8} ${y + ry * .6}L${x} ${y + ry * .2}Z`, VIO[1], .28); } return o + drift(32, 53, 22, 4, t, .7); });
for (const v of ['a', 'b']) RK('boulder-apricot', v, C, ['boulder'], (t, r) => erock(t, r, 32, 38, v === 'a' ? 20 : 16, v === 'a' ? 14 : 15, 3) + drift(32, 53, 24, 4, t, .8));
RK('obelisk-stub', 'a', C, ['ruin', 'buried', 'obelisk'], (t) => { const fy = 54; let o = sh(32, fy, 18, 4) + path('M22 52L25 18L32 8L39 18L42 52Z', t.lg(['#f8dcae', '#d09a6a', '#946a52'], 0), 1, ink(D.inkS, 1, .85)) + path('M32 8L39 18L42 52L34 52Z', VIO[1], .3) + path('M25 18L32 8L39 18Z', '#f3c24f', .95, ink('#5a3a0a', .7, .85)); [[28, 24], [28, 32], [28, 40]].forEach(([x, y]) => o += line(`M${x} ${y}h8M${x + 2} ${y + 2}h4`, '#7a4a2a', 1, .75)); return o + drift(32, fy, 22, 5, t); });
RK('lintel-fallen', 'a', C, ['ruin', 'buried'], (t) => { const fy = 52; let o = sh(32, fy, 24, 4) + path('M6 48L10 36L56 34L60 46L56 52H10Z', t.lg(['#f8dcae', '#d09a6a', '#946a52'], 20), 1, ink(D.inkS, 1, .85)) + path('M10 36L56 34L58 38L12 40Z', '#fff0cc', .6) + [[18, 44], [28, 43], [38, 43], [47, 42]].map(([x, y]) => line(`M${x} ${y}h4M${x + 2} ${y}v-3M${x} ${y + 3}h4`, '#7a4a2a', 1, .8)).join(''); return o + drift(14, 52, 14, 4, t) + drift(54, 52, 12, 4, t); });

// ================= grass =================
const bladeSet = (t, r, n, cx, fy, h, cols, spread = 1) => { let o = ''; for (let i = 0; i < n; i++) { const dx = (i - (n - 1) / 2) * 2.6 * spread, hh = h * r.range(.6, 1), bend = r.range(-7, 7), c = cols[i % cols.length]; o += line(`M${f(cx + dx)} ${fy}Q${f(cx + dx + bend * .4)} ${f(fy - hh * .6)} ${f(cx + dx + bend)} ${f(fy - hh)}`, c, 1.5, .98); } return o; };
for (const [v, n, h] of [['a', 12, 28], ['b', 9, 22], ['c', 15, 32], ['d', 7, 18]]) GR('dune-grass', v, C, ['grass', 'dune', 'signature'], (t, r) => { const fy = 52; return sh(31, fy, 13, 3.4) + heap(t, 32, fy - 1, 15, 3.6) + bladeSet(t, r, n, 32, fy - 1, h, ['#8f9a50', '#a8a45c', '#798a44', '#c4c27a'], 1.2) + (v === 'c' ? [-6, 2, 8].map(dx => line(`M${32 + dx} ${fy - 14}v-14`, '#b09a58', 1, .9) + ell(32 + dx, fy - 30, 1.6, 4, '#e8d8a0', 1, 0, ink('#8a7a44', .5, .8))).join('') : ''); });
for (const v of ['a', 'b']) GR('singing-reed', v, TALL, ['reed', 'plume'], (t, r) => { const fy = 118; let o = sh(30, fy, 14, 3.6) + heap(t, 32, fy - 1, 16, 4); for (let i = 0; i < (v === 'a' ? 7 : 5); i++) { const x = 32 + (i - 3) * 3.4, h = r.range(54, 86), bend = (i - 3) * 2.4 + r.range(-3, 5); o += line(`M${x} ${fy - 1}Q${x + bend * .3} ${fy - h * .6} ${x + bend} ${fy - h}`, '#8a8a44', 1.8, 1) + line(`M${x - .4} ${fy - 1}Q${x + bend * .3 - .4} ${fy - h * .6} ${x + bend - .4} ${fy - h}`, '#d4d08a', .6, .8) + ell(x + bend, fy - h - 5, 2.6, 8, t.lg(['#fff6dc', '#e0c88a', '#b09858'], 0), 1, bend * 2, ink('#7a6a38', .5, .8)); } return o; });
for (const v of ['a', 'b']) GR('sand-sedge', v, C, ['grass', 'sedge'], (t, r) => { const fy = 52; let o = sh(31, fy, 12, 3) + bladeSet(t, r, v === 'a' ? 10 : 7, 32, fy, v === 'a' ? 14 : 18, ['#7f9a58', '#98b070', '#6a8a48'], 1.1); for (let i = 0; i < 3; i++) o += circ(24 + i * 8, fy - 15 - (i % 2) * 3, 1.5, '#e8d890', 1, ink('#8a7a44', .4, .8)); return o + ell(32, fy - .4, 10, 2, '#a8703c', .18); });
GR('aristida', 'a', C, ['grass', 'feathery'], (t, r) => { const fy = 52; let o = sh(31, fy, 12, 3); for (let i = 0; i < 8; i++) { const x = 26 + i * 2.2, h = r.range(20, 30), bend = r.range(-8, 8); o += line(`M${x} ${fy}Q${x + bend * .3} ${fy - h * .5} ${x + bend} ${fy - h}`, '#b0a45c', 1.1, 1); for (let k = 0; k < 4; k++) o += line(`M${x + bend} ${fy - h + k * 2.6}l${bend > 0 ? 4 : -4} ${-2 + k * .4}`, '#e0d494', .8, .9); } return o + ell(32, fy - .4, 10, 2, '#a8703c', .16); });

// ================= props =================
for (const [v, k] of [['a', 'bronze'], ['b', 'bone'], ['c', 'glass']]) PR('chime-pole', v, TALL, ['chime', 'singing', 'signature', 'obstacle'], (t) => chimePole(t, 32, 116, v === 'b' ? 74 : 88, 1, v === 'a' ? -3 : v === 'b' ? 3 : 0, k));
PR('chime-tripod', 'a', C, ['chime', 'singing'], (t) => { const fy = 52; let o = sh(32, fy, 14, 3.4) + line(`M32 12L20 ${fy}M32 12L44 ${fy}M32 12L32 ${fy - 2}`, '#5a3c20', 2.4, 1) + line('M32 12L20 52', '#c8a070', .7, .6); for (const [dx, l] of [[-5, 10], [-1.6, 14], [1.6, 12], [5, 9]]) o += line(`M${32 + dx} 14v6`, '#5a3c20', .6, .9) + rect(32 + dx - 1.4, 20, 2.8, l, t.lg(['#f5d886', '#c8923a', '#7a5420'], 0), 1.2, 1, ink('#4a3220', .5, .85)); return o + circ(32, 12, 2, '#f3c24f', 1, ink('#5a3a0a', .5, .8)) + drift(32, fy - 1, 16, 3.6, t); });
PR('wind-bell', 'a', C, ['chime', 'bell'], (t) => { const fy = 52; let o = sh(32, fy, 12, 3) + path('M28 52L29 20H35L36 52Z', wood(t, 0), 1, ink(D.inkS, .8, .85)) + line('M29 24H46', '#5a3c20', 2.2, 1) + line('M46 24V30', '#5a3c20', .8, 1) + path('M41 30Q41 40 46 40Q51 40 51 30Z', t.lg(['#f5d886', '#c8923a', '#7a5420'], 0), 1, ink('#4a3220', .7, .85)) + circ(46, 42, 1.2, '#7a5420'); return o + drift(32, fy - 1, 16, 3.6, t); });
// bone drifts (a pile of bleached bones against a drift)
PR('bone-drift', 'a', C, ['bones', 'signature', 'decor'], (t, r) => { let o = drift(32, 50, 24, 6, t) + rib(24, 44, 16, -8) + rib(34, 42, 18, 6) + rib(28, 48, 14, 0) + bone(40, 48, 14, 14) + bone(20, 50, 12, -24); return o + skull(44, 44, .8, 12); });
PR('bone-drift', 'b', C, ['bones', 'signature', 'decor'], (t, r) => drift(32, 50, 24, 6, t) + bone(22, 44, 16, -10) + bone(36, 46, 18, 20) + bone(30, 50, 12, 80) + bone(44, 50, 10, -30) + skull(26, 48, .7, -10));
PR('bone-drift', 'c', C, ['bones', 'signature', 'decor'], (t, r) => drift(32, 50, 24, 6, t) + path('M14 50Q20 24 32 22Q44 24 50 50', 'none', 1, { stroke: '#3b3a24', 'stroke-width': 3, 'stroke-opacity': .14, transform: 'translate(1 2)' }) + [0, 1, 2, 3, 4].map(i => path(`M${16 + i * 3.4} 52Q${22 + i * 2} ${28 + i * 1.4} 32 ${24 + Math.abs(i - 2) * 2}`, 'none', 1, { stroke: '#eadcc0', 'stroke-width': 2.4, 'stroke-linecap': 'round' }) + path(`M${16 + i * 3.4} 52Q${22 + i * 2} ${28 + i * 1.4} 32 ${24 + Math.abs(i - 2) * 2}`, 'none', 1, { stroke: '#fffaf0', 'stroke-width': .9, 'stroke-linecap': 'round', transform: 'translate(-.6 -.6)' })).join('') + drift(32, 53, 22, 4, t));
PR('skull-camel', 'a', C, ['bones', 'skull'], (t) => drift(32, 50, 20, 5, t) + `<g transform="translate(32 40)">` + ell(1, 6, 14, 3, '#3b3a24', .16) + path('M-13 4Q-12 -6 -2 -7Q8 -8 12 -2Q16 2 13 7L5 8L-2 4Q-8 8 -13 4Z', '#fffaf0', 1, ink('#8a7458', .9, .85)) + circ(-3, -2, 2.6, '#4a3a2a') + path('M8 0l5 2', 'none', 1, { stroke: '#8a7458', 'stroke-width': 1 }) + line('M3 6v2M6 6.4v2M9 6v2', '#8a7458', .8, .8) + `</g>`);
// sand devil: a tall rotating dust column (alive; draw as translucent swirled bands)
const devil = (t, r, v) => {
  const fy = 118; let o = ell(32, fy, 18, 4, '#8a5a30', .22);
  for (let i = 0; i < 12; i++) { const y = fy - i * 8, w = 6 + i * (v === 'a' ? 2 : 1.4), x = 32 + Math.sin(i * .8 + (v === 'a' ? 0 : 2)) * (3 + i * .6); o += ell(x, y - 2, w, 3.2, i % 2 ? '#e8bc82' : '#f6d6a4', .62 - i * .02) + ell(x - w * .3, y - 3, w * .5, 1.2, '#fff3d6', .5) + line(`M${f(x - w)} ${y - 2}q${f(w)} 3 ${f(w * 2)} 0`, '#b87a4a', 1, .35); }
  for (let i = 0; i < 9; i++) { const a = r.range(0, 6.28), d = r.range(8, 24); o += circ(32 + Math.cos(a) * d, fy - r.range(4, 80), r.range(.6, 1.4), '#f6d6a4', .8); }
  return o;
};
PR('sand-devil', 'a', TALL, ['sand-devil', 'wind', 'signature', 'hazard'], (t, r) => devil(t, r, 'a'));
PR('sand-devil', 'b', TALL, ['sand-devil', 'wind', 'signature', 'hazard'], (t, r) => devil(t, r, 'b'));
// scarab swarm: a clot of live beetles
const swarm = (t, r, n, sp) => { let o = ell(32, 38, 22, 11, '#8a5a30', .12); for (let i = 0; i < n; i++) o += scarab(32 + r.range(-sp, sp), 38 + r.range(-sp * .55, sp * .55), r.range(.8, 1.15), r.range(0, 360), r.pick(['#2a3a5a', '#1f4a56', '#3a2a5a', '#2a4a3a'])); return o; };
PR('scarab-swarm', 'a', C, ['scarab', 'swarm', 'signature', 'creature'], (t, r) => swarm(t, r, 16, 16));
PR('scarab-swarm', 'b', C, ['scarab', 'swarm', 'signature', 'creature'], (t, r) => swarm(t, r, 9, 20));
PR('scarab-swarm', 'c', C, ['scarab', 'swarm', 'signature', 'creature'], (t, r) => { let o = ell(32, 38, 24, 9, '#8a5a30', .1); for (let i = 0; i < 14; i++) { const u = i / 14; o += scarab(8 + u * 48 + r.range(-3, 3), 44 - u * 14 + Math.sin(u * 9) * 5 + r.range(-3, 3), r.range(.8, 1.1), -26 + r.range(-20, 20), '#2a3a5a'); } return o; });
PR('scarab-big', 'a', C, ['scarab', 'creature', 'guardian'], (t) => { let o = ell(32, 48, 14, 4, '#3b3a24', .22); o += line('M20 40l-8 -3M20 44l-9 1M22 48l-7 5M44 40l8 -3M44 44l9 1M42 48l7 5', '#1a1a2a', 2, .95) + ell(32, 38, 12, 14, t.lg(['#6a8ac8', '#2a3a5a', '#10182a'], 60), 1, 0, ink('#0a0a1a', 1, .95)) + line('M32 24V52', '#0a0a1a', 1.2, .9) + ell(26, 32, 3.4, 5.4, '#9ac0f0', .6, -10) + path('M24 24Q32 14 40 24Q32 22 24 24Z', '#1a1a2a', 1, ink('#0a0a1a', .6, .9)) + line('M26 20l-5 -7M38 20l5 -7', '#1a1a2a', 1.6, 1) + circ(28, 22, 1.2, '#f3c24f') + circ(36, 22, 1.2, '#f3c24f'); return o; });
// drum used to make the dune sing
PR('singing-drum', 'a', C, ['drum', 'singing', 'signature'], (t) => { const fy = 52; let o = sh(32, fy, 17, 4) + path('M16 30V46Q16 52 32 52T48 46V30Z', t.lg(['#d8a070', '#a86a3a', '#6a3c20'], 0), 1, ink('#4a2a14', 1, .85)) + ell(32, 30, 16, 6, '#f6e8c8', 1, 0, ink('#4a2a14', 1, .85)) + ell(32, 30, 12, 4.2, '#fff6dc', 1) + ell(30, 29, 5, 1.4, '#e0d0a8', .6); for (let i = 0; i < 5; i++) o += line(`M${19 + i * 6.4} 32L${22 + i * 5} 50`, '#e8d8a8', 1, .8); o += line('M44 18L36 28', '#5a3c20', 2.2, 1) + circ(44, 17, 2.6, '#c8a070', 1, ink('#5a3c20', .7, .85)); return o + drift(32, fy - 1, 22, 4.4, t, .9); });
PR('brass-bell', 'a', C, ['bell', 'singing'], (t) => { const fy = 52; let o = sh(32, fy, 14, 3.6) + path('M20 50Q20 22 32 18Q44 22 44 50Z', t.lg(['#fff0a8', '#f3c24f', '#b8862a'], 0), 1, ink('#5a3a0a', 1, .85)) + ell(32, 50, 12, 3, '#8a6218', 1, 0, ink('#5a3a0a', .8, .85)) + ell(26, 32, 2.2, 8, '#fff', .45, -8) + circ(32, 17, 2.6, '#c8923a', 1, ink('#5a3a0a', .7, .85)) + ell(32, 48, 2.4, 3, '#5a3a0a', .9); return o + drift(32, fy - 1, 20, 4, t, .8); });
PR('hourglass-sand', 'a', C, ['hourglass', 'decor'], (t) => { const fy = 52; let o = sh(32, fy, 12, 3) + rect(20, 10, 24, 4, '#8a6238', 1.6, 1, ink(D.inkS, .8, .85)) + rect(20, 48, 24, 4, '#8a6238', 1.6, 1, ink(D.inkS, .8, .85)) + path('M23 14Q23 28 32 31Q41 28 41 14Z M23 48Q23 34 32 31Q41 34 41 48Z', 'rgba(232,244,240,.4)', 1, ink('#6a8a90', .9, .85)) + path('M26 40Q32 34 38 40L40 47H24Z', '#e8b878', 1) + path('M25 14H39Q38 17 33 19.6H31Q26 17 25 14Z', '#e8b878', 1) + line('M32 20V34', '#e8b878', 1, 1) + line('M22 12v38M42 12v38', '#8a6238', 1.6, .9); return o; });
PR('sand-anchor', 'a', C, ['stakes', 'camp'], (t, r) => { let o = ''; for (const [x, y, a] of [[20, 44, -12], [34, 48, 8], [46, 42, 14]]) o += ell(x + 1, y + 2, 5, 1.8, '#3b3a24', .18) + `<g transform="translate(${x} ${y}) rotate(${a})">` + path('M-2 4L-2.6 -14H2.6L2 4Z', wood(t, 0), 1, ink(D.inkS, .7, .85)) + `</g>` + path(`M${x - 3} ${y - 12}Q${x + 4} ${y - 4} ${x + 14} ${y + 3}`, 'none', 1, { stroke: '#c8a070', 'stroke-width': 1.2 }); return o + drift(32, 52, 22, 4, t, .8); });
PR('sand-sled', 'a', C, ['sled', 'camp'], (t) => { const fy = 50; let o = sh(32, fy, 22, 4) + path('M8 46Q6 42 12 40H50Q56 40 58 36L60 38Q58 46 50 48H14Q9 48 8 46Z', wood(t, 90), 1, ink(D.inkS, .9, .85)) + line('M12 42H52', '#e0c090', .9, .8) + [16, 28, 40].map(x => line(`M${x} 40V32`, '#5a3c20', 2, 1)).join('') + path('M14 32H46L44 26H16Z', '#a07848', 1, ink(D.inkS, .8, .85)) + line('M14 30H46', '#e0c090', .7, .7); return o + drift(14, 50, 12, 3.4, t, .8); });
PR('skiff-buried', 'a', C, ['wreck', 'buried'], (t) => { let o = sh(32, 50, 24, 4) + path('M6 34Q10 48 32 50Q54 48 58 30Q44 36 32 36Q18 36 6 34Z', wood(t, 90), 1, ink(D.inkS, 1, .85)) + [14, 24, 34, 44].map(x => line(`M${x} 36Q${x - 2} 44 ${x + 2} 49`, '#5a3c20', 1.2, .8)).join('') + line('M32 36V8', '#6b4a2c', 2.2, 1) + path('M33 10L50 30H33Z', '#e8d8b8', .9, ink('#8a7458', .8, .8)) + path('M31 12L16 34H31Z', '#d8c8a0', .8, ink('#8a7458', .8, .8)); return o + drift(32, 52, 26, 5, t); });
PR('signpost-erg', 'a', C, ['sign', 'landmark'], (t) => { const fy = 52; let o = sh(32, fy, 12, 3) + path('M30 52L31 12H34L35 52Z', wood(t, 0), 1, ink(D.inkS, .8, .85)) + path('M34 14H52L56 18L52 22H34Z', '#c8a070', 1, ink(D.inkS, .8, .85)) + path('M30 26H14L10 30L14 34H30Z', '#c8a070', 1, ink(D.inkS, .8, .85)) + line('M38 18H48M16 30H26', '#5a3c20', 1.2, .8) + circ(48, 18, 1.6, '#b0405a'); return o + drift(32, fy - 1, 16, 3.6, t); });
PR('wind-vane', 'a', TALL, ['vane', 'wind'], (t) => { const fy = 116; let o = sh(32, fy, 12, 3) + path('M30 116L31 40H33L34 116Z', wood(t, 0), 1, ink(D.inkS, .8, .85)) + path('M33 38L56 42L33 50Z', '#b0405a', .95, ink('#5a1a2a', .7, .85)) + path('M33 38L56 42L33 44Z', '#f6dcae', .9) + circ(32, 38, 2.6, '#f3c24f', 1, ink('#5a3a0a', .6, .85)) + line('M32 36V28', '#5a3c20', 1.2, 1); return o + drift(32, fy - 1, 20, 4, t); });
PR('listening-horn', 'a', C, ['horn', 'singing'], (t) => { const fy = 52; let o = sh(32, fy, 16, 3.6) + path('M12 46Q16 22 32 20L36 30Q24 32 22 46Z', t.lg(['#f5d886', '#c8923a', '#7a5420'], 40), 1, ink('#5a3a0a', .9, .85)) + ell(22, 40, 8, 10, '#3a2a14', .0) + path('M32 20Q38 16 44 22Q46 28 40 32L36 30Z', '#c8923a', 1, ink('#5a3a0a', .8, .85)) + ell(36, 26, 3, 4, '#3a2a14', .85, 20) + path('M12 46Q14 34 22 30', 'none', 1, { stroke: '#fff', 'stroke-width': 1, 'stroke-opacity': .5 }); return o + drift(24, 52, 22, 4, t, .9); });
for (const [v, c] of [['a', ['#e8b88a', '#b8764a', '#7a4a2a']], ['b', ['#f0d0a0', '#c8966a', '#8a6038']]]) PR('clay-jar-erg', v, C, ['jar', 'camp'], (t) => { const fy = 52; let o = sh(32, fy, 12, 3) + path('M24 48Q18 34 26 26L26 20H38L38 26Q46 34 40 48Q32 54 24 48Z', t.lg(c, 0), 1, ink('#4a2a14', .9, .85)) + ell(32, 20, 7, 2.2, c[2], 1, 0, ink('#4a2a14', .7, .85)) + line('M22 34Q32 38 42 34', '#fff0d0', 1, .6) + line('M23 40Q32 44 41 40', c[2], 1.4, .6) + ell(27, 34, 2, 6, '#fff', .3, -10); return o + drift(32, fy - 1, 16, 3.4, t, .8); });
PR('waterskin', 'a', C, ['camp', 'loot'], (t) => { let o = sh(32, 50, 14, 3.6) + path('M22 46Q18 32 28 24L30 18H36L38 24Q48 32 44 46Q33 52 22 46Z', t.lg(['#d8a070', '#a86a3a', '#6a3c20'], 40), 1, ink('#4a2a14', .9, .85)) + rect(29, 14, 8, 6, '#6a3c20', 1.4, 1, ink('#4a2a14', .7, .85)) + line('M24 40Q33 44 42 40', '#4a2a14', .9, .5) + ell(28, 32, 2.4, 6, '#fff', .3, -10) + line('M37 16Q46 10 50 20', '#6a3c20', 1.4, 1); return o + drift(32, 50, 20, 4, t, .8); });
PR('trail-stakes', 'a', C, ['marker', 'trail'], (t, r) => { let o = ''; for (const [x, y] of [[14, 44], [32, 40], [50, 36]]) o += ell(x + 1, y + 2, 5, 1.8, '#3b3a24', .2) + path(`M${x - 1.6} ${y + 2}L${x - 1.2} ${y - 16}H${x + 1.2}L${x + 1.6} ${y + 2}Z`, wood(t, 0), 1, ink(D.inkS, .6, .85)) + path(`M${x + 1.2} ${y - 16}h8l-2 2.4l2 2.4h-8Z`, '#b0405a', .95) + ell(x + 2, y + 2.4, 5, 1.8, t.lg(AP, 70), .95); return o; });
