import { createTokenizerTesters } from '@yozora/test-util'
import { parsers, scanGfmFixtures } from 'vitest.setup'

createTokenizerTesters(
  ['gfm', parsers.gfm],
  ['gfm-ex', parsers.gfmEx],
  ['yozora', parsers.yozora],
).forEach(tester => {
  scanGfmFixtures(tester, { includeGroups: ['paragraph'] }).runTest()
})
