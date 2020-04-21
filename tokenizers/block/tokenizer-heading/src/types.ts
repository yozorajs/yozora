import { BlockDataNode, DataNodeParent } from '@yozora/tokenizer-core'


/**
 * typeof HeadingDataNode
 */
export const HeadingDataNodeType = 'HEADING'
export type HeadingDataNodeType = typeof HeadingDataNodeType


/**
 * data of HeadingDataNode
 */
export interface HeadingDataNodeData extends DataNodeParent {
  /**
   * 标题的级别
   * level of heading
   */
  depth: number
}


/**
 *
 * @example
 *    ````markdown
 *    # Alpha
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'HEADING',
 *      depth: 1,
 *      children: [{ type: 'TEXT', value: 'Alpha' }]
 *    }
 *    ```
 */
export type HeadingDataNode = BlockDataNode<HeadingDataNodeType, HeadingDataNodeData>
