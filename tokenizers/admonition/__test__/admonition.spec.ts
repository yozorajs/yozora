import { createTesters } from '@yozora/jest-for-tokenizer'
import { parsers } from 'jest.setup'
import { AdmonitionTokenizer } from '../src'

createTesters(
  parsers.gfm.useTokenizer(new AdmonitionTokenizer()),
  parsers.gfmEx.useTokenizer(new AdmonitionTokenizer()),
  parsers.yozora,
).forEach(tester => tester.scan('custom/admonition').runTest())
