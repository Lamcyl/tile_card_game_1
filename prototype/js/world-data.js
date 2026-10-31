// World map data: regions, sub-areas, enemy themes and the monster spots of every sub-area.
// Node positions are generated from fixed seeds, so the map is the same on
// every run; only the enemies inside each battle change between runs.
(function (root) {
  'use strict';
  const Engine = root.Engine;

  const MAP_W = 1000;
  const MAP_H = 2420;

  // 15 sub-areas, 3 per region, laid out as a tall map: Greenvale in a column above the Camp, then the
  // Azure Coast (left) and Sunscorch (right) climb up from Mirror Lake, ending in Frostveil (left) and
  // Ember Peaks (right) at the top. Free exploration: every monster spot of an unlocked sub-area is open.
  //   bounds   = [x0, y0, x1, y1] ground of the sub-area on the world canvas
  //   landmark = { kind, label, x, y, rx, ry } the feature the sub-area is named for; the layout keeps spots clear of it
  //   entry    = camera focus point; boss = position of the sub-area boss
  //   unlocks  = sub-areas revealed by this sub-area's boss; from = the sub-area (or 'camp') that leads here
  //   lv / bossLv = level range of ordinary spots / of the boss; poi = optional non-battle spot (no Supply cost)
  const SUB_DEFS = [
    { id: 'meadow',  region: 'Greenvale',   name: 'Sunny Meadows',    biome: 'meadow',  lm: ['hill', 'Blossom Hill'],          bounds: [280, 2130, 720, 2348], lv: [1, 2],   bossLv: 3,  unlocks: ['forest'],          from: 'camp',   poi: 'treasure' },
    { id: 'forest',  region: 'Greenvale',   name: 'Old Oak Wood',     biome: 'forest',  lm: ['oak-grove', 'The Elder Oak'],    bounds: [270, 1880, 730, 2098], lv: [2, 3],   bossLv: 4,  unlocks: ['lake'],            from: 'meadow', poi: 'shrine' },
    { id: 'lake',    region: 'Greenvale',   name: 'Mirror Lake',      biome: 'coral',   lm: ['lake', 'Mirror Lake'],           bounds: [290, 1630, 710, 1848], lv: [3, 5],   bossLv: 6,  unlocks: ['beach', 'dunes'],  from: 'forest', poi: 'shrine' },
    { id: 'beach',   region: 'Azure Coast', name: 'Shell Beach',      biome: 'beach',   lm: ['lighthouse', 'Pearl Lighthouse'], bounds: [20, 1380, 410, 1608],  lv: [5, 6],   bossLv: 7,  unlocks: ['coral'],           from: 'lake',   poi: 'treasure' },
    { id: 'coral',   region: 'Azure Coast', name: 'Coral Shallows',   biome: 'coral',   lm: ['reef-arch', 'Coral Arch'],       bounds: [20, 1130, 410, 1358],  lv: [6, 7],   bossLv: 8,  unlocks: ['cove'],           from: 'beach',  poi: null },
    { id: 'cove',    region: 'Azure Coast', name: 'Shipwreck Cove',   biome: 'beach',   lm: ['shipwreck', 'The Wrecked Galleon'], bounds: [20, 880, 410, 1108], lv: [7, 8],   bossLv: 9,  unlocks: ['snow'],           from: 'coral',  poi: 'shrine' },
    { id: 'dunes',   region: 'Sunscorch',   name: 'Dune Sea',         biome: 'dunes',   lm: ['giant-dune', 'Singing Dune'],    bounds: [590, 1380, 980, 1608], lv: [5, 6],   bossLv: 7,  unlocks: ['oasis'],           from: 'lake',   poi: 'shrine' },
    { id: 'oasis',   region: 'Sunscorch',   name: 'Palm Oasis',       biome: 'dunes',   lm: ['oasis', 'Mirage Pool'],          bounds: [590, 1130, 980, 1358], lv: [6, 7],   bossLv: 8,  unlocks: ['temple'],          from: 'dunes',  poi: 'shrine' },
    { id: 'temple',  region: 'Sunscorch',   name: 'Buried Temple',    biome: 'temple',  lm: ['pyramid', 'The Sunken Pyramid'], bounds: [590, 880, 980, 1108],  lv: [7, 8],   bossLv: 9,  unlocks: ['ash'],             from: 'oasis',  poi: 'treasure' },
    { id: 'snow',    region: 'Frostveil',   name: 'Snowdrift Plains', biome: 'snow',    lm: ['ice-peak', 'Whitecap Peak'],     bounds: [20, 630, 410, 858],    lv: [9, 10],  bossLv: 11, unlocks: ['frozen'],          from: 'cove',   poi: null },
    { id: 'frozen',  region: 'Frostveil',   name: 'Frozen Lake',      biome: 'glacier', lm: ['frozen-lake', 'Glass Lake'],     bounds: [20, 380, 410, 608],    lv: [10, 11], bossLv: 12, unlocks: ['rime'],            from: 'snow',   poi: 'treasure' },
    { id: 'rime',    region: 'Frostveil',   name: 'Rime Forest',      biome: 'snow',    lm: ['ice-forest', 'The Crystal Pines'], bounds: [20, 130, 410, 358],  lv: [11, 12], bossLv: 13, unlocks: [],                  from: 'frozen', poi: 'shrine' },
    { id: 'ash',     region: 'Ember Peaks', name: 'Ash Fields',       biome: 'ash',     lm: ['burnt-grove', 'The Cinder Grove'], bounds: [590, 630, 980, 858], lv: [9, 10],  bossLv: 11, unlocks: ['ridge'],           from: 'temple', poi: 'treasure' },
    { id: 'ridge',   region: 'Ember Peaks', name: 'Obsidian Ridge',   biome: 'caldera', lm: ['obsidian-ridge', 'The Glass Ridge'], bounds: [590, 380, 980, 608], lv: [10, 11], bossLv: 12, unlocks: ['caldera'],         from: 'ash',    poi: null },
    { id: 'caldera', region: 'Ember Peaks', name: 'Magma Caldera',    biome: 'caldera', lm: ['volcano', 'Mount Ember'],       bounds: [590, 130, 980, 358],   lv: [11, 12], bossLv: 13, unlocks: [],                  from: 'ridge',  poi: 'shrine' },
  ];
  // Spots per sub-area: 5 ordinary + 1-2 elite + the boss (+ optional point of interest).
  // The icon of an ordinary spot cycles through the sub-area's basic / armored / barrel creatures.
  const NORMAL_ROLES = ['basic', 'armored', 'barrel', 'basic', 'armored'];
  const SUBAREAS = SUB_DEFS.map((d, i) => {
    const [x0, y0, x1, y1] = d.bounds, w = x1 - x0, h = y1 - y0, flip = i % 2 === 1;
    const rx = Math.min(58, w * 0.16), ry = rx * 0.62;
    const lmX = x0 + w * (flip ? 0.7 : 0.3), lmY = y0 + h * 0.62;
    return {
      id: d.id, region: d.region, name: d.name, biome: d.biome, bounds: d.bounds, lv: d.lv, bossLv: d.bossLv, unlocks: d.unlocks, from: d.from, poi: d.poi,
      landmark: { kind: d.lm[0], label: d.lm[1], x: Math.round(lmX), y: Math.round(lmY), rx: Math.round(rx), ry: Math.round(ry) },
      entry: [Math.round(x0 + w * 0.5), Math.round(y1 - 40)],
      boss: [Math.round(x0 + w * (flip ? 0.3 : 0.7)), Math.round(y0 + 100)],
      elites: i < 2 ? 1 : 2,
      regionIndex: ['Greenvale', 'Azure Coast', 'Sunscorch', 'Frostveil', 'Ember Peaks'].indexOf(d.region),
    };
  });
  const REGIONS = ['Greenvale', 'Azure Coast', 'Sunscorch', 'Frostveil', 'Ember Peaks'];
  const SUB_BY = Object.fromEntries(SUBAREAS.map((s) => [s.id, s]));
  const CAMP = { id: 'camp', type: 'camp', x: 500, y: 2378, sub: 'meadow', level: 0 };

  // Enemy themes per sub-area: basic, tough, armored, barrel skin and boss.
  // Each entry is [name, emoji fallback, drawing in assets/units/].
  const THEMES = {
    meadow:  { basic: ['Alux', '👺', 'alux'], tough: ['Tanuki', '🦝', 'tanuki'], armored: ['Jangseung', '🗿', 'jangseung'], barrel: ['Chōchin-obake', '🏮', 'chochin-obake'], boss: ['Sansin', '🐯', 'sansin'] },
    forest:  { basic: ['Kodama', '🌱', 'kodama'], tough: ['Leshy', '🌳', 'leshy'], armored: ['Bulgasari', '🐗', 'bulgasari'], barrel: ['Kasa-obake', '☂️', 'kasa-obake'], boss: ['Yamata no Orochi', '🐍', 'orochi'] },
    lake:    { basic: ['Bannik', '🛁', 'bannik'], tough: ['Jorogumo', '🕷️', 'jorogumo'], armored: ['Baku', '🐘', 'baku'], barrel: ['Hitotsume-kozo', '👁️', 'hitotsume-kozo'], boss: ['Medusa', '🐍', 'medusa'] },
    beach:   { basic: ['Kappa', '🐢', 'kappa'], tough: ['Sobek', '🐊', 'sobek'], armored: ['Xuanwu', '🐢', 'xuanwu'], barrel: ['Jingwei', '🐦', 'jingwei'], boss: ['Scylla', '🐙', 'scylla'] },
    coral:   { basic: ['Mul Gwisin', '👻', 'mul-gwisin'], tough: ['Jörmungandr', '🐍', 'jormungandr'], armored: ['Imugi', '🐉', 'imugi'], barrel: ['Rusalka', '🧜', 'rusalka'], boss: ['Poseidon', '🔱', 'poseidon'] },
    cove:    { basic: ['Harpy', '🦅', 'harpy'], tough: ['Gashadokuro', '💀', 'gashadokuro'], armored: ['Nemean Lion', '🦁', 'nemean-lion'], barrel: ['Cheonyeo Gwisin', '👻', 'cheonyeo-gwisin'], boss: ['Hydra', '🐲', 'hydra'] },
    dunes:   { basic: ['Serket', '🦂', 'serket'], tough: ['Sekhmet', '🦁', 'sekhmet'], armored: ['Khepri', '🪲', 'khepri'], barrel: ['Ushabti', '🏺', 'ushabti'], boss: ['Apep', '🐍', 'apep'] },
    oasis:   { basic: ['Bes', '🧌', 'bes'], tough: ['Anubis', '🐺', 'anubis'], armored: ['Ammit', '🐊', 'ammit'], barrel: ['Wadjet', '🐍', 'wadjet'], boss: ['Set', '🌪️', 'set'] },
    temple:  { basic: ['Mummy', '🧟', 'mummy'], tough: ['Camazotz', '🦇', 'camazotz'], armored: ['Sphinx', '🗿', 'sphinx'], barrel: ['Taweret', '🦛', 'taweret'], boss: ['Ra', '☀️', 'ra'] },
    snow:    { basic: ['Yuki-onna', '❄️', 'yuki-onna'], tough: ['Troll', '👹', 'troll'], armored: ['Haetae', '🦁', 'haetae'], barrel: ['Yutu', '🐇', 'yutu'], boss: ['Jangsan-beom', '🐅', 'jangsan-beom'] },
    frozen:  { basic: ['Nisse', '🎅', 'nisse'], tough: ['Lindworm', '🐛', 'lindworm'], armored: ['Dvergr', '⛏️', 'dvergr'], barrel: ['Ratatoskr', '🐿️', 'ratatoskr'], boss: ['Nidhogg', '🐉', 'nidhogg'] },
    rime:    { basic: ['Draugr', '💀', 'draugr'], tough: ['Valkyrie', '🪽', 'valkyrie'], armored: ['Cyclops', '👁️', 'cyclops'], barrel: ['Dalgyal Gwisin', '🥚', 'dalgyal-gwisin'], boss: ['Hel', '💀', 'hel'] },
    ash:     { basic: ['Dokkaebi', '👺', 'dokkaebi'], tough: ['Oni', '👹', 'oni'], armored: ['Cabrakan', '🪨', 'cabrakan'], barrel: ['Bulgae', '🔥', 'bulgae'], boss: ['Surtr', '🔥', 'surtr'] },
    ridge:   { basic: ['Kui', '🦎', 'kui'], tough: ['Zipacna', '🐊', 'zipacna'], armored: ['Hundun', '⚫', 'hundun'], barrel: ['Pixiu', '🦁', 'pixiu'], boss: ['Vucub-Caquix', '🦜', 'vucub-caquix'] },
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

  // ---------- Deterministic node layout ----------
  function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) % 2147483646 + 1; }
  function rng(seed) { let s = typeof seed === 'number' ? seed : hash(seed); return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // Scatter `count` points inside a sub-area, away from the landmark, the boss and each other.
  function scatterSpots(sub, count, R) {
    const [x0, y0, x1, y1] = sub.bounds, lm = sub.landmark, boss = { x: sub.boss[0], y: sub.boss[1] };
    const pts = [];
    for (let gap = 74; gap >= 52 && pts.length < count; gap -= 4) {
      for (let tries = 0; tries < 1500 && pts.length < count; tries++) {
        const p = { x: x0 + 38 + R() * (x1 - x0 - 76), y: y0 + 62 + R() * (y1 - y0 - 80) };
        const ex = (p.x - lm.x) / (lm.rx + 30), ey = (p.y - lm.y) / (lm.ry + 26);
        if (ex * ex + ey * ey < 1) continue;
        if (Math.hypot(p.x - boss.x, (p.y - boss.y) * 0.9) < 96) continue;
        if (pts.every((q) => dist(p, q) > gap)) pts.push(p);
      }
    }
    return pts;
  }

  function buildWorld() {
    const nodes = [CAMP];
    for (const sub of SUBAREAS) {
      const R = rng('layout:' + sub.id);
      const cx = (sub.bounds[0] + sub.bounds[2]) / 2, entry = { x: cx, y: sub.bounds[3] };
      const want = 5 + sub.elites + (sub.poi ? 1 : 0);
      const pts = scatterSpots(sub, want, R);
      // Nearest the entrance = easiest; the farthest are the elites; the point of interest sits mid-way.
      pts.sort((a, b) => dist(a, entry) - dist(b, entry));
      const eliteIds = new Set(pts.slice(-sub.elites).map((p) => p)), poiPt = sub.poi && pts.length > 5 ? pts[Math.floor(pts.length / 2)] : null;
      const normals = pts.filter((p) => !eliteIds.has(p) && p !== poiPt);
      const bossPt = { x: sub.boss[0], y: sub.boss[1] };
      const add = (id, p, type, level, role) => nodes.push(Object.assign({ id, x: Math.round(p.x), y: Math.round(p.y), sub: sub.id, type, level }, role ? { role } : {}));
      normals.forEach((p, i) => {
        const level = Math.round(sub.lv[0] + (normals.length > 1 ? i / (normals.length - 1) : 0) * (sub.lv[1] - sub.lv[0]));
        const role = level >= 2 || i >= 2 ? NORMAL_ROLES[i % NORMAL_ROLES.length] : 'basic';
        add(sub.id + '-' + i, p, 'battle', level, role);
      });
      const eliteLv = sub.lv[1] + (sub.regionIndex >= 1 ? 1 : 0);
      [...eliteIds].forEach((p, i) => add(sub.id + '-e' + i, p, 'elite', eliteLv, 'tough'));
      if (poiPt) add(sub.id + '-poi', poiPt, sub.poi, sub.lv[0]);
      add(sub.id + '-boss', bossPt, 'boss', sub.bossLv, 'boss');
    }
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    // Free exploration: there is no path graph any more. The empty `edges`/`adj` stay for older callers.
    return { nodes, edges: [], byId, adj: Object.fromEntries(nodes.map((n) => [n.id, []])) };
  }

  const WORLD = Object.assign(buildWorld(), { MAP_W, MAP_H, SUBAREAS, SUB_BY, REGIONS, THEMES, CAMP, hash, rng, NORMAL_ROLES });
  root.World = WORLD;
  if (typeof module !== 'undefined' && module.exports) module.exports = WORLD;
})(typeof window !== 'undefined' ? window : globalThis);
