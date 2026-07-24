import { createMarkupTester } from '@yozora/test-util'
import { parsers, scanGfmFixtures, weavers } from 'vitest.setup'

void scanGfmFixtures(createMarkupTester(parsers.yozora, weavers.yozora), {
  excludeExamples: [
    '#036',
    '#310',
    '#333',
    '#334',
    '#335',
    '#336',
    '#337',
    '#359',
    '#502',
    '#534',
    '#553',
    '#571',
    '#600',
    '#601',
    '#614',
    '#624',
    '#625',
    '#628',
    '#631',
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
