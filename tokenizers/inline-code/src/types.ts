import type {
  YastLiteral,
  YastNode,
  YastToken,
  YastTokenDelimiter,
} from '@yozora/tokenizercore'


/**
 * typeof InlineCode
 */
export const InlineCodeType = 'inlineCode'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type InlineCodeType = typeof InlineCodeType


/**
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
