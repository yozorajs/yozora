import { createExTester, createTester } from '../../../jest.setup'

createTester().scan('gfm/break').runTest()

createExTester().scan('gfm/break').runTest()
