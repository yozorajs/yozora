import { createTester, createTesters, parsers } from '../../../jest.setup'

createTester(parsers.gfm)
  .scan(['gfm/autolink', '!gfm/autolink-extension/**/*'])
  .runTest()

createTesters(parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester
    .scan([
      'gfm/autolink',
      '!gfm/autolink/#616.json',
      '!gfm/autolink/#619.json',
      '!gfm/autolink/#620.json',
    ])
    .runTest(),
)
