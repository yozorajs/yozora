import type {
  BlockTokenizerContextParsePhaseStateTree,
} from '@yozora/tokenizercore-block'
import type {
  InlineTokenizerParsePhaseStateTree,
} from '@yozora/tokenizercore-inline'
import path from 'path'
import {
  BlockTokenizerTester,
  InlineTokenizerTester,
} from '@yozora/jest-for-tokenizer'
import { LinkDefinitionTokenizer } from '@yozora/tokenizer-link-definition'
import { TextTokenizer } from '@yozora/tokenizer-text'
import { ReferenceLinkTokenizer } from '../src'


const caseRootDirectory = path.resolve(__dirname, 'cases')
const fallbackTokenizer = new TextTokenizer({ priority: -1 })
const tester = new InlineTokenizerTester({ caseRootDirectory, fallbackTokenizer })
tester.context
  .useTokenizer(new ReferenceLinkTokenizer({ priority: 1 }))


const realParse = tester.parse.bind(tester)
const parseMeta: ((content: string) => BlockTokenizerContextParsePhaseStateTree) = (() => {
  const linkDefinitionTester = new BlockTokenizerTester({ caseRootDirectory })
  linkDefinitionTester.context
    .useTokenizer(new LinkDefinitionTokenizer())
    .useTokenizer(BlockTokenizerTester.defaultInlineDataTokenizer())
  return (content: string) => linkDefinitionTester.parse(content)
})()
tester.parse = function (content: string): InlineTokenizerParsePhaseStateTree {
  const blockData = parseMeta(content)

  /**
   * Middle-Order-Traversal to collect text leaf nodes
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
  return realParse(text, meta)
}


tester
  .scan('gfm')
  .scan('*.json')
  .runAnswer()
