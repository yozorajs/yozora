import { createTesters, parsers } from 'jest.setup'

createTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester.scan('gfm/html-inline').runTest(),
)
