import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.gfm).scan('gfm/html-inline').runTest()
createTester(parsers.gfmEx).scan('gfm/html-inline').runTest()
