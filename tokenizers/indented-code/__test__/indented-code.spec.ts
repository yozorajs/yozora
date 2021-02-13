import { createExTester, createTester } from '../../../jest.setup'


createTester()
  .scan('gfm/indented-code')
  .runTest()


createExTester()
  .scan('gfm/indented-code')
  .runTest()
