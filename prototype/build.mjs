// Inlines style.css and the scripts into one self-contained page: node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const page = read('./index.html')
  .replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, f) => '<style>\n' + read('./' + f) + '</style>')
  .replace(/<script src="([^"]+)"><\/script>/g, (_, f) => '<script>\n' + read('./' + f) + '</script>');
writeFileSync(new URL('./tile-defense.html', import.meta.url), page);
console.log('tile-defense.html', Math.round(page.length / 1024) + ' kB');
