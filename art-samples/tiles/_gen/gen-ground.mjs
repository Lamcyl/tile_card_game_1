// Ground, ground-detail, decals, and autotile sets.
import { T, P, rng, hash, f, newTile, save, ell, circ, rect, path, line, ink, wrapped, tuft } from './lib.mjs';
import { FAM, skeleton, interior, groundTile, scatter, flower, daisy, clover, pebble, leaf, dandelion, shell, waterFill, BLOBS, blobTile, blobStyles, pad3 } from './ground.mjs';

// ---- seamless ground: variants share the family skeleton; extras stay in the inner 4..60 px ----
const specs = {
  grass: { a: (fam) => '', b: (fam) => interior(fam, 11, { n: 4, cols: ['#e4eeb4', '#cfe1a0'], tufts: 2 }), c: (fam) => interior(fam, 12, { n: 4, cols: ['#a4c878', '#b3d283'], tufts: 4 }), d: (fam) => interior(fam, 13, { n: 5, cols: ['#dfe8ae', '#a8cf86', '#bcd98d'], tufts: 5 }) },
  dirt: { a: (fam) => interior(fam, 21, { n: 3, tufts: 0 }), b: (fam) => interior(fam, 22, { n: 3, tufts: 1 }) + [[18, 20], [44, 40], [30, 48]].map(([x, y], i) => pebble(x, y, .8 + i * .1, P.stone)).join(''), c: (fam) => interior(fam, 23, { n: 4, cols: ['#b89c66', '#e4d3a8'], tufts: 2 }) + line('M14 40q8-4 14 0t12-2', '#a98a58', 1, .4) + line('M30 20q6 3 11-1', '#a98a58', 1, .35), d: (fam) => interior(fam, 24, { n: 3, tufts: 3 }) + ell(34, 34, 9, 4, '#b79a62', .4) },
  sand: { a: (fam) => interior(fam, 31, { n: 3, tufts: 0 }) + line('M12 24q6-3 12 0t12 0', '#c9b27a', 1, .5) + line('M26 46q6-3 12 0t12 0', '#c9b27a', 1, .5), b: (fam) => interior(fam, 32, { n: 3, tufts: 0 }) + shell(40, 22) + line('M10 44q6-3 12 0t12 0', '#c9b27a', 1, .5), c: (fam) => interior(fam, 33, { n: 4, cols: ['#f6ecc8', '#dccb92'], tufts: 1 }) + pebble(22, 36, .7, P.stone) },
  floor: { a: (fam) => interior(fam, 41, { n: 3, tufts: 2 }), b: (fam) => interior(fam, 42, { n: 3, tufts: 1 }) + leaf(22, 22, 20, '#e8a83a') + leaf(42, 44, -30, '#d2622e'), c: (fam) => interior(fam, 43, { n: 4, cols: ['#b9d394', '#8fb26c'], tufts: 0 }) + clover(30, 30) + clover(46, 20, .8) },
  top: { a: (fam) => interior(fam, 51, { n: 3, tufts: 0 }), b: (fam) => interior(fam, 52, { n: 3, tufts: 1 }) + pebble(24, 24, .8, P.stone) + pebble(42, 42, .6, P.stone) },
  shallow: {}, deep: {},
};
for (const [fam, vars] of Object.entries(specs)) for (const [v, fn] of Object.entries(vars)) {
  const t = newTile({ cat: 'ground', name: fam, variant: v }); t.add(skeleton(FAM[fam]), fn(FAM[fam]));
  save(t, { cat: 'ground', name: { floor: 'forest-floor', top: 'rock-top' }[fam] || fam, variant: v, tags: ['seamless', 'ground', fam] });
}
for (const k of ['shallow', 'deep']) ['a', 'b', 'c', 'd'].forEach((v, i) => {
  const t = newTile({ cat: 'ground', name: 'water-' + k, variant: v }); t.add(waterFill(k, i ? 70 + i * 3 + (k === 'deep' ? 20 : 0) : 0));
  save(t, { cat: 'ground', name: 'water-' + k, variant: v, tags: ['seamless', 'water', k] });
});

// ---- ground-detail: opaque grass tiles with decals kept inside the 6..58 safe zone ----
const G = FAM.grass;
const detail = {
  'flowers-white': (r) => scatter(r, 6, 10, 12).map(([x, y]) => daisy(x, y, 1 + r() * .3)).join(''),
  'flowers-yellow': (r) => scatter(r, 6, 10, 12).map(([x, y]) => flower(x, y, '#f3c24f')).join(''),
  'flowers-rose': (r) => scatter(r, 5, 10, 12).map(([x, y]) => flower(x, y, '#f6c6d4', 1.1)).join(''),
  'flowers-mixed': (r) => scatter(r, 8, 10, 11).map(([x, y], i) => flower(x, y, ['#f6c6d4', '#fffaf0', '#f3c24f', '#e9d6f2'][i % 4], .9)).join(''),
  'flowers-violet': (r) => scatter(r, 6, 10, 12).map(([x, y]) => flower(x, y, '#c9b3e6')).join(''),
  'clover': (r) => scatter(r, 6, 10, 12).map(([x, y]) => clover(x, y, 1 + r() * .3)).join(''),
  'clover-bloom': (r) => scatter(r, 5, 10, 13).map(([x, y], i) => clover(x, y) + (i % 2 ? circ(x + 4, y - 4, 1.6, '#fff') : circ(x - 4, y - 3, 1.6, '#f6c6d4'))).join(''),
  'pebbles': (r) => scatter(r, 5, 10, 11).map(([x, y]) => pebble(x, y, .7 + r() * .6)).join(''),
  'pebbles-moss': (r) => scatter(r, 4, 11, 14).map(([x, y]) => pebble(x, y, .9 + r() * .4, P.stoneG) + ell(x - 1, y - 2.4, 3, 1.1, '#7fae5e', .9)).join(''),
  'dandelions': (r) => scatter(r, 4, 12, 16).map(([x, y]) => dandelion(x, y + 4)).join(''),
  'long-grass': (r) => scatter(r, 7, 10, 10).map(([x, y]) => tuft(x, y + 4, '#4a8a46', .8, 1.2)).join(''),
  'acorns-leaves': (r) => scatter(r, 6, 10, 11).map(([x, y], i) => i % 2 ? leaf(x, y, r.range(0, 180), ['#e8a83a', '#d2622e', '#b8b068'][i % 3]) : circ(x, y, 1.8, '#8a6a44', 1, ink(P.inkW, .5, .6)) + circ(x, y - 1.1, 1.8, '#6b4a2c')).join(''),
};
let si = 0;
for (const [name, fn] of Object.entries(detail)) for (const v of ['a', 'b']) {
  const t = newTile({ cat: 'ground-detail', name, variant: v }); const r = rng(hash(name + v));
  t.add(skeleton(G), interior(G, 500 + si++, { n: 2, tufts: 1 }), fn(r));
  save(t, { cat: 'ground-detail', name: 'grass-' + name, variant: v, tags: ['seamless', 'ground', 'grass', 'decal-baked'] });
}
// dirt with pebbles / cracks and sand with shells are in ground/ above.

// ---- decals: transparent stamps for any ground ----
const stamps = {
  'flower-patch': (r) => scatter(r, 5, 12, 12).map(([x, y], i) => flower(x, y, ['#f6c6d4', '#fffaf0', '#f3c24f'][i % 3])).join(''),
  'clover-patch': (r) => scatter(r, 4, 12, 14).map(([x, y]) => clover(x, y)).join(''),
  'pebble-scatter': (r) => scatter(r, 4, 12, 13).map(([x, y]) => pebble(x, y, .7 + r() * .5)).join(''),
  'leaf-litter': (r) => scatter(r, 7, 10, 10).map(([x, y], i) => leaf(x, y, r.range(0, 180), ['#e8a83a', '#d2622e', '#b8b068', '#a8cf86'][i % 4])).join(''),
  'blossom-petals': (r) => scatter(r, 9, 8, 9).map(([x, y]) => ell(x, y, 2.2, 1.2, r() > .5 ? '#f6c6d4' : '#fbdde6', .95, r.range(0, 180))).join(''),
  'puddle': (r) => ell(32, 38, 15, 7, '#8cc6d2', .85) + ell(32, 38, 15, 7, 'none', 1, 0, { fill: 'none', stroke: '#4f8aa8', 'stroke-width': 1, 'stroke-opacity': .4 }) + ell(27, 36, 6, 2, '#e6f4f0', .7) + line('M36 40q3 1 6 0', '#fff', 1, .7),
  'mud-patch': (r) => ell(32, 38, 16, 8, '#a98a58', .55, 0) + ell(30, 36, 11, 5, '#8a6c40', .5) + ell(26, 34, 4, 1.6, '#c9ae7a', .6),
  'moss-patch': (r) => ell(32, 38, 15, 8, '#7fae5e', .6) + ell(30, 36, 10, 5, '#a8cf86', .6) + tuft(24, 40, '#4d7a40', .6) + tuft(38, 38, '#4d7a40', .6),
  'dry-grass': (r) => scatter(r, 6, 11, 11).map(([x, y]) => tuft(x, y + 4, '#b8a46a', .85, 1.15)).join(''),
  'mushroom-dots': (r) => scatter(r, 4, 12, 14).map(([x, y]) => ell(x, y + 2.4, 2.6, 1, '#3b3a24', .15) + path(`M${f(x - 3)} ${f(y + 1)}q3-5 6 0z`, '#c8352b', 1, ink(P.inkW, .5, .5)) + rect(x - .9, y + 1, 1.8, 2.2, '#fff6e0')).join(''),
  'snow-dusting': (r) => scatter(r, 6, 10, 11).map(([x, y]) => ell(x, y, 5, 2.2, '#f6f3e6', .8)).join(''),
};
si = 0;
for (const [name, fn] of Object.entries(stamps)) for (const v of ['a', 'b']) {
  const t = newTile({ cat: 'decals', name, variant: v }); const r = rng(hash('stamp' + name + v));
  t.add(fn(r)); save(t, { cat: 'decals', name, variant: v, tags: ['overlay', 'decal', 'transparent'] });
}

// ---- autotile sets: 47 blob pieces each ----
const setTags = { 'water-shore': ['water', 'shore'], 'water-deep': ['water', 'deep'], 'dirt-patch': ['transition', 'grass-to-dirt'], 'sand-patch': ['transition', 'grass-to-sand'], 'cliff': ['cliff'], 'forest': ['forest', 'tree-line'] };
for (const s of blobStyles) for (const m of BLOBS) {
  save(blobTile(s, m), { cat: 'edges', name: s, variant: pad3(m), tags: ['autotile', 'blob47', 'mask:' + m, ...setTags[s]] });
}
