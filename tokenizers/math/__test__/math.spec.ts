import { createTokenizerTesters } from '@yozora/jest-for-tokenizer'
import { InlineCodeTokenizerName } from '@yozora/tokenizer-inline-code'
import InlineMathTokenizer from '@yozora/tokenizer-inline-math'
import { parsers } from 'jest.setup'
import MathTokenizer from '../src'

createTokenizerTesters(
  parsers.gfm
    .useTokenizer(new MathTokenizer())
    .useTokenizer(new InlineMathTokenizer({ backtickRequired: false }), InlineCodeTokenizerName),
  parsers.gfmEx
    .useTokenizer(new MathTokenizer())
    .useTokenizer(new InlineMathTokenizer({ backtickRequired: false }), InlineCodeTokenizerName),
  parsers.yozora,
).forEach(tester => tester.scan('custom/math').runTest())
