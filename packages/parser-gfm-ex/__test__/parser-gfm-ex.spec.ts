import { createTokenizerTester } from '@yozora/jest-for-tokenizer'
import { parsers } from 'jest.setup'

createTokenizerTester(parsers.gfmEx)
  .scan(['gfm/**/*.json', '!gfm/**/#616.json', '!gfm/**/#619.json', '!gfm/**/#620.json'])
  .runTest()
