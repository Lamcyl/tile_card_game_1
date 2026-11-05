// Ashkara sub-area 1: Dune Shallows (ashkara/dune-shallows). Ground, ground-detail, four 47-blob autotile sets, a driftwood fence, decals, overlays.
// Objects (trees, rocks, grass, props, interest) live in gen-ashkara-dune-shallows-objects.mjs. Palette shift: pale cream sand, bright sky tint, almost no shade.
import { T, rng, hash, f, ell, circ, rect, path, line, ink, wrapped, D, FAMS, dskel, dint, speckle, ripples, crackNet, sh, pebbleD, tuft, mix, CREAM, CLAY, creamBase, mkT, outT, tile, blobSet, C, pts, wscat, dry } from './dune-shallows-lib.mjs';

const ground = (cat, name, v, base, fn, tags = []) => tile(cat, name, v, C, ['seamless', cat === 'ground' ? 'ground' : 'ground-detail', ...tags], (t, r) => base() + fn(r, t));
const cream = (seed, o = {}) => dint(CREAM, seed, { n: 3, ...o });
const clayBase = () => dskel(CLAY) + crackNet(141, '#a08460', .38, .6);
// ---------------- ground ----------------
ground('ground', 'sand-cream', 'a', creamBase, () => cream(8101));
ground('ground', 'sand-cream', 'b', creamBase, (r) => cream(8102) + pts(r, 3).map(([x, y]) => dry(x, y, .75)).join(''));
ground('ground', 'sand-cream', 'c', creamBase, (r) => cream(8103, { cols: ['#fbf3d8', '#eadba8'] }) + pts(r, 5, 10, 10).map(([x, y]) => pebbleD(x, y, r.range(.4, .62), ['#f2e6c6', '#cdb88e'])).join(''), ['pebbles']);
ground('ground', 'sand-cream', 'd', creamBase, (r) => cream(8104) + [0, 1, 2].map(() => { const x = r.range(10, 40), y = r.range(14, 50); return line(`M${f(x)} ${f(y)}q4 -2 8 0t8 0`, '#cdb078', 1, .38); }).join(''));
const rip = (seed, n, op, w0 = 12, w1 = 20) => () => ripples(seed, n, '#c4a468', op, w0, w1);
for (const [v, s, n] of [['a', 121, 6], ['b', 122, 9], ['c', 123, 12]]) ground('ground', 'sand-wavelet', v, () => dskel(CREAM) + ripples(s, n, '#c9aa6a', .42, 10, 16), () => cream(8110 + n), ['ripples']);
// dry wadi pools: pale cracked clay with a darker basin inside the safe zone, cream sand all round
const basin = (r, rx, ry, rot) => ell(32, 33, rx + 3, ry + 3, '#fff6dc', .55, rot) + ell(32, 33, rx, ry, '#c9aa7c', .5, rot) + ell(31, 32, rx * .78, ry * .72, '#d8bf94', .6, rot) + line(`M${f(32 - rx * .8)} ${f(33)}q${f(rx * .4)} -${f(ry * .5)} ${f(rx * .8)} 0t${f(rx * .8)} 0`, '#8f7448', .9, .4);
ground('ground', 'wadi-clay', 'a', clayBase, () => dint(CLAY, 8121, { n: 3 }));
ground('ground', 'wadi-clay', 'b', clayBase, (r) => dint(CLAY, 8122, { n: 3, cols: ['#f0e4c6', '#d8c093'] }) + pts(r, 3, 14, 16).map(([x, y]) => ell(x, y, r.range(4, 7), r.range(1.6, 2.6), '#fff8e6', .6, r.range(-20, 20))).join(''), ['salt']);
ground('ground', 'wadi-clay', 'c', clayBase, (r) => dint(CLAY, 8123, { n: 3 }) + pts(r, 4, 12, 12).map(([x, y]) => pebbleD(x, y, r.range(.4, .6), ['#e4d2ac', '#a89070'])).join(''), ['pebbles']);
ground('ground', 'dry-puddle', 'a', creamBase, (r) => cream(8131) + basin(r, 15, 8, -12) + crackCurls(r, 15, 8), ['dry-pool']);
ground('ground', 'dry-puddle', 'b', creamBase, (r) => cream(8132) + basin(r, 11, 7, 18) + crackCurls(r, 11, 7) + dry(46, 22, .8), ['dry-pool']);
ground('ground', 'dry-puddle', 'c', creamBase, (r) => cream(8133) + basin(r, 17, 6, 4) + crackCurls(r, 17, 6) + pebbleD(18, 44, .6, ['#e4d2ac', '#a89070']), ['dry-pool']);
function crackCurls(r, rx, ry) { let o = ''; for (let i = 0; i < 6; i++) { const x = 32 + r.range(-rx * .7, rx * .7), y = 33 + r.range(-ry * .6, ry * .6), s = r.range(2.4, 4); o += path(`M${f(x - s)} ${f(y)}q${f(s * .6)} ${f(-s * .9)} ${f(s * 2)} ${f(-.4)}q${f(-s * .2)} ${f(s * .9)} ${f(-s * 2)} ${f(.4)}Z`, '#b99b6c', .55, ink('#8f7448', .5, .5)); } return o; }
// ramps from cream sand into the common ground
const ramp = (to, u) => ({ key: 'dramp', b: mix(CREAM.b, to.b, u), w: CREAM.w.map((c, i) => mix(c, to.w[i], u)), rim: mix(CREAM.rim, to.rim, u), tuft: mix(CREAM.tuft, to.tuft, u) });
for (const [name, to, seed] of [['cream-fine', FAMS.sand, 8140], ['cream-dune', FAMS.dune, 8150], ['cream-clay', CLAY, 8160], ['cream-hardpan', FAMS.pan, 8170]]) for (const [v, u] of [['a', .35], ['b', .7]]) ground('ground', name + '-fringe', v, () => dskel(ramp(to, u)), (r) => dint(ramp(to, u), seed + u * 10, { n: 3 }) + pts(r, 2, 12, 16).map(([x, y]) => dry(x, y, .7, mix(CREAM.tuft, to.tuft, u))).join(''), ['ramp', 'blend']);
ground('ground', 'cream-reg-fringe', 'a', () => dskel(ramp(FAMS.reg, .45)) + speckle(41, 14, ['#a08a64', '#e6d8b8'], 1.2, .6), () => dint(ramp(FAMS.reg, .45), 8181, { n: 3 }), ['ramp', 'blend']);

// ---------------- ground-detail ----------------
const shell = (x, y, s, rot, col = '#fff6e8', edge = '#b99c86') => ell(x + .8 * s, y + 1.2 * s, 3 * s, 1.6 * s, '#3b3a24', .13) + ell(x, y, 3 * s, 2.1 * s, col, 1, rot, ink(edge, .6, .7)) + line(`M${f(x - 1.4 * s)} ${f(y - .8 * s)}l${f(2.8 * s)} ${f(1.6 * s)}M${f(x - 1.4 * s)} ${f(y + .2 * s)}l${f(2.4 * s)} ${f(1.4 * s)}`, '#d9b8a0', .6, .8);
const spiral = (x, y, s, col = '#f6ead4') => circ(x + .6, y + 1, 3.6 * s, '#3b3a24', .12) + circ(x, y, 3.6 * s, col, 1, ink('#a88c6c', .6, .7)) + path(`M${f(x)} ${f(y)}m${f(.6 * s)} 0a${f(.6 * s)} ${f(.6 * s)} 0 1 1 ${f(-1.2 * s)} 0a${f(1.4 * s)} ${f(1.4 * s)} 0 1 1 ${f(2.6 * s)} 0a${f(2.3 * s)} ${f(2.3 * s)} 0 1 1 ${f(-4.6 * s)} 0`, 'none', 1, { stroke: '#c2a888', 'stroke-width': .8, 'stroke-linecap': 'round' });
ground('ground-detail', 'cream-shells', 'a', creamBase, (r) => cream(8201, { n: 2 }) + pts(r, 5, 12, 11).map(([x, y]) => shell(x, y, r.range(.8, 1.1), r.range(0, 90))).join(''), ['shell']);
ground('ground-detail', 'cream-shells', 'b', creamBase, (r) => cream(8202, { n: 2 }) + pts(r, 4, 12, 13).map(([x, y]) => spiral(x, y, r.range(.7, 1))).join('') + pts(r, 3, 10, 12).map(([x, y]) => shell(x, y, .7, r.range(0, 90))).join(''), ['shell']);
ground('ground-detail', 'cream-shells', 'c', creamBase, (r) => cream(8203, { n: 2 }) + pts(r, 8, 10, 8).map(([x, y]) => shell(x, y, r.range(.5, .8), r.range(0, 180), r.pick(['#fff6e8', '#f8dcc8', '#fbe8e0']))).join(''), ['shell']);
ground('ground-detail', 'fossil-sand', 'a', creamBase, () => cream(8211, { n: 2 }) + spiral(30, 32, 2.6, '#eadcc0') + line('M24 40q4-2 8 0', '#bfa888', .8, .6) + shell(46, 20, .9, 30), ['fossil']);
ground('ground-detail', 'fossil-sand', 'b', creamBase, () => cream(8212, { n: 2 }) + `<g stroke="#a89070" stroke-width=".7" fill="#f6ecd6"><path d="M14 36q10-9 24-2q6 3 12-1l-3 6q-6 3-12 0q-13 5-21-3Z"/><circle cx="43" cy="35" r="1.2" fill="#6b5a40" stroke="none"/><path d="M20 35l2 3M25 33l1 4M30 33l1 4M35 34l0 3" fill="none"/></g>`, ['fossil', 'fish']);
ground('ground-detail', 'fossil-sand', 'c', creamBase, (r) => cream(8213, { n: 2 }) + pebbleD(28, 30, 2.2, ['#efe2c0', '#bfa888']) + `<g stroke="#a89070" stroke-width=".8" fill="none"><path d="M22 30q6-6 12 0M24 33q4-4 8 0M26 36q2-2 4 0"/></g>` + pts(r, 3, 12, 14).map(([x, y]) => shell(x, y, .6, r.range(0, 90))).join(''), ['fossil', 'trilobite']);
const scrub = (x, y, s, c1 = '#9a8a4c', c2 = '#b8a864') => ell(x + 1, y + 2, 7 * s, 2 * s, '#3b3a24', .13) + [0, 1, 2, 3, 4, 5].map(i => line(`M${f(x)} ${f(y)}q${f((i - 2.5) * 2)} ${f(-5 * s)} ${f((i - 2.5) * 3.4)} ${f(-9 * s)}`, i % 2 ? c1 : c2, 1.2, .9)).join('');
ground('ground-detail', 'dune-scrub-sprigs', 'a', creamBase, (r) => cream(8221, { n: 2 }) + [[20, 42, 1], [46, 24, .8]].map(([x, y, s]) => scrub(x, y, s)).join(''), ['scrub']);
ground('ground-detail', 'dune-scrub-sprigs', 'b', creamBase, (r) => cream(8222, { n: 2 }) + [[16, 24, .7], [32, 44, 1.1], [50, 34, .8]].map(([x, y, s]) => scrub(x, y, s, '#a09a58', '#c4bc78')).join(''), ['scrub']);
ground('ground-detail', 'dune-scrub-sprigs', 'c', creamBase, (r) => cream(8223, { n: 2 }) + pts(r, 7, 10, 8).map(([x, y]) => dry(x, y, .65, '#9a8a4c')).join(''), ['scrub']);
ground('ground-detail', 'cairn-trail-pebbles', 'a', creamBase, (r) => cream(8231, { n: 2 }) + [[14, 46], [26, 38], [38, 31], [50, 22]].map(([x, y], i) => pebbleD(x, y, .9 + (i % 2) * .3, [D.stone[0], D.stone[1]]) + pebbleD(x + 1.6, y - 3.2, .55, [D.stone[0], D.stone[1]])).join(''), ['trail', 'cairn']);
ground('ground-detail', 'wind-tracks', 'a', creamBase, (r) => cream(8241, { n: 2 }) + `<g fill="none" stroke-linecap="round"><path d="M10 40q10-12 22-4t24-10" stroke="#c4a468" stroke-width="1.4" opacity=".55"/><path d="M10 41.4q10-12 22-4t24-10" stroke="#fff8e0" stroke-width="1" opacity=".7"/></g>` + wscat(8242, 7, (r) => ({ s: r.range(.5, 1) }), (x, y, p) => circ(x, y, p.s, '#f6e8bc', .8), 2), ['tracks']);

// ---------------- autotiles ----------------
const stroke = (d, col, w, op, dx = 0, dy = 0) => `<path d="${d}" transform="translate(${dx} ${dy})" fill="none" stroke="${col}" stroke-width="${w}" stroke-opacity="${op}" stroke-linejoin="round"/>`;
// 1. dune-crest: a low pale dune on cream sand, light on the upper-left face, a soft apricot lee on the lower right
blobSet('dune-crest', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['dune'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(creamBase(), `<path d="${G.d}" transform="translate(3 4)" fill="#b08850" opacity=".16"/>`);
    t.add(`<g clip-path="${clip}">`, dskel({ ...CREAM, b: '#f4e6bc' }) + ripples(131, 8, '#c9aa6a', .38, 10, 16), stroke(G.d, '#c79a5c', 15, .3, -5, -6), stroke(G.d, '#fffaea', 11, .6, 5, 5), '</g>');
    t.add(stroke(G.d, '#c9aa6a', 1.1, .5));
  },
});
// 2. dry-pool: a shallow dried wadi pool of pale cracked clay; the rim is a darker tide line, no water
blobSet('dry-pool', {
  mg: { n: 9, e: 9, s: 9, w: 9 }, R: 22, tags: ['dry-pool', 'wadi'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(creamBase(), stroke(G.d, '#fff6dc', 15, .5), stroke(G.d, '#b99b6c', 8, .22));
    t.add(`<g clip-path="${clip}">`, dskel({ ...CLAY, b: '#dcc59a' }) + crackNet(151, '#8f7448', .5, .74), stroke(G.d, '#b69868', 12, .38, 3, 3), stroke(G.d, '#f0e2bc', 6, .5, -2, -2), '</g>');
    t.add(stroke(G.d, '#8f7448', 1.2, .55));
  },
});
// 3. scrub-patch: dry dune scrub carpet (grey-green tussocks) growing on cream sand
const scrubFill = () => dskel({ key: 'dscr', b: '#e4d9a6', w: ['#dacf98', '#eee4b8', '#d0c58c', '#f2eac4'], rim: '#a89a60', tuft: '#8a8448' }) + wscat(161, 16, (r) => ({ s: r.range(.7, 1.1), c: r.pick(['#a09a54', '#b0aa66', '#928e4c']) }), (x, y, p) => tuft(x, y + 4, p.c, .85, p.s), 6) + speckle(162, 10, ['#f6efc4'], 1, .5);
blobSet('scrub-patch', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['scrub', 'vegetation'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(creamBase(), stroke(G.d, '#a89a58', 9, .2));
    t.add(`<g clip-path="${clip}">`, scrubFill(), stroke(G.d, '#f2ecc0', 7, .4, 0, 0), '</g>');
    t.add(stroke(G.d, '#8a8448', 1.1, .45));
  },
});
// 4. shell-bed: a fossil/shell-strewn pale patch (old sea floor) on cream sand
const shellFill = () => dskel({ ...CREAM, b: '#f6ebc8', w: ['#f0e2b4', '#fbf4da', '#e8d8a8', '#f8eed0'] }) + wscat(171, 9, (r) => ({ s: r.range(.55, .85), a: r.range(0, 180), c: r.pick(['#fff6e8', '#f8dcc8', '#fbe8e0']) }), (x, y, p) => shell(x, y, p.s, p.a, p.c), 5) + wscat(172, 3, (r) => ({ s: r.range(.5, .7) }), (x, y, p) => spiral(x, y, p.s), 5);
blobSet('shell-bed', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['shell', 'fossil'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(creamBase(), stroke(G.d, '#c9aa8a', 8, .16));
    t.add(`<g clip-path="${clip}">`, shellFill(), stroke(G.d, '#fffaf0', 7, .55), '</g>');
    t.add(stroke(G.d, '#c2a888', 1.1, .5));
  },
});

// ---------------- connect-4: driftwood-and-rope fence (N1 E2 S4 W8) ----------------
for (let m = 0; m < 16; m++) {
  const v = String(m).padStart(2, '0'), t = mkT('fences', 'fence-driftwood', v), N = m & 1, E = m & 2, S = m & 4, W = m & 8, cx = 32, cy = 40;
  t.add(ell(cx + 2, cy + 3, 7, 2.6, '#3b3a24', .16));
  const rope = (x0, y0, x1, y1, h) => line(`M${x0} ${y0 - h}Q${(x0 + x1) / 2} ${(y0 + y1) / 2 - h + 4} ${x1} ${y1 - h}`, '#9a7a4a', 1.5, .95) + line(`M${x0} ${y0 - h + 1}Q${(x0 + x1) / 2} ${(y0 + y1) / 2 - h + 5} ${x1} ${y1 - h + 1}`, '#5a3c20', .8, .5);
  const arms = [];
  if (W) arms.push([0, cy, cx, cy]); if (E) arms.push([cx, cy, 64, cy]); if (N) arms.push([cx, 0, cx, cy]); if (S) arms.push([cx, cy, cx, 64]);
  for (const [a, b, c, d] of arms) { const mid = (a === c); for (const h of [12, 22]) t.add(rope(a, b, c, d, h * (mid ? .5 : 1))); if (!mid) t.add(rect(Math.min(a, c), cy - 2, Math.abs(c - a), 4, '#3b3a24', 0, .05)); }
  t.add(path(`M${cx - 3.4} ${cy + 1}L${cx - 2.6} ${cy - 26}Q${cx} ${cy - 29} ${cx + 2.6} ${cy - 26}L${cx + 3.4} ${cy + 1}Z`, t.lg(['#f2e6cc', '#cdb890', '#8f7a5a'], 0), 1, ink('#5a4a30', .9, .85)), line(`M${cx - 1} ${cy - 2}v-20M${cx + 1.2} ${cy - 6}v-14`, '#8f7a5a', .8, .5), circ(cx - .6, cy - 26, 1, '#fff9ea', .8), path(`M${cx - 4.6} ${cy - 14}h9v2.6h-9Z`, '#9a7a4a', 1, ink('#5a3c20', .6, .8)));
  outT(t, 'fences', 'fence-driftwood', v, ['autotile', 'connect4', 'mask:' + m, 'fence', 'obstacle']);
}

import './gen-ashkara-dune-shallows-objects.mjs';
import './gen-ashkara-dune-shallows-interest.mjs';
// ---------------- decals ----------------
const dec = (name, v, fn, tags = []) => tile('decals', name, v, C, ['decal', ...tags], fn);
for (const [v, y0, w] of [['a', 26, 10], ['b', 36, 14], ['c', 30, 8], ['d', 22, 12]]) dec('ripple-small', v, () => [0, 1].map(i => line(`M${14 + i * 5} ${y0 + i * 8}q${w / 2} -3 ${w} 0t${w} 0t${w} 0`, '#c4a468', 1.2, .5) + line(`M${15 + i * 5} ${y0 + 1.4 + i * 8}q${w / 2} -3 ${w} 0t${w} 0`, '#fffbe8', 1, .7)).join(''), ['ripples']);
const mound = (t, cx, cy, rx, ry, rot = 0) => ell(cx + 2, cy + ry * .5, rx * 1.1, ry * .5, '#a8783c', .13, rot) + path(`M${f(cx - rx)} ${f(cy + ry * .4)}Q${f(cx - rx * .4)} ${f(cy - ry)} ${f(cx + rx * .15)} ${f(cy - ry * .9)}Q${f(cx + rx * .9)} ${f(cy - ry * .5)} ${f(cx + rx)} ${f(cy + ry * .4)}Q${f(cx)} ${f(cy + ry * .8)} ${f(cx - rx)} ${f(cy + ry * .4)}Z`, t.lg(['#fffaea', '#f1dfae', '#d8bc82'], 50), .95) + ell(cx - rx * .3, cy - ry * .35, rx * .4, ry * .22, '#fff', .55, -14);
dec('drift-mound', 'a', (t) => mound(t, 32, 38, 20, 9), ['dune']);
dec('drift-mound', 'b', (t) => mound(t, 30, 40, 13, 7) + mound(t, 44, 34, 9, 5), ['dune']);
dec('drift-mound', 'c', (t) => mound(t, 32, 36, 24, 6), ['dune']);
dec('drift-mound', 'd', (t) => mound(t, 24, 42, 12, 6) + mound(t, 42, 30, 14, 7) + mound(t, 50, 46, 7, 4), ['dune']);
dec('shell-scatter', 'a', (t, r) => pts(r, 5, 10, 11).map(([x, y]) => shell(x, y, r.range(.7, 1), r.range(0, 120))).join(''), ['shell']);
dec('shell-scatter', 'b', (t, r) => pts(r, 4, 10, 13).map(([x, y]) => spiral(x, y, r.range(.6, .9))).join('') + shell(48, 48, .7, 30), ['shell']);
dec('shell-scatter', 'c', (t, r) => pts(r, 9, 8, 7).map(([x, y]) => shell(x, y, r.range(.45, .7), r.range(0, 180), r.pick(['#fff6e8', '#f8dcc8']))).join(''), ['shell']);
dec('fossil-imprint', 'a', () => spiral(32, 33, 3.4, '#f2e6cc') + line('M18 46q6-3 12 0', '#bfa888', .8, .6), ['fossil']);
dec('fossil-imprint', 'b', () => `<g stroke="#a89070" stroke-width=".8" fill="#f6ecd6"><path d="M14 34q12-11 28-2q8 4 14-1l-4 8q-8 4-14 0q-16 6-24-5Z"/><circle cx="48" cy="33" r="1.4" fill="#6b5a40" stroke="none"/><path d="M20 33l2 4M26 31l1 5M32 31l1 5M38 32l0 4" fill="none"/></g>`, ['fossil']);
const liz = (x, y, a, s = 1) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})">` + ell(1, 3, 8, 2.6, '#3b3a24', .14) + path('M-9 0Q-4 -3.6 3 -2.4Q8 -2 12 -3.4Q10 1.6 4 2.2Q-3 4 -9 0Z', '#b0a868', 1, ink('#5a5a30', .6, .8)) + line('M-9 0q-6 1-10 5', '#b0a868', 1.5, 1) + line('M-3 -2l-2 -3.6M-2 2.4l-2 3.6M6 -2.2l2 -3.4M5 2l2 3.4', '#8a8448', 1.2) + circ(11, -2.8, .7, '#222') + ell(1, -1.6, 5, .9, '#d8d490', .7) + `</g>`;
dec('lizard-dune', 'a', () => liz(32, 34, -8)); dec('lizard-dune', 'b', () => liz(30, 36, 28, .9)); dec('lizard-dune', 'c', () => liz(34, 32, 182, .95) + circ(14, 40, 1, '#fffbe8', .8));
dec('tumble-trail', 'a', () => line('M6 46q10-10 20-3t18-9t14-8', '#c4a468', 1.6, .4) + [[16, 42], [30, 40], [44, 33]].map(([x, y]) => circ(x, y, 1.6, '#c4a468', .35)).join(''), ['tracks']);
dec('tumble-trail', 'b', () => line('M8 22q12 12 24 4t22 8', '#c4a468', 1.6, .4) + `<g fill="none" stroke="#b89a58" stroke-width=".8" opacity=".55"><circle cx="20" cy="30" r="3"/><circle cx="36" cy="28" r="2.4"/><circle cx="50" cy="34" r="3"/></g>`, ['tracks']);
dec('beetle-tracks', 'a', () => `<g fill="none" stroke="#a8783c" stroke-width="1" stroke-linecap="round" opacity=".5"><path d="M8 30q10 -8 20 0t20 -2"/><path d="M8 33q10 -8 20 0t20 -2" /></g>` + line('M10 29q10-8 20 0t20-2', '#fffbe8', .8, .6), ['tracks']);
dec('wagon-ruts', 'a', () => [0, 1].map(i => line(`M0 ${30 + i * 8}Q22 ${27 + i * 8} 40 ${31 + i * 8}T64 ${30 + i * 8}`, '#b08850', 2.4, .42) + line(`M0 ${28.8 + i * 8}Q22 ${25.8 + i * 8} 40 ${29.8 + i * 8}T64 ${28.8 + i * 8}`, '#fffbe8', .9, .6)).join(''), ['tracks', 'caravan']);
dec('wagon-ruts', 'b', () => [0, 1].map(i => line(`M${24 + i * 8} 0Q${22 + i * 8} 22 ${28 + i * 8} 40T${26 + i * 8} 64`, '#b08850', 2.4, .42) + line(`M${22.8 + i * 8} 0Q${20.8 + i * 8} 22 ${26.8 + i * 8} 40T${24.8 + i * 8} 64`, '#fffbe8', .9, .6)).join(''), ['tracks', 'caravan']);
dec('dry-crack', 'a', () => line('M14 30l8 4l-1 7l9 3l5 8', '#8f7448', 1.3, .6) + line('M22 34l6-5M30 44l8-2', '#8f7448', 1, .5) + line('M15 31l8 4l-1 7l9 3l5 8', '#fffbe8', .8, .5), ['crack']);
dec('dry-crack', 'b', () => line('M12 44q8-8 14-2t12-8t14-6', '#8f7448', 1.3, .55) + line('M26 42l-2 8M38 34l4 8', '#8f7448', 1, .5) + line('M13 45q8-8 14-2t12-8t14-6', '#fffbe8', .8, .5), ['crack']);
dec('sprout', 'a', (t, r) => pts(r, 3, 14, 18).map(([x, y]) => dry(x, y + 4, .6, '#8f9a50', .9)).join(''), ['scrub']);
dec('gull-feather', 'a', () => path('M20 44Q32 24 48 18Q40 32 28 46Z', '#fffdf4', 1, ink('#a89a80', .6, .8)) + line('M21 44Q34 30 47 18', '#cdbfa0', .8, .8), ['feather']);
dec('rib-fragment', 'a', () => ell(35, 40, 14, 3.4, '#3b3a24', .14) + path('M18 40Q24 28 40 30Q48 31 50 36Q40 34 32 36Q24 38 20 42Z', '#f4ead2', 1, ink('#8a7456', .8, .8)) + line('M22 38Q30 31 42 32', '#fff', .9, .7), ['bone']);
dec('sand-ring', 'a', () => ell(32, 34, 18, 9, '#c4a468', .22) + ell(32, 34, 12, 5.6, '#fff6d8', .35) + line('M16 34q16-12 32 0', '#fffbe8', 1.2, .6), ['dune']);

// ---------------- overlays (transparent; stay inside their cell, wrap across neighbours) ----------------
const ov = (name, v, fn, tags = []) => tile('overlays', name, v, C, ['overlay', ...tags], fn);
for (const [v, sd, n] of [['a', 301, 4], ['b', 302, 6]]) ov('bright-haze', v, (t) => {
  const r = rng(sd); let o = wrapped(32, 32, 34, (x, y) => ell(x, y, 34, 16, '#fffbe0', .16, -8)) + wrapped(20, 48, 28, (x, y) => ell(x, y, 26, 9, '#fff6d0', .14, 6));
  for (let i = 0; i < n; i++) { const y = r.range(4, 60), x = r.range(0, 64), w = r.range(24, 40); o += wrapped(x, y, w / 2 + 3, (xx, yy) => line(`M${f(xx - w / 2)} ${f(yy)}q${f(w / 8)} -1.8 ${f(w / 4)} 0t${f(w / 4)} 0t${f(w / 4)} 0t${f(w / 4)} 0`, '#fffdf0', 1.2, .4)); }
  return o;
}, ['light', 'haze']);
for (const [v, sd, n] of [['a', 311, 4], ['b', 312, 7], ['c', 313, 10]]) ov('spindrift', v, () => {
  const r = rng(sd); let o = '';
  for (let i = 0; i < n; i++) { const y = r.range(4, 60), x = r.range(0, 64), w = r.range(14, 26); o += wrapped(x, y, w / 2 + 2, (xx, yy) => line(`M${f(xx - w / 2)} ${f(yy)}q${f(w / 4)} -1.2 ${f(w / 2)} -.4t${f(w / 2)} .4`, '#fff4cc', 1.2, .55)); }
  for (let i = 0; i < n * 3; i++) { const x = r.range(0, 64), y = r.range(0, 64), s = r.range(.4, .9); o += wrapped(x, y, 2, (xx, yy) => circ(xx, yy, s, '#fff0b8', .7)); }
  return o;
}, ['sand', 'wind']);
ov('crest-spray', 'a', () => { let o = ''; for (let i = 0; i < 9; i++) { const x = 8 + i * 6, y = 38 - i * 2.2 + (i % 2) * 2; o += line(`M${x} ${y}q4 -1 9 ${-1 - i * .3}`, '#fff6d0', 1.2 + (i % 3) * .3, .5 - i * .02); } for (let i = 0; i < 14; i++) o += circ(14 + i * 3.4, 34 - i * 1.7 - (i % 3) * 2, .6 + (i % 2) * .3, '#fff0b8', .65); return o; }, ['sand', 'wind', 'dune']);
ov('sand-shimmer', 'a', () => { const r = rng(321); let o = ''; for (let i = 0; i < 10; i++) { const x = r.range(4, 60), y = r.range(4, 60); o += `<path d="M${f(x - 2.4)} ${f(y)}h4.8M${f(x)} ${f(y - 2.4)}v4.8" stroke="#fffdf0" stroke-width=".9" stroke-linecap="round" opacity="${f(r.range(.4, .8))}"/>`; } return o; }, ['sparkle', 'sun']);
ov('sky-tint', 'a', (t) => ell(32, 32, 64, 64, t.rg(['#eaf6ff', '#eaf6ff', '#eaf6ff'], .5, .5, .5, [.2, .1, 0]), 1), ['light']);
ov('pale-sun-glare', 'a', (t) => circ(54, 10, 38, t.rg(['#fffbe0', '#fff2b8', '#fff2b8'], .5, .5, .5, [.5, .18, 0])) + path('M20 0L64 30L64 36L14 0Z', '#fffbe0', .1), ['light', 'sun']);
