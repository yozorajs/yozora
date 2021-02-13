import { createExTester, createTester } from '../../../jest.setup'


createTester()
  .scan('gfm/fenced-code')
  .scan('cases', __dirname)
  .runTest()


createExTester()
  .scan('gfm/fenced-code')
  .scan('cases', __dirname)
  .runTest()
