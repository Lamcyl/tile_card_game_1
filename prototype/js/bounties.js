// Per-run bounties (design 11, 14.3): 1-3 optional goals rolled when a run starts, tracked from a
// per-battle report, paid in Crystals when the run ends. Pure data + functions, no DOM.
(function (root) {
  'use strict';

  // report = { won, stars, node: 'battle'|'elite'|'boss', shields (a Shield card was placed), overkills, bossOverkill,
  //            explosions (barrels blown up), turns }.  `n` = goal of the rolled bounty.
  const KINDS = {
    noshield: { icon: '🛡', goals: [2, 3], pay: [3, 4], text: (n) => 'Win ' + n + ' battles without placing a Shield',
      test: (r) => r.won && !r.shields },
    stars:    { icon: '★', goals: [1, 2], pay: [3, 5], text: (n) => 'Earn ★★★ in ' + n + (n === 1 ? ' battle' : ' battles'),
      test: (r) => r.won && r.stars === 3 },
    overkill: { icon: '↯', goals: [4, 6], pay: [3, 4], text: (n) => 'Carry overkill damage ' + n + ' times',
      count: (r) => r.overkills },
    bossover: { icon: '👑', goals: [1], pay: [5], text: () => 'Kill a boss with an overkill',
      test: (r) => r.won && r.node === 'boss' && r.bossOverkill },
    oneturn:  { icon: '⚡', goals: [2, 3], pay: [3, 4], text: (n) => 'Win ' + n + ' battles in a single turn',
      test: (r) => r.won && r.turns === 1 },
    barrels:  { icon: '🛢', goals: [3, 5], pay: [2, 3], text: (n) => 'Blow up ' + n + ' barrels',
      count: (r) => r.explosions },
    elite:    { icon: '⚔', goals: [1, 2], pay: [3, 5], text: (n) => 'Defeat ' + n + (n === 1 ? ' elite warband' : ' elite warbands'),
      test: (r) => r.won && r.node === 'elite' },
  };
  const IDS = Object.keys(KINDS);

  // Roll 1-3 distinct bounties from a seeded random function R() in [0,1).
  function roll(R) {
    const count = 1 + Math.floor(R() * 3), pool = IDS.slice(), out = [];
    while (out.length < count && pool.length) {
      const id = pool.splice(Math.floor(R() * pool.length), 1)[0], k = KINDS[id];
      const tier = Math.floor(R() * k.goals.length);
      out.push({ id, goal: k.goals[tier], reward: k.pay[tier], progress: 0, done: false, paid: false });
    }
    return out;
  }
  // Update progress after a battle. Returns the bounties that were completed by this battle.
  function track(list, report) {
    const finished = [];
    for (const b of list || []) {
      if (b.done) continue;
      const k = KINDS[b.id]; if (!k) continue;
      b.progress = Math.min(b.goal, b.progress + (k.count ? k.count(report) : (k.test(report) ? 1 : 0)));
      if (b.progress >= b.goal) { b.done = true; finished.push(b); }
    }
    return finished;
  }
  // Crystals still unpaid for completed bounties; marks them paid.
  function collect(list) {
    let sum = 0;
    for (const b of list || []) if (b.done && !b.paid) { b.paid = true; sum += b.reward; }
    return sum;
  }
  const text = (b) => KINDS[b.id].text(b.goal);
  const icon = (b) => KINDS[b.id].icon;

  const Bounties = { KINDS, roll, track, collect, text, icon };
  root.Bounties = Bounties;
  if (typeof module !== 'undefined' && module.exports) module.exports = Bounties;
})(typeof window !== 'undefined' ? window : globalThis);
