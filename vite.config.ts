import { defineConfig } from 'vite';

export default defineConfig({
  root: 'tool',
  base: './',
  build: {
    outDir: '../dist/tool',
    emptyOutDir: true,
  },
});