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

export const createTesters = (...parsers: YastParser[]): TokenizerTester[] =>
  parsers.map(createTester)

export const parsers = {
  get gfm(): YastParser {
    return new GfmParser({
      defaultParseOptions: { shouldReservePosition: true },
    })
  },
  get gfmEx(): YastParser {
    return new GfmExParser({
      defaultParseOptions: { shouldReservePosition: true },
    })
  },
  get yozora(): YastParser {
    return new YozoraParser({
      defaultParseOptions: { shouldReservePosition: true },
    })
  },
}
