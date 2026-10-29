// World map data: regions, sub-areas, enemy themes and the node graph.
// Node positions are generated from fixed seeds, so the map is the same on
// every run; only the enemies inside each battle change between runs.
(function (root) {
  'use strict';
  const Engine = root.Engine;

  const MAP_W = 1000;
  const MAP_H = 1720;

  // Sub-areas in unlock order. Each boss unlocks the sub-areas in `unlocks`.
  // bounds = [x0, y0, x1, y1]; entry/boss are fixed landmark positions.
  const SUBAREAS = [
    { id: 'meadow',  region: 'Greenvale',     name: 'Sunny Meadows',   biome: 'meadow',  bounds: [300, 1385, 700, 1625], entry: [500, 1575], boss: [500, 1428], lv: [1, 2],   bossLv: 3,  unlocks: ['forest'], from: 'camp' },
    { id: 'forest',  region: 'Greenvale',     name: 'Old Oak Wood',    biome: 'forest',  bounds: [285, 1135, 715, 1350], entry: [500, 1322], boss: [500, 1160], lv: [2, 4],   bossLv: 5,  unlocks: ['beach', 'dunes'], from: 'meadow' },
    { id: 'beach',   region: 'Azure Coast',   name: 'Shell Beach',     biome: 'beach',   bounds: [40, 905, 330, 1185],   entry: [290, 1130], boss: [175, 925],  lv: [4, 6],   bossLv: 7,  unlocks: ['coral'], from: 'forest' },
    { id: 'coral',   region: 'Azure Coast',   name: 'Coral Shallows',  biome: 'coral',   bounds: [30, 625, 330, 890],    entry: [185, 865],  boss: [185, 650],  lv: [6, 8],   bossLv: 9,  unlocks: ['snow'], from: 'beach' },
    { id: 'dunes',   region: 'Sunscorch',     name: 'Dune Sea',        biome: 'dunes',   bounds: [670, 905, 965, 1185],  entry: [710, 1130], boss: [825, 925],  lv: [4, 6],   bossLv: 7,  unlocks: ['temple'], from: 'forest' },
    { id: 'temple',  region: 'Sunscorch',     name: 'Buried Temple',   biome: 'temple',  bounds: [670, 625, 970, 890],    entry: [815, 865],  boss: [815, 650],  lv: [6, 8],   bossLv: 9,  unlocks: ['ash'], from: 'dunes' },
    { id: 'snow',    region: 'Frostveil',     name: 'Snowdrift Plains', biome: 'snow',   bounds: [40, 345, 455, 600],    entry: [200, 580],  boss: [250, 365],  lv: [8, 10],  bossLv: 11, unlocks: ['glacier'], from: 'coral' },
    { id: 'glacier', region: 'Frostveil',     name: 'Glacier Throne',  biome: 'glacier', bounds: [45, 50, 455, 330],     entry: [250, 310],  boss: [250, 75],   lv: [10, 12], bossLv: 13, unlocks: [], from: 'snow' },
    { id: 'ash',     region: 'Ember Peaks',   name: 'Ash Fields',      biome: 'ash',     bounds: [545, 345, 960, 600],   entry: [800, 580],  boss: [750, 365],  lv: [8, 10],  bossLv: 11, unlocks: ['caldera'], from: 'temple' },
    { id: 'caldera', region: 'Ember Peaks',   name: 'Magma Caldera',   biome: 'caldera', bounds: [545, 50, 955, 330],    entry: [750, 310],  boss: [750, 75],   lv: [10, 12], bossLv: 13, unlocks: [], from: 'ash' },
  ];
  const SUB_BY = Object.fromEntries(SUBAREAS.map((s) => [s.id, s]));
  const CAMP = { id: 'camp', type: 'camp', x: 500, y: 1675, sub: 'meadow', level: 0 };

  // Enemy themes per sub-area: basic, tough, armored, barrel skin and boss.
  const THEMES = {
    meadow:  { basic: ['Goblin', '👺'], tough: ['Bull', '🐂'], armored: ['Hedgehog', '🦔'], barrel: ['Powder Barrel', '🛢️'], boss: ['Boar King', '🐗'] },
    forest:  { basic: ['Wolf', '🐺'], tough: ['Bear', '🐻'], armored: ['Thornling', '🌲'], barrel: ['Puffshroom', '🍄'], boss: ['Elder Treant', '🌳'] },
    beach:   { basic: ['Pirate', '🏴‍☠️'], tough: ['Walrus', '🦭'], armored: ['Hermit Crab', '🐚'], barrel: ['Powder Keg', '🛢️'], boss: ['Crab Queen', '🦀'] },
    coral:   { basic: ['Squid', '🦑'], tough: ['Shark', '🦈'], armored: ['Turtle', '🐢'], barrel: ['Pufferfish', '🐡'], boss: ['Kraken', '🐙'] },
    dunes:   { basic: ['Jackal', '🐕'], tough: ['Camel Rider', '🐪'], armored: ['Scorpion', '🦂'], barrel: ['Cactus', '🌵'], boss: ['Sand Wyrm', '🐍'] },
    temple:  { basic: ['Mummy', '🧟'], tough: ['Bat Swarm', '🦇'], armored: ['Guardian', '🗿'], barrel: ['Cursed Urn', '🏺'], boss: ['Sun Pharaoh', '🤴'] },
    snow:    { basic: ['Penguin', '🐧'], tough: ['Yeti', '🦍'], armored: ['Snowman', '⛄'], barrel: ['Frost Bomb', '🧊'], boss: ['Frost Wolf', '🐺'] },
    glacier: { basic: ['Ice Wisp', '👻'], tough: ['Mammoth', '🦣'], armored: ['Ice Golem', '☃️'], barrel: ['Ice Crystal', '💎'], boss: ['Ice Queen', '👸'] },
    ash:     { basic: ['Imp', '😈'], tough: ['Fire Spirit', '🔥'], armored: ['Rock Golem', '🪨'], barrel: ['Fire Bomb', '💣'], boss: ['Ash Colossus', '👹'] },
    caldera: { basic: ['Salamander', '🦎'], tough: ['Demon', '👿'], armored: ['Obsidian Golem', '🗿'], barrel: ['Magma Bomb', '💣'], boss: ['Magma Dragon', '🐉'] },
  };
  // Register every themed enemy with the rules engine.
  for (const sub of Object.keys(THEMES)) {
    for (const role of ['basic', 'tough', 'armored', 'barrel', 'boss']) {
      const [name, icon] = THEMES[sub][role];
      Engine.ENEMY_TYPES[sub + '_' + role] = Object.assign(
        { name, icon },
        role === 'barrel' ? { barrel: true, blast: 2 } : {},
        role === 'boss' ? { boss: true } : {});
    }
  }

  // ---------- Deterministic node layout ----------
  function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) % 2147483646 + 1; }
  function rng(seed) { let s = typeof seed === 'number' ? seed : hash(seed); return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function buildWorld() {
    const nodes = [CAMP];
    const edges = [];
    const link = (a, b) => { if (!edges.some((e) => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a))) edges.push([a, b]); };

    for (const sub of SUBAREAS) {
      const R = rng('layout:' + sub.id);
      const [x0, y0, x1, y1] = sub.bounds;
      const entry = { id: sub.id + '-0', x: sub.entry[0], y: sub.entry[1] };
      const boss = { id: sub.id + '-boss', x: sub.boss[0], y: sub.boss[1] };
      const pts = [entry];
      // Poisson-style scatter inside the sub-area.
      for (let tries = 0; tries < 600 && pts.length < 7; tries++) {
        const p = { x: x0 + 35 + R() * (x1 - x0 - 70), y: y0 + 35 + R() * (y1 - y0 - 70) };
        if (pts.every((q) => dist(p, q) > 78) && dist(p, boss) > 95) pts.push(p);
      }
      pts.push(boss);
      pts.forEach((p, i) => { if (!p.id) p.id = sub.id + '-' + i; });

      // Minimum spanning tree, then a few short extra links for route choice.
      const inTree = [pts[0]];
      const rest = pts.slice(1);
      while (rest.length) {
        let best = null;
        for (const a of inTree) for (const b of rest) {
          if (b === boss && rest.length > 1) continue; // boss joins last, so it sits at the end of a route
          const d = dist(a, b); if (!best || d < best.d) best = { a, b, d };
        }
        link(best.a.id, best.b.id); inTree.push(best.b); rest.splice(rest.indexOf(best.b), 1);
      }
      for (const a of pts) {
        if (a === boss) continue;
        const near = pts.filter((b) => b !== a && b !== boss).sort((p, q) => dist(a, p) - dist(a, q));
        if (near[1] && dist(a, near[1]) < 135) link(a.id, near[1].id);
      }

      // Types and danger levels: further from the entry = more dangerous.
      const maxD = Math.max(...pts.map((p) => dist(p, entry)));
      const order = pts.filter((p) => p !== entry && p !== boss).sort((p, q) => dist(p, entry) - dist(q, entry));
      const special = {};
      if (order.length >= 3) {
        special[order[Math.floor(order.length / 2) - 1].id] = sub.id === 'meadow' ? 'treasure' : 'shrine';
        special[order[order.length - 1].id] = 'elite';
        if (sub.id !== 'meadow') special[order[Math.floor(order.length / 2)].id] = 'treasure';
      }
      for (const p of pts) {
        const frac = dist(p, entry) / maxD;
        const type = p === boss ? 'boss' : special[p.id] || 'battle';
        const level = p === boss ? sub.bossLv : Math.round(sub.lv[0] + frac * (sub.lv[1] - sub.lv[0])) + (type === 'elite' ? 1 : 0);
        nodes.push({ id: p.id, x: Math.round(p.x), y: Math.round(p.y), sub: sub.id, type, level });
      }
      // Connect to the previous sub-area's boss (or the camp).
      link(sub.from === 'camp' ? 'camp' : sub.from + '-boss', entry.id);
    }
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const adj = Object.fromEntries(nodes.map((n) => [n.id, []]));
    for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
    return { nodes, edges, byId, adj };
  }

  const WORLD = Object.assign(buildWorld(), { MAP_W, MAP_H, SUBAREAS, SUB_BY, THEMES, CAMP, hash, rng });
  root.World = WORLD;
  if (typeof module !== 'undefined' && module.exports) module.exports = WORLD;
})(typeof window !== 'undefined' ? window : globalThis);
