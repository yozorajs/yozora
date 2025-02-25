import { createTokenizerTesters } from '@yozora/jest-for-tokenizer'
import { DefinitionTokenizerName } from '@yozora/tokenizer-definition'
import FootnoteTokenizer from '@yozora/tokenizer-footnote'
import FootnoteDefinitionTokenizer from '@yozora/tokenizer-footnote-definition'
import { parsers } from 'jest.setup'
import FootnoteReferenceTokenizer from '../src'

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
