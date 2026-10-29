// Builds yokai-gallery.html from the SVGs in ./yokai: node art-samples/build-yokai-gallery.mjs
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const dir = new URL('./yokai/', import.meta.url);
const NAMES = {
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
};

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

const page = `<title>Yokai Sketchbook</title>
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
    <h1>Yokai sketchbook <span class="seal">妖怪</span></h1>
    <p>Twenty Japanese yokai in black-and-white ink, chibi style. Each has a <b>cute</b> and a <b>fierce</b> version, plus small board-tile previews. Tell me the numbers you like (for example "3 fierce, 5 cute") and I'll refine those.</p>
  </header>
  <section class="grid">
${cards}
  </section>
  <p class="note">Drawn as hand-written vector art by AI agents, as concept sketches for choosing a direction.</p>
</div>`;
writeFileSync(new URL('./yokai-gallery.html', import.meta.url), page);
console.log('yokai-gallery.html', files.length + ' SVGs', Math.round(page.length / 1024) + ' kB');
