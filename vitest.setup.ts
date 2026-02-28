import type { IParser } from '@yozora/core-parser'
import type { IMarkupWeaver } from '@yozora/markup-weaver'
import { DefaultMarkupWeaver } from '@yozora/markup-weaver'
import YozoraParser from '@yozora/parser'
import GfmParser from '@yozora/parser-gfm'
import GfmExParser from '@yozora/parser-gfm-ex'
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

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

export const generateParseData = (filepath: string): void => {
  const content = fs.readFileSync(filepath, 'utf8')
  const result = parsers.yozora.parse(content)
  const data = JSON.stringify(result, null, 2)
  fs.writeFileSync(filepath + '.json', data, 'utf8')
}

export const weavers = {
  get yozora(): IMarkupWeaver {
    return new DefaultMarkupWeaver()
  },
}

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
export const workspaceRootDir = __dirname
export const testRootDir = path.resolve()

/**
 * Locate fixture filepath.
 * @param p
 * @returns
 */
export const locateFixture = (...p: string[]): string =>
  path.join(testRootDir, '__test__/fixtures', ...p)

/**
 * Load fixture filepath.
 * @param p
 * @returns
 */
export const loadFixtures = (...p: string[]): string =>
  fs.readFileSync(locateFixture(...p), 'utf-8')

export const loadJSONFixture = (...p: string[]): any => {
  const filepath = locateFixture(...p)
  const content = fs.readFileSync(filepath, { encoding: 'utf8' })
  return JSON.parse(content)
}
