import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { repositoryRoot } from '../../internal/repository.mjs'

const __filename = fileURLToPath(import.meta.url)
const readLocalJson = filename =>
  JSON.parse(fs.readFileSync(new URL(filename, import.meta.url), 'utf8'))
const config = readLocalJson('./config.json')
const snapshot = readLocalJson('./examples.json')
const groups = readLocalJson('./groups.json')

const toGreen = text => `\u001b[32m${text}\u001b[0m`
const toFixtureId = exampleNumber => `#${String(exampleNumber).padStart(3, '0')}`

function validateFixtureGroups(gfmExamples, groups) {
  const coveredFixtureIds = new Set()
  for (const group of groups) {
    for (let i = group.start; i <= group.end; ++i) {
      const fixtureId = toFixtureId(i)
      if (gfmExamples[i] == null) throw new Error(`Missing GFM example ${fixtureId}`)
      if (coveredFixtureIds.has(fixtureId)) {
        throw new Error(`GFM fixture ${fixtureId} belongs to more than one group`)
      }
      coveredFixtureIds.add(fixtureId)
    }
  }

  const ungroupedFixtureIds = gfmExamples
    .slice(1)
    .map(example => toFixtureId(example.number))
    .filter(fixtureId => !coveredFixtureIds.has(fixtureId))
  if (ungroupedFixtureIds.length > 0) {
    throw new Error(`Ungrouped GFM fixtures: ${ungroupedFixtureIds.join(', ')}`)
  }
}

function setGroupFixtureIds(groupTree, groupPath, fixtureIds) {
  let current = groupTree
  for (let i = 0; i < groupPath.length; ++i) {
    const name = groupPath[i]
    if (i === groupPath.length - 1) {
      if (current[name] != null) {
        throw new Error(`Duplicate GFM fixture group ${groupPath.join('/')}`)
      }
      current[name] = fixtureIds
      return
    }

    const child = current[name]
    if (Array.isArray(child)) {
      throw new Error(`GFM fixture group conflicts with ${groupPath.slice(0, i + 1).join('/')}`)
    }
    current = child || (current[name] = {})
  }
}

class GFMFixtureGenerator {
  constructor(gfmExamples, source) {
    this.gfmExamples = gfmExamples
    this.source = source
  }

  writeFixtures(caseRootDir, groups) {
    validateFixtureGroups(this.gfmExamples, groups)
    const metadata = { source: this.source, groups: { unclassified: {}, ast: {} } }
    const fixtureIds = new Set()
    const fixtureFiles = []
    const previousCases = this.collectPreviousCases(caseRootDir)

    for (const group of groups) {
      const excluded = group.excluded || []
      const groupFixtureIds = []
      for (let i = group.start; i <= group.end; ++i) {
        if (excluded.includes(i)) continue
        const fixtureId = toFixtureId(i)
        if (fixtureIds.has(fixtureId)) {
          throw new Error(`GFM fixture ${fixtureId} belongs to more than one group`)
        }

        const gfmExample = this.gfmExamples[i]
        if (gfmExample == null) throw new Error(`Missing GFM example ${fixtureId}`)
        if (gfmExample.number !== i) {
          throw new Error(`Unexpected GFM example number ${gfmExample.number} at ${fixtureId}`)
        }

        fixtureIds.add(fixtureId)
        groupFixtureIds.push(fixtureId)
        const caseFilePath = path.join(caseRootDir, `${fixtureId}.json`)
        const data = this.mapGFMExampleDataToCase(gfmExample, previousCases)
        fixtureFiles.push([caseFilePath, `${JSON.stringify(data, null, 2)}\n`])
      }

      if (groupFixtureIds.length > 0) {
        const groupPath = group.name.split('/')
        const isUnclassified = groupPath[0] === 'unclassified'
        if (isUnclassified) groupPath.shift()
        const groupTree = isUnclassified ? metadata.groups.unclassified : metadata.groups.ast
        setGroupFixtureIds(groupTree, groupPath, groupFixtureIds)
      }
    }

    for (const [caseFilePath, content] of fixtureFiles) {
      fs.writeFileSync(caseFilePath, content, 'utf-8')
      console.log(toGreen(`Add case ${caseFilePath}`))
    }

    for (const entry of fs.readdirSync(caseRootDir, { withFileTypes: true })) {
      if (!entry.isFile() || !/^#\d{3}[.]json$/.test(entry.name)) continue
      if (!fixtureIds.has(entry.name.slice(0, -5))) {
        fs.unlinkSync(path.join(caseRootDir, entry.name))
      }
    }

    fs.writeFileSync(
      path.join(caseRootDir, 'meta.json'),
      JSON.stringify(metadata, null, 2) + '\n',
      'utf-8',
    )
    return this
  }

  collectPreviousCases(caseRootDir) {
    const previousCases = new Map()
    for (const entry of fs
      .readdirSync(caseRootDir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isFile() || !/^#\d{3}[.]json$/.test(entry.name)) continue
      const fixture = JSON.parse(fs.readFileSync(path.join(caseRootDir, entry.name), 'utf8'))
      const testcase = fixture.cases?.[0]
      if (testcase == null || typeof testcase.input !== 'string') continue
      const matchingCases = previousCases.get(testcase.input)
      if (matchingCases == null) previousCases.set(testcase.input, [testcase])
      else matchingCases.push(testcase)
    }
    return previousCases
  }

  mapGFMExampleDataToCase(gfmExample, previousCases) {
    const input = gfmExample.markdown
    const previousCase = previousCases.get(input)?.shift()
    if (previousCase == null) {
      throw new Error(
        `GFM fixture ${toFixtureId(gfmExample.number)} has no matching previous input`,
      )
    }
    const testcase = {
      description:
        previousCase.description ?? `${gfmExample.section} (example ${gfmExample.number})`,
      input,
    }
    if (Object.hasOwn(previousCase, 'markupAnswer')) {
      testcase.markupAnswer = previousCase.markupAnswer
    }
    testcase.htmlAnswer = gfmExample.html
    if (Object.hasOwn(previousCase, 'parseAnswer')) {
      testcase.parseAnswer = previousCase.parseAnswer
    }

    const result = {
      title: `GFM#${gfmExample.number} ${this.source.url}#example-${gfmExample.number}`,
      cases: [testcase],
    }
    return result
  }
}

export function generateGFMFixtures(rootDir = repositoryRoot) {
  if (snapshot.source.revision !== config.fixtureGroupsRevision) {
    throw new Error(
      `GFM fixture groups target ${config.fixtureGroupsRevision}, received ${snapshot.source.revision}`,
    )
  }
  const examples = [null, ...snapshot.examples]
  const generator = new GFMFixtureGenerator(examples, snapshot.source)
  generator.writeFixtures(path.resolve(rootDir, 'fixtures/gfm'), groups)
}

if (process.argv[1] === __filename) generateGFMFixtures()
