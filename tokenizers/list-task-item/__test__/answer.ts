import path from 'path'
import { BlockTokenizerTester } from '@yozora/jest-for-tokenizer'
import { ListBulletItemTokenizer } from '@yozora/tokenizer-list-bullet-item'
import { ListOrderedItemTokenizer } from '@yozora/tokenizer-list-ordered-item'
import { ParagraphTokenizer } from '@yozora/tokenizer-paragraph'
import { ListTaskItemTokenizer } from '../src'


const caseRootDirectory = path.resolve(__dirname, 'cases')
const fallbackTokenizer = new ParagraphTokenizer({ priority: -1 })

const tester = new BlockTokenizerTester({
  caseRootDirectory,
  fallbackTokenizer,
})

tester.context
  .useTokenizer(new ListTaskItemTokenizer({ priority: 1 }))
  .useTokenizer(new ListBulletItemTokenizer({ priority: 2 }))
  .useTokenizer(new ListOrderedItemTokenizer({ priority: 2 }))
  .useTokenizer(BlockTokenizerTester.defaultInlineDataTokenizer())


tester
  .scan('gfm')
  .scan('*.json')
  .runAnswer()
