import path from 'path'
import {
  TokenizerMatchUseCaseMaster,
  TokenizerParseUseCaseMaster,
  mapBlockTokenizerToParseFunc,
  mapInlineTokenizerToMatchFunc,
  mapInlineTokenizerToParseFunc,
} from '@yozora/jest-for-tokenizer'
import { LinkDefinitionTokenizer } from '@yozora/tokenizer-link-definition'
import { ParagraphTokenizer } from '@yozora/tokenizer-paragraph'
import { TextTokenizer } from '@yozora/tokenizer-text'
import { PhrasingContentDataNodeType } from '@yozora/tokenizercore-block'
import { ReferenceLinkTokenizer } from '../src'


/**
 * create answer (to be checked)
 */
async function answer() {
  const parseMeta = (() => {
    const tokenizer = new LinkDefinitionTokenizer({ priority: 1 })
    const fallbackTokenizer = new ParagraphTokenizer({ priority: -1 })
    const { parse } = mapBlockTokenizerToParseFunc(
      fallbackTokenizer,
      [PhrasingContentDataNodeType],
      tokenizer)
    return parse
  })()
  const wrapFunc = (handle: (content: string, meta?: any) => any) => {
    return (content: string): any => {
      const blockData = parseMeta(content) as any

      /**
       * Middle order traversal collects text leaf nodes
       */
      const collectText = (o: any) => {
        if (o.children != null && Array.isArray(o.children)) {
          return o.children.map(collectText).join('')
        }
        if (o.contents != null && Array.isArray(o.contents)) {
          return o.contents.map(collectText).join('')
        }
        if (o.type === 'TEXT' && o.content != null) {
          return o.content
        }
        return ''
      }

      const text = collectText(blockData)
      const meta = blockData.meta
      return handle(text, meta)
    }
  }

  const tokenizer = new ReferenceLinkTokenizer({ priority: 1 })
  const fallbackTokenizer = new TextTokenizer({ priority: -1 })
  const { match: rawMatch } = mapInlineTokenizerToMatchFunc(fallbackTokenizer, tokenizer)
  const { parse: rawParse } = mapInlineTokenizerToParseFunc(fallbackTokenizer, tokenizer)
  const match = wrapFunc(rawMatch)
  const parse = wrapFunc(rawParse)

  const caseRootDirectory = path.resolve(__dirname)
  const matchUseCaseMaster = new TokenizerMatchUseCaseMaster(match, caseRootDirectory)
  const parseUseCaseMaster = new TokenizerParseUseCaseMaster(parse, caseRootDirectory)

  const caseDirs: string[] = ['cases']
  for (const caseDir of caseDirs) {
    matchUseCaseMaster.scan(caseDir)
    parseUseCaseMaster.scan(caseDir)
  }

  await parseUseCaseMaster.answerCaseTree()
  await matchUseCaseMaster.answerCaseTree()
}


answer()