import { createTester } from '../../../jest.setup'
import YozoraParser from '../src'

const tester = createTester(new YozoraParser({ shouldReservePosition: true }))

tester
  .scan(['cases'], __dirname)
  .scan([
    'gfm/**/*.json',
    '!gfm/**/#616.json',
    '!gfm/**/#619.json',
    '!gfm/**/#620.json',
  ])
  .runTest()
