import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.gfm)
  .scan('gfm/list')
  .scan(['gfm/list-item', '!gfm/list-item/task list items\\(extension\\)/**/*'])
  .runTest()
createTester(parsers.gfmEx).scan('gfm/list').scan('gfm/list-item').runTest()
