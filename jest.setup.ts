/* eslint-disable import/no-extraneous-dependencies */
import type { YastParser } from '@yozora/core-parser'
import {
  TokenizerTester,
  fixtureRootDirectory,
} from '@yozora/jest-for-tokenizer'
import YozoraParser from '@yozora/parser'
import GfmParser from '@yozora/parser-gfm'
import GfmExParser from '@yozora/parser-gfm-ex'

export const createTester = (parser: YastParser): TokenizerTester =>
  new TokenizerTester({
    caseRootDirectory: fixtureRootDirectory,
    parser,
  })

export const parsers = {
  get gfm() {
    return new GfmParser({ shouldReservePosition: true })
  },
  get gfmEx() {
    return new GfmExParser({ shouldReservePosition: true })
  },
  get yozora() {
    return new YozoraParser({ shouldReservePosition: true })
  },
}
