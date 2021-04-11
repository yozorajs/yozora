import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.gfm).scan('gfm/html-block').runTest()
createTester(parsers.gfmEx).scan('gfm/html-block').runTest()
