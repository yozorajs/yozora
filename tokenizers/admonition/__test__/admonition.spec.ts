import { createTokenizerTesters } from '@yozora/test-util'
import { parsers } from 'vitest.setup'
import { AdmonitionTokenizer } from '../src'

createTokenizerTesters(
  ['gfm', parsers.gfm.useTokenizer(new AdmonitionTokenizer())],
  ['gfm-ex', parsers.gfmEx.useTokenizer(new AdmonitionTokenizer())],
  ['yozora', parsers.yozora],
).forEach(tester => {
  tester.scan('custom/admonition').runTest()
})
