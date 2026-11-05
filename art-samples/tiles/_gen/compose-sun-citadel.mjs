// Sun Citadel sample patch composer (pure and self-contained; build-tileset.mjs inlines it for the reroll button).
// Layout (north up): rows 0-1 the citadel wall (gold, 3/4 view) with the golden gate to the region exit; rows 2-5 the obelisk court (court flags, mirror aisle, obelisks, fire bowls, djinn statues,
// parapets and mirror screens); rows 6-9 the glass desert with an obsidian causeway running south toward the Tomb Approach, a glass pool, a basalt wall, spires, skeletons and a burnt camp.
// Keys: "sc:" = ashkara/sun-citadel/<cat>/<name>-<variant>, "ds:" = ashkara/common/...
export function composeSunCitadel(seed, has) {
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
  const wall = mk(), road = mk(), pool = mk(), bwall = mk(), para = mk(), mscreen = mk();
  for (let x = 0; x < COLS; x++) if (x < 5 || x > 6) { wall[0][x] = wall[1][x] = true; }
  for (let y = 6; y < ROWS; y++) { road[y][5] = road[y][6] = true; }
  for (const [x, y] of [[1, 7], [2, 7], [3, 7], [2, 8], [3, 8], [1, 6]]) pool[y][x] = true;
  for (const [x, y] of [[9, 8], [10, 8], [9, 9], [10, 9], [11, 8], [11, 9]]) bwall[y][x] = true;
  for (let x = 1; x <= 2; x++) para[5][x] = true; for (let x = 9; x <= 10; x++) para[5][x] = true;
  for (const y of [2, 3]) { mscreen[y][1] = true; mscreen[y][10] = true; }
  // ---- ground ----
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    let k;
    if (y <= 5) {
      if (y === 5 && (x === 5 || x === 6)) k = 'sc:ground/court-mirror-' + pick(['a', 'b']);
      else if (x === 5 || x === 6) k = pick(['sc:ground/court-mirror-a', 'sc:ground/court-mirror-b']);
      else if (y === 4 && (x === 4 || x === 7)) k = 'sc:ground/court-inlay-a';
      else if (y >= 2 && (x === 0 || x === 11)) k = pick(['sc:ground/gold-sand-a', 'sc:ground/gold-sand-b']);
      else k = R() < .1 ? pick(['sc:ground/gold-shade-a', 'sc:ground/gold-shade-b', 'sc:ground/court-inlay-b']) : pick(['sc:ground/court-flag-a', 'sc:ground/court-flag-b', 'sc:ground/court-flag-c']);
    } else if (y === 6) k = x > 0 && x < 11 && R() < .8 ? pick(['sc:ground/gold-court-fringe-a', 'sc:ground/gold-sand-c']) : pick(['sc:ground/gold-sand-a', 'sc:ground/gold-sand-d']);
    else if (y >= 8 && x >= 8) k = x === 8 ? pick(['sc:ground/scorched-basalt-fringe-a', 'sc:ground/scorched-b']) : pick(['sc:ground/basalt-a', 'sc:ground/basalt-b', 'sc:ground/basalt-c']);
    else if (y >= 7 && x >= 7) k = pick(['sc:ground/scorched-a', 'sc:ground/scorched-b', 'sc:ground/scorched-c', 'sc:ground/cinder-a']);
    else if (x <= 4 && y === 7) k = pick(['sc:ground/gold-glass-fringe-a', 'sc:ground/gold-glass-fringe-b']);
    else if (x <= 4 && y >= 7) k = R() < .2 ? pick(['sc:ground/glass-fused-a', 'sc:ground/glass-fused-b']) : pick(['sc:ground/glass-sand-a', 'sc:ground/glass-sand-b', 'sc:ground/glass-sand-c']);
    else if (y === 7 && x > 4) k = pick(['sc:ground/gold-glass-fringe-a', 'sc:ground/gold-sand-b']);
    else k = pick(['sc:ground/gold-sand-a', 'sc:ground/gold-sand-b', 'sc:ground/gold-sand-c', 'sc:ground/gold-sand-d', 'sc:ground/glass-sand-a']);
    put(k, x * S, y * S);
  }
  const special = ['sc:ground-detail/gold-flakes-a', 'sc:ground-detail/mirror-shards-a', 'sc:ground-detail/heat-cracks-a', 'sc:ground-detail/glass-shards-b', 'sc:ground-detail/obsidian-chips-b'];
  const desertSp = ['sc:ground-detail/glass-shards-a', 'sc:ground-detail/glass-bubbles-a', 'sc:ground-detail/scorch-mark-a', 'sc:ground-detail/scorch-mark-b', 'sc:ground-detail/ember-scatter-a', 'sc:ground-detail/fulgurite-a', 'sc:ground-detail/ash-drift-a', 'sc:ground-detail/char-bones-a', 'sc:ground-detail/melt-pool-a', 'sc:ground-detail/cinder-pebbles-a', 'sc:ground-detail/basalt-pebbles-a'];
  for (let y = 2; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!pool[y][x] && !road[y][x] && !bwall[y][x] && R() < (y <= 5 ? .09 : .13)) put(pick(y <= 5 ? special : desertSp), x * S, y * S);
  put('sc:ground-detail/sun-disc-inlay-a', 5 * S, 3 * S); put('sc:ground-detail/sun-rays-inlay-a', 6 * S, 3 * S); put('sc:ground-detail/rune-ring-a', 5 * S, 4 * S);
  // ---- autotiles ----
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (wall[y][x]) put('sc:edges/citadel-wall-' + p3(canon(bmask(wall, x, y, { side: true, bottom: false }))), x * S, y * S);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (road[y][x]) put('sc:edges/obsidian-slab-' + p3(canon(bmask(road, x, y, { side: false, bottom: true }))), x * S, y * S);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (pool[y][x]) put('sc:edges/glass-melt-' + p3(canon(bmask(pool, x, y, { side: false, bottom: false }))), x * S, y * S);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (bwall[y][x]) put('sc:edges/basalt-wall-' + p3(canon(bmask(bwall, x, y, { side: false, bottom: false }))), x * S, y * S);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { if (para[y][x]) put('sc:fences/parapet-gold-' + c4(para, y, x), x * S, y * S); if (mscreen[y][x]) put('sc:fences/mirror-screen-' + c4(mscreen, y, x), x * S, y * S); }
  // ---- objects ----
  const used = new Set(), props = [];
  const cell = (x, y) => x + ',' + y;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (wall[y][x] || para[y][x] || mscreen[y][x] || road[y][x] || pool[y][x] || bwall[y][x]) used.add(cell(x, y));
  const add = (k, x, y, kind = 'one') => { const w = kind === 'large' ? 2 : 1, hh = kind === 'large' ? 2 : 1; if (!has(k)) return false; for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) if (x + i >= COLS || y - j < 0 || used.has(cell(x + i, y - j))) return false; for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) used.add(cell(x + i, y - j)); props.push({ k, x, y, kind }); return true; };
  props.push({ k: 'sc:interest/gate-citadel-golden-' + pick(['closed', 'open']), x: 5, y: 1, kind: 'large' });
  used.add(cell(5, 1)); used.add(cell(6, 1));
  add('sc:interest/citadel-golden-a', 8, 3, 'large'); add('sc:interest/citadel-dome-a', 2, 3, 'large');
  add('sc:props/obelisk-gold-' + pick(['a', 'b']), 3, 5, 'tall'); add('sc:props/obelisk-gold-' + pick(['b', 'a']), 8, 5, 'tall');
  add('sc:props/fire-bowl-pillar-a', 4, 5, 'tall'); add('sc:props/fire-bowl-pillar-a', 7, 5, 'tall');
  add('sc:props/djinn-statue-' + pick(['a', 'b']), 4, 3, 'tall'); add('sc:props/djinn-statue-' + pick(['b', 'a']), 7, 3, 'tall');
  add('sc:props/banner-sun-' + pick(['a', 'b']), 0, 5, 'tall'); add('sc:props/banner-sun-' + pick(['b', 'a']), 10, 4, 'tall');
  add('sc:props/urn-' + pick(['a', 'b']), 0, 4); add('sc:props/offering-bowl-a', 11, 5); add('sc:props/sundial-a', 11, 3);
  add('sc:interest/altar-sunfire-a', 3, 9, 'large'); add('sc:interest/camp-scorched-a', 7, 9, 'large');
  add('sc:interest/glass-spire-' + pick(['a', 'b']), 0, 9, 'tall'); add('sc:interest/glass-spire-' + pick(['b', 'a']), 4, 8, 'tall');
  add('sc:interest/watchtower-basalt-a', 11, 7, 'tall'); add('sc:props/lens-stand-a', 8, 7, 'tall'); add('sc:props/mirror-stand-' + pick(['a', 'b']), 4, 7, 'tall'); add('sc:props/solar-disc-' + pick(['a', 'b']), 0, 7, 'tall');
  add('sc:trees/palm-scorched-' + pick(['a', 'b']), 9, 7, 'tall'); add('sc:trees/tree-glass-' + pick(['a', 'b']), 1, 8, 'tall'); add('sc:rocks/obsidian-spire-' + pick(['a', 'b']), 11, 9, 'tall');
  const scatter = [['sc:rocks/basalt-boulder-a', 'one', 2], ['sc:rocks/basalt-boulder-b', 'one', 1], ['sc:rocks/basalt-columns-a', 'one', 1], ['sc:rocks/obsidian-shard-a', 'one', 1], ['sc:rocks/glass-lump-a', 'one', 2], ['sc:rocks/slag-heap-a', 'one', 1], ['sc:rocks/gold-ore-a', 'one', 1], ['sc:rocks/gold-rubble-a', 'one', 1],
    ['sc:props/skeleton-scorched-a', 'one', 1], ['sc:props/skeleton-scorched-b', 'one', 1], ['sc:props/skeleton-scorched-c', 'one', 1], ['sc:props/obelisk-small-a', 'one', 1], ['sc:props/obelisk-small-b', 'one', 1], ['sc:props/fire-bowl-ground-a', 'one', 1], ['sc:props/pillar-broken-a', 'one', 1],
    ['sc:grass/scrub-burnt-a', 'one', 2], ['sc:grass/glass-grass-a', 'one', 2], ['sc:grass/ash-tuft-a', 'one', 1], ['sc:grass/ember-weed-a', 'one', 1], ['sc:trees/thorn-gold-a', 'one', 1], ['sc:trees/thorn-gold-b', 'one', 1], ['sc:interest/chest-sun-closed', 'one', 1]];
  for (const [k, kind, cnt] of scatter) for (let i = 0; i < cnt; i++) for (let tr = 0; tr < 40; tr++) { const x = Math.floor(R() * COLS), y = 7 + Math.floor(R() * (ROWS - 7)); if (add(k, x, y, kind)) break; }
  props.sort((p, q) => (p.y - q.y) || (p.x - q.x));
  for (const p of props) { const big = p.kind === 'large', tall = p.kind === 'tall'; put(p.k, p.x * S, (p.y - (big || tall ? 1 : 0)) * S, big ? 128 : 64, big ? 128 : tall ? 128 : 64); }
  // decals on open ground
  for (let y = 2; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!used.has(cell(x, y)) && R() < .16) put(pick(y <= 5 ? ['sc:decals/gold-dust-a', 'sc:decals/sun-glare-spot-a', 'sc:decals/sand-drift-a', 'sc:decals/footprints-a'] : ['sc:decals/glass-crack-a', 'sc:decals/glass-crack-b', 'sc:decals/scorch-mark-a', 'sc:decals/scorch-mark-b', 'sc:decals/ash-drift-a', 'sc:decals/ember-trail-a', 'sc:decals/burnt-bones-a', 'sc:decals/melt-ring-a', 'sc:decals/fulgurite-trace-a', 'sc:decals/obsidian-chips-a', 'sc:decals/sand-drift-b', 'sc:decals/soot-stain-a']), x * S, y * S);
  for (const [x, y] of [[3, 4], [8, 4], [4, 2], [7, 2]]) put('sc:decals/shadow-obelisk-a', x * S, y * S);
  for (let x = 2; x < COLS - 2; x++) if (x !== 5 && x !== 6) put('sc:decals/shadow-wall-a', x * S, 2 * S);
  // overlays: heat distortion over the glass desert, glare in the court, rays through the gate, mirror glints, embers, smoke
  for (let y = 6; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (R() < .24) put(pick(['sc:overlays/heat-haze-a', 'sc:overlays/heat-haze-b', 'sc:overlays/heat-haze-c', 'sc:overlays/ember-drift-a', 'sc:overlays/golden-haze-a']), x * S, y * S);
  put('sc:overlays/sun-glare-a', 5 * S, 2 * S); put('sc:overlays/light-rays-a', 4 * S, 2 * S); put('sc:overlays/light-rays-b', 7 * S, 2 * S); put('sc:overlays/golden-haze-a', 6 * S, 3 * S);
  for (const [x, y] of [[5, 4], [6, 3], [2, 2], [9, 5], [3, 7]]) put('sc:overlays/mirror-glint-a', x * S, y * S);
  put('sc:overlays/blue-shade-b', 0, 2 * S); put('sc:overlays/blue-shade-a', 11 * S, 4 * S); put('sc:overlays/smoke-plume-a', 8 * S, 8 * S); put('sc:overlays/ember-drift-b', 7 * S, 8 * S);
  return { w: COLS * S, h: ROWS * S, items };
}
