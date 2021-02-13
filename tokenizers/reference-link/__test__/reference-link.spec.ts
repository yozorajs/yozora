import { createExTester, createTester } from '../../../jest.setup'


createTester()
  .scan('gfm/image')
  .scan('gfm/link')
  .scan('gfm/reference-image')
  .scan('gfm/reference-link')
  .scan('cases', __dirname)
  .runTest()


createExTester()
  .scan('gfm/image')
  .scan('gfm/link')
  .scan('gfm/reference-image')
  .scan('gfm/reference-link')
  .scan('cases', __dirname)
  .runTest()
