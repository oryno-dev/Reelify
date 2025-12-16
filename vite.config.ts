import { defineConfig } from 'vite';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const motionCanvas = require('@motion-canvas/vite-plugin').default;

export default defineConfig({
  plugins: [
    motionCanvas({
      project: './src/project.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
