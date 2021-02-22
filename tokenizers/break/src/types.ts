import type {
  YastNode,
  YastToken,
  YastTokenDelimiter,
} from '@yozora/tokenizercore'


/**
 * typeof Break
 */
export const BreakType = 'break'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type BreakType = typeof BreakType


/**
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
 *        "type": "break"
 *      },
 *      {
 *        "type": "text",
 *        "value": "bar"
 *      }
 *    ]
 *    ```
 * @see https://github.com/syntax-tree/mdast#break
 * @see https://github.github.com/gfm/#hard-line-breaks
 * @see https://github.github.com/gfm/#soft-line-breaks
 */
export interface Break extends YastNode<BreakType> { }


/**
 * Line break marker type.
 */
export enum BreakTokenMarkerType {
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
 * A break token.
 */
export interface BreakToken extends YastToken<BreakType> { }


/**
 * Delimiter of BreakToken.
 */
export interface BreakTokenDelimiter extends YastTokenDelimiter {
  /**
   * Line break marker type.
   */
  markerType: BreakTokenMarkerType
}
