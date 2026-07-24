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

interface IGfmFixtureCatalog {
  directoryName: string
  groups: Map<string, string[]>
  groupNames: string[]
  exampleIds: Set<string>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function loadGfmFixtureCatalog(directoryName: string): IGfmFixtureCatalog {
  const directory = path.join(workspaceRootDir, 'fixtures', directoryName)
  const metadata: unknown = JSON.parse(fs.readFileSync(path.join(directory, 'meta.json'), 'utf8'))
  const groups = new Map<string, string[]>()
  const exampleIds = new Set<string>()

  function collectGroups(group: unknown, groupPath: string[], allowEmpty = false): void {
    if (!Array.isArray(group)) {
      if (!isRecord(group) || (!allowEmpty && Object.keys(group).length === 0)) {
        throw new TypeError(
          `Invalid ${directoryName} fixture group ${JSON.stringify(groupPath.join('/'))}`,
        )
      }
      for (const [name, child] of Object.entries(group)) {
        if (name.length === 0 || name.includes('/')) {
          throw new TypeError(`Invalid ${directoryName} fixture group name ${JSON.stringify(name)}`)
        }
        collectGroups(child, [...groupPath, name])
      }
      return
    }

    const groupName = groupPath.join('/')
    if (groupName.length === 0 || group.length === 0) {
      throw new TypeError(`Invalid ${directoryName} fixture group ${JSON.stringify(groupName)}`)
    }
    const groupExampleIds: string[] = []
    for (const exampleId of group) {
      if (typeof exampleId !== 'string' || !/^#\d{3}$/.test(exampleId)) {
        throw new TypeError(
          `Invalid ${directoryName} fixture ID ${JSON.stringify(exampleId)} in ${groupName}`,
        )
      }
      if (exampleIds.has(exampleId)) {
        throw new Error(`${directoryName} fixture ${exampleId} belongs to more than one group`)
      }
      exampleIds.add(exampleId)
      groupExampleIds.push(exampleId)
    }
    groups.set(groupName, groupExampleIds)
  }

  if (!isRecord(metadata) || !isRecord(metadata['groups'])) {
    throw new TypeError(`Invalid fixtures/${directoryName}/meta.json`)
  }
  const metadataGroups = metadata['groups']
  const groupScopes = Object.keys(metadataGroups).sort()
  if (groupScopes.join('\n') !== 'ast\nunclassified') {
    throw new TypeError(`${directoryName} fixture groups must contain only ast and unclassified`)
  }
  collectGroups(metadataGroups['ast'], [], true)
  collectGroups(metadataGroups['unclassified'], ['unclassified'], true)

  const actualExampleIds = fs
    .readdirSync(directory, { withFileTypes: true })
    .map(entry => {
      if (entry.isDirectory())
        throw new Error(`${directoryName} fixtures must be flat: ${entry.name}`)
      if (/^#\d{3}[.]json$/.test(entry.name)) return entry.name.slice(0, -5)
      if (entry.name !== 'meta.json' && entry.name.endsWith('.json')) {
        throw new Error(`Unexpected ${directoryName} fixture file ${entry.name}`)
      }
      return null
    })
    .filter((exampleId): exampleId is string => exampleId != null)
    .sort()
  const metadataExampleIds = Array.from(exampleIds).sort()

  if (actualExampleIds.join('\n') !== metadataExampleIds.join('\n')) {
    throw new Error(
      `fixtures/${directoryName}/meta.json does not match the flat ${directoryName} fixture files`,
    )
  }

  return { directoryName, groups, groupNames: Array.from(groups.keys()), exampleIds }
}

const gfmFixtureCatalogs = ['gfm', 'gfm-old'].map(loadGfmFixtureCatalog)
const currentGfmFixtureCatalog = gfmFixtureCatalogs[0]
const gfmGroupNames = currentGfmFixtureCatalog.groupNames
for (const catalog of gfmFixtureCatalogs.slice(1)) {
  for (const groupName of catalog.groupNames) {
    if (!gfmGroupNames.includes(groupName)) {
      throw new Error(`Unknown ${catalog.directoryName} fixture group: ${groupName}`)
    }
  }
}

function validateGfmGroupSelectors(selectors: readonly string[], optionName: string): void {
  for (const selector of selectors) {
    if (!gfmGroupNames.some(name => name === selector || name.startsWith(`${selector}/`))) {
      throw new Error(`Unknown GFM fixture group in ${optionName}: ${selector}`)
    }
  }
}

function selectGfmExamples({
  includeGroups,
  excludeGroups = [],
  excludeExamples = [],
}: IGfmFixtureSelection): Map<IGfmFixtureCatalog, Set<string>> {
  if (includeGroups != null) validateGfmGroupSelectors(includeGroups, 'includeGroups')
  validateGfmGroupSelectors(excludeGroups, 'excludeGroups')

  const selectedExamplesByCatalog = new Map<IGfmFixtureCatalog, Set<string>>()
  for (const catalog of gfmFixtureCatalogs) {
    const selectedGroups = catalog.groupNames.filter(
      groupName =>
        (includeGroups == null ||
          includeGroups.some(
            selector => groupName === selector || groupName.startsWith(`${selector}/`),
          )) &&
        !excludeGroups.some(
          selector => groupName === selector || groupName.startsWith(`${selector}/`),
        ),
    )

    selectedExamplesByCatalog.set(
      catalog,
      new Set(selectedGroups.flatMap(groupName => catalog.groups.get(groupName)!)),
    )
  }

  for (const exampleId of excludeExamples) {
    let deleted = false
    for (const selectedExamples of selectedExamplesByCatalog.values()) {
      deleted = selectedExamples.delete(exampleId) || deleted
    }
    if (!deleted) {
      throw new Error(`Excluded GFM fixture is not selected: ${exampleId}`)
    }
  }
  return selectedExamplesByCatalog
}

export function scanGfmFixtures<T extends BaseTester>(
  tester: T,
  selection: IGfmFixtureSelection = {},
): T {
  const selectedExamplesByCatalog = selectGfmExamples(selection)
  for (const catalog of gfmFixtureCatalogs) {
    const selectedExamples = selectedExamplesByCatalog.get(catalog)!
    tester.scan(`${catalog.directoryName}/#*.json`, undefined, filepath =>
      selectedExamples.has(path.basename(filepath, '.json')),
    )
  }
  return tester
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
