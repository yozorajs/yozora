import { before, describe, it } from 'mocha'
import path from 'path'
import {
  TokenizerMatchTestCaseMaster,
  TokenizerParseTestCaseMaster,
} from '@yozora/mocha-test-tokenizer'
import { gfmDataNodeParser } from '../src'


it('This is a required placeholder to allow before() to work', () => { })
before(async function test() {
  const match = gfmDataNodeParser.matchInlineData.bind(gfmDataNodeParser)
  const parse = gfmDataNodeParser.parseInlineData.bind(gfmDataNodeParser)

  const caseRootDirectory = path.resolve(__dirname, 'cases')
  const matchTestCaseMaster = new TokenizerMatchTestCaseMaster(match, { caseRootDirectory })
  const parseTestCaseMaster = new TokenizerParseTestCaseMaster(parse, { caseRootDirectory })

  const caseDirs: string[] = ['inline/']
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
