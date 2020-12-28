import path from 'path'
import {
  TokenizerMatchUseCaseMaster,
  TokenizerParseUseCaseMaster,
  mapInlineTokenizerToMatchFunc,
  mapInlineTokenizerToParseFunc,
} from '@yozora/jest-for-tokenizer'
import { TextTokenizer } from '@yozora/tokenizer-text'
import { DeleteTokenizer } from '../src'


const tokenizer = new DeleteTokenizer({ priority: 1 })
const fallbackTokenizer = new TextTokenizer({ priority: -1 })
const { match } = mapInlineTokenizerToMatchFunc(fallbackTokenizer, tokenizer)
const { parse } = mapInlineTokenizerToParseFunc(fallbackTokenizer, tokenizer)

const caseRootDirectory = path.resolve(__dirname)
const matchUseCaseMaster = new TokenizerMatchUseCaseMaster(match, caseRootDirectory)
const parseUseCaseMaster = new TokenizerParseUseCaseMaster(parse, caseRootDirectory)

const caseDirs: string[] = ['cases']
for (const caseDir of caseDirs) {
  matchUseCaseMaster.scan(caseDir)
  parseUseCaseMaster.scan(caseDir)
}


describe('match test cases', function () {
  matchUseCaseMaster.runCaseTree()
})

describe('parse test cases', function () {
  parseUseCaseMaster.runCaseTree()
})
