import { createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'
import DeleteTokenizer from '../src'

createTokenizerTesters(
  parsers.gfm.useTokenizer(new DeleteTokenizer()),
  parsers.gfmEx,
  parsers.yozora,
).forEach(tester => tester.scan('gfm/delete').runTest())

test('delete node should omit position when shouldReservePosition is false', function () {
  const parser = parsers.gfm.useTokenizer(new DeleteTokenizer())
  const ast = parser.parse('~~deleted~~', { shouldReservePosition: false })
  const node = (ast.children[0] as any).children[0]

  expect(node.type).toBe('delete')
  expect(node.position).toBeUndefined()
})
