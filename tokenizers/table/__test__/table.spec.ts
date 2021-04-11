import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.gfmEx).scan('gfm/table').scan('cases', __dirname).runTest()
