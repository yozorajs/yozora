import { createExTester, createTester } from '../../../jest.setup'

createTester().scan('gfm/inline-code').runTest()

createExTester().scan('gfm/inline-code').runTest()
