import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'askapro-cli': 'bin/askapro-cli.ts',
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
