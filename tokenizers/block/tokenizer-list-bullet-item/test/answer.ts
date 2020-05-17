import path from 'path'
import {
  TokenizerMatchTestCaseMaster,
  TokenizerParseTestCaseMaster,
  mapBlockTokenizerToMatchFunc,
  mapBlockTokenizerToParseFunc,
} from '@yozora/mocha-test-tokenizer'
import { ParagraphTokenizer } from '@yozora/tokenizer-paragraph'
import { PhrasingContentTokenizer } from '@yozora/tokenizer-phrasing-content'
import { ListBulletItemTokenizer } from '../src'


/**
 * create answer (to be checked)
 */
async function answer() {
  const tokenizer = new ListBulletItemTokenizer({ priority: 2 })
  const paragraphTokenizer = new ParagraphTokenizer({ priority: 1 })
  const fallbackTokenizer = new PhrasingContentTokenizer({ priority: -1 })
  const match = mapBlockTokenizerToMatchFunc(fallbackTokenizer, tokenizer, paragraphTokenizer)
  const parse = mapBlockTokenizerToParseFunc(fallbackTokenizer, tokenizer, paragraphTokenizer)

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
