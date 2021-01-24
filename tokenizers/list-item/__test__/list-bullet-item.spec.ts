import path from 'path'
import { BlockTokenizerTester } from '@yozora/jest-for-tokenizer'
import { ListItemTokenizer } from '../src'


const caseRootDirectory = path.resolve(__dirname, 'cases')
const tester = new BlockTokenizerTester({ caseRootDirectory })


tester.context
  .useTokenizer(new ListItemTokenizer())


tester
  .scan('gfm')
  .scan('*.json')
  .runTest()
