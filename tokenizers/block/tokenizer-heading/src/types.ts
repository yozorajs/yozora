import {
  BlockDataNode,
  BlockTokenizerParsePhaseState,
  PhrasingContentDataNode,
} from '@yozora/tokenizercore-block'


/**
 * typeof HeadingDataNode
 */
export const HeadingDataNodeType = 'HEADING'
export type HeadingDataNodeType = typeof HeadingDataNodeType


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
export interface HeadingDataNode extends
  BlockDataNode<HeadingDataNodeType>,
  BlockTokenizerParsePhaseState<HeadingDataNodeType> {
  /**
   * 标题的级别
   * level of heading
   */
  depth: number
  /**
   * 标题内容
   * Contents of heading
   */
  children: [PhrasingContentDataNode]
}
