const chalk = require('chalk')
const fs = require('fs-extra')
const path = require('path')

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
      if (!fs.existsSync(groupDir)) fs.mkdirpSync(groupDir)
      for (let i = group.start; i <= group.end; ++i) {
        if (excluded.includes(i)) continue
        const fileName =
          '#' + ('' + i).padStart(self.numberLength, '0') + '.json'
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

const classifier = new GFMExampleClassifier(require('./data.json'))
const rootDir = path.resolve(__dirname, '../../')

// parser-gfm test cases
classifier.classifyToPath(
  path.resolve(rootDir, 'scaffolds/jest-for-tokenizer/fixtures/gfm'),
  require('./data-classify/parser-gfm.json'),
)
