import type { YastNode } from '@yozora/tokenizercore'
import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
} from '@yozora/tokenizercore-inline'


/**
 * typeof LineBreak
 */
export const LineBreakType = 'lineBreak'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type LineBreakType = typeof LineBreakType


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
 *        "type": "text",
 *        "value": "foo"
 *      },
 *      {
 *        "type": "lineBreak"
 *      },
 *      {
 *        "type": "text",
 *        "value": "bar"
 *      }
 *    ]
 *    ```
 * @see https://github.com/syntax-tree/mdast#linebreak
 */
export interface LineBreak
  extends YastNode<LineBreakType> { }


/**
 * Line break marker  type.
 */
export enum LineBreakTokenMarkerType {
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
 * State on match phase of LineBreakTokenizer
 */
export interface LineBreakMatchPhaseState
  extends InlineTokenizerMatchPhaseState<LineBreakType> {}


/**
 * Delimiter of LineBreakToken
 */
export interface LineBreakTokenDelimiter
  extends InlineTokenDelimiter {
  /**
   * Line break marker type.
   */
  markerType: LineBreakTokenMarkerType
}
