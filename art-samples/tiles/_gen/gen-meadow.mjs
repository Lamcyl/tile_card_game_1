// Sunny Meadows (greenvale/sunny-meadows): ground, ground-detail, decals, edges, fences. Objects live in gen-meadow-objects.mjs.
import { T, P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, FAM, skeleton, inShape, blobSet, maker, bloom, scat, butterfly, bee, sparkle, C4, SUBS, sh } from './sub.mjs';
import { interior } from './ground.mjs';
import { wrapped } from './lib.mjs';

const SUB = SUBS.meadow, { mk, out } = maker(SUB);
const G = FAM.grass;

// =========================== ground (seamless, grass skeleton + safe-zone interior) ===========================
const ground = {
  'meadow-hill': {   // gentle rolling hills: pale crown upper-left, soft darker lee lower-right, all inside the safe zone
    a: () => ell(28, 28, 14, 8, '#e8f0b8', .5, -18) + ell(37, 41, 13, 6, '#8fb872', .22, -12) + line('M15 38q14-13 31-2', P.rimG, 1.1, .3) + tuft(44, 22, P.tuftG, .45) + tuft(18, 48, P.tuftG, .45),
    b: () => ell(36, 30, 13, 7, '#e4eeb4', .5, 14) + ell(28, 42, 14, 6, '#8fb872', .2, 8) + line('M16 34q16-12 30 2', P.rimG, 1.1, .3) + tuft(12, 20, P.tuftG, .4),
    c: () => ell(30, 34, 15, 9, '#eaf2bc', .45, -8) + ell(36, 44, 11, 5, '#86b068', .22, -6) + ell(20, 22, 7, 3.4, '#f1f6cc', .45, -20) + line('M14 40q18-16 34-4', P.rimG, 1.1, .28),
    d: () => ell(26, 26, 10, 6, '#e8f0b8', .5, -25) + ell(40, 40, 12, 7, '#e4eeb4', .45, 20) + ell(32, 33, 14, 3.2, '#8fb872', .2, 24) + tuft(48, 18, P.tuftG, .4) + tuft(14, 46, P.tuftG, .4),
  },
  'meadow-lush': {
    a: () => interior(G, 811, { n: 4, cols: ['#a4c878', '#9cc470'], tufts: 5 }),
    b: () => interior(G, 812, { n: 5, cols: ['#b3d283', '#98c46c', '#a8cf86'], tufts: 6 }) + tuft(32, 30, '#4a8a46', .5, 1.2),
  },
  'meadow-golden': {  // late-summer ochre pasture
    a: () => interior(G, 821, { n: 4, cols: ['#e6dc98', '#d9d08a'], tufts: 0 }) + [[16, 22], [44, 18], [30, 44], [50, 42], [12, 48]].map(([x, y]) => tuft(x, y, '#b8a46a', .8, 1)).join(''),
    b: () => interior(G, 822, { n: 5, cols: ['#eadf9e', '#dccf84', '#cfd890'], tufts: 0 }) + [[22, 18], [40, 28], [18, 42], [46, 48]].map(([x, y]) => tuft(x, y, '#c4ae6a', .8, 1.1)).join(''),
  },
  'meadow-dew': {     // morning dew: pale blue-white glints
    a: () => interior(G, 831, { n: 4, cols: ['#dfeec0', '#cfe6c4'], tufts: 2 }) + [[14, 18], [30, 24], [48, 20], [22, 42], [40, 46], [52, 36]].map(([x, y], i) => circ(x, y, 1.1 + (i % 2) * .4, '#f4fbff', .85) + circ(x - .3, y - .3, .4, '#fff')).join(''),
    b: () => interior(G, 832, { n: 4, cols: ['#d6e8c0', '#e4eeb4'], tufts: 3 }) + [[18, 24], [36, 16], [50, 30], [14, 44], [34, 50]].map(([x, y], i) => circ(x, y, 1.2, '#f4fbff', .85) + sparkle(x + 4, y - 3, .35, '#ffffff')).join(''),
  },
};
for (const [name, vars] of Object.entries(ground)) for (const [v, fn] of Object.entries(vars)) {
  const t = mk('ground', name, v); t.add(skeleton(G), fn());
  out(t, 'ground', name, v, ['seamless', 'ground', 'grass']);
}

// ---- farm field rows: periodic furrows (period 16 in y, sine period 32 in x) so the tile is seamless with itself ----
const wave = (y, amp = 1.1) => { let d = ''; for (let x = -4; x <= 68; x += 4) d += (x === -4 ? 'M' : 'L') + f(x) + ' ' + f(y + Math.sin(x / 32 * Math.PI * 2) * amp) + ' '; return d; };
const cropRow = {
  soil: () => '',
  sprout: (x, y, s) => ell(x + 1, y + 1.5, 3, 1, '#3b3a24', .14) + path(`M${f(x)} ${f(y)}Q${f(x - 3.5)} ${f(y - 2)} ${f(x - 4)} ${f(y - 4.5)}Q${f(x - 1)} ${f(y - 4)} ${f(x)} ${f(y)}Z`, '#7fc060', 1, ink(P.inkG, .4, .6)) + path(`M${f(x)} ${f(y)}Q${f(x + 3.5)} ${f(y - 2.4)} ${f(x + 4)} ${f(y - 5.4)}Q${f(x + 1)} ${f(y - 4.4)} ${f(x)} ${f(y)}Z`, '#9ad07a', 1, ink(P.inkG, .4, .6)),
  cabbage: (x, y, s) => ell(x + 1, y + 2, 5.4, 1.7, '#3b3a24', .18) + circ(x, y - 1.5, 4.8, '#8fcf86', 1, ink(P.inkG, .7, .75)) + ell(x - 3.4, y - 1.4, 2.6, 3.8, '#5fae5c', .9, 20) + ell(x + 3.4, y - 1.2, 2.6, 3.8, '#4a9a50', .9, -20) + circ(x - .6, y - 2.6, 2.4, '#d6f0b0') + ell(x - 1.4, y - 3.6, 1.2, .8, '#fff', .6),
  wheat: (x, y, s) => { let o = ell(x + 1, y + 1.6, 4, 1.2, '#3b3a24', .14); for (const [dx, h] of [[-2.6, 7], [0, 9], [2.6, 7.4]]) o += line(`M${f(x + dx)} ${f(y)}q${f(dx * .2)} -${f(h * .5)} ${f(dx * .4)} -${f(h)}`, '#b8a448', 1, .95) + ell(x + dx * .5, y - h - 1.2, 1.1, 2.6, '#f0cc5a', 1, dx * 3, ink('#a88a28', .4, .7)); return o; },
  lavender: (x, y, s) => ell(x + 1, y + 1.6, 4.6, 1.3, '#3b3a24', .16) + ell(x, y - 1, 4.4, 2.6, '#7fae6a', 1) + [[-2.4, 8], [0, 10], [2.4, 8]].map(([dx, h], i) => line(`M${f(x + dx * .3)} ${f(y - 1)}q${f(dx * .3)} -${f(h * .5)} ${f(dx * .5)} -${f(h * .85)}`, '#6f9a58', .8, .8) + [0, 1, 2, 3].map(k => circ(x + dx * .5 + (k % 2 ? .6 : -.6), y - 3 - h * .26 - k * 1.5, 1.05, k % 2 ? '#a58ad8' : '#8a6ac8')).join('')).join(''),
  rapeseed: (x, y, s) => { let o = ell(x + 1, y + 1.6, 4.4, 1.3, '#3b3a24', .15) + ell(x, y - 1, 4, 2.4, '#7fb060', 1); for (const [dx, dy] of [[-3, -5], [0, -7], [3, -5], [-1, -9], [2, -9]]) o += circ(x + dx, y + dy, 1.9, '#f6d84a', 1, ink('#a88a1c', .3, .5)) + circ(x + dx - .5, y + dy - .5, .6, '#fff6b0', .8); return o; },
  turnip: (x, y, s) => ell(x + 1, y + 2, 4, 1.4, '#3b3a24', .16) + circ(x, y + .5, 2.8, '#f2e6f0', 1, ink('#9a7a96', .5, .7)) + ell(x, y + 2, 2.8, 1.2, '#c88aa8', .7) + ell(x - 2.2, y - 3.8, 1.2, 3.4, '#5fae5c', 1, -22) + ell(x + .2, y - 4.6, 1.2, 3.8, '#7fc060', 1, 4) + ell(x + 2.4, y - 3.6, 1.2, 3.2, '#4a9a50', 1, 24),
};
for (const [kind, crop] of Object.entries(cropRow)) for (const v of ['a', 'b']) {
  const t = mk('ground', 'field-rows-' + kind, v), fam = FAM.dirt;
  t.add(skeleton(fam));
  const tone = v === 'a' ? ['#e4d3a8', '#a98a58', '#c9ae7a'] : ['#d8c28e', '#9a7a4c', '#b89c66'];
  for (let k = 0; k < 4; k++) { const y = 8 + 16 * k; t.add(`<path d="${wave(y)}" fill="none" stroke="${tone[0]}" stroke-width="9" opacity=".7"/>`, `<path d="${wave(y - 2.5)}" fill="none" stroke="#f1e3bc" stroke-width="2.4" opacity=".6"/>`); }
  for (let k = 0; k <= 4; k++) { const y = 16 * k; t.add(`<path d="${wave(y, 1.1)}" fill="none" stroke="${tone[1]}" stroke-width="3.4" opacity=".42"/>`, `<path d="${wave(y + 1.6, 1.1)}" fill="none" stroke="#6b4a2c" stroke-width="1" opacity=".22"/>`); }
  if (kind !== 'soil') for (let k = 0; k < 5; k++) for (let i = 0; i < 4; i++) { const x = 8 + 16 * i + (v === 'b' && k % 2 ? 0 : 0), y = 8 + 16 * k + 1; t.add(crop(x, y, v === 'b' ? 1.1 : 1)); }  // k=4 is the wrapped copy of row 0 (tips of tall crops cross the bottom edge)
  else { const r = rng(hash('soil' + v)); for (let i = 0; i < 6; i++) t.add(circ(r.range(8, 56), 8 + 16 * r.int(0, 3), 1, '#8a6c40', .5)); }
  out(t, 'ground', 'field-rows-' + kind, v, ['seamless', 'ground', 'field', 'dirt', 'farm']);
}

// =========================== ground-detail: wildflower carpets (grass + many blooms, safe zone only) ===========================
const mood = {
  blush: [['cosmos', '#f2a6c0'], ['cosmos', '#f8c6d6'], ['rose', '#f6a0b8'], ['daisy']],
  gold: [['buttercup'], ['buttercup', '#f8dc62'], ['sunflower', 0.55], ['daisy']],
  lavender: [['lavender'], ['lavender', '#8a6ac8'], ['bluebell'], ['daisy']],
  poppy: [['poppy'], ['poppy', '#f0604a'], ['cornflower'], ['daisy']],
  cornflower: [['cornflower'], ['cornflower', '#8aa6ee'], ['daisy'], ['clover']],
  white: [['daisy'], ['clover'], ['daisy'], ['clover']],
  rainbow: [['cosmos', '#f2a6c0'], ['buttercup'], ['cornflower'], ['poppy'], ['lavender'], ['daisy']],
  sunset: [['cosmos', '#f2a05a'], ['cosmos', '#f6784a'], ['buttercup', '#f3b24a'], ['rose', '#f4a070']],
  tulip: [['tulip', '#e0583f'], ['tulip', '#f3c24f'], ['tulip', '#f0a0c0'], ['daisy']],
};
let si = 0;
for (const [m, kinds] of Object.entries(mood)) for (const v of ['a', 'b']) {
  const t = mk('ground-detail', 'meadow-' + m, v), r = rng(hash('carpet' + m + v));
  t.add(skeleton(G), interior(G, 900 + si++, { n: 3, tufts: 2, cols: ['#d4e6a0', '#bcd98d'] }));
  const pts = scat(r, 15, 8, 8).sort((a, b) => a[1] - b[1]);
  for (const [x, y] of pts) { const k = r.pick(kinds); t.add(bloom(k[0], x, y, k[0] === 'lavender' ? 1 : .95 + r() * .25, typeof k[1] === 'string' ? k[1] : null)); }
  out(t, 'ground-detail', 'meadow-' + m, v, ['seamless', 'ground', 'grass', 'decal-baked', 'wildflowers']);
}
{ // clover carpet with white blooms, and honey-clover with bees
  for (const v of ['a', 'b']) {
    const t = mk('ground-detail', 'meadow-clover-lush', v), r = rng(hash('cl' + v));
    t.add(skeleton(G), interior(G, 950 + (v === 'a' ? 0 : 1), { n: 3, tufts: 0, cols: ['#a4c878', '#b3d283'] }));
    for (const [x, y] of scat(r, 13, 8, 9).sort((a, b) => a[1] - b[1])) {
      const c = (dx, dy) => circ(x + dx, y + dy, 2.2, '#5fae5c', 1, ink(P.inkG, .5, .55)); t.add(c(-2, 0) + c(2, 0) + c(0, -2.2) + c(0, 1.6) + circ(x - .8, y - 1.4, .7, '#9be08f'));
      if (r() > .55) t.add(bloom('clover', x + 4, y - 4, .8));
    }
    if (v === 'b') t.add(bee(44, 20, 30));
    out(t, 'ground-detail', 'meadow-clover-lush', v, ['seamless', 'ground', 'grass', 'decal-baked']);
  }
  for (const v of ['a', 'b']) {   // ripe hay grass with seed heads (late summer)
    const t = mk('ground-detail', 'meadow-hay', v), r = rng(hash('hay' + v));
    t.add(skeleton(G), interior(G, 960 + (v === 'a' ? 0 : 1), { n: 4, tufts: 0, cols: ['#e6dc98', '#dccf84'] }));
    for (const [x, y] of scat(r, 9, 9, 10).map(([x, y]) => [x, Math.max(y, 26)]).sort((a, b) => a[1] - b[1])) { const h = r.range(9, 14); t.add(line(`M${f(x)} ${f(y + 3)}q${f(r.range(-1.5, 1.5))} -${f(h / 2)} ${f(r.range(-2, 2))} -${f(h)}`, '#b8a448', 1.1, .95) + ell(x + .4, y - h + 1, 1.2, 3.2, '#e8c860', 1, r.range(-12, 12), ink('#a88a28', .35, .6)) + line(`M${f(x + 3)} ${f(y + 3)}q1 -3 2 -6`, '#b8a448', 1, .8)); }
    out(t, 'ground-detail', 'meadow-hay', v, ['seamless', 'ground', 'grass', 'decal-baked']);
  }
}

// =========================== decals (transparent) ===========================
const decal = (name, v, fn) => { const t = mk('decals', name, v); fn(t, rng(hash(name + v))); out(t, 'decals', name, v, ['overlay', 'decal', 'transparent']); };
const butterflyCols = { a: ['#f6d84a', '#e8a83a'], b: ['#6d8ede', '#a8b8f0'], c: ['#f08a4a', '#f6c06a'], d: ['#fbf4f8', '#f2b0c4'] };
for (const [v, [c1, c2]] of Object.entries(butterflyCols)) decal('butterfly', v, (t) => t.add(butterfly(32, 34, c1, c2, v === 'b' ? -14 : 12, 1.4)));
for (const [v, cs] of [['a', [['#f6d84a', '#e8a83a'], ['#fbf4f8', '#f2b0c4']]], ['b', [['#6d8ede', '#a8b8f0'], ['#f08a4a', '#f6c06a']]], ['c', [['#fbf4f8', '#f2b0c4'], ['#c9b3e6', '#8a72b0']]]]) decal('butterflies', v, (t) => t.add(butterfly(24, 38, cs[0][0], cs[0][1], -20, 1.15), butterfly(42, 26, cs[1][0], cs[1][1], 30, 1.3), `<path d="M30 33q4 -3 8 -6" fill="none" stroke="#8a7a50" stroke-width=".7" stroke-dasharray="1.2 2.2" opacity=".5"/>`));
for (const v of ['a', 'b']) decal('bee-flower', v, (t) => { t.add(bloom(v === 'a' ? 'daisy' : 'cornflower', 30, 40, 1.9), bee(40, 24, v === 'a' ? 25 : -20), `<path d="M44 32q6 -4 2 -9" fill="none" stroke="#8a7a50" stroke-width=".7" stroke-dasharray="1.2 2.2" opacity=".6"/>`); });
const patchWash = (cols, rx = 22, ry = 15) => ell(32, 36, rx, ry, cols[0], .5, -10) + ell(30, 33, rx * .7, ry * .7, cols[1], .5, 12);
for (const [v, m] of [['a', 'blush'], ['b', 'gold'], ['c', 'lavender'], ['d', 'poppy']]) decal('flower-carpet', v, (t, r) => {
  t.add(patchWash(['#b3d283', '#cfe1a0']));
  for (const [x, y] of scat(r, 14, 12, 7).filter(([x, y]) => ((x - 32) / 22) ** 2 + ((y - 35) / 15) ** 2 < 1).sort((a, b) => a[1] - b[1])) { const k = r.pick(mood[m]); t.add(bloom(k[0], x, y, .85 + r() * .2, typeof k[1] === 'string' ? k[1] : null)); }
});
for (const v of ['a', 'b']) decal('molehill', v, (t, r) => t.add(ell(34, 46, 15, 5, '#3b3a24', .15), path('M18 46Q20 30 32 28Q44 30 47 46Q32 52 18 46Z', t.lg(['#c9a874', '#a07c4c', '#7a5a38'], 40), 1, ink('#5a4228', .8, .6)), ell(27, 34, 6, 3, '#e4d3a8', .6, -20), v === 'a' ? ell(33, 28, 5, 2.4, '#2e2418', .85) : '', v === 'b' ? tuft(42, 44, P.tuftG, .8, .6) + circ(25, 44, 1.4, '#8a6c40') : ''));
for (const v of ['a', 'b']) decal('hay-scatter', v, (t, r) => { for (let i = 0; i < 16; i++) { const x = r.range(12, 52), y = r.range(16, 52), a = r.range(0, 180); t.add(line(`M${f(x)} ${f(y)}l${f(Math.cos(a / 57.3) * 7)} ${f(Math.sin(a / 57.3) * 3)}`, r.pick(['#e8c860', '#d4b252', '#f0d98a']), 1.2, .95)); } });
for (const v of ['a', 'b']) decal('dandelion-seeds', v, (t, r) => { for (let i = 0; i < 7; i++) { const x = r.range(12, 52), y = r.range(14, 50); t.add(ell(x + 1.5, y + 7, 2.5, .8, '#3b3a24', .1), line(`M${f(x)} ${f(y)}l${f(r.range(-2, 2))} -4M${f(x)} ${f(y)}l-3 -3M${f(x)} ${f(y)}l3 -3M${f(x)} ${f(y)}l-4 -1M${f(x)} ${f(y)}l4 -1`, '#f4f4e8', .8, .9), circ(x, y, .8, '#c8b890')); } });
for (const v of ['a', 'b', 'c']) decal('clover-ring', v, (t, r) => { t.add(ell(32, 38, 20, 10, '#9cc470', .35)); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; const x = 32 + Math.cos(a) * 17, y = 38 + Math.sin(a) * 8; t.add(bloom('clover', x, y + 1, .85 + (i % 3) * .1)); } });
for (const v of ['a', 'b']) decal('picnic-crumbs', v, (t, r) => { for (let i = 0; i < 8; i++) t.add(circ(r.range(14, 50), r.range(22, 50), r.range(.7, 1.2), r.pick(['#e8c890', '#f6efdc', '#d9a860']), .95)); t.add(ell(40, 44, 3, 1.3, '#f6efdc', 1, 20, ink('#b8b09a', .4, .6))); });
for (const v of ['a', 'b']) decal('rabbit-tracks', v, (t, r) => { const pr = (x, y, a) => `<g transform="translate(${x} ${y}) rotate(${a})">${ell(0, 0, 1.6, 2.2, '#8a7a50', .55)}${ell(-1.8, 3.2, 1, 1.6, '#8a7a50', .5)}${ell(1.8, 3.2, 1, 1.6, '#8a7a50', .5)}</g>`; t.add(pr(18, 44, 70), pr(26, 40, 70), pr(36, 36, 70), pr(44, 34, 70)); });

// =========================== edges: wildflower patch autotiles (47 blob each) ===========================
function flowerPatch(name, kinds, wash, rimc) {
  blobSet(SUB, name, {
    mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['transition', 'grass-to-flowers', 'wildflowers'],
    build(t, Gm) {
      const clip = t.clip(Gm.d), id = clip.slice(5, -1);
      t.add(skeleton(G));
      t.add(path(Gm.d, 'none', 1, { stroke: wash[0], 'stroke-width': 10, 'stroke-opacity': .32, 'stroke-linejoin': 'round' }));
      t.add(`<g clip-path="url(#${id})">`);
      t.add(skeleton(G));
      t.add(path(Gm.d, 'none', 1, { stroke: wash[1], 'stroke-width': 9, 'stroke-opacity': .45, 'stroke-linejoin': 'round' }));
      const r = rng(hash('fp-wash' + name)); for (let i = 0; i < 5; i++) { const cx = r.range(0, T), cy = r.range(0, T), rx = r.range(10, 18); t.add(wrapped(cx, cy, rx, (a, b) => ell(a, b, rx, rx * .65, wash[i % 2], .3, r.range(0, 180)))); }
      t.add('</g>');
      t.add(path(Gm.d, 'none', 1, { stroke: rimc, 'stroke-width': 1.1, 'stroke-opacity': .35, 'stroke-linejoin': 'round' }));
      const fr = rng(hash('fp-slots' + name)); const pts = []; for (let i = 0; i < 40; i++) pts.push([fr.range(8, 56), fr.range(8, 56), fr.pick(kinds), fr()]);
      const chosen = []; for (const p of pts) if (chosen.every(q => Math.hypot(q[0] - p[0], q[1] - p[1]) > 7.5)) chosen.push(p);
      chosen.sort((a, b) => a[1] - b[1]);
      for (const [x, y, k, s] of chosen) if (inShape(Gm, x, y, 7) && (k[0] !== 'lavender' || inShape(Gm, x, y - 6, 3))) t.add(bloom(k[0], x, y, .9 + s * .2, k[1] || null));
    },
  });
}
flowerPatch('wildflower-patch', [['cosmos', '#f2a6c0'], ['buttercup'], ['cornflower'], ['daisy'], ['poppy'], ['cosmos', '#f8c6d6'], ['bluebell'], ['daisy']], ['#d4e6a0', '#e4eeb4'], '#7fa862');
flowerPatch('buttercup-patch', [['buttercup'], ['buttercup', '#f8dc62'], ['daisy'], ['buttercup']], ['#e4e6a0', '#eef0b0'], '#a8a85a');
flowerPatch('lavender-patch', [['lavender'], ['lavender', '#8a6ac8'], ['bluebell'], ['lavender']], ['#d4dca8', '#dcd8c0'], '#8a7aa0');

// =========================== fences: 16 connect-4 pieces per set ===========================
// shared geometry: post at (32,48) base; arms to the cell edge on connected sides; same rail heights in every piece so arms continue.
function connectSet(name, draw, tags = []) {
  for (let m = 0; m < 16; m++) { const t = mk('fences', name, String(m).padStart(2, '0')); draw(t, m); out(t, 'fences', name, String(m).padStart(2, '0'), ['autotile', 'connect4', 'mask:' + m, 'obstacle', ...tags]); }
}
const armX = (m) => [m & C4.W ? 0 : 32, m & C4.E ? 64 : 32];
// split-rail farm fence: leaning X stakes + two rough rails, whitewashed
connectSet('fence-rail', (t, m) => {
  const [x0, x1] = armX(m), by = 48, cx = 32, wood = t.lg(['#e6d4ae', '#bfa072'], 90), post = t.lg(['#e6d4ae', '#a88458'], 0);
  t.add(ell(cx + 2, by + 3, 8, 2.6, '#3b3a24', .22));
  if (x1 > x0) t.add(rect(x0 + 1, by + 1.5, x1 - x0, 2.6, '#3b3a24', 1.3, .17));
  if (m & C4.N) t.add(rect(cx - 2, 0, 4, by - 2, t.lg(['#d8c498', '#a88458'], 0), 1, 1, ink(P.inkW, .7, .7)), rect(cx - 2, 2, 4, 3, '#f1dcb2', 0, .5));
  if (x1 > x0) { t.add(rect(x0, 27, x1 - x0, 4.4, wood, 2, 1, ink(P.inkW, .7, .7)), rect(x0, 37, x1 - x0, 4.4, wood, 2, 1, ink(P.inkW, .7, .7)), rect(x0, 27.4, x1 - x0, 1.2, '#fff6dc', 0, .6), rect(x0, 37.4, x1 - x0, 1.2, '#fff6dc', 0, .6));
    // crossed stakes at fixed x (period 32 from the post) so neighbours continue the rhythm
    for (const px of [0, 64]) if ((px === 0 && m & C4.W) || (px === 64 && m & C4.E)) { /* edges handled by the post of the next tile */ }
    for (const sx of [16, 48]) if (sx >= x0 && sx <= x1) t.add(path(`M${sx - 2.6} ${by + 1}L${sx - 1} 24L${sx + 1} 24L${sx + 2.6} ${by + 1}Z`, post, 1, ink(P.inkW, .7, .7)), rect(sx - 1.4, 25, 1, 18, '#fff6dc', 0, .4)); }
  t.add(path(`M${cx - 3.8} ${by}V24L${cx} 20.5L${cx + 3.8} 24V${by}Z`, post, 1, ink(P.inkW, .9, .8)), rect(cx - 2.8, 25, 1.2, 19, '#fff6dc', 0, .55));
  if (m & C4.S) t.add(rect(cx - 2.2, by - 1, 4.4, 64 - by + 1, t.lg(['#e2c892', '#b88e5a'], 0), 1, 1, ink(P.inkW, .7, .7)), rect(cx - 2.2, by + 1, 4.4, 3, '#f1dcb2', 0, .55), rect(cx - 2.2, 60, 4.4, 4, '#3b3a24', 0, .12));
  t.add(tuft(cx - 8, by + 2, '#5f8f4c', .8, .6));
}, ['meadow', 'farm']);
// low dry-stone wall with moss and a few wildflowers on top; stones on a 16 px grid in the arms
connectSet('wall-stone-low', (t, m) => {
  const cx = 32, by = 50, r = rng(hash('wallS')), top = 28;
  const [x0, x1] = armX(m);
  const col = t.lg(['#e0d9c4', '#b4ad98', '#9a937f'], 90);
  t.add(ell(cx + 2, by + 3, 12, 3.4, '#3b3a24', .2));
  if (x1 > x0) t.add(rect(x0 + 1, by + 2, x1 - x0, 3, '#3b3a24', 1.3, .17));
  if (m & C4.N) { t.add(rect(cx - 8, 0, 16, by - 14, t.lg(['#d8d0ba', '#a29a86'], 0), 3, 1, ink(P.inkR, .8, .75))); for (let y = 6; y < by - 20; y += 12) t.add(rect(cx - 8, y, 16, 1, P.inkR, 0, .35)); }
  // arms: continuous band, two courses; joints at fixed x (8,24,40,56 / 16,32,48) so neighbours continue the masonry
  if (x1 > x0) {
    t.add(rect(x0, top, x1 - x0, by - top, t.lg(['#e0d9c4', '#b4ad98', '#9a937f'], 90), 0, 1), rect(x0, top, x1 - x0, 3, '#f4eedc', 0, .6), rect(x0, top + 11, x1 - x0, 1, P.inkR, 0, .4), rect(x0, top, x1 - x0, 1, P.inkR, 0, .6), rect(x0, by - 1, x1 - x0, 1.2, P.inkR, 0, .7));
    for (const jx of [8, 24, 40, 56]) if (jx > x0 && jx < x1) t.add(rect(jx - .5, top + 1, 1, 10, P.inkR, 0, .35));
    for (const jx of [0, 16, 32, 48, 64]) if (jx > x0 && jx < x1) t.add(rect(jx - .5, top + 12, 1, by - top - 13, P.inkR, 0, .35));
    t.add(ell(32, top + 4, 26, 1.6, '#fff', 0));
  }
  t.add(rect(cx - 9, top - 1, 18, by - top + 2, t.lg(['#e0d9c4', '#b4ad98', '#9a937f'], 90), 4, 1, ink(P.inkR, 1, .8)), rect(cx - 9, top - 1, 18, 4, '#f4eedc', 3, .6));
  t.add(line(`M${cx - 9} ${top + 11}H${cx + 9}`, P.inkR, 1, .4));
  if (m & C4.S) t.add(rect(cx - 8, by - 2, 16, 64 - by + 2, t.lg(['#d8d0ba', '#a29a86'], 0), 3, 1, ink(P.inkR, .8, .75)), rect(cx - 8, 60, 16, 4, '#3b3a24', 0, .12));
  // moss caps and tiny blooms on the top, identical x in every piece
  t.add(path(`M${cx - 10} ${top + 1}Q${cx - 5} ${top - 5} ${cx + 1} ${top - 1}Q${cx + 5} ${top - 4} ${cx + 9} ${top + 1}Q${cx} ${top + 4} ${cx - 10} ${top + 1}Z`, '#86b865', .95, ink('#3f6a38', .5, .6)), bloom('daisy', cx - 3, top - 4, .7), bloom('cosmos', cx + 4, top - 3, .6, '#f6a0b8'));
  t.add(tuft(cx + 10, by + 2, '#5f8f4c', .8, .6));
}, ['meadow', 'wall']);
// flowering hedge with mixed wildflowers
connectSet('hedge-wildflower', (t, m) => {
  const r = rng(hash('hedgeWF')), cols = ['#9be08f', '#4a9a50', '#2f6e3a'], rg = t.rg(cols, .3, .2, 1.1);
  const box = (x, y, w, h) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="9" fill="${rg}" stroke="${P.inkG}" stroke-width=".9" stroke-opacity=".7"/>`;
  const hy = 22, hb = 52, x0 = m & C4.W ? -4 : 17, x1 = m & C4.E ? 68 : 47;
  t.add(ell(34, hb + 1, 14, 4, '#3b3a24', .2));
  if (m & C4.N) t.add(box(19, 0, 26, hb - 18));
  if (m & (C4.W | C4.E)) t.add(ell((x0 + x1) / 2 + 2, hb, (x1 - x0) / 2, 3.4, '#3b3a24', .17));
  t.add(box(x0, hy, x1 - x0, hb - hy));
  if (m & C4.S) t.add(ell(34, 61, 12, 3.5, '#3b3a24', .15), box(19, hy + 10, 26, 64 - hy - 8));
  for (let i = 0; i < 14; i++) { const x = r.range(x0 + 4, x1 - 4), y = r.range(hy + 4, hb - 4); t.add(ell(Math.max(3, Math.min(61, x)), y, 3, 1.1, i % 3 ? cols[0] : cols[2], i % 3 ? .6 : .4, r.range(-40, 40))); }
  t.add(ell((x0 + x1) / 2 - 2, hy + 4, Math.min(24, (x1 - x0) / 2 - 3), 2.4, cols[0], .55));
  const cs = ['#f6a0b8', '#fff', '#f6d84a', '#a8b8f0', '#e0583f'];
  for (let i = 0; i < 13; i++) { const x = r.range(Math.max(5, x0 + 4), Math.min(59, x1 - 4)), y = r.range(hy + 5, hb - 4); t.add(circ(x, y, 1.7, cs[i % 5], 1, ink('#5a2a1a', .3, .4)), circ(x - .5, y - .5, .5, '#fff', .7)); }
}, ['meadow', 'hedge']);

await import('./gen-meadow-objects.mjs');
