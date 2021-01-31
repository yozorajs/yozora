import type { YastMeta, YastRoot } from '@yozora/tokenizercore'
import path from 'path'
import {
  BlockTokenizerTester,
  InlineTokenizerTester,
} from '@yozora/jest-for-tokenizer'
import { LinkDefinitionTokenizer } from '@yozora/tokenizer-link-definition'
import { TextTokenizer } from '@yozora/tokenizer-text'
import { PhrasingContentType } from '@yozora/tokenizercore-block'
import { ReferenceLinkTokenizer, ReferenceLinkType } from '../src'


const caseRootDirectory = path.resolve(__dirname, 'cases')
const fallbackTokenizer = new TextTokenizer()
const tester = new InlineTokenizerTester({
  linkTypes: [ReferenceLinkType],
  caseRootDirectory,
  fallbackTokenizer,
})
tester.context
  .useTokenizer(new ReferenceLinkTokenizer())


const realParse = tester.parse.bind(tester)
const parseMeta: ((content: string) => YastRoot) = (() => {
  const linkDefinitionTester = new BlockTokenizerTester({ caseRootDirectory })
  linkDefinitionTester.context
    .useTokenizer(new LinkDefinitionTokenizer())
  return (content: string) => linkDefinitionTester.parse(content)
})()

tester.parse = function (content: string): YastRoot {
  const blockData = parseMeta(content)

  // Middle-Order-Traversal to collect text leaf nodes
  const collectText = (o: any): string => {
    if (o.type === PhrasingContentType) return o.contents
    if (o.children != null && o.children.length > 0) {
      return o.children.map(collectText).join('')
    }
    return ''
  }

  const text = collectText(blockData)
  const meta = blockData.meta
  return realParse(text, meta as YastMeta)
}


tester
  .scan('gfm')
  .scan('*.json')
  .runTest()
