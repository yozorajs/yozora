import path from 'path'
import { TokenizerParseUseCaseMaster } from '@yozora/jest-for-tokenizer'
import { gfmDataNodeParser } from '../src'


/**
 * create answer (to be checked)
 */
async function answer() {
  const parse = gfmDataNodeParser.parse.bind(gfmDataNodeParser)

  const caseRootDirectory = path.resolve(__dirname)
  const parseUseCaseMaster = new TokenizerParseUseCaseMaster(parse, caseRootDirectory)

  const caseDirs: string[] = ['cases']
  for (const caseDir of caseDirs) {
    parseUseCaseMaster.scan(caseDir)
  }

  await parseUseCaseMaster.answerCaseTree()
}


answer()
