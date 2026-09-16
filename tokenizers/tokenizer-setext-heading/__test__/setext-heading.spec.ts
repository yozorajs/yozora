import { expect, test } from 'vitest'
import { parsers, scanGfmFixtures } from 'vitest.setup'
import { createTokenizerTesters } from '../../../script/test/index.mjs'

createTokenizerTesters(
  ['gfm', parsers.gfm],
  ['gfm-ex', parsers.gfmEx],
  ['yozora', parsers.yozora],
).forEach(tester => {
  scanGfmFixtures(tester, { includeGroups: ['setext-heading'] }).runTest()
})

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
