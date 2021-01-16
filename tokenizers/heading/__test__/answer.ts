import path from 'path'
import { BlockTokenizerTester } from '@yozora/jest-for-tokenizer'
import { HeadingTokenizer } from '../src'


const caseRootDirectory = path.resolve(__dirname, 'cases')
const tester = new BlockTokenizerTester({ caseRootDirectory })


tester.context
  .useTokenizer(new HeadingTokenizer())
  .useTokenizer(BlockTokenizerTester.defaultInlineDataTokenizer())


tester
  .scan('gfm')
  .scan('*.json')
  .runAnswer()
