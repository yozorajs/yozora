import { createTesters } from '@yozora/jest-for-tokenizer'
import { parsers } from 'jest.setup'
import AutolinkExtensionTokenizer from '../src'

createTesters(
  parsers.gfm.useTokenizer(new AutolinkExtensionTokenizer()),
  parsers.gfmEx,
  parsers.yozora,
).forEach(tester =>
  tester
    .scan('gfm/autolink-extension')
    .scan([
      'gfm/autolink',
      '!gfm/autolink/#616.json',
      '!gfm/autolink/#619.json',
      '!gfm/autolink/#620.json',
    ])
    .runTest(),
)
