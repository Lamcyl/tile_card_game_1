import { defineConfig } from 'vite';

// Relative base so the build also works inside the Capacitor WebView.
// index.html is the world map game; sandbox.html is the three-stage battle tester, tiles.html the WP20 tile-world viewer.
// `--mode single` builds only the game, as one bundle with every asset inlined, for the single-file artifact.
export default defineConfig(({ mode }) => ({
  base: './',
  build: {
    assetsInlineLimit: mode === 'single' ? Number.MAX_SAFE_INTEGER : 4096,
    rollupOptions: { input: mode === 'single' ? { main: 'index.html' } : { main: 'index.html', sandbox: 'sandbox.html', tiles: 'tiles.html' } },
  },
}));
