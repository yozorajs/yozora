import { createTokenizerTesters } from '@yozora/jest-for-tokenizer'
import { DefinitionTokenizerName } from '@yozora/tokenizer-definition'
import FootnoteTokenizer from '@yozora/tokenizer-footnote'
import FootnoteReferenceTokenizer from '@yozora/tokenizer-footnote-reference'
import { parsers } from 'jest.setup'
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
