import path from 'path'
import {
  TokenizerMatchUseCaseMaster,
  TokenizerParseUseCaseMaster,
  mapInlineTokenizerToMatchFunc,
  mapInlineTokenizerToParseFunc,
} from '@yozora/jest-for-tokenizer'
import { TextTokenizer } from '../src'


const tokenizer = new TextTokenizer({ priority: 1 })
const { match } = mapInlineTokenizerToMatchFunc(null, tokenizer)
const { parse } = mapInlineTokenizerToParseFunc(null, tokenizer)

const caseRootDirectory = path.resolve(__dirname)
const matchTestCaseMaster = new TokenizerMatchUseCaseMaster(match, caseRootDirectory)
const parseTestCaseMaster = new TokenizerParseUseCaseMaster(parse, caseRootDirectory)

const caseDirs: string[] = ['cases']
for (const caseDir of caseDirs) {
  matchTestCaseMaster.scan(caseDir)
  parseTestCaseMaster.scan(caseDir)
}


describe('match test cases', function () {
  matchTestCaseMaster.runCaseTree()
})


describe('parse test cases', function () {
  parseTestCaseMaster.runCaseTree()
})
