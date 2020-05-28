import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import {
  InlineDataNode,
  InlineTokenDelimiterItem,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  InlineTokenizerPreMatchPhaseState,
} from '@yozora/tokenizercore-inline'


/**
 * typeof InlineCodeDataNode
 */
export const InlineCodeDataNodeType = 'INLINE_CODE'
export type InlineCodeDataNodeType = typeof InlineCodeDataNodeType


/**
 * 行内代码
 *
 * @example
 *    ````markdown
 *    `alpha` `\`beta\``
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'paragraph',
 *      children: [
 *        { type: 'INLINE_CODE', value: 'alpha' }
 *        { type: 'TEXT', value: ' ' },
 *        { type: 'INLINE_CODE', value: '`beta`' }
 *      ]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#inline-code
 * @see https://github.github.com/gfm/#code-span
 */
export interface InlineCodeDataNode extends
  InlineDataNode<InlineCodeDataNodeType>,
  InlineTokenizerParsePhaseState<InlineCodeDataNodeType> {
  /**
   * 代码内容
   */
  value: string
}


/**
 * State of pre-match phase of InlineCodeTokenizer
 */
export interface InlineCodePreMatchPhaseState
  extends InlineTokenizerPreMatchPhaseState<InlineCodeDataNodeType> {
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
 * State of match phase of InlineCodeTokenizer
 */
export interface InlineCodeMatchPhaseState
  extends InlineTokenizerMatchPhaseState<InlineCodeDataNodeType> {
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
  /**
   * Contents of InlineCode
   */
  contents: {
    /**
     *
     */
    startIndex: number
    /**
     *
     */
    endIndex: number
  }
}
