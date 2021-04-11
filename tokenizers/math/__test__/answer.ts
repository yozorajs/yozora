import { createTester, parsers } from '../../../jest.setup'
import { MathTokenizer } from '../src'

const tester = createTester(parsers.gfmEx.useTokenizer(new MathTokenizer()))
tester.scan('cases', __dirname).runAnswer()
