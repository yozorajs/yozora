import { createExTester, createTester } from '../../../jest.setup'

createTester()
  .scan('gfm/link-definition')
  .scan('gfm/link-reference')
  .scan('gfm/image-reference')
  .scan('cases', __dirname)
  .runTest()

createExTester()
  .scan('gfm/link-definition')
  .scan('gfm/link-reference')
  .scan('gfm/image-reference')
  .scan('cases', __dirname)
  .runTest()
