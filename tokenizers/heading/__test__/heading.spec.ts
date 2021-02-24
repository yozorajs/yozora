import { createExTester, createTester } from '../../../jest.setup'

createTester().scan('gfm/heading').runTest()

createExTester().scan('gfm/heading').runTest()
