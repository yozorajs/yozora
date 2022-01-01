import type { IYastLiteral } from '../ast'

export const InlineCodeType = 'inlineCode'
export type InlineCodeType = typeof InlineCodeType

/**
 * InlineCode represents a fragment of computer code, such as a file name,
 * computer program, or anything a computer could parse.
 * @see https://github.com/syntax-tree/mdast#inline-code
 * @see https://github.github.com/gfm/#code-span
 */
export type IInlineCode = IYastLiteral<InlineCodeType>

/**
 * Example:
 *
 *    ````markdown
 *    `alpha` `\`beta\``
 *    ````
 *
 * Yields:
 *
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
 */
