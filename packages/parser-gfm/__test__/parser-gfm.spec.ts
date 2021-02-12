import path from 'path'
import { ParserTester } from '@yozora/jest-for-tokenizer'
import { createExGFMParser, createGFMParser } from '../src'


const caseRootDirectory = path.resolve(__dirname, 'cases')
const tester = new ParserTester({
  caseRootDirectory,
  parser: createGFMParser({ shouldReservePosition: false }),
})
const exTester = new ParserTester({
  caseRootDirectory,
  parser: createExGFMParser({ shouldReservePosition: false }),
})


tester
  .scan([
    '**/*.json',
    '!autolink-extension/**/*',
    '!delete/**/*',
    '!list-item/task list items\\(extension\\)/**/*',
    '!table/**/*',
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
