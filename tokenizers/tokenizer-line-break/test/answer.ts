import path from 'path'
import {
  TokenizerMatchTestCaseMaster,
  TokenizerParseTestCaseMaster,
  mapInlineTokenizerToMatchFunc,
  mapInlineTokenizerToParseFunc,
} from '@yozora/mocha-for-tokenizer'
import { LineBreakTokenizer } from '../src'


/**
 * create answer (to be checked)
 */
async function answer() {
  const tokenizer = new LineBreakTokenizer({ priority: 1 })
  const match = mapInlineTokenizerToMatchFunc(tokenizer)
  const parse = mapInlineTokenizerToParseFunc(tokenizer)

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

  await matchTestCaseMaster.answer()
  await parseTestCaseMaster.answer()
}


answer()
