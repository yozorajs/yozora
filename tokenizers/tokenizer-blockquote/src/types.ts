import { BlockDataNode } from '@yozora/tokenizer-core'


/**
 * typeof BlockquoteDataNode
 */
export const BlockquoteDataNodeType = 'BLOCKQUOTE'
export type BlockquoteDataNodeType = typeof BlockquoteDataNodeType


/**
 * data of BlockquoteDataNode
 */
export interface BlockquoteDataNodeData {

}


/**
 *
 * @example
 *    ````markdown
 *    ````
 *    ===>
 *    ```js
 *    ```
 */
export type BlockquoteDataNode = BlockDataNode<BlockquoteDataNodeType, BlockquoteDataNodeData>
