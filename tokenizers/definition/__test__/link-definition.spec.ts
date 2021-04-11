import { createTester, parsers } from '../../../jest.setup'

const testers = [createTester(parsers.gfm), createTester(parsers.gfmEx)]
for (const tester of testers) {
  tester
    .scan('gfm/definition')
    .scan('gfm/link-reference')
    .scan('gfm/image-reference')
    .scan('cases', __dirname)
    .runTest()
}
