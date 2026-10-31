// Equipment items: permanent passive bonuses dropped by monster spots.
// Every battle, elite and boss spot has one UNIQUE item that only it drops, plus shared items from
// its sub-area and region pools. Items are kept between runs; up to 3 can be equipped.
// Effects are applied by Progress (buildArmy / maxHp / startSupplies / soulRate) through Items.bonuses().
// WP8: named slots (Weapon, Armor, Banner, Ring x2), item level (from the node's level, scales every number),
// substats on Rare/Epic/Legendary items (stored per owned item in save.itemData), boss Legendaries with a unique rule effect
// (engine rules, see Items.rules), bad-luck protection (save.luck), boss tokens (save.tokens) and Dust from salvage and duplicates.
(function (root) {
  'use strict';
  const World = root.World, Engine = root.Engine;

  // Equipment slots. Rings take anything; the other items prefer their own slot and overflow into a free ring.
  const SLOT_LIST = [
    { id: 'weapon', name: 'Weapon', icon: '⚔️', fits: 'weapon' }, { id: 'armor', name: 'Armor', icon: '🛡️', fits: 'armor' },
    { id: 'banner', name: 'Banner', icon: '🚩', fits: 'banner' }, { id: 'ring1', name: 'Ring', icon: '💍', fits: 'ring' }, { id: 'ring2', name: 'Ring', icon: '💍', fits: 'ring' },
  ];
  const SLOT_KEYS = SLOT_LIST.map((s) => s.id);
  const SLOTS = SLOT_LIST.length;
  const SLOT_NAMES = { weapon: 'Weapon', armor: 'Armor', banner: 'Banner', ring: 'Ring' };
  const slotForKind = (kind) => (kind === 'atk' ? 'weapon' : kind === 'block' || kind === 'hp' ? 'armor' : kind === 'amount' ? 'banner' : 'ring');
  const RARITY = { common: { name: 'Common', order: 0 }, rare: { name: 'Rare', order: 1 }, epic: { name: 'Epic', order: 2 }, legendary: { name: 'Legendary', order: 3 } };
  const TOKENS_NEEDED = 6;            // boss tokens that buy one of the boss's Legendaries
  const LEGEND_CHANCE = 0.05, LEGEND_PITY = 0.04; // per boss kill, +4% for every kill without a Legendary
  const UNIQUE_PITY = 0.05, PITY_CAP = 0.9;       // unique item: +5% for every win without it
  const ILVL_STEP = 0.05;                         // every item level adds +5% to each number (rounded down)
  const scale = (base, lv) => Math.max(base, Math.floor(base * (1 + ILVL_STEP * ((lv || 1) - 1)) + 1e-9));
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

  // Shared items: [name, effect, rarity]. Effect = kind or kind:cardType. Three per sub-area, two per region (20 sub-areas, 5 regions).
  const SUB_SHARED = {
    meadow:  [['Clover Wristband', 'atk:swordsman', 'common'], ['Dewdrop Pendant', 'hp', 'common'], ['Sunflower Pennant', 'amount:banner', 'rare']],
    forest:  [['Acorn Charm', 'souls', 'common'], ['Oak Bark Bracer', 'block', 'common'], ['Woodcutter\'s Axe-Head', 'atk:spearman', 'rare']],
    bamboo:  [['Bamboo Shoot Pendant', 'hp', 'common'], ['Jade Leaf Quill', 'atk:archer', 'common'], ['Panda-Hide Wrap', 'block', 'rare']],
    lake:    [['Heron Feather Quill', 'atk:archer', 'common'], ['Lakeside Reed Cloak', 'hp', 'common'], ['Mirror Shard Lens', 'amount:spyglass', 'rare']],
    beach:   [['Conch Charm', 'atk:mage', 'common'], ['Driftwood Shield Rim', 'block', 'common'], ['Sea-Glass Sigil', 'range:mage', 'rare']],
    coral:   [['Pink Coral Bead', 'souls', 'common'], ['Reefstone Plate', 'block', 'common'], ['Pearl Diver\'s Satchel', 'supplies', 'rare']],
    cove:    [['Rusted Cutlass Edge', 'atk:swordsman', 'common'], ['Barnacle Hide', 'hp', 'common'], ['Sea Chest Key', 'supplies', 'rare']],
    isles:   [['Mistwalker Charm', 'atk:mage', 'common'], ['Sea-Stack Pebble', 'souls', 'common'], ['Fogbell Prism', 'amount:spyglass', 'rare']],
    dunes:   [['Sand-Etched Dagger', 'atk:swordsman', 'common'], ['Dune Silk Wrap', 'hp', 'common'], ['Caravan Water Flask', 'supplies', 'rare']],
    oasis:   [['Date Palm Charm', 'souls', 'common'], ['Lotus Pool Bead', 'hp', 'common'], ['Reed Sandal Drumskin', 'amount:drummer', 'rare']],
    canyon:  [['Red Rock Spearhead', 'atk:spearman', 'common'], ['Canyon Clay Plate', 'block', 'common'], ['Echo Drumskin', 'amount:drummer', 'rare']],
    temple:  [['Scarab Amulet', 'souls', 'common'], ['Sandstone Tablet Plate', 'block', 'common'], ['Gilded Lotus Lens', 'amount:spyglass', 'rare']],
    snow:    [['Snowshoe Cord', 'hp', 'common'], ['Icicle Arrowhead', 'atk:archer', 'common'], ['Hide-Lined Mantle', 'block', 'rare']],
    frozen:  [['Skate Blade Edge', 'atk:swordsman', 'common'], ['Ice-Fisher\'s Bead', 'souls', 'common'], ['Glass Lake Sigil', 'range:spearman', 'rare']],
    rime:    [['Rime-Pine Charm', 'atk:mage', 'common'], ['Crystal Bough Plate', 'block', 'common'], ['Hoarfrost Pennant', 'amount:banner', 'rare']],
    glacier: [['Frost Throne Splinter', 'atk:swordsman', 'common'], ['Palace Ice Locket', 'hp', 'common'], ['Winter Queen\'s Ration Tin', 'supplies', 'rare']],
    ash:     [['Cinder Brand', 'atk:swordsman', 'common'], ['Ash-Wrapped Talisman', 'souls', 'common'], ['Charred Bone Rim', 'block', 'rare']],
    ridge:   [['Obsidian Flake Arrowhead', 'atk:archer', 'common'], ['Glassforged Plate', 'block', 'common'], ['Volcanic Glass Sigil', 'range:spearman', 'rare']],
    lavafall:[['Ember Spray Charm', 'atk:mage', 'common'], ['Cooled Lava Plate', 'block', 'common'], ['Steamveil Sigil', 'range:swordsman', 'rare']],
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
    const mag = MAG[kind], mr = rarity === 'legendary' ? 'epic' : rarity, amount = mag[mr] !== undefined ? mag[mr] : mag.rare;
    const item = { id, name, rarity, kind, type: type || null, amount, source, slot: slotForKind(kind) };
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


  // ----- Boss signature Legendaries: two per boss, each with one unique rule-changing effect -----
  // `rule` is passed to the engine in the battle state (state.rules); `army` effects are applied in Progress.buildArmy.
  const LEGEND_FX = {
    spill:   { slot: 'weapon', noun: 'Cleaver',      text: 'Overkill also spills into the front-row enemies on either side.', rule: { spill: 1 } },
    opening: { slot: 'weapon', noun: 'Opening Fang', text: 'Opening salvo: the first shot of every battle deals double damage.', rule: { opening: 1 } },
    soften:  { slot: 'armor',  noun: 'Thick Hide',   text: 'Every enemy strike deals 1 less damage (after Shields).', rule: { soften: 1 } },
    stand:   { slot: 'armor',  noun: 'Last Breath',  text: 'Once per battle, a lethal blow leaves you at 1 HP instead.', rule: { stand: 1 } },
    horn:    { slot: 'banner', noun: 'Great Horn',   text: 'Your first War Horn multiplies by ×3 instead of ×2.', rule: { horn: 1 }, army: true },
    blast:   { slot: 'ring',   noun: 'Powder Charm', text: 'Barrels explode for 4 instead of 2.', rule: { blast: 4 } },
    sunder:  { slot: 'ring',   noun: 'Sunder Band',  text: 'Your hits ignore 1 point of enemy armor.', rule: { sunder: 1 } },
    mend:    { slot: 'ring',   noun: 'Lifebloom',    text: 'Heal 1 HP at the end of every turn you survive.', rule: { mend: 1 } },
  };
  const FX_KEYS = Object.keys(LEGEND_FX);
  const LEGENDS_OF = {}; // boss spot id -> [item]
  World.SUBAREAS.forEach((sub, bi) => {
    const node = World.nodes.find((n) => n.sub === sub.id && n.type === 'boss');
    if (!node) return;
    LEGENDS_OF[node.id] = [0, 1].map((j) => {
      const fx = FX_KEYS[(bi + j * 3) % FX_KEYS.length], def = LEGEND_FX[fx], id = 'l:' + node.id + ':' + j, R = World.rng('legend:' + id);
      const effect = def.slot === 'weapon' ? 'atk:' + ATK_TYPES[Math.floor(R() * ATK_TYPES.length)]
        : def.slot === 'armor' ? (R() < 0.5 ? 'block' : 'hp')
        : def.slot === 'banner' ? 'amount:banner'
        : (R() < 0.5 ? 'souls' : 'supplies');
      let name = creatureOf(node) + '\'s ' + def.noun;
      if (USED_NAMES.has(name)) name += ' II';
      const it = make(id, name, 'legendary', effect, { kind: 'legend', spot: node.id, sub: node.sub });
      it.fx = fx; it.slot = def.slot;
      return it;
    });
  });

  // ----- Item instances: level and substats of every owned item live in save.itemData -----
  const SUB_KINDS = [['hp', 3], ['souls', 2], ['block', 2], ['atk', 2], ['amount', 1]];
  const SUB_BASE = { hp: 2, souls: 4, block: 1, atk: 1, amount: 1 };
  function rollSubstats(item, R) {
    const n = item.rarity === 'common' ? 0 : item.rarity === 'rare' ? 1 : 2, subs = [];
    for (let guard = 0; subs.length < n && guard < 30; guard++) {
      const kind = pickWeighted(R, SUB_KINDS);
      const pool = kind === 'atk' ? ATK_TYPES : kind === 'amount' ? AMOUNT_TYPES : null;
      const type = pool ? pool[Math.floor(R() * pool.length)] : null;
      if (kind === item.kind && type === item.type) continue;
      if (subs.some((s) => s.kind === kind && s.type === type)) continue;
      subs.push({ kind, type, amount: SUB_BASE[kind] });
    }
    return subs;
  }
  // Level of an item that was owned before WP8 (migration): the level of the place it drops from.
  function legacyLevel(item) {
    const s = item.source;
    if (s.kind === 'sub') return World.SUB_BY[s.sub].lv[0];
    if (s.kind === 'region') { const subs = World.SUBAREAS.filter((x) => x.region === s.region); return subs[0].lv[1]; }
    const node = World.byId[s.spot]; return node ? node.level : 1;
  }
  function newData(item, lv, seed) {
    return { lv: Math.max(1, lv || 1), subs: rollSubstats(item, World.rng('sub:' + item.id + ':' + (seed || ''))) };
  }
  const dataOf = (save, id) => (save.itemData && save.itemData[id]) || { lv: 1, subs: [] };

  // ----- Save upgrade: old saves have `items` and a flat `equipped` list; fill every WP8 field -----
  function migrate(save) {
    save.itemData = save.itemData || {}; save.luck = save.luck || {}; save.tokens = save.tokens || {};
    save.items = (save.items || []).filter((id, i, a) => BY_ID[id] && a.indexOf(id) === i);
    for (const id of save.items) if (!save.itemData[id]) save.itemData[id] = newData(BY_ID[id], legacyLevel(BY_ID[id]));
    for (const id of Object.keys(save.itemData)) if (!save.items.includes(id)) delete save.itemData[id];
    if (!save.loadout) save.loadout = emptyLoadout();
    if (Array.isArray(save.equipped) && !equippedIds(save).length) for (const id of save.equipped) if (save.items.includes(id)) equip(save, id); // old flat list
    delete save.equipped;
    for (const k of SLOT_KEYS) if (save.loadout[k] !== null && !save.items.includes(save.loadout[k])) save.loadout[k] = null;
    return save;
  }
  const emptyLoadout = () => { const l = {}; for (const k of SLOT_KEYS) l[k] = null; return l; };
  const equippedIds = (save) => SLOT_KEYS.map((k) => save.loadout && save.loadout[k]).filter(Boolean);
  const slotOfItem = (save, id) => SLOT_KEYS.find((k) => save.loadout[k] === id) || null;

  // Which slot an item would take: its own slot, else a free ring, else it replaces the occupant (weakest ring for rings).
  function targetSlot(save, item, allowReplace) {
    const L = save.loadout, free = (k) => !L[k], rings = ['ring1', 'ring2'];
    let t = null;
    if (item.slot !== 'ring' && free(item.slot)) t = item.slot;
    else t = rings.find(free) || null;
    if (!t && allowReplace) {
      if (item.slot !== 'ring') t = item.slot;
      else t = RARITY[BY_ID[L.ring1].rarity].order <= RARITY[BY_ID[L.ring2].rarity].order ? 'ring1' : 'ring2';
    }
    return t;
  }
  // Returns { slot, replaced } or null when there is no free slot (autoOnly) / the item is not owned.
  function equip(save, id, autoOnly) {
    const item = BY_ID[id]; if (!item || !save.items.includes(id) || slotOfItem(save, id)) return null;
    const t = targetSlot(save, item, !autoOnly); if (!t) return null;
    const replaced = save.loadout[t]; save.loadout[t] = id;
    return { slot: t, replaced };
  }
  function unequip(save, id) { const k = slotOfItem(save, id); if (k) save.loadout[k] = null; return !!k; }

  // ----- Numbers of an owned item -----
  const mainAmount = (item, data) => scale(item.amount, data.lv);
  const subAmount = (sub, data) => scale(sub.amount, data.lv);
  const fxOf = (item) => (item.fx ? LEGEND_FX[item.fx] : null);

  function effectText(kind, type, n) {
    switch (kind) {
      case 'atk': return '+' + n + ' ATK to ' + plural(type);
      case 'block': return 'Shields block +' + n;
      case 'hp': return '+' + n + ' max HP';
      case 'souls': return '+' + n + '% Souls';
      case 'amount': return plural(type) + ' give +' + n + ' more';
      case 'supplies': return '+' + n + ' starting Supplies';
      case 'range': return '+' + n + ' range to ' + plural(type);
      default: return '';
    }
  }
  // Main effect text; `lv` (optional) scales it to an item level.
  function describe(item, lv) { return effectText(item.kind, item.type, lv ? scale(item.amount, lv) : item.amount); }
  const substatText = (sub, data) => effectText(sub.kind, sub.type, subAmount(sub, data));
  function icon(item) {
    if (item.type) return Engine.CARD_TYPES[item.type].icon;
    return { block: '🛡️', hp: '❤️', souls: '✦', supplies: '🎒' }[item.kind] || '✨';
  }

  // Sum of the equipped items' effects (main effect + substats, scaled by item level) and the Legendary rules.
  function bonuses(save) {
    const b = { atk: {}, amount: {}, range: {}, block: 0, hp: 0, supplies: 0, souls: 0, rules: {}, horn: false };
    const add = (kind, type, n) => { if (type) b[kind][type] = (b[kind][type] || 0) + n; else b[kind] += n; };
    for (const id of equippedIds(save || {})) {
      const it = BY_ID[id]; if (!it) continue;
      const d = dataOf(save, id);
      add(it.kind, it.type, mainAmount(it, d));
      for (const s of d.subs) add(s.kind, s.type, subAmount(s, d));
      const fx = fxOf(it);
      if (fx) for (const k of Object.keys(fx.rule)) { if (k === 'horn') b.horn = true; else b.rules[k] = k === 'blast' ? Math.max(b.rules[k] || 0, fx.rule[k]) : (b.rules[k] || 0) + fx.rule[k]; }
    }
    for (const st of setStatus(save)) for (const t of st.tiers) {
      if (!t.on) continue;
      if (t.rule) for (const k of Object.keys(t.rule)) b.rules[k] = k === 'blast' ? Math.max(b.rules[k] || 0, t.rule[k]) : (b.rules[k] || 0) + t.rule[k];
      if (t.bonus) for (const k of Object.keys(t.bonus)) { if (typeof t.bonus[k] === 'object') for (const ty of Object.keys(t.bonus[k])) add(k, ty, t.bonus[k][ty]); else add(k, null, t.bonus[k]); }
    }
    return b;
  }
  // The engine rule flags (state.rules) granted by the equipped Legendaries.
  const rules = (save) => Object.assign({}, bonuses(save).rules);

  // ----- Item sets (WP9): every item belongs to the set of its region; 2 / 4 equipped pieces of one set grant bonuses -----
  // `bonus` fields add to the Items.bonuses() totals; `rule` fields become engine rule flags (state.rules).
  const SETS = {
    'Greenvale':   { name: 'Wolfpack',   icon: '🐺', tiers: [
      { n: 2, text: 'Banners also boost the four diagonal tiles.', rule: { diag: 1 } },
      { n: 4, text: 'Every attacker a Banner boosts gets +1 ATK more.', rule: { bannerBite: 1 } } ] },
    'Azure Coast': { name: 'Tidewatch',  icon: '🌊', tiers: [
      { n: 2, text: '+4 max HP.', bonus: { hp: 4 } }, { n: 4, text: '+1 starting Supply.', bonus: { supplies: 1 } } ] },
    'Sunscorch':   { name: 'Dune Nomads', icon: '🏜️', tiers: [
      { n: 2, text: '+10% Souls.', bonus: { souls: 10 } }, { n: 4, text: 'Shields block +1.', bonus: { block: 1 } } ] },
    'Frostveil':   { name: 'Frostguard', icon: '❄️', tiers: [
      { n: 2, text: 'Shields block +1.', bonus: { block: 1 } }, { n: 4, text: '+8 max HP.', bonus: { hp: 8 } } ] },
    'Ember Peaks': { name: 'Cinderforge', icon: '🌋', tiers: [
      { n: 2, text: '+1 ATK to Swordsmen and Spearmen.', bonus: { atk: { swordsman: 1, spearman: 1 } } }, { n: 4, text: 'Barrels explode for 3 instead of 2.', rule: { blast: 3 } } ] },
  };
  const regionOf = (item) => (item.source.region || World.SUB_BY[item.source.sub].region);
  const setOf = (item) => SETS[regionOf(item)] || null;
  // Equipped pieces per set: [{ region, set, count, tiers: [{...tier, on}] }] for sets with at least one piece.
  function setStatus(save) {
    const counts = {};
    for (const id of equippedIds(save || {})) { const it = BY_ID[id]; if (it) { const r = regionOf(it); counts[r] = (counts[r] || 0) + 1; } }
    return Object.keys(counts).map((r) => ({ region: r, set: SETS[r], count: counts[r], tiers: SETS[r].tiers.map((t) => Object.assign({ on: counts[r] >= t.n }, t)) }));
  }

  // ----- Forge (WP9): Dust rerolls a substat or raises the item level -----
  const MAX_ILVL = 20;
  const REROLL_COST = { rare: 6, epic: 10, legendary: 14 };
  const levelCost = (save, id) => { const d = dataOf(save, id); return d.lv >= MAX_ILVL ? null : 4 + Math.floor(d.lv * 1.5) + (BY_ID[id].rarity === 'common' ? 0 : 2); };
  const rerollCost = (save, id) => { const it = BY_ID[id]; return it && REROLL_COST[it.rarity] && dataOf(save, id).subs.length ? REROLL_COST[it.rarity] : null; };
  // Replace substat `idx` with a different one (never the main stat or an existing substat). Returns the new substat or null.
  function reroll(save, id, idx) {
    const item = BY_ID[id], d = save.items.includes(id) && save.itemData[id], cost = rerollCost(save, id);
    if (!d || cost === null || !d.subs[idx] || !root.Progress.spend(save, 'dust', cost)) return null;
    d.rr = (d.rr || 0) + 1;
    const R = World.rng('reroll:' + id + ':' + d.rr + ':' + idx), old = d.subs[idx];
    for (let guard = 0; guard < 60; guard++) {
      const kind = pickWeighted(R, SUB_KINDS), pool = kind === 'atk' ? ATK_TYPES : kind === 'amount' ? AMOUNT_TYPES : null;
      const type = pool ? pool[Math.floor(R() * pool.length)] : null;
      if ((kind === item.kind && type === item.type) || (kind === old.kind && type === old.type) || d.subs.some((x, j) => j !== idx && x.kind === kind && x.type === type)) continue;
      return (d.subs[idx] = { kind, type, amount: SUB_BASE[kind] });
    }
    return old;
  }
  function levelUp(save, id) {
    const cost = save.items.includes(id) ? levelCost(save, id) : null;
    if (cost === null || !root.Progress.spend(save, 'dust', cost)) return null;
    return ++save.itemData[id].lv;
  }

  // ----- Drops -----
  // Drop chances for a win: [unique, shared from sub-area, shared from region].
  const CHANCE = { battle: [0.25, 0.07, 0.04], elite: [0.40, 0.12, 0.07], boss: [0.35, 0.18, 0.10] };

  // Everything a spot can drop, unique item first: [{ id, kind, chance }]. A boss also lists its two Legendaries (kind 'legend').
  function tableFor(node) {
    if (typeof node === 'string') node = World.byId[node];
    if (!node || !UNIQUE_OF[node.id]) return [];
    const c = CHANCE[node.type], h = World.hash(node.id), sp = subPool[node.sub], rp = regionPool[World.SUB_BY[node.sub].region];
    const a = h % sp.length, b = (a + 1) % sp.length;
    const t = [
      { id: UNIQUE_OF[node.id].id, kind: 'unique', chance: c[0] },
      { id: sp[a].id, kind: 'sub', chance: c[1] },
      { id: sp[b].id, kind: 'sub', chance: c[1] },
      { id: rp[h % rp.length].id, kind: 'region', chance: c[2] },
    ];
    for (const it of LEGENDS_OF[node.id] || []) t.push({ id: it.id, kind: 'legend', chance: LEGEND_CHANCE });
    return t;
  }
  // Bad-luck protection: wins at this spot without its unique item / without a boss Legendary.
  const missesOf = (save, key) => (save.luck && save.luck[key]) || 0;
  const uniqueChance = (save, node, base) => Math.min(PITY_CAP, base + UNIQUE_PITY * missesOf(save, node.id));
  const legendChance = (save, node) => Math.min(1, LEGEND_CHANCE + LEGEND_PITY * missesOf(save, 'L:' + node.id));
  // The chance the node sheet shows for a table entry right now (pity included).
  function chanceNow(save, node, e) {
    if (e.kind === 'unique') return node.type === 'boss' && !save.bossesBeaten.includes(node.sub) ? 1 : uniqueChance(save, node, e.chance);
    if (e.kind === 'legend') return legendChance(save, node) / (LEGENDS_OF[node.id] || [1]).length;
    return e.chance;
  }

  // ----- Dust: salvage and duplicates -----
  const SALVAGE = { common: 2, rare: 5, epic: 12, legendary: 30 };
  const salvageValue = (save, id) => SALVAGE[BY_ID[id].rarity] + Math.floor(dataOf(save, id).lv / 3);
  const duplicateValue = (item) => Math.ceil(SALVAGE[item.rarity] / 2);

  // Puts an item into the collection. A duplicate becomes Dust and raises the owned copy's level if it dropped higher.
  // Returns { id, item, isNew, dust, levelUp, lv }.
  function addItem(save, id, lv, seed) {
    const item = BY_ID[id];
    if (!save.items.includes(id)) {
      save.items.push(id); save.itemData[id] = newData(item, lv, seed);
      return { id, item, isNew: true, dust: 0, levelUp: false, lv: save.itemData[id].lv };
    }
    const d = save.itemData[id], dust = duplicateValue(item), levelUp = lv > d.lv;
    if (levelUp) d.lv = lv;
    root.Progress.earn(save, 'dust', dust);
    return { id, item, isNew: false, dust, levelUp, lv: d.lv };
  }
  function salvage(save, id) {
    if (!save.items.includes(id)) return 0;
    const n = salvageValue(save, id);
    unequip(save, id);
    save.items = save.items.filter((x) => x !== id); delete save.itemData[id];
    root.Progress.earn(save, 'dust', n);
    return n;
  }

  // Roll and award the drop for beating `node` (mutates the save). At most one item per battle; the item's level is the
  // node's level. A boss's unique item is guaranteed the first time it falls; an elite always drops something (an unowned item
  // from its table, else Dust). Bad-luck counters and boss tokens advance on the main roll only (opts.bonus = the 3-star extra roll).
  // Returns an addItem() result, { dust, consolation: true }, or null.
  function grantDrop(save, node, seed, opts) {
    opts = opts || {};
    const table = tableFor(node); if (!table.length) return null;
    const R = World.rng(seed + ':drop:' + node.id), owned = new Set(save.items);
    const firstBoss = node.type === 'boss' && !save.bossesBeaten.includes(node.sub);
    const legends = table.filter((e) => e.kind === 'legend');
    let pick = null;
    const rUnique = R(), rLegend = R(), rPick = R(), rest = table.filter((e) => e.kind === 'sub' || e.kind === 'region').map((e) => R());
    if (firstBoss && !opts.bonus) pick = table[0];
    else if (legends.length && rLegend < legendChance(save, node)) {
      const fresh = legends.filter((e) => !owned.has(e.id)), pool = fresh.length ? fresh : legends;
      pick = pool[Math.floor(rPick * pool.length)];
    }
    if (!pick && rUnique < uniqueChance(save, node, table[0].chance)) pick = table[0];
    if (!pick) { const sh = table.filter((e) => e.kind === 'sub' || e.kind === 'region'); sh.forEach((e, i) => { if (!pick && rest[i] < e.chance) pick = e; }); }
    if (!opts.bonus) { // counters
      save.luck[node.id] = pick && pick.kind === 'unique' ? 0 : missesOf(save, node.id) + 1;
      if (legends.length) save.luck['L:' + node.id] = pick && pick.kind === 'legend' ? 0 : missesOf(save, 'L:' + node.id) + 1;
      if (node.type === 'boss') save.tokens[node.id] = (save.tokens[node.id] || 0) + 1;
    }
    if (!pick && node.type === 'elite' && !opts.bonus) {
      pick = table.find((e) => e.kind !== 'legend' && !owned.has(e.id));
      if (!pick) { const dust = 3; root.Progress.earn(save, 'dust', dust); return { dust, consolation: true }; }
    }
    return pick ? addItem(save, pick.id, node.level, seed) : null;
  }
  // A guaranteed drop (first run, section 24.3): the spot's unique item, else a shared one not owned yet.
  function guaranteedDrop(save, node) {
    const owned = new Set(save.items);
    const e = tableFor(node).find((t) => t.kind !== 'legend' && !owned.has(t.id));
    return e ? addItem(save, e.id, node.level) : null;
  }
  // Boss tokens: TOKENS_NEEDED tokens from a boss buy one of its Legendaries outright.
  const tokensOf = (save, bossId) => (save.tokens && save.tokens[bossId]) || 0;
  function redeemToken(save, bossId, itemId) {
    const it = BY_ID[itemId], node = World.byId[bossId];
    if (!it || !node || !(LEGENDS_OF[bossId] || []).includes(it) || save.items.includes(itemId) || tokensOf(save, bossId) < TOKENS_NEEDED) return null;
    save.tokens[bossId] -= TOKENS_NEEDED;
    return addItem(save, itemId, node.level);
  }

  const Items = {
    SLOTS, SLOT_LIST, SLOT_KEYS, SLOT_NAMES, RARITY, ALL, BY_ID, UNIQUE_OF, LEGENDS_OF, LEGEND_FX, CHANCE, TOKENS_NEEDED, subPool, regionPool,
    tableFor, chanceNow, grantDrop, guaranteedDrop, addItem, salvage, salvageValue, duplicateValue, redeemToken, tokensOf,
    describe, substatText, effectText, icon, bonuses, rules, scale, mainAmount, subAmount, dataOf, fxOf, newData, migrate, emptyLoadout,
    SETS, setOf, setStatus, regionOf, MAX_ILVL, levelCost, rerollCost, reroll, levelUp,
    equip, unequip, equippedIds, slotOfItem, targetSlot, creatureOf, missesOf,
  };
  root.Items = Items;
  if (typeof module !== 'undefined' && module.exports) module.exports = Items;
})(typeof window !== 'undefined' ? window : globalThis);
