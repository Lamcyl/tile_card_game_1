// Builds <set>-picks.html: the chosen designs, with before/after for refined ones.
// node art-samples/build-picks.mjs yokai|egypt
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

// Per set: [number, slug, name, variant, feedback that was applied, optional "before" file]
const SETS = {
  yokai: { title: 'Yokai Picks', picks: [
  [3, 'tengu', 'Karasu-tengu', 'fierce', 'Feet redone; head reshaped to read more like a crow.'],
  [4, 'kitsune', 'Kitsune', 'fierce', 'v4: the v2 pose kept, with tapered front legs, a chest bib, and hind legs tucked under the haunches. Shown next to v2.', 'kitsune-fierce-v2.svg'],
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
  ] },
  egypt: { title: 'Egyptian Picks', picks: [
  [1, 'anubis', 'Anubis', 'fierce', null],
  [2, 'ra', 'Ra', 'fierce', null],
  [3, 'bastet', 'Bastet', 'fierce', 'Raised right arm redrawn: clean shoulder join, slight elbow bend, clear clawed paw.'],
  [16, 'bes', 'Bes', 'fierce', 'Body made one stocky shape: barrel chest, belly, kilt and short bowed legs.'],
  [17, 'bennu', 'Bennu', 'fierce', null],
  [18, 'wadjet', 'Wadjet', 'cute', null],
  [18, 'wadjet', 'Wadjet', 'fierce', null],
  [20, 'isis', 'Isis', 'fierce', null],
  ] },
};
const setName = process.argv[2] || 'yokai';
const SET = SETS[setName];
if (!SET) throw new Error('Unknown set: ' + setName);
const dir = new URL('./' + setName + '/', import.meta.url);
const PICKS = SET.picks;
const svg = (f) => readFileSync(new URL(f, dir), 'utf8').replace(/<\?xml[^>]*>/, '').replace(/<!--[\s\S]*?-->/g, '').trim();
const tiles = (s) => '<span class="tiles"><span class="tile">' + s + '</span><span class="tile dark">' + s + '</span></span>';

const cards = PICKS.map(([num, slug, name, variant, fix, before]) => {
  const base = slug + '-' + variant;
  // Show the newest refinement next to the version it replaced.
  let n = 2; while (existsSync(new URL(base + '-v' + (n + 1) + '.svg', dir))) n++;
  const v2 = base + '-v' + n + '.svg';
  const prev = before || (n > 2 ? base + '-v' + (n - 1) + '.svg' : base + '.svg');
  const hasV2 = fix && existsSync(new URL(v2, dir));
  const fig = (file, label) => {
    const s = svg(file);
    return '<figure><div class="art">' + s + '</div><figcaption>' + label + tiles(s) + '</figcaption></figure>';
  };
  const body = hasV2
    ? '<div class="pair">' + fig(prev, 'Before') + fig(v2, 'Refined') + '</div><p class="fix">' + fix + '</p>'
    : '<div class="single">' + fig(base + '.svg', fix ? 'Refinement pending' : 'Approved as is') + '</div>';
  return '<article class="card' + (hasV2 ? ' wide' : '') + '"><header><span class="num">' + num + '</span><div><h2>' + name + '</h2><p>' + variant + '</p></div></header>' + body + '</article>';
}).join('\n');

const page = `<title>${SET.title}</title>
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
    <h1>${SET.title.replace('Picks', 'picks')}</h1>
    <p>Your chosen designs. Refined ones show the original next to the new version, with the change that was made. Tell me what to adjust next, or which ones are final.</p>
  </header>
  <section class="grid">
${cards}
  </section>
</div>`;
writeFileSync(new URL('./' + setName + '-picks.html', import.meta.url), page);
console.log(setName + '-picks.html', Math.round(page.length / 1024) + ' kB');
