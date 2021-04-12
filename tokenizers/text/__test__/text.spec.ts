import { createTester, parsers } from '../../../jest.setup'

const testers = [
  createTester(parsers.gfm),
  createTester(parsers.gfmEx),
  createTester(parsers.yozora),
]
for (const tester of testers) {
  tester.scan('gfm/text').runTest()
}
