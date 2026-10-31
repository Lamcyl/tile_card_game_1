// Relics (design 11, WP12): run-only rule benders offered in the post-battle choice. Pure data + functions, no DOM.
// Each relic grants engine rule flags (state.rules, merged by Progress.rulesFor from run.relics), so the solver and
// the balance tools see them too. Relics are per run: they live in save.run.relics and vanish when the run ends.
(function (root) {
  'use strict';

  // glyph = brushed ink mark shown in the UI; rule = flags understood by Engine (see engine.js header of createState).
  const LIST = [
    { id: 'mjolnir',  name: 'Mjölnir Shard',      glyph: '雷', myth: 'Norse',    text: 'Barrels explode twice.', rule: { echo: 1 } },
    { id: 'prism',    name: 'Prism of Ra',        glyph: '日', myth: 'Egyptian', text: 'Supporters also boost diagonally.', rule: { diagAll: 1 } },
    { id: 'fenrir',   name: "Fenrir's Fang",      glyph: '牙', myth: 'Norse',    text: 'Each overkill kill gives all attackers +1 ATK for the rest of the battle (up to +3).', rule: { feast: 1 } },
    { id: 'aegis',    name: 'Aegis of Athena',    glyph: '盾', myth: 'Greek',    text: 'On the first turn of a battle Shields block double.', rule: { aegis: 1 } },
    { id: 'chisel',   name: "Hephaestus' Chisel", glyph: '鎚', myth: 'Greek',    text: 'Enemy armor counts 1 lower.', rule: { sunder: 1 } },
    { id: 'yata',     name: 'Mirror of Yata',     glyph: '鏡', myth: 'Shinto',   text: 'The first shot of every battle deals double damage.', rule: { opening: 1 } },
    { id: 'idun',     name: "Idun's Apple",       glyph: '林', myth: 'Norse',    text: 'Heal 1 HP at the end of every turn.', rule: { mend: 1 } },
    { id: 'bastet',   name: "Bastet's Amulet",    glyph: '猫', myth: 'Egyptian', text: 'Once per battle a lethal blow leaves you on 1 HP.', rule: { stand: 1 } },
    { id: 'susanoo',  name: "Susanoo's Edge",     glyph: '嵐', myth: 'Shinto',   text: 'Overkill damage also spills to the enemies beside the one that fell.', rule: { spill: 1 } },
    { id: 'artemis',  name: "Artemis' Quiver",    glyph: '月', myth: 'Greek',    text: 'All attackers gain +1 range.', rule: { reach: 1 } },
    { id: 'svalinn',  name: 'Svalinn Plate',      glyph: '甲', myth: 'Norse',    text: 'Shields block 1 more.', rule: { plate: 1 } },
    { id: 'agni',     name: "Agni's Ember",       glyph: '火', myth: 'Vedic',    text: 'On the first turn of a battle all attackers gain +1 ATK.', rule: { kindle: 1 } },
  ];
  const BY_ID = {}; LIST.forEach((r) => { BY_ID[r.id] = r; });
  const MAX_PER_RUN = 4;

  // Engine flags granted by a list of relic ids (same stacking as Progress.rulesFor).
  function rules(ids) {
    const out = {};
    for (const id of ids || []) { const r = BY_ID[id]; if (r) for (const k of Object.keys(r.rule)) out[k] = (out[k] || 0) + r.rule[k]; }
    return out;
  }

  // Which relic (if any) the post-battle choice offers. `rnd` is a 0..1 generator, `kind` the node type.
  // Elites and bosses always offer one, normal fights about two times in five; never more than MAX_PER_RUN, never a duplicate.
  function offer(owned, rnd, kind) {
    owned = owned || [];
    if (owned.length >= MAX_PER_RUN) return null;
    const chance = kind === 'boss' || kind === 'elite' ? 1 : 0.4;
    if (rnd() >= chance) return null;
    const left = LIST.filter((r) => !owned.includes(r.id));
    return left.length ? left[Math.floor(rnd() * left.length)] : null;
  }

  const Relics = { LIST, BY_ID, MAX_PER_RUN, rules, offer };
  root.Relics = Relics;
  if (typeof module !== 'undefined' && module.exports) module.exports = Relics;
})(typeof window !== 'undefined' ? window : globalThis);
