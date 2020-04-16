import { BlockDataNode, DataNodeParent } from '@yozora/tokenizer-core'


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
 */
export type BlockquoteDataNode = BlockDataNode<BlockquoteDataNodeType, BlockquoteDataNodeData>
