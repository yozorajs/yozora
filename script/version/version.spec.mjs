import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, test } from 'node:test'

const here = dirname(fileURLToPath(import.meta.url))
const cli = join(here, 'version.mjs')
const rootDir = join(here, '..', '..')

/** Run the CLI in dry-run (no --write, no side effects). Never throws on non-zero exit. */
function run(args) {
  try {
    const stdout = execFileSync('node', [cli, ...args], { cwd: rootDir, encoding: 'utf8' })
    return { status: 0, stdout, stderr: '' }
  } catch (e) {
    return { status: e.status ?? 1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' }
  }
}

describe('version.mjs CLI — argv validation', () => {
  test('missing bump type -> usage error', () => {
    const r = run([])
    assert.equal(r.status, 1)
    assert.match(r.stderr, /Missing bump type|Usage/)
  })

  test('--note without a value -> error', () => {
    const r = run(['minor', '--note'])
    assert.equal(r.status, 1)
    assert.match(r.stderr, /--note requires a value/)
  })

  test('unknown option -> error', () => {
    const r = run(['minor', '--bogus'])
    assert.equal(r.status, 1)
    assert.match(r.stderr, /Unknown option/)
  })

  test('extra positional argument -> error', () => {
    const r = run(['minor', 'extra'])
    assert.equal(r.status, 1)
    assert.match(r.stderr, /Unexpected extra argument/)
  })
})

describe('version.mjs CLI — release-safety guards', () => {
  test('invalid exact version -> error (F-001)', () => {
    const r = run(['02.4.0', '--first-release'])
    assert.equal(r.status, 1)
    assert.match(r.stderr, /Invalid exact version/)
  })

  test('downgrade -> error (F-001)', () => {
    const r = run(['0.0.1', '--first-release'])
    assert.equal(r.status, 1)
    assert.match(r.stderr, /must be greater than current/)
  })

  test('valid dry-run with --first-release succeeds and previews a changelog block', () => {
    const r = run(['minor', '--first-release'])
    assert.equal(r.status, 0)
    assert.match(r.stdout, /\(41 packages\)/)
    assert.match(r.stdout, /CHANGELOG block to prepend:/)
  })
})
