import path from 'path'
import {
  TokenizerMatchTestCaseMaster,
  TokenizerParseTestCaseMaster,
} from '@yozora/mocha-for-tokenizer'
import { gfmDataNodeParser } from '../src'


async function answerMatchCases(caseRootDirectory: string, caseDirs: string[]) {
  const match = gfmDataNodeParser.matchInlineData.bind(gfmDataNodeParser)
  const caseMaster = new TokenizerMatchTestCaseMaster(match, { caseRootDirectory })
  for (const caseDir of caseDirs) {
    await caseMaster.scan(caseDir)
  }
  await caseMaster.answer()
}


async function answerParseCases(caseRootDirectory: string, caseDirs: string[]) {
  const parse = gfmDataNodeParser.parseInlineData.bind(gfmDataNodeParser)
  const caseMaster = new TokenizerParseTestCaseMaster(parse, { caseRootDirectory })
  for (const caseDir of caseDirs) {
    await caseMaster.scan(caseDir)
  }
  await caseMaster.answer()
}


/**
 * create answer (to be checked)
 */
async function answer() {
  const caseRootDirectory = path.resolve(__dirname, 'cases')
  const caseDirs = [
    'inline/delete',
    'inline/emphasis',
    'inline/image',
    'inline/inline-code',
    'inline/inline-formula',
    'inline/inline-html-comment',
    'inline/line-break',
    'inline/link',
    'inline/reference-image',
    'inline/reference-link',
    'inline/text',
  ]

  await answerMatchCases(caseRootDirectory, caseDirs)
  await answerParseCases(caseRootDirectory, caseDirs)
}


answer()

// console.log(JSON.stringify(gfmDataNodeParser.parseInlineData('~~alpha~~'), null , 2))
