import {
  InlineCodeTokenizer,
  InlineCodeTokenizerName,
} from '@yozora/tokenizer-inline-code'
import { createExTester, createTester } from '../../../jest.setup'
import { InlineMathTokenizer } from '../src'

const tester = createTester()
tester.parser
  .unmountTokenizer(InlineCodeTokenizerName)
  .useTokenizer(new InlineMathTokenizer({ priority: 11 }))
  .useTokenizer(new InlineCodeTokenizer({ priority: 10 }))
tester.scan('cases', __dirname).runTest()

const exTester = createExTester()
exTester.parser
  .unmountTokenizer(InlineCodeTokenizerName)
  .useTokenizer(new InlineMathTokenizer({ priority: 11 }))
  .useTokenizer(new InlineCodeTokenizer({ priority: 10 }))
exTester.scan('cases', __dirname).runTest()
