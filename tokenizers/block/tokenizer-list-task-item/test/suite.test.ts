import path from 'path'
import { before, describe, it } from 'mocha'
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


it('This is a required placeholder to allow before() to work', () => { })
before(async function test() {
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

  describe('match test cases', async function () {
    matchTestCaseMaster.test()
  })

  describe('parse test cases', async function () {
    parseTestCaseMaster.test()
  })
})