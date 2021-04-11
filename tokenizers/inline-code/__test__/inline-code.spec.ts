import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.gfm).scan('gfm/inline-code').runTest()
createTester(parsers.gfmEx).scan('gfm/inline-code').runTest()
