import { createExTester, createTester } from '../../../jest.setup'

createTester().scan('gfm/link').runTest()

createExTester().scan('gfm/link').runTest()
