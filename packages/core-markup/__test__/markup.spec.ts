import { createMarkupTester } from '@yozora/jest-for-tokenizer'
import { defaultMarkupWeaver } from '../src'

// createMarkupTester(defaultMarkupWeaver).scan(['custom/**/*.json']).scan(['gfm/**/*.json']).runTest()

createMarkupTester(defaultMarkupWeaver)
  .scan(['gfm/break/**/*.json'])
  // .scan(['gfm/emphasis/**/*.json'])
  .scan(['gfm/delete/**/*.json'])
  .scan(['gfm/text/**/*.json'])
  .scan([
    'gfm/thematic-break/**/*.json',
    '!gfm/thematic-break/#019.json',
    '!gfm/thematic-break/#031.json',
  ])
  .runTest()
