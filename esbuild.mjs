#!/usr/bin/env node

import { build } from 'esbuild';

const isProduction = process.argv.includes('--production');

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  outfile: 'dist/index.mjs',
  minify: isProduction,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
