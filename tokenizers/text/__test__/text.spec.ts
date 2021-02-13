import { createExTester, createTester } from '../../../jest.setup'


createTester()
  .scan('gfm/text')
  .runTest()


createExTester()
  .scan('gfm/text')
  .runTest()
