import { InlineDataNode } from '@yozora/tokenizercore'
import {
  BlockDataNode,
  BlockTokenizerParsePhaseState,
} from '@yozora/tokenizercore-block'


/**
 * typeof PhrasingContentDataNode
 */
export const PhrasingContentDataNodeType = 'PHRASING_CONTENT'
export type PhrasingContentDataNodeType = typeof PhrasingContentDataNodeType


/**
 * Phrasing content represent the text in a document, and its markup.
 *
 * @see https://github.com/syntax-tree/mdast#phrasingcontent
 */
export interface PhrasingContentDataNode extends
  BlockDataNode<PhrasingContentDataNodeType>,
  BlockTokenizerParsePhaseState<PhrasingContentDataNodeType> {
  /**
   * Inline data nodes
   */
  contents: InlineDataNode[]
}
