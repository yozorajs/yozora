import { InlineCodeTokenizer } from '@yozora/tokenizer-inline-code'
import { createExTester, createTester } from '../../../jest.setup'
import { InlineMathTokenizer } from '../src'

const tester = createTester()
tester.parser
  .unmountTokenizer(InlineCodeTokenizer.uniqueName)
  .useTokenizer(new InlineMathTokenizer({ delimiterPriority: 11 }))
  .useTokenizer(new InlineCodeTokenizer({ delimiterPriority: 10 }))
tester.scan('cases', __dirname).runTest()

const exTester = createExTester()
exTester.parser
  .unmountTokenizer(InlineCodeTokenizer.uniqueName)
  .useTokenizer(new InlineMathTokenizer({ delimiterPriority: 11 }))
  .useTokenizer(new InlineCodeTokenizer({ delimiterPriority: 10 }))
exTester.scan('cases', __dirname).runTest()
