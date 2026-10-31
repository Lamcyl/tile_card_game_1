// Equipment items: permanent passive bonuses dropped by monster spots.
// Every battle, elite and boss spot has one UNIQUE item that only it drops, plus shared items from
// its sub-area and region pools. Items are kept between runs; up to 3 can be equipped.
// Effects are applied by Progress (buildArmy / maxHp / startSupplies / soulRate) through Items.bonuses().
(function (root) {
  'use strict';
  const World = root.World, Engine = root.Engine;

  const SLOTS = 3;
  const RARITY = { common: { name: 'Common', order: 0 }, rare: { name: 'Rare', order: 1 }, epic: { name: 'Epic', order: 2 } };
  // Strength of each effect by rarity.
  const MAG = {
    atk:      { common: 1, rare: 2, epic: 3 },
    block:    { common: 1, rare: 2, epic: 3 },
    hp:       { common: 2, rare: 4, epic: 6 },
    souls:    { common: 8, rare: 15, epic: 25 },
    amount:   { rare: 1, epic: 2 },
    supplies: { rare: 1, epic: 2 },
    range:    { rare: 1, epic: 1 },
  };
  const ATK_TYPES = ['swordsman', 'archer', 'spearman', 'mage'];
  const AMOUNT_TYPES = ['drummer', 'banner', 'spyglass'];
  const RANGE_TYPES = ['swordsman', 'spearman', 'mage'];
  const NOUNS = {
    'atk:swordsman': ['Fang', 'Claw', 'Talon', 'Edge'], 'atk:archer': ['Feather', 'Quill', 'Eye', 'Bowstring'],
    'atk:spearman': ['Horn', 'Tusk', 'Barb', 'Spearhead'], 'atk:mage': ['Charm', 'Lantern', 'Pearl', 'Ember'],
    block: ['Scale', 'Hide', 'Plate', 'Shell'], hp: ['Heart', 'Bone', 'Mantle', 'Amulet'], souls: ['Seal', 'Bead', 'Offering', 'Talisman'],
    'amount:drummer': ['Drumskin', 'Rattle', 'Beat-Stone'], 'amount:banner': ['Pennant', 'Sash', 'Tassel'], 'amount:spyglass': ['Lens', 'Gemstone', 'Prism'],
    supplies: ['Satchel', 'Flask', 'Pouch', 'Ration Tin'], range: ['Sigil', 'Crest', 'Mark', 'Rune'],
  };
  const EPIC_ADJ = ['Royal', 'Ancient', 'Gilded', 'Storied'];
  const PLURAL = { swordsman: 'Swordsmen', spearman: 'Spearmen', spyglass: 'Spyglasses' };
  const plural = (t) => PLURAL[t] || Engine.CARD_TYPES[t].name + 's';

  // Shared items: [name, effect, rarity]. Effect = kind or kind:cardType. Three per sub-area, two per region.
  const SUB_SHARED = {
    meadow:  [['Clover Wristband', 'atk:swordsman', 'common'], ['Dewdrop Pendant', 'hp', 'common'], ['Sunflower Pennant', 'amount:banner', 'rare']],
    forest:  [['Acorn Charm', 'souls', 'common'], ['Oak Bark Bracer', 'block', 'common'], ['Woodcutter\'s Axe-Head', 'atk:spearman', 'rare']],
    lake:    [['Heron Feather Quill', 'atk:archer', 'common'], ['Lakeside Reed Cloak', 'hp', 'common'], ['Mirror Shard Lens', 'amount:spyglass', 'rare']],
    beach:   [['Conch Charm', 'atk:mage', 'common'], ['Driftwood Shield Rim', 'block', 'common'], ['Sea-Glass Sigil', 'range:mage', 'rare']],
    coral:   [['Pink Coral Bead', 'souls', 'common'], ['Reefstone Plate', 'block', 'common'], ['Pearl Diver\'s Satchel', 'supplies', 'rare']],
    cove:    [['Rusted Cutlass Edge', 'atk:swordsman', 'common'], ['Barnacle Hide', 'hp', 'common'], ['Sea Chest Key', 'supplies', 'rare']],
    dunes:   [['Sand-Etched Dagger', 'atk:swordsman', 'common'], ['Dune Silk Wrap', 'hp', 'common'], ['Caravan Water Flask', 'supplies', 'rare']],
    oasis:   [['Date Palm Charm', 'souls', 'common'], ['Lotus Pool Bead', 'hp', 'common'], ['Reed Sandal Drumskin', 'amount:drummer', 'rare']],
    temple:  [['Scarab Amulet', 'souls', 'common'], ['Sandstone Tablet Plate', 'block', 'common'], ['Gilded Lotus Lens', 'amount:spyglass', 'rare']],
    snow:    [['Snowshoe Cord', 'hp', 'common'], ['Icicle Arrowhead', 'atk:archer', 'common'], ['Hide-Lined Mantle', 'block', 'rare']],
    frozen:  [['Skate Blade Edge', 'atk:swordsman', 'common'], ['Ice-Fisher\'s Bead', 'souls', 'common'], ['Glass Lake Sigil', 'range:spearman', 'rare']],
    rime:    [['Rime-Pine Charm', 'atk:mage', 'common'], ['Crystal Bough Plate', 'block', 'common'], ['Hoarfrost Pennant', 'amount:banner', 'rare']],
    ash:     [['Cinder Brand', 'atk:swordsman', 'common'], ['Ash-Wrapped Talisman', 'souls', 'common'], ['Charred Bone Rim', 'block', 'rare']],
    ridge:   [['Obsidian Flake Arrowhead', 'atk:archer', 'common'], ['Glassforged Plate', 'block', 'common'], ['Volcanic Glass Sigil', 'range:spearman', 'rare']],
    caldera: [['Magma Core Lantern', 'atk:mage', 'common'], ['Emberheart Locket', 'hp', 'common'], ['Phoenix Ash Satchel', 'supplies', 'rare']],
  };
  const REGION_SHARED = {
    'Greenvale':   [['Wayfarer\'s Pouch', 'supplies', 'rare'], ['Verdant Heartwood', 'hp', 'rare']],
    'Azure Coast': [['Tidecaller\'s Cord', 'souls', 'rare'], ['Gull-Feather Quiver', 'atk:archer', 'rare']],
    'Sunscorch':   [['Sunstone Blade', 'atk:swordsman', 'rare'], ['Nomad\'s Waterskin', 'supplies', 'rare']],
    'Frostveil':   [['Rimecloak', 'block', 'rare'], ['Aurora Shard', 'range:mage', 'rare']],
    'Ember Peaks': [['Emberforged Band', 'atk:spearman', 'rare'], ['Cinder Crown', 'souls', 'rare']],
  };

  const ALL = [], BY_ID = {}, UNIQUE_OF = {}, USED_NAMES = new Set();

  function make(id, name, rarity, effect, source) {
    const [kind, type] = effect.split(':');
    const mag = MAG[kind], amount = mag[rarity] !== undefined ? mag[rarity] : mag.rare;
    const item = { id, name, rarity, kind, type: type || null, amount, source };
    ALL.push(item); BY_ID[id] = item; USED_NAMES.add(name);
    return item;
  }

  // ----- Unique item of each monster spot -----
  function pickWeighted(R, entries) {
    let total = 0; for (const e of entries) total += e[1];
    let x = R() * total;
    for (const e of entries) { x -= e[1]; if (x < 0) return e[0]; }
    return entries[entries.length - 1][0];
  }
  function uniqueEffect(node, rarity, R) {
    const region = World.SUB_BY[node.sub].regionIndex;
    const kinds = [['atk', 4], ['block', 2], ['hp', 3], ['souls', 2]];
    if (rarity !== 'common') kinds.push(['amount', 2], ['supplies', 1.4]);
    if (rarity !== 'common' && region >= 1) kinds.push(['range', 1.4]); // range is a rare, mid-game effect
    const kind = pickWeighted(R, kinds);
    const pool = kind === 'atk' ? ATK_TYPES : kind === 'amount' ? AMOUNT_TYPES : kind === 'range' ? RANGE_TYPES : null;
    return pool ? kind + ':' + pool[Math.floor(R() * pool.length)] : kind;
  }
  function creatureOf(node) {
    const t = World.THEMES[node.sub];
    return (node.type === 'boss' ? t.boss : node.type === 'elite' ? t.tough : t[node.role || 'basic'])[0];
  }
  function uniqueName(node, effect, rarity, R) {
    const nouns = NOUNS[effect.startsWith('range') ? 'range' : effect];
    const base = creatureOf(node), adj = rarity === 'epic' ? EPIC_ADJ[Math.floor(R() * EPIC_ADJ.length)] + ' ' : '';
    const start = Math.floor(R() * nouns.length);
    for (let i = 0; i < nouns.length; i++) {
      const name = base + '\'s ' + adj + nouns[(start + i) % nouns.length];
      if (!USED_NAMES.has(name)) return name;
    }
    return base + '\'s ' + adj + nouns[start] + ' ' + ['II', 'III', 'IV', 'V'][USED_NAMES.size % 4];
  }
  for (const node of World.nodes) {
    if (!['battle', 'elite', 'boss'].includes(node.type)) continue;
    const R = World.rng('item:' + node.id);
    const rarity = node.type === 'boss' ? 'epic' : node.type === 'elite' ? (R() < 0.2 && World.SUB_BY[node.sub].regionIndex >= 1 ? 'epic' : 'rare') : (R() < 0.68 ? 'common' : 'rare');
    const effect = uniqueEffect(node, rarity, R);
    UNIQUE_OF[node.id] = make('u:' + node.id, uniqueName(node, effect, rarity, R), rarity, effect, { kind: 'unique', spot: node.id, sub: node.sub });
  }
  // ----- Shared pools -----
  const subPool = {}, regionPool = {};
  for (const sub of World.SUBAREAS) {
    subPool[sub.id] = SUB_SHARED[sub.id].map((d, i) => make('s:' + sub.id + ':' + i, d[0], d[2], d[1], { kind: 'sub', sub: sub.id }));
  }
  for (const region of World.REGIONS) {
    regionPool[region] = REGION_SHARED[region].map((d, i) => make('r:' + region + ':' + i, d[0], d[2], d[1], { kind: 'region', region }));
  }

  // Drop chances for a win: [unique, shared from sub-area, shared from region].
  const CHANCE = { battle: [0.25, 0.07, 0.04], elite: [0.40, 0.12, 0.07], boss: [0.35, 0.18, 0.10] };

  // Everything a spot can drop, unique item first: [{ id, kind, chance }].
  function tableFor(node) {
    if (typeof node === 'string') node = World.byId[node];
    if (!node || !UNIQUE_OF[node.id]) return [];
    const c = CHANCE[node.type], h = World.hash(node.id), sp = subPool[node.sub], rp = regionPool[World.SUB_BY[node.sub].region];
    const a = h % sp.length, b = (a + 1) % sp.length;
    return [
      { id: UNIQUE_OF[node.id].id, kind: 'unique', chance: c[0] },
      { id: sp[a].id, kind: 'sub', chance: c[1] },
      { id: sp[b].id, kind: 'sub', chance: c[1] },
      { id: rp[h % rp.length].id, kind: 'region', chance: c[2] },
    ];
  }

  // Roll the drop for beating `node`. At most one item per battle. A boss's unique item is
  // guaranteed the first time that boss falls. Owned items are skipped. Returns an item id or null.
  function rollDrop(save, node, seed) {
    const R = World.rng(seed + ':drop:' + node.id), owned = new Set(save.items);
    const firstBoss = node.type === 'boss' && !save.bossesBeaten.includes(node.sub);
    let pick = null;
    for (const e of tableFor(node)) {
      const roll = R();
      if (pick || owned.has(e.id)) continue;
      if (roll < (e.kind === 'unique' && firstBoss ? 1 : e.chance)) pick = e.id;
    }
    return pick;
  }
  // A guaranteed drop (first run, section 24.3): the spot's unique item, else a shared one not owned yet.
  function guaranteedDrop(save, node) {
    const owned = new Set(save.items);
    const e = tableFor(node).find((t) => !owned.has(t.id));
    return e ? e.id : null;
  }

  function describe(item) {
    const n = item.amount;
    switch (item.kind) {
      case 'atk': return '+' + n + ' ATK to ' + plural(item.type);
      case 'block': return 'Shields block +' + n;
      case 'hp': return '+' + n + ' max HP';
      case 'souls': return '+' + n + '% Souls';
      case 'amount': return plural(item.type) + ' give +' + n + ' more';
      case 'supplies': return '+' + n + ' starting Supplies';
      case 'range': return '+' + n + ' range to ' + plural(item.type);
      default: return '';
    }
  }
  function icon(item) {
    if (item.type) return Engine.CARD_TYPES[item.type].icon;
    return { block: '🛡️', hp: '❤️', souls: '✦', supplies: '🎒' }[item.kind] || '✨';
  }

  // Sum of the equipped items' effects.
  function bonuses(save) {
    const b = { atk: {}, amount: {}, range: {}, block: 0, hp: 0, supplies: 0, souls: 0 };
    for (const id of (save && save.equipped) || []) {
      const it = BY_ID[id]; if (!it) continue;
      if (it.type) b[it.kind][it.type] = (b[it.kind][it.type] || 0) + it.amount;
      else b[it.kind] += it.amount;
    }
    return b;
  }

  const Items = { SLOTS, RARITY, ALL, BY_ID, UNIQUE_OF, CHANCE, subPool, regionPool, tableFor, rollDrop, guaranteedDrop, describe, icon, bonuses, creatureOf };
  root.Items = Items;
  if (typeof module !== 'undefined' && module.exports) module.exports = Items;
})(typeof window !== 'undefined' ? window : globalThis);
