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


/**
 * typeof ParagraphDataNode
 */
export const ParagraphDataNodeType = 'PARAGRAPH'
export type ParagraphDataNodeType = typeof ParagraphDataNodeType


/**
 * 段落块
 * Paragraph represents a unit of discourse dealing with a particular point or idea.
 *
 * @example
 *    ````markdown
 *    Alpha bravo charlie.
 *    ````
 *    ==>
 *    ```js
 *    {
 *      type: 'PARAGRAPH',
 *      children: [{ type: 'TEXT', value: 'Alpha bravo charlie.' }]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#paragraph
 * @see https://github.github.com/gfm/#paragraphs
 */
export interface ParagraphDataNode extends
  BlockDataNode<ParagraphDataNodeType>,
  BlockTokenizerParsePhaseState<ParagraphDataNodeType> {
  /**
   * 段落内容
   * Contents of paragraph
   */
  children: [PhrasingContentDataNode]
}
