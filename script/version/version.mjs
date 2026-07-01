#!/usr/bin/env node

/**
 * Lockstep version bump + changelog for the whole monorepo — replaces
 * @changesets/cli for a repo where every package shares one version. Bumps the
 * `version` field in every non-private package.json, prepends a release block
 * to each CHANGELOG.md, and re-syncs the README version links. Internal
 * `workspace:^` deps are left untouched — `pnpm -r publish` rewrites them to
 * the real version at publish time.
 *
 * Guards: all public packages must already share one version (lockstep
 * invariant); the next version must be greater than current (--allow-downgrade
 * to override); the previous-release tag `v<current>` must exist for the
 * default changelog range (--first-release to bootstrap).
 *
 * Usage:
 *   node script/version/version.mjs <patch|minor|major|x.y.z[-tag]> \
 *     [--write] [--note "..."] [--allow-downgrade] [--first-release]
 *   (dry-run by default; pass --write to apply)
 */

import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bump } from './bump.mjs'
import { changelogBlock, commitsForRelease, prependChangelog } from './changelog.mjs'

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const USAGE =
  'Usage: node script/version/version.mjs <patch|minor|major|x.y.z[-tag]> [--write] [--note "..."] [--allow-downgrade] [--first-release]'

function fail(msg) {
  console.error(msg)
  console.error(USAGE)
  process.exit(1)
}

function die(msg) {
  console.error(msg)
  process.exit(1)
}

// ---- collect publishable manifests ----
const manifests = ['packages', 'tokenizers']
  .flatMap(ws =>
    readdirSync(join(rootDir, ws), { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => join(rootDir, ws, d.name)),
  )
  .map(dir => {
    const path = join(dir, 'package.json')
    try {
      return { dir, path, pkg: JSON.parse(readFileSync(path, 'utf8')) }
    } catch {
      return null
    }
  })
  .filter(m => m != null && !m.pkg.private)

if (manifests.length === 0) die('No publishable packages found under packages/ or tokenizers/.')

// ---- parse args (strict) ----
const argv = process.argv.slice(2)
let kind
let write = false
let note
let allowDowngrade = false
let firstRelease = false
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--write') write = true
  else if (a === '--allow-downgrade') allowDowngrade = true
  else if (a === '--first-release') firstRelease = true
  else if (a === '--note') {
    note = argv[++i]
    if (note === undefined || note.startsWith('--')) fail('--note requires a value.')
  } else if (a.startsWith('--')) fail(`Unknown option: ${a}`)
  else if (kind === undefined) kind = a
  else fail(`Unexpected extra argument: ${a} (bump type already set to "${kind}").`)
}
if (!kind) fail('Missing bump type.')

// ---- assert lockstep invariant: all packages share exactly one version ----
const rel = p => relative(rootDir, p)
const byVersion = new Map()
for (const m of manifests) {
  byVersion.set(m.pkg.version, [...(byVersion.get(m.pkg.version) ?? []), rel(m.dir)])
}
if (byVersion.size !== 1) {
  const detail = [...byVersion.entries()].map(([v, ps]) => `  ${v}: ${ps.join(', ')}`).join('\n')
  die(
    `Version drift: expected all ${manifests.length} public packages at one version, found ${byVersion.size}:\n${detail}`,
  )
}
const current = manifests[0].pkg.version

// ---- compute next version + changelog lines ----
let next
let lines
try {
  next = bump(current, kind, { allowDowngrade })
  lines =
    note !== undefined
      ? note
          .split('\n')
          .map(l => l.trim())
          .filter(Boolean)
      : commitsForRelease(rootDir, current, { firstRelease })
} catch (e) {
  die(e.message)
}
const date = new Date().toISOString().slice(0, 10)
const block = changelogBlock(next, date, lines)

console.log(
  `${current} → ${next}  (${manifests.length} packages)${write ? '' : '  [dry-run — pass --write to apply]'}`,
)
console.log('\nCHANGELOG block to prepend:')
console.log(
  block
    .split('\n')
    .map(l => `  ${l}`)
    .join('\n'),
)

if (!write) process.exit(0)

// ---- apply ----
for (const { dir, path, pkg } of manifests) {
  pkg.version = next
  writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n')
  prependChangelog(dir, next, block)
}

// ---- post-write verification: every package must now be at `next` ----
const bad = manifests
  .map(m => ({ dir: m.dir, version: JSON.parse(readFileSync(m.path, 'utf8')).version }))
  .filter(m => m.version !== next)
if (bad.length) {
  die(
    `Post-write check failed: ${bad.length} package(s) not at ${next}:\n` +
      bad.map(b => `  ${rel(b.dir)} = ${b.version}`).join('\n'),
  )
}

execFileSync('node', [join(rootDir, 'script/sync-doc-link.mjs')], { stdio: 'inherit' })
console.log(`\nApplied to ${manifests.length} packages + synced doc links.`)
