import path from 'path'
import { TokenizerParseTestCaseMaster } from '@yozora/mocha-test-tokenizer'
import { gfmDataNodeParser } from '../src'


/**
 * create answer (to be checked)
 */
async function answer() {
  const parse = gfmDataNodeParser.parse.bind(gfmDataNodeParser)

  const caseRootDirectory = path.resolve(__dirname)
  const parseTestCaseMaster = new TokenizerParseTestCaseMaster(parse, { caseRootDirectory })

  const caseDirs: string[] = ['cases']
  const tasks: Promise<any>[] = []
  for (const caseDir of caseDirs) {
    tasks.push(parseTestCaseMaster.scan(caseDir))
  }
  await Promise.all(tasks)

  await parseTestCaseMaster.answer()
}


answer()
