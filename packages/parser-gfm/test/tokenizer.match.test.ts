import path from 'path'
import { it, before } from 'mocha'
import { TokenizerMatchTestCaseMaster } from '@yozora/tokenizer-test-util'
import { gfmDataNodeParser } from '../src'


it('This is a required placeholder to allow before() to work', () => { })
before(async function test() {
  const caseRootDirectory = path.resolve(__dirname, 'cases/tokenizer')
  const match = gfmDataNodeParser.matchInlineData.bind(gfmDataNodeParser)
  const caseMaster = new TokenizerMatchTestCaseMaster(match, { caseRootDirectory })
  await caseMaster.scan('inline/')
  describe('InlineDataNodeTokenizer.match test cases', async function () {
    caseMaster.test()
  })
})
