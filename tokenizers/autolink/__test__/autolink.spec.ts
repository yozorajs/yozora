import { createTokenizerTester, createTokenizerTesters } from '@yozora/test-util'
import { parsers } from 'vitest.setup'

createTokenizerTester(parsers.gfm).scan(['gfm/autolink', '!gfm/autolink-extension/**/*']).runTest()

createTokenizerTesters(parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester
    .scan([
      'gfm/autolink',
      '!gfm/autolink/#616.json',
      '!gfm/autolink/#619.json',
      '!gfm/autolink/#620.json',
    ])
    .runTest(),
)
