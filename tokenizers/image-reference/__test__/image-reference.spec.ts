import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.gfm)
  .scan('gfm/image-reference')
  .scan('gfm/link-reference')
  .runTest()
createTester(parsers.gfmEx)
  .scan('gfm/image-reference')
  .scan('gfm/link-reference')
  .runTest()
