import { createTester, parsers } from '../../../jest.setup'
import MathTokenizer from '../src'

const testers = [
  createTester(parsers.gfm.useTokenizer(new MathTokenizer())),
  createTester(parsers.gfmEx.useTokenizer(new MathTokenizer())),
]
for (const tester of testers) {
  tester.scan('cases', __dirname).runTest()
}
