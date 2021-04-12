import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.yozora)
  .scan(['cases'], __dirname)
  .scan([
    'gfm/**/*.json',
    '!gfm/**/#616.json',
    '!gfm/**/#619.json',
    '!gfm/**/#620.json',
  ])
  .runTest()
