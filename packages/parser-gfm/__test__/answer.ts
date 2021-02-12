import path from 'path'
import { ParserTester } from '@yozora/jest-for-tokenizer'
import { createExGFMParser, createGFMParser } from '../src'


const caseRootDirectory = path.resolve(__dirname, 'cases')
const tester = new ParserTester({
  caseRootDirectory,
  parser: createGFMParser(),
})
const exTester = new ParserTester({
  caseRootDirectory,
  parser: createExGFMParser(),
})


tester
  .scan([
    '**/#616.json',
    '**/#619.json',
    '**/#620.json',
  ])
  .runAnswer()


exTester
  .scan([
    '**/*.json',
    '!**/#616.json',
    '!**/#619.json',
    '!**/#620.json',
  ])
  .runAnswer()
