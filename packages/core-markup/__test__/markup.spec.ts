import { createMarkupTester } from '@yozora/jest-for-tokenizer'
import { defaultMarkupWeaver } from '../src'

// void createMarkupTester(defaultMarkupWeaver)
//   .scan(['custom/**/*.json'])
//   .scan(['gfm/**/*.json'])
//   .runTest()

void createMarkupTester(defaultMarkupWeaver)
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
  .runTest()
