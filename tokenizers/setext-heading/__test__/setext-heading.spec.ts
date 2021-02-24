import { createExTester, createTester } from '../../../jest.setup'

createTester().scan('gfm/setext-heading').runTest()

createExTester().scan('gfm/setext-heading').runTest()
