import path from 'path'
import { TokenizerMatchTestCaseMaster } from './util/tokenizer-match-util'


/**
 * create answer (to be checked)
 */
async function answer() {
  const caseRootDirectory = path.resolve(__dirname, 'cases/tokenizer')
  const caseMaster = new TokenizerMatchTestCaseMaster({ caseRootDirectory })
  await caseMaster.scan('inline/delete')
  await caseMaster.scan('inline/emphasis')
  await caseMaster.scan('inline/image')
  await caseMaster.scan('inline/inline-code')
  await caseMaster.scan('inline/inline-formula')
  await caseMaster.scan('inline/inline-link')
  await caseMaster.scan('inline/line-break')
  await caseMaster.scan('inline/reference-image')
  await caseMaster.scan('inline/reference-link')
  await caseMaster.scan('inline/text')
  await caseMaster.answer()
}


answer()
