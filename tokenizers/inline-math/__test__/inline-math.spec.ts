import { createTokenizerTesters } from '@yozora/jest-for-tokenizer'
import { InlineCodeTokenizerName } from '@yozora/tokenizer-inline-code'
import { InlineMathTokenizerName } from '@yozora/tokenizer-inline-math'
import { parsers } from 'jest.setup'
import InlineMathTokenizer from '../src'

createTokenizerTesters(
  parsers.gfm
    .useTokenizer(new InlineMathTokenizer({ backtickRequired: true }), InlineCodeTokenizerName)
    .useTokenizer(new InlineMathTokenizer({ backtickRequired: false })),
  parsers.gfmEx
    .useTokenizer(new InlineMathTokenizer({ backtickRequired: true }), InlineCodeTokenizerName)
    .useTokenizer(new InlineMathTokenizer({ backtickRequired: false })),
  parsers.yozora,
).forEach(tester =>
  tester.scan(['custom/inline-math', '!custom/inline-math/backtick-required']).runTest(),
)

createTokenizerTesters(
  parsers.gfm.useTokenizer(
    new InlineMathTokenizer({ backtickRequired: true }),
    InlineCodeTokenizerName,
  ),
  parsers.gfmEx.useTokenizer(
    new InlineMathTokenizer({ backtickRequired: true }),
    InlineCodeTokenizerName,
  ),
  parsers.yozora.unmountTokenizer(InlineMathTokenizerName),
).forEach(tester => tester.scan('custom/inline-math/backtick-required').runTest())
