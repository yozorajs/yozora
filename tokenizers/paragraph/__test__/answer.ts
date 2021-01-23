import path from 'path'
import { BlockTokenizerTester } from '@yozora/jest-for-tokenizer'
import { ParagraphTokenizer } from '../src'


const caseRootDirectory = path.resolve(__dirname, 'cases')
const tester = new BlockTokenizerTester({ caseRootDirectory })

tester.context
  .useTokenizer(new ParagraphTokenizer())


tester
  .scan('gfm')
  .scan('*.json')
  .runAnswer()
