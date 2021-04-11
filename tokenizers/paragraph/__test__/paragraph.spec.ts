import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.gfm).scan('gfm/paragraph').runTest()
createTester(parsers.gfmEx).scan('gfm/paragraph').runTest()
