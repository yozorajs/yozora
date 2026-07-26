import type { IParser } from '@yozora/core-parser'
import type { IMarkupWeaver } from '@yozora/markup-weaver'
import { DefaultMarkupWeaver } from '@yozora/markup-weaver'
import YozoraParser from '@yozora/parser'
import GfmParser from '@yozora/parser-gfm'
import GfmExParser from '@yozora/parser-gfm-ex'
import type { BaseTester } from '@yozora/test-util'
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

export interface IGfmFixtureSelection {
  includeGroups?: readonly string[]
  excludeGroups?: readonly string[]
  excludeExamples?: readonly string[]
}

const gfmFixtureDirectory = path.join(workspaceRootDir, 'fixtures/gfm')
const gfmFixtureMeta: unknown = JSON.parse(
  fs.readFileSync(path.join(gfmFixtureDirectory, 'meta.json'), 'utf8'),
)
const gfmFixtureGroups = new Map<string, string[]>()
const allGfmExampleIds = new Set<string>()

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function collectGfmFixtureGroups(group: unknown, groupPath: string[]): void {
  if (!Array.isArray(group)) {
    if (!isRecord(group) || Object.keys(group).length === 0) {
      throw new TypeError(`Invalid GFM fixture group ${JSON.stringify(groupPath.join('/'))}`)
    }
    for (const [name, child] of Object.entries(group)) {
      if (name.length === 0 || name.includes('/')) {
        throw new TypeError(`Invalid GFM fixture group name ${JSON.stringify(name)}`)
      }
      collectGfmFixtureGroups(child, [...groupPath, name])
    }
    return
  }

  const groupName = groupPath.join('/')
  if (groupName.length === 0 || group.length === 0) {
    throw new TypeError(`Invalid GFM fixture group ${JSON.stringify(groupName)}`)
  }
  for (const exampleId of group) {
    if (typeof exampleId !== 'string' || !/^#\d{3}$/.test(exampleId)) {
      throw new TypeError(`Invalid GFM fixture ID ${JSON.stringify(exampleId)} in ${groupName}`)
    }
    if (allGfmExampleIds.has(exampleId)) {
      throw new Error(`GFM fixture ${exampleId} belongs to more than one group`)
    }
    allGfmExampleIds.add(exampleId)
  }
  gfmFixtureGroups.set(groupName, group)
}

if (!isRecord(gfmFixtureMeta) || !isRecord(gfmFixtureMeta['groups'])) {
  throw new TypeError('Invalid fixtures/gfm/meta.json')
}
const metaGroups = gfmFixtureMeta['groups']
const groupScopes = Object.keys(metaGroups).sort()
if (groupScopes.join('\n') !== 'ast\nunclassified') {
  throw new TypeError('GFM fixture groups must contain only ast and unclassified')
}
collectGfmFixtureGroups(metaGroups['ast'], [])
collectGfmFixtureGroups(metaGroups['unclassified'], ['unclassified'])
const gfmGroupNames = Array.from(gfmFixtureGroups.keys())

const actualGfmExampleIds = fs
  .readdirSync(gfmFixtureDirectory, { withFileTypes: true })
  .map(entry => {
    if (entry.isDirectory()) throw new Error(`GFM fixtures must be flat: ${entry.name}`)
    if (/^#\d{3}[.]json$/.test(entry.name)) return entry.name.slice(0, -5)
    if (entry.name !== 'meta.json' && entry.name.endsWith('.json')) {
      throw new Error(`Unexpected GFM fixture file ${entry.name}`)
    }
    return null
  })
  .filter((exampleId): exampleId is string => exampleId != null)
  .sort()
const metadataGfmExampleIds = Array.from(allGfmExampleIds).sort()

if (actualGfmExampleIds.join('\n') !== metadataGfmExampleIds.join('\n')) {
  throw new Error('fixtures/gfm/meta.json does not match the flat GFM fixture files')
}

function selectGfmGroups(selectors: readonly string[], optionName: string): string[] {
  for (const selector of selectors) {
    if (!gfmGroupNames.some(name => name === selector || name.startsWith(`${selector}/`))) {
      throw new Error(`Unknown GFM fixture group in ${optionName}: ${selector}`)
    }
  }
  return gfmGroupNames.filter(name =>
    selectors.some(selector => name === selector || name.startsWith(`${selector}/`)),
  )
}

function selectGfmExamples({
  includeGroups,
  excludeGroups = [],
  excludeExamples = [],
}: IGfmFixtureSelection): Set<string> {
  const selectedGroups = new Set(
    includeGroups == null ? gfmGroupNames : selectGfmGroups(includeGroups, 'includeGroups'),
  )
  for (const groupName of selectGfmGroups(excludeGroups, 'excludeGroups')) {
    selectedGroups.delete(groupName)
  }

  const selectedExamples = new Set(
    Array.from(selectedGroups).flatMap(groupName => gfmFixtureGroups.get(groupName)!),
  )
  for (const exampleId of excludeExamples) {
    if (!selectedExamples.delete(exampleId)) {
      throw new Error(`Excluded GFM fixture is not selected: ${exampleId}`)
    }
  }

  return selectedExamples
}

export function scanGfmFixtures<T extends BaseTester>(
  tester: T,
  selection: IGfmFixtureSelection = {},
): T {
  const selectedExamples = selectGfmExamples(selection)
  return tester.scan('gfm/#*.json', undefined, filepath =>
    selectedExamples.has(path.basename(filepath, '.json')),
  )
}

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
