import { parsers, scanGfmFixtures, weavers } from 'vitest.setup'
import { RoundTripMarkupTester, fixtureRootDirectory } from '../../../script/test/index.mjs'

scanGfmFixtures(
  new RoundTripMarkupTester({
    caseRootDirectory: fixtureRootDirectory,
    parserName: 'gfm-ex',
    parser: parsers.gfmEx,
    weaver: weavers.gfmEx,
  }),
).runTest()
