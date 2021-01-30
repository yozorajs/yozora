import path from 'path'
import { InlineTokenizerTester } from '@yozora/jest-for-tokenizer'
import { TextTokenizer } from '@yozora/tokenizer-text'
import { LinkTokenizer, LinkType } from '../src'


const caseRootDirectory = path.resolve(__dirname, 'cases')
const fallbackTokenizer = new TextTokenizer()
const tester = new InlineTokenizerTester({
  linkTypes: [LinkType],
  caseRootDirectory,
  fallbackTokenizer
})
tester.context
  .useTokenizer(new LinkTokenizer())


tester
  .scan('gfm')
  .scan('*.json')
  .runAnswer()
