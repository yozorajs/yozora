import { createExTester, createTester } from '../../../jest.setup'

createTester().scan('gfm/paragraph').runTest()

createExTester().scan('gfm/paragraph').runTest()
