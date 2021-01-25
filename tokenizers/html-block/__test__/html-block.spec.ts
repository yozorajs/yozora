import path from 'path'
import { BlockTokenizerTester } from '@yozora/jest-for-tokenizer'
import { HtmlBlockTokenizer } from '../src'


const caseRootDirectory = path.resolve(__dirname, 'cases')
const tester = new BlockTokenizerTester({ caseRootDirectory })
tester.context
  .useTokenizer(new HtmlBlockTokenizer())


tester
  .scan('gfm')
  .scan('*.json')
  .runTest()
