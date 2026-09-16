import { fixtureRootDirectory } from '@yozora/test-util'
import { parsers, scanGfmFixtures, weavers } from 'vitest.setup'
import { RoundTripMarkupTester, markupFixtureSelection } from '../../test-util'

scanGfmFixtures(
  new RoundTripMarkupTester({
    caseRootDirectory: fixtureRootDirectory,
    parserName: 'gfm-ex',
    parser: parsers.gfmEx,
    weaver: weavers.gfmEx,
  }),
  markupFixtureSelection,
).runTest()
