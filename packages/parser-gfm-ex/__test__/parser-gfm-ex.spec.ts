import { createTokenizerTester } from '@yozora/test-util'
import { parsers } from 'vitest.setup'

createTokenizerTester(parsers.gfmEx)
  .scan(['gfm/**/*.json', '!gfm/**/#616.json', '!gfm/**/#619.json', '!gfm/**/#620.json'])
  .runTest()
