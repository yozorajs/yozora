const chalk = require('chalk')
const fs = require('fs-extra')
const path = require('path')


class GFMExampleClassifier {
  constructor (gfmExamples, baseDir, possibleMiddlePaths) {
    this.gfmExamples = gfmExamples
    this.baseDir = baseDir
    this.numberLength = gfmExamples.length.toString().length
    this.possibleMiddlePaths = possibleMiddlePaths
  }

  /**
   *
   * @param cases         {{ title: string, description: string, input: string, expectedHtml: string }[]}
   * @param baseDir       {string}
   * @param tokenizerName {string}
   * @param groups        {{ name: string, start: number, end: number }[]}
   */
  classifyToTokenizer(tokenizerName, groups) {
    const self = this
    const getTokenizerPath = () => {
      const resolvedTokenizerName = tokenizerName.replace(/^(tokenizer\-)?/, 'tokenizer-')
      for (const mp of self.possibleMiddlePaths) {
        const p = path.resolve(self.baseDir, mp, resolvedTokenizerName)
        if (fs.existsSync(p)) return p
      }
      throw new Error(`cannot find source path for tokenizer(${ tokenizerName })`)
    }

    const tokenizerPath = getTokenizerPath()
    for (const group of groups) {
      const excluded = group.excluded || []
      const groupDir = path.resolve(tokenizerPath, 'test/cases', group.name)
      if (!fs.existsSync(groupDir)) fs.mkdirpSync(groupDir)
      for (let i = group.start; i <= group.end; ++i) {
        if (excluded.includes[i]) continue
        const fileName = '#' + ('' + i).padStart(self.numberLength, '0') + '.json'
        const caseFilePath = path.resolve(groupDir, fileName)
        const gfmExample = self.gfmExamples[i]
        const data = self.mapGFMExampleDataToCase(gfmExample)
        const content = JSON.stringify(data, null, 2)
        fs.writeFileSync(caseFilePath, content, 'utf-8')
        console.log(chalk.green(`Add case ${ caseFilePath }`))
      }
    }

    return self
  }

  /**
   *
   */
  mapGFMExampleDataToCase(gfmExample) {
    const result = {
      title: gfmExample.title,
      cases: [
        {
          description: gfmExample.description,
          input: gfmExample.content,
          htmlAnswer: gfmExample.expectedHtml,
        }
      ]
    }
    return result
  }
}


const classifier = new GFMExampleClassifier(
  require('./data.json'),
  path.resolve(),
  [
    '', 'inline', 'block',
    'tokenizers', 'tokenizers/inline', 'tokenizers/block'
  ],
)


classifier
  // .classifyToTokenizer('setext-heading', [{
  //   name: 'gfm',
  //   start: 50,
  //   end: 76,
  //   excluded: [55, 62, 63, 64, 69, 70, 71],
  // }])
  // .classifyToTokenizer('indented-code', [{
  //   name: 'gfm',
  //   start: 77,
  //   end: 88,
  //   excluded: [78, 79, 85],
  // }])
  // .classifyToTokenizer('paragraph', [{
  //   name: 'gfm',
  //   start: 189,
  //   end: 196,
  //   excluded: [195],
  // }])
