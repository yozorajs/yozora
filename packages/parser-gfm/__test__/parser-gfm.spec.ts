import { createTokenizerTester } from '@yozora/test-util'
import { parsers } from 'vitest.setup'

createTokenizerTester(parsers.gfm)
  .scan([
    'gfm/**/*.json',
    '!gfm/autolink-extension/**/*',
    '!gfm/delete/**/*',
    '!gfm/list-item/task list items\\(extension\\)/**/*',
    '!gfm/table/**/*',
  ])
  .runTest()
