import { createTokenizerTesters } from '@yozora/test-util'
import { parsers } from 'vitest.setup'
import DeleteTokenizer from '../src'

createTokenizerTesters(
  parsers.gfm.useTokenizer(new DeleteTokenizer()),
  parsers.gfmEx,
  parsers.yozora,
).forEach(tester => tester.scan('gfm/delete').runTest())
