import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.gfm).scan('gfm/text').runTest()
createTester(parsers.gfmEx).scan('gfm/text').runTest()
