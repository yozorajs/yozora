import path from 'path'
import { InlineTokenizerTester } from '@yozora/jest-for-tokenizer'
import { TextTokenizer } from '@yozora/tokenizer-text'
import { HtmlInlineTokenizer } from '../src'


const caseRootDirectory = path.resolve(__dirname, 'cases')
const fallbackTokenizer = new TextTokenizer()
const tester = new InlineTokenizerTester({ caseRootDirectory, fallbackTokenizer })
tester.context
  .useTokenizer(new HtmlInlineTokenizer())


tester
  .scan('gfm')
  .scan('*.json')
  .runTest()
