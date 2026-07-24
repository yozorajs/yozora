import { createMarkupTester } from '@yozora/test-util'
import { parsers, scanGfmFixtures, weavers } from 'vitest.setup'
import gfmConfig from '../../../script/fixtures/gfm/config.json'

void scanGfmFixtures(createMarkupTester(parsers.yozora, weavers.yozora), {
  excludeExamples: gfmConfig.markupAnswerExcludedExamples,
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
