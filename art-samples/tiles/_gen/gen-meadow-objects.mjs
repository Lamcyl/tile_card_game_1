// Sunny Meadows objects: trees, plants, rocks, props, interest (windmill, barn, pond...), overlays.
import { T, P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, maker, SUBS, sh, trunk, bloom, scat, butterfly, bee, sparkle, glowC, broad, dots, spokes, rockS, fronds, blobPath } from './sub.mjs';

const SUB = SUBS.meadow, { mk, out } = maker(SUB);
const wood = ['#e2c892', '#b88e5a'];

// ============================ trees (64x128) ============================
for (const [v, c, cols] of [['a', { cr: 25, cy: 47, seed: 301, trunkH: 40 }, ['#9be08f', '#5fae5c', '#3a8048']], ['b', { cr: 26, cy: 50, seed: 302, trunkH: 36, tw: 6 }, ['#a8d884', '#6fb05a', '#3f8048']], ['c', { cr: 22, cy: 52, seed: 303, trunkH: 34, lean: 2 }, ['#86cd7f', '#4a9a50', '#2f6e3a']]]) {
  const t = mk('trees', 'oak-meadow', v, T, 128); broad(t, { ...c, cols }); t.add(tuft(18, 114, '#5f8f4c', .8, .7), bloom('daisy', 46, 116, .7), bloom('buttercup', 16, 118, .6));
  out(t, 'trees', 'oak-meadow', v, ['tall', 'broadleaf', 'obstacle']);
}
for (const [v, cols, fruit, seed] of [['a', ['#9be08f', '#4a9a50', '#2f6e3a'], ['#c8352b', '#e0583f'], 311], ['b', ['#a8d884', '#5fae5c', '#3a8048'], ['#f3c24f', '#e8a83a'], 312], ['c', ['#9be08f', '#4a9a50', '#2f6e3a'], ['#f6a0b8', '#fff'], 313]]) {
  const t = mk('trees', 'orchard-tree', v, T, 128);
  broad(t, { cols, cr: 22, cy: 50, seed, trunkH: 36, tw: 4.8, extra: dots(v === 'c' ? 26 : 11, fruit, v === 'c' ? 1.7 : 2.3, 32, 52, 22) });
  if (v !== 'c') t.add(...[[22, 116], [40, 118], [30, 121]].map(([x, y]) => circ(x, y, 2, fruit[0], 1, ink('#5a2a1a', .4, .5)) + circ(x - .6, y - .6, .6, '#fff', .8)));
  else t.add(ell(40, 116, 3, 1.3, '#f6c6d4', .9, 10), ell(22, 118, 2.4, 1.1, '#fbdde6', .9, -15));
  out(t, 'trees', 'orchard-tree', v, ['tall', 'orchard', 'obstacle', v === 'c' ? 'blossom' : 'fruit']);
}
for (const [v, n, seed] of [['a', 3, 321], ['b', 4, 322], ['c', 2, 323]]) {  // sunflower patch
  const t = mk('trees', 'sunflowers', v, T, 128), r = rng(seed); t.add(sh(34, 114, 22, 6));
  const st = []; for (let i = 0; i < n; i++) st.push([32 + (i - (n - 1) / 2) * (n > 3 ? 10.5 : 13) + r.range(-2, 2), 112 - r.range(0, 4), r.range(52, 76), r.range(-4, 4)]); st.sort((a, b) => a[1] - b[1]);
  for (const [x, y, h, lean] of st) {
    t.add(line(`M${f(x)} ${f(y)}Q${f(x + lean * .2)} ${f(y - h * .5)} ${f(x + lean)} ${f(y - h)}`, '#4f8a44', 3, 1));
    t.add(path(`M${f(x)} ${f(y - 12)}q-12 -3 -15 -12q9 -1 15 12Z`, '#5fae5c', 1, ink(P.inkG, .7, .7)), path(`M${f(x)} ${f(y - 24)}q12 -3 14 -12q-9 0 -14 12Z`, '#4a9a50', 1, ink(P.inkG, .7, .7)));
    const hx = x + lean, hy = y - h;
    for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283; t.add(ell(hx + Math.cos(a) * 9, hy + Math.sin(a) * 9, 5.4, 2.2, k % 2 ? '#f3c24f' : '#f8d65e', 1, a * 57.3, ink('#a88a1c', .5, .6))); }
    t.add(circ(hx, hy, 7, t.rg(['#8a6a44', '#4a3220', '#3a2616'], .35, .3, .8), 1, ink('#2e1e10', .8, .8)), ell(hx - 2, hy - 2.4, 2.6, 1.4, '#c8a070', .55, -30));
  }
  out(t, 'trees', 'sunflowers', v, ['tall', 'meadow-crop']);
}
for (const [v, cols, seed] of [['a', ['#9be08f', '#4a9a50', '#2f6e3a'], 331], ['b', ['#a8d884', '#5fae5c', '#3a8048'], 332], ['c', ['#86cd7f', '#4a9a50', '#2f6e3a'], 333]]) {
  const t = mk('trees', 'bush-flowering', v), r = rng(seed); t.add(sh(34, 52, 20, 5.5));
  const rg = t.rg(cols, .3, .25, 1), w = 22, h = 17;
  for (const [dx, dy, k] of [[-.55, .1, .62], [.55, .1, .6], [0, -.3, .7], [0, .15, .75]]) t.add(path(blobPath(r, 32 + dx * w, 38 + dy * h, w * k, h * k * 1.05, 9, .1), rg, 1, ink(P.inkG, .9, .7)));
  t.add(ell(24, 30, 9, 4, cols[0], .55, -15));
  const fc = { a: ['#f6a0b8', '#fbdde6'], b: ['#fff', '#fff6c0', '#f6d84a'], c: ['#a58ad8', '#c9b3ee', '#fff'] }[v];
  t.add(dots(14, fc, 1.7, 32, 36, 20)(r));
  out(t, 'trees', 'bush-flowering', v, ['small', 'bush']);
}

// ============================ grass-layer plants (64x64) ============================
for (const [v, kinds] of [['a', [['cosmos', '#f2a6c0'], ['daisy']]], ['b', [['buttercup'], ['daisy']]], ['c', [['cornflower'], ['poppy']]], ['d', [['cosmos', '#f2a05a'], ['buttercup', '#f3b24a']]]]) {
  const t = mk('grass', 'wildflower-clump', v), r = rng(340 + v.charCodeAt(0)); t.add(ell(33, 53, 18, 4, '#2e2c1a', .13));
  for (let i = 0; i < 20; i++) { const x = 32 + r.range(-15, 15), h = r.range(14, 30); t.add(line(`M${f(x)} 52q${f((x - 32) * .1 + r.range(-2, 2))} -${f(h / 2)} ${f((x - 32) * .25)} -${f(h)}`, r.pick(['#5fae5c', '#4a9a50', '#7fbf6a']), 1.5, .95)); }
  const pts = scat(r, 9, 12, 8).map(([x, y]) => [x, 18 + (y - 12) * .55]).sort((a, b) => a[1] - b[1]);
  for (const [x, y] of pts) { const k = r.pick(kinds); t.add(bloom(k[0], x, y, 1.05, k[1] || null)); }
  out(t, 'grass', 'wildflower-clump', v, ['concealing', 'overlay-prop', 'meadow']);
}
for (const [v, c] of [['a', '#a58ad8'], ['b', '#8a6ac8']]) {
  const t = mk('grass', 'lavender-bush', v), r = rng(350 + v.charCodeAt(0)); t.add(ell(33, 53, 18, 4.5, '#2e2c1a', .14));
  t.add(path('M12 52Q12 36 32 34Q52 36 52 52Q32 57 12 52Z', t.rg(['#9ccf86', '#6fa05a', '#4a7a44'], .3, .25, 1), 1, ink(P.inkG, .8, .7)));
  for (let i = 0; i < 16; i++) { const x = 16 + i * 2.2 + r.range(-1, 1), h = r.range(14, 26); t.add(line(`M${f(x)} 46q${f(r.range(-2, 2))} -${f(h / 2)} ${f(r.range(-3, 3))} -${f(h)}`, '#6f9a58', 1, .85)); for (let k = 0; k < 5; k++) t.add(circ(x + (k % 2 ? 1 : -1) * .8 + (x - 32) * .05 * k * .3, 44 - h + k * 2.8 - 2, 1.5, k % 2 ? c : '#c9b3ee', 1, ink('#4a3a78', .3, .4))); }
  out(t, 'grass', 'lavender-bush', v, ['concealing', 'meadow']);
}

// ============================ rocks ============================
for (const [v, s, rx, ry] of [['a', 351, 17, 13], ['b', 352, 20, 12]]) { const t = mk('rocks', 'boulder-flowered', v), r = rng(s); t.add(rockS(t, r, 32, 40, rx, ry, P.stone, { moss: true, flowers: true })); t.add(bloom('buttercup', 22, 50, .8), bloom('cosmos', 44, 49, .7, '#f6a0b8')); out(t, 'rocks', 'boulder-flowered', v, ['obstacle', 'meadow']); }
{ const t = mk('rocks', 'stepping-stones', 'a'), r = rng(353); for (const [x, y, rx] of [[16, 46, 8], [30, 38, 9], [46, 30, 8], [50, 48, 6]]) t.add(ell(x + 1, y + 2, rx, 3, '#3b3a24', .14), ell(x, y, rx, rx * .55, '#cfc8b0', 1, 0, ink(P.inkR, .8, .75)), ell(x - 1.5, y - 1.4, rx * .55, rx * .25, '#fff', .55), tuft(x + rx - 2, y + 1, '#5f8f4c', .7, .5)); out(t, 'rocks', 'stepping-stones', 'a', ['walkable', 'decor', 'meadow']); }

// ============================ props (64x64 / tall / large) ============================
for (const [v, h] of [['a', 1], ['b', .85]]) {  // conical haystack
  const t = mk('props', 'haystack', v); t.add(sh(34, 53, 20 * h + 2, 5));
  t.add(path(`M${32 - 20 * h} 52Q${32 - 18 * h} 40 ${32 - 9 * h} 26Q32 ${6 + (1 - h) * 14} ${32 + 9 * h} 26Q${32 + 18 * h} 40 ${32 + 20 * h} 52Q32 57 ${32 - 20 * h} 52Z`, t.lg(['#f6e08e', '#e0b84e', '#b8902c'], 50), 1, ink('#8a6a28', 1, .8)));
  for (let i = 0; i < 12; i++) { const y = 28 + i * 2.1; t.add(line(`M${f(32 - (y - 20) * .6 * h)} ${f(y)}q${f(10 * h)} ${f(3)} ${f(22 * h)} ${f(-1)}`, i % 2 ? '#c9a23c' : '#f6e8a8', 1, .6)); }
  t.add(line('M30 10l-3 -6M33 10l1 -7', '#e0b84e', 1.4, .95), line('M18 52l-3 -5M44 52l3 -5M26 53l-1 -4', '#e0b84e', 1.3, .9));
  out(t, 'props', 'haystack', v, ['obstacle', 'farm']);
}
for (const [v, a] of [['a', 0], ['b', 1]]) {   // round hay bale, side-on, optionally wrapped with a string
  const t = mk('props', 'hay-roll', v); t.add(sh(34, 53, 21, 5));
  t.add(rect(10, 28, 42, 24, t.lg(['#f6e08e', '#d4b252', '#a8842c'], 90), 11, 1, ink('#8a6a28', 1, .8)), ell(52, 40, 6, 12, t.rg(['#f0d98a', '#d4b252', '#b8902c'], .4, .4, .8), 1, 0, ink('#8a6a28', 1, .8)));
  for (let i = 1; i < 4; i++) t.add(ell(52, 40, 6 - i * 1.4, 12 - i * 3, 'none', 1, 0, { fill: 'none', stroke: '#a8842c', 'stroke-width': .8, 'stroke-opacity': .6 }));
  t.add(line('M16 33H46M16 38H46M14 44H46', '#f6e8a8', 1, .45), line('M14 28q-3 -4 -7 -3M20 27l-1 -5', '#e0b84e', 1.3, .9));
  if (a) t.add(rect(24, 28, 3, 24, '#c8352b', 0, .9), rect(38, 28, 3, 24, '#c8352b', 0, .9));
  out(t, 'props', 'hay-roll', v, ['obstacle', 'farm']);
}
{ // straw skep hives on a bench (a) and white box hives (b), mini beehive on a post (c)
  const skep = (t, x, y, k) => { t.add(ell(x + 1.5, y + 1, 9 * k, 2.6 * k, '#3b3a24', .18), path(`M${f(x - 9 * k)} ${f(y)}Q${f(x - 10 * k)} ${f(y - 14 * k)} ${f(x)} ${f(y - 17 * k)}Q${f(x + 10 * k)} ${f(y - 14 * k)} ${f(x + 9 * k)} ${f(y)}Z`, t.lg(['#f6e08e', '#d4b252', '#a8842c'], 40), 1, ink('#8a6a28', 1, .8)));
    for (let i = 1; i < 5; i++) t.add(path(`M${f(x - (9 - i * .5) * k)} ${f(y - i * 3.3 * k)}q${f((9 - i * .5) * k)} ${f(2.6 * k)} ${f((18 - i) * k)} 0`, 'none', 1, { fill: 'none', stroke: '#8a6a28', 'stroke-width': .9, 'stroke-opacity': .6 })); t.add(ell(x, y - 4 * k, 2.2 * k, 3 * k, '#3b2a18', .9)); };
  const t = mk('props', 'beehive', 'a'); t.add(sh(34, 53, 22, 5)); t.add(rect(8, 44, 48, 5, t.lg(wood, 90), 1.5, 1, ink(P.inkW, .9, .8)), rect(12, 48, 5, 6, P.bark[1], 1), rect(47, 48, 5, 6, P.bark[1], 1)); skep(t, 22, 44, .95); skep(t, 44, 44, .8); t.add(bee(31, 20, 20), bee(50, 26, -25)); out(t, 'props', 'beehive', 'a', ['obstacle', 'farm', 'bees']);
  const b = mk('props', 'beehive', 'b'); b.add(sh(34, 54, 18, 5)); b.add(rect(14, 46, 36, 5, P.bark[1], 1), rect(16, 50, 4, 4, P.bark[2]), rect(44, 50, 4, 4, P.bark[2]));
  [[46, '#fffaf0'], [34, '#f6e8c8'], [22, '#fffaf0']].forEach(([y, c], i) => b.add(rect(16, y, 32, 12, b.lg([c, '#cdbd94'], 90), 1.5, 1, ink(P.inkW, .8, .8)), rect(30, y + 7, 8, 2, '#3b2a18', 1)));
  b.add(path('M12 22H52L48 14H16Z', b.lg(['#e6d4ae', '#a88458'], 90), 1, ink(P.inkW, .9, .8)), rect(14, 21, 36, 3, '#c8352b', 1, 1), bee(40, 8, 15), bee(20, 10, -30)); out(b, 'props', 'beehive', 'b', ['obstacle', 'farm', 'bees']);
  const c = mk('props', 'beehive', 'c', T, 128); c.add(sh(34, 114, 14, 4.5)); c.add(rect(29, 62, 6, 52, c.lg(P.bark, 0), 1.5, 1, ink(P.inkW, .9, .8)), rect(14, 56, 36, 5, c.lg(wood, 90), 1.5, 1, ink(P.inkW, .9, .8))); skep(c, 32, 56, 1.15); c.add(bee(46, 30, 20), bee(18, 40, -25), bee(40, 46, 60), `<path d="M44 34q-6 6 -2 10" fill="none" stroke="#8a7a50" stroke-width=".7" stroke-dasharray="1.2 2.2" opacity=".6"/>`); out(c, 'props', 'beehive', 'c', ['tall', 'farm', 'bees']);
}
for (const [v, c1, c2] of [['a', '#c8352b', '#fff6e0'], ['b', '#4d639a', '#fff6e0']]) {  // picnic blanket
  const t = mk('props', 'picnic', v); t.add(ell(34, 46, 26, 11, '#3b3a24', .16));
  t.add(path('M7 40L16 22H56L58 44L48 52H10Z', t.lg([c1, v === 'a' ? '#8e2118' : '#33456f'], 90), 1, ink(P.inkW, .8, .75)));
  for (let i = 0; i < 6; i++) t.add(line(`M${14 + i * 8} 23L${6 + i * 9} 51`, c2, 3.4, .6));
  for (let i = 0; i < 4; i++) t.add(line(`M${10 + i * 1} ${28 + i * 6}H${57}`, c2, 3.4, .5));
  if (v === 'a') t.add(path('M20 34Q20 24 30 24Q40 24 40 34Z', t.lg(['#d9bc8a', '#a8844f'], 90), 1, ink(P.inkW, .9, .8)), path('M22 33q8-12 16 0', 'none', 1, { fill: 'none', stroke: P.inkW, 'stroke-width': 1.4 }), rect(20, 33, 20, 8, t.lg(['#d9bc8a', '#a8844f'], 90), 2, 1, ink(P.inkW, .9, .8)), circ(46, 36, 3.6, '#fffaf0', 1, ink('#b8b09a', .6, .7)), circ(50, 41, 3.4, '#fffaf0', 1, ink('#b8b09a', .6, .7)), circ(46, 36, 3.6, 'none', 1, { fill: 'none' }), path('M44 36l4 0l0 2l-4 0Z', '#2a2a2a', 1));
  else t.add(ell(28, 36, 6, 3, '#e8eef0', 1, 0, ink('#7a8a90', .8, .8)), ell(28, 35, 4.2, 2, '#c97a4a', .9), path('M32 33h4v5h-4Z', '#fffaf0', 1, ink('#7a8a90', .7, .8)), circ(46, 38, 3.4, '#fffaf0', 1, ink('#b8b09a', .6, .7)), circ(51, 42, 3, '#fffaf0', 1, ink('#b8b09a', .6, .7)), bloom('daisy', 20, 34, .9));
  out(t, 'props', 'picnic', v, ['decor', 'meadow']);
}
for (const [v, load] of [['a', 'hay'], ['b', 'flowers']]) {  // wheelbarrow
  const t = mk('props', 'wheelbarrow', v); t.add(sh(34, 53, 22, 5));
  t.add(path('M16 28L50 28L44 46Q32 50 22 46Z', t.lg(['#d96a52', '#a82a20'], 90), 1, ink('#5a1a14', .9, .8)), rect(16, 27, 34, 3, '#f09a86', 1, .8), line('M22 40H44', '#5a1a14', 1, .35));
  if (load === 'hay') t.add(path('M18 28Q22 14 32 16Q42 12 48 28Z', t.lg(['#f6e08e', '#d4b252'], 90), 1, ink('#8a6a28', .9, .8)), line('M24 20l-2 -4M38 17l2 -5', '#e0b84e', 1.2));
  else for (const [x, y, k] of [[24, 24, 'cosmos'], [32, 20, 'daisy'], [40, 23, 'cornflower'], [29, 26, 'buttercup'], [45, 26, 'poppy']]) t.add(bloom(k, x, y, 1.05, k === 'cosmos' ? '#f2a6c0' : null));
  t.add(line('M44 46L58 36M24 46L8 38', P.bark[1], 3, 1), line('M8 38l-3 -3M58 36l3 -2', P.bark[2], 3), circ(24, 50, 5, '#4a3220', 1, ink('#2a1a10', .8, .8)), circ(24, 50, 2, '#b4ad98'), line('M24 50l3 -2M24 50l-3 2', '#4a3220', 1));
  out(t, 'props', 'wheelbarrow', v, ['obstacle', 'farm']);
}
{ const t = mk('props', 'water-trough', 'a'); t.add(sh(34, 52, 24, 5));
  t.add(path('M8 34H56L52 50H12Z', t.lg(wood, 90), 1, ink(P.inkW, 1, .8)), ell(32, 34, 24, 5, '#4f8aa8', 1, 0, ink(P.inkW, 1, .8)), ell(32, 34, 21, 3.4, '#9fd0dc', 1), line('M22 35q4-1.5 8 0t8 0', '#f6f3e6', 1, .8), line('M12 40H52M13 45H51', P.bark[2], 1, .4), rect(10, 48, 5, 6, P.bark[1], 1), rect(49, 48, 5, 6, P.bark[1], 1), tuft(52, 54, P.tuftG, .8, .6));
  out(t, 'props', 'water-trough', 'a', ['obstacle', 'farm']); }
for (const [v, hat, crow] of [['b', '#e8c860', false], ['c', '#c8352b', true], ['d', '#4d639a', false]]) {  // field scarecrows
  const t = mk('props', 'scarecrow-field', v, T, 128); t.add(sh(34, 114, 14, 4.5));
  t.add(rect(30, 40, 4, 74, t.lg(P.bark, 0), 1, 1, ink(P.inkW, .9, .8)), rect(8, 56, 48, 4, t.lg(P.bark, 90), 1.5, 1, ink(P.inkW, .9, .8)));
  const coat = v === 'b' ? ['#e0a850', '#b87830'] : v === 'c' ? ['#9bbf6a', '#5f8f4c'] : ['#e8d8b0', '#a89868'];
  t.add(path('M22 58Q32 49 42 58L45 86Q32 92 19 86Z', t.lg(coat, 0), 1, ink(P.inkW, 1, .8)), rect(19, 72, 26, 4, v === 'd' ? '#c8352b' : '#7a8fc0', 0, .85));
  t.add(path('M10 58l-3 14l5 -2l2 6l4 -4Z', coat[0], 1, ink(P.inkW, .8, .8)), path('M54 58l3 14l-5 -2l-2 6l-4 -4Z', coat[1], 1, ink(P.inkW, .8, .8)), line('M24 90l-2 10M40 90l2 10M18 86l-3 8M46 86l3 8', '#e0b84e', 2.2, .95));
  t.add(circ(32, 42, 10, t.rg(['#f6e8b8', '#d4b878'], .35, .3, .9), 1, ink('#8a6a28', 1, .8)), circ(28, 41, 1.4, '#3b2a1a'), circ(36, 41, 1.4, '#3b2a1a'), line('M27 47q5 3 10 0', '#3b2a1a', 1.2, .85), line('M26 41l-2 -1M38 41l2 -1', '#3b2a1a', 1, .6));
  t.add(ell(32, 35, 17, 4, hat, 1, 0, ink(P.inkW, .9, .8)), path('M22 35Q32 14 42 35Z', t.lg([hat, '#8a6a28'], 40), 1, ink(P.inkW, .9, .8)), rect(22, 31, 20, 3, v === 'c' ? '#fff6e0' : '#c8352b', 0, .9));
  if (v === 'd') t.add(bloom('cosmos', 40, 32, .9, '#f6a0b8'));
  if (crow) t.add(ell(52, 53, 6, 4, '#2a2a38', 1, -10, ink('#14141c', .6, .8)), circ(57, 49, 3, '#2a2a38', 1, ink('#14141c', .6, .8)), path('M60 49l4 1l-4 1Z', '#e8a83a'), circ(58, 48.4, .7, '#fff'), path('M46 54l-8 3l8 -1Z', '#2a2a38'), line('M51 57v3M53 57v3', '#e8a83a', 1));
  out(t, 'props', 'scarecrow-field', v, ['tall', 'farm', 'obstacle']);
}
{ const t = mk('props', 'birdhouse-post', 'a', T, 128); t.add(sh(34, 114, 12, 4.5));
  t.add(rect(30, 54, 4, 60, t.lg(P.bark, 0), 1, 1, ink(P.inkW, .9, .8)), path('M18 50V30L32 20L46 30V50Z', t.lg(['#f6d8c0', '#d9a888'], 0), 1, ink(P.inkW, .9, .8)), path('M14 32L32 16L50 32L47 34L32 22L17 34Z', t.lg(['#c8352b', '#8e2118'], 90), 1, ink('#5a1a14', .9, .8)), circ(32, 38, 4, '#3b2a1a'), rect(28, 48, 8, 2, P.bark[1], 1), ell(50, 46, 3.6, 2.4, '#4d639a', 1, 0, ink(P.inkB, .6, .8)), circ(53, 44, 2, '#4d639a'), path('M55 44l3 .6l-3 .8Z', '#e8a83a'), tuft(20, 114, '#5f8f4c', .8, .7));
  out(t, 'props', 'birdhouse-post', 'a', ['tall', 'decor']); }
{ const t = mk('props', 'milk-churns', 'a'); t.add(sh(34, 53, 20, 5));
  for (const [x, h, k] of [[22, 30, .9], [40, 34, 1]]) t.add(path(`M${x - 8 * k} 52Q${x - 9 * k} ${52 - h * .6} ${x - 6 * k} ${52 - h + 6}H${x + 6 * k}Q${x + 9 * k} ${52 - h * .6} ${x + 8 * k} 52Z`, t.lg(['#e8eef0', '#b4c0c6', '#8a98a0'], 0), 1, ink('#4a5a62', .9, .8)), ell(x, 52 - h + 5, 8 * k, 2.4, '#cfd8dc', 1, 0, ink('#4a5a62', .8, .8)), path(`M${x - 6 * k} ${52 - h + 2}Q${x} ${52 - h - 5} ${x + 6 * k} ${52 - h + 2}Z`, '#b4c0c6', 1, ink('#4a5a62', .8, .8)), rect(x - 8 * k, 52 - h * .55, 16 * k, 2.4, '#4d639a', 0, .9), ell(x - 4 * k, 52 - h * .55, 1.2, 8, '#fff', .35));
  out(t, 'props', 'milk-churns', 'a', ['obstacle', 'farm']); }

// hay cart (large 128x128)
{ const t = mk('props', 'hay-cart', 'a', 128, 128); t.add(sh(66, 112, 46, 8));
  t.add(rect(14, 94, 60, 4, P.bark[2], 1), line('M74 98L116 84M20 98L8 86', P.bark[1], 4, 1), line('M116 84l5 -5', P.bark[2], 4));
  t.add(path('M20 62H86L82 98H24Z', t.lg(wood, 90), 1, ink(P.inkW, 1, .8)), line('M24 72H84M25 82H83M26 92H82', P.bark[2], 1.2, .45), rect(20, 62, 66, 4, '#f1dcb2', 0, .5));
  t.add(path('M18 64Q20 38 36 36Q44 22 58 30Q72 24 84 40Q90 52 88 64Q54 56 18 64Z', t.lg(['#f6e08e', '#d4b252', '#b8902c'], 50), 1, ink('#8a6a28', 1, .8)));
  for (let i = 0; i < 18; i++) t.add(line(`M${f(26 + i * 3.4)} ${f(60 - Math.sin(i / 17 * 3.1) * 20)}l${f((i % 3 - 1) * 4)} -4`, i % 2 ? '#f6e8a8' : '#c9a23c', 1.2, .85));
  t.add(circ(36, 100, 14, t.rg(['#c9a874', '#8a6038', '#5a3a22'], .4, .35, .9), 1, ink('#3a2616', 1, .85)), circ(36, 100, 4.4, '#b4ad98', 1, ink('#3a2616', .8, .85)), spokes(36, 100, 8, 4, 12, '#4a3220', 1.2, .8));
  t.add(rect(48, 93, 28, 3, '#3b3a24', 0, .0), rect(26, 62, 4, 38, P.bark[1], 0, .6), rect(78, 62, 4, 38, P.bark[1], 0, .6));
  t.add(bloom('daisy', 70, 40, 1.1), bloom('cosmos', 44, 36, 1, '#f6a0b8'));
  out(t, 'props', 'hay-cart', 'a', ['large', 'obstacle', 'farm']); }

// ============================ interest (large / landmarks) ============================
function windmill(t, ang, tag) {
  t.add(sh(66, 116, 44, 8));
  const body = t.lg(['#fff6e6', '#e8dcc0', '#b8a888'], 0);
  t.add(path('M34 116L46 52H82L94 116Q64 122 34 116Z', body, 1, ink('#6b5a3e', 1, .8)));
  for (let i = 0; i < 5; i++) { const y = 62 + i * 11; t.add(line(`M${f(46 - (y - 52) * -.19 - 0)} ${f(y)}H${f(82 + (y - 52) * .19)}`, '#b8a888', 1, .5)); }
  t.add(path('M34 116L46 52H56L46 116Z', '#fff', .25), path('M80 52H82L94 116H84Z', '#6b5a3e', .18));
  t.add(rect(54, 94, 20, 22, t.lg(['#8a6a44', '#4a3220'], 90), 1, 1, ink(P.inkW, 1, .8)), path('M54 96Q64 84 74 96Z', '#6b4a2c', 1, ink(P.inkW, .9, .8)), line('M64 86V116', P.bark[2], 1, .6), circ(70, 106, 1.2, P.gold));
  t.add(rect(58, 72, 12, 12, '#6a8aa0', 2, 1, ink(P.inkW, .9, .8)), line('M64 72V84M58 78H70', '#f6efdc', 1, .9), ell(61, 74, 2, 1, '#fff', .5));
  t.add(rect(42, 90, 8, 8, '#6a8aa0', 1, .0));
  t.add(path('M44 54Q44 38 64 32Q84 38 84 54Z', t.lg(['#7a8fc0', '#4d639a', '#33456f'], 0), 1, ink(P.inkB, 1, .8)), path('M48 50Q50 40 62 36Q54 44 52 50Z', '#fff', .25), line('M54 50Q64 52 74 50', '#33456f', 1, .6));
  const hub = [64, 46];
  for (let k = 0; k < 4; k++) {
    const a = ang + k * 90; const bl = (x, y) => { const rr = a * Math.PI / 180, c = Math.cos(rr), s = Math.sin(rr); return `${f(hub[0] + x * c - y * s)} ${f(hub[1] + x * s + y * c)}`; };
    t.add(path(`M${bl(6, -1.4)}L${bl(46, -1.4)}L${bl(46, 1.4)}L${bl(6, 1.4)}Z`, P.bark[1], 1, ink(P.inkW, .8, .8)));
    t.add(path(`M${bl(12, 1.4)}L${bl(44, 1.4)}L${bl(44, 11)}L${bl(12, 11)}Z`, '#f6efdc', .95, ink('#8a7a50', .8, .8)));
    t.add(path(`M${bl(12, 1.4)}L${bl(44, 1.4)}L${bl(44, 4)}L${bl(12, 4)}Z`, '#fff', .5));
    for (let i = 0; i < 5; i++) t.add(line(`M${bl(15 + i * 6, 1.4)}L${bl(15 + i * 6, 11)}`, '#8a7a50', .8, .6));
    t.add(line(`M${bl(12, 6.2)}L${bl(44, 6.2)}`, '#8a7a50', .7, .5));
  }
  t.add(circ(hub[0], hub[1], 5, t.rg(['#8a6a44', '#4a3220'], .35, .3, .9), 1, ink(P.inkW, 1, .8)), circ(63, 44.6, 1.6, '#c8a070', .8));
}
for (const [v, ang] of [['a', 12], ['b', 45]]) { const t = mk('interest', 'windmill', v, 128, 128); windmill(t, ang, v); t.add(bloom('daisy', 30, 118, .8), bloom('cosmos', 98, 118, .8, '#f6a0b8'), tuft(24, 118, P.tuftG, .8, .7)); out(t, 'interest', 'windmill', v, ['large', 'landmark', 'obstacle', 'farm']); }
{ const t = mk('interest', 'barn', 'a', 128, 128); t.add(sh(66, 117, 52, 8));
  t.add(path('M20 116V70L24 52Q24 36 64 28Q104 36 104 52L108 70V116Q64 122 20 116Z', t.lg(['#e0583f', '#c8352b', '#8e2118'], 0), 1, ink('#4a1410', 1, .8)));
  t.add(path('M20 70L24 52Q24 36 64 28Q104 36 104 52L108 70Q64 60 20 70Z', t.lg(['#9a7a8a', '#6a5a78', '#4a3a58'], 0), 1, ink('#2a1a38', 1, .8)));
  for (let i = 0; i < 9; i++) t.add(line(`M${24 + i * 10} 72V114`, '#8e2118', 1, .35));
  t.add(rect(20, 70, 88, 3, '#fff6e0', 0, .9), path('M20 72L24 52', 'none', 1, { fill: 'none' }));
  t.add(rect(38, 78, 52, 38, t.lg(['#d6483a', '#a82a20'], 0), 1, 1, ink('#fff6e0', 2.2, .95)), line('M38 78L90 116M90 78L38 116', '#fff6e0', 2.2, .95), line('M64 78V116', '#fff6e0', 2.2, .9));
  t.add(path('M54 44h20v14H54Z', '#2e2418', 1, ink('#fff6e0', 2, .95)), line('M54 44L74 58M74 44L54 58', '#fff6e0', 1.6, .8), ell(64, 40, 10, 3, '#fff6e0', 1), line('M64 28V20', P.inkW, 1.4), path('M64 20l8 3l-8 3Z', '#e8a83a'));
  t.add(path('M22 52Q24 36 64 28', 'none', 1, { fill: 'none', stroke: '#fff', 'stroke-width': 1.4, 'stroke-opacity': .35 }), ell(34, 100, 10, 5, '#fff', .0));
  t.add(tuft(16, 118, P.tuftG, .8, .8), tuft(112, 118, P.tuftG, .8, .8), bloom('buttercup', 112, 120, .8), bloom('daisy', 14, 121, .8));
  out(t, 'interest', 'barn', 'a', ['large', 'landmark', 'obstacle', 'farm']); }
// small pond with lilies (large, transparent, bank blends into grass)
for (const [v, seed] of [['a', 361], ['b', 362]]) {
  const t = mk('interest', 'pond-lilies', v, 128, 128), r = rng(seed);
  const bank = blobPath(r, 64, 84, 52, 34, 11, .1), water = blobPath(rng(seed + 9), 64, 84, 44, 27, 11, .09);
  t.add(path(bank, '#8fb872', .35), path(bank, 'none', 1, { stroke: '#7fa862', 'stroke-width': 2, 'stroke-opacity': .35 }));
  t.add(path(water, '#4f8aa8', 1), path(water, t.rg(['#b2dce4', '#9fd0dc', '#6fb0c8'], .35, .3, .9), 1), path(water, 'none', 1, { stroke: '#d8f0ee', 'stroke-width': 4, 'stroke-opacity': .5 }), path(water, 'none', 1, { stroke: '#4f8aa8', 'stroke-width': 1.3, 'stroke-opacity': .6 }));
  t.add(line('M36 80q5 -2.4 10 0t10 0', '#f6f3e6', 1.2, .75), line('M72 96q5 -2.4 10 0t10 0', '#f6f3e6', 1.2, .75), ell(48, 74, 9, 2.2, '#fff', .3, -10));
  const pads = v === 'a' ? [[50, 90, 9], [78, 80, 10], [92, 94, 7], [62, 74, 6]] : [[44, 84, 8], [66, 92, 10], [86, 82, 8], [76, 100, 6], [58, 76, 6]];
  pads.forEach(([x, y, rx], i) => { t.add(ell(x + 1, y + 1.6, rx, rx * .55, '#2a5a6a', .2), `<path d="M${x} ${y}L${x + rx} ${y - 1}A${rx} ${rx * .55} 0 1 1 ${x + rx * .3} ${y - rx * .5}Z" fill="${t.lg(['#7fcf86', '#3f9a58'], 60)}" stroke="#2f6e3a" stroke-width=".8" stroke-opacity=".7"/>`, line(`M${x} ${y}L${x - rx * .7} ${y + rx * .2}`, '#2f6e3a', .8, .5)); });
  const fl = (x, y, c, s = 1) => { for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; t.add(ell(x + Math.cos(a) * 3 * s, y + Math.sin(a) * 1.6 * s, 3 * s, 1.5 * s, c, 1, a * 57.3 * .6, ink('#b0607a', .4, .5))); } t.add(circ(x, y, 1.6 * s, P.gold)); };
  fl(pads[1][0] + 2, pads[1][1] - 3, '#f6c6d4', 1.1); fl(pads[0][0] - 2, pads[0][1] - 2, '#fff', 1); if (v === 'b') fl(pads[3][0], pads[3][1] - 2, '#f6a0b8', .9);
  // reeds + cattails on the bank
  for (const [x, y] of [[20, 96], [24, 104], [106, 100], [100, 108]]) { for (let k = 0; k < 4; k++) t.add(line(`M${x + k * 2.4} ${y}q${(k - 1.5) * 1.5} -10 ${(k - 1.5) * 3} -${16 + k * 3}`, '#6a9a4a', 1.4, .95)); t.add(rect(x + 2, y - 24, 3.2, 8, '#8a5a34', 1.4, 1, ink(P.inkW, .6, .8))); }
  t.add(tuft(34, 108, P.tuftG, .8, .8), bloom('daisy', 100, 66, .8), bloom('buttercup', 24, 76, .8));
  out(t, 'interest', 'pond-lilies', v, ['large', 'water', 'decor', 'meadow-pond']);
}
// lone blossom tree landmark: a = full bloom with stone bench, b = petals falling, ring of fallen petals; c = with a swing
for (const [v, seed] of [['a', 371], ['b', 372], ['c', 373]]) {
  const t = mk('trees', 'blossom-lone', v, 128, 128), r = rng(seed), cols = P.blossom;
  t.add(sh(68, 112, 46, 9));
  if (v === 'b') t.add(ell(66, 112, 52, 11, '#f6c6d4', .35), ell(66, 112, 38, 7, '#fbdde6', .35));
  t.add(path('M52 114Q58 100 58 84Q54 70 48 58Q56 62 60 66Q62 52 66 44Q70 62 72 68Q82 60 90 56Q82 72 76 84Q78 100 84 114Q68 108 52 114Z', t.lg(P.bark, 0), 1, ink(P.inkW, 1, .8)));
  t.add(line('M60 80q2 10 0 24M72 76q-2 12 2 28', P.bark[2], 1.2, .5));
  const L = [[0, 0, 1], [-.62, .2, .66], [.64, .2, .66], [-.32, -.5, .62], [.34, -.52, .6], [0, .52, .56], [-.9, .45, .4], [.9, .5, .4]], cr = 41, cx = 64, cy = 50, rg = t.rg([cols[0], cols[1], cols[2]], .3, .25, 1);
  for (const [dx, dy, k] of L) t.add(circ(cx + dx * cr, cy + dy * cr, cr * k * .95, cols[2], 1, ink('#b0607a', 1, .55)));
  for (const [dx, dy, k] of L) t.add(circ(cx + dx * cr - 2, cy + dy * cr - 3, cr * k * .8, rg, 1));
  t.add(ell(cx - 14, cy - 18, 20, 11, '#fff', .45, -20));
  for (let i = 0; i < 46; i++) { const a = r.range(0, 6.28), d = Math.sqrt(r()) * cr * .95; t.add(circ(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .85, r.range(1.2, 2.3), r.pick(['#fff', '#fbdde6', '#f2b0c4']), .9)); }
  if (v === 'a') t.add(rect(88, 104, 24, 6, t.lg(P.stone, 90), 2, 1, ink(P.inkR, .9, .8)), rect(90, 109, 4, 6, P.stone[2], 1), rect(106, 109, 4, 6, P.stone[2], 1), ell(94, 105, 6, 1.4, '#fff', .5));
  if (v === 'c') { t.add(line('M50 62V104M80 66V104', '#c9b08a', 1.4, .95), rect(48, 103, 36, 4, t.lg(wood, 90), 1.5, 1, ink(P.inkW, .9, .8))); }
  const n = v === 'b' ? 40 : 16; for (let i = 0; i < n; i++) t.add(ell(r.range(20, 112), r.range(v === 'b' ? 60 : 104, 124), 2.4, 1.1, r.pick(['#f6c6d4', '#fbdde6', '#fff']), .9, r.range(0, 180)));
  out(t, 'trees', 'blossom-lone', v, ['large', 'landmark', 'obstacle', 'sunny-meadows-landmark']);
}

// ============================ overlays ============================
for (const [v, s, n] of [['a', 381, 26], ['b', 382, 34]]) {   // petal drift for the blossom tree: 128x128, transparent, sits over the landmark
  const t = mk('overlays', 'petal-storm', v, 128, 128), r = rng(s);
  for (let i = 0; i < n; i++) { const u = i / n, x = 30 + u * 70 + r.range(-14, 14), y = 20 + (Math.sin(u * 5) * .5 + .5) * 80 + r.range(-8, 8), c = r.pick(['#f6c6d4', '#fbdde6', '#fff', '#f2b0c4']), a = r.range(0, 180);
    t.add(`<path d="M${f(x - 3)} ${f(y)}Q${f(x)} ${f(y - 2.6)} ${f(x + 3)} ${f(y)}Q${f(x)} ${f(y + 2)} ${f(x - 3)} ${f(y)}Z" fill="${c}" opacity=".92" transform="rotate(${f(a)} ${f(x)} ${f(y)})"/>`); }
  t.add(`<path d="M28 30C60 18 84 56 112 44" fill="none" stroke="#fbdde6" stroke-width="1" stroke-dasharray="1 5" opacity=".6"/>`);
  out(t, 'overlays', 'petal-storm', v, ['overlay', 'large', 'petals', 'sunny-meadows']);
}
for (const [v, s, n] of [['a', 391, 14], ['b', 392, 18]]) {   // pollen motes
  const t = mk('overlays', 'pollen-motes', v), r = rng(s);
  for (let i = 0; i < n; i++) { const x = r.range(5, 59), y = r.range(5, 59); t.add(circ(x, y, r.range(3, 5), t.rg(['#fff6c0', '#fff6c0', '#fff6c0'], .5, .5, .5, [.55, .2, 0])), circ(x, y, r.range(.7, 1.2), '#fffbe0', .95)); }
  out(t, 'overlays', 'pollen-motes', v, ['overlay', 'light', 'sunny-meadows']);
}
for (const [v, s] of [['a', 401], ['b', 402], ['c', 403]]) {   // cloud shadows drifting over the hills (soft dark blobs; stack 2-3)
  const t = mk('overlays', 'cloud-shadow', v, 128, 128), r = rng(s);
  for (let i = 0; i < 5; i++) { const x = r.range(36, 92), y = r.range(40, 88), rx = r.range(20, 34); t.add(ell(x, y, rx, rx * .62, '#2f4a3a', .05, r.range(-20, 20)), ell(x, y, rx * .75, rx * .45, '#2f4a3a', .05, r.range(-20, 20))); }
  out(t, 'overlays', 'cloud-shadow', v, ['overlay', 'large', 'shade', 'sunny-meadows']);
}
for (const [v, s] of [['a', 411], ['b', 412]]) {   // flying butterflies as an overlay (above props)
  const t = mk('overlays', 'butterflies-fly', v), r = rng(s);
  const cs = [['#f6d84a', '#e8a83a'], ['#6d8ede', '#a8b8f0'], ['#fbf4f8', '#f2b0c4'], ['#f08a4a', '#f6c06a']];
  for (let i = 0; i < 3; i++) { const [a, b] = r.pick(cs); t.add(butterfly(r.range(12, 52), r.range(14, 50), a, b, r.range(-40, 40), r.range(1, 1.4), false)); }
  out(t, 'overlays', 'butterflies-fly', v, ['overlay', 'critter', 'sunny-meadows']);
}
{ const t = mk('overlays', 'sun-glints', 'a'), r = rng(421); for (let i = 0; i < 7; i++) t.add(sparkle(r.range(8, 56), r.range(8, 56), r.range(.5, .9), '#fffbe0')); out(t, 'overlays', 'sun-glints', 'a', ['overlay', 'light', 'sunny-meadows']); }
