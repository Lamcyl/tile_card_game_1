import { defineConfig } from 'vite';

// Relative base so the build also works inside the Capacitor WebView.
// index.html is the world map game; sandbox.html is the three-stage battle tester.
// `--mode single` builds only the game, as one bundle, for the single-file artifact.
export default defineConfig(({ mode }) => ({
  base: './',
  build: {
    rollupOptions: { input: mode === 'single' ? { main: 'index.html' } : { main: 'index.html', sandbox: 'sandbox.html' } },
  },
}));
