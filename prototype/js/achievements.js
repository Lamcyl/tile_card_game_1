// WP17: the Journal. Bestiary counters (encounters and kills per creature), a codex of bosses, rules and relics, and achievements
// with small Crystal / Dust rewards. Pure data + functions on the save (save.journal), no DOM and no game rules: nothing here changes a battle.
(function (root) {
  'use strict';

  // One short line of lore per creature, keyed by the THEMES drawing id (world-data.js).
  const LORE = {
    alux: 'Mischievous Mayan field sprite; farmers leave it offerings.', tanuki: 'Shape-shifting raccoon dog, fond of sake and tricks.', jangseung: 'Carved village guardian post that watches the road.', 'chochin-obake': 'A paper lantern that woke up with a grin and a bad temper.', sansin: 'Korean mountain god, rides a tiger and guards the peaks.',
    kodama: 'Tree spirit; a rattle in the leaves means one is near.', leshy: 'Slavic forest lord who leads travellers in circles.', bulgasari: 'Iron-eating beast of Korean legend, hide like a cauldron.', 'kasa-obake': 'One-eyed umbrella that hops on a single leg.', orochi: 'Eight-headed, eight-tailed serpent of old Izumo.',
    shanxiao: 'One-legged mountain demon of Chinese lore.', baihu: 'White Tiger of the West, guardian of autumn.', baize: 'Wise beast that knows every monster by name.', nian: 'Beast that fears red paper and loud firecrackers.', qiongqi: 'Winged tiger that devours the honest.',
    bannik: 'Bathhouse spirit; do not bathe late at night.', jorogumo: 'Spider woman who weaves a pretty lie.', baku: 'Dream-eater with an elephant trunk and a tiger paw.', 'hitotsume-kozo': 'One-eyed boy who startles more than he harms.', medusa: 'Gorgon whose gaze turns brave heroes to stone.',
    kappa: 'River imp with a water dish on his head; bows back if you bow.', sobek: 'Crocodile god of the Nile, strong jaws, stronger temper.', xuanwu: 'Black Tortoise of the North, coiled with a snake.', jingwei: 'Bird that carries pebbles to fill the sea.', scylla: 'Sea monster with six necks, lurking in a narrow strait.',
    'mul-gwisin': 'Water ghost that drags the careless under.', jormungandr: 'World serpent, coiled round the ocean and its own tail.', imugi: 'A lesser dragon, a thousand years short of ascending.', rusalka: 'Drowned maiden singing from the reeds.', poseidon: 'Earth-shaker of the Greek sea, trident in hand.',
    harpy: 'Winged scavenger that snatches what it can carry.', gashadokuro: 'Giant skeleton assembled from the unburied dead.', 'nemean-lion': 'Golden-pelted lion no blade could pierce.', 'cheonyeo-gwisin': 'Ghost of a maiden who died unmarried.', hydra: 'Many-headed serpent: cut one, two more grow.',
    ungnyeo: 'The bear-woman who became the mother of Korea.', griffin: 'Eagle and lion in one; guards hoards of gold.', chimera: 'Lion, goat and serpent breathing fire.', inmyeonjo: 'Human-faced bird whose song is oddly sweet.', typhon: 'Father of monsters, a storm with a hundred heads.',
    serket: 'Scorpion goddess who heals venom she rules.', sekhmet: 'Lioness of war and plague, Ra\'s fierce eye.', khepri: 'Scarab god who rolls the sun across the sky.', ushabti: 'Funerary figurine sworn to work in the afterlife.', apep: 'Chaos serpent that tries to swallow the sun each night.',
    bes: 'Squat, grinning guardian of homes and newborns.', anubis: 'Jackal god who weighs hearts against a feather.', ammit: 'Devourer of the dead: lion, hippo and crocodile.', wadjet: 'Cobra goddess whose gaze burns foes.', set: 'Red lord of storms and deserts, murderer of Osiris.',
    cadejo: 'Spectral dog that follows late-night travellers.', balam: 'Jaguar guardian of Mayan villages.', 'buluc-chabtan': 'Mayan god of war and sacrifice.', bennu: 'Heron of fire, ancestor of the phoenix.', 'ah-puch': 'Skeletal lord of Xibalba, the Mayan underworld.',
    mummy: 'Wrapped in linen; resin and old curses keep it moving.', camazotz: 'Bat-god of the Maya, a killer of the dusk.', sphinx: 'Riddling guardian: answer wrong and be devoured.', taweret: 'Hippo goddess who protects mothers.', ra: 'Falcon-headed sun god sailing the heavens.',
    'yuki-onna': 'Snow woman who walks the blizzard without leaving prints.', troll: 'Mountain brute that turns to stone in daylight.', haetae: 'Armoured lion-like judge who guards against fire.', yutu: 'Moon rabbit pounding the elixir of life.', 'jangsan-beom': 'The tiger of Mount Jangsan, wrapped in winter fur.',
    nisse: 'Farmstead goblin; slight him and the barn burns.', lindworm: 'Wingless serpent with a dragon\'s temper.', dvergr: 'Dwarven smith under the mountain; makes gods\' treasures.', ratatoskr: 'Squirrel who carries insults up and down the world tree.', nidhogg: 'Dragon that gnaws the root of the world tree.',
    draugr: 'Restless dead guarding a barrow-hoard.', valkyrie: 'Chooser of the slain, riding over the battlefield.', cyclops: 'One-eyed giant, smith of storms.', 'dalgyal-gwisin': 'Faceless egg-ghost of Korean tales.', hel: 'Half-living, half-dead queen of the Norse underworld.',
    jotunn: 'Frost giant of Jotunheim, older than the gods.', sleipnir: 'Eight-legged steed of Odin.', koschei: 'Deathless bony sorcerer whose life is hidden in a needle.', domovoi: 'House spirit that rattles pots when displeased.', morana: 'Slavic goddess of winter and death.',
    dokkaebi: 'Korean goblin with a magic club and a love of wrestling.', oni: 'Horned ogre carrying an iron club.', cabrakan: 'Mayan earthquake giant who moves mountains.', bulgae: 'Fire dog that chases the sun and the moon.', surtr: 'Fire giant who will set the world ablaze at Ragnarok.',
    kui: 'One-legged dragon-beast of the Chinese hills.', zipacna: 'Mayan crocodile giant, builder of mountains.', hundun: 'Faceless chaos, shapeless as a sack.', pixiu: 'Winged lion that eats gold and silver.', 'vucub-caquix': 'Arrogant bird who called himself the sun.',
    gumiho: 'Nine-tailed fox seeking human trust.', cerberus: 'Three-headed hound at the gate of the dead.', jowangshin: 'Kitchen hearth god who reports on the household.', fenghuang: 'Chinese phoenix, rare and auspicious.', loki: 'Trickster who changes shape and sides.',
    'huay-chivo': 'Mayan sorcerer-goat that roams at night.', minotaur: 'Bull-headed monster in a labyrinth.', taotie: 'Gluttonous bronze-mask beast of Chinese ritual vessels.', firebird: 'Slavic bird whose feather lights the night.', zmey: 'Three-headed Slavic dragon of the flaming breath.',
  };
  // Rule text per creature role (the boss line comes from its handcrafted gimmick instead).
  const ROLE = {
    basic:   { name: 'Foot soldier', text: 'An ordinary enemy: strikes the tile in front of it each turn.' },
    tough:   { name: 'Tough',        text: 'Carries more HP than the rank and file.' },
    armored: { name: 'Armored',      text: 'Armor shrugs off every hit by that much; stack boosts.' },
    barrel:  { name: 'Powder keg',   text: 'Never attacks. Destroyed, it explodes for 2 on every neighbour; chain them.' },
    boss:    { name: 'Boss',         text: '' },
  };
  const ROLES = ['basic', 'tough', 'armored', 'barrel', 'boss'];

  // ---------- Journal data on the save ----------
  const freshJournal = () => ({ kills: {}, seen: {}, bosses: {}, rules: {}, relics: {}, stats: { wins: 0, kills: 0, flawless: 0, elites: 0, soloWins: 0, chains: 0, bestChain: 0, deaths: 0 }, ach: {} });
  // Fill in anything missing (old saves have no journal) and drop junk. Called by Progress.load via root.Journal.
  function normalize(s) {
    const d = freshJournal(), j = (s.journal && typeof s.journal === 'object') ? s.journal : {};
    for (const k of Object.keys(d)) if (!j[k] || typeof j[k] !== 'object') j[k] = d[k];
    j.stats = Object.assign(d.stats, j.stats);
    s.journal = j; return j;
  }
  const J = (s) => s.journal || normalize(s);
  const keyOf = (sub, role) => sub + '_' + role;
  const ALL_KEYS = []; // every creature: { key, sub, role, name, art, lore }
  function build() {
    const W = root.World; if (!W || ALL_KEYS.length) return;
    for (const sub of W.SUBAREAS) for (const role of ROLES) {
      const [name, icon, art] = W.THEMES[sub.id][role];
      ALL_KEYS.push({ key: keyOf(sub.id, role), sub: sub.id, role, name, icon, art, lore: LORE[art] || '' });
    }
  }
  const creatures = () => { build(); return ALL_KEYS; };
  const seenCount = (s) => Object.keys(J(s).seen).filter((k) => J(s).seen[k] > 0).length;

  // Record a finished battle. `state` = engine state (enemies with type/alive/kind/gimmick), `won`, `report` = battle report,
  // `node` = world node, `placedAttackers` = number of attacker cards placed on the board. Returns nothing; call Achievements.check next.
  function record(s, state, won, node, report, placedAttackers) {
    const j = J(s), st = j.stats, types = new Set();
    let kills = 0;
    for (const e of state.enemies || []) {
      types.add(e.type);
      if (!e.alive) { j.kills[e.type] = (j.kills[e.type] || 0) + 1; kills++; }
      if (e.kind) j.rules[e.kind] = 1;
      if (e.gimmick) j.rules[e.gimmick] = 1;
    }
    for (const t of types) j.seen[t] = (j.seen[t] || 0) + 1;
    st.kills += kills;
    if (!won) { st.deaths += 1; return; }
    st.wins += 1;
    if (state.damageTaken === 0) st.flawless += 1;
    if (node && node.type === 'elite') st.elites += 1;
    if (placedAttackers === 1) st.soloWins += 1;
    const ex = report ? report.explosions : 0;
    st.bestChain = Math.max(st.bestChain, ex);
    if (ex >= 4) st.chains += 1;
    if (node && node.type === 'boss') j.bosses[node.sub] = (j.bosses[node.sub] || 0) + 1;
  }
  const noteRelic = (s, id) => { J(s).relics[id] = 1; };

  // ---------- Achievements ----------
  // reward: { crystals, dust }. `v(s)` = current progress value, `goal` = target. Rewards are small by design (design 17/14.3).
  const A = (id, group, name, desc, goal, v, reward) => ({ id, group, name, desc, goal, v, reward });
  const st = (k) => (s) => J(s).stats[k];
  const LIST = [
    A('first-blood', 'Milestones', 'First Blood', 'Win a battle.', 1, st('wins'), { dust: 5 }),
    A('veteran', 'Milestones', 'Veteran', 'Win 25 battles.', 25, st('wins'), { dust: 10 }),
    A('warlord', 'Milestones', 'Warlord', 'Win 100 battles.', 100, st('wins'), { crystals: 2, dust: 15 }),
    A('slayer', 'Milestones', 'Slayer', 'Defeat 250 enemies.', 250, st('kills'), { crystals: 1, dust: 10 }),
    A('wanderer', 'Milestones', 'Wanderer', 'Finish 5 expeditions.', 5, (s) => s.runs, { dust: 10 }),
    A('road-worn', 'Milestones', 'Road-worn', 'Finish 25 expeditions.', 25, (s) => s.runs, { crystals: 2, dust: 10 }),
    A('first-boss', 'Milestones', 'Giant Killer', 'Defeat your first boss.', 1, (s) => s.bossesBeaten.length, { dust: 8 }),
    A('five-bosses', 'Milestones', 'Realm Breaker', 'Defeat the boss of 5 different areas.', 5, (s) => s.bossesBeaten.length, { crystals: 2 }),
    A('ten-bosses', 'Milestones', 'Pantheon Hunter', 'Defeat the boss of 10 different areas.', 10, (s) => s.bossesBeaten.length, { crystals: 3, dust: 10 }),
    A('all-bosses', 'Milestones', 'World Walker', 'Defeat the boss of all 20 areas.', 20, (s) => s.bossesBeaten.length, { crystals: 5, dust: 25 }),
    A('flawless', 'Feats', 'Untouched', 'Win a battle without taking damage.', 1, st('flawless'), { dust: 5 }),
    A('flawless-10', 'Feats', 'Ghost Blade', 'Win 10 battles without taking damage.', 10, st('flawless'), { crystals: 1, dust: 10 }),
    A('solo', 'Feats', 'One Blade', 'Win a battle with only one attacker on the board.', 1, st('soloWins'), { crystals: 1, dust: 5 }),
    A('chain', 'Feats', 'Chain Reaction', 'Blow up 4 or more barrels in a single battle.', 1, st('chains'), { crystals: 1, dust: 5 }),
    A('elites', 'Feats', 'Warband Breaker', 'Defeat 10 elite warbands.', 10, st('elites'), { crystals: 1, dust: 10 }),
    A('deep', 'Feats', 'Deep Delver', 'Reach a Lv10 fight.', 10, (s) => s.bestLevel, { crystals: 2, dust: 10 }),
    A('summoner', 'Collection', 'Summoner', 'Own 12 units.', 12, (s) => s.owned.length, { crystals: 1, dust: 10 }),
    A('gearhead', 'Collection', 'Armoury', 'Own 10 pieces of gear.', 10, (s) => s.items.length, { dust: 10 }),
    A('bounty', 'Collection', 'Bounty Hunter', 'Complete 10 bounties.', 10, (s) => s.bountiesDone || 0, { crystals: 2 }),
    A('bestiary-10', 'Collection', 'Curious', 'Meet 10 different creatures.', 10, seenCount, { dust: 5 }),
    A('bestiary-50', 'Collection', 'Naturalist', 'Meet 50 different creatures.', 50, seenCount, { crystals: 2, dust: 10 }),
    A('bestiary-all', 'Collection', 'Bestiary Complete', 'Meet all 100 creatures.', 100, seenCount, { crystals: 5, dust: 25 }),
    A('relics-6', 'Collection', 'Relic Seeker', 'Discover 6 relics.', 6, (s) => Object.keys(J(s).relics).length, { crystals: 1, dust: 10 }),
  ];
  const BY_ID = Object.fromEntries(LIST.map((a) => [a.id, a]));
  const progress = (s, a) => Math.min(a.goal, Math.max(0, Math.floor(a.v(s) || 0)));
  const done = (s, id) => !!J(s).ach[id];
  // Award every achievement whose goal is reached and not yet paid. Returns the newly earned list [{ a, crystals, dust }].
  function check(s) {
    const P = root.Progress, out = [];
    for (const a of LIST) {
      if (done(s, a.id) || progress(s, a) < a.goal) continue;
      J(s).ach[a.id] = 1;
      const r = a.reward, c = r.crystals ? P.earn(s, 'crystals', r.crystals) : 0, d = r.dust ? P.earn(s, 'dust', r.dust) : 0;
      out.push({ a, crystals: c, dust: d });
    }
    return out;
  }
  const rewardText = (r) => [r.crystals ? '💎 ' + r.crystals : '', r.dust ? '⚒ ' + r.dust : ''].filter(Boolean).join(' ');
  const doneCount = (s) => LIST.filter((a) => done(s, a.id)).length;

  const Journal = { LORE, ROLE, ROLES, LIST, BY_ID, freshJournal, normalize, J, creatures, seenCount, record, noteRelic, progress, done, check, rewardText, doneCount, keyOf };
  root.Journal = Journal;
  if (typeof module !== 'undefined' && module.exports) module.exports = Journal;
})(typeof window !== 'undefined' ? window : globalThis);
