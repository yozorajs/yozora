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

class GFMFixtureGenerator {
  constructor(gfmExamples) {
    this.gfmExamples = gfmExamples
    this.numberLength = gfmExamples.length.toString().length
  }

  writeGroups(caseRootDir, groups) {
    for (const group of groups) {
      const excluded = group.excluded || []
      const groupDir = path.resolve(caseRootDir, group.name)
      if (!fs.existsSync(groupDir)) fs.mkdirSync(groupDir, { recursive: true })
      for (let i = group.start; i <= group.end; ++i) {
        if (excluded.includes(i)) continue
        const fileName = '#' + ('' + i).padStart(this.numberLength, '0') + '.json'
        const caseFilePath = path.join(groupDir, fileName)
        const gfmExample = this.gfmExamples[i]
        const data = this.mapGFMExampleDataToCase(gfmExample)
        const content = JSON.stringify(data, null, 2)
        fs.writeFileSync(caseFilePath, content, 'utf-8')
        console.log(toGreen(`Add case ${caseFilePath}`))
      }
    }
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
  generator.writeGroups(path.resolve(rootDir, 'fixtures/gfm'), groups)
}

if (process.argv[1] === __filename) generateGFMFixtures()
