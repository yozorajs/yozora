import path from 'path'
import {
  TokenizerMatchTestCaseMaster,
  TokenizerParseTestCaseMaster,
} from '@yozora/mocha-test-tokenizer'
import { gfmDataNodeParser } from '../src'


/**
 * create answer (to be checked)
 */
async function answer() {
  const match = gfmDataNodeParser.match.bind(gfmDataNodeParser)
  const parse = gfmDataNodeParser.parse.bind(gfmDataNodeParser)

  const caseRootDirectory = path.resolve(__dirname, 'cases')
  const matchTestCaseMaster = new TokenizerMatchTestCaseMaster(match as any, { caseRootDirectory })
  const parseTestCaseMaster = new TokenizerParseTestCaseMaster(parse, { caseRootDirectory })

  const caseDirs: string[] = ['cases']
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
