import { createExTester, createTester } from '../../../jest.setup'


createTester()
  .scan('gfm/html-inline')
  .runTest()


createExTester()
  .scan('gfm/html-inline')
  .runTest()
