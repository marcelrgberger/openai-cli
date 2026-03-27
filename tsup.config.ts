import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['bin/openai-cli.ts'],
    format: ['esm'],
    target: 'node20',
    outDir: 'dist/bin',
    clean: true,
    sourcemap: true,
    dts: false,
    banner: {
      js: '#!/usr/bin/env node',
    },
    noExternal: [/.*/],
    external: ['better-sqlite3', 'tesseract.js'],
  },
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'node20',
    outDir: 'dist/src',
    sourcemap: true,
    dts: true,
    splitting: true,
  },
]);
