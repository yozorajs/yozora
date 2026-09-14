import { createMarkupTester } from '@yozora/test-util'
import { parsers, scanGfmFixtures, weavers } from 'vitest.setup'

void scanGfmFixtures(createMarkupTester('yozora', parsers.yozora, weavers.yozora), {
  excludeExamples: [
    '#036',
    '#310',
    '#333',
    '#334',
    '#335',
    '#336',
    '#337',
    '#359',
    '#503',
    '#535',
    '#554',
    '#572',
    '#601',
    '#602',
    '#615',
    '#625',
    '#626',
    '#629',
    '#632',
  ],
})
  .scan([
    'custom/**/*.json',

    // Temporary skipped.
    '!custom/math/multiple-line/#2.json',

    // Skipped cases.
    '!custom/footnote/escape.json',
    '!custom/inline-math/backtick-optional/#008.json',
    '!custom/inline-math/backtick-required/#008.json',
  ])
  .runTest()
