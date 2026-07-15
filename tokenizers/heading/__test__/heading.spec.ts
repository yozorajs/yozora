import { createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester.scan('gfm/heading').runTest(),
)

test.each([
  ['gfm', parsers.gfm],
  ['gfmEx', parsers.gfmEx],
  ['yozora', parsers.yozora],
])('%s rejects unspaced ATX heading content with or without a line ending', (_name, parser) => {
  for (const source of ['#x', '#x\n']) {
    expect(parser.parse(source, { shouldReservePosition: false })).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value: '#x' }],
        },
      ],
    })
  }
})
