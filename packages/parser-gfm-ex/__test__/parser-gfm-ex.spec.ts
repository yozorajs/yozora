import { createTester } from '@yozora/jest-for-tokenizer'
import { parsers } from 'jest.setup'

createTester(parsers.gfmEx)
  .scan([
    'gfm/**/*.json',
    '!gfm/**/#616.json',
    '!gfm/**/#619.json',
    '!gfm/**/#620.json',
  ])
  .runTest()
