import {
  InlineCodeTokenizer,
  InlineCodeTokenizerName,
} from '@yozora/tokenizer-inline-code'
import { createExTester } from '../../../jest.setup'
import { InlineMathTokenizer } from '../src'

const exTester = createExTester()
exTester.parser
  .unmountTokenizer(InlineCodeTokenizerName)
  .useTokenizer(new InlineMathTokenizer({ priority: 11 }))
  .useTokenizer(new InlineCodeTokenizer({ priority: 10 }))
exTester.scan('cases', __dirname).runAnswer()
