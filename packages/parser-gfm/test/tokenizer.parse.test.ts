import path from 'path'
import { it, before } from 'mocha'
import { TokenizerParseTestCaseMaster } from '@yozora/tokenizer-test-util'
import { gfmDataNodeParser } from '../src'


it('This is a required placeholder to allow before() to work', () => { })
before(async function test() {
  const caseRootDirectory = path.resolve(__dirname, 'cases/tokenizer')
  const parse = gfmDataNodeParser.parseInlineData.bind(gfmDataNodeParser)
  const caseMaster = new TokenizerParseTestCaseMaster(parse, { caseRootDirectory })
  await caseMaster.scan('inline/')
  describe('InlineDataNodeTokenizer.match test cases', async function () {
    caseMaster.test()
  })
})
