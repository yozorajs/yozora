import { InlineCodeTokenizerName } from '@yozora/tokenizer-inline-code'
import InlineMathTokenizer from '@yozora/tokenizer-inline-math'
import { parsers } from 'vitest.setup'
import { createTokenizerTesters } from '../../../script/test/index.mjs'
import MathTokenizer from '../src'

createTokenizerTesters(
  [
    'yozora',
    parsers.gfm
      .useTokenizer(new MathTokenizer())
      .useTokenizer(new InlineMathTokenizer({ backtickRequired: true }), InlineCodeTokenizerName)
      .useTokenizer(new InlineMathTokenizer({ backtickRequired: false }), InlineCodeTokenizerName),
  ],
  [
    'yozora',
    parsers.gfmEx
      .useTokenizer(new MathTokenizer())
      .useTokenizer(new InlineMathTokenizer({ backtickRequired: true }), InlineCodeTokenizerName)
      .useTokenizer(new InlineMathTokenizer({ backtickRequired: false }), InlineCodeTokenizerName),
  ],
  ['yozora', parsers.yozora],
).forEach(tester => {
  tester.scan('custom/math').runTest()
})
