import type { YastLiteral } from '@yozora/ast'
import type { YastToken, YastTokenDelimiter } from '@yozora/core-tokenizer'

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
export type InlineCode = YastLiteral<InlineCodeType>

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
