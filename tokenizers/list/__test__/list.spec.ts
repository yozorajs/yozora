import path from 'path'
import { BlockTokenizerTester } from '@yozora/jest-for-tokenizer'
import { ListBulletItemTokenizer } from '@yozora/tokenizer-list-bullet-item'
import { ListOrderedItemTokenizer } from '@yozora/tokenizer-list-ordered-item'
import { ListTaskItemTokenizer } from '@yozora/tokenizer-list-task-item'
import { ListTokenizer } from '../src'


const caseRootDirectory = path.resolve(__dirname, 'cases')
const tester = new BlockTokenizerTester({ caseRootDirectory })


tester.context
  .useTokenizer(new ListTokenizer({ priority: 1 }))
  .useTokenizer(new ListBulletItemTokenizer({ priority: 2 }))
  .useTokenizer(new ListOrderedItemTokenizer({ priority: 2 }))
  .useTokenizer(new ListTaskItemTokenizer({ priority: 2 }))
  .useTokenizer(BlockTokenizerTester.defaultInlineDataTokenizer())


tester
  .scan('gfm')
  .scan('*.json')
  .runTest()
