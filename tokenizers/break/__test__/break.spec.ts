import { createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester.scan('gfm/break').runTest(),
)

test.each([
  ['spaces', 'foo  \nbar'],
  ['backslash', 'foo\\\nbar'],
  ['CRLF', 'foo  \r\nbar'],
])('the %s hard break owns its line ending', (_, input) => {
  expect(parsers.gfm.parse(input, { shouldReservePosition: false })).toEqual({
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          { type: 'text', value: 'foo' },
          { type: 'break' },
          { type: 'text', value: 'bar' },
        ],
      },
    ],
  })
})

test('keeps a soft break in its text node', () => {
  expect(parsers.gfm.parse('foo\nbar', { shouldReservePosition: false })).toMatchObject({
    children: [{ children: [{ type: 'text', value: 'foo\nbar' }] }],
  })
})

test.each([
  ['LF', 'foo  \nbar', 6, 1, 6],
  ['CRLF', 'foo  \r\nbar', 7, 1, 7],
  ['LF before stripped indentation', 'foo  \n     bar', 6, 6, 11],
])(
  'the hard break position includes its %s line ending',
  (_, input, lineStartOffset, textColumn, textOffset) => {
    expect(parsers.gfm.parse(input)).toMatchObject({
      children: [
        {
          children: [
            { type: 'text', value: 'foo' },
            {
              type: 'break',
              position: {
                start: { line: 1, column: 4, offset: 3 },
                end: { line: 2, column: 1, offset: lineStartOffset },
              },
            },
            {
              type: 'text',
              position: {
                start: { line: 2, column: textColumn, offset: textOffset },
              },
              value: 'bar',
            },
          ],
        },
      ],
    })
  },
)
