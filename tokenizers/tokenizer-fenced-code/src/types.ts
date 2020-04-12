import { BlockDataNode } from '@yozora/tokenizer-core'


/**
 * typeof FencedCodeDataNode
 */
export const FencedCodeDataNodeType = 'FENCED_CODE'
export type FencedCodeDataNodeType = typeof FencedCodeDataNodeType


/**
 * data of FencedCodeDataNode
 */
export interface FencedCodeDataNodeData {

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
export type FencedCodeDataNode = BlockDataNode<FencedCodeDataNodeType, FencedCodeDataNodeData>
