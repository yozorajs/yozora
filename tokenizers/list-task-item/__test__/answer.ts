import path from 'path'
import { BlockTokenizerTester } from '@yozora/jest-for-tokenizer'
import { ListItemTokenizer } from '@yozora/tokenizer-list-item'
import { PhrasingContentType } from '@yozora/tokenizercore-block'
import { ListTaskItemTokenizer } from '../src'


const caseRootDirectory = path.resolve(__dirname, 'cases')
const tester = new BlockTokenizerTester({ caseRootDirectory })


tester.context
  .useTokenizer(new ListItemTokenizer({
    interruptableTypes: [PhrasingContentType],
  }))
  .useTokenizer(new ListTaskItemTokenizer())


tester
  .scan('gfm')
  .scan('*.json')
  .runAnswer()
