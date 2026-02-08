import { createTokenizerTester, createTokenizerTesters } from '@yozora/test-util'
import { parsers } from 'vitest.setup'

createTokenizerTester(parsers.gfm)
  .scan(['gfm/list', 'gfm/list-item', '!gfm/list-item/task list items\\(extension\\)/**/*'])
  .runTest()

createTokenizerTesters(parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester.scan(['gfm/list', 'gfm/list-item', 'custom/list']).runTest(),
)
