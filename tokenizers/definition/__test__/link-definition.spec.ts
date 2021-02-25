import { createExTester, createTester } from '../../../jest.setup'

createTester()
  .scan('gfm/definition')
  .scan('gfm/link-reference')
  .scan('gfm/image-reference')
  .scan('cases', __dirname)
  .runTest()

createExTester()
  .scan('gfm/definition')
  .scan('gfm/link-reference')
  .scan('gfm/image-reference')
  .scan('cases', __dirname)
  .runTest()
