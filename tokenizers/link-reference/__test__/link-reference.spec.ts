import { createTester, parsers } from '../../../jest.setup'

const testers = [createTester(parsers.gfm), createTester(parsers.gfmEx)]
for (const tester of testers) {
  tester
    .scan('gfm/image')
    .scan('gfm/link')
    .scan('gfm/image-reference')
    .scan('gfm/link-reference')
    .scan('custom/link-reference')
    .runTest()
}
