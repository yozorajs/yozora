import { createTester, parsers } from '../../../jest.setup'

const tester = createTester(parsers.yozora)

tester
  .scan(['cases'], __dirname)
  .scan([
    'gfm/**/*.json',
    '!gfm/**/#616.json',
    '!gfm/**/#619.json',
    '!gfm/**/#620.json',
  ])
  .runTest()
