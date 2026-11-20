const L=require('/home/user/tile_card_game_1/prototype/tools/tile-run-balance/lib.js'),R=L.R;
/* usage: node rel.js <tier> <runs per relic> [relic,ids]: win rate of the reference level-5 team with one relic (indicative) */
const tier=+process.argv[2]||7,n=+process.argv[3]||12;
const T=L.recipeTeam({team:L.REF_TEAM,lv:5,kit:true,hero:null});
const ids=[null].concat((process.argv[4]||"").split(",").filter(Boolean).length?process.argv[4].split(","):R.RELICS.map(r=>r.id));
const t0=Date.now();
for(const id of ids){
 const b=L.batch(T,tier,'skilled',n,undefined,5,'stage',{edit:run=>{run.relics=id?[id]:[]},effort:2});
 console.log(String(id).padEnd(10),'win',b.win.toFixed(2),'attacks/run',b.attacks.toFixed(1),'dmg',Math.round(b.dmg),((Date.now()-t0)/1000|0)+'s');
}
