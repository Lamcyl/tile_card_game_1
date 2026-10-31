// World map data: regions, sub-areas, enemy themes and the monster spots of every sub-area.
// Node positions are generated from fixed seeds, so the map is the same on
// every run; only the enemies inside each battle change between runs.
(function (root) {
  'use strict';
  const Engine = root.Engine;

  // 20 sub-areas, 4 per region (see docs/WORLD_SPEC.md). The geometry (map size, bounds, spots, landmark…) comes
  // from window.WorldLayout (js/world-layout.js); this file adds the content: names, biomes, levels, unlocks,
  // enemy themes. If the layout is missing (Node tools) or lacks a sub-area, a simple placeholder is used.
  // Free exploration: every monster spot of an unlocked sub-area is open.
  //   lm       = [landmark kind, label]      lv / bossLv = level range of ordinary spots / of the boss
  //   unlocks  = sub-areas revealed by this sub-area's boss; from = the sub-area (or 'camp') that leads here
  //   poi      = kind of the optional non-battle spot: 'shrine' (healing spring) or 'treasure' (supply cache); free of Supplies
  const SUB_DEFS = [
    // Greenvale
    { id: 'meadow',  region: 'Greenvale',   name: 'Sunny Meadows',    biome: 'meadow',  lm: ['hill', 'Blossom Hill'],              lv: [1, 2], bossLv: 4,  unlocks: ['forest'],         from: 'camp',   poi: 'treasure' },
    { id: 'forest',  region: 'Greenvale',   name: 'Old Oak Wood',     biome: 'forest',  lm: ['oak-grove', 'The Elder Oak'],        lv: [3, 4], bossLv: 5,  unlocks: ['bamboo'],         from: 'meadow', poi: 'shrine' },
    { id: 'bamboo',  region: 'Greenvale',   name: 'Bamboo Valley',    biome: 'forest',  lm: ['bamboo-grove', 'The Jade Bamboo'],   lv: [3, 4], bossLv: 5,  unlocks: ['lake'],           from: 'forest', poi: 'treasure' },
    { id: 'lake',    region: 'Greenvale',   name: 'Mirror Lake',      biome: 'coral',   lm: ['lake', 'Mirror Lake'],               lv: [4, 5], bossLv: 6,  unlocks: ['beach', 'dunes'], from: 'bamboo', poi: 'shrine' },
    // Azure Coast
    { id: 'beach',   region: 'Azure Coast', name: 'Shell Beach',      biome: 'beach',   lm: ['lighthouse', 'Pearl Lighthouse'],    lv: [5, 6], bossLv: 7,  unlocks: ['coral'],         from: 'lake',   poi: 'treasure' },
    { id: 'coral',   region: 'Azure Coast', name: 'Coral Shallows',   biome: 'coral',   lm: ['reef-arch', 'Coral Arch'],           lv: [6, 7], bossLv: 8,  unlocks: ['cove'],          from: 'beach',  poi: 'shrine' },
    { id: 'cove',    region: 'Azure Coast', name: 'Shipwreck Cove',   biome: 'beach',   lm: ['shipwreck', 'The Wrecked Galleon'],  lv: [7, 8], bossLv: 9,  unlocks: ['isles'],         from: 'coral',  poi: 'treasure' },
    { id: 'isles',   region: 'Azure Coast', name: 'Mist Isles',       biome: 'coral',   lm: ['sea-stacks', 'The Needle Stacks'],   lv: [8, 9], bossLv: 9,  unlocks: ['snow'],          from: 'cove',   poi: 'shrine' },
    // Sunscorch
    { id: 'dunes',   region: 'Sunscorch',   name: 'Dune Sea',         biome: 'dunes',   lm: ['giant-dune', 'Singing Dune'],        lv: [5, 6], bossLv: 7,  unlocks: ['oasis'],         from: 'lake',   poi: 'shrine' },
    { id: 'oasis',   region: 'Sunscorch',   name: 'Palm Oasis',       biome: 'dunes',   lm: ['oasis', 'Mirage Pool'],              lv: [6, 7], bossLv: 8,  unlocks: ['canyon'],        from: 'dunes',  poi: 'shrine' },
    { id: 'canyon',  region: 'Sunscorch',   name: 'Red Canyon',       biome: 'dunes',   lm: ['mesa', 'Crimson Mesa'],              lv: [7, 8], bossLv: 9,  unlocks: ['temple'],        from: 'oasis',  poi: 'treasure' },
    { id: 'temple',  region: 'Sunscorch',   name: 'Buried Temple',    biome: 'temple',  lm: ['pyramid', 'The Sunken Pyramid'],     lv: [8, 9], bossLv: 9,  unlocks: ['ash'],           from: 'canyon', poi: 'treasure' },
    // Frostveil
    { id: 'snow',    region: 'Frostveil',   name: 'Snowdrift Plains', biome: 'snow',    lm: ['ice-peak', 'Whitecap Peak'],         lv: [9, 10], bossLv: 11, unlocks: ['frozen'],        from: 'isles',  poi: 'shrine' },
    { id: 'frozen',  region: 'Frostveil',   name: 'Frozen Lake',      biome: 'glacier', lm: ['frozen-lake', 'Glass Lake'],         lv: [10, 11], bossLv: 12, unlocks: ['rime'],          from: 'snow',   poi: 'treasure' },
    { id: 'rime',    region: 'Frostveil',   name: 'Rime Forest',      biome: 'snow',    lm: ['ice-forest', 'The Crystal Pines'],   lv: [11, 12], bossLv: 13, unlocks: ['glacier'],       from: 'frozen', poi: 'shrine' },
    { id: 'glacier', region: 'Frostveil',   name: 'Glacier Throne',   biome: 'glacier', lm: ['ice-palace', 'The Frost Palace'],    lv: [12, 14], bossLv: 15, unlocks: [],                from: 'rime',   poi: 'treasure' },
    // Ember Peaks
    { id: 'ash',     region: 'Ember Peaks', name: 'Ash Fields',       biome: 'ash',     lm: ['burnt-grove', 'The Cinder Grove'],   lv: [9, 10], bossLv: 11, unlocks: ['ridge'],         from: 'temple', poi: 'treasure' },
    { id: 'ridge',   region: 'Ember Peaks', name: 'Obsidian Ridge',   biome: 'caldera', lm: ['obsidian-ridge', 'The Glass Ridge'], lv: [10, 11], bossLv: 12, unlocks: ['lavafall'],      from: 'ash',    poi: 'shrine' },
    { id: 'lavafall',region: 'Ember Peaks', name: 'Ember Falls',      biome: 'ash',     lm: ['lava-falls', 'The Ember Falls'],     lv: [11, 12], bossLv: 13, unlocks: ['caldera'],       from: 'ridge',  poi: 'treasure' },
    { id: 'caldera', region: 'Ember Peaks', name: 'Magma Caldera',    biome: 'caldera', lm: ['volcano', 'Mount Ember'],           lv: [12, 14], bossLv: 15, unlocks: [],                from: 'lavafall', poi: 'shrine' },
  ];
  const REGIONS = ['Greenvale', 'Azure Coast', 'Sunscorch', 'Frostveil', 'Ember Peaks'];

  // ---------- Deterministic helpers ----------
  function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) % 2147483646 + 1; }
  function rng(seed) { let s = typeof seed === 'number' ? seed : hash(seed); return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  // ---------- Layout (from WorldLayout, or a placeholder grid) ----------
  // Placeholder: one 1100 x 900 box per sub-area on a 4-column grid, spots a zig-zag ~300 apart.
  const PH = { W: 4 * 1200, H: 5 * 1000, camp: { x: 600, y: 4900 } };
  function placeholderSub(i) {
    const x0 = (i % 4) * 1200 + 50, y0 = 4000 - Math.floor(i / 4) * 1000, x1 = x0 + 1100, y1 = y0 + 900;
    const spots = [];
    for (let k = 0; k < 5; k++) spots.push([x0 + (k % 2 ? 780 : 320), y1 - 130 - k * 140]);
    return {
      bounds: [x0, y0, x1, y1],
      shape: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]],
      landmark: { x: x0 + 220, y: y0 + 300, rx: 110, ry: 70 },
      entry: [x0 + 550, y1 - 20], boss: [x0 + 550, y0 + 70],
      elites: [[x0 + 550, y0 + 260]], spots, poi: [x0 + 880, y0 + 420],
    };
  }
  const LAYOUT = root.WorldLayout || null;
  const MAP_W = (LAYOUT && LAYOUT.MAP_W) || PH.W;
  const MAP_H = (LAYOUT && LAYOUT.MAP_H) || PH.H;
  const CAMP_POS = (LAYOUT && LAYOUT.CAMP) || PH.camp;

  const SUBAREAS = SUB_DEFS.map((d, i) => {
    const L = (LAYOUT && LAYOUT.subareas && LAYOUT.subareas[d.id]) || placeholderSub(i);
    return {
      id: d.id, region: d.region, name: d.name, biome: d.biome, lv: d.lv, bossLv: d.bossLv, unlocks: d.unlocks, from: d.from, poi: d.poi,
      bounds: L.bounds, shape: L.shape || null, entry: L.entry, boss: L.boss, elites: L.elites || [], spots: L.spots || [], poiPos: L.poi || null,
      landmark: Object.assign({}, L.landmark, { kind: d.lm[0], label: d.lm[1] }),
      regionIndex: REGIONS.indexOf(d.region),
    };
  });
  const SUB_BY = Object.fromEntries(SUBAREAS.map((s) => [s.id, s]));
  const CAMP = { id: 'camp', type: 'camp', x: Math.round(CAMP_POS.x), y: Math.round(CAMP_POS.y), sub: 'meadow', level: 0 };
  // The icon of an ordinary spot cycles through the sub-area's basic / armored / barrel creatures.
  const NORMAL_ROLES = ['basic', 'armored', 'barrel', 'basic', 'armored'];

  // Enemy themes per sub-area: basic, tough, armored, barrel skin and boss.
  // Each entry is [name, emoji fallback, drawing in assets/units/].
  const THEMES = {
    meadow:  { basic: ['Alux', '👺', 'alux'], tough: ['Tanuki', '🦝', 'tanuki'], armored: ['Jangseung', '🗿', 'jangseung'], barrel: ['Chōchin-obake', '🏮', 'chochin-obake'], boss: ['Sansin', '🐯', 'sansin'] },
    forest:  { basic: ['Kodama', '🌱', 'kodama'], tough: ['Leshy', '🌳', 'leshy'], armored: ['Bulgasari', '🐗', 'bulgasari'], barrel: ['Kasa-obake', '☂️', 'kasa-obake'], boss: ['Yamata no Orochi', '🐍', 'orochi'] },
    bamboo:  { basic: ['Shanxiao', '👹', 'shanxiao'], tough: ['Baihu', '🐅', 'baihu'], armored: ['Baize', '🦁', 'baize'], barrel: ['Nian', '🧨', 'nian'], boss: ['Qiongqi', '🐯', 'qiongqi'] },
    lake:    { basic: ['Bannik', '🛁', 'bannik'], tough: ['Jorogumo', '🕷️', 'jorogumo'], armored: ['Baku', '🐘', 'baku'], barrel: ['Hitotsume-kozo', '👁️', 'hitotsume-kozo'], boss: ['Medusa', '🐍', 'medusa'] },
    beach:   { basic: ['Kappa', '🐢', 'kappa'], tough: ['Sobek', '🐊', 'sobek'], armored: ['Xuanwu', '🐢', 'xuanwu'], barrel: ['Jingwei', '🐦', 'jingwei'], boss: ['Scylla', '🐙', 'scylla'] },
    coral:   { basic: ['Mul Gwisin', '👻', 'mul-gwisin'], tough: ['Jörmungandr', '🐍', 'jormungandr'], armored: ['Imugi', '🐉', 'imugi'], barrel: ['Rusalka', '🧜', 'rusalka'], boss: ['Poseidon', '🔱', 'poseidon'] },
    cove:    { basic: ['Harpy', '🦅', 'harpy'], tough: ['Gashadokuro', '💀', 'gashadokuro'], armored: ['Nemean Lion', '🦁', 'nemean-lion'], barrel: ['Cheonyeo Gwisin', '👻', 'cheonyeo-gwisin'], boss: ['Hydra', '🐲', 'hydra'] },
    isles:   { basic: ['Ungnyeo', '🌊', 'ungnyeo'], tough: ['Griffin', '🦅', 'griffin'], armored: ['Chimera', '🦁', 'chimera'], barrel: ['Inmyeonjo', '🐦', 'inmyeonjo'], boss: ['Typhon', '🌪️', 'typhon'] },
    dunes:   { basic: ['Serket', '🦂', 'serket'], tough: ['Sekhmet', '🦁', 'sekhmet'], armored: ['Khepri', '🪲', 'khepri'], barrel: ['Ushabti', '🏺', 'ushabti'], boss: ['Apep', '🐍', 'apep'] },
    oasis:   { basic: ['Bes', '🧌', 'bes'], tough: ['Anubis', '🐺', 'anubis'], armored: ['Ammit', '🐊', 'ammit'], barrel: ['Wadjet', '🐍', 'wadjet'], boss: ['Set', '🌪️', 'set'] },
    canyon:  { basic: ['Cadejo', '🐕', 'cadejo'], tough: ['Balam', '🐆', 'balam'], armored: ['Buluc Chabtan', '🗡️', 'buluc-chabtan'], barrel: ['Bennu', '🐦‍🔥', 'bennu'], boss: ['Ah Puch', '💀', 'ah-puch'] },
    temple:  { basic: ['Mummy', '🧟', 'mummy'], tough: ['Camazotz', '🦇', 'camazotz'], armored: ['Sphinx', '🗿', 'sphinx'], barrel: ['Taweret', '🦛', 'taweret'], boss: ['Ra', '☀️', 'ra'] },
    snow:    { basic: ['Yuki-onna', '❄️', 'yuki-onna'], tough: ['Troll', '👹', 'troll'], armored: ['Haetae', '🦁', 'haetae'], barrel: ['Yutu', '🐇', 'yutu'], boss: ['Jangsan-beom', '🐅', 'jangsan-beom'] },
    frozen:  { basic: ['Nisse', '🎅', 'nisse'], tough: ['Lindworm', '🐛', 'lindworm'], armored: ['Dvergr', '⛏️', 'dvergr'], barrel: ['Ratatoskr', '🐿️', 'ratatoskr'], boss: ['Nidhogg', '🐉', 'nidhogg'] },
    rime:    { basic: ['Draugr', '💀', 'draugr'], tough: ['Valkyrie', '🪽', 'valkyrie'], armored: ['Cyclops', '👁️', 'cyclops'], barrel: ['Dalgyal Gwisin', '🥚', 'dalgyal-gwisin'], boss: ['Hel', '💀', 'hel'] },
    glacier: { basic: ['Jötunn', '🧊', 'jotunn'], tough: ['Sleipnir', '🐴', 'sleipnir'], armored: ['Koschei', '🦴', 'koschei'], barrel: ['Domovoi', '🏠', 'domovoi'], boss: ['Morana', '❄️', 'morana'] },
    ash:     { basic: ['Dokkaebi', '👺', 'dokkaebi'], tough: ['Oni', '👹', 'oni'], armored: ['Cabrakan', '🪨', 'cabrakan'], barrel: ['Bulgae', '🔥', 'bulgae'], boss: ['Surtr', '🔥', 'surtr'] },
    ridge:   { basic: ['Kui', '🦎', 'kui'], tough: ['Zipacna', '🐊', 'zipacna'], armored: ['Hundun', '⚫', 'hundun'], barrel: ['Pixiu', '🦁', 'pixiu'], boss: ['Vucub-Caquix', '🦜', 'vucub-caquix'] },
    lavafall:{ basic: ['Gumiho', '🦊', 'gumiho'], tough: ['Cerberus', '🐕', 'cerberus'], armored: ['Jowangshin', '🏺', 'jowangshin'], barrel: ['Fenghuang', '🐦‍🔥', 'fenghuang'], boss: ['Loki', '🔥', 'loki'] },
    caldera: { basic: ['Huay Chivo', '🐐', 'huay-chivo'], tough: ['Minotaur', '🐂', 'minotaur'], armored: ['Taotie', '🗿', 'taotie'], barrel: ['Firebird', '🐦‍🔥', 'firebird'], boss: ['Zmey Gorynych', '🐉', 'zmey'] },
  };
  // Register every themed enemy with the rules engine.
  for (const sub of Object.keys(THEMES)) {
    for (const role of ['basic', 'tough', 'armored', 'barrel', 'boss']) {
      const [name, icon, art] = THEMES[sub][role];
      Engine.ENEMY_TYPES[sub + '_' + role] = Object.assign(
        { name, icon, art },
        role === 'barrel' ? { barrel: true, blast: 2 } : {},
        role === 'boss' ? { boss: true } : {});
    }
  }

  // ---------- Nodes ----------
  function buildWorld() {
    const nodes = [CAMP];
    for (const sub of SUBAREAS) {
      const add = (id, p, type, level, role) => nodes.push(Object.assign({ id, x: Math.round(p[0]), y: Math.round(p[1]), sub: sub.id, type, level }, role ? { role } : {}));
      const n = sub.spots.length;
      sub.spots.forEach((p, i) => {
        // The first sub-area's early spots stay at its lowest level longer (design 24.1: gentle first runs).
        const level = sub.lv[0] + Math.floor(i * (sub.lv[1] - sub.lv[0] + 1) / n);
        const role = level >= 2 || i >= 2 ? NORMAL_ROLES[i % NORMAL_ROLES.length] : 'basic';
        add(sub.id + '-' + i, p, 'battle', level, role);
      });
      const eliteLv = sub.lv[1] + (sub.regionIndex >= 1 ? 1 : 0);
      sub.elites.forEach((p, i) => add(sub.id + '-e' + i, p, 'elite', eliteLv, 'tough'));
      if (sub.poiPos) add(sub.id + '-poi', sub.poiPos, sub.poi, sub.lv[0]);
      add(sub.id + '-boss', sub.boss, 'boss', sub.bossLv, 'boss');
    }
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    // Free exploration: there is no path graph any more. The empty `edges`/`adj` stay for older callers.
    return { nodes, edges: [], byId, adj: Object.fromEntries(nodes.map((n) => [n.id, []])) };
  }

  // Danger rating in skulls (design 8.1): Lv1-3 = 1, 4-6 = 2, 7-9 = 3, 10-12 = 4, 13+ = 5.
  const danger = (level) => Math.max(1, Math.min(5, Math.ceil(level / 3)));
  const WORLD = Object.assign(buildWorld(), { danger, MAP_W, MAP_H, SUBAREAS, SUB_BY, REGIONS, THEMES, CAMP, hash, rng, NORMAL_ROLES });
  root.World = WORLD;
  if (typeof module !== 'undefined' && module.exports) module.exports = WORLD;
})(typeof window !== 'undefined' ? window : globalThis);
