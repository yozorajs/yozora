import { createTokenizerTester } from '@yozora/test-util'
import { parsers, scanGfmFixtures } from 'vitest.setup'

scanGfmFixtures(createTokenizerTester(parsers.gfmEx), {
  excludeExamples: ['#617', '#620', '#621'],
}).runTest()
