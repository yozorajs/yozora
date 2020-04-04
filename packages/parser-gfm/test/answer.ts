import path from 'path'
import {
  TokenizerMatchTestCaseMaster,
  TokenizerParseTestCaseMaster,
} from '@yozora/mocha-for-tokenizer'
import { gfmDataNodeParser } from '../src'


/**
 * create answer (to be checked)
 */
async function answer() {
  const match = gfmDataNodeParser.matchInlineData.bind(gfmDataNodeParser)
  const parse = gfmDataNodeParser.parseInlineData.bind(gfmDataNodeParser)

  const caseRootDirectory = path.resolve(__dirname, 'cases')
  const matchTestCaseMaster = new TokenizerMatchTestCaseMaster(match, { caseRootDirectory })
  const parseTestCaseMaster = new TokenizerParseTestCaseMaster(parse, { caseRootDirectory })

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

  const tasks: Promise<any>[] = []
  for (const caseDir of caseDirs) {
    tasks.push(matchTestCaseMaster.scan(caseDir))
    tasks.push(parseTestCaseMaster.scan(caseDir))
  }
  await Promise.all(tasks)

  await matchTestCaseMaster.answer()
  await parseTestCaseMaster.answer()
}


answer()

// console.log(JSON.stringify(gfmDataNodeParser.parseInlineData('~~alpha~~'), null , 2))
