/* eslint-disable import/no-extraneous-dependencies */
import {
  TokenizerTester,
  fixtureRootDirectory,
} from '@yozora/jest-for-tokenizer'
import { createExGFMParser, createGFMParser } from '@yozora/parser-gfm'

export const createTester = (): TokenizerTester =>
  new TokenizerTester({
    caseRootDirectory: fixtureRootDirectory,
    parser: createGFMParser({ shouldReservePosition: true }),
  })

export const createExTester = (): TokenizerTester =>
  new TokenizerTester({
    caseRootDirectory: fixtureRootDirectory,
    parser: createExGFMParser({ shouldReservePosition: true }),
  })
