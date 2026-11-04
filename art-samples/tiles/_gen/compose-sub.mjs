// Sample-scene composer for the sub-area patches (inlined into the gallery like compose.mjs, so it must stay self-contained).
// composeSub(seed, has, which) -> { w, h, items:[{k,x,y,w,h}] }. which: 'meadows' | 'oakwood' | 'blend'.
// Step 5 adds which = 'marsh' | 'highlands' | 'ascent' (ruins and marsh climbing into the highlands) | 'overview' (16x24 strip through all eight sub-areas); keys 'fm:' firefly-marsh, 'mh:' misty-highlands.
// Keys: common tiles as in compose.mjs (e.g. 'ground/grass-a'); sub-area tiles with a prefix: 'sm:' sunny-meadows, 'oo:' old-oak-wood, 'bv:' bamboo-valley, 'ml:' mirror-lake.
// which also takes 'bamboo' | 'lake' | 'stream' (stream feeding the lake), and (step 4) 'rice' | 'ruins' | 'terraces' (lake to terraces to ruins); keys 'rt:' rice-terraces, 'mr:' mossy-ruins.
export function composeSub(seed, has, which = 'meadows') {
  let a = seed >>> 0;
  const R = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = (arr) => arr[Math.floor(R() * arr.length)];
  let COLS = 12, ROWS = 10; const S = 64;
  if (which === 'overview') { COLS = 16; ROWS = 24; }   // the Greenvale overview strip is 16x24 tiles
  const grid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const N = 1, NE = 2, E = 4, SE = 8, SS = 16, SW = 32, W = 64, NW = 128;
  const at = (g, x, y) => (x < 0 || y < 0 || x >= COLS || y >= ROWS) ? true : g[y][x];
  const mask = (g, x, y) => (at(g, x, y - 1) ? N : 0) | (at(g, x + 1, y - 1) ? NE : 0) | (at(g, x + 1, y) ? E : 0) | (at(g, x + 1, y + 1) ? SE : 0) | (at(g, x, y + 1) ? SS : 0) | (at(g, x - 1, y + 1) ? SW : 0) | (at(g, x - 1, y) ? W : 0) | (at(g, x - 1, y - 1) ? NW : 0);
  const canon = (m) => { let o = m; if (!(m & N && m & E)) o &= ~NE; if (!(m & SS && m & E)) o &= ~SE; if (!(m & SS && m & W)) o &= ~SW; if (!(m & N && m & W)) o &= ~NW; return o; };
  const p3 = (m) => String(m).padStart(3, '0');
  const ells = (g, cx, cy, rx, ry, noise = .2) => { for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy < 1 + (R() - .5) * noise * 2) g[y][x] = true; } return g; };
  const items = [], used = new Set(), props = [];
  const put = (k, x, y, w = S, h = S) => { if (has(k)) items.push({ k, x, y, w, h }); };
  const free = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS && !used.has(x + ',' + y);
  const claim = (x, y, w = 1, h = 1) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used.add((x + i) + ',' + (y + j)); };
  // add prop with its footprint cell (x,y): one = 1x1, tall = 64x128 (foot = bottom cell), large = 128x128 (foot = two cells at row y)
  const add = (k, x, y, kind = 'one') => {
    if (!has(k)) return false; const w = kind === 'large' ? 2 : 1;
    for (let i = 0; i < w; i++) if (!free(x + i, y) || (kind === 'large' && !free(x + i, y - 1))) return false;
    if (kind === 'large') claim(x, y - 1, 2, 2); else claim(x, y, 1, 1);
    if (kind === 'one') props.push({ k, x: x * S, y: y * S, w: S, h: S, s: y });
    else if (kind === 'tall') props.push({ k, x: x * S, y: (y - 1) * S, w: S, h: 2 * S, s: y });
    else props.push({ k, x: x * S, y: (y - 1) * S, w: 2 * S, h: 2 * S, s: y });
    return true;
  };
  const scatter = (keys, n, ok, kind = 'one') => { let c = 0, tries = 0; while (c < n && tries++ < 120) { const x = Math.floor(R() * COLS), y = Math.floor(R() * ROWS); if (ok(x, y) && add(pick(keys), x, y, kind)) c++; } };
  const sets = [];     // [grid, key prefix]
  const regionSet = (g, pre) => { sets.push([g, pre]); };
  const grassK = ['ground/grass-a', 'ground/grass-b', 'ground/grass-c', 'ground/grass-d'];
  const sm = (k) => 'sm:' + k, oo = (k) => 'oo:' + k, bv = (k) => 'bv:' + k, ml = (k) => 'ml:' + k;
  const alpha = (k, x, y, w = S, h = S) => put(k, x, y, w, h);
  const fenceMask = (fg, x, y) => (at2(fg, x, y - 1) ? 1 : 0) | (at2(fg, x + 1, y) ? 2 : 0) | (at2(fg, x, y + 1) ? 4 : 0) | (at2(fg, x - 1, y) ? 8 : 0);
  const at2 = (g, x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS && g[y][x];
  const over = [];     // overlays, drawn last

  if (which === 'meadows') {
    const wf = ells(grid(), 4.4, 2.2, 2.4, 1.5), bc = ells(grid(), 8.5, 1.2, 1.7, .9), lv = ells(grid(), 3.4, 8.4, 1.9, .9), field = grid(), pond = grid();
    for (let y = 6; y <= 8; y++) for (let x = 8; x <= 10; x++) field[y][x] = true;
    for (const [g] of [[bc], [lv]]) for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (wf[y][x] && g[y][x]) g[y][x] = false;
    const taken = (x, y) => wf[y][x] || bc[y][x] || lv[y][x] || field[y][x];
    const moods = ['blush', 'gold', 'lavender', 'poppy', 'cornflower', 'white', 'rainbow', 'sunset', 'tulip'];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (taken(x, y)) continue;
      const r = R(); const k = r < .12 ? sm('ground-detail/meadow-' + pick(moods) + '-' + pick(['a', 'b'])) : r < .5 ? sm('ground/meadow-' + pick(['hill', 'hill', 'lush', 'dew']) + '-' + pick(['a', 'b'])) : r < .56 ? sm('ground-detail/meadow-hay-a') : pick(grassK);
      put(has(k) ? k : pick(grassK), x * S, y * S);
    }
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { if (field[y][x]) { const row = ['cabbage', 'wheat', 'turnip'][y - 6]; put(sm('ground/field-rows-' + row + '-' + pick(['a', 'b'])), x * S, y * S); } }
    for (const [g, n] of [[wf, 'wildflower-patch'], [bc, 'buttercup-patch'], [lv, 'lavender-patch']]) for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (g[y][x]) put(sm('edges/' + n + '-' + p3(canon(mask(g, x, y)))), x * S, y * S);
    // fenced field with the farm gate (gate cells at the bottom row)
    const fg = grid(), x0 = 7, x1 = 11, y0 = 5, y1 = 9;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x === x0 || x === x1 || y === y0 || y === y1) fg[y][x] = true;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (fg[y][x] && !(y === y1 && (x === 9 || x === 10))) { const m = fenceMask(fg, x, y); claim(x, y); props.push({ k: sm('fences/' + (x === x0 || y === y0 ? 'fence-rail-' : 'fence-rail-') + String(m).padStart(2, '0')), x: x * S, y: y * S, w: S, h: S, s: y }); }
    claim(9, y1, 2, 1); props.push({ k: 'interest/gate-farm-closed', x: 9 * S, y: (y1 - 1) * S, w: 2 * S, h: 2 * S, s: y1 });
    for (let y = 6; y <= 8; y++) for (let x = 8; x <= 10; x++) claim(x, y);
    props.push({ k: sm('props/scarecrow-field-c'), x: 9 * S, y: 6 * S, w: S, h: 2 * S, s: 7 }); used.delete('9,7'); claim(9, 7);
    // landmarks
    add(sm('interest/windmill-' + pick(['a', 'b'])), 10, 3, 'large'); add(sm('interest/barn-a'), 0, 3, 'large'); add(sm('trees/blossom-lone-' + pick(['a', 'b', 'c'])), 5, 6, 'large');
    add(sm('interest/pond-lilies-' + pick(['a', 'b'])), 0, 8, 'large'); add(sm('props/hay-cart-a'), 2, 6, 'large') || add(sm('props/hay-cart-a'), 2, 5, 'large');
    add(sm('props/beehive-c'), 7, 4, 'tall'); add(sm('props/beehive-a'), 7, 3); add(sm('props/picnic-' + pick(['a', 'b'])), 4, 5); add(sm('props/haystack-a'), 6, 9); add(sm('props/hay-roll-b'), 11, 4); add(sm('props/water-trough-a'), 7, 9);
    add(sm('props/wheelbarrow-' + pick(['a', 'b'])), 4, 6); add(sm('props/milk-churns-a'), 6, 3); add(sm('props/birdhouse-post-a'), 3, 5, 'tall');
    scatter([sm('trees/orchard-tree-a'), sm('trees/orchard-tree-b'), sm('trees/orchard-tree-c'), sm('trees/oak-meadow-a'), sm('trees/oak-meadow-b'), sm('trees/sunflowers-a'), sm('trees/sunflowers-b')], 5, (x, y) => y >= 2 && !taken(x, y) && x < 7, 'tall');
    scatter([sm('trees/bush-flowering-a'), sm('trees/bush-flowering-b'), sm('trees/bush-flowering-c'), sm('rocks/boulder-flowered-a'), sm('rocks/boulder-flowered-b'), sm('grass/wildflower-clump-a'), sm('grass/wildflower-clump-b'), sm('grass/wildflower-clump-c'), sm('grass/lavender-bush-a')], 7, (x, y) => !field[y][x]);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!taken(x, y) && free(x, y) && R() < .1) put(sm('decals/' + pick(['butterflies-a', 'butterfly-b', 'bee-flower-a', 'bee-flower-b', 'clover-ring-a', 'molehill-a', 'dandelion-seeds-a', 'flower-carpet-c', 'flower-carpet-a'])), x * S, y * S);
    // low stone wall along the north edge
    for (let x = 2; x <= 6; x++) if (free(x, 0)) { const fgx = grid(); for (let q = 2; q <= 6; q++) fgx[0][q] = true; claim(x, 0); props.push({ k: sm('fences/wall-stone-low-' + String(fenceMask(fgx, x, 0)).padStart(2, '0')), x: x * S, y: 0, w: S, h: S, s: 0 }); }
    over.push([sm('overlays/petal-storm-' + pick(['a', 'b'])), 4 * S, 3 * S + 16, 2 * S, 2 * S], [sm('overlays/cloud-shadow-' + pick(['a', 'b', 'c'])), 0, 5 * S, 2 * S, 2 * S], [sm('overlays/cloud-shadow-' + pick(['a', 'b', 'c'])), 8 * S, 0, 2 * S, 2 * S]);
    for (let i = 0; i < 6; i++) over.push([sm('overlays/' + pick(['pollen-motes-a', 'pollen-motes-b', 'butterflies-fly-a', 'butterflies-fly-b', 'sun-glints-a'])), Math.floor(R() * COLS) * S, Math.floor(R() * ROWS) * S, S, S]);
  } else if (which === 'oakwood') {
    const open = ells(grid(), 6, 5.2, 4.4, 3.6, .3), forest = grid(), clear = ells(grid(), 3.4, 6.6, 1.6, 1.2, .1), stone = grid();
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) forest[y][x] = !open[y][x];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (clear[y][x] && forest[y][x]) clear[y][x] = false;
    const fl = ['ground/forest-floor-a', 'ground/forest-floor-b', 'ground/forest-floor-c'];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (forest[y][x] || clear[y][x]) continue;
      const r = R(), k = r < .22 ? oo('ground/floor-moss-' + pick(['a', 'b', 'c'])) : r < .32 ? oo('ground/floor-dark-' + pick(['a', 'b'])) : r < .4 ? oo('ground/floor-golden-' + pick(['a', 'b'])) : r < .62 ? oo('ground-detail/' + pick(['floor-roots-a', 'floor-roots-b', 'floor-roots-c', 'floor-leaf-litter-a', 'floor-leaf-litter-b', 'floor-ferns-a', 'floor-ferns-b', 'floor-acorns-a', 'floor-violets-a', 'floor-twigs-b', 'floor-stones-moss-a', 'floor-mushrooms-a'])) : pick(fl);
      put(k, x * S, y * S);
    }
    regionSet(forest, oo('edges/oak-grove-')); regionSet(clear, oo('edges/grass-clearing-'));
    for (const [g, pre] of sets) for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (g[y][x]) put(pre + p3(canon(mask(g, x, y))), x * S, y * S);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (forest[y][x] || clear[y][x]) claim(x, y);
    // landmarks
    const any = (k, cands, kind) => cands.some(([x, y]) => add(k, x, y, kind));
    add(oo('interest/gate-hollow-oak-closed'), 5, 3, 'large'); any(oo('interest/woodcutter-camp-b'), [[3, 8], [2, 8], [4, 8], [3, 7], [8, 8]], 'large'); any(oo('trees/root-arch-' + pick(['a', 'b'])), [[9, 8], [8, 8], [7, 8], [10, 8], [9, 7]], 'large');
    any(oo('interest/stone-circle-' + pick(['a', 'b'])), [[7, 6], [6, 6], [7, 5], [8, 6]], 'large'); any('interest/torii-unlit', [[4, 5], [3, 5], [4, 6]], 'large'); any(oo('trees/oak-sacred-' + pick(['a', 'b'])), [[9, 4], [10, 4], [9, 5]], 'large');
    add(oo('props/hokora-b'), 2, 4, 'tall'); add(oo('props/owl-perch-' + pick(['a', 'b'])), 7, 3, 'tall'); add(oo('rocks/shrine-stone-' + pick(['a', 'b', 'c'])), 10, 6, 'tall'); add(oo('props/chopping-block-a'), 5, 7); add(oo('props/log-stack-b'), 4, 7); add(oo('props/mushroom-glow-' + pick(['a', 'b', 'c'])), 6, 7); add('interest/chest-closed-a', 9, 6);
    scatter([oo('trees/oak-mature-a'), oo('trees/oak-mature-b'), oo('trees/oak-mature-c'), oo('trees/oak-young-a'), oo('trees/oak-autumn-a'), oo('trees/oak-hollow-b'), oo('trees/oak-dead-a'), oo('trees/oak-young-b')], 5, (x, y) => !forest[y][x] && y >= 2 && !clear[y][x], 'tall');
    scatter([oo('props/log-fallen-a'), oo('props/log-fallen-b'), oo('props/log-fallen-c'), oo('props/stump-mossy-a'), oo('props/stump-mossy-b'), oo('props/mushroom-cluster-a'), oo('props/mushroom-cluster-b'), oo('props/mushroom-cluster-c'), oo('props/spider-web-a'), oo('props/spider-web-b'), oo('grass/fern-clump-a'), oo('grass/fern-clump-b'), oo('grass/fern-clump-c'), oo('grass/fern-clump-d'), oo('grass/moss-mound-a'), oo('rocks/boulder-mossy-oak-a'), oo('rocks/boulder-mossy-oak-b'), oo('rocks/stone-cairn-a'), oo('props/stump-mossy-c')], 14, (x, y) => !forest[y][x]);
    scatter([oo('grass/fern-clump-a'), oo('grass/fern-clump-d'), oo('props/mushroom-glow-a')], 3, (x, y) => clear[y][x] === false && forest[y][x] === false && y > 6);
    scatter([oo('decals/leaf-pile-a'), oo('decals/web-dew-a'), oo('decals/root-web-b'), oo('decals/moss-carpet-a'), oo('decals/paw-prints-a'), oo('decals/fallen-branch-b')], 5, (x, y) => !forest[y][x] && !clear[y][x]);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!forest[y][x] && R() < .26) over.push([oo('overlays/dapple-oak-' + pick(['a', 'b', 'c'])), x * S, y * S, S, S]);
    over.push([oo('overlays/forest-mist-a'), 0, 5 * S, 2 * S, 2 * S], [oo('overlays/forest-mist-b'), 8 * S, 6 * S, 2 * S, 2 * S], [oo('overlays/light-shafts-a'), 6 * S, 1 * S, S, 2 * S], [oo('overlays/light-shafts-b'), 3 * S, 3 * S, S, 2 * S], [oo('overlays/spore-glow-a'), 6 * S, 6 * S, S, S], [oo('overlays/leaf-fall-a'), 9 * S, 3 * S, S, S], [oo('overlays/leaf-fall-b'), 2 * S, 4 * S, S, S]);
  } else if (which === 'blend') {   // blend: meadow on the left flows through floor-patch tongues and oaks into the wood on the right
    const noise = Array.from({ length: ROWS }, () => R());
    const patch = grid(), grove = grid(), line = grid(), flow = grid();
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const b = 4.4 + Math.sin(y * 1.3) * .9 + noise[y] * 1.1; patch[y][x] = x >= b; grove[y][x] = x >= b + 3.4 + Math.cos(y * .9) * .8 && y >= 1 && y <= 8; }
    ells(line, 1.6, 1.0, 1.7, 1.1, .2); for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (patch[y][x]) line[y][x] = false;
    ells(flow, 2.6, 7.4, 2.2, 1.5, .15); for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (patch[y][x] || line[y][x]) flow[y][x] = false;
    const mm = ['blush', 'gold', 'cornflower', 'white', 'rainbow'];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (line[y][x] || flow[y][x] || (patch[y][x] && !grove[y][x] && false)) continue;
      let k;
      if (!patch[y][x]) { const r = R(); const nearp = patch[y][x + 1] || patch[y][x + 2]; k = nearp && r < .7 ? oo('ground/grass-leafy-' + pick(['a', 'b', 'c'])) : r < .22 ? sm('ground-detail/meadow-' + pick(mm) + '-' + pick(['a', 'b'])) : r < .4 ? sm('ground/meadow-hill-' + pick(['a', 'b', 'c', 'd'])) : pick(grassK); }
      else if (grove[y][x]) k = pick(['ground/forest-floor-a', 'ground/forest-floor-b', 'ground/forest-floor-c']);
      else { const r = R(); const nearg = !patch[y][x - 1] || !patch[y][x - 2]; k = nearg && r < .6 ? oo('ground/floor-grassy-' + pick(['a', 'b', 'c'])) : r < .3 ? oo('ground-detail/' + pick(['floor-roots-a', 'floor-leaf-litter-a', 'floor-ferns-b', 'floor-acorns-b', 'floor-violets-b'])) : r < .5 ? oo('ground/floor-moss-' + pick(['a', 'b'])) : pick(['ground/forest-floor-a', 'ground/forest-floor-b']); }
      put(has(k) ? k : pick(grassK), x * S, y * S);
    }
    // the blended edge: forest-floor patch growing out of the grass, and the grove of oaks inside it; a clearing of meadow poking in
    const clr = ells(grid(), 8.6, 5.2, 1.3, 1.0, .1); for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!grove[y][x] || !patch[y][x]) clr[y][x] = false;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (clr[y][x]) grove[y][x] = false;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (patch[y][x] && !grove[y][x] && !clr[y][x]) { /* plain floor tiles already placed under the blob pieces */ }
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (patch[y][x] && !clr[y][x]) put(oo('edges/floor-patch-' + p3(canon(mask(patch, x, y)))), x * S, y * S);
      if (clr[y][x]) put(oo('edges/grass-clearing-' + p3(canon(mask(clr, x, y)))), x * S, y * S);
      if (line[y][x]) put(oo('edges/oak-forest-' + p3(canon(mask(line, x, y)))), x * S, y * S);
      if (flow[y][x]) put(sm('edges/wildflower-patch-' + p3(canon(mask(flow, x, y)))), x * S, y * S);
      if (grove[y][x]) put(oo('edges/oak-grove-' + p3(canon(mask(grove, x, y)))), x * S, y * S);
    }
    // patches claim cells where the stack would clash: floor-patch interior tiles under grove/clearing are drawn above, so redraw interior ground first where needed
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (grove[y][x] || line[y][x] || clr[y][x]) claim(x, y);
    const meadowSide = (x, y) => !patch[y][x] && !line[y][x] && !flow[y][x], woodSide = (x, y) => patch[y][x] && !grove[y][x] && !clr[y][x];
    add(sm('trees/blossom-lone-a'), 1, 4, 'large'); add(sm('props/picnic-a'), 3, 5); add(sm('props/beehive-a'), 2, 3); add(oo('trees/oak-sacred-a'), 6, 3, 'large') || add(oo('trees/oak-ancient-a'), 6, 3, 'large');
    scatter([oo('trees/oak-young-a'), oo('trees/oak-young-b'), oo('trees/oak-mature-a'), oo('trees/oak-mature-b'), oo('trees/oak-mature-c'), oo('trees/oak-autumn-a')], 5, (x, y) => woodSide(x, y) && x <= 8, 'tall');
    scatter([sm('trees/orchard-tree-c'), sm('trees/oak-meadow-a'), sm('trees/oak-meadow-c')], 3, (x, y) => meadowSide(x, y) && x >= 1 && x <= 3 && y >= 2, 'tall');
    scatter([oo('grass/fern-clump-a'), oo('grass/fern-clump-c'), oo('props/log-fallen-a'), oo('props/stump-mossy-a'), oo('props/mushroom-cluster-a'), oo('props/mushroom-cluster-c'), oo('rocks/boulder-mossy-oak-a'), oo('props/stump-mossy-c')], 8, (x, y) => woodSide(x, y));
    scatter([sm('grass/wildflower-clump-a'), sm('grass/wildflower-clump-b'), sm('grass/wildflower-clump-d'), sm('trees/bush-flowering-a'), sm('trees/bush-flowering-b'), sm('rocks/boulder-flowered-a'), sm('grass/lavender-bush-a')], 6, (x, y) => meadowSide(x, y));
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (free(x, y) && x >= 3 && x <= 6 && R() < .28) put(oo('decals/blend-fringe-' + pick(['a', 'b', 'c', 'd'])), x * S, y * S);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (free(x, y) && x <= 3 && R() < .08) put(sm('decals/' + pick(['butterflies-a', 'butterfly-c', 'bee-flower-a'])), x * S, y * S);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (patch[y][x] && R() < .24) over.push([oo('overlays/dapple-oak-' + pick(['a', 'b', 'c'])), x * S, y * S, S, S]);
    over.push([sm('overlays/butterflies-fly-a'), 1 * S, 2 * S, S, S], [sm('overlays/pollen-motes-b'), 2 * S, 6 * S, S, S], [oo('overlays/light-shafts-a'), 5 * S, 3 * S, S, 2 * S], [oo('overlays/light-shafts-b'), 7 * S, 5 * S, S, 2 * S], [oo('overlays/leaf-fall-a'), 6 * S, 5 * S, S, S], [oo('overlays/forest-mist-a'), 8 * S, 6 * S, 2 * S, 2 * S]);

  } else if (which === 'bamboo' || which === 'lake' || which === 'stream') {
    const any = (k, cands, kind) => cands.some(([x, y]) => add(k, x, y, kind));
    const sub = (a, b) => { for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (b[y][x]) a[y][x] = false; return a; };
    const all8 = (g, x, y) => [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]].every(([dx, dy]) => at(g, x + dx, y + dy));
    const ls = (n, k) => Array.from({ length: n }, (_, i) => String.fromCharCode(97 + i)).map(v => k + v);
    if (which === 'bamboo') {
      const band = grid(); for (let x = 0; x < COLS; x++) { const ya = x <= 4 ? 5 : x <= 8 ? 4 : 4; band[ya][x] = band[ya + 1][x] = true; if (x >= 9) band[ya + 2][x] = true; }
      const gA = sub(ells(grid(), 1.0, 1.8, 2.4, 2.6, .25), band), gB = sub(ells(grid(), 10.6, 8.6, 2.6, 2.0, .25), band), gC = sub(ells(grid(), 10.4, 0.8, 2.2, 1.5, .2), band);
      const grove = (x, y) => gA[y][x] || gB[y][x] || gC[y][x], near = (x, y) => [-1, 0, 1].some(dx => [-1, 0, 1].some(dy => x + dx >= 0 && y + dy >= 0 && x + dx < COLS && y + dy < ROWS && grove(x + dx, y + dy)));
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        if (grove(x, y) || band[y][x]) continue; const r = R();
        const k = r < .3 ? bv('ground/grass-bamboo-' + pick(['a', 'b', 'c'])) : r < .4 ? bv('ground-detail/' + pick(['bamboo-litter-a', 'bamboo-litter-b', 'bamboo-shoots-a', 'bamboo-shoots-c', 'sasa-grass-a', 'sasa-grass-b', 'moss-stones-a'])) : pick(grassK);
        put(has(k) ? k : pick(grassK), x * S, y * S);
      }
      for (const [g, nm] of [[gA, 'bamboo-grove'], [gB, 'bamboo-grove-golden'], [gC, 'bamboo-thicket']]) for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (g[y][x]) { put(bv('edges/' + nm + '-' + p3(canon(mask(g, x, y)))), x * S, y * S); claim(x, y); }
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (band[y][x]) {
        const m = canon(mask(band, x, y)); let k = bv('edges/stream-' + p3(m));
        if (m === 255) k = bv(pick(['ground/stream-water-a', 'ground/stream-water-c', 'ground/stream-stones-a', 'ground/stream-rapids-a', 'ground-detail/stream-koi-a', 'ground-detail/stream-koi-b', 'ground-detail/stream-leaves-a', 'ground-detail/stream-pebbles-a']));
        put(k, x * S, y * S);
      }
      // bridge, hut gate, waterfall, tea house
      const bx = 3; add(bv('props/bridge-plank-v-end-n-' + pick(['a', 'c'])), bx, 4); add(bv('props/bridge-plank-v-mid-a'), bx, 5); add(bv('props/bridge-plank-v-mid-a'), bx, 6); add(bv('props/bridge-plank-v-end-s-a'), bx, 7);
      add(bv('interest/hut-gate-' + pick(['closed', 'open'])), 6, 3, 'large'); add(bv('interest/waterfall-' + pick(['a', 'b'])), 0, 6, 'large');
      any(bv('interest/tea-house-' + pick(['a', 'b'])), [[8, 8], [7, 8], [6, 8], [5, 8]], 'large'); any(bv('interest/hut-thatched-' + pick(['a', 'b', 'c'])), [[9, 3], [8, 2], [4, 2]], 'large');
      add(bv('rocks/stepping-stones-a'), 7, 4); add(bv('rocks/stepping-stone-b'), 8, 4); add(bv('props/stone-lantern-d'), 2, 4, 'tall'); add(bv('props/stone-lantern-b'), 4, 8, 'tall'); add('interest/chest-closed-a', 9, 6);
      add(bv('props/shishi-odoshi-' + pick(['a', 'b'])), 5, 7); add(bv('props/bamboo-bench-a'), 6, 7); add(bv('props/tsukubai-a'), 4, 7); add(bv('props/well-bamboo-a'), 1, 7); add(bv('props/sign-bamboo-a'), 2, 3, 'tall'); add(bv('props/drying-rack-a'), 8, 3, 'tall');
      for (const x of [2, 3, 4]) if (free(x, 1)) { props.push({ k: bv('fences/fence-bamboo-' + String(fenceMask((() => { const g = grid(); for (let q = 2; q <= 4; q++) g[1][q] = true; return g; })(), x, 1)).padStart(2, '0')), x: x * S, y: S, w: S, h: S, s: 1 }); claim(x, 1); }
      scatter(ls(3, 'bv:trees/bamboo-green-').concat(ls(2, 'bv:trees/bamboo-golden-'), ['bv:trees/bamboo-black-a', 'bv:trees/bamboo-young-a', 'bv:trees/bamboo-slender-a', 'bv:trees/bamboo-mixed-a', 'bv:trees/plum-blossom-a', 'bv:trees/maple-valley-a', 'bv:trees/pine-twisted-a']), 7, (x, y) => !band[y][x] && !grove(x, y) && near(x, y) && y >= 1, 'tall');
      scatter(['bv:trees/bamboo-bush-a', 'bv:trees/bamboo-bush-b', 'bv:grass/bamboo-shoots-a', 'bv:grass/bamboo-shoots-b', 'bv:grass/sasa-clump-a', 'bv:grass/sasa-clump-b', 'bv:grass/sasa-clump-c', 'bv:props/bamboo-pile-a', 'bv:props/bamboo-basket-a', 'bv:rocks/boulder-bamboo-a', 'bv:rocks/boulder-bamboo-b', 'bv:props/bamboo-basket-b'], 8, (x, y) => !band[y][x] && !grove(x, y));
      scatter(['bv:rocks/stream-rock-a', 'bv:rocks/stream-rock-b', 'bv:rocks/stream-rock-c', 'bv:rocks/stream-rock-d', 'bv:props/fish-trap-a', 'bv:grass/iris-bank-a'], 5, (x, y) => band[y][x] && mask(band, x, y) !== 0 && x >= 5 && (x < 7 || x > 8));
      scatter(['bv:grass/iris-bank-a', 'bv:grass/iris-bank-b', 'grass/reeds-a', 'grass/reeds-b'], 4, (x, y) => !band[y][x] && !grove(x, y) && (band[y - 1] && band[y - 1][x] || band[y + 1] && band[y + 1][x]));
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!grove(x, y) && free(x, y) && R() < .22) put(band[y][x] ? bv('decals/' + pick(['koi-a', 'koi-b', 'koi-c', 'koi-d', 'ripple-rings-a', 'ripple-rings-b', 'floating-leaves-a', 'foam-line-a'])) : bv('decals/' + pick(['leaf-fall-a', 'leaf-fall-b', 'leaf-fall-c', 'leaf-fall-d', 'shoots-a', 'shoots-b', 'fallen-culm-a', 'pebbles-bank-a'])), x * S, y * S);
      over.push([bv('overlays/valley-mist-a'), 0, 3 * S, 2 * S, 2 * S], [bv('overlays/valley-mist-b'), 8 * S, 6 * S, 2 * S, 2 * S], [bv('overlays/valley-mist-c'), 4 * S, 0, 2 * S, 2 * S], [bv('overlays/light-shafts-a'), 2 * S, 2 * S, S, 2 * S], [bv('overlays/light-shafts-b'), 9 * S, 1 * S, S, 2 * S]);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { if (grove(x, y) && R() < .2) over.push([bv('overlays/sway-shadow-' + pick(['a', 'b', 'c'])), x * S, y * S, S, S]); else if (band[y][x] && R() < .3) over.push([bv('overlays/water-glint-' + pick(['a', 'b'])), x * S, y * S, S, S]); else if (R() < .06) over.push([bv('overlays/leaf-drift-' + pick(['a', 'b'])), x * S, y * S, S, S]); }
    } else if (which === 'lake') {
      const lake = ells(grid(), 4.4, 6.0, 5.0, 3.7, .3), deep = ells(grid(), 3.6, 6.4, 2.9, 2.1, .1), lily = ells(grid(), 7.2, 8.3, 1.8, 1.0, .1), isle = grid(), beach = grid(), jet = grid();
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { if (!lake[y][x]) deep[y][x] = lily[y][x] = false; }
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (deep[y][x] && !all8(lake, x, y)) deep[y][x] = false;
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (lily[y][x] && (deep[y][x] || !all8(lake, x, y))) lily[y][x] = false;
      isle[8][1] = isle[8][2] = true; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (isle[y][x] && !(lake[y][x] && all8(lake, x, y))) isle[y][x] = false;
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!lake[y][x] && [[1, 0], [0, 1], [-1, 0], [0, -1]].some(([dx, dy]) => at2(lake, x + dx, y + dy)) && (x >= 6 || y >= 8) && !(y === 5 && x >= 9 && x <= 10) && y >= 4) beach[y][x] = true;
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (beach[y][x] && lake[y][x]) beach[y][x] = false;
      for (let x = 6; x <= 9; x++) jet[5][x] = true;
      const lakeAt = (x, y) => lake[y][x];
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        if (lake[y][x]) continue; const r = R();
        const k = r < .5 ? ml('ground/grass-lakeside-' + pick(['a', 'b', 'c'])) : pick(grassK);
        put(has(k) ? k : pick(grassK), x * S, y * S);
      }
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (beach[y][x]) put(ml('edges/lake-beach-' + p3(canon(mask(beach, x, y)))), x * S, y * S);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (lake[y][x]) {
        const m = canon(mask(lake, x, y)); let k = ml('edges/lake-shore-pebble-' + p3(m));
        if (m === 255) k = deep[y][x] ? (R() < .55 ? ml('edges/lake-deep-mirror-255') : ml('ground/lake-deep-' + pick(['a', 'b', 'c', 'd']))) : lily[y][x] ? ml('edges/lily-bed-255') : ml(R() < .62 ? 'ground/lake-shallow-' + pick(['a', 'b', 'c', 'd']) : 'ground-detail/' + pick(['lake-lilies-a', 'lake-lilies-b', 'lake-petals-a', 'lake-shoal-a', 'lake-fish-a', 'lake-duckweed-b', 'lake-lotus-a']));
        put(k, x * S, y * S);
      }
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { if (deep[y][x] && !all8(deep, x, y)) put(ml('edges/lake-deep-mirror-' + p3(canon(mask(deep, x, y)))), x * S, y * S); if (isle[y][x]) put(ml('edges/lake-island-' + p3(canon(mask(isle, x, y)))), x * S, y * S); if (lily[y][x] && !all8(lily, x, y)) put(ml('edges/lily-bed-' + p3(canon(mask(lily, x, y)))), x * S, y * S); }
      const jg = grid(); for (let x = 6; x <= 10; x++) jg[5][x] = true;
      for (let x = 6; x <= 9; x++) props.push({ k: ml('fences/jetty-' + (x === 6 ? 'old' : 'wood') + '-' + String(fenceMask(jg, x, 5)).padStart(2, '0')), x: x * S, y: 5 * S, w: S, h: S, s: 4.5 });
      add('interest/chest-closed-a', 6, 5); add(ml('props/mooring-post-b'), 8, 6); add(ml('props/jetty-lantern-' + pick(['a', 'b'])), 9, 5, 'tall');
      any(ml('interest/torii-lake-' + pick(['a', 'a', 'c'])), [[2, 6], [3, 6], [1, 6]], 'large'); any(ml('interest/boathouse-gate-' + pick(['closed', 'open'])), [[8, 2], [9, 2], [7, 2]], 'large'); any(ml('interest/shrine-islet-a'), [[1, 3], [0, 3]], 'large');
      add(ml('props/rowboat-' + pick(['a', 'b', 'd'])), 5, 7); add(ml('props/rowboat-c'), 6, 8); add(ml('props/net-float-a'), 8, 7); add(ml('props/heron-a'), 4, 3); add(ml('props/heron-d'), 3, 8); add(ml('props/mandarin-ducks-b'), 4, 9); add(ml('props/buoy-a'), 1, 7); add(ml('props/lantern-float-a'), 5, 9);
      add(ml('props/net-drying-a'), 10, 7, 'tall'); add(ml('props/fish-creel-a'), 9, 8); add(ml('props/rod-rest-a'), 10, 4); add(ml('props/kingfisher-post-a'), 7, 3);
      scatter(['ml:trees/willow-weeping-a', 'ml:trees/willow-weeping-b', 'ml:trees/willow-young-a', 'ml:trees/oak-lakeside-a', 'ml:trees/oak-lakeside-b', 'ml:trees/willow-weeping-c'], 5, (x, y) => !lakeAt(x, y) && x >= 6 && y <= 4 || x >= 10, 'tall');
      scatter(['ml:grass/reed-lake-a', 'ml:grass/reed-lake-b', 'ml:grass/reed-lake-c', 'ml:grass/cattail-lake-a', 'ml:grass/cattail-lake-b', 'ml:grass/rushes-a', 'ml:grass/rushes-b'], 7, (x, y) => !lakeAt(x, y) && [[1, 0], [0, 1], [-1, 0], [0, -1]].some(([dx, dy]) => at2(lake, x + dx, y + dy)));
      scatter(['ml:grass/lily-pads-a', 'ml:grass/lily-pads-b', 'ml:grass/lily-pads-c', 'ml:grass/lily-pads-d', 'ml:grass/lily-pads-e', 'ml:grass/lotus-bloom-a', 'ml:grass/lotus-bloom-c', 'ml:grass/lotus-bud-a', 'ml:grass/lotus-leaf-a', 'ml:grass/lotus-leaf-c', 'ml:grass/lotus-seedpod-a', 'ml:grass/lily-pads-f'], 8, (x, y) => lily[y][x] || (lake[y][x] && !deep[y][x] && all8(lake, x, y) && x >= 5));
      scatter(['ml:rocks/lake-rock-a', 'ml:rocks/lake-rock-b', 'ml:rocks/shallows-stone-a', 'ml:rocks/shallows-stone-b', 'ml:rocks/islet-a', 'ml:rocks/islet-c', 'ml:rocks/turtle-rock-a', 'ml:rocks/sandbar-b'], 5, (x, y) => lake[y][x] && !deep[y][x] && !isle[y][x]);
      scatter(['ml:trees/bush-hydrangea-a', 'ml:trees/bush-hydrangea-b', 'ml:rocks/shore-boulder-a', 'ml:rocks/shore-boulder-c', 'ml:props/tea-stool-parasol-a'.replace('ml:props', 'bv:props')], 5, (x, y) => !lakeAt(x, y) && y >= 4 && x >= 6);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (free(x, y) && R() < .25) { if (lake[y][x]) put(ml('decals/' + pick(['ripple-rings-a', 'ripple-rings-b', 'fish-shadow-a', 'fish-shadow-b', 'petals-float-a', 'duckweed-film-a', 'boat-wake-a'])), x * S, y * S); else put(ml('decals/' + pick(['driftwood-a', 'shells-a', 'shells-b', 'foam-lap-a'])), x * S, y * S); }
      over.push([ml('overlays/water-mist-' + pick(['a', 'b', 'c'])), 0, 7 * S, 2 * S, 2 * S], [ml('overlays/cloud-reflection-a'), 3 * S, 4 * S, 2 * S, 2 * S], [ml('overlays/cloud-reflection-b'), 5 * S, 7 * S, 2 * S, 2 * S], [ml('overlays/heron-flight-a'), 4 * S, 1 * S, 2 * S, 2 * S], [ml('overlays/water-mist-b'), 9 * S, 0, 2 * S, 2 * S]);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (lake[y][x]) { const r = R(); if (r < .22) over.push([ml('overlays/sun-glitter-' + pick(['a', 'b'])), x * S, y * S, S, S]); else if (r < .3) over.push([ml('overlays/sparkle-evening-' + pick(['a', 'b', 'c'])), x * S, y * S, S, S]); else if (r < .36) over.push([ml('overlays/dragonflies-' + pick(['a', 'b'])), x * S, y * S, S, S]); }
    } else {   // stream feeding the lake: bamboo grove and plank bridge on the left, hut gate at the mouth, lake on the right
      const lake = ells(grid(), 9.4, 5.2, 3.0, 3.6, .25), band = grid(), mouthX = 5;
      for (let x = 0; x <= mouthX + 1; x++) { band[4][x] = band[5][x] = true; }
      const U = grid(); for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) U[y][x] = lake[y][x] || band[y][x];
      const gA = sub(ells(grid(), 1.2, 1.2, 3.4, 1.9, .2), U), gB = sub(ells(grid(), 2.0, 8.6, 3.6, 1.9, .2), U), gC = sub(ells(grid(), 6.4, 0.6, 2.2, 1.0, .2), U);
      const grove = (x, y) => gA[y][x] || gB[y][x] || gC[y][x];
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        if (U[y][x] || grove(x, y)) continue; const r = R(), tr = x >= 5 && x <= 7;   // bamboo litter fades into lakeside grass towards the east
        const k = x <= 4 ? (r < .35 ? bv('ground/grass-bamboo-' + pick(['a', 'b', 'c'])) : r < .5 ? bv('ground-detail/' + pick(['bamboo-litter-a', 'bamboo-shoots-b', 'sasa-grass-a'])) : pick(grassK)) : tr ? (r < .3 ? bv('ground/grass-bamboo-' + pick(['a', 'b'])) : r < .55 ? ml('ground/grass-lakeside-' + pick(['a', 'b'])) : pick(grassK)) : (r < .6 ? ml('ground/grass-lakeside-' + pick(['a', 'b', 'c'])) : pick(grassK));
        put(has(k) ? k : pick(grassK), x * S, y * S);
      }
      for (const [g, nm] of [[gA, 'bamboo-grove'], [gB, 'bamboo-grove-golden'], [gC, 'bamboo-thicket']]) for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (g[y][x]) { put(bv('edges/' + nm + '-' + p3(canon(mask(g, x, y)))), x * S, y * S); claim(x, y); }
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (U[y][x]) {
        const m = canon(mask(U, x, y)); let k;
        if (band[y][x] && x < mouthX) k = bv('edges/stream-' + p3(m)); else if (band[y][x] && x === mouthX) k = bv('edges/stream-mouth-' + p3(m)); else k = ml('edges/lake-shore-pebble-' + p3(m));
        if (m === 255 && !band[y][x]) k = R() < .6 ? ml('ground/lake-shallow-' + pick(['a', 'b', 'c', 'd'])) : ml('ground-detail/' + pick(['lake-lilies-a', 'lake-petals-a', 'lake-shoal-a', 'lake-fish-a', 'lake-lilies-c']));
        put(k, x * S, y * S);
      }
      [['end-n', 3], ['mid', 4], ['mid', 5], ['end-s', 6]].forEach(([part, y]) => props.push({ k: bv('props/bridge-plank-v-' + part + '-a'), x: 3 * S, y: y * S, w: S, h: S, s: y }));
      add(bv('interest/hut-gate-open'), 5, 3, 'large'); add(bv('interest/waterfall-a'), 0, 5, 'large'); add(bv('props/stone-lantern-d'), 2, 3, 'tall'); add(bv('props/stone-lantern-b'), 7, 3, 'tall'); claim(3, 3); add(bv('props/shishi-odoshi-b'), 4, 7); add(bv('props/bamboo-bench-b'), 5, 7);
      add(ml('props/rowboat-a'), 9, 5); add(ml('props/heron-a'), 10, 7); add(ml('props/mooring-post-a'), 8, 7); add(ml('trees/willow-weeping-a'.replace(/^/, '')), 10, 2, 'tall'); add(ml('interest/torii-lake-a'), 10, 8, 'large');
      scatter(['bv:trees/bamboo-green-a', 'bv:trees/bamboo-golden-a', 'bv:trees/bamboo-young-b', 'bv:trees/bamboo-slender-a', 'bv:trees/bamboo-green-c', 'bv:trees/bamboo-mixed-a'], 6, (x, y) => !U[y][x] && !grove(x, y) && x <= 6 && y >= 1 && (y <= 3 || y >= 6), 'tall');
      scatter(['ml:grass/reed-lake-a', 'ml:grass/cattail-lake-a', 'ml:grass/reed-lake-c', 'bv:grass/iris-bank-a', 'bv:grass/iris-bank-b', 'ml:grass/rushes-a', 'ml:grass/lily-pads-a', 'ml:grass/lily-pads-c', 'ml:grass/lotus-bloom-a'], 7, (x, y) => (U[y][x] && x >= 6 && all8(U, x, y)) || (!U[y][x] && !grove(x, y) && [[1, 0], [0, 1], [-1, 0], [0, -1]].some(([dx, dy]) => at2(U, x + dx, y + dy))));
      scatter(['bv:rocks/stream-rock-a', 'bv:rocks/stream-rock-c', 'bv:rocks/stepping-stone-a', 'bv:rocks/stepping-stones-b', 'ml:rocks/shallows-stone-a'], 3, (x, y) => band[y][x] && x >= 1 && x <= 5 && !used.has(x + ',' + y));
      scatter(['ml:trees/willow-young-a', 'ml:trees/bush-hydrangea-a', 'ml:rocks/shore-boulder-a', 'bv:rocks/boulder-bamboo-a', 'ml:grass/reed-lake-b'], 5, (x, y) => !U[y][x] && !grove(x, y) && x >= 5);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (free(x, y) && R() < .2 && !grove(x, y)) put(U[y][x] ? (x <= 6 ? bv('decals/' + pick(['koi-a', 'koi-c', 'floating-leaves-b', 'ripple-rings-c'])) : ml('decals/' + pick(['ripple-rings-a', 'fish-shadow-a', 'petals-float-b', 'boat-wake-b']))) : bv('decals/' + pick(['leaf-fall-a', 'leaf-fall-c', 'shoots-a', 'pebbles-bank-b'])), x * S, y * S);
      over.push([bv('overlays/valley-mist-a'), 0, 5 * S, 2 * S, 2 * S], [bv('overlays/valley-mist-c'), 3 * S, 0, 2 * S, 2 * S], [ml('overlays/water-mist-a'), 7 * S, 6 * S, 2 * S, 2 * S], [ml('overlays/cloud-reflection-a'), 9 * S, 2 * S, 2 * S, 2 * S], [bv('overlays/light-shafts-a'), 1 * S, 1 * S, S, 2 * S], [ml('overlays/heron-flight-a'), 7 * S, 1 * S, 2 * S, 2 * S]);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (U[y][x] && R() < .25) over.push([x <= 5 ? bv('overlays/water-glint-' + pick(['a', 'b'])) : ml('overlays/' + pick(['sun-glitter-a', 'sparkle-evening-a', 'dragonflies-a'])), x * S, y * S, S, S]); else if (grove(x, y) && R() < .2) over.push([bv('overlays/sway-shadow-' + pick(['a', 'b', 'c'])), x * S, y * S, S, S]);
    }
  }
  if (which === 'rice' || which === 'ruins' || which === 'terraces') {   // step 4: Rice Terraces, Mossy Ruins, and the lake -> terraces -> ruins blend
    const rt = (k) => 'rt:' + k, mr = (k) => 'mr:' + k, VR = ['a', 'b', 'c', 'd'];
    const box = (x0, y0, x1, y1) => { const g = grid(); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && y >= 0 && x < COLS && y < ROWS) g[y][x] = true; return g; };
    const inG = (g, x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS && g[y][x];
    const band = (g, pre, nm, x, y) => put(pre('edges/' + nm + '-' + p3(canon(mask(g, x, y)))), x * S, y * S);
    const ring4 = (g, x, y) => [[1, 0], [0, 1], [-1, 0], [0, -1]].some(([dx, dy]) => inG(g, x + dx, y + dy));
    const ids = (keys, x, y, kind) => keys.some((k) => add(k, x, y, kind));
    const wallPiece = (g, nm, x, y) => put(mr('fences/' + nm + '-' + String(fenceMask(g, x, y)).padStart(2, '0')), x * S, y * S);
    const lineProp = (g, pre, nm, x, y, sy = y) => { props.push({ k: pre('fences/' + nm + '-' + String(fenceMask(g, x, y)).padStart(2, '0')), x: x * S, y: y * S, w: S, h: S, s: sy }); claim(x, y); };
    const mossG = ['mr:ground/moss-grass-a', 'mr:ground/moss-grass-b', 'mr:ground/moss-grass-c', 'mr:ground/moss-thick-a'];
    if (which === 'rice') {
      const D = box(0, 0, 2, 2), A = box(4, 0, 11, 1), B = box(0, 3, 8, 4), ch = box(3, 2, 7, 2), fl = box(8, 2, 10, 3); fl[2][10] = fl[3][10] = true; fl[3][8] = fl[3][9] = false;
      const chfl = grid(); for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) chfl[y][x] = ch[y][x] || fl[y][x];
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        if (D[y][x] || A[y][x] || B[y][x]) continue; const r = R();
        put(r < .4 ? rt('ground/terrace-grass-' + pick(['a', 'a', 'b', 'c'])) : r < .5 ? rt('ground/bank-weeds-' + pick(['a', 'b'])) : pick(grassK), x * S, y * S);
      }
      for (const [g, nm, st] of [[D, 'terrace-stone', ''], [A, 'terrace-paddy-ripe', 'ripe'], [B, 'terrace-paddy-young', 'young']]) for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (g[y][x]) {
        const m = canon(mask(g, x, y)); if (m === 255 && st && R() < .4) put(rt('ground/paddy-' + st + '-' + pick(VR)), x * S, y * S); else band(g, rt, nm, x, y);
      }
      for (let x = 3; x <= 7; x++) lineProp(chfl, rt, 'channel-water', x, 2, 1.5);
      for (const [x, y] of [[8, 2], [9, 2], [10, 2], [10, 3]]) lineProp(chfl, rt, 'channel-flume', x, y, y + .5);
      add(rt('props/sluice-gate-' + pick(['a', 'b'])), 5, 2); add(rt('interest/waterwheel-' + pick(['a', 'b', 'c', 'd'])), 9, 5, 'large');
      add(rt('trees/persimmon-a'), 0, 1, 'tall'); add(rt('props/field-shrine-b'), 2, 1); add(rt('props/fox-statue-a'), 1, 2); add(rt('trees/persimmon-b'), 5, 7, 'tall');
      add(rt('interest/farmhouse-a'), 2, 8, 'large'); add(rt('interest/kura-gate-closed'), 7, 8, 'large'); add(rt('interest/rack-wide-a'), 9, 7, 'large') || add(rt('props/drying-rack-a'), 9, 7);
      add(rt('props/straw-stack-a'), 4, 8); add(rt('props/tawara-a'), 5, 9); add(rt('props/harvest-basket-a'), 1, 9); add(rt('props/scarecrow-kakashi-' + pick(['a', 'b', 'c'])), 6, 1, 'tall'); add(rt('props/scarecrow-kakashi-b'), 2, 4, 'tall');
      add(rt('props/ducks-paddy-' + pick(['a', 'b', 'c'])), 4, 3); add(rt('props/egret-paddy-a'), 6, 3); add(rt('props/frog-paddy-a'), 1, 3);
      add(rt('interest/inari-torii-row-a'), 10, 9, 'large'); add(rt('props/straw-stack-d'), 8, 9); add(rt('props/plank-bridge-h'), 0, 2) ;
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (free(x, y) && R() < .3) { if (A[y][x] || B[y][x]) put(rt('decals/' + pick(['farmer-hat-a', 'farmer-hat-b', 'farmer-hat-c', 'farmer-hat-d', 'paddy-ripples-a', 'paddy-ripples-b', 'rice-lodged-a', 'seedling-bundles-a'])), x * S, y * S); else if (!chfl[y][x]) put(rt('decals/' + pick(['straw-scatter-a', 'footprints-mud-a', 'straw-scatter-b'])), x * S, y * S); }
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (A[y][x] && y === 1 && R() < .5) put(rt('decals/water-spill-' + pick(['a', 'b'])), x * S, (y + 1) * S);
      over.push([rt('overlays/terrace-mist-a'), 0, 4 * S, 2 * S, 2 * S], [rt('overlays/terrace-mist-b'), 8 * S, 0, 2 * S, 2 * S], [rt('overlays/sparrows-a'), 3 * S, 0, 2 * S, 2 * S], [rt('overlays/dragonflies-red-a'), 5 * S, 4 * S, S, S], [rt('overlays/harvest-motes-a'), 8 * S, 6 * S, S, S], [rt('overlays/harvest-motes-b'), 3 * S, 6 * S, S, S]);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if ((A[y][x] || B[y][x]) && R() < .22) over.push([rt('overlays/paddy-glint-' + pick(['a', 'b'])), x * S, y * S, S, S]);
    } else if (which === 'ruins') {
      const pav = ells(grid(), 5.2, 5.4, 3.0, 2.3, .18), pool = box(9, 6, 10, 7), wl = grid(), path4 = box(5, 3, 5, 7);
      for (let x = 1; x <= 10; x++) if (x < 5 || x > 6) wl[2][x] = true; for (let y = 3; y <= 6; y++) { wl[y][1] = true; if (y <= 4) wl[y][10] = true; } wl[7][1] = false;
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { if (pool[y][x]) continue; const r = R(); put(pav[y][x] ? mr('ground/flagstone-' + pick(['mossy', 'mossy', 'cracked', 'wet', 'broken']) + '-' + pick(['a', 'b', 'c'])) : r < .5 ? pick(mossG) : r < .6 ? mr('ground-detail/' + pick(['moss-stones-a', 'ruin-leaves-a', 'ruin-fern-a', 'ruin-leaves-b', 'moss-stones-b'])) : pick(grassK), x * S, y * S); }
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { if (pav[y][x] && canon(mask(pav, x, y)) !== 255) band(pav, mr, 'ruin-paving', x, y); if (pool[y][x]) band(pool, mr, 'ruin-pool', x, y); }
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (wl[y][x]) lineProp(wl, mr, pick(['wall-ruined', 'wall-ruined', 'wall-ruined-ivy', 'wall-ruined-low']), x, y);
      for (let y = 3; y <= 7; y++) lineProp(path4, mr, 'path-flagstone', 5, y, y - .6);
      add(mr('interest/gate-ruin-arch-' + pick(['closed', 'open'])), 5, 2, 'large'); add(mr('interest/torii-ruin-' + pick(['a', 'b', 'c'])), 5, 9, 'large'); add(mr('props/komainu-mossy-a'), 4, 4); add(mr('props/komainu-mossy-b'), 6, 4);
      add(mr('props/ruin-lantern-b'), 4, 7, 'tall'); add(mr('props/ruin-lantern-d'), 6, 7, 'tall'); add(mr('props/ruin-lantern-a'), 3, 5, 'tall'); add(mr('props/jizo-mossy-' + pick(['a', 'c'])), 8, 4, 'tall'); add(mr('props/jizo-mossy-d'), 2, 7, 'tall');
      add(mr('props/pillar-standing-' + pick(['a', 'b', 'd'])), 2, 4, 'tall'); add(mr('props/pillar-standing-c'), 9, 4, 'tall'); add(mr('props/pillar-toppled-a'), 8, 8); add(mr('props/gorinto-a'), 0, 5, 'tall'); add(mr('props/stele-a'), 11, 5, 'tall'); add(mr('props/stone-basin-a'), 3, 3); add(mr('props/brazier-b'), 7, 3);
      add(mr('props/stairs-overgrown-' + pick(['a', 'b', 'c'])), 8, 6); add(mr('props/offering-box-a'), 7, 6); add(mr('props/well-ruin-a'), 1, 8); add(mr('props/statue-fallen-a'), 3, 8); add(mr('props/grave-marker-a'), 10, 8); add(mr('props/lantern-toppled-a'), 2, 9);
      scatter(['trees/cedar-a', 'trees/cedar-b', 'trees/pine-a', 'trees/pine-b', 'mr:trees/maple-shrine-a', 'mr:trees/snag-ivy-a', 'mr:trees/snag-ivy-b'], 7, (x, y) => y <= 1 || (x >= 11 && y >= 6) || (x <= 0 && y >= 7), 'tall');
      scatter(['mr:rocks/rubble-pile-a', 'mr:rocks/rubble-pile-b', 'mr:rocks/rubble-pile-c', 'mr:rocks/boulder-ruin-a', 'mr:rocks/wall-chunk-a', 'mr:rocks/wall-chunk-b', 'mr:grass/moss-clump-a', 'mr:grass/moss-clump-b', 'mr:grass/fern-clump-a', 'mr:grass/fern-clump-b', 'mr:grass/ivy-bush-a', 'mr:grass/mushrooms-ruin-a', 'mr:props/pillar-base-a', 'mr:props/grave-marker-b'], 11, (x, y) => !pool[y][x] && !wl[y][x]);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (free(x, y) && R() < .34) put(pool[y][x] ? mr('decals/puddle-' + pick(VR)) : mr('decals/' + pick(['moss-patch-a', 'moss-patch-b', 'crack-paving-a', 'crack-paving-c', 'puddle-a', 'puddle-b', 'ivy-ground-a', 'ivy-ground-b', 'rubble-scatter-a', 'fallen-leaves-a', 'fallen-leaves-c', 'tile-shards-a', 'glyph-faded-a', 'moss-chunks-a'])), x * S, y * S);
      over.push([mr('overlays/ruin-mist-a'), 0, 4 * S, 2 * S, 2 * S], [mr('overlays/ruin-mist-b'), 8 * S, 6 * S, 2 * S, 2 * S], [mr('overlays/ruin-mist-c'), 4 * S, 7 * S, 2 * S, 2 * S], [mr('overlays/light-shafts-ruin-a'), 3 * S, 2 * S, S, 2 * S], [mr('overlays/light-shafts-ruin-b'), 8 * S, 2 * S, S, 2 * S]);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { if (wl[y][x] && R() < .35) over.push([mr('overlays/ivy-hang-' + pick(['a', 'b', 'c'])), x * S, (y - 1) * S + 12, S, S]); else if (R() < .12) over.push([mr('overlays/wisp-glow-' + pick(VR)), x * S, y * S, S, S]); else if (R() < .05) over.push([mr('overlays/spirit-motes-' + pick(['a', 'b'])), x * S, y * S, S, S]); }
    } else {   // lake -> earth banks -> paddy terraces -> mossy stone terraces -> paved shrine platform
      const lake = ells(grid(), 1.3, 7.4, 2.3, 2.6, .25), E = box(7, 0, 11, 2), D = box(6, 3, 11, 4), C = box(4, 5, 10, 6), B = box(3, 7, 11, 8), flat = box(3, 9, 11, 9);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (lake[y][x] && (x >= 3 || E[y][x] || D[y][x] || C[y][x] || B[y][x])) lake[y][x] = false;
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        if (lake[y][x] || E[y][x] || D[y][x] || C[y][x] || B[y][x] || flat[y][x]) continue; const r = R();
        put(x <= 5 && y <= 4 ? (r < .6 ? pick(mossG) : mr('ground-detail/' + pick(['moss-stones-a', 'ruin-leaves-a', 'ruin-fern-a']))) : r < .35 ? rt('ground/terrace-grass-' + pick(['a', 'b', 'c'])) : r < .5 ? rt('ground/bank-weeds-' + pick(['a', 'b'])) : pick(grassK), x * S, y * S);
      }
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (flat[y][x]) put(rt('ground/paddy-young-' + pick(VR)), x * S, y * S);
      for (const [g, pre, nm, ground] of [[E, mr, 'platform-paved', mr('ground/flagstone-mossy-')], [D, mr, 'terrace-mossy', mr('ground/moss-grass-')], [C, rt, 'terrace-stone', ''], [B, rt, 'terrace-paddy-ripe', rt('ground/paddy-ripe-')]]) for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (g[y][x]) {
        const m = canon(mask(g, x, y)); if (m === 255 && ground && R() < .45) put(ground + pick(VR.slice(0, nm === 'terrace-mossy' ? 3 : 4)), x * S, y * S); else band(g, pre, nm, x, y);
      }
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (lake[y][x]) {
        const m = canon(mask(lake, x, y)), earth = x >= 2 || y <= 7;
        if (m === 255) put(R() < .5 ? 'ml:ground/lake-shallow-' + pick(VR) : 'ml:ground-detail/' + pick(['lake-lilies-a', 'lake-petals-a', 'lake-fish-a', 'lake-shoal-a']), x * S, y * S); else put(earth ? rt('edges/lake-bank-earth-' + p3(m)) : 'ml:edges/lake-shore-pebble-' + p3(m), x * S, y * S);
      }
      add(mr('interest/shrine-collapsed-a'), 9, 1, 'large'); add(mr('props/stairs-overgrown-a'), 8, 2); add(mr('props/stairs-overgrown-b'), 9, 4); add(mr('props/stairs-overgrown-c'), 6, 6);
      add(mr('props/ruin-lantern-b'), 7, 1, 'tall'); add(mr('props/ruin-lantern-d'), 11, 1, 'tall'); add(mr('props/komainu-mossy-a'), 10, 2); add(mr('props/komainu-mossy-b'), 7, 2); add(mr('interest/torii-ruin-' + pick(['a', 'b'])), 4, 4, 'large'); add(mr('props/jizo-mossy-a'), 8, 3, 'tall') ;
      add(rt('trees/persimmon-b'), 5, 6, 'tall'); add(rt('props/scarecrow-kakashi-a'), 7, 8, 'tall'); add(rt('props/ducks-paddy-a'), 5, 8); add(rt('props/egret-paddy-b'), 10, 8); add(rt('props/field-shrine-a'), 3, 6); add(rt('props/drying-rack-a'), 10, 5); add(rt('props/straw-stack-b'), 9, 6);
      add('mr:props/pillar-standing-b'.replace('mr:', 'mr:'), 1, 3, 'tall'); add(mr('props/gorinto-b'), 4, 2, 'tall'); add(mr('props/stele-b'), 2, 5, 'tall');
      add('ml:props/rowboat-a', 1, 7); add('ml:props/heron-a', 0, 5); add('ml:grass/reed-lake-a', 3, 8) ; add('ml:props/mooring-post-a', 2, 6); add(rt('props/plank-bridge-h'), 3, 9);
      scatter(['ml:grass/reed-lake-a', 'ml:grass/reed-lake-b', 'ml:grass/cattail-lake-a', 'ml:grass/lily-pads-a', 'ml:grass/lily-pads-c', 'ml:grass/lotus-bloom-a'], 4, (x, y) => lake[y][x] && canon(mask(lake, x, y)) === 255);
      scatter(['trees/cedar-a', 'trees/pine-a', 'trees/cedar-b', 'mr:trees/snag-ivy-a', 'mr:trees/maple-shrine-a'], 5, (x, y) => !lake[y][x] && !E[y][x] && !D[y][x] && !C[y][x] && !B[y][x] && y <= 4, 'tall');
      scatter(['mr:rocks/rubble-pile-a', 'mr:rocks/wall-chunk-a', 'mr:grass/moss-clump-a', 'mr:grass/fern-clump-a', 'mr:grass/ivy-bush-a', 'rt:props/straw-stack-c', 'rt:props/harvest-basket-b', 'rt:props/tawara-b', 'mr:rocks/boulder-ruin-a'], 8, (x, y) => (C[y][x] || D[y][x] || E[y][x] || !lake[y][x] && x <= 6 && y <= 5) && !(E[y][x] && y >= 1));
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (B[y][x] && y === 7 && x >= 4 && R() < .5) put(rt('decals/water-spill-' + pick(['a', 'b'])), x * S, (y + 1) * S);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (free(x, y) && R() < .28) put(lake[y][x] ? 'ml:decals/' + pick(['ripple-rings-a', 'petals-float-a', 'fish-shadow-a', 'duckweed-film-a']) : B[y][x] || flat[y][x] ? rt('decals/' + pick(['farmer-hat-a', 'farmer-hat-c', 'paddy-ripples-a', 'rice-lodged-b'])) : mr('decals/' + pick(['moss-patch-a', 'fallen-leaves-a', 'ivy-ground-a', 'rubble-scatter-b', 'moss-chunks-b'])), x * S, y * S);
      over.push([mr('overlays/ruin-mist-a'), 6 * S, 0, 2 * S, 2 * S], [rt('overlays/terrace-mist-c'), 3 * S, 4 * S, 2 * S, 2 * S], ['ml:overlays/water-mist-a', 0, 6 * S, 2 * S, 2 * S], [mr('overlays/light-shafts-ruin-a'), 8 * S, 0, S, 2 * S], [rt('overlays/sparrows-b'), 4 * S, 0, 2 * S, 2 * S]);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { if (lake[y][x] && R() < .25) over.push(['ml:overlays/' + pick(['sun-glitter-a', 'sparkle-evening-a', 'dragonflies-a']), x * S, y * S, S, S]); else if ((B[y][x] || flat[y][x]) && R() < .2) over.push([rt('overlays/paddy-glint-' + pick(['a', 'b'])), x * S, y * S, S, S]); else if ((E[y][x] || D[y][x]) && R() < .22) over.push([mr('overlays/wisp-glow-' + pick(VR)), x * S, y * S, S, S]); }
    }
  }
  // ---- step 5: Firefly Marsh, Misty Highlands, the marsh/ruins -> highlands ascent, and the Greenvale overview strip ----
  if (which === 'marsh' || which === 'highlands' || which === 'ascent' || which === 'overview') {
    const fm = (k) => 'fm:' + k, mh = (k) => 'mh:' + k, mr = (k) => 'mr:' + k, rt = (k) => 'rt:' + k, ml = (k) => 'ml:' + k, VR = ['a', 'b', 'c', 'd'];
    const box = (x0, y0, x1, y1) => { const g = grid(); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && y >= 0 && x < COLS && y < ROWS) g[y][x] = true; return g; };
    const inG = (g, x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS && g[y][x];
    const band = (g, pre, nm, x, y) => put(pre('edges/' + nm + '-' + p3(canon(mask(g, x, y)))), x * S, y * S);
    const all8 = (g, x, y) => [-1, 0, 1].every((dy) => [-1, 0, 1].every((dx) => at(g, x + dx, y + dy)));
    const ring8 = (g, x, y) => [-1, 0, 1].some((dy) => [-1, 0, 1].some((dx) => (dx || dy) && inG(g, x + dx, y + dy)));
    const erode = (g) => { const o = grid(); for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) o[y][x] = g[y][x] && all8(g, x, y); return o; };
    const lineProp = (g, pre, nm, x, y, sy = y) => { props.push({ k: pre('fences/' + nm + '-' + String(fenceMask(g, x, y)).padStart(2, '0')), x: x * S, y: y * S, w: S, h: S, s: sy }); claim(x, y); };
    const cells = (fn) => { for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) fn(x, y); };
    const setCells = (g, list, v = true) => { for (const [x, y] of list) if (x >= 0 && y >= 0 && x < COLS && y < ROWS) g[y][x] = v; return g; };
    const mossG = ['mr:ground/moss-grass-a', 'mr:ground/moss-grass-b', 'mr:ground/moss-grass-c', 'mr:ground/moss-thick-a'];
    const mist = (k, x, y, w = 2, h = 2) => over.push([k, x * S, y * S, w * S, h * S]);
    // ---------- Firefly Marsh pieces ----------
    const marshGround = (x, y, wet) => put(wet ? pick([fm('ground/peat-' + pick(VR)), fm('ground/peat-' + pick(VR)), fm('ground/mud-' + pick(['a', 'b', 'c', 'd'])), fm('ground/bog-moss-' + pick(['a', 'b', 'c'])), fm('ground-detail/' + pick(['marigold-a', 'marigold-b', 'sedge-tussock-a', 'loosestrife-b', 'bog-cotton-a', 'mud-puddles-a', 'mud-puddles-b', 'reed-stubble-a']))]) : pick([fm('ground/dusk-grass-' + pick(['a', 'a', 'b', 'c', 'd', 'e'])), fm('ground/dusk-grass-' + pick(['a', 'b', 'c'])), fm('ground-detail/' + pick(['loosestrife-a', 'sedge-tussock-b', 'reed-stubble-b']))]), x * S, y * S);
    const marshWater = (x, y) => { const r = R(); put(r < .38 ? fm('ground/marsh-water-' + pick(['a', 'a', 'd', 'e'])) : r < .6 ? fm('ground/marsh-water-c') : r < .8 ? fm('ground-detail/' + pick(['lily-dusk-a', 'lily-dusk-b'])) : fm('ground-detail/' + pick(['duckweed-mat-a', 'duckweed-mat-b', 'wisp-water-a'])), x * S, y * S); };
    const marshScene = (pool, bwKinds, o = {}) => {
      const deep = erode(erode(pool)), land = grid(); cells((x, y) => { land[y][x] = !pool[y][x]; });
      const bw = grid(); for (const k of Object.keys(bwKinds)) { const [x, y] = k.split(',').map(Number); bw[y][x] = true; }
      cells((x, y) => {
        if (!pool[y][x]) { marshGround(x, y, ring8(pool, x, y) || R() < .25); return; }
        const m = canon(mask(pool, x, y));
        if (m === 255) { if (deep[y][x]) band(deep, fm, 'marsh-deep', x, y); else marshWater(x, y); } else put(fm('edges/' + (x <= 3 ? 'marsh-pool-weed' : y >= 7 ? 'marsh-pool-lily' : 'marsh-pool') + '-' + p3(m)), x * S, y * S);
      });
      for (const [k, nm] of Object.entries(bwKinds)) { const [x, y] = k.split(',').map(Number); lineProp(bw, fm, nm, x, y, y - .5); }
      return { deep, land, bw };
    };
    const marshProps = (pool, land, bw, o = {}) => {
      const water = (x, y) => pool[y][x] && canon(mask(pool, x, y)) === 255 && !bw[y][x];
      scatter(['fm:grass/lily-pads-dusk-a', 'fm:grass/lily-pads-dusk-b', 'fm:grass/lily-pads-dusk-c', 'fm:grass/lily-pads-dusk-d', 'fm:grass/duckweed-float-a', 'fm:grass/duckweed-float-b'], 7, (x, y) => water(x, y));
      scatter(['fm:props/stump-water-a', 'fm:props/stump-water-b', 'fm:props/stump-water-c', 'fm:props/sunken-boat-a', 'fm:props/sunken-boat-b', 'fm:props/sunken-boat-c', 'fm:props/pile-water-b', 'fm:rocks/sunken-log-a', 'fm:rocks/turtle-rock-a', 'fm:props/frog-a', 'fm:props/heron-silhouette-a', 'fm:props/heron-silhouette-b', 'fm:props/heron-silhouette-c', 'fm:grass/cattail-dusk-c', 'fm:grass/reeds-dusk-d'], 8, (x, y) => water(x, y));
      scatter(['fm:props/floating-lantern-a', 'fm:props/floating-lantern-b', 'fm:props/floating-lantern-c'], 4, (x, y) => water(x, y));
      scatter(['fm:trees/willow-marsh-a', 'fm:trees/willow-marsh-b', 'fm:trees/snag-marsh-a', 'fm:trees/snag-marsh-b', 'fm:trees/cypress-knees-a', 'fm:trees/alder-marsh-a', 'fm:trees/alder-marsh-b'], o.trees || 7, (x, y) => land[y][x] && !bw[y][x] && (o.treeOk ? o.treeOk(x, y) : (x <= 1 || x >= 10 || y <= 2)), 'tall');
      scatter(['fm:grass/cattail-dusk-a', 'fm:grass/cattail-dusk-b', 'fm:grass/reeds-dusk-a', 'fm:grass/reeds-dusk-b', 'fm:grass/reeds-dusk-c', 'fm:grass/iris-marsh-a', 'fm:grass/iris-marsh-b', 'fm:grass/sedge-clump-a', 'fm:grass/marigold-clump-a', 'fm:grass/cotton-grass-a', 'fm:grass/horsetail-a', 'fm:trees/bush-bog-myrtle-a', 'fm:trees/bush-bog-myrtle-b', 'fm:trees/bush-willow-scrub-a', 'fm:trees/bush-bramble-dusk-a', 'fm:rocks/mud-mound-a', 'fm:rocks/mud-mound-b', 'fm:rocks/mossy-boulder-marsh-a', 'fm:props/frog-b', 'fm:props/frog-d', 'fm:props/mushroom-glow-a', 'fm:props/mushroom-glow-b', 'fm:props/net-rack-a', 'fm:props/reed-bundle-a', 'fm:props/stone-frog-a', 'fm:props/fish-trap-a'], o.small || 13, (x, y) => land[y][x] && !bw[y][x]);
      scatter(['fm:props/will-o-wisp-a', 'fm:props/will-o-wisp-b', 'fm:props/will-o-wisp-c', 'fm:props/will-o-wisp-d'], 3, (x, y) => land[y][x] && !bw[y][x]);
      cells((x, y) => { if (free(x, y) && R() < .3) put(pool[y][x] ? fm('decals/' + pick(['duckweed-clump-a', 'duckweed-clump-b', 'ripple-rings-a', 'ripple-rings-b', 'lily-leaf-a', 'lily-leaf-b', 'lily-leaf-c', 'bubbles-a', 'frog-spawn-a'])) : fm('decals/' + pick(['mud-splat-a', 'mud-splat-b', 'heron-tracks-a', 'heron-tracks-b', 'bog-mushrooms-a', 'bog-mushrooms-b', 'fallen-reeds-a', 'dead-leaves-a', 'dead-leaves-b', 'dusk-fringe-a', 'dusk-fringe-c'])), x * S, y * S); });
    };
    const marshOverlays = (pool, land, tintFn) => {
      cells((x, y) => {
        over.push([fm('overlays/dusk-tint-' + tintFn(x, y)), x * S, y * S, S, S]);
        const r = R(); if (land[y][x] && r < .22) over.push([fm('overlays/fireflies-' + pick(['a', 'b', 'b', 'c', 'e'])), x * S, y * S, S, S]); else if (pool[y][x] && r < .2) over.push([fm('overlays/fireflies-' + pick(['b', 'c', 'd'])), x * S, y * S, S, S]); else if (pool[y][x] && r < .3) over.push([fm('overlays/lanterns-floating-' + pick(['a', 'b', 'c'])), x * S, y * S, S, S]); else if (pool[y][x] && r < .38) over.push([fm('overlays/' + pick(['mist-low-a', 'mist-low-b', 'mist-low-c', 'sparkle-dusk-a', 'sparkle-dusk-b'])), x * S, y * S, S, S]); else if (land[y][x] && r < .28) over.push([fm('overlays/' + pick(['wisp-trail-a', 'wisp-trail-b', 'midges-a', 'midges-b'])), x * S, y * S, S, S]);
      });
      mist(fm('overlays/fireflies-swarm-a'), 1, 3); mist(fm('overlays/fireflies-swarm-b'), 8, 5); mist(fm('overlays/mist-bank-' + pick(VR)), 0, 7); mist(fm('overlays/mist-bank-' + pick(VR)), 8, 0); mist(fm('overlays/mist-bank-' + pick(VR)), 3, 4); mist(fm('overlays/bats-flight-a'), 5, 0);
    };
    if (which === 'marsh') {
      const pool = ells(grid(), 5.8, 5.6, 5.4, 3.5, .15);
      for (const [x0, y0, x1, y1] of [[2, 6, 3, 7], [8, 7, 9, 8], [9, 2, 10, 3]]) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) pool[y][x] = false;
      for (let x = 0; x < COLS; x++) pool[0][x] = pool[1][x] = false; for (let y = 0; y < ROWS; y++) pool[y][COLS - 1] = false;
      const K = {}; for (const [x, y, n] of [[4, 2, 'boardwalk-lantern'], [5, 2, 'boardwalk'], [5, 3, 'boardwalk-lantern'], [5, 4, 'boardwalk-mossy'], [5, 5, 'boardwalk'], [6, 5, 'boardwalk'], [7, 5, 'boardwalk-mossy'], [4, 5, 'boardwalk-mossy'], [3, 5, 'boardwalk-broken'], [5, 6, 'boardwalk-lantern'], [5, 7, 'boardwalk-broken'], [5, 8, 'boardwalk-mossy'], [5, 9, 'boardwalk']]) K[x + ',' + y] = n;
      const { land, bw } = marshScene(pool, K);
      // reed beds along the western and eastern banks, a hint of day grass at the south-west corner where the ruins begin
      const rb = grid(); cells((x, y) => { if (land[y][x] && !(x === 0 && y <= 1) && ((x === 0 && y >= 2 && y <= 8) || (x === 11 && y >= 3 && y <= 9))) rb[y][x] = true; });
      cells((x, y) => { if (rb[y][x]) band(rb, fm, 'reed-bed', x, y); });
      add(fm('interest/gate-stilt-hut-' + pick(['closed', 'open'])), 4, 1, 'large'); add(fm('interest/stilt-hut-a'), 8, 5, 'large'); add(fm('interest/stilt-hut-c'), 2, 7, 'large'); add(fm('interest/watchtower-stilt-a'), 9, 3, 'large'); add(fm('interest/shrine-islet-marsh-a'), 8, 8, 'large');
      add(fm('props/lantern-pole-b'), 6, 3, 'tall'); add(fm('props/lantern-pole-c'), 4, 4, 'tall'); add(fm('props/jizo-marsh-b'), 3, 2, 'tall'); add(fm('props/lantern-marsh-b'), 7, 2, 'tall'); add(fm('props/hokora-marsh-b'), 1, 5, 'tall'); add(fm('props/pile-water-c'), 6, 8); add(fm('props/signpost-marsh-a'), 6, 9, 'tall');
      marshProps(pool, land, bw, { trees: 7, small: 12 });
      marshOverlays(pool, land, () => 'light');
    }

    // ---------- Misty Highlands pieces ----------
    const highGround = (x, y, wet) => put(pick([mh('ground/ochre-pasture-' + pick(VR)), mh('ground/ochre-pasture-' + pick(VR)), mh('ground/ochre-pasture-' + pick(['a', 'b'])), mh('ground/ochre-dry-' + pick(['a', 'b'])), mh('ground/ochre-pasture-' + pick(['c', 'd'])), mh('ground/gorse-' + pick(['a', 'b', 'c'])), mh('ground-detail/' + pick(['thistle-a', 'pebbles-ochre-a', 'pebbles-ochre-b', 'wool-tufts-a', 'heather-bloom-b', 'gorse-flower-a']))]), x * S, y * S);
    const highProps = (ok, o = {}) => {
      scatter(['mh:trees/pine-bent-a', 'mh:trees/pine-bent-b', 'mh:trees/pine-bent-c', 'mh:trees/pine-bent-d', 'mh:trees/rowan-a', 'mh:trees/birch-mountain-a', 'mh:trees/thorn-lone-a'], o.trees || 5, (x, y) => ok(x, y) && (o.treeOk ? o.treeOk(x, y) : true), 'tall');
      scatter(['mh:rocks/standing-stone-a', 'mh:rocks/standing-stone-b', 'mh:rocks/standing-stone-c', 'mh:rocks/standing-stone-d', 'mh:rocks/standing-stone-e', 'mh:rocks/rock-spire-a', 'mh:rocks/rock-spire-b'], o.stones || 4, (x, y) => ok(x, y), 'tall');
      scatter(['mh:trees/pine-dwarf-a', 'mh:trees/pine-dwarf-b', 'mh:trees/gorse-bush-a', 'mh:trees/gorse-bush-b', 'mh:trees/gorse-bush-c', 'mh:trees/heather-clump-a', 'mh:trees/heather-clump-b', 'mh:trees/juniper-a', 'mh:rocks/boulder-ochre-a', 'mh:rocks/boulder-ochre-b', 'mh:rocks/boulder-ochre-c', 'mh:rocks/erratic-lichen-a', 'mh:rocks/scree-pile-a', 'mh:rocks/scree-pile-b', 'mh:rocks/cairn-a', 'mh:rocks/cairn-b', 'mh:rocks/cairn-c', 'mh:rocks/cairn-d', 'mh:grass/thistle-tall-a', 'mh:grass/thistle-tall-b', 'mh:grass/bracken-ochre-a', 'mh:grass/bracken-ochre-b', 'mh:grass/tussock-grass-a', 'mh:grass/tussock-grass-b', 'mh:props/mani-stone-a', 'mh:props/mani-stone-b'], o.small || 14, (x, y) => ok(x, y));
      cells((x, y) => { if (free(x, y) && ok(x, y) && R() < .32) put(mh('decals/' + pick(['goat-a', 'goat-b', 'goat-c', 'goat-d', 'bird-hawk-a', 'bird-crow-a', 'bird-crow-b', 'bird-lark-a', 'bird-flock-a', 'scree-scatter-a', 'scree-scatter-b', 'rock-flecks-a', 'goat-tracks-a', 'goat-tracks-b', 'wind-grass-a', 'wind-grass-b', 'wind-grass-c', 'lichen-patch-a', 'feather-a', 'scree-scatter-c'])), x * S, y * S); });
    };
    const highOverlays = (ok, rav = null) => {
      cells((x, y) => { const r = R(); if (rav && rav[y][x]) over.push([mh('overlays/mist-rise-' + pick(['a', 'b', 'c'])), x * S, y * S, S, S]); else if (ok(x, y) && r < .18) over.push([mh('overlays/mist-low-' + pick(['a', 'b', 'c'])), x * S, y * S, S, S]); else if (ok(x, y) && r < .3) over.push([mh('overlays/' + pick(['wind-streaks-a', 'wind-streaks-b', 'dew-glint-a', 'dew-glint-b'])), x * S, y * S, S, S]); });
      mist(mh('overlays/mist-drift-' + pick(VR)), 0, 5); mist(mh('overlays/mist-drift-' + pick(VR)), 8, 1); mist(mh('overlays/mist-drift-' + pick(VR)), 4, 7); mist(mh('overlays/cloud-shadow-' + pick(['a', 'b'])), 2, 2); mist(mh('overlays/birds-high-a'), 6, 0); over.push([mh('overlays/light-shafts-highland-a'), 3 * S, 3 * S, S, 2 * S]);
    };
    if (which === 'highlands') {
      const R2 = box(0, 0, COLS - 1, 0), R1 = box(0, 1, COLS - 1, 2), S4 = grid(), RV = ells(grid(), 9.8, 7.0, 1.3, 2.4, .1), BW = grid(), PF = grid(), WD = grid();
      setCells(S4, [[1, 3], [2, 3], [2, 4], [3, 4], [3, 5], [4, 5], [4, 6], [4, 7], [4, 8], [4, 9]]);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (RV[y][x] && (y < 5 || x < 8)) RV[y][x] = false;
      setCells(BW, [[8, 7], [9, 7], [10, 7], [11, 7]]); setCells(PF, [[6, 5], [7, 5], [8, 5]]); setCells(WD, [[5, 9], [6, 9], [7, 9], [8, 9]]);
      const HP = ells(grid(), 6.0, 5.0, 1.4, 1.0, .1), SP = ells(grid(), 1.0, 6.4, 1.2, 1.1, .1), GT = box(0, 4, 0, 5);
      cells((x, y) => { if (R1[y][x] || R2[y][x] || S4[y][x] || RV[y][x] || HP[y][x] || SP[y][x] || GT[y][x]) return; highGround(x, y); });
      cells((x, y) => { if (R2[y][x]) band(R2, mh, 'ridge-high', x, y); else if (R1[y][x]) band(R1, mh, 'ridge-grey', x, y); else if (HP[y][x]) { if (canon(mask(HP, x, y)) === 255) put(mh('ground/heather-' + pick(VR)), x * S, y * S); else band(HP, mh, 'heather-patch', x, y); } else if (SP[y][x]) { if (canon(mask(SP, x, y)) === 255) put(mh('ground/scree-' + pick(VR)), x * S, y * S); else band(SP, mh, 'scree-patch', x, y); } else if (GT[y][x]) band(GT, mh, 'gorse-thicket', x, y); else if (S4[y][x]) band(S4, mh, 'mountain-stream', x, y); else if (RV[y][x]) band(RV, mh, 'ravine', x, y); });
      cells((x, y) => { if (BW[y][x]) lineProp(BW, mh, 'rope-bridge', x, y, y - .5); if (PF[y][x]) lineProp(PF, mh, 'prayer-flags', x, y); if (WD[y][x]) lineProp(WD, mh, 'wall-drystone', x, y); });
      add(mh('interest/gate-mountain-' + pick(['closed', 'open'])), 5, 3, 'large'); add(mh('interest/waterfall-mountain-' + pick(['a', 'b'])), 1, 3, 'large'); add(mh('interest/stone-circle-' + pick(['a', 'b'])), 6, 8, 'large'); add(mh('interest/standing-stones-trio-a'), 9, 4, 'large'); add(mh('interest/hut-shepherd-' + pick(['a', 'b'])), 1, 9, 'large');
      add(mh('props/mountain-shrine-b'), 3, 3, 'tall'); add(mh('props/lantern-mountain-b'), 8, 4, 'tall'); add(mh('props/prayer-flag-pole-' + pick(['a', 'b'])), 11, 6, 'tall'); add(mh('props/signpost-trail-a'), 7, 4, 'tall'); add(mh('props/jizo-mountain-a'), 0, 8, 'tall'); add(mh('props/cascade-small-a'), 3, 6); add(mh('props/cascade-small-b'), 4, 9);
      highProps((x, y) => !R1[y][x] && !R2[y][x] && !S4[y][x] && !RV[y][x] && !BW[y][x] && !PF[y][x] && !WD[y][x], { trees: 5, stones: 3, small: 13, treeOk: (x, y) => x <= 2 || x >= 10 || y >= 8 });
      highOverlays((x, y) => !RV[y][x], RV);
    }
    // ---------- the ascent: Mossy Ruins and Firefly Marsh climbing into the Misty Highlands ----------
    if (which === 'ascent') {
      const HI = ells(grid(), 5.5, 1.2, 7.4, 3.4, .16), bx = (y) => 5.6 + Math.sin(y * .9) * 1.0, RU = grid(), MA = grid();
      cells((x, y) => { if (!HI[y][x]) { if (x + .5 < bx(y)) RU[y][x] = true; else MA[y][x] = true; } });
      const PL = ells(grid(), 8.6, 7.4, 2.4, 1.6, .12); cells((x, y) => { if (!MA[y][x] || y < 5) PL[y][x] = false; });
      const NR = grid(); cells((x, y) => { NR[y][x] = !RU[y][x]; });
      const touch = (g, x, y) => ring8(g, x, y), cnt = (g, x, y) => [-1, 0, 1].reduce((a, dy) => a + [-1, 0, 1].reduce((b, dx) => b + ((dx || dy) && inG(g, x + dx, y + dy) ? 1 : 0), 0), 0);
      const R1 = box(0, 0, COLS - 1, 0), bwK = {}; for (const [x, y] of [[8, 9], [8, 8], [8, 7]]) bwK[x + ',' + y] = 'boardwalk-mossy';
      const BW = grid(); setCells(BW, [[10, 9], [10, 8], [10, 7]]);
      cells((x, y) => {
        if (R1[y][x]) { band(R1, mh, 'ridge-grey', x, y); return; }
        if (HI[y][x]) { const m = canon(mask(HI, x, y)); if (m === 255) { const r = R(); put(r < .12 ? mh('ground/scree-' + pick(VR)) : r < .24 ? mh('ground/heather-' + pick(VR)) : r < .34 ? mh('ground-detail/' + pick(['thistle-a', 'pebbles-ochre-a', 'wool-tufts-a'])) : mh('ground/ochre-pasture-' + pick(VR)), x * S, y * S); } else put(mh('edges/' + (cnt(MA, x, y) >= cnt(RU, x, y) ? 'ochre-patch-peat-' : 'ochre-patch-moss-') + p3(m)), x * S, y * S); return; }
        if (RU[y][x]) { const r = R(); put(touch(HI, x, y) ? pick(mossG) : r < .3 ? mr('ground/flagstone-' + pick(['mossy', 'cracked', 'wet']) + '-' + pick(['a', 'b', 'c'])) : r < .6 ? pick(mossG) : mr('ground-detail/' + pick(['moss-stones-a', 'ruin-leaves-a', 'ruin-fern-a'])), x * S, y * S); return; }
        if (PL[y][x]) { const m = canon(mask(PL, x, y)); if (m === 255) put(fm('ground/marsh-water-' + pick(['a', 'c', 'd'])), x * S, y * S); else put(fm('edges/marsh-pool-' + p3(m)), x * S, y * S); return; }
        if (MA[y][x] && touch(RU, x, y) && !touch(HI, x, y)) { band(NR, fm, 'dusk-patch-moss', x, y); return; }
        marshGround(x, y, touch(HI, x, y) || touch(PL, x, y) || R() < .3);
      });
      cells((x, y) => { if (BW[y][x]) lineProp(BW, fm, 'boardwalk-mossy', x, y, y - .5); });
      add(mr('interest/gate-ruin-arch-' + pick(['closed', 'open'])), 2, 5, 'large'); add(mr('props/ruin-lantern-b'), 1, 6, 'tall'); add(mr('props/ruin-lantern-d'), 4, 6, 'tall'); add(mr('props/pillar-standing-a'), 0, 8, 'tall'); add(mr('props/jizo-mossy-a'), 3, 8, 'tall');
      add(fm('interest/stilt-hut-a'), 9, 6, 'large'); add(fm('props/lantern-pole-b'), 11, 8, 'tall'); add(fm('interest/gate-stilt-hut-' + pick(['closed', 'open'])), 8, 4, 'large');
      add(mh('interest/standing-stones-trio-a'), 3, 3, 'large'); add(mh('interest/gate-mountain-closed'), 8, 2, 'large'); add(mh('props/prayer-flag-pole-a'), 6, 3, 'tall');
      scatter(['mh:trees/pine-bent-a', 'mh:trees/pine-bent-b', 'mh:trees/pine-bent-c', 'mh:trees/rowan-a', 'mh:rocks/standing-stone-a', 'mh:rocks/standing-stone-b', 'mh:rocks/standing-stone-e', 'mh:rocks/rock-spire-a'], 6, (x, y) => HI[y][x] && y >= 1, 'tall');
      scatter(['mh:trees/gorse-bush-a', 'mh:trees/gorse-bush-b', 'mh:trees/heather-clump-a', 'mh:rocks/boulder-ochre-a', 'mh:rocks/cairn-a', 'mh:rocks/scree-pile-a', 'mh:grass/thistle-tall-a', 'mh:grass/bracken-ochre-a', 'mh:grass/tussock-grass-a', 'mh:trees/pine-dwarf-a'], 10, (x, y) => HI[y][x] && y >= 1);
      scatter(['mr:trees/maple-shrine-a', 'mr:trees/snag-ivy-a', 'trees/cedar-a', 'trees/pine-a', 'fm:trees/willow-marsh-a', 'fm:trees/snag-marsh-a', 'fm:trees/alder-marsh-a'], 6, (x, y) => (RU[y][x] || MA[y][x]) && !BW[y][x] && !PL[y][x], 'tall');
      scatter(['mr:rocks/rubble-pile-a', 'mr:rocks/boulder-ruin-a', 'mr:grass/fern-clump-a', 'mr:grass/moss-clump-a', 'mr:grass/ivy-bush-a', 'mr:props/stone-basin-a', 'mr:props/grave-marker-a'], 6, (x, y) => RU[y][x]);
      scatter(['fm:grass/cattail-dusk-a', 'fm:grass/reeds-dusk-a', 'fm:grass/iris-marsh-a', 'fm:grass/sedge-clump-a', 'fm:trees/bush-bog-myrtle-a', 'fm:props/frog-b', 'fm:props/mushroom-glow-a', 'fm:props/stump-water-a', 'fm:props/heron-silhouette-a', 'fm:rocks/mud-mound-a'], 7, (x, y) => MA[y][x] && !BW[y][x]);
      scatter(['fm:grass/lily-pads-dusk-a', 'fm:grass/lily-pads-dusk-c', 'fm:props/floating-lantern-a', 'fm:props/sunken-boat-a'], 3, (x, y) => PL[y][x] && canon(mask(PL, x, y)) === 255);
      cells((x, y) => { if (free(x, y) && R() < .28) { if (HI[y][x]) put(mh('decals/' + pick(['goat-a', 'goat-b', 'bird-crow-a', 'scree-scatter-a', 'wind-grass-a', 'lichen-patch-a'])), x * S, y * S); else if (RU[y][x]) put(mr('decals/' + pick(['moss-patch-a', 'crack-paving-a', 'fallen-leaves-a', 'rubble-scatter-a', 'puddle-a'])), x * S, y * S); else put(fm('decals/' + pick(['mud-splat-a', 'dusk-fringe-a', 'heron-tracks-a', 'dead-leaves-a', 'bog-mushrooms-a'])), x * S, y * S); } });
      cells((x, y) => { const r = R(); if (MA[y][x] || PL[y][x]) over.push([fm('overlays/dusk-tint-' + (y >= 8 ? 'mid' : 'light')), x * S, y * S, S, S]); if (MA[y][x] && r < .3) over.push([fm('overlays/fireflies-' + pick(['a', 'b', 'c', 'e'])), x * S, y * S, S, S]); else if (RU[y][x] && r < .12) over.push([mr('overlays/wisp-glow-' + pick(VR)), x * S, y * S, S, S]); else if (HI[y][x] && r < .22) over.push([mh('overlays/mist-low-' + pick(['a', 'b', 'c'])), x * S, y * S, S, S]); });
      mist(mh('overlays/mist-drift-' + pick(VR)), 0, 1); mist(mh('overlays/mist-drift-' + pick(VR)), 6, 3); mist(mr('overlays/ruin-mist-a'), 0, 6); mist(fm('overlays/mist-bank-' + pick(VR)), 6, 7); mist(fm('overlays/fireflies-swarm-a'), 9, 6); over.push([mr('overlays/light-shafts-ruin-a'), 3 * S, 5 * S, S, 2 * S]); mist(mh('overlays/birds-high-a'), 3, 0);
    }

    // ---------- the Greenvale overview: a 16x24 strip from Sunny Meadows (south) to the Misty Highlands gate (north) ----------
    if (which === 'overview') {
      const bsh = (k, x) => k === 3 ? 0 : Math.round(Math.sin(x * .75 + k * 2.1) * 1.1 + Math.sin(x * .31 + k) * .6);
      const Z = Array.from({ length: ROWS }, (_, y) => Array.from({ length: COLS }, (_, x) => { let z = 0; for (let k = 1; k <= 7; k++) if (y >= 3 * k + bsh(k, x)) z = k; return z; }));
      const zg = (...zs) => { const g = grid(); cells((x, y) => { g[y][x] = zs.includes(Z[y][x]); }); return g; };
      const Zs = [0, 1, 2, 3, 4, 5, 6, 7].map((z) => zg(z)), zin = (z, x, y) => inG(Zs[z], x, y);
      const LK = ells(grid(), 11.2, 14.0, 4.4, 2.4, .12), ST = grid(); for (let x = 3; x <= 8; x++) ST[16][x] = true;
      const U = grid(); cells((x, y) => { U[y][x] = LK[y][x] || ST[y][x]; });
      const R2 = grid(), R1 = grid(); cells((x, y) => { if (Z[y][x] === 0 && y === 0) R2[y][x] = true; if (Z[y][x] === 0 && y === 1) R1[y][x] = true; });
      const PL = ells(grid(), 7.5, 4.6, 3.8, 1.3, .1); cells((x, y) => { if (Z[y][x] !== 1 || U[y][x]) PL[y][x] = false; });
      const NR = grid(); cells((x, y) => { NR[y][x] = Z[y][x] <= 1; });
      const T2 = grid(), T1 = grid(), PF = ells(grid(), 4, 10.6, 2.6, 1.0, .1), BG = ells(grid(), 3.5, 17.0, 3, 1.1, .1), WF = ells(grid(), 11, 22.2, 2.6, 1.0, .1);
      cells((x, y) => { if (Z[y][x] === 2 && y + 1 < ROWS && Z[y + 1][x] === 3) T2[y][x] = true; if (Z[y][x] === 3 && y > 0 && Z[y - 1][x] === 2) T1[y][x] = true; if (Z[y][x] !== 3 || T1[y][x] || U[y][x]) PF[y][x] = false; if (Z[y][x] !== 5 || U[y][x]) BG[y][x] = false; if (Z[y][x] !== 7) WF[y][x] = false; });
      const BW = grid(); setCells(BW, [[6, 5], [7, 5], [8, 5], [9, 5], [9, 4], [9, 3]]);
      const OAK = Zs[6], H = Zs[0], touchZ = (z, x, y) => ring8(Zs[z], x, y);
      cells((x, y) => {
        const z = Z[y][x], px = x * S, py = y * S;
        if (U[y][x]) {
          const m = canon(mask(U, x, y));
          if (ST[y][x]) put(x <= 7 ? bv('edges/stream-' + p3(m)) : bv('edges/stream-mouth-' + p3(m)), px, py);
          else if (m === 255) put(R() < .75 ? ml('ground/lake-shallow-' + pick(VR)) : ml('ground-detail/' + pick(['lake-lilies-a', 'lake-petals-a', 'lake-fish-a'])), px, py);
          else put(!inG(LK, x, y - 1) && y <= 13 ? rt('edges/lake-bank-earth-' + p3(m)) : ml('edges/lake-shore-pebble-' + p3(m)), px, py);
          return;
        }
        if (z === 0) {
          if (R2[y][x]) band(R2, mh, 'ridge-high', x, y); else if (R1[y][x]) band(R1, mh, 'ridge-grey', x, y);
          else { const m = canon(mask(H, x, y)); if (m !== 255) put(mh('edges/ochre-patch-peat-' + p3(m)), px, py); else highGround(x, y); }
        } else if (z === 1) {
          if (PL[y][x]) { const m = canon(mask(PL, x, y)); if (m === 255) marshWater(x, y); else put(fm('edges/marsh-pool-' + p3(m)), px, py); }
          else if (touchZ(0, x, y)) put(fm('ground/peat-' + pick(VR)), px, py);
          else if (touchZ(2, x, y)) band(NR, fm, 'dusk-patch-moss', x, y);
          else marshGround(x, y, ring8(PL, x, y) || R() < .2);
        } else if (z === 2) {
          if (T2[y][x]) band(T2, mr, 'terrace-mossy', x, y); else { const r = R(); put(r < .3 ? mr('ground/flagstone-' + pick(['mossy', 'cracked', 'wet']) + '-' + pick(['a', 'b', 'c'])) : r < .7 ? pick(mossG) : mr('ground-detail/' + pick(['moss-stones-a', 'ruin-leaves-a', 'ruin-fern-a', 'ruin-leaves-b'])), px, py); }
        } else if (z === 3) {
          if (T1[y][x]) band(T1, rt, 'terrace-paddy-ripe', x, y); else if (PF[y][x]) band(PF, rt, 'paddy-field-ripe', x, y); else { const r = R(); put(r < .45 ? rt('ground/terrace-grass-' + pick(['a', 'b', 'c'])) : r < .6 ? rt('ground/bank-weeds-' + pick(['a', 'b'])) : pick(grassK), px, py); }
        } else if (z === 4) put(R() < .15 ? ml('ground-detail/' + pick(['pebble-beach-a', 'lake-petals-a'])) : pick(grassK), px, py);
        else if (z === 5) { if (BG[y][x]) band(BG, bv, 'bamboo-grove', x, y); else put(pick(['ba', 'ba', 'ba']) && bv('ground/' + pick(['grass-bamboo-a', 'grass-bamboo-b', 'floor-bamboo-a', 'grass-bamboo-a'])), px, py); }
        else if (z === 6) { const m = canon(mask(OAK, x, y)); if (m !== 255) put(oo('edges/floor-patch-' + p3(m)), px, py); else put(oo('ground/' + pick(['floor-moss-a', 'floor-moss-b', 'floor-dark-a', 'floor-golden-a', 'floor-grassy-a'])), px, py); }
        else { if (WF[y][x]) band(WF, sm, 'wildflower-patch', x, y); else { const r = R(); put(r < .5 ? sm('ground/meadow-' + pick(['hill', 'lush', 'dew', 'golden']) + '-' + pick(['a', 'b'])) : r < .58 ? sm('ground-detail/meadow-' + pick(['blush', 'gold', 'lavender', 'poppy']) + '-a') : pick(grassK), px, py); } }
      });
      cells((x, y) => { if (BW[y][x]) lineProp(BW, fm, 'boardwalk-mossy', x, y, y - .5); });
      // landmarks, one gate per sub-area
      add(mh('interest/gate-mountain-' + pick(['closed', 'open'])), 7, 2, 'large'); add(mh('interest/standing-stones-trio-a'), 2, 2, 'large'); add(mh('interest/stone-circle-a'), 12, 2, 'large');
      add(fm('interest/gate-stilt-hut-closed'), 4, 4, 'large'); add(fm('interest/stilt-hut-a'), 12, 5, 'large'); add(fm('props/lantern-pole-b'), 10, 5, 'tall'); add(fm('props/jizo-marsh-b'), 2, 5, 'tall');
      add(mr('interest/gate-ruin-arch-closed'), 10, 7, 'large'); add(mr('props/ruin-lantern-b'), 8, 7, 'tall'); add(mr('props/ruin-lantern-d'), 13, 7, 'tall'); add(mr('props/jizo-mossy-a'), 3, 7, 'tall'); add(mr('props/pillar-standing-a'), 5, 7, 'tall'); add(mr('props/komainu-mossy-a'), 6, 6);
      add(rt('interest/kura-gate-closed'), 12, 11, 'large'); add(rt('interest/waterwheel-a'), 2, 11, 'large'); add(rt('trees/persimmon-a'), 7, 11, 'tall'); add(rt('props/scarecrow-kakashi-a'), 5, 10, 'tall'); add(rt('props/field-shrine-a'), 9, 10);
      add(ml('interest/torii-lake-a'), 11, 14, 'large'); add(ml('props/rowboat-a'), 9, 14); add(ml('trees/willow-weeping-a'), 1, 13, 'tall'); add(ml('trees/willow-weeping-b'), 5, 13, 'tall'); add(ml('props/heron-a'), 14, 15);
      add(bv('interest/hut-gate-closed'), 1, 17, 'large'); add(bv('props/stone-lantern-b'), 6, 15, 'tall'); add(bv('interest/waterfall-a'), 13, 17, 'large') || add(bv('props/tea-stool-parasol-a'), 13, 17);
      add(oo('interest/gate-hollow-oak-closed'), 7, 20, 'large'); add(oo('trees/oak-mature-a'), 2, 20, 'tall'); add(oo('trees/oak-mature-b'), 12, 20, 'tall'); add(oo('props/hokora-b'), 4, 19, 'tall'); add(oo('props/mushroom-glow-a'), 10, 19);
      add(sm('interest/gate-farm-closed'.replace('sm:', '')), 6, 22, 'large') || add('interest/gate-farm-closed', 6, 22, 'large'); add(sm('interest/windmill-a'), 2, 23, 'large'); add(sm('interest/barn-a'), 12, 23, 'large'); add(sm('props/scarecrow-field-b'), 10, 21, 'tall'); add(sm('props/beehive-a'), 9, 22);
      highProps((x, y) => Z[y][x] === 0 && y >= 2 && !U[y][x], { trees: 3, stones: 2, small: 6, treeOk: (x, y) => x <= 1 || x >= 14 });
      scatter(['fm:trees/willow-marsh-a', 'fm:trees/snag-marsh-a', 'fm:trees/alder-marsh-a', 'fm:trees/cypress-knees-a'], 3, (x, y) => Z[y][x] === 1 && !PL[y][x] && !BW[y][x] && (x <= 1 || x >= 14), 'tall');
      scatter(['fm:grass/cattail-dusk-a', 'fm:grass/reeds-dusk-a', 'fm:grass/iris-marsh-a', 'fm:props/frog-b', 'fm:props/mushroom-glow-a', 'fm:props/heron-silhouette-a', 'fm:props/stump-water-a'], 5, (x, y) => Z[y][x] === 1 && !BW[y][x]);
      scatter(['fm:grass/lily-pads-dusk-a', 'fm:props/floating-lantern-a', 'fm:props/sunken-boat-a'], 2, (x, y) => PL[y][x] && canon(mask(PL, x, y)) === 255 && !BW[y][x]);
      scatter(['trees/cedar-a', 'trees/pine-a', 'mr:trees/maple-shrine-a', 'mr:trees/snag-ivy-a'], 3, (x, y) => Z[y][x] === 2 && !T2[y][x] && (x <= 1 || x >= 14), 'tall');
      scatter(['mr:rocks/rubble-pile-a', 'mr:grass/fern-clump-a', 'mr:grass/moss-clump-a', 'mr:props/stone-basin-a', 'mr:rocks/boulder-ruin-a'], 4, (x, y) => Z[y][x] === 2 && !T2[y][x]);
      scatter(['rt:props/straw-stack-a', 'rt:props/harvest-basket-a', 'rt:props/ducks-paddy-a', 'rt:props/egret-paddy-a', 'rt:props/tawara-a'], 4, (x, y) => Z[y][x] === 3 && !T1[y][x]);
      scatter(['ml:grass/reed-lake-a', 'ml:grass/cattail-lake-a', 'ml:grass/lily-pads-a', 'ml:grass/lotus-bloom-a'], 4, (x, y) => LK[y][x] && canon(mask(U, x, y)) === 255);
      scatter(['ml:trees/oak-lakeside-a'], 2, (x, y) => Z[y][x] === 4 && !U[y][x], 'tall');
      scatter(['ml:trees/bush-hydrangea-a', 'ml:rocks/shore-boulder-a', 'ml:grass/reed-lake-b'], 4, (x, y) => Z[y][x] === 4 && !U[y][x]);
      scatter(['bv:trees/bamboo-green-a', 'bv:trees/bamboo-golden-a', 'bv:trees/bamboo-slender-a', 'bv:trees/bamboo-mixed-a', 'bv:trees/bamboo-green-b'], 6, (x, y) => Z[y][x] === 5 && !U[y][x], 'tall');
      scatter(['bv:grass/iris-bank-a', 'bv:grass/sasa-clump-a', 'bv:rocks/stream-rock-a'], 3, (x, y) => Z[y][x] === 5 && !U[y][x]);
      scatter(['oo:trees/oak-mature-c', 'oo:trees/oak-young-a', 'oo:trees/oak-autumn-a', 'oo:trees/oak-dead-a'], 6, (x, y) => Z[y][x] === 6, 'tall');
      scatter(['oo:props/mushroom-cluster-a', 'oo:props/log-fallen-a', 'oo:props/stump-mossy-a', 'oo:grass/fern-clump-a', 'oo:rocks/boulder-mossy-oak-a'], 4, (x, y) => Z[y][x] === 6);
      scatter(['sm:trees/oak-meadow-a', 'sm:trees/orchard-tree-a', 'sm:trees/oak-meadow-b'], 3, (x, y) => Z[y][x] === 7 && !WF[y][x], 'tall');
      scatter(['sm:grass/wildflower-clump-a', 'sm:grass/lavender-bush-a', 'sm:props/haystack-a', 'sm:rocks/boulder-flowered-a'], 5, (x, y) => Z[y][x] === 7);
      cells((x, y) => { const z = Z[y][x]; if (!free(x, y) || R() > .22) return; put(z === 0 ? mh('decals/' + pick(['goat-a', 'bird-crow-a', 'scree-scatter-a', 'wind-grass-a'])) : z === 1 ? fm('decals/' + pick(['mud-splat-a', 'dusk-fringe-a', 'heron-tracks-a', 'dead-leaves-a'])) : z === 2 ? mr('decals/' + pick(['moss-patch-a', 'crack-paving-a', 'fallen-leaves-a', 'puddle-a'])) : z === 3 ? rt('decals/' + pick(['farmer-hat-a', 'straw-scatter-a', 'footprints-mud-a'])) : z === 7 ? 'decals/' + pick(['clover-a', 'flower-patch-a'].slice(0, 0).concat(['dandelion-a'])) : 'decals/dandelion-a', x * S, y * S); });
      cells((x, y) => { const z = Z[y][x], r = R(); if (z <= 1) over.push([fm('overlays/dusk-tint-' + (z === 1 ? 'mid' : 'light')), x * S, y * S, S, S]); if (z === 1 && r < .3) over.push([fm('overlays/fireflies-' + pick(['a', 'b', 'c', 'e'])), x * S, y * S, S, S]); else if (z === 0 && r < .2) over.push([mh('overlays/mist-low-' + pick(['a', 'b', 'c'])), x * S, y * S, S, S]); else if (z === 2 && r < .12) over.push([mr('overlays/wisp-glow-' + pick(VR)), x * S, y * S, S, S]); else if (z === 3 && r < .12) over.push([rt('overlays/paddy-glint-a'), x * S, y * S, S, S]); else if (LK[y][x] && r < .25) over.push([ml('overlays/' + pick(['sun-glitter-a', 'sparkle-evening-a'])), x * S, y * S, S, S]); else if (z === 6 && r < .14) over.push([oo('overlays/' + pick(['dapple-a', 'spores-a'])), x * S, y * S, S, S]); else if (z === 7 && r < .12) over.push([sm('overlays/' + pick(['butterflies-a', 'bees-a'])), x * S, y * S, S, S]); });
      mist(mh('overlays/mist-drift-a'), 0, 1); mist(mh('overlays/mist-drift-c'), 9, 0); mist(fm('overlays/fireflies-swarm-a'), 5, 3); mist(fm('overlays/mist-bank-b'), 11, 4); mist(mr('overlays/ruin-mist-a'), 1, 7); mist(rt('overlays/terrace-mist-a'), 8, 9); mist(ml('overlays/water-mist-a'), 10, 14); mist(bv('overlays/valley-mist-a'), 0, 16); mist(oo('overlays/mist-a'), 8, 18);
    }
  }
  // decals that were put before props are in `items` already; now props by foot row, then overlays
  props.sort((p, q) => p.s - q.s || p.x - q.x);
  for (const p of props) put(p.k, p.x, p.y, p.w, p.h);
  for (const o of over) put(o[0], o[1], o[2], o[3], o[4]);
  if (which !== 'overview') {
  for (let x = 0; x < COLS; x++) put('overlays/fog-edge-04', x * S, (ROWS - 1) * S);
  for (let y = 0; y < ROWS; y++) put('overlays/fog-edge-08', 0, y * S), put('overlays/fog-edge-02', (COLS - 1) * S, y * S);
  put('overlays/fog-edge-12', 0, (ROWS - 1) * S); put('overlays/fog-edge-06', (COLS - 1) * S, (ROWS - 1) * S);
  }
  return { w: COLS * S, h: ROWS * S, items };
}
