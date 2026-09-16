import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import type { IParser } from '@yozora/core-parser'
import type { IMarkupWeaver } from '@yozora/markup-gfm'
import { MarkupTester } from './MarkupTester'
import { TokenizerTester } from './TokenizerTester'
import type { ParserName } from './types'

export * from './answer'
export * from './BaseTester'
export * from './MarkupTester'
export * from './TokenizerTester'
export * from './types'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

// Find monorepo root by looking for fixtures directory
const findMonorepoRoot = (): string => {
  let dir = __dirname
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'fixtures'))) {
      return dir
    }
    dir = path.dirname(dir)
  }
  throw new Error('Cannot find monorepo root with fixtures directory')
}

// Root directory of cases carried in the monorepo
export const fixtureRootDirectory = path.join(findMonorepoRoot(), 'fixtures')

// Create a tester with the specific parser
export const createTokenizerTester = (parserName: ParserName, parser: IParser): TokenizerTester =>
  new TokenizerTester({
    caseRootDirectory: fixtureRootDirectory,
    parser,
    parserName,
  })

// Create testers with the specific parsers
export const createTokenizerTesters = (
  ...parsers: readonly (readonly [ParserName, IParser])[]
): TokenizerTester[] =>
  parsers.map(([parserName, parser]) => createTokenizerTester(parserName, parser))

export const createMarkupTester = (
  parserName: ParserName,
  parser: IParser,
  weaver: IMarkupWeaver,
): MarkupTester =>
  new MarkupTester({
    caseRootDirectory: fixtureRootDirectory,
    parser,
    parserName,
    weaver,
  })
