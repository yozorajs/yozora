import { createExTester } from '../../../jest.setup'


createExTester()
  .scan('gfm/autolink-extension')
  .scan([
    'gfm/autolink',
    '!gfm/autolink/#616.json',
    '!gfm/autolink/#619.json',
    '!gfm/autolink/#620.json',
  ])
  .runTest()
