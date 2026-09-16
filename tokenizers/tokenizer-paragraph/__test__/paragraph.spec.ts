import { parsers, scanGfmFixtures } from 'vitest.setup'
import { createTokenizerTesters } from '../../../script/test/index.mjs'

createTokenizerTesters(
  ['gfm', parsers.gfm],
  ['gfm-ex', parsers.gfmEx],
  ['yozora', parsers.yozora],
).forEach(tester => {
  scanGfmFixtures(tester, { includeGroups: ['paragraph'] }).runTest()
})
