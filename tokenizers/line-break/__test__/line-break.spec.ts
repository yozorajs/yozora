import { createExTester, createTester } from '../../../jest.setup'


createTester()
  .scan('gfm/line-break')
  .runTest()


createExTester()
  .scan('gfm/line-break')
  .runTest()
