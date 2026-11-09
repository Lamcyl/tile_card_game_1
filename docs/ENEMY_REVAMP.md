# Enemy revamp

Status: proposal (no game code changed). Part A is generated from the live code by `tools/enemy-catalogue.js`; Part B is the revamp design. Related: `docs/WP20_PLAN.md`, `art-samples/maps/GREENVALE.md`, `DESERT.md`, `art-samples/SUMMARY.md`.

## Part A: current catalogue (generated)

Regenerate with `node tools/enemy-catalogue.js`. The fielded enemies are a sample (seed `catalogue`, no Heat or Descend): the template pick and the enemy mix vary per run, the level, role and unique drop of each node are fixed. "fielded" counts `N×role[/kind]`; "avg HP/ATK" is the mean over non-barrel enemies. All 16 x 5 theme slots resolve to an existing SVG in `prototype/assets/units/` (0 missing). Biomes without a painted backdrop borrow one via `BACKDROP_ALIAS` in `art.js` (marsh, highlands, saltflat, canyon, rice, ruins, palms, citadel). Boss defs of the 12 new sub-areas are copies of retired-region fights (`REUSE` in `boss-defs.js`: rice=beach, ruins=cove, marsh=coral, highlands=isles, dshallows=dunes, palms=oasis, erg=ash, saltmirror=ridge, wadi=canyon, bazaar=lavafall, tomb=temple, citadel=caldera); their elite defs follow the same map.

Observed gaps: every normal node is a shared tier template (`shell`, `crossfire`, `powder-row`, `stack` ...), so two sub-areas differ only by their five creature names; special kinds (healer, splitter, summoner, bulwark) first appear at Lv 10+; the unique drop is a random effect with the creature's name on it.

### Greenvale

#### Sunny Meadows (`meadow`) - biome meadow, Lv 1-2, boss Lv 4
Creatures: basic=Alux, tough=Tanuki, armored=Jangseung, barrel=Chōchin-obake, boss=Sansin. Boss def `meadow`.

| node | kind | level | role | template / def | fielded | avg HP/ATK | unique drop |
|---|---|---|---|---|---|---|---|
| meadow-0 | normal | 1 | basic | first-blood [attack] | 2×basic | 3/2.0 | Alux's Seal (rare, souls) |
| meadow-1 | normal | 1 | basic | long-shot [range] | 2×basic | 1/2.0 | Alux's Bone (common, hp) |
| meadow-2 | normal | 1 | barrel | boost [drummer +] | 1×tough | 2/2.0 | Chōchin-obake's Plate (common, block) |
| meadow-3 | normal | 2 | basic | long-shot [range] | 2×basic | 1/2.0 | Alux's Plate (rare, block) |
| meadow-4 | normal | 2 | armored | twin-lane [overkill] | 1×armored 1×basic | 2/2.0 | Jangseung's Ember (common, atk:mage) |
| meadow-e0 | elite | 2 | tough | elite meadow | 4×basic 1×tough | 4/2.2 | Tanuki's Satchel (rare, supplies) |
| meadow-boss | boss | 4 | boss | boss meadow | 1×boss/guard 2×basic 1×tough/guard | 11/3.3 | Sansin's Royal Pouch (epic, supplies) |

Boss: **Sansin**, gimmick `guard`, layout back `..B..` / front `b.G.b`, bossHp x2.9, bossAtk x1.1. Elite: Brute, `.b.b.`/`b.h.b`.

#### Old Oak Wood (`forest`) - biome forest, Lv 3-4, boss Lv 5
Creatures: basic=Kodama, tough=Leshy, armored=Bulgasari, barrel=Kasa-obake, boss=Yamata no Orochi. Boss def `forest`.

| node | kind | level | role | template / def | fielded | avg HP/ATK | unique drop |
|---|---|---|---|---|---|---|---|
| forest-0 | normal | 3 | basic | guard-post [shield] | 2×basic | 3/3.5 | Kodama's Mantle (common, hp) |
| forest-1 | normal | 3 | armored | armor-lesson [armor] | 1×armored | 3/2.0 | Bulgasari's Amulet (common, hp) |
| forest-2 | normal | 3 | barrel | powder-keg [barrel] | 2×basic 1×barrel | 4/3.0 | Kasa-obake's Amulet (rare, hp) |
| forest-3 | normal | 4 | basic | crossfire | 4×basic 2×barrel | 2/3.0 | Kodama's Scale (common, block) |
| forest-4 | normal | 4 | armored | shell | 3×basic 1×armored | 2/3.0 | Bulgasari's Bowstring (common, atk:archer) |
| forest-e0 | elite | 4 | tough | elite forest | 1×tough 2×basic | 6/3.3 | Leshy's Mantle (rare, hp) |
| forest-boss | boss | 5 | boss | boss forest | 2×basic 2×tough/regrow 1×boss/regrow | 17/5.0 | Yamata no Orochi's Gilded Barb (epic, atk:spearman) |

Boss: **Orochi**, gimmick `regrow`, layout back `b...b` / front `H.B.H`, bossHp x1.8, bossAtk x1.1. Elite: Bodyguard, `..h..`/`.b.b.`.

#### Bamboo Valley (`bamboo`) - biome forest, Lv 3-4, boss Lv 5
Creatures: basic=Shanxiao, tough=Baihu, armored=Baize, barrel=Nian, boss=Qiongqi. Boss def `bamboo`.

| node | kind | level | role | template / def | fielded | avg HP/ATK | unique drop |
|---|---|---|---|---|---|---|---|
| bamboo-0 | normal | 3 | basic | boost [drummer +] | 1×tough | 5/2.0 | Shanxiao's Barb (rare, atk:spearman) |
| bamboo-1 | normal | 3 | armored | armor-lesson [armor] | 1×armored | 3/3.0 | Baize's Quill (common, atk:archer) |
| bamboo-2 | normal | 4 | barrel | crossfire | 4×basic 2×barrel | 2/3.0 | Nian's Scale (common, block) |
| bamboo-3 | normal | 4 | basic | stack | 4×basic | 3/3.5 | Shanxiao's Amulet (rare, hp) |
| bamboo-e0 | elite | 4 | tough | elite bamboo | 2×armored 1×tough | 5/3.3 | Baihu's Quill (rare, atk:archer) |
| bamboo-e1 | elite | 4 | tough | elite bamboo | 2×armored 1×tough | 5/3.3 | Baihu's Barb (rare, atk:spearman) |
| bamboo-boss | boss | 5 | boss | boss bamboo | 2×basic 2×tough 1×boss/ward | 13/5.4 | Qiongqi's Royal Seal (epic, souls) |

Boss: **Qiongqi**, gimmick `ward(3)`, layout back `b...b` / front `.tBt.`, bossHp x1.7, bossAtk x1.1. Elite: Armoured pair, `.....`/`a.h.a`.

#### Mirror Lake (`lake`) - biome coral, Lv 4-5, boss Lv 6
Creatures: basic=Bannik, tough=Jorogumo, armored=Baku, barrel=Hitotsume-kozo, boss=Medusa. Boss def `lake`.

| node | kind | level | role | template / def | fielded | avg HP/ATK | unique drop |
|---|---|---|---|---|---|---|---|
| lake-0 | normal | 4 | basic | crossfire | 4×basic 2×barrel | 2/3.5 | Bannik's Mantle (common, hp) |
| lake-1 | normal | 4 | armored | shell | 3×basic 1×armored | 3/3.0 | Baku's Amulet (common, hp) |
| lake-2 | normal | 5 | barrel | powder-row | 3×basic 2×barrel | 2/3.3 | Hitotsume-kozo's Quill (common, atk:archer) |
| lake-3 | normal | 5 | basic | shell | 3×basic 1×armored | 3/3.0 | Bannik's Flask (rare, supplies) |
| lake-e0 | elite | 5 | tough | elite lake | 2×basic 2×barrel 1×tough | 12/4.7 | Jorogumo's Offering (rare, souls) |
| lake-e1 | elite | 5 | tough | elite lake | 2×basic 2×barrel 1×tough | 12/5.0 | Jorogumo's Rattle (rare, amount:drummer) |
| lake-boss | boss | 6 | boss | boss lake | 3×basic 1×boss/gaze | 18/5.3 | Medusa's Royal Satchel (epic, supplies) |

Boss: **Medusa**, gimmick `gaze(1)`, layout back `..b..` / front `b.B.b`, bossHp x1.5, bossAtk x1.1. Elite: Powder gang, `.....`/`bxhxb`.

#### Rice Terraces (`rice`) - biome meadow, Lv 5-6, boss Lv 7
Creatures: basic=Kappa, tough=Sobek, armored=Xuanwu, barrel=Jingwei, boss=Scylla. Boss def `beach`.

| node | kind | level | role | template / def | fielded | avg HP/ATK | unique drop |
|---|---|---|---|---|---|---|---|
| rice-0 | normal | 5 | basic | powder-row | 3×basic 2×barrel | 3/3.7 | Kappa's Plate (common, block) |
| rice-1 | normal | 5 | armored | shell | 3×basic 1×armored | 3/3.5 | Xuanwu's Plate (rare, block) |
| rice-2 | normal | 5 | barrel | crossfire | 4×basic 2×barrel | 2/3.3 | Jingwei's Ember (rare, atk:mage) |
| rice-3 | normal | 6 | basic | powder-row | 3×basic 2×barrel | 3/3.7 | Kappa's Edge (common, atk:swordsman) |
| rice-4 | normal | 6 | armored | shell | 3×basic 1×armored | 3/3.8 | Xuanwu's Offering (common, souls) |
| rice-e0 | elite | 6 | tough | elite rice | 4×basic 1×tough | 8/5.2 | Sobek's Pouch (rare, supplies) |
| rice-boss | boss | 7 | boss | boss rice | 2×basic 2×tough 1×boss/sweep | 21/5.6 | Scylla's Ancient Bowstring (epic, atk:archer) |

Boss: **Scylla**, gimmick `sweep`, layout back `b...b` / front `.tBt.`, bossHp x2.1, bossAtk x1. Elite: Brute, `.b.b.`/`b.h.b`.

#### Mossy Ruins (`ruins`) - biome forest, Lv 6-7, boss Lv 8
Creatures: basic=Harpy, tough=Gashadokuro, armored=Nemean Lion, barrel=Cheonyeo Gwisin, boss=Hydra. Boss def `cove`.

| node | kind | level | role | template / def | fielded | avg HP/ATK | unique drop |
|---|---|---|---|---|---|---|---|
| ruins-0 | normal | 6 | basic | shell | 3×basic 1×armored | 3/4.5 | Harpy's Hide (common, block) |
| ruins-1 | normal | 6 | armored | shell | 3×basic 1×armored | 3/4.0 | Nemean Lion's Spearhead (common, atk:spearman) |
| ruins-2 | normal | 7 | barrel | powder-row | 3×basic 2×barrel | 4/4.3 | Cheonyeo Gwisin's Heart (common, hp) |
| ruins-3 | normal | 7 | basic | stack | 4×basic | 4/5.0 | Harpy's Heart (rare, hp) |
| ruins-e0 | elite | 7 | tough | elite ruins | 4×basic 2×barrel 1×tough | 16/7.0 | Gashadokuro's Mantle (rare, hp) |
| ruins-boss | boss | 8 | boss | boss ruins | 2×basic 2×tough 1×boss/regen | 39/7.4 | Hydra's Ancient Pouch (epic, supplies) |

Boss: **Hydra**, gimmick `regen(0.12 HP)`, layout back `b...b` / front `.tBt.`, bossHp x1.3, bossAtk x1. Elite: Powder gang, `b...b`/`bxhxb`.

#### Firefly Marsh (`marsh`) - biome marsh, Lv 6-7, boss Lv 8
Creatures: basic=Mul Gwisin, tough=Jörmungandr, armored=Imugi, barrel=Rusalka, boss=Poseidon. Boss def `coral`.

| node | kind | level | role | template / def | fielded | avg HP/ATK | unique drop |
|---|---|---|---|---|---|---|---|
| marsh-0 | normal | 6 | basic | crossfire | 4×basic 2×barrel | 2/4.3 | Mul Gwisin's Heart (common, hp) |
| marsh-1 | normal | 6 | armored | shell | 3×basic 1×armored | 3/3.8 | Imugi's Bone (rare, hp) |
| marsh-2 | normal | 6 | barrel | powder-row | 3×basic 2×barrel | 3/4.3 | Rusalka's Offering (common, souls) |
| marsh-3 | normal | 7 | basic | shell | 3×basic 1×armored | 4/4.5 | Mul Gwisin's Amulet (common, hp) |
| marsh-4 | normal | 7 | armored | shell | 3×basic 1×armored | 4/4.5 | Imugi's Feather (common, atk:archer) |
| marsh-e0 | elite | 7 | tough | elite marsh | 1×tough 2×basic 1×armored | 16/6.3 | Jörmungandr's Claw (rare, atk:swordsman) |
| marsh-boss | boss | 8 | boss | boss marsh | 3×basic 1×boss/tide 1×tough | 46/6.4 | Poseidon's Royal Amulet (epic, hp) |

Boss: **Poseidon**, gimmick `tide`, layout back `b..b.` / front `.B.bt`, bossHp x2.6, bossAtk x1. Elite: Bodyguard, `..h..`/`.bab.`.

#### Misty Highlands (`highlands`) - biome highlands, Lv 7-8, boss Lv 9
Creatures: basic=Ungnyeo, tough=Griffin, armored=Chimera, barrel=Inmyeonjo, boss=Typhon. Boss def `isles`.

| node | kind | level | role | template / def | fielded | avg HP/ATK | unique drop |
|---|---|---|---|---|---|---|---|
| highlands-0 | normal | 7 | basic | shell | 3×basic 1×armored | 4/4.8 | Ungnyeo's Amulet (common, hp) |
| highlands-1 | normal | 7 | armored | shell | 3×basic 1×armored | 4/4.8 | Chimera's Mantle (common, hp) |
| highlands-2 | normal | 7 | barrel | powder-row | 3×basic 2×barrel | 4/5.0 | Inmyeonjo's Scale (common, block) |
| highlands-3 | normal | 8 | basic | powder-row | 3×basic 2×barrel | 5/4.3 | Ungnyeo's Heart (rare, hp) |
| highlands-4 | normal | 8 | armored | shell | 3×basic 1×armored | 4/4.8 | Chimera's Charm (common, atk:mage) |
| highlands-e0 | elite | 8 | tough | elite highlands | 3×basic 2×armored/bulwark 1×tough | 16/7.2 | Griffin's Talisman (rare, souls) |
| highlands-boss | boss | 9 | boss | boss highlands | 4×basic 1×boss/rage | 47/7.6 | Typhon's Gilded Horn (epic, atk:spearman) |

Boss: **Typhon**, gimmick `rage(1)`, layout back `.w.w.` / front `b.B.b`, bossHp x2, bossAtk x0.8. Elite: Wall, `b.b.b`/`k.h.k`.

### Ashkara

#### Dune Shallows (`dshallows`) - biome dunes, Lv 8-9, boss Lv 10
Creatures: basic=Serket, tough=Sekhmet, armored=Khepri, barrel=Ushabti, boss=Apep. Boss def `dunes`.

| node | kind | level | role | template / def | fielded | avg HP/ATK | unique drop |
|---|---|---|---|---|---|---|---|
| dshallows-0 | normal | 8 | basic | stack | 4×basic | 5/4.8 | Serket's Hide (common, block) |
| dshallows-1 | normal | 8 | armored | shell | 3×basic 1×armored | 4/4.8 | Khepri's Spearhead (common, atk:spearman) |
| dshallows-2 | normal | 8 | barrel | crossfire | 4×basic 2×barrel | 4/4.5 | Ushabti's Charm (rare, atk:mage) |
| dshallows-3 | normal | 9 | basic | stack | 4×basic | 6/5.5 | Serket's Charm (common, atk:mage) |
| dshallows-4 | normal | 9 | armored | shell | 3×basic 1×armored | 5/5.5 | Khepri's Seal (common, souls) |
| dshallows-e0 | elite | 10 | tough | elite dshallows | 2×armored 1×tough | 34/11.0 | Sekhmet's Storied Amulet (epic, hp) |
| dshallows-boss | boss | 10 | boss | boss dshallows | 2×basic 1×boss/harden | 53/8.0 | Apep's Ancient Shell (epic, block) |

Boss: **Apep**, gimmick `harden(2)`, layout back `.....` / front `.bBb.`, bossHp x2.6, bossAtk x1. Elite: Armoured pair, `.....`/`a.h.a`.

#### Seven Palms (`palms`) - biome dunes, Lv 9-10, boss Lv 11
Creatures: basic=Bes, tough=Anubis, armored=Ammit, barrel=Wadjet, boss=Set. Boss def `oasis`.

| node | kind | level | role | template / def | fielded | avg HP/ATK | unique drop |
|---|---|---|---|---|---|---|---|
| palms-0 | normal | 9 | basic | crossfire | 4×basic 2×barrel | 4/5.8 | Bes's Hide (common, block) |
| palms-1 | normal | 9 | armored | shell | 3×basic 1×armored | 5/4.8 | Ammit's Plate (rare, block) |
| palms-2 | normal | 10 | barrel | warband | 3×tough 4×basic 2×barrel | 6/6.1 | Wadjet's Ember (rare, atk:mage) |
| palms-3 | normal | 10 | basic | brood [splitter] | 2×basic 2×tough/splitter 1×barrel | 7/6.8 | Bes's Charm (common, atk:mage) |
| palms-e0 | elite | 11 | tough | elite palms | 2×basic 2×tough/splitter 1×barrel | 28/11.0 | Anubis's Gilded Quill (epic, atk:archer) |
| palms-boss | boss | 11 | boss | boss palms | 3×basic 1×boss/stride | 56/9.5 | Set's Ancient Horn (epic, atk:spearman) |

Boss: **Set**, gimmick `stride`, layout back `...b.` / front `b.B.b`, bossHp x2.6, bossAtk x1. Elite: Brood, `.....`/`bsxsb`.

#### Singing Erg (`erg`) - biome dunes, Lv 9-10, boss Lv 11
Creatures: basic=Dokkaebi, tough=Oni, armored=Cabrakan, barrel=Bulgae, boss=Surtr. Boss def `ash`.

| node | kind | level | role | template / def | fielded | avg HP/ATK | unique drop |
|---|---|---|---|---|---|---|---|
| erg-0 | normal | 9 | basic | powder-row | 3×basic 2×barrel | 6/4.7 | Dokkaebi's Amulet (common, hp) |
| erg-1 | normal | 9 | armored | shell | 3×basic 1×armored | 5/5.0 | Cabrakan's Offering (common, souls) |
| erg-2 | normal | 10 | barrel | warband | 3×tough 4×basic 2×barrel | 6/6.4 | Bulgae's Offering (common, souls) |
| erg-3 | normal | 10 | basic | bastion | 2×basic 3×tough 1×armored | 6/6.3 | Dokkaebi's Bowstring (rare, atk:archer) |
| erg-e0 | elite | 11 | tough | elite erg | 4×basic 2×barrel 1×tough | 37/11.8 | Oni's Rattle (rare, amount:drummer) |
| erg-e1 | elite | 11 | tough | elite erg | 4×basic 2×barrel 1×tough | 37/11.6 | Oni's Ancient Talisman (epic, souls) |
| erg-boss | boss | 11 | boss | boss erg | 2×barrel 2×basic 1×boss/sweep | 66/8.0 | Surtr's Ancient Drumskin (epic, amount:drummer) |

Boss: **Surtr**, gimmick `sweep`, layout back `x...x` / front `b.B.b`, bossHp x2.2, bossAtk x1. Elite: Powder gang, `b...b`/`bxhxb`.

#### Salt Mirror (`saltmirror`) - biome saltflat, Lv 10-11, boss Lv 12
Creatures: basic=Kui, tough=Zipacna, armored=Hundun, barrel=Pixiu, boss=Vucub-Caquix. Boss def `ridge`.

| node | kind | level | role | template / def | fielded | avg HP/ATK | unique drop |
|---|---|---|---|---|---|---|---|
| saltmirror-0 | normal | 10 | basic | bulwark [bulwark] | 3×basic 3×armored/bulwark | 4/5.5 | Kui's Quill (common, atk:archer) |
| saltmirror-1 | normal | 10 | armored | bastion | 2×basic 3×tough 1×armored | 6/6.7 | Hundun's Tusk (rare, atk:spearman) |
| saltmirror-2 | normal | 11 | barrel | gatehouse | 4×basic 2×barrel 1×tough | 10/6.6 | Pixiu's Heart (rare, hp) |
| saltmirror-3 | normal | 11 | basic | brood [splitter] | 2×basic 2×tough/splitter 1×barrel | 7/6.5 | Kui's Feather (common, atk:archer) |
| saltmirror-e0 | elite | 12 | tough | elite saltmirror | 3×basic 2×armored/bulwark 1×tough | 24/12.2 | Zipacna's Rattle (rare, amount:drummer) |
| saltmirror-e1 | elite | 12 | tough | elite saltmirror | 3×basic 2×armored/bulwark 1×tough | 24/12.3 | Zipacna's Satchel (rare, supplies) |
| saltmirror-boss | boss | 12 | boss | boss saltmirror | 2×basic 2×tough 1×boss/stride | 66/12.2 | Vucub-Caquix's Storied Rune (epic, range:swordsman) |

Boss: **Vucub-Caquix**, gimmick `stride`, layout back `b.b..` / front `tB..t`, bossHp x2.2, bossAtk x1. Elite: Wall, `b.b.b`/`k.h.k`.

#### Red Wadi (`wadi`) - biome canyon, Lv 11-12, boss Lv 13
Creatures: basic=Cadejo, tough=Balam, armored=Buluc Chabtan, barrel=Bennu, boss=Ah Puch. Boss def `canyon`.

| node | kind | level | role | template / def | fielded | avg HP/ATK | unique drop |
|---|---|---|---|---|---|---|---|
| wadi-0 | normal | 11 | basic | brood [splitter] | 2×basic 2×tough/splitter 1×barrel | 7/6.5 | Cadejo's Claw (common, atk:swordsman) |
| wadi-1 | normal | 11 | armored | bulwark [bulwark] | 3×basic 3×armored/bulwark | 4/6.0 | Buluc Chabtan's Bead (common, souls) |
| wadi-2 | normal | 11 | barrel | gatehouse | 4×basic 2×barrel 1×tough | 11/5.8 | Bennu's Spearhead (common, atk:spearman) |
| wadi-3 | normal | 12 | basic | warband | 3×tough 4×basic 2×barrel | 7/7.0 | Cadejo's Charm (rare, atk:mage) |
| wadi-4 | normal | 12 | armored | bastion | 2×basic 3×tough 1×armored | 7/6.8 | Buluc Chabtan's Scale (common, block) |
| wadi-e0 | elite | 13 | tough | elite wadi | 4×basic 2×barrel 1×tough | 40/13.4 | Balam's Heart (rare, hp) |
| wadi-boss | boss | 13 | boss | boss wadi | 2×basic 2×tough 1×boss/summoner | 58/14.2 | Ah Puch's Royal Lens (epic, amount:spyglass) |

Boss: **Ah Puch**, gimmick `summoner`, layout back `b...b` / front `t.B.t`, bossHp x1.8, bossAtk x1. Elite: Powder gang, `b...b`/`bxhxb`.

#### Dust Bazaar (`bazaar`) - biome dunes, Lv 11-12, boss Lv 13
Creatures: basic=Gumiho, tough=Cerberus, armored=Jowangshin, barrel=Fenghuang, boss=Loki. Boss def `lavafall`.

| node | kind | level | role | template / def | fielded | avg HP/ATK | unique drop |
|---|---|---|---|---|---|---|---|
| bazaar-0 | normal | 11 | basic | bulwark [bulwark] | 3×basic 3×armored/bulwark | 4/6.0 | Gumiho's Mantle (common, hp) |
| bazaar-1 | normal | 11 | armored | bastion | 2×basic 3×tough 1×armored | 6/6.3 | Jowangshin's Amulet (common, hp) |
| bazaar-2 | normal | 11 | barrel | warband | 3×tough 4×basic 2×barrel | 7/6.4 | Fenghuang's Bead (common, souls) |
| bazaar-3 | normal | 12 | basic | brood [splitter] | 2×basic 2×tough/splitter 1×barrel | 7/7.8 | Gumiho's Tassel (rare, amount:banner) |
| bazaar-4 | normal | 12 | armored | bastion | 2×basic 3×tough 1×armored | 7/6.3 | Jowangshin's Barb (common, atk:spearman) |
| bazaar-e0 | elite | 13 | tough | elite bazaar | 4×basic 1×basic/summoner 2×tough | 24/13.9 | Cerberus's Offering (rare, souls) |
| bazaar-boss | boss | 13 | boss | boss bazaar | 2×basic 2×tough 1×boss/splitter | 61/14.0 | Loki's Gilded Sigil (epic, range:mage) |

Boss: **Loki**, gimmick `splitter`, layout back `b...b` / front `t.B.t`, bossHp x2.2, bossAtk x1. Elite: Hive, `b.u.b`/`tb.bt`.

#### Tomb Approach (`tomb`) - biome temple, Lv 12-13, boss Lv 14
Creatures: basic=Mummy, tough=Camazotz, armored=Sphinx, barrel=Taweret, boss=Ra. Boss def `temple`.

| node | kind | level | role | template / def | fielded | avg HP/ATK | unique drop |
|---|---|---|---|---|---|---|---|
| tomb-0 | normal | 12 | basic | mender [healer] | 3×basic 1×basic/healer 2×tough | 7/7.0 | Mummy's Mantle (common, hp) |
| tomb-1 | normal | 12 | armored | bastion | 2×basic 3×tough 1×armored | 7/7.0 | Sphinx's Pennant (rare, amount:banner) |
| tomb-2 | normal | 13 | barrel | gatehouse | 4×basic 2×barrel 1×tough | 13/8.2 | Taweret's Heart (rare, hp) |
| tomb-3 | normal | 13 | basic | hive [summoner] | 4×basic 1×basic/summoner 2×tough | 8/8.1 | Mummy's Shell (common, block) |
| tomb-e0 | elite | 14 | tough | elite tomb | 3×basic 1×basic/healer 2×tough | 38/15.0 | Camazotz's Amulet (rare, hp) |
| tomb-boss | boss | 14 | boss | boss tomb | 2×barrel 2×basic 1×boss/veil | 82/14.7 | Ra's Royal Hide (epic, block) |

Boss: **Ra**, gimmick `veil(1)`, layout back `x...x` / front `.bBb.`, bossHp x2, bossAtk x1. Elite: Field hospital, `b.m.b`/`.tbt.`.

#### Sun Citadel (`citadel`) - biome temple, Lv 13-14, boss Lv 15
Creatures: basic=Huay Chivo, tough=Minotaur, armored=Taotie, barrel=Firebird, boss=Zmey Gorynych. Boss def `caldera`.

| node | kind | level | role | template / def | fielded | avg HP/ATK | unique drop |
|---|---|---|---|---|---|---|---|
| citadel-0 | normal | 13 | basic | brood [splitter] | 2×basic 2×tough/splitter 1×barrel | 10/8.3 | Huay Chivo's Horn (common, atk:spearman) |
| citadel-1 | normal | 13 | armored | bastion | 2×basic 3×tough 1×armored | 8/8.0 | Taotie's Feather (common, atk:archer) |
| citadel-2 | normal | 13 | barrel | gatehouse | 4×basic 2×barrel 1×tough | 13/7.8 | Firebird's Edge (common, atk:swordsman) |
| citadel-3 | normal | 14 | basic | brood [splitter] | 2×basic 2×tough/splitter 1×barrel | 11/7.8 | Huay Chivo's Amulet (rare, hp) |
| citadel-4 | normal | 14 | armored | bulwark [bulwark] | 3×basic 3×armored/bulwark | 6/7.7 | Taotie's Bead (rare, souls) |
| citadel-e0 | elite | 15 | tough | elite citadel | 3×basic 1×basic/healer 2×tough | 42/15.0 | Minotaur's Gemstone (rare, amount:spyglass) |
| citadel-boss | boss | 15 | boss | boss citadel | 1×tough/regrow 2×basic 1×boss/regrow | 94/13.8 | Zmey Gorynych's Storied Pouch (epic, supplies) |

Boss: **Zmey Gorynych**, gimmick `regrow`, layout back `..H..` / front `b.B.b`, bossHp x2.6, bossAtk x1. Elite: Field hospital, `b.m.b`/`.tbt.`.

### Global

### Enemy kinds
| kind | char | mechanic |
|---|---|---|
| healer ✚ | m | heals each adjacent enemy by 2 at the end of every turn it survives |
| splitter ⑂ | s | splits into two 1-HP enemies when destroyed |
| summoner ⚑ | u | calls a new minion into an empty enemy tile at the end of every turn it survives |
| bulwark ⛨ | k | blocks overkill and Pierce from reaching the enemy behind it |

### Boss / elite gimmicks
| gimmick | text | used by |
|---|---|---|
| guard ♜ | takes no damage while its guard (marked ♜) still stands | Sansin |
| ward ◈ | ignores every hit weaker than {n} damage | Qiongqi |
| veil ☁ | cannot be hurt during the first {n} turn(s) | Ra |
| gaze ◉ | attackers in its column lose {n} ATK | Medusa |
| sweep ≋ | also strikes both neighbouring columns for half its damage | Scylla, Surtr |
| stride ⇄ | steps one column sideways every turn, swapping places with whoever is there | Set, Vucub-Caquix |
| tide 〰 | every enemy is carried one column each turn: the back row drifts left, the front row right | Poseidon |
| regrow ❀ | grows back once with {n} HP at the end of a turn if the fight is not over | Orochi, Zmey Gorynych |
| regen ✚ | heals {n} HP at the end of every turn | Hydra |
| rage ♨ | gains {n} extra ATK every turn it survives | Typhon |
| harden ▣ | gains 1 armor every turn it survives (up to {n}) | Apep |

### Template roles
| char | role | stats |
|---|---|---|
| b | basic: | base HP/ATK |
| w | weak: | 60% HP |
| t | tough: | 140% HP, +1 ATK from Lv5, front row |
| h | heavy: | 220% HP, +1 ATK |
| a | armored: | armor 1 (2 from Lv9), 90% HP |
| x | barrel: | 1 HP, blast 2 to neighbours |
| G | guard | / H regrow head (boss defs only) |

### Templates by tier
| tier | Lv | name | teach | back/front |
|---|---|---|---|---|
| 1 | 1-1 | first-blood | attack | `.....`/`.b.b.` |
| 1 | 1-3 | long-shot | range | `.w.w.`/`.....` |
| 1 | 1-3 | boost | drummer + | `.....`/`..t..` |
| 1 | 2-3 | twin-lane | overkill | `..b..`/`..b..` |
| 1 | 2-3 | powder-keg | barrel | `.....`/`.bxb.` |
| 1 | 2-3 | guard-post | shield | `.....`/`b...b` |
| 1 | 3-3 | armor-lesson | armor | `.....`/`..a..` |
| 2 | 5-6 | powder-row |  | `.....`/`bxbxb` |
| 2 | 4-6 | stack |  | `b.b..`/`b.b..` |
| 2 | 4-6 | shell |  | `..b..`/`.bab.` |
| 2 | 4-6 | crossfire |  | `.b.b.`/`bx.xb` |
| 3 | 7-9 | powder-row |  | `.....`/`bxbxb` |
| 3 | 7-9 | stack |  | `b.b..`/`b.b..` |
| 3 | 7-9 | shell |  | `..b..`/`.bab.` |
| 3 | 7-9 | crossfire |  | `.b.b.`/`bx.xb` |
| 4 | 10-12 | gatehouse |  | `.b.b.`/`bxhxb` |
| 4 | 10-12 | bastion |  | `b...b`/`ta.ht` |
| 4 | 10-12 | warband |  | `tb.bt`/`bxhxb` |
| 4 | 10-12 | mender | healer | `b.m.b`/`.tbt.` |
| 4 | 10-12 | brood | splitter | `.....`/`bsxsb` |
| 4 | 10-10 | hive | summoner | `b.u.b`/`tb.bt` |
| 4 | 10-12 | bulwark | bulwark | `b.b.b`/`k.k.k` |

### Enemy types per sub-area and art
| sub-area | basic | tough | armored | barrel | boss |
|---|---|---|---|---|---|
| meadow | Alux `alux` | Tanuki `tanuki` | Jangseung `jangseung` | Chōchin-obake `chochin-obake` | Sansin `sansin` |
| forest | Kodama `kodama` | Leshy `leshy` | Bulgasari `bulgasari` | Kasa-obake `kasa-obake` | Yamata no Orochi `orochi` |
| bamboo | Shanxiao `shanxiao` | Baihu `baihu` | Baize `baize` | Nian `nian` | Qiongqi `qiongqi` |
| lake | Bannik `bannik` | Jorogumo `jorogumo` | Baku `baku` | Hitotsume-kozo `hitotsume-kozo` | Medusa `medusa` |
| rice | Kappa `kappa` | Sobek `sobek` | Xuanwu `xuanwu` | Jingwei `jingwei` | Scylla `scylla` |
| ruins | Harpy `harpy` | Gashadokuro `gashadokuro` | Nemean Lion `nemean-lion` | Cheonyeo Gwisin `cheonyeo-gwisin` | Hydra `hydra` |
| marsh | Mul Gwisin `mul-gwisin` | Jörmungandr `jormungandr` | Imugi `imugi` | Rusalka `rusalka` | Poseidon `poseidon` |
| highlands | Ungnyeo `ungnyeo` | Griffin `griffin` | Chimera `chimera` | Inmyeonjo `inmyeonjo` | Typhon `typhon` |
| dshallows | Serket `serket` | Sekhmet `sekhmet` | Khepri `khepri` | Ushabti `ushabti` | Apep `apep` |
| palms | Bes `bes` | Anubis `anubis` | Ammit `ammit` | Wadjet `wadjet` | Set `set` |
| erg | Dokkaebi `dokkaebi` | Oni `oni` | Cabrakan `cabrakan` | Bulgae `bulgae` | Surtr `surtr` |
| saltmirror | Kui `kui` | Zipacna `zipacna` | Hundun `hundun` | Pixiu `pixiu` | Vucub-Caquix `vucub-caquix` |
| wadi | Cadejo `cadejo` | Balam `balam` | Buluc Chabtan `buluc-chabtan` | Bennu `bennu` | Ah Puch `ah-puch` |
| bazaar | Gumiho `gumiho` | Cerberus `cerberus` | Jowangshin `jowangshin` | Fenghuang `fenghuang` | Loki `loki` |
| tomb | Mummy `mummy` | Camazotz `camazotz` | Sphinx `sphinx` | Taweret `taweret` | Ra `ra` |
| citadel | Huay Chivo `huay-chivo` | Minotaur `minotaur` | Taotie `taotie` | Firebird `firebird` | Zmey Gorynych `zmey` |

---

## Part B: revamp proposal

### B0. Design goals

1. **Every sub-area has an identity** drawn from its landscape and myth set; today the roster is a palette swap (basic / tough / armored / barrel per area) and 12 of 16 boss fights are re-skins of retired-region fights (see A).
2. **Teach once, then combine.** Each new mechanic is introduced alone in an early fight of one sub-area, recombined in the middle, tested by the elite, used by the boss. Greenvale teaches the whole vocabulary at low numbers; Ashkara re-uses each idea with a twist and adds its own.
3. **Keep units simple.** One line of rules per enemy, one badge. Prefer data-only changes (existing kinds / gimmicks applied to normal enemies) before new engine rules.
4. **Uniform shape:** every sub-area = 6 battles (B1-B6) + boss. B6 is the elite (in the four sub-areas that already have two elite spots, B5 and B6 are both elites: B5 a lighter pair, B6 the full test). Row labels use D1-D6 for the rough difficulty step inside the area (D1 gentle, D6 the area's hardest non-boss; boss = D7, about the old boss cost).

Layout notation (as in `gen.js`): `b w t h a x m s u k` unchanged; proposed new letters are in B0.1. Compositions below are written by creature, front row first when it matters.

#### B0.1 Enemy kinds: existing and proposed

| Kind (badge) | Rule (one line) | Status | Taught in |
|---|---|---|---|
| Healer ✚, Splitter ⑂, Summoner ⚑, Bulwark ⛨ | as in A | exists (tier 4+, Lv10+ today) | moved earlier: Rice, Highlands, Marsh, Ruins |
| Swift ⇄ (`f`) | steps one column each turn (the boss `stride` gimmick on a normal enemy) | data only | Lake |
| Mirage ☁ (`v`) | cannot be hurt on turn 1 (boss `veil 1` on a normal enemy) | data only | Old Oak Wood |
| Thorn ✸ (`n`) | each attacker that hits it costs the hero 1 HP | new, small rule in `dealDamage` | Bamboo Valley |
| Fuse ⏲ (`z`) | lantern: blasts 3 into its neighbours AND hits the hero for 3 at the end of turn 2 if still alive; shot early it behaves as a barrel | new (barrel + timer) | Mossy Ruins |
| Chief ⚔ (`c`) | adjacent enemies have +1 ATK while it stands | new, derived stat | Seven Palms |
| Skewer ➶ (`p`) | its strike ignores Shield block in its column | new, one flag in `incomingByColumn` | Seven Palms |
| Grudge ♨ (`g`) | gains +2 ATK when an adjacent enemy dies | new, one hook in `dealDamage` | Singing Erg |
| Leech ❣ (`l`) | heals itself 2 each time it damages the hero | new, one hook in `resolveTurn` | Red Wadi |

Boss gimmicks are not new: every boss re-uses a validated gimmick / kind / layout from `boss-defs.js` (so `validate-gen.js bosses` balance carries over), with a new creature, intro text and arena.

#### B0.2 Art legend

`have` = SVG exists in `prototype/assets/units/`. `pick` = chosen in `art-samples/SUMMARY.md` but not yet in `assets/units/` (Isis, Hades, Veles, Chernobog, Xtabay, Jeoseung Saja: wiring only). **NEW** = no art yet (named in the landscape docs, e.g. Jiangshi, Rokurokubi, Kikimora, Bakeneko, Vodyanoy, or invented).

---

### B1. Greenvale (Lv 1-8): learn the vocabulary

#### 1. Sunny Meadows (Lv 1-2, boss 4) - theme: "Mischief in the blossoms"
Rolling wildflower grass, a pond, a lone blossom hill. Japanese field spirits and Korean/Maya house pranksters: small, cute, harmless-looking.

| Creature | Slot | Mechanic | Art |
|---|---|---|---|
| Alux | basic | plain | have |
| Kamaitachi | weak (60% HP), back row | plain, ranged target | have |
| Tanuki | tough | 140% HP, needs a boost | have |
| Chōchin-obake | barrel | explodes 2 | have |
| Boss Sansin + Baihu tiger | boss + guard | Guard | have |

| # | Battle | Composition | Idea | D | Unique drop idea |
|---|---|---|---|---|---|
| B1 | Sprout Patrol | 2 Alux | attack | 1 | souls charm |
| B2 | Kamaitachi Ridge | 2 Kamaitachi (back) | range | 1 | archer ATK ring |
| B3 | Round Belly | 1 Tanuki | boost a hit (drummer) | 2 | drum amount |
| B4 | Lantern Lane | Alux, Chōchin, Alux | barrel chain | 2 | HP charm |
| B5 | Piggyback | Alux behind Alux, 2 Kamaitachi | overkill + range | 3 | swordsman ATK |
| B6 (elite) | Blossom Brute | Tanuki heavy, 2 Alux, 2 Kamaitachi | boost + overkill | 4 | rare: HP band |
| Boss | Sansin | Sansin behind Baihu, 2 Alux | kill the guard, overkill carries | 5 | Legendary: Cleaver (spill) |

#### 2. Old Oak Wood (Lv 3-4, boss 5) - theme: "Hide and seek in the hollow trunk"
Dense oak forest, dappled light, sacred oak with shimenawa. Forest guardians that hide, shield and out-wait you.

| Creature | Slot | Mechanic | Art |
|---|---|---|---|
| Kodama | basic | Mirage on some (vanishes turn 1) | have |
| Leshy | tough | plain, high ATK | have |
| Jangsan-beom | armored | armor 1 | have |
| Kasa-obake | barrel | explodes | have |
| Boss Tengu | boss | Veil 1 | have |

| # | Battle | Composition | Idea | D | Unique drop idea |
|---|---|---|---|---|---|
| B1 | Acorn Guards | 2 Kodama (ATK high) | Shield blocks a column | 1 | shield block+ |
| B2 | Bark Coat | 1 Jangsan-beom | armor eats weak hits | 2 | armor-pierce ring |
| B3 | Peek-a-boo | 2 Kodama (1 Mirage) | wait a turn, don't waste shots | 2 | supplies |
| B4 | Hollow Row | Kodama, Kasa-obake, Kodama, Leshy behind | barrel + back-row target | 3 | HP charm |
| B5 | Thick Bark | 3 Kodama, Jangsan-beom | armor behind a front enemy (overkill reduced) | 3 | souls |
| B6 (elite) | Ancient Leshy | Leshy heavy, 2 Mirage Kodama, Jangsan-beom | mirage + armor + heavy | 4 | rare: block |
| Boss | Tengu | Tengu (veiled turn 1), 2 Leshy, 2 Kodama | clear escort on turn 1, strike on turn 2 | 5 | Legendary: Opening Fang |

#### 3. Bamboo Valley (Lv 3-4, boss 5) - theme: "Spikes in the stalks"
Bamboo groves on both banks, a stream band. Spiny, thorny, stampeding beasts; punishes careless clicking.

| Creature | Slot | Mechanic | Art |
|---|---|---|---|
| Yutu (jade rabbit) | basic | plain, fast hitter | have |
| Shanxiao | basic | Thorn ✸ | have |
| Baize | armored | armor | have |
| Nian | barrel | explodes | have |
| Baihu | tough | heavy ATK | have |
| Boss Qiongqi | boss | Ward 2 | have |

| # | Battle | Composition | Idea | D | Unique drop idea |
|---|---|---|---|---|---|
| B1 | Stalk Hoppers | 3 Yutu | plain wave: ATK spread | 1 | swordsman ATK |
| B2 | Prickly Pair | 1 Shanxiao, 1 Yutu | Thorn: don't hit it for nothing | 2 | thorn-guard (hp) |
| B3 | Stampede | Baihu, Yutu, Yutu | tough + boost | 2 | drum amount |
| B4 | Needle Wall | 2 Shanxiao, Baize between | choose the cheap column | 3 | spear ATK |
| B5 (elite) | Bamboo Drive | 2 Baize, Nian, Yutu | armor + barrel line | 3 | rare: souls |
| B6 (elite) | Qiongqi's Pack | Baihu heavy, 2 Shanxiao, 2 Baize | Thorn + armor + heavy | 4 | rare: range |
| Boss | Qiongqi | Qiongqi (Ward 2), 2 Baihu, 2 Yutu | weak hits glance off: stack boosts | 5 | Legendary: Thick Hide |

#### 4. Mirror Lake (Lv 4-5, boss 6) - theme: "The reflection moves"
Big lake, willows, torii standing in water, jetty. Water folk that dodge sideways and drag things with the current.

| Creature | Slot | Mechanic | Art |
|---|---|---|---|
| Kappa | basic | Swift ⇄ on some | have |
| Rusalka | basic | plain | have |
| Siren | weak, back | plain, ranged | have |
| Baku | armored | armor | have |
| Jingwei | barrel | explodes | have |
| Boss Imugi | boss | Tide | have |

| # | Battle | Composition | Idea | D | Unique drop idea |
|---|---|---|---|---|---|
| B1 | Shoreline | 2 Kappa (Swift) | targets move: aim where they will be | 2 | range archer |
| B2 | Reed Song | 2 Siren back, Rusalka | range vs a back row | 2 | archer ATK |
| B3 | Stepping Stones | Kappa (Swift), Baku, Jingwei | swift + armor + barrel | 3 | HP |
| B4 | Lily Line | 3 Rusalka, Jingwei | barrel chain along the front | 3 | amount |
| B5 (elite) | Kappa Pair | 2 Kappa (Swift), Baku | swift pair, overkill unreliable | 4 | rare: block |
| B6 (elite) | Lantern Raft | Rusalka heavy, 2 Jingwei, 2 Siren | big chain vs a heavy | 4 | rare: souls |
| Boss | Imugi | Imugi, Baku, 2 Kappa | everything drifts a column each turn | 5 | Legendary: Powder Charm |

#### 5. Rice Terraces (Lv 5-6, boss 7) - theme: "Tending the paddies"
Stepped flooded paddies, waterwheel, storehouse. Farm spirits that mend each other; the terraces read as tiers.

| Creature | Slot | Mechanic | Art |
|---|---|---|---|
| Dokkaebi | basic | plain | have |
| Shanxiao | tough | Thorn (recap) | have |
| Kitsune | basic | **Healer** ✚ (heals neighbours 2) | have |
| Xuanwu | armored | armor | have |
| Jingwei | barrel | explodes | have |
| Boss Bulgasari | boss | Healer (mends neighbours) | have |

| # | Battle | Composition | Idea | D | Unique drop idea |
|---|---|---|---|---|---|
| B1 | Paddy Hands | 3 Dokkaebi | warm-up, spread damage | 1 | mage ATK |
| B2 | The Nurse | Kitsune (Healer) + Dokkaebi | kill the healer first | 2 | supplies |
| B3 | Tiered Bank | Xuanwu front, Kitsune behind | healer behind armor: overkill | 3 | pierce ring |
| B4 | Wheel Spill | Dokkaebi, Jingwei, Dokkaebi, Kitsune | barrel kills healer's guard | 3 | amount |
| B5 | Harvest Line | 2 Shanxiao, Kitsune, Xuanwu | thorn + healer + armor | 4 | souls |
| B6 (elite) | Field Hospital | Kitsune x2, tough Shanxiao heavy, 2 Dokkaebi | two healers, one turn | 5 | rare: HP |
| Boss | Bulgasari | Bulgasari (Healer boss), 2 Xuanwu, 2 Dokkaebi | cut the boss off from its guards | 6 | Legendary: Lifebloom |

#### 6. Mossy Ruins (Lv 6-7, boss 8) - theme: "Lanterns in the broken shrine"
Crumbled walls, glowing lanterns, low mist. Walls that shelter, lanterns that count down.

| Creature | Slot | Mechanic | Art |
|---|---|---|---|
| Jiangshi | basic | plain (hopper) | **NEW** (or Mummy: have) |
| Chōchin-obake | barrel | **Fuse** ⏲ | have |
| Nurikabe | armored | **Bulwark** ⛨ | have |
| Gashadokuro | tough | heavy | have |
| Ushabti | armored | armor | have |
| Boss Gashadokuro | boss | Sweep | have |

| # | Battle | Composition | Idea | D | Unique drop idea |
|---|---|---|---|---|---|
| B1 | Stone Sentries | Ushabti, Jiangshi, Jiangshi | armor recap | 2 | block |
| B2 | Burning Down | Chōchin (Fuse) + Jiangshi | shoot the lantern before it blows | 2 | blast radius |
| B3 | The Wall | Nurikabe front, Jiangshi behind | overkill is blocked: hit the wall | 3 | spear ATK |
| B4 | Two Lanterns | 2 Chōchin (Fuse), 3 Jiangshi | fuse timing, triage | 4 | souls |
| B5 | Collapsed Hall | 2 Nurikabe, Gashadokuro behind, Chōchin | walls hide the heavy; blow the lantern | 4 | HP |
| B6 (elite) | Shrine Warden | 3 Nurikabe, Ushabti, Chōchin x2 | bulwark + fuse + armor | 5 | rare: pierce |
| Boss | Gashadokuro | Gashadokuro (Sweep), 2 Jiangshi, 2 Chōchin | neighbours take half damage; clear fuses | 6 | Legendary: Sunder Band |

#### 7. Firefly Marsh (Lv 6-7, boss 8) - theme: "Lights that call to others"
Murky wetland, boardwalks, dusk fireflies. Drowned ghosts and will-o'-wisps that keep the line full.

| Creature | Slot | Mechanic | Art |
|---|---|---|---|
| Mul Gwisin | basic | plain | have |
| Dalgyal Gwisin | weak | plain (egg ghost) | have |
| Rokurokubi | tough | **Summoner** ⚑ (long neck calls a wisp) | **NEW** (or Kikimora **NEW**; Jorogumo have) |
| Imugi | armored | armor | have |
| Rusalka | barrel | explodes (marsh gas) | have |
| Boss Orochi | boss | Regrow | have |

| # | Battle | Composition | Idea | D | Unique drop idea |
|---|---|---|---|---|---|
| B1 | Wisps | 3 Mul Gwisin | warm-up, flat HP | 2 | range |
| B2 | The Caller | Rokurokubi (Summoner) + Mul Gwisin | kill the summoner first | 3 | summon-bane (hp) |
| B3 | Gas Pocket | Rusalka x2, Mul Gwisin x2 | barrel chain, mind fresh wisps | 3 | amount |
| B4 | Slow Tide | Imugi front, Rokurokubi behind | armored guard shields the summoner | 4 | souls |
| B5 | Boardwalk | 2 Rokurokubi, Dalgyal x2 | two summoners, one turn | 5 | mage ATK |
| B6 (elite) | Will-o'-wisp Court | Rokurokubi heavy, Imugi, 2 Rusalka | summoner + armor + barrels | 5 | rare: block |
| Boss | Orochi | Orochi + 2 heads (Regrow), 2 Mul Gwisin | each head regrows once | 6 | Legendary: Last Breath |

#### 8. Misty Highlands (Lv 7-8, boss 9) - theme: "The stone guardians wake" (Greenvale final exam)
Rocky pasture, standing stones, fog. Mountain guardians, thunder, and a combination of everything learned.

| Creature | Slot | Mechanic | Art |
|---|---|---|---|
| Oni | tough/heavy | heavy | have |
| Komainu | armored | **Bulwark** ⛨ | have |
| Hundun | basic | **Splitter** ⑂ (formless; splits into two 1-HP) | have |
| Haetae | armored | armor | have |
| Inmyeonjo | barrel | explodes | have |
| Boss Raijin | boss | Fury (rage) | have |

| # | Battle | Composition | Idea | D | Unique drop idea |
|---|---|---|---|---|---|
| B1 | Foggy Pass | 2 Haetae, Hundun | splitter: don't overkill into split spawn | 3 | pierce |
| B2 | Pair of Lions | Komainu, Oni behind, Hundun | bulwark protects a heavy | 3 | souls |
| B3 | Split Boulders | 2 Hundun, Inmyeonjo, 2 Haetae | barrel vs splitters | 4 | amount |
| B4 | Healer on the Ridge | Komainu front, Kitsune behind, 2 Hundun | healer + bulwark + splitter | 4 | HP |
| B5 | Oni Gate | Oni x2, 2 Komainu | two walls, two heavies | 5 | block |
| B6 (elite) | Thunder Choir | Oni heavy, Komainu x2, Hundun x2, Inmyeonjo | splitter + bulwark + barrel | 6 | rare: range |
| Boss | Raijin | Raijin (+1 ATK each turn), 2 Komainu, 2 Hundun | race the drum; Greenvale ceiling | 6 | Legendary: Great Horn |

*(Kitsune returns from Rice Terraces as the healer; the B4 fight is the first in the game with three kinds.)*

---

### B2. Ashkara (Lv 8-15): same vocabulary, higher stakes, plus five new ideas

Ashkara opens by re-using Greenvale ideas with a twist ("armor is now 2", "the lantern also burns the hero"), then layers its own kinds: Chief, Skewer, Grudge, Leech and mixed kinds. Numbers follow the existing curve (RAMP in `gen.js`).

#### 9. Dune Shallows (Lv 8-9, boss 10) - theme: "Scavengers of the caravan graveyard"
Bleached ribs, half-buried wagon, fossil sand. Desert vermin that sting and shrug off weak hits (armor 2).

| Creature | Slot | Mechanic | Art |
|---|---|---|---|
| Serket | basic | **Thorn** ✸ (scorpion) | have |
| Khepri | armored | armor 2 | have |
| Sekhmet | tough | heavy | have |
| Ushabti | barrel | explodes | have |
| Wadjet (cute) | weak, back | plain | have |
| Boss Apep | boss | Harden | have |

| # | Battle | Composition | Idea | D | Unique drop idea |
|---|---|---|---|---|---|
| B1 | Caravan Scraps | 3 Serket | thorn recap at higher HP | 2 | HP |
| B2 | Shell Game | 2 Khepri, Wadjet back | armor 2 needs a boosted hit | 3 | amount |
| B3 | Powder Wagon | Serket, Ushabti, Serket, Sekhmet | barrel + thorn lines | 3 | souls |
| B4 | Sand Veil | 2 Serket (Mirage), Khepri | Mirage again | 4 | block |
| B5 | Sunbaked | 2 Khepri, Sekhmet heavy | armor + heavy | 4 | pierce |
| B6 (elite) | Sekhmet's Pride | Sekhmet heavy, 2 Khepri, 2 Serket | all of the above | 5 | rare: ATK |
| Boss | Apep | Apep (+1 armor per turn, max 2), 2 Serket | burst before it hardens | 6 | Legendary: Sunder Band |

#### 10. Seven Palms (Lv 9-10, boss 11) - theme: "The oasis court"
Palm-ringed pool, papyrus, irrigation ditches. Courtiers and guardians: someone is always in charge.

| Creature | Slot | Mechanic | Art |
|---|---|---|---|
| Bes | basic | **Chief** ⚔ (+1 ATK to neighbours) | have |
| Wadjet (fierce) | tough | **Skewer** ➶ (spit ignores Shield) | have |
| Ammit | armored | armor | have |
| Khepri | basic | Splitter ⑂ (scarab brood) | have |
| Papyrus Jar | barrel | explodes | **NEW** |
| Boss Set | boss | Stride | have |

| # | Battle | Composition | Idea | D | Unique drop idea |
|---|---|---|---|---|---|
| B1 | Court Guard | Bes (Chief), 2 Khepri | kill the chief or it buffs everyone | 3 | block |
| B2 | Cobra Spit | 2 Wadjet (Skewer) | Shield doesn't help: kill them | 3 | spear ATK |
| B3 | Scarab Brood | 3 Khepri (Splitter), jar | splitters beside a barrel | 4 | amount |
| B4 | Ammit's Stand | Ammit front, Bes behind, Wadjet | armor shields the chief | 4 | pierce |
| B5 | Palm Grove | 2 Bes, 2 Wadjet, jar | two chiefs, two skewers | 5 | souls |
| B6 (elite) | The Viziers | Ammit heavy, Bes, Wadjet, 2 Khepri | chief + skewer + split | 6 | rare: block |
| Boss | Set | Set (steps one column each turn), 2 Bes, 2 Wadjet | track the stride; chiefs raise ATK | 7 | Legendary: Opening Fang |

#### 11. Singing Erg (Lv 9-10, boss 11) - theme: "The dune sings, then breaks"
Rippled dunes, chime poles, buried statue heads. Trickster fire-folk and earth-shakers; enemies react to losses.

| Creature | Slot | Mechanic | Art |
|---|---|---|---|
| Dokkaebi | basic | plain, throws fuse | have |
| Oni | tough | **Grudge** ♨ | have |
| Talos | armored | armor 2 | have |
| Bulgae | barrel | **Fuse** ⏲ (recap) | have |
| Boss Cabrakan | boss | Sweep (quake) | have |

| # | Battle | Composition | Idea | D | Unique drop idea |
|---|---|---|---|---|---|
| B1 | Chime Poles | 3 Dokkaebi, Bulgae (Fuse) | fuse recap, time pressure | 3 | blast |
| B2 | Grudge Match | Oni, 2 Dokkaebi | kill neighbours first and the Oni angers | 4 | HP |
| B3 | Slip Face | Talos front, Oni behind | armor guards a grudge | 4 | pierce |
| B4 | Singing Sand | 2 Bulgae, Oni, 2 Dokkaebi | chain explosions anger Oni | 5 | souls |
| B5 (elite) | Dune Quake | Cabrakan heavy, 2 Talos | armor + heavy | 5 | rare: ATK |
| B6 (elite) | Oni Brothers | 2 Oni, 2 Bulgae, Dokkaebi | grudge chain | 6 | rare: block |
| Boss | Cabrakan | Cabrakan (Sweep), 2 Oni, 2 Bulgae | strikes hit neighbours too | 7 | Legendary: Cleaver |

#### 12. Salt Mirror (Lv 10-11, boss 12) - theme: "Which one is real?"
Blinding salt lake, mirage island, glass shards. Glare, reflections and decoys; Bulwark comes back as salt pillars.

| Creature | Slot | Mechanic | Art |
|---|---|---|---|
| Kui | basic | **Mirage** ☁ (shimmer) | have |
| Zipacna | tough | heavy | have |
| Hundun | armored | **Bulwark** (salt pillar) | have |
| Pixiu | barrel | explodes (coin bag) | have |
| Boss Vucub-Caquix | boss | Gaze (false sun) | have |

| # | Battle | Composition | Idea | D | Unique drop idea |
|---|---|---|---|---|---|
| B1 | Heat Shimmer | 3 Kui (Mirage) | wait a turn | 3 | range |
| B2 | Salt Pillars | 3 Hundun (Bulwark), Kui | overkill blocked | 4 | souls |
| B3 | Cold Glare | Zipacna, Kui, Pixiu | heavy + barrel under glare | 4 | amount |
| B4 | Mirror Image | 2 Kui (Mirage), Hundun, Pixiu | mirage + bulwark + barrel | 5 | block |
| B5 (elite) | Salt Wall | 2 Hundun, Zipacna heavy | bulwark + heavy | 5 | rare: pierce |
| B6 (elite) | Medusa's Reflection | Medusa (Gaze elite), 2 Hundun, Pixiu | column gaze lesson before the boss | 6 | rare: HP |
| Boss | Vucub-Caquix | Vucub (column attackers lose 1 ATK), 2 Hundun, 2 Kui | fire from the other columns | 7 | Legendary: Thick Hide |

#### 13. Red Wadi (Lv 11-12, boss 13) - theme: "Night things in the canyon"
Red sandstone, cave mouths, cliff dwellings. Predators of dark and blood: pounce, drain, and the lord of the dead calls servants.

| Creature | Slot | Mechanic | Art |
|---|---|---|---|
| Cadejo | basic | plain | have |
| Balam | tough | **Skewer** ➶ (pounce ignores Shield) | have |
| Camazotz | basic | **Leech** ❣ (bat drains) | have |
| Buluc Chabtan | armored | armor 2 | have |
| Bennu | barrel | explodes | have |
| Boss Ah Puch | boss | Summoner | have |

| # | Battle | Composition | Idea | D | Unique drop idea |
|---|---|---|---|---|---|
| B1 | Night Bats | 3 Camazotz (Leech) | kill leechers before they hit you | 4 | HP |
| B2 | Pounce | Balam x2, Cadejo | Shield is useless vs Skewer | 4 | spear ATK |
| B3 | Cave Mouth | Buluc front, Camazotz behind, Cadejo | armor shields a leech | 5 | pierce |
| B4 | Two Blood Moons | Balam, Camazotz x2, Bennu | skewer + leech + barrel | 5 | souls |
| B5 | Dwelling Ladder | Buluc x2, Balam heavy, Camazotz | stack of earlier kinds | 6 | block |
| B6 (elite) | Jaguar Priests | Balam heavy, 2 Camazotz, Buluc, Bennu | full test | 6 | rare: ATK |
| Boss | Ah Puch | Ah Puch (new servant each turn), 2 Balam | kill it fast or drown in servants | 7 | Legendary: Lifebloom |

#### 14. Dust Bazaar (Lv 11-12, boss 13) - theme: "Everything is for sale"
Mud-brick alleys, cloth awnings, lamp strings. Tricksters, guard-dogs, and merchants that repair.

| Creature | Slot | Mechanic | Art |
|---|---|---|---|
| Gumiho | basic | Mirage / decoy | have |
| Cerberus | tough | Grudge ♨ (three heads, angry) | have |
| Jowangshin | armored | **Healer** ✚ (hearth god) | have |
| Fenghuang | barrel | Fuse ⏲ (lantern) | have |
| Cyclops | armored | armor | have |
| Boss Loki | boss | Splitter | have |

| # | Battle | Composition | Idea | D | Unique drop idea |
|---|---|---|---|---|---|
| B1 | Haggling | 3 Gumiho (Mirage), Fenghuang | mirage + fuse | 4 | souls |
| B2 | Lamp Chain | 2 Fenghuang, Jowangshin | healer + fuses | 5 | blast |
| B3 | Guard Dog | Cerberus, Gumiho x2 | grudge | 5 | HP |
| B4 | Stallkeeper | Cyclops front, Jowangshin behind | armor shields healer | 5 | pierce |
| B5 | Rug Merchants | Gumiho x2, Jowangshin, Fenghuang, Cerberus | combo | 6 | amount |
| B6 (elite) | Black Market | Cerberus heavy, Jowangshin, Cyclops, Fenghuang x2 | full mix | 6 | rare: ATK |
| Boss | Loki | Loki (splits into two 1-HP on death), 2 Cerberus | kill order matters | 7 | Legendary: Powder Charm |

#### 15. Tomb Approach (Lv 12-13, boss 14) - theme: "The weighing of the heart"
Sphinx avenue, pylons, braziers. Funerary guardians that mend, and a judge who hides until you have faced his court.

| Creature | Slot | Mechanic | Art |
|---|---|---|---|
| Mummy | basic | plain | have |
| Isis | basic | **Healer** ✚ (stronger heals, Ashkara twist) | pick |
| Sphinx | armored | **Bulwark** (riddle wall) | have |
| Taweret | barrel | explodes (hippo) | have |
| Ammit | tough | heavy | have |
| Boss Anubis | boss | Veil 1 + Healers | have |

| # | Battle | Composition | Idea | D | Unique drop idea |
|---|---|---|---|---|---|
| B1 | Bandaged | 4 Mummy | spread damage | 4 | souls |
| B2 | Priestess | Isis + 2 Mummy | heal-first | 5 | HP |
| B3 | Riddle Wall | Sphinx front, Isis behind | bulwark shields healer | 5 | pierce |
| B4 | Hippo Guard | Taweret, 2 Mummy, Ammit | barrel + heavy | 5 | blast |
| B5 | Pylon Hall | Sphinx x2, Isis, Mummy x2 | wall + healer | 6 | block |
| B6 (elite) | Hall of Judges | Ammit heavy, Isis x2, Sphinx, Taweret | full test | 6 | rare: ATK |
| Boss | Anubis | Anubis (veiled turn 1), 2 Isis, 2 Ammit | break healers, strike on turn 2 | 7 | Legendary: Opening Fang |

#### 16. Sun Citadel (Lv 13-14, boss 15) - theme: "Kingdom of glass"
Fused glass desert, obsidian, obelisks, mirror panels. Final exam: every kind appears, in the heaviest layouts.

| Creature | Slot | Mechanic | Art |
|---|---|---|---|
| Huay Chivo | basic | Grudge | have |
| Minotaur | tough | heavy | have |
| Taotie | armored | Bulwark | have |
| Firebird | barrel | Fuse | have |
| Djinn | basic | Mirage + Summoner | **NEW** |
| Boss Ra | boss | Regrow (3 sun discs) | have |

| # | Battle | Composition | Idea | D | Unique drop idea |
|---|---|---|---|---|---|
| B1 | Obsidian Gate | Taotie x2, Huay Chivo x2 | bulwark + grudge | 5 | pierce |
| B2 | Mirror Panels | Djinn x2 (Mirage), Firebird | mirage + fuse | 5 | souls |
| B3 | Genie Lamps | Djinn (Summoner), Taotie, Firebird x2 | summoner behind wall | 6 | amount |
| B4 | Solar Court | Minotaur, Isis (Healer), Taotie, Huay Chivo | heavy + healer | 6 | HP |
| B5 | Glass Garden | Taotie x3, Djinn, Firebird | wall + summoner + fuse | 6 | block |
| B6 (elite) | Obelisk Guard | Minotaur heavy, Taotie x2, Djinn, Firebird x2 | combine all | 6 | rare: ATK |
| Boss | Ra | Ra with 3 sun discs (each regrows once), 2 Taotie | cut every disc in one turn | 7 | Legendary: Last Breath |

---

### B3. Progression across both regions

| Strand | Greenvale | Ashkara |
|---|---|---|
| Core verbs (attack, range, boost, overkill) | Meadows | assumed |
| Defense: Shield, armor, Mirage | Oak Wood | Shallows, Salt Mirror (armor 2, Mirage + Gaze) |
| Thorn | Bamboo | Shallows (recap) |
| Position: Swift, Tide, Stride | Lake (Swift, Tide) | Palms (Stride) |
| Healer | Rice | Bazaar, Tomb (strengthened) |
| Fuse + Bulwark | Ruins | Erg, Bazaar, Citadel |
| Summoner | Marsh | Wadi, Citadel |
| Splitter | Highlands | Palms, Bazaar |
| New, Ashkara only | | Chief, Skewer (Palms, Wadi), Grudge (Erg), Leech (Wadi) |

Difficulty: each area starts about one step below the previous area's D6 and ends at its own D6; the boss is D7 (D5-D6 in the first three Greenvale areas to keep early runs gentle). Greenvale never uses more than 2 kinds in a fight until Highlands; Ashkara uses 3 from Palms on, and Citadel uses 4-5.

---

### B4. Mapping onto the data

| Layer | Change |
|---|---|
| `data/regions/*.json` | Per sub-area: replace `theme` (5 slots: basic / tough / armored / barrel / boss) with the new roster; extend `theme` with optional `extra` slots (e.g. `healer`, `swift`, `thorn`) or add `kinds` per slot; add one spot to `ruins`, `palms` and `tomb`; `bossDef` points to a new key, not a retired one. |
| `gen.js` TEMPLATES | Replace the per-tier shared templates with per-sub-area **battle sequences**: `SEQUENCES[subId] = [ {name, back, front, hp, atk, idea} x6 ]` indexed by spot order, selected before `pickTemplate`. Fallback stays for new regions. Add letters `f v n z c p g l` to the char switch in `fromTemplate` and `fromDef`. |
| `boss-defs.js` | Remove `REUSE` for the 12 re-skinned bosses; add new BOSSES entries (layout and tuning copied from the old def, new `name` / `intro`). `ELITES` become per sub-area with B5/B6 layouts. |
| `engine.js` | Add kinds in `ENEMY_KINDS` (thorn, fuse, chief, skewer, grudge, leech); allow `stride`/`veil` on non-boss enemies; thorn in `dealDamage`, fuse timer in `resolveTurn`, skewer in `incomingByColumn`. |
| `world-data.js` / `art.js` | `ENEMY_TYPES[sub_role]` keys stay; kinds ride on the enemy object. Wire `pick` art; add `NEW` art slugs. |
| `items.js` | `uniqueEffect` takes the effect from a per-spot table (the "drop idea" column) instead of weighted random. |
| `tools/validate-gen.js` | Extend to validate each sequence's tier rule (A tier 1: trivial, 2-3: puzzle, 4+: survive) and boss costs. |
| Art | NEW: Jiangshi, Rokurokubi (or Kikimora), Papyrus Jar, Djinn; wire picks Isis (and Hades, Veles, Chernobog, Xtabay, Jeoseung Saja for future use). |
