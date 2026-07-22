import { createTokenizerTesters } from '@yozora/test-util'
import { DefinitionTokenizerName } from '@yozora/tokenizer-definition'
import FootnoteDefinitionTokenizer from '@yozora/tokenizer-footnote-definition'
import FootnoteReferenceTokenizer from '@yozora/tokenizer-footnote-reference'
import { parsers } from 'vitest.setup'
import FootnoteTokenizer from '../src'

createTokenizerTesters(
  parsers.gfm
    .useTokenizer(new FootnoteDefinitionTokenizer(), DefinitionTokenizerName)
    .useTokenizer(new FootnoteTokenizer())
    .useTokenizer(new FootnoteReferenceTokenizer()),
  parsers.gfmEx
    .useTokenizer(new FootnoteDefinitionTokenizer(), DefinitionTokenizerName)
    .useTokenizer(new FootnoteTokenizer())
    .useTokenizer(new FootnoteReferenceTokenizer()),
  parsers.yozora,
).forEach(tester => tester.scan(['custom/footnote', 'custom/footnote-definition']).runTest())

test('does not nest inline footnotes', () => {
  expect(parsers.yozora.parse('^[outer ^[inner]]', { shouldReservePosition: false })).toEqual({
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          { type: 'text', value: '^[outer ' },
          { type: 'footnote', children: [{ type: 'text', value: 'inner' }] },
          { type: 'text', value: ']' },
        ],
      },
    ],
  })
})

test('does not nest inline footnotes through another inline token', () => {
  expect(
    parsers.yozora.parse('^[outer [label ^[inner]](/url)]', {
      shouldReservePosition: false,
    }),
  ).toEqual({
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          { type: 'text', value: '^[outer ' },
          {
            type: 'link',
            url: '/url',
            children: [
              { type: 'text', value: 'label ' },
              { type: 'footnote', children: [{ type: 'text', value: 'inner' }] },
            ],
          },
          { type: 'text', value: ']' },
        ],
      },
    ],
  })
})
