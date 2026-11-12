# Design V2.2: Guardian Beasts, Affinities, Merges and Big Enemies

Version: **V2.2** (revises V2.1: elements, strengths and weaknesses, column merges). Status: proposal for vetting. No game code changed. Data lives in `docs/data/*.json` (every entry `"status": "proposed"`, stable `id`). Counts: 89 units, **8 elements, a nature-based weakness chart, 12 named weakness hits, 36 column merges, 5 families**, 92 keywords, 59 items (38 normal, 12 elite, 5 boss, 4 secret-boss sources), 49 relics, 12 heroes; 100 sub-areas each with an elite and a boss (30 big elites, 56 big bosses).

Decided by the user: guardian beasts that evolve from animals; evolution extends, never escalates; roles may mix; **V2.2: 8 elements (Wind and Lightning separate, Ice stays a Water flavour); enemies have strengths and weaknesses from nature, not a wheel; reactions are replaced by named weakness hits and by merges between your own attackers in one column;** at most 5 families; buffers buff everyone with a Kin bonus; items have no base rarity; big elites and bosses.

## 0. Design pillars (V2.2)

Simple to read, deep when combined, not restricting. Three systems carry the game; everything else is a keyword on a card.

| Pillar | System | Why it combines |
|---|---|---|
| 1 | **Elements** (8): the right element hits an enemy's weakness; different elements in one column merge | Any element is playable alone; merges and weaknesses are bonuses, not requirements |
| 2 | **Families** (5): set bonuses at 2 and 4; buffers help everyone and help kin more | A mixed squad still gets buffed; a themed squad gets more |
| 3 | **Placement**: patterns, Captains, columns; big enemies change what a column means | One board, three rows of enemies, simple geometry |

Cut to keep team building free: the hybrid tax; "Fangs are the only Rend family" (any unit can gain Rend); family changes on evolution; the Command Point surcharge at stage 3; Bond needing both partners on the board; family-only buffers (now Kin bonus); Frost as a separate element (Storm is now the Lightning element); the V2.1 attacker-versus-target and adjacent-ally reactions; separate Coils, Fins, Shells, Packs and Chitin families. Rarer layers (Evolution, Bond, Converters) stay optional.

---

## 1. Unit concept

**Your units are guardian beasts. Your enemies are malevolent monsters. Ambivalent tricksters appear on both sides.**

| | |
|---|---|
| Player units | Benevolent beasts and real animals from `BESTIARY.md` (Benevolent first, some Ambivalent). No deities, no constructs. |
| Enemies | Malevolent monsters, undead, demons, plus Ambivalent animals gone wrong; each carries a bestiary variant element. |
| Tricksters | Kitsune, Tanuki, Reynard, Raijū, Cat sìth: player units in Fangs (packs) and Wilds; enemy versions exist as Malevolent twins (Gumiho, Nogitsune). |
| Evolution | Every line starts as a real animal and extends toward its mythic form (carp, koi, dragon). |

Concept alternatives (spirit court, beast-folk tribes, summoned totems) stay as sources of enemy variants and item art. Chosen: **A, guardian beasts**.

---

## 2. Elements (8), affinities and merges (V2.2)

**Fire, Water, Wood, Earth, Wind, Lightning, Light, Shadow.** Earth also covers stone, sand, metal and crystal. Shadow is mostly an enemy and trickster element. **Ice is a flavour of Water** (Chill; a second Ice hit on a Chilled enemy Freezes it) and follows the Water chart. Wind (push, reach) and Lightning (chain, burst) are separate elements since V2.2. Units and enemies keep a `flavour` tag (`ice`) in the data; bestiary variant "frost" is Water/Ice, "storm" is **Lightning**.

Unit split (92): Earth 17, Fire 15, Water 18 (13 plus 5 Ice), Wood 13, Wind 9, Light 7, Shadow 6, **Lightning 7** (Kunpeng, Pegasus, Thor's Goats, Raiju, plus Kui, Electric Eel and Storm Petrel added in the step 3 unit pass; open decision 4d closed).

### How elements work in battle

1. Every unit and every enemy has one element (enemies from their bestiary variant; plain monsters have none and take x1).
2. **Affinity:** each hit is multiplied by the attacker's element against the enemy's element (x1.5 weak, x0.5 resists, x1 otherwise).
3. **Weakness hit:** a weak hit also triggers a named effect (one small extra, once per hit).
4. **Column merge:** attackers of different elements in the same column (not necessarily adjacent) fire named merges.
5. **Element sets** (2 and 4 units of an element on the squad, formerly "resonance") are unchanged and still in `elements.json` (`resonance` key). Not to be confused with the **Resonance merge**.
6. No element is simply better; the V2.1 attacker-versus-target and adjacent-ally reactions are removed.

### Affinity chart (enemy element: weak to / resists)

| Enemy | Weak to (x1.5) | Resists (x0.5) |
|---|---|---|
| Fire | Water, Earth | Fire, Wood |
| Water (and Ice) | Lightning, Wood | Fire, Water |
| Wood | Fire, Wind | Water, Earth |
| Earth | Water, Wood | Lightning, Fire |
| Wind | Lightning | Earth |
| Lightning | Earth | Wind, Lightning |
| Light | Shadow | Light |
| Shadow | Light | Shadow |

Stored as an 8x8 matrix `affinity[attacker][defender]` in `elements.json` (editable on the dev page). **Rounding:** weak = `ceil(dmg x 1.5)` (1 to 2, 2 to 3, 3 to 5, 4 to 6); resist = `max(1, ceil(dmg x 0.5))` (1 stays 1, 2 to 1, 3 to 2, 5 to 3), so a resisted hit never reaches 0 by itself. The multiplier applies once per hit, after buffs, marks and merge bonus damage and before armour; Spread, Pierce, Chain, Echo and Rend hits are each judged by their own element. **Elites and bosses use the same chart** (no altered affinities in V2.2); an optional data field `affinityOverride` may later remove one weakness on region 10 bosses, never an immunity.

### Named weakness hits (12)

| Attacker on enemy | Name | Extra effect (on top of x1.5) |
|---|---|---|
| Water on Fire | **Steam** | Target loses 1 ATK this turn |
| Earth on Fire | **Smother** | Removes Fury or Enrage stacks, stops Regrow this turn |
| Lightning on Water | **Conduct** | Jumps to the lowest-HP neighbour for half damage |
| Wood on Water | **Sap** | The hero heals 1 (once per turn) |
| Fire on Wood | **Wildfire** | Burn 1 (2 turns); Burn spreads to neighbouring Wood enemies |
| Wind on Wood | **Uproot** | Pushes the target one column |
| Water on Earth | **Erode** | Armour -1 for the battle |
| Wood on Earth | **Roots** | Held: skips its next strike (not again for 1 turn) |
| Lightning on Wind | **Static** | Marked: the next hit on it deals +1 |
| Earth on Lightning | **Ground** | Its Chain and Fury are cancelled for the battle |
| Light on Shadow | **Dawn** | Removes Hide, Veiled and Ghost |
| Shadow on Light | **Gloom** | Target loses 1 ATK for the battle (cap -2) |

### Column merges

**Rule.** A merge needs two attackers in the **same column**; rows and adjacency do not matter, so a column of three can hold three elements. An **attacker** is a placed card that fires this turn (an attack behaviour and ATK 1 or more after boosts); supports, Shields and 0-ATK cards never count; a hybrid (Bastion) counts once with its one element; Attune and Mimic change the element before merges are read; elementless classic cards never merge. Each **distinct pair** of elements in the column fires once; an element present twice or more adds one **Resonance** for it. Three attackers of three elements give 3 merges; A, A, B give Resonance(A) and A+B; A, A, A give one Resonance. **Cap: 3 merges per column per turn** (also the natural maximum). The **carrier** is the front-most attacker of the pair (Resonance: the front-most of that element); the effect rides on its primary hit, or on the next attacker of the pair if the carrier cannot strike. **Overlap:** the same effect from two merges on one hit does not stack (strongest wins); flat bonus damage from merges on one hit is capped at +2; area parts apply once per attack action. Merges are computed in the Boost phase (shown in the preview) and resolve in the Fire phase.

**Natural pairs (15)**

| Pair | Name | One line |
|---|---|---|
| Fire + Water | **Scald** | Carrier hit +1 and the target loses 1 ATK this turn |
| Fire + Wood | **Kindle** | Burn ticks 2 instead of 1 |
| Fire + Earth | **Magma** | Burn ticks twice per turn; the hit ignores 1 armour |
| Fire + Wind | **Blaze** | Burn is also applied to every neighbour of the target |
| Fire + Lightning | **Plasma** | +2 damage on the carrier hit |
| Water + Wood | **Bloom** | Hero heals 2; the column's attackers get +1 ATK next turn |
| Water + Earth | **Mire** | Target loses 1 ATK for the battle (cap -2) |
| Water + Wind | **Mist** | The enemy strike on this column deals 1 less this turn |
| Water + Lightning | **Surge** | The Lightning jump deals full damage instead of half |
| Wood + Earth | **Grove** | This column blocks 1 more enemy damage this turn |
| Wood + Wind | **Spores** | Poison is also applied to the target's neighbours |
| Wood + Lightning | **Charge** | Column attackers get +1 ATK next turn (cap +2) |
| Earth + Wind | **Sandstorm** | The target is Marked (next hit +1) |
| Earth + Lightning | **Quake** | The enemy behind the target takes half damage |
| Wind + Lightning | **Tempest** | The hit lands again on the same target for half damage |

**Light, Shadow and same-element pairs**

| Pair | Name | Effect |
|---|---|---|
| Light + X (6) | **Radiance** | Strengthens X's own effect: Fire Burn lasts 3 turns, Water heal 2, Wood Poison 2, Earth armour -2, Wind push 2 columns, Lightning jump at full damage |
| Shadow + X (6) | **Eclipse** | The carrier hit ignores up to 2 armour and Hide, Veiled, Ghost |
| Light + Shadow | **Twilight** | Removes Hide, Veiled, Ghost and the target is Held |
| X + X (8) | **Resonance** | X's own effect doubled: Fire Burn 2, Water heal 2 and +1 column block, Wood Poison 2 and cap +1, Earth armour -2 and +1 block, Wind push 2 and Mark, Lightning full jump plus a half jump; Light: +1 damage and strips Hide; Shadow: Held |

### Affinity versus merges (two modes, a dev-page switch)

| Mode | Rule |
|---|---|
| **Own element** (default, recommended) | Each hit is judged by its own attacker's element against the enemy (multiplier and weakness hit). Merge effects are additional and ride on the carrier hit, which is judged by the carrier's own element |
| **Best of column** (alternative, test only) | Every hit from an attacker in the column uses the best multiplier among the column's attacker elements (x1.5 beats x1 beats x0.5; a resist applies only if every attacker resists). The named weakness hit comes from the front-most attacker whose element gives the best multiplier, once per hit. A one-element column behaves as Own element |

Recommendation: **Own element**. It keeps every unit's element meaningful and makes the choice of the front attacker matter; Best of column lets one off-element unit carry a whole column and removes the reason to field the right element. No new affinities are defined for merged elements.

### Monster variants carry elements

| Bestiary variant | Element | Bestiary variant | Element |
|---|---|---|---|
| fire, magma | Fire | stone, sand, metal, crystal | Earth |
| water, blood | Water | wood, venom | Wood |
| **frost** | **Water (Ice)** | light | Light |
| wind | Wind | shadow | Shadow |
| **storm** | **Lightning** | | |

A "frost skeleton dragon" is a Water/Ice enemy: weak to Lightning and Wood, resists Fire and Water. A "storm kamaitachi" is Lightning: weak to Earth, resists Wind and Lightning. The element is a pip on the enemy card, with small arrows for what it is weak to and what it resists (and a ❄ for Ice).

---

## 3. Families (5)

Each unit belongs to one family for the whole line (no family change on evolution). A family set bonus triggers at 2 and 4 units on the squad.

| Family | Folds in | Signature (one line) | Set bonus 2 / 4 | Units |
|---|---|---|---|---|
| **Wings** | birds | **Reach**: Skyfall, range, Heralds | +1 range / first shot ignores Guarded and Hide | 15 |
| **Hooves** | hooved beasts | **Charge**: Swift, push, wide support | +1 ATK turn 1 / all Swift | 12 |
| **Fangs** | cats, hounds and foxes (packs) | **Pounce, Pack, Rend**: strike first, strike together, carry overkill | Straight Fangs gain Rend and Howl counts the squad / Rend cap 4, Pounce +1 | 20 |
| **Scales** | serpents and dragons (coils), fish (fins), tortoises and crabs (shells) | **Layers**: Pierce and Venom, Chain, Shields and Carapace | every Scales secondary number +1 / Scales also count as Water | 25 |
| **Wilds** | insects and spiders (chitin), bears, apes, plants, oddities | **Wild Card**: flexible and swarming beasts | one Wilds unit counts as any family / two | 17 |

`units.json` keeps a `branch` tag (`pack`, `coil`, `fin`, `shell`, `chitin`) so art and flavour keep the old identities. Old traits (Order, Wild, Arcane, Undead) stay removed; Undead may return as an enemy-only family.

### Buffers: everyone, with a Kin bonus

| Rule | Text | Examples |
|---|---|---|
| **Buffer** (default) | The buff reaches every ally in its area; allies of the buffer's own family (or element) get **+1 more** (Kin bonus, costs 1 budget point) | Plume Herald (+1 ATK, Wings +2), White Hart (+1, Hooves +2), Zodiac Hound (+1, Fangs +2), Polar Bear (+1 block, Water +1 more), Rain Dragon (+1, Wood +2) |
| **Kin only** (exclusive, rare and strong) | Reaches only its own family or element, at +2 and wider | Qilin (Legendary, every Hooves +2), Divine Tortoise (Epic, Scales Shields +2), Salamander (Rare, adjacent Fire +2) |

Element buffers follow the same rule. Only three units are Kin only; a new one needs an explicit design reason.

---

## 4. Roles and the power budget

Units may mix roles. Every unit has a **role split** summing to 100: Attack, Buff and Guard (a small tri-bar on the card). **There is no hybrid tax**: the budget cap by rarity is the only limit, and a hybrid saves a tile and a Command Point.

| Rarity | Command Cost | Budget | Notes |
|---|---|---|---|
| Common | 1 | 8 | Simple, one rule |
| Rare | 2 | 10 | One extra trick |
| Epic | 3 | 12 | Strong rule or a hybrid |
| Legendary | 4 | 14 | Born at stage 2 (mythic), 2 stages only |

| Item | Cost (points) |
|---|---|
| 1 ATK | 3 |
| +1 range | 1 |
| Pattern: Spread or Pierce | 2 |
| Each secondary (Chain, Mark, Venom, Hold, Chill, Scorch) | 2 |
| +1 ATK buff to one tile | 2 (two tiles 4; all 4 sides 6) |
| **Kin bonus** (+1 more for the buffer's family or element) | 1 |
| x2 multiplier (War Horn) | 6 |
| 1 block | 2 |
| Heal hero 1 per turn | 3 |
| Conditional bonus (Pounce, Latecomer, Firstborn) | -1 |
| Evolution extension | 1 per stage |

Role synergies are unchanged in spirit: Attack + Buff (Herald beside a Pounce unit), Buff + Guard (White Hart), Attack + Guard (Bastion in the front row), Captain + Attack, Guard + Roots.

---

## 5. Unit types and styles

Patterns kept: Straight, Spread, Pierce, Boost, Cross Boost, Multiplier, Spyglass, Shield. New behaviours (one line each; all in `keywords.json`):

| # | Behaviour | Card line | Example |
|---|---|---|---|
| 1 | **Herald** (buffer) | Adjacent allies +1 ATK; kin +1 more | Plume Herald |
| 2 | **Element Herald** | Adjacent allies +1; the element +1 more | Polar Bear |
| 3 | **Kin only** | Buff reaches only own family or element, +2 | Qilin |
| 4 | **Attune** (converter) | The unit above takes this unit's element | Nine-Tail Fox |
| 5 | **Mirror** (copy) | Copies pattern and ATK of the left unit | Langur Mirror |
| 6 | **Column / Row Captain** | Every attacker in its column / row +1 ATK | Indrik, Humpback Cantor |
| 7 | **Molt** | +1 ATK each turn it survives (max +3) | Yazi, Axolotl |
| 8 | **Offering** | Consumes an adjacent Common for the battle: +2 ATK | Scarab Roller |
| 9 | **Latecomer / Firstborn** | +2 ATK if last / first card placed this turn | Puma, Salmon |
| 10 | **Swap** | After attacking, swaps with an ally | Tulpar, Reynard |
| 11 | **Resonance / Herd / Howl** | +1 per ally of its element / family / Fangs in its row | Giant Panda, Audhumbla, Cu Sidhe |
| 12 | **Decoy** | Takes the first enemy strike in its column | Bi'an, Xolo |
| 13 | **Skyfall** | Straight with unlimited range | Khan Garid |
| 14 | **Chain / Mark / Hold / Mimic** | Jumps / +1 next hit / skip strike / take target's element | Dolphin, Raven Pair, Cat Sidhe, Tanuki |
| 15 | **Tribute / Bloom** | +1 Soul per kill / heal hero 1 per turn | Pixiu, Honu |
| 16 | **Echo / Echo Drum** | Attacks twice (second at half) / buffs the unit above to do so | Sleipnir, Qiuniu |
| 17 | **Brood / Carapace / Current** | Drone every turn (max 3) / growing Shield / push one column | Honeybee, Geobuk, Cheonma |
| 18 | **Scorch / Chill / Venom** | Burn, ATK -1 (Ice), stacking poison | Sun Crow, Reindeer, Wadjet |
| 19 | **Trample / Pounce / Swift / Bastion / Relay** | Hit behind / +2 vs full HP / first / Shield + attack / boost two tiles up | Rakhsh, Tigers, Hind, Coconut Crab, Ratatoskr |
| 20 | **Rend** | Overkill carries (see Section 8) | Fangs and items |
| 21 | **Ward / Rebirth / Bond / Mentor** | Negate first strike / rise once / partner pair +1 (squad, not board) / lower-stage ally +1 stage | Kōtuku, Phoenix, Sun Crow + Moon Hare |

---

## 6. Evolution: extend, never escalate

An evolved unit is used the same way as its base form. Its fundamental type and role split (within 10 points) do not change, **and its family never changes**. Each stage adds **one extension**: +1 range, wider area, extra target, secondary effect, longer status or a bigger cap. Raw stats rise at most +1 on one number across the line; budget grows 1 point per stage.

| Line | Stage 1 | Stage 2 | Stage 3 |
|---|---|---|---|
| Dragon-Gate Carp (Scales) | Carp: Straight R2 ATK 2 | Koi: range 3 | Long: chips 1 behind, Chill |
| Nine-Tail Fox (Fangs) | Fox: Attune the unit above | Kitsune: also the unit below | Jiuweihu: attuned units +1 ATK |
| Plume Herald (Wings) | Turkey: Herald, Wings +2 | Quetzal: reaches diagonals | boosted Wings +1 range |
| Geobuk (Scales) | Pond turtle: Carapace max +3 | Geobuk: max +4 | (2 stages) |
| Phoenix (Legendary Wings) | Red kite: Pierce R5, rebirth | Phoenix: range +1, revived hero keeps a Shield | (born mythic) |

| Stage | Unlock | Command cost |
|---|---|---|
| 1 Animal | Owned | Rarity cost (1/2/3/4) |
| 2 Beast | Mastery Lv3 and 2 stars | Same cost |
| 3 Mythic | Mastery Lv5 and 4 stars, plus one element Seal | **Same cost** (the +1 CP surcharge is cut) |

In a run, Evolution Seeds and shrines can evolve one unit for that run only.

---

## 7. Synergy systems

| System | Depth | Complexity | Phone readability |
|---|---|---|---|
| **1. Affinity, weakness hits and column merges** (8 elements, 12 weakness hits, 36 merges) | High | Medium | Good: arrows on the enemy card, a merge icon on the column |
| **2. Family sets and Kin buffers** (5 families) | Medium | Low | Excellent: a counter in the squad bar |
| **3. Formation shapes** (Captains, Howl, columns, big-enemy lanes) | High | Medium | Fair: ghost-lines on the board |
| 4. Evolution branches | High | Medium | Good, one choice at a time |
| 5. Bond pairs (squad-wide) | Medium | Low | Excellent |
| 6. Converters (Attune, Mimic) | High | High | Hard: two units only |

Core: 1, 2, 3. Layers 4-6 are optional. Variation estimate: 5 families x 8 elements x 21 behaviours x 3 stages, filtered by 15 tiles and 36 merges, still yields thousands of builds.

Example builds: **Burn garden** (Wood and Fire: Kindle, Wildfire, Sun Crow, Bulgae, Rain Dragon); **Frozen tide** (Water/Ice: two Ice hits Freeze, Geobuk, Reindeer); **Lightning pond** (Water and Lightning in one column: Surge, Conduct on Water enemies, Raijū, Dolphin); **Pack tactics** (3 Fangs in a row with Howl and Rend); **Hive** (Wilds: Brood and Offering).

---

## 8. Overkill rework (Rend)

Overkill is no longer a free default. **Rend** (cap 3) is a keyword. Fangs carry it by their set bonus (2-Fangs set: Straight Fangs gain Rend), but **any squad can gain it** from the Susanoo's Edge relic (all Straight attackers), Hunter's Moon (cap 4), the Whetstone Camp upgrade (+1 cap) and fang items. Spill works on Rend only.

| Where | Change |
|---|---|
| `engine.js` dealDamage | Overkill only if `source` has `rend`; Spill needs `rend` |
| Bulwark (enemy) | Blocks Rend and Pierce from reaching the tile behind it (a wide Bulwark blocks each column it covers) |
| Boss Sansin, Bodyguard, twin-lane template, ENEMY_REVAMP stages | Re-tag "overkill" to "Rend" or "Pierce"; each stays beatable without Fangs |
| Bounties, relics `fenrir`/`susanoo`, item `spill` | Only Rend kills count |

Big enemies and Rend: see 10.3 (a Rend carry goes to the next body behind in the struck column and can open a boss-row gate).

---

## 9. Items: no base rarity

**Every item drops as Common, then rolls up.** Rarity is how many random sub-effects the item carries. The source (normal, elite, boss, secret boss) sets the base power of the item and which unique affixes it can roll. Items are archetypes (`items.json`): a Common base effect, a sub-effect pool by slot, and for elite, boss and secret-boss sources a list of unique affixes. Slots, sets and item level are unchanged (Weapon, Armor, Banner, Ring x2; region sets at 2 and 4; item level from the node).

### 9.1 Rarity tiers and roll chances

Roll in steps: start Common; roll the step-up chance to become Rare, then Rare to Epic, then Epic to Legendary. Step chance = source base + **0.3 points per item level** (cap +9), so depth improves every row.

| Rarity | Sub-effects | Unique slots (elite, boss, secret) | Dust (salvage) |
|---|---|---|---|
| Common | 0 | none | 2 |
| Rare | 1 | any sub-effect can be unique | 5 |
| Epic | 2 | any can be unique | 12 |
| Legendary | 3 | any can be unique; boss and secret items add one **major** affix | 30 |

| Source | Common to Rare | Rare to Epic | Epic to Legendary | Result C / R / E / L (iLv 0) |
|---|---|---|---|---|
| Normal fight | 20% | 25% | 15% | 80 / 15 / 4 / 0.8 |
| Elite | 40% | 35% | 20% | 60 / 26 / 11 / 2.8 |
| Boss | 65% | 45% | 25% | 35 / 36 / 22 / 7 |
| Secret boss | 100% | 60% | 35% | 0 / 40 / 39 / 21 |

At item level 30 the +9 doubles the high tiers (normal fights reach about 29 / 34 / 24 per step).

### 9.2 Sub-effect pool by slot

A sub-effect is drawn from the slot's pool, never repeating a tag and never the item's main stat. Numbers scale with item level (item-level multiplier capped at x2.0, reached at iLv 15; later power comes from rarity, not bigger numbers).

| Slot | Pool tags (value at iLv 1) |
|---|---|
| Weapon | `atk_type` +1 ATK to a unit type; `range` +1 range to a type (region 2+); `rend_cap` Rend cap +1; `weak_dmg` weakness hits +1; `full_hp_bonus` +1 vs full-HP enemy; `bane_big` +1 vs Big bodies |
| Armor | `max_hp` +2; `block` Shields +1; `shield_type` +1 block to one Shield type; `hero_block_t1` +2 block on turn 1; `burn_ward` ignore first Burn; `lane_guard` -1 from each lane of a Wide strike |
| Banner | `support_amount` +1 to a support type; `kin_bonus` Kin bonus +1; `merge_power` merge effects +1 power; `herald_reach` buffs reach one more tile; `bond_atk` Bond +1; `first_turn_atk` first turn attackers +1 |
| Ring | `souls_pct` +4%; `rations` +1; `dust_find` +1 Dust per salvage; `regen_after_battle` heal 1; `resonance_count` +1 counted unit for resonance; `gold_pct` +5% |

### 9.3 Source tiers and base power

Base power is the Common item's main effect. A tier-I main effect is the old Common value, II the old Rare value, III the old Epic value.

| Source | Base power | Main effect examples (Common) | Drops |
|---|---|---|---|
| Normal | tier I | +1 ATK; +1 block; +2 HP; +8% Souls | Random archetype from the region table |
| Elite | tier II | +2 ATK; +2 block; +4 HP; +15% Souls | Always one item (unowned archetype, else 3 Dust x1.5) |
| Boss | tier III | +3 ATK; +3 block; +6 HP; +25% Souls | One item plus a Key |
| Secret boss | tier III x1.25, never Common | +4 ATK; +4 block; +8 HP; +31% Souls | Optional hidden fight behind a Sealed Cache (2 Keys); one per region |

### 9.4 Unique affixes per source

| Source | Theme | Chance per sub-effect slot (Rare+) | Major affix |
|---|---|---|---|
| Normal | none | 0% | none |
| Elite | **Hunter** (minor): bonuses against Big bodies, armor, escorts, e.g. "+1 vs Big", "Held Big enemies skip their whole strike" | 25% | none |
| Boss | **Signature**: bends a rule tied to the boss's gimmick, e.g. "Every enemy strike deals 1 less", "Barrels explode for 4" | 40% (minor) | Legendary: guaranteed (the old Legendary rule) |
| Secret boss | **Build**: changes a core verb, e.g. "First shot of every battle deals double" | 60% (minor) | Epic and Legendary: guaranteed |

Unique affixes are listed per item in `items.json` as `{grade: minor|major, text}`; a Common never carries one.

### 9.5 Salvage, Forge, pity (adjusted rules)

| Topic | Rule (V2.1) | Changed from |
|---|---|---|
| Salvage | Dust by final rarity (table 9.1) x source (normal 1, elite 1.5, boss 2, secret 3), +1 per 3 item levels | Dust by fixed rarity |
| Forge: reroll | 10 / 14 / 20 Dust rerolls one sub-effect on any item with sub-effects; never a unique, never the main stat | Epic and Legendary only |
| Forge: ascend (new) | 20 / 50 / 120 Dust adds one sub-effect and steps the rarity (C to R, R to E, E to L); a boss or secret item rolls the new slot with its unique chance | no way to improve a Common |
| Forge: level | Unchanged (max level 20, 4 + 1.5 x level Dust) | numbers capped x2.0 from iLv 15 |
| Duplicates | One copy per archetype. A duplicate drop shows both rolls; keep the better, the other becomes half Dust | owned copy only levelled up |
| Pity: step-up | Each drop from a source that stays Common adds +2 points to that source's Common to Rare chance (cap +20), reset on any Rare or better | pity on a fixed unique item |
| Pity: Legendary | Boss and secret sources: every 15th drop without a Legendary is forced Legendary | +5% per kill |
| Boss tokens | Each boss kill gives a token; 6 tokens buy that boss's item at Legendary with its major affix | tokens bought a fixed Legendary |
| Sets | Region set unchanged; set tiers count items, not rarity | no change |
| Keys | Elite and boss wins give a Key (max 3); a secret boss needs 2 | Sealed Cache needed 1 |

Heroes, relics and Camp: relics (49) are remapped to 8 elements and 5 families; Camp adds Whetstone (+1 Rend cap), Nursery (evolve a level earlier), Bestiary Hall (reveal enemy elements and footprints).

---

## 10. Big enemies (rules for implementation)

Board: 5 columns (1-5), enemy rows 1 (front), 2 (back) and, for some bosses, **row 3 (boss row)**; then 3 player rows (4 with the Camp Board upgrade). Distance counts rows upward from the attacker's tile.

### 10.1 Footprints

A footprint is **WxD** (W columns wide, D rows deep). The anchor is the front-left tile. The body occupies columns `c..c+W-1` and rows `r..r+D-1` (D grows toward the back); it must fit the board and not overlap.

| Footprint | Who | Rows | Lanes (strike columns) | From |
|---|---|---|---|---|
| 1x1 | all | 1, 2 or 3 | 1 | always |
| 2x1 wide | elite, boss | 1 or 2 (boss also row 3) | 2 | region 1 (boss Imugi; first elite late in region 1) |
| 1x2 deep | elite, boss | 1-2 | 1 | region 1 (boss), 2 (elite) |
| 2x2 | elite (region 4+), boss | 1-2 | 2 | region 3 (boss), 4 (elite) |
| 3x1 | boss (elite from region 8) | 1, 2 or 3 | 3 | region 1 (Orochi, boss row), 5 (front rows) |

Boss-row bodies are always D=1 (1x1, 2x1 or 3x1) and `bossRow: true`. A battle has at most one 2x2 or two other Big bodies, and an elite fight never combines a Big body with a boss.

### 10.2 One body, one pool

| Rule | Text |
|---|---|
| B1 Single entity | All tiles are one body: one HP pool, one ATK, one status set, one element. Any covered tile can be targeted, tapped and previewed. Death clears every tile at once; no backfill. |
| B2 Target lookup | A column "contains" a body if the body covers it. Straight in column c hits the front-most living body there, if within range (distance to the body's nearest tile). |
| B3 Spread | Resolves three lookups (own column and each neighbour). **Each lookup that lands on the same body is a separate hit**: a Spread over a 2x1 deals its damage twice, over a 2x2 or 3x1 up to three times. |
| B4 Pierce | In its column it hits every distinct living body in range once; a deep body counts once. |
| B5 Chain, Trample, Rend | Chain jumps to the lowest-HP living **other** body touching the target on any side. Trample and Rend work along the struck column: they affect the first living body behind the **rear edge** of the target. A Rend carry happens only when the hit kills the whole body. |
| B6 Armor, Hide | Armor and Hide apply per hit (so Spread ATK 1 into Armored 1 still does nothing, and Hide N is checked per hit). |
| B7 Statuses | Once per attack action per body: Burn, Venom, Chill, Mark, Hold and area effects (weakness hit and merge areas) apply once even if several columns hit. Burn and Venom tick once per turn per body. Mark is consumed by the first hit. Hold or Freeze skips the entire strike (all lanes). Chill lowers ATK per lane (min 1). |
| B8 Affinity | The affinity multiplier and the weakness hit fire on each hit (x1.5 applies per column hit); area parts (Wildfire spread, Conduct jump, merge neighbours) fire once per action. |
| B9 Heavy | Big bodies cannot be pushed (Current), swapped, drifted (Tide) or Stridden. They are not Splitters or Barrels by default. |

**Why count Spread hits per column (twice).** It is the simplest rule (no dedupe set; each column is an independent hit), it keeps cheap ATK-1 Spread units (Hammerhead, Kamaitachi, Firebird) useful against the bodies that are supposed to be "hit from several columns", and it gives a readable counter: Pierce and Straight hit once, armor cancels each tiny hit. The risk is bounded (at most 3 hits) and is priced into the footprint HP multipliers (10.5). Statuses are limited to once per action so Venom and Burn cannot stack from one Spread.

### 10.3 How a Big body attacks

| Rule | Text |
|---|---|
| A1 Lanes | A wide body strikes once per covered column. Each lane deals **ATK per lane** to the hero, and the Shield in that column absorbs first (each lane is resolved separately). A deep body has one lane. |
| A2 Order | Enemies act front row first, left to right, by anchor; a body's lanes resolve left to right at the same moment. |
| A3 Telegraph | The card shows `ATK x lanes` (e.g. `3x2`); the hero-damage preview sums the lanes after Shields. |
| A4 Sweep | A Big body with Sweep also hits the single column beside each end of the footprint for half damage. |
| A5 Hold, Freeze | Skip all lanes. Decoy takes the first strike in its column, so a Decoy absorbs one lane of a wide strike only. |

### 10.4 The boss row

| Rule | Text |
|---|---|
| R1 Gate (chosen) | **A boss-row body can be hit only through a column with no living enemy in rows 1-2.** This applies to Straight, Spread, Pierce, Chain, Trample and Skyfall alike; no pattern bypasses it. Pierce is not an exception: it cannot skip a living enemy to reach the boss row. |
| R2 Per column | The gate is checked per column. A 3x1 boss behind one cleared column can be hit from that column only; Spread checks each of its three columns separately. |
| R3 Distance | A boss-row body counts as the back row for range (distance 2 from your front row), so Range 2 reaches it once the gate is open. |
| R4 Rend | A Rend carry from a kill in the column in front of it can enter the boss row (the kill opens the gate); Bulwark in front still blocks it. |
| R5 Strike | A boss-row body strikes like any other enemy (all survivors strike) from its lanes. |
| R6 Summons | Summoner, Splitter and Healer minions fill empty tiles in rows 1-2 only, which re-closes the gate; they never enter the boss row. |

Why a hard gate: it is one sentence, it turns a boss into "clear a lane, then strike", it makes Pierce and Spread valuable for clearing without becoming boss-bypass tools, and it matches the Guarded boss idea (Tanuki and tiger) without a special rule.

### 10.5 Stat budget by footprint

Relative to a 1x1 of the same tier and level (HP basic and ATK basic from the stat rule in `WORLD_PROGRESSION.md` 4.1):

| Footprint | HP x | ATK per lane x | Lanes | Total threat x |
|---|---|---|---|---|
| 1x1 | 1.0 | 1.0 | 1 | 1.0 |
| 2x1 | 1.5 | 0.6 | 2 | 1.2 |
| 1x2 | 1.4 | 1.0 | 1 | 1.0 |
| 2x2 | 2.0 | 0.6 | 2 | 1.2 |
| 3x1 | 1.8 | 0.5 | 3 | 1.5 |

Round ATK per lane to at least 1. Elites use the elite factor (x1.6 HP), bosses the boss factor (x2.1 HP) before the footprint factor.

### 10.6 Phone readability (390 px wide)

| Aspect | Rule |
|---|---|
| Grid | 5 columns of 70 px with 4 px gaps = 366 px; tiles shrink to 62 px when the board has 7 rows |
| Rows | Rows 1-2 as today. The boss row appears only in battles that have one, as a 56 px strip above row 2 with the art overlapping upward by 8 px |
| Body | One merged card spanning the footprint, 3 px border in the element colour, art scaled to fit; HP bar full width; ATK and lanes (`3x2`) shown once, at the anchor |
| Lanes | A small ▼ under each covered column of the card marks where it will strike; Shields in a lane turn green when they absorb it |
| Gate | A chain icon across boss-row columns that still have a living enemy in front; open columns glow |
| Hits | Damage numbers pop on the struck column, staggered 120 ms; one shake for the body, one HP bar |
| Tap | Any tile of the body opens the same info card (name, element, footprint, lanes, statuses) |
| Enemies around it | Tiles in front or behind keep their normal 70 px size; the body never hides the tile it overlaps because its card is drawn inside the grid cells |

## Section 10 implementation notes

How the prototype engine (`prototype/js/engine.js`) implements section 10, and the rules chosen where the section is silent. Tests: `node tools/test-big-enemies.js`.

- **Coordinates.** Engine rows are 0 = back (spec row 2), 1 = front (spec row 1), and the boss row is row -1. A body is `{ row, col }` = its front-left anchor plus `w` and `d` (set only for Big bodies; every 1x1 stays a plain object). The boss row counts as the back row for range (distance `playerRow - max(row, 0)`). `Engine.validateLayout` rejects bodies that overflow, overlap, or are two rows deep in the boss row.
- **Spread** returns one hit per column lookup (so a 3x1 can be hit three times by one Spread); the `fire` and `hit` events carry the column. Armor, Hide (ward) and the affinity multiplier are evaluated per hit. A body that dies mid-volley is not hit again.
- **Pierce** hits each distinct body in rows 1-0 once; the boss row is reached only when the column has no living enemy in rows 1-0 (the gate is evaluated at the moment of the shot, whether or not that enemy was in range).
- **Overkill / Rend carry** happens only when the hit kills the whole body, goes along the struck column to the first body behind the rear edge (so a back-row kill carries into the boss row, R4), and a Bulwark body blocks it. The carried hit never carries again. The Spill relic spills along the front row beside the struck column.
- **Chain** (Storm Mage) jumps to the lowest-HP other body touching any tile of a struck body; a boss-row body counts as touching only through a gate-open column, checked after the hit (so a kill can open the gate for the chain).
- **Explosions (barrels)** hit each neighbouring body once through the four orthogonal tiles of the barrel, a boss-row body above a back-row barrel included (an explosion is not a "pattern", so the gate does not apply). Barrels are always 1x1.
- **Attacks.** One strike per covered column, resolved column by column, front to back inside a column (the existing order; it only differs from A2 across columns, and Shields are per column). Sweep hits the column beside each end of the footprint for `ceil(atk / 2)`. Enrage and end-of-turn gimmicks (Fury, Harden, Regenerate) act once per body. Gaze weakens attackers in every covered column. The threat preview sums lanes.
- **Healer / Summoner / Splitter.** A healer mends every neighbouring body once (a Big healer: every body touching any of its tiles). Summoner minions use only empty tiles of rows 1-0 (R6); a Splitter that dies in the boss row puts its two minions in the nearest empty tiles of rows 1-0; a Big Splitter splits into its anchor tile and a free neighbour. Regrow waits until every tile of the body is free.
- **Heavy (B9).** Big bodies do not Stride and are not swapped by a Strider (a blocked strider turns round and stays). Tide never carries Big bodies or the boss row, and a row that holds a Big body does not drift at all, so nothing drifts into it.
- **Not in the prototype engine yet:** Burn, Venom, Chill, Mark, Hold, Freeze, affinity, weakness hits, merges, Trample, Skyfall and Decoy do not exist, so B7 and B8 are only represented by Armor, Hide, Veil, Guard and the once-per-body gimmicks above. They should reuse the same per-hit versus per-action split when they arrive.
- **Budget.** `Engine.FOOTPRINTS` / `Engine.applyBudget` hold the 10.5 multipliers (HP x, ATK per lane x, at least 1). `gen.js` applies them to a layout char listed in a boss-def's `foot`; the dev builder applies them to new and re-footprinted bodies.
- **UI.** A Big body is one card in its anchor tile spanning `w x d` cells with one HP tag, one status row and `ATK x lanes`; lane markers sit under each covered column, the boss row is a 0.8-cell strip with art overlapping upward, gated boss-row columns show a chain and open ones glow. Highlights cover the whole body when any tile is targeted; damage numbers and projectiles use the struck column.

---

## 11. Open decisions

Decided in V2.1 and removed: nine elements (V2.2: 8), Storm needing more units, nine families, Chitin and real insects, the family-change on evolution, the stage-3 Command Point surcharge, Bond on the board, removing the old traits, Fangs being the only Rend family, hybrid tax (cut), item base rarity (cut).

1. **Level curve and rewards past Lv20.** The enemy stat rule is set (`WORLD_PROGRESSION.md` 4.1); the reward curve w(L) = (L/5)^1.5 reaches 36x at Lv55. Propose capping the exponent after Lv20 or by flattening Souls; needs the campaign sim.
2. **Spread counts once per column** (10.2). Confirm the "twice" rule, or switch to once per body and raise Spread-unit ATK.
3. **Boss-row gate with no exceptions** (10.4). Confirm that Pierce cannot bypass it, or allow Pierce to reach it when exactly one enemy stands in front.
4. **Affinity and merges (V2.2):** (a) confirm the chart and the 12 weakness hits; (b) confirm Own element as the default and keep Best of column as a test switch only; (c) are merges automatic or does the player tap to fire them (recommended: automatic, shown in the preview)? (d) Lightning had only 4 units: **done in step 3, three added** (Kui Hooves, Electric Eel Scales, Storm Petrel Wings Kin buffer); (e) merge power vs unit count: the 3-merge column is the strongest board shape, tune in step 5; (f) Radiance and Eclipse repeat across six pairs: keep uniform or give each its own flavour?
5. **Rend:** confirm cap 3 and that any unit can gain it by item, relic and Camp.
6. **Hybrid tax removal:** check in the sim that free hybrids do not dominate (the budget cap is the only limit now).
7. **Evolution:** automatic at mastery or a choice at stage 2 with two branches? Legendary born at stage 2 or all lines three stages?
8. **Scales is the largest family** (25 units against 12 Hooves): rebalance by adding Hooves and Wings units or moving the shells.
9. **Secret bosses:** one per region behind a Sealed Cache with 2 Keys (9.3); confirm count, art and whether they appear in the 100 sub-areas or as extras.
10. **Item pity and Forge prices** (9.5) are placeholders for `tools/sim-runs.js`; step-up chances in 9.1 likewise.
11. **Elite and boss affinity:** recommended none (same chart as their element); optionally at most one weakness removed (x1) per Necropolis boss via `affinityOverride`, never an immunity.
12. **Every enemy has an element,** or plain monsters stay elementless?
13. **Art:** Long, Fenghuang, Baihu and Xuanwu art was dropped; use Yong, Rồng or the zodiac Dragon for dragon lines. Big-body art needs 2x1, 1x2, 2x2 and 3x1 crops for 30 elites and 42 bosses.
14. **Ambivalent animals** (tiger, wolf, bear) on the player side as "wild guardians"?
15. **Hero:** one default (Beast-keeper) or choose from the list? Real animals as filler units acceptable?
16. **Dev page follow-up (code, not done):** `prototype/design.js` filters items by the removed `rarity` field and ties items to the old text; update it when code work is allowed.
17. **V2 dev page (done, `V2_UNITS_PLAN.md` step 4):** the dev page has a Classic / V2 rules switch, a V2 team editor, the editable 8x8 weakness chart and the merge-mode switch, and the battle screen shows element chips, weak / resist badges, merge previews, statuses and an inspect card under `rules.v2`. Classic mode is unchanged.
