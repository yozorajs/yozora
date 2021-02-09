import type { YastLiteral, YastNode } from '@yozora/tokenizercore'
import type {
  YastToken,
  YastTokenDelimiter,
} from '@yozora/tokenizercore-inline'


/**
 * typeof InlineCode
 */
export const InlineCodeType = 'inlineCode'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type InlineCodeType = typeof InlineCodeType


/**
 * 行内代码
 *
 * @example
 *    ````markdown
 *    `alpha` `\`beta\``
 *    ````
 *    ===>
 *    ```json
 *    [
 *      {
 *        "type": "inlineCode",
 *        "value": "alpha"
 *      },
 *      {
 *        "type": "text",
 *        "value": " "
 *      },
 *      {
 *        "type": "inlineCode",
 *        "value": "`beta`"
 *      }
 *    ]
 *    ```
 * @see https://github.com/syntax-tree/mdast#inline-code
 * @see https://github.github.com/gfm/#code-span
 */
export interface InlineCode extends YastNode<InlineCodeType>, YastLiteral { }


/**
 * An inlineCode token.
 */
export interface InlineCodeToken extends YastToken<InlineCodeType> {
  /**
   * Thickness of the InlineCodeDelimiter.
   */
  thickness: number
}


/**
 * Delimiter of InlineCodeToken.
 */
export interface InlineCodeTokenDelimiter extends YastTokenDelimiter {
  type: 'full'
  /**
   * Thickness of the InlineCodeDelimiter.
   */
  thickness: number
}
