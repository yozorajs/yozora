import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.gfm)
  .scan('gfm/definition')
  .scan('gfm/link-reference')
  .scan('gfm/image-reference')
  .scan('cases', __dirname)
  .runTest()
createTester(parsers.gfmEx)
  .scan('gfm/definition')
  .scan('gfm/link-reference')
  .scan('gfm/image-reference')
  .scan('cases', __dirname)
  .runTest()
