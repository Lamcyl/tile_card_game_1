// Builds <set>-options.html: several alternative designs per pick, side by side, for the user to choose from.
// node art-samples/build-options.mjs norse fenrir-fierce-v4 kraken-fierce-v4   (shows <prefix>a/b/c… .svg)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const [setName, ...prefixes] = process.argv.slice(2);
const dir = new URL('./' + setName + '/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.svg')).sort();
const svg = (f) => readFileSync(new URL(f, dir), 'utf8').replace(/<\?xml[^>]*>/, '').replace(/<!--[\s\S]*?-->/g, '').trim();
const cap = (s) => s[0].toUpperCase() + s.slice(1);

const cards = prefixes.map((prefix) => {
  const [slug, variant] = prefix.split('-');
  const opts = files.filter((f) => f.startsWith(prefix) && /^[a-z]\.svg$/.test(f.slice(prefix.length)));
  const figs = opts.map((f) => {
    const s = svg(f), letter = f.slice(prefix.length, -4).toUpperCase();
    return '<figure><div class="art">' + s + '</div><figcaption>' + letter + '<span class="tiles"><span class="tile">' + s + '</span><span class="tile dark">' + s + '</span></span></figcaption></figure>';
  }).join('');
  return '<article class="card"><header><h2>' + cap(slug) + '</h2><p>' + variant + ' — pick one</p></header><div class="row">' + figs + '</div></article>';
}).join('\n');

const page = `<title>${cap(setName)} Options</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@600;800&family=Zen+Kaku+Gothic+New:wght@400;700&display=swap">
<style>
  :root {
    --paper: #f3eee3; --card: #fbf8f1; --ink: #1b1a1a; --muted: #6b655c; --line: #ddd5c6;
    --display: "Shippori Mincho", "Hiragino Mincho ProN", Georgia, serif; --body: "Zen Kaku Gothic New", system-ui, sans-serif;
  }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --paper: #17161a; --card: #211f24; --ink: #efe9dd; --muted: #a59d90; --line: #36323a; color-scheme: dark; } }
  :root[data-theme="dark"] { --paper: #17161a; --card: #211f24; --ink: #efe9dd; --muted: #a59d90; --line: #36323a; color-scheme: dark; }
  * { box-sizing: border-box; }
  body { background: var(--paper); color: var(--ink); font: 15px/1.5 var(--body);
    padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
  .wrap { max-width: 1120px; margin: 0 auto; padding-block: 28px 56px; display: grid; gap: 24px; }
  h1 { font: 800 clamp(28px, 4.5vw, 42px)/1.1 var(--display); margin: 0; }
  .top p { margin: 6px 0 0; color: var(--muted); max-width: 68ch; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 14px; display: grid; gap: 10px; }
  .card header { display: flex; gap: 10px; align-items: baseline; }
  h2 { font: 800 22px/1.2 var(--display); margin: 0; }
  .card header p { margin: 0; font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; font-weight: 700; }
  .row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
  figure { margin: 0; display: grid; gap: 6px; min-width: 0; }
  .art { aspect-ratio: 1; border-radius: 12px; background: #f6f2e9; border: 1px solid #e6dfd0; display: grid; place-items: center; overflow: hidden; }
  .art svg { width: 92%; height: 92%; }
  figcaption { display: flex; justify-content: space-between; align-items: center; font: 800 18px var(--display); color: var(--ink); }
  .tiles { display: flex; gap: 4px; }
  .tile { width: 31px; height: 31px; border-radius: 6px; background: #2f4140; display: grid; place-items: center; }
  .tile.dark { background: #4a3036; }
  .tile svg { width: 28px; height: 28px; }
</style>
<div class="wrap">
  <header class="top"><h1>${cap(setName)} options</h1><p>Redrawn from scratch: three different designs each. Tell me which letter you want for each (for example "Fenrir B, Kraken A").</p></header>
${cards}
</div>`;
writeFileSync(new URL('./' + setName + '-options.html', import.meta.url), page);
console.log(setName + '-options.html', Math.round(page.length / 1024) + ' kB');
