import { createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester.scan('gfm/inline-code').runTest(),
)

test('handles many unmatched backtick candidates', function () {
  const size = 10_000
  const ast = parsers.gfm.parse('\\``x'.repeat(size))
  const text = (ast.children[0] as any).children[0]

  expect(text.type).toBe('text')
  expect(text.value).toBe('``x'.repeat(size))
})
