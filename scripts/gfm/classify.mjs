import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import parserGfmData from './data-classify/parser-gfm.json'
import gfmClassifyData from './data.json'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../../')
const toGreen = text => `\u001b[32m${text}\u001b[0m`

class GFMExampleClassifier {
  constructor(gfmExamples) {
    this.gfmExamples = gfmExamples
    this.numberLength = gfmExamples.length.toString().length
  }

  classifyToPath(caseRootDir, groups) {
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

const classifier = new GFMExampleClassifier(gfmClassifyData)

// parser-gfm test cases
classifier.classifyToPath(path.resolve(rootDir, 'fixtures/gfm'), parserGfmData)
