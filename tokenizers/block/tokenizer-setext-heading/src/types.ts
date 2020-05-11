import { BlockDataNode } from '@yozora/block-tokenizer-core'
import { DataNodeParent } from '@yozora/tokenizercore'


/**
 * typeof SetextHeadingDataNode
 */
export const SetextHeadingDataNodeType = 'SETEXT_HEADING'
export type SetextHeadingDataNodeType = typeof SetextHeadingDataNodeType


/**
 * data of SetextHeadingDataNode
 */
export interface SetextHeadingDataNodeData extends DataNodeParent {
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
 *    Foo
 *    Bar
 *    ---
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'SETEXT_HEADING',
 *      depth: 2,
 *      children: [{ type: 'TEXT', value: 'Foo\nBar' }]
 *    }
 *    ```
 * @see https://github.github.com/gfm/#setext-heading
 */
export type SetextHeadingDataNode = BlockDataNode<SetextHeadingDataNodeType, SetextHeadingDataNodeData>
