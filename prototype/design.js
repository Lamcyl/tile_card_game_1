// Read-only "Design" viewer for the dev test page: browse the design proposals in docs/data/*.json (bundled through Vite, never fetched)
// and vet them with Keep / Maybe / Drop marks and short notes. Marks live in the dev state (S.design.marks, saved under the dev localStorage key).
import units from '../docs/data/units.json';
import elementsData from '../docs/data/elements.json';
import families from '../docs/data/families.json';
import keywords from '../docs/data/keywords.json';
import items from '../docs/data/items.json';
import relics from '../docs/data/relics.json';
import heroes from '../docs/data/heroes.json';
import regionsData from '../docs/data/regions.json';
import bestiaryData from '../docs/data/bestiary.json';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const arr = (v) => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]);
const cap = (s) => String(s || '').replace(/^./, (c) => c.toUpperCase());
const PAGE = 40, MARKS = ['keep', 'maybe', 'drop'], MARK_LABEL = { keep: 'Keep', maybe: 'Maybe', drop: 'Drop' };
const tag = (t, cls) => (t == null || t === '' ? '' : '<span class="tag' + (cls ? ' ' + cls : '') + '">' + esc(t) + '</span>');
const line = (label, v) => (v == null || v === '' || (Array.isArray(v) && !v.length) ? '' : '<div class="dz-l"><b>' + esc(label) + '</b> ' + esc(Array.isArray(v) ? v.join(', ') : v) + '</div>');
const curTag = (x) => (x.current === true ? tag('current', 'dz-cur') : x.current === false ? tag('new', 'dz-new') : '');
const curVal = (x) => (x.current === true ? 'current' : x.current === false ? 'new' : '');

// ---------- Lists ----------
const unitCount = {}; units.forEach((u) => { unitCount[u.family] = (unitCount[u.family] || 0) + 1; });
const regionItems = []; // regions then their sub-areas, flattened so each can carry a mark
regionsData.regions.forEach((r) => {
  regionItems.push(Object.assign({ _t: 'region', _region: r.name }, r));
  r.subareas.forEach((s) => regionItems.push(Object.assign({ _t: 'subarea', _region: r.name, _rid: r.id }, s)));
});
const elemItems = elementsData.elements.map((e) => Object.assign({ _t: 'element' }, e)).concat((elementsData.weaknessHits || []).map((e) => Object.assign({ _t: 'weakness hit' }, e)), (elementsData.merges || []).map((e) => Object.assign({ _t: 'merge' }, e)));
const bestiaryItems = bestiaryData.entries.map((e) => Object.assign({ _src: e.culture || e.set }, e));
const rosterLine = (s) => (s.roster || []).map((m) => m.base + (m.variant ? ' (' + m.variant + ')' : '')).join(', ');
const bossLine = (b) => (b ? b.base + (b.variant ? ' (' + b.variant + ')' : '') + (b.gimmick ? ': ' + b.gimmick : '') : '');

const LISTS = [
  { id: 'units', label: 'Units', data: units, search: (u) => [u.name, u.culture, u.baseAnimal, u.ability, u.type, (u.synergyTags || []).join(' '), (u.evolution || []).map((e) => e.name + ' ' + e.extends).join(' ')],
    filters: [['element', 'Element', (u) => u.element], ['family', 'Family', (u) => u.family], ['rarity', 'Rarity', (u) => u.rarity, ['common', 'rare', 'epic', 'legendary']], ['culture', 'Culture', (u) => u.culture], ['nature', 'Nature', (u) => u.nature]],
    card: (u) => ({ title: u.name, tags: [tag(u.element, 'el-' + u.element), tag(u.family), tag(u.rarity, 'rar-' + u.rarity), tag('CP ' + u.commandCost)],
      body: line('Role', u.roles ? 'ATK ' + u.roles.atk + ' / Buff ' + u.roles.buff + ' / Guard ' + u.roles.guard : '') + line('Ability', u.ability) + line('Culture', u.culture + (u.baseAnimal ? ' · base ' + u.baseAnimal : '') + (u.nature ? ' · ' + u.nature : '')) +
        '<ol class="dz-evo">' + (u.evolution || []).map((e) => '<li><b>' + esc(e.name) + '</b> ' + esc(e.extends) + '</li>').join('') + '</ol>' }) },
  { id: 'elements', label: 'Elements and reactions', data: elemItems, search: (e) => [e.name, e.theme, e.note, e.resonance, e.text, e.kind, arr(e.pair || [e.attacker, e.defender]).join(' ')],
    filters: [['type', 'Type', (e) => e._t], ['element', 'Element', (e) => (e._t !== 'element' ? arr(e.pair || [e.attacker, e.defender]) : e.id)]],
    intro: () => '<details class="dz-det dz-intro"><summary>Notes on the element system</summary><div class="body"><div class="dz-l">' + esc(elementsData.recommended) + '</div><div class="dz-l"><b>Apply rule</b> ' + esc(elementsData.applyRule) + '</div><div class="dz-l"><b>Considered and dropped</b> ' + esc(elementsData.consideredAndDropped) + '</div></div></details>',
    card: (e) => e._t === 'element' ? { title: (e.glyph || '') + ' ' + e.name, tags: [tag('element')], body: line('Theme', e.theme) + line('Note', e.note) + line('Resonance', e.resonance) + line('Bestiary variants', e.bestiaryVariants) }
      : { title: e.name, tags: [tag(e._t), tag(arr(e.pair || [e.attacker, e.defender]).join(e.pair ? ' + ' : ' on ')), tag(e.kind)], body: line('Effect', e.text) } },
  { id: 'families', label: 'Families', data: families, search: (f) => [f.name, f.animals, f.signature, f.setBonus, f.typicalKeywords],
    filters: [], card: (f) => ({ title: f.name, tags: [tag(f.animals), tag(unitCount[f.id] != null ? unitCount[f.id] + ' units' : '')], body: line('Signature', f.signature) + line('Set bonus', f.setBonus) + line('Keywords', f.typicalKeywords) }) },
  { id: 'keywords', label: 'Keywords', data: keywords, search: (k) => [k.name, k.kind, k.rule],
    filters: [['kind', 'Kind', (k) => k.kind], ['cur', 'Current / new', curVal]], card: (k) => ({ title: k.name, tags: [tag(k.kind), curTag(k)], body: line('Rule', k.rule) }) },
  { id: 'items', label: 'Items', data: items, search: (i) => [i.name, i.slot, i.text, i.baseEffect, i.sourceTier, arr(i.ties).join(' '), arr(i.subPool).join(' '), arr(i.uniqueAffixes).map((a) => a.text).join(' ')],
    filters: [['slot', 'Slot', (i) => i.slot], ['sourceTier', 'Source tier', (i) => i.sourceTier], ['cur', 'Current / new', curVal]],
    card: (i) => ({ title: i.name, tags: [tag(i.slot), tag(i.sourceTier, 'tier-' + i.sourceTier), curTag(i)],
      body: line('Base effect', i.baseEffect || i.text) + line('Sub-stat pool', i.subPool) + arr(i.uniqueAffixes).map((a) => line('Unique (' + a.grade + ')', a.text)).join('') + line('Ties', i.ties) }) },
  { id: 'relics', label: 'Relics', data: relics, search: (r) => [r.name, r.myth, r.text, arr(r.ties).join(' ')],
    filters: [['myth', 'Myth', (r) => r.myth], ['cur', 'Current / new', curVal]], card: (r) => ({ title: r.name, tags: [tag(r.myth), curTag(r)], body: line('Effect', r.text) + line('Ties', r.ties) }) },
  { id: 'heroes', label: 'Heroes', data: heroes, search: (h) => [h.name, h.passive, h.ability, h.fiction, h.unlock],
    filters: [['cur', 'Current / new', curVal]], card: (h) => ({ title: h.name, tags: [tag('unlock: ' + h.unlock), curTag(h)], body: line('Passive', h.passive) + line('Ability', h.ability) + line('Fiction', h.fiction) }) },
  { id: 'regions', label: 'Regions', data: regionItems, search: (r) => [r.name, r._region, r.theme, r.idea, r.terrain, rosterLine(r), bossLine(r.boss), arr(r.teaches).join(' '), arr(r.cultures).join(' ')],
    filters: [['region', 'Region', (r) => r._region], ['type', 'Type', (r) => (r._t === 'region' ? 'region' : 'sub-area')]],
    card: (r) => r._t === 'region'
      ? { cls: 'dz-region', title: '#' + r.number + ' ' + r.name, tags: [tag(r.kind), tag('ring ' + (r.slot && r.slot.ring) + ' ' + (r.slot && r.slot.dir)), tag(r.subareas.length + ' sub-areas')], body: line('Terrain', r.terrain) + line('Cultures', r.cultures) + line('Elements', r.dominantElements) + line('Teaches', r.teaches) + line('Families', r.monsterFamilies) }
      : { cls: 'dz-sub', title: r.name, tags: [tag(r._region), tag('boss Lv' + r.bossLv)], body: line('Theme', r.theme) + line('Roster', rosterLine(r)) + line('Boss', bossLine(r.boss)) + line('Idea taught', r.idea) + line('Arc', r.arc) } },
  { id: 'bestiary', label: 'Bestiary', data: bestiaryItems, search: (b) => [b.name, b._src, b.kind, b.description, (b.habitat || []).join(' ')],
    filters: [['group', 'Culture / set', (b) => (b.culture ? 'Culture' : 'Set')], ['src', 'Name of culture or set', (b) => b._src], ['nature', 'Nature', (b) => b.nature], ['fam', 'Familiarity', (b) => (b.familiarity ? String(b.familiarity) : ''), ['1', '2', '3', '4', '5']], ['kind', 'Kind', (b) => b.kind], ['hab', 'Habitat', (b) => b.habitat], ['art', 'Art', (b) => b.art]],
    card: (b) => ({ title: b.name, tags: [tag(b._src), tag(b.kind), tag(b.nature), tag(b.familiarity ? 'fam ' + b.familiarity : ''), tag('art: ' + b.art + (b.inGame ? ' ◆' : ''))], body: line('Habitat', b.habitat) + '<div class="dz-l">' + esc(b.description) + '</div>' }) },
  { id: 'variants', label: 'Variants', data: bestiaryData.variants, search: (v) => [v.base, v.group, v.variants.map((x) => x.name + ' ' + x.lore).join(' ')],
    filters: [['group', 'Group', (v) => v.group], ['tag', 'Tag', (v) => v.variants.map((x) => x.tag)]],
    card: (v) => ({ title: v.base, tags: [tag(v.group), tag(v.variants.length + ' variants')], body: '<ul class="dz-var">' + v.variants.map((x) => '<li><b>' + esc(x.name) + '</b> ' + (x.tag ? '<i>(' + esc(x.tag) + ')</i> ' : '') + esc(x.lore) + '</li>').join('') + '</ul>' }) },
];
LISTS.forEach((L) => { L.key = (x) => L.id + '/' + x.id; });

// ---------- State ----------
let D = null, persist = () => {}, root = null;
const view = {}; // per-list ephemeral view state: { q, f:{}, mark, shown }
const viewOf = (L) => view[L.id] || (view[L.id] = { q: '', f: {}, mark: '', shown: PAGE });
const markOf = (key) => D.marks[key] || null;
const listById = (id) => LISTS.find((l) => l.id === id) || LISTS[0];

function filterOptions(L) {
  return L.filters.map(([k, label, get, order]) => {
    const set = new Set(); L.data.forEach((x) => arr(get(x)).forEach((v) => v !== '' && set.add(String(v))));
    let opts = [...set]; opts = order ? order.filter((o) => set.has(o)) : opts.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return { k, label, get, opts };
  });
}
function matches(L, FO, v, x) {
  if (v.q) { const hay = L.search(x).join(' ').toLowerCase(); if (!v.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false; }
  for (const f of FO) { const want = v.f[f.k]; if (want && !arr(f.get(x)).map(String).includes(want)) return false; }
  if (v.mark) { const m = markOf(L.key(x)); if (v.mark === 'none' ? m && m.m : !m || m.m !== v.mark) return false; }
  return true;
}
function counts(L) {
  const c = { keep: 0, maybe: 0, drop: 0, none: 0, notes: 0 };
  L.data.forEach((x) => { const m = markOf(L.key(x)); if (m && m.m) c[m.m]++; else c.none++; if (m && m.n) c.notes++; });
  return c;
}
const sumText = (L) => { const c = counts(L); return 'Kept ' + c.keep + ' · Maybe ' + c.maybe + ' · Dropped ' + c.drop + ' · Unmarked ' + c.none + ' (of ' + L.data.length + ')'; };

// ---------- Rendering ----------
function cardHtml(L, x) {
  const c = L.card(x), key = L.key(x), m = markOf(key) || {};
  return '<div class="d-card dz-card ' + (c.cls || '') + (m.m ? ' mk-' + m.m : '') + '" data-key="' + esc(key) + '"><div class="dz-h"><b>' + esc(c.title) + '</b>' + (c.tags || []).join('') + '</div>' + c.body +
    '<div class="dz-m">' + MARKS.map((k) => '<button type="button" class="sm dz-b dz-' + k + (m.m === k ? ' on' : '') + '" data-d="mark" data-k="' + k + '" aria-pressed="' + (m.m === k) + '">' + MARK_LABEL[k] + '</button>').join('') +
    '<input type="text" class="dz-note" maxlength="300" placeholder="note" aria-label="Note for ' + esc(c.title) + '" data-d="note" value="' + esc(m.n || '') + '"></div></div>';
}
function renderList(L) {
  const v = viewOf(L), FO = L._fo || (L._fo = filterOptions(L));
  const hits = L.data.filter((x) => matches(L, FO, v, x)), shown = hits.slice(0, v.shown);
  root.querySelector('#dz-count').textContent = hits.length + ' of ' + L.data.length + ' shown' + (hits.length > shown.length ? ' (showing ' + shown.length + ')' : '');
  root.querySelector('#dz-list').innerHTML = shown.map((x) => cardHtml(L, x)).join('') || '<div class="d-mini">No entries match.</div>';
  root.querySelector('#dz-more').hidden = hits.length <= shown.length;
  root.querySelector('#dz-more').textContent = 'Show ' + Math.min(PAGE, hits.length - shown.length) + ' more (' + (hits.length - shown.length) + ' left)';
}
function renderAll() {
  const L = listById(D.sub), v = viewOf(L), FO = L._fo || (L._fo = filterOptions(L));
  const sel = (k, label, opts, cur) => '<select data-d="filter" data-k="' + k + '" aria-label="' + esc(label) + '"><option value="">' + esc(label) + ': all</option>' + opts.map((o) => '<option value="' + esc(o) + '"' + (o === cur ? ' selected' : '') + '>' + esc(o) + '</option>').join('') + '</select>';
  root.innerHTML = '<div class="d-row dz-subtabs">' + LISTS.map((l) => '<button type="button" class="sm' + (l.id === L.id ? ' on' : '') + '" data-d="sub" data-id="' + l.id + '">' + esc(l.label) + '</button>').join('') + '</div>' +
    '<div class="d-sum dz-sum" id="dz-sum">' + esc(sumText(L)) + '</div>' +
    '<div class="d-row dz-filters"><input type="search" id="dz-q" data-d="q" placeholder="Search ' + esc(L.label.toLowerCase()) + '" value="' + esc(v.q) + '" aria-label="Search">' +
    FO.map((f) => sel(f.k, f.label, f.opts, v.f[f.k] || '')).join('') +
    '<select data-d="markf" aria-label="Mark filter"><option value="">Mark: any</option>' + [['keep', 'Keep'], ['maybe', 'Maybe'], ['drop', 'Drop'], ['none', 'Unmarked']].map(([k, t]) => '<option value="' + k + '"' + (v.mark === k ? ' selected' : '') + '>' + t + '</option>').join('') + '</select>' +
    '<button type="button" class="sm" data-d="clear">Clear</button></div>' +
    '<div class="d-mini" id="dz-count"></div>' + (L.intro ? L.intro() : '') + '<div id="dz-list"></div><button type="button" id="dz-more" class="sm" data-d="more" hidden></button>' +
    '<details class="dz-det dz-io"' + (D.ioOpen ? ' open' : '') + ' data-io><summary>Export / Import marks <small>(all lists: ' + totalMarked() + ' marked)</small></summary><div class="body">' +
    '<div class="d-row"><button type="button" class="sm" data-d="export">Export</button><button type="button" class="sm" data-d="copy">Copy</button><button type="button" class="sm" data-d="import">Import</button><button type="button" class="sm" data-d="cleario">Empty box</button></div>' +
    '<textarea id="dz-io" rows="8" spellcheck="false" aria-label="Marks JSON" placeholder="Export fills this box; paste exported JSON here and tap Import to restore or merge marks."></textarea><div class="d-mini" id="dz-iomsg" role="status"></div></div></details>';
  renderList(L);
}
const totalMarked = () => Object.values(D.marks).filter((m) => m && m.m).length;

// ---------- Export / import ----------
function exportJson() {
  const marks = {}; Object.keys(D.marks).sort().forEach((k) => { const m = D.marks[k]; if (m && (m.m || m.n)) marks[k] = { mark: m.m || null, note: m.n || '' }; });
  const summary = {}; LISTS.forEach((L) => { const c = counts(L); summary[L.id] = { keep: c.keep, maybe: c.maybe, drop: c.drop, unmarked: c.none }; });
  return JSON.stringify({ kind: 'design-vetting', version: 1, exportedAt: new Date().toISOString(), summary, marks }, null, 1);
}
function importJson(text) {
  let o; try { o = JSON.parse(text); } catch (e) { return 'Not valid JSON: ' + e.message; }
  const src = o && o.marks; if (!src || typeof src !== 'object') return 'No "marks" object found.';
  const valid = new Set(); LISTS.forEach((L) => L.data.forEach((x) => valid.add(L.key(x))));
  let n = 0, skipped = 0;
  for (const k of Object.keys(src)) {
    const e = src[k] || {}, mk = e.mark == null ? e.m : e.mark, note = String(e.note != null ? e.note : e.n || '').slice(0, 300);
    if (!valid.has(k)) { skipped++; continue; }
    D.marks[k] = { m: MARKS.includes(mk) ? mk : '', n: note }; n++;
  }
  persist(); return 'Imported ' + n + ' entries' + (skipped ? ', skipped ' + skipped + ' unknown ids' : '') + '.';
}
function copyText(ta) {
  ta.focus(); ta.select();
  const done = () => 'Copied.', fallback = () => { try { return document.execCommand('copy') ? 'Copied.' : 'Select the text and copy it by hand.'; } catch (e) { return 'Select the text and copy it by hand.'; } };
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(ta.value).then(done, fallback);
  return Promise.resolve(fallback());
}

// ---------- Events ----------
function onClick(ev) {
  const el = ev.target.closest('[data-d]'); if (!el || !root.contains(el)) return;
  const L = listById(D.sub), v = viewOf(L), a = el.dataset.d, say = (t) => { const m = root.querySelector('#dz-iomsg'); if (m) m.textContent = t; };
  if (a === 'sub') { D.sub = el.dataset.id; persist(); renderAll(); window.scrollTo(0, 0); }
  else if (a === 'more') { v.shown += PAGE; renderList(L); }
  else if (a === 'clear') { view[L.id] = null; renderAll(); }
  else if (a === 'mark') {
    const card = el.closest('.dz-card'), key = card.dataset.key, cur = D.marks[key] || { m: '', n: '' }, k = el.dataset.k;
    cur.m = cur.m === k ? '' : k; if (cur.m || cur.n) D.marks[key] = cur; else delete D.marks[key];
    persist(); card.className = card.className.replace(/\bmk-\w+/g, '').trim() + (cur.m ? ' mk-' + cur.m : '');
    card.querySelectorAll('.dz-b').forEach((b) => { const on = b.dataset.k === cur.m; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    root.querySelector('#dz-sum').textContent = sumText(L);
  } else if (a === 'export') { root.querySelector('#dz-io').value = exportJson(); say('Exported ' + totalMarked() + ' marked entries. Copy this text and send it back.'); }
  else if (a === 'copy') { const ta = root.querySelector('#dz-io'); if (!ta.value) ta.value = exportJson(); Promise.resolve(copyText(ta)).then(say); }
  else if (a === 'import') { const msg = importJson(root.querySelector('#dz-io').value); say(msg); if (/^Imported/.test(msg)) { D.ioOpen = true; const t = root.querySelector('#dz-io').value; renderAll(); root.querySelector('#dz-io').value = t; say(msg); } }
  else if (a === 'cleario') { root.querySelector('#dz-io').value = ''; say(''); }
}
function onInput(ev) {
  const el = ev.target; if (!el.dataset || el.dataset.d !== 'q') return;
  const L = listById(D.sub), v = viewOf(L); v.q = el.value; v.shown = PAGE; renderList(L);
}
function onChange(ev) {
  const el = ev.target, a = el.dataset && el.dataset.d; if (!a || !root.contains(el)) return;
  const L = listById(D.sub), v = viewOf(L);
  if (a === 'filter') { v.f[el.dataset.k] = el.value; v.shown = PAGE; renderList(L); }
  else if (a === 'markf') { v.mark = el.value; v.shown = PAGE; renderList(L); }
  else if (a === 'note') {
    const key = el.closest('.dz-card').dataset.key, cur = D.marks[key] || { m: '', n: '' }; cur.n = el.value.trim().slice(0, 300);
    if (cur.m || cur.n) D.marks[key] = cur; else delete D.marks[key];
    persist(); root.querySelector('#dz-sum').textContent = sumText(L);
  }
}
function onToggle(ev) { if (ev.target.matches && ev.target.matches('details[data-io]')) D.ioOpen = ev.target.open; }

export const Design = {
  // Called after every dev-page render; `state` is S.design (created here when missing), `save` persists the dev state.
  mount(el, state, save) {
    D = state; persist = save; root = el;
    if (!D.marks || typeof D.marks !== 'object') D.marks = {};
    if (!LISTS.some((l) => l.id === D.sub)) D.sub = 'units';
    if (!el._dz) { el._dz = true; }
    renderAll();
  },
  bind(el) { // listeners go on the stable #dev container once
    el.addEventListener('click', onClick); el.addEventListener('input', onInput); el.addEventListener('change', onChange); el.addEventListener('toggle', onToggle, true);
  },
};
