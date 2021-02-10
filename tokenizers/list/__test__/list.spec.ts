import path from 'path'
import { BlockTokenizerTester } from '@yozora/jest-for-tokenizer'
import { ListItemTokenizer } from '@yozora/tokenizer-list-item'
import { ListTokenizer } from '../src'


const caseRootDirectory = path.resolve(__dirname, 'cases')
const tester = new BlockTokenizerTester({ caseRootDirectory })


tester.context
  .useTokenizer(new ListItemTokenizer({ enableTaskListItem: true }))
  .useTokenizer(new ListTokenizer())


tester
  .scan('gfm')
  .scan('*.json')
  .runTest()
