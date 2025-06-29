#!/usr/bin/env node

import { build } from 'esbuild';

const isProduction = process.argv.includes('--production');

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'dist/index.cjs',
  minify: isProduction,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
