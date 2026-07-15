import { createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester.scan('gfm/setext-heading').runTest(),
)

test.each([
  ['gfm', parsers.gfm],
  ['gfmEx', parsers.gfmEx],
  ['yozora', parsers.yozora],
])('%s allows trailing spaces and tabs, but not NBSP, in a setext underline', (_name, parser) => {
  for (const source of ['foo\n---\u00a0', 'foo\n---\u00a0\n']) {
    expect(parser.parse(source, { shouldReservePosition: false }).children[0]).toMatchObject({
      type: 'paragraph',
    })
  }

  expect(parser.parse('foo\n---\t', { shouldReservePosition: false })).toEqual({
    type: 'root',
    children: [
      {
        type: 'heading',
        depth: 2,
        children: [{ type: 'text', value: 'foo' }],
      },
    ],
  })
})
