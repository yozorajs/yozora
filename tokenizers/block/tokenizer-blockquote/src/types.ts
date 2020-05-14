import {
  BlockDataNode,
  BlockTokenizerParsePhaseState,
} from '@yozora/tokenizercore-block'


/**
 * typeof BlockquoteDataNode
 */
export const BlockquoteDataNodeType = 'BLOCKQUOTE'
export type BlockquoteDataNodeType = typeof BlockquoteDataNodeType


/**
 * 引用块
 * Blockquote (Parent) represents a section quoted from somewhere else.
 *
 * @example
 *    ````markdown
 *    > Alpha bravo charlie.
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'BLOCKQUOTE',
 *      children: [{
 *        type: 'PARAGRAPH',
 *        children: [{ type: 'TEXT', value: 'Alpha bravo charlie.' }]
 *      }]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#blockquote
 * @see https://github.github.com/gfm/#block-quotes
 */
export interface BlockquoteDataNode extends
  BlockDataNode<BlockquoteDataNodeType>,
  BlockTokenizerParsePhaseState<BlockquoteDataNodeType> {
  /**
   * Blockquote is a container block
   */
  children: BlockTokenizerParsePhaseState[]
}
