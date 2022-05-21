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

  await createMarkupTester(parsers.yozora, defaultMarkupWeaver)
    .scan([
      'gfm/autolink/**/*.json',
      'gfm/autolink-extension/**/*.json',
      'gfm/blockquote/**/*.json',
      'gfm/break/**/*.json',
      'gfm/definition/**/*.json',
      'gfm/delete/**/*.json',
      'gfm/emphasis/**/*.json',
      'gfm/fenced-code/**/*.json',
      'gfm/heading/**/*.json',
      'gfm/html-block/**/*.json',
      'gfm/html-inline/**/*.json',
      'gfm/image/**/*.json',
      'gfm/image-reference/**/*.json',
      'gfm/indented-code/**/*.json',
      'gfm/inline-code/**/*.json',
      'gfm/link/**/*.json',
      'gfm/link-reference/**/*.json',
      'gfm/list/**/*.json',
      'gfm/list-item/**/*.json',
      'gfm/paragraph/**/*.json',
      'gfm/setext-heading/**/*.json',
      'gfm/table/**/*.json',
      'gfm/text/**/*.json',
      'gfm/thematic-break/**/*.json',
      'gfm/unclassified/**/*.json',

      // Skipped cases.
      '!gfm/autolink/**/#614.json',
      '!gfm/autolink-extension/**/#624.json',
      '!gfm/autolink-extension/**/#625.json',
      '!gfm/autolink-extension/**/#628.json',
      '!gfm/autolink-extension/**/#631.json',
      '!gfm/heading/**/#036.json',
      '!gfm/image-reference/**/#600.json',
      '!gfm/image-reference/**/#601.json',
      '!gfm/inline-code/**/#356.json',
      '!gfm/inline-code/**/#359.json',
      '!gfm/link/**/#502.json',
      '!gfm/link/**/#534.json',
      '!gfm/link-reference/**/#553.json',
      '!gfm/link-reference/**/#571.json',
      '!gfm/unclassified/**/#310.json',
      '!gfm/unclassified/**/#333.json',
      '!gfm/unclassified/**/#334.json',
      '!gfm/unclassified/**/#335.json',
      '!gfm/unclassified/**/#336.json',
      '!gfm/unclassified/**/#337.json',
    ])
    .runAnswer()
}

// void answerTokenizers()
void answerWeavers()
