import { createExTester } from '../../../jest.setup'
import { MathTokenizer, MathTokenizerName } from '../src'

const exTester = createExTester()
exTester.parser.useTokenizer(new MathTokenizer({ priority: 10 }))

exTester.scan('cases', __dirname).runTest()

test('unique name', function () {
  expect(MathTokenizerName).toEqual('@yozora/tokenizer-math')
})
