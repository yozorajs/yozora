import path from 'path'
import { TokenizerMatchTestCaseMaster } from './util/tokenizer-match-util'
import { TokenizerParseTestCaseMaster } from './util/tokenizer-parse-util'


async function answerMatchCases(caseRootDirectory: string, caseDirs: string[]) {
  const caseMaster = new TokenizerMatchTestCaseMaster({ caseRootDirectory })
  for (const caseDir of caseDirs) {
    await caseMaster.scan(caseDir)
  }
  await caseMaster.answer()
}


async function answerParseCases(caseRootDirectory: string, caseDirs: string[]) {
  const caseMaster = new TokenizerParseTestCaseMaster({ caseRootDirectory })
  for (const caseDir of caseDirs) {
    await caseMaster.scan(caseDir)
  }
  await caseMaster.answer()
}


/**
 * create answer (to be checked)
 */
async function answer() {
  const caseRootDirectory = path.resolve(__dirname, 'cases/tokenizer')
  const caseDirs = [
    'inline/delete',
    'inline/emphasis',
    'inline/image',
    'inline/inline-code',
    'inline/inline-formula',
    'inline/inline-link',
    'inline/inline-html-comment',
    'inline/line-break',
    'inline/reference-image',
    'inline/reference-link',
    'inline/text',
  ]

  await answerMatchCases(caseRootDirectory, caseDirs)
  await answerParseCases(caseRootDirectory, caseDirs)
}


answer()


import { dataNodeParser } from '@yozora/parser'
// console.log(JSON.stringify(dataNodeParser.matchInlineData('~~alpha~~'), null , 2))
