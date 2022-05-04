import { createTokenizerTesters } from '@yozora/jest-for-tokenizer'
import { parsers } from 'jest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester
    .scan([
      'gfm/image',
      'gfm/link',
      'gfm/image-reference',
      'gfm/link-reference',
      'custom/link-reference',
    ])
    .runTest(),
)
