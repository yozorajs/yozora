import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.gfm).scan('gfm/heading').runTest()
createTester(parsers.gfmEx).scan('gfm/heading').runTest()
