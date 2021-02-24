import { createExTester, createTester } from '../../../jest.setup'

createTester().scan('gfm/html-block').runTest()

createExTester().scan('gfm/html-block').runTest()
