import path from 'path'
import {
  TokenizerMatchTestCaseMaster,
  TokenizerParseTestCaseMaster,
  mapBlockTokenizerToMatchFunc,
  mapBlockTokenizerToParseFunc,
} from '@yozora/mocha-for-tokenizer'
import { TextTokenizer } from '@yozora/tokenizer-text'
import { DefaultInlineDataNodeTokenizerContext } from '@yozora/tokenizer-core'
import { ParagraphTokenizer } from '../src'


/**
 * create answer (to be checked)
 */
async function answer() {
  const tokenizer = new ParagraphTokenizer({ priority: 1 })
  const inlineContext = new DefaultInlineDataNodeTokenizerContext(TextTokenizer)
  const match = mapBlockTokenizerToMatchFunc(tokenizer, undefined, inlineContext)
  const parse = mapBlockTokenizerToParseFunc(tokenizer, undefined, inlineContext)

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
