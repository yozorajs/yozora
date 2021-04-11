import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.gfm)
  .scan('gfm/image')
  .scan('gfm/link')
  .scan('gfm/image-reference')
  .scan('gfm/link-reference')
  .scan('cases', __dirname)
  .runTest()
createTester(parsers.gfmEx)
  .scan('gfm/image')
  .scan('gfm/link')
  .scan('gfm/image-reference')
  .scan('gfm/link-reference')
  .scan('cases', __dirname)
  .runTest()
