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
      const resolvedTokenizerName = tokenizerName.replace(/^(tokenizer\-)?/, '')
      for (const mp of self.possibleMiddlePaths) {
        const p = path.resolve(self.baseDir, mp, resolvedTokenizerName)
        if (fs.existsSync(p)) return p
      }
      throw new Error(`cannot find source path for tokenizer(${ tokenizerName })`)
    }

    const tokenizerPath = getTokenizerPath()
    return self.classifyToPath(tokenizerPath, groups)
  }

  classifyToPath(tokenizerPath, groups) {
    const self = this
    tokenizerPath = path.resolve(self.baseDir, tokenizerPath)
    for (const group of groups) {
      const excluded = group.excluded || []
      const groupDir = path.resolve(tokenizerPath, '__test__/cases', group.name)
      if (!fs.existsSync(groupDir)) fs.mkdirpSync(groupDir)
      for (let i = group.start; i <= group.end; ++i) {
        if (excluded.includes(i)) continue
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
  path.resolve(__dirname, '../../'),
  [ '', 'tokenizers' ],
)

  ;[
    /** block data nodes */
    // 'thematic-break',
    // 'heading',
    // 'setext-heading',
    // 'indented-code',
    // 'fenced-code',
    // 'html-block',
    // 'link-definition',
    // 'paragraph',
    // 'table',
    // 'blockquote',
    // 'list-item',
    // 'list-bullet-item',
    // 'list-task-item',
    // 'list-ordered-item',
    // 'list',

    /** inline data nodes */
    // 'inline-code',
    // 'emphasis',
    // 'delete',
    // 'link',
    // 'image',
    // 'reference-link',
    // 'reference-image',
    // 'html-inline'
    // 'line-break',
    // 'text',
  ].forEach(tokenizerType => {
    classifier.classifyToTokenizer(
      tokenizerType,
      require(`./data-classify/${ tokenizerType }.json`))
  })


// parser-gfm test cases
classifier.classifyToPath(
  'packages/parser-gfm',
  require(`./data-classify/parser-gfm.json`))
