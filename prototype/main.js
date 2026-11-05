// Vite entry for the world map game. The scripts are plain (non-module)
// files that set window globals, so they are imported in dependency order.
import './theme.css';
import './world.css';
import './camp.css';
import './battle.css';
import './js/engine.js';
import './js/world-boot.js'; // window.WorldGen first: shared chunks evaluate before main's own body
import './js/world-nav.js';
import './js/tilemap.js';
import './js/world-data.js';
import './js/art.js';
import './js/progress.js';
import './js/boss-defs.js';
import './js/gen.js';
import './js/battle.js';
import './js/items.js';
import './js/bounties.js';
import './js/relics.js';
import './js/events.js';
import './js/achievements.js';
import './js/map.js';
import './js/app.js';
