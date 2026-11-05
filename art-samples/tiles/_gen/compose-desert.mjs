// Desert (Ashkara) sample patch composer. Pure and self-contained (build-tileset.mjs inlines it into the gallery page for the reroll button).
// composeDesert(seed, has) -> { w, h, items:[{k,x,y,w,h}] }; keys are manifest paths minus "ashkara/common/" and ".svg", prefixed "ds:".
export function composeDesert(seed, has) {
  let a = seed >>> 0;
  const R = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = (arr) => arr[Math.floor(R() * arr.length)];
  const COLS = 12, ROWS = 10, S = 64, P = 'ds:';
  const mk = () => Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const items = [], used = new Set();
  const at = (g, x, y) => (x < 0 || y < 0 || x >= COLS || y >= ROWS) ? true : g[y][x];
  const bm = (g, x, y) => (at(g, x, y - 1) ? 1 : 0) | (at(g, x + 1, y - 1) ? 2 : 0) | (at(g, x + 1, y) ? 4 : 0) | (at(g, x + 1, y + 1) ? 8 : 0) | (at(g, x, y + 1) ? 16 : 0) | (at(g, x - 1, y + 1) ? 32 : 0) | (at(g, x - 1, y) ? 64 : 0) | (at(g, x - 1, y - 1) ? 128 : 0);
  const canon = (m) => { let o = m; if (!(m & 1 && m & 4)) o &= ~2; if (!(m & 16 && m & 4)) o &= ~8; if (!(m & 16 && m & 64)) o &= ~32; if (!(m & 1 && m & 64)) o &= ~128; return o; };
  const p3 = (m) => String(m).padStart(3, '0');
  const put = (k, x, y, w = S, h = S) => { k = P + k; if (has(k)) items.push({ k, x, y, w, h }); };
  const ell = (g, cx, cy, rx, ry, noise = .1) => { for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy < 1 + (R() - .5) * noise * 2) g[y][x] = true; } };
  const dune = mk(), cliff = mk(), pan = mk(), pool = mk(), turf = mk(), fringe = mk();
  ell(cliff, 1.6, 1.0, 2.6, 1.7, .25); ell(dune, 9.6, 1.3, 3.0, 1.5, .25); ell(pan, 9.4, 8.2, 2.3, 1.4, .15);
  const clr = (g, o) => { for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (o[y][x]) g[y][x] = false; };
  for (const [y, x0, x1] of [[5, 3, 4], [6, 2, 5], [7, 2, 5]]) for (let x = x0; x <= x1; x++) pool[y][x] = true; ell(turf, 3.5, 6.5, 3.5, 2.6, .12); ell(fringe, 3.4, 6.5, 4.3, 3.2, .12);
  clr(dune, cliff); clr(pan, cliff); clr(pan, dune); clr(turf, cliff); clr(fringe, cliff); clr(fringe, dune); clr(fringe, pan);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { if (pool[y][x] && (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1)) pool[y][x] = false; if (pool[y][x]) turf[y][x] = true; if (turf[y][x]) fringe[y][x] = false; }
  const sand = ['ground/sand-fine-a', 'ground/sand-fine-b', 'ground/sand-fine-c', 'ground/sand-fine-d', 'ground/sand-fine-a', 'ground/sand-dune-a', 'ground/sand-dune-b'], dunes = ['ground/sand-dune-a', 'ground/sand-dune-b', 'ground/sand-dune-c', 'ground/sand-dune-d'];
  const grass = ['ground/oasis-grass-a', 'ground/oasis-grass-b', 'ground/oasis-grass-c', 'ground/oasis-grass-d', 'ground/oasis-grass-a', 'ground/oasis-grass-b'];
  const detail = ['ground-detail/sand-shells-a', 'ground-detail/sand-scrub-a', 'ground/reg-gravel-a', 'ground/reg-gravel-b', 'ground-detail/dune-grass-baked-a'];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (cliff[y][x] || dune[y][x] || pan[y][x] || pool[y][x]) continue;
    if (turf[y][x]) put(pick(grass), x * S, y * S);
    else if (fringe[y][x]) put(pick(['ground/oasis-fringe-a', 'ground/oasis-fringe-b']), x * S, y * S);
    else put(R() < .2 ? pick(detail) : pick(sand), x * S, y * S);
  }
  const sets = [[dune, 'edges/dune-ridge-'], [cliff, 'edges/sandstone-cliff-'], [pan, 'edges/hardpan-patch-'], [pool, 'edges/oasis-shore-']];
  for (const [g, pre] of sets) for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (g[y][x]) put(pre + p3(canon(bm(g, x, y))), x * S, y * S);
  // mud-brick wall run
  const wall = mk();
  const wr = [[6, 4], [7, 4], [8, 4]]; for (const [x, y] of wr) if (!cliff[y][x] && !dune[y][x]) wall[y][x] = true;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (wall[y][x]) { const m = (wall[y - 1]?.[x] ? 1 : 0) | (wall[y]?.[x + 1] ? 2 : 0) | (wall[y + 1]?.[x] ? 4 : 0) | (wall[y]?.[x - 1] ? 8 : 0); put('fences/wall-mudbrick-' + String(m).padStart(2, '0'), x * S, y * S); }
  const occ = (x, y) => cliff[y]?.[x] || dune[y]?.[x] || pool[y]?.[x] || wall[y]?.[x];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (occ(x, y)) used.add(x + ',' + y);
  // decals
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (occ(x, y) || turf[y][x] || R() > .26) continue;
    put(pick(['decals/sand-ripples-a', 'decals/sand-ripples-b', 'decals/sand-ripples-c', 'decals/wind-scour-a', 'decals/pebble-scatter-a', 'decals/dry-grass-a', 'decals/dry-grass-b', 'decals/sand-drift-a', 'decals/sand-drift-b', 'decals/crack-large-a']), x * S, y * S);
  }
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (turf[y][x] && !pool[y][x] && R() < .16) put(pick(['decals/oleander-petals-a', 'decals/palm-litter-a']), x * S, y * S);
  for (const [x, y] of [[4, 2], [5, 3]]) if (!used.has(x + ',' + y)) put('decals/camel-tracks-a', x * S, y * S);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (pan[y][x] && bm(pan, x, y) === 255 && R() < .4) put(pick(['decals/crack-large-a', 'decals/crack-large-b', 'decals/bone-scatter-a']), x * S, y * S);
  // props: footprint cell (x,y); tall = 1x2 (bottom cell), large = 2x2 (bottom row)
  const props = [];
  const add = (k, x, y, kind = 'one') => { const w = kind === 'large' ? 2 : 1; for (let i = 0; i < w; i++) if (used.has((x + i) + ',' + y) || x + i >= COLS || y >= ROWS || !has(P + k)) return false; if (kind !== 'one' && y < 1) return false; props.push({ k, x, y, kind }); for (let i = 0; i < w; i++) used.add((x + i) + ',' + y); if (kind === 'large') for (let i = 0; i < 2; i++) used.add((x + i) + ',' + (y - 1)); return true; };
  // landmark: the pylon gate at the top of the dune side, a sphinx, a shop stall, a camp
  add(pick(['interest/gate-pylon-closed', 'interest/gate-pylon-open']), 5, 1, 'large');
  add('interest/sphinx-a', 3, 3, 'large'); add('interest/shop-stall-a', 8, 6, 'large'); add('props/tent-bedouin-a', 6, 9, 'large');
  add('props/campfire-lit', 8, 9); add('props/camel-a', 10, 9); add('props/camel-c', 9, 7); add('props/cargo-a', 5, 8); add('props/tea-rug-a', 7, 8);
  // oasis: palms around the pool, well, reeds
  let n = 0; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (turf[y][x] && !pool[y][x] && R() < .2 && n < 5) { if (add(pick(['trees/date-palm-a', 'trees/date-palm-b', 'trees/date-palm-c']), x, y, 'tall')) n++; }
  add('props/well-stone-a', 5, 7); add('props/shaduf-a', 1, 5, 'tall');
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (turf[y][x] && !pool[y][x] && R() < .12) add(pick(['grass/reeds-oasis-a', 'grass/reeds-oasis-b', 'grass/papyrus-a', 'trees/tamarisk-a']), x, y);
  // desert dressing on the sand
  const scatter = [['trees/acacia-a', 'tall', 2], ['trees/cactus-tall-a', 'tall', 2], ['trees/cactus-tall-b', 'tall', 1], ['trees/prickly-pear-a', 'one', 2], ['trees/agave-a', 'one', 2], ['trees/dead-tree-a', 'tall', 1], ['rocks/boulder-sandstone-a', 'one', 2], ['rocks/boulder-red-a', 'one', 1], ['rocks/rock-cluster-a', 'one', 2], ['props/skull-horned-a', 'one', 1], ['props/bones-ribcage-a', 'one', 1], ['props/jar-clay-a', 'one', 1], ['props/column-standing-b', 'tall', 1], ['props/column-toppled-a', 'one', 1], ['props/tumbleweed-a', 'one', 1], ['props/cairn-a', 'one', 1], ['trees/dry-bush-a', 'one', 2]];
  for (const [k, kind, cnt] of scatter) for (let i = 0; i < cnt; i++) for (let tr = 0; tr < 30; tr++) { const x = Math.floor(R() * COLS), y = Math.floor(R() * ROWS); if (!turf[y][x] && !fringe[y][x] && !pan[y][x] && add(k, x, y, kind)) break; }
  props.sort((p, q) => (p.y - q.y) || (p.x - q.x));
  for (const p of props) { const big = p.kind === 'large', tall = p.kind === 'tall'; put(p.k, p.x * S, (p.y - (big || tall ? 1 : 0)) * S, big ? 128 : 64, big ? 128 : tall ? 128 : 64); }
  // overlays last
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (!pool[y][x] && !cliff[y][x] && !turf[y][x] && R() < .17) put(pick(['overlays/blown-sand-a', 'overlays/blown-sand-b', 'overlays/blown-sand-c', 'overlays/heat-shimmer-a', 'overlays/heat-shimmer-b']), x * S, y * S);
    if (dune[y][x] && R() < .4) put(pick(['overlays/dune-shadow-a', 'overlays/dune-shadow-b', 'overlays/dune-shadow-c']), x * S, y * S);
  }
  put('overlays/dust-devil-a', 1 * S, 8 * S); put('overlays/sun-glare-a', 0, 0);
  return { w: COLS * S, h: ROWS * S, items };
}
