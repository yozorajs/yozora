import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.gfm).scan('gfm/break').runTest()
createTester(parsers.gfmEx).scan('gfm/break').runTest()
