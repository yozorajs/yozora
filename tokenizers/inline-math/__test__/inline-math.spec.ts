import { InlineCodeTokenizerName } from '@yozora/tokenizer-inline-code'
import { createTester, parsers } from '../../../jest.setup'
import InlineMathTokenizer from '../src'

const testers = [
  createTester(
    parsers.gfm.useTokenizer(
      new InlineMathTokenizer(),
      InlineCodeTokenizerName,
    ),
  ),
  createTester(
    parsers.gfmEx.useTokenizer(
      new InlineMathTokenizer(),
      InlineCodeTokenizerName,
    ),
  ),
]
for (const tester of testers) {
  tester.scan('cases', __dirname).runTest()
}
