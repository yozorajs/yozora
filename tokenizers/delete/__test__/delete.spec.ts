import { createTester, parsers } from '../../../jest.setup'
import DeleteTokenizer from '../src'

const testers = [
  createTester(parsers.gfm.useTokenizer(new DeleteTokenizer())),
  createTester(parsers.gfmEx),
]
for (const tester of testers) {
  tester.scan('gfm/delete').runTest()
}
