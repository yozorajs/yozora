/* eslint-disable import/no-extraneous-dependencies */
import type { YastParser } from '@yozora/core-parser'
import {
  TokenizerTester,
  fixtureRootDirectory,
} from '@yozora/jest-for-tokenizer'
import YozoraParser from '@yozora/parser'
import { createExGFMParser, createGFMParser } from '@yozora/parser-gfm'

export const createTester = (parser: YastParser): TokenizerTester =>
  new TokenizerTester({
    caseRootDirectory: fixtureRootDirectory,
    parser,
  })

export const parsers = {
  get gfm() {
    return createGFMParser({ shouldReservePosition: true })
  },
  get gfmEx() {
    return createExGFMParser({ shouldReservePosition: true })
  },
  get yozora() {
    return new YozoraParser({ shouldReservePosition: true })
  },
}
