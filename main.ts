// Bargain Beacon — hand-in program for black-friday-deal-finder-01.
// Node 22, standard library only. The site is the plain static files in
// app/ beside this file: no build step, nothing loaded over the network.
// This program copies app/ and screenshots/ into the output directory and
// writes output/dossier.json with the make.fun library, which is what the
// sealed scorer reads. vendor/makefun-frontend.ts is the kit's copy and is
// left exactly as shipped: the scorer rebuilds the dossier with its own
// copy and compares the two byte for byte.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps (from the kit's gate): at most 4 screenshots, each
// at most 256 KiB; app/ at most 993 files and directories and 16 MiB in
// all; the dossier text at most 160 KiB.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);
