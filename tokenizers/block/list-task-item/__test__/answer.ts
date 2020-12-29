import path from 'path'
import {
  TokenizerMatchUseCaseMaster,
  TokenizerParseUseCaseMaster,
  mapBlockTokenizerToMatchFunc,
  mapBlockTokenizerToParseFunc,
} from '@yozora/jest-for-tokenizer'
import { ListBulletItemTokenizer } from '@yozora/tokenizer-list-bullet-item'
import { ListOrderedItemTokenizer } from '@yozora/tokenizer-list-ordered-item'
import { ParagraphTokenizer } from '@yozora/tokenizer-paragraph'
import { PhrasingContentDataNodeType } from '@yozora/tokenizercore-block'
import { ListTaskItemTokenizer } from '../src'


/**
 * create answer (to be checked)
 */
async function answer() {
  const tokenizer = new ListTaskItemTokenizer({ priority: 1 })
  const listBulletItemTokenizer = new ListBulletItemTokenizer({ priority: 2 })
  const listOrderedItemTokenizer = new ListOrderedItemTokenizer({ priority: 2 })
  const fallbackTokenizer = new ParagraphTokenizer({ priority: -1 })
  const { match } = mapBlockTokenizerToMatchFunc(
    fallbackTokenizer,
    tokenizer,
    listBulletItemTokenizer,
    listOrderedItemTokenizer)
  const { parse } = mapBlockTokenizerToParseFunc(
    fallbackTokenizer,
    [PhrasingContentDataNodeType],
    tokenizer,
    listBulletItemTokenizer,
    listOrderedItemTokenizer)

  const caseRootDirectory = path.resolve(__dirname)
  const matchUseCaseMaster = new TokenizerMatchUseCaseMaster(match, caseRootDirectory)
  const parseUseCaseMaster = new TokenizerParseUseCaseMaster(parse, caseRootDirectory)

  const caseDirs: string[] = ['cases']
  for (const caseDir of caseDirs) {
    matchUseCaseMaster.scan(caseDir)
    parseUseCaseMaster.scan(caseDir)
  }

  await parseUseCaseMaster.answerCaseTree()
  await matchUseCaseMaster.answerCaseTree()
}


answer()
