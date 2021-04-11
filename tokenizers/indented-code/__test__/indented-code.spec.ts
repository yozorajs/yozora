import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.gfm).scan('gfm/indented-code').runTest()
createTester(parsers.gfmEx).scan('gfm/indented-code').runTest()
