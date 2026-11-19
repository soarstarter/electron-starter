#!/usr/bin/env node
// Dependency-free renderer bundle report. Walks the built renderer output and
// prints each JS/CSS chunk with its raw and gzipped size, sorted largest-first,
// plus a total. Run it after a build to catch bundle-size regressions (e.g. an
// eager import sneaking a heavy module into the initial chunk after the Tier 3
// route code-splitting).
//
// Usage:
//   pnpm vite:build:app && node scripts/analyze-bundle.mjs
//   node scripts/analyze-bundle.mjs --dir out/renderer   # custom output dir

import { gzipSync } from 'node:zlib'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative, resolve } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const dirArgIndex = process.argv.indexOf('--dir')
const OUT_DIR = resolve(ROOT, dirArgIndex !== -1 ? process.argv[dirArgIndex + 1] : 'out/renderer')

if (!existsSync(OUT_DIR)) {
  console.error(`Renderer build not found at ${relative(ROOT, OUT_DIR)}.`)
  console.error('Build first:  pnpm vite:build:app')
  process.exit(1)
}

/** Recursively collect every *.js / *.css file under a directory. */
const collect = (dir) => {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...collect(full))
    } else if (/\.(js|css)$/.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

const formatKb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`.padStart(10)

const files = collect(OUT_DIR)
  .map((file) => {
    const raw = readFileSync(file)
    return { file, raw: raw.byteLength, gzip: gzipSync(raw).byteLength }
  })
  .sort((a, b) => b.gzip - a.gzip)

const totalRaw = files.reduce((sum, f) => sum + f.raw, 0)
const totalGzip = files.reduce((sum, f) => sum + f.gzip, 0)

console.log(`\nRenderer bundle report — ${relative(ROOT, OUT_DIR)}\n`)
console.log(`${'raw'.padStart(10)}  ${'gzip'.padStart(10)}  file`)
console.log('-'.repeat(60))
for (const { file, raw, gzip } of files) {
  console.log(`${formatKb(raw)}  ${formatKb(gzip)}  ${relative(OUT_DIR, file)}`)
}
console.log('-'.repeat(60))
console.log(`${formatKb(totalRaw)}  ${formatKb(totalGzip)}  ${files.length} files total\n`)
