/* eslint-disable import/no-extraneous-dependencies */
import type { IParser } from '@yozora/core-parser'
import type { IMarkupWeaver } from '@yozora/core-weaver'
import { DefaultMarkupWeaver } from '@yozora/core-weaver'
import YozoraParser from '@yozora/parser'
import GfmParser from '@yozora/parser-gfm'
import GfmExParser from '@yozora/parser-gfm-ex'
import fs from 'fs-extra'
import path from 'path'

export const parsers = {
  get gfm(): IParser {
    return new GfmParser({
      defaultParseOptions: { shouldReservePosition: true },
    })
  },
  get gfmEx(): IParser {
    return new GfmExParser({
      defaultParseOptions: { shouldReservePosition: true },
    })
  },
  get yozora(): IParser {
    return new YozoraParser({
      defaultParseOptions: { shouldReservePosition: true },
    })
  },
}

export const weavers = {
  get yozora(): IMarkupWeaver {
    return new DefaultMarkupWeaver()
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
