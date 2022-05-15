/* eslint-disable import/no-extraneous-dependencies */
import { defaultMarkupWeaver } from '@yozora/core-markup'
import { InlineCodeTokenizerName } from '@yozora/tokenizer-inline-code'
import InlineMathTokenizer from '@yozora/tokenizer-inline-math'
import { parsers } from 'jest.setup'
import { createMarkupTester, createTokenizerTester } from '../src'

async function answerTokenizers(): Promise<void> {
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
}

async function answerWeavers(): Promise<void> {
  // await createMarkupTester(defaultMarkupWeaver)
  //   .scan(['custom/**/*.json'])
  //   .scan(['gfm/**/*.json'])
  //   .runAnswer()

  await createMarkupTester(defaultMarkupWeaver)
    .scan([
      'gfm/autolink/**/*.json',
      'gfm/blockquote/**/*.json',
      'gfm/break/**/*.json',
      'gfm/definition/**/*.json',
      'gfm/delete/**/*.json',
      'gfm/emphasis/**/*.json',
      'gfm/fenced-code/**/*.json',
      'gfm/heading/**/*.json',
      'gfm/html-inline/**/*.json',
      'gfm/image/**/*.json',
      'gfm/link/**/*.json',
      'gfm/list/**/*.json',
      'gfm/list-item/**/*.json',
      'gfm/paragraph/**/*.json',
      'gfm/text/**/*.json',
      'gfm/thematic-break/**/*.json',

      // Skipped cases.
      '!gfm/autolink/**/#614.json',
      '!gfm/emphasis/**/#449.json',
      '!gfm/emphasis/**/#462.json',
      '!gfm/emphasis/**/#470.json',
      '!gfm/emphasis/**/#472.json',
      '!gfm/heading/**/#036.json',
      '!gfm/link/**/#502.json',
      '!gfm/link/**/#534.json',
    ])
    .runAnswer()
}

// void answerTokenizers()
void answerWeavers()
