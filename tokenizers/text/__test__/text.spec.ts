import { createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester.scan('gfm/text').runTest(),
)

test('text node should omit position when shouldReservePosition is false', function () {
  const ast = parsers.gfm.parse('foo', { shouldReservePosition: false })
  const paragraph = ast.children[0] as any
  const node = paragraph.children[0]

  expect(paragraph.type).toBe('paragraph')
  expect(paragraph.position).toBeUndefined()
  expect(node.type).toBe('text')
  expect(node.value).toBe('foo')
  expect(node.position).toBeUndefined()
})
