import { createMarkupTester } from '@yozora/jest-for-tokenizer'
import { parsers } from 'jest.setup'
import { defaultMarkupWeaver } from '../src'

// void createMarkupTester(defaultMarkupWeaver)
//   .scan(['custom/**/*.json'])
//   .scan(['gfm/**/*.json'])
//   .runTest()

void createMarkupTester(parsers.yozora, defaultMarkupWeaver)
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
    // '!custom/footnote-definition/basic.json',
    // '!custom/footnote-definition/basic2.json',
    '!custom/footnote/escape.json',
    '!custom/inline-math/backtick-optional/#001.json',
    '!custom/inline-math/backtick-optional/#008.json',
    '!custom/inline-math/backtick-required/#001.json',
    '!custom/inline-math/backtick-required/#008.json',
    '!custom/math/multiple-line/#1.json',
    '!custom/math/multiple-line/#2.json',
    '!custom/math/multiple-line/#3.json',
    '!custom/math/multiple-line/#4.json',
    '!custom/table/backslash.json',
  ])
  .runTest()
