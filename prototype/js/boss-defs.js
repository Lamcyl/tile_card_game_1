// Handcrafted boss and elite fights (design 8.2). One definition per sub-area boss and per elite (16 live sub-areas plus the retired ones kept as reserve).
// gen.js turns a definition into enemies at the node's level; tools/validate-gen.js checks every one with the solver.
//
// Layout rows are `back` (row 0) and `front` (row 1), one char per column, never mirrored (landmarks are fixed).
//   B  the boss (carries `gimmick` / `gp`, or a `kind`)      . empty
//   b basic  w weak  t tough  h heavy  a armored  x barrel   (as in Gen.TEMPLATES)
//   m Healer  s Splitter  u Summoner  k Bulwark (Engine.ENEMY_KINDS)
//   G tiger-style guard: a tough escort a 'guard' boss hides behind     H head: a tough escort that regrows once
// Fields: adj = [hp, atk] fine tuning of a whole fight on top of the per-band boss levers in gen.js (WP18); hp / atk scale the level's base enemy stats for the escorts; bossHp / bossAtk scale them for the boss;
//   gimmick + gp (parameter; gpHp = share of the boss's HP instead) or kind; intro = the line shown before the fight.
(function (root) {
  'use strict';

  const BOSSES = {
    meadow:  { name: 'Sansin', adj: [0.93, 1],       gimmick: 'guard', back: '..B..', front: 'b.G.b', hp: 0.5, atk: 1, bossHp: 2.9, bossAtk: 1.1,
               intro: 'The mountain god hides behind his tiger. Take the guard down first; overkill carries on to Sansin.' },
    forest:  { name: 'Orochi', adj: [1.1, 1.05],       gimmick: 'regrow', back: 'b...b', front: 'H.B.H', hp: 0.4, atk: 1, bossHp: 1.8, bossAtk: 1.1,
               intro: 'Eight heads: every head you sever grows back once at the end of the turn unless the whole board falls.' },
    bamboo:  { name: 'Qiongqi', adj: [0.82, 1],      gimmick: 'ward', gp: 3, back: 'b...b', front: '.tBt.', hp: 0.4, atk: 1, bossHp: 1.7, bossAtk: 1.1,
               intro: 'Winged hide: hits weaker than 3 damage glance off. Boost an attacker before you fire.' },
    lake:    { name: 'Medusa', adj: [1.05, 1],       gimmick: 'gaze', gp: 1, back: '..b..', front: 'b.B.b', hp: 0.4, atk: 1, bossHp: 1.5, bossAtk: 1.1,
               intro: 'Her gaze saps 1 ATK from every attacker in her column. Fire from the other columns.' },
    beach:   { name: 'Scylla', adj: [0.7, 0.85],       gimmick: 'sweep', back: 'b...b', front: '.tBt.', hp: 0.5, atk: 1, bossHp: 2.1, bossAtk: 1.0,
               intro: 'Six necks lash out: she also strikes both neighbouring columns for half damage.' },
    coral:   { name: 'Poseidon', adj: [1.0, 0.95],     gimmick: 'tide', back: 'b..b.', front: '.B.bt', hp: 0.5, atk: 1, bossHp: 2.6, bossAtk: 1.0,
               intro: 'The tide turns every turn: the back row drifts left, the front row right. Aim for where they will be.' },
    cove:    { name: 'Hydra', adj: [1.4, 1.05],        gimmick: 'regen', gpHp: 0.12, back: 'b...b', front: '.tBt.', hp: 0.35, atk: 1, bossHp: 1.3, bossAtk: 1.0,
               intro: 'Its wounds close: the Hydra heals every turn it survives. Finish it fast.' },
    isles:   { name: 'Typhon', adj: [1.2, 1.05],       gimmick: 'rage', gp: 1, back: '.w.w.', front: 'b.B.b', hp: 0.5, atk: 1, bossHp: 2.0, bossAtk: 0.8,
               intro: 'The storm builds: Typhon gains 1 extra ATK every turn he survives.' },
    dunes:   { name: 'Apep', adj: [1.0, 0.9],         gimmick: 'harden', gp: 2, back: '.....', front: '.bBb.', hp: 0.5, atk: 1, bossHp: 2.6, bossAtk: 1.0,
               intro: 'Its coils harden: Apep gains 1 armor every turn it survives (up to 2).' },
    oasis:   { name: 'Set', adj: [1.2, 1.05],          gimmick: 'stride', back: '...b.', front: 'b.B.b', hp: 0.5, atk: 1, bossHp: 2.6, bossAtk: 1.0,
               intro: 'The storm god never stands still: he sidesteps one column every turn, swapping with whoever is there.' },
    canyon:  { name: 'Ah Puch', adj: [0.95, 1],      kind: 'summoner', back: 'b...b', front: 't.B.t', hp: 0.4, atk: 1, bossHp: 1.8, bossAtk: 1.0,
               intro: 'The lord of the dead calls a new servant every turn he survives.' },
    temple:  { name: 'Ra', adj: [0.95, 1.0],           gimmick: 'veil', gp: 1, back: 'x...x', front: '.bBb.', hp: 0.4, atk: 1, bossHp: 2.0, bossAtk: 1.0,
               intro: 'Ra is veiled in sunlight on turn 1 and cannot be hurt. Clear his escort, then strike on turn 2.' },
    snow:    { name: 'Jangsan-beom', adj: [0.9, 0.9], kind: 'bulwark', back: 'b.b.b', front: 't.B.t', hp: 0.35, atk: 1, bossHp: 1.5, bossAtk: 1.0,
               intro: 'A thick winter pelt: overkill and Pierce never get past the tiger to the tile behind it.' },
    frozen:  { name: 'Nidhogg', adj: [0.9, 1],      gimmick: 'ward', gp: 4, back: '.t.t.', front: 'b.B.b', hp: 0.4, atk: 1, bossHp: 2.2, bossAtk: 1.0,
               intro: 'Iron scales: hits weaker than 4 damage do nothing. Stack boosts.' },
    rime:    { name: 'Hel',          kind: 'healer', adj: [0.88, 1], back: '..b..', front: 't.B.t', hp: 0.5, atk: 1, bossHp: 2.6, bossAtk: 1.0,
               intro: 'The queen of the dead mends every neighbour by 2 each turn. Cut her off from her guard.' },
    glacier: { name: 'Morana', adj: [0.8, 0.8],       gimmick: 'veil', gp: 1, back: 'b.m.b', front: 't.B.t', hp: 0.4, atk: 1, bossHp: 1.8, bossAtk: 1.0,
               intro: 'A blizzard hides Morana on turn 1. Break her healers first, then strike on turn 2.' },
    ash:     { name: 'Surtr', adj: [0.8, 0.75],        gimmick: 'sweep', back: 'x...x', front: 'b.B.b', hp: 0.5, atk: 1, bossHp: 2.2, bossAtk: 1.0,
               intro: 'His flaming sword sweeps wide: Surtr also strikes both neighbouring columns for half damage.' },
    ridge:   { name: 'Vucub-Caquix', adj: [0.9, 1], gimmick: 'stride', back: 'b.b..', front: 'tB..t', hp: 0.4, atk: 1, bossHp: 2.2, bossAtk: 1.0,
               intro: 'The false sun flits about: it sidesteps one column every turn, swapping places with its neighbours.' },
    lavafall:{ name: 'Loki', adj: [0.9, 1],         kind: 'splitter', back: 'b...b', front: 't.B.t', hp: 0.4, atk: 1, bossHp: 2.2, bossAtk: 1.0,
               intro: 'The trickster splits into two 1-HP copies when he is destroyed.' },
    caldera: { name: 'Zmey Gorynych', adj: [0.88, 0.92], gimmick: 'regrow', back: '..H..', front: 'b.B.b', hp: 0.5, atk: 1, bossHp: 2.6, bossAtk: 1.0, heads: 3,
               intro: 'Three heads, and each severed head grows back once at the end of the turn unless the whole board falls.' },
  };

  // Elites: fixed variants, no gimmick of their own (the layout is the lesson). `note` is shown on the sheet / intro.
  const ELITES = {
    meadow:  { name: 'Brute',      back: '.b.b.', front: 'b.h.b', hp: 0.5, atk: 1, note: 'A heavy brute with an escort.' },
    forest:  { name: 'Bodyguard',  back: '..h..', front: '.b.b.', hp: 0.5, atk: 1, note: 'A heavy hides behind two guards: overkill reaches it.' },
    bamboo:  { name: 'Armoured pair', back: '.....', front: 'a.h.a', hp: 0.5, atk: 1, note: 'Armour shrugs off weak hits.' },
    lake:    { name: 'Powder gang', back: '.....', front: 'bxhxb', hp: 0.5, atk: 1, note: 'A heavy between two barrels.' },
    beach:   { name: 'Brute',      back: '.b.b.', front: 'b.h.b', hp: 0.5, atk: 1, note: 'A heavy brute with an escort.' },
    coral:   { name: 'Bodyguard',  back: '..h..', front: '.bab.', hp: 0.5, atk: 1, note: 'A heavy behind an armoured guard.' },
    cove:    { name: 'Powder gang', back: 'b...b', front: 'bxhxb', hp: 0.5, atk: 1, note: 'A heavy between two barrels.' },
    isles:   { name: 'Wall',       back: 'b.b.b', front: 'k.h.k', hp: 0.35, atk: 1, note: 'Bulwarks stop overkill and Pierce.' },
    dunes:   { name: 'Armoured pair', back: '.....', front: 'a.h.a', hp: 0.5, atk: 1, note: 'Armour shrugs off weak hits.' },
    oasis:   { name: 'Brood',      back: '.....', front: 'bsxsb', hp: 0.5, atk: 1, note: 'Splitters multiply when destroyed.' },
    canyon:  { name: 'Powder gang', back: 'b...b', front: 'bxhxb', hp: 0.5, atk: 1, note: 'A heavy between two barrels.' },
    temple:  { name: 'Field hospital', back: 'b.m.b', front: '.tbt.', hp: 0.5, atk: 1, note: 'A healer mends the line.' },
    snow:    { name: 'Wall',       back: 'b.b.b', front: 'k.h.k', hp: 0.4, atk: 1, note: 'Bulwarks stop overkill and Pierce.' },
    frozen:  { name: 'Hive',       back: 'b.u.b', front: 'tb.bt', hp: 0.42, atk: 1, note: 'A summoner keeps the line full.' },
    rime:    { name: 'Field hospital', back: 'b.m.b', front: '.tbt.', hp: 0.5, atk: 1, note: 'A healer mends the line.' },
    glacier: { name: 'Brood',      back: '.....', front: 'bsxsb', hp: 0.5, atk: 1, note: 'Splitters multiply when destroyed.' },
    ash:     { name: 'Powder gang', back: 'b...b', front: 'bxhxb', hp: 0.5, atk: 1, note: 'A heavy between two barrels.' },
    ridge:   { name: 'Wall',       back: 'b.b.b', front: 'k.h.k', hp: 0.3, atk: 1, note: 'Bulwarks stop overkill and Pierce.' },
    lavafall:{ name: 'Hive',       back: 'b.u.b', front: 'tb.bt', hp: 0.35, atk: 1, note: 'A summoner keeps the line full.' },
    caldera: { name: 'Field hospital', back: 'b.m.b', front: '.tbt.', hp: 0.5, atk: 1, note: 'A healer mends the line.' },
  };

  // WP20: 16 sub-areas (data/regions/*.json, `bossDef`). The new sub-areas reuse the fights of the retired ones (their gimmicks and layouts are
  // validated); the retired ids stay here as ready content for future regions (data/regions-reserve/).
  const REUSE = { rice: 'beach', ruins: 'cove', marsh: 'coral', highlands: 'isles', dshallows: 'dunes', palms: 'oasis', erg: 'ash', saltmirror: 'ridge', wadi: 'canyon', bazaar: 'lavafall', tomb: 'temple', citadel: 'caldera' };
  for (const id of Object.keys(REUSE)) { BOSSES[id] = BOSSES[REUSE[id]]; ELITES[id] = ELITES[REUSE[id]]; }

  const BossDefs = { BOSSES, ELITES };
  root.BossDefs = BossDefs;
  if (typeof module !== 'undefined' && module.exports) module.exports = BossDefs;
})(typeof window !== 'undefined' ? window : globalThis);
