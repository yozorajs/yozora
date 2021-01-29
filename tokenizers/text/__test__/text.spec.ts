import path from 'path'
import { InlineTokenizerTester } from '@yozora/jest-for-tokenizer'
import { TextTokenizer } from '../src'


const caseRootDirectory = path.resolve(__dirname, 'cases')
const tester = new InlineTokenizerTester({ caseRootDirectory })
tester.context
  .useTokenizer(new TextTokenizer())


tester
  .scan('gfm')
  .scan('*.json')
  .runTest()
