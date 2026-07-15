import { createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester.scan('gfm/thematic-break').runTest(),
)

test.each([
  ['gfm', parsers.gfm],
  ['gfmEx', parsers.gfmEx],
  ['yozora', parsers.yozora],
])('%s allows spaces and tabs, but not NBSP, in a thematic break', (_name, parser) => {
  for (const source of ['*\u00a0*\u00a0*', '*\u00a0*\u00a0*\n']) {
    expect(parser.parse(source, { shouldReservePosition: false }).children[0]).toMatchObject({
      type: 'paragraph',
    })
  }

  expect(parser.parse('*\t*\t*', { shouldReservePosition: false })).toEqual({
    type: 'root',
    children: [{ type: 'thematicBreak' }],
  })
})
