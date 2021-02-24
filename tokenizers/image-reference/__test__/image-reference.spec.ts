import { createExTester, createTester } from '../../../jest.setup'

createTester().scan('gfm/image-reference').scan('gfm/link-reference').runTest()

createExTester()
  .scan('gfm/image-reference')
  .scan('gfm/link-reference')
  .runTest()
