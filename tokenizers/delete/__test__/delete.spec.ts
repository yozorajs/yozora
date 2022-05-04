import { createTokenizerTesters } from '@yozora/jest-for-tokenizer'
import { parsers } from 'jest.setup'
import DeleteTokenizer from '../src'

createTokenizerTesters(
  parsers.gfm.useTokenizer(new DeleteTokenizer()),
  parsers.gfmEx,
  parsers.yozora,
).forEach(tester => tester.scan('gfm/delete').runTest())
