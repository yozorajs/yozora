import path from 'path'
import { it, before } from 'mocha'
import { TokenizerMatchTestCaseMaster } from './util/tokenizer-match-util'


it('This is a required placeholder to allow before() to work', () => { })
before(async function test() {
  const caseRootDirectory = path.resolve(__dirname, 'cases/tokenizer')
  const caseMaster = new TokenizerMatchTestCaseMaster({ caseRootDirectory })
  await caseMaster.scan('inline/')
  describe('InlineDataNodeTokenizer.match test cases', async function () {
    caseMaster.test()
  })
})
