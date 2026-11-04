// Misty Highlands autotiles (47-blob) and connect-4 sets: ochre/heather/scree patches, gorse, ridges, mountain stream, ravine; rope bridge, prayer flags, dry-stone wall, rope fence.
import { T, P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, FAM, skeleton, inShape, blobSet, maker, scat, C4, SUBS, sparkle, BIT } from './sub.mjs';
import { crowns, canon } from './ground.mjs';
import { waterFill } from './ground.mjs';
import { wrapped } from './lib.mjs';
import { PEAT, mixc } from './marsh-lib.mjs';
import { MOSS } from './ruins-lib.mjs';
import { connect, armX, sym, use } from './rice-lib.mjs';
import { pebbleSmall, stoneW } from './water-lib.mjs';
import { OCHRE, HEATH, SCREE, MOOR, SLAB, CHASM, flecks, stoneS, heatherS, gorseS, flagCols, flagTri, mistBlob } from './hills-lib.mjs';

const SUB = SUBS.hills, GR = FAM.grass;
const rr = (s) => rng(hash(s));
let CUR = null;
const sk = (d, c, w, o) => { CUR._sp = CUR._sp || {}; if (!CUR._sp[d]) { CUR._sp[d] = CUR.id(); CUR.defs.push(`<path id="${CUR._sp[d]}" d="${d}"/>`); } return `<use href="#${CUR._sp[d]}" fill="none" stroke="${c}" stroke-width="${w}" stroke-opacity="${o}" stroke-linejoin="round"/>`; };
const clipOf = (t, G) => { CUR = t; return t.clip(G.d).slice(5, -1); };
const PM = { n: 8, e: 8, s: 8, w: 8 };

// ---------- feathered patches rising out of grass / peat / moss ----------
function patch(under, over, { rim = '#9a8a58', feather = '#d3c48e', inner = null } = {}) {
  return (t, G) => {
    const id = clipOf(t, G);
    t.add(skeleton(under), sk(G.d, feather, 15, .3), sk(G.d, over.rim, 9, .2), `<g clip-path="url(#${id})">`, skeleton(over), inner ? inner(t, G) : '', sk(G.d, over.w[1], 8, .5), '</g>', sk(G.d, rim, 1.2, .4));
  };
}
const wrapMany = (items, fn) => items.map(([x, y, r, ...rest]) => wrapped(x, y, r, (a, b) => fn(a, b, ...rest))).join('');
blobSet(SUB, 'ochre-patch', { mg: PM, R: 26, tags: ['ochre', 'patch', 'blend', 'pasture'], build: patch(GR, OCHRE) });
blobSet(SUB, 'ochre-patch-peat', { mg: PM, R: 26, tags: ['ochre', 'patch', 'blend', 'marsh', 'peat'], build: patch(PEAT, OCHRE, { feather: '#c8b88a' }) });
blobSet(SUB, 'ochre-patch-moss', { mg: PM, R: 26, tags: ['ochre', 'patch', 'blend', 'mossy-ruins', 'moss'], build: patch(MOSS, OCHRE, { feather: '#cfd098' }) });
blobSet(SUB, 'heather-patch', { mg: PM, R: 24, tags: ['heather', 'patch', 'moor'], build: patch(OCHRE, HEATH, { rim: '#8a7a78', feather: '#c2b394', inner: (t) => wrapMany([[14, 18, 6], [44, 12, 6], [30, 38, 6], [8, 50, 6], [52, 52, 6], [58, 30, 6]], (a, b) => ell(a, b, 4.4, 2, '#a070b8', .8, -20) + ell(a + 5, b + 4, 3.6, 1.8, '#c898d8', .8, 15)) }) });
blobSet(SUB, 'scree-patch', { mg: PM, R: 22, tags: ['scree', 'patch', 'rock'], build: patch(OCHRE, SCREE, { rim: '#8e8a7c', feather: '#bdb8a8', inner: (t) => wrapMany([[12, 14, 6], [40, 10, 6], [26, 34, 6], [54, 40, 6], [10, 52, 6], [44, 56, 6]], (a, b) => stoneS(a, b, .9)) }) });
// gorse thicket: bushes on a lattice shared by all pieces
function gorseBody(seed) { const rn = rng(seed * 17 + 3), o = [], rx = 14; o.push(ell(0, 4, rx, 8.4, '#4a7a3a', 1, 0, ink('#1d4a26', .8, .7)), ell(-2, 1, rx * .8, 6, '#6f9a48', 1), ell(-4, -1, rx * .5, 3, '#8ab860', .7)); for (let i = 0; i < 14; i++) o.push(circ(rn.range(-12, 12), rn.range(-4, 8), rn.range(1, 1.7), '#f6d42a', 1, ink('#a88a10', .3, .6)), circ(rn.range(-12, 12), rn.range(-4, 6), .5, '#fff6a0', .8)); return o.join(''); }
function gorseClump(t, cx, cy, r, seed) { const k = seed % 4; t._gs = t._gs || {}; if (!(k in t._gs)) t._gs[k] = sym(t, gorseBody(k)); return ell(cx + r * .1, cy + r * .75, r * .95, r * .3, '#2e2c1a', .2) + use(t._gs[k], cx, cy, +(r / 14).toFixed(2)); }
blobSet(SUB, 'gorse-thicket', {
  mg: { n: 4, e: 4, s: 4, w: 4 }, R: 24, tags: ['gorse', 'scrub', 'treeline', 'obstacle'],
  build(t, G) { const id = clipOf(t, G); t.add(skeleton(OCHRE), sk(G.d, '#5a6a30', 9, .16), `<g clip-path="url(#${id})">`, rect(-30, -30, 124, 124, '#b4a864'), wrapped(20, 22, 20, (a, b) => ell(a, b, 20, 12, '#6a7a38', .3, 20)) + wrapped(46, 44, 18, (a, b) => ell(a, b, 18, 10, '#6a7a38', .28, -20)), '</g>'); crowns(t, G, { pal: [0], tag: 'gorse', draw: gorseClump }); },
});

// ---------- ridges: raised grey rock with a tall S wall (height) ----------
const RMG = { n: 8, e: 8, s: 6, w: 8 }, EXTX = 26;
const RK = ['#d8d4c6', '#a8a496', '#767468', '#54524a'];
function ridge({ WALL, top, tall }) {
  return (t, G) => {
    const id = clipOf(t, G), hasS = G.h(BIT.S), wy = T - G.mg.s, r = rr('rg' + WALL);
    t.add(skeleton(OCHRE));
    if (!hasS) t.add(rect(G.x0, wy - 1, G.x1 - G.x0, 8, '#3b3a24', 0, .2), rect(G.x0 + 2, wy, G.x1 - G.x0 - 4, 5, '#2e2c1a', 0, .14));
    t.add(sk(G.d, '#6e6a5c', 5, .16), `<g clip-path="url(#${id})">`, top(t, G), sk(G.d, '#f1ede0', 7, .4));
    const walls = []; if (!hasS) walls.push([G.x0, G.x1]);
    if (G.notches.length) { if (G.h(BIT.S) && G.h(BIT.W) && !G.h(BIT.SW)) walls.push([-EXTX, G.mg.w]); if (G.h(BIT.S) && G.h(BIT.E) && !G.h(BIT.SE)) walls.push([T - G.mg.e, T + EXTX]); }
    for (const [a, b] of walls) {
      const y0 = wy - WALL; let o = rect(a, y0, b - a, WALL + 1, t.lg(RK.slice(0, 3), 90));
      for (let k = 0; k < (tall ? 6 : 3); k++) { const yy = y0 + 6 + k * (WALL - 8) / (tall ? 6 : 3), dd = `M${a} ${f(yy)}` + Array.from({ length: Math.ceil((b - a) / 8) + 1 }, (_, i) => `L${a + i * 8} ${f(yy + ((i + k) % 2 ? 1.2 : -1.2))}`).join(''); o += line(dd, '#4a483e', 1.2, .42) + line(dd, '#efeade', .7, .22, { transform: 'translate(0 1.3)' }); }
      const nc = tall ? 6 : 4; for (let i = 0; i < nc; i++) { const x = r.range(2, 62); o += wrapped(x, y0 + WALL / 2, 6, (p, q) => line(`M${f(p)} ${f(y0 + 3 + r.range(0, 5))}l${f(r.range(-2, 3))} ${f(r.range(5, 9))}l${f(r.range(-2, 2))} ${f(r.range(4, 9))}`, '#4a483e', 1, .5)); }
      for (let i = 0; i < 2; i++) { const x = r.range(4, 60); o += wrapped(x, y0 + 8, 6, (p, q) => ell(p, q + WALL * .25, 3.4, WALL * .3, '#c8a868', .22, 0)); }
      o += rect(a, y0, b - a, 3, '#efeade', 0, .6) + rect(a, wy - 6, b - a, 6, '#2e2c1a', 0, .2);
      if (tall) for (let i = 0; i < 4; i++) { const x = r.range(4, 60); o += wrapped(x, wy - 1, 6, (p, q) => stoneS(p, q + 1, r.range(.7, 1.1))); }
      t.add(o);
      // grassy lip on the top edge
      let lp = ''; for (let x = Math.ceil(a / 8) * 8 + 3; x < b; x += 8) lp += tuft(x, y0 + 2, '#8f8a48', .75, .6); t.add(lp);
    }
    t.add('</g>', sk(G.d, '#5a5648', 1.2, .5));
  };
}
const topOchre = (t, G) => { let o = skeleton(OCHRE) + flecks('rtop', 3, '#9a8a58'); const r = rr('rtop'); for (let i = 0; i < 3; i++) o += wrapped(r.range(0, T), r.range(0, T), 6, (a, b) => tuft(a, b, '#8f8a48', .7, .7)); for (let i = 0; i < 2; i++) o += wrapped(r.range(0, T), r.range(0, T), 6, (a, b) => stoneS(a, b, r.range(.7, 1))); return o; };
const topSlab = (t, G) => { let o = skeleton(SLAB) + flecks('rslab', 6); const r = rr('rslab'); for (let i = 0; i < 2; i++) o += wrapped(r.range(0, T), r.range(0, T), 6, (a, b) => ell(a, b, 4, 2, '#9ab070', .7, 10)); return o; };
blobSet(SUB, 'ridge-grey', { mg: RMG, R: 14, tags: ['ridge', 'cliff', 'height', 'rock', 'wall'], build: ridge({ WALL: 22, top: topOchre }) });
blobSet(SUB, 'ridge-high', { mg: RMG, R: 14, tags: ['ridge', 'cliff', 'height', 'rock', 'wall', 'tall'], build: ridge({ WALL: 36, top: topSlab, tall: true }) });

// ---------- mountain stream (same outline as water-shore: margin 9, R 22) ----------
blobSet(SUB, 'mountain-stream', {
  mg: { n: 9, e: 9, s: 9, w: 9 }, R: 22, tags: ['water', 'stream', 'mountain', 'cold'],
  build(t, G) {
    const id = clipOf(t, G), r = rr('mst');
    t.add(skeleton(OCHRE), sk(G.d, '#7a8a70', 11, .22), sk(G.d, '#e0d8bc', 15, .5), `<g clip-path="url(#${id})">`, waterFill('shallow'), rect(-30, -30, 124, 124, '#dff2f4', 0, .22));
    for (let i = 0; i < 6; i++) { const x = r.range(0, T), y = r.range(0, T), w = r.range(12, 20); t.add(wrapped(x, y, w, (a, b) => line(`M${f(a - w / 2)} ${f(b)}q${f(w / 4)}-1.6 ${f(w / 2)} 0t${f(w / 2)} 0`, '#fff', 1.2, .85) + line(`M${f(a - w / 2 + 3)} ${f(b + 3)}h${f(w * .6)}`, '#fff', .9, .5))); }
    for (const [x, y] of [[18, 22], [46, 46], [50, 14]]) t.add(wrapped(x, y, 8, (a, b) => stoneW(a, b, .85)));
    t.add(sk(G.d, '#e9f6f0', 10, .45), sk(G.d, '#fff', 4, .45), '</g>', sk(G.d, '#4f8aa8', 1.3, .5));
    for (let i = 0; i < 40; i++) { const x = r.range(2, 62), y = r.range(2, 62); if (!inShape(G, x, y, 0) && inShape(G, x, y, -9) && i % 2 === 0) t.add(stoneS(x, y + 2, r.range(.5, .9), r.pick([['#e0e1d6', '#b4b4a6', '#868678'], ['#e6dcc8', '#c4b8a0', '#968a74']]))); }
  },
});

// ---------- ravine: a dark chasm cut into the pasture (bridge it with rope-bridge) ----------
blobSet(SUB, 'ravine', {
  mg: { n: 6, e: 6, s: 6, w: 6 }, R: 12, tags: ['ravine', 'chasm', 'obstacle', 'height', 'impassable'],
  build(t, G) {
    const id = clipOf(t, G), r = rr('rav'), noN = !G.h(BIT.N);
    t.add(skeleton(OCHRE), sk(G.d, '#5a5648', 14, .22), sk(G.d, '#8e8a7c', 10, .55), sk(G.d, '#d8d4c6', 4, .55));
    t.add(`<g clip-path="url(#${id})">`, skeleton(CHASM), rect(-30, -30, 124, 124, t.lg(['#3a4252', '#232a38'], 90), 0, .55));
    if (noN) { const y0 = G.y0, a = G.x0, b = G.x1; t.add(rect(a, y0, b - a, 22, t.lg(['#9a9688', '#6e6a5e', '#4a483e'], 90)), ...[7, 13, 19].map(k => line(`M${a} ${y0 + k}H${b}`, '#34322a', 1.1, .5)), ...[0, 1, 2, 3].map(i => wrapped(r.range(0, T), y0 + 10, 6, (p, q) => line(`M${f(p)} ${f(y0 + 2)}l2 6l-1 8`, '#34322a', 1, .5))), rect(a, y0 + 18, b - a, 8, '#10141c', 0, .35)); }
    for (let i = 0; i < 4; i++) { const x = r.range(0, T), y = r.range(30, 60), rx = r.range(14, 24); t.add(wrapped(x, y, rx, (p, q) => mistBlob(p, q, rx, rx * .22, '#aeb8c8', .2))); }
    t.add(sk(G.d, '#10141c', 13, .35), '</g>');
  },
});

// ======================= connect-4 =======================
const C = connect(SUB);
// rope bridge over a ravine: planks between two hand-ropes, posts at the node
C('rope-bridge', (t, m) => {
  const hasE = m & C4.E, hasW = m & C4.W, hasN = m & C4.N, hasS = m & C4.S, ik = ink('#3a2418', .7, .8), rope = '#a8885a', g = t.lg(['#cdb48a', '#9a7e56'], 0);
  const horiz = (hasE || hasW) && !(hasN || hasS), vert = (hasN || hasS) && !(hasE || hasW);
  // soft shadow on the abyss
  t.add(rect(hasW ? 0 : 20, 36, (hasE ? 64 : 44) - (hasW ? 0 : 20), 18, '#0a0e16', 3, .3), rect(20, hasN ? 0 : 20, 24, (hasS ? 64 : 44) - (hasN ? 0 : 20), '#0a0e16', 3, .0));
  const E = (a, b) => {   // east-west band from x=a..b: planks, then a back rope (y 14) and a front rope (y 36) with rope balusters
    for (let x = Math.floor(a / 5) * 5; x < b; x += 5) t.add(rect(x + .4, 26, 4.2, 20, g, 0, 1, ik), rect(x + 1, 27, 1, 18, '#fff', 0, .2));
    t.add(rect(a, 44, b - a, 3, '#5e4630', 0, 1), line(`M${a} 14H${b}`, rope, 2, 1), line(`M${a} 14H${b}`, '#5a4228', .8, .5, { 'stroke-dasharray': '2 2' }));
    for (let x = Math.ceil(a / 8) * 8; x <= b; x += 8) t.add(line(`M${x} 14V26`, rope, 1, .8));
    for (let x = Math.ceil(a / 8) * 8; x <= b; x += 8) t.add(line(`M${x} 36V46`, rope, 1, .8));
    t.add(line(`M${a} 36H${b}`, rope, 2.2, 1), line(`M${a} 36H${b}`, '#5a4228', .8, .5, { 'stroke-dasharray': '2 2' }));
  };
  const V = (a, b) => {
    t.add(line(`M22 ${a}V${b}`, rope, 2, 1), line(`M42 ${a}V${b}`, rope, 2.2, 1));
    for (let y = Math.floor(a / 6) * 6; y < b; y += 6) t.add(rect(23, y + .4, 18, 5, g, 0, 1, ik), rect(24, y + 1, 16, 1, '#fff', 0, .2));
    t.add(line(`M22 ${a}V${b}`, rope, 2, 1), line(`M42 ${a}V${b}`, rope, 2.2, 1), line(`M22 ${a}V${b}`, '#5a4228', .8, .5, { 'stroke-dasharray': '2 2' }), line(`M42 ${a}V${b}`, '#5a4228', .8, .5, { 'stroke-dasharray': '2 2' }));
  };
  if (hasN) V(0, 30); if (hasS) V(34, 64);
  if (hasE || hasW) E(hasW ? 0 : 20, hasE ? 64 : 44);
  else t.add(rect(20, 26, 24, 20, g, 0, 1, ik));
  if (!hasE && !hasW && (hasN || hasS)) { /* N-S only: deck already drawn */ }
  const post = (x, y) => t.add(rect(x - 2.6, y - 22, 5.2, 26, t.lg(['#a8886a', '#6b4a2c', '#4a3220'], 0), 1.5, 1, ink('#2a1c10', .8, .8)), ell(x, y - 22, 2.6, 1.3, '#cdb892', 1, 0, ik), line(`M${x - 2.6} ${y - 14}h5.2M${x - 2.6} ${y - 9}h5.2`, rope, 1.4, .9));
  if (!hasW) post(18, 36); if (!hasE) post(46, 36); if (!hasN && !(hasE || hasW)) post(24, 28); if (!hasS && !(hasE || hasW)) post(24, 50), post(40, 50);
  if (!(hasE || hasW)) { if (!hasN) post(24, 28), post(40, 28); }
  // anchor stones where the rope ends: a coil around the post
  if (!hasW) t.add(ell(10, 36, 8, 4, '#a2a596', 1, 0, ink(P.inkR, .6, .7)), ell(8, 34.6, 3, 1.4, '#e0e1d6', .8));
  if (!hasE) t.add(ell(54, 36, 8, 4, '#a2a596', 1, 0, ink(P.inkR, .6, .7)), ell(52, 34.6, 3, 1.4, '#e0e1d6', .8));
}, ['bridge', 'rope', 'walkable', 'ravine']);
// prayer flags: pole at the node, strings sag to y=14 at the cell edge and continue in the neighbour
C('prayer-flags', (t, m) => {
  const px = 32, top = 8, r = rr('pf' + m), ik = ink('#3a2418', .5, .6);
  const string = (x0, y0, x1, y1, seed, n) => { const cx = (x0 + x1) / 2, cy = Math.max(y0, y1) + 4; t.add(line(`M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}`, '#6a5238', 1.1, .95)); for (let k = 0; k < n; k++) { const u = (k + .5) / n, x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1, y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1; t.add(flagTri(x - 2.6, y, 5.2, 7.4, flagCols[(hash('pf' + seed + k)) % 5], r.range(-1, 1))); } };
  t.add(ell(px + 2, 56, 9, 2.6, '#3b3a24', .2));
  if (m & C4.E) string(px, top + 2, 64, 14, 'e' + m, 5);
  if (m & C4.W) string(0, 14, px, top + 2, 'w' + m, 5);
  if (m & C4.N) { t.add(line(`M${px} ${top + 2}L36 0`, '#6a5238', 1.1, .95)); }
  if (m & C4.S) string(px, top + 2, 36, 64, 's' + m, 8);
  t.add(rect(px - 2, top, 4, 48, t.lg(['#d8c8a4', '#8a6a44'], 0), 1, 1, ik), rect(px - 4, 50, 8, 5, '#a2a596', 1.5, 1, ink(P.inkR, .6, .75)), ell(px, top, 2, 1, '#f3c24f', 1), path(`M${px} ${top - 1}l0 -4l4 2Z`, '#c8352b', 1));
}, ['flags', 'prayer', 'obstacle', 'decor']);
// dry-stone wall (pasture boundary)
C('wall-drystone', (t, m) => {
  const cx = 32, by = 50, [x0, x1] = armX(m), r = rr('wd' + m), STN = [['#d8d4c6', '#a8a496', '#767468'], ['#e0d8c4', '#b4a88e', '#86796a'], ['#cfd2cc', '#a0a6a4', '#6e7474']];
  t.add(ell(cx + 2, by + 3, 12, 3.4, '#3b3a24', .2)); if (x1 > x0) t.add(rect(x0 + 1, by + 2, x1 - x0, 3, '#3b3a24', 1.3, .17));
  const stones = (a, b, topY) => { for (let row = 0; row < 3; row++) { let x = a - (row % 2 ? 6 : 0); const y = by - 8 - row * 7; while (x < b) { const w = 8 + ((hash('ds' + row + Math.floor(x / 8)) % 5)); const c = STN[(((row + Math.floor(x / 8)) % 3) + 3) % 3]; t.add(rect(x + .4, y, w - .8, 7.4, t.lg(c, 90), 2.4, 1, ink('#4a463c', .7, .7)), rect(x + 2, y + 1, w - 4, 1.4, '#fff', 1, .35)); x += w; } } };
  if (m & C4.N) t.add(rect(cx - 9, 0, 18, by - 14, t.lg(['#c8c4b4', '#8a8678'], 0), 3, 1, ink(P.inkR, .8, .75)));
  if (x1 > x0) { t.add(rect(x0, by - 30, x1 - x0, 0, '#000', 0, 0)); stones(x0 - (x0 === 0 ? 8 : 0), x1 + (x1 === 64 ? 8 : 0)); t.add(rect(x0, by - 30, x1 - x0, 0, '#000', 0, 0)); for (let x = x0 + 4; x < x1; x += 11) t.add(ell(x + r.range(-2, 2), by - 28 + r.range(-1, 1), r.range(3.4, 5), 2.4, '#cfd2cc', 1, 0, ink(P.inkR, .6, .7))); }
  t.add(rect(cx - 9, by - 28, 18, 29, t.lg(STN[0], 0), 3, 1, ink(P.inkR, .9, .8)), rect(cx - 9, by - 28, 18, 3, '#f1ede0', 2, .6), line(`M${cx - 9} ${by - 14}h18M${cx} ${by - 28}v14M${cx - 4} ${by - 14}v14`, P.inkR, .9, .45), ell(cx + 3, by - 29, 6, 2.2, '#cfd2cc', 1, 0, ink(P.inkR, .6, .7)));
  t.add(ell(cx - 4, by - 8, 4, 1.8, '#b4c47a', .8), tuft(cx + 10, by + 2, '#8f8a48', .8, .6));
  if (m & C4.S) t.add(rect(cx - 9, by - 2, 18, 64 - by + 2, t.lg(['#c8c4b4', '#8a8678'], 0), 3, 1, ink(P.inkR, .8, .75)));
}, ['wall', 'stone', 'obstacle', 'pasture']);
C('fence-rope-post', (t, m) => {
  const cx = 32, by = 50, [x0, x1] = armX(m), ik = ink('#2a1c10', .8, .8), g = t.lg(['#c0a27a', '#8a6a44', '#5e4630'], 0);
  t.add(ell(cx + 2, by + 3, 8, 2.6, '#3b3a24', .2)); if (x1 > x0) t.add(rect(x0 + 1, by + 2, x1 - x0, 3, '#3b3a24', 1.3, .15));
  const post = (x) => t.add(rect(x - 2.6, by - 26, 5.2, 28, g, 1.2, 1, ik), ell(x, by - 26, 2.6, 1.4, '#d8c8a4', 1, 0, ik), rect(x - 1.4, by - 24, 1, 22, '#fff', 0, .25));
  if (x1 > x0) { for (const dy of [-21, -11]) t.add(line(`M${x0} ${by + dy}Q${(x0 + x1) / 2 === 32 ? 32 : (x0 + x1) / 2} ${by + dy + 2} ${x1} ${by + dy}`, '#c8b078', 2, 1), line(`M${x0} ${by + dy}H${x1}`, '#6a5238', .7, .5, { 'stroke-dasharray': '2 2' })); if (x0 === 0) post(0), 0; if (x1 === 64) post(64); }
  if (m & C4.N) t.add(rect(cx - 2.2, 0, 4.4, by - 26, g, 1, 1, ik));
  if (m & C4.S) t.add(rect(cx - 2.2, by, 4.4, 64 - by, g, 1, 1, ik));
  post(cx); t.add(tuft(cx + 8, by + 2, '#8f8a48', .8, .6));
}, ['fence', 'rope', 'wood', 'obstacle']);
