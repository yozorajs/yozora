import path from 'path'
import {
  TokenizerMatchTestCaseMaster,
  TokenizerParseTestCaseMaster,
  mapBlockTokenizerToMatchFunc,
  mapBlockTokenizerToParseFunc,
} from '@yozora/mocha-test-tokenizer'
import { ParagraphTokenizer, PhrasingContentDataNodeType } from '../src'


/**
 * create answer (to be checked)
 */
async function answer() {
  const tokenizer = new ParagraphTokenizer({ priority: 1 })
  const { match } = mapBlockTokenizerToMatchFunc(null, tokenizer)
  const { parse } = mapBlockTokenizerToParseFunc(
    null,
    [PhrasingContentDataNodeType],
    tokenizer)

  const caseRootDirectory = path.resolve(__dirname)
  const matchTestCaseMaster = new TokenizerMatchTestCaseMaster(match, { caseRootDirectory })
  const parseTestCaseMaster = new TokenizerParseTestCaseMaster(parse, { caseRootDirectory })

  const caseDirs: string[] = ['cases']
  const tasks: Promise<any>[] = []
  for (const caseDir of caseDirs) {
    tasks.push(matchTestCaseMaster.scan(caseDir))
    tasks.push(parseTestCaseMaster.scan(caseDir))
  }
  await Promise.all(tasks)

  await parseTestCaseMaster.answer()
  await matchTestCaseMaster.answer()
}


answer()
