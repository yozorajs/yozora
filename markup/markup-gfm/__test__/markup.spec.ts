import { parsers, scanGfmFixtures, weavers } from 'vitest.setup'
import { RoundTripMarkupTester, fixtureRootDirectory } from '../../../script/test/index.mjs'

scanGfmFixtures(
  new RoundTripMarkupTester({
    caseRootDirectory: fixtureRootDirectory,
    parserName: 'gfm',
    parser: parsers.gfm,
    weaver: weavers.gfm,
  }),
).runTest()
