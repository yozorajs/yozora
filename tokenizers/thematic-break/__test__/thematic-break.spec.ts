import { createExTester, createTester } from '../../../jest.setup'


createTester()
  .scan('gfm/thematic-break')
  .runTest()


createExTester()
  .scan('gfm/thematic-break')
  .runTest()
