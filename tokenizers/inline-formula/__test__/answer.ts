import { InlineCodeTokenizer } from '@yozora/tokenizer-inline-code'
import { createExTester } from '../../../jest.setup'
import { InlineFormulaTokenizer } from '../src'

const exTester = createExTester()
exTester.parser
  .unmountTokenizer(InlineCodeTokenizer.name)
  .useTokenizer(new InlineFormulaTokenizer({ delimiterPriority: 11 }))
  .useTokenizer(new InlineCodeTokenizer({ delimiterPriority: 10 }))
exTester.scan('cases', __dirname).runAnswer()
