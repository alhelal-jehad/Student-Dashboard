import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const LIMIT = 100 * 1024;
const html = readFileSync('dist/index.html', 'utf8');
const entry = /src="\/(assets\/[^"]+\.js)"/.exec(html)?.[1];
if (!entry) throw new Error('Entry chunk not found in dist/index.html');
const size = gzipSync(readFileSync(`dist/${entry}`)).length;
console.log(`Entry ${entry}: ${(size / 1024).toFixed(1)} KB gzipped (limit ${LIMIT / 1024} KB)`);
if (size > LIMIT) process.exit(1);
