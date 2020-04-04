import path from 'path'
import { it, describe, before } from 'mocha'
import { TokenizerMatchTestCaseMaster } from '@yozora/mocha-for-tokenizer'
import { gfmDataNodeParser } from '../src'


it('This is a required placeholder to allow before() to work', () => { })
before(async function test() {
  const caseRootDirectory = path.resolve(__dirname, 'cases')
  const match = gfmDataNodeParser.matchInlineData.bind(gfmDataNodeParser)
  const caseMaster = new TokenizerMatchTestCaseMaster(match, { caseRootDirectory })
  await caseMaster.scan('inline/')
  describe('InlineDataNodeTokenizer.match test cases', async function () {
    caseMaster.test()
  })
})
