// Dust Bazaar sample patch composer (pure and self-contained; build-tileset.mjs inlines it for the reroll button).
// Keys: "bz:" = ashkara/dust-bazaar/<cat>/<name>-<variant>, "rw:" = ashkara/red-wadi/... (terracotta to the east), "ds:" = ashkara/common/...
export function composeDustBazaar(seed, has) {
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
  const rectG = (g, x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = true; };
  const clr = (g, o) => { for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (o[y][x]) g[y][x] = false; };
  const block = mk(), plaza = mk(), awn = mk(), wall = mk(), rail = mk();
  rectG(block, 0, 0, 4, 1); rectG(block, 7, 0, 11, 1);
  ell(plaza, 6.5, 5.3, 3, 2.1, .12); rectG(plaza, 5, 2, 6, 2);                       // plaza with a stub toward the gate
  rectG(awn, 2, 2, 4, 2); rectG(awn, 8, 2, 10, 2); rectG(awn, 9, 8, 10, 8);
  for (const [x, y] of [[1, 8], [2, 8], [3, 8], [3, 7]]) wall[y][x] = true;
  for (const y of [5, 6, 7]) rail[y][11] = true;
  clr(plaza, block); clr(plaza, awn);
  const base = ['bz:ground/packed-earth-a', 'bz:ground/packed-earth-b', 'bz:ground/packed-earth-c', 'bz:ground/packed-earth-d', 'bz:ground/earth-swept-a', 'bz:ground/earth-swept-b', 'bz:ground/dust-fine-a', 'bz:ground/earth-trampled-a', 'bz:ground/earth-trampled-b', 'bz:ground/packed-earth-a'];
  const special = ['bz:ground-detail/dung-pats-a', 'bz:ground-detail/spice-spill-a', 'bz:ground-detail/spice-spill-b', 'bz:ground-detail/coins-scatter-a', 'bz:ground-detail/potsherds-a', 'bz:ground-detail/cloth-scraps-a', 'bz:ground-detail/dates-fallen-a', 'bz:ground-detail/grain-spill-a', 'bz:ground-detail/dye-spill-a', 'bz:ground-detail/straw-bundles-a', 'bz:ground-detail/rope-coil-a'];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    let k;
    if (y === ROWS - 1) k = 'bz:ground/bazaar-apricot-fringe-b';
    else if (y === ROWS - 2 && x > 1) k = 'bz:ground/bazaar-apricot-fringe-a';
    else if (x === COLS - 1) k = 'bz:ground/bazaar-terra-fringe-b';
    else if (x === COLS - 2 && y > 2) k = 'bz:ground/bazaar-terra-fringe-a';
    else if (x === 0 && y > 4 && y < 8) k = 'bz:ground/bazaar-sand-fringe-a';
    else if (y === 2 && x < 5 && x > 4) k = 'bz:ground/bazaar-slab-fringe-a';
    else if (y < 2 && !block[y][x]) k = 'bz:ground/bazaar-slab-fringe-' + (y ? 'a' : 'b');
    else if (y >= 6 && y <= 8 && x >= 4 && x <= 6 && R() < .5) k = pick(['bz:ground/straw-litter-a', 'bz:ground/straw-litter-b', 'bz:ground/earth-trampled-c']);
    else k = R() < .18 ? pick(special) : pick(base);
    put(k, x * S, y * S);
  }
  // east edge continues into the Red Wadi terracotta
  for (let y = 0; y < ROWS; y++) if (R() < 0) put('rw:ground/terra-shelf-a', (COLS - 1) * S, y * S);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (plaza[y][x]) put('bz:ground/plaza-slab-' + pick(['a', 'b', 'c', 'd']), x * S, y * S);
  const sets = [[plaza, 'bz:edges/plaza-paving-'], [block, 'bz:edges/mudbrick-block-'], [awn, 'bz:edges/awning-cloth-']];
  for (const [g, pre] of sets) for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (g[y][x]) put(pre + p3(canon(bm(g, x, y))), x * S, y * S);
  const c4 = (g, y, x) => String((g[y - 1]?.[x] ? 1 : 0) | (g[y]?.[x + 1] ? 2 : 0) | (g[y + 1]?.[x] ? 4 : 0) | (g[y]?.[x - 1] ? 8 : 0)).padStart(2, '0');
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { if (wall[y][x]) put('bz:fences/wall-mudbrick-' + c4(wall, y, x), x * S, y * S); if (rail[y][x]) put('bz:fences/rail-hitching-' + c4(rail, y, x), x * S, y * S); }
  const blocked = (x, y) => block[y]?.[x] || plaza[y]?.[x] && false || awn[y]?.[x] || wall[y]?.[x] || rail[y]?.[x];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (blocked(x, y)) used.add(x + ',' + y);
  for (let y = 2; y < ROWS - 1; y++) for (let x = 1; x < COLS - 1; x++) if (!blocked(x, y) && R() < .2) put(pick(['bz:decals/puddle-muddy-a', 'bz:decals/camel-prints-a', 'bz:decals/camel-prints-b', 'bz:decals/wheel-ruts-a', 'bz:decals/sandal-prints-a', 'bz:decals/spice-spill-a', 'bz:decals/spice-spill-b', 'bz:decals/spice-spill-c', 'bz:decals/cloth-scrap-a', 'bz:decals/cloth-scrap-b', 'bz:decals/straw-scatter-a', 'bz:decals/dung-trail-a', 'bz:decals/coin-scatter-a', 'bz:decals/crack-lines-a', 'bz:decals/brick-chips-a', 'bz:decals/dye-stain-a', 'bz:decals/grain-spill-a']), x * S, y * S);
  const props = [];
  const add = (k, x, y, kind = 'one') => { const w = kind === 'large' ? 2 : 1; for (let i = 0; i < w; i++) if (x + i >= COLS || y >= ROWS || used.has((x + i) + ',' + y) || !has('bz:' + k)) return false; if (kind !== 'one' && y < 1) return false; if (kind === 'large') for (let i = 0; i < 2; i++) if (used.has((x + i) + ',' + (y - 1))) return false; props.push({ k: 'bz:' + k, x, y, kind }); for (let i = 0; i < w; i++) used.add((x + i) + ',' + y); if (kind === 'large') for (let i = 0; i < 2; i++) used.add((x + i) + ',' + (y - 1)); return true; };
  const addAny = (k, spots, kind = 'large') => { for (const [x, y] of spots) if (add(k, x, y, kind)) return true; return false; };
  const free = (cells) => { for (const [x, y] of cells) used.delete(x + ',' + y); };
  free([[5, 1], [6, 1], [5, 0], [6, 0]]);
  addAny('interest/gate-bazaar-city-' + pick(['closed', 'open']), [[5, 1]]);                            // north edge: the city gate toward the ruined avenue
  addAny('interest/caravanserai-court-' + pick(['a', 'b']), [[0, 5]]);                                   // the landmark
  addAny('interest/well-court-' + pick(['a', 'b']), [[6, 6], [5, 6]]);
  for (const [k, spots] of [['stall-spice-a', [[8, 4]]], ['stall-rug-b', [[8, 5], [9, 4]]], ['stall-pottery-a', [[3, 5], [2, 4]]], ['stall-lamp-a', [[3, 4], [4, 4]]], ['rug-merchant-a', [[2, 7], [4, 7]]], ['caravan-wagon-b', [[9, 7], [8, 8]]], ['dyer-vats-a', [[3, 9], [6, 9]]]]) addAny('interest/' + k, spots);
  addAny('interest/mudbrick-house-' + pick(['a', 'b', 'c']), [[10, 4], [9, 4], [10, 6]]);
  add('interest/mudbrick-tower-' + pick(['a', 'b']), 4, 3, 'tall'); add('interest/chest-bazaar-closed', 1, 4);
  add('props/camel-kneeling-' + pick(['a', 'b']), 10, 5); add('props/camel-kneeling-' + pick(['a', 'b']), 10, 6); add('props/brazier-a', 7, 4); add('props/teapots-a', 6, 4);
  add('props/banner-pole-' + pick(['a', 'b', 'c']), 5, 3, 'tall'); add('props/lamp-post-a', 8, 3, 'tall'); add('props/lamp-post-b', 4, 6, 'tall');
  const scatter = [['trees/fig-court-a', 'tall', 1], ['trees/acacia-shade-b', 'tall', 1], ['trees/pomegranate-pot-a', 'one', 1], ['trees/pomegranate-pot-b', 'one', 1], ['trees/trellis-vine-a', 'one', 1], ['trees/trellis-vine-b', 'one', 1],
    ['rocks/brick-fall-a', 'one', 1], ['rocks/ruined-wall-a', 'one', 1], ['rocks/ruined-wall-b', 'one', 1], ['rocks/column-stump-a', 'one', 1], ['rocks/millstone-a', 'one', 1], ['rocks/stone-trough-a', 'one', 1], ['rocks/rubble-pile-a', 'one', 1],
    ['grass/weeds-dry-a', 'one', 2], ['grass/thistle-a', 'one', 1], ['grass/hay-tuft-a', 'one', 1], ['grass/reed-bundle-a', 'tall', 1],
    ['props/sacks-a', 'one', 1], ['props/sacks-b', 'one', 1], ['props/sacks-c', 'one', 1], ['props/crates-fruit-a', 'one', 1], ['props/crates-goods-a', 'one', 1], ['props/barrel-a', 'one', 1], ['props/barrel-b', 'one', 1], ['props/jar-big-a', 'one', 1], ['props/jar-big-b', 'one', 1], ['props/rug-rolls-a', 'one', 1], ['props/rug-stack-a', 'one', 1],
    ['props/cushions-a', 'one', 1], ['props/tea-table-a', 'one', 1], ['props/hitching-post-a', 'one', 1], ['props/hitching-post-b', 'one', 1], ['props/hay-bale-a', 'one', 1], ['props/cloth-rack-a', 'tall', 1], ['props/awning-pole-a', 'one', 1], ['props/awning-pole-b', 'one', 1], ['props/awning-pole-c', 'one', 1],
    ['props/mud-oven-a', 'one', 1], ['props/bread-basket-a', 'one', 1], ['props/signboard-a', 'one', 1], ['props/notice-board-a', 'one', 1], ['props/merchant-scales-a', 'one', 1], ['props/hookah-a', 'one', 1], ['props/dung-cakes-a', 'one', 1], ['props/cloth-bundle-a', 'one', 1], ['props/brick-pile-a', 'one', 1], ['props/chicken-coop-a', 'one', 1], ['props/water-skin-a', 'one', 1], ['props/amphora-rack-a', 'one', 1], ['props/lantern-hanging-a', 'one', 1]];
  for (const [k, kind, cnt] of scatter) for (let i = 0; i < cnt; i++) for (let tr = 0; tr < 40; tr++) { const x = Math.floor(R() * (COLS - 3)) + 1, y = Math.floor(R() * (ROWS - 2)) + 1; if (add(k, x, y, kind)) break; }
  props.sort((p, q) => (p.y - q.y) || (p.x - q.x));
  for (const p of props) { const big = p.kind === 'large', tall = p.kind === 'tall'; put(p.k, p.x * S, (p.y - (big || tall ? 1 : 0)) * S, big ? 128 : 64, big ? 128 : tall ? 128 : 64); }
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { if (awn[y][x] && R() < .5) put('bz:overlays/awning-shade-a', x * S, y * S); else if (R() < .07) put(pick(['bz:overlays/dust-haze-a', 'bz:overlays/cooking-smoke-a', 'bz:overlays/spice-haze-a', 'bz:overlays/lantern-glow-a', 'bz:overlays/sun-shaft-a']), x * S, y * S); }
  return { w: COLS * S, h: ROWS * S, items };
}
