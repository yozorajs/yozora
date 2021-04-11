import { InlineCodeTokenizerName } from '@yozora/tokenizer-inline-code'
import { createTester, parsers } from '../../../jest.setup'
import { InlineMathTokenizer } from '../src'

const exTester = createTester(parsers.gfmEx)
exTester.parser.useTokenizer(new InlineMathTokenizer(), InlineCodeTokenizerName)
exTester.scan('cases', __dirname).runAnswer()
