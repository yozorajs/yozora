/* eslint-disable import/no-extraneous-dependencies */
import { DefinitionTokenizerName } from '@yozora/tokenizer-definition'
import FootnoteDefinitionTokenizer from '@yozora/tokenizer-footnote-definition'
import FootnoteReferenceTokenizer from '@yozora/tokenizer-footnote-reference'
import { createTesters, parsers } from '../../../jest.setup'
import FootnoteTokenizer from '../src'

createTesters(
  parsers.gfm
    .useTokenizer(new FootnoteDefinitionTokenizer(), DefinitionTokenizerName)
    .useTokenizer(new FootnoteTokenizer())
    .useTokenizer(new FootnoteReferenceTokenizer()),
  parsers.gfmEx
    .useTokenizer(new FootnoteDefinitionTokenizer(), DefinitionTokenizerName)
    .useTokenizer(new FootnoteTokenizer())
    .useTokenizer(new FootnoteReferenceTokenizer()),
  parsers.yozora,
).forEach(tester =>
  tester.scan(['custom/footnote', 'custom/footnote-definition']).runTest(),
)
