/* eslint-disable import/no-extraneous-dependencies */
import type { YastParser } from '@yozora/core-parser'
import YozoraParser from '@yozora/parser'
import GfmParser from '@yozora/parser-gfm'
import GfmExParser from '@yozora/parser-gfm-ex'
import fs from 'fs-extra'
import path from 'path'

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

export const workspaceRootDir = __dirname
export const testRootDior = path.resolve()

/**
 * Locate fixture filepath.
 * @param p
 * @returns
 */
export const locateFixture = (...p: string[]): string =>
  path.join(testRootDior, '__test__/fixtures', ...p)

/**
 * Load fixture filepath.
 * @param p
 * @returns
 */
export const loadFixtures = (...p: string[]): string =>
  fs.readFileSync(locateFixture(...p), 'utf-8')

export const loadJSONFixture = (...p: string[]): any => {
  const filepath = locateFixture(...p)
  return fs.readJsonSync(filepath)
}
