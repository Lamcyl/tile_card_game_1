#!/usr/bin/env node
// Parses docs/BESTIARY.md into docs/data/bestiary.json (culture tables, named-set tables, variants, monster families).
// Columns are read from each table's header row, so a changed layout still parses. Usage: node tools/bestiary-to-json.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lines = readFileSync(join(root, 'docs/BESTIARY.md'), 'utf8').split(/\r?\n/);
const FAM = { '①': 1, '②': 2, '③': 3, '④': 4, '⑤': 5 };
const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cells = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
const isSep = (l) => /^\|?\s*:?-{2,}/.test(l.trim());
const isRow = (l) => l.trim().startsWith('|');

// Section outline.
const heads = [];
lines.forEach((l, i) => { const m = /^(#{2,4})\s+(.*)$/.exec(l); if (m) heads.push({ i, level: m[1].length, title: m[2].trim() }); });
const endOf = (k) => { for (let j = k + 1; j < heads.length; j++) if (heads[j].level <= heads[k].level) return heads[j].i; return lines.length; };
const tablesIn = (from, to) => {
  const out = [];
  for (let i = from; i < to; i++) {
    if (isRow(lines[i]) && i + 1 < to && isSep(lines[i + 1])) {
      const header = cells(lines[i]); const rows = []; let j = i + 2;
      while (j < to && isRow(lines[j])) { rows.push(cells(lines[j])); j++; }
      out.push({ header, rows }); i = j;
    }
  }
  return out;
};
const col = (header, ...names) => header.findIndex((h) => names.some((n) => h.toLowerCase().startsWith(n)));

const report = { unparsed: [], tables: 0 };
const entries = [];
function entryTables(k, group, setName, kindOfGroup) {
  const h = heads[k]; const to = k + 1 < heads.length ? heads[k + 1].i : lines.length; // only text until the next heading
  const ts = tablesIn(h.i, to);
  for (const t of ts) {
    const ci = { name: col(t.header, 'name'), kind: col(t.header, 'kind'), fam: col(t.header, 'fam'), nat: col(t.header, 'nature'), desc: col(t.header, 'desc'), hab: col(t.header, 'habitat'), art: col(t.header, 'art'), flag: col(t.header, 'flag') };
    if (ci.name < 0 || ci.kind < 0) { report.unparsed.push(h.title + ' (header: ' + t.header.join(' | ') + ')'); continue; }
    report.tables++;
    t.rows.forEach((r) => {
      const g = (i) => (i >= 0 && i < r.length ? r[i] : '');
      const art = g(ci.art);
      entries.push({
        id: kindOfGroup + ':' + slug(group + (setName && setName !== group ? '-' + setName : '')) + ':' + slug(g(ci.name)),
        name: g(ci.name), group: kindOfGroup, culture: kindOfGroup === 'culture' ? group : null, set: kindOfGroup === 'set' ? setName : null,
        kind: g(ci.kind), familiarity: FAM[(g(ci.fam).match(/[①-⑤]/) || [''])[0]] || null, nature: g(ci.nat), habitat: g(ci.hab).split(',').map((s) => s.trim()).filter(Boolean),
        art: art.includes('★') ? 'picked' : art.includes('○') ? 'drawn' : art.includes('✕') ? 'rejected' : 'none', inGame: art.includes('◆'),
        description: g(ci.desc), flag: g(ci.flag), status: 'proposed',
      });
    });
  }
}
const iStart = heads.findIndex((h) => h.level === 2 && h.title === 'Japanese yokai');
const iSets = heads.findIndex((h) => h.level === 2 && h.title === 'Named sets');
const iEndSets = heads.findIndex((h, k) => k > iSets && h.level === 2);
for (let k = iStart; k < iSets; k++) if (heads[k].level === 2) entryTables(k, heads[k].title, null, 'culture');
let parentSet = '';
for (let k = iSets + 1; k < iEndSets; k++) {
  const h = heads[k];
  if (h.level === 3) { parentSet = h.title; entryTables(k, h.title, h.title, 'set'); }
  else if (h.level === 4) entryTables(k, parentSet + ' ' + h.title, parentSet, 'set');
}
// Ids must be unique.
const seen = {}; for (const e of entries) { if (seen[e.id]) { seen[e.id]++; e.id += '-' + seen[e.id]; } else seen[e.id] = 1; }

// Variants: "| Base | Variants |" rows, variants joined with " · " as "**Name** (tag): lore".
const variants = []; const vk = heads.findIndex((h) => h.level === 2 && h.title === 'Variants');
const vEnd = endOf(vk);
for (let k = vk + 1; k < heads.length && heads[k].i < vEnd; k++) {
  if (heads[k].level !== 3) continue;
  for (const t of tablesIn(heads[k].i, k + 1 < heads.length ? heads[k + 1].i : lines.length)) {
    const bi = col(t.header, 'base'), vi = col(t.header, 'variants');
    if (bi < 0 || vi < 0) { report.unparsed.push('Variants: ' + heads[k].title); continue; }
    report.tables++;
    for (const r of t.rows) {
      const list = (r[vi] || '').split(' · ').map((s) => s.trim()).filter(Boolean).map((s) => {
        const m = /^\*\*(.+?)\*\*\s*(?:\(([^)]*)\))?\s*:?\s*(.*)$/.exec(s);
        return m ? { name: m[1], tag: m[2] || '', lore: m[3] } : { name: s, tag: '', lore: '' };
      });
      variants.push({ id: 'variant:' + slug(r[bi]), base: r[bi], group: heads[k].title, variants: list, status: 'proposed' });
    }
  }
}

// Monster families: "**Name.** trait text" then a "Culture: a, b. Culture: c." line.
const families = []; const fk = heads.findIndex((h) => h.level === 2 && h.title === 'Monster families');
const fEnd = endOf(fk);
for (let i = heads[fk].i + 1; i < fEnd; i++) {
  const m = /^\*\*(.+?)\.\*\*\s*(.*)$/.exec(lines[i]);
  if (!m) continue;
  const members = {}; const raw = (lines[i + 1] || '').trim();
  raw.replace(/(?:^|\.\s+)([A-Z][^:.]{1,40}):\s*([^]*?)(?=\.\s+[A-Z][^:.]{1,40}:|\.?$)/g, (_, c, list) => { members[c.trim()] = list.split(',').map((s) => s.trim().replace(/\.$/, '')).filter(Boolean); });
  families.push({ id: 'family:' + slug(m[1]), name: m[1], trait: m[2], members, note: Object.keys(members).length ? '' : raw, memberCount: Object.values(members).reduce((a, b) => a + b.length, 0), status: 'proposed' });
  if (!Object.keys(members).length && !raw) report.unparsed.push('Family members: ' + m[1]);
}

const out = { status: 'proposed', source: 'docs/BESTIARY.md', entries, variants, families };
writeFileSync(join(root, 'docs/data/bestiary.json'), JSON.stringify(out, null, 1) + '\n');
const cult = {}, sets = {};
entries.forEach((e) => { if (e.culture) cult[e.culture] = (cult[e.culture] || 0) + 1; else sets[e.set] = (sets[e.set] || 0) + 1; });
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
console.log(`tables parsed ${report.tables}; culture entries ${sum(cult)} in ${Object.keys(cult).length} cultures; set entries ${sum(sets)} in ${Object.keys(sets).length} sets; variants ${variants.length} bases (${variants.reduce((a, v) => a + v.variants.length, 0)} variants); families ${families.length}`);
if (process.argv.includes('--counts')) { console.log(JSON.stringify(cult)); console.log(JSON.stringify(sets)); }
if (report.unparsed.length) console.log('UNPARSED:\n  ' + report.unparsed.join('\n  '));
