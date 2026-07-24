import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { readPackageJson } from './package-json.mjs'

function makePackageJsonFilepath(t) {
  const dir = mkdtempSync(join(tmpdir(), 'yozora-package-json-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return join(dir, 'package.json')
}

test('reads valid public and private package manifests', t => {
  const filepath = makePackageJsonFilepath(t)
  const pkg = { name: '@yozora/example', version: '1.0.0' }
  writeFileSync(filepath, JSON.stringify(pkg))
  assert.deepEqual(readPackageJson(filepath), pkg)

  const privatePkg = { name: '@yozora/private', private: true }
  writeFileSync(filepath, JSON.stringify(privatePkg))
  assert.deepEqual(readPackageJson(filepath), privatePkg)
})

test('only ignores a missing manifest when explicitly allowed', t => {
  const filepath = makePackageJsonFilepath(t)
  assert.equal(readPackageJson(filepath, { allowMissing: true }), null)
  assert.throws(
    () => readPackageJson(filepath),
    err => err.code === 'ENOENT',
  )
})

test('propagates malformed JSON', t => {
  const filepath = makePackageJsonFilepath(t)
  writeFileSync(filepath, '{ invalid json')
  assert.throws(() => readPackageJson(filepath), SyntaxError)
})

test('validates package manifest fields', t => {
  const filepath = makePackageJsonFilepath(t)
  const invalid = [
    null,
    [],
    { version: '1.0.0' },
    { name: '', version: '1.0.0' },
    { name: '@yozora/example', version: 1 },
    { name: '@yozora/example', version: '1.0.0', private: 'false' },
  ]

  for (const pkg of invalid) {
    writeFileSync(filepath, JSON.stringify(pkg))
    assert.throws(() => readPackageJson(filepath), /Invalid package\.json/)
  }
})

test('rethrows non-ENOENT read errors', t => {
  const filepath = makePackageJsonFilepath(t)
  mkdirSync(filepath)
  assert.throws(
    () => readPackageJson(filepath, { allowMissing: true }),
    err => err.code === 'EISDIR' || /EISDIR|illegal operation on a directory/i.test(err.message),
  )
})
