import { createExTester } from '../../../jest.setup'
import { MathTokenizer } from '../src'

const exTester = createExTester()
exTester.parser.useTokenizer(new MathTokenizer({ priority: 10 }))

exTester.scan('cases', __dirname).runAnswer()
