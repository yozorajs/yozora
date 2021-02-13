import { createExTester, createTester } from '../../../jest.setup'


createTester()
  .scan('gfm/reference-image')
  .scan('gfm/reference-link')
  .runTest()


createExTester()
  .scan('gfm/reference-image')
  .scan('gfm/reference-link')
  .runTest()
