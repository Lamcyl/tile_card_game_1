// Salt Mirror sample patch composer (pure and self-contained; build-tileset.mjs inlines it for the reroll button).
// Keys: "sl:" = ashkara/salt-mirror/<cat>/<name>-<variant>, "se:" = ashkara/singing-erg/... (apricot dunes to the west), "dd:" = ashkara/dune-shallows/... (the sand to the south), "ds:" = ashkara/common/...
export function composeSaltMirror(seed, has) {
  let a = seed >>> 0;
  const R = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = (arr) => arr[Math.floor(R() * arr.length)];
  const COLS = 12, ROWS = 10, S = 64;
  const mk = () => Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const items = [], used = new Set();
  const at = (g, x, y) => (x < 0 || y < 0 || x >= COLS || y >= ROWS) ? true : g[y][x];
  const bm = (g, x, y) => (at(g, x, y - 1) ? 1 : 0) | (at(g, x + 1, y - 1) ? 2 : 0) | (at(g, x + 1, y) ? 4 : 0) | (at(g, x + 1, y + 1) ? 8 : 0) | (at(g, x, y + 1) ? 16 : 0) | (at(g, x - 1, y + 1) ? 32 : 0) | (at(g, x - 1, y) ? 64 : 0) | (at(g, x - 1, y - 1) ? 128 : 0);
  const canon = (m) => { let o = m; if (!(m & 1 && m & 4)) o &= ~2; if (!(m & 16 && m & 4)) o &= ~8; if (!(m & 16 && m & 64)) o &= ~32; if (!(m & 1 && m & 64)) o &= ~128; return o; };
  const p3 = (m) => String(m).padStart(3, '0');
  const put = (k, x, y, w = S, h = S) => { if (has(k)) items.push({ k, x, y, w, h }); };
  const ell = (g, cx, cy, rx, ry, noise = .1) => { for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy < 1 + (R() - .5) * noise * 2) g[y][x] = true; } };
  const clr = (g, o) => { for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (o[y][x]) g[y][x] = false; };
  const pool = mk(), deep = mk(), flat = mk(), shelf = mk();
  ell(pool, 6.4, 5.0, 2.6, 1.7, .2); ell(deep, 6.4, 5.0, 1.3, .8, .12); ell(flat, 2.8, 6.8, 1.3, .9, .2); ell(shelf, 9.0, 0.9, 2.5, .9, .25);
  clr(flat, pool); clr(shelf, pool); clr(shelf, flat);
  const base = ['sl:ground/salt-crust-a', 'sl:ground/salt-crust-b', 'sl:ground/salt-crust-c', 'sl:ground/salt-crust-d', 'sl:ground/salt-crust-a', 'sl:ground/salt-flat-a', 'sl:ground/salt-flat-b', 'sl:ground/salt-polygon-a', 'sl:ground/salt-polygon-b', 'sl:ground/salt-polygon-c', 'sl:ground/salt-puffed-a'];
  const special = ['sl:ground-detail/salt-crystals-a', 'sl:ground-detail/halite-cubes-a', 'sl:ground-detail/glass-shards-a', 'sl:ground-detail/bone-flecks-a', 'sl:ground-detail/salt-pebbles-a', 'sl:ground-detail/evaporation-rings-a', 'sl:ground/pan-bleached-a', 'sl:ground/mud-brine-b'];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    let k;
    if (x === 0 && y < 9) k = 'se:ground/sand-apricot-' + pick(['a', 'b', 'c', 'd']);
    else if (x === 1 && y < 9) k = 'sl:ground/salt-apricot-fringe-b';
    else if (x === 2 && y < 8) k = 'sl:ground/salt-apricot-fringe-a';
    else if (y === ROWS - 1) k = 'dd:ground/sand-cream-' + pick(['a', 'b', 'c']);
    else if (y === ROWS - 2) k = 'sl:ground/salt-cream-fringe-b';
    else if (y === ROWS - 3 && x > 1) k = 'sl:ground/salt-cream-fringe-a';
    else if (x === COLS - 1 && y > 3) k = 'ds:ground/hardpan-' + pick(['a', 'b', 'c']);
    else if (x === COLS - 2 && y > 3) k = 'sl:ground/salt-pan-fringe-b';
    else if (x === COLS - 3 && y > 4) k = 'sl:ground/salt-pan-fringe-a';
    else if (y === 0 && x > 3) k = 'sl:ground/salt-red-fringe-a';
    else k = R() < .15 ? pick(special) : pick(base);
    put(k, x * S, y * S);
  }
  const sets = [[pool, 'sl:edges/brine-pool-'], [deep, 'sl:edges/brine-deep-'], [flat, 'sl:edges/mirage-flat-'], [shelf, 'sl:edges/salt-crust-shelf-']];
  for (const [g, pre] of sets) for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (g[y][x]) put(pre + p3(canon(bm(g, x, y))), x * S, y * S);
  // connect-4 runs: a salt-block wall along the west dunes, a mine track to the shelf and a rope fence beside the pool
  const wall = mk(), track = mk(), rope = mk();
  for (const [x, y] of [[2, 2], [2, 3], [2, 4], [3, 4]]) if (!pool[y][x] && !shelf[y][x]) wall[y][x] = true;
  for (const [x, y] of [[3, 9], [4, 9], [5, 9], [6, 9]]) track[y][x] = true;
  for (const [x, y] of [[9, 4], [10, 4], [11, 4]]) if (!pool[y][x] && !shelf[y][x]) rope[y][x] = true;
  const c4 = (g, y, x) => String((g[y - 1]?.[x] ? 1 : 0) | (g[y]?.[x + 1] ? 2 : 0) | (g[y + 1]?.[x] ? 4 : 0) | (g[y]?.[x - 1] ? 8 : 0)).padStart(2, '0');
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { if (wall[y][x]) put('sl:fences/wall-salt-block-' + c4(wall, y, x), x * S, y * S); if (track[y][x]) put('sl:fences/track-mine-' + c4(track, y, x), x * S, y * S); if (rope[y][x]) put('sl:fences/fence-salt-rope-' + c4(rope, y, x), x * S, y * S); }
  const blocked = (x, y) => pool[y]?.[x] || flat[y]?.[x] || shelf[y]?.[x] || wall[y]?.[x] || track[y]?.[x] || rope[y]?.[x];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (blocked(x, y)) used.add(x + ',' + y);
  // decals
  for (let y = 0; y < ROWS; y++) for (let x = 1; x < COLS - 1; x++) if (!blocked(x, y) && R() < .24) put(pick(['sl:decals/brine-puddle-a', 'sl:decals/brine-puddle-b', 'sl:decals/crack-lines-a', 'sl:decals/crack-lines-b', 'sl:decals/salt-spill-a', 'sl:decals/bone-scatter-a', 'sl:decals/skull-bleached-a', 'sl:decals/skull-bleached-b', 'sl:decals/cart-ruts-a', 'sl:decals/flamingo-prints-a', 'sl:decals/camel-prints-a', 'sl:decals/glass-glint-a', 'sl:decals/crystal-bloom-a', 'sl:decals/salt-flakes-a', 'sl:decals/evaporation-ring-a', 'sl:decals/rust-stain-a', 'sl:decals/mirage-puddle-a']), x * S, y * S);
  const props = [];
  const add = (k, x, y, kind = 'one') => { const w = kind === 'large' ? 2 : 1; for (let i = 0; i < w; i++) if (x + i >= COLS || y >= ROWS || used.has((x + i) + ',' + y) || !has('sl:' + k)) return false; if (kind !== 'one' && y < 1) return false; if (kind === 'large') for (let i = 0; i < 2; i++) if (used.has((x + i) + ',' + (y - 1))) return false; props.push({ k: 'sl:' + k, x, y, kind }); for (let i = 0; i < w; i++) used.add((x + i) + ',' + y); if (kind === 'large') for (let i = 0; i < 2; i++) used.add((x + i) + ',' + (y - 1)); return true; };
  const addAny = (k, spots, kind = 'large') => { for (const [x, y] of spots) if (add(k, x, y, kind)) return true; return false; };
  addAny('interest/gate-salt-block-' + pick(['closed', 'open']), [[10, 3]]);                        // east edge: the salt-block gate (leads north in the full map)
  addAny('interest/salt-lake-mirage-' + pick(['a', 'b']), [[5, 2], [4, 2], [4, 1]]);               // the landmark
  addAny('interest/mining-shack-a', [[1, 9]]); addAny('interest/ore-hoist-a', [[8, 9], [7, 9]]); addAny('interest/salt-works-a', [[10, 7], [10, 8]]);
  addAny('interest/cart-wreck-a', [[5, 8], [6, 8], [4, 8]]); addAny('interest/salt-pillar-grove-a', [[3, 3], [2, 6], [4, 3]]); addAny('interest/brine-spring-a', [[11, 9], [11, 6]]);
  addAny('interest/crystal-cave-a', [[7, 3], [1, 3]]); addAny('interest/caravan-remains-a', [[1, 7], [2, 7]]);
  add('interest/chest-salt-closed', 5, 4); add('props/mining-cart-' + pick(['a', 'b', 'c']), 7, 7); add('props/flamingo-' + pick(['a', 'b', 'c']), 7, 3); add('props/flamingo-' + pick(['a', 'b']), 5, 3); add('interest/salt-statue-' + pick(['a', 'b']), 3, 6, 'tall');
  const scatter = [['trees/dead-tree-salt-a', 'tall', 1], ['trees/dead-tree-salt-b', 'tall', 1], ['trees/dead-tree-salt-c', 'tall', 1], ['trees/dead-palm-salt-a', 'tall', 1], ['trees/tamarisk-salt-a', 'one', 2], ['trees/samphire-a', 'one', 2], ['trees/samphire-b', 'one', 1], ['trees/saltbush-a', 'one', 1], ['trees/stump-salt-a', 'one', 1], ['trees/dead-shrub-salt-a', 'one', 1], ['rocks/salt-pillar-a', 'tall', 1], ['rocks/salt-pillar-b', 'tall', 1], ['rocks/salt-pillar-c', 'tall', 1], ['rocks/salt-boulder-a', 'one', 2], ['rocks/salt-boulder-b', 'one', 1], ['rocks/salt-cluster-a', 'one', 2], ['rocks/salt-cluster-b', 'one', 1], ['rocks/salt-mushroom-a', 'one', 1], ['rocks/salt-block-cairn-a', 'one', 1], ['rocks/salt-block-cairn-c', 'one', 1], ['rocks/gypsum-rose-a', 'one', 1], ['rocks/halite-cube-a', 'one', 1], ['grass/salt-grass-a', 'one', 2], ['grass/salt-grass-c', 'one', 1], ['grass/brine-reed-a', 'tall', 1], ['props/skull-ox-a', 'one', 1], ['props/skull-ox-b', 'one', 1], ['props/skull-camel-a', 'one', 1], ['props/bone-pile-a', 'one', 1], ['props/glass-shards-a', 'one', 1], ['props/salt-pile-a', 'one', 1], ['props/salt-sack-a', 'one', 1], ['props/barrel-brine-a', 'one', 1], ['props/mirage-pole-a', 'tall', 1], ['props/salt-brick-stack-a', 'one', 1]];
  for (const [k, kind, cnt] of scatter) for (let i = 0; i < cnt; i++) for (let tr = 0; tr < 40; tr++) { const x = Math.floor(R() * (COLS - 3)) + 1, y = Math.floor(R() * (ROWS - 1)); if (add(k, x, y, kind)) break; }
  props.sort((p, q) => (p.y - q.y) || (p.x - q.x));
  for (const p of props) { const big = p.kind === 'large', tall = p.kind === 'tall'; put(p.k, p.x * S, (p.y - (big || tall ? 1 : 0)) * S, big ? 128 : 64, big ? 128 : tall ? 128 : 64); }
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { if (pool[y][x] && R() < .4) put(pick(['sl:overlays/brine-sheen-a', 'sl:overlays/salt-sparkle-a']), x * S, y * S); else if (flat[y][x] && R() < .7) put(pick(['sl:overlays/mirage-shimmer-a', 'sl:overlays/mirage-shimmer-b', 'sl:overlays/mirage-reflection-c']), x * S, y * S); else if (R() < .08) put(pick(['sl:overlays/salt-dust-a', 'sl:overlays/salt-sparkle-a', 'sl:overlays/mirage-shimmer-c', 'sl:overlays/glare-bloom-a']), x * S, y * S); }
  put('sl:overlays/cold-light-a', 0, 0);
  return { w: COLS * S, h: ROWS * S, items };
}
