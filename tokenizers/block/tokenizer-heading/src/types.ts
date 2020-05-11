import { BlockDataNode } from '@yozora/block-tokenizer-core'
import { DataNodeParent } from '@yozora/tokenizercore'


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
 * 标题
 * Heading represents a heading of a section.
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
 * @see https://github.com/syntax-tree/mdast#heading
 * @see https://github.github.com/gfm/#atx-heading
 */
export type HeadingDataNode = BlockDataNode<HeadingDataNodeType, HeadingDataNodeData>
