import { createTesters, parsers } from '../../../jest.setup'

createTesters(parsers.yozora).forEach(tester =>
  tester.scan(['gfm/table', 'custom/table']).runTest(),
)
