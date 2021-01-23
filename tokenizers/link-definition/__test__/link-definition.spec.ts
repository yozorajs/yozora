import path from 'path'
import { BlockTokenizerTester } from '@yozora/jest-for-tokenizer'
import { LinkDefinitionTokenizer } from '../src'


const caseRootDirectory = path.resolve(__dirname, 'cases')
const tester = new BlockTokenizerTester({ caseRootDirectory })


tester.context
  .useTokenizer(new LinkDefinitionTokenizer())


tester
  .scan('gfm')
  .scan('*.json')
  .runTest()
