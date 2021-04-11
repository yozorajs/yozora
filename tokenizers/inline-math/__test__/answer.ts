import { InlineCodeTokenizerName } from '@yozora/tokenizer-inline-code'
import { createExTester } from '../../../jest.setup'
import { InlineMathTokenizer } from '../src'

const exTester = createExTester()
exTester.parser.useTokenizer(new InlineMathTokenizer(), InlineCodeTokenizerName)
exTester.scan('cases', __dirname).runAnswer()
