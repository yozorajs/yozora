import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.gfm).scan('gfm/image').runTest()
createTester(parsers.gfmEx).scan('gfm/image').runTest()
