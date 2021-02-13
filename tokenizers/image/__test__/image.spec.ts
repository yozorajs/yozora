import { createExTester, createTester } from '../../../jest.setup'


createTester()
  .scan('gfm/image')
  .runTest()


createExTester()
  .scan('gfm/image')
  .runTest()
