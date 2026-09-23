import { parsers, scanGfmFixtures, weavers } from 'vitest.setup'
import { createMarkupTester } from '../../../script/test/index.mjs'

void scanGfmFixtures(createMarkupTester('yozora', parsers.yozora, weavers.yozora))
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
