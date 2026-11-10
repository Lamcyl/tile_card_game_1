# Bestiary

Master list of mythical beasts, monsters, spirits and animals from many cultures, for the game's creatures. Each entry is tagged by Nature (Benevolent, Ambivalent or Malevolent), so benevolent creatures can be kept apart from the malevolent ones. Art status comes from `art-samples/SUMMARY.md`, `art-samples/picks-data.mjs` and each set's README; game use from `prototype/js/world-data.js`, `docs/ENEMY_REVAMP.md` and `prototype/assets/units/`. Existing drawings can serve as enemy art.

**Inclusion rule.** The 21 cultures list folkloric monsters, beasts, spirits, undead, constructs and real animals, plus the 🟢 gods of low-sensitivity pantheons (Greek, Egyptian, Norse, Mesopotamian, Finnish). All deities and sacred figures flagged 🟡 or 🔴 were removed (see "Sensitivity research" and the appendix "Removed for sensitivity"). Excluded entirely: Islamic prophets and angels (depiction is forbidden for prophets), Christian saints and angels, and the Native North American and Australian Aboriginal cultures (sacred-knowledge restrictions). Beyond the culture sections, a "Named sets" part groups well-known sets (zodiacs, the Olympians and others); set entries often repeat culture entries. Descriptions follow the traditional sources; where the origin is uncertain the entry is left out. New in this version: a Nature column on every row, a Variant system with named Variants, and Monster families that cut across cultures.

## Legend

- Art status: ★ chosen pick, ○ drawn but not picked, ✕ rejected or dropped, blank = not drawn. Fenrir, Kraken, Vodyanoy and Bastet are ✕ dropped and must not be redrawn; the Chinese guardians Long, Fenghuang, Baihu and Xuanwu are also ✕. Drawings for removed entries stay in the art folder and can be reused.
- ◆ = already in the prototype (used in a current enemy list or has a file in `prototype/assets/units/`).
- Fam. (familiarity to the general public, judged by presence in popular media and games): ① Common (dragon, mermaid, zombie), ② Well-known (kitsune, minotaur, Anubis), ③ Known to fans (kappa, wendigo, nue), ④ Obscure, ⑤ Unheard of (specialists only). Within every culture and set, rows are sorted by familiarity, most familiar first.
- Nature (the creature's role in its own folklore, not in modern media): **Benevolent** protective, auspicious or guardian (qilin, komainu, haetae, baku, simurgh, unicorn, phoenix); **Ambivalent** tricksters, neutral nature spirits and wild animals; **Malevolent** man-eaters, demons, vengeful dead and chaos monsters.
- Flag (sensitivity): 🟢 Low (ancient religion with no significant living worship, widely used in games), – = not a deity or sacred figure. Entries flagged 🟡 (medium) or 🔴 (high) have been removed.
- Kind: beast, monster, spirit, undead, deity, deity-beast, animal, construct. Habitat terms: meadow, forest, bamboo, lake, marsh, highland, desert, oasis, saltflat, canyon, tomb, ice, volcano, coast, sea, sky, underworld, city, river, mountain, cave, jungle, steppe, ruins, village, island.

## Summary

Counts per culture after the removal. Fam. columns are the familiarity distribution ①–⑤; Nature columns count tags; Removed counts the 🟡 and 🔴 rows deleted from that culture.


| Culture | Entries | ★ | ○ | ✕ | Drawn | Not drawn | ① | ② | ③ | ④ | ⑤ | Benevolent | Ambivalent | Malevolent | Removed |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Japanese yokai | 32 | 10 | 9 | 0 | 19 | 13 | 0 | 3 | 14 | 15 | 0 | 4 | 18 | 10 | 13 |
| Egyptian | 45 | 6 | 13 | 1 | 20 | 25 | 4 | 8 | 14 | 14 | 5 | 28 | 10 | 7 | 0 |
| Chinese | 27 | 1 | 11 | 2 | 14 | 13 | 2 | 5 | 6 | 13 | 1 | 9 | 12 | 6 | 21 |
| Greek | 65 | 5 | 15 | 0 | 20 | 45 | 18 | 19 | 20 | 8 | 0 | 19 | 21 | 25 | 0 |
| Norse | 53 | 2 | 16 | 2 | 20 | 33 | 9 | 5 | 16 | 16 | 7 | 20 | 19 | 14 | 0 |
| Slavic | 32 | 1 | 14 | 1 | 16 | 16 | 2 | 2 | 10 | 13 | 5 | 7 | 14 | 11 | 11 |
| Maya | 19 | 1 | 10 | 0 | 11 | 8 | 1 | 3 | 2 | 10 | 3 | 2 | 9 | 8 | 16 |
| Korean | 23 | 3 | 12 | 0 | 15 | 8 | 0 | 3 | 10 | 8 | 2 | 11 | 5 | 7 | 11 |
| Celtic (Irish, Scottish, Welsh, Cornish) | 34 | 0 | 0 | 0 | 0 | 34 | 1 | 5 | 10 | 14 | 4 | 2 | 21 | 11 | 16 |
| Aztec and wider Mesoamerican | 19 | 0 | 0 | 0 | 0 | 19 | 2 | 3 | 5 | 9 | 0 | 2 | 10 | 7 | 20 |
| Hindu and Indian | 20 | 0 | 0 | 0 | 0 | 20 | 3 | 4 | 4 | 7 | 2 | 3 | 10 | 7 | 33 |
| Persian and Arabian | 20 | 0 | 0 | 0 | 0 | 20 | 2 | 2 | 6 | 6 | 4 | 6 | 7 | 7 | 8 |
| Mesopotamian | 37 | 0 | 0 | 0 | 0 | 37 | 1 | 0 | 12 | 17 | 7 | 13 | 9 | 15 | 0 |
| African (several traditions) | 26 | 0 | 0 | 0 | 0 | 26 | 7 | 4 | 4 | 7 | 4 | 0 | 17 | 9 | 14 |
| Polynesian, Māori and Hawaiian | 20 | 0 | 0 | 0 | 0 | 20 | 2 | 2 | 5 | 10 | 1 | 2 | 13 | 5 | 14 |
| Inca and Andean | 20 | 0 | 0 | 0 | 0 | 20 | 4 | 2 | 4 | 6 | 4 | 1 | 12 | 7 | 8 |
| Southeast Asian (Philippines, Thailand, Malay world, Indonesia, Vietnam) | 42 | 0 | 0 | 0 | 0 | 42 | 1 | 2 | 10 | 18 | 11 | 6 | 15 | 21 | 8 |
| Mongol, Turkic and Siberian | 21 | 0 | 0 | 0 | 0 | 21 | 1 | 5 | 2 | 8 | 5 | 2 | 10 | 9 | 6 |
| Medieval European bestiary and heraldry | 30 | 0 | 0 | 0 | 0 | 30 | 4 | 5 | 9 | 12 | 0 | 5 | 19 | 6 | 0 |
| Finnish, Sámi and Baltic | 32 | 0 | 0 | 0 | 0 | 32 | 2 | 1 | 6 | 15 | 8 | 4 | 19 | 9 | 3 |
| Modern cryptids | 28 | 0 | 0 | 0 | 0 | 28 | 3 | 2 | 7 | 15 | 1 | 0 | 24 | 4 | 0 |
| **Total (21 cultures)** | **645** | **29** | **100** | **6** | **135** | **510** | **69** | **85** | **176** | **241** | **74** | **146** | **294** | **205** | **202** |

**Named sets** (rows repeat culture entries where possible; "new" counts rows that exist only in the set):

| Set | Entries | new | ① | ② | ③ | ④ | ⑤ | Benevolent | Ambivalent | Malevolent | Removed |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Chinese zodiac (12 animals) | 12 | 12 | 12 | 0 | 0 | 0 | 0 | 3 | 9 | 0 | 0 |
| Western zodiac (12 signs) | 12 | 12 | 4 | 3 | 5 | 0 | 0 | 2 | 10 | 0 | 0 |
| 28 Lunar Mansions (4 by 7) | 28 | 28 | 0 | 0 | 0 | 0 | 28 | 0 | 28 | 0 | 0 |
| Twelve Olympians | 12 | 0 | 8 | 4 | 0 | 0 | 0 | 9 | 3 | 0 | 0 |
| Beasts of the Twelve Labours of Heracles | 10 | 3 | 2 | 1 | 4 | 3 | 0 | 1 | 1 | 8 | 0 |
| Four Benevolent Animals (Si Ling) | 4 | 1 | 1 | 2 | 1 | 0 | 0 | 4 | 0 | 0 | 0 |
| Dragon King's Nine Sons (Longzi) | 9 | 7 | 0 | 0 | 0 | 6 | 3 | 9 | 0 | 0 | 0 |
| Four Perils of Chinese myth (Si Xiong) | 4 | 1 | 0 | 0 | 1 | 2 | 1 | 0 | 1 | 3 | 0 |
| Japanese Three Great Yokai (Sandai Yōkai) | 3 | 3 | 0 | 0 | 2 | 1 | 0 | 0 | 0 | 3 | 0 |
| Nine Muses | 9 | 9 | 0 | 0 | 1 | 8 | 0 | 9 | 0 | 0 | 0 |
| Greek triple sisters | 10 | 8 | 1 | 0 | 1 | 8 | 0 | 0 | 3 | 7 | 0 |
| Offspring of Echidna and Typhon | 8 | 2 | 3 | 2 | 1 | 2 | 0 | 0 | 0 | 8 | 0 |
| Monsters of the Odyssey | 10 | 7 | 1 | 3 | 1 | 4 | 1 | 1 | 3 | 6 | 0 |
| Planets and their mythic namesakes | 10 | 10 | 5 | 2 | 3 | 0 | 0 | 10 | 0 | 0 | 0 |
| Egyptian Ennead of Heliopolis | 9 | 0 | 0 | 2 | 1 | 4 | 2 | 8 | 1 | 0 | 0 |
| Four Sons of Horus | 4 | 4 | 0 | 0 | 0 | 0 | 4 | 4 | 0 | 0 | 0 |
| The Nine Worlds of Norse cosmology | 9 | 6 | 1 | 0 | 5 | 3 | 0 | 3 | 2 | 4 | 0 |
| Children of Loki | 4 | 0 | 0 | 3 | 1 | 0 | 0 | 1 | 1 | 2 | 0 |
| The Wild Hunt | 9 | 5 | 1 | 0 | 2 | 5 | 1 | 1 | 5 | 3 | 1 |
| Aztec day signs (Tonalpohualli) | 20 | 19 | 1 | 2 | 5 | 11 | 1 | 0 | 19 | 1 | 0 |
| Arthurian beasts | 8 | 4 | 0 | 0 | 3 | 4 | 1 | 2 | 3 | 3 | 0 |
| Elementals (Paracelsus) | 4 | 4 | 0 | 2 | 2 | 0 | 0 | 0 | 4 | 0 | 0 |
| **Total (22 sets)** | **208** | **145** | **40** | **26** | **39** | **61** | **42** | **67** | **93** | **48** | **1** |

Sets dropped (all or most members removed): Ars Goetia, best-known demons (of 72), Dashavatara (ten avatars of Vishnu), Eight Immortals (Ba Xian), Five Elements creatures (Wuxing), Four Dragon Kings (Si Hai Longwang), Four Heavenly Kings (Shi Tianwang), Four Horsemen of the Apocalypse, Four Symbols (Sishen), Hindu Navagraha (nine planets), Primordial beasts of the Hebrew tradition, Seven Deadly Sins as demons (Binsfeld), Seven Lucky Gods (Shichifukujin). Names are in the appendix.

**Unique entries across cultures and sets: 784** (familiarity ① 89, ② 93, ③ 201, ④ 288, ⑤ 113; nature: Benevolent 188, Ambivalent 371, Malevolent 225). Removed for sensitivity: 271 unique entries (the earlier total was 1050) and 12 of 34 sets dropped.

## Benevolent beasts

Entries tagged Benevolent, grouped by culture (first appearance only). They are kept in their tables and are candidates for the player side.

- **Japanese yokai** (4): Tsuru, Komainu, Baku, Zashiki-warashi.
- **Egyptian** (28): Anubis (Inpu), Ra, Bastet, Thoth (Djehuty), Osiris, Isis (Aset), Horus (Heru), Bes, Bennu, Wadjet, Ushabti, Hathor, Amun (Amun-Ra), Maat, Khepri, Serket (Selket), Taweret, Ptah, Nephthys, Nut, Geb, Khnum, Neith, Atum, Aten, Khonsu, Shu, Tefnut.
- **Chinese** (9): Long, Fenghuang, Qilin, Pixiu, Yutu, Bai Ze, Xiezhi, Bixi, Chiwen.
- **Greek** (19): Pegasus, Zeus, Poseidon, Athena, Dolphin, Apollo, Artemis, Aphrodite, Hermes, Hephaestus, Demeter, Prometheus, Eros, Hippocampus, Hestia, Gaia, Ram Chrysomallos, Helios, Selene.
- **Norse** (20): Thor, Freyja, Sleipnir, Huginn and Muninn, Freyr, Baldr, Tyr, Heimdall, Frigg, Gullinbursti, Tanngrisnir and Tanngnjóstr, Auðumbla, Njörðr, Iðunn, Sif, Mímir, Norns, Bragi, Víðarr, Ullr.
- **Slavic** (7): Firebird (Zhar-ptitsa), Domovoi, Gamayun, Simargl, Indrik, Sivka-Burka, Rarog.
- **Maya** (2): Resplendent quetzal, Ocellated turkey.
- **Korean** (11): Gongjak, Magpie, Haetae, Yong, Jeoseung Saja, Geobuk, Samjok-o, Bulgae, Bonghwang, Cheonma, Inmyeonjo.
- **Celtic (Irish, Scottish, Welsh, Cornish)** (2): Ddraig Goch, Salmon of Knowledge.
- **Aztec and wider Mesoamerican** (2): Quetzal, Xoloitzcuintli.
- **Hindu and Indian** (3): Yali (Vyala), Kinnara, Purushamriga.
- **Persian and Arabian** (6): Simurgh, Peri, Huma, Karkadann, Anqa, Rakhsh.
- **Mesopotamian** (13): Lamassu, Marduk, Shedu, Apkallu, Enki (Ea), Enlil, Anu, Shamash, Nanna (Sin), Dumuzi (Tammuz), Adad, Ninurta, Ninhursag.
- **Polynesian, Māori and Hawaiian** (2): Kōtuku (Māori), Tūī.
- **Inca and Andean** (1): Andean condor.
- **Southeast Asian (Philippines, Thailand, Malay world, Indonesia, Vietnam)** (6): Rồng (VN), Sarimanok (PH), Kinnari (TH), Hongsa (TH), Singha (TH), Thần Kim Quy (VN).
- **Mongol, Turkic and Siberian** (2): Khan Garid (Mongol), Tulpar (Turkic).
- **Medieval European bestiary and heraldry** (5): Unicorn, Phoenix, White hart, Pelican in her piety, Caladrius.
- **Finnish, Sámi and Baltic** (4): Ukko, Väinämöinen, Tapio, Ilmatar.
- **Chinese zodiac (12 animals)** (3): Dragon (Chen), Dog (Xu), Ox (Chou).
- **Western zodiac (12 signs)** (2): Aries (Ram), Libra (Scales).
- **Beasts of the Twelve Labours of Heracles** (1): Ceryneian Hind.
- **Four Benevolent Animals (Si Ling)** (1): Divine tortoise (Gui).
- **Dragon King's Nine Sons (Longzi)** (7): Suanni, Bi'an, Pulao, Yazi, Chaofeng, Fùxì (dragon son), Qiuniu.
- **Nine Muses** (9): Calliope, Clio, Erato, Euterpe, Melpomene, Polyhymnia, Terpsichore, Thalia, Urania.
- **Monsters of the Odyssey** (1): Calypso.
- **Planets and their mythic namesakes** (10): Jupiter, Mars, Venus, Mercury, Neptune, Pluto, Saturn, Sol, Luna, Uranus.
- **Four Sons of Horus** (4): Imsety, Hapy, Duamutef, Qebehsenuef.
- **The Nine Worlds of Norse cosmology** (3): Æsir (Asgard), Light elves (Alfheim), Vanir (Vanaheim).
- **Arthurian beasts** (1): Lady of the Lake.

## Variant system

Reusable variant axes. Any base monster in this file can take one value from each axis, so 784 entries become thousands of enemies without new lore. A variant is named `[Rank] [Element] [State] Base`, for example "Alpha frost skeleton dragon". Use at most one element and one state per monster; the biome decides where it appears and how it looks. Pick values that fit the body (a wood wolf is odd, a sand serpent is fine). Gameplay hints are plain words, not code.

**Element** (what it is made of or breathes)

| Value | Look | Gameplay hint |
|---|---|---|
| fire | Ember glow, scorched hide, flame breath. | Sets a tile ablaze; burns over time. |
| frost | Pale blue hide, frost breath, icicle spines. | Slows or freezes a tile. |
| storm | Crackling sparks, wind-whipped mane. | Lightning jumps to neighbouring tiles. |
| wind | Streamlined, feathered, trailing gusts. | Knocks pieces back or swaps places. |
| venom | Green or purple drip, fangs and stingers. | Poison that ticks until cured. |
| stone | Grey cracked hide, boulder joints. | Takes little damage but moves slowly; crushes a tile to rubble. |
| metal | Bronze or iron plates, rivets, a dull ring. | Shrugs off blades; weak to water and rust. |
| magma | Black crust split by molten cracks. | Leaves burning ground in its trail. |
| shadow | Smoky outline, pale eyes. | Hides on dark tiles; cannot be targeted from afar. |
| light | Radiant white-gold glow. | Blinds nearby foes; bursts when slain. |
| water | Dripping, scaled or slick skin. | Washes pieces off a tile; heals on wet ground. |
| sand | Dust-coloured, trailing grit. | Buries a tile; surfaces under the target. |
| wood | Bark, moss, root limbs. | Slowly regrows; weak to fire. |
| blood | Crimson veins, red eyes. | Heals by wounding; frenzies when hurt. |

**State** (what has happened to it)

| Value | Look | Gameplay hint |
|---|---|---|
| skeleton / undead | Bare bone or rotting hide, cold eye-lights. | Revives once after being slain. |
| ghost | Translucent, trailing mist. | Passes through obstacles; plain hits do less. |
| armoured | Plates, shell or scale mail. | Soaks up the first few hits; moves slowly. |
| giant | Towering, several times normal size. | Fills several tiles; slow but hits very hard. |
| swarm / lesser | Many small copies. | Arrives in packs; each has little health. |
| elder / ancient | Gnarled, scarred, old, often horned or hoary. | Wakes late and hits harder; has one special move. |
| corrupted | Twisted limbs, black veins, wrong colours. | Spreads blight on tiles; enrages when alone. |
| crystal | Gem-like body, facets, chiming. | Shatters into shards that hurt neighbours. |
| clockwork | Gears, brass seams, tick of a mechanism. | Follows a fixed, readable pattern; powers down for a spell. |
| plague | Boils, rags, buzzing flies. | Disease spreads to neighbours over time. |
| mutant | Extra heads, eyes or limbs. | Extra attacks; losing a head weakens it. |
| mummified | Wrapped in bandages and amulets. | Slow; sheds a curse on the tile it dies on. |

**Rank** (age and standing)

| Value | Look | Gameplay hint |
|---|---|---|
| whelp | Small, soft-edged, big eyes. | Fast to arrive, weak, often in pairs. |
| adult | The standard form in the entry. | Baseline stats. |
| alpha | Larger, scarred, wears trophies. | Strengthens nearby kin and calls reinforcements. |
| elder | Huge and ancient, a regional boss. | Rare; changes behaviour at half health. |

**Biome** (where it lives; sets colour and surroundings)

| Value | Look | Gameplay hint |
|---|---|---|
| meadow | Green and gold, flowers in the fur. | Hides in tall grass; heals on open ground. |
| forest | Mottled bark and leaf colours. | Ambushes from cover; roots tangle feet. |
| marsh | Mud-caked, reed-draped, bog lights. | Slows pieces in mud; spreads disease. |
| highland | Rough, rocky, wind-tough coat. | Charges downhill; resists knockback. |
| desert | Sun-bleached, dusty, heat shimmer. | Heat wears pieces down; buries on sand. |
| tomb | Dust, bandages, gold leaf, hieroglyph marks. | Curses a tile; rises again near its tomb. |
| ice | White fur, frozen mist, blue shadows. | Cold aura slows adjacent pieces. |
| volcano | Ash-black with glowing seams. | Immune to fire; leaves lava tiles. |
| coast | Salt-crusted, shell and driftwood. | Tide pushes pieces; strong near water. |
| sea | Deep blue, finned, barnacled. | Strikes from water tiles; drags pieces in. |
| sky | Winged, feathered, cloud-wreathed. | Flies over blockers; dives from above. |
| underworld | Pale, chained, lit by cold fire. | Drains life; brings darkness. |
| city / ruins | Masonry, rubble, lantern light. | Climbs walls; brings ruins down on a tile. |

**Rule for the rest.** Monsters without a Variants row take the axes above by this rule alone. Real animals (kind `animal`) take element, rank and biome values freely; their state variants are best limited to skeleton, ghost, giant, swarm and armoured.

## Variants

Named variants for the most familiar and most useful base monsters (familiarity ①–③). Tags: **(folklore)** a real mythic or traditional sub-type or relative; **(real)** a real animal; **(game variant)** invented here, using the axes above. Lore notes are one line each; a "relative" is a separate creature that works as a variant in play.

### Dragons and serpents

| Base | Variants |
|---|---|
| Dragon (Saint George's) | **Wyvern** (folklore): two-legged winged dragon of heraldry · **Drake** (folklore): lesser or wingless dragon, from Latin draco · **Wyrm** (folklore): wingless serpent-dragon of Old English and Norse tales · **Amphiptere** (folklore): winged legless serpent of heraldry · **Hydra-kin** (game variant): many-headed dragon · **Fire dragon** (game variant): flame breath, magma lair · **Frost dragon** (game variant): ice breath, slows tiles · **Skeleton dragon** (game variant): bone dragon that revives once |
| Long | **Tianlong** (folklore): celestial dragon that guards the heavens · **Shenlong** (folklore): spirit dragon of rain and wind · **Dilong** (folklore): earth dragon of rivers and seas · **Fucanglong** (folklore): dragon of buried treasure · **Yinglong** (folklore): winged dragon of the Yellow Emperor's wars · **Jiaolong** (folklore): scaled flood dragon · **Panlong** (folklore): coiled water dragon that has not yet ascended |
| Zmey Gorynych | **Three-headed zmey** (folklore): the usual form, breathes fire · **Many-headed zmey** (folklore): six, nine or twelve heads in some tellings · **Tugarin Zmeyevich** (folklore): dragon-born human-shaped foe of the heroes · **Chudo-Yudo** (folklore): many-headed water monster of Russian tales · **Frost zmey** (game variant): winter breath |
| Hydra of Lerna | **Nine-headed hydra** (folklore): one head immortal · **Fifty-headed hydra** (folklore): the count given by some ancient poets · **Venom hydra** (game variant): poison breath, heads regrow · **Frost hydra** (game variant): frozen heads shatter · **Hydra-spawn** (game variant): swarm of small heads |
| Yamata no Orochi | **Sword-tail orochi** (folklore): the Kusanagi sword was found in its tail · **Sake-drunk orochi** (folklore): lured by eight vats of sake · **Storm orochi** (game variant): lightning along the necks · **Flood orochi** (game variant): river swells with its coils · **Orochi whelp** (game variant): one-headed young |
| Jörmungandr | **Sjøorm** (folklore): Scandinavian sea serpent · **Venom-spewing Jörmungandr** (folklore): poisons Thor at Ragnarök · **Tide serpent** (game variant): raises waves on coastal tiles · **Frost sea-worm** (game variant): ice-armoured coils · **Elder world-serpent** (game variant): boss form |
| Lindworm | **Lindorm** (folklore): Scandinavian legless dragon · **Lambton Worm** (folklore): English worm that coiled round a hill · **Laidly Worm of Spindleston Heugh** (folklore): a princess turned worm · **Tatzelwurm** (folklore): stub-legged Alpine worm · **Frost lindworm** (game variant): snow-burrowing form |
| Wyvern | **Heraldic wyvern** (folklore): the coat-of-arms form with a barbed tail · **Venom wyvern** (game variant): stinging tail · **Storm wyvern** (game variant): lightning dives · **Bone wyvern** (game variant): skeleton form · **Wyvern whelp** (game variant): young, flies in pairs |
| Basilisk | **Cockatrice** (folklore): cock-headed relative, hatched from a cock's egg · **Libyan basilisk** (folklore): desert form in Pliny, scorches plants as it passes · **Basilisk of Vienna** (folklore): city well legend of 1212 · **Stone-gaze basilisk** (game variant): petrifies a tile · **Sand basilisk** (game variant): buries then strikes |
| Cockatrice | **Basilisk** (folklore): serpent-king relative · **Cock-egg hatchling** (folklore): hatched by a toad from a cock's egg · **Plague cockatrice** (game variant): breath spreads disease · **Stone cockatrice** (game variant): touch petrifies · **Cockatrice flock** (game variant): lesser swarm |
| Nile crocodile | **Sacred crocodile** (folklore): temple crocodile of Sobek's cult · **Crocodile mummy** (folklore): sacred crocodiles were mummified · **Gharial** (real): long-snouted river crocodilian · **Armoured crocodile** (game variant): plated hide · **Swamp crocodile** (game variant): ambush from marsh tiles |
| Snake (Si) | **Uraeus cobra** (folklore): the rearing cobra of Egyptian crowns · **Amphisbaena** (folklore): two-headed serpent of the bestiaries · **Horned viper** (real): desert viper with brow horns · **King cobra** (real): snake-eating giant cobra · **Shahmaran** (folklore): Anatolian queen of snakes · **Giant constrictor** (game variant): crushes a tile |
| Feathered serpent (Teotihuacan) | **Xiuhcoatl** (folklore): Aztec fire serpent · **Yacumama** (folklore): Amazonian mother-of-water serpent · **Sachamama** (folklore): Andean forest serpent · **Amaru** (folklore): Andean two-headed serpent of water and earth · **Storm feathered serpent** (game variant): rain and thunder coils |

### Undead and ghosts

| Base | Variants |
|---|---|
| Mummy | **Animal mummy** (folklore): cats, ibises and crocodiles were mummified · **Priest mummy** (game variant): casts curses · **Pharaoh mummy** (game variant): elder boss, gold-wrapped · **Sand mummy** (game variant): rises out of dunes · **Scarab-filled mummy** (game variant): bursts into beetles |
| Draugr | **Haugbui** (folklore): barrow-dweller that guards its mound · **Aptrgangr** (folklore): Old Norse "again-walker" revenant · **Draugen** (folklore): drowned sailor-ghost of Norway · **Frost draugr** (game variant): frozen corpse, cold aura · **Draugr jarl** (game variant): alpha with an honour guard |
| Jiangshi | **Hopping corpse** (folklore): stiff-legged hopper that tracks breath · **Talisman-bound jiangshi** (folklore): a yellow paper charm holds it still · **Green-furred jiangshi** (folklore): older corpse with mould-like fur, in later tellings · **Frozen jiangshi** (game variant): ice-coated corpse · **Armoured jiangshi** (game variant): in rotted official's armour |
| Ghoul | **Ghulah** (folklore): female ghoul that lures travellers · **Qutrub** (folklore): Arab ghoul-like night prowler · **Si'lat** (folklore): shape-shifting female desert monster · **Sand ghoul** (game variant): digs under tiles · **Ghoul pack** (game variant): swarm of lesser ghouls |
| Upyr | **Strzyga** (folklore): Polish two-souled vampire-witch · **Vukodlak** (folklore): Balkan wolf-vampire · **Vrykolakas** (folklore): Greek vampire revenant · **Vampire lord** (game variant): alpha with bat swarm · **Winged upyr** (game variant): bat-form attacker |
| Banshee | **Bean-nighe** (folklore): washerwoman at the ford · **Caoineag** (folklore): Scottish weeping spirit of waterfalls · **Keening banshee** (game variant): shriek stuns · **Banshee queen** (game variant): elder with a wailing host |
| Cheonyeo Gwisin | **Dalgyal Gwisin** (folklore): the faceless egg ghost · **Mul Gwisin** (folklore): water ghost that drags swimmers · **Chonggak Gwisin** (folklore): ghost of an unmarried young man · **Frost gwisin** (game variant): cold-wraith form |
| Dullahan | **Coiste Bodhar** (folklore): the black death-coach · **Headless Horseman** (folklore): American legend of Sleepy Hollow · **Dullahan lord** (game variant): alpha leading a coach · **Spectral dullahan** (game variant): ghost form |
| Black Shuck | **Barghest** (folklore): Yorkshire spectral hound · **Gytrash** (folklore): northern English shape-shifting omen · **Padfoot** (folklore): Yorkshire white or black dog · **Church grim** (folklore): guardian dog of the churchyard · **Hellhound** (folklore): general name for fiery black dogs · **Cù-sìth** (folklore): green fairy hound of Scotland |

### Giants, ogres and demons

| Base | Variants |
|---|---|
| Oni | **Aka-oni** (folklore): red oni · **Ao-oni** (folklore): blue oni · **Ushi-oni** (folklore): bull-headed oni of the coast · **Hannya** (folklore): female oni from Noh masks · **Shuten-dōji** (folklore): oni chieftain of Mount Ōe · **Ibaraki-dōji** (folklore): his lieutenant · **Fire oni** (game variant): iron club glows · **Frost oni** (game variant): snow-country oni |
| Troll | **Mountain troll** (folklore): giant of the hills · **Bridge troll** (folklore): tollkeeper under a bridge · **Sun-stone troll** (folklore): turns to stone in sunlight · **Grýla** (folklore): Icelandic troll-hag · **Cave troll** (game variant): armoured club-wielder · **Frost troll** (game variant): heals in cold |
| Jötunn | **Hrímþurs** (folklore): frost giant · **Bergrisi** (folklore): mountain giant · **Fire giant** (folklore): Muspell's host · **Stone giant** (game variant): boulder thrower · **Sea giant** (game variant): wave-raiser |
| Cyclops | **Hesiodic Cyclops** (folklore): Arges, Brontes and Steropes, smiths of Zeus · **Polyphemus** (folklore): man-eating shepherd of the Odyssey · **Tepegöz** (folklore): Turkic one-eyed ogre · **Forge cyclops** (game variant): fire hammer · **Stone cyclops** (game variant): boulder skin |
| Rakshasa | **Brahmarakshasa** (folklore): learned rakshasa, ghost of a scholar · **Rakshasi** (folklore): female rakshasa · **Deer-form rakshasa** (folklore): Maricha lured Sita as a golden deer · **Night rakshasa** (folklore): grows stronger after dusk · **Shadow rakshasa** (game variant): vanishes in darkness |

### Shapeshifters and tricksters

| Base | Variants |
|---|---|
| Kitsune | **Zenko** (folklore): benevolent white fox · **Nogitsune** (folklore): wild, malicious fox · **Tenko** (folklore): celestial fox of a thousand years · **Kuko** (folklore): sky fox · **Kitsune-bi** (folklore): fox-fire lights · **Fire kitsune** (game variant): flame tails · **Storm kitsune** (game variant): lightning tails |
| Jiuweihu | **Huli jing** (folklore): Chinese fox spirit · **Gumiho** (folklore): Korean nine-tailed fox that eats livers · **Hồ ly tinh** (folklore): Vietnamese fox spirit · **Tamamo-no-Mae** (folklore): Japanese court fox · **Daji** (folklore): fox spirit queen of the Investiture of the Gods · **Fox of Qingqiu** (folklore): nine-tailed fox of the Classic of Mountains and Seas |
| Tanuki | **Bunbuku Chagama** (folklore): the tea-kettle tanuki · **Mujina** (folklore): faceless-trick badger, in Lafcadio Hearn's tale · **Tanuki-bayashi** (folklore): night drumming in the woods · **Autumn tanuki** (game variant): leaf-magic decoys · **Tanuki mob** (game variant): swarm of cubs |
| Loup-garou | **Rougarou** (folklore): Louisiana swamp werewolf · **Lycaon's wolf** (folklore): Greek king cursed into a wolf · **Wolf-belt werewolf** (folklore): changes by donning a wolf-skin belt · **Frost werewolf** (game variant): snow-pack hunter · **Shadow werewolf** (game variant): night-only form · **Werewolf alpha** (game variant): rank leader |
| Selkie | **Roane** (folklore): Irish and Scottish seal-folk · **Finfolk** (folklore): Orkney shape-shifting sea sorcerers · **Storm selkie** (game variant): wave-riding · **Selkie elder** (game variant): bargains for pelts |
| Kelpie | **Each-uisge** (folklore): sea-loch water-horse, deadlier than the kelpie · **Nuggle** (folklore): Shetland water-horse · **Nuckelavee** (folklore): Orkney horse-man horror · **Ceffyl Dŵr** (folklore): Welsh water horse · **Bäckahäst** (folklore): Scandinavian brook horse · **Frost kelpie** (game variant): ice-bound loch |
| Leprechaun | **Cluricaun** (folklore): wine-cellar sprite · **Far Darrig** (folklore): red-coated prankster · **Gancanagh** (folklore): love-talker of the glens · **Leprechaun king** (game variant): alpha with gold decoys |
| Brownie | **Boggart** (folklore): hearth spirit turned spiteful · **Hob** (folklore): northern English household spirit · **Kobold** (folklore): German house or mine spirit · **Nisse** (folklore): Scandinavian farm spirit · **Domovoi** (folklore): Slavic house spirit · **Tonttu** (folklore): Finnish house elf |
| Dvergr | **Svartálfar** (folklore): dark elves of the Eddas · **Duergar** (folklore): Scots-English dwarves of the hills · **Knocker** (folklore): Cornish mine spirit · **Tommyknocker** (folklore): miner's ghost-sprite · **Kobold** (folklore): German mine spirit · **Armoured dvergr** (game variant): plated forgemaster |

### Water-folk and sea monsters

| Base | Variants |
|---|---|
| Kappa | **Kawataro** (folklore): eastern Japanese name for river imps · **Hyōsube** (folklore): Kyushu river imp · **Suiko** (folklore): Chinese-derived water tiger · **Sea kappa** (game variant): coastal form with a shell · **Frost kappa** (game variant): dish frozen, sluggish |
| Rusalka | **Mavka** (folklore): Ukrainian forest nymph, hollow-backed · **Vila** (folklore): Balkan mountain nymph · **Drowned-maiden rusalka** (folklore): spirit of a drowned girl · **Frost rusalka** (game variant): freezes ponds · **Swamp rusalka** (game variant): bog-light lure |
| Siren | **Bird-bodied siren** (folklore): the Homeric form · **Fish-tailed siren** (folklore): later medieval form, the mermaid · **Mermaid** (folklore): general sea-woman · **Storm siren** (game variant): song summons squalls · **Shadow siren** (game variant): lures into the dark |
| Dryad | **Hamadryad** (folklore): bound to one tree · **Meliad** (folklore): ash-tree nymph · **Naiad** (folklore): spring and river nymph · **Oread** (folklore): mountain nymph · **Nereid** (folklore): sea nymph · **Oceanid** (folklore): daughter of Oceanus |
| Taniwha | **Kaitiaki taniwha** (folklore): guardian of a tribe's waters · **Ngārara** (folklore): lizard or reptile monsters of Māori lore · **Marakihau** (folklore): fish-tailed taniwha with a tubular tongue · **Te Wheke-a-Muturangi** (folklore): giant octopus chased by Kupe · **Hostile taniwha** (folklore): man-eater of a cave or river |
| Kraken | **Hafgufa** (folklore): Norse island-whale · **Lyngbakr** (folklore): whale mistaken for an island · **Aspidochelone** (folklore): bestiary whale-island · **Giant squid** (real): deep-sea cephalopod · **Kraken whelp** (game variant): tentacle swarm · **Elder kraken** (game variant): boss with grasping arms |
| Loch Ness Monster (Nessie) | **Champ** (folklore): Lake Champlain monster · **Ogopogo** (folklore): Okanagan Lake monster · **Morag** (folklore): Loch Morar monster · **Storsjöodjuret** (folklore): Swedish Storsjön lake monster · **Cadborosaurus** (folklore): Pacific coast sea serpent |

### Birds and winged beasts

| Base | Variants |
|---|---|
| Roc (Rukh) | **Elephant-lifting roc** (folklore): Sinbad's roc · **Madagascar roc** (folklore): Marco Polo's account · **Anqa** (folklore): Arab great bird · **Simurgh** (folklore): Persian healing bird · **Storm roc** (game variant): thunder wings · **Skeleton roc** (game variant): bone bird |
| Phoenix | **Fenghuang** (folklore): Chinese phoenix · **Bennu** (folklore): Egyptian heron-bird of rebirth · **Firebird** (folklore): Slavic Zhar-ptitsa · **Simurgh** (folklore): Persian relative · **Ash phoenix** (game variant): rises from cinders · **Frost phoenix** (game variant): ice-feathered · **Shadow phoenix** (game variant): reborn from darkness |
| Griffin (Gryps) | **Hippogriff** (folklore): griffin-horse of Ariosto · **Opinicus** (folklore): heraldic lion, eagle and camel blend · **Gold-guarding griffin** (folklore): guards Scythian gold · **Fire griffin** (game variant): ember-feathered diver · **Storm griffin** (game variant): thunder cry |
| Harpy | **Aello** (folklore): "storm-wind", a named harpy · **Celaeno** (folklore): harpy who prophesies to Aeneas · **Podarge** (folklore): harpy mother of Achilles' horses · **Stymphalian bird** (folklore): bronze-feathered man-eater · **Storm harpy** (game variant): gale wings · **Shadow harpy** (game variant): night raider |
| Pegasus | **Tulpar** (folklore): Turkic winged horse · **Winged horse** (folklore): general · **Storm pegasus** (game variant): lightning hooves · **Skeleton pegasus** (game variant): revives once · **Star pegasus** (game variant): light mane |
| Karasu-tengu | **Daitengu** (folklore): long-nosed, red-faced tengu · **Konoha-tengu** (folklore): leaf tengu · **Sōjōbō** (folklore): Kurama's tengu king · **Yamabushi tengu** (folklore): mountain-ascetic tengu · **Storm tengu** (game variant): wind fan |

### Constructs and guardians

| Base | Variants |
|---|---|
| Gargoyle | **Gargouille** (folklore): Rouen dragon that gave gargoyles their name · **Grotesque** (folklore): non-spout carved creature · **Chimère** (folklore): Notre-Dame winged beasts · **Crystal gargoyle** (game variant) · **Ruin gargoyle** (game variant): crumbles when slain |
| Komainu | **Shisa** (folklore): Okinawan lion-dog · **Foo dog** (folklore): Chinese guardian lion · **Singha** (folklore): Thai guardian lion · **A-un pair** (folklore): open- and closed-mouth statues · **Iron komainu** (game variant): metal guardian · **Living statue** (game variant): wakes when approached |
| Golem | **Clay golem** (folklore): the Prague golem legend · **Talos** (folklore): bronze giant of Crete · **Stone golem** (game variant): slow and sturdy · **Clockwork golem** (game variant): fixed pattern · **Crystal golem** (game variant): shatters into shards · **Wood golem** (game variant): weak to fire |
| Ushabti | **Worker shabti** (folklore): tomb servant figure · **Overseer shabti** (folklore): carries a whip, leads workers · **Sand ushabti** (game variant) · **Gilded ushabti** (game variant) |
| Sphinx | **Androsphinx** (folklore): human-headed lion · **Criosphinx** (folklore): ram-headed · **Hieracosphinx** (folklore): falcon-headed · **Greek sphinx** (folklore): winged woman-lion that poses riddles · **Sand sphinx** (game variant): buries a tile · **Tomb sphinx** (game variant): riddle curse |

### Hybrids, beast-men and fantastic beasts

| Base | Variants |
|---|---|
| Minotaur | **Asterion** (folklore): the Minotaur's given name · **Cretan Bull** (folklore): sire of the Minotaur · **Bull of Heaven** (folklore): Mesopotamian bull sent against Gilgamesh · **Kusarikku** (folklore): Mesopotamian bull-man · **Stone minotaur** (game variant): armoured charger · **Minotaur chieftain** (game variant): alpha |
| Centaur | **Onocentaur** (folklore): donkey-centaur of the bestiaries · **Ichthyocentaur** (folklore): fish-tailed centaur · **Polkan** (folklore): Russian dog-bodied centaur · **Chiron** (folklore): wise teacher centaur · **Centaur archer** (game variant): alpha |
| Satyr | **Silenus** (folklore): old satyr and tutor of Dionysus · **Faun** (folklore): Roman goat-legged woodland spirit · **Sileni** (folklore): early horse-legged form · **Satyr piper** (game variant): charming tune · **Satyr elder** (game variant): druidic leader |
| Chimera | **Nue** (folklore): Japanese monkey-tanuki-tiger-snake blend · **Manticore** (folklore): Persian man-lion-scorpion · **Fire-breathing chimera** (folklore): Homer's Chimera breathes fire · **Chimera whelp** (game variant): young, three small heads · **Stone chimera** (game variant): temple guardian |
| Manticore | **Martichora** (folklore): Ctesias' original form · **Leucrota** (folklore): swift bestiary beast with a badger-like mouth · **Crocotta** (folklore): hyena-dog that mimics voices · **Desert manticore** (game variant): hides in dunes · **Shadow manticore** (game variant): night hunter |
| Unicorn | **Karkadann** (folklore): Persian rhinoceros-unicorn · **Monoceros** (folklore): Pliny's boar-footed, elephant-footed one-horn · **Indian wild ass** (folklore): Ctesias' one-horned ass · **Narwhal** (real): tusk sold as unicorn horn · **Dark unicorn** (game variant): corrupted form · **Unicorn foal** (game variant): fast and fragile |
| Qilin | **Kirin** (folklore): Japanese form · **Girin** (folklore): Korean form · **Kỳ lân** (folklore): Vietnamese form · **Xiezhi** (folklore): one-horned judge beast · **Fire qilin** (game variant): flame mane · **Frost qilin** (game variant): ice hooves |
| Pixiu | **Tianlu** (folklore): one-horned pixiu · **Bixie** (folklore): two-horned pixiu · **Winged lion** (folklore): general · **Gold pixiu** (game variant): drops coins · **Stone pixiu** (game variant): statue form |
| Yeti | **Almas** (folklore): Central Asian wild man · **Yeren** (folklore): Chinese wild man · **Migoi** (folklore): Tibetan name for wild snowmen · **Ice yeti** (game variant): frost aura · **Yeti elder** (game variant): hoary boss |
| Bigfoot (Sasquatch) | **Skunk Ape** (folklore): southern US swamp cryptid · **Fouke Monster** (folklore): Arkansas cryptid · **Momo** (folklore): Missouri cryptid · **Orang Pendek** (folklore): small ape-man of Sumatra · **Bigfoot alpha** (game variant) |
| Chupacabra | **Texas chupacabra** (folklore): hairless coyote-like form · **Goatsucker** (folklore): literal name from Puerto Rico · **Moca chupacabra** (folklore): Puerto Rican form of 1975 · **Chupacabra pup** (game variant) |
| Jackalope | **Wolpertinger** (folklore): Bavarian horned hybrid · **Skvader** (folklore): Swedish hare-grouse of 1918 · **Rasselbock** (folklore): Thuringian antlered hare · **Horned hare** (folklore): historic hoax · **Storm jackalope** (game variant) |

### Cats, hounds and beasts

| Base | Variants |
|---|---|
| Cerberus | **Orthrus** (folklore): two-headed brother · **Garmr** (folklore): Norse blood-stained hound · **Cŵn Annwn** (folklore): hounds of Annwn · **Hellhound** (folklore): general fire-dog · **Cerberus pup** (game variant): three small heads · **Frost cerberus** (game variant): ice breath |
| Wolf | **Dire wolf** (real): large extinct wolf · **Warg** (folklore): Old Norse vargr, outlaw-wolf · **Sköll and Hati** (folklore): sky-chasing wolves · **Fenrir** (folklore): great wolf of Ragnarök · **Winter wolf** (game variant): frost breath · **Shadow wolf** (game variant): hides in dark |
| Bakeneko | **Nekomata** (folklore): forked-tail cat · **Kasha** (folklore): cat that steals corpses · **Cat sìth** (folklore): Scottish black cat fairy · **Cath Palug** (folklore): Welsh monster cat · **Fire bakeneko** (game variant) |
| Tiger (Yin) | **Siberian tiger** (real): largest tiger · **Bengal tiger** (real) · **Smilodon** (real): sabre-toothed cat · **Jangsan-beom** (folklore): Korean mountain tiger · **Weretiger** (folklore): tiger-shifter of Southeast Asia · **Frost tiger** (game variant) |
| Jaguar | **Balam** (folklore): Maya jaguar guardians · **Nahual** (folklore): Mesoamerican jaguar shape-shifter · **Olmec were-jaguar** (folklore): human-jaguar figure · **Black jaguar** (real) · **Jaguar warrior** (game variant): armoured elite |
| Erymanthian Boar | **Calydonian Boar** (folklore): sent by Artemis · **Twrch Trwyth** (folklore): Welsh king turned boar · **Gullinbursti** (folklore): Freyr's golden-bristled boar · **Wild boar** (real) · **Armoured boar** (game variant) |
| Horse (Wu) | **Sleipnir** (folklore): Odin's eight-legged horse · **Mares of Diomedes** (folklore): man-eating mares · **Rakhsh** (folklore): Rostam's steed · **Tarpan** (real): extinct wild horse · **Skeleton horse** (game variant) |
| Red deer | **White hart** (folklore): ghostly stag · **Ceryneian Hind** (folklore): golden-horned hind · **Hiiden hirvi** (folklore): Finnish demon elk · **Megaloceros** (real): giant Irish elk · **Shadow stag** (game variant) |
| Brown bear | **Cave bear** (real) · **Short-faced bear** (real): giant ice-age bear · **Spectacled bear** (real) · **Berserker** (folklore): bear-shirt Norse warrior · **Armoured bear** (game variant) · **Frost bear** (game variant) |

### Spiders, insects and monsters of the night

| Base | Variants |
|---|---|
| Jorōgumo | **Tsuchigumo** (folklore): giant earth spider · **Anansi** (folklore): West African spider trickster · **Cave spider** (game variant) · **Venom weaver** (game variant): web poison · **Spider swarm** (game variant) |
| Scarab beetle | **Khepri** (folklore): dawn scarab · **Dung scarab** (real): the sacred beetle · **Scarab swarm** (game variant) · **Gold scarab** (game variant): drops treasure |
| Scorpio (Scorpion) | **Serket** (folklore): scorpion protector of Egypt · **Girtablullu** (folklore): Mesopotamian scorpion-man · **Deathstalker** (real): venomous desert scorpion · **Sand scorpion** (game variant) · **Giant scorpion** (game variant) |
| Rokurokubi | **Nukekubi** (folklore): head that flies off at night · **Penanggalan** (folklore): Malay flying head with entrails · **Phi Krasue** (folklore): Thai glowing head · **Manananggal** (folklore): Filipino split-body flier · **Shadow rokurokubi** (game variant) |
| Aswang | **Manananggal** (folklore): upper body detaches · **Wak-wak** (folklore): bird-form aswang · **Sigbin** (folklore): goat-like blood-sucker · **Tiyanak** (folklore): baby impostor · **Aswang pack** (game variant) |
| Pontianak | **Kuntilanak** (folklore): Indonesian form · **Langsuir** (folklore): Malay long-haired spirit · **Matianak** (folklore): stillborn-child spirit · **Sundel Bolong** (folklore): Indonesian ghost with a hole in her back · **Pocong** (folklore): shrouded corpse |
| Camazotz | **Vampire bat** (real) · **Giant bat** (game variant) · **Bat swarm** (game variant) · **Ahool** (folklore): Javan giant bat cryptid · **Death-bat elder** (game variant) |
| Yuki-onna | **Tsurara-onna** (folklore): icicle woman · **Yuki-warashi** (folklore): snow child · **Blizzard yuki-onna** (game variant) · **Mountain yuki-onna** (game variant) |
| Kodama | **Green Man** (folklore): foliate head of medieval carvings · **Wodewose** (folklore): wild man of the woods · **Treant** (game variant): walking tree · **Blighted kodama** (game variant) · **Elder tree-spirit** (game variant) |
| Leshy | **Leshachikha** (folklore): female leshy · **Polevik** (folklore): field spirit · **Bolotnik** (folklore): swamp spirit · **Autumn leshy** (game variant) |
| Baba Yaga | **Baba Yaga Bone-leg** (folklore): epithet in the tales · **Chicken-legged hut** (folklore): her hut on legs · **Riders of Day, Sun and Night** (folklore): servants in Vasilisa the Beautiful · **Iron-tooth Baba Yaga** (game variant): armoured hag |

## Monster families

Families cut across cultures. A region can mix cultures and still keep one mechanical identity: pick the family, then fill it with that culture's members. Each line gives a shared-trait idea, then members by culture. Names are entry names; the variant axes apply to every member.

**Dragons and great serpents.** Big hide, one signature breath or coil attack, a hoard that drops loot.
Japanese: Yamata no Orochi. Chinese: Long, Bashe, Xiangliu. Greek: Hydra of Lerna, Python, Ladon, Echidna, Typhon. Norse: Jörmungandr, Níðhöggr, Fáfnir, Lindworm. Slavic: Zmey Gorynych, Aspid. Korean: Imugi, Yong. Celtic: Ddraig Goch, White Dragon of the Saxons, Oilliphéist. Mesoamerican: Feathered serpent, Xiuhcoatl, Cipactli. Egyptian: Apep, Mehen, Nehebkau. Mesopotamian: Mušḫuššu, Bašmu, Tiamat. Persian: Zahhak, Shahmaran. Andean: Yacumama, Sachamama. African: Grootslang, Ninki Nanka, Inkanyamba. Southeast Asian: Rồng, Bakunawa, Thuồng luồng. Medieval: Dragon, Wyvern, Tarasque, Amphisbaena, Basilisk, Cockatrice. Baltic: Eglė the Queen of Serpents, Žaltys, Pūķis. Real or zodiac: Dragon (Chen), Snake (Si), King cobra, Black mamba.

**Undead and revenants.** Rise again unless the body is dealt with (fire, charm, burial).
Egyptian: Mummy. Chinese: Jiangshi. Japanese: Gashadokuro. Norse: Draugr, Haugbui, Draugen, Dead of Helheim. Slavic: Upyr, Strzyga, Vukodlak, Koschei. Celtic: Dullahan, Sluagh. Korean: Gwisin. Indian: Bhoot, Vetala, Churel, Brahmarakshasa. Southeast Asian: Pontianak, Kuntilanak, Pocong, Phi Krasue, Mae Nak, Phi Pop, Penanggalan. Mesopotamian: Edimmu. Persian: Ghoul, Qutrub. Andean: Condenado.

**Ghosts and wailing spirits.** Pass through blockers; strike with fear or cold; weak to being named or honoured.
Japanese: Noppera-bō. Korean: Cheonyeo Gwisin, Dalgyal Gwisin, Mul Gwisin, Gaeksin. Celtic: Banshee, Bean-nighe, Glaistig. Mesoamerican: La Llorona, La Lechuza. Egyptian: Ba, Medjed. Finnish: Kalma. Southeast Asian: Wewe Gombel, Hantu Air. Wild Hunt: Gabriel Hounds, Åsgårdsreia, Hellequin.

**Household and object spirits.** Live in a place or thing; helpful when fed, vicious when slighted.
Japanese: Kasa-obake, Chōchin-obake, Zashiki-warashi, Ittan-momen, Nurikabe. Slavic: Domovoi, Bannik, Ovinnik, Kikimora. Celtic: Brownie. Norse: Nisse. Finnish: Tonttu.

**Giants and ogres.** Huge, slow, throw things; fill several tiles.
Norse: Jötunn, Troll, Surtr, Hræsvelgr, Muspell's fire giants. Greek: Cyclops, Polyphemus, Laestrygonians, Atlas, Cronus. Celtic: Fomorians, Balor. Mesopotamian: Humbaba. Turkic: Tepegöz. Japanese: Oni. Indian: Rakshasa. Southeast Asian: Kapre, Bungisngis, Buto Ijo. Maya: Vucub Caquix, Zipacna, Cabrakan. Māori: Maero. Siberian: Mangus, Abaasy.

**Demons and devils.** Curses and fear instead of brute force; summoned by name.
Mesopotamian: Gallu, Lamashtu, Pazuzu, Asag, Ugallu, Uridimmu. Persian: Div, Div-e Sepid, Zahhak. Indian: Pishacha. Maya: Kisin. Finnish: Hiisi. Baltic: Velnias. Japanese: Oni.

**Goblins, imps and little folk.** Small, quick, steal or swap things; come in groups.
Celtic: Leprechaun, Redcap, Spriggan, Knocker, Fear Dearg, Púca. Korean: Dokkaebi. Finnish: Peikko, Menninkäinen, Kratti, Kaukas. Baltic: Aitvaras, Kratt. Hawaiian: Menehune. Māori: Patupaiarehe, Ponaturi. Filipino: Duwende, Tiyanak. Malay and Indonesian: Toyol, Tuyul. African: Kalanoro, Mmoatia, Tokoloshe. Norse: Dvergr. Maya: Alux. Paracelsus: Gnome.

**Shapeshifters.** Change shape when hurt or on a timer; reveal the true form when struck.
Japanese: Kitsune, Tanuki, Bakeneko, Nekomata. Chinese: Jiuweihu, Hulijing. Korean: Gumiho. Vietnamese: Hồ ly tinh. Celtic: Selkie, Merrow, Púca, Kelpie, Each-uisge. Medieval: Loup-garou, Melusine. Maya and Mesoamerican: Huay Chivo, Nahual. Filipino: Aswang. African: Anansi.

**Tricksters.** Swap places, steal an item, fake a danger; hard to pin down.
African: Anansi. Japanese: Tanuki, Kitsune, Hitotsume-kozō. Korean: Dokkaebi. Norse: Loki. Greek: Hermes. Celtic: Leprechaun, Púca. Medieval: Reynard the Fox. Maya: Hun Batz and Hun Chuen.

**Water-folk and river spirits.** Fight from water tiles; drag pieces under; fear dry ground.
Japanese: Kappa. Slavic: Rusalka, Vodyanoy, Kikimora. Norse: Näcken. Finnish: Näkki. Korean: Mul Gwisin. Celtic: Kelpie, Each-uisge, Selkie, Merrow, Blue Men of the Minch, Afanc, Ceffyl Dŵr, Gwragedd Annwn. Mesoamerican: Ahuizotl, Chaneque. Greek: Nereid, Triton. Paracelsus: Undine. Malay: Hantu Air. African: Tokoloshe. Andean: Yacumama.

**Sea monsters.** Lurk offshore, raise waves, wreck ships.
Norse: Kraken, Jörmungandr. Greek: Scylla, Charybdis, Hippocampus, Triton. Japanese: Umibōzu, Ōnamazu. Māori: Te Wheke-a-Muturangi, Marakihau, Taniwha. Finnish: Iku-Turso. Celtic: Merrow. Southeast Asian: Bakunawa. Chinese: Pulao. Modern: Cadborosaurus, Loch Ness Monster. Real: Humpback whale, Hammerhead shark, Dolphin.

**Birds and winged beasts.** Fly over blockers; dive from above; weak to wind and nets.
Japanese: Karasu-tengu, Tsuru. Chinese: Fenghuang, Kunpeng, Red-crowned crane. Slavic: Firebird, Sirin, Alkonost, Gamayun. Norse: Huginn and Muninn. Greek: Harpy, Stymphalian birds, Pegasus, Griffin. Medieval: Phoenix, Hippogriff, Caladrius, Pelican in her piety. Persian: Roc, Simurgh, Anqa, Huma. Mesopotamian: Anzû. Māori: Pouākai, Hōkioi. Korean: Samjok-o, Bonghwang, Bulgae. Filipino: Sarimanok, Philippine eagle. Thai: Hongsa. Mongol and Turkic: Khan Garid, Golden eagle, Tulpar. Andean: Andean condor. Egyptian: Bennu, Sacred ibis. African: Impundulu, Secretary bird.

**Hounds and wolves.** Hunt in packs; tracking and surround attacks.
Greek: Cerberus, Orthrus. Norse: Garmr, Sköll and Hati, Fenrir, Wolf. Slavic: Grey Wolf, Simargl. Celtic: Cú Sídhe, Cŵn Annwn, Gwyllgi, Irish wolfhound. Modern and English folklore: Black Shuck, Barghest. Japanese: Inugami. Aztec: Xoloitzcuintli, Mexican wolf, Itzcuintli. Medieval: Loup-garou. Modern: Beast of Gévaudan. Zodiac: Dog (Xu).

**Cats.** Ambush, pounce from cover, climb.
Japanese: Bakeneko, Nekomata. Celtic: Cat sìth, Cath Palug. African: Mngwa, Lion, Leopard. Greek: Nemean Lion. Egyptian: Sphinx. Maya and Aztec: Jaguar, Balam, Ocelotl (Jaguar), Olmec were-jaguar. Korean: Siberian tiger, Jangsan-beom. Indian: Bengal tiger, Asiatic lion, Snow leopard. Andean: Puma. Persian: Barbary lion. Medieval: Heraldic lion rampant. Zodiac: Tiger (Yin), Leo (Lion).

**Insects, spiders and scorpions.** Come in numbers; poison; weak to fire.
Japanese: Jorōgumo, Tsuchigumo. Egyptian: Scarab beetle, Khepri, Serket. Mesopotamian: Girtablullu. Andean: Nazca spider. African: Anansi. Zodiac: Scorpio (Scorpion).

**Plants, trees and fungi.** Rooted; regrow while the tile is green; weak to fire.
Japanese: Kodama. Greek: Dryad. Slavic: Leshy, Poludnitsa, Polevik. Norse: Skogsrå. Medieval: Wodewose. Finnish: Tapio. Aztec day signs: Malinalli, Xochitl.

**Constructs and golems.** Slow to wake, hard to hurt, follow orders.
Medieval: Golem, Gargoyle. Greek: Talos. Egyptian: Ushabti. Japanese: Komainu. Mesoamerican: Alebrije, Chac Mool. Mesopotamian: Lamassu, Shedu. Zodiac: Libra (Scales).

**Guardian beasts.** Block a gate or hoard; harmless until approached.
Japanese: Komainu. Chinese: Pixiu, Xiezhi, Bixi. Korean: Haetae. Mesopotamian: Lamassu, Shedu, Kusarikku. Egyptian: Sphinx, Serpopard. Medieval: Gargoyle. Southeast Asian: Singha, Yali.

**Chimeras and hybrids.** Mixed bodies with several attack types.
Japanese: Nue, Baku. Greek: Chimera, Sphinx of Thebes, Siren, Harpy, Griffin. Mesopotamian: Kusarikku, Mušmaḫḫu, Ugallu. Persian: Manticore, Nasnas. Medieval: Manticore, Leucrota, Bonnacon, Hippogriff, Cynocephalus, Blemmyae, Sciapod. Indian: Purushamriga, Kinnara, Yali. Modern: Jackalope.

**Beast-men and wild men.** Upright, strong, shy; live at the edge of settlements.
Greek: Centaur, Satyr, Minotaur, Pan. Medieval: Cynocephalus, Blemmyae, Sciapod, Wodewose. Modern: Bigfoot, Yeti, Skunk Ape, Orang Pendek. Turkic: Almas. Maya: Sisimito. Modern: Mapinguari.

**Hags, witches and lures.** Seduce or deceive; the true form is a trap.
Slavic: Baba Yaga, Mavka. Japanese: Jorōgumo, Yuki-onna, Rokurokubi, Tamamo-no-Mae. Greek: Medusa, Lamia, Empusa, Circe, Stheno, Euryale, Graeae, Siren. Mesopotamian: Lamashtu. Finnish: Louhi. Maya: Xtabay. Filipino: Manananggal. Indian: Chudail. Celtic: Glaistig, Gwragedd Annwn. Norse: Huldra. Medieval: Melusine.

**Elementals and storm beasts.** Bring weather or fire; strongest in their element.
Japanese: Raijū, Kamaitachi. Chinese: Bifang, Kui. African: Impundulu. Norse: Surtr, Hræsvelgr. Aztec: Xiuhcoatl. Paracelsus: Salamander, Gnome, Undine, Sylph. Medieval: Salamander. Māori: Hōkioi.

**Horned and hoofed beasts.** Charge, trample, move in herds.
Greek: Pegasus, Erymanthian Boar, Cretan Bull, Ceryneian Hind, Mares of Diomedes, Ram Chrysomallos. Norse: Sleipnir, Gullinbursti, Tanngrisnir and Tanngnjóstr, Auðumbla, Reindeer. Slavic: Sivka-Burka, Indrik, Wisent. Celtic: Twrch Trwyth, Red deer. Finnish: Hiiden hirvi, Eurasian elk. Chinese: Qilin. Persian: Karkadann, Rakhsh. Medieval: Unicorn, White hart, Yale. Turkic: Tulpar, Saiga antelope. Mesopotamian: Bull of Heaven, Aurochs. Modern: Jackalope.

**Death omens and psychopomps.** Announce or collect the dead; heard before seen.
Celtic: Banshee, Bean-nighe, Dullahan. English: Black Shuck. Korean: Jeoseung Saja. Greek: Charon, Thanatos, Hypnos. Norse: Norns. Norse: Valkyrie.

**Lake monsters and cryptids.** Sightings only; appear then vanish.
Modern: Loch Ness Monster, Champ, Ogopogo, Cadborosaurus, Altamaha-ha, Mokele-mbembe, Ropen, Kongamato, Ahool, Mothman, Jersey Devil, Chupacabra, Owlman, Flatwoods Monster, Dover Demon, Fresno Nightcrawler, Hodag, Beast of Bodmin Moor, Mongolian Death Worm, Thylacine survivals.

**Swarms and vermin.** Many weak bodies; split when hit.
Zodiac: Rat (Zi). Egyptian: Scarab beetle. Greek: Stymphalian birds. Celtic: Sluagh. Andean: Guinea pig (cuy), Viscacha. Norse: Dead of Helheim. Wild Hunt: Gabriel Hounds, Åsgårdsreia.

**Real beasts.** Plain animals with no magic; fillers and herd monsters, usually grouped by habitat in the terrain index.
Examples by culture: Polar bear, Wolverine, Brown bear (Norse and Slavic); Siberian tiger, Magpie (Korean); African elephant, Hippopotamus, Spotted hyena, Gorilla (African and Egyptian); Komodo dragon, Orangutan (Southeast Asian); Kiwi, Green sea turtle (Polynesian); Llama, Alpaca, Vicuña (Andean); Yak, Bactrian camel, Mammoth (Mongol and Turkic); Dromedary camel, Arabian horse (Persian and Arabian).

**Celestial figures.** Time-bound; strongest at a fixed hour or phase; also useful as set bosses.
Western zodiac signs (12), Chinese zodiac animals (12), 28 Lunar Mansions (28), Planets and their mythic namesakes (10).

**Gods as bosses (🟢 only).** Boss tier with two phases; only the low-sensitivity pantheons remain.
Egyptian: Ra, Anubis, Osiris, Isis, Horus, Sekhmet, Set, Thoth, Hathor, Bes. Greek: Zeus, Poseidon, Hades, Athena, Apollo, Artemis, Ares, Hecate. Norse: Thor, Odin, Loki, Freyja, Hel, Baldr. Mesopotamian: Marduk, Ishtar, Tiamat, Ereshkigal, Enki. Finnish: Ukko, Väinämöinen.

## Sensitivity research

This section records why entries were removed. Method: 18 web searches in November 2026, one per tradition or group of traditions. Findings are only as strong as the sources found; "not confirmed by search" marks a flag resting on general knowledge. Flags were 🟢 Low (no significant living worship, widely used), 🟡 Medium (living worship or revival, or past controversy) and 🔴 High (actively worshipped and protests have occurred, or depiction forbidden). All 🟡 and 🔴 entries are now removed (see "Removed for sensitivity" at the end); 🟢 entries stay.

- **Hindu (was 🔴).** In 2012 Rajan Zed and the Hindu American Foundation objected to SMITE's use of Hindu gods as combat characters; Hi-Rez kept the gods but changed Kali and Vamana. Zed later objected to Krishna in Shin Megami Tensei IV Final and to Ganesha, Hanuman, Kali, Lakshmi, Sarasvati, Shiva and Vishnu appearing as demons in SMT V. Sources: [Engadget, 2012](https://www.engadget.com/2012-06-27-religious-group-calls-for-removal-of-hindu-deities-from-hi-rezs.html); [PC Gamer](https://www.pcgamer.com/hindu-leader-requests-removal-of-dieties-from-smite-hi-rez-declines/); [GamerBraves](https://www.gamerbraves.com/hindu-politician-urges-shin-megami-tensei-to-stop-depicting-gods-as-demons/).
- **Shinto (was 🟡, Amaterasu 🔴).** No kami-specific protest found; the sensitivity is real shrines and real worship (DMM Games cancelled a shrine game in 2017; Assassin's Creed Shadows drew criticism in 2025). Amaterasu was raised to 🔴 as the imperial ancestor enshrined at Ise (a judgment beyond the search). Sources: [Anime News Network, 2017](https://fast.animenewsnetwork.com/interest/2017-09-20/dmm-games-cancels-controversial-shrine-moe-girl-project-causes-speculation/.121570); [SCMP](https://www.scmp.com/week-asia/politics/article/3303172/japanese-pm-ishiba-condemns-assassins-creed-video-game-over-cultural-disrespect-shrine).
- **Chinese folk religion, Daoism and Buddhist guardians (was 🟡).** Sun Wukong, Nezha, Guan Yu and the Dragon Kings are venerated in temples; Black Myth: Wukong (2024) drew no documented religious objection. Four Heavenly Kings and Guanyin are Buddhist figures. Source: [Sixth Tone](https://www.sixthtone.com/news/1015920).
- **Korean and Mongol/Turkic shamanism, Slavic Rodnovery, Celtic and Baltic revivals (was 🟡).** Muism, Tengrism, Rodnovery, Celtic Reconstructionism, Druidry and Romuva are living; no game controversy found. Bozkurt and Asena were flagged because the grey wolf is also a nationalist emblem (not confirmed by search).
- **Yoruba Orisha, Vodou and other African deities (was 🟡).** Orisha are worshipped in Nigeria, Cuba and Brazil; Genshin Impact drew criticism in 2024 for a character named after a Yoruba deity. Vodou figures are widely caricatured. Source: [PC Gamer](https://pcgamer.com/games/rpg/genshin-impact-voice-actors-criticize-design-of-new-character-named-after-african-deity-if-youre-going-to-use-real-world-deities-respect-them).
- **Aztec, Maya, Inca and Polynesian (was 🟡).** Nahua, Maya, Andean and Hawaiian practice continues (Pachamama offerings, Inti Raymi, Pele at Kīlauea). Criticism concerns inaccuracy and treating the cultures as dead, as in Fate/Grand Order's Aztec gods. Source: [The Warthog Report](https://warthogreport.substack.com/p/fate-grand-orders-misuse-of-aztec).
- **Zoroastrian, Judeo-Christian-Islamic and jinn (was 🟡).** Zoroastrianism is a small living faith (not confirmed by search). SMITE's studio would not use Jewish, Christian or Islamic figures; Islamic prophets and angels are excluded entirely because portraying prophets is forbidden. Jinn, the Four Horsemen, the Binsfeld demons, the Ars Goetia and Leviathan/Behemoth/Ziz were flagged 🟡. Source: [GameSpot](https://www.gamespot.com/articles/deity-based-moba-smite-will-not-use-jewish-christian-islamic-figures/1100-6384974/).
- **Kept as 🟢.** Greek, Egyptian, Norse and Mesopotamian pantheons, and Finnish Kalevala figures: no living worship of note found (small revivals exist, not confirmed by search); standard in Age of Mythology, SMITE and Fate. Avoid runes or emblems that double as hate symbols.
- **Why Native North American and Australian Aboriginal sections stay out.** Many nations restrict which stories may be told, to whom and when; some knowledge is secret or sacred, so a general bestiary cannot treat it as open folklore. Sources: [National Archives of Australia](https://www.naa.gov.au/sites/default/files/2022-09/Indigenous-cultural-sensitivities.docx); [MPR News](https://www.mprnews.org/story/2024/01/25/in-ojibwe-tradition-snow-on-the-ground-means-its-sacred-storytelling-season).

## Index by habitat / terrain

Names only, mixed across cultures and sets (picked and drawn first, then round-robin by source); each list is capped at 36 names with the unique total in brackets. Every entry carries its terrains in its table.

- **meadow** (67): Kitsune, Tanuki, Qilin, Centaur, Freyja, Poludnitsa, Satyr, Gongjak, Leprechaun (leipreachán), Hummingbird (huitzilin), Indian peafowl, Lion (ur), Lion, Alpaca, Unicorn, Žaltys (Lithuanian), Jackalope, Horse (Wu), Leo (Lion), Mares of Diomedes, Erato, Cattle of Helios, Vanir (Vanaheim), Tochtli (Rabbit), Freyr, Wisent, Magpie, Púca, Indian rhinoceros, Aurochs (rimu), African elephant, Bonnacon, Fresno Nightcrawler, Ox (Chou), Taurus (Bull), Euterpe, ...
- **forest** (166): Kitsune, Xtabay, Karasu-tengu, Tanuki, Hitotsume-kozō, Qilin, Centaur, Ratatoskr, Baba Yaga, Dokkaebi, Bai Ze, Satyr, Lindworm, Firebird (Zhar-ptitsa), Vucub Caquix, Gumiho, Leshy, Balam, Cheonyeo Gwisin, Likho, Alux, Jangsan-beom, Jorōgumo, Strzyga, Sisimito, Kodama, Huay Chivo, Baku, Cadejo, Leprechaun (leipreachán), Jaguar (ocelotl), Bengal tiger, Humbaba (Huwawa), Leopard, Kiwi, Spectacled bear, ...
- **bamboo** (4): Qiongqi, Shanxiao, Giant panda, Fenghuang
- **lake** (34): Kappa, Hydra of Lerna, Rusalka, Mul Gwisin, Jorōgumo, Vila, Red-crowned crane, Näcken, Kelpie, Axolotl, Taniwha (Māori), Hongsa (TH), Lus (Mongol), Melusine, Whooper swan, Loch Ness Monster (Nessie), Divine tortoise (Gui), Lady of the Lake, Undine, Koi / carp, Stymphalian birds, Each-uisge, Ahuizotl, Thần Kim Quy (VN), Pelican in her piety, Näkki (Finnish), Champ, Ōnamazu, Afanc, Ma da (VN), Ogopogo, Oilliphéist, Gwragedd Annwn, Vodyanoy
- **marsh** (39): Wadjet, Kappa, Hydra of Lerna, Rusalka, Imugi, Sobek, Kikimora, Red-crowned crane, Ahuizotl, Indian rhinoceros, Aurochs (rimu), Mokele-mbembe (Congo), Kōtuku (Māori), Berberoka (PH), Tarasque, Eurasian elk (moose), Skunk Ape, Acatl (Reed), Tsuru, Xiangliu, Stymphalian birds, Cipactli, Sarus crane, Bašmu, Ninki Nanka (West Africa), Pūkeko, Hantu Air (MY), Whooper swan, Kongamato, Nile crocodile, Bashe, Euphrates softshell turtle, Thuồng luồng (VN), Velnias (Lithuanian), Altamaha-ha, Sacred ibis, ...
- **river** (51): Yamata no Orochi, Sobek, Rusalka, Zipacna, Imugi, Kappa, Taweret, Yong, Mul Gwisin, Koi / carp, Näcken, Kelpie, La Llorona, Gharial, Euphrates softshell turtle, Tokoloshe (Zulu/Xhosa), Taniwha (Māori), Yacumama, Rồng (VN), Lus (Mongol), Melusine, Tuonen joutsen (Finnish), Kongamato, Dragon (Chen), Divine tortoise (Gui), Atl (Water), Bean-nighe, Enki (Ea), Mokele-mbembe (Congo), Mae Nak (TH), Yer-su (Turkic), Tarasque, Altamaha-ha, Nile crocodile, Salmon of Knowledge, Inkanyamba (Zulu), ...
- **highland** (52): Kamaitachi, Griffin (Gryps), Chimera, Nemean Lion, Reindeer, Zduhać, Red deer, Golden eagle (cuauhtli), Barbary lion, Impundulu (Zulu/Xhosa), Moa (Māori), Puma, Yak, Hippogriff, Gufihtar (Sámi), Beast of Gévaudan, Goat (Wei), Aries (Ram), Cath Palug, Yamabiko, Tyr, Púca, Rakhsh, Hōkioi (Māori), Llama, Heraldic lion rampant, Thylacine survivals, Tanngrisnir and Tanngnjóstr, Cú Sídhe, Alpaca, Bonnacon, Flatwoods Monster, Pan, Cat sìth, Guinea pig (cuy), Barghest, ...
- **mountain** (84): Karasu-tengu, Kui, Jötunn, Yuki-onna, Yamata no Orochi, Kamaitachi, Zmey Gorynych, Zipacna, Gumiho, Nian, Troll, Vila, Cabrakan, Bulgasari, Taotie, Dvergr, Jangsan-beom, Pixiu, Lindworm, Ungnyeo, Oni, Qiongqi, Jorōgumo, Bai Ze, Shanxiao, Prometheus, Ddraig Goch, Snow leopard, Simurgh, Anzû, Grootslang (South Africa), Patupaiarehe (Māori), Puma, Tikbalang (PH), Almas (Mongol), Dragon (Saint George's), ...
- **cave** (28): Cyclops (Kyklops), Troll, Camazotz, Ungnyeo, Minotaur, Dvergr, Nemean Lion, Tsuchigumo, Knocker, Chaneque, Shahmaran, Grootslang (South Africa), Tepegöz (Oghuz), Dragon (Saint George's), Menninkäinen (Finnish), Stheno, Polyphemus, Gnome, Div-e Sepid, Basilisk, Gufihtar (Sámi), Euryale, Fáfnir, Cockatrice, Echidna, Lamia, Graeae, Python
- **jungle** (41): Xtabay, Balam, Sisimito, Hun Batz and Hun Chuen, Bashe, Jaguar (ocelotl), Bengal tiger, Karkadann, African elephant, Andean cock-of-the-rock, Orangutan, Manticore, Orang Pendek, Monkey (Shen), Ocelotl (Jaguar), Quetzal, Asian elephant, Leopard, Yacumama, Javan rhinoceros, Blemmyae, Ahool, Coatl (Serpent), Olmec were-jaguar, King cobra, Gorilla, Sachamama, Ropen, Ozomahtli (Monkey), Mokele-mbembe (Congo), Chullachaqui, Mapinguari, Jaguar, Kalanoro (Madagascar), Runamula, Resplendent quetzal, ...
- **desert** (54): Wadjet, Griffin (Gryps), Sphinx, Sekhmet, Set, Khepri, Serket (Selket), Mexican wolf, Ghoul (ghūl), Lion (ur), Lion, Nazca hummingbird, Bactrian camel, Phoenix, Chupacabra, Snake (Si), Scorpio (Scorpion), Sphinx of Thebes, Coatl (Serpent), Charro Negro, Dromedary camel, Pazuzu, Ostrich, Nazca spider, Almas (Mongol), Manticore, Mongolian Death Worm, Cuetzpalin (Lizard), Arabian horse, Edimmu, Spotted hyena, Cynocephalus, Jackalope, Arabian oryx, Girtablullu, Black mamba, ...
- **oasis** (4): Bennu, Ladon, Dromedary camel, Arabian horse
- **saltflat** (0): 
- **canyon** (2): Mexican wolf, Andean fox (atoq)
- **steppe** (9): Mammoth, Horse (Wu), Bactrian camel, Golden eagle, Przewalski's horse (takhi), Saiga antelope, Tulpar (Turkic), Albasty (Turkic), Yer-su (Turkic)
- **ice** (23): Yuki-onna, Jötunn, Siberian tiger, Snow leopard, Mammoth, Wolverine, Yeti, Polar bear, Yak, Hiiden hirvi (Finnish), Reindeer, Chuchunaa (Yakut), Louhi (Finnish), Wolf, Abaasy (Yakut), Stállu (Sámi), Sköll and Hati, Mangus (Evenki), Auðumbla, Skaði, Hræsvelgr, Ullr, Fenrir
- **volcano** (10): Typhon, Surtr, Cabrakan, Chimera, Bifang, Xiuhcoatl, Salamander, Muspell's fire giants (Muspelheim), Salamander (elemental), Hephaestus
- **coast** (38): Nurikabe, Siren, Talos, Jingwei, Medusa, Harpy, Scylla, Draugen, Selkie, Cipactli, Popobawa (Zanzibar), Green sea turtle (honu), Komodo dragon (ID), Pelican in her piety, Black Shuck, Cancer (Crab), Laestrygonians, Umibōzu, Njörðr, Balor, Mngwa (Swahili coast), Hammerhead shark, Santelmo (PH), Cadborosaurus, Merrow (murúch), Taniwha (Māori), Nuckelavee, Tuatara, Each-uisge, Coconut crab, Aphrodite, Blue Men of the Minch, Marakihau (Māori), Hippocampus, Kōtuku (Māori), Nereid, ...
- **sea** (47): Kui, Siren, Alkonost, Jörmungandr, Jingwei, Poseidon, Scylla, Umibōzu, Geobuk, Selkie, Tiamat, Humpback whale, Rồng (VN), Iku-Turso (Finnish), Cadborosaurus, Pisces (Two Fishes), Pulao, Wandering Rocks (Planctae), Neptune, Shachihoko, Draugen, Merrow (murúch), Apkallu, Green sea turtle (honu), Bakunawa (PH), Eglė the Queen of Serpents (Lithuanian), Capricorn (Sea-goat), Kunpeng, Njörðr, Nuckelavee, Kulullu, Hammerhead shark, Chiwen, Dolphin, Ægir, Fomorians (Fomóire), ...
- **island** (17): Talos, Cyclops (Kyklops), Balor, Roc (Rukh), Tuatara, Komodo dragon (ID), Väinämöinen, Geryon's cattle, Polyphemus, Fomorians (Fomóire), Coconut crab, Circe, Cretan Bull, Lotus-Eaters, Orthrus, Calypso, Cattle of Helios
- **sky** (158): Karasu-tengu, Ra, Typhon, Huginn and Muninn, Alkonost, Samjok-o, Isis (Aset), Bennu, Yutu, Vucub Caquix, Pegasus, Valkyrie, Yong, Zeus, Thor, Bulgae, Harpy, Odin, Inmyeonjo, Sleipnir, Sluagh, Golden eagle (cuauhtli), Roc (Rukh), Anzû, Impundulu (Zulu/Xhosa), Pouākai (Māori), Andean condor, Manananggal (PH), Golden eagle, Phoenix, Ukko, Mothman, Dragon (Chen), Gemini (Twins), Jiao (Horn), Urania, ...
- **city** (52): Komainu, Isis (Aset), Pixiu, Athena, Loki, Haetae, Bakeneko, Thoth (Djehuty), Rokurokubi, Kasa-obake, Alebrije, Yali (Vyala), Lamassu, Singha (TH), Zilant (Tatar), Gargoyle, Fresno Nightcrawler, Libra (Scales), Suanni, Clio, Atropos, Hulijing, Owl of Athena, Mušḫuššu, Yak (TH), Golem, Bi'an, Melpomene, Clotho, Amun (Amun-Ra), Xiezhi, Nemesis, Bull of Heaven, Heraldic lion rampant, Yazi, Lachesis, ...
- **village** (110): Kitsune, Bes, Dalgyal Gwisin, Tanuki, Nurikabe, Komainu, Chōchin-obake, Hitotsume-kozō, Jiangshi, Nisse, Domovoi, Alux, Taweret, Nian, Upyr, Huay Chivo, Dokkaebi, Kikimora, Cadejo, Cheonyeo Gwisin, Bannik, Bulgasari, Likho, Strzyga, Bakeneko, Rokurokubi, Baku, Kasa-obake, Hestia, Banshee (bean sídhe), La Llorona, King cobra, Lamashtu, Anansi (Akan, Ghana), Menehune (Hawaiian), Guinea pig (cuy), ...
- **ruins** (36): Chōchin-obake, Taotie, Medusa, Koschei, Gashadokuro, Hundun, Minotaur, Banshee (bean sídhe), Feathered serpent (Teotihuacan), Rakshasa, Div, Lamassu, Nazca hummingbird, Gargoyle, Tamamo-no-Mae, Sphinx of Thebes, Tecpatl (Flint), Redcap, Chac Mool, Bhoot, Mušḫuššu, Nazca spider, Basilisk, Bixi, Ares, Spriggan, Pishacha, Shedu, Golem, Yali (Vyala), Kusarikku, Cockatrice, Brahmarakshasa, Ugallu, Amphisbaena, Uridimmu
- **tomb** (29): Anubis (Inpu), Gashadokuro, Jiangshi, Draugr, Upyr, Inmyeonjo, Sphinx, Mummy, Thoth (Djehuty), Ammit, Ushabti, Vetala, Ghoul (ghūl), Edimmu, Pocong (ID), Kalma (Finnish), Imsety, Miquiztli (Death), Haugbui, Cheonma, Pishacha, Santelmo (PH), Hapy, Duamutef, Qebehsenuef, Maat, Ba, Nephthys, Akhekh
- **underworld** (47): Anubis (Inpu), Cerberus, Jeoseung Saja, Hades, Oni, Hundun, Hel, Camazotz, Osiris, Sleipnir, Apep (Apophis), Níðhöggr, Ammit, Cŵn Annwn, Xoloitzcuintli, Shahmaran, Lamashtu, Supay, Tuonen joutsen (Finnish), Alecto, Pluto, Dead of Helheim (Hel's host), Ōnamazu, Kisin, Ereshkigal, Megaera, Charon, Xquic, Bašmu, Tisiphone, Persephone, Garmr, Gallu, Medjed, Hecate, Asag, ...

## Japanese yokai

Art set `yokai` (20 drawn). Japanese folklore; the kami were removed (see the appendix).

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Oni (鬼) | monster | ② | Ambivalent | Horned, iron-club-wielding ogre of Japanese folklore, often a demon of hell or the northeast "demon gate". | mountain, underworld | ○ ◆ | – |
| Kitsune (狐) | spirit | ② | Ambivalent | Fox spirit that gains tails and magic with age and can take human form; messenger of Inari. | forest, meadow, village | ★ ◆ | – |
| Tsuru (鶴) | animal | ② | Benevolent | Red-crowned crane, a symbol of longevity and fidelity. | marsh, meadow |  | – |
| Kappa (河童) | spirit | ③ | Ambivalent | River imp with a water-filled dish on its head; drowns careless swimmers, loves cucumbers, must be polite. | river, lake, marsh | ○ ◆ | – |
| Karasu-tengu (烏天狗) | spirit | ③ | Ambivalent | Crow-beaked mountain goblin, martial-arts master and trickster of the peaks. | mountain, forest, sky | ★ ◆ | – |
| Tanuki (狸) | beast | ③ | Ambivalent | Shape-shifting raccoon dog famed for leaf-magic and a belly drum. | forest, meadow, village | ★ ◆ | – |
| Bakeneko (化け猫) | spirit | ③ | Ambivalent | Cat that grows into a shape-shifting, speaking, sometimes corpse-animating ghost cat. | village, city | ○ | – |
| Nurikabe (塗り壁) | spirit | ③ | Ambivalent | Invisible wall that blocks travellers on dark roads at night. | village, coast | ★ ◆ | – |
| Yuki-onna (雪女) | spirit | ③ | Malevolent | Pale snow woman who appears in blizzards and freezes travellers. | ice, mountain | ★ ◆ | – |
| Rokurokubi (ろくろ首) | spirit | ③ | Malevolent | Woman whose neck stretches at night, often unaware of it herself. | village, city | ○ | – |
| Jorōgumo (女郎蜘蛛) | monster | ③ | Malevolent | Spider that becomes a seductive woman to trap men in its web. | forest, lake, mountain | ○ ◆ | – |
| Kodama (木霊) | spirit | ③ | Ambivalent | Spirit that dwells in old trees; felling its tree brings misfortune. | forest | ○ ◆ | – |
| Komainu (狛犬) | construct | ③ | Benevolent | Paired lion-dog statues guarding shrine gates. | village, city | ★ ◆ | – |
| Baku (獏) | beast | ③ | Benevolent | Tapir-like chimera that eats nightmares. | village, forest | ○ ◆ | – |
| Yamata no Orochi (八岐大蛇) | monster | ③ | Malevolent | Eight-headed, eight-tailed serpent slain by Susanoo in the Kojiki. | river, mountain | ★ ◆ | – |
| Nue (鵺) | monster | ③ | Malevolent | Chimera with a monkey's face, tanuki body, tiger limbs and snake tail; its cry brings illness. | forest, sky |  | – |
| Nekomata (猫又) | spirit | ③ | Ambivalent | Cat with a forked tail, an elder form of the bakeneko of mountain lore. | mountain, forest |  | – |
| Kasa-obake (傘お化け) | spirit | ④ | Ambivalent | Aged umbrella that comes alive with one eye and one leg (a tsukumogami). | village, city | ○ ◆ | – |
| Chōchin-obake (提灯お化け) | spirit | ④ | Ambivalent | Old paper lantern come alive, with a gaping mouth and lolling tongue. | village, ruins | ★ ◆ | – |
| Hitotsume-kozō (一つ目小僧) | spirit | ④ | Ambivalent | One-eyed child-monk prankster that startles passers-by. | village, forest | ★ ◆ | – |
| Gashadokuro (がしゃどくろ) | undead | ④ | Malevolent | Giant skeleton formed from the unburied war dead, said to bite off heads. | ruins, tomb | ○ ◆ | – |
| Kamaitachi (鎌鼬) | beast | ④ | Ambivalent | Whirlwind weasel with sickle claws that cuts skin without pain. | mountain, highland | ★ ◆ | – |
| Tsuchigumo (土蜘蛛) | monster | ④ | Malevolent | Giant earth spider of legend, slain by Minamoto no Raikō. | cave, mountain |  | – |
| Ittan-momen (一反木綿) | spirit | ④ | Ambivalent | Strip of flying cloth that wraps around and smothers people at night. | sky, village |  | – |
| Noppera-bō (のっぺら坊) | spirit | ④ | Ambivalent | Faceless ghost that frightens travellers by wiping its face blank. | village, city |  | – |
| Umibōzu (海坊主) | monster | ④ | Malevolent | Black giant rising from the sea to capsize ships. | sea, coast |  | – |
| Ōnamazu (大鯰) | monster | ④ | Malevolent | Giant catfish beneath Japan whose thrashing causes earthquakes. | lake, underworld |  | – |
| Inugami (犬神) | spirit | ④ | Malevolent | Dog spirit used in curses, from Shikoku and Kyushu folklore. | village, forest |  | – |
| Zashiki-warashi (座敷童) | spirit | ④ | Benevolent | Child spirit of old houses in Tohoku that brings fortune to the family. | village |  | – |
| Yamabiko (山彦) | spirit | ④ | Ambivalent | Mountain echo given a dog-like body, answering calls from the peaks. | mountain, highland |  | – |
| Shachihoko (鯱) | beast | ④ | Ambivalent | Tiger-headed carp ornament on castle roofs, said to protect against fire. | city, sea |  | – |
| Raijū (雷獣) | beast | ④ | Ambivalent | Lightning beast that rides storms and sleeps in belly buttons of folklore. | sky, mountain |  | – |

## Egyptian

Art set `egypt` (20 drawn). Ancient religion with no significant living faith (small Kemetic revival); the 🟢 gods are kept, in their animal forms.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Sphinx | monster | ① | Ambivalent | Lion-bodied guardian with a royal human head. | desert, tomb | ○ ◆ | – |
| Mummy | undead | ① | Malevolent | Preserved, bandaged corpse that rises to guard its tomb. | tomb | ○ ◆ | – |
| Nile crocodile | animal | ① | Ambivalent | Feared and venerated river predator. | river, marsh |  | – |
| Hippopotamus | animal | ① | Ambivalent | Dangerous river beast, associated with Set and Taweret. | river |  | – |
| Anubis (Inpu) | deity-beast | ② | Benevolent | Jackal-headed god of embalming who guides the dead and weighs hearts. | tomb, underworld | ★ ◆ | 🟢 |
| Ra | deity-beast | ② | Benevolent | Falcon-headed sun god who sails the sky and underworld in his barque. | sky | ★ ◆ | 🟢 |
| Bastet | deity-beast | ② | Benevolent | Cat-headed protector goddess of the home. | village, city | ✕ | 🟢 |
| Thoth (Djehuty) | deity-beast | ② | Benevolent | Ibis- or baboon-headed god of writing and wisdom. | city, tomb | ○ | 🟢 |
| Osiris | deity-beast | ② | Benevolent | Mummiform king of the underworld, god of resurrection. | underworld | ○ | 🟢 |
| Isis (Aset) | deity-beast | ② | Benevolent | Winged goddess of magic and motherhood. | city, sky | ★ | 🟢 |
| Scarab beetle | animal | ② | Ambivalent | Dung beetle symbolising rebirth. | desert |  | – |
| Horus (Heru) | deity-beast | ② | Benevolent | Falcon-headed sky god and avenger of Osiris, whose eye is a protective symbol. | sky |  | 🟢 |
| Sekhmet | deity-beast | ③ | Ambivalent | Lioness-headed war goddess, Eye of Ra, bringer of plague. | desert | ○ ◆ | 🟢 |
| Sobek | deity-beast | ③ | Ambivalent | Crocodile-headed god of the Nile and fertility. | river, marsh | ○ ◆ | 🟢 |
| Set | deity-beast | ③ | Ambivalent | God of storm and chaos with an unidentified "Set animal" head. | desert | ○ ◆ | 🟢 |
| Apep (Apophis) | monster | ③ | Malevolent | Giant chaos serpent that attacks Ra's barque each night. | underworld | ○ ◆ | 🟢 |
| Ammit | monster | ③ | Malevolent | Crocodile, lion and hippo composite that devours unworthy hearts. | tomb, underworld | ○ ◆ | 🟢 |
| Bes | deity-beast | ③ | Benevolent | Dwarf lion-featured household protector who wards off evil. | village | ★ ◆ | 🟢 |
| Bennu | deity-beast | ③ | Benevolent | Heron-like bird of Heliopolis, the model for the phoenix. | sky, oasis | ★ ◆ | 🟢 |
| Wadjet | deity-beast | ③ | Benevolent | Cobra goddess of Lower Egypt, the royal uraeus. | marsh, desert | ★ ◆ | 🟢 |
| Ushabti | construct | ③ | Benevolent | Funerary figurine meant to work for the dead in the afterlife. | tomb | ○ ◆ | – |
| Medjed | spirit | ③ | Ambivalent | Shrouded figure with only eyes visible, from the Book of the Dead. | underworld |  | – |
| Sacred ibis | animal | ③ | Ambivalent | Wading bird of Thoth, mummified in the millions. | marsh, river |  | – |
| Hathor | deity-beast | ③ | Benevolent | Cow-eared goddess of love, music and joy, mother of the king. | desert, village |  | 🟢 |
| Amun (Amun-Ra) | deity | ③ | Benevolent | Hidden king of the gods at Thebes, ram-linked, later merged with Ra. | city |  | 🟢 |
| Maat | deity | ③ | Benevolent | Winged goddess of truth, justice and cosmic order whose feather weighs hearts. | tomb, underworld |  | 🟢 |
| Khepri | deity-beast | ④ | Benevolent | Scarab-headed form of the rising sun. | desert | ○ ◆ | 🟢 |
| Serket (Selket) | deity-beast | ④ | Benevolent | Scorpion goddess who protects against venom. | desert | ○ ◆ | 🟢 |
| Taweret | deity-beast | ④ | Benevolent | Hippo-bodied protector of mothers and childbirth. | river, village | ○ ◆ | 🟢 |
| Serpopard | monster | ④ | Malevolent | Serpent-necked leopard from the Narmer Palette and early art. | desert |  | – |
| Ba | spirit | ④ | Ambivalent | Human-headed bird form of the soul. | tomb, sky |  | – |
| Ptah | deity | ④ | Benevolent | Mummiform craftsman god of Memphis who created the world by speech. | city |  | 🟢 |
| Nephthys | deity | ④ | Benevolent | Goddess of mourning, sister of Isis, with a house-and-basket crown. | tomb |  | 🟢 |
| Nut | deity | ④ | Benevolent | Sky goddess arched over the earth, who swallows the sun each evening. | sky |  | 🟢 |
| Geb | deity | ④ | Benevolent | Earth god, father of Osiris, whose laughter was said to cause earthquakes. | desert |  | 🟢 |
| Khnum | deity-beast | ④ | Benevolent | Ram-headed potter god who shapes people on his wheel at Elephantine. | river |  | 🟢 |
| Neith | deity | ④ | Benevolent | Warrior and weaver goddess of Sais with crossed arrows. | city |  | 🟢 |
| Atum | deity | ④ | Benevolent | Self-created primordial god of Heliopolis, the "complete one". | sky |  | 🟢 |
| Aten | deity | ④ | Benevolent | Sun disc with rays ending in hands, worshipped under Akhenaten. | sky |  | 🟢 |
| Khonsu | deity | ④ | Benevolent | Moon god, a youthful figure with a side-lock, travelling across the night sky. | sky |  | 🟢 |
| Mehen | monster | ⑤ | Malevolent | Coiled serpent that shelters Ra in his barque on the night journey. | underworld |  | 🟢 |
| Nehebkau | monster | ⑤ | Malevolent | Two-headed snake deity who guards the dead. | underworld |  | – |
| Akhekh | monster | ⑤ | Malevolent | Griffin-like creature with a serpent's neck in funerary texts. | desert, tomb |  | – |
| Shu | deity | ⑤ | Benevolent | God of air who holds up the sky goddess Nut. | sky |  | 🟢 |
| Tefnut | deity-beast | ⑤ | Benevolent | Lioness-headed goddess of moisture, twin of Shu. | desert |  | 🟢 |

## Chinese

Art set `chinese` (20 drawn). Four Guardian Beasts (Long, Fenghuang, Baihu, Xuanwu) were dropped by the owner.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Long (龍) | beast | ① | Benevolent | Chinese dragon: wingless, rain- and river-bringing, with a pearl. | sky, river, sea | ✕ | – |
| Giant panda (大熊貓) | animal | ① | Ambivalent | Bamboo-eating bear, national emblem of China. | bamboo, mountain |  | – |
| Fenghuang (鳳凰) | beast | ② | Benevolent | "Phoenix": composite bird of virtue that appears in peaceful reigns. | sky, bamboo | ✕ ◆ | – |
| Qilin (麒麟) | beast | ② | Benevolent | Hooved chimera with scaled body, whose appearance is a good omen. | meadow, forest | ○ | – |
| Jiangshi (殭屍) | undead | ② | Malevolent | Stiff, hopping corpse that drains qi from the living. | tomb, village | ○ | – |
| Red-crowned crane (丹頂鶴) | animal | ② | Ambivalent | Symbol of longevity, carries immortals in art. | marsh, lake |  | – |
| Koi / carp (鯉) | animal | ② | Ambivalent | Carp that leaps the Dragon Gate to become a dragon. | river, lake |  | – |
| Nian (年) | monster | ③ | Malevolent | Beast that preys on villages at New Year and fears red and noise. | village, mountain | ○ ◆ | – |
| Taotie (饕餮) | monster | ③ | Ambivalent | Gluttonous maw-faced beast of Zhou bronzes. | ruins, mountain | ○ ◆ | – |
| Pixiu (貔貅) | beast | ③ | Benevolent | Winged lion-like beast that eats wealth and never lets it leave. | city, mountain | ○ ◆ | – |
| Yutu (玉兔) | spirit | ③ | Benevolent | Jade Rabbit that pounds the elixir of life on the moon. | sky | ○ ◆ | – |
| Jiuweihu (九尾狐) | beast | ③ | Ambivalent | Nine-tailed fox, omen of peace or a seductive fiend depending on source. | mountain |  | – |
| Kunpeng (鯤鵬) | beast | ③ | Ambivalent | Vast fish that becomes a bird thousands of li across (Zhuangzi). | sea, sky |  | – |
| Hundun (混沌) | monster | ④ | Malevolent | Faceless, shapeless being, a figure of primordial chaos. | ruins, underworld | ○ ◆ | – |
| Qiongqi (窮奇) | monster | ④ | Malevolent | Winged tiger (or ox) from the Classic of Mountains and Seas. | bamboo, mountain | ○ ◆ | – |
| Bai Ze (白澤) | beast | ④ | Benevolent | Wise many-eyed beast who knows all spirits and told them to Huangdi. | mountain, forest | ○ ◆ | – |
| Jingwei (精衛) | spirit | ④ | Ambivalent | Drowned girl turned bird who fills the sea with pebbles. | coast, sea | ○ ◆ | – |
| Kui (夔) | beast | ④ | Ambivalent | One-legged hornless ox whose roar is thunder. | sea, mountain | ★ ◆ | – |
| Xiangliu (相柳) | monster | ④ | Malevolent | Nine-headed snake whose poisonous breath ruins land. | marsh, mountain |  | – |
| Bifang (畢方) | spirit | ④ | Ambivalent | One-legged crane whose appearance foretells fire. | forest, volcano |  | – |
| Xingtian (刑天) | spirit | ④ | Ambivalent | Headless warrior with eyes on the chest who fights on. | mountain |  | – |
| Hulijing (狐狸精) | spirit | ④ | Ambivalent | Fox spirit that becomes a woman; related to the nine-tailed fox. | forest, city |  | – |
| Bashe (巴蛇) | monster | ④ | Malevolent | Giant snake said to swallow an elephant and spit out its bones. | jungle, marsh |  | – |
| Xiezhi (獬豸) | beast | ④ | Benevolent | One-horned ox-goat that butts the guilty. | city |  | – |
| Bixi (贔屭) | beast | ④ | Benevolent | Dragon-headed tortoise that carries stone steles. | ruins |  | – |
| Chiwen (螭吻) | beast | ④ | Benevolent | Dragon-fish roof ornament that wards off fire. | city, sea |  | – |
| Shanxiao (山魈) | spirit | ⑤ | Ambivalent | One-legged mountain imp that causes fever and mischief. | mountain, bamboo | ○ ◆ | – |

## Greek

Art set `greek` (20 drawn). Ancient religion with no significant living worship; Olympians and other gods are kept (🟢).

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Medusa | monster | ① | Malevolent | Gorgon with snake hair whose gaze turns people to stone. | coast, ruins | ○ ◆ | – |
| Cyclops (Kyklops) | monster | ① | Malevolent | One-eyed giant smith or shepherd, as in the Odyssey. | island, cave | ○ ◆ | – |
| Cerberus | monster | ① | Malevolent | Multi-headed hound guarding the gates of Hades. | underworld | ★ ◆ | – |
| Hydra of Lerna | monster | ① | Malevolent | Many-headed water serpent whose heads regrow. | marsh, lake | ○ ◆ | – |
| Griffin (Gryps) | beast | ① | Ambivalent | Eagle-headed winged lion that guards gold. | highland, desert | ○ ◆ | – |
| Pegasus | beast | ① | Benevolent | Winged horse born from Medusa's blood. | sky | ○ | – |
| Siren | monster | ① | Malevolent | Bird-bodied singer who lures sailors onto the rocks. | coast, sea | ★ ◆ | – |
| Centaur | beast | ① | Ambivalent | Horse-bodied man; Chiron was a wise teacher among wild kin. | forest, meadow | ○ | – |
| Zeus | deity-beast | ① | Benevolent | King of the gods, wielder of the thunderbolt. | sky | ○ | 🟢 |
| Poseidon | deity-beast | ① | Benevolent | God of the sea, earthquakes and horses. | sea | ○ ◆ | 🟢 |
| Hades | deity-beast | ① | Ambivalent | Lord of the underworld, with his helm of invisibility. | underworld | ★ | 🟢 |
| Athena | deity-beast | ① | Benevolent | Goddess of wisdom and war, with her owl. | city | ○ | 🟢 |
| Dolphin | animal | ① | Benevolent | Friendly sea mammal, sacred to Apollo and Dionysus. | sea |  | – |
| Apollo | deity | ① | Benevolent | God of the sun, music, prophecy and the Pythian oracle. | sky |  | 🟢 |
| Artemis | deity | ① | Benevolent | Virgin huntress, goddess of the moon, wild animals and childbirth. | forest |  | 🟢 |
| Aphrodite | deity | ① | Benevolent | Goddess of love and beauty, born from sea foam. | coast |  | 🟢 |
| Hermes | deity | ① | Benevolent | Winged messenger and trickster, guide of souls and patron of travellers. | sky |  | 🟢 |
| Dionysus | deity | ① | Ambivalent | God of wine, theatre and ecstatic revelry. | meadow |  | 🟢 |
| Minotaur | monster | ② | Malevolent | Bull-headed man of the Cretan labyrinth. | ruins, cave | ○ ◆ | – |
| Chimera | monster | ② | Malevolent | Lion with a goat head on its back and a snake tail, breathing fire. | highland, volcano | ○ ◆ | – |
| Harpy | monster | ② | Malevolent | Winged woman-bird snatching food and people. | sky, coast | ○ ◆ | – |
| Satyr | spirit | ② | Ambivalent | Goat-legged follower of Dionysus, piper and reveller. | forest, meadow | ○ | – |
| Scylla | monster | ② | Malevolent | Six-headed sea monster of the strait opposite Charybdis. | sea, coast | ○ ◆ | – |
| Nemean Lion | beast | ② | Malevolent | Lion with an invulnerable hide killed by Heracles. | highland, cave | ○ ◆ | – |
| Charybdis | monster | ② | Malevolent | Whirlpool monster who swallows and spews the sea thrice daily. | sea |  | – |
| Dryad | spirit | ② | Ambivalent | Tree nymph whose life is tied to her tree. | forest |  | – |
| Charon | spirit | ② | Ambivalent | Ferryman who carries the dead across the Styx. | underworld |  | 🟢 |
| Pan | spirit | ② | Ambivalent | Goat-legged god of the wild, flocks and sudden panic. | forest, highland |  | 🟢 |
| Hera | deity | ② | Ambivalent | Queen of the gods, goddess of marriage, jealous wife of Zeus. | sky |  | 🟢 |
| Ares | deity | ② | Ambivalent | God of war and bloodshed, hated by his fellow Olympians. | ruins |  | 🟢 |
| Hephaestus | deity | ② | Benevolent | Lame smith god who forged the weapons and automata of the gods. | volcano |  | 🟢 |
| Demeter | deity | ② | Benevolent | Goddess of grain and the harvest, mother of Persephone. | meadow |  | 🟢 |
| Persephone | deity | ② | Ambivalent | Queen of the underworld who spends part of each year with Hades. | underworld |  | 🟢 |
| Hecate | deity | ② | Ambivalent | Goddess of crossroads, witchcraft and ghosts, bearing torches. | underworld |  | 🟢 |
| Prometheus | deity | ② | Benevolent | Titan who stole fire for humankind and was chained to a rock. | mountain |  | 🟢 |
| Atlas | deity | ② | Ambivalent | Titan condemned to hold up the sky. | mountain |  | 🟢 |
| Eros | deity | ② | Benevolent | Winged god of desire whose arrows kindle love. | sky |  | 🟢 |
| Talos | construct | ③ | Ambivalent | Bronze giant who guards Crete by circling the island. | island, coast | ★ ◆ | – |
| Typhon | monster | ③ | Malevolent | Hundred-headed storm giant, father of monsters. | volcano, sky | ★ ◆ | – |
| Echidna | monster | ③ | Malevolent | Half-woman, half-snake mother of many monsters. | cave, underworld |  | – |
| Ladon | monster | ③ | Malevolent | Hundred-headed dragon guarding the Hesperides' golden apples. | oasis |  | – |
| Stymphalian birds | monster | ③ | Malevolent | Man-eating birds with bronze beaks and metal feathers. | marsh, lake |  | – |
| Erymanthian Boar | beast | ③ | Malevolent | Giant boar of the Arcadian mountains. | highland, forest |  | – |
| Cretan Bull | beast | ③ | Malevolent | Raging white bull Heracles captured, sire of the Minotaur. | meadow, island |  | – |
| Lamia | monster | ③ | Malevolent | Child-snatching queen turned monster by Hera. | cave |  | – |
| Hippocampus | beast | ③ | Benevolent | Fish-tailed sea horse that pulls Poseidon's chariot. | sea, coast |  | – |
| Triton | monster | ③ | Malevolent | Merman herald of the sea who blows a conch. | sea |  | 🟢 |
| Nereid | spirit | ③ | Ambivalent | Sea nymph, daughter of Nereus. | sea, coast |  | – |
| Graeae | monster | ③ | Malevolent | Three grey sisters sharing one eye and one tooth. | cave, coast |  | – |
| Owl of Athena | animal | ③ | Ambivalent | Little owl, symbol of wisdom and Athens. | city |  | – |
| Hestia | deity | ③ | Benevolent | Virgin goddess of the hearth and domestic fire. | village |  | 🟢 |
| Cronus | deity | ③ | Malevolent | Titan who castrated Uranus and swallowed his own children. | sky |  | 🟢 |
| Gaia | deity | ③ | Benevolent | Primordial earth, mother of the Titans and Giants. | meadow |  | 🟢 |
| Thanatos | deity | ③ | Ambivalent | Winged personification of death, brother of Hypnos. | underworld |  | 🟢 |
| Hypnos | deity | ③ | Ambivalent | Personification of sleep who dwells near the underworld. | underworld |  | 🟢 |
| Nemesis | deity | ③ | Ambivalent | Goddess of retribution against arrogance. | city |  | 🟢 |
| Eris | deity | ③ | Ambivalent | Goddess of strife who threw the golden apple at the wedding of Peleus. | city |  | 🟢 |
| Orthrus | monster | ④ | Malevolent | Two-headed hound of Geryon, Cerberus's brother. | meadow, island |  | – |
| Empusa | monster | ④ | Malevolent | Shape-shifting, bronze-legged demon sent by Hecate. | underworld |  | – |
| Python | monster | ④ | Malevolent | Serpent of Delphi slain by Apollo. | highland, cave |  | – |
| Argus Panoptes | monster | ④ | Malevolent | Hundred-eyed giant herdsman who never fully sleeps. | meadow |  | – |
| Ram Chrysomallos | beast | ④ | Benevolent | Golden-fleeced flying ram sought by the Argonauts. | sky, highland |  | – |
| Nyx | deity | ④ | Ambivalent | Primordial goddess of night, mother of Sleep and Death. | underworld |  | 🟢 |
| Helios | deity | ④ | Benevolent | Sun god who drives a chariot across the sky each day. | sky |  | 🟢 |
| Selene | deity | ④ | Benevolent | Moon goddess driving a silver chariot. | sky |  | 🟢 |

## Norse

Art set `norse` (20 drawn). Fenrir and Kraken were dropped after failed refinements.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Valkyrie | spirit | ① | Ambivalent | Armoured chooser of the slain who bears warriors to Valhalla. | sky | ○ ◆ | 🟢 |
| Troll | monster | ① | Ambivalent | Mountain-dwelling giant or brute, turned to stone by sunlight in folk tales. | mountain, cave | ○ ◆ | – |
| Kraken | monster | ① | Malevolent | Giant sea creature of later Scandinavian sailors' tales. | sea | ✕ | – |
| Thor | deity-beast | ① | Benevolent | God of thunder, goat-driver, wielder of Mjölnir. | sky | ○ | 🟢 |
| Odin | deity-beast | ① | Ambivalent | The All-father, one-eyed wanderer. | sky | ○ | 🟢 |
| Loki | deity-beast | ① | Ambivalent | Trickster and shape-shifter, mother of Sleipnir. | city | ○ ◆ | 🟢 |
| Polar bear | animal | ① | Ambivalent | Arctic apex predator of the Norse coasts and Greenland. | ice |  | – |
| Reindeer | animal | ① | Ambivalent | Hardy herd animal of the Nordic north. | ice, highland |  | – |
| Wolf | animal | ① | Ambivalent | Pack hunter of the Nordic forests. | forest, ice |  | – |
| Fenrir | monster | ② | Malevolent | Monstrous wolf bound by the gods, fated to break loose at Ragnarök. | ice, underworld | ✕ | – |
| Jörmungandr | monster | ② | Malevolent | World Serpent encircling Midgard, doomed to fight Thor at Ragnarök. | sea | ○ ◆ | – |
| Draugr | undead | ② | Malevolent | Undead barrow-dweller of strength and foul temper that guards its treasure. | tomb | ○ ◆ | – |
| Freyja | deity-beast | ② | Benevolent | Goddess of love and war, drawn with her cats. | meadow | ○ | 🟢 |
| Hel | deity-beast | ② | Ambivalent | Half-living, half-corpse ruler of the realm of the dead. | underworld | ○ ◆ | 🟢 |
| Sleipnir | beast | ③ | Benevolent | Eight-legged grey horse of Odin, born of Loki. | sky, underworld | ○ ◆ | – |
| Jötunn | monster | ③ | Malevolent | Frost giant, ancient foe of gods and men. | ice, mountain | ★ ◆ | – |
| Surtr | monster | ③ | Malevolent | Fire giant of Muspelheim who will burn the world at Ragnarök. | volcano | ○ ◆ | – |
| Dvergr | spirit | ③ | Ambivalent | Dwarf smith who forges treasures within the earth. | cave, mountain | ○ ◆ | – |
| Níðhöggr | monster | ③ | Malevolent | Dragon that gnaws the roots of Yggdrasil. | underworld | ○ | – |
| Ratatoskr | beast | ③ | Ambivalent | Squirrel that carries insults up and down Yggdrasil. | forest | ○ ◆ | – |
| Huginn and Muninn | beast | ③ | Benevolent | Odin's two ravens, Thought and Memory. | sky | ★ ◆ | – |
| Lindworm | monster | ③ | Malevolent | Wingless, two-legged serpent dragon of Nordic folklore. | forest, mountain | ○ ◆ | – |
| Nisse | spirit | ③ | Ambivalent | Small house gnome who guards the farm and punishes disrespect. | village | ○ ◆ | – |
| Garmr | monster | ③ | Malevolent | Blood-stained hound that guards Hel's gate. | underworld |  | – |
| Fáfnir | monster | ③ | Malevolent | Dwarf turned dragon who guards a cursed hoard. | cave, mountain |  | – |
| Freyr | deity | ③ | Benevolent | Vanir god of fertility, sunshine and prosperity who owns the boar Gullinbursti. | meadow |  | 🟢 |
| Baldr | deity | ③ | Benevolent | Beloved god of light killed by a mistletoe dart through Loki's scheme. | sky |  | 🟢 |
| Tyr | deity | ③ | Benevolent | One-handed god of law and war who lost his hand binding Fenrir. | highland |  | 🟢 |
| Heimdall | deity | ③ | Benevolent | Watchman of the gods at the rainbow bridge who will sound the Gjallarhorn. | sky |  | 🟢 |
| Frigg | deity | ③ | Benevolent | Queen of Asgard, wife of Odin, who foresees all but tells nothing. | sky |  | 🟢 |
| Sköll and Hati | monster | ④ | Ambivalent | Wolves that chase the sun and moon. | sky, ice |  | – |
| Gullinbursti | beast | ④ | Benevolent | Golden-bristled boar made by dwarves. | forest |  | – |
| Tanngrisnir and Tanngnjóstr | beast | ④ | Benevolent | Goats that pull a chariot and can be eaten and revived. | sky, highland |  | – |
| Auðumbla | beast | ④ | Benevolent | Primordial cow who licked the first god from the ice. | ice |  | – |
| Huldra | spirit | ④ | Ambivalent | Alluring forest woman with a cow's tail, from Scandinavian folklore. | forest |  | – |
| Näcken | spirit | ④ | Ambivalent | Fiddling water spirit who lures people into lakes. | river, lake |  | – |
| Draugen | undead | ④ | Malevolent | Headless fisherman's ghost who rows a half boat before storms. | sea, coast |  | – |
| Mara | spirit | ④ | Malevolent | Night spirit that sits on sleepers' chests and brings nightmares. | village |  | – |
| Skogsrå | spirit | ④ | Ambivalent | Hollow-backed forest-keeper woman of Swedish folklore. | forest |  | – |
| Njörðr | deity | ④ | Benevolent | Vanir god of the sea, ships and wealth. | sea, coast |  | 🟢 |
| Iðunn | deity | ④ | Benevolent | Keeper of the apples that keep the gods young. | forest |  | 🟢 |
| Sif | deity | ④ | Benevolent | Golden-haired wife of Thor. | meadow |  | 🟢 |
| Skaði | deity | ④ | Ambivalent | Giantess goddess of winter, skiing and the hunt. | ice, mountain |  | 🟢 |
| Ægir | deity | ④ | Ambivalent | Jötunn lord of the sea who brews ale for the gods. | sea |  | 🟢 |
| Mímir | deity | ④ | Benevolent | Wise being whose severed head Odin consults beside a well of wisdom. | forest |  | 🟢 |
| Norns | deity | ④ | Benevolent | Three fate-weavers beneath Yggdrasil: Urðr, Verðandi and Skuld. | forest |  | 🟢 |
| Eikþyrnir | beast | ⑤ | Ambivalent | Stag atop Valhalla whose antlers drip rivers. | forest, sky |  | – |
| Hræsvelgr | monster | ⑤ | Malevolent | Giant eagle at the world's edge whose wings stir the winds. | sky, ice |  | – |
| Haugbui | undead | ⑤ | Malevolent | Barrow-dweller, a mound-guarding variant of the draugr. | tomb |  | – |
| Bragi | deity | ⑤ | Benevolent | God of poetry and eloquence. | sky |  | 🟢 |
| Víðarr | deity | ⑤ | Benevolent | Silent god who avenges Odin at Ragnarök by slaying Fenrir. | forest |  | 🟢 |
| Höðr | deity | ⑤ | Ambivalent | Blind god tricked into killing Baldr. | sky |  | 🟢 |
| Ullr | deity | ⑤ | Benevolent | God of archery, skiing and the duel. | ice |  | 🟢 |

## Slavic

Art set `slavic` (20 drawn). Vodyanoy was dropped.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Grey Wolf | animal | ① | Ambivalent | Helper and menace of Slavic folk tales. | forest |  | – |
| Brown bear | animal | ① | Ambivalent | Lord of the forest, Russia's emblem animal. | forest |  | – |
| Baba Yaga | monster | ② | Malevolent | Witch who flies in a mortar and lives in a hut on chicken legs. | forest | ○ | – |
| Firebird (Zhar-ptitsa) | beast | ② | Benevolent | Glowing bird whose feathers light the night. | forest | ○ ◆ | – |
| Koschei | undead | ③ | Malevolent | The Deathless sorcerer whose death is hidden in a needle in an egg. | ruins | ○ ◆ | – |
| Zmey Gorynych | monster | ③ | Malevolent | Multi-headed fire-breathing dragon of the byliny. | mountain | ○ ◆ | – |
| Leshy | spirit | ③ | Ambivalent | Shape-shifting master of the forest who leads travellers astray. | forest | ○ ◆ | – |
| Rusalka | spirit | ③ | Ambivalent | Drowned maiden who lures the living into rivers. | river, lake, marsh | ○ ◆ | – |
| Vodyanoy | spirit | ③ | Ambivalent | Frog-bearded water spirit who drowns the careless. | lake, river | ✕ | – |
| Domovoi | spirit | ③ | Benevolent | Hairy household guardian who tends or punishes the home. | village | ○ ◆ | – |
| Upyr | undead | ③ | Malevolent | Slavic vampire, a corpse that rises to feed on the living. | tomb, village | ○ | – |
| Vila | spirit | ③ | Ambivalent | Storm and mountain fairy-maiden, kind or cruel. | mountain, lake | ○ | – |
| Mavka | spirit | ③ | Malevolent | Ukrainian forest nymph, a dead girl who lures men. | forest |  | – |
| Wisent | animal | ③ | Ambivalent | European bison of Białowieża, the old forest. | forest, meadow |  | – |
| Kikimora | spirit | ④ | Ambivalent | Mischievous swamp or house spirit that spins at night. | marsh, village | ○ | – |
| Bannik | spirit | ④ | Ambivalent | Spirit of the bathhouse, dangerous when angered. | village | ○ ◆ | – |
| Poludnitsa | spirit | ④ | Malevolent | Noon lady of the fields who punishes those working in the heat. | meadow | ○ | – |
| Likho | spirit | ④ | Malevolent | One-eyed embodiment of misfortune. | village, forest | ○ | – |
| Alkonost | monster | ④ | Ambivalent | Bird with a maiden's face whose song makes people forget all. | sky, sea | ★ ◆ | – |
| Strzyga | undead | ④ | Malevolent | Two-souled night demon of Polish folklore. | forest, village | ○ | – |
| Sirin | monster | ④ | Ambivalent | Owl-bodied woman-bird whose song is deadly to hear. | forest, sky |  | – |
| Gamayun | beast | ④ | Benevolent | Prophetic bird with a woman's face. | sky |  | – |
| Simargl | beast | ④ | Benevolent | Winged dog guardian of seeds in early Rus lore. | sky |  | – |
| Indrik | beast | ④ | Benevolent | Horned beast-king of animals in Russian legend. | mountain, forest |  | – |
| Drekavac | monster | ④ | Malevolent | Dreaded screaming creature of Serbian and Croatian folklore. | forest, village |  | – |
| Vukodlak | undead | ④ | Malevolent | Werewolf-vampire of the Balkan Slavs. | forest |  | – |
| Sivka-Burka | beast | ④ | Benevolent | Magical talking horse of Russian folk tales. | meadow |  | – |
| Ovinnik | spirit | ⑤ | Ambivalent | Barn spirit that lives in the grain-drying house. | village |  | – |
| Polevik | spirit | ⑤ | Ambivalent | Field spirit that tricks farmers in the crops. | meadow |  | – |
| Zduhać | spirit | ⑤ | Ambivalent | Serbian weather guardian born with a caul who fights storm dragons. | sky, highland |  | – |
| Rarog | beast | ⑤ | Benevolent | Fiery falcon of Slavic tales, tied to the Rurikid emblem. | sky |  | – |
| Aspid | monster | ⑤ | Malevolent | Winged poisonous serpent of Russian bestiaries. | mountain |  | – |

## Maya

Art set `maya` (20 drawn). Maya peoples are alive today; deities and sacred figures were removed (see the appendix).

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Jaguar | animal | ① | Ambivalent | Apex predator and royal emblem of the Maya. | jungle, forest |  | – |
| Resplendent quetzal | animal | ② | Benevolent | Long-tailed forest bird of the cloud forests. | jungle, sky |  | – |
| Spider monkey | animal | ② | Ambivalent | Agile canopy monkey of Central America. | jungle |  | – |
| Tapir | animal | ② | Ambivalent | Shy forest herbivore with a short trunk. | jungle |  | – |
| Camazotz | monster | ③ | Malevolent | Death bat who beheaded a Hero Twin in Xibalba. | cave, underworld | ○ ◆ | – |
| Ocellated turkey | animal | ③ | Benevolent | Colourful forest turkey of the Yucatán. | jungle |  | – |
| Vucub Caquix | monster | ④ | Malevolent | Seven Macaw, false sun slain by the Hero Twins. | forest, sky | ○ ◆ | – |
| Zipacna | monster | ④ | Malevolent | Crocodile-backed mountain-maker giant of the Popol Vuh. | mountain, river | ○ ◆ | – |
| Cabrakan | monster | ④ | Malevolent | Earthquake giant who topples mountains. | volcano, mountain | ○ ◆ | – |
| Balam | spirit | ④ | Ambivalent | Jaguar guardian of fields and villages. | forest, jungle | ○ ◆ | – |
| Alux | spirit | ④ | Ambivalent | Little field and forest sprite of Yucatec folklore. | forest, village | ○ ◆ | – |
| Sisimito | monster | ④ | Malevolent | Hairy forest giant of Maya folklore. | forest, jungle | ○ | – |
| Xtabay | spirit | ④ | Malevolent | Ceiba-tree spirit that lures men in the forest. | forest, jungle | ★ | – |
| Huay Chivo | spirit | ④ | Malevolent | Goat-shaped sorcerer who prowls at night. | forest, village | ○ ◆ | – |
| Cadejo | spirit | ④ | Ambivalent | Spirit dog of the night road, white and black. | village, forest | ○ ◆ | – |
| Kisin | monster | ④ | Malevolent | Yucatec earthquake and death-bringing spirit. | underworld |  | – |
| Hun Batz and Hun Chuen | spirit | ⑤ | Ambivalent | Howler-monkey scribes of the Popol Vuh, turned by the Hero Twins. | jungle | ○ | – |
| Xquic | spirit | ⑤ | Ambivalent | Xibalban maiden and mother of the Hero Twins. | underworld |  | – |
| Wayob | spirit | ⑤ | Ambivalent | Animal companion-spirits and sorcerer's alter forms. | jungle |  | – |

## Korean

Art set `korean` (20 drawn). Sansin, Jowangshin, Yeomra and other folk-religion figures were removed (see the appendix).

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Gongjak (공작) | animal | ② | Benevolent | Peacock, a royal emblem in Joseon painting. | meadow |  | – |
| Siberian tiger | animal | ② | Ambivalent | Beom, the great cat of Korean mountains and folk art. | mountain, ice |  | – |
| Magpie (까치) | animal | ② | Benevolent | Bringer of good news in Korean folk belief. | village, meadow |  | – |
| Dokkaebi (도깨비) | spirit | ③ | Ambivalent | Goblin with a magic club who plays tricks and rewards the honest. | forest, village | ○ ◆ | – |
| Gumiho (구미호) | monster | ③ | Malevolent | Nine-tailed fox that becomes a woman and eats livers or hearts. | forest, mountain | ○ ◆ | – |
| Haetae (해태) | beast | ③ | Benevolent | Lion-like guardian that judges the guilty and wards off fire. | city | ○ ◆ | – |
| Imugi (이무기) | monster | ③ | Ambivalent | Great serpent striving a thousand years to become a dragon. | river, marsh | ○ ◆ | – |
| Dalgyal Gwisin (달걀귀신) | spirit | ③ | Malevolent | Faceless egg-shaped ghost. | village | ★ ◆ | – |
| Cheonyeo Gwisin (처녀귀신) | spirit | ③ | Malevolent | Ghost of a maiden who died unmarried, in white. | village, forest | ○ ◆ | – |
| Yong (용) | beast | ③ | Benevolent | Korean dragon, a water-bringer holding a wish pearl. | sky, river | ○ | – |
| Jeoseung Saja (저승사자) | spirit | ③ | Benevolent | Black-clad reaper who escorts the dead. | underworld | ★ | – |
| Gwisin (귀신) | undead | ③ | Malevolent | General ghost of those who died with resentment. | village |  | – |
| Geobuk (거북) | beast | ③ | Benevolent | Long-lived turtle, a symbol of longevity in Korea. | river, sea |  | – |
| Bulgasari (불가사리) | monster | ④ | Malevolent | Iron-eating beast of legend that grows by eating metal. | village, mountain | ○ ◆ | – |
| Samjok-o (삼족오) | beast | ④ | Benevolent | Three-legged sun crow of Goguryeo murals. | sky | ★ ◆ | – |
| Bulgae (불개) | beast | ④ | Benevolent | Fire dogs that try to bite the sun or moon, causing eclipses. | sky | ○ ◆ | – |
| Jangsan-beom (장산범) | monster | ④ | Malevolent | White tiger-like creature of Jangsan that mimics voices. | mountain, forest | ○ ◆ | – |
| Mul Gwisin (물귀신) | spirit | ④ | Malevolent | Water ghost that drags swimmers under. | river, lake | ○ ◆ | – |
| Ungnyeo (웅녀) | spirit | ④ | Ambivalent | Bear who became a woman, mother of Dangun. | mountain, cave | ○ ◆ | – |
| Bonghwang (봉황) | beast | ④ | Benevolent | Korean phoenix emblem of the presidency and royal arts. | sky |  | – |
| Cheonma (천마) | beast | ④ | Benevolent | Winged horse seen in the Silla royal tomb painting. | sky, tomb |  | – |
| Inmyeonjo (인면조) | beast | ⑤ | Benevolent | Human-faced bird of paradise drawn in Goguryeo tomb murals. | sky, tomb | ○ ◆ | – |
| Gaeksin (객귀) | spirit | ⑤ | Ambivalent | Wandering ghost of one who died away from home. | village, forest |  | – |

## Celtic (Irish, Scottish, Welsh, Cornish)

New. Folklore creatures; the deities were removed.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Leprechaun (leipreachán) | spirit | ① | Ambivalent | Solitary shoemaker fairy guarding a crock of gold. | meadow, forest |  | – |
| Banshee (bean sídhe) | spirit | ② | Ambivalent | Wailing woman whose cry foretells a death in an Irish family. | village, ruins |  | – |
| Selkie | spirit | ② | Ambivalent | Seal that sheds its skin to become human, from Orkney, Shetland and Ireland. | coast, sea |  | – |
| Kelpie | monster | ② | Malevolent | Shape-shifting water horse that drowns riders in Scottish lochs. | lake, river |  | – |
| Brownie | spirit | ② | Ambivalent | Helpful household spirit paid with a bowl of cream. | village |  | – |
| Red deer | animal | ② | Ambivalent | Stag of the Highlands and Irish forests. | highland, forest |  | – |
| Púca | spirit | ③ | Ambivalent | Shape-shifting goblin that appears as a dark horse, goat or hare. | highland, meadow |  | – |
| Cú Sídhe | beast | ③ | Ambivalent | Green fairy hound of the Scottish Highlands, the size of a calf. | highland, forest |  | – |
| Dullahan (dubhlachán) | undead | ③ | Malevolent | Headless horseman who carries his own head; a death omen. | village, meadow |  | – |
| Balor | monster | ③ | Malevolent | Fomorian giant whose single baleful eye destroys all it sees. | island, coast |  | – |
| Merrow (murúch) | spirit | ③ | Ambivalent | Irish mermaid or merman who wears a magic cap to dive. | coast, sea |  | – |
| Redcap | spirit | ③ | Ambivalent | Murderous goblin of Border ruins who dyes his cap in blood. | ruins |  | – |
| Cat sìth | beast | ③ | Ambivalent | Large black fairy cat of the Highlands with a white chest spot. | highland, forest |  | – |
| Nuckelavee | monster | ③ | Malevolent | Skinless horse-and-rider demon of Orkney's sea. | sea, coast |  | – |
| Ddraig Goch | beast | ③ | Benevolent | Welsh Red Dragon, emblem of Wales, in the Mabinogion. | mountain, highland |  | – |
| Irish wolfhound | animal | ③ | Ambivalent | Giant hound of Irish legend, like Cú Chulainn's namesake. | meadow, highland |  | – |
| Each-uisge | monster | ④ | Malevolent | Highland water horse, more savage than the kelpie, in sea lochs. | lake, coast |  | – |
| Fomorians (Fomóire) | monster | ④ | Malevolent | Misshapen, hostile race of Irish myth, oppressors of earlier settlers. | sea, island |  | – |
| Fear Dearg | spirit | ④ | Ambivalent | Red Man, solitary trickster fairy who plays cruel pranks. | village, meadow |  | – |
| Sluagh | undead | ④ | Malevolent | Host of the restless dead flying at night in the Scottish Highlands. | sky, highland |  | – |
| Bean-nighe | spirit | ④ | Ambivalent | Washer at the ford who cleans the clothes of those about to die. | river |  | – |
| Glaistig | spirit | ④ | Ambivalent | Half-woman, half-goat spirit of Highland glens. | highland |  | – |
| Blue Men of the Minch | spirit | ④ | Ambivalent | Storm-kelpies that challenge sailors to rhyming contests. | sea, coast |  | – |
| Spriggan | spirit | ④ | Ambivalent | Small, ugly guardian of Cornish ruins and treasure. | ruins |  | – |
| Knocker | spirit | ④ | Ambivalent | Cornish and Welsh mine spirit who raps at rich seams. | cave |  | – |
| Afanc | monster | ④ | Malevolent | Lake monster of Welsh legend, beaver- or crocodile-like. | lake |  | – |
| Gwyllgi | beast | ④ | Ambivalent | Black dog of Welsh folklore, a phantom of dark roads. | highland, village |  | – |
| Cŵn Annwn | beast | ④ | Ambivalent | White hounds with red ears that hunt souls, from the Otherworld. | sky, underworld |  | – |
| Mari Lwyd | construct | ④ | Ambivalent | Horse-skull wassailing figure of Welsh midwinter tradition. | village |  | – |
| Salmon of Knowledge | animal | ④ | Benevolent | Bradán Feasa, the fish that grants wisdom to whoever eats it first. | river |  | – |
| Oilliphéist | monster | ⑤ | Malevolent | Giant lake and river serpent of Irish legend. | lake, river |  | – |
| Gwragedd Annwn | spirit | ⑤ | Ambivalent | Welsh lake maidens who marry mortals under conditions. | lake |  | – |
| Twrch Trwyth | monster | ⑤ | Malevolent | Giant boar hunted by Arthur's men in Culhwch and Olwen. | forest, highland |  | – |
| Ceffyl Dŵr | monster | ⑤ | Malevolent | Welsh water horse that lures riders into rivers. | river |  | – |

## Aztec and wider Mesoamerican

New. Beyond Maya. Aztec and Nahua gods were removed (descendant communities and a Mexicanidad revival exist).

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Jaguar (ocelotl) | animal | ① | Ambivalent | Apex predator of Mesoamerica; emblem of Aztec warriors. | jungle, forest |  | – |
| Hummingbird (huitzilin) | animal | ① | Ambivalent | Tiny nectar-drinker revered by Aztecs as the soul of warriors. | forest, meadow |  | – |
| Axolotl | animal | ② | Ambivalent | Salamander of Lake Xochimilco that keeps its larval form. | lake |  | – |
| Golden eagle (cuauhtli) | animal | ② | Ambivalent | Bird of the sun, emblem of Aztec warriors and the Mexican flag. | sky, highland |  | – |
| Quetzal | animal | ② | Benevolent | Resplendent forest bird whose tail feathers marked rank. | jungle, sky |  | – |
| La Llorona | spirit | ③ | Malevolent | Weeping woman wandering rivers and calling for her lost children. | river, village |  | – |
| Alebrije | construct | ③ | Ambivalent | Brightly painted fantasy creatures of Oaxacan folk art, created in the 1930s. | city, village |  | – |
| Xoloitzcuintli | animal | ③ | Benevolent | Hairless dog that, in Aztec belief, guided the dead. | village, underworld |  | – |
| Feathered serpent (Teotihuacan) | monster | ③ | Malevolent | Fanged, feathered snake in Teotihuacan murals and temple carvings. | ruins |  | – |
| Mexican wolf | animal | ③ | Ambivalent | Small grey wolf of northern Mexico's canyons. | canyon, desert |  | – |
| Ahuizotl | monster | ④ | Malevolent | Dog-like water beast with a hand at the tail tip that drags people under. | lake, marsh |  | – |
| Nahual | spirit | ④ | Ambivalent | Human sorcerer who takes animal form, such as jaguar or dog. | forest, village |  | – |
| Cipactli | monster | ④ | Malevolent | Primordial earth-crocodile whose body became the land. | marsh, coast |  | – |
| Xiuhcoatl | monster | ④ | Malevolent | Fire serpent, a turquoise-scaled weapon in Aztec myth. | volcano, sky |  | – |
| Chaneque | spirit | ④ | Ambivalent | Small guardian spirits of forests, water and caves who steal one's soul. | forest, cave |  | – |
| La Lechuza | spirit | ④ | Malevolent | Witch in owl form from northern Mexican and Tejano folklore. | village, sky |  | – |
| Charro Negro | spirit | ④ | Malevolent | Black-clad rider on a black horse who offers deals at crossroads. | desert, village |  | – |
| Chac Mool | construct | ④ | Ambivalent | Reclining stone figure of Toltec and Maya art holding an offering bowl. | ruins |  | – |
| Olmec were-jaguar | spirit | ④ | Ambivalent | Half-human, half-jaguar figure with a downturned mouth in Olmec art. | jungle |  | – |

## Hindu and Indian

New. Folklore monsters and animals. Hindu gods, avatars and sacred mounts were removed (actively worshipped; game use has drawn protests).

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Bengal tiger | animal | ① | Ambivalent | Striped apex predator of the Sundarbans and Indian jungle. | jungle, forest |  | – |
| Asian elephant | animal | ① | Ambivalent | Largest land animal of India, a symbol of royal power. | jungle, forest |  | – |
| King cobra | animal | ① | Ambivalent | World's longest venomous snake, central to snake-charmer lore. | jungle, village |  | – |
| Indian peafowl | animal | ② | Ambivalent | Colourful national bird of India. | meadow, forest |  | – |
| Indian rhinoceros | animal | ② | Ambivalent | Armoured one-horned grazer of the Brahmaputra plains. | marsh, meadow |  | – |
| Asiatic lion | animal | ② | Ambivalent | Last wild lions of Asia live in Gir Forest. | meadow, forest |  | – |
| Snow leopard | animal | ② | Ambivalent | Elusive cat of the Himalayan heights. | mountain, ice |  | – |
| Rakshasa | monster | ③ | Malevolent | Shape-shifting, flesh-eating demon of Indian epics and folklore. | forest, ruins |  | – |
| Bhoot | undead | ③ | Malevolent | Restless ghost of one who died untimely or violently. | village, ruins |  | – |
| Gharial | animal | ③ | Ambivalent | Long-snouted fish-eating crocodilian of Indian rivers. | river |  | – |
| Hanuman langur | animal | ③ | Ambivalent | Grey monkey of temple towns and forests. | forest, village |  | – |
| Vetala | undead | ④ | Malevolent | Spirit that inhabits corpses; narrator of the Baital Pachisi tales. | tomb, forest |  | – |
| Pishacha | monster | ④ | Malevolent | Flesh-eating ghoul of Indian folklore, haunting cremation grounds. | tomb, ruins |  | – |
| Churel | undead | ④ | Malevolent | Vengeful ghost of a woman who died in childbirth, with backward feet. | village, forest |  | – |
| Chudail | spirit | ④ | Malevolent | Witch-like ghost woman of North Indian folklore. | village, forest |  | – |
| Yali (Vyala) | monster | ④ | Benevolent | Lion-elephant-horse composite carved on South Indian temple pillars. | ruins, city |  | – |
| Kinnara | spirit | ④ | Benevolent | Half-human, half-bird musician of Himalayan legend. | mountain, forest |  | – |
| Sarus crane | animal | ④ | Ambivalent | Tall pair-bonded crane, the tallest flying bird. | marsh, meadow |  | – |
| Brahmarakshasa | undead | ⑤ | Malevolent | Learned Brahmin turned fierce spirit by wrongs in life. | ruins, forest |  | – |
| Purushamriga | monster | ⑤ | Benevolent | Human-headed tiger of Indian temple art. | forest |  | – |

## Persian and Arabian

New. Folklore, epic and Arabian Nights creatures. The Zoroastrian divinities and the jinn were removed. Islamic prophets, angels and Buraq are excluded entirely (depiction of prophets is forbidden).

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Ghoul (ghūl) | monster | ① | Malevolent | Desert shape-shifter that lures travellers and eats corpses. | desert, tomb |  | – |
| Dromedary camel | animal | ① | Ambivalent | One-humped caravan beast of the Arabian deserts. | desert, oasis |  | – |
| Roc (Rukh) | beast | ② | Ambivalent | Giant bird in Sinbad's voyages able to carry elephants. | sky, island |  | – |
| Arabian horse | animal | ② | Ambivalent | Fine-boned, enduring desert horse prized by Bedouin. | desert, oasis |  | – |
| Simurgh | beast | ③ | Benevolent | Giant benevolent bird of the Shahnameh whose feathers heal. | mountain, sky |  | – |
| Peri | spirit | ③ | Benevolent | Winged fairy of Persian lore, once hunted by divs. | sky, mountain |  | – |
| Shahmaran | monster | ③ | Ambivalent | Queen of snakes with a woman's torso, from Anatolian and Kurdish lore. | cave, underworld |  | – |
| Arabian oryx | animal | ③ | Ambivalent | White antelope of the deserts, perhaps the root of unicorn tales. | desert |  | – |
| Saker falcon | animal | ③ | Ambivalent | Falconry bird of the Gulf and steppe. | desert, sky |  | – |
| Barbary lion | animal | ③ | Ambivalent | Extinct North African lion kept in royal menageries. | desert, highland |  | – |
| Huma | beast | ④ | Benevolent | Legendary bird that never lands; its shadow grants kingship. | sky |  | – |
| Karkadann | beast | ④ | Benevolent | One-horned Persian and Arabian beast like a rhinoceros or unicorn. | desert, jungle |  | – |
| Div | monster | ④ | Malevolent | Horned demon-giant of Persian epics. | mountain, ruins |  | – |
| Anqa | beast | ④ | Benevolent | Giant mythical bird of Arabian lore, later linked to the phoenix. | mountain, sky |  | – |
| Zahhak (Aždahā) | monster | ④ | Malevolent | Tyrant with serpents on his shoulders in the Shahnameh. | mountain |  | – |
| Rakhsh | beast | ④ | Benevolent | Rostam's loyal, lion-slaying horse. | desert, highland |  | – |
| Div-e Sepid | monster | ⑤ | Malevolent | White Demon of Mazandaran slain by Rostam in the Shahnameh. | mountain, cave |  | – |
| Si'lat | monster | ⑤ | Malevolent | Cunning female ghoul-like demon of Arabian folklore. | desert |  | – |
| Qutrub | monster | ⑤ | Malevolent | Night-prowling, shape-changing desert ghoul. | desert |  | – |
| Nasnas | monster | ⑤ | Malevolent | Half-man creature hopping on a single leg, in Arabian lore. | desert |  | – |

## Mesopotamian

New. Mesopotamian religion is no longer practised; gods appear with 🟢 flags next to demons, monsters and guardian creatures.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Lion (ur) | animal | ① | Ambivalent | Lion of Babylon, royal beast, depicted in hunting reliefs. | desert, meadow |  | – |
| Lamassu | construct | ③ | Benevolent | Winged bull or lion with a human head, carved as a palace gate guardian. | city, ruins |  | – |
| Mušḫuššu | monster | ③ | Ambivalent | Scaled, horned serpent-dragon with lion forelimbs and bird hind legs. | city, ruins |  | – |
| Anzû | monster | ③ | Ambivalent | Lion-headed eagle who stole the Tablet of Destinies. | sky, mountain |  | – |
| Humbaba (Huwawa) | monster | ③ | Malevolent | Fearsome guardian of the Cedar Forest slain by Gilgamesh. | forest |  | – |
| Bull of Heaven | monster | ③ | Malevolent | Great bull sent against Gilgamesh and Enkidu by an offended deity. | sky, city |  | – |
| Lamashtu | monster | ③ | Malevolent | Lion-headed demoness who attacks infants and mothers. | underworld, village |  | – |
| Pazuzu | monster | ③ | Malevolent | Winged king of wind demons with a canine face and scorpion tail, who drives off Lamashtu. | desert, sky |  | – |
| Aurochs (rimu) | animal | ③ | Ambivalent | Wild bull of Mesopotamia, symbol of strength on the Ishtar Gate. | meadow, marsh |  | – |
| Marduk | deity | ③ | Benevolent | Patron god of Babylon who slew Tiamat and shaped the world from her body. | city |  | 🟢 |
| Ishtar (Inanna) | deity | ③ | Ambivalent | Goddess of love and war who descended to the underworld. | city |  | 🟢 |
| Tiamat | deity-beast | ③ | Malevolent | Primeval saltwater dragon-mother in the Enūma Eliš. | sea |  | 🟢 |
| Ereshkigal | deity | ③ | Ambivalent | Queen of the underworld and sister of Inanna. | underworld |  | 🟢 |
| Shedu | construct | ④ | Benevolent | Protective winged bull-spirit, the male counterpart of the lamassu. | city, ruins |  | – |
| Bašmu | monster | ④ | Malevolent | Horned, fanged, winged serpent in Sumerian and Akkadian texts. | marsh, underworld |  | – |
| Kusarikku | monster | ④ | Malevolent | Bull-man who supports the sun disk or guards a gate. | meadow, ruins |  | – |
| Apkallu | spirit | ④ | Benevolent | Sages in fish-cloaks or bird form who taught civilisation. | sea, city |  | – |
| Edimmu | undead | ④ | Malevolent | Restless ghost of the unburied, haunting the living. | tomb, desert |  | – |
| Gallu | monster | ④ | Malevolent | Underworld demons who drag souls to the netherworld. | underworld |  | – |
| Asag | monster | ④ | Malevolent | Sumerian demon of sickness defeated by Ninurta. | mountain, underworld |  | – |
| Euphrates softshell turtle | animal | ④ | Ambivalent | Large river turtle of Mesopotamian waters. | river, marsh |  | – |
| Enki (Ea) | deity | ④ | Benevolent | God of fresh water, wisdom and craft who warned Utnapishtim of the flood. | river |  | 🟢 |
| Enlil | deity | ④ | Benevolent | God of wind and storm, king of the gods at Nippur. | sky |  | 🟢 |
| Anu | deity | ④ | Benevolent | Sky father at the head of the pantheon. | sky |  | 🟢 |
| Nergal | deity | ④ | Ambivalent | God of plague, war and the underworld. | underworld |  | 🟢 |
| Shamash | deity | ④ | Benevolent | Sun god and judge of justice and law. | sky |  | 🟢 |
| Nanna (Sin) | deity | ④ | Benevolent | Moon god of Ur. | sky |  | 🟢 |
| Dumuzi (Tammuz) | deity | ④ | Benevolent | Shepherd god who spends part of the year in the underworld. | meadow |  | 🟢 |
| Adad | deity | ④ | Benevolent | Storm god of thunder and rain. | sky |  | 🟢 |
| Ninurta | deity | ④ | Benevolent | Warrior god who defeated Anzû. | mountain |  | 🟢 |
| Mušmaḫḫu | monster | ⑤ | Malevolent | Seven-headed serpent monster of Sumerian lore. | marsh |  | – |
| Girtablullu | monster | ⑤ | Malevolent | Scorpion-man guard of the gate of the sun at Mashu. | desert, mountain |  | – |
| Ugallu | monster | ⑤ | Malevolent | Lion-headed storm demon, a protective apotropaic spirit. | sky, ruins |  | – |
| Uridimmu | monster | ⑤ | Malevolent | Mad-dog man, an apotropaic guardian figure. | ruins |  | – |
| Kulullu | monster | ⑤ | Malevolent | Fish-man guardian of the Apsu waters. | sea, marsh |  | – |
| Namtar | spirit | ⑤ | Ambivalent | Vizier of the underworld and bringer of plague. | underworld |  | – |
| Ninhursag | deity | ⑤ | Benevolent | Mother goddess of the mountains. | mountain |  | 🟢 |

## African (several traditions)

New. Traditions are named per entry. Orisha, Vodun and other deities of living traditions were removed.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Lion | animal | ① | Ambivalent | Pride predator of the African savanna. | meadow, desert |  | – |
| African elephant | animal | ① | Ambivalent | Largest land animal, a figure of wisdom in many tales. | meadow, jungle |  | – |
| Leopard | animal | ① | Ambivalent | Tree-climbing ambusher of forests and savanna. | forest, jungle |  | – |
| Hippopotamus | animal | ① | Ambivalent | River-dwelling heavyweight, among Africa's most dangerous animals. | river, lake |  | – |
| Nile crocodile | animal | ① | Ambivalent | Ambush predator of African rivers. | river, marsh |  | – |
| Gorilla | animal | ① | Ambivalent | Giant forest ape. | jungle, forest |  | – |
| Ostrich | animal | ① | Ambivalent | Flightless runner, the biggest living bird. | desert, meadow |  | – |
| Spotted hyena | animal | ② | Ambivalent | Clan predator of the savanna, often a trickster in tales. | meadow, desert |  | – |
| Black rhinoceros | animal | ② | Ambivalent | Armoured, short-sighted browser of the savanna. | meadow |  | – |
| Black mamba | animal | ② | Ambivalent | Fast, highly venomous snake of the savanna. | meadow, desert |  | – |
| Fennec fox | animal | ② | Ambivalent | Large-eared desert fox of the Sahara. | desert |  | – |
| Anansi (Akan, Ghana) | spirit | ③ | Ambivalent | Spider trickster of folk tales who outwits larger beasts. | forest, village |  | – |
| Tokoloshe (Zulu/Xhosa) | spirit | ③ | Malevolent | Mischievous water sprite who torments sleepers. | river, village |  | – |
| Mokele-mbembe (Congo) | beast | ③ | Ambivalent | River beast of the Congo Basin reported as dinosaur-like. | marsh, jungle, river |  | – |
| Secretary bird | animal | ③ | Ambivalent | Long-legged raptor that stamps snakes to death. | meadow, desert |  | – |
| Sasabonsam (Akan, Ghana) | monster | ④ | Malevolent | Forest vampire-like creature with iron teeth and hooked legs who sits in trees. | forest |  | – |
| Impundulu (Zulu/Xhosa) | monster | ④ | Malevolent | Lightning bird, a witch's familiar that brings storms. | sky, highland |  | – |
| Inkanyamba (Zulu) | monster | ④ | Malevolent | Giant serpent-like storm creature of KwaZulu-Natal waterfalls. | river, sky |  | – |
| Grootslang (South Africa) | monster | ④ | Malevolent | Giant elephant-headed serpent in the Richtersveld cave legend. | cave, mountain |  | – |
| Ninki Nanka (West Africa) | monster | ④ | Malevolent | Giant dragon-like swamp reptile of the Gambia and Guinea region. | marsh, river |  | – |
| Popobawa (Zanzibar) | monster | ④ | Malevolent | One-eyed, bat-winged night spirit of Zanzibar and Pemba. | village, coast |  | – |
| Mngwa (Swahili coast) | beast | ④ | Ambivalent | Giant grey striped cat said to haunt Tanzania's coast. | forest, coast |  | – |
| Bida (Soninke, Wagadu) | monster | ⑤ | Malevolent | Great serpent of the Wagadu legend demanding a maiden. | river |  | – |
| Kishi (Mbundu, Angola) | monster | ⑤ | Malevolent | Two-faced demon with a handsome face and a hyena's head on the back. | village, forest |  | – |
| Kalanoro (Madagascar) | spirit | ⑤ | Ambivalent | Small hairy forest folk of Malagasy folklore. | forest, jungle |  | – |
| Mmoatia (Akan, Ghana) | spirit | ⑤ | Ambivalent | Small forest dwarf with backward feet who steals and aids hunters. | forest |  | – |

## Polynesian, Māori and Hawaiian

New. Folklore beings and animals. Māori and Hawaiian gods were removed; ʻaumakua ancestral guardians and tiki are left out.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Humpback whale | animal | ① | Ambivalent | Great migratory singer of Pacific waters. | sea |  | – |
| Green sea turtle (honu) | animal | ① | Ambivalent | Long-lived reef grazer, widely loved across Polynesia. | coast, sea |  | – |
| Kiwi | animal | ② | Ambivalent | Flightless, nocturnal ground bird and national symbol. | forest |  | – |
| Hammerhead shark | animal | ② | Ambivalent | Predator of tropical reefs, in Pacific seafaring lore. | sea, coast |  | – |
| Taniwha (Māori) | monster | ③ | Ambivalent | Water or cave-dwelling creature that guards or menaces a tribe's river, lake or coast. | river, lake, coast |  | – |
| Menehune (Hawaiian) | spirit | ③ | Ambivalent | Small, skilled builders who work only at night, in Hawaiian folklore. | forest, village |  | – |
| Moa (Māori) | animal | ③ | Ambivalent | Giant flightless bird of New Zealand, hunted to extinction. | forest, highland |  | – |
| Tuatara | animal | ③ | Ambivalent | Ancient lizard-like reptile of New Zealand's islands. | island, coast |  | – |
| Coconut crab | animal | ③ | Ambivalent | Giant land crab that climbs palms and cracks coconuts. | island, coast |  | – |
| Patupaiarehe (Māori) | spirit | ④ | Ambivalent | Pale, fair-haired fairy folk of misty hills and forests. | mountain, forest |  | – |
| Pouākai (Māori) | monster | ④ | Malevolent | Giant man-eating bird of legend, often linked to the extinct Haast's eagle. | mountain, sky |  | – |
| Te Wheke-a-Muturangi (Māori) | monster | ④ | Malevolent | Giant octopus pursued by the navigator Kupe across the sea. | sea |  | – |
| Marakihau (Māori) | monster | ④ | Ambivalent | Sea being with a tubular tongue that sucks canoes under. | sea, coast |  | – |
| Maero (Māori) | monster | ④ | Malevolent | Wild, long-armed giants of the mountain forests. | forest, mountain |  | – |
| Hōkioi (Māori) | monster | ④ | Malevolent | Giant bird of ill omen whose cry was heard but rarely seen. | sky, highland |  | – |
| Kōtuku (Māori) | animal | ④ | Benevolent | White heron seen as a rare and treasured visitor. | marsh, coast |  | – |
| Pūkeko | animal | ④ | Ambivalent | Blue swamphen of New Zealand wetlands. | marsh |  | – |
| Tūī | animal | ④ | Benevolent | Songbird with white throat tufts and the ability to mimic. | forest |  | – |
| Frigatebird | animal | ④ | Ambivalent | Seabird used by navigators to find land. | sea, sky |  | – |
| Ponaturi (Māori) | monster | ⑤ | Malevolent | Sea goblins who live underwater by night and are killed by daylight. | coast, sea |  | – |

## Inca and Andean

New. Folklore creatures and animals. Andean gods were removed (Pachamama and the Apus are still honoured).

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Puma | animal | ① | Ambivalent | Mountain cat; Cusco was said to be laid out in its shape. | highland, mountain |  | – |
| Llama | animal | ① | Ambivalent | Pack animal of the high Andes. | highland |  | – |
| Alpaca | animal | ① | Ambivalent | Wool-bearing camelid bred in the Andes. | highland, meadow |  | – |
| Guinea pig (cuy) | animal | ① | Ambivalent | Domesticated rodent raised in Andean homes since ancient times. | village, highland |  | – |
| Andean condor | animal | ② | Benevolent | Giant vulture of the Andes with a three-metre wingspan. | mountain, sky |  | – |
| Spectacled bear | animal | ② | Ambivalent | South America's only bear, with pale rings around its eyes. | forest, mountain |  | – |
| Vicuña | animal | ③ | Ambivalent | Wild, fine-wool camelid of the high plateaus. | highland |  | – |
| Andean cock-of-the-rock | animal | ③ | Ambivalent | Bright-red cloud-forest bird with elaborate lek displays. | forest, jungle |  | – |
| Nazca hummingbird | animal | ③ | Ambivalent | Giant desert line drawing, among the Nazca geoglyphs. | desert, ruins |  | – |
| Nazca spider | animal | ③ | Ambivalent | Nazca desert geoglyph of an arachnid. | desert, ruins |  | – |
| Yacumama | monster | ④ | Malevolent | Giant water serpent mother of the Amazon-Andes rivers. | river, jungle |  | – |
| Sachamama | monster | ④ | Malevolent | Giant, moss-covered tree-serpent of the Amazonian forest. | jungle, forest |  | – |
| Chullachaqui | spirit | ④ | Ambivalent | Shape-shifting forest guardian with one odd foot. | jungle, forest |  | – |
| Supay | monster | ④ | Malevolent | Underworld spirit from the Ukhu Pacha, later cast as a devil under colonial rule. | underworld, mountain |  | – |
| Andean fox (atoq) | animal | ④ | Ambivalent | Trickster of Andean folktales, with a grey-red coat. | highland, canyon |  | – |
| Viscacha | animal | ④ | Ambivalent | Rabbit-like rock-dweller of high Andean cliffs. | mountain, highland |  | – |
| Runamula | monster | ⑤ | Malevolent | Woman-turned-mule at night, with flame at the tail, in Peruvian folklore. | village, jungle |  | – |
| Jarjacha | monster | ⑤ | Malevolent | Llama-headed ghost of people who broke family taboos, in Quechua folklore. | highland, village |  | – |
| Condenado | undead | ⑤ | Malevolent | Damned soul that wanders Andean mountains after death. | mountain, highland |  | – |
| Tunche | spirit | ⑤ | Malevolent | Whistling forest spirit of the Peruvian Amazon. | jungle |  | – |

## Southeast Asian (Philippines, Thailand, Malay world, Indonesia, Vietnam)

New. Country in brackets. The Balinese, Javanese and Tagalog deities were removed; Buddha images are left out.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Orangutan | animal | ① | Ambivalent | Red-haired great ape of Borneo and Sumatra. | jungle, forest |  | – |
| Tarsier (PH) | animal | ② | Ambivalent | Tiny large-eyed primate of Bohol. | forest |  | – |
| Komodo dragon (ID) | animal | ② | Ambivalent | World's largest lizard, from the Lesser Sunda Islands. | island, coast |  | – |
| Aswang (PH) | monster | ③ | Malevolent | Shape-shifting ghoul and vampire-witch of the Visayas that preys on the sick and unborn. | village, forest |  | – |
| Manananggal (PH) | monster | ③ | Malevolent | Woman whose upper body detaches with wings to hunt at night. | village, sky |  | – |
| Tikbalang (PH) | monster | ③ | Ambivalent | Horse-headed, long-limbed trickster that misleads travellers in the mountains. | forest, mountain |  | – |
| Kapre (PH) | monster | ③ | Ambivalent | Tall, hairy tree giant who smokes a huge cigar. | forest |  | – |
| Philippine eagle (PH) | animal | ③ | Ambivalent | Giant monkey-eating eagle of the Philippines' forests. | forest, sky |  | – |
| Pontianak (MY/ID) | undead | ③ | Malevolent | Long-haired woman ghost with a fragrant frangipani smell who kills men. | village, forest |  | – |
| Pocong (ID) | undead | ③ | Malevolent | Hopping corpse wrapped in a white burial shroud. | village, tomb |  | – |
| Kuntilanak (ID) | undead | ③ | Malevolent | Female spirit in white with long hair, haunting banana trees. | village, forest |  | – |
| Javan rhinoceros | animal | ③ | Ambivalent | Critically endangered rhino of Ujung Kulon. | jungle |  | – |
| Rồng (VN) | beast | ③ | Benevolent | Vietnamese dragon, a water and rain-bringing creature. | river, sea, sky |  | – |
| Tiyanak (PH) | monster | ④ | Malevolent | Infant-like creature that cries to lure travellers into the forest. | forest, village |  | – |
| Duwende (PH) | spirit | ④ | Ambivalent | Small spirit living in mounds and houses, kind or vindictive. | village, forest |  | – |
| Bakunawa (PH) | monster | ④ | Malevolent | Moon-eating sea serpent of Visayan lore, causing eclipses. | sea, sky |  | – |
| Sarimanok (PH) | beast | ④ | Benevolent | Mythical rooster of the Maranao with vivid plumage and a fish in its beak. | village, sky |  | – |
| Phi Krasue (TH) | undead | ④ | Malevolent | Floating woman's head trailing entrails with a glowing light. | village, forest |  | – |
| Nang Tani (TH) | spirit | ④ | Ambivalent | Female banana-tree spirit, a ghost of old trees. | forest |  | – |
| Mae Nak (TH) | undead | ④ | Malevolent | Ghost wife of Phra Khanong who waits for her husband. | river, village |  | – |
| Kinnari (TH) | spirit | ④ | Benevolent | Half-bird, half-woman dancer of Himavanta forest. | forest, sky |  | – |
| Hongsa (TH) | beast | ④ | Benevolent | Mythical swan or goose of Himavanta, a motif of royal barges. | lake, sky |  | – |
| Singha (TH) | beast | ④ | Benevolent | Lion guardian beast of Thai temples. | city |  | – |
| Yak (TH) | monster | ④ | Malevolent | Giant guardians with fanged faces at Wat Phra Kaew. | city |  | – |
| Penanggalan (MY) | monster | ④ | Malevolent | Flying head trailing entrails, preying on mothers and newborns. | village, forest |  | – |
| Orang Bunian (MY/ID) | spirit | ④ | Ambivalent | Invisible forest folk who live in a parallel world. | forest, mountain |  | – |
| Toyol (MY) | spirit | ④ | Malevolent | Child-like familiar made to steal for its master. | village |  | – |
| Genderuwo (ID) | monster | ④ | Malevolent | Hairy, tall ape-like spirit of Javanese lore that lives in old trees. | forest |  | – |
| Leyak (ID, Bali) | monster | ④ | Malevolent | Flying head with entrails in Balinese folklore, a black-magic practitioner. | village, forest |  | – |
| Tuyul (ID) | spirit | ④ | Malevolent | Small child-like thief familiar of Indonesian folklore. | village |  | – |
| Hồ ly tinh (VN) | spirit | ④ | Ambivalent | Fox spirit that takes female human form to deceive. | forest, village |  | – |
| Santelmo (PH) | spirit | ⑤ | Ambivalent | Fireball spirit seen over cemeteries, similar to St Elmo's fire. | coast, tomb |  | – |
| Berberoka (PH) | monster | ⑤ | Malevolent | Giant water-sucking creature of Philippine rivers that traps people. | river, marsh |  | – |
| Bungisngis (PH) | monster | ⑤ | Malevolent | One-eyed, laughing giant of Philippine folk tales. | forest, mountain |  | – |
| Phi Pop (TH) | undead | ⑤ | Malevolent | Hungry ghost that possesses people and eats raw flesh. | village |  | – |
| Hantu Air (MY) | spirit | ⑤ | Ambivalent | Water ghost that drowns swimmers in rivers and swamps. | river, marsh |  | – |
| Buto Ijo (ID) | monster | ⑤ | Malevolent | Green giant ogre from Javanese folk tales. | forest |  | – |
| Wewe Gombel (ID) | spirit | ⑤ | Ambivalent | Elderly woman spirit that takes neglected children. | village, forest |  | – |
| Thần Kim Quy (VN) | beast | ⑤ | Benevolent | Golden Turtle that lends its claw for a magic crossbow in the Cổ Loa legend. | lake, river |  | – |
| Thuồng luồng (VN) | monster | ⑤ | Malevolent | Giant water serpent that drowns people in rivers and swamps. | river, marsh |  | – |
| Ma da (VN) | spirit | ⑤ | Ambivalent | Water ghost that pulls bathers into rivers. | river, lake |  | – |
| Ma lai (VN) | monster | ⑤ | Malevolent | Flying female head that trails organs and feeds at night. | village, forest |  | – |

## Mongol, Turkic and Siberian

New. Tengri, Umay, Erlik and Ülgen were removed; shamanic ongon figures are left out.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Mammoth | animal | ① | Ambivalent | Giant woolly elephant of the Ice Age steppe and Siberian tales. | ice, steppe |  | – |
| Bactrian camel | animal | ② | Ambivalent | Two-humped caravan beast of cold deserts. | desert, steppe |  | – |
| Snow leopard | animal | ② | Ambivalent | Mountain cat of Central Asia. | mountain, ice |  | – |
| Golden eagle | animal | ② | Ambivalent | Hunting bird of Mongol and Kazakh falconers. | steppe, sky |  | – |
| Yak | animal | ② | Ambivalent | Shaggy highland ox of the Himalayas and Mongolian mountains. | highland, ice |  | – |
| Siberian tiger | animal | ② | Ambivalent | Great cat of the Russian Far East forest. | forest, ice |  | – |
| Przewalski's horse (takhi) | animal | ③ | Ambivalent | Wild horse of the Mongolian steppe, saved from extinction. | steppe |  | – |
| Saiga antelope | animal | ③ | Ambivalent | Large-nosed antelope of the dry steppe. | steppe |  | – |
| Almas (Mongol) | beast | ④ | Ambivalent | Wild, hairy man-like creature of the Altai and Gobi. | mountain, desert |  | – |
| Khan Garid (Mongol) | beast | ④ | Benevolent | Mongol Garuda-like giant bird. | sky, mountain |  | – |
| Tulpar (Turkic) | beast | ④ | Benevolent | Winged horse of Kazakh, Turkic and Central Asian folklore. | steppe, sky |  | – |
| Shurale (Tatar, Bashkir) | spirit | ④ | Malevolent | Horned forest spirit that tickles travellers to death. | forest |  | – |
| Albasty (Turkic) | spirit | ④ | Malevolent | Childbirth demon in Central Asian lore, an old woman with matted hair. | village, steppe |  | – |
| Ubyr (Tatar) | undead | ④ | Malevolent | Vampire-like witch that drinks blood or takes the form of a night creature. | village, forest |  | – |
| Zilant (Tatar) | monster | ④ | Malevolent | Winged dragon-serpent of Kazan, a city emblem. | city, sky |  | – |
| Tepegöz (Oghuz) | monster | ④ | Malevolent | One-eyed man-eating giant in the Book of Dede Korkut. | cave, mountain |  | – |
| Lus (Mongol) | monster | ⑤ | Malevolent | Water-dragon spirits that rule rivers and springs. | river, lake |  | – |
| Yer-su (Turkic) | spirit | ⑤ | Ambivalent | Land and water spirits invoked in Turkic folklore. | steppe, river |  | – |
| Chuchunaa (Yakut) | beast | ⑤ | Malevolent | Hairy, tall wild man of Siberian forests and a figure of fear. | forest, ice |  | – |
| Abaasy (Yakut) | monster | ⑤ | Malevolent | Spirits of illness and evil in Sakha folklore. | ice, forest |  | – |
| Mangus (Evenki) | monster | ⑤ | Malevolent | Many-headed monster of Siberian epics. | forest, ice |  | – |

## Medieval European bestiary and heraldry

New. Creatures from medieval bestiaries, romances and coats of arms. Biblical figures and saints are left out.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Unicorn | beast | ① | Benevolent | One-horned creature only tamed by a maiden; its horn purifies water. | forest, meadow |  | – |
| Dragon (Saint George's) | monster | ① | Malevolent | Western dragon with wings and fire, as in dragon-slayer tales. | mountain, cave |  | – |
| Phoenix | beast | ① | Benevolent | Bird that burns and is reborn, in the bestiaries. | sky, desert |  | – |
| Gargoyle | construct | ① | Ambivalent | Stone rainwater spout carved as a monster, protector of cathedrals. | city, ruins |  | – |
| Basilisk | monster | ② | Malevolent | Serpent king whose gaze or breath kills; hatched from a cock's egg. | cave, ruins |  | – |
| Manticore | monster | ② | Malevolent | Man-faced lion with porcupine quills and a scorpion tail. | desert, jungle |  | – |
| Golem | construct | ② | Ambivalent | Clay figure animated by letters or a word, in Prague folklore. | city, ruins |  | – |
| Hippogriff | beast | ② | Ambivalent | Eagle-horse hybrid in Ariosto's Orlando Furioso. | sky, highland |  | – |
| Heraldic lion rampant | animal | ② | Ambivalent | Lion standing on hind legs, the commonest beast in heraldry. | city, highland |  | – |
| Cockatrice | monster | ③ | Malevolent | Rooster-serpent hybrid whose stare turns to stone. | ruins, cave |  | – |
| Wyvern | monster | ③ | Malevolent | Two-legged winged dragon, common in heraldry. | mountain, sky |  | – |
| Melusine | spirit | ③ | Ambivalent | Water spirit who is a serpent from the waist down, ancestress of a French house. | lake, river |  | – |
| Salamander | beast | ③ | Ambivalent | Fire-dwelling lizard that cannot be burned. | volcano |  | – |
| Cynocephalus | monster | ③ | Ambivalent | Dog-headed man from medieval travel writing. | desert |  | – |
| Loup-garou | monster | ③ | Malevolent | French werewolf of medieval lore. | forest, village |  | – |
| Reynard the Fox | beast | ③ | Ambivalent | Cunning fox of the medieval Reynard cycle. | forest, village |  | – |
| White hart | animal | ③ | Benevolent | White stag, Richard II's badge and a romance quarry. | forest |  | – |
| Double-headed eagle | animal | ③ | Ambivalent | Heraldic eagle of the Holy Roman and Byzantine empires. | sky, city |  | – |
| Amphisbaena | monster | ④ | Ambivalent | Snake with a head at each end. | desert, ruins |  | – |
| Pelican in her piety | beast | ④ | Benevolent | Bird that wounds her breast to feed her young. | lake, coast |  | – |
| Caladrius | beast | ④ | Benevolent | White bird that foretells whether a sick man will recover. | sky, city |  | – |
| Bonnacon | beast | ④ | Ambivalent | Bull-like beast that sprays burning dung in retreat. | meadow, highland |  | – |
| Leucrota | beast | ④ | Ambivalent | Swift, badger-lion-like beast with a hyena's voice. | meadow |  | – |
| Yale | beast | ④ | Ambivalent | Heraldic goat-antelope with swivelling horns and tusks. | meadow |  | – |
| Blemmyae | monster | ④ | Ambivalent | Headless people with faces on the chest in Pliny and Mandeville. | desert, jungle |  | – |
| Sciapod | monster | ④ | Ambivalent | One-legged being that shades itself with its giant foot. | desert |  | – |
| Tarasque | monster | ④ | Ambivalent | Provençal dragon-like beast with a turtle shell and a lion's body. | river, marsh |  | – |
| Barghest | beast | ④ | Ambivalent | Black dog, a ghostly omen of death in northern England. | highland, village |  | – |
| Wodewose | monster | ④ | Ambivalent | Hairy wild man of the woods in medieval art and heraldry. | forest |  | – |
| Questing Beast | monster | ④ | Ambivalent | Serpent-headed, leopard-bodied creature hunted in Arthurian tales. | forest |  | – |

## Finnish, Sámi and Baltic

New. Folklore beings, Kalevala creatures and animals; the Finnish gods (🟢) are kept and the Baltic gods removed.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Reindeer | animal | ① | Ambivalent | Herded animal of Lapland and the Nordic north. | ice, highland |  | – |
| Brown bear | animal | ① | Ambivalent | Forest lord; revered in old Finnish bear rites. | forest |  | – |
| Eurasian elk (moose) | animal | ② | Ambivalent | Giant deer of the boreal forest. | forest, marsh |  | – |
| Tonttu (Finnish) | spirit | ③ | Ambivalent | House spirit protecting farm and family. | village |  | – |
| Whooper swan | animal | ③ | Ambivalent | Finland's national bird, a white swan of northern lakes. | lake, marsh |  | – |
| Wolverine | animal | ③ | Ambivalent | Fierce mustelid of the northern taiga. | forest, ice |  | – |
| Great grey owl | animal | ③ | Ambivalent | Giant silent owl of the boreal forest. | forest |  | – |
| Ukko | deity | ③ | Benevolent | Finnish sky and thunder god, invoked with a hammer. | sky |  | 🟢 |
| Väinämöinen | deity | ③ | Benevolent | Old sage and singer of the Kalevala with a magic kantele. | island |  | 🟢 |
| Hiisi (Finnish) | monster | ④ | Malevolent | Forest demon or sacred grove spirit that became a devil in folklore. | forest, mountain |  | – |
| Hiiden hirvi (Finnish) | beast | ④ | Ambivalent | Demonic elk of the Kalevala that Lemminkäinen hunts on skis. | forest, ice |  | – |
| Tuonen joutsen (Finnish) | beast | ④ | Ambivalent | Black swan of Tuonela's river, in the Lemminkäinen story. | river, underworld |  | – |
| Iku-Turso (Finnish) | monster | ④ | Malevolent | Sea monster of the Kalevala, a huge octopus-like beast. | sea |  | – |
| Louhi (Finnish) | spirit | ④ | Malevolent | Witch-queen of Pohjola, shape-shifter and sampo-keeper. | ice |  | – |
| Näkki (Finnish) | spirit | ④ | Malevolent | Water spirit lurking at lake shores to pull children under. | lake |  | – |
| Peikko (Finnish) | monster | ④ | Malevolent | Troll-like forest monster. | forest, mountain |  | – |
| Kratti (Finnish) | construct | ④ | Ambivalent | Straw-and-twig servant made to steal for its master. | village, forest |  | – |
| Stállu (Sámi) | monster | ④ | Malevolent | Cunning giant ogre of Sámi folk tales who dupes people. | mountain, ice |  | – |
| Aitvaras (Lithuanian) | spirit | ④ | Ambivalent | Flying household dragon or rooster that brings wealth to its master. | village, sky |  | – |
| Vilkacis (Latvian) | monster | ④ | Malevolent | Werewolf of Latvian folklore. | forest |  | – |
| Kratt (Estonian) | construct | ④ | Ambivalent | Estonian treasure-carrying servant made of hay or old household items. | village |  | – |
| Velnias (Lithuanian) | monster | ④ | Malevolent | Devil of Lithuanian folk tales, prone to being tricked. | forest, marsh |  | – |
| Tapio | deity | ④ | Benevolent | Finnish forest lord. | forest |  | 🟢 |
| Ilmatar | deity | ④ | Benevolent | Air maiden of the Kalevala whose egg-fragments form the world. | sky |  | 🟢 |
| Menninkäinen (Finnish) | spirit | ⑤ | Ambivalent | Underground small folk of Finnish lore. | forest, cave |  | – |
| Kalma (Finnish) | spirit | ⑤ | Malevolent | Spirit of the grave that haunts death places. | tomb, marsh |  | – |
| Gufihtar (Sámi) | spirit | ⑤ | Ambivalent | Underground folk of Sámi tales with their own herds. | highland, cave |  | – |
| Kaukas (Lithuanian) | spirit | ⑤ | Ambivalent | Small helpful household sprite. | village |  | – |
| Raganos (Lithuanian) | spirit | ⑤ | Ambivalent | Witches of Lithuanian folklore who brew harm. | forest, village |  | – |
| Žaltys (Lithuanian) | animal | ⑤ | Ambivalent | Grass snake kept in homes as a bringer of luck. | village, meadow |  | – |
| Eglė the Queen of Serpents (Lithuanian) | spirit | ⑤ | Ambivalent | Maiden who marries a sea-serpent king in a folk tale. | sea, forest |  | – |
| Pūķis (Latvian) | spirit | ⑤ | Ambivalent | Fiery house dragon that carries gold to its master. | village, sky |  | – |

## Modern cryptids

New. Reported or legendary creatures of modern folklore. Nothing here is a sacred figure.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Bigfoot (Sasquatch) | beast | ① | Ambivalent | Tall ape-like biped reported in the forests of the Pacific Northwest. | forest, mountain |  | – |
| Yeti | beast | ① | Ambivalent | Himalayan snow-dwelling ape-man. | ice, mountain |  | – |
| Loch Ness Monster (Nessie) | monster | ① | Ambivalent | Long-necked lake creature reported in Loch Ness since 1933. | lake |  | – |
| Chupacabra | monster | ② | Malevolent | Livestock-draining creature first reported in Puerto Rico in 1995. | desert, village |  | – |
| Mothman | monster | ② | Ambivalent | Winged red-eyed humanoid seen near Point Pleasant, West Virginia, in 1966-67. | sky, village |  | – |
| Jersey Devil | monster | ③ | Malevolent | Winged, hoofed creature of the New Jersey Pine Barrens. | forest |  | – |
| Champ | monster | ③ | Ambivalent | Lake Champlain serpent. | lake |  | – |
| Mongolian Death Worm | monster | ③ | Malevolent | Red sand-dwelling worm that spits acid or shocks, in the Gobi. | desert |  | – |
| Black Shuck | beast | ③ | Ambivalent | Huge black dog of East Anglian folklore, a death omen. | coast, village |  | – |
| Jackalope | beast | ③ | Ambivalent | Antlered jackrabbit of American West humour, from a 1930s taxidermy hoax. | desert, meadow |  | – |
| Beast of Gévaudan | monster | ③ | Malevolent | Wolf-like killer of 1760s France that attacked many people. | forest, highland |  | – |
| Thylacine survivals | beast | ③ | Ambivalent | Reported surviving Tasmanian tiger, a real extinct marsupial. | forest, highland |  | – |
| Ogopogo | monster | ④ | Ambivalent | Serpentine lake creature of Okanagan Lake in British Columbia (modern sightings). | lake |  | – |
| Skunk Ape | beast | ④ | Ambivalent | Foul-smelling ape-man of the Florida swamps. | marsh |  | – |
| Flatwoods Monster | monster | ④ | Ambivalent | Tall, hooded alien-like figure reported in West Virginia in 1952. | forest, highland |  | – |
| Dover Demon | monster | ④ | Ambivalent | Orange, large-headed creature sighted in Massachusetts in 1977. | forest |  | – |
| Orang Pendek | beast | ④ | Ambivalent | Short, hairy ape-man reported in Sumatran forests. | jungle |  | – |
| Ahool | beast | ④ | Ambivalent | Giant bat reported in Java. | jungle, sky |  | – |
| Ropen | monster | ④ | Ambivalent | Glowing flying creature reported in Papua New Guinea. | sky, jungle |  | – |
| Kongamato | monster | ④ | Ambivalent | Pterosaur-like flying creature reported in Zambia. | marsh, river |  | – |
| Mapinguari | monster | ④ | Ambivalent | Giant sloth-like beast of the Amazon with a mouth on the belly. | jungle |  | – |
| Beast of Bodmin Moor | beast | ④ | Ambivalent | Large black cat reported on Cornwall's moors. | highland, forest |  | – |
| Owlman | monster | ④ | Ambivalent | Winged owl-like humanoid reported in Cornwall in 1976. | forest, village |  | – |
| Hodag | monster | ④ | Ambivalent | Wisconsin folklore beast with horns and spines, from a 1896 hoax. | forest |  | – |
| Tatzelwurm | monster | ④ | Ambivalent | Stubby, lizard-like alpine creature of folklore. | mountain, highland |  | – |
| Cadborosaurus | monster | ④ | Ambivalent | Sea serpent reported off British Columbia. | sea, coast |  | – |
| Fresno Nightcrawler | monster | ④ | Ambivalent | White stilt-legged figure on trail camera footage from 2007. | city, meadow |  | – |
| Altamaha-ha | monster | ⑤ | Ambivalent | River serpent reported in Georgia's Altamaha River. | river, marsh |  | – |

## Named sets

Well-known groups drawn from the cultures above and from a few outside them. Every set table uses the same columns as the culture tables, sorted by familiarity (the 28 Lunar Mansions keep their traditional order inside each quadrant). Repeated entries keep their culture-table art mark. Sets that lost all or most of their members to the sensitivity removal are dropped (names in the appendix); sets that lost one member are kept with a note.

### Chinese zodiac (12 animals)

Source: The twelve animals of the Chinese zodiac, in the order of the Jade Emperor's race (folk tradition, in use since at least the Han dynasty).

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Dragon (Chen) | beast | ① | Benevolent | Fifth sign, the only mythical animal of the twelve; a rain-bringing, luck-bearing sovereign. | sky, river |  | – |
| Tiger (Yin) | animal | ① | Ambivalent | Third sign, king of beasts, courageous and fierce. | forest, mountain |  | – |
| Rat (Zi) | animal | ① | Ambivalent | First sign, which won the race by riding the ox and jumping ahead at the end. | village |  | – |
| Snake (Si) | animal | ① | Ambivalent | Sixth sign, subtle and wise. | forest, desert |  | – |
| Horse (Wu) | animal | ① | Ambivalent | Seventh sign, free-spirited and fast. | steppe, meadow |  | – |
| Dog (Xu) | animal | ① | Benevolent | Eleventh sign, loyal and watchful. | village |  | – |
| Monkey (Shen) | animal | ① | Ambivalent | Ninth sign, clever and playful. | forest, jungle |  | – |
| Pig (Hai) | animal | ① | Ambivalent | Twelfth sign, generous and easygoing. | village, forest |  | – |
| Ox (Chou) | animal | ① | Benevolent | Second sign, diligent and steady; carried the rat across the river. | meadow |  | – |
| Rooster (You) | animal | ① | Ambivalent | Tenth sign, proud and punctual. | village |  | – |
| Rabbit (Mao) | animal | ① | Ambivalent | Fourth sign, gentle and quick; in some countries replaced by the cat. | meadow |  | – |
| Goat (Wei) | animal | ① | Ambivalent | Eighth sign, calm and artistic; also rendered as sheep or ram. | highland, meadow |  | – |

### Western zodiac (12 signs)

Source: The twelve zodiac constellations of Greek and Babylonian astronomy, mostly tied to Greek myths about their star figures.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Leo (Lion) | beast | ① | Ambivalent | Often linked to the Nemean Lion set among the stars by Zeus. | meadow |  | – |
| Scorpio (Scorpion) | animal | ① | Ambivalent | The scorpion that stung Orion, placed in the sky by Gaia or Zeus. | desert |  | – |
| Aries (Ram) | animal | ① | Benevolent | The golden ram whose fleece Jason sought. | highland |  | – |
| Taurus (Bull) | animal | ① | Ambivalent | The bull Zeus became to carry off Europa. | meadow |  | – |
| Cancer (Crab) | animal | ② | Ambivalent | The crab that pinched Heracles during the fight with the Hydra. | coast |  | – |
| Pisces (Two Fishes) | animal | ② | Ambivalent | Two fish tied together, said to be Aphrodite and Eros fleeing Typhon. | sea |  | – |
| Sagittarius (Archer) | beast | ② | Ambivalent | Centaur archer, often identified with Chiron or the satyr Crotus. | forest |  | – |
| Capricorn (Sea-goat) | beast | ③ | Ambivalent | Goat with a fish tail, tied to Pan or the Babylonian Suhurmašu. | sea |  | – |
| Virgo (Maiden) | spirit | ③ | Ambivalent | A winged maiden holding grain, linked to Demeter or Astraea. | meadow |  | – |
| Gemini (Twins) | spirit | ③ | Ambivalent | The twins Castor and Pollux (Dioscuri). | sky |  | – |
| Aquarius (Water-bearer) | spirit | ③ | Ambivalent | Cupbearer of the gods, often Ganymede, pouring water. | sky |  | – |
| Libra (Scales) | construct | ③ | Benevolent | The scales of justice, once the claws of Scorpio; the only non-living sign. | city |  | – |

### 28 Lunar Mansions (4 by 7)

Source: The 28 xiu are lunar stations along the ecliptic, grouped 7 per quadrant under the four guardian beasts; origin Chinese astronomy (adopted in Japan and Korea). Animal pairings follow the later Chinese xiu animals and are left out where traditions vary.

#### East: Azure Dragon

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Jiao (Horn) | spirit | ⑤ | Ambivalent | The Horn, first mansion, containing Spica. | sky |  | – |
| Kang (Neck) | spirit | ⑤ | Ambivalent | The Neck, stars in Virgo. | sky |  | – |
| Di (Root) | spirit | ⑤ | Ambivalent | The Root, stars in Libra. | sky |  | – |
| Fang (Room) | spirit | ⑤ | Ambivalent | The Room, stars in Scorpius. | sky |  | – |
| Xin (Heart) | spirit | ⑤ | Ambivalent | The Heart, containing the star Antares. | sky |  | – |
| Wei (Tail) | spirit | ⑤ | Ambivalent | The Tail, stars in Scorpius. | sky |  | – |
| Ji (Winnowing Basket) | spirit | ⑤ | Ambivalent | The Winnowing Basket, last eastern mansion, in Sagittarius. | sky |  | – |

#### North: Black Tortoise

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Dou (Dipper) | spirit | ⑤ | Ambivalent | The Dipper (Southern Dipper in Sagittarius), first northern mansion. | sky |  | – |
| Niu (Ox) | spirit | ⑤ | Ambivalent | The Ox, stars in Capricornus. | sky |  | – |
| Nü (Girl) | spirit | ⑤ | Ambivalent | The Girl, stars in Aquarius. | sky |  | – |
| Xu (Emptiness) | spirit | ⑤ | Ambivalent | The Emptiness, stars in Aquarius and Equuleus. | sky |  | – |
| Wei (Rooftop) | spirit | ⑤ | Ambivalent | The Rooftop, stars in Aquarius and Pegasus. | sky |  | – |
| Shi (Encampment) | spirit | ⑤ | Ambivalent | The Encampment, stars of the Pegasus square. | sky |  | – |
| Bi (Wall) | spirit | ⑤ | Ambivalent | The Wall, last northern mansion, stars in Pegasus and Andromeda. | sky |  | – |

#### West: White Tiger

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Kui (Legs) | spirit | ⑤ | Ambivalent | The Legs, stars in Andromeda and Pisces. | sky |  | – |
| Lou (Bond) | spirit | ⑤ | Ambivalent | The Bond, stars in Aries. | sky |  | – |
| Wei (Stomach) | spirit | ⑤ | Ambivalent | The Stomach, stars in Aries. | sky |  | – |
| Mao (Hairy Head) | spirit | ⑤ | Ambivalent | The Hairy Head, the Pleiades. | sky |  | – |
| Bi (Net) | spirit | ⑤ | Ambivalent | The Net, the Hyades. | sky |  | – |
| Zi (Turtle Beak) | spirit | ⑤ | Ambivalent | The Turtle Beak, in Orion's head. | sky |  | – |
| Shen (Three Stars) | spirit | ⑤ | Ambivalent | The Three Stars, Orion's belt. | sky |  | – |

#### South: Vermilion Bird

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Jing (Well) | spirit | ⑤ | Ambivalent | The Well, first southern mansion, in Gemini. | sky |  | – |
| Gui (Ghost) | spirit | ⑤ | Ambivalent | The Ghost, the Beehive cluster in Cancer. | sky |  | – |
| Liu (Willow) | spirit | ⑤ | Ambivalent | The Willow, stars in Hydra. | sky |  | – |
| Xing (Star) | spirit | ⑤ | Ambivalent | The Star, containing Alphard in Hydra. | sky |  | – |
| Zhang (Extended Net) | spirit | ⑤ | Ambivalent | The Extended Net, stars in Hydra. | sky |  | – |
| Yi (Wings) | spirit | ⑤ | Ambivalent | The Wings, stars in Crater. | sky |  | – |
| Zhen (Chariot) | spirit | ⑤ | Ambivalent | The Chariot, stars in Corvus. | sky |  | – |

### Twelve Olympians

Source: The twelve principal gods of the Greek pantheon at Olympus; lists differ on whether Hestia or Dionysus holds the twelfth seat; Dionysus is used here and Hestia is listed under Greek deities. Hades is not an Olympian.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Zeus | deity-beast | ① | Benevolent | King of the gods, wielder of the thunderbolt. | sky | ○ | 🟢 |
| Poseidon | deity-beast | ① | Benevolent | God of the sea, earthquakes and horses. | sea | ○ ◆ | 🟢 |
| Athena | deity-beast | ① | Benevolent | Goddess of wisdom and war, with her owl. | city | ○ | 🟢 |
| Apollo | deity | ① | Benevolent | God of the sun, music, prophecy and the Pythian oracle. | sky |  | 🟢 |
| Artemis | deity | ① | Benevolent | Virgin huntress, goddess of the moon, wild animals and childbirth. | forest |  | 🟢 |
| Aphrodite | deity | ① | Benevolent | Goddess of love and beauty, born from sea foam. | coast |  | 🟢 |
| Hermes | deity | ① | Benevolent | Winged messenger and trickster, guide of souls and patron of travellers. | sky |  | 🟢 |
| Dionysus | deity | ① | Ambivalent | God of wine, theatre and ecstatic revelry. | meadow |  | 🟢 |
| Hera | deity | ② | Ambivalent | Queen of the gods, goddess of marriage, jealous wife of Zeus. | sky |  | 🟢 |
| Ares | deity | ② | Ambivalent | God of war and bloodshed, hated by his fellow Olympians. | ruins |  | 🟢 |
| Hephaestus | deity | ② | Benevolent | Lame smith god who forged the weapons and automata of the gods. | volcano |  | 🟢 |
| Demeter | deity | ② | Benevolent | Goddess of grain and the harvest, mother of Persephone. | meadow |  | 🟢 |

### Beasts of the Twelve Labours of Heracles

Source: Creatures from the labours set by Eurystheus; the Augean stables and Hippolyta's girdle are not creature labours and are left out.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Hydra of Lerna | monster | ① | Malevolent | Many-headed water serpent whose heads regrow. | marsh, lake | ○ ◆ | – |
| Cerberus | monster | ① | Malevolent | Multi-headed hound guarding the gates of Hades. | underworld | ★ ◆ | – |
| Nemean Lion | beast | ② | Malevolent | Lion with an invulnerable hide killed by Heracles. | highland, cave | ○ ◆ | – |
| Stymphalian birds | monster | ③ | Malevolent | Man-eating birds with bronze beaks and metal feathers. | marsh, lake |  | – |
| Erymanthian Boar | beast | ③ | Malevolent | Giant boar of the Arcadian mountains. | highland, forest |  | – |
| Cretan Bull | beast | ③ | Malevolent | Raging white bull Heracles captured, sire of the Minotaur. | meadow, island |  | – |
| Ladon | monster | ③ | Malevolent | Hundred-headed dragon guarding the Hesperides' golden apples. | oasis |  | – |
| Ceryneian Hind | beast | ④ | Benevolent | Golden-horned deer sacred to Artemis that Heracles chased for a year. | forest |  | – |
| Mares of Diomedes | beast | ④ | Malevolent | Man-eating horses of the Thracian king that Heracles tamed. | meadow |  | – |
| Geryon's cattle | beast | ④ | Ambivalent | Red cattle guarded by the giant Geryon and the hound Orthrus on Erytheia. | island |  | – |

### Four Benevolent Animals (Si Ling)

Source: The four spiritual creatures named in the Liji (Book of Rites): the dragon, phoenix, qilin and tortoise.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Long (龍) | beast | ① | Benevolent | Chinese dragon: wingless, rain- and river-bringing, with a pearl. | sky, river, sea | ✕ | – |
| Fenghuang (鳳凰) | beast | ② | Benevolent | "Phoenix": composite bird of virtue that appears in peaceful reigns. | sky, bamboo | ✕ ◆ | – |
| Qilin (麒麟) | beast | ② | Benevolent | Hooved chimera with scaled body, whose appearance is a good omen. | meadow, forest | ○ | – |
| Divine tortoise (Gui) | beast | ③ | Benevolent | Longevity and divination; the tortoise shell was used in oracle bones. | lake, river |  | – |

### Dragon King's Nine Sons (Longzi)

Source: The nine sons of the dragon in Ming dynasty lore (the lists vary, and Taotie is sometimes included); each decorates a particular building feature.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Chiwen (螭吻) | beast | ④ | Benevolent | Dragon-fish roof ornament that wards off fire. | city, sea |  | – |
| Bixi (贔屭) | beast | ④ | Benevolent | Dragon-headed tortoise that carries stone steles. | ruins |  | – |
| Suanni | beast | ④ | Benevolent | Lion-like son who loves smoke; seen on incense burners. | city |  | – |
| Bi'an | beast | ④ | Benevolent | Tiger-like son who loves litigation; carved on prison and court gates. | city |  | – |
| Pulao | beast | ④ | Benevolent | Roaring son who sits on bell handles. | sea |  | – |
| Yazi | beast | ④ | Benevolent | Fighter son who adorns sword hilts and weapons. | city |  | – |
| Chaofeng | beast | ⑤ | Benevolent | Daring son who sits on roof corners to scare evil. | city |  | – |
| Fùxì (dragon son) | beast | ⑤ | Benevolent | Son who loves literature; carved on stele tops. | city |  | – |
| Qiuniu | beast | ⑤ | Benevolent | Son who loves music; carved on zither pegs. | city |  | – |

### Four Perils of Chinese myth (Si Xiong)

Source: The Four Fiends banished by Emperor Shun in the Zuo Zhuan and later folklore: Hundun, Qiongqi, Taotie and Taowu.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Taotie (饕餮) | monster | ③ | Ambivalent | Gluttonous maw-faced beast of Zhou bronzes. | ruins, mountain | ○ ◆ | – |
| Hundun (混沌) | monster | ④ | Malevolent | Faceless, shapeless being, a figure of primordial chaos. | ruins, underworld | ○ ◆ | – |
| Qiongqi (窮奇) | monster | ④ | Malevolent | Winged tiger (or ox) from the Classic of Mountains and Seas. | bamboo, mountain | ○ ◆ | – |
| Taowu | monster | ⑤ | Malevolent | Tiger-bodied fiend with a human face and long tail; the fourth peril. | mountain |  | – |

### Japanese Three Great Yokai (Sandai Yōkai)

Source: The most commonly cited trio of folklorist Komatsu Kazuhiko: Shuten-dōji, Tamamo-no-Mae and Ōtakemaru; other lists replace the last with Ōtengu or give oni, kappa and tengu.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Tamamo-no-Mae (玉藻前) | monster | ③ | Malevolent | Nine-tailed fox who posed as a courtesan of Emperor Toba and became the Sesshō-seki. | ruins, forest |  | – |
| Shuten-dōji (酒呑童子) | monster | ③ | Malevolent | Sake-drinking oni chief of Mount Ōe, slain by Minamoto no Raikō. | mountain |  | – |
| Ōtakemaru (大嶽丸) | monster | ④ | Malevolent | Oni lord of Mount Suzuka with three magic swords, slain by Sakanoue no Tamuramaro. | mountain |  | – |

### Nine Muses

Source: The nine daughters of Zeus and Mnemosyne who inspire arts and sciences (Hesiod, Theogony).

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Calliope | deity | ③ | Benevolent | Muse of epic poetry, mother of Orpheus. | forest |  | 🟢 |
| Clio | deity | ④ | Benevolent | Muse of history. | city |  | 🟢 |
| Erato | deity | ④ | Benevolent | Muse of love poetry. | meadow |  | 🟢 |
| Euterpe | deity | ④ | Benevolent | Muse of music and lyric poetry, with a flute. | meadow |  | 🟢 |
| Melpomene | deity | ④ | Benevolent | Muse of tragedy. | city |  | 🟢 |
| Polyhymnia | deity | ④ | Benevolent | Muse of sacred song and hymns. | village |  | 🟢 |
| Terpsichore | deity | ④ | Benevolent | Muse of dance. | meadow |  | 🟢 |
| Thalia | deity | ④ | Benevolent | Muse of comedy. | meadow |  | 🟢 |
| Urania | deity | ④ | Benevolent | Muse of astronomy, with a globe. | sky |  | 🟢 |

### Greek triple sisters

Source: The groups of three sisters in Greek myth: the Fates, the Furies, the Gorgons and the Graeae.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Medusa | monster | ① | Malevolent | Gorgon with snake hair whose gaze turns people to stone. | coast, ruins | ○ ◆ | – |
| Graeae | monster | ③ | Malevolent | Three grey sisters sharing one eye and one tooth. | cave, coast |  | – |
| Atropos | deity | ④ | Ambivalent | The Fate who cuts the thread of life. | city |  | 🟢 |
| Clotho | deity | ④ | Ambivalent | The Fate who spins the thread of life. | city |  | 🟢 |
| Lachesis | deity | ④ | Ambivalent | The Fate who measures the thread. | city |  | 🟢 |
| Alecto | deity | ④ | Malevolent | Fury of endless anger. | underworld |  | 🟢 |
| Megaera | deity | ④ | Malevolent | Fury of jealous rage. | underworld |  | 🟢 |
| Tisiphone | deity | ④ | Malevolent | Fury of vengeance for murder. | underworld |  | 🟢 |
| Stheno | monster | ④ | Malevolent | Gorgon sister of Medusa, immortal. | cave |  | – |
| Euryale | monster | ④ | Malevolent | Gorgon sister of Medusa, immortal. | cave |  | – |

### Offspring of Echidna and Typhon

Source: The monstrous brood of Echidna and Typhon according to Hesiod and later sources (some sources vary on individual parentage).

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Cerberus | monster | ① | Malevolent | Multi-headed hound guarding the gates of Hades. | underworld | ★ ◆ | – |
| Hydra of Lerna | monster | ① | Malevolent | Many-headed water serpent whose heads regrow. | marsh, lake | ○ ◆ | – |
| Sphinx of Thebes | monster | ① | Malevolent | Riddling lion-bodied monster of Thebes, a later addition to the brood. | ruins, desert |  | – |
| Chimera | monster | ② | Malevolent | Lion with a goat head on its back and a snake tail, breathing fire. | highland, volcano | ○ ◆ | – |
| Nemean Lion | beast | ② | Malevolent | Lion with an invulnerable hide killed by Heracles. | highland, cave | ○ ◆ | – |
| Ladon | monster | ③ | Malevolent | Hundred-headed dragon guarding the Hesperides' golden apples. | oasis |  | – |
| Orthrus | monster | ④ | Malevolent | Two-headed hound of Geryon, Cerberus's brother. | meadow, island |  | – |
| Caucasian Eagle | monster | ④ | Malevolent | Eagle that ate Prometheus's liver each day. | mountain |  | – |

### Monsters of the Odyssey

Source: Creatures and obstacles faced by Odysseus on his voyage home in Homer's Odyssey.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Siren | monster | ① | Malevolent | Bird-bodied singer who lures sailors onto the rocks. | coast, sea | ★ ◆ | – |
| Polyphemus | monster | ② | Malevolent | Cyclops son of Poseidon who trapped Odysseus's men in his cave. | cave, island |  | – |
| Scylla | monster | ② | Malevolent | Six-headed sea monster of the strait opposite Charybdis. | sea, coast | ○ ◆ | – |
| Charybdis | monster | ② | Malevolent | Whirlpool monster who swallows and spews the sea thrice daily. | sea |  | – |
| Circe | deity | ③ | Ambivalent | Witch goddess of Aeaea who turns men into swine. | island, forest |  | 🟢 |
| Laestrygonians | monster | ④ | Malevolent | Giant cannibals who destroyed most of Odysseus's fleet. | coast |  | – |
| Lotus-Eaters | spirit | ④ | Ambivalent | Island people whose lotus fruit makes visitors forget home. | island |  | – |
| Calypso | deity | ④ | Benevolent | Nymph who held Odysseus on Ogygia for seven years. | island |  | 🟢 |
| Cattle of Helios | beast | ④ | Ambivalent | Sacred herd whose slaughter doomed Odysseus's crew. | island, meadow |  | 🟢 |
| Wandering Rocks (Planctae) | construct | ⑤ | Malevolent | Clashing cliffs that Odysseus's route avoided. | sea |  | – |

### Planets and their mythic namesakes

Source: The classical planets and the Greek or Roman gods their names come from; the two lights and Pluto are included for completeness.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Jupiter | deity | ① | Benevolent | King of the Roman gods, equal to Zeus, who names the largest planet. | sky |  | 🟢 |
| Mars | deity | ① | Benevolent | Roman god of war, equal to Ares. | sky |  | 🟢 |
| Venus | deity | ① | Benevolent | Roman goddess of love, equal to Aphrodite. | sky |  | 🟢 |
| Mercury | deity | ① | Benevolent | Roman messenger god, equal to Hermes. | sky |  | 🟢 |
| Neptune | deity | ① | Benevolent | Roman sea god, equal to Poseidon. | sea |  | 🟢 |
| Pluto | deity | ② | Benevolent | Roman lord of the dead, equal to Hades. | underworld |  | 🟢 |
| Saturn | deity | ② | Benevolent | Roman god of agriculture, equal to Cronus. | sky |  | 🟢 |
| Sol | deity | ③ | Benevolent | Roman sun god, equal to Helios. | sky |  | 🟢 |
| Luna | deity | ③ | Benevolent | Roman moon goddess, equal to Selene. | sky |  | 🟢 |
| Uranus | deity | ③ | Benevolent | Greek sky father Ouranos, the only planet with a Greek name. | sky |  | 🟢 |

### Egyptian Ennead of Heliopolis

Source: The nine gods of the Heliopolitan creation myth: Atum and his descendants down to Osiris, Isis, Seth and Nephthys.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Osiris | deity-beast | ② | Benevolent | Mummiform king of the underworld, god of resurrection. | underworld | ○ | 🟢 |
| Isis (Aset) | deity-beast | ② | Benevolent | Winged goddess of magic and motherhood. | city, sky | ★ | 🟢 |
| Set | deity-beast | ③ | Ambivalent | God of storm and chaos with an unidentified "Set animal" head. | desert | ○ ◆ | 🟢 |
| Atum | deity | ④ | Benevolent | Self-created primordial god of Heliopolis, the "complete one". | sky |  | 🟢 |
| Nut | deity | ④ | Benevolent | Sky goddess arched over the earth, who swallows the sun each evening. | sky |  | 🟢 |
| Geb | deity | ④ | Benevolent | Earth god, father of Osiris, whose laughter was said to cause earthquakes. | desert |  | 🟢 |
| Nephthys | deity | ④ | Benevolent | Goddess of mourning, sister of Isis, with a house-and-basket crown. | tomb |  | 🟢 |
| Shu | deity | ⑤ | Benevolent | God of air who holds up the sky goddess Nut. | sky |  | 🟢 |
| Tefnut | deity-beast | ⑤ | Benevolent | Lioness-headed goddess of moisture, twin of Shu. | desert |  | 🟢 |

### Four Sons of Horus

Source: The four gods who guard the canopic jars with the organs of the dead.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Imsety | deity | ⑤ | Benevolent | Human-headed guardian of the liver. | tomb |  | 🟢 |
| Hapy | deity | ⑤ | Benevolent | Baboon-headed guardian of the lungs. | tomb |  | 🟢 |
| Duamutef | deity-beast | ⑤ | Benevolent | Jackal-headed guardian of the stomach. | tomb |  | 🟢 |
| Qebehsenuef | deity-beast | ⑤ | Benevolent | Falcon-headed guardian of the intestines. | tomb |  | 🟢 |

### The Nine Worlds of Norse cosmology

Source: The inhabitants of the nine realms of the world tree Yggdrasil, as listed in the Eddas and Snorri's Gylfaginning.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Humans (Midgard) | spirit | ① | Ambivalent | Mankind, living in the realm between the worlds. | village |  | – |
| Jötunn | monster | ③ | Malevolent | Frost giant, ancient foe of gods and men. | ice, mountain | ★ ◆ | – |
| Dvergr | spirit | ③ | Ambivalent | Dwarf smith who forges treasures within the earth. | cave, mountain | ○ ◆ | – |
| Æsir (Asgard) | deity | ③ | Benevolent | The warrior gods of Asgard led by Odin. | sky |  | 🟢 |
| Light elves (Alfheim) | spirit | ③ | Benevolent | Radiant elf folk ruled by Freyr in Alfheim. | forest |  | – |
| Níðhöggr | monster | ③ | Malevolent | Dragon that gnaws the roots of Yggdrasil. | underworld | ○ | – |
| Vanir (Vanaheim) | deity | ④ | Benevolent | The fertility gods of Vanaheim, who made peace with the Æsir. | meadow |  | 🟢 |
| Muspell's fire giants (Muspelheim) | monster | ④ | Malevolent | Fire giants of the southern realm who will march with Surtr at Ragnarök. | volcano |  | – |
| Dead of Helheim (Hel's host) | undead | ④ | Malevolent | Souls who died of sickness or age in Hel's hall. | underworld |  | – |

### Children of Loki

Source: The four monstrous or divine children of Loki, a recurring group in the Prose Edda.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Fenrir | monster | ② | Malevolent | Monstrous wolf bound by the gods, fated to break loose at Ragnarök. | ice, underworld | ✕ | – |
| Jörmungandr | monster | ② | Malevolent | World Serpent encircling Midgard, doomed to fight Thor at Ragnarök. | sea | ○ ◆ | – |
| Hel | deity-beast | ② | Ambivalent | Half-living, half-corpse ruler of the realm of the dead. | underworld | ○ ◆ | 🟢 |
| Sleipnir | beast | ③ | Benevolent | Eight-legged grey horse of Odin, born of Loki. | sky, underworld | ○ ◆ | – |

### The Wild Hunt

Source: Spectral riders and hounds chasing across the night sky in European folklore, led by different figures in different regions.

Note: Gwyn ap Nudd (🟡), a leader of the Hunt, was removed; the other riders and hounds are kept.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Odin | deity-beast | ① | Ambivalent | The All-father, one-eyed wanderer. | sky | ○ | 🟢 |
| Sleipnir | beast | ③ | Benevolent | Eight-legged grey horse of Odin, born of Loki. | sky, underworld | ○ ◆ | – |
| Herne the Hunter | spirit | ③ | Ambivalent | Antlered ghostly huntsman of Windsor Forest. | forest |  | – |
| Cŵn Annwn | beast | ④ | Ambivalent | White hounds with red ears that hunt souls, from the Otherworld. | sky, underworld |  | – |
| Sluagh | undead | ④ | Malevolent | Host of the restless dead flying at night in the Scottish Highlands. | sky, highland |  | – |
| Hellequin | spirit | ④ | Ambivalent | Leader of the Mesnie Hellequin in medieval French lore, a source of Harlequin. | sky |  | – |
| Perchta | spirit | ④ | Ambivalent | Alpine winter spirit who leads a procession of the unborn dead. | forest |  | – |
| Gabriel Hounds | spirit | ④ | Malevolent | English spectral hounds heard in the sky as a death omen. | sky |  | – |
| Åsgårdsreia | spirit | ⑤ | Malevolent | Norwegian name for the Wild Hunt, riding at Yule. | sky |  | – |

### Aztec day signs (Tonalpohualli)

Source: The twenty named days of the Aztec ritual calendar, each with a patron deity; the patron gods are listed under the culture, not here.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Ocelotl (Jaguar) | animal | ① | Ambivalent | Jaguar day, tied to warriors and the night sun. | jungle |  | – |
| Coatl (Serpent) | animal | ② | Ambivalent | Serpent day, tied to Mixcoatl and the earth. | jungle, desert |  | – |
| Cuauhtli (Eagle) | animal | ② | Ambivalent | Eagle day, tied to the sun and warriors. | sky |  | – |
| Itzcuintli (Dog) | animal | ③ | Ambivalent | Dog day, tied to Xolotl and Mictlantecuhtli. | village |  | – |
| Tochtli (Rabbit) | animal | ③ | Ambivalent | Rabbit day, tied to drunkenness and fertility. | meadow |  | – |
| Mazatl (Deer) | animal | ③ | Ambivalent | Deer day, tied to hunting. | forest |  | – |
| Ozomahtli (Monkey) | animal | ③ | Ambivalent | Monkey day, tied to play and mischief. | jungle |  | – |
| Cuetzpalin (Lizard) | animal | ③ | Ambivalent | Lizard day, tied to abundance and self-renewal. | desert |  | – |
| Cipactli | monster | ④ | Malevolent | Primordial earth-crocodile whose body became the land. | marsh, coast |  | – |
| Cozcacuauhtli (Vulture) | animal | ④ | Ambivalent | Vulture day, linked to long life. | sky |  | – |
| Ehecatl (Wind) | spirit | ④ | Ambivalent | Wind day, tied to Quetzalcoatl. | sky |  | – |
| Calli (House) | construct | ④ | Ambivalent | House day, tied to dwellings and shelter. | village |  | – |
| Miquiztli (Death) | spirit | ④ | Ambivalent | Death day, the sign of mortality. | tomb |  | – |
| Atl (Water) | spirit | ④ | Ambivalent | Water day, tied to Tlaloc and rain. | river |  | – |
| Acatl (Reed) | spirit | ④ | Ambivalent | Reed day, tied to kingship and the new fire. | marsh |  | – |
| Tecpatl (Flint) | construct | ④ | Ambivalent | Flint knife day, tied to sacrifice. | ruins |  | – |
| Quiahuitl (Rain) | spirit | ④ | Ambivalent | Rain day, tied to the Tlalocan. | sky |  | – |
| Xochitl (Flower) | spirit | ④ | Ambivalent | Flower day, tied to artists and Xochipilli. | meadow |  | – |
| Ollin (Movement) | spirit | ④ | Ambivalent | Earthquake day, tied to the fifth sun. | sky |  | – |
| Malinalli (Grass) | spirit | ⑤ | Ambivalent | Grass day, tied to twisted or tangled things. | meadow |  | – |

### Arthurian beasts

Source: Beasts and monsters from the Arthurian legends: the Welsh Mabinogion, Geoffrey of Monmouth and the medieval French romances.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Ddraig Goch | beast | ③ | Benevolent | Welsh Red Dragon, emblem of Wales, in the Mabinogion. | mountain, highland |  | – |
| Lady of the Lake | spirit | ③ | Benevolent | Water fairy who gave Arthur his sword Excalibur. | lake |  | – |
| Green Knight | spirit | ③ | Ambivalent | Green giant who challenges Gawain in the 14th-century poem. | forest |  | – |
| Questing Beast | monster | ④ | Ambivalent | Serpent-headed, leopard-bodied creature hunted in Arthurian tales. | forest |  | – |
| White Dragon of the Saxons | monster | ④ | Malevolent | Dragon that fights the red dragon beneath Vortigern's tower, in Merlin's prophecy. | mountain |  | – |
| Cath Palug | monster | ④ | Ambivalent | Giant monstrous cat of Anglesey said to have been killed by Arthur or Cai. | highland |  | – |
| Afanc | monster | ④ | Malevolent | Lake monster of Welsh legend, beaver- or crocodile-like. | lake |  | – |
| Twrch Trwyth | monster | ⑤ | Malevolent | Giant boar hunted by Arthur's men in Culhwch and Olwen. | forest, highland |  | – |

### Elementals (Paracelsus)

Source: The four elemental spirits named by Paracelsus in the 16th century and used by alchemists and fantasy writers.

| Name | Kind | Fam. | Nature | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|---|
| Salamander (elemental) | spirit | ② | Ambivalent | Fire spirit of the alchemists, shown as a lizard in flames. | volcano |  | – |
| Gnome | spirit | ② | Ambivalent | Earth spirit that moves through rock. | cave |  | – |
| Undine | spirit | ③ | Ambivalent | Water spirit that can gain a soul by marrying a human. | lake |  | – |
| Sylph | spirit | ③ | Ambivalent | Air spirit of the winds and clouds. | sky |  | – |

## Culture fit for future region themes

| Region theme | Good source cultures | Examples |
|---|---|---|
| Ice and tundra | Norse, Finnish/Baltic, Mongol/Siberian, Japanese yokai | Jötunn, Hræsvelgr, Yuki-onna, Louhi, Chuchunaa, Mammoth |
| Volcano | Norse, Greek, Persian/Arabian, Aztec/Mesoamerican | Surtr, Typhon, Xiuhcoatl, Salamander |
| Coast and sea | Celtic, Polynesian/Māori, Filipino, Greek, Japanese | Selkie, Marakihau, Bakunawa, Charybdis, Umibōzu |
| Sky | Slavic, Mesopotamian, Turkic, Chinese, Andean | Sirin, Anzû, Tulpar, Kunpeng, Andean condor |
| Underworld | Egyptian, Mesopotamian, Greek, Maya, Korean | Mehen, Gallu, Echidna, Edimmu, Jeoseung Saja |
| Jungle | Maya, Southeast Asian, African, Hindu/Indian, Andean | Sisimito, Genderuwo, Sasabonsam, Rakshasa, Sachamama |
| Steppe and highland | Mongol/Turkic, Andean, Scottish/Welsh, Persian | Tulpar, Zilant, Jarjacha, Cú Sídhe, Simurgh |
| Moor, marsh and lakes | Celtic, Finnish/Baltic, Slavic, Medieval | Kelpie, Näkki, Kikimora, Barghest, Afanc |
| Desert and oasis | Persian/Arabian, Egyptian, African | Ghoul, Qutrub, Serpopard, Secretary bird |
| City and ruins | Medieval, Mesopotamian, Southeast Asian | Gargoyle, Golem, Lamassu, Yak |
| Haunted forest and village | Filipino, Malay/Indonesian, Slavic, Mesoamerican folklore | Tikbalang, Pontianak, Mavka, La Llorona |
| Modern/urban mystery | Modern cryptids | Mothman, Chupacabra, Fresno Nightcrawler |

## Recommended to draw next for enemy art (30)

Not-yet-drawn entries chosen as enemies: strong silhouettes, wide recognisability and variety of terrain, with a spread across Malevolent and Ambivalent natures. Selection prefers familiarity ①–③ and none was dropped (✕); none is a deity. Benevolent creatures are left for the player side.

1. **Nue** (Japanese yokai, ③, Malevolent): Chimera with a monkey's face, tanuki body, tiger limbs and snake tail; its cry brings illness.
2. **Nekomata** (Japanese yokai, ③, Ambivalent): Cat with a forked tail, an elder form of the bakeneko of mountain lore.
3. **Medjed** (Egyptian, ③, Ambivalent): Shrouded figure with only eyes visible, from the Book of the Dead.
4. **Jiuweihu** (Chinese, ③, Ambivalent): Nine-tailed fox, omen of peace or a seductive fiend depending on source.
5. **Kunpeng** (Chinese, ③, Ambivalent): Vast fish that becomes a bird thousands of li across (Zhuangzi).
6. **Charybdis** (Greek, ②, Malevolent): Whirlpool monster who swallows and spews the sea thrice daily.
7. **Echidna** (Greek, ③, Malevolent): Half-woman, half-snake mother of many monsters.
8. **Lamia** (Greek, ③, Malevolent): Child-snatching queen turned monster by Hera.
9. **Garmr** (Norse, ③, Malevolent): Blood-stained hound that guards Hel's gate.
10. **Fáfnir** (Norse, ③, Malevolent): Dwarf turned dragon who guards a cursed hoard.
11. **Mavka** (Slavic, ③, Malevolent): Ukrainian forest nymph, a dead girl who lures men.
12. **Dragon (Saint George's)** (Medieval European bestiary and heraldry, ①, Malevolent): Western dragon with wings and fire, as in dragon-slayer tales.
13. **Kelpie** (Celtic, ②, Malevolent): Shape-shifting water horse that drowns riders in Scottish lochs.
14. **Dullahan** (Celtic, ③, Malevolent): Headless horseman who carries his own head; a death omen.
15. **Balor** (Celtic, ③, Malevolent): Fomorian giant whose single baleful eye destroys all it sees.
16. **La Llorona** (Aztec and wider Mesoamerican, ③, Malevolent): Weeping woman wandering rivers and calling for her lost children.
17. **Feathered serpent (Teotihuacan)** (Aztec and wider Mesoamerican, ③, Malevolent): Fanged, feathered snake in Teotihuacan murals and temple carvings.
18. **Rakshasa** (Hindu and Indian, ③, Malevolent): Shape-shifting, flesh-eating demon of Indian epics and folklore.
19. **Manticore** (Medieval European bestiary and heraldry, ②, Malevolent): Man-faced lion with porcupine quills and a scorpion tail.
20. **Shahmaran** (Persian and Arabian, ③, Ambivalent): Queen of snakes with a woman's torso, from Anatolian and Kurdish lore.
21. **Wyvern** (Medieval European bestiary and heraldry, ③, Malevolent): Two-legged winged dragon, common in heraldry.
22. **Pazuzu** (Mesopotamian, ③, Malevolent): Winged king of wind demons with a canine face and scorpion tail, who drives off Lamashtu.
23. **Anzû** (Mesopotamian, ③, Ambivalent): Lion-headed eagle who stole the Tablet of Destinies.
24. **Tokoloshe** (African, ③, Malevolent): Mischievous water sprite who torments sleepers.
25. **Taniwha (Māori)** (Polynesian, Māori and Hawaiian, ③, Ambivalent): Water or cave-dwelling creature that guards or menaces a tribe's river, lake or coast.
26. **Manananggal (PH)** (Southeast Asian, ③, Malevolent): Woman whose upper body detaches with wings to hunt at night.
27. **Tikbalang (PH)** (Southeast Asian, ③, Ambivalent): Horse-headed, long-limbed trickster that misleads travellers in the mountains.
28. **Basilisk** (Medieval European bestiary and heraldry, ②, Malevolent): Serpent king whose gaze or breath kills; hatched from a cock's egg.
29. **Mothman** (Modern cryptids, ②, Ambivalent): Winged red-eyed humanoid seen near Point Pleasant, West Virginia, in 1966-67.
30. **Gargoyle** (Medieval European bestiary and heraldry, ①, Ambivalent): Stone rainwater spout carved as a monster, protector of cathedrals.

Cryptids to keep for a later wave: Yeti and Bigfoot (both ①), Nessie. Also worth testing as cultures: Finnish Iku-Turso and Hiiden hirvi, Mongol Tulpar and Zilant, medieval Wyvern and Gargoyle.

## Removed for sensitivity

Names only, grouped by tradition, so they can be restored later. Every entry here was flagged 🟡 (medium) or 🔴 (high; marked †) in the earlier version. The full rows (descriptions, habitats, art marks) are in the git history of this file. See the Sensitivity research section for the reasons.

- **Japanese yokai** (13): Raijin, Amaterasu†, Susanoo, Inari Ōkami, Tsukuyomi, Izanami, Izanagi, Hachiman, Fūjin, Ryūjin, Ame-no-Uzume, Kagutsuchi, Ōkuninushi.
- **Chinese** (40): Sun Wukong, Nezha, Baihu, Xuanwu, Lei Gong, Jade Emperor (Yudi), Guan Yu (Guandi), Guanyin, Nüwa, Pangu, Chang'e, Erlang Shen, Caishen, Zhong Kui, Mazu, Xiwangmu, Fuxi, Zhurong, Gonggong, Shennong, Yanluo Wang, Azure Dragon (Qinglong), Vermilion Bird (Zhuque), Duowen Tianwang (Vaiśravaṇa), Zengzhang Tianwang (Virūḍhaka), Guangmu Tianwang (Virūpākṣa), Chiguo Tianwang (Dhṛtarāṣṭra), Yellow Dragon (Huanglong), Ao Guang, Ao Qin, Ao Run, Ao Shun, Zhongli Quan, Lü Dongbin, Li Tieguai, He Xiangu, Lan Caihe, Zhang Guolao, Han Xiangzi, Cao Guojiu.
- **Slavic** (11): Perun, Veles, Morana, Chernobog, Svarog, Dazhbog, Stribog, Mokosh, Svetovid, Triglav, Khors.
- **Maya** (16): Kukulkan, Chaac, Ix Chel, Ah Puch, Huracan, Hunahpu and Xbalanque, Itzamna, Kinich Ahau, Hun-Came and Vucub-Came, Hun Hunahpu (Maize God), Buluc Chabtan, Bacab, Gucumatz, Yum Kaax, Ixtab, Ek Chuaj.
- **Korean** (11): Jangseung, Dangun, Sansin, Yeomra, Hwanung, Yongwang, Samsin Halmeoni, Jowangshin, Hwanin, Chilseong, Seongjushin.
- **Celtic (Irish, Scottish, Welsh, Cornish)** (17): Dagda, The Morrígan, Lugh, Brigid, Cernunnos, Arawn, Danu, Nuada, Manannán mac Lir, Epona, Rhiannon, Cailleach, Taranis, Belenus, Ogma, Goibniu, Gwyn ap Nudd.
- **Aztec and wider Mesoamerican** (20): Quetzalcoatl, Huitzilopochtli, Tezcatlipoca, Tlaloc, Coatlicue, Mictlantecuhtli, Tzitzimime, Cihuateteo, Xipe Totec, Mictecacihuatl, Xochiquetzal, Tonatiuh, Xolotl, Coyolxauhqui, Chalchiuhtlicue, Ehecatl, Itzpapalotl, Xiuhtecuhtli, Huehuecoyotl, Centeotl.
- **Hindu and Indian** (47): Naga (folklore), Shiva†, Ganesha†, Kali†, Nagini, Makara, Vishnu†, Brahma†, Durga†, Lakshmi†, Hanuman†, Krishna†, Rama†, Indra†, Agni†, Surya†, Yama†, Garuda†, Saraswati†, Parvati†, Varuna†, Vayu†, Kartikeya (Murugan)†, Kubera†, Nandi†, Airavata†, Shesha†, Vasuki†, Hamsa†, Narasimha†, Varaha†, Mushika†, Kamadhenu†, Rahu†, Chandra†, Shani†, Ketu†, Mangala†, Brihaspati†, Budha†, Shukra†, Kalki†, Matsya†, Kurma†, Vamana†, Parashurama†, Balarama†.
- **Persian and Arabian** (8): Jinn (djinn), Ifrit, Marid, Ahura Mazda, Angra Mainyu (Ahriman), Mithra, Anahita, Verethragna.
- **African (several traditions)** (14): Shango, Oshun, Ogun, Eshu (Elegua), Mami Wata, Baron Samedi, Olodumare (Olorun), Yemoja, Obatala, Oya, Papa Legba, Nyame, Orunmila, Mawu-Lisa.
- **Polynesian, Māori and Hawaiian** (14): Māui, Pele, Tāne, Tangaroa, Tāwhirimātea, Rūaumoko, Papatūānuku, Ranginui, Hine-nui-te-pō, Kāne, Kū, Lono, Kanaloa, Hiʻiaka.
- **Inca and Andean** (8): Viracocha, Inti, Pachamama, Mama Quilla, Illapa, Mama Cocha, Pariacaca, Apus.
- **Southeast Asian (Philippines, Thailand, Malay world, Indonesia, Vietnam)** (8): Naga (TH), Nyai Roro Kidul, Barong, Rangda, Dewi Sri, Bathala, Mayari, Apolaki.
- **Mongol, Turkic and Siberian** (6): Bozkurt (Turkic), Tengri, Asena (Turkic), Umay, Erlik, Ülgen.
- **Finnish, Sámi and Baltic** (3): Perkūnas, Saulė, Laima.
- **Judeo-Christian (sets)** (28): Death, War, Famine, Conquest (Pestilence), Satan, Lucifer, Beelzebub, Asmodeus, Leviathan, Mammon, Belphegor, Asmodeus (Asmoday), Belial, Astaroth, Bael, Paimon, Stolas, Beleth, Bune, Andras, Vine, Zagan, Furfur, Gremory, Valac, Buer, Behemoth, Ziz.
- **Japanese** (7): Ebisu, Hotei, Daikokuten, Benzaiten, Bishamonten, Fukurokuju, Jurōjin.

**Sets dropped:** Ars Goetia, best-known demons (of 72), Dashavatara (ten avatars of Vishnu), Eight Immortals (Ba Xian), Five Elements creatures (Wuxing), Four Dragon Kings (Si Hai Longwang), Four Heavenly Kings (Shi Tianwang), Four Horsemen of the Apocalypse, Four Symbols (Sishen), Hindu Navagraha (nine planets), Primordial beasts of the Hebrew tradition, Seven Deadly Sins as demons (Binsfeld), Seven Lucky Gods (Shichifukujin) (the Wild Hunt kept without Gwyn ap Nudd).

