import path from 'path'
import { TokenizerParseUseCaseMaster } from '@yozora/jest-for-tokenizer'
import { gfmDataNodeParser } from '../src'


const parse = gfmDataNodeParser.parse.bind(gfmDataNodeParser)

const caseRootDirectory = path.resolve(__dirname)
const parseUseCaseMaster = new TokenizerParseUseCaseMaster(parse, caseRootDirectory)

const caseDirs: string[] = ['cases/']
for (const caseDir of caseDirs) {
  parseUseCaseMaster.scan(caseDir)
}


describe('parse test cases', function () {
  parseUseCaseMaster.runCaseTree()
})
