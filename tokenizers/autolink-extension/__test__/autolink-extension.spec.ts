import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.gfmEx)
  .scan('gfm/autolink-extension')
  .scan([
    'gfm/autolink',
    '!gfm/autolink/#616.json',
    '!gfm/autolink/#619.json',
    '!gfm/autolink/#620.json',
  ])
  .runTest()
