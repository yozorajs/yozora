import { before, describe, it } from 'mocha'
import path from 'path'
import { TokenizerParseTestCaseMaster } from '@yozora/mocha-test-tokenizer'
import { gfmDataNodeParser } from '../src'


it('This is a required placeholder to allow before() to work', () => { })
before(async function test() {
  const parse = gfmDataNodeParser.parse.bind(gfmDataNodeParser)

  const caseRootDirectory = path.resolve(__dirname)
  const parseTestCaseMaster = new TokenizerParseTestCaseMaster(parse, { caseRootDirectory })

  const caseDirs: string[] = ['cases/']
  const tasks: Promise<any>[] = []
  for (const caseDir of caseDirs) {
    tasks.push(parseTestCaseMaster.scan(caseDir))
  }
  await Promise.all(tasks)

  describe('parse test cases', async function () {
    parseTestCaseMaster.test()
  })
})
