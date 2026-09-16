import { parsers, scanGfmFixtures, weavers } from 'vitest.setup'
import { fixtureRootDirectory } from '../../../script/test/index.mjs'
import { RoundTripMarkupTester, markupFixtureSelection } from '../../test-util'

scanGfmFixtures(
  new RoundTripMarkupTester({
    caseRootDirectory: fixtureRootDirectory,
    parserName: 'gfm',
    parser: parsers.gfm,
    weaver: weavers.gfm,
  }),
  markupFixtureSelection,
).runTest()
