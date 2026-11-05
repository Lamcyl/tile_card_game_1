// Dune Shallows sample patch composer (pure and self-contained; build-tileset.mjs inlines it for the reroll button).
// Keys: "dd:" = ashkara/dune-shallows/<cat>/<name>-<variant>, "ds:" = ashkara/common/... (a little common ground and the cliff edge for context).
export function composeShallows(seed, has) {
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
  const crest = mk(), pool = mk(), scrub = mk(), shells = mk(), edge = mk();
  ell(crest, 8.2, 2.0, 3.6, 1.9, .3); ell(pool, 2.6, 7.4, 1.9, 1.2, .2); ell(scrub, 8.6, 7.2, 2.7, 1.6, .25); ell(shells, 5.4, 5.8, 1.7, 1.1, .2);
  for (let y = 0; y < ROWS; y++) edge[y][COLS - 1] = y > 3;
  const clr = (g, o) => { for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (o[y][x]) g[y][x] = false; };
  clr(pool, crest); clr(scrub, crest); clr(scrub, pool); clr(shells, crest); clr(shells, pool); clr(shells, scrub);
  const base = ['dd:ground/sand-cream-a', 'dd:ground/sand-cream-b', 'dd:ground/sand-cream-c', 'dd:ground/sand-cream-d', 'dd:ground/sand-cream-a', 'dd:ground/sand-wavelet-a', 'dd:ground/sand-wavelet-b', 'dd:ground/sand-wavelet-c'];
  const special = ['dd:ground-detail/cream-shells-a', 'dd:ground-detail/dune-scrub-sprigs-a', 'dd:ground/dry-puddle-a', 'dd:ground/dry-puddle-b', 'dd:ground-detail/fossil-sand-a', 'dd:ground-detail/dune-scrub-sprigs-c', 'dd:ground/wadi-clay-a'];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (x === COLS - 1 && y > 3) put(pick(['dd:ground/cream-fine-fringe-b', 'dd:ground/cream-dune-fringe-b']), x * S, y * S);
    else if (x === COLS - 2 && y > 3) put(pick(['dd:ground/cream-fine-fringe-a', 'dd:ground/cream-dune-fringe-a']), x * S, y * S);
    else put(R() < .14 ? pick(special) : pick(base), x * S, y * S);
  }
  const sets = [[crest, 'dd:edges/dune-crest-'], [pool, 'dd:edges/dry-pool-'], [scrub, 'dd:edges/scrub-patch-'], [shells, 'dd:edges/shell-bed-']];
  for (const [g, pre] of sets) for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (g[y][x]) put(pre + p3(canon(bm(g, x, y))), x * S, y * S);
  // driftwood fence run, east of the pool
  const fence = mk(); for (const [x, y] of [[4, 8], [5, 8], [6, 8], [6, 9]]) if (!pool[y][x] && !scrub[y][x]) fence[y][x] = true;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (fence[y][x]) put('dd:fences/fence-driftwood-' + String((fence[y - 1]?.[x] ? 1 : 0) | (fence[y]?.[x + 1] ? 2 : 0) | (fence[y + 1]?.[x] ? 4 : 0) | (fence[y]?.[x - 1] ? 8 : 0)).padStart(2, '0'), x * S, y * S);
  const occ = (x, y) => crest[y]?.[x] || pool[y]?.[x] || fence[y]?.[x], blocked = (x, y) => pool[y]?.[x] || fence[y]?.[x];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (blocked(x, y)) used.add(x + ',' + y);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (crest[y][x] && R() < .55) used.add(x + ',' + y);   // keep part of the crest clear so the landmark and a few props can sit on it
  // decals
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!occ(x, y) && R() < .3) put(pick(['dd:decals/ripple-small-a', 'dd:decals/ripple-small-b', 'dd:decals/ripple-small-c', 'dd:decals/drift-mound-a', 'dd:decals/drift-mound-b', 'dd:decals/shell-scatter-a', 'dd:decals/shell-scatter-c', 'dd:decals/lizard-dune-a', 'dd:decals/lizard-dune-c', 'dd:decals/tumble-trail-a', 'dd:decals/beetle-tracks-a', 'dd:decals/dry-crack-a', 'dd:decals/gull-feather-a']), x * S, y * S);
  for (const [x, y] of [[2, 3], [3, 3], [4, 4]]) if (!used.has(x + ',' + y)) put('dd:decals/wagon-ruts-a', x * S, y * S);
  const props = [];
  const add = (k, x, y, kind = 'one') => { const w = kind === 'large' ? 2 : 1; for (let i = 0; i < w; i++) if (x + i >= COLS || y >= ROWS || used.has((x + i) + ',' + y) || !has('dd:' + k)) return false; if (kind !== 'one' && y < 1) return false; props.push({ k: 'dd:' + k, x, y, kind }); for (let i = 0; i < w; i++) used.add((x + i) + ',' + y); if (kind === 'large') for (let i = 0; i < 2; i++) used.add((x + i) + ',' + (y - 1)); return true; };
  add('interest/gate-rib-arch-' + pick(['closed', 'open']), 0, 5, 'large');           // west edge: the gate to Seven Palms
  used.delete('7,2'); used.delete('8,2'); used.delete('7,1'); used.delete('8,1'); add('interest/waypoint-cairn-crest-' + pick(['a', 'b']), 7, 2, 'large');            // landmark on the first crest
  add('interest/caravan-wagon-buried-' + pick(['a', 'b']), 3, 3, 'large');
  add('interest/fossil-dig-a', 9, 9, 'large'); add('interest/abandoned-camp-a', 6, 7, 'large');
  add('props/windsock-pole-a', 2, 9, 'tall'); add('props/well-dry-a', 4, 6); add('props/cairn-trail-' + pick(['a', 'b', 'c', 'd']), 5, 4);
  add('interest/chest-sand-bone-closed', 10, 6);
  const scatter = [['trees/dune-scrub-a', 'one', 3], ['trees/dune-scrub-b', 'one', 2], ['trees/dune-scrub-c', 'one', 2], ['trees/saltbush-a', 'one', 2], ['trees/saltbush-c', 'one', 1], ['trees/dead-brush-a', 'one', 2], ['trees/thorn-acacia-a', 'tall', 2], ['trees/dead-tree-bleached-a', 'tall', 1], ['rocks/sandwashed-rock-a', 'one', 2], ['rocks/half-buried-rock-b', 'one', 2], ['rocks/fossil-boulder-a', 'one', 1], ['rocks/wind-pillar-a', 'tall', 1], ['grass/marram-pale-a', 'one', 3], ['grass/sea-oats-a', 'one', 2], ['props/tumbleweed-a', 'one', 2], ['props/rib-bone-a', 'one', 2], ['props/vertebra-a', 'one', 1], ['props/driftwood-b', 'one', 1], ['props/wagon-wheel-a', 'one', 1], ['props/pennant-stake-a', 'one', 1], ['props/crate-broken-a', 'one', 1], ['props/amphora-buried-a', 'one', 1], ['props/skull-camel-a', 'one', 1], ['props/signpost-arrow-a', 'one', 1]];
  for (const [k, kind, cnt] of scatter) for (let i = 0; i < cnt; i++) for (let tr = 0; tr < 30; tr++) { const x = Math.floor(R() * (COLS - 1)), y = Math.floor(R() * ROWS); if (add(k, x, y, kind)) break; }
  props.sort((p, q) => (p.y - q.y) || (p.x - q.x));
  for (const p of props) { const big = p.kind === 'large', tall = p.kind === 'tall'; put(p.k, p.x * S, (p.y - (big || tall ? 1 : 0)) * S, big ? 128 : 64, big ? 128 : tall ? 128 : 64); }
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { if (!pool[y][x] && R() < .16) put(pick(['dd:overlays/spindrift-a', 'dd:overlays/spindrift-b', 'dd:overlays/bright-haze-a', 'dd:overlays/bright-haze-b', 'dd:overlays/sand-shimmer-a']), x * S, y * S); if (crest[y][x] && R() < .3) put('dd:overlays/crest-spray-a', x * S, y * S); }
  put('dd:overlays/pale-sun-glare-a', 0, 0);
  return { w: COLS * S, h: ROWS * S, items };
}
