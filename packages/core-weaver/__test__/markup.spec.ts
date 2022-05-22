import { createMarkupTester } from '@yozora/jest-for-tokenizer'
import { parsers, weavers } from 'jest.setup'

void createMarkupTester(parsers.yozora, weavers.yozora)
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
  .runTest()
