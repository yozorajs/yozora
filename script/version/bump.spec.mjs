import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { bump, compare } from './bump.mjs'

describe('compare', () => {
  test('major/minor/patch precedence', () => {
    assert.ok(compare('2.4.0', '2.3.16') > 0)
    assert.ok(compare('2.3.16', '2.4.0') < 0)
    assert.equal(compare('2.3.16', '2.3.16'), 0)
  })

  test('a prerelease ranks below the same release', () => {
    assert.ok(compare('2.4.0-alpha.0', '2.4.0') < 0)
    assert.ok(compare('2.4.0-alpha.0', '2.3.16') > 0) // preview > current — the main use case
  })

  test('numeric prerelease identifiers compare numerically, not lexically', () => {
    assert.ok(compare('2.4.0-alpha.2', '2.4.0-alpha.10') < 0)
    assert.ok(compare('2.4.0-alpha.1', '2.4.0-alpha.0') > 0)
  })

  test('alphanumeric prerelease identifiers compare lexically', () => {
    assert.ok(compare('2.4.0-beta', '2.4.0-alpha') > 0)
  })

  test('build metadata is ignored for precedence', () => {
    assert.equal(compare('2.4.0+build.5', '2.4.0'), 0)
  })

  test('throws on non-SemVer input', () => {
    assert.throws(() => compare('2.4', '2.3.16'))
    assert.throws(() => compare('2.4.0', 'nope'))
  })
})

describe('bump — keyword', () => {
  test('patch / minor / major', () => {
    assert.equal(bump('2.3.16', 'patch'), '2.3.17')
    assert.equal(bump('2.3.16', 'minor'), '2.4.0')
    assert.equal(bump('2.3.16', 'major'), '3.0.0')
  })

  test('unknown keyword throws', () => {
    assert.throws(() => bump('2.3.16', 'nope'), /Unknown bump type/)
  })
})

describe('bump — exact version', () => {
  test('accepts valid exact / preview / build-metadata versions', () => {
    assert.equal(bump('2.3.16', '2.4.0'), '2.4.0')
    assert.equal(bump('2.3.16', '2.4.0-alpha.0'), '2.4.0-alpha.0')
    assert.equal(bump('2.3.16', '2.4.0-rc.1'), '2.4.0-rc.1')
    assert.equal(bump('2.3.16', '2.4.0+build.5'), '2.4.0+build.5')
    assert.equal(bump('2.3.16', '2.4.0-alpha.1+build.5'), '2.4.0-alpha.1+build.5')
  })

  test('rejects invalid exact versions (strict SemVer grammar)', () => {
    const invalid = [
      '02.4.0', // leading zero in core
      '2.04.0',
      '2.4.00',
      '2.4.0oops', // trailing garbage
      '2.4.0.1', // four segments
      '2.4.0-alpha..0', // empty prerelease identifier
      '2.4.0-alpha.01', // leading-zero numeric prerelease identifier
      '2.4.0+', // empty build metadata
    ]
    for (const v of invalid) {
      assert.throws(() => bump('2.3.16', v), /Invalid exact version/, `should reject ${v}`)
    }
  })
})

describe('bump — monotonic guard', () => {
  test('rejects downgrade and same version by default', () => {
    assert.throws(() => bump('2.3.16', '2.3.15'), /must be greater than current/)
    assert.throws(() => bump('2.3.16', '2.3.16'), /must be greater than current/)
  })

  test('allowDowngrade permits an equal or lower version', () => {
    assert.equal(bump('2.3.16', '2.3.16', { allowDowngrade: true }), '2.3.16')
    assert.equal(bump('2.3.16', '2.3.15', { allowDowngrade: true }), '2.3.15')
  })
})
