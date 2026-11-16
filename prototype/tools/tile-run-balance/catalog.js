'use strict';
/* representative tiles for scoring: kinds x rarity (numbers from CONFIG.budget at rarity 0/1/2, level of the typical drop) */
const kinds = {
  strike:  ['a^4', 'a^6', 'a^8'],
  fork:    ['a<>3', 'a<>4', 'a<>6'],
  bar:     ['a^5#h2', 'a^8#h2', 'a^11#h2'],
  plus:    ['pudlr1', 'pudlr1', 'pudlr2'],
  rowboost:['pR1', 'pR2', 'pR2'],
  mult:    ['xu2', 'xu2', 'xu3']
};
const RN = ['Common', 'Rare', 'Epic'];
/* colourless: numbers are colourlessFactor times (multipliers +1); built from the coloured token */
function colourless(tok, C, R) {
  const p = R.parseTok(tok); const n = R.colourlessNum(p.k, p.n);
  return tok.replace(/[0-9]+/, String(n));
}
module.exports = { kinds, RN, colourless };
