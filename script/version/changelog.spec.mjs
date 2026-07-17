import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, test } from 'node:test'
import { changelogBlock, commitsForRelease, prependChangelog } from './changelog.mjs'

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

  test('rethrows non-ENOENT read errors', () => {
    mkdirSync(join(dir, 'CHANGELOG.md'))
    assert.throws(
      () => prependChangelog(dir, '2.4.0', changelogBlock('2.4.0', '2026-07-01', ['a'])),
      err => err.code === 'EISDIR' || /EISDIR|illegal operation on a directory/i.test(err.message),
    )
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

// Self-contained: each test builds a throwaway git repo with controlled tags, so
// the git-integration logic is exercised WITHOUT depending on this repo's real
// history/tags — which a shallow CI checkout (actions/checkout default) lacks.
describe('commitsForRelease (isolated git repo)', () => {
  let dir
  const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'ignore' })
  const commit = subject => git('commit', '--allow-empty', '-q', '-m', subject)
  const commitFile = (subject, file) => {
    const path = join(dir, file)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, `${subject}\n`)
    git('add', '--', file)
    git('commit', '-q', '-m', subject)
  }
  const revParse = ref =>
    execFileSync('git', ['rev-parse', ref], { cwd: dir, encoding: 'utf8' }).trim()

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'yozora-git-'))
    git('init', '-q')
    git('config', 'user.email', 'test@example.com')
    git('config', 'user.name', 'Test')
    git('config', 'commit.gpgsign', 'false')
    git('config', 'tag.gpgsign', 'false')
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  test('range since v<current>, newest first, dropping :bookmark: release commits', () => {
    commit('chore: base')
    git('tag', 'v1.0.0')
    commit(':sparkles: feat: a')
    commit(':bookmark: release: v1.0.0')
    commit(':bug: fix: b')
    assert.deepEqual(commitsForRelease(dir, '1.0.0'), [':bug: fix: b', ':sparkles: feat: a'])
  })

  test('path spec includes only commits touching that package directory', () => {
    commitFile('chore: base', 'README.md')
    git('tag', 'v1.0.0')
    commitFile(':sparkles: feat(pkg-a): add a', 'packages/a/index.ts')
    commitFile(':bug: fix(pkg-b): fix b', 'packages/b/index.ts')
    commitFile(':wrench: chore(tooling): update root config', 'eslint.config.mjs')

    assert.deepEqual(commitsForRelease(dir, '1.0.0', { pathSpec: 'packages/a' }), [
      ':sparkles: feat(pkg-a): add a',
    ])
    assert.deepEqual(commitsForRelease(dir, '1.0.0', { pathSpec: 'packages/b' }), [
      ':bug: fix(pkg-b): fix b',
    ])
    assert.deepEqual(commitsForRelease(dir, '1.0.0', { pathSpec: 'packages/c' }), [])
  })

  test('missing previous-release tag throws', () => {
    commit('chore: base')
    git('tag', 'v1.0.0')
    commit('feat: a')
    assert.throws(() => commitsForRelease(dir, '2.0.0'), /Expected previous-release tag/)
  })

  test('firstRelease falls back to the latest v* tag, not the full history', () => {
    commit('chore: before-tag')
    git('tag', 'v1.0.0')
    commit('feat: since-tag')
    const viaFirst = commitsForRelease(dir, '2.0.0', { firstRelease: true })
    assert.deepEqual(viaFirst, commitsForRelease(dir, '1.0.0')) // == latest-tag range
    assert.ok(!viaFirst.includes('chore: before-tag')) // excludes history before the tag
  })

  test('firstRelease with no v* tag at all uses the full history', () => {
    commit('feat: first')
    commit('feat: second')
    assert.deepEqual(commitsForRelease(dir, '1.0.0', { firstRelease: true }), [
      'feat: second',
      'feat: first',
    ])
  })

  test('a tag not on HEAD ancestry is rejected (F-003 non-ancestor path)', () => {
    commit('chore: base')
    const base = revParse('HEAD')
    commit(':sparkles: feat: main-line')
    const mainHead = revParse('HEAD')
    git('checkout', '-q', '-b', '_side', base)
    commit('feat: divergent')
    git('tag', 'v1.0.0') // v1.0.0 points at a commit NOT in HEAD's history
    git('checkout', '-q', mainHead)
    assert.throws(() => commitsForRelease(dir, '1.0.0'), /not an ancestor/)
  })
})
