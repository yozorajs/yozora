import { InlineDataNode } from '@yozora/tokenizercore'
import { BlockDataNode } from '@yozora/tokenizercore-block'


/**
 * typeof PhrasingContentDataNode
 */
export const PhrasingContentDataNodeType = 'PHRASING_CONTENT'
export type PhrasingContentDataNodeType = typeof PhrasingContentDataNodeType


/**
 * data of PhrasingContentDataNode
 */
export interface PhrasingContentDataNodeData {
  /**
   * Inline data nodes
   */
  contents: InlineDataNode[]
}


/**
 * Phrasing content represent the text in a document, and its markup.
 *
 * @see https://github.com/syntax-tree/mdast#phrasingcontent
 */
export type PhrasingContentDataNode = BlockDataNode<
  PhrasingContentDataNodeType, PhrasingContentDataNodeData>
