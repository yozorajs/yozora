import { createTesters } from '@yozora/jest-for-tokenizer'
import { parsers } from 'jest.setup'

createTesters(parsers.yozora).forEach(tester =>
  tester.scan(['gfm/table', 'custom/table']).runTest(),
)
