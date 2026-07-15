import { createTokenizerTesters } from '@yozora/test-util'
import { DefinitionTokenizerName } from '@yozora/tokenizer-definition'
import FootnoteTokenizer from '@yozora/tokenizer-footnote'
import FootnoteReferenceTokenizer from '@yozora/tokenizer-footnote-reference'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'
import FootnoteDefinitionTokenizer from '../src'

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

test('recognizes a footnote definition after partial-tab indentation', () => {
  const parser = parsers.gfm
    .useTokenizer(new FootnoteDefinitionTokenizer(), DefinitionTokenizerName)
    .useTokenizer(new FootnoteTokenizer())
    .useTokenizer(new FootnoteReferenceTokenizer())
  const ast = parser.parse('1234. foo\n\n\t  \t[^1]: /url')
  const listItem = (ast.children[0] as any).children[0]

  expect(listItem.children[1].type).toBe('footnoteDefinition')
})

test('recognizes escaped-only and maximum-length footnote labels', () => {
  const escapedLabelAst = parsers.yozora.parse('[^\\]]: note\n\n[^\\]]')
  const maximumLabel = 'a'.repeat(999)
  const maximumLabelAst = parsers.yozora.parse(`[^${maximumLabel}]: note`)

  expect(escapedLabelAst.children[0]).toMatchObject({
    type: 'footnoteDefinition',
    label: '\\]',
  })
  expect((escapedLabelAst.children[1] as any).children[0]).toMatchObject({
    type: 'footnoteReference',
    label: '\\]',
  })
  expect(maximumLabelAst.children[0]).toMatchObject({
    type: 'footnoteDefinition',
    label: maximumLabel,
  })
})
