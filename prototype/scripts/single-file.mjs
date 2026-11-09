// Packs the production build into one self-contained HTML fragment (no external files),
// for hosting as a single page such as a claude.ai artifact. Run after `vite build`.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

// `node scripts/single-file.mjs dev` packs the developer test page (vite build --mode single-dev -> dist-dev/dev.html) into dist/tile-defense-dev.html.
const dev = process.argv[2] === 'dev';
const srcDir = dev ? 'dist-dev' : 'dist', page = dev ? 'dev.html' : 'index.html', outName = dev ? 'tile-defense-dev.html' : 'tile-defense.html';
const html = readFileSync(`${srcDir}/${page}`, 'utf8');
const src = html.match(/<script type="module"[^>]*src="\.\/([^"]+)"[^>]*><\/script>/)[1];
const js = readFileSync(`${srcDir}/${src}`, 'utf8').replace(/<\/script/g, '<\\/script');
const cssHref = html.match(/<link rel="stylesheet"[^>]*href="\.\/([^"]+)"[^>]*>/)[1];
const css = readFileSync(`${srcDir}/${cssHref}`, 'utf8');
const title = html.match(/<title>[\s\S]*?<\/title>/)[0];
const body = html.match(/<body>([\s\S]*)<\/body>/)[1];

const out = [
  '<!DOCTYPE html>',
  '<html lang="en"><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">',
  title,
  '<meta name="claude:viewport-fit-sides" content="cover">',
  `<style>\n${css}\n</style>`,
  body.trim(),
  `<script type="module">\n${js}\n</script>`,
  '',
].join('\n');
mkdirSync('dist', { recursive: true });
writeFileSync(`dist/${outName}`, out);
console.log(`dist/${outName} (${(out.length / 1024).toFixed(0)} kB)`);
