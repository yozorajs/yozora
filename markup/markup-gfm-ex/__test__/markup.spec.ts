import { parsers, scanGfmFixtures, weavers } from 'vitest.setup'
import {
  RoundTripMarkupTester,
  fixtureRootDirectory,
  markupFixtureSelection,
} from '../../../script/test/index.mjs'

scanGfmFixtures(
  new RoundTripMarkupTester({
    caseRootDirectory: fixtureRootDirectory,
    parserName: 'gfm-ex',
    parser: parsers.gfmEx,
    weaver: weavers.gfmEx,
  }),
  markupFixtureSelection,
).runTest()
