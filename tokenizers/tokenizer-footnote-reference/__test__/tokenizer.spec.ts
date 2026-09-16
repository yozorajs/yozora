import { createTokenizerTesters } from '@yozora/test-util'
import { DefinitionTokenizerName } from '@yozora/tokenizer-definition'
import FootnoteTokenizer from '@yozora/tokenizer-footnote'
import FootnoteDefinitionTokenizer from '@yozora/tokenizer-footnote-definition'
import { parsers } from 'vitest.setup'
import FootnoteReferenceTokenizer from '../src'

createTokenizerTesters(
  [
    'yozora',
    parsers.gfm
      .useTokenizer(new FootnoteDefinitionTokenizer(), DefinitionTokenizerName)
      .useTokenizer(new FootnoteTokenizer())
      .useTokenizer(new FootnoteReferenceTokenizer()),
  ],
  [
    'yozora',
    parsers.gfmEx
      .useTokenizer(new FootnoteDefinitionTokenizer(), DefinitionTokenizerName)
      .useTokenizer(new FootnoteTokenizer())
      .useTokenizer(new FootnoteReferenceTokenizer()),
  ],
  ['yozora', parsers.yozora],
).forEach(tester => {
  tester.scan(['custom/footnote', 'custom/footnote-definition']).runTest()
})
