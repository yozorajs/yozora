// @ts-check

import path from 'node:path'
import { repositoryRoot } from '../internal/repository.mjs'
import { MarkupTester } from './markup-tester.mjs'
import { TokenizerTester } from './tokenizer-tester.mjs'

/** @import { IMarkupWeaver } from '@yozora/markup-gfm' */
/** @import { IParser } from '@yozora/parser' */
/** @import { ParserName } from './types.mjs' */

export * from './answer.mjs'
export * from './base-tester.mjs'
export * from './markup-tester.mjs'
export * from './tokenizer-tester.mjs'
export * from './types.mjs'

// Root directory of cases carried in the monorepo.
export const fixtureRootDirectory = path.join(repositoryRoot, 'fixtures')

/**
 * @param {ParserName} parserName
 * @param {IParser} parser
 * @returns {TokenizerTester}
 */
export const createTokenizerTester = (parserName, parser) =>
  new TokenizerTester({
    caseRootDirectory: fixtureRootDirectory,
    parser,
    parserName,
  })

/**
 * @param {...readonly [ParserName, IParser]} parsers
 * @returns {TokenizerTester[]}
 */
export const createTokenizerTesters = (...parsers) =>
  parsers.map(([parserName, parser]) => createTokenizerTester(parserName, parser))

/**
 * @param {ParserName} parserName
 * @param {IParser} parser
 * @param {IMarkupWeaver} weaver
 * @returns {MarkupTester}
 */
export const createMarkupTester = (parserName, parser, weaver) =>
  new MarkupTester({
    caseRootDirectory: fixtureRootDirectory,
    parser,
    parserName,
    weaver,
  })
