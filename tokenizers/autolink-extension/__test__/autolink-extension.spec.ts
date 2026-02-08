import { createTokenizerTesters } from '@yozora/test-util'
import { parsers } from 'vitest.setup'
import AutolinkExtensionTokenizer from '../src'

createTokenizerTesters(
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
