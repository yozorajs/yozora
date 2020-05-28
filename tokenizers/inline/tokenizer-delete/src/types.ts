import { InlineDataNode } from '@yozora/tokenizercore'
import {
  InlineTokenDelimiterItem,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  InlineTokenizerPreMatchPhaseState,
} from '@yozora/tokenizercore-inline'


/**
 * typeof DeleteDataNode
 */
export const DeleteDataNodeType = 'DELETE'
export type DeleteDataNodeType = typeof DeleteDataNodeType


/**
 * 删除线
 * Delete represents contents that are no longer accurate or no longer relevant.
 *
 * @example
 *    ````markdown
 *    ~~alpha~~
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'DELETE',
 *      children: [{ type: 'TEXT', value: 'alpha' }]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#delete
 */
export interface DeleteDataNode extends
  InlineDataNode<DeleteDataNodeType>,
  InlineTokenizerParsePhaseState<DeleteDataNodeType> {
  /**
   *
   */
  children: InlineTokenizerParsePhaseState[]
}


/**
 * State of pre-match phase of DeleteTokenizer
 */
export interface DeletePreMatchPhaseState
  extends InlineTokenizerPreMatchPhaseState<DeleteDataNodeType> {
  /**
   *
   */
  startIndex: number
  /**
   *
   */
  endIndex: number
  /**
   *
   */
  leftDelimiter: InlineTokenDelimiterItem
  /**
   *
   */
  rightDelimiter: InlineTokenDelimiterItem
}


/**
 * State of match phase of DeleteTokenizer
 */
export interface DeleteMatchPhaseState
  extends InlineTokenizerMatchPhaseState<DeleteDataNodeType> {
  /**
   * 起始下标
   */
  startIndex: number
  /**
   * 结束下标
   */
  endIndex: number
  /**
   *
   */
  leftDelimiter: InlineTokenDelimiterItem
  /**
   *
   */
  rightDelimiter: InlineTokenDelimiterItem
}
