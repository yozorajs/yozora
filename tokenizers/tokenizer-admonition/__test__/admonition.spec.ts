import { parsers } from 'vitest.setup'
import { createTokenizerTesters } from '../../../script/test/index.mjs'
import { AdmonitionTokenizer } from '../src'

createTokenizerTesters(
  ['yozora', parsers.gfm.useTokenizer(new AdmonitionTokenizer())],
  ['yozora', parsers.gfmEx.useTokenizer(new AdmonitionTokenizer())],
  ['yozora', parsers.yozora],
).forEach(tester => {
  tester.scan('custom/admonition').runTest()
})
