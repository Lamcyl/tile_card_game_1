// Seven Palms sample patch composer (pure and self-contained; build-tileset.mjs inlines it for the reroll button).
// Keys: "sp:" = ashkara/seven-palms/<cat>/<name>-<variant>, "dd:" = ashkara/dune-shallows/... (the sand to the east), "ds:" = ashkara/common/...
export function composeSevenPalms(seed, has) {
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
  const pool = mk(), pap = mk(), field = mk(), sandz = mk(), meadow = mk(), ditch = mk(), hedge = mk();
  ell(pool, 3.5, 5.7, 2.5, 1.8, .25); ell(pap, 1.1, 8.4, 1.4, 1.0, .25); ell(field, 7.0, 7.8, 1.8, 1.1, .2); ell(sandz, 9.3, 3.0, 1.6, 1.4, .2); ell(meadow, 9.3, 3.0, .9, .7, .1);
  clr(pap, pool); clr(field, pool); clr(field, pap); clr(meadow, pool);
  for (const [x, y] of [[6, 5], [7, 5], [7, 6]]) if (!pool[y][x] && !field[y][x]) ditch[y][x] = true;
  ditch[7][6] = false; ditch[6][6] = false; if (field[6]?.[7]) ditch[6][7] = false;
  for (const [x, y] of [[0, 3], [1, 3], [2, 3], [2, 4]]) if (!pool[y][x]) hedge[y][x] = true;
  const near = (x, y, d) => { for (let j = -d; j <= d; j++) for (let i = -d; i <= d; i++) if (sandz[y + j]?.[x + i]) return true; return false; };
  const fringeY = (y) => (y % 3 === 2);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    let k;
    if (pool[y][x]) k = null;
    else if (x === COLS - 1) k = 'dd:ground/sand-cream-' + pick(['a', 'b', 'c', 'd']);
    else if (x === COLS - 2) k = 'sp:ground/lush-' + (fringeY(y) ? 'fine' : 'cream') + '-fringe-b';
    else if (x === COLS - 3) k = 'sp:ground/lush-' + (fringeY(y) ? 'fine' : 'cream') + '-fringe-a';
    else if (sandz[y][x]) k = 'sp:ground/sand-oasis-' + pick(['a', 'b', 'c']);
    else if (near(x, y, 1)) k = 'sp:ground/lush-fine-fringe-b';
    else if (near(x, y, 2)) k = 'sp:ground/lush-fine-fringe-a';
    else if (y > 5 && x < 3 && R() < .3) k = 'sp:ground/loam-wet-' + pick(['a', 'b', 'c']);
    else k = R() < .2 ? pick(['sp:ground-detail/lush-clover-a', 'sp:ground-detail/lush-clover-b', 'sp:ground-detail/oleander-petals-a', 'sp:ground-detail/fallen-dates-a', 'sp:ground-detail/palm-litter-a']) : pick(['sp:ground/grass-lush-a', 'sp:ground/grass-lush-b', 'sp:ground/grass-lush-c', 'sp:ground/grass-lush-d', 'sp:ground/grass-lush-a']);
    if (k) put(k, x * S, y * S);
  }
  const sets = [[pool, 'sp:edges/pool-lagoon-'], [pap, 'sp:edges/papyrus-bed-'], [field, 'sp:edges/irrigated-field-'], [meadow, 'sp:edges/lush-meadow-']];
  for (const [g, pre] of sets) for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (g[y][x]) put(pre + p3(canon(bm(g, x, y))), x * S, y * S);
  const c4 = (g, y, x) => String((g[y - 1]?.[x] ? 1 : 0) | (g[y]?.[x + 1] ? 2 : 0) | (g[y + 1]?.[x] ? 4 : 0) | (g[y]?.[x - 1] ? 8 : 0)).padStart(2, '0');
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { if (ditch[y][x]) put('sp:fences/ditch-irrigation-' + c4(ditch, y, x), x * S, y * S); if (hedge[y][x]) put('sp:fences/hedge-oleander-' + c4(hedge, y, x), x * S, y * S); }
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (pool[y][x] || ditch[y][x] || hedge[y][x] || field[y][x] || pap[y][x]) used.add(x + ',' + y);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS - 2; x++) if (!used.has(x + ',' + y) && R() < .3) put(pick(['sp:decals/fallen-frond-a', 'sp:decals/fallen-frond-b', 'sp:decals/petal-drift-a', 'sp:decals/date-pits-a', 'sp:decals/palm-shade-a', 'sp:decals/palm-shade-c', 'sp:decals/mud-puddle-a', 'sp:decals/goat-tracks-a', 'sp:decals/dragonfly-a']), x * S, y * S);
  for (const [x, y] of [[2, 5], [4, 6], [3, 6], [5, 5]]) if (pool[y]?.[x] && R() < .8) put(pick(['sp:decals/lily-pad-a', 'sp:decals/lily-pad-b', 'sp:decals/lotus-bloom-a', 'sp:decals/ripple-ring-a', 'sp:decals/frog-on-pad-a', 'sp:decals/water-glint-a', 'sp:decals/fish-shadow-a']), x * S, y * S);
  const props = [];
  const add = (k, x, y, kind = 'one') => { const w = kind === 'large' ? 2 : 1; for (let i = 0; i < w; i++) if (x + i >= COLS || y >= ROWS || used.has((x + i) + ',' + y) || !has('sp:' + k)) return false; if (kind !== 'one' && y < 1) return false; if (kind === 'large') for (let i = 0; i < 2; i++) if (used.has((x + i) + ',' + (y - 1))) return false; props.push({ k: 'sp:' + k, x, y, kind }); for (let i = 0; i < w; i++) used.add((x + i) + ',' + y); if (kind === 'large') for (let i = 0; i < 2; i++) used.add((x + i) + ',' + (y - 1)); return true; };
  add('interest/gate-palm-frond-' + pick(['closed', 'open']), 4, 1, 'large');
  add('interest/oasis-pool-seven-palms-' + pick(['a', 'b']), 0, 2, 'large');
  add('interest/oasis-stall-' + pick(['a', 'b']), 8, 3, 'large'); add('interest/reed-hut-' + pick(['a', 'b']), 6, 3, 'large');
  add('interest/camp-under-palms-a', 9, 9, 'large'); add('interest/shaduf-garden-a', 5, 9, 'large');
  add('props/shaduf-lever-' + pick(['a', 'b']), 6, 6, 'tall'); add('props/well-oasis-' + pick(['a', 'b', 'c']), 8, 6); add('props/sluice-gate-a', 7, 5);
  add('props/fish-trap-wicker-b', 5, 6); add('props/reed-boat-b', 4, 5);
  add('interest/chest-wicker-closed', 11, 6);
  const scatter = [['trees/date-palm-fruiting-a', 'tall', 2], ['trees/date-palm-fruiting-b', 'tall', 1], ['trees/date-palm-oasis-a', 'tall', 2], ['trees/date-palm-oasis-b', 'tall', 1], ['trees/palm-grove-oasis-a', 'large', 1], ['trees/date-palm-pair-a', 'large', 1], ['trees/date-palm-sapling-a', 'one', 2], ['trees/tamarisk-a', 'one', 2], ['trees/tamarisk-c', 'tall', 1], ['trees/oleander-bush-a', 'one', 2], ['trees/oleander-bush-b', 'one', 1], ['trees/pomegranate-a', 'one', 1], ['trees/fig-oasis-a', 'tall', 1], ['grass/papyrus-stand-a', 'tall', 1], ['grass/sedge-tuft-a', 'one', 3], ['grass/cattail-oasis-a', 'one', 2], ['rocks/river-stone-a', 'one', 1], ['rocks/mossy-rock-a', 'one', 1], ['props/date-basket-a', 'one', 1], ['props/date-basket-b', 'one', 1], ['props/water-jar-a', 'one', 1], ['props/duck-pair-a', 'one', 1], ['props/heron-oasis-a', 'one', 1], ['props/bench-palm-log-a', 'one', 1], ['props/date-pile-a', 'one', 1], ['props/lantern-oasis-a', 'tall', 1], ['props/harvest-ladder-a', 'tall', 1]];
  for (const [k, kind, cnt] of scatter) for (let i = 0; i < cnt; i++) for (let tr = 0; tr < 40; tr++) { const x = Math.floor(R() * (COLS - 3)), y = Math.floor(R() * ROWS); if (add(k, x, y, kind)) break; }
  props.sort((p, q) => (p.y - q.y) || (p.x - q.x));
  for (const p of props) { const big = p.kind === 'large', tall = p.kind === 'tall'; put(p.k, p.x * S, (p.y - (big || tall ? 1 : 0)) * S, big ? 128 : 64, big ? 128 : tall ? 128 : 64); }
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS - 2; x++) { if (pool[y][x] && R() < .5) put(pick(['sp:overlays/pool-sparkle-a', 'sp:overlays/pool-sparkle-b', 'sp:overlays/morning-mist-a']), x * S, y * S); else if (R() < .1) put(pick(['sp:overlays/palm-dapple-a', 'sp:overlays/palm-dapple-b', 'sp:overlays/pollen-motes-a', 'sp:overlays/petal-fall-a']), x * S, y * S); }
  put('sp:overlays/frond-light-shafts-a', 0, 0);
  return { w: COLS * S, h: ROWS * S, items };
}
