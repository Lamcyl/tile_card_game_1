// Builds <set>-gallery.html from the SVGs in ./<set>: node art-samples/build-gallery.mjs yokai|egypt|chinese|greek|norse
// Only the original drawings (<slug>-cute.svg and <slug>-fierce.svg) are shown.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const SETS = {
  yokai: {
    title: 'Yokai Sketchbook', heading: 'Yokai sketchbook', seal: '妖怪',
    intro: 'Twenty Japanese yokai in black-and-white ink, chibi style.',
    names: {
      oni: ['Oni', 'Horned ogre with an iron club'],
      kappa: ['Kappa', 'River imp with a water dish on its head'],
      tengu: ['Karasu-tengu', 'Crow-headed mountain spirit'],
      kitsune: ['Kitsune', 'Many-tailed fox spirit'],
      tanuki: ['Tanuki', 'Shape-shifting raccoon dog'],
      bakeneko: ['Bakeneko', 'Two-tailed ghost cat'],
      'kasa-obake': ['Kasa-obake', 'One-eyed hopping umbrella'],
      'chochin-obake': ['Chōchin-obake', 'Paper lantern ghost'],
      'hitotsume-kozo': ['Hitotsume-kozō', 'One-eyed child monk'],
      nurikabe: ['Nurikabe', 'Living wall'],
      'yuki-onna': ['Yuki-onna', 'Snow woman'],
      rokurokubi: ['Rokurokubi', 'Woman with a stretching neck'],
      jorogumo: ['Jorōgumo', 'Spider woman'],
      gashadokuro: ['Gashadokuro', 'Giant skeleton'],
      kodama: ['Kodama', 'Tree spirit'],
      raijin: ['Raijin', 'Thunder god with drums'],
      komainu: ['Komainu', 'Lion-dog shrine guardian'],
      baku: ['Baku', 'Dream-eating tapir'],
      kamaitachi: ['Kamaitachi', 'Sickle-clawed weasel'],
      orochi: ['Yamata no Orochi', 'Eight-headed serpent'],
    },
  },
  egypt: {
    title: 'Egyptian Sketchbook', heading: 'Egyptian sketchbook', seal: '𓂀',
    intro: 'Twenty Egyptian gods and monsters in the same black-and-white ink, chibi style as the yokai.',
    names: {
      anubis: ['Anubis', 'Jackal-headed guide of the dead'],
      ra: ['Ra', 'Falcon-headed sun god'],
      bastet: ['Bastet', 'Cat goddess'],
      sekhmet: ['Sekhmet', 'Lioness war goddess'],
      thoth: ['Thoth', 'Ibis-headed god of wisdom'],
      sobek: ['Sobek', 'Crocodile god'],
      set: ['Set', 'God of chaos and storms'],
      apep: ['Apep', 'Giant chaos serpent'],
      ammit: ['Ammit', 'Devourer of the dead'],
      osiris: ['Osiris', 'Mummified king of the underworld'],
      sphinx: ['Sphinx', 'Lion with a human head'],
      mummy: ['Mummy', 'Bandaged undead'],
      khepri: ['Khepri', 'Scarab that rolls the sun'],
      serket: ['Serket', 'Scorpion goddess'],
      taweret: ['Taweret', 'Hippo protector goddess'],
      bes: ['Bes', 'Dwarf protector god'],
      bennu: ['Bennu', 'Heron phoenix'],
      wadjet: ['Wadjet', 'Cobra goddess'],
      ushabti: ['Ushabti', 'Little servant statue'],
      isis: ['Isis', 'Winged goddess of magic'],
    },
  },
  chinese: {
    title: 'Chinese Sketchbook', heading: 'Chinese sketchbook', seal: '神獸',
    intro: 'Twenty Chinese mythical beasts, monsters, gods and heroes in the same black-and-white ink, chibi style.',
    names: {
      long: ['Long', 'Chinese dragon chasing a pearl'],
      fenghuang: ['Fenghuang', 'Chinese phoenix'],
      qilin: ['Qilin', 'Hooved chimera of good omen'],
      baihu: ['Baihu', 'White Tiger of the West'],
      xuanwu: ['Xuanwu', 'Black Tortoise with a snake'],
      nian: ['Nian', 'New Year beast'],
      jiangshi: ['Jiangshi', 'Hopping vampire'],
      taotie: ['Taotie', 'Gluttonous maw'],
      hundun: ['Hundun', 'Faceless winged chaos'],
      qiongqi: ['Qiongqi', 'Winged tiger'],
      pixiu: ['Pixiu', 'Winged lion that hoards gold'],
      baize: ['Bai Ze', 'Wise many-eyed beast'],
      jingwei: ['Jingwei', 'Bird that fills the sea'],
      kui: ['Kui', 'One-legged thunder ox'],
      shanxiao: ['Shanxiao', 'One-legged mountain imp'],
      wukong: ['Sun Wukong', 'The Monkey King'],
      zhongkui: ['Zhong Kui', 'Demon queller'],
      leigong: ['Lei Gong', 'Thunder god'],
      yutu: ['Yutu', 'Jade Rabbit of the moon'],
      nezha: ['Nezha', 'Child deity on fire wheels'],
    },
  },
  greek: {
    title: 'Greek Sketchbook', heading: 'Greek sketchbook', seal: 'ΜΥΘΟΣ',
    intro: 'Twenty Greek monsters, beasts and gods in the same black-and-white ink, chibi style.',
    names: {
      medusa: ['Medusa', 'Gorgon with snake hair'],
      cyclops: ['Cyclops', 'One-eyed giant smith'],
      minotaur: ['Minotaur', 'Bull-headed giant of the labyrinth'],
      cerberus: ['Cerberus', 'Three-headed hound of the underworld'],
      hydra: ['Hydra', 'Many-headed water serpent'],
      chimera: ['Chimera', 'Lion, goat and serpent in one'],
      griffin: ['Griffin', 'Eagle-headed winged lion'],
      pegasus: ['Pegasus', 'Winged horse'],
      harpy: ['Harpy', 'Bird-woman of the storm winds'],
      siren: ['Siren', 'Singer of the rocks'],
      centaur: ['Centaur', 'Horse-bodied archer'],
      satyr: ['Satyr', 'Goat-legged piper'],
      talos: ['Talos', 'Bronze giant automaton'],
      scylla: ['Scylla', 'Sea monster of the strait'],
      typhon: ['Typhon', 'Father of monsters'],
      zeus: ['Zeus', 'King of the gods'],
      poseidon: ['Poseidon', 'God of the sea'],
      hades: ['Hades', 'Lord of the underworld'],
      athena: ['Athena', 'Goddess of wisdom and war'],
      'nemean-lion': ['Nemean Lion', 'Lion with an unbreakable hide'],
    },
  },
  norse: {
    title: 'Norse Sketchbook', heading: 'Norse sketchbook', seal: 'ᚱᚢᚾ',
    intro: 'Twenty Norse monsters, beings and gods in the same black-and-white ink, chibi style.',
    names: {
      fenrir: ['Fenrir', 'Monstrous chained wolf'],
      jormungandr: ['Jörmungandr', 'World Serpent'],
      sleipnir: ['Sleipnir', 'Eight-legged horse'],
      valkyrie: ['Valkyrie', 'Winged chooser of the slain'],
      draugr: ['Draugr', 'Undead barrow warrior'],
      jotunn: ['Jötunn', 'Frost giant'],
      surtr: ['Surtr', 'Fire giant with a flaming sword'],
      troll: ['Troll', 'Mountain troll'],
      dvergr: ['Dvergr', 'Dwarf smith'],
      nidhogg: ['Níðhöggr', 'Dragon gnawing the world-tree roots'],
      ratatoskr: ['Ratatoskr', 'Messenger squirrel of Yggdrasil'],
      ravens: ['Huginn and Muninn', "Odin's ravens"],
      kraken: ['Kraken', 'Giant sea monster'],
      lindworm: ['Lindworm', 'Wingless serpent dragon'],
      nisse: ['Nisse', 'House gnome'],
      thor: ['Thor', 'God of thunder'],
      odin: ['Odin', 'All-father'],
      loki: ['Loki', 'Trickster god'],
      freya: ['Freyja', 'Goddess with her cats'],
      hel: ['Hel', 'Ruler of the realm of the dead'],
    },
  },
};
const setName = process.argv[2] || 'yokai';
const SET = SETS[setName];
if (!SET) throw new Error('Unknown set: ' + setName + ' (use ' + Object.keys(SETS).join(' or ') + ')');
const dir = new URL('./' + setName + '/', import.meta.url);
const NAMES = SET.names;

const files = readdirSync(dir).filter((f) => f.endsWith('.svg'));
const svg = (f) => readFileSync(new URL(f, dir), 'utf8').replace(/<\?xml[^>]*>/, '').replace(/<!--[\s\S]*?-->/g, '').trim();

let n = 0;
const cards = Object.entries(NAMES).map(([slug, [name, desc]]) => {
  n++;
  const cell = (variant) => {
    const f = slug + '-' + variant + '.svg';
    if (!files.includes(f)) return '<div class="art missing">Not drawn</div>';
    const s = svg(f);
    return '<figure><div class="art">' + s + '</div><figcaption>' + variant + '<span class="tiles"><span class="tile">' + s + '</span><span class="tile dark">' + s + '</span></span></figcaption></figure>';
  };
  return '<article class="card"><header><span class="num">' + n + '</span><div><h2>' + name + '</h2><p>' + desc + '</p></div></header>' +
    '<div class="pair">' + cell('cute') + cell('fierce') + '</div></article>';
}).join('\n');

const page = `<title>${SET.title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@600;800&family=Zen+Kaku+Gothic+New:wght@400;700&display=swap">
<style>
  /* Layout: a numbered sketchbook. One card per yokai with its cute and fierce variants side by side,
     each followed by two board-tile previews (light and dark) at the real 62 px size. */
  :root {
    --paper: #f3eee3; --card: #fbf8f1; --ink: #1b1a1a; --muted: #6b655c; --line: #ddd5c6; --seal: #c8352b;
    --display: "Shippori Mincho", "Hiragino Mincho ProN", Georgia, serif; --body: "Zen Kaku Gothic New", system-ui, sans-serif;
  }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --paper: #17161a; --card: #211f24; --ink: #efe9dd; --muted: #a59d90; --line: #36323a; color-scheme: dark; } }
  :root[data-theme="dark"] { --paper: #17161a; --card: #211f24; --ink: #efe9dd; --muted: #a59d90; --line: #36323a; color-scheme: dark; }
  * { box-sizing: border-box; }
  body { background: var(--paper); color: var(--ink); font: 15px/1.5 var(--body);
    padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
  .wrap { max-width: 1120px; margin: 0 auto; padding-block: 28px 56px; display: grid; gap: 24px; }
  header.top { display: grid; gap: 8px; max-width: 68ch; }
  h1 { font: 800 clamp(28px, 4.5vw, 42px)/1.1 var(--display); margin: 0; }
  h1 .seal { display: inline-block; background: var(--seal); color: #fff; font-size: .45em; padding: 4px 6px; border-radius: 4px; vertical-align: middle; margin-left: 8px; }
  .top p { margin: 0; color: var(--muted); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 14px; display: grid; gap: 10px; min-width: 0; }
  .card header { display: flex; gap: 10px; align-items: center; }
  .num { flex: none; width: 34px; height: 34px; border-radius: 50%; border: 2px solid var(--seal); color: var(--seal); display: grid; place-items: center; font: 800 15px var(--display); font-variant-numeric: tabular-nums; }
  h2 { font: 800 19px/1.2 var(--display); margin: 0; }
  .card header p { margin: 0; font-size: 13px; color: var(--muted); }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  figure { margin: 0; display: grid; gap: 6px; }
  .art { aspect-ratio: 1; border-radius: 12px; background: #f6f2e9; border: 1px solid #e6dfd0; display: grid; place-items: center; overflow: hidden; }
  .art svg { width: 92%; height: 92%; }
  .missing { color: #9a948b; font-size: 13px; }
  figcaption { display: flex; justify-content: space-between; align-items: center; font: 700 12px var(--body); text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
  .tiles { display: flex; gap: 4px; }
  .tile { width: 31px; height: 31px; border-radius: 6px; background: #2f4140; display: grid; place-items: center; }
  .tile.dark { background: #4a3036; }
  .tile svg { width: 28px; height: 28px; }
  .note { max-width: 68ch; color: var(--muted); font-size: 14px; }
</style>
<div class="wrap">
  <header class="top">
    <h1>${SET.heading} <span class="seal">${SET.seal}</span></h1>
    <p>${SET.intro} Each has a <b>cute</b> and a <b>fierce</b> version, plus small board-tile previews. Tell me the numbers you like (for example "3 fierce, 5 cute") and I'll refine those.</p>
  </header>
  <section class="grid">
${cards}
  </section>
  <p class="note">Drawn as hand-written vector art by AI agents, as concept sketches for choosing a direction.</p>
</div>`;
writeFileSync(new URL('./' + setName + '-gallery.html', import.meta.url), page);
console.log(setName + '-gallery.html', files.length + ' SVGs', Math.round(page.length / 1024) + ' kB');
