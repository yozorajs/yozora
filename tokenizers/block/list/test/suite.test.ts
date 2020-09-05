import { before, describe, it } from 'mocha'
import path from 'path'
import {
  TokenizerMatchTestCaseMaster,
  TokenizerParseTestCaseMaster,
  mapBlockTokenizerToMatchFunc,
  mapBlockTokenizerToParseFunc,
} from '@yozora/mocha-test-tokenizer'
import { ListBulletItemTokenizer } from '@yozora/tokenizer-list-bullet-item'
import { ListOrderedItemTokenizer } from '@yozora/tokenizer-list-ordered-item'
import { ListTaskItemTokenizer } from '@yozora/tokenizer-list-task-item'
import { ParagraphTokenizer } from '@yozora/tokenizer-paragraph'
import { PhrasingContentDataNodeType } from '@yozora/tokenizercore-block'
import { ListTokenizer } from '../src'


it('This is a required placeholder to allow before() to work', () => { })
before(async function test() {
  const tokenizer = new ListTokenizer({ priority: 1 })
  const listBulletItemTokenizer = new ListBulletItemTokenizer({ priority: 2 })
  const listOrderedItemTokenizer = new ListOrderedItemTokenizer({ priority: 2 })
  const listTaskItemTokenizer = new ListTaskItemTokenizer({ priority: 2 })
  const fallbackTokenizer = new ParagraphTokenizer({ priority: -1 })
  const { match } = mapBlockTokenizerToMatchFunc(
    fallbackTokenizer,
    tokenizer,
    listBulletItemTokenizer,
    listOrderedItemTokenizer,
    listTaskItemTokenizer)
  const { parse } = mapBlockTokenizerToParseFunc(
    fallbackTokenizer,
    [PhrasingContentDataNodeType],
    tokenizer,
    listBulletItemTokenizer,
    listOrderedItemTokenizer,
    listTaskItemTokenizer)

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

  describe('match test cases', async function () {
    matchTestCaseMaster.test()
  })

  describe('parse test cases', async function () {
    parseTestCaseMaster.test()
  })
})
