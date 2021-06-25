import { createTester, createTesters, parsers } from '../../../jest.setup'

createTester(parsers.gfm)
  .scan([
    'gfm/list',
    'gfm/list-item',
    '!gfm/list-item/task list items\\(extension\\)/**/*',
  ])
  .runTest()

createTesters(parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester.scan(['gfm/list', 'gfm/list-item', 'custom/list']).runTest(),
)
