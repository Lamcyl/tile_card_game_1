// Builds collection.html: every chosen design (final version) from every set, grouped by mythology.
// node art-samples/build-collection.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { SETS } from './picks-data.mjs';

const LABELS = { yokai: 'Japanese yokai', egypt: 'Egyptian', chinese: 'Chinese', greek: 'Greek', norse: 'Norse', slavic: 'Slavic', maya: 'Maya', korean: 'Korean' };
const tiles = (s) => '<span class="tiles"><span class="tile">' + s + '</span><span class="tile dark">' + s + '</span></span>';

let total = 0;
const sections = Object.entries(SETS).map(([setName, SET]) => {
  const dir = new URL('./' + setName + '/', import.meta.url);
  const svg = (f) => readFileSync(new URL(f, dir), 'utf8').replace(/<\?xml[^>]*>/, '').replace(/<!--[\s\S]*?-->/g, '').trim();
  const cards = SET.picks.map(([num, slug, name, variant, fix]) => {
    const base = slug + '-' + variant;
    // Same rule as build-picks.mjs: a refined pick uses its newest -vN file.
    let file = base + '.svg';
    if (fix) { let n = 2; while (existsSync(new URL(base + '-v' + (n + 1) + '.svg', dir))) n++; if (existsSync(new URL(base + '-v' + n + '.svg', dir))) file = base + '-v' + n + '.svg'; }
    total++;
    const s = svg(file);
    return '<figure class="card"><div class="art">' + s + '</div><figcaption><div><b>' + name + '</b><span>' + variant.replace(/-v\d+$/, '') + '</span></div>' + tiles(s) + '</figcaption></figure>';
  }).join('');
  return '<section><h2>' + LABELS[setName] + ' <span>' + SET.picks.length + '</span></h2><div class="grid">' + cards + '</div></section>';
}).join('\n');

const page = `<title>Selected Sketchbook</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@600;800&family=Zen+Kaku+Gothic+New:wght@400;700&display=swap">
<style>
  /* Layout: one section per mythology, each a grid of the chosen designs with light/dark tile previews. */
  :root {
    --paper: #f3eee3; --card: #fbf8f1; --ink: #1b1a1a; --muted: #6b655c; --line: #ddd5c6; --seal: #c8352b;
    --display: "Shippori Mincho", "Hiragino Mincho ProN", Georgia, serif; --body: "Zen Kaku Gothic New", system-ui, sans-serif;
  }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --paper: #17161a; --card: #211f24; --ink: #efe9dd; --muted: #a59d90; --line: #36323a; color-scheme: dark; } }
  :root[data-theme="dark"] { --paper: #17161a; --card: #211f24; --ink: #efe9dd; --muted: #a59d90; --line: #36323a; color-scheme: dark; }
  * { box-sizing: border-box; }
  body { background: var(--paper); color: var(--ink); font: 15px/1.5 var(--body);
    padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
  .wrap { max-width: 1120px; margin: 0 auto; padding-block: 28px 56px; display: grid; gap: 32px; }
  h1 { font: 800 clamp(28px, 4.5vw, 42px)/1.1 var(--display); margin: 0; }
  .top p { margin: 8px 0 0; color: var(--muted); max-width: 68ch; }
  h2 { font: 800 22px/1.2 var(--display); margin: 0 0 12px; display: flex; gap: 10px; align-items: center; }
  h2 span { font: 700 12px var(--body); color: var(--seal); border: 1.5px solid var(--seal); border-radius: 999px; padding: 1px 9px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; }
  .card { margin: 0; background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 10px; display: grid; gap: 8px; min-width: 0; }
  .art { aspect-ratio: 1; border-radius: 10px; background: #f6f2e9; border: 1px solid #e6dfd0; display: grid; place-items: center; overflow: hidden; }
  .art svg { width: 92%; height: 92%; }
  figcaption { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
  figcaption div { display: grid; min-width: 0; }
  figcaption b { font: 800 15px/1.2 var(--display); }
  figcaption span { font: 700 11px var(--body); text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
  .tiles { display: flex; gap: 3px; flex: none; }
  .tile { width: 28px; height: 28px; border-radius: 6px; background: #2f4140; display: grid; place-items: center; }
  .tile.dark { background: #4a3036; }
  .tile svg { width: 25px; height: 25px; }
</style>
<div class="wrap">
  <header class="top"><h1>Selected sketchbook</h1><p>All ${total} chosen designs so far, in their final refined versions, with small board-tile previews.</p></header>
${sections}
</div>`;
writeFileSync(new URL('./collection.html', import.meta.url), page);
console.log('collection.html', total + ' designs', Math.round(page.length / 1024) + ' kB');
