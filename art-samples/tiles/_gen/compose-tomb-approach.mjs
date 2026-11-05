// Tomb Approach sample patch composer (pure and self-contained; build-tileset.mjs inlines it for the reroll button).
// Layout (north up): rows 0-5 are the open-roof entrance hall behind a pylon wall (painted hall walls with a 3/4 cap and face, colonnades, braziers, painted aisle to the sealed tomb door);
// rows 6-9 are the sphinx avenue running off the south edge toward the Dust Bazaar.
// Keys: "ta:" = ashkara/tomb-approach/<cat>/<name>-<variant>, "ds:" = ashkara/common/..., "bz:" = ashkara/dust-bazaar/...
export function composeTombApproach(seed, has) {
  let a = seed >>> 0;
  const R = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = (arr) => arr[Math.floor(R() * arr.length)];
  const COLS = 12, ROWS = 10, S = 64;
  const mk = () => Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const items = [];
  const put = (k, x, y, w = S, h = S) => { if (has(k)) items.push({ k, x, y, w, h }); };
  const canon = (m) => { let o = m; if (!(m & 1 && m & 4)) o &= ~2; if (!(m & 16 && m & 4)) o &= ~8; if (!(m & 16 && m & 64)) o &= ~32; if (!(m & 1 && m & 64)) o &= ~128; return o; };
  const p3 = (m) => String(m).padStart(3, '0');
  const bmask = (g, x, y, oob) => { const at = (xx, yy) => (xx < 0 || xx >= COLS || yy < 0) ? oob.side : yy >= ROWS ? oob.bottom : g[yy][xx]; return (at(x, y - 1) ? 1 : 0) | (at(x + 1, y - 1) ? 2 : 0) | (at(x + 1, y) ? 4 : 0) | (at(x + 1, y + 1) ? 8 : 0) | (at(x, y + 1) ? 16 : 0) | (at(x - 1, y + 1) ? 32 : 0) | (at(x - 1, y) ? 64 : 0) | (at(x - 1, y - 1) ? 128 : 0); };
  const c4 = (g, y, x) => String((g[y - 1]?.[x] ? 1 : 0) | (g[y]?.[x + 1] ? 2 : 0) | (g[y + 1]?.[x] ? 4 : 0) | (g[y]?.[x - 1] ? 8 : 0)).padStart(2, '0');
  const solid = mk(), hallFloor = mk(), avenue = mk(), drift = mk(), col = mk(), aisle = mk();
  // walls: back wall rows 0-1 (gate gap at cols 5-6), side walls, pylon wall on row 5 with an opening at cols 5-6
  for (let x = 0; x < COLS; x++) { solid[0][x] = solid[1][x] = true; }
  solid[0][5] = solid[0][6] = solid[1][5] = solid[1][6] = false;
  for (let y = 0; y <= 5; y++) solid[y][0] = solid[y][COLS - 1] = true;
  for (let x = 0; x < COLS; x++) if (x < 5 || x > 6) solid[5][x] = true;
  for (let y = 2; y <= 4; y++) for (let x = 1; x < COLS - 1; x++) hallFloor[y][x] = true;
  for (let y = 2; y <= 4; y++) { aisle[y][5] = aisle[y][6] = true; }
  for (let y = 6; y < ROWS; y++) for (let x = 4; x <= 7; x++) avenue[y][x] = true;
  for (const [x, y] of [[8, 3], [9, 3], [9, 4], [10, 4], [1, 4], [2, 4]]) drift[y][x] = true;
  for (let x = 1; x <= 4; x++) col[3][x] = true; for (let x = 7; x <= 10; x++) col[3][x] = true;
  // ---- ground ----
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    let k;
    if (y <= 5) {
      if (aisle[y][x] && y >= 2) k = 'ta:ground/hall-painted-' + (y === 2 ? 'band-a' : pick(['lotus-a', 'lotus-b']));
      else if (y === 2 && (x === 4 || x === 7)) k = 'ta:ground/hall-inlay-a';
      else if (y === 3 && !aisle[y][x]) k = pick(['ta:ground/hall-shade-a', 'ta:ground/hall-shade-b']);
      else k = R() < .12 ? pick(['ta:ground/hall-rubble-a', 'ta:ground/hall-cracked-a', 'ta:ground/hall-drift-a', 'ta:ground/hall-drift-b']) : pick(['ta:ground/hall-flag-a', 'ta:ground/hall-flag-b', 'ta:ground/hall-flag-c']);
    } else if (y >= 8 && (x < 4 || x > 7) && (x < 3 || x > 8)) k = pick(['ta:ground/bazaar-avenue-fringe-a', 'ta:ground/bazaar-avenue-fringe-b']);
    else k = pick(['ds:ground/sand-dune-a', 'ds:ground/sand-dune-b', 'ds:ground/sand-dune-c', 'ds:ground/sand-fine-a', 'ds:ground/sand-fine-b']);
    put(k, x * S, y * S);
  }
  const special = ['ta:ground-detail/floor-scarab-a', 'ta:ground-detail/gold-scatter-a', 'ta:ground-detail/potsherds-a', 'ta:ground-detail/candle-stubs-a', 'ta:ground-detail/lapis-flakes-a', 'ta:ground-detail/linen-strips-a', 'ta:ground-detail/dried-lotus-a', 'ta:ground-detail/bone-scraps-a'];
  for (let y = 2; y <= 4; y++) for (let x = 1; x < COLS - 1; x++) if (!aisle[y][x] && R() < .13) put(pick(special), x * S, y * S);
  put('ta:ground-detail/floor-sun-disc-a', 5 * S, 3 * S); put('ta:ground-detail/floor-eye-a', 6 * S, 3 * S); put('ta:ground-detail/floor-ankh-a', 6 * S, 4 * S);
  // ---- autotiles ----
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (avenue[y][x]) put('ta:edges/avenue-paving-' + p3(canon(bmask(avenue, x, y, { side: false, bottom: true }))), x * S, y * S);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (drift[y][x]) put('ta:edges/sand-drift-' + p3(canon(bmask(drift, x, y, { side: false, bottom: false }))), x * S, y * S);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (solid[y][x]) put((y <= 4 ? 'ta:edges/hall-wall-' : 'ta:edges/tomb-wall-') + p3(canon(bmask(solid, x, y, { side: true, bottom: false }))), x * S, y * S);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (col[y][x]) put('ta:fences/colonnade-' + c4(col, y, x), x * S, y * S);
  // painted wall scenes on the south face of the back wall
  const wp = ['a', 'b', 'c', 'd', 'e', 'f'];
  for (let x = 1; x < COLS - 1; x++) if (solid[1][x]) { if (R() < .75) put('ta:decals/wall-paint-' + pick(wp), x * S, S); else put('ta:decals/' + pick(['wall-cracks-a', 'wall-damage-a', 'wall-sand-a']), x * S, S); }
  // ---- objects ----
  const used = new Set(), props = [];
  const cell = (x, y) => x + ',' + y;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (solid[y][x] || col[y][x] || avenue[y][x]) used.add(cell(x, y));
  const add = (k, x, y, kind = 'one') => { const w = kind === 'large' ? 2 : 1; if (!has(k)) return false; for (let i = 0; i < w; i++) if (x + i >= COLS || used.has(cell(x + i, y))) return false; for (let i = 0; i < w; i++) used.add(cell(x + i, y)); props.push({ k, x, y, kind }); return true; };
  // gate, landmark, pylon towers
  props.push({ k: 'ta:interest/gate-tomb-sealed-' + pick(['closed', 'open']), x: 5, y: 1, kind: 'large' });
  props.push({ k: 'ta:interest/entrance-hall-a', x: 5, y: 5, kind: 'large' });
  used.add(cell(5, 5)); used.add(cell(6, 5));
  add('ta:props/brazier-pillar-' + pick(['a', 'a', 'b']), 4, 2, 'tall'); add('ta:props/brazier-pillar-' + pick(['a', 'a', 'b']), 7, 2, 'tall');
  add('ta:props/statue-anubis-' + pick(['a', 'b']), 1, 2, 'tall'); add('ta:props/statue-anubis-' + pick(['a', 'b']), 10, 2, 'tall');
  add('ta:interest/pylon-tower-' + pick(['a', 'b']), 4, 5, 'tall'); add('ta:interest/pylon-tower-' + pick(['a', 'b']), 7, 5, 'tall');
  // the sphinx avenue
  for (const y of [6, 8]) { add('ta:props/statue-sphinx-a', 3, y); add('ta:props/statue-sphinx-b', 8, y); }
  add('ta:props/statue-ram-' + pick(['a', 'b']), 3, 7); add('ta:props/statue-ram-' + pick(['b', 'a']), 8, 7);
  add('ta:trees/palm-date-' + pick(['a', 'b']), 1, 7, 'tall'); add('ta:trees/palm-date-' + pick(['a', 'b']), 10, 8, 'tall');
  add('ta:interest/sphinx-great-a', 0, 9, 'large');
  add('ta:trees/acacia-lone-a', 11, 7, 'tall');
  // hall furnishings
  add('ta:props/sarcophagus-' + pick(['a', 'b', 'c']), 2, 4); add('ta:props/canopic-jars-' + pick(['a', 'b']), 9, 4); add('ta:props/offering-table-a', 8, 2); add('ta:props/treasure-heap-a', 2, 2);
  add('ta:props/papyrus-scrolls-a', 3, 4); add('ta:props/column-broken-' + pick(['a', 'b']), 8, 4); add('ta:props/mummy-case-' + pick(['a', 'b']), 3, 2, 'tall'); add('ta:props/obelisk-small-' + pick(['a', 'b']), 9, 2, 'tall');
  add('ta:props/banner-pole-a', 1, 3, 'tall'); add('ta:props/banner-pole-b', 10, 3, 'tall');
  const scatter = [['ta:rocks/sandstone-fallen-a', 'one', 1], ['ta:rocks/sandstone-fallen-c', 'one', 1], ['ta:rocks/rubble-pile-a', 'one', 1], ['ta:rocks/column-drum-a', 'one', 1], ['ta:rocks/toppled-head-a', 'one', 1], ['ta:rocks/sand-mound-a', 'one', 2], ['ta:rocks/slab-broken-b', 'one', 1],
    ['ta:grass/scrub-dry-a', 'one', 2], ['ta:grass/thorn-bush-a', 'one', 1], ['ta:grass/sedge-sand-a', 'one', 2], ['ta:trees/tamarisk-dry-a', 'one', 1], ['ta:trees/tamarisk-dry-b', 'one', 1], ['ta:grass/papyrus-dry-a', 'tall', 1], ['ta:props/urn-tall-a', 'one', 1]];
  for (const [k, kind, cnt] of scatter) for (let i = 0; i < cnt; i++) for (let tr = 0; tr < 40; tr++) { const x = Math.floor(R() * COLS), y = 6 + Math.floor(R() * (ROWS - 6)); if (y < 6) continue; if (add(k, x, y, kind)) break; }
  props.sort((p, q) => (p.y - q.y) || (p.x - q.x));
  for (const p of props) { const big = p.kind === 'large', tall = p.kind === 'tall'; put(p.k, p.x * S, (p.y - (big || tall ? 1 : 0)) * S, big ? 128 : 64, big ? 128 : tall ? 128 : 64); }
  // decals on the open sand and hall floor
  for (let y = 2; y < ROWS; y++) for (let x = 1; x < COLS - 1; x++) if (!used.has(cell(x, y)) && R() < .18) put(pick(y <= 4 ? ['ta:decals/sand-drift-a', 'ta:decals/footprints-a', 'ta:decals/crack-lines-a', 'ta:decals/rubble-chips-a', 'ta:decals/seal-wax-a', 'ta:decals/oil-spill-a', 'ta:decals/soot-stain-a', 'ta:decals/linen-scrap-a'] : ['ta:decals/sand-drift-b', 'ta:decals/footprints-a', 'ta:decals/snake-track-a', 'ta:decals/bone-scatter-a', 'ta:decals/rubble-chips-a', 'ta:decals/sand-drift-a']), x * S, y * S);
  // overlays: hanging roof beams across the hall, sun shafts and braziers' glow
  for (let x = 1; x < COLS - 1; x++) { put('ta:overlays/roof-beam-a', x * S, 2 * S); if (x % 3 === 1) put('ta:overlays/beam-shadow-a', x * S, 3 * S); }
  put('ta:overlays/roof-beam-b', 3 * S, 2 * S); put('ta:overlays/roof-beam-c', 9 * S, 2 * S);
  put('ta:overlays/sun-shaft-a', 5 * S, 3 * S); put('ta:overlays/sun-shaft-b', 7 * S, 3 * S); put('ta:overlays/sun-shaft-a', 2 * S, 4 * S); put('ta:overlays/dust-motes-a', 6 * S, 3 * S);
  put('ta:overlays/brazier-glow-a', 4 * S, 2 * S); put('ta:overlays/brazier-glow-a', 7 * S, 2 * S); put('ta:overlays/incense-smoke-a', 3 * S, 3 * S);
  for (let y = 6; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (R() < .06) put(pick(['ta:overlays/sand-haze-a', 'ta:overlays/sun-shaft-b']), x * S, y * S);
  return { w: COLS * S, h: ROWS * S, items };
}
