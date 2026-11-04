// Firefly Marsh autotiles (47-blob) and connect-4 sets: pools, peat, mud, reed bed, dusk blends, boardwalks, reed fence.
import { T, P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, FAM, skeleton, inShape, blobSet, maker, scat, C4, SUBS, sparkle, BIT, blobGeom } from './sub.mjs';
import { crowns } from './ground.mjs';
import { wrapped } from './lib.mjs';
import { MOSS } from './ruins-lib.mjs';
import { connect, armX, sym, use } from './rice-lib.mjs';
import { DUSK, DAWN, PEAT, MUD, BOG, MWAT, MDEEP, duskBase, marshFill, duckPatch, pad, cattailS, reedS, blade } from './marsh-lib.mjs';

const SUB = SUBS.marsh, GR = FAM.grass;
const rr = (s) => rng(hash(s));
let CUR = null;   // the tile being built: stroked outlines share one <path> in defs and are drawn with <use> (smaller files)
const sk = (d, c, w, o) => { CUR._sp = CUR._sp || {}; if (!CUR._sp[d]) { CUR._sp[d] = CUR.id(); CUR.defs.push(`<path id="${CUR._sp[d]}" d="${d}"/>`); } return `<use href="#${CUR._sp[d]}" fill="none" stroke="${c}" stroke-width="${w}" stroke-opacity="${o}" stroke-linejoin="round"/>`; };
const clipOf = (t, G) => { CUR = t; const c = t.clip(G.d); return c.slice(5, -1); };

// ---------- water: peat bank, marsh water, duckweed / lily variants (same outline as water-shore: margin 9, R 22) ----------
const MP = { n: 9, e: 9, s: 9, w: 9 };
function pool(kind) {
  return (t, G) => {
    const id = clipOf(t, G), r = rr('mp' + kind);
    t.add(duskBase(), sk(G.d, '#7a6c48', 13, .2), sk(G.d, PEAT.w[1], 11, .55));
    t.add(`<g clip-path="url(#${id})">`, marshFill());
    if (kind === 'weed') for (const [x, y, rx] of [[14, 20, 12], [48, 14, 9], [34, 44, 13], [8, 52, 9]]) { const id = sym(t, duckPatch(rr('mpw' + x + y), 0, 0, rx, rx * .55, 11)); t.add(wrapped(x, y, rx, (a, b) => use(id, a, b))); }
    if (kind === 'lily') for (const [x, y, s, b] of [[16, 20, 7, 'pink'], [46, 14, 6, null], [36, 44, 7, 'white'], [8, 52, 5.4, null], [28, 26, 4.6, 'bud']]) { const id = sym(t, pad(0, 0, s, b)); t.add(wrapped(x, y, s + 3, (a, b2) => use(id, a, b2))); }
    t.add(sk(G.d, '#d6e6ea', 12, .38), sk(G.d, '#f0e6f2', 4.5, .4), '</g>', sk(G.d, '#4a6f90', 1.3, .5));
    for (let i = 0; i < 6; i++) { const x = r.range(6, 58), y = r.range(6, 58); if (!inShape(G, x, y, 3) && inShape(G, x, y, -10)) t.add(tuft(x, y + 3, '#6e7a3e', .8, .7)); }
  };
}
blobSet(SUB, 'marsh-pool', { mg: MP, R: 22, tags: ['water', 'pool', 'marsh', 'shore', 'dusk'], build: pool('plain') });
blobSet(SUB, 'marsh-pool-weed', { mg: MP, R: 22, tags: ['water', 'pool', 'marsh', 'duckweed', 'dusk'], build: pool('weed') });
blobSet(SUB, 'marsh-pool-lily', { mg: MP, R: 22, tags: ['water', 'pool', 'marsh', 'lily', 'dusk'], build: pool('lily') });
blobSet(SUB, 'marsh-deep', {
  mg: { n: 11, e: 11, s: 11, w: 11 }, R: 24, tags: ['water', 'deep', 'marsh', 'dusk'],
  build(t, G) { const id = clipOf(t, G); t.add(marshFill(), sk(G.d, '#6f93ae', 14, .35), `<g clip-path="url(#${id})">`, marshFill(MDEEP), sk(G.d, '#8fb4cc', 9, .4), '</g>', sk(G.d, '#3f6688', 1.2, .45)); },
});
// ---------- feathered ground patches ----------
function patch(under, over, { rim = '#7a6c48', feather = '#bdb286', tint = null, extra = null, sheen = false } = {}) {
  return (t, G) => {
    const id = clipOf(t, G), r = rr('pt' + over.key + under.key);
    t.add(under.k === 'moss' ? skeleton(MOSS) : skeleton(under), sk(G.d, feather, 15, .3), sk(G.d, over.rim, 9, .2));
    t.add(`<g clip-path="url(#${id})">`, tint ? tint() : skeleton(over), sk(G.d, over.w[1], 8, .5), sheen ? sk(G.d, '#e6dcd0', 3, .3) : '', '</g>', sk(G.d, rim, 1.2, .4));
    if (extra) extra(t, G, r);
  };
}
const grassUnder = GR, mossUnder = { ...MOSS, k: 'moss' };
blobSet(SUB, 'peat-patch', { mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['peat', 'patch', 'marsh', 'blend'], build: patch(DUSK, PEAT, { feather: '#a8a070' }) });
blobSet(SUB, 'mud-flat', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['mud', 'patch', 'marsh', 'wet'],
  build: patch(DUSK, MUD, { rim: '#76684e', feather: '#a39379', sheen: true, extra: (t, G, r) => { for (let i = 0; i < 3; i++) { const x = r.range(14, 50), y = r.range(14, 50); if (inShape(G, x, y, 8)) t.add(ell(x, y, 5, 1.8, '#a9c0cc', .6, r.range(-10, 10)), ell(x - 1, y - .6, 2.4, .6, '#fff', .6)); } } }),
});
blobSet(SUB, 'bog-carpet', { mg: { n: 8, e: 8, s: 8, w: 8 }, R: 22, tags: ['bog', 'moss', 'patch', 'marsh'], build: patch(PEAT, BOG, { rim: '#5f7a48', feather: '#9aa874' }) });
// dusk tint blended into day grass / mossy ruins (feathered, no rim): the dusk-to-day transition
const duskOnly = () => duskBase();
blobSet(SUB, 'dusk-patch', { mg: { n: 8, e: 8, s: 8, w: 8 }, R: 28, tags: ['dusk', 'blend', 'patch', 'marsh', 'grass'], build: patch(GR, DUSK, { rim: '#6e8a6c', feather: '#b9c49c', tint: duskOnly }) });
blobSet(SUB, 'dusk-patch-moss', { mg: { n: 8, e: 8, s: 8, w: 8 }, R: 28, tags: ['dusk', 'blend', 'patch', 'marsh', 'moss', 'mossy-ruins'], build: patch(mossUnder, DUSK, { rim: '#6e8a6c', feather: '#b9c49c', tint: duskOnly }) });
// reed bed: clumps of reeds and cattails on a lattice shared by all pieces (same engine as the forest edge)
function reedBody(seed) {   // drawn at the origin for a clump of radius 14, reused with <use> at the slot radius
  const rn = rng(seed * 31 + 7), r = 14, o = [];
  o.push(ell(0, r * .45, r * .9, r * .42, '#6e7a3e', .7, 0), ell(-r * .2, r * .3, r * .55, r * .25, '#a8b46e', .5));
  const n = 9; for (let i = 0; i < n; i++) { const a = (i - (n - 1) / 2) * .22, hh = r * rn.range(1.1, 1.7), x = (i - (n - 1) / 2) * r * .13; o.push(reedS(x, r * .55, hh, Math.sin(a) * hh * .9 + rn.range(-1, 1), i % 3 ? '#8ab45c' : '#6e9a48', 1.3)); }
  for (let k = 0; k < 3; k++) o.push(cattailS((k - 1) * r * .42, r * .5, r * rn.range(1, 1.3), rn.range(-2, 2), .75));
  return o.join('');
}
function reedClump(t, cx, cy, r, seed) {
  const k = seed % 4; t._rs = t._rs || {}; if (!(k in t._rs)) t._rs[k] = sym(t, reedBody(k));
  return ell(cx + r * .1, cy + r * .8, r * .95, r * .3, '#2e2c1a', .2) + use(t._rs[k], cx, cy, +(r / 14).toFixed(2));
}
blobSet(SUB, 'reed-bed', {
  mg: { n: 4, e: 4, s: 4, w: 4 }, R: 24, tags: ['reeds', 'marsh', 'treeline', 'autotile', 'obstacle'],
  build(t, G) {
    const id = clipOf(t, G);
    t.add(duskBase(), sk(G.d, '#4d5a34', 9, .16), `<g clip-path="url(#${id})">`, rect(-30, -30, 124, 124, PEAT.b), wrapped(20, 22, 20, (a, b) => ell(a, b, 20, 12, '#3a4a38', .3, 20)) + wrapped(46, 44, 18, (a, b) => ell(a, b, 18, 10, '#3a4a38', .28, -20)), '</g>');
    crowns(t, G, { pal: [0], tag: 'reed', draw: reedClump });
  },
});

// ======================= connect-4: boardwalks (over water or ground), reed fence =======================
const C = connect(SUB);
const WD = ['#cdb892', '#a98f68', '#7a6448'];
function boardwalk({ mossy = false, broken = false, lanterns = false, rail = false }) {
  return (t, m) => {
    const r = rr('bw' + m + (broken ? 'b' : '') + (mossy ? 'm' : '')), W0 = 21, W1 = 43, tints = [t.lg(['#d8c49e', '#b09670'], 0), t.lg(['#cfba94', '#a98e68'], 0), t.lg(['#c4ae88', '#9c8260'], 0)], ik = ink('#4a3220', .8, .8);
    const hasE = m & C4.E, hasW = m & C4.W, hasN = m & C4.N, hasS = m & C4.S, [x0, x1] = armX(m);
    // shadow on the water below the deck
    t.add(rect(x0 + 1.5, W0 + 5, x1 - x0, W1 - W0 + 2, '#1c2a3a', 2, .22), rect(32 - 10, W0 + 5, 24, W1 - W0 + 2, '#1c2a3a', 2, .22));
    if (hasN) t.add(rect(W0 + 1.5, -1, W1 - W0, 40, '#1c2a3a', 0, .2));
    if (hasS) t.add(rect(W0 + 1.5, W1 - 2, W1 - W0, 30, '#1c2a3a', 0, .22));
    const gaps = new Set(); if (broken) { for (const k of [1, 2, 5, 6]) if (hash('gap' + m + k) % 3 === 0 && k * 8 >= (hasW ? 0 : 24) && k * 8 + 8 <= (hasE ? 64 : 40)) gaps.add(k); }
    // north/south arms first (planks run across), then the E-W band over them
    const vert = (y0, y1) => { for (let y = y0; y < y1; y += 8) { const k = Math.floor(y / 8); t.add(gaps.has(k + 10) ? '' : rect(W0, y + .4, W1 - W0, 7.2, tints[(k + hash('v' + m) ) % 3], 0, 1, ik)); } t.add(rect(W0, y0, 1.6, y1 - y0, WD[2], 0, .9), rect(W1 - 1.6, y0, 1.6, y1 - y0, WD[2], 0, .9)); };
    if (hasN) vert(0, 24); if (hasS) vert(40, 64);
    if (x1 > x0 || true) {
      const a = hasW ? 0 : 24, b = hasE ? 64 : 40;
      for (let x = Math.floor(a / 8) * 8; x < b; x += 8) { const k = x / 8; if (gaps.has(k)) { t.add(rect(x + .4, W0, 7.2, W1 - W0, '#4a6a82', 0, .95), ell(x + 4, 32, 3, 1.4, '#a9c0cc', .55), line(`M${x + 1} ${W0 + 2}l5 4`, '#e8f0f4', .6, .5)); continue; } t.add(rect(x + .4, W0, 7.2, W1 - W0, tints[(k + hash('h' + m)) % 3], 0, 1, ik), rect(x + 1.4, W0 + 1, 1, W1 - W0 - 2, '#fff', 0, .22), line(`M${x + 3} ${W0 + 4}v3M${x + 5} ${W1 - 8}v3`, '#4a3220', .6, .45)); }
      // south face (beam) under the E-W band
      t.add(rect(a, W1, b - a, 5, t.lg(['#8f765a', '#5e4a34'], 90), 0, 1, ink('#3a2818', .7, .8)), rect(a, W1, b - a, 1, '#c8b08a', 0, .5));
      if (broken && gaps.size) for (const k of gaps) t.add(rect(k * 8, W1, 8, 5, '#2a3a4a', 0, .85), line(`M${k * 8} ${W1}l3 4l2-4l3 3`, '#e8f0f4', .6, .5));
      if (broken && hash('tilt' + m) % 2) { const k = [1, 2, 5, 6].find(q => !gaps.has(q) && (q * 8 >= a && q * 8 < b - 8)); if (k) t.add(`<g transform="rotate(-18 ${k * 8 + 4} 32)">`, rect(k * 8 + .6, W0 + 1, 6.8, W1 - W0 - 1, tints[2], 0, 1, ik), '</g>', line(`M${k * 8 + 2} ${W0 + 1}l2 2l-1 3`, '#fff', .8, .6)); }
    }
    // node platform (always present at the cell centre)
    if (hasN) t.add(rect(W0, W0 - 2, W1 - W0, 4, tints[0], 0, 1, ik));
    if (!hasS) t.add(rect(W0 - .5, W1, W1 - W0 + 1, 5, t.lg(['#8f765a', '#5e4a34'], 90), 0, 1, ink('#3a2818', .7, .8)), rect(W0 - .5, W1, W1 - W0 + 1, 1, '#c8b08a', 0, .5));
    // posts (stilts) at the node corners, with cap
    const post = (x, y) => t.add(rect(x - 2, y, 4, 9, t.lg(['#7a6448', '#4a3a28'], 0), 1, 1, ink('#2a1c10', .6, .8)), ell(x, y, 2.6, 1.3, '#cdb892', 1, 0, ik), ell(x - .6, y - .4, 1, .5, '#fff', .5), ell(x, y + 9, 3.4, 1.1, '#eadcea', .5));
    if (!hasW || !hasN) post(W0 + 1, W0 - 2 + (hasN ? 2 : 0) + (!hasN ? 1 : 0));
    post(W1 - 1, W1 - 1 + (hasS ? 0 : 0));
    if (!hasE || !hasS) post(W1 - 1, hasS ? 40 : W1 - 1);
    // arm-end cap where the walk stops: the end of the planks and a short rope
    if (!hasW) t.add(rect(W0 - 2, W0 + 1, 3, W1 - W0 - 1, WD[1], 1, 1, ik));
    if (!hasE) t.add(rect(W1 - 1, W0 + 1, 3, W1 - W0 - 1, WD[1], 1, 1, ik));
    if (rail) { const rl = (x, y, w) => line(`M${x} ${y}h${w}`, '#a8885a', 1.3, .9); if (!hasN) t.add(rl(hasW ? 0 : W0, W0 - 1, (hasE ? 64 : W1) - (hasW ? 0 : W0))); for (const x of [(hasW ? 0 : W0), 32, (hasE ? 64 : W1)]) if (x > 0 && x < 64) t.add(rect(x - 1, W0 - 5, 2, 6, WD[2], 0, 1)); }
    if (mossy) { for (const [x, y, w] of [[12, 30, 8], [44, 36, 9], [30, 26, 6]]) if ((x < 24 ? hasW : x > 40 ? hasE : true)) t.add(path(`M${x} ${y}q${w / 2} -4 ${w} 0q-1 4 -${w * .5} 5q-${w * .3} -2 -${w * .5} -1Z`, '#86b865', .9)); t.add(ell(32, W1 + 3, 8, 1.4, '#86b865', .8)); }
    if (lanterns) { t.add(`<circle cx="${W1 - 1}" cy="${W0 - 9}" r="9" fill="#ffd890" opacity=".28"/>`, line(`M${W1 - 1} ${W0 - 4}v-8`, '#4a3a28', 1.4), ell(W1 - 1, W0 - 11, 3.6, 4.6, '#e8604a', 1, 0, ink('#4a1410', .7, .8)), rect(W1 - 4, W0 - 14, 6, 1, '#4a1410', 0, .7), ell(W1 - 2, W0 - 12, 1, 1.6, '#ffe6a0', .8)); }
  };
}
C('boardwalk', boardwalk({}), ['boardwalk', 'bridge', 'walkable', 'wood', 'marsh']);
C('boardwalk-mossy', boardwalk({ mossy: true, rail: true }), ['boardwalk', 'bridge', 'walkable', 'wood', 'mossy', 'marsh']);
C('boardwalk-broken', boardwalk({ broken: true, mossy: true }), ['boardwalk', 'bridge', 'broken', 'wood', 'marsh']);
C('boardwalk-lantern', boardwalk({ lanterns: true, rail: true }), ['boardwalk', 'bridge', 'walkable', 'wood', 'lantern', 'marsh']);
// reed fence: bundled reeds lashed with rope, a screen against the wind
C('fence-reed', (t, m) => {
  const cx = 32, by = 50, [x0, x1] = armX(m), r = rr('fr' + m), g = t.lg(['#e0d2a0', '#b8a468', '#8a7842'], 90);
  t.add(ell(cx + 2, by + 3, 10, 3, '#3b3a24', .2)); if (x1 > x0) t.add(rect(x0 + 1, by + 2, x1 - x0, 3, '#3b3a24', 1.3, .17));
  const bundle = (x, w, h, y0 = by) => { let o = path(`M${x - w / 2} ${y0}V${y0 - h}Q${x} ${y0 - h - 3} ${x + w / 2} ${y0 - h}V${y0}Z`, g, 1, ink('#5a4a22', .8, .8)); for (let i = -1; i <= 1; i++) o += line(`M${x + i * w * .28} ${y0 - 1}V${y0 - h + 1}`, '#8a7842', .8, .5); return o + rect(x - w / 2, y0 - h * .55, w, 1.6, '#6e4a2c', 0, .9) + ell(x - w * .2, y0 - h + 2, 1.4, 2, '#fff', .35); };
  if (m & C4.N) t.add(rect(cx - 5, 0, 10, by - 10, t.lg(['#c8b478', '#8a7842'], 0), 2, 1, ink('#5a4a22', .8, .8)));
  if (x1 > x0) for (let x = x0 + 4; x <= x1 - 3; x += 8) { const hh = 20 + ((hash('rb' + x) % 3)) * 1.5; t.add(bundle(x, 8, hh)); }
  t.add(bundle(cx, 11, 24));
  if (x1 > x0) t.add(rect(x0, by - 15, x1 - x0, 1.8, '#6e4a2c', 0, .85), rect(x0, by - 7, x1 - x0, 1.6, '#6e4a2c', 0, .85));
  if (m & C4.S) t.add(rect(cx - 5, by - 2, 10, 64 - by + 2, t.lg(['#c8b478', '#8a7842'], 0), 2, 1, ink('#5a4a22', .8, .8)));
  t.add(cattailS(cx + 9, by + 1, 22, 2, .7));
}, ['fence', 'reed', 'obstacle', 'marsh']);
