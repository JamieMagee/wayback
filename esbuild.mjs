#!/usr/bin/env node

import { build } from 'esbuild';

const isProduction = process.argv.includes('--production');

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'dist/index.mjs',
  minify: isProduction,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
