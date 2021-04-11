import { createTester, parsers } from '../../../jest.setup'
import { AdmonitionTokenizer } from '../src'

const testers = [
  createTester(parsers.gfm.useTokenizer(new AdmonitionTokenizer())),
  createTester(parsers.gfmEx.useTokenizer(new AdmonitionTokenizer())),
]
for (const tester of testers) {
  tester.scan('cases', __dirname).runTest()
}
