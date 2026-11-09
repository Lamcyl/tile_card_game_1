# Bestiary

Master list of mythical beasts, monsters, spirits, deities and animals from many cultures, for the game's units and enemies. Art status comes from `art-samples/SUMMARY.md`, `art-samples/picks-data.mjs` and each set's README; game use from `prototype/js/world-data.js`, `docs/ENEMY_REVAMP.md` and `prototype/assets/units/`.

**Inclusion rule.** The 21 cultures list folkloric monsters, beasts, spirits, undead, constructs and real animals, and now also the deities and divine beings of each culture, each flagged for sensitivity (see the Legend). Every deity or sacred or worshipped figure carries a flag from the research in the "Sensitivity research" section; 🔴 entries should be avoided as game units. Excluded entirely: Islamic prophets and angels (depiction is forbidden for prophets), Christian saints and angels, and the Native North American and Australian Aboriginal cultures (sacred-knowledge restrictions; see the last paragraph of the research section). Beyond the culture sections, a "Named sets" part groups well-known sets (zodiacs, the Olympians, the Navagraha and others); set entries often repeat culture entries. Descriptions follow the traditional sources; where the origin is uncertain the entry is left out.

## Legend

- Art status: ★ chosen pick, ○ drawn but not picked, ✕ rejected or dropped, blank = not drawn. Fenrir, Kraken, Vodyanoy and Bastet are ✕ dropped and must not be redrawn; the Chinese guardians Long, Fenghuang, Baihu and Xuanwu are also ✕.
- ◆ = already in the prototype (used in a current enemy list or has a file in `prototype/assets/units/`).
- Fam. (familiarity to the general public, judged by presence in popular media and games): ① Common (dragon, mermaid, zombie), ② Well-known (kitsune, minotaur, Anubis), ③ Known to fans (kappa, wendigo, nue), ④ Obscure, ⑤ Unheard of (specialists only). Within every culture and set, rows are sorted by familiarity, most familiar first.
- Flag (sensitivity): 🟢 Low (ancient religion with no significant living worship, widely used in games), 🟡 Medium (some living worship or revival, or past controversy; usable with care), 🔴 High (actively worshipped, and game depictions have drawn protests, or depiction is forbidden), – = not a deity or sacred figure.
- Kind: beast, monster, spirit, undead, deity, deity-beast (a deity in animal or composite form, including mounts), animal, construct. Habitat terms: meadow, forest, bamboo, lake, marsh, highland, desert, oasis, saltflat, canyon, tomb, ice, volcano, coast, sea, sky, underworld, city, river, mountain, cave, jungle, steppe, ruins, village, island.

## Summary

Counts per culture (existing creatures plus the new deities). Fam. columns are the familiarity distribution ①–⑤; flag columns count 🔴 🟡 🟢.

| Culture | Entries | of which deities (new) | ★ | ○ | ✕ | Drawn | Not drawn | ① | ② | ③ | ④ | ⑤ | 🔴 | 🟡 | 🟢 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Japanese yokai | 45 | 12 | 11 | 9 | 0 | 20 | 25 | 0 | 3 | 18 | 22 | 2 | 1 | 12 | 0 |
| Egyptian | 45 | 15 | 6 | 13 | 1 | 20 | 25 | 4 | 8 | 14 | 14 | 5 | 0 | 0 | 33 |
| Chinese | 48 | 15 | 4 | 12 | 4 | 20 | 28 | 2 | 7 | 17 | 21 | 1 | 0 | 21 | 0 |
| Greek | 65 | 24 | 5 | 15 | 0 | 20 | 45 | 18 | 19 | 20 | 8 | 0 | 0 | 0 | 31 |
| Norse | 53 | 16 | 2 | 16 | 2 | 20 | 33 | 9 | 5 | 16 | 16 | 7 | 0 | 0 | 22 |
| Slavic | 43 | 7 | 4 | 15 | 1 | 20 | 23 | 2 | 2 | 14 | 19 | 6 | 0 | 11 | 0 |
| Maya | 35 | 6 | 3 | 17 | 0 | 20 | 15 | 1 | 3 | 7 | 15 | 9 | 0 | 16 | 0 |
| Korean | 34 | 6 | 6 | 14 | 0 | 20 | 14 | 0 | 3 | 12 | 12 | 7 | 0 | 11 | 0 |
| Celtic (Irish, Scottish, Welsh, Cornish) | 50 | 16 | 0 | 0 | 0 | 0 | 50 | 1 | 5 | 16 | 20 | 8 | 0 | 16 | 0 |
| Aztec and wider Mesoamerican | 39 | 18 | 0 | 0 | 0 | 0 | 39 | 2 | 3 | 11 | 21 | 2 | 0 | 20 | 0 |
| Hindu and Indian | 53 | 30 | 0 | 0 | 0 | 0 | 53 | 3 | 8 | 18 | 20 | 4 | 30 | 3 | 0 |
| Persian and Arabian | 28 | 5 | 0 | 0 | 0 | 0 | 28 | 3 | 3 | 6 | 10 | 6 | 0 | 8 | 0 |
| Mesopotamian | 37 | 14 | 0 | 0 | 0 | 0 | 37 | 1 | 0 | 12 | 17 | 7 | 0 | 0 | 14 |
| African (several traditions) | 40 | 14 | 0 | 0 | 0 | 0 | 40 | 7 | 4 | 10 | 13 | 6 | 0 | 14 | 0 |
| Polynesian, Māori and Hawaiian | 34 | 14 | 0 | 0 | 0 | 0 | 34 | 2 | 2 | 7 | 21 | 2 | 0 | 14 | 0 |
| Inca and Andean | 28 | 8 | 0 | 0 | 0 | 0 | 28 | 4 | 2 | 7 | 8 | 7 | 0 | 8 | 0 |
| Southeast Asian (Philippines, Thailand, Malay world, Indonesia, Vietnam) | 50 | 7 | 0 | 0 | 0 | 0 | 50 | 1 | 3 | 13 | 22 | 11 | 0 | 8 | 0 |
| Mongol, Turkic and Siberian | 27 | 4 | 0 | 0 | 0 | 0 | 27 | 1 | 5 | 4 | 11 | 6 | 0 | 6 | 0 |
| Medieval European bestiary and heraldry | 30 | 0 | 0 | 0 | 0 | 0 | 30 | 4 | 5 | 9 | 12 | 0 | 0 | 0 | 0 |
| Finnish, Sámi and Baltic | 35 | 7 | 0 | 0 | 0 | 0 | 35 | 2 | 1 | 6 | 17 | 9 | 0 | 3 | 4 |
| Modern cryptids | 28 | 0 | 0 | 0 | 0 | 0 | 28 | 3 | 2 | 7 | 15 | 1 | 0 | 0 | 0 |
| **Total (21 cultures)** | **847** | 238 | 41 | 111 | 8 | 160 | 687 | 70 | 93 | 244 | 334 | 106 | 31 | 171 | 104 |

**Named sets** (rows repeat culture entries where possible; "new" counts rows that exist only in the set):

| Set | Entries | new | ① | ② | ③ | ④ | ⑤ | 🔴 | 🟡 | 🟢 |
|---|---|---|---|---|---|---|---|---|---|---|
| Chinese zodiac (12 animals) | 12 | 12 | 12 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Western zodiac (12 signs) | 12 | 12 | 4 | 3 | 5 | 0 | 0 | 0 | 0 | 0 |
| Four Symbols (Sishen) | 4 | 2 | 0 | 0 | 4 | 0 | 0 | 0 | 4 | 0 |
| 28 Lunar Mansions (4 by 7) | 28 | 28 | 0 | 0 | 0 | 0 | 28 | 0 | 0 | 0 |
| Four Horsemen of the Apocalypse | 4 | 4 | 1 | 2 | 1 | 0 | 0 | 0 | 4 | 0 |
| Seven Deadly Sins as demons (Binsfeld) | 7 | 7 | 2 | 3 | 2 | 0 | 0 | 0 | 7 | 0 |
| Twelve Olympians | 12 | 0 | 8 | 4 | 0 | 0 | 0 | 0 | 0 | 12 |
| Beasts of the Twelve Labours of Heracles | 10 | 3 | 2 | 1 | 4 | 3 | 0 | 0 | 0 | 0 |
| Seven Lucky Gods (Shichifukujin) | 7 | 7 | 0 | 0 | 2 | 5 | 0 | 0 | 7 | 0 |
| Four Heavenly Kings (Shi Tianwang) | 4 | 4 | 0 | 0 | 1 | 3 | 0 | 0 | 4 | 0 |
| Five Elements creatures (Wuxing) | 5 | 3 | 0 | 0 | 4 | 1 | 0 | 0 | 5 | 0 |
| Four Benevolent Animals (Si Ling) | 4 | 1 | 1 | 2 | 1 | 0 | 0 | 0 | 0 | 0 |
| Dragon King's Nine Sons (Longzi) | 9 | 7 | 0 | 0 | 0 | 6 | 3 | 0 | 0 | 0 |
| Four Dragon Kings (Si Hai Longwang) | 4 | 4 | 0 | 0 | 1 | 0 | 3 | 0 | 4 | 0 |
| Four Perils of Chinese myth (Si Xiong) | 4 | 1 | 0 | 0 | 1 | 2 | 1 | 0 | 0 | 0 |
| Eight Immortals (Ba Xian) | 8 | 8 | 0 | 0 | 0 | 8 | 0 | 0 | 8 | 0 |
| Japanese Three Great Yokai (Sandai Yōkai) | 3 | 3 | 0 | 0 | 2 | 1 | 0 | 0 | 0 | 0 |
| Hindu Navagraha (nine planets) | 9 | 8 | 0 | 0 | 2 | 5 | 2 | 9 | 0 | 0 |
| Dashavatara (ten avatars of Vishnu) | 10 | 6 | 0 | 0 | 2 | 3 | 5 | 10 | 0 | 0 |
| Nine Muses | 9 | 9 | 0 | 0 | 1 | 8 | 0 | 0 | 0 | 9 |
| Greek triple sisters | 10 | 8 | 1 | 0 | 1 | 8 | 0 | 0 | 0 | 6 |
| Offspring of Echidna and Typhon | 8 | 2 | 3 | 2 | 1 | 2 | 0 | 0 | 0 | 0 |
| Monsters of the Odyssey | 10 | 7 | 1 | 3 | 1 | 4 | 1 | 0 | 0 | 3 |
| Planets and their mythic namesakes | 10 | 10 | 5 | 2 | 3 | 0 | 0 | 0 | 0 | 10 |
| Egyptian Ennead of Heliopolis | 9 | 0 | 0 | 2 | 1 | 4 | 2 | 0 | 0 | 9 |
| Four Sons of Horus | 4 | 4 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 4 |
| The Nine Worlds of Norse cosmology | 9 | 6 | 1 | 0 | 5 | 3 | 0 | 0 | 0 | 2 |
| Children of Loki | 4 | 0 | 0 | 3 | 1 | 0 | 0 | 0 | 0 | 1 |
| The Wild Hunt | 10 | 6 | 1 | 0 | 2 | 6 | 1 | 0 | 1 | 1 |
| Aztec day signs (Tonalpohualli) | 20 | 19 | 1 | 2 | 5 | 11 | 1 | 0 | 0 | 0 |
| Ars Goetia, best-known demons (of 72) | 15 | 15 | 0 | 1 | 5 | 8 | 1 | 0 | 15 | 0 |
| Arthurian beasts | 8 | 4 | 0 | 0 | 3 | 4 | 1 | 0 | 0 | 0 |
| Elementals (Paracelsus) | 4 | 4 | 0 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Primordial beasts of the Hebrew tradition | 3 | 3 | 0 | 2 | 0 | 1 | 0 | 0 | 3 | 0 |
| **Total (34 sets)** | **289** | 217 | 43 | 34 | 63 | 96 | 53 | 19 | 62 | 57 |

**Unique entries across cultures and sets: 1050** (familiarity ① 91, ② 105, ③ 284, ④ 414, ⑤ 156; flags 🔴 45, 🟡 225, 🟢 138, unflagged 642).

## Sensitivity research

Method: 18 web searches in November 2026, one per tradition or group of traditions, not per figure. Findings are only as strong as the sources found; where a search turned up nothing, the paragraph says so and the flag rests on general knowledge of the tradition (marked "not confirmed by search"). Flags: 🟢 Low (no significant living worship, widely used), 🟡 Medium (living worship or revival, or past controversy; use with care), 🔴 High (actively worshipped and protests have occurred, or depiction forbidden). Entry flags follow the tradition default unless noted.

**Hindu: 🔴 default.** The clearest case. In 2012 Rajan Zed's Universal Society of Hinduism and the Hindu American Foundation objected to SMITE's use of Hindu gods as combat characters, arguing that deities worshipped in temples and home shrines should not be trivialised; Kali and the avatar Vamana were the named examples. Hi-Rez declined to remove the gods but agreed to change the imagery and actions of Kali and Vamana and to correct descriptions. Zed objected again when Krishna appeared as an antagonist in Shin Megami Tensei IV Final (reportedly removed) and later asked Sega to stop depicting Ganesha, Hanuman, Kali, Lakshmi, Sarasvati, Shiva and Vishnu as demons in SMT V. Ganesha, Kali, Krishna, Shiva and all avatars and mounts are therefore 🔴; navagraha and avatar sets are 🔴. Sources: [Religious group calls for removal of Hindu deities from Hi-Rez's SMITE (Engadget, 2012)](https://www.engadget.com/2012-06-27-religious-group-calls-for-removal-of-hindu-deities-from-hi-rezs.html); [Hindu leader requests removal of deities from Smite, Hi-Rez declines (PC Gamer)](https://www.pcgamer.com/hindu-leader-requests-removal-of-dieties-from-smite-hi-rez-declines/); [Hindu group wants religious arena combat game pulled (Kotaku)](https://kotaku.com/hindu-group-wants-religious-arena-combat-game-pulled-fr-5930588); [Hindu politician urges Shin Megami Tensei to stop depicting gods as demons (GamerBraves)](https://www.gamerbraves.com/hindu-politician-urges-shin-megami-tensei-to-stop-depicting-gods-as-demons/); [Lord Krishna in Shin Megami Tensei IV Final gets negative reception (Anime News Network, 2016)](https://animenewsnetwork.com/interest/2016-02-04/lord-krishna-in-shin-megami-tensei-iv-final-gets-negative-reception-from-hindu-statesman/.98302).

**Shinto (Japan): 🟡 default, Amaterasu 🔴.** Kami appear freely in Japanese games (Ōkami, SMITE's Amaterasu, Raijin, Susanoo and Izanami, Persona and Shin Megami Tensei), and no formal Association of Shinto Shrines guideline on game depiction was found. The sensitivity is with real shrines and real worship: DMM Games cancelled a moe-style shrine game in 2017 after the Association of Shinto Shrines objected, and Assassin's Creed Shadows (2025) drew parliamentary criticism, and a statement from Prime Minister Ishiba, after footage showed the interior of a real shrine being wrecked. No kami-specific protest was found; Amaterasu is raised to 🔴 because she is the imperial ancestor enshrined at Ise (a judgment beyond the search). Sources: [DMM Games cancels controversial shrine moe-girl project (Anime News Network, 2017)](https://fast.animenewsnetwork.com/interest/2017-09-20/dmm-games-cancels-controversial-shrine-moe-girl-project-causes-speculation/.121570); [Japanese PM Ishiba condemns Assassin's Creed video game over cultural disrespect of shrine (SCMP)](https://www.scmp.com/week-asia/politics/article/3303172/japanese-pm-ishiba-condemns-assassins-creed-video-game-over-cultural-disrespect-shrine).

**Chinese folk religion, Daoism and Buddhist guardians: 🟡 default.** Sun Wukong, Nezha, Guan Yu, Mazu and the Dragon Kings are venerated in temples, yet Black Myth: Wukong (2024) became a hit with no documented religious objection; coverage instead noted that its religious elements were downplayed and that Shanxi temples gained visitors, and that Buddhists and others still offer incense at the temples that inspired its scenes. Four Heavenly Kings and Guanyin are Buddhist figures and kept at 🟡. Sources: [The Many Faces of Sun Wukong (Sixth Tone)](https://www.sixthtone.com/news/1015920); [The Erxian Temple That Inspired Black Myth: Wukong (Radii)](https://radii.co/?p=58983).

**Korean and Mongol/Turkic shamanism: 🟡 default.** Korean Muism (mudang, Sansin, Jowangshin) is a living folk religion and Tengrism is revived in the steppe region. No game controversy was found; the flag is based on living practice. Bozkurt and Asena are marked 🟡 because the grey wolf is also a nationalist emblem (not confirmed by search). Source: [Korean shamanism (New World Encyclopedia)](https://www.newworldencyclopedia.org/entry/Korean_shamanism).

**Yoruba Orisha, Vodou and other African deities: 🟡 default.** Orisha are worshipped today in Nigeria, Cuba (Santería/Lukumí) and Brazil (Candomblé). No practitioner statement on SMITE's Yoruba pantheon was found, but in 2024 voice actors and fans criticised Genshin Impact for a character named after a Yoruba deity without research, with SMITE's Olorun held up as the better example. Vodou is widely caricatured in popular culture, so Baron Samedi and Legba are also 🟡. Sources: [Genshin Impact voice actors criticize design of new character named after African deity (PC Gamer)](https://pcgamer.com/games/rpg/genshin-impact-voice-actors-criticize-design-of-new-character-named-after-african-deity-if-youre-going-to-use-real-world-deities-respect-them); [Voodoo in popular culture (Wikipedia)](https://en.Wikipedia.com/wiki/Voodoo_in_popular_culture).

**Aztec and Mesoamerican: 🟡 default.** Nahua descendants and the Mexicanidad movement keep the heritage alive. Criticism in games focuses on inaccuracy and on treating Nahua culture as dead: Fate/Grand Order is criticised for depicting Quetzalcoatl as a woman and Aztec gods as alien parasites, and a DiGRA paper contrasts games made with Indigenous communities (Mulaka, with the Rarámuri) against games made about them. Source: [Fate Grand Order's Misuse of Aztec Mythology (The Warthog Report)](https://warthogreport.substack.com/p/fate-grand-orders-misuse-of-aztec); [DiGRA paper on Indigenous representation in games](https://dl.digra.org/index.php/dl/article/download/2337/2334/2352).

**Maya: 🟡 default.** Contemporary Maya spirituality and daykeepers continue in Guatemala and Mexico; the search found a scholarly study of that continuity but no mention of Itzamna or Ix Chel as objects of worship today, and no game controversy. The Popol Vuh figures are kept at 🟡 because of living K'iche' tradition. Source: [Contemporary Maya Spirituality (University of Texas Press)](https://utpress.utexas.edu/9780292713154/contemporary-maya-spirituality/).

**Inca and Andean: 🟡 default.** Pachamama is honoured today with offerings (Martes de challa, August offerings) and Inti Raymi is still held; sources are mostly travel and encyclopedia pages. No game controversy found. Source: [Pachamama (EBSCO Research Starters)](https://ebsco.com/research-starters/social-sciences-and-humanities/pachamama).

**Mesopotamian: 🟢 default.** Marduk, Ishtar, Enki and the rest have no living worship that was found; they are widely used in games (Fate, Shin Megami Tensei) and the sources only confirmed the history. The "no living worship" point rests on general knowledge. Source: [The Mesopotamian Pantheon (World History Encyclopedia)](https://www.worldhistory.org/article/221/the-mesopotamian-pantheon).

**Celtic: 🟡 default.** Celtic Reconstructionism and Druidry are living revival religions, and the Morrígan, Brigid and Cernunnos are honoured by practitioners; Brigid is also a Christian saint. No game controversy was found. Source: [The Gaulish polytheist revival and what it is (The Wild Hunt)](https://wildhunt.org/2018/06/guest-post-the-gaulish-polytheist-revival-and-what-it-is.html).

**Polynesian, Māori and Hawaiian: 🟡 default.** Pele has survived Christianisation and is still revered at Kīlauea; criticism found concerns Disney's treatment of Pacific figures (Lilo & Stitch, Moana) and not games. No statement on SMITE's Pele or Māui was found. Pele stays 🟡 (top of the band). Sources: [The Perpetuation of the Goddess Pele and the Land She Creates (Hawaii.com)](https://hawaii.com/blog/the-perpetuation-of-the-goddess-pele-and-the-land-she-creates); [Stitch Has a Glitch (Kamehameha Schools, Ka Wai Ola)](https://kaiwakiloumoku.ksbe.edu/article/essays-lilo-stitch-2-stitch-has-a-glitch).

**Slavic: 🟡 default.** Rodnovery (Slavic Native Faith) is a living revival with ties to ethnic nationalism in some groups, and relies partly on forged texts such as the Book of Veles. Only a few deities are well attested (the six in Vladimir's 980 pantheon, Svetovid and Triglav), so reconstructed gods such as Rod and Lada are left out. No game controversy found. Source: [Slavic Native Faith (Wikipedia mirror)](https://ipfs.ssi.eecc.de/ipns/en.wikipedia-on-ipfs.org/wiki/Slavic_Native_Faith).

**Greek, Egyptian and Norse: 🟢 default.** These are the standard pantheons of Age of Mythology (2002; Retold 2024), SMITE and countless other games. The search found no community statement or incident for Hellenic, Kemetic or Ásatrú groups. Small living revivals exist (not confirmed by search), and Norse symbols are sometimes misused by extremist groups, so avoid runes or emblems that double as hate symbols. Source: [Age of Mythology (MobyGames)](https://www.mobygames.com/game/7662/age-of-mythology/).

**Zoroastrian (Persian): 🟡 default.** Zoroastrianism is a small living faith; Ahura Mazda, Mithra and Angra Mainyu are kept at 🟡 (not confirmed by search). Quranic jinn, ifrit and marid are kept as folklore creatures but flagged 🟡.

**Finnish and Baltic: 🟢 for Finnish, 🟡 for Baltic.** Kalevala figures are literary and widely used (not confirmed by search); Lithuanian Romuva is a living religion, so Perkūnas, Saulė and Laima are 🟡.

**Southeast Asian: 🟡 default.** Nyai Roro Kidul, Dewi Sri, Barong and Rangda are active in Javanese and Balinese ritual; the Tagalog deities are reported only by colonial chroniclers (not confirmed by search).

**Judeo-Christian-Islamic figures.** SMITE's studio said it would not use Jewish, Christian or Islamic figures. Islamic prophets and angels are excluded entirely: fatwa sources say portraying prophets in any form is forbidden. Jinn are kept as folklore creatures at 🟡. The Four Horsemen, the Binsfeld demons, the Ars Goetia and Leviathan/Behemoth/Ziz come from Christian or Jewish scripture and demonology and are flagged 🟡. Sources: [Deity-based MOBA SMITE will not use Jewish, Christian, Islamic figures (GameSpot)](https://www.gamespot.com/articles/deity-based-moba-smite-will-not-use-jewish-christian-islamic-figures/1100-6384974/); [Playing computer game about the Prophet (IslamWeb fatwa)](https://islamweb.org/en/printfatwa.php?id=335173).

**Why Native North American and Australian Aboriginal sections stay out.** Many of these nations restrict which stories may be told, to whom, by whom, and in which season, and some knowledge is secret or sacred and limited to particular people, so a general-purpose bestiary cannot treat it as open folklore. Australian sources: the National Archives of Australia notes that some stories are widely known but others are secret and sacred, and Aboriginal cultural bodies stress permission, authority and gendered access. For Native North America the search found study-guide pages and an Ojibwe report that certain sacred stories are told only in winter and by designated keepers, practices that vary by nation. Sources: [Indigenous cultural sensitivities in records (National Archives of Australia)](https://www.naa.gov.au/sites/default/files/2022-09/Indigenous-cultural-sensitivities.docx); [What is the Dreaming (Aboriginal Cultural Immersions)](https://www.aboriginalculturalimmersions.com.au/smoking-ceremony-aboriginal-dreaming/what-is-the-dreaming); [In Ojibwe tradition, snow on the ground means it's sacred storytelling season (MPR News)](https://www.mprnews.org/story/2024/01/25/in-ojibwe-tradition-snow-on-the-ground-means-its-sacred-storytelling-season).


## Index by habitat / terrain

Names only, mixed across cultures and sets (picked and drawn first, then round-robin by source); each list is capped at 36 names with the unique total in brackets. 🔴 marks entries to avoid; a separate line lists every 🔴 entry for the terrain, including any beyond the cap. Every entry carries its terrains in its table.

- **meadow** (78): Kitsune, Tanuki, Qilin, Centaur, Freyja, Poludnitsa, Satyr, Tsuru, Shennong, Dionysus, Freyr, Wisent, Gongjak, Leprechaun, Hummingbird, Indian peafowl, Lion, African elephant, Papatūānuku, Alpaca, Dewi Sri, Unicorn, Žaltys, Jackalope, Horse (Wu), Leo (Lion), Mares of Diomedes, Erato, Cattle of Helios, Vanir (Vanaheim), Tochtli (Rabbit), Inari Ōkami, Demeter, Sif, Sivka-Burka, Magpie, ...
  - 🔴 avoid (2): Krishna, Kamadhenu
- **forest** (177): Kitsune, Xtabay, Karasu-tengu, Tanuki, Hitotsume-kozō, Jorōgumo, Qilin, Centaur, Ratatoskr, Baba Yaga, Vucub Caquix, Dokkaebi, Kodama, Bai Ze, Satyr, Lindworm, Firebird, Balam, Gumiho, Baku, Leshy, Alux, Cheonyeo Gwisin, Likho, Sisimito, Jangsan-beom, Strzyga, Huay Chivo, Cadejo, Nue, Bifang, Artemis, Wolf, Grey Wolf, Jaguar, Gaeksin, ...
  - 🔴 avoid (2): Parashurama, Rama
- **bamboo** (4): Qiongqi, Shanxiao, Giant panda, Fenghuang
- **lake** (41): Kappa, Hydra of Lerna, Rusalka, Mul Gwisin, Jorōgumo, Vila, Ōnamazu, Red-crowned crane, Stymphalian birds, Näcken, Vodyanoy, Kelpie, Axolotl, Naga, Hippopotamus, Taniwha, Viracocha, Hongsa, Lus, Melusine, Whooper swan, Loch Ness Monster, Benzaiten (弁才天), Divine tortoise (Gui), Lady of the Lake, Undine, Koi / carp, Each-uisge, Ahuizotl, Nagini, Thần Kim Quy, Pelican in her piety, Näkki, Champ, Afanc, Chalchiuhtlicue, ...
  - 🔴 avoid (1): Hamsa
- **marsh** (40): Wadjet, Kappa, Sobek, Hydra of Lerna, Rusalka, Imugi, Kikimora, Tsuru, Nile crocodile, Red-crowned crane, Stymphalian birds, Ahuizotl, Indian rhinoceros, Aurochs, Mokele-mbembe, Kōtuku, Berberoka, Tarasque, Eurasian elk, Skunk Ape, Acatl (Reed), Behemoth, Sacred ibis, Xiangliu, Cipactli, Sarus crane, Bašmu, Ninki Nanka, Pūkeko, Hantu Air, Whooper swan, Kongamato, Bashe, Euphrates softshell turtle, Thuồng luồng, Velnias, ...
- **river** (65): Yamata no Orochi, Kappa, Sobek, Rusalka, Zipacna, Imugi, Taweret, Yong, Mul Gwisin, Nile crocodile, Long, Näcken, Vodyanoy, Gucumatz, Geobuk, Kelpie, La Llorona, Naga, Anahita, Euphrates softshell turtle, Tokoloshe, Taniwha, Yacumama, Rồng, Lus, Melusine, Tuonen joutsen, Kongamato, Dragon (Chen), Azure Dragon (Qinglong), Divine tortoise (Gui), Atl (Water), Hippopotamus, Koi / carp, Bean-nighe, Chalchiuhtlicue, ...
  - 🔴 avoid (1): Saraswati
- **highland** (57): Kamaitachi, Griffin, Chimera, Nemean Lion, Yamabiko, Baihu, Pan, Reindeer, Zduhać, Red deer, Golden eagle, Barbary lion, Impundulu, Moa, Puma, Yak, Hippogriff, Gufihtar, Beast of Gévaudan, Goat (Wei), Aries (Ram), Cath Palug, Erymanthian Boar, Tyr, Púca, Rakhsh, Hōkioi, Llama, Heraldic lion rampant, Thylacine survivals, Python, Tanngrisnir and Tanngnjóstr, Cú Sídhe, Verethragna, Alpaca, Bonnacon, ...
- **mountain** (125): Karasu-tengu, Sun Wukong, Jötunn, Perun, Sansin, Yuki-onna, Kui, Yamata no Orochi, Kamaitachi, Oni, Nian, Troll, Zmey Gorynych, Zipacna, Gumiho, Jorōgumo, Taotie, Dvergr, Vila, Cabrakan, Bulgasari, Pixiu, Lindworm, Jangsan-beom, Qiongqi, Ungnyeo, Bai Ze, Shanxiao, Nekomata, Giant panda, Prometheus, Fáfnir, Indrik, Siberian tiger, Ddraig Goch, Tlaloc, ...
  - 🔴 avoid (7): Shiva, Durga, Hanuman, Parvati, Kartikeya, Kubera, Nandi
- **cave** (28): Cyclops, Troll, Camazotz, Ungnyeo, Minotaur, Dvergr, Nemean Lion, Tsuchigumo, Echidna, Fáfnir, Knocker, Chaneque, Shahmaran, Grootslang, Tepegöz, Dragon, Menninkäinen, Stheno, Polyphemus, Gnome, Lamia, Div-e Sepid, Basilisk, Gufihtar, Euryale, Graeae, Cockatrice, Python
- **jungle** (42): Xtabay, Chaac, Balam, Sisimito, Hun Batz and Hun Chuen, Bashe, Jaguar, Quetzal, Bengal tiger, Karkadann, African elephant, Andean cock-of-the-rock, Orangutan, Manticore, Orang Pendek, Monkey (Shen), Ocelotl (Jaguar), Resplendent quetzal, Olmec were-jaguar, Asian elephant, Leopard, Yacumama, Javan rhinoceros, Blemmyae, Ahool, Coatl (Serpent), Spider monkey, King cobra, Gorilla, Sachamama, Ropen, Ozomahtli (Monkey), Tapir, Mokele-mbembe, Chullachaqui, Mapinguari, ...
- **desert** (58): Wadjet, Sphinx, Griffin, Sekhmet, Set, Khepri, Serket, Scarab beetle, Mexican wolf, Jinn, Lion, Ostrich, Nazca hummingbird, Bactrian camel, Phoenix, Chupacabra, Snake (Si), Scorpio (Scorpion), Famine, Sphinx of Thebes, Coatl (Serpent), Paimon, Hathor, Charro Negro, Ghoul, Pazuzu, Spotted hyena, Nazca spider, Almas, Manticore, Mongolian Death Worm, Cuetzpalin (Lizard), Gremory, Serpopard, Dromedary camel, Edimmu, ...
- **oasis** (4): Bennu, Ladon, Dromedary camel, Arabian horse
- **saltflat** (0): 
- **canyon** (3): Buluc Chabtan, Mexican wolf, Andean fox
- **steppe** (12): Huehuecoyotl, Mammoth, Horse (Wu), Bactrian camel, Golden eagle, Bozkurt, Przewalski's horse, Saiga antelope, Asena, Tulpar, Albasty, Yer-su
- **ice** (26): Yuki-onna, Jötunn, Morana, Xuanwu, Polar bear, Siberian tiger, Cailleach, Snow leopard, Mammoth, Wolverine, Yeti, Reindeer, Yak, Hiiden hirvi, Wolf, Chuchunaa, Louhi, Fenrir, Abaasy, Stállu, Sköll and Hati, Mangus, Auðumbla, Skaði, Hræsvelgr, Ullr
- **volcano** (18): Typhon, Chimera, Surtr, Cabrakan, Kagutsuchi, Bifang, Hephaestus, Xiuhcoatl, 🔴 Agni, Ifrit, Pele, Salamander, Vermilion Bird (Zhuque), Muspell's fire giants (Muspelheim), Salamander (elemental), Zhurong, Xiuhtecuhtli, Rūaumoko
  - 🔴 avoid (1): Agni
- **coast** (43): Nurikabe, Siren, Talos, Jingwei, Medusa, Harpy, Scylla, Umibōzu, Mazu, Aphrodite, Draugen, Selkie, Cipactli, Marid, Mami Wata, Green sea turtle, Komodo dragon, Pelican in her piety, Black Shuck, Cancer (Crab), Ebisu (恵比寿), Laestrygonians, Hippocampus, Njörðr, Balor, Popobawa, Hammerhead shark, Santelmo, Cadborosaurus, Nereid, Merrow, Mngwa, Taniwha, Graeae, Nuckelavee, Tuatara, ...
- **sea** (73): Kui, Siren, Alkonost, Jingwei, Poseidon, Jörmungandr, Scylla, Susanoo, Long, Dolphin, Kraken, Geobuk, Selkie, Makara, Marid, Tiamat, Yemoja, Humpback whale, Mama Cocha, Rồng, Iku-Turso, Cadborosaurus, Pisces (Two Fishes), Leviathan, Pulao, Ao Guang, 🔴 Matsya, Wandering Rocks (Planctae), Neptune, Umibōzu, Kunpeng, Charybdis, Draugen, Yongwang, Merrow, 🔴 Vishnu, ...
  - 🔴 avoid (7): Matsya, Vishnu, Kurma, Varuna, Shesha, Vasuki, Varaha
- **island** (22): Talos, Cyclops, Cretan Bull, Balor, Roc, Tuatara, Komodo dragon, Väinämöinen, Geryon's cattle, Benzaiten (弁才天), Polyphemus, Orthrus, Fomorians, Coconut crab, Circe, Māui, Lotus-Eaters, Kāne, Calypso, Kū, Cattle of Helios, Lono
- **sky** (233): Karasu-tengu, Ra, Sun Wukong, Typhon, Huginn and Muninn, Perun, Ix Chel, Samjok-o, Raijin, Isis, Nezha, Alkonost, Bennu, Lei Gong, Yutu, Pegasus, Valkyrie, Kukulkan, Yong, Zeus, Thor, Chaac, Bulgae, Harpy, Odin, Vucub Caquix, Inmyeonjo, Sleipnir, Itzamna, Kinich Ahau, Bacab, Nue, Horus, Long, Apollo, Baldr, ...
  - 🔴 avoid (17): Brahma, Chandra, Kalki, Amaterasu, Indra, Shani, Vamana, Surya, Rahu, Garuda, Ketu, Vayu, Mangala, Airavata, Budha, Brihaspati, Shukra
- **city** (65): Komainu, Isis, Nezha, Bakeneko, Thoth, Pixiu, Athena, Loki, Haetae, Rokurokubi, Zhong Kui, Kasa-obake, Noppera-bō, Bastet, Guan Yu, Owl of Athena, Alebrije, 🔴 Kali, Lamassu, Eshu, Singha, Zilant, Gargoyle, Fresno Nightcrawler, Libra (Scales), Mammon, Suanni, Cao Guojiu, Clio, Atropos, Shachihoko, Amun, Caishen, Nemesis, Huitzilopochtli, Yali, ...
  - 🔴 avoid (2): Kali, Narasimha
- **village** (132): Kitsune, Bes, Dalgyal Gwisin, Tanuki, Jangseung, Nurikabe, Jowangshin, Komainu, Chōchin-obake, Hitotsume-kozō, Bakeneko, Taweret, Jiangshi, Nisse, Domovoi, Alux, Dokkaebi, Rokurokubi, Nian, Upyr, Huay Chivo, Cheonyeo Gwisin, Baku, Zhong Kui, Kikimora, Cadejo, Bulgasari, Kasa-obake, Bannik, Samsin Halmeoni, Likho, Strzyga, Inari Ōkami, Bastet, Guanyin, Hestia, ...
  - 🔴 avoid (4): Balarama, Ganesha, Lakshmi, Mushika
- **ruins** (44): Chōchin-obake, Gashadokuro, Taotie, Medusa, Koschei, Kukulkan, Hundun, Minotaur, Bixi, Ares, Svetovid, Banshee, Feathered serpent, Rakshasa, Jinn, Lamassu, Nazca hummingbird, Gargoyle, Death, Tamamo-no-Mae (玉藻前), Sphinx of Thebes, Tecpatl (Flint), Vine, Triglav, Redcap, Cihuateteo, Bhoot, Div, Mušḫuššu, Nazca spider, Basilisk, War, Spriggan, Chac Mool, Pishacha, Shedu, ...
- **tomb** (31): Anubis, Gashadokuro, Sphinx, Jiangshi, Draugr, Upyr, Inmyeonjo, Mummy, Thoth, Ammit, Ushabti, Maat, Haugbui, Cheonma, Vetala, Ghoul, Edimmu, Baron Samedi, Pocong, Kalma, Imsety, Miquiztli (Death), Bune, Ba, Pishacha, Santelmo, Hapy, Nephthys, Duamutef, Akhekh, Qebehsenuef
- **underworld** (82): Anubis, Cerberus, Veles, Ah Puch, Jeoseung Saja, Hades, Chernobog, Oni, Osiris, Hundun, Hel, Camazotz, Yeomra, Apep, Sleipnir, Hunahpu and Xbalanque, Ammit, Níðhöggr, Ōnamazu, Medjed, Yanluo Wang, Charon, Fenrir, Hun-Came and Vucub-Came, Arawn, Xoloitzcuintli, Naga, Shahmaran, Lamashtu, Hine-nui-te-pō, Supay, Erlik, Tuonen joutsen, Death, Satan, Alecto, ...
  - 🔴 avoid (1): Yama

## Japanese yokai

Art set `yokai` (20 drawn). Japanese folklore; kami are listed with sensitivity flags.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Oni (鬼) | monster | ② | Horned, iron-club-wielding ogre of Japanese folklore, often a demon of hell or the northeast "demon gate". | mountain, underworld | ○ ◆ | – |
| Kitsune (狐) | spirit | ② | Fox spirit that gains tails and magic with age and can take human form; messenger of Inari. | forest, meadow, village | ★ ◆ | – |
| Tsuru (鶴) | animal | ② | Red-crowned crane, a symbol of longevity and fidelity. | marsh, meadow |  | – |
| Kappa (河童) | spirit | ③ | River imp with a water-filled dish on its head; drowns careless swimmers, loves cucumbers, must be polite. | river, lake, marsh | ○ ◆ | – |
| Karasu-tengu (烏天狗) | spirit | ③ | Crow-beaked mountain goblin, martial-arts master and trickster of the peaks. | mountain, forest, sky | ★ ◆ | – |
| Tanuki (狸) | beast | ③ | Shape-shifting raccoon dog famed for leaf-magic and a belly drum. | forest, meadow, village | ★ ◆ | – |
| Bakeneko (化け猫) | spirit | ③ | Cat that grows into a shape-shifting, speaking, sometimes corpse-animating ghost cat. | village, city | ○ | – |
| Nurikabe (塗り壁) | spirit | ③ | Invisible wall that blocks travellers on dark roads at night. | village, coast | ★ ◆ | – |
| Yuki-onna (雪女) | spirit | ③ | Pale snow woman who appears in blizzards and freezes travellers. | ice, mountain | ★ ◆ | – |
| Rokurokubi (ろくろ首) | spirit | ③ | Woman whose neck stretches at night, often unaware of it herself. | village, city | ○ | – |
| Jorōgumo (女郎蜘蛛) | monster | ③ | Spider that becomes a seductive woman to trap men in its web. | forest, lake, mountain | ○ ◆ | – |
| Kodama (木霊) | spirit | ③ | Spirit that dwells in old trees; felling its tree brings misfortune. | forest | ○ ◆ | – |
| Raijin (雷神) | deity-beast | ③ | Thunder kami drawn as a drum-ringed demon-like figure beating drums. | sky | ★ ◆ | 🟡 |
| Komainu (狛犬) | construct | ③ | Paired lion-dog statues guarding shrine gates. | village, city | ★ ◆ | – |
| Baku (獏) | beast | ③ | Tapir-like chimera that eats nightmares. | village, forest | ○ ◆ | – |
| Yamata no Orochi (八岐大蛇) | monster | ③ | Eight-headed, eight-tailed serpent slain by Susanoo in the Kojiki. | river, mountain | ★ ◆ | – |
| Nue (鵺) | monster | ③ | Chimera with a monkey's face, tanuki body, tiger limbs and snake tail; its cry brings illness. | forest, sky |  | – |
| Nekomata (猫又) | spirit | ③ | Cat with a forked tail, an elder form of the bakeneko of mountain lore. | mountain, forest |  | – |
| Amaterasu (天照大神) | deity | ③ | Sun kami of the Kojiki and Nihon Shoki, enshrined at Ise as ancestor of the imperial line. | sky |  | 🔴 |
| Susanoo (須佐之男) | deity | ③ | Storm kami and brother of Amaterasu who slew the Yamata no Orochi. | sea, mountain |  | 🟡 |
| Inari Ōkami (稲荷大神) | deity | ③ | Kami of rice and prosperity whose shrines are guarded by fox statues. | village, meadow |  | 🟡 |
| Kasa-obake (傘お化け) | spirit | ④ | Aged umbrella that comes alive with one eye and one leg (a tsukumogami). | village, city | ○ ◆ | – |
| Chōchin-obake (提灯お化け) | spirit | ④ | Old paper lantern come alive, with a gaping mouth and lolling tongue. | village, ruins | ★ ◆ | – |
| Hitotsume-kozō (一つ目小僧) | spirit | ④ | One-eyed child-monk prankster that startles passers-by. | village, forest | ★ ◆ | – |
| Gashadokuro (がしゃどくろ) | undead | ④ | Giant skeleton formed from the unburied war dead, said to bite off heads. | ruins, tomb | ○ ◆ | – |
| Kamaitachi (鎌鼬) | beast | ④ | Whirlwind weasel with sickle claws that cuts skin without pain. | mountain, highland | ★ ◆ | – |
| Tsuchigumo (土蜘蛛) | monster | ④ | Giant earth spider of legend, slain by Minamoto no Raikō. | cave, mountain |  | – |
| Ittan-momen (一反木綿) | spirit | ④ | Strip of flying cloth that wraps around and smothers people at night. | sky, village |  | – |
| Noppera-bō (のっぺら坊) | spirit | ④ | Faceless ghost that frightens travellers by wiping its face blank. | village, city |  | – |
| Umibōzu (海坊主) | monster | ④ | Black giant rising from the sea to capsize ships. | sea, coast |  | – |
| Ōnamazu (大鯰) | monster | ④ | Giant catfish beneath Japan whose thrashing causes earthquakes. | lake, underworld |  | – |
| Inugami (犬神) | spirit | ④ | Dog spirit used in curses, from Shikoku and Kyushu folklore. | village, forest |  | – |
| Zashiki-warashi (座敷童) | spirit | ④ | Child spirit of old houses in Tohoku that brings fortune to the family. | village |  | – |
| Yamabiko (山彦) | spirit | ④ | Mountain echo given a dog-like body, answering calls from the peaks. | mountain, highland |  | – |
| Shachihoko (鯱) | beast | ④ | Tiger-headed carp ornament on castle roofs, said to protect against fire. | city, sea |  | – |
| Raijū (雷獣) | beast | ④ | Lightning beast that rides storms and sleeps in belly buttons of folklore. | sky, mountain |  | – |
| Tsukuyomi (月読) | deity | ④ | Moon kami, brother of Amaterasu, who killed the food goddess Ukemochi. | sky |  | 🟡 |
| Izanami (伊邪那美) | deity | ④ | Creator kami who died giving birth to fire and rules Yomi, the land of the dead. | underworld |  | 🟡 |
| Izanagi (伊邪那岐) | deity | ④ | Creator kami who fathered the islands and followed Izanami to Yomi. | sky |  | 🟡 |
| Hachiman (八幡神) | deity | ④ | Kami of war and archery, patron of samurai and the Minamoto clan. | city |  | 🟡 |
| Fūjin (風神) | deity | ④ | Wind kami, drawn carrying a wind bag, paired with Raijin. | sky |  | 🟡 |
| Ryūjin (龍神) | deity | ④ | Dragon kami of the sea who holds the tide jewels. | sea |  | 🟡 |
| Ame-no-Uzume (天宇受売命) | deity | ④ | Dawn kami whose dance lured Amaterasu from the cave. | village |  | 🟡 |
| Kagutsuchi (火之迦具土) | deity | ⑤ | Fire kami whose birth killed Izanami. | volcano |  | 🟡 |
| Ōkuninushi (大国主) | deity | ⑤ | Kami of Izumo associated with land-building and marriage. | mountain |  | 🟡 |

## Egyptian

Art set `egypt` (20 drawn). Ancient religion with no significant living faith (small Kemetic revival); gods appear in their animal forms.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Sphinx | monster | ① | Lion-bodied guardian with a royal human head. | desert, tomb | ○ ◆ | – |
| Mummy | undead | ① | Preserved, bandaged corpse that rises to guard its tomb. | tomb | ○ ◆ | – |
| Nile crocodile | animal | ① | Feared and venerated river predator. | river, marsh |  | – |
| Hippopotamus | animal | ① | Dangerous river beast, associated with Set and Taweret. | river |  | – |
| Anubis (Inpu) | deity-beast | ② | Jackal-headed god of embalming who guides the dead and weighs hearts. | tomb, underworld | ★ ◆ | 🟢 |
| Ra | deity-beast | ② | Falcon-headed sun god who sails the sky and underworld in his barque. | sky | ★ ◆ | 🟢 |
| Bastet | deity-beast | ② | Cat-headed protector goddess of the home. | village, city | ✕ | 🟢 |
| Thoth (Djehuty) | deity-beast | ② | Ibis- or baboon-headed god of writing and wisdom. | city, tomb | ○ | 🟢 |
| Osiris | deity-beast | ② | Mummiform king of the underworld, god of resurrection. | underworld | ○ | 🟢 |
| Isis (Aset) | deity-beast | ② | Winged goddess of magic and motherhood. | city, sky | ★ | 🟢 |
| Scarab beetle | animal | ② | Dung beetle symbolising rebirth. | desert |  | – |
| Horus (Heru) | deity-beast | ② | Falcon-headed sky god and avenger of Osiris, whose eye is a protective symbol. | sky |  | 🟢 |
| Sekhmet | deity-beast | ③ | Lioness-headed war goddess, Eye of Ra, bringer of plague. | desert | ○ ◆ | 🟢 |
| Sobek | deity-beast | ③ | Crocodile-headed god of the Nile and fertility. | river, marsh | ○ ◆ | 🟢 |
| Set | deity-beast | ③ | God of storm and chaos with an unidentified "Set animal" head. | desert | ○ ◆ | 🟢 |
| Apep (Apophis) | monster | ③ | Giant chaos serpent that attacks Ra's barque each night. | underworld | ○ ◆ | 🟢 |
| Ammit | monster | ③ | Crocodile, lion and hippo composite that devours unworthy hearts. | tomb, underworld | ○ ◆ | 🟢 |
| Bes | deity-beast | ③ | Dwarf lion-featured household protector who wards off evil. | village | ★ ◆ | 🟢 |
| Bennu | deity-beast | ③ | Heron-like bird of Heliopolis, the model for the phoenix. | sky, oasis | ★ ◆ | 🟢 |
| Wadjet | deity-beast | ③ | Cobra goddess of Lower Egypt, the royal uraeus. | marsh, desert | ★ ◆ | 🟢 |
| Ushabti | construct | ③ | Funerary figurine meant to work for the dead in the afterlife. | tomb | ○ ◆ | – |
| Medjed | spirit | ③ | Shrouded figure with only eyes visible, from the Book of the Dead. | underworld |  | – |
| Sacred ibis | animal | ③ | Wading bird of Thoth, mummified in the millions. | marsh, river |  | – |
| Hathor | deity-beast | ③ | Cow-eared goddess of love, music and joy, mother of the king. | desert, village |  | 🟢 |
| Amun (Amun-Ra) | deity | ③ | Hidden king of the gods at Thebes, ram-linked, later merged with Ra. | city |  | 🟢 |
| Maat | deity | ③ | Winged goddess of truth, justice and cosmic order whose feather weighs hearts. | tomb, underworld |  | 🟢 |
| Khepri | deity-beast | ④ | Scarab-headed form of the rising sun. | desert | ○ ◆ | 🟢 |
| Serket (Selket) | deity-beast | ④ | Scorpion goddess who protects against venom. | desert | ○ ◆ | 🟢 |
| Taweret | deity-beast | ④ | Hippo-bodied protector of mothers and childbirth. | river, village | ○ ◆ | 🟢 |
| Serpopard | monster | ④ | Serpent-necked leopard from the Narmer Palette and early art. | desert |  | – |
| Ba | spirit | ④ | Human-headed bird form of the soul. | tomb, sky |  | – |
| Ptah | deity | ④ | Mummiform craftsman god of Memphis who created the world by speech. | city |  | 🟢 |
| Nephthys | deity | ④ | Goddess of mourning, sister of Isis, with a house-and-basket crown. | tomb |  | 🟢 |
| Nut | deity | ④ | Sky goddess arched over the earth, who swallows the sun each evening. | sky |  | 🟢 |
| Geb | deity | ④ | Earth god, father of Osiris, whose laughter was said to cause earthquakes. | desert |  | 🟢 |
| Khnum | deity-beast | ④ | Ram-headed potter god who shapes people on his wheel at Elephantine. | river |  | 🟢 |
| Neith | deity | ④ | Warrior and weaver goddess of Sais with crossed arrows. | city |  | 🟢 |
| Atum | deity | ④ | Self-created primordial god of Heliopolis, the "complete one". | sky |  | 🟢 |
| Aten | deity | ④ | Sun disc with rays ending in hands, worshipped under Akhenaten. | sky |  | 🟢 |
| Khonsu | deity | ④ | Moon god, a youthful figure with a side-lock, travelling across the night sky. | sky |  | 🟢 |
| Mehen | monster | ⑤ | Coiled serpent that shelters Ra in his barque on the night journey. | underworld |  | 🟢 |
| Nehebkau | monster | ⑤ | Two-headed snake deity who guards the dead. | underworld |  | – |
| Akhekh | monster | ⑤ | Griffin-like creature with a serpent's neck in funerary texts. | desert, tomb |  | – |
| Shu | deity | ⑤ | God of air who holds up the sky goddess Nut. | sky |  | 🟢 |
| Tefnut | deity-beast | ⑤ | Lioness-headed goddess of moisture, twin of Shu. | desert |  | 🟢 |

## Chinese

Art set `chinese` (20 drawn). Four Guardian Beasts (Long, Fenghuang, Baihu, Xuanwu) were dropped by the owner.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Long (龍) | beast | ① | Chinese dragon: wingless, rain- and river-bringing, with a pearl. | sky, river, sea | ✕ | – |
| Giant panda (大熊貓) | animal | ① | Bamboo-eating bear, national emblem of China. | bamboo, mountain |  | – |
| Fenghuang (鳳凰) | beast | ② | "Phoenix": composite bird of virtue that appears in peaceful reigns. | sky, bamboo | ✕ ◆ | – |
| Qilin (麒麟) | beast | ② | Hooved chimera with scaled body, whose appearance is a good omen. | meadow, forest | ○ | – |
| Jiangshi (殭屍) | undead | ② | Stiff, hopping corpse that drains qi from the living. | tomb, village | ○ | – |
| Sun Wukong (孫悟空) | deity-beast | ② | The Monkey King of Journey to the West, a stone-born trickster. | mountain, sky | ★ ◆ | 🟡 |
| Nezha (哪吒) | deity-beast | ② | Child hero with wind-fire wheels and a spear. | sky, city | ★ ◆ | 🟡 |
| Red-crowned crane (丹頂鶴) | animal | ② | Symbol of longevity, carries immortals in art. | marsh, lake |  | – |
| Koi / carp (鯉) | animal | ② | Carp that leaps the Dragon Gate to become a dragon. | river, lake |  | – |
| Baihu (白虎) | deity-beast | ③ | White Tiger, guardian of the West. | mountain, highland | ✕ ◆ | 🟡 |
| Xuanwu (玄武) | deity-beast | ③ | Black Tortoise entwined with a snake, guardian of the North. | river, ice | ✕ ◆ | 🟡 |
| Nian (年) | monster | ③ | Beast that preys on villages at New Year and fears red and noise. | village, mountain | ○ ◆ | – |
| Taotie (饕餮) | monster | ③ | Gluttonous maw-faced beast of Zhou bronzes. | ruins, mountain | ○ ◆ | – |
| Pixiu (貔貅) | beast | ③ | Winged lion-like beast that eats wealth and never lets it leave. | city, mountain | ○ ◆ | – |
| Lei Gong (雷公) | deity-beast | ③ | Thunder god with beak and wings who punishes evildoers. | sky | ★ ◆ | 🟡 |
| Yutu (玉兔) | spirit | ③ | Jade Rabbit that pounds the elixir of life on the moon. | sky | ○ ◆ | – |
| Jiuweihu (九尾狐) | beast | ③ | Nine-tailed fox, omen of peace or a seductive fiend depending on source. | mountain |  | – |
| Kunpeng (鯤鵬) | beast | ③ | Vast fish that becomes a bird thousands of li across (Zhuangzi). | sea, sky |  | – |
| Jade Emperor (Yudi) | deity | ③ | Ruler of Heaven in Daoist folk religion, head of the celestial bureaucracy. | sky |  | 🟡 |
| Guan Yu (Guandi) | deity | ③ | Three Kingdoms general deified as god of war, loyalty and wealth. | city |  | 🟡 |
| Guanyin | deity | ③ | Bodhisattva of compassion, widely venerated as a goddess of mercy. | village, sea |  | 🟡 |
| Nüwa | deity | ③ | Serpent-bodied creator goddess who mended the sky and moulded humans from clay. | sky |  | 🟡 |
| Pangu | deity | ③ | Primordial giant who split chaos into heaven and earth. | mountain |  | 🟡 |
| Chang'e | deity | ③ | Moon goddess who drank the elixir of immortality, companion of the Jade Rabbit. | sky |  | 🟡 |
| Erlang Shen | deity | ③ | Three-eyed warrior god with a spear and a celestial hound. | mountain |  | 🟡 |
| Caishen | deity | ③ | God of wealth, honoured at New Year. | city |  | 🟡 |
| Hundun (混沌) | monster | ④ | Faceless, shapeless being, a figure of primordial chaos. | ruins, underworld | ○ ◆ | – |
| Qiongqi (窮奇) | monster | ④ | Winged tiger (or ox) from the Classic of Mountains and Seas. | bamboo, mountain | ○ ◆ | – |
| Bai Ze (白澤) | beast | ④ | Wise many-eyed beast who knows all spirits and told them to Huangdi. | mountain, forest | ○ ◆ | – |
| Jingwei (精衛) | spirit | ④ | Drowned girl turned bird who fills the sea with pebbles. | coast, sea | ○ ◆ | – |
| Kui (夔) | beast | ④ | One-legged hornless ox whose roar is thunder. | sea, mountain | ★ ◆ | – |
| Zhong Kui (鍾馗) | deity-beast | ④ | Scholar who became the demon queller, painted on doors at New Year (a folk door-guardian). | village, city | ○ | 🟡 |
| Xiangliu (相柳) | monster | ④ | Nine-headed snake whose poisonous breath ruins land. | marsh, mountain |  | – |
| Bifang (畢方) | spirit | ④ | One-legged crane whose appearance foretells fire. | forest, volcano |  | – |
| Xingtian (刑天) | spirit | ④ | Headless warrior with eyes on the chest who fights on. | mountain |  | – |
| Hulijing (狐狸精) | spirit | ④ | Fox spirit that becomes a woman; related to the nine-tailed fox. | forest, city |  | – |
| Bashe (巴蛇) | monster | ④ | Giant snake said to swallow an elephant and spit out its bones. | jungle, marsh |  | – |
| Xiezhi (獬豸) | beast | ④ | One-horned ox-goat that butts the guilty. | city |  | – |
| Bixi (贔屭) | beast | ④ | Dragon-headed tortoise that carries stone steles. | ruins |  | – |
| Chiwen (螭吻) | beast | ④ | Dragon-fish roof ornament that wards off fire. | city, sea |  | – |
| Mazu | deity | ④ | Sea goddess protecting sailors, worshipped across coastal China and Taiwan. | coast, sea |  | 🟡 |
| Xiwangmu | deity | ④ | Queen Mother of the West, keeper of the peaches of immortality. | mountain |  | 🟡 |
| Fuxi | deity | ④ | Serpent-bodied culture hero credited with the trigrams, fishing nets and writing. | river |  | 🟡 |
| Zhurong | deity | ④ | Fire god, also a legendary fire-keeper of the southern sky. | volcano |  | 🟡 |
| Gonggong | deity | ④ | Water god who broke Mount Buzhou in a rage, tilting the sky. | river |  | 🟡 |
| Shennong | deity | ④ | Farmer god who taught agriculture and tasted herbs. | meadow |  | 🟡 |
| Yanluo Wang | deity | ④ | King of the underworld who judges the dead in Chinese Buddhism and folk religion. | underworld |  | 🟡 |
| Shanxiao (山魈) | spirit | ⑤ | One-legged mountain imp that causes fever and mischief. | mountain, bamboo | ○ ◆ | – |

## Greek

Art set `greek` (20 drawn). Ancient religion with no significant living worship; Olympians and other gods are listed with 🟢 flags.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Medusa | monster | ① | Gorgon with snake hair whose gaze turns people to stone. | coast, ruins | ○ ◆ | – |
| Cyclops (Kyklops) | monster | ① | One-eyed giant smith or shepherd, as in the Odyssey. | island, cave | ○ ◆ | – |
| Cerberus | monster | ① | Multi-headed hound guarding the gates of Hades. | underworld | ★ ◆ | – |
| Hydra of Lerna | monster | ① | Many-headed water serpent whose heads regrow. | marsh, lake | ○ ◆ | – |
| Griffin (Gryps) | beast | ① | Eagle-headed winged lion that guards gold. | highland, desert | ○ ◆ | – |
| Pegasus | beast | ① | Winged horse born from Medusa's blood. | sky | ○ | – |
| Siren | monster | ① | Bird-bodied singer who lures sailors onto the rocks. | coast, sea | ★ ◆ | – |
| Centaur | beast | ① | Horse-bodied man; Chiron was a wise teacher among wild kin. | forest, meadow | ○ | – |
| Zeus | deity-beast | ① | King of the gods, wielder of the thunderbolt. | sky | ○ | 🟢 |
| Poseidon | deity-beast | ① | God of the sea, earthquakes and horses. | sea | ○ ◆ | 🟢 |
| Hades | deity-beast | ① | Lord of the underworld, with his helm of invisibility. | underworld | ★ | 🟢 |
| Athena | deity-beast | ① | Goddess of wisdom and war, with her owl. | city | ○ | 🟢 |
| Dolphin | animal | ① | Friendly sea mammal, sacred to Apollo and Dionysus. | sea |  | – |
| Apollo | deity | ① | God of the sun, music, prophecy and the Pythian oracle. | sky |  | 🟢 |
| Artemis | deity | ① | Virgin huntress, goddess of the moon, wild animals and childbirth. | forest |  | 🟢 |
| Aphrodite | deity | ① | Goddess of love and beauty, born from sea foam. | coast |  | 🟢 |
| Hermes | deity | ① | Winged messenger and trickster, guide of souls and patron of travellers. | sky |  | 🟢 |
| Dionysus | deity | ① | God of wine, theatre and ecstatic revelry. | meadow |  | 🟢 |
| Minotaur | monster | ② | Bull-headed man of the Cretan labyrinth. | ruins, cave | ○ ◆ | – |
| Chimera | monster | ② | Lion with a goat head on its back and a snake tail, breathing fire. | highland, volcano | ○ ◆ | – |
| Harpy | monster | ② | Winged woman-bird snatching food and people. | sky, coast | ○ ◆ | – |
| Satyr | spirit | ② | Goat-legged follower of Dionysus, piper and reveller. | forest, meadow | ○ | – |
| Scylla | monster | ② | Six-headed sea monster of the strait opposite Charybdis. | sea, coast | ○ ◆ | – |
| Nemean Lion | beast | ② | Lion with an invulnerable hide killed by Heracles. | highland, cave | ○ ◆ | – |
| Charybdis | monster | ② | Whirlpool monster who swallows and spews the sea thrice daily. | sea |  | – |
| Dryad | spirit | ② | Tree nymph whose life is tied to her tree. | forest |  | – |
| Charon | spirit | ② | Ferryman who carries the dead across the Styx. | underworld |  | 🟢 |
| Pan | spirit | ② | Goat-legged god of the wild, flocks and sudden panic. | forest, highland |  | 🟢 |
| Hera | deity | ② | Queen of the gods, goddess of marriage, jealous wife of Zeus. | sky |  | 🟢 |
| Ares | deity | ② | God of war and bloodshed, hated by his fellow Olympians. | ruins |  | 🟢 |
| Hephaestus | deity | ② | Lame smith god who forged the weapons and automata of the gods. | volcano |  | 🟢 |
| Demeter | deity | ② | Goddess of grain and the harvest, mother of Persephone. | meadow |  | 🟢 |
| Persephone | deity | ② | Queen of the underworld who spends part of each year with Hades. | underworld |  | 🟢 |
| Hecate | deity | ② | Goddess of crossroads, witchcraft and ghosts, bearing torches. | underworld |  | 🟢 |
| Prometheus | deity | ② | Titan who stole fire for humankind and was chained to a rock. | mountain |  | 🟢 |
| Atlas | deity | ② | Titan condemned to hold up the sky. | mountain |  | 🟢 |
| Eros | deity | ② | Winged god of desire whose arrows kindle love. | sky |  | 🟢 |
| Talos | construct | ③ | Bronze giant who guards Crete by circling the island. | island, coast | ★ ◆ | – |
| Typhon | monster | ③ | Hundred-headed storm giant, father of monsters. | volcano, sky | ★ ◆ | – |
| Echidna | monster | ③ | Half-woman, half-snake mother of many monsters. | cave, underworld |  | – |
| Ladon | monster | ③ | Hundred-headed dragon guarding the Hesperides' golden apples. | oasis |  | – |
| Stymphalian birds | monster | ③ | Man-eating birds with bronze beaks and metal feathers. | marsh, lake |  | – |
| Erymanthian Boar | beast | ③ | Giant boar of the Arcadian mountains. | highland, forest |  | – |
| Cretan Bull | beast | ③ | Raging white bull Heracles captured, sire of the Minotaur. | meadow, island |  | – |
| Lamia | monster | ③ | Child-snatching queen turned monster by Hera. | cave |  | – |
| Hippocampus | beast | ③ | Fish-tailed sea horse that pulls Poseidon's chariot. | sea, coast |  | – |
| Triton | monster | ③ | Merman herald of the sea who blows a conch. | sea |  | 🟢 |
| Nereid | spirit | ③ | Sea nymph, daughter of Nereus. | sea, coast |  | – |
| Graeae | monster | ③ | Three grey sisters sharing one eye and one tooth. | cave, coast |  | – |
| Owl of Athena | animal | ③ | Little owl, symbol of wisdom and Athens. | city |  | – |
| Hestia | deity | ③ | Virgin goddess of the hearth and domestic fire. | village |  | 🟢 |
| Cronus | deity | ③ | Titan who castrated Uranus and swallowed his own children. | sky |  | 🟢 |
| Gaia | deity | ③ | Primordial earth, mother of the Titans and Giants. | meadow |  | 🟢 |
| Thanatos | deity | ③ | Winged personification of death, brother of Hypnos. | underworld |  | 🟢 |
| Hypnos | deity | ③ | Personification of sleep who dwells near the underworld. | underworld |  | 🟢 |
| Nemesis | deity | ③ | Goddess of retribution against arrogance. | city |  | 🟢 |
| Eris | deity | ③ | Goddess of strife who threw the golden apple at the wedding of Peleus. | city |  | 🟢 |
| Orthrus | monster | ④ | Two-headed hound of Geryon, Cerberus's brother. | meadow, island |  | – |
| Empusa | monster | ④ | Shape-shifting, bronze-legged demon sent by Hecate. | underworld |  | – |
| Python | monster | ④ | Serpent of Delphi slain by Apollo. | highland, cave |  | – |
| Argus Panoptes | monster | ④ | Hundred-eyed giant herdsman who never fully sleeps. | meadow |  | – |
| Ram Chrysomallos | beast | ④ | Golden-fleeced flying ram sought by the Argonauts. | sky, highland |  | – |
| Nyx | deity | ④ | Primordial goddess of night, mother of Sleep and Death. | underworld |  | 🟢 |
| Helios | deity | ④ | Sun god who drives a chariot across the sky each day. | sky |  | 🟢 |
| Selene | deity | ④ | Moon goddess driving a silver chariot. | sky |  | 🟢 |

## Norse

Art set `norse` (20 drawn). Fenrir and Kraken were dropped after failed refinements.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Valkyrie | spirit | ① | Armoured chooser of the slain who bears warriors to Valhalla. | sky | ○ ◆ | 🟢 |
| Troll | monster | ① | Mountain-dwelling giant or brute, turned to stone by sunlight in folk tales. | mountain, cave | ○ ◆ | – |
| Kraken | monster | ① | Giant sea creature of later Scandinavian sailors' tales. | sea | ✕ | – |
| Thor | deity-beast | ① | God of thunder, goat-driver, wielder of Mjölnir. | sky | ○ | 🟢 |
| Odin | deity-beast | ① | The All-father, one-eyed wanderer. | sky | ○ | 🟢 |
| Loki | deity-beast | ① | Trickster and shape-shifter, mother of Sleipnir. | city | ○ ◆ | 🟢 |
| Polar bear | animal | ① | Arctic apex predator of the Norse coasts and Greenland. | ice |  | – |
| Reindeer | animal | ① | Hardy herd animal of the Nordic north. | ice, highland |  | – |
| Wolf | animal | ① | Pack hunter of the Nordic forests. | forest, ice |  | – |
| Fenrir | monster | ② | Monstrous wolf bound by the gods, fated to break loose at Ragnarök. | ice, underworld | ✕ | – |
| Jörmungandr | monster | ② | World Serpent encircling Midgard, doomed to fight Thor at Ragnarök. | sea | ○ ◆ | – |
| Draugr | undead | ② | Undead barrow-dweller of strength and foul temper that guards its treasure. | tomb | ○ ◆ | – |
| Freyja | deity-beast | ② | Goddess of love and war, drawn with her cats. | meadow | ○ | 🟢 |
| Hel | deity-beast | ② | Half-living, half-corpse ruler of the realm of the dead. | underworld | ○ ◆ | 🟢 |
| Sleipnir | beast | ③ | Eight-legged grey horse of Odin, born of Loki. | sky, underworld | ○ ◆ | – |
| Jötunn | monster | ③ | Frost giant, ancient foe of gods and men. | ice, mountain | ★ ◆ | – |
| Surtr | monster | ③ | Fire giant of Muspelheim who will burn the world at Ragnarök. | volcano | ○ ◆ | – |
| Dvergr | spirit | ③ | Dwarf smith who forges treasures within the earth. | cave, mountain | ○ ◆ | – |
| Níðhöggr | monster | ③ | Dragon that gnaws the roots of Yggdrasil. | underworld | ○ | – |
| Ratatoskr | beast | ③ | Squirrel that carries insults up and down Yggdrasil. | forest | ○ ◆ | – |
| Huginn and Muninn | beast | ③ | Odin's two ravens, Thought and Memory. | sky | ★ ◆ | – |
| Lindworm | monster | ③ | Wingless, two-legged serpent dragon of Nordic folklore. | forest, mountain | ○ ◆ | – |
| Nisse | spirit | ③ | Small house gnome who guards the farm and punishes disrespect. | village | ○ ◆ | – |
| Garmr | monster | ③ | Blood-stained hound that guards Hel's gate. | underworld |  | – |
| Fáfnir | monster | ③ | Dwarf turned dragon who guards a cursed hoard. | cave, mountain |  | – |
| Freyr | deity | ③ | Vanir god of fertility, sunshine and prosperity who owns the boar Gullinbursti. | meadow |  | 🟢 |
| Baldr | deity | ③ | Beloved god of light killed by a mistletoe dart through Loki's scheme. | sky |  | 🟢 |
| Tyr | deity | ③ | One-handed god of law and war who lost his hand binding Fenrir. | highland |  | 🟢 |
| Heimdall | deity | ③ | Watchman of the gods at the rainbow bridge who will sound the Gjallarhorn. | sky |  | 🟢 |
| Frigg | deity | ③ | Queen of Asgard, wife of Odin, who foresees all but tells nothing. | sky |  | 🟢 |
| Sköll and Hati | monster | ④ | Wolves that chase the sun and moon. | sky, ice |  | – |
| Gullinbursti | beast | ④ | Golden-bristled boar made by dwarves. | forest |  | – |
| Tanngrisnir and Tanngnjóstr | beast | ④ | Goats that pull a chariot and can be eaten and revived. | sky, highland |  | – |
| Auðumbla | beast | ④ | Primordial cow who licked the first god from the ice. | ice |  | – |
| Huldra | spirit | ④ | Alluring forest woman with a cow's tail, from Scandinavian folklore. | forest |  | – |
| Näcken | spirit | ④ | Fiddling water spirit who lures people into lakes. | river, lake |  | – |
| Draugen | undead | ④ | Headless fisherman's ghost who rows a half boat before storms. | sea, coast |  | – |
| Mara | spirit | ④ | Night spirit that sits on sleepers' chests and brings nightmares. | village |  | – |
| Skogsrå | spirit | ④ | Hollow-backed forest-keeper woman of Swedish folklore. | forest |  | – |
| Njörðr | deity | ④ | Vanir god of the sea, ships and wealth. | sea, coast |  | 🟢 |
| Iðunn | deity | ④ | Keeper of the apples that keep the gods young. | forest |  | 🟢 |
| Sif | deity | ④ | Golden-haired wife of Thor. | meadow |  | 🟢 |
| Skaði | deity | ④ | Giantess goddess of winter, skiing and the hunt. | ice, mountain |  | 🟢 |
| Ægir | deity | ④ | Jötunn lord of the sea who brews ale for the gods. | sea |  | 🟢 |
| Mímir | deity | ④ | Wise being whose severed head Odin consults beside a well of wisdom. | forest |  | 🟢 |
| Norns | deity | ④ | Three fate-weavers beneath Yggdrasil: Urðr, Verðandi and Skuld. | forest |  | 🟢 |
| Eikþyrnir | beast | ⑤ | Stag atop Valhalla whose antlers drip rivers. | forest, sky |  | – |
| Hræsvelgr | monster | ⑤ | Giant eagle at the world's edge whose wings stir the winds. | sky, ice |  | – |
| Haugbui | undead | ⑤ | Barrow-dweller, a mound-guarding variant of the draugr. | tomb |  | – |
| Bragi | deity | ⑤ | God of poetry and eloquence. | sky |  | 🟢 |
| Víðarr | deity | ⑤ | Silent god who avenges Odin at Ragnarök by slaying Fenrir. | forest |  | 🟢 |
| Höðr | deity | ⑤ | Blind god tricked into killing Baldr. | sky |  | 🟢 |
| Ullr | deity | ⑤ | God of archery, skiing and the duel. | ice |  | 🟢 |

## Slavic

Art set `slavic` (20 drawn). Vodyanoy was dropped.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Grey Wolf | animal | ① | Helper and menace of Slavic folk tales. | forest |  | – |
| Brown bear | animal | ① | Lord of the forest, Russia's emblem animal. | forest |  | – |
| Baba Yaga | monster | ② | Witch who flies in a mortar and lives in a hut on chicken legs. | forest | ○ | – |
| Firebird (Zhar-ptitsa) | beast | ② | Glowing bird whose feathers light the night. | forest | ○ ◆ | – |
| Koschei | undead | ③ | The Deathless sorcerer whose death is hidden in a needle in an egg. | ruins | ○ ◆ | – |
| Zmey Gorynych | monster | ③ | Multi-headed fire-breathing dragon of the byliny. | mountain | ○ ◆ | – |
| Leshy | spirit | ③ | Shape-shifting master of the forest who leads travellers astray. | forest | ○ ◆ | – |
| Rusalka | spirit | ③ | Drowned maiden who lures the living into rivers. | river, lake, marsh | ○ ◆ | – |
| Vodyanoy | spirit | ③ | Frog-bearded water spirit who drowns the careless. | lake, river | ✕ | – |
| Domovoi | spirit | ③ | Hairy household guardian who tends or punishes the home. | village | ○ ◆ | – |
| Upyr | undead | ③ | Slavic vampire, a corpse that rises to feed on the living. | tomb, village | ○ | – |
| Vila | spirit | ③ | Storm and mountain fairy-maiden, kind or cruel. | mountain, lake | ○ | – |
| Perun | deity-beast | ③ | Thunder god with an axe, enemy of Veles. | sky, mountain | ★ ◆ | 🟡 |
| Veles | deity-beast | ③ | Horned god of the underworld, cattle and waters. | underworld | ★ | 🟡 |
| Morana | deity-beast | ③ | Goddess of winter and death, burned in spring rites. | ice | ○ ◆ | 🟡 |
| Chernobog | deity-beast | ③ | The black god, reported in medieval chronicles. | underworld | ★ | 🟡 |
| Mavka | spirit | ③ | Ukrainian forest nymph, a dead girl who lures men. | forest |  | – |
| Wisent | animal | ③ | European bison of Białowieża, the old forest. | forest, meadow |  | – |
| Kikimora | spirit | ④ | Mischievous swamp or house spirit that spins at night. | marsh, village | ○ | – |
| Bannik | spirit | ④ | Spirit of the bathhouse, dangerous when angered. | village | ○ ◆ | – |
| Poludnitsa | spirit | ④ | Noon lady of the fields who punishes those working in the heat. | meadow | ○ | – |
| Likho | spirit | ④ | One-eyed embodiment of misfortune. | village, forest | ○ | – |
| Alkonost | monster | ④ | Bird with a maiden's face whose song makes people forget all. | sky, sea | ★ ◆ | – |
| Strzyga | undead | ④ | Two-souled night demon of Polish folklore. | forest, village | ○ | – |
| Sirin | monster | ④ | Owl-bodied woman-bird whose song is deadly to hear. | forest, sky |  | – |
| Gamayun | beast | ④ | Prophetic bird with a woman's face. | sky |  | – |
| Simargl | beast | ④ | Winged dog guardian of seeds in early Rus lore. | sky |  | – |
| Indrik | beast | ④ | Horned beast-king of animals in Russian legend. | mountain, forest |  | – |
| Drekavac | monster | ④ | Dreaded screaming creature of Serbian and Croatian folklore. | forest, village |  | – |
| Vukodlak | undead | ④ | Werewolf-vampire of the Balkan Slavs. | forest |  | – |
| Sivka-Burka | beast | ④ | Magical talking horse of Russian folk tales. | meadow |  | – |
| Svarog | deity | ④ | Fire and smith god of the Slavs, named in the Hypatian Chronicle. | sky |  | 🟡 |
| Dazhbog | deity | ④ | Sun god in the pantheon set up by Vladimir of Kyiv in 980. | sky |  | 🟡 |
| Stribog | deity | ④ | God of winds, listed in Vladimir's pantheon. | sky |  | 🟡 |
| Mokosh | deity | ④ | Goddess of Vladimir's pantheon linked to women, spinning and fate. | village |  | 🟡 |
| Svetovid | deity | ④ | Four-headed god of the temple at Arkona on Rügen. | ruins |  | 🟡 |
| Triglav | deity | ④ | Three-headed god of Szczecin, linked to sky, earth and underworld. | ruins |  | 🟡 |
| Ovinnik | spirit | ⑤ | Barn spirit that lives in the grain-drying house. | village |  | – |
| Polevik | spirit | ⑤ | Field spirit that tricks farmers in the crops. | meadow |  | – |
| Zduhać | spirit | ⑤ | Serbian weather guardian born with a caul who fights storm dragons. | sky, highland |  | – |
| Rarog | beast | ⑤ | Fiery falcon of Slavic tales, tied to the Rurikid emblem. | sky |  | – |
| Aspid | monster | ⑤ | Winged poisonous serpent of Russian bestiaries. | mountain |  | – |
| Khors | deity | ⑤ | Deity named alongside Dazhbog in Vladimir's pantheon; role uncertain. | sky |  | 🟡 |

## Maya

Art set `maya` (20 drawn). Maya peoples are alive today and contemporary Maya spirituality continues; deities and sacred figures carry 🟡 flags.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Jaguar | animal | ① | Apex predator and royal emblem of the Maya. | jungle, forest |  | – |
| Resplendent quetzal | animal | ② | Long-tailed forest bird of the cloud forests. | jungle, sky |  | – |
| Spider monkey | animal | ② | Agile canopy monkey of Central America. | jungle |  | – |
| Tapir | animal | ② | Shy forest herbivore with a short trunk. | jungle |  | – |
| Kukulkan | deity-beast | ③ | Feathered serpent of Chichén Itzá. | sky, ruins | ○ | 🟡 |
| Camazotz | monster | ③ | Death bat who beheaded a Hero Twin in Xibalba. | cave, underworld | ○ ◆ | – |
| Chaac | deity-beast | ③ | Rain god with a lightning axe. | sky, jungle | ○ | 🟡 |
| Ix Chel | deity-beast | ③ | Moon goddess with her rabbit. | sky | ★ ◆ | 🟡 |
| Ah Puch | deity-beast | ③ | Lord of death, skeletal, with bells. | underworld | ★ ◆ | 🟡 |
| Ocellated turkey | animal | ③ | Colourful forest turkey of the Yucatán. | jungle |  | – |
| Huracan | deity | ③ | One-legged K'iche' storm god, Heart of Sky in the Popol Vuh. | sky |  | 🟡 |
| Vucub Caquix | monster | ④ | Seven Macaw, false sun slain by the Hero Twins. | forest, sky | ○ ◆ | – |
| Zipacna | monster | ④ | Crocodile-backed mountain-maker giant of the Popol Vuh. | mountain, river | ○ ◆ | – |
| Cabrakan | monster | ④ | Earthquake giant who topples mountains. | volcano, mountain | ○ ◆ | – |
| Balam | spirit | ④ | Jaguar guardian of fields and villages. | forest, jungle | ○ ◆ | – |
| Alux | spirit | ④ | Little field and forest sprite of Yucatec folklore. | forest, village | ○ ◆ | – |
| Sisimito | monster | ④ | Hairy forest giant of Maya folklore. | forest, jungle | ○ | – |
| Xtabay | spirit | ④ | Ceiba-tree spirit that lures men in the forest. | forest, jungle | ★ | – |
| Huay Chivo | spirit | ④ | Goat-shaped sorcerer who prowls at night. | forest, village | ○ ◆ | – |
| Cadejo | spirit | ④ | Spirit dog of the night road, white and black. | village, forest | ○ ◆ | – |
| Hunahpu and Xbalanque | spirit | ④ | The Hero Twins who defeat the lords of Xibalba. | underworld | ○ | 🟡 |
| Itzamna | deity-beast | ④ | Sky lord and first priest. | sky | ○ | 🟡 |
| Kinich Ahau | deity-beast | ④ | Sun god, jaguar at night. | sky | ○ | 🟡 |
| Hun-Came and Vucub-Came | spirit | ④ | Death lords of Xibalba who set trials for the Hero Twins. | underworld |  | 🟡 |
| Kisin | monster | ④ | Yucatec earthquake and death-bringing spirit. | underworld |  | – |
| Hun Hunahpu (Maize God) | deity | ④ | Maize god of the Popol Vuh, father of the Hero Twins, sacrificed in Xibalba. | underworld |  | 🟡 |
| Hun Batz and Hun Chuen | spirit | ⑤ | Howler-monkey scribes of the Popol Vuh, turned by the Hero Twins. | jungle | ○ | – |
| Buluc Chabtan | deity-beast | ⑤ | God of war and sacrifice. | canyon | ○ ◆ | 🟡 |
| Bacab | deity-beast | ⑤ | Turtle-shelled bearer of the sky. | sky | ○ | 🟡 |
| Xquic | spirit | ⑤ | Xibalban maiden and mother of the Hero Twins. | underworld |  | – |
| Wayob | spirit | ⑤ | Animal companion-spirits and sorcerer's alter forms. | jungle |  | – |
| Gucumatz | deity | ⑤ | K'iche' feathered serpent creator who shaped the world with Tepeu. | river |  | 🟡 |
| Yum Kaax | deity | ⑤ | Yucatec lord of the wild, maize and forest. | forest |  | 🟡 |
| Ixtab | deity | ⑤ | Goddess of hanging and suicide, shown hanging from a cord. | underworld |  | 🟡 |
| Ek Chuaj | deity | ⑤ | Black-faced merchant god and patron of cacao. | jungle |  | 🟡 |

## Korean

Art set `korean` (20 drawn). Sansin, Jowangshin, Yeomra and other folk-religion figures carry 🟡 flags.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Gongjak (공작) | animal | ② | Peacock, a royal emblem in Joseon painting. | meadow |  | – |
| Siberian tiger | animal | ② | Beom, the great cat of Korean mountains and folk art. | mountain, ice |  | – |
| Magpie (까치) | animal | ② | Bringer of good news in Korean folk belief. | village, meadow |  | – |
| Dokkaebi (도깨비) | spirit | ③ | Goblin with a magic club who plays tricks and rewards the honest. | forest, village | ○ ◆ | – |
| Gumiho (구미호) | monster | ③ | Nine-tailed fox that becomes a woman and eats livers or hearts. | forest, mountain | ○ ◆ | – |
| Haetae (해태) | beast | ③ | Lion-like guardian that judges the guilty and wards off fire. | city | ○ ◆ | – |
| Imugi (이무기) | monster | ③ | Great serpent striving a thousand years to become a dragon. | river, marsh | ○ ◆ | – |
| Dalgyal Gwisin (달걀귀신) | spirit | ③ | Faceless egg-shaped ghost. | village | ★ ◆ | – |
| Cheonyeo Gwisin (처녀귀신) | spirit | ③ | Ghost of a maiden who died unmarried, in white. | village, forest | ○ ◆ | – |
| Yong (용) | beast | ③ | Korean dragon, a water-bringer holding a wish pearl. | sky, river | ○ | – |
| Jeoseung Saja (저승사자) | spirit | ③ | Black-clad reaper who escorts the dead. | underworld | ★ | – |
| Jangseung (장승) | construct | ③ | Village guardian totem posts with carved faces. | village | ★ ◆ | 🟡 |
| Gwisin (귀신) | undead | ③ | General ghost of those who died with resentment. | village |  | – |
| Geobuk (거북) | beast | ③ | Long-lived turtle, a symbol of longevity in Korea. | river, sea |  | – |
| Dangun | deity | ③ | Legendary founder of Gojoseon, born of Hwanung and a bear-woman. | mountain |  | 🟡 |
| Bulgasari (불가사리) | monster | ④ | Iron-eating beast of legend that grows by eating metal. | village, mountain | ○ ◆ | – |
| Samjok-o (삼족오) | beast | ④ | Three-legged sun crow of Goguryeo murals. | sky | ★ ◆ | – |
| Bulgae (불개) | beast | ④ | Fire dogs that try to bite the sun or moon, causing eclipses. | sky | ○ ◆ | – |
| Jangsan-beom (장산범) | monster | ④ | White tiger-like creature of Jangsan that mimics voices. | mountain, forest | ○ ◆ | – |
| Mul Gwisin (물귀신) | spirit | ④ | Water ghost that drags swimmers under. | river, lake | ○ ◆ | – |
| Ungnyeo (웅녀) | spirit | ④ | Bear who became a woman, mother of Dangun. | mountain, cave | ○ ◆ | – |
| Sansin (산신) | deity-beast | ④ | Mountain god, shown with his tiger. | mountain | ★ ◆ | 🟡 |
| Yeomra (염라) | deity-beast | ④ | King of the underworld who judges souls. | underworld | ○ | 🟡 |
| Bonghwang (봉황) | beast | ④ | Korean phoenix emblem of the presidency and royal arts. | sky |  | – |
| Cheonma (천마) | beast | ④ | Winged horse seen in the Silla royal tomb painting. | sky, tomb |  | – |
| Hwanung | deity | ④ | Heavenly prince who descended to Mount Taebaek with wind, rain and cloud lords. | mountain |  | 🟡 |
| Yongwang | deity | ④ | Dragon King of the sea and rivers, honoured by fishermen. | sea |  | 🟡 |
| Inmyeonjo (인면조) | beast | ⑤ | Human-faced bird of paradise drawn in Goguryeo tomb murals. | sky, tomb | ○ ◆ | – |
| Samsin Halmeoni (삼신할머니) | deity-beast | ⑤ | Grandmother goddess of birth. | village | ○ | 🟡 |
| Jowangshin (조왕신) | deity-beast | ⑤ | Goddess of the hearth and kitchen. | village | ★ ◆ | 🟡 |
| Gaeksin (객귀) | spirit | ⑤ | Wandering ghost of one who died away from home. | village, forest |  | – |
| Hwanin | deity | ⑤ | Lord of Heaven in the Dangun myth, father of Hwanung. | sky |  | 🟡 |
| Chilseong | deity | ⑤ | Seven-star god of the Big Dipper, tied to longevity and children. | sky |  | 🟡 |
| Seongjushin | deity | ⑤ | Household god of the home's framework and family fortune. | village |  | 🟡 |

## Celtic (Irish, Scottish, Welsh, Cornish)

New. Folklore creatures and deities.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Leprechaun (leipreachán) | spirit | ① | Solitary shoemaker fairy guarding a crock of gold. | meadow, forest |  | – |
| Banshee (bean sídhe) | spirit | ② | Wailing woman whose cry foretells a death in an Irish family. | village, ruins |  | – |
| Selkie | spirit | ② | Seal that sheds its skin to become human, from Orkney, Shetland and Ireland. | coast, sea |  | – |
| Kelpie | monster | ② | Shape-shifting water horse that drowns riders in Scottish lochs. | lake, river |  | – |
| Brownie | spirit | ② | Helpful household spirit paid with a bowl of cream. | village |  | – |
| Red deer | animal | ② | Stag of the Highlands and Irish forests. | highland, forest |  | – |
| Púca | spirit | ③ | Shape-shifting goblin that appears as a dark horse, goat or hare. | highland, meadow |  | – |
| Cú Sídhe | beast | ③ | Green fairy hound of the Scottish Highlands, the size of a calf. | highland, forest |  | – |
| Dullahan (dubhlachán) | undead | ③ | Headless horseman who carries his own head; a death omen. | village, meadow |  | – |
| Balor | monster | ③ | Fomorian giant whose single baleful eye destroys all it sees. | island, coast |  | – |
| Merrow (murúch) | spirit | ③ | Irish mermaid or merman who wears a magic cap to dive. | coast, sea |  | – |
| Redcap | spirit | ③ | Murderous goblin of Border ruins who dyes his cap in blood. | ruins |  | – |
| Cat sìth | beast | ③ | Large black fairy cat of the Highlands with a white chest spot. | highland, forest |  | – |
| Nuckelavee | monster | ③ | Skinless horse-and-rider demon of Orkney's sea. | sea, coast |  | – |
| Ddraig Goch | beast | ③ | Welsh Red Dragon, emblem of Wales, in the Mabinogion. | mountain, highland |  | – |
| Irish wolfhound | animal | ③ | Giant hound of Irish legend, like Cú Chulainn's namesake. | meadow, highland |  | – |
| Dagda | deity | ③ | Irish father-god of the Tuatha Dé Danann with a club and a cauldron that never empties. | mountain |  | 🟡 |
| The Morrígan | deity | ③ | Irish war goddess of fate and battle, appearing as a crow. | meadow |  | 🟡 |
| Lugh | deity | ③ | Many-skilled Irish hero-god with a spear that never misses. | highland |  | 🟡 |
| Brigid | deity | ③ | Irish goddess of poetry, smithcraft and healing, also a Christian saint. | village |  | 🟡 |
| Cernunnos | deity | ③ | Antlered Gaulish god of beasts, attested on the Pillar of the Boatmen. | forest |  | 🟡 |
| Arawn | deity | ③ | Welsh king of Annwn, lord of the otherworld and the hounds Cŵn Annwn. | underworld |  | 🟡 |
| Each-uisge | monster | ④ | Highland water horse, more savage than the kelpie, in sea lochs. | lake, coast |  | – |
| Fomorians (Fomóire) | monster | ④ | Misshapen, hostile race of Irish myth, oppressors of earlier settlers. | sea, island |  | – |
| Fear Dearg | spirit | ④ | Red Man, solitary trickster fairy who plays cruel pranks. | village, meadow |  | – |
| Sluagh | undead | ④ | Host of the restless dead flying at night in the Scottish Highlands. | sky, highland |  | – |
| Bean-nighe | spirit | ④ | Washer at the ford who cleans the clothes of those about to die. | river |  | – |
| Glaistig | spirit | ④ | Half-woman, half-goat spirit of Highland glens. | highland |  | – |
| Blue Men of the Minch | spirit | ④ | Storm-kelpies that challenge sailors to rhyming contests. | sea, coast |  | – |
| Spriggan | spirit | ④ | Small, ugly guardian of Cornish ruins and treasure. | ruins |  | – |
| Knocker | spirit | ④ | Cornish and Welsh mine spirit who raps at rich seams. | cave |  | – |
| Afanc | monster | ④ | Lake monster of Welsh legend, beaver- or crocodile-like. | lake |  | – |
| Gwyllgi | beast | ④ | Black dog of Welsh folklore, a phantom of dark roads. | highland, village |  | – |
| Cŵn Annwn | beast | ④ | White hounds with red ears that hunt souls, from the Otherworld. | sky, underworld |  | – |
| Mari Lwyd | construct | ④ | Horse-skull wassailing figure of Welsh midwinter tradition. | village |  | – |
| Salmon of Knowledge | animal | ④ | Bradán Feasa, the fish that grants wisdom to whoever eats it first. | river |  | – |
| Danu | deity | ④ | Mother goddess from whom the Tuatha Dé Danann take their name. | meadow |  | 🟡 |
| Nuada | deity | ④ | Irish king with a silver arm and a sword that no one escapes. | mountain |  | 🟡 |
| Manannán mac Lir | deity | ④ | Irish sea god with a cloak of mist and a boat that needs no oars. | sea |  | 🟡 |
| Epona | deity | ④ | Gaulish horse goddess worshipped by Roman cavalry. | meadow |  | 🟡 |
| Rhiannon | deity | ④ | Welsh horsewoman of the Mabinogion with magical birds. | meadow |  | 🟡 |
| Cailleach | deity | ④ | Hag of winter in Irish and Scottish lore who shapes mountains. | ice, mountain |  | 🟡 |
| Oilliphéist | monster | ⑤ | Giant lake and river serpent of Irish legend. | lake, river |  | – |
| Gwragedd Annwn | spirit | ⑤ | Welsh lake maidens who marry mortals under conditions. | lake |  | – |
| Twrch Trwyth | monster | ⑤ | Giant boar hunted by Arthur's men in Culhwch and Olwen. | forest, highland |  | – |
| Ceffyl Dŵr | monster | ⑤ | Welsh water horse that lures riders into rivers. | river |  | – |
| Taranis | deity | ⑤ | Gaulish thunder god named by the poet Lucan. | sky |  | 🟡 |
| Belenus | deity | ⑤ | Gaulish god of light and healing. | sky |  | 🟡 |
| Ogma | deity | ⑤ | Irish champion credited with inventing the ogham script. | highland |  | 🟡 |
| Goibniu | deity | ⑤ | Irish smith god whose ale grants immortality. | mountain |  | 🟡 |

## Aztec and wider Mesoamerican

New. Beyond Maya. Aztec and Nahua gods are included with 🟡 flags (descendant communities and a Mexicanidad revival exist).

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Jaguar (ocelotl) | animal | ① | Apex predator of Mesoamerica; emblem of Aztec warriors. | jungle, forest |  | – |
| Hummingbird (huitzilin) | animal | ① | Tiny nectar-drinker revered by Aztecs as the soul of warriors. | forest, meadow |  | – |
| Axolotl | animal | ② | Salamander of Lake Xochimilco that keeps its larval form. | lake |  | – |
| Golden eagle (cuauhtli) | animal | ② | Bird of the sun, emblem of Aztec warriors and the Mexican flag. | sky, highland |  | – |
| Quetzal | animal | ② | Resplendent forest bird whose tail feathers marked rank. | jungle, sky |  | – |
| La Llorona | spirit | ③ | Weeping woman wandering rivers and calling for her lost children. | river, village |  | – |
| Alebrije | construct | ③ | Brightly painted fantasy creatures of Oaxacan folk art, created in the 1930s. | city, village |  | – |
| Xoloitzcuintli | animal | ③ | Hairless dog that, in Aztec belief, guided the dead. | village, underworld |  | – |
| Feathered serpent (Teotihuacan) | monster | ③ | Fanged, feathered snake in Teotihuacan murals and temple carvings. | ruins |  | – |
| Mexican wolf | animal | ③ | Small grey wolf of northern Mexico's canyons. | canyon, desert |  | – |
| Quetzalcoatl | deity | ③ | Feathered serpent god of wind, learning and the morning star. | sky |  | 🟡 |
| Huitzilopochtli | deity | ③ | Tutelary war and sun god of the Mexica, patron of Tenochtitlan. | city |  | 🟡 |
| Tezcatlipoca | deity | ③ | Smoking Mirror, god of night, sorcery and rivalry with Quetzalcoatl. | city |  | 🟡 |
| Tlaloc | deity | ③ | Rain and lightning god, lord of the Tlalocan paradise. | mountain |  | 🟡 |
| Coatlicue | deity | ③ | Earth mother with a skirt of serpents, mother of Huitzilopochtli. | mountain |  | 🟡 |
| Mictlantecuhtli | deity | ③ | Skeletal lord of Mictlan, the underworld. | underworld |  | 🟡 |
| Ahuizotl | monster | ④ | Dog-like water beast with a hand at the tail tip that drags people under. | lake, marsh |  | – |
| Tzitzimime | monster | ④ | Skeletal star-demons that descend if the sun fails, feared at eclipses. | sky, underworld |  | 🟡 |
| Cihuateteo | undead | ④ | Spirits of women who died in childbirth, haunting crossroads. | village, ruins |  | 🟡 |
| Nahual | spirit | ④ | Human sorcerer who takes animal form, such as jaguar or dog. | forest, village |  | – |
| Cipactli | monster | ④ | Primordial earth-crocodile whose body became the land. | marsh, coast |  | – |
| Xiuhcoatl | monster | ④ | Fire serpent, a turquoise-scaled weapon in Aztec myth. | volcano, sky |  | – |
| Chaneque | spirit | ④ | Small guardian spirits of forests, water and caves who steal one's soul. | forest, cave |  | – |
| La Lechuza | spirit | ④ | Witch in owl form from northern Mexican and Tejano folklore. | village, sky |  | – |
| Charro Negro | spirit | ④ | Black-clad rider on a black horse who offers deals at crossroads. | desert, village |  | – |
| Chac Mool | construct | ④ | Reclining stone figure of Toltec and Maya art holding an offering bowl. | ruins |  | – |
| Olmec were-jaguar | spirit | ④ | Half-human, half-jaguar figure with a downturned mouth in Olmec art. | jungle |  | – |
| Xipe Totec | deity | ④ | Flayed god of spring and renewal, shown in a skin of sacrificed victims. | city |  | 🟡 |
| Mictecacihuatl | deity | ④ | Lady of the Dead, consort of Mictlantecuhtli. | underworld |  | 🟡 |
| Xochiquetzal | deity | ④ | Goddess of flowers, love and artisans. | meadow |  | 🟡 |
| Tonatiuh | deity | ④ | Fifth-sun god of the Aztec calendar stone. | sky |  | 🟡 |
| Xolotl | deity | ④ | Dog-headed god of lightning, twins and the evening star, guide of the dead. | underworld |  | 🟡 |
| Coyolxauhqui | deity | ④ | Moon goddess dismembered by her brother Huitzilopochtli. | sky |  | 🟡 |
| Chalchiuhtlicue | deity | ④ | Goddess of rivers, lakes and the sea with a skirt of jade. | river, lake |  | 🟡 |
| Ehecatl | deity | ④ | Wind aspect of Quetzalcoatl, wearing a beak-like mask. | sky |  | 🟡 |
| Itzpapalotl | deity | ④ | Obsidian Butterfly, skeletal warrior goddess with knife-tipped wings. | mountain |  | 🟡 |
| Xiuhtecuhtli | deity | ④ | Fire and time god, lord of the turquoise year. | volcano |  | 🟡 |
| Huehuecoyotl | deity | ⑤ | Old coyote, trickster god of dance and mischief. | steppe |  | 🟡 |
| Centeotl | deity | ⑤ | Maize god, son of Tlazolteotl. | meadow |  | 🟡 |

## Hindu and Indian

New. Folklore monsters and animals, plus Hindu gods, avatars and sacred mounts, all flagged 🔴 (actively worshipped; game use has drawn protests). Avoid the 🔴 rows as game units.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Bengal tiger | animal | ① | Striped apex predator of the Sundarbans and Indian jungle. | jungle, forest |  | – |
| Asian elephant | animal | ① | Largest land animal of India, a symbol of royal power. | jungle, forest |  | – |
| King cobra | animal | ① | World's longest venomous snake, central to snake-charmer lore. | jungle, village |  | – |
| Naga (folklore) | monster | ② | Serpent-folk of rivers and underworld, guardians of jewels and water. | river, underworld, lake |  | 🟡 |
| Indian peafowl | animal | ② | Colourful national bird of India. | meadow, forest |  | – |
| Indian rhinoceros | animal | ② | Armoured one-horned grazer of the Brahmaputra plains. | marsh, meadow |  | – |
| Asiatic lion | animal | ② | Last wild lions of Asia live in Gir Forest. | meadow, forest |  | – |
| Snow leopard | animal | ② | Elusive cat of the Himalayan heights. | mountain, ice |  | – |
| Shiva | deity | ② | Destroyer and transformer in the Trimurti, ascetic lord of Kailasa with a third eye. | mountain |  | 🔴 |
| Ganesha | deity | ② | Elephant-headed remover of obstacles, son of Shiva and Parvati. | village |  | 🔴 |
| Kali | deity | ② | Fierce dark goddess of time and destruction, linked to Durga. | city |  | 🔴 |
| Rakshasa | monster | ③ | Shape-shifting, flesh-eating demon of Indian epics and folklore. | forest, ruins |  | – |
| Bhoot | undead | ③ | Restless ghost of one who died untimely or violently. | village, ruins |  | – |
| Nagini | spirit | ③ | Female naga who can take a human form. | river, lake |  | 🟡 |
| Makara | monster | ③ | Crocodile-elephant sea beast with a fish tail, in Indian art. | sea, river |  | 🟡 |
| Gharial | animal | ③ | Long-snouted fish-eating crocodilian of Indian rivers. | river |  | – |
| Hanuman langur | animal | ③ | Grey monkey of temple towns and forests. | forest, village |  | – |
| Vishnu | deity | ③ | Preserver in the Trimurti who incarnates in ten avatars and rests on Shesha. | sea |  | 🔴 |
| Brahma | deity | ③ | Four-headed creator in the Trimurti, seated on a lotus. | sky |  | 🔴 |
| Durga | deity | ③ | Warrior goddess who rides a lion and slew the buffalo demon Mahishasura. | mountain |  | 🔴 |
| Lakshmi | deity | ③ | Goddess of fortune and prosperity, consort of Vishnu. | village |  | 🔴 |
| Hanuman | deity | ③ | Monkey devotee of Rama of immense strength and flight. | mountain |  | 🔴 |
| Krishna | deity | ③ | Avatar of Vishnu, divine cowherd and charioteer of the Bhagavad Gita. | meadow |  | 🔴 |
| Rama | deity | ③ | Avatar of Vishnu and hero of the Ramayana. | forest |  | 🔴 |
| Indra | deity | ③ | Vedic king of the gods, wielder of the thunderbolt vajra on the elephant Airavata. | sky |  | 🔴 |
| Agni | deity | ③ | Vedic fire god, messenger between gods and humans. | volcano |  | 🔴 |
| Surya | deity | ③ | Sun god who crosses the sky in a seven-horse chariot. | sky |  | 🔴 |
| Yama | deity | ③ | God of death and dharma, rider of a buffalo. | underworld |  | 🔴 |
| Garuda | deity-beast | ③ | Eagle-man vahana of Vishnu and enemy of the nagas. | sky |  | 🔴 |
| Vetala | undead | ④ | Spirit that inhabits corpses; narrator of the Baital Pachisi tales. | tomb, forest |  | – |
| Pishacha | monster | ④ | Flesh-eating ghoul of Indian folklore, haunting cremation grounds. | tomb, ruins |  | – |
| Churel | undead | ④ | Vengeful ghost of a woman who died in childbirth, with backward feet. | village, forest |  | – |
| Chudail | spirit | ④ | Witch-like ghost woman of North Indian folklore. | village, forest |  | – |
| Yali (Vyala) | monster | ④ | Lion-elephant-horse composite carved on South Indian temple pillars. | ruins, city |  | – |
| Kinnara | spirit | ④ | Half-human, half-bird musician of Himalayan legend. | mountain, forest |  | – |
| Sarus crane | animal | ④ | Tall pair-bonded crane, the tallest flying bird. | marsh, meadow |  | – |
| Saraswati | deity | ④ | Goddess of knowledge, music and learning, carried by a swan. | river |  | 🔴 |
| Parvati | deity | ④ | Mountain goddess, consort of Shiva and mother of Ganesha and Kartikeya. | mountain |  | 🔴 |
| Varuna | deity | ④ | Vedic god of cosmic order and the waters. | sea |  | 🔴 |
| Vayu | deity | ④ | God of wind and breath. | sky |  | 🔴 |
| Kartikeya (Murugan) | deity | ④ | War god with a spear, rider of a peacock, revered in South India. | mountain |  | 🔴 |
| Kubera | deity | ④ | Lord of wealth and guardian of the north. | mountain |  | 🔴 |
| Nandi | deity-beast | ④ | Sacred bull vahana of Shiva, guardian of Kailasa. | mountain |  | 🔴 |
| Airavata | deity-beast | ④ | White elephant with several heads, vahana of Indra. | sky |  | 🔴 |
| Shesha | deity-beast | ④ | Thousand-headed serpent on which Vishnu reclines. | sea |  | 🔴 |
| Vasuki | deity-beast | ④ | Serpent king worn by Shiva and used as the churning rope of the ocean. | sea |  | 🔴 |
| Hamsa | deity-beast | ④ | Swan or goose vahana of Saraswati and Brahma. | lake |  | 🔴 |
| Narasimha | deity-beast | ④ | Man-lion avatar of Vishnu who slew Hiranyakashipu. | city |  | 🔴 |
| Varaha | deity-beast | ④ | Boar avatar of Vishnu who lifted the earth from the ocean. | sea |  | 🔴 |
| Brahmarakshasa | undead | ⑤ | Learned Brahmin turned fierce spirit by wrongs in life. | ruins, forest |  | – |
| Purushamriga | monster | ⑤ | Human-headed tiger of Indian temple art. | forest |  | – |
| Mushika | deity-beast | ⑤ | Mouse vahana of Ganesha. | village |  | 🔴 |
| Kamadhenu | deity-beast | ⑤ | Wish-granting divine cow. | meadow |  | 🔴 |

## Persian and Arabian

New. Folklore, epic and Arabian Nights creatures plus a few Zoroastrian divinities (🟡). Islamic prophets, angels and Buraq are excluded entirely (depiction of prophets is forbidden); jinn are kept as folklore creatures with 🟡 flags.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Jinn (djinn) | spirit | ① | Beings of smokeless fire in Arabian folklore and Arabian Nights, from desert wastes. | desert, ruins |  | 🟡 |
| Ghoul (ghūl) | monster | ① | Desert shape-shifter that lures travellers and eats corpses. | desert, tomb |  | – |
| Dromedary camel | animal | ① | One-humped caravan beast of the Arabian deserts. | desert, oasis |  | – |
| Ifrit | spirit | ② | Powerful, cunning jinn of fire and smoke. | desert, volcano |  | 🟡 |
| Roc (Rukh) | beast | ② | Giant bird in Sinbad's voyages able to carry elephants. | sky, island |  | – |
| Arabian horse | animal | ② | Fine-boned, enduring desert horse prized by Bedouin. | desert, oasis |  | – |
| Simurgh | beast | ③ | Giant benevolent bird of the Shahnameh whose feathers heal. | mountain, sky |  | – |
| Peri | spirit | ③ | Winged fairy of Persian lore, once hunted by divs. | sky, mountain |  | – |
| Shahmaran | monster | ③ | Queen of snakes with a woman's torso, from Anatolian and Kurdish lore. | cave, underworld |  | – |
| Arabian oryx | animal | ③ | White antelope of the deserts, perhaps the root of unicorn tales. | desert |  | – |
| Saker falcon | animal | ③ | Falconry bird of the Gulf and steppe. | desert, sky |  | – |
| Barbary lion | animal | ③ | Extinct North African lion kept in royal menageries. | desert, highland |  | – |
| Huma | beast | ④ | Legendary bird that never lands; its shadow grants kingship. | sky |  | – |
| Karkadann | beast | ④ | One-horned Persian and Arabian beast like a rhinoceros or unicorn. | desert, jungle |  | – |
| Div | monster | ④ | Horned demon-giant of Persian epics. | mountain, ruins |  | – |
| Marid | spirit | ④ | Strong, rebellious sea-jinn, the strongest class in Arabian Nights. | sea, coast |  | 🟡 |
| Anqa | beast | ④ | Giant mythical bird of Arabian lore, later linked to the phoenix. | mountain, sky |  | – |
| Zahhak (Aždahā) | monster | ④ | Tyrant with serpents on his shoulders in the Shahnameh. | mountain |  | – |
| Rakhsh | beast | ④ | Rostam's loyal, lion-slaying horse. | desert, highland |  | – |
| Ahura Mazda | deity | ④ | Wise Lord of Zoroastrianism, creator and opposed to Angra Mainyu. | sky |  | 🟡 |
| Angra Mainyu (Ahriman) | deity | ④ | Destructive spirit of Zoroastrian dualism, source of evil and lies. | underworld |  | 🟡 |
| Mithra | deity | ④ | Iranian god of oaths and light, the root of the Roman Mithras. | sky |  | 🟡 |
| Div-e Sepid | monster | ⑤ | White Demon of Mazandaran slain by Rostam in the Shahnameh. | mountain, cave |  | – |
| Si'lat | monster | ⑤ | Cunning female ghoul-like demon of Arabian folklore. | desert |  | – |
| Qutrub | monster | ⑤ | Night-prowling, shape-changing desert ghoul. | desert |  | – |
| Nasnas | monster | ⑤ | Half-man creature hopping on a single leg, in Arabian lore. | desert |  | – |
| Anahita | deity | ⑤ | Iranian goddess of rivers, fertility and war. | river |  | 🟡 |
| Verethragna | deity | ⑤ | Avestan god of victory who appears as a boar, ram or falcon among other forms. | highland |  | 🟡 |

## Mesopotamian

New. Mesopotamian religion is no longer practised; gods appear with 🟢 flags next to demons, monsters and guardian creatures.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Lion (ur) | animal | ① | Lion of Babylon, royal beast, depicted in hunting reliefs. | desert, meadow |  | – |
| Lamassu | construct | ③ | Winged bull or lion with a human head, carved as a palace gate guardian. | city, ruins |  | – |
| Mušḫuššu | monster | ③ | Scaled, horned serpent-dragon with lion forelimbs and bird hind legs. | city, ruins |  | – |
| Anzû | monster | ③ | Lion-headed eagle who stole the Tablet of Destinies. | sky, mountain |  | – |
| Humbaba (Huwawa) | monster | ③ | Fearsome guardian of the Cedar Forest slain by Gilgamesh. | forest |  | – |
| Bull of Heaven | monster | ③ | Great bull sent against Gilgamesh and Enkidu by an offended deity. | sky, city |  | – |
| Lamashtu | monster | ③ | Lion-headed demoness who attacks infants and mothers. | underworld, village |  | – |
| Pazuzu | monster | ③ | Winged king of wind demons with a canine face and scorpion tail, who drives off Lamashtu. | desert, sky |  | – |
| Aurochs (rimu) | animal | ③ | Wild bull of Mesopotamia, symbol of strength on the Ishtar Gate. | meadow, marsh |  | – |
| Marduk | deity | ③ | Patron god of Babylon who slew Tiamat and shaped the world from her body. | city |  | 🟢 |
| Ishtar (Inanna) | deity | ③ | Goddess of love and war who descended to the underworld. | city |  | 🟢 |
| Tiamat | deity-beast | ③ | Primeval saltwater dragon-mother in the Enūma Eliš. | sea |  | 🟢 |
| Ereshkigal | deity | ③ | Queen of the underworld and sister of Inanna. | underworld |  | 🟢 |
| Shedu | construct | ④ | Protective winged bull-spirit, the male counterpart of the lamassu. | city, ruins |  | – |
| Bašmu | monster | ④ | Horned, fanged, winged serpent in Sumerian and Akkadian texts. | marsh, underworld |  | – |
| Kusarikku | monster | ④ | Bull-man who supports the sun disk or guards a gate. | meadow, ruins |  | – |
| Apkallu | spirit | ④ | Sages in fish-cloaks or bird form who taught civilisation. | sea, city |  | – |
| Edimmu | undead | ④ | Restless ghost of the unburied, haunting the living. | tomb, desert |  | – |
| Gallu | monster | ④ | Underworld demons who drag souls to the netherworld. | underworld |  | – |
| Asag | monster | ④ | Sumerian demon of sickness defeated by Ninurta. | mountain, underworld |  | – |
| Euphrates softshell turtle | animal | ④ | Large river turtle of Mesopotamian waters. | river, marsh |  | – |
| Enki (Ea) | deity | ④ | God of fresh water, wisdom and craft who warned Utnapishtim of the flood. | river |  | 🟢 |
| Enlil | deity | ④ | God of wind and storm, king of the gods at Nippur. | sky |  | 🟢 |
| Anu | deity | ④ | Sky father at the head of the pantheon. | sky |  | 🟢 |
| Nergal | deity | ④ | God of plague, war and the underworld. | underworld |  | 🟢 |
| Shamash | deity | ④ | Sun god and judge of justice and law. | sky |  | 🟢 |
| Nanna (Sin) | deity | ④ | Moon god of Ur. | sky |  | 🟢 |
| Dumuzi (Tammuz) | deity | ④ | Shepherd god who spends part of the year in the underworld. | meadow |  | 🟢 |
| Adad | deity | ④ | Storm god of thunder and rain. | sky |  | 🟢 |
| Ninurta | deity | ④ | Warrior god who defeated Anzû. | mountain |  | 🟢 |
| Mušmaḫḫu | monster | ⑤ | Seven-headed serpent monster of Sumerian lore. | marsh |  | – |
| Girtablullu | monster | ⑤ | Scorpion-man guard of the gate of the sun at Mashu. | desert, mountain |  | – |
| Ugallu | monster | ⑤ | Lion-headed storm demon, a protective apotropaic spirit. | sky, ruins |  | – |
| Uridimmu | monster | ⑤ | Mad-dog man, an apotropaic guardian figure. | ruins |  | – |
| Kulullu | monster | ⑤ | Fish-man guardian of the Apsu waters. | sea, marsh |  | – |
| Namtar | spirit | ⑤ | Vizier of the underworld and bringer of plague. | underworld |  | – |
| Ninhursag | deity | ⑤ | Mother goddess of the mountains. | mountain |  | 🟢 |

## African (several traditions)

New. Traditions are named per entry. Orisha, Vodun and other deities of living traditions are included with 🟡 flags.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Lion | animal | ① | Pride predator of the African savanna. | meadow, desert |  | – |
| African elephant | animal | ① | Largest land animal, a figure of wisdom in many tales. | meadow, jungle |  | – |
| Leopard | animal | ① | Tree-climbing ambusher of forests and savanna. | forest, jungle |  | – |
| Hippopotamus | animal | ① | River-dwelling heavyweight, among Africa's most dangerous animals. | river, lake |  | – |
| Nile crocodile | animal | ① | Ambush predator of African rivers. | river, marsh |  | – |
| Gorilla | animal | ① | Giant forest ape. | jungle, forest |  | – |
| Ostrich | animal | ① | Flightless runner, the biggest living bird. | desert, meadow |  | – |
| Spotted hyena | animal | ② | Clan predator of the savanna, often a trickster in tales. | meadow, desert |  | – |
| Black rhinoceros | animal | ② | Armoured, short-sighted browser of the savanna. | meadow |  | – |
| Black mamba | animal | ② | Fast, highly venomous snake of the savanna. | meadow, desert |  | – |
| Fennec fox | animal | ② | Large-eared desert fox of the Sahara. | desert |  | – |
| Anansi (Akan, Ghana) | spirit | ③ | Spider trickster of folk tales who outwits larger beasts. | forest, village |  | – |
| Tokoloshe (Zulu/Xhosa) | spirit | ③ | Mischievous water sprite who torments sleepers. | river, village |  | – |
| Mokele-mbembe (Congo) | beast | ③ | River beast of the Congo Basin reported as dinosaur-like. | marsh, jungle, river |  | – |
| Secretary bird | animal | ③ | Long-legged raptor that stamps snakes to death. | meadow, desert |  | – |
| Shango | deity | ③ | Orisha of thunder and lightning, wielding a double-headed axe. | sky |  | 🟡 |
| Oshun | deity | ③ | Orisha of rivers, love and wealth. | river |  | 🟡 |
| Ogun | deity | ③ | Orisha of iron, war and the forge. | forest |  | 🟡 |
| Eshu (Elegua) | deity | ③ | Orisha of crossroads and messages, a trickster between worlds. | city |  | 🟡 |
| Mami Wata | deity | ③ | Water spirit worshipped from West to Central Africa and the diaspora, often with a snake. | river, coast |  | 🟡 |
| Baron Samedi | deity | ③ | Lwa of the dead in Haitian Vodou, dressed in top hat and skull face. | tomb |  | 🟡 |
| Sasabonsam (Akan, Ghana) | monster | ④ | Forest vampire-like creature with iron teeth and hooked legs who sits in trees. | forest |  | – |
| Impundulu (Zulu/Xhosa) | monster | ④ | Lightning bird, a witch's familiar that brings storms. | sky, highland |  | – |
| Inkanyamba (Zulu) | monster | ④ | Giant serpent-like storm creature of KwaZulu-Natal waterfalls. | river, sky |  | – |
| Grootslang (South Africa) | monster | ④ | Giant elephant-headed serpent in the Richtersveld cave legend. | cave, mountain |  | – |
| Ninki Nanka (West Africa) | monster | ④ | Giant dragon-like swamp reptile of the Gambia and Guinea region. | marsh, river |  | – |
| Popobawa (Zanzibar) | monster | ④ | One-eyed, bat-winged night spirit of Zanzibar and Pemba. | village, coast |  | – |
| Mngwa (Swahili coast) | beast | ④ | Giant grey striped cat said to haunt Tanzania's coast. | forest, coast |  | – |
| Olodumare (Olorun) | deity | ④ | Supreme being of the Yoruba, source of àṣẹ. | sky |  | 🟡 |
| Yemoja | deity | ④ | Orisha mother of waters. | river, sea |  | 🟡 |
| Obatala | deity | ④ | Orisha who shaped human bodies, linked to purity. | sky |  | 🟡 |
| Oya | deity | ④ | Orisha of storms, winds and the cemetery gate. | sky |  | 🟡 |
| Papa Legba | deity | ④ | Lwa who opens the gate to the spirits in Vodou and Fon religion. | village |  | 🟡 |
| Nyame | deity | ④ | Akan sky god, supreme being linked to Anansi's tales. | sky |  | 🟡 |
| Bida (Soninke, Wagadu) | monster | ⑤ | Great serpent of the Wagadu legend demanding a maiden. | river |  | – |
| Kishi (Mbundu, Angola) | monster | ⑤ | Two-faced demon with a handsome face and a hyena's head on the back. | village, forest |  | – |
| Kalanoro (Madagascar) | spirit | ⑤ | Small hairy forest folk of Malagasy folklore. | forest, jungle |  | – |
| Mmoatia (Akan, Ghana) | spirit | ⑤ | Small forest dwarf with backward feet who steals and aids hunters. | forest |  | – |
| Orunmila | deity | ⑤ | Orisha of wisdom and divination, patron of the Ifá oracle. | village |  | 🟡 |
| Mawu-Lisa | deity | ⑤ | Fon dual deity of moon and sun, creators of the world. | sky |  | 🟡 |

## Polynesian, Māori and Hawaiian

New. Folklore beings and animals plus Māori and Hawaiian gods with 🟡 flags; ʻaumakua ancestral guardians and tiki are left out.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Humpback whale | animal | ① | Great migratory singer of Pacific waters. | sea |  | – |
| Green sea turtle (honu) | animal | ① | Long-lived reef grazer, widely loved across Polynesia. | coast, sea |  | – |
| Kiwi | animal | ② | Flightless, nocturnal ground bird and national symbol. | forest |  | – |
| Hammerhead shark | animal | ② | Predator of tropical reefs, in Pacific seafaring lore. | sea, coast |  | – |
| Taniwha (Māori) | monster | ③ | Water or cave-dwelling creature that guards or menaces a tribe's river, lake or coast. | river, lake, coast |  | – |
| Menehune (Hawaiian) | spirit | ③ | Small, skilled builders who work only at night, in Hawaiian folklore. | forest, village |  | – |
| Moa (Māori) | animal | ③ | Giant flightless bird of New Zealand, hunted to extinction. | forest, highland |  | – |
| Tuatara | animal | ③ | Ancient lizard-like reptile of New Zealand's islands. | island, coast |  | – |
| Coconut crab | animal | ③ | Giant land crab that climbs palms and cracks coconuts. | island, coast |  | – |
| Māui | deity | ③ | Trickster demigod who fished up islands, snared the sun and stole fire. | sea, island |  | 🟡 |
| Pele | deity | ③ | Hawaiian goddess of volcanoes and lava, still revered at Kīlauea. | volcano |  | 🟡 |
| Patupaiarehe (Māori) | spirit | ④ | Pale, fair-haired fairy folk of misty hills and forests. | mountain, forest |  | – |
| Pouākai (Māori) | monster | ④ | Giant man-eating bird of legend, often linked to the extinct Haast's eagle. | mountain, sky |  | – |
| Te Wheke-a-Muturangi (Māori) | monster | ④ | Giant octopus pursued by the navigator Kupe across the sea. | sea |  | – |
| Marakihau (Māori) | monster | ④ | Sea being with a tubular tongue that sucks canoes under. | sea, coast |  | – |
| Maero (Māori) | monster | ④ | Wild, long-armed giants of the mountain forests. | forest, mountain |  | – |
| Hōkioi (Māori) | monster | ④ | Giant bird of ill omen whose cry was heard but rarely seen. | sky, highland |  | – |
| Kōtuku (Māori) | animal | ④ | White heron seen as a rare and treasured visitor. | marsh, coast |  | – |
| Pūkeko | animal | ④ | Blue swamphen of New Zealand wetlands. | marsh |  | – |
| Tūī | animal | ④ | Songbird with white throat tufts and the ability to mimic. | forest |  | – |
| Frigatebird | animal | ④ | Seabird used by navigators to find land. | sea, sky |  | – |
| Tāne | deity | ④ | Māori atua of forests and birds who separated sky from earth. | forest |  | 🟡 |
| Tangaroa | deity | ④ | Atua of the sea and fish, known across Polynesia. | sea |  | 🟡 |
| Tāwhirimātea | deity | ④ | Māori atua of winds and storms. | sky |  | 🟡 |
| Rūaumoko | deity | ④ | Māori atua of earthquakes and volcanoes, unborn child of Papa. | volcano |  | 🟡 |
| Papatūānuku | deity | ④ | Māori earth mother, wife of Ranginui. | meadow |  | 🟡 |
| Ranginui | deity | ④ | Māori sky father. | sky |  | 🟡 |
| Hine-nui-te-pō | deity | ④ | Māori goddess of death, whom Māui tried to defeat. | underworld |  | 🟡 |
| Kāne | deity | ④ | Hawaiian creator god of fresh water and sunlight. | island |  | 🟡 |
| Kū | deity | ④ | Hawaiian war god, one of the four great gods. | island |  | 🟡 |
| Lono | deity | ④ | Hawaiian god of rain, music and the Makahiki. | island |  | 🟡 |
| Kanaloa | deity | ④ | Hawaiian god linked to the ocean and the deep. | sea |  | 🟡 |
| Ponaturi (Māori) | monster | ⑤ | Sea goblins who live underwater by night and are killed by daylight. | coast, sea |  | – |
| Hiʻiaka | deity | ⑤ | Hawaiian goddess of dance and healing, favourite sister of Pele. | coast |  | 🟡 |

## Inca and Andean

New. Folklore creatures and animals plus Andean gods with 🟡 flags (Pachamama and the Apus are still honoured).

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Puma | animal | ① | Mountain cat; Cusco was said to be laid out in its shape. | highland, mountain |  | – |
| Llama | animal | ① | Pack animal of the high Andes. | highland |  | – |
| Alpaca | animal | ① | Wool-bearing camelid bred in the Andes. | highland, meadow |  | – |
| Guinea pig (cuy) | animal | ① | Domesticated rodent raised in Andean homes since ancient times. | village, highland |  | – |
| Andean condor | animal | ② | Giant vulture of the Andes with a three-metre wingspan. | mountain, sky |  | – |
| Spectacled bear | animal | ② | South America's only bear, with pale rings around its eyes. | forest, mountain |  | – |
| Vicuña | animal | ③ | Wild, fine-wool camelid of the high plateaus. | highland |  | – |
| Andean cock-of-the-rock | animal | ③ | Bright-red cloud-forest bird with elaborate lek displays. | forest, jungle |  | – |
| Nazca hummingbird | animal | ③ | Giant desert line drawing, among the Nazca geoglyphs. | desert, ruins |  | – |
| Nazca spider | animal | ③ | Nazca desert geoglyph of an arachnid. | desert, ruins |  | – |
| Viracocha | deity | ③ | Creator god of the Andes, a wanderer who rose from Lake Titicaca. | lake |  | 🟡 |
| Inti | deity | ③ | Sun god, divine ancestor of the Sapa Inca. | sky |  | 🟡 |
| Pachamama | deity | ③ | Earth mother still honoured with offerings across the Andes. | highland |  | 🟡 |
| Yacumama | monster | ④ | Giant water serpent mother of the Amazon-Andes rivers. | river, jungle |  | – |
| Sachamama | monster | ④ | Giant, moss-covered tree-serpent of the Amazonian forest. | jungle, forest |  | – |
| Chullachaqui | spirit | ④ | Shape-shifting forest guardian with one odd foot. | jungle, forest |  | – |
| Supay | monster | ④ | Underworld spirit from the Ukhu Pacha, later cast as a devil under colonial rule. | underworld, mountain |  | – |
| Andean fox (atoq) | animal | ④ | Trickster of Andean folktales, with a grey-red coat. | highland, canyon |  | – |
| Viscacha | animal | ④ | Rabbit-like rock-dweller of high Andean cliffs. | mountain, highland |  | – |
| Mama Quilla | deity | ④ | Moon goddess, wife of Inti. | sky |  | 🟡 |
| Illapa | deity | ④ | Thunder and weather god who strikes from a sling. | sky |  | 🟡 |
| Runamula | monster | ⑤ | Woman-turned-mule at night, with flame at the tail, in Peruvian folklore. | village, jungle |  | – |
| Jarjacha | monster | ⑤ | Llama-headed ghost of people who broke family taboos, in Quechua folklore. | highland, village |  | – |
| Condenado | undead | ⑤ | Damned soul that wanders Andean mountains after death. | mountain, highland |  | – |
| Tunche | spirit | ⑤ | Whistling forest spirit of the Peruvian Amazon. | jungle |  | – |
| Mama Cocha | deity | ⑤ | Sea goddess of the Inca. | sea |  | 🟡 |
| Pariacaca | deity | ⑤ | Huarochirí mountain god who appears as falcons and storms. | mountain |  | 🟡 |
| Apus | deity | ⑤ | Mountain lords of the Andes who receive offerings. | mountain |  | 🟡 |

## Southeast Asian (Philippines, Thailand, Malay world, Indonesia, Vietnam)

New. Country in brackets. A few Balinese, Javanese and Tagalog deities are included with 🟡 flags; Buddha images are left out.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Orangutan | animal | ① | Red-haired great ape of Borneo and Sumatra. | jungle, forest |  | – |
| Tarsier (PH) | animal | ② | Tiny large-eyed primate of Bohol. | forest |  | – |
| Naga (TH) | monster | ② | Great serpent of Mekong folklore, guarding river treasures. | river, underworld |  | 🟡 |
| Komodo dragon (ID) | animal | ② | World's largest lizard, from the Lesser Sunda Islands. | island, coast |  | – |
| Aswang (PH) | monster | ③ | Shape-shifting ghoul and vampire-witch of the Visayas that preys on the sick and unborn. | village, forest |  | – |
| Manananggal (PH) | monster | ③ | Woman whose upper body detaches with wings to hunt at night. | village, sky |  | – |
| Tikbalang (PH) | monster | ③ | Horse-headed, long-limbed trickster that misleads travellers in the mountains. | forest, mountain |  | – |
| Kapre (PH) | monster | ③ | Tall, hairy tree giant who smokes a huge cigar. | forest |  | – |
| Philippine eagle (PH) | animal | ③ | Giant monkey-eating eagle of the Philippines' forests. | forest, sky |  | – |
| Pontianak (MY/ID) | undead | ③ | Long-haired woman ghost with a fragrant frangipani smell who kills men. | village, forest |  | – |
| Pocong (ID) | undead | ③ | Hopping corpse wrapped in a white burial shroud. | village, tomb |  | – |
| Kuntilanak (ID) | undead | ③ | Female spirit in white with long hair, haunting banana trees. | village, forest |  | – |
| Javan rhinoceros | animal | ③ | Critically endangered rhino of Ujung Kulon. | jungle |  | – |
| Rồng (VN) | beast | ③ | Vietnamese dragon, a water and rain-bringing creature. | river, sea, sky |  | – |
| Nyai Roro Kidul | deity | ③ | Javanese Queen of the Southern Sea, venerated along the coast. | sea |  | 🟡 |
| Barong | deity-beast | ③ | Balinese lion-like guardian spirit, foe of Rangda. | forest |  | 🟡 |
| Rangda | deity | ③ | Balinese demon queen of witches, rival of Barong. | forest |  | 🟡 |
| Tiyanak (PH) | monster | ④ | Infant-like creature that cries to lure travellers into the forest. | forest, village |  | – |
| Duwende (PH) | spirit | ④ | Small spirit living in mounds and houses, kind or vindictive. | village, forest |  | – |
| Bakunawa (PH) | monster | ④ | Moon-eating sea serpent of Visayan lore, causing eclipses. | sea, sky |  | – |
| Sarimanok (PH) | beast | ④ | Mythical rooster of the Maranao with vivid plumage and a fish in its beak. | village, sky |  | – |
| Phi Krasue (TH) | undead | ④ | Floating woman's head trailing entrails with a glowing light. | village, forest |  | – |
| Nang Tani (TH) | spirit | ④ | Female banana-tree spirit, a ghost of old trees. | forest |  | – |
| Mae Nak (TH) | undead | ④ | Ghost wife of Phra Khanong who waits for her husband. | river, village |  | – |
| Kinnari (TH) | spirit | ④ | Half-bird, half-woman dancer of Himavanta forest. | forest, sky |  | – |
| Hongsa (TH) | beast | ④ | Mythical swan or goose of Himavanta, a motif of royal barges. | lake, sky |  | – |
| Singha (TH) | beast | ④ | Lion guardian beast of Thai temples. | city |  | – |
| Yak (TH) | monster | ④ | Giant guardians with fanged faces at Wat Phra Kaew. | city |  | – |
| Penanggalan (MY) | monster | ④ | Flying head trailing entrails, preying on mothers and newborns. | village, forest |  | – |
| Orang Bunian (MY/ID) | spirit | ④ | Invisible forest folk who live in a parallel world. | forest, mountain |  | – |
| Toyol (MY) | spirit | ④ | Child-like familiar made to steal for its master. | village |  | – |
| Genderuwo (ID) | monster | ④ | Hairy, tall ape-like spirit of Javanese lore that lives in old trees. | forest |  | – |
| Leyak (ID, Bali) | monster | ④ | Flying head with entrails in Balinese folklore, a black-magic practitioner. | village, forest |  | – |
| Tuyul (ID) | spirit | ④ | Small child-like thief familiar of Indonesian folklore. | village |  | – |
| Hồ ly tinh (VN) | spirit | ④ | Fox spirit that takes female human form to deceive. | forest, village |  | – |
| Dewi Sri | deity | ④ | Javanese and Balinese rice goddess. | meadow |  | 🟡 |
| Bathala | deity | ④ | Supreme being of pre-colonial Tagalog belief. | sky |  | 🟡 |
| Mayari | deity | ④ | Tagalog moon goddess recorded by Spanish chroniclers. | sky |  | 🟡 |
| Apolaki | deity | ④ | Tagalog sun and war god in recorded folk tradition. | sky |  | 🟡 |
| Santelmo (PH) | spirit | ⑤ | Fireball spirit seen over cemeteries, similar to St Elmo's fire. | coast, tomb |  | – |
| Berberoka (PH) | monster | ⑤ | Giant water-sucking creature of Philippine rivers that traps people. | river, marsh |  | – |
| Bungisngis (PH) | monster | ⑤ | One-eyed, laughing giant of Philippine folk tales. | forest, mountain |  | – |
| Phi Pop (TH) | undead | ⑤ | Hungry ghost that possesses people and eats raw flesh. | village |  | – |
| Hantu Air (MY) | spirit | ⑤ | Water ghost that drowns swimmers in rivers and swamps. | river, marsh |  | – |
| Buto Ijo (ID) | monster | ⑤ | Green giant ogre from Javanese folk tales. | forest |  | – |
| Wewe Gombel (ID) | spirit | ⑤ | Elderly woman spirit that takes neglected children. | village, forest |  | – |
| Thần Kim Quy (VN) | beast | ⑤ | Golden Turtle that lends its claw for a magic crossbow in the Cổ Loa legend. | lake, river |  | – |
| Thuồng luồng (VN) | monster | ⑤ | Giant water serpent that drowns people in rivers and swamps. | river, marsh |  | – |
| Ma da (VN) | spirit | ⑤ | Water ghost that pulls bathers into rivers. | river, lake |  | – |
| Ma lai (VN) | monster | ⑤ | Flying female head that trails organs and feeds at night. | village, forest |  | – |

## Mongol, Turkic and Siberian

New. Tengri, Umay, Erlik and Ülgen are included with 🟡 flags; shamanic ongon figures are left out.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Mammoth | animal | ① | Giant woolly elephant of the Ice Age steppe and Siberian tales. | ice, steppe |  | – |
| Bactrian camel | animal | ② | Two-humped caravan beast of cold deserts. | desert, steppe |  | – |
| Snow leopard | animal | ② | Mountain cat of Central Asia. | mountain, ice |  | – |
| Golden eagle | animal | ② | Hunting bird of Mongol and Kazakh falconers. | steppe, sky |  | – |
| Yak | animal | ② | Shaggy highland ox of the Himalayas and Mongolian mountains. | highland, ice |  | – |
| Siberian tiger | animal | ② | Great cat of the Russian Far East forest. | forest, ice |  | – |
| Bozkurt (Turkic) | beast | ③ | Grey Wolf of Turkic origin legends who guides the people. | steppe, mountain |  | 🟡 |
| Przewalski's horse (takhi) | animal | ③ | Wild horse of the Mongolian steppe, saved from extinction. | steppe |  | – |
| Saiga antelope | animal | ③ | Large-nosed antelope of the dry steppe. | steppe |  | – |
| Tengri | deity | ③ | Eternal Blue Sky of Turkic and Mongol religion, revived in Tengrism. | sky |  | 🟡 |
| Almas (Mongol) | beast | ④ | Wild, hairy man-like creature of the Altai and Gobi. | mountain, desert |  | – |
| Khan Garid (Mongol) | beast | ④ | Mongol Garuda-like giant bird. | sky, mountain |  | – |
| Asena (Turkic) | beast | ④ | She-wolf mother of the Göktürk ruling clan in the Chinese chronicles. | steppe, mountain |  | 🟡 |
| Tulpar (Turkic) | beast | ④ | Winged horse of Kazakh, Turkic and Central Asian folklore. | steppe, sky |  | – |
| Shurale (Tatar, Bashkir) | spirit | ④ | Horned forest spirit that tickles travellers to death. | forest |  | – |
| Albasty (Turkic) | spirit | ④ | Childbirth demon in Central Asian lore, an old woman with matted hair. | village, steppe |  | – |
| Ubyr (Tatar) | undead | ④ | Vampire-like witch that drinks blood or takes the form of a night creature. | village, forest |  | – |
| Zilant (Tatar) | monster | ④ | Winged dragon-serpent of Kazan, a city emblem. | city, sky |  | – |
| Tepegöz (Oghuz) | monster | ④ | One-eyed man-eating giant in the Book of Dede Korkut. | cave, mountain |  | – |
| Umay | deity | ④ | Turkic mother goddess who protects children. | sky |  | 🟡 |
| Erlik | deity | ④ | Lord of the underworld in Altaic shamanism. | underworld |  | 🟡 |
| Lus (Mongol) | monster | ⑤ | Water-dragon spirits that rule rivers and springs. | river, lake |  | – |
| Yer-su (Turkic) | spirit | ⑤ | Land and water spirits invoked in Turkic folklore. | steppe, river |  | – |
| Chuchunaa (Yakut) | beast | ⑤ | Hairy, tall wild man of Siberian forests and a figure of fear. | forest, ice |  | – |
| Abaasy (Yakut) | monster | ⑤ | Spirits of illness and evil in Sakha folklore. | ice, forest |  | – |
| Mangus (Evenki) | monster | ⑤ | Many-headed monster of Siberian epics. | forest, ice |  | – |
| Ülgen | deity | ⑤ | Altaic creator and sky god, opposed to Erlik. | sky |  | 🟡 |

## Medieval European bestiary and heraldry

New. Creatures from medieval bestiaries, romances and coats of arms. Biblical figures and saints are left out.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Unicorn | beast | ① | One-horned creature only tamed by a maiden; its horn purifies water. | forest, meadow |  | – |
| Dragon (Saint George's) | monster | ① | Western dragon with wings and fire, as in dragon-slayer tales. | mountain, cave |  | – |
| Phoenix | beast | ① | Bird that burns and is reborn, in the bestiaries. | sky, desert |  | – |
| Gargoyle | construct | ① | Stone rainwater spout carved as a monster, protector of cathedrals. | city, ruins |  | – |
| Basilisk | monster | ② | Serpent king whose gaze or breath kills; hatched from a cock's egg. | cave, ruins |  | – |
| Manticore | monster | ② | Man-faced lion with porcupine quills and a scorpion tail. | desert, jungle |  | – |
| Golem | construct | ② | Clay figure animated by letters or a word, in Prague folklore. | city, ruins |  | – |
| Hippogriff | beast | ② | Eagle-horse hybrid in Ariosto's Orlando Furioso. | sky, highland |  | – |
| Heraldic lion rampant | animal | ② | Lion standing on hind legs, the commonest beast in heraldry. | city, highland |  | – |
| Cockatrice | monster | ③ | Rooster-serpent hybrid whose stare turns to stone. | ruins, cave |  | – |
| Wyvern | monster | ③ | Two-legged winged dragon, common in heraldry. | mountain, sky |  | – |
| Melusine | spirit | ③ | Water spirit who is a serpent from the waist down, ancestress of a French house. | lake, river |  | – |
| Salamander | beast | ③ | Fire-dwelling lizard that cannot be burned. | volcano |  | – |
| Cynocephalus | monster | ③ | Dog-headed man from medieval travel writing. | desert |  | – |
| Loup-garou | monster | ③ | French werewolf of medieval lore. | forest, village |  | – |
| Reynard the Fox | beast | ③ | Cunning fox of the medieval Reynard cycle. | forest, village |  | – |
| White hart | animal | ③ | White stag, Richard II's badge and a romance quarry. | forest |  | – |
| Double-headed eagle | animal | ③ | Heraldic eagle of the Holy Roman and Byzantine empires. | sky, city |  | – |
| Amphisbaena | monster | ④ | Snake with a head at each end. | desert, ruins |  | – |
| Pelican in her piety | beast | ④ | Bird that wounds her breast to feed her young. | lake, coast |  | – |
| Caladrius | beast | ④ | White bird that foretells whether a sick man will recover. | sky, city |  | – |
| Bonnacon | beast | ④ | Bull-like beast that sprays burning dung in retreat. | meadow, highland |  | – |
| Leucrota | beast | ④ | Swift, badger-lion-like beast with a hyena's voice. | meadow |  | – |
| Yale | beast | ④ | Heraldic goat-antelope with swivelling horns and tusks. | meadow |  | – |
| Blemmyae | monster | ④ | Headless people with faces on the chest in Pliny and Mandeville. | desert, jungle |  | – |
| Sciapod | monster | ④ | One-legged being that shades itself with its giant foot. | desert |  | – |
| Tarasque | monster | ④ | Provençal dragon-like beast with a turtle shell and a lion's body. | river, marsh |  | – |
| Barghest | beast | ④ | Black dog, a ghostly omen of death in northern England. | highland, village |  | – |
| Wodewose | monster | ④ | Hairy wild man of the woods in medieval art and heraldry. | forest |  | – |
| Questing Beast | monster | ④ | Serpent-headed, leopard-bodied creature hunted in Arthurian tales. | forest |  | – |

## Finnish, Sámi and Baltic

New. Folklore beings, Kalevala creatures and animals plus a few gods (Finnish 🟢, Baltic 🟡).

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Reindeer | animal | ① | Herded animal of Lapland and the Nordic north. | ice, highland |  | – |
| Brown bear | animal | ① | Forest lord; revered in old Finnish bear rites. | forest |  | – |
| Eurasian elk (moose) | animal | ② | Giant deer of the boreal forest. | forest, marsh |  | – |
| Tonttu (Finnish) | spirit | ③ | House spirit protecting farm and family. | village |  | – |
| Whooper swan | animal | ③ | Finland's national bird, a white swan of northern lakes. | lake, marsh |  | – |
| Wolverine | animal | ③ | Fierce mustelid of the northern taiga. | forest, ice |  | – |
| Great grey owl | animal | ③ | Giant silent owl of the boreal forest. | forest |  | – |
| Ukko | deity | ③ | Finnish sky and thunder god, invoked with a hammer. | sky |  | 🟢 |
| Väinämöinen | deity | ③ | Old sage and singer of the Kalevala with a magic kantele. | island |  | 🟢 |
| Hiisi (Finnish) | monster | ④ | Forest demon or sacred grove spirit that became a devil in folklore. | forest, mountain |  | – |
| Hiiden hirvi (Finnish) | beast | ④ | Demonic elk of the Kalevala that Lemminkäinen hunts on skis. | forest, ice |  | – |
| Tuonen joutsen (Finnish) | beast | ④ | Black swan of Tuonela's river, in the Lemminkäinen story. | river, underworld |  | – |
| Iku-Turso (Finnish) | monster | ④ | Sea monster of the Kalevala, a huge octopus-like beast. | sea |  | – |
| Louhi (Finnish) | spirit | ④ | Witch-queen of Pohjola, shape-shifter and sampo-keeper. | ice |  | – |
| Näkki (Finnish) | spirit | ④ | Water spirit lurking at lake shores to pull children under. | lake |  | – |
| Peikko (Finnish) | monster | ④ | Troll-like forest monster. | forest, mountain |  | – |
| Kratti (Finnish) | construct | ④ | Straw-and-twig servant made to steal for its master. | village, forest |  | – |
| Stállu (Sámi) | monster | ④ | Cunning giant ogre of Sámi folk tales who dupes people. | mountain, ice |  | – |
| Aitvaras (Lithuanian) | spirit | ④ | Flying household dragon or rooster that brings wealth to its master. | village, sky |  | – |
| Vilkacis (Latvian) | monster | ④ | Werewolf of Latvian folklore. | forest |  | – |
| Kratt (Estonian) | construct | ④ | Estonian treasure-carrying servant made of hay or old household items. | village |  | – |
| Velnias (Lithuanian) | monster | ④ | Devil of Lithuanian folk tales, prone to being tricked. | forest, marsh |  | – |
| Tapio | deity | ④ | Finnish forest lord. | forest |  | 🟢 |
| Ilmatar | deity | ④ | Air maiden of the Kalevala whose egg-fragments form the world. | sky |  | 🟢 |
| Perkūnas | deity | ④ | Baltic thunder god revived in Lithuanian Romuva. | sky |  | 🟡 |
| Saulė | deity | ④ | Baltic sun goddess. | sky |  | 🟡 |
| Menninkäinen (Finnish) | spirit | ⑤ | Underground small folk of Finnish lore. | forest, cave |  | – |
| Kalma (Finnish) | spirit | ⑤ | Spirit of the grave that haunts death places. | tomb, marsh |  | – |
| Gufihtar (Sámi) | spirit | ⑤ | Underground folk of Sámi tales with their own herds. | highland, cave |  | – |
| Kaukas (Lithuanian) | spirit | ⑤ | Small helpful household sprite. | village |  | – |
| Raganos (Lithuanian) | spirit | ⑤ | Witches of Lithuanian folklore who brew harm. | forest, village |  | – |
| Žaltys (Lithuanian) | animal | ⑤ | Grass snake kept in homes as a bringer of luck. | village, meadow |  | – |
| Eglė the Queen of Serpents (Lithuanian) | spirit | ⑤ | Maiden who marries a sea-serpent king in a folk tale. | sea, forest |  | – |
| Pūķis (Latvian) | spirit | ⑤ | Fiery house dragon that carries gold to its master. | village, sky |  | – |
| Laima | deity | ⑤ | Baltic goddess of fate and childbirth. | village |  | 🟡 |

## Modern cryptids

New. Reported or legendary creatures of modern folklore. Nothing here is a sacred figure.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Bigfoot (Sasquatch) | beast | ① | Tall ape-like biped reported in the forests of the Pacific Northwest. | forest, mountain |  | – |
| Yeti | beast | ① | Himalayan snow-dwelling ape-man. | ice, mountain |  | – |
| Loch Ness Monster (Nessie) | monster | ① | Long-necked lake creature reported in Loch Ness since 1933. | lake |  | – |
| Chupacabra | monster | ② | Livestock-draining creature first reported in Puerto Rico in 1995. | desert, village |  | – |
| Mothman | monster | ② | Winged red-eyed humanoid seen near Point Pleasant, West Virginia, in 1966-67. | sky, village |  | – |
| Jersey Devil | monster | ③ | Winged, hoofed creature of the New Jersey Pine Barrens. | forest |  | – |
| Champ | monster | ③ | Lake Champlain serpent. | lake |  | – |
| Mongolian Death Worm | monster | ③ | Red sand-dwelling worm that spits acid or shocks, in the Gobi. | desert |  | – |
| Black Shuck | beast | ③ | Huge black dog of East Anglian folklore, a death omen. | coast, village |  | – |
| Jackalope | beast | ③ | Antlered jackrabbit of American West humour, from a 1930s taxidermy hoax. | desert, meadow |  | – |
| Beast of Gévaudan | monster | ③ | Wolf-like killer of 1760s France that attacked many people. | forest, highland |  | – |
| Thylacine survivals | beast | ③ | Reported surviving Tasmanian tiger, a real extinct marsupial. | forest, highland |  | – |
| Ogopogo | monster | ④ | Serpentine lake creature of Okanagan Lake in British Columbia (modern sightings). | lake |  | – |
| Skunk Ape | beast | ④ | Foul-smelling ape-man of the Florida swamps. | marsh |  | – |
| Flatwoods Monster | monster | ④ | Tall, hooded alien-like figure reported in West Virginia in 1952. | forest, highland |  | – |
| Dover Demon | monster | ④ | Orange, large-headed creature sighted in Massachusetts in 1977. | forest |  | – |
| Orang Pendek | beast | ④ | Short, hairy ape-man reported in Sumatran forests. | jungle |  | – |
| Ahool | beast | ④ | Giant bat reported in Java. | jungle, sky |  | – |
| Ropen | monster | ④ | Glowing flying creature reported in Papua New Guinea. | sky, jungle |  | – |
| Kongamato | monster | ④ | Pterosaur-like flying creature reported in Zambia. | marsh, river |  | – |
| Mapinguari | monster | ④ | Giant sloth-like beast of the Amazon with a mouth on the belly. | jungle |  | – |
| Beast of Bodmin Moor | beast | ④ | Large black cat reported on Cornwall's moors. | highland, forest |  | – |
| Owlman | monster | ④ | Winged owl-like humanoid reported in Cornwall in 1976. | forest, village |  | – |
| Hodag | monster | ④ | Wisconsin folklore beast with horns and spines, from a 1896 hoax. | forest |  | – |
| Tatzelwurm | monster | ④ | Stubby, lizard-like alpine creature of folklore. | mountain, highland |  | – |
| Cadborosaurus | monster | ④ | Sea serpent reported off British Columbia. | sea, coast |  | – |
| Fresno Nightcrawler | monster | ④ | White stilt-legged figure on trail camera footage from 2007. | city, meadow |  | – |
| Altamaha-ha | monster | ⑤ | River serpent reported in Georgia's Altamaha River. | river, marsh |  | – |

## Named sets

Well-known groups drawn from the cultures above and from a few outside them. Every set table uses the same columns as the culture tables, sorted by familiarity (the 28 Lunar Mansions keep their traditional order inside each quadrant). Repeated entries keep their culture-table art mark and flag; other rows exist only in the set. Flags follow the tradition defaults of the research section.

### Chinese zodiac (12 animals)

Source: The twelve animals of the Chinese zodiac, in the order of the Jade Emperor's race (folk tradition, in use since at least the Han dynasty).

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Dragon (Chen) | beast | ① | Fifth sign, the only mythical animal of the twelve; a rain-bringing, luck-bearing sovereign. | sky, river |  | – |
| Tiger (Yin) | animal | ① | Third sign, king of beasts, courageous and fierce. | forest, mountain |  | – |
| Rat (Zi) | animal | ① | First sign, which won the race by riding the ox and jumping ahead at the end. | village |  | – |
| Snake (Si) | animal | ① | Sixth sign, subtle and wise. | forest, desert |  | – |
| Horse (Wu) | animal | ① | Seventh sign, free-spirited and fast. | steppe, meadow |  | – |
| Dog (Xu) | animal | ① | Eleventh sign, loyal and watchful. | village |  | – |
| Monkey (Shen) | animal | ① | Ninth sign, clever and playful. | forest, jungle |  | – |
| Pig (Hai) | animal | ① | Twelfth sign, generous and easygoing. | village, forest |  | – |
| Ox (Chou) | animal | ① | Second sign, diligent and steady; carried the rat across the river. | meadow |  | – |
| Rooster (You) | animal | ① | Tenth sign, proud and punctual. | village |  | – |
| Rabbit (Mao) | animal | ① | Fourth sign, gentle and quick; in some countries replaced by the cat. | meadow |  | – |
| Goat (Wei) | animal | ① | Eighth sign, calm and artistic; also rendered as sheep or ram. | highland, meadow |  | – |

### Western zodiac (12 signs)

Source: The twelve zodiac constellations of Greek and Babylonian astronomy, mostly tied to Greek myths about their star figures.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Leo (Lion) | beast | ① | Often linked to the Nemean Lion set among the stars by Zeus. | meadow |  | – |
| Scorpio (Scorpion) | animal | ① | The scorpion that stung Orion, placed in the sky by Gaia or Zeus. | desert |  | – |
| Aries (Ram) | animal | ① | The golden ram whose fleece Jason sought. | highland |  | – |
| Taurus (Bull) | animal | ① | The bull Zeus became to carry off Europa. | meadow |  | – |
| Cancer (Crab) | animal | ② | The crab that pinched Heracles during the fight with the Hydra. | coast |  | – |
| Pisces (Two Fishes) | animal | ② | Two fish tied together, said to be Aphrodite and Eros fleeing Typhon. | sea |  | – |
| Sagittarius (Archer) | beast | ② | Centaur archer, often identified with Chiron or the satyr Crotus. | forest |  | – |
| Capricorn (Sea-goat) | beast | ③ | Goat with a fish tail, tied to Pan or the Babylonian Suhurmašu. | sea |  | – |
| Virgo (Maiden) | spirit | ③ | A winged maiden holding grain, linked to Demeter or Astraea. | meadow |  | – |
| Gemini (Twins) | spirit | ③ | The twins Castor and Pollux (Dioscuri). | sky |  | – |
| Aquarius (Water-bearer) | spirit | ③ | Cupbearer of the gods, often Ganymede, pouring water. | sky |  | – |
| Libra (Scales) | construct | ③ | The scales of justice, once the claws of Scorpio; the only non-living sign. | city |  | – |

### Four Symbols (Sishen)

Source: The four guardian beasts of the four quadrants in Han-era Chinese astronomy; also Daoist temple guardians, and the elder four beasts of the 28 Lunar Mansions.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Baihu (白虎) | deity-beast | ③ | White Tiger, guardian of the West. | mountain, highland | ✕ ◆ | 🟡 |
| Xuanwu (玄武) | deity-beast | ③ | Black Tortoise entwined with a snake, guardian of the North. | river, ice | ✕ ◆ | 🟡 |
| Azure Dragon (Qinglong) | beast | ③ | Guardian of the east and spring, associated with wood. | sky, river |  | 🟡 |
| Vermilion Bird (Zhuque) | beast | ③ | Guardian of the south and summer, associated with fire. | sky, volcano |  | 🟡 |

### 28 Lunar Mansions (4 by 7)

Source: The 28 xiu are lunar stations along the ecliptic, grouped 7 per quadrant under the four guardian beasts; origin Chinese astronomy (adopted in Japan and Korea). Animal pairings follow the later Chinese xiu animals and are left out where traditions vary.

#### East: Azure Dragon

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Jiao (Horn) | spirit | ⑤ | The Horn, first mansion, containing Spica. | sky |  | – |
| Kang (Neck) | spirit | ⑤ | The Neck, stars in Virgo. | sky |  | – |
| Di (Root) | spirit | ⑤ | The Root, stars in Libra. | sky |  | – |
| Fang (Room) | spirit | ⑤ | The Room, stars in Scorpius. | sky |  | – |
| Xin (Heart) | spirit | ⑤ | The Heart, containing the star Antares. | sky |  | – |
| Wei (Tail) | spirit | ⑤ | The Tail, stars in Scorpius. | sky |  | – |
| Ji (Winnowing Basket) | spirit | ⑤ | The Winnowing Basket, last eastern mansion, in Sagittarius. | sky |  | – |

#### North: Black Tortoise

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Dou (Dipper) | spirit | ⑤ | The Dipper (Southern Dipper in Sagittarius), first northern mansion. | sky |  | – |
| Niu (Ox) | spirit | ⑤ | The Ox, stars in Capricornus. | sky |  | – |
| Nü (Girl) | spirit | ⑤ | The Girl, stars in Aquarius. | sky |  | – |
| Xu (Emptiness) | spirit | ⑤ | The Emptiness, stars in Aquarius and Equuleus. | sky |  | – |
| Wei (Rooftop) | spirit | ⑤ | The Rooftop, stars in Aquarius and Pegasus. | sky |  | – |
| Shi (Encampment) | spirit | ⑤ | The Encampment, stars of the Pegasus square. | sky |  | – |
| Bi (Wall) | spirit | ⑤ | The Wall, last northern mansion, stars in Pegasus and Andromeda. | sky |  | – |

#### West: White Tiger

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Kui (Legs) | spirit | ⑤ | The Legs, stars in Andromeda and Pisces. | sky |  | – |
| Lou (Bond) | spirit | ⑤ | The Bond, stars in Aries. | sky |  | – |
| Wei (Stomach) | spirit | ⑤ | The Stomach, stars in Aries. | sky |  | – |
| Mao (Hairy Head) | spirit | ⑤ | The Hairy Head, the Pleiades. | sky |  | – |
| Bi (Net) | spirit | ⑤ | The Net, the Hyades. | sky |  | – |
| Zi (Turtle Beak) | spirit | ⑤ | The Turtle Beak, in Orion's head. | sky |  | – |
| Shen (Three Stars) | spirit | ⑤ | The Three Stars, Orion's belt. | sky |  | – |

#### South: Vermilion Bird

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Jing (Well) | spirit | ⑤ | The Well, first southern mansion, in Gemini. | sky |  | – |
| Gui (Ghost) | spirit | ⑤ | The Ghost, the Beehive cluster in Cancer. | sky |  | – |
| Liu (Willow) | spirit | ⑤ | The Willow, stars in Hydra. | sky |  | – |
| Xing (Star) | spirit | ⑤ | The Star, containing Alphard in Hydra. | sky |  | – |
| Zhang (Extended Net) | spirit | ⑤ | The Extended Net, stars in Hydra. | sky |  | – |
| Yi (Wings) | spirit | ⑤ | The Wings, stars in Crater. | sky |  | – |
| Zhen (Chariot) | spirit | ⑤ | The Chariot, stars in Corvus. | sky |  | – |

### Four Horsemen of the Apocalypse

Source: Four riders unleashed by the first four seals in Revelation 6; their names were assigned later by tradition. Biblical figures, flagged accordingly.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Death | spirit | ① | Rider on a pale horse, followed by Hades. | ruins, underworld |  | 🟡 |
| War | spirit | ② | Rider on a red horse, given a great sword to take peace from the earth. | ruins |  | 🟡 |
| Famine | spirit | ② | Rider on a black horse holding a pair of scales. | desert |  | 🟡 |
| Conquest (Pestilence) | spirit | ③ | Rider on a white horse with a bow and a crown; later tradition names him Pestilence. | sky |  | 🟡 |

### Seven Deadly Sins as demons (Binsfeld)

Source: Peter Binsfeld's 1589 pairing of each deadly sin with a demon prince of Hell; Judeo-Christian demonology, so flagged yellow.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Satan | spirit | ① | Binsfeld's demon of wrath, the adversary of Christian tradition. | underworld |  | 🟡 |
| Lucifer | spirit | ① | Binsfeld's demon of pride, the fallen morning star. | underworld, sky |  | 🟡 |
| Beelzebub | spirit | ② | Binsfeld's demon of gluttony, Lord of Flies. | underworld |  | 🟡 |
| Asmodeus | spirit | ② | Binsfeld's demon of lust, from the Book of Tobit. | underworld |  | 🟡 |
| Leviathan | monster | ② | Binsfeld's demon of envy, the sea serpent of the Hebrew Bible. | sea |  | 🟡 |
| Mammon | spirit | ③ | Binsfeld's demon of greed, personified wealth. | city |  | 🟡 |
| Belphegor | spirit | ③ | Binsfeld's demon of sloth, a Moabite god turned demon. | underworld |  | 🟡 |

### Twelve Olympians

Source: The twelve principal gods of the Greek pantheon at Olympus; lists differ on whether Hestia or Dionysus holds the twelfth seat; Dionysus is used here and Hestia is listed under Greek deities. Hades is not an Olympian.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Zeus | deity-beast | ① | King of the gods, wielder of the thunderbolt. | sky | ○ | 🟢 |
| Poseidon | deity-beast | ① | God of the sea, earthquakes and horses. | sea | ○ ◆ | 🟢 |
| Athena | deity-beast | ① | Goddess of wisdom and war, with her owl. | city | ○ | 🟢 |
| Apollo | deity | ① | God of the sun, music, prophecy and the Pythian oracle. | sky |  | 🟢 |
| Artemis | deity | ① | Virgin huntress, goddess of the moon, wild animals and childbirth. | forest |  | 🟢 |
| Aphrodite | deity | ① | Goddess of love and beauty, born from sea foam. | coast |  | 🟢 |
| Hermes | deity | ① | Winged messenger and trickster, guide of souls and patron of travellers. | sky |  | 🟢 |
| Dionysus | deity | ① | God of wine, theatre and ecstatic revelry. | meadow |  | 🟢 |
| Hera | deity | ② | Queen of the gods, goddess of marriage, jealous wife of Zeus. | sky |  | 🟢 |
| Ares | deity | ② | God of war and bloodshed, hated by his fellow Olympians. | ruins |  | 🟢 |
| Hephaestus | deity | ② | Lame smith god who forged the weapons and automata of the gods. | volcano |  | 🟢 |
| Demeter | deity | ② | Goddess of grain and the harvest, mother of Persephone. | meadow |  | 🟢 |

### Beasts of the Twelve Labours of Heracles

Source: Creatures from the labours set by Eurystheus; the Augean stables and Hippolyta's girdle are not creature labours and are left out.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Hydra of Lerna | monster | ① | Many-headed water serpent whose heads regrow. | marsh, lake | ○ ◆ | – |
| Cerberus | monster | ① | Multi-headed hound guarding the gates of Hades. | underworld | ★ ◆ | – |
| Nemean Lion | beast | ② | Lion with an invulnerable hide killed by Heracles. | highland, cave | ○ ◆ | – |
| Stymphalian birds | monster | ③ | Man-eating birds with bronze beaks and metal feathers. | marsh, lake |  | – |
| Erymanthian Boar | beast | ③ | Giant boar of the Arcadian mountains. | highland, forest |  | – |
| Cretan Bull | beast | ③ | Raging white bull Heracles captured, sire of the Minotaur. | meadow, island |  | – |
| Ladon | monster | ③ | Hundred-headed dragon guarding the Hesperides' golden apples. | oasis |  | – |
| Ceryneian Hind | beast | ④ | Golden-horned deer sacred to Artemis that Heracles chased for a year. | forest |  | – |
| Mares of Diomedes | beast | ④ | Man-eating horses of the Thracian king that Heracles tamed. | meadow |  | – |
| Geryon's cattle | beast | ④ | Red cattle guarded by the giant Geryon and the hound Orthrus on Erytheia. | island |  | – |

### Seven Lucky Gods (Shichifukujin)

Source: Seven Japanese deities of fortune, a group popular since the Muromachi period and still honoured at New Year pilgrimages; origins are Japanese, Hindu, Buddhist and Daoist.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Ebisu (恵比寿) | deity | ③ | Fisherman god of luck and good catches, holding a sea bream. | coast, village |  | 🟡 |
| Hotei (布袋) | deity | ③ | Laughing, fat-bellied monk with a sack, based on the Chinese Budai. | village |  | 🟡 |
| Daikokuten (大黒天) | deity | ④ | God of wealth and farmers with a mallet and a rice bag, from Hindu Mahakala. | village |  | 🟡 |
| Benzaiten (弁才天) | deity | ④ | Goddess of music, eloquence and water, from Hindu Sarasvati. | lake, island |  | 🟡 |
| Bishamonten (毘沙門天) | deity | ④ | Warrior guardian of the north with a pagoda and spear, from Vaiśravaṇa. | mountain |  | 🟡 |
| Fukurokuju (福禄寿) | deity | ④ | Daoist god of happiness and long life with an elongated head. | mountain |  | 🟡 |
| Jurōjin (寿老人) | deity | ④ | Daoist god of longevity with a deer and a staff. | mountain |  | 🟡 |

### Four Heavenly Kings (Shi Tianwang)

Source: The four Buddhist guardian kings of the cardinal directions, standing at temple gates in China, Korea and Japan; flagged yellow as venerated figures.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Duowen Tianwang (Vaiśravaṇa) | deity | ③ | King of the north with a parasol, later merged with Bishamonten. | mountain |  | 🟡 |
| Zengzhang Tianwang (Virūḍhaka) | deity | ④ | King of the south with a sword, who "increases growth". | mountain |  | 🟡 |
| Guangmu Tianwang (Virūpākṣa) | deity | ④ | King of the west with a serpent or dragon, "far-seeing". | mountain |  | 🟡 |
| Chiguo Tianwang (Dhṛtarāṣṭra) | deity | ④ | King of the east with a pipa, "who upholds the realm". | mountain |  | 🟡 |

### Five Elements creatures (Wuxing)

Source: The five beasts paired with the Chinese five phases, based on the four quadrant guardians plus a central beast; the Earth beast varies between the Yellow Dragon and the Qilin.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Baihu (白虎) | deity-beast | ③ | White Tiger, guardian of the West. | mountain, highland | ✕ ◆ | 🟡 |
| Xuanwu (玄武) | deity-beast | ③ | Black Tortoise entwined with a snake, guardian of the North. | river, ice | ✕ ◆ | 🟡 |
| Azure Dragon (Qinglong) | beast | ③ | Wood and east, spring. | sky, river |  | 🟡 |
| Vermilion Bird (Zhuque) | beast | ③ | Fire and south, summer. | sky, volcano |  | 🟡 |
| Yellow Dragon (Huanglong) | beast | ④ | Earth and the centre; the Qilin is an alternative Earth beast. | sky |  | 🟡 |

### Four Benevolent Animals (Si Ling)

Source: The four spiritual creatures named in the Liji (Book of Rites): the dragon, phoenix, qilin and tortoise.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Long (龍) | beast | ① | Chinese dragon: wingless, rain- and river-bringing, with a pearl. | sky, river, sea | ✕ | – |
| Fenghuang (鳳凰) | beast | ② | "Phoenix": composite bird of virtue that appears in peaceful reigns. | sky, bamboo | ✕ ◆ | – |
| Qilin (麒麟) | beast | ② | Hooved chimera with scaled body, whose appearance is a good omen. | meadow, forest | ○ | – |
| Divine tortoise (Gui) | beast | ③ | Longevity and divination; the tortoise shell was used in oracle bones. | lake, river |  | – |

### Dragon King's Nine Sons (Longzi)

Source: The nine sons of the dragon in Ming dynasty lore (the lists vary, and Taotie is sometimes included); each decorates a particular building feature.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Chiwen (螭吻) | beast | ④ | Dragon-fish roof ornament that wards off fire. | city, sea |  | – |
| Bixi (贔屭) | beast | ④ | Dragon-headed tortoise that carries stone steles. | ruins |  | – |
| Suanni | beast | ④ | Lion-like son who loves smoke; seen on incense burners. | city |  | – |
| Bi'an | beast | ④ | Tiger-like son who loves litigation; carved on prison and court gates. | city |  | – |
| Pulao | beast | ④ | Roaring son who sits on bell handles. | sea |  | – |
| Yazi | beast | ④ | Fighter son who adorns sword hilts and weapons. | city |  | – |
| Chaofeng | beast | ⑤ | Daring son who sits on roof corners to scare evil. | city |  | – |
| Fùxì (dragon son) | beast | ⑤ | Son who loves literature; carved on stele tops. | city |  | – |
| Qiuniu | beast | ⑤ | Son who loves music; carved on zither pegs. | city |  | – |

### Four Dragon Kings (Si Hai Longwang)

Source: The four dragon rulers of the Four Seas in Chinese folk religion and the Journey to the West; honoured in coastal temples.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Ao Guang | deity | ③ | Dragon King of the Eastern Sea, whose son Ao Bing was killed by Nezha and from whose palace Sun Wukong took his staff. | sea |  | 🟡 |
| Ao Qin | deity | ⑤ | Dragon King of the Southern Sea. | sea |  | 🟡 |
| Ao Run | deity | ⑤ | Dragon King of the Western Sea. | sea |  | 🟡 |
| Ao Shun | deity | ⑤ | Dragon King of the Northern Sea. | sea |  | 🟡 |

### Four Perils of Chinese myth (Si Xiong)

Source: The Four Fiends banished by Emperor Shun in the Zuo Zhuan and later folklore: Hundun, Qiongqi, Taotie and Taowu.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Taotie (饕餮) | monster | ③ | Gluttonous maw-faced beast of Zhou bronzes. | ruins, mountain | ○ ◆ | – |
| Hundun (混沌) | monster | ④ | Faceless, shapeless being, a figure of primordial chaos. | ruins, underworld | ○ ◆ | – |
| Qiongqi (窮奇) | monster | ④ | Winged tiger (or ox) from the Classic of Mountains and Seas. | bamboo, mountain | ○ ◆ | – |
| Taowu | monster | ⑤ | Tiger-bodied fiend with a human face and long tail; the fourth peril. | mountain |  | – |

### Eight Immortals (Ba Xian)

Source: Eight legendary Daoist immortals of Chinese folk religion, shown crossing the sea each with a magic tool.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Zhongli Quan | deity | ④ | Leader of the group, with a fan that revives the dead. | mountain |  | 🟡 |
| Lü Dongbin | deity | ④ | Swordsman scholar immortal, patron of barbers. | mountain |  | 🟡 |
| Li Tieguai | deity | ④ | Iron-crutch beggar who carries a gourd of medicine. | mountain |  | 🟡 |
| He Xiangu | deity | ④ | The only woman, with a lotus blossom. | mountain |  | 🟡 |
| Lan Caihe | deity | ④ | Androgynous, flower-basket wandering singer. | village |  | 🟡 |
| Zhang Guolao | deity | ④ | Old man riding a donkey backwards, with a bamboo drum. | mountain |  | 🟡 |
| Han Xiangzi | deity | ④ | Flute-playing immortal who makes flowers bloom. | forest |  | 🟡 |
| Cao Guojiu | deity | ④ | Court official turned immortal with castanets. | city |  | 🟡 |

### Japanese Three Great Yokai (Sandai Yōkai)

Source: The most commonly cited trio of folklorist Komatsu Kazuhiko: Shuten-dōji, Tamamo-no-Mae and Ōtakemaru; other lists replace the last with Ōtengu or give oni, kappa and tengu.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Tamamo-no-Mae (玉藻前) | monster | ③ | Nine-tailed fox who posed as a courtesan of Emperor Toba and became the Sesshō-seki. | ruins, forest |  | – |
| Shuten-dōji (酒呑童子) | monster | ③ | Sake-drinking oni chief of Mount Ōe, slain by Minamoto no Raikō. | mountain |  | – |
| Ōtakemaru (大嶽丸) | monster | ④ | Oni lord of Mount Suzuka with three magic swords, slain by Sakanoue no Tamuramaro. | mountain |  | – |

### Hindu Navagraha (nine planets)

Source: The nine celestial influences of Vedic astrology (Jyotisha) worshipped in navagraha shrines in Hindu temples; living worship, flagged red.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Surya | deity | ③ | Sun god who crosses the sky in a seven-horse chariot. | sky |  | 🔴 |
| Rahu | deity | ③ | Head of a demon who swallowed the sun; the ascending lunar node and cause of eclipses. | sky |  | 🔴 |
| Chandra | deity | ④ | The moon, a pale god in a chariot. | sky |  | 🔴 |
| Shani | deity | ④ | Saturn, a dark god riding a crow or vulture, feared for hardship. | sky |  | 🔴 |
| Ketu | deity | ④ | Headless tail of the same demon; the descending node. | sky |  | 🔴 |
| Mangala | deity | ④ | Mars, red god of war. | sky |  | 🔴 |
| Brihaspati | deity | ④ | Jupiter, preceptor of the gods. | sky |  | 🔴 |
| Budha | deity | ⑤ | Mercury, son of Chandra. | sky |  | 🔴 |
| Shukra | deity | ⑤ | Venus, preceptor of the asuras. | sky |  | 🔴 |

### Dashavatara (ten avatars of Vishnu)

Source: The ten principal incarnations of Vishnu in Hindu tradition; lists vary on whether the ninth is Balarama or Buddha. Living worship, flagged red.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Krishna | deity | ③ | Avatar of Vishnu, divine cowherd and charioteer of the Bhagavad Gita. | meadow |  | 🔴 |
| Rama | deity | ③ | Avatar of Vishnu and hero of the Ramayana. | forest |  | 🔴 |
| Narasimha | deity-beast | ④ | Man-lion avatar of Vishnu who slew Hiranyakashipu. | city |  | 🔴 |
| Varaha | deity-beast | ④ | Boar avatar of Vishnu who lifted the earth from the ocean. | sea |  | 🔴 |
| Kalki | deity | ④ | Tenth avatar, the future warrior on a white horse who will end the age. | sky |  | 🔴 |
| Matsya | deity-beast | ⑤ | First avatar, the fish who saved Manu from the flood. | sea |  | 🔴 |
| Kurma | deity-beast | ⑤ | Second avatar, the tortoise who held up the churning mountain. | sea |  | 🔴 |
| Vamana | deity | ⑤ | Fifth avatar, the dwarf Brahmin who took three steps across the worlds. | sky |  | 🔴 |
| Parashurama | deity | ⑤ | Sixth avatar, the axe-wielding sage-warrior. | forest |  | 🔴 |
| Balarama | deity | ⑤ | Elder brother of Krishna, ninth avatar in some lists, with a plough. | village |  | 🔴 |

### Nine Muses

Source: The nine daughters of Zeus and Mnemosyne who inspire arts and sciences (Hesiod, Theogony).

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Calliope | deity | ③ | Muse of epic poetry, mother of Orpheus. | forest |  | 🟢 |
| Clio | deity | ④ | Muse of history. | city |  | 🟢 |
| Erato | deity | ④ | Muse of love poetry. | meadow |  | 🟢 |
| Euterpe | deity | ④ | Muse of music and lyric poetry, with a flute. | meadow |  | 🟢 |
| Melpomene | deity | ④ | Muse of tragedy. | city |  | 🟢 |
| Polyhymnia | deity | ④ | Muse of sacred song and hymns. | village |  | 🟢 |
| Terpsichore | deity | ④ | Muse of dance. | meadow |  | 🟢 |
| Thalia | deity | ④ | Muse of comedy. | meadow |  | 🟢 |
| Urania | deity | ④ | Muse of astronomy, with a globe. | sky |  | 🟢 |

### Greek triple sisters

Source: The groups of three sisters in Greek myth: the Fates, the Furies, the Gorgons and the Graeae.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Medusa | monster | ① | Gorgon with snake hair whose gaze turns people to stone. | coast, ruins | ○ ◆ | – |
| Graeae | monster | ③ | Three grey sisters sharing one eye and one tooth. | cave, coast |  | – |
| Atropos | deity | ④ | The Fate who cuts the thread of life. | city |  | 🟢 |
| Clotho | deity | ④ | The Fate who spins the thread of life. | city |  | 🟢 |
| Lachesis | deity | ④ | The Fate who measures the thread. | city |  | 🟢 |
| Alecto | deity | ④ | Fury of endless anger. | underworld |  | 🟢 |
| Megaera | deity | ④ | Fury of jealous rage. | underworld |  | 🟢 |
| Tisiphone | deity | ④ | Fury of vengeance for murder. | underworld |  | 🟢 |
| Stheno | monster | ④ | Gorgon sister of Medusa, immortal. | cave |  | – |
| Euryale | monster | ④ | Gorgon sister of Medusa, immortal. | cave |  | – |

### Offspring of Echidna and Typhon

Source: The monstrous brood of Echidna and Typhon according to Hesiod and later sources (some sources vary on individual parentage).

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Cerberus | monster | ① | Multi-headed hound guarding the gates of Hades. | underworld | ★ ◆ | – |
| Hydra of Lerna | monster | ① | Many-headed water serpent whose heads regrow. | marsh, lake | ○ ◆ | – |
| Sphinx of Thebes | monster | ① | Riddling lion-bodied monster of Thebes, a later addition to the brood. | ruins, desert |  | – |
| Chimera | monster | ② | Lion with a goat head on its back and a snake tail, breathing fire. | highland, volcano | ○ ◆ | – |
| Nemean Lion | beast | ② | Lion with an invulnerable hide killed by Heracles. | highland, cave | ○ ◆ | – |
| Ladon | monster | ③ | Hundred-headed dragon guarding the Hesperides' golden apples. | oasis |  | – |
| Orthrus | monster | ④ | Two-headed hound of Geryon, Cerberus's brother. | meadow, island |  | – |
| Caucasian Eagle | monster | ④ | Eagle that ate Prometheus's liver each day. | mountain |  | – |

### Monsters of the Odyssey

Source: Creatures and obstacles faced by Odysseus on his voyage home in Homer's Odyssey.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Siren | monster | ① | Bird-bodied singer who lures sailors onto the rocks. | coast, sea | ★ ◆ | – |
| Polyphemus | monster | ② | Cyclops son of Poseidon who trapped Odysseus's men in his cave. | cave, island |  | – |
| Scylla | monster | ② | Six-headed sea monster of the strait opposite Charybdis. | sea, coast | ○ ◆ | – |
| Charybdis | monster | ② | Whirlpool monster who swallows and spews the sea thrice daily. | sea |  | – |
| Circe | deity | ③ | Witch goddess of Aeaea who turns men into swine. | island, forest |  | 🟢 |
| Laestrygonians | monster | ④ | Giant cannibals who destroyed most of Odysseus's fleet. | coast |  | – |
| Lotus-Eaters | spirit | ④ | Island people whose lotus fruit makes visitors forget home. | island |  | – |
| Calypso | deity | ④ | Nymph who held Odysseus on Ogygia for seven years. | island |  | 🟢 |
| Cattle of Helios | beast | ④ | Sacred herd whose slaughter doomed Odysseus's crew. | island, meadow |  | 🟢 |
| Wandering Rocks (Planctae) | construct | ⑤ | Clashing cliffs that Odysseus's route avoided. | sea |  | – |

### Planets and their mythic namesakes

Source: The classical planets and the Greek or Roman gods their names come from; the two lights and Pluto are included for completeness.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Jupiter | deity | ① | King of the Roman gods, equal to Zeus, who names the largest planet. | sky |  | 🟢 |
| Mars | deity | ① | Roman god of war, equal to Ares. | sky |  | 🟢 |
| Venus | deity | ① | Roman goddess of love, equal to Aphrodite. | sky |  | 🟢 |
| Mercury | deity | ① | Roman messenger god, equal to Hermes. | sky |  | 🟢 |
| Neptune | deity | ① | Roman sea god, equal to Poseidon. | sea |  | 🟢 |
| Pluto | deity | ② | Roman lord of the dead, equal to Hades. | underworld |  | 🟢 |
| Saturn | deity | ② | Roman god of agriculture, equal to Cronus. | sky |  | 🟢 |
| Sol | deity | ③ | Roman sun god, equal to Helios. | sky |  | 🟢 |
| Luna | deity | ③ | Roman moon goddess, equal to Selene. | sky |  | 🟢 |
| Uranus | deity | ③ | Greek sky father Ouranos, the only planet with a Greek name. | sky |  | 🟢 |

### Egyptian Ennead of Heliopolis

Source: The nine gods of the Heliopolitan creation myth: Atum and his descendants down to Osiris, Isis, Seth and Nephthys.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Osiris | deity-beast | ② | Mummiform king of the underworld, god of resurrection. | underworld | ○ | 🟢 |
| Isis (Aset) | deity-beast | ② | Winged goddess of magic and motherhood. | city, sky | ★ | 🟢 |
| Set | deity-beast | ③ | God of storm and chaos with an unidentified "Set animal" head. | desert | ○ ◆ | 🟢 |
| Atum | deity | ④ | Self-created primordial god of Heliopolis, the "complete one". | sky |  | 🟢 |
| Nut | deity | ④ | Sky goddess arched over the earth, who swallows the sun each evening. | sky |  | 🟢 |
| Geb | deity | ④ | Earth god, father of Osiris, whose laughter was said to cause earthquakes. | desert |  | 🟢 |
| Nephthys | deity | ④ | Goddess of mourning, sister of Isis, with a house-and-basket crown. | tomb |  | 🟢 |
| Shu | deity | ⑤ | God of air who holds up the sky goddess Nut. | sky |  | 🟢 |
| Tefnut | deity-beast | ⑤ | Lioness-headed goddess of moisture, twin of Shu. | desert |  | 🟢 |

### Four Sons of Horus

Source: The four gods who guard the canopic jars with the organs of the dead.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Imsety | deity | ⑤ | Human-headed guardian of the liver. | tomb |  | 🟢 |
| Hapy | deity | ⑤ | Baboon-headed guardian of the lungs. | tomb |  | 🟢 |
| Duamutef | deity-beast | ⑤ | Jackal-headed guardian of the stomach. | tomb |  | 🟢 |
| Qebehsenuef | deity-beast | ⑤ | Falcon-headed guardian of the intestines. | tomb |  | 🟢 |

### The Nine Worlds of Norse cosmology

Source: The inhabitants of the nine realms of the world tree Yggdrasil, as listed in the Eddas and Snorri's Gylfaginning.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Humans (Midgard) | spirit | ① | Mankind, living in the realm between the worlds. | village |  | – |
| Jötunn | monster | ③ | Frost giant, ancient foe of gods and men. | ice, mountain | ★ ◆ | – |
| Dvergr | spirit | ③ | Dwarf smith who forges treasures within the earth. | cave, mountain | ○ ◆ | – |
| Æsir (Asgard) | deity | ③ | The warrior gods of Asgard led by Odin. | sky |  | 🟢 |
| Light elves (Alfheim) | spirit | ③ | Radiant elf folk ruled by Freyr in Alfheim. | forest |  | – |
| Níðhöggr | monster | ③ | Dragon that gnaws the roots of Yggdrasil. | underworld | ○ | – |
| Vanir (Vanaheim) | deity | ④ | The fertility gods of Vanaheim, who made peace with the Æsir. | meadow |  | 🟢 |
| Muspell's fire giants (Muspelheim) | monster | ④ | Fire giants of the southern realm who will march with Surtr at Ragnarök. | volcano |  | – |
| Dead of Helheim (Hel's host) | undead | ④ | Souls who died of sickness or age in Hel's hall. | underworld |  | – |

### Children of Loki

Source: The four monstrous or divine children of Loki, a recurring group in the Prose Edda.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Fenrir | monster | ② | Monstrous wolf bound by the gods, fated to break loose at Ragnarök. | ice, underworld | ✕ | – |
| Jörmungandr | monster | ② | World Serpent encircling Midgard, doomed to fight Thor at Ragnarök. | sea | ○ ◆ | – |
| Hel | deity-beast | ② | Half-living, half-corpse ruler of the realm of the dead. | underworld | ○ ◆ | 🟢 |
| Sleipnir | beast | ③ | Eight-legged grey horse of Odin, born of Loki. | sky, underworld | ○ ◆ | – |

### The Wild Hunt

Source: Spectral riders and hounds chasing across the night sky in European folklore, led by different figures in different regions.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Odin | deity-beast | ① | The All-father, one-eyed wanderer. | sky | ○ | 🟢 |
| Sleipnir | beast | ③ | Eight-legged grey horse of Odin, born of Loki. | sky, underworld | ○ ◆ | – |
| Herne the Hunter | spirit | ③ | Antlered ghostly huntsman of Windsor Forest. | forest |  | – |
| Gwyn ap Nudd | deity | ④ | Welsh king of the Tylwyth Teg and leader of the Cŵn Annwn. | underworld |  | 🟡 |
| Cŵn Annwn | beast | ④ | White hounds with red ears that hunt souls, from the Otherworld. | sky, underworld |  | – |
| Sluagh | undead | ④ | Host of the restless dead flying at night in the Scottish Highlands. | sky, highland |  | – |
| Hellequin | spirit | ④ | Leader of the Mesnie Hellequin in medieval French lore, a source of Harlequin. | sky |  | – |
| Perchta | spirit | ④ | Alpine winter spirit who leads a procession of the unborn dead. | forest |  | – |
| Gabriel Hounds | spirit | ④ | English spectral hounds heard in the sky as a death omen. | sky |  | – |
| Åsgårdsreia | spirit | ⑤ | Norwegian name for the Wild Hunt, riding at Yule. | sky |  | – |

### Aztec day signs (Tonalpohualli)

Source: The twenty named days of the Aztec ritual calendar, each with a patron deity; the patron gods are listed under the culture, not here.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Ocelotl (Jaguar) | animal | ① | Jaguar day, tied to warriors and the night sun. | jungle |  | – |
| Coatl (Serpent) | animal | ② | Serpent day, tied to Mixcoatl and the earth. | jungle, desert |  | – |
| Cuauhtli (Eagle) | animal | ② | Eagle day, tied to the sun and warriors. | sky |  | – |
| Itzcuintli (Dog) | animal | ③ | Dog day, tied to Xolotl and Mictlantecuhtli. | village |  | – |
| Tochtli (Rabbit) | animal | ③ | Rabbit day, tied to drunkenness and fertility. | meadow |  | – |
| Mazatl (Deer) | animal | ③ | Deer day, tied to hunting. | forest |  | – |
| Ozomahtli (Monkey) | animal | ③ | Monkey day, tied to play and mischief. | jungle |  | – |
| Cuetzpalin (Lizard) | animal | ③ | Lizard day, tied to abundance and self-renewal. | desert |  | – |
| Cipactli | monster | ④ | Primordial earth-crocodile whose body became the land. | marsh, coast |  | – |
| Cozcacuauhtli (Vulture) | animal | ④ | Vulture day, linked to long life. | sky |  | – |
| Ehecatl (Wind) | spirit | ④ | Wind day, tied to Quetzalcoatl. | sky |  | – |
| Calli (House) | construct | ④ | House day, tied to dwellings and shelter. | village |  | – |
| Miquiztli (Death) | spirit | ④ | Death day, the sign of mortality. | tomb |  | – |
| Atl (Water) | spirit | ④ | Water day, tied to Tlaloc and rain. | river |  | – |
| Acatl (Reed) | spirit | ④ | Reed day, tied to kingship and the new fire. | marsh |  | – |
| Tecpatl (Flint) | construct | ④ | Flint knife day, tied to sacrifice. | ruins |  | – |
| Quiahuitl (Rain) | spirit | ④ | Rain day, tied to the Tlalocan. | sky |  | – |
| Xochitl (Flower) | spirit | ④ | Flower day, tied to artists and Xochipilli. | meadow |  | – |
| Ollin (Movement) | spirit | ④ | Earthquake day, tied to the fifth sun. | sky |  | – |
| Malinalli (Grass) | spirit | ⑤ | Grass day, tied to twisted or tangled things. | meadow |  | – |

### Ars Goetia, best-known demons (of 72)

Source: The Ars Goetia is the first book of the Lesser Key of Solomon, a 17th-century grimoire cataloguing 72 spirits; only the best-known fifteen are listed here, so the full set of 72 is not covered. The group is flagged yellow as Judeo-Christian demonology and ceremonial-magic practice.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Asmodeus (Asmoday) | spirit | ② | King with three heads (bull, man, ram), a serpent tail and a mount of dragon. | underworld |  | 🟡 |
| Belial | spirit | ③ | King who appears in a chariot of fire with two angels. | underworld |  | 🟡 |
| Astaroth | spirit | ③ | Duke who rides a dragon and carries a viper, teaching the liberal sciences. | underworld |  | 🟡 |
| Bael | spirit | ③ | First king, appearing as a cat, toad, man or all three, granting invisibility. | underworld |  | 🟡 |
| Paimon | spirit | ③ | King who rides a dromedary, crowned and followed by musicians. | desert |  | 🟡 |
| Stolas | spirit | ③ | Prince shown as an owl who teaches astronomy and herbs. | forest |  | 🟡 |
| Beleth | spirit | ④ | King who rides a pale horse with trumpets. | underworld |  | 🟡 |
| Bune | spirit | ④ | Duke with three heads (dog, griffin, man) who moves the dead. | tomb |  | 🟡 |
| Andras | spirit | ④ | Marquis with an owl's head riding a black wolf, who sows discord. | underworld |  | 🟡 |
| Vine | spirit | ④ | King shown as a lion riding a black horse with a viper. | ruins |  | 🟡 |
| Zagan | spirit | ④ | King in the form of a bull with griffin wings. | underworld |  | 🟡 |
| Furfur | spirit | ④ | Earl in the form of a hart with a fiery tail. | forest |  | 🟡 |
| Gremory | spirit | ④ | Duke in the form of a woman on a camel, finding hidden treasures. | desert |  | 🟡 |
| Valac | spirit | ④ | President shown as a boy with angel wings on a two-headed dragon. | sky |  | 🟡 |
| Buer | spirit | ⑤ | President shown as a star with five goat legs, healer of the sick. | underworld |  | 🟡 |

### Arthurian beasts

Source: Beasts and monsters from the Arthurian legends: the Welsh Mabinogion, Geoffrey of Monmouth and the medieval French romances.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Ddraig Goch | beast | ③ | Welsh Red Dragon, emblem of Wales, in the Mabinogion. | mountain, highland |  | – |
| Lady of the Lake | spirit | ③ | Water fairy who gave Arthur his sword Excalibur. | lake |  | – |
| Green Knight | spirit | ③ | Green giant who challenges Gawain in the 14th-century poem. | forest |  | – |
| Questing Beast | monster | ④ | Serpent-headed, leopard-bodied creature hunted in Arthurian tales. | forest |  | – |
| White Dragon of the Saxons | monster | ④ | Dragon that fights the red dragon beneath Vortigern's tower, in Merlin's prophecy. | mountain |  | – |
| Cath Palug | monster | ④ | Giant monstrous cat of Anglesey said to have been killed by Arthur or Cai. | highland |  | – |
| Afanc | monster | ④ | Lake monster of Welsh legend, beaver- or crocodile-like. | lake |  | – |
| Twrch Trwyth | monster | ⑤ | Giant boar hunted by Arthur's men in Culhwch and Olwen. | forest, highland |  | – |

### Elementals (Paracelsus)

Source: The four elemental spirits named by Paracelsus in the 16th century and used by alchemists and fantasy writers.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Salamander (elemental) | spirit | ② | Fire spirit of the alchemists, shown as a lizard in flames. | volcano |  | – |
| Gnome | spirit | ② | Earth spirit that moves through rock. | cave |  | – |
| Undine | spirit | ③ | Water spirit that can gain a soul by marrying a human. | lake |  | – |
| Sylph | spirit | ③ | Air spirit of the winds and clouds. | sky |  | – |

### Primordial beasts of the Hebrew tradition

Source: Three great beasts from Jewish scripture and legend: Leviathan of the sea, Behemoth of the land and Ziz of the sky. Sacred in Judaism, flagged yellow.

| Name | Kind | Fam. | Description | Habitat | Art | Flag |
|---|---|---|---|---|---|---|
| Leviathan | monster | ② | Binsfeld's demon of envy, the sea serpent of the Hebrew Bible. | sea |  | 🟡 |
| Behemoth | monster | ② | Land beast of the Book of Job, later matched to Leviathan in Jewish legend. | marsh |  | 🟡 |
| Ziz | monster | ④ | Giant bird of Jewish legend whose wings can block out the sun. | sky |  | 🟡 |

## Culture fit for future region themes

| Region theme | Good source cultures | Examples |
|---|---|---|
| Ice and tundra | Norse, Finnish/Baltic, Mongol/Siberian, Japanese yokai | Jötunn, Hræsvelgr, Yuki-onna, Louhi, Chuchunaa, Mammoth |
| Volcano | Norse, Greek, Persian/Arabian, Aztec/Mesoamerican | Surtr, Typhon, Ifrit, Xiuhcoatl, Salamander |
| Coast and sea | Celtic, Polynesian/Māori, Filipino, Greek, Japanese | Selkie, Marakihau, Bakunawa, Charybdis, Umibōzu |
| Sky | Slavic, Mesopotamian, Turkic, Chinese, Andean | Sirin, Anzû, Tulpar, Kunpeng, Condor |
| Underworld | Egyptian, Mesopotamian, Greek, Maya, Korean | Mehen, Gallu, Echidna, Hun-Came and Vucub-Came, Jeoseung Saja |
| Jungle | Maya, Southeast Asian, African, Hindu/Indian, Andean | Sisimito, Genderuwo, Sasabonsam, Rakshasa, Sachamama |
| Steppe and highland | Mongol/Turkic, Andean, Scottish/Welsh, Persian | Bozkurt, Zilant, Jarjacha, Cú Sídhe, Simurgh |
| Moor, marsh and lakes | Celtic, Finnish/Baltic, Slavic, Medieval | Kelpie, Näkki, Kikimora, Barghest, Afanc |
| Desert and oasis | Persian/Arabian, Egyptian, African | Ghoul, Jinn, Serpopard, Secretary bird |
| City and ruins | Medieval, Mesopotamian, Southeast Asian | Gargoyle, Golem, Lamassu, Yak |
| Haunted forest and village | Filipino, Malay/Indonesian, Slavic, Mesoamerican folklore | Tikbalang, Pontianak, Mavka, La Llorona |
| Modern/urban mystery | Modern cryptids | Mothman, Chupacabra, Fresno Nightcrawler |

## Recommended to draw next (30)

Not-yet-drawn entries chosen for strong silhouettes, wide recognisability and variety of terrain. Selection prefers familiarity ①–③ and flag 🟢 or none; none is 🔴 or 🟡, none was dropped (✕), and only one is a deity (Horus, 🟢).

1. **Nue** (Japanese yokai, ③, –): Chimera with a monkey's face, tanuki body, tiger limbs and snake tail; its cry brings illness.
2. **Nekomata** (Japanese yokai, ③, –): Cat with a forked tail, an elder form of the bakeneko of mountain lore.
3. **Medjed** (Egyptian, ③, –): Shrouded figure with only eyes visible, from the Book of the Dead.
4. **Horus** (Egyptian, ②, 🟢): Falcon-headed sky god and avenger of Osiris, whose eye is a protective symbol.
5. **Jiuweihu** (Chinese, ③, –): Nine-tailed fox, omen of peace or a seductive fiend depending on source.
6. **Kunpeng** (Chinese, ③, –): Vast fish that becomes a bird thousands of li across (Zhuangzi).
7. **Charybdis** (Greek, ②, –): Whirlpool monster who swallows and spews the sea thrice daily.
8. **Echidna** (Greek, ③, –): Half-woman, half-snake mother of many monsters.
9. **Lamia** (Greek, ③, –): Child-snatching queen turned monster by Hera.
10. **Garmr** (Norse, ③, –): Blood-stained hound that guards Hel's gate.
11. **Fáfnir** (Norse, ③, –): Dwarf turned dragon who guards a cursed hoard.
12. **Mavka** (Slavic, ③, –): Ukrainian forest nymph, a dead girl who lures men.
13. **Geobuk** (Korean, ③, –): Long-lived turtle, a symbol of longevity in Korea.
14. **Kelpie** (Celtic, ②, –): Shape-shifting water horse that drowns riders in Scottish lochs.
15. **Dullahan** (Celtic, ③, –): Headless horseman who carries his own head; a death omen.
16. **Balor** (Celtic, ③, –): Fomorian giant whose single baleful eye destroys all it sees.
17. **La Llorona** (Aztec, ③, –): Weeping woman wandering rivers and calling for her lost children.
18. **Feathered serpent** (Aztec, ③, –): Fanged, feathered snake in Teotihuacan murals and temple carvings.
19. **Rakshasa** (Hindu, ③, –): Shape-shifting, flesh-eating demon of Indian epics and folklore.
20. **Simurgh** (Persian, ③, –): Giant benevolent bird of the Shahnameh whose feathers heal.
21. **Shahmaran** (Persian, ③, –): Queen of snakes with a woman's torso, from Anatolian and Kurdish lore.
22. **Lamassu** (Mesopotamian, ③, –): Winged bull or lion with a human head, carved as a palace gate guardian.
23. **Pazuzu** (Mesopotamian, ③, –): Winged king of wind demons with a canine face and scorpion tail, who drives off Lamashtu.
24. **Anzû** (Mesopotamian, ③, –): Lion-headed eagle who stole the Tablet of Destinies.
25. **Tokoloshe** (African, ③, –): Mischievous water sprite who torments sleepers.
26. **Taniwha** (Polynesian, Māori, ③, –): Water or cave-dwelling creature that guards or menaces a tribe's river, lake or coast.
27. **Manananggal** (Southeast Asian, ③, –): Woman whose upper body detaches with wings to hunt at night.
28. **Tikbalang** (Southeast Asian, ③, –): Horse-headed, long-limbed trickster that misleads travellers in the mountains.
29. **Basilisk** (Medieval European bestiary, ②, –): Serpent king whose gaze or breath kills; hatched from a cock's egg.
30. **Mothman** (Modern cryptids, ②, –): Winged red-eyed humanoid seen near Point Pleasant, West Virginia, in 1966-67.

Cryptids to keep for a later wave: Yeti and Bigfoot (both ①), Nessie. Also worth testing as cultures: Finnish Iku-Turso and Hiiden hirvi, Mongol Tulpar and Zilant, medieval Wyvern and Gargoyle.

## 🔴 entries to avoid

All 31 High-sensitivity entries in the culture tables (Hindu deities, their avatars and mounts, and Amaterasu), plus the Navagraha and Dashavatara sets. Do not draw these as game units; see the Hindu and Shinto paragraphs of the research section.

- **Japanese yokai:** Amaterasu
- **Hindu and Indian:** Shiva, Ganesha, Kali, Vishnu, Brahma, Durga, Lakshmi, Hanuman, Krishna, Rama, Indra, Agni, Surya, Yama, Garuda, Saraswati, Parvati, Varuna, Vayu, Kartikeya, Kubera, Nandi, Airavata, Shesha, Vasuki, Hamsa, Narasimha, Varaha, Mushika, Kamadhenu
