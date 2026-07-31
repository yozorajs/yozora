import { LinkReferenceType } from '@yozora/ast'
import type { LinkReference, Parent } from '@yozora/ast'
import { DefaultParser } from '@yozora/core-parser'
import InlineCodeTokenizer from '@yozora/tokenizer-inline-code'
import LinkReferenceTokenizer from '@yozora/tokenizer-link-reference'
import ParagraphTokenizer from '@yozora/tokenizer-paragraph'
import TextTokenizer from '@yozora/tokenizer-text'
import { expect, test } from 'vitest'

test('materializes an inactive inline delimiter only once', () => {
  const parser = new DefaultParser({
    blockFallbackTokenizer: new ParagraphTokenizer(),
    inlineFallbackTokenizer: new TextTokenizer(),
  })
    .useTokenizer(new InlineCodeTokenizer())
    .useTokenizer(new LinkReferenceTokenizer())

  const ast = parser.parse('][foo][`x`]x][bar]', {
    shouldReservePosition: false,
    presetDefinitions: [
      { identifier: 'foo', label: 'foo' },
      { identifier: 'bar', label: 'bar' },
    ],
  })
  const paragraph = ast.children[0] as Parent
  const references = paragraph.children.filter(
    (node): node is LinkReference => node.type === LinkReferenceType,
  )

  expect(references.filter(node => node.identifier === 'foo')).toHaveLength(1)
})
