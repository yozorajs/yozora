import { createTester, parsers } from '../../../jest.setup'
import TableTokenizer from '../src'

const testers = [
  createTester(parsers.gfm.useTokenizer(new TableTokenizer())),
  createTester(parsers.gfmEx),
  createTester(parsers.yozora),
]
for (const tester of testers) {
  tester.scan(['gfm/table', 'custom/table']).runTest()
}
