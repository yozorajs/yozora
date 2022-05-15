import { createMarkupTester } from '@yozora/jest-for-tokenizer'
import { parsers } from 'jest.setup'
import { defaultMarkupWeaver } from '../src'

// void createMarkupTester(defaultMarkupWeaver)
//   .scan(['custom/**/*.json'])
//   .scan(['gfm/**/*.json'])
//   .runTest()

void createMarkupTester(parsers.yozora, defaultMarkupWeaver)
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
    'gfm/image-reference/**/*.json',
    'gfm/indented-code/**/*.json',
    'gfm/inline-code/**/*.json',
    'gfm/link/**/*.json',
    'gfm/link-reference/**/*.json',
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
    '!gfm/image-reference/**/#600.json',
    '!gfm/image-reference/**/#601.json',
    '!gfm/inline-code/**/#356.json',
    '!gfm/inline-code/**/#359.json',
    '!gfm/link/**/#502.json',
    '!gfm/link/**/#534.json',
    '!gfm/link-reference/**/#553.json',
    '!gfm/link-reference/**/#571.json',
  ])
  .runTest()
