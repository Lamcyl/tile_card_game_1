// Unit artwork: maps each squad card and each enemy type to its ink drawing.
// Sets window.Art; load after engine.js and world-data.js, before the screens.
const files = import.meta.glob('../assets/units/*.svg', { query: '?url', import: 'default', eager: true });
const URLS = Object.fromEntries(Object.entries(files).map(([path, url]) => [path.split('/').pop().replace('.svg', ''), url]));

// Squad cards by roster id: [drawing, creature name]. Card types keep their rules; the creature is the face.
const UNITS = {
  sword1: ['kamaitachi', 'Kamaitachi'], sword2: ['wukong', 'Sun Wukong'],
  archer1: ['tengu', 'Karasu-tengu'], archer2: ['ravens', 'Huginn & Muninn'],
  spear1: ['nezha', 'Nezha'], spear2: ['leigong', 'Lei Gong'],
  mage1: ['kitsune', 'Kitsune'], mage2: ['ix-chel', 'Ix Chel'],
  drum1: ['raijin', 'Raijin'], drum2: ['perun', 'Perun'],
  banner1: ['komainu', 'Komainu'],
  horn1: ['siren', 'Siren'], horn2: ['alkonost', 'Alkonost'],
  spy1: ['samjok-o', 'Samjok-o'],
  shield1: ['nurikabe', 'Nurikabe'], shield2: ['talos', 'Talos'], ushabti1: ['ushabti', 'Ushabti'],
  longbow1: ['draugr', 'Draugr Longbowman'], storm1: ['typhon', 'Typhon, Storm Mage'], phoenix1: ['firebird', 'Phoenix Archer'],
};
// Fallback drawing per card type, for cards without their own entry.
const BY_TYPE = { swordsman: 'kamaitachi', archer: 'tengu', spearman: 'nezha', mage: 'kitsune', drummer: 'raijin', banner: 'komainu', horn: 'siren', spyglass: 'samjok-o', shield: 'nurikabe' };

const backdrops = import.meta.glob('../assets/battle/*.svg', { query: '?url', import: 'default', eager: true });
const BACKDROPS = Object.fromEntries(Object.entries(backdrops).map(([path, u]) => [path.split('/').pop().replace('.svg', ''), u]));
// WP20: biomes without a painted backdrop yet borrow one (painting marsh / highlands / saltflat / canyon is an art task).
const BACKDROP_ALIAS = { marsh: 'coral', highlands: 'forest', saltflat: 'dunes', canyon: 'dunes', rice: 'meadow', ruins: 'forest', palms: 'dunes', citadel: 'temple' };

const url = (name) => URLS[name] || null;
let V2ART = {}; // V2 unit id -> { art, match }, registered by the dev page from data/v2-unit-art.json
window.Art = {
  url,
  setV2(map) { V2ART = map || {}; },
  // { url, name } for a squad card; card = { id, type }.
  unit(card) {
    if (card.v2) { const a = V2ART[card.unit || card.id]; return { url: a ? url(a.art) : null, name: card.name || null, match: a ? a.match : null }; } // V2 beasts: placeholder drawing by exact / close / family match (dev page)
    const u = UNITS[card.id];
    return { url: url(u ? u[0] : BY_TYPE[card.type]), name: u ? u[1] : null };
  },
  // Drawing for an enemy type key such as 'meadow_basic' (set by world-data.js as `art`).
  enemy(typeKey) {
    const t = window.Engine.ENEMY_TYPES[typeKey];
    return t && t.art ? url(t.art) : null;
  },
  // Painted battle backdrop for a biome (meadow, forest, beach, coral, dunes, temple, snow, glacier, ash, caldera).
  battleBackdrop(biome) { return BACKDROPS[biome] || BACKDROPS[BACKDROP_ALIAS[biome]] || BACKDROPS.meadow || null; },
  // The watercolour theme mockups, for reference backgrounds.
  theme: {
    overview: new URL('../assets/theme/overview.svg', import.meta.url).href,
    explore: new URL('../assets/theme/explore.svg', import.meta.url).href,
    battle: new URL('../assets/theme/battle.svg', import.meta.url).href,
  },
};
