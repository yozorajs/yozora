import { createTokenizerTesters } from '@yozora/jest-for-tokenizer'
import { parsers } from 'jest.setup'

createTokenizerTesters(parsers.yozora).forEach(tester =>
  tester.scan(['gfm/table', 'custom/table']).runTest(),
)
