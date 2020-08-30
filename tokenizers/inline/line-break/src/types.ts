import {
  InlineDataNode,
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
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
 *    ```json
 *    [
 *      {
 *        "type": "TEXT",
 *        "value": "foo"
 *      },
 *      {
 *        "type": "LINE_BREAK"
 *      },
 *      {
 *        "type": "TEXT",
 *        "value": "bar"
 *      }
 *    ]
 *    ```
 * @see https://github.com/syntax-tree/mdast#linebreak
 */
export interface LineBreakDataNode extends
  InlineDataNode<LineBreakDataNodeType>,
  InlineTokenizerParsePhaseState<LineBreakDataNodeType> {
}


/**
 * Delimiter type of LineBreakTokenDelimiterType
 */
export enum LineBreakTokenDelimiterType {
  /**
   * Backslash at the end of the line
   */
  BACKSLASH = 'backslash',
  /**
   * More than two spaces at the end of the line
   */
  MORE_THAN_TWO_SPACES = 'more-than-two-spaces',
}


/**
 * Delimiter of LineBreakToken
 */
export interface LineBreakTokenDelimiter
  extends InlineTokenDelimiter<LineBreakTokenDelimiterType> {

}


/**
 * Potential token of LineBreak
 */
export interface LineBreakPotentialToken
  extends InlinePotentialToken<LineBreakDataNodeType, LineBreakTokenDelimiter> {

}


/**
 * State of match phase of LineBreakTokenizer
 */
export interface LineBreakMatchPhaseState
  extends InlineTokenizerMatchPhaseState<LineBreakDataNodeType> {

}
