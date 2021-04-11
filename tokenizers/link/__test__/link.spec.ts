import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.gfm).scan('gfm/link').runTest()
createTester(parsers.gfmEx).scan('gfm/link').runTest()
