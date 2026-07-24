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
 *   node script/release/version.mjs <patch|minor|major|x.y.z[-tag]> \
 *     [--write] [--note "..."] [--allow-downgrade] [--first-release]
 *   (dry-run by default; pass --write to apply)
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { repositoryRoot } from '../internal/repository.mjs'
import { workspacePackages } from '../internal/workspace.mjs'
import { bump } from './bump.mjs'
import { changelogBlock, commitsForRelease, prependChangelog } from './changelog.mjs'

const USAGE =
  'Usage: node script/release/version.mjs <patch|minor|major|x.y.z[-tag]> [--write] [--note "..."] [--allow-downgrade] [--first-release]'

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
const manifests = workspacePackages()
  .filter(pkg => pkg.manifest.private !== true)
  .map(pkg => ({
    dir: join(repositoryRoot, pkg.dir),
    path: pkg.packageJsonPath,
    pkg: pkg.manifest,
  }))

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
const rel = p => relative(repositoryRoot, p)
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

// ---- compute next version + package-scoped changelog entries ----
let next
let releases
try {
  next = bump(current, kind, { allowDowngrade })
  const noteLines =
    note === undefined
      ? null
      : note
          .split('\n')
          .map(l => l.trim())
          .filter(Boolean)
  const date = new Date().toISOString().slice(0, 10)
  releases = manifests.map(manifest => {
    const lines =
      noteLines ??
      commitsForRelease(repositoryRoot, current, {
        firstRelease,
        pathSpec: rel(manifest.dir),
      })
    return { ...manifest, lines, block: changelogBlock(next, date, lines) }
  })
} catch (e) {
  die(e.message)
}

console.log(
  `${current} → ${next}  (${manifests.length} packages)${write ? '' : '  [dry-run — pass --write to apply]'}`,
)
console.log('\nCHANGELOG entries to prepend:')
for (const { dir, lines } of releases) {
  console.log(`  ${rel(dir)}:`)
  for (const line of lines.length ? lines : [`Release v${next}`]) console.log(`    - ${line}`)
}

if (!write) process.exit(0)

// ---- apply ----
for (const { dir, path, pkg, block } of releases) {
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

execFileSync('node', [join(repositoryRoot, 'script/docs/sync-links.mjs')], { stdio: 'inherit' })
console.log(`\nApplied to ${manifests.length} packages + synced doc links.`)
