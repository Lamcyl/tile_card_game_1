// Rice Terraces (greenvale/rice-terraces): paddy ground in every growth stage, terrace/bank/paddy autotiles, channels, decals. Objects: gen-rice-objects.mjs.
import { T, P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, FAM, skeleton, inShape, blobSet, maker, bloom, scat, C4, SUBS, sparkle, BIT } from './sub.mjs';
import { interior, waterFill } from './ground.mjs';
import { wrapped } from './lib.mjs';
import { ripple, ring, pebbleSmall, stoneW } from './water-lib.mjs';
import { sym, use, connect, armX, clump, paddyLattice, paddyBase, puddleGlint, terracePiece, earthWall, stoneWall, grassLip, bundLip, stoneLip } from './rice-lib.mjs';

const SUB = SUBS.rice, { mk, out } = maker(SUB);
const GR = FAM.grass, DT = FAM.dirt;
const rr = (s) => rng(hash(s));

// ======================= ground: paddies in every growth stage =======================
const sky = (r, n, c = '#fff') => { let o = ''; for (let i = 0; i < n; i++) o += ell(r.range(20, 44), r.range(18, 46), r.range(7, 13), r.range(1.6, 3), c, r.range(.25, .45), r.range(-10, 10)); return o; };
const rings = (r, n) => scat(r, n, 16, 20).map(([x, y]) => ring(x, y, r.range(6, 9), '#fff', .6) + ring(x, y, 3, '#fff', .75)).join('');
const azolla = (r, n) => { let o = ''; for (let i = 0; i < n; i++) { const x = r.range(14, 50), y = r.range(14, 50); o += ell(x, y, r.range(6, 10), r.range(3, 5), '#c8603c', .35, r.range(0, 180)); for (let k = 0; k < 9; k++) o += circ(x + r.range(-6, 6), y + r.range(-3, 3), r.range(.7, 1.2), r.pick(['#8fd078', '#c8603c', '#5fae5c']), .85); } return o; };
const tadpoles = (r, n) => scat(r, n, 14, 10).map(([x, y]) => circ(x, y, 1, '#2a3a40', .8) + line(`M${f(x + 1)} ${f(y)}q2 1 3.4 -.4`, '#2a3a40', .6, .7)).join('');
const bundles = (r, n) => scat(r, n, 12, 14).map(([x, y]) => ell(x + .8, y + 1.6, 5, 1.4, '#1d4a63', .18) + line(`M${f(x - 4)} ${f(y)}l8 -1.6M${f(x - 4)} ${f(y + 1)}l8 -1.6`, '#6a5a3a', 1.2, .9) + line(`M${f(x - 3)} ${f(y)}l-2 -5M${f(x - 1)} ${f(y - .4)}l0 -6M${f(x + 1)} ${f(y - .7)}l1 -6M${f(x + 3)} ${f(y - 1)}l3 -5`, '#5fae5c', 1.2, .95)).join('');
const mudrows = (r, n) => { let o = ''; for (let i = 0; i < n; i++) { const x = r.range(14, 40), y = r.range(14, 50); o += line(`M${f(x)} ${f(y)}q8 -2 ${f(r.range(12, 20))} 0`, '#8a7048', 1.6, .3); } return o; };
const strawBits = (r, n) => scat(r, n, 10, 7).map(([x, y]) => line(`M${f(x)} ${f(y)}l${f(r.range(4, 7))} ${f(r.range(-2, 2))}`, r.pick(['#e8cf86', '#c9a458']), 1.1, .9)).join('');
const PAD = {
  'paddy-water': { st: 'water', lat: false, v: { a: (r) => sky(r, 3), b: (r) => rings(r, 2) + sky(r, 1), c: (r) => bundles(r, 3) + sky(r, 1), d: (r) => mudrows(r, 4) + sky(r, 2, '#f3c6a0') } },
  'paddy-young': { st: 'young', v: { a: () => '', b: (r) => sky(r, 2), c: (r) => azolla(r, 1) + tadpoles(r, 3), d: (r) => rings(r, 1) } },
  'paddy-mid': { st: 'mid', v: { a: () => '', b: (r) => sky(r, 2), c: (r) => azolla(r, 1) } },
  'paddy-ripe': { st: 'ripe', v: { a: () => '', b: (r) => strawBits(r, 3), c: (r) => puddleGlint(26, 30, 8), d: () => puddleGlint(40, 44, 8) } },
  'paddy-stubble': { st: 'stubble', v: { a: (r) => puddleGlint(30, 30, 9), b: (r) => strawBits(r, 6), c: (r) => puddleGlint(22, 40, 7) + puddleGlint(44, 24, 7) } },
};
for (const [name, { st, lat = true, v }] of Object.entries(PAD)) for (const [vv, fn] of Object.entries(v)) {
  const sd = hash(name + vv), t = mk('ground', name, vv); t.add(paddyBase(st));
  if (lat) t.add(paddyLattice(t, st, { omit: vv === 'a' ? 0 : vv === 'b' ? .12 : .06, seed: sd % 997, wet: st !== 'ripe' && st !== 'stubble' || vv === 'c' }));
  t.add(fn(rng(sd))); out(t, 'ground', name, vv, ['seamless', 'ground', 'paddy', st, 'water']);
}
// ======================= ground: terrace tops and banks =======================
const higan = (x, y, s = 1) => { let o = line(`M${f(x)} ${f(y + 3)}v${f(-8 * s)}`, '#6fa050', 1, .8); for (let i = 0; i < 6; i++) { const a = -1.57 + (i - 2.5) * .55; o += line(`M${f(x)} ${f(y - 5 * s)}q${f(Math.cos(a) * 4 * s)} ${f(Math.sin(a) * 5 * s - 2)} ${f(Math.cos(a) * 6.4 * s)} ${f(Math.sin(a) * 4.6 * s - 1)}`, i % 2 ? '#e0483a' : '#c8352b', 1.1, .95); } return o + circ(x, y - 5 * s, .9, '#8e2118'); };
const TG = {
  'terrace-grass': { fam: GR, v: { a: (r) => interior(GR, 7011, { n: 3, tufts: 3 }) + scat(r, 3, 12, 14).map(([x, y]) => bloom('clover', x, y, .6)).join(''), b: (r) => interior(GR, 7012, { n: 3, cols: ['#bcd98d', '#cfe1a0'], tufts: 4 }) + higan(18, 30) + higan(40, 22, .9) + higan(34, 44, .8), c: (r) => interior(GR, 7013, { n: 4, tufts: 2 }) + scat(r, 3, 12, 14).map(([x, y]) => bloom(r.pick(['daisy', 'buttercup', 'cosmos']), x, y, .7)).join('') } },
  'terrace-earth': { fam: DT, v: { a: (r) => interior(DT, 7021, { n: 3, tufts: 1 }) + scat(r, 4, 12, 12).map(([x, y]) => pebbleSmall(x, y, .8, r.int(0, 3))).join(''), b: (r) => interior(DT, 7022, { n: 4, tufts: 2 }) + tuft(20, 28, '#7a9a48', .8, .8) + tuft(42, 40, '#7a9a48', .8, .8) } },
  'bank-weeds': { fam: GR, v: { a: (r) => interior(GR, 7031, { n: 3, cols: ['#a8cf86', '#bcd98d'], tufts: 6 }), b: (r) => interior(GR, 7032, { n: 3, tufts: 5 }) + higan(24, 34) + higan(40, 28, .85) } },
};
for (const [name, { fam, v }] of Object.entries(TG)) for (const [vv, fn] of Object.entries(v)) { const t = mk('ground', name, vv); t.add(skeleton(fam), fn(rr(name + vv))); out(t, 'ground', name, vv, ['seamless', 'ground', fam === GR ? 'grass' : 'dirt', 'terrace']); }
// baked detail on water: sky reflection, hill reflection, floating seedling bundles
const GD = {
  'paddy-sky': { a: (r) => sky(r, 4) + ell(32, 36, 22, 4, '#fff', .22), b: (r) => sky(r, 3, '#fbe0c4') + ell(30, 30, 18, 3, '#f6c6a0', .25) },
  'paddy-hills': { a: () => '<g opacity=".16">' + path('M8 50Q14 26 24 38Q34 16 44 36Q50 28 56 46Q32 54 8 50Z', '#2f6e3a') + '</g>', b: () => '<g opacity=".15">' + path('M8 44Q18 30 28 40Q38 26 56 44Q32 50 8 44Z', '#3a8048') + path('M12 54Q26 48 40 54Q48 50 54 56Q32 58 12 54Z', '#27583a') + '</g>' },
  'paddy-maple': { a: () => '<g opacity=".4">' + ell(22, 34, 16, 12, '#d2622e', .6) + ell(36, 40, 12, 9, '#f3a45a', .5) + line('M26 6v24', '#6b4a2c', 3, .4) + '</g>' },
};
for (const [name, vars] of Object.entries(GD)) for (const [vv, fn] of Object.entries(vars)) { const t = mk('ground-detail', name, vv); t.add(waterFill('shallow', hash(name + vv) % 90000 + 10), fn(rr(name + vv))); out(t, 'ground-detail', name, vv, ['seamless', 'ground', 'water', 'paddy', 'reflection']); }

// ======================= decals =======================
const decal = (name, v, fn) => { const t = mk('decals', name, v); fn(t, rr(name + v)); out(t, 'decals', name, v, ['overlay', 'decal', 'transparent', 'paddy']); };
// straw-hat farmer, seen from the 3/4 view, wading in the paddy
const HAT = ['#f3dd96', '#d8b860', '#a8883c'];
function farmer(t, kind) {
  const cx = 32, cy = 40, bent = kind === 'a' || kind === 'c', kim = kind === 'b' ? ['#c9a874', '#8a6a44'] : ['#7a8fc0', '#4d639a'];
  let o = ell(cx + 3, cy + 12, 16, 3, '#1d4a63', .18) + ring(cx - 6, cy + 11, 7, '#fff', .6) + ring(cx + 7, cy + 11, 7, '#fff', .5);
  o += rect(cx - 8, cy + 2, 4, 11, '#6b5a48', 2, 1, ink('#3b2a1a', .6, .7)) + rect(cx + 4, cy + 2, 4, 11, '#5a4a38', 2, 1, ink('#3b2a1a', .6, .7));   // legs
  if (bent) {
    o += path(`M${cx - 11} ${cy + 3}Q${cx - 14} ${cy - 8} ${cx - 4} ${cy - 12}Q${cx + 8} ${cy - 14} ${cx + 12} ${cy - 4}Q${cx + 10} ${cy + 3} ${cx - 11} ${cy + 3}Z`, t.lg(kim, 60), 1, ink('#2a3a63', .9, .8));
    o += line(`M${cx - 8} ${cy - 6}q4 -3 9 -2`, '#fff', 1, .35);
    o += line(`M${cx + 6} ${cy - 2}q4 6 8 10M${cx + 10} ${cy - 3}q3 6 3 11`, '#d8a878', 2.2, 1) + (kind === 'a' ? bundles0(cx + 12, cy + 9) : `<path d="M${cx + 8} ${cy + 6}q5 -8 7 -4q1 5 -3 7Z" fill="#c9a458" stroke="#6b5a38" stroke-width=".6"/>`);
    o += ell(cx + 1, cy - 14, 9.5, 5.6, t.lg(HAT, 60), 1, -8, ink('#7a6430', .8, .8)) + path(`M${cx - 6} ${cy - 15}L${cx + 1} ${cy - 24}L${cx + 8} ${cy - 15}Z`, t.lg(HAT, 60), 1, ink('#7a6430', .8, .8)) + line(`M${cx - 3} ${cy - 17}l4 -6M${cx + 4} ${cy - 17}l-3 -6`, '#a8883c', .8, .6) + ell(cx - 3, cy - 18, 3, 1.1, '#fff', .45, -20);
  } else {
    o += path(`M${cx - 8} ${cy + 3}Q${cx - 10} ${cy - 14} ${cx - 2} ${cy - 18}H${cx + 4}Q${cx + 12} ${cy - 14} ${cx + 8} ${cy + 3}Z`, t.lg(kim, 0), 1, ink('#2a3a63', .9, .8)) + rect(cx - 8, cy - 4, 16, 3, '#f0e6c8', 0, .9) + line(`M${cx - 8} ${cy - 10}q-6 8 -4 14M${cx + 8} ${cy - 10}q6 6 4 14`, '#d8a878', 2.4, 1);
    o += circ(cx + 1, cy - 22, 4.4, '#e0b88a', 1, ink('#6b4a2c', .6, .7)) + path(`M${cx - 10} ${cy - 22}L${cx + 1} ${cy - 34}L${cx + 12} ${cy - 22}Q${cx + 1} ${cy - 19} ${cx - 10} ${cy - 22}Z`, t.lg(HAT, 60), 1, ink('#7a6430', .8, .8)) + line(`M${cx - 4} ${cy - 24}l5 -8`, '#a8883c', .8, .6);
    if (kind === 'c') o += rect(cx + 10, cy - 14, 9, 12, t.lg(['#d8b860', '#a8883c'], 0), 2, 1, ink('#6b5a38', .7, .8)) + line(`M${cx + 10} ${cy - 8}h9`, '#6b5a38', .7, .6);
  }
  return o;
}
const bundles0 = (x, y) => line(`M${f(x)} ${f(y)}l-1 -4M${f(x + 1)} ${f(y)}l1 -5M${f(x + 3)} ${f(y)}l3 -4`, '#5fae5c', 1.2, .95) + line(`M${f(x - 1)} ${f(y)}h6`, '#6a5a3a', 1.2, .9);
for (const v of ['a', 'b', 'c', 'd']) decal('farmer-hat', v, (t) => t.add(farmer(t, v)));
for (const v of ['a', 'b', 'c']) decal('paddy-ripples', v, (t, r) => { for (const [x, y] of scat(r, v === 'a' ? 2 : 3, 14, 18)) t.add(ring(x, y, r.range(8, 12), '#fff', .75), ring(x, y, r.range(3, 5), '#fff', .9)); });
for (const v of ['a', 'b']) decal('footprints-mud', v, (t, r) => { for (let i = 0; i < 6; i++) { const x = 10 + i * 9 + (v === 'b' ? 0 : 0), y = 32 + (i % 2 ? 6 : -6) + r.range(-1, 1); t.add(ell(x, y, 3.4, 1.8, '#6b5030', .35, r.range(-10, 10)), ell(x - .5, y - .4, 1.8, .8, '#c8b088', .5)); } });
for (const v of ['a', 'b']) decal('straw-scatter', v, (t, r) => { for (const [x, y] of scat(r, 9, 8, 6)) t.add(line(`M${f(x)} ${f(y)}l${f(r.range(5, 9))} ${f(r.range(-3, 3))}`, r.pick(['#e8cf86', '#c9a458', '#f3dd96']), 1.2, .95)); });
for (const v of ['a', 'b']) decal('seedling-bundles', v, (t, r) => t.add(bundles(r, v === 'a' ? 3 : 5)));
for (const v of ['a', 'b']) decal('water-spill', v, (t) => { const o = v === 'a' ? 0 : 6; t.add(rect(26 + o, 0, 8, 28, t.lg(['#cfeaf0', '#9fd0dc'], 90), 3, .85), line(`M${28 + o} 2v22M${31 + o} 4v20M${34 + o - 1} 2v22`, '#fff', 1, .6), ell(30 + o, 38, 14, 9, '#9fd0dc', .6), ring(30 + o, 38, 12, '#fff', .8), ring(30 + o, 38, 6, '#fff', .9), line(`M${22 + o} 44q6 -3 12 0t12 0`, '#fff', 1.3, .7)); });
for (const v of ['a', 'b', 'c']) decal('rice-lodged', v, (t, r) => { for (let i = 0; i < 9; i++) { const x = r.range(10, 54), y = r.range(18, 52); t.add(line(`M${f(x)} ${f(y)}q${f(r.range(4, 8))} ${f(r.range(-3, 0))} ${f(r.range(8, 12))} ${f(r.range(2, 5))}`, r.pick(['#eab84a', '#d89a2c']), 1.4, .95), ell(x + 9, y + 3, 2.2, 1, '#d89a2c', 1, 25)); } });
for (const v of ['a', 'b']) decal('dragonfly-red', v, (t) => { const x = v === 'a' ? 30 : 36, y = v === 'a' ? 30 : 26, a = v === 'a' ? -20 : 25; t.add(`<g transform="translate(${x} ${y}) rotate(${a})">`, ell(1.4, 6, 6, 1.4, '#3b3a24', .15), ell(-3, -1.8, 4.2, 1.1, '#eef7fa', .8, -18, ink('#8aa0a8', .3, .5)), ell(3, -1.8, 4.2, 1.1, '#eef7fa', .8, 18, ink('#8aa0a8', .3, .5)), ell(-3, 1, 4.2, 1.1, '#eef7fa', .8, 16, ink('#8aa0a8', .3, .5)), ell(3, 1, 4.2, 1.1, '#eef7fa', .8, -16, ink('#8aa0a8', .3, .5)), path('M-.9 -3Q0 -5 .9 -3L.7 8L-.7 8Z', '#d8402c', 1, ink('#6e1a10', .5, .7)), circ(0, -3.4, 1.5, '#a02818'), '</g>'); });

// ======================= edges (47 blob) =======================
// raised terraces: a wall on the S side reads as a height step. Same outline in all five sets, so they can be mixed in one mask set.
const TMG = { n: 8, e: 8, s: 6, w: 8 };
const grassTop = (t) => { const r = rr('gtop'); let o = skeleton(GR); for (let i = 0; i < 4; i++) o += wrapped(r.range(0, T), r.range(0, T), 6, (a, b) => tuft(a, b, '#5f8f4c', .45, .8)); return o; };
const paddyTop = (stage, seed) => (t) => paddyBase(stage) + paddyLattice(t, stage, { seed, wet: stage !== 'ripe' });
blobSet(SUB, 'terrace-earth', { mg: TMG, R: 14, tags: ['terrace', 'height', 'bank', 'earth'], build: (t, G) => terracePiece(t, G, { top: grassTop, wall: earthWall(), lip: grassLip }) });
blobSet(SUB, 'terrace-stone', { mg: TMG, R: 14, tags: ['terrace', 'height', 'bank', 'stone', 'wall'], build: (t, G) => terracePiece(t, G, { top: grassTop, wall: stoneWall(2), lip: stoneLip }) });
blobSet(SUB, 'terrace-paddy-young', { mg: TMG, R: 14, tags: ['terrace', 'height', 'paddy', 'young'], build: (t, G) => terracePiece(t, G, { top: paddyTop('young', 1), wall: earthWall(), lip: bundLip, bund: true }) });
blobSet(SUB, 'terrace-paddy-ripe', { mg: TMG, R: 14, tags: ['terrace', 'height', 'paddy', 'ripe'], build: (t, G) => terracePiece(t, G, { top: paddyTop('ripe', 2), wall: earthWall(['#d8b886', '#b08a5c', '#7e5e3e'], 'ripe'), lip: bundLip, bund: true }) });
blobSet(SUB, 'terrace-paddy-stone', { mg: TMG, R: 14, tags: ['terrace', 'height', 'paddy', 'stone', 'mid'], build: (t, G) => terracePiece(t, G, { top: paddyTop('mid', 3), wall: stoneWall(1, undefined, 'sp'), lip: stoneLip, bund: true }) });
// flat paddy fields in the grass with an earth bund
function paddyField(stage, seed) {
  return (t, G) => {
    const clip = t.clip(G.d), id = clip.slice(5, -1);
    t.add(skeleton(GR), path(G.d, 'none', 1, { stroke: '#7a5c3c', 'stroke-width': 17, 'stroke-opacity': .13, 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#a98a58', 'stroke-width': 14.8, 'stroke-opacity': .55, 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#e0cb9a', 'stroke-width': 13, 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#f1e6c0', 'stroke-width': 7, 'stroke-opacity': .7, 'stroke-linejoin': 'round' }));
    t.add(`<g clip-path="url(#${id})">`, paddyBase(stage), paddyLattice(t, stage, { seed, wet: stage !== 'ripe' && stage !== 'stubble' }), path(G.d, 'none', 1, { stroke: '#3b3a24', 'stroke-width': 9, 'stroke-opacity': .1, 'stroke-linejoin': 'round' }), '</g>');
    const r = rr('pf' + stage);
    for (let i = 0; i < 6; i++) { const x = r.range(4, 60), y = r.range(4, 60); if (!inShape(G, x, y, 3) && inShape(G, x, y, -7)) t.add(tuft(x, y + 3, '#5f9a48', .8, .7)); }
  };
}
for (const [st, sd] of [['young', 4], ['ripe', 5], ['stubble', 6]]) blobSet(SUB, 'paddy-field-' + st, { mg: { n: 7, e: 7, s: 7, w: 7 }, R: 16, tags: ['paddy', st, 'flat', 'field'], build: paddyField(st, sd) });
// lake shore into an earthen terrace bank: the same outline as the common water-shore / Mirror Lake shore sets (margin 9, radius 22)
blobSet(SUB, 'lake-bank-earth', {
  mg: { n: 9, e: 9, s: 9, w: 9 }, R: 22, tags: ['water', 'lake', 'shore', 'bank', 'blend', 'mirror-lake'],
  build(t, G) {
    const clip = t.clip(G.d), id = clip.slice(5, -1), r = rr('lbe');
    t.add(skeleton(GR), path(G.d, 'none', 1, { stroke: '#7a5c3c', 'stroke-width': 20, 'stroke-opacity': .12, 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#a98a58', 'stroke-width': 17, 'stroke-opacity': .55, 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#d6bc88', 'stroke-width': 15, 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#ecdcae', 'stroke-width': 7, 'stroke-opacity': .6, 'stroke-linejoin': 'round' }));
    t.add(`<g clip-path="url(#${id})">`, waterFill('shallow'), path(G.d, 'none', 1, { stroke: '#d8f0ee', 'stroke-width': 11, 'stroke-opacity': .4, 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#2a4a63', 'stroke-width': 4, 'stroke-opacity': .12, 'stroke-linejoin': 'round' }), '</g>', path(G.d, 'none', 1, { stroke: P.water.rim, 'stroke-width': 1.2, 'stroke-opacity': .45, 'stroke-linejoin': 'round' }));
    for (let i = 0; i < 10; i++) { const x = r.range(3, 61), y = r.range(3, 61), k = r(); if (!inShape(G, x, y, 2) && inShape(G, x, y, -9)) t.add(k < .5 ? tuft(x, y + 3, '#5f9a48', .85, .8) : pebbleSmall(x, y, r.range(.7, 1), r.int(0, 3))); }
  },
});

// ======================= connect-4: irrigation channel, wooden flume, drying-rack line =======================
const C = connect(SUB), CK = ink('#3b2a1a', .8, .7);
C('channel-water', (t, m) => {
  const c = 32, W = 7, B = 11, dirs = [[m & 1, 0, -1], [m & 2, 1, 0], [m & 4, 0, 1], [m & 8, -1, 0]];
  const box = (w, col, op = 1) => { let o = rect(c - w, c - w, 2 * w, 2 * w, col, w * .6, op); for (const [on, dx, dy] of dirs) if (on) o += dx ? rect(dx > 0 ? c : 0, c - w, 32, 2 * w, col, 0, op) : rect(c - w, dy > 0 ? c : 0, 2 * w, 32, col, 0, op); return o; };
  t.add(box(B + 3, '#3b3a24', .1), box(B, '#9b7a4e'), box(B - 1.6, '#d6bc88'), box(W + 1, '#6e9fb0'), box(W, t.lg(['#b8e2e6', '#8cc3d3'], 90)));
  const r = rr('ch' + m); for (const [on, dx, dy] of dirs) if (on) for (let i = 0; i < 2; i++) { const a = 8 + i * 22 + r.range(-3, 3); t.add(dx ? line(`M${dx > 0 ? c + a - 8 : c - a}  ${c - 2 + i * 4}q3 -1.2 6 0`, '#fff', 1, .75) : line(`M${c - 2 + i * 4} ${dy > 0 ? c + a - 8 : c - a}q-1.2 3 0 6`, '#fff', 1, .75)); }
  t.add(ell(c - 2, c - 1, 4, 1.4, '#fff', .6), ell(c, c, W - 2, W - 3, 'none', 1, 0, { fill: 'none', stroke: '#fff', 'stroke-width': .8, 'stroke-opacity': .5 }));
  for (const [x, y] of [[c - B + 1, c - B - 2], [c + B - 2, c + B + 1]]) if (!(m & 1) && y < c) t.add(tuft(x, y + 5, '#5f9a48', .8, .6)); else if (!(m & 4) && y > c) t.add(tuft(x, y + 1, '#5f9a48', .8, .6));
}, ['channel', 'water', 'irrigation']);
C('channel-flume', (t, m) => {   // raised wooden trough on trestles; water on top. Arms continue; the south arm hangs towards the viewer
  const c = 32, y0 = 26, h = 12, wd = t.lg(['#d8b274', '#a87c46', '#7a5230'], 90), pl = ink('#4a3220', .8, .8), dirs = { n: m & 1, e: m & 2, s: m & 4, w: m & 8 };
  const leg = (x, y) => rect(x - 2.4, y, 4.8, 64 - y - 4, t.lg(['#b8905c', '#6b4a2c'], 0), 1, 1, pl);
  t.add(rect(8, 56, 48, 5, '#3b3a24', 2.5, .15));
  const [x0, x1] = armX(m);
  if (dirs.n) t.add(rect(c - 8, 0, 16, y0 + 2, wd, 0, 1, pl), rect(c - 5.5, 0, 11, y0, '#9fd0dc'), line(`M${c - 2} 2v18M${c + 2} 6v14`, '#fff', 1, .7));
  if (dirs.s) { t.add(leg(c - 6, y0 + h), leg(c + 6, y0 + h)); }
  else t.add(leg(c - 7, y0 + h), leg(c + 7, y0 + h));
  if (x1 > x0) { for (const lx of [10, 54]) if (lx > x0 + 3 && lx < x1 - 3) t.add(leg(lx, y0 + h)); t.add(rect(x0, y0, x1 - x0, h, wd, 0, 1, pl), rect(x0, y0 - 1, x1 - x0, 5, '#9fd0dc', 0, 1, ink('#4f8aa8', .6, .6)), rect(x0, y0 - 1, x1 - x0, 1.2, '#fff', 0, .6), line(`M${x0 + 4} ${y0 + 1.6}q4 -1.4 8 0M${x0 + 30} ${y0 + 1.4}q4 -1.4 8 0`, '#fff', 1, .7), rect(x0, y0 + 6, x1 - x0, 1, '#4a3220', 0, .35)); }
  t.add(rect(c - 9, y0 - 2, 18, h + 4, wd, 3, 1, pl), rect(c - 7, y0 - 1.4, 14, 5.4, '#9fd0dc', 2), rect(c - 9, y0 - 2, 18, 2, '#fff', 1, .3));
  if (dirs.s) t.add(rect(c - 8, y0 + h, 16, 64 - y0 - h, wd, 0, 1, pl), rect(c - 5.5, y0 + h, 11, 64 - y0 - h, '#9fd0dc', 0, .0));
}, ['channel', 'flume', 'wood', 'water', 'obstacle']);
C('rack-line', (t, m) => {   // hasa: rice drying rack, sheaves hang over a horizontal pole between posts
  const c = 32, by = 52, [x0, x1] = armX(m), post = t.lg(['#b08a58', '#6b4a2c'], 0), shv = (x, y) => path(`M${x - 4} ${y}L${x - 1.4} ${y + 18}H${x + 1.4}L${x + 4} ${y}Z`, t.lg(['#f3d878', '#c9a032'], 90), 1, ink('#7a5a1c', .6, .8)) + line(`M${x - 2} ${y + 3}v12M${x + 2} ${y + 3}v12`, '#a8802a', .8, .6) + ell(x, y + 18.6, 2.2, .8, '#7a5a1c', .8);
  t.add(ell(c + 2, by + 3, 8, 2.6, '#3b3a24', .22)); if (x1 > x0) t.add(rect(x0 + 1, by + 1.5, x1 - x0, 2.6, '#3b3a24', 1.3, .15));
  if (m & 1) t.add(rect(c - 2, 0, 4, by - 2, post, 1, 1, CK)); if (m & 4) t.add(rect(c - 2.2, by - 1, 4.4, 64 - by + 1, post, 1, 1, CK), rect(c - 2.2, 60, 4.4, 4, '#3b3a24', 0, .12));
  if (x1 > x0) { for (const sx of [0, 16, 32, 48, 64]) if (sx > x0 && sx < x1) t.add(rect(sx - 1.6, 18, 3.2, by - 18, post, 1, 1, CK)); for (const yy of [22, 34]) t.add(rect(x0, yy, x1 - x0, 2.4, '#8a6a44', 1, 1, CK)); for (let x = Math.ceil((x0 + 4) / 8) * 8 - 4; x < x1; x += 8) if (x > x0 + 2 && x < x1 - 2) t.add(shv(x, 24)); }
  t.add(rect(c - 2.8, 14, 5.6, by - 13, post, 1, 1, CK), rect(c - 2, 16, 1.2, 30, '#e2c892', 0, .4), rect(c - 7, 20, 14, 2.4, '#8a6a44', 1, 1, CK), rect(c - 7, 32, 14, 2.4, '#8a6a44', 1, 1, CK), shv(c - 5, 24), shv(c + 5, 24), tuft(c + 10, by + 2, '#4d7a40', .8, .6));
}, ['rack', 'harvest', 'obstacle']);

await import('./gen-rice-objects.mjs');
