import { InlineCodeTokenizerName } from '@yozora/tokenizer-inline-code'
import { createExTester, createTester } from '../../../jest.setup'
import { InlineMathTokenizer } from '../src'

const tester = createTester()
tester.parser.useTokenizer(
  new InlineMathTokenizer(),
  undefined,
  InlineCodeTokenizerName,
)
tester.scan('cases', __dirname).runTest()

const exTester = createExTester()
exTester.parser.useTokenizer(
  new InlineMathTokenizer(),
  undefined,
  InlineCodeTokenizerName,
)
exTester.scan('cases', __dirname).runTest()
