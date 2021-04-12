import { createTester, parsers } from '../../../jest.setup'

const testers = [createTester(parsers.gfm), createTester(parsers.gfmEx)]
for (const tester of testers) {
  tester.scan('gfm/fenced-code').scan('custom/fenced-code').runTest()
}
