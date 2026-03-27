import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'askpro-cli': 'bin/askpro-cli.ts',
    'index': 'src/index.ts',
  },
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  dts: false,
  splitting: false,
});
