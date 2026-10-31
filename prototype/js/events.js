// Events (design 10.6, WP13): short multiple-choice vignettes themed to a region's mythology. Pure data + functions, no DOM.
// An event is { id, region, title, text, choices: [{ label, cost?: { gold }, outs: [{ p, text, fx }] }] }. Each choice has one or more
// outcomes with relative weights `p`; fx keys: hp (+/-, never kills), gold, souls, maxhp, atk (+1 ATK on a random attacker, n times),
// up (a random unit upgrade, n times), relic (a random relic, if there is room). Gold amounts are scaled by region (see goldScale).
(function (root) {
  'use strict';

  const LEAVE = { label: 'Walk on', outs: [{ p: 1, text: 'You nod politely and go your way.', fx: {} }] };
  const LIST = [
    // ---- Greenvale (Korean, Slavic, Japanese) ----
    { id: 'dokkaebi', region: 'Greenvale', title: "The Dokkaebi's Wager", text: 'A club-wielding dokkaebi blocks the path, grinning. "Wrestle me, traveller! Win, and I pay. Lose, and you buy me rice cakes."', choices: [
      { label: 'Wrestle him', outs: [{ p: 6, text: 'You pin him in three heartbeats. He laughs and tosses you a pouch.', fx: { gold: 14 } }, { p: 4, text: 'He flips you over his shoulder. It hurts, but he is a good sport.', fx: { hp: -3, gold: 4 } }] },
      { label: 'Share your rice cakes', cost: { gold: 8 }, outs: [{ p: 1, text: 'He munches happily and taps your gear with his club. It glows.', fx: { up: 1 } }] }, LEAVE] },
    { id: 'kodama', region: 'Greenvale', title: 'Kodama in the Old Oak', text: 'Pale tree spirits rattle their heads in the branches above a little offering stone. A hollow in the trunk drips glowing sap.', choices: [
      { label: 'Leave a coin on the stone', cost: { gold: 6 }, outs: [{ p: 1, text: 'The kodama hum. Warmth flows through the roots into your feet.', fx: { hp: 7 } }] },
      { label: 'Drink the sap', outs: [{ p: 7, text: 'Sweet, strong, and a little dizzy. You feel tougher.', fx: { maxhp: 2 } }, { p: 3, text: 'The spirits scold you with a shower of acorns.', fx: { hp: -3 } }] }, LEAVE] },
    { id: 'leshy', region: 'Greenvale', title: "The Leshy's Crossroads", text: 'A mossy man with a green beard stands where three paths meet. "One of these leads to treasure," he whispers. "I will not say which."', choices: [
      { label: 'Take the left path', outs: [{ p: 5, text: 'A hollow stump hides a forgotten purse.', fx: { gold: 16 } }, { p: 5, text: 'Brambles and giggling. You come out scratched.', fx: { hp: -3 } }] },
      { label: 'Take the right path', outs: [{ p: 3, text: 'An old shrine keeps a charm for the patient. You take it.', fx: { relic: 1 } }, { p: 7, text: 'Just a quiet clearing. You rest a while.', fx: { hp: 3 } }] }, LEAVE] },
    // ---- Azure Coast (Greek, Japanese, Egyptian crocodiles) ----
    { id: 'siren', region: 'Azure Coast', title: 'The Siren Song', text: 'From the rocks a sweet, wordless song drifts over the water. Your soldiers slow, eyes glazed.', choices: [
      { label: 'Stuff your ears with wax', cost: { gold: 8 }, outs: [{ p: 1, text: 'You march past deaf and safe. The singer sulks and flings a pearl at you.', fx: { gold: 14 } }] },
      { label: 'Listen closely', outs: [{ p: 5, text: 'The song teaches you a trick of rhythm. Your drills sharpen.', fx: { up: 1, hp: -2 } }, { p: 5, text: 'You wake on the sand, lighter in the purse.', fx: { hp: -4 } }] }, LEAVE] },
    { id: 'kappa', region: 'Azure Coast', title: "A Kappa's Courtesy", text: 'A kappa sits by the tide pool, its water-bowl brimming. It bows deeply and waits. It is plainly hungry.', choices: [
      { label: 'Bow back', outs: [{ p: 1, text: 'It bows lower and its water spills. As a thanks it presses a shell into your hand.', fx: { gold: 12 } }] },
      { label: 'Offer a cucumber', cost: { gold: 5 }, outs: [{ p: 1, text: 'It crunches blissfully, then heals your scrapes with river salve.', fx: { hp: 8 } }] }, LEAVE] },
    { id: 'wreck', region: 'Azure Coast', title: "Poseidon's Leavings", text: 'A broken galleon rocks in the shallows, her hold half open to the tide. Something glints in the dark.', choices: [
      { label: 'Wade in and salvage', outs: [{ p: 6, text: 'Sea-chests and coins, still dry in the stern.', fx: { gold: 26 } }, { p: 4, text: 'A rotten beam gives way and the tide bites.', fx: { hp: -5 } }] },
      { label: 'Dive for the figurehead', outs: [{ p: 3, text: 'A carved trident-charm lies in the sand. It hums when you grip it.', fx: { relic: 1 } }, { p: 7, text: 'Only weed and crabs. You surface coughing.', fx: { hp: -2 } }] }, LEAVE] },
    // ---- Sunscorch (Egyptian, Maya) ----
    { id: 'maat', region: 'Sunscorch', title: "The Scales of Ma'at", text: 'A stone balance stands half-buried in the sand, one pan holding a white feather. A faded glyph says: weigh your heart.', choices: [
      { label: 'Weigh your heart', outs: [{ p: 5, text: 'The pan stays level. Light-hearted, you are mended.', fx: { hp: 8 } }, { p: 5, text: 'The scale tips. Old regrets weigh on you.', fx: { hp: -4 } }] },
      { label: 'Leave an offering', cost: { gold: 16 }, outs: [{ p: 1, text: 'The feather glows. Your weapons feel truer.', fx: { atk: 1 } }] }, LEAVE] },
    { id: 'sphinx', region: 'Sunscorch', title: "The Sphinx's Riddle", text: '"What walks on four legs at dawn, two at noon, three at dusk?" A weathered sphinx watches you with bored gold eyes.', choices: [
      { label: '"A person."', outs: [{ p: 1, text: 'She yawns. "Everyone knows that one." But she is impressed enough to share a secret of the desert.', fx: { up: 1 } }] },
      { label: '"A camel, after a long week."', outs: [{ p: 4, text: 'She laughs so hard she drops a golden ring.', fx: { gold: 18 } }, { p: 6, text: 'She swats you with a paw the size of a door.', fx: { hp: -4 } }] }, LEAVE] },
    { id: 'chacmool', region: 'Sunscorch', title: 'Chac in the Dry Wash', text: 'A weathered rain-god statue squats in a dry riverbed, its stone bowl cracked and empty. Your canteens are heavy.', choices: [
      { label: 'Pour out water for the god', outs: [{ p: 6, text: 'Clouds gather. A brief, blessed rain washes the road and your wounds.', fx: { hp: 8 } }, { p: 4, text: 'The bowl drinks it and nothing happens. You go thirsty.', fx: { hp: -2 } }] },
      { label: 'Search under the bowl', outs: [{ p: 1, text: 'Previous pilgrims left votive coins beneath it. You are sorry, and a little richer.', fx: { gold: 12, hp: -1 } }] }, LEAVE] },
    // ---- Frostveil (Norse, Slavic, Korean) ----
    { id: 'raven', region: 'Frostveil', title: "Huginn's Offer", text: 'A raven with one bright eye lands on your banner pole. "Thought," it croaks. "I sell thought. Or I trade it for pain."', choices: [
      { label: 'Buy a rune', cost: { gold: 24 }, outs: [{ p: 1, text: 'The raven drops a stone carved with a rule of the world. You pocket it.', fx: { relic: 1 } }] },
      { label: 'Trade a wound for wisdom', outs: [{ p: 1, text: 'It pecks your shoulder and whispers a battle-plan.', fx: { hp: -5, up: 2 } }] }, LEAVE] },
    { id: 'barrow', region: 'Frostveil', title: 'The Draugr Barrow', text: 'A snow-heaped mound, its stone door ajar. Torch-light shows a heap of grave-goods and something that does not move. Yet.', choices: [
      { label: 'Loot the barrow', outs: [{ p: 6, text: 'The dead sleep on. You leave with an armful of old silver.', fx: { gold: 32 } }, { p: 4, text: 'Cold fingers close on your ankle. You kick free, bleeding.', fx: { hp: -6, gold: 10 } }] },
      { label: 'Sing a funeral dirge', outs: [{ p: 1, text: 'The cold loosens. A faint, grateful warmth settles on your squad.', fx: { hp: 5 } }] }, LEAVE] },
    { id: 'morozko', region: 'Frostveil', title: 'Grandfather Morozko', text: 'An old man in a frost-white beard taps his staff and the snow freezes mid-fall. "Are you warm, brave one?"', choices: [
      { label: '"Warm as summer."', outs: [{ p: 5, text: 'He chuckles, delighted, and gifts a fur-lined cloak.', fx: { maxhp: 3 } }, { p: 5, text: 'He chuckles and your teeth begin to chatter.', fx: { hp: -4 } }] },
      { label: '"Cold, honoured grandfather."', outs: [{ p: 1, text: 'He nods, pleased by honesty, and warms your hands with a breath.', fx: { hp: 6 } }] }, LEAVE] },
    // ---- Ember Peaks (Norse, Maya, Korean) ----
    { id: 'forge', region: 'Ember Peaks', title: "Surtr's Dying Forge", text: 'A giant anvil still glows beside a vent of fire. Tongs hang from a hook. A single hammer-blow rings out when you step near.', choices: [
      { label: 'Temper a weapon in the flame', outs: [{ p: 1, text: 'The metal sings and burns your hands. Your blades are sharper for it.', fx: { hp: -5, atk: 1 } }] },
      { label: 'Cool off in the ash-pool', outs: [{ p: 1, text: 'A cool spring hides below the cinders. You are refreshed.', fx: { hp: 5 } }] }, LEAVE] },
    { id: 'ballcourt', region: 'Ember Peaks', title: 'The Ball-Court of Xibalba', text: 'Obsidian stands and a stone hoop. The Lords of Xibalba watch from the shadows. "Play us a game, mortal."', choices: [
      { label: 'Play the game', outs: [{ p: 4, text: 'You win by a hair. They grudgingly pay in kind.', fx: { relic: 1 } }, { p: 6, text: 'The rubber ball is heavy and the lords cheat. You limp away.', fx: { hp: -6 } }] },
      { label: 'Bribe the referee', cost: { gold: 22 }, outs: [{ p: 1, text: 'He rules in your favour. The lords sulk and send a prize.', fx: { up: 2 } }] }, LEAVE] },
    { id: 'gumiho', region: 'Ember Peaks', title: "The Gumiho's Bead", text: 'A beautiful traveller by the lava-vents smiles with too many teeth. "A fox-bead for you, soldier. Take it, take it."', choices: [
      { label: 'Take the bead', outs: [{ p: 5, text: 'It is real. Its warmth fills your chest.', fx: { hp: 9 } }, { p: 5, text: 'She vanishes with a bark of laughter. The bead was a stone.', fx: { hp: -3 } }] },
      { label: 'Bargain for more', outs: [{ p: 4, text: 'She respects a hard bargainer and hands over coin.', fx: { gold: 24 } }, { p: 6, text: 'Her tail flicks. You lose your temper and a few pouches.', fx: { gold: -8 } }] }, LEAVE] },
  ];
  const BY_ID = {}; LIST.forEach((e) => { BY_ID[e.id] = e; });
  const GOLD_SCALE = [1, 1.3, 1.6, 1.9, 2.2]; // per region index, applied to every gold amount of an event

  // The event that lives at a node: stable for a given run seed and node id, spread over the region's events.
  function pick(region, seedNum) {
    const l = LIST.filter((e) => e.region === region);
    return l[seedNum % l.length];
  }
  const scale = (n, regionIndex) => Math.round(n * (GOLD_SCALE[regionIndex] || 1));
  // The choice as shown to the player: gold costs scaled to the region.
  function costOf(choice, regionIndex) { return choice.cost && choice.cost.gold ? scale(choice.cost.gold, regionIndex) : 0; }
  // Rolls an outcome of a choice (rnd returns [0,1)); returns { text, fx } with gold scaled to the region.
  function resolve(choice, regionIndex, rnd) {
    const total = choice.outs.reduce((n, o) => n + o.p, 0); let r = rnd() * total, out = choice.outs[choice.outs.length - 1];
    for (const o of choice.outs) { if (r < o.p) { out = o; break; } r -= o.p; }
    const fx = Object.assign({}, out.fx); if (fx.gold) fx.gold = scale(fx.gold, regionIndex);
    return { text: out.text, fx };
  }
  const fxText = (fx) => [fx.hp ? (fx.hp > 0 ? '+' : '') + fx.hp + ' HP' : '', fx.maxhp ? '+' + fx.maxhp + ' max HP' : '', fx.gold ? (fx.gold > 0 ? '+' : '') + fx.gold + ' gold' : '', fx.souls ? '+' + fx.souls + ' Souls' : '',
    fx.atk ? '+' + fx.atk + ' ATK' : '', fx.up ? fx.up + ' upgrade' + (fx.up > 1 ? 's' : '') : '', fx.relic ? 'a relic' : ''].filter(Boolean).join(' · ');

  const Events = { LIST, BY_ID, LEAVE, GOLD_SCALE, pick, costOf, resolve, fxText };
  root.Events = Events;
  if (typeof module !== 'undefined' && module.exports) module.exports = Events;
})(typeof window !== 'undefined' ? window : globalThis);
