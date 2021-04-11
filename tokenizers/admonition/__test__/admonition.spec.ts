import { createTester, parsers } from '../../../jest.setup'
import { AdmonitionTokenizer } from '../src'

const tester = createTester(parsers.gfm)
tester.parser.useTokenizer(new AdmonitionTokenizer())
tester.scan('cases', __dirname).runTest()

const exTester = createTester(parsers.gfmEx)
exTester.parser.useTokenizer(new AdmonitionTokenizer())
exTester.scan('cases', __dirname).runTest()
