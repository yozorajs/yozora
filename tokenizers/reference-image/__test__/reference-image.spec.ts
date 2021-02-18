import { createExTester, createTester } from '../../../jest.setup'


createTester()
  .scan('gfm/reference-image')
  .scan('gfm/link-reference')
  .runTest()


createExTester()
  .scan('gfm/reference-image')
  .scan('gfm/link-reference')
  .runTest()
