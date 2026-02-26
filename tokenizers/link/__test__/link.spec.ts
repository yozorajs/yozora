import { createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester.scan('gfm/link').runTest(),
)

test('link node should omit position when shouldReservePosition is false', function () {
  const ast = parsers.gfm.parse('[home](https://example.com "site")', {
    shouldReservePosition: false,
  })
  const node = (ast.children[0] as any).children[0]

  expect(node.type).toBe('link')
  expect(node.url).toBe('https://example.com')
  expect(node.title).toBe('site')
  expect(node.position).toBeUndefined()
})
