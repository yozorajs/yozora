import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, test } from 'node:test'
import { changelogBlock, commitsForRelease, prependChangelog } from './changelog.mjs'

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

describe('changelogBlock', () => {
  test('empty lines fall back to "Release v<version>"', () => {
    assert.equal(
      changelogBlock('2.4.0', '2026-07-01', []),
      '## 2.4.0 (2026-07-01)\n\n- Release v2.4.0\n',
    )
  })

  test('one bullet per line', () => {
    const block = changelogBlock('2.4.0', '2026-07-01', [':sparkles: feat: a', ':bug: fix: b'])
    assert.equal(block, '## 2.4.0 (2026-07-01)\n\n- :sparkles: feat: a\n- :bug: fix: b\n')
  })
})

describe('prependChangelog', () => {
  let dir
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'yozora-changelog-'))
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  const read = () => readFileSync(join(dir, 'CHANGELOG.md'), 'utf8')

  test('creates the file with a header when absent', () => {
    prependChangelog(dir, '2.4.0', changelogBlock('2.4.0', '2026-07-01', ['a']))
    assert.match(read(), /^# Change Log\n\n## 2\.4\.0 \(2026-07-01\)\n/)
  })

  test('is idempotent for the same top version (safe to re-run a release)', () => {
    const block = changelogBlock('2.4.0', '2026-07-01', ['a'])
    prependChangelog(dir, '2.4.0', block)
    prependChangelog(dir, '2.4.0', block)
    assert.equal((read().match(/^## 2\.4\.0 /gm) ?? []).length, 1)
  })

  test('prepends a new version above the old, preserving history', () => {
    prependChangelog(dir, '2.4.0', changelogBlock('2.4.0', '2026-07-01', ['a']))
    prependChangelog(dir, '2.5.0', changelogBlock('2.5.0', '2026-07-02', ['b']))
    const c = read()
    assert.ok(c.includes('## 2.4.0'))
    assert.ok(c.indexOf('## 2.5.0') < c.indexOf('## 2.4.0'))
  })
})

// Integration: exercises the real git in this repo. All git calls are read-only
// (rev-parse / merge-base / log). Uses a version whose tag cannot exist to test
// the missing-tag / firstRelease branches, and v2.3.13 (a real ancestor tag) for
// the happy path. The non-ancestor branch needs a divergent tag (a git write) and
// is left to inspection.
describe('commitsForRelease (reads this repo git, read-only)', () => {
  test('missing previous-release tag throws', () => {
    assert.throws(() => commitsForRelease(rootDir, '99.99.99'), /Expected previous-release tag/)
  })

  test('firstRelease bypasses the tag requirement and drops release commits', () => {
    const commits = commitsForRelease(rootDir, '99.99.99', { firstRelease: true })
    assert.ok(Array.isArray(commits) && commits.length > 0)
    assert.ok(commits.every(s => !s.startsWith(':bookmark:')))
  })

  test('an existing ancestor tag yields its commit range', () => {
    const commits = commitsForRelease(rootDir, '2.3.13')
    assert.ok(Array.isArray(commits) && commits.length > 0)
  })
})
