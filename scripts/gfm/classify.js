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
  // .classifyToTokenizer('thematic-break', [{
  //   name: 'gfm',
  //   start: 13,
  //   end: 31,
  //   excluded: [18, 27, 29, 30, 31],
  // }])
  // .classifyToTokenizer('heading', [{
  //   name: 'gfm',
  //   start: 32,
  //   end: 49,
  //   excluded: [39],
  // }])
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
  // .classifyToTokenizer('fenced-code', [{
  //   name: 'gfm',
  //   start: 89,
  //   end: 117,
  //   excluded: [98,  104],
  // }])
  // .classifyToTokenizer('paragraph', [{
  //   name: 'gfm',
  //   start: 189,
  //   end: 196,
  //   excluded: [195],
  // }])
  // .classifyToTokenizer('blockquote', [{
  //   name: 'gfm',
  //   start: 206,
  //   end: 230,
  //   excluded: [209, 212, 213, 215, 216, 224, 230],
  // }])
  // .classifyToTokenizer('list-item', [
  //   {
  //     name: 'gfm/rule#1 basic',
  //     start: 231,
  //     end: 247,
  //     excluded: [231, 237, 238, 241],
  //   },
  //   {
  //     name: 'gfm/rule#2 Item starting with indented code',
  //     start: 248,
  //     end: 255,
  //     excluded: [250, 251, 252, 253],
  //   },
  //   {
  //     name: 'gfm/rule#3 Item starting with a blank line',
  //     start: 256,
  //     end: 263,
  //   },
  //   {
  //     name: 'gfm/rule#4 Indentation',
  //     start: 264,
  //     end: 267,
  //     excluded: [267],
  //   },
  //   {
  //     name: 'gfm/rule#5 Laziness',
  //     start: 268,
  //     end: 271,
  //     excluded: [270, 271],
  //   },
  //   {
  //     name: 'gfm',
  //     start: 272,
  //     end: 278,
  //     excluded: [278],
  //   },
  // ])
  // .classifyToTokenizer('list', [{
  //   name: 'gfm',
  //   start: 281,
  //   end: 306,
  //   excluded: [288, 289],
  // }])
