/* eslint-disable import/no-extraneous-dependencies */
import { defaultMarkupWeaver } from '@yozora/core-markup'
import { InlineCodeTokenizerName } from '@yozora/tokenizer-inline-code'
import InlineMathTokenizer from '@yozora/tokenizer-inline-math'
import { parsers } from 'jest.setup'
import { createMarkupTester, createTokenizerTester } from '../src'

async function handle(): Promise<void> {
  // Generate answers for gfm cases (without gfm extensions)
  await createTokenizerTester(parsers.gfm)
    .scan(['gfm/**/#616.json', 'gfm/**/#619.json', 'gfm/**/#620.json'])
    .runAnswer()

  // Generate answers for gfm-ex cases (with gfm extensions)
  await createTokenizerTester(parsers.gfmEx)
    .scan(['gfm/**/*.json', '!gfm/**/#616.json', '!gfm/**/#619.json', '!gfm/**/#620.json'])
    .runAnswer()

  // Generate answers for other cases
  await createTokenizerTester(parsers.yozora)
    .scan(['custom/**/*.json', '!custom/inline-math/backtick-required'])
    .runAnswer()

  // Generate answers for special cases
  await createTokenizerTester(
    parsers.yozora.replaceTokenizer(
      new InlineMathTokenizer({ backtickRequired: true }),
      InlineCodeTokenizerName,
    ),
  )
    .scan(['custom/inline-math/backtick-required'])
    .runAnswer()

  // await createMarkupTester(defaultMarkupWeaver)
  //   .scan(['custom/**/*.json'])
  //   .scan(['gfm/**/*.json'])
  //   .runAnswer()
  await createMarkupTester(defaultMarkupWeaver)
    .scan(['gfm/break/*.json'])
    .scan(['gfm/delete/*.json'])
    .scan(['gfm/text/*.json'])
    .runAnswer()
}

void handle()
