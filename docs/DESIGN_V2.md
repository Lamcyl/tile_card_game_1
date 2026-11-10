# Design V2: Guardian Beasts, Reactions and Hybrid Roles

Status: proposal for vetting. No game code changed. Data lives in `docs/data/*.json` (every entry `"status": "proposed"`, stable `id`). Counts: 89 units, 9 elements, 17 reactions, 9 families, 80 keywords, 59 items (15 current archetypes + 44 new), 49 relics (12 current + 37 new), 12 heroes.

Decided by the user: guardian beasts that evolve from animals; evolution extends, never escalates; roles may mix; elements are game-like with reactions and no strength/weakness wheel.

---

## 1. Unit concept

**Your units are guardian beasts. Your enemies are malevolent monsters. Ambivalent tricksters appear on both sides.**

| | |
|---|---|
| Player units | Benevolent beasts and real animals from `BESTIARY.md` (Benevolent first, some Ambivalent). No deities, no constructs (Komainu, Lamassu, Ushabti are left out because they are statues). |
| Enemies | Malevolent monsters, undead, demons, plus Ambivalent animals gone wrong; each carries a bestiary variant element. |
| Tricksters | Kitsune, Tanuki, Reynard, Raijū, Cat sìth: player units in Packs/Wilds; enemy versions exist as Malevolent twins (Gumiho, Nogitsune). |
| Evolution | Every line starts as a real animal and extends toward its mythic form (carp, koi, dragon). |

### Alternatives (short appendix of the concept choice)

| Concept | Pros | Cons |
|---|---|---|
| **A. Guardian beasts (chosen)** | Living, readable art; evolution fantasy; bestiary already supports it | Fewer "tool" units (spyglass, banner) must be re-skinned as beasts |
| B. Spirit court | Spirits and yokai as units; rich flavour | Blurs player and enemy sides; many spirits are Ambivalent or Malevolent |
| C. Beast-folk tribes | Animal-headed people, factions by culture | Drifts back to soldiers; culture factions clash with families |
| D. Summoned totems | Cards are totems of animals, simple art | Not "living things" any more; weak evolution fantasy |

Recommendation held: A. B/C remain a source of enemy variants, D a source of item art.

---

## 2. Elements (game-like set, reactions instead of a wheel)

Nine elements: **Fire, Water, Frost, Storm, Wind, Wood, Earth, Light, Shadow.** Earth also covers stone, sand, metal and crystal. Shadow is mostly an enemy and trickster element; Storm is the rarest on the player side (4 units in the draft; a gap to fill).

The classic five (wood, fire, earth, metal, water) with a generating and overcoming cycle was considered and dropped: a cycle forces rigid counters and has no home for storm, wind, frost or light.

### How elements work in battle

1. Every unit and every enemy has one element (enemies from their bestiary variant; plain monsters have none).
2. **Reactions** trigger when two elements meet. Two kinds:
   - **Hit reaction:** the attacker's element meets the target's element or status (Burning, Wet, Frozen).
   - **Adjacent reaction:** two allied units with the paired elements stand orthogonally adjacent. Applied once per turn in the Boost phase, shown on the card before Fight.
3. **Resonance** (same element count on the board) gives squad bonuses at 2 and 4 units.
4. No element is simply better. A reaction is a bonus to find, and some pairs are warnings (Smother).

### Reaction table

| Pair | Name | Hit reaction (attacker vs target) | Adjacent reaction (allies) |
|---|---|---|---|
| Fire + Wood | Wildfire | Burn on a Wood or Burning enemy spreads to its neighbours | Wood beside Fire: +1 ATK |
| Water + Storm | Conduct | Storm hit on a Water/Wet enemy chains half damage (min 1) | Storm beside Water: chains to one neighbour |
| Frost + Water | Freeze | Frost hit on a Water/Wet enemy freezes it (skips its strike) | Water beside Frost: also Chills its target |
| Fire + Frost | Steam | Fire hit on a Frost/Frozen enemy: +2, thaws it, neighbours lose 1 ATK | Fire beside Frost: hero +1 block |
| Earth + Storm | Ground | Earth hit on a Storm enemy: +1, cancels its chain or Fury | Earth beside Storm: chain reach +1 |
| Light + Shadow | Purge | Light hit on a Shadow enemy: +2, removes Hide/Veiled/Ghost | – |
| Light + Shadow | Dusk | – | Light beside Shadow: both +1 ATK |
| Wind + Fire | Fan | Wind hit on a Burning enemy doubles the Burn tick | Wind beside Fire: Fire +1 ATK |
| Earth + Fire | Smother | Earth hit on a Fire enemy removes its Fury/Burn, +1 | Earth beside Fire: Scorch smothered (warning pair) |
| Water + Wood | Bloom | – | Water beside Wood: Wood +1 ATK, hero heals 1 per turn |
| Wind + Wood | Pollen | – | Wind beside Wood: its buff or heal reaches one tile further |
| Frost + Wind | Blizzard | Frost hit with a Wind ally beside it: Chill spreads to the target's neighbours | Frost beside Wind: Chill spreads |
| Storm + Wind | Squall | Storm hit with a Wind ally beside: target pushed back a row | Storm beside Wind: chain jumps one tile further |
| Light + Fire | Sunfire | – | Light beside Fire: hits ignore 1 armor |
| Shadow + Water | Mist | – | Shadow beside Water: the column takes 1 less |
| Earth + Wood | Roots | – | Earth beside Wood: Shields in either tile +1 block |
| Earth + Water | Mud | Earth/Water hit on a Wet/Earth enemy: -1 ATK, cannot Stride | – |

Same-element resonance, 2 / 4 units: Fire (+1 ATK turn 1 / Scorch +1 turn), Water (chain +1 / hero heals 1), Frost (Chill hits behind / first striker Frozen), Storm (reach +1 / first hit doubled), Wind (+1 range / push swaps), Wood (Molt cap +1 / Bloom +1), Earth (Shield +1 / ignore 1 armor), Light (Purge reveals / Herald +1), Shadow (Hold hits neighbour / no strike turn 1). Full text in `elements.json`.

### Monster variants carry elements

| Bestiary variant | Element | Bestiary variant | Element |
|---|---|---|---|
| fire, magma | Fire | stone, sand, metal, crystal | Earth |
| water, blood | Water | wood, venom | Wood |
| frost | Frost | light | Light |
| storm | Storm | shadow | Shadow |
| wind | Wind | | |

A "frost skeleton dragon" is a Frost enemy, so Fire hits trigger Steam on it; a "storm kamaitachi" is Storm, so a Water ally invites Conduct. The element is shown as a pip on the enemy card. Players read the target, then place the unit that reacts.

---

## 3. Families (factions)

Each unit belongs to one family (the Kunpeng and the carp line count as Fins early, then change). A family set bonus triggers at 2 and 4 units on the squad.

| Family | Animals | Signature | Set bonus 2 / 4 | Example units |
|---|---|---|---|---|
| **Wings** | birds | Skyfall and Herald | +1 range / first shot ignores Guarded and Hide | Khan Garid, Plume Herald, Phoenix |
| **Hooves** | hooved beasts | Swift and Charge | +1 ATK turn 1 / all Swift | Ceryneian Hind, Indrik, Qilin |
| **Fangs** | lions and cats | **Rend** (the only overkill carriers) | Straight units gain Rend / cap 4, Pounce +1 | Singha, Amur Tiger, Cat Sidhe |
| **Coils** | serpents and dragons | Pierce, Venom | second target +1 / Venom to 4 | Dragon-Gate Carp, Wadjet |
| **Shells** | tortoises, crabs | Carapace, Bastion | Shield +1 / halve first hero strike | Geobuk, Divine Tortoise |
| **Packs** | foxes and hounds | Howl, Attune, Swap | +1 ATK in a row / Mark spreads | Nine-Tail Fox, Cu Sidhe |
| **Fins** | fish, water beasts | Chain, captains | chain +1 / Fins count as Water | Humpback Cantor, Salmon |
| **Chitin** | insects, spiders | Brood, Offering | Drones +1 ATK / cost -1 CP | Scarab Roller, Honeybee Hive |
| **Wilds** | bears, apes, small mammals | Wild Card | one counts as any family / two | Langur Mirror, Ratatoskr |

Note: the bestiary has few insects (Scarab, Khepri, Nazca spider); four Chitin units use plain real animals (honeybee, firefly, mantis) and are flagged `"(real animal)"`. Replaces the old Order/Wild/Arcane/Undead traits. Undead may return as an enemy-only family.

---

## 4. Roles and the power budget

Units may mix roles. Every unit has a **role split** summing to 100: Attack (hits enemies), Buff (boosts others) and Guard (blocks or heals). Shown on the card as a small tri-bar.

### Budget (points a unit's rules may "spend")

| Rarity | Command Cost | Budget | Notes |
|---|---|---|---|
| Common | 1 | 8 | Simple, one rule |
| Rare | 2 | 10 | One extra trick |
| Epic | 3 | 12 | Strong rule or a hybrid |
| Legendary | 4 | 14 | Born at stage 2 (mythic), 2 stages only |

**Hybrid tax:** each role with 25% or more beyond the first costs 1 budget point. A hybrid is therefore weaker than the sum of two pure units, but it saves a tile and a Command Point, which the 15-tile board makes valuable.

| Item | Cost (points) |
|---|---|
| 1 ATK | 3 |
| +1 range | 1 |
| Pattern: Spread or Pierce | 2 |
| Each secondary (Chain, Mark, Venom, Hold, Chill, Scorch) | 2 |
| +1 ATK buff to one tile | 2 (two tiles 4; all 4 sides 6) |
| x2 multiplier (War Horn) | 6 |
| 1 block | 2 |
| Heal hero 1 per turn | 3 |
| Conditional bonus (Pounce, Latecomer, Firstborn) | -1 (cheaper but less reliable) |
| Evolution extension | 1 per stage (see Section 6) |

Worked examples: Amur Tiger (C, 8): ATK 2 (6) + Pounce (0 net) + range 1 (1) = 7-8. Haetae (R, 10, hybrid Guard 60 / Attack 40, tax 1 = 9): Shield 2 (4) + ATK 1 (3) + immunity (2) = 9. Plume Herald (R, 10, Buff 70 / Attack 30, tax 1 = 9): +1 ATK to the 2 or 3 adjacent Wings (4-6) + range-3 attack at ATK 1 (4) = 8-10.

### Role synergies

| Pair | How it plays |
|---|---|
| Attack + Buff | A Herald next to a Pounce or Howl unit; Heralds are also decent attackers |
| Buff + Guard | White Hart: blocks 2 and buffs Hooves; the column becomes a fortress |
| Attack + Guard (Bastion) | Coconut Crab holds the line and still hits; place in the front row |
| Captain + Attack | Column Captain wants a tall column of attackers; Row Captain a wide row |
| Guard + Reaction | Earth beside Wood (Roots) turns Shields into walls |
| Buff reach | Pollen and Spyglass-type Wings extend buffs to the back row |

---

## 5. Unit types and styles

Patterns kept: Straight, Spread, Pierce, Boost, Cross Boost, Multiplier, Spyglass, Shield. New behaviours (one line each; all in `keywords.json`):

| # | Behaviour | Card line | Example |
|---|---|---|---|
| 1 | **Herald** (faction buffer) | Adjacent allies of the family get +1 ATK | Plume Herald |
| 2 | **Element Herald** | Adjacent allies of the element get +1 | Salamander |
| 3 | **Attune** (converter) | The unit above takes this unit's element | Nine-Tail Fox |
| 4 | **Mirror** (copy) | Copies pattern and ATK of the left unit | Langur Mirror |
| 5 | **Column Captain** | Every attacker in its column +1 ATK | Indrik |
| 6 | **Row Captain** | Every attacker in its row +1 ATK | Humpback Cantor |
| 7 | **Molt** (growth) | +1 ATK each turn it survives (max +3) | Yazi, Axolotl |
| 8 | **Offering** (sacrifice) | Consumes an adjacent Common for the battle: +2 ATK | Scarab Roller |
| 9 | **Latecomer** (last placed) | +2 ATK if last card placed this turn | Puma, Fennec |
| 10 | **Firstborn** (first placed) | +2 ATK if first card placed this turn | Salmon, Mantis |
| 11 | **Swap** (position) | After attacking, swaps with an ally | Tulpar, Reynard |
| 12 | **Resonance** (element count) | +1 per other ally of its element (max +3) | Giant Panda |
| 13 | **Herd** (family count) | +1 per other ally of its family (max +2) | Audhumbla |
| 14 | **Howl** (row count) | +1 ATK per other Packs unit in its row | Cu Sidhe |
| 15 | **Decoy** | Takes the first enemy strike in its column | Bi'an, Xolo |
| 16 | **Skyfall** | Straight with unlimited range | Khan Garid, Pegasus |
| 17 | **Chain** | Same damage jumps to the lowest-HP neighbour | Dolphin, Raijū |
| 18 | **Mark** | Target takes +1 from the next hit | Raven Pair, Bai Ze |
| 19 | **Hold** | Hit enemy cannot strike this turn | Cat Sidhe, Nazca Weaver |
| 20 | **Mimic** | Takes the element of the first enemy hit | Tanuki |
| 21 | **Tribute** | +1 Soul per kill | Pixiu, Sarimanok |
| 22 | **Bloom** | Heal hero 1 per turn | Pelican, Honu |
| 23 | **Echo** / **Echo Drum** | Attacks twice (second at half) / buffs the unit above to do so | Sleipnir, Qiuniu |
| 24 | **Brood** | Every 2nd turn spawns a 1-ATK Drone | Honeybee |
| 25 | **Carapace** | Shield grows +1 per unhit turn (max +3) | Geobuk |
| 26 | **Current** | Pushes the hit enemy one column | Cheonma |
| 27 | **Scorch / Chill / Venom** | Burn, ATK -1, or stacking poison | Sun Crow, Reindeer, Wadjet |
| 28 | **Trample** | Also deals 1 to the enemy behind | Rakhsh |
| 29 | **Pounce** | +2 against an enemy at full HP | Tigers, Jaguar |
| 30 | **Swift** | Attacks before the front row | Ceryneian Hind |
| 31 | **Bastion** | Shield and a short attack from one tile | Coconut Crab |
| 32 | **Relay** | Boosts the unit above and the one above that | Ratatoskr |
| 33 | **Rend** | Overkill carries (the only source; see Section 8) | Fangs |
| 34 | **Ward / Rebirth** | Negate the first hero strike / hero rises once | Kōtuku, Phoenix |
| 35 | **Bond** and **Mentor** | Folklore partner both +1 ATK / lower-stage ally counts +1 stage | Sun Crow + Moon Hare |

---

## 6. Evolution: extend, never escalate

**The rule.** An evolved unit is used the same way as its base form. Its fundamental type (Straight stays Straight, Shield stays a Shield, a Herald stays a Herald) and its role split (within 10 points) do not change. Each stage adds **one extension** from this list:

| Extension | Example |
|---|---|
| +1 range | Hind: range 2 to 3 |
| Wider area | A buff reaches diagonals or a column |
| Extra target | Mark spreads to a second column |
| Secondary effect | A Straight attacker also Chills; heals 1 |
| Longer or larger status | Burn 2 to 3 turns, Venom cap 3 to 4 |
| Bigger cap on its scaling | Molt max +3 to +4 |

Raw stats rise at most +1 on one number across the whole line, never at stage 2. Budget grows 1 point per stage (Section 4).

### Worked examples

| Line | Stage 1 | Stage 2 | Stage 3 |
|---|---|---|---|
| **Dragon-Gate Carp** | Carp: Straight R2 ATK 2 | Koi: range 3 | Long: also chips 1 to the enemy behind, Chill on the hit |
| **Nine-Tail Fox** | Fox: Attune the unit above | Kitsune: Attune also the unit below | Jiuweihu: attuned units +1 ATK |
| **Plume Herald** | Ocellated turkey: Herald +1 ATK to adjacent Wings | Quetzal: reaches the diagonals | Quetzal: boosted Wings also +1 range |
| **Thousand-Year Crane** | Crane: +1 range to the unit above | Tsuru: unit beside too | (2 stages) |
| **Geobuk** | Pond turtle: Carapace max +3 | Geobuk: max +4 | (2 stages) |
| **Raven Pair** | Raven: Mark the target | Odin's raven: Mark lasts into next turn | Huginn and Muninn: also marks a second column's front enemy |
| **Scarab Roller** | Beetle: Offering +2 | Khepri: Offering +3 | (2 stages) |
| **Phoenix (Legendary)** | Red kite: Pierce R5, rebirth | Phoenix: range +1, revived hero keeps a Shield | (born mythic, 2 stages) |

Every unit's line in `units.json` lists "what extends" per stage.

### Rarity, level and mastery map

| Stage | Name pattern | Unlock | Command cost effect |
|---|---|---|---|
| 1 | Animal | Owned | Rarity cost (1/2/3/4) |
| 2 | Beast | Mastery Lv3 and 2 stars | Same cost |
| 3 | Mythic | Mastery Lv5 and 4 stars, plus one element Seal | +1 CP from stage 3 only for units whose extension is big (epic hybrids) |

Rarity decides the **ceiling and breadth** (a Common has 2-3 stages and a simple rule; Legendary starts at stage 2 and is a role hub), not raw power. In a run, Evolution Seeds and shrine encounters can evolve one unit for that run only (items/relics in the data).

---

## 7. Synergy systems (where infinite variation comes from)

| System | Idea | Depth | Complexity | Phone readability |
|---|---|---|---|---|
| **1. Element reactions and resonance** | Adjacent allies and attacker-vs-target pairings trigger named reactions; same-element thresholds | High | Medium | Good: a reaction icon on the tile line |
| **2. Family sets** | 2/4 units of one family give a set bonus; heralds reward stacking | Medium | Low | Excellent: a counter in the squad bar |
| **3. Formation shapes** | Column lines (Captains), rows (Howl), cross (Cross Boost), diamond shapes | High | Medium | Fair: needs ghost-lines on the board |
| **4. Evolution branches** | Stage 2 offers two extensions in some lines (e.g. koi: range or Chill) | High | Medium | Good if one choice at a time |
| **5. Bond pairs** | Folklore pairs (Sun Crow + Moon Hare, Tiger + Dragon, Raven + Wolf) give both +1 ATK | Medium | Low | Excellent: a link icon |
| **6. Converters** (Attune, Mimic) | Change elements so reactions can be forced | High | High | Hard: keep to few units |

**Recommended core (fun and phone-readable):** reactions + resonance (1), family sets (2), bond pairs (5) and evolution (4). Formation shapes come naturally from Captains, Howl and Cross Boost without a separate system. Converters stay rare (two units).

Variation estimate: 9 families x 9 elements x 35 behaviours x 3 stages, filtered by 15 tiles and 17 reactions, yields thousands of builds, each readable from a short card line.

Example builds: **Burn garden** (Wood and Fire with Wildfire, Sun Crow, Bulgae, Rain Dragon); **Frozen tide** (Water and Frost with Freeze, Geobuk, Reindeer); **Storm pond** (Water and Storm with Conduct, Raijū, Dolphin); **Pack tactics** (3 Packs in a row with Howl and Mark); **Hive** (Brood and Offering).

---

## 8. Overkill rework

Overkill is too strong as a free default. Today `engine.js` carries leftover damage on every Straight or Spread kill.

| Option | Description | Pros | Cons |
|---|---|---|---|
| **A. Keyword only** | Overkill is the keyword **Rend** on certain units (Fangs) | Clear, readable | Fangs mandatory for the mechanic |
| **B. Relic / Camp upgrade** | Susanoo's Edge and a Camp upgrade "Whetstone" give Rend | Lets any build opt in | Unlocks are indirect |
| **C. Capped carry-over** | Everyone carries, cap 2 | Smallest change | Still always on; no identity |
| **D. Element-specific** | Only Fire/Earth carry (burn through) | Ties to elements | Hard to read |

**Recommendation: A + B.** Default off. **Rend** (cap 3) belongs to **Fangs** (2-Fangs set bonus: Straight attackers gain Rend), plus the **Susanoo's Edge** relic (all Straight attackers gain Rend) and the **Hunter's Moon** relic (Fangs Rend cap 4). Camp upgrade "Whetstone" (+1 cap). **Spill** (Cleaver, Splitting Axe) works on Rend only.

### What else must change

| Where | Change |
|---|---|
| `engine.js` (dealDamage, ~line 275) | Overkill only if `source` has `rend`; side Spill needs `rend` |
| Boss Sansin (`boss-defs.js`: "overkill carries on to Sansin") | Guarded rule: when the tiger guard falls, Sansin loses its ward for the turn; no overkill needed |
| Elite "Bodyguard" and Bulwark/Wall elites (`boss-defs.js` lines ~40, 60, 66-76) | Notes: "Bulwarks stop Rend and Pierce"; Bodyguard teaches Pierce/Fangs |
| Enemy kind Bulwark (`engine.js:46`) | Text becomes "blocks Rend and Pierce from reaching the enemy behind" |
| Knight/Armored text (GAME_DESIGN 7) | "including explosions and Rend" |
| Template `twin-lane` (`gen.js:29`, `teach:'overkill'`) | Retitle to teach Rend/Pierce; the first Fangs unit appears in the first reward |
| ENEMY_REVAMP stages: Piggyback (B5), Blossom Brute (B6), Sansin, Thick Bark, Kappa Pair, Tiered Bank, The Wall, Foggy Pass, Salt Pillars | Re-tag from "overkill" to "Rend" or "Pierce"; check each is still beatable without Fangs |
| Bounties (`bounties.js` overkill, bossover) | Count Rend kills; require a Fangs unit in the squad |
| Relics: `fenrir` (feast), `susanoo` (spill) | Only Rend kills count; `susanoo` grants Rend |
| Item `spill` (Cleaver) | Applies to Rend only |
| GAME_DESIGN 7.1, 3 (core verbs), section 6 starter list | Update docs |

---

## 9. Items, relics, heroes and Camp (summary)

| File | Current | New proposals | Tie-ins |
|---|---|---|---|
| `items.json` | 15 archetypes (`"current": true`) | 44 | element (10), family (9), evolution (4), bond (2), overkill (3), keyword (10) |
| `relics.json` | 12 | 37 | element (10), reaction (3), family (8), evolution (3), bond (4), overkill (3 incl. Hunter's Moon) |
| `heroes.json` | 4 | 8 ideas | Beast-keeper, Shrine Warden, Dragon-Gate Keeper, Fox Priestess, Naturalist, Storm Caller, Lantern Keeper, Menagerist |

Hero fiction: the player is a **Beast-keeper** or **Shrine Warden** protecting a mountain shrine where guardian beasts rest.

Camp: add **Whetstone** (+1 Rend cap), **Nursery** (evolutions unlock one mastery level earlier), **Bestiary Hall** (reveal enemy elements).

---

## 10. Open decisions

1. Confirm the nine elements (or cut Shadow/Wind); Storm needs more player units.
2. Reactions: keep adjacent reactions as automatic, or require the player to tap to activate?
3. Is "Smother" (a negative adjacency) wanted, or only positive reactions?
4. Overkill: confirm A + B (Rend on Fangs, the Susanoo relic and a Camp upgrade); cap 3?
5. Should Fangs be the only family that can Rend, or should one Hooves unit also carry it?
6. Roles: show the tri-bar on cards, or only a text icon?
7. Hybrid tax: 1 point per extra role; is that enough of a discount for the tile saved?
8. Evolution: automatic at mastery thresholds, or a player choice at stage 2 with two branches?
9. Command cost at stage 3: unchanged, or +1 for big hybrid extensions?
10. Legendary units born mythic (2 stages), or all lines with three stages?
11. Allow the Kunpeng and carp lines to change family on evolution (Fins to Coils/Wings)?
12. Chitin: add real insects (bee, firefly, mantis) or leave the family small?
13. Real animals (not in the bestiary) acceptable for filler units?
14. Remove old traits (Order, Wild, Arcane, Undead) in favour of families?
15. Bond pairs: auto-active when both are in the squad or only on the board?
16. Art: Long, Fenghuang, Baihu and Xuanwu art was dropped; use Yong, Rồng or the zodiac Dragon (Chen) for dragon lines?
17. Ambivalent animals (tiger, wolf, bear) on the player side: acceptable as "wild guardians"?
18. Enemy elements: plain monsters elementless, or every enemy has one?
19. Elite and boss resistances to reactions (e.g. a Fire boss immune to Steam)?
20. Hero: one default (Beast-keeper) or choose from the list?
