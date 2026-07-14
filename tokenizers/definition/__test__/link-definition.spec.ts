import { createTokenizerTesters } from '@yozora/test-util'
import { parsers } from 'vitest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester
    .scan(['gfm/definition', 'gfm/link-reference', 'gfm/image-reference', 'custom/definition'])
    .runTest(),
)

test.each([
  ['gfm', parsers.gfm],
  ['gfmEx', parsers.gfmEx],
  ['yozora', parsers.yozora],
])('%s parses a destination and title on the line after a definition label', (_name, parser) => {
  expect(
    parser.parse('[foo]:\n/url "title"', {
      shouldReservePosition: false,
    }),
  ).toEqual({
    type: 'root',
    children: [
      {
        type: 'definition',
        identifier: 'foo',
        label: 'foo',
        url: '/url',
        title: 'title',
      },
    ],
  })
})
