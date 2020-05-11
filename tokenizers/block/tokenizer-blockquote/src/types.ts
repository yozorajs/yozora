import { BlockDataNode } from '@yozora/block-tokenizer-core'
import { DataNodeParent } from '@yozora/tokenizercore'


/**
 * typeof BlockquoteDataNode
 */
export const BlockquoteDataNodeType = 'BLOCKQUOTE'
export type BlockquoteDataNodeType = typeof BlockquoteDataNodeType


/**
 * data of BlockquoteDataNode
 */
export interface BlockquoteDataNodeData extends DataNodeParent {

}


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
export type BlockquoteDataNode = BlockDataNode<BlockquoteDataNodeType, BlockquoteDataNodeData>
