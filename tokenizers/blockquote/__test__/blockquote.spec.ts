import { createExTester, createTester } from '../../../jest.setup'


createTester()
  .scan('gfm/blockquote')
  .runTest()


createExTester()
  .scan('gfm/blockquote')
  .runTest()
