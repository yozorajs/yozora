import path from 'path'
import { BlockTokenizerTester } from '@yozora/jest-for-tokenizer'
import { ThematicBreakTokenizer } from '../src'


const caseRootDirectory = path.resolve(__dirname, 'cases')
const tester = new BlockTokenizerTester({ caseRootDirectory })


tester.context
  .useTokenizer(new ThematicBreakTokenizer())


tester
  .scan('gfm')
  .scan('*.json')
  .runAnswer()
