import { createTokenizerTesters } from '@yozora/jest-for-tokenizer'
import { parsers } from 'jest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester
    .scan(['gfm/definition', 'gfm/link-reference', 'gfm/image-reference', 'custom/definition'])
    .runTest(),
)
