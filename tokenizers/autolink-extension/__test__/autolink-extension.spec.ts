import { createTester, parsers } from '../../../jest.setup'
import AutolinkExtensionTokenizer from '../src'

const testers = [
  createTester(parsers.gfm.useTokenizer(new AutolinkExtensionTokenizer())),
  createTester(parsers.gfmEx),
]
for (const tester of testers) {
  tester
    .scan('gfm/autolink-extension')
    .scan([
      'gfm/autolink',
      '!gfm/autolink/#616.json',
      '!gfm/autolink/#619.json',
      '!gfm/autolink/#620.json',
    ])
    .runTest()
}
