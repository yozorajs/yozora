import { createExTester } from '../../../jest.setup'


createExTester()
  .scan('gfm/table')
  .scan('cases', __dirname)
  .runTest()
