import { InlineCodeTokenizerName } from '@yozora/tokenizer-inline-code'
import { createTester, parsers } from '../../../jest.setup'
import InlineMathTokenizer from '../src'

const tester = createTester(parsers.gfm)
tester.parser.useTokenizer(new InlineMathTokenizer(), InlineCodeTokenizerName)
tester.scan('cases', __dirname).runTest()

const exTester = createTester(parsers.gfmEx)
exTester.parser.useTokenizer(new InlineMathTokenizer(), InlineCodeTokenizerName)
exTester.scan('cases', __dirname).runTest()
