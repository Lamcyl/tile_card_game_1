// Mirror Lake (greenvale/mirror-lake): lake water, reflections, pebble beach, lily beds, islands, jetties. Objects: gen-lake-objects.mjs.
import { T, P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, FAM, skeleton, inShape, blobSet, maker, bloom, scat, C4, SUBS, leafS, sparkle, BIT, blobGeom } from './sub.mjs';
import { interior, waterFill } from './ground.mjs';
import { wrapped } from './lib.mjs';
import { koi, ripple, ring, stoneW, pebbleSmall, pebbleWater, WMG, WR } from './water-lib.mjs';
import { refl, lilyPad, lotusBloom, PADC } from './lake-lib.mjs';

const SUB = SUBS.lake, { mk, out } = maker(SUB);
const GR = FAM.grass, SA = FAM.sand;

const PADS = (() => { const r = rng(hash('lily-cands')); return Array.from({ length: 34 }, () => ({ x: r.range(10, 54), y: r.range(10, 54), r: r.range(4.6, 7.6), a: r.range(0, 360), c: r.int(0, 3), u: r(), fl: r() })); })();

// ======================= ground: open water (reflections, ripples) =======================
const reflSet = (r, n, cols, wmax = 6) => { let o = ''; for (let i = 0; i < n; i++) o += refl(r.range(12, 52), r.range(10, 34), r.range(2.4, wmax), r.range(10, 22), r.pick(cols), r.range(.14, .3), r.range(0, 6)); return o; };
const sky = (r, n) => { let o = ''; for (let i = 0; i < n; i++) o += ell(r.range(16, 48), r.range(16, 48), r.range(8, 14), r.range(2, 4), '#fff', r.range(.22, .4), r.range(-8, 8)); return o; };
const glints = (r, n, col = '#fff') => { let o = ''; for (let i = 0; i < n; i++) o += sparkle(r.range(10, 54), r.range(10, 54), r.range(.4, .7), col); return o; };
const rings = (r, n) => { let o = ''; for (const [x, y] of scat(r, n, 16, 18)) o += ring(x, y, r.range(8, 12), '#fff', .7) + ring(x, y, r.range(3, 5), '#fff', .8); return o; };
const LK = {
  'lake-shallow': { kind: 'shallow', v: { a: (r) => sky(r, 2) + glints(r, 3), b: (r) => rings(r, 2), c: (r) => reflSet(r, 4, ['#4a9a50', '#3a8048', '#2f6e3a']), d: (r) => sky(r, 4) + reflSet(r, 1, ['#fff']) } },
  'lake-deep': { kind: 'deep', v: { a: (r) => reflSet(r, 4, ['#2f6e3a', '#27583a', '#33456f'], 5), b: (r) => sky(r, 3) + glints(r, 3), c: (r) => reflSet(r, 3, ['#e0583f', '#c8352b'], 4) + sky(r, 1), d: (r) => rings(r, 2) + reflSet(r, 2, ['#e8e0c8', '#fff'], 6) } },
  'lake-mirror': { kind: 'shallow', v: { a: (r) => sky(r, 5), b: (r) => sky(r, 3) + reflSet(r, 2, ['#9be08f', '#5fae5c']) } },
};
for (const [name, { kind, v }] of Object.entries(LK)) for (const [vv, fn] of Object.entries(v)) { const sd = hash(name + vv) % 90000 + 10; const t = mk('ground', name, vv); t.add(waterFill(kind, name === 'lake-mirror' ? 0 : sd), fn(rng(sd))); out(t, 'ground', name, vv, ['seamless', 'ground', 'water', 'lake', 'reflection', kind]); }
// baked water-surface detail (still seamless)
const dw = (r, n, col, ci = 0) => scat(r, n, 11, 12).map(([x, y]) => lilyPad(x, y, r.range(5, 7.4), r.range(0, 360), PADC[(ci + Math.floor(r() * 3)) % 4])).join('');
const GD = {
  'lake-lilies': { a: (r) => dw(r, 5, 0), b: (r) => dw(r, 7, 1) + ring(24, 24, 9, '#fff', .5), c: (r) => dw(r, 4, 2) + scat(r, 2, 14, 18).map(([x, y]) => lotusBloom(x, y + 4, .7, 'pink')).join('') },
  'lake-lotus': { a: (r) => scat(r, 3, 14, 18).map(([x, y]) => lilyPad(x, y + 3, 9, r.range(0, 360), PADC[0]) + lotusBloom(x, y + 3, .8, 'pink', 1)).join(''), b: (r) => scat(r, 3, 14, 18).map(([x, y], i) => lilyPad(x, y + 3, 9, r.range(0, 360), PADC[2]) + lotusBloom(x, y + 3, .8, i % 2 ? 'white' : 'pink', i % 2 ? .4 : 1)).join('') },
  'lake-duckweed': { a: (r) => { let o = ''; for (let i = 0; i < 5; i++) { const x = r.range(16, 48), y = r.range(16, 48); o += ell(x, y, r.range(8, 14), r.range(4, 7), '#8fd078', .5, r.range(0, 180)); for (let k = 0; k < 14; k++) o += circ(x + r.range(-9, 9), y + r.range(-5, 5), r.range(.6, 1.1), '#5fae5c', .85); } return o; }, b: (r) => { let o = ''; for (let k = 0; k < 46; k++) o += circ(r.range(8, 56), r.range(8, 56), r.range(.6, 1.2), r.pick(['#8fd078', '#5fae5c', '#a8dc88']), .85); return o; } },
  'lake-petals': { a: (r) => scat(r, 10, 10, 8).map(([x, y]) => ell(x, y, 2.2, 1.2, r.pick(['#fbdde6', '#f6c6d4']), .95, r.range(0, 180), ink('#e0a0b6', .3, .5)) + ring(x, y, 3.4, '#fff', .35)).join(''), b: (r) => scat(r, 7, 11, 10).map(([x, y]) => ell(x, y, 2.4, 1.3, '#fbdde6', 1, r.range(0, 180), ink('#e0a0b6', .3, .5))).join('') + rings(r, 1) },
  'lake-fish': { a: (r) => koi(28, 28, -10, .9, 'ogon', .55) + koi(44, 42, 16, .75, 'shiro', .5), b: (r) => koi(34, 30, 4, 1, 'kohaku', .6) + koi(20, 44, -20, .7, 'gold', .5) },
  'lake-shoal': { a: (r) => scat(r, 8, 9, 9).map(([x, y]) => ell(x, y, r.range(3, 6), r.range(1.5, 2.6), '#e8dcae', .5)).join('') + glints(r, 2), b: (r) => '<g opacity=".55">' + scat(r, 6, 11, 11).map(([x, y]) => pebbleSmall(x, y, r.range(.7, 1.1), r.int(0, 3))).join('') + '</g>' },
};
for (const [name, vars] of Object.entries(GD)) for (const [vv, fn] of Object.entries(vars)) { const sd = hash(name + vv) % 90000 + 10, shoal = name === 'lake-shoal'; const t = mk('ground-detail', name, vv); t.add(waterFill('shallow', sd), shoal ? interior(FAM.shallow, sd + 5, { n: 3, tufts: 0, cols: ['#d8dcae', '#c8d8b8'] }) : '', fn(rng(sd))); out(t, 'ground-detail', name, vv, ['seamless', 'ground', 'water', 'lake', 'decal-baked']); }
// ======================= ground: beach and shore grass =======================
const pebs = (r, n, pad = 10, gap = 10) => scat(r, n, pad, gap).map(([x, y]) => pebbleSmall(x, y, r.range(.8, 1.4), r.int(0, 3))).join('');
const shellS = (x, y, s = 1, rot = 0) => ell(x + .6, y + 1.4, 3 * s, 1 * s, '#3b3a24', .15) + `<g transform="rotate(${rot} ${f(x)} ${f(y)})">` + path(`M${f(x - 3 * s)} ${f(y + 2 * s)}Q${f(x - 3.4 * s)} ${f(y - 2.6 * s)} ${f(x)} ${f(y - 3 * s)}Q${f(x + 3.4 * s)} ${f(y - 2.6 * s)} ${f(x + 3 * s)} ${f(y + 2 * s)}Z`, '#f6e2d2', 1, ink('#b99c86', .6, .7)) + line(`M${f(x)} ${f(y + 2 * s)}V${f(y - 2.6 * s)}M${f(x - 1.6 * s)} ${f(y + 1.6 * s)}L${f(x - 1.8 * s)} ${f(y - 1.8 * s)}M${f(x + 1.6 * s)} ${f(y + 1.6 * s)}L${f(x + 1.8 * s)} ${f(y - 1.8 * s)}`, '#d9b8a0', .5) + '</g>';
const GB = {
  'beach-pebble': { fam: SA, v: { a: (r) => interior(SA, 4011, { n: 3, tufts: 0 }) + pebs(r, 10, 9, 8), b: (r) => interior(SA, 4012, { n: 3, tufts: 0 }) + pebs(r, 16, 8, 6), c: (r) => interior(SA, 4013, { n: 4, tufts: 0, cols: ['#d8d0a8', '#e4d29c'] }) + pebs(r, 6, 12, 14) } },
  'beach-wet': { fam: SA, v: { a: (r) => interior(SA, 4021, { n: 4, tufts: 0, cols: ['#c8b88a', '#d8c898', '#bfae80'] }) + scat(r, 3, 14, 16).map(([x, y]) => ripple(x, y, 12, '#fff', .45, 1)).join(''), b: (r) => interior(SA, 4022, { n: 4, tufts: 0, cols: ['#c4b486', '#d4c490'] }) + pebs(r, 4, 14, 16) } },
  'grass-lakeside': { fam: GR, v: { a: (r) => interior(GR, 4031, { n: 3, tufts: 3 }) + scat(r, 4, 12, 12).map(([x, y]) => bloom('clover', x, y, .6)).join(''), b: (r) => interior(GR, 4032, { n: 3, tufts: 2 }) + scat(r, 3, 12, 14).map(([x, y]) => bloom('daisy', x, y, .7)).join('') + pebs(r, 3, 12, 14), c: (r) => interior(GR, 4033, { n: 4, cols: ['#bcd98d', '#a8cf86'], tufts: 4 }) + scat(r, 2, 14, 18).map(([x, y]) => bloom('cornflower', x, y, .7)).join('') } },
};
for (const [name, { fam, v }] of Object.entries(GB)) for (const [vv, fn] of Object.entries(v)) { const t = mk('ground', name, vv); t.add(skeleton(fam), fn(rng(hash(name + vv)))); out(t, 'ground', name, vv, ['seamless', 'ground', fam === SA ? 'sand' : 'grass', 'lake']); }
for (const [vv, fn] of Object.entries({ a: (r) => scat(r, 3, 12, 14).map(([x, y]) => shellS(x, y, 1.1, r.range(-40, 40))).join('') + pebs(r, 4, 12, 12), b: (r) => { let o = ''; for (const [x, y] of scat(r, 2, 14, 24)) { const a = r.range(-20, 20); o += `<g transform="rotate(${a} ${f(x)} ${f(y)})">` + ell(x + 1, y + 3, 12, 2, '#3b3a24', .14) + rect(x - 11, y - 2.4, 22, 4.8, '#c8b494', 2.4, 1, ink('#8a7660', .6, .8)) + line(`M${f(x - 8)} ${f(y - 1)}h14`, '#e8dcc4', .8, .7) + '</g>'; } return o + shellS(14, 50, .9) + pebs(r, 3, 12, 14); } })) { const t = mk('ground-detail', 'beach-drift', vv); t.add(skeleton(SA), interior(SA, 4040 + vv.charCodeAt(0), { n: 3, tufts: 0 }), fn(rng(hash('drift' + vv)))); out(t, 'ground-detail', 'beach-drift', vv, ['seamless', 'ground', 'sand', 'lake', 'decal-baked']); }

// ======================= decals =======================
const decal = (name, v, fn) => { const t = mk('decals', name, v); fn(t, rng(hash(name + v))); out(t, 'decals', name, v, ['overlay', 'decal', 'transparent']); };
for (const v of ['a', 'b', 'c', 'd']) decal('ripple-rings', v, (t, r) => { for (const [x, y] of scat(r, v === 'a' ? 1 : 2, 18, 22)) t.add(ring(x, y, 13, '#fff', .8), ring(x, y, 8, '#fff', .85), ring(x, y, 3.4, '#fff', .9)); });
for (const v of ['a', 'b', 'c']) decal('fish-shadow', v, (t, r) => { for (const [x, y] of scat(r, 2 + (v === 'c' ? 1 : 0), 16, 18)) t.add(`<g opacity=".28" transform="translate(${f(x)} ${f(y)}) rotate(${f(r.range(-30, 30))})">` + path('M10 0Q4 -4 -4 -3Q-8 0 -4 3Q4 4 10 0ZM-4 0L-12 -4L-10 0L-12 4Z', '#1d4a63') + '</g>'); });
for (const v of ['a', 'b', 'c']) decal('petals-float', v, (t, r) => { for (const [x, y] of scat(r, 8, 10, 8)) t.add(ell(x, y, 2.4, 1.3, r.pick(['#fbdde6', '#f6c6d4', '#fff']), 1, r.range(0, 180), ink('#e0a0b6', .3, .5)), ring(x, y, 3.6, '#fff', .35)); });
for (const v of ['a', 'b', 'c', 'd']) decal('lily-single', v, (t, r) => { t.add(lilyPad(32 + r.range(-8, 8), 32 + r.range(-8, 8), r.range(7, 9.4), r.range(0, 360), PADC[v.charCodeAt(0) % 4])); if (v === 'b') t.add(lotusBloom(34, 36, .7, 'pink')); if (v === 'd') t.add(lilyPad(46, 44, 5, 80, PADC[2]), circ(30, 30, 1.4, '#fff')); });
for (const v of ['a', 'b']) decal('duckweed-film', v, (t, r) => { for (let i = 0; i < 3; i++) { const x = r.range(16, 48), y = r.range(18, 46); t.add(ell(x, y, r.range(8, 13), r.range(4, 7), '#8fd078', .5, r.range(0, 180))); for (let k = 0; k < 10; k++) t.add(circ(x + r.range(-8, 8), y + r.range(-4, 4), r.range(.6, 1), '#5fae5c', .85)); } });
for (const v of ['a', 'b']) decal('foam-lap', v, (t, r) => { for (let i = 0; i < 2; i++) { const y = 18 + i * 22 + (v === 'b' ? 4 : 0); let d = `M6 ${y}`; for (let x = 6; x < 60; x += 9) d += `q4.5 -4 9 0`; t.add(line(d, '#fff', 2.2, .55), line(d, '#d8f0ee', 4, .3)); } });
for (const v of ['a', 'b']) decal('driftwood', v, (t, r) => { const a = v === 'a' ? 6 : -8; t.add(ell(32, 40, 24, 3, '#3b3a24', .14), `<g transform="rotate(${a} 32 36)">`, path('M6 36Q16 30 30 33Q44 30 58 35Q50 41 30 40Q14 42 6 36Z', t.lg(['#d8c8a8', '#a89878', '#7a6a50'], 90), 1, ink('#5a4a38', .9, .8)), line('M12 36q8 -2 14 0M34 36q8 -1 16 1', '#7a6a50', .8, .6), line('M38 32l6 -9M26 33l-3 -7', '#a89878', 2, 1), '</g>'); });
for (const v of ['a', 'b']) decal('shells', v, (t, r) => { for (const [x, y] of scat(r, 3, 14, 14)) t.add(shellS(x, y, 1.2, r.range(-40, 40))); });
for (const v of ['a', 'b', 'c']) decal('reflection-tree', v, (t, r) => { const x = 32 + (v === 'b' ? -8 : v === 'c' ? 6 : 0); t.add(refl(x, 6, 4, 50, '#2f6e3a', .26, 0), ell(x, 28, 14 - (v === 'c' ? 3 : 0), 18, '#3a8048', .22), ell(x - 3, 22, 9, 11, '#5fae5c', .2)); for (let i = 0; i < 4; i++) t.add(line(`M${f(x - 14)} ${f(18 + i * 10)}h${f(28)}`, '#a8dcb8', 1.3, .4)); });
for (const v of ['a', 'b']) decal('boat-wake', v, (t) => { const s = v === 'a' ? 1 : -1; t.add(path(`M${32 - 26 * s} 32Q${32 - 6 * s} 26 ${32 + 18 * s} 20`, 'none', 1, { fill: 'none', stroke: '#fff', 'stroke-width': 1.6, 'stroke-opacity': .7 }), path(`M${32 - 26 * s} 32Q${32 - 6 * s} 38 ${32 + 18 * s} 44`, 'none', 1, { fill: 'none', stroke: '#fff', 'stroke-width': 1.6, 'stroke-opacity': .7 }), path(`M${32 - 26 * s} 32Q${32 - 12 * s} 32 ${32 + 6 * s} 32`, 'none', 1, { fill: 'none', stroke: '#fff', 'stroke-width': 1, 'stroke-opacity': .4 })); });

// ======================= edges (47 blob) =======================
const MG = { n: WMG, e: WMG, s: WMG, w: WMG };
blobSet(SUB, 'lake-shore-pebble', { mg: MG, R: WR, tags: ['water', 'lake', 'shore', 'beach', 'pebble'], build: (t, G, m) => pebbleWater(t, G, m, { kind: 'lake' }) });
// reflective deep water inside the shallows
blobSet(SUB, 'lake-deep-mirror', {
  mg: { n: 11, e: 11, s: 11, w: 11 }, R: 24, tags: ['water', 'lake', 'deep', 'reflection'],
  build(t, G) {
    const clip = t.clip(G.d), id = clip.slice(5, -1), r = rng(hash('dm'));
    t.add(waterFill('shallow'), path(G.d, 'none', 1, { stroke: '#6fb0c8', 'stroke-width': 14, 'stroke-opacity': .35, 'stroke-linejoin': 'round' }), `<g clip-path="url(#${id})">`, waterFill('deep'), path(G.d, 'none', 1, { stroke: '#8fc4dc', 'stroke-width': 9, 'stroke-opacity': .4, 'stroke-linejoin': 'round' }));
    for (let i = 0; i < 8; i++) { const x = r.range(14, 50), y = r.range(12, 40), w = r.range(2.4, 5); if (inShape(G, x, y + 12, 14)) t.add(refl(x, y, w, r.range(12, 22), r.pick(['#fff', '#cfe6ef', '#2f6e8a']), r.range(.12, .26), r.range(0, 6))); }
    t.add('</g>', path(G.d, 'none', 1, { stroke: '#3f78a0', 'stroke-width': 1.2, 'stroke-opacity': .45, 'stroke-linejoin': 'round' }));
  },
});
// pebble beach patch on grass (sand + shingle)
blobSet(SUB, 'lake-beach', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['beach', 'pebble', 'sand', 'lake'],
  build(t, G) {
    const clip = t.clip(G.d), id = clip.slice(5, -1), r = rng(hash('lbeach'));
    t.add(skeleton(GR), path(G.d, 'none', 1, { stroke: '#c9b27a', 'stroke-width': 9, 'stroke-opacity': .2, 'stroke-linejoin': 'round' }), `<g clip-path="url(#${id})">`, skeleton(SA), path(G.d, 'none', 1, { stroke: '#f3e8c4', 'stroke-width': 8, 'stroke-opacity': .5, 'stroke-linejoin': 'round' }), '</g>', path(G.d, 'none', 1, { stroke: '#c9b27a', 'stroke-width': 1.2, 'stroke-opacity': .5, 'stroke-linejoin': 'round' }));
    for (let i = 0; i < 16; i++) { const x = r.range(8, 56), y = r.range(8, 56), s = r.range(.7, 1.2), c = r.int(0, 3); if (inShape(G, x, y, 5)) t.add(pebbleSmall(x, y, s, c)); }
  },
});
// islets: land (member) surrounded by shallows
blobSet(SUB, 'lake-island', {
  mg: { n: 12, e: 12, s: 12, w: 12 }, R: 24, tags: ['island', 'land', 'lake', 'obstacle'],
  build(t, G) {
    const clip = t.clip(G.d), id = clip.slice(5, -1), r = rng(hash('lisl'));
    t.add(waterFill('shallow'), path(G.d, 'none', 1, { stroke: '#e9f6f0', 'stroke-width': 17, 'stroke-opacity': .35, 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#f6f3e6', 'stroke-width': 9, 'stroke-opacity': .5, 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#e4d29c', 'stroke-width': 8, 'stroke-opacity': .85, 'stroke-linejoin': 'round' }));
    t.add(`<g clip-path="url(#${id})">`, skeleton(GR), path(G.d, 'none', 1, { stroke: '#dfe8ae', 'stroke-width': 7, 'stroke-opacity': .5, 'stroke-linejoin': 'round' }), '</g>', path(G.d, 'none', 1, { stroke: '#7fa862', 'stroke-width': 1.2, 'stroke-opacity': .5, 'stroke-linejoin': 'round' }));
    for (let i = 0; i < 12; i++) { const x = r.range(8, 56), y = r.range(8, 56), k = r(); if (inShape(G, x, y, 6)) t.add(k < .5 ? tuft(x, y + 3, '#5f9a48', .85, .9) : k < .75 ? bloom(r.pick(['daisy', 'clover', 'buttercup']), x, y, .7) : pebbleSmall(x, y, .9, r.int(0, 3))); }
  },
});
// lily bed: pads floating on shallow water, clustered inside the set
blobSet(SUB, 'lily-bed', {
  mg: { n: 6, e: 6, s: 6, w: 6 }, R: 20, tags: ['water', 'lake', 'lily', 'overlay-blob'],
  build(t, G) {
    t.add(waterFill('shallow'));
    for (const p of PADS) if (inShape(G, p.x, p.y, p.r) && p.u < .92) t.add(lilyPad(p.x, p.y, p.r, p.a, PADC[p.c]), p.fl < .16 ? lotusBloom(p.x, p.y + 2, .55, p.fl < .08 ? 'pink' : 'white') : '');
  },
});

// ======================= connect-4 pieces: jetties, net fence =======================
function connectSet(name, draw, tags = []) { for (let m = 0; m < 16; m++) { const t = mk('fences', name, String(m).padStart(2, '0')); draw(t, m); out(t, 'fences', name, String(m).padStart(2, '0'), ['autotile', 'connect4', 'mask:' + m, ...tags]); } }
const jetty = (old) => (t, m) => {
  const C = 32, W = 10, pl = old ? ['#c9b88c', '#9a8660', '#6b5a3a'] : ['#e8cf9a', '#c49a5a', '#8a6038'], ln = ink('#4a3220', .8, .75), r = rng(hash('jt' + old));
  const dirs = [[m & 1, 0, -1], [m & 2, 1, 0], [m & 4, 0, 1], [m & 8, -1, 0]];
  // shadow on the water
  t.add(rect(C - W - 2, C - W + 3, 2 * W + 4, 2 * W + 6, '#1d4a63', 6, .22));
  for (const [on, dx, dy] of dirs) if (on) t.add(dx ? rect(dx > 0 ? C : 0, C - W + 3, 32, 2 * W + 6, '#1d4a63', 0, .22) : rect(C - W - 2, dy > 0 ? C : 0, 2 * W + 4, 32, '#1d4a63', 0, .22));
  const deck = (x, y, w, h, along) => {   // planks across the walking direction
    t.add(rect(x, y, w, h, t.lg(pl, along === 'x' ? 90 : 0), 0, 1, ink('#4a3220', .5, .5)));
    if (along === 'x') for (let p = Math.ceil(x / 6) * 6; p < x + w; p += 6) { if (old && hash('g' + p + m) % 7 === 0) t.add(rect(p - 1, y, 5, h, '#2a5a78', 0, .55)); else t.add(rect(p - .5, y, 1, h, '#4a3220', 0, .55), rect(p + .8, y + 1, 1, h - 2, '#fff', 0, .18)); }
    else for (let p = Math.ceil(y / 6) * 6; p < y + h; p += 6) { if (old && hash('g' + p + m) % 7 === 0) t.add(rect(x, p - 1, w, 5, '#2a5a78', 0, .55)); else t.add(rect(x, p - .5, w, 1, '#4a3220', 0, .55), rect(x + 1, p + .8, w - 2, 1, '#fff', 0, .18)); }
  };
  const post = (x, y) => t.add(ell(x, y + 14, 5, 2, '#1d4a63', .3), ell(x, y + 14, 6.4, 2.4, '#fff', .35), rect(x - 2.6, y - 2, 5.2, 16, t.lg(['#a87c46', '#6b4a2c'], 0), 1.4, 1, ln), ell(x, y - 2, 2.6, 1.3, '#e2c892', 1, 0, ink('#6b4a2c', .5, .8)));
  // hub then arms (arms drawn first so the hub overlaps their ends)
  for (const [on, dx, dy] of dirs) if (on) { if (dx) deck(dx > 0 ? C : 0, C - W, 32, 2 * W, 'x'); else deck(C - W, dy > 0 ? C : 0, 2 * W, 32, 'y'); }
  deck(C - W, C - W, 2 * W, 2 * W, (m & 1 || m & 4) && !(m & 10) ? 'y' : 'x');
  // rim beams along open sides + corner posts
  t.add(rect(C - W - 1.4, C + W - 1, 2 * W + 2.8, 3.4, '#6b4a2c', 0, m & 4 ? 0 : 1, ln));
  const posts = [[C - W, C - W], [C + W, C - W], [C - W, C + W], [C + W, C + W]]; for (const [px, py] of posts.sort((a, b) => a[1] - b[1])) t.add(post(px, py));
  if (!old) t.add(circ(C - W, C - W - 1, 1.2, '#fff', .6));
  if (old) t.add(path(`M${C - W} ${C + W - 2}q4-6 8-2q-2 4-8 2Z`, '#7fae5e', .9), tuft(C + 5, C - W, '#4d7a40', .7, .5));
};
connectSet('jetty-wood', jetty(false), ['jetty', 'walkable', 'water']);
connectSet('jetty-old', jetty(true), ['jetty', 'walkable', 'water', 'weathered']);
const armX = (m) => [m & C4.W ? 0 : 32, m & C4.E ? 64 : 32];
connectSet('fence-net', (t, m) => {   // fishing net strung between stakes
  const [x0, x1] = armX(m), by = 50, cx = 32, vert = (x, y0, y1, w = 3.6) => rect(x - w / 2, y0, w, y1 - y0, t.lg(['#b08a58', '#6b4a2c'], 0), 1, 1, ink(P.inkW, .7, .75));
  t.add(ell(cx + 2, by + 3, 7, 2.4, '#3b3a24', .22)); if (x1 > x0) t.add(rect(x0 + 1, by + 1.5, x1 - x0, 2.6, '#3b3a24', 1.3, .17));
  if (m & C4.N) t.add(vert(cx, 0, by - 2, 4));
  if (x1 > x0) {
    for (const sx of [16, 48]) if (sx > x0 && sx < x1) t.add(vert(sx, 26, by + 1, 3));
    const nx = [x0, x1], g = []; for (let y = 28; y <= 46; y += 4) g.push(`M${x0} ${y}H${x1}`); for (let x = Math.ceil(x0 / 4) * 4; x <= x1; x += 4) g.push(`M${x} 28V46`);
    t.add(rect(x0, 28, x1 - x0, 18, '#e8dcb0', 0, .16), line(g.join(''), '#6b5a38', .9, .85), line(`M${x0} 28H${x1}`, '#a88a4a', 2, 1), ...[8, 24, 40, 56].filter(x => x > x0 + 2 && x < x1 - 2).map(x => ell(x, 46, 2.2, 3, '#e8604a', 1, 0, ink('#4a1410', .5, .7))));
  }
  t.add(vert(cx, 20, by + 1, 5), circ(cx, 20, 2.6, '#8a6a44', 1, ink(P.inkW, .6, .8)));
  if (m & C4.S) t.add(vert(cx, by - 1, 64, 4), rect(cx - 2, 60, 4, 4, '#3b3a24', 0, .12));
  t.add(tuft(cx + 11, by + 2, '#4d7a40', .8, .6));
}, ['fishing', 'obstacle']);

await import('./gen-lake-objects.mjs');
