import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.gfm).scan('gfm/setext-heading').runTest()
createTester(parsers.gfmEx).scan('gfm/setext-heading').runTest()
