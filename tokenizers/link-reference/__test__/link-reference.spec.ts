import { createExTester, createTester } from '../../../jest.setup'


createTester()
  .scan('gfm/image')
  .scan('gfm/link')
  .scan('gfm/reference-image')
  .scan('gfm/link-reference')
  .scan('cases', __dirname)
  .runTest()


createExTester()
  .scan('gfm/image')
  .scan('gfm/link')
  .scan('gfm/reference-image')
  .scan('gfm/link-reference')
  .scan('cases', __dirname)
  .runTest()
