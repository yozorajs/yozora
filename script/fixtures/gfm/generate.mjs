import { createHash, randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import { format, resolveConfig } from 'prettier'
import { repositoryRoot } from '../../internal/repository.mjs'

const readLocalJson = filename =>
  JSON.parse(fs.readFileSync(new URL(filename, import.meta.url), 'utf8'))
const defaultExamples = readLocalJson('./examples.json')
const defaultGroups = readLocalJson('./groups.json')
const fixtureDirectoryNames = ['gfm', 'gfm-new']
const transactionArtifactPattern = /[.]gfm-(?:sync|backup)-/

const formatFixtureId = exampleNo => `#${String(exampleNo).padStart(3, '0')}`
const hasOwn = (value, key) => Object.hasOwn(value, key)
const isRecord = value => value != null && typeof value === 'object' && !Array.isArray(value)

function parseJson(raw, filepath) {
  try {
    return JSON.parse(raw)
  } catch (error) {
    throw new SyntaxError(`Invalid JSON in ${filepath}`, { cause: error })
  }
}

function validateFixture(data, filepath, filename) {
  if (!isRecord(data) || typeof data.title !== 'string') {
    throw new TypeError(`Invalid GFM fixture ${filepath}`)
  }
  const titleMatch = /^GFM#(\d+) https:\/\/github[.]github[.]com\/gfm\/#example-(\d+)$/.exec(
    data.title,
  )
  if (titleMatch == null || titleMatch[1] !== titleMatch[2]) {
    throw new TypeError(`Invalid GFM fixture title in ${filepath}`)
  }
  const exampleNo = Number(titleMatch[1])
  if (`${formatFixtureId(exampleNo)}.json` !== filename) {
    throw new TypeError(`GFM fixture filename/title mismatch in ${filepath}`)
  }
  if (!Array.isArray(data.cases) || data.cases.length !== 1) {
    throw new TypeError(`GFM fixture must contain exactly one case: ${filepath}`)
  }
  const fixtureCase = data.cases[0]
  if (!isRecord(fixtureCase) || typeof fixtureCase.input !== 'string') {
    throw new TypeError(`Invalid GFM fixture case in ${filepath}`)
  }
  if (
    !isRecord(fixtureCase.answer) ||
    !isRecord(fixtureCase.answer.gfm) ||
    Object.entries(fixtureCase.answer).some(
      ([name, answer]) => !['gfm', 'gfm-ex', 'yozora'].includes(name) || !isRecord(answer),
    )
  ) {
    throw new TypeError(`Invalid GFM fixture answer in ${filepath}`)
  }
  return { exampleNo, fixtureCase }
}

function readFixtureDirectory(fixturesRoot, directoryName, allowMeta = false) {
  const directory = path.join(fixturesRoot, directoryName)
  const result = { records: [], meta: null, metaRaw: null }
  if (!fs.existsSync(directory)) return result

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filepath = path.join(directory, entry.name)
    if (allowMeta && entry.isFile() && entry.name === 'meta.json') {
      result.metaRaw = fs.readFileSync(filepath, 'utf8')
      result.meta = parseJson(result.metaRaw, filepath)
      continue
    }
    if (!entry.isFile() || !/^#\d{3}[.]json$/.test(entry.name)) {
      throw new Error(`Unexpected GFM fixture entry ${filepath}`)
    }

    const raw = fs.readFileSync(filepath, 'utf8')
    const data = parseJson(raw, filepath)
    const { exampleNo, fixtureCase } = validateFixture(data, filepath, entry.name)
    result.records.push({
      source: directoryName,
      filename: entry.name,
      exampleNo,
      input: fixtureCase.input,
      data,
      raw,
    })
  }
  result.records.sort((left, right) => left.exampleNo - right.exampleNo)
  return result
}

function calculateFixtureFingerprint(fixturesRoot) {
  const hash = createHash('sha256')
  for (const directoryName of fixtureDirectoryNames) {
    const directory = path.join(fixturesRoot, directoryName)
    hash.update(`${directoryName}\0`)
    if (!fs.existsSync(directory)) continue
    for (const entry of fs
      .readdirSync(directory, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      hash.update(`${entry.name}\0${entry.isFile() ? 'file' : 'other'}\0`)
      if (entry.isFile()) hash.update(fs.readFileSync(path.join(directory, entry.name)))
    }
  }
  return hash.digest('hex')
}

function flattenMetaFixtureIds(value, filepath) {
  if (Array.isArray(value)) {
    if (!value.every(item => typeof item === 'string' && /^#\d{3}$/.test(item))) {
      throw new TypeError(`Invalid fixture IDs in ${filepath}`)
    }
    return value
  }
  if (!isRecord(value)) throw new TypeError(`Invalid group tree in ${filepath}`)
  return Object.values(value).flatMap(child => flattenMetaFixtureIds(child, filepath))
}

function validateBaselineMetadata(meta, records, filepath) {
  if (!isRecord(meta) || !isRecord(meta.groups)) {
    throw new TypeError(`Invalid GFM metadata ${filepath}`)
  }
  const metadataIds = flattenMetaFixtureIds(meta.groups, filepath).slice().sort()
  const fixtureIds = records.map(record => formatFixtureId(record.exampleNo)).sort()
  if (!isDeepStrictEqual(metadataIds, fixtureIds)) {
    throw new Error(`GFM metadata does not cover the baseline fixtures: ${filepath}`)
  }
}

function validateExamples(examples) {
  if (!Array.isArray(examples) || examples[0] !== null || examples.length < 2) {
    throw new TypeError('Invalid GFM examples')
  }
  return examples.slice(1).map((example, index) => {
    const exampleNo = index + 1
    if (
      !isRecord(example) ||
      example.title !== `GFM#${exampleNo} https://github.github.com/gfm/#example-${exampleNo}` ||
      typeof example.content !== 'string' ||
      typeof example.expectedHtml !== 'string' ||
      (example.description !== undefined && typeof example.description !== 'string')
    ) {
      throw new TypeError(`Invalid GFM example ${exampleNo}`)
    }
    return { exampleNo, input: example.content, example }
  })
}

function groupByInput(records) {
  const result = new Map()
  for (const record of records) {
    const group = result.get(record.input) || []
    group.push(record)
    result.set(record.input, group)
  }
  return result
}

function pairFixturesByInput(currentExamples, legacyFixtures) {
  const currentByInput = groupByInput(currentExamples)
  const legacyByInput = groupByInput(legacyFixtures)
  const inputs = new Set([...currentByInput.keys(), ...legacyByInput.keys()])
  const matches = []
  const currentOnly = []
  const legacyOnly = []

  for (const input of inputs) {
    const current = (currentByInput.get(input) || [])
      .slice()
      .sort((a, b) => a.exampleNo - b.exampleNo)
    const legacy = (legacyByInput.get(input) || []).slice().sort((left, right) => {
      if (left.exampleNo !== right.exampleNo) return left.exampleNo - right.exampleNo
      return (
        fixtureDirectoryNames.indexOf(left.source) - fixtureDirectoryNames.indexOf(right.source)
      )
    })
    const remainingCurrent = []

    for (const currentExample of current) {
      const legacyIndex = legacy.findIndex(record => record.exampleNo === currentExample.exampleNo)
      if (legacyIndex < 0) remainingCurrent.push(currentExample)
      else matches.push({ current: currentExample, legacy: legacy.splice(legacyIndex, 1)[0] })
    }

    const pairCount = Math.min(remainingCurrent.length, legacy.length)
    for (let index = 0; index < pairCount; ++index) {
      matches.push({ current: remainingCurrent[index], legacy: legacy[index] })
    }
    currentOnly.push(...remainingCurrent.slice(pairCount))
    legacyOnly.push(...legacy.slice(pairCount))
  }

  matches.sort((left, right) => left.current.exampleNo - right.current.exampleNo)
  currentOnly.sort((left, right) => left.exampleNo - right.exampleNo)
  legacyOnly.sort((left, right) => left.exampleNo - right.exampleNo)
  return { matches, currentOnly, legacyOnly }
}

function mapExampleToFixture(example, legacyCase) {
  const fixtureCase = {
    ...(example.description === undefined ? {} : { description: example.description }),
    input: example.content,
    answer: {
      ...legacyCase.answer,
      gfm: { ...legacyCase.answer.gfm, html: example.expectedHtml },
    },
  }
  return { title: example.title, cases: [fixtureCase] }
}

function mapNewExampleToFixture(example) {
  return {
    title: example.title,
    cases: [
      {
        ...(example.description === undefined ? {} : { description: example.description }),
        input: example.content,
        answer: { gfm: { html: example.expectedHtml } },
      },
    ],
  }
}

function setGroupFixtureIds(groupTree, groupPath, fixtureIds) {
  let current = groupTree
  for (let index = 0; index < groupPath.length; ++index) {
    const name = groupPath[index]
    if (index === groupPath.length - 1) {
      if (current[name] != null) {
        throw new Error(`Duplicate GFM fixture group ${groupPath.join('/')}`)
      }
      current[name] = fixtureIds
      return
    }

    const child = current[name]
    if (Array.isArray(child)) {
      throw new Error(`GFM fixture group conflicts with ${groupPath.slice(0, index + 1).join('/')}`)
    }
    current = child || (current[name] = {})
  }
}

function buildMetadata(groups, mainFixtureIds) {
  if (!Array.isArray(groups)) throw new TypeError('Invalid GFM groups')
  const metadata = { groups: { unclassified: {}, ast: {} } }
  const groupedFixtureIds = new Set()

  for (const group of groups) {
    if (
      !isRecord(group) ||
      typeof group.name !== 'string' ||
      !Number.isInteger(group.start) ||
      !Number.isInteger(group.end) ||
      group.start > group.end ||
      !Array.isArray(group.excluded)
    ) {
      throw new TypeError('Invalid GFM group')
    }

    const excluded = new Set(group.excluded)
    const groupFixtureIds = []
    for (let exampleNo = group.start; exampleNo <= group.end; ++exampleNo) {
      if (excluded.has(exampleNo)) continue
      const fixtureId = formatFixtureId(exampleNo)
      if (!mainFixtureIds.has(fixtureId)) {
        throw new Error(`GFM group ${group.name} references unmatched fixture ${fixtureId}`)
      }
      if (groupedFixtureIds.has(fixtureId)) {
        throw new Error(`GFM fixture ${fixtureId} belongs to more than one group`)
      }
      groupedFixtureIds.add(fixtureId)
      groupFixtureIds.push(fixtureId)
    }

    const groupPath = group.name.split('/')
    const isUnclassified = groupPath[0] === 'unclassified'
    if (isUnclassified) groupPath.shift()
    setGroupFixtureIds(
      isUnclassified ? metadata.groups.unclassified : metadata.groups.ast,
      groupPath,
      groupFixtureIds,
    )
  }

  const ungrouped = [...mainFixtureIds].filter(fixtureId => !groupedFixtureIds.has(fixtureId))
  if (ungrouped.length > 0) {
    throw new Error(`Missing GFM groups for fixtures: ${ungrouped.join(', ')}`)
  }
  return metadata
}

function createPlannedFile(data, preferredRecord) {
  const raw =
    preferredRecord != null && isDeepStrictEqual(data, preferredRecord.data)
      ? preferredRecord.raw
      : null
  return { data, raw }
}

function addPlannedFile(directory, filename, plannedFile) {
  if (directory.has(filename)) throw new Error(`Duplicate planned GFM fixture ${filename}`)
  directory.set(filename, plannedFile)
}

export function createGFMFixturePlan(
  rootDir = repositoryRoot,
  { examples = defaultExamples, groups = defaultGroups } = {},
) {
  const fixturesRoot = path.resolve(rootDir, 'fixtures')
  const main = readFixtureDirectory(fixturesRoot, 'gfm', true)
  const currentNew = readFixtureDirectory(fixturesRoot, 'gfm-new')
  const metadataPath = path.join(fixturesRoot, 'gfm/meta.json')

  if (main.meta == null) throw new Error(`Missing GFM metadata ${metadataPath}`)
  validateBaselineMetadata(main.meta, main.records, metadataPath)
  for (const record of main.records) {
    if (!hasOwn(record.data.cases[0].answer.gfm, 'ast')) {
      throw new Error(`Cannot preserve answer.gfm.ast from ${record.source}/${record.filename}`)
    }
  }
  for (const record of currentNew.records) {
    const fixtureCase = record.data.cases[0]
    if (
      Object.values(fixtureCase.answer).some(
        answer => hasOwn(answer, 'ast') || hasOwn(answer, 'markup'),
      )
    ) {
      throw new Error(`Answered fixture must not remain in gfm-new: ${record.filename}`)
    }
  }

  const currentExamples = validateExamples(examples)
  const partition = pairFixturesByInput(currentExamples, main.records)
  const newPartition = pairFixturesByInput(partition.currentOnly, currentNew.records)
  // Parser HTML overrides are authored answers even when the fixture has no AST.
  const orphanedFixtures = [
    ...partition.legacyOnly,
    ...newPartition.legacyOnly.filter(record =>
      Object.entries(record.data.cases[0].answer).some(
        ([name, answer]) => name !== 'gfm' && hasOwn(answer, 'html'),
      ),
    ),
  ]
  if (orphanedFixtures.length > 0) {
    const orphanIds = orphanedFixtures.map(record => formatFixtureId(record.exampleNo))
    throw new Error(
      `Orphaned answered GFM fixtures no longer match upstream: ${orphanIds.join(', ')}. ` +
        `Delete the stale fixture(s) or correct the source, then rerun.`,
    )
  }
  const plannedMain = new Map()
  const plannedNew = new Map()
  const matchedNewById = new Map(
    newPartition.matches.map(({ current, legacy }) => [current.exampleNo, legacy]),
  )

  for (const { current, legacy } of partition.matches) {
    const filename = `${formatFixtureId(current.exampleNo)}.json`
    const data = mapExampleToFixture(current.example, legacy.data.cases[0])
    addPlannedFile(plannedMain, filename, createPlannedFile(data, legacy))
  }
  for (const current of partition.currentOnly) {
    const filename = `${formatFixtureId(current.exampleNo)}.json`
    const legacy = matchedNewById.get(current.exampleNo)
    const data =
      legacy == null
        ? mapNewExampleToFixture(current.example)
        : mapExampleToFixture(current.example, legacy.data.cases[0])
    addPlannedFile(plannedNew, filename, createPlannedFile(data, legacy))
  }

  const mainFixtureIds = new Set([...plannedMain.keys()].map(filename => filename.slice(0, -5)))
  const metadata = buildMetadata(groups, mainFixtureIds)
  addPlannedFile(
    plannedMain,
    'meta.json',
    createPlannedFile(metadata, main.meta == null ? null : { data: main.meta, raw: main.metaRaw }),
  )

  return {
    baselineFingerprint: calculateFixtureFingerprint(fixturesRoot),
    directories: {
      gfm: plannedMain,
      'gfm-new': plannedNew,
    },
    summary: {
      currentExamples: currentExamples.length,
      matched: partition.matches.length,
      new: partition.currentOnly.length,
    },
  }
}

function listPlanChanges(rootDir, plan) {
  const fixturesRoot = path.resolve(rootDir, 'fixtures')
  const changes = []

  for (const directoryName of fixtureDirectoryNames) {
    const directory = path.join(fixturesRoot, directoryName)
    const plannedFiles = plan.directories[directoryName]
    const actualNames = fs.existsSync(directory) ? fs.readdirSync(directory).sort() : []
    const plannedNames = [...plannedFiles.keys()].sort()

    for (const filename of new Set([...actualNames, ...plannedNames])) {
      const planned = plannedFiles.get(filename)
      const filepath = path.join(directory, filename)
      if (planned == null || !fs.existsSync(filepath) || !fs.statSync(filepath).isFile()) {
        changes.push(path.relative(rootDir, filepath))
        continue
      }
      const raw = fs.readFileSync(filepath, 'utf8')
      const actual = parseJson(raw, filepath)
      if (!isDeepStrictEqual(actual, planned.data)) changes.push(path.relative(rootDir, filepath))
    }
  }
  return changes.sort()
}

export function verifyGFMFixturePlan(rootDir, plan) {
  const changes = listPlanChanges(rootDir, plan)
  if (changes.length > 0) {
    throw new Error(`GFM fixtures are out of sync: ${changes.join(', ')}`)
  }
}

async function materializePlannedFile(plannedFile, filepath, prettierConfig) {
  if (plannedFile.raw != null) return plannedFile.raw
  // Keep AST objects expanded instead of reflowing their positions into single lines.
  if (path.basename(filepath) !== 'meta.json')
    return JSON.stringify(plannedFile.data, null, 2) + '\n'
  return format(JSON.stringify(plannedFile.data), {
    ...prettierConfig,
    filepath,
  })
}

function removeArtifact(filepath) {
  fs.rmSync(filepath, { recursive: true, force: true })
}

export function findGFMTransactionArtifacts(...directories) {
  return directories.flatMap(directory => {
    if (!fs.existsSync(directory)) return []
    return fs
      .readdirSync(directory)
      .filter(filename => transactionArtifactPattern.test(filename))
      .map(filename => path.join(directory, filename))
  })
}

function swapArtifacts(artifacts) {
  const nonce = `${process.pid}-${randomUUID()}`
  const operations = artifacts.map((artifact, index) => ({
    ...artifact,
    staged: `${artifact.target}.gfm-sync-${nonce}-${index}`,
    backup: `${artifact.target}.gfm-backup-${nonce}-${index}`,
    backedUp: false,
    installed: false,
  }))

  try {
    for (const operation of operations) operation.stage(operation.staged)
  } catch (error) {
    for (const operation of operations) removeArtifact(operation.staged)
    throw new Error('Failed to stage GFM fixture artifacts', { cause: error })
  }

  try {
    for (const operation of operations) {
      if (fs.existsSync(operation.target)) {
        fs.renameSync(operation.target, operation.backup)
        operation.backedUp = true
      }
      fs.renameSync(operation.staged, operation.target)
      operation.installed = true
    }
  } catch (error) {
    const rollbackErrors = []
    for (const operation of operations.slice().reverse()) {
      try {
        if (operation.installed && fs.existsSync(operation.target)) {
          fs.renameSync(operation.target, operation.staged)
        }
        if (operation.backedUp && fs.existsSync(operation.backup)) {
          fs.renameSync(operation.backup, operation.target)
        }
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError)
      }
    }
    if (rollbackErrors.length > 0) {
      const preservedArtifacts = operations
        .flatMap(operation => [operation.staged, operation.backup])
        .filter(filepath => fs.existsSync(filepath))
      throw new AggregateError(
        rollbackErrors,
        `Failed to install and roll back GFM fixture artifacts; preserved: ${preservedArtifacts.join(', ')}`,
        { cause: error },
      )
    }
    for (const operation of operations) {
      removeArtifact(operation.staged)
      removeArtifact(operation.backup)
    }
    throw new Error('Failed to install GFM fixture artifacts; rolled back', { cause: error })
  }

  const cleanupErrors = []
  const remainingBackups = []
  for (const operation of operations) {
    try {
      removeArtifact(operation.backup)
    } catch (error) {
      cleanupErrors.push(error)
      remainingBackups.push(operation.backup)
    }
  }
  if (cleanupErrors.length > 0) {
    throw new AggregateError(
      cleanupErrors,
      `Installed GFM fixture artifacts but failed to remove backups: ${remainingBackups.join(', ')}`,
    )
  }
}

function readLockOwner(lockPath) {
  let content
  try {
    content = fs.readFileSync(lockPath, 'utf8').trim()
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    throw new Error(`Failed to read GFM synchronization lock ${lockPath}`, { cause: error })
  }
  if (!/^\d+$/.test(content) || Number(content) < 1) {
    throw new Error(`Invalid GFM synchronization lock owner in ${lockPath}`)
  }
  return Number(content)
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    if (error?.code === 'ESRCH') return false
    if (error?.code === 'EPERM') return true
    throw new Error(`Failed to inspect GFM synchronization process ${pid}`, { cause: error })
  }
}

function recoverStaleLock(lockPath, fixturesRoot) {
  const owner = readLockOwner(lockPath)
  if (owner == null) return
  if (isProcessAlive(owner)) {
    throw new Error(`GFM synchronization process ${owner} owns ${lockPath}`)
  }

  const artifacts = findGFMTransactionArtifacts(fixturesRoot)
  if (artifacts.length > 0) {
    throw new Error(
      `Stale GFM synchronization lock ${lockPath} has unresolved transaction artifacts: ${artifacts.join(', ')}`,
    )
  }
  try {
    fs.unlinkSync(lockPath)
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw new Error(`Failed to recover stale GFM synchronization lock ${lockPath}`, {
        cause: error,
      })
    }
  }
}

function acquireSyncLock(lockPath, fixturesRoot) {
  let lock
  for (let attempt = 0; attempt < 2; ++attempt) {
    try {
      lock = fs.openSync(lockPath, 'wx', 0o600)
      break
    } catch (error) {
      if (error?.code !== 'EEXIST') {
        throw new Error(`Failed to acquire GFM synchronization lock ${lockPath}`, { cause: error })
      }
      recoverStaleLock(lockPath, fixturesRoot)
    }
  }
  if (lock == null) throw new Error(`Failed to acquire GFM synchronization lock ${lockPath}`)

  try {
    fs.writeFileSync(lock, `${process.pid}\n`)
    return lock
  } catch (error) {
    fs.closeSync(lock)
    fs.unlinkSync(lockPath)
    throw new Error(`Failed to initialize GFM synchronization lock ${lockPath}`, { cause: error })
  }
}

function releaseSyncLock(lockPath, lock) {
  const errors = []
  try {
    fs.closeSync(lock)
  } catch (error) {
    errors.push(error)
  }
  try {
    fs.unlinkSync(lockPath)
  } catch (error) {
    if (error?.code !== 'ENOENT') errors.push(error)
  }
  if (errors.length > 0) {
    throw new AggregateError(errors, `Failed to release GFM synchronization lock ${lockPath}`)
  }
}

export async function writeGFMFixturePlan(rootDir, plan, { extraFiles = [] } = {}) {
  const fixturesRoot = path.resolve(rootDir, 'fixtures')
  fs.mkdirSync(fixturesRoot, { recursive: true })
  const lockPath = path.join(fixturesRoot, '.gfm-sync.lock')
  const lock = acquireSyncLock(lockPath, fixturesRoot)

  try {
    const actualFingerprint = calculateFixtureFingerprint(fixturesRoot)
    if (actualFingerprint !== plan.baselineFingerprint) {
      throw new Error('GFM fixtures changed after planning; rerun synchronization')
    }
    const prettierConfig = (await resolveConfig(path.join(repositoryRoot, 'package.json'))) || {}
    const artifacts = []

    for (const directoryName of fixtureDirectoryNames) {
      const target = path.join(fixturesRoot, directoryName)
      const plannedFiles = plan.directories[directoryName]
      const files = new Map()
      for (const [filename, plannedFile] of plannedFiles) {
        files.set(
          filename,
          await materializePlannedFile(plannedFile, path.join(target, filename), prettierConfig),
        )
      }
      artifacts.push({
        target,
        stage: staged => {
          fs.mkdirSync(staged, { recursive: true })
          for (const [filename, content] of files) {
            fs.writeFileSync(path.join(staged, filename), content, 'utf8')
          }
        },
      })
    }

    for (const extraFile of extraFiles) {
      if (
        !isRecord(extraFile) ||
        typeof extraFile.target !== 'string' ||
        typeof extraFile.content !== 'string'
      ) {
        throw new TypeError('Invalid extra GFM artifact')
      }
      artifacts.push({
        target: path.resolve(extraFile.target),
        stage: staged => fs.writeFileSync(staged, extraFile.content, 'utf8'),
      })
    }

    const targets = artifacts.map(artifact => artifact.target)
    if (new Set(targets).size !== targets.length) throw new Error('Duplicate GFM artifact target')
    swapArtifacts(artifacts)
  } catch (error) {
    try {
      releaseSyncLock(lockPath, lock)
    } catch (releaseError) {
      throw new AggregateError([error], 'GFM synchronization failed and lock cleanup failed', {
        cause: releaseError,
      })
    }
    throw error
  }
  releaseSyncLock(lockPath, lock)
  return plan.summary
}

export async function generateGFMFixtures(rootDir = repositoryRoot, options = {}) {
  const plan = createGFMFixturePlan(rootDir, options)
  await writeGFMFixturePlan(rootDir, plan)
  return plan.summary
}
