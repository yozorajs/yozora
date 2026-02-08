import { createTokenizerTesters } from '@yozora/test-util'
import { parsers } from 'vitest.setup'

createTokenizerTesters(parsers.yozora).forEach(tester =>
  tester.scan(['gfm/table', 'custom/table']).runTest(),
)
