import { InlineCodeTokenizerName } from '@yozora/tokenizer-inline-code'
import { createTesters, parsers } from '../../../jest.setup'
import InlineMathTokenizer from '../src'

createTesters(
  parsers.gfm.useTokenizer(new InlineMathTokenizer(), InlineCodeTokenizerName),
  parsers.gfmEx.useTokenizer(
    new InlineMathTokenizer(),
    InlineCodeTokenizerName,
  ),
  parsers.yozora,
).forEach(tester => tester.scan('custom/inline-math').runTest())
