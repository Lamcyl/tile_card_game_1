// Packs the production build into one self-contained HTML fragment (no external files),
// for hosting as a single page such as a claude.ai artifact. Run after `vite build`.
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');
const src = html.match(/<script type="module"[^>]*src="\.\/([^"]+)"[^>]*><\/script>/)[1];
const js = readFileSync(`dist/${src}`, 'utf8').replace(/<\/script/g, '<\\/script');
const cssHref = html.match(/<link rel="stylesheet"[^>]*href="\.\/([^"]+)"[^>]*>/)[1];
const css = readFileSync(`dist/${cssHref}`, 'utf8');
const title = html.match(/<title>[\s\S]*?<\/title>/)[0];
const body = html.match(/<body>([\s\S]*)<\/body>/)[1];

const out = [
  title,
  '<meta name="claude:viewport-fit-sides" content="cover">',
  `<style>\n${css}\n</style>`,
  body.trim(),
  `<script type="module">\n${js}\n</script>`,
  '',
].join('\n');
writeFileSync('dist/tile-defense.html', out);
console.log(`dist/tile-defense.html (${(out.length / 1024).toFixed(0)} kB)`);
