import path from 'path'
import { TokenizerMatchTestCaseMaster } from './util/tokenizer-match-util'


/**
 * create answer (to be checked)
 */
async function answer() {
  const caseRootDirectory = path.resolve(__dirname, 'cases/tokenizer')
  const caseMaster = new TokenizerMatchTestCaseMaster({ caseRootDirectory })
  await caseMaster.scan('inline/text')
  await caseMaster.answer()
}


answer()