import { createExTester, createTester } from '../../../jest.setup'

createTester()
  .scan('gfm/list')
  .scan(['gfm/list-item', '!gfm/list-item/task list items\\(extension\\)/**/*'])
  .runTest()

createExTester().scan('gfm/list').scan('gfm/list-item').runTest()
