import { InlineCodeTokenizer } from '@yozora/tokenizer-inline-code'
import { createExTester, createTester } from '../../../jest.setup'
import { InlineFormulaTokenizer } from '../src'


const tester = createTester()
tester.parser.inlineContext
  .unmountTokenizer(InlineCodeTokenizer.name)
  .useTokenizer(new InlineFormulaTokenizer({ delimiterPriority: 11 }))
  .useTokenizer(new InlineCodeTokenizer({ delimiterPriority: 10 }))
tester
  .scan('cases', __dirname)
  .runTest()


const exTester = createExTester()
exTester.parser.inlineContext
  .unmountTokenizer(InlineCodeTokenizer.name)
  .useTokenizer(new InlineFormulaTokenizer({ delimiterPriority: 11 }))
  .useTokenizer(new InlineCodeTokenizer({ delimiterPriority: 10 }))
exTester
  .scan('cases', __dirname)
  .runTest()
