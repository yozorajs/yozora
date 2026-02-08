import { createTokenizerTesters } from '@yozora/test-util'
import { parsers } from 'vitest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester.scan('gfm/image').runTest(),
)
