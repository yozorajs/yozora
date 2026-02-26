import { createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester.scan('gfm/image').runTest(),
)

test('image node should omit position when shouldReservePosition is false', function () {
  const ast = parsers.gfm.parse('![alt](<https://example.com> "title")', {
    shouldReservePosition: false,
  })
  const node = (ast.children[0] as any).children[0]

  expect(node.type).toBe('image')
  expect(node.url).toBe('https://example.com')
  expect(node.alt).toBe('alt')
  expect(node.title).toBe('title')
  expect(node.position).toBeUndefined()
})
