import { createTokenizerTesters } from '@yozora/test-util'
import { parsers, scanGfmFixtures } from 'vitest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  scanGfmFixtures(tester, { includeGroups: ['paragraph'] }).runTest(),
)
