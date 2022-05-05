import { createMarkupTester } from '@yozora/jest-for-tokenizer'
import { defaultMarkupWeaver } from '../src'

// void createMarkupTester(defaultMarkupWeaver)
//   .scan(['custom/**/*.json'])
//   .scan(['gfm/**/*.json'])
//   .runTest()

void createMarkupTester(defaultMarkupWeaver)
  .scan(['gfm/autolink/**/*.json', '!gfm/autolink/**/#614.json'])
  .scan(['gfm/break/**/*.json'])
  .scan([
    'gfm/emphasis/**/*.json',
    '!gfm/emphasis/**/#446.json',
    '!gfm/emphasis/**/#449.json',
    '!gfm/emphasis/**/#459.json',
    '!gfm/emphasis/**/#462.json',
    '!gfm/emphasis/**/#470.json',
    '!gfm/emphasis/**/#472.json',
    '!gfm/emphasis/**/#479.json',
  ])
  .scan(['gfm/delete/**/*.json'])
  // .scan(['gfm/fenced-code/**/*.json'])
  .scan(['gfm/link/**/*.json', '!gfm/link/**/#502.json', '!gfm/link/**/#528.json'])
  .scan(['gfm/text/**/*.json'])
  .scan([
    'gfm/thematic-break/**/*.json',
    '!gfm/thematic-break/#019.json',
    '!gfm/thematic-break/#031.json',
  ])
  .runTest()
