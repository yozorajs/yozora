import { createTester, parsers } from '../../../jest.setup'
import MathTokenizer from '../src'

const tester = createTester(parsers.gfm)
tester.parser.useTokenizer(new MathTokenizer())
tester.scan('cases', __dirname).runTest()

const exTester = createTester(parsers.gfmEx)
exTester.parser.useTokenizer(new MathTokenizer())
exTester.scan('cases', __dirname).runTest()
