// Singing Erg sample patch composer (pure and self-contained; build-tileset.mjs inlines it for the reroll button).
// Keys: "se:" = ashkara/singing-erg/<cat>/<name>-<variant>, "sp:" = ashkara/seven-palms/... (the oasis to the south), "ds:" = ashkara/common/... (the salt-pan hardpan to the east).
export function composeSingingErg(seed, has) {
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
  const ridge = mk(), hollow = mk(), grass = mk(), ripple = mk();
  ell(ridge, 6.4, 1.5, 3.4, 1.15, .25); ell(hollow, 7.0, 3.5, 1.5, .8, .2); ell(grass, 3.0, 6.3, 1.7, 1.0, .25); ell(ripple, 8.2, 6.3, 1.7, 1.1, .2);
  clr(hollow, ridge); clr(grass, ridge); clr(grass, hollow); clr(ripple, hollow); clr(ripple, grass);
  const base = ['se:ground/sand-apricot-a', 'se:ground/sand-apricot-b', 'se:ground/sand-apricot-c', 'se:ground/sand-apricot-d', 'se:ground/sand-apricot-a', 'se:ground/sand-windpacked-a', 'se:ground/sand-windpacked-b', 'se:ground/sand-tufted-a'];
  const special = ['se:ground-detail/quartz-glitter-a', 'se:ground-detail/wind-ripples-a', 'se:ground-detail/bone-flecks-a', 'se:ground-detail/dune-grass-sprigs-a', 'se:ground-detail/scarab-tracks-a', 'se:ground-detail/sound-rings-a', 'se:ground/gravel-lag-a', 'se:ground-detail/seed-pods-a'];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    let k;
    if (x === COLS - 1 && y < 8) k = 'ds:ground/hardpan-' + pick(['a', 'b', 'c']);
    else if (x === COLS - 2 && y < 8) k = 'se:ground/apricot-pan-fringe-b';
    else if (x === COLS - 3 && y < 8) k = 'se:ground/apricot-pan-fringe-a';
    else if (y === ROWS - 1 && x < 7) k = 'sp:ground/grass-lush-' + pick(['a', 'b', 'c', 'd']);
    else if (y === ROWS - 2 && x < 7) k = 'se:ground/apricot-oasis-grass-fringe-b';
    else if (y === ROWS - 3 && x < 6) k = 'se:ground/apricot-oasis-grass-fringe-a';
    else if (y === ROWS - 1 && x >= 7) k = 'sp:ground/sand-oasis-' + pick(['a', 'b', 'c']);
    else if (y === ROWS - 2 && x >= 7 && x < COLS - 2) k = 'se:ground/apricot-oasis-sand-fringe-b';
    else k = R() < .16 ? pick(special) : pick(base);
    put(k, x * S, y * S);
  }
  const sets = [[ridge, 'se:edges/slip-face-ridge-'], [hollow, 'se:edges/lee-hollow-'], [grass, 'se:edges/dune-grass-patch-'], [ripple, 'se:edges/ripple-field-']];
  for (const [g, pre] of sets) for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (g[y][x]) put(pre + p3(canon(bm(g, x, y))), x * S, y * S);
  // connect-4 runs: a chime line along the dune foot and a sand fence guarding the ripple field
  const chime = mk(), slat = mk(); for (const [x, y] of [[0, 5], [1, 5], [2, 5], [2, 4]]) if (!ridge[y][x] && !hollow[y][x] && !grass[y][x]) chime[y][x] = true;
  for (const [x, y] of [[6, 7], [7, 7], [8, 7], [9, 7]]) if (!ripple[y][x] && !grass[y][x]) slat[y][x] = true;
  const c4 = (g, y, x) => String((g[y - 1]?.[x] ? 1 : 0) | (g[y]?.[x + 1] ? 2 : 0) | (g[y + 1]?.[x] ? 4 : 0) | (g[y]?.[x - 1] ? 8 : 0)).padStart(2, '0');
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { if (chime[y][x]) put('se:fences/fence-chime-line-' + c4(chime, y, x), x * S, y * S); if (slat[y][x]) put('se:fences/fence-sand-slat-' + c4(slat, y, x), x * S, y * S); }
  const blocked = (x, y) => ridge[y]?.[x] || hollow[y]?.[x] || chime[y]?.[x] || slat[y]?.[x];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (blocked(x, y)) used.add(x + ',' + y);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (ridge[y][x] && R() < .5) used.add(x + ',' + y);
  // decals
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS - 2; x++) if (!blocked(x, y) && !ridge[y][x] && R() < .26) put(pick(['se:decals/sand-devil-swirl-a', 'se:decals/scarab-trail-a', 'se:decals/bone-scatter-a', 'se:decals/bone-scatter-c', 'se:decals/sidewinder-trail-a', 'se:decals/sidewinder-trail-b', 'se:decals/slip-streaks-a', 'se:decals/sand-crescent-a', 'se:decals/sand-crescent-b', 'se:decals/caravan-prints-a', 'se:decals/fennec-prints-a', 'se:decals/chime-shadow-a', 'se:decals/wind-scour-a', 'se:decals/vulture-shadow-a', 'se:decals/sound-rings-a', 'se:decals/buried-glyphs-a']), x * S, y * S);
  const props = [];
  const add = (k, x, y, kind = 'one') => { const w = kind === 'large' ? 2 : 1; for (let i = 0; i < w; i++) if (x + i >= COLS || y >= ROWS || used.has((x + i) + ',' + y) || !has((k.startsWith('sp:') ? '' : 'se:') + k)) return false; if (kind !== 'one' && y < 1) return false; if (kind === 'large') for (let i = 0; i < 2; i++) if (used.has((x + i) + ',' + (y - 1))) return false; props.push({ k: k.startsWith('sp:') ? k : 'se:' + k, x, y, kind }); for (let i = 0; i < w; i++) used.add((x + i) + ',' + y); if (kind === 'large') for (let i = 0; i < 2; i++) used.add((x + i) + ',' + (y - 1)); return true; };
  add('interest/gate-twin-pillar-' + pick(['closed', 'open']), 10, 3, 'large');       // east edge: the gate to the Salt Mirror
  add('interest/singing-dune-' + pick(['a', 'b']), 2, 3, 'large');                   // the landmark on the dune
  add('interest/chime-grove-a', 5, 5, 'large'); add('interest/buried-colonnade-a', 4, 8, 'large'); add('interest/nomad-camp-a', 8, 9, 'large');
  add('interest/statue-colossus-' + pick(['a', 'b']), 10, 6, 'large'); add('interest/beast-skeleton-a', 0, 8, 'large');
  add('interest/chest-sand-closed', 6, 6); add('props/singing-drum-a', 3, 4); add('props/bone-drift-' + pick(['a', 'b', 'c']), 5, 7);
  const scatter = [['trees/saxaul-a', 'one', 2], ['trees/saxaul-b', 'one', 2], ['trees/saxaul-c', 'one', 1], ['trees/ghost-tree-a', 'tall', 1], ['trees/ghost-tree-b', 'tall', 1], ['trees/wind-acacia-a', 'tall', 1], ['trees/wind-acacia-b', 'tall', 1], ['trees/desert-broom-a', 'one', 2], ['trees/ephedra-a', 'one', 1], ['grass/dune-grass-a', 'one', 3], ['grass/dune-grass-b', 'one', 2], ['grass/dune-grass-c', 'one', 2], ['grass/singing-reed-a', 'tall', 1], ['grass/sand-sedge-a', 'one', 1], ['rocks/column-top-a', 'one', 1], ['rocks/column-top-b', 'one', 1], ['rocks/statue-head-a', 'one', 1], ['rocks/crest-cairn-a', 'one', 1], ['rocks/crest-cairn-b', 'one', 1], ['rocks/yardang-a', 'tall', 1], ['rocks/ventifact-a', 'one', 2], ['rocks/boulder-apricot-a', 'one', 1], ['props/chime-pole-a', 'tall', 2], ['props/chime-pole-b', 'tall', 1], ['props/sand-devil-a', 'tall', 1], ['props/scarab-swarm-a', 'one', 1], ['props/skull-camel-a', 'one', 1], ['props/wind-bell-a', 'one', 1], ['props/trail-stakes-a', 'one', 1], ['props/signpost-erg-a', 'one', 1], ['props/clay-jar-erg-a', 'one', 1]];
  for (const [k, kind, cnt] of scatter) for (let i = 0; i < cnt; i++) for (let tr = 0; tr < 40; tr++) { const x = Math.floor(R() * (COLS - 3)), y = Math.floor(R() * (ROWS - 1)); if (add(k, x, y, kind)) break; }
  props.sort((p, q) => (p.y - q.y) || (p.x - q.x));
  for (const p of props) { const big = p.kind === 'large', tall = p.kind === 'tall'; put(p.k, p.x * S, (p.y - (big || tall ? 1 : 0)) * S, big ? 128 : 64, big ? 128 : tall ? 128 : 64); }
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS - 2; x++) { if (ridge[y][x] && R() < .5) put(pick(['se:overlays/dune-shadow-band-a', 'se:overlays/dune-shadow-band-b', 'se:overlays/crest-plume-a', 'se:overlays/crest-plume-b']), x * S, y * S); else if (hollow[y][x] && R() < .6) put(pick(['se:overlays/dune-shadow-band-c', 'se:overlays/sand-veil-a']), x * S, y * S); else if (R() < .1) put(pick(['se:overlays/sand-veil-a', 'se:overlays/sand-veil-b', 'se:overlays/singing-shimmer-a', 'se:overlays/chime-glint-a', 'se:overlays/sand-veil-c']), x * S, y * S); }
  put('se:overlays/violet-dusk-a', 0, 0);
  return { w: COLS * S, h: ROWS * S, items };
}
