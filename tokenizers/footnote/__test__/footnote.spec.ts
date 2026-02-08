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
