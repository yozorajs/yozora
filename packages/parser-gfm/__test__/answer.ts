import path from 'path'
import { ParserTester } from '@yozora/jest-for-tokenizer'
import { gfmDataNodeParser } from '../src'


const caseRootDirectory = path.resolve(__dirname, 'cases')
const tester = new ParserTester({
  caseRootDirectory,
  parser: gfmDataNodeParser,
})


tester
  .scan('**/*')
  .runAnswer()
