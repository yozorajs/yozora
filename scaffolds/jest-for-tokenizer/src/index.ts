import type { IParser } from '@yozora/core-parser'
import fs from 'fs-extra'
import path from 'path'
import { TokenizerTester } from './tester'

export * from './tester'
export * from './types'

const findPackageLocation = (p: string): string | never => {
  const stat = fs.statSync(p)
  if (stat.isDirectory()) {
    if (fs.existsSync(path.join(p, 'package.json'))) return p
  }

  const dir = path.dirname(p)
  if (dir === p) {
    throw new ReferenceError('Cannot find package.json location of @yozora/jest-for-tokenizer.')
  }
  return findPackageLocation(dir)
}

// Root directory of cases carried in this package.
export const fixtureRootDirectory = path.join(findPackageLocation(__dirname), 'fixtures')

// Create a tester with the specific parser.
export const createTokenizerTester = (parser: IParser): TokenizerTester =>
  new TokenizerTester({
    caseRootDirectory: fixtureRootDirectory,
    parser,
  })

// Create testers with the specific parsers.
export const createTokenizerTesters = (...parsers: IParser[]): TokenizerTester[] =>
  parsers.map(createTokenizerTester)
