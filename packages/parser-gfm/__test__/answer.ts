import { createExTester, createTester } from '../../../jest.setup'


createTester()
  .scan([
    'gfm/**/#616.json',
    'gfm/**/#619.json',
    'gfm/**/#620.json',
  ])
  .runAnswer()


createExTester()
  .scan([
    'gfm/**/*.json',
    '!gfm/**/#616.json',
    '!gfm/**/#619.json',
    '!gfm/**/#620.json',
  ])
  .runAnswer()
