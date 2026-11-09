// Prints the current enemy catalogue (per region / sub-area: nodes, templates, enemy types, scales, kinds, uniques, boss, reuse) as markdown.
// Usage: node tools/enemy-catalogue.js > out.md   (read-only; loads the live game data modules)
'use strict';
const Engine = require('../prototype/js/engine.js');
const World = require('../prototype/js/world-data.js');
const Defs = require('../prototype/js/boss-defs.js');
const Gen = require('../prototype/js/gen.js');
const Items = require('../prototype/js/items.js');
const fs = require('fs'), path = require('path');
const SEED = 'catalogue';
const out = [];
const P = (s = '') => out.push(s);
const units = new Set(fs.readdirSync(path.join(__dirname, '../prototype/assets/units')).map((f) => f.replace('.svg', '')));
const KC = { healer: 'm', splitter: 's', summoner: 'u', bulwark: 'k' };

function summarize(gen, L) {
  const by = {}; let hpSum = 0, atkSum = 0, n = 0;
  for (const e of gen.enemies) {
    const role = e.type.split('_').pop() + (e.kind ? '/' + e.kind : '') + (e.gimmick ? '/' + e.gimmick : '') + (e.guardian ? '/guard' : '');
    by[role] = (by[role] || 0) + 1;
    if (!e.type.endsWith('_barrel')) { hpSum += e.hp; atkSum += e.atk; n++; }
  }
  return { types: Object.entries(by).map(([k, v]) => v + '×' + k).join(' '), hp: n ? Math.round(hpSum / n) : 0, atk: n ? (atkSum / n).toFixed(1) : 0 };
}
const uniq = (id) => { const it = Items.UNIQUE_OF ? Items.UNIQUE_OF[id] : null; if (it) return it; const t = Items.tableFor(id); return Items.byId ? Items.byId(t[0].id) : null; };

for (const region of World.REGIONS) {
  P(`## ${region}`); P();
  for (const sub of World.SUBAREAS.filter((s) => s.region === region)) {
    const reuse = Object.entries(Defs.BOSSES).length && ({ rice: 'beach', ruins: 'cove', marsh: 'coral', highlands: 'isles', dshallows: 'dunes', palms: 'oasis', erg: 'ash', saltmirror: 'ridge', wadi: 'canyon', bazaar: 'lavafall', tomb: 'temple', citadel: 'caldera' })[sub.bossDef];
    P(`### ${sub.name} (\`${sub.id}\`) - biome ${sub.biome}, Lv ${sub.lv[0]}-${sub.lv[1]}, boss Lv ${sub.bossLv}`);
    const th = World.THEMES[sub.id];
    P(`Creatures: ${['basic', 'tough', 'armored', 'barrel', 'boss'].map((r) => `${r}=${th[r][0]}${units.has(th[r][2]) ? '' : ' (NO ART)'}`).join(', ')}. Boss def \`${sub.bossDef}\`${reuse ? ` reuses retired \`${reuse}\` (${Defs.BOSSES[reuse].name})` : ''}.`);
    P(); P('| node | kind | level | role | template / def | fielded | avg HP/ATK | unique drop |'); P('|---|---|---|---|---|---|---|---|');
    for (const node of World.nodes.filter((n) => n.sub === sub.id && ['battle', 'elite', 'boss'].includes(n.type))) {
      const gen = Gen.generateBattle(node, SEED, {});
      const s = summarize(gen, node.level);
      let u = '';
      try { const t = Items.tableFor(node.id)[0]; const it = Items.BY_ID[t.id]; u = it ? `${it.name} (${it.rarity}, ${it.kind}${it.type ? ":" + it.type : ""})` : t.id; } catch (e) { u = '?'; }
      const tmpl = node.type === 'battle' ? gen.template + (gen.teach ? ` [${gen.teach}]` : '') : gen.template;
      P(`| ${node.id} | ${node.type === 'battle' ? 'normal' : node.type} | ${node.level} | ${node.role || ''} | ${tmpl} | ${s.types} | ${s.hp}/${s.atk} | ${u} |`);
    }
    const bd = Defs.BOSSES[sub.bossDef], ed = Defs.ELITES[sub.bossDef];
    const g = bd.gimmick ? `${bd.gimmick}${bd.gp ? '(' + bd.gp + ')' : ''}${bd.gpHp ? '(' + bd.gpHp + ' HP)' : ''}` : bd.kind;
    P(); P(`Boss: **${bd.name}**, gimmick \`${g}\`, layout back \`${bd.back}\` / front \`${bd.front}\`, bossHp x${bd.bossHp}, bossAtk x${bd.bossAtk}. Elite: ${ed.name}, \`${ed.back}\`/\`${ed.front}\`.`); P();
  }
}
P('## Global'); P();
P('### Enemy kinds'); P('| kind | char | mechanic |'); P('|---|---|---|');
for (const [k, v] of Object.entries(Engine.ENEMY_KINDS)) P(`| ${k} ${v.badge} | ${KC[k]} | ${v.text} |`);
P(); P('### Boss / elite gimmicks'); P('| gimmick | text | used by |'); P('|---|---|---|');
for (const [k, v] of Object.entries(Engine.ENEMY_GIMMICKS)) P(`| ${k} ${v.badge} | ${v.text} | ${Object.entries(Defs.BOSSES).filter(([id, b]) => b.gimmick === k && World.SUB_BY[id]).map(([id, b]) => b.name).join(', ')} |`);
P(); P('### Template roles'); P('| char | role | stats |'); P('|---|---|---|');
for (const r of ['b basic: base HP/ATK', 'w weak: 60% HP', 't tough: 140% HP, +1 ATK from Lv5, front row', 'h heavy: 220% HP, +1 ATK', 'a armored: armor 1 (2 from Lv9), 90% HP', 'x barrel: 1 HP, blast 2 to neighbours', 'G guard / H regrow head (boss defs only)']) P(`| ${r.split(' ')[0]} | ${r.split(' ')[1]} | ${r.split(' ').slice(2).join(' ')} |`);
P(); P('### Templates by tier'); P('| tier | Lv | name | teach | back/front |'); P('|---|---|---|---|---|');
const seen = new Set();
for (const t of Gen.TEMPLATES) { const k = t.tier + t.name + t.back + t.front; if (seen.has(k) || t.tier > 4) continue; seen.add(k); P(`| ${t.tier} | ${t.lv.join('-')} | ${t.name} | ${t.teach || ''} | \`${t.back}\`/\`${t.front}\` |`); }
P(); P('### Enemy types per sub-area and art'); P('| sub-area | basic | tough | armored | barrel | boss |'); P('|---|---|---|---|---|---|');
for (const sub of World.SUBAREAS) { const th = World.THEMES[sub.id]; P(`| ${sub.id} | ${['basic', 'tough', 'armored', 'barrel', 'boss'].map((r) => th[r][0] + ' `' + th[r][2] + '`').join(' | ')} |`); }
console.log(out.join('\n'));
