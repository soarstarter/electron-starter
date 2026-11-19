#!/usr/bin/env node
// Boundary check for Electron Starter, the open-source edition.
//
// Every rule reads its data from lite-manifest.json, so this script stays free
// of the words and paths it guards against. It checks the files that git would
// commit (tracked plus untracked, minus .gitignore) and fails when:
//
//   1. a path owned by the commercial edition exists,
//   2. a file listed in the manifest is missing (the manifest is stale),
//   3. a forbidden word appears outside the allowlisted files and JSON keys,
//   4. package.json declares a forbidden dependency,
//   5. the renderer CSP allows anything but 'self'-style keywords and local schemes,
//   6. gitleaks finds a secret (skip with --skip-secrets when gitleaks is not installed).
//
// Usage: pnpm check:lite [--skip-secrets]

import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const skipSecrets = process.argv.includes('--skip-secrets')
const manifest = JSON.parse(readFileSync(join(root, 'lite-manifest.json'), 'utf8'))

const BINARY_EXTENSIONS = /\.(png|jpe?g|gif|ico|icns|webp|woff2?|ttf|otf|zip|gz)$/i
const failures = []
const fail = (rule, message) => failures.push(`[${rule}] ${message}`)

const listFiles = () =>
  execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root })
    .toString('utf8')
    .split('\0')
    .filter((file) => file && existsSync(join(root, file)))

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// `dir/` matches everything below dir; `*` matches within one path segment.
const toPathMatcher = (pattern) => {
  if (pattern.endsWith('/')) return (file) => file.startsWith(pattern)
  const regex = new RegExp(`^${pattern.split('*').map(escapeRegExp).join('[^/]*')}$`)
  return (file) => regex.test(file)
}

const files = listFiles()

// 1. Paths owned by the commercial edition.
for (const pattern of manifest.proPaths) {
  const matches = files.filter(toPathMatcher(pattern))
  for (const file of matches) fail('pro-path', `${file} (matches ${pattern})`)
}

// 2. Manifest freshness.
for (const file of [...manifest.sharedFiles, ...manifest.liteOnlyFiles]) {
  if (!existsSync(join(root, file))) fail('manifest', `${file} is listed in lite-manifest.json but does not exist`)
}

// 3. Forbidden words.
const allow = manifest.forbiddenWordAllowlist
const wordPattern = new RegExp(manifest.forbiddenWords.map(escapeRegExp).join('|'), 'gi')

const stripAllowedKeys = (text, keys) => {
  const data = JSON.parse(text)
  for (const key of keys) delete data[key]
  return JSON.stringify(data, null, 2)
}

for (const file of files) {
  if (allow.files.includes(file) || BINARY_EXTENSIONS.test(file)) continue
  let text = readFileSync(join(root, file), 'utf8')
  if (text.includes('\0')) continue
  const allowedKeys = allow.jsonKeys[file]
  if (allowedKeys) text = stripAllowedKeys(text, allowedKeys)

  text.split('\n').forEach((line, index) => {
    const found = line.match(wordPattern)
    if (found) fail('word', `${file}:${allowedKeys ? '(json)' : index + 1} contains ${[...new Set(found)].join(', ')}`)
  })
}

// 4. Dependencies.
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
for (const field of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  for (const name of Object.keys(pkg[field] ?? {})) {
    if (manifest.forbiddenDependencies.includes(name)) fail('dependency', `package.json ${field} declares ${name}`)
  }
}

// 5. Renderer CSP.
const html = readFileSync(join(root, 'app/index.html'), 'utf8')
const csp = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)?.[1]
if (!csp) {
  fail('csp', 'app/index.html has no Content-Security-Policy meta tag')
} else {
  for (const directive of csp
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)) {
    const [name, ...sources] = directive.split(/\s+/)
    for (const source of sources) {
      const isKeyword = /^'[a-z0-9-]+'$/.test(source)
      if (!isKeyword && !manifest.cspAllowedSchemes.includes(source)) {
        fail('csp', `${name} allows ${source}; only keywords and ${manifest.cspAllowedSchemes.join(' ')} are allowed`)
      }
    }
  }
}

// 6. Secrets.
if (skipSecrets) {
  console.warn('check:lite: secret scan skipped (--skip-secrets)')
} else if (spawnSync('gitleaks', ['version'], { stdio: 'ignore' }).status !== 0) {
  fail('secrets', 'gitleaks is not installed; install it (https://github.com/gitleaks/gitleaks) or pass --skip-secrets')
} else {
  const staging = mkdtempSync(join(tmpdir(), 'check-lite-'))
  try {
    for (const file of files) {
      mkdirSync(dirname(join(staging, file)), { recursive: true })
      copyFileSync(join(root, file), join(staging, file))
    }
    const scan = spawnSync('gitleaks', ['dir', staging, '--no-banner', '--redact', '--exit-code', '1'], {
      stdio: 'inherit',
    })
    if (scan.status !== 0) fail('secrets', 'gitleaks reported findings (see output above)')
  } finally {
    rmSync(staging, { recursive: true, force: true })
  }
}

if (failures.length > 0) {
  console.error(`check:lite failed with ${failures.length} problem(s):`)
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}

console.log(`check:lite passed (${files.length} files checked)`)
