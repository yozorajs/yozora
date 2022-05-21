import { createTokenizerTesters } from '@yozora/jest-for-tokenizer'
import { InlineCodeTokenizerName } from '@yozora/tokenizer-inline-code'
import { parsers } from 'jest.setup'
import InlineMathTokenizer from '../src'

createTokenizerTesters(
  parsers.gfm.useTokenizer(
    new InlineMathTokenizer({ backtickRequired: false }),
    InlineCodeTokenizerName,
  ),
  parsers.gfmEx.useTokenizer(
    new InlineMathTokenizer({ backtickRequired: false }),
    InlineCodeTokenizerName,
  ),
  parsers.yozora.replaceTokenizer(
    new InlineMathTokenizer({ backtickRequired: false }),
    InlineCodeTokenizerName,
  ),
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
  parsers.yozora,
).forEach(tester => tester.scan('custom/inline-math/backtick-required').runTest())
