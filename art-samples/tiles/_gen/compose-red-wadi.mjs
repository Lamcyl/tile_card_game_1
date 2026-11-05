// Red Wadi sample patch composer (pure and self-contained; build-tileset.mjs inlines it for the reroll button).
// Keys: "rw:" = ashkara/red-wadi/<cat>/<name>-<variant>, "sl:" = ashkara/salt-mirror/... (the crust to the south), "ds:" = ashkara/common/...
export function composeRedWadi(seed, has) {
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
  const bed = mk(), pool = mk(), cliff = mk();
  for (let x = 1; x < COLS; x++) { const cy = 5.6 + Math.sin(x * .7) * .7; for (let y = 0; y < ROWS; y++) if (Math.abs(y + .5 - cy) < .95) bed[y][x] = true; }
  ell(pool, 4.6, 5.9, 1.4, .9, .15); ell(cliff, 6.5, 0.7, 5.2, 1.5, .2);
  clr(cliff, bed);
  const base = ['rw:ground/terra-shelf-a', 'rw:ground/terra-shelf-b', 'rw:ground/terra-shelf-c', 'rw:ground/terra-shelf-d', 'rw:ground/terra-strata-a', 'rw:ground/terra-strata-b', 'rw:ground/ochre-sand-a', 'rw:ground/ochre-sand-b', 'rw:ground/red-sand-a', 'rw:ground/red-sand-b', 'rw:ground/clay-cracked-a', 'rw:ground/terra-shelf-a'];
  const special = ['rw:ground-detail/strata-lines-a', 'rw:ground-detail/quartz-veins-a', 'rw:ground-detail/iron-nodules-a', 'rw:ground-detail/potsherds-a', 'rw:ground-detail/ammonite-a', 'rw:ground-detail/goat-prints-a', 'rw:ground-detail/dry-tufts-a', 'rw:ground-detail/lichen-patch-a', 'rw:ground-detail/rain-pits-a'];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    let k;
    if (y === ROWS - 1) k = 'sl:ground/salt-crust-' + pick(['a', 'b', 'c']);
    else if (y === ROWS - 2) k = 'rw:ground/terra-salt-fringe-b';
    else if (y === ROWS - 3 && x > 3) k = 'rw:ground/terra-salt-fringe-a';
    else if (x === 0 && y > 2 && y < 9) k = 'rw:ground/terra-bazaar-fringe-b';
    else if (x === 1 && y > 2 && y < 9) k = 'rw:ground/terra-bazaar-fringe-a';
    else if (x === COLS - 1 && y < 3) k = 'rw:ground/terra-gold-fringe-b';
    else if (x === COLS - 2 && y < 2) k = 'rw:ground/terra-gold-fringe-a';
    else if (x === COLS - 1 && y > 2 && y < 6) k = 'ds:ground/sand-fine-' + pick(['a', 'b', 'c']);
    else if (x === COLS - 2 && y > 2 && y < 6) k = 'rw:ground/terra-sand-fringe-b';
    else if (x === COLS - 3 && y > 2 && y < 6) k = 'rw:ground/terra-sand-fringe-a';
    else k = R() < .16 ? pick(special) : pick(base);
    put(k, x * S, y * S);
  }
  const sets = [[cliff, 'rw:edges/red-cliff-'], [bed, 'rw:edges/wadi-bed-'], [pool, 'rw:edges/wadi-pool-']];
  for (const [g, pre] of sets) for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (g[y][x]) put(pre + p3(canon(bm(g, x, y))), x * S, y * S);
  const wall = mk(), bridge = mk();
  for (const [x, y] of [[2, 8], [3, 8], [4, 8], [4, 7]]) if (!bed[y][x]) wall[y][x] = true;
  for (let y = 4; y <= 7; y++) if (bed[y][8] || y === 4 || y === 7) bridge[y][8] = true;
  const c4 = (g, y, x) => String((g[y - 1]?.[x] ? 1 : 0) | (g[y]?.[x + 1] ? 2 : 0) | (g[y + 1]?.[x] ? 4 : 0) | (g[y]?.[x - 1] ? 8 : 0)).padStart(2, '0');
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { if (wall[y][x]) put('rw:fences/wall-red-stone-' + c4(wall, y, x), x * S, y * S); if (bridge[y][x]) put('rw:fences/bridge-rope-' + c4(bridge, y, x), x * S, y * S); }
  const blocked = (x, y) => bed[y]?.[x] || cliff[y]?.[x] || pool[y]?.[x] || wall[y]?.[x] || bridge[y]?.[x];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (blocked(x, y)) used.add(x + ',' + y);
  for (let y = 0; y < ROWS - 1; y++) for (let x = 2; x < COLS - 1; x++) if (!blocked(x, y) && R() < .22) put(pick(['rw:decals/dry-puddle-a', 'rw:decals/dry-puddle-b', 'rw:decals/crack-lines-a', 'rw:decals/crack-lines-b', 'rw:decals/rock-chips-a', 'rw:decals/rock-chips-b', 'rw:decals/sand-drift-a', 'rw:decals/sand-drift-b', 'rw:decals/goat-trail-a', 'rw:decals/bone-scatter-a', 'rw:decals/ochre-stain-a', 'rw:decals/flood-stain-a', 'rw:decals/camel-prints-a']), x * S, y * S);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (bed[y][x] && !pool[y][x] && R() < .35) put(pick(['rw:decals/gravel-bar-a', 'rw:decals/flood-line-a', 'rw:decals/litter-twigs-a', 'rw:decals/rock-chips-b']), x * S, y * S);
  const props = [];
  const add = (k, x, y, kind = 'one') => { const w = kind === 'large' ? 2 : 1; for (let i = 0; i < w; i++) if (x + i >= COLS || y >= ROWS || used.has((x + i) + ',' + y) || !has('rw:' + k)) return false; if (kind !== 'one' && y < 1) return false; if (kind === 'large') for (let i = 0; i < 2; i++) if (used.has((x + i) + ',' + (y - 1))) return false; props.push({ k: 'rw:' + k, x, y, kind }); for (let i = 0; i < w; i++) used.add((x + i) + ',' + y); if (kind === 'large') for (let i = 0; i < 2; i++) used.add((x + i) + ',' + (y - 1)); return true; };
  const addAny = (k, spots, kind = 'large') => { for (const [x, y] of spots) if (add(k, x, y, kind)) return true; return false; };
  // cliff shelf cells are marked used; the landmark and dwellings sit in front of it at the cliff foot, so free those spots first
  const free = (cells) => { for (const [x, y] of cells) used.delete(x + ',' + y); };
  free([[5, 1], [6, 1], [5, 0], [6, 0], [8, 1], [9, 1], [8, 0], [9, 0], [2, 1], [3, 1], [2, 0], [3, 0]]);
  addAny('interest/rock-cut-facade-' + pick(['a', 'b']), [[5, 1]]);                                 // the landmark, carved into the cliff band
  addAny('interest/cliff-dwelling-' + pick(['a', 'b']), [[8, 1]]);
  addAny('interest/gate-rock-cut-door-' + pick(['closed', 'open']), [[0, 3], [0, 4]]);              // west edge: the canyon door (leads west in the full map)
  addAny('interest/wadi-spring-a', [[7, 8], [6, 8]]); addAny('interest/hoodoo-grove-a', [[10, 9], [10, 8]]); addAny('interest/flood-wreck-a', [[2, 5], [2, 6]]);
  addAny('interest/bedouin-camp-a', [[10, 4], [9, 4]]);
  add('interest/chest-red-closed', 6, 3); add('interest/high-place-altar-a', 3, 3); add('interest/stele-carved-' + pick(['a', 'b']), 9, 3, 'tall'); add('interest/obelisk-rock-cut-a', 11, 8, 'tall');
  add('props/goat-' + pick(['a', 'b']), 5, 4); add('props/goat-' + pick(['a', 'b']), 6, 7); add('props/cave-mouth-' + pick(['a', 'b']), 4, 2); add('props/rope-ladder-' + pick(['a', 'b']), 4, 3, 'tall');
  const scatter = [['trees/juniper-twisted-a', 'tall', 1], ['trees/juniper-twisted-b', 'tall', 1], ['trees/juniper-twisted-c', 'tall', 1], ['trees/wild-fig-a', 'tall', 1], ['trees/dead-snag-a', 'tall', 1], ['trees/dead-snag-b', 'tall', 1], ['trees/tamarisk-wadi-a', 'one', 2], ['trees/tamarisk-wadi-b', 'one', 1], ['trees/caper-bush-a', 'one', 2], ['trees/oleander-wild-a', 'one', 1], ['trees/oleander-wild-b', 'one', 1],
    ['rocks/hoodoo-spire-a', 'tall', 1], ['rocks/hoodoo-spire-b', 'tall', 1], ['rocks/hoodoo-spire-c', 'tall', 1], ['rocks/hoodoo-spire-d', 'tall', 1], ['rocks/balanced-rock-a', 'tall', 1], ['rocks/red-boulder-a', 'one', 2], ['rocks/red-boulder-b', 'one', 2], ['rocks/red-boulder-c', 'one', 1], ['rocks/red-rubble-a', 'one', 2], ['rocks/red-rubble-b', 'one', 1], ['rocks/strata-slab-a', 'one', 1], ['rocks/strata-slab-b', 'one', 1], ['rocks/scree-slope-a', 'one', 1],
    ['grass/red-grass-a', 'one', 3], ['grass/red-grass-b', 'one', 2], ['grass/thornbush-a', 'one', 2], ['grass/thornbush-b', 'one', 1], ['grass/wadi-reed-a', 'tall', 1], ['grass/dry-sedge-a', 'one', 1],
    ['props/flood-debris-a', 'one', 1], ['props/flood-debris-b', 'one', 1], ['props/driftwood-a', 'one', 1], ['props/clay-jar-a', 'one', 1], ['props/cairn-red-a', 'one', 1], ['props/cairn-red-b', 'one', 1], ['props/rock-cut-steps-a', 'one', 1], ['props/torch-sconce-a', 'one', 1], ['props/water-skin-a', 'one', 1]];
  for (const [k, kind, cnt] of scatter) for (let i = 0; i < cnt; i++) for (let tr = 0; tr < 40; tr++) { const x = Math.floor(R() * (COLS - 3)) + 2, y = Math.floor(R() * (ROWS - 2)) + 1; if (add(k, x, y, kind)) break; }
  props.sort((p, q) => (p.y - q.y) || (p.x - q.x));
  for (const p of props) { const big = p.kind === 'large', tall = p.kind === 'tall'; put(p.k, p.x * S, (p.y - (big || tall ? 1 : 0)) * S, big ? 128 : 64, big ? 128 : tall ? 128 : 64); }
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { if (pool[y][x] && R() < .5) put('rw:overlays/wet-sheen-a', x * S, y * S); else if (R() < .07) put(pick(['rw:overlays/red-dust-a', 'rw:overlays/sun-shaft-a', 'rw:overlays/flood-mist-a', 'rw:overlays/heat-haze-a']), x * S, y * S); }
  return { w: COLS * S, h: ROWS * S, items };
}
