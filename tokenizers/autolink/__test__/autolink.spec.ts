import { createExTester, createTester } from '../../../jest.setup'


createTester()
  .scan([
    'gfm/autolink',
    '!gfm/autolink-extension/**/*',
  ])
  .runTest()


createExTester()
  .scan([
    'gfm/autolink',
    '!gfm/autolink/#616.json',
    '!gfm/autolink/#619.json',
    '!gfm/autolink/#620.json',
  ])
  .runTest()
