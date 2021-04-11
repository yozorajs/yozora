import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.gfm).scan('gfm/blockquote').runTest()
createTester(parsers.gfmEx).scan('gfm/blockquote').runTest()
