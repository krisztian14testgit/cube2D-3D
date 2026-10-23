import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  server: {
    port: 3500,
    // disabled auto-open because we will handle it inside VS Code
    open: false,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2025',
    chunkSizeWarningLimit: 6500,
    minify: mode === 'production',
  },
  test: {
    environment: 'jsdom'
  }
}));
