import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.gfm)
  .scan('gfm/fenced-code')
  .scan('cases', __dirname)
  .runTest()
createTester(parsers.gfmEx)
  .scan('gfm/fenced-code')
  .scan('cases', __dirname)
  .runTest()
