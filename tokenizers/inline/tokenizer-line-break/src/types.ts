import {
  InlineDataNode,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  InlineTokenizerPreMatchPhaseState,
} from '@yozora/tokenizercore-inline'


/**
 * typeof LineBreakDataNode
 */
export const LineBreakDataNodeType = 'LINE_BREAK'
export type LineBreakDataNodeType = typeof LineBreakDataNodeType


/**
 * 换行
 * Break represents a line break, such as in poems or addresses.
 *
 * @example
 *    ````markdown
 *    foo··
 *    bar
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'paragraph',
 *      children: [
 *        { type: 'LINEBREAK', value: 'foo' },
 *        { type: 'LINE_BREAK' },
 *        { type: 'LINEBREAK', value: 'bar' }
 *      ]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#linebreak
 */
export interface LineBreakDataNode extends
  InlineDataNode<LineBreakDataNodeType>,
  InlineTokenizerParsePhaseState<LineBreakDataNodeType> {
}


/**
 * State of pre-match phase of LineBreakTokenizer
 */
export interface LineBreakPreMatchPhaseState
  extends InlineTokenizerPreMatchPhaseState<LineBreakDataNodeType> {
  /**
   * 起始下标
   */
  startIndex: number
  /**
   * 结束下标
   */
  endIndex: number
}


/**
 * State of match phase of LineBreakTokenizer
 */
export interface LineBreakMatchPhaseState
  extends InlineTokenizerMatchPhaseState<LineBreakDataNodeType> {
  /**
   * 起始下标
   */
  startIndex: number
  /**
   * 结束下标
   */
  endIndex: number
}
