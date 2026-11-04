// Sample-scene composer for the sub-area patches (inlined into the gallery like compose.mjs, so it must stay self-contained).
// composeSub(seed, has, which) -> { w, h, items:[{k,x,y,w,h}] }. which: 'meadows' | 'oakwood' | 'blend'.
// Keys: common tiles as in compose.mjs (e.g. 'ground/grass-a'); sub-area tiles with a prefix: 'sm:' sunny-meadows, 'oo:' old-oak-wood.
export function composeSub(seed, has, which = 'meadows') {
  let a = seed >>> 0;
  const R = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = (arr) => arr[Math.floor(R() * arr.length)];
  const COLS = 12, ROWS = 10, S = 64;
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
  const sm = (k) => 'sm:' + k, oo = (k) => 'oo:' + k;
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
  } else {   // blend: meadow on the left flows through floor-patch tongues and oaks into the wood on the right
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
  }
  // decals that were put before props are in `items` already; now props by foot row, then overlays
  props.sort((p, q) => p.s - q.s || p.x - q.x);
  for (const p of props) put(p.k, p.x, p.y, p.w, p.h);
  for (const o of over) put(o[0], o[1], o[2], o[3], o[4]);
  for (let x = 0; x < COLS; x++) put('overlays/fog-edge-04', x * S, (ROWS - 1) * S);
  for (let y = 0; y < ROWS; y++) put('overlays/fog-edge-08', 0, y * S), put('overlays/fog-edge-02', (COLS - 1) * S, y * S);
  put('overlays/fog-edge-12', 0, (ROWS - 1) * S); put('overlays/fog-edge-06', (COLS - 1) * S, (ROWS - 1) * S);
  return { w: COLS * S, h: ROWS * S, items };
}
