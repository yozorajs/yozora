import path from 'path'
import { BlockTokenizerTester } from '@yozora/jest-for-tokenizer'
import { PhrasingContentTokenizer } from '@yozora/tokenizer-phrasing-content'
import { ParagraphTokenizer } from '../src'


const caseRootDirectory = path.resolve(__dirname, 'cases')
const fallbackTokenizer = new PhrasingContentTokenizer({ priority: -1 })
; (fallbackTokenizer as any).uniqueTypes = []

const tester = new BlockTokenizerTester({
  caseRootDirectory,
  fallbackTokenizer,
})

tester.context
  .useTokenizer(new ParagraphTokenizer({ priority: 1 }))
  .useTokenizer(BlockTokenizerTester.defaultInlineDataTokenizer())


tester
  .scan('gfm')
  .scan('*.json')
  .runAnswer()
