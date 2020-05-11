import path from 'path'
import {
  TokenizerMatchTestCaseMaster,
  TokenizerParseTestCaseMaster,
  mapBlockTokenizerToMatchFunc,
  mapBlockTokenizerToParseFunc,
} from '@yozora/mocha-test-tokenizer'
import { ListOrderedItemTokenizer } from '@yozora/tokenizer-list-ordered-item'
import { ListBulletItemTokenizer } from '@yozora/tokenizer-list-bullet-item'
import { ParagraphTokenizer } from '@yozora/tokenizer-paragraph'
import { ListTaskItemTokenizer } from '../src'


/**
 * create answer (to be checked)
 */
async function answer() {
  const tokenizer = new ListTaskItemTokenizer({ priority: 1 })
  const listBulletItemTokenizer = new ListBulletItemTokenizer({ priority: 2 })
  const listOrderedItemTokenizer = new ListOrderedItemTokenizer({ priority: 2 })
  const fallbackTokenizer = new ParagraphTokenizer({ priority: -1 })
  const match = mapBlockTokenizerToMatchFunc(
    fallbackTokenizer,
    tokenizer,
    listBulletItemTokenizer,
    listOrderedItemTokenizer)
  const parse = mapBlockTokenizerToParseFunc(
    fallbackTokenizer,
    tokenizer,
    listBulletItemTokenizer,
    listOrderedItemTokenizer)

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
