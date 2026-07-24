import assert from 'node:assert/strict'
import { test } from 'node:test'
import { replaceVersionLinks } from './sync-links.mjs'

test('replaces stable and prerelease version links', () => {
  const nextVersion = '2.4.0-alpha.1'
  for (const currentVersion of ['2.3.17', '2.4.0-alpha.0', '2.4.0-rc.1+build.5']) {
    const content =
      `https://github.com/yozorajs/yozora/tree/v${currentVersion}/packages/ast#readme\n` +
      `https://github.com/yozorajs/yozora/blob/v${currentVersion}/packages/ast/README.md`
    const expected =
      `https://github.com/yozorajs/yozora/tree/v${nextVersion}/packages/ast#readme\n` +
      `https://github.com/yozorajs/yozora/blob/v${nextVersion}/packages/ast/README.md`

    assert.equal(replaceVersionLinks(content, nextVersion), expected)
  }
})

test('does not replace non-version tags or links to other repositories', () => {
  const content =
    'https://github.com/yozorajs/yozora/tree/vnext/packages/ast\n' +
    'https://github.com/example/yozora/tree/v2.3.17/packages/ast'
  assert.equal(replaceVersionLinks(content, '2.4.0'), content)
})
