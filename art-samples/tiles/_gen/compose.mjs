// Pure scene composer used by build-tileset.mjs (inlined into the gallery page so the "reroll" button works offline).
// compose(seed, has) -> { w, h, items:[{k,x,y,w,h}] } ; keys are manifest paths minus "greenvale/common/" and ".svg".
export function compose(seed, has, which = 'meadow') {
  let a = seed >>> 0;
  const R = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = (arr) => arr[Math.floor(R() * arr.length)];
  const COLS = 12, ROWS = 10, S = 64;
  const mk = () => Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const items = [], used = new Set();
  const N = 1, NE = 2, E = 4, SE = 8, SS = 16, SW = 32, W = 64, NW = 128;
  const at = (g, x, y) => (x < 0 || y < 0 || x >= COLS || y >= ROWS) ? true : g[y][x];
  const blobMask = (g, x, y) => (at(g, x, y - 1) ? N : 0) | (at(g, x + 1, y - 1) ? NE : 0) | (at(g, x + 1, y) ? E : 0) | (at(g, x + 1, y + 1) ? SE : 0) | (at(g, x, y + 1) ? SS : 0) | (at(g, x - 1, y + 1) ? SW : 0) | (at(g, x - 1, y) ? W : 0) | (at(g, x - 1, y - 1) ? NW : 0);
  const canon = (m) => { let o = m; if (!(m & N && m & E)) o &= ~NE; if (!(m & SS && m & E)) o &= ~SE; if (!(m & SS && m & W)) o &= ~SW; if (!(m & N && m & W)) o &= ~NW; return o; };
  const p3 = (m) => String(m).padStart(3, '0');
  const put = (k, x, y, w = S, h = S) => { if (has(k)) items.push({ k, x, y, w, h }); };
  const ell = (g, cx, cy, rx, ry, noise = .12) => { for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy < 1 + (R() - .5) * noise * 2) g[y][x] = true; } };
  const forest = mk(), cliff = mk(), pond = mk(), deep = mk(), dirt = mk(), sand = mk(), fence = mk();
  const free = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS && !used.has(x + ',' + y);
  const claim = (x, y, w = 1, h = 1) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used.add((x + i) + ',' + (y + j)); };
  const forestOn = which === 'forest';
  // regions
  if (forestOn) { ell(forest, 2.6, 3.0, 3.6, 3.2, .3); ell(forest, 9.6, 6.6, 3.2, 3.0, .3); for (let y = 0; y < 3; y++) for (let x = 7; x < 12; x++) cliff[y][x] = true; for (let x = 8; x < 12; x++) cliff[3][x] = true; }
  else { ell(forest, 1.2, 1.2, 2.5, 2.1, .25); for (let y = 0; y < 3; y++) for (let x = 7; x < 12; x++) cliff[y][x] = true; for (let x = 9; x < 12; x++) cliff[3][x] = R() > .4; }
  ell(pond, 3.3, 6.4, 3.2, 2.6, .25);
  if (!forestOn) ell(dirt, 9.3, 6.4, 1.7, 1.2, .1);
  ell(sand, 6.2, 8.3, 1.5, 1.0, .15);
  const clear = (g, o) => { for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (o[y][x]) g[y][x] = false; };
  clear(cliff, forest); clear(pond, forest); clear(pond, cliff); clear(sand, forest); clear(sand, cliff); clear(sand, pond); clear(dirt, forest); clear(dirt, cliff); clear(dirt, pond); clear(dirt, sand);
  // keep the pond off the map border and away from other regions (one grass cell around it)
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (pond[y][x] && (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1)) pond[y][x] = false;
  const near = (g, x, y, d) => { for (let j = -d; j <= d; j++) for (let i = -d; i <= d; i++) if (!at(g, x + i, y + j) && x + i >= 0 && y + j >= 0 && x + i < COLS && y + j < ROWS) return false; return true; };
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) deep[y][x] = pond[y][x] && near(pond, x, y, 1) && ((x + .5 - 3.3) ** 2 / 2.0 ** 2 + (y + .5 - 6.4) ** 2 / 1.3 ** 2 < 1.1);
  // 1) seamless ground
  const grass = ['ground/grass-a', 'ground/grass-b', 'ground/grass-c', 'ground/grass-d'];
  const details = ['ground-detail/grass-flowers-white-a', 'ground-detail/grass-flowers-yellow-b', 'ground-detail/grass-flowers-mixed-a', 'ground-detail/grass-clover-a', 'ground-detail/grass-clover-bloom-b', 'ground-detail/grass-pebbles-a', 'ground-detail/grass-dandelions-a', 'ground-detail/grass-long-grass-b', 'ground-detail/grass-flowers-rose-a', 'ground-detail/grass-acorns-leaves-b'];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (forest[y][x] || cliff[y][x] || pond[y][x] || dirt[y][x] || sand[y][x]) continue;
    put(R() < (forestOn ? .14 : .24) ? pick(details) : pick(grass), x * S, y * S);
  }
  // 2) autotile regions
  const sets = [[forest, 'edges/forest-'], [cliff, 'edges/cliff-'], [dirt, 'edges/dirt-patch-'], [sand, 'edges/sand-patch-']];
  for (const [g, pre] of sets) for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (g[y][x]) put(pre + p3(canon(blobMask(g, x, y))), x * S, y * S);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (deep[y][x]) put('edges/water-deep-' + p3(canon(blobMask(deep, x, y))), x * S, y * S);
    else if (pond[y][x]) put('edges/water-shore-' + p3(canon(blobMask(pond, x, y))), x * S, y * S);
  }
  const occupiedRegion = (x, y) => forest[y]?.[x] || cliff[y]?.[x] || pond[y]?.[x] || dirt[y]?.[x] || sand[y]?.[x];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (forest[y][x] || cliff[y][x] || pond[y][x]) claim(x, y);
  // 3) decals + water overlays
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (dirt[y][x] && R() < .4) put(pick(['decals/pebble-scatter-a', 'decals/dry-grass-a', 'decals/mud-patch-b']), x * S, y * S);
    if (sand[y][x] && R() < .35) put(pick(['decals/pebble-scatter-b', 'decals/dry-grass-b']), x * S, y * S);
    if (pond[y][x] && !deep[y][x] && blobMask(pond, x, y) === 255 && R() < .5) put(pick(['grass/lily-pads-a', 'grass/lily-pads-b', 'grass/lily-pads-c']), x * S, y * S);
    if (deep[y][x] && R() < .25) put(pick(['grass/lily-pads-c', 'grass/lily-pads-a']), x * S, y * S);
    if (!occupiedRegion(x, y) && R() < .06) put(pick(['decals/leaf-litter-a', 'decals/blossom-petals-a', 'decals/clover-patch-b']), x * S, y * S);
  }
  // 4) props: collect with a y sort
  const props = [];
  const add = (k, x, y, kind = 'one') => { // x,y = footprint cell
    if (!has(k)) return false; const w = kind === 'large' ? 2 : 1;
    for (let i = 0; i < w; i++) if (!free(x + i, y) || (kind === 'large' && !free(x + i, y - 1))) return false;
    if (kind === 'large') claim(x, y - 1, 2, 2); else claim(x, y, w, 1);
    if (kind === 'one') props.push({ k, x: x * S, y: y * S, w: S, h: S, s: y });
    else if (kind === 'tall') props.push({ k, x: x * S, y: (y - 1) * S, w: S, h: 2 * S, s: y });
    else props.push({ k, x: x * S, y: (y - 1) * S, w: 2 * S, h: 2 * S, s: y });
    return true;
  };
  const cand = (fn) => { const o = []; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (fn(x, y) && free(x, y)) o.push([x, y]); return o; };
  const scatter = (keys, n, fn, kind = 'one') => { let tries = 0, c = 0; while (c < n && tries++ < 80) { const o = cand(fn); if (!o.length) return; const [x, y] = pick(o); if (add(pick(keys), x, y, kind)) c++; } };
  // fenced paddock with a farm gate
  if (!forestOn) {
    const x0 = 7, x1 = 11, y0 = 4, y1 = 8, gx = 9;
    const isF = (x, y) => (y === y0 || y === y1) && x >= x0 && x <= x1 || (x === x0 || x === x1) && y >= y0 && y <= y1;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) fence[y][x] = isF(x, y);
    const gateCells = [[gx, y1], [gx + 1, y1]];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (isF(x, y) && !gateCells.some(([a, b]) => a === x && b === y)) {
      const m = (y > y0 && fence[y - 1][x] ? 1 : 0) | (x < x1 && fence[y][x + 1] ? 2 : 0) | (y < y1 && fence[y + 1][x] ? 4 : 0) | (x > x0 && fence[y][x - 1] ? 8 : 0);
      const kind = (x === x0 || x === x1 || y === y0) ? 'fences/fence-wood-' : 'fences/hedge-';
      if (!dirt[y][x] || true) { claim(x, y); props.push({ k: kind + String(m).padStart(2, '0'), x: x * S, y: y * S, w: S, h: S, s: y }); }
    }
    claim(gx, y1, 2, 1); props.push({ k: 'interest/gate-farm-closed', x: gx * S, y: (y1 - 1) * S, w: 2 * S, h: 2 * S, s: y1 });
    add('props/haybale-a', 8, 5); add('props/barrel-b', 10, 5); add('props/crate-c', 8, 7); add('props/log-b', 10, 7);
  }
  // interest + landmarks
  if (!forestOn) { add('interest/torii-lit', 3, 3, 'large'); add('interest/shop-stall-a', 4, 2, 'large') || add('interest/shop-stall-a', 5, 3, 'large'); }
  else { add('interest/torii-unlit', 4, 8, 'large'); add('interest/gate-stone-closed', 8, 4, 'large'); }
  add('interest/chest-closed-a', pond[7]?.[5] ? 6 : 5, 5); add('props/signpost-a', 6, 3, 'tall') || add('props/signpost-a', 6, 4, 'tall'); add('props/stone-lantern-b', 6, 7, 'tall') || add('props/stone-lantern-b', 5, 8, 'tall');
  add('props/mushroom-ring-a', 1, 9) || add('props/mushroom-ring-a', 2, 9); add('props/stump-a', 5, 9); add('interest/secret-cache-hidden', 11, 9) || add('interest/secret-cache-hidden', 10, 9);
  // trees, bushes, rocks, reeds
  const onGrass = (x, y) => !occupiedRegion(x, y);
  scatter(['trees/oak-a', 'trees/oak-b', 'trees/oak-d', 'trees/pine-a', 'trees/pine-b', 'trees/pine-c', 'trees/blossom-a', 'trees/blossom-c', 'trees/maple-a'], forestOn ? 5 : 4, (x, y) => onGrass(x, y) && y >= 3 && y <= 8, 'tall');
  scatter(['trees/bush-round-a', 'trees/bush-round-b', 'trees/bush-berry-a', 'trees/bush-blossom-a', 'trees/bush-hydrangea-a', 'trees/bush-fern-a'], 5, (x, y) => onGrass(x, y));
  scatter(['rocks/boulder-a', 'rocks/boulder-b', 'rocks/boulder-mossy-a', 'rocks/rock-cluster-a', 'rocks/rock-small-b'], 4, (x, y) => onGrass(x, y) && (y === 3 || (!forestOn && x > 5)));
  scatter(['grass/tall-grass-a', 'grass/tall-grass-b', 'grass/tall-grass-c'], 3, (x, y) => onGrass(x, y));
  scatter(['grass/reeds-a', 'grass/reeds-b', 'grass/reeds-c'], 5, (x, y) => pond[y][x] && !deep[y][x] && blobMask(pond, x, y) !== 255);
  scatter(['rocks/standing-stone-a', 'rocks/standing-stone-b', 'trees/bamboo-a', 'trees/bamboo-b', 'trees/cedar-a'], 1, (x, y) => onGrass(x, y) && y >= 4 && x < 6, 'tall');
  props.sort((p, q) => p.s - q.s || p.x - q.x);
  for (const p of props) put(p.k, p.x, p.y, p.w, p.h);
  // 5) fog drifting in along the bottom edge
  for (let x = 0; x < COLS; x++) put('overlays/fog-edge-04', x * S, (ROWS - 1) * S);
  for (let y = 0; y < ROWS; y++) put('overlays/fog-edge-08', 0, y * S), put('overlays/fog-edge-02', (COLS - 1) * S, y * S);
  put('overlays/fog-edge-12', 0, (ROWS - 1) * S); put('overlays/fog-edge-06', (COLS - 1) * S, (ROWS - 1) * S);
  if (!forestOn) { for (const [x, y] of [[1, 1], [2, 1], [8, 4]]) if (R() < .0) put('overlays/mist-low-a', x * S, y * S); }
  else { for (let y = 3; y < 8; y++) for (let x = 0; x < COLS; x++) if (R() < .12) put('overlays/dapple-a', x * S, y * S); }
  // fireflies over the pond for charm
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (pond[y][x] && R() < .18) put('overlays/fireflies-b', x * S, y * S);
  return { w: COLS * S, h: ROWS * S, items };
}
