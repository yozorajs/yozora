import {
  InlineDataNode,
  InlinePotentialToken,
  InlineTokenDelimiter,
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
 * Delimiter of LineBreakToken
 */
export interface LineBreakTokenDelimiter
  extends InlineTokenDelimiter<'both'> {

}


/**
 * Potential token of LineBreak
 */
export interface LineBreakPotentialToken
  extends InlinePotentialToken<LineBreakDataNodeType, LineBreakTokenDelimiter> {

}


/**
 * State of pre-match phase of LineBreakTokenizer
 */
export interface LineBreakPreMatchPhaseState
  extends InlineTokenizerPreMatchPhaseState<LineBreakDataNodeType> {

}


/**
 * State of match phase of LineBreakTokenizer
 */
export interface LineBreakMatchPhaseState
  extends InlineTokenizerMatchPhaseState<LineBreakDataNodeType> {

}
