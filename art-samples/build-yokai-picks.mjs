// Builds yokai-picks.html: the chosen designs, with before/after for refined ones.
// node art-samples/build-yokai-picks.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const dir = new URL('./yokai/', import.meta.url);
// [number, slug, name, variant, feedback that was applied]
const PICKS = [
  [3, 'tengu', 'Karasu-tengu', 'fierce', 'Feet redone; head reshaped to read more like a crow.'],
  [4, 'kitsune', 'Kitsune', 'fierce', 'No arms: on all fours with the nine tails fanned.'],
  [5, 'tanuki', 'Tanuki', 'fierce', 'Clear ink outline restored around the body.'],
  [8, 'chochin-obake', 'Chōchin-obake', 'fierce', 'Right side cleaned up; mouth made unambiguous.'],
  [9, 'hitotsume-kozo', 'Hitotsume-kozō', 'fierce', 'One clean outline around the head.'],
  [10, 'nurikabe', 'Nurikabe', 'cute', null],
  [10, 'nurikabe', 'Nurikabe', 'fierce', null],
  [11, 'yuki-onna', 'Yuki-onna', 'fierce', null],
  [16, 'raijin', 'Raijin', 'fierce', 'Fiercer: broader, more muscular body and stance.'],
  [17, 'komainu', 'Komainu', 'fierce', null],
  [19, 'kamaitachi', 'Kamaitachi', 'fierce', 'Forelimbs redrawn as clean sickle arms.'],
  [20, 'orochi', 'Yamata no Orochi', 'fierce', null],
];
const svg = (f) => readFileSync(new URL(f, dir), 'utf8').replace(/<\?xml[^>]*>/, '').replace(/<!--[\s\S]*?-->/g, '').trim();
const tiles = (s) => '<span class="tiles"><span class="tile">' + s + '</span><span class="tile dark">' + s + '</span></span>';

const cards = PICKS.map(([num, slug, name, variant, fix]) => {
  const base = slug + '-' + variant;
  const v2 = base + '-v2.svg';
  const hasV2 = fix && existsSync(new URL(v2, dir));
  const fig = (file, label) => {
    const s = svg(file);
    return '<figure><div class="art">' + s + '</div><figcaption>' + label + tiles(s) + '</figcaption></figure>';
  };
  const body = hasV2
    ? '<div class="pair">' + fig(base + '.svg', 'Before') + fig(v2, 'Refined') + '</div><p class="fix">' + fix + '</p>'
    : '<div class="single">' + fig(base + '.svg', fix ? 'Refinement pending' : 'Approved as is') + '</div>';
  return '<article class="card' + (hasV2 ? ' wide' : '') + '"><header><span class="num">' + num + '</span><div><h2>' + name + '</h2><p>' + variant + '</p></div></header>' + body + '</article>';
}).join('\n');

const page = `<title>Yokai Picks</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@600;800&family=Zen+Kaku+Gothic+New:wght@400;700&display=swap">
<style>
  /* Layout: refined picks first as wide before/after cards, then the approved designs as single cards. */
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
  .top p { margin: 0; color: var(--muted); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 14px; display: grid; gap: 10px; align-content: start; min-width: 0; }
  .card.wide { grid-column: span 2; }
  @media (max-width: 560px) { .card.wide { grid-column: auto; } }
  .card header { display: flex; gap: 10px; align-items: center; }
  .num { flex: none; width: 34px; height: 34px; border-radius: 50%; border: 2px solid var(--seal); color: var(--seal); display: grid; place-items: center; font: 800 15px var(--display); }
  h2 { font: 800 19px/1.2 var(--display); margin: 0; }
  .card header p { margin: 0; font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; font-weight: 700; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  figure { margin: 0; display: grid; gap: 6px; }
  .art { aspect-ratio: 1; border-radius: 12px; background: #f6f2e9; border: 1px solid #e6dfd0; display: grid; place-items: center; overflow: hidden; }
  .art svg { width: 92%; height: 92%; }
  figcaption { display: flex; justify-content: space-between; align-items: center; font: 700 12px var(--body); text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
  .tiles { display: flex; gap: 4px; }
  .tile { width: 31px; height: 31px; border-radius: 6px; background: #2f4140; display: grid; place-items: center; }
  .tile.dark { background: #4a3036; }
  .tile svg { width: 28px; height: 28px; }
  .fix { margin: 0; font-size: 13px; color: var(--muted); }
</style>
<div class="wrap">
  <header class="top">
    <h1>Yokai picks</h1>
    <p>Your chosen designs. Refined ones show the original next to the new version, with the change that was made. Tell me what to adjust next, or which ones are final.</p>
  </header>
  <section class="grid">
${cards}
  </section>
</div>`;
writeFileSync(new URL('./yokai-picks.html', import.meta.url), page);
console.log('yokai-picks.html', Math.round(page.length / 1024) + ' kB');
