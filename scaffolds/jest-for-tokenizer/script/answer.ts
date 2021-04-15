/* eslint-disable import/no-extraneous-dependencies */
import { InlineCodeTokenizerName } from '@yozora/tokenizer-inline-code'
import InlineMathTokenizer, {
  InlineMathTokenizerName,
} from '@yozora/tokenizer-inline-math'
import { createTester, parsers } from '../../../jest.setup'

// Generate answers for gfm cases (without gfm extensions)
createTester(parsers.gfm)
  .scan(['gfm/**/#616.json', 'gfm/**/#619.json', 'gfm/**/#620.json'])
  .runAnswer()

// Generate answers for gfm-ex cases (with gfm extensions)
createTester(parsers.gfmEx)
  .scan([
    'gfm/**/*.json',
    '!gfm/**/#616.json',
    '!gfm/**/#619.json',
    '!gfm/**/#620.json',
  ])
  .runAnswer()

// Generate answers for other cases
createTester(parsers.yozora)
  .scan(['custom/**/*.json', '!custom/inline-math/backtick-optional'])
  .runAnswer()

// Generate answers for special cases
createTester(
  parsers.yozora
    .unmountTokenizer(InlineMathTokenizerName)
    .useTokenizer(
      new InlineMathTokenizer({ backtickRequired: false }),
      InlineCodeTokenizerName,
    ),
)
  .scan(['custom/inline-math/backtick-optional'])
  .runAnswer()
