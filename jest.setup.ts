import { fixtureRootDirectory, TokenizerTester } from '@yozora/jest-for-tokenizer'
import { createExGFMParser, createGFMParser } from '@yozora/parser-gfm'


export const createTester = () => new TokenizerTester({
  caseRootDirectory: fixtureRootDirectory,
  parser: createGFMParser({ shouldReservePosition: false }),
})


export const createExTester = () => new TokenizerTester({
  caseRootDirectory: fixtureRootDirectory,
  parser: createExGFMParser({ shouldReservePosition: false }),
})
