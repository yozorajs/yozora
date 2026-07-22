import { createTokenizerTesters } from '@yozora/test-util'
import { InlineCodeTokenizerName } from '@yozora/tokenizer-inline-code'
import { InlineMathTokenizerName } from '@yozora/tokenizer-inline-math'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'
import InlineMathTokenizer from '../src'

createTokenizerTesters(
  parsers.gfm
    .useTokenizer(new InlineMathTokenizer({ backtickRequired: true }), InlineCodeTokenizerName)
    .useTokenizer(new InlineMathTokenizer({ backtickRequired: false })),
  parsers.gfmEx
    .useTokenizer(new InlineMathTokenizer({ backtickRequired: true }), InlineCodeTokenizerName)
    .useTokenizer(new InlineMathTokenizer({ backtickRequired: false })),
  parsers.yozora,
).forEach(tester =>
  tester.scan(['custom/inline-math', '!custom/inline-math/backtick-required']).runTest(),
)

createTokenizerTesters(
  parsers.gfm.useTokenizer(
    new InlineMathTokenizer({ backtickRequired: true }),
    InlineCodeTokenizerName,
  ),
  parsers.gfmEx.useTokenizer(
    new InlineMathTokenizer({ backtickRequired: true }),
    InlineCodeTokenizerName,
  ),
  parsers.yozora.unmountTokenizer(InlineMathTokenizerName),
).forEach(tester => tester.scan('custom/inline-math/backtick-required').runTest())

test('handles many unmatched backtick candidates', function () {
  const size = 10_000
  const parser = parsers.gfm
    .unmountTokenizer(InlineCodeTokenizerName)
    .useTokenizer(new InlineMathTokenizer({ backtickRequired: true }))
  const value = '`$x'.repeat(size)
  const ast = parser.parse(value)
  const text = (ast.children[0] as any).children[0]

  expect(text.type).toBe('text')
  expect(text.value).toBe(value)
})

test.each([
  ['optional backticks', '$\tfoo\t$'],
  ['required backticks', '`$\tfoo\t$`'],
])('preserves boundary tabs with %s', (_, source) => {
  const ast = parsers.yozora.parse(source)
  const inlineMath = (ast.children[0] as any).children[0]

  expect(inlineMath).toMatchObject({ type: 'inlineMath', value: '\tfoo\t' })
})
