import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.gfm).scan('gfm/thematic-break').runTest()
createTester(parsers.gfmEx).scan('gfm/thematic-break').runTest()
