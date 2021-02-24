import { createExTester, createTester } from '../../../jest.setup'

createTester().scan('gfm/emphasis').runTest()

createExTester().scan('gfm/emphasis').runTest()
