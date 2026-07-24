import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { repositoryRoot } from '../../internal/repository.mjs'

const __filename = fileURLToPath(import.meta.url)
const readLocalJson = filename =>
  JSON.parse(fs.readFileSync(new URL(filename, import.meta.url), 'utf8'))
const examples = readLocalJson('./examples.json')
const groups = readLocalJson('./groups.json')

const toGreen = text => `\u001b[32m${text}\u001b[0m`

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
  constructor(gfmExamples) {
    this.gfmExamples = gfmExamples
  }

  writeFixtures(caseRootDir, groups) {
    const metadata = { groups: { unclassified: {}, ast: {} } }
    const fixtureIds = new Set()
    fs.mkdirSync(caseRootDir, { recursive: true })

    for (const group of groups) {
      const excluded = group.excluded || []
      const groupFixtureIds = []
      for (let i = group.start; i <= group.end; ++i) {
        if (excluded.includes(i)) continue
        const fixtureId = `#${String(i).padStart(3, '0')}`
        if (fixtureIds.has(fixtureId)) {
          throw new Error(`GFM fixture ${fixtureId} belongs to more than one group`)
        }

        const gfmExample = this.gfmExamples[i]
        if (gfmExample == null) throw new Error(`Missing GFM example ${fixtureId}`)

        fixtureIds.add(fixtureId)
        groupFixtureIds.push(fixtureId)
        const caseFilePath = path.join(caseRootDir, `${fixtureId}.json`)
        const data = this.mapGFMExampleDataToCase(gfmExample)
        const content = JSON.stringify(data, null, 2)
        fs.writeFileSync(caseFilePath, content, 'utf-8')
        console.log(toGreen(`Add case ${caseFilePath}`))
      }

      const groupPath = group.name.split('/')
      const isUnclassified = groupPath[0] === 'unclassified'
      if (isUnclassified) groupPath.shift()
      const groupTree = isUnclassified ? metadata.groups.unclassified : metadata.groups.ast
      setGroupFixtureIds(groupTree, groupPath, groupFixtureIds)
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

  mapGFMExampleDataToCase(gfmExample) {
    const result = {
      title: gfmExample.title,
      cases: [
        {
          description: gfmExample.description,
          input: gfmExample.content,
          htmlAnswer: gfmExample.expectedHtml,
        },
      ],
    }
    return result
  }
}

export function generateGFMFixtures(rootDir = repositoryRoot) {
  const generator = new GFMFixtureGenerator(examples)
  generator.writeFixtures(path.resolve(rootDir, 'fixtures/gfm'), groups)
}

if (process.argv[1] === __filename) generateGFMFixtures()
