// Mossy Ruins (greenvale/mossy-ruins): flagstone and moss ground, murky pools, paving/moss/pool/terrace autotiles, crumbled walls, decals. Objects: gen-ruins-objects.mjs.
import { T, P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, FAM, skeleton, inShape, blobSet, maker, bloom, scat, C4, SUBS, sparkle, BIT, fronds, mush, rockS, blobPath } from './sub.mjs';
import { interior, waterFill } from './ground.mjs';
import { wrapped } from './lib.mjs';
import { ring, pebbleSmall } from './water-lib.mjs';
import { FLAG, MOSS, mossBlob, crack, ivySprig, murk } from './ruins-lib.mjs';
import { sym, use, connect, armX, terracePiece, stoneWall, stoneLip } from './rice-lib.mjs';

const SUB = SUBS.ruins, { mk, out } = maker(SUB);
const GR = FAM.grass;
const rr = (s) => rng(hash(s));
const JOINT = '#6a7064';

// ---- shared mossy helpers ----

// ---- flagstone base: shared by every paving tile (so all variants and the autotile interior match) ----
export function flagBase() {
  const r = rng(hash('flag-slabs')); let o = skeleton(FLAG);
  const tints = ['#d8dccb', '#c4c9b6', '#cfd4be', '#bfc5b2'];
  [[34, 18], [2, 18], [18, 50], [50, 50]].forEach(([cx, cy], i) => { o += wrapped(cx, cy, 17, (x, y) => rect(x - 15.3, y - 15.3, 30.6, 30.6, tints[i], 3, .78) + rect(x - 15.3, y - 15.3, 30.6, 2, '#fff', 1, .3) + rect(x - 15.3, y + 13.2, 30.6, 2.2, '#5a6055', 1, .14) + ell(x - 4, y - 5, 9, 4, '#fff', .12, -20)); });
  const J = `M0 2H64M0 34H64M18 2V34M50 2V34M2 34V66M2 -30V2M34 34V66M34 -30V2`;
  return o + line(J, JOINT, 1.5, .6) + line(J, '#f0f3e6', .6, .35, { transform: 'translate(.7 .7)' });
}
const flagTufts = (r, n) => { let o = ''; for (let i = 0; i < n; i++) { const x = r.range(8, 56), y = r.range(10, 56); o += tuft(x, y, '#5f9a48', .75, .6); } return o; };
const mossy = (r, n, w0 = 5, w1 = 11) => { let o = ''; for (let i = 0; i < n; i++) { const x = r.range(14, 50), y = r.range(14, 50); o += mossBlob(x, y, r.range(w0, w1), r.range(w0, w1) * .55, i + 1); } return o; };
const jointMoss = (r) => { let o = ''; const segs = [[18, 8, 28, 1], [50, 8, 28, 1], [34, 40, 60, 1], [10, 34, 28, 0], [40, 34, 58, 0], [12, 2, 28, 0]]; for (const [a, b, c, v] of segs) for (let k = 0; k < 3; k++) if (r() < .55) { const q = r.range(b, c), w = r.range(1.6, 3.2); o += v ? ell(a + r.range(-.8, .8), q, w * .8, w, '#7fae5e', .9, 0, ink('#3f6a38', .3, .5)) + ell(a - .6, q - .6, w * .35, w * .4, '#c8e2a2', .6) : ell(q, a + r.range(-.8, .8), w, w * .8, '#7fae5e', .9, 0, ink('#3f6a38', .3, .5)) + ell(q - .6, a - .6, w * .4, w * .35, '#c8e2a2', .6); } return o; };
const pebs = (r, n) => scat(r, n, 12, 10).map(([x, y]) => pebbleSmall(x, y, r.range(.7, 1), r.int(0, 3))).join('');
const gap = (x, y, w, h) => path(`M${x} ${y + 3}Q${x - 1} ${y - h * .4} ${x + w * .4} ${y - 2}Q${x + w} ${y - h * .6} ${x + w} ${y + h * .2}Q${x + w * .8} ${y + h} ${x + w * .3} ${y + h}Q${x - 1} ${y + h} ${x} ${y + 3}Z`, '#6e5c3c', 1, ink('#3b2e1a', .8, .7)) + ell(x + w * .5, y + h * .5, w * .35, h * .2, '#4a3c24', .6) + tuft(x + w * .8, y + h, '#5f9a48', .8, .6);
const sheen = (x, y, w) => ell(x, y, w, w * .4, '#bcd8e0', .6) + ell(x - w * .2, y - w * .1, w * .6, w * .14, '#fff', .55);
const puddleDeep = (x, y, w, h) => ell(x, y, w, h, '#6a8a8a', .5, 0, ink('#4a6a6a', .7, .6)) + ell(x, y + .5, w - 1.5, h - 1, '#9ac4c8', .85) + ell(x - w * .25, y - h * .25, w * .5, h * .2, '#fff', .55);

// ======================= ground =======================
const FL = {
  'flagstone-mossy': { a: (r) => jointMoss(r) + mossy(r, 2, 4, 7), b: (r) => jointMoss(r) + mossy(r, 4, 5, 9) + flagTufts(r, 2), c: (r) => mossy(r, 7, 7, 13) + jointMoss(r) + flagTufts(r, 3), d: (r) => jointMoss(r) + mossy(r, 3, 5, 8) + fronds(32, 40, 4, 10, ['#6fb560', '#3f8048']) },
  'flagstone-cracked': { a: (r) => crack(r, 24, 22, 22) + crack(r, 40, 42, 14) + jointMoss(r), b: (r) => gap(34, 36, 11, 8) + crack(r, 24, 22, 16) + jointMoss(r), c: (r) => crack(r, 22, 44, 20) + crack(r, 42, 22, 20) + flagTufts(r, 4), d: (r) => gap(22, 20, 10, 9) + crack(r, 42, 42, 18) + pebs(r, 4) + flagTufts(r, 2) },
  'flagstone-wet': { a: (r) => sheen(26, 22, 9) + sheen(42, 48, 7) + jointMoss(r), b: (r) => puddleDeep(30, 40, 13, 5) + sheen(40, 18, 7) + jointMoss(r), c: (r) => puddleDeep(24, 26, 9, 4) + puddleDeep(44, 46, 8, 3.4) + mossy(r, 2, 4, 7) },
  'flagstone-broken': { a: (r) => gap(10, 12, 9, 7) + pebs(r, 5) + flagTufts(r, 3) + crack(r, 38, 40, 14), b: (r) => gap(36, 40, 12, 9) + pebs(r, 4) + mossy(r, 2, 5, 8) + fronds(20, 22, 3, 8, ['#6fb560', '#3f8048']) },
};
for (const [name, vars] of Object.entries(FL)) for (const [vv, fn] of Object.entries(vars)) { const t = mk('ground', name, vv); t.add(flagBase(), fn(rr(name + vv))); out(t, 'ground', name, vv, ['seamless', 'ground', 'paving', 'stone', 'ruin']); }
const MG = {
  'moss-grass': { a: (r) => interior(MOSS, 8011, { n: 3, tufts: 3 }) + scat(r, 3, 12, 14).map(([x, y]) => bloom('clover', x, y, .6)).join(''), b: (r) => interior(MOSS, 8012, { n: 4, cols: ['#94bc70', '#a8cf86'], tufts: 4 }), c: (r, t) => interior(MOSS, 8013, { n: 3, tufts: 2 }) + mush(t, 24, 42, .5, ['#f0b878', '#c8803a'], { spots: false }) + mush(t, 38, 34, .4, ['#f2c88a', '#c8803a'], { spots: false }) },
  'moss-thick': { a: (r) => interior(MOSS, 8021, { n: 5, cols: ['#7fae5e', '#94bc70', '#6fa050'], tufts: 2 }) + scat(r, 4, 12, 12).map(([x, y]) => ell(x, y, 3.4, 1.6, '#c8e2a2', .6)).join(''), b: (r) => interior(MOSS, 8022, { n: 5, cols: ['#86b865', '#a8cf86'], tufts: 3 }) + fronds(30, 38, 4, 10, ['#6fb560', '#3f8048']) },
};
for (const [name, vars] of Object.entries(MG)) for (const [vv, fn] of Object.entries(vars)) { const t = mk('ground', name, vv); t.add(skeleton(MOSS), fn(rr(name + vv), t)); out(t, 'ground', name, vv, ['seamless', 'ground', 'moss', 'ruin']); }
// murky pools: shallow-water skeleton with a green-black wash; plain, duckweed, lily
const MW = { a: (r) => ring(24, 28, 8, '#d8f0e0', .5), b: (r) => { let o = ''; for (let i = 0; i < 3; i++) { const x = r.range(16, 48), y = r.range(16, 48); o += ell(x, y, r.range(6, 10), r.range(3, 5), '#8fd078', .5, r.range(0, 180)); for (let k = 0; k < 8; k++) o += circ(x + r.range(-6, 6), y + r.range(-3, 3), r.range(.6, 1.1), '#5fae5c', .85); } return o; }, c: (r) => ell(30, 30, 7, 3.2, '#8fd078', 1, 0, ink('#3a8048', .6, .7)) + ell(44, 42, 5, 2.4, '#7cc468', 1, 0, ink('#3a8048', .6, .7)) + ell(40, 22, 6, 2.6, '#a8dc88', 1, 20, ink('#3a8048', .6, .7)) + ell(30, 29, 2, 1, '#fff', .5) };
for (const [vv, fn] of Object.entries(MW)) { const t = mk('ground', 'ruin-water', vv); t.add(murk(), fn(rr('rw' + vv))); out(t, 'ground', 'ruin-water', vv, ['seamless', 'ground', 'water', 'murky', 'ruin']); }
// baked detail: moss stones, leaf litter, glyph paving, tile shards, fern floor
const mstone = (x, y, s = 1) => ell(x + 1, y + 2, 5 * s, 1.8 * s, '#3b3a24', .15) + ell(x, y, 4.6 * s, 3.2 * s, '#a2a596', 1, 0, ink(P.inkR, .6, .65)) + path(`M${f(x - 4.4 * s)} ${f(y - .6 * s)}Q${f(x - 2 * s)} ${f(y - 4 * s)} ${f(x + 3 * s)} ${f(y - 2.4 * s)}Q${f(x)} ${f(y - 1.4 * s)} ${f(x - 4.4 * s)} ${f(y - .6 * s)}Z`, '#7fae5e', .95) + ell(x - 1.4 * s, y - 1.4 * s, 1.8 * s, .9 * s, '#e0e1d6', .6);
const leafB = (r, n, cols) => scat(r, n, 9, 8).map(([x, y]) => `<g transform="rotate(${f(r.range(0, 360))} ${f(x)} ${f(y)})"><path d="M${f(x - 3.4)} ${f(y)}Q${f(x)} ${f(y - 3.4)} ${f(x + 3.4)} ${f(y)}Q${f(x)} ${f(y + 3.4)} ${f(x - 3.4)} ${f(y)}Z" fill="${r.pick(cols)}" stroke="#4a3220" stroke-width=".5" stroke-opacity=".5"/></g>`).join('');
const glyph = () => '<g opacity=".7">' + ell(32, 32, 22, 22, 'none', 1, 0, { fill: 'none', stroke: '#8a9080', 'stroke-width': 1.4 }) + ell(32, 32, 14, 14, 'none', 1, 0, { fill: 'none', stroke: '#8a9080', 'stroke-width': 1.1 }) + line('M32 14L45 38H19Z', '#8a9080', 1.1, .9) + line('M32 50L19 26H45Z', '#8a9080', 1.1, .9) + '</g>';
const GD = {
  'moss-stones': { a: (r) => interior(MOSS, 8101, { n: 3, tufts: 2 }) + mstone(22, 30, 1) + mstone(40, 42, .8) + mstone(44, 22, .6), b: (r) => interior(MOSS, 8102, { n: 3, tufts: 2 }) + mstone(30, 36, 1.2) + mstone(16, 20, .7) },
  'ruin-leaves': { a: (r) => interior(MOSS, 8111, { n: 2, tufts: 1 }) + leafB(r, 9, ['#f3a45a', '#d2622e', '#e8c060']), b: (r) => interior(MOSS, 8112, { n: 2, tufts: 1 }) + leafB(r, 12, ['#d2622e', '#a03c22', '#f3a45a']) },
  'ruin-fern': { a: (r) => interior(MOSS, 8121, { n: 3, tufts: 1 }) + fronds(22, 40, 5, 11, ['#6fb560', '#3f8048']) + fronds(42, 26, 4, 9, ['#86cd7f', '#4a9a50']), b: (r) => interior(MOSS, 8122, { n: 3, tufts: 1 }) + fronds(32, 38, 6, 12, ['#6fb560', '#3f8048', '#86cd7f']) },
};
for (const [name, vars] of Object.entries(GD)) for (const [vv, fn] of Object.entries(vars)) { const t = mk('ground-detail', name, vv); t.add(skeleton(MOSS), fn(rr(name + vv))); out(t, 'ground-detail', name, vv, ['seamless', 'ground', 'moss', 'ruin']); }
for (const [vv, fn] of Object.entries({ a: () => glyph() + jointMoss(rr('g1')), b: () => glyph() + gap(40, 40, 10, 8) })) { const t = mk('ground-detail', 'glyph-paving', vv); t.add(flagBase(), fn()); out(t, 'ground-detail', 'glyph-paving', vv, ['seamless', 'ground', 'paving', 'glyph', 'ruin']); }
for (const [vv, fn] of Object.entries({ a: (r) => { let o = ''; for (const [x, y] of scat(r, 5, 12, 12)) o += `<g transform="rotate(${f(r.range(0, 360))} ${f(x)} ${f(y)})">` + path(`M${f(x - 6)} ${f(y)}Q${f(x)} ${f(y - 5)} ${f(x + 6)} ${f(y)}L${f(x + 4)} ${f(y + 2.4)}Q${f(x)} ${f(y - 1)} ${f(x - 4)} ${f(y + 2.4)}Z`, '#6f7f98', 1, ink('#2a3a53', .6, .8)) + '</g>'; return o; }, b: (r) => { let o = ''; for (const [x, y] of scat(r, 7, 10, 9)) o += ell(x, y, 3.2, 2, '#7a8aa4', 1, r.range(0, 180), ink('#2a3a53', .5, .75)) + ell(x - .8, y - .6, 1.4, .6, '#c8d0e0', .8); return o; } })) { const t = mk('ground-detail', 'tile-shards', vv); t.add(skeleton(MOSS), interior(MOSS, 8131, { n: 2, tufts: 2 }), fn(rr('ts' + vv))); out(t, 'ground-detail', 'tile-shards', vv, ['seamless', 'ground', 'ruin']); }

// ======================= decals =======================
const decal = (name, v, fn, tags = []) => { const t = mk('decals', name, v); fn(t, rr(name + v)); out(t, 'decals', name, v, ['overlay', 'decal', 'transparent', 'ruin', ...tags]); };
for (const v of ['a', 'b', 'c', 'd']) decal('moss-patch', v, (t, r) => { for (let i = 0; i < 3 + (v > 'b' ? 2 : 0); i++) t.add(mossBlob(r.range(14, 50), r.range(16, 48), r.range(8, 15), r.range(5, 9), i + 3)); });
for (const v of ['a', 'b', 'c', 'd']) decal('crack-paving', v, (t, r) => { t.add(crack(r, r.range(16, 40), r.range(16, 40), r.range(20, 30), 1.2), crack(r, r.range(20, 44), r.range(24, 48), 14, 1)); if (v === 'c') t.add(...[0, 1, 2].map(() => tuft(r.range(14, 50), r.range(16, 50), '#5f9a48', .85, .7))); if (v === 'd') t.add(gap(24, 26, 12, 9)); });
for (const v of ['a', 'b', 'c', 'd']) decal('puddle', v, (t, r) => { if (v === 'a') t.add(puddleDeep(32, 34, 17, 7)); else if (v === 'b') t.add(puddleDeep(26, 28, 10, 4.4), puddleDeep(42, 42, 12, 5)); else if (v === 'c') t.add(puddleDeep(32, 34, 22, 10), ring(30, 34, 6, '#fff', .6)); else t.add(puddleDeep(32, 34, 14, 7), mossBlob(22, 38, 5, 3, 1), mossBlob(42, 30, 4, 2.6, 2), ell(36, 34, 3, 1, '#f3a45a', .9, 20)); }, ['water']);
for (const v of ['a', 'b', 'c']) decal('ivy-ground', v, (t, r) => { for (let i = 0; i < 3; i++) t.add(ivySprig(r, r.range(10, 54), r.range(10, 54), r.range(18, 28), r.range(0, 6.28))); });
for (const v of ['a', 'b', 'c']) decal('vine-creep', v, (t, r) => { t.add(ivySprig(r, 6, r.range(20, 44), 54, r.range(-.5, .5), 12), ivySprig(r, 10, r.range(20, 44), 40, r.range(-.4, .4), 9)); });
for (const v of ['a', 'b', 'c']) decal('rubble-scatter', v, (t, r) => { for (const [x, y] of scat(r, 6 + (v === 'c' ? 2 : 0), 10, 9)) t.add(ell(x + .8, y + 1.6, 4.4, 1.6, '#3b3a24', .15), path(`M${f(x - 4)} ${f(y + 1)}L${f(x - 2)} ${f(y - 3)}L${f(x + 3)} ${f(y - 2.4)}L${f(x + 4.4)} ${f(y + 1.2)}Z`, r.pick(['#b4ad98', '#a2a596', '#cfd0c4']), 1, ink(P.inkR, .6, .7)), ell(x - 1, y - 1.2, 1.6, .7, '#fff', .5)); });
for (const v of ['a', 'b']) decal('tile-shards', v, (t, r) => { for (const [x, y] of scat(r, 5, 10, 10)) t.add(`<g transform="rotate(${f(r.range(0, 360))} ${f(x)} ${f(y)})">` + path(`M${f(x - 6)} ${f(y)}Q${f(x)} ${f(y - 5)} ${f(x + 6)} ${f(y)}L${f(x + 4)} ${f(y + 2.4)}Q${f(x)} ${f(y - 1)} ${f(x - 4)} ${f(y + 2.4)}Z`, '#6f7f98', 1, ink('#2a3a53', .6, .8)) + '</g>'); });
for (const v of ['a', 'b', 'c']) decal('fallen-leaves', v, (t, r) => t.add(leafB(r, 7 + (v === 'c' ? 4 : 0), v === 'a' ? ['#f3a45a', '#d2622e'] : v === 'b' ? ['#e8c060', '#d2622e'] : ['#a03c22', '#d2622e', '#f3a45a'])));
for (const v of ['a', 'b']) decal('glyph-faded', v, (t) => t.add(glyph().replace('opacity=".7"', 'opacity=".55"'), v === 'b' ? crack(rr('gf'), 20, 20, 30) : ''));
for (const v of ['a', 'b']) decal('moss-chunks', v, (t, r) => { for (const [x, y] of scat(r, v === 'a' ? 2 : 3, 14, 16)) t.add(mstone(x, y, r.range(.9, 1.3))); });

// ======================= edges (47 blob) =======================
// paving patch on grass: ragged mossy edge
blobSet(SUB, 'ruin-paving', {
  mg: { n: 6, e: 6, s: 6, w: 6 }, R: 14, tags: ['paving', 'ruin', 'stone', 'patch'],
  build(t, G) {
    const clip = t.clip(G.d), id = clip.slice(5, -1), r = rr('rpv');
    t.add(skeleton(GR), path(G.d, 'none', 1, { stroke: '#5f8f4c', 'stroke-width': 11, 'stroke-opacity': .2, 'stroke-linejoin': 'round' }), `<g clip-path="url(#${id})">`, flagBase(), path(G.d, 'none', 1, { stroke: '#8a9080', 'stroke-width': 6, 'stroke-opacity': .3, 'stroke-linejoin': 'round' }), '</g>');
    t.add(path(G.d, 'none', 1, { stroke: '#7fae5e', 'stroke-width': 6, 'stroke-opacity': .85, 'stroke-dasharray': '4 5', 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#a8cf86', 'stroke-width': 3, 'stroke-opacity': .7, 'stroke-dasharray': '2 9', 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#6a7064', 'stroke-width': 1, 'stroke-opacity': .45, 'stroke-linejoin': 'round' }));
    for (let i = 0; i < 6; i++) { const x = r.range(4, 60), y = r.range(4, 60); if (!inShape(G, x, y, 3) && inShape(G, x, y, -9)) t.add(tuft(x, y + 3, '#5f9a48', .8, .7)); }
  },
});
blobSet(SUB, 'moss-carpet', {
  mg: { n: 6, e: 6, s: 6, w: 6 }, R: 22, tags: ['moss', 'patch', 'ruin', 'blend'],
  build(t, G) {
    const clip = t.clip(G.d), id = clip.slice(5, -1), r = rr('mc');
    t.add(skeleton(GR), path(G.d, 'none', 1, { stroke: '#94bc70', 'stroke-width': 12, 'stroke-opacity': .22, 'stroke-linejoin': 'round' }), `<g clip-path="url(#${id})">`, skeleton(MOSS), path(G.d, 'none', 1, { stroke: '#cfe6a8', 'stroke-width': 6, 'stroke-opacity': .5, 'stroke-linejoin': 'round' }), '</g>', path(G.d, 'none', 1, { stroke: '#5f8f4c', 'stroke-width': 1.2, 'stroke-opacity': .45, 'stroke-linejoin': 'round' }));
    for (let i = 0; i < 5; i++) { const x = r.range(6, 58), y = r.range(6, 58); if (inShape(G, x, y, 4)) t.add(ell(x, y, 3, 1.4, '#c8e2a2', .6, r.range(0, 180))); }
  },
});
// murky pool with a mossy stone coping
blobSet(SUB, 'ruin-pool', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 20, tags: ['water', 'pool', 'ruin', 'murky'],
  build(t, G) {
    const clip = t.clip(G.d), id = clip.slice(5, -1);
    t.add(skeleton(GR), path(G.d, 'none', 1, { stroke: '#3b3a24', 'stroke-width': 17, 'stroke-opacity': .12, 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#74786a', 'stroke-width': 14, 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#b4b8a6', 'stroke-width': 12, 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#d8dccb', 'stroke-width': 6, 'stroke-opacity': .6, 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#8a9080', 'stroke-width': 12, 'stroke-opacity': .5, 'stroke-dasharray': '1.4 7', 'stroke-linejoin': 'round' }));
    t.add(`<g clip-path="url(#${id})">`, murk(), path(G.d, 'none', 1, { stroke: '#1d3a30', 'stroke-width': 8, 'stroke-opacity': .22, 'stroke-linejoin': 'round' }), '</g>', path(G.d, 'none', 1, { stroke: '#7fae5e', 'stroke-width': 10, 'stroke-opacity': .8, 'stroke-dasharray': '5 8', 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#4a463c', 'stroke-width': 1, 'stroke-opacity': .5, 'stroke-linejoin': 'round' }));
  },
});
// terraces climbing into the ruins (same outline as the Rice Terraces sets: all can share one mask set)
const TMG = { n: 8, e: 8, s: 6, w: 8 };
const mossTop = () => { const r = rr('mtop'); let o = skeleton(MOSS); for (let i = 0; i < 4; i++) o += wrapped(r.range(0, T), r.range(0, T), 6, (a, b) => tuft(a, b, '#4d7a40', .45, .8)); return o; };
const mossLip = (t, a, b, y) => { let o = rect(a, y - 1, b - a, 4, '#eeeadb') + rect(a, y - 1, b - a, 1, '#fff', 0, .7) + rect(a, y + 2.8, b - a, 1, '#4a463c', 0, .4); for (let x = Math.ceil(a / 10) * 10 + 4; x < b; x += 10) o += path(`M${x - 4} ${y - 1}q4 -3 8 0q-1 6 -4 8q-2 -3 -4 -8Z`, '#86b865', .95, ink('#3f6a38', .4, .6)); return o; };
const MSTN = ['#c4c9b6', '#98a08a', '#6a7260'];
blobSet(SUB, 'terrace-mossy', { mg: TMG, R: 14, tags: ['terrace', 'height', 'stone', 'wall', 'mossy', 'ruin', 'blend', 'rice-terraces'], build: (t, G) => terracePiece(t, G, { top: mossTop, wall: stoneWall(9, MSTN, 'mz'), lip: mossLip }) });
blobSet(SUB, 'platform-paved', { mg: TMG, R: 14, tags: ['terrace', 'height', 'paving', 'platform', 'ruin'], build: (t, G) => terracePiece(t, G, { top: flagBase, wall: stoneWall(5, MSTN, 'pp'), lip: stoneLip }) });

// ======================= connect-4: crumbled walls, low rubble wall, flagstone path =======================
const C = connect(SUB);
const WSTN = ['#cfd0c4', '#a2a596', '#74786a'];
// top height profile: fixed at the arm ends (x = 0, 64) so neighbours continue; notches vary with the mask
function wallTop(m, base, kind) {   // stepped crumbling in 8 px blocks; the two end blocks stay intact so neighbours continue
  const offs = Array.from({ length: 8 }, (_, b) => (b === 0 || b === 7) ? 0 : [0, 0, 5, 9, 14][hash('wt' + m + kind + b) % 5]);
  return (x) => base + offs[Math.min(7, Math.max(0, Math.floor(x / 8)))];
}
function ruinedWall(ivy, low = false) {
  return (t, m) => {
    const [x0, x1] = armX(m), cx = 32, by = 50, top = low ? 38 : 28, g = t.lg(WSTN, 90), prof = wallTop(m, top, low ? 'l' : 'h'), r = rr('rw' + m + (ivy ? 'i' : ''));
    t.add(ell(cx + 2, by + 3, 12, 3.4, '#3b3a24', .2)); if (x1 > x0) t.add(rect(x0 + 1, by + 2, x1 - x0, 3, '#3b3a24', 1.3, .17));
    if (m & C4.N) { t.add(rect(cx - 8, 0, 16, by - 14, t.lg(['#bfc0b0', '#8a8e7c'], 0), 3, 1, ink(P.inkR, .8, .75))); for (let y = 6; y < by - 20; y += 12) t.add(rect(cx - 8, y, 16, 1, P.inkR, 0, .35)); t.add(mossBlob(cx - 3, 8, 6, 3, m)); }
    if (x1 > x0) {
      let d = `M${x0} ${by}`; for (let x = x0; x <= x1; x += 2) d += `L${x} ${prof(x) + (x === 0 || x === 64 ? 0 : 0)}`; d += `L${x1} ${by}Z`;
      t.add(path(d, g, 1, ink(P.inkR, 1, .8)));
      for (const jx of [8, 24, 40, 56]) if (jx > x0 && jx < x1) t.add(rect(jx - .5, prof(jx) + 2, 1, 11, P.inkR, 0, .35));
      for (const jx of [0, 16, 32, 48, 64]) if (jx > x0 && jx < x1) t.add(rect(jx - .5, Math.max(prof(jx) + 12, top + 12), 1, by - Math.max(prof(jx) + 12, top + 12) - 1, P.inkR, 0, .35));
      t.add(rect(x0, top + 11, x1 - x0, 1, P.inkR, 0, .35), rect(x0, by - 1, x1 - x0, 1.2, P.inkR, 0, .7));
      let tp = `M${x0} ${prof(x0)}`; for (let x = x0 + 2; x <= x1; x += 2) tp += `L${x} ${prof(x)}`; t.add(line(tp, '#e8eadc', 2, .6));
      for (const [mx, w] of [[10, 12], [40, 14]]) if (mx > x0 - 6 && mx + w < x1 + 6) t.add(mossBlob(mx + w / 2, prof(mx + w / 2) + 1, w / 2, 3.4, mx));
      if (ivy) for (const sx of [12 + (m % 5) * 3, 44 - (m % 3) * 4]) if (sx > x0 + 3 && sx < x1 - 3) { const y0 = prof(sx); t.add(line(`M${sx} ${y0}q3 8 0 14q-3 5 1 10`, '#3a5a2a', 1, .9)); for (let k = 0; k < 6; k++) t.add(`<path d="M${sx + (k % 2 ? 2 : -2)} ${y0 + 2 + k * 4.6}q3 -2 5 0q-2 3 -5 1Z" fill="${k % 2 ? '#4a9a50' : '#5fae5c'}" stroke="#1d4a26" stroke-width=".4" stroke-opacity=".6"/>`); }
      if (low) { for (let i = 0; i < 4; i++) t.add(ell(x0 + 8 + i * 16 + r.range(-3, 3), top - 1 + r.range(-1, 2), r.range(3, 5), r.range(2, 3), '#b4ad98', 1, 0, ink(P.inkR, .5, .6))); }
    }
    const hp = prof(cx);
    t.add(rect(cx - 9, hp, 18, by - hp + 1, g, 3, 1, ink(P.inkR, 1, .8)), rect(cx - 9, hp, 18, 3, '#e8eadc', 2, .55), line(`M${cx - 9} ${top + 11}H${cx + 9}`, P.inkR, 1, .4), mossBlob(cx, hp, 8, 3.4, m + 7));
    if (ivy) { t.add(line(`M${cx + 4} ${hp}q4 8 0 14q-3 4 1 8`, '#3a5a2a', 1, .9)); for (let k = 0; k < 5; k++) t.add(`<path d="M${cx + 4 + (k % 2 ? 2 : -2)} ${hp + 2 + k * 4.6}q3 -2 5 0q-2 3 -5 1Z" fill="#4a9a50" stroke="#1d4a26" stroke-width=".4" stroke-opacity=".6"/>`); }
    if (m & C4.S) t.add(rect(cx - 8, by - 2, 16, 64 - by + 2, t.lg(['#bfc0b0', '#8a8e7c'], 0), 3, 1, ink(P.inkR, .8, .75)), rect(cx - 8, 60, 16, 4, '#3b3a24', 0, .12));
    t.add(tuft(cx + 10, by + 2, '#4d7a40', .8, .6));
  };
}
C('wall-ruined', ruinedWall(false), ['wall', 'ruin', 'mossy', 'obstacle']);
C('wall-ruined-ivy', ruinedWall(true), ['wall', 'ruin', 'ivy', 'obstacle']);
C('wall-ruined-low', ruinedWall(false, true), ['wall', 'ruin', 'rubble', 'low', 'obstacle']);
C('path-flagstone', (t, m) => {   // stepping slabs with moss between: a walkable trail drawn over any ground
  const c = 32, r = rr('pf' + m), slab = (x, y, w, h, i) => rect(x - w / 2 + .6, y - h / 2 + 1.6, w, h, '#3b3a24', 3, .14) + rect(x - w / 2, y - h / 2, w, h, t.lg(['#d8dccb', '#b4baa6'], 60), 3, 1, ink('#6a7064', .8, .65)) + rect(x - w / 2 + 1.4, y - h / 2 + 1, w - 4, 1.8, '#fff', 1, .4) + (i % 3 === 0 ? mossBlob(x - w * .2, y - h * .2, w * .22, h * .12, i + m) : '') + (i % 4 === 1 ? line(`M${f(x - 3)} ${f(y - 1)}l4 3`, '#6a7064', .8, .6) : '');
  t.add(slab(c, c, 24, 20, 1));
  if (m & 1) { t.add(slab(c + 1, 12, 20, 14, 2), slab(c - 1, 2, 18, 10, 3)); }
  if (m & 4) { t.add(slab(c - 1, 52, 20, 14, 4), slab(c + 1, 62, 18, 10, 5)); }
  if (m & 2) { t.add(slab(52, c + 1, 14, 18, 6), slab(62, c - 1, 10, 16, 7)); }
  if (m & 8) { t.add(slab(12, c - 1, 14, 18, 8), slab(2, c + 1, 10, 16, 9)); }
  t.add(tuft(c + 14, c + 14, '#5f9a48', .8, .5));
}, ['path', 'ruin', 'walkable']);

await import('./gen-ruins-objects.mjs');
