import path from 'path'
import {
  TokenizerMatchTestCaseMaster,
  TokenizerParseTestCaseMaster,
  mapBlockTokenizerToMatchFunc,
  mapBlockTokenizerToParseFunc,
} from '@yozora/mocha-test-tokenizer'
import { ParagraphTokenizer } from '../src'


/**
 * create answer (to be checked)
 */
async function answer() {
  const caseRootDirectory = path.resolve(__dirname)
  const caseDirs: string[] = ['cases']

  // answer match
  const doMatchTask = async function () {
    const match = mapBlockTokenizerToMatchFunc(undefined, ParagraphTokenizer)
    const matchTestCaseMaster = new TokenizerMatchTestCaseMaster(match, { caseRootDirectory })
    const tasks: Promise<any>[] = []
    for (const caseDir of caseDirs) {
      tasks.push(matchTestCaseMaster.scan(caseDir))
    }
    await Promise.all(tasks)
    await matchTestCaseMaster.answer()
  }

  // answer parse
  const doParseTask = async function () {
    const parse = mapBlockTokenizerToParseFunc(undefined, ParagraphTokenizer)
    const parseTestCaseMaster = new TokenizerParseTestCaseMaster(parse, { caseRootDirectory })
    const tasks: Promise<any>[] = []
    for (const caseDir of caseDirs) {
      tasks.push(parseTestCaseMaster.scan(caseDir))
    }
    await Promise.all(tasks)
    await parseTestCaseMaster.answer()
  }

  await doParseTask()
  await doMatchTask()
}


answer()
