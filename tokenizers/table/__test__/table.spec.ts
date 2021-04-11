import { createTester, parsers } from '../../../jest.setup'
import TableTokenizer from '../src'

const testers = [
  createTester(parsers.gfm.useTokenizer(new TableTokenizer())),
  createTester(parsers.gfmEx),
]
for (const tester of testers) {
  tester.scan('gfm/table').scan('cases', __dirname).runTest()
}
