import { createTokenizerTester } from '@yozora/test-util'
import { parsers, scanGfmFixtures } from 'vitest.setup'

scanGfmFixtures(createTokenizerTester(parsers.gfmEx), {
  excludeExamples: ['#616', '#619', '#620'],
}).runTest()
