import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3500,
    // disabled auto-open because we will handle it inside VS Code
    open: false,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 6500,
  },
  test: {
    environment: 'jsdom'
  }
});
