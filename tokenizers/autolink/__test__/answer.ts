import path from 'path'
import { InlineTokenizerTester } from '@yozora/jest-for-tokenizer'
import { TextTokenizer } from '@yozora/tokenizer-text'
import { AutolinkTokenizer } from '../src'


const caseRootDirectory = path.resolve(__dirname, 'cases')
const fallbackTokenizer = new TextTokenizer({ priority: -1 })
const tester = new InlineTokenizerTester({ caseRootDirectory, fallbackTokenizer })
tester.context
  .useTokenizer(new AutolinkTokenizer({ priority: 1 }))


tester
  .scan('gfm')
  .scan('*.json')
  .runAnswer()
