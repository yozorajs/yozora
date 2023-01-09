/* eslint-disable import/no-extraneous-dependencies */
const chalk = require('chalk')
const fs = require('node:fs')
const path = require('node:path')
const gfmClassifyData = require('./data.json')

class GFMExampleClassifier {
  constructor(gfmExamples) {
    this.gfmExamples = gfmExamples
    this.numberLength = gfmExamples.length.toString().length
  }

  classifyToPath(caseRootDir, groups) {
    const self = this
    for (const group of groups) {
      const excluded = group.excluded || []
      const groupDir = path.resolve(caseRootDir, group.name)
      if (!fs.existsSync(groupDir)) fs.mkdirSync(groupDir, { recursive: true })
      for (let i = group.start; i <= group.end; ++i) {
        if (excluded.includes(i)) continue
        const fileName = '#' + ('' + i).padStart(self.numberLength, '0') + '.json'
        const caseFilePath = path.join(groupDir, fileName)
        const gfmExample = self.gfmExamples[i]
        const data = self.mapGFMExampleDataToCase(gfmExample)
        const content = JSON.stringify(data, null, 2)
        fs.writeFileSync(caseFilePath, content, 'utf-8')
        console.log(chalk.green(`Add case ${caseFilePath}`))
      }
    }
    return self
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

const rootDir = path.resolve(__dirname, '../../')

// parser-gfm test cases
classifier.classifyToPath(
  path.resolve(rootDir, 'scaffolds/jest-for-tokenizer/fixtures/gfm'),
  require('./data-classify/parser-gfm.json'),
)
