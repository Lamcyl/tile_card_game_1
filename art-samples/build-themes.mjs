// Builds themes-gallery.html: each themed set (overview map, exploration map, battle board) as a row of phones.
// node art-samples/build-themes.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const THEMES = [
  ['minimal', 'Minimal', 'Pared-back shapes, a quiet palette and lots of space.'],
  ['watercolour', 'Japanese watercolour', 'Soft washes and brushwork in the spirit of Japanese painting.'],
  ['risograph', 'Risograph print', 'Two or three spot inks, grain and slight misregistration, like a printed zine.'],
  ['diorama', 'Bright diorama (saved)', 'The first set: bright cartoon terrain. Kept for reference.'],
];
const SCREENS = [['overview', 'Overview'], ['explore', 'Exploration'], ['battle', 'Battle']];

const rows = THEMES.map(([slug, name, desc], i) => {
  const phones = SCREENS.map(([file, label]) => {
    const path = new URL('./themes/' + slug + '/' + file + '.svg', import.meta.url);
    // Embedded as an <img> so each screen's own styles and ids stay isolated.
    const art = existsSync(path)
      ? '<img alt="' + name + ' ' + label + '" src="data:image/svg+xml;base64,' + readFileSync(path).toString('base64') + '">'
      : '<div class="missing">Not drawn</div>';
    return '<figure><div class="phone">' + art + '</div><figcaption>' + label + '</figcaption></figure>';
  }).join('');
  return '<section class="theme"><header><span class="num">' + (i + 1) + '</span><div><h2>' + name + '</h2><p>' + desc + '</p></div></header><div class="row">' + phones + '</div></section>';
}).join('\n');

const page = `<!DOCTYPE html>
<html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Themed Sets</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@600;800&family=Zen+Kaku+Gothic+New:wght@400;700&display=swap">
<style>
  /* Layout: one section per theme, its three screens side by side as phones. */
  :root {
    --paper: #f3eee3; --card: #fbf8f1; --ink: #1b1a1a; --muted: #6b655c; --line: #ddd5c6; --seal: #c8352b;
    --display: "Shippori Mincho", "Hiragino Mincho ProN", Georgia, serif; --body: "Zen Kaku Gothic New", system-ui, sans-serif;
  }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --paper: #17161a; --card: #211f24; --ink: #efe9dd; --muted: #a59d90; --line: #36323a; color-scheme: dark; } }
  :root[data-theme="dark"] { --paper: #17161a; --card: #211f24; --ink: #efe9dd; --muted: #a59d90; --line: #36323a; color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--paper); color: var(--ink); font: 15px/1.5 var(--body); padding-inline: 16px; }
  .wrap { max-width: 1000px; margin: 0 auto; padding-block: 28px 56px; display: grid; gap: 24px; }
  h1 { font: 800 clamp(28px, 4.5vw, 42px)/1.1 var(--display); margin: 0; }
  .top p { margin: 8px 0 0; color: var(--muted); max-width: 68ch; }
  .theme { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 16px; display: grid; gap: 14px; }
  .theme header { display: flex; gap: 10px; align-items: flex-start; }
  .num { flex: none; width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--seal); color: var(--seal); display: grid; place-items: center; font: 800 14px var(--display); }
  h2 { font: 800 21px/1.2 var(--display); margin: 0; }
  .theme header p { margin: 2px 0 0; font-size: 13px; color: var(--muted); }
  .row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
  @media (max-width: 640px) { .row { grid-template-columns: 1fr; max-width: 320px; margin-inline: auto; width: 100%; } }
  figure { margin: 0; display: grid; gap: 6px; }
  figcaption { font: 700 12px var(--body); text-transform: uppercase; letter-spacing: .08em; color: var(--muted); text-align: center; }
  .phone { border-radius: 22px; overflow: hidden; border: 6px solid #1b1a1a; aspect-ratio: 390 / 700; background: #000; }
  .phone img { display: block; width: 100%; height: 100%; }
  .missing { height: 100%; display: grid; place-items: center; color: #999; }
</style>
<div class="wrap">
  <header class="top"><h1>Themed sets</h1><p>Each theme is a matching set of three screens: the overview map for fast travel, the free-roam exploration map, and the battle board. Tell me which theme to take further.</p></header>
${rows}
</div>`;
writeFileSync(new URL('./themes-gallery.html', import.meta.url), page);
console.log('themes-gallery.html', Math.round(page.length / 1024) + ' kB');
