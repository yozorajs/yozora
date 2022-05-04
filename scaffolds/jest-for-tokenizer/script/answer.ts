/* eslint-disable import/no-extraneous-dependencies */
import { InlineCodeTokenizerName } from '@yozora/tokenizer-inline-code'
import InlineMathTokenizer from '@yozora/tokenizer-inline-math'
import { parsers } from 'jest.setup'
import { createTokenizerTester } from '../src'

// Generate answers for gfm cases (without gfm extensions)
void createTokenizerTester(parsers.gfm)
  .scan(['gfm/**/#616.json', 'gfm/**/#619.json', 'gfm/**/#620.json'])
  .runAnswer()

// Generate answers for gfm-ex cases (with gfm extensions)
void createTokenizerTester(parsers.gfmEx)
  .scan(['gfm/**/*.json', '!gfm/**/#616.json', '!gfm/**/#619.json', '!gfm/**/#620.json'])
  .runAnswer()

// Generate answers for other cases
void createTokenizerTester(parsers.yozora)
  .scan(['custom/**/*.json', '!custom/inline-math/backtick-required'])
  .runAnswer()

// Generate answers for special cases
void createTokenizerTester(
  parsers.yozora.replaceTokenizer(
    new InlineMathTokenizer({ backtickRequired: true }),
    InlineCodeTokenizerName,
  ),
)
  .scan(['custom/inline-math/backtick-required'])
  .runAnswer()
