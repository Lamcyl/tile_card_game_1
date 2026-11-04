// Old Oak Wood (greenvale/old-oak-wood): ground, ground-detail, meadow<->forest blends, decals, edges, fences. Objects: gen-oakwood-objects.mjs.
import { T, P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, FAM, skeleton, inShape, blobSet, maker, bloom, scat, C4, SUBS, acorn, leafS, fronds, mush, sparkle, BIT } from './sub.mjs';
import { interior, crown, crowns } from './ground.mjs';
import { wrapped } from './lib.mjs';

const SUB = SUBS.oak, { mk, out } = maker(SUB);
const FL = FAM.floor, GR = FAM.grass;
const LEAF = ['#e8a83a', '#d2622e', '#b8b068', '#a8cf86', '#c98a3a', '#8aa84a'];

// ---- roots: random branching curves kept inside [10,54] ----
function roots(r, n, { col = '#6b4a2c', w = 3 } = {}) {
  let o = '';
  for (let i = 0; i < n; i++) {
    let x = r.range(14, 50), y = r.range(14, 50), a = r.range(0, 6.28), d = '';
    const pts = [[x, y]];
    for (let k = 0; k < 3; k++) { a += r.range(-.8, .8); x = Math.min(54, Math.max(10, x + Math.cos(a) * 9)); y = Math.min(54, Math.max(10, y + Math.sin(a) * 9)); pts.push([x, y]); }
    d = `M${f(pts[0][0])} ${f(pts[0][1])}` + pts.slice(1).map((p, k) => `Q${f((pts[k][0] + p[0]) / 2 + r.range(-2, 2))} ${f((pts[k][1] + p[1]) / 2 + r.range(-2, 2))} ${f(p[0])} ${f(p[1])}`).join('');
    o += line(d, '#3b2a18', w + 1.6, .22) + line(d, col, w, .95) + line(d, '#a8845a', w * .3, .55, { transform: 'translate(-.6 -.7)' });
    const b = pts[2]; o += line(`M${f(b[0])} ${f(b[1])}q${f(r.range(-5, 5))} ${f(r.range(3, 7))} ${f(r.range(-7, 7))} ${f(r.range(5, 9))}`.replace(/NaN/g, '0'), col, w * .6, .9);
  }
  return o;
}

// =========================== ground (floor skeleton + safe-zone interior) ===========================
const mossBits = (r, n) => { let o = ''; for (let i = 0; i < n; i++) { const x = r.range(12, 52), y = r.range(14, 52); o += ell(x, y, r.range(4, 7), r.range(2, 3.4), r.pick(['#a8cf86', '#7fae5e', '#8fc070']), .75, r.range(-30, 30)) + tuft(x - 1, y + 1, '#4d7a40', .55, .55); } return o; };
const gFloor = {
  'floor-moss': { a: () => interior(FL, 1011, { n: 3, cols: ['#a8cf86', '#7fae5e'], tufts: 1 }) + mossBits(rng(1), 5), b: () => interior(FL, 1012, { n: 4, cols: ['#9cc878', '#6f9658'], tufts: 2 }) + mossBits(rng(2), 4), c: () => interior(FL, 1013, { n: 3, cols: ['#b9d394', '#8fb26c'], tufts: 1 }) + mossBits(rng(3), 7) },
  'floor-dark': { a: () => interior(FL, 1021, { n: 4, cols: ['#5f8a58', '#6f9658'], tufts: 2 }) + ell(30, 30, 14, 8, '#2f5a34', .22, 20), b: () => interior(FL, 1022, { n: 4, cols: ['#6a8f54', '#557f4c'], tufts: 1 }) + ell(34, 34, 12, 7, '#2f5a34', .26, -20) },
  'floor-golden': { a: () => interior(FL, 1031, { n: 4, cols: ['#b8c070', '#c9c880', '#a8b865'], tufts: 0 }) + (() => { const r = rng(5); return scat(r, 5, 12, 12).map(([x, y]) => leafS(x, y, r.range(0, 180), r.pick(LEAF.slice(0, 3)), .9)).join(''); })(), b: () => interior(FL, 1032, { n: 4, cols: ['#c4c47a', '#b0ba68'], tufts: 0 }) + (() => { const r = rng(6); return scat(r, 4, 12, 13).map(([x, y]) => leafS(x, y, r.range(0, 180), r.pick(LEAF.slice(0, 3)), .9)).join(''); })() },
  // blend ground: forest floor with meadow grass creeping in (and the reverse); seamless with their own family
  'floor-grassy': { a: () => interior(FL, 1041, { n: 3, cols: ['#a8c884', '#9bbd78'], tufts: 4 }) + [[16, 20], [44, 24], [28, 44]].map(([x, y]) => tuft(x, y + 4, '#6aa04a', .85, 1.15)).join(''), b: () => interior(FL, 1042, { n: 3, cols: ['#b3d283', '#a8c884'], tufts: 3 }) + [[20, 18], [46, 40], [24, 46], [40, 16]].map(([x, y]) => tuft(x, y + 3, '#6aa04a', .85, 1.1)).join('') + bloom('clover', 34, 34, .8), c: () => interior(FL, 1043, { n: 4, cols: ['#c0d890', '#a8c884'], tufts: 5 }) + bloom('daisy', 22, 30, .7) + bloom('buttercup', 44, 42, .7) },
};
for (const [name, vars] of Object.entries(gFloor)) for (const [v, fn] of Object.entries(vars)) { const t = mk('ground', name, v); t.add(skeleton(FL), fn()); out(t, 'ground', name, v, ['seamless', 'ground', 'forest-floor', ...(name === 'floor-grassy' ? ['blend'] : [])]); }
const gGrass = { 'grass-leafy': { a: (r) => interior(GR, 1051, { n: 3, cols: ['#bcd98d', '#a8cf86'], tufts: 2 }) + scat(r, 5, 11, 12).map(([x, y]) => leafS(x, y, r.range(0, 180), r.pick(LEAF), .85)).join(''), b: (r) => interior(GR, 1052, { n: 3, cols: ['#cfe1a0', '#b3d283'], tufts: 2 }) + scat(r, 8, 10, 9).map(([x, y]) => leafS(x, y, r.range(0, 180), r.pick(LEAF), .8)).join(''), c: (r) => interior(GR, 1053, { n: 4, cols: ['#a4c878', '#8fb872'], tufts: 3 }) + scat(r, 6, 10, 11).map(([x, y], i) => i % 2 ? acorn(x, y, .9) : leafS(x, y, r.range(0, 180), r.pick(LEAF), .8)).join('') } };
for (const [name, vars] of Object.entries(gGrass)) for (const [v, fn] of Object.entries(vars)) { const t = mk('ground', name, v); t.add(skeleton(GR), fn(rng(hash(name + v)))); out(t, 'ground', name, v, ['seamless', 'ground', 'grass', 'blend']); }

// =========================== ground-detail (forest floor with detail baked in) ===========================
const gd = {
  'floor-roots': (r, v) => interior(FL, 1100 + v, { n: 3, tufts: 1 }) + roots(r, 2 + (v % 2), {}),
  'floor-leaf-litter': (r) => scat(r, 12, 9, 8).map(([x, y]) => leafS(x, y, r.range(0, 180), r.pick(LEAF), .95)).join(''),
  'floor-ferns': (r) => scat(r, 3, 14, 18).map(([x, y]) => fronds(x, y + 7, 5, 11, ['#6fb560', '#4a9a50', '#3f8048'], 1.8)).join(''),
  'floor-acorns': (r) => scat(r, 6, 9, 10).map(([x, y], i) => i % 3 ? acorn(x, y, 1) : leafS(x, y, r.range(0, 180), r.pick(LEAF), .9)).join(''),
  'floor-mushrooms': (r) => scat(r, 4, 14, 14).map(([x, y], i) => mush({ rg: () => '' , lg: (c) => c[0] }, x, y + 7, .55, i % 2 ? ['#e8b56a', '#b8843a'] : ['#e0583f', '#a82a20'], { spots: i % 2 === 0 })).join(''),
  'floor-violets': (r) => scat(r, 8, 9, 9).map(([x, y], i) => bloom('cornflower', x, y, .55, i % 2 ? '#a58ad8' : '#c9b3ee') + tuft(x - 3, y + 3, '#4d7a40', .6, .5)).join(''),
  'floor-twigs': (r) => scat(r, 6, 11, 11).map(([x, y]) => { const a = r.range(0, 3.14), l = r.range(7, 11); return line(`M${f(x)} ${f(y)}l${f(Math.cos(a) * l)} ${f(Math.sin(a) * l * .5)}M${f(x + Math.cos(a) * l * .5)} ${f(y + Math.sin(a) * l * .25)}l${f(Math.cos(a + 1) * 4)} ${f(Math.sin(a + 1) * 2)}`, '#6b4a2c', 1.5, .95); }).join(''),
  'floor-stones-moss': (r) => scat(r, 5, 11, 12).map(([x, y]) => ell(x + 1, y + 1.6, 5, 1.8, '#3b3a24', .16) + ell(x, y, 4.4, 3, '#a2a596', 1, 0, ink(P.inkR, .6, .6)) + ell(x - 1.2, y - 1, 2.2, 1.2, '#cfd0c4', .9) + ell(x - .6, y - 2, 3.4, 1.4, '#7fae5e', .95)).join(''),
};
let k = 0;
for (const [name, fn] of Object.entries(gd)) for (const [vi, v] of (name === 'floor-roots' ? ['a', 'b', 'c'] : ['a', 'b']).entries()) {
  const t = mk('ground-detail', name, v), r = rng(hash(name + v)); t.add(skeleton(FL), name === 'floor-roots' ? '' : interior(FL, 1200 + k++, { n: 3, tufts: 1 }), fn(r, vi));
  out(t, 'ground-detail', name, v, ['seamless', 'ground', 'forest-floor', 'decal-baked']);
}
// glowing mushroom floor + spore glow floor (cool-glow accent for hollow areas)
for (const [v, glow] of [['a', ['#9fe8f0', '#4a9ab8']], ['b', ['#f6c0f0', '#a864c0']]]) {
  const t = mk('ground-detail', 'floor-glow-shrooms', v), r = rng(hash('glowfloor' + v));
  t.add(skeleton(FL), interior(FL, 1250 + (v === 'a' ? 0 : 1), { n: 3, cols: ['#6f9658', '#5f8a58'], tufts: 1 }));
  const pts = scat(r, 4, 14, 14);
  for (const [x, y] of pts) t.add(ell(x, y + 5, 11, 5, glow[0], .22));
  for (const [x, y] of pts) t.add(mush(t, x, y + 6, .5, glow, { spots: false, glow: false, stem: '#f0fbff' }), circ(x + 4, y - 2, 1, '#fff', .8));
  for (let i = 0; i < 6; i++) t.add(circ(r.range(10, 54), r.range(10, 54), r.range(.8, 1.3), glow[0], .8));
  out(t, 'ground-detail', 'floor-glow-shrooms', v, ['seamless', 'ground', 'forest-floor', 'decal-baked', 'glow']);
}

// =========================== decals ===========================
const decal = (name, v, fn) => { const t = mk('decals', name, v); fn(t, rng(hash(name + v))); out(t, 'decals', name, v, ['overlay', 'decal', 'transparent']); };
for (const v of ['a', 'b']) decal('moss-carpet', v, (t, r) => { t.add(ell(32, 36, 22, 13, '#7fae5e', .5, -10), ell(30, 34, 17, 9, '#a8cf86', .6, 10), ell(34, 38, 9, 4, '#8fc070', .6)); for (const [x, y] of scat(r, 5, 18, 8)) t.add(tuft(x, y + 3, '#4d7a40', .65, .6)); });
for (const v of ['a', 'b', 'c']) decal('leaf-pile', v, (t, r) => { t.add(ell(32, 42, 16, 7, '#3b3a24', .12)); for (let i = 0; i < 20; i++) { const a = r.range(0, 6.28), d = Math.sqrt(r()) * 15; t.add(leafS(32 + Math.cos(a) * d, 38 + Math.sin(a) * d * .5, r.range(0, 180), r.pick(LEAF), .95)); } });
for (const v of ['a', 'b']) decal('acorn-scatter', v, (t, r) => { for (const [x, y] of scat(r, 6, 14, 10)) t.add(acorn(x, y + 2, 1.1)); });
for (const v of ['a', 'b']) decal('root-web', v, (t, r) => t.add(roots(r, 3, { w: 3.4 })));
for (const v of ['a', 'b']) decal('paw-prints', v, (t, r) => { const pr = (x, y, a, s = 1) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})">${ell(0, 0, 2.2, 1.8, '#6a5a44', .5)}${[-3, -1, 1, 3].map((dx, i) => circ(dx, -3 - (i % 3 === 1 || i === 2 ? 1 : 0), .9, '#6a5a44', .5)).join('')}</g>`; t.add(pr(16, 46, 60), pr(26, 38, 75), pr(38, 32, 60), pr(48, 24, 70)); });
for (const v of ['a', 'b']) decal('fallen-branch', v, (t, r) => { t.add(ell(34, 42, 22, 3, '#3b3a24', .14)); t.add(line('M10 38Q30 34 54 40', '#3b2a18', 5, .3), line('M10 37Q30 33 54 39', '#6b4a2c', 4, 1), line('M10 36Q30 32 54 38', '#a8845a', 1, .6), line('M30 34l8 -8M42 38l8 -4M22 36l-4 -6', '#6b4a2c', 2, 1), ell(10, 37, 1.8, 2.4, '#e2c892', 1, 0, ink(P.inkW, .5, .7)), v === 'b' ? bloom('clover', 34, 33, .6) + ell(26, 33, 6, 1.6, '#7fae5e', .9) : ''); });
for (const v of ['a', 'b']) decal('web-dew', v, (t, r) => { const c = [32, 32]; t.add(ell(32, 44, 16, 3, '#3b3a24', .0)); let d = ''; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + (v === 'b' ? .3 : 0); d += `M32 32L${f(32 + Math.cos(a) * 20)} ${f(32 + Math.sin(a) * 18)}`; } t.add(line(d, '#f4f4ea', .8, .85)); for (const rad of [6, 11, 16, 20]) { let dd = ''; for (let i = 0; i <= 8; i++) { const a = i / 8 * 6.283, rr = rad * (i % 2 ? .93 : 1); dd += (i ? 'L' : 'M') + f(32 + Math.cos(a) * rr) + ' ' + f(32 + Math.sin(a) * rr * .9); } t.add(line(dd, '#f4f4ea', .7, .6)); } for (const [x, y] of [[40, 28], [26, 38], [34, 46], [20, 24]]) t.add(circ(x, y, 1, '#fff', .95), circ(x - .3, y - .3, .35, '#cfe8f0')); });
for (const v of ['a', 'b', 'c', 'd']) decal('blend-fringe', v, (t, r) => {   // scatter along a meadow/forest border: tufts and fallen leaves mixed
  for (const [x, y] of scat(r, 5, 10, 12)) t.add(tuft(x, y + 4, '#5f9a48', .85, 1.1));
  for (const [x, y] of scat(r, 6, 10, 10)) t.add(leafS(x, y, r.range(0, 180), r.pick(LEAF), .9));
  if (v === 'c') t.add(fronds(32, 52, 3, 9, ['#6fb560', '#4a9a50'], 1.6));
  if (v === 'd') t.add(bloom('clover', 22, 30, .8), bloom('daisy', 44, 40, .7));
});

// =========================== edges: meadow <-> forest blends and oak tree line (47 blob each) ===========================
const LEAFPOS = (() => { const r = rng(hash('fp-leaves')); return Array.from({ length: 16 }, () => [r.range(8, 56), r.range(8, 56), r.range(0, 180), r.pick(LEAF), r.range(0, 1)]); })();
// forest-floor patch growing out of meadow grass: soft pigment feather, leaf litter at the fringe
blobSet(SUB, 'floor-patch', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['transition', 'grass-to-forest-floor', 'blend'],
  build(t, G) {
    const clip = t.clip(G.d), id = clip.slice(5, -1);
    t.add(skeleton(GR));
    t.add(path(G.d, 'none', 1, { stroke: '#7fa862', 'stroke-width': 13, 'stroke-opacity': .16, 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#8fb26c', 'stroke-width': 8, 'stroke-opacity': .3, 'stroke-linejoin': 'round' }));
    t.add(`<g clip-path="url(#${id})">`, skeleton(FL), path(G.d, 'none', 1, { stroke: '#6f9658', 'stroke-width': 9, 'stroke-opacity': .35, 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#a8c884', 'stroke-width': 3, 'stroke-opacity': .45, 'stroke-linejoin': 'round' }), '</g>');
    t.add(path(G.d, 'none', 1, { stroke: '#5f8f4c', 'stroke-width': 1.1, 'stroke-opacity': .3, 'stroke-linejoin': 'round' }));
    for (const [x, y, a, c, u] of LEAFPOS) if (inShape(G, x, y, 5)) t.add(u < .75 ? leafS(x, y, a, c, .85) : tuft(x, y + 3, '#5f9a48', .7, .8));
  },
});
// meadow clearing inside the wood: grass patch in forest floor
blobSet(SUB, 'grass-clearing', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['transition', 'forest-floor-to-grass', 'blend', 'clearing'],
  build(t, G) {
    const clip = t.clip(G.d), id = clip.slice(5, -1);
    t.add(skeleton(FL));
    t.add(path(G.d, 'none', 1, { stroke: '#2f5a34', 'stroke-width': 12, 'stroke-opacity': .14, 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#a8cf86', 'stroke-width': 8, 'stroke-opacity': .35, 'stroke-linejoin': 'round' }));
    t.add(`<g clip-path="url(#${id})">`, skeleton(GR), path(G.d, 'none', 1, { stroke: '#dfe8ae', 'stroke-width': 9, 'stroke-opacity': .55, 'stroke-linejoin': 'round' }), '</g>');
    t.add(path(G.d, 'none', 1, { stroke: '#7fa862', 'stroke-width': 1.1, 'stroke-opacity': .35, 'stroke-linejoin': 'round' }));
    const r = rng(hash('clr-flowers')); for (let i = 0; i < 9; i++) { const x = r.range(9, 55), y = r.range(9, 55), kd = r.pick(['daisy', 'buttercup', 'clover', 'cosmos']); if (inShape(G, x, y, 7)) t.add(bloom(kd, x, y, .8, kd === 'cosmos' ? '#f6a0b8' : null)); }
  },
});
// forest edge with old oaks: broad, deep and mixed crowns, darker floor under the trees
const OAK_PAL = [['#7dbb78', '#3f8a4c', '#27583a'], ['#9fc46a', '#5f8f3c', '#3a5f2c'], ['#6fae78', '#356f46', '#214a34'], ['#b4c868', '#7a9a3c', '#4a6a2a']];
function oakCrown(t, cx, cy, r, seed, cols) {
  const rr = rng(seed + 77), o = [];
  o.push(crown(t, cx, cy, r, seed, cols));
  for (let i = 0; i < 3; i++) o.push(circ(cx + rr.range(-r * .5, r * .5), cy + rr.range(-r * .3, r * .5), r * .22, cols[2], .22));
  if (seed % 3 === 0) for (let i = 0; i < 3; i++) o.push(acorn(cx + rr.range(-r * .5, r * .5), cy + rr.range(-r * .1, r * .5), .55));
  return o.join('');
}
const oakEdge = (name, onGrass, tags) => blobSet(SUB, name, {
  mg: { n: 4, e: 4, s: 4, w: 4 }, R: 24, tags: ['forest', 'tree-line', 'oak', ...tags],
  build(t, G) {
    const clip = t.clip(G.d), id = clip.slice(5, -1), r = rng(hash('oakshade'));
    t.add(skeleton(onGrass ? GR : FL));
    t.add(path(G.d, 'none', 1, { stroke: '#2f5a34', 'stroke-width': 9, 'stroke-opacity': onGrass ? .16 : .24, 'stroke-linejoin': 'round' }));
    let sh = ''; for (let i = 0; i < 8; i++) { const x = r.range(0, T), y = r.range(0, T), rx = r.range(10, 18); sh += wrapped(x, y, rx, (a, b) => ell(a, b, rx, rx * .7, '#2f5a34', .34, r.range(0, 180))); }
    const mr = rng(hash('oakfloor')); let fl = ''; for (let i = 0; i < 4; i++) { const x = mr.range(0, T), y = mr.range(0, T); fl += wrapped(x, y, 8, (a, b) => ell(a, b, 7, 3, '#a8cf86', .5, mr.range(0, 180))); }
    t.add(`<g clip-path="url(#${id})">`, skeleton(FL), sh, fl, '</g>');
    crowns(t, G, { pal: OAK_PAL, tag: 'oak', draw: oakCrown });
  },
});
oakEdge('oak-forest', true, ['grass-to-forest']);        // oak tree line on meadow grass
oakEdge('oak-grove', false, ['inside-wood']);            // same oaks bordering forest floor (groves and thickets inside the wood)

// =========================== fences / walls (16 connect-4 pieces) ===========================
function connectSet(name, draw, tags = []) { for (let m = 0; m < 16; m++) { const t = mk('fences', name, String(m).padStart(2, '0')); draw(t, m); out(t, 'fences', name, String(m).padStart(2, '0'), ['autotile', 'connect4', 'mask:' + m, 'obstacle', ...tags]); } }
const armX = (m) => [m & C4.W ? 0 : 32, m & C4.E ? 64 : 32];
// woven wattle fence (branches between stakes): weave phase locked to x so arms continue
connectSet('fence-wattle', (t, m) => {
  const [x0, x1] = armX(m), by = 48, cx = 32;
  t.add(ell(cx + 2, by + 3, 8, 2.6, '#3b3a24', .22)); if (x1 > x0) t.add(rect(x0 + 1, by + 1.5, x1 - x0, 2.6, '#3b3a24', 1.3, .17));
  const vert = (x, y0, y1, w = 4) => rect(x - w / 2, y0, w, y1 - y0, t.lg(['#c9a874', '#8a6038'], 0), 1, 1, ink(P.inkW, .7, .7));
  if (m & C4.N) t.add(vert(cx, 0, by - 2, 5), rect(cx - 2.5, 2, 5, 3, '#e2c892', 0, .5));
  if (x1 > x0) {
    for (const sx of [0, 16, 32, 48, 64]) if (sx > x0 && sx < x1) t.add(vert(sx, 24, by + 1, 3.2));
    for (let row = 0; row < 4; row++) { const y = 28 + row * 5; let d = ''; for (let x = x0; x <= x1; x += 8) d += (x === x0 ? 'M' : 'L') + f(x) + ' ' + f(y + (((x / 8 + row) | 0) % 2 ? 1.8 : -1.8)) + ' '; t.add(line(d, '#3b2a18', 4.2, .25), line(d, row % 2 ? '#a8784a' : '#8a6038', 3.4, 1), line(d, '#d8b080', 1, .5, { transform: 'translate(0 -.9)' })); }
  }
  t.add(vert(cx, 18, by + 1, 5.4), path(`M${cx - 2.7} 18L${cx} 14.5L${cx + 2.7} 18Z`, '#c9a874', 1, ink(P.inkW, .8, .8)));
  if (m & C4.S) t.add(vert(cx, by - 1, 64, 5), rect(cx - 2.5, by + 1, 5, 3, '#e2c892', 0, .5), rect(cx - 2.5, 60, 5, 4, '#3b3a24', 0, .12));
  t.add(path('M26 49q4-3 7 0q-4 2-7 0Z', '#86b865', .9), tuft(cx + 10, by + 2, '#4d7a40', .8, .6));
}, ['oak-wood']);
// mossy shrine wall
connectSet('wall-stone-mossy', (t, m) => {
  const [x0, x1] = armX(m), cx = 32, by = 50, top = 28, g = t.lg(['#cfd0c4', '#a2a596', '#74786a'], 90);
  t.add(ell(cx + 2, by + 3, 12, 3.4, '#3b3a24', .2)); if (x1 > x0) t.add(rect(x0 + 1, by + 2, x1 - x0, 3, '#3b3a24', 1.3, .17));
  if (m & C4.N) { t.add(rect(cx - 8, 0, 16, by - 14, t.lg(['#bfc0b0', '#8a8e7c'], 0), 3, 1, ink(P.inkR, .8, .75))); for (let y = 6; y < by - 20; y += 12) t.add(rect(cx - 8, y, 16, 1, P.inkR, 0, .35)); }
  if (x1 > x0) {
    t.add(rect(x0, top, x1 - x0, by - top, g, 0, 1), rect(x0, top, x1 - x0, 3, '#e8eadc', 0, .55), rect(x0, top, x1 - x0, 1, P.inkR, 0, .6), rect(x0, top + 11, x1 - x0, 1, P.inkR, 0, .4), rect(x0, by - 1, x1 - x0, 1.2, P.inkR, 0, .7));
    for (const jx of [8, 24, 40, 56]) if (jx > x0 && jx < x1) t.add(rect(jx - .5, top + 1, 1, 10, P.inkR, 0, .35));
    for (const jx of [0, 16, 32, 48, 64]) if (jx > x0 && jx < x1) t.add(rect(jx - .5, top + 12, 1, by - top - 13, P.inkR, 0, .35));
    for (const [mx, w] of [[12, 12], [44, 14], [58, 8]]) if (mx > x0 && mx + w < x1 + 4) t.add(path(`M${mx} ${top}q${w / 2} -2 ${w} 0q-1 6 -${w * .3} 7q-${w * .3} -3 -${w * .7} -1Z`, '#86b865', .95));
  }
  t.add(rect(cx - 9, top - 1, 18, by - top + 2, g, 4, 1, ink(P.inkR, 1, .8)), rect(cx - 9, top - 1, 18, 4, '#e8eadc', 3, .55), line(`M${cx - 9} ${top + 11}H${cx + 9}`, P.inkR, 1, .4));
  if (m & C4.S) t.add(rect(cx - 8, by - 2, 16, 64 - by + 2, t.lg(['#bfc0b0', '#8a8e7c'], 0), 3, 1, ink(P.inkR, .8, .75)), rect(cx - 8, 60, 16, 4, '#3b3a24', 0, .12));
  t.add(path(`M${cx - 10} ${top + 1}Q${cx - 5} ${top - 6} ${cx + 1} ${top - 1}Q${cx + 5} ${top - 5} ${cx + 9} ${top + 1}Q${cx} ${top + 5} ${cx - 10} ${top + 1}Z`, '#6fa050', .98, ink('#3f6a38', .5, .6)), path(`M${cx - 9} ${by - 1}q3 -7 5 -2q2 4 -1 6Z`, '#86b865', .9), tuft(cx + 10, by + 2, '#4d7a40', .8, .6));
  if (m % 3 === 0) t.add(mush(t, cx + 6, top, .35, ['#e8b56a', '#b8843a'], { spots: false }));
}, ['oak-wood', 'wall', 'ruin']);
// shimenawa rope fence on cedar posts: rope sags between posts, paper shide hang from it
connectSet('fence-shimenawa', (t, m) => {
  const [x0, x1] = armX(m), by = 48, cx = 32, post = t.lg(['#b08a58', '#6b4a2c'], 0);
  t.add(ell(cx + 2, by + 3, 8, 2.6, '#3b3a24', .22));
  if (m & C4.N) t.add(rect(cx - 2, 0, 4, by - 2, post, 1, 1, ink(P.inkW, .7, .7)));
  if (m & C4.S) t.add(rect(cx - 2.2, by - 1, 4.4, 64 - by + 1, post, 1, 1, ink(P.inkW, .7, .7)), rect(cx - 2.2, 60, 4.4, 4, '#3b3a24', 0, .12));
  const span = (xa, xb) => { const ya = 30; let o = path(`M${xa} ${ya}Q${(xa + xb) / 2} ${ya + 8} ${xb} ${ya}`, 'none', 1, { fill: 'none', stroke: '#a88a4a', 'stroke-width': 4.4, 'stroke-opacity': .95, 'stroke-linecap': 'round' }) + path(`M${xa} ${ya}Q${(xa + xb) / 2} ${ya + 8} ${xb} ${ya}`, 'none', 1, { fill: 'none', stroke: '#f2e4b4', 'stroke-width': 3, 'stroke-dasharray': '3 2', 'stroke-linecap': 'butt' }); const mx = (xa + xb) / 2; o += path(`M${mx - 2} ${ya + 5}l4 0l-1 7l3 -1l-2 7l-4 -2l1 -5l-3 1Z`, '#fffaf0', 1, ink('#b8b09a', .7, .8)); return o; };
  if (x1 > x0) { if (m & C4.W) t.add(span(0, 32)); if (m & C4.E) t.add(span(32, 64)); }
  t.add(path(`M${cx - 3.6} ${by}V24L${cx} 20.5L${cx + 3.6} 24V${by}Z`, post, 1, ink(P.inkW, .9, .8)), rect(cx - 2.6, 25, 1.2, 19, '#e2c892', 0, .45), ell(cx, 31, 5, 2.4, '#f2e4b4', 1, 0, ink('#a88a4a', .8, .8)));
  if (m & C4.S) t.add(rect(cx - 2.2, by - 1, 4.4, 4, post, 0, 0));
  t.add(tuft(cx - 8, by + 2, '#4d7a40', .8, .6));
}, ['oak-wood', 'shrine']);

await import('./gen-oakwood-objects.mjs');
