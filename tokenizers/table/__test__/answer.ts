import path from 'path'
import { BlockTokenizerTester } from '@yozora/jest-for-tokenizer'
import { TableTokenizer } from '../src'


const caseRootDirectory = path.resolve(__dirname, 'cases')
const tester = new BlockTokenizerTester({ caseRootDirectory })


tester.context
  .useTokenizer(new TableTokenizer())


tester
  .scan('gfm')
  .scan('*.json')
  .runAnswer()
