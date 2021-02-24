import { createExTester, createTester } from '../../../jest.setup'

createTester()
  .scan('gfm/image')
  .scan('gfm/link')
  .scan('gfm/image-reference')
  .scan('gfm/link-reference')
  .scan('cases', __dirname)
  .runTest()

createExTester()
  .scan('gfm/image')
  .scan('gfm/link')
  .scan('gfm/image-reference')
  .scan('gfm/link-reference')
  .scan('cases', __dirname)
  .runTest()
