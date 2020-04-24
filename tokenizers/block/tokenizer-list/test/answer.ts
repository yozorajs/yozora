import path from 'path'
import {
  TokenizerMatchTestCaseMaster,
  TokenizerParseTestCaseMaster,
  mapBlockTokenizerToMatchFunc,
  mapBlockTokenizerToParseFunc,
} from '@yozora/mocha-test-tokenizer'
import { ListItemTokenizer } from '@yozora/tokenizer-list-item'
import { ParagraphTokenizer } from '@yozora/tokenizer-paragraph'
import { ListTokenizer } from '../src'


/**
 * create answer (to be checked)
 */
async function answer() {
  const tokenizer = new ListTokenizer({ priority: 1 })
  const listItemTokenizer = new ListItemTokenizer({ priority: 1 })
  tokenizer.useSubTokenizer(listItemTokenizer)

  const match = mapBlockTokenizerToMatchFunc(tokenizer, ParagraphTokenizer)
  const parse = mapBlockTokenizerToParseFunc(tokenizer, ParagraphTokenizer)

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
