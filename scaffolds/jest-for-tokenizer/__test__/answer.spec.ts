import { InlineCodeTokenizerName } from '@yozora/tokenizer-inline-code'
import InlineMathTokenizer from '@yozora/tokenizer-inline-math'
import { parsers, weavers } from 'jest.setup'
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
  await createMarkupTester(parsers.yozora, weavers.yozora)
    .scan([
      'gfm/**/*.json',
      'custom/**/*.json',

      // Skipped cases.
      '!gfm/autolink/**/#614.json',
      '!gfm/autolink-extension/**/#624.json',
      '!gfm/autolink-extension/**/#625.json',
      '!gfm/autolink-extension/**/#628.json',
      '!gfm/autolink-extension/**/#631.json',
      '!gfm/heading/**/#036.json',
      '!gfm/image-reference/**/#600.json',
      '!gfm/image-reference/**/#601.json',
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
      '!custom/footnote/escape.json',
      '!custom/inline-math/backtick-optional/#008.json',
      '!custom/inline-math/backtick-required/#008.json',
    ])
    .runAnswer()
}

test('update', async () => {
  await answerTokenizers()
  await answerWeavers()
})
