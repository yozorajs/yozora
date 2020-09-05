import {
  BlockDataNode,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPreMatchPhaseState,
  PhrasingContentDataNode,
  PhrasingContentLine,
  PhrasingContentMatchPhaseState,
} from '@yozora/tokenizercore-block'


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


/**
 * State of pre-match phase of ParagraphTokenizer
 */
export interface ParagraphPreMatchPhaseState
  extends BlockTokenizerPreMatchPhaseState<ParagraphDataNodeType> {
  /**
   * paragraph 中的文本内容
   */
  lines: PhrasingContentLine[]
}


/**
 * State of match phase of ParagraphTokenizer
 */
export interface ParagraphMatchPhaseState
  extends BlockTokenizerMatchPhaseState<ParagraphDataNodeType> {
  /**
   * Paragraph 的子节点为 PhrasingContent
   */
  children: [PhrasingContentMatchPhaseState]
}
