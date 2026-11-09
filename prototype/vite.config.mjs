import { defineConfig } from 'vite';

// Relative base so the build also works inside the Capacitor WebView.
// index.html is the world map game; sandbox.html is the three-stage battle tester, tiles.html the WP20 tile-world viewer, dev.html the developer test page.
// `--mode single` builds only the game, as one bundle with every asset inlined, for the single-file artifact.
// `--mode single-dev` does the same for dev.html (into dist-dev/, so it never clobbers the game build; scripts/single-file.mjs dev packs it).
export default defineConfig(({ mode }) => {
  const single = mode === 'single' || mode === 'single-dev';
  return {
    base: './',
    build: {
      outDir: mode === 'single-dev' ? 'dist-dev' : 'dist',
      assetsInlineLimit: single ? Number.MAX_SAFE_INTEGER : 4096,
      rollupOptions: { input: mode === 'single-dev' ? { dev: 'dev.html' } : mode === 'single' ? { main: 'index.html' } : { main: 'index.html', sandbox: 'sandbox.html', tiles: 'tiles.html', dev: 'dev.html' } },
    },
  };
});
