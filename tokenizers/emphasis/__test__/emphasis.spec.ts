import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.gfm).scan('gfm/emphasis').runTest()
createTester(parsers.gfmEx).scan('gfm/emphasis').runTest()
