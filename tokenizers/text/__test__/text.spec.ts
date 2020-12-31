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
const matchUseCaseMaster = new TokenizerMatchUseCaseMaster(match, caseRootDirectory)
const parseUseCaseMaster = new TokenizerParseUseCaseMaster(parse, caseRootDirectory)

const caseDirs: string[] = ['cases']
for (const caseDir of caseDirs) {
  matchUseCaseMaster.scan(caseDir)
  parseUseCaseMaster.scan(caseDir)
}


describe('match', function () {
  matchUseCaseMaster.runCaseTree()
})


describe('parse ', function () {
  parseUseCaseMaster.runCaseTree()
})
