import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { workspacePackages, yozoraWorkspacePackages } from './workspace.mjs'

/**
 * Build a throwaway workspace root under the OS temp dir, registered for cleanup
 * when the test finishes. Each entry seeds a directory under `packages/` or
 * `tokenizers/`; a null `json` means the dir has no package.json at all.
 */
function makeRoot(t, entries) {
  const root = mkdtempSync(join(tmpdir(), 'yozora-workspace-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  for (const ws of ['packages', 'tokenizers']) mkdirSync(join(root, ws), { recursive: true })
  for (const { ws, dir, json } of entries) {
    const target = join(root, ws, dir)
    mkdirSync(target, { recursive: true })
    if (json !== null) writeFileSync(join(target, 'package.json'), json)
  }
  return root
}

test('collects workspace packages once and derives @yozora aliases', t => {
  const root = makeRoot(t, [
    {
      ws: 'packages',
      dir: 'table',
      json: JSON.stringify({ name: '@yozora/table', version: '1.0.0' }),
    },
    {
      ws: 'packages',
      dir: 'ast',
      json: JSON.stringify({ name: '@yozora/ast', version: '1.0.0' }),
    },
    {
      ws: 'packages',
      dir: 'other',
      json: JSON.stringify({ name: 'not-yozora', version: '1.0.0' }),
    },
    { ws: 'tokenizers', dir: 'plain', json: null },
    {
      ws: 'tokenizers',
      dir: 'link',
      json: JSON.stringify({ name: '@yozora/link', version: '1.0.0' }),
    },
  ])
  const packages = workspacePackages(root)
  assert.deepEqual(
    packages.map(pkg => pkg.name),
    ['@yozora/ast', '@yozora/link', '@yozora/table', 'not-yozora'],
  )
  assert.equal(packages.find(pkg => pkg.name === '@yozora/link').dir, 'tokenizers/link')
  assert.deepEqual(
    yozoraWorkspacePackages(root).map(pkg => pkg.name),
    ['@yozora/ast', '@yozora/link', '@yozora/table'],
  )
})

test('throws on duplicate package names, naming both directories', t => {
  const root = makeRoot(t, [
    {
      ws: 'packages',
      dir: 'a',
      json: JSON.stringify({ name: '@yozora/dup', version: '1.0.0' }),
    },
    {
      ws: 'tokenizers',
      dir: 'b',
      json: JSON.stringify({ name: '@yozora/dup', version: '1.0.0' }),
    },
  ])
  assert.throws(
    () => workspacePackages(root),
    err => {
      assert.match(err.message, /Duplicate workspace package name @yozora\/dup/)
      assert.match(err.message, /packages\/a/)
      assert.match(err.message, /tokenizers\/b/)
      return true
    },
  )
})

test('throws on a package.json with a missing name', t => {
  const root = makeRoot(t, [
    { ws: 'packages', dir: 'a', json: JSON.stringify({ version: '1.0.0' }) },
  ])
  assert.throws(() => workspacePackages(root), /expected a non-empty string "name"/)
})

test('throws on a package.json with a non-string name', t => {
  const root = makeRoot(t, [
    { ws: 'packages', dir: 'a', json: JSON.stringify({ name: 123, version: '1.0.0' }) },
  ])
  assert.throws(() => workspacePackages(root), /expected a non-empty string "name"/)
})

test('propagates malformed package.json (JSON.parse throws)', t => {
  const root = makeRoot(t, [{ ws: 'packages', dir: 'a', json: '{ not valid json' }])
  assert.throws(() => workspacePackages(root))
})

test('rethrows a non-ENOENT read error (package.json is a directory -> EISDIR)', t => {
  const root = mkdtempSync(join(tmpdir(), 'yozora-workspace-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  for (const ws of ['packages', 'tokenizers']) mkdirSync(join(root, ws), { recursive: true })
  const pkgDir = join(root, 'packages', 'a')
  mkdirSync(pkgDir, { recursive: true })
  // package.json is itself a directory -> readFileSync throws EISDIR (not ENOENT),
  // which must propagate rather than be swallowed as "no package.json".
  mkdirSync(join(pkgDir, 'package.json'))
  assert.throws(
    () => workspacePackages(root),
    err => err.code === 'EISDIR' || /EISDIR|illegal operation on a directory/i.test(err.message),
  )
})
