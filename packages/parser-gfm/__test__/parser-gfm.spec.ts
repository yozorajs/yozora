import path from 'path'
import { ParserTester } from '@yozora/jest-for-tokenizer'
import { gfmParser, gfmExParser } from '../src'


const caseRootDirectory = path.resolve(__dirname, 'cases')
const tester = new ParserTester({
  caseRootDirectory,
  parser: gfmParser,
})
const exTester = new ParserTester({
  caseRootDirectory,
  parser: gfmExParser,
})


tester
  .scan([
    '**/*.json',
    '!autolink-extension/*'
  ])
  .runTest()


exTester
  .scan([
    '**/*.json',
    '!**/#616.json',
    '!**/#619.json',
    '!**/#620.json',
  ])
  .runTest()
