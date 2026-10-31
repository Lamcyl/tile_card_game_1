// Copies the chosen unit drawings and the Japanese watercolour theme mockups from art-samples/
// into prototype/assets/, so the game bundles only what it uses. Re-run after art changes:
// node scripts/copy-art.mjs
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';

const SRC = new URL('../../art-samples/', import.meta.url);
const OUT = new URL('../assets/', import.meta.url);

// [asset name, source file]. Player units use the user's picks; enemies use the wider library (fierce versions).
const UNITS = [
  // Player squad
  ['kamaitachi', 'yokai/kamaitachi-fierce-v2.svg'], ['wukong', 'chinese/wukong-fierce.svg'],
  ['tengu', 'yokai/tengu-fierce-v2.svg'], ['ravens', 'norse/ravens-fierce.svg'],
  ['nezha', 'chinese/nezha-fierce.svg'], ['leigong', 'chinese/leigong-fierce.svg'],
  ['kitsune', 'yokai/kitsune-fierce-v4.svg'], ['ix-chel', 'maya/ix-chel-cute.svg'],
  ['raijin', 'yokai/raijin-fierce-v2.svg'], ['perun', 'slavic/perun-cute.svg'],
  ['komainu', 'yokai/komainu-fierce.svg'],
  ['siren', 'greek/siren-cute.svg'], ['alkonost', 'slavic/alkonost-cute.svg'],
  ['samjok-o', 'korean/samjok-o-cute.svg'],
  ['nurikabe', 'yokai/nurikabe-fierce.svg'], ['talos', 'greek/talos-fierce.svg'],
  // Enemies, by sub-area: basic, tough, armored, barrel, boss
  ['alux', 'maya/alux-fierce.svg'], ['tanuki', 'yokai/tanuki-fierce-v2.svg'], ['jangseung', 'korean/jangseung-fierce.svg'], ['chochin-obake', 'yokai/chochin-obake-fierce-v2.svg'], ['sansin', 'korean/sansin-fierce.svg'],
  ['kodama', 'yokai/kodama-fierce.svg'], ['leshy', 'slavic/leshy-fierce.svg'], ['bulgasari', 'korean/bulgasari-fierce.svg'], ['kasa-obake', 'yokai/kasa-obake-fierce.svg'], ['orochi', 'yokai/orochi-fierce.svg'],
  ['kappa', 'yokai/kappa-fierce.svg'], ['sobek', 'egypt/sobek-fierce.svg'], ['xuanwu', 'chinese/xuanwu-fierce.svg'], ['jingwei', 'chinese/jingwei-fierce.svg'], ['scylla', 'greek/scylla-fierce.svg'],
  ['mul-gwisin', 'korean/mul-gwisin-fierce.svg'], ['jormungandr', 'norse/jormungandr-fierce.svg'], ['imugi', 'korean/imugi-fierce.svg'], ['rusalka', 'slavic/rusalka-fierce.svg'], ['poseidon', 'greek/poseidon-fierce.svg'],
  ['serket', 'egypt/serket-fierce.svg'], ['sekhmet', 'egypt/sekhmet-fierce.svg'], ['khepri', 'egypt/khepri-fierce.svg'], ['ushabti', 'egypt/ushabti-fierce.svg'], ['apep', 'egypt/apep-fierce.svg'],
  ['mummy', 'egypt/mummy-fierce.svg'], ['camazotz', 'maya/camazotz-fierce.svg'], ['sphinx', 'egypt/sphinx-fierce.svg'], ['taweret', 'egypt/taweret-fierce.svg'], ['ra', 'egypt/ra-fierce.svg'],
  ['yuki-onna', 'yokai/yuki-onna-fierce.svg'], ['troll', 'norse/troll-fierce.svg'], ['haetae', 'korean/haetae-fierce.svg'], ['yutu', 'chinese/yutu-fierce.svg'], ['jangsan-beom', 'korean/jangsan-beom-fierce.svg'],
  ['draugr', 'norse/draugr-fierce.svg'], ['valkyrie', 'norse/valkyrie-fierce.svg'], ['cyclops', 'greek/cyclops-fierce.svg'], ['dalgyal-gwisin', 'korean/dalgyal-gwisin-fierce-v2.svg'], ['hel', 'norse/hel-fierce.svg'],
  ['dokkaebi', 'korean/dokkaebi-fierce.svg'], ['oni', 'yokai/oni-fierce.svg'], ['cabrakan', 'maya/cabrakan-fierce.svg'], ['bulgae', 'korean/bulgae-fierce.svg'], ['surtr', 'norse/surtr-fierce.svg'],
  ['huay-chivo', 'maya/huay-chivo-fierce.svg'], ['minotaur', 'greek/minotaur-fierce.svg'], ['taotie', 'chinese/taotie-fierce.svg'], ['firebird', 'slavic/firebird-fierce.svg'], ['zmey', 'slavic/zmey-fierce.svg'],
  // New sub-areas (Mirror Lake, Shipwreck Cove, Palm Oasis, Frozen Lake, Obsidian Ridge)
  ['bannik', 'slavic/bannik-fierce.svg'], ['jorogumo', 'yokai/jorogumo-fierce.svg'], ['baku', 'yokai/baku-fierce.svg'], ['hitotsume-kozo', 'yokai/hitotsume-kozo-fierce-v2.svg'], ['medusa', 'greek/medusa-fierce.svg'],
  ['harpy', 'greek/harpy-fierce.svg'], ['gashadokuro', 'yokai/gashadokuro-fierce.svg'], ['nemean-lion', 'greek/nemean-lion-fierce.svg'], ['cheonyeo-gwisin', 'korean/cheonyeo-gwisin-fierce.svg'], ['hydra', 'greek/hydra-fierce.svg'],
  ['bes', 'egypt/bes-fierce.svg'], ['anubis', 'egypt/anubis-fierce.svg'], ['ammit', 'egypt/ammit-fierce.svg'], ['wadjet', 'egypt/wadjet-fierce.svg'], ['set', 'egypt/set-fierce.svg'],
  ['nisse', 'norse/nisse-fierce-v2.svg'], ['lindworm', 'norse/lindworm-fierce.svg'], ['dvergr', 'norse/dvergr-fierce.svg'], ['ratatoskr', 'norse/ratatoskr-fierce.svg'], ['nidhogg', 'norse/nidhogg-fierce.svg'],
  ['kui', 'chinese/kui-fierce.svg'], ['zipacna', 'maya/zipacna-fierce.svg'], ['hundun', 'chinese/hundun-fierce.svg'], ['pixiu', 'chinese/pixiu-fierce.svg'], ['vucub-caquix', 'maya/vucub-caquix-fierce.svg'],
];
const THEME = ['overview', 'explore', 'battle'];

rmSync(new URL('units/', OUT), { recursive: true, force: true }); // keep assets/battle (hand-made backdrops)
rmSync(new URL('theme/', OUT), { recursive: true, force: true });
mkdirSync(new URL('units/', OUT), { recursive: true });
mkdirSync(new URL('theme/', OUT), { recursive: true });
for (const [name, file] of UNITS) copyFileSync(new URL(file, SRC), new URL('units/' + name + '.svg', OUT));
for (const name of THEME) copyFileSync(new URL('themes/watercolour/' + name + '.svg', SRC), new URL('theme/' + name + '.svg', OUT));
console.log(UNITS.length + ' units, ' + THEME.length + ' theme mockups copied to prototype/assets/');
